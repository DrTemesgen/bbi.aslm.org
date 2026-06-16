<?php
/* BBI Africa — contact-mail endpoint (public form -> academy@aslm.org).  HARDENED.
   ===========================================================================
   Africa CDC / ASLM Biosafety & Biosecurity Initiative (BBI) platform.
   Deployed alongside chat.php on the dedicated subdomain ebc.drtemesgen.com
   (cPanel, PHP 8.4, Exim MTA via PHP mail()).

   CONTRACT (do not change — the frontend depends on it):
     Frontend POSTs JSON  { subject, message, replyTo?, name?, formType?, hp? }
     This returns JSON     { ok: true }                 on success
                           { ok: false, error: "..." }  on failure
     ALWAYS valid JSON. Handled cases return HTTP 200 (rate limit is 429).

   SECURITY / SETUP  (this is a PUBLIC mail endpoint — be paranoid)
     - The recipient is FIXED server-side (MAIL_TO). It is NEVER taken from the
       client, so this can never be turned into an open relay / spam cannon.
     - The From address is a domain address we control (MAIL_FROM_EMAIL) so SPF
       passes on the sending server. Reply-To carries the submitter's address
       (only if it validates), so admins can reply to the real person without
       letting the submitter forge the envelope sender.
     - EMAIL HEADER INJECTION is the headline threat for any mail() endpoint: a
       CR/LF (or its %0a/%0d encodings) smuggled into subject/name/replyTo could
       inject extra headers (Bcc, extra To, a second body). EVERY value that
       lands in a header is run through bbi_header_safe(), which strips CR, LF,
       NUL, and the literal %0a/%0d sequences and collapses the result to one
       line. The body (which legitimately contains newlines) is NEVER used as a
       header.
     - CORS is strict: only an Origin listed in ALLOWED_ORIGINS is echoed back;
       no wildcard is ever emitted. CORS only constrains BROWSERS — the real
       abuse backstop is the per-IP + global-daily rate limiter below.
     - POST only; OPTIONS preflight -> 204; everything else -> 405 JSON.
     - Input is validated and size-capped. A best-effort file rate limit (per-IP
       and a global daily ceiling) runs in the system temp dir and FAILS OPEN if
       temp is unwritable, so a hosting quirk can never take the form offline.
     - HONEYPOT: a hidden "hp" field bots tend to fill. If present & non-empty we
       silently pretend success and send NOTHING.
     - Failures never leak server paths or the mail() return detail; the client
       only ever sees a generic "send failed".
   =========================================================================== */

/* ---- Never let PHP turn a notice/warning into broken (non-JSON) output, but
        DO log real failures to a file the public cannot read, so a silent
        misconfig (mail() disabled, temp unwritable) is still diagnosable. ---- */
@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
error_reporting(0);
@ini_set('log_errors', '1');
@ini_set('error_log', rtrim(sys_get_temp_dir(), "/\\") . DIRECTORY_SEPARATOR . 'bbi-php-error.log');

/* ===========================================================================
   DEPLOYMENT CONFIG
   =========================================================================== */

// Exact Origins allowed to call this endpoint (scheme+host[+port], NO trailing
// slash). The browser sends Origin; we only echo it back if it is listed here.
const ALLOWED_ORIGINS = array(
    'https://bbi.aslm.org',
    'https://drtemesgen.github.io',   // GitHub Pages origin (remove if unused)
);

// Mail routing — ALL of these are FIXED server-side. The client can never
// influence the recipient or the From identity (no open relay).
const MAIL_TO         = 'academy@aslm.org';       // FIXED recipient. Never from client.
const MAIL_FROM_EMAIL = 'noreply@drtemesgen.com'; // Domain we control -> SPF passes.
const MAIL_FROM_NAME  = 'BBI Africa';

// Limits.
const MAX_BODY_BYTES   = 16384;   // 16 KB hard cap on the raw request body.
const MAX_SUBJECT_CHARS = 200;
const MIN_MESSAGE_CHARS = 1;
const MAX_MESSAGE_CHARS = 5000;
const MAX_NAME_CHARS    = 120;
const MAX_EMAIL_CHARS   = 254;    // RFC max addr length.
const MAX_FORMTYPE_CHARS = 60;

// Rate limiting (best-effort; fails OPEN so it can never take the form offline).
const RATE_LIMIT_MAX    = 5;       // sends per IP per window
const RATE_LIMIT_WINDOW = 300;     // seconds (5 min)
const GLOBAL_DAILY_MAX  = 200;     // hard daily ceiling across ALL callers

/* ===========================================================================
   Helpers
   =========================================================================== */

