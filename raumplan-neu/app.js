'use strict';
/* Raumplan Versuch – zwei Varianten:
   1. Wand für Wand aus mehreren Fotos, Zollstock mit Blättern liegt im Raum.
   2. Bodenfläche filmen ohne Blätter: das Handy verfolgt seine Bewegung, ein Referenzmaß gibt den Maßstab. */
const APP_VER = 'Versuch 4';
const $ = s => document.querySelector(s), SCR = ['home', 'ref', 'cam', 'res'];
const f2 = (v, d = 2) => v.toFixed(d).replace('.', ',');
const m = mm => f2(mm / 1000) + ' m';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = 'raumplan-versuch-v1', DEMO = /[?&]demo/.test(location.search);
const store = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
store.walls = store.walls || [];
const save = () => { try { localStorage.setItem(LS, JSON.stringify({ walls: store.walls.map(w => ({ ...w, thumbs: undefined, bilder: undefined })) })); } catch (e) { } };
function show(id) { SCR.forEach(s => { $('#' + s).hidden = s !== id; }); window.scrollTo(0, 0); }
let nTimer = 0; function notice(t, ms = 5000) { const n = $('#notice'); n.textContent = t; n.hidden = false; clearTimeout(nTimer); nTimer = setTimeout(() => { n.hidden = true; }, ms); }
const busy = (on, txt) => { $('#busy').hidden = !on; $('#busy').textContent = txt || 'Rechne…'; };
const tick = () => new Promise(r => setTimeout(r, 30));

let cw = null, cf = null, mode = 'wall'; // aktuelle Wand, aktuelle Bodenmessung
function home() { show('home'); $('#ver').textContent = 'Version ' + APP_VER; const box = $('#list'); box.innerHTML = ''; $('#listCard').hidden = !store.walls.length;
  store.walls.forEach(w => { const r = document.createElement('div'), fl = w.kind === 'floor', d = !w.real ? null : fl ? (w.area / w.real - 1) * 100 : (w.L - w.real * 10) / 10, good = d !== null && Math.abs(d) <= (fl ? 3 : 3); r.className = 'wrow'; r.innerHTML = `<span><b>${esc(w.name)}</b> ${fl ? f2(w.area) + ' m²' : m(w.L)}${d !== null ? ` <span class="${good ? 'good' : 'bad'}">Abw. ${f2(d, 1)} ${fl ? '%' : 'cm'}</span>` : ''}</span><span class="${w.verdict === 'ok' ? 'good' : w.verdict === 'no' ? 'bad' : 'mut'}">${w.verdict === 'ok' ? '✔ passt' : w.verdict === 'no' ? '✘ passt nicht' : ''}</span>`; box.appendChild(r); }); }
const countOf = kind => store.walls.filter(w => (w.kind || 'wall') === kind).length;
function newWall() { mode = 'wall'; cw = { name: 'Wand ' + (countOf('wall') + 1), views: [], locs: [], thumbs: [], result: null }; openCam(); }
$('#start').onclick = newWall;
$('#print').onclick = () => window.open('druck.html', '_blank');
$('#clear').onclick = () => { store.walls = []; save(); home(); };

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
$('#startAR').onclick = () => show('ref');
$('#refBack').onclick = home;
$('#refGo').onclick = async () => { const cm = parseFloat($('#refCm').value) || null; if (DEMO) return demoAR(cm); if (!(await ARF.supported())) { notice('Dieses Handy oder dieser Browser kann die Bewegung nicht verfolgen (ARCore in Chrome nötig).', 9000); return; } ARF.start({ refCm: cm }, onAR); };
async function demoAR(cm) { busy(true, 'Lade Testaufnahme…'); await tick(); const L = await (await fetch('demo/ar.json')).json(), frames = []; for (const f of L.frames) { const bmp = await createImageBitmap(await (await fetch('demo/' + f.img)).blob()), W = 960, H = Math.round(960 * bmp.height / bmp.width), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, W, H); frames.push({ g: RP.grayFrom(x.getImageData(0, 0, W, H).data, W, H), W, H, M: Float32Array.from(f.M), P: Float32Array.from(f.P) }); } window.__truth = L.truth; onAR({ frames, floorY: 0, floorSrc: 'test', hits: 0, ref: cm ? { real: cm * 10, meas: cm * 10 / 1.012 } : null, secs: 0 }); }
async function onAR(raw) { if (raw.err) { busy(false); if (raw.err !== 'abbruch') notice(raw.err === 'noar' ? 'AR konnte nicht starten: ' + (raw.msg || '') + ' Kamerazugriff für AR erlauben und nochmal versuchen.' : raw.err === 'noboden' ? 'Der Boden wurde nicht erkannt. Beim Filmen das Handy schräg nach unten halten.' : 'Es kamen keine Kamerabilder an. Dieses Handy liefert im AR-Modus kein Bild an die App.', 10000); home(); return; }
  try { await computeFloor(raw); } catch (e) { busy(false); notice('Rechenfehler: ' + e.message, 9000); home(); } }
