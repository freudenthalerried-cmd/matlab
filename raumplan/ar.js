'use strict';
/* Raumplan – AR-Aufmaß ohne Wandmarken (WebXR, Chrome auf Android mit ARCore).
   1) Zollstock: Anfang und Ende antippen (je 1–3 ×) → Maßstab der AR wird auf die bekannte Länge korrigiert.
   2) Wände abtasten: Kreis über die Wand fahren, die App sammelt laufend Punkte (alle 2 cm) – Möbel/Ausreißer werden aussortiert.
   3) Ecken = Schnitt benachbarter Ausgleichsgeraden; Decke antippen → Raumhöhe. Rohdaten können exportiert werden. */
const AR = (() => {
  const st = { s: null, walls: [[]], floorY: [], ceilY: null, hit: null, cam: null, done: null, phase: 'walls', zs: [[], []], zp: [], scan: false, last: null, log: [] };
  const el = id => document.getElementById(id);
  const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  const mean3 = P => [0, 1, 2].map(i => P.reduce((s, p) => s + p[i], 0) / P.length);

  // Gerade durch Punkte (x,z) – orthogonale Regression
  function fitLine0(P) {
    const n = P.length, mx = P.reduce((s, p) => s + p[0], 0) / n, mz = P.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, szz = 0, sxz = 0; P.forEach(p => { const a = p[0] - mx, b = p[1] - mz; sxx += a * a; szz += b * b; sxz += a * b; });
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), d = [Math.cos(th), Math.sin(th)];
    const res = P.map(p => (p[0] - mx) * -d[1] + (p[1] - mz) * d[0]);
    return { c: [mx, mz], d, res, rms: Math.sqrt(res.reduce((s, r) => s + r * r, 0) / n), n };
  }
  // robust: Möbel, Bilder usw. liegen immer VOR der Wand (Raumseite) → einseitig aussortieren; ctr = Raummitte
  function fitLine(P, ctr) {
    let Q = P, L = fitLine0(Q);
    for (let it = 0; it < 6 && Q.length > 4; it++) {
      const sg = ctr ? Math.sign((L.c[0] - ctr[0]) * -L.d[1] + (L.c[1] - ctr[1]) * L.d[0]) || 1 : 1, r = L.res.map(x => x * sg); // r > 0: nach außen
      const m = med(r), mad = 1.4826 * med(r.map(x => Math.abs(x - m)));
      const lo = m - Math.max(ctr ? 0.008 : 0.01, (ctr ? 2.5 : 3) * mad), hi = m + Math.max(0.02, 4 * mad);
      const keep = Q.filter((_, i) => r[i] >= lo && r[i] <= hi);
      if (keep.length === Q.length || keep.length < 3) break; Q = keep; L = fitLine0(Q);
    }
    const prj = Q.map(p => (p[0] - L.c[0]) * L.d[0] + (p[1] - L.c[1]) * L.d[1]), span = Math.max(...prj) - Math.min(...prj);
    return { ...L, used: Q.length, total: P.length, span, sOff: L.rms / Math.sqrt(Q.length) };
  }
  function cross(A, B) { // Schnittpunkt zweier Geraden
    const den = A.d[0] * B.d[1] - A.d[1] * B.d[0]; if (Math.abs(den) < Math.sin(10 / 57.3)) return null;
    const t = ((B.c[0] - A.c[0]) * B.d[1] - (B.c[1] - A.c[1]) * B.d[0]) / den;
    return [A.c[0] + A.d[0] * t, A.c[1] + A.d[1] * t];
  }
  // Wände → Polygon (Ecke i = Schnitt Wand i-1 / Wand i)
  function polygon(walls) {
    const all = walls.flat(), ctr = [all.reduce((a, p) => a + p[0], 0) / all.length, all.reduce((a, p) => a + p[1], 0) / all.length];
    const L = walls.map(w => fitLine(w, ctr)), n = L.length, P = [];
    for (let i = 0; i < n; i++) { const p = cross(L[(i + n - 1) % n], L[i]); if (!p) return { err: `Wand ${i} und Wand ${i + 1} sind fast parallel – war das dieselbe Wand? Dann zuletzt „Rückgängig“.` }; P.push(p); }
    return { P, L };
  }
  // Maßstab aus dem Zollstock: Anfang/Ende (Mittel der Tipps) → Faktor
  // ---- Zollstock-Marken automatisch im Kamerabild (WebXR Raw Camera Access) ----
  function inv4(m) { // 4×4, spaltenweise (WebXR/WebGL)
    const a = m, o = new Float64Array(16);
    o[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
    o[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
    o[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
    o[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
    o[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
    o[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
    o[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
    o[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
    o[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
    o[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
    o[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
    o[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
    o[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
    o[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
    o[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
    o[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
    const det = a[0] * o[0] + a[1] * o[4] + a[2] * o[8] + a[3] * o[12]; for (let i = 0; i < 16; i++) o[i] /= det; return o;
  }
  const mulv = (m, v) => [0, 1, 2, 3].map(r => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);
  // Bildpunkt (u,v von links oben, Bildgröße W×H) → Strahl in Weltkoordinaten → Schnitt mit dem Boden (y = fy)
  function pixelToFloor(u, v, W, H, proj, camM, fy) {
    const x = (u / W) * 2 - 1, y = 1 - (v / H) * 2, ip = inv4(proj);
    const toW = ndc => { const c = mulv(ip, [x, y, ndc, 1]); const e = [c[0] / c[3], c[1] / c[3], c[2] / c[3], 1]; const w = mulv(camM, e); return [w[0], w[1], w[2]]; };
    const a = toW(-1), b = toW(1), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; if (Math.abs(d[1]) < 1e-9) return null;
    const t = (fy - a[1]) / d[1]; if (t <= 0) return null; return [a[0] + d[0] * t, a[2] + d[2] * t];
  }
  // Markenmitte = Schnitt der Diagonalen (perspektivisch richtig)
  function markerCenter(c) { const [p0, p1, p2, p3] = c, d1 = [p2[0] - p0[0], p2[1] - p0[1]], d2 = [p3[0] - p1[0], p3[1] - p1[1]], den = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(den) < 1e-9) return [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2]; const t = ((p1[0] - p0[0]) * d2[1] - (p1[1] - p0[1]) * d2[0]) / den; return [p0[0] + d1[0] * t, p0[1] + d1[1] * t]; }
  // Sichtlinie eines Bildpunkts in Weltkoordinaten: {o: Kameraort, d: Richtung}
  function pixelRay(u, v, W, H, proj, camM) {
    const x = (u / W) * 2 - 1, y = 1 - (v / H) * 2, ip = inv4(proj);
    const toW = ndc => { const c = mulv(ip, [x, y, ndc, 1]); const w = mulv(camM, [c[0] / c[3], c[1] / c[3], c[2] / c[3], 1]); return [w[0], w[1], w[2]]; };
    const a = toW(-1), b = toW(1), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], n = Math.hypot(...d); return { o: a, d: d.map(q => q / n) };
  }
  // Punkt aus mehreren Sichtlinien (kleinste Quadrate), Ausreißer-Strahlen werden verworfen – unabhängig von der Bodenhöhe
  function triangulate(R) {
    let use = R, X = null;
    for (let it = 0; it < 3; it++) {
      const A = [0, 0, 0, 0, 0, 0, 0, 0, 0], b = [0, 0, 0];
      use.forEach(({ o, d }) => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const m = (i === j ? 1 : 0) - d[i] * d[j]; A[3 * i + j] += m; b[i] += m * o[j]; } });
      const det = A[0] * (A[4] * A[8] - A[5] * A[7]) - A[1] * (A[3] * A[8] - A[5] * A[6]) + A[2] * (A[3] * A[7] - A[4] * A[6]); if (Math.abs(det) < 1e-6 * use.length ** 3) return null; // zu wenig Blickwinkel-Unterschied
      const inv = [A[4] * A[8] - A[5] * A[7], A[2] * A[7] - A[1] * A[8], A[1] * A[5] - A[2] * A[4], A[5] * A[6] - A[3] * A[8], A[0] * A[8] - A[2] * A[6], A[2] * A[3] - A[0] * A[5], A[3] * A[7] - A[4] * A[6], A[1] * A[6] - A[0] * A[7], A[0] * A[4] - A[1] * A[3]].map(q => q / det);
      X = [0, 1, 2].map(i => inv[3 * i] * b[0] + inv[3 * i + 1] * b[1] + inv[3 * i + 2] * b[2]);
      const dist = use.map(({ o, d }) => { const w = [X[0] - o[0], X[1] - o[1], X[2] - o[2]], t = w[0] * d[0] + w[1] * d[1] + w[2] * d[2]; return Math.hypot(w[0] - t * d[0], w[1] - t * d[1], w[2] - t * d[2]); });
      const lim = Math.max(0.003, 3 * med(dist)), keep = use.filter((_, i) => dist[i] <= lim); if (keep.length === use.length || keep.length < 3) break; use = keep;
    }
    return X;
  }
  // Maßstab aus automatisch erkannten Marken 0–1 und 2–3 (je 2,000 m): Marken räumlich angepeilt; Notlösung Bodenschnitt
  function autoScale(obs, len, fy) {
    if (!(len > 0)) return null; const R = {}, cnt = {};
    obs.forEach(o => { (R[o.id] = R[o.id] || []).push(pixelRay(o.u, o.v, o.W, o.H, o.proj, o.cam)); cnt[o.id] = (cnt[o.id] || 0) + 1; });
    const pos = {}; for (const id in R) if (R[id].length >= 15) { const X = triangulate(R[id]); if (X) pos[id] = [X[0], X[2]]; else if (fy !== null) { const P = obs.filter(o => o.id == id).map(o => pixelToFloor(o.u, o.v, o.W, o.H, o.proj, o.cam, fy)).filter(Boolean); if (P.length >= 5) pos[id] = [med(P.map(p => p[0])), med(P.map(p => p[1]))]; } }
    const K = []; [[0, 1], [2, 3]].forEach(([a, b]) => { if (pos[a] && pos[b]) { const d = Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]); if (d > 0.5) K.push(len / d); } });
    return { k: K.length ? K.reduce((x, y) => x + y, 0) / K.length : null, n: K.length, cnt, auto: true };
  }
  // ---- Zollstock ohne Marken: gelben Stab im Kamerabild finden, Enden subpixelgenau, Länge über den Boden → Maßstab ----
  const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255]; };
  // Farbmodelle: gelb lackiert, weiß, Naturholz – oder die am Zollstock gelernte Farbe
  const COLS = {
    gelb: (r, g, b) => r > 110 && g > 80 && b < 0.62 * Math.min(r, g) && r - b > 50 && g - b > 35,
    weiss: (r, g, b) => Math.min(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 40,
    holz: (r, g, b) => { const [h, sa, v] = hsv(r, g, b); return h >= 18 && h <= 48 && sa >= 0.3 && sa <= 0.65 && v >= 0.6; }
  };
  function colModel(c) { return (r, g, b) => { const [h, sa, v] = hsv(r, g, b), dh = Math.min(Math.abs(h - c[0]), 360 - Math.abs(h - c[0])); return (c[1] < 0.12 ? sa < c[1] + 0.12 : dh < 10 && Math.abs(sa - c[1]) < 0.1) && Math.abs(v - c[2]) < 0.08; }; }
  function learnColor(px, W, H, u, v, flip = true) { const R = [], G = [], B = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = Math.round(u) + dx, y = Math.round(v) + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue; const j = ((flip ? H - 1 - y : y) * W + x) * 4; R.push(px[j]); G.push(px[j + 1]); B.push(px[j + 2]); } return R.length ? hsv(med(R), med(G), med(B)) : null; }
  let isYf = COLS.gelb; const isY = (px, j) => isYf(px[j], px[j + 1], px[j + 2]);
  function rulerFind(px, W, H, flip = true, col = null) { // mehrere Farbmodelle probieren → längster dünner Stab
    const L = col ? [['gelernt', colModel(col)]] : Object.entries(COLS); let best = null;
    for (const [name, f] of L) { isYf = f; const R = rulerFind1(px, W, H, flip); if (R && R.lenPx / R.wPx >= 35 && (!best || R.lenPx > best.lenPx)) best = { ...R, col: name }; }
    return best;
  }
  function rulerFind1(px, W, H, flip = true) { // px RGBA; flip: Zeilen von unten (WebGL) → v von oben
    const s = Math.max(1, Math.round(W / 480)), w = Math.floor(W / s), h = Math.floor(H / s), m = new Uint8Array(w * h);
    const J = (x, y) => ((flip ? H - 1 - y : y) * W + x) * 4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = isY(px, J(x * s, y * s)) ? 1 : 0;
    { const mj = m.slice(); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += mj[(y + dy) * w + x + dx]; m[y * w + x] = c >= 4 ? 1 : 0; } } // Einzelpixel (Bodenmaserung) weg
    const m0 = m.slice(); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (!m0[y * w + x] && (m0[y * w + x - 1] && m0[y * w + x + 1] || m0[(y - 1) * w + x] && m0[(y + 1) * w + x] || m0[(y - 1) * w + x - 1] && m0[(y + 1) * w + x + 1] || m0[(y - 1) * w + x + 1] && m0[(y + 1) * w + x - 1])) m[y * w + x] = 1; // Lücken (Ziffern, Gelenke) schließen
    for (let it = 0; it < 2; it++) { const mm = m.slice(); for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (!mm[y * w + x]) for (const [dx, dy] of [[2, 0], [0, 2], [2, 2], [2, -2]]) if (mm[(y + dy) * w + x + dx] && mm[(y - dy) * w + x - dx]) { m[y * w + x] = 1; break; } }
    const lab = new Int32Array(w * h), st = []; let best = null, nl = 0;
    for (let i0 = 0; i0 < w * h; i0++) {
      if (!m[i0] || lab[i0]) continue; nl++; const P = []; st.push(i0); lab[i0] = nl;
      while (st.length) { const i = st.pop(), x = i % w, y = (i / w) | 0; P.push(x, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const k = yy * w + xx; if (m[k] && !lab[k]) { lab[k] = nl; st.push(k); } } }
      const n = P.length / 2; if (n < 30) continue;
      let mx = 0, my = 0; for (let k = 0; k < P.length; k += 2) { mx += P[k]; my += P[k + 1]; } mx /= n; my /= n;
      let sxx = 0, syy = 0, sxy = 0; for (let k = 0; k < P.length; k += 2) { const a = P[k] - mx, b = P[k + 1] - my; sxx += a * a; syy += b * b; sxy += a * b; } sxx /= n; syy /= n; sxy /= n;
      const tr = sxx + syy, dt = Math.sqrt(Math.max(0, (sxx - syy) ** 2 / 4 + sxy * sxy)), l1 = tr / 2 + dt, l2 = Math.max(1e-6, tr / 2 - dt);
      const len = Math.sqrt(12 * l1); if (l1 / l2 < 60 || len < 0.25 * Math.min(w, h)) continue; // lang und dünn
      if (!best || len > best.len) { const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy); best = { P, n, mx, my, e: [Math.cos(ang), Math.sin(ang)], len, wid: Math.sqrt(12 * l2) }; }
    }
    if (!best) return null;
    const { P, e } = best, nrm = [-e[1], e[0]]; let t0 = Infinity, t1 = -Infinity;
    for (let k = 0; k < P.length; k += 2) { const t = (P[k] - best.mx) * e[0] + (P[k + 1] - best.my) * e[1]; if (t < t0) t0 = t; if (t > t1) t1 = t; }
    const endAt = (tE, dir) => { // Mitte quer zum Stab nahe dem Ende (grob), dann am Vollbild entlang der Achse das letzte gelbe Stück suchen
      let cx = 0, cy = 0, c = 0; for (let k = 0; k < P.length; k += 2) { const t = (P[k] - best.mx) * e[0] + (P[k + 1] - best.my) * e[1]; if (Math.abs(t - tE) < 2.5 + best.wid) { cx += P[k]; cy += P[k + 1]; c++; } }
      let p = [(cx / c) * s + 0.5, (cy / c) * s + 0.5]; const hw = Math.max(1, best.wid * s * 0.4), gap = Math.max(3, best.wid * s * 0.8);
      // Achse nahe dem Ende: Punkte zwischen 3 und 12 Stabbreiten vom Ende → Richtung
      const fr = t => { let y = 0, a = 0; for (let o = -hw; o <= hw; o += Math.max(0.5, hw / 3)) { const x = Math.round(p[0] + dir * e[0] * t + nrm[0] * o), yy = Math.round(p[1] + dir * e[1] * t + nrm[1] * o); if (x < 0 || yy < 0 || x >= W || yy >= H) continue; a++; if (isY(px, J(x, yy))) y++; } return a ? y / a : 0; };
      const t0s = -(12 * s + 2 * best.wid * s); let last = t0s; for (let t = t0s; t <= 6 * s + best.wid * s; t += 0.5) { if (fr(t) >= 0.35) last = t; else if (t > last + gap) break; }
      // quer zur Achse mittig setzen (Rand gelb/Boden beidseitig), etwas innerhalb des Endes gemessen
      const tq = last - Math.max(2, best.wid * s * 0.7), ext = sg => { let o = 0; for (; o < 4 * best.wid * s; o += 0.5) { const x = Math.round(p[0] + dir * e[0] * tq + nrm[0] * o * sg), yy = Math.round(p[1] + dir * e[1] * tq + nrm[1] * o * sg); if (x < 0 || yy < 0 || x >= W || yy >= H || !isY(px, J(x, yy))) break; } return o; };
      const op = ext(1), om = ext(-1), sh = (op - om) / 2; p = [p[0] + nrm[0] * sh, p[1] + nrm[1] * sh];
      p = [p[0] + dir * e[0] * (last + 0.25), p[1] + dir * e[1] * (last + 0.25)];
      const edge = 3 * s; return { p, ok: p[0] > edge && p[1] > edge && p[0] < W - edge && p[1] < H - edge };
    };
    const A = endAt(t0, -1), B = endAt(t1, 1);
    return { a: A.p, b: B.p, okA: A.ok, okB: B.ok, lenPx: Math.hypot(A.p[0] - B.p[0], A.p[1] - B.p[1]), wPx: best.wid * s };
  }
  // laufende Maßstabsschätzung aus allen Bildern mit beiden Enden: Median, Streuung → Genauigkeit in %
  function rulerScale(K) {
    const k = K.filter(x => x > 0.85 && x < 1.15); if (k.length < 3) return null;
    const so = [...k].sort((a, b) => a - b), mdn = so[so.length >> 1], mad = med(so.map(x => Math.abs(x - mdn))) || 0.0005;
    const use = so.filter(x => Math.abs(x - mdn) < 4 * 1.4826 * mad + 1e-4), km = use.reduce((a, x) => a + x, 0) / use.length;
    const sd = Math.sqrt(use.reduce((a, x) => a + (x - km) ** 2, 0) / Math.max(1, use.length - 1));
    const stat = sd / Math.sqrt(use.length) / km;
    return { k: km, n: use.length, stat, sig: Math.hypot(stat, 0.0015), auto: true, ruler: true }; // 0,15 % Restfehler: Bodenebene/Stabdicke
  }
  // ---- Zollstock-Enden einzeln sammeln (dürfen in verschiedenen Bildern sein): Boden-Ende über die Bodenebene, sonst räumlich angepeilt (Wand) ----
  const rayDist = (r, X) => { const w = [X[0] - r.o[0], X[1] - r.o[1], X[2] - r.o[2]], t = w[0] * r.d[0] + w[1] * r.d[1] + w[2] * r.d[2]; return Math.hypot(w[0] - t * r.d[0], w[1] - t * r.d[1], w[2] - t * r.d[2]); };
  function rayRay(a, b) { // kürzester Abstand zweier Sichtlinien, nur wenn der Treffpunkt vor beiden Kameras liegt und der Winkel > 2°
    const w = [a.o[0] - b.o[0], a.o[1] - b.o[1], a.o[2] - b.o[2]], A = a.d[0] * b.d[0] + a.d[1] * b.d[1] + a.d[2] * b.d[2], D = a.d[0] * w[0] + a.d[1] * w[1] + a.d[2] * w[2], E = b.d[0] * w[0] + b.d[1] * w[1] + b.d[2] * w[2], den = 1 - A * A;
    if (den < 0.0012) { const ang = Math.acos(Math.min(1, A)); return ang < 0.01 ? ang * 1.5 : null; } // fast gleiche Richtung vom gleichen Ort
    const t = (A * E - D) / den, u = (E - A * D) / den; if (t < 0.2 || u < 0.2) return null;
    return Math.hypot(w[0] + t * a.d[0] - u * b.d[0], w[1] + t * a.d[1] - u * b.d[1], w[2] + t * a.d[2] - u * b.d[2]);
  }
  function endObs(o) { // o: {ray, fl: Bodenpunkt [x,z] oder null, cam: Kameraort}
    let best = null, bd = Infinity;
    for (const c of st.ends) {
      let dd = Infinity;
      if (c.X) dd = rayDist(o.ray, c.X);
      else {
        if (o.fl && c.fl.length) dd = Math.hypot(o.fl[0] - med(c.fl.map(p => p[0])), o.fl[1] - med(c.fl.map(p => p[1])));
        const rr = c.rays.slice(-6).map(r => rayRay(r, o.ray)).filter(v => v !== null); if (rr.length) dd = Math.min(dd, med(rr)); // Sichtlinien treffen sich (räumlich, auch an der Wand)
      }
      if (dd < bd) { bd = dd; best = c; }
    }
    if (best && bd < 0.05) { best.rays.push(o.ray); if (o.fl) best.fl.push(o.fl); best.cam = o.cam; best.n++; if (best.rays.length > 150) best.rays.shift(); if (best.fl.length > 150) best.fl.shift(); if (best.n % 4 === 0 && best.rays.length >= 8) best.X = triangulate(best.rays); }
    else { st.ends.push({ rays: [o.ray], fl: o.fl ? [o.fl] : [], n: 1, X: null, cam: o.cam }); if (st.ends.length > 8) { st.ends.sort((a, b) => b.n - a.n); st.ends.length = 6; } }
  }
  function endPos(c, fy) { // → {p:[x,y,z], s: Standardabweichung der Lage (m), floor}
    const sdv = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1)); };
    if (c.X && (fy === null || c.X[1] - fy > 0.06)) { const d = c.rays.map(r => rayDist(r, c.X)); return { p: c.X, s: Math.max(0.001, med(d) * 1.4826) / Math.sqrt(c.rays.length) * 2, floor: false }; }
    if (c.fl.length >= 3 && fy !== null) { const x = c.fl.map(p => p[0]), z = c.fl.map(p => p[1]); return { p: [med(x), fy, med(z)], s: Math.hypot(sdv(x), sdv(z)) / Math.sqrt(c.fl.length), floor: true }; }
    return c.X ? { p: c.X, s: 0.01, floor: false } : null;
  }
  function endsScale() { // Maßstab aus den zwei Enden, deren Abstand zur Zollstock-Länge passt
    if (!(st.zlen > 0) || !st.ends) return null; const fy = st.floorY.length > 10 ? med(st.floorY) + 0.004 : null;
    const E = st.ends.filter(c => c.n >= 5).map(c => ({ c, e: endPos(c, fy) })).filter(q => q.e); let best = null;
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const a = E[i].e, b = E[j].e, d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]), k = st.zlen / d;
      if (k > 0.85 && k < 1.15 && (!best || E[i].c.n + E[j].c.n > best.m)) { const stat = Math.hypot(a.s, b.s) / d; best = { k, n: Math.min(E[i].c.n, E[j].c.n), m: E[i].c.n + E[j].c.n, stat, sig: Math.hypot(stat, 0.0015), auto: true, ruler: true, wall: !a.floor || !b.floor, na: E[i].c.n, nb: E[j].c.n }; } }
    return best;
  }
  const curScale = () => endsScale() || rulerScale(st.rk);
  const _test = { get st() { return st; }, feedAim, cornerTap, undo: () => undo(), finish: () => finish(), startCorners(done) { Object.assign(st, { phase: 'walls', corners: [], walls: [[]], aimH: [], closed: false, last: null, log: [], floorY: Array(20).fill(0), zs: [[], []], zp: [], zlen: 2, ceilY: null, auto: { k: 1, n: 20, sig: 0.002, auto: true }, done, s: null }); }, get ends() { return st.ends; }, reset(zlen, fy) { st.zlen = zlen; st.ends = []; st.rk = []; st.floorY = fy === null ? [] : Array(20).fill(fy); }, endObs, endsScale };
  // mehrere Lagen (Zollstock umgelegt): Mittel der Faktoren – Tippfehler und Richtungsabhängigkeit mitteln sich heraus
  function scale(zs, len, more = []) {
    if (!(len > 0)) return null; const K = [];
    [...more, zs].forEach(z => { if (!z[0].length || !z[1].length) return; const a = mean3(z[0]), b = mean3(z[1]), d = Math.hypot(a[0] - b[0], a[2] - b[2]); if (d > 0.3) K.push(len / d); });
    if (!K.length) return null; const k = K.reduce((x, y) => x + y, 0) / K.length;
    return { k, n: K.length, spread: K.length > 1 ? Math.sqrt(K.reduce((s, x) => s + (x - k) ** 2, 0) / (K.length - 1)) : null };
  }

  const wallPts = i => st.closed ? st.walls[i] : st.walls[i + 1]; // Punkte der Wand Ecke i → i+1
  function missing() { // was fehlt noch? (laufend ausgewertet)
    const m = [], n = st.corners.length;
    if (!(st.auto && st.auto.k)) m.push('📏');
    if (st.phase === 'walls' || st.phase === 'h') { for (let i = 0; i < (st.closed ? n : n - 1); i++) { const w = wallPts(i); if (!w || w.length < 6) m.push(`Wand ${i + 1}: Kante`); } if (!st.closed) m.push(n < 3 ? `⌞ ${n}/≥4` : '↩ Ecke 1'); }
    if (st.ceilY === null) m.push('RH');
    return m;
  }
  function drawPlan(x, W, H) { // Ecken (grün, nummeriert), Wände (gelb), gesammelte Kantenpunkte (blau), Zielpunkt
    if (!st.ov || (st.phase !== 'walls' && st.phase !== 'h') || !st.floorY.length) return; const fy = med(st.floorY);
    const pr = (p, y = fy) => { const c = mulv(st.ov.P, mulv(st.ov.V, [p[0], y, p[1], 1])); if (c[3] <= 0.05) return null; return [(c[0] / c[3] + 1) / 2 * W, (1 - c[1] / c[3]) / 2 * H]; };
    x.lineWidth = 2; x.fillStyle = '#29b6f6'; st.walls.forEach(w => w.forEach(p => { const q = pr(p); if (q) x.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3); }));
    const C = st.corners, seq = C.concat(st.closed ? [C[0]] : st.aim ? [st.aim] : []);
    for (let i = 0; i + 1 < seq.length; i++) { const a = pr(seq[i]), b = pr(seq[i + 1]); if (!a || !b) continue; const w = wallPts(i), np = w ? w.length : 0, live = !st.closed && i === C.length - 1;
      x.strokeStyle = live ? '#ffffffcc' : np >= 15 ? '#00e676' : np >= 6 ? '#ffd600' : '#ff5252'; x.lineWidth = 5; x.setLineDash(live ? [10, 8] : []); x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); }
    x.setLineDash([]);
    C.forEach((p, i) => { const q = pr(p); if (!q) return; x.fillStyle = '#00e676'; x.beginPath(); x.arc(q[0], q[1], 13, 0, 7); x.fill(); x.fillStyle = '#000'; x.font = 'bold 14px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1), q[0], q[1] + 1); });
    if (st.ceilY !== null) C.forEach(p => { const a = pr(p), b = pr(p, st.ceilY); if (a && b) { x.strokeStyle = '#29b6f6'; x.lineWidth = 2; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); } });
  }
  function drawRuler() { // erkannten Zollstock farbig einzeichnen (grün = beide Enden, gelb = angeschnitten)
    const c = el('arCv'); if (!c) return; const W = innerWidth, H = innerHeight; if (c.width !== W) c.width = W; if (c.height !== H) c.height = H;
    const x = c.getContext('2d'); x.clearRect(0, 0, W, H); drawPlan(x, W, H); const rv = st.rv; if (st.phase !== 'z0' || !rv || Date.now() - rv.t > 800) return;
    const k = Math.max(W / rv.W, H / rv.H), ox = (W - rv.W * k) / 2, oy = (H - rv.H * k) / 2, P = p => [p[0] * k + ox, p[1] * k + oy], a = P(rv.a), b = P(rv.b), ok = rv.okA && rv.okB;
    x.lineCap = 'round'; x.strokeStyle = ok ? '#00e676cc' : '#ffd600cc'; x.lineWidth = Math.max(6, rv.wPx * k * 0.6); x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke();
    [[a, rv.okA], [b, rv.okB]].forEach(([p, o]) => { x.fillStyle = o ? '#00e676' : '#ff5252'; x.beginPath(); x.arc(p[0], p[1], 11, 0, 7); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 2; x.stroke(); });
  }
  function ui(msg) {
    const w = st.walls, cur = w[w.length - 1], h = st.hit, done = w.filter(x => x.length >= 2).length;
    let t;
    if (st.phase === 'z0' || st.phase === 'z1') {
      const e = st.phase === 'z0' ? 0 : 1, n = st.zs[e].length;
      const ac = st.camOk ? autoScale(st.mobs, st.zlen, st.floorY.length ? med(st.floorY) : null) : null;
      if (st.camOk) { const rs = curScale(), rv = st.rv && Date.now() - st.rv.t < 800 ? st.rv : null, E = [...(st.ends || [])].sort((a, b) => b.n - a.n), nA = rs ? rs.na : E[0] ? E[0].n : 0, nB = rs ? rs.nb : E[1] ? E[1].n : 0;
        const dot = n => `<span class="zd ${n >= 10 ? 'arG' : n ? 'arY' : 'arR'}">◉<small>${Math.min(n, 99)}</small></span>`;
        const hint = st.floorY.length <= 10 ? '📱 langsam bewegen …' : !rv ? '📏 Zollstock ins Bild · ↔ 1–2 m Abstand' : !(nA && nB) ? (nA ? '➡ jetzt das <b>andere Ende</b>' : '🎯 ein Ende ins Bild') : rs && rs.stat > 0.001 ? '↔ seitlich gehen, beide Enden weiter filmen' : '✓';
        t = `<div class="zrow"><svg viewBox="0 0 60 60" class="zpic"><rect x="14" y="4" width="32" height="52" rx="5" fill="none" stroke="#fff" stroke-width="2.5"/><line x1="22" y1="46" x2="38" y2="14" stroke="#e3b46b" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="46" r="3.5" fill="#00e676"/><circle cx="38" cy="14" r="3.5" fill="#00e676"/></svg>`
          + `<div><div class="zst">${dot(nA)}<span class="zl">━━</span>${dot(nB)} ${rs ? `<b class="${rs.sig <= 0.002 ? 'arG' : rs.sig <= 0.004 ? 'arY' : 'arR'}">±${(rs.sig * 100).toFixed(2).replace('.', ',')} %</b>` : ''}</div><div class="zh">${hint}${rv ? ` <small>(${rv.col})</small>` : ''}</div>`
          + `${!rv && Date.now() - st.t0 > 6000 ? '<div class="zh"><small>nicht erkannt? ◎ auf den Zollstock → „Punkt“</small></div>' : ''}${st.col ? '<div class="zh"><small><a id="arColR">Farbe zurücksetzen</a></small></div>' : ''}</div></div>`; }
      else t = `<b>Schritt 1 – Zollstock:</b> Kreis genau auf den <b>${e ? 'Ende (200 cm)' : 'Anfang (0 cm)'}</b> des Zollstocks und „Punkt“ tippen${n ? ` (${n}× ✓ – noch 1–2 × für mehr Genauigkeit, dann „Weiter“)` : ''}. Ohne Zollstock: „Überspringen“.`;
    } else if (st.phase === 'walls' || st.phase === 'h') {
      const n = st.corners.length, pic = (b, x) => `<div class="zrow"><svg viewBox="0 0 60 60" class="zpic">${b}</svg><div class="zh2">${x}</div></div>`;
      const corner = '<path d="M6 44 L30 54 L54 44" stroke="#e3b46b" stroke-width="3" fill="none"/><path d="M30 54 V8 M6 44 V4 M54 44 V4" stroke="#fff" stroke-width="2" fill="none"/>';
      t = st.floorY.length <= 10 ? pic('<rect x="18" y="8" width="24" height="40" rx="4" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M8 54 H52" stroke="#e3b46b" stroke-width="3"/><path d="M6 28 l6 -4 v8z M54 28 l-6 -4 v8z" fill="#fff"/>', '📱 ↔ langsam bewegen – Boden suchen')
        : st.phase === 'h' ? pic('<path d="M8 10 H52 M30 10 V54 M8 54 H52" stroke="#fff" stroke-width="2" fill="none"/><circle cx="30" cy="10" r="5" fill="#29b6f6"/><path d="M30 46 V18 M24 24 l6 -8 l6 8" stroke="#29b6f6" stroke-width="3" fill="none"/>', `◎ auf Kante <b>Wand/Decke</b> → 📍${st.ceilY !== null ? ` <b class="arG">RH ${((st.ceilY - med(st.floorY)) * (st.auto ? st.auto.k : 1)).toFixed(2).replace('.', ',')} m</b>` : ''}`)
        : !n ? pic(corner + '<circle cx="30" cy="54" r="5" fill="#00e676"/>', '◎ auf eine <b>Ecke unten</b> → 📍')
        : pic(corner + `<circle cx="30" cy="54" r="4" fill="#00e676"/><circle cx="54" cy="44" r="4" fill="#ffd600"/><path d="M33 52 L50 45" stroke="#00e676" stroke-width="3" stroke-dasharray="3 3"/>`, `◎ an der <b>Bodenkante</b> entlang ➜ nächste Ecke → 📍 <small>(Ecke ${n}${n >= 3 ? ' · zurück zur 1. Ecke = Raum zu' : ''})</small>`);
    } else t = !h ? 'Handy langsam hin und her bewegen, bis Boden und Wände erkannt sind …'
      : h.kind === 'floor' ? 'Das ist der <b>Boden</b>. Auf eine <b>Wand</b> zielen (über den Möbeln).'
      : h.kind === 'flat' ? 'Das ist eine <b>waagrechte Fläche</b> (Tisch?). Auf die Wand darüber zielen.'
      : h.kind === 'ceil' ? 'Das ist die <b>Decke</b> – „Punkt“ tippen setzt die Raumhöhe.'
      : st.scan ? `🔵 <b>Wand ${w.length} wird abgetastet</b> – Kreis langsam über die ganze Wand fahren (hin und her, oben und unten, über den Möbeln). ${cur.length} Punkte.`
      : cur.length < 2 ? `<b>Wand ${w.length}:</b> „▶ Abtasten“ tippen und den Kreis über die Wand fahren – oder einzelne Punkte setzen.`
      : `Wand ${w.length}: ${cur.length} Punkte ✓ – „Nächste Wand“ (der Reihe nach rundherum).`;
    el('arMsg').innerHTML = msg || t; const cr = el('arColR'); if (cr) cr.onclick = () => { st.col = null; st.rk = []; try { localStorage.removeItem('raumplan-zcol'); } catch (e) { } ui('Farbe zurückgesetzt – gelb, weiß und Holz werden automatisch probiert.'); };
    const sa = st.camOk ? autoScale(st.mobs, st.zlen, st.floorY.length ? med(st.floorY) : null) : null, sc = sa && sa.k ? sa : scale(st.zs, st.zlen, st.zp);
    const sr = st.auto || (st.camOk ? curScale() : null) || sc;
    if (done >= 3 && Date.now() - st.estT > 800) { st.estT = Date.now(); try { const e = solve(st.walls.filter(x => x.length >= 2), st.zs, st.zlen, st.floorY, st.ceilY, st.zp, st.auto || curScale()); st.est = e.err ? null : Math.max(...e.sigma.map((s0, i) => s0 / Math.hypot(e.poly[(i + 1) % e.poly.length][0] - e.poly[i][0], e.poly[(i + 1) % e.poly.length][1] - e.poly[i][1]))); } catch (x) { st.est = null; } }
    const rel = st.est != null ? st.est : sr ? (sr.sig != null ? sr.sig : 0.003) : 0.015, col = rel <= 0.002 ? 'arG' : rel <= 0.005 ? 'arY' : 'arR';
    const sec = Math.round((Date.now() - st.t0) / 1000), mi = missing();
    el('arInfo').innerHTML = `<span class="${sec <= 60 ? '' : 'arY'}">⏱ ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}</span> · <b class="${col}">±${(rel * 100).toFixed(2).replace('.', ',')} %</b> · ${mi.length ? `<span class="arY">fehlt: ${mi.join(' · ')}</span>` : '<span class="arG">alles da ✓</span>'}<span hidden>` + (sr ? ` · Maßstab ${((sr.k - 1) * 100 >= 0 ? '+' : '') + ((sr.k - 1) * 100).toFixed(2).replace('.', ',')} %` : ' · <span class="arR">ohne Zollstock</span>') + (h ? ` · Abstand ${(h.dist).toFixed(2).replace('.', ',')} m` : '') + (st.ceilY !== null && st.floorY.length ? ` · Höhe ${(st.ceilY - med(st.floorY)).toFixed(2).replace('.', ',')} m` : '') + '</span>';
    drawRuler();
    el('arDot').className = 'ardot ' + (h ? h.kind : '') + (st.scan ? ' scan' : '');
    const zp = st.phase !== 'walls' && st.phase !== 'h';
    el('arNext').textContent = zp ? (st.zs[st.phase === 'z0' ? 0 : 1].length ? 'Weiter ›' : 'Überspringen ›') : 'Nächste Wand ›';
    el('arNext').disabled = false;
    if (st.phase === 'walls') { el('arNext').textContent = '✔ Raum zu'; el('arNext').disabled = st.corners.length < 3; }
    if (st.phase === 'h') el('arNext').textContent = st.ceilY !== null ? '✔ Fertig' : 'ohne Höhe ›';
    el('arPoint').textContent = st.phase === 'walls' ? '📍 Ecke' : st.phase === 'h' ? '📍 Decke' : 'Punkt';
    el('arScan').hidden = true; el('arZmore').hidden = st.phase !== 'z1' || !st.zs[1].length; el('arScan').textContent = st.scan ? '⏸ Stopp' : '▶ Abtasten';
    el('arDone').disabled = st.phase === 'walls' ? st.corners.length < 3 : st.phase === 'h' ? false : done < 3; el('arDone').hidden = st.phase === 'walls' || st.phase === 'z0' || st.phase === 'z1';
  }

  async function start(onDone, opts = {}) {
    if (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)))
      return alert('AR wird auf diesem Gerät/Browser nicht unterstützt. Bitte Chrome auf einem Android-Handy mit „Google Play-Dienste für AR“ (ARCore) verwenden.');
    Object.assign(st, { walls: [[]], floorY: [], ceilY: null, hit: null, done: onDone, phase: opts.zollstock ? 'z0' : 'walls', zs: [[], []], zp: [], zlen: opts.zollstock || 0, scan: false, last: null, log: [], t0: Date.now() });
    const root = el('arUI'); root.hidden = false;
    let s;
    try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor', 'depth-sensing', 'camera-access'], domOverlay: { root }, depthSensing: { usagePreference: ['cpu-optimized'], dataFormatPreference: ['luminance-alpha', 'float32'] } }); }
    catch (e) { try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor', 'camera-access'], domOverlay: { root } }); } catch (e2) { root.hidden = true; return alert('AR konnte nicht gestartet werden: ' + e2.message); } }
    st.s = s;
    const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { xrCompatible: true });
    await s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
    st.camOk = false; st.mobs = []; st.rk = []; st.ends = []; st.corners = []; st.aimH = []; st.aim = null; st.closed = false; st.walls = [[]]; try { st.col = JSON.parse(localStorage.getItem('raumplan-zcol') || 'null'); } catch (e) { st.col = null; } st.rv = null; st.grabT = 0; st.camInfo = ''; st.estT = 0; st.est = null;
    let glb = null, fb = null; try { if ((s.enabledFeatures || []).includes('camera-access') && typeof XRWebGLBinding !== 'undefined') { glb = new XRWebGLBinding(s, gl); fb = gl.createFramebuffer(); st.camOk = true; } } catch (e) { }
    const space = await s.requestReferenceSpace('local'), viewer = await s.requestReferenceSpace('viewer');
    let src; try { src = await s.requestHitTestSource({ space: viewer, entityTypes: ['plane', 'point'] }); } catch (e) { src = await s.requestHitTestSource({ space: viewer }); }
    s.addEventListener('end', () => { st.s = null; root.hidden = true; });
    const frame = (t, f) => {
      if (!st.s) return; s.requestAnimationFrame(frame);
      const bl = s.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const vp = f.getViewerPose(space); if (!vp) return; const cp = vp.transform.position; st.cam = cp;
      { const v0 = vp.views[0], P0 = Float64Array.from(v0.projectionMatrix), M0 = Float64Array.from(v0.transform.matrix); st.ov = { P: P0, V: Float64Array.from(v0.transform.inverse.matrix) };
        const fy = st.floorY.length > 10 ? med(st.floorY) : null; st.aim = null; st.aimRay = pixelRay(0.5, 0.5, 1, 1, P0, M0);
        if (fy !== null) { const a = pixelToFloor(0.5, 0.5, 1, 1, P0, M0, fy); if (a && Math.hypot(a[0] - cp.x, a[1] - cp.z) < 8) feedAim(a, t); } }
      if (st.camOk && st.phase !== 'walls' && t - st.grabT > 180 && !st.grabBusy) {
        const view = vp.views[0];
        try {
          if (view.camera) {
            const tex = glb.getCameraImage(view.camera), W = view.camera.width, H = view.camera.height, px = new Uint8Array(W * H * 4);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer);
            const proj = Float64Array.from(view.projectionMatrix), cam = Float64Array.from(view.transform.matrix); st.grabT = t; st.grabBusy = true; st.camInfo = `Kamera ${W}×${H}`;
            setTimeout(() => { // Erkennung außerhalb des Render-Takts; Zeilen kommen von unten → umdrehen
              try { const g = new Float32Array(W * H); for (let y = 0; y < H; y++) { const r = (H - 1 - y) * W * 4; for (let x = 0; x < W; x++) { const j = r + x * 4; g[y * W + x] = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2]; } }
                MK.detect(g, W, H, { maxW: W }).filter(m => m.id <= 3 && m.res < 0.8).forEach(m => { const c = markerCenter(m.c); st.mobs.push({ id: m.id, u: c[0], v: c[1], W, H, proj, cam }); });
                const R = rulerFind(px, W, H, true, st.col); st.rv = R ? { ...R, W, H, t: Date.now() } : null; st.lastPx = { px, W, H };
                if (R) { const fy = st.floorY.length > 10 ? med(st.floorY) + 0.004 : null, cpos = [cam[12], cam[13], cam[14]];
                  [[R.a, R.okA], [R.b, R.okB]].forEach(([q, ok]) => { if (!ok) return; const ray = pixelRay(q[0], q[1], W, H, proj, cam), fl = fy !== null ? pixelToFloor(q[0], q[1], W, H, proj, cam, fy) : null; endObs({ ray, fl, cam: cpos }); });
                  if (R.okA && R.okB && fy !== null) { const a = pixelToFloor(R.a[0], R.a[1], W, H, proj, cam, fy), b = pixelToFloor(R.b[0], R.b[1], W, H, proj, cam, fy); if (a && b) { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d > 0.3) { st.rk.push(st.zlen / d); if (st.rk.length > 150) st.rk.shift(); } } }
                  st.log.push({ pa: R.a.map(v => +v.toFixed(1)), pb: R.b.map(v => +v.toFixed(1)), ok: [R.okA, R.okB], W, H, col: R.col }); }
                const rs = curScale(); if (rs && st.phase === 'z0' && rs.n >= 10 && rs.stat <= 0.001) { st.auto = rs; st.phase = 'walls'; navigator.vibrate?.([40, 60, 40]); ui(`✅ Zollstock ✓ ±${(rs.sig * 100).toFixed(2).replace('.', ',')} %`); }
                if (st.mobs.length > 400) st.mobs.splice(0, st.mobs.length - 400); } catch (e) { }
              st.grabBusy = false; }, 0);
          }
        } catch (e) { st.camOk = false; }
      }
      const r = f.getHitTestResults(src)[0], pose = r && r.getPose(space);
      if (!pose) { st.hit = null; return ui(); } // (Bodenpunkt der Bildmitte kommt aus der Bodenebene, nicht vom Treffer)
      const p = pose.transform.position, q = pose.transform.orientation;
      const ny = 1 - 2 * (q.x * q.x + q.z * q.z); // y-Achse der Trefferfläche = Flächennormale
      let kind = Math.abs(ny) < 0.5 ? 'wall' : ny > 0 ? (p.y < cp.y - 1.0 ? 'floor' : 'flat') : 'ceil'; // flat = Tisch, Kommode …
      if (kind === 'floor') { st.floorY.push(p.y); if (st.floorY.length > 300) st.floorY.shift(); }
      st.hit = { p: [p.x, p.y, p.z], kind, dist: Math.hypot(p.x - cp.x, p.y - cp.y, p.z - cp.z) };
      // automatisches Abtasten: nur Wandtreffer, alle 2 cm ein Punkt, nicht zu nah (Messrauschen) und nicht zu weit
      if (false) {
        const l = st.last; if (!l || Math.hypot(p.x - l[0], p.y - l[1], p.z - l[2]) > 0.02) { st.walls[st.walls.length - 1].push([p.x, p.z]); st.last = [p.x, p.y, p.z]; st.log.push({ t: Math.round(t), w: st.walls.length - 1, p: [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)], c: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)] }); }
      }
      ui();
    };
    s.requestAnimationFrame(frame);
    ui();
  }

  function point() {
    const h = st.hit;
    if (st.phase === 'z0' && st.camOk && st.lastPx && !st.col) { // Kreis auf den Zollstock → dessen Farbe lernen
      const { px, W, H } = st.lastPx, k = Math.max(innerWidth / W, innerHeight / H), u = (innerWidth / 2 - (innerWidth - W * k) / 2) / k, v = (innerHeight / 2 - (innerHeight - H * k) / 2) / k, c = learnColor(px, W, H, u, v);
      if (c) { st.col = c; st.rk = []; try { localStorage.setItem('raumplan-zcol', JSON.stringify(c)); } catch (e) { } navigator.vibrate?.(30); return ui(`Zollstock-Farbe gelernt ✓ (Farbton ${Math.round(c[0])}°, Sättigung ${Math.round(c[1] * 100)} %) – jetzt beide Enden ins Bild.`); }
    }
    if (!h) return;
    if (st.phase === 'z0' || st.phase === 'z1') { st.zs[st.phase === 'z0' ? 0 : 1].push(h.p); st.log.push({ z: st.phase, p: h.p }); navigator.vibrate?.(30); return ui(); }
    if (st.phase === 'walls') return cornerTap();
    if (st.phase === 'h') return heightTap();
    if (!h) return;
    if (h.kind === 'ceil') { st.ceilY = h.p[1]; navigator.vibrate?.(30); return ui('Raumhöhe gesetzt ✓ – weiter mit den Wänden.'); }
    if (h.kind === 'floor' || h.kind === 'flat') return ui('Das ist keine Wand – bitte auf eine <b>Wand</b> zielen (über den Möbeln).');
    st.walls[st.walls.length - 1].push([h.p[0], h.p[2]]); st.log.push({ w: st.walls.length - 1, p: h.p, tap: 1 }); navigator.vibrate?.(20);
    ui();
  }
  function feedAim(a, t) { // Bodenpunkt der Bildmitte: für Ecken mitteln, zwischen den Ecken entlang der Bodenkante sammeln
    st.aim = a; st.aimH.push(a); if (st.aimH.length > 8) st.aimH.shift();
    if (st.phase === 'walls' && st.corners.length && !st.closed) { const l = st.last; if (!l || Math.hypot(a[0] - l[0], a[1] - l[1]) > 0.02) { st.walls[st.walls.length - 1].push(a.slice()); st.last = a.slice(); st.log.push({ t: Math.round(t), w: st.walls.length - 1, a: a.map(v => +v.toFixed(4)) }); } }
  }
  // Ecke (unten, Boden/Wand/Wand) anpeilen: Mittel der letzten Bodenpunkte der Bildmitte
  function cornerTap() {
    if (st.aimH.length < 3) return ui('📱 Boden noch nicht erkannt – Handy langsam bewegen');
    const c = [med(st.aimH.map(p => p[0])), med(st.aimH.map(p => p[1]))], C = st.corners;
    if (C.length >= 3 && Math.hypot(c[0] - C[0][0], c[1] - C[0][1]) < 0.3) return closeRoom();
    if (C.length) st.walls[st.walls.length - 1].push(c);
    C.push(c); st.walls.push([c]); st.last = c; st.log.push({ corner: C.length - 1, p: c.map(v => +v.toFixed(4)) }); navigator.vibrate?.(35); ui();
  }
  function closeRoom() {
    const C = st.corners; if (C.length < 3) return; const W = st.walls; W[W.length - 1].push(C[0]);
    st.walls = W.slice(1).filter(w => w.length >= 2); // Wand i = Ecke i → Ecke i+1 (mit Punkten entlang der Bodenkante)
    st.closed = true; st.phase = 'h'; navigator.vibrate?.([40, 60, 40]); ui();
  }
  // Raumhöhe: Bildmitte auf die Kante Wand/Decke → Schnitt der Sichtlinie mit der nächsten Wandebene
  function heightTap() {
    const r = st.aimRay, fy = st.floorY.length ? med(st.floorY) : null; if (!r || fy === null) return;
    const g = polygon(st.walls); if (g.err) return; let best = null;
    g.P.forEach((p, i) => { const q = g.P[(i + 1) % g.P.length], d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d), n = [-d[1] / L, d[0] / L], den = r.d[0] * n[0] + r.d[2] * n[1]; if (Math.abs(den) < 1e-6) return;
      const t = ((p[0] - r.o[0]) * n[0] + (p[1] - r.o[2]) * n[1]) / den; if (t <= 0.3) return; const X = [r.o[0] + r.d[0] * t, r.o[1] + r.d[1] * t, r.o[2] + r.d[2] * t], u = ((X[0] - p[0]) * d[0] + (X[2] - p[1]) * d[1]) / L;
      if (u > -0.1 && u < L + 0.1 && (!best || t < best.t)) best = { t, y: X[1] }; });
    if (!best || best.y - fy < 1.8 || best.y - fy > 6) return ui('◎ genau auf die Kante <b>Wand/Decke</b>');
    st.hs = st.hs || []; st.hs.push(best.y); st.ceilY = med(st.hs); navigator.vibrate?.(30); ui();
  }
  function zMore() { if (st.phase !== 'z1' || !st.zs[1].length) return; st.zp.push(st.zs); st.zs = [[], []]; st.phase = 'z0'; ui(`Lage ${st.zp.length} gespeichert ✓ – Zollstock an anderer Stelle bzw. in anderer Richtung hinlegen, dann wieder Anfang und Ende antippen.`); }
  function toggleScan() { if (st.phase !== 'walls') return; st.scan = !st.scan; st.last = null; navigator.vibrate?.(st.scan ? 40 : 20); ui(); }
  function next() {
    if (st.phase === 'z0' && st.camOk && st.zs[0].length && !curScale()) { st.phase = 'z1'; return ui('Anfang gesetzt ✓ – jetzt den Kreis auf das Ende des Zollstocks und „Punkt“.'); }
    if (st.phase === 'z0' && st.camOk) { st.phase = 'walls'; const sa = autoScale(st.mobs, st.zlen, st.floorY.length ? med(st.floorY) : null), rs = curScale(); st.auto = sa && sa.k ? sa : rs;
      if (!sa?.k && rs) return ui(`Zollstock ✓ (${rs.n} Bilder) – Maßstab ${((rs.k - 1) * 100).toFixed(2).replace('.', ',')} % korrigiert, ±${(rs.sig * 100).toFixed(2).replace('.', ',')} %. Jetzt die Ecken.`); return ui(st.auto ? `Zollstock ✓ – AR-Maßstab wird um ${((st.auto.k - 1) * 100).toFixed(2).replace('.', ',')} % korrigiert. Jetzt die Ecken.` : 'Zollstock nicht erkannt – ohne Zollstock weiter (ungenauer, Kontrollmaß am Ende eintragen!).'); }
    if (st.phase === 'z0') { st.phase = 'z1'; return ui(); }
    if (st.phase === 'z1') { st.phase = 'walls'; const sc = scale(st.zs, st.zlen, st.zp); return ui(sc ? `Zollstock ✓ – AR-Maßstab wird um ${((sc.k - 1) * 100).toFixed(2).replace('.', ',')} % korrigiert. Jetzt die Ecken.` : 'Ohne Zollstock weiter – jetzt die Ecken.'); }
    if (st.phase === 'walls') return closeRoom();
    if (st.phase === 'h') return finish();
    const w = st.walls, cur = w[w.length - 1]; if (cur.length < 2) return;
    st.scan = false;
    if (w.length >= 2) { const a = fitLine(w[w.length - 2]), b = fitLine(cur); const ang = Math.acos(Math.min(1, Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1]))) * 57.3; if (ang < 10) return ui(`Wand ${w.length} ist fast parallel zur vorigen – gleiche Wand? Dann „Rückgängig“ tippen.`); }
    w.push([]); ui(`Wand ${w.length - 1} gespeichert ✓ – jetzt die nächste Wand (der Reihe nach rundherum).`);
  }
  function undo() {
    if (st.phase === 'h') { st.hs = []; st.ceilY = null; return ui(); }
    if (st.phase === 'walls') { if (!st.corners.length) return ui(); st.corners.pop(); st.walls.pop(); if (st.corners.length) st.walls[st.walls.length - 1].pop(); else st.walls = [[]]; st.last = null; return ui('↶'); }
    if (st.phase !== 'walls') { const z = st.zs[st.phase === 'z0' ? 0 : 1]; z.pop(); return ui(); }
    const w = st.walls, cur = w[w.length - 1];
    if (cur.length) { cur.splice(st.scan || cur.length > 20 ? 0 : cur.length - 1); st.scan = false; } else if (w.length > 1) w.pop(); // abgetastete Wand ganz neu
    ui('Rückgängig ✓');
  }
  // Ergebnis: Polygon (mit Zollstock-Maßstab), Genauigkeit je Wand aus der Streuung der Punkte
  function solve(walls, zs, zlen, floorY, ceilY, zp = [], auto = null) {
    const g = polygon(walls); if (g.err) return g;
    const sc = auto && auto.k ? auto : scale(zs, zlen, zp), k = sc ? sc.k : 1, n = g.P.length;
    const P = g.P.map(p => [p[0] * k, p[1] * k]), fy = med(floorY), h = ceilY !== null && fy !== null ? (ceilY - fy) * k : null;
    // Wandlänge i = Ecke i → i+1; Unsicherheit aus Versatz der beiden Nachbarwände (Punktstreuung/√n) und Maßstab
    const sig = P.map((p, i) => { const a = g.L[(i + n - 1) % n], b = g.L[(i + 1) % n], L = Math.hypot(P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1]); return Math.hypot(a.sOff, b.sOff, sc ? L * (sc.sig != null ? sc.sig : (sc.auto ? 0.001 : 0.003) / Math.sqrt(sc.n)) : L * 0.01) * k; });
    return { poly: P, height: h && h > 1.8 && h < 6 ? h : null, rms: Math.max(...g.L.map(l => l.rms)), sigma: sig, scale: sc, lines: g.L.map(l => ({ used: l.used, total: l.total, rms: l.rms, span: l.span })) };
  }
  function finish() {
    if (st.phase === 'walls' && !st.closed) { if (st.corners.length < 3) return; closeRoom(); }
    const walls = st.walls.filter(x => x.length >= 2); if (walls.length < 3) return;
    const r = solve(walls, st.zs, st.zlen, st.floorY, st.ceilY, st.zp, st.auto); if (r.err) return ui(r.err);
    // Rohdaten merken (letzte 5 Messungen) – für Vergleich mit Maßband und Verbesserungen
    try { const L = JSON.parse(localStorage.getItem('raumplan-ar-log') || '[]'); L.push({ t: st.t0, zlen: st.zlen, zs: st.zs, zp: st.zp, floorY: med(st.floorY), ceilY: st.ceilY, walls, log: st.log.slice(-4000), result: { poly: r.poly, sigma: r.sigma, scale: r.scale } }); localStorage.setItem('raumplan-ar-log', JSON.stringify(L.slice(-5))); } catch (e) { }
    r.raw = { walls, corners: st.corners, zlen: st.zlen, auto: st.auto || null, ends: (st.ends || []).map(c => ({ n: c.n, X: c.X, fl: c.fl.length })), floorY: med(st.floorY), ceilY: st.ceilY, log: st.log.slice(-3000) };
    st.s && st.s.end();
    st.done && st.done(r);
  }
  function cancel() { st.s && st.s.end(); }
  return { start, point, next, undo, finish, cancel, toggleScan, zMore, pixelToFloor, markerCenter, autoScale, inv4, pixelRay, triangulate, fitLine, polygon, solve, scale, rulerFind, rulerScale, learnColor, _test };
})();
if (typeof module !== 'undefined') module.exports = AR;
