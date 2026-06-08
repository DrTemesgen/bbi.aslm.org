/* Generate a stylised Africa map illustration (SVG) from the GeoJSON,
   for use as a hero image. Run: node gen-hero.mjs */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const geo = JSON.parse(readFileSync('assets/africa.geojson', 'utf8'));
const feats = geo.features.filter(f => f.geometry &&
  (f.geometry.coordinates && f.geometry.coordinates.length || f.geometry.type === 'GeometryCollection'));

const eachCoord = (c, fn) => { if (typeof c[0] === 'number') { fn(c); return; } for (const x of c) eachCoord(x, fn); };
const walk = (g, fn) => { if (g.type === 'GeometryCollection') { g.geometries.forEach(x => walk(x, fn)); return; } if (g.coordinates) eachCoord(g.coordinates, fn); };

let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
feats.forEach(f => walk(f.geometry, ([lo, la]) => {
  if (lo < minLon) minLon = lo; if (lo > maxLon) maxLon = lo;
  if (la < minLat) minLat = la; if (la > maxLat) maxLat = la;
}));

const pad = 16, tw = 900;
const scale = tw / (maxLon - minLon);
const th = (maxLat - minLat) * scale;
const W = Math.round(tw + pad * 2), H = Math.round(th + pad * 2);
const px = lo => (lo - minLon) * scale + pad;
const py = la => (maxLat - la) * scale + pad;

const ring = r => { let d = ''; r.forEach((p, i) => d += (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1) + ' '); return d + 'Z'; };
const toPath = g => {
  if (g.type === 'GeometryCollection') return g.geometries.map(toPath).join(' ');
  if (!g.coordinates) return '';
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.map(poly => poly.map(ring).join(' ')).join(' ');
};

const paths = feats.map(f => `<path d="${toPath(f.geometry)}" />`).join('\n      ');

// A few "node" dots over major hubs (approx lon/lat) for a network feel.
const hubs = [[3.4,6.5],[36.8,-1.3],[38.7,9.0],[31.2,30.0],[18.4,-33.9],[-17.4,14.7],[15.3,-4.3],[28.3,-15.4]];
const dots = hubs.map(([lo, la]) => `<circle cx="${px(lo).toFixed(1)}" cy="${py(la).toFixed(1)}" r="4.5" class="hub"/>`).join('\n      ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of Africa">
  <defs>
    <linearGradient id="afFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2c14e"/>
      <stop offset="0.55" stop-color="#7fc9ac"/>
      <stop offset="1" stop-color="#bfe0d3"/>
    </linearGradient>
    <filter id="afGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#0b3d2e" flood-opacity="0.35"/>
    </filter>
    <style>
      .country { fill: url(#afFill); stroke: #0f4f3c; stroke-width: 0.6; stroke-opacity: .25; }
      .hub { fill: #ffffff; stroke: #0f4f3c; stroke-width: 1.2; }
    </style>
  </defs>
  <g class="country" filter="url(#afGlow)">
      ${paths}
  </g>
  <g>
      ${dots}
  </g>
</svg>
`;

mkdirSync('assets/img', { recursive: true });
writeFileSync('assets/img/africa-hero.svg', svg);
console.log('wrote assets/img/africa-hero.svg', W + 'x' + H);
