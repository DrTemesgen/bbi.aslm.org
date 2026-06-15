/* BBI Africa — internationalisation engine (vanilla, no build step)
   ------------------------------------------------------------------
   • Six languages — the African Union / Africa CDC official languages.
     English is the canonical source and the permanent fallback: if any
     key is missing in another language, the English value is used, so the
     site can never render a blank string.
   • Dictionaries are plain JS files (lang/<code>.js) that register onto
     BBI.i18n.dicts.<code>. Each non-English dictionary file ends by calling
     BBI.i18n.applyContent('<code>') so the BBI.* data layer is rewritten in
     the active language BEFORE the per-page render scripts run — no flash.
   • Language switch = persist choice + reload. A reload is the most robust
     way to re-run the one-shot inline render scripts in the new language and
     re-mirror every data-driven section, with zero half-translated state.
   ------------------------------------------------------------------ */
(function () {
  window.BBI = window.BBI || {};
  var I = window.BBI.i18n = window.BBI.i18n || {};
  I.dicts = I.dicts || {};

  // Order here = order in the switcher menu.
  I.LANGS = [
    { code: 'en', name: 'English',   endonym: 'English',   dir: 'ltr' },
    { code: 'fr', name: 'French',    endonym: 'Français',  dir: 'ltr' },
    { code: 'ar', name: 'Arabic',    endonym: 'العربية',   dir: 'rtl' },
    { code: 'pt', name: 'Portuguese',endonym: 'Português', dir: 'ltr' },
    { code: 'es', name: 'Spanish',   endonym: 'Español',   dir: 'ltr' },
    { code: 'sw', name: 'Swahili',   endonym: 'Kiswahili', dir: 'ltr' }
  ];
  var STORE = 'bbiLang';

  I.isLang = function (code) { return I.LANGS.some(function (x) { return x.code === code; }); };
  I.meta = function (code) {
    for (var i = 0; i < I.LANGS.length; i++) if (I.LANGS[i].code === code) return I.LANGS[i];
    return I.LANGS[0];
  };
  I.current = function () {
    var l = null;
    try { l = localStorage.getItem(STORE); } catch (e) {}
    return I.isLang(l) ? l : 'en';
  };
  I.set = function (code) {
    if (!I.isLang(code)) return;
    try { localStorage.setItem(STORE, code); } catch (e) {}
    location.reload();
  };

  // ---- bootstrap: set <html lang/dir> and synchronously pull in the active
  //      dictionary during page parse (before render scripts execute). ----
  I.loadActive = function () {
    var code = I.current();
    var m = I.meta(code);
    var html = document.documentElement;
    html.setAttribute('lang', code);
    html.setAttribute('dir', m.dir);
    if (code !== 'en' && !I.dicts[code]) {
      // document.write during initial parse loads & executes synchronously,
      // so the dictionary (and its applyContent call) finishes before the next
      // <script> — guaranteeing translated BBI.* data for the render scripts.
      document.write('<script src="lang/' + code + '.js"><\/script>');
    }
  };

  // ---- UI string lookup (DOM + dynamic render-script literals) ----
  // t('some.key') → active language, then English, then the key itself.
  I.t = function (key, fallback) {
    var code = I.current();
    var act = I.dicts[code] && I.dicts[code].ui;
    var en = I.dicts.en && I.dicts.en.ui;
    if (act && act[key] != null) return act[key];
    if (en && en[key] != null) return en[key];
    return fallback != null ? fallback : key;
  };
  window.BBI.t = I.t; // convenient global for inline render scripts

  // Localised month abbreviations for date chips on news/events cards.
  I.month = function (abbr) { return I.t('month.' + String(abbr).toLowerCase(), abbr); };

  // ---- content overrides: rewrite the BBI.* data layer into <code> ----
  function arr(target, src, fields) {
    if (!Array.isArray(target) || !Array.isArray(src)) return;
    for (var i = 0; i < target.length && i < src.length; i++) {
      if (!src[i]) continue;
      for (var f = 0; f < fields.length; f++) {
        var k = fields[f];
        if (src[i][k] != null) target[i][k] = src[i][k];
      }
    }
  }
  function byKey(target, src, keyField, fields) {
    if (!Array.isArray(target) || !src) return;
    for (var i = 0; i < target.length; i++) {
      var s = src[target[i][keyField]];
      if (!s) continue;
      for (var f = 0; f < fields.length; f++) {
        var k = fields[f];
        if (s[k] != null) target[i][k] = s[k];
      }
    }
  }

  I.applyContent = function (code) {
    var B = window.BBI;
    var c = I.dicts[code] && I.dicts[code].content;
    if (!B || !c) return;

    if (c.regions && B.regions) byKey(B.regions, c.regions, 'key', ['name']);
    if (c.certTypes && B.certTypes) byKey(B.certTypes, c.certTypes, 'key', ['name', 'desc', 'eligibility']);
    if (c.certLevels && B.certLevels) byKey(B.certLevels, c.certLevels, 'key', ['name', 'desc']);
    if (c.pathways && B.pathways) byKey(B.pathways, c.pathways, 'key', ['name', 'desc']);
    if (c.requiredDocs && B.requiredDocs) {
      for (var i = 0; i < B.requiredDocs.length && i < c.requiredDocs.length; i++) {
        if (c.requiredDocs[i] != null) B.requiredDocs[i] = c.requiredDocs[i];
      }
    }
    if (c.certSteps && B.certSteps) arr(B.certSteps, c.certSteps, ['title', 'text']);
    if (c.domains && B.domains) arr(B.domains, c.domains, ['title', 'text']);
    if (c.pillars && B.pillars) arr(B.pillars, c.pillars, ['kind', 'title', 'text']);
    if (c.timeline && B.timeline) arr(B.timeline, c.timeline, ['yr', 'title', 'text']);
    if (c.trainings && B.trainings) arr(B.trainings, c.trainings, ['title', 'level', 'mode', 'dur', 'desc']);
    if (c.news && B.news) arr(B.news, c.news, ['tag', 'title', 'text']);
    if (c.resources && B.resources) arr(B.resources, c.resources, ['title', 'meta', 'cat']);
    if (c.getInvolved && B.getInvolved) arr(B.getInvolved, c.getInvolved, ['title', 'text', 'cta']);
    if (c.events && B.events) arr(B.events, c.events, ['loc', 'type', 'title', 'desc']);

    if (c.home && B.home) {
      if (c.home.heroTitle != null) B.home.heroTitle = c.home.heroTitle;
      if (c.home.heroLead != null) B.home.heroLead = c.home.heroLead;
      if (c.home.stats && B.home.stats) arr(B.home.stats, c.home.stats, ['label', 'sub']);
    }
    if (c.ecc && B.ecc) {
      if (c.ecc.about != null) B.ecc.about = c.ecc.about;
      if (c.ecc.mandate) arr(B.ecc.mandate, c.ecc.mandate, ['title', 'text']);
      if (c.ecc.leadership) arr(B.ecc.leadership, c.ecc.leadership, ['role', 'country']);
      if (c.ecc.members) arr(B.ecc.members, c.ecc.members, ['role', 'country']);
      if (c.ecc.history) arr(B.ecc.history, c.ecc.history, ['title', 'text']);
    }
    if (c.directory && B.directory) {
      for (var d = 0; d < B.directory.length; d++) {
        var s = c.directory[B.directory[d].id];
        if (!s) continue;
        if (s.role != null) B.directory[d].role = s.role;
        if (s.bio != null) B.directory[d].bio = s.bio;
        if (s.hero != null) B.directory[d].hero = s.hero;
        if (Array.isArray(s.specialties)) B.directory[d].specialties = s.specialties;
      }
    }
  };

  // ---- admin/CMS content resolver (multilingual) ----
  // Admin-saved settings docs may be legacy-flat (English) or per-language
  // ({ __i18n: { fr: {...}, ar: {...} } }). Return the override object for the
  // ACTIVE language: per-language data if present; the flat doc only when the
  // active language is English; otherwise {} so the TRANSLATED default stands
  // (admin English never leaks into another language).
  I.activeOverride = function (obj) {
    if (!obj || typeof obj !== 'object') return {};
    var lang = I.current();
    if (obj.__i18n && obj.__i18n[lang]) return obj.__i18n[lang];
    if (lang === 'en') { var o = {}; for (var k in obj) { if (k !== '__i18n' && obj.hasOwnProperty(k)) o[k] = obj[k]; } return o; }
    return {};
  };

  // ---- DOM translation ----
  // data-i18n="key"            → element.textContent
  // data-i18n-html="key"       → element.innerHTML (for copy containing markup)
  // data-i18n-attr="a=key;b=k" → element attributes (placeholder, aria-label, content, alt, title…)
  I.applyDOM = function (root) {
    var code = I.current();
    if (code === 'en') return; // English markup is authored inline already
    root = root || document;

    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = I.t(el.getAttribute('data-i18n'), null);
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = I.t(el.getAttribute('data-i18n-html'), null);
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var bits = pair.split('=');
        if (bits.length < 2) return;
        var attr = bits[0].trim(), key = bits.slice(1).join('=').trim();
        var v = I.t(key, null);
        if (v != null) el.setAttribute(attr, v);
      });
    });
  };

  // ---- language switcher (injected into the #lang-switch placeholder) ----
  I.buildSwitcher = function () {
    var host = document.getElementById('lang-switch');
    if (!host) return;
    var cur = I.meta(I.current());
    var items = I.LANGS.map(function (l) {
      return '<button type="button" role="menuitem" class="lang-opt' +
        (l.code === cur.code ? ' active' : '') + '" data-lang="' + l.code +
        '" lang="' + l.code + '">' + l.endonym + '</button>';
    }).join('');
    host.innerHTML =
      '<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Change language">' +
        '<span aria-hidden="true">🌐</span><span class="lang-code">' + cur.code.toUpperCase() + '</span>' +
        '<span aria-hidden="true" class="lang-caret">▾</span>' +
      '</button>' +
      '<div class="lang-menu" role="menu">' + items + '</div>';

    var btn = host.querySelector('.lang-btn');
    var menu = host.querySelector('.lang-menu');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = host.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('.lang-opt').forEach(function (b) {
      b.addEventListener('click', function () { I.set(b.getAttribute('data-lang')); });
    });
    document.addEventListener('click', function (e) {
      if (!host.contains(e.target)) { host.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Runs after app.js mount() (header/footer present) because this listener
    // is registered after app.js's; render scripts run later still and already
    // use the translated BBI.* data + BBI.t() for their own literals.
    I.applyDOM(document);
    I.buildSwitcher();
  });
})();