async function computeFloor(raw) { busy(true, 'Rechne…'); await tick(); const F = raw.frames, x0 = F.reduce((s, f) => s + f.M[12], 0) / F.length, z0 = F.reduce((s, f) => s + f.M[14], 0) / F.length, fy = raw.floorY, foot = f => [(f.M[12] - x0) * 1000 + 1000, (f.M[14] - z0) * 1000 + 147];
  const view = (f, flip) => RP.viewMapPose(f.pyr || (f.pyr = RP.pyramid(f.g, f.W, f.H)), RP.poseHi(f.M, f.P, fy, x0, z0, f.W, f.H, flip), f.P[0] * f.W / 2, foot(f));
  // Gegenprobe: steht das Kamerabild richtig herum? Nachbarbilder müssen am Boden zusammenpassen.
  let n0 = 0, n1 = 0, np = 0; const stepP = Math.max(1, Math.floor(F.length / 5)); for (let i = 0; i + 1 < F.length && np < 5; i += stepP) { const a = RP.nccViews(view(F[i], false), view(F[i + 1], false)), b = RP.nccViews(view(F[i], true), view(F[i + 1], true)); if (a !== null && b !== null) { n0 += a; n1 += b; np++; } await tick(); }
  const flip = np > 0 && n1 / np > n0 / np + 0.2, acc = RP.accNew(), bilder = [];
  for (let i = 0; i < F.length; i++) { const f = F[i]; RP.accAdd(acc, view(f, flip)); bilder.push({ M: Array.from(f.M, v => +v.toFixed(5)), P: [f.P[0], f.P[5], f.P[8], f.P[9]].map(v => +v.toFixed(5)), W: f.W, H: f.H, t: f.t, jpg: thumb(grayCanvas(f.g, f.W, f.H), 640) }); f.pyr = null; f.g = null; $('#busy').textContent = `Rechne… ${i + 1} von ${F.length}`; await tick(); }
  const r = RP.floorFromAcc(acc, [1000, 147]), k = raw.ref ? raw.ref.real / raw.ref.meas : 1; r.kind = 'floor'; r.path = F.map(foot);
  cf = { name: 'Boden ' + (countOf('floor') + 1), r, k, n: F.length, floorY: fy, floorSrc: raw.floorSrc, hits: raw.hits, flip, ncc: np ? [+(n0 / np).toFixed(3), +(n1 / np).toFixed(3)] : null, ref: raw.ref, secs: raw.secs, lost: raw.lost, bilder, area: r.ok ? r.area * k * k / 1e6 : null, rect: r.ok && r.rect ? { L: r.rect.L * k, B: r.rect.B * k, area: r.rect.area * k * k / 1e6 } : null };
  busy(false); showFloor(); }
function showFloor() { mode = 'floor'; show('res'); verdict = null; resetVerdict(); const r = cf.r; $('#resName').textContent = cf.name; $('#resCap').textContent = 'Errechnete Bodenfläche'; $('#realLab').textContent = 'Echte Fläche in m² (freiwillig)'; $('#real').placeholder = 'z. B. 16,4'; $('#mapCap').textContent = 'Grau der erkannte Boden, blau sein Umriss, gelb das Rechteck, grün dein Weg.'; $('#more').hidden = true; $('#next').textContent = 'Nochmal filmen';
  if (r.ok) { const rect = cf.rect, useRect = rect && Math.abs(rect.area - cf.area) / rect.area < 0.12, head = useRect ? rect.area : cf.area; cf.head = head; cf.headSrc = useRect ? 'rechteck' : 'umriss'; $('#resLen').textContent = f2(head) + ' m²'; const sc = cf.ref ? `Referenz: Handy lag ${f2(Math.abs(1 / cf.k - 1) * 100, 1)} % ${cf.k < 1 ? 'zu groß' : 'zu klein'}` : 'ohne Referenz'; $('#resInfo').innerHTML = (rect ? `als Rechteck ${m(rect.L)} × ${m(rect.B)} = ${f2(rect.area)} m²<br>` : '') + `Umriss ohne Möbel-Standflächen ${f2(cf.area)} m²<br>${cf.n} Bilder · ${sc}` + (cf.floorSrc === 'geschätzt' ? '<br><span class="warn">Bodenhöhe nur geschätzt, Ergebnis unsicher</span>' : ''); }
  else { $('#resLen').textContent = '—'; $('#resInfo').textContent = 'Zu wenig Boden erkannt. Bitte nochmal filmen und den Boden bis zu jeder Wand zeigen.'; }
  drawMap($('#bigMap'), r); }

