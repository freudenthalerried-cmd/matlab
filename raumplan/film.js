'use strict';
/* Raumplan – „Raum filmen“: Tiefenpunkte aus ARCore (WebXR depth-sensing) sammeln, Boden/Decke/Wände selbst finden.
   Kein Antippen: der Nutzer filmt langsam rundherum. Maßstab = angesagte Raumhöhe ÷ gemessener Abstand Boden–Decke.
   Geometrie (solve, floorCeil, band, envelope, segments, rectFit, polyFit) ist rein und in Node testbar (sim/test_film.js). */
const FILM = (() => {
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
  const el = id => document.getElementById(id);
  const st = { pts: null, n: 0, cams: [], s: null, done: null, opts: {}, flip: null, hy: [new Int32Array(600), new Int32Array(600)], frames: 0, t0: 0 };

  // ---------- Geometrie ----------
  // Höhenverteilung → Boden (tiefster dichter Peak) und Decke (höchster dichter Peak); y in m, Bins 2 cm
  function floorCeil(pts, n) {
    const H = new Map(); for (let i = 0; i < n; i++) { const k = Math.round(pts[i * 3 + 1] / 0.02); H.set(k, (H.get(k) || 0) + 1); }
    if (!H.size) return { floor: null, ceil: null };
    const ks = [...H.keys()].sort((a, b) => a - b), mx = Math.max(...H.values()), thr = Math.max(8, mx * 0.12), g3 = k => (H.get(k - 1) || 0) + (H.get(k) || 0) + (H.get(k + 1) || 0);
    // erster dichter Bin von unten/oben, dann zum lokalen Maximum (sonst sitzt der Wert am Rand der Verteilung)
    const peak = (iter, dir) => { for (const k of iter) { if (g3(k) >= thr) { let b = k; for (let j = k; j !== k + dir * 6; j += dir) if (g3(j) > g3(b)) b = j; return b; } } return null; };
    const refine = k => { if (k === null) return null; let s = 0, c = 0; for (let j = k - 3; j <= k + 3; j++) { const v = H.get(j) || 0; s += j * 0.02 * v; c += v; } return c ? s / c : null; };
    const floor = refine(peak(ks, 1)), ceil = refine(peak([...ks].reverse(), -1));
    return { floor, ceil: ceil !== null && floor !== null && ceil - floor > 1.6 && ceil - floor < 6 ? ceil : null };
  }
  // obere Wandhälfte (über Sofa, Tisch, Bett): nur diese Punkte bestimmen die Wände
  function band(pts, n, floor, ceil) {
    const H = ceil !== null ? ceil - floor : 2.5, lo = floor + 0.45 * H, hi = floor + H - 0.1, B = [];
    for (let i = 0; i < n; i++) { const y = pts[i * 3 + 1]; if (y >= lo && y <= hi) B.push(pts[i * 3], pts[i * 3 + 2]); }
    return Float32Array.from(B);
  }
  // Zellen 2 cm von oben (für Karte und Zählung)
  function cells(B, c = 0.02) { const G = new Map(); for (let i = 0; i < B.length; i += 2) { const k = Math.round(B[i] / c) * 65536 + Math.round(B[i + 1] / c); const q = G.get(k); if (q) q.n++; else G.set(k, { x: Math.round(B[i] / c) * c, z: Math.round(B[i + 1] / c) * c, n: 1 }); } return [...G.values()].filter(q => q.n >= 2); }
  // Hülle: je Winkelgrad um die Mitte die NÄCHSTE dichte Fläche (was man von dort sieht) – Abstandshistogramm 2 cm, Peak statt Randwert
  function envelope(B, center, step = 1) {
    const nb = Math.round(360 / step), bins = Array.from({ length: nb }, () => []);
    for (let i = 0; i < B.length; i += 2) { const dx = B[i] - center[0], dz = B[i + 1] - center[1], d = Math.hypot(dx, dz); if (d < 0.3) continue; bins[Math.floor(((Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360) / step) % nb].push(d); }
    const E = [];
    bins.forEach((Bn, i) => { if (Bn.length < 6) return; const h = new Map(); for (const d of Bn) { const k = Math.round(d / 0.02); h.set(k, (h.get(k) || 0) + 1); }
      const g3 = k => (h.get(k - 1) || 0) + (h.get(k) || 0) + (h.get(k + 1) || 0), ks = [...h.keys()].sort((a, b) => a - b), mx = Math.max(...ks.map(g3)), thr = Math.max(5, 0.25 * mx);
      let b = null; for (const k of ks) if (g3(k) >= thr) { b = k; for (let j = k; j < k + 6; j++) if (g3(j) > g3(b)) b = j; break; } if (b === null) return;
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
    let s0 = 0; for (let i = 1; i < E.length; i++) if (E[i].d > E[s0].d) s0 = i; // Start sicher an einer Ecke (fernster Punkt)
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
    const poly = [back(u0, v0), back(u1, v0), back(u1, v1), back(u0, v1)]; // Wand 0: v0-Seite, 1: u1-Seite, 2: v1-Seite, 3: u0-Seite
    const sg = x => Math.hypot(x.sd / Math.sqrt(x.n), 0.008);
    return { poly, sigma: [sg(S[3]), sg(S[0]), sg(S[1]), sg(S[2])], ang: th * 180 / Math.PI, fit: S.map(x => ({ n: x.n, sd: +x.sd.toFixed(3) })) };
  }
  // beliebiger Grundriss: Geradenstücke, Ecken = Schnitt benachbarter Geraden
  function polyFit(E) {
    const L = segments(E); if (L.length < 3) return { err: 'Zu wenige Wände erkannt – bitte noch einmal langsam rundherum filmen.' };
    const poly = [], sigma = [];
    for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length], den = a.e[0] * b.e[1] - a.e[1] * b.e[0];
      if (Math.abs(den) < 0.17) poly.push([a.m[0] + a.e[0] * a.len / 2, a.m[1] + a.e[1] * a.len / 2]); // fast parallel: Kantenende
      else { const t = ((b.m[0] - a.m[0]) * b.e[1] - (b.m[1] - a.m[1]) * b.e[0]) / den; poly.push([a.m[0] + a.e[0] * t, a.m[1] + a.e[1] * t]); } }
    for (let i = 0; i < L.length; i++) { const l = L[(i + 1) % L.length]; sigma.push(Math.hypot(l.sd / Math.sqrt(l.n), 0.01)); }
    return { poly, sigma, fit: L.map(l => ({ n: l.n, sd: +l.sd.toFixed(3), len: +l.len.toFixed(2) })) };
  }
  // Gesamt: Punkte (Float32Array x,y,z…), Kameraorte, Optionen {height: angesagte Raumhöhe m, rect: bool}
  function solve(pts, n, cams, opts) {
    if (n < 2000) return { err: 'Zu wenige Tiefenpunkte – das Handy braucht Bewegung und Licht. Bitte langsam rundherum filmen.' };
    const fc = floorCeil(pts, n); if (fc.floor === null) return { err: 'Boden nicht gefunden – bitte auch den Boden filmen.' };
    const B = band(pts, n, fc.floor, fc.ceil); if (B.length < 600) return { err: 'Zu wenige Wandpunkte – Wände bitte näher und langsamer filmen, auch den oberen Teil.' };
    const center = cams.length ? [med(cams.map(c => c[0])), med(cams.map(c => c[2]))] : [med(Array.from(B.filter((_, i) => i % 2 === 0))), med(Array.from(B.filter((_, i) => i % 2 === 1)))];
    const E = envelope(B, center); if (E.length < 120) return { err: `Nur ${Math.round(E.length / 3.6)} % des Raums gesehen – bitte einmal ganz rundherum filmen.` };
    const g = opts.rect ? rectFit(E) : polyFit(E); if (g.err) return g;
    const hMeas = fc.ceil !== null ? fc.ceil - fc.floor : null, k = hMeas && opts.height ? opts.height / hMeas : 1;
    const scale = hMeas && opts.height ? { k, n: 1, sig: 0.006, auto: true, height: true } : null; // Höhenpeaks ±1 cm auf 2,5 m ≈ 0,6 %
    const poly = g.poly.map(p => [p[0] * k, p[1] * k]), sigma = g.sigma.map(s => s * k);
    return { poly, sigma, scale, height: hMeas ? hMeas * k : null, floor: fc.floor, ceil: fc.ceil, cover: E.length / 3.6, cells: B.length / 2, fit: g.fit, raw: { n, cams: cams.length, floor: fc.floor, ceil: fc.ceil, k, opts, ang: g.ang } };
  }

  // ---------- AR-Sitzung (nur im Browser) ----------
  const MAXP = 200000;
  function addPoint(x, y, z) { if (st.n < MAXP) { st.pts[st.n * 3] = x; st.pts[st.n * 3 + 1] = y; st.pts[st.n * 3 + 2] = z; st.n++; } else { const i = (Math.random() * MAXP) | 0; st.pts[i * 3] = x; st.pts[i * 3 + 1] = y; st.pts[i * 3 + 2] = z; } }
  function ui(msg) { const m = el('filmMsg'); if (m && msg !== undefined) m.innerHTML = msg; const fc = st.frames > 40 ? floorCeil(st.pts, st.n) : { floor: null, ceil: null }; st.fc = fc;
    const t = el('filmTop'); if (t) t.innerHTML = `${st.n.toLocaleString('de-AT')} Punkte · Boden ${fc.floor !== null ? '✓' : '…'} · Decke ${fc.ceil !== null ? `✓ ${(fc.ceil - fc.floor).toFixed(2).replace('.', ',')} m` : '…'}${fc.ceil !== null && st.opts.height ? ` → Maßstab ${((st.opts.height / (fc.ceil - fc.floor) - 1) * 100).toFixed(1).replace('.', ',')} %` : ''}`; drawMap(); }
  function drawMap() { const cv = el('filmMap'); if (!cv || !st.n) return; const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.fillStyle = '#000a'; g.fillRect(0, 0, W, H);
    const cx = st.cams.length ? st.cams[st.cams.length - 1][0] : 0, cz = st.cams.length ? st.cams[st.cams.length - 1][2] : 0, sc = W / 9; // 9 m Ausschnitt
    const fy = st.fc && st.fc.floor !== null ? st.fc.floor : null, Hh = fy !== null && st.fc.ceil !== null ? st.fc.ceil - fy : 2.5, step = Math.max(1, Math.floor(st.n / 8000));
    g.fillStyle = '#9f9'; for (let i = 0; i < st.n; i += step) { const y = st.pts[i * 3 + 1]; if (fy !== null && (y < fy + 0.45 * Hh || y > fy + Hh - 0.1)) continue; const x = (st.pts[i * 3] - cx) * sc + W / 2, zz = (st.pts[i * 3 + 2] - cz) * sc + H / 2; if (x >= 0 && zz >= 0 && x < W && zz < H) g.fillRect(x, zz, 2, 2); }
    g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < st.cams.length; i++) { const c = st.cams[i], x = (c[0] - cx) * sc + W / 2, zz = (c[2] - cz) * sc + H / 2; i ? g.lineTo(x, zz) : g.moveTo(x, zz); } g.stroke();
    g.fillStyle = '#29b6f6'; g.beginPath(); g.arc(W / 2, H / 2, 4, 0, 7); g.fill(); if (st.dir) { g.strokeStyle = '#29b6f6'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(W / 2 + st.dir[0] * 18, H / 2 + st.dir[1] * 18); g.stroke(); } }
  async function supported() { if (!navigator.xr) return false; return navigator.xr.isSessionSupported('immersive-ar').catch(() => false); }
  async function start(opts, onDone) {
    const root = el('filmUI'); root.hidden = false;
    Object.assign(st, { pts: new Float32Array(MAXP * 3), n: 0, cams: [], done: onDone, opts, flip: null, hy: [new Int32Array(600), new Int32Array(600)], frames: 0, t0: Date.now(), fc: null, dir: null, lastUi: 0, noDepth: 0 });
    let s; try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['depth-sensing'], optionalFeatures: ['dom-overlay', 'local-floor', 'hit-test'], domOverlay: { root }, depthSensing: { usagePreference: ['cpu-optimized'], dataFormatPreference: ['luminance-alpha', 'float32'] } }); }
    catch (e) { root.hidden = true; return onDone({ err: 'nodepth', msg: e.message }); }
    st.s = s; const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { xrCompatible: true });
    await s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
    let space; try { space = await s.requestReferenceSpace('local-floor'); } catch (e) { space = await s.requestReferenceSpace('local'); }
    s.addEventListener('end', () => { st.s = null; root.hidden = true; });
    ui('Langsam <b>rundherum</b> filmen: alle Wände (auch oben), dazu kurz Boden und Decke. Handy ruhig bewegen – die Karte unten füllt sich.');
    const frame = (t, f) => {
      if (!st.s) return; s.requestAnimationFrame(frame);
      const bl = s.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const vp = f.getViewerPose(space); if (!vp) return; const view = vp.views[0]; st.frames++;
      const M = view.transform.matrix, P = view.projectionMatrix, cp = [M[12], M[13], M[14]]; if (st.frames % 6 === 0) st.cams.push(cp); st.dir = [-M[8], -M[10]]; // Blickrichtung (−z der Kamera) in x/z
      let di = null; try { di = f.getDepthInformation(view); } catch (e) { } if (!di) { st.noDepth++; if (st.noDepth === 90) ui('⚠ Noch keine Tiefendaten – Handy langsam hin und her bewegen, Raum muss hell genug sein.'); return; }
      if (st.frames % 2) return; // jedes 2. Bild reicht
      const NX = 32, NY = 24; const conv = (u, v, d, flip) => { const nx = 2 * u - 1, ny = flip ? 2 * v - 1 : 1 - 2 * v, x = d * (nx + P[8]) / P[0], y = d * (ny + P[9]) / P[5], z = -d; return [M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]]; };
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const u = (i + 0.5) / NX, v = (j + 0.5) / NY; let d; try { d = di.getDepthInMeters(u, v); } catch (e) { continue; } if (!(d > 0.3 && d < 6)) continue;
        if (st.flip === null) { for (const fl of [0, 1]) { const q = conv(u, v, d, fl); const k = Math.round(q[1] / 0.02) + 300; if (k >= 0 && k < 600) st.hy[fl][k]++; } }
        else { const q = conv(u, v, d, st.flip); addPoint(q[0], q[1], q[2]); } }
      if (st.flip === null && st.frames >= 60) { // Zeilenrichtung des Tiefenbilds festlegen: Boden muss nahe y=0 (local-floor) liegen, nicht gespiegelt um die Kamerahöhe
        const lowPeak = h => { const mx = Math.max(...h), thr = Math.max(8, mx * 0.12); for (let k = 1; k < 599; k++) if (h[k - 1] + h[k] + h[k + 1] >= thr) return (k - 300) * 0.02; return null; };
        const a = lowPeak(st.hy[0]), b = lowPeak(st.hy[1]); st.flip = (a === null ? 9 : Math.abs(a)) <= (b === null ? 9 : Math.abs(b)) ? 0 : 1; }
      if (t - st.lastUi > 400) { st.lastUi = t; ui(); }
    };
    s.requestAnimationFrame(frame);
  }
  function finish() { if (!st.s) return; const r = solve(st.pts, st.n, st.cams, st.opts); if (r.err) { ui(`⚠ ${r.err}`); return; } st.s.end(); st.done && st.done(r); }
  function cancel() { st.s && st.s.end(); }
  return { start, finish, cancel, supported, solve, floorCeil, band, cells, envelope, segments, rectFit, polyFit, _st: st };
})();
if (typeof module !== 'undefined') module.exports = FILM;
