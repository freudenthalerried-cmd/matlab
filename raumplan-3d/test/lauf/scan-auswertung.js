// Test Scan-Auswertung mit simuliertem Roh-Scan (Tiefe + Bild + Lage). Aufruf: node t4.js [variante]
const { chromium } = require('playwright');
const SP = __dirname, VAR = process.argv[2] || 'normal';
const OPTS = { normal: {}, s25: { zeilenUnten: true }, kopf: { zeilenUnten: true, bildKopf: true }, sauber: { rauschen: 0 }, laut: { rauschen: 0.03 }, zu: { tuerOffen: false }, dach: { dach: true } }[VAR];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('error: ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8765/raumplan-3d/index.html');
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async (opts) => {
    const { synthRoh, WAHR, HOEHE2 } = await import('./test/synth.js');
    const t0 = performance.now(); const roh = await synthRoh(opts); const t1 = performance.now();
    const plan = await rp3d.ladeScan(roh, 'Testscan');
    const ms = Math.round(performance.now() - t1);
    if (!plan) return { fehler: document.querySelector('#shBody').innerText.slice(0, 200), synthMs: Math.round(t1 - t0) };
    const soll = WAHR.map((q, i) => { const n = WAHR[(i + 1) % WAHR.length]; return +(Math.hypot(n[0] - q[0], n[1] - q[1]) * 100).toFixed(0); });
    const ist = plan.walls.map(w => +(w.innen * 100).toFixed(1));
    const A = pl => Math.abs(pl.reduce((s, q, i) => { const n = pl[(i + 1) % pl.length]; return s + q[0] * n[1] - n[0] * q[1]; }, 0)) / 2;
    return { synthMs: Math.round(t1 - t0), ms, kf: roh.kf.length, soll, ist, flaecheSoll: +A(WAHR).toFixed(2), flaecheIst: +A(plan.rooms[0].poly).toFixed(2), H: plan.height, sollH: HOEHE2, hq: plan.hoeheQuelle,
      fotos: plan.walls.filter(w => w.fotoA || w.fotoB).length, boden: !!plan.rooms[0].foto, wolke: plan.wolke && plan.wolke.n, info: plan.aufmass.info, hinweise: plan.aufmass.hinweise };
  }, OPTS);
  console.log(VAR, JSON.stringify(r));
  await p.waitForTimeout(600);
  if (!r.fehler) {
    await p.click('#shX');
    await p.screenshot({ path: `${SP}/k-${VAR}-haus.png` });
    await p.evaluate(() => rp3d.setMode('gehen')); await p.waitForTimeout(500);
    await p.screenshot({ path: `${SP}/k-${VAR}-gehen.png` });
    await p.evaluate(() => rp3d.setMode('plan')); await p.waitForTimeout(500);
    await p.screenshot({ path: `${SP}/k-${VAR}-plan.png` });
  }
  console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
