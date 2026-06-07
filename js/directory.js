/* BBI Africa — professional directory: search + filter + render */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('people-grid');
    if (!grid) return;
    const H = BBI.helpers;
    const data = BBI.directory;

    const q = document.getElementById('q');
    const regionSel = document.getElementById('f-region');
    const specSel = document.getElementById('f-spec');
    const countEl = document.getElementById('result-count');

    // Populate filters
    BBI.regions.forEach(r => regionSel.add(new Option(r.name, r.key)));
    const specs = [...new Set(data.flatMap(p => p.specialties))].sort();
    specs.forEach(s => specSel.add(new Option(s, s)));

    function card(p) {
      const color = H.avatarColor(p.name);
      const certCls = p.cert.includes('Trainer') ? 'gold' : 'blue';
      return `<article class="person fade-in">
        <div class="avatar" style="background:${color}">${H.initials(p.name)}</div>
        <div style="flex:1;min-width:0">
          <h3>${p.name}</h3>
          <div class="role">${p.role} · ${p.org}</div>
          <div>
            <span class="tag ${certCls}">${p.cert}</span>
            ${p.specialties.map(s => `<span class="tag">${s}</span>`).join('')}
          </div>
          <div class="flag">📍 ${p.country} · ${H.regionName(p.region)} · ${p.level}</div>
        </div>
      </article>`;
    }

    function render() {
      const term = (q.value || '').toLowerCase().trim();
      const reg = regionSel.value;
      const sp = specSel.value;
      const filtered = data.filter(p => {
        if (reg && p.region !== reg) return false;
        if (sp && !p.specialties.includes(sp)) return false;
        if (term) {
          const hay = `${p.name} ${p.role} ${p.org} ${p.country} ${p.specialties.join(' ')}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      });
      countEl.textContent = `${filtered.length} of ${data.length} professionals`;
      grid.innerHTML = filtered.length
        ? filtered.map(card).join('')
        : `<div class="card center muted" style="grid-column:1/-1">No professionals match your search. Try clearing filters.</div>`;
    }

    [q, regionSel, specSel].forEach(el => el.addEventListener('input', render));
    render();
  });
})();
