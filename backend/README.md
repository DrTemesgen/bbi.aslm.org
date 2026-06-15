# BBI AI assistant — backend (cPanel)

The site's chat widget (`js/assistant.js`) works on its own using on-device
retrieval over the site's content. To upgrade it to **conversational AI
answers (DeepSeek/Claude)**, deploy this small PHP endpoint and point the
frontend at it.

## Deploy (cPanel)
1. Upload `chat.php` to your domain, e.g. `https://bbi.aslm.org/api/chat.php`
   (create an `api/` folder in `public_html`). **HTTPS is required.**
2. Set your DeepSeek key as an environment variable (do **not** put it in the file):
   - cPanel → *Setup … / MultiPHP INI* or an `.htaccess` in `api/`:
     ```
     SetEnv DEEPSEEK_API_KEY "sk-your-deepseek-key"
     ```
   - (Claude instead? Set `ANTHROPIC_API_KEY` and switch `$API_URL`/`$MODEL`/payload
     in `chat.php` to the Anthropic Messages API.)
3. Edit `chat.php` → set `$ALLOWED_ORIGIN` to your exact site origin.
4. Tell the frontend where the endpoint is — add this to `js/firebase-config.js`
   (or any script that runs early), then redeploy the site:
   ```js
   window.BBI_AI_ENDPOINT = 'https://bbi.aslm.org/api/chat.php';
   ```
   With that set, the widget sends each question + the retrieved BBI snippets to
   the endpoint and shows the model's grounded answer. Without it, the widget
   stays in on-device retrieval mode.

## Safety built in
- The key lives only in the server environment — never in the browser or git.
- The model is instructed to answer **only** from the supplied BBI sources
  (grounded RAG), to refuse medical/legal/financial advice, to never make
  certification decisions (ECC does), and to treat user/source text as data,
  not instructions (prompt-injection defence).
- `$ALLOWED_ORIGIN` restricts who can call the endpoint. Consider adding a
  simple per-IP rate limit if abuse appears.

## When it moves to the Africa CDC server
The same `chat.php` runs anywhere with PHP 8 + cURL. Just move it, set the env
key, and update `window.BBI_AI_ENDPOINT`.
