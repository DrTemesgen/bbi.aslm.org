/* BBI Africa — dashboard rendering (pure SVG/CSS, no libraries) */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dash')) return;
    const C = BBI.countries, R = BBI.regions, H = BBI.helpers;

    // --- Region engagement bars ---
    const byRegion = R.map(r => ({
      ...r,
      count: C.filter(c => c.region === r.key).length,
      active: C.filter(c => c.region === r.key && c.status === 'active').length
    }));
    const max = Math.max(...byRegion.map(r => r.count), 1);
    const barsEl = document.getElementById('region-bars');
    if (barsEl) {
      barsEl.innerHTML = byRegion.map(r => `
        <div class="bar-row">
          <span class="k">${r.name}</span>
          <span class="bar-track"><span class="bar-fill" style="width:0" data-w="${Math.round(r.count / max * 100)}"></span></span>
          <span class="v">${r.count}</span>
        </div>`).join('');
      requestAnimationFrame(() => {
        setTimeout(() => barsEl.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'), 120);
      });
    }

    // --- Status donut (active / emerging / planned) ---
    const statuses = [
      { key: 'active', label: BBI.t('common.statusActive', 'Active'), color: '#13654d' },
      { key: 'emerging', label: BBI.t('common.statusEmerging', 'Emerging'), color: '#e0a92e' },
      { key: 'planned', label: BBI.t('common.statusPlanned', 'Planned'), color: '#c0392b' }
    ];
    const counts = statuses.map(s => ({ ...s, n: C.filter(c => c.status === s.key).length }));
    const total = counts.reduce((a, b) => a + b.n, 0) || 1;
    const donut = document.getElementById('status-donut');
    if (donut) {
      const r = 56, cx = 70, cy = 70, circ = 2 * Math.PI * r;
      let offset = 0;
      const segs = counts.map(s => {
        const frac = s.n / total;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="22"
          stroke-dasharray="${(frac * circ).toFixed(1)} ${circ.toFixed(1)}"
          stroke-dashoffset="${(-offset * circ).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
        offset += frac; return seg;
      }).join('');
      donut.innerHTML = `
        <div class="donut-wrap">
          <div class="progress-ring" style="position:relative">
            <svg width="140" height="140" viewBox="0 0 140 140">${segs}</svg>
            <div class="center"><b>${C.length}</b><div class="muted" style="font-size:.74rem">${BBI.t('dashboard.donutEngaged', 'countries<br>engaged')}</div></div>
          </div>
          <ul class="legend">
            ${counts.map(s => `<li><span class="dot" style="background:${s.color}"></span> ${s.label} <b style="margin-left:auto">${s.n}</b></li>`).join('')}
          </ul>
        </div>`;
    }

    // --- Pillar progress ---
    const pillarProg = [
      { t: BBI.t('dashboard.prog.p1', 'Strategic focus at Africa CDC'), v: 85 },
      { t: BBI.t('dashboard.prog.p2', 'Continental & Regional TWGs'), v: 100 },
      { t: BBI.t('dashboard.prog.p3', 'Legal framework endorsed'), v: 100 },
      { t: BBI.t('dashboard.prog.p4', 'Institutional certification'), v: 45 },
      { t: BBI.t('dashboard.prog.p5', 'Training & certification'), v: 78 },
      { t: BBI.t('dashboard.prog.p6', 'National capabilities'), v: 60 }
    ];
    const pp = document.getElementById('pillar-progress');
    if (pp) {
      pp.innerHTML = pillarProg.map(p => `
        <div class="bar-row">
          <span class="k">${p.t}</span>
          <span class="bar-track"><span class="bar-fill" style="width:0" data-w="${p.v}"></span></span>
          <span class="v">${p.v}%</span>
        </div>`).join('');
      requestAnimationFrame(() => setTimeout(() => pp.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'), 200));
    }

    // --- Country table ---
    const ct = document.getElementById('country-list');
    if (ct) {
      const order = { active: 0, emerging: 1, planned: 2 };
      const sorted = [...C].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
      ct.innerHTML = sorted.map(c => {
        const cls = c.status === 'active' ? '' : c.status === 'emerging' ? 'gold' : 'blue';
        const statusLbl = BBI.t('common.status' + c.status.charAt(0).toUpperCase() + c.status.slice(1), c.status);
        return `<div class="res-item" style="padding:11px 0">
          <span class="ficon" style="background:${H.regionColor(c.region)}22;color:${H.regionColor(c.region)}">${H.initials(c.name)}</span>
          <div style="flex:1"><b>${c.name}</b><div class="muted" style="font-size:.82rem">${H.regionName(c.region)}</div></div>
          <span class="tag ${cls}">${statusLbl}</span>
        </div>`;
      }).join('');
    }
  });
})();
