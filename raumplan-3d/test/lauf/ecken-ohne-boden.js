// Ecken-Modus ohne Bodentreffer: „Boden schätzen“ → Ecken → Modell mit Hinweis
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8765/raumplan-3d/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(async () => { const { installiere } = await import('./test/xr-attrappe.js'); await installiere({ ohneTreffer: true }); });
  await p.click('#start button[data-s="ecken"]');
  await p.waitForFunction(() => !document.querySelector('#arB3').hidden && /schätzen/.test(document.querySelector('#arB3').innerText), null, { timeout: 40000 });
  console.log('ohne Boden:', await p.evaluate(() => document.querySelector('#arTxt').innerText.slice(0, 70) + ' | B3=' + document.querySelector('#arB3').innerText));
  await p.click('#arB3'); await p.waitForTimeout(300);
  let ecken = 0;
  for (let i = 0; i < 80 && ecken < 4; i++) { await p.waitForTimeout(150); const ok = await p.evaluate(() => !document.querySelector('#arB1').disabled && /Ecke setzen/.test(document.querySelector('#arB1').innerText)); if (ok) { await p.click('#arB1'); ecken++; await p.waitForTimeout(250); } }
  await p.click('#arB3'); await p.waitForTimeout(300); await p.click('#arB2'); await p.waitForTimeout(300); await p.click('#arB2');
  await p.waitForFunction(() => document.querySelector('#warte').hidden && document.querySelector('#arUI').hidden && !document.querySelector('#sheet').hidden, null, { timeout: 60000 }).catch(() => console.log('Zeitüberschreitung'));
  console.log(JSON.stringify(await p.evaluate(() => ({ ecken: rp3d.plan.walls.length, titel: document.querySelector('#shTitle').innerText, hinweise: rp3d.plan.aufmass.hinweise, version: 0 }))));
  console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
