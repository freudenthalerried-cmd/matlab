'use strict';
/* Bündelausgleich (Photogrammetrie) für Zielmarken aus Handyvideo.
   Unbekannte: Innere Orientierung [f, cx, cy, k1, k2], je Bild Pose [rx,ry,rz,tx,ty,tz], je Markenecke X[3].
   Levenberg-Marquardt mit Schur-Komplement (Bilder werden eliminiert -> kleines System über Punkte + Kamera).
   Zusatzbedingungen (Maßstab, Lagerung) als gewichtete Pseudo-Beobachtungen der Punkte. DOM-frei. */
const BA = (() => {
  function rodr(r) {
    const th = Math.hypot(r[0], r[1], r[2]);
    if (th < 1e-12) return [1, -r[2], r[1], r[2], 1, -r[0], -r[1], r[0], 1];
    const kx = r[0] / th, ky = r[1] / th, kz = r[2] / th, c = Math.cos(th), s = Math.sin(th), v = 1 - c;
    return [c + kx * kx * v, kx * ky * v - kz * s, kx * kz * v + ky * s,
      ky * kx * v + kz * s, c + ky * ky * v, ky * kz * v - kx * s,
      kz * kx * v - ky * s, kz * ky * v + kx * s, c + kz * kz * v];
  }
  function rotvec(R) { // Matrix -> Rotationsvektor über Quaternion (Shepperd, stabil auch nahe 180°)
    const t = R[0] + R[4] + R[8]; let w, x, y, z;
    if (t > Math.max(R[0], R[4], R[8])) { const r = Math.sqrt(1 + t) * 2; w = r / 4; x = (R[7] - R[5]) / r; y = (R[2] - R[6]) / r; z = (R[3] - R[1]) / r; }
    else if (R[0] >= R[4] && R[0] >= R[8]) { const r = Math.sqrt(1 + R[0] - R[4] - R[8]) * 2; w = (R[7] - R[5]) / r; x = r / 4; y = (R[1] + R[3]) / r; z = (R[2] + R[6]) / r; }
    else if (R[4] >= R[8]) { const r = Math.sqrt(1 + R[4] - R[0] - R[8]) * 2; w = (R[2] - R[6]) / r; x = (R[1] + R[3]) / r; y = r / 4; z = (R[5] + R[7]) / r; }
    else { const r = Math.sqrt(1 + R[8] - R[0] - R[4]) * 2; w = (R[3] - R[1]) / r; x = (R[2] + R[6]) / r; y = (R[5] + R[7]) / r; z = r / 4; }
    if (w < 0) { w = -w; x = -x; y = -y; z = -z; }
    const sn = Math.hypot(x, y, z); if (sn < 1e-12) return [2 * x, 2 * y, 2 * z];
    const th = 2 * Math.atan2(sn, w); return [x / sn * th, y / sn * th, z / sn * th];
  }
  function project(it, c, X) {
    const R = rodr(c), p0 = R[0] * X[0] + R[1] * X[1] + R[2] * X[2] + c[3], p1 = R[3] * X[0] + R[4] * X[1] + R[5] * X[2] + c[4], p2 = R[6] * X[0] + R[7] * X[1] + R[8] * X[2] + c[5];
    const x = p0 / p2, y = p1 / p2, r2 = x * x + y * y, d = 1 + it[3] * r2 + it[4] * r2 * r2;
    return [it[0] * x * d + it[1], it[0] * y * d + it[2], p2];
  }
  // numerische Block-Ableitungen (zentral)
  const HI = [0.05, 0.05, 0.05, 1e-5, 1e-5], HC = [1e-6, 1e-6, 1e-6, 1e-6, 1e-6, 1e-6], HX = 1e-6;
  function jac(it, c, X) {
    const Ji = [], Jc = [], Jx = [];
    for (let k = 0; k < 5; k++) { const a = it.slice(), b = it.slice(); a[k] += HI[k]; b[k] -= HI[k]; const p = project(a, c, X), q = project(b, c, X); Ji.push([(p[0] - q[0]) / (2 * HI[k]), (p[1] - q[1]) / (2 * HI[k])]); }
    for (let k = 0; k < 6; k++) { const a = c.slice(), b = c.slice(); a[k] += HC[k]; b[k] -= HC[k]; const p = project(it, a, X), q = project(it, b, X); Jc.push([(p[0] - q[0]) / (2 * HC[k]), (p[1] - q[1]) / (2 * HC[k])]); }
    for (let k = 0; k < 3; k++) { const a = X.slice(), b = X.slice(); a[k] += HX; b[k] -= HX; const p = project(it, c, a), q = project(it, c, b); Jx.push([(p[0] - q[0]) / (2 * HX), (p[1] - q[1]) / (2 * HX)]); }
    return { Ji, Jc, Jx };
  }
  function cholSolve(A, n, b) { // A symmetrisch pos. def. (Float64Array n*n), löst A x = b; null bei Fehler
    const L = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = A[i * n + j]; for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
      if (i === j) { if (s <= 0) return null; L[i * n + i] = Math.sqrt(s); } else L[i * n + j] = s / L[j * n + j];
    }
    const solve = bb => { const y = new Float64Array(n); for (let i = 0; i < n; i++) { let s = bb[i]; for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k]; y[i] = s / L[i * n + i]; }
      const x = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k]; x[i] = s / L[i * n + i]; } return x; };
    return { x: b ? solve(b) : null, solve };
  }
  function inv6(M) { const r = cholSolve(M, 6); if (!r) return null; const I = []; for (let k = 0; k < 6; k++) { const e = new Float64Array(6); e[k] = 1; I.push(r.solve(e)); } return I; } // Spalten

  /* data: {it:[5], cams:[[6]], pts:[[3]], obs:[{c,p,u,v,s}], cons:[{f:(pts)=>wert, v, s, idx:[Punktindizes]}], fix:{it:[bool*5]} }
     Rückgabe: {it, cams, pts, rms (px), s0, covPt(j) -> 3x3, cov: Funktion für Linearkombinationen} */
  function solve(data, opt = {}) {
    let it = data.it.slice(), cams = data.cams.map(c => c.slice()), pts = data.pts.map(p => p.slice());
    const obs = data.obs, cons = data.cons || [], nc = cams.length, np = pts.length, ny = 5 + 3 * np;
    const fixIt = data.fixIt || [false, false, false, false, false], huber = opt.huber ?? 3;
    const log = opt.log || (() => { });
    const byCam = Array.from({ length: nc }, () => []); obs.forEach((o, k) => byCam[o.c].push(k));
    const seen = new Uint8Array(np); obs.forEach(o => seen[o.p] = 1); // nie gesehene Punkte bleiben fest
    function cost(it_, cams_, pts_) {
      let s = 0;
      for (const o of obs) { const p = project(it_, cams_[o.c], pts_[o.p]); const e = Math.hypot(p[0] - o.u, p[1] - o.v) / o.s; s += e <= huber ? e * e : 2 * huber * e - huber * huber; if (p[2] <= 0) s += 1e6; }
      for (const q of cons) { const e = (q.f(pts_) - q.v) / q.s; s += e * e; }
      return s;
    }
    let lam = opt.lambda ?? 1e-3, cur = cost(it, cams, pts), S = null, last = null;
    const iters = opt.iters ?? 50;
    for (let iter = 0; iter < iters; iter++) {
      // Normalgleichungen aufbauen
      S = new Float64Array(ny * ny); const gy = new Float64Array(ny);
      const Hcc = [], gc = [], Hcy = [], loc = [];
      for (let i = 0; i < nc; i++) {
        const H = new Float64Array(36), g = new Float64Array(6), map = new Map([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]), cols = [0, 1, 2, 3, 4];
        byCam[i].forEach(k => { const j = obs[k].p; if (!map.has(5 + 3 * j)) for (let q = 0; q < 3; q++) { map.set(5 + 3 * j + q, cols.length); cols.push(5 + 3 * j + q); } });
        const Y = new Float64Array(6 * cols.length);
        for (const k of byCam[i]) {
          const o = obs[k], j = o.p, c = cams[i], X = pts[j], p = project(it, c, X), r = [p[0] - o.u, p[1] - o.v];
          const e = Math.hypot(r[0], r[1]) / o.s, w = (e <= huber ? 1 : huber / e) / (o.s * o.s);
          const { Ji, Jc, Jx } = jac(it, c, X);
          if (fixIt.some(Boolean)) fixIt.forEach((f, q) => { if (f) Ji[q] = [0, 0]; });
          const dot = (a, b) => (a[0] * b[0] + a[1] * b[1]) * w, dr = a => (a[0] * r[0] + a[1] * r[1]) * w;
          for (let a = 0; a < 6; a++) { g[a] += dr(Jc[a]); for (let b = 0; b < 6; b++) H[a * 6 + b] += dot(Jc[a], Jc[b]); }
          const yi = [0, 1, 2, 3, 4], yx = [5 + 3 * j, 6 + 3 * j, 7 + 3 * j], Jy = Ji.concat(Jx), yidx = yi.concat(yx);
          for (let a = 0; a < 6; a++) for (let q = 0; q < 8; q++) Y[a * cols.length + map.get(yidx[q])] += dot(Jc[a], Jy[q]);
          for (let q = 0; q < 8; q++) { gy[yidx[q]] += dr(Jy[q]); for (let s2 = 0; s2 < 8; s2++) S[yidx[q] * ny + yidx[s2]] += dot(Jy[q], Jy[s2]); }
        }
        Hcc.push(H); gc.push(g); Hcy.push(Y); loc.push(cols);
      }
      // Zusatzbedingungen
      for (const q of cons) {
        const v0 = q.f(pts), r = v0 - q.v, w = 1 / (q.s * q.s), grad = [];
        for (const j of q.idx) for (let k = 0; k < 3; k++) { const a = pts.map(p => p.slice()), b = pts.map(p => p.slice()); a[j][k] += 1e-6; b[j][k] -= 1e-6; grad.push([5 + 3 * j + k, (q.f(a) - q.f(b)) / 2e-6]); }
        for (const [ia, ga] of grad) { gy[ia] += ga * r * w; for (const [ib, gb] of grad) S[ia * ny + ib] += ga * gb * w; }
      }
      for (let q = 0; q < 5; q++) if (fixIt[q]) S[q * ny + q] += 1e12;
      for (let j = 0; j < np; j++) if (!seen[j]) for (let k = 0; k < 3; k++) S[(5 + 3 * j + k) * ny + 5 + 3 * j + k] += 1e12;
      last = { Hcc, gc, Hcy, loc, gy: gy.slice(), S0: S.slice() };
      // LM-Schritt (mit Wiederholung bei Ablehnung)
      let accepted = false;
      for (let tries = 0; tries < 10 && !accepted; tries++) {
        const Sd = S.slice(), g2 = gy.slice(), Ainv = [];
        for (let a = 0; a < ny; a++) Sd[a * ny + a] *= 1 + lam;
        for (let i = 0; i < nc; i++) {
          const A = Hcc[i].slice(); for (let a = 0; a < 6; a++) A[a * 6 + a] = A[a * 6 + a] * (1 + lam) + 1e-12;
          const Ai = inv6(A); Ainv.push(Ai); if (!Ai) continue;
          const cols = loc[i], m = cols.length, Y = Hcy[i];
          // K = A^-1 Y (6 x m)
          const K = new Float64Array(6 * m);
          for (let a = 0; a < 6; a++) for (let q = 0; q < m; q++) { let s = 0; for (let b = 0; b < 6; b++) s += Ai[b][a] * Y[b * m + q]; K[a * m + q] = s; }
          for (let q = 0; q < m; q++) {
            const yq = cols[q]; let s = 0; for (let a = 0; a < 6; a++) s += Y[a * m + q] * (Ai[0][a] * gc[i][0] + Ai[1][a] * gc[i][1] + Ai[2][a] * gc[i][2] + Ai[3][a] * gc[i][3] + Ai[4][a] * gc[i][4] + Ai[5][a] * gc[i][5]);
            g2[yq] -= s;
            for (let t = 0; t < m; t++) { let z = 0; for (let a = 0; a < 6; a++) z += Y[a * m + q] * K[a * m + t]; Sd[yq * ny + cols[t]] -= z; }
          }
        }
        const sol = cholSolve(Sd, ny, g2.map(v => -v));
        if (!sol) { lam *= 10; continue; }
        const dy = sol.x;
        const it2 = it.map((v, q) => v + dy[q]), pts2 = pts.map((p, j) => [p[0] + dy[5 + 3 * j], p[1] + dy[6 + 3 * j], p[2] + dy[7 + 3 * j]]);
        const cams2 = cams.map((c, i) => {
          const Ai = Ainv[i]; if (!Ai) return c.slice();
          const cols = loc[i], m = cols.length, Y = Hcy[i], rhs = new Float64Array(6);
          for (let a = 0; a < 6; a++) { let s = -gc[i][a]; for (let q = 0; q < m; q++) s -= Y[a * m + q] * dy[cols[q]]; rhs[a] = s; }
          return c.map((v, a) => { let s = 0; for (let b = 0; b < 6; b++) s += Ai[a][b] * rhs[b]; return v + s; });
        });
        const nw = cost(it2, cams2, pts2);
        if (nw < cur) { const rel = (cur - nw) / cur; it = it2; cams = cams2; pts = pts2; cur = nw; lam = Math.max(lam / 3, 1e-9); accepted = true; log(iter, cur, lam); if (rel < 1e-10) iter = iters; }
        else lam *= 8;
      }
      if (!accepted) break;
    }
    // Kovarianz der Punkte (reduziertes System ohne Dämpfung)
    let covSolve = null, s0 = null;
    const nobs = obs.length * 2 + cons.length, npar = 6 * nc + ny;
    s0 = Math.sqrt(cur / Math.max(1, nobs - npar));
    {
      const { Hcc, gc, Hcy, loc, S0 } = last; const Sd = S0.slice();
      for (let i = 0; i < nc; i++) {
        const A = Hcc[i].slice(); for (let a = 0; a < 6; a++) A[a * 6 + a] += 1e-12; const Ai = inv6(A); if (!Ai) continue;
        const cols = loc[i], m = cols.length, Y = Hcy[i];
        for (let q = 0; q < m; q++) for (let t = 0; t < m; t++) { let z = 0; for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) z += Y[a * m + q] * Ai[b][a] * Y[b * m + t]; Sd[cols[q] * ny + cols[t]] -= z; }
      }
      const ch = cholSolve(Sd, ny); if (ch) covSolve = ch.solve;
    }
    // Varianz einer Funktion g(pts): Gradient -> gᵀ Q g · s0²
    function sigmaOf(g) {
      if (!covSolve) return null;
      const grad = new Float64Array(ny);
      for (let j = 0; j < np; j++) for (let k = 0; k < 3; k++) { const a = pts.map(p => p.slice()), b = pts.map(p => p.slice()); a[j][k] += 1e-6; b[j][k] -= 1e-6; grad[5 + 3 * j + k] = (g(a) - g(b)) / 2e-6; }
      const x = covSolve(grad); let s = 0; for (let q = 0; q < ny; q++) s += grad[q] * x[q];
      return Math.sqrt(Math.max(0, s)) * (nobs - npar > 200 ? Math.max(0.5, s0) : Math.max(1, s0));
    }
    let se = 0; obs.forEach(o => { const p = project(it, cams[o.c], pts[o.p]); se += (p[0] - o.u) ** 2 + (p[1] - o.v) ** 2; });
    return { it, cams, pts, rms: Math.sqrt(se / (2 * obs.length)), s0, cost: cur, sigmaOf, lam, unseen: [...seen.keys()].filter(j => !seen[j]) };
  }
  return { solve, project, rodr, rotvec, cholSolve };
})();
if (typeof module !== 'undefined') module.exports = BA;
