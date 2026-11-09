'use strict';
/* Raumplan neu – Bodenaufmaß: Der Zollstock bleibt mittig im Raum liegen. Jedes Foto zeigt ihn und mindestens eine Raumecke.
   Alle Ecken liegen dadurch im selben Bodensystem; dieselbe Ecke auf mehreren Fotos wird automatisch gemittelt. */
const APP_VER = 'neu 2 · Boden';
const $ = s => document.querySelector(s), SCR = ['home', 'setup', 'guide', 'cam', 'rev', 'res'];
const f2 = (v, d = 2) => v.toFixed(d).replace('.', ',');
const m = mm => f2(mm / 1000) + ' m';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = 'raumplan-neu-v2';
const store = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
store.rooms = store.rooms || [];
const save = () => { try { localStorage.setItem(LS, JSON.stringify({ rooms: store.rooms, skirt: store.skirt, seen: store.seen })); } catch (e) { notice('Speicher voll – ältere Räume löschen.'); } };
function show(id) { SCR.forEach(s => { $('#' + s).hidden = s !== id; }); window.scrollTo(0, 0); }
let nTimer = 0; function notice(t, ms = 5000) { const n = $('#notice'); n.textContent = t; n.hidden = false; clearTimeout(nTimer); nTimer = setTimeout(() => { n.hidden = true; }, ms); }
const busy = on => { $('#busy').hidden = !on; };
const tick = () => new Promise(r => setTimeout(r, 30));
const DEMO = /[?&]demo/.test(location.search);

// ---------- Übersicht ----------
let cur = null; // {name, photos:[{loc, pins:[[x,y]..], W, H, thumb}], ctrl:{}}
function home() { show('home'); $('#ver').textContent = 'Version ' + APP_VER; const box = $('#rooms'); box.innerHTML = '';
  store.rooms.forEach((r, i) => { const b = document.createElement('button'), s = roomOf(r); b.className = 'room'; b.innerHTML = `<span><b>${esc(r.name)}</b><br><span class="mut">${s.poly.length} Ecken</span></span><span class="mut">${s.poly.length > 2 ? f2(s.area) + ' m²' : ''}</span>`; b.onclick = () => { cur = JSON.parse(JSON.stringify(r)); cur.saved = i; showResult(); }; box.appendChild(b); }); }
$('#newRoom').onclick = () => { $('#rName').value = 'Raum ' + (store.rooms.length + 1); show(store.seen ? 'setup' : 'guide'); };
$('#howto').onclick = () => show('guide');
$('#guideGo').onclick = () => { store.seen = 1; save(); if ($('#rName').value) show('setup'); else home(); };
$('#setupBack').onclick = home;
$('#setupGo').onclick = () => { cur = { name: $('#rName').value.trim() || 'Raum', photos: [], ctrl: {} }; openCam(); };
$('#print').onclick = () => window.open('druck.html', '_blank');

// ---------- Raum aus allen Fotos ----------
function roomOf(r) { const pins = []; r.photos.forEach((p, k) => p.pins.forEach((q, i) => pins.push({ f: RP.toFloor(p.loc, q), photo: k, s: (p.sig && p.sig[i]) || 15 }))); return RP.roomFromPins(pins, store.skirt || 0); }

