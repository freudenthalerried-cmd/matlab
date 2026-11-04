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
  // mehrere Lagen (Zollstock umgelegt): Mittel der Faktoren – Tippfehler und Richtungsabhängigkeit mitteln sich heraus
  function scale(zs, len, more = []) {
    if (!(len > 0)) return null; const K = [];
    [...more, zs].forEach(z => { if (!z[0].length || !z[1].length) return; const a = mean3(z[0]), b = mean3(z[1]), d = Math.hypot(a[0] - b[0], a[2] - b[2]); if (d > 0.3) K.push(len / d); });
    if (!K.length) return null; const k = K.reduce((x, y) => x + y, 0) / K.length;
    return { k, n: K.length, spread: K.length > 1 ? Math.sqrt(K.reduce((s, x) => s + (x - k) ** 2, 0) / (K.length - 1)) : null };
  }

  function ui(msg) {
    const w = st.walls, cur = w[w.length - 1], h = st.hit, done = w.filter(x => x.length >= 2).length;
    let t;
    if (st.phase === 'z0' || st.phase === 'z1') {
      const e = st.phase === 'z0' ? 0 : 1, n = st.zs[e].length;
      t = `<b>Schritt 1 – Zollstock:</b> Kreis genau auf den <b>${e ? 'Ende (200 cm)' : 'Anfang (0 cm)'}</b> des Zollstocks und „Punkt“ tippen${n ? ` (${n}× ✓ – noch 1–2 × für mehr Genauigkeit, dann „Weiter“)` : ''}. Ohne Zollstock: „Überspringen“.`;
    } else t = !h ? 'Handy langsam hin und her bewegen, bis Boden und Wände erkannt sind …'
      : h.kind === 'floor' ? 'Das ist der <b>Boden</b>. Auf eine <b>Wand</b> zielen (über den Möbeln).'
      : h.kind === 'flat' ? 'Das ist eine <b>waagrechte Fläche</b> (Tisch?). Auf die Wand darüber zielen.'
      : h.kind === 'ceil' ? 'Das ist die <b>Decke</b> – „Punkt“ tippen setzt die Raumhöhe.'
      : st.scan ? `🔵 <b>Wand ${w.length} wird abgetastet</b> – Kreis langsam über die ganze Wand fahren (hin und her, oben und unten, über den Möbeln). ${cur.length} Punkte.`
      : cur.length < 2 ? `<b>Wand ${w.length}:</b> „▶ Abtasten“ tippen und den Kreis über die Wand fahren – oder einzelne Punkte setzen.`
      : `Wand ${w.length}: ${cur.length} Punkte ✓ – „Nächste Wand“ (der Reihe nach rundherum).`;
    el('arMsg').innerHTML = msg || t;
    const sc = scale(st.zs, st.zlen, st.zp);
    el('arInfo').textContent = `${done} Wände` + (sc ? ` · Maßstab (${sc.n} Lage${sc.n > 1 ? 'n' : ''}) ${((sc.k - 1) * 100 >= 0 ? '+' : '') + ((sc.k - 1) * 100).toFixed(2).replace('.', ',')} %` : '') + (h ? ` · Abstand ${(h.dist).toFixed(2).replace('.', ',')} m` : '') + (st.ceilY !== null && st.floorY.length ? ` · Höhe ${(st.ceilY - med(st.floorY)).toFixed(2).replace('.', ',')} m` : '');
    el('arDot').className = 'ardot ' + (h ? h.kind : '') + (st.scan ? ' scan' : '');
    const zp = st.phase !== 'walls';
    el('arNext').textContent = zp ? (st.zs[st.phase === 'z0' ? 0 : 1].length ? 'Weiter ›' : 'Überspringen ›') : 'Nächste Wand ›';
    el('arNext').disabled = !zp && cur.length < 2;
    el('arScan').hidden = zp; el('arZmore').hidden = st.phase !== 'z1' || !st.zs[1].length; el('arScan').textContent = st.scan ? '⏸ Stopp' : '▶ Abtasten';
    el('arDone').disabled = done < 3;
  }

  async function start(onDone, opts = {}) {
    if (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)))
      return alert('AR wird auf diesem Gerät/Browser nicht unterstützt. Bitte Chrome auf einem Android-Handy mit „Google Play-Dienste für AR“ (ARCore) verwenden.');
    Object.assign(st, { walls: [[]], floorY: [], ceilY: null, hit: null, done: onDone, phase: opts.zollstock ? 'z0' : 'walls', zs: [[], []], zp: [], zlen: opts.zollstock || 0, scan: false, last: null, log: [], t0: Date.now() });
    const root = el('arUI'); root.hidden = false;
    let s;
    try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor', 'depth-sensing'], domOverlay: { root }, depthSensing: { usagePreference: ['cpu-optimized'], dataFormatPreference: ['luminance-alpha', 'float32'] } }); }
    catch (e) { try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root } }); } catch (e2) { root.hidden = true; return alert('AR konnte nicht gestartet werden: ' + e2.message); } }
    st.s = s;
    const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { xrCompatible: true });
    await s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
    const space = await s.requestReferenceSpace('local'), viewer = await s.requestReferenceSpace('viewer');
    let src; try { src = await s.requestHitTestSource({ space: viewer, entityTypes: ['plane', 'point'] }); } catch (e) { src = await s.requestHitTestSource({ space: viewer }); }
    s.addEventListener('end', () => { st.s = null; root.hidden = true; });
    const frame = (t, f) => {
      if (!st.s) return; s.requestAnimationFrame(frame);
      const bl = s.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const vp = f.getViewerPose(space); if (!vp) return; const cp = vp.transform.position; st.cam = cp;
      const r = f.getHitTestResults(src)[0], pose = r && r.getPose(space);
      if (!pose) { st.hit = null; return ui(); }
      const p = pose.transform.position, q = pose.transform.orientation;
      const ny = 1 - 2 * (q.x * q.x + q.z * q.z); // y-Achse der Trefferfläche = Flächennormale
      let kind = Math.abs(ny) < 0.5 ? 'wall' : ny > 0 ? (p.y < cp.y - 1.0 ? 'floor' : 'flat') : 'ceil'; // flat = Tisch, Kommode …
      if (kind === 'floor') { st.floorY.push(p.y); if (st.floorY.length > 300) st.floorY.shift(); }
      st.hit = { p: [p.x, p.y, p.z], kind, dist: Math.hypot(p.x - cp.x, p.y - cp.y, p.z - cp.z) };
      // automatisches Abtasten: nur Wandtreffer, alle 2 cm ein Punkt, nicht zu nah (Messrauschen) und nicht zu weit
      if (st.scan && kind === 'wall' && st.hit.dist > 0.4 && st.hit.dist < 5) {
        const l = st.last; if (!l || Math.hypot(p.x - l[0], p.y - l[1], p.z - l[2]) > 0.02) { st.walls[st.walls.length - 1].push([p.x, p.z]); st.last = [p.x, p.y, p.z]; st.log.push({ t: Math.round(t), w: st.walls.length - 1, p: [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)], c: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)] }); }
      }
      ui();
    };
    s.requestAnimationFrame(frame);
    ui();
  }

  function point() {
    const h = st.hit; if (!h) return;
    if (st.phase === 'z0' || st.phase === 'z1') { st.zs[st.phase === 'z0' ? 0 : 1].push(h.p); st.log.push({ z: st.phase, p: h.p }); navigator.vibrate?.(30); return ui(); }
    if (h.kind === 'ceil') { st.ceilY = h.p[1]; navigator.vibrate?.(30); return ui('Raumhöhe gesetzt ✓ – weiter mit den Wänden.'); }
    if (h.kind === 'floor' || h.kind === 'flat') return ui('Das ist keine Wand – bitte auf eine <b>Wand</b> zielen (über den Möbeln).');
    st.walls[st.walls.length - 1].push([h.p[0], h.p[2]]); st.log.push({ w: st.walls.length - 1, p: h.p, tap: 1 }); navigator.vibrate?.(20);
    ui();
  }
  function zMore() { if (st.phase !== 'z1' || !st.zs[1].length) return; st.zp.push(st.zs); st.zs = [[], []]; st.phase = 'z0'; ui(`Lage ${st.zp.length} gespeichert ✓ – Zollstock an anderer Stelle bzw. in anderer Richtung hinlegen, dann wieder Anfang und Ende antippen.`); }
  function toggleScan() { if (st.phase !== 'walls') return; st.scan = !st.scan; st.last = null; navigator.vibrate?.(st.scan ? 40 : 20); ui(); }
  function next() {
    if (st.phase === 'z0') { st.phase = 'z1'; return ui(); }
    if (st.phase === 'z1') { st.phase = 'walls'; const sc = scale(st.zs, st.zlen, st.zp); return ui(sc ? `Zollstock ✓ – AR-Maßstab wird um ${((sc.k - 1) * 100).toFixed(2).replace('.', ',')} % korrigiert. Jetzt die erste Wand abtasten.` : 'Ohne Zollstock weiter – jetzt die erste Wand abtasten.'); }
    const w = st.walls, cur = w[w.length - 1]; if (cur.length < 2) return;
    st.scan = false;
    if (w.length >= 2) { const a = fitLine(w[w.length - 2]), b = fitLine(cur); const ang = Math.acos(Math.min(1, Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1]))) * 57.3; if (ang < 10) return ui(`Wand ${w.length} ist fast parallel zur vorigen – gleiche Wand? Dann „Rückgängig“ tippen.`); }
    w.push([]); ui(`Wand ${w.length - 1} gespeichert ✓ – jetzt die nächste Wand (der Reihe nach rundherum).`);
  }
  function undo() {
    if (st.phase !== 'walls') { const z = st.zs[st.phase === 'z0' ? 0 : 1]; z.pop(); return ui(); }
    const w = st.walls, cur = w[w.length - 1];
    if (cur.length) { cur.splice(st.scan || cur.length > 20 ? 0 : cur.length - 1); st.scan = false; } else if (w.length > 1) w.pop(); // abgetastete Wand ganz neu
    ui('Rückgängig ✓');
  }
  // Ergebnis: Polygon (mit Zollstock-Maßstab), Genauigkeit je Wand aus der Streuung der Punkte
  function solve(walls, zs, zlen, floorY, ceilY, zp = []) {
    const g = polygon(walls); if (g.err) return g;
    const sc = scale(zs, zlen, zp), k = sc ? sc.k : 1, n = g.P.length;
    const P = g.P.map(p => [p[0] * k, p[1] * k]), fy = med(floorY), h = ceilY !== null && fy !== null ? (ceilY - fy) * k : null;
    // Wandlänge i = Ecke i → i+1; Unsicherheit aus Versatz der beiden Nachbarwände (Punktstreuung/√n) und Maßstab
    const sig = P.map((p, i) => { const a = g.L[(i + n - 1) % n], b = g.L[(i + 1) % n], L = Math.hypot(P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1]); return Math.hypot(a.sOff, b.sOff, sc ? L * 0.003 / Math.sqrt(sc.n) : L * 0.01) * k; });
    return { poly: P, height: h && h > 1.8 && h < 6 ? h : null, rms: Math.max(...g.L.map(l => l.rms)), sigma: sig, scale: sc, lines: g.L.map(l => ({ used: l.used, total: l.total, rms: l.rms, span: l.span })) };
  }
  function finish() {
    const walls = st.walls.filter(x => x.length >= 2); if (walls.length < 3) return;
    const r = solve(walls, st.zs, st.zlen, st.floorY, st.ceilY, st.zp); if (r.err) return ui(r.err);
    // Rohdaten merken (letzte 5 Messungen) – für Vergleich mit Maßband und Verbesserungen
    try { const L = JSON.parse(localStorage.getItem('raumplan-ar-log') || '[]'); L.push({ t: st.t0, zlen: st.zlen, zs: st.zs, zp: st.zp, floorY: med(st.floorY), ceilY: st.ceilY, walls, log: st.log.slice(-4000), result: { poly: r.poly, sigma: r.sigma, scale: r.scale } }); localStorage.setItem('raumplan-ar-log', JSON.stringify(L.slice(-5))); } catch (e) { }
    st.s && st.s.end();
    st.done && st.done(r);
  }
  function cancel() { st.s && st.s.end(); }
  return { start, point, next, undo, finish, cancel, toggleScan, zMore, fitLine, polygon, solve, scale };
})();
if (typeof module !== 'undefined') module.exports = AR;
