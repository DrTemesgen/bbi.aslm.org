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
        $('tab-cats').classList.toggle('hidden', which !== 'cats');
        $('tab-dir').classList.toggle('hidden', which !== 'dir');
        $('tab-ecc').classList.toggle('hidden', which !== 'ecc');
        $('tab-home').classList.toggle('hidden', which !== 'home');
        if (which === 'cats') loadCats();
        if (which === 'dir') loadDir();
        if (which === 'ecc') loadEcc();
        if (which === 'home') loadHome();
      }));
      $('new-profile').addEventListener('click', () => openProfileDrawer(null));
      $('dq').addEventListener('input', renderDir);
      $('d-level').addEventListener('input', renderDir);
      [$('uq'), $('f-appr')].forEach(el => el.addEventListener('input', renderUsers));
      $('new-account').addEventListener('click', openCreateDrawer);
      $('new-cat').addEventListener('click', () => openCatDrawer(null));
    }

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

    // ---- Home page editor ----
    let HOME = null;
    async function loadHome() {
      try { HOME = await A.getSetting('home'); } catch (e) { HOME = null; }
      if (!HOME) HOME = JSON.parse(JSON.stringify(BBI.home));
      HOME.stats = HOME.stats || [];
      while (HOME.stats.length < 4) HOME.stats.push({ num: 0, suffix: '', label: '', sub: '' });
      renderHomeEditor();
    }
    function renderHomeEditor() {
      $('home-editor').innerHTML = `
        <div class="card" style="text-align:left;margin-bottom:16px">
          <h3 style="margin-top:0">Hero</h3>
          <label class="form" style="margin:0 0 12px">Title
            <input id="h-title" value="${escAttr(HOME.heroTitle || '')}" />
          </label>
          <label class="form" style="margin:0">Subtitle <span class="muted" style="font-weight:400">(HTML allowed, e.g. &lt;strong&gt;)</span>
            <textarea id="h-lead" rows="4">${esc(HOME.heroLead || '')}</textarea>
          </label>
        </div>
        <div class="card" style="text-align:left;margin-bottom:16px">
          <h3 style="margin-top:0">Headline statistics</h3>
          ${HOME.stats.slice(0, 4).map((s, i) => `
            <div class="ecc-row">
              <input data-h="${i}.num" value="${escAttr(s.num != null ? s.num : '')}" placeholder="Number" style="max-width:110px" />
              <input data-h="${i}.suffix" value="${escAttr(s.suffix || '')}" placeholder="+ / %" style="max-width:80px" />
              <input data-h="${i}.label" value="${escAttr(s.label || '')}" placeholder="Label" />
              <input data-h="${i}.sub" value="${escAttr(s.sub || '')}" placeholder="Sub-label" />
            </div>`).join('')}
        </div>
        <div style="text-align:left">
          <button class="btn btn-primary" id="home-save">Save home content</button>
          <a class="btn btn-outline" href="index.html" target="_blank" rel="noopener">Preview ↗</a>
          <span id="home-msg" class="muted" style="margin-left:10px"></span>
        </div>`;
      $('home-save').addEventListener('click', async () => {
        HOME.heroTitle = $('h-title').value;
        HOME.heroLead = $('h-lead').value;
        document.querySelectorAll('#home-editor [data-h]').forEach(inp => {
          const p = inp.getAttribute('data-h').split('.');
          let v = inp.value;
          if (p[1] === 'num') v = parseFloat(v) || 0;
          HOME.stats[p[0]][p[1]] = v;
        });
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
    async function loadEcc() {
      try { ECC = await A.getSetting('ecc'); } catch (e) { ECC = null; }
      if (!ECC) ECC = JSON.parse(JSON.stringify(BBI.ecc));
      ['mandate', 'leadership', 'members', 'history'].forEach(k => { ECC[k] = ECC[k] || []; });
      renderEcc();
    }
    function eccSync() {
      const ab = $('ecc-about'); if (ab) ECC.about = ab.value;
      document.querySelectorAll('#ecc-editor [data-ecc]').forEach(inp => {
        const p = inp.getAttribute('data-ecc').split('.');
        if (ECC[p[0]] && ECC[p[0]][p[1]]) ECC[p[0]][p[1]][p[2]] = inp.value;
      });
    }
    function eccList(list, label) {
      const cols = ECC_COLS[list];
      const rows = ECC[list].map((it, i) => `
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
      $('ecc-editor').innerHTML = `
        <div class="card" style="text-align:left;margin-bottom:16px">
          <h3 style="margin-top:0">About</h3>
          <textarea id="ecc-about" rows="4" style="width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px">${esc(ECC.about || '')}</textarea>
        </div>
        ${eccList('mandate', 'Mandate')}
        ${eccList('leadership', 'Leadership')}
        ${eccList('members', 'Members')}
        ${eccList('history', 'History')}
        <div style="text-align:left">
          <button class="btn btn-primary" id="ecc-save">Save ECC content</button>
          <a class="btn btn-outline" href="ecc.html" target="_blank" rel="noopener">Preview page ↗</a>
          <span id="ecc-msg" class="muted" style="margin-left:10px"></span>
        </div>`;
      $('ecc-editor').querySelectorAll('[data-eccadd]').forEach(b => b.addEventListener('click', () => {
        eccSync(); ECC[b.getAttribute('data-eccadd')].push({}); renderEcc();
      }));
      $('ecc-editor').querySelectorAll('[data-eccdel]').forEach(b => b.addEventListener('click', () => {
        eccSync(); const p = b.getAttribute('data-eccdel').split('.'); ECC[p[0]].splice(p[1], 1); renderEcc();
      }));
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
