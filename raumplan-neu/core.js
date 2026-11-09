'use strict';
/* Raumplan neu – Rechenkern (ohne DOM, in Node testbar).
   Grundidee: Der Zollstock liegt am Boden an der Wand. Vier Marken (80 mm) auf zwei Blättern bilden im Foto
   16 bekannte Bodenpunkte. Daraus folgt direkt die Abbildung Foto → Boden in Millimetern. Kein AR, keine Punktwolke. */
const RP = (() => {
  // ---------- Bekannte Lage der Marken in mm (Blatt 0 cm: Marken 0/2, Blatt 200 cm: Marken 1/3) ----------
  const MS = 80, N = 5, G = 7;
  const CENTERS = { 0: [0, 70], 2: [0, 225], 1: [2000, 70], 3: [2000, 225] };
  const DICT = [32846848, 26801152, 20804416, 29849856];
  const END = { 0: 0, 2: 0, 1: 1, 3: 1 };
  const layoutCorners = id => { const [x, y] = CENTERS[id], s = MS / 2; return [[x - s, y - s], [x + s, y - s], [x + s, y + s], [x - s, y + s]]; };

  const rotBits = c => { let n = 0; for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (c >>> (r * N + k) & 1) n |= 1 << (k * N + (N - 1 - r)); return n >>> 0; };
  const ham = (a, b) => { let x = (a ^ b) >>> 0, n = 0; while (x) { n += x & 1; x >>>= 1; } return n; };
  function decodeBits(c) { let best = null; DICT.forEach((d, id) => { let x = c; for (let k = 0; k < 4; k++) { const h = ham(x, d); if (h <= 2 && (!best || h < best.h)) best = { id, rot: k, h }; x = rotBits(x); } }); return best; }

  // ---------- Bild ----------
  function grayFrom(rgba, W, H) { const g = new Uint8Array(W * H); for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (rgba[j] * 77 + rgba[j + 1] * 151 + rgba[j + 2] * 28) >> 8; return g; }
  function half(g, W, H) { const w = W >> 1, h = H >> 1, o = new Uint8Array(w * h); for (let y = 0; y < h; y++) { const a = y * 2 * W, b = a + W; for (let x = 0; x < w; x++) { const i = x * 2; o[y * w + x] = (g[a + i] + g[a + i + 1] + g[b + i] + g[b + i + 1] + 2) >> 2; } } return { g: o, W: w, H: h }; }
  function bil(g, W, H, x, y) { x -= 0.5; y -= 0.5; const a = Math.floor(x), b = Math.floor(y); if (a < 0 || b < 0 || a >= W - 1 || b >= H - 1) return NaN; const f = x - a, h = y - b, i = b * W + a; return g[i] * (1 - f) * (1 - h) + g[i + 1] * f * (1 - h) + g[i + W] * (1 - f) * h + g[i + W + 1] * f * h; }

  // ---------- Dunkle Vierecke finden ----------
  function darkMask(g, W, H) {
    const r = Math.max(12, Math.round(Math.max(W, H) / 28)), I = new Float64Array((W + 1) * (H + 1)), S = W + 1;
    for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) { s += g[y * W + x]; I[(y + 1) * S + x + 1] = I[y * S + x + 1] + s; } }
    const m = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) { const y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1); for (let x = 0; x < W; x++) { const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), n = (x1 - x0) * (y1 - y0), mean = (I[y1 * S + x1] - I[y0 * S + x1] - I[y1 * S + x0] + I[y0 * S + x0]) / n, v = g[y * W + x]; m[y * W + x] = v < mean * 0.78 && v < mean - 12 ? 1 : 0; } }
    return m;
  }
  function components(m, W, H, minArea, maxArea) {
    const seen = new Uint8Array(W * H), st = new Int32Array(W * H), out = [];
    for (let s = 0; s < W * H; s++) { if (!m[s] || seen[s]) continue; let sp = 0, area = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; const pts = []; st[sp++] = s; seen[s] = 1;
      while (sp) { const k = st[--sp], y = (k / W) | 0, x = k - y * W; area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; let edge = false;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (nx < 0 || ny < 0 || nx >= W || ny >= H) { edge = true; continue; } const q = ny * W + nx; if (!m[q]) { edge = true; continue; } if (!seen[q]) { seen[q] = 1; st[sp++] = q; } }
        if (edge && pts.length < 200000) pts.push([x, y]); }
      if (area >= minArea && area <= maxArea && x1 - x0 >= 10 && y1 - y0 >= 4) out.push({ area, pts, box: [x0, y0, x1, y1] }); }
    return out;
  }
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  function hull(P) { const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), L = [], U = []; for (const q of p) { while (L.length > 1 && cross(L[L.length - 2], L[L.length - 1], q) <= 0) L.pop(); L.push(q); } for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (U.length > 1 && cross(U[U.length - 2], U[U.length - 1], q) <= 0) U.pop(); U.push(q); } return L.slice(0, -1).concat(U.slice(0, -1)); }
  const polyArea = Q => { let s = 0; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; s += a[0] * b[1] - a[1] * b[0]; } return Math.abs(s) / 2; };
  function quadOf(h) { // größtes einbeschriebenes Viereck: Startwerte, dann je Ecke verbessern
    if (h.length < 4) return null; let a = 0, b = 0, bd = -1; for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) { const d = (h[i][0] - h[j][0]) ** 2 + (h[i][1] - h[j][1]) ** 2; if (d > bd) { bd = d; a = i; b = j; } }
    const far = (u, v) => { let m = -1, md = -1; for (let i = 0; i < h.length; i++) { const d = Math.abs(cross(h[u], h[v], h[i])); if (d > md) { md = d; m = i; } } return m; };
    let idx = [a, far(a, b), b, far(b, a)]; idx.sort((x, y) => x - y);
    for (let it = 0; it < 4; it++) for (let k = 0; k < 4; k++) { let best = idx[k], ba = -1; for (let i = 0; i < h.length; i++) { const t = idx.slice(); t[k] = i; const ar = polyArea(t.map(j => h[j])); if (ar > ba) { ba = ar; best = i; } } idx[k] = best; }
    return idx.slice().sort((x, y) => x - y).map(i => h[i]);
  }
  function orderCW(Q) { const cx = Q.reduce((s, p) => s + p[0], 0) / 4, cy = Q.reduce((s, p) => s + p[1], 0) / 4; return Q.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)); }

  // ---------- Homographie ----------
  function solveLin(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[m][c])) m = r; if (Math.abs(M[m][c]) < 1e-14) return null; [M[c], M[m]] = [M[m], M[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / r[i]); }
  function normT(P) { let mx = 0, my = 0; for (const p of P) { mx += p[0]; my += p[1]; } mx /= P.length; my /= P.length; let d = 0; for (const p of P) d += Math.hypot(p[0] - mx, p[1] - my); const s = Math.SQRT2 / ((d / P.length) || 1); return [s, 0, -s * mx, 0, s, -s * my, 0, 0, 1]; }
  const mul = (a, b) => { const o = new Array(9).fill(0); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) o[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c]; return o; };
  function inv3(m) { const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, D = a * A + b * B + c * C; return [A / D, (c * h - b * i) / D, (b * f - c * e) / D, B / D, (a * i - c * g) / D, (c * d - a * f) / D, C / D, (b * g - a * h) / D, (a * e - b * d) / D]; }
  const apply = (H, p) => { const w = H[6] * p[0] + H[7] * p[1] + H[8]; return [(H[0] * p[0] + H[1] * p[1] + H[2]) / w, (H[3] * p[0] + H[4] * p[1] + H[5]) / w]; };
  function fitH(src, dst) { // Normalengleichungen in normierten Koordinaten, h33 = 1
    const Ts = normT(src), Td = normT(dst), ns = src.map(p => apply(Ts, p)), nd = dst.map(p => apply(Td, p)), A = Array.from({ length: 8 }, () => new Array(8).fill(0)), b = new Array(8).fill(0);
    const add = (v, y) => { for (let i = 0; i < 8; i++) { b[i] += v[i] * y; for (let j = 0; j < 8; j++) A[i][j] += v[i] * v[j]; } };
    ns.forEach(([x, y], i) => { const [X, Y] = nd[i]; add([x, y, 1, 0, 0, 0, -x * X, -y * X], X); add([0, 0, 0, x, y, 1, -x * Y, -y * Y], Y); });
    const h = solveLin(A, b); if (!h) return null; return mul(mul(inv3(Td), [...h, 1]), Ts);
  }

  // ---------- Viereck genau bestimmen und Code lesen ----------
  function refineSide(g, W, H, a, b, inner, c) { // Kante zwischen a und b, Außen = von c abgewandt
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; let nx = -uy, ny = ux; if ((c[0] - a[0]) * nx + (c[1] - a[1]) * ny > 0) { nx = -nx; ny = -ny; } // n zeigt nach außen
    const n = Math.max(6, Math.min(80, Math.round(L / 2))), P = [], reach = Math.min(4, Math.max(1.6, inner * 0.8));
    for (let i = 0; i < n; i++) { const t = 0.12 + 0.76 * i / (n - 1), px = a[0] + dx * t, py = a[1] + dy * t, prof = []; const st = 0.25;
      for (let s = -reach; s <= reach + 1e-6; s += st) prof.push(bil(g, W, H, px + nx * s, py + ny * s)); if (prof.some(Number.isNaN)) continue;
      let best = -1, bv = 0; for (let k = 2; k < prof.length - 2; k++) { const d = (prof[k + 2] + prof[k + 1] - prof[k - 1] - prof[k - 2]); if (d > bv) { bv = d; best = k; } } if (best < 0 || bv < 12) continue;
      const v0 = prof[best + 1] - prof[best - 1], vm = prof[best] - prof[best - 2], vp = prof[best + 2] - prof[best], den = vm - 2 * v0 + vp, off = Math.abs(den) > 1e-6 ? 0.5 * (vm - vp) / den : 0, s = -reach + (best + Math.max(-1, Math.min(1, off))) * st; P.push([px + nx * s, py + ny * s]); }
    if (P.length < 4) return null; let S = P;
    for (let it = 0; it < 3; it++) { const mx = S.reduce((q, p) => q + p[0], 0) / S.length, my = S.reduce((q, p) => q + p[1], 0) / S.length; let xx = 0, yy = 0, xy = 0; for (const p of S) { xx += (p[0] - mx) ** 2; yy += (p[1] - my) ** 2; xy += (p[0] - mx) * (p[1] - my); } const th = 0.5 * Math.atan2(2 * xy, xx - yy), e = [Math.cos(th), Math.sin(th)], res = S.map(p => Math.abs(-(p[0] - mx) * e[1] + (p[1] - my) * e[0])), sd = Math.max(0.25, Math.sqrt(res.reduce((q, r) => q + r * r, 0) / S.length) * 1.8), T = S.filter((p, i) => res[i] <= sd); if (it === 2 || T.length < 4) return { m: [mx, my], e, n: S.length }; S = T; }
    return null;
  }
  function refineQuad(g, W, H, Q) {
    const q = orderCW(Q), L = [], cell = Math.min(...q.map((p, i) => Math.hypot(p[0] - q[(i + 1) % 4][0], p[1] - q[(i + 1) % 4][1]))) / G;
    for (let i = 0; i < 4; i++) { const l = refineSide(g, W, H, q[i], q[(i + 1) % 4], cell, q[(i + 2) % 4]); if (!l) return null; L.push(l); }
    const out = []; for (let i = 0; i < 4; i++) { const a = L[(i + 3) % 4], b = L[i], den = a.e[0] * b.e[1] - a.e[1] * b.e[0]; if (Math.abs(den) < 0.05) return null; const t = ((b.m[0] - a.m[0]) * b.e[1] - (b.m[1] - a.m[1]) * b.e[0]) / den; out.push([a.m[0] + a.e[0] * t, a.m[1] + a.e[1] * t]); }
    return out.some((p, i) => Math.hypot(p[0] - q[i][0], p[1] - q[i][1]) > 8) ? null : out;
  }
  function readCode(g, W, H, q) {
    const T = fitH([[0, 0], [G, 0], [G, G], [0, G]], q); if (!T) return null;
    const val = (r, k) => { const v = []; for (const [a, b] of [[.35, .35], [.65, .35], [.35, .65], [.65, .65], [.5, .5]]) { const p = apply(T, [k + a, r + b]), z = bil(g, W, H, p[0], p[1]); if (!Number.isNaN(z)) v.push(z); } return v.length ? v.sort((x, y) => x - y)[v.length >> 1] : NaN; };
    let dark = 0, nd = 0, white = []; for (let i = 0; i < G; i++) for (const [r, k] of [[0, i], [G - 1, i], [i, 0], [i, G - 1]]) { const v = val(r, k); if (!Number.isNaN(v)) { dark += v; nd++; } } dark /= nd || 1;
    for (const [dx, dy] of [[-.45, 3.5], [G + .45, 3.5], [3.5, -.45], [3.5, G + .45]]) { const p = apply(T, [dx, dy]), z = bil(g, W, H, p[0], p[1]); if (!Number.isNaN(z)) white.push(z); } const lim = white.length ? white.reduce((a, b) => a + b, 0) / white.length : 200; const mid = (dark + lim) / 2;
    let c = 0; for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) { const v = val(r + 1, k + 1); if (v < mid) c |= 1 << (r * N + k); }
    return decodeBits(c >>> 0);
  }

  // Bild → Liste aller Marken-Kandidaten: {id|null, rot, c:[4 Ecken in Vollbild-px], center}
  function findQuads(gray, W, H, opt = {}) {
    let lv = { g: gray, W, H }, f = 1; const target = opt.maxW || 2048; while (lv.W > target) { lv = half(lv.g, lv.W, lv.H); f *= 2; }
    const m = darkMask(lv.g, lv.W, lv.H), comps = components(m, lv.W, lv.H, 30, lv.W * lv.H / 6), Q = [];
    for (const c of comps) { const hu = hull(c.pts); if (hu.length < 4) continue; const q = quadOf(hu); if (!q) continue; const qa = polyArea(q); if (qa < 30) continue; if (polyArea(hu) / qa > 1.2) continue; const fill = c.area / qa; if (fill < 0.28 || fill > 1.1) continue; const o = orderCW(q), s = o.map((p, i) => Math.hypot(p[0] - o[(i + 1) % 4][0], p[1] - o[(i + 1) % 4][1])), mn = Math.min(...s); if (mn < 4 || Math.max(...s) / mn > 25) continue;
      const big = o.map(p => [(p[0] + .5) * f, (p[1] + .5) * f]), rf = refineQuad(gray, W, H, big); if (!rf) continue; const code = readCode(gray, W, H, rf); Q.push({ c: rf, id: code ? code.id : null, rot: code ? code.rot : 0, area: qa * f * f, center: [rf.reduce((s, p) => s + p[0], 0) / 4, rf.reduce((s, p) => s + p[1], 0) / 4] }); }
    return Q;
  }

  // ---------- Vierecke den Marken zuordnen und Abbildung Foto → Boden rechnen ----------
  const assign = (quad, id, H0) => { const lay = layoutCorners(id), Hin = inv3(H0), pred = lay.map(p => apply(Hin, p)); let best = null, be = 1e18; for (const dir of [1, -1]) for (let s = 0; s < 4; s++) { let e = 0; const idx = [0, 1, 2, 3].map(i => (s + dir * i + 8) % 4); for (let i = 0; i < 4; i++) e += (quad.c[idx[i]][0] - pred[i][0]) ** 2 + (quad.c[idx[i]][1] - pred[i][1]) ** 2; if (e < be) { be = e; best = idx; } } return lay.map((L, i) => ({ px: quad.c[best[i]], mm: L, id })); };
  function solveAssign(pairs) { // pairs: [{quad,id}] → H und Restfehler
    const cIm = pairs.map(p => p.quad.center), cMm = pairs.map(p => CENTERS[p.id]);
    let H0 = pairs.length >= 4 ? fitH(cIm, cMm) : null;
    if (!H0) { const a = [], b = []; pairs.forEach(p => { const o = orderCW(p.quad.c), L = layoutCorners(p.id); for (let i = 0; i < 4; i++) { a.push(o[i]); b.push(L[i]); } }); H0 = fitH(a, b); }
    if (!H0) return null; let C = []; pairs.forEach(p => { C = C.concat(assign(p.quad, p.id, H0)); });
    let H = fitH(C.map(q => q.px), C.map(q => q.mm)); if (!H) return null;
    const Hi = inv3(H); C = []; pairs.forEach(p => { C = C.concat(assign(p.quad, p.id, H)); }); H = fitH(C.map(q => q.px), C.map(q => q.mm)); if (!H) return null;
    const Hi2 = inv3(H), r = C.map(q => { const p = apply(Hi2, q.mm); return Math.hypot(p[0] - q.px[0], p[1] - q.px[1]); }), rms = Math.sqrt(r.reduce((s, v) => s + v * v, 0) / r.length);
    // Probe: Markenkante aus der Abbildung muss 80 mm sein
    let edge = 0, ne = 0; pairs.forEach(p => { const o = orderCW(p.quad.c).map(q => apply(H, q)); for (let i = 0; i < 4; i++) { edge += Math.hypot(o[i][0] - o[(i + 1) % 4][0], o[i][1] - o[(i + 1) % 4][1]); ne++; } });
    return { H, Hi: Hi2, rms, edge: edge / ne, n: C.length, pts: C, ids: pairs.map(p => p.id) };
  }
  function locate(quads) {
    const byId = {}; quads.forEach(q => { if (q.id !== null && (!byId[q.id] || q.area > byId[q.id].area)) byId[q.id] = q; });
    let pairs = Object.keys(byId).map(k => ({ quad: byId[k], id: +k })), sol = null;
    const hasEnds = P => new Set(P.map(p => END[p.id])).size === 2;
    if (pairs.length >= 2 && hasEnds(pairs)) sol = solveAssign(pairs);
    // nicht gelesene Vierecke dazunehmen, wenn sie genau dort liegen, wo eine Marke sein muss
    if (sol && pairs.length < 4) { for (const id of [0, 1, 2, 3]) { if (byId[id]) continue; const pc = apply(sol.Hi, CENTERS[id]); let best = null, bd = 1e9; for (const q of quads) { if (q.id !== null) continue; const d = Math.hypot(q.center[0] - pc[0], q.center[1] - pc[1]); if (d < bd) { bd = d; best = q; } } const lim = Math.max(10, Math.sqrt(best ? best.area : 0)); if (best && bd < lim) pairs.push({ quad: best, id }); } if (pairs.length > sol.ids.length) sol = solveAssign(pairs) || sol; }
    if (!sol || sol.rms > 3 || sol.ids.length < 4) { // Code zu klein zum Lesen: Anordnung der vier schwarzen Quadrate suchen
      const C = quads.slice().sort((a, b) => b.area - a.area).slice(0, 12); let best = null;
      for (let a = 0; a < C.length; a++) for (let b = a + 1; b < C.length; b++) for (let c = b + 1; c < C.length; c++) for (let d = c + 1; d < C.length; d++) { const set = [C[a], C[b], C[c], C[d]], ar = set.map(q => q.area), mx = Math.max(...ar), mn = Math.min(...ar); if (mx / mn > 6) continue;
        for (const perm of [[0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1]]) { const P = [0, 2, 1, 3].map((id, i) => ({ quad: set[perm[i]], id })); const H0 = fitH(P.map(p => p.quad.center), P.map(p => CENTERS[p.id])); if (!H0) continue; const s = solveAssign(P); if (!s || s.rms > 2.5 || Math.abs(s.edge - MS) / MS > 0.08) continue; if (!best || s.rms < best.rms) best = s; } }
      if (best && (!sol || sol.ids.length < 4 || best.rms < sol.rms)) sol = best; }
    if (!sol) return { err: 'markers', found: pairs.map(p => p.id), nDark: quads.length };
    if (sol.rms > 3) return { err: 'rms', found: pairs.map(p => p.id), rms: sol.rms, nDark: quads.length };
    const res = { ...sol, ok: true }; res.ends = [...new Set(sol.ids.map(i => END[i]))].length; return res;
  }

  // ---------- Vermessung ----------
  const toFloor = (loc, p) => apply(loc.H, p);
  const toImage = (loc, p) => apply(loc.Hi, p);
  function floorDist(loc, a, b) { const A = toFloor(loc, a), B = toFloor(loc, b); return Math.hypot(A[0] - B[0], A[1] - B[1]); }
  function randn() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(2 * Math.PI * Math.random()); }
  // Unsicherheit der Wandlänge: Foto-Abbildung und Eckpunkte verrauschen, Streuung über 60 Läufe
  function sigmaOf(loc, a, b, n = 60) { const sm = Math.max(0.3, loc.rms), V = [], src = loc.pts.map(q => q.px), dst = loc.pts.map(q => q.mm);
    for (let k = 0; k < n; k++) { const S = src.map(p => [p[0] + randn() * sm, p[1] + randn() * sm]), H = fitH(S, dst); if (!H) continue; const A = apply(H, [a[0] + randn() * 2, a[1] + randn()]), B = apply(H, [b[0] + randn() * 2, b[1] + randn()]); V.push(Math.hypot(A[0] - B[0], A[1] - B[1])); }
    if (V.length < 8) return 99; const m = V.reduce((s, v) => s + v, 0) / V.length; return Math.sqrt(V.reduce((s, v) => s + (v - m) ** 2, 0) / (V.length - 1)); }

  function wallCheck(loc, a, b, sig) { // die Prüfungen, die das alte Programm nicht hatte
    const A = toFloor(loc, a), B = toFloor(loc, b), L = Math.hypot(A[0] - B[0], A[1] - B[1]), issues = [], xs = [A[0], B[0]].sort((x, y) => x - y);
    if (sig > 30) issues.push({ k: 'ungenau', t: `Messung unsicher (± ${(sig * 2 / 10).toFixed(0)} cm). Bitte näher herangehen oder die Blätter besser ausleuchten.` });
    if (L < 2000 && xs[0] > -60 && xs[1] < 2060) issues.push({ k: 'kurz', t: 'Wand wäre kürzer als der Zollstock, der dort liegt. Bitte die Ecken prüfen.' });
    if (Math.abs(loc.edge - MS) / MS > 0.03) issues.push({ k: 'marke', t: `Marke misst im Foto ${loc.edge.toFixed(0)} statt 80 mm – Blatt falsch gedruckt oder nicht flach?` });
    if (loc.rms > 1.5) issues.push({ k: 'rms', t: 'Marken passen nicht zusammen – Blätter liegen nicht flach oder Zollstock nicht ganz ausgeklappt.' });
    return issues;
  }

  // Bodenlinie: stärkste Helligkeitskante in Nähe der Verbindung a–b, als Gerade ausgeglichen; verschiebt a und b nur senkrecht
  function snapBase(g, W, H, a, b, win = 14) {
    const P = [], n = 60; for (let i = 0; i < n; i++) { const t = 0.06 + 0.88 * i / (n - 1), x = a[0] + (b[0] - a[0]) * t, y0 = a[1] + (b[1] - a[1]) * t; let bv = 0, bs = null; for (let s = -win; s <= win; s += .5) { const d = bil(g, W, H, x, y0 + s + 2) + bil(g, W, H, x, y0 + s + 1) - bil(g, W, H, x, y0 + s - 1) - bil(g, W, H, x, y0 + s - 2); const v = Math.abs(d); if (v > bv) { bv = v; bs = s; } } if (bs !== null && bv > 8) P.push([x, y0 + bs]); }
    if (P.length < 12) return null; let best = null, bc = 0; for (let it = 0; it < 120; it++) { const p = P[(Math.random() * P.length) | 0], q = P[(Math.random() * P.length) | 0]; if (Math.abs(p[0] - q[0]) < 30) continue; const m = (q[1] - p[1]) / (q[0] - p[0]), c = p[1] - m * p[0], inl = P.filter(r => Math.abs(r[1] - m * r[0] - c) < 1.2); if (inl.length > bc) { bc = inl.length; best = inl; } }
    if (!best || bc < P.length * 0.4) return null; const mx = best.reduce((s, p) => s + p[0], 0) / bc, my = best.reduce((s, p) => s + p[1], 0) / bc; let sxx = 0, sxy = 0; for (const p of best) { sxx += (p[0] - mx) ** 2; sxy += (p[0] - mx) * (p[1] - my); } const m = sxy / sxx, f = x => my + m * (x - mx);
    return { a: [a[0], f(a[0])], b: [b[0], f(b[0])], inl: bc / P.length };
  }

  // Vorschlag für die Wandecken (immer vom Nutzer prüfbar): Bodenlinie suchen, dann stärkster senkrechter Sprung außerhalb des Zollstocks
  function suggestCorners(g, W, H, loc) {
    const up = (() => { const a = toImage(loc, [1000, 60]), b = toImage(loc, [1000, 260]); return b[1] < a[1] ? 1 : -1; })(); // +y im Boden = oben im Bild?
    const inImg = p => p[0] > 6 && p[1] > 6 && p[0] < W - 6 && p[1] < H - 6;
    const edgeAt = (x, y) => { const p = toImage(loc, [x, y]), q = toImage(loc, [x, y + 12]), r = toImage(loc, [x, y - 12]); if (!inImg(q) || !inImg(r)) return 0; const v = bil(g, W, H, q[0], q[1]) - bil(g, W, H, r[0], r[1]); return Number.isNaN(v) ? 0 : Math.abs(v); };
    const search = up > 0 ? [320, 900] : [-900, -14]; // jenseits von Blatt und Zollstock
    const xs = []; for (let x = 180; x <= 1820; x += 40) xs.push(x); let by = null, bv = 0; const prof = []; for (let y = search[0]; y <= search[1]; y += 6) { let s = 0, c = 0; for (const x of xs) { const v = edgeAt(x, y); if (v > 0) { s += v; c++; } } const m = c ? s / c : 0; prof.push([y, m]); if (m > bv) { bv = m; by = y; } }
    if (by === null) { const v0 = (up > 0 ? search[0] : search[1]); by = v0; }
    // nächstes starkes Maximum vom Zollstock aus (die Wand kommt zuerst, nicht die Scheuerleiste oben)
    const pk = prof.filter(p => p[1] > bv * 0.55); if (pk.length) by = up > 0 ? pk[0][0] : pk[pk.length - 1][0];
    const line = x => toImage(loc, [x, by]), step = 15, lim = 6000; let L = null, R = null, Lv = 0, Rv = 0;
    const wallBand = x => { const p = line(x); if (!inImg(p)) return null; const hgt = Math.max(30, H * 0.09), a = bil(g, W, H, p[0] - 14, p[1] - hgt), b = bil(g, W, H, p[0] + 14, p[1] - hgt); let s = 0, n = 0; for (let k = 0.18; k <= 1.8; k += 0.12) { const y = p[1] - hgt * k; if (y < 3) break; const A = bil(g, W, H, p[0] - 16, y), B = bil(g, W, H, p[0] + 16, y); if (!Number.isNaN(A) && !Number.isNaN(B)) { s += B - A; n++; } } return n ? Math.abs(s / n) : null; };
    for (let x = -80; x > -lim; x -= step) { const v = wallBand(x); if (v === null) break; if (v > Lv) { Lv = v; L = x; } }
    for (let x = 2080; x < lim; x += step) { const v = wallBand(x); if (v === null) break; if (v > Rv) { Rv = v; R = x; } }
    if (L === null) L = -500; if (R === null) R = 2500;
    const refine = x => { const p0 = line(x), hg = Math.max(40, H * 0.1), P = []; for (let k = 1; k <= 18; k++) { const h = hg * (0.25 + k * 0.1), v = p0[1] - h; if (v < 4) break; let bv = 0, bu = null; for (let u = -70; u <= 70; u += 1) { const uu = p0[0] + u, A = bil(g, W, H, uu - 4, v), B = bil(g, W, H, uu + 4, v); if (Number.isNaN(A) || Number.isNaN(B)) continue; const d = Math.abs(B - A); if (d > bv) { bv = d; bu = uu; } } if (bu !== null && bv > 6) P.push([h, bu]); }
      if (P.length < 5) return p0; let best = null, bc = 0; for (let it = 0; it < 80; it++) { const a = P[(Math.random() * P.length) | 0], b = P[(Math.random() * P.length) | 0]; if (a[0] === b[0]) continue; const m = (b[1] - a[1]) / (b[0] - a[0]); if (Math.abs(m) > 0.45) continue; const c0 = a[1] - m * a[0], I = P.filter(q => Math.abs(q[1] - m * q[0] - c0) < 2.5); if (I.length > bc) { bc = I.length; best = { m, c0, I }; } } if (!best || bc < 4) return p0;
      let s0 = 0, s1 = 0, s2 = 0, s3 = 0; for (const q of best.I) { s0 += q[0]; s1 += q[1]; s2 += q[0] * q[0]; s3 += q[0] * q[1]; } const n = best.I.length, m = (n * s3 - s0 * s1) / (n * s2 - s0 * s0), c1 = (s1 - m * s0) / n; return [c1, p0[1]]; };
    return { a: refine(L), b: refine(R), by, up, Lv, Rv };
  }

  // ---------- Raum aus den Wänden ----------
  function roomRect(w) { const a = w[0], b = w[1], c = w[2], d = w[3], breite = c ? (a + c) / 2 : a, tiefe = d ? (b + d) / 2 : b, diff = [c ? Math.abs(a - c) : null, d ? Math.abs(b - d) : null]; return { poly: [[0, 0], [breite, 0], [breite, tiefe], [0, tiefe]], area: breite * tiefe / 1e6, breite, tiefe, diff }; }
  function roomOrtho(walls) { // Wände im Uhrzeigersinn mit Abbiegung rechts/links, rechtwinklig; Schlussfehler wird verteilt
    let dir = 0, x = 0, y = 0; const P = [[0, 0]], D = [[1, 0], [0, 1], [-1, 0], [0, -1]]; for (const q of walls) { x += D[dir][0] * q.L; y += D[dir][1] * q.L; P.push([x, y]); dir = (dir + (q.turn === 'L' ? 3 : 1)) % 4; }
    const dx = P[P.length - 1][0], dy = P[P.length - 1][1], gap = Math.hypot(dx, dy); let sumAbs = walls.reduce((s, q) => s + q.L, 0); dir = 0; x = 0; y = 0; const Q = [[0, 0]]; for (const q of walls) { const u = D[dir], f = q.L / sumAbs; x += u[0] * q.L - dx * f; y += u[1] * q.L - dy * f; Q.push([x, y]); dir = (dir + (q.turn === 'L' ? 3 : 1)) % 4; } Q.pop(); return { poly: Q, gap, area: polyArea(Q) / 1e6 };
  }
  return { MS, CENTERS, DICT, END, layoutCorners, grayFrom, half, bil, findQuads, locate, toFloor, toImage, floorDist, sigmaOf, wallCheck, snapBase, suggestCorners, roomRect, roomOrtho, polyArea };
})();
if (typeof module !== 'undefined') module.exports = RP;
