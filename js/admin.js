/* BBI Africa — admin panel logic */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const A = window.BBIAuth, $ = (id) => document.getElementById(id);
    if (!A || !A.ready) { $('not-config').classList.remove('hidden'); $('no-access').classList.remove('hidden'); return; }

    let ALL = [];

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
        $('panel').innerHTML = `<div class="notice">Could not load applications: ${e.message || e}</div>`;
        return;
      }
      initFilters();
      render();
    });

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
          const hay = `${a.name} ${a.org} ${a.country} ${a.phone} ${a.email}`.toLowerCase();
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
        <td><strong>${esc(a.name)}</strong><div class="muted" style="font-size:.8rem">${esc(a.org || '')} · ${esc(a.country || '')}</div><div class="muted" style="font-size:.8rem">${esc(a.phone || '')}</div></td>
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
      `;
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
