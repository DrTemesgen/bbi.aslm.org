/* BBI Africa — admin panel logic */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const A = window.BBIAuth, $ = (id) => document.getElementById(id);
    if (!A || !A.ready) { $('not-config').classList.remove('hidden'); $('no-access').classList.remove('hidden'); return; }

    let ALL = [], USERS = [];

    A.onAuth(async (user, admin) => {
      if (!user || !admin) {
        $('panel').classList.add('hidden');
        $('no-access').classList.remove('hidden');
        return;
      }
      $('no-access').classList.add('hidden');
      $('panel').classList.remove('hidden');
      try {
        ALL = await A.allApplications();
      } catch (e) {
        $('rows').innerHTML = `<div class="notice">Could not load applications: ${e.message || e}</div>`;
      }
      try {
        USERS = await A.allUsers();
      } catch (e) {
        $('urows').innerHTML = `<div class="notice">Could not load registrations: ${e.message || e}</div>`;
      }
      initFilters();
      initTabs();
      render();
      renderUsers();
    });

    function initTabs() {
      document.querySelectorAll('[data-atab]').forEach(t => t.addEventListener('click', () => {
        document.querySelectorAll('[data-atab]').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const which = t.getAttribute('data-atab');
        $('tab-apps').classList.toggle('hidden', which !== 'apps');
        $('tab-regs').classList.toggle('hidden', which !== 'regs');
        $('tab-events').classList.toggle('hidden', which !== 'events');
        $('tab-evregs').classList.toggle('hidden', which !== 'evregs');
        $('tab-cats').classList.toggle('hidden', which !== 'cats');
        $('tab-dir').classList.toggle('hidden', which !== 'dir');
        $('tab-ecc').classList.toggle('hidden', which !== 'ecc');
        $('tab-home').classList.toggle('hidden', which !== 'home');
        if (which === 'cats') loadCats();
        if (which === 'dir') loadDir();
        if (which === 'events') loadEvents();
        if (which === 'evregs') loadEventRegs();
        if (which === 'ecc') loadEcc();
        if (which === 'home') loadHome();
      }));
      $('new-profile').addEventListener('click', () => openProfileDrawer(null));
      $('dq').addEventListener('input', renderDir);
      $('d-level').addEventListener('input', renderDir);
      [$('uq'), $('f-appr')].forEach(el => el.addEventListener('input', renderUsers));
      $('new-account').addEventListener('click', openCreateDrawer);
      $('new-cat').addEventListener('click', () => openCatDrawer(null));
      $('new-event').addEventListener('click', () => openEventDrawer(null));
      $('seed-events').addEventListener('click', seedEvents);
      $('eq').addEventListener('input', renderEvents);
      [$('rq'), $('r-status')].forEach(el => el.addEventListener('input', renderEventRegs));
      $('r-export').addEventListener('click', exportRegsCSV);
    }

    // The six interface languages — used by the per-language editor strips.
    const I18N_LANGS = (BBI.i18n && BBI.i18n.LANGS) || [
      { code: 'en' }, { code: 'fr' }, { code: 'ar' }, { code: 'pt' }, { code: 'es' }, { code: 'sw' }
    ];

    // ---- Categories management ----
    let CATS = [];
    async function loadCats() {
      try {
        CATS = await A.listCategories();
        if (!CATS.length) {           // auto-seed from defaults on first use
          await A.seedCategories(BBICats.defaults());
          CATS = await A.listCategories();
        }
      } catch (e) { $('crows').innerHTML = `<div class="notice">Could not load categories: ${e.message || e}</div>`; return; }
      renderCats();
    }
    function renderCats() {
      $('crows').innerHTML = `
        <div class="table-wrap"><table class="adm-table">
          <thead><tr><th>Code</th><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>${CATS.map(c => `<tr>
            <td><span class="tag" style="background:${esc(c.color || '#13654d')}1a;color:${esc(c.color || '#13654d')}">${esc(c.abbr || c.key)}</span></td>
            <td><strong>${esc(c.name)}</strong></td>
            <td class="muted" style="font-size:.85rem">${esc(c.desc || '')}</td>
            <td style="white-space:nowrap">
              <button class="btn btn-outline" style="padding:6px 10px" data-cedit="${esc(c.key)}">Edit</button>
              <button class="btn btn-outline" style="padding:6px 10px;color:#c0392b" data-cdel="${esc(c.key)}">Delete</button>
            </td></tr>`).join('')}</tbody>
        </table></div>`;
      $('crows').querySelectorAll('[data-cedit]').forEach(b => b.addEventListener('click', () => openCatDrawer(b.getAttribute('data-cedit'))));
      $('crows').querySelectorAll('[data-cdel]').forEach(b => b.addEventListener('click', () => removeCat(b.getAttribute('data-cdel'))));
    }
    function openCatDrawer(key) {
      const c = key ? CATS.find(x => x.key === key) : null;
      $('drawer-body').innerHTML = `
        <h2 style="margin-bottom:14px">${c ? 'Edit category' : 'New category'}</h2>
        <form id="cat-form" class="form">
          <div class="grid cols-2">
            <label>Code / key${c ? ' (locked)' : ''}<input name="key" value="${c ? escAttr(c.key) : ''}" ${c ? 'readonly' : 'required'} placeholder="e.g. cba" /></label>
            <label>Short label<input name="abbr" value="${c ? escAttr(c.abbr || '') : ''}" required placeholder="e.g. CBA" /></label>
          </div>
          <label>Name<input name="name" value="${c ? escAttr(c.name || '') : ''}" required /></label>
          <label>Description<textarea name="desc" rows="2">${c ? esc(c.desc || '') : ''}</textarea></label>
          <label>Eligibility<textarea name="eligibility" rows="2">${c ? esc(c.eligibility || '') : ''}</textarea></label>
          <label>Colour<input name="color" type="color" value="${c ? escAttr(c.color || '#13654d') : '#13654d'}" style="height:44px;padding:4px" /></label>
          <button class="btn btn-primary" type="submit">Save category</button>
          <div id="cat-msg" class="notice hidden"></div>
        </form>`;
      showDrawer();
      $('cat-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target, m = $('cat-msg');
        const keyVal = (c ? c.key : f.key.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
        if (!keyVal) { m.textContent = 'Please enter a code/key.'; m.style.background = '#fff8e8'; m.classList.remove('hidden'); return; }
        const cat = {
          key: keyVal, abbr: f.abbr.value, name: f.name.value, desc: f.desc.value,
          eligibility: f.eligibility.value, color: f.color.value,
          order: c ? (c.order != null ? c.order : CATS.length) : CATS.length
        };
        try {
          await A.saveCategory(cat);
          BBICats._cache = null;       // invalidate loader cache
          closeDrawer();
          await loadCats();
        } catch (err) { m.textContent = 'Could not save: ' + (err.message || err); m.style.background = '#fff8e8'; m.classList.remove('hidden'); }
      });
    }
    async function removeCat(key) {
      if (!confirm('Delete this category? Applicants will no longer be able to choose it (existing applications keep their value).')) return;
      try { await A.deleteCategory(key); BBICats._cache = null; await loadCats(); }
      catch (e) { alert('Could not delete: ' + (e.message || e)); }
    }

    // ---- Events management ----
    let EVENTS = [];
    async function loadEvents() {
      try {
        const all = await A.listOfferings();
        EVENTS = all.filter(o => (o.kind || 'event') === 'event');
      } catch (e) { $('erows').innerHTML = `<div class="notice">Could not load events: ${e.message || e}</div>`; return; }
      renderEvents();
    }
    function renderEvents() {
      const term = ($('eq').value || '').toLowerCase().trim();
      const list = EVENTS.filter(e => !term || `${e.title} ${e.loc} ${e.region} ${e.type} ${e.category}`.toLowerCase().includes(term));
      $('ecount').textContent = `${list.length} of ${EVENTS.length}`;
      $('erows').innerHTML = list.length ? `
        <div class="table-wrap"><table class="adm-table">
          <thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Region</th><th>Type</th><th>Reg.</th><th></th></tr></thead>
          <tbody>${list.map(eventRow).join('')}</tbody>
        </table></div>` : `<div class="card center muted">No events yet. Use “+ New event” or “Load sample events”.</div>`;
      $('erows').querySelectorAll('[data-eedit]').forEach(b => b.addEventListener('click', () => openEventDrawer(b.getAttribute('data-eedit'))));
      $('erows').querySelectorAll('[data-edel]').forEach(b => b.addEventListener('click', () => removeEvent(b.getAttribute('data-edel'))));
    }
    function eventRow(e) {
      const reg = e.reg
        ? `<span class="tag" style="background:#0f4f3c1a;color:#0f4f3c">Open</span>`
        : `<span class="tag" style="background:#9991;color:#777">Closed</span>`;
      const date = [e.d, e.m, e.y].filter(Boolean).join(' ');
      return `<tr>
        <td><strong>${esc(e.title || '')}</strong>${e.category ? `<div class="muted" style="font-size:.8rem">${esc(e.category)}</div>` : ''}</td>
        <td>${esc(date)}</td>
        <td>${esc(e.loc || '')}</td>
        <td>${esc(BBI.helpers.regionName(e.region) || e.region || '')}</td>
        <td>${esc(e.type || '')}</td>
        <td>${reg}${e.capacity ? `<div class="muted" style="font-size:.78rem">cap ${esc(e.capacity)}</div>` : ''}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-outline" style="padding:6px 10px" data-eedit="${esc(e.id)}">Edit</button>
          <button class="btn btn-outline" style="padding:6px 10px;color:#c0392b" data-edel="${esc(e.id)}">Delete</button>
        </td></tr>`;
    }
    async function seedEvents() {
      if (!confirm('Load the built-in sample events into the database? Existing events are kept; samples with the same id are overwritten.')) return;
      try {
        await A.seedOfferings(BBI.events.map(e => Object.assign({ kind: 'event' }, e)));
        if (window.BBIOfferings) BBIOfferings._cache = null;
        await loadEvents();
      } catch (e) { alert('Could not load samples: ' + (e.message || e)); }
    }
    async function removeEvent(id) {
      const e = EVENTS.find(x => x.id === id);
      if (!confirm(`Delete event "${e ? e.title : ''}"? This cannot be undone.`)) return;
      try { await A.deleteOffering(id); if (window.BBIOfferings) BBIOfferings._cache = null; await loadEvents(); }
      catch (err) { alert('Could not delete: ' + (err.message || err)); }
    }
    function langStrip(group) {
      // A small tab strip (EN FR AR PT ES SW). The first tab is active.
      return `<div class="tabs lang-strip" data-langstrip="${group}" style="max-width:none;margin-bottom:12px">
        ${I18N_LANGS.map((l, i) => `<button type="button" class="tab${i === 0 ? ' active' : ''}" data-lang="${l.code}">${l.code.toUpperCase()}</button>`).join('')}
      </div>`;
    }
    function wireLangStrip(group, onSwitch) {
      const strip = document.querySelector(`[data-langstrip="${group}"]`);
      if (!strip) return;
      strip.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
        strip.querySelectorAll('[data-lang]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        onSwitch(b.getAttribute('data-lang'));
      }));
    }
    function openEventDrawer(id) {
      const e = id ? (EVENTS.find(x => x.id === id) || {}) : {};
      const i18n = JSON.parse(JSON.stringify(e.i18n || {}));   // working copy of translations
      let curLang = 'en';
      const regionOpts = BBI.regions.map(r => `<option value="${r.key}" ${e.region === r.key ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
      $('drawer-body').innerHTML = `
        <h2 style="margin-bottom:14px">${id ? 'Edit event' : 'New event'}</h2>
        <form id="e-form" class="form">
          ${langStrip('event')}
          <p class="muted" id="e-langnote" style="margin:-4px 0 10px;font-size:.82rem"></p>
          <label>Title<input id="e-title" /></label>
          <label>Description<textarea id="e-desc" rows="3"></textarea></label>
          <label>Location<input id="e-loc" /></label>
          <div class="grid cols-3 lang-en-only">
            <label>Day<input name="d" value="${escAttr(e.d || '')}" placeholder="e.g. 22" /></label>
            <label>Month<input name="m" value="${escAttr(e.m || '')}" placeholder="e.g. Jan" /></label>
            <label>Year<input name="y" value="${escAttr(e.y || '')}" placeholder="e.g. 2026" /></label>
          </div>
          <div class="grid cols-2 lang-en-only">
            <label>Region<select name="region"><option value="">—</option>${regionOpts}</select></label>
            <label>Type<input name="type" value="${escAttr(e.type || '')}" placeholder="Conference / Training / Workshop / Summit" /></label>
          </div>
          <div class="grid cols-2 lang-en-only">
            <label>Category<input name="category" value="${escAttr(e.category || '')}" placeholder="Optional grouping" /></label>
            <label>Capacity<input name="capacity" type="number" min="0" value="${escAttr(e.capacity != null ? e.capacity : '')}" placeholder="Optional" /></label>
          </div>
          <label class="chk-row lang-en-only"><input type="checkbox" name="reg" ${e.reg ? 'checked' : ''} /> Registration open</label>
          <button class="btn btn-primary" type="submit">Save event</button>
          <div id="e-msg" class="notice hidden"></div>
        </form>`;
      showDrawer();

      const tEl = $('e-title'), dEl = $('e-desc'), lEl = $('e-loc'), note = $('e-langnote');
      function valuesFor(lang) {
        if (lang === 'en') return { title: e.title || '', desc: e.desc || '', loc: e.loc || '' };
        const tr = i18n[lang] || {};
        return { title: tr.title || '', desc: tr.desc || '', loc: tr.loc || '' };
      }
      function loadLang(lang) {
        const v = valuesFor(lang);
        tEl.value = v.title; dEl.value = v.desc; lEl.value = v.loc;
        const en = lang === 'en';
        tEl.placeholder = en ? '' : (e.title || '') + ' (English fallback)';
        dEl.placeholder = en ? '' : (e.desc || '') + (e.desc ? ' (English fallback)' : '');
        lEl.placeholder = en ? '' : (e.loc || '') + (e.loc ? ' (English fallback)' : '');
        note.textContent = en
          ? 'English is the base. Date, region, type, etc. are shared across languages.'
          : `Translating ${lang.toUpperCase()} — leave a field blank to fall back to the English text.`;
        document.querySelectorAll('#e-form .lang-en-only').forEach(x => x.style.display = en ? '' : 'none');
      }
      function stash(lang) {
        const title = tEl.value, desc = dEl.value, loc = lEl.value;
        if (lang === 'en') { e.title = title; e.desc = desc; e.loc = loc; }
        else { i18n[lang] = { title, desc, loc }; }
      }
      loadLang('en');
      wireLangStrip('event', (lang) => { stash(curLang); curLang = lang; loadLang(lang); });

      $('e-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        stash(curLang);
        const f = ev.target, m = $('e-msg');
        if (!(e.title || '').trim()) {
          curLang = 'en'; const strip = document.querySelector('[data-langstrip="event"]');
          strip.querySelectorAll('[data-lang]').forEach(x => x.classList.toggle('active', x.getAttribute('data-lang') === 'en'));
          loadLang('en');
          m.textContent = 'Please enter the English title.'; m.style.background = '#fff8e8'; m.classList.remove('hidden'); return;
        }
        // strip empty translation maps so we don't store noise
        Object.keys(i18n).forEach(k => {
          const v = i18n[k] || {};
          if (!((v.title || '').trim() || (v.desc || '').trim() || (v.loc || '').trim())) delete i18n[k];
        });
        const cap = parseInt(f.capacity.value, 10);
        const obj = {
          id: id || undefined, kind: 'event',
          title: e.title.trim(), desc: (e.desc || '').trim(), loc: (e.loc || '').trim(),
          d: f.d.value.trim(), m: f.m.value.trim(), y: f.y.value.trim(),
          region: f.region.value, type: f.type.value.trim(), category: f.category.value.trim(),
          reg: f.reg.checked, capacity: isNaN(cap) ? null : cap,
          i18n: i18n
        };
        if (e.order != null) obj.order = e.order;
        try { await A.saveOffering(obj); if (window.BBIOfferings) BBIOfferings._cache = null; closeDrawer(); await loadEvents(); }
        catch (err) { m.textContent = 'Could not save: ' + (err.message || err); m.style.background = '#fff8e8'; m.classList.remove('hidden'); }
      });
    }

    // ---- Event sign-ups (registrations for events / courses / activities) ----
    let EREGS = [];
    async function loadEventRegs() {
      try { EREGS = await A.allRegistrations(); }
      catch (e) { $('rrows').innerHTML = `<div class="notice">Could not load sign-ups: ${e.message || e}</div>`; return; }
      // populate the status filter once from the data + common statuses
      const sel = $('r-status');
      if (sel.options.length <= 1) {
        const statuses = [...new Set(['pending', 'registered', 'waitlisted', 'rejected', 'attended', 'cancelled'].concat(EREGS.map(r => r.status).filter(Boolean)))];
        statuses.forEach(s => sel.add(new Option(s.charAt(0).toUpperCase() + s.slice(1), s)));
      }
      renderEventRegs();
    }
    function regName(r) { return r.name || r.fullName || (r.profile && r.profile.name) || '—'; }
    function regTitle(r) { return r.offeringTitle || r.title || r.eventTitle || r.offering || r.offeringId || '—'; }
    function regKind(r) { return r.kind || r.offeringKind || 'event'; }
    function filteredRegs() {
      const term = ($('rq').value || '').toLowerCase().trim();
      const st = $('r-status').value;
      return EREGS.filter(r => {
        if (st && r.status !== st) return false;
        if (term && !(`${regName(r)} ${r.email || ''} ${regTitle(r)}`.toLowerCase().includes(term))) return false;
        return true;
      }).sort((a, b) => ((a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1))
        || ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }
    function renderEventRegs() {
      const list = filteredRegs();
      $('rcount').textContent = `${list.length} of ${EREGS.length}`;
      $('rrows').innerHTML = list.length ? `
        <div class="table-wrap"><table class="adm-table">
          <thead><tr><th>Registrant</th><th>Email</th><th>Offering</th><th>Kind</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>${list.map(regRow).join('')}</tbody>
        </table></div>` : `<div class="card center muted">No sign-ups match.</div>`;
      $('rrows').querySelectorAll('[data-rstatus]').forEach(sel => sel.addEventListener('change', () => changeRegStatus(sel.getAttribute('data-rstatus'), sel.value).then(renderEventRegs)));
      $('rrows').querySelectorAll('[data-rappr]').forEach(b => b.addEventListener('click', () => changeRegStatus(b.getAttribute('data-rappr'), 'registered').then(renderEventRegs)));
      $('rrows').querySelectorAll('[data-rrej]').forEach(b => b.addEventListener('click', () => changeRegStatus(b.getAttribute('data-rrej'), 'rejected').then(renderEventRegs)));
      $('rrows').querySelectorAll('[data-rdel]').forEach(b => b.addEventListener('click', () => removeReg(b.getAttribute('data-rdel'))));
    }
    function regRow(r) {
      const statusOpts = [...new Set(['pending', 'registered', 'waitlisted', 'rejected', 'attended', 'cancelled'].concat(r.status ? [r.status] : []))]
        .map(s => `<option value="${esc(s)}" ${r.status === s ? 'selected' : ''}>${esc(s.charAt(0).toUpperCase() + s.slice(1))}</option>`).join('');
      return `<tr>
        <td><strong>${esc(regName(r))}</strong></td>
        <td>${esc(r.email || '')}</td>
        <td>${esc(regTitle(r))}</td>
        <td>${esc(regKind(r))}</td>
        <td><select class="reg-status" data-rstatus="${esc(r.id)}" style="padding:6px 8px;font:inherit;border:1px solid var(--line);border-radius:8px">${statusOpts}</select></td>
        <td>${BBI.fmtDate(r.createdAt)}</td>
        <td style="white-space:nowrap">
          ${r.status === 'pending' ? `<button class="btn btn-primary" style="padding:6px 10px" data-rappr="${esc(r.id)}">Approve</button> <button class="btn btn-outline" style="padding:6px 10px;color:#c0392b" data-rrej="${esc(r.id)}">Reject</button> ` : ''}
          <button class="btn btn-outline" style="padding:6px 10px;color:#c0392b" data-rdel="${esc(r.id)}">Delete</button>
        </td>
      </tr>`;
    }
    async function changeRegStatus(id, status) {
      try {
        await A.setRegStatus(id, status);
        const r = EREGS.find(x => x.id === id); if (r) r.status = status;
      } catch (e) { alert('Could not update: ' + (e.message || e)); }
    }
    async function removeReg(id) {
      const r = EREGS.find(x => x.id === id);
      if (!confirm(`Delete the sign-up from ${r ? regName(r) : 'this person'}? This cannot be undone.`)) return;
      try { await A.deleteRegistration(id); EREGS = EREGS.filter(x => x.id !== id); renderEventRegs(); }
      catch (e) { alert('Could not delete: ' + (e.message || e)); }
    }
    function exportRegsCSV() {
      const head = ['name', 'email', 'offering', 'kind', 'status', 'date'].join(',');
      const rows = filteredRegs().map(r => [
        csv(regName(r)), csv(r.email), csv(regTitle(r)), csv(regKind(r)), csv(r.status), csv(BBI.fmtDate(r.createdAt))
      ].join(','));
      const blob = new Blob([head + '\n' + rows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'bbi-event-signups.csv'; link.click();
      URL.revokeObjectURL(url);
    }

    // ---- Directory editor ----
    let DIR = [];
    async function loadDir() {
      try { await BBICats.load(); } catch (e) {}
      try { DIR = await A.listDirectory(); } catch (e) { DIR = []; }
      if (!DIR.length) {
        try { await A.seedDirectory(BBIDir.defaults()); DIR = await A.listDirectory(); } catch (e) {}
      }
      populateDirLevels();
      renderDir();
    }
    function populateDirLevels() {
      const sel = $('d-level'), cur = sel.value;
      const levels = BBI.helpers.sortedLevels(DIR);
      sel.length = 1; // keep the "All levels" option
      levels.forEach(l => sel.add(new Option(l, l)));
      if (levels.includes(cur)) sel.value = cur;
    }
    function renderDir() {
      const term = ($('dq').value || '').toLowerCase().trim();
      const lvl = $('d-level').value;
      const list = DIR.filter(p => (!lvl || p.level === lvl) && (!term || `${p.name} ${p.org} ${p.country} ${p.role}`.toLowerCase().includes(term)));
      $('dcount').textContent = `${list.length} of ${DIR.length}`;
      $('drows').innerHTML = list.length ? `
        <div class="table-wrap"><table class="adm-table">
          <thead><tr><th>Name</th><th>Role / Org</th><th>Country</th><th>Certs</th><th></th></tr></thead>
          <tbody>${list.map(dirRow).join('')}</tbody>
        </table></div>` : `<div class="card center muted">No profiles.</div>`;
      $('drows').querySelectorAll('[data-pedit]').forEach(b => b.addEventListener('click', () => openProfileDrawer(b.getAttribute('data-pedit'))));
      $('drows').querySelectorAll('[data-pdel]').forEach(b => b.addEventListener('click', () => removeProfile(b.getAttribute('data-pdel'))));
    }
    function dirRow(p) {
      const certs = (p.certs || []).map(c => esc(BBICats.get(c.t).abbr || c.t)).join(', ');
      return `<tr>
        <td><strong>${esc(p.name || '')}</strong>${p.mentor ? ' <span class="tag gold" style="font-size:.7rem">Mentor</span>' : ''}</td>
        <td>${esc(p.role || '')}<div class="muted" style="font-size:.8rem">${esc(p.org || '')}</div></td>
        <td>${esc(p.country || '')}</td>
        <td class="muted" style="font-size:.82rem">${certs}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-outline" style="padding:6px 10px" data-pedit="${esc(p.id)}">Edit</button>
          <button class="btn btn-outline" style="padding:6px 10px;color:#c0392b" data-pdel="${esc(p.id)}">Delete</button>
        </td></tr>`;
    }
    async function removeProfile(id) {
      const p = DIR.find(x => x.id === id);
      if (!confirm(`Delete profile "${p ? p.name : ''}"? This cannot be undone.`)) return;
      try { await A.deleteProfile(id); BBIDir._cache = null; await loadDir(); }
      catch (e) { alert('Could not delete: ' + (e.message || e)); }
    }
    function certRowHtml(c, cats) {
      const opts = cats.map(ct => `<option value="${esc(ct.key)}" ${c.t === ct.key ? 'selected' : ''}>${esc(ct.name)}</option>`).join('');
      return `<div class="ecc-row">
        <select data-certarea style="flex:2"><option value="">— area —</option>${opts}</select>
        <input data-certyear type="number" placeholder="Year" value="${c.y || ''}" style="flex:1;max-width:110px" />
        <button type="button" class="btn btn-outline ecc-x" data-certdel>×</button>
      </div>`;
    }
    function openProfileDrawer(id) {
      const p = id ? (DIR.find(x => x.id === id) || {}) : {};
      const cats = BBICats._cache || BBICats.defaults();
      const regionOpts = BBI.regions.map(r => `<option value="${r.key}" ${p.region === r.key ? 'selected' : ''}>${r.name}</option>`).join('');
      const certRows = (p.certs || []).map(c => certRowHtml(c, cats)).join('');
      $('drawer-body').innerHTML = `
        <h2 style="margin-bottom:14px">${id ? 'Edit profile' : 'Add profile'}</h2>
        <form id="p-form" class="form">
          <label>Full name<input name="name" value="${escAttr(p.name || '')}" required /></label>
          <div class="grid cols-2">
            <label>Role<input name="role" value="${escAttr(p.role || '')}" /></label>
            <label>Organisation<input name="org" value="${escAttr(p.org || '')}" /></label>
          </div>
          <div class="grid cols-2">
            <label>Country<input name="country" value="${escAttr(p.country || '')}" /></label>
            <label>Region<select name="region"><option value="">—</option>${regionOpts}</select></label>
          </div>
          <div class="grid cols-2">
            <label>Level<input name="level" value="${escAttr(p.level || '')}" placeholder="e.g. Level I, Level II, SME" /></label>
            <label class="chk-row" style="align-items:center;margin-top:22px"><input type="checkbox" name="mentor" ${p.mentor ? 'checked' : ''} /> Available as mentor</label>
          </div>
          <label>LinkedIn URL<input name="linkedin" value="${escAttr(p.linkedin || '')}" /></label>
          <label>Headshot photo URL<input name="photo" value="${escAttr(p.photo || '')}" /></label>
          <label>Specialties (comma separated)<input name="specialties" value="${escAttr((p.specialties || []).join(', '))}" /></label>
          <label>Spotlight citation <span class="muted" style="font-weight:400">(optional — shows as Biosafety Hero)</span><textarea name="hero" rows="2">${esc(p.hero || '')}</textarea></label>
          <label>Biography<textarea name="bio" rows="3">${esc(p.bio || '')}</textarea></label>
          <div>
            <label style="margin-bottom:6px">Certifications</label>
            <div id="cert-rows">${certRows}</div>
            <button type="button" class="btn btn-outline" id="add-cert">+ Add certification</button>
          </div>
          <button class="btn btn-primary" type="submit">Save profile</button>
          <div id="p-msg" class="notice hidden"></div>
        </form>`;
      showDrawer();
      $('cert-rows').querySelectorAll('[data-certdel]').forEach(b => b.addEventListener('click', () => b.closest('.ecc-row').remove()));
      $('add-cert').addEventListener('click', () => {
        const wrap = document.createElement('div');
        wrap.innerHTML = certRowHtml({}, cats);
        const row = wrap.firstElementChild;
        $('cert-rows').appendChild(row);
        row.querySelector('[data-certdel]').addEventListener('click', () => row.remove());
      });
      $('p-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target, m = $('p-msg');
        const certs = [];
        $('cert-rows').querySelectorAll('.ecc-row').forEach(r => {
          const t = r.querySelector('[data-certarea]').value;
          const y = parseInt(r.querySelector('[data-certyear]').value, 10);
          if (t) certs.push({ t: t, y: isNaN(y) ? null : y });
        });
        const prof = {
          id: id || undefined,
          name: f.name.value, role: f.role.value, org: f.org.value, country: f.country.value,
          region: f.region.value, level: f.level.value, mentor: f.mentor.checked,
          linkedin: f.linkedin.value.trim(), photo: f.photo.value.trim(),
          specialties: f.specialties.value.split(',').map(s => s.trim()).filter(Boolean),
          hero: f.hero.value.trim(), bio: f.bio.value.trim(), certs: certs
        };
        if (p.order != null) prof.order = p.order;
        try { await A.saveProfile(prof); BBIDir._cache = null; closeDrawer(); await loadDir(); }
        catch (err) { m.textContent = 'Could not save: ' + (err.message || err); m.style.background = '#fff8e8'; m.classList.remove('hidden'); }
      });
    }

    // ---- Home page editor (per-language) ----
    let HOME = null, homeLang = 'en';
    function normHome(h) {
      h.stats = h.stats || [];
      while (h.stats.length < 4) h.stats.push({ num: 0, suffix: '', label: '', sub: '' });
      return h;
    }
    async function loadHome() {
      try { HOME = await A.getSetting('home'); } catch (e) { HOME = null; }
      if (!HOME) HOME = JSON.parse(JSON.stringify(BBI.home));
      HOME.__i18n = HOME.__i18n || {};
      normHome(HOME);
      homeLang = 'en';
      renderHomeEditor();
    }
    // The editable object for the active language: base fields for English,
    // else a per-language clone under HOME.__i18n[lang] (seeded from the base so
    // numbers/symbols carry over and the public override is self-contained).
    function homeView() {
      if (homeLang === 'en') return HOME;
      if (!HOME.__i18n[homeLang]) {
        HOME.__i18n[homeLang] = JSON.parse(JSON.stringify({ heroTitle: '', heroLead: '', stats: HOME.stats }));
        HOME.__i18n[homeLang].stats.forEach(s => { s.label = ''; s.sub = ''; });
      }
      return normHome(HOME.__i18n[homeLang]);
    }
    function homeSync() {
      const v = homeView();
      const ti = $('h-title'), le = $('h-lead');
      if (ti) v.heroTitle = ti.value;
      if (le) v.heroLead = le.value;
      document.querySelectorAll('#home-editor [data-h]').forEach(inp => {
        const p = inp.getAttribute('data-h').split('.');
        let val = inp.value;
        if (p[1] === 'num') val = parseFloat(val) || 0;
        v.stats[p[0]][p[1]] = val;
      });
    }
    function renderHomeEditor() {
      const v = homeView();
      const en = homeLang === 'en';
      $('home-editor').innerHTML = `
        ${langStrip('home')}
        <p class="muted" style="margin:-4px 0 12px;font-size:.82rem">${en
          ? 'English is the base content shown to everyone by default.'
          : `Translating ${homeLang.toUpperCase()} — fill in the headings for this language; numbers/symbols default to the English values.`}</p>
        <div class="card" style="text-align:left;margin-bottom:16px">
          <h3 style="margin-top:0">Hero</h3>
          <label class="form" style="margin:0 0 12px">Title
            <input id="h-title" value="${escAttr(v.heroTitle || '')}" />
          </label>
          <label class="form" style="margin:0">Subtitle <span class="muted" style="font-weight:400">(HTML allowed, e.g. &lt;strong&gt;)</span>
            <textarea id="h-lead" rows="4">${esc(v.heroLead || '')}</textarea>
          </label>
        </div>
        <div class="card" style="text-align:left;margin-bottom:16px">
          <h3 style="margin-top:0">Headline statistics</h3>
          ${v.stats.slice(0, 4).map((s, i) => `
            <div class="ecc-row">
              <input data-h="${i}.num" value="${escAttr(s.num != null ? s.num : '')}" placeholder="Number" style="max-width:110px" />
              <input data-h="${i}.suffix" value="${escAttr(s.suffix || '')}" placeholder="+ / %" style="max-width:80px" />
              <input data-h="${i}.label" value="${escAttr(s.label || '')}" placeholder="Label" />
              <input data-h="${i}.sub" value="${escAttr(s.sub || '')}" placeholder="Sub-label" />
            </div>`).join('')}
        </div>
        <div style="text-align:left">
          <button class="btn btn-primary" id="home-save">Save home content</button>
          <button class="btn btn-outline" id="home-reset" type="button">↺ Load latest from code</button>
          <a class="btn btn-outline" href="index.html" target="_blank" rel="noopener">Preview ↗</a>
          <span id="home-msg" class="muted" style="margin-left:10px"></span>
        </div>`;
      wireLangStrip('home', (lang) => { homeSync(); homeLang = lang; renderHomeEditor(); });
      $('home-reset').addEventListener('click', () => {
        const keep = HOME.__i18n;
        HOME = normHome(JSON.parse(JSON.stringify(BBI.home)));
        HOME.__i18n = keep || {};           // keep existing translations
        homeLang = 'en';
        renderHomeEditor();
        const m = $('home-msg'); m.textContent = 'Loaded the latest content from code — review, then Save to publish.'; m.style.color = '#0f4f3c';
      });
      $('home-save').addEventListener('click', async () => {
        homeSync();
        const m = $('home-msg'); m.textContent = 'Saving…'; m.style.color = '';
        try { await A.saveSetting('home', HOME); m.textContent = 'Saved ✓'; m.style.color = '#0f4f3c'; }
        catch (e) { m.textContent = 'Could not save: ' + (e.message || e); m.style.color = '#c0392b'; }
      });
    }

    // ---- ECC content editor ----
    let ECC = null;
    const ECC_COLS = {
      mandate: [{ f: 'icon', ph: 'Icon' }, { f: 'title', ph: 'Title' }, { f: 'text', ph: 'Description' }],
      leadership: [{ f: 'name', ph: 'Name' }, { f: 'role', ph: 'Role' }, { f: 'org', ph: 'Organisation' }, { f: 'country', ph: 'Country / Region' }],
      members: [{ f: 'name', ph: 'Name' }, { f: 'role', ph: 'Role / expertise' }, { f: 'country', ph: 'Country / Region' }],
      history: [{ f: 'yr', ph: 'Year' }, { f: 'title', ph: 'Title' }, { f: 'text', ph: 'Description' }]
    };
    let eccLang = 'en';
    function normEcc(e) { ['mandate', 'leadership', 'members', 'history'].forEach(k => { e[k] = e[k] || []; }); return e; }
    async function loadEcc() {
      try { ECC = await A.getSetting('ecc'); } catch (e) { ECC = null; }
      if (!ECC) ECC = JSON.parse(JSON.stringify(BBI.ecc));
      ECC.__i18n = ECC.__i18n || {};
      normEcc(ECC);
      eccLang = 'en';
      renderEcc();
    }
    // The editable ECC object for the active language: base for English, else a
    // per-language clone under ECC.__i18n[lang] seeded from the base structure
    // (so the row layout matches and the public override is self-contained).
    function eccView() {
      if (eccLang === 'en') return ECC;
      if (!ECC.__i18n[eccLang]) {
        const clone = JSON.parse(JSON.stringify({ about: '', mandate: ECC.mandate, leadership: ECC.leadership, members: ECC.members, history: ECC.history }));
        // blank the translatable text fields, keep structural/shared fields
        clone.mandate.forEach(x => { x.title = ''; x.text = ''; });
        clone.leadership.forEach(x => { x.role = ''; x.country = ''; });
        clone.members.forEach(x => { x.role = ''; x.country = ''; });
        clone.history.forEach(x => { x.title = ''; x.text = ''; });
        ECC.__i18n[eccLang] = clone;
      }
      return normEcc(ECC.__i18n[eccLang]);
    }
    function eccSync() {
      const E = eccView();
      const ab = $('ecc-about'); if (ab) E.about = ab.value;
      document.querySelectorAll('#ecc-editor [data-ecc]').forEach(inp => {
        const p = inp.getAttribute('data-ecc').split('.');
        if (E[p[0]] && E[p[0]][p[1]]) E[p[0]][p[1]][p[2]] = inp.value;
      });
    }
    function eccList(list, label) {
      const cols = ECC_COLS[list];
      const E = eccView();
      const rows = E[list].map((it, i) => `
        <div class="ecc-row">
          ${cols.map(c => `<input data-ecc="${list}.${i}.${c.f}" value="${escAttr(it[c.f] || '')}" placeholder="${c.ph}" />`).join('')}
          <button type="button" class="btn btn-outline ecc-x" data-eccdel="${list}.${i}">×</button>
        </div>`).join('');
      return `<div class="card" style="text-align:left;margin-bottom:16px">
        <h3 style="margin-top:0">${label}</h3>
        <div>${rows || '<p class="muted">None yet.</p>'}</div>
        <button type="button" class="btn btn-outline" data-eccadd="${list}">+ Add</button>
      </div>`;
    }
    function renderEcc() {
      const E = eccView();
      const en = eccLang === 'en';
      $('ecc-editor').innerHTML = `
        ${langStrip('ecc')}
        <p class="muted" style="margin:-4px 0 12px;font-size:.82rem">${en
          ? 'English is the base content shown to everyone by default.'
          : `Translating ${eccLang.toUpperCase()} — fill in the text for this language; rows mirror the English structure.`}</p>
        <div class="card" style="text-align:left;margin-bottom:16px">
          <h3 style="margin-top:0">About</h3>
          <textarea id="ecc-about" rows="4" style="width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px">${esc(E.about || '')}</textarea>
        </div>
        ${eccList('mandate', 'Mandate')}
        ${eccList('leadership', 'Leadership')}
        ${eccList('members', 'Members')}
        ${eccList('history', 'History')}
        <div style="text-align:left">
          <button class="btn btn-primary" id="ecc-save">Save ECC content</button>
          <button class="btn btn-outline" id="ecc-reset" type="button">↺ Load latest from code</button>
          <a class="btn btn-outline" href="ecc.html" target="_blank" rel="noopener">Preview page ↗</a>
          <span id="ecc-msg" class="muted" style="margin-left:10px"></span>
        </div>`;
      wireLangStrip('ecc', (lang) => { eccSync(); eccLang = lang; renderEcc(); });
      $('ecc-editor').querySelectorAll('[data-eccadd]').forEach(b => b.addEventListener('click', () => {
        eccSync(); eccView()[b.getAttribute('data-eccadd')].push({}); renderEcc();
      }));
      $('ecc-editor').querySelectorAll('[data-eccdel]').forEach(b => b.addEventListener('click', () => {
        eccSync(); const p = b.getAttribute('data-eccdel').split('.'); eccView()[p[0]].splice(p[1], 1); renderEcc();
      }));
      $('ecc-reset').addEventListener('click', () => {
        const keep = ECC.__i18n;
        ECC = normEcc(JSON.parse(JSON.stringify(BBI.ecc)));
        ECC.__i18n = keep || {};            // keep existing translations
        eccLang = 'en';
        renderEcc();
        const m = $('ecc-msg'); m.textContent = 'Loaded the latest content from code — review, then Save to publish.'; m.style.color = '#0f4f3c';
      });
      $('ecc-save').addEventListener('click', async () => {
        eccSync();
        const m = $('ecc-msg');
        m.textContent = 'Saving…'; m.style.color = '';
        try { await A.saveSetting('ecc', ECC); m.textContent = 'Saved ✓'; m.style.color = '#0f4f3c'; }
        catch (e) { m.textContent = 'Could not save: ' + (e.message || e); m.style.color = '#c0392b'; }
      });
    }

    function showDrawer() { $('drawer').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
    function escAttr(s) { return esc(s).replace(/'/g, '&#39;'); }
    async function refreshUsers() { try { USERS = await A.allUsers(); } catch (e) {} renderUsers(); }
    async function refreshApps() { try { ALL = await A.allApplications(); } catch (e) {} render(); }

    function renderUsers() {
      const term = ($('uq').value || '').toLowerCase().trim();
      const filt = $('f-appr').value;
      const pendingCount = USERS.filter(u => !u.approved).length;
      $('pending-pill').innerHTML = pendingCount ? `<span class="tag gold" style="margin-left:4px">${pendingCount}</span>` : '';
      const list = USERS.filter(u => {
        if (filt === 'pending' && u.approved) return false;
        if (filt === 'approved' && !u.approved) return false;
        if (term && !(`${u.name} ${u.email} ${u.country} ${u.org}`.toLowerCase().includes(term))) return false;
        return true;
      });
      $('ucount').textContent = `${list.length} of ${USERS.length}`;
      $('urows').innerHTML = list.length ? `
        <div class="table-wrap"><table class="adm-table">
          <thead><tr><th>Name</th><th>Email</th><th>Country / Org</th><th>Registered</th><th>Status</th><th></th></tr></thead>
          <tbody>${list.map(userRow).join('')}</tbody>
        </table></div>` : `<div class="card center muted">No registrations match.</div>`;
      $('urows').querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', () => toggleApprove(b.getAttribute('data-approve'), true)));
      $('urows').querySelectorAll('[data-revoke]').forEach(b => b.addEventListener('click', () => toggleApprove(b.getAttribute('data-revoke'), false)));
      $('urows').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openUserDrawer(b.getAttribute('data-edit'))));
      $('urows').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeUser(b.getAttribute('data-del'))));
    }

    function userRow(u) {
      const badge = u.approved
        ? `<span class="tag" style="background:#0f4f3c1a;color:#0f4f3c">Approved</span>`
        : `<span class="tag gold">Pending</span>`;
      const approveBtn = u.approved
        ? `<button class="btn btn-outline" style="padding:6px 10px" data-revoke="${u.uid}">Revoke</button>`
        : `<button class="btn btn-primary" style="padding:6px 10px" data-approve="${u.uid}">Approve</button>`;
      return `<tr>
        <td><strong>${esc(u.name || '—')}</strong></td>
        <td>${esc(u.email || '')}</td>
        <td>${esc(u.country || '')}<div class="muted" style="font-size:.8rem">${esc(u.org || '')}</div></td>
        <td>${BBI.fmtDate(u.createdAt)}</td>
        <td>${badge}</td>
        <td style="white-space:nowrap">
          ${approveBtn}
          <button class="btn btn-outline" style="padding:6px 10px" data-edit="${u.uid}">Edit</button>
          <button class="btn btn-outline" style="padding:6px 10px;color:#c0392b" data-del="${u.uid}">Delete</button>
        </td>
      </tr>`;
    }

    function openUserDrawer(uid) {
      const u = USERS.find(x => x.uid === uid); if (!u) return;
      $('drawer-body').innerHTML = `
        <h2 style="margin-bottom:2px">Edit applicant</h2>
        <div class="muted" style="margin-bottom:16px">${esc(u.email || '')}</div>
        <form id="u-form" class="form">
          <label>Full name<input name="name" value="${escAttr(u.name || '')}" required /></label>
          <label>Country<input name="country" value="${escAttr(u.country || '')}" /></label>
          <label>Organisation<input name="org" value="${escAttr(u.org || '')}" /></label>
          <label class="chk-row"><input type="checkbox" name="approved" ${u.approved ? 'checked' : ''} /> Approved (can submit applications)</label>
          <button class="btn btn-primary" type="submit">Save changes</button>
          <div id="u-msg" class="notice hidden"></div>
        </form>
        <hr style="margin:20px 0;border:none;border-top:1px solid #e5e5e5" />
        <h3 style="margin-bottom:4px">Password</h3>
        <p class="muted" style="margin-bottom:10px">Passwords can't be viewed or set by admins. Email the user a secure link to choose a new one.</p>
        <button class="btn btn-outline" type="button" id="u-reset-pw">Send password reset email</button>`;
      showDrawer();
      $('u-reset-pw').addEventListener('click', async () => {
        const m = $('u-msg'), btn = $('u-reset-pw');
        btn.disabled = true;
        try {
          await A.resetPassword(u.email);
          m.textContent = 'Password reset email sent to ' + (u.email || '') + '.';
          m.style.background = '#e3f2ec'; m.classList.remove('hidden');
        } catch (err) {
          m.textContent = 'Could not send reset email: ' + (err.message || err);
          m.style.background = '#fff8e8'; m.classList.remove('hidden');
        }
        btn.disabled = false;
      });
      $('u-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target, m = $('u-msg');
        try {
          await A.updateUser(uid, { name: f.name.value, country: f.country.value, org: f.org.value, approved: f.approved.checked });
          closeDrawer();
          await refreshUsers();
        } catch (err) { m.textContent = 'Could not save: ' + (err.message || err); m.style.background = '#fff8e8'; m.classList.remove('hidden'); }
      });
    }

    function openCreateDrawer() {
      $('drawer-body').innerHTML = `
        <h2 style="margin-bottom:2px">Create new account</h2>
        <div class="muted" style="margin-bottom:16px">The person receives an email to set their own password.</div>
        <form id="c-form" class="form">
          <label>Email<input type="email" name="email" required /></label>
          <label>Full name<input name="name" required /></label>
          <label>Country<input name="country" /></label>
          <label>Organisation<input name="org" /></label>
          <label class="chk-row"><input type="checkbox" name="approved" checked /> Approve immediately</label>
          <button class="btn btn-primary" type="submit" id="c-btn">Create account</button>
          <div id="c-msg" class="notice hidden"></div>
        </form>`;
      showDrawer();
      $('c-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target, m = $('c-msg'), b = $('c-btn');
        b.disabled = true; b.textContent = 'Creating…'; m.classList.add('hidden');
        try {
          await A.adminCreateUser({ email: f.email.value.trim(), name: f.name.value, country: f.country.value, org: f.org.value, approved: f.approved.checked });
          closeDrawer();
          await refreshUsers();
        } catch (err) {
          const c = (err && err.code) || '';
          m.textContent = c.includes('email-already-in-use') ? 'That email already has an account.' : 'Could not create: ' + (err.message || err);
          m.style.background = '#fff8e8'; m.classList.remove('hidden');
        } finally { b.disabled = false; b.textContent = 'Create account'; }
      });
    }

    async function removeUser(uid) {
      const u = USERS.find(x => x.uid === uid);
      if (!confirm(`Delete ${u ? (u.name || u.email) : 'this applicant'} and all their applications?\n\nThis removes their access here. (Their login can be fully deleted from the Firebase console.)`)) return;
      try {
        await A.deleteUser(uid);
        await refreshUsers();
        await refreshApps();
      } catch (e) { alert('Could not delete: ' + (e.message || e)); }
    }

    async function toggleApprove(uid, approved) {
      try {
        await A.setApproved(uid, approved);
        const u = USERS.find(x => x.uid === uid);
        if (u) u.approved = approved;
        renderUsers();
      } catch (e) { alert('Could not update: ' + (e.message || e)); }
    }

    function initFilters() {
      const fs = $('f-status'), fa = $('f-area');
      BBI.STATUSES.forEach(s => fs.add(new Option(s.label, s.key)));
      BBI.certTypes.forEach(c => fa.add(new Option(c.name, c.key)));
      [$('q'), fs, fa].forEach(el => el.addEventListener('input', render));
      $('export').addEventListener('click', exportCSV);
      $('drawer-close').addEventListener('click', closeDrawer);
      $('drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer') closeDrawer(); });
    }

    function filtered() {
      const term = ($('q').value || '').toLowerCase().trim();
      const st = $('f-status').value, ar = $('f-area').value;
      return ALL.filter(a => {
        if (st && a.status !== st) return false;
        if (ar && a.area !== ar) return false;
        if (term) {
          const hay = `${a.name} ${a.org} ${a.country} ${a.email}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      });
    }

    function render() {
      // stats
      const byStatus = {};
      ALL.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
      $('stats').innerHTML = `
        <div class="stat"><div class="num">${ALL.length}</div><div class="lbl">Total applications</div></div>
        ${['submitted', 'under_review', 'approved'].map(k => {
          const s = BBI.statusMeta(k);
          return `<div class="stat"><div class="num">${byStatus[k] || 0}</div><div class="lbl">${s.label}</div></div>`;
        }).join('')}`;

      const list = filtered();
      $('count').textContent = `${list.length} of ${ALL.length}`;
      $('rows').innerHTML = list.length ? `
        <div class="table-wrap"><table class="adm-table">
          <thead><tr><th>Applicant</th><th>Area / Level</th><th>Pathway</th><th>Exp.</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>${list.map(rowHtml).join('')}</tbody>
        </table></div>` : `<div class="card center muted">No applications match.</div>`;

      $('rows').querySelectorAll('[data-view]').forEach(b =>
        b.addEventListener('click', () => openDrawer(b.getAttribute('data-view'))));
    }

    function rowHtml(a) {
      const area = (BBI.helpers.certType(a.area).name) || a.areaName || a.area;
      return `<tr>
        <td><strong>${esc(a.name)}</strong><div class="muted" style="font-size:.8rem">${esc(a.org || '')} · ${esc(a.country || '')}</div><div class="muted" style="font-size:.8rem">${esc(a.email || '')}</div></td>
        <td>${esc(area)} · L${esc(a.level || '')}</td>
        <td>${a.pathway === 'alternative' ? 'Alternative' : 'Direct'}</td>
        <td>${a.experience || 0}y</td>
        <td>${BBI.statusBadge(a.status)}</td>
        <td>${BBI.fmtDate(a.createdAt)}</td>
        <td><button class="btn btn-outline" style="padding:6px 12px" data-view="${a.id}">View</button></td>
      </tr>`;
    }

    function openDrawer(id) {
      const a = ALL.find(x => x.id === id);
      if (!a) return;
      const area = (BBI.helpers.certType(a.area).name) || a.areaName || a.area;
      const field = (label, val) => val ? `<div class="kv"><span>${label}</span><div>${esc(val)}</div></div>` : '';
      $('drawer-body').innerHTML = `
        <h2 style="margin-bottom:4px">${esc(a.name)}</h2>
        <div class="muted" style="margin-bottom:14px">${esc(a.org || '')} · ${esc(a.country || '')}</div>
        <div style="margin-bottom:16px">${BBI.statusBadge(a.status)}</div>

        <label class="form" style="margin:0 0 18px">Update status
          <select id="status-sel">${BBI.STATUSES.map(s => `<option value="${s.key}" ${s.key === a.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
        </label>
        <div id="save-msg" class="notice hidden" style="margin-bottom:16px"></div>

        ${field('Phone', a.phone)}
        ${field('Email', a.email)}
        ${field('Area', area)}
        ${field('Level', a.level)}
        ${field('Pathway', a.pathway === 'alternative' ? 'Alternative' : 'Direct')}
        ${field('Experience', (a.experience || 0) + ' years')}
        ${field('Highest qualification', a.qualification)}
        ${field('Background statement', a.background)}
        ${field('Capability statement', a.capability)}
        ${a.documents ? `<div class="kv"><span>Document links</span><div>${linkify(a.documents)}</div></div>` : ''}
        ${field('Submitted', BBI.fmtDate(a.createdAt))}
        ${field('User ID', a.uid)}
        <button class="btn btn-outline" id="del-app" style="margin-top:20px;color:#c0392b">🗑 Delete application</button>
      `;
      $('del-app').addEventListener('click', async () => {
        if (!confirm('Delete this application? This cannot be undone.')) return;
        try {
          await A.deleteApplication(a.id);
          ALL = ALL.filter(x => x.id !== a.id);
          closeDrawer();
          render();
        } catch (e) { alert('Could not delete: ' + (e.message || e)); }
      });
      const sel = $('status-sel');
      sel.addEventListener('change', async () => {
        const m = $('save-msg');
        try {
          await A.setStatus(a.id, sel.value);
          a.status = sel.value;
          m.textContent = 'Status updated.'; m.style.background = '#e3f2ec'; m.classList.remove('hidden');
          render();
        } catch (e) {
          m.textContent = 'Update failed: ' + (e.message || e); m.style.background = '#fff8e8'; m.classList.remove('hidden');
        }
      });
      $('drawer').classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() { $('drawer').classList.add('hidden'); document.body.style.overflow = ''; }

    function exportCSV() {
      const cols = ['name', 'phone', 'email', 'country', 'org', 'areaName', 'level', 'pathway', 'experience', 'qualification', 'status'];
      const head = cols.join(',');
      const rows = filtered().map(a => cols.map(c => csv(a[c])).join(','));
      const blob = new Blob([head + '\n' + rows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'bbi-applications.csv'; link.click();
      URL.revokeObjectURL(url);
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function csv(s) { s = String(s == null ? '' : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    function linkify(text) {
      return esc(text).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
    }
  });
})();
