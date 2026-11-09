'use strict';
/* Raumplan neu – Bedienung: je Wand ein Foto, Zollstock und Wandecken im selben Bild. */
const APP_VER = 'neu 1';
const $ = s => document.querySelector(s), SCR = ['home', 'setup', 'guide', 'cam', 'rev', 'res'];
const f2 = (v, d = 2) => v.toFixed(d).replace('.', ',');
const m = mm => f2(mm / 1000) + ' m';
const LS = 'raumplan-neu-v1';
const store = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
store.rooms = store.rooms || [];
const save = () => { try { localStorage.setItem(LS, JSON.stringify({ rooms: store.rooms, skirt: store.skirt, seen: store.seen })); } catch (e) { notice('Speicher voll – ältere Räume löschen.'); } };
function show(id) { SCR.forEach(s => { $('#' + s).hidden = s !== id; }); window.scrollTo(0, 0); }
let nTimer = 0; function notice(t, ms = 5000) { const n = $('#notice'); n.textContent = t; n.hidden = false; clearTimeout(nTimer); nTimer = setTimeout(() => { n.hidden = true; }, ms); }
const busy = on => { $('#busy').hidden = !on; };
const tick = () => new Promise(r => setTimeout(r, 30));

// ---------- Übersicht ----------
let cur = null; // {name, shape, walls:[{L, sig, ...}], k}
function home() { show('home'); $('#ver').textContent = 'Version ' + APP_VER; const box = $('#rooms'); box.innerHTML = '';
  store.rooms.forEach((r, i) => { const b = document.createElement('button'); b.className = 'room'; const rr = solveRoom(r); b.innerHTML = `<span><b>${esc(r.name)}</b><br><span class="mut">${rr ? dims(r, rr) : 'unvollständig'}</span></span><span class="mut">${rr ? f2(rr.area) + ' m²' : ''}</span>`; b.onclick = () => { cur = JSON.parse(JSON.stringify(r)); cur.saved = i; showResult(); }; box.appendChild(b); }); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dims = (r, rr) => r.shape === 'rect' ? `${m(rr.breite)} × ${m(rr.tiefe)}` : `${r.walls.length} Wände`;

$('#newRoom').onclick = () => { $('#rName').value = 'Raum ' + (store.rooms.length + 1); show(store.seen ? 'setup' : 'guide'); };
$('#howto').onclick = () => show('guide');
$('#guideGo').onclick = () => { store.seen = 1; save(); if ($('#rName').value) show('setup'); else home(); };
$('#setupBack').onclick = home;
$('#print').onclick = () => window.open('druck.html', '_blank');
$('#shapeRect').onclick = () => startRoom('rect');
$('#shapeFree').onclick = () => startRoom('free');
function startRoom(shape) { cur = { name: $('#rName').value.trim() || 'Raum', shape, walls: [], ctrl: {} }; wallIdx = 0; openCam(); }

// ---------- Kamera ----------
let stream = null, track = null, wallIdx = 0, scanTimer = 0, stable = 0, lastC = null, autoOn = true, grabbing = false, secondFor = null, armed = true, goneSince = 0;
const scanCv = document.createElement('canvas');
const wallLabel = () => cur.shape === 'rect' ? `Wand ${wallIdx + 1} von 4` : `Wand ${wallIdx + 1}`;
async function openCam() { show('cam'); stable = 0; lastC = null; grabbing = false; setPills(null); armed = cur.walls.length === 0 && secondFor === null; goneSince = 0;
  $('#camTxt').textContent = secondFor !== null ? `Zollstock nicht bewegen. Jetzt die ${secondFor === 'a' ? 'linke' : 'rechte'} Ecke ins Bild.` : `${wallLabel()}: Zollstock mittig an die Wand. Beide Blätter und beide Ecken ins Bild.`;
  if (/[?&]demo/.test(location.search)) { $('#pick').textContent = 'Testfoto'; return; }
  try { document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch(() => { }); } catch (e) { }
  if (!stream || !stream.active) { try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 4096 }, height: { ideal: 3072 } } }); track = stream.getVideoTracks()[0]; }
    catch (e) { $('#camTxt').textContent = 'Kamera nicht verfügbar – bitte „Foto-App“ benutzen.'; return; } }
  $('#vid').srcObject = stream; await $('#vid').play().catch(() => { }); clearInterval(scanTimer); scanTimer = setInterval(scan, 300);
}
function closeCam() { clearInterval(scanTimer); if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => { }); }
function setPills(res) { const ends = res && res.ok ? new Set(res.ids.map(i => RP.END[i])) : res && res.found ? new Set(res.found.map(i => RP.END[i])) : new Set(); $('#p0').classList.toggle('on', ends.has(0)); $('#p1').classList.toggle('on', ends.has(1)); }
function scan() { const v = $('#vid'); if (grabbing || !v.videoWidth) return; const W = 1280, H = Math.round(W * v.videoHeight / v.videoWidth); scanCv.width = W; scanCv.height = H; const c = scanCv.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0, W, H); const g = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H), loc = RP.locate(RP.findQuads(g, W, H, { maxW: W })); setPills(loc);
  const ready = loc.ok && loc.ids.length === 4 && loc.rms < 2; if (ready) { const pts = loc.pts.map(q => q.px).flat(); const move = lastC ? Math.max(...pts.map((x, i) => Math.abs(x - lastC[i]))) : 99; lastC = pts; stable = move < 5 ? stable + 1 : 0; } else { stable = 0; lastC = null; }
  if (!loc.ok || loc.ids.length < 2) { goneSince = goneSince || Date.now(); if (Date.now() - goneSince > 500) armed = true; } else goneSince = 0;
  $('#pRuh').hidden = !(ready && autoOn && armed); if (autoOn && armed && stable >= 3) capture(); }
