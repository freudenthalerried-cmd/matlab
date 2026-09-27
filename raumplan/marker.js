'use strict';
/* Zielmarken: Erzeugung (Druck), Erkennung und subpixelgenaue Eckbestimmung. DOM-frei.
   Marke = 6x6 Zellen: schwarzer Rand + 4x4 Bitcode, weiße Ruhezone. Ecken = Außenecken des schwarzen Quadrats,
   bestimmt als Schnitt von 4 subpixelgenau gefitteten Kantenlinien. */
const MK = (() => {
  /* ---------- Wörterbuch: 5x5 Bits, 100 Codes, Hamming-Abstand ≥ 6 (auch über Drehungen), erzeugt mit sim/ (fest eingebettet) ---------- */
  const N = 5, G = N + 2; // Zellen je Seite inkl. Rand
  const rot = c => { let n = 0; for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (c >>> (r * N + k) & 1) n |= 1 << (k * N + (N - 1 - r)); return n >>> 0; }; // 90° im Uhrzeigersinn
  const ham = (a, b) => { let x = (a ^ b) >>> 0, n = 0; while (x) { n += x & 1; x >>>= 1; } return n; };
  const DICT = [32846848, 26801152, 20804416, 29849856, 26534656, 28977920, 19837696, 14456320, 23162368, 11832896, 20831488, 15671040, 10049280, 1539840, 18001728, 21605312, 12169728, 15660032, 32245568, 31476792, 2614784, 12304640, 24536192, 15149632, 31413824, 26369848, 5349120, 7634240, 32717624, 22530560, 29661760, 6901625, 16702776, 27897088, 27342720, 14019840, 31635456, 7198848, 30435904, 28126009, 32133632, 13401657, 2007160, 10435200, 19762816, 7214648, 12196928, 26115904, 22624512, 26647552, 14396928, 33226304, 21224760, 6505272, 19043961, 19066424, 9788480, 31560784, 4437568, 22953472, 11415864, 21938496, 14231416, 7972672, 24236352, 13982592, 25805632, 27238400, 25659136, 16321472, 3729728, 33460288, 29296440, 4975936, 24165433, 10242872, 6454016, 29322304, 30631680, 7562424, 10931897, 30187576, 31826936, 5274553, 15776576, 21804096, 3628153, 10187968, 7022208, 17554976, 14211328, 11190328, 9693496, 10871744, 8358208, 23179576, 20981368, 5519416, 9811776, 10780160];
  function decodeBits(c) { // -> {id, rot} oder null
    let best = null;
    DICT.forEach((d, id) => { let x = c; for (let k = 0; k < 4; k++) { const h = ham(x, d); if (h <= 2 && (!best || h < best.h)) best = { id, rot: k, h }; x = rot(x); } });
    return best;
  }

  /* ---------- Druckvorlage (SVG, Einheiten mm) ---------- */
  function markerSVG(id, size = 160, label = '') {
    const c = DICT[id], cell = size / G, W = 210, H = 297, x0 = (W - size) / 2, y0 = 40;
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}" font-family="Arial"><rect width="${W}" height="${H}" fill="#fff"/>`;
    o += `<rect x="${x0}" y="${y0}" width="${size}" height="${size}" fill="#000"/>`;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (!(c >>> (r * N + k) & 1)) o += `<rect x="${x0 + (k + 1) * cell}" y="${y0 + (r + 1) * cell}" width="${cell + 0.02}" height="${cell + 0.02}" fill="#fff"/>`;
    const cx = W / 2, cy = y0 + size / 2;
    o += `<line x1="${cx}" y1="${y0 - 25}" x2="${cx}" y2="${y0 - 3}" stroke="#000" stroke-width=".3"/><line x1="${cx}" y1="${y0 + size + 3}" x2="${cx}" y2="${y0 + size + 25}" stroke="#000" stroke-width=".3"/>`;
    o += `<line x1="${x0 - 25}" y1="${cy}" x2="${x0 - 3}" y2="${cy}" stroke="#000" stroke-width=".3"/><line x1="${x0 + size + 3}" y1="${cy}" x2="${x0 + size + 25}" y2="${cy}" stroke="#000" stroke-width=".3"/>`;
    o += `<text x="${W / 2}" y="22" font-size="9" text-anchor="middle" font-weight="bold">Marke ${id}${label ? ' – ' + label : ''}</text>`;
    o += `<text x="${W / 2}" y="${y0 + size + 38}" font-size="4" text-anchor="middle">Glatt und vollflächig aufkleben (nicht wellig). Nicht verdecken. Mattes Papier, Druck 100 %.</text>`;
    o += `<text x="${W / 2}" y="${y0 + size + 45}" font-size="4" text-anchor="middle">Die Striche zeigen die Markenmitte (zum Ausrichten auf die Maßband-Marke).</text></svg>`;
    return o;
  }

  /* ---------- Bildverarbeitung ---------- */
  function downscale(g, W, H, f) { // Flächenmittel, f ganzzahlig
    if (f <= 1) return { g, W, H };
    const w = Math.floor(W / f), h = Math.floor(H / f), o = new Float32Array(w * h), n = f * f;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = 0; j < f; j++) { const row = (y * f + j) * W + x * f; for (let i = 0; i < f; i++) s += g[row + i]; } o[y * w + x] = s / n; }
    return { g: o, W: w, H: h };
  }
  function bil(g, W, H, x, y) {
    x -= 0.5; y -= 0.5; // Pixelmitten-Konvention: Pixel i deckt [i, i+1)
    const x0 = Math.floor(x), y0 = Math.floor(y); if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) return NaN;
    const fx = x - x0, fy = y - y0, i = y0 * W + x0;
    return g[i] * (1 - fx) * (1 - fy) + g[i + 1] * fx * (1 - fy) + g[i + W] * (1 - fx) * fy + g[i + W + 1] * fx * fy;
  }
  function homog(src, dst) { // 4 Punkte, h33=1
    const A = [], b = [];
    src.forEach(([x, y], i) => { const [X, Y] = dst[i]; A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X); A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y); });
    const n = 8, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) { let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[m][c])) m = r; if (Math.abs(M[m][c]) < 1e-12) return null; [M[c], M[m]] = [M[m], M[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
    const h = M.map((r, i) => r[n] / r[i]);
    return (x, y) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
  }

  /* Erkennung. gray: Float32Array/Uint8 (W*H). opt.maxW: Arbeitsbreite. Rückgabe [{id, c:[[x,y]*4], sharp}] in Vollbild-Pixeln */
  function detect(gray, W, H, opt = {}) {
    const f = Math.max(1, Math.round(W / (opt.maxW || 1600))), D = downscale(gray, W, H, f), g = D.g, w = D.W, h = D.H;
    // adaptive Schwelle (Integralbild)
    const I = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += g[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s; } }
    const R = Math.max(7, Math.round(w / 50)), bin = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1), n = (y1 - y0) * (x1 - x0);
        const m = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / n;
        bin[y * w + x] = g[y * w + x] < m - 6 ? 1 : 0;
      }
    }
    // Zusammenhangskomponenten (dunkel), je Zeile linke/rechte Grenze für die Hülle
    const lab = new Int32Array(w * h), stack = new Int32Array(w * h), out = [];
    let nl = 0;
    for (let s0 = 0; s0 < w * h; s0++) {
      if (!bin[s0] || lab[s0]) continue;
      nl++; let sp = 0, cnt = 0, bx0 = w, bx1 = 0, by0 = h, by1 = 0; stack[sp++] = s0; lab[s0] = nl;
      const rows = new Map();
      while (sp) {
        const p = stack[--sp], x = p % w, y = (p - x) / w; cnt++;
        if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
        const r = rows.get(y); if (!r) rows.set(y, [x, x]); else { if (x < r[0]) r[0] = x; if (x > r[1]) r[1] = x; }
        if (x > 0 && bin[p - 1] && !lab[p - 1]) { lab[p - 1] = nl; stack[sp++] = p - 1; }
        if (x < w - 1 && bin[p + 1] && !lab[p + 1]) { lab[p + 1] = nl; stack[sp++] = p + 1; }
        if (y > 0 && bin[p - w] && !lab[p - w]) { lab[p - w] = nl; stack[sp++] = p - w; }
        if (y < h - 1 && bin[p + w] && !lab[p + w]) { lab[p + w] = nl; stack[sp++] = p + w; }
      }
      const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
      if (bw < 14 || bh < 14 || bw > w / 2 || bh > h / 1.2 || bw / bh > 6 || bh / bw > 6 || cnt < 0.2 * bw * bh) continue;
      if (bx0 < 2 || by0 < 2 || bx1 > w - 3 || by1 > h - 3) continue; // am Bildrand angeschnitten
      const pts = []; rows.forEach((r, y) => { pts.push([r[0], y + 0.5], [r[1] + 1, y + 0.5]); });
      const q = quadOf(pts); if (!q) continue;
      const dec = decode(g, w, h, q); if (!dec) continue;
      // Ecken in Vollbild-Koordinaten, Reihenfolge nach Markenorientierung
      let C = q.map(p => [p[0] * f, p[1] * f]); for (let k = 0; k < dec.rot; k++) C = [C[3], C[0], C[1], C[2]];
      const ref = refine(gray, W, H, C, f);
      if (ref) out.push({ id: dec.id, c: ref.c, sharp: ref.sharp, res: ref.res });
    }
    // Doppelte IDs (Fehldetektion) -> beide verwerfen
    const cnt = {}; out.forEach(m => cnt[m.id] = (cnt[m.id] || 0) + 1);
    return out.filter(m => cnt[m.id] === 1);
  }
  function hull(P) {
    P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  const area = Q => { let a = 0; Q.forEach((p, i) => { const q = Q[(i + 1) % Q.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a / 2; };
  function quadOf(pts) {
    const Hh = hull(pts); if (Hh.length < 4) return null;
    let bi = 0, bj = 0, bd = 0;
    for (let i = 0; i < Hh.length; i++) for (let j = i + 1; j < Hh.length; j++) { const d = (Hh[i][0] - Hh[j][0]) ** 2 + (Hh[i][1] - Hh[j][1]) ** 2; if (d > bd) { bd = d; bi = i; bj = j; } }
    const p = Hh[bi], q = Hh[bj], side = r => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    let r1 = null, r2 = null, s1 = 0, s2 = 0;
    for (const r of Hh) { const s = side(r); if (s > s1) { s1 = s; r1 = r; } if (s < s2) { s2 = s; r2 = r; } }
    if (!r1 || !r2) return null;
    let Q = [p, r1, q, r2]; if (area(Q) < 0) Q = [p, r2, q, r1]; // im Bild (y nach unten) im Uhrzeigersinn
    const ah = Math.abs(area(Hh)), aq = Math.abs(area(Q));
    if (aq < 0.88 * ah || aq < 150) return null;
    const L = Q.map((a, i) => Math.hypot(Q[(i + 1) % 4][0] - a[0], Q[(i + 1) % 4][1] - a[1]));
    if (Math.min(...L) < 10 || Math.max(...L) / Math.min(...L) > 5) return null;
    return Q;
  }
  function decode(g, w, h, Q) {
    const Hm = homog([[0, 0], [G, 0], [G, G], [0, G]], Q); if (!Hm) return null;
    const v = [];
    for (let r = 0; r < G; r++) for (let k = 0; k < G; k++) {
      let s = 0, n = 0;
      for (const dy of [-.2, 0, .2]) for (const dx of [-.2, 0, .2]) { const [x, y] = Hm(k + .5 + dx, r + .5 + dy), val = bil(g, w, h, x, y); if (!isNaN(val)) { s += val; n++; } }
      if (n < 5) return null; v.push(s / n);
    }
    const mn = Math.min(...v), mx = Math.max(...v); if (mx - mn < 25) return null;
    const t = (mn + mx) / 2; let bad = 0, code = 0;
    for (let r = 0; r < G; r++) for (let k = 0; k < G; k++) {
      const dark = v[r * G + k] < t;
      if (r === 0 || r === G - 1 || k === 0 || k === G - 1) { if (!dark) bad++; }
      else if (dark) code |= 1 << ((r - 1) * N + (k - 1));
    }
    code >>>= 0;
    if (bad > 2) return null;
    // Außen muss hell sein (Ruhezone)
    let outs = 0, on = 0; for (const [x, y] of [[-.5, G / 2], [G + .5, G / 2], [G / 2, -.5], [G / 2, G + .5]]) { const p = Hm(x, y), val = bil(g, w, h, p[0], p[1]); if (!isNaN(val)) { on++; if (val > t) outs++; } }
    if (on && outs < on - 1) return null;
    return decodeBits(code);
  }
  /* Kanten subpixelgenau: entlang jeder Seite Gradientenmaximum in Normalenrichtung, Linienfit, Ecken = Schnittpunkte */
  function refine(g, W, H, C, f) {
    const lines = [], sharp = [], resAll = [];
    for (let i = 0; i < 4; i++) {
      const a = C[i], b = C[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [d[1], -d[0]]; // außen
      const N = Math.max(8, Math.min(80, Math.round(L / 4))), P = [], rng = 1.5 * f + 2;
      for (let s = 0; s < N; s++) {
        const t = 0.12 + 0.76 * s / (N - 1), p = [a[0] + d[0] * L * t, a[1] + d[1] * L * t];
        const st = 0.25, prof = [];
        for (let u = -rng - st; u <= rng + st + 1e-9; u += st) prof.push(bil(g, W, H, p[0] + n[0] * u, p[1] + n[1] * u));
        if (prof.some(isNaN)) continue;
        let bk = -1, bv = 0;
        for (let k = 1; k < prof.length - 1; k++) { const gr = (prof[k + 1] - prof[k - 1]) / (2 * st); if (gr > bv) { bv = gr; bk = k; } } // dunkel innen -> hell außen
        if (bk < 2 || bk > prof.length - 3) continue;
        const g0 = prof[bk] - prof[bk - 2], g1 = prof[bk + 1] - prof[bk - 1], g2 = prof[bk + 2] - prof[bk];
        const den = g0 - 2 * g1 + g2, off = den < 0 ? 0.5 * (g0 - g2) / den : 0;
        const u = -rng - st + (bk + Math.max(-.5, Math.min(.5, off))) * st;
        P.push([p[0] + n[0] * u, p[1] + n[1] * u]); sharp.push(bv / Math.max(1, prof[prof.length - 1] - prof[0]));
      }
      if (P.length < 6) return null;
      let ln = fitLine(P); // robust: Ausreißer weg, neu fitten
      const r = P.map(p => Math.abs((p[0] - ln.m[0]) * ln.n[0] + (p[1] - ln.m[1]) * ln.n[1])), med = r.slice().sort((x, y) => x - y)[r.length >> 1];
      const P2 = P.filter((_, k) => r[k] <= Math.max(3 * 1.4826 * med, 0.15)); if (P2.length >= 6) ln = fitLine(P2);
      lines.push(ln); resAll.push(ln.rms);
    }
    const c = [];
    for (let i = 0; i < 4; i++) {
      const A = lines[(i + 3) % 4], B = lines[i], det = A.n[0] * B.n[1] - A.n[1] * B.n[0]; if (Math.abs(det) < 1e-6) return null;
      const ca = A.n[0] * A.m[0] + A.n[1] * A.m[1], cb = B.n[0] * B.m[0] + B.n[1] * B.m[1];
      c.push([(ca * B.n[1] - A.n[1] * cb) / det, (A.n[0] * cb - ca * B.n[0]) / det]);
    }
    if (c.some((p, i) => Math.hypot(p[0] - C[i][0], p[1] - C[i][1]) > 3 * f + 3)) return null;
    return { c, sharp: sharp.reduce((s, v) => s + v, 0) / sharp.length, res: Math.max(...resAll) };
  }
  function fitLine(P) {
    const m = [0, 1].map(k => P.reduce((s, p) => s + p[k], 0) / P.length); let sxx = 0, sxy = 0, syy = 0;
    P.forEach(p => { const a = p[0] - m[0], b = p[1] - m[1]; sxx += a * a; sxy += a * b; syy += b * b; });
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), d = [Math.cos(th), Math.sin(th)], n = [-d[1], d[0]];
    const rms = Math.sqrt(P.reduce((s, p) => s + ((p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1]) ** 2, 0) / P.length);
    return { m, n, rms };
  }
  return { DICT, N, G, detect, markerSVG, decodeBits, rot, bil, homog };
})();
if (typeof module !== 'undefined') module.exports = MK;