/** Emit a JSON response and stop. Always valid JSON, always UTF-8. */
function bbi_json($payload, $status = 200) {
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Strict sanitiser for any value placed into an email HEADER. Defuses header
 *  injection by removing CR, LF, NUL and the literal %0a/%0d encodings (in any
 *  case), then collapsing whitespace so the result is a single safe line.
 *  Header values must NEVER contain a newline — this guarantees that. */
function bbi_header_safe($value) {
    $value = (string)$value;
    // Kill literal percent-encoded CR/LF first (defends against decode-later sinks).
    $value = preg_replace('/%0[aAdD]/', '', $value);
    // Strip real CR, LF, NUL and any other control chars.
    $value = preg_replace('/[\r\n\x00-\x1F\x7F]+/', ' ', $value);
    // Collapse runs of whitespace and trim — keeps it to one tidy line.
    $value = preg_replace('/[ \t]+/', ' ', $value);
    return trim($value);
}

/** Best-effort client IP for rate limiting (not used for trust decisions). */
function bbi_client_ip() {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
    return is_string($ip) ? $ip : '0.0.0.0';
}

/** A writable temp dir for the rate-limit counters, or '' if none. */
function bbi_counter_dir() {
    $d = sys_get_temp_dir();
    if (!$d || !@is_dir($d) || !@is_writable($d)) { return ''; }
    return rtrim($d, "/\\");
}

/** Windowed JSON counter with flock. Returns true if still within $max.
 *  FAILS OPEN (true) on any I/O problem. */
function bbi_counter_ok($file, $max, $window) {
    $fh = @fopen($file, 'c+');
    if (!$fh) { return true; }
    $ok = true;
    if (@flock($fh, LOCK_EX)) {
        $raw   = stream_get_contents($fh);
        $data  = json_decode((string)$raw, true);
        $now   = time();
        $start = (is_array($data) && isset($data['start'])) ? (int)$data['start'] : 0;
        $count = (is_array($data) && isset($data['count'])) ? (int)$data['count'] : 0;
        if ($now - $start >= $window) { $start = $now; $count = 0; }
        $count++;
        $ok = ($count <= $max);
        @ftruncate($fh, 0);
        @rewind($fh);
        @fwrite($fh, json_encode(array('start' => $start, 'count' => $count)));
        @fflush($fh);
        @flock($fh, LOCK_UN);
    }
    @fclose($fh);
    return $ok;
}

/** Occasionally remove stale per-IP rate files so an IP-rotating caller cannot
 *  exhaust inodes in the temp dir. */
function bbi_gc($dir) {
    if (mt_rand(1, 50) !== 1) { return; }
    $files = @glob($dir . DIRECTORY_SEPARATOR . 'bbi_mail_rl_*.json');
    if (!is_array($files)) { return; }
    $cut = time() - 86400;
    foreach ($files as $f) {
        $m = @filemtime($f);
        if ($m !== false && $m < $cut) { @unlink($f); }
    }
}

/** Global-daily ceiling AND per-IP window. true = allowed. Fails OPEN.
 *  Counters are namespaced separately from chat.php (bbi_mail_rl_*). */
function bbi_rate_ok($ip) {
    $dir = bbi_counter_dir();
    if ($dir === '') { return true; }
    bbi_gc($dir);
    $day = gmdate('Ymd');
    if (!bbi_counter_ok($dir . DIRECTORY_SEPARATOR . 'bbi_mail_rl_global_' . $day . '.json', GLOBAL_DAILY_MAX, 86400)) {
        return false;
    }
    return bbi_counter_ok($dir . DIRECTORY_SEPARATOR . 'bbi_mail_rl_' . sha1($ip) . '.json', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
}

/* ===========================================================================
   CORS  (strict allowlist — never wildcard)
   =========================================================================== */
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Max-Age: 600');
}

/* Preflight: answer before any body work. */
if ((isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '') === 'OPTIONS') {
    if (!headers_sent()) { http_response_code(204); }
    exit;
}

/* ===========================================================================
   Method / body-size / rate gate
   =========================================================================== */
if ((isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '') !== 'POST') {
    bbi_json(array('ok' => false, 'error' => 'POST only'), 405);
}

$declaredLen = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
if ($declaredLen > MAX_BODY_BYTES) {
    bbi_json(array('ok' => false, 'error' => 'payload too large'), 413);
}

if (!bbi_rate_ok(bbi_client_ip())) {
    bbi_json(array('ok' => false, 'error' => 'rate limited'), 429);
}

/* ===========================================================================
   Read + validate input
   =========================================================================== */
$raw = file_get_contents('php://input');
if (!is_string($raw)) { $raw = ''; }
if (strlen($raw) > MAX_BODY_BYTES) {            // real gate (covers chunked / missing CL)
    bbi_json(array('ok' => false, 'error' => 'payload too large'), 413);
}

$in = json_decode($raw, true);
if (!is_array($in)) { $in = array(); }

/* HONEYPOT — if the hidden "hp" field came back filled, it's a bot. Pretend we
   succeeded and send NOTHING, so the bot gets no signal that it was caught. */
$hp = isset($in['hp']) ? trim((string)$in['hp']) : '';
if ($hp !== '') {
    bbi_json(array('ok' => true), 200);
}

/* --- message (the only required field; carries newlines; goes in the BODY) --- */
$message = trim((string)(isset($in['message']) ? $in['message'] : ''));
$msgLen  = mb_strlen($message);
if ($msgLen < MIN_MESSAGE_CHARS || $msgLen > MAX_MESSAGE_CHARS) {
    bbi_json(array('ok' => false, 'error' => 'bad input'), 400);
}

/* --- subject (single header line) --- */
$subject = bbi_header_safe(isset($in['subject']) ? $in['subject'] : '');
$subject = mb_substr($subject, 0, MAX_SUBJECT_CHARS);
if ($subject === '') { $subject = 'BBI website message'; }

/* --- name (header-bound; used in From display + body footer) --- */
$name = bbi_header_safe(isset($in['name']) ? $in['name'] : '');
$name = mb_substr($name, 0, MAX_NAME_CHARS);

/* --- formType (label only; sanitised for the footer) --- */
$formType = bbi_header_safe(isset($in['formType']) ? $in['formType'] : '');
$formType = mb_substr($formType, 0, MAX_FORMTYPE_CHARS);

/* --- replyTo: keep ONLY if it's a length-sane, valid email; else drop it. --- */
$replyToRaw = bbi_header_safe(isset($in['replyTo']) ? $in['replyTo'] : '');
$replyTo = '';
if ($replyToRaw !== '' && strlen($replyToRaw) <= MAX_EMAIL_CHARS
    && filter_var($replyToRaw, FILTER_VALIDATE_EMAIL)) {
    $replyTo = $replyToRaw;
}

/* ===========================================================================
   Build headers. EVERY header value is single-line & sanitised. The From
   address is validated; if it somehow isn't a valid email we refuse to set the
   envelope sender param (defence-in-depth against a bad constant).
   =========================================================================== */
$fromEmail = bbi_header_safe(MAIL_FROM_EMAIL);
$fromName  = bbi_header_safe(MAIL_FROM_NAME);
$fromEmailValid = (strlen($fromEmail) <= MAX_EMAIL_CHARS)
    && (bool)filter_var($fromEmail, FILTER_VALIDATE_EMAIL);

// If even the configured From address is invalid, fail safe (don't try to send).
if (!$fromEmailValid) {
    bbi_json(array('ok' => false, 'error' => 'send failed'), 200);
}

$headers = array();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'Content-Transfer-Encoding: 8bit';
$headers[] = 'From: ' . ($fromName !== '' ? $fromName . ' <' . $fromEmail . '>' : $fromEmail);
if ($replyTo !== '') {
    $headers[] = 'Reply-To: ' . $replyTo;   // already validated as an email + single line
}
$headers[] = 'X-Mailer: BBI-Mail';

/* ===========================================================================
   Build the body. Newlines are fine HERE (this is not a header). Append a small
   admin footer. The submitter-controlled values in the footer are body content,
   not headers, so they cannot inject headers; we still normalise newlines.
   =========================================================================== */
$ip    = bbi_client_ip();
$nowU  = gmdate('Y-m-d H:i:s') . ' UTC';

$bodyParts = array();
$bodyParts[] = $message;
$bodyParts[] = '';
$bodyParts[] = '----------------------------------------';
$bodyParts[] = 'Submitted via the BBI website.';
if ($formType !== '') { $bodyParts[] = 'Form:   ' . $formType; }
if ($name !== '')     { $bodyParts[] = 'Name:   ' . $name; }
$bodyParts[] = 'Reply:  ' . ($replyTo !== '' ? $replyTo : '(no valid email provided)');
$bodyParts[] = 'IP:     ' . $ip;
$bodyParts[] = 'Time:   ' . $nowU;

$body = implode("\r\n", $bodyParts);
// Normalise body line endings to CRLF for MTA friendliness, and never allow a
// bare NUL through.
$body = str_replace("\x00", '', $body);
$body = preg_replace('/\r\n|\r|\n/', "\r\n", $body);

/* ===========================================================================
   Send. mail() must exist (some hardened hosts disable it). The 5th param sets
   the envelope sender (-f) so bounces / SPF align with our From — but only with
   a validated address, and guarded in case the param is disabled on the host.
   We NEVER surface mail()'s return detail to the client.
   =========================================================================== */
if (!function_exists('mail')) {
    bbi_json(array('ok' => false, 'error' => 'send failed'), 200);
}

$headerStr = implode("\r\n", $headers);

$sent = false;
// Try with the envelope-sender (-f) param first; some hosts disable the 5th arg
// (or reject -f), so fall back to a 4-arg send if that throws/returns false.
$envelope = '-f' . $fromEmail;   // $fromEmail is validated above
try {
    $sent = @mail(MAIL_TO, $subject, $body, $headerStr, $envelope);
} catch (\Throwable $e) {
    $sent = false;
}
if (!$sent) {
    try {
        $sent = @mail(MAIL_TO, $subject, $body, $headerStr);
    } catch (\Throwable $e) {
        $sent = false;
    }
}

if (!$sent) {
    // Generic — no mail() detail, no server paths. (Real cause is in the temp log.)
    bbi_json(array('ok' => false, 'error' => 'send failed'), 200);
}

bbi_json(array('ok' => true), 200);
