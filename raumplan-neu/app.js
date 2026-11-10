'use strict';
/* Raumplan Versuch – zwei Varianten:
   1. Wand für Wand aus mehreren Fotos, Zollstock mit Blättern liegt im Raum.
   2. Bodenfläche filmen ohne Blätter: das Handy verfolgt seine Bewegung, ein Referenzmaß gibt den Maßstab. */
const APP_VER = 'Versuch 6 · Lerntraining';
const $ = s => document.querySelector(s), SCR = ['home', 'ref', 'cam', 'res'];
const f2 = (v, d = 2) => v.toFixed(d).replace('.', ',');
const m = mm => f2(mm / 1000) + ' m';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = 'raumplan-versuch-v1', DEMO = /[?&]demo/.test(location.search);
const store = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
store.walls = store.walls || []; store.lern = store.lern || [];
const save = () => { try { localStorage.setItem(LS, JSON.stringify({ lens: store.lens, lern: store.lern, walls: store.walls.map(w => ({ ...w, thumbs: undefined, bilder: undefined })) })); } catch (e) { } };
function show(id) { SCR.forEach(s => { $('#' + s).hidden = s !== id; }); window.scrollTo(0, 0); }
let nTimer = 0; function notice(t, ms = 5000) { const n = $('#notice'); n.textContent = t; n.hidden = false; clearTimeout(nTimer); nTimer = setTimeout(() => { n.hidden = true; }, ms); }
const busy = (on, txt) => { $('#busy').hidden = !on; $('#busy').textContent = txt || 'Rechne…'; };
const tick = () => new Promise(r => setTimeout(r, 30));

// ---------- Lerntraining ----------
const num = id => parseFloat(String($(id).value).replace(',', '.')) || null;
const cmS = mm => (mm > 0.5 ? '+' : mm < -0.5 ? '−' : '±') + f2(Math.abs(mm) / 10, 1) + ' cm';
const fitFor = (kind, skip) => RP.learnFit(store.lern.filter(s => s.kind === kind && s.id !== skip).slice(-30));
function fitTxt(fit) { if (!fit.on) return fit.n ? 'Lernkorrektur noch aus (1 Rückmeldung, ab 2 aktiv)' : 'noch nichts gelernt'; return `Lernkorrektur ${cmS(fit.b)}` + (fit.a !== 1 ? ` und ${fit.a > 1 ? '+' : '−'}${f2(Math.abs(fit.a - 1) * 100, 1)} %` : '') + ` aus ${fit.n} Rückmeldungen`; }
function trend(kind) { const S = store.lern.filter(s => s.kind === kind && s.src === 'mass'); if (!S.length) return ''; const mean = L => L.reduce((t, s) => t + Math.abs(s.shown - s.real), 0) / L.length; return `<br><span class="mut">Gezeigter Wert lag im Mittel ${f2(mean(S) / 10, 1)} cm daneben` + (S.length >= 6 ? `, bei den letzten 3 ${f2(mean(S.slice(-3)) / 10, 1)} cm` : '') + ` (${S.length} nachgemessene Maße)</span>`; }
function learn(id, kind, rows) { store.lern = store.lern.filter(s => s.id !== id); for (const [raw, shown, real] of rows) { if (real) store.lern.push({ id, kind, raw: Math.round(raw), shown: Math.round(shown), real: Math.round(real), src: 'mass' }); else if (verdict === 'ok') store.lern.push({ id, kind, raw: Math.round(raw), shown: Math.round(shown), real: Math.round(shown), src: 'passt' }); } }
const tolOk = (shown, real) => Math.abs(shown - real) <= Math.max(30, 0.01 * real);

