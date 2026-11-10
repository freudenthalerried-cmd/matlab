'use strict';
/* Aufmaß AR – Ablauf: Boden → Zollstock (Maßstab) → Wände → Höhe/Fenster/Türen/Dachschrägen → Ergebnis. Keine Marken. */
const $ = s => document.querySelector(s);
const f3 = v => (+v).toFixed(3).replace('.', ','), f2 = v => (+v).toFixed(2).replace('.', ','), cm = v => Math.round(v * 100);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = v => parseFloat(String(v).replace(',', '.'));
const HKEY = 'aufmass-hist', LKEY = 'aufmass-last';
const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const TYPN = { fenster: 'Fenster', tuer: 'Tür', dg: 'Durchgang' };

/* ---------- Ergebnis aus Rohdaten (alles AR-Maße; Maßstab erst hier) ---------- */
function build(raw) {
  const Z = AM.zScale(raw.z, raw.zlen), s = Z.s * (raw.k || 1);
  const R = AM.room(raw.walls, { scale: s, scaleSig: Z.sig || 0.004, skirt: raw.skirt / 1000 });
  const out = { raw, Z, s, R, ok: R.ok, err: R.err || [], warn: R.warn || [] };
  if (!R.ok) return out;
  out.H = raw.H.length ? raw.H.reduce((a, b) => a + b, 0) / raw.H.length * s : null;
  out.ops = raw.ops.map(o => AM.opening(o.type, o.h1, o.h2, s));
  out.slopes = raw.slopes.map(q => AM.slope(q.j, q.kh * s, q.dq * s, q.hq * s, out.H || 99));
  return out;
}

