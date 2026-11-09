'use strict';
/* Raumplan Versuch – Wand für Wand aus mehreren Blickwinkeln, die App rechnet die Länge selbst. Kein Antippen. */
const APP_VER = 'Versuch 3';
const $ = s => document.querySelector(s), SCR = ['home', 'cam', 'res'];
const f2 = (v, d = 2) => v.toFixed(d).replace('.', ',');
const m = mm => f2(mm / 1000) + ' m';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = 'raumplan-versuch-v1', DEMO = /[?&]demo/.test(location.search);
const store = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
store.walls = store.walls || [];
const save = () => { try { localStorage.setItem(LS, JSON.stringify({ walls: store.walls.map(w => ({ ...w, thumbs: undefined })) })); } catch (e) { } };
function show(id) { SCR.forEach(s => { $('#' + s).hidden = s !== id; }); window.scrollTo(0, 0); }
let nTimer = 0; function notice(t, ms = 5000) { const n = $('#notice'); n.textContent = t; n.hidden = false; clearTimeout(nTimer); nTimer = setTimeout(() => { n.hidden = true; }, ms); }
const busy = on => { $('#busy').hidden = !on; };
const tick = () => new Promise(r => setTimeout(r, 30));

let cw = null; // aktuelle Wand {name, views:[], result, thumbs:[], locs:[]}
function home() { show('home'); $('#ver').textContent = 'Version ' + APP_VER; const box = $('#list'); box.innerHTML = ''; $('#listCard').hidden = !store.walls.length; store.walls.forEach(w => { const r = document.createElement('div'), d = w.real ? w.L - w.real * 10 : null; r.className = 'wrow'; r.innerHTML = `<span><b>${esc(w.name)}</b> ${m(w.L)}${d !== null ? ` <span class="${Math.abs(d) <= 30 ? 'good' : 'bad'}">Abw. ${f2(d / 10, 1)} cm</span>` : ''}</span><span class="${w.verdict === 'ok' ? 'good' : w.verdict === 'no' ? 'bad' : 'mut'}">${w.verdict === 'ok' ? '✔ passt' : w.verdict === 'no' ? '✘ passt nicht' : ''}</span>`; box.appendChild(r); }); }
function newWall() { cw = { name: 'Wand ' + (store.walls.length + 1), views: [], locs: [], thumbs: [], result: null, saved: false }; openCam(); }
$('#start').onclick = newWall;
$('#print').onclick = () => window.open('druck.html', '_blank');
$('#clear').onclick = () => { store.walls = []; save(); home(); };

// ---------- Kamera ----------
let stream = null, track = null, scanTimer = 0, stable = 0, lastC = null, autoOn = true, grabbing = false, lastShot = null, zoomMin = null, wide = false;
const scanCv = document.createElement('canvas');
function camInfo() { const n = cw.views.length, r = cw.result; $('#camTxt').textContent = n ? `${cw.name} · ${n} ${n === 1 ? 'Foto' : 'Fotos'}. Weiter von einer anderen Stelle.` : `${cw.name}: Handy quer, beide Blätter und die Wand ins Bild.`; $('#camLen').textContent = n < 3 ? (n ? `noch ${3 - n} ${3 - n === 1 ? 'Foto' : 'Fotos'}` : '') : r && r.ok ? m(r.L) : 'noch keine Wand erkannt'; $('#camDone').disabled = n < 3; drawMap($('#map'), r, 150); }
async function openCam() { show('cam'); stable = 0; lastC = null; grabbing = false; setPills(null); camInfo(); if (DEMO) { $('#pick').textContent = 'Testfoto'; return; }
  try { document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch(() => { }); } catch (e) { }
  if (!stream || !stream.active) { try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 4096 }, height: { ideal: 3072 } } }); track = stream.getVideoTracks()[0]; const cap = track.getCapabilities?.() || {}; zoomMin = cap.zoom && cap.zoom.min < 1 ? cap.zoom.min : null; $('#wide').hidden = zoomMin === null; if (wide && zoomMin !== null) await setZoom(zoomMin); } catch (e) { $('#camTxt').textContent = 'Kamera nicht verfügbar. Bitte „Foto-App“ benutzen.'; return; } }
  $('#vid').srcObject = stream; await $('#vid').play().catch(() => { }); clearInterval(scanTimer); scanTimer = setInterval(scan, 350); }
