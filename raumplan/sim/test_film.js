// „Raum filmen“ – große Testreihe: viele Zufallsräume (Rechteck und L-Form) mit Dachschräge, Möbeln, offener Tür, Scheinwand,
// 2–4 cm Rauschen, ARCore-Maßstab ±2 %, Marken- oder Raumhöhen-Maßstab. Grundriss kommt aus Boden + Wandfuß (Decke egal).
//   node sim/test_film.js [Anzahl]   → Fehlerverteilung je Wand (max. je Raum), Bestehen: Median ≤ 2 cm, 90 % ≤ 5 cm (ohne Möbel), mit Möbeln 90 % ≤ 8 cm
const FILM = require('../film.js'); let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, gs = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / Math.sqrt(.5); };
function room(o) { // o: poly (Grundriss, gegen den Uhrzeigersinn), Hh, rot, k, noise, furn [{x,z,w,d,h}], door {z}, ghost, slope {wall: Index der Wand mit Kniestock, knee: Kniestockhöhe}
  const k = o.k ?? 1, th = (o.rot || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), noise = o.noise ?? 0.02, pts = [], pc = [], P = o.poly, Hh = o.Hh;
  const push = (x, y, z, g) => { pts.push((x * c - z * s) * k + gs() * noise, y * k + gs() * noise, (x * s + z * c) * k + gs() * noise); pc.push(g); };
  const xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const inside = (x, z) => { let w = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) w = !w; } return w; };
  // Dachschräge: Decke fällt von der Firsthöhe Hh linear bis zum Kniestock an der Wand o.slope.wall (nur Rechteck-Fall: Wand 0 = z=z0 … hier: Schräge entlang z)
  const ceilAt = (x, z) => o.slope ? Math.max(o.slope.knee, Hh - (Hh - o.slope.knee) * (z1 - z) / (z1 - z0)) : Hh;
  const per = []; let tot = 0; for (let j = 0; j < P.length; j++) { const a = P[j], b = P[(j + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); per.push(L); tot += L; }
  const N = o.n ?? 60000, NG = 12;
  for (let i = 0; i < N; i++) { const r = rnd(), g = (rnd() * NG) | 0;
    if (r < 0.45) { let t = rnd() * tot, j = 0; while (t > per[j]) { t -= per[j]; j++; } const a = P[j], b = P[(j + 1) % P.length], f = t / per[j], x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f; push(x, rnd() * ceilAt(x, z), z, g); } // Wände bis zur (schrägen) Decke
    else if (r < 0.68) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (inside(x, z)) push(x, 0, z, g); } // Boden
    else if (r < 0.82) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (inside(x, z)) push(x, ceilAt(x, z), z, g); } // Decke / Schräge
    else if (r < 0.88 && o.ghost) push(o.ghost.x, rnd() * 2, o.ghost.z0 + rnd() * (o.ghost.z1 - o.ghost.z0), 0);
    else if (r < 0.96 && o.furn && o.furn.length) { const F = o.furn[(rnd() * o.furn.length) | 0], sd = rnd(); if (sd < 0.5) push(F.x + rnd() * F.w, rnd() * F.h, F.z + (F.front === 'z0' ? 0 : F.d), g); else if (sd < 0.8) push(F.x + rnd() * F.w, F.h, F.z + rnd() * F.d, g); else push(F.front === 'x' ? F.x : F.x + rnd() * F.w, rnd() * F.h, F.z + rnd() * F.d, g); }
    else if (o.door) push(x1 + rnd() * 1.2, rnd() * 2, o.door.z + (rnd() - 0.5) * 0.9, g);
  }
  const cams = []; for (let i = 0; i < 80; i++) { const x = (x0 + x1) / 2 + (rnd() - 0.5) * 1.2, z = (z0 + z1) / 2 + (rnd() - 0.5) * 1.2; cams.push([(x * c - z * s) * k, 1.4 * k, (x * s + z * c) * k]); }
  return { pts: Float32Array.from(pts), n: pts.length / 3, cams, pc: Uint16Array.from(pc) };
}
const lens = poly => poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]); });
const bestMatch = (L, want) => { let best = null; for (const rev of [false, true]) { const LL = rev ? [...L].reverse() : L; for (let s = 0; s < LL.length; s++) { const M = LL.map((_, i) => LL[(i + s) % LL.length]); if (M.length !== want.length) continue; const e = Math.max(...M.map((v, i) => Math.abs(v - want[i]))); if (!best || e < best.e) best = { e, M }; } } return best; };
const N = +process.argv[2] || 120, res = { ohne: [], moebel: [], L: [] }, fails = []; let okAll = true;
for (let t = 0; t < N; t++) {
  const Wd = 2.4 + rnd() * 4.5, Dp = 2.2 + rnd() * 3.5, Hh = 2.3 + rnd() * 0.5, rot = rnd() * 180 - 90, k = 0.98 + rnd() * 0.04, noise = 0.02 + rnd() * 0.02;
  const lform = rnd() < 0.25, slope = rnd() < 0.5 ? { knee: 0.4 + rnd() * 1.2 } : null, withF = rnd() < 0.5;
  const poly = lform ? [[0, 0], [Wd, 0], [Wd, Dp * 0.55], [Wd * 0.6, Dp * 0.55], [Wd * 0.6, Dp], [0, Dp]] : [[0, 0], [Wd, 0], [Wd, Dp], [0, Dp]];
  const furn = withF ? [{ x: 0.3, z: 0, w: Math.min(2.2, Wd - 0.6), d: 0.9, h: 0.85, front: 'z1' }, { x: Wd - 0.6, z: 0.5, w: 0.6, d: 1.2, h: 2.0, front: 'x' }] : [];
  const o = { poly, Hh, rot, k, noise, slope, furn, door: !lform && rnd() < 0.4 ? { z: Dp * 0.7 } : null, ghost: rnd() < 0.3 ? { x: Wd * 0.4, z0: Dp * 0.2, z1: Dp * 0.8 } : null };
  const R = room(o), useM = rnd() < 0.7, opts = { rect: !lform, markers: useM ? { k: 1 / k, n: 2 } : null, height: useM ? null : Hh };
  const want = lens(poly), r = FILM.solve(R.pts, R.n, R.cams, opts, R.pc);
  const grp = lform ? 'L' : withF ? 'moebel' : 'ohne';
  if (r.err) { res[grp].push(9); fails.push(`#${t} ${grp} ${r.err}`); continue; }
  const kk = r.raw.scaleFrom === 'arcore' ? k : 1; // ohne Maßstabsquelle zählt nur die Form (ARCore-Fehler ±2 % bleibt)
  const m = bestMatch(lens(r.poly).map(v => v / kk), want), e = m ? m.e : 9; res[grp].push(e);
  if (e > 0.08) fails.push(`#${t} ${grp}${slope ? ' Schräge ' + slope.knee.toFixed(1) : ''}${o.door ? ' Tür' : ''}${o.ghost ? ' Schein' : ''} k${k.toFixed(3)} n${(noise * 100).toFixed(0)}cm: ${(m ? m.M : lens(r.poly)).map(v => v.toFixed(2)).join('/')} soll ${want.map(v => v.toFixed(2)).join('/')} → ${(e * 100).toFixed(1)} cm (Maßstab ${r.scale ? r.raw.scaleFrom : 'keiner'}, Quelle Wand ${r.src.wand}/Boden ${r.src.boden})`);
}
const stat = a => { const s = [...a].sort((x, y) => x - y); const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return s.length ? `n=${s.length} Median ${(q(0.5) * 100).toFixed(1)} cm · 90 % ≤ ${(q(0.9) * 100).toFixed(1)} cm · max ${(s[s.length - 1] * 100).toFixed(1)} cm` : 'keine'; };
console.log('Rechteck ohne Möbel:', stat(res.ohne)); console.log('Rechteck mit Möbeln: ', stat(res.moebel)); console.log('L-Form (Polygon):    ', stat(res.L));
if (fails.length) { console.log(`Auffällige Fälle (${fails.length}):`); fails.slice(0, 12).forEach(x => console.log('  ' + x)); }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
if (q(res.ohne, 0.5) > 0.02 || q(res.ohne, 0.9) > 0.05 || q(res.moebel, 0.9) > 0.08 || q(res.L, 0.9) > 0.08) okAll = false;
console.log('Raum filmen (Boden):', okAll ? 'OK' : 'FEHLER'); process.exit(okAll ? 0 : 1);
