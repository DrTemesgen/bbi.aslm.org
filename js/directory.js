/* BBI Africa — professional directory: search + filter + render */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('people-grid');
    if (!grid) return;
    const H = BBI.helpers;
    const data = BBI.directory;

    const q = document.getElementById('q');
    const regionSel = document.getElementById('f-region');
    const certSel = document.getElementById('f-cert');
    const mentorChk = document.getElementById('f-mentor');
    const countEl = document.getElementById('result-count');

    // Populate filters — region now; certifications after categories load.
    BBI.regions.forEach(r => regionSel.add(new Option(r.name, r.key)));
    const cat = (key) => (window.BBICats ? BBICats.get(key) : H.certType(key));
    if (window.BBICats) {
      BBICats.load().then(cats => { cats.forEach(c => certSel.add(new Option(c.name, c.key))); render(); });
    } else {
      BBI.certTypes.forEach(c => certSel.add(new Option(c.name, c.key)));
    }

    function badges(p) {
      return p.certs.map(c => {
        const t = cat(c.t);
        return `<span class="tag" title="${t.name} · ${c.y}" style="background:${t.color}1a;color:${t.color}">${t.abbr} ’${String(c.y).slice(2)}</span>`;
      }).join('');
    }

    const LI_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#0a66c2" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.34 18.34V10.5H5.67v7.84zM7 9.28a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.06v-4.3c0-2.3-1.23-3.37-2.87-3.37a2.48 2.48 0 0 0-2.25 1.24v-1.06h-2.67v7.84h2.67v-4.15c0-1.1.2-2.16 1.56-2.16 1.34 0 1.36 1.25 1.36 2.23v4.08z"/></svg>';

    function card(p) {
      const li = p.linkedin || ('https://www.linkedin.com/search/results/all/?keywords=' + encodeURIComponent(p.name));
      return `<a class="person fade-in" href="profile.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit">
        <div style="flex:1;min-width:0">
          <h3>${p.name}</h3>
          <div class="role">${p.role} · ${p.org}</div>
          <div>${badges(p)}${p.mentor ? '<span class="tag gold" title="Available as a mentor">🧭 Mentor</span>' : ''}</div>
          <div class="flag">📍 ${p.country} · ${H.regionName(p.region)} · ${p.level}</div>
        </div>
        <span class="li-btn" data-li="${li}" title="View LinkedIn profile">${LI_SVG}</span>
      </a>`;
    }

    function render() {
      const term = (q.value || '').toLowerCase().trim();
      const reg = regionSel.value;
      const ct = certSel.value;
      const mentorsOnly = mentorChk.checked;
      const filtered = data.filter(p => {
        if (reg && p.region !== reg) return false;
        if (ct && !p.certs.some(c => c.t === ct)) return false;
        if (mentorsOnly && !p.mentor) return false;
        if (term) {
          const certNames = p.certs.map(c => cat(c.t).name).join(' ');
          const hay = `${p.name} ${p.role} ${p.org} ${p.country} ${p.specialties.join(' ')} ${certNames}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      });
      countEl.textContent = `${filtered.length} of ${data.length} professionals`;
      grid.innerHTML = filtered.length
        ? filtered.map(card).join('')
        : `<div class="card center muted" style="grid-column:1/-1">No professionals match your search. Try clearing filters.</div>`;
      grid.querySelectorAll('.li-btn').forEach(b => b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        window.open(b.getAttribute('data-li'), '_blank', 'noopener');
      }));
    }

    [q, regionSel, certSel].forEach(el => el.addEventListener('input', render));
    mentorChk.addEventListener('change', render);
    render();
  });
})();
