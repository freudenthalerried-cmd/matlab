'use strict';
/* Photogrammetrie-Ablauf: Markenerkennungen mehrerer Bilder -> Startwerte -> Bündelausgleich -> Wände -> Raum.
   Marken-IDs: 0 und 1 = Maßband-Marken am Boden (Abstand = Maßstab), 2 und 3 = weitere Bodenmarken, ab 4 = Wandmarken. */
const PG = (() => {
  const BAm = typeof BA !== 'undefined' ? BA : require('./ba.js');
  const T3 = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  const Tt = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];
  const mm3 = (A, B) => { const C = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return C; };
  const tr = A => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function orthonorm(R) { for (let k = 0; k < 8; k++) { const I = inv3(tr(R)); R = R.map((v, i) => (v + I[i]) / 2); } return R; }
  function inv3(m) {
    const a = m, d = a[0] * (a[4] * a[8] - a[5] * a[7]) - a[1] * (a[3] * a[8] - a[5] * a[6]) + a[2] * (a[3] * a[7] - a[4] * a[6]);
    return [(a[4] * a[8] - a[5] * a[7]) / d, (a[2] * a[7] - a[1] * a[8]) / d, (a[1] * a[5] - a[2] * a[4]) / d, (a[5] * a[6] - a[3] * a[8]) / d, (a[0] * a[8] - a[2] * a[6]) / d, (a[2] * a[3] - a[0] * a[5]) / d, (a[3] * a[7] - a[4] * a[6]) / d, (a[1] * a[6] - a[0] * a[7]) / d, (a[0] * a[4] - a[1] * a[3]) / d];
  }
  // Markenecken im Markensystem (x rechts, y unten auf dem Blatt; z = x × y zeigt vom Betrachter weg in die Wand)
  const local = s => [[-s / 2, -s / 2, 0], [s / 2, -s / 2, 0], [s / 2, s / 2, 0], [-s / 2, s / 2, 0]];
  // Pose Marke -> Kamera aus Homographie (Lochkamera, Verzeichnung vernachlässigt)
  function poseFromCorners(c, f, cx, cy, s) {
    const n = c.map(p => [(p[0] - cx) / f, (p[1] - cy) / f]), L = local(s);
    const A = [], b = [];
    L.forEach(([X, Y], i) => { const [x, y] = n[i]; A.push([X, Y, 1, 0, 0, 0, -x * X, -x * Y]); b.push(x); A.push([0, 0, 0, X, Y, 1, -y * X, -y * Y]); b.push(y); });
    const M = A.map((r, i) => [...r, b[i]]);
    for (let col = 0; col < 8; col++) { let m = col; for (let r = col + 1; r < 8; r++) if (Math.abs(M[r][col]) > Math.abs(M[m][col])) m = r; if (Math.abs(M[m][col]) < 1e-14) return null; [M[col], M[m]] = [M[m], M[col]]; for (let r = 0; r < 8; r++) if (r !== col) { const q = M[r][col] / M[col][col]; for (let k = col; k <= 8; k++) M[r][k] -= q * M[col][k]; } }
    const h = M.map((r, i) => r[8] / r[i]); // [h0..h7], h8=1 ; Spalten: h1=(h0,h3,h6), h2=(h1,h4,h7), h3=(h2,h5,1)
    let c1 = [h[0], h[3], h[6]], c2 = [h[1], h[4], h[7]], c3 = [h[2], h[5], 1];
    let lam = 2 / (Math.hypot(...c1) + Math.hypot(...c2)); if (c3[2] * lam < 0) lam = -lam;
    const r1 = c1.map(v => v * lam), r2 = c2.map(v => v * lam), t = c3.map(v => v * lam), r3 = cross(r1, r2);
    const R = orthonorm([r1[0], r2[0], r3[0], r1[1], r2[1], r3[1], r1[2], r2[2], r3[2]]);
    return { R, t };
  }
  const ctrOf = (Q, k) => [0, 1, 2].map(q => (Q[4 * k][q] + Q[4 * k + 1][q] + Q[4 * k + 2][q] + Q[4 * k + 3][q]) / 4);

  /* frames: [{dets:[{id, c:[[x,y]*4]}]}], opt: {W,H,size (m), scaleDist (m), sigTape, sigPx, log, progress} */
  function reconstruct(frames, opt) { // mit Neustarts von anderen Startmarken, falls der Bildfehler zu hoch ist
    let best = reconstructOnce(frames, opt, 0);
    const good = r => r.ok && r.res.rms <= (opt.goodRms || 0.5) && !r.suspect, score = r => r.ok ? r.res.rms + (r.suspect ? 10 : 0) : Infinity;
    if (good(best)) return best;
    const cnt = {}; frames.forEach(fr => fr.dets.forEach(d => cnt[d.id] = (cnt[d.id] || 0) + 1));
    const roots = Object.keys(cnt).map(Number).filter(id => id !== 0).sort((a, b) => cnt[b] - cnt[a]).slice(0, opt.restarts ?? 3);
    for (const r of roots) {
      (opt.log || (() => { }))(`${best.ok ? (best.suspect || `Bildfehler ${best.res.rms.toFixed(2)} px zu hoch`) : best.msg} – Neustart ab Marke ${r}…`);
      const t = reconstructOnce(frames, opt, r);
      if (score(t) < score(best) || (!best.ok && t.ok)) best = t;
      if (good(best)) break;
    }
    return best;
  }
  function reconstructOnce(frames, opt, root) {
    const W = opt.W, H = opt.H, s = opt.size || 0.16, log = opt.log || (() => { });
    const f0 = opt.f || 0.75 * Math.max(W, H), cx = W / 2, cy = H / 2;
    // Marken-IDs mit genug Sichtungen
    const cnt = {}; frames.forEach(fr => fr.dets.forEach(d => cnt[d.id] = (cnt[d.id] || 0) + 1));
    const ids = Object.keys(cnt).map(Number).filter(id => cnt[id] >= 2).sort((a, b) => a - b);
    for (const need of [0, 1, 2]) if (!ids.includes(need)) return { ok: false, msg: `Bodenmarke ${need} wurde nicht (oft genug) erkannt. Marken 0, 1 und 2 müssen im Video mehrmals gut sichtbar sein.` };
    const kOf = new Map(ids.map((id, k) => [id, k]));
    // Startwerte inkrementell: Rückwärtsschnitt (Kamera aus allen bekannten Ecken), Vorwärtsschnitt (Marke aus mehreren Bildern), Zwischenausgleich
    const mPose = new Map([[root, { R: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }]]), cPose = new Map();
    const det = frames.map(fr => fr.dets.filter(d => kOf.has(d.id)).map(d => ({ ...d, pose: poseFromCorners(d.c, f0, cx, cy, s), area: Math.abs(areaOf(d.c)) })).filter(d => d.pose));
    let it0 = [f0, cx, cy, 0, 0]; const cornersW = id => { const M = mPose.get(id); return local(s).map(L => addv(T3(M.R, L), M.p)); };
    const resect = (ds, C0) => { // Gauß-Newton über 6 Posenparameter
      const P = [], U = []; ds.forEach(d => { if (!mPose.has(d.id)) return; cornersW(d.id).forEach((X, q) => { P.push(X); U.push(d.c[q]); }); });
      let c = C0.slice();
      for (let k = 0; k < 15; k++) {
        const JtJ = Array.from({ length: 6 }, () => new Array(6).fill(0)), Jtr = new Array(6).fill(0);
        P.forEach((X, j) => { const p0 = BAm.project(it0, c, X), r = [p0[0] - U[j][0], p0[1] - U[j][1]], J = [];
          for (let q = 0; q < 6; q++) { const cc = c.slice(); cc[q] += 1e-6; const p1 = BAm.project(it0, cc, X); J.push([(p1[0] - p0[0]) / 1e-6, (p1[1] - p0[1]) / 1e-6]); }
          const w = 1 / (1 + Math.hypot(...r) / 20); // robust
          for (let a1 = 0; a1 < 6; a1++) { Jtr[a1] += w * (J[a1][0] * r[0] + J[a1][1] * r[1]); for (let b1 = 0; b1 < 6; b1++) JtJ[a1][b1] += w * (J[a1][0] * J[b1][0] + J[a1][1] * J[b1][1]); } });
        JtJ.forEach((row, q) => row[q] *= 1.001);
        const ch = BAm.cholSolve(new Float64Array(JtJ.flat()), 6, Jtr.map(v => -v)); if (!ch) break;
        c = c.map((v, q) => v + ch.x[q]); if (Math.max(...ch.x.map(Math.abs)) < 1e-9) break;
      }
      let e = 0; P.forEach((X, j) => { const p0 = BAm.project(it0, c, X); e += (p0[0] - U[j][0]) ** 2 + (p0[1] - U[j][1]) ** 2; });
      return { c, rms: Math.sqrt(e / Math.max(1, P.length)), n: P.length };
    };
    const camFromDet = d => { const M = mPose.get(d.id), Rc = mm3(d.pose.R, tr(M.R)); return [...BAm.rotvec(Rc), ...sub(d.pose.t, T3(Rc, M.p))]; };
    const triang = (id) => { // 4 Ecken aus allen gesehenen, bereits orientierten Bildern (linear, Lochkamera)
      const V = []; det.forEach((ds, i) => { const C = cPose.get(i); if (!C) return; const d = ds.find(x => x.id === id); if (d) V.push({ C, d }); });
      if (V.length < 2) return null;
      const Cs = V.map(v => { const R = BAm.rodr(v.C); return Tt(R, v.C.slice(3)).map(x => -x); });
      let base = 0; for (let a1 = 0; a1 < Cs.length; a1++) for (let b1 = a1 + 1; b1 < Cs.length; b1++) base = Math.max(base, Math.hypot(...sub(Cs[a1], Cs[b1])));
      if (base < 0.3) return null;
      const Xs = [0, 1, 2, 3].map(q => {
        const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bb = [0, 0, 0];
        V.forEach(v => { const R = BAm.rodr(v.C), t = v.C.slice(3), x = (v.d.c[q][0] - it0[1]) / it0[0], y = (v.d.c[q][1] - it0[2]) / it0[0];
          [[R[0] - x * R[6], R[1] - x * R[7], R[2] - x * R[8], x * t[2] - t[0]], [R[3] - y * R[6], R[4] - y * R[7], R[5] - y * R[8], y * t[2] - t[1]]].forEach(([a1, a2, a3, r]) => {
            const row = [a1, a2, a3]; for (let m = 0; m < 3; m++) { bb[m] += row[m] * r; for (let n2 = 0; n2 < 3; n2++) A[m][n2] += row[m] * row[n2]; } }); });
        const ch = BAm.cholSolve(new Float64Array(A.flat()), 3, bb); return ch && ch.x;
      });
      if (Xs.some(x => !x)) return null;
      // Pose aus 4 Ecken: Mitte + Achsen
      const p = [0, 1, 2].map(q => (Xs[0][q] + Xs[1][q] + Xs[2][q] + Xs[3][q]) / 4);
      const ex = nrm(addv(sub(Xs[1], Xs[0]), sub(Xs[2], Xs[3]))), ey0 = addv(sub(Xs[3], Xs[0]), sub(Xs[2], Xs[1])), ez = nrm(cross(ex, ey0)), ey = cross(ez, ex);
      return { R: [ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]], p };
    };
    let progress = true, lastBA = 0; const tries = new Map(), bump = k => { tries.set(k, (tries.get(k) || 0) + 1); return tries.get(k) <= 3; };
    while (progress) {
      progress = false;
      // Kameras
      det.forEach((ds, i) => {
        if (cPose.has(i)) return; const known = ds.filter(x => mPose.has(x.id)); if (!known.length) return;
        let best = null; known.sort((a1, b1) => b1.area - a1.area).slice(0, 3).forEach(d => { const r = resect(ds, camFromDet(d)); if (!best || r.rms < best.rms) best = r; });
        if (best && best.rms < (lastBA ? 4 : 30)) { cPose.set(i, best.c); progress = true; }
      });
      // Marken: bevorzugt triangulieren, sonst Einzelbild-Pose aus dem größten Anblick
      const pending = new Set(); det.forEach((ds, i) => { if (cPose.has(i)) ds.forEach(d => { if (!mPose.has(d.id)) pending.add(d.id); }); });
      let added = 0;
      pending.forEach(id => { const tp = triang(id); if (tp) { mPose.set(id, tp); added++; } });
      if (!added) pending.forEach(id => {
        let bd = null, bi = -1; det.forEach((ds, i) => { if (!cPose.has(i)) return; const d = ds.find(x => x.id === id); if (d && (!bd || d.area > bd.area)) { bd = d; bi = i; } });
        if (bd) { const Cv = cPose.get(bi), R = BAm.rodr(Cv), t = Cv.slice(3); mPose.set(id, { R: mm3(tr(R), bd.pose.R), p: Tt(R, sub(bd.pose.t, t)) }); added++; }
      });
      if (added) progress = true;
      // Zwischenausgleich, wenn das Netz deutlich gewachsen ist
      if (progress && cPose.size > 1.4 * lastBA + 3) {
        lastBA = cPose.size; const idsN = [...mPose.keys()], camsN = [...cPose.keys()], kk = new Map(idsN.map((id, k) => [id, k]));
        const ptsN = []; idsN.forEach(id => cornersW(id).forEach(X => ptsN.push(X)));
        const obsN = []; camsN.forEach((i, ci) => det[i].forEach(d => { if (!kk.has(d.id)) return; d.c.forEach((p, q) => obsN.push({ c: ci, p: 4 * kk.get(d.id) + q, u: p[0], v: p[1], s: 1 })); }));
        const k0 = kk.get(root), fixc = [0, 1, 2, 3].flatMap(q => [0, 1, 2].map(m => ({ f: Q => Q[q][m], v: ptsN[q][m], s: 1e-6, idx: [q] })));
        const rr = BAm.solve({ it: it0, cams: camsN.map(i => cPose.get(i)), pts: ptsN, obs: obsN, cons: k0 === 0 ? fixc : [], fixIt: camsN.length >= 10 ? [false, true, true, false, true] : [true, true, true, true, true] }, { iters: 20 });
        it0 = rr.it.slice();
        camsN.forEach((i, ci) => cPose.set(i, rr.cams[ci]));
        idsN.forEach((id, k) => { const Xs = [0, 1, 2, 3].map(q => rr.pts[4 * k + q]); const p = [0, 1, 2].map(q => (Xs[0][q] + Xs[1][q] + Xs[2][q] + Xs[3][q]) / 4);
          const ex = nrm(addv(sub(Xs[1], Xs[0]), sub(Xs[2], Xs[3]))), ey0 = addv(sub(Xs[3], Xs[0]), sub(Xs[2], Xs[1])), ez = nrm(cross(ex, ey0)), ey = cross(ez, ex);
          mPose.set(id, { R: [ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]], p }); });
        // Aufräumen: Sichtungen mit großem Restfehler -> betroffene Marken/Kameras zurücksetzen (später neu einbinden)
        const eM = new Map(), eC = new Map();
        obsN.forEach(o => { const p = BAm.project(rr.it, rr.cams[o.c], rr.pts[o.p]), e = Math.hypot(p[0] - o.u, p[1] - o.v), id = idsN[o.p >> 2], ci = camsN[o.c];
          (eM.get(id) || eM.set(id, []).get(id)).push(e); (eC.get(ci) || eC.set(ci, []).get(ci)).push(e); });
        const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
        let dropM = 0, dropC = 0;
        eM.forEach((a, id) => { if (id !== root && med(a) > 3 && bump('m' + id)) { mPose.delete(id); dropM++; } });
        eC.forEach((a, ci) => { if (med(a) > 3 && bump('c' + ci)) { cPose.delete(ci); dropC++; } });
        log(`Zwischenausgleich: ${camsN.length} Bilder, ${idsN.length} Marken, rms ${rr.rms.toFixed(1)} px${dropM + dropC ? `, zurückgesetzt: ${dropM} Marken, ${dropC} Bilder` : ''}`);
        if (dropM + dropC) { lastBA = Math.min(lastBA, cPose.size); progress = true; }
      }
    }
    // cPose als {R,t} für den weiteren Ablauf
    cPose.forEach((c, i) => cPose.set(i, { R: BAm.rodr(c), t: c.slice(3) }));
    const used = ids.filter(id => mPose.has(id)), camIdx = [...cPose.keys()].sort((a, b) => a - b);
    if (camIdx.length < 5) return { ok: false, msg: 'Zu wenige zusammenhängende Bilder. Langsamer filmen, mehr Marken gleichzeitig ins Bild.' };
    const kU = new Map(used.map((id, k) => [id, k]));
    for (const need of [0, 1, 2]) if (!kU.has(need)) return { ok: false, msg: `Bodenmarke ${need} konnte nicht mit den übrigen Bildern verknüpft werden – Fotos machen, auf denen Marke ${need} zusammen mit anderen Marken zu sehen ist.` };
    let pts = []; used.forEach(id => { const M = mPose.get(id); local(s).forEach(L => pts.push(addv(T3(M.R, L), M.p))); });
    // In Bodensystem drehen: Ebene durch Bodenmarken 0,1,2 -> z=0, Marke 0 = Ursprung, x Richtung Marke 1
    const c0 = ctrOf(pts, kU.get(0)), c1 = ctrOf(pts, kU.get(1)), c2 = ctrOf(pts, kU.get(2));
    let ez = nrm(cross(sub(c1, c0), sub(c2, c0)));
    const camC = camIdx.map(i => { const C = cPose.get(i); return Tt(C.R, C.t).map(v => -v); });
    if (dot(ez, sub(camC[0], c0)) < 0) ez = ez.map(v => -v);
    const ex = nrm(sub(sub(c1, c0), ez.map(v => v * dot(sub(c1, c0), ez)))), ey = cross(ez, ex), Rw = [...ex, ...ey, ...ez];
    pts = pts.map(p => T3(Rw, sub(p, c0)));
    const cams = camIdx.map(i => { const C = cPose.get(i), R = mm3(C.R, tr(Rw)), t = addv(T3(C.R, c0), C.t); return [...BAm.rotvec(R), ...t]; });
    // Maßstab vorab anpassen
    const k0 = kU.get(0), k1 = kU.get(1), k2 = kU.get(2), dist = opt.scaleDist || 3.0;
    const sc = dist / Math.hypot(...sub(ctrOf(pts, k1), ctrOf(pts, k0)));
    pts = pts.map(p => p.map(v => v * sc)); cams.forEach(c => { c[3] *= sc; c[4] *= sc; c[5] *= sc; });
    // Beobachtungen
    const sp = opt.sigPx || 0.3, obs = [];
    camIdx.forEach((i, ci) => det[i].forEach(d => { if (!kU.has(d.id)) return; const k = kU.get(d.id); d.c.forEach((p, q) => obs.push({ c: ci, p: 4 * k + q, u: p[0], v: p[1], s: sp, tau: H >= W ? (p[0] - W / 2) / W : (p[1] - H / 2) / H })); }));
    const idx = k => [4 * k, 4 * k + 1, 4 * k + 2, 4 * k + 3], st = opt.sigTape || 0.0005;
    const cons = [
      { f: Q => Math.hypot(...sub(ctrOf(Q, k1), ctrOf(Q, k0))), v: dist, s: st, idx: [...idx(k0), ...idx(k1)] },
      ...[0, 1, 2].map(q => ({ f: Q => ctrOf(Q, k0)[q], v: 0, s: 1e-7, idx: idx(k0) })),
      ...[1, 2].map(q => ({ f: Q => ctrOf(Q, k1)[q], v: 0, s: 1e-7, idx: idx(k1) })),
      { f: Q => ctrOf(Q, k2)[2], v: 0, s: 1e-7, idx: idx(k2) }];
    // Starre Marken: eben, quadratisch, alle gleich groß gedruckt (weiche Bedingungen, σ 0,3 mm) – erst in Stufe 2
    const rigidCons = [];
    if (opt.rigid !== false) {
      const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), sR = opt.rigidSigma || 0.0003;
      const side = (Q, k) => d3(Q[4 * k], Q[4 * k + 1]);
      used.forEach((id, k) => {
        const ix = idx(k), C = q => Q => Q[4 * k + q];
        rigidCons.push({ f: Q => { const a = C(0)(Q), b = C(1)(Q), c = C(2)(Q), d = C(3)(Q), n = nrm(cross(sub(b, a), sub(c, a))); return dot(n, sub(d, a)); }, v: 0, s: sR, idx: ix });
        rigidCons.push({ f: Q => d3(C(0)(Q), C(2)(Q)) - d3(C(1)(Q), C(3)(Q)), v: 0, s: sR, idx: ix });
        rigidCons.push({ f: Q => d3(C(0)(Q), C(1)(Q)) - d3(C(3)(Q), C(2)(Q)), v: 0, s: sR, idx: ix });
        rigidCons.push({ f: Q => d3(C(0)(Q), C(3)(Q)) - d3(C(1)(Q), C(2)(Q)), v: 0, s: sR, idx: ix });
        rigidCons.push({ f: Q => d3(C(0)(Q), C(1)(Q)) - d3(C(0)(Q), C(3)(Q)), v: 0, s: sR, idx: ix });
        if (k !== k0) rigidCons.push({ f: Q => side(Q, k) - side(Q, k0), v: 0, s: 2 * sR, idx: [...ix, ...idx(k0)] });
      });
    }
    if (opt.scaleDist2 > 0 && kU.has(3)) { const k3 = kU.get(3); cons.push({ f: Q => Math.hypot(...sub(ctrOf(Q, k3), ctrOf(Q, k2))), v: opt.scaleDist2, s: st, idx: [...idx(k2), ...idx(k3)] }); }
    log(`Startwerte: ${camIdx.length} Bilder, ${used.length} Marken, ${obs.length / 4} Sichtungen, f ≈ ${it0[0].toFixed(0)} px`);
    let r = BAm.solve({ it: it0.slice(), cams, pts, obs, cons }, { iters: opt.iters || 60, log: (it, c) => { if (it % 5 === 4) log(`Ausgleich Iteration ${it + 1}: Kosten ${c.toExponential(2)}`); } });
    if (opt.rs) { // 2. Stufe: Rolling Shutter nur für Bilder mit ≥ 3 Marken
      const nm = cams.map((_, ci) => new Set(obs.filter(o => o.c === ci).map(o => o.p >> 2)).size);
      log('Rolling-Shutter-Modell für ' + nm.filter(n => n >= (opt.rsMin || 4)).length + ' Bilder…');
      const r2 = BAm.solve({ it: r.it, cams: r.cams, pts: r.pts, obs, cons }, { iters: 40, rs: true, rsCam: nm.map(n => n >= (opt.rsMin || 4)), rsSigma: opt.rsSigma || [0.02, 0.02, 0.02, 1e-6, 1e-6, 1e-6] });
      if (r2.rms < 0.8 * r.rms) { r = r2; log(`Rolling Shutter korrigiert: Bildfehler ${r.rms.toFixed(2)} px`); } else log('Kein nennenswerter Rolling-Shutter-Effekt – Modell nicht verwendet.');
    }
    // grobe Fehlerkennungen (z. B. Spiegelung/Fehlerkennung) entfernen und neu rechnen
    const bad = new Set(); obs.forEach((o, k) => { const p = BAm.project(r.it, r.cams[o.c], r.pts[o.p], o.tau); if (Math.hypot(p[0] - o.u, p[1] - o.v) > Math.max(2, 8 * r.rms)) bad.add(Math.floor(k / 4)); });
    let res = r, obsUse = obs;
    if (bad.size) {
      const obs2 = obsUse = obs.filter((_, k) => !bad.has(Math.floor(k / 4)));
      log(`${bad.size} fehlerhafte Markensichtungen entfernt, neu ausgleichen…`);
      res = BAm.solve({ it: r.it, cams: r.cams, pts: r.pts, obs: obs2, cons }, { iters: 30, rs: r.cams[0].length > 6, rsCam: r.cams.map(c => c.length > 6 && c.slice(6).some(v => Math.abs(v) > 1e-6)), rsSigma: opt.rsSigma || [0.02, 0.02, 0.02, 1e-6, 1e-6, 1e-6] });
    }
    if (rigidCons.length && res.rms < 1) { // Stufe 2: starre Marken
      const rr = BAm.solve({ it: res.it, cams: res.cams, pts: res.pts, obs: obsUse, cons: cons.concat(rigidCons) }, { iters: 25, rs: res.cams[0].length > 6, rsCam: res.cams.map(c => c.length > 6 && c.slice(6).some(v => Math.abs(v) > 1e-6)), rsSigma: opt.rsSigma || [0.02, 0.02, 0.02, 1e-6, 1e-6, 1e-6] });
      if (isFinite(rr.rms) && rr.rms < res.rms * 1.15 + 0.02) { res = rr; log(`Starre Marken: Bildfehler ${rr.rms.toFixed(2)} px`); }
    }
    const sus = [2, 3].filter(id => kU.has(id) && Math.abs(ctrOf(res.pts, kU.get(id))[2]) > 0.02).map(id => `Bodenmarke ${id} liegt ${Math.round(ctrOf(res.pts, kU.get(id))[2] * 1000)} mm über/unter dem Boden`);
    const sScale = res.sigmaOf(Q => Math.hypot(...sub(ctrOf(Q, kU.get(1)), ctrOf(Q, kU.get(0)))));
    return { ok: true, suspect: sus.length ? sus.join('; ') + ' – Aufnahmegeometrie schwach.' : null, ids: used, kU, res, camFrames: camIdx, nImg: camIdx.length, nObs: obs.length / 4, dropped: bad.size, size: s };
  }
  function areaOf(c) { let a = 0; c.forEach((p, i) => { const q = c[(i + 1) % c.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a / 2; }

  /* Wände aus Wandmarken (ID ≥ 4): Gruppierung nach Ebene, Raumpolygon, σ je Wand */
  function walls(rec, opt = {}) {
    const P = rec.res.pts, mk = rec.ids.filter(id => id >= 4 && (!opt.ids || opt.ids.has(id))).map(id => {
      const k = rec.kU.get(id), Q = [0, 1, 2, 3].map(q => P[4 * k + q]), n = nrm(cross(sub(Q[2], Q[0]), sub(Q[3], Q[1])));
      const c = ctrOf(P, k), nh = nrm([n[0], n[1], 0]); return { id, k, c, n: nh, vert: Math.abs(n[2]) };
    }).filter(m => m.vert < 0.35);
    // Marken mit schlecht bestimmter Lage (wenige/ähnliche Blickwinkel) nicht verwenden
    const weak = [];
    for (let i = mk.length - 1; i >= 0; i--) {
      const m = mk[i], sg = rec.res.sigmaOf(Q => { const c = ctrOf(Q, m.k); return c[0] * m.n[0] + c[1] * m.n[1]; });
      m.sig = sg; if (sg !== null && sg > (opt.maxMarkerSigma || 0.01)) { weak.push(m.id); mk.splice(i, 1); }
    }
    // Clustern
    const G = [];
    mk.forEach(m => { const g = G.find(g => dot(g.n, m.n) > Math.cos(15 * Math.PI / 180) && Math.abs(dot(g.n, sub(m.c, g.c))) < 0.08); if (g) { g.m.push(m); g.n = nrm(addv(g.n.map(v => v * (g.m.length - 1)), m.n)); } else G.push({ n: m.n, c: m.c, m: [m] }); });
    // Einzelmarken mit ungenauer Normale der Wand zuordnen, auf deren Ebene sie liegen
    for (let k = G.length - 1; k >= 0; k--) {
      const g = G[k]; if (g.m.length > 1) continue; const m = g.m[0];
      const host = G.find(h => h !== g && h.m.length > 1 && dot(h.n, m.n) > Math.cos(35 * Math.PI / 180) && Math.abs(dot(h.n, sub(m.c, h.c))) < 0.03);
      if (host) { host.m.push(m); G.splice(k, 1); continue; }
      // liegt auf einer Wandebene, aber Richtung unplausibel -> unzuverlässig, verwerfen
      const near = G.find(h => h !== g && h.m.length > 1 && Math.abs(dot(h.n, sub(m.c, h.c))) < 0.05 && Math.abs(dot([h.n[1], -h.n[0], 0], sub(m.c, h.c))) < 4);
      if (near) { weak.push(m.id); G.splice(k, 1); }
    }
    // Kollineare Gruppen (gleiche Wand, getrennt geclustert) zusammenführen
    for (let merged = true; merged;) {
      merged = false;
      for (let i = 0; i < G.length && !merged; i++) for (let j = i + 1; j < G.length && !merged; j++) {
        const A = G[i], Bq = G[j];
        if (dot(A.n, Bq.n) > Math.cos(12 * Math.PI / 180) && Math.abs(dot(A.n, sub(Bq.c, A.c))) < 0.04 && Math.abs(dot(Bq.n, sub(A.c, Bq.c))) < 0.04) {
          A.m.push(...Bq.m); A.n = nrm(A.m.reduce((acc, m) => addv(acc, m.n), [0, 0, 0])); A.c = [0, 1, 2].map(q => A.m.reduce((acc, m) => acc + m.c[q], 0) / A.m.length); G.splice(j, 1); merged = true;
        }
      }
    }
    if (G.length < 3) return { ok: false, msg: `Nur ${G.length} Wände erkannt – mindestens 3 Wände mit je ≥ 1 Marke nötig.` };
    // Reihenfolge entlang des Umrisses (auch für L-förmige Räume): Raum liegt links der Wandrichtung
    G.forEach(g => { const nin = g.n.map(v => -v); g.d = [nin[1], -nin[0]]; g.s = g.m.map(m => m.c[0] * g.d[0] + m.c[1] * g.d[1]); g.s0 = Math.min(...g.s); g.s1 = Math.max(...g.s); });
    const order = [0], used = new Set([0]);
    while (order.length < G.length) {
      const A = G[order[order.length - 1]]; let best = null, bs = Infinity;
      G.forEach((B, k) => {
        if (used.has(k)) return; const det = A.d[0] * B.d[1] - A.d[1] * B.d[0]; if (Math.abs(det) < 0.2) return;
        const dx = B.c[0] - A.c[0], dy = B.c[1] - A.c[1], t = (dx * B.d[1] - dy * B.d[0]) / det, X = [A.c[0] + A.d[0] * t, A.c[1] + A.d[1] * t];
        const sa = X[0] * A.d[0] + X[1] * A.d[1], sb = X[0] * B.d[0] + X[1] * B.d[1];
        if (sa < A.s1 - 0.05 || sb > B.s0 + 0.05) return; // Ecke muss hinter A und vor B liegen
        const sc = (sa - A.s1) + (B.s0 - sb); if (sc < bs) { bs = sc; best = k; }
      });
      if (best === null) break; order.push(best); used.add(best);
    }
    if (order.length < G.length) { // Rückfallebene: nach Winkel um den Schwerpunkt
      const cen = [0, 1].map(q => G.reduce((s, g) => s + g.c[q], 0) / G.length);
      G.forEach(g => g.ang = Math.atan2(g.c[1] - cen[1], g.c[0] - cen[0])); G.sort((a, b) => a.ang - b.ang);
    } else { const Gs = order.map(k => G[k]); G.length = 0; G.push(...Gs); }
    const line = (Q, g) => { // vertikale Ebene -> Linie im Grundriss (TLS über alle Ecken der Wandmarken)
      const q = []; g.m.forEach(m => { for (let j = 0; j < 4; j++) q.push(Q[4 * m.k + j]); });
      const mu = [0, 1].map(k => q.reduce((s, p) => s + p[k], 0) / q.length); let sxx = 0, sxy = 0, syy = 0;
      q.forEach(p => { const a = p[0] - mu[0], b = p[1] - mu[1]; sxx += a * a; sxy += a * b; syy += b * b; });
      let th = 0.5 * Math.atan2(2 * sxy, sxx - syy); if (g.m.length === 1) th = g.fixTh !== undefined ? g.fixTh : Math.atan2(g.n[0], -g.n[1]); // eine Marke: Richtung aus Normale bzw. rechtwinklig zu den Nachbarn
      return { mu, d: [Math.cos(th), Math.sin(th)] };
    };
    const inter = (A, B) => { const det = A.d[0] * -B.d[1] + A.d[1] * B.d[0]; if (Math.abs(det) < 1e-9) return null; const dx = B.mu[0] - A.mu[0], dy = B.mu[1] - A.mu[1], t = (dx * -B.d[1] + dy * B.d[0]) / det; return [A.mu[0] + A.d[0] * t, A.mu[1] + A.d[1] * t]; };
    const poly = Q => { const Ls = G.map(g => line(Q, g)); return Ls.map((L, i) => inter(Ls[(i - 1 + Ls.length) % Ls.length], L)); };
    // Ein-Marken-Wände: Richtung der Markennormale ist unsicher (±1–2°) -> bei fast rechtem Winkel zu den Nachbarn rechtwinklig annehmen
    const snapped = [];
    G.forEach((g, i) => {
      if (g.m.length !== 1) return; const own = Math.atan2(g.n[0], -g.n[1]), nb = [G[(i - 1 + G.length) % G.length], G[(i + 1) % G.length]].filter(h => h.m.length > 1);
      if (!nb.length) return;
      const cands = nb.map(h => { const L = line(P, h), t = Math.atan2(L.d[1], L.d[0]); return [t + Math.PI / 2, t - Math.PI / 2, t, t + Math.PI]; }).flat();
      const df = t => Math.abs(Math.atan2(Math.sin(t - own), Math.cos(t - own)) % Math.PI);
      const best = cands.reduce((a, t) => df(t) < df(a) ? t : a);
      if (df(best) < 2 * Math.PI / 180) { g.fixTh = best; snapped.push(g.m[0].id); }
    });
    const Pg = poly(P); if (Pg.some(p => !p)) return { ok: false, msg: 'Benachbarte Wände parallel – Wandzuordnung prüfen.' };
    const n = Pg.length, len = (Q, i) => { const p = poly(Q); return Math.hypot(p[(i + 1) % n][0] - p[i][0], p[(i + 1) % n][1] - p[i][1]); };
    const sig = Pg.map((_, i) => rec.res.sigmaOf(Q => len(Q, i)));
    // Wandlinie i verläuft zwischen Ecke i und i+1: Ecke i = Schnitt (Wand i-1, Wand i)
    const warn = G.filter(g => g.m.length < 2).map(g => `Wand mit Marke ${g.m[0].id} hat nur 1 Marke – Richtung unsicher, besser ≥ 2 Marken je Wand.`);
    if (sig.some(v => v !== null && v > 0.05)) warn.push('Raum unvollständig: mindestens eine Wand ist kaum bestimmt (±-Wert sehr groß) – vermutlich wurde eine Wand zu selten fotografiert. Diesen Bereich aus 2–3 weiteren Positionen aufnehmen und neu auswerten.');
    if (snapped.length) warn.push(`Wand mit Marke ${snapped.join(', ')}: nur 1 Marke – Richtung rechtwinklig zu den Nachbarwänden angenommen. Für Altbau besser 2 Marken je Wand.`);
    if (weak.length) warn.push(`Marken ${weak.join(', ')} zu selten/zu ähnlich gesehen (Lage > ±1 cm) – nicht verwendet. Diese aus weiteren Positionen aufnehmen.`);
    // Raumhöhe aus Deckenmarken (waagrecht, oberhalb 1,8 m) über dem Boden (z = 0 aus Bodenmarken)
    const ceil = rec.ids.filter(id => id >= 4 && (!opt.ids || opt.ids.has(id))).map(id => { const k = rec.kU.get(id), Q = [0, 1, 2, 3].map(q => P[4 * k + q]), n = nrm(cross(sub(Q[2], Q[0]), sub(Q[3], Q[1]))); return { k, z: ctrOf(P, k)[2], hz: Math.abs(n[2]) }; }).filter(m => m.hz > 0.9 && m.z > 1.8);
    const height = ceil.length ? ceil.reduce((a, m) => a + m.z, 0) / ceil.length : null;
    const hSig = ceil.length ? rec.res.sigmaOf(Q => ceil.reduce((a, m) => a + ctrOf(Q, m.k)[2], 0) / ceil.length) : null;
    return { ok: true, height, hSig, lines: G.map(g => line(P, g)), poly: Pg, sigma: sig, groups: G.map(g => g.m.map(m => m.id)), lengths: Pg.map((_, i) => len(P, i)), warn };
  }
  /* Bildpunkt (px) eines Bildes -> 3D-Punkt auf einer (senkrechten) Wandebene */
  function rayToWall(rec, ci, uv, line) {
    const it = rec.res.it, c = rec.res.cams[ci], xd = (uv[0] - it[1]) / it[0], yd = (uv[1] - it[2]) / it[0];
    let x = xd, y = yd; for (let k = 0; k < 20; k++) { const r2 = x * x + y * y, d = 1 + it[3] * r2 + it[4] * r2 * r2; x = xd / d; y = yd / d; }
    const R = BAm.rodr(c), dir = Tt(R, [x, y, 1]), C = Tt(R, c.slice(3, 6)).map(v => -v), n = [-line.d[1], line.d[0], 0];
    const den = dot(n, dir); if (Math.abs(den) < 1e-9) return null;
    const t = (n[0] * (line.mu[0] - C[0]) + n[1] * (line.mu[1] - C[1])) / den; if (t <= 0) return null;
    return [C[0] + dir[0] * t, C[1] + dir[1] * t, C[2] + dir[2] * t];
  }
  /* Öffnung aus zwei gegenüberliegenden Ecken (auf der Wand): Lage ab Wandanfang, Breite, Höhe, Brüstung */
  function opening(w, i, X1, X2) {
    const a = w.poly[i], b = w.poly[(i + 1) % w.poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const s1 = (X1[0] - a[0]) * d[0] + (X1[1] - a[1]) * d[1], s2 = (X2[0] - a[0]) * d[0] + (X2[1] - a[1]) * d[1];
    const brh = Math.min(X1[2], X2[2]), h = Math.abs(X1[2] - X2[2]);
    return { pos: Math.min(s1, s2), w: Math.abs(s1 - s2), h, brh, type: brh < 0.1 ? 'tuer' : 'fenster', wallLen: L };
  }
  // Bilder, die Marken einer Wand sehen (beste zuerst)
  function framesForWall(rec, frames, w, i) {
    const ids = new Set(w.groups[i]); return rec.camFrames.map((fi, ci) => ({ ci, fi, n: frames[fi].dets.filter(d => ids.has(d.id)).length })).filter(x => x.n).sort((a, b) => b.n - a.n);
  }
  return { reconstruct, walls, poseFromCorners, local, rayToWall, opening, framesForWall };
})();
if (typeof module !== 'undefined') module.exports = PG;
