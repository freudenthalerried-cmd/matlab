'use strict';
/* Raumplan – Phase 1: Kamera fixieren, Schärfe prüfen, Kamera kalibrieren mit gedruckter Kalibriertafel (Markerraster).
   Kamera-Modell wie ba.js: [f, cx, cy, k1, k2] (Verzeichnung auf normierten Koordinaten → gilt für jede Bildgröße). */
const CAM = (() => {
  const KEY = 'raumplan-calib';
  // Rückkamera, volle Auflösung, Zoom 1×, Fokus fest (wenn das Gerät es erlaubt) – gleich für Kalibrierung und Messung
  async function open() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 3840 }, height: { ideal: 2160 } }, audio: false });
    const tr = stream.getVideoTracks()[0], info = [];
    let caps = {}; try { caps = tr.getCapabilities ? tr.getCapabilities() : {}; } catch (e) { }
    const adv = {};
    if (caps.zoom) adv.zoom = Math.max(caps.zoom.min, Math.min(caps.zoom.max, 1));
    if (caps.focusMode && caps.focusMode.includes('manual') && caps.focusDistance) { adv.focusMode = 'manual'; adv.focusDistance = Math.max(caps.focusDistance.min, Math.min(caps.focusDistance.max, 1.5)); }
    if (Object.keys(adv).length) { try { await tr.applyConstraints({ advanced: [adv] }); } catch (e) { } }
    const st = tr.getSettings ? tr.getSettings() : {};
    info.push(st.focusMode === 'manual' ? 'Fokus fest' : 'Fokus automatisch (Gerät erlaubt keine Sperre)');
    if (st.zoom !== undefined) info.push('Zoom ' + st.zoom + '×');
    return { stream, track: tr, settings: st, info: info.join(' · '), fixedFocus: st.focusMode === 'manual' };
  }
  // Schärfe: Varianz des Laplace-Operators (Mittelbereich, jedes 2. Pixel)
  function sharpness(g, W, H) {
    let s = 0, s2 = 0, n = 0;
    for (let y = (H / 4) | 0; y < (3 * H / 4) | 0; y += 2) for (let x = (W / 4) | 0; x < (3 * W / 4) | 0; x += 2) {
      const i = y * W + x, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - W] - g[i + W]; s += l; s2 += l * l; n++;
    }
    return n ? s2 / n - (s / n) ** 2 : 0;
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { } }
  // Kalibrierung auf eine Bildgröße umrechnen (gleiches Seitenverhältnis nötig)
  function forSize(W, H) {
    const c = load(); if (!c || !c.fixedFocus) return null; // ohne festen Fokus ändert sich die Brennweite → dann lieber selbst kalibrieren lassen
    const a = Math.max(W, H) / Math.max(c.W, c.H), b = Math.min(W, H) / Math.min(c.W, c.H);
    if (Math.abs(a / b - 1) > 0.01) return null;
    const rot = (W > H) !== (c.W > c.H); // Hoch-/Querformat getauscht
    return rot ? [c.it[0] * a, c.it[2] * a, c.it[1] * a, c.it[3], c.it[4]] : [c.it[0] * a, c.it[1] * a, c.it[2] * a, c.it[3], c.it[4]];
  }
  return { open, sharpness, load, save, forSize };
})();

