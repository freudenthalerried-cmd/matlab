// Abbruch einer Aufnahme ohne Tiefe → Startseite zeigt Warnung, Kennzahlen und Kopier-Knopf
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8765/raumplan-3d/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(async () => { const { installiere } = await import('./test/xr-attrappe.js'); await installiere({ tiefeNie: true }); });
  await p.click('#start button[data-s="scan"]'); await p.waitForTimeout(6000);
  await p.click('#arB2'); await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({ start: !document.querySelector('#start').hidden, warn: (document.querySelector('#start .warn') || {}).innerText, letzte: (document.querySelector('#letzte') || {}).innerText, knopf: !!document.querySelector('#start button[data-s="kopie"]'), version: document.querySelector('#start h1 small').innerText }));
  await p.click('#start button[data-s="kopie"]'); await p.waitForTimeout(300);
  r.knopfText = await p.evaluate(() => document.querySelector('#start button[data-s="kopie"]').innerText);
  r.zwischenablage = (await p.evaluate(() => navigator.clipboard.readText().catch(e => 'nicht lesbar: ' + e.message))).slice(0, 90);
  await p.screenshot({ path: __dirname + '/z-abbruch.png' });
  console.log(JSON.stringify(r, null, 1)); console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
