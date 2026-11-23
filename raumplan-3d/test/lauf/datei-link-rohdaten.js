// Test: Scan → Projektdatei → auf "anderem Gerät" öffnen (Datei und ?plan=-Link) → Rohdaten neu auswerten. Handy-Viewport.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const SP = __dirname, TMP = '/home/user/matlab/raumplan-3d/raeume-test.json';
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const neu = async () => { const ctx = await b.newContext({ ...devices['Pixel 7'], acceptDownloads: true }); const p = await ctx.newPage(); p.on('console', m => { if (m.type() === 'error') errs.push('error: ' + m.text()); }); p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); return p; };
  // Gerät 1: scannen
  const p1 = await neu();
  await p1.goto('http://localhost:8765/raumplan-3d/index.html'); await p1.waitForTimeout(1500);
  await p1.click('#start button[data-s="beispiel"]');
  await p1.click('#tools button[data-t="menu"]'); await p1.waitForTimeout(200);
  await p1.screenshot({ path: SP + '/h1-menu.png' });
  const r1 = await p1.evaluate(async () => { const { synthRoh } = await import('./test/synth.js'); const roh = await synthRoh({ zeilenUnten: true }); const pl = await rp3d.ladeScan(roh, 'Büro Test'); return { w: pl.walls.map(w => +(w.innen * 100).toFixed(0)), wolke: pl.wolke.n }; });
  await p1.waitForTimeout(500);
  await p1.screenshot({ path: SP + '/h2-ergebnis.png' });
  // Kontrollmaß +1,5 % auf Wand 1
  await p1.click('#shBody details:nth-of-type(2) summary');
  await p1.selectOption('#kmWand', '0'); await p1.fill('#kmCm', String(Math.round(r1.w[0] * 1.015)));
  await p1.click('button[data-km="1"]'); await p1.waitForTimeout(300);
  const k = await p1.evaluate(() => ({ korr: rp3d.plan.aufmass.korr, H: rp3d.plan.height }));
  // Projektdatei
  const [dl] = await Promise.all([p1.waitForEvent('download'), p1.evaluate(() => rp3d.exportPlan())]);
  const pfad = await dl.path(), text = fs.readFileSync(pfad, 'utf8');
  // Rohdaten
  const [dl2] = await Promise.all([p1.waitForEvent('download'), p1.click('#shBody button[data-m="roh"]')]);
  const rohText = fs.readFileSync(await dl2.path(), 'utf8');
  await p1.click('#shX'); await p1.evaluate(() => rp3d.setMode('gehen')); await p1.waitForTimeout(500);
  await p1.screenshot({ path: SP + '/h3-gehen.png' });
  console.log(JSON.stringify({ r1, k, dateiMB: +(text.length / 1e6).toFixed(2), rohMB: +(rohText.length / 1e6).toFixed(2), name: dl.suggestedFilename(), rohName: dl2.suggestedFilename() }));
  // Gerät 2: Datei öffnen
  const p2 = await neu();
  await p2.goto('http://localhost:8765/raumplan-3d/index.html'); await p2.waitForTimeout(1200);
  await p2.setInputFiles('#file', { name: 'raum.txt', mimeType: 'text/plain', buffer: Buffer.from(text) });
  await p2.waitForTimeout(1500);
  const r2 = await p2.evaluate(() => ({ name: rp3d.plan.name, w: rp3d.plan.walls.map(w => +(w.innen * 100).toFixed(0)), wolke: rp3d.plan.wolke && rp3d.plan.wolke.n, fotos: rp3d.plan.walls.filter(w => w.fotoA || w.fotoB).length }));
  await p2.evaluate(() => rp3d.setMode('gehen')); await p2.waitForTimeout(600);
  await p2.screenshot({ path: SP + '/h4-geraet2.png' });
  console.log('Datei auf Gerät 2:', JSON.stringify(r2));
  // Gerät 3: Link ?plan=
  fs.writeFileSync(TMP, text);
  const p3 = await neu();
  await p3.goto('http://localhost:8765/raumplan-3d/index.html?plan=raeume-test.json'); await p3.waitForTimeout(2500);
  const r3 = await p3.evaluate(() => ({ name: rp3d.plan.name, wolke: rp3d.plan.wolke && rp3d.plan.wolke.n, hilfeOffen: !document.querySelector('#sheet').hidden }));
  await p3.screenshot({ path: SP + '/h5-link.png' });
  fs.unlinkSync(TMP);
  console.log('Link:', JSON.stringify(r3));
  // Gerät 4: Rohdaten neu auswerten
  const p4 = await neu();
  await p4.goto('http://localhost:8765/raumplan-3d/index.html'); await p4.waitForTimeout(1200);
  await p4.setInputFiles('#file', { name: 'scan-roh.txt', mimeType: 'text/plain', buffer: Buffer.from(rohText) });
  await p4.waitForFunction(() => rp3d.plan.aufmass && rp3d.plan.aufmass.art === 'scan', null, { timeout: 60000 });
  await p4.waitForTimeout(500);
  const r4 = await p4.evaluate(() => ({ w: rp3d.plan.walls.map(w => +(w.innen * 100).toFixed(1)), H: rp3d.plan.height, modus: rp3d.plan.aufmass.info && rp3d.plan.aufmass.info.modus, wolke: rp3d.plan.wolke && rp3d.plan.wolke.n }));
  console.log('Rohdaten neu:', JSON.stringify(r4));
  console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