const CAL = (() => {
  const IDS = Array.from({ length: 20 }, (_, i) => 40 + i), SIZE = 0.038, PITCH = 0.05, COLS = 4;
  // Tafelpunkte (Druckkoordinaten in m, x rechts, y nach unten; Ecken wie pg.js local(): links-oben, rechts-oben, rechts-unten, links-unten)
  const center = id => { const i = id - 40; return [0.03 + PITCH * (i % COLS), 0.035 + PITCH * Math.floor(i / COLS)]; };
  const corners = id => { const c = center(id), h = SIZE / 2; return [[c[0] - h, c[1] - h, 0], [c[0] + h, c[1] - h, 0], [c[0] + h, c[1] + h, 0], [c[0] - h, c[1] + h, 0]]; };
  function boardSVG() {
    const W = 210, H = 297, s = SIZE * 1000, cell = s / MK.G;
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}" font-family="Arial"><rect width="${W}" height="${H}" fill="#fff"/>`;
    const ox = (W - (PITCH * 1000 * (COLS - 1) + s)) / 2 - (0.03 * 1000 - s / 2), oy = 20 - (0.035 * 1000 - s / 2);
    IDS.forEach(id => {
      const c = center(id), x0 = ox + c[0] * 1000 - s / 2, y0 = oy + c[1] * 1000 - s / 2, d = MK.DICT[id];
      o += `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="#000"/>`;
      for (let r = 0; r < MK.N; r++) for (let k = 0; k < MK.N; k++) if (!(d >>> (r * MK.N + k) & 1)) o += `<rect x="${x0 + (k + 1) * cell}" y="${y0 + (r + 1) * cell}" width="${cell + 0.02}" height="${cell + 0.02}" fill="#fff"/>`;
    });
    o += `<text x="105" y="278" font-size="6" text-anchor="middle" font-weight="bold">Raumplan – Kalibriertafel</text>`;
    o += `<text x="105" y="285" font-size="3.6" text-anchor="middle">Flach auf einen Tisch legen (nicht wellig). Druckgröße ist egal. In der App „Kamera kalibrieren“ wählen.</text>`;
    return o + '</svg>';
  }

  /* ---------- Mathematik ---------- */
  function jacobiMin(A, n) { // kleinster Eigenvektor einer symmetrischen n×n-Matrix (Jacobi)
    const a = A.map(r => r.slice()), v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
    for (let sw = 0; sw < 60; sw++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2; if (off < 1e-22) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-30) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
      }
    }
    let m = 0; for (let i = 1; i < n; i++) if (a[i][i] < a[m][m]) m = i;
    return v.map(r => r[m]);
  }
  function homography(P, U) { // Tafel (x,y) → Bild (u,v), normierte DLT
    const nrm = Q => { const mx = Q.reduce((a, p) => a + p[0], 0) / Q.length, my = Q.reduce((a, p) => a + p[1], 0) / Q.length, d = Q.reduce((a, p) => a + Math.hypot(p[0] - mx, p[1] - my), 0) / Q.length || 1, s = Math.SQRT2 / d; return { T: [s, 0, -s * mx, 0, s, -s * my, 0, 0, 1], f: p => [s * (p[0] - mx), s * (p[1] - my)] }; };
    const A = nrm(P), B = nrm(U), M = Array.from({ length: 9 }, () => new Array(9).fill(0));
    P.forEach((p, i) => { const [x, y] = A.f(p), [u, v] = B.f(U[i]); [[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]].forEach(r => { for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) M[a][b] += r[a] * r[b]; }); });
    const h = jacobiMin(M, 9), Hn = h;
    // H = B.T⁻¹ · Hn · A.T
    const inv = T => { const s = T[0]; return [1 / s, 0, -T[2] / s, 0, 1 / s, -T[5] / s, 0, 0, 1]; }, mul = (X, Y) => { const Z = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) Z[3 * i + j] += X[3 * i + k] * Y[3 * k + j]; return Z; };
    return mul(mul(inv(B.T), Hn), A.T);
  }
  function poseFromH(H, f, cx, cy) {
    const Ki = v => [(v[0] - cx * v[2]) / f, (v[1] - cy * v[2]) / f, v[2]];
    let h1 = Ki([H[0], H[3], H[6]]), h2 = Ki([H[1], H[4], H[7]]), t = Ki([H[2], H[5], H[8]]);
    const l = 1 / Math.hypot(...h1); let r1 = h1.map(v => v * l), r2 = h2.map(v => v * l); t = t.map(v => v * l);
    if (t[2] < 0) { r1 = r1.map(v => -v); r2 = r2.map(v => -v); t = t.map(v => -v); }
    const d = r1[0] * r2[0] + r1[1] * r2[1] + r1[2] * r2[2]; r2 = r2.map((v, i) => v - d * r1[i]); const n2 = Math.hypot(...r2); r2 = r2.map(v => v / n2);
    const r3 = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
    const R = [r1[0], r2[0], r3[0], r1[1], r2[1], r3[1], r1[2], r2[2], r3[2]];
    return { cam: [...BA.rotvec(R), ...t], tilt: Math.acos(Math.min(1, Math.abs(r3[2]))) * 57.3, dir: [r3[0], r3[1]] };
  }
  function chol(A, b, n) { // löst A x = b (A symmetrisch positiv definit)
    const L = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { let s = A[i * n + j]; for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k]; if (i === j) { if (s <= 0) return null; L[i * n + i] = Math.sqrt(s); } else L[i * n + j] = s / L[j * n + j]; }
    const y = new Float64Array(n); for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k]; y[i] = s / L[i * n + i]; }
    const x = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k]; x[i] = s / L[i * n + i]; }
    return { x, L };
  }

  // views: [{dets:[{id,c}]}] einer Bildgröße W×H → {it, rms, n, sf}
  function solve(views, W, H) {
    const V = views.map(v => { const P = [], U = []; v.dets.forEach(d => { if (d.id < 40 || d.id > 59) return; corners(d.id).forEach((X, q) => { P.push(X); U.push(d.c[q]); }); }); return { P, U }; }).filter(v => v.P.length >= 16);
    if (V.length < 6) return { err: 'Zu wenige brauchbare Bilder der Tafel (mindestens 6).' };
    // Startwerte (Zhang): Hauptpunkt = Bildmitte, Brennweite aus den Homographien
    const cx = W / 2, cy = H / 2; let sa = 0, sb = 0;
    V.forEach(v => { v.H = homography(v.P, v.U); const T = v.H.map((x, i) => x - (i < 3 ? cx * v.H[6 + i] : i < 6 ? cy * v.H[3 + i] : 0)); const h11 = T[0], h21 = T[3], h31 = T[6], h12 = T[1], h22 = T[4], h32 = T[7];
      [[h11 * h12 + h21 * h22, h31 * h32], [h11 * h11 + h21 * h21 - h12 * h12 - h22 * h22, h31 * h31 - h32 * h32]].forEach(([a, b]) => { sa += a * a; sb += a * b; }); });
    let f = Math.sqrt(1 / Math.max(1e-12, -sb / sa)); if (!(f > 0.3 * Math.max(W, H) && f < 3 * Math.max(W, H))) f = 0.8 * Math.max(W, H);
    let it = [f, cx, cy, 0, 0], cams = V.map(v => poseFromH(v.H, f, cx, cy).cam);
    const nP = 5 + 6 * V.length, res = (it, cams, out) => { let e = 0, n = 0; V.forEach((v, i) => v.P.forEach((X, j) => { if (v.bad && v.bad[j]) return; const p = BA.project(it, cams[i], X); const du = p[0] - v.U[j][0], dv = p[1] - v.U[j][1]; e += du * du + dv * dv; n++; if (out) out.push([i, j, du, dv]); })); return { e, n }; };
    let lam = 1e-3, cur = res(it, cams).e;
    for (let round = 0; round < 2; round++) {
      for (let iter = 0; iter < 40; iter++) {
        const N = new Float64Array(nP * nP), g = new Float64Array(nP);
        V.forEach((v, i) => v.P.forEach((X, j) => {
          if (v.bad && v.bad[j]) return;
          const p0 = BA.project(it, cams[i], X), r = [p0[0] - v.U[j][0], p0[1] - v.U[j][1]], J = [[], []], idx = [];
          for (let q = 0; q < 5; q++) { const h = 1e-6 * (1 + Math.abs(it[q])), t = it.slice(); t[q] += h; const p = BA.project(t, cams[i], X); J[0].push((p[0] - p0[0]) / h); J[1].push((p[1] - p0[1]) / h); idx.push(q); }
          for (let q = 0; q < 6; q++) { const h = 1e-7 * (1 + Math.abs(cams[i][q])), c = cams[i].slice(); c[q] += h; const p = BA.project(it, c, X); J[0].push((p[0] - p0[0]) / h); J[1].push((p[1] - p0[1]) / h); idx.push(5 + 6 * i + q); }
          for (let a = 0; a < 2; a++) idx.forEach((ia, ka) => { g[ia] += J[a][ka] * r[a]; idx.forEach((ib, kb) => N[ia * nP + ib] += J[a][ka] * J[a][kb]); });
        }));
        let ok = false;
        for (let tries = 0; tries < 8 && !ok; tries++) {
          const M = N.slice(); for (let q = 0; q < nP; q++) M[q * nP + q] *= 1 + lam;
          const s = chol(M, g.map(v => -v), nP); if (!s) { lam *= 10; continue; }
          const it2 = it.map((v, q) => v + s.x[q]), cams2 = cams.map((c, i) => c.map((v, q) => v + s.x[5 + 6 * i + q])), e2 = res(it2, cams2).e;
          if (e2 < cur) { it = it2; cams = cams2; lam = Math.max(1e-7, lam / 5); ok = Math.abs(cur - e2) < 1e-9 * cur ? 'conv' : true; cur = e2; } else lam *= 10;
        }
        if (!ok || ok === 'conv') break;
      }
      // Ausreißer (> 3 × Restfehler) entfernen, dann nochmal
      const out = [], r0 = res(it, cams, out), rms = Math.sqrt(r0.e / (2 * r0.n));
      out.forEach(([i, j, du, dv]) => { if (Math.hypot(du, dv) > Math.max(1.5, 3 * rms * Math.SQRT2)) (V[i].bad = V[i].bad || {})[j] = 1; });
      cur = res(it, cams).e;
    }
    const r1 = res(it, cams), rms = Math.sqrt(r1.e / (2 * r1.n));
    return { it, rms, n: V.length, pts: r1.n, W, H };
  }
  // Bild bewerten: Abdeckung (3×3) und Neigung der Tafel
  function viewInfo(dets, W, H) {
    const bd = dets.filter(d => d.id >= 40 && d.id <= 59); if (bd.length < 4) return null;
    const P = [], U = []; bd.forEach(d => corners(d.id).forEach((X, q) => { P.push(X); U.push(d.c[q]); }));
    const pose = poseFromH(homography(P, U), 0.8 * Math.max(W, H), W / 2, H / 2), cells = new Set();
    U.forEach(u => cells.add(Math.min(2, Math.floor(3 * u[0] / W)) + 3 * Math.min(2, Math.floor(3 * u[1] / H))));
    const tb = pose.tilt < 15 ? 'flach' : Math.abs(pose.dir[0]) > Math.abs(pose.dir[1]) ? (pose.dir[0] > 0 ? 'links' : 'rechts') : (pose.dir[1] > 0 ? 'oben' : 'unten');
    return { n: bd.length, cells, tilt: pose.tilt, tb };
  }
  return { IDS, corners, boardSVG, solve, viewInfo, homography };
})();
if (typeof module !== 'undefined') module.exports = { CAM, CAL };