/* ---------- AR ---------- */
let st = null;
const vibr = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };
async function arStart() {
  const sup = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
  if (!sup) { $('#sup').innerHTML = '<span class="warn">AR geht hier nicht.</span> Nötig: Android-Handy, Chrome, „Google Play-Dienste für AR“ installiert. Die Seite muss über https geöffnet sein.'; return; }
  const raw = { name: $('#name').value.trim() || 'Raum', zlen: num($('#zlen').value) || 2, skirt: num($('#skirt').value) || 0, z: [], walls: [{ pts: [], kinds: [] }], H: [], ops: [], slopes: [], t0: Date.now() };
  st = { raw, phase: 'floor', floorYs: [], floorY: null, zcur: [], tool: 'hoehe', cur: null, scan: false, last: null, R: null, msg: '' };
  const root = $('#ar'); root.hidden = false;
  let s;
  try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root } }); }
  catch (e) { root.hidden = true; $('#sup').innerHTML = '<span class="warn">AR konnte nicht starten: ' + esc(e.message) + '</span>'; return; }
  st.s = s;
  const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { xrCompatible: true });
  await s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
  const space = await s.requestReferenceSpace('local'), viewer = await s.requestReferenceSpace('viewer');
  let src; try { src = await s.requestHitTestSource({ space: viewer, entityTypes: ['plane'] }); } catch (e) { src = await s.requestHitTestSource({ space: viewer }); }
  s.addEventListener('end', () => { root.hidden = true; const done = st; st = null; if (done && done.R && done.R.ok) finish(done.raw); });
  const ov = $('#arCv'), ctx = ov.getContext('2d');
  const frame = (t, f) => {
    if (!st || !st.s) return; s.requestAnimationFrame(frame);
    const bl = s.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const vp = f.getViewerPose(space); if (!vp) { st.track = false; return ui(); }
    st.track = true;
    const m = vp.transform.matrix, o = [m[12], m[13], m[14]], d = [-m[8], -m[9], -m[10]]; st.o = o; st.d = d; st.view = vp.views[0];
    const r = f.getHitTestResults(src)[0], pose = r && r.getPose(space); st.hit = null;
    if (pose) { const p = pose.transform.position, q = pose.transform.orientation, ny = 1 - 2 * (q.x * q.x + q.z * q.z);
      st.hit = { p: [p.x, p.y, p.z], vert: Math.abs(ny) < 0.4, up: ny > 0.85 };
      if (st.hit.up && p.y < o[1] - 0.7) { st.floorYs.push(p.y); if (st.floorYs.length > 200) st.floorYs.shift(); const a = st.floorYs.slice().sort((x, y) => x - y); st.floorY = a[a.length >> 1]; }
    }
    if (st.phase === 'floor' && st.floorYs.length >= 25) { st.phase = 'z'; vibr(60); st.msg = ''; }
    if (st.scan && st.phase === 'walls') { const p = wallPoint(); if (p && (!st.last || Math.hypot(p.p[0] - st.last[0], p.p[1] - st.last[1]) > 0.03)) { addWallPt(p); st.last = p.p; } }
    draw(ctx, ov); ui();
  };
  s.requestAnimationFrame(frame);
  ui();
}
function target() { return st && st.o && st.floorY != null ? AM.rayFloor(st.o, st.d, st.floorY) : null; }
function wallPoint() {
  const h = st.hit;
  if (h && h.vert && Math.hypot(h.p[0] - st.o[0], h.p[2] - st.o[2]) < 6) return { p: [h.p[0], h.p[2]], kind: 'w' };
  const t = target(); if (!t || Math.hypot(t[0] - st.o[0], t[2] - st.o[2]) > 7) return null; return { p: [t[0], t[2]], kind: 'f' };
}
function addWallPt(p) { const w = st.raw.walls[st.raw.walls.length - 1]; w.pts.push(p.p); w.kinds.push(p.kind); w.floorPts = w.kinds.filter(k => k === 'f').length * 2 >= w.kinds.length; vibr(15); save(); }
const save = () => st && store(LKEY, st.raw);
function closeRoom() {
  const w = st.raw.walls; if (w[w.length - 1].pts.length < 2) w.pop();
  const Z = AM.zScale(st.raw.z, st.raw.zlen), R = AM.room(w, { scale: 1, skirt: st.raw.skirt / 1000 });
  if (!R.ok) { if (!w.length || w[w.length - 1].pts.length) w.push({ pts: [], kinds: [] }); st.msg = '⚠ ' + R.err.join(' '); vibr([80, 60, 80]); return; }
  st.R = R; st.phase = 'extra'; st.msg = `Raum geschlossen ✓ ${R.len.length} Wände, ${f2(R.area * Z.s * Z.s)} m². Jetzt Raumhöhe, Fenster, Türen, Dachschrägen.`; vibr(80); save();
}
function act() { // Hauptknopf kurz getippt
  if (!st || !st.track) return;
  const raw = st.raw;
  if (st.phase === 'z') { const t = target(); if (!t) return; st.zcur.push(t); vibr(30);
    if (st.zcur.length === 2) { raw.z.push(st.zcur); st.zcur = []; const Z = AM.zScale(raw.z, raw.zlen); st.msg = `Lage ${raw.z.length}: ${f3(Z.d[Z.d.length - 1])} m gemessen → Korrektur ${((Z.s - 1) * 100).toFixed(2).replace('.', ',')} %${raw.z.length > 1 ? `, Streuung ${Math.round(Z.spread * 1000)} mm` : ''}. ${raw.z.length < 3 ? 'Zollstock in andere Richtung umlegen und noch einmal – oder „Weiter“.' : '„Weiter“ zu den Wänden.'}`; save(); }
    return; }
  if (st.phase === 'walls') { const p = wallPoint(); if (p) addWallPt(p); else st.msg = 'Kein Boden unter dem Fadenkreuz – etwas näher hingehen.'; return; }
  if (st.phase === 'extra') {
    const h = AM.pickWall(st.o, st.d, st.R, st.floorY); if (!h) { st.msg = 'Fadenkreuz trifft keine gemessene Wand.'; return; }
    if (st.tool === 'hoehe') { raw.H.push(h.y); st.msg = `Raumhöhe ${f3(h.y * AM.zScale(raw.z, raw.zlen).s)} m ✓ (${raw.H.length}×). Gern noch an einer anderen Stelle.`; vibr(40); }
    else if (st.tool === 'schraege') {
      if (!st.cur) { st.cur = { j: h.i, kh: h.y }; st.msg = `Kniestock an Wand ${h.i + 1}: ${f3(h.y * sc())} m ✓ – jetzt auf der <b>Seitenwand</b> einen Punkt <b>oben an der Schräge</b> anzielen (möglichst weit oben, z. B. Knick zur Decke).`; vibr(30); }
      else { const P = st.R.P, n = P.length, dq = AM.distLine([h.p[0], h.p[2]], P[st.cur.j], P[(st.cur.j + 1) % n]); if (dq < 0.3 || h.i === st.cur.j) { st.msg = 'Dieser Punkt liegt zu nah an der Kniestockwand – auf der Seitenwand weiter oben/innen anzielen.'; return; }
        raw.slopes.push({ j: st.cur.j, kh: st.cur.kh, dq, hq: h.y }); const q = AM.slope(st.cur.j, st.cur.kh, dq, h.y); st.cur = null; st.msg = `Dachschräge ✓ Neigung ${q.ang.toFixed(1).replace('.', ',')}°.`; vibr(60); }
    } else { // Fenster / Tür
      if (!st.cur) { st.cur = { h1: h }; st.msg = `Ecke 1 ✓ (Wand ${h.i + 1}) – jetzt die <b>gegenüberliegende</b> Ecke.`; vibr(30); }
      else { if (h.i !== st.cur.h1.i) { st.msg = 'Die zweite Ecke liegt auf einer anderen Wand – noch einmal.'; return; }
        const t = st.tool === 'tuer' ? 'tuer' : 'fenster', o = AM.opening(t, st.cur.h1, h, sc()); raw.ops.push({ type: t, h1: st.cur.h1, h2: h }); st.cur = null;
        st.msg = `${TYPN[t]} ✓ ${cm(o.w)}/${cm(o.h)}${t === 'fenster' ? ', Parapet ' + cm(o.brh) : ''} cm`; vibr(60); }
    }
    save();
  }
}
const sc = () => AM.zScale(st.raw.z, st.raw.zlen).s;
function next() {
  if (!st) return;
  if (st.phase === 'z') { if (!st.raw.z.length && !st.skipZ) { st.skipZ = true; st.msg = 'Ohne Zollstock wird es ungenauer (±1–2 %). Nochmal „Weiter“ zum Bestätigen.'; return; } st.phase = 'walls'; st.msg = ''; return; }
  if (st.phase === 'walls') { const w = st.raw.walls, c = w[w.length - 1]; if (c.pts.length < 2) { st.msg = 'Erst mindestens 2 Punkte auf dieser Wand.'; return; } w.push({ pts: [], kinds: [] }); st.msg = `Wand ${w.length - 1} ✓ – jetzt Wand ${w.length} (in derselben Richtung weiter).`; vibr(40); save(); return; }
  if (st.phase === 'extra') st.s.end();
}
function undo() {
  if (!st) return; const raw = st.raw;
  if (st.phase === 'z') { if (st.zcur.length) st.zcur.pop(); else raw.z.pop(); }
  else if (st.phase === 'walls') { const w = raw.walls, c = w[w.length - 1]; if (c.pts.length) { c.pts.pop(); c.kinds.pop(); } else if (w.length > 1) w.pop(); }
  else if (st.phase === 'extra') { if (st.cur) st.cur = null; else { const k = { hoehe: 'H', schraege: 'slopes' }[st.tool] || 'ops'; if (raw[k].length) raw[k].pop(); else { st.phase = 'walls'; st.R = null; raw.walls.push({ pts: [], kinds: [] }); } } }
  st.msg = 'Rückgängig ✓'; save();
}
function ui() {
  if (!st) return; const raw = st.raw, ph = st.phase;
  const W = raw.walls, cw = W[W.length - 1];
  let step = '', msg = st.msg, main = 'Punkt', nx = 'Weiter ›', tools = '';
  if (!st.track) msg = 'Kamera sucht … Handy langsam bewegen, gut beleuchten.';
  if (ph === 'floor') { step = '1 · Boden erkennen'; msg = msg || 'Handy auf den Boden richten und langsam hin und her bewegen.'; main = `Boden … ${Math.min(100, st.floorYs.length * 4)} %`; }
  else if (ph === 'z') { step = `2 · Zollstock (Lage ${raw.z.length + 1})`; main = st.zcur.length ? '⊕ Ende des Zollstocks' : '⊕ Anfang des Zollstocks'; msg = msg || 'Fadenkreuz genau auf das Ende des Zollstocks, Handy ca. 40 cm darüber, dann tippen.'; nx = raw.z.length ? 'Weiter zu den Wänden ›' : 'Ohne Zollstock ›'; }
  else if (ph === 'walls') { step = `3 · Wand ${W.length}`; main = st.scan ? '● tastet ab …' : `⊕ Punkt (${cw.pts.length}) – halten = abtasten`; msg = msg || 'Fadenkreuz auf die Linie Boden/Wand. 3–4 Punkte über die ganze Wand verteilen. Hinter Möbeln: nur sichtbare Stücke.'; nx = 'Nächste Wand ›'; tools = W.length >= 3 && cw.pts.length >= 2 || W.length > 3 ? '<button data-t="close" class="pri" style="background:#1f6b50;border-color:#1f6b50">✓ Raum schließen</button>' : ''; }
  else if (ph === 'extra') { step = '4 · Höhe, Öffnungen, Schrägen'; const T = { hoehe: 'Raumhöhe', fenster: 'Fenster', tuer: 'Tür', schraege: 'Dachschräge' };
    tools = Object.entries(T).map(([k, v]) => `<button data-t="${k}" style="${st.tool === k ? 'background:#e5a823;color:#111' : ''}">${v}</button>`).join('');
    main = st.tool === 'hoehe' ? '⊕ Deckenkante' : st.tool === 'schraege' ? (st.cur ? '⊕ Punkt auf Schräge' : '⊕ Knick Wand/Schräge') : (st.cur ? '⊕ Ecke 2' : '⊕ Ecke 1');
    const h = st.o && AM.pickWall(st.o, st.d, st.R, st.floorY), s = sc();
    if (!msg) msg = { hoehe: 'Fadenkreuz auf die Kante Wand/Decke.', fenster: 'Fadenkreuz auf eine Ecke der Fensteröffnung (Mauerkante), dann auf die gegenüberliegende.', tuer: 'Untere Ecke am Boden, dann gegenüberliegende obere Ecke der Türöffnung.', schraege: 'Erst den Knick, wo die Wand in die Schräge übergeht (Kniestock), dann auf der Seitenwand einen Punkt oben an der Schräge.' }[st.tool];
    st.live = h ? `Ziel: Wand ${h.i + 1} · ${f2(h.pos * s)} m ab Ecke · Höhe ${f2(h.y * s)} m` : '';
    nx = '✔ Fertig → Ergebnis'; }
  $('#arStep').textContent = step; $('#arMsg').innerHTML = msg || '';
  $('#arStat').textContent = (ph === 'extra' ? st.live + ' · ' : '') + (st.floorY != null ? 'Boden ✓' : 'Boden ?') + (raw.z.length ? ` · Maßstab ${raw.z.length}× ✓` : '') + (W.length > 1 || cw.pts.length ? ` · ${W.filter(w => w.pts.length).length} Wände` : '');
  if ($('#arMain').textContent !== main) $('#arMain').textContent = main; $('#arMain').disabled = ph === 'floor';
  if ($('#arNext').textContent !== nx) $('#arNext').textContent = nx;
  if ($('#arTools').dataset.v !== tools) { $('#arTools').innerHTML = tools; $('#arTools').dataset.v = tools; }
  mini();
}
function mini() { // kleine Draufsicht der Messpunkte
  const raw = st.raw, P = raw.walls.flatMap(w => w.pts); if (!P.length) { $('#mini').innerHTML = ''; return; }
  const xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), k = 100 / Math.max(0.5, Math.max(...xs) - x0, Math.max(...zs) - z0);
  const X = p => 10 + (p[0] - x0) * k, Y = p => 10 + (p[1] - z0) * k, col = ['#ffd54f', '#4fc3f7', '#aed581', '#f48fb1', '#ce93d8', '#ffab91'];
  let o = raw.walls.map((w, i) => w.pts.map(p => `<circle cx="${X(p)}" cy="${Y(p)}" r="2.2" fill="${col[i % 6]}"/>`).join('')).join('');
  if (st.R) o += `<polygon points="${st.R.P.map(p => X(p) + ',' + Y(p)).join(' ')}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
  if (st.o) o += `<circle cx="${X([st.o[0], st.o[2]])}" cy="${Y([st.o[0], st.o[2]])}" r="3.5" fill="#f33"/>`;
  $('#mini').innerHTML = o;
}
function draw(ctx, cv) { // Messpunkte und Linien ins Kamerabild
  const W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1; if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); const v = st.view; if (!v) return;
  const P = v.projectionMatrix, V = v.transform.inverse.matrix, mul = (M, a) => [0, 1, 2, 3].map(r => M[r] * a[0] + M[4 + r] * a[1] + M[8 + r] * a[2] + M[12 + r] * a[3]);
  const pr = p => { const c = mul(P, mul(V, [p[0], p[1], p[2], 1])); return c[3] > 0.05 ? [(c[0] / c[3] + 1) / 2 * W, (1 - c[1] / c[3]) / 2 * H] : null; };
  const fy = st.floorY ?? 0, dot = (p, c, r = 5) => { const q = pr(p); if (q) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 7); ctx.fill(); } };
  const line = (a, b, c, w = 3) => { const p = pr(a), q = pr(b); if (p && q) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); } };
  st.raw.z.forEach(z => line(z[0], z[1], '#e5a823', 4)); st.zcur.forEach(p => dot(p, '#e5a823', 7));
  st.raw.walls.forEach(w => w.pts.forEach(p => dot([p[0], fy, p[1]], '#4fc3f7')));
  if (st.R) { const Q = st.R.P, n = Q.length, hh = st.raw.H.length ? st.raw.H[0] + fy : null; Q.forEach((p, i) => { const q = Q[(i + 1) % n]; line([p[0], fy, p[1]], [q[0], fy, q[1]], '#7CFC9A'); if (hh) line([p[0], hh, p[1]], [q[0], hh, q[1]], '#7CFC9A', 2); });
    st.raw.ops.forEach(o => { const a = o.h1.p, b = o.h2.p; line(a, [b[0], a[1], b[2]], '#ff6e40'); line([b[0], a[1], b[2]], b, '#ff6e40'); line(b, [a[0], b[1], a[2]], '#ff6e40'); line([a[0], b[1], a[2]], a, '#ff6e40'); });
    if (st.cur && st.cur.h1) dot(st.cur.h1.p, '#ff6e40', 7); }
}
function bindAR() {
  const b = $('#arMain'); let tHold = null, held = false;
  b.onpointerdown = e => { e.preventDefault(); held = false; if (st && st.phase === 'walls') tHold = setTimeout(() => { held = true; st.scan = true; st.last = null; vibr(40); }, 450); };
  const up = () => { clearTimeout(tHold); if (!st) return; if (held) { st.scan = false; st.msg = `Abgetastet ✓ (${st.raw.walls[st.raw.walls.length - 1].pts.length} Punkte)`; save(); } else act(); held = false; };
  b.onpointerup = up; b.onpointercancel = () => { clearTimeout(tHold); if (st) st.scan = false; };
  $('#arNext').onclick = next; $('#arUndo').onclick = undo; $('#arEnd').onclick = () => { if (st && st.s) { if (st.R && st.R.ok) st.s.end(); else { const s = st.s; st = null; s.end(); } } };
  $('#arTools').onclick = e => { const t = e.target.closest('[data-t]'); if (!t || !st) return; if (t.dataset.t === 'close') closeRoom(); else { st.tool = t.dataset.t; st.cur = null; st.msg = ''; } };
}

/* ---------- Ergebnis ---------- */
function finish(raw) {
  raw.date = new Date().toLocaleString('de-AT'); const H = load(HKEY) || []; H.unshift(raw); store(HKEY, H.slice(0, 20)); showRes(raw);
}
function showRes(raw) {
  const B = build(raw); $('#start').hidden = true; const el = $('#res');
  if (!B.ok) { el.innerHTML = `<div class="card"><h2 class="warn">Auswertung nicht möglich</h2>${B.err.map(e => `<p>${esc(e)}</p>`).join('')}<button id="back">‹ Zurück</button></div>`; $('#back').onclick = back; return; }
  const R = B.R, n = R.len.length;
  let h = `<div class="card"><h2>${esc(raw.name)} · ${f2(R.area)} m²</h2><p class="hint">${esc(raw.date || '')} · Umfang ${f2(R.per)} m${B.H ? ` · Raumhöhe <b>${f3(B.H)} m</b>` : ' · Raumhöhe nicht gemessen'}${raw.z.length ? ` · Maßstab aus ${raw.z.length} Zollstock-Lage(n): ${((B.Z.s - 1) * 100).toFixed(2).replace('.', ',')} %` : ' · <span class="warn">ohne Zollstock</span>'}${raw.k && raw.k !== 1 ? ` · nach Maßband korrigiert` : ''}</p>`;
  h += planSVG(B) + `<p class="row"><button data-v="3d">🧊 3D</button>${B.slopes.length || B.H ? '<button data-v="cut">✂ Schnitt</button>' : ''}</p><div id="view"></div>`;
  h += B.warn.map(w => `<p class="warn">⚠ ${esc(w)}</p>`).join('');
  h += `<table><tr><th>Wand</th><th>Länge</th><th>±</th><th>Winkel</th><th>Maßband</th></tr>${R.len.map((L, i) => `<tr><td>${i + 1}</td><td><b>${f3(L)}</b></td><td>${Math.round(R.sig[i] * 1000)} mm</td><td>${R.ang[(i + 1) % n].toFixed(1).replace('.', ',')}°</td><td><input data-k="${i}" size="6" inputmode="decimal" placeholder="m"></td></tr>`).join('')}</table>
    <p class="hint">Kontrolle: eine Wand mit dem Maßband nachmessen und eintragen – die Abweichung wird angezeigt, auf Wunsch wird der Maßstab danach korrigiert.</p><p id="kmOut"></p>`;
  if (B.ops.length) h += `<h2>Fenster und Türen</h2><table><tr><th></th><th>Wand</th><th>Breite</th><th>Höhe</th><th>Parapet</th><th>ab Ecke</th></tr>${B.ops.map(o => `<tr><td>${TYPN[o.type]}</td><td>${o.wall + 1}</td><td><b>${f3(o.w)}</b></td><td><b>${f3(o.h)}</b></td><td>${o.type === 'fenster' ? f3(o.brh) : '–'}</td><td>${f3(o.pos)}</td></tr>`).join('')}</table>`;
  if (B.slopes.length) h += `<h2>Dachschrägen</h2><table><tr><th>an Wand</th><th>Kniestock</th><th>Neigung</th><th>bis Decke</th></tr>${B.slopes.map(q => `<tr><td>${q.wall + 1}</td><td><b>${f3(q.kh)}</b></td><td><b>${q.ang.toFixed(1).replace('.', ',')}°</b></td><td>${q.depth ? f3(q.depth) + ' m' : '–'}</td></tr>`).join('')}</table>
    <p>Fläche mit lichter Höhe ≥ 2,00 m: <b>${f2(AM.areaAbove(R.Ps, B.slopes, 2))} m²</b> · ≥ 1,50 m: <b>${f2(AM.areaAbove(R.Ps, B.slopes, 1.5))} m²</b> · ≥ 1,00 m: <b>${f2(AM.areaAbove(R.Ps, B.slopes, 1))} m²</b></p><p class="hint">Welche Teilflächen angerechnet werden, hängt von der Norm/Berechnungsart ab (z. B. Wohnnutzfläche) – bitte prüfen.</p>`;
  h += `<p class="row"><button id="toPlan" class="pri">In Raumplan übernehmen</button><button id="copy">Rohdaten kopieren</button><button id="back">‹ Neue Messung</button></p><p id="expMsg" class="hint"></p></div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { $('#view').innerHTML = b.dataset.v === '3d' ? iso(B) : cut(B); });
  el.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => { const i = +inp.dataset.k, v = num(inp.value); if (!(v > 0.2)) return; const d = (R.len[i] - v) * 1000, k = v / R.len[i];
    $('#kmOut').innerHTML = `Wand ${i + 1}: App ${f3(R.len[i])} m, Maßband ${f3(v)} m → <b class="${Math.abs(d) <= 10 ? 'ok' : 'warn'}">${d > 0 ? '+' : ''}${Math.round(d)} mm</b> <button id="kfix">Maßstab danach korrigieren</button>`;
    $('#kfix').onclick = () => { raw.k = (raw.k || 1) * k; const L = load(HKEY) || []; if (L[0] && L[0].t0 === raw.t0) { L[0] = raw; store(HKEY, L); } showRes(raw); }; });
  $('#back').onclick = back; $('#copy').onclick = () => { const t = JSON.stringify(raw); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => $('#expMsg').textContent = 'Rohdaten kopiert ✓', () => $('#expMsg').textContent = t.slice(0, 3000)); };
  $('#toPlan').onclick = () => toPlan(B);
}
function back() { $('#res').innerHTML = ''; $('#start').hidden = false; hist(); }

