/* BBI Africa — interactive Africa coverage map (SVG choropleth from GeoJSON) */
(function () {
  const STATUS = {
    active:   { label: 'Active',   color: '#13654d' },
    emerging: { label: 'Emerging', color: '#e0a92e' },
    planned:  { label: 'Planned',  color: '#c0392b' }
  };
  const NEUTRAL = '#dbe7e0';      // not tracked
  const STROKE = '#ffffff';

  // Map BBI country names -> GeoJSON feature names where they differ.
  const ALIAS = { "Côte d'Ivoire": 'Ivory Coast' };

  document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('africa-map');
    if (!host) return;

    // Build lookup: geojson name -> {status, region, name}
    const lookup = {};
    BBI.countries.forEach(c => {
      const gname = ALIAS[c.name] || c.name;
      lookup[gname] = c;
    });

    fetch('assets/africa.geojson')
      .then(r => r.json())
      .then(geo => render(geo, host, lookup))
      .catch(() => { host.innerHTML = '<p class="muted">Map could not be loaded.</p>'; });
  });

  function render(geo, host, lookup) {
    const feats = geo.features.filter(f => f.geometry &&
      (f.geometry.coordinates && f.geometry.coordinates.length || f.geometry.type === 'GeometryCollection'));

    const eachCoord = (c, fn) => {
      if (typeof c[0] === 'number') { fn(c); return; }
      for (const x of c) eachCoord(x, fn);
    };
    // Walk a geometry's coordinates, flattening GeometryCollection.
    const walkGeom = (geom, fn) => {
      if (geom.type === 'GeometryCollection') { geom.geometries.forEach(g => walkGeom(g, fn)); return; }
      if (geom.coordinates) eachCoord(geom.coordinates, fn);
    };

    // bounds
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    feats.forEach(f => walkGeom(f.geometry, ([lon, lat]) => {
      if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    }));

    const pad = 8, tw = 900;
    const scale = tw / (maxLon - minLon);
    const th = (maxLat - minLat) * scale;
    const W = tw + pad * 2, Hgt = th + pad * 2;
    const px = lon => (lon - minLon) * scale + pad;
    const py = lat => (maxLat - lat) * scale + pad;

    const ringToPath = ring => {
      let d = '';
      ring.forEach((pt, i) => { d += (i ? 'L' : 'M') + px(pt[0]).toFixed(1) + ' ' + py(pt[1]).toFixed(1) + ' '; });
      return d + 'Z';
    };
    const geomToPath = geom => {
      if (geom.type === 'GeometryCollection') return geom.geometries.map(geomToPath).join(' ');
      if (!geom.coordinates) return '';
      const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      return polys.map(poly => poly.map(ringToPath).join(' ')).join(' ');
    };

    const paths = feats.map(f => {
      const name = f.properties.name;
      const hit = lookup[name];
      const fill = hit ? STATUS[hit.status].color : NEUTRAL;
      const d = geomToPath(f.geometry);
      const status = hit ? hit.status : '';
      const region = hit ? hit.region : '';
      return `<path d="${d}" fill="${fill}" stroke="${STROKE}" stroke-width="0.6"
        data-name="${name.replace(/"/g, '&quot;')}" data-status="${status}" data-region="${region}"
        class="ctry${hit ? ' tracked' : ''}"></path>`;
    }).join('');

    host.innerHTML = `
      <div class="map-wrap">
        <svg viewBox="0 0 ${W.toFixed(0)} ${Hgt.toFixed(0)}" class="africa-svg" role="img" aria-label="Map of Africa showing BBI country engagement">
          ${paths}
        </svg>
        <div class="map-tip" id="map-tip" hidden></div>
      </div>
      <div class="map-legend">
        ${Object.entries(STATUS).map(([k, v]) => `<span><i style="background:${v.color}"></i>${v.label}</span>`).join('')}
        <span><i style="background:${NEUTRAL}"></i>Not yet engaged</span>
      </div>
      <div class="map-info" id="map-info"><span class="muted">Tap a highlighted country to see its engagement status.</span></div>`;

    const svg = host.querySelector('svg');
    const tip = host.querySelector('#map-tip');
    const info = host.querySelector('#map-info');
    const H = BBI.helpers;

    function describe(path) {
      const name = path.getAttribute('data-name');
      const status = path.getAttribute('data-status');
      const region = path.getAttribute('data-region');
      if (!status) return `<strong>${name}</strong> — <span class="muted">not yet engaged</span>`;
      const s = STATUS[status];
      return `<strong>${name}</strong> · <span class="tag" style="background:${s.color}1a;color:${s.color}">${s.label}</span> · ${H.regionName(region)}`;
    }

    svg.addEventListener('mousemove', e => {
      const t = e.target.closest('path.ctry');
      if (!t) { tip.hidden = true; return; }
      tip.innerHTML = describe(t);
      tip.hidden = false;
      const rect = host.getBoundingClientRect();
      tip.style.left = (e.clientX - rect.left + 12) + 'px';
      tip.style.top = (e.clientY - rect.top + 12) + 'px';
    });
    svg.addEventListener('mouseleave', () => { tip.hidden = true; });

    function select(t) {
      svg.querySelectorAll('path.sel').forEach(p => p.classList.remove('sel'));
      t.classList.add('sel');
      info.innerHTML = describe(t);
    }
    svg.addEventListener('click', e => {
      const t = e.target.closest('path.ctry');
      if (t) select(t);
    });
  }
})();
