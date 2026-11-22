// Echte Aufnahme (starteScan) gegen die WebXR-Attrappe: Startseite → Raum aufnehmen → Fertig → Modell. Aufruf: node t8.js [variante]
const { chromium, devices } = require('playwright');
const SP = __dirname, VAR = process.argv[2] || 'normal';
const OPTS = { normal: {}, s25: { zeilenUnten: true }, ohneKamera: { ohneKamera: true }, wurf: { werfen: 40 }, immerEmu: { immerEmu: true }, zittern: { zittern: 2.5 }, tiefeSpaet: { tiefeSpaet: 200 }, tiefeNie: { tiefeNie: true }, tiefeWirft: { tiefeWirft: true }, stehen: { stehen: true } }[VAR];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('error: ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8765/raumplan-3d/index.html'); await p.waitForTimeout(1200);
  await p.evaluate(async o => { const { installiere } = await import('./test/xr-attrappe.js'); await installiere(o); }, OPTS);
  await p.reload(); await p.waitForTimeout(800);
  await p.evaluate(async o => { const { installiere } = await import('./test/xr-attrappe.js'); await installiere(o); }, OPTS);
  await p.waitForTimeout(300);
  await p.click('#start button[data-s="scan"]');
  await p.waitForTimeout(1500);
  const lauf = [];
  for (let i = 0; i < 60; i++) {
    const z = await p.evaluate(() => ({ b: xrAttrappe.bilder, n: xrAttrappe.planLaenge, live: document.querySelector('#arLive').innerText, info: document.querySelector('#arInfo').innerText, txt: document.querySelector('#arTxt').innerText.slice(0, 40), ui: !document.querySelector('#arUI').hidden, fertig: !document.querySelector('#arB1').disabled, gruen: document.querySelectorAll('#arCov i.an').length }));
    if (i < 3 || i % 6 === 0) lauf.push(`${z.b}/${z.n} | ${z.live} | ${z.info} | ${z.txt}`);
    if (i === 4) await p.screenshot({ path: `${SP}/x-${VAR}-aufnahme.png` });
    if (z.b >= z.n) { lauf.push(`ENDE ${z.b}/${z.n} | ${z.live} | ${z.info} | Fertig-Knopf ${z.fertig} | Richtungen ${z.gruen}/36`); break; }
    await p.waitForTimeout(500);
  }
  console.log(VAR + '\n  ' + lauf.join('\n  '));
  const stat = await p.evaluate(() => ({ abfragen: xrAttrappe.abfragen, maxMs: Math.round(xrAttrappe.max) }));
  await p.click('#arB1').catch(e => console.log('  Fertig nicht tippbar: ' + e.message.slice(0, 80)));
  await p.waitForFunction(() => document.querySelector('#warte').hidden && document.querySelector('#arUI').hidden && (!document.querySelector('#sheet').hidden || !document.querySelector('#start').hidden), null, { timeout: 90000 }).catch(() => console.log('  Zeitüberschreitung beim Auswerten'));
  await p.waitForTimeout(500);
  const erg = await p.evaluate(() => ({ titel: document.querySelector('#shTitle').innerText, blatt: !document.querySelector('#sheet').hidden, start: !document.querySelector('#start').hidden, name: rp3d.plan.name, w: rp3d.plan.walls.map(w => Math.round((w.innen || 0) * 100)), wolke: rp3d.plan.wolke && rp3d.plan.wolke.n, fotos: rp3d.plan.walls.filter(w => w.fotoA || w.fotoB).length, letzte: JSON.parse(localStorage.getItem('rp3d-letzte') || 'null'), text: (document.querySelector('#shBody').innerText || '').slice(0, 160) }));
  console.log('  ' + JSON.stringify({ ...stat, ...erg }));
  await p.screenshot({ path: `${SP}/x-${VAR}-ergebnis.png` });
  console.log('  ' + (errs.join('\n  ') || 'keine Fehler'));
  await b.close();
})();