// ---------- Ergebnis und Rückmeldung ----------
let verdict = null;
function resetVerdict() { $('#vOk').classList.remove('sel'); $('#vNo').classList.remove('sel'); $('#real').value = ''; $('#diff').textContent = ''; }
function showResult() { mode = 'wall'; show('res'); verdict = null; resetVerdict(); $('#resName').textContent = cw.name; $('#resCap').textContent = 'Errechnete Wandlänge'; $('#realLab').textContent = 'Echtes Maß in cm (freiwillig)'; $('#real').placeholder = 'z. B. 412,5'; $('#mapCap').textContent = 'Gelb die erkannte Wand, Punkte die Wandenden, kurzer Strich der Zollstock.'; $('#more').hidden = false; $('#next').textContent = 'Nächste Wand'; const r = cw.result; if (r && r.ok) { $('#resLen').textContent = m(r.L); const un = [!r.leftOk && 'linkes', !r.rightOk && 'rechtes'].filter(Boolean); $('#resInfo').textContent = `${r.n} Fotos` + (un.length ? ` · ${un.join(' und ')} Ende nur geschätzt` : ''); } else { $('#resLen').textContent = '—'; $('#resInfo').textContent = 'Keine Wand erkannt. Noch ein Foto mit mehr Boden an der Wand.'; } drawMap($('#bigMap'), r); }
function record() { const real = parseFloat(String($('#real').value).replace(',', '.')) || null;
  if (mode === 'floor') { if (!cf || !cf.r.ok) return null; let w = cf.rec; if (!w || !store.walls.includes(w)) { w = cf.rec = { kind: 'floor', name: cf.name, t: Date.now() }; store.walls.push(w); } Object.assign(w, { area: cf.head, headSrc: cf.headSrc, umriss: cf.area, rect: cf.rect, k: cf.k, n: cf.n, floorY: cf.floorY, floorSrc: cf.floorSrc, hits: cf.hits, flip: cf.flip, ncc: cf.ncc, ref: cf.ref, secs: cf.secs, lost: cf.lost, verdict, real, bilder: cf.bilder }); save(); return w; }
  if (!cw || !cw.result || !cw.result.ok) return null; let w = cw.rec; if (!w || !store.walls.includes(w)) { w = cw.rec = { kind: 'wall', name: cw.name, t: Date.now() }; store.walls.push(w); } Object.assign(w, { L: cw.result.L, n: cw.result.n, leftOk: cw.result.leftOk, rightOk: cw.result.rightOk, dist: cw.result.dist, a: cw.result.a, b: cw.result.b, locs: cw.locs, verdict, real, thumbs: cw.thumbs }); save(); return w; }
$('#vOk').onclick = () => { verdict = 'ok'; $('#vOk').classList.add('sel'); $('#vNo').classList.remove('sel'); record(); };
$('#vNo').onclick = () => { verdict = 'no'; $('#vNo').classList.add('sel'); $('#vOk').classList.remove('sel'); record(); };
$('#real').oninput = () => { const v = parseFloat(String($('#real').value).replace(',', '.')), D = $('#diff'); D.textContent = ''; if (v > 0) { if (mode === 'floor' && cf && cf.r.ok) { const d = (cf.head / v - 1) * 100; D.textContent = `Abweichung ${d > 0 ? '+' : ''}${f2(d, 1)} %`; D.className = Math.abs(d) <= 3 ? 'good' : 'bad'; } else if (mode === 'wall' && cw.result && cw.result.ok) { const d = cw.result.L - v * 10; D.textContent = `Abweichung ${f2(d / 10, 1)} cm`; D.className = Math.abs(d) <= 30 ? 'good' : 'bad'; } } record(); };
$('#more').onclick = openCam;
$('#next').onclick = () => { record(); if (mode === 'floor') show('ref'); else newWall(); };
$('#toHome').onclick = () => { record(); home(); };
$('#send').onclick = async () => { const out = { app: APP_VER, device: navigator.userAgent, datum: new Date().toISOString(), walls: store.walls }, name = `fall-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`, file = new File([JSON.stringify(out)], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } } const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); };
home();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
