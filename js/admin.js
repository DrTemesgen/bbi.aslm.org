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
      }));
      [$('uq'), $('f-appr')].forEach(el => el.addEventListener('input', renderUsers));
      $('new-account').addEventListener('click', openCreateDrawer);
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
        </form>`;
      showDrawer();
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