async function capture() { if (grabbing) return; grabbing = true; clearInterval(scanTimer); $('#shot').disabled = true; busy(true); await tick();
  try { let bmp = null; if (typeof ImageCapture !== 'undefined' && track) { try { const ic = new ImageCapture(track); const cap = await ic.getPhotoCapabilities().catch(() => null); const opt = cap && cap.imageWidth ? { imageWidth: cap.imageWidth.max, imageHeight: cap.imageHeight.max } : {}; bmp = await createImageBitmap(await Promise.race([ic.takePhoto(opt), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitlimit')), 7000))])); } catch (e) { bmp = null; } }
    if (!bmp) { const v = $('#vid'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); bmp = await createImageBitmap(c); }
    await processImage(bmp); } catch (e) { busy(false); notice('Aufnahme fehlgeschlagen: ' + e.message); $('#shot').disabled = false; grabbing = false; openCam(); }
}
$('#shot').onclick = capture;
$('#auto').onclick = () => { autoOn = !autoOn; $('#auto').classList.toggle('on', autoOn); $('#auto').textContent = 'Automatik ' + (autoOn ? 'an' : 'aus'); stable = 0; };
$('#camClose').onclick = () => { closeCam(); cur && cur.walls.length ? showResult() : home(); };
$('#pick').onclick = () => { if (/[?&]demo/.test(location.search)) demoShot(); else $('#file').click(); };
$('#file').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; busy(true); await tick(); try { await processImage(await createImageBitmap(f)); } catch (x) { busy(false); notice('Foto konnte nicht gelesen werden.'); } };
let demoN = 0; async function demoShot() { busy(true); await tick(); const name = `demo/s${String(demoN++ % 8).padStart(3, '0')}`; const b = await (await fetch(name + '.jpg')).blob(); window.__truth = await (await fetch(name + '.json')).json(); await processImage(await createImageBitmap(b)); }

// ---------- Auswerten ----------
let P = null, P2 = null; // aktuelles Foto {src canvas, gray, W, H, loc, a, b}
async function processImage(bmp) {
  const W = bmp.width, H = bmp.height, src = document.createElement('canvas'); src.width = W; src.height = H; const c = src.getContext('2d', { willReadFrequently: true }); c.drawImage(bmp, 0, 0); bmp.close?.(); await tick();
  const gray = RP.grayFrom(c.getImageData(0, 0, W, H).data, W, H); const loc = RP.locate(RP.findQuads(gray, W, H));
  busy(false); grabbing = false; $('#shot').disabled = false;
  if (!loc.ok) { notice(loc.err === 'rms' ? 'Blätter liegen nicht flach oder Zollstock nicht ganz offen. Bitte neu.' : endMsg(loc), 7000); openCam(); return; }
  if (loc.ids.length < 2 || new Set(loc.ids.map(i => RP.END[i])).size < 2) { notice('Es muss von beiden Blättern etwas im Bild sein.', 7000); openCam(); return; }
  const photo = { src, gray, W, H, loc, a: null, b: null };
  if (secondFor !== null) { photo.single = secondFor; const s = RP.suggestCorners(gray, W, H, loc); photo[secondFor] = secondFor === 'a' ? s.a : s.b; P2 = photo; }
  else { P = photo; P2 = null; const s = RP.suggestCorners(gray, W, H, loc); photo.a = clampPt(s.a, W, H); photo.b = clampPt(s.b, W, H); const sn = RP.snapBase(gray, W, H, photo.a, photo.b, 22); if (sn) { photo.a = sn.a; photo.b = sn.b; } }
  closeCam(); openReview();
}
const endMsg = l => { const f = (l.found || []).map(i => RP.END[i]); return f.includes(0) ? 'Nur das Blatt „0 cm“ gefunden. Weiter zurück, bis beide Blätter im Bild sind.' : f.includes(1) ? 'Nur das Blatt „200 cm“ gefunden. Weiter zurück, bis beide Blätter im Bild sind.' : 'Keine Marken gefunden. Die Blätter müssen flach liegen, im Bild und scharf sein.'; };
const clampPt = (p, W, H) => [Math.max(8, Math.min(W - 8, p[0])), Math.max(8, Math.min(H - 8, p[1]))];

// ---------- Prüfen: Punkte ziehen ----------
const cv = $('#cv'); let view = null, base = null, drag = null, loupe = null;
function openReview() { show('rev'); layoutCv(); redraw(); updateLen(); const need = store.skirt === undefined; $('#skirt').hidden = !need; $('#revTitle').textContent = `${cur.name}: ${wallLabel()}`; $('#revMore').hidden = secondFor !== null; }
function layoutCv() { const ph = active(), dpr = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth * dpr, Hc = cv.clientHeight * dpr; cv.width = Wc; cv.height = Hc; const s = Math.min(Wc / ph.W, Hc / ph.H), ox = (Wc - ph.W * s) / 2, oy = (Hc - ph.H * s) / 2; view = { s, ox, oy, dpr }; base = document.createElement('canvas'); base.width = Wc; base.height = Hc; const b = base.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, Wc, Hc); b.imageSmoothingQuality = 'high'; b.drawImage(ph.src, ox, oy, ph.W * s, ph.H * s); }
const active = () => P2 || P;
const toS = p => [p[0] * view.s + view.ox, p[1] * view.s + view.oy];
const toI = (x, y) => [(x - view.ox) / view.s, (y - view.oy) / view.s];
function handles() { const ph = active(); return ph.single ? [[ph.single, ph[ph.single]]] : [['a', ph.a], ['b', ph.b]]; }
function redraw() { const c = cv.getContext('2d'), ph = active(); c.drawImage(base, 0, 0); c.lineWidth = 2 * view.dpr;
  const bySheet = {}; ph.loc.pts.forEach(q => { (bySheet[q.id] = bySheet[q.id] || []).push(q.px); }); c.strokeStyle = '#3ecf74'; Object.values(bySheet).forEach(q => { c.beginPath(); q.forEach((p, i) => { const s = toS(p); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); c.stroke(); });
  const H = handles(); if (H.length === 2) { const a = toS(H[0][1]), b = toS(H[1][1]); c.strokeStyle = '#ffd166'; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]); }
  for (const [n, p] of H) { const s = toS(p), r = 15 * view.dpr; c.strokeStyle = '#ff3b3b'; c.lineWidth = 2.5 * view.dpr; c.beginPath(); c.arc(s[0], s[1], r, 0, 7); c.moveTo(s[0] - r - 8, s[1]); c.lineTo(s[0] + r + 8, s[1]); c.moveTo(s[0], s[1] - r - 8); c.lineTo(s[0], s[1] + r + 8); c.stroke(); c.fillStyle = '#fff'; c.font = `bold ${14 * view.dpr}px sans-serif`; c.fillText(n === 'a' ? 'L' : 'R', s[0] + r + 6, s[1] - r - 2); }
  if (drag) { const ph2 = active(), p = ph2[drag.n], R = 95 * view.dpr, mx = R + 12, my = R + 12 + 60 * view.dpr, zm = 5, sx = p[0] - R / zm, sy = p[1] - R / zm, flip = toS(p)[0] < cv.width / 2 && toS(p)[1] < cv.height * .55 ? cv.width - 2 * R - 24 : 12; c.save(); c.beginPath(); c.arc(flip + R, my, R, 0, 7); c.clip(); c.fillStyle = '#000'; c.fillRect(flip, my - R, 2 * R, 2 * R); c.drawImage(ph2.src, sx, sy, 2 * R / zm, 2 * R / zm, flip, my - R, 2 * R, 2 * R); c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 2 * view.dpr; c.beginPath(); c.arc(flip + R, my, R, 0, 7); c.moveTo(flip + R - 18 * view.dpr, my); c.lineTo(flip + R + 18 * view.dpr, my); c.moveTo(flip + R, my - 18 * view.dpr); c.lineTo(flip + R, my + 18 * view.dpr); c.stroke(); }
}
function currentMeasure() { const A = P, B = P2 || P, a = secondFor === 'a' && P2 ? B.a : A.a, b = secondFor === 'b' && P2 ? B.b : A.b, fa = RP.toFloor(secondFor === 'a' && P2 ? B.loc : A.loc, a), fb = RP.toFloor(secondFor === 'b' && P2 ? B.loc : A.loc, b), raw = Math.hypot(fa[0] - fb[0], fa[1] - fb[1]), sk = store.skirt || 0;
  let sig = RP.sigmaOf(A.loc, A.a, A.b, 40); if (P2) sig = Math.hypot(sig, RP.sigmaOf(B.loc, B.a || B.b, B.b || B.a, 40)); return { L: raw + 2 * sk, raw, sig, issues: P2 ? [] : RP.wallCheck(A.loc, A.a, A.b, sig) }; }
function updateLen() { const q = currentMeasure(); $('#revLen').textContent = `${m(q.L)}  ± ${f2(Math.max(0.5, (1.5 * q.sig + 3) / 10), 1)} cm`; $('#revWarn').textContent = q.issues.map(i => i.t).join(' '); const dis = store.skirt === undefined; $('#revOk').disabled = dis; $('#revOk').textContent = q.issues.some(i => i.k === 'kurz') ? 'Ja, stimmt so' : '✔ Stimmt'; }
function eventPos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * view.dpr, (e.clientY - r.top) * view.dpr]; }
cv.addEventListener('pointerdown', e => { const [x, y] = eventPos(e); let best = null, bd = 90 * view.dpr; for (const [n, p] of handles()) { const s = toS(p), d = Math.hypot(s[0] - x, s[1] - y); if (d < bd) { bd = d; best = n; } } if (!best) return; const s = toS(active()[best]); drag = { n: best, off: [s[0] - x, s[1] - y] }; try { cv.setPointerCapture(e.pointerId); } catch (x) { } redraw(); });
cv.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = eventPos(e), ph = active(); ph[drag.n] = clampPt(toI(x + drag.off[0], y + drag.off[1]), ph.W, ph.H); redraw(); });
cv.addEventListener('pointerup', () => { if (!drag) return; drag = null; const ph = active(); if (!ph.single) { const sn = RP.snapBase(ph.gray, ph.W, ph.H, ph.a, ph.b, 12); if (sn) { ph.a = sn.a; ph.b = sn.b; } } redraw(); updateLen(); });
window.addEventListener('resize', () => { if (!$('#rev').hidden) { layoutCv(); redraw(); } });
document.querySelectorAll('#skirt button').forEach(b => b.onclick = () => { store.skirt = +b.dataset.v; save(); document.querySelectorAll('#skirt button').forEach(q => q.classList.toggle('sel', q === b)); setTimeout(() => { $('#skirt').hidden = true; }, 200); updateLen(); });
$('#revRedo').onclick = () => { secondFor = null; P2 = null; openCam(); };
$('#revMore').onclick = () => { const r = confirm('Welche Ecke fehlt im Bild?\nOK = linke, Abbrechen = rechte') ? 'a' : 'b'; secondFor = r; openCam(); };
$('#revOk').onclick = () => { if (store.skirt === undefined) return; const q = currentMeasure(); const rec = { L: q.L, raw: q.raw, sig: q.sig, skirt: store.skirt || 0, warn: q.issues.map(i => i.k), loc: snapLoc(P.loc), a: P.a, b: P.b, W: P.W, H: P.H, thumb: thumb(P.src), second: P2 ? { loc: snapLoc(P2.loc), a: P2.a, b: P2.b, thumb: thumb(P2.src) } : null, t: Date.now() }; if (cur.walls[wallIdx]) cur.walls[wallIdx] = rec; else cur.walls.push(rec); wallIdx = cur.walls.length; secondFor = null; P2 = null; nextWall(); };
const snapLoc = l => ({ H: l.H, rms: l.rms, edge: l.edge, ids: l.ids, pts: l.pts.map(q => ({ px: q.px, mm: q.mm })) });
const thumb = cvs => { const w = 1200, h = Math.round(w * cvs.height / cvs.width), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(cvs, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.6); };
function nextWall() { if (cur.shape === 'rect') { if (cur.walls.length >= 4) showResult(); else openCam(); } else askTurn(); }
function askTurn() { showResult(true); }

