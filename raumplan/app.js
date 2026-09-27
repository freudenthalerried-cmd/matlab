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
  project: { bv: '', bh: '', adr: '', gst: '', kg: '', pv: '', inhalt: 'Grundriss Erdgeschoß – Bestand', nr: '01', datum: new Date().toLocaleDateString('de-AT'), nord: 0 },
  scale: 100, paper: 'A3', wallT: 0.30, innerT: 0.12, rooms: [], meas: []
};
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
if (!S || !Array.isArray(S.rooms)) S = structuredClone(DEF);
S.project = { ...DEF.project, ...S.project };
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }, 300); }

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
  cur = { name, c, thumb: t.toDataURL('image/jpeg', .7), ref: [], pts: [], refType: 'rect', W: 2, D: 1, L: 1 };
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

/* ---------- 2 Vermessen ---------- */
function solve(A, b) {
  const n = b.length; A = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
    if (Math.abs(A[m][c]) < 1e-12) return null;
    [A[c], A[m]] = [A[m], A[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map((r, i) => r[n] / r[i]);
}
function homog(src, dst) {
  // Normierung der Bildkoordinaten für numerische Stabilität
  const cx = src.reduce((a, p) => a + p[0], 0) / 4, cy = src.reduce((a, p) => a + p[1], 0) / 4;
  const sc = 1 / (src.reduce((a, p) => a + Math.hypot(p[0] - cx, p[1] - cy), 0) / 4 || 1);
  const A = [], b = [];
  src.forEach((p, i) => {
    const x = (p[0] - cx) * sc, y = (p[1] - cy) * sc, [X, Y] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y);
  });
  const h = solve(A, b); if (!h) return null;
  return p => { const x = (p[0] - cx) * sc, y = (p[1] - cy) * sc, w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
}
function mapper(s) {
  if (s.refType === 'rect' && s.ref.length === 4) {
    const r = s.ref; let a = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; a += r[i][0] * r[j][1] - r[j][0] * r[i][1]; }
    const sg = a > 0 ? -1 : 1; // im Bild im Uhrzeigersinn geklickt -> nicht spiegeln
    return homog(r, [[0, 0], [s.W, 0], [s.W, sg * s.D], [0, sg * s.D]]);
  }
  if (s.refType === 'line' && s.ref.length === 2) { const k = s.L / (dist(s.ref[0], s.ref[1]) || 1); return p => [p[0] * k, -p[1] * k]; }
  return null;
}
const mc = $('#mc'), mx = mc.getContext('2d');
$$('.seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; selPt = -1; $$('.seg button').forEach(x => x.classList.toggle('on', x === b)); drawMeas(); });
$('#snapSel').onchange = e => { cur = snaps[e.target.value]; selPt = -1; drawMeas(); };
$('#refType').onchange = e => { if (!cur) return; cur.refType = e.target.value; cur.ref = cur.ref.slice(0, e.target.value === 'rect' ? 4 : 2); drawMeas(); };
['W', 'D', 'L'].forEach(k => $('#ref' + k).oninput = e => { if (cur) { cur[k] = num(e.target.value); drawMeas(true); } });
$('#zoom').oninput = e => { zoom = +e.target.value; drawMeas(); };
$$('[data-n]').forEach(b => b.onclick = () => {
  const arr = cur && (mode === 'ref' ? cur.ref : cur.pts); if (!arr || selPt < 0) return;
  const [dx, dy] = b.dataset.n.split(',').map(Number); arr[selPt] = [arr[selPt][0] + dx, arr[selPt][1] + dy]; drawMeas();
});
$('#ptDel').onclick = () => { const arr = cur && (mode === 'ref' ? cur.ref : cur.pts); if (arr && selPt >= 0) { arr.splice(selPt, 1); selPt = -1; drawMeas(); } };
$('#ptClr').onclick = () => { if (cur && confirm('Alle Punkte dieses Modus löschen?')) { (mode === 'ref' ? cur.ref : cur.pts).length = 0; selPt = -1; drawMeas(); } };

mc.addEventListener('click', e => {
  const s = cur; if (!s) return;
  const r = mc.getBoundingClientRect(), k = mc.width / r.width, p = [(e.clientX - r.left) * k, (e.clientY - r.top) * k];
  const arr = mode === 'ref' ? s.ref : s.pts;
  const hit = arr.findIndex(q => dist(q, p) < 22 * k);
  if (hit >= 0) selPt = hit === selPt ? -1 : hit;
  else if (selPt >= 0) arr[selPt] = p;
  else {
    const max = mode === 'ref' ? (s.refType === 'rect' ? 4 : 2) : 99;
    if (arr.length < max) arr.push(p);
    else { $('#mstat').textContent = 'Referenz ist vollständig. Punkt antippen, um ihn zu verschieben – oder Modus „B Messpunkte“ wählen.'; return; }
    if (mode === 'ref' && arr.length === max) { mode = 'pts'; $$('.seg button').forEach(x => x.classList.toggle('on', x.dataset.m === 'pts')); }
  }
  drawMeas(true);
});

function drawMeas(keepInputs) {
  const s = cur;
  $('#snapSel').innerHTML = snaps.map((x, i) => `<option value="${i}" ${x === s ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
  listMeas();
  if (!s) { mc.width = mc.height = 0; $('#mstat').textContent = 'Kein Standbild – zuerst unter „1 Aufnahme“ ein Bild übernehmen.'; $('#mres').textContent = ''; $('#loupe').hidden = true; return; }
  $('#refType').value = s.refType;
  if (!keepInputs) { $('#refW').value = f2(s.W); $('#refD').value = f2(s.D); $('#refL').value = f2(s.L); }
  const rect = s.refType === 'rect';
  $('#lW').hidden = $('#lD').hidden = !rect; $('#lL').hidden = rect;
  mc.width = s.c.width; mc.height = s.c.height;
  const base = ($('#mwrap').clientWidth || 360) / s.c.width;
  mc.style.width = (s.c.width * base * zoom) + 'px';
  const k = 1 / (base * zoom), lw = 2 * k, pr = 7 * k;
  mx.drawImage(s.c, 0, 0);
  mx.font = `bold ${15 * k}px sans-serif`; mx.lineWidth = lw; mx.textBaseline = 'middle';
  const M = mapper(s);
  // Referenz
  if (s.ref.length) {
    mx.strokeStyle = '#ff8c1a'; mx.fillStyle = 'rgba(255,140,26,.18)';
    mx.beginPath(); s.ref.forEach((p, i) => i ? mx.lineTo(...p) : mx.moveTo(...p));
    if (s.ref.length === 4) { mx.closePath(); mx.fill(); } mx.stroke();
    s.ref.forEach((p, i) => dot(p, '#ff8c1a', rect ? 'ABCD'[i] : ['0', 'L'][i], mode === 'ref' && i === selPt));
  }
  // Messpunkte
  const F = M ? s.pts.map(M) : null;
  if (s.pts.length) {
    mx.strokeStyle = '#19d3ff'; mx.beginPath(); s.pts.forEach((p, i) => i ? mx.lineTo(...p) : mx.moveTo(...p)); mx.stroke();
    if (s.pts.length > 2) { mx.setLineDash([8 * k, 6 * k]); mx.beginPath(); mx.moveTo(...s.pts[s.pts.length - 1]); mx.lineTo(...s.pts[0]); mx.stroke(); mx.setLineDash([]); }
    if (F) s.pts.forEach((p, i) => { if (i) label(mid(p, s.pts[i - 1]), f2(dist(F[i], F[i - 1])) + ' m'); });
    s.pts.forEach((p, i) => dot(p, '#19d3ff', String(i + 1), mode === 'pts' && i === selPt));
  }
  function dot(p, c, t, sel) {
    mx.fillStyle = c; mx.beginPath(); mx.arc(p[0], p[1], sel ? pr * 1.6 : pr, 0, 7); mx.fill();
    mx.strokeStyle = sel ? '#fff' : '#000'; mx.stroke();
    mx.fillStyle = '#fff'; mx.strokeStyle = '#000'; mx.lineWidth = 3 * k; mx.strokeText(t, p[0] + pr * 1.5, p[1] - pr * 1.5); mx.fillText(t, p[0] + pr * 1.5, p[1] - pr * 1.5); mx.lineWidth = lw;
  }
  function label(p, t) { mx.lineWidth = 4 * k; mx.strokeStyle = '#000'; mx.fillStyle = '#ff0'; mx.strokeText(t, ...p); mx.fillText(t, ...p); mx.lineWidth = lw; }
  // Status
  const need = rect ? 4 : 2;
  let st;
  if (mode === 'ref') st = s.ref.length < need ? (rect ? `Referenz: Ecke ${'ABCD'[s.ref.length]} des Kreppband-Rechtecks antippen (A→B = Breite, B→C = Tiefe, reihum).` : `Maßband: Punkt ${s.ref.length ? 'Ende' : 'Anfang'} der Strecke antippen.`) : 'Referenz vollständig ✔';
  else st = !M ? 'Zuerst Referenz setzen (Modus A).' : 'Raumecken dort antippen, wo Wand und Boden sich treffen – reihum. Nur Punkte auf dem Boden sind korrekt!';
  if (selPt >= 0) st = `Punkt ${selPt + 1} ausgewählt: tippen = verschieben, Pfeile = fein, erneut antippen = abwählen.`;
  $('#mstat').textContent = st;
  // Ergebnis
  let h = '';
  if (F && F.length > 1) {
    h += F.slice(1).map((p, i) => `P${i + 1}–P${i + 2}: <b>${f2(dist(p, F[i]))} m</b>`).join(' · ');
    if (F.length > 2) {
      let a = 0; F.forEach((p, i) => { const q = F[(i + 1) % F.length]; a += p[0] * q[1] - q[0] * p[1]; });
      h += ` · Schluss P${F.length}–P1: ${f2(dist(F[F.length - 1], F[0]))} m · Fläche ≈ <b>${f2(Math.abs(a / 2))} m²</b>`;
    }
    if (s.refType === 'rect') {
      const far = Math.max(...F.map(p => Math.hypot(p[0] - s.W / 2, p[1]))), size = Math.max(s.W, s.D);
      if (far > 4 * size) h += `<br><span class="warn">Punkte liegen weit vom Referenz-Rechteck entfernt – Genauigkeit sinkt. Rechteck näher platzieren oder größer machen.</span>`;
    } else h += '<br><span class="warn">Streckenmodus: nur für frontal fotografierte Ebenen (z. B. Wandansicht, Fensterhöhe) brauchbar.</span>';
  }
  $('#mres').innerHTML = h || '<span class="hint">Noch keine Messung.</span>';
  // Lupe
  const L = $('#loupe'), arr = mode === 'ref' ? s.ref : s.pts;
  L.hidden = !(selPt >= 0 && arr[selPt]);
  if (!L.hidden) {
    const lx = L.getContext('2d'), q = arr[selPt], R = 30; lx.imageSmoothingEnabled = false;
    lx.fillStyle = '#000'; lx.fillRect(0, 0, 160, 160);
    lx.drawImage(s.c, q[0] - R, q[1] - R, 2 * R, 2 * R, 0, 0, 160, 160);
    lx.strokeStyle = '#f00'; lx.lineWidth = 1; lx.beginPath(); lx.moveTo(80, 0); lx.lineTo(80, 160); lx.moveTo(0, 80); lx.lineTo(160, 80); lx.stroke();
  }
  listSnaps();
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

$('#toMeas').onclick = () => {
  const M = cur && mapper(cur); if (!M || cur.pts.length < 2) return alert('Referenz und mindestens 2 Messpunkte nötig.');
  const F = cur.pts.map(M);
  for (let i = 1; i < F.length; i++) S.meas.push({ n: `${cur.name} P${i}–P${i + 1}`, v: +dist(F[i], F[i - 1]).toFixed(3) });
  save(); listMeas();
};
$('#toRoom').onclick = () => {
  const M = cur && mapper(cur); if (!M || cur.pts.length < 3) return alert('Referenz und mindestens 3 Raumecken nötig.');
  const name = prompt('Raumname?', 'Raum ' + (S.rooms.length + 1)); if (name === null) return;
  const r = newRoom(name, [], 0, 0); Object.assign(r, fromPoly(cur.pts.map(M), r));
  r.rot = 0; placeFree(r); S.rooms.push(r); selRoom = S.rooms.length - 1; save(); showTab('plan');
};
function listMeas() {
  $('#mlist').innerHTML = S.meas.map((m, i) => `<li>${esc(m.n)}: <b>${f2(m.v)} m</b><button data-d="${i}">×</button></li>`).join('') || '<li class="hint">leer</li>';
  $('#measList').innerHTML = S.meas.map(m => `<option value="${f2(m.v, 3)}">${esc(m.n)}</option>`).join('');
}
$('#mlist').onclick = e => { const i = e.target.dataset.d; if (i != null) { S.meas.splice(i, 1); save(); listMeas(); } };
$('#mAdd').onclick = () => { const v = num($('#mVal').value); if (!v) return; S.meas.push({ n: $('#mName').value || 'manuell', v }); $('#mVal').value = $('#mName').value = ''; save(); listMeas(); };

/* ---------- Geometrie ---------- */
function newRoom(name, segs, x, y) { return { name, segs, x, y, rot: 0, mirror: false, h: 2.6, floor: '', status: 'bestand', ops: [] }; }
function rectSegs(w, d) { return [w, d, w, d].map(len => ({ len, turn: 90 })); }
function normA(a) { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; }
function fromPoly(Q, old) {
  // Polygon (m) -> Wände mit Längen und Knickwinkeln; stellt sicher, dass links herum (CCW) gezählt wird
  const n = Q.length, sg = old && old.mirror ? -1 : 1;
  const ang = Q.map((p, i) => { const q = Q[(i + 1) % n]; return Math.atan2(q[1] - p[1], q[0] - p[0]) * R2D; });
  return {
    x: Q[0][0], y: Q[0][1], rot: ang[0],
    segs: Q.map((p, i) => ({ len: +dist(p, Q[(i + 1) % n]).toFixed(3), turn: +(sg * normA(ang[(i + 1) % n] - ang[i])).toFixed(2), t: old && old.segs[i] ? old.segs[i].t : undefined }))
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
function rdAngle(d) { let a = -Math.atan2(d[1], d[0]) * R2D; if (a > 90.01) a -= 180; if (a <= -89.99) a += 180; return a; }
function line(a, b, w, c = '#000', extra = '') { return `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${c}" stroke-width="${mm(w).toFixed(2)}" ${extra}/>`; }
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
      const mids = add(mid(s0, s1), mul(e.n, e.t / 2)), ang = rdAngle(e.d);
      if (op.type === 'fenster') {
        [0, .45, .55, 1].forEach(f => o += line(add(s0, mul(e.n, e.t * f)), add(s1, mul(e.n, e.t * f)), f % 1 ? .18 : .25));
        o += txt(add(mids, mul(e.n, e.t / 2 + mm(4) / 100)), `FE ${Math.round(op.w * 100)}/${Math.round(op.h * 100)}`, 2.2, ang);
        o += txt(add(mids, mul(e.n, e.t / 2 + mm(7) / 100)), `BRH ${Math.round((op.brh || 0) * 100)}`, 2, ang);
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
      const off = e.t + mm(7) / 100, a = add(e.p, mul(e.n, off)), b = add(e.q, mul(e.n, off)), tk = mul(add(e.d, e.n), mm(1.3) / 100);
      o += line(add(e.p, mul(e.n, e.t + mm(1.5) / 100)), add(a, mul(e.n, mm(1.5) / 100)), .13) + line(add(e.q, mul(e.n, e.t + mm(1.5) / 100)), add(b, mul(e.n, mm(1.5) / 100)), .13);
      o += line(a, b, .18) + line(add(a, tk), add(a, mul(tk, -1)), .35) + line(add(b, tk), add(b, mul(tk, -1)), .35);
      o += txt(add(mid(a, b), mul(e.n, mm(2.2) / 100)), f2(e.L), 2.5, rdAngle(e.d));
    });
    // Raumstempel
    const c = add(g.c, [r.lx || 0, r.ly || 0]), dy = mm(4.2) / 100;
    o += txt(c, r.name, 3, 0, 'font-weight="bold"');
    o += txt(add(c, [0, -dy]), `${f2(g.area)} m²`, 2.5);
    o += txt(add(c, [0, -2 * dy]), `RH ${f2(r.h)} m`, 2.2);
    if (r.floor) o += txt(add(c, [0, -3 * dy]), r.floor, 2.2);
    if (sel === ri) o += `<path d="M${g.O.map(T).join('L')}Z" fill="none" stroke="#1e6fd9" stroke-width="${mm(.8)}" stroke-dasharray="${mm(3)} ${mm(2)}"/>`;
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
  <table><tr><th>Wand</th><th>Länge m</th><th>Knick °</th><th>Stärke m</th><th></th></tr>
  ${r.segs.map((s, i) => `<tr><td>${i + 1}</td>
    <td><input data-s="${i}" data-f="len" list="measList" inputmode="decimal" value="${f2(s.len, 3)}"></td>
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
    <td><input data-o="${i}" data-f="pos" inputmode="decimal" value="${f2(o.pos)}"></td>
    <td><input data-o="${i}" data-f="w" inputmode="decimal" value="${f2(o.w)}"></td>
    <td><input data-o="${i}" data-f="h" inputmode="decimal" value="${f2(o.h)}"></td>
    <td><input data-o="${i}" data-f="brh" inputmode="decimal" value="${f2(o.brh || 0)}"></td>
    <td class="hide-s"><button data-a="flip" data-oi="${i}" title="Anschlag links/rechts">⇆</button><button data-a="aus" data-oi="${i}" title="Aufschlag innen/außen">⇅</button></td>
    <td><button data-a="delop" data-oi="${i}" class="danger">×</button></td></tr>`).join('') || '<tr><td colspan="8" class="hint">Keine – bei einer Wand „+ Öffnung“ tippen. Abstand = vom Wandanfang (Ecke mit gleicher Nummer).</td></tr>'}
  </table>`;
  rstat();
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
  save(); renderPlan(); rstat();
});
$('#rpanel').addEventListener('click', e => {
  const a = e.target.dataset.a, r = S.rooms[selRoom]; if (!a || !r) return;
  const oi = e.target.dataset.oi;
  switch (a) {
    case 'rot90': r.rot = normA((r.rot || 0) - 90); break;
    case 'mirror': r.mirror = !r.mirror; break;
    case 'ortho': r.segs.forEach(s => { const q = Math.round(s.turn / 90) * 90; if (Math.abs(s.turn - q) < 15) s.turn = q; }); { const q = Math.round(r.rot / 90) * 90; if (Math.abs(r.rot - q) < 15) r.rot = q; } break;
    case 'close': { const g = geo(r); Object.assign(r, fromPoly(g.P, r)); break; }
    case 'dup': { const c = structuredClone(r); c.name += ' (Kopie)'; placeFree(c); S.rooms.push(c); selRoom = S.rooms.length - 1; break; }
    case 'del': if (!confirm(`Raum „${r.name}“ löschen?`)) return; S.rooms.splice(selRoom, 1); selRoom = null; break;
    case 'addseg': r.segs.push({ len: 1, turn: 90 }); break;
    case 'delseg': r.segs.pop(); r.ops = r.ops.filter(o => o.wall < r.segs.length); break;
    case 'addop': { const w = +e.target.dataset.w, L = r.segs[w].len; r.ops.push({ type: 'fenster', wall: w, pos: +Math.max(0, (L - 1.2) / 2).toFixed(2), w: 1.2, h: 1.4, brh: 0.9 }); break; }
    case 'delop': r.ops.splice(oi, 1); break;
    case 'flip': r.ops[oi].flip = !r.ops[oi].flip; break;
    case 'aus': r.ops[oi].aus = !r.ops[oi].aus; break;
  }
  save(); renderPlan(a === 'dup' || a === 'del'); roomPanel();
});

/* ---------- 4 Einreichung / Export ---------- */
const PAPER = { A4: [297, 210], A3: [420, 297], A2: [594, 420] };
function fillProj() {
  const f = $('#pform');
  for (const el of f.elements) el.value = el.name in S.project ? S.project[el.name] : el.name === 'scale' || el.name === 'paper' ? S[el.name] : f2(S[el.name]);
  preview();
}
$('#pform').addEventListener('input', e => {
  const n = e.target.name, v = e.target.value;
  if (n in S.project) S.project[n] = n === 'nord' ? num(v) : v;
  else S[n] = n === 'paper' ? v : num(v);
  save(); preview();
});
function preview() { $('#preview').innerHTML = pageSVG(); }
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
  o += `<text x="${x + 100}" y="${y + 8}" font-size="2.2">Lichte Maße in m · Maße vor Ausführung am Bau prüfen</text>`;
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
    g.E.forEach(e => tx(add(mid(e.p, e.q), mul(e.n, e.t + 0.4)), f2(e.L), 0.18, 'MASS', -rdAngle(e.d)));
  });
  const dxf = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '6', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES', ...L, '0', 'ENDSEC', '0', 'EOF'].join('\r\n');
  download(fname('dxf'), dxf, 'application/dxf');
};
$('#xJson').onclick = () => download(fname('json'), JSON.stringify(S, null, 1), 'application/json');
$('#xLoad').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { const d = JSON.parse(t); if (!Array.isArray(d.rooms)) throw 0; S = { ...structuredClone(DEF), ...d, project: { ...DEF.project, ...d.project } }; selRoom = null; save(); fillProj(); listMeas(); })
    .catch(() => alert('Datei ist kein gültiges Raumplan-Projekt.'));
  e.target.value = '';
};
$('#xNew').onclick = () => { if (confirm('Neues Projekt beginnen? Alle Räume, Messungen und Angaben werden gelöscht (vorher „Projekt speichern“!).')) { S = structuredClone(DEF); selRoom = null; save(); fillProj(); listMeas(); } };

addEventListener('resize', () => { if (!$('#plan').hidden) renderPlan(); });
listMeas();