const setZoom = z => track.applyConstraints({ advanced: [{ zoom: z }] }).catch(() => { });
$('#wide').onclick = async () => { wide = !wide; $('#wide').classList.toggle('on', wide); $('#wide').textContent = wide ? '0,6×' : '1×'; if (zoomMin !== null) await setZoom(wide ? zoomMin : 1); stable = 0; };
function closeCam() { clearInterval(scanTimer); if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => { }); }
function setPills(res) { const ends = res && res.ok ? new Set(res.ids.map(i => RP.END[i])) : res && res.found ? new Set(res.found.map(i => RP.END[i])) : new Set(); $('#p0').classList.toggle('on', ends.has(0)); $('#p1').classList.toggle('on', ends.has(1)); }
function scan() { const v = $('#vid'); if (grabbing || !v.videoWidth) return; const W = 1600, H = Math.round(W * v.videoHeight / v.videoWidth); scanCv.width = W; scanCv.height = H; const c = scanCv.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0, W, H); const g = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H), loc = RP.locate(RP.findQuads(g, W, H, { maxW: W })); setPills(loc);
  const ready = loc.ok && loc.ids.length === 4 && loc.rms < 2; let moved = true, cn = null; if (ready) { const pts = loc.pts.map(q => q.px).flat(), move = lastC ? Math.max(...pts.map((x, i) => Math.abs(x - lastC[i]))) : 99; lastC = pts; stable = move < 5 ? stable + 1 : 0; cn = [loc.pts[0].px[0] / W, loc.pts[0].px[1] / H]; if (lastShot) moved = Math.hypot(cn[0] - lastShot[0], cn[1] - lastShot[1]) > 0.1; } else { stable = 0; lastC = null; }
  $('#pRuh').hidden = !(ready && autoOn && moved); if (autoOn && ready && moved && stable >= 3) { lastShot = cn; capture(); } }