// ---------- Ergebnis ----------
function solveRoom(r) { const w = r.walls.map(q => q.L); if (r.shape === 'rect') { if (w.length < 2) return null; return RP.roomRect(w); } if (w.length < 3) return null; return RP.roomOrtho(r.walls.map((q, i) => ({ L: q.L, turn: (r.turns || [])[i] || 'R' }))); }
function showResult(openWalk) { show('res'); $('#resName').textContent = cur.name; const rr = solveRoom(cur), hints = [];
  if (cur.shape === 'free' && openWalk) hints.push(`<div class="hint">Wand ${cur.walls.length} ist gespeichert. Wie geht es weiter?<div class="row" style="margin-top:8px"><button id="turnR">↱ Rechts weiter</button><button id="turnL">↰ Links weiter</button><button id="turnEnd" class="ok">Raum fertig</button></div></div>`);
  if (cur.shape === 'rect' && cur.walls.length < 4) hints.push(`<div class="hint">Noch ${4 - cur.walls.length} Wand/Wände fehlen. <button id="resNext" class="main" style="margin-top:6px">Nächste Wand</button></div>`);
  if (rr && cur.shape === 'rect') rr.diff.forEach((d, i) => { if (d !== null && d > 20) hints.push(`<div class="hint">Wand ${i + 1} und ${i + 3} weichen ${f2(d / 10, 1)} cm voneinander ab. Eine davon bitte neu messen, oder prüfen, ob der Raum wirklich rechteckig ist. <button data-redo="${i}">Wand ${i + 1} neu</button> <button data-redo="${i + 2}">Wand ${i + 3} neu</button></div>`); });
  if (rr && cur.shape === 'free' && rr.gap > 30) hints.push(`<div class="hint">Der Umriss schließt mit ${f2(rr.gap / 10, 1)} cm Lücke. Der Fehler wurde auf die Wände verteilt.</div>`);
  if (rr && cur.shape === 'rect' && rr.diff.every(d => d !== null && d <= 20)) hints.push(`<div class="hint" style="border-color:var(--ok)"><span class="good">Gegenüberliegende Wände passen zusammen (Abweichung ${f2(Math.max(...rr.diff) / 10, 1)} cm).</span></div>`);
  $('#resHint').innerHTML = hints.join('');
  $('#resHint').querySelectorAll('[data-redo]').forEach(b => b.onclick = () => { wallIdx = +b.dataset.redo; openCam(); });
  const rn = $('#resNext'); if (rn) rn.onclick = () => { wallIdx = cur.walls.length; openCam(); };
  if ($('#turnR')) { const nx = t => { cur.turns = cur.turns || []; cur.turns[cur.walls.length - 1] = t; wallIdx = cur.walls.length; openCam(); }; $('#turnR').onclick = () => nx('R'); $('#turnL').onclick = () => nx('L'); $('#turnEnd').onclick = () => { cur.turns = cur.turns || []; cur.turns[cur.walls.length - 1] = 'R'; showResult(); }; }
  $('#resMore').hidden = cur.shape === 'rect';
  $('#sketch').innerHTML = rr ? sketchSVG(cur, rr) : '<div class="mut">Mindestens zwei Wände nötig.</div>'; $('#resArea').textContent = rr ? `Fläche ${f2(rr.area)} m²` : '';
  const list = $('#wallList'); list.innerHTML = ''; cur.walls.forEach((w, i) => { const row = document.createElement('div'); row.className = 'wallrow', cur.ctrl = cur.ctrl || {}; const ct = cur.ctrl[i]; const diff = ct ? (w.L - ct * 10) : null; row.innerHTML = `<span class="name"><b>Wand ${i + 1}</b>: ${m(w.L)} <span class="mut">± ${f2(Math.max(0.5, (1.5 * w.sig + 3) / 10), 1)} cm</span>${w.warn && w.warn.length ? ' <span class="warn">⚠</span>' : ''}${diff !== null ? ` <span class="${Math.abs(diff) <= 10 ? 'good' : 'bad'}">Abw. ${f2(diff / 10, 1)} cm</span>` : ''}</span><input type="number" inputmode="decimal" step="0.1" placeholder="cm" value="${ct || ''}" aria-label="Kontrollmaß Wand ${i + 1} in cm">`; row.querySelector('input').onchange = e => { const v = parseFloat(e.target.value); if (v > 0) cur.ctrl[i] = v; else delete cur.ctrl[i]; showResult(); }; list.appendChild(row); });
}
function sketchSVG(r, rr, big) { const P0 = rr.poly, xs = P0.map(p => p[0]), ys = P0.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), Ww = Math.max(...xs) - x0, Hh = Math.max(...ys) - y0, pad = 90, s = 520 / Math.max(Ww, Hh, 1), W = Ww * s + pad * 2, H = Hh * s + pad * 2, T = p => [(p[0] - x0) * s + pad, (p[1] - y0) * s + pad], pts = P0.map(T);
  let o = `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" width="100%" style="max-height:60vh"><polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${big ? '#fff' : '#2a3a4d'}" stroke="${big ? '#000' : '#4da3ff'}" stroke-width="5"/>`; const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; o += `<text x="${cx.toFixed(0)}" y="${cy.toFixed(0)}" text-anchor="middle" font-size="22" fill="${big ? '#000' : '#fff'}">${esc(r.name)}</text>`;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = mx - cx, dy = my - cy, len = Math.hypot(dx, dy) || 1, tx = mx + dx / len * 46, ty = my + dy / len * 46 + 8, La = Math.hypot(P0[(i + 1) % P0.length][0] - P0[i][0], P0[(i + 1) % P0.length][1] - P0[i][1]); o += `<text x="${tx.toFixed(0)}" y="${ty.toFixed(0)}" text-anchor="middle" font-size="24" font-weight="700" fill="${big ? '#000' : '#ffd166'}">${f2(La / 1000)} m</text>`; }); return o + '</svg>'; }
