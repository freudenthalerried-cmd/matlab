// Bodenaufmaß gegen gerenderte Fotos: Zollstock in der Mitte, je Ecke ein Foto, Tippfehler simuliert
const fs = require('fs'), RP = require('../raumplan-neu/core.js');
// Logik-Prüfungen
const pts = a => a.map(f => ({ f, s: 12 }));
const r1 = RP.roomFromPins(pts([[-900, -1500], [3200, -1500], [3200, 1800], [-900, 1800], [-895, -1505]]), 0);
console.log('Rechteck:', r1.poly.length, 'Ecken', r1.walls.map(w => Math.round(w.L)).join(' '), r1.area.toFixed(2), 'm², Probleme', r1.problems.length);
const r2 = RP.roomFromPins(pts([[-900, -1500], [800, -1500], [800, 1800], [-900, 1800]]), 0);
console.log('Zu kleiner Umriss:', r2.area.toFixed(2), 'm², Warnung:', r2.problems.length > 0);
const r3 = RP.roomFromPins(pts([[-900, -1500], [3200, -1500], [3200, 1800], [-900, 1800]]), 15);
console.log('Sockel 15 mm:', r3.walls.map(w => Math.round(w.L)).join(' '));
const dir = process.argv[2]; if (!dir) process.exit();
const F = fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort(), rooms = {};
for (const j of F) { const T = JSON.parse(fs.readFileSync(dir + '/' + j)), g = new Uint8Array(fs.readFileSync(dir + '/' + j.replace('.json', '.raw'))), t0 = Date.now(), loc = RP.locateBest(g, T.W, T.H), dt = Date.now() - t0; const R = rooms[T.room] = rooms[T.room] || { T, obs: [[], [], [], []], n: 0, miss: 0 }; R.n++;
  if (!loc.ok) { R.miss++; console.log(j, 'NICHT erkannt', loc.err, loc.found); continue; }
  console.log(j, 'Marken', loc.ids.join(''), 'rms', loc.rms.toFixed(2), dt + 'ms');
  T.corners.forEach((c, i) => { if (c[0] > 20 && c[1] > 20 && c[0] < T.W - 20 && c[1] < T.H - 20) { const n = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2.5; const snap = RP.cornerSnap(g, T.W, T.H, [c[0] + n() * 2, c[1] + n() * 2]); R.obs[i].push({ f: RP.toFloor(loc, snap), s: RP.pinSigma(loc, snap) }); } }); }
const E = [];
for (const k in rooms) { const R = rooms[k], T = R.T, Q = [[0, 0], [T.L * 1000, 0], [T.L * 1000, T.D * 1000], [0, T.D * 1000]], C = R.obs.map(o => { if (!o.length) return null; const r = RP.roomFromPins(o, 0).corners; return r[0].p; });
  console.log('Raum', k, 'Soll', T.L.toFixed(3), '×', T.D.toFixed(3), '| Fotos je Ecke', R.obs.map(o => o.length).join(','), '| erkannt', R.n - R.miss, '/', R.n);
  for (let i = 0; i < 4; i++) { const a = C[i], b = C[(i + 1) % 4]; if (!a || !b) continue; const L = Math.hypot(a[0] - b[0], a[1] - b[1]), s = Math.hypot(Q[i][0] - Q[(i + 1) % 4][0], Q[i][1] - Q[(i + 1) % 4][1]); E.push(Math.abs(L - s)); console.log('  Wand', i + 1, 'Soll', Math.round(s), 'Ist', Math.round(L), 'Fehler', Math.round(L - s), 'mm'); } }
E.sort((a, b) => a - b); if (E.length) console.log('Median', E[E.length >> 1].toFixed(0), 'mm, Maximum', E[E.length - 1].toFixed(0), 'mm');
