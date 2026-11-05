'use strict';
/* Raumplan – 2D-Grundriss aus Handyvideo mit Boden-Referenzrechteck (Homographie). */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const KEY = 'raumplan-v1';
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const f2 = (v, d = 2) => (+v).toFixed(d).replace('.', ',');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const R2D = 180 / Math.PI;

const DEF = {
  project: { bv: '', bh: '', adr: '', gst: '', kg: '', pv: '', inhalt: 'Grundriss Erdgeschoß – Bestand', nr: '01', ax: '', ay: '', datum: new Date().toLocaleDateString('de-AT'), nord: 0 },
  scale: 100, paper: 'A3', wallT: 0.30, innerT: 0.12, target: 3, dimFmt: 'mm', floorS: 2, cam: null, rooms: [], meas: []
};
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
if (!S || !Array.isArray(S.rooms)) S = structuredClone(DEF);
S = { ...structuredClone(DEF), ...S, project: { ...DEF.project, ...S.project } };
let saveT;
// Speichern: Hilfsdaten weglassen, Zahlen auf 1 µm runden (spart Platz, kein Einfluss auf mm-Genauigkeit)
const ser = () => JSON.stringify(S, (k, v) => k === '_link' ? undefined : typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(6) : v);
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, ser()); } catch (e) { } }, 300); }

let snaps = [], cur = null, mode = 'ref', selPt = -1, zoom = 1, selRoom = null;

/* ---------- Tabs ---------- */
$$('nav button').forEach(b => b.onclick = () => showTab(b.dataset.t));
function showTab(t) {
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  $$('main>section').forEach(s => s.hidden = s.id !== t);
  if (t === 'mess') drawMeas();
  if (t === 'plan') { renderPlan(true); roomPanel(); }
  if (t === 'proj') fillProj();
}

/* ---------- 1 Aufnahme ---------- */
const vid = $('#vid');
function onFiles(files) {
  for (const f of files) {
    if (f.type.startsWith('video')) vid.src = URL.createObjectURL(f);
    else if (f.type.startsWith('image')) createImageBitmap(f).then(b => addSnap(b, b.width, b.height, f.name)).catch(() => alert('Bild konnte nicht gelesen werden: ' + f.name));
  }
}
$('#camIn').onchange = e => onFiles(e.target.files);
$('#fileIn').onchange = e => onFiles(e.target.files);
$('#stepB').onclick = () => { vid.pause(); vid.currentTime = Math.max(0, vid.currentTime - 1 / 30); };
$('#stepF').onclick = () => { vid.pause(); vid.currentTime += 1 / 30; };
$('#grab').onclick = () => {
  if (!vid.videoWidth) return alert('Zuerst ein Video laden.');
  vid.pause(); addSnap(vid, vid.videoWidth, vid.videoHeight, 'Bild ' + (snaps.length + 1) + ' @' + vid.currentTime.toFixed(1) + ' s');
};
function addSnap(src, w, h, name) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(src, 0, 0, w, h);
  const t = document.createElement('canvas'), k = 240 / w; t.width = 240; t.height = Math.round(h * k);
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
  cur = { name, c, thumb: t.toDataURL('image/jpeg', .7), ref: [], refx: [], pts: [], kal: [[]], refType: 'rect', W: 2, D: 1, L: 1, skirt: '' };
  snaps.push(cur); listSnaps();
}
function listSnaps() {
  const el = $('#snaps');
  if (!snaps.length) { el.innerHTML = '<p class="hint">Noch keine Standbilder.</p>'; return; }
  el.innerHTML = snaps.map((s, i) => `<figure><img src="${s.thumb}" data-i="${i}"><figcaption>${esc(s.name)}${s.ref.length === (s.refType === 'rect' ? 4 : 2) ? ' ✔' : ''}</figcaption><button class="x" data-x="${i}">×</button></figure>`).join('');
}
$('#snaps').onclick = e => {
  const i = e.target.dataset.i, x = e.target.dataset.x;
  if (i != null) { cur = snaps[i]; selPt = -1; showTab('mess'); }
  if (x != null && confirm('Standbild entfernen?')) { if (snaps[x] === cur) cur = null; snaps.splice(x, 1); listSnaps(); }
};

/* Druckbare Zielmarken (Schachbrett-X, von der App auf 1/20 px genau gefunden) */
$('#targets').onclick = () => {
  const page = (lab, sub) => `<div class="pg"><svg viewBox="0 0 210 297" width="210mm" height="297mm" xmlns="http://www.w3.org/2000/svg" font-family="Arial">
    <line x1="105" y1="8" x2="105" y2="248" stroke="#000" stroke-width=".2"/><line x1="8" y1="148.5" x2="202" y2="148.5" stroke="#000" stroke-width=".2"/>
    <rect x="105" y="68.5" width="80" height="80" fill="#000"/><rect x="25" y="148.5" width="80" height="80" fill="#000"/>
    <rect x="25" y="68.5" width="160" height="160" fill="none" stroke="#000" stroke-width=".3"/>
    ${[-50, -40, -30, -20, -10, 10, 20, 30, 40, 50].map(d => `<line x1="${105 + d * 1.6}" y1="236" x2="${105 + d * 1.6}" y2="242" stroke="#000" stroke-width=".3"/>`).join('')}
    <text x="12" y="28" font-size="22" font-weight="bold">${lab}</text><text x="12" y="38" font-size="5">${sub}</text>
    <text x="105" y="258" font-size="4.2" text-anchor="middle">Mittelpunkt des Kreuzes = Messpunkt. Linien zum Ausrichten am Maßband.</text>
    <text x="105" y="265" font-size="4.2" text-anchor="middle">Flach auflegen (Klebeband an den Rändern), matt drucken, Druckskalierung 100 %.</text></svg></div>`;
  const labs = [['A', 'Ecke A (Ursprung)'], ['B', 'Ecke B (A→B = Breite)'], ['C', 'Ecke C'], ['D', 'Ecke D (B→C = Tiefe)'], ['+', 'Zusatzpunkt'], ['+', 'Zusatzpunkt']];
  const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Zielmarken</title><style>@page{size:A4 portrait;margin:0}body{margin:0}.pg{page-break-after:always}svg{display:block}</style></head><body>${labs.map(l => page(...l)).join('')}<script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
};

/* ---------- Photogrammetrie: Zielmarken-Video -> Räume (ohne Handmessung) ---------- */
let pgFiles = null, pgLast = null, pgAuto = false;
$('#pgPrint').onclick = () => {
  const n = Math.max(0, Math.min(86, Math.round(num($('#pgN').value)))), from = Math.max(4, Math.min(89, Math.round(num($('#pgFrom').value) || 4))), size = num($('#pgSize').value) >= 100 ? Math.min(190, num($('#pgSize').value)) : 160;
  pgSizeSet(size); layoutSet('big');
  const lab = ['Boden – Mitte auf Zollstock 0 cm', 'Boden – Mitte auf Zollstock 200 cm', 'Boden', 'Boden'];
  const pages = [0, 1, 2, 3].map(id => MK.markerSVG(id, size, lab[id])).concat(Array.from({ length: Math.min(n, 90 - from) }, (_, k) => MK.markerSVG(from + k, size, 'Wand')))
    .concat($('#pgConn').checked ? [90, 91, 92, 93].map(id => MK.markerSVG(id, size, 'Verbindung – im Türbereich am Boden liegen lassen')) : []);
  const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Raumplan-Marken</title><style>@page{size:A4 portrait;margin:0}body{margin:0}svg{display:block;page-break-after:always}</style></head><body>${pages.join('')}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
};
// gedruckte Markengröße merken – sie muss bei der Auswertung stimmen
function pgSizeSet(v) { $('#pgSize').value = v; try { localStorage.setItem('raumplan-pgsize', v); } catch (e) { } }
try { const v = localStorage.getItem('raumplan-pgsize'); if (v) $('#pgSize').value = v; } catch (e) { }
$('#pgSize').onchange = () => pgSizeSet(num($('#pgSize').value) || 45);
// Druckmaßstab: gemessene Länge der 150-mm-Kontrolllinie (leer = 150) → Faktor
try { const v = localStorage.getItem('raumplan-ctrl'); if (v) $('#pgCtrl').value = v; } catch (e) { }
$('#pgCtrl').onchange = () => { try { localStorage.setItem('raumplan-ctrl', $('#pgCtrl').value); } catch (e) { } };
function printK() { const v = num($('#pgCtrl').value); return v > 100 && v < 200 ? v / 150 : 1; }
function layoutSet(v) { try { localStorage.setItem('raumplan-layout', v); } catch (e) { } if ($('#pgLayout')) $('#pgLayout').value = v; }
function layoutGet() { try { return localStorage.getItem('raumplan-layout') || 'wall'; } catch (e) { return 'wall'; } }
// Gedruckte Vorlage wählen → Markengröße und Anzahl passend setzen
const LAYOUT_SIZE = { wall: 80, single: 45, big: 160 };
function layoutApply(v) {
  layoutSet(v); pgSizeSet(LAYOUT_SIZE[v] || 80);
  const w = Math.round(num($('#pgWalls').value)) || 4;
  $('#pgN').value = v === 'wall' ? 4 * w : v === 'single' ? 12 : 16;
}
try { if (!localStorage.getItem('raumplan-ui2')) { localStorage.setItem('raumplan-ui2', '1'); layoutApply('wall'); } } catch (e) { }
$('#pgLayout').value = layoutGet();
$('#pgLayout').onchange = () => layoutApply($('#pgLayout').value);
$('#pgWalls').onchange = () => { if (layoutGet() === 'wall') $('#pgN').value = 4 * (Math.round(num($('#pgWalls').value)) || 4); };
// Maßstabskontrolle über die Wandblätter: Markenabstände auf dem Blatt (110 / 197 mm × Druckmaßstab) gegen das Ergebnis
function sheetScaleDev(rec) { // Abweichung der Blattgeometrie in % (null, wenn nicht prüfbar)
  if (layoutGet() !== 'wall') return null;
  const from = Math.round(num($('#pgFrom').value)) || 4, k = printK(), ctr = id => { const q = rec.kU.get(id); return [0, 1, 2].map(j => [0, 1, 2, 3].reduce((a, c) => a + rec.res.pts[4 * q + c][j], 0) / 4); }, rat = [];
  for (let b = from; b + 3 < 90; b += 4) { const ids = [b, b + 1, b + 2, b + 3]; if (!ids.every(id => rec.kU.has(id))) continue; [[0, 1, 0.110], [2, 3, 0.110], [0, 2, 0.197], [1, 3, 0.197]].forEach(([i, j, d]) => { const A = ctr(ids[i]), B = ctr(ids[j]); rat.push(Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) / (d * k)); }); }
  return rat.length >= 4 ? (rat.reduce((a, v) => a + v, 0) / rat.length - 1) * 100 : null;
}
// Plausibilität für die Neustarts: Wandanzahl wie erwartet, Blattgeometrie passt zum Maßstab
function pgCheck(rec) {
  const dev = sheetScaleDev(rec); if (dev !== null && Math.abs(dev) > 1) return `Maßstab passt nicht zu den Blättern (${f2(dev, 1)} %)`;
  const exp = Math.round(num($('#pgWalls').value)) || (layoutGet() === 'wall' ? 4 : 0);
  if (exp && !$('#pgRooms').value.trim()) { const w = PG.walls(rec); if (w.ok && w.lengths.length !== exp) return `${w.lengths.length} statt ${exp} Wände`; }
  return null;
}
function sheetScaleCheck(rec) {
  if (layoutGet() !== 'wall') return '';
  const from = Math.round(num($('#pgFrom').value)) || 4, k = printK(), ctr = id => { const q = rec.kU.get(id); return [0, 1, 2].map(j => [0, 1, 2, 3].reduce((a, c) => a + rec.res.pts[4 * q + c][j], 0) / 4); };
  const rat = [];
  for (let b = from; b + 3 < 90; b += 4) {
    const ids = [b, b + 1, b + 2, b + 3]; if (!ids.every(id => rec.kU.has(id))) continue;
    [[0, 1, 0.110], [2, 3, 0.110], [0, 2, 0.197], [1, 3, 0.197]].forEach(([i, j, d]) => { const A = ctr(ids[i]), B = ctr(ids[j]); rat.push(Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) / (d * k)); });
  }
  if (rat.length < 4) return '';
  const m = rat.reduce((a, v) => a + v, 0) / rat.length, dev = (m - 1) * 100;
  return Math.abs(dev) <= 0.5
    ? `<p class="ok">✓ Maßstabskontrolle über ${rat.length / 4} Wandblätter: ${dev >= 0 ? '+' : ''}${f2(dev, 2)} % – Zollstock und Blätter passen zusammen.</p>`
    : `<p class="warn">⚠ Maßstabskontrolle über ${rat.length / 4} Wandblätter: ${dev >= 0 ? '+' : ''}${f2(dev, 2)} % Abweichung. Prüfen: Liegt der Zollstock genau an beiden Bodenblättern (0 / 200 cm)? Die 150-mm-Linie auf einem Blatt nachmessen und unten bei „Kontrolllinie gemessen“ eintragen.</p>`;
}
// 1 Blatt pro Wand: 2 Bodenblätter an den Zollstock-Enden (0+2 bei 0 cm, 1+3 bei 200 cm) + je Wand ein Blatt mit 4 Marken (80 mm)
function wallSheetPages(nw, from) {
  const size = 80, pages = [MK.floorSheetSVG(0, 2, size, 0), MK.floorSheetSVG(1, 3, size, 200)];
  for (let w = 0; w < nw; w++) { const ids = [0, 1, 2, 3].map(k => from + 4 * w + k); pages.push(MK.cornerSheetSVG(ids, size, `Wand ${w + 1}`, ['Flach und ohne Wellen an die Wand kleben, Mitte ca. 1,3 m hoch.', 'Nicht hinter Möbeln – die Kamera muss das Blatt gut sehen.', `Marken ${ids.join(', ')}`], false)); }
  return { size, pages };
}
$('#pgWallSheets').onclick = () => {
  const nw = Math.max(3, Math.min(12, Math.round(num($('#pgWalls').value)) || 4)), from = Math.max(4, Math.min(89 - 4 * nw, Math.round(num($('#pgFrom').value) || 4)));
  const { size, pages } = wallSheetPages(nw, from);
  pgSizeSet(size); layoutSet('wall'); $('#pgN').value = 4 * nw; $('#pgFrom').value = from; if (!$('#pgDist').value) $('#pgDist').value = '2,000';
  const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Raumplan – 1 Blatt pro Wand</title><style>@page{size:A4 portrait;margin:0}body{margin:0}svg{display:block;page-break-after:always}</style></head><body>${pages.join('')}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
};
$('#pgSheet').onclick = () => { // einfach: 4 Boden- + 12 Wandmarken (3 je Wand) auf einem A4-Blatt
  const from = Math.max(4, Math.min(78, Math.round(num($('#pgFrom').value) || 4))), size = 45;
  pgSizeSet(size); layoutSet('single'); $('#pgN').value = 12;
  const lab = ['Boden · auf 0 cm', 'Boden · auf 200 cm', 'Boden', 'Boden'];
  const items = [0, 1, 2, 3].map(i => [i, lab[i]]).concat(Array.from({ length: 12 }, (_, k) => [from + k, 'Wand']));
  const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Raumplan-Marken (1 Blatt)</title><style>@page{size:A4 portrait;margin:0}body{margin:0}svg{display:block}</style></head><body>${MK.sheetSVG(items, size)}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
};
function pgSetFiles(fl) { pgFiles = [...fl]; const nv = pgFiles.filter(f => f.type.startsWith('video')).length; $('#pgSrc').textContent = nv ? `Video: ${pgFiles.find(f => f.type.startsWith('video')).name}` : `${pgFiles.length} Fotos${pgFiles.length < 25 ? ' (empfohlen ≥ 30)' : ''}`; }
$('#pgCam').onchange = e => { pgSetFiles((pgFiles || []).filter(f => f.type.startsWith('image')).concat([...e.target.files])); e.target.value = ''; }; // Fotos sammeln
$('#pgFile').onchange = e => pgSetFiles(e.target.files);
const pgLog = t => { const el = $('#pgLog'); el.hidden = false; el.textContent += t + '\n'; el.scrollTop = 1e9; };
const tick = () => new Promise(r => setTimeout(r, 0));
function toGray(ctx, W, H, buf) {
  const d = ctx.getImageData(0, 0, W, H).data;
  for (let i = 0, j = 0; i < W * H; i++, j += 4) buf[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
  return buf;
}
async function pgFrames(files, step, prog) { // -> {frames, W, H}
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d', { willReadFrequently: true }), frames = [];
  let W = 0, H = 0, buf = null;
  const video = files.find(f => f.type.startsWith('video'));
  if (video) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(video);
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('Video kann nicht gelesen werden (Format?).')); });
    W = cv.width = v.videoWidth; H = cv.height = v.videoHeight; buf = new Float32Array(W * H);
    const times = Array.isArray(step) ? step.filter(t => t < v.duration) : null, n = times ? times.length : Math.floor(v.duration / step);
    pgLog(`Video ${W}×${H}, ${v.duration.toFixed(1)} s → ${n} Bilder`);
    // Bilder nacheinander aus dem Video holen, Erkennung parallel in den Hintergrund-Threads (höchstens 2 je Thread gleichzeitig)
    const jobs = [], lim = Math.max(2, 2 * (DET.n || 1)); let done = 0;
    for (let k = 0; k < n; k++) {
      v.currentTime = times ? times[k] : (k + 0.5) * step;
      await new Promise(r => { v.onseeked = r; });
      const t = v.currentTime, bmp = await createImageBitmap(v);
      jobs.push(DET.detect(bmp).then(r => { done++; prog(done / n, `Bild ${done}/${n}`); return { t, vt: t, dets: r.dets }; }));
      while (jobs.length - done >= lim) await new Promise(r => setTimeout(r, 15));
    }
    frames.push(...await Promise.all(jobs));
    URL.revokeObjectURL(v.src);
  } else {
    const imgs = files.filter(f => f.type.startsWith('image'));
    for (let k = 0; k < imgs.length; k++) {
      const b = await createImageBitmap(imgs[k]);
      if (!W) { W = cv.width = b.width; H = cv.height = b.height; buf = new Float32Array(W * H); }
      if (b.width !== W || b.height !== H) { b.close(); pgLog(`${imgs[k].name}: andere Bildgröße – übersprungen`); continue; }
      ctx.drawImage(b, 0, 0); b.close(); const dets = MK.detect(toGray(ctx, W, H, buf), W, H).filter(d => d.res < 0.8);
      frames.push({ t: k, fi: k, dets }); prog((k + 1) / imgs.length, `Foto ${k + 1}/${imgs.length}: ${dets.length} Marken`); await tick();
    }
  }
  return { frames, W, H, video, imgs: files.filter(f => f.type.startsWith('image')) };
}
/* Video: nur Bilder verwenden, in denen die Kamera (fast) stillsteht – Rolling Shutter verzerrt sonst um mm–cm */
function selectStill(frames, W, H) {
  const k = 1920 / Math.max(W, H), ctr = d => [(d.c[0][0] + d.c[2][0]) / 2, (d.c[0][1] + d.c[2][1]) / 2];
  const speed = (a, b) => { if (!a || !b) return null; const v = []; a.dets.forEach(d => { const e = b.dets.find(x => x.id === d.id); if (e) { const p = ctr(d), q = ctr(e); v.push(Math.hypot(p[0] - q[0], p[1] - q[1]) / Math.abs(b.t - a.t)); } }); return v.length ? v.reduce((s, x) => s + x, 0) / v.length * k : null; };
  frames.forEach((f, i) => { const s = [speed(frames[i - 1], f), speed(f, frames[i + 1])].filter(x => x !== null); f.speed = s.length ? Math.max(...s) : Infinity; });
  let sel = [];
  for (const thr of [40, 80, 150]) { sel = frames.filter(f => f.speed < thr && f.dets.length); if (sel.length >= 20) break; if (thr > 40) pgLog(`Wenig ruhige Bilder – Schwelle auf ${thr * 2} px/s erhöht (Genauigkeit sinkt).`); }
  if (sel.length < 12) { pgLog('Video zu unruhig: bitte öfter stillhalten oder eine Fotoserie machen. Es werden alle Bilder verwendet.'); sel = frames.filter(f => f.dets.length); }
  return sel;
}
function pgRoomDefs(txt, ids) { // "Name: 4-19" oder "Name: 4-19: 6" (6 Wände erwartet) -> [{name, ids:Set, expect}]
  const defs = String(txt || '').split('\n').map(l => l.match(/^\s*(.+?)\s*:\s*(\d+)\s*[-–]\s*(\d+)\s*(?::\s*(\d+))?\s*$/)).filter(Boolean)
    .map(m => ({ name: m[1], ids: new Set(ids.filter(i => i >= +m[2] && i <= +m[3])), expect: m[4] ? +m[4] : 0 }));
  return defs.length ? defs : [{ name: 'Raum ' + (S.rooms.length + 1), ids: null, expect: Math.round(num($('#pgWalls').value)) || 0 }];
}
let devD = null; // DEV
function devCap(o) { if (typeof DEV === 'undefined' || !DEV.on) return; DEV.capture({ ...o, version: 'raumplan-v29', calib: o.W ? CAM.forSize(o.W, o.H) : null, layout: layoutGet(), printK: printK(), log: $('#pgLog').textContent, km: KM.list, still: live.still, video: live.vidName }); } // DEV
$('#pgRun').onclick = async () => {
  devD = null; // DEV
  if (!pgFiles || !pgFiles.length) return alert('Zuerst ein Video (oder eine Fotoserie) aufnehmen oder wählen.');
  const ob = $('#opBox'); if (ob) ob.remove(); opSt = null;
  const btn = $('#pgRun'), pr = $('#pgProg'); btn.disabled = true; pr.hidden = false; $('#pgLog').textContent = ''; $('#pgRes').innerHTML = '';
  const t0 = performance.now();
  try {
    const isVid = pgFiles.some(f => f.type.startsWith('video'));
    let frames, W, H, video = null, imgs = [];
    if (pgOverride) { ({ frames, W, H } = pgOverride); pgOverride = null; pgLog(`Genauere Auswertung mit ${frames.length} Bildern`); }
    else if (pgPre && pgPre.files === pgFiles) { pr.value = 0.3; frames = await pgPre.frames(f => { pr.value = f * 0.8; resBusy(`Marken in den Bildern … ${Math.round(f * 100)} %`); }); W = pgPre.W; H = pgPre.H; imgs = pgFiles; pgLog(`Marken schon während der Aufnahme erkannt (${DET.n || 1} Hintergrund-Threads)`); }
    else ({ frames, W, H, video, imgs } = await pgFrames(pgFiles, +$('#pgStep').value, (f, t) => { pr.value = f * 0.8; $('#pgSrc').textContent = t; }));
    if (isVid && !pgOverride) { const all = frames.length; frames = selectStill(frames, W, H); pgLog(`Ruhige Bilder ausgewählt: ${frames.length} von ${all} (Rolling-Shutter-Schutz)`); }
    devD = { frames, W, H, imgs: imgs && imgs.length ? imgs : pgFiles, source: pgPre && pgPre.files === pgFiles ? 'live' : isVid ? 'video' : 'fotos' }; // DEV
    const nd = frames.reduce((s, f) => s + f.dets.length, 0);
    pgLog(`Erkennung fertig: ${nd} Markensichtungen in ${frames.length} Bildern (${((performance.now() - t0) / 1000).toFixed(0)} s)`);
    await tick();
    devD.opts = { W, H, size: (num($('#pgSize').value) / 1000 || 0.16) * printK(), scaleDist: parseLen($('#pgDist').value) || 2, scaleDist2: parseLen($('#pgDist2').value) || 0, sigPx: 0.3 }; // DEV
    const rec = PG.reconstruct(frames, { W, H, size: (num($('#pgSize').value) / 1000 || 0.16) * printK(), scaleDist: parseLen($('#pgDist').value) || 2, scaleDist2: parseLen($('#pgDist2').value) || 0, check: pgCheck, calib: CAM.forSize(W, H) || undefined, sigPx: 0.3, log: pgLog });
    pr.value = 0.95; await tick();
    if (!rec.ok) throw new Error(rec.msg);
    pgLog(`Ausgleich: ${rec.nImg} Bilder, ${rec.ids.length} Marken, Bildfehler rms ${rec.res.rms.toFixed(2)} px, f = ${rec.res.it[0].toFixed(0)} px, k1 = ${rec.res.it[3].toFixed(3)}${rec.dropped ? `, ${rec.dropped} Fehlsichtungen entfernt` : ''}`);
    const res = pgRoomDefs($('#pgRooms').value, rec.ids).map(d => ({ ...d, w: PG.walls(rec, { ids: d.ids }) }));
    res.forEach(d => { if (d.w.ok && d.expect && d.w.lengths.length !== d.expect) d.w.warn.unshift(`Erwartet ${d.expect} Wände, gefunden ${d.w.lengths.length}. ${d.w.lengths.length < d.expect ? 'Mindestens eine Wand hat keine (brauchbare) Marke – Marke(n) dort ankleben bzw. öfter fotografieren. Der Raum ist so NICHT vollständig!' : 'Eine Wand wurde doppelt erkannt – Marken prüfen.'}`); });
    pgLast = { rec, res, frames, W, H, video, imgs };
    const tgt = S.target || 3;
    $('#pgRes').innerHTML = res.map(r => !r.w.ok ? `<p class="warn">${esc(r.name)}: ${esc(r.w.msg)}</p>` :
      `<h4>${esc(r.name)}</h4><table class="pgt"><tr><th>Wand</th><th>Länge</th><th>± mm (%)</th><th>Marken</th><th class="ckcol" hidden>Kontrolle (Maßband)</th><th></th></tr>` +
      r.w.lengths.map((L, i) => `<tr><td>${i + 1}</td><td><b>${f2(L, 3)} m</b></td><td class="${r.w.sigma[i] * 1000 > tgt ? 'warn' : 'ok'}">${r.w.sigma[i] == null ? '–' : f2(r.w.sigma[i] * 1000, 1) + ' <small>(' + pct(r.w.sigma[i], L) + ')</small>'}</td><td>${r.w.groups[i].join(', ')}</td><td class="ckcol" hidden><input class="chk" data-ck="${res.indexOf(r)},${i}" inputmode="decimal" size="6" placeholder="m/cm"> <span id="ck${res.indexOf(r)}_${i}"></span></td><td><button data-op="${res.indexOf(r)},${i}" title="Fenster/Tür in einem Foto antippen">📐 Öffnung</button></td></tr>`).join('') +
      `</table>${r.w.height ? (r.w.hSig !== null && r.w.hSig < 0.005 ? `<p>Raumhöhe (Deckenmarke): <b>${f2(r.w.height, 3)} m</b> ±${f2(r.w.hSig * 1000, 1)} mm</p>` : `<p class="warn">Raumhöhe unsicher (${f2(r.w.height, 2)} m) – Deckenmarke aus mindestens 3 Ecken fotografieren.</p>`) : ''}${r.w.warn.map(x => `<p class="warn">${esc(x)}</p>`).join('')}`).join('') +
      (res.some(r => r.w.ok) ? `<div class="row"><button id="pgTake" class="pri">Räume in den Plan übernehmen</button><button id="ckShow">Kontrollmaß eingeben (optional)</button></div>` : '') +
      (rec.suspect ? `<p class="warn">⚠ ${esc(rec.suspect)} Ergebnis unsicher – mehr Fotos aus verschiedenen Positionen (auch zum Boden) aufnehmen.</p>` : '') +
      (rec.res.rms > 0.6 ? `<p class="warn">⚠ Bildfehler ${rec.res.rms.toFixed(2)} px ist zu hoch – Ergebnis unsicher. Mehr Fotos aus den Ecken (bei mehreren Räumen: mehrere Fotos durch die Tür, auf denen Marken beider Räume zu sehen sind) und erneut auswerten.</p>` : '') +
      `<p class="hint">Bildfehler ${rec.res.rms.toFixed(2)} px (gut: &lt; 0,5 px). Ist ein ±-Wert rot, mehr Bilder aus den Ecken oder weitere Marken an dieser Wand. Eine „Wand“ mit nur 1 Marke ist meist eine Fehlzuordnung – Marke prüfen.</p>`;
    const sc = sheetScaleCheck(rec); if (sc) $('#pgRes').insertAdjacentHTML('afterbegin', sc);
    $('#pgRes').insertAdjacentHTML('beforeend', kmCompare(res));
    const rc = refineCompare(res); if (rc) $('#pgRes').insertAdjacentHTML('afterbegin', rc);
    else { $('#pgRes').insertAdjacentHTML('beforeend', `<div class="row" id="pgRefineRow" ${live.vidName ? '' : 'hidden'}><button id="pgRefine">🔬 Genauer auswerten (mit Video)</button><span class="hint">nutzt zusätzlich alle ruhigen Videobilder – dauert länger</span></div>`); $('#pgRefine').onclick = () => live.vidName && pgRefine(live.vidName); }
    const tk = $('#pgTake'); if (tk) tk.onclick = pgTake;
    let taken = false; if (pgAuto) { pgAuto = false; if (res.some(r => r.w.ok) && !rec.suspect && rec.res.rms <= 0.6 && res.every(r => !r.w.ok || r.w.sigma.every(x => x != null && x < 0.02))) { pgTake(); taken = true; } }
    showResult(res, rec, taken);
    devCap({ ...devD, rec, res }); // DEV
    $$('#pgRes [data-op]').forEach(b => b.onclick = () => { const [ri, wi] = b.dataset.op.split(',').map(Number); opStart(ri, wi); });
    const cks = $('#ckShow'); if (cks) cks.onclick = () => { $$('#pgRes .ckcol').forEach(e => e.hidden = false); cks.remove(); };
    $$('#pgRes [data-ck]').forEach(inp => inp.oninput = () => { const [ri, wi] = inp.dataset.ck.split(',').map(Number), d = pgLast.res[ri], v = parseLen(inp.value);
      (d.checks = d.checks || {})[wi] = v || undefined; $(`#ck${ri}_${wi}`).innerHTML = v ? chkText(d.w.lengths[wi] - v, d.w.sigma[wi]) : ''; });
  } catch (e) { devCap({ ...(devD || {}), err: e.message }); /* DEV */ pgAuto = false; showResult(null, null, false, e.message); pgLog('Fehler: ' + e.message); $('#pgRes').innerHTML = `<p class="warn">⚠ Auswertung nicht möglich: ${esc(e.message)}</p><p>Tipp: Neu aufnehmen und dabei mehr Bilder machen, in denen <b>zwei Blätter gleichzeitig</b> zu sehen sind (Ecken), und den Zollstock zusammen mit einer Wand filmen.</p>`; }
  pr.value = 1; btn.disabled = false;
};
/* Öffnung (Fenster/Tür) im Foto antippen: 2 gegenüberliegende Ecken an der Wandfläche -> Schnitt mit Wandebene */
let opSt = null;
async function loadFrameCanvas(fr) {
  const L = pgLast, cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H; const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (fr.fi !== undefined) { const bm = await createImageBitmap(L.imgs[fr.fi]); ctx.drawImage(bm, 0, 0); bm.close(); }
  else { const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(L.video); await new Promise(r => v.onloadeddata = r); v.currentTime = fr.vt; await new Promise(r => v.onseeked = r); ctx.drawImage(v, 0, 0, L.W, L.H); URL.revokeObjectURL(v.src); }
  return cv;
}
function opStart(ri, wi) {
  const d = pgLast.res[ri], list = PG.framesForWall(pgLast.rec, pgLast.frames, d.w, wi);
  if (!list.length) return alert('Kein Foto zeigt Marken dieser Wand.');
  opSt = { ri, wi, list, k: 0, pts: [], results: [] };
  let box = $('#opBox'); if (!box) { box = document.createElement('div'); box.id = 'opBox'; box.className = 'card'; $('#pgRes').after(box); }
  box.innerHTML = `<h4>Öffnung messen – ${esc(d.name)}, Wand ${wi + 1}</h4>
    <p class="small">Im Foto die <b>linke untere</b> und die <b>rechte obere</b> Ecke der Öffnung an der Wandfläche (Leibungskante) antippen. Bei Türen unten am Boden. Mehrere Fotos → Mittelwert.</p>
    <div class="row"><select id="opSel">${list.map((x, k) => `<option value="${k}">Foto ${x.fi + 1} (${x.n} Marken dieser Wand)</option>`).join('')}</select>
    <label>Zoom <input id="opZoom" type="range" min="1" max="6" step="0.5" value="1"></label><button id="opClr">Punkte neu</button></div>
    <div id="opWrap" style="overflow:auto;max-height:65vh;border:1px solid var(--line);border-radius:8px;touch-action:pan-x pan-y"><canvas id="opCv" style="display:block"></canvas></div>
    <p id="opOut"></p>
    <div class="row"><select id="opType"><option value="fenster">Fenster</option><option value="tuer">Tür</option><option value="dg">Durchgang</option></select>
    <button id="opAdd" class="pri" disabled>Öffnung übernehmen</button><button id="opRes">📋 zurück zum Ergebnis</button><button id="opClose">Schließen</button></div>`;
  $('#opSel').onchange = e => { opSt.k = +e.target.value; opSt.pts = []; opShow(); };
  $('#opZoom').oninput = () => opDraw();
  $('#opClr').onclick = () => { opSt.pts = []; opDraw(); };
  $('#opClose').onclick = () => { box.remove(); opSt = null; };
  $('#opAdd').onclick = opAdd; $('#opRes').onclick = opBack;
  $('#opCv').onclick = e => {
    if (!opSt.cv || opSt.pts.length >= 2) return; const c = $('#opCv'), r = c.getBoundingClientRect(), k = c.width / r.width;
    let p = [(e.clientX - r.left) * k, (e.clientY - r.top) * k];
    const ctx = opSt.cv.getContext('2d', { willReadFrequently: true });
    p = AG.refineCorner((x0, y0, w, h) => { if (x0 < 0 || y0 < 0 || x0 + w > c.width || y0 + h > c.height) return null; const dd = ctx.getImageData(x0, y0, w, h).data, g = new Float32Array(w * h); for (let i = 0; i < w * h; i++) g[i] = 0.299 * dd[4 * i] + 0.587 * dd[4 * i + 1] + 0.114 * dd[4 * i + 2]; return g; }, p, Math.max(4, Math.round(c.width / 600)));
    opSt.pts.push(p); if (opSt.pts.length === 2) opCalc(); opDraw();
  };
  opShow();
}
async function opShow() { $('#opOut').textContent = 'Foto wird geladen…'; opSt.cv = await loadFrameCanvas(pgLast.frames[opSt.list[opSt.k].fi]); opDraw(); opText(); }
function opDraw() {
  const c = $('#opCv'); if (!c || !opSt.cv) return; c.width = opSt.cv.width; c.height = opSt.cv.height; const x = c.getContext('2d'); x.drawImage(opSt.cv, 0, 0);
  c.style.width = ($('#opWrap').clientWidth * +$('#opZoom').value) + 'px';
  const k = c.width / ($('#opWrap').clientWidth * +$('#opZoom').value);
  x.strokeStyle = '#19d3ff'; x.lineWidth = 2 * k;
  opSt.pts.forEach(p => { x.beginPath(); x.moveTo(p[0] - 12 * k, p[1]); x.lineTo(p[0] + 12 * k, p[1]); x.moveTo(p[0], p[1] - 12 * k); x.lineTo(p[0], p[1] + 12 * k); x.stroke(); });
  if (opSt.pts.length === 2) { const [a, b] = opSt.pts; x.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])); }
}
function opCalc() {
  const d = pgLast.res[opSt.ri], ci = opSt.list[opSt.k].ci, line = d.w.lines[opSt.wi];
  const X = opSt.pts.map(p => PG.rayToWall(pgLast.rec, ci, p, line));
  if (X.some(v => !v)) { $('#opOut').textContent = 'Punkt liegt nicht auf dieser Wand – andere Wand oder anderes Foto wählen.'; return; }
  const o = PG.opening(d.w, opSt.wi, X[0], X[1]); opSt.results.push(o); $('#opType').value = o.type; opText();
}
function opMean() { const R = opSt.results, m = k => R.reduce((s, r) => s + r[k], 0) / R.length; return R.length ? { pos: m('pos'), w: m('w'), h: m('h'), brh: m('brh') } : null; }
function opText() {
  const m = opMean(), R = opSt.results; $('#opAdd').disabled = !m;
  if (!m) { $('#opOut').innerHTML = `Punkte: ${opSt.pts.length}/2`; return; }
  const sd = k => R.length > 1 ? ' ±' + f2(Math.sqrt(R.reduce((s, r) => s + (r[k] - m[k]) ** 2, 0) / (R.length - 1)) * 1000, 1) : '';
  $('#opOut').innerHTML = `<b>${R.length} Messung${R.length > 1 ? 'en (Mittel)' : ''}:</b> Breite ${f2(m.w, 3)} m${sd('w')} · Höhe ${f2(m.h, 3)} m${sd('h')} · Brüstung ${f2(m.brh, 3)} m${sd('brh')} · ab Wandanfang ${f2(m.pos, 3)} m<br><span class="hint">Für den Mittelwert: anderes Foto wählen und erneut 2 Ecken antippen.</span>`;
}
function opBack() { if (pgLast) showResult(pgLast.res, pgLast.rec, pgLast.res.some(d => d.planRoom)); }
function opAdd() {
  const m = opMean(), d = pgLast.res[opSt.ri], t = $('#opType').value;
  const op = { type: t, wall: opSt.wi, pos: +m.pos.toFixed(4), w: +m.w.toFixed(4), h: +m.h.toFixed(4), brh: t === 'fenster' ? +m.brh.toFixed(4) : 0 };
  (d.ops = d.ops || []).push(op);
  if (d.planRoom && S.rooms.includes(d.planRoom)) { d.planRoom.ops.push({ ...op }); save(); }
  opSt.results = []; opSt.pts = []; opDraw(); $('#opOut').innerHTML = `<span class="ok">✔ ${t === 'fenster' ? 'Fenster' : t === 'tuer' ? 'Tür' : 'Durchgang'} ${Math.round(op.w * 100)}/${Math.round(op.h * 100)} übernommen${d.planRoom ? '' : ' (wird mit „Räume übernehmen“ in den Plan gelegt)'}.</span>`;
}
// Marken eines Raums in aktueller Planlage (Raum kann nach der Übernahme verschoben/gedreht worden sein)
function roomMarkersPlan(r) {
  if (!r.pgM) return {}; const d = ((r.rot || 0) - r.pgM.rot0) / R2D, c = Math.cos(d), sn = Math.sin(d);
  const f = p => [c * (p[0] - r.pgM.x0) - sn * (p[1] - r.pgM.y0) + r.x, sn * (p[0] - r.pgM.x0) + c * (p[1] - r.pgM.y0) + r.y];
  const o = {}; for (const id in r.pgM.m) o[id] = { c: r.pgM.m[id].c.map(f), s: r.pgM.m[id].s }; return o;
}
/* Innenwände: gegenüberliegende parallele Wände zweier Räume (< 60 cm) -> gemessener Abstand = Wandstärke */
function autoWallThickness() {
  const G2 = S.rooms.map(r => r.segs.length > 2 ? geo(r) : null); let n = 0;
  S.rooms.forEach((A, ia) => { if (!G2[ia]) return; G2[ia].E.forEach((e, i) => {
    S.rooms.forEach((B, ib) => { if (ib === ia || !G2[ib]) return; G2[ib].E.forEach((f, j) => {
      if (e.d[0] * f.d[0] + e.d[1] * f.d[1] > -0.995) return; // antiparallel
      const dd = (f.p[0] - e.p[0]) * e.n[0] + (f.p[1] - e.p[1]) * e.n[1]; if (dd <= 0.02 || dd > 0.6) return;
      const s0 = (f.p[0] - e.p[0]) * e.d[0] + (f.p[1] - e.p[1]) * e.d[1], s1 = (f.q[0] - e.p[0]) * e.d[0] + (f.q[1] - e.p[1]) * e.d[1];
      if (Math.min(e.L, Math.max(s0, s1)) - Math.max(0, Math.min(s0, s1)) < 0.3) return; // zu wenig Überdeckung
      A.segs[i].t = +dd.toFixed(4); B.segs[j].t = +dd.toFixed(4); n++;
    }); });
  }); });
  return n / 2;
}
function planMarkers() { const all = {}; S.rooms.forEach(r => { const m = roomMarkersPlan(r); for (const id in m) if (!all[id] || m[id].s < all[id].s) all[id] = m[id]; }); return all; }
// Kontrollmaß: Abweichung Messung − Maßband, bewertet gegen die Unsicherheit (Maßband selbst ±1,5 mm)
// relative Genauigkeit: ±σ bezogen auf die Länge in %
const pct = (sig, L) => sig && L ? f2(sig / L * 100, sig / L < 0.001 ? 3 : 2) + ' %' : '';
function chkText(dv, sig) { const lim = 2 * Math.hypot(sig || 0.002, 0.0015); return `<span class="${Math.abs(dv) <= lim ? 'ok' : 'warn'}">${dv >= 0 ? '+' : ''}${f2(dv * 1000, 1)} mm ${Math.abs(dv) <= lim ? '✔' : '⚠'}</span>`; }
function pgTake() {
  S.rooms = S.rooms.filter(r => !r.demo); // Beispielräume weg, sobald echte Räume kommen
  const { rec, res } = pgLast; let first = null;
  // An bestehenden Plan anschließen: gemeinsame Marken (z. B. Verbindungsmarken im Türbereich)
  const fresh = PG.markerMap(rec), existing = planMarkers(), hadPg = Object.keys(existing).length > 0;
  let T = hadPg ? PG.alignTo(existing, fresh) : null, msg = '';
  if (T && T.rms < 0.01) msg = `An den bestehenden Plan angeschlossen über Marken ${T.ids.join(', ')} – Passfehler ${f2(T.rms * 1000, 1)} mm (max. ${f2(T.max * 1000, 1)} mm).${T.rejected.length ? ` Nicht verwendet (ungenau/verschoben): ${T.rejected.join(', ')}.` : ''}`;
  else if (hadPg) { msg = T ? `Gemeinsame Marken passen nicht zusammen (Passfehler ${f2(T.rms * 1000, 0)} mm) – wurde eine Marke verschoben? Raum frei platziert.` : 'Keine gemeinsamen Marken mit dem bestehenden Plan – Raum frei platziert. Für den Gesamtplan 2–3 Verbindungsmarken im Türbereich in beiden Fotoserien fotografieren oder „Nachbarraum anschließen“ verwenden.'; T = null; }
  const F = T ? T.f : p => p;
  let shift = [0, 0];
  if (!T && S.rooms.length) { const b = allBB(), pb = bb(res.filter(d => d.w.ok).flatMap(d => d.w.poly)); shift = [b.x1 + 1 - pb.x0, b.y0 - pb.y0]; }
  const G = p => { const q = F(p); return [q[0] + shift[0], q[1] + shift[1]]; };
  const mPlan = {}; for (const id in fresh) if (fresh[id].s <= 0.005) mPlan[id] = { c: fresh[id].c.map(p => G(p).map(v => +v.toFixed(4))), s: +fresh[id].s.toFixed(4) }; // nur brauchbare Marken, 0,1 mm
  res.forEach(d => {
    if (!d.w.ok) return;
    const r = newRoom(d.name, [], 0, 0); Object.assign(r, fromPoly(d.w.poly.map(G), r));
    r.pgM = { x0: r.x, y0: r.y, rot0: r.rot, m: mPlan };
    // Wand i im Plan = Kante Ecke i -> i+1; Sigma gleich indiziert
    r.adj = { wallSigma: d.w.sigma.map(v => v ?? 0.01), cornerMax: 0, s0: rec.res.s0, red: rec.nObs, warn: d.w.warn, v: [], pg: { rms: rec.res.rms, nImg: rec.nImg } };
    if (d.w.height && d.w.hSig !== null && d.w.hSig < 0.005) r.h = +d.w.height.toFixed(3);
    else if (d.kmH) r.h = +d.kmH.toFixed(3);
    r.checks = Object.entries(d.checks || {}).filter(([, v]) => v).map(([w, v]) => ({ wall: +w, v }));
    r.ops = (d.ops || []).slice(); d.planRoom = r;
    r.src = 'Photogrammetrie'; S.rooms.push(r); if (first === null) first = S.rooms.length - 1;
  });
  const nw = autoWallThickness(); if (nw && T) msg += ` Innenwandstärke(n) aus der Messung gesetzt.`;
  selRoom = first; save(); showTab('plan'); renderPlan(true);
  if (msg) setTimeout(() => alert(msg), 50);
}