let cw = null, cf = null, mode = 'wall'; // aktuelle Wand, aktuelle Bodenmessung
function home() { show('home'); $('#ver').textContent = 'Version ' + APP_VER; const box = $('#list'); box.innerHTML = ''; $('#listCard').hidden = !store.walls.length;
  $('#lernTxt').innerHTML = `<b>Boden filmen:</b> ${fitTxt(fitFor('floor'))}${trend('floor')}<br><b>Wand mit Blättern:</b> ${fitTxt(fitFor('wall'))}${trend('wall')}`; $('#lernReset').hidden = !store.lern.length;
  store.walls.forEach(w => { const r = document.createElement('div'), fl = w.kind === 'floor'; let val, dev = '';
    if (fl) { const s = w.show; val = s ? `${f2(s.L / 1000)} × ${f2(s.B / 1000)} m` : f2(w.area) + ' m²'; const ds = s ? [[s.L, w.realL], [s.B, w.realB]].filter(p => p[1]) : []; if (ds.length) dev = ` <span class="${ds.every(p => tolOk(p[0], p[1])) ? 'good' : 'bad'}">Abw. ${ds.map(p => cmS(p[0] - p[1])).join(' / ')}</span>`; }
    else { val = m(w.L); if (w.real) dev = ` <span class="${tolOk(w.L, w.real * 10) ? 'good' : 'bad'}">Abw. ${cmS(w.L - w.real * 10)}</span>`; }
    r.className = 'wrow'; r.innerHTML = `<span><b>${esc(w.name)}</b> ${val}${dev}</span><span class="${w.verdict === 'ok' ? 'good' : w.verdict === 'no' ? 'bad' : 'mut'}">${w.verdict === 'ok' ? '✔ passt' : w.verdict === 'no' ? '✘ passt nicht' : ''}</span>`; box.appendChild(r); }); }
const countOf = kind => store.walls.filter(w => (w.kind || 'wall') === kind).length;
function newWall() { mode = 'wall'; cw = { name: 'Wand ' + (countOf('wall') + 1), views: [], locs: [], thumbs: [], result: null }; openCam(); }
$('#start').onclick = newWall;
$('#print').onclick = () => window.open('druck.html', '_blank');
$('#clear').onclick = () => { store.walls = []; save(); home(); };
$('#lernReset').onclick = () => { if (confirm('Alles Gelernte löschen? Die Messliste bleibt.')) { store.lern = []; save(); home(); } };

// ---------- Variante 1: Kamera, Fotos mit Blättern ----------
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
const endMsg = l => { const f = (l.found || []).map(i => RP.END[i]); return f.includes(0) && !f.includes(1) ? 'Nur das Blatt „0 cm“ gefunden, dieses Foto zählt nicht. Beide Blätter ins Bild.' : f.includes(1) && !f.includes(0) ? 'Nur das Blatt „200 cm“ gefunden, dieses Foto zählt nicht. Beide Blätter ins Bild.' : 'Keine Marken gefunden, dieses Foto zählt nicht.'; };
async function processImage(bmp) { const W = bmp.width, H = bmp.height, src = document.createElement('canvas'); src.width = W; src.height = H; const c = src.getContext('2d', { willReadFrequently: true }); c.drawImage(bmp, 0, 0); bmp.close?.(); await tick();
  const gray = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H), loc = RP.locateBest(gray, W, H); if (!loc.ok) { busy(false); grabbing = false; $('#shot').disabled = false; notice(loc.err === 'rms' ? 'Blätter liegen nicht flach, dieses Foto zählt nicht.' : endMsg(loc), 6000); if (DEMO) camInfo(); else openCam(); return; }
  await tick(); cw.views.push(RP.viewMap(gray, W, H, loc)); cw.locs.push({ H: loc.H, rms: loc.rms, ids: loc.ids, W, H }); cw.thumbs.push(thumb(src, 800)); cw.result = RP.wallFromViews(cw.views); busy(false); grabbing = false; $('#shot').disabled = false; navigator.vibrate?.(40); camInfo(); if (!DEMO && !$('#cam').hidden) { clearInterval(scanTimer); scanTimer = setInterval(scan, 350); } }
