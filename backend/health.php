<?php
/* BBI Africa — AI assistant health check.
   ===========================================================================
   Confirms a deployment WITHOUT ever revealing the API key.

   PUBLIC GET (no token):   { ok:true, keyConfigured:<bool>, time }
       keyConfigured is FORMAT-VALIDATED (the sample placeholder counts as NOT
       configured), so a forgotten key paste shows false, not a fake success.

   VERBOSE GET (operator):  health.php?probe=<HEALTH_PROBE_TOKEN>
       adds php (major.minor), phpFull, curl, open_basedir, secretPath (the file
       that resolved, or ''), secretReadable, keySource, allowedOrigin.
       Use this to diagnose the open_basedir / wrong-path cases during setup.
       The key itself is NEVER included in any mode.

   Set HEALTH_PROBE_TOKEN to a random string at deploy time (the runbook does
   this with one sed command). Keep ALLOWED_ORIGINS, SECRET_FILE and PROVIDER
   in sync with chat.php.  You may delete health.php after go-live.
   =========================================================================== */

@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
error_reporting(0);

/* ---- Keep these in sync with chat.php ---- */
const PROVIDER       = 'deepseek';            // 'deepseek' (default) | 'claude'
const DEEPSEEK_ENV   = 'DEEPSEEK_API_KEY';
const CLAUDE_ENV     = 'ANTHROPIC_API_KEY';
const SECRET_FILE    = '';                    // '' = auto-probe (see chat.php)
const ALLOWED_ORIGINS = array(
    'https://bbi.aslm.org',
    'https://drtemesgen.github.io',   // GitHub Pages origin (remove if unused)
);

// Random token enabling verbose output. '' disables verbose entirely.
const HEALTH_PROBE_TOKEN = '';

/* ---- Same secret resolution as chat.php (key never printed) ---- */
function bbi_secret_candidates() {
    $c = array();
    if (defined('SECRET_FILE') && is_string(SECRET_FILE) && SECRET_FILE !== '') { $c[] = SECRET_FILE; }
    $c[] = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'bbi-secret.php';
    $c[] = __DIR__ . DIRECTORY_SEPARATOR . '.bbi-secret' . DIRECTORY_SEPARATOR . 'key.php';
    return $c;
}
function bbi_read_secret_file($path) {
    if (!$path || !@is_file($path) || !@is_readable($path)) { return ''; }
    $txt = @file_get_contents($path);
    if (!is_string($txt) || $txt === '') { return ''; }
    $txt = trim($txt);
    if (strncmp($txt, '<?', 2) === 0) {
        if (preg_match('/return\s+[\'"]([^\'"]+)[\'"]\s*;/', $txt, $m)) { return trim($m[1]); }
        return '';
    }
    return $txt;
}
function bbi_key_valid($key) {
    if (!is_string($key)) { return false; }
    $key = trim($key);
    if (strlen($key) < 20) { return false; }
    if (preg_match('/\s/', $key)) { return false; }
    if (stripos($key, 'PASTE') !== false) { return false; }
    return true;
}
/** Returns array(configured(bool), source('env'|'file'|''), path(resolved file|'')). */
function bbi_key_status() {
    $envName = (PROVIDER === 'claude') ? CLAUDE_ENV : DEEPSEEK_ENV;
    $env = getenv($envName);
    if (is_string($env) && bbi_key_valid($env)) { return array(true, 'env', ''); }
    foreach (bbi_secret_candidates() as $path) {
        $k = bbi_read_secret_file($path);
        if (bbi_key_valid($k)) { return array(true, 'file', $path); }
    }
    return array(false, '', '');
}

/* ---- CORS (strict allowlist; never wildcard) ---- */
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Max-Age: 600');
}
if ((isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '') === 'OPTIONS') {
    if (!headers_sent()) { http_response_code(204); }
    exit;
}

list($configured, $source, $path) = bbi_key_status();

$probe = isset($_GET['probe']) ? (string)$_GET['probe'] : '';
$verbose = (HEALTH_PROBE_TOKEN !== '' && hash_equals(HEALTH_PROBE_TOKEN, $probe));

$out = array(
    'ok'            => true,
    'keyConfigured' => $configured,            // boolean only — never the key
    'time'          => gmdate('Y-m-d\TH:i:s\Z'),
);

if ($verbose) {
    $ver = explode('.', PHP_VERSION);
    $out['php']           = (isset($ver[0]) ? $ver[0] : '?') . '.' . (isset($ver[1]) ? $ver[1] : '?');
    $out['phpFull']       = PHP_VERSION;
    $out['curl']          = function_exists('curl_init');
    $out['open_basedir']  = (string)ini_get('open_basedir');     // does NOT leak the key
    $out['secretPath']    = $path;                                // resolved file or ''
    $out['secretReadable']= ($path !== '' && @is_readable($path));
    $out['keySource']     = $source;                             // 'env' | 'file' | ''
    $origins = ALLOWED_ORIGINS;
    $out['allowedOrigin'] = isset($origins[0]) ? $origins[0] : '';
}

header('Content-Type: application/json; charset=utf-8');
http_response_code(200);
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
