// Rendert Pinterest-Pins (1000×1500 JPG) aus marketing/pins.json nach pins/<slug>/.
// Aufruf: python3 affiliate/build.py && node affiliate/pins.js && python3 affiliate/build.py
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const root = __dirname;
const esc = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
(async () => {
  const sites = JSON.parse(fs.readFileSync(path.join(root, 'marketing/pins.json'), 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 1000, height: 1500}});
  for (const s of sites) {
    const dir = path.join(root, 'pins', s.slug);
    fs.mkdirSync(dir, {recursive: true});
    for (const p of s.pins) {
      await page.setContent(`<html><body style="margin:0;width:1000px;height:1500px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(160deg,${s.farbe},#111 130%);color:#fff;font-family:system-ui,sans-serif;box-sizing:border-box;padding:90px 80px">
        <div style="font-size:160px">${s.icon}</div>
        <div><div style="font-size:84px;font-weight:800;line-height:1.08">${esc(p.titel)}</div>
        <div style="font-size:40px;line-height:1.35;margin-top:44px;opacity:.9">${esc(p.sub)}…</div></div>
        <div style="font-size:36px">
        <div style="opacity:.85;margin-bottom:24px">${s.domain}</div>
        <span style="display:inline-block;background:#fff;color:${s.farbe};padding:22px 40px;border-radius:60px;font-weight:800">Gratis-Rechner & Vergleich →</span></div></body></html>`);
      await page.screenshot({path: path.join(dir, `${p.datei}.jpg`), type: 'jpeg', quality: 82});
    }
    console.log('✓', s.slug, s.pins.length, 'Pins');
  }
  await browser.close();
})();
