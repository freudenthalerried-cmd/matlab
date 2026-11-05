// „Raum filmen“: simulierte Tiefenpunkte eines Raums (Wände, Boden, Decke, Möbel, offene Tür mit Korridor, 2 cm Rauschen,
// ARCore-Maßstab 1,5 % falsch, Scheinfläche aus nur einem Standort) → Grundriss; Maßstab aus Marken bzw. Raumhöhe. Wände ±2 cm (Rechteck) / ±6 cm (Polygon – einspringende Ecken sind noch ungenauer).
const FILM = require('../film.js'); let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, gs = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / Math.sqrt(.5); };
function room(Wd, Dp, Hh, o = {}) { // o.rot (°), o.k (ARCore-Fehlerfaktor), o.door (Korridor an Wand x=Wd), o.furn (Möbel), o.poly (L-Form), o.ghost (Scheinfläche, nur von Standort 0 gesehen)
  const k = o.k ?? 1, th = (o.rot || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), noise = o.noise ?? 0.02, pts = [], pc = [], push = (x, y, z, g) => { pts.push((x * c - z * s) * k + gs() * noise, y * k + gs() * noise, (x * s + z * c) * k + gs() * noise); pc.push(g); };
  const N = o.n ?? 60000, NG = 12; for (let i = 0; i < N; i++) { const r = rnd(), y = rnd() * Hh, g = (rnd() * NG) | 0;
    if (r < 0.55) { const P = o.poly || [[0, 0], [Wd, 0], [Wd, Dp], [0, Dp]], per = []; let tot = 0; for (let j = 0; j < P.length; j++) { const a = P[j], b = P[(j + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); per.push(L); tot += L; }
      let t = rnd() * tot, j = 0; while (t > per[j]) { t -= per[j]; j++; } const a = P[j], b = P[(j + 1) % P.length], f = t / per[j]; push(a[0] + (b[0] - a[0]) * f, y, a[1] + (b[1] - a[1]) * f, g); }
    else if (r < 0.7) push(rnd() * Wd, 0, rnd() * Dp, g);
    else if (r < 0.82) push(rnd() * Wd, Hh, rnd() * Dp, g);
    else if (r < 0.9 && o.ghost) push(o.ghost.x, y, o.ghost.z0 + rnd() * (o.ghost.z1 - o.ghost.z0), 0); // Scheinwand mitten im Raum, nur Standort 0
    else if (r < 0.95 && o.furn) { const F = o.furn[(rnd() * o.furn.length) | 0]; const side = rnd(); if (side < 0.6) push(F.x + rnd() * F.w, rnd() * F.h, F.z, g); else push(F.x + rnd() * F.w, F.h, F.z + rnd() * F.d, g); }
    else if (o.door) push(Wd + rnd() * 1.2, y, o.door.z + (rnd() - 0.5) * 0.9, g);
  }
  const cams = []; for (let i = 0; i < 80; i++) { const x = Wd / 2 + (rnd() - 0.5) * 1.2, z = Dp / 2 + (rnd() - 0.5) * 1.2; cams.push([(x * c - z * s) * k, 1.4 * k, (x * s + z * c) * k]); }
  return { pts: Float32Array.from(pts), n: pts.length / 3, cams, pc: Uint16Array.from(pc) };
}
const lens = poly => poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]); });
let ok = true;
const tests = [
  ['Rechteck 4,20 × 3,60, 17°, Möbel, offene Tür, Maßstab aus Raumhöhe', 4.2, 3.6, 2.52, { rot: 17, k: 1.015, furn: [{ x: 0.3, z: 0, w: 2.2, d: 0.9, h: 0.85 }, { x: 3.2, z: 2.5, w: 1.0, d: 1.1, h: 2.0 }], door: { z: 2.9 } }, { rect: true, height: 2.52 }, [4.2, 3.6, 4.2, 3.6]],
  ['Rechteck 5,00 × 2,80, Maßstab aus Marken (2 % daneben), Raumhöhe als Kontrolle', 5.0, 2.8, 2.60, { rot: -31, k: 0.98 }, { rect: true, height: 2.60, markers: { k: 1 / 0.98, n: 2 } }, [5.0, 2.8, 5.0, 2.8]],
  ['Rechteck 4,00 × 3,00 mit Scheinwand (nur 1 Standort), Marken', 4.0, 3.0, 2.50, { rot: 5, k: 1.01, ghost: { x: 1.2, z0: 0.3, z1: 2.7 } }, { rect: true, markers: { k: 1 / 1.01, n: 2 } }, [4.0, 3.0, 4.0, 3.0]],
  ['L-Raum (Polygon-Modus), Raumhöhe', 5.0, 4.0, 2.50, { rot: 8, k: 1.01, poly: [[0, 0], [5, 0], [5, 2.2], [3, 2.2], [3, 4], [0, 4]] }, { rect: false, height: 2.5 }, [5, 2.2, 2, 1.8, 3, 4]],
];
for (const [nm, Wd, Dp, Hh, o, opts, want] of tests) {
  const R = room(Wd, Dp, Hh, o), t0 = Date.now(), r = FILM.solve(R.pts, R.n, R.cams, opts, R.pc), ms = Date.now() - t0;
  if (r.err) { console.log(`${nm}: FEHLER ${r.err}`); ok = false; continue; }
  const L = lens(r.poly); let best = null; for (const rev of [false, true]) { const LL = rev ? [...L].reverse() : L; for (let s = 0; s < LL.length; s++) { const M = LL.map((_, i) => LL[(i + s) % LL.length]); if (M.length !== want.length) continue; const e = Math.max(...M.map((v, i) => Math.abs(v - want[i]))); if (!best || e < best.e) best = { e, M }; } }
  const e = best ? best.e : 9, kw = 1 / (o.k ?? 1);
  console.log(`${nm}: ${r.poly.length} Wände ${(best ? best.M : L).map(v => v.toFixed(3)).join(' / ')} (soll ${want.join(' / ')}), max. Fehler ${(e * 1000).toFixed(0)} mm, ± ${r.sigma.map(s => (s * 1000).toFixed(0)).join('/')} mm, Höhe ${r.height ? r.height.toFixed(3) : '–'} (soll ${Hh}), Maßstab ${r.scale ? r.scale.k.toFixed(4) + ' aus ' + r.raw.scaleFrom : '–'} (soll ${kw.toFixed(4)})${r.hChk != null ? `, Höhenkontrolle ${r.hChk.toFixed(2)} %` : ''}, ${r.cover.toFixed(0)} % gesehen, ${ms} ms`);
  if (e > (opts.rect ? 0.02 : 0.06) || !r.scale || Math.abs(r.scale.k / kw - 1) > 0.008) ok = false;
  if (r.hChk != null && Math.abs(r.hChk) > 1) ok = false;
}
{ const R = room(4, 3, 2.5, { n: 800 }); const r = FILM.solve(R.pts, R.n, R.cams, { height: 2.5, rect: true }); console.log('Zu wenige Punkte:', r.err ? 'Meldung ✓ ' + r.err : 'FEHLT'); if (!r.err) ok = false; }
console.log('Raum filmen:', ok ? 'OK' : 'FEHLER'); process.exit(ok ? 0 : 1);
