/* BBI Africa — AI assistant widget (multilingual, content-grounded).
   ------------------------------------------------------------------
   • Floating button → chat panel, on every page, in the active language.
   • GROUNDED retrieval over the site's own (already-localized) content, so
     answers are BBI facts with links — never invented. Works offline/now.
   • If a backend is configured (window.BBI_AI_ENDPOINT, e.g. a cPanel PHP
     endpoint calling DeepSeek/Claude), the retrieved snippets are sent as RAG
     context and the backend returns a conversational answer + sources.
   • Self-contained: injects its own styles; RTL-aware. No external deps.    */
(function () {
  if (window.__bbiAssistant) return; window.__bbiAssistant = true;
  var T = function (k, d) { return (window.BBI && BBI.t) ? BBI.t(k, d) : d; };

  // ---------- knowledge base (built lazily from localized BBI.* + nav) ----------
  var KB = null;
  function chunk(title, text, href) { return { title: title, text: String(text || ''), href: href, hay: (title + ' ' + (text || '')).toLowerCase() }; }
  function buildKB() {
    var B = window.BBI || {}, k = [];
    (B.pillars || []).forEach(function (p) { k.push(chunk(p.title, p.text, 'index.html')); });
    (B.domains || []).forEach(function (d) { k.push(chunk(d.title, d.text, 'framework.html')); });
    (B.certTypes || []).forEach(function (c) { k.push(chunk(c.name, (c.desc || '') + ' ' + (c.eligibility || ''), 'program.html')); });
    (B.certLevels || []).forEach(function (l) { k.push(chunk(l.name, l.desc, 'program.html')); });
    (B.pathways || []).forEach(function (p) { k.push(chunk(p.name, p.desc, 'program.html')); });
    (B.trainings || []).forEach(function (t) { k.push(chunk(t.title, t.desc, 'training.html')); });
    (B.events || []).forEach(function (e) { k.push(chunk(e.title, (e.desc || '') + ' ' + (e.loc || '') + ' ' + e.m + ' ' + e.y, 'event.html?id=' + encodeURIComponent(e.id || ''))); });
    (B.getInvolved || []).forEach(function (g) { k.push(chunk(g.title, g.text, g.href || 'get-involved.html')); });
    (B.resources || []).forEach(function (r) { k.push(chunk(r.title, r.meta || '', r.url || 'resources.html')); });
    if (B.ecc && B.ecc.about) k.push(chunk(T('nav.ecc', 'ECC'), B.ecc.about, 'ecc.html'));
    (B.ecc && B.ecc.mandate || []).forEach(function (m) { k.push(chunk(m.title, m.text, 'ecc.html')); });
    if (B.home && B.home.heroLead) k.push(chunk(T('nav.about', 'About'), String(B.home.heroLead).replace(/<[^>]+>/g, ''), 'about.html'));
    // a few task-oriented pointers
    k.push(chunk(T('assistant.kb.applyT', 'How to apply / certification'), T('assistant.kb.applyX', 'Apply for the RTCP-BBP certification programme — choose your area, level and pathway, then submit an Expression of Interest.'), 'apply.html'));
    k.push(chunk(T('assistant.kb.contactT', 'Contact'), T('assistant.kb.contactX', 'Contact the BBI / ASLM Academy at academy@aslm.org.'), 'mailto:academy@aslm.org'));
    k.push(chunk(T('assistant.kb.dirT', 'Professional directory & mentorship'), T('assistant.kb.dirX', 'Browse certified biosafety and biosecurity professionals, and find a mentor.'), 'directory.html'));
    return k;
  }
  var STOP = { the: 1, a: 1, an: 1, of: 1, to: 1, in: 1, on: 1, for: 1, and: 1, or: 1, is: 1, are: 1, what: 1, how: 1, do: 1, i: 1, my: 1, me: 1, can: 1, with: 1, about: 1 };
  function tokens(s) { return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && !STOP[w]; }); }
  function search(q, n) {
    if (!KB) KB = buildKB();
    var qt = tokens(q); if (!qt.length) return [];
    return KB.map(function (c) {
      var score = 0; qt.forEach(function (t) { if (c.hay.indexOf(t) !== -1) score += (c.title.toLowerCase().indexOf(t) !== -1 ? 2 : 1); });
      return { c: c, score: score };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 3).map(function (x) { return x.c; });
  }

  // ---------- UI ----------
  function injectStyles() {
    if (document.getElementById('bbi-assist-css')) return;
    var s = document.createElement('style'); s.id = 'bbi-assist-css';
    s.textContent = [
      '.bbi-fab{position:fixed;inset-block-end:18px;inset-inline-end:18px;z-index:300;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:var(--green-700,#13654d);color:#fff;font-size:1.5rem;box-shadow:0 8px 24px rgba(0,0,0,.28);display:grid;place-items:center}',
      '.bbi-fab:hover{background:var(--green-800,#0f4f3c)}',
      '.bbi-chat{position:fixed;inset-block-end:84px;inset-inline-end:18px;z-index:300;width:min(380px,calc(100vw - 28px));height:min(560px,calc(100vh - 120px));background:#fff;border:1px solid var(--line,#e3e8e5);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden}',
      '.bbi-chat.open{display:flex}',
      '.bbi-chat header{background:var(--green-800,#0f4f3c);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px;font-weight:600}',
      '.bbi-chat header .x{margin-inline-start:auto;background:transparent;border:0;color:#fff;font-size:1.2rem;cursor:pointer}',
      '.bbi-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6f9f7}',
      '.bbi-b{max-width:85%;padding:10px 12px;border-radius:14px;font-size:.92rem;line-height:1.4}',
      '.bbi-b.u{align-self:flex-end;background:var(--green-700,#13654d);color:#fff;border-bottom-right-radius:4px}',
      '.bbi-b.a{align-self:flex-start;background:#fff;border:1px solid var(--line,#e3e8e5);border-bottom-left-radius:4px}',
      '.bbi-b.a a{color:var(--green-700,#13654d);font-weight:600;display:inline-block;margin-top:4px}',
      '.bbi-src{display:block;margin-top:6px;font-size:.82rem}',
      '.bbi-in{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,#e3e8e5);background:#fff}',
      '.bbi-in input{flex:1;padding:10px 12px;border:1px solid var(--line,#e3e8e5);border-radius:999px;font:inherit;font-size:.92rem}',
      '.bbi-in button{border:0;background:var(--green-700,#13654d);color:#fff;border-radius:999px;padding:0 16px;cursor:pointer;font-weight:600}',
      '[dir="rtl"] .bbi-b.u{border-bottom-right-radius:14px;border-bottom-left-radius:4px}',
      '@media(max-width:520px){.bbi-chat{inset-block-end:80px;inset-inline:12px;width:auto;height:min(72vh,520px)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var panel, msgs, input;
  function addMsg(role, html) { var b = el('div', 'bbi-b ' + (role === 'u' ? 'u' : 'a'), html); msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight; return b; }

  function localAnswer(q) {
    var hits = search(q, 3);
    if (!hits.length) {
      return T('assistant.noMatch', 'I could not find that in the BBI content. Try the main sections:') +
        ' <a href="program.html">' + T('nav.programme', 'Programme') + '</a> · <a href="framework.html">' + T('nav.framework', 'Framework') + '</a> · <a href="apply.html">' + T('nav.apply', 'Apply') + '</a>';
    }
    var top = hits[0];
    var out = '<strong>' + escapeHtml(top.title) + '</strong><br>' + escapeHtml(top.text).slice(0, 320);
    out += '<a class="bbi-src" href="' + top.href + '">' + T('assistant.learnMore', 'Learn more →') + '</a>';
    if (hits[1]) out += '<a class="bbi-src" href="' + hits[1].href + '">' + escapeHtml(hits[1].title) + ' →</a>';
    return out;
  }

  async function answer(q) {
    var typing = addMsg('a', '…');
    var hits = search(q, 4);
    var endpoint = window.BBI_AI_ENDPOINT;
    if (endpoint) {
      try {
        var r = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, lang: (window.BBI && BBI.i18n) ? BBI.i18n.current() : 'en', sources: hits.map(function (h) { return { title: h.title, text: h.text, href: h.href }; }) })
        });
        var data = await r.json();
        var html = escapeHtml(data.answer || '');
        (data.sources || hits.slice(0, 2)).forEach(function (s) { if (s && s.href) html += '<a class="bbi-src" href="' + s.href + '">' + escapeHtml(s.title || T('assistant.learnMore', 'Learn more →')) + ' →</a>'; });
        typing.innerHTML = html || localAnswer(q);
        msgs.scrollTop = msgs.scrollHeight;
        return;
      } catch (e) { /* fall back to local retrieval */ }
    }
    typing.innerHTML = localAnswer(q);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function build() {
    injectStyles();
    var fab = el('button', 'bbi-fab'); fab.setAttribute('aria-label', T('assistant.title', 'BBI assistant')); fab.textContent = '💬';
    panel = el('div', 'bbi-chat');
    panel.appendChild(el('header', null, '<span aria-hidden="true">🤖</span><span>' + escapeHtml(T('assistant.title', 'BBI assistant')) + '</span><button class="x" aria-label="' + escapeHtml(T('common.close', 'Close')) + '">×</button>'));
    msgs = el('div', 'bbi-msgs'); panel.appendChild(msgs);
    var inWrap = el('div', 'bbi-in');
    input = el('input'); input.type = 'text'; input.placeholder = T('assistant.placeholder', 'Ask about biosafety, courses, events…');
    var send = el('button', null, T('assistant.send', 'Send'));
    inWrap.appendChild(input); inWrap.appendChild(send); panel.appendChild(inWrap);
    document.body.appendChild(fab); document.body.appendChild(panel);

    function open() { panel.classList.add('open'); if (!msgs.childElementCount) addMsg('a', escapeHtml(T('assistant.greeting', 'Hi! Ask me about the BBI — biosafety areas, training, events, how to apply.'))); input.focus(); }
    function close() { panel.classList.remove('open'); }
    fab.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
    panel.querySelector('.x').addEventListener('click', close);
    function ask() { var q = input.value.trim(); if (!q) return; addMsg('u', escapeHtml(q)); input.value = ''; answer(q); }
    send.addEventListener('click', ask);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