// ---------- Kamera ----------
let stream = null, track = null, scanTimer = 0, stable = 0, lastC = null, autoOn = true, grabbing = false, lastShot = null, zoomMin = null, wide = false;
const scanCv = document.createElement('canvas');
function camInfo() { const n = cur.photos.length, s = roomOf(cur); $('#camTxt').textContent = n === 0 ? 'Zollstock mittig in den Raum legen, er bleibt dort. Zurückgehen, bis beide Blätter und eine Raumecke am Boden im Bild sind.' : `${n} ${n === 1 ? 'Foto' : 'Fotos'}, ${s.poly.length} Ecken. Jetzt die nächste Ecke, Zollstock nicht bewegen.`; $('#camDone').hidden = s.poly.length < 3; }
async function openCam() { show('cam'); stable = 0; lastC = null; grabbing = false; setPills(null); camInfo(); if (DEMO) { $('#pick').textContent = 'Testfoto'; return; }
  try { document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch(() => { }); } catch (e) { }
  if (!stream || !stream.active) { try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 4096 }, height: { ideal: 3072 } } }); track = stream.getVideoTracks()[0]; const cap = track.getCapabilities?.() || {}; zoomMin = cap.zoom && cap.zoom.min < 1 ? cap.zoom.min : null; $('#wide').hidden = zoomMin === null; if (wide && zoomMin !== null) await setZoom(zoomMin); } catch (e) { $('#camTxt').textContent = 'Kamera nicht verfügbar. Bitte „Foto-App“ benutzen.'; return; } }
  $('#vid').srcObject = stream; await $('#vid').play().catch(() => { }); clearInterval(scanTimer); scanTimer = setInterval(scan, 350); }
const setZoom = z => track.applyConstraints({ advanced: [{ zoom: z }] }).catch(() => { });
$('#wide').onclick = async () => { wide = !wide; $('#wide').classList.toggle('on', wide); $('#wide').textContent = wide ? '0,6×' : '1×'; if (zoomMin !== null) await setZoom(wide ? zoomMin : 1); stable = 0; };
function closeCam() { clearInterval(scanTimer); if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => { }); }
function setPills(res) { const ends = res && res.ok ? new Set(res.ids.map(i => RP.END[i])) : res && res.found ? new Set(res.found.map(i => RP.END[i])) : new Set(); $('#p0').classList.toggle('on', ends.has(0)); $('#p1').classList.toggle('on', ends.has(1)); }
function scan() { const v = $('#vid'); if (grabbing || !v.videoWidth) return; const W = 1600, H = Math.round(W * v.videoHeight / v.videoWidth); scanCv.width = W; scanCv.height = H; const c = scanCv.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0, W, H); const g = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H), loc = RP.locate(RP.findQuads(g, W, H, { maxW: W })); setPills(loc);
  const ready = loc.ok && loc.ids.length === 4 && loc.rms < 2; let moved = true; if (ready) { const pts = loc.pts.map(q => q.px).flat(), move = lastC ? Math.max(...pts.map((x, i) => Math.abs(x - lastC[i]))) : 99; lastC = pts; stable = move < 5 ? stable + 1 : 0; const cn = [loc.pts[0].px[0] / W, loc.pts[0].px[1] / H]; if (lastShot) moved = Math.hypot(cn[0] - lastShot[0], cn[1] - lastShot[1]) > 0.08; } else { stable = 0; lastC = null; }
  $('#pRuh').hidden = !(ready && autoOn && moved); if (autoOn && ready && moved && stable >= 3) { lastShot = [loc.pts[0].px[0] / W, loc.pts[0].px[1] / H]; capture(); } }
