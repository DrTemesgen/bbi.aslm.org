<?php
/* TEMPLATE — do NOT put your real key in the git repo.
   ---------------------------------------------------------------------------
   1. Copy this file and rename it to  bbi-secret.php
   2. Replace the placeholder with your real DeepSeek key (it starts with sk-).
      The placeholder text contains "PASTE", which chat.php/health.php treat as
      NOT configured — so a forgotten paste shows up clearly, never as a fake
      success. The key must contain no spaces and no single-quote characters.
   3. Put bbi-secret.php in ONE of these locations (chat.php auto-finds both):
        (A) PREFERRED — your cPanel HOME dir, e.g. /home/<cpanel-user>/bbi-secret.php
            This is outside every web root. Works when open_basedir allows the
            home dir (check health.php?probe=... -> open_basedir).
        (B) FALLBACK (open_basedir restricted to the docroot) — a protected
            subfolder of the subdomain docroot:  <docroot>/.bbi-secret/key.php
            Deploy the included .htaccess so it is denied over HTTP.
   4. chmod 600 the file so only your account can read it.

   chat.php reads this file as TEXT (it is never executed), so a typo here can
   never break the endpoint. A plain-text file containing only the key works too.
   The key then exists only on your server — never in git, the browser, or chat. */
return 'sk-PASTE-YOUR-REAL-DEEPSEEK-KEY-HERE';
