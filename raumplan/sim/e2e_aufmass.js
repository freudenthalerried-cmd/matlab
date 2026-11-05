// Ende-zu-Ende-Test Aufmaß AR mit simulierter WebXR-Sitzung (kein Gerät nötig).
// Wahrer Raum 4,20 × 3,60, RH 2,55, Fenster 1,20/1,40 Br 0,90, Tür 0,90/2,05, Dachschräge Kniestock 1,00 m / 38°.
// Die „AR-Welt“ ist um K = 1,2 % zu groß (typischer Maßstabsfehler), Zielen hat ±3 mm Rauschen.
// Aufruf: NP=/opt/node-tools/node_modules URL=http://127.0.0.1:8766/aufmass.html node sim/e2e_aufmass.js
const { chromium } = require((process.env.NP || '/opt/node-tools/node_modules') + '/playwright');
const K = 1.012, NOISE = +(process.env.NOISE || 0.003);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 412, height: 880 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(() => {
    const cam = { o: [2.1, 1.4, 1.8], d: [0, -1, 0] }; window.__cam = cam;
    const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); }, cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const mat = () => { const z = norm(cam.d.map(v => -v)); let x = cr([0, 1, 0], z); if (Math.hypot(...x) < 1e-6) x = [1, 0, 0]; x = norm(x); const y = cr(z, x); return [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, cam.o[0], cam.o[1], cam.o[2], 1]; };
    const inv = m => { const R = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]], t = [m[12], m[13], m[14]]; return [R[0], R[3], R[6], 0, R[1], R[4], R[7], 0, R[2], R[5], R[8], 0, -(R[0] * t[0] + R[1] * t[1] + R[2] * t[2]), -(R[3] * t[0] + R[4] * t[1] + R[5] * t[2]), -(R[6] * t[0] + R[7] * t[1] + R[8] * t[2]), 1]; };
    const proj = [1.6, 0, 0, 0, 0, 0.75, 0, 0, 0, 0, -1, -1, 0, 0, -0.2, 0];
    window.XRWebGLLayer = class { constructor() { this.framebuffer = null; } };
    const frame = { getViewerPose: () => { const m = mat(); return { transform: { matrix: m, position: { x: cam.o[0], y: cam.o[1], z: cam.o[2] } }, views: [{ projectionMatrix: proj, transform: { inverse: { matrix: inv(m) } } }] }; },
      getHitTestResults: () => { const d = cam.d; if (d[1] > -0.05) return []; const t = -cam.o[1] / d[1]; const P = { x: cam.o[0] + d[0] * t, y: 0, z: cam.o[2] + d[2] * t }; return [{ getPose: () => ({ transform: { position: P, orientation: { x: 0, y: 0, z: 0, w: 1 } } }) }]; } };
    const L = {}; const sess = { renderState: {}, enabledFeatures: [], updateRenderState(o) { this.renderState = o; return Promise.resolve(); }, requestReferenceSpace: async () => ({}), requestHitTestSource: async () => ({}),
      addEventListener: (e, f) => (L[e] = L[e] || []).push(f), requestAnimationFrame: cb => setTimeout(() => cb(performance.now(), frame), 16), end() { (L.end || []).forEach(f => f()); } };
    Object.defineProperty(navigator, 'xr', { value: { isSessionSupported: async () => true, requestSession: async () => sess } });
  });
  await p.goto(process.env.URL || 'http://127.0.0.1:8766/aufmass.html');
  await p.evaluate(() => localStorage.clear());
  const wait = ms => p.waitForTimeout(ms);
  let sd = 11; const rn = () => ((sd = sd * 16807 % 2147483647) / 2147483647 - 0.5) * 2 * Math.sqrt(3); // σ = 1
  const aim = async (t, o) => { const T = t.map(v => v * K + NOISE * rn()); await p.evaluate(([T, o]) => { const c = window.__cam; c.o = o; const d = T.map((v, i) => v - o[i]), l = Math.hypot(...d); c.d = d.map(v => v / l); }, [T, o || [2.1 * K, 1.4, 1.8 * K]]); await wait(60); };
  const tap = async () => { await p.dispatchEvent('#arMain', 'pointerdown'); await p.dispatchEvent('#arMain', 'pointerup'); await wait(40); };
  const msg = async () => p.evaluate(() => document.querySelector('#arStep').textContent + ' | ' + document.querySelector('#arMsg').innerText);
  await p.click('#go'); await wait(300);
  await aim([2.0, 0, 1.5]); await wait(900); console.log('Boden:', await msg());
  // Zollstock 2× (zweite Lage quer)
  for (const [a, c] of [[[0.8, 0, 0.9], [2.8, 0, 0.9]], [[1.0, 0, 0.7], [1.0, 0, 2.7]]]) { await aim(a, [a[0] * K + 0.1, 0.45, a[2] * K]); await tap(); await aim(c, [c[0] * K - 0.1, 0.45, c[2] * K]); await tap(); }
  console.log('Zollstock:', await msg());
  await p.click('#arNext');
  const T = [[0, 0], [4.2, 0], [4.2, 3.6], [0, 3.6]];
  for (let i = 0; i < 4; i++) { const a = T[i], c = T[(i + 1) % 4];
    for (const t of [0.12, 0.38, 0.62, 0.88]) await (async () => { await aim([a[0] + (c[0] - a[0]) * t, 0, a[1] + (c[1] - a[1]) * t]); await tap(); })();
    if (i === 1) { await aim([4.2 - 0.6, 0.55, 1.8]); await tap(); } // Fehlklick auf Möbel (Kommode)
    if (i < 3) await p.click('#arNext'); }
  await p.click('#arTools [data-t="close"]'); await wait(100); console.log('Schließen:', await msg());
  // Raumhöhe an Wand 3 (y = 3,6) – Schräge liegt an Wand 1 (z = 0)
  await aim([2.5, 2.55, 3.6]); await tap(); await aim([1.0, 2.55, 3.6]); await tap(); console.log('Höhe:', await msg());
  // Fenster auf Wand 3: ab Ecke (4,2|3,6) Richtung (0|3,6): pos 1,0 → x = 3,2 … 2,0; Br 0,90 … 2,30
  await p.click('#arTools [data-t="fenster"]'); await aim([3.2, 0.9, 3.6]); await tap(); await aim([2.0, 2.3, 3.6]); await tap(); console.log('Fenster:', await msg());
  // Tür auf Wand 4 (x = 0) von (0|3,6) nach (0|0): pos 0,5 → z 3,1 … 2,2
  await p.click('#arTools [data-t="tuer"]'); await aim([0, 0, 3.1]); await tap(); await aim([0, 2.05, 2.2]); await tap(); console.log('Tür:', await msg());
  // Dachschräge: Kniestock an Wand 1 (z=0) y=1,0; Punkt auf Seitenwand 2 (x=4,2) bei z=1,2: y = 1 + tan38°·1,2
  await p.click('#arTools [data-t="schraege"]'); await aim([2.5, 1.0, 0]); await tap(); await aim([4.2, 1 + Math.tan(38 / 57.2958) * 1.2, 1.2]); await tap(); console.log('Schräge:', await msg());
  await p.click('#arNext'); await wait(400);
  const res = await p.evaluate(() => document.querySelector('#res').innerText); console.log('\n=== ERGEBNIS ===\n' + res.slice(0, 1500));
  await p.screenshot({ path: (process.env.OUT || '/tmp') + '/e2e_aufmass.png', fullPage: true });
  console.log('Fehler:', errs); await b.close();
})();
