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


  // ---------- Bodenaufmaß: Zollstock bleibt in der Mitte ----------
  function locateBest(g, W, H) { let loc = locate(findQuads(g, W, H)); if ((!loc.ok || loc.ids.length < 4) && W > 2600) { const l2 = locate(findQuads(g, W, H, { maxW: W })); if (l2.ok && (!loc.ok || l2.ids.length > loc.ids.length || l2.rms < loc.rms)) loc = l2; } return loc; }
  function cornerSnap(g, W, H, p, win = 8, maxShift = 7) { // Punkt auf den genauen Kantenschnitt ziehen (Eckensuche über Bildgradienten)
    let q = [p[0], p[1]];
    for (let it = 0; it < 8; it++) { let a = 0, b = 0, c = 0, u = 0, v = 0; for (let dy = -win; dy <= win; dy++) for (let dx = -win; dx <= win; dx++) { const x = q[0] + dx, y = q[1] + dy, gx = (bil(g, W, H, x + 1, y) - bil(g, W, H, x - 1, y)) / 2, gy = (bil(g, W, H, x, y + 1) - bil(g, W, H, x, y - 1)) / 2; if (Number.isNaN(gx) || Number.isNaN(gy)) continue; a += gx * gx; b += gx * gy; c += gy * gy; u += gx * gx * x + gx * gy * y; v += gx * gy * x + gy * gy * y; }
      const det = a * c - b * b; if (det < 1e-3 || Math.min(a, c) < 200) return [p[0], p[1]]; const nx = (c * u - b * v) / det, ny = (a * v - b * u) / det, sh = Math.hypot(nx - q[0], ny - q[1]); q = [nx, ny]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) > maxShift) return [p[0], p[1]]; if (sh < 0.05) break; }
    return q; }
  function pinSigma(loc, q, n = 24) { const sm = Math.max(0.3, loc.rms), src = loc.pts.map(a => a.px), dst = loc.pts.map(a => a.mm), R = []; for (let k = 0; k < n; k++) { const S = src.map(p => [p[0] + randn() * sm, p[1] + randn() * sm]), H = fitH(S, dst); if (!H) continue; R.push(apply(H, [q[0] + randn() * 1.5, q[1] + randn() * 1.5])); } if (R.length < 6) return 40; const mx = R.reduce((s, p) => s + p[0], 0) / R.length, my = R.reduce((s, p) => s + p[1], 0) / R.length; return Math.sqrt(R.reduce((s, p) => s + (p[0] - mx) ** 2 + (p[1] - my) ** 2, 0) / (R.length - 1)); }
  const inside = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < (P[j][0] - P[i][0]) * (p[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  function offsetPoly(P, t) { if (!t) return P; const n = P.length, area = P.reduce((s, p, i) => s + p[0] * P[(i + 1) % n][1] - P[(i + 1) % n][0] * p[1], 0), sg = area > 0 ? 1 : -1, L = []; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l * sg, ny = -dx / l * sg; L.push({ p: [a[0] + nx * t, a[1] + ny * t], d: [dx / l, dy / l] }); }
    return P.map((_, i) => { const a = L[(i + n - 1) % n], b = L[i], den = a.d[0] * b.d[1] - a.d[1] * b.d[0]; if (Math.abs(den) < 0.05) return [b.p[0], b.p[1]]; const s = ((b.p[0] - a.p[0]) * b.d[1] - (b.p[1] - a.p[1]) * b.d[0]) / den; return [a.p[0] + a.d[0] * s, a.p[1] + a.d[1] * s]; }); }
  // alle angetippten Ecken: nahe Punkte (< 25 cm) sind dieselbe Ecke, Umriss im Kreis um den Zollstock
  function roomFromPins(pins, skirt = 0) { const C = []; for (const q of pins) { let b = null, bd = 250; for (const c of C) { const d = Math.hypot(c.x - q.f[0], c.y - q.f[1]); if (d < bd) { bd = d; b = c; } } if (b) { b.P.push(q); b.x = b.P.reduce((s, p) => s + p.f[0], 0) / b.P.length; b.y = b.P.reduce((s, p) => s + p.f[1], 0) / b.P.length; } else C.push({ x: q.f[0], y: q.f[1], P: [q] }); }
    const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
    const corners = C.map(c => { const w = c.P.map(p => 1 / Math.max(5, p.s || 15) ** 2), W = w.reduce((s, v) => s + v, 0), x = c.P.reduce((s, p, i) => s + p.f[0] * w[i], 0) / W, y = c.P.reduce((s, p, i) => s + p.f[1] * w[i], 0) / W, spread = Math.max(0, ...c.P.map(p => Math.hypot(p.f[0] - x, p.f[1] - y))), sig = Math.sqrt(1 / W); return { p: [x, y], n: c.P.length, spread, sig }; }).sort((a, b) => Math.atan2(a.p[1] - 147, a.p[0] - 1000) - Math.atan2(b.p[1] - 147, b.p[0] - 1000));
    const raw = corners.map(c => c.p), poly = raw.length > 2 ? offsetPoly(raw, skirt) : raw, walls = [], problems = [];
    for (let i = 0; i < poly.length && poly.length > 2; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; walls.push({ L: Math.hypot(a[0] - b[0], a[1] - b[1]), sig: Math.hypot(corners[i].sig, corners[(i + 1) % poly.length].sig) }); }
    if (poly.length > 2) { const outside = Object.values(CENTERS).filter(p => !inside(p, poly)).length; if (outside) problems.push('Der Zollstock läge außerhalb dieses Umrisses. Eine Ecke sitzt falsch oder eine Raumecke fehlt noch.'); }
    return { corners, poly, walls, area: poly.length > 2 ? polyArea(poly) / 1e6 : 0, problems }; }


  // ---------- Versuch: Wandlänge automatisch aus mehreren Fotos ----------
  // Jedes Foto wird auf den Boden umgerechnet. Nur was auf dem Boden liegt, bleibt aus allen Blickwinkeln an derselben Stelle
  // (Wandfuß, nicht aber Möbelkanten oder die Wand selbst). Darum zählen nur Kanten, die mehrere Fotos gemeinsam zeigen.
  const GRID = { cell: 20, x0: 1000 - 6500, y0: 147 - 6500, n: 650 };
  function viewMap(g, W, H, loc) { const { cell, x0, y0, n } = GRID, R = new Float32Array(n * n), V = new Uint8Array(n * n), Hi = loc.Hi, ws = Hi[6] * 1000 + Hi[7] * 147 + Hi[8], off = [[0, 0], [-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const X = x0 + (i + .5) * cell, Y = y0 + (j + .5) * cell; if (X > -130 && X < 2130 && Y > -15 && Y < 315) continue; let s = 0, c2 = 0; for (const [a, b] of off) { const x = X + a * cell, y = Y + b * cell, w = Hi[6] * x + Hi[7] * y + Hi[8]; if (w * ws <= 0) continue; const v = bil(g, W, H, (Hi[0] * x + Hi[1] * y + Hi[2]) / w, (Hi[3] * x + Hi[4] * y + Hi[5]) / w); if (!Number.isNaN(v)) { s += v; c2++; } } if (c2 === 5) { R[j * n + i] = s / 5; V[j * n + i] = 1; } }
    const G = new Float32Array(n * n), vals = []; for (let j = 2; j < n - 2; j++) for (let i = 2; i < n - 2; i++) { const k = j * n + i; if (!V[k] || !V[k - 2] || !V[k + 2] || !V[k - 2 * n] || !V[k + 2 * n]) continue; const gx = R[k + 2] - R[k - 2], gy = R[k + 2 * n] - R[k - 2 * n], m = Math.hypot(gx, gy); G[k] = m; if (m > 0 && !(k % 37)) vals.push(m); }
    vals.sort((a, b) => a - b); const T = Math.max(14, (vals[vals.length >> 1] || 0) * 3), E = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) if (G[k] >= T) E[k] = 1;
    const rc = apply(loc.Hi, [1000, 147]), a = apply(loc.H, [rc[0], rc[1] - H * 0.06]), d = [a[0] - 1000, a[1] - 147], l = Math.hypot(d[0], d[1]) || 1; return { E, V, look: [d[0] / l, d[1] / l] }; }
  function supportMap(views) { const { n } = GRID, S = new Uint16Array(n * n), Se = new Uint16Array(n * n); for (const v of views) { const D = new Uint8Array(n * n); for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i; if (v.E[k] || v.E[k - 1] || v.E[k + 1] || v.E[k - n] || v.E[k + n]) D[k] = 1; } for (let k = 0; k < n * n; k++) { S[k] += D[k]; Se[k] += v.V[k]; } } const need = views.length >= 2 ? Math.max(2, Math.ceil(views.length * 0.34)) : 1, K = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) if (S[k] >= need && S[k] >= 0.4 * Se[k]) K[k] = 1; return K; }
  function fitLineCells(K, pts, u, rho, ctr) { const tol = 60, P = pts.filter(p => Math.abs((p[0] - ctr[0]) * u[0] + (p[1] - ctr[1]) * u[1] - rho) < tol); if (P.length < 6) return { u, rho, n: P.length }; let mx = 0, my = 0; P.forEach(p => { mx += p[0]; my += p[1]; }); mx /= P.length; my /= P.length; let xx = 0, yy = 0, xy = 0; P.forEach(p => { xx += (p[0] - mx) ** 2; yy += (p[1] - my) ** 2; xy += (p[0] - mx) * (p[1] - my); }); const th = 0.5 * Math.atan2(2 * xy, xx - yy), e = [Math.cos(th), Math.sin(th)]; let nu = [-e[1], e[0]]; if (nu[0] * u[0] + nu[1] * u[1] < 0) nu = [-nu[0], -nu[1]]; return { u: nu, rho: (mx - ctr[0]) * nu[0] + (my - ctr[1]) * nu[1], n: P.length, e }; }
  function hough(pts, ctr, base, span) { const res = []; for (let a = -span; a <= span; a += 1) { const t = base + a * Math.PI / 180, u = [Math.cos(t), Math.sin(t)], H = new Int32Array(801); for (const p of pts) { const r = Math.round(((p[0] - ctr[0]) * u[0] + (p[1] - ctr[1]) * u[1]) / 20) + 400; if (r >= 0 && r < 801) H[r]++; } for (let i = 1; i < 800; i++) { const v = H[i - 1] + H[i] + H[i + 1]; if (H[i] >= H[i - 1] && H[i] >= H[i + 1] && v > 0) res.push({ t, u, rho: (i - 400) * 20, v }); } } return res; }
  function wallFromViews(views) { if (!views.length) return { err: 'keine Fotos' }; const { cell, x0, y0, n } = GRID, K0 = supportMap(views), morph = (src, erode) => { const o = new Uint8Array(n * n); for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i, v = erode ? src[k] && src[k - 1] && src[k + 1] && src[k - n] && src[k + n] : src[k] || src[k - 1] || src[k + 1] || src[k - n] || src[k + n]; o[k] = v ? 1 : 0; } return o; }, count = a => a.reduce((s, v) => s + v, 0), open = r => { let q = K0; for (let t = 0; t < r; t++) q = morph(q, true); for (let t = 0; t < r; t++) q = morph(q, false); return q; }; let K = open(4); if (count(K) < 0.2 * count(K0)) K = open(1);
    const ctr = [1000, 147], B = [], at = (x, y) => { const i = Math.floor((x - x0) / cell), j = Math.floor((y - y0) / cell); return i >= 0 && j >= 0 && i < n && j < n ? K[j * n + i] : -1; };
    for (let a = 0; a < 720; a++) { const th = a * Math.PI / 360, d = [Math.cos(th), Math.sin(th)]; let first = -1, last = -1, gap = 0; for (let r = 200; r < 6400; r += cell) { const v = at(ctr[0] + d[0] * r, ctr[1] + d[1] * r); if (v < 0) break; if (v) { if (first < 0) first = r; last = r; gap = 0; } else if (first >= 0) { gap += cell; if (gap > 180) break; } } if (last > 0) B.push([ctr[0] + d[0] * last, ctr[1] + d[1] * last]); }
    if (B.length < 40) return { err: 'Zu wenig Boden erkannt', K, n: views.length };
    let lx = 0, ly = 0; views.forEach(v => { lx += v.look[0]; ly += v.look[1]; }); const nl = Math.hypot(lx, ly) || 1, look = [lx / nl, ly / nl];
    // Geraden durch Randpunkte; u zeigt vom Zollstock weg
    const lines = (dir, cosMin) => { const res = [], seen = new Set(); for (let i = 0; i < B.length; i += 2) for (let s = 8; s <= 80; s += 6) { const p = B[i], q = B[(i + s) % B.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); if (l < 250) continue; let u = [dy / l, -dx / l], rho = (p[0] - ctr[0]) * u[0] + (p[1] - ctr[1]) * u[1]; if (rho < 0) { u = [-u[0], -u[1]]; rho = -rho; } if (u[0] * dir[0] + u[1] * dir[1] < cosMin && -(u[0] * dir[0] + u[1] * dir[1]) < cosMin) continue; const key = Math.round(Math.atan2(u[1], u[0]) * 60) + ':' + Math.round(rho / 30); if (seen.has(key)) continue; seen.add(key); const I = B.filter(b => Math.abs((b[0] - ctr[0]) * u[0] + (b[1] - ctr[1]) * u[1] - rho) < 40); if (I.length >= 8) res.push({ u, rho, I }); } return res; };
    const refine = L => { let I = L.I, u = L.u, rho = L.rho; for (let it = 0; it < 3; it++) { let mx = 0, my = 0; I.forEach(p => { mx += p[0]; my += p[1]; }); mx /= I.length; my /= I.length; let xx = 0, yy = 0, xy = 0; I.forEach(p => { xx += (p[0] - mx) ** 2; yy += (p[1] - my) ** 2; xy += (p[0] - mx) * (p[1] - my); }); const a = 0.5 * Math.atan2(2 * xy, xx - yy), e = [Math.cos(a), Math.sin(a)]; let nu = [-e[1], e[0]]; if (nu[0] * u[0] + nu[1] * u[1] < 0) nu = [-nu[0], -nu[1]]; u = nu; rho = (mx - ctr[0]) * u[0] + (my - ctr[1]) * u[1]; const J = B.filter(b => Math.abs((b[0] - ctr[0]) * u[0] + (b[1] - ctr[1]) * u[1] - rho) < 25); if (J.length >= 6) I = J; } return { u, rho: rho - 60, I }; };
    const front = lines(look, Math.cos(40 * Math.PI / 180)).filter(c => c.u[0] * look[0] + c.u[1] * look[1] > 0 && c.rho > 280); if (!front.length) return { err: 'Keine Wandlinie gefunden', K, n: views.length };
    const mx = Math.max(...front.map(c => c.I.length)), strong = front.filter(c => c.I.length >= Math.max(14, mx * 0.4)), far = Math.max(...strong.map(c => c.rho)), W0 = refine(strong.filter(c => c.rho >= far - 60).sort((a, b) => b.I.length - a.I.length)[0]), wu = W0.u, wr = W0.rho, we = [-wu[1], wu[0]], foot = [ctr[0] + wu[0] * wr, ctr[1] + wu[1] * wr];
    const meet = c => { const den = wu[0] * c.u[1] - wu[1] * c.u[0]; if (Math.abs(den) < 0.3) return null; const X = (wr * c.u[1] - c.rho * wu[1]) / den + ctr[0], Y = (wu[0] * c.rho - c.u[0] * wr) / den + ctr[1]; return { p: [X, Y], t: (X - foot[0]) * we[0] + (Y - foot[1]) * we[1] }; };
    const sideL = lines(we, Math.cos(40 * Math.PI / 180)), pick = sg => { const C = sideL.map(c => ({ c, m: meet(c) })).filter(q => q.m && sg * q.m.t > 1050 && q.c.I.length >= 10); if (!C.length) return null; const mv = Math.max(...C.map(q => q.c.I.length)), S2 = C.filter(q => q.c.I.length >= mv * 0.4), fr = Math.max(...S2.map(q => sg * q.m.t)), b = S2.filter(q => sg * q.m.t >= fr - 80).sort((a, x) => x.c.I.length - a.c.I.length)[0], rf = refine(b.c), m2 = meet(rf); return m2 ? { p: m2.p, t: m2.t, sup: b.c.I.length } : null; };
    const left = pick(-1), right = pick(1), along = W0.I.map(p => (p[0] - foot[0]) * we[0] + (p[1] - foot[1]) * we[1]).sort((a, b) => a - b), eL = left ? left.p : [foot[0] + we[0] * along[0], foot[1] + we[1] * along[0]], eR = right ? right.p : [foot[0] + we[0] * along[along.length - 1], foot[1] + we[1] * along[along.length - 1]];
    return { L: Math.hypot(eL[0] - eR[0], eL[1] - eR[1]), ok: true, wall: { u: wu, rho: wr, foot, e: we }, a: eL, b: eR, leftOk: !!left, rightOk: !!right, n: views.length, K, ctr, dist: wr, sup: W0.I.length }; }

  // ---------- Variante ohne Blätter: das Handy verfolgt seine Bewegung (WebXR), ein Referenzmaß gibt den Maßstab ----------
  // Abbildung Boden (Rasterkoordinaten in mm) → Bildpunkt, aus Kameralage M und Projektion P (beide 4×4 spaltenweise), Bodenhöhe und Ursprung (x0, z0)
  function poseHi(M, P, floorY, x0, z0, W, H, flipV) {
    const t = [M[12], M[13], M[14]], Vm = []; for (let r = 0; r < 3; r++) Vm.push([M[r * 4], M[r * 4 + 1], M[r * 4 + 2], -(M[r * 4] * t[0] + M[r * 4 + 1] * t[1] + M[r * 4 + 2] * t[2])]); Vm.push([0, 0, 0, 1]);
    const A = r => [0, 1, 2, 3].map(c => P[r] * Vm[0][c] + P[4 + r] * Vm[1][c] + P[8 + r] * Vm[2][c] + P[12 + r] * Vm[3][c]);
    const lin = a => [a[0] / 1000, a[2] / 1000, a[0] * (x0 - 1) + a[1] * floorY + a[2] * (z0 - 0.147) + a[3]], a0 = lin(A(0)), a1 = lin(A(1)), a3 = lin(A(3)), s = flipV ? 1 : -1;
    return [W / 2 * (a0[0] + a3[0]), W / 2 * (a0[1] + a3[1]), W / 2 * (a0[2] + a3[2]), H / 2 * (a3[0] + s * a1[0]), H / 2 * (a3[1] + s * a1[1]), H / 2 * (a3[2] + s * a1[2]), a3[0], a3[1], a3[2]];
  }
  function pyramid(g, W, H) { const L = [{ g, W, H }]; for (let i = 0; i < 4 && L[i].W > 60; i++) L.push(half(L[i].g, L[i].W, L[i].H)); return L; }
  function edgeOf(R, V) { const { n } = GRID, G = new Float32Array(n * n), vals = []; for (let j = 2; j < n - 2; j++) for (let i = 2; i < n - 2; i++) { const k = j * n + i; if (!V[k] || !V[k - 2] || !V[k + 2] || !V[k - 2 * n] || !V[k + 2 * n]) continue; const m = Math.hypot(R[k + 2] - R[k - 2], R[k + 2 * n] - R[k - 2 * n]); G[k] = m; if (m > 0 && !(k % 37)) vals.push(m); }
    vals.sort((a, b) => a - b); const T = Math.max(10, (vals[vals.length >> 1] || 0) * 2.5), E = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) if (G[k] >= T) E[k] = 1; return E; }
  // ein Bild auf den Boden umrechnen; nahe am Handy aus einer verkleinerten Bildstufe, damit feine Muster nicht flimmern
  function viewMapPose(pyr, Hi, fpx, cam) { const { cell, x0, y0, n } = GRID, R = new Float32Array(n * n), V = new Uint8Array(n * n), W = pyr[0].W, H = pyr[0].H, lim = c => Math.max(0, Math.min(n, c)), i0 = lim(Math.floor((cam[0] - 6600 - x0) / cell)), i1 = lim(Math.ceil((cam[0] + 6600 - x0) / cell)), j0 = lim(Math.floor((cam[1] - 6600 - y0) / cell)), j1 = lim(Math.ceil((cam[1] + 6600 - y0) / cell));
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) { const X = x0 + (i + .5) * cell, Y = y0 + (j + .5) * cell, w = Hi[6] * X + Hi[7] * Y + Hi[8]; if (w < 0.35 || w > 6.5) continue; const px = (Hi[0] * X + Hi[1] * Y + Hi[2]) / w, py = (Hi[3] * X + Hi[4] * Y + Hi[5]) / w; if (px < 2 || py < 2 || px > W - 2 || py > H - 2) continue; let lv = 0, fp = fpx * cell / 1000 / w; while (fp > 2 && lv < pyr.length - 1) { fp /= 2; lv++; } const q = pyr[lv], s = 1 << lv, v = bil(q.g, q.W, q.H, px / s, py / s); if (Number.isNaN(v)) continue; R[j * n + i] = v; V[j * n + i] = 1; }
    return { E: edgeOf(R, V), V, R }; }
  // Ähnlichkeit zweier auf den Boden umgerechneter Bilder (nur zur Gegenprobe der Bildrichtung)
  function nccViews(a, b) { let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; for (let k = 0; k < a.V.length; k += 3) if (a.V[k] && b.V[k]) { const x = a.R[k], y = b.R[k]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; } if (n < 1500) return null; const va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2; if (va < 4 || vb < 4) return 0; return (sab / n - sa * sb / n / n) / Math.sqrt(va * vb); }
  function accNew() { const { n } = GRID; return { S: new Uint16Array(n * n), Se: new Uint16Array(n * n), n: 0 }; }
  function accAdd(acc, v) { const { n } = GRID, E = v.E; for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i; if (v.V[k]) acc.Se[k]++; if (E[k] || E[k - 1] || E[k + 1] || E[k - n] || E[k + n]) acc.S[k]++; } acc.n++; }
  function accSupport(acc, frac = 0.4) { const { n } = GRID, K = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) if (acc.S[k] >= 2 && acc.S[k] >= frac * acc.Se[k]) K[k] = 1; return K; }
  const accScore = acc => { let c = 0; const K = accSupport(acc); for (let k = 0; k < K.length; k++) c += K[k]; return c; };
  const accSharp = acc => { let s = 0, e = 0; for (let k = 0; k < acc.S.length; k++) if (acc.Se[k] >= 3 && acc.S[k] >= 2) { s += acc.S[k] * acc.S[k] / acc.Se[k]; e += acc.S[k]; } return e ? s / e : 0; };
  function floorLevel(ys) { if (!ys || ys.length < 8) return null; const h = new Map(); ys.forEach(y => { const k = Math.round(y / 0.02); h.set(k, (h.get(k) || 0) + 1); }); const ks = [...h.keys()].sort((a, b) => a - b), need = Math.max(5, ys.length * 0.12); for (const k of ks) { if ((h.get(k - 1) || 0) + (h.get(k) || 0) + (h.get(k + 1) || 0) < need) continue; const sel = ys.filter(y => y > k * 0.02 - 0.04 && y < k * 0.02 + 0.06); return sel.reduce((s, y) => s + y, 0) / sel.length; } return null; }
  // Bodenumriss: von der Mitte aus in alle Richtungen bis zum Ende der zusammenhängenden Bodenfläche; dazu ein Rechteck aus den vier fernsten geraden Kanten
  function floorFromAcc(acc, ctr, opt = {}) { const { cell, x0, y0, n } = GRID, bias = opt.bias === undefined ? 60 : opt.bias, K0 = accSupport(acc, opt.frac || 0.55), morph = (src, erode) => { const o = new Uint8Array(n * n); for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i, v = erode ? src[k] && src[k - 1] && src[k + 1] && src[k - n] && src[k + n] : src[k] || src[k - 1] || src[k + 1] || src[k - n] || src[k + n]; o[k] = v ? 1 : 0; } return o; }, rep = (q, e, r) => { for (let t = 0; t < r; t++) q = morph(q, e); return q; }, count = a => { let c = 0; for (let k = 0; k < a.length; k++) c += a[k]; return c; };
    let K = rep(rep(K0, true, 3), false, 3); if (count(K) < 0.2 * count(K0)) K = rep(rep(K0, true, 1), false, 1); { const cl = opt.close === undefined ? 4 : opt.close; K = rep(rep(K, false, cl), true, cl); }
    const at = (x, y) => { const i = Math.floor((x - x0) / cell), j = Math.floor((y - y0) / cell); return i >= 0 && j >= 0 && i < n && j < n ? K[j * n + i] : -1; }, NA = 720, r = new Float64Array(NA).fill(NaN);
    for (let a = 0; a < NA; a++) { const th = a * 2 * Math.PI / NA, d = [Math.cos(th), Math.sin(th)], runs = []; let s0 = -1, last = -1; for (let q = 0; q < 6500; q += cell) { const v = at(ctr[0] + d[0] * q, ctr[1] + d[1] * q); if (v < 0) break; if (v) { if (s0 < 0) s0 = q; else if (q - last > (opt.gap || 240)) { runs.push([s0, last]); s0 = q; } last = q; } } if (s0 >= 0) runs.push([s0, last]); if (!runs.length) continue; const big = runs.slice().sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))[0]; r[a] = big[1] - big[0] >= 600 ? big[1] : runs[runs.length - 1][1]; }
    let have = 0; for (let a = 0; a < NA; a++) if (!Number.isNaN(r[a])) have++; if (have < NA * 0.6) return { err: 'Zu wenig Boden erkannt', K, cover: have / NA };
    for (let a = 0; a < NA; a++) if (Number.isNaN(r[a])) { let p = 1; while (Number.isNaN(r[(a + p) % NA]) && Number.isNaN(r[(a - p + NA) % NA])) p++; const u = r[(a + p) % NA], v = r[(a - p + NA) % NA]; r[a] = Number.isNaN(u) ? v : Number.isNaN(v) ? u : (u + v) / 2; }
    const rm = new Float64Array(NA); for (let a = 0; a < NA; a++) { const w = []; for (let k = -6; k <= 6; k++) w.push(r[(a + k + NA) % NA]); w.sort((p, q) => p - q); rm[a] = w[6]; }
    const pts = [], raw = []; let area = 0; for (let a = 0; a < NA; a++) { const th = a * 2 * Math.PI / NA, q = Math.max(0, rm[a] - bias); pts.push([ctr[0] + Math.cos(th) * q, ctr[1] + Math.sin(th) * q]); raw.push([Math.cos(th) * rm[a], Math.sin(th) * rm[a]]); } for (let a = 0; a < NA; a++) { const p = pts[a], q = pts[(a + 1) % NA]; area += (p[0] - ctr[0]) * (q[1] - ctr[1]) - (q[0] - ctr[0]) * (p[1] - ctr[1]); } area = Math.abs(area) / 2;
    // Rechteck: Richtung mit den deutlichsten vier Kanten, je Seite die fernste deutliche
    const side = vals => { const h = new Map(); for (const v of vals) if (v > 300) { const k = Math.round(v / 40); h.set(k, (h.get(k) || 0) + 1); } let mx = 0; const g3 = k => (h.get(k - 1) || 0) + (h.get(k) || 0) + (h.get(k + 1) || 0); for (const k of h.keys()) mx = Math.max(mx, g3(k)); if (!mx) return null; let far = -1; for (const k of h.keys()) if (g3(k) >= 0.4 * mx && k > far) far = k; const sel = vals.filter(v => Math.abs(v - far * 40) <= 60); return { mx, d: sel.reduce((s, v) => s + v, 0) / sel.length }; };
    let best = null; for (let deg = 0; deg < 90; deg++) { const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180), pu = raw.map(p => p[0] * c + p[1] * s), pv = raw.map(p => -p[0] * s + p[1] * c), S4 = [side(pu), side(pu.map(v => -v)), side(pv), side(pv.map(v => -v))]; if (S4.some(q => !q)) continue; const sc = S4.reduce((q, w) => q + w.mx, 0); if (!best || sc > best.sc) best = { sc, c, s, S4, deg }; }
    let rect = null; if (best) { const [up, um, vp, vm] = best.S4.map(q => Math.max(0, q.d - bias)), { c, s } = best, P = (u, v) => [ctr[0] + u * c - v * s, ctr[1] + u * s + v * c]; rect = { L: Math.max(up + um, vp + vm), B: Math.min(up + um, vp + vm), area: (up + um) * (vp + vm), corners: [P(-um, -vm), P(up, -vm), P(up, vp), P(-um, vp)], ang: best.deg }; }
    return { ok: true, area, outline: pts, rect, K, ctr, cover: have / NA, n: acc.n }; }

  // ---------- Raum aus den Wänden ----------
  function roomRect(w) { const a = w[0], b = w[1], c = w[2], d = w[3], breite = c ? (a + c) / 2 : a, tiefe = d ? (b + d) / 2 : b, diff = [c ? Math.abs(a - c) : null, d ? Math.abs(b - d) : null]; return { poly: [[0, 0], [breite, 0], [breite, tiefe], [0, tiefe]], area: breite * tiefe / 1e6, breite, tiefe, diff }; }
  function roomOrtho(walls) { // Wände im Uhrzeigersinn mit Abbiegung rechts/links, rechtwinklig; Schlussfehler wird verteilt
    let dir = 0, x = 0, y = 0; const P = [[0, 0]], D = [[1, 0], [0, 1], [-1, 0], [0, -1]]; for (const q of walls) { x += D[dir][0] * q.L; y += D[dir][1] * q.L; P.push([x, y]); dir = (dir + (q.turn === 'L' ? 3 : 1)) % 4; }
    const dx = P[P.length - 1][0], dy = P[P.length - 1][1], gap = Math.hypot(dx, dy); let sumAbs = walls.reduce((s, q) => s + q.L, 0); dir = 0; x = 0; y = 0; const Q = [[0, 0]]; for (const q of walls) { const u = D[dir], f = q.L / sumAbs; x += u[0] * q.L - dx * f; y += u[1] * q.L - dy * f; Q.push([x, y]); dir = (dir + (q.turn === 'L' ? 3 : 1)) % 4; } Q.pop(); return { poly: Q, gap, area: polyArea(Q) / 1e6 };
  }
  // ---------- Lerntraining: Korrektur aus nachgemessenen Maßen ----------
  // S = [{raw, real}] in mm. Ergebnis: real ≈ a·raw + b. Unter 2 Rückmeldungen bleibt die Korrektur aus.
  // Bis 5 Rückmeldungen nur ein fester Versatz b (Median), danach bei genug Längenunterschied auch ein Faktor a.
  const learnUsable = s => s && s.raw > 0 && s.real > 0 && Math.abs(s.real - s.raw) < 0.25 * s.raw + 300;
  function learnFit(S) {
    const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
    S = (S || []).filter(learnUsable); const n = S.length; if (n < 2) return { n, a: 1, b: 0, on: false, mad: null };
    let a = 1; const raws = S.map(s => s.raw), spread = Math.max(...raws) - Math.min(...raws);
    if (n >= 6 && spread >= 1500) { const sl = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(S[j].raw - S[i].raw) >= 500) sl.push((S[j].real - S[i].real) / (S[j].raw - S[i].raw)); if (sl.length >= 5) a = Math.min(1.08, Math.max(0.92, med(sl))); }
    const b = med(S.map(s => s.real - a * s.raw));
    return { n, a: +a.toFixed(4), b: Math.round(b), on: true, mad: Math.round(med(S.map(s => Math.abs(s.real - (a * s.raw + b))))) }; }
  const learnApply = (fit, raw) => fit && fit.on ? fit.a * raw + fit.b : raw;
  return { learnFit, learnApply, learnUsable, nccViews, accSharp, poseHi, pyramid, viewMapPose, accNew, accAdd, accSupport, accScore, floorLevel, floorFromAcc, GRID, viewMap, wallFromViews, locateBest, cornerSnap, pinSigma, roomFromPins, offsetPoly, inside, MS, CENTERS, DICT, END, layoutCorners, grayFrom, half, bil, findQuads, locate, toFloor, toImage, floorDist, sigmaOf, wallCheck, snapBase, suggestCorners, roomRect, roomOrtho, polyArea };
})();
if (typeof module !== 'undefined') module.exports = RP;
