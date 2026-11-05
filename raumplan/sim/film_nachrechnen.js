// Gesendete Messung (fall.json, Quelle „Raum filmen“) offline nachrechnen:
//   node sim/film_nachrechnen.js fall-….json [rect|poly] [Ausrichtung 0-3]
// Mit Mitschnitt (raw.rec: Pose + Tiefenraster je Bild) wird die Punktwolke für alle 4 Ausrichtungen neu aufgebaut und bewertet;
// sonst werden die gespeicherten Punkte (raw.points) genommen. Ausgabe: Höhenverteilung, Boden/Decke, Hülle, Rechteck/Polygon, ASCII-Karte.
const fs = require('fs'), path = require('path'), FILM = require('../film.js');
const f = process.argv[2]; if (!f) { console.log('Datei fehlt'); process.exit(1); }
const J = JSON.parse(fs.readFileSync(f, 'utf8')), raw = (J.ar && J.ar.raw) || J.ar || J.raw || {};
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
console.log(`Fall ${J.name || path.basename(f)} · ${J.fehler ? 'FEHLER: ' + J.fehler : 'ok'} · Punkte ${raw.n || '?'} · Kameras ${(raw.camsXYZ || []).length} · ${raw.secs || '?'} s · Bilder ${raw.frames || '?'} · Ausrichtung ${raw.flip} (Güte ${raw.orientQ ?? '–'}, Zähler ${JSON.stringify(raw.orient || null)}) · Marken ${raw.mobs || 0}${raw.markerK ? ` → k ${raw.markerK.k.toFixed(4)}` : ''}`);
console.log(`App: Boden ${raw.floor}, Decke ${raw.ceil}, Maßstab ${raw.k} aus ${raw.scaleFrom || '?'}, Rechteckwinkel ${raw.ang ?? '–'}`);
const conv = (u, v, d, mode, M, P) => { let nx, ny; if (mode === 0) { nx = 2 * u - 1; ny = 1 - 2 * v; } else if (mode === 1) { nx = 2 * u - 1; ny = 2 * v - 1; } else if (mode === 2) { nx = 2 * v - 1; ny = 1 - 2 * u; } else { nx = 2 * v - 1; ny = 2 * u - 1; }
  const x = d * (nx + P[2]) / P[0], y = d * (ny + P[3]) / P[1], z = -d; return [M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]]; };
function fromRec(rec, mode) { const { NX, NY } = rec, out = [], cams = []; let below = 0, tot = 0;
  for (const fr of rec.frames) { const d = new Uint16Array(Buffer.from(fr.d, 'base64').buffer, Buffer.from(fr.d, 'base64').byteOffset, NX * NY); const M = fr.M, P = fr.P; cams.push([M[12], M[13], M[14]]);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const mm = d[j * NX + i]; if (!mm) continue; const q = conv((i + 0.5) / NX, (j + 0.5) / NY, mm / 1000, mode, M, P); out.push(q[0], q[1], q[2]); if (Math.abs(fr.look) > 0.4) { tot++; if ((fr.look < 0) === (q[1] < M[13])) below++; } } }
  return { pts: Float32Array.from(out), n: out.length / 3, cams, q: tot ? below / tot : null }; }
