# BBI AI assistant — backend API (cPanel)

The chat widget (`js/assistant.js`) works on its own using on-device retrieval
over the site's content. To upgrade it to **conversational AI answers
(DeepSeek, or Claude later)**, deploy this small PHP endpoint and point the
frontend at it.

- **Endpoint (when done):** `https://ebc.drtemesgen.com/chat.php`
- **Health check:** `https://ebc.drtemesgen.com/health.php`
- **Caller (cross-origin):** the static site at `https://bbi.aslm.org`
- **Files:** `chat.php` (the API), `health.php` (status probe, deletable later),
  `deploy.htaccess` (defense-in-depth, deployed as `.htaccess`),
  `bbi-secret.sample.php` (key template).

> The static site lives on **GitHub Pages**; cPanel is a **separate host**, so
> the API is cross-origin by design. `chat.php` handles that with a strict CORS
> allowlist. **CORS only constrains browsers — it is NOT access control.** The
> real cost backstops are the built-in rate limits *and a spend cap on your
> DeepSeek account* (set one in the DeepSeek dashboard).

---

## What was hardened (vs. a naive proxy)

- **Key never leaks:** server-side only; read from an env var or a secret file
  that is parsed as *text* (never executed, so a typo can't fatal it); the
  sample placeholder is rejected (a forgotten paste shows as "not configured",
  not a fake success); upstream errors/status/body are never echoed.
- **Strict CORS allowlist** (no wildcard) + correct OPTIONS preflight.
- **Input validation + size caps** (message, sources, 24 KB body).
- **Rate limiting:** per-IP **and** a global daily ceiling, file-based, *fails
  open* so it can never take the bot offline; stale counters are GC'd.
- **TLS-verified** upstream calls with timeouts; fails closed.
- **Always returns JSON**, so the widget degrades gracefully on any failure.

---

## Deploy — cPanel Terminal runbook (`ebc.drtemesgen.com`)

Run everything in **cPanel → Terminal**. The shell starts in your home dir
`/home/<cpanel-user>`. The repo is public, so we pull the files straight from
GitHub raw — no `git`, no giant copy-paste.

### Step 0 — Prerequisites

1. **PHP 8.x** for the subdomain: cPanel → **MultiPHP Manager** → set
   `ebc.drtemesgen.com` to **PHP 8.1+**. (`chat.php` uses 8-era syntax.)
2. **HTTPS** must be valid. `ebc.drtemesgen.com` already serves a working
   certificate (verified). If you ever recreate the subdomain, run
   cPanel → **SSL/TLS Status** → *Run AutoSSL* and wait for a valid cert before
   testing — a missing cert makes the browser silently fall back to local mode.

### Step 1 — Find the real document root (authoritative source first)

The docroot of a subdomain may be `/home/<user>/ebc.drtemesgen.com` **or**
nested under `public_html` — guessing wrong gives a 404. Read the real value:

- **Authoritative:** cPanel → **Domains** → the `ebc.drtemesgen.com` row →
  **Document Root** column. Copy that exact path.

Then in the Terminal, set variables (paste the path you just read):

```bash
DOCROOT="/home/$(whoami)/ebc.drtemesgen.com"   # <-- EDIT to the real Document Root
HOMEDIR="$HOME"
test -d "$DOCROOT" || { echo "!! DOCROOT does not exist — fix the path"; }
echo "user=$(whoami)  home=$HOMEDIR  docroot=$DOCROOT"
ls -la "$DOCROOT"     # may be empty (that's the current 404)
```

> Best-effort terminal hints (often blocked by shared-host permissions, so trust
> the cPanel UI above): `ls -la "$HOME"/ebc.drtemesgen.com 2>/dev/null` ·
> `ls -la "$HOME"/public_html 2>/dev/null`.

### Step 2 — Fetch the API files into the docroot

```bash
RAW="https://raw.githubusercontent.com/DrTemesgen/bbi.aslm.org/main/backend"

# Use wget if present, else curl:
get() { if command -v wget >/dev/null; then wget -qO "$1" "$2"; else curl -fsSL -o "$1" "$2"; fi; }

get "$DOCROOT/chat.php"   "$RAW/chat.php"
get "$DOCROOT/health.php" "$RAW/health.php"
get "$DOCROOT/.htaccess"  "$RAW/deploy.htaccess"

ls -la "$DOCROOT"/chat.php "$DOCROOT"/health.php "$DOCROOT"/.htaccess
head -n1 "$DOCROOT/chat.php"     # should print:  <?php
```

### Step 3 — Create the secret key file (outside the web root)

Put the DeepSeek key in your **home dir** (above every docroot):

```bash
cat > "$HOMEDIR/bbi-secret.php" <<'EOF'
<?php
return 'sk-PASTE-YOUR-REAL-DEEPSEEK-KEY-HERE';
EOF

# Paste the real key (nano; if nano is missing, use: vi "$HOMEDIR/bbi-secret.php")
nano "$HOMEDIR/bbi-secret.php"     # replace the placeholder, keep the quotes

chmod 600 "$HOMEDIR/bbi-secret.php"
```

Point both scripts at that absolute path (works in every docroot layout; the
trailing comment is harmless):

```bash
sed -i -E "s#(const SECRET_FILE[[:space:]]*=[[:space:]]*)''#\1'$HOMEDIR/bbi-secret.php'#" \
    "$DOCROOT/chat.php" "$DOCROOT/health.php"
grep -n "const SECRET_FILE" "$DOCROOT/chat.php"   # -> '/home/<user>/bbi-secret.php'
```

> The key is read as **text**, so it must not contain a single-quote `'`.
> DeepSeek/Anthropic keys are `sk-` + `[A-Za-z0-9_-]`, so this is never an issue.

### Step 4 — Enable verbose health diagnostics (one random token)

```bash
TOKEN=$(openssl rand -hex 16 2>/dev/null || (head -c16 /dev/urandom | od -An -tx1 | tr -d ' \n'))
sed -i -E "s#(const HEALTH_PROBE_TOKEN[[:space:]]*=[[:space:]]*)''#\1'$TOKEN'#" "$DOCROOT/health.php"
echo "HEALTH PROBE TOKEN: $TOKEN"      # <-- copy this; you'll use it in Step 6
```

### Step 5 — Permissions

```bash
chmod 644 "$DOCROOT/chat.php" "$DOCROOT/health.php" "$DOCROOT/.htaccess"
chmod 755 "$DOCROOT"
chmod 600 "$HOMEDIR/bbi-secret.php"
```

> No `chown` needed — files you create in Terminal are already owned by your
> account. If ownership is ever wrong, use cPanel's **Fix Permissions** tool
> (a user cannot `chown` to another owner).

### Step 6 — Verify from the Terminal (before touching the frontend)

**6a. Verbose health** (uses your token; reveals no key):

```bash
curl -s "https://ebc.drtemesgen.com/health.php?probe=$TOKEN" ; echo
# or: wget -qO- "https://ebc.drtemesgen.com/health.php?probe=$TOKEN" ; echo
```

Expect `keyConfigured:true`. If it's **false**, read the `open_basedir` and
`secretPath`/`secretReadable` fields:

- `secretReadable:false` with an `open_basedir` that does **not** include your
  home dir → PHP is sandboxed to the docroot. Use **Plan B** below.
- otherwise re-check the path/permissions from Steps 3 & 5.

**6b. Chat POST** (mirrors exactly what the widget sends):

```bash
curl -s https://ebc.drtemesgen.com/chat.php \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://bbi.aslm.org' \
  -d '{"message":"What is the BBI?","lang":"en","sources":[{"title":"About BBI","text":"The Biosafety and Biosecurity Initiative (BBI) is an Africa CDC / ASLM initiative that strengthens laboratory biosafety and biosecurity across Africa.","href":"https://bbi.aslm.org/about"}]}' ; echo
```

Expect a JSON `{"answer":"…","sources":[…]}` grounded in that source.

**6c. CORS preflight** (the browser does this before the POST):

```bash
curl -s -i -X OPTIONS https://ebc.drtemesgen.com/chat.php \
  -H 'Origin: https://bbi.aslm.org' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' | head -n 1
curl -s -D - -o /dev/null https://ebc.drtemesgen.com/chat.php \
  -H 'Origin: https://bbi.aslm.org' -X OPTIONS | grep -i access-control-allow-origin
```

Expect `HTTP/.. 204` and `Access-Control-Allow-Origin: https://bbi.aslm.org`.

**Do not proceed until 6a, 6b and 6c all pass.**

#### Plan B — secret inside the docroot (only if `open_basedir` blocks home)

```bash
mkdir -p "$DOCROOT/.bbi-secret"
cat > "$DOCROOT/.bbi-secret/key.php" <<'EOF'
<?php
return 'sk-PASTE-YOUR-REAL-DEEPSEEK-KEY-HERE';
EOF
nano "$DOCROOT/.bbi-secret/key.php"        # paste the real key
chmod 700 "$DOCROOT/.bbi-secret" ; chmod 600 "$DOCROOT/.bbi-secret/key.php"
# chat.php auto-finds this path; the shipped .htaccess returns 404 for it.
# Confirm it is NOT web-readable:
curl -s -o /dev/null -w "%{http_code}\n" https://ebc.drtemesgen.com/.bbi-secret/key.php  # want 404/403
```

Re-run Step 6a; `keyConfigured` should now be `true`.

### Step 7 — Wire the frontend (only after Step 6 is green)

In this repo, add the endpoint to `js/firebase-config.js` (loads early on every
page, before the widget):

```js
window.BBI_AI_ENDPOINT = "https://ebc.drtemesgen.com/chat.php";
```

Commit + push; GitHub Pages redeploys. Open the site, ask the widget a question,
and confirm in DevTools → **Network** that the POST to `ebc.drtemesgen.com`
returns **200** with an `answer`. (If it fails, the widget silently falls back
to local retrieval — so a "working" widget is **not** proof; check Network.)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| **404** on the files | Wrong `<docroot>` | Re-read cPanel → Domains → Document Root (Step 1); `ls -la "$DOCROOT"` must show the files. |
| **403 Forbidden** | Bad perms or a blocking `.htaccess` | `chmod 644` files, `755` docroot (Step 5); check the shipped `.htaccess` deployed cleanly. |
| **`{"error":"AI not configured"}`** | Key didn't resolve | `health.php?probe=…` → if `keyConfigured:false`, check `open_basedir`/`secretPath`/`secretReadable`; use Plan B if home is sandboxed. |
| **`{"error":"upstream"}`** | DeepSeek rejected the call (bad key, no balance, rate limit, outage) | Verify the key value and your DeepSeek account balance/limits; retry on 5xx. |
| **CORS error in browser** | Origin not allowlisted | `ALLOWED_ORIGINS` in `chat.php` must contain the exact site origin (scheme, host, no trailing slash). Re-run Step 6c. |
| **PHP parse errors** | Subdomain on PHP < 8 | MultiPHP Manager → set PHP 8.1+; confirm via verbose health `php` field. |
| **`"curl":false`** in verbose health | PHP cURL extension off | cPanel → Select PHP Version → Extensions → enable `curl`. |
| **`command not found` (wget/curl)** | Tool missing in Terminal | Use whichever exists (`get()` in Step 2 tries both); for tests, swap `curl` ↔ `wget -qO-`. |

---

## GOTCHAS (real cPanel pitfalls)

- **`open_basedir` can block the home-dir secret.** Many shared hosts sandbox
  PHP to the docroot + `/tmp`, so `/home/<user>/bbi-secret.php` is unreadable
  even though it exists. Verbose health reports `open_basedir`; use **Plan B**
  when home is excluded.
- **`SetEnv` in `.htaccess` is ignored under PHP-FPM**, so `getenv()` is empty —
  that's why we default to a secret *file*, not an env var.
- **Subdomain docroot layout varies** (`/home/<user>/ebc.drtemesgen.com` vs.
  nested under `public_html`). Always read the real Document Root from cPanel.
- **Never put the secret in `public_html` or any docroot** (except the protected
  `.bbi-secret/` Plan B). One level above a *nested* docroot is still web-served.
- **`.php` secret, not `.env`/`.txt`** if it must sit in a docroot: a `.php` that
  only `return`s executes to nothing if fetched; the shipped `.htaccess` also
  denies it. (We read it as text either way.)
- **suexec rejects group/world-writable scripts.** Keep `644`/`600`/`755`.
- **CORS is browser-only.** `curl` ignores it, so the endpoint is reachable by
  any script — rely on the rate limits + a **DeepSeek spend cap**, not CORS.
- **The widget hides failures.** It falls back to local retrieval on any error,
  so always confirm a real 200 POST in DevTools, not just that it "answers".
- **Delete `health.php` after go-live** if you want to minimise surface (public
  output is already minimal: only `ok` + `keyConfigured`).

---

## Contact mail endpoint (`mail.php`)

`mail.php` powers the site's contact forms (National TWG interest, mentorship
requests) and the admin alerts — they POST to it and it emails **academy@aslm.org**
through the server (no `mailto`, no EmailJS). It reuses chat.php's CORS + rate-limit
hardening and is injection/relay-proof: the recipient is fixed server-side, every
header value is CR/LF-sanitised, there's a honeypot, and Reply-To is a validated
submitter address.

