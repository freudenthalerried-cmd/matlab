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
const ser = () => JSON.stringify(S, (k, v) => k === '_link' ? undefined : v);
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
let pgFiles = null, pgLast = null;
$('#pgPrint').onclick = () => {
  const n = Math.max(0, Math.min(96, Math.round(num($('#pgN').value)))), size = Math.max(60, Math.min(190, num($('#pgSize').value) || 160));
  const lab = ['Boden – Mitte auf Maßband 0 cm', 'Boden – Mitte auf Maßband 300 cm', 'Boden', 'Boden'];
  const pages = [0, 1, 2, 3].map(id => MK.markerSVG(id, size, lab[id])).concat(Array.from({ length: n }, (_, k) => MK.markerSVG(4 + k, size, 'Wand')));
  const w = open('', '_blank'); if (!w) return alert('Pop-up wurde blockiert – bitte erlauben.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Raumplan-Marken</title><style>@page{size:A4 portrait;margin:0}body{margin:0}svg{display:block;page-break-after:always}</style></head><body>${pages.join('')}<script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`);
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
    const n = Math.floor(v.duration / step);
    pgLog(`Video ${W}×${H}, ${v.duration.toFixed(1)} s → ${n} Bilder`);
    for (let k = 0; k < n; k++) {
      v.currentTime = (k + 0.5) * step;
      await new Promise(r => { v.onseeked = r; });
      ctx.drawImage(v, 0, 0, W, H);
      const dets = MK.detect(toGray(ctx, W, H, buf), W, H).filter(d => d.res < 0.8);
      frames.push({ t: v.currentTime, vt: v.currentTime, dets }); prog((k + 1) / n, `Bild ${k + 1}/${n}: ${dets.length} Marken`); await tick();
    }
    URL.revokeObjectURL(v.src);
  } else {
    const imgs = files.filter(f => f.type.startsWith('image'));
    for (let k = 0; k < imgs.length; k++) {
      const b = await createImageBitmap(imgs[k]);
      if (!W) { W = cv.width = b.width; H = cv.height = b.height; buf = new Float32Array(W * H); }
      if (b.width !== W || b.height !== H) { pgLog(`${imgs[k].name}: andere Bildgröße – übersprungen`); continue; }
      ctx.drawImage(b, 0, 0); const dets = MK.detect(toGray(ctx, W, H, buf), W, H).filter(d => d.res < 0.8);
      frames.push({ t: k, fi: k, dets }); prog((k + 1) / imgs.length, `Foto ${k + 1}/${imgs.length}: ${dets.length} Marken`); await tick();
    }
  }
  return { frames, W, H, video, imgs: files.filter(f => f.type.startsWith('image')) };
}
/* Video: nur Bilder verwenden, in denen die Kamera (fast) stillsteht – Rolling Shutter verzerrt sonst um mm–cm */
function selectStill(frames, W) {
  const k = 1920 / W, ctr = d => [(d.c[0][0] + d.c[2][0]) / 2, (d.c[0][1] + d.c[2][1]) / 2];
  const speed = (a, b) => { if (!a || !b) return null; const v = []; a.dets.forEach(d => { const e = b.dets.find(x => x.id === d.id); if (e) { const p = ctr(d), q = ctr(e); v.push(Math.hypot(p[0] - q[0], p[1] - q[1]) / Math.abs(b.t - a.t)); } }); return v.length ? v.reduce((s, x) => s + x, 0) / v.length * k : null; };
  frames.forEach((f, i) => { const s = [speed(frames[i - 1], f), speed(f, frames[i + 1])].filter(x => x !== null); f.speed = s.length ? Math.max(...s) : Infinity; });
  let sel = [];
  for (const thr of [40, 80, 150]) { sel = frames.filter(f => f.speed < thr && f.dets.length); if (sel.length >= 20) break; if (thr > 40) pgLog(`Wenig ruhige Bilder – Schwelle auf ${thr * 2} px/s erhöht (Genauigkeit sinkt).`); }
  if (sel.length < 12) { pgLog('Video zu unruhig: bitte öfter stillhalten oder eine Fotoserie machen. Es werden alle Bilder verwendet.'); sel = frames.filter(f => f.dets.length); }
  return sel;
}
function pgRoomDefs(txt, ids) { // "Name: 4-19" -> [{name, ids:Set}]
  const defs = String(txt || '').split('\n').map(l => l.match(/^\s*(.+?)\s*:\s*(\d+)\s*[-–]\s*(\d+)\s*$/)).filter(Boolean)
    .map(m => ({ name: m[1], ids: new Set(ids.filter(i => i >= +m[2] && i <= +m[3])) }));
  return defs.length ? defs : [{ name: 'Raum ' + (S.rooms.length + 1), ids: null }];
}
$('#pgRun').onclick = async () => {
  if (!pgFiles || !pgFiles.length) return alert('Zuerst ein Video (oder eine Fotoserie) aufnehmen oder wählen.');
  const btn = $('#pgRun'), pr = $('#pgProg'); btn.disabled = true; pr.hidden = false; $('#pgLog').textContent = ''; $('#pgRes').innerHTML = '';
  const t0 = performance.now();
  try {
    const isVid = pgFiles.some(f => f.type.startsWith('video'));
    let { frames, W, H, video, imgs } = await pgFrames(pgFiles, +$('#pgStep').value, (f, t) => { pr.value = f * 0.8; $('#pgSrc').textContent = t; });
    if (isVid) { const all = frames.length; frames = selectStill(frames, W); pgLog(`Ruhige Bilder ausgewählt: ${frames.length} von ${all} (Rolling-Shutter-Schutz)`); }
    const nd = frames.reduce((s, f) => s + f.dets.length, 0);
    pgLog(`Erkennung fertig: ${nd} Markensichtungen in ${frames.length} Bildern (${((performance.now() - t0) / 1000).toFixed(0)} s)`);
    await tick();
    const rec = PG.reconstruct(frames, { W, H, size: num($('#pgSize').value) / 1000 || 0.16, scaleDist: parseLen($('#pgDist').value) || 3, scaleDist2: parseLen($('#pgDist2').value) || 0, sigPx: 0.3, log: pgLog });
    pr.value = 0.95; await tick();
    if (!rec.ok) throw new Error(rec.msg);
    pgLog(`Ausgleich: ${rec.nImg} Bilder, ${rec.ids.length} Marken, Bildfehler rms ${rec.res.rms.toFixed(2)} px, f = ${rec.res.it[0].toFixed(0)} px, k1 = ${rec.res.it[3].toFixed(3)}${rec.dropped ? `, ${rec.dropped} Fehlsichtungen entfernt` : ''}`);
    const res = pgRoomDefs($('#pgRooms').value, rec.ids).map(d => ({ ...d, w: PG.walls(rec, { ids: d.ids }) }));
    pgLast = { rec, res, frames, W, H, video, imgs };
    const tgt = S.target || 3;
    $('#pgRes').innerHTML = res.map(r => !r.w.ok ? `<p class="warn">${esc(r.name)}: ${esc(r.w.msg)}</p>` :
      `<h4>${esc(r.name)}</h4><table class="pgt"><tr><th>Wand</th><th>Länge</th><th>±mm (1σ)</th><th>Marken</th><th></th></tr>` +
      r.w.lengths.map((L, i) => `<tr><td>${i + 1}</td><td><b>${f2(L, 3)} m</b></td><td class="${r.w.sigma[i] * 1000 > tgt ? 'warn' : 'ok'}">${r.w.sigma[i] == null ? '–' : f2(r.w.sigma[i] * 1000, 1)}</td><td>${r.w.groups[i].join(', ')}</td><td><button data-op="${res.indexOf(r)},${i}" title="Fenster/Tür in einem Foto antippen">📐 Öffnung</button></td></tr>`).join('') +
      `</table>${r.w.height ? (r.w.hSig !== null && r.w.hSig < 0.005 ? `<p>Raumhöhe (Deckenmarke): <b>${f2(r.w.height, 3)} m</b> ±${f2(r.w.hSig * 1000, 1)} mm</p>` : `<p class="warn">Raumhöhe unsicher (${f2(r.w.height, 2)} m) – Deckenmarke aus mindestens 3 Ecken fotografieren.</p>`) : ''}${r.w.warn.map(x => `<p class="warn">${esc(x)}</p>`).join('')}`).join('') +
      (res.some(r => r.w.ok) ? `<div class="row"><button id="pgTake" class="pri">Räume in den Plan übernehmen</button></div>` : '') +
      (rec.res.rms > 0.6 ? `<p class="warn">⚠ Bildfehler ${rec.res.rms.toFixed(2)} px ist zu hoch – Ergebnis unsicher. Mehr Fotos aus den Ecken (bei mehreren Räumen: mehrere Fotos durch die Tür, auf denen Marken beider Räume zu sehen sind) und erneut auswerten.</p>` : '') +
      `<p class="hint">Bildfehler ${rec.res.rms.toFixed(2)} px (gut: &lt; 0,5 px). Ist ein ±-Wert rot, mehr Bilder aus den Ecken oder weitere Marken an dieser Wand. Eine „Wand“ mit nur 1 Marke ist meist eine Fehlzuordnung – Marke prüfen.</p>`;
    const tk = $('#pgTake'); if (tk) tk.onclick = pgTake;
    $$('#pgRes [data-op]').forEach(b => b.onclick = () => { const [ri, wi] = b.dataset.op.split(',').map(Number); opStart(ri, wi); });
  } catch (e) { pgLog('Fehler: ' + e.message); $('#pgRes').innerHTML = `<p class="warn">${esc(e.message)}</p>`; }
  pr.value = 1; btn.disabled = false;
};
/* Öffnung (Fenster/Tür) im Foto antippen: 2 gegenüberliegende Ecken an der Wandfläche -> Schnitt mit Wandebene */
let opSt = null;
async function loadFrameCanvas(fr) {
  const L = pgLast, cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H; const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (fr.fi !== undefined) ctx.drawImage(await createImageBitmap(L.imgs[fr.fi]), 0, 0);
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
    <button id="opAdd" class="pri" disabled>Öffnung übernehmen</button><button id="opClose">Schließen</button></div>`;
  $('#opSel').onchange = e => { opSt.k = +e.target.value; opSt.pts = []; opShow(); };
  $('#opZoom').oninput = () => opDraw();
  $('#opClr').onclick = () => { opSt.pts = []; opDraw(); };
  $('#opClose').onclick = () => { box.remove(); opSt = null; };
  $('#opAdd').onclick = opAdd;
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
function opAdd() {
  const m = opMean(), d = pgLast.res[opSt.ri], t = $('#opType').value;
  const op = { type: t, wall: opSt.wi, pos: +m.pos.toFixed(4), w: +m.w.toFixed(4), h: +m.h.toFixed(4), brh: t === 'fenster' ? +m.brh.toFixed(4) : 0 };
  (d.ops = d.ops || []).push(op);
  if (d.planRoom && S.rooms.includes(d.planRoom)) { d.planRoom.ops.push({ ...op }); save(); }
  opSt.results = []; opSt.pts = []; opDraw(); $('#opOut').innerHTML = `<span class="ok">✔ ${t === 'fenster' ? 'Fenster' : t === 'tuer' ? 'Tür' : 'Durchgang'} ${Math.round(op.w * 100)}/${Math.round(op.h * 100)} übernommen${d.planRoom ? '' : ' (wird mit „Räume übernehmen“ in den Plan gelegt)'}.</span>`;
}
function pgTake() {
  const { rec, res } = pgLast; let first = null;
  res.forEach(d => {
    if (!d.w.ok) return;
    const r = newRoom(d.name, [], 0, 0); Object.assign(r, fromPoly(d.w.poly, r));
    // Wand i im Plan = Kante Ecke i -> i+1; Sigma gleich indiziert
    r.adj = { wallSigma: d.w.sigma.map(v => v ?? 0.01), cornerMax: 0, s0: rec.res.s0, red: rec.nObs, warn: d.w.warn, v: [], pg: { rms: rec.res.rms, nImg: rec.nImg } };
    if (d.w.height && d.w.hSig !== null && d.w.hSig < 0.005) r.h = +d.w.height.toFixed(3);
    r.ops = (d.ops || []).slice(); d.planRoom = r;
    r.src = 'Photogrammetrie'; S.rooms.push(r); if (first === null) first = S.rooms.length - 1;
  });
  selRoom = first; save(); showTab('plan');
}

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
  $('#floorS').value = f2(S.floorS ?? 2, 1);
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
    (r.ops || []).forEach(op => {
      const e = g.E[op.wall]; if (!e) return;
      const s0 = add(e.p, mul(e.d, op.pos)), s1 = add(s0, mul(e.d, op.w)), nt = mul(e.n, e.t), eps = mul(e.n, -0.01), ept = mul(e.n, e.t + 0.01);
      o += `<path d="M${[add(s0, eps), add(s1, eps), add(s1, ept), add(s0, ept)].map(T).join('L')}Z" fill="#fff"/>`;
      o += line(s0, add(s0, nt), .35) + line(s1, add(s1, nt), .35);
      if (op.pair) return; // Gegenstück einer Tür im Nachbarraum: nur Wandöffnung
      const mids = add(mid(s0, s1), mul(e.n, e.t / 2)), ang = rdAngle(e.d);
      if (op.type === 'fenster') {
        [0, .45, .55, 1].forEach(f => o += line(add(s0, mul(e.n, e.t * f)), add(s1, mul(e.n, e.t * f)), f % 1 ? .18 : .25));
        o += txt(add(mids, mul(e.n, -(e.t / 2 + mm(3.5) / 100))), `FE ${Math.round(op.w * 100)}/${Math.round(op.h * 100)}`, 2.2, ang);
        o += txt(add(mids, mul(e.n, -(e.t / 2 + mm(6.5) / 100))), `BRH ${Math.round((op.brh || 0) * 100)}`, 2, ang);
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
        o += txt(add(mids, mul(e.n, -(e.t / 2 + mm(4) / 100))), `${op.type === 'tuer' ? 'T' : 'DG'} ${Math.round(op.w * 100)}/${Math.round(op.h * 100)}`, 2.2, ang);
      }
    });
    // Bemaßung (lichte Maße)
    if (r.dims !== false) g.E.forEach(e => {
      if (innerWall(ri, e)) { // Innenwand: Maßkette im Raum
        const off = -mm(5) / 100, a = add(e.p, mul(e.n, off)), b = add(e.q, mul(e.n, off)), tk = mul(add(e.d, e.n), mm(1.3) / 100);
        o += line(a, b, .18) + line(add(a, tk), add(a, mul(tk, -1)), .35) + line(add(b, tk), add(b, mul(tk, -1)), .35);
        o += dimTxt(add(mid(a, b), mul(e.n, -mm(2.2) / 100)), e.L, rdAngle(e.d));
        return;
      }
      const off = e.t + mm(7) / 100, a = add(e.p, mul(e.n, off)), b = add(e.q, mul(e.n, off)), tk = mul(add(e.d, e.n), mm(1.3) / 100);
      o += line(add(e.p, mul(e.n, e.t + mm(1.5) / 100)), add(a, mul(e.n, mm(1.5) / 100)), .13) + line(add(e.q, mul(e.n, e.t + mm(1.5) / 100)), add(b, mul(e.n, mm(1.5) / 100)), .13);
      o += line(a, b, .18) + line(add(a, tk), add(a, mul(tk, -1)), .35) + line(add(b, tk), add(b, mul(tk, -1)), .35);
      o += dimTxt(add(mid(a, b), mul(e.n, mm(2.2) / 100)), e.L, rdAngle(e.d));
    });
    // Raumstempel
    const c = add(g.c, [r.lx || 0, r.ly || 0]), dy = mm(4.2) / 100;
    o += txt(c, r.name, 3, 0, 'font-weight="bold"');
    o += txt(add(c, [0, -dy]), `${f2(g.area)} m²`, 2.5);
    o += txt(add(c, [0, -2 * dy]), `RH ${f2(r.h)} m`, 2.2);
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
  svg.innerHTML = gridSVG() + planSVG(selRoom) + (S.rooms.length ? '' : `<text x="${vb.x + vb.w / 2}" y="${vb.y + vb.w * ar / 2}" text-anchor="middle" font-size="${vb.w / 30}" fill="#888">Raum anlegen: oben „+ Rechteckraum“ oder unter „2 Vermessen“ → „Punkte → neuer Raum“</text>`);
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
  const g = e.target.closest('.room'), p = svgPt(e);
  if (g) {
    const i = +g.dataset.i; if (selRoom !== i) { selRoom = i; roomPanel(); }
    drag = { i, p, x: S.rooms[i].x, y: S.rooms[i].y, moved: false };
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
  const p = svgPt(e), r = S.rooms[drag.i];
  r.x = Math.round((drag.x + (p.x - drag.p.x) / 100) * 100) / 100;
  r.y = Math.round((drag.y - (p.y - drag.p.y) / 100) * 100) / 100;
  drag.moved = true; renderPlan();
});
svg.addEventListener('pointerup', () => {
  if (!drag) return;
  if (drag.pan && !drag.moved && selRoom !== null) { selRoom = null; roomPanel(); }
  if (!drag.pan && drag.moved) { snapRoom(drag.i); save(); roomPanel(); }
  drag = null; renderPlan();
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
    <td>${r.adj && r.adj.wallSigma ? `<span class="${r.adj.wallSigma[i] * 1000 > (S.target || 3) ? 'warn' : 'ok'}">${f2(r.adj.wallSigma[i] * 1000, 1)}</span>` : '–'}</td>
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
  ${linkPanel(r)}`;
  rstat();
}
function linkPanel(r) {
  const others = S.rooms.map((o, k) => [o, k]).filter(([o]) => o !== r);
  if (!others.length) return '';
  const L = r._link || (r._link = { wall: 0, room: others[0][1], wall2: 0, t: '', mode: 'tuer', opA: 0, opB: 0, off: 0 }), B = S.rooms[L.room] || others[0][0];
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
      (mx !== null ? `<b>${mx <= tgt ? '✔' : '⚠'} Wandlängen ±${f2(mx, 1)} mm</b> (1σ, schlechteste Wand) · ` + (A.pg ? `Photogrammetrie: ${A.pg.nImg} Bilder, Bildfehler ${f2(A.pg.rms, 2)} px<br>` : `Ecklage ±${f2(A.cornerMax * 1000, 1)} mm · Überbestimmung ${A.red}${A.s0 != null ? ` · σ₀ ${f2(A.s0, 2)}` : ''}<br>`) : '') +
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
  if (d.lk != null) { r._link[d.lk] = ['room', 'wall', 'wall2', 'opA', 'opB'].includes(d.lk) ? +t.value : t.value; if (['room', 'mode'].includes(d.lk)) roomPanel(); return; }
  if (d.ob != null) { const o = r.obs[d.ob]; o[d.f] = d.f === 'i' || d.f === 'j' ? +t.value : d.f === 's' ? (o.typ === 'winkel' ? num(t.value) : num(t.value) / 1000) : o.typ === 'winkel' ? num(t.value) : parseLen(t.value); }
  if (d.s != null || d.ob != null) r.adj = null;
  save(); renderPlan(); rstat();
});
$('#rpanel').addEventListener('click', e => {
  const a = e.target.dataset.a, r = S.rooms[selRoom]; if (!a || !r) return;
  const oi = e.target.dataset.oi;
  switch (a) {
    case 'rot90': r.rot = normA((r.rot || 0) - 90); break;
    case 'mirror': r.mirror = !r.mirror; break;
    case 'ortho': r.segs.forEach(s => { const q = Math.round(s.turn / 90) * 90; if (Math.abs(s.turn - q) < 15) s.turn = q; }); { const q = Math.round(r.rot / 90) * 90; if (Math.abs(r.rot - q) < 15) r.rot = q; } break;
    case 'close': { const g = geo(r); Object.assign(r, fromPoly(g.P, r)); r.adj = null; break; }
    case 'dup': { const c = structuredClone(r); c.name += ' (Kopie)'; placeFree(c); S.rooms.push(c); selRoom = S.rooms.length - 1; break; }
    case 'del': if (!confirm(`Raum „${r.name}“ löschen?`)) return; S.rooms.splice(selRoom, 1); selRoom = null; break;
    case 'addseg': r.segs.push({ len: 1, turn: 90 }); r.adj = null; break;
    case 'delseg': r.segs.pop(); r.ops = r.ops.filter(o => o.wall < r.segs.length); r.obs = (r.obs || []).filter(o => o.i < r.segs.length && (o.j == null || o.j < r.segs.length)); r.adj = null; break;
    case 'addop': { const w = +e.target.dataset.w, L = r.segs[w].len; r.ops.push({ type: 'fenster', wall: w, pos: +Math.max(0, (L - 1.2) / 2).toFixed(2), w: 1.2, h: 1.4, brh: 0.9 }); break; }
    case 'delop': r.ops.splice(oi, 1); break;
    case 'delob': r.obs.splice(oi, 1); r.adj = null; break;
    case 'obsWalls': r.obs = r.obs || []; r.segs.forEach((_, i) => { if (!r.obs.some(o => o.typ === 'wand' && o.i === i)) r.obs.push({ typ: 'wand', i, v: '', s: 0.0015 }); }); break;
    case 'obsDiag': (r.obs = r.obs || []).push({ typ: 'diag', i: 0, j: Math.min(2, r.segs.length - 1), v: '', s: 0.002 }); break;
    case 'obsChord': (r.obs = r.obs || []).push({ typ: 'sehne', i: 0, a: 1.5, b: 1.5, c: '', s: 0.0015 }); break;
    case 'obsAng': (r.obs = r.obs || []).push({ typ: 'winkel', i: 0, v: 90, s: 0.5 }); break;
    case 'adjust': doAdjust(r); break;
    case 'link': { const m = linkRooms(r, S.rooms[r._link.room], r._link); if (m) return alert(m); break; }
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
  const fits = bw <= ax1 - ax0 && bh <= ay1 - ay0;
  $('#fitMsg').innerHTML = fits ? '' : `<span class="warn">Plan passt bei 1:${S.scale} nicht auf ${S.paper} – größeres Blatt oder Maßstab wählen.</span>`;
  const tx = (ax0 + ax1) / 2 - ((b.x0 + b.x1) / 2) * 100 * k, ty = (ay0 + ay1) / 2 + ((b.y0 + b.y1) / 2) * 100 * k;
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}mm" height="${PH}mm" viewBox="0 0 ${PW} ${PH}" font-family="Arial,Helvetica,sans-serif">`;
  o += `<rect width="${PW}" height="${PH}" fill="#fff"/><rect x="20" y="10" width="${PW - 30}" height="${PH - 20}" fill="none" stroke="#000" stroke-width=".5"/>`;
  o += `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k})">${planSVG(null)}</g>`;
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
  o += `<text x="${x + 100}" y="${y + 8.5}" font-size="2.2">${mxs !== null ? `Aufmaß ausgeglichen: ${adj.length}/${rooms.length} Räume, Wandlängen ±${f2(mxs, 1)} mm (1σ)` : 'Aufmaß nicht ausgeglichen'}</text>`;
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
