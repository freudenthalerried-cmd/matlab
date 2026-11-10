// Test Kamerakalibrierung mit simulierten Tafelbildern (bekannte Kamera, Rauschen 0,2 px)
global.BA = require('../ba.js'); global.MK = require('../marker.js'); const { CAL } = require('../calib.js');
const W = 1920, H = 1080, it = [1530, 965, 535, 0.03, -0.01]; let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }, gn = () => { let a = 0; for (let i = 0; i < 6; i++) a += rnd(); return (a - 3) * Math.SQRT2; };
const look = (C, T) => { let z = T.map((v, i) => v - C[i]); const nz = Math.hypot(...z); z = z.map(v => v / nz); let x = [z[1], -z[0], 0]; if (Math.hypot(...x) < 1e-6) x = [1, 0, 0]; const nx = Math.hypot(...x); x = x.map(v => v / nx); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]; const R = [...x, ...y, ...z]; return [...BA.rotvec(R), -(R[0] * C[0] + R[1] * C[1] + R[2] * C[2]), -(R[3] * C[0] + R[4] * C[1] + R[5] * C[2]), -(R[6] * C[0] + R[7] * C[1] + R[8] * C[2])]; };
const views = [];
for (let v = 0; v < 15; v++) {
  const ctr = [0.105, 0.135, 0], a = rnd() * 6.28, el = 0.35 + 0.5 * rnd(), d = 0.35 + 0.25 * rnd();
  const C = [ctr[0] + d * Math.cos(a) * Math.cos(el), ctr[1] + d * Math.sin(a) * Math.cos(el), -d * Math.sin(el)], T = [ctr[0] + (rnd() - .5) * 0.12, ctr[1] + (rnd() - .5) * 0.15, 0];
  const cam = look(C, T), dets = [];
  CAL.IDS.forEach(id => { const c = CAL.corners(id).map(X => BA.project(it, cam, X)); if (c.every(p => p[2] > 0 && p[0] > 0 && p[0] < W && p[1] > 0 && p[1] < H)) dets.push({ id, c: c.map(p => [p[0] + 0.2 * gn(), p[1] + 0.2 * gn()]) }); });
  views.push({ dets });
}
console.log('Bilder', views.length, 'Marken/Bild', (views.reduce((a, v) => a + v.dets.length, 0) / views.length).toFixed(1), 'Infos', views.slice(0, 4).map(v => { const i = CAL.viewInfo(v.dets, W, H); return i ? i.tb + ' ' + i.tilt.toFixed(0) + '° Felder ' + i.cells.size : '-'; }).join(' | '));
const t0 = Date.now(), r = CAL.solve(views, W, H);
console.log(r.err || `Ergebnis f ${r.it[0].toFixed(1)} (soll ${it[0]}), cx ${r.it[1].toFixed(1)} (${it[1]}), cy ${r.it[2].toFixed(1)} (${it[2]}), k1 ${r.it[3].toFixed(4)} (${it[3]}), k2 ${r.it[4].toFixed(4)} (${it[4]}), Restfehler ${r.rms.toFixed(3)} px, ${Date.now() - t0} ms`);
for (const k of [4, 5, 6, 8, 10]) { const q = CAL.solve(views.slice(0, k), W, H, { min: 4 }); console.log(k, 'Bilder:', q.err || `f ${q.it[0].toFixed(1)} ±${(q.sfRel * 100).toFixed(2)} %, Fehler ${((q.it[0] / it[0] - 1) * 100).toFixed(2)} %`); }
