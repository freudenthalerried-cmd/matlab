// Ecken-Modus (starteAufmass) gegen die WebXR-Attrappe + Wechsel aus der Aufnahme ohne Tiefe. Rauchtest: läuft ohne Absturz bis zum Modell.
const { chromium, devices } = require('playwright');
const SP = __dirname, VAR = process.argv[2] || 'ecken';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('error: ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8765/raumplan-3d/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(async o => { const { installiere } = await import('./test/xr-attrappe.js'); await installiere(o); }, VAR === 'wechsel' ? { tiefeNie: true } : {});
  const txt = () => p.evaluate(() => `${document.querySelector('#arStep').innerText} | ${document.querySelector('#arLive').innerText} | ${document.querySelector('#arInfo').innerText} | B1=${document.querySelector('#arB1').innerText}${document.querySelector('#arB1').disabled ? '(aus)' : ''} B2=${document.querySelector('#arB2').innerText} B3=${document.querySelector('#arB3').hidden ? '-' : document.querySelector('#arB3').innerText}`);
  if (VAR === 'wechsel') {
    await p.click('#start button[data-s="scan"]');
    await p.waitForFunction(() => !document.querySelector('#arB3').hidden, null, { timeout: 30000 });
    console.log('Aufnahme ohne Tiefe:', await txt());
    await p.click('#arB3'); await p.waitForTimeout(1500);
  } else { await p.click('#start button[data-s="ecken"]'); await p.waitForTimeout(1500); }
  console.log('Ecken-Modus Start:', await txt());
  await p.waitForFunction(() => !document.querySelector('#arB1').disabled, null, { timeout: 20000 });
  console.log('Boden:', await txt());
  await p.click('#arB1'); await p.waitForTimeout(300);
  let ecken = 0;
  for (let i = 0; i < 80 && ecken < 4; i++) { await p.waitForTimeout(150); const ok = await p.evaluate(() => !document.querySelector('#arB1').disabled && /Ecke setzen/.test(document.querySelector('#arB1').innerText)); if (ok) { await p.click('#arB1'); ecken++; await p.waitForTimeout(250); } }
  console.log('nach', ecken, 'Ecken:', await txt());
  await p.click('#arB3'); await p.waitForTimeout(300); console.log('Höhe:', await txt());
  await p.click('#arB2'); await p.waitForTimeout(300); console.log('Öffnungen:', await txt());
  await p.click('#arB2');
  await p.waitForFunction(() => document.querySelector('#warte').hidden && document.querySelector('#arUI').hidden && (!document.querySelector('#sheet').hidden || !document.querySelector('#start').hidden), null, { timeout: 60000 }).catch(() => console.log('Zeitüberschreitung'));
  await p.waitForTimeout(400);
  console.log(JSON.stringify(await p.evaluate(() => ({ titel: document.querySelector('#shTitle').innerText, blatt: !document.querySelector('#sheet').hidden, start: !document.querySelector('#start').hidden, name: rp3d.plan.name, w: rp3d.plan.walls.map(w => Math.round((w.innen || 0) * 100)), H: rp3d.plan.height, fotos: rp3d.plan.walls.filter(w => w.fotoA || w.fotoB).length, proj: rp3d.projekte.length }))));
  await p.screenshot({ path: `${SP}/y-${VAR}.png` });
  console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