async function capture() { if (grabbing) return; grabbing = true; clearInterval(scanTimer); $('#shot').disabled = true; busy(true); await tick();
  try { let bmp = null; if (typeof ImageCapture !== 'undefined' && track) { try { const ic = new ImageCapture(track), cap = await ic.getPhotoCapabilities().catch(() => null), opt = cap && cap.imageWidth ? { imageWidth: cap.imageWidth.max, imageHeight: cap.imageHeight.max } : {}; bmp = await createImageBitmap(await Promise.race([ic.takePhoto(opt), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitlimit')), 7000))])); } catch (e) { bmp = null; } }
    if (!bmp) { const v = $('#vid'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); bmp = await createImageBitmap(c); }
    await processImage(bmp); } catch (e) { busy(false); notice('Aufnahme fehlgeschlagen: ' + e.message); $('#shot').disabled = false; grabbing = false; openCam(); } }
$('#shot').onclick = capture;
$('#auto').onclick = () => { autoOn = !autoOn; $('#auto').classList.toggle('on', autoOn); $('#auto').textContent = 'Automatik ' + (autoOn ? 'an' : 'aus'); stable = 0; };
$('#camClose').onclick = () => { closeCam(); home(); };
$('#camDone').onclick = () => { closeCam(); showResult(); };
$('#pick').onclick = () => { if (DEMO) demoShot(); else $('#file').click(); };
$('#file').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; busy(true); await tick(); try { await processImage(await createImageBitmap(f)); } catch (x) { busy(false); notice('Foto konnte nicht gelesen werden.'); } };
let demoN = 0; async function demoShot() { busy(true); await tick(); const name = `demo/s${String(demoN++ % 12).padStart(3, '0')}`; const b = await (await fetch(name + '.jpg')).blob(); window.__truth = await (await fetch(name + '.json')).json(); await processImage(await createImageBitmap(b)); }

// ---------- Auswerten ----------
const endMsg = l => { const f = (l.found || []).map(i => RP.END[i]); return f.includes(0) && !f.includes(1) ? 'Nur das Blatt „0 cm“ gefunden, dieses Foto zählt nicht. Beide Blätter ins Bild.' : f.includes(1) && !f.includes(0) ? 'Nur das Blatt „200 cm“ gefunden, dieses Foto zählt nicht. Beide Blätter ins Bild.' : 'Keine Marken gefunden, dieses Foto zählt nicht.'; };
async function processImage(bmp) { const W = bmp.width, H = bmp.height, src = document.createElement('canvas'); src.width = W; src.height = H; const c = src.getContext('2d', { willReadFrequently: true }); c.drawImage(bmp, 0, 0); bmp.close?.(); await tick();
  const gray = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H), loc = RP.locateBest(gray, W, H); if (!loc.ok) { busy(false); grabbing = false; $('#shot').disabled = false; notice(loc.err === 'rms' ? 'Blätter liegen nicht flach, dieses Foto zählt nicht.' : endMsg(loc), 6000); if (DEMO) camInfo(); else openCam(); return; }
  await tick(); cw.views.push(RP.viewMap(gray, W, H, loc)); cw.locs.push({ H: loc.H, rms: loc.rms, ids: loc.ids, W, H }); cw.thumbs.push(thumb(src)); cw.result = RP.wallFromViews(cw.views); busy(false); grabbing = false; $('#shot').disabled = false; navigator.vibrate?.(40); camInfo(); if (!DEMO && !$('#cam').hidden) { clearInterval(scanTimer); scanTimer = setInterval(scan, 350); } }
const thumb = cvs => { const w = 800, h = Math.round(w * cvs.height / cvs.width), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(cvs, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.55); };
function drawMap(cv, r, css) { const D = cv.id === 'bigMap' ? 1 : (window.devicePixelRatio > 1 ? 2 : 1), S = cv.id === 'bigMap' ? 840 : css * D; cv.width = S; cv.height = S; const c = cv.getContext('2d'); c.fillStyle = '#000c'; c.fillRect(0, 0, S, S); const { cell, x0, y0, n } = RP.GRID, spanMM = cell * n, k = S / spanMM, T = p => [(p[0] - x0) * k, (p[1] - y0) * k]; if (r && r.K) { c.fillStyle = '#6b7786'; const q = Math.max(1, Math.ceil(cell * k)); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (r.K[j * n + i]) c.fillRect(i * cell * k, j * cell * k, q, q); } c.strokeStyle = '#ffd166'; c.lineWidth = 3 * D; c.beginPath(); c.moveTo(...T([0, 13])); c.lineTo(...T([2000, 13])); c.stroke(); if (r && r.ok) { const a = T(r.a), b = T(r.b); c.strokeStyle = '#ffd166'; c.lineWidth = 4 * D; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); [[a, r.leftOk], [b, r.rightOk]].forEach(([p, ok]) => { c.fillStyle = ok ? '#3ecf74' : '#ff5a5a'; c.beginPath(); c.arc(p[0], p[1], 7 * D, 0, 7); c.fill(); }); } }

// ---------- Ergebnis ----------
let verdict = null;
function showResult() { show('res'); verdict = null; $('#vOk').classList.remove('sel'); $('#vNo').classList.remove('sel'); $('#real').value = ''; $('#diff').textContent = ''; $('#resName').textContent = cw.name; const r = cw.result; if (r && r.ok) { $('#resLen').textContent = m(r.L); const un = [!r.leftOk && 'linkes', !r.rightOk && 'rechtes'].filter(Boolean); $('#resInfo').textContent = `${r.n} Fotos` + (un.length ? ` · ${un.join(' und ')} Ende nur geschätzt` : ''); } else { $('#resLen').textContent = '—'; $('#resInfo').textContent = 'Keine Wand erkannt. Noch ein Foto mit mehr Boden an der Wand.'; } drawMap($('#bigMap'), r); }
function record() { if (!cw.result || !cw.result.ok) return null; let w = store.walls.find(x => x === cw.rec); if (!w) { w = cw.rec = { name: cw.name, t: Date.now() }; store.walls.push(w); } Object.assign(w, { L: cw.result.L, n: cw.result.n, leftOk: cw.result.leftOk, rightOk: cw.result.rightOk, dist: cw.result.dist, a: cw.result.a, b: cw.result.b, locs: cw.locs, verdict, real: parseFloat($('#real').value) || null, thumbs: cw.thumbs }); save(); return w; }
$('#vOk').onclick = () => { verdict = 'ok'; $('#vOk').classList.add('sel'); $('#vNo').classList.remove('sel'); record(); };
$('#vNo').onclick = () => { verdict = 'no'; $('#vNo').classList.add('sel'); $('#vOk').classList.remove('sel'); record(); };
$('#real').oninput = () => { const v = parseFloat($('#real').value), r = cw.result; if (v > 0 && r && r.ok) { const d = r.L - v * 10; $('#diff').textContent = `Abweichung ${f2(d / 10, 1)} cm`; $('#diff').className = Math.abs(d) <= 30 ? 'good' : 'bad'; } else $('#diff').textContent = ''; record(); };
$('#more').onclick = openCam;
$('#next').onclick = () => { record(); newWall(); };
$('#toHome').onclick = () => { record(); home(); };
$('#send').onclick = async () => { const out = { app: APP_VER, device: navigator.userAgent, datum: new Date().toISOString(), walls: store.walls }, name = `fall-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`, file = new File([JSON.stringify(out)], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } } const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); };
home();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
