'use strict';
/* Raumplan – AR-Aufmaß ohne Marken (WebXR, Chrome auf Android mit ARCore).
   Je Wand 2–4 Punkte antippen (über den Möbeln) → Ausgleichsgerade je Wand → Ecken = Schnitt benachbarter Wände.
   Decke antippen → Raumhöhe. Genauigkeit typisch ±1–2 cm. */
const AR = (() => {
  const st = { s: null, walls: [[]], floorY: [], ceilY: null, hit: null, cam: null, done: null };
  const el = id => document.getElementById(id);
  const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };

  // Gerade durch Punkte (x,z) – Hauptachse (orthogonale Regression); liefert Punkt, Richtung, Streuung
  function fitLine(P) {
    const n = P.length, mx = P.reduce((s, p) => s + p[0], 0) / n, mz = P.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, szz = 0, sxz = 0; P.forEach(p => { const a = p[0] - mx, b = p[1] - mz; sxx += a * a; szz += b * b; sxz += a * b; });
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), d = [Math.cos(th), Math.sin(th)];
    const res = P.map(p => (p[0] - mx) * -d[1] + (p[1] - mz) * d[0]);
    return { c: [mx, mz], d, rms: Math.sqrt(res.reduce((s, r) => s + r * r, 0) / n) };
  }
  function cross(A, B) { // Schnittpunkt zweier Geraden
    const den = A.d[0] * B.d[1] - A.d[1] * B.d[0]; if (Math.abs(den) < Math.sin(10 / 57.3)) return null;
    const t = ((B.c[0] - A.c[0]) * B.d[1] - (B.c[1] - A.c[1]) * B.d[0]) / den;
    return [A.c[0] + A.d[0] * t, A.c[1] + A.d[1] * t];
  }
  // Wände → Polygon (Ecke i = Schnitt Wand i-1 / Wand i)
  function polygon(walls) {
    const L = walls.map(fitLine), n = L.length, P = [];
    for (let i = 0; i < n; i++) { const p = cross(L[(i + n - 1) % n], L[i]); if (!p) return { err: `Wand ${i} und Wand ${i + 1} sind fast parallel – war das dieselbe Wand? Dann zuletzt „Rückgängig“.` }; P.push(p); }
    return { P, L };
  }

  function ui(msg) {
    const w = st.walls, cur = w[w.length - 1], h = st.hit;
    el('arMsg').innerHTML = msg || (!h ? 'Handy langsam hin und her bewegen, bis der Boden erkannt ist …'
      : h.kind === 'floor' ? 'Das ist der <b>Boden</b>. Auf eine <b>Wand</b> zielen (über den Möbeln).'
      : h.kind === 'flat' ? 'Das ist eine <b>waagrechte Fläche</b> (Tisch?). Auf die Wand darüber zielen.'
      : h.kind === 'ceil' ? 'Das ist die <b>Decke</b> – „Punkt“ tippen setzt die Raumhöhe.'
      : cur.length < 2 ? `Wand ${w.length}: Fadenkreuz auf die Wand, „Punkt“ tippen – ${cur.length ? 'jetzt ein Stück weiter entlang der Wand' : 'erster Punkt nahe einer Ecke'}.`
      : `Wand ${w.length}: ${cur.length} Punkte ✓. Noch einer weiter weg macht es genauer – sonst „Nächste Wand“.`);
    el('arInfo').textContent = `${w.filter(x => x.length >= 2).length} Wände` + (h ? ` · Abstand ${(h.dist).toFixed(2).replace('.', ',')} m` : '') + (st.ceilY !== null && st.floorY.length ? ` · Höhe ${(st.ceilY - med(st.floorY)).toFixed(2).replace('.', ',')} m` : '');
    el('arDot').className = 'ardot ' + (h ? h.kind : '');
    el('arNext').disabled = cur.length < 2; el('arDone').disabled = w.filter(x => x.length >= 2).length < 3;
  }

  async function start(onDone) {
    if (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)))
      return alert('AR wird auf diesem Gerät/Browser nicht unterstützt. Bitte Chrome auf einem Android-Handy mit „Google Play-Dienste für AR“ (ARCore) verwenden.');
    st.walls = [[]]; st.floorY = []; st.ceilY = null; st.hit = null; st.done = onDone;
    const root = el('arUI'); root.hidden = false;
    let s;
    try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root } }); }
    catch (e) { root.hidden = true; return alert('AR konnte nicht gestartet werden: ' + e.message); }
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
      ui();
    };
    s.requestAnimationFrame(frame);
    ui();
  }

  function point() {
    const h = st.hit; if (!h) return;
    if (h.kind === 'ceil') { st.ceilY = h.p[1]; navigator.vibrate?.(30); return ui('Raumhöhe gesetzt ✓ – weiter mit den Wänden.'); }
    if (h.kind === 'floor' || h.kind === 'flat') return ui('Das ist keine Wand – bitte auf eine <b>Wand</b> zielen (über den Möbeln).');
    st.walls[st.walls.length - 1].push([h.p[0], h.p[2]]); navigator.vibrate?.(20);
    ui();
  }
  function next() {
    const w = st.walls, cur = w[w.length - 1]; if (cur.length < 2) return;
    if (w.length >= 2) { const a = fitLine(w[w.length - 2]), b = fitLine(cur); const ang = Math.acos(Math.min(1, Math.abs(a.d[0] * b.d[0] + a.d[1] * b.d[1]))) * 57.3; if (ang < 10) return ui(`Wand ${w.length} ist fast parallel zur vorigen – gleiche Wand? Dann „Rückgängig“ tippen.`); }
    w.push([]); ui(`Wand ${w.length - 1} gespeichert ✓ – jetzt die nächste Wand (der Reihe nach rundherum).`);
  }
  function undo() {
    const w = st.walls; if (w[w.length - 1].length) w[w.length - 1].pop(); else if (w.length > 1) w.pop();
    ui('Letzten Punkt entfernt.');
  }
  function finish() {
    const walls = st.walls.filter(x => x.length >= 2); if (walls.length < 3) return;
    const g = polygon(walls); if (g.err) return ui(g.err);
    const fy = med(st.floorY), h = st.ceilY !== null && fy !== null ? st.ceilY - fy : null;
    const rms = Math.max(...g.L.map(l => l.rms));
    st.s && st.s.end();
    st.done && st.done({ poly: g.P, height: h && h > 1.8 && h < 6 ? h : null, rms });
  }
  function cancel() { st.s && st.s.end(); }
  return { start, point, next, undo, finish, cancel, fitLine, polygon };
})();
if (typeof module !== 'undefined') module.exports = AR;
