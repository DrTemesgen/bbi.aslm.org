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
  var MONTH = function (m) { return (window.BBI && BBI.i18n && BBI.i18n.month) ? BBI.i18n.month(m) : m; };

  // ---------- knowledge base (built lazily from localized BBI.* + nav) ----------
  // KB holds the synchronous, in-memory corpus (already localized at bootstrap).
  // ASYNC bodies (the people directory and admin-managed offerings) are loaded
  // ONCE, cached, and folded in — never refetched per message.
  var KB = null;        // synchronous chunks
  var ASYNC = null;     // cached chunks from BBIDir / BBIOfferings (or null until loaded)
  var asyncPromise = null; // de-dupes concurrent async loads
  function chunk(title, text, href) { return { title: title, text: String(text || ''), href: href, hay: (title + ' ' + (text || '')).toLowerCase() }; }

  // A compact, always-included "site overview": what the BBI is + the main
  // sections + the area/course names, so aggregate questions ("how many
  // courses") and greetings have grounding even when nothing else matches.
  function siteOverview() {
    var B = window.BBI || {};
    var areas = (B.certTypes || []).map(function (c) { return (c.abbr ? c.abbr + ' ' : '') + c.name; });
    var courses = (B.trainings || []).map(function (t) { return t.title; });
    var levels = (B.certLevels || []).map(function (l) { return l.name; });
    var pathways = (B.pathways || []).map(function (p) { return p.name; });
    var sections = [
      T('nav.about', 'About'), T('nav.framework', 'Framework'), T('nav.programme', 'Programme'),
      T('nav.training', 'Training'), T('nav.events', 'Events'), T('nav.news', 'News'),
      T('nav.directory', 'Directory'), T('nav.resources', 'Resources'), T('nav.ecc', 'ECC'),
      T('nav.apply', 'Apply'), T('nav.getInvolved', 'Get involved')
    ].filter(Boolean);
    var lead = (B.home && B.home.heroLead) ? String(B.home.heroLead).replace(/<[^>]+>/g, '') : '';
    var parts = [];
    parts.push(lead || 'The Biosafety & Biosecurity Initiative (BBI) strengthens systems that prevent, detect and respond to biological threats across the African Union Member States.');
    parts.push('Main sections of this site: ' + sections.join(', ') + '.');
    if (areas.length) parts.push('There are ' + areas.length + ' certification areas / disciplines: ' + areas.join('; ') + '.');
    if (levels.length) parts.push('Certification levels: ' + levels.join(', ') + '.');
    if (pathways.length) parts.push('Pathways: ' + pathways.join(', ') + '.');
    if (courses.length) parts.push('We offer ' + courses.length + ' training courses, including: ' + courses.join('; ') + '.');
    if ((B.events || []).length) parts.push('There are ' + B.events.length + ' upcoming events listed.');
    if (B.metrics) parts.push('Reach so far: ' + (B.metrics.certified || '400') + '+ professionals certified, ' + (B.metrics.memberStates || 55) + ' AU Member States, ' + (B.metrics.twgs || 5) + ' regional Technical Working Groups.');
    parts.push('Contact: academy@aslm.org.');
    return chunk(T('assistant.kb.overviewT', 'About this site (BBI overview)'), parts.join(' '), 'index.html');
  }

  function buildKB() {
    var B = window.BBI || {}, k = [];
    k.push(siteOverview());
    (B.pillars || []).forEach(function (p) { k.push(chunk(p.title, (p.kind ? p.kind + ' priority. ' : '') + p.text, 'index.html')); });
    (B.domains || []).forEach(function (d) { k.push(chunk(d.title, 'Legal-framework domain. ' + d.text, 'framework.html')); });
    (B.certTypes || []).forEach(function (c) { k.push(chunk((c.abbr ? c.abbr + ' — ' : '') + c.name, 'Certification area / discipline / course track ' + (c.abbr || '') + '. ' + (c.desc || '') + ' Eligibility: ' + (c.eligibility || ''), 'program.html')); });
    (B.certLevels || []).forEach(function (l) { k.push(chunk(l.name, 'Certification level. ' + l.desc, 'program.html')); });
    (B.pathways || []).forEach(function (p) { k.push(chunk(p.name, 'Certification pathway. ' + p.desc, 'program.html')); });
    (B.trainings || []).forEach(function (t) { k.push(chunk(t.title, 'Training course / programme' + (t.level ? ', level ' + t.level : '') + (t.mode ? ', ' + t.mode : '') + (t.dur ? ', ' + t.dur : '') + '. ' + (t.desc || ''), 'training.html')); });
    (B.events || []).forEach(function (e) { k.push(chunk(e.title, 'Event' + (e.type ? ' (' + e.type + ')' : '') + ' on ' + e.d + ' ' + MONTH(e.m) + ' ' + e.y + ', ' + (e.loc || '') + '. ' + (e.desc || ''), 'event.html?id=' + encodeURIComponent(e.id || ''))); });
    (B.news || []).forEach(function (n) { k.push(chunk(n.title, 'News' + (n.tag ? ' (' + n.tag + ')' : '') + ', ' + MONTH(n.m) + ' ' + n.y + '. ' + (n.text || ''), 'news.html')); });
    (B.getInvolved || []).forEach(function (g) { k.push(chunk(g.title, g.text, g.href || 'get-involved.html')); });
    (B.resources || []).forEach(function (r) { k.push(chunk(r.title, 'Resource' + (r.cat ? ' (' + r.cat + ')' : '') + '. ' + (r.meta || ''), r.url || 'resources.html')); });
    (B.certSteps || []).forEach(function (s) { k.push(chunk(s.title, 'Certification step. ' + s.text, 'apply.html')); });
    if (B.requiredDocs && B.requiredDocs.length) k.push(chunk(T('assistant.kb.docsT', 'Required application documents'), 'Documents needed for the Alternative Pathway Expression of Interest: ' + B.requiredDocs.join('; ') + '.', 'apply.html'));
    if (B.timeline && B.timeline.length) k.push(chunk(T('assistant.kb.timelineT', 'BBI history & milestones'), B.timeline.map(function (t) { return t.yr + ': ' + t.title + ' — ' + t.text; }).join(' '), 'about.html'));
    if (B.countries && B.countries.length) k.push(chunk(T('assistant.kb.countriesT', 'Countries engaged'), 'The BBI engages ' + B.countries.length + ' countries, including: ' + B.countries.map(function (c) { return c.name; }).join(', ') + '.', 'index.html'));
    if (B.partners && B.partners.length) k.push(chunk(T('assistant.kb.partnersT', 'Partners & supporters'), 'BBI partners and supporters include: ' + B.partners.map(function (p) { return p.name; }).join('; ') + '.', 'about.html'));
    // ECC
    if (B.ecc && B.ecc.about) k.push(chunk(T('nav.ecc', 'Examination & Certification Committee (ECC)'), B.ecc.about, 'ecc.html'));
    (B.ecc && B.ecc.mandate || []).forEach(function (m) { k.push(chunk(m.title, 'ECC mandate. ' + m.text, 'ecc.html')); });
    (B.ecc && B.ecc.history || []).forEach(function (h) { k.push(chunk(h.title, 'ECC history ' + h.yr + '. ' + h.text, 'ecc.html')); });
    if (B.ecc && Array.isArray(B.ecc.leadership) && Array.isArray(B.ecc.members)) {
      var people = B.ecc.leadership.concat(B.ecc.members).filter(function (p) { return p && p.name && p.name.indexOf('[') === -1; });
      if (people.length) k.push(chunk(T('assistant.kb.eccPeopleT', 'ECC leadership & members'), 'Examination & Certification Committee members: ' + people.map(function (p) { return p.name + (p.role ? ' (' + p.role + (p.org ? ', ' + p.org : '') + ')' : ''); }).join('; ') + '.', 'ecc.html'));
    }
    if (B.ecc && B.ecc.strategy) {
      var st = B.ecc.strategy;
      if (st.priorities && st.priorities.length) k.push(chunk(T('assistant.kb.eccStrategyT', 'ECC 2026–2030 strategy & priorities'), 'The ECC strategy has ' + st.priorities.length + ' priorities: ' + st.priorities.map(function (p) { return p.title + ' — ' + p.objective; }).join(' '), 'ecc.html'));
      if (st.swot) {
        var sw = st.swot;
        k.push(chunk(T('assistant.kb.eccSwotT', 'ECC situation analysis (SWOT)'), 'Strengths: ' + (sw.strengths || []).join('; ') + '. Weaknesses: ' + (sw.weaknesses || []).join('; ') + '. Opportunities: ' + (sw.opportunities || []).join('; ') + '. Threats: ' + (sw.threats || []).join('; ') + '.', 'ecc.html'));
      }
    }
    // About hero
    if (B.home && B.home.heroLead) k.push(chunk(T('nav.about', 'About'), String(B.home.heroLead).replace(/<[^>]+>/g, ''), 'about.html'));
    // task-oriented pointers
    k.push(chunk(T('assistant.kb.applyT', 'How to apply / certification'), T('assistant.kb.applyX', 'Apply for the RTCP-BBP certification programme — choose your area, level and pathway, then submit an Expression of Interest.'), 'apply.html'));
    k.push(chunk(T('assistant.kb.contactT', 'Contact'), T('assistant.kb.contactX', 'Contact the BBI / ASLM Academy at academy@aslm.org.'), 'mailto:academy@aslm.org'));
    k.push(chunk(T('assistant.kb.dirT', 'Professional directory & mentorship'), T('assistant.kb.dirX', 'Browse certified biosafety and biosecurity professionals, and find a mentor.'), 'directory.html'));
    return k;
  }

  // Lazily load the async bodies (people + admin offerings) ONCE and cache them.
  // Resolves to an array of chunks (possibly empty); never throws, never refetches.
  function loadAsync() {
    if (ASYNC) return Promise.resolve(ASYNC);
    if (asyncPromise) return asyncPromise;
    asyncPromise = (async function () {
      var out = [];
      // People — authoritative + localized (role/bio/hero/specialties).
      try {
        if (window.BBIDir && window.BBIDir.load) {
          var people = await window.BBIDir.load();
          (people || []).forEach(function (p) {
            if (!p || !p.name) return;
            var head = p.name + ' — ' + (p.role || '') + (p.country ? ', ' + p.country : '');
            var body = 'Professional in the BBI directory. ' + (p.role || '') + (p.org ? ' at ' + p.org : '') + (p.country ? ', ' + p.country : '') + (p.level ? '. Certification level: ' + p.level : '') + (p.specialties && p.specialties.length ? '. Specialties: ' + p.specialties.join(', ') : '') + (p.mentor ? '. Available as a mentor.' : '') + '. ' + (p.bio || '') + ' ' + (p.hero || '');
            out.push(chunk(head, body, 'directory.html'));
          });
        }
      } catch (e) { /* ignore — samples already cover names via in-memory directory below */ }
      // Admin-managed offerings (events + courses + activities) from Firestore.
      // byKind falls back to BBI.events/BBI.trainings samples, so to avoid
      // duplicating the in-memory samples already in KB we only fold in records
      // whose id is NOT one of the samples.
      try {
        if (window.BBIOfferings && window.BBIOfferings.byKind) {
          var B = window.BBI || {};
          var sampleEventIds = {}; (B.events || []).forEach(function (e) { sampleEventIds[e.id] = 1; });
          var sampleCourseTitles = {}; (B.trainings || []).forEach(function (t) { sampleCourseTitles[String(t.title).toLowerCase()] = 1; });
          var evs = await window.BBIOfferings.byKind('event');
          (evs || []).forEach(function (e) {
            if (!e || !e.title || sampleEventIds[e.id]) return;
            out.push(chunk(e.title, 'Event' + (e.type ? ' (' + e.type + ')' : '') + (e.loc ? ', ' + e.loc : '') + '. ' + (e.desc || ''), 'event.html?id=' + encodeURIComponent(e.id || '')));
          });
          var crs = await window.BBIOfferings.byKind('course');
          (crs || []).forEach(function (c) {
            if (!c || !c.title || sampleCourseTitles[String(c.title).toLowerCase()]) return;
            out.push(chunk(c.title, 'Training course / programme. ' + (c.desc || ''), 'training.html'));
          });
          var acts = await window.BBIOfferings.byKind('activity');
          (acts || []).forEach(function (a) {
            if (!a || !a.title) return;
            out.push(chunk(a.title, 'Activity. ' + (a.desc || ''), 'event.html?id=' + encodeURIComponent(a.id || '')));
          });
        }
      } catch (e) { /* ignore — offerings stay optional */ }
      ASYNC = out;
      return out;
    })();
    return asyncPromise;
  }

  // ---------- intent + retrieval ----------
  var STOP = { the: 1, a: 1, an: 1, of: 1, to: 1, in: 1, on: 1, for: 1, and: 1, or: 1, is: 1, are: 1, what: 1, how: 1, do: 1, i: 1, my: 1, me: 1, can: 1, with: 1, about: 1, you: 1, your: 1, does: 1, did: 1, have: 1, has: 1, there: 1, many: 1, much: 1, who: 1, where: 1, when: 1, this: 1, that: 1, please: 1, tell: 1, give: 1, list: 1, show: 1 };
  // Map user-natural terms to terms that actually appear in the corpus, so e.g.
  // "course(s)" finds the trainings and "BSC" finds the cabinet area.
  var SYN = {
    course: ['training', 'programme', 'program', 'curriculum'],
    courses: ['training', 'trainings', 'programme', 'programmes', 'curriculum'],
    class: ['training'], classes: ['training'], module: ['training'], modules: ['training'],
    cert: ['certification', 'certificate'], certs: ['certification'], certified: ['certification'],
    person: ['directory', 'professional'], people: ['directory', 'professional', 'professionals'],
    expert: ['professional', 'sme', 'expert'], experts: ['professional', 'sme'],
    professional: ['directory'], professionals: ['directory'],
    mentor: ['mentorship', 'directory'], mentors: ['mentorship'],
    workshop: ['workshop', 'training'], conference: ['event', 'conference'], summit: ['event', 'summit'],
    biosafety: ['biosafety', 'biorisk'], biosecurity: ['biosecurity'],
    cyber: ['cyberbiosecurity'], ai: ['cyberbiosecurity', 'ai'],
    cabinet: ['cabinets'], cabinets: ['cabinets'],
    apply: ['apply', 'application'], application: ['apply', 'application'], eligibility: ['eligibility', 'eligible'],
    cost: ['cost', 'fee'], price: ['cost', 'fee'], free: ['free'],
    country: ['countries', 'country'], countries: ['countries'],
    partner: ['partner', 'partners'], partners: ['partners'],
    news: ['news'], event: ['event', 'events'], events: ['event', 'events'],
    framework: ['framework', 'legal'], legal: ['legal', 'framework'],
    document: ['documents', 'document'], documents: ['documents'], cv: ['curriculum'],
    history: ['history', 'milestones', 'timeline'], milestone: ['milestones'], milestones: ['milestones']
  };
  function tokens(s) {
    var raw = String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(function (w) { return w.length > 1; });
    var out = [], seen = {};
    raw.forEach(function (w) {
      if (w.length <= 2 || STOP[w]) return;
      [w].concat(SYN[w] || []).forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } });
    });
    return out;
  }

  // Greeting / small-talk / meta intents — answered warmly with grounding, not refused.
  var GREET = /\b(hi|hii|hiya|hey+|hello+|holla|yo|hallo|hola|salut|bonjour|salam|salaam|marhaba|ola|ol[aá]|hej|jambo|habari|sup|howdy|greetings|good\s*(morning|afternoon|evening|day))\b/i;
  var META = /\b(thanks?|thank\s*you|thx|cheers|appreciate|who\s+are\s+you|what\s+(are|can)\s+you|what\s+do\s+you\s+do|help\s*me|how\s+can\s+you\s+help|what'?s\s+up|are\s+you\s+(a\s+)?(bot|ai|human|real))\b/i;
  function isGreeting(q) {
    var s = String(q || '').trim();
    if (!s) return true;
    if (META.test(s)) return true;
    // Treat as greeting if it matches GREET and has no real content tokens.
    if (GREET.test(s) && tokens(s).length === 0) return true;
    if (GREET.test(s) && s.split(/\s+/).length <= 3) return true;
    return false;
  }

  function score(c, qt) {
    var s = 0; qt.forEach(function (t) { if (c.hay.indexOf(t) !== -1) s += (c.title.toLowerCase().indexOf(t) !== -1 ? 2 : 1); });
    return s;
  }
  // Search across the synchronous KB + any already-cached async chunks.
  // ALWAYS prepends the site-overview chunk so aggregate/greeting queries are grounded.
  function search(q, n) {
    if (!KB) KB = buildKB();
    var overview = KB[0]; // siteOverview() is pushed first in buildKB()
    var corpus = KB.concat(ASYNC || []);
    var qt = tokens(q);
    var ranked = [];
    if (qt.length) {
      ranked = corpus.map(function (c) { return { c: c, score: score(c, qt) }; })
        .filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .map(function (x) { return x.c; });
    }
    var limit = n || 8;
    // Ensure the overview is always present (as grounding) without dropping a real hit.
    var out = [], have = {};
    out.push(overview); have[overview.title] = 1;
    for (var i = 0; i < ranked.length && out.length < limit; i++) {
      if (ranked[i] === overview || have[ranked[i].title]) continue;
      out.push(ranked[i]); have[ranked[i].title] = 1;
    }
    return out;
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

  // Friendly local intro for greetings / small-talk / meta questions.
  function greetingAnswer() {
    var hi = T('assistant.greetReply', "Hi! I'm the BBI assistant. I can help with biosafety & biosecurity areas, training courses, certification, events, the professional directory, and how to apply. What would you like to know?");
    var out = escapeHtml(hi);
    out += '<a class="bbi-src" href="program.html">' + escapeHtml(T('nav.programme', 'Programme')) + ' →</a>';
    out += '<a class="bbi-src" href="training.html">' + escapeHtml(T('nav.training', 'Training')) + ' →</a>';
    out += '<a class="bbi-src" href="apply.html">' + escapeHtml(T('nav.apply', 'Apply')) + ' →</a>';
    return out;
  }

  function localAnswer(q) {
    if (isGreeting(q)) return greetingAnswer();
    var hits = search(q, 3).filter(function (h) { return !KB || h !== KB[0]; }); // drop the overview for local display ranking
    if (!hits.length) {
      // No specific hit — still be helpful: show the overview + section links.
      var ov = (KB && KB[0]) ? KB[0] : null;
      var head = T('assistant.noMatch', 'I could not find that exact answer in the BBI content. Here is a quick overview — try the main sections:');
      var out = escapeHtml(head);
      if (ov) out += '<br><span>' + escapeHtml(ov.text.slice(0, 280)) + '</span>';
      out += '<a class="bbi-src" href="program.html">' + escapeHtml(T('nav.programme', 'Programme')) + ' →</a>';
      out += '<a class="bbi-src" href="framework.html">' + escapeHtml(T('nav.framework', 'Framework')) + ' →</a>';
      out += '<a class="bbi-src" href="apply.html">' + escapeHtml(T('nav.apply', 'Apply')) + ' →</a>';
      return out;
    }
    var top = hits[0];
    var out = '<strong>' + escapeHtml(top.title) + '</strong><br>' + escapeHtml(top.text).slice(0, 320);
    out += '<a class="bbi-src" href="' + escapeHtml(top.href) + '">' + escapeHtml(T('assistant.learnMore', 'Learn more →')) + '</a>';
    if (hits[1]) out += '<a class="bbi-src" href="' + escapeHtml(hits[1].href) + '">' + escapeHtml(hits[1].title) + ' →</a>';
    return out;
  }

  async function answer(q) {
    var typing = addMsg('a', '…');
    // Load the async corpus (people + offerings) once; if it isn't ready yet,
    // search proceeds on the synchronous KB this turn and includes it next time.
    try { await loadAsync(); } catch (e) { /* non-fatal */ }
    var hits = search(q, 8);
    var endpoint = window.BBI_AI_ENDPOINT;
    if (endpoint) {
      try {
        var r = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, lang: (window.BBI && BBI.i18n) ? BBI.i18n.current() : 'en', sources: hits.map(function (h) { return { title: h.title, text: h.text, href: h.href }; }) })
        });
        var data = await r.json();
        var ans = (data && data.answer) ? String(data.answer).trim() : '';
        if (ans) {
          var html = escapeHtml(ans);
          (data.sources || hits.slice(1, 3)).forEach(function (s) { if (s && s.href) html += '<a class="bbi-src" href="' + escapeHtml(s.href) + '">' + escapeHtml(s.title || T('assistant.learnMore', 'Learn more →')) + ' →</a>'; });
          typing.innerHTML = html;
          msgs.scrollTop = msgs.scrollHeight;
          return;
        }
        // empty/refusal answer → fall through to a helpful local response
      } catch (e) { /* fall back to local retrieval */ }
    }
    typing.innerHTML = localAnswer(q);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function build() {
    injectStyles();
    var fab = el('button', 'bbi-fab'); fab.setAttribute('aria-label', T('assistant.title', 'BBI assistant')); fab.textContent = '💬';
    fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false');
    panel = el('div', 'bbi-chat');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', T('assistant.title', 'BBI assistant'));
    panel.appendChild(el('header', null, '<span aria-hidden="true">🤖</span><span>' + escapeHtml(T('assistant.title', 'BBI assistant')) + '</span><button class="x" aria-label="' + escapeHtml(T('common.close', 'Close')) + '">×</button>'));
    msgs = el('div', 'bbi-msgs'); msgs.setAttribute('role', 'log'); msgs.setAttribute('aria-live', 'polite'); panel.appendChild(msgs);
    var inWrap = el('div', 'bbi-in');
    input = el('input'); input.type = 'text'; input.placeholder = T('assistant.placeholder', 'Ask about biosafety, courses, events…');
    var send = el('button', null, T('assistant.send', 'Send'));
    inWrap.appendChild(input); inWrap.appendChild(send); panel.appendChild(inWrap);
    document.body.appendChild(fab); document.body.appendChild(panel);

    function open() { panel.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); if (!msgs.childElementCount) addMsg('a', escapeHtml(T('assistant.greeting', 'Hi! Ask me about the BBI — biosafety areas, training, events, how to apply.'))); loadAsync(); input.focus(); }
    function close() { panel.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
    fab.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
    panel.querySelector('.x').addEventListener('click', close);
    function ask() { var q = input.value.trim(); if (!q) return; addMsg('u', escapeHtml(q)); input.value = ''; answer(q); }
    send.addEventListener('click', ask);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