/* ---------- Live-Aufnahme mit Coach: nur filmen – die App fotografiert selbst, zeigt je Blatt einen Fortschrittsbalken
   und sagt, wohin man gehen soll. Ist alles erfasst, startet die Auswertung von selbst. ---------- */
const live = { stream: null, shots: 0, busy: false, timer: null, prev: null, lastShot: 0, G: null, pairs: {}, auto: false, doneAt: 0 };
function liveGroups() { // Blätter (Gruppen von Marken) je nach gedruckter Vorlage
  const from = Math.round(num($('#pgFrom').value)) || 4, n = Math.round(num($('#pgN').value)) || 0, G = [];
  if (layoutGet() === 'wall') {
    G.push({ key: 'B0', label: 'Zollstock 0 cm', ids: [0, 2], floor: true }, { key: 'B200', label: 'Zollstock 200 cm', ids: [1, 3], floor: true });
    for (let w = 0; w < Math.max(3, Math.floor(n / 4)); w++) G.push({ key: 'W' + (w + 1), label: 'Wand ' + (w + 1), ids: [0, 1, 2, 3].map(k => from + 4 * w + k) });
  } else {
    G.push({ key: 'B', label: 'Boden', ids: [0, 1, 2, 3], floor: true });
    for (let i = 0; i < n; i++) G.push({ key: 'M' + (from + i), label: 'Marke ' + (from + i), ids: [from + i] });
  }
  G.forEach(g => { g.bins = new Set(); g.shots = 0; g.walls = new Set(); });
  return G;
}
const lgOf = id => live.G.find(g => g.ids.includes(id));
function lgProg(g) { // 0..1
  if (g.floor) return Math.min(1, g.shots / 8) * 0.35 + Math.min(1, g.walls.size / 3) * 0.35 + Math.min(1, (g.top || 0) / 3) * 0.3; // Maßstab: oft, mit Wänden und von oben
  return Math.min(2, g.bins.size) / 2 * 0.7 + Math.min(1, g.shots / 4) * 0.3; // 2 verschiedene Blickwinkel genügen
}
function lgConnected() { // alle gesehenen Blätter über gemeinsame Bilder verbunden?
  const P = {}, f = k => P[k] === undefined || P[k] === k ? k : (P[k] = f(P[k]));
  Object.keys(live.pairs).forEach(pk => { const [a, b] = pk.split('|'); P[f(a)] = f(b); });
  return new Set(live.G.map(g => f(g.key))).size === 1;
}
// Blickwinkel auf ein Wandblatt aus der Form des Vierecks: linke Kante länger → Kamera steht links davon
// … für ein ganzes Wandblatt: linke Markenspalte (Marken 1, 3 des Blatts) höher als rechte → Kamera links
function groupBin(g, d) {
  const M = g.ids.map(id => d.find(m => m.id === id)), h = m => m ? Math.hypot(m.c[0][0] - m.c[3][0], m.c[0][1] - m.c[3][1]) + Math.hypot(m.c[1][0] - m.c[2][0], m.c[1][1] - m.c[2][1]) : 0;
  if (g.ids.length === 4 && (M[0] || M[2]) && (M[1] || M[3])) {
    const cx = m => m.c.reduce((a, p) => a + p[0] / 4, 0), L = [M[0], M[2]].filter(Boolean), R = [M[1], M[3]].filter(Boolean);
    const q = (L.reduce((a, m) => a + h(m), 0) / L.length) / (R.reduce((a, m) => a + h(m), 0) / R.length);
    if (cx(L[0]) < cx(R[0])) return q > 1.05 ? 'L' : q < 0.952 ? 'R' : 'M';
  }
  const m = M.find(Boolean); return m ? binOf(m) : 'M';
}
// Bodenmarke von oben gesehen? (Viereck fast quadratisch → steiler Blick; Simulation: Bilder von oben halbieren den Maßstabsfehler)
function fromAbove(m) { const e = [0, 1, 2, 3].map(i => Math.hypot(m.c[i][0] - m.c[(i + 1) % 4][0], m.c[i][1] - m.c[(i + 1) % 4][1])); return Math.min(...e) / Math.max(...e) > 0.75; }
function binOf(m) { const l = Math.hypot(m.c[0][0] - m.c[3][0], m.c[0][1] - m.c[3][1]), r = Math.hypot(m.c[1][0] - m.c[2][0], m.c[1][1] - m.c[2][1]), q = l / r; return q > 1.1 ? 'L' : q < 0.91 ? 'R' : 'M'; }
function liveCoach(d, steady, shot) {
  const G = live.G, con = lgConnected(), tot0 = G.reduce((a, g) => a + Math.min(1, lgProg(g)), 0) / G.length, all = G.every(g => lgProg(g) >= 1) || (live.shots >= 40 && tot0 >= 0.85 && G.every(g => lgProg(g) >= 0.55)); // genug Bilder → auch knapp darunter fertig
  // Balken je Blatt
  $('#liveChips').innerHTML = G.map(g => { const p = lgProg(g), col = p >= 1 ? '#2e7d32' : p > 0 ? '#e0a800' : '#c62828', vis = d.some(m => g.ids.includes(m.id));
    const bins = g.floor ? '' : `<span class="bins">${['L', 'M', 'R'].map(b => `<i class="${g.bins.has(b) ? 'on' : ''}">${b === 'L' ? '◀' : b === 'M' ? '●' : '▶'}</i>`).join('')}</span>`;
    return `<div class="lg ${vis ? 'vis' : ''}"><span class="lgl">${g.label}</span><span class="lgb"><span style="width:${Math.round(p * 100)}%;background:${col}"></span></span>${bins}${p >= 1 ? '✓' : ''}</div>`; }).join('');
  const tot = G.reduce((a, g) => a + Math.min(1, lgProg(g)), 0) / G.length;
  $('#liveBar').style.width = Math.round(tot * 100) + '%';
  $('#liveInfo').textContent = ` ${live.shots} Bilder · ${Math.round(tot * 100)} %`;
  $('#liveDone').classList.toggle('ready', all && con);
  if (tot > (live.bestTot || 0) + 0.005) { live.bestTot = tot; live.progT = Date.now(); } // Fortschritt merken
  const stuck = live.shots >= 10 && Date.now() - (live.progT || Date.now()) > 20000;
  let h;
  if (all && con) h = '✔ <b>Alles erfasst!</b> Die Auswertung startet gleich von selbst …';
  else if (stuck) h = `⏳ Es geht nicht mehr weiter? Fehlt noch: <b>${G.filter(g => lgProg(g) < 1).map(g => g.label).join(', ')}</b> – dorthin filmen, oder oben <b>„✔ Auswerten“</b> tippen: die App rechnet mit dem, was da ist, und sagt dir, was fehlt.`;
  else if (shot) h = '📸 Bild aufgenommen – weiter so.';
  else if (!d.length) h = live.shots ? 'Keine Marke im Bild – richte die Kamera auf eines der Blätter.' : '<b>Start:</b> Stell dich in eine Ecke, 2–3 m von den Wänden weg. Filme zuerst den <b>Zollstock am Boden</b>, dann schwenke langsam zu den Wänden.';
  else if (!steady) h = 'Etwas <b>langsamer</b> schwenken …';
  else {
    const todo = G.filter(g => lgProg(g) < 1).sort((a, b) => lgProg(a) - lgProg(b))[0];
    if (!todo) h = 'Nimm noch <b>zwei Blätter gemeinsam</b> ins Bild (z. B. in einer Ecke beide Wände), damit alles zusammenhängt.';
    else if (todo.floor) h = (todo.top || 0) < 3 && todo.walls.size >= 2 ? `<b>Zollstock von oben:</b> Stell dich neben den Zollstock und filme ihn <b>von oben</b> – am besten beide Enden im Bild.` : `<b>${todo.label}</b>: Kamera etwas nach unten, sodass das Bodenblatt <b>und</b> eine Wand im Bild sind.`;
    else { const b = todo.bins; h = `<b>${todo.label}</b>: ` + (!b.size ? 'Blatt ins Bild nehmen – Abstand 1–3 m.' : b.has('L') && !b.has('R') ? 'jetzt von der <b>rechten</b> Seite schräg filmen (ein paar Schritte nach rechts gehen).' : b.has('R') && !b.has('L') ? 'jetzt von der <b>linken</b> Seite schräg filmen (ein paar Schritte nach links gehen).' : b.size === 1 ? 'jetzt von der Seite schräg filmen (ein paar Schritte nach links oder rechts gehen).' : 'noch ein paar Bilder aus anderer Position.'); }
  }
  $('#liveHint').innerHTML = h;
  return all && con;
}
// Bild holen: Foto in voller Sensorauflösung (ImageCapture, ohne Blitz), sonst Videobild
async function liveGrabFull(v) {
  if (live.ic && live.photo) {
    try {
      const t0 = performance.now(), opt = { fillLightMode: 'off' }; if (live.photoW) opt.imageWidth = live.photoW;
      const blob = await Promise.race([live.ic.takePhoto(opt).catch(() => live.ic.takePhoto()), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung')), 3000))]);
      const bmp = await createImageBitmap(blob); live.photoMs = performance.now() - t0; live.photoFail = 0;
      return { blob, bmp, W: bmp.width, H: bmp.height, photo: true };
    } catch (e) { if (++live.photoFail >= 3) { live.photo = false; live.camInfo += ' · Fotos nicht möglich – Videobilder'; } }
  }
  if (!v.videoWidth) return null;
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); if (!blob) return null;
  return { blob, bmp: await createImageBitmap(c), W: c.width, H: c.height, photo: false };
}
async function liveStart() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('Kamera im Browser nicht verfügbar – bitte Chrome verwenden oder „Fotos / Video wählen“.');
  let cm; try { cm = await CAM.open(); live.stream = cm.stream; if (typeof DEV !== 'undefined') DEV.camInfo(cm.stream); /* DEV */ }
  catch (e) { return alert('Kamera nicht freigegeben: ' + e.message); }
  live.camInfo = cm.info; live.sh = []; live.sizes = []; live.photoFail = 0; live.photoW = 0;
  live.photo = $('#pgPhoto').checked; live.ic = 'ImageCapture' in window ? new ImageCapture(cm.track) : null;
  if (live.ic && live.photo) { try { const pc = await live.ic.getPhotoCapabilities(); if (pc.imageWidth && pc.imageWidth.max) { live.photoW = pc.imageWidth.max; live.camInfo += ` · Fotos ${pc.imageWidth.max}×${pc.imageHeight ? pc.imageHeight.max : '?'}`; } } catch (e) { } }
  const v = $('#liveVid'); v.srcObject = live.stream; await v.play();
  try { live.wake = await navigator.wakeLock?.request('screen'); } catch (e) { }
  pgFiles = []; $('#pgSrc').textContent = ''; live.session = Date.now(); live.visKey = null; live.visIds = null; live.shots = 0; live.pairs = {}; live.seenAny = false; live.bestTot = 0; live.progT = Date.now(); live.G = liveGroups(); live.prev = null; live.doneAt = 0; live.detP = []; live.vidName = null; live.still = []; live.recOn = VID.start(live.stream);
  $('#live').hidden = false; liveCoach([], true, false);
  const ov = $('#liveOv'), cv = document.createElement('canvas'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const loop = async () => {
    if (!live.stream) return;
    if (!live.busy && v.videoWidth) {
      live.busy = true;
      const s = Math.min(1, 1920 / v.videoWidth); cv.width = Math.round(v.videoWidth * s); cv.height = Math.round(v.videoHeight * s);
      ctx.drawImage(v, 0, 0, cv.width, cv.height);
      const gray = toGray(ctx, cv.width, cv.height, new Float32Array(cv.width * cv.height)), d = MK.detect(gray, cv.width, cv.height, { maxW: 1920, xcorners: false }).filter(m => lgOf(m.id));
      // Schärfe: verwackelte Bilder aussortieren (Vergleich mit dem Median der letzten Bilder)
      const sh = CAM.sharpness(gray, cv.width, cv.height); live.sh.push(sh); if (live.sh.length > 40) live.sh.shift();
      const shMed = [...live.sh].sort((a, b) => a - b)[live.sh.length >> 1], sharp = live.sh.length < 5 || sh >= 0.7 * shMed;
      // Bewegung: gleiche Marken seit dem letzten Bild (< 4 px je 960 px Breite → kaum Bewegungsunschärfe)
      let mv = 0; if (live.prev) d.forEach(m => { const q = live.prev.get(m.id); if (q) mv = Math.max(mv, Math.hypot(m.c[0][0] - q[0], m.c[0][1] - q[1])); });
      live.prev = new Map(d.map(m => [m.id, m.c[0]])); if (d.length) live.seenAny = true;
      $('#liveToAR').hidden = live.seenAny || Date.now() - live.session < 4000;
      if (live.autoAR && !live.seenAny && Date.now() - live.session > 8000) { live.autoAR = false; live.busy = false; VID.stop(); liveStop(); return arStart('Keine Marken im Bild – ich messe ohne Marken weiter (AR).'); } // selbst erkannt: keine Blätter
      const steady = mv < 4 * cv.width / 960 && sharp;
      if (steady && d.length && live.recOn) { const ts = (Date.now() - VID.since) / 1000; if (!live.still.length || ts - live.still[live.still.length - 1] >= 0.25) live.still.push(+ts.toFixed(2)); } // ruhige Momente fürs Nachauswerten
      // Nutzen eines Bilds: neuer Blickwinkel, zu wenige Bilder eines Blatts, neue Verbindung zwischen Blättern
      const vis = [...new Set(d.map(m => lgOf(m.id)))], pk = []; for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) pk.push([vis[i].key, vis[j].key].sort().join('|'));
      const binsNow = new Map(); vis.forEach(g => { if (!g.floor) binsNow.set(g, groupBin(g, d)); });
      { // Wand im Bild (für Kontrollmaße): die am größten sichtbare Wandgruppe
        let bestG = null, bestA = 0; d.forEach(m => { const g = lgOf(m.id); if (g.floor) return; const a = Math.abs((m.c[2][0] - m.c[0][0]) * (m.c[3][1] - m.c[1][1]) - (m.c[3][0] - m.c[1][0]) * (m.c[2][1] - m.c[0][1])); if (a > bestA) { bestA = a; bestG = g; } });
        live.visKey = bestG ? bestG.label : null; live.visIds = bestG ? bestG.ids : null; }
      const gain = vis.some(g => g.shots < (g.floor ? 8 : 4) || (g.floor && (g.top || 0) < 3 && d.some(m => g.ids.includes(m.id) && fromAbove(m))) || (binsNow.has(g) && !g.bins.has(binsNow.get(g))) || (g.floor && vis.some(w => !w.floor && !g.walls.has(w.key)))) || pk.some(k => (live.pairs[k] || 0) < 2);
      let shot = false;
      const dt = Date.now() - live.lastShot; // mit Nutzen schnell auslösen, sonst alle 0,9 s weitere Bilder (mehr Bilder = genauer)
      if (d.length && steady && ((gain && dt > 450) || dt > (live.photo ? 1400 : 900)) && live.shots < 90) { // Fotomodus: zusätzliche Bilder seltener (jedes Foto kostet ca. 1 s)
        $('#liveHint').innerHTML = live.ic && live.photo ? '📸 Foto in voller Auflösung – <b>kurz ruhig halten</b> …' : $('#liveHint').innerHTML;
        const g0 = await liveGrabFull(v);
        if (g0) {
          pgFiles.push(new File([g0.blob], `live_${String(++live.shots).padStart(3, '0')}.jpg`, { type: 'image/jpeg' })); live.lastShot = Date.now(); shot = true;
          live.sizes.push(g0.W + 'x' + g0.H); live.detP.push(DET.detect(g0.bmp)); // Marken sofort im Hintergrund erkennen
          vis.forEach(g => { g.shots++; if (binsNow.has(g)) g.bins.add(binsNow.get(g)); if (g.floor) { vis.forEach(w => { if (!w.floor) g.walls.add(w.key); }); if (d.some(m => g.ids.includes(m.id) && fromAbove(m))) g.top = (g.top || 0) + 1; } });
          pk.forEach(k => live.pairs[k] = (live.pairs[k] || 0) + 1);
          navigator.vibrate?.(25); $('#live').classList.add('flash'); setTimeout(() => $('#live').classList.remove('flash'), 120);
        }
      }
      // Marken einzeichnen: Farbe = Fortschritt des Blatts
      // Overlay exakt über das sichtbare Videobild legen (CSS-Größe = Pixelgröße, Lage relativ zum Container)
      const r = v.getBoundingClientRect(), pr = v.parentElement.getBoundingClientRect();
      ov.width = Math.round(r.width); ov.height = Math.round(r.height); Object.assign(ov.style, { width: r.width + 'px', height: r.height + 'px', left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', maxWidth: 'none', maxHeight: 'none' });
      const o = ov.getContext('2d'), k = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * k) / 2, oy = (r.height - cv.height * k) / 2, X = p => [p[0] * k + ox, p[1] * k + oy];
      o.clearRect(0, 0, ov.width, ov.height); o.lineWidth = 4;
      d.forEach(m => { const p = lgProg(lgOf(m.id)); o.strokeStyle = p >= 1 ? '#4caf50' : p > 0 ? '#ffb300' : '#ff5252'; o.beginPath(); m.c.forEach((q, i) => i ? o.lineTo(...X(q)) : o.moveTo(...X(q))); o.closePath(); o.stroke(); });
      if (!steady && d.length) { o.fillStyle = '#ffb30055'; o.fillRect(0, 0, ov.width, 8); }
      const fin = liveCoach(d, steady, shot);
      if (fin && !live.doneAt) live.doneAt = Date.now();
      live.busy = false;
      if (fin && Date.now() - live.doneAt > 2500) return liveFinish();
    }
    live.timer = setTimeout(loop, 120);
  };
  loop();
}
async function liveShot() { // Foto von Hand (falls die Automatik etwas nicht erwischt)
  const v = $('#liveVid'); if (!v.videoWidth) return;
  const g0 = await liveGrabFull(v); if (!g0) return;
  pgFiles.push(new File([g0.blob], `live_${String(++live.shots).padStart(3, '0')}.jpg`, { type: 'image/jpeg' })); live.lastShot = Date.now();
  live.sizes.push(g0.W + 'x' + g0.H); live.detP.push(DET.detect(g0.bmp));
  navigator.vibrate?.(25);
}
function liveStop() { clearTimeout(live.timer); if (live.stream) live.stream.getTracks().forEach(t => t.stop()); live.stream = null; try { live.wake?.release(); } catch (e) { } $('#live').hidden = true; }
async function liveFinish() {
  const vb = VID.stop(); liveStop();
  if (!live.shots) return;
  pgSetFiles(pgFiles); showTab('auf'); pgAuto = true; resBusy('Die Aufnahme ist fertig – gleich kommt das Ergebnis.');
  const cnt = {}; live.sizes.forEach(z => cnt[z] = (cnt[z] || 0) + 1); const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || '0x0', [W, H] = main.split('x').map(Number);
  const keep = live.sizes.map(z => z === main), detP = live.detP.filter((_, k) => keep[k]);
  if (keep.some(k => !k)) { pgFiles = pgFiles.filter((_, k) => keep[k]); pgSetFiles(pgFiles); }
  const files = pgFiles.slice();
  pgPre = { files: pgFiles, W, H, frames: async prog => { // je Bild höchstens 20 s auf den Hintergrund warten, sonst selbst erkennen
    const out = []; let dead = false;
    for (let k = 0; k < detP.length; k++) {
      let r = await Promise.race([detP[k].catch(() => null), new Promise(res => setTimeout(() => res(null), dead ? 0 : 20000))]);
      if (!r) dead = true; // Hintergrund antwortet nicht → ab jetzt sofort selbst erkennen
      if (!r || !r.dets) { const b = await createImageBitmap(files[k]), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(b, 0, 0); b.close(); r = { dets: MK.detect(toGray(x, c.width, c.height, new Float32Array(c.width * c.height)), c.width, c.height).filter(d => d.res < 0.8) }; }
      out.push({ t: k, fi: k, dets: r.dets }); prog && prog((k + 1) / detP.length); await tick();
    }
    return out; } };
  vb.then(async b => { if (!b || b.size < 1e5) return; const n = `aufnahme-${new Date(live.session).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${b.type.includes('mp4') ? 'mp4' : 'webm'}`; if (await VID.save(n, b)) { live.vidName = n; try { localStorage.setItem('raumplan-still-' + n, JSON.stringify(live.still)); } catch (e) { } vidState(); if (typeof DEV !== 'undefined') DEV.setVideo(n); /* DEV */ const r = $('#pgRefineRow'); if (r) r.hidden = false; } });
  $('#pgRes').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#pgRun').click();
}
$('#liveOpen').onclick = measureStart; $('#liveShot').onclick = liveShot; $('#liveClose').onclick = () => { VID.stop(); liveStop(); };
$('#liveDone').onclick = liveFinish;
$('#liveToAR').onclick = () => { VID.stop(); liveStop(); arStart(); }; // keine Blätter → AR-Messung

/* ---------- 3D-Ansicht (isometrisch, „Puppenhaus“): Wände mit Raumhöhe, Fenster/Türen, Maße der Öffnungen ---------- */
function view3d() {
  const el = $('#v3d'); if (!S.rooms.length) { el.innerHTML = '<p class="hint">Noch keine Räume.</p>'; return; }
  const c30 = Math.cos(Math.PI / 6), s30 = 0.5, PJ = (x, y, z) => [(x - y) * c30, (x + y) * s30 - z], faces = [];
  S.rooms.forEach(r => { const g = geo(r), P = g.P, n = P.length, h = r.h || 2.6;
    faces.push({ d: -1e9, poly: P.map(p => PJ(p[0], p[1], 0)), fill: '#e8eef6', stroke: '#9fb3c8', label: [g.c, `${r.name} · ${f2(g.area, 2)} m² · RH ${f2(h, 2)} m`] });
    P.forEach((p, i) => { const q = P[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      // Wände, deren Innenseite zum Betrachter zeigt (hinten), voll; vordere nur als Kante
      const e = g.E[i], front = e.n[0] + e.n[1] > 0;
      faces.push({ d: mx + my, poly: [PJ(p[0], p[1], 0), PJ(q[0], q[1], 0), PJ(q[0], q[1], front ? 0.15 : h), PJ(p[0], p[1], front ? 0.15 : h)], fill: front ? '#c9d6e3' : '#f4f6f9', stroke: '#5b7088' });
      (r.ops || []).filter(o => o.wall === i && !front).forEach(o => { const a = [p[0] + e.d[0] * o.pos, p[1] + e.d[1] * o.pos], b = [a[0] + e.d[0] * o.w, a[1] + e.d[1] * o.w], z0 = o.type === 'fenster' ? o.brh : 0, z1 = z0 + o.h;
        faces.push({ d: mx + my + 0.001, poly: [PJ(a[0], a[1], z0), PJ(b[0], b[1], z0), PJ(b[0], b[1], z1), PJ(a[0], a[1], z1)], fill: o.type === 'fenster' ? '#9fd3f5' : '#d7b98e', stroke: '#2b5a7a', label: [[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (z0 + z1) / 2], `${Math.round(o.w * 100)}/${Math.round(o.h * 100)}`] }); }); }); });
  faces.sort((a, b) => a.d - b.d);
  const pts = faces.flatMap(f => f.poly), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs) - 0.5, y0 = Math.min(...ys) - 0.5, w = Math.max(...xs) - x0 + 0.5, hh = Math.max(...ys) - y0 + 0.5;
  let o = `<svg viewBox="${x0} ${y0} ${w} ${hh}" class="v3d" xmlns="http://www.w3.org/2000/svg">`;
  faces.forEach(f => { o += `<polygon points="${f.poly.map(p => p.map(v => v.toFixed(3)).join(',')).join(' ')}" fill="${f.fill}" stroke="${f.stroke}" stroke-width="0.015"/>`;
    if (f.label) { const L = f.label[0], q = L.length === 3 ? PJ(L[0], L[1], L[2]) : PJ(L[0], L[1], 0); o += `<text x="${q[0]}" y="${q[1]}" font-size="${L.length === 3 ? 0.2 : 0.24}" font-weight="600" text-anchor="middle" fill="#123">${esc(f.label[1])}</text>`; } });
  el.innerHTML = o + '</svg><p class="hint">3D-Übersicht: hintere Wände voll, vordere niedrig geschnitten. Fenster blau, Türen braun, beschriftet mit Breite/Höhe in cm.</p>';
}


/* ---------- Maße bearbeiten: Wert antippen → eintippen oder ansagen (🎤) ---------- */
function editVals(title, fields, done) { // fields: [{k, label, v}] (v in m), done(obj) bei OK
  let box = $('#edUI'); if (!box) { box = document.createElement('div'); box.id = 'edUI'; document.body.appendChild(box); }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  box.innerHTML = `<div class="rescard"><h3>✏ ${esc(title)}</h3>${fields.map((f, i) => `<div class="row"><label style="flex:1">${esc(f.label)}<input data-i="${i}" inputmode="decimal" value="${f.v == null ? '' : f2(f.v, 3)}" style="width:100%"></label>${SR ? `<button data-mic="${i}" title="ansagen">🎤</button>` : ''}</div>`).join('')}<p id="edMsg" class="hint">${SR ? 'Zahl eintippen oder 🎤 tippen und ansagen, z. B. „4 Meter 21“ oder „2,55“.' : 'Zahl in m oder cm eintippen.'}</p><div class="resbtns"><button id="edOk" class="pri">✔ Übernehmen</button><button id="edNo">Abbrechen</button></div></div>`;
  box.hidden = false; const inp = [...box.querySelectorAll('input')]; setTimeout(() => { inp[0].focus(); inp[0].select(); }, 50);
  const close = () => { box.hidden = true; box.innerHTML = ''; };
  const ok = () => { const o = {}; for (const [i, f] of fields.entries()) { const t = inp[i].value.trim(), p = t ? KM.parse(t).v : null; if (t && !p) { $('#edMsg').innerHTML = `<span class="warn">„${esc(t)}“ ist keine gültige Zahl.</span>`; return; } o[f.k] = p; } close(); done(o); };
  $('#edOk').onclick = ok; $('#edNo').onclick = close; box.onclick = e => { if (e.target === box) close(); };
  inp.forEach(x => x.onkeydown = e => { if (e.key === 'Enter') ok(); });
  box.querySelectorAll('[data-mic]').forEach(b => b.onclick = () => {
    const i = +b.dataset.mic, r = new SR(); r.lang = 'de-AT'; r.maxAlternatives = 3; b.textContent = '⏺'; $('#edMsg').textContent = 'hört zu …';
    r.onresult = ev => { const alts = [...ev.results[0]].map(a => a.transcript), best = alts.find(a => KM.parse(a).v) || alts[0], v = KM.parse(best).v;
      if (v) { inp[i].value = f2(v, 3); $('#edMsg').textContent = `„${best}“ → ${f2(v, 3)} m`; } else $('#edMsg').innerHTML = `<span class="warn">„${esc(best)}“ – keine Zahl erkannt.</span>`; };
    r.onerror = ev => $('#edMsg').innerHTML = `<span class="warn">${ev.error === 'not-allowed' ? 'Mikrofon nicht freigegeben.' : 'Nicht verstanden – bitte nochmal.'}</span>`;
    r.onend = () => b.textContent = '🎤'; try { r.start(); } catch (e) { }
  });
}
// Zuordnung Ergebnis-Wand i → Plan-Wand (Reihenfolge/Richtung können sich bei der Übernahme ändern)
function wallMap(lengths, segs) {
  const n = lengths.length; if (!segs || segs.length !== n) return null; let best = null;
  for (const dir of [1, -1]) for (let s = 0; s < n; s++) { const map = lengths.map((_, i) => ((dir * i + s) % n + n) % n), e = lengths.reduce((a, L, i) => a + (L - segs[map[i]].len) ** 2, 0); if (!best || e < best.e) best = { map, e }; }
  return best.map;
}
const OPF = o => [{ k: 'w', label: 'Breite m', v: o.w }, { k: 'h', label: 'Höhe m', v: o.h }, ...(o.type === 'fenster' ? [{ k: 'brh', label: 'Parapet (BRH) m', v: o.brh || 0 }] : []), { k: 'pos', label: 'Abstand ab Wandanfang m', v: o.pos }];
const OPN = o => o.type === 'fenster' ? 'Fenster' : o.type === 'tuer' ? 'Tür' : 'Durchgang';
function resEdit(a, res, rec, taken) { // Ergebnis-Bildschirm: data-ed="len,ri,i" | "op,ri,k"
  const [kind, ri, i] = a.split(','), d = res[+ri], k = +i, pr = d.planRoom && S.rooms.includes(d.planRoom) ? d.planRoom : null;
  if (kind === 'len') editVals(`${d.name} – Wand ${k + 1}`, [{ k: 'L', label: 'Länge m', v: d.w.lengths[k] }], o => {
    if (!o.L) return; const map = pr ? wallMap(d.w.lengths, pr.segs) : null; d.w.lengths[k] = o.L; (d.w.man = d.w.man || [])[k] = true;
    if (pr && map) { pr.segs[map[k]].len = +o.L.toFixed(4); pr.adj = null; save(); renderPlan(); }
    showResult(res, rec, taken); });
  else { const op = d.ops[k]; editVals(`${d.name} – ${OPN(op)} in Wand ${op.wall + 1}`, OPF(op), o => {
    const po = pr && pr.ops.find(x => x === op || (x.wall === op.wall && Math.abs(x.pos - op.pos) < 1e-6 && Math.abs(x.w - op.w) < 1e-6));
    for (const f in o) if (o[f] != null) { op[f] = o[f]; if (po) po[f] = o[f]; }
    if (po) { save(); renderPlan(); } showResult(res, rec, taken); }); }
}
function planEdit(a) { // Plan: data-ed="seg,ri,i" | "op,ri,k" | "rh,ri"
  const [kind, ri, i] = a.split(','), r = S.rooms[+ri], k = +i; if (!r) return;
  const after = () => { r.adj = null; save(); renderPlan(); roomPanel(); if (!$('#vcut').hidden) viewCut(); };
  if (kind === 'seg') editVals(`${r.name} – Wand ${k + 1}`, [{ k: 'L', label: 'Länge m (lichtes Maß)', v: r.segs[k].len }], o => { if (o.L) { r.segs[k].len = +o.L.toFixed(4); after(); } });
  else if (kind === 'rh') editVals(`${r.name} – Raumhöhe`, [{ k: 'h', label: 'Raumhöhe m', v: r.h }], o => { if (o.h) { r.h = +o.h.toFixed(3); r.hSet = true; after(); } });
  else { const op = r.ops[k]; editVals(`${r.name} – ${OPN(op)} in Wand ${op.wall + 1}`, OPF(op), o => { for (const f in o) if (o[f] != null) op[f] = +o[f].toFixed(4); after(); }); }
}

/* ---------- Ergebnis-Bildschirm: Skizze mit allen Wandlängen, klare nächste Schritte ---------- */
function resSketch(poly, L, sig) {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = x1 - x0 || 1, h = y1 - y0 || 1, k = 260 / Math.max(w, h), W = w * k + 140, H = h * k + 100;
  const P = poly.map(p => [70 + (p[0] - x0) * k, 50 + (p[1] - y0) * k]), cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
  let o = `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" class="ressk"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#e3f2fd" stroke="#1f3a5f" stroke-width="5"/>`;
  P.forEach((p, i) => { const q = P[(i + 1) % P.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = mx - cx, dy = my - cy, n = Math.hypot(dx, dy) || 1, tx = mx + dx / n * 26, ty = my + dy / n * 26, bad = sig[i] == null || sig[i] > 0.005;
    o += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="${bad ? '#c62828' : '#1b5e20'}">${f2(L[i], 3)}</text><text x="${tx}" y="${ty + 16}" text-anchor="middle" font-size="11" fill="#555">Wand ${i + 1}${sig[i] != null ? ' ±' + Math.round(sig[i] * 1000) + ' mm' : ''}</text>`; });
  return o + '</svg>';
}
function resBusy(t) { let box = $('#resUI'); if (!box) { box = document.createElement('div'); box.id = 'resUI'; document.body.appendChild(box); } box.hidden = false; box.onclick = null; box.innerHTML = `<div class="rescard"><h2>⏳ Berechne den Raum …</h2><p>${esc(t || 'Bitte kurz warten.')}</p><progress style="width:100%" max="1" value="${Math.min(1, $('#pgProg').value || 0)}"></progress></div>`; }
function showResult(res, rec, taken, err) {
  let box = $('#resUI'); if (!box) { box = document.createElement('div'); box.id = 'resUI'; document.body.appendChild(box); }
  const ok = !err && res && res.some(d => d.w.ok);
  let h = `<div class="rescard"><h2>${ok ? '✅ Ergebnis' : '⚠ Auswertung nicht möglich'}</h2>`;
  if (ok) res.forEach(d => { if (!d.w.ok) { h += `<p class="warn">${esc(d.name)}: ${esc(d.w.msg)}</p>`; return; }
    const area = Math.abs(d.w.poly.reduce((a, p, i) => { const q = d.w.poly[(i + 1) % d.w.poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    const ri = res.indexOf(d), hh = d.w.height && d.w.hSig !== null && d.w.hSig < 0.005 ? d.w.height : (d.kmH || (d.planRoom && d.planRoom.hSet ? d.planRoom.h : null));
    h += `<h3>${esc(d.name)} · ${f2(area, 2)} m²</h3>${resSketch(d.w.poly, d.w.lengths, d.w.sigma)}<table class="pgt"><tr><th>Wand</th><th>Länge</th><th>Genauigkeit</th><th></th></tr>${d.w.lengths.map((L, i) => `<tr><td>${i + 1}</td><td class="ed" data-ed="len,${ri},${i}"><b>${f2(L, 3)}&nbsp;m</b> ✏</td><td class="${d.w.man && d.w.man[i] ? 'hint' : d.w.sigma[i] != null && d.w.sigma[i] <= 0.005 ? 'ok' : 'warn'}">${d.w.man && d.w.man[i] ? 'von Hand' : d.w.sigma[i] == null ? '–' : '±' + f2(d.w.sigma[i] * 1000, 1) + ' mm'}</td><td><button data-r="op" data-ri="${ri}" data-wi="${i}">📐 Fenster/Tür</button></td></tr>`).join('')}</table>`;
    h += `<p><b>Raumhöhe:</b> ${hh ? `<b>${f2(hh, 3)} m</b>` : '<span class="hint">nicht gemessen</span>'} – <label>eintragen <input data-rh="${ri}" inputmode="decimal" size="6" placeholder="z. B. 2,55" value="${hh ? f2(hh, 3) : ''}"></label> <span class="hint">(Laser/Maßband, oder Wandblatt an die Decke kleben)</span></p>`;
    const ops = d.ops || [];
    h += ops.length ? `<p><b>Fenster/Türen:</b></p><ul>${ops.map((o, k) => `<li class="ed" data-ed="op,${ri},${k}">✏ ${o.type === 'fenster' ? 'Fenster' : o.type === 'tuer' ? 'Tür' : 'Durchgang'} in Wand ${o.wall + 1}: Breite <b>${f2(o.w, 3)} m</b> · Höhe <b>${f2(o.h, 3)} m</b>${o.type === 'fenster' ? ` · Parapet ${f2(o.brh, 3)} m` : ''} · ab Wandanfang ${f2(o.pos, 3)} m</li>`).join('')}</ul>` : `<p class="hint">Fenster und Türen: bei der Wand auf „📐 Fenster/Tür“ tippen, dann im Foto zwei gegenüberliegende Ecken der Öffnung antippen.</p>`;
    if (d.w.warn.length) h += d.w.warn.map(x => `<p class="warn">⚠ ${esc(x)}</p>`).join(''); });
  else h += `<p>${esc(err || 'Es wurden zu wenige Marken erkannt.')}</p><p><b>Was tun?</b></p><ul><li>Jedes Blatt muss auf mehreren Bildern gut zu sehen sein – auch aus der Ecke schräg.</li><li>Den Zollstock mit beiden Bodenblättern mitfilmen, auch kurz von oben.</li><li>In Ecken filmen, damit zwei Blätter gleichzeitig im Bild sind.</li></ul>`;
  if (ok && rec && rec.suspect) h += `<p class="warn">⚠ Ergebnis unsicher: ${esc(rec.suspect)}</p>`;
  h += `<p class="hint">Tipp: eine Wand mit dem Maßband nachmessen und vergleichen.</p><div class="resbtns">${ok ? (taken ? '<button data-r="plan" class="pri">✔ Im Plan – ansehen</button>' : '<button data-r="take" class="pri">✔ In Plan übernehmen</button>') : ''}<button data-r="again">↻ Neu aufnehmen</button><button data-r="close">Schließen</button></div></div>`;
  box.innerHTML = h; box.hidden = false;
  box.onclick = e => { const ed = e.target.closest('[data-ed]'); if (ed) return resEdit(ed.dataset.ed, res, rec, taken); const a = e.target.closest('[data-r]')?.dataset.r; if (!a) return; box.hidden = true;
    if (a === 'take') { pgTake(); showTab('plan'); } else if (a === 'plan') showTab('plan'); else if (a === 'again') liveStart();
    else if (a === 'op') { const b = e.target.closest('[data-r]'); showTab('auf'); opStart(+b.dataset.ri, +b.dataset.wi); setTimeout(() => $('#opBox') && $('#opBox').scrollIntoView({ behavior: 'smooth' }), 100); } };
  box.querySelectorAll('[data-rh]').forEach(inp => { inp.onclick = e => e.stopPropagation(); inp.onchange = () => { const d = res[+inp.dataset.rh], v = parseLen(inp.value); if (!(v > 1.5 && v < 8)) return; d.kmH = v; if (d.planRoom && S.rooms.includes(d.planRoom)) { d.planRoom.h = +v.toFixed(3); d.planRoom.hSet = true; save(); renderPlan(); } }; });
}

/* ---------- Phase 2b: Erkennung im Hintergrund, Video sichern, genauer nachauswerten ---------- */
// Pool aus Web Workern: Marken in voller Auflösung schon während der Aufnahme erkennen → Auswertung am Ende in Sekunden
const DET = (() => {
  let pool = null, seq = 0; const wait = new Map();
  function init() {
    if (pool !== null) return pool;
    try {
      const n = Math.max(1, Math.min(2, (navigator.hardwareConcurrency || 4) - 1)); // 12-MP-Fotos: höchstens 2 Threads (Speicher)
      pool = Array.from({ length: n }, () => { const w = new Worker('detworker.js'); w.busy = 0; w.onmessage = e => { const p = wait.get(e.data.id); wait.delete(e.data.id); w.busy--; p && (e.data.err ? p.rej(new Error(e.data.err)) : p.res(e.data)); }; w.onerror = () => { pool = []; }; return w; });
    } catch (e) { pool = []; }
    return pool;
  }
  // bmp: ImageBitmap (wird übergeben, nicht kopiert); ohne Worker: Erkennung im Hauptthread
  async function detect(bmp) {
    const P = init();
    if (!P.length) { const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0); const W = bmp.width, H = bmp.height; bmp.close(); return { dets: MK.detect(toGray(x, W, H, new Float32Array(W * H)), W, H).filter(d => d.res < 0.8), W, H }; }
    const w = P.reduce((a, b) => b.busy < a.busy ? b : a); w.busy++; const id = ++seq;
    return new Promise((res, rej) => { wait.set(id, { res, rej }); w.postMessage({ id, bmp }, [bmp]); });
  }
  return { detect, get n() { return init().length; } };
})();
// Video der Aufnahme sichern (Hintergrund, MediaRecorder) – im Browser-Speicher (OPFS), automatisch gelöscht nach 7 Tagen
const VID = (() => {
  let rec = null, chunks = [], t0 = 0;
  const mime = () => ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
  function start(stream) {
    const m = mime(); if (!m) return false; chunks = []; t0 = Date.now();
    const s = stream.getVideoTracks()[0].getSettings(), px = (s.width || 1920) * (s.height || 1080);
    try { rec = new MediaRecorder(stream, { mimeType: m, videoBitsPerSecond: Math.round(px * 30 * 0.25) }); } catch (e) { return false; } // ca. 15 Mbit/s bei Full HD
    rec.ondataavailable = e => e.data.size && chunks.push(e.data); rec.start(1000); return true;
  }
  function stop() { return new Promise(res => { if (!rec || rec.state === 'inactive') return res(null); rec.onstop = () => { const b = new Blob(chunks, { type: rec.mimeType }); chunks = []; res(b); }; rec.stop(); }); }
  async function dir() { try { const r = await navigator.storage.getDirectory(); return await r.getDirectoryHandle('aufnahmen', { create: true }); } catch (e) { return null; } }
  async function save(name, blob) { const d = await dir(); if (!d) return false; try { const f = await d.getFileHandle(name, { create: true }), w = await f.createWritable(); await w.write(blob); await w.close(); return true; } catch (e) { return false; } }
  async function load(name) { const d = await dir(); if (!d) return null; try { return await (await d.getFileHandle(name)).getFile(); } catch (e) { return null; } }
  async function list() { const d = await dir(), L = []; if (!d) return L; for await (const [n, h] of d.entries()) { try { const f = await h.getFile(); L.push({ name: n, size: f.size, t: f.lastModified }); } catch (e) { } } return L.sort((a, b) => b.t - a.t); }
  async function remove(name) { const d = await dir(); if (d) try { await d.removeEntry(name); } catch (e) { } }
  async function cleanup(days = 7) { for (const f of await list()) if (Date.now() - f.t > days * 864e5) await remove(f.name); }
  return { start, stop, save, load, list, remove, cleanup, get since() { return t0; } };
})();
let pgPre = null, pgOverride = null, pgPrev = null;
async function vidState() {
  const L = await VID.list(), mb = L.reduce((a, f) => a + f.size, 0) / 1e6, el = $('#vidState'); if (!el) return;
  el.innerHTML = L.length ? `🎞 ${L.length} Video${L.length > 1 ? 's' : ''} gespeichert (${f2(mb, 0)} MB, werden nach 7 Tagen gelöscht) <button id="vidDel" class="danger">Videos löschen</button>` : '';
  const b = $('#vidDel'); if (b) b.onclick = async () => { if (!confirm('Alle gespeicherten Aufnahme-Videos löschen?')) return; for (const f of L) await VID.remove(f.name); vidState(); };
}
// Nachauswertung: Einzelbilder der Aufnahme + alle ruhigen Bilder aus dem Video
async function pgRefine(name) {
  const file = await VID.load(name); if (!file) return alert('Video nicht mehr vorhanden.');
  const base = pgLast, btn = $('#pgRun'), pr = $('#pgProg'); pr.hidden = false; pgLog('Genauere Auswertung: Video wird gelesen …');
  try {
    let still = null; try { still = JSON.parse(localStorage.getItem('raumplan-still-' + name)); } catch (e) { }
    let { frames, W, H } = await pgFrames([file], still && still.length >= 10 ? still : 0.2, (f, t) => { pr.value = f * 0.8; $('#pgSrc').textContent = 'Video: ' + t; });
    const all = frames.length; frames = selectStill(frames, W, H).map(f => ({ ...f, sw: 2.5 })); pgLog(`Video: ${frames.length} ruhige Bilder von ${all} (zählen schwächer als die Einzelfotos – Videokompression)`);
    if (base && base.W === W && base.H === H) frames = base.frames.concat(frames); else pgLog('Einzelbilder haben eine andere Größe – nur Videobilder verwendet.');
    pgPrev = base; pgOverride = { frames, W, H }; btn.click();
  } catch (e) { pgLog('Fehler: ' + e.message); alert('Genauere Auswertung nicht möglich: ' + e.message); }
}
// Vergleich schnelle ↔ genauere Auswertung
function refineCompare(res) {
  if (!pgPrev) return ''; const P = pgPrev.res; pgPrev = null; const rows = [];
  res.forEach((d, ri) => { const o = P[ri]; if (!d.w.ok || !o || !o.w.ok) return; d.w.lengths.forEach((L, i) => { const j = o.w.groups.findIndex(g => g.some(id => d.w.groups[i].includes(id))); if (j < 0) return; rows.push(`<tr><td>${esc(d.name)} Wand ${i + 1}</td><td>${f2(o.w.lengths[j], 4)} m ±${f2(o.w.sigma[j] * 1000, 1)}</td><td><b>${f2(L, 4)} m ±${f2(d.w.sigma[i] * 1000, 1)}</b></td><td>${f2((L - o.w.lengths[j]) * 1000, 1)} mm</td></tr>`); }); });
  return rows.length ? `<h4>🔬 Vergleich schnell ↔ genau</h4><table class="pgt"><tr><th></th><th>schnell</th><th>genau (mit Video)</th><th>Unterschied</th></tr>${rows.join('')}</table>` : '';
}
(typeof DEV !== 'undefined' && DEV.on ? Promise.resolve() : VID.cleanup()).then(vidState); // DEV: Videos behalten

/* ---------- Phase 2: Kontrollmaße (kontroll.js) ---------- */
KM.setContext(() => ({ session: live.session || null, wall: live.stream ? live.visKey : null, ids: live.stream ? live.visIds : null, shot: live.stream ? live.shots : null }));
const kmSrc = { sprache: '🎤', laser: '📏', hand: '✍' };
function kmRender() {
  const L = [...KM.list].reverse();
  $('#kmList').innerHTML = L.length ? L.map(e => `<li><span>${kmSrc[e.src] || ''}</span><span>${esc(KM.describe(e))}${e.wall ? ` <small class="hint">· ${esc(e.wall)} im Bild</small>` : ''}</span><span class="sp"></span><b>${f2(e.v, 3)} m</b><small class="hint">${new Date(e.t).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}</small><button data-kmdel="${e.id}">×</button></li>`).join('') + `<li><span class="sp"></span><button id="kmClear" class="danger">Alle löschen</button></li>`
    : '<li class="hint">Noch keine Kontrollmaße.</li>';
  $$('#kmList [data-kmdel]').forEach(b => b.onclick = () => KM.remove(+b.dataset.kmdel));
  const c = $('#kmClear'); if (c) c.onclick = () => { if (confirm('Alle Kontrollmaße löschen?')) KM.clear(); };
  const last = KM.list[KM.list.length - 1];
  $('#liveKmTxt').innerHTML = last && live.session && last.session === live.session ? `✓ ${esc(KM.describe(last))} <b>${f2(last.v, 3)} m</b>${last.wall ? ' → ' + esc(last.wall) : ''}` : 'Kontrollmaß: Laser messen oder ansagen';
}
KM.onChange(kmRender);
function kmMsg(t) { $('#kmState').textContent = t || ''; if (live.stream && t) $('#liveKmTxt').textContent = t; }
function kmListen() { KM.listen((e, err) => { if (err) return kmMsg(err); if (e) { kmMsg(''); navigator.vibrate?.([20, 40, 20]); } }, st => kmMsg(st)); }
async function kmLaser() {
  try {
    const n = await KM.connect(v => { const e = KM.add(v, 'laser'); navigator.vibrate?.(30); kmMsg(`Laser: ${f2(v, 3)} m${e.wall ? ' → ' + e.wall : ''} – jetzt ansagen, was es war (z. B. „Raumhöhe“), oder weitermessen.`); }, st => kmMsg(st));
    kmMsg(n + ' verbunden ✓ – Messtaste am Laser drücken.');
  } catch (e) { kmMsg(e.name === 'NotFoundError' ? 'Kein Laser ausgewählt.' : 'Laser: ' + e.message); }
}
$('#kmMic').onclick = kmListen; $('#liveMic').onclick = kmListen; $('#kmLaser').onclick = kmLaser; $('#liveLaser').onclick = kmLaser;
const kmManual = () => { const p = KM.parse($('#kmIn').value); if (!p.v) return kmMsg('Keine Zahl erkannt – z. B. „Raumhöhe 2,55“.'); KM.add(p.v, 'hand', { ...p, text: $('#kmIn').value }); $('#kmIn').value = ''; kmMsg(''); };
$('#kmAdd').onclick = kmManual; $('#kmIn').onkeydown = e => { if (e.key === 'Enter') kmManual(); };
kmRender();
// Vergleich nach der Auswertung: Kontrollmaße dieser Aufnahme gegen das Modell; Wandlängen werden auch als Kontrollmaß im Plan gespeichert
function kmCompare(res) {
  const ses = live.session, E = KM.list.filter(e => ses ? (e.session === ses || (!e.session && e.t >= ses)) : Date.now() - e.t < 12 * 3600e3);
  if (!E.length) return `<p class="hint">💡 Tipp: Kontrollmaße machen das Ergebnis überprüfbar – Raumhöhe und eine Wandlänge mit dem Laser messen oder ansagen (🎤).</p>`;
  const rows = [];
  E.forEach(e => {
    let model = null, sig = null, where = '';
    res.forEach(d => {
      if (!d.w.ok || model !== null) return;
      if ((e.kind === 'wand' || e.kind === 'mass') && e.ids) { const i = d.w.groups.findIndex(g => g.some(id => e.ids.includes(id))); if (i >= 0) { model = d.w.lengths[i]; sig = d.w.sigma[i]; where = `${d.name} Wand ${i + 1}`; (d.checks = d.checks || {})[i] = e.v; } }
      if (e.kind === 'hoehe') { if (d.w.height) { model = d.w.height; sig = d.w.hSig; where = d.name; } else { d.kmH = e.v; where = d.name + ' (als Raumhöhe übernommen)'; } }
      if (e.kind === 'diag' && d.w.poly.length === 4) { const P = d.w.poly, dg = [Math.hypot(P[0][0] - P[2][0], P[0][1] - P[2][1]), Math.hypot(P[1][0] - P[3][0], P[1][1] - P[3][1])]; model = dg.reduce((a, b) => Math.abs(b - e.v) < Math.abs(a - e.v) ? b : a); sig = Math.max(...d.w.sigma.filter(x => x != null)); where = d.name + ' Diagonale'; }
    });
    const note = where || (e.kind === 'fenster' || e.kind === 'tuer' ? 'Fenster/Türen: Zuordnung folgt in Phase 4' : 'keine passende Wand im Bild');
    rows.push(`<tr><td>${kmSrc[e.src] || ''} ${esc(KM.describe(e))}</td><td>${f2(e.v, 3)} m</td><td>${model !== null ? f2(model, 3) + ' m' : '–'}</td><td>${model !== null ? chkText(model - e.v, sig) : `<span class="hint">${esc(note)}</span>`}</td><td class="hint">${model !== null ? esc(where) : ''}</td></tr>`);
  });
  return `<h4>Kontrollmaße</h4><table class="pgt"><tr><th>Maß</th><th>gemessen</th><th>Modell</th><th>Abweichung</th><th></th></tr>${rows.join('')}</table>`;
}

/* ---------- Phase 1: Kamera-Kalibrierung (Assistent) ---------- */
const cal = { stream: null, views: [], timer: null, busy: false, prev: null, last: 0, cells: new Array(9).fill(0), tilts: {}, sh: [] };
function calState() {
  const c = CAM.load();
  $('#calState').innerHTML = c ? `📷 Kamera kalibriert ✓ <span class="hint">(Restfehler ${f2(c.rms, 2)} px, ${c.n} Bilder, ${esc(c.date)}${c.fixedFocus ? '' : ' – Fokus konnte nicht fixiert werden'})</span>`
    : `📷 Kamera noch nicht kalibriert – <a href="#" id="calLink">jetzt einmalig kalibrieren</a> (2 Minuten, macht die Messung genauer).`;
  const l = $('#calLink'); if (l) l.onclick = e => { e.preventDefault(); calStart(); };
}
$('#calPrint').onclick = () => { const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.'); w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kalibriertafel</title><style>@page{size:A4 portrait;margin:0}body{margin:0}svg{display:block}</style></head><body>${CAL.boardSVG()}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close(); };
// Kalibrierung: jedes ruhige, neue Bild wird sofort genommen; ab 4 Bildern wird nach jedem Bild gerechnet und die Genauigkeit angezeigt
const CAL_GOAL = 0.002; // Brennweite auf ±0,2 % → fertig
async function calStart() {
  if (!navigator.mediaDevices) return alert('Kamera im Browser nicht verfügbar.');
  let cm; try { cm = await CAM.open(); } catch (e) { return alert('Kamera nicht freigegeben: ' + e.message); }
  Object.assign(cal, { stream: cm.stream, info: cm.info, fixedFocus: cm.fixedFocus, views: [], sum: [], prev: null, prevT: 0, last: 0, sh: [], W: 0, H: 0, res: null, solving: false });
  const v = $('#calVid'); v.srcObject = cal.stream; await v.play(); $('#calUI').hidden = false;
  const ov = $('#calOv'), cv = document.createElement('canvas'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const solveNow = () => { if (cal.solving || cal.views.length < 4) return; cal.solving = true; setTimeout(() => { const r = CAL.solve(cal.views, cal.W, cal.H, { min: 4 }); if (!r.err) cal.res = r; cal.solving = false; }, 0); };
  const loop = async () => {
    if (!cal.stream) return;
    if (!cal.busy && v.videoWidth) {
      cal.busy = true;
      const W = v.videoWidth, H = v.videoHeight, s = Math.min(1, 1280 / W); cal.W = W; cal.H = H; cv.width = Math.round(W * s); cv.height = Math.round(H * s); ctx.drawImage(v, 0, 0, cv.width, cv.height);
      const g = toGray(ctx, cv.width, cv.height, new Float32Array(cv.width * cv.height)), d = MK.detect(g, cv.width, cv.height, { maxW: 1280, xcorners: false }).filter(m => m.id >= 40 && m.id <= 59);
      const sh = CAM.sharpness(g, cv.width, cv.height); cal.sh.push(sh); if (cal.sh.length > 30) cal.sh.shift(); const med = [...cal.sh].sort((a, b) => a - b)[cal.sh.length >> 1];
      // Bewegung je 100 ms (unabhängig davon, wie schnell das Handy rechnet)
      const now = performance.now(), dtf = Math.max(50, now - cal.prevT); cal.prevT = now;
      let mv = 0; if (cal.prev) d.forEach(m => { const q = cal.prev.get(m.id); if (q) mv = Math.max(mv, Math.hypot(m.c[0][0] - q[0], m.c[0][1] - q[1])); }); cal.prev = new Map(d.map(m => [m.id, m.c[0]]));
      const mvn = mv * 100 / dtf, steady = mvn < 6 && (cal.sh.length < 5 || sh >= 0.5 * med), inf = CAL.viewInfo(d, cv.width, cv.height);
      let ctr = null, side = 0;
      if (d.length) { const P = d.flatMap(m => m.c); ctr = [P.reduce((a, p) => a + p[0], 0) / P.length / cv.width, P.reduce((a, p) => a + p[1], 0) / P.length / cv.height]; side = d.reduce((a, m) => a + Math.hypot(m.c[0][0] - m.c[1][0], m.c[0][1] - m.c[1][1]), 0) / d.length / cv.width; }
      // neu = anders als alle bisherigen Bilder (Lage im Bild, Neigung oder Kipprichtung)
      const isNew = inf && cal.sum.every(q => Math.hypot(q.c[0] - ctr[0], q.c[1] - ctr[1]) > 0.12 || Math.abs(q.t - inf.tilt) > 10 || (inf.tilt > 15 && Math.abs(((q.a - inf.az + 540) % 360) - 180) > 45));
      const tilted = cal.sum.filter(q => q.t > 20).length, cellsSeen = new Set(cal.sum.map(q => Math.min(2, Math.floor(q.c[0] * 3)) + 3 * Math.min(2, Math.floor(q.c[1] * 3))));
      let hint, shot = false;
      if (inf && inf.n >= 4 && steady && isNew && Date.now() - cal.last > 600) {
        const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const x2 = c2.getContext('2d', { willReadFrequently: true }); x2.drawImage(v, 0, 0);
        const dets = MK.detect(toGray(x2, W, H, new Float32Array(W * H)), W, H).filter(m => m.id >= 40 && m.id <= 59).map(m => ({ id: m.id, c: m.c }));
        if (dets.length >= 4) { cal.views.push({ dets }); cal.sum.push({ c: ctr, t: inf.tilt, a: inf.az }); cal.last = Date.now(); navigator.vibrate?.(40); shot = true; solveNow(); }
      }
      // Vorschlag für das nächste Bild: erst schräg, dann noch nicht genutzte Bildbereiche
      const want = [4, 0, 2, 8, 6, 1, 5, 7, 3].find(c => !cellsSeen.has(c)), r0 = cal.res, acc = r0 && r0.sfRel ? r0.sfRel * 100 : null;
      if (shot) hint = `✅ Bild ${cal.views.length} aufgenommen.`;
      else if (!d.length) hint = 'Kalibriertafel ins Bild nehmen – flach auf dem Tisch, 30–50 cm Abstand.';
      else if (side && side < 0.022) hint = '🔴 Zu weit weg – <b>näher ran</b>.';
      else if (!steady) hint = '🔴 <b>Ruhig halten</b> …';
      else if (!isNew) hint = tilted < 2 ? '🟠 Handy <b>schräg</b> halten (ca. 30°) – jedes Mal von einer anderen Seite.' : want !== undefined ? '🟠 Tafel dorthin, wo das <b>grüne Feld</b> ist (dem gelben Pfeil folgen).' : '🟠 Etwas anders halten – Lage oder Neigung ändern.';
      else hint = '🟢 Gut – kurz ruhig halten …';
      const N = cal.views.length;
      $('#calHint').innerHTML = `<span class="calstep">${N} Bilder</span> ` + (acc !== null ? `<span class="calstep" style="background:${r0.sfRel <= CAL_GOAL ? '#2e7d32' : '#e0a800'}">Genauigkeit ±${f2(acc, 2)} %</span> ` : N ? '<span class="calstep">rechnet ab 4 Bildern</span> ' : '') + hint;
      $('#calInfo').textContent = ` ${cal.info}`;
      $('#calBar').style.width = Math.round(100 * (acc !== null ? Math.min(1, CAL_GOAL * 100 / acc) : Math.min(0.4, N / 10))) + '%';
      $('#calDone').disabled = !(r0 && N >= 5);
      const r = v.getBoundingClientRect(), pr = v.parentElement.getBoundingClientRect();
      ov.width = Math.round(r.width); ov.height = Math.round(r.height); Object.assign(ov.style, { width: r.width + 'px', height: r.height + 'px', left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', maxWidth: 'none', maxHeight: 'none' });
      const o = ov.getContext('2d'), k = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * k) / 2, oy = (r.height - cv.height * k) / 2, X = p => [p[0] * k + ox, p[1] * k + oy], cw = cv.width * k / 3, ch = cv.height * k / 3;
      o.clearRect(0, 0, ov.width, ov.height);
      if (want !== undefined && tilted >= 2 && d.length) {
        const tx = ox + (want % 3) * cw, ty = oy + Math.floor(want / 3) * ch, pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
        o.fillStyle = `rgba(76,175,80,${0.12 + 0.12 * pulse})`; o.fillRect(tx, ty, cw, ch); o.strokeStyle = '#4caf50'; o.lineWidth = 4; o.strokeRect(tx + 2, ty + 2, cw - 4, ch - 4);
        if (ctr) { const a = [ox + ctr[0] * cv.width * k, oy + ctr[1] * cv.height * k], b = [tx + cw / 2, ty + ch / 2], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 30) { o.strokeStyle = '#ffeb3b'; o.lineWidth = 6; o.beginPath(); o.moveTo(...a); o.lineTo(...b); o.stroke(); o.fillStyle = '#ffeb3b'; o.beginPath(); o.moveTo(b[0], b[1]); o.lineTo(b[0] - 22 * Math.cos(ang - 0.45), b[1] - 22 * Math.sin(ang - 0.45)); o.lineTo(b[0] - 22 * Math.cos(ang + 0.45), b[1] - 22 * Math.sin(ang + 0.45)); o.closePath(); o.fill(); } }
      }
      o.strokeStyle = steady ? '#4caf50' : '#ff9800'; o.lineWidth = 3; d.forEach(m => { o.beginPath(); m.c.forEach((p, i) => i ? o.lineTo(...X(p)) : o.moveTo(...X(p))); o.closePath(); o.stroke(); });
      o.fillStyle = steady ? '#4caf50' : '#f44336'; o.fillRect(0, ov.height - 10, ov.width * (steady ? 1 : Math.max(0.1, 1 - mvn / 40)), 10);
      cal.busy = false;
      // fertig, sobald genau genug (mind. 8 Bilder, davon 2 schräg)
      if (r0 && N >= 8 && tilted >= 2 && r0.sfRel <= CAL_GOAL && r0.rms < 0.8) return calFinish(W, H);
    }
    cal.timer = setTimeout(loop, 80);
  };
  loop();
}
function calStop() { clearTimeout(cal.timer); if (cal.stream) cal.stream.getTracks().forEach(t => t.stop()); cal.stream = null; $('#calUI').hidden = true; }
function calFinish(W, H) {
  calStop();
  const r = CAL.solve(cal.views, W, H, { min: 5 });
  if (r.err) return alert('Kalibrierung nicht möglich: ' + r.err + ' Bitte nochmal, dabei die Tafel aus mehr Richtungen filmen.');
  if (r.rms > 0.8) return alert(`Kalibrierung ungenau (Restfehler ${f2(r.rms, 2)} px). Tafel liegt vielleicht nicht flach oder die Bilder waren unscharf – bitte nochmal.`);
  CAM.save({ it: r.it, W, H, rms: r.rms, n: r.n, date: new Date().toLocaleDateString('de-AT'), fixedFocus: cal.fixedFocus, info: cal.info });
  calState();
  alert(`Kamera kalibriert ✓\nBrennweite ${r.it[0].toFixed(0)} px, Verzeichnung k1 ${r.it[3].toFixed(3)}, Restfehler ${f2(r.rms, 2)} px aus ${r.n} Bildern.${cal.fixedFocus ? '' : '\nHinweis: Dieses Handy lässt keinen festen Fokus zu – die Kalibrierung gilt dann nur ungefähr.'}`);
}
$('#calOpen').onclick = calStart; $('#calClose').onclick = calStop; $('#calDone').onclick = () => { if (cal.views.length >= 5) calFinish(cal.W, cal.H); }; calState();

/* ---------- AR-Aufmaß (ar.js) → Raum im Plan ---------- */
/* ---------- Messart wählen: Zollstock? Marken? Kontrollmaß? → Marken-Messung oder AR (mit Zollstock / Kontrollmaß / nur Handy) ---------- */
const MODEKEY = 'raumplan-mode';
function modeGet() { try { return { z: true, m: 'auto', k: true, ...JSON.parse(localStorage.getItem(MODEKEY) || '{}') }; } catch (e) { return { z: true, m: 'auto', k: true }; } }
function modeSet(o) { try { localStorage.setItem(MODEKEY, JSON.stringify(o)); } catch (e) { } }
function modeText(o) {
  if (o.m === 'ja') return ['🎯 Marken-Messung', 'ok', 'genaueste Methode, ca. ±1–3 mm je Wand'];
  const ar = o.m === 'auto' ? 'Erst Marken suchen – findet die Kamera keine, geht es automatisch ohne Marken (AR) weiter. ' : '';
  if (o.z && o.k) return ['📏 AR mit Zollstock + Kontrollmaß', 'ok', ar + 'ohne Marken: ca. ±0,2–0,4 % (bei 4 m ±1 cm)'];
  if (o.z) return ['📏 AR mit Zollstock', 'ok', ar + 'ohne Marken: ca. ±0,3–0,5 % (bei 4 m ±1–2 cm). Ein Kontrollmaß macht es sicherer.'];
  if (o.k) return ['📐 AR, Maßstab aus Kontrollmaß', 'warn', ar + 'ohne Marken: ca. ±0,5 % – nach der Messung eine lange Wand mit Maßband/Laser messen.'];
  return ['📱 Nur Handy', 'warn', ar + '⚠ Ohne Zollstock und ohne Kontrollmaß ist das Ergebnis SEHR UNGENAU (±1–3 %, bei 4 m bis ±12 cm) – nur als Skizze, nicht für einen Einreichplan.'];
}
function measureStart() {
  const o = modeGet(); let box = $('#modeUI'); if (!box) { box = document.createElement('div'); box.id = 'modeUI'; document.body.appendChild(box); }
  const q = (k, t, opts) => `<div class="mq"><b>${t}</b><div class="row">${opts.map(([v, l]) => `<button data-k="${k}" data-v="${v}" class="${String(o[k]) === String(v) ? 'pri' : ''}">${l}</button>`).join('')}</div></div>`;
  const draw = () => { const [t, cls, d] = modeText(o);
    box.innerHTML = `<div class="rescard"><h2>📹 Raum messen</h2>
      ${q('z', '1. Hast du einen Zollstock (2 m) dabei?', [[true, 'Ja'], [false, 'Nein']])}
      ${o.z ? `<p class="small">Zollstock ganz ausklappen und gerade auf den Boden legen. Länge <input id="mzLen" inputmode="decimal" size="6" value="${esc($('#pgDist').value || '2,000')}"> m</p>` : ''}
      ${q('m', '2. Sind Marken-Blätter an den Wänden?', [['ja', 'Ja'], ['nein', 'Nein'], ['auto', 'Selbst erkennen']])}
      ${q('k', '3. Kannst du eine Wand mit Maßband oder Laser nachmessen (Kontrollmaß)?', [[true, 'Ja'], [false, 'Nein']])}
      <p class="${cls}"><b>${t}</b><br>${d}</p>
      <div class="resbtns"><button id="mGo" class="pri big">▶ Los</button><button id="mNo">Abbrechen</button></div></div>`;
    box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k, v = b.dataset.v; o[k] = v === 'true' ? true : v === 'false' ? false : v; draw(); });
    const zl = $('#mzLen'); if (zl) zl.onchange = () => { $('#pgDist').value = zl.value; };
    $('#mNo').onclick = () => { box.hidden = true; };
    $('#mGo').onclick = () => { modeSet(o); box.hidden = true; live.autoAR = o.m === 'auto'; if (o.m === 'nein') arStart(); else liveStart(); };
  };
  draw(); box.hidden = false;
}
function arStart(msg) {
  const o = modeGet(); if (msg) alert(msg);
  AR.start(r => arResult(r, o, Date.now()), { zollstock: o.z ? (parseLen($('#pgDist').value) || 2) : 0 });
}
// AR-Ergebnis: Kontrollmaße (gesprochen/Laser/getippt) setzen den Maßstab; ohne Zollstock und Kontrollmaß deutliche Warnung
function arResult(r, o, tEnd) {
  const t0 = tEnd - 3 * 3600e3; let Q = r.poly.map(p => [p[0], p[1]]);
  const n = Q.length, L0 = Q.map((p, i) => dist(p, Q[(i + 1) % n])), sc = r.scale;
  const scaleTerm = L => L * (sc ? (sc.auto ? 0.001 : 0.003) / Math.sqrt(sc.n || 1) : 0.01) * (sc ? sc.k : 1);
  const fit = L0.map((L, i) => Math.sqrt(Math.max(0, r.sigma[i] ** 2 - scaleTerm(L) ** 2)) || 0.003);
  const A = { km: {} };
  // gesprochene/gemessene Wandmaße der letzten Stunden der passendsten Wand zuordnen (±8 %)
  KM.list.filter(e => e.t >= t0 && (e.kind === 'wand' || e.kind === 'mass')).forEach(e => { let bi = -1, bd = 0.08; L0.forEach((L, i) => { const d = Math.abs(e.v / L - 1); if (d < bd && A.km[i] == null) { bd = d; bi = i; } }); if (bi >= 0) A.km[bi] = e.v; });
  const calc = () => {
    const ks = Object.entries(A.km).map(([i, v]) => ({ i: +i, r: v / L0[+i] })), m = ks.length;
    let k = 1, sk;
    if (m) { const sw = ks.reduce((a, q) => a + L0[q.i], 0); k = ks.reduce((a, q) => a + q.r * L0[q.i], 0) / sw; const sd = m > 1 ? Math.sqrt(ks.reduce((a, q) => a + (q.r - k) ** 2, 0) / (m - 1)) : 0.002; sk = Math.hypot(0.001 / sw, sd / Math.sqrt(m)); }
    else sk = sc ? (sc.auto ? 0.001 : 0.003) / Math.sqrt(sc.n || 1) : 0.015; // nur Handy: WebXR-Maßstab erfahrungsgemäß 1–2 % daneben
    const L = L0.map(x => x * k), sg = L.map((x, i) => Math.hypot(fit[i] * k, x * sk));
    return { k, sk, m, L, sg, h: r.height ? r.height * k : null, zdev: m && sc ? (k - 1) * 100 : null };
  };
  const draw = () => {
    const c = calc(), mx = Math.max(...c.sg) * 1000, rel = c.sk * 100;
    let qual, cls;
    if (c.m) { qual = `Maßstab aus ${c.m} Kontrollmaß${c.m > 1 ? 'en' : ''}${sc ? ` (Zollstock wich ${f2(c.zdev, 2)} % ab)` : ''}.`; cls = 'ok'; }
    else if (sc) { qual = `Maßstab aus dem Zollstock (±${f2(rel, 2)} %). Mit einem Kontrollmaß wird es sicherer.`; cls = 'ok'; }
    else { qual = `⚠ SEHR UNGENAU: weder Zollstock noch Kontrollmaß – nur der Handy-Maßstab (±1–3 %, bei 4 m bis ±${Math.round(40 * 3)} mm). Bitte mindestens eine lange Wand mit Maßband/Laser nachmessen und unten eintragen.`; cls = 'warn'; }
    let box = $('#resUI'); if (!box) { box = document.createElement('div'); box.id = 'resUI'; document.body.appendChild(box); }
    box.innerHTML = `<div class="rescard"><h2>${c.m || sc ? '✅' : '⚠'} Ergebnis (ohne Marken)</h2>${resSketch(Q.map(p => [p[0] * c.k, p[1] * c.k]), c.L, c.sg)}
      <p class="${cls}">${qual}</p>
      <table class="pgt"><tr><th>Wand</th><th>Länge</th><th>±</th><th>Kontrollmaß</th></tr>${c.L.map((x, i) => `<tr><td>${i + 1}</td><td><b>${f2(x, 3)} m</b></td><td class="${c.sg[i] <= 0.005 ? 'ok' : 'warn'}">${f2(c.sg[i] * 1000, 0)} mm</td><td class="ed" data-km="${i}">${A.km[i] != null ? `<b>${f2(A.km[i], 3)} m</b> ✏` : '📏 eintragen'}</td></tr>`).join('')}</table>
      <p class="hint">Kontrollmaß: bei der Wand auf „📏 eintragen“ tippen und das gemessene Maß eintippen oder ansagen (🎤). Die längste Wand bringt am meisten.</p>
      <p><b>Raumhöhe:</b> ${c.h ? f2(c.h, 3) + ' m' : 'nicht gemessen'} · Genauigkeit ca. ±${Math.round(mx)} mm</p>
      <div class="resbtns"><button data-a="take" class="pri">✔ In Plan übernehmen</button><button data-a="no">Verwerfen</button></div></div>`;
    box.hidden = false;
    box.onclick = e => { const km = e.target.closest('[data-km]'), a = e.target.closest('[data-a]')?.dataset.a;
      if (km) { const i = +km.dataset.km; editVals(`Kontrollmaß Wand ${i + 1}`, [{ k: 'v', label: 'gemessen m (leer = entfernen)', v: A.km[i] }], v => { if (v.v) A.km[i] = v.v; else delete A.km[i]; draw(); }); }
      else if (a === 'no') { if (confirm('Messung verwerfen?')) box.hidden = true; }
      else if (a === 'take') { box.hidden = true; arTake(Q.map(p => [p[0] * c.k, p[1] * c.k]), c.sg.slice(), c.h, c.m ? `${c.m} Kontrollmaß(e)` : sc ? 'Zollstock' : 'nur Handy – ungenau'); }
    };
  };
  draw();
}
function arTake(Q, sg, height, how) {
  const rm = newRoom($('#arName').value || 'Raum ' + (S.rooms.length + 1), [], 0, 0); Object.assign(rm, fromPoly(Q, rm));
  if (rm.segs.reduce((s, g) => s + g.turn, 0) < 0) { Q = Q.reverse(); sg = sg.reverse(); sg.push(sg.shift()); Object.assign(rm, fromPoly(Q, rm)); } // Umlaufsinn wie im Plan
  if (height) rm.h = +height.toFixed(3);
  rm.adj = { wallSigma: sg, cornerMax: 0, s0: 1, red: 0, warn: how.includes('ungenau') ? ['Maßstab nur vom Handy – ungenau'] : [], v: [], ar: true, how };
  S.rooms = S.rooms.filter(q => !q.demo); rm.x = 0; rm.y = 0; placeFree(rm); S.rooms.push(rm); selRoom = S.rooms.length - 1; $('#arName').value = ''; save(); showTab('plan');
}

$('#arOpen').onclick = () => { const o = modeGet(); o.z = $('#arZoll').checked; o.m = 'nein'; modeSet(o); arStart(); };
$('#arScan').onclick = AR.toggleScan; $('#arZmore').onclick = AR.zMore;
$('#arExport').onclick = () => { let L = []; try { L = JSON.parse(localStorage.getItem('raumplan-ar-log') || '[]'); } catch (e) { } if (!L.length) return alert('Noch keine AR-Messung gespeichert.'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(L)], { type: 'application/json' })); a.download = `raumplan-ar-daten-${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
$('#arPoint').onclick = AR.point; $('#arNext').onclick = AR.next; $('#arUndo').onclick = AR.undo; $('#arDone').onclick = AR.finish; $('#arCancel').onclick = AR.cancel;

/* ---------- 2 Vermessen ---------- */
const parseLen = v => { const n = num(v); return n > 20 ? n / 100 : n; }; // > 20 -> Eingabe in cm
const ptSigma = () => $('#snapOn').checked ? 0.5 : 1.5; // Tippgenauigkeit Raumecken px
const refSigma = () => $('#snapOn').checked ? 0.2 : 1.5; // Referenz-Kreuze px
function refCorr(s) { // Referenz-Zuordnung Bild -> Boden (m)
  if (s.refType !== 'rect' || s.ref.length < 4) return null;
  const r = s.ref; let a = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; a += r[i][0] * r[j][1] - r[j][0] * r[i][1]; }
  const sg = a > 0 ? -1 : 1; // im Bild im Uhrzeigersinn geklickt -> nicht spiegeln
  const img = r.concat(s.refx.map(e => e.p)), world = [[0, 0], [s.W, 0], [s.W, s.D], [0, s.D]].concat(s.refx.map(e => e.w)).map(p => [p[0], sg * p[1]]);
  return { img, world };
}
function camK1(s) { return S.cam && S.cam.W === s.c.width && S.cam.H === s.c.height ? S.cam.k1 : S.cam && S.cam.k1 && S.cam.W / S.cam.H === s.c.width / s.c.height ? S.cam.k1 : 0; }
function mapper(s) {
  const rc = refCorr(s);
  if (rc) { const F = AG.fitFloor(rc.img, rc.world, s.c.width, s.c.height, camK1(s)); return F && F.map; }
  if (s.refType === 'line' && s.ref.length === 2) { const k = s.L / (dist(s.ref[0], s.ref[1]) || 1); return p => [p[0] * k, -p[1] * k]; }
  return null;
}
// Abgeleitete Größen einer Punktkette: Strecken (+Schluss) und Eckwinkel (Grad)
function chainVals(F, closed) {
  const n = F.length, d = [], w = [];
  for (let i = 0; i < n - 1 + (closed ? 1 : 0); i++) d.push(dist(F[i], F[(i + 1) % n]));
  for (let i = 0; i < n; i++) if (closed || (i > 0 && i < n - 1)) w.push(AG.cornerAngle(F.flat(), i, n) * R2D);
  return { d, w };
}
function measure(s) { // Messwerte + Monte-Carlo-Standardabweichungen
  const M = mapper(s); if (!M || s.pts.length < 2) return null;
  const closed = $('#closed').checked && s.pts.length > 2, sk = num(s.skirt) / 1000, F = s.pts.map(M), v = chainVals(F, closed);
  v.d = v.d.map(x => x + 2 * sk);
  let sd = null, sw = null;
  const rc = refCorr(s);
  if (rc) {
    const fs = num($('#floorS').value) / 1000, k1 = camK1(s);
    const sig = AG.monteCarlo(rc.img, rc.world, s.pts, (im, wd, pp, fl) => {
      const f = AG.fitFloor(im, wd, s.c.width, s.c.height, k1); if (!f) return null;
      const r = chainVals(pp.map(f.map).map(p => [p[0] + fl(), p[1] + fl()]), closed); return r.d.concat(r.w);
    }, refSigma(), 0.001, fs, 250, ptSigma());
    if (sig) { sd = sig.slice(0, v.d.length); sw = sig.slice(v.d.length); }
  }
  return { F, closed, d: v.d, w: v.w, sd, sw };
}
const mc = $('#mc'), mx = mc.getContext('2d');
let kalLine = 0;
$$('.seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; selPt = -1; $$('.seg button').forEach(x => x.classList.toggle('on', x === b)); drawMeas(); });
$('#snapSel').onchange = e => { cur = snaps[e.target.value]; selPt = -1; drawMeas(); };
$('#refType').onchange = e => { if (!cur) return; cur.refType = e.target.value; cur.ref = cur.ref.slice(0, e.target.value === 'rect' ? 4 : 2); drawMeas(); };
['W', 'D', 'L'].forEach(k => $('#ref' + k).oninput = e => { if (cur) { cur[k] = num(e.target.value); drawMeas(true); } });
$('#skirt').oninput = e => { if (cur) { cur.skirt = e.target.value; drawMeas(true); } };
$('#floorS').oninput = e => { S.floorS = num(e.target.value); save(); drawMeas(true); };
['#snapOn', '#closed'].forEach(q => $(q).onchange = () => drawMeas(true));
$('#zoom').oninput = e => { zoom = +e.target.value; drawMeas(true); };
const arrOf = s => mode === 'ref' ? s.ref.concat(s.refx.map(e => e.p)) : mode === 'kal' ? s.kal.flat() : s.pts;
function setPt(s, i, p) { // Punkt i im aktuellen Modus setzen
  if (mode === 'ref') { if (i < s.ref.length) s.ref[i] = p; else s.refx[i - s.ref.length].p = p; }
  else if (mode === 'kal') { let k = i; for (const l of s.kal) { if (k < l.length) { l[k] = p; return; } k -= l.length; } }
  else s.pts[i] = p;
}
function delPt(s, i) {
  if (mode === 'ref') { if (i < s.ref.length) s.ref.splice(i, 1); else s.refx.splice(i - s.ref.length, 1); }
  else if (mode === 'kal') { let k = i; for (const l of s.kal) { if (k < l.length) { l.splice(k, 1); return; } k -= l.length; } }
  else s.pts.splice(i, 1);
}
$$('[data-n]').forEach(b => b.onclick = () => {
  if (!cur || selPt < 0) return; const q = arrOf(cur)[selPt]; if (!q) return;
  const [dx, dy] = b.dataset.n.split(',').map(Number), st = 0.25; setPt(cur, selPt, [q[0] + dx * st, q[1] + dy * st]); drawMeas(true);
});
$('#ptDel').onclick = () => { if (cur && selPt >= 0) { delPt(cur, selPt); selPt = -1; drawMeas(true); } };
$('#ptClr').onclick = () => {
  if (!cur || !confirm('Alle Punkte dieses Modus löschen?')) return;
  if (mode === 'ref') { cur.ref = []; cur.refx = []; } else if (mode === 'kal') cur.kal = [[]]; else cur.pts = [];
  selPt = -1; drawMeas(true);
};
function snapTo(s, p) {
  if (!$('#snapOn').checked) return p;
  const ctx = s.c.getContext('2d', { willReadFrequently: true });
  return AG.refineCorner((x0, y0, w, h) => {
    if (x0 < 0 || y0 < 0 || x0 + w > s.c.width || y0 + h > s.c.height) return null;
    const d = ctx.getImageData(x0, y0, w, h).data, g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = 0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2];
    return g;
  }, p, Math.max(4, Math.round(s.c.width / 600)));
}
mc.addEventListener('click', e => {
  const s = cur; if (!s) return;
  const r = mc.getBoundingClientRect(), k = mc.width / r.width, p0 = [(e.clientX - r.left) * k, (e.clientY - r.top) * k];
  const arr = arrOf(s), hit = arr.findIndex(q => dist(q, p0) < 22 * k);
  if (hit >= 0) { selPt = hit === selPt ? -1 : hit; return drawMeas(true); }
  const p = mode === 'kal' ? p0 : snapTo(s, p0);
  if (selPt >= 0) { setPt(s, selPt, p); return drawMeas(true); }
  if (mode === 'kal') { s.kal[s.kal.length - 1].push(p0); return drawMeas(true); }
  if (mode === 'pts') { s.pts.push(p); return drawMeas(true); }
  // Referenz
  const max = s.refType === 'rect' ? 4 : 2;
  if (s.ref.length < max) { s.ref.push(p); if (s.ref.length === max && s.refType === 'line') mode = 'pts'; return drawMeas(true); }
  if (s.refType !== 'rect') return;
  const t = prompt('Zusatz-Referenzpunkt (Maßband-Markierung am Boden), Lage in cm ab Ecke A:\n• auf Kante A→B: z. B. 50\n• auf Kante A→D: z. B. d 30\n• beliebig: x y, z. B. 120 40', '');
  if (!t) return;
  const m = t.trim().toLowerCase().replace(/,/g, '.').split(/\s+/);
  let w = m[0] === 'd' ? [0, parseFloat(m[1])] : m.length > 1 ? [parseFloat(m[0]), parseFloat(m[1])] : [parseFloat(m[0]), 0];
  if (!w.every(isFinite)) return alert('Eingabe nicht verstanden.');
  s.refx.push({ p, w: w.map(v => v / 100) }); drawMeas(true);
});
$('#kNew').onclick = () => { if (cur && cur.kal[cur.kal.length - 1].length) { cur.kal.push([]); drawMeas(true); } };
$('#kClr').onclick = () => { if (cur) { cur.kal = [[]]; drawMeas(true); } };
$('#kRun').onclick = () => {
  if (!cur) return; const r = AG.calibK1(cur.kal, cur.c.width, cur.c.height);
  if (!r || cur.kal.filter(l => l.length >= 3).length < 2) return alert('Mindestens 2 Linien mit je ≥ 5 Punkten (möglichst lang, nahe am Bildrand) antippen.');
  S.cam = { k1: +r.k1.toFixed(5), W: cur.c.width, H: cur.c.height, rms: r.rms };
  save(); drawMeas(true);
  alert(`Kamera kalibriert: k1 = ${r.k1.toFixed(4)}, Restabweichung ${r.rms.toFixed(2)} px.${r.rms > 1.5 ? '\nAchtung: Linien evtl. nicht gerade oder ungenau getippt.' : ''}\nGilt für alle Bilder mit ${cur.c.width}×${cur.c.height} px (gleiche Kamera, gleicher Zoom).`);
};

function drawMeas(keepInputs) {
  const s = cur;
  $('#snapSel').innerHTML = snaps.map((x, i) => `<option value="${i}" ${x === s ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
  $('#tgtRoom').innerHTML = S.rooms.map((r, i) => `<option value="${i}">${esc(r.name)}</option>`).join('') || '<option value="">(kein Raum)</option>';
  if (!keepInputs) $('#floorS').value = f2(S.floorS ?? 2, 1);
  $$('.seg button').forEach(x => x.classList.toggle('on', x.dataset.m === mode));
  $('#refRow').hidden = mode !== 'ref'; $('#kalRow').hidden = mode !== 'kal';
  $('#kInfo').textContent = S.cam ? `Kalibriert: k1 = ${S.cam.k1} (${S.cam.W}×${S.cam.H})` : 'Nicht kalibriert.';
  listMeas();
  if (!s) { mc.width = mc.height = 0; $('#mstat').textContent = 'Kein Standbild – zuerst unter „1 Aufnahme“ ein Bild oder Foto übernehmen.'; $('#mres').textContent = ''; $('#loupe').hidden = true; return; }
  $('#refType').value = s.refType;
  if (!keepInputs) { $('#refW').value = f2(s.W, 3); $('#refD').value = f2(s.D, 3); $('#refL').value = f2(s.L, 3); $('#skirt').value = s.skirt || ''; }
  const rect = s.refType === 'rect';
  $('#lW').hidden = $('#lD').hidden = !rect; $('#lL').hidden = rect;
  mc.width = s.c.width; mc.height = s.c.height;
  const base = ($('#mwrap').clientWidth || 360) / s.c.width;
  mc.style.width = (s.c.width * base * zoom) + 'px';
  const k = 1 / (base * zoom), lw = 1.5 * k, pr = 6 * k;
  mx.drawImage(s.c, 0, 0);
  mx.font = `bold ${14 * k}px sans-serif`; mx.lineWidth = lw; mx.textBaseline = 'middle';
  const cross = (p, c, t, sel) => { // Fadenkreuz statt Punkt: Bildinhalt bleibt sichtbar
    const r = sel ? pr * 2 : pr * 1.4; mx.strokeStyle = '#000'; mx.lineWidth = 3 * k;
    mx.beginPath(); mx.moveTo(p[0] - r, p[1]); mx.lineTo(p[0] + r, p[1]); mx.moveTo(p[0], p[1] - r); mx.lineTo(p[0], p[1] + r); mx.stroke();
    mx.strokeStyle = c; mx.lineWidth = lw; mx.stroke();
    if (sel) { mx.beginPath(); mx.arc(p[0], p[1], r, 0, 7); mx.strokeStyle = '#fff'; mx.stroke(); }
    if (t) { mx.fillStyle = c; mx.strokeStyle = '#000'; mx.lineWidth = 3 * k; mx.strokeText(t, p[0] + pr * 1.3, p[1] - pr * 1.6); mx.fillText(t, p[0] + pr * 1.3, p[1] - pr * 1.6); mx.lineWidth = lw; }
  };
  const label = (p, t) => { mx.lineWidth = 4 * k; mx.strokeStyle = '#000'; mx.fillStyle = '#ff0'; mx.strokeText(t, ...p); mx.fillText(t, ...p); mx.lineWidth = lw; };
  let idx = 0;
  // Referenz
  if (s.ref.length) {
    mx.strokeStyle = '#ff8c1a'; mx.beginPath(); s.ref.forEach((p, i) => i ? mx.lineTo(...p) : mx.moveTo(...p));
    if (s.ref.length === 4) mx.closePath(); mx.stroke();
  }
  s.ref.forEach((p, i) => cross(p, '#ff8c1a', rect ? 'ABCD'[i] : ['0', 'L'][i], mode === 'ref' && idx++ === selPt));
  s.refx.forEach(e => cross(e.p, '#ffc400', `${Math.round(e.w[0] * 1000) / 10}|${Math.round(e.w[1] * 1000) / 10}`, mode === 'ref' && idx++ === selPt));
  // Kalibrierlinien
  idx = 0;
  s.kal.forEach((l, li) => { mx.strokeStyle = '#e040fb'; mx.beginPath(); l.forEach((p, i) => i ? mx.lineTo(...p) : mx.moveTo(...p)); mx.stroke(); l.forEach(p => cross(p, '#e040fb', '', mode === 'kal' && idx++ === selPt)); });
  // Messpunkte
  const R = measure(s);
  if (s.pts.length) {
    mx.strokeStyle = '#19d3ff'; mx.beginPath(); s.pts.forEach((p, i) => i ? mx.lineTo(...p) : mx.moveTo(...p)); if (R && R.closed) mx.closePath(); mx.stroke();
    if (R) R.d.forEach((v, i) => label(mid(s.pts[i], s.pts[(i + 1) % s.pts.length]), f2(v, 3) + (R.sd ? ' ±' + Math.round(R.sd[i] * 1000) : '')));
    s.pts.forEach((p, i) => cross(p, '#19d3ff', String(i + 1), mode === 'pts' && i === selPt));
  }
  // Status
  let st;
  if (mode === 'ref') st = s.ref.length < (rect ? 4 : 2) ? (rect ? `Referenz: Ecke ${'ABCD'[s.ref.length]} des Kreppband-Rechtecks antippen (A→B = Breite, B→C = Tiefe, reihum).` : `Maßband: ${s.ref.length ? 'Ende' : 'Anfang'} der Strecke antippen.`)
    : rect ? `Referenz vollständig ✔ (${s.refx.length} Zusatzpunkte). Weitere Maßband-Markierungen antippen erhöht die Genauigkeit – dann „B Raumecken“.` : 'Referenz vollständig ✔';
  else if (mode === 'kal') st = 'Kamera kalibrieren (einmalig je Handy/Zoomstufe): entlang einer langen, sicher geraden Kante (Türstock, Fliesenfuge, Kasten) ≥ 5 Punkte antippen, dann „Neue Linie“. 2–4 Linien, möglichst nahe am Bildrand.';
  else st = !mapper(s) ? 'Zuerst Referenz setzen (Modus A).' : 'Raumecken dort antippen, wo Wand und Boden sich treffen – reihum. Nur Punkte auf dem Boden sind korrekt!';
  if (selPt >= 0) st = `Punkt ausgewählt: tippen = verschieben, Pfeile = ¼ px fein, erneut antippen = abwählen.`;
  $('#mstat').textContent = st;
  // Ergebnis
  let h = '';
  if (R) {
    const tgt = (S.target || 3) / 1000;
    h += R.d.map((v, i) => `${i + 1}–${(i + 1) % s.pts.length + 1}: <b>${f2(v, 3)} m</b>${R.sd ? ` <span class="${R.sd[i] > tgt ? 'warn' : ''}">±${f2(R.sd[i] * 1000, 1)} mm</span>` : ''}`).join(' · ');
    if (R.w.length) h += '<br>Winkel: ' + R.w.map((v, i) => `${f2(v, 2)}°${R.sw ? ' ±' + f2(R.sw[i], 2) : ''}`).join(' · ');
    if (R.closed) { let a = 0; R.F.forEach((p, i) => { const q = R.F[(i + 1) % R.F.length]; a += p[0] * q[1] - q[0] * p[1]; }); h += ` · Fläche ≈ <b>${f2(Math.abs(a / 2))} m²</b>`; }
    if (s.refType === 'line') h += '<br><span class="warn">Streckenmodus: nur für frontal fotografierte Ebenen brauchbar.</span>';
    else {
      h += `<br><span class="hint">±-Werte = 1σ aus Tippgenauigkeit (Referenz ${refSigma()} px, Ecken ${ptSigma()} px), Referenz (±1 mm) und Bodenunebenheit. ${camK1(s) ? 'Kamera kalibriert ✔' : '<span class="warn">Kamera nicht kalibriert – Verzeichnung kann mehrere cm Fehler verursachen.</span>'}</span>`;
      if (R.sd && Math.max(...R.sd) > tgt) h += `<br><span class="warn">Ziel ±${S.target || 3} mm hier nicht erreicht → Wandlängen mit dem Maßband messen, Foto-Maße dienen dann als Form/Kontrolle.</span>`;
    }
  }
  $('#mres').innerHTML = h || '<span class="hint">Noch keine Messung.</span>';
  // Lupe
  const L = $('#loupe'), q = selPt >= 0 && arrOf(s)[selPt];
  L.hidden = !q;
  if (q) {
    const lx = L.getContext('2d'), Rr = 20; lx.imageSmoothingEnabled = false;
    lx.fillStyle = '#000'; lx.fillRect(0, 0, 160, 160);
    lx.drawImage(s.c, q[0] - Rr, q[1] - Rr, 2 * Rr, 2 * Rr, 0, 0, 160, 160);
    lx.strokeStyle = '#f00'; lx.lineWidth = 1; lx.beginPath(); lx.moveTo(80, 0); lx.lineTo(80, 160); lx.moveTo(0, 80); lx.lineTo(160, 80); lx.stroke();
  }
  listSnaps();
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

$('#toMeas').onclick = () => {
  const R = cur && measure(cur); if (!R) return alert('Referenz und mindestens 2 Punkte nötig.');
  R.d.forEach((v, i) => S.meas.push({ n: `${cur.name} P${i + 1}–P${(i + 1) % cur.pts.length + 1}`, v: +v.toFixed(4), s: R.sd ? +R.sd[i].toFixed(4) : null }));
  save(); listMeas();
};
// Foto-Beobachtungen für die Ausgleichung (Ecke k0 = Punkt 1)
function photoObs(R, k0, n) {
  const m = cur.pts.length, o = [], src = cur.name, ci = i => (k0 + i) % n;
  R.d.forEach((v, i) => o.push({ typ: 'foto', i: ci(i), j: ci((i + 1) % m), v: +v.toFixed(4), s: Math.max(R.sd ? R.sd[i] : 0.01, 0.0005), src }));
  const wi = R.closed ? [...Array(m).keys()] : [...Array(m).keys()].slice(1, -1);
  wi.forEach((pi, k) => o.push({ typ: 'fotowinkel', i: ci(pi), v: +R.w[k].toFixed(3), s: Math.max(R.sw ? R.sw[k] : 1, 0.02), src }));
  return o;
}
$('#toRoom').onclick = () => {
  const R = cur && measure(cur); if (!R || cur.pts.length < 3 || !R.closed) return alert('Referenz und mindestens 3 Raumecken nötig, „geschlossener Raum“ angehakt.');
  const name = prompt('Raumname?', 'Raum ' + (S.rooms.length + 1)); if (name === null) return;
  const r = newRoom(name, [], 0, 0), sk = num(cur.skirt) / 1000;
  // Sockelleiste: Polygon um Leistenstärke nach außen versetzen
  let Q = R.F; if (sk) { const tmp = { ...r, ...fromPoly(Q, r) }; tmp.segs.forEach(sg => sg.t = sk); Q = geo(tmp).O; }
  Object.assign(r, fromPoly(Q, r)); r.segs.forEach(sg => delete sg.t);
  r.rot = 0; r.obs = photoObs(R, 0, cur.pts.length); placeFree(r); S.rooms.push(r); selRoom = S.rooms.length - 1; save(); showTab('plan');
};
$('#toExist').onclick = () => {
  const r = S.rooms[$('#tgtRoom').value], R = cur && measure(cur);
  if (!r || !R) return alert('Raum wählen; Referenz und mindestens 2 Punkte nötig.');
  const n = r.segs.length, k0 = Math.round(num($('#tgtCorner').value)) - 1;
  if (k0 < 0 || k0 >= n || cur.pts.length > n || (R.closed && cur.pts.length !== n)) return alert(`Ecken passen nicht: Raum hat ${n} Ecken, Punkte ${cur.pts.length}.`);
  r.obs = (r.obs || []).concat(photoObs(R, k0, n)); selRoom = S.rooms.indexOf(r); save();
  alert(`${R.d.length} Strecken und ${R.w.length} Winkel aus „${cur.name}“ zu „${r.name}“ hinzugefügt. Unter „3 Plan“ → „Ausgleichen“.`);
};
function listMeas() {
  $('#mlist').innerHTML = S.meas.map((m, i) => `<li>${esc(m.n)}: <b>${f2(m.v, 3)} m</b>${m.s ? ` ±${f2(m.s * 1000, 1)} mm` : ''}<button data-d="${i}">×</button></li>`).join('') || '<li class="hint">leer</li>';
  $('#measList').innerHTML = S.meas.map(m => `<option value="${f2(m.v, 3)}">${esc(m.n)}</option>`).join('');
}
$('#mlist').onclick = e => { const i = e.target.dataset.d; if (i != null) { S.meas.splice(i, 1); save(); listMeas(); } };
$('#mAdd').onclick = () => { const v = parseLen($('#mVal').value); if (!v) return; S.meas.push({ n: $('#mName').value || 'manuell', v }); $('#mVal').value = $('#mName').value = ''; save(); listMeas(); };

/* ---------- Geometrie ---------- */
function newRoom(name, segs, x, y) { return { name, segs, x, y, rot: 0, mirror: false, h: 2.6, floor: '', status: 'bestand', ops: [], obs: [], adj: null }; }
function rectSegs(w, d) { return [w, d, w, d].map(len => ({ len, turn: 90 })); }
function normA(a) { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; }
function fromPoly(Q, old) {
  // Polygon (m) -> Wände mit Längen und Knickwinkeln; stellt sicher, dass links herum (CCW) gezählt wird
  const n = Q.length, sg = old && old.mirror ? -1 : 1;
  const ang = Q.map((p, i) => { const q = Q[(i + 1) % n]; return Math.atan2(q[1] - p[1], q[0] - p[0]) * R2D; });
  return {
    x: Q[0][0], y: Q[0][1], rot: ang[0],
    segs: Q.map((p, i) => ({ len: dist(p, Q[(i + 1) % n]), turn: sg * normA(ang[(i + 1) % n] - ang[i]), /* ungerundet */ t: old && old.segs[i] ? old.segs[i].t : undefined }))
  };
}
function isect(p1, d1, p2, d2) {
  const c = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(c) < 1e-9) return null;
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / c; return add(p1, mul(d1, t));
}
function geo(r) {
  const n = r.segs.length, sg = r.mirror ? -1 : 1, P = [];
  let a = (r.rot || 0) / R2D, x = 0, y = 0;
  for (const s of r.segs) { P.push([r.x + x, r.y + y]); x += s.len * Math.cos(a); y += s.len * Math.sin(a); a += sg * s.turn / R2D; }
  let A = 0; P.forEach((p, i) => { const q = P[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }); A /= 2;
  const o = A >= 0 ? 1 : -1;
  const E = P.map((p, i) => {
    const q = P[(i + 1) % n], L = dist(p, q) || 1e-9, d = [(q[0] - p[0]) / L, (q[1] - p[1]) / L];
    return { p, q, d, n: [o * d[1], -o * d[0]], L, t: r.segs[i].t ?? S.wallT };
  });
  const O = P.map((p, i) => {
    const e1 = E[(i - 1 + n) % n], e2 = E[i];
    return isect(add(e1.p, mul(e1.n, e1.t)), e1.d, add(e2.p, mul(e2.n, e2.t)), e2.d) || add(p, mul(e2.n, e2.t));
  });
  let cx = 0, cy = 0;
  P.forEach((p, i) => { const q = P[(i + 1) % n], f = p[0] * q[1] - q[0] * p[1]; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; });
  const c = Math.abs(A) > 1e-6 ? [cx / (6 * A), cy / (6 * A)] : P[0] || [0, 0];
  return { P, E, O, c, area: Math.abs(A), per: E.reduce((s, e) => s + e.L, 0), err: Math.hypot(x, y) };
}
function bb(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function allBB() {
  const pts = S.rooms.flatMap(r => r.segs.length ? geo(r).O : []);
  return pts.length ? bb(pts) : { x0: 0, x1: 6, y0: 0, y1: 4 };
}
function placeFree(r) {
  if (!S.rooms.length) { r.x = r.y = 0; return; }
  const b = allBB(), g = bb(geo({ ...r, x: 0, y: 0 }).P); r.x = b.x1 + 1 - g.x0; r.y = b.y0 - g.y0;
}

/* ---------- SVG-Plan (Einheiten cm, y nach unten) ---------- */
const T = p => `${(p[0] * 100).toFixed(1)},${(-p[1] * 100).toFixed(1)}`;
const X = p => (p[0] * 100).toFixed(1), Y = p => (-p[1] * 100).toFixed(1);
const mm = v => v * S.scale / 10; // Papier-mm -> Planeinheiten (cm)
const STC = { bestand: '#444', neu: '#d32f2f', abbruch: '#f2c200' };
function txt(p, s, size, rot = 0, extra = '') {
  return `<text x="${X(p)}" y="${Y(p)}" font-size="${mm(size).toFixed(1)}" text-anchor="middle" dominant-baseline="central"${rot ? ` transform="rotate(${rot.toFixed(1)} ${X(p)} ${Y(p)})"` : ''} ${extra}>${esc(s)}</text>`;
}
function dimTxt(p, L, rot) { // 4,21⁵ = 4,215 m (österr. Schreibweise)
  const t = Math.round(L * 1000), cm = Math.floor(t / 10), r = t % 10;
  const main = (S.dimFmt === 'cm' ? Math.round(L * 100) / 100 : cm / 100).toFixed(2).replace('.', ',');
  const sup = S.dimFmt !== 'cm' && r ? `<tspan dy="${-mm(1)}" font-size="${mm(1.8).toFixed(1)}">${r}</tspan>` : '';
  return `<text x="${X(p)}" y="${Y(p)}" font-size="${mm(2.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rot.toFixed(1)} ${X(p)} ${Y(p)})">${main}${sup}</text>`;
}
const dimStr = L => S.dimFmt === 'cm' ? f2(L) : f2(L, 3);
function rdAngle(d) { let a = -Math.atan2(d[1], d[0]) * R2D; if (a > 90.01) a -= 180; if (a <= -89.99) a += 180; return a; }
function line(a, b, w, c = '#000', extra = '') { return `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${c}" stroke-width="${mm(w).toFixed(2)}" ${extra}/>`; }
function inPoly(pt, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > pt[1]) !== (P[j][1] > pt[1]) && pt[0] < (P[j][0] - P[i][0]) * (pt[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; }
function innerWall(ri, e) { // liegt hinter der Wand ein anderer Raum?
  const q = add(mid(e.p, e.q), mul(e.n, e.t + 0.05));
  return S.rooms.some((o, k) => k !== ri && o.segs.length > 2 && inPoly(q, geo(o).P));
}
function planSVG(sel) {
  let o = '';
  S.rooms.forEach((r, ri) => {
    if (r.segs.length < 2) return;
    const g = geo(r), col = STC[r.status] || '#444';
    o += `<g class="room" data-i="${ri}" font-family="Arial,Helvetica,sans-serif">`;
    o += `<path d="M${g.P.map(T).join('L')}Z" fill="${sel === ri ? '#e3eefc' : '#fff'}" stroke="none"/>`;
    o += `<path d="M${g.O.map(T).join('L')}Z M${g.P.map(T).join('L')}Z" fill-rule="evenodd" fill="${col}" ${r.status === 'abbruch' ? 'fill-opacity=".55"' : ''} stroke="#000" stroke-width="${mm(.35)}"/>`;
    // Öffnungen
    (r.ops || []).forEach((op, oi) => {
      const e = g.E[op.wall]; if (!e) return; const edA = `class="ed" data-ed="op,${ri},${oi}"`;
      const s0 = add(e.p, mul(e.d, op.pos)), s1 = add(s0, mul(e.d, op.w)), nt = mul(e.n, e.t), eps = mul(e.n, -0.01), ept = mul(e.n, e.t + 0.01);
      o += `<path d="M${[add(s0, eps), add(s1, eps), add(s1, ept), add(s0, ept)].map(T).join('L')}Z" fill="#fff"/>`;
      o += line(s0, add(s0, nt), .35) + line(s1, add(s1, nt), .35);
      if (op.pair) return; // Gegenstück einer Tür im Nachbarraum: nur Wandöffnung
      const mids = add(mid(s0, s1), mul(e.n, e.t / 2)), ang = rdAngle(e.d);
      if (op.type === 'fenster') {
        [0, .45, .55, 1].forEach(f => o += line(add(s0, mul(e.n, e.t * f)), add(s1, mul(e.n, e.t * f)), f % 1 ? .18 : .25));
        o += txt(add(mids, mul(e.n, -(e.t / 2 + mm(3.5) / 100))), `FE ${Math.round(op.w * 100)}/${Math.round(op.h * 100)}`, 2.2, ang, edA);
        o += txt(add(mids, mul(e.n, -(e.t / 2 + mm(6.5) / 100))), `BRH ${Math.round((op.brh || 0) * 100)}`, 2, ang, edA);
      } else {
        const inw = op.aus ? 1 : -1, base = op.aus ? e.t : 0;
        const h0 = add(op.flip ? s1 : s0, mul(e.n, base)), o1 = add(op.flip ? s0 : s1, mul(e.n, base));
        if (op.type === 'tuer') {
          const leaf = add(h0, mul(e.n, inw * op.w));
          o += line(h0, leaf, .35);
          const v0 = [leaf[0] - h0[0], leaf[1] - h0[1]], v1 = [o1[0] - h0[0], o1[1] - h0[1]];
          const a0 = Math.atan2(v0[1], v0[0]), da = normA((Math.atan2(v1[1], v1[0]) - a0) * R2D) / R2D;
          const arc = []; for (let k = 0; k <= 16; k++) { const a = a0 + da * k / 16; arc.push(add(h0, [Math.cos(a) * op.w, Math.sin(a) * op.w])); }
          o += `<polyline points="${arc.map(T).join(' ')}" fill="none" stroke="#000" stroke-width="${mm(.18)}"/>`;
        }
        o += txt(add(mids, mul(e.n, -(e.t / 2 + mm(4) / 100))), `${op.type === 'tuer' ? 'T' : 'DG'} ${Math.round(op.w * 100)}/${Math.round(op.h * 100)}`, 2.2, ang, edA);
      }
    });
    // Bemaßung (lichte Maße)
    if (r.dims !== false) g.E.forEach((e, i) => {
      if (innerWall(ri, e)) { // Innenwand: Maßkette im Raum
        const off = -mm(5) / 100, a = add(e.p, mul(e.n, off)), b = add(e.q, mul(e.n, off)), tk = mul(add(e.d, e.n), mm(1.3) / 100);
        o += line(a, b, .18) + line(add(a, tk), add(a, mul(tk, -1)), .35) + line(add(b, tk), add(b, mul(tk, -1)), .35);
        o += dimTxt(add(mid(a, b), mul(e.n, -mm(2.2) / 100)), e.L, rdAngle(e.d)).replace('<text ', `<text class="ed" data-ed="seg,${ri},${i}" `);
        return;
      }
      const off = e.t + mm(7) / 100, a = add(e.p, mul(e.n, off)), b = add(e.q, mul(e.n, off)), tk = mul(add(e.d, e.n), mm(1.3) / 100);
      o += line(add(e.p, mul(e.n, e.t + mm(1.5) / 100)), add(a, mul(e.n, mm(1.5) / 100)), .13) + line(add(e.q, mul(e.n, e.t + mm(1.5) / 100)), add(b, mul(e.n, mm(1.5) / 100)), .13);
      o += line(a, b, .18) + line(add(a, tk), add(a, mul(tk, -1)), .35) + line(add(b, tk), add(b, mul(tk, -1)), .35);
      o += dimTxt(add(mid(a, b), mul(e.n, mm(2.2) / 100)), e.L, rdAngle(e.d)).replace('<text ', `<text class="ed" data-ed="seg,${ri},${i}" `);
    });
    // Raumstempel
    const c = add(g.c, [r.lx || 0, r.ly || 0]), dy = mm(4.2) / 100;
    o += txt(c, r.name, 3, 0, 'font-weight="bold"');
    o += txt(add(c, [0, -dy]), `${f2(g.area)} m²`, 2.5);
    o += txt(add(c, [0, -2 * dy]), `RH ${f2(r.h)} m`, 2.2, 0, `class="ed" data-ed="rh,${ri}"`);
    if (r.floor) o += txt(add(c, [0, -3 * dy]), r.floor, 2.2);
    if (sel === ri) {
      o += `<path d="M${g.O.map(T).join('L')}Z" fill="none" stroke="#1e6fd9" stroke-width="${mm(.8)}" stroke-dasharray="${mm(3)} ${mm(2)}"/>`;
      g.P.forEach((p, i) => { const q = add(p, mul(add(g.E[i].d, mul(g.E[(i - 1 + g.P.length) % g.P.length].d, -1)), mm(3) / 100)); o += `<circle cx="${X(q)}" cy="${Y(q)}" r="${mm(2.2)}" fill="#1e6fd9"/>` + txt(q, String(i + 1), 2.6, 0, 'fill="#fff" font-weight="bold"'); });
    }
    o += '</g>';
  });
  return o;
}

/* ---------- 3 Plan: Interaktion ---------- */
const svg = $('#psvg'); let vb = null, drag = null;
function renderPlan(fit) {
  if (fit || !vb) {
    const b = allBB(), m = 1.2, w = (b.x1 - b.x0 + 2 * m) * 100, h = (b.y1 - b.y0 + 2 * m) * 100;
    const ar = (svg.clientHeight || 400) / (svg.clientWidth || 600);
    vb = { x: (b.x0 - m) * 100, y: -(b.y1 + m) * 100, w: Math.max(w, h / ar) };
    vb.x -= (vb.w - w) / 2; vb.y -= (vb.w * ar - h) / 2;
  }
  const ar = (svg.clientHeight || 400) / (svg.clientWidth || 600);
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.w * ar}`);
  svg.innerHTML = gridSVG() + planSVG(selRoom) + cutLineSVG() + (S.rooms.length ? '' : `<text x="${vb.x + vb.w / 2}" y="${vb.y + vb.w * ar / 2}" text-anchor="middle" font-size="${vb.w / 30}" fill="#888">Raum anlegen: oben „+ Rechteckraum“ oder unter „2 Vermessen“ → „Punkte → neuer Raum“</text>`);
}
function gridSVG() {
  const ar = (svg.clientHeight || 400) / (svg.clientWidth || 600), st = vb.w > 3000 ? 500 : 100;
  let o = `<g stroke="#e6e9ee" stroke-width="${vb.w / 1500}">`;
  for (let x = Math.floor(vb.x / st) * st; x < vb.x + vb.w; x += st) o += `<line x1="${x}" y1="${vb.y}" x2="${x}" y2="${vb.y + vb.w * ar}"/>`;
  for (let y = Math.floor(vb.y / st) * st; y < vb.y + vb.w * ar; y += st) o += `<line x1="${vb.x}" y1="${y}" x2="${vb.x + vb.w}" y2="${y}"/>`;
  return o + '</g>';
}
function svgPt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
svg.addEventListener('pointerdown', e => {
  const g = e.target.closest('.room'), p = svgPt(e), edT = e.target.closest('[data-ed]');
  if (cutMode) { cutTap([p.x / 100, -p.y / 100]); return; }
  if (g) {
    const i = +g.dataset.i; if (selRoom !== i) { selRoom = i; roomPanel(); }
    drag = { i, p, x: S.rooms[i].x, y: S.rooms[i].y, moved: false, ed: edT && edT.dataset.ed, cx: e.clientX, cy: e.clientY };
  } else drag = { pan: true, cx: e.clientX, cy: e.clientY, vx: vb.x, vy: vb.y, moved: false };
  svg.setPointerCapture(e.pointerId); renderPlan();
});
svg.addEventListener('pointermove', e => {
  if (!drag) return;
  if (drag.pan) {
    const u = vb.w / svg.clientWidth, dx = e.clientX - drag.cx, dy = e.clientY - drag.cy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    vb.x = drag.vx - dx * u; vb.y = drag.vy - dy * u; renderPlan(); return;
  }
  if (!drag.moved && Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy) < 6) return; // Antippen ≠ Verschieben
  const p = svgPt(e), r = S.rooms[drag.i];
  r.x = Math.round((drag.x + (p.x - drag.p.x) / 100) * 100) / 100;
  r.y = Math.round((drag.y - (p.y - drag.p.y) / 100) * 100) / 100;
  drag.moved = true; renderPlan();
});
svg.addEventListener('pointerup', () => {
  if (!drag) return;
  if (drag.pan && !drag.moved && selRoom !== null) { selRoom = null; roomPanel(); }
  if (!drag.pan && drag.moved) { snapRoom(drag.i); save(); roomPanel(); }
  const ed = !drag.pan && !drag.moved && drag.ed; drag = null; renderPlan(); if (ed) planEdit(ed);
});
svg.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15); }, { passive: false });
function zoomBy(f) { const ar = svg.clientHeight / svg.clientWidth, cx = vb.x + vb.w / 2, cy = vb.y + vb.w * ar / 2; vb.w *= f; vb.x = cx - vb.w / 2; vb.y = cy - vb.w * ar / 2; renderPlan(); }
$('#zIn').onclick = () => zoomBy(1 / 1.3); $('#zOut').onclick = () => zoomBy(1.3); $('#zFit').onclick = () => renderPlan(true);
function snapRoom(i) {
  const r = S.rooms[i], b = bb(geo(r).P), g = S.innerT, tol = 0.25; let bx = null, by = null;
  const best = (cur, d) => Math.abs(d) < tol && (cur === null || Math.abs(d) < Math.abs(cur)) ? d : cur;
  S.rooms.forEach((o, j) => {
    if (j === i || o.segs.length < 2) return; const c = bb(geo(o).P);
    [[b.x0, c.x1 + g], [b.x1, c.x0 - g], [b.x0, c.x0], [b.x1, c.x1]].forEach(([v, t]) => bx = best(bx, t - v));
    [[b.y0, c.y1 + g], [b.y1, c.y0 - g], [b.y0, c.y0], [b.y1, c.y1]].forEach(([v, t]) => by = best(by, t - v));
  });
  if (bx !== null) r.x = +(r.x + bx).toFixed(3); if (by !== null) r.y = +(r.y + by).toFixed(3);
}
/* ---------- Schnitt: Schnittlinie im Plan → Schnittansicht (kotiert) ---------- */
const SLAB = 0.25; // Deckenstärke m (Darstellung)
let cutMode = 0, cutA = null;
function cutGeom() { // -> {R:[rects], V:[ansicht-rects], D:[dims], T:[texts], u0,u1,z0,z1} in Schnittkoordinaten (u entlang A→B, z Höhe)
  const c = S.cut; if (!c) return null;
  const A = c.a, Lc = dist(c.a, c.b); if (Lc < 0.1) return null;
  const d = [(c.b[0] - A[0]) / Lc, (c.b[1] - A[1]) / Lc], v = [-d[1], d[0]]; // Blickrichtung: links von A→B (A links im Schnittbild)
  const U = p => (p[0] - A[0]) * d[0] + (p[1] - A[1]) * d[1], Vd = p => (p[0] - A[0]) * v[0] + (p[1] - A[1]) * v[1];
  const hit = (p, q) => { // Schnitt Linie A→B mit Strecke p→q: {u, s (0..1 auf p→q)}
    const e = [q[0] - p[0], q[1] - p[1]], den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-9) return null;
    const w = [p[0] - A[0], p[1] - A[1]], u = (w[0] * e[1] - w[1] * e[0]) / den, s = (w[0] * d[1] - w[1] * d[0]) / den;
    return { u, s };
  };
  const R = [], V = [], D = [], T = [];
  S.rooms.forEach(r => {
    if (r.segs.length < 3) return; const g = geo(r), n = g.P.length, h = r.h || 2.6, col = STC[r.status] || '#444';
    const cuts = [];
    g.E.forEach((e, i) => {
      const hi = hit(e.p, e.q); if (!hi || hi.s < -1e-6 || hi.s > 1 + 1e-6) return;
      const ho = hit(g.O[i], g.O[(i + 1) % n]); const uo = ho ? ho.u : hi.u;
      if (Math.max(hi.u, uo) < 0 || Math.min(hi.u, uo) > Lc) return;
      const sw = hi.s * e.L, op = (r.ops || []).find(o => o.wall === i && sw >= o.pos - 1e-6 && sw <= o.pos + o.w + 1e-6);
      cuts.push({ ui: hi.u, uo, op, i });
    });
    cuts.sort((a, b) => a.ui - b.ui);
    const iv = [];
    for (let k = 0; k + 1 < cuts.length; k++) { const um = (cuts[k].ui + cuts[k + 1].ui) / 2, pm = add(A, mul(d, um)); if (inPoly(pm, g.P)) iv.push([cuts[k].ui, cuts[k + 1].ui]); }
    if (!iv.length) return;
    iv.forEach(([a, b]) => { // Raum: Decke, Raumhöhe, lichte Breite, Name
      R.push({ u0: a, u1: b, z0: h, z1: h + SLAB, k: 'decke' });
      D.push({ a: [a, -SLAB - 0.5], b: [b, -SLAB - 0.5], L: b - a });
      D.push({ a: [a + 0.35, 0], b: [a + 0.35, h], L: h, vert: 1 });
      T.push({ p: [(a + b) / 2, h * 0.62], s: r.name, size: 3, bold: 1 }, { p: [(a + b) / 2, h * 0.62 - 0.32], s: `RH ${f2(h)} m`, size: 2.2 });
    });
    cuts.forEach(cu => { // geschnittene Wände (mit Öffnungen)
      const a = Math.min(cu.ui, cu.uo), b = Math.max(cu.ui, cu.uo), top = h + SLAB, o = cu.op;
      if (!o) { R.push({ u0: a, u1: b, z0: 0, z1: top, k: 'wand', col }); return; }
      const z0 = o.type === 'fenster' ? (o.brh || 0) : 0, z1 = Math.min(z0 + o.h, h);
      if (z0 > 0) R.push({ u0: a, u1: b, z0: 0, z1: z0, k: 'wand', col });
      R.push({ u0: a, u1: b, z0: z1, z1: top, k: 'wand', col });
      R.push({ u0: a, u1: b, z0, z1, k: o.type === 'fenster' ? 'glas' : 'tuer' });
      const out = cu.ui < cu.uo ? 1 : -1, x = (out > 0 ? b : a) + out * 0.45; // Höhenkoten außen an der Wand
      const zs = o.type === 'fenster' ? [0, z0, z1, h] : [0, z1, h];
      for (let k = 0; k + 1 < zs.length; k++) if (zs[k + 1] - zs[k] > 0.005) D.push({ a: [x, zs[k]], b: [x, zs[k + 1]], L: zs[k + 1] - zs[k], vert: 1, lab: o.type === 'fenster' ? ['BRH', 'FE', ''][k] : ['T', ''][k] });
    });
    g.E.forEach((e, i) => { // Ansicht: Öffnungen in Wänden hinter der Schnittlinie, die zum Betrachter zeigen
      if (e.n[0] * v[0] + e.n[1] * v[1] > -0.7 || Vd(mid(e.p, e.q)) <= 0) return;
      (r.ops || []).filter(o => o.wall === i && !o.pair).forEach(o => {
        const p0 = add(e.p, mul(e.d, o.pos)), p1 = add(p0, mul(e.d, o.w)); let a = Math.min(U(p0), U(p1)), b = Math.max(U(p0), U(p1));
        if (!iv.some(([x0, x1]) => a >= x0 - 0.01 && b <= x1 + 0.01)) return;
        const z0 = o.type === 'fenster' ? (o.brh || 0) : 0; V.push({ u0: a, u1: b, z0, z1: Math.min(z0 + o.h, h), k: o.type, lab: `${o.type === 'fenster' ? 'FE' : o.type === 'tuer' ? 'T' : 'DG'} ${Math.round(o.w * 100)}/${Math.round(o.h * 100)}` });
      });
    });
  });
  if (!R.length) return { empty: true, name: c.name || 'A' };
  const us = R.flatMap(q => [q.u0, q.u1]), u0 = Math.min(...us) - 0.3, u1 = Math.max(...us) + 0.3, zt = Math.max(...R.map(q => q.z1));
  R.unshift({ u0, u1, z0: -SLAB, z1: 0, k: 'boden' });
  const ux = Math.min(u0, ...D.filter(m => m.vert).map(m => m.a[0])) - mm(5) / 100;
  T.push({ p: [ux, 0.02], s: '±0,00', size: 2.2, end: 1 }, { p: [(u0 + u1) / 2, -SLAB - 1.25], s: `Schnitt ${c.name || 'A'}–${c.name || 'A'}`, size: 4, bold: 1 });
  return { R, V, D, T, u0: Math.min(u0 - 1.2, ux - 1), u1: Math.max(u1, ...D.map(m => m.a[0])) + 1.2, z0: -SLAB - 1.6, z1: zt + 0.5, name: c.name || 'A' };
}
function cutSVG(G) { // Planeinheiten wie planSVG: [u, z] → T()
  let o = '<g font-family="Arial,Helvetica,sans-serif">';
  const rect = (q, fill, w = .35, extra = '') => `<path d="M${[[q.u0, q.z0], [q.u1, q.z0], [q.u1, q.z1], [q.u0, q.z1]].map(T).join('L')}Z" fill="${fill}" stroke="#000" stroke-width="${mm(w).toFixed(2)}" ${extra}/>`;
  G.R.forEach(q => {
    if (q.k === 'boden' || q.k === 'decke') o += rect(q, '#cfcfcf', .25);
    else if (q.k === 'wand') o += rect(q, q.col || '#444');
    else if (q.k === 'glas') { o += rect(q, '#fff', .25); const m = (q.u0 + q.u1) / 2, dw = (q.u1 - q.u0) * 0.08; o += line([m - dw, q.z0], [m - dw, q.z1], .18) + line([m + dw, q.z0], [m + dw, q.z1], .18); }
    else o += rect(q, '#fff', .25);
  });
  G.V.forEach(q => { o += rect(q, 'none', .18); if (q.k === 'fenster') o += line([(q.u0 + q.u1) / 2, q.z0], [(q.u0 + q.u1) / 2, q.z1], .13); o += txt([(q.u0 + q.u1) / 2, q.z1 + 0.12], q.lab, 2); });
  G.D.forEach(m => {
    const tk = mm(1.3) / 100, t1 = [tk, tk], dir = m.vert ? [0, 1] : [1, 0], nrm = m.vert ? [-1, 0] : [0, 1];
    o += line(m.a, m.b, .18) + line(add(m.a, t1), add(m.a, mul(t1, -1)), .35) + line(add(m.b, t1), add(m.b, mul(t1, -1)), .35);
    const p = add(mid(m.a, m.b), mul(nrm, mm(2.2) / 100));
    o += dimTxt(p, m.L, m.vert ? -90 : 0);
    if (m.lab) o += txt(add(p, mul(dir, -mm(5.5) / 100)), m.lab, 1.8, m.vert ? -90 : 0);
  });
  G.T.forEach(t => o += txt(t.p, t.s, t.size, 0, `${t.bold ? 'font-weight="bold"' : ''}${t.end ? ' text-anchor="end"' : ''}`).replace(t.end ? 'text-anchor="middle" ' : '\0', ''));
  return o + '</g>';
}
function cutLineSVG() { // Schnittlinie im Grundriss
  const c = S.cut; if (!c) return ''; const L = dist(c.a, c.b); if (L < 0.1) return '';
  const d = [(c.b[0] - c.a[0]) / L, (c.b[1] - c.a[1]) / L], v = [-d[1], d[0]], ex = mm(4) / 100, a = add(c.a, mul(d, -ex)), b = add(c.b, mul(d, ex)), nm = c.name || 'A';
  let o = line(a, b, .5, '#000', `stroke-dasharray="${mm(6)} ${mm(1.5)} ${mm(1)} ${mm(1.5)}"`);
  [a, b].forEach((p, j) => { const tip = add(p, mul(v, mm(5) / 100)); o += line(p, tip, .5) + `<path d="M${[tip, add(add(tip, mul(v, -mm(2) / 100)), mul(d, mm(1) / 100)), add(add(tip, mul(v, -mm(2) / 100)), mul(d, -mm(1) / 100))].map(T).join('L')}Z"/>` + txt(add(p, mul(d, (j ? 1 : -1) * mm(3) / 100)), nm, 3.5, 0, 'font-weight="bold"'); });
  return o;
}
function viewCut() {
  const el = $('#vcut'), G = cutGeom();
  if (!S.cut) { el.innerHTML = '<p class="hint">Noch keine Schnittlinie – „✂ Schnitt“ tippen, dann im Plan zwei Punkte antippen.</p>'; return; }
  const btn = '<div class="row"><button id="cutFlip">⇆ Blickrichtung</button><button id="cutNew">✂ neu setzen</button><button id="cutDel" class="danger">Schnitt entfernen</button></div>';
  if (!G || G.empty) el.innerHTML = '<p class="hint">Die Schnittlinie schneidet keinen Raum.</p>' + btn;
  else el.innerHTML = `<svg class="v3d" xmlns="http://www.w3.org/2000/svg" viewBox="${G.u0 * 100} ${-G.z1 * 100} ${(G.u1 - G.u0) * 100} ${(G.z1 - G.z0) * 100}">${cutSVG(G)}</svg>${btn}`;
  $('#cutFlip').onclick = () => { S.cut = { ...S.cut, a: S.cut.b, b: S.cut.a }; save(); renderPlan(); viewCut(); };
  $('#cutNew').onclick = () => cutStart();
  $('#cutDel').onclick = () => { S.cut = null; save(); $('#vcut').hidden = true; renderPlan(); };
}
function cutStart() { cutMode = 1; cutA = null; $('#cutBtn').textContent = '✂ 1. Punkt antippen …'; $('#cutBtn').classList.add('pri'); }
function cutTap(p) { // p in m
  if (cutMode === 1) { cutA = p; cutMode = 2; $('#cutBtn').textContent = '✂ 2. Punkt antippen …'; return; }
  let b = p; const ang = Math.atan2(b[1] - cutA[1], b[0] - cutA[0]) * R2D, L = dist(cutA, b), sn = Math.round(ang / 90) * 90;
  if (Math.abs(ang - sn) < 8) b = add(cutA, [L * Math.cos(sn / R2D), L * Math.sin(sn / R2D)]); // fast waagrecht/senkrecht → gerade
  cutMode = 0; $('#cutBtn').textContent = '✂ Schnitt'; $('#cutBtn').classList.remove('pri');
  if (L < 0.2) return renderPlan();
  S.cut = { a: cutA.map(v => +v.toFixed(3)), b: b.map(v => +v.toFixed(3)), name: S.cut?.name || 'A' }; save();
  $('#vcut').hidden = false; viewCut(); renderPlan();
}
$('#cutBtn').onclick = () => { if (cutMode) { cutMode = 0; $('#cutBtn').textContent = '✂ Schnitt'; $('#cutBtn').classList.remove('pri'); return; } if (S.cut && $('#vcut').hidden) { $('#vcut').hidden = false; viewCut(); return; } cutStart(); };
$('#toProj').onclick = () => showTab('proj'); $('#show3d').onclick = () => { const el = $('#v3d'); el.hidden = !el.hidden; if (!el.hidden) view3d(); }; $('#showRes').onclick = opBack; $('#backPlan').onclick = () => showTab('plan');
$('#planClear').onclick = () => { if (!S.rooms.length || !confirm(`Alle ${S.rooms.length} Räume aus dem Plan löschen?`)) return; S.rooms = []; selRoom = null; save(); renderPlan(true); roomPanel(); };
$('#nAdd').onclick = () => {
  const w = num($('#nW').value), d = num($('#nD').value); if (!(w > 0 && d > 0)) return alert('Breite und Tiefe in m eingeben (z. B. 4,20).');
  const r = newRoom($('#nName').value || 'Raum ' + (S.rooms.length + 1), rectSegs(w, d), 0, 0);
  placeFree(r); S.rooms.push(r); selRoom = S.rooms.length - 1; $('#nName').value = $('#nW').value = $('#nD').value = '';
  save(); renderPlan(true); roomPanel();
};

function roomPanel() {
  const el = $('#rpanel'), r = S.rooms[selRoom];
  if (!r) { el.innerHTML = '<p class="hint">Raum antippen zum Bearbeiten · Raum ziehen = verschieben (fängt an Nachbarräumen mit Innenwandabstand) · leere Fläche ziehen = Ansicht verschieben.</p>'; return; }
  const n = r.segs.length, wOpt = i => r.segs.map((_, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${k + 1}</option>`).join('');
  el.innerHTML = `<div class="grid">
    <label>Raumname<input data-k="name" value="${esc(r.name)}"></label>
    <label>Raumhöhe m<input data-k="h" inputmode="decimal" value="${f2(r.h)}"></label>
    <label>Fußboden<input data-k="floor" value="${esc(r.floor)}" placeholder="z. B. Fliesen"></label>
    <label>Status<select data-k="status">${['bestand', 'neu', 'abbruch'].map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    <label>X m<input data-k="x" inputmode="decimal" value="${f2(r.x)}"></label>
    <label>Y m<input data-k="y" inputmode="decimal" value="${f2(r.y)}"></label>
    <label>Drehung °<input data-k="rot" inputmode="decimal" value="${f2(r.rot, 1)}"></label>
    <label>Bemaßung<select data-k="dims"><option value="1">ein</option><option value="0" ${r.dims === false ? 'selected' : ''}>aus</option></select></label>
  </div>
  <p id="rstat"></p>
  <div class="row">
    <button data-a="rot90">↻ 90°</button><button data-a="mirror">Spiegeln</button><button data-a="ortho">Winkel → 90°</button>
    <button data-a="close">Letzte Wand schließen</button><button data-a="dup">Duplizieren</button><button data-a="del" class="danger">Löschen</button>
  </div>
  <table><tr><th>Wand</th><th>Länge m</th><th>±mm</th><th>Knick °</th><th>Stärke m</th><th></th></tr>
  ${r.segs.map((s, i) => `<tr><td>${i + 1}</td>
    <td><input data-s="${i}" data-f="len" list="measList" inputmode="decimal" value="${f2(s.len, 3)}"></td>
    <td>${r.adj && r.adj.wallSigma ? `<span class="${r.adj.wallSigma[i] * 1000 > (S.target || 3) ? 'warn' : 'ok'}">${f2(r.adj.wallSigma[i] * 1000, 1)} <small>${pct(r.adj.wallSigma[i], s.len)}</small></span>` : '–'}</td>
    <td><input data-s="${i}" data-f="turn" inputmode="decimal" value="${f2(s.turn, 1)}"></td>
    <td><input data-s="${i}" data-f="t" inputmode="decimal" value="${f2(s.t ?? S.wallT)}"></td>
    <td><button data-a="addop" data-w="${i}">+ Öffnung</button></td></tr>`).join('')}
  </table>
  <div class="row"><button data-a="addseg">+ Wand</button><button data-a="delseg" ${n < 4 ? 'disabled' : ''}>− letzte Wand</button>
  <span class="hint">Knick = Richtungsänderung am Wandende (+90 links, −90 rechts). Länge = lichtes Maß.</span></div>
  <h4>Fenster / Türen</h4>
  <table><tr><th>Art</th><th>Wand</th><th>Abst. m</th><th>Breite</th><th>Höhe</th><th>BRH</th><th class="hide-s">Anschl.</th><th></th></tr>
  ${(r.ops || []).map((o, i) => `<tr>
    <td><select data-o="${i}" data-f="type">${[['fenster', 'Fenster'], ['tuer', 'Tür'], ['dg', 'Durchgang']].map(([v, l]) => `<option value="${v}" ${v === o.type ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
    <td><select data-o="${i}" data-f="wall">${wOpt(o.wall)}</select></td>
    <td><input data-o="${i}" data-f="pos" inputmode="decimal" value="${f2(o.pos, 3)}"></td>
    <td><input data-o="${i}" data-f="w" inputmode="decimal" value="${f2(o.w, 3)}"></td>
    <td><input data-o="${i}" data-f="h" inputmode="decimal" value="${f2(o.h, 3)}"></td>
    <td><input data-o="${i}" data-f="brh" inputmode="decimal" value="${f2(o.brh || 0)}"></td>
    <td class="hide-s"><button data-a="flip" data-oi="${i}" title="Anschlag links/rechts">⇆</button><button data-a="aus" data-oi="${i}" title="Aufschlag innen/außen">⇅</button></td>
    <td><button data-a="delop" data-oi="${i}" class="danger">×</button></td></tr>`).join('') || '<tr><td colspan="8" class="hint">Keine – bei einer Wand „+ Öffnung“ tippen. Abstand = vom Wandanfang (Ecke mit gleicher Nummer).</td></tr>'}
  </table>
  ${obsPanel(r)}
  ${checkPanel(r)}
  ${linkPanel(r)}`;
  rstat();
}
function checkPanel(r) {
  const g = geo(r), C = r.checks || [];
  return `<details ${C.length ? 'open' : ''}><summary><b>Kontrollmaße (optional)</b> <small class="hint">Maßband, nur Vergleich – verändert den Plan nicht</small></summary>
  <table>${C.map((c, k) => `<tr><td>Wand <select data-ckw="${k}">${r.segs.map((_, i) => `<option value="${i}" ${i === c.wall ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></td>
    <td><input data-ckv="${k}" inputmode="decimal" value="${f2(c.v, 3)}"></td><td>${g.E[c.wall] ? chkText(g.E[c.wall].L - c.v, r.adj && r.adj.wallSigma ? r.adj.wallSigma[c.wall] : null) : ''}</td>
    <td><button data-a="delck" data-oi="${k}" class="danger">×</button></td></tr>`).join('') || '<tr><td class="hint">Ein einziges Maßbandmaß genügt als Nachweis der Genauigkeit.</td></tr>'}</table>
  <div class="row"><button data-a="addck">+ Kontrollmaß</button></div></details>`;
}
function linkPanel(r) {
  const others = S.rooms.map((o, k) => [o, k]).filter(([o]) => o !== r);
  if (!others.length) return '';
  const L = r._link || (r._link = { wall: 0, room: others[0][1], wall2: 0, t: '', mode: 'tuer', opA: 0, opB: 0, off: 0 });
  if (!S.rooms[L.room] || S.rooms[L.room] === r) L.room = others[0][1];
  const B = S.rooms[L.room];
  const sel = (f, opts, v) => `<select data-lk="${f}">${opts.map(([val, lab]) => `<option value="${val}" ${val == v ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
  const walls = rr => rr.segs.map((_, k) => [k, `Wand ${k + 1}`]), ops = rr => (rr.ops || []).map((o, k) => [k, `${o.type === 'fenster' ? 'Fenster' : o.type === 'tuer' ? 'Tür' : 'Durchgang'} (Wand ${o.wall + 1}, ${f2(o.w)})`]);
  return `<h4>Nachbarraum exakt anschließen</h4>
  <div class="grid">
    <label>Diese Wand${sel('wall', walls(r), L.wall)}</label>
    <label>Nachbarraum${sel('room', others.map(([o, k]) => [k, o.name]), L.room)}</label>
    <label>dessen Wand${sel('wall2', walls(B), L.wall2)}</label>
    <label>Wandstärke (m/cm)<input data-lk="t" inputmode="decimal" value="${esc(L.t)}" placeholder="an Tür-Leibung messen"></label>
    <label>Lage entlang der Wand${sel('mode', [['tuer', 'über gemeinsame Öffnung'], ['off', 'über Versatz']], L.mode)}</label>
    ${L.mode === 'tuer' ? `<label>Öffnung hier${sel('opA', ops(r), L.opA)}</label><label>Öffnung dort${sel('opB', ops(B), L.opB)}</label>`
      : `<label>Versatz m <input data-lk="off" inputmode="decimal" value="${esc(L.off)}" title="Abstand Ecke (Wandanfang hier) bis Ecke (Wandende dort), entlang der Wand"></label>`}
  </div>
  <div class="row"><button data-a="link" class="pri">Nachbarraum anschließen</button><span class="hint">Der Nachbarraum wird gedreht und verschoben, sodass die Wände parallel im Abstand der Wandstärke liegen.</span></div>`;
}
function linkRooms(A, B, L) {
  const tv = num(L.t), t = tv >= 2 ? tv / 100 : tv; if (!(t > 0 && t < 2)) return 'Wandstärke eingeben (z. B. 0,12 oder 12).';
  const gA = geo(A), eA = gA.E[L.wall]; if (!eA) return 'Wand wählen.';
  let off;
  if (L.mode === 'tuer') {
    const oa = (A.ops || [])[L.opA], ob = (B.ops || [])[L.opB];
    if (!oa || !ob || oa.wall !== +L.wall || ob.wall !== +L.wall2) return 'Gemeinsame Öffnung muss in den gewählten Wänden liegen (Wandnummer der Öffnungen prüfen).';
    off = oa.pos + oa.w / 2 - geo(B).E[L.wall2].L + ob.pos + ob.w / 2;
  } else off = num(L.off);
  // Drehen: Wand dort antiparallel zu Wand hier
  const dB = geo(B).E[L.wall2].d, want = Math.atan2(-eA.d[1], -eA.d[0]), has = Math.atan2(dB[1], dB[0]);
  B.rot = normA((B.rot || 0) + (want - has) * R2D);
  const eB = geo(B).E[L.wall2], target = add(add(eA.p, mul(eA.d, off)), mul(eA.n, t));
  B.x += target[0] - eB.q[0]; B.y += target[1] - eB.q[1];
  A.segs[L.wall].t = t; B.segs[L.wall2].t = t;
  if (L.mode === 'tuer') { B.ops.forEach(o => { if (o.pair === A.name) delete o.pair; }); B.ops[L.opB].pair = A.name || true; }
  return null;
}
const OBS_T = { wand: 'Wand', diag: 'Diagonale', sehne: 'Eckwinkel (Sehne)', winkel: 'Winkel °', foto: 'Foto-Strecke', fotowinkel: 'Foto-Winkel °' };
function obsPanel(r) {
  const n = r.segs.length, O = r.obs || [], cs = (o, f, v) => `<select data-ob="${O.indexOf(o)}" data-f="${f}">${r.segs.map((_, k) => `<option value="${k}" ${k === v ? 'selected' : ''}>${k + 1}</option>`).join('')}</select>`;
  const inp = (k, f, v, d = 3, w = '') => `<input data-ob="${k}" data-f="${f}" inputmode="decimal" value="${v === '' || v == null ? '' : f2(v, d)}" ${w}>`;
  const rows = O.map((o, k) => {
    const V = r.adj && r.adj.v && r.adj.v[k], bad = V && Math.abs(V.w) > 3.29, ver = V ? (V.ang ? f2(V.v * R2D, 3) + '°' : f2(V.v * 1000, 1)) : '';
    let ecken, wert, sig;
    switch (o.typ) {
      case 'wand': ecken = `${o.i + 1}–${(o.i + 1) % n + 1}`; wert = inp(k, 'v', o.v, 3, 'placeholder="m/cm"'); sig = inp(k, 's', o.s * 1000, 1); break;
      case 'diag': ecken = cs(o, 'i', o.i) + cs(o, 'j', o.j); wert = inp(k, 'v', o.v, 3, 'placeholder="m/cm"'); sig = inp(k, 's', o.s * 1000, 1); break;
      case 'sehne': ecken = cs(o, 'i', o.i); wert = `<span class="tri">${inp(k, 'a', o.a, 3, 'placeholder="Schenkel a" title="Schenkel a (m/cm)"')}${inp(k, 'b', o.b, 3, 'placeholder="Schenkel b" title="Schenkel b (m/cm)"')}${inp(k, 'c', o.c, 3, 'placeholder="Sehne c" title="Sehne c (m/cm)"')}</span>`; sig = inp(k, 's', o.s * 1000, 1); break;
      case 'winkel': ecken = cs(o, 'i', o.i); wert = inp(k, 'v', o.v, 2); sig = inp(k, 's', o.s, 2); break;
      default: ecken = o.typ === 'foto' ? `${o.i + 1}–${o.j + 1}` : `${o.i + 1}`; wert = o.typ === 'foto' ? f2(o.v, 3) : f2(o.v, 2) + '°'; sig = '±' + (o.typ === 'foto' ? f2(o.s * 1000, 1) : f2(o.s, 2) + '°');
    }
    return `<tr class="${bad ? 'bad' : ''}${o.off ? ' off' : ''}"><td>${OBS_T[o.typ]}${o.src ? `<br><small>${esc(o.src)}</small>` : ''}</td><td>${ecken}</td><td>${wert}</td><td>${sig}</td><td>${ver}${bad ? ' ⚠' : ''}</td><td><button data-a="delob" data-oi="${k}" class="danger">×</button></td></tr>`;
  }).join('');
  const A = r.adj;
  let rep = '';
  if (A) {
    const mx = A.wallSigma ? Math.max(...A.wallSigma) * 1000 : null, tgt = S.target || 3;
    rep = `<div class="adj ${mx !== null && mx <= tgt && !A.warn.length ? 'good' : 'badbox'}">` +
      (mx !== null ? `<b>${mx <= tgt ? '✔' : '⚠'} Wandlängen ±${f2(mx, 1)} mm (±${pct(Math.max(...A.wallSigma.map((v, i) => v / (r.segs[i] ? r.segs[i].len : 1))), 1)})</b> (1σ, schlechteste Wand) · ` + (A.pg ? `Photogrammetrie: ${A.pg.nImg} Bilder, Bildfehler ${f2(A.pg.rms, 2)} px<br>` : `Ecklage ±${f2(A.cornerMax * 1000, 1)} mm · Überbestimmung ${A.red}${A.s0 != null ? ` · σ₀ ${f2(A.s0, 2)}` : ''}<br>`) : '') +
      A.warn.map(w => `<span class="warn">${esc(w)}</span>`).join('<br>') + '</div>';
  }
  return `<h4>Maßband-Messungen &amp; Ausgleich <small class="hint">(Ecken-Nummern siehe Plan)</small></h4>
  <details class="tip"><summary>So misst man auf ±3 mm</summary><ul>
   <li><b>Wände:</b> Maßband straff, waagrecht, an der Wand entlang (ca. 1 m Höhe, über Möbeln). Ablesen auf 1 mm. Wert in m (4,215) oder cm (421,5).</li>
   <li><b>Form:</b> je Raum 2 Diagonalen – oder wenn Möbel stören, <b>Eckwinkel über Sehne</b>: von der Ecke auf beiden Wänden je 1,50 m anzeichnen (Schenkel a, b), Abstand der Marken messen (Sehne c). Mindestens 2 Ecken, besser alle.</li>
   <li>Jedes Zusatzmaß erhöht die Kontrolle: Tippfehler werden erkannt und markiert (⚠).</li></ul></details>
  <table class="obs"><tr><th>Art</th><th>Ecken</th><th>Wert</th><th>σ mm</th><th>Verb.</th><th></th></tr>${rows || '<tr><td colspan="6" class="hint">Noch keine Messungen.</td></tr>'}</table>
  <div class="row"><button data-a="obsWalls">+ alle Wände</button><button data-a="obsDiag">+ Diagonale</button><button data-a="obsChord">+ Eckwinkel (Sehne)</button><button data-a="obsAng">+ Winkel</button><button data-a="adjust" class="pri">Ausgleichen</button></div>
  ${rep}`;
}
function obsValid(o, n) {
  if (!(o.i >= 0 && o.i < n) || (o.j != null && !(o.j >= 0 && o.j < n && o.j !== o.i))) return false;
  if (o.typ === 'sehne') return o.a > 0 && o.b > 0 && o.c > 0 && o.c < o.a + o.b && o.s > 0;
  return o.v > 0 && o.s > 0;
}
function doAdjust(r) {
  const n = r.segs.length; let obs = (r.obs || []).filter(o => obsValid(o, n));
  if (!obs.length) { r.adj = { warn: ['Keine gültigen Messungen – Werte eintragen.'] }; return; }
  // Robust: grob falsche Foto-Maße automatisch ausschließen (Maßband-Maße nie – die werden nur markiert)
  let res, drop = [];
  for (let k = 0; k < 6; k++) {
    res = AG.adjust(geo(r).P, obs);
    if (!res.ok) break;
    const bad = res.res.filter(z => /^foto/.test(z.o.typ) && Math.abs(z.w) > 3.29).sort((a, b) => Math.abs(b.w) - Math.abs(a.w))[0];
    if (!bad) break;
    drop.push(bad.o); obs = obs.filter(o => o !== bad.o);
  }
  if (!res.ok) { r.adj = { warn: res.warn }; return; }
  if (drop.length) res.warn.unshift(`${drop.length} Foto-Maß(e) passten nicht zu den übrigen Maßen und wurden ausgeschlossen (grau).`);
  (r.obs || []).forEach(o => o.off = drop.includes(o));
  const keep = { x: r.x, y: r.y };
  Object.assign(r, fromPoly(res.P, r)); Object.assign(r, keep); r.x = res.P[0][0]; r.y = res.P[0][1];
  r.adj = {
    wallSigma: res.wallSigma, cornerMax: Math.max(...res.cornerSigma), s0: res.s0, red: res.realRed, warn: res.warn,
    v: (r.obs || []).map(o => { const q = res.res.find(z => z.o === o); return q ? { v: q.v, w: q.w, ang: q.ang } : null; })
  };
}
function rstat() {
  const r = S.rooms[selRoom], el = $('#rstat'); if (!r || !el) return; const g = geo(r);
  el.innerHTML = `Fläche <b>${f2(g.area)} m²</b> · Umfang ${f2(g.per)} m · Volumen ${f2(g.area * r.h)} m³` +
    (g.err > 0.005 ? ` · <span class="warn">Schließfehler ${f2(g.err * 100, 1)} cm – Maße/Winkel prüfen oder „Letzte Wand schließen“</span>` : '');
}
const NUMK = ['h', 'x', 'y', 'rot'];
$('#rpanel').addEventListener('input', e => {
  const r = S.rooms[selRoom], t = e.target, d = t.dataset; if (!r) return;
  if (d.k) r[d.k] = d.k === 'dims' ? t.value === '1' : NUMK.includes(d.k) ? num(t.value) : t.value;
  if (d.s != null) r.segs[d.s][d.f] = num(t.value);
  if (d.o != null) r.ops[d.o][d.f] = d.f === 'type' ? t.value : d.f === 'wall' ? +t.value : num(t.value);
  if (d.ckw != null || d.ckv != null) { const c = r.checks[d.ckw ?? d.ckv]; if (d.ckw != null) c.wall = +t.value; else c.v = parseLen(t.value); save(); return; }
  if (d.lk != null) { r._link[d.lk] = ['room', 'wall', 'wall2', 'opA', 'opB'].includes(d.lk) ? +t.value : t.value; if (['room', 'mode'].includes(d.lk)) roomPanel(); return; }
  if (d.ob != null) { const o = r.obs[d.ob]; o[d.f] = d.f === 'i' || d.f === 'j' ? +t.value : d.f === 's' ? (o.typ === 'winkel' ? num(t.value) : num(t.value) / 1000) : o.typ === 'winkel' ? num(t.value) : parseLen(t.value); }
  if (d.s != null || d.ob != null) r.adj = null;
  save(); renderPlan(); rstat();
});
$('#rpanel').addEventListener('change', e => { const d = e.target.dataset; if (d.ckw != null || d.ckv != null) roomPanel(); });
$('#rpanel').addEventListener('click', e => {
  const a = e.target.dataset.a, r = S.rooms[selRoom]; if (!a || !r) return;
  const oi = e.target.dataset.oi;
  switch (a) {
    case 'rot90': r.rot = normA((r.rot || 0) - 90); break;
    case 'mirror': r.mirror = !r.mirror; break;
    case 'ortho': r.segs.forEach(s => { const q = Math.round(s.turn / 90) * 90; if (Math.abs(s.turn - q) < 15) s.turn = q; }); { const q = Math.round(r.rot / 90) * 90; if (Math.abs(r.rot - q) < 15) r.rot = q; } r.adj = null; break;
    case 'close': { const g = geo(r); Object.assign(r, fromPoly(g.P, r)); r.adj = null; break; }
    case 'dup': { const c = structuredClone(r); c.name += ' (Kopie)'; placeFree(c); S.rooms.push(c); selRoom = S.rooms.length - 1; break; }
    case 'del': if (!confirm(`Raum „${r.name}“ löschen?`)) return; S.rooms.splice(selRoom, 1); selRoom = null; break;
    case 'addseg': r.segs.push({ len: 1, turn: 90 }); r.adj = null; break;
    case 'delseg': r.segs.pop(); r.ops = r.ops.filter(o => o.wall < r.segs.length); r.obs = (r.obs || []).filter(o => o.i < r.segs.length && (o.j == null || o.j < r.segs.length)); r.adj = null; break;
    case 'addop': { const w = +e.target.dataset.w, L = r.segs[w].len; r.ops.push({ type: 'fenster', wall: w, pos: +Math.max(0, (L - 1.2) / 2).toFixed(2), w: 1.2, h: 1.4, brh: 0.9 }); break; }
    case 'delop': r.ops.splice(oi, 1); break;
    case 'delob': r.obs.splice(oi, 1); r.adj = null; break;
    case 'addck': (r.checks = r.checks || []).push({ wall: 0, v: +geo(r).E[0].L.toFixed(3) }); break;
    case 'delck': r.checks.splice(oi, 1); break;
    case 'obsWalls': r.obs = r.obs || []; r.segs.forEach((_, i) => { if (!r.obs.some(o => o.typ === 'wand' && o.i === i)) r.obs.push({ typ: 'wand', i, v: '', s: 0.0015 }); }); break;
    case 'obsDiag': (r.obs = r.obs || []).push({ typ: 'diag', i: 0, j: Math.min(2, r.segs.length - 1), v: '', s: 0.002 }); break;
    case 'obsChord': (r.obs = r.obs || []).push({ typ: 'sehne', i: 0, a: 1.5, b: 1.5, c: '', s: 0.0015 }); break;
    case 'obsAng': (r.obs = r.obs || []).push({ typ: 'winkel', i: 0, v: 90, s: 0.5 }); break;
    case 'adjust': doAdjust(r); break;
    case 'link': { const B = S.rooms[r._link.room]; if (!B || B === r) return alert('Nachbarraum wählen.'); const m = linkRooms(r, B, r._link); if (m) return alert(m); break; }
    case 'flip': r.ops[oi].flip = !r.ops[oi].flip; break;
    case 'aus': r.ops[oi].aus = !r.ops[oi].aus; break;
  }
  save(); renderPlan(a === 'dup' || a === 'del'); roomPanel();
});

/* ---------- 4 Einreichung / Export ---------- */
const PAPER = { A4: [297, 210], A3: [420, 297], A2: [594, 420] };
function fillProj() {
  const f = $('#pform');
  for (const el of f.elements) el.value = el.name in S.project ? S.project[el.name] : ['scale', 'paper', 'dimFmt'].includes(el.name) ? S[el.name] : f2(S[el.name], el.name === 'target' ? 1 : 2);
  preview();
}
$('#pform').addEventListener('input', e => {
  const n = e.target.name, v = e.target.value;
  if (n in S.project) S.project[n] = n === 'nord' ? num(v) : v;
  else S[n] = n === 'paper' || n === 'dimFmt' ? v : num(v);
  save(); preview();
});
function preview() { $('#preview').innerHTML = pageSVG(); axCheck(); }
function axCheck() { // Außenmaß-Kontrolle: Plan-Außenkanten (achsparallel) gegen gemessenes Außenmaß
  const b = allBB(), m = [['X', b.x1 - b.x0, parseLen(S.project.ax)], ['Y', b.y1 - b.y0, parseLen(S.project.ay)]].filter(e => e[2] > 0);
  $('#axMsg').innerHTML = m.map(([k, pl, me]) => { const d = (pl - me) * 1000; return `Außenmaß ${k}: Plan ${f2(pl, 3)} m, gemessen ${f2(me, 3)} m → <span class="${Math.abs(d) > (S.target || 3) * 2 ? 'warn' : 'ok'}">${d > 0 ? '+' : ''}${f2(d, 1)} mm</span>`; }).join('<br>') +
    (m.length ? '<br><span class="hint">Nur bei achsparallelem Gebäude aussagekräftig. Abweichung = Summe aus Raum-, Wandstärken- und Außenwandfehlern (Außenwände an Fenstern messen).</span>' : '');
}
function pageSVG() {
  const [PW, PH] = PAPER[S.paper] || PAPER.A3, k = 10 / S.scale, P = S.project;
  const b = allBB(), m = 1.2, bw = (b.x1 - b.x0 + 2 * m) * 100 * k, bh = (b.y1 - b.y0 + 2 * m) * 100 * k;
  const ax0 = 25, ay0 = 15, ax1 = PW - 15, ay1 = PH - 80;
  const G = cutGeom(), cg = G && !G.empty ? G : null, sw = cg ? (cg.u1 - cg.u0) * 100 * k : 0, sh = cg ? (cg.z1 - cg.z0) * 100 * k : 0;
  const AW = ax1 - ax0, AH = ay1 - ay0, side = cg && bw + sw <= AW && Math.max(bh, sh) <= AH, stack = cg && !side && bh + sh <= AH && Math.max(bw, sw) <= AW;
  const fits = cg ? side || stack : bw <= AW && bh <= AH;
  $('#fitMsg').innerHTML = fits ? '' : `<span class="warn">${cg ? 'Grundriss + Schnitt passen' : 'Plan passt'} bei 1:${S.scale} nicht auf ${S.paper} – größeres Blatt oder Maßstab wählen.</span>`;
  const pcx = side ? ax0 + bw / 2 + (AW - bw - sw) / 3 : (ax0 + ax1) / 2, pcy = stack ? ay0 + bh / 2 + (AH - bh - sh) / 3 : (ay0 + ay1) / 2;
  const tx = pcx - ((b.x0 + b.x1) / 2) * 100 * k, ty = pcy + ((b.y0 + b.y1) / 2) * 100 * k;
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}mm" height="${PH}mm" viewBox="0 0 ${PW} ${PH}" font-family="Arial,Helvetica,sans-serif">`;
  o += `<rect width="${PW}" height="${PH}" fill="#fff"/><rect x="20" y="10" width="${PW - 30}" height="${PH - 20}" fill="none" stroke="#000" stroke-width=".5"/>`;
  o += `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k})">${planSVG(null)}${cutLineSVG()}</g>`;
  if (cg) { // Schnitt neben bzw. unter dem Grundriss
    const scx = side ? ax1 - sw / 2 - (AW - bw - sw) / 3 : (ax0 + ax1) / 2, scy = stack ? ay1 - sh / 2 - (AH - bh - sh) / 3 : (ay0 + ay1) / 2;
    o += `<g transform="translate(${(scx - (cg.u0 + cg.u1) / 2 * 100 * k).toFixed(2)} ${(scy + (cg.z0 + cg.z1) / 2 * 100 * k).toFixed(2)}) scale(${k})">${cutSVG(cg)}</g>`;
  }
  // Nordpfeil
  o += `<g transform="translate(${PW - 30} 30) rotate(${num(P.nord)})"><circle r="9" fill="none" stroke="#000" stroke-width=".3"/><path d="M0,-9 L4,6 L0,3 L-4,6Z" fill="#000"/><text y="-11" font-size="4" text-anchor="middle">N</text></g>`;
  // Maßstabsleiste 0–5 m
  const sb = 5 * 1000 / S.scale, sx = 25, sy = PH - 72;
  for (let i = 0; i < 5; i++) o += `<rect x="${sx + i * sb / 5}" y="${sy}" width="${sb / 5}" height="2" fill="${i % 2 ? '#fff' : '#000'}" stroke="#000" stroke-width=".2"/>`;
  o += `<text x="${sx}" y="${sy + 6}" font-size="2.5">0</text><text x="${sx + sb}" y="${sy + 6}" font-size="2.5" text-anchor="middle">5 m</text><text x="${sx + sb + 6}" y="${sy + 2}" font-size="3">M 1:${S.scale}</text>`;
  // Legende
  const lg = [['bestand', 'Bestand'], ['neu', 'Neu'], ['abbruch', 'Abbruch']];
  lg.forEach(([k2, l], i) => o += `<rect x="${sx + i * 28}" y="${sy + 10}" width="6" height="3" fill="${STC[k2]}" stroke="#000" stroke-width=".2"/><text x="${sx + i * 28 + 8}" y="${sy + 12.6}" font-size="3">${l}</text>`);
  // Raumliste
  let ty2 = sy + 22; const rooms = S.rooms.filter(r => r.segs.length > 2);
  o += `<text x="${sx}" y="${ty2}" font-size="3" font-weight="bold">Raum</text><text x="${sx + 60}" y="${ty2}" font-size="3" font-weight="bold" text-anchor="end">m²</text><text x="${sx + 80}" y="${ty2}" font-size="3" font-weight="bold" text-anchor="end">RH</text>`;
  let sum = 0;
  rooms.slice(0, 9).forEach(r => { const a = geo(r).area; ty2 += 3.8; o += `<text x="${sx}" y="${ty2}" font-size="3">${esc(r.name)}</text><text x="${sx + 60}" y="${ty2}" font-size="3" text-anchor="end">${f2(a)}</text><text x="${sx + 80}" y="${ty2}" font-size="3" text-anchor="end">${f2(r.h)}</text>`; });
  rooms.forEach(r => sum += geo(r).area);
  if (rooms.length > 9) { ty2 += 3.8; o += `<text x="${sx}" y="${ty2}" font-size="3">… ${rooms.length - 9} weitere</text>`; }
  o += `<line x1="${sx}" y1="${ty2 + 1.5}" x2="${sx + 80}" y2="${ty2 + 1.5}" stroke="#000" stroke-width=".2"/><text x="${sx}" y="${ty2 + 5.5}" font-size="3" font-weight="bold">Summe Nutzfläche</text><text x="${sx + 60}" y="${ty2 + 5.5}" font-size="3" font-weight="bold" text-anchor="end">${f2(sum)}</text>`;
  // Plankopf
  const w = 180, h = 60, x = PW - 10 - w, y = PH - 10 - h;
  const cell = (cx, cy, cw, ch, lab, val, fs = 3.2) => `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="none" stroke="#000" stroke-width=".3"/><text x="${cx + 1.5}" y="${cy + 3}" font-size="2">${lab}</text><text x="${cx + 1.5}" y="${cy + ch - 2}" font-size="${fs}">${esc(val)}</text>`;
  o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#000" stroke-width=".5"/>`;
  o += `<text x="${x + 3}" y="${y + 8}" font-size="6" font-weight="bold">EINREICHPLAN</text>`;
  o += cell(x, y + 11, 110, 10, 'Bauvorhaben', P.bv) + cell(x + 110, y + 11, 70, 10, 'Planinhalt', P.inhalt, 2.8);
  o += cell(x, y + 21, 110, 10, 'Bauwerber', P.bh) + cell(x + 110, y + 21, 35, 10, 'Maßstab', '1:' + S.scale) + cell(x + 145, y + 21, 35, 10, 'Plan-Nr.', P.nr);
  o += cell(x, y + 31, 110, 10, 'Adresse', P.adr) + cell(x + 110, y + 31, 35, 10, 'Gst.-Nr.', P.gst) + cell(x + 145, y + 31, 35, 10, 'KG', P.kg);
  o += cell(x, y + 41, 60, 19, 'Bauwerber (Unterschrift)', '') + cell(x + 60, y + 41, 60, 19, 'Planverfasser: ' + P.pv, '') + cell(x + 120, y + 41, 60, 19, 'Grundeigentümer / Datum', P.datum);
  const adj = S.rooms.filter(r => r.adj && r.adj.wallSigma), mxs = adj.length ? Math.max(...adj.flatMap(r => r.adj.wallSigma)) * 1000 : null;
  o += `<text x="${x + 100}" y="${y + 5}" font-size="2.2">Lichte Maße in m${S.dimFmt === 'cm' ? '' : ', hochgestellt = mm'} · vor Ausführung prüfen</text>`;
  o += `<text x="${x + 100}" y="${y + 8.5}" font-size="2.2">${mxs !== null ? `Aufmaß ausgeglichen: ${adj.length}/${rooms.length} Räume, Wandlängen ±${f2(mxs, 1)} mm (1σ, ≈ ±${pct(Math.max(...adj.flatMap(r => r.adj.wallSigma.map((v, i) => v / (r.segs[i] ? r.segs[i].len : 1)))), 1)})` : 'Aufmaß nicht ausgeglichen'}</text>`;
  return o + '</svg>';
}
function download(name, data, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const fname = ext => (S.project.bv || 'raumplan').replace(/[^\wäöüÄÖÜß-]+/g, '_') + '_' + (S.project.nr || '01') + '.' + ext;
$('#xSvg').onclick = () => download(fname('svg'), pageSVG(), 'image/svg+xml');
$('#xPrint').onclick = () => {
  const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(fname('pdf'))}</title><style>@page{size:${S.paper} landscape;margin:0}html,body{margin:0}svg{display:block}</style></head><body>${pageSVG()}<script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
};
$('#xDxf').onclick = () => {
  const L = [], ent = (...a) => L.push(...a);
  const ln = (a, b, lay) => ent('0', 'LINE', '8', lay, '10', a[0].toFixed(4), '20', a[1].toFixed(4), '30', '0', '11', b[0].toFixed(4), '21', b[1].toFixed(4), '31', '0');
  const tx = (p, s, h, lay, rot = 0) => ent('0', 'TEXT', '8', lay, '10', p[0].toFixed(4), '20', p[1].toFixed(4), '30', '0', '40', h.toFixed(3), '1', s, '50', rot.toFixed(2), '72', '1', '11', p[0].toFixed(4), '21', p[1].toFixed(4), '31', '0');
  S.rooms.forEach(r => {
    if (r.segs.length < 2) return; const g = geo(r), n = g.P.length;
    for (let i = 0; i < n; i++) { ln(g.P[i], g.P[(i + 1) % n], 'WAND_INNEN'); ln(g.O[i], g.O[(i + 1) % n], 'WAND_AUSSEN'); }
    (r.ops || []).forEach(op => {
      const e = g.E[op.wall]; if (!e) return; const s0 = add(e.p, mul(e.d, op.pos)), s1 = add(s0, mul(e.d, op.w)), nt = mul(e.n, e.t);
      ln(s0, add(s0, nt), 'OEFFNUNG'); ln(s1, add(s1, nt), 'OEFFNUNG'); ln(add(s0, mul(nt, .5)), add(s1, mul(nt, .5)), 'OEFFNUNG');
    });
    tx(g.c, r.name, 0.25, 'TEXT'); tx(add(g.c, [0, -0.35]), f2(g.area) + ' m2', 0.2, 'TEXT');
    g.E.forEach(e => tx(add(mid(e.p, e.q), mul(e.n, e.t + 0.4)), dimStr(e.L), 0.18, 'MASS', -rdAngle(e.d)));
  });
  const G = cutGeom();
  if (S.cut) { const L2 = dist(S.cut.a, S.cut.b), d = [(S.cut.b[0] - S.cut.a[0]) / L2, (S.cut.b[1] - S.cut.a[1]) / L2], v = [-d[1], d[0]]; ln(add(S.cut.a, mul(d, -0.4)), add(S.cut.b, mul(d, 0.4)), 'SCHNITTLINIE'); [S.cut.a, S.cut.b].forEach(p => { ln(p, add(p, mul(v, 0.5)), 'SCHNITTLINIE'); tx(add(p, mul(v, -0.3)), S.cut.name || 'A', 0.35, 'SCHNITTLINIE'); }); }
  if (G && !G.empty) { // Schnitt unter dem Grundriss (gleicher Maßstab, z nach oben)
    const B = allBB(), ox = B.x0 - G.u0, oy = B.y0 - 1.5 - G.z1, P2 = (u, z) => [u + ox, z + oy];
    const rc = (q, lay) => { const c = [P2(q.u0, q.z0), P2(q.u1, q.z0), P2(q.u1, q.z1), P2(q.u0, q.z1)]; c.forEach((p, i) => ln(p, c[(i + 1) % 4], lay)); };
    G.R.forEach(q => rc(q, q.k === 'wand' ? 'SCHNITT_WAND' : q.k === 'glas' || q.k === 'tuer' ? 'SCHNITT_OEFFNUNG' : 'SCHNITT_DECKE'));
    G.V.forEach(q => rc(q, 'ANSICHT'));
    G.D.forEach(m => { ln(P2(...m.a), P2(...m.b), 'SCHNITT_MASS'); tx(add(P2(...mid(m.a, m.b)), m.vert ? [-0.2, 0] : [0, 0.15]), dimStr(m.L), 0.18, 'SCHNITT_MASS', m.vert ? 90 : 0); });
    G.T.forEach(t => tx(P2(...t.p), t.s, t.size > 3 ? 0.3 : 0.18, 'TEXT'));
  }
  const dxf = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '6', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES', ...L, '0', 'ENDSEC', '0', 'EOF'].join('\r\n');
  download(fname('dxf'), dxf, 'application/dxf');
};
$('#xCsv').onclick = () => {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, n3 = v => v === '' || v == null || !isFinite(v) ? '' : (+v).toFixed(4).replace('.', ','), L = [];
  L.push(['Aufmaßprotokoll', S.project.bv, S.project.adr, S.project.datum].map(q).join(';'));
  L.push(['Raum', 'Art', 'Ecken', 'Messwert', 'σ', 'Verbesserung', 'normiert', 'Quelle', 'Status'].map(q).join(';'));
  S.rooms.forEach(r => {
    const n = r.segs.length;
    (r.obs || []).forEach((o, k) => {
      const V = r.adj && r.adj.v && r.adj.v[k], ang = /winkel|sehne/.test(o.typ);
      const val = o.typ === 'sehne' ? `a=${n3(o.a)} b=${n3(o.b)} c=${n3(o.c)} m` : ang ? n3(o.v) + ' °' : n3(o.v) + ' m';
      const sig = o.typ === 'winkel' || o.typ === 'fotowinkel' ? n3(o.s) + ' °' : n3(o.s * 1000) + ' mm';
      const ec = o.j != null ? `${o.i + 1}-${o.j + 1}` : o.typ === 'wand' ? `${o.i + 1}-${(o.i + 1) % n + 1}` : `${o.i + 1}`;
      L.push([r.name, OBS_T[o.typ], ec, val, sig, V ? (V.ang ? n3(V.v * R2D) + ' °' : n3(V.v * 1000) + ' mm') : '', V ? n3(V.w) : '', o.src || 'Maßband', o.off ? 'ausgeschlossen' : V && Math.abs(V.w) > 3.29 ? 'GROBER FEHLER?' : ''].map(q).join(';'));
    });
    const g = geo(r);
    g.E.forEach((e, i) => L.push([r.name, 'Ergebnis Wand', `${i + 1}-${(i + 1) % n + 1}`, n3(e.L) + ' m', r.adj && r.adj.wallSigma ? n3(r.adj.wallSigma[i] * 1000) + ' mm' : 'nicht ausgeglichen', '', '', 'Plan', ''].map(q).join(';')));
    (r.checks || []).forEach(c => { const e = g.E[c.wall]; if (e) L.push([r.name, 'Kontrollmaß (Maßband)', `${c.wall + 1}-${(c.wall + 1) % n + 1}`, n3(c.v) + ' m', '', n3((e.L - c.v) * 1000) + ' mm', '', 'Maßband', 'Vergleich Plan − Maßband'].map(q).join(';')); });
    L.push([r.name, 'Ergebnis Fläche', '', n3(g.area) + ' m²', '', '', '', 'Plan', r.adj && r.adj.s0 != null ? 'σ0=' + n3(r.adj.s0) : ''].map(q).join(';'));
  });
  download(fname('csv'), '\ufeff' + L.join('\r\n'), 'text/csv');
};
$('#xJson').onclick = () => download(fname('json'), ser(), 'application/json');
$('#xLoad').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { const d = JSON.parse(t); if (!Array.isArray(d.rooms)) throw 0; S = { ...structuredClone(DEF), ...d, project: { ...DEF.project, ...d.project } }; selRoom = null; save(); fillProj(); listMeas(); })
    .catch(() => alert('Datei ist kein gültiges Raumplan-Projekt.'));
  e.target.value = '';
};
$('#xNew').onclick = () => { if (confirm('Neues Projekt beginnen? Alle Räume, Messungen und Angaben werden gelöscht (vorher „Projekt speichern“!).')) { S = structuredClone(DEF); selRoom = null; save(); fillProj(); listMeas(); } };

addEventListener('resize', () => { if (!$('#plan').hidden) renderPlan(); });
listMeas();

// Offline nutzbar (PWA): nur über https bzw. localhost
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { });
