// Test: Zollstock-Marken automatisch (AR-Kamerabild) → Bodenpunkt → Maßstab. AR-Welt mit 1,2 % Maßstabsfehler, Pixelrauschen 0,3 px.
global.MK = require('../marker.js'); const AR = require('../ar.js');
let sd = 5; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }, gn = () => { let a = 0; for (let i = 0; i < 6; i++) a += rnd(); return (a - 3) * Math.SQRT2; };
const W = 1920, H = 1440, fovy = 55 / 57.3, asp = W / H, n = 0.1, fa = 100, f = 1 / Math.tan(fovy / 2);
const proj = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0];
function lookM(C, T) { // Kamera-zu-Welt (spaltenweise), Kamera schaut entlang -z
  let z = [C[0] - T[0], C[1] - T[1], C[2] - T[2]]; const nz = Math.hypot(...z); z = z.map(v => v / nz); let x = [z[2], 0, -z[0]]; const nx = Math.hypot(...x); x = x.map(v => v / nx); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, C[0], C[1], C[2], 1]; }
const S = 1.012, fy = 0, M = { 0: [0.2, -1.5], 1: [2.2, -1.5], 2: [0.2, -1.345], 3: [2.2, -1.345] }, obs = []; // wahre Lage (m), Welt der AR = S × wahr
for (let k = 0; k < +(process.env.NV || 40); k++) {
  const C = [S * (0.2 + 2 * rnd()), S * 1.4, S * (-0.6 + 0.4 * rnd())], end = rnd() < 0.5 ? 0 : 1, T = [S * (end ? 2.2 : 0.2) + 0.2 * gn(), 0, S * -1.45];
  const cam = lookM(C, T), ic = AR.inv4(cam), PT = +(process.env.PT || 0), PR = +(process.env.PR || 0), camN = lookM(C.map(c => c + PT * gn()), T.map(t => t + PR * 2 * gn())); // AR-Posenrauschen
  for (const id of [0, 1, 2, 3]) { const P = [S * M[id][0], 0, S * M[id][1], 1], pc = [0, 1, 2, 3].map(r => ic[r] * P[0] + ic[4 + r] * P[1] + ic[8 + r] * P[2] + ic[12 + r] * P[3]), cl = [0, 1, 2, 3].map(r => proj[r] * pc[0] + proj[4 + r] * pc[1] + proj[8 + r] * pc[2] + proj[12 + r] * pc[3]);
    if (cl[3] <= 0) continue; const u = (cl[0] / cl[3] + 1) / 2 * W, v = (1 - cl[1] / cl[3]) / 2 * H; if (u < 0 || u > W || v < 0 || v > H) continue;
    obs.push({ id, u: u + 0.3 * gn(), v: v + 0.3 * gn(), W, H, proj: Float64Array.from(proj), cam: Float64Array.from(camN) }); }
}
const r = AR.autoScale(obs, 2.0, fy * S + (+(process.env.DY || 0)));
console.log('Sichtungen', JSON.stringify(r.cnt), '→ Faktor', r.k.toFixed(5), '(soll', (1 / S).toFixed(5) + ')', 'Restfehler', ((r.k * S - 1) * 100).toFixed(3), '%');