async function capture() { if (grabbing) return; grabbing = true; clearInterval(scanTimer); $('#shot').disabled = true; busy(true); await tick();
  try { let bmp = null; if (typeof ImageCapture !== 'undefined' && track) { try { const ic = new ImageCapture(track), cap = await ic.getPhotoCapabilities().catch(() => null), opt = cap && cap.imageWidth ? { imageWidth: cap.imageWidth.max, imageHeight: cap.imageHeight.max } : {}; bmp = await createImageBitmap(await Promise.race([ic.takePhoto(opt), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitlimit')), 7000))])); } catch (e) { bmp = null; } }
    if (!bmp) { const v = $('#vid'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); bmp = await createImageBitmap(c); }
    await processImage(bmp); } catch (e) { busy(false); notice('Aufnahme fehlgeschlagen: ' + e.message); $('#shot').disabled = false; grabbing = false; openCam(); } }
$('#shot').onclick = capture;
$('#auto').onclick = () => { autoOn = !autoOn; $('#auto').classList.toggle('on', autoOn); $('#auto').textContent = 'Automatik ' + (autoOn ? 'an' : 'aus'); stable = 0; };
$('#camClose').onclick = () => { closeCam(); cur.photos.length ? showResult() : home(); };
$('#camDone').onclick = () => { closeCam(); showResult(); };
$('#pick').onclick = () => { if (DEMO) demoShot(); else $('#file').click(); };
$('#file').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; busy(true); await tick(); try { await processImage(await createImageBitmap(f)); } catch (x) { busy(false); notice('Foto konnte nicht gelesen werden.'); } };
let demoN = 0; async function demoShot() { busy(true); await tick(); const name = `demo/s${String(demoN++ % 8).padStart(3, '0')}`; const b = await (await fetch(name + '.jpg')).blob(); window.__truth = await (await fetch(name + '.json')).json(); await processImage(await createImageBitmap(b)); }

// ---------- Auswerten ----------
let P = null;
async function processImage(bmp) { const W = bmp.width, H = bmp.height, src = document.createElement('canvas'); src.width = W; src.height = H; const c = src.getContext('2d', { willReadFrequently: true }); c.drawImage(bmp, 0, 0); bmp.close?.(); await tick();
  const gray = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H), loc = RP.locateBest(gray, W, H); busy(false); grabbing = false; $('#shot').disabled = false;
  if (!loc.ok) { notice(loc.err === 'rms' ? 'Blätter liegen nicht flach oder Zollstock nicht ganz offen. Bitte neu.' : endMsg(loc), 7000); openCam(); return; }
  P = { src, gray, W, H, loc, pins: [] }; closeCam(); openReview(); }
const endMsg = l => { const f = (l.found || []).map(i => RP.END[i]); return f.includes(0) && !f.includes(1) ? 'Nur das Blatt „0 cm“ gefunden. Weiter zurück oder 0,6× wählen, bis beide Blätter im Bild sind.' : f.includes(1) && !f.includes(0) ? 'Nur das Blatt „200 cm“ gefunden. Weiter zurück oder 0,6× wählen, bis beide Blätter im Bild sind.' : 'Keine Marken gefunden. Die Blätter müssen flach liegen, im Bild und scharf sein.'; };

// ---------- Ecken antippen ----------
const cv = $('#cv'); let view = null, base = null, drag = null, sel = -1;
function openReview() { show('rev'); layoutCv(); $('#skirt').hidden = store.skirt !== undefined; sel = -1; redraw(); updateRev(); }
function layoutCv() { const dpr = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth * dpr, Hc = cv.clientHeight * dpr; cv.width = Wc; cv.height = Hc; const s = Math.min(Wc / P.W, Hc / P.H), ox = (Wc - P.W * s) / 2, oy = (Hc - P.H * s) / 2; view = { s, ox, oy, dpr }; base = document.createElement('canvas'); base.width = Wc; base.height = Hc; const b = base.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, Wc, Hc); b.imageSmoothingQuality = 'high'; b.drawImage(P.src, ox, oy, P.W * s, P.H * s); }
const toS = p => [p[0] * view.s + view.ox, p[1] * view.s + view.oy];
const toI = (x, y) => [(x - view.ox) / view.s, (y - view.oy) / view.s];
function redraw() { const c = cv.getContext('2d'), D = view.dpr; c.drawImage(base, 0, 0); c.lineWidth = 2 * D; const by = {}; P.loc.pts.forEach(q => { (by[q.id] = by[q.id] || []).push(q.px); }); c.strokeStyle = '#3ecf74'; Object.values(by).forEach(q => { c.beginPath(); q.forEach((p, i) => { const s = toS(p); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); c.stroke(); });
  P.pins.forEach((p, i) => { const s = toS(p), r = 15 * D; c.strokeStyle = i === sel ? '#ffd166' : '#ff3b3b'; c.lineWidth = 2.5 * D; c.beginPath(); c.arc(s[0], s[1], r, 0, 7); c.moveTo(s[0] - r - 8, s[1]); c.lineTo(s[0] + r + 8, s[1]); c.moveTo(s[0], s[1] - r - 8); c.lineTo(s[0], s[1] + r + 8); c.stroke(); });
  if (drag !== null) { const p = P.pins[drag.i], R = 90 * D, z = 5, sx = p[0] - R / z, sy = p[1] - R / z, s0 = toS(p), fx = s0[0] < cv.width / 2 && s0[1] < cv.height * .6 ? cv.width - 2 * R - 12 : 12, my = R + 60 * D; c.save(); c.beginPath(); c.arc(fx + R, my, R, 0, 7); c.clip(); c.fillStyle = '#000'; c.fillRect(fx, my - R, 2 * R, 2 * R); c.drawImage(P.src, sx, sy, 2 * R / z, 2 * R / z, fx, my - R, 2 * R, 2 * R); c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 2 * D; c.beginPath(); c.arc(fx + R, my, R, 0, 7); c.moveTo(fx + R - 16 * D, my); c.lineTo(fx + R + 16 * D, my); c.moveTo(fx + R, my - 16 * D); c.lineTo(fx + R, my + 16 * D); c.stroke(); }
  drawMap(); }
function drawMap() { const mc = $('#map'), D = window.devicePixelRatio > 1 ? 2 : 1, S = 150 * D; mc.width = S; mc.height = S; const c = mc.getContext('2d'), test = { ...cur, photos: cur.photos.concat([{ loc: P.loc, pins: P.pins }]) }, s = roomOf(test), pts = s.poly.concat([[0, 70], [2000, 70], [0, 225], [2000, 225]]), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), k = (S - 24 * D) / Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0, 1), T = p => [(p[0] - x0) * k + 12 * D, (p[1] - y0) * k + 12 * D]; c.fillStyle = '#000b'; c.fillRect(0, 0, S, S); c.strokeStyle = '#ffd166'; c.lineWidth = 3 * D; c.beginPath(); c.moveTo(...T([0, 13])); c.lineTo(...T([2000, 13])); c.stroke(); c.strokeStyle = '#4da3ff'; c.lineWidth = 2 * D; if (s.poly.length > 2) { c.beginPath(); s.poly.forEach((p, i) => { const q = T(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.stroke(); } s.corners.forEach(p => { const q = T(p.p); c.fillStyle = p.n > 1 ? '#3ecf74' : '#ff5a5a'; c.beginPath(); c.arc(q[0], q[1], 4 * D, 0, 7); c.fill(); }); }
function updateRev() { const n = P.pins.length; $('#revTitle').textContent = `${cur.name} · Foto ${cur.photos.length + 1}`; $('#revLen').textContent = n ? `${n} ${n === 1 ? 'Ecke' : 'Ecken'}` : 'Raumecke am Boden antippen'; const wk = P.pins.filter(q => RP.pinSigma(P.loc, q, 16) > 70).length; $('#revWarn').textContent = wk ? 'Diese Ecke ist auf dem Foto unsicher. Besser näher heran oder von einer anderen Stelle.' : P.loc.ids.length < 4 ? 'Nur ' + P.loc.ids.length + ' von 4 Marken erkannt, Foto zählt weniger.' : ''; $('#revOk').disabled = store.skirt === undefined || !n; $('#revDel').hidden = sel < 0; }
const evPos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * view.dpr, (e.clientY - r.top) * view.dpr]; };
cv.addEventListener('pointerdown', e => { const [x, y] = evPos(e); let i = -1, bd = 80 * view.dpr; P.pins.forEach((p, k) => { const s = toS(p), d = Math.hypot(s[0] - x, s[1] - y); if (d < bd) { bd = d; i = k; } }); if (i < 0) { const q = toI(x, y); if (q[0] < 0 || q[1] < 0 || q[0] > P.W || q[1] > P.H) return; P.pins.push(q); i = P.pins.length - 1; drag = { i, off: [0, 0] }; } else { const s = toS(P.pins[i]); drag = { i, off: [s[0] - x, s[1] - y] }; } sel = i; try { cv.setPointerCapture(e.pointerId); } catch (x2) { } redraw(); updateRev(); });
cv.addEventListener('pointermove', e => { if (drag === null) return; const [x, y] = evPos(e); P.pins[drag.i] = toI(x + drag.off[0], y + drag.off[1]); redraw(); });
cv.addEventListener('pointerup', () => { if (drag === null) return; const i = drag.i; drag = null; P.pins[i] = RP.cornerSnap(P.gray, P.W, P.H, P.pins[i]); redraw(); updateRev(); });
window.addEventListener('resize', () => { if (!$('#rev').hidden) { layoutCv(); redraw(); } });
document.querySelectorAll('#skirt button').forEach(b => b.onclick = () => { store.skirt = +b.dataset.v; save(); document.querySelectorAll('#skirt button').forEach(q => q.classList.toggle('sel', q === b)); setTimeout(() => { $('#skirt').hidden = true; }, 200); updateRev(); });
$('#revDel').onclick = () => { if (sel >= 0) { P.pins.splice(sel, 1); sel = -1; redraw(); updateRev(); } };
$('#revRedo').onclick = () => { P = null; openCam(); };
$('#revOk').onclick = () => { if (store.skirt === undefined || !P.pins.length) return; const rec = { loc: snapLoc(P.loc), pins: P.pins.map(q => [q[0], q[1]]), sig: P.pins.map(q => RP.pinSigma(P.loc, q)), W: P.W, H: P.H, thumb: thumb(P.src), t: Date.now() }; cur.photos.push(rec); P = null; openCam(); };
const snapLoc = l => ({ H: l.H, Hi: l.Hi, rms: l.rms, edge: l.edge, ids: l.ids });
const thumb = cvs => { const w = 1200, h = Math.round(w * cvs.height / cvs.width), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(cvs, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.6); };

// ---------- Ergebnis ----------
function showResult() { show('res'); $('#resName').textContent = cur.name; const s = roomOf(cur), hints = [];
  s.problems.forEach(p => hints.push(`<div class="hint"><span class="bad">${esc(p)}</span></div>`));
  const single = s.corners.filter(c => c.n === 1).length; if (single && s.poly.length > 2) hints.push(`<div class="hint">${single} ${single === 1 ? 'Ecke ist' : 'Ecken sind'} erst auf einem Foto. Noch ein Foto von anderer Stelle macht sie genauer und zeigt Fehler auf.</div>`);
  const off = s.corners.filter(c => c.spread > 50).length; if (off) hints.push(`<div class="hint"><span class="warn">${off} ${off === 1 ? 'Ecke weicht' : 'Ecken weichen'} zwischen den Fotos über 5 cm ab. Wurde der Zollstock bewegt?</span></div>`);
  $('#resHint').innerHTML = hints.join('');
  $('#sketch').innerHTML = s.poly.length > 2 ? sketchSVG(cur, s) : '<div class="mut">Mindestens drei Ecken nötig.</div>'; $('#resArea').textContent = s.poly.length > 2 ? `Fläche ${f2(s.area)} m²` : '';
  const list = $('#wallList'); list.innerHTML = ''; cur.ctrl = cur.ctrl || {}; s.walls.forEach((w, i) => { const row = document.createElement('div'), ct = cur.ctrl[i], diff = ct ? w.L - ct * 10 : null; row.className = 'wallrow'; row.innerHTML = `<span class="name"><b>Wand ${i + 1}</b>: ${m(w.L)} <span class="mut">± ${f2(Math.max(1, (1.5 * w.sig + 5) / 10), 0)} cm</span>${diff !== null ? ` <span class="${Math.abs(diff) <= 20 ? 'good' : 'bad'}">Abw. ${f2(diff / 10, 1)} cm</span>` : ''}</span><input type="number" inputmode="decimal" step="0.1" placeholder="cm" value="${ct || ''}" aria-label="Kontrollmaß Wand ${i + 1} in cm">`; row.querySelector('input').onchange = e => { const v = parseFloat(e.target.value); if (v > 0) cur.ctrl[i] = v; else delete cur.ctrl[i]; showResult(); }; list.appendChild(row); }); }
function sketchSVG(r, s, big) { const P0 = s.poly, xs = P0.map(p => p[0]), ys = P0.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), Ww = Math.max(...xs) - x0, Hh = Math.max(...ys) - y0, pad = 90, k = 520 / Math.max(Ww, Hh, 1), W = Ww * k + pad * 2, H = Hh * k + pad * 2, pts = P0.map(p => [(p[0] - x0) * k + pad, (p[1] - y0) * k + pad]);
  let o = `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" width="100%" style="max-height:60vh"><polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${big ? '#fff' : '#2a3a4d'}" stroke="${big ? '#000' : '#4da3ff'}" stroke-width="5"/>`, cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; o += `<text x="${cx.toFixed(0)}" y="${cy.toFixed(0)}" text-anchor="middle" font-size="22" fill="${big ? '#000' : '#fff'}">${esc(r.name)}</text>`;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = mx - cx, dy = my - cy, len = Math.hypot(dx, dy) || 1; o += `<text x="${(mx + dx / len * 46).toFixed(0)}" y="${(my + dy / len * 46 + 8).toFixed(0)}" text-anchor="middle" font-size="24" font-weight="700" fill="${big ? '#000' : '#ffd166'}">${f2(s.walls[i].L / 1000)} m</text>`; }); return o + '</svg>'; }