const thumb = (cvs, w) => { const h = Math.round(w * cvs.height / cvs.width), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(cvs, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.55); };
function grayCanvas(g, W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H); for (let i = 0; i < W * H; i++) { const v = g[i]; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); return c; }

// ---------- Draufsicht ----------
function drawMap(cv, r, css) { const big = cv.id === 'bigMap', D = big ? 1 : (window.devicePixelRatio > 1 ? 2 : 1), S = big ? 840 : css * D; cv.width = S; cv.height = S; const c = cv.getContext('2d'); c.fillStyle = '#000c'; c.fillRect(0, 0, S, S); const { cell, x0, y0, n } = RP.GRID; let k = S / (cell * n), ox = 0, oy = 0;
  if (r && r.kind === 'floor' && r.outline) { const xs = r.outline.map(p => p[0]), ys = r.outline.map(p => p[1]), a = Math.min(...xs) - 500, b = Math.min(...ys) - 500, sp = Math.max(Math.max(...xs) - a, Math.max(...ys) - b) + 500; k = S / sp; ox = (a - x0) * k; oy = (b - y0) * k; }
  const T = p => [(p[0] - x0) * k - ox, (p[1] - y0) * k - oy];
  if (r && r.K) { c.fillStyle = '#6b7786'; const q = Math.max(1, Math.ceil(cell * k)); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (r.K[j * n + i]) c.fillRect(i * cell * k - ox, j * cell * k - oy, q, q); }
  if (r && r.kind === 'floor') { if (r.outline) { c.strokeStyle = '#4da3ff'; c.lineWidth = 3; c.beginPath(); r.outline.forEach((p, i) => { const q = T(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.stroke(); } if (r.rect) { c.strokeStyle = '#ffd166'; c.lineWidth = 4; c.beginPath(); r.rect.corners.forEach((p, i) => { const q = T(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.stroke(); } if (r.path) { c.strokeStyle = '#3ecf74'; c.lineWidth = 2; c.beginPath(); r.path.forEach((p, i) => { const q = T(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); } return; }
  c.strokeStyle = '#ffd166'; c.lineWidth = 3 * D; c.beginPath(); c.moveTo(...T([0, 13])); c.lineTo(...T([2000, 13])); c.stroke(); if (r && r.ok) { const a = T(r.a), b = T(r.b); c.lineWidth = 4 * D; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); [[a, r.leftOk], [b, r.rightOk]].forEach(([p, ok]) => { c.fillStyle = ok ? '#3ecf74' : '#ff5a5a'; c.beginPath(); c.arc(p[0], p[1], 7 * D, 0, 7); c.fill(); }); } }

// ---------- Variante 2: Bodenfläche filmen ----------
$('#startAR').onclick = () => { if (store.lens) $('#lensMm').value = store.lens; show('ref'); };
$('#refBack').onclick = home;
$('#refGo').onclick = async () => { const cm = parseFloat($('#refCm').value) || null; if (DEMO) return demoAR(cm); if (!(await ARF.supported())) { notice('Dieses Handy oder dieser Browser kann die Bewegung nicht verfolgen (ARCore in Chrome nötig).', 9000); return; } const lens = Math.min(170, Math.max(60, parseFloat($('#lensMm').value) || 118)); store.lens = lens; save(); ARF.start({ refCm: cm, onFloor: $('#refFloor').checked, lensMm: lens }, onAR); };
async function demoAR(cm) { busy(true, 'Lade Testaufnahme…'); await tick(); const L = await (await fetch('demo/ar.json')).json(), frames = []; for (const f of L.frames) { const bmp = await createImageBitmap(await (await fetch('demo/' + f.img)).blob()), W = 960, H = Math.round(960 * bmp.height / bmp.width), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, W, H); frames.push({ g: RP.grayFrom(x.getImageData(0, 0, W, H).data, W, H), W, H, M: Float32Array.from(f.M), P: Float32Array.from(f.P) }); } window.__truth = L.truth; onAR({ frames, floorY: 0, floorSrc: 'test', hits: 0, ref: cm ? { real: cm * 10, meas: cm * 10 / 1.012 } : null, secs: 0 }); }
async function onAR(raw) { if (raw.err) { busy(false); if (raw.err !== 'abbruch') notice(raw.err === 'noar' ? 'AR konnte nicht starten: ' + (raw.msg || '') + ' Kamerazugriff für AR erlauben und nochmal versuchen.' : raw.err === 'noboden' ? 'Der Boden wurde nicht erkannt. Beim Filmen das Handy schräg nach unten halten.' : 'Es kamen keine Kamerabilder an. Dieses Handy liefert im AR-Modus kein Bild an die App.', 10000); home(); return; }
  try { await computeFloor(raw); } catch (e) { busy(false); notice('Rechenfehler: ' + e.message, 9000); home(); } }
async function computeFloor(raw) { busy(true, 'Rechne…'); await tick(); const F = raw.frames, x0 = F.reduce((s, f) => s + f.M[12], 0) / F.length, z0 = F.reduce((s, f) => s + f.M[14], 0) / F.length, fy = raw.floorY, foot = f => [(f.M[12] - x0) * 1000 + 1000, (f.M[14] - z0) * 1000 + 147];
  const view = (f, flip) => RP.viewMapPose(f.pyr || (f.pyr = RP.pyramid(f.g, f.W, f.H)), RP.poseHi(f.M, f.P, fy, x0, z0, f.W, f.H, flip), f.P[0] * f.W / 2, foot(f));
  // Gegenprobe: steht das Kamerabild richtig herum? Nachbarbilder müssen am Boden zusammenpassen.
  let n0 = 0, n1 = 0, np = 0; const stepP = Math.max(1, Math.floor(F.length / 5)); for (let i = 0; i + 1 < F.length && np < 5; i += stepP) { const a = RP.nccViews(view(F[i], false), view(F[i + 1], false)), b = RP.nccViews(view(F[i], true), view(F[i + 1], true)); if (a !== null && b !== null) { n0 += a; n1 += b; np++; } await tick(); }
  const flip = np > 0 && n1 / np > n0 / np + 0.2, acc = RP.accNew(), bilder = [];
  for (let i = 0; i < F.length; i++) { const f = F[i]; RP.accAdd(acc, view(f, flip)); bilder.push({ M: Array.from(f.M, v => +v.toFixed(5)), P: [f.P[0], f.P[5], f.P[8], f.P[9]].map(v => +v.toFixed(5)), W: f.W, H: f.H, t: f.t, jpg: thumb(grayCanvas(f.g, f.W, f.H), 640) }); f.pyr = null; f.g = null; $('#busy').textContent = `Rechne… ${i + 1} von ${F.length}`; await tick(); }
  const r = RP.floorFromAcc(acc, [1000, 147]), kRaw = raw.ref ? raw.ref.real / raw.ref.meas : 1, kW = raw.ref ? RP.refWeight(raw.ref.real) : 0, k = 1 + kW * (kRaw - 1); r.kind = 'floor'; r.path = F.map(foot);
  cf = { name: 'Boden ' + (countOf('floor') + 1), r, k, kRaw, kW, n: F.length, floorY: fy, floorSrc: raw.floorSrc, floorHit: raw.floorHit, floorTap: raw.floorTap, refRot: raw.refRot, refDy: raw.refDy, lensMm: raw.lensMm, full: raw.full, hits: raw.hits, flip, ncc: np ? [+(n0 / np).toFixed(3), +(n1 / np).toFixed(3)] : null, ref: raw.ref, secs: raw.secs, lost: raw.lost, bilder, area: r.ok ? r.area * k * k / 1e6 : null, rect: r.ok && r.rect ? { L: Math.max(r.rect.L, r.rect.B) * k, B: Math.min(r.rect.L, r.rect.B) * k, area: r.rect.area * k * k / 1e6 } : null };
  busy(false); showFloor(); }
function showFloor() { mode = 'floor'; show('res'); verdict = null; manual = false; resetVerdict(); const r = cf.r; $('#resName').textContent = cf.name; $('#realLab').textContent = 'Echte Länge in cm (längere Seite)'; $('#real').placeholder = 'z. B. 462'; $('#mapCap').textContent = 'Grau der erkannte Boden, blau sein Umriss, gelb das Rechteck, grün dein Weg.'; $('#more').hidden = true; $('#next').textContent = 'Nochmal filmen'; $('#real2Box').hidden = false; cf.show = null;
  const sc = cf.ref ? `Referenz ${f2(cf.ref.real / 10, 0)} cm: Handy lag ${f2(Math.abs(1 / cf.kRaw - 1) * 100, 1)} % ${cf.kRaw < 1 ? 'zu groß' : 'zu klein'}, zählt zu ${Math.round(cf.kW * 100)} %` : 'ohne Referenz', dH = cf.floorTap != null && cf.floorHit != null ? (cf.floorTap - cf.floorHit) * 100 : null;
  const bod = cf.floorSrc === 'aufsetzer' ? 'Bodenhöhe aus dem Aufsetzen des Handys' + (dH !== null ? ` (Bodenerkennung des Handys weicht ${f2(Math.abs(dH), 1)} cm ab)` : '') : cf.floorSrc === 'treffer' ? 'Bodenhöhe aus der Bodenerkennung des Handys' + (dH !== null ? ` (Aufsetzen wich ${f2(Math.abs(dH), 1)} cm ab und wurde verworfen)` : '') : '';
  const tail = `${cf.n} Bilder · ${sc}` + (bod ? '<br>' + bod : '') + (cf.full ? '<br><span class="warn">Bildgrenze erreicht. Wenn noch nicht der ganze Boden gefilmt war, bitte zügiger nochmal.</span>' : '') + (cf.floorSrc === 'geschätzt' ? '<br><span class="warn">Bodenhöhe nur geschätzt, Ergebnis unsicher</span>' : '');
  if (r.ok && cf.rect) { const rect = cf.rect, fit = cf.fit = fitFor('floor', cf.rec && cf.rec.t), L = RP.learnApply(fit, rect.L), B = RP.learnApply(fit, rect.B), q = L * B / (rect.L * rect.B), useRect = Math.abs(rect.area - cf.area) / rect.area < 0.12; cf.show = { L, B, area: L * B / 1e6, umriss: cf.area * q }; cf.head = useRect ? cf.show.area : cf.show.umriss; cf.headSrc = useRect ? 'rechteck' : 'umriss';
    $('#resCap').textContent = 'Errechnete Länge × Breite'; $('#resLen').textContent = `${f2(L / 1000)} × ${f2(B / 1000)} m`; $('#realBox').hidden = false;
    $('#resInfo').innerHTML = `Fläche <b>${f2(cf.head)} m²</b>` + (useRect ? '' : ` nach Umriss, als Rechteck ${f2(cf.show.area)} m²`) + '<br>' + (fit.on ? `ohne Lernkorrektur ${f2(rect.L / 1000)} × ${f2(rect.B / 1000)} m<br>` : '') + fitTxt(fit).replace(/^./, c => c.toUpperCase()) + '<br>' + tail; }
  else if (r.ok) { cf.fit = null; cf.head = cf.area; cf.headSrc = 'umriss'; $('#resCap').textContent = 'Errechnete Bodenfläche'; $('#resLen').textContent = f2(cf.area) + ' m²'; $('#realBox').hidden = true; $('#resInfo').innerHTML = 'Kein Rechteck erkannt, deshalb nur die Fläche nach Umriss.<br>' + tail; }
  else { $('#resCap').textContent = 'Errechnete Bodenfläche'; $('#resLen').textContent = '—'; $('#realBox').hidden = true; $('#resInfo').textContent = 'Zu wenig Boden erkannt. Bitte nochmal filmen und den Boden bis zu jeder Wand zeigen.'; }
  drawMap($('#bigMap'), r); }

// ---------- Ergebnis und Rückmeldung ----------
let verdict = null, manual = false;
function resetVerdict() { $('#vOk').classList.remove('sel'); $('#vNo').classList.remove('sel'); $('#real').value = ''; $('#real2').value = ''; $('#diff').textContent = ''; $('#lernNow').textContent = ''; }
function showResult() { mode = 'wall'; show('res'); verdict = null; manual = false; resetVerdict(); $('#resName').textContent = cw.name; $('#resCap').textContent = 'Errechnete Wandlänge'; $('#realLab').textContent = 'Echte Wandlänge in cm'; $('#real').placeholder = 'z. B. 412,5'; $('#mapCap').textContent = 'Gelb die erkannte Wand, Punkte die Wandenden, kurzer Strich der Zollstock.'; $('#more').hidden = false; $('#next').textContent = 'Nächste Wand'; $('#real2Box').hidden = true; const r = cw.result;
  if (r && r.ok) { const fit = cw.fit = fitFor('wall', cw.rec && cw.rec.t); cw.shown = RP.learnApply(fit, r.L); $('#realBox').hidden = false; $('#resLen').textContent = m(cw.shown); const un = [!r.leftOk && 'linkes', !r.rightOk && 'rechtes'].filter(Boolean); $('#resInfo').innerHTML = (fit.on ? `ohne Lernkorrektur ${m(r.L)}<br>` : '') + fitTxt(fit).replace(/^./, c => c.toUpperCase()) + `<br>${r.n} Fotos` + (un.length ? ` · ${un.join(' und ')} Ende nur geschätzt` : ''); }
  else { $('#realBox').hidden = true; $('#resLen').textContent = '—'; $('#resInfo').textContent = 'Keine Wand erkannt. Noch ein Foto mit mehr Boden an der Wand.'; } drawMap($('#bigMap'), r); }
function record() { let real = num('#real'), real2 = num('#real2');
  if (mode === 'floor') { if (!cf || !cf.r.ok) return null; let w = cf.rec; if (!w || !store.walls.includes(w)) { w = cf.rec = { kind: 'floor', name: cf.name, t: Date.now() }; store.walls.push(w); } let rL = real ? real * 10 : null, rB = real2 ? real2 * 10 : null; if (rL && rB && rB > rL) [rL, rB] = [rB, rL];
    Object.assign(w, { area: cf.head, headSrc: cf.headSrc, umriss: cf.area, rect: cf.rect, show: cf.show, fit: cf.fit, k: cf.k, kRaw: cf.kRaw, kW: cf.kW, n: cf.n, floorY: cf.floorY, floorSrc: cf.floorSrc, floorHit: cf.floorHit, floorTap: cf.floorTap, refRot: cf.refRot, refDy: cf.refDy, lensMm: cf.lensMm, full: cf.full, hits: cf.hits, flip: cf.flip, ncc: cf.ncc, ref: cf.ref, secs: cf.secs, lost: cf.lost, verdict, realL: rL, realB: rB, bilder: cf.bilder }); learn(w.t, 'floor', cf.show ? [[cf.rect.L, cf.show.L, rL], [cf.rect.B, cf.show.B, rB]] : []); save(); return w; }
  if (!cw || !cw.result || !cw.result.ok) return null; let w = cw.rec; if (!w || !store.walls.includes(w)) { w = cw.rec = { kind: 'wall', name: cw.name, t: Date.now() }; store.walls.push(w); } Object.assign(w, { L: cw.shown, rawL: cw.result.L, fit: cw.fit, n: cw.result.n, leftOk: cw.result.leftOk, rightOk: cw.result.rightOk, dist: cw.result.dist, a: cw.result.a, b: cw.result.b, locs: cw.locs, verdict, real, thumbs: cw.thumbs }); learn(w.t, 'wall', [[cw.result.L, cw.shown, real ? real * 10 : null]]); save(); return w; }
// Zeigt die Abweichung je Maß, setzt Passt / Passt nicht aus den Maßen (solange nicht von Hand gewählt) und den neuen Lernstand.
function feedback() { let real = num('#real'), real2 = num('#real2'), rows = [];
  if (mode === 'floor' && cf && cf.show) { let rL = real ? real * 10 : null, rB = real2 ? real2 * 10 : null; if (rL && rB && rB > rL) [rL, rB] = [rB, rL]; rows = [['Länge', cf.rect.L, cf.show.L, rL], ['Breite', cf.rect.B, cf.show.B, rB]]; }
  else if (mode === 'wall' && cw && cw.result && cw.result.ok) rows = [['Wand', cw.result.L, cw.shown, real ? real * 10 : null]];
  const got = rows.filter(r => r[3]); $('#diff').innerHTML = got.map(r => `<div class="${tolOk(r[2], r[3]) ? 'good' : 'bad'}">${r[0]}: App ${Math.abs(r[2] - r[3]) < 5 ? 'genau richtig' : f2(Math.abs(r[2] - r[3]) / 10, 1) + ' cm ' + (r[2] > r[3] ? 'zu groß' : 'zu klein')} ${tolOk(r[2], r[3]) ? '✔' : '✘'}` + (RP.learnUsable({ raw: r[1], real: r[3] }) ? '' : ' <span class="warn">zu weit daneben, wird nicht gelernt</span>') + '</div>').join('');
  if (got.length && !manual) { verdict = got.every(r => tolOk(r[2], r[3])) ? 'ok' : 'no'; $('#vOk').classList.toggle('sel', verdict === 'ok'); $('#vNo').classList.toggle('sel', verdict === 'no'); }
  const w = record(); if (!w) return; const kind = mode === 'floor' ? 'floor' : 'wall', mine = store.lern.filter(s => s.id === w.t);
  $('#lernNow').textContent = mine.length ? 'Gespeichert. Neuer Lernstand: ' + fitTxt(fitFor(kind)) + (mine[0].src === 'passt' ? ' (ohne echtes Maß zählt der gezeigte Wert als richtig)' : '') : verdict === 'no' ? 'Zum Lernen bitte das echte Maß eintragen.' : ''; }
$('#vOk').onclick = () => { verdict = 'ok'; manual = true; $('#vOk').classList.add('sel'); $('#vNo').classList.remove('sel'); feedback(); };
$('#vNo').onclick = () => { verdict = 'no'; manual = true; $('#vNo').classList.add('sel'); $('#vOk').classList.remove('sel'); feedback(); };
$('#real').oninput = $('#real2').oninput = feedback;
$('#more').onclick = openCam;
$('#next').onclick = () => { record(); if (mode === 'floor') show('ref'); else newWall(); };
$('#toHome').onclick = () => { record(); home(); };
$('#send').onclick = async () => { const out = { app: APP_VER, device: navigator.userAgent, datum: new Date().toISOString(), lern: store.lern, walls: store.walls }, name = `fall-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.txt`, file = new File([JSON.stringify(out)], name, { type: 'text/plain' });
  // Chrome am Handy teilt nur bestimmte Dateiarten, .json gehört nicht dazu. Deshalb geht die Messung als Textdatei hinaus.
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); notice('Im Teilen-Menü „Drive“ wählen und im Ordner „Raumplan-Dev“ speichern.', 8000); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); notice('Teilen ging nicht. Die Datei „' + name + '“ liegt jetzt im Download-Ordner des Handys. Bitte von dort in Drive „Raumplan-Dev“ hochladen.', 14000); };
home();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