$('#resSave').onclick = () => { const copy = JSON.parse(JSON.stringify(cur)); delete copy.saved; copy.walls.forEach(w => { delete w.thumb; if (w.second) delete w.second.thumb; }); if (cur.saved !== undefined) store.rooms[cur.saved] = copy; else { store.rooms.push(copy); cur.saved = store.rooms.length - 1; } save(); notice('Gespeichert.'); };
$('#resMore').onclick = () => { wallIdx = cur.walls.length; openCam(); };
$('#resHome').onclick = home;
$('#resPrint').onclick = () => { const rr = solveRoom(cur); if (!rr) return; const a = $('#printArea'); a.hidden = false; a.innerHTML = `<h2 style="color:#000">${esc(cur.name)}</h2>${sketchSVG(cur, rr, true)}<p style="color:#000">Fläche ${f2(rr.area)} m²</p>`; window.print(); setTimeout(() => { a.hidden = true; }, 500); };
$('#resDxf').onclick = () => { const rr = solveRoom(cur); if (!rr) return; let d = '0\nSECTION\n2\nENTITIES\n'; rr.poly.forEach((p, i) => { const q = rr.poly[(i + 1) % rr.poly.length]; d += `0\nLINE\n8\nWAND\n10\n${(p[0] / 1000).toFixed(4)}\n20\n${(p[1] / 1000).toFixed(4)}\n11\n${(q[0] / 1000).toFixed(4)}\n21\n${(q[1] / 1000).toFixed(4)}\n`; }); d += '0\nENDSEC\n0\nEOF\n'; download(new Blob([d], { type: 'application/dxf' }), cur.name + '.dxf'); };
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
$('#resSend').onclick = async () => { const out = { app: APP_VER, device: navigator.userAgent, datum: new Date().toISOString(), room: cur }; const name = `fall-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`, file = new File([JSON.stringify(out)], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } } download(file, name); };
home();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
