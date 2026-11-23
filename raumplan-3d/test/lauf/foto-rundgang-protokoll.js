// Foto-Rundgang und Beweis-Protokoll: echte Aufnahme (Attrappe) → Originalfotos → Rundgang → Protokoll → Neuladen → Datei auf zweitem Gerät → Löschen
const { chromium, devices } = require('playwright');
const fs = require('fs'); const SP = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('error: ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/raumplan-3d/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(async () => { const { installiere } = await import('./test/xr-attrappe.js'); await installiere({ ohneBasis: true, zeilenUnten: true }); });
  await p.click('#start button[data-s="scan"]');
  await p.waitForFunction(() => xrAttrappe.bilder >= xrAttrappe.planLaenge, null, { timeout: 60000 });
  const live = await p.evaluate(() => document.querySelector('#arLive').innerText + ' | ' + document.querySelector('#arInfo').innerText);
  await p.click('#arB1');
  await p.waitForFunction(() => rp3d.plan.rundgang && document.querySelector('#warte').hidden && !document.querySelector('#sheet').hidden, null, { timeout: 90000 });
  await p.waitForTimeout(400);
  const r1 = await p.evaluate(() => ({ titel: document.querySelector('#shTitle').innerText, fotos: rp3d.plan.rundgang.fotos.length, kopf: rp3d.plan.rundgang.kopf, groesse: [rp3d.plan.rundgang.w, rp3d.plan.rundgang.h], f0: rp3d.plan.rundgang.fotos[0], knopf: !document.querySelector('#bFotos').hidden, text: document.querySelector('#shBody').innerText.slice(0, 200).replace(/\n+/g, ' / ') }));
  await p.screenshot({ path: SP + '/r1-ergebnis.png' });
  // Rundgang
  await p.click('#shBody button[data-m="rundgang"]'); await p.waitForTimeout(800);
  await p.screenshot({ path: SP + '/r2-rundgang.png' });
  const nav = [];
  for (const a of ['r', 'r', 'l', 'v', 'u', 'o', 'z', '+', '+']) { const vor = await p.evaluate(() => rp3d.rg.i); const frei = await p.evaluate(a => !document.querySelector(`#rg button[data-g="${a}"]`).disabled, a); if (frei) await p.click(`#rg button[data-g="${a}"]`); await p.waitForTimeout(250); const nach = await p.evaluate(() => rp3d.rg.i); nav.push(`${a}:${vor}→${nach}${frei ? '' : '(aus)'}`); }
  // Drehrichtung prüfen: 'r' muss den Blick im Uhrzeigersinn (von oben) drehen
  const dreh = await p.evaluate(() => { const F = rp3d.plan.rundgang.fotos; let ok = 0, n = 0; for (let i = 0; i < F.length; i += 7) { rp3d.rg.i = i; const j = rp3d.rgZiel('r'); if (j < 0) continue; const a = Math.atan2(F[i].d[0], -F[i].d[2]), c = Math.atan2(F[j].d[0], -F[j].d[2]); let d = c - a; d = Math.atan2(Math.sin(d), Math.cos(d)); n++; if (d > 0) ok++; } return ok + '/' + n; });
  await p.evaluate(() => rp3d.rgAuf(20)); await p.waitForTimeout(600);
  const bild = await p.evaluate(() => { const im = document.querySelector('#rgImg'); return { nat: [im.naturalWidth, im.naturalHeight], info: document.querySelector('#rgInfo').innerText }; });
  await p.screenshot({ path: SP + '/r3-foto20.png' });
  await p.click('#rg button[data-g="x"]'); await p.waitForTimeout(500);
  const zu = await p.evaluate(() => ({ rg: document.querySelector('#rg').hidden, mode: rp3d.mode }));
  await p.screenshot({ path: SP + '/r4-3d-am-standort.png' });
  // Protokoll
  await p.click('#tools button[data-t="menu"]'); await p.click('#shBody button[data-m="protokoll"]'); await p.waitForTimeout(200);
  await p.fill('#fProt input[name="objekt"]', 'Musterstraße 1, 4470 Enns'); await p.fill('#fProt input[name="person"]', 'Test');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#fProt button[value="speichern"]')]);
  const html = fs.readFileSync(await dl.path(), 'utf8'); fs.writeFileSync(SP + '/protokoll.html', html);
  const prot = { name: dl.suggestedFilename(), MB: +(html.length / 1e6).toFixed(2), bilder: (html.match(/<img /g) || []).length, hashes: (html.match(/SHA-256: [0-9a-f]{64}/g) || []).length, objekt: html.includes('Musterstraße 1, 4470 Enns'), svg: html.includes('<svg') };
  // Projektdatei → zweites Gerät
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => rp3d.exportPlan())]);
  const proj = fs.readFileSync(await dl2.path(), 'utf8');
  // Neuladen: Rundgang noch da?
  await p.reload(); await p.waitForTimeout(1200); await p.click('#start button[data-o]'); await p.waitForTimeout(1200);
  await p.click('#bFotos'); await p.waitForTimeout(700);
  const neu = await p.evaluate(() => ({ nat: document.querySelector('#rgImg').naturalWidth, n: rp3d.plan.rundgang.fotos.length }));
  const ctx2 = await b.newContext({ ...devices['Pixel 7'] }); const q = await ctx2.newPage(); q.on('pageerror', e => errs.push('PAGEERROR2 ' + e.message));
  await q.goto('http://localhost:8765/raumplan-3d/index.html'); await q.waitForTimeout(1000);
  await q.setInputFiles('#file', { name: 'raum.txt', mimeType: 'text/plain', buffer: Buffer.from(proj) }); await q.waitForTimeout(2500);
  await q.click('#bFotos'); await q.waitForTimeout(800);
  const g2 = await q.evaluate(() => ({ nat: document.querySelector('#rgImg').naturalWidth, n: rp3d.plan.rundgang.fotos.length }));
  // Protokoll als Seite ansehen
  const v = await b.newPage({ viewport: { width: 1100, height: 1400 } }); await v.goto('file://' + SP + '/protokoll.html'); await v.waitForTimeout(800); await v.screenshot({ path: SP + '/r5-protokoll.png' });
  console.log(JSON.stringify({ live, r1, nav: nav.join(' '), dreh, bild, zu, prot, projektMB: +(proj.length / 1e6).toFixed(2), neu, g2 }, null, 1));
  console.log(errs.join('\n') || 'keine Fehler');
  await b.close();
})();