**Deploy** (same docroot as chat.php — one line, no extra setup):

```bash
wget -qO /home/<cpanel-user>/ebc.drtemesgen.com/mail.php https://raw.githubusercontent.com/DrTemesgen/bbi.aslm.org/main/backend/mail.php
```

Config constants at the top of `mail.php`: `MAIL_TO` (recipient, default
`academy@aslm.org`) and `MAIL_FROM_EMAIL` (a domain address so SPF passes — for
best deliverability create `noreply@drtemesgen.com` in cPanel → **Email Accounts**,
or change it to an existing mailbox). The front-end is already wired via
`window.BBI_MAIL_ENDPOINT` in `js/firebase-config.js`.

**Test:**

```bash
curl -s https://ebc.drtemesgen.com/mail.php -H 'Content-Type: application/json' \
  -H 'Origin: https://drtemesgen.github.io' \
  -d '{"subject":"BBI test","message":"hello from curl","replyTo":"you@example.com"}'; echo
```

Expect `{"ok":true}` and an email arriving at academy@aslm.org. If you get
`{"ok":false,"error":"send failed"}`, the server's `mail()` is disabled or the
From domain isn't deliverable — create/verify `noreply@drtemesgen.com`.

## Switching to Claude later

`chat.php` has a `PROVIDER` switch. Set `PROVIDER = 'claude'`, supply
`ANTHROPIC_API_KEY` (env or the secret file), and it uses the Anthropic Messages
API instead of DeepSeek. Everything else (CORS, limits, grounding) is unchanged.

## When it moves to the Africa CDC server

The same files run anywhere with PHP 8 + cURL. Move them, set the key, update
`window.BBI_AI_ENDPOINT`, and adjust `ALLOWED_ORIGINS`.
