// Zollstock-Erkennung – schwierige Fälle: wenig Licht, Schattenkante quer, Fuß/Kabel über dem Stab (Maske geteilt), dünner Stab weit weg,
// Gelenke als Takt; und Fehlalarme (Sockelleiste, gelbes Kabel ohne Ziffern) müssen abgelehnt werden.
const AR = require('../ar.js'); let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function img(W, H, a, b, wid, noise, o = {}) { // o: light (Faktor), shadowX (ab dieser Spalte halb so hell), occl [t0,t1] (Anteil des Stabs grau verdeckt), ticks (false = glatter Streifen), RC, FL
  const RC = o.RC || [235, 195, 30], FL = o.FL || null, light = o.light ?? 1, ticks = o.ticks ?? true, px = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = (y * W + x) * 4, t = ((x >> 4) + (y >> 4)) & 1, lf = light * (o.shadowX != null && x > o.shadowX ? 0.45 : 1);
    if (FL) { const f = t ? 1 : 0.85; px[j] = (FL[0] * f + rnd() * noise) * lf; px[j + 1] = (FL[1] * f + rnd() * noise) * lf; px[j + 2] = (FL[2] * f + rnd() * noise) * lf; }
    else { const base = t ? 130 : 110; px[j] = (base + 20 + rnd() * noise) * lf; px[j + 1] = (base + rnd() * noise) * lf; px[j + 2] = (base - 15 + rnd() * noise) * lf; } px[j + 3] = 255; }
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), e = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-e[1], e[0]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x + 0.5 - a[0], dy = y + 0.5 - a[1], t = dx * e[0] + dy * e[1], oo = dx * n[0] + dy * n[1];
    let cov = 0; for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) { const tt = t + ((sx - 1.5) * e[0] + (sy - 1.5) * e[1]) / 4, o2 = oo + ((sx - 1.5) * n[0] + (sy - 1.5) * n[1]) / 4; if (tt >= 0 && tt <= L && Math.abs(o2) <= wid / 2) cov++; }
    if (!cov) continue; cov /= 16; const lf = light * (o.shadowX != null && x > o.shadowX ? 0.45 : 1);
    const tick = ticks && (Math.floor(t / (L / 40)) % 2 === 0) && Math.abs(oo) < wid * 0.25 && (t % (L / 40)) < (L / 40) * 0.3, joint = ticks && Math.abs((t % (L / 10)) - (L / 20)) < 1.2;
    const j = ((H - 1 - y) * W + x) * 4; let col = tick || joint ? [25, 25, 25] : [RC[0] + rnd() * 15, RC[1] + rnd() * 15, RC[2] + rnd() * 15];
    if (o.occl && t / L > o.occl[0] && t / L < o.occl[1]) col = [95 + rnd() * 10, 90 + rnd() * 10, 88 + rnd() * 10]; // grauer Schuh / Kabel
    for (let c = 0; c < 3; c++) px[j + c] = Math.round(px[j + c] * (1 - cov) + col[c] * cov * lf); }
  return px;
}
let ok = true; const W = 1920, H = 1080;
const cases = [
  ['Normal', [300.3, 700.7], [1600.2, 260.4], 16, 40, {}],
  ['Wenig Licht (40 %)', [300.3, 700.7], [1600.2, 260.4], 16, 40, { light: 0.4 }],
  ['Schattenkante quer über den Stab', [300.3, 700.7], [1600.2, 260.4], 16, 40, { shadowX: 950 }],
  ['Schuh verdeckt 8 % in der Mitte', [300.3, 700.7], [1600.2, 260.4], 16, 40, { occl: [0.46, 0.54] }],
  ['Dünn, weit weg (8 px)', [400.2, 300.4], [1500.6, 640.1], 8, 30, {}],
  ['Weiß im Halbschatten auf Fliesen', [300.3, 700.7], [1600.2, 260.4], 15, 30, { RC: [235, 232, 225], light: 0.7 }],
  ['Naturholz, wenig Licht', [300.3, 700.7], [1600.2, 260.4], 15, 30, { RC: [205, 160, 105], light: 0.5 }],
];
for (const [nm, a, b, wid, noise, o] of cases) {
  const px = img(W, H, a, b, wid, noise, o), t0 = Date.now(); let R = AR.rulerFind(px, W, H, true); const ms = Date.now() - t0;
  if (!R) { // Fallback wie in der App: Kreis auf den Stab → Farbe lernen
    const col = AR.learnColor(px, W, H, (a[0] + b[0]) / 2 + 30, (a[1] + b[1]) / 2 - 13.5); R = AR.rulerFind(px, W, H, true, col);
    if (!R) { console.log(`${nm}: NICHT gefunden, auch nicht mit gelernter Farbe (${ms} ms)`); ok = false; continue; } console.log(`${nm}: automatisch nicht gefunden → mit gelernter Farbe:`); }
  const e = Math.max(Math.min(Math.hypot(R.a[0] - a[0], R.a[1] - a[1]), Math.hypot(R.a[0] - b[0], R.a[1] - b[1])), Math.min(Math.hypot(R.b[0] - a[0], R.b[1] - a[1]), Math.hypot(R.b[0] - b[0], R.b[1] - b[1])));
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), pitch = R.joints.length >= 2 ? (() => { const D = []; for (let i = 1; i < R.joints.length; i++) D.push(Math.hypot(R.joints[i][0] - R.joints[i - 1][0], R.joints[i][1] - R.joints[i - 1][1])); return D.reduce((x, y) => x + y, 0) / D.length; })() : null;
  console.log(`${nm}: „${R.col}“, Endfehler max ${e.toFixed(2)} px, Struktur ${(R.tex * 100).toFixed(0)} %, Gelenke ${R.joints.length}${pitch ? ` (Takt ${pitch.toFixed(1)} px, soll ${(L / 10).toFixed(1)})` : ''}, ${ms} ms`);
  if (e > 2 || (pitch && Math.abs(pitch / (L / 10) - 1) > 0.02)) ok = false;
  if (!o.occl && wid >= 10 && R.joints.length < 5) { console.log('   zu wenige Gelenke erkannt'); ok = false; }
}
// Fehlalarme: glatte Streifen ohne Ziffern (Sockelleiste weiß, Kabel gelb) → null
for (const [nm, RC, FL] of [['Sockelleiste (weiß, glatt)', [238, 236, 230], null], ['Gelbes Kabel (glatt)', [235, 195, 30], null], ['Holzleiste auf grauen Fliesen (glatt)', [205, 160, 105], [150, 150, 150]]]) {
  const px = img(W, H, [100.5, 540.5], [1800.5, 560.5], 14, 30, { RC, FL, ticks: false }), R = AR.rulerFind(px, W, H, true);
  console.log(`${nm}: ${R ? `FÄLSCHLICH erkannt als „${R.col}“ (Struktur ${(R.tex * 100).toFixed(0)} %)` : 'abgelehnt ✓'}`); if (R) ok = false;
}
console.log('Zollstock schwierige Fälle:', ok ? 'OK' : 'FEHLER'); process.exit(ok ? 0 : 1);
