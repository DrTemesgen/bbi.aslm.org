/* BBI Africa — shared helpers for applications (account + admin views) */
(function () {
  window.BBI = window.BBI || {};

  BBI.STATUSES = [
    { key: 'submitted', label: 'Submitted', color: '#1f6feb' },
    { key: 'under_review', label: 'Under review', color: '#b4861e' },
    { key: 'shortlisted', label: 'Shortlisted', color: '#13654d' },
    { key: 'approved', label: 'Approved', color: '#0f4f3c' },
    { key: 'rejected', label: 'Not selected', color: '#c0392b' }
  ];

  BBI.statusMeta = function (key) {
    return BBI.STATUSES.find(s => s.key === key) || { key, label: key, color: '#5c6b64' };
  };

  BBI.statusBadge = function (key) {
    const s = BBI.statusMeta(key);
    return `<span class="tag" style="background:${s.color}1a;color:${s.color}">${s.label}</span>`;
  };

  BBI.fmtDate = function (ts) {
    if (!ts) return '';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Applicant-facing card (read-only)
  BBI.renderAppCard = function (a) {
    const area = (BBI.helpers && BBI.helpers.certType(a.area).name) || a.areaName || a.area || '';
    return `<div class="card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
        ${BBI.statusBadge(a.status)}
        <strong>${area} · Level ${a.level || ''}</strong>
        <span class="muted" style="margin-left:auto;font-size:.82rem">${BBI.fmtDate(a.createdAt)}</span>
      </div>
      <div class="muted" style="font-size:.9rem">${a.pathway === 'alternative' ? 'Alternative pathway' : 'Direct pathway'} · ${a.experience || 0} yrs experience · ${a.org || ''}</div>
    </div>`;
  };
})();