let pts, n, cams, modeUsed = raw.flip;
if (raw.rec && raw.rec.frames && raw.rec.frames.length) {
  console.log(`Mitschnitt: ${raw.rec.frames.length} Bilder, Raster ${raw.rec.NX}×${raw.rec.NY}; Blick nach unten/oben in ${raw.rec.frames.filter(q => Math.abs(q.look) > 0.4).length} Bildern`);
  const R = [0, 1, 2, 3].map(m => { const r = fromRec(raw.rec, m), fc = FILM.floorCeil(r.pts, r.n), camY = med(r.cams.map(c => c[1])); return { m, ...r, fc, camY }; });
  R.forEach(r => console.log(` Ausrichtung ${'ABCD'[r.m]}: ${r.n} Punkte, Trefferquote „unter der Kamera beim Blick nach unten“ ${r.q === null ? '–' : (r.q * 100).toFixed(0) + ' %'}, Boden ${r.fc.floor === null ? '–' : r.fc.floor.toFixed(2)}, Decke ${r.fc.ceil === null ? '–' : (r.fc.ceil - r.fc.floor).toFixed(2) + ' m über Boden'}, Kamera ${r.camY === null ? '–' : (r.camY - (r.fc.floor ?? 0)).toFixed(2)} m über Boden`));
  const pick = process.argv[4] != null ? +process.argv[4] : R.reduce((b, r) => (r.q ?? -1) > (b.q ?? -1) ? r : b, R[0]).m; const r = R[pick]; pts = r.pts; n = r.n; cams = r.cams; modeUsed = pick; console.log(`→ verwende Ausrichtung ${'ABCD'[pick]}`);
} else { const P = raw.points || []; if (!P.length) { console.log('Keine Rohpunkte in der Datei.'); process.exit(1); } pts = Float32Array.from(P); n = P.length / 3; cams = raw.camsXYZ || []; }
const opts = { ...(raw.opts || {}), rect: process.argv[3] ? process.argv[3] !== 'poly' : (raw.opts || {}).rect !== false }; if (raw.markerK) opts.markers = raw.markerK;
const H = new Map(); for (let i = 0; i < n; i++) { const k = Math.round(pts[i * 3 + 1] / 0.1); H.set(k, (H.get(k) || 0) + 1); }
console.log('Punkte je 10 cm Höhe:', [...H.entries()].sort((a, b) => a[0] - b[0]).map(([k, c]) => `${(k * 0.1).toFixed(1)}:${c}`).join(' '));
const fc = FILM.floorCeil(pts, n); console.log('Boden/Decke:', fc, cams.length ? `Kamera median ${med(cams.map(c => c[1])).toFixed(2)}` : '');
if (fc.floor !== null) { const { B } = FILM.band(pts, n, fc.floor, fc.ceil); console.log(`Wandband (obere Hälfte): ${B.length / 2} Punkte`);
  const center = cams.length ? [med(cams.map(c => c[0])), med(cams.map(c => c[2]))] : [0, 0]; const E = FILM.envelope(B, center);
  if (E.length) console.log(`Hülle: ${E.length} Winkel; Abstände min/median/max ${Math.min(...E.map(e => e.d)).toFixed(2)} / ${med(E.map(e => e.d)).toFixed(2)} / ${Math.max(...E.map(e => e.d)).toFixed(2)} m`);
  for (const rect of [true, false]) { const r = FILM.solve(pts, n, cams, { ...opts, rect }); console.log(rect ? 'Rechteck:' : 'Polygon:', r.err ? r.err : `${r.poly.length} Wände ${r.poly.map((p, i) => { const q = r.poly[(i + 1) % r.poly.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]).toFixed(3); }).join(' / ')} m · ± ${r.sigma.map(s => Math.round(s * 1000)).join('/')} mm · Maßstab ${r.scale ? r.scale.k.toFixed(4) + ' aus ' + r.raw.scaleFrom : 'keiner'} · ${r.cover.toFixed(0)} % gesehen`); }
  const xs = [], zs = []; for (let i = 0; i < B.length; i += 2) { xs.push(B[i]); zs.push(B[i + 1]); } if (xs.length) { const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs), W = Math.min(80, Math.ceil((x1 - x0) / 0.1) + 1), Hh = Math.min(40, Math.ceil((z1 - z0) / 0.1) + 1);
    const G = Array.from({ length: Hh }, () => new Array(W).fill(0)); for (let i = 0; i < xs.length; i++) { const cx = Math.min(W - 1, Math.floor((xs[i] - x0) / 0.1)), cz = Math.min(Hh - 1, Math.floor((zs[i] - z0) / 0.1)); G[cz][cx]++; }
    console.log(`Karte von oben (10 cm, x ${x0.toFixed(1)}…${x1.toFixed(1)}, z ${z0.toFixed(1)}…${z1.toFixed(1)}; K = Kamera):`);
    for (let r = 0; r < Hh; r++) console.log(G[r].map((c, cI) => cams.some(k => Math.floor((k[0] - x0) / 0.1) === cI && Math.floor((k[2] - z0) / 0.1) === r) ? 'K' : c >= 8 ? '#' : c >= 3 ? '+' : c ? '.' : ' ').join('')); } }
