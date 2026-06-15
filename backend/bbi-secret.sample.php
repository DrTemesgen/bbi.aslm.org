<?php
/* TEMPLATE — do NOT put your real key in the git repo.
   1. Copy this file, rename it to  bbi-secret.php
   2. Paste your real DeepSeek key between the quotes (replace the placeholder).
   3. Upload it ABOVE your web root (e.g. /home/<your-cpanel-user>/bbi-secret.php),
      NOT inside public_html — so it can never be served over the web.
   4. In chat.php set:  $SECRET_FILE = '/home/<your-cpanel-user>/bbi-secret.php';
   The key then exists only on your server. It is never in git, the browser, or chat. */
return 'sk-PASTE-YOUR-DEEPSEEK-KEY-HERE';