// Grundriss mit Maßketten: außen Wandlängen, innen Öffnungen (ab Ecke / Breite / Rest), Schräglinien gestrichelt
function planSVG(B) {
  const P = B.R.Ps, n = P.length, xs = P.map(p => p[0]), ys = P.map(p => p[1]), x0 = Math.min(...xs) - 1.1, y0 = Math.min(...ys) - 1.1, w = Math.max(...xs) - x0 + 1.1, hh = Math.max(...ys) - y0 + 1.1;
  const c = [xs.reduce((a, b) => a + b) / n, ys.reduce((a, b) => a + b) / n], T = (p, t, sz = 0.17, col = '#123', rot = 0) => `<text x="${p[0]}" y="${p[1]}" font-size="${sz}" fill="${col}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot} ${p[0]} ${p[1]})" font-family="system-ui" font-weight="600">${t}</text>`;
  let o = `<svg class="plan" viewBox="${x0} ${y0} ${w} ${hh}" xmlns="http://www.w3.org/2000/svg"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#eef4f1" stroke="#17201c" stroke-width="0.06" stroke-linejoin="miter"/>`;
  const dim = (a, b, off, txt, col = '#1f4e8c') => { const d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L]; let nn = [-u[1], u[0]]; const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if ((mid[0] - c[0]) * nn[0] + (mid[1] - c[1]) * nn[1] < 0) nn = [-nn[0], -nn[1]];
    const A = [a[0] + nn[0] * off, a[1] + nn[1] * off], Bp = [b[0] + nn[0] * off, b[1] + nn[1] * off]; let rot = Math.atan2(u[1], u[0]) * 57.3; if (rot > 90) rot -= 180; if (rot < -90) rot += 180;
    const tk = p => `<line x1="${p[0] - 0.05 * (u[0] + nn[0])}" y1="${p[1] - 0.05 * (u[1] + nn[1])}" x2="${p[0] + 0.05 * (u[0] + nn[0])}" y2="${p[1] + 0.05 * (u[1] + nn[1])}" stroke="${col}" stroke-width="0.02"/>`;
    return `<line x1="${A[0]}" y1="${A[1]}" x2="${Bp[0]}" y2="${Bp[1]}" stroke="${col}" stroke-width="0.012"/>${tk(A)}${tk(Bp)}` + T([(A[0] + Bp[0]) / 2 + nn[0] * 0.11 * Math.sign(off), (A[1] + Bp[1]) / 2 + nn[1] * 0.11 * Math.sign(off)], txt, 0.16, col, rot); };
  P.forEach((p, i) => { const q = P[(i + 1) % n]; o += dim(p, q, 0.55, f2(B.R.len[i])); const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; o += T([m[0] + (c[0] - m[0]) * 0.12, m[1] + (c[1] - m[1]) * 0.12], 'W' + (i + 1), 0.13, '#888'); });
  B.ops.forEach(op => { const a = P[op.wall], b = P[(op.wall + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], A = [a[0] + u[0] * op.pos, a[1] + u[1] * op.pos], E = [A[0] + u[0] * op.w, A[1] + u[1] * op.w];
    o += `<line x1="${A[0]}" y1="${A[1]}" x2="${E[0]}" y2="${E[1]}" stroke="${op.type === 'fenster' ? '#3b8fd6' : '#a0703c'}" stroke-width="0.09"/>`;
    o += dim(a, A, 0.28, f2(op.pos), '#555') + dim(A, E, 0.28, f2(op.w), op.type === 'fenster' ? '#1d6fb8' : '#8a5a25') + dim(E, b, 0.28, f2(L - op.pos - op.w), '#555');
    const mid = [(A[0] + E[0]) / 2, (A[1] + E[1]) / 2]; o += T([mid[0] + (c[0] - mid[0]) * 0.18, mid[1] + (c[1] - mid[1]) * 0.18], `${TYPN[op.type]} ${cm(op.w)}/${cm(op.h)}${op.type === 'fenster' ? ' Br ' + cm(op.brh) : ''}`, 0.12, '#333'); });
  B.slopes.forEach(q => { const a = P[q.wall], b = P[(q.wall + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nn = [-u[1], u[0]]; if ((c[0] - a[0]) * nn[0] + (c[1] - a[1]) * nn[1] < 0) nn = [-nn[0], -nn[1]];
    [[1.5, 'h = 1,50'], [2.0, 'h = 2,00'], [B.H, 'Knick']].forEach(([hm, t]) => { if (!hm || hm <= q.kh) return; const d = (hm - q.kh) / Math.tan(q.ang / 57.3); if (d > 8) return; const A = [a[0] + nn[0] * d, a[1] + nn[1] * d], E = [b[0] + nn[0] * d, b[1] + nn[1] * d];
      o += `<line x1="${A[0]}" y1="${A[1]}" x2="${E[0]}" y2="${E[1]}" stroke="#c0392b" stroke-width="0.02" stroke-dasharray="0.12 0.08"/>` + T([A[0] * 0.75 + E[0] * 0.25, A[1] * 0.75 + E[1] * 0.25 - 0.1], t, 0.12, '#c0392b'); });
    o += T([(a[0] + b[0]) / 2 + nn[0] * 0.25, (a[1] + b[1]) / 2 + nn[1] * 0.25], `Kniestock ${f2(q.kh)} · ${q.ang.toFixed(0)}°`, 0.13, '#c0392b'); });
  o += T([c[0], c[1] + 0.35], `${f2(B.R.area)} m²${B.H ? ' · RH ' + f2(B.H) : ''}`, 0.2, '#17201c');
  return o + '</svg>';
}
function iso(B) { // 3D-Puppenhaus: Wände bis zur tatsächlichen Höhe (Schrägen), Öffnungen
  const P = B.R.Ps, n = P.length, H = B.H || Math.max(2.5, ...B.slopes.map(q => q.kh + 1.5)), hAt = p => AM.heightAt(p, P, B.slopes, H);
  const c30 = 0.866, PJ = (x, y, z) => [(x - y) * c30, (x + y) * 0.5 - z], F = [], cx = P.reduce((a, p) => a + p[0], 0) / n, cy = P.reduce((a, p) => a + p[1], 0) / n;
  F.push({ d: -1e9, pts: P.map(p => PJ(p[0], p[1], 0)), fill: '#e8eef0', st: '#8aa' });
  P.forEach((p, i) => { const q = P[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, front = (mx - cx) + (my - cy) > 0;
    const top = []; for (let k = 0; k <= 16; k++) { const t = k / 16, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t; top.push(PJ(x, y, front ? 0.12 : hAt([x, y]))); }
    F.push({ d: mx + my, pts: [PJ(p[0], p[1], 0), PJ(q[0], q[1], 0), ...top.reverse()], fill: front ? '#cbd6dc' : '#f5f7f8', st: '#5b7088' });
    if (!front) B.ops.filter(o => o.wall === i).forEach(o => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]), u = [(q[0] - p[0]) / L, (q[1] - p[1]) / L], a = [p[0] + u[0] * o.pos, p[1] + u[1] * o.pos], b = [a[0] + u[0] * o.w, a[1] + u[1] * o.w], z0 = o.brh, z1 = o.brh + o.h;
      F.push({ d: mx + my + 0.01, pts: [PJ(a[0], a[1], z0), PJ(b[0], b[1], z0), PJ(b[0], b[1], z1), PJ(a[0], a[1], z1)], fill: o.type === 'fenster' ? '#9fd3f5' : '#d7b98e', st: '#2b5a7a', lab: [PJ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (z0 + z1) / 2), `${cm(o.w)}/${cm(o.h)}`] }); }); });
  B.slopes.forEach(q => { const a = P[q.wall], b = P[(q.wall + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nn = [-u[1], u[0]]; if ((cx - a[0]) * nn[0] + (cy - a[1]) * nn[1] < 0) nn = [-nn[0], -nn[1]];
    const d = Math.min(q.depth || 3, Math.max(...P.map(p => AM.distLine(p, a, b)))), A2 = [a[0] + nn[0] * d, a[1] + nn[1] * d], B2 = [b[0] + nn[0] * d, b[1] + nn[1] * d], h2 = q.kh + Math.tan(q.ang / 57.3) * d;
    F.push({ d: 1e8, pts: [PJ(a[0], a[1], q.kh), PJ(b[0], b[1], q.kh), PJ(B2[0], B2[1], h2), PJ(A2[0], A2[1], h2)], fill: '#e0a06a55', st: '#b0602a' }); });
  F.sort((a, b) => a.d - b.d); const all = F.flatMap(f => f.pts), X = all.map(p => p[0]), Y = all.map(p => p[1]), x0 = Math.min(...X) - 0.3, y0 = Math.min(...Y) - 0.3;
  return `<svg class="plan" viewBox="${x0} ${y0} ${Math.max(...X) - x0 + 0.3} ${Math.max(...Y) - y0 + 0.3}">` + F.map(f => `<polygon points="${f.pts.map(p => p.map(v => v.toFixed(3)).join(',')).join(' ')}" fill="${f.fill}" stroke="${f.st}" stroke-width="0.015"/>` + (f.lab ? `<text x="${f.lab[0][0]}" y="${f.lab[0][1]}" font-size="0.18" text-anchor="middle" font-weight="600">${f.lab[1]}</text>` : '')).join('') + '</svg>';
}
function cut(B) { // Schnitt quer zur ersten Dachschräge (sonst quer zu Wand 1)
  const P = B.R.Ps, n = P.length, q = B.slopes[0], j = q ? q.wall : 0, a = P[j], b = P[(j + 1) % n], H = B.H || 2.5;
  const D = Math.max(...P.map(p => AM.distLine(p, a, b))), hx = x => q ? Math.min(H, q.kh + Math.tan(q.ang / 57.3) * x) : H;
  const pts = [[0, 0], [D, 0], [D, hx(D)]]; if (q && q.depth && q.depth < D) pts.push([q.depth, H]); pts.push([0, q ? q.kh : H]);
  const k = 1, Y = y => -y, T = (x, y, t, col = '#1f4e8c', anc = 'middle') => `<text x="${x}" y="${y}" font-size="0.16" text-anchor="${anc}" fill="${col}" font-weight="600">${t}</text>`;
  let o = `<svg class="plan" viewBox="-1.4 ${-H - 0.6} ${D + 2.4} ${H + 1.2}"><polygon points="${pts.map(p => p[0] * k + ',' + Y(p[1])).join(' ')}" fill="#eef4f1" stroke="#17201c" stroke-width="0.05"/>`;
  o += `<line x1="-0.5" y1="0" x2="-0.5" y2="${Y(q ? q.kh : H)}" stroke="#1f4e8c" stroke-width="0.012"/>` + T(-0.62, Y((q ? q.kh : H) / 2), f2(q ? q.kh : H), '#1f4e8c', 'end');
  if (q) o += `<line x1="${D + 0.4}" y1="0" x2="${D + 0.4}" y2="${Y(hx(D))}" stroke="#1f4e8c" stroke-width="0.012"/>` + T(D + 0.5, Y(hx(D) / 2), f2(hx(D)), '#1f4e8c', 'start') + T(0.5, Y(q.kh + 0.3), q.ang.toFixed(1).replace('.', ',') + '°', '#c0392b', 'start') + (q.depth && q.depth < D ? T(q.depth / 2, 0.35, '↔ ' + f2(q.depth), '#555') : '');
  o += `<line x1="0" y1="0.18" x2="${D}" y2="0.18" stroke="#1f4e8c" stroke-width="0.012"/>` + T(D / 2, 0.42, f2(D)) + (B.H ? T(D * 0.7, Y(H) + 0.25, 'RH ' + f2(H), '#17201c') : '');
  return o + `</svg><p class="hint">Schnitt quer zu Wand ${j + 1}${q ? ' (Dachschräge)' : ''}.</p>`;
}
// Übergabe an die Raumplan-App (gleicher Speicher, Seite index.html)
function toPlan(B) {
  let S = load('raumplan-v1'); if (!S || !Array.isArray(S.rooms)) S = { rooms: [], meas: [], project: {} };
  let P = B.R.Ps.slice(), ops = B.ops.map(o => ({ ...o })), sl = B.slopes.map(q => ({ ...q })); const n = P.length;
  if (!B.R.ccw) { P = P.slice().reverse(); const L = B.R.len; ops = ops.map(o => { const w = n - 1 - o.wall, Lw = L[o.wall]; return { ...o, wall: w, pos: Lw - o.pos - o.w }; }); sl = sl.map(q => ({ ...q, wall: n - 1 - q.wall })); }
  const ang = P.map((p, i) => { const q = P[(i + 1) % n]; return Math.atan2(q[1] - p[1], q[0] - p[0]) * 57.29578; }), nA = a => { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };
  const maxX = S.rooms.reduce((m, r) => Math.max(m, (r.x || 0) + 6), 0);
  S.rooms.push({ name: B.raw.name, x: maxX, y: 0, rot: ang[0], mirror: false, segs: P.map((p, i) => ({ len: Math.hypot(P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1]), turn: nA(ang[(i + 1) % n] - ang[i]) })), h: B.H || 2.6, hSet: !!B.H, floor: '', status: 'bestand', ops: ops.map(o => ({ type: o.type, wall: o.wall, pos: +o.pos.toFixed(4), w: +o.w.toFixed(4), h: +o.h.toFixed(4), brh: +o.brh.toFixed(4) })), obs: [], adj: null, slopes: sl, src: 'aufmass-ar' });
  store('raumplan-v1', S); $('#expMsg').innerHTML = '✓ Übernommen. <a href="index.html">Raumplan öffnen</a> (Reiter Ergebnis).';
}
function hist() {
  const H = load(HKEY) || [], L = load(LKEY);
  let h = H.length ? `<div class="card"><b>Letzte Messungen</b>${H.map((r, i) => `<p class="row"><button data-h="${i}">${esc(r.name)} · ${esc(r.date || '')}</button></p>`).join('')}</div>` : '';
  if (L && (!H[0] || H[0].t0 !== L.t0) && L.walls && L.walls.some(w => w.pts.length >= 2)) h = `<div class="card"><b>Abgebrochene Messung gefunden</b> (${esc(L.name)}) <button id="resume">Auswerten</button></div>` + h;
  $('#hist').innerHTML = h;
  $('#hist').querySelectorAll('[data-h]').forEach(b => b.onclick = () => showRes(H[+b.dataset.h]));
  if ($('#resume')) $('#resume').onclick = () => showRes(L);
}
// Beispiel: Büro mit Dachschräge (simuliert, AR-Maßstab 1,2 % daneben, 3 mm Rauschen)
function demoRaw() {
  let sd = 3; const r = () => (sd = sd * 16807 % 2147483647) / 2147483647 - 0.5, K = 1.012, T = [[0, 0], [4.32, 0], [4.32, 3.48], [0, 3.48]];
  const walls = T.map((a, i) => { const b = T[(i + 1) % 4], pts = []; for (let k = 0; k < 5; k++) { const t = 0.08 + 0.84 * k / 4; pts.push([K * (a[0] + (b[0] - a[0]) * t) + 0.004 * r(), K * (a[1] + (b[1] - a[1]) * t) + 0.004 * r()]); } return { pts, kinds: pts.map(() => 'f'), floorPts: true }; });
  const z = [[[0.5, 0, 0.5], [2.5, 0, 0.52]], [[1, 0, 0.6], [1.02, 0, 2.6]], [[0.8, 0, 0.8], [2.2142, 0, 2.2142]]].map(L => L.map(p => p.map(v => v * K + 0.002 * r())));
  const op = (i, pos, y) => ({ i, pos: pos * K, y: y * K, p: [0, 0, 0] });
  return { name: 'Büro (Beispiel)', zlen: 2, skirt: 0, z, walls, H: [2.48 * K], ops: [{ type: 'fenster', h1: op(2, 1.2, 1.0), h2: op(2, 2.4, 2.2) }, { type: 'tuer', h1: op(3, 0.4, 0), h2: op(3, 1.31, 2.05) }], slopes: [{ j: 0, kh: 0.95 * K, dq: 1.2 * K, hq: 0.95 * K + Math.tan(40 / 57.3) * 1.2 * K }], date: 'Beispiel', t0: 1 };
}
$('#go').onclick = arStart; $('#demo').onclick = () => showRes(demoRaw()); bindAR(); hist();
(async () => { const ok = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar').catch(() => false); $('#sup').innerHTML = ok ? '<span class="ok">AR verfügbar ✓</span>' : 'Hinweis: Auf diesem Gerät/Browser ist kein AR verfügbar (Android + Chrome + ARCore nötig). „Beispiel ansehen“ geht trotzdem.'; })();
