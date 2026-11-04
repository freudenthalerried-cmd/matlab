'use strict';
/* Raumplan – Markenerkennung im Hintergrund-Thread: bekommt ein Bild (ImageBitmap), liefert die erkannten Marken. */
importScripts('marker.js');
let cv = null, ctx = null, buf = null;
onmessage = e => {
  const { id, bmp } = e.data;
  try {
    const W = bmp.width, H = bmp.height;
    if (!cv || cv.width !== W || cv.height !== H) { cv = new OffscreenCanvas(W, H); ctx = cv.getContext('2d', { willReadFrequently: true }); buf = new Float32Array(W * H); }
    ctx.drawImage(bmp, 0, 0); bmp.close();
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0, j = 0; i < buf.length; i++, j += 4) buf[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
    const dets = MK.detect(buf, W, H).filter(m => m.res < 0.8);
    postMessage({ id, dets, W, H });
  } catch (err) { postMessage({ id, err: String(err && err.message || err) }); }
};
