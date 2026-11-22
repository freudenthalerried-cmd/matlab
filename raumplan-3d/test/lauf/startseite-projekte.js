// Test Startseite und Projekte (Handy-Viewport): Neues Projekt → Aufnahme (simuliert) → Liste → Neuladen → Löschen → Altbestand.
const { chromium, devices } = require('playwright');
const SP = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('error: ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('dialog', d => d.accept());
  const URL = 'http://localhost:8765/raumplan-3d/index.html';
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.screenshot({ path: SP + '/s0-start.png' });
  const t0 = await p.evaluate(() => ({ start: !document.querySelector('#start').hidden, text: document.querySelector('#start h1').innerText, n: rp3d.projekte.length, akt: rp3d.aktId }));
  // Ohne AR (PC/Headless): Hinweis statt Absturz
  await p.click('#start button[data-s="scan"]'); await p.waitForTimeout(400);
  const ohneAr = await p.evaluate(() => (document.querySelector('#start .warn') || {}).innerText || '');
  // Neues Projekt: Raum aufnehmen (Kamera durch simulierten Scan ersetzt)
  await p.evaluate(() => { window.rp3dTestScan = async () => (await import('./test/synth.js')).synthRoh({ zeilenUnten: true }); });
  await p.click('#start button[data-s="scan"]');
  await p.waitForFunction(() => rp3d.plan.aufmass && rp3d.plan.aufmass.art === 'scan' && !document.querySelector('#sheet').hidden, null, { timeout: 90000 });
  await p.waitForTimeout(500);
  const t1 = await p.evaluate(() => ({ start: !document.querySelector('#start').hidden, titel: document.querySelector('#shTitle').innerText, name: rp3d.plan.name, n: rp3d.projekte.length, w: rp3d.plan.walls.map(w => Math.round(w.innen * 100)), undoAus: document.querySelector('#bUndo').disabled }));
  await p.screenshot({ path: SP + '/s1-nachAufnahme.png' });
  // zweite Aufnahme → zweites Projekt mit eigenem Namen
  await p.click('#shX'); await p.click('#tools button[data-t="menu"]'); await p.click('#shBody button[data-m="start"]'); await p.waitForTimeout(300);
  await p.click('#start button[data-s="scan"]');
  await p.waitForFunction(() => rp3d.projekte.length === 2 && !document.querySelector('#sheet').hidden, null, { timeout: 90000 });
  // Beispielwohnung als Projekt, Möbel dazu
  await p.evaluate(() => rp3d.zeigeStart()); await p.click('#start button[data-s="beispiel"]'); await p.waitForTimeout(400);
  await p.evaluate(() => rp3d.addItem('sessel')); await p.waitForTimeout(600);
  await p.evaluate(() => rp3d.zeigeStart()); await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/s2-liste.png' });
  const t2 = await p.evaluate(() => rp3d.projekte.map(q => [q.name, q.m2]));
  // Neuladen: Startseite, Projekt mit Fotos und Punktwolke öffnen
  await p.reload(); await p.waitForTimeout(1500);
  const t3 = await p.evaluate(() => ({ start: !document.querySelector('#start').hidden, n: rp3d.projekte.length, vorschau: rp3d.plan.name }));
  await p.click('#start .pr:nth-child(2) button[data-o]'); await p.waitForTimeout(2000);
  const t4 = await p.evaluate(() => ({ name: rp3d.plan.name, wolke: rp3d.plan.wolke && rp3d.plan.wolke.n, fotos: rp3d.plan.walls.filter(w => w.fotoA || w.fotoB).length }));
  await p.evaluate(() => rp3d.setMode('gehen')); await p.waitForTimeout(600);
  await p.screenshot({ path: SP + '/s3-geoeffnet.png' });
  // Löschen
  await p.evaluate(() => rp3d.zeigeStart()); await p.click('#start .pr:nth-child(2) button[data-del]'); await p.waitForTimeout(600);
  const t5 = await p.evaluate(() => ({ n: rp3d.projekte.length, namen: rp3d.projekte.map(q => q.name), akt: rp3d.aktId, start: !document.querySelector('#start').hidden }));
  console.log(JSON.stringify({ t0, ohneAr, t1, t2, t3, t4, t5 }, null, 1));
  // Altbestand aus Version 1.2
  const ctx2 = await b.newContext({ ...devices['Pixel 7'] }); const q = await ctx2.newPage();
  q.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await q.goto(URL); await q.waitForTimeout(800);
  await q.evaluate(async () => { const { beispiel } = await import('./daten.js'); const pl = beispiel(); pl.name = 'Alter Plan'; localStorage.clear(); localStorage.setItem('rp3d-plan', JSON.stringify(pl)); });
  await q.reload(); await q.waitForTimeout(1200);
  console.log('Altbestand:', JSON.stringify(await q.evaluate(() => ({ n: rp3d.projekte.length, name: rp3d.projekte[0] && rp3d.projekte[0].name, akt: !!rp3d.aktId, plan: rp3d.plan.name }))));
  console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
