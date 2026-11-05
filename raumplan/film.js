'use strict';
/* Raumplan – „Raum filmen“: Tiefenpunkte aus ARCore (WebXR depth-sensing) sammeln, Boden/Decke/Wände selbst finden.
   Kein Antippen: der Nutzer legt den Zollstock mit den 2 Bodenblättern (Marken 0/1 bzw. 2/3, je 2,000 m) auf den Boden und filmt rundherum.
   Maßstab: 1. Marken am Zollstock (automatisch im kleinen Kamerabild erkannt), 2. angesagte Raumhöhe ÷ gemessener Abstand Boden–Decke (optional), 3. nur ARCore.
   Geometrie (solve, floorCeil, band, envelope, segments, rectFit, polyFit) ist rein und in Node testbar (sim/test_film.js). */
const FILM = (() => {
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
  const el = id => document.getElementById(id);
  const st = { pts: null, pc: null, n: 0, cams: [], s: null, done: null, opts: {}, flip: null, frames: 0, t0: 0, mobs: [] };

  // ---------- Geometrie ----------
  // Höhenverteilung → Boden (tiefster dichter Peak) und Decke (höchster dichter Peak); y in m, Bins 2 cm
  function floorCeil(pts, n) {
    const H = new Map(); for (let i = 0; i < n; i++) { const k = Math.round(pts[i * 3 + 1] / 0.02); H.set(k, (H.get(k) || 0) + 1); }
    if (!H.size) return { floor: null, ceil: null };
    const ks = [...H.keys()].sort((a, b) => a - b), mx = Math.max(...H.values()), thr = Math.max(8, mx * 0.12), g3 = k => (H.get(k - 1) || 0) + (H.get(k) || 0) + (H.get(k + 1) || 0);
    const peak = (iter, dir) => { for (const k of iter) { if (g3(k) >= thr) { let b = k; for (let j = k; j !== k + dir * 6; j += dir) if (g3(j) > g3(b)) b = j; return b; } } return null; };
    const refine = k => { if (k === null) return null; let s = 0, c = 0; for (let j = k - 3; j <= k + 3; j++) { const v = H.get(j) || 0; s += j * 0.02 * v; c += v; } return c ? s / c : null; };
    const floor = refine(peak(ks, 1)), ceil = refine(peak([...ks].reverse(), -1));
    return { floor, ceil: ceil !== null && floor !== null && ceil - floor > 1.6 && ceil - floor < 6 ? ceil : null };
  }
  // obere Wandhälfte (über Sofa, Tisch, Bett): nur diese Punkte bestimmen die Wände; pc = Kameragruppe je Punkt (optional)
  function band(pts, n, floor, ceil, pc) {
    const H = ceil !== null ? ceil - floor : 2.5, lo = floor + 0.45 * H, hi = floor + H - 0.1, B = [], G = [];
    for (let i = 0; i < n; i++) { const y = pts[i * 3 + 1]; if (y >= lo && y <= hi) { B.push(pts[i * 3], pts[i * 3 + 2]); G.push(pc ? pc[i] : 0); } }
    return { B: Float32Array.from(B), G: Uint16Array.from(G) };
  }
  function cells(B, c = 0.02) { const G = new Map(); for (let i = 0; i < B.length; i += 2) { const k = Math.round(B[i] / c) * 65536 + Math.round(B[i + 1] / c); const q = G.get(k); if (q) q.n++; else G.set(k, { x: Math.round(B[i] / c) * c, z: Math.round(B[i + 1] / c) * c, n: 1 }); } return [...G.values()].filter(q => q.n >= 2); }
  // Hülle: je Winkelgrad um die Mitte die NÄCHSTE dichte Fläche – Abstandshistogramm 2 cm, Peak statt Randwert.
  // Mehrfachsicht: eine Fläche zählt nur, wenn sie aus ≥ 2 verschiedenen Kamerastandorten gesehen wurde (Scheinflächen der Tiefenschätzung sind blickabhängig)
  function envelope(B, center, step = 1, G = null) {
    const nb = Math.round(360 / step), bins = Array.from({ length: nb }, () => []), gb = Array.from({ length: nb }, () => []);
    const ng = G ? new Set(G).size : 1;
    for (let i = 0; i < B.length; i += 2) { const dx = B[i] - center[0], dz = B[i + 1] - center[1], d = Math.hypot(dx, dz); if (d < 0.3) continue; const b = Math.floor(((Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360) / step) % nb; bins[b].push(d); gb[b].push(G ? G[i >> 1] : 0); }
    const E = [];
    bins.forEach((Bn, i) => { if (Bn.length < 6) return; const h = new Map(), hg = new Map(); for (let j = 0; j < Bn.length; j++) { const k = Math.round(Bn[j] / 0.02); h.set(k, (h.get(k) || 0) + 1); if (ng > 1) { let S = hg.get(k); if (!S) hg.set(k, S = new Set()); S.add(gb[i][j]); } }
      const g3 = k => (h.get(k - 1) || 0) + (h.get(k) || 0) + (h.get(k + 1) || 0), grp = k => { if (ng <= 1) return 2; const S = new Set(); for (const j of [k - 1, k, k + 1]) { const T = hg.get(j); if (T) T.forEach(v => S.add(v)); } return S.size; };
      const ks = [...h.keys()].sort((a, b) => a - b), mx = Math.max(...ks.map(g3)), thr = Math.max(5, 0.25 * mx);
      let b = null; for (const k of ks) if (g3(k) >= thr && grp(k) >= 2) { b = k; for (let j = k; j < k + 6; j++) if (g3(j) > g3(b)) b = j; break; } if (b === null) return;
      let s = 0, c = 0; for (let j = b - 2; j <= b + 2; j++) { const v = h.get(j) || 0; s += j * 0.02 * v; c += v; } const d = s / c, ang = (i + 0.5) * step * Math.PI / 180;
      E.push({ ang, d, x: center[0] + Math.cos(ang) * d, z: center[1] + Math.sin(ang) * d, n: c }); });
    return E;
  }
  const fitLine = S => { const mx = S.reduce((q, p) => q + p[0], 0) / S.length, mz = S.reduce((q, p) => q + p[1], 0) / S.length; let sxx = 0, szz = 0, sxz = 0; for (const p of S) { sxx += (p[0] - mx) ** 2; szz += (p[1] - mz) ** 2; sxz += (p[0] - mx) * (p[1] - mz); }
    const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz), e = [Math.cos(ang), Math.sin(ang)], res = S.map(p => Math.abs(-(p[0] - mx) * e[1] + (p[1] - mz) * e[0])), ts = S.map(p => (p[0] - mx) * e[0] + (p[1] - mz) * e[1]);
    return { m: [mx, mz], e, n: S.length, S, sd: Math.sqrt(res.reduce((q, r) => q + r * r, 0) / Math.max(1, S.length - 2)), len: Math.max(...ts) - Math.min(...ts) }; };
  // Hülle → Geradenstücke: Douglas-Peucker (8 cm), Ausgleichsgeraden, fast gleich gerichtete Nachbarn und kurze Reste zusammenlegen
  function segments(E, tol = 0.08) {
    if (E.length < 8) return [];
    let s0 = 0; for (let i = 1; i < E.length; i++) if (E[i].d > E[s0].d) s0 = i;
    const Q = E.slice(s0).concat(E.slice(0, s0)).map(p => [p.x, p.z]), Pc = Q.concat([Q[0]]);
    const dist = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
    const idx = [0]; (function run(i0, i1) { let bi = -1, bd = 0; for (let i = i0 + 1; i < i1; i++) { const d = dist(Pc[i], Pc[i0], Pc[i1]); if (d > bd) { bd = d; bi = i; } } if (bd > tol) { run(i0, bi); idx.push(bi); run(bi, i1); } })(0, Pc.length - 1);
    let L = []; for (let k = 0; k < idx.length; k++) { const a = idx[k], b = k + 1 < idx.length ? idx[k + 1] : Pc.length - 1, S = Q.slice(a, Math.max(a + 2, b + 1)); if (S.length >= 2) L.push(fitLine(S)); }
    for (let pass = 0; pass < 8 && L.length > 3; pass++) { let merged = false;
      for (let i = 0; i < L.length && !merged; i++) { const j = (i + 1) % L.length, a = L[i], b = L[j], cosang = Math.abs(a.e[0] * b.e[0] + a.e[1] * b.e[1]);
        if (cosang > Math.cos(12 * Math.PI / 180) || Math.min(a.len, b.len) < 0.3) { const m = fitLine(a.S.concat(b.S)); if (m.sd < 0.06 || Math.min(a.len, b.len) < 0.3) { if (j > i) L.splice(i, 2, m); else { L.splice(i, 1); L.splice(j, 1, m); } merged = true; } } }
      if (!merged) break; }
    return L;
  }
  // Rechteck: Richtung = längengewichtetes Mittel der Geradenstücke (mod 90°), je Seite die dichteste Lage der Hüllpunkte
  function rectFit(E) {
    const L = segments(E); if (L.length < 2) return { err: 'Zu wenige Wände erkannt – bitte noch einmal langsam rundherum filmen.' };
    let sx = 0, sy = 0; for (const l of L) { const a = Math.atan2(l.e[1], l.e[0]) * 4, w = l.len * l.n; sx += Math.cos(a) * w; sy += Math.sin(a) * w; }
    const th = Math.atan2(sy, sx) / 4, c = Math.cos(th), s = Math.sin(th);
    const U = E.map(p => ({ u: p.x * c + p.z * s, v: -p.x * s + p.z * c })), cu = med(U.map(p => p.u)), cv = med(U.map(p => p.v));
    const side = (key, sign, ctr) => { const vals = U.map(p => sign * (p[key] - ctr)).filter(v => v > 0.1); if (vals.length < 5) return null;
      const h = new Map(); for (const v of vals) { const k = Math.round(v / 0.02); h.set(k, (h.get(k) || 0) + 1); }
      let best = null, bc = 0; for (const [k, cnt] of h) { const cc = cnt + 0.5 * ((h.get(k - 1) || 0) + (h.get(k + 1) || 0)); if (cc > bc) { bc = cc; best = k; } }
      const sel = vals.filter(v => Math.abs(v - best * 0.02) <= 0.04), m = sel.reduce((a, b) => a + b, 0) / sel.length, sd = Math.sqrt(sel.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, sel.length - 1));
      return { pos: ctr + sign * m, n: sel.length, sd }; };
    const S = [side('u', 1, cu), side('v', 1, cv), side('u', -1, cu), side('v', -1, cv)]; if (S.some(x => !x)) return { err: 'Nicht alle vier Wände gefunden – bitte noch einmal rundherum filmen.' };
    const [u1, v1, u0, v0] = S.map(x => x.pos), back = (u, v) => [u * c - v * s, u * s + v * c];
    const poly = [back(u0, v0), back(u1, v0), back(u1, v1), back(u0, v1)];
    const sg = x => Math.hypot(x.sd / Math.sqrt(x.n), 0.008);
    return { poly, sigma: [sg(S[3]), sg(S[0]), sg(S[1]), sg(S[2])], ang: th * 180 / Math.PI, fit: S.map(x => ({ n: x.n, sd: +x.sd.toFixed(3) })) };
  }
  // beliebiger Grundriss: Geradenstücke, Ecken = Schnitt benachbarter Geraden
  function polyFit(E) {
    const L = segments(E); if (L.length < 3) return { err: 'Zu wenige Wände erkannt – bitte noch einmal langsam rundherum filmen.' };
    const poly = [], sigma = [];
    for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length], den = a.e[0] * b.e[1] - a.e[1] * b.e[0];
      if (Math.abs(den) < 0.17) poly.push([a.m[0] + a.e[0] * a.len / 2, a.m[1] + a.e[1] * a.len / 2]);
      else { const t = ((b.m[0] - a.m[0]) * b.e[1] - (b.m[1] - a.m[1]) * b.e[0]) / den; poly.push([a.m[0] + a.e[0] * t, a.m[1] + a.e[1] * t]); } }
    for (let i = 0; i < L.length; i++) { const l = L[(i + 1) % L.length]; sigma.push(Math.hypot(l.sd / Math.sqrt(l.n), 0.01)); }
    return { poly, sigma, fit: L.map(l => ({ n: l.n, sd: +l.sd.toFixed(3), len: +l.len.toFixed(2) })) };
  }
  // Gesamt: Punkte (Float32Array x,y,z…), Kameraorte, Optionen {height: Raumhöhe m (optional), rect: bool, markers: {k, n} (optional)}, pc: Kameragruppe je Punkt
  function solve(pts, n, cams, opts, pc = null) {
    if (n < 2000) return { err: 'Zu wenige Tiefenpunkte – das Handy braucht Bewegung und Licht. Bitte langsam rundherum filmen.' };
    const fc = floorCeil(pts, n); if (fc.floor === null) return { err: 'Boden nicht gefunden – bitte auch den Boden filmen.' };
    const { B, G } = band(pts, n, fc.floor, fc.ceil, pc); if (B.length < 600) return { err: 'Zu wenige Wandpunkte – Wände bitte näher und langsamer filmen, auch den oberen Teil.' };
    const center = cams.length ? [med(cams.map(c => c[0])), med(cams.map(c => c[2]))] : [med(Array.from(B.filter((_, i) => i % 2 === 0))), med(Array.from(B.filter((_, i) => i % 2 === 1)))];
    const E = envelope(B, center, 1, pc ? G : null); if (E.length < 120) return { err: `Nur ${Math.round(E.length / 3.6)} % des Raums gesehen – bitte einmal ganz rundherum filmen.` };
    const g = opts.rect ? rectFit(E) : polyFit(E); if (g.err) return g;
    const hMeas = fc.ceil !== null ? fc.ceil - fc.floor : null, mk = opts.markers && opts.markers.k > 0.85 && opts.markers.k < 1.15 ? opts.markers : null;
    let k = 1, scale = null;
    if (mk) scale = { k: k = mk.k, n: mk.n, sig: 0.003, auto: true, marker: true };
    else if (hMeas && opts.height) scale = { k: k = opts.height / hMeas, n: 1, sig: 0.006, auto: true, height: true };
    const poly = g.poly.map(p => [p[0] * k, p[1] * k]), sigma = g.sigma.map(s => s * k);
    const hChk = mk && hMeas && opts.height ? (hMeas * k / opts.height - 1) * 100 : null; // Kontrolle: Raumhöhe laut Decke vs. angesagt (%)
    return { poly, sigma, scale, height: hMeas ? hMeas * k : null, floor: fc.floor, ceil: fc.ceil, cover: E.length / 3.6, cells: B.length / 2, fit: g.fit, hChk, raw: { n, cams: cams.length, floor: fc.floor, ceil: fc.ceil, k, scaleFrom: mk ? 'marken' : scale ? 'raumhoehe' : 'arcore', hChk, opts, ang: g.ang } };
  }

  // ---------- AR-Sitzung (nur im Browser) ----------
  const MAXP = 600000;
  function addPoint(x, y, z) { const g = Math.min(65535, st.cams.length); if (st.n < MAXP) { st.pts[st.n * 3] = x; st.pts[st.n * 3 + 1] = y; st.pts[st.n * 3 + 2] = z; st.pc[st.n] = g; st.n++; } else { const i = (Math.random() * MAXP) | 0; st.pts[i * 3] = x; st.pts[i * 3 + 1] = y; st.pts[i * 3 + 2] = z; st.pc[i] = g; } }
  function camGroups() { // Kameragruppen (0,3 m) je gespeicherter Kameraindex → Uint16 je Punkt
    const key = c => Math.round(c[0] / 0.3) * 4096 + Math.round(c[2] / 0.3), ids = new Map(), gi = st.cams.map(c => { const k = key(c); if (!ids.has(k)) ids.set(k, ids.size); return ids.get(k); });
    const pc = new Uint16Array(st.n); for (let i = 0; i < st.n; i++) pc[i] = gi[Math.min(st.pc[i], gi.length - 1)] || 0; return { pc, groups: ids.size };
  }
  function markerScale() { if (st.mobs.length < 30 || typeof AR === 'undefined') return null; try { const fy = st.fc && st.fc.floor !== null ? st.fc.floor : 0; const r = AR.autoScale(st.mobs, 2, fy); return r && r.k ? r : null; } catch (e) { return null; } }
  function ui(msg) { const m = el('filmMsg'); if (m && msg !== undefined) m.innerHTML = msg; const fc = st.frames > 40 ? floorCeil(st.pts, st.n) : { floor: null, ceil: null }; st.fc = fc; const ms = markerScale(); st.ms = ms;
    const cnt = {}; st.mobs.forEach(o => cnt[o.id] = (cnt[o.id] || 0) + 1); const seen = [0, 1, 2, 3].filter(i => cnt[i] >= 15);
    const camY = st.cams.length && fc.floor !== null ? st.cams[st.cams.length - 1][1] - fc.floor : null, live = st.live && !st.live.err ? st.live : null, dims = live ? live.poly.slice(0, 2).map((p, i) => { const q = live.poly[(i + 1) % live.poly.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]).toFixed(2).replace('.', ','); }) : null;
    const t = el('filmTop'); if (t) t.innerHTML = `${st.n.toLocaleString('de-AT')} Punkte · Ausrichtung ${st.flip === null ? '… (nach unten schauen)' : 'ABCD'[st.flip] + ' ✓'} · Boden ${fc.floor !== null ? '✓' : '…'} · Decke ${fc.ceil !== null ? `✓ ${(fc.ceil - fc.floor).toFixed(2).replace('.', ',')} m` : '…'}${camY !== null ? ` · Handy ${camY.toFixed(2).replace('.', ',')} m hoch` : ''}${live ? `<br><b>Raum ca. ${dims[0]} × ${dims[1]} m</b> (${live.poly.length} Wände, ${Math.round(live.cover)} % gesehen)` : st.live && st.live.err ? `<br>${st.live.err}` : ''}<br>Zollstock-Marken ${st.camOk ? (seen.length ? seen.join(',') + (ms ? ` ✓ Maßstab ${((ms.k - 1) * 100).toFixed(1).replace('.', ',')} %` : ' (noch aus mehr Richtungen filmen)') : 'noch keine – von oben auf den Zollstock') : 'kein Kamerazugriff'}`; drawMap(); }
  function drawMap() { const cv = el('filmMap'); if (!cv || !st.n) return; const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.fillStyle = '#000a'; g.fillRect(0, 0, W, H);
    const cx = st.cams.length ? st.cams[st.cams.length - 1][0] : 0, cz = st.cams.length ? st.cams[st.cams.length - 1][2] : 0, sc = W / 9;
    const fy = st.fc && st.fc.floor !== null ? st.fc.floor : null, Hh = fy !== null && st.fc.ceil !== null ? st.fc.ceil - fy : 2.5, step = Math.max(1, Math.floor(st.n / 8000));
    g.fillStyle = '#9f9'; for (let i = 0; i < st.n; i += step) { const y = st.pts[i * 3 + 1]; if (fy !== null && (y < fy + 0.45 * Hh || y > fy + Hh - 0.1)) continue; const x = (st.pts[i * 3] - cx) * sc + W / 2, zz = (st.pts[i * 3 + 2] - cz) * sc + H / 2; if (x >= 0 && zz >= 0 && x < W && zz < H) g.fillRect(x, zz, 2, 2); }
    g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < st.cams.length; i++) { const c = st.cams[i], x = (c[0] - cx) * sc + W / 2, zz = (c[2] - cz) * sc + H / 2; i ? g.lineTo(x, zz) : g.moveTo(x, zz); } g.stroke();
    if (st.live && !st.live.err) { const k = st.live.scale ? st.live.scale.k : 1; g.strokeStyle = '#ff9800'; g.lineWidth = 2; g.beginPath(); st.live.poly.forEach((p, i) => { const x = (p[0] / k - cx) * sc + W / 2, zz = (p[1] / k - cz) * sc + H / 2; i ? g.lineTo(x, zz) : g.moveTo(x, zz); }); g.closePath(); g.stroke(); }
    g.fillStyle = '#29b6f6'; g.beginPath(); g.arc(W / 2, H / 2, 4, 0, 7); g.fill(); if (st.dir) { g.strokeStyle = '#29b6f6'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + st.dir[0] * 18, H / 2 + st.dir[1] * 18); g.stroke(); } }
  async function supported() { if (!navigator.xr) return false; return navigator.xr.isSessionSupported('immersive-ar').catch(() => false); }
  // kleines Kamerabild (640 px breit) über einen Shader aus der Kameratextur – statt 8 MB pro Bild nur ~1 MB, kein Ruckeln
  function camGrabber(gl, SW, SH) {
    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p; varying vec2 t; void main(){ t = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, 'precision mediump float; uniform sampler2D u; varying vec2 t; void main(){ gl_FragColor = texture2D(u, t); }'); gl.compileShader(fs);
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const loc = gl.getAttribLocation(pr, 'p'), px = new Uint8Array(SW * SH * 4), g = new Float32Array(SW * SH);
    return (camTex) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, SW, SH); gl.useProgram(pr); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, camTex); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.readPixels(0, 0, SW, SH, gl.RGBA, gl.UNSIGNED_BYTE, px); for (let y = 0; y < SH; y++) { const r = (SH - 1 - y) * SW * 4; for (let x = 0; x < SW; x++) { const j = r + x * 4; g[y * SW + x] = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2]; } } return g; };
  }
  async function start(opts, onDone) {
    const root = el('filmUI'); root.hidden = false;
    Object.assign(st, { pts: new Float32Array(MAXP * 3), pc: new Uint16Array(MAXP), n: 0, cams: [], done: onDone, opts, flip: null, orient: [[0, 0], [0, 0], [0, 0], [0, 0]], frames: 0, t0: Date.now(), fc: null, ms: null, dir: null, lastUi: 0, lastMk: 0, lastLive: 0, live: null, noDepth: 0, mobs: [], camOk: false, grab: null, rec: [], thumbs: [], lastThumb: 0 });
    let s; try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['depth-sensing'], optionalFeatures: ['dom-overlay', 'local-floor', 'camera-access'], domOverlay: { root }, depthSensing: { usagePreference: ['cpu-optimized'], dataFormatPreference: ['luminance-alpha', 'float32'] } }); }
    catch (e) { root.hidden = true; return onDone({ err: 'nodepth', msg: e.message }); }
    st.s = s; const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { xrCompatible: true });
    await s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
    let space; try { space = await s.requestReferenceSpace('local-floor'); } catch (e) { space = await s.requestReferenceSpace('local'); }
    let glb = null; try { if ((s.enabledFeatures || []).includes('camera-access') && typeof XRWebGLBinding !== 'undefined') { glb = new XRWebGLBinding(s, gl); st.camOk = true; } } catch (e) { }
    s.addEventListener('end', () => { st.s = null; root.hidden = true; });
    ui('Zuerst <b>nach unten auf den Zollstock</b> mit den Blättern schauen (1–2 m Abstand, 2–3 Richtungen) – so lernt die App auch die Ausrichtung des Tiefenbilds. Dann langsam <b>rundherum</b>: alle Wände bis oben, kurz Boden und Decke. Die orange Linie unten ist der erkannte Raum.');
    // Tiefenbild → Weltpunkt. Vier mögliche Ausrichtungen des Tiefenbilds (Zeilen von oben/unten, Zeilen/Spalten vertauscht):
    // A: ny aus v (oben = oben), B: ny aus 1−v, C: ny aus u, D: ny aus 1−u. Entscheidung: beim Blick nach unten müssen die Punkte unter der Kamera liegen.
    const conv = (u, v, d, mode, M, P) => { let nx, ny; if (mode === 0) { nx = 2 * u - 1; ny = 1 - 2 * v; } else if (mode === 1) { nx = 2 * u - 1; ny = 2 * v - 1; } else if (mode === 2) { nx = 2 * v - 1; ny = 1 - 2 * u; } else { nx = 2 * v - 1; ny = 2 * u - 1; }
      const x = d * (nx + P[8]) / P[0], y = d * (ny + P[9]) / P[5], z = -d; return [M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]]; };
    const frame = (t, f) => {
      if (!st.s) return; s.requestAnimationFrame(frame);
      const bl = s.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const vp = f.getViewerPose(space); if (!vp) return; const view = vp.views[0]; st.frames++;
      const M = view.transform.matrix, P = view.projectionMatrix, cp = [M[12], M[13], M[14]]; if (st.frames % 6 === 0) st.cams.push(cp); st.dir = [-M[8], -M[10]];
      const look = -M[9]; // Blickrichtung y: < 0 = nach unten
      if (glb && view.camera && t - st.lastMk > 350 && st.mobs.length < 600) { st.lastMk = t;
        try { const W = view.camera.width, H = view.camera.height, SW = 640, SH = Math.round(640 * H / W); if (!st.grab) st.grab = camGrabber(gl, SW, SH);
          if (st.grab) { const tex = glb.getCameraImage(view.camera), g = st.grab(tex); gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.viewport(0, 0, bl.framebufferWidth, bl.framebufferHeight);
            const proj = Float64Array.from(P), cam = Float64Array.from(M);
            if (t - st.lastThumb > 1500 && st.thumbs.length < 40) { st.lastThumb = t; try { const c2 = document.createElement('canvas'); c2.width = SW; c2.height = SH; const q = c2.getContext('2d'), im = q.createImageData(SW, SH); for (let i = 0; i < SW * SH; i++) { const v = g[i]; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } q.putImageData(im, 0, 0); const tt = Math.round(t), MM = Array.from(M, v => +v.toFixed(4)); c2.toBlob(b => { if (b) st.thumbs.push(new File([b], `bild-${String(st.thumbs.length).padStart(3, '0')}-${tt}.jpg`, { type: 'image/jpeg' })); }, 'image/jpeg', 0.6); } catch (e) { } }
            setTimeout(() => { try { MK.detect(g, SW, SH, { maxW: SW }).filter(m => m.id <= 3 && m.res < 0.8).forEach(m => { const c = AR.markerCenter(m.c); st.mobs.push({ id: m.id, u: c[0], v: c[1], W: SW, H: SH, proj, cam }); }); } catch (e) { } }, 0); } }
        catch (e) { st.camOk = false; } }
      let di = null; try { di = f.getDepthInformation(view); } catch (e) { } if (!di) { st.noDepth++; if (st.noDepth === 90) ui('⚠ Noch keine Tiefendaten – Handy langsam hin und her bewegen, Raum muss hell genug sein.'); return; }
      if (st.frames % 2) return;
      const NX = 32, NY = 24, dm = new Uint16Array(NX * NY);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const u = (i + 0.5) / NX, v = (j + 0.5) / NY; let d; try { d = di.getDepthInMeters(u, v); } catch (e) { continue; } if (!(d > 0.3 && d < 6)) continue; dm[j * NX + i] = Math.round(d * 1000);
        if (st.flip === null) { if (Math.abs(look) > 0.4) for (let m = 0; m < 4; m++) { const q = conv(u, v, d, m, M, P); const below = q[1] < cp[1]; st.orient[m][0] += (look < 0) === below ? 1 : 0; st.orient[m][1]++; } }
        else { const q = conv(u, v, d, st.flip, M, P); addPoint(q[0], q[1], q[2]); } }
      if (st.rec.length < 4000) st.rec.push({ t: Math.round(t), M: Array.from(M, v => +v.toFixed(5)), P: [P[0], P[5], P[8], P[9]], look: +look.toFixed(3), d: dm });
      if (st.flip === null && st.orient[0][1] >= 1500) { let best = 0; for (let m = 1; m < 4; m++) if (st.orient[m][0] / st.orient[m][1] > st.orient[best][0] / st.orient[best][1]) best = m; const q = st.orient[best][0] / st.orient[best][1]; if (q >= 0.75) { st.flip = best; st.orientQ = q; navigator.vibrate?.(40); } else st.orient = [[0, 0], [0, 0], [0, 0], [0, 0]]; }
      if (st.flip !== null && t - st.lastLive > 2500 && st.n > 8000) { st.lastLive = t; try { const { pc, groups } = camGroups(); st.live = solve(st.pts, st.n, st.cams, { ...st.opts, markers: markerScale() }, groups > 1 ? pc : null); } catch (e) { st.live = { err: e.message }; } }
      if (t - st.lastUi > 400) { st.lastUi = t; ui(); }
    };
    s.requestAnimationFrame(frame);
  }
  function finish() { if (!st.s) return;
    const { pc, groups } = camGroups(), ms = markerScale();
    let r = st.flip === null ? { err: 'Ausrichtung nicht bestimmt – es wurden keine Punkte gesammelt. Beim nächsten Mal zuerst schräg nach unten auf Boden/Zollstock schauen.' } : solve(st.pts, st.n, st.cams, { ...st.opts, markers: ms }, groups > 1 ? pc : null);
    const step = Math.max(1, Math.ceil(st.n / 40000)), P = []; for (let i = 0; i < st.n; i += step) P.push(+st.pts[i * 3].toFixed(3), +st.pts[i * 3 + 1].toFixed(3), +st.pts[i * 3 + 2].toFixed(3));
    const b64 = a => { let s = ''; const u = new Uint8Array(a.buffer); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
    const fc = st.fc || floorCeil(st.pts, st.n);
    r.raw = { ...(r.raw || {}), n: st.n, flip: st.flip, orientQ: st.orientQ, orient: st.orient, groups, frames: st.frames, secs: Math.round((Date.now() - st.t0) / 1000), mobs: st.mobs.length, markerK: ms, floor: fc.floor, ceil: fc.ceil, points: P, pointStep: step, camsXYZ: st.cams.map(c => c.map(v => +v.toFixed(3))), opts: st.opts,
      rec: { NX: 32, NY: 24, n: st.rec.length, frames: st.rec.map(q => ({ t: q.t, M: q.M, P: q.P, look: q.look, d: b64(q.d) })) } };
    r.thumbs = st.thumbs.slice(); r.view = { pts: Float32Array.from(P), n: P.length / 3, cams: r.raw.camsXYZ, floor: fc.floor ?? 0, ceil: fc.ceil };
    st.s.end(); st.done && st.done(r); }
  function cancel() { st.s && st.s.end(); }
  return { start, finish, cancel, supported, solve, floorCeil, band, cells, envelope, segments, rectFit, polyFit, _st: st };
})();
if (typeof module !== 'undefined') module.exports = FILM;
