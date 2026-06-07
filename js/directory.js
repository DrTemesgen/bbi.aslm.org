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

    // Populate filters
    BBI.regions.forEach(r => regionSel.add(new Option(r.name, r.key)));
    BBI.certTypes.forEach(c => certSel.add(new Option(c.name, c.key)));

    function badges(p) {
      return p.certs.map(c => {
        const t = H.certType(c.t);
        return `<span class="tag" title="${t.name} · ${c.y}" style="background:${t.color}1a;color:${t.color}">${t.abbr} ’${String(c.y).slice(2)}</span>`;
      }).join('');
    }

    function card(p) {
      const color = H.avatarColor(p.name);
      return `<a class="person fade-in" href="profile.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit">
        <div class="avatar" style="background:${color}">${H.initials(p.name)}</div>
        <div style="flex:1;min-width:0">
          <h3>${p.name}</h3>
          <div class="role">${p.role} · ${p.org}</div>
          <div>${badges(p)}${p.mentor ? '<span class="tag gold" title="Available as a mentor">🧭 Mentor</span>' : ''}</div>
          <div class="flag">📍 ${p.country} · ${H.regionName(p.region)} · ${p.level}</div>
        </div>
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
          const certNames = p.certs.map(c => H.certType(c.t).name).join(' ');
          const hay = `${p.name} ${p.role} ${p.org} ${p.country} ${p.specialties.join(' ')} ${certNames}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      });
      countEl.textContent = `${filtered.length} of ${data.length} professionals`;
      grid.innerHTML = filtered.length
        ? filtered.map(card).join('')
        : `<div class="card center muted" style="grid-column:1/-1">No professionals match your search. Try clearing filters.</div>`;
    }

    [q, regionSel, certSel].forEach(el => el.addEventListener('input', render));
    mentorChk.addEventListener('change', render);
    render();
  });
})();
