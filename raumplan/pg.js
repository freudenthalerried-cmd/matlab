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
  function reconstruct(frames, opt) {
    const W = opt.W, H = opt.H, s = opt.size || 0.16, log = opt.log || (() => { });
    const f0 = opt.f || 0.75 * Math.max(W, H), cx = W / 2, cy = H / 2;
    // Marken-IDs mit genug Sichtungen
    const cnt = {}; frames.forEach(fr => fr.dets.forEach(d => cnt[d.id] = (cnt[d.id] || 0) + 1));
    const ids = Object.keys(cnt).map(Number).filter(id => cnt[id] >= 2).sort((a, b) => a - b);
    for (const need of [0, 1, 2]) if (!ids.includes(need)) return { ok: false, msg: `Bodenmarke ${need} wurde nicht (oft genug) erkannt. Marken 0, 1 und 2 müssen im Video mehrmals gut sichtbar sein.` };
    const kOf = new Map(ids.map((id, k) => [id, k]));
    // Startwerte: Posen verketten (Breitensuche), Wurzel = Marke 0
    const mPose = new Map([[0, { R: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }]]), cPose = new Map();
    const det = frames.map(fr => fr.dets.filter(d => kOf.has(d.id)).map(d => ({ ...d, pose: poseFromCorners(d.c, f0, cx, cy, s), area: Math.abs(areaOf(d.c)) })).filter(d => d.pose));
    let changed = true;
    while (changed) {
      changed = false;
      det.forEach((ds, i) => {
        if (cPose.has(i)) return;
        const d = ds.filter(x => mPose.has(x.id)).sort((a, b) => b.area - a.area)[0]; if (!d) return;
        const M = mPose.get(d.id), Rc = mm3(d.pose.R, tr(M.R)); cPose.set(i, { R: Rc, t: sub(d.pose.t, T3(Rc, M.p)) }); changed = true;
      });
      det.forEach((ds, i) => {
        const C = cPose.get(i); if (!C) return;
        ds.forEach(d => { if (mPose.has(d.id)) return; mPose.set(d.id, { R: mm3(tr(C.R), d.pose.R), p: Tt(C.R, sub(d.pose.t, C.t)) }); changed = true; });
      });
    }
    const used = ids.filter(id => mPose.has(id)), camIdx = [...cPose.keys()].sort((a, b) => a - b);
    if (camIdx.length < 5) return { ok: false, msg: 'Zu wenige zusammenhängende Bilder. Langsamer filmen, mehr Marken gleichzeitig ins Bild.' };
    const kU = new Map(used.map((id, k) => [id, k]));
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
    log(`Startwerte: ${camIdx.length} Bilder, ${used.length} Marken, ${obs.length / 4} Sichtungen`);
    let r = BAm.solve({ it: [f0, cx, cy, 0, 0], cams, pts, obs, cons }, { iters: opt.iters || 60, log: (it, c) => { if (it % 5 === 4) log(`Ausgleich Iteration ${it + 1}: Kosten ${c.toExponential(2)}`); } });
    if (opt.rs) { // 2. Stufe: Rolling Shutter nur für Bilder mit ≥ 3 Marken
      const nm = cams.map((_, ci) => new Set(obs.filter(o => o.c === ci).map(o => o.p >> 2)).size);
      log('Rolling-Shutter-Modell für ' + nm.filter(n => n >= (opt.rsMin || 4)).length + ' Bilder…');
      const r2 = BAm.solve({ it: r.it, cams: r.cams, pts: r.pts, obs, cons }, { iters: 40, rs: true, rsCam: nm.map(n => n >= (opt.rsMin || 4)), rsSigma: opt.rsSigma || [0.02, 0.02, 0.02, 1e-6, 1e-6, 1e-6] });
      if (r2.rms < 0.8 * r.rms) { r = r2; log(`Rolling Shutter korrigiert: Bildfehler ${r.rms.toFixed(2)} px`); } else log('Kein nennenswerter Rolling-Shutter-Effekt – Modell nicht verwendet.');
    }
    // grobe Fehlerkennungen (z. B. Spiegelung/Fehlerkennung) entfernen und neu rechnen
    const bad = new Set(); obs.forEach((o, k) => { const p = BAm.project(r.it, r.cams[o.c], r.pts[o.p], o.tau); if (Math.hypot(p[0] - o.u, p[1] - o.v) > Math.max(2, 8 * r.rms)) bad.add(Math.floor(k / 4)); });
    let res = r;
    if (bad.size) {
      const obs2 = obs.filter((_, k) => !bad.has(Math.floor(k / 4)));
      log(`${bad.size} fehlerhafte Markensichtungen entfernt, neu ausgleichen…`);
      res = BAm.solve({ it: r.it, cams: r.cams, pts: r.pts, obs: obs2, cons }, { iters: 30, rs: r.cams[0].length > 6, rsCam: r.cams.map(c => c.length > 6 && c.slice(6).some(v => Math.abs(v) > 1e-6)), rsSigma: opt.rsSigma || [0.02, 0.02, 0.02, 1e-6, 1e-6, 1e-6] });
    }
    return { ok: true, ids: used, kU, res, nImg: camIdx.length, nObs: obs.length / 4, dropped: bad.size, size: s };
  }
  function areaOf(c) { let a = 0; c.forEach((p, i) => { const q = c[(i + 1) % c.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a / 2; }

  /* Wände aus Wandmarken (ID ≥ 4): Gruppierung nach Ebene, Raumpolygon, σ je Wand */
  function walls(rec, opt = {}) {
    const P = rec.res.pts, mk = rec.ids.filter(id => id >= 4 && (!opt.ids || opt.ids.has(id))).map(id => {
      const k = rec.kU.get(id), Q = [0, 1, 2, 3].map(q => P[4 * k + q]), n = nrm(cross(sub(Q[2], Q[0]), sub(Q[3], Q[1])));
      const c = ctrOf(P, k), nh = nrm([n[0], n[1], 0]); return { id, k, c, n: nh, vert: Math.abs(n[2]) };
    }).filter(m => m.vert < 0.35);
    // Clustern
    const G = [];
    mk.forEach(m => { const g = G.find(g => dot(g.n, m.n) > Math.cos(15 * Math.PI / 180) && Math.abs(dot(g.n, sub(m.c, g.c))) < 0.08); if (g) { g.m.push(m); g.n = nrm(addv(g.n.map(v => v * (g.m.length - 1)), m.n)); } else G.push({ n: m.n, c: m.c, m: [m] }); });
    if (G.length < 3) return { ok: false, msg: `Nur ${G.length} Wände erkannt – mindestens 3 Wände mit je ≥ 1 Marke nötig.` };
    const cen = [0, 1].map(q => G.reduce((s, g) => s + g.c[q], 0) / G.length);
    G.forEach(g => g.ang = Math.atan2(g.c[1] - cen[1], g.c[0] - cen[0]));
    G.sort((a, b) => a.ang - b.ang);
    const line = (Q, g) => { // vertikale Ebene -> Linie im Grundriss (TLS über alle Ecken der Wandmarken)
      const q = []; g.m.forEach(m => { for (let j = 0; j < 4; j++) q.push(Q[4 * m.k + j]); });
      const mu = [0, 1].map(k => q.reduce((s, p) => s + p[k], 0) / q.length); let sxx = 0, sxy = 0, syy = 0;
      q.forEach(p => { const a = p[0] - mu[0], b = p[1] - mu[1]; sxx += a * a; sxy += a * b; syy += b * b; });
      let th = 0.5 * Math.atan2(2 * sxy, sxx - syy); if (g.m.length === 1) th = Math.atan2(g.n[0], -g.n[1]); // eine Marke: Richtung aus Normale
      return { mu, d: [Math.cos(th), Math.sin(th)] };
    };
    const inter = (A, B) => { const det = A.d[0] * -B.d[1] + A.d[1] * B.d[0]; if (Math.abs(det) < 1e-9) return null; const dx = B.mu[0] - A.mu[0], dy = B.mu[1] - A.mu[1], t = (dx * -B.d[1] + dy * B.d[0]) / det; return [A.mu[0] + A.d[0] * t, A.mu[1] + A.d[1] * t]; };
    const poly = Q => { const Ls = G.map(g => line(Q, g)); return Ls.map((L, i) => inter(Ls[(i - 1 + Ls.length) % Ls.length], L)); };
    const Pg = poly(P); if (Pg.some(p => !p)) return { ok: false, msg: 'Benachbarte Wände parallel – Wandzuordnung prüfen.' };
    const n = Pg.length, len = (Q, i) => { const p = poly(Q); return Math.hypot(p[(i + 1) % n][0] - p[i][0], p[(i + 1) % n][1] - p[i][1]); };
    const sig = Pg.map((_, i) => rec.res.sigmaOf(Q => len(Q, i)));
    // Wandlinie i verläuft zwischen Ecke i und i+1: Ecke i = Schnitt (Wand i-1, Wand i)
    const warn = G.filter(g => g.m.length < 2).map(g => `Wand mit Marke ${g.m[0].id} hat nur 1 Marke – Richtung unsicher, besser ≥ 2 Marken je Wand.`);
    return { ok: true, poly: Pg, sigma: sig, groups: G.map(g => g.m.map(m => m.id)), lengths: Pg.map((_, i) => len(P, i)), warn };
  }
  return { reconstruct, walls, poseFromCorners, local };
})();
if (typeof module !== 'undefined') module.exports = PG;
