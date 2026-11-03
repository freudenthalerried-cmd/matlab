// Testvideo für den Kalibrier-Assistenten: Kalibriertafel per CSS-3D (Lochkamera, f = Perspektive = 1500 px) aus vielen Blickwinkeln → y4m
const { chromium } = require(process.env.NP + '/playwright'), fs = require('fs'), cp = require('child_process');
global.BA = require('../ba.js'); global.MK = require('../marker.js'); const { CAL } = require('../calib.js');
(async () => {
  const W = 1920, H = 1080, b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  const svg = CAL.boardSVG().replace('width="210mm" height="297mm"', 'width="630" height="891"');
  await p.setContent(`<body style="margin:0;background:#8a8a8a;overflow:hidden"><div style="position:absolute;inset:0;perspective:1500px;perspective-origin:50% 50%"><div id="b" style="position:absolute;left:${W / 2 - 315}px;top:${H / 2 - 445}px;width:630px;height:891px;transform-origin:50% 50%">${svg}</div></div></body>`);
  const poses = []; let sd = 3; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  for (let i = 0; i < 40; i++) poses.push({ rx: (r() - .5) * 70, ry: (r() - .5) * 70, rz: (r() - .5) * 60, tx: (r() - .5) * 900, ty: (r() - .5) * 500, tz: -300 - r() * 700 });
  const ff = cp.spawn(process.env.FF || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '5', '-i', 'pipe:0', '-f', 'yuv4mpegpipe', '-pix_fmt', 'yuv420p', '-y', process.env.OUT]);
  for (const q of poses) {
    await p.evaluate(q => document.getElementById('b').style.transform = `translate3d(${q.tx}px,${q.ty}px,${q.tz}px) rotateX(${q.rx}deg) rotateY(${q.ry}deg) rotateZ(${q.rz}deg)`, q);
    const png = await p.screenshot({ type: 'png' }); for (let k = 0; k < 6; k++) await new Promise(res => ff.stdin.write(png, res));
  }
  ff.stdin.end(); ff.on('close', () => console.log('fertig', poses.length, 'Ansichten')); await b.close();
})();