$('#resSave').onclick = () => { const copy = JSON.parse(JSON.stringify(cur)); delete copy.saved; copy.photos.forEach(p => { delete p.thumb; }); if (cur.saved !== undefined) store.rooms[cur.saved] = copy; else { store.rooms.push(copy); cur.saved = store.rooms.length - 1; } save(); notice('Gespeichert.'); };
$('#resMore').onclick = () => openCam();
$('#resHome').onclick = home;
$('#resPrint').onclick = () => { const s = roomOf(cur); if (s.poly.length < 3) return; const a = $('#printArea'); a.hidden = false; a.innerHTML = `<h2 style="color:#000">${esc(cur.name)}</h2>${sketchSVG(cur, s, true)}<p style="color:#000">Fläche ${f2(s.area)} m²</p>`; window.print(); setTimeout(() => { a.hidden = true; }, 500); };
$('#resDxf').onclick = () => { const s = roomOf(cur); if (s.poly.length < 3) return; let d = '0\nSECTION\n2\nENTITIES\n'; s.poly.forEach((p, i) => { const q = s.poly[(i + 1) % s.poly.length]; d += `0\nLINE\n8\nWAND\n10\n${(p[0] / 1000).toFixed(4)}\n20\n${(p[1] / 1000).toFixed(4)}\n11\n${(q[0] / 1000).toFixed(4)}\n21\n${(q[1] / 1000).toFixed(4)}\n`; }); d += '0\nENDSEC\n0\nEOF\n'; download(new Blob([d], { type: 'application/dxf' }), cur.name + '.dxf'); };
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
$('#resSend').onclick = async () => { const out = { app: APP_VER, device: navigator.userAgent, datum: new Date().toISOString(), skirt: store.skirt, room: cur }, name = `fall-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`, file = new File([JSON.stringify(out)], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } } download(file, name); };
home();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
