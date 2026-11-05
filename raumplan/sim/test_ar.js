// Simulation AR-Aufmaß (angenommenes ARCore-Fehlermodell): Abtasten vs. Antippen, mit/ohne Zollstock-Maßstab
const AR = require('../ar.js'); let sd = 11; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }, gn = () => { let a = 0; for (let i = 0; i < 6; i++) a += rnd(); return (a - 3) * Math.SQRT2; };
const SN = +(process.env.NOISE || 0.006), SC = +(process.env.SCALE || 0.01), DR = +(process.env.DRIFT || 0.003), OUT = +(process.env.OUTL || 0.15), TAP = +(process.env.TAP || 0.005);
const C = [[0, 0], [4.2, 0], [4.2, 3.6], [0, 3.6]], truth = C.map((p, i) => Math.hypot(C[(i + 1) % 4][0] - p[0], C[(i + 1) % 4][1] - p[1]));
function trial(scan, zoll) {
  const k = 1 + SC * gn(), off = () => [DR * gn(), DR * gn()], tr = (p, o) => [p[0] * k + o[0], p[1] * k + o[1]];
  const walls = C.map((a, i) => { const b = C[(i + 1) % 4], d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L], nIn = [-u[1], u[0]], o = off(), P = [];
    const n = scan ? 80 : 3; for (let j = 0; j < n; j++) { const t = scan ? 0.15 + 0.7 * rnd() : 0.2 + 0.3 * j; let e = SN * gn(); if (scan && rnd() < OUT) e += 0.05 + 0.35 * rnd(); // Möbel vor der Wand
      P.push(tr([a[0] + d[0] * t + nIn[0] * e + u[0] * SN * gn(), a[1] + d[1] * t + nIn[1] * e + u[1] * SN * gn()], o)); } return P; });
  const NT = +(process.env.TAPS || 3), NL = +(process.env.LAGEN || 1), Z = [];
  for (let l = 0; zoll && l < NL; l++) { const ang = l * 1.1, c = [2.1, 1.8], h = [Math.cos(ang), Math.sin(ang)], e0 = [c[0] - h[0], c[1] - h[1]], e1 = [c[0] + h[0], c[1] + h[1]], zo = off();
    Z.push([e0, e1].map(e => [...Array(NT)].map(() => { const p = tr([e[0] + TAP * gn(), e[1] + TAP * gn()], zo); return [p[0], 0, p[1]]; }))); }
  const zs = Z.length ? Z[Z.length - 1] : [[], []], zp = Z.slice(0, -1);
  const r = AR.solve(walls, zs, zoll ? 2 : 0, [], null, zp); if (r.err) return null;
  const P = r.poly, L = P.map((p, i) => Math.hypot(P[(i + 1) % 4][0] - p[0], P[(i + 1) % 4][1] - p[1]));
  // Zuordnung Wand ↔ Soll (Polygon startet bei Ecke Wand3/Wand0)
  return L.map((l, i) => (l - truth[i]) * 1000);
}
for (const [scan, zoll] of [[false, false], [true, false], [false, true], [true, true]]) {
  const E = []; for (let t = 0; t < 300; t++) { const e = trial(scan, zoll); if (e) E.push(...e); }
  const a = E.map(Math.abs).sort((x, y) => x - y), rms = Math.sqrt(E.reduce((s, x) => s + x * x, 0) / E.length);
  console.log(`${scan ? 'Abtasten' : 'Antippen (3 Punkte)'}${zoll ? ' + Zollstock' : ''}: Fehler rms ${rms.toFixed(1)} mm, 95 % ≤ ${a[Math.floor(.95 * a.length)].toFixed(1)} mm`);
}
