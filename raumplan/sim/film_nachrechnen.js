// Gesendete Messung (fall.json aus dem Entwicklermodus, Quelle „Raum filmen“) offline nachrechnen:
//   node sim/film_nachrechnen.js fall-2026-11-05-12-00-00.json [Raumhöhe m] [rect|poly]
// Zeigt Boden/Decke, Punktverteilung nach Höhe, Hülle, Wände – mit und ohne Mehrfachsicht – und was die App daraus gemacht hat.
const fs = require('fs'), path = require('path'), FILM = require('../film.js');
const f = process.argv[2]; if (!f) { console.log('Datei fehlt'); process.exit(1); }
const J = JSON.parse(fs.readFileSync(f, 'utf8')), raw = (J.ar && J.ar.raw) || J.ar || J.raw || {};
const P = raw.points || []; if (!P.length) { console.log('Keine Rohpunkte (raw.points) in der Datei – älterer App-Stand?'); console.log(JSON.stringify(raw).slice(0, 800)); process.exit(1); }
const n = P.length / 3, pts = Float32Array.from(P), cams = raw.camsXYZ || [], opts = raw.opts || {};
if (process.argv[3]) opts.height = parseFloat(String(process.argv[3]).replace(',', '.')); if (process.argv[4]) opts.rect = process.argv[4] !== 'poly';
if (raw.markerK) opts.markers = raw.markerK;
console.log(`Fall ${J.name || path.basename(f)} · ${n} Rohpunkte (jeder ${raw.pointStep || '?'}. von ${raw.n || '?'}) · ${cams.length} Kameraorte · ${raw.secs || '?'} s · Bilder ${raw.frames || '?'} · Zeilenrichtung ${raw.flip} · Marken-Sichtungen ${raw.mobs || 0}${raw.markerK ? ` → k ${raw.markerK.k.toFixed(4)} (n ${raw.markerK.n})` : ''}`);
console.log(`App-Ergebnis: Boden ${raw.floor}, Decke ${raw.ceil}, Maßstab ${raw.k} aus ${raw.scaleFrom || '?'}, Höhenkontrolle ${raw.hChk ?? '–'}, Rechteckwinkel ${raw.ang ?? '–'}`);
// Höhenverteilung
const H = new Map(); for (let i = 0; i < n; i++) { const k = Math.round(pts[i * 3 + 1] / 0.1); H.set(k, (H.get(k) || 0) + 1); }
console.log('Punkte je 10 cm Höhe:', [...H.entries()].sort((a, b) => a[0] - b[0]).map(([k, c]) => `${(k * 0.1).toFixed(1)}:${c}`).join(' '));
const fc = FILM.floorCeil(pts, n); console.log('Boden/Decke nachgerechnet:', fc);
if (fc.floor !== null) { const { B } = FILM.band(pts, n, fc.floor, fc.ceil); console.log(`Wandband (obere Hälfte): ${B.length / 2} Punkte`);
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; }, center = cams.length ? [med(cams.map(c => c[0])), med(cams.map(c => c[2]))] : [0, 0];
  const E = FILM.envelope(B, center); console.log(`Hülle ohne Mehrfachsicht: ${E.length} Winkel; Abstände min/median/max ${Math.min(...E.map(e => e.d)).toFixed(2)} / ${med(E.map(e => e.d)).toFixed(2)} / ${Math.max(...E.map(e => e.d)).toFixed(2)} m`);
  for (const rect of [true, false]) { const r = FILM.solve(pts, n, cams, { ...opts, rect }); console.log(rect ? 'Rechteck:' : 'Polygon:', r.err ? r.err : `${r.poly.length} Wände ${r.poly.map((p, i) => { const q = r.poly[(i + 1) % r.poly.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]).toFixed(3); }).join(' / ')} m · ± ${r.sigma.map(s => Math.round(s * 1000)).join('/')} mm · Maßstab ${r.scale ? r.scale.k.toFixed(4) + ' aus ' + r.raw.scaleFrom : 'keiner'} · ${r.cover.toFixed(0)} % gesehen`); }
  // ASCII-Karte von oben (Wandband), 10 cm Raster
  const xs = [], zs = []; for (let i = 0; i < B.length; i += 2) { xs.push(B[i]); zs.push(B[i + 1]); } const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs), W = Math.min(80, Math.ceil((x1 - x0) / 0.1) + 1), Hh = Math.min(40, Math.ceil((z1 - z0) / 0.1) + 1);
  const G = Array.from({ length: Hh }, () => new Array(W).fill(0)); for (let i = 0; i < xs.length; i++) { const cx = Math.min(W - 1, Math.floor((xs[i] - x0) / 0.1)), cz = Math.min(Hh - 1, Math.floor((zs[i] - z0) / 0.1)); G[cz][cx]++; }
  console.log(`Karte von oben (10 cm, x ${x0.toFixed(1)}…${x1.toFixed(1)}, z ${z0.toFixed(1)}…${z1.toFixed(1)}; K = Kamera):`);
  for (let r = 0; r < Hh; r++) console.log(G[r].map((c, cI) => cams.some(k => Math.floor((k[0] - x0) / 0.1) === cI && Math.floor((k[2] - z0) / 0.1) === r) ? 'K' : c >= 8 ? '#' : c >= 3 ? '+' : c ? '.' : ' ').join('')); }
