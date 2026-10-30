// Render Fiverr gig images (1280x769) for the 3D landing page gig.
// Usage: node gig_images.js <screenshot_dir> <render_dir> <out_dir>
// screenshot_dir needs 3d-<name>-desk.png and 3d-<name>-mob.png
const {chromium} = require('playwright');
const fs = require('fs');
const [S, R, OUT] = process.argv.slice(2);
const uri = (f, t) => `data:image/${t};base64,` + fs.readFileSync(f).toString('base64');
const shot = n => uri(`${S}/${n}.png`, 'png');
const r3d = n => uri(`${R}/${n}.webp`, 'webp');

const css = `*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:769px;overflow:hidden;font-family:"Segoe UI",system-ui,Arial,sans-serif;color:#fff;position:relative}
.lap{position:absolute;border-radius:14px;overflow:hidden;box-shadow:0 30px 70px #0008;background:#1d1f2b;padding:26px 0 0}
.lap:before{content:"● ● ●";position:absolute;top:5px;left:14px;font-size:10px;letter-spacing:3px;color:#ffffff55}
.lap img{display:block;width:100%}
.ph{position:absolute;border-radius:30px;overflow:hidden;border:8px solid #11131c;box-shadow:0 30px 60px #0009;background:#000}
.ph img{display:block;width:100%}
.obj{position:absolute;filter:drop-shadow(0 20px 30px #0005)}
.soft{-webkit-mask-image:radial-gradient(closest-side,#000 80%,transparent);mask-image:radial-gradient(closest-side,#000 80%,transparent)}
.pill{position:absolute;background:#ffffff1f;border:1px solid #ffffff33;padding:10px 18px;border-radius:12px;font-size:22px;font-weight:700}`;

const cover = `<style>${css}
body{background:radial-gradient(circle at 75% 40%,#5b3df5 0%,#2a1a8a 45%,#120c3a 100%)}
.t{position:absolute;left:64px;top:96px;width:540px;z-index:2}
.k{display:inline-block;background:linear-gradient(90deg,#ffc928,#ff9f43);color:#111;font-weight:800;padding:8px 16px;border-radius:8px;font-size:20px;margin-bottom:22px;letter-spacing:1px}
h1{font-size:66px;line-height:1.02;font-weight:800;margin-bottom:26px;letter-spacing:-1px}
h1 span{background:linear-gradient(90deg,#2de2e6,#a78bff);-webkit-background-clip:text;background-clip:text;color:transparent}
ul{list-style:none;font-size:25px;line-height:1.85}li:before{content:"✓  ";color:#2de2e6;font-weight:800}
.b{position:absolute;left:64px;bottom:44px;font-size:19px;opacity:.7}
</style>
<div class="t"><div class="k">3D LANDINGPAGE</div>
<h1>Webseiten,<br>die <span>herausstechen.</span></h1>
<ul><li>Individuelle 3D-Grafiken</li><li>Mobil &amp; schnell</li><li>Deutsch · ab 4 Tagen</li></ul></div>
<div class="b">Pixelwerkstatt · Design aus Österreich</div>
<div class="lap" style="left:640px;top:200px;width:600px;transform:rotate(-3deg)"><img src="${shot('3d-immo-desk')}"></div>
<img class="obj" src="${r3d('bau')}" style="left:575px;top:25px;width:290px">
<img class="obj soft" src="${r3d('tech')}" style="left:1010px;top:-30px;width:300px">
<img class="obj" src="${r3d('gastro')}" style="left:990px;top:470px;width:300px">`;

const demo = (n, label, bg) => `<style>${css}body{background:${bg}}</style>
<div class="pill" style="left:56px;top:44px">${label}</div>
<div class="lap" style="left:56px;top:130px;width:890px"><img src="${shot('3d-' + n + '-desk')}"></div>
<div class="ph" style="left:985px;top:96px;width:250px"><img src="${shot('3d-' + n + '-mob')}"></div>
`;

const jobs = [
  ['01-cover', cover],
  ['02-bau', demo('bau', 'Beispiel: Baumeister', 'linear-gradient(135deg,#f2a019,#b8560f)')],
  ['03-immo', demo('immo', 'Beispiel: Immobilienmakler', 'linear-gradient(135deg,#3d6b5c,#1d3a31)')],
  ['04-gastro', demo('gastro', 'Beispiel: Café & Gastro', 'linear-gradient(135deg,#c4622d,#7a3517)')],
  ['05-tech', demo('tech', 'Beispiel: App / SaaS', 'linear-gradient(135deg,#7c5cff,#2a1a8a)')],
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1280, height: 769}});
  for (const [f, h] of jobs) {
    await p.setContent('<!doctype html><meta charset="utf-8">' + h);
    await p.waitForTimeout(250);
    await p.screenshot({path: `${OUT}/${f}.jpg`, type: 'jpeg', quality: 90});
  }
  await b.close();
})();
