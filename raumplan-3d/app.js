// Raumplan 3D – Wohnung begehen, einrichten, streichen, beleuchten.
import * as THREE from './lib/three.module.min.js';
import { MOEBEL, KATEGORIEN, baue } from './moebel.js';
import { beispiel, rechteckRaum, WANDFARBEN, BOEDEN, MOEBELFARBEN, WAND0 } from './daten.js';
import { arVerfuegbar, starteAufmass, starteScan, modellAusAufmass, skaliere } from './aufmass.js';
import { auswerten } from './scan.js';

const VERSION = '1.3';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* privat */ } } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const uid = () => 'i' + Math.random().toString(36).slice(2, 9);
const cm = m => Math.round(m * 100);

// ---------- Affiliate ----------
// Amazon-Partner-ID (Tracking-ID). Im Menü änderbar, wird im Browser gemerkt.
const AFF_DEFAULT = 'eprotect-21';
let affTag = LS.get('rp3d-tag') || AFF_DEFAULT;
const amazon = kw => `https://www.amazon.de/s?k=${encodeURIComponent(kw)}&tag=${encodeURIComponent(affTag)}`;
const affLink = (kw, label = 'Bei Amazon ansehen') => `<a class="aff" href="${esc(amazon(kw))}" target="_blank" rel="sponsored noopener">🛒 ${esc(label)}*</a>`;
const AFF_NOTE = '<p class="note">* Affiliate-Link: Als Amazon-Partner verdiene ich an qualifizierten Verkäufen. Für dich bleibt der Preis gleich.</p>';

// ---------- Renderer & Szene ----------
const canvas = $('#c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch (e) { $('#err').hidden = false; $('#err').textContent = '3D wird auf diesem Gerät/Browser nicht unterstützt (WebGL fehlt). Bitte Chrome, Edge oder Safari aktuell verwenden.'; throw e; }
const MOBIL = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBIL ? 1.75 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 300);
camera.rotation.order = 'YXZ';
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBIL ? 1024 : 2048, MOBIL ? 1024 : 2048);
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xdde8ff, 0xb8a690, 0.5);
const amb = new THREE.AmbientLight(0xfff1e2, 0.5);
scene.add(hemi, amb);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#7f8c6a', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
scene.add(ground);
const gWalls = new THREE.Group(), gFloors = new THREE.Group(), gCeil = new THREE.Group(), gItems = new THREE.Group(), gCloud = new THREE.Group();
scene.add(gWalls, gFloors, gCeil, gItems, gCloud);
const selBox = new THREE.BoxHelper(undefined, 0x4da3ff);
selBox.material.depthTest = false; selBox.renderOrder = 10; selBox.visible = false;
scene.add(selBox);

let dirty = true;
const inv = () => { dirty = true; };

// ---------- Materialien ----------
const AUSSEN0 = '#e4ded2';
const BOX = new THREE.BoxGeometry(1, 1, 1);
const paintMats = new Map();
const paintMat = c => { let m = paintMats.get(c); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.92 }); paintMats.set(c, m); } return m; };
const REVEAL = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.9 });
const FRAME = new THREE.MeshStandardMaterial({ color: '#f7f7f7', roughness: 0.5 });
const GLASS = new THREE.MeshStandardMaterial({ color: '#cfe3ef', roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false });
const LEAF = new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.6 });
const CEIL = new THREE.MeshStandardMaterial({ color: '#fbfbf9', roughness: 0.95 });

function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tone(hex, l) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, l); return '#' + c.getHexString(); }

// Bodentexturen werden im Browser gezeichnet (keine Bilddateien nötig)
const floorCache = new Map();
function floorCanvas(id) {
  const def = BOEDEN[id] || BOEDEN.eiche_hell;
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const r = rnd(id.length * 31 + id.charCodeAt(0));
  x.fillStyle = def.farbe; x.fillRect(0, 0, 512, 512);
  if (def.art === 'dielen') {
    const n = 10, pw = 512 / n;
    for (let i = 0; i < n; i++) {
      let y = -r() * 400;
      while (y < 512) {
        const len = 512 * (0.4 + r() * 0.55);
        x.fillStyle = tone(def.farbe, (r() - 0.5) * 0.1); x.fillRect(i * pw, y, pw, len);
        x.globalAlpha = 0.07; x.strokeStyle = '#000'; x.lineWidth = 1;
        for (let k = 0; k < 7; k++) { const gx = i * pw + 3 + r() * (pw - 6); x.beginPath(); x.moveTo(gx, y); x.bezierCurveTo(gx + (r() - 0.5) * 7, y + len * 0.33, gx + (r() - 0.5) * 7, y + len * 0.66, gx, y + len); x.stroke(); }
        x.globalAlpha = 1; x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(i * pw, y, pw, 1.5);
        y += len;
      }
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * pw, 0, 1.5, 512);
    }
  } else if (def.art === 'fliesen') {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = tone(def.farbe, (r() - 0.5) * 0.04); x.fillRect(i * 256, j * 256, 256, 256); }
    for (let k = 0; k < 2500; k++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},.05)`; x.fillRect(r() * 512, r() * 512, 2, 2); }
    x.fillStyle = def.fuge; x.fillRect(0, 0, 512, 3); x.fillRect(0, 254, 512, 3); x.fillRect(0, 0, 3, 512); x.fillRect(254, 0, 3, 512);
  } else if (def.art === 'beton') {
    for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.04})`; x.beginPath(); x.arc(r() * 512, r() * 512, 2 + r() * 26, 0, 7); x.fill(); }
  } else {
    for (let k = 0; k < 14000; k++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},.08)`; x.fillRect(r() * 512, r() * 512, 1.5, 1.5); }
  }
  return c;
}
function floorMat(id) {
  if (!BOEDEN[id]) id = 'eiche_hell';
  let m = floorCache.get(id);
  if (!m) {
    const def = BOEDEN[id], t = new THREE.CanvasTexture(floorCanvas(id));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / def.size, 1 / def.size); t.anisotropy = MAX_ANISO; t.colorSpace = THREE.SRGBColorSpace;
    m = new THREE.MeshStandardMaterial({ map: t, roughness: def.rough });
    m.userData.preview = t.image.toDataURL('image/jpeg', 0.7);
    floorCache.set(id, m);
  }
  return m;
}

// ---------- Fotos (aus dem Aufmaß) ----------
// Bilder liegen in IndexedDB (zu groß für localStorage), der Plan merkt sich nur den Schlüssel.
const idb = (() => {
  let dbp = null;
  const open = () => dbp ||= new Promise((res, rej) => { const r = indexedDB.open('rp3d', 1); r.onupgradeneeded = () => r.result.createObjectStore('fotos'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const run = (mode, fn) => open().then(db => new Promise((res, rej) => { const tx = db.transaction('fotos', mode), rq = fn(tx.objectStore('fotos')); tx.oncomplete = () => res(rq && rq.result); tx.onerror = () => rej(tx.error); }));
  return { put: (k, v) => run('readwrite', s => s.put(v, k)), get: k => run('readonly', s => s.get(k)), del: k => run('readwrite', s => s.delete(k)) };
})();
const fotoTex = new Map();
const SHOWF = () => LS.get('rp3d-fotos') !== '0';
function texAus(src) { const t = src.isTexture ? src : new THREE.Texture(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO; t.needsUpdate = true; return t; }
async function ladeFotos() {
  const keys = new Set();
  for (const w of plan.walls) for (const f of [w.fotoA, w.fotoB]) if (f) keys.add(f.key);
  for (const r of plan.rooms) if (r.foto) keys.add(r.foto.key);
  let neu = 0;
  for (const k of keys) {
    if (fotoTex.has(k)) continue;
    try {
      const blob = await idb.get(k); if (!blob) continue;
      const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode();
      fotoTex.set(k, texAus(img)); neu++;
    } catch { /* Foto fehlt, dann eben Farbe */ }
  }
  if (plan.wolke && !wolken.has(plan.wolke.key)) { try { const w = await idb.get(plan.wolke.key); if (w && w.pos) { wolken.set(plan.wolke.key, w); neu++; } } catch { /* ohne Punktwolke */ } }
  return neu;
}
// Gescannte Einrichtung: farbige Punktwolke (ein Punkt je 2,5-cm-Würfel)
const wolken = new Map();
const SHOWW = () => LS.get('rp3d-wolke') !== '0';
let wolkeMat = null;
const LIN = (() => { const t = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; t[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); } return t; })();
const korr = () => (plan.aufmass && plan.aufmass.korr) || 1;
function wolkeGroesse() { if (wolkeMat) wolkeMat.size = 0.036 * korr() / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); }
function baueWolke() {
  while (gCloud.children.length) { const o = gCloud.children[0]; gCloud.remove(o); o.geometry.dispose(); o.material.dispose(); }
  wolkeMat = null;
  const w = plan.wolke && SHOWW() && wolken.get(plan.wolke.key); if (!w) return;
  const col = new Float32Array(w.col.length); for (let i = 0; i < col.length; i++) col[i] = LIN[w.col[i]];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(w.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  wolkeMat = new THREE.PointsMaterial({ vertexColors: true, sizeAttenuation: true, toneMapped: false });
  const pts = new THREE.Points(g, wolkeMat); pts.frustumCulled = false; pts.scale.setScalar(korr());
  gCloud.add(pts); wolkeGroesse();
}
let fotoMats = [];
function fotoMat(map, rx, ox, ry, oy) {
  const t = map.clone(); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(rx, ry); t.offset.set(ox, oy); t.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); fotoMats.push(m); return m;
}
function wandFotoMat(w, side, x0, x1, y0, y1) {
  const f = w['foto' + side], map = f && fotoTex.get(f.key); if (!map) return null;
  const H = plan.height, L = f.len;
  return side === 'A' ? fotoMat(map, (x1 - x0) / L, (x0 - f.x0) / L, (y1 - y0) / H, y0 / H) : fotoMat(map, -(x1 - x0) / L, (x1 - f.x0) / L, (y1 - y0) / H, y0 / H);
}
function bodenFotoMat(r) { const f = r.foto, map = f && fotoTex.get(f.key); return map ? fotoMat(map, 1 / f.w, -f.x0 / f.w, 1 / f.d, 1 + f.z0 / f.d) : null; }

// ---------- Plan ----------
let plan = null;
function frame(w) {
  const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1e-9, ux = dx / L, uz = dz / L;
  return { L, ux, uz, nx: -uz, nz: ux, ang: Math.atan2(-uz, ux) };
}
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
  const u = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2, 0, 1);
  return Math.hypot(p[0] - a[0] - dx * u, p[1] - a[1] - dz * u);
}
function pip(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > p[1]) !== (zj > p[1]) && p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
const area = poly => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
function sideRoom(w, side) {
  const f = frame(w), s = side === 'A' ? 1 : -1, off = w.t / 2 + 0.2;
  const p = [w.a[0] + f.ux * f.L / 2 + f.nx * s * off, w.a[1] + f.uz * f.L / 2 + f.nz * s * off];
  return plan.rooms.find(r => pip(p, r.poly)) || null;
}
// Wände an T-Stößen teilen, damit jede Wandseite genau einen Raum hat (für "ganzen Raum streichen")
function splitWalls(walls) {
  const out = [];
  for (const w of walls) {
    const f = frame(w), cuts = [];
    for (const o of walls) {
      if (o === w) continue;
      for (const p of [o.a, o.b]) {
        const s = (p[0] - w.a[0]) * f.ux + (p[1] - w.a[1]) * f.uz, d = Math.abs((p[0] - w.a[0]) * f.nx + (p[1] - w.a[1]) * f.nz);
        if (d < 0.02 && s > 0.05 && s < f.L - 0.05 && !cuts.some(c => Math.abs(c - s) < 0.02)) cuts.push(s);
      }
    }
    cuts.sort((a, b) => a - b);
    let s0 = 0;
    [...cuts, f.L].forEach((s1, k) => {
      const pt = s => [+(w.a[0] + f.ux * s).toFixed(4), +(w.a[1] + f.uz * s).toFixed(4)];
      out.push({ ...w, id: cuts.length ? (w.id || 'w') + '.' + k : w.id, a: pt(s0), b: pt(s1),
        open: (w.open || []).filter(o => o.at >= s0 && o.at < s1).map(o => ({ ...o, at: o.at - s0 })) });
      s0 = s1;
    });
  }
  return out;
}
function normalize(p) {
  if (!p || !Array.isArray(p.walls) || !Array.isArray(p.rooms)) throw new Error('Kein gültiger Plan (walls/rooms fehlen).');
  p.height = clamp(+p.height || 2.6, 1.8, 6);
  p.walls = p.walls.filter(w => Array.isArray(w.a) && Array.isArray(w.b)).map((w, i) => ({ ...w, id: w.id || 'w' + i, t: clamp(+w.t || 0.12, 0.04, 1), open: Array.isArray(w.open) ? w.open : [] }));
  p.walls = splitWalls(p.walls);
  p.rooms = p.rooms.filter(r => Array.isArray(r.poly) && r.poly.length >= 3).map((r, i) => ({ ...r, id: r.id || 'r' + i, name: r.name || 'Raum ' + (i + 1), floor: BOEDEN[r.floor] ? r.floor : 'eiche_hell' }));
  p.items = (Array.isArray(p.items) ? p.items : []).filter(it => MOEBEL[it.cat]).map(it => ({ ...it, id: it.id || uid(), x: +it.x || 0, z: +it.z || 0, rot: +it.rot || 0 }));
  p.light = { tod: 15, nord: 0, lamps: false, level: 1, kelvin: 3000, exposure: 1, ...(p.light || {}) };
  p.name = p.name || 'Mein Plan';
  plan = p;
  for (const w of p.walls) for (const s of ['A', 'B']) if (!w['col' + s]) w['col' + s] = sideRoom(w, s) ? WAND0 : AUSSEN0;
  return p;
}

// ---------- Aufbau Wände / Böden / Decken ----------
let solids = [];
const wallMats = new Map();
function clear(g) { while (g.children.length) g.remove(g.children[0]); }
function endExt(w, P, f) {
  let e = 0;
  for (const o of plan.walls) {
    if (o === w) continue; const g = frame(o);
    if (Math.abs(f.ux * g.uz - f.uz * g.ux) < 0.2) continue;
    if (distSeg(P, o.a, o.b) < 0.02) e = Math.max(e, o.t / 2);
  }
  return e;
}
function deco(g, o, t, top) {
  const add = (w, h, d, x, y, z, m, kind = 'deco') => { const k = new THREE.Mesh(BOX, m); k.scale.set(w, h, d); k.position.set(x, y, z); k.castShadow = m !== GLASS; k.receiveShadow = true; k.userData = { kind }; g.add(k); return k; };
  const cx = (o.x0 + o.x1) / 2, W = o.x1 - o.x0, y0 = o.sill || 0, Hh = top - y0, fr = 0.06;
  if (o.typ === 'tuer') {
    add(0.05, Hh, t + 0.02, o.x0 + 0.025, y0 + Hh / 2, 0, FRAME); add(0.05, Hh, t + 0.02, o.x1 - 0.025, y0 + Hh / 2, 0, FRAME);
    add(W, 0.05, t + 0.02, cx, top - 0.025, 0, FRAME);
    const piv = new THREE.Group(); piv.position.set(o.x0 + 0.05, 0, t / 2 + 0.02); piv.rotation.y = -1.65; g.add(piv);
    const lw = W - 0.1, leaf = new THREE.Mesh(BOX, LEAF); leaf.scale.set(lw, Hh - 0.06, 0.04); leaf.position.set(lw / 2, (Hh - 0.06) / 2, 0);
    leaf.castShadow = leaf.receiveShadow = true; leaf.userData = { kind: 'deco' }; piv.add(leaf);
  } else {
    add(fr, Hh, 0.08, o.x0 + fr / 2, y0 + Hh / 2, 0, FRAME); add(fr, Hh, 0.08, o.x1 - fr / 2, y0 + Hh / 2, 0, FRAME);
    add(W, fr, 0.08, cx, top - fr / 2, 0, FRAME); add(W, fr, 0.08, cx, y0 + fr / 2, 0, FRAME);
    if (W > 1.3) add(fr * 0.8, Hh, 0.07, cx, y0 + Hh / 2, 0, FRAME);
    add(W - 2 * fr, Hh - 2 * fr, 0.012, cx, y0 + Hh / 2, 0, GLASS, 'glass');
  }
}
function buildStructure() {
  clear(gWalls); clear(gFloors); clear(gCeil); solids = []; wallMats.clear();
  fotoMats.forEach(m => { m.map.dispose(); m.dispose(); }); fotoMats = [];
  const H = plan.height, mitFoto = SHOWF();
  for (const w of plan.walls) {
    const f = frame(w); if (f.L < 0.01) continue;
    const mats = [REVEAL, REVEAL, REVEAL, REVEAL, paintMat(w.colA), paintMat(w.colB)];
    wallMats.set(w.id, mats);
    const g = new THREE.Group(); g.position.set(w.a[0], 0, w.a[1]); g.rotation.y = f.ang; gWalls.add(g);
    const seg = (x0, x1) => solids.push({ ax: w.a[0] + f.ux * x0, az: w.a[1] + f.uz * x0, bx: w.a[0] + f.ux * x1, bz: w.a[1] + f.uz * x1, t: w.t });
    const piece = (x0, x1, y0, y1) => {
      if (x1 - x0 < 0.005 || y1 - y0 < 0.005) return;
      let pm = mats;
      if (mitFoto && (w.fotoA || w.fotoB)) { pm = mats.slice(); for (const sd of ['A', 'B']) { const fm = wandFotoMat(w, sd, x0, x1, y0, y1); if (fm) pm[sd === 'A' ? 4 : 5] = fm; } }
      const m = new THREE.Mesh(BOX, pm); m.scale.set(x1 - x0, y1 - y0, w.t); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      m.castShadow = m.receiveShadow = true; m.userData = { kind: 'wall', wall: w }; g.add(m);
      if (y0 < 0.01) seg(x0, x1);
    };
    const e0 = endExt(w, w.a, f), e1 = endExt(w, w.b, f);
    const opens = w.open.map(o => ({ ...o, sill: +o.sill || 0, x0: Math.max(0, o.at - o.w / 2), x1: Math.min(f.L, o.at + o.w / 2) })).filter(o => o.x1 - o.x0 > 0.1).sort((p, q) => p.x0 - q.x0);
    let x = -e0;
    for (const o of opens) {
      if (o.x0 < x) continue;
      const top = Math.min(H, o.sill + o.h);
      piece(x, o.x0, 0, H);
      if (o.sill > 0) piece(o.x0, o.x1, 0, o.sill);
      piece(o.x0, o.x1, top, H);
      deco(g, o, w.t, top);
      if (o.typ !== 'tuer') seg(o.x0, o.x1);
      x = o.x1;
    }
    piece(x, f.L + e1, 0, H);
  }
  for (const r of plan.rooms) {
    const geo = new THREE.ShapeGeometry(new THREE.Shape(r.poly.map(p => new THREE.Vector2(p[0], -p[1])))); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, (mitFoto && bodenFotoMat(r)) || floorMat(r.floor)); m.position.y = 0.002; m.receiveShadow = true; m.userData = { kind: 'floor', room: r }; gFloors.add(m);
    const gc = new THREE.ShapeGeometry(new THREE.Shape(r.poly.map(p => new THREE.Vector2(p[0], p[1])))); gc.rotateX(Math.PI / 2);
    const c = new THREE.Mesh(gc, CEIL); c.position.y = H; c.castShadow = true; c.receiveShadow = true; c.userData = { kind: 'ceil' }; gCeil.add(c);
  }
  fitSun();
}
const bbox = { x0: 0, z0: 0, x1: 1, z1: 1, cx: 0, cz: 0, size: 1 };
function fitSun() {
  const xs = [], zs = [];
  plan.walls.forEach(w => { xs.push(w.a[0], w.b[0]); zs.push(w.a[1], w.b[1]); });
  plan.rooms.forEach(r => r.poly.forEach(p => { xs.push(p[0]); zs.push(p[1]); }));
  if (!xs.length) xs.push(0, 1), zs.push(0, 1);
  Object.assign(bbox, { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) });
  bbox.cx = (bbox.x0 + bbox.x1) / 2; bbox.cz = (bbox.z0 + bbox.z1) / 2; bbox.size = Math.max(bbox.x1 - bbox.x0, bbox.z1 - bbox.z0, 2);
  const R = Math.hypot(bbox.x1 - bbox.x0, bbox.z1 - bbox.z0) / 2 + 1.5, cam = sun.shadow.camera;
  cam.left = cam.bottom = -R; cam.right = cam.top = R; cam.near = 0.5; cam.far = 120; cam.updateProjectionMatrix();
}

// Wandseiten-Farbe ändern
function setWallColor(w, side, hex) { w['col' + side] = hex; const m = wallMats.get(w.id); if (m) m[side === 'A' ? 4 : 5] = paintMat(hex); inv(); if (w['foto' + side]) { delete w['foto' + side]; return true; } return false; }

// ---------- Möbel ----------
const objs = new Map();
const itemById = id => plan.items.find(i => i.id === id);
function mountY(it) {
  const def = MOEBEL[it.cat];
  if (def.mount === 'decke') return plan.height;
  if (def.mount === 'wand') return it.y ?? def.y ?? 1.5;
  return it.y || 0;
}
function placeObj(it) { const g = objs.get(it.id); if (!g) return; g.position.set(it.x, mountY(it), it.z); g.rotation.y = it.rot || 0; g.updateMatrixWorld(true); inv(); }
function makeObj(it) {
  const def = MOEBEL[it.cat], g = baue(it);
  if (def.light) { const L = new THREE.PointLight(0xffffff, 0, 7, 2); L.position.y = def.light.y; g.add(L); g.userData.light = L; }
  objs.set(it.id, g); gItems.add(g); placeObj(it);
}
function removeObj(id) {
  const g = objs.get(id); if (!g) return;
  gItems.remove(g); (g.userData.glow || []).forEach(m => m.dispose()); objs.delete(id); inv();
}
function buildItems() { for (const id of [...objs.keys()]) removeObj(id); plan.items.forEach(makeObj); applyLamps(); }
// Kleines Möbel (Lampe, TV, Pflanze) auf darunterliegendes Möbel stellen
function stackY(it, boxes) {
  let y = 0;
  for (const [id, b] of boxes) if (id !== it.id && it.x > b.min.x && it.x < b.max.x && it.z > b.min.z && it.z < b.max.z && b.max.y < 1.6) y = Math.max(y, b.max.y);
  return y;
}
function itemBoxes() { const m = new Map(); for (const it of plan.items) { const d = MOEBEL[it.cat]; if (d.mount || d.stack) continue; m.set(it.id, new THREE.Box3().setFromObject(objs.get(it.id))); } return m; }
// Wandmöbel an nächste Wand vor dem Punkt hängen
function hangOnWall(it, x, z) {
  const def = MOEBEL[it.cat]; let best = null;
  for (const w of plan.walls) {
    const f = frame(w), s = clamp((x - w.a[0]) * f.ux + (z - w.a[1]) * f.uz, def.w / 2, f.L - def.w / 2);
    const px = w.a[0] + f.ux * s, pz = w.a[1] + f.uz * s, sd = (x - px) * f.nx + (z - pz) * f.nz, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { d, px, pz, nx: f.nx * Math.sign(sd || 1), nz: f.nz * Math.sign(sd || 1), t: w.t };
  }
  if (!best) return;
  const off = best.t / 2 + def.d / 2 + 0.003;
  it.x = best.px + best.nx * off; it.z = best.pz + best.nz * off; it.rot = Math.atan2(best.nx, best.nz);
  it.y = it.y ?? def.y;
}

// ---------- Licht ----------
const LAMP = 7;
function kelvin(k) {
  const t = k / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  const c = v => clamp(v, 0, 255) / 255;
  return new THREE.Color().setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}
function applyLamps() {
  const L = plan.light, col = kelvin(L.kelvin); let n = 0;
  for (const it of plan.items) {
    const def = MOEBEL[it.cat]; if (!def.light) continue;
    const g = objs.get(it.id); if (!g) continue;
    const on = L.lamps && it.on !== false, lit = on && n < 14; if (lit) n++;
    const pl = g.userData.light; pl.visible = lit; pl.color.copy(col); pl.intensity = def.light.p * LAMP * L.level;
    for (const m of g.userData.glow || []) { m.emissive.copy(col); m.emissiveIntensity = on ? 0.5 + 0.6 * Math.min(L.level, 1.5) : 0; }
  }
  inv();
}
const SKY_N = new THREE.Color('#0b1424'), SKY_D = new THREE.Color('#e8a37c'), SKY_T = new THREE.Color('#a8c9ea');
const WARM = new THREE.Color('#ff9a5c'), WHITE = new THREE.Color('#fff4e6');
function applyLight() {
  const L = plan.light, t = (L.tod - 6) / 14.5;
  const el = t >= 0 && t <= 1 ? Math.sin(Math.PI * t) * THREE.MathUtils.degToRad(58) : -0.25;
  const sEl = Math.sin(el), day = smooth(0, 0.22, sEl);
  const az = Math.PI * clamp(t, 0, 1) + THREE.MathUtils.degToRad(L.nord || 0);
  const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.max(sEl, 0.03), Math.sin(az) * Math.cos(el)).normalize();
  sun.target.position.set(bbox.cx, 0, bbox.cz); sun.position.copy(sun.target.position).addScaledVector(dir, 40); sun.target.updateMatrixWorld();
  sun.intensity = 3.2 * day; sun.visible = day > 0.003;
  sun.color.copy(WARM).lerp(WHITE, smooth(0, 0.5, sEl));
  const sky = SKY_N.clone().lerp(SKY_D, smooth(-0.12, 0.05, sEl)).lerp(SKY_T, smooth(0.05, 0.35, sEl));
  scene.background = sky;
  hemi.color.copy(sky).lerp(WHITE, 0.5);
  hemi.intensity = 0.08 + 1.2 * smooth(-0.05, 0.3, sEl);
  amb.intensity = 0.05 + 0.85 * smooth(-0.05, 0.3, sEl);
  renderer.toneMappingExposure = L.exposure;
  if (wolkeMat) wolkeMat.color.setScalar(Math.max(0.2 + 0.8 * smooth(-0.05, 0.3, sEl), L.lamps ? 0.5 : 0) * Math.min(1.3, L.exposure));
  applyLamps();
}

// ---------- Kamera ----------
let mode = 'haus';
const walk = { x: 0, z: 0, yaw: 0, pitch: -0.05, eye: 1.6, target: null };
const orb = { tx: 0, tz: 0, r: 14, th: 0.5, ph: 0.85 };
function resetCams() {
  orb.tx = bbox.cx; orb.tz = bbox.cz; orb.r = bbox.size * 1.25 + 2; orb.th = 0.5; orb.ph = 0.85;
  const s = plan.start || { x: bbox.cx, z: bbox.cz, yaw: 0 };
  Object.assign(walk, { x: s.x, z: s.z, yaw: s.yaw || 0, pitch: -0.05, target: null });
}
function applyCam() {
  if (mode === 'gehen') { camera.position.set(walk.x, walk.eye, walk.z); camera.rotation.set(walk.pitch, walk.yaw, 0); }
  else {
    const ph = mode === 'plan' ? 0.001 : orb.ph, th = mode === 'plan' ? 0 : orb.th, r = effR();
    camera.position.set(orb.tx + r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), orb.tz + r * Math.sin(ph) * Math.cos(th));
    camera.lookAt(orb.tx, 0, orb.tz);
  }
  inv();
}
function setMode(m) {
  mode = m; walk.target = null;
  gCeil.visible = m === 'gehen';
  camera.fov = m === 'plan' ? 45 : 62; camera.updateProjectionMatrix(); wolkeGroesse();
  document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === m));
  $('#joy').hidden = !(m === 'gehen' && MOBIL);
  applyCam();
  if (m === 'gehen') hint(MOBIL ? 'Linker Kreis = gehen · rechts wischen = umsehen · Boden antippen = hingehen' : 'W A S D = gehen · Maus ziehen = umsehen · Boden klicken = hingehen');
  else if (m === 'plan') hint('Ziehen = verschieben · Zwei Finger / Mausrad = zoomen');
}
function collide(x, z, r = 0.2) {
  for (let k = 0; k < 2; k++) for (const s of solids) {
    const dx = s.bx - s.ax, dz = s.bz - s.az, L2 = dx * dx + dz * dz || 1e-9;
    const u = clamp(((x - s.ax) * dx + (z - s.az) * dz) / L2, 0, 1), px = s.ax + dx * u, pz = s.az + dz * u;
    const ex = x - px, ez = z - pz, d = Math.hypot(ex, ez), min = r + s.t / 2;
    if (d < min && d > 1e-6) { x = px + ex / d * min; z = pz + ez / d * min; }
  }
  return [x, z];
}
const effR = () => mode === 'plan' ? orb.r * 1.4 : orb.r;
const upp = () => 2 * effR() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, canvas.clientHeight);
function pan(dx, dy) {
  const k = upp();
  if (mode === 'plan') { orb.tx -= dx * k; orb.tz -= dy * k; }
  else { const s = Math.sin(orb.th), c = Math.cos(orb.th); orb.tx += (-c * dx - s * dy) * k; orb.tz += (s * dx - c * dy) * k; }
  orb.tx = clamp(orb.tx, bbox.x0 - 10, bbox.x1 + 10); orb.tz = clamp(orb.tz, bbox.z0 - 10, bbox.z1 + 10);
}
function camDrag(dx, dy, panMode) {
  if (mode === 'gehen') { walk.yaw += dx * 0.0045; walk.pitch = clamp(walk.pitch + dy * 0.0045, -1.2, 1.2); walk.target = null; }
  else if (mode === 'plan' || panMode) pan(dx, dy);
  else { orb.th -= dx * 0.006; orb.ph = clamp(orb.ph - dy * 0.006, 0.12, 1.45); }
  applyCam();
}
function zoom(f) { orb.r = clamp(orb.r * f, 1.5, 80); applyCam(); }
function moveWalk(d) { const [x, z] = collide(walk.x - Math.sin(walk.yaw) * d, walk.z - Math.cos(walk.yaw) * d); walk.x = x; walk.z = z; applyCam(); }

// ---------- Auswahl, Picking ----------
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmpV = new THREE.Vector3();
function ray(cx, cy) { const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); raycaster.setFromCamera(ndc, camera); }
function pickAt(cx, cy) {
  ray(cx, cy);
  for (const h of raycaster.intersectObjects([gItems, gWalls, gFloors], true)) {
    let o = h.object; while (o && !o.userData.kind) o = o.parent;
    if (!o || o.userData.kind === 'glass') continue;
    const k = o.userData.kind;
    if (k === 'item') return { kind: 'item', id: o.userData.id, point: h.point };
    if (k === 'wall') { const mi = h.face && h.face.materialIndex; return { kind: 'wall', wall: o.userData.wall, side: mi === 4 ? 'A' : mi === 5 ? 'B' : null, point: h.point }; }
    if (k === 'floor') return { kind: 'floor', room: o.userData.room, point: h.point };
    return { kind: 'none' };
  }
  return null;
}
function rayPlane(cx, cy, y) { ray(cx, cy); const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y); return raycaster.ray.intersectPlane(pl, tmpV) ? tmpV.clone() : null; }
let selId = null;
function select(id) { const g = objs.get(id); if (!g) return deselect(); selId = id; selBox.setFromObject(g); selBox.visible = true; closeSheet(true); renderSel(); inv(); }
function deselect() { selId = null; selBox.visible = false; $('#sel').hidden = true; inv(); }

// ---------- Undo & Speichern ----------
const undo = [];
function snapshot() { return JSON.stringify(plan); }
function pushUndo() { undo.push(snapshot()); if (undo.length > 40) undo.shift(); $('#bUndo').disabled = false; }
function doUndo() {
  if (!undo.length) return;
  plan = JSON.parse(undo.pop()); rebuild(false); deselect(); save();
  $('#bUndo').disabled = !undo.length; if (sheet) openSheet(sheet); hint('Rückgängig');
}
let saveT = 0;
// Eigener Speicherplatz je verlinktem Raum (?plan=…), damit der eigene Plan nicht überschrieben wird
const PLAN_URL = new URLSearchParams(location.search).get('plan');
// ---------- Projekte ----------
// Jeder aufgenommene/angelegte Raum ist ein eigenes Projekt. Liste und Pläne liegen im Browser-Speicher.
let projekte = [], aktId = null;
try { projekte = JSON.parse(LS.get('rp3d-liste') || '[]'); if (!Array.isArray(projekte)) projekte = []; } catch { projekte = []; }
const listeSichern = () => LS.set('rp3d-liste', JSON.stringify(projekte));
const neueId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const skey = () => (PLAN_URL ? 'rp3d-plan:' + PLAN_URL : aktId ? 'rp3d-p:' + aktId : null);
function saveNow() {
  clearTimeout(saveT); saveT = 0; if (!plan) return;
  if (!PLAN_URL && !aktId) { aktId = neueId(); projekte.unshift({ id: aktId, name: plan.name, t: Date.now() }); LS.set('rp3d-akt', aktId); }   // erste Änderung an der Vorschau → eigenes Projekt
  LS.set(skey(), snapshot());
  const e = projekte.find(q => q.id === aktId);
  if (e) { e.name = plan.name; e.t = Date.now(); e.m2 = +plan.rooms.reduce((sum, r) => sum + area(r.poly), 0).toFixed(1); listeSichern(); }
}
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function freierName(basis) { let n = basis, i = 2; while (projekte.some(q => q.name === n)) n = `${basis} (${i++})`; return n; }
function neuesProjekt(p) {      // fertigen Plan als neues Projekt anlegen und anzeigen
  if (saveT) saveNow();
  normalize(p);
  if (!PLAN_URL) { plan.name = freierName(plan.name); aktId = neueId(); projekte.unshift({ id: aktId, name: plan.name, t: Date.now() }); LS.set('rp3d-akt', aktId); }
  undo.length = 0; $('#bUndo').disabled = true; $('#start').hidden = true;
  rebuild(); deselect(); saveNow();
}
function oeffneProjekt(id) {
  if (saveT) saveNow();
  let p; try { p = JSON.parse(LS.get('rp3d-p:' + id)); normalize(p); } catch { return false; }
  aktId = id; LS.set('rp3d-akt', id); undo.length = 0; $('#bUndo').disabled = true; $('#start').hidden = true;
  rebuild(); deselect(); closeSheet(); setMode('haus');
  ladeFotos().then(n => { if (n) { buildStructure(); baueWolke(); applyLight(); } });
  return true;
}
async function loescheProjekt(id) {
  try { const p = JSON.parse(LS.get('rp3d-p:' + id)), keys = []; for (const w of p.walls || []) for (const f of [w.fotoA, w.fotoB]) if (f) keys.push(f.key); for (const r of p.rooms || []) if (r.foto) keys.push(r.foto.key); if (p.wolke) keys.push(p.wolke.key); for (const k of keys) { fotoTex.delete(k); wolken.delete(k); await idb.del(k).catch(() => {}); } } catch { /* Plan nicht lesbar */ }
  try { localStorage.removeItem('rp3d-p:' + id); } catch { /* privat */ }
  projekte = projekte.filter(q => q.id !== id); listeSichern();
  if (aktId === id) { aktId = null; LS.set('rp3d-akt', ''); normalize(beispiel()); undo.length = 0; $('#bUndo').disabled = true; rebuild(); deselect(); }
}
function oeffneBeispiel() { const e = projekte.find(q => q.bsp); if (e && oeffneProjekt(e.id)) return; neuesProjekt(beispiel()); const n = projekte.find(q => q.id === aktId); if (n) { n.bsp = true; listeSichern(); } setMode('haus'); }

// ---------- Startseite ----------
let arOk = null;
function zeigeStart(msg = '') {
  if (PLAN_URL) return;
  if (saveT) saveNow();
  closeSheet(); deselect();
  const fmt = t => new Date(t).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  $('#start').innerHTML = `<div class="st-in">
    <h1>Raumplan 3D <small>Version ${VERSION}</small></h1>
    <p class="mut">Raum mit dem Handy aufnehmen, in 3D durchgehen und einrichten.</p>
    ${msg ? `<p class="warn">⚠ ${esc(msg)}</p>` : ''}
    <button class="main big" data-s="scan">📹 Neues Projekt: Raum aufnehmen</button>
    <p class="mut">${arOk === false ? '⚠ Aufnehmen geht nur am Android-Handy in Chrome (mit „Google Play-Dienste für AR“). Auf diesem Gerät: Maße eintippen oder eine Projektdatei öffnen.' : 'Antippen, Kamera erlauben, dann langsam durch den Raum gehen und alles abfilmen.'}</p>
    <div class="row"><button data-s="ecken">📏 Ecken antippen</button><button data-s="masse">📐 Maße eintippen</button><button data-s="datei">📂 Datei öffnen</button></div>
    ${projekte.length ? `<h3>Meine Projekte</h3><div class="list">${projekte.map(q => `<div class="pr"><button data-o="${esc(q.id)}"><b>${esc(q.name)}</b><span class="mut">${fmt(q.t)}${q.m2 ? ' · ' + String(q.m2).replace('.', ',') + ' m²' : ''}${q.id === aktId ? ' · zuletzt offen' : ''}</span></button><button class="no" data-del="${esc(q.id)}" aria-label="Projekt ${esc(q.name)} löschen">🗑</button></div>`).join('')}</div>` : ''}
    <div class="list" style="margin-top:14px"><button data-s="beispiel">🏠 Beispielwohnung ansehen</button></div>
  </div>`;
  $('#start').hidden = false; $('#start').scrollTop = 0;
}
$('#start').onclick = async e => {
  const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
  if (d.s === 'scan') scannen();
  else if (d.s === 'ecken') aufmessen();
  else if (d.s === 'masse') { $('#start').hidden = true; openSheet('raum'); }
  else if (d.s === 'datei') $('#file').click();
  else if (d.s === 'beispiel') oeffneBeispiel();
  else if (d.o) { if (!oeffneProjekt(d.o)) zeigeStart('Projekt konnte nicht geöffnet werden.'); }
  else if (d.del) { const q = projekte.find(x => x.id === d.del); if (q && confirm(`Projekt „${q.name}“ mit allen Fotos endgültig löschen?`)) { await loescheProjekt(d.del); zeigeStart(); } }
};
function rebuild(resetCam = true) { normalize(plan); buildStructure(); buildItems(); baueWolke(); applyLight(); if (resetCam) resetCams(); applyCam(); $('#sub').textContent = plan.name; }

// ---------- Hinweis ----------
let hintT = 0;
function hint(t, ms = 3200) { const h = $('#hint'); h.textContent = t; h.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('on'), ms); }

// ---------- Zeiger (Maus/Touch) ----------
const ptrs = new Map();
let gest = null;
let tool = 'auswahl';
const SNAP = () => LS.get('rp3d-snap') === '1';
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) {
    const h = pickAt(e.clientX, e.clientY);
    const g0 = { x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, t0: performance.now(), hit: h, moved: false, btn: e.button };
    if (tool === 'auswahl' && h && h.kind === 'item' && e.button === 0 && (h.id === selId || e.pointerType === 'mouse')) { if (h.id !== selId) select(h.id); gest = { kind: 'item', ...g0, ...beginDrag(h, e) }; }
    else gest = { kind: 'cam', ...g0 };
  } else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    gest = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, moved: true };
  }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  if (!gest) return;
  if (gest.kind === 'pinch') {
    if (ptrs.size !== 2) return;
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    if (mode === 'gehen') moveWalk((d - gest.d) * 0.012);
    else { if (d > 10) orb.r = clamp(orb.r * gest.d / d, 1.5, 80); pan(cx - gest.cx, cy - gest.cy); applyCam(); }
    gest.d = d; gest.cx = cx; gest.cy = cy; return;
  }
  const dx = e.clientX - gest.lx, dy = e.clientY - gest.ly; gest.lx = e.clientX; gest.ly = e.clientY;
  if (!gest.moved && Math.hypot(e.clientX - gest.x0, e.clientY - gest.y0) > 6) { gest.moved = true; if (gest.kind === 'item') pushUndo(); }
  if (!gest.moved) return;
  if (gest.kind === 'item') dragItem(e); else camDrag(dx, dy, gest.btn === 2 || gest.btn === 1 || e.shiftKey);
});
function endPtr(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (!gest) return;
  if (gest.kind !== 'pinch' && !gest.moved && e.type === 'pointerup' && performance.now() - gest.t0 < 600) onTap(gest.hit);
  if (gest.kind === 'item' && gest.moved) { save(); renderSel(); }
  gest = null;
}
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (mode === 'gehen') moveWalk(-e.deltaY * 0.003); else zoom(Math.pow(1.1, e.deltaY / 100));
}, { passive: false });

function beginDrag(h, e) {
  const it = itemById(h.id), def = MOEBEL[it.cat];
  if (def.mount === 'wand') return { mount: 'wand' };
  const y = def.mount === 'decke' ? plan.height : 0, p = rayPlane(e.clientX, e.clientY, y) || new THREE.Vector3(it.x, y, it.z);
  return { mount: def.mount || 'boden', offX: it.x - p.x, offZ: it.z - p.z, boxes: def.stack ? itemBoxes() : null };
}
function dragItem(e) {
  const it = itemById(selId); if (!it) return; const def = MOEBEL[it.cat];
  if (gest.mount === 'wand') {
    ray(e.clientX, e.clientY);
    const h = raycaster.intersectObjects([gWalls], true).find(h => h.object.userData.kind === 'wall' && h.face && (h.face.materialIndex === 4 || h.face.materialIndex === 5));
    if (!h) return;
    const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); n.y = 0; n.normalize();
    const off = def.d / 2 + 0.003;
    it.x = h.point.x + n.x * off; it.z = h.point.z + n.z * off; it.rot = Math.atan2(n.x, n.z);
    it.y = clamp(h.point.y, def.h / 2 + 0.1, plan.height - def.h / 2 - 0.02);
    if (SNAP()) it.y = Math.round(it.y * 20) / 20;
  } else {
    const p = rayPlane(e.clientX, e.clientY, gest.mount === 'decke' ? plan.height : 0); if (!p) return;
    let x = p.x + gest.offX, z = p.z + gest.offZ;
    if (SNAP()) { x = Math.round(x * 20) / 20; z = Math.round(z * 20) / 20; }
    it.x = clamp(x, bbox.x0 - 3, bbox.x1 + 3); it.z = clamp(z, bbox.z0 - 3, bbox.z1 + 3);
    if (gest.boxes) it.y = stackY(it, gest.boxes);
  }
  placeObj(it); selBox.update();
}
function onTap(h) {
  if (tool === 'farbe') {
    if (h && h.kind === 'wall' && h.side) paintWall(h.wall, h.side);
    else hint('Bitte direkt auf eine Wand tippen.');
    return;
  }
  if (tool === 'boden') {
    if (h && h.kind === 'floor') { pushUndo(); h.room.floor = bodenAktiv; delete h.room.foto; h.room && gFloors.children.forEach(m => { if (m.userData.room === h.room) m.material = floorMat(bodenAktiv); }); save(); inv(); hint(`${h.room.name}: ${BOEDEN[bodenAktiv].name}`); }
    else hint('Bitte auf einen Boden tippen.');
    return;
  }
  if (h && h.kind === 'item') { select(h.id); if (MOBIL) hint('Nochmal antippen und ziehen = verschieben'); return; }
  deselect();
  if (mode === 'gehen' && h && h.kind === 'floor') walk.target = { x: h.point.x, z: h.point.z };
}

// ---------- Streichen ----------
let farbe = WANDFARBEN[16];
function farbInfo(hex) { return WANDFARBEN.find(f => f.hex.toLowerCase() === String(hex).toLowerCase()) || { name: 'Wunschfarbe ' + hex, hex, kw: 'Wandfarbe abtönbar Mischfarbe' }; }
function paintWall(w, side) {
  pushUndo();
  const ganz = LS.get('rp3d-ganz') !== '0', room = sideRoom(w, side);
  let n = 0;
  let rb = false;
  if (ganz) { for (const o of plan.walls) for (const s of ['A', 'B']) if (sideRoom(o, s) === room) { rb = setWallColor(o, s, farbe.hex) || rb; n++; } }
  else { rb = setWallColor(w, side, farbe.hex); n = 1; }
  if (rb) buildStructure();
  save();
  hint(`${room ? room.name : 'Fassade'}: ${farbe.name}${ganz ? ` (${n} Wandflächen)` : ''}`);
}

// ---------- Panels ----------
let sheet = null, katAktiv = KATEGORIEN[0], bodenAktiv = 'eiche_hell';
const SHEETS = {
  moebel() {
    return ['Möbel hinzufügen', `<div class="tabs">${KATEGORIEN.map(k => `<button data-kat="${esc(k)}" class="${k === katAktiv ? 'on' : ''}">${esc(k)}</button>`).join('')}</div>
      <div class="grid">${Object.entries(MOEBEL).filter(([, d]) => d.kat === katAktiv).map(([id, d]) => `<button data-add="${id}"><span class="ic">${d.icon}</span><b>${esc(d.name)}</b><span class="mut">${cm(d.w)}×${cm(d.d)} cm</span></button>`).join('')}</div>
      <p class="note">Antippen = ins Bild stellen. Danach Möbel antippen und ziehen.</p>`];
  },
  farbe() {
    const g = LS.get('rp3d-ganz') !== '0';
    return ['Wände streichen', `<p class="mut">Farbe wählen, dann eine Wand antippen.</p>
      <label class="chk"><input type="checkbox" id="ganz" ${g ? 'checked' : ''}> ganzen Raum streichen</label>
      <div class="sw">${WANDFARBEN.map(f => `<button data-farbe="${f.hex}" title="${esc(f.name)}" aria-label="${esc(f.name)}" class="${f.hex === farbe.hex ? 'on' : ''}" style="background:${f.hex}"></button>`).join('')}</div>
      <div class="row"><input type="color" id="eigen" value="${farbe.hex}" aria-label="Eigene Farbe"><span><b>${esc(farbe.name)}</b><br><span class="mut">${esc(farbe.hex)}</span></span>${affLink(farbe.kw, 'Farbe')}</div>${AFF_NOTE}`];
  },
  boden() {
    const d = BOEDEN[bodenAktiv];
    return ['Boden wählen', `<p class="mut">Belag wählen, dann einen Raum-Boden antippen.</p>
      <div class="fl">${Object.entries(BOEDEN).map(([id, b]) => `<button data-boden="${id}" class="${id === bodenAktiv ? 'on' : ''}"><i style="background-image:url(${floorMat(id).userData.preview})"></i><span>${esc(b.name)}</span></button>`).join('')}</div>
      <div class="row"><button data-alle="1">Für alle Räume</button>${affLink(d.kw, d.name)}</div>${AFF_NOTE}`];
  },
  licht() {
    const L = plan.light, uhr = h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')} Uhr`;
    const ktxt = k => k < 3300 ? 'warmweiß' : k < 4800 ? 'neutralweiß' : 'tageslicht';
    return ['Beleuchtung', `<div class="row"><button data-tod="8">🌅 Morgen</button><button data-tod="13">☀️ Mittag</button><button data-tod="19">🌇 Abend</button><button data-tod="22.5">🌙 Nacht</button></div>
      <div class="ctl"><label>Tageszeit <b id="vTod">${uhr(L.tod)}</b><input type="range" id="tod" min="5" max="23.5" step="0.25" value="${L.tod}"></label></div>
      <div class="ctl"><label>Ausrichtung: Plan-Oben zeigt nach <b id="vNord">${['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'][Math.round(((L.nord % 360) + 360) % 360 / 45) % 8]}</b><input type="range" id="nord" min="0" max="359" step="1" value="${L.nord}"></label></div>
      <label class="chk"><input type="checkbox" id="lamps" ${L.lamps ? 'checked' : ''}> Lampen eingeschaltet</label>
      <div class="ctl"><label>Helligkeit Lampen <b id="vLevel">${Math.round(L.level * 100)} %</b><input type="range" id="level" min="0.1" max="2.5" step="0.05" value="${L.level}"></label></div>
      <div class="ctl"><label>Lichtfarbe <b id="vK">${L.kelvin} K · ${ktxt(L.kelvin)}</b><input type="range" id="kelvin" min="2200" max="6500" step="100" value="${L.kelvin}"></label></div>
      <div class="ctl"><label>Belichtung (Bildhelligkeit) <b id="vExp">${L.exposure.toFixed(2)}</b><input type="range" id="exposure" min="0.4" max="2.2" step="0.05" value="${L.exposure}"></label></div>
      <p class="note">Einzelne Lampe: Lampe antippen → „Licht an/aus“. Sonnenstand vereinfacht (Mitteleuropa, Frühling/Herbst).</p>`];
  },
  liste() {
    const H = plan.height, cnt = {};
    plan.items.forEach(it => { cnt[it.cat] = (cnt[it.cat] || 0) + 1; });
    const farben = {};
    for (const w of plan.walls) {
      const f = frame(w), op = w.open.reduce((s, o) => s + o.w * Math.min(o.h, H - (+o.sill || 0)), 0), A = Math.max(0, f.L * H - op);
      for (const s of ['A', 'B']) if (sideRoom(w, s)) farben[w['col' + s]] = (farben[w['col' + s]] || 0) + A;
    }
    const boeden = {}; plan.rooms.forEach(r => { boeden[r.floor] = (boeden[r.floor] || 0) + area(r.poly); });
    const mo = Object.entries(cnt).sort((a, b) => MOEBEL[a[0]].kat.localeCompare(MOEBEL[b[0]].kat)).map(([c, n]) => `<li><span>${n}× ${MOEBEL[c].icon} ${esc(MOEBEL[c].name)}</span>${affLink(MOEBEL[c].kw, 'Amazon')}</li>`).join('') || '<li class="mut">Noch keine Möbel.</li>';
    const fa = Object.entries(farben).map(([hex, A]) => { const p = farbInfo(hex); return `<li><span><i class="dot" style="background:${hex}"></i>${esc(p.name)}: ca. ${A.toFixed(0)} m² → ca. ${Math.ceil(A * 2 / 7)} l</span>${affLink(p.kw, 'Amazon')}</li>`; }).join('');
    const bo = Object.entries(boeden).map(([id, A]) => `<li><span>${esc(BOEDEN[id].name)}: ca. ${(A * 1.1).toFixed(1)} m²</span>${affLink(BOEDEN[id].kw, 'Amazon')}</li>`).join('');
    return ['Einkaufsliste', `<h3>Möbel & Lampen</h3><ul class="li">${mo}</ul>
      <h3>Wandfarbe</h3><ul class="li">${fa}</ul><p class="note">Fläche abzüglich Fenster/Türen, 2 Anstriche, rund 7 m² je Liter.</p>
      <h3>Bodenbelag</h3><ul class="li">${bo}</ul><p class="note">Fläche bis Wandmitte gerechnet, inkl. 10 % Verschnitt.</p>
      <div class="row"><button data-copy="1">📋 Liste kopieren</button></div>${AFF_NOTE}`];
  },
  menu() {
    return ['Menü', `<div class="list">
      <button data-m="start" class="main">🗂 Projekte · Neues Projekt</button>
      <button data-m="scannen">📹 Raum aufnehmen – einfach durchgehen</button>
      <button data-m="aufmessen">📏 Raum aufmessen – Ecken antippen</button>
      <button data-m="raum">📐 Neuer Raum nach Maß (eintippen)</button>
      <button data-m="beispiel">🏠 Beispielwohnung laden</button>
      <button data-m="speichern">💾 Projekt als Datei speichern</button>
      <button data-m="teilen">📤 Raum teilen (Datei senden)</button>
      <button data-m="oeffnen">📂 Projekt-Datei öffnen</button>
      <button data-m="foto">📷 Foto der Ansicht speichern</button>
      <button data-m="leeren" class="no">🧹 Alle Möbel entfernen</button>
      <button data-m="hilfe">❓ Hilfe</button></div>
      <h3>Einstellungen</h3>
      <label class="chk"><input type="checkbox" id="snap" ${SNAP() ? 'checked' : ''}> Einrasten (5 cm / 15°)</label>
      <label class="chk"><input type="checkbox" id="fotos" ${SHOWF() ? 'checked' : ''}> Fotos vom Scan auf Wänden/Boden zeigen</label>
      <label class="chk"><input type="checkbox" id="wolke" ${SHOWW() ? 'checked' : ''}> Gescannte Einrichtung zeigen (Punkte)</label>
      <label>Projektname<input id="pname" value="${esc(plan.name)}" maxlength="40" autocomplete="off"></label>
      <label style="margin-top:8px">Amazon-Partner-ID (Tracking-ID)<input id="tag" value="${esc(affTag)}" autocomplete="off" spellcheck="false"></label>
      <p class="note">Raumplan 3D · Version ${VERSION} · Kopie der Raumplan-App mit 3D-Rundgang. Alles bleibt in deinem Browser gespeichert.</p>`];
  },
  raum() {
    return ['Neuer Raum nach Maß', `<button data-m="scannen" class="main" style="width:100%">📹 Lieber mit dem Handy scannen</button>
      <p class="mut">Oder Innenmaße eintippen:</p><form id="fRaum">
      <label>Name<input name="n" value="Mein Raum" maxlength="40"></label>
      <div class="row"><label>Länge (m)<input name="l" type="number" inputmode="decimal" step="0.01" min="1" max="30" value="5.00" required></label>
      <label>Breite (m)<input name="b" type="number" inputmode="decimal" step="0.01" min="1" max="30" value="4.00" required></label>
      <label>Höhe (m)<input name="h" type="number" inputmode="decimal" step="0.01" min="1.8" max="6" value="2.60" required></label></div>
      <div class="row"><label>Fenster<select name="f"><option>0</option><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label>
      <label>Tür<select name="t"><option value="1" selected>ja</option><option value="0">nein</option></select></label></div>
      <p class="mut">Innenmaße eingeben. Es wird ein neues Projekt angelegt.</p>
      <button class="main" style="width:100%">Raum erstellen</button></form>`];
  },
  aufmass() {
    const ws = plan.walls.filter(w => w.innen), A = plan.rooms[0] ? area(plan.rooms[0].poly) : 0, am = plan.aufmass || {};
    const k = am.korr && am.korr !== 1 ? ` · korrigiert um ${((am.korr - 1) * 100).toFixed(1).replace('.', ',')} %` : '';
    const hq = { ar: '(gemessen)', scan: '(aus Scan)', 'geschätzt': '(geschätzt)' }[plan.hoeheQuelle] || '(Standard)';
    const hw = (am.hinweise || []).map(h => `<p class="mut">⚠ ${esc(h)}</p>`).join('');
    const pw = plan.wolke ? `<label class="chk"><input type="checkbox" id="wolke2" ${SHOWW() ? 'checked' : ''}> Echte Einrichtung zeigen (${Math.round(plan.wolke.n / 1000)} Tsd. Punkte) – aus = leerer Raum zum Planen</label>` : '';
    return [am.art === 'scan' ? 'Scan fertig' : 'Aufmaß fertig', `<p><b>${esc(plan.name)}</b>: ${ws.length} Wände · ${A.toFixed(2).replace('.', ',')} m² · Höhe ${plan.height.toFixed(2).replace('.', ',')} m ${hq} · ${am.fotos || 0} Fotos${k}</p>${hw}${pw}
      <ul class="li">${ws.map((w, i) => `<li><span>Wand ${i + 1}</span><b>${(w.innen * 100).toFixed(1).replace('.', ',')} cm</b></li>`).join('')}</ul>
      <h3>Genauer machen: Kontrollmaß</h3>
      <p class="mut">${am.art === 'scan' ? 'Der Scan trifft die Maße typisch auf einige Zentimeter.' : 'Die Handy-Messung ist auf etwa ±1–2 % genau.'} Miss eine lange Wand mit Maßband oder Laser und trag das echte Maß ein. Der ganze Raum wird darauf umgerechnet.</p>
      <div class="row"><select id="kmWand" aria-label="Wand">${ws.map((w, i) => `<option value="${i}">Wand ${i + 1} (${(w.innen * 100).toFixed(0)} cm)</option>`).join('')}</select>
      <input id="kmCm" type="number" inputmode="decimal" step="0.1" placeholder="echtes Maß in cm" aria-label="Echtes Maß in cm"><button data-km="1" class="main">Übernehmen</button></div>
      <div class="list" style="margin-top:10px"><button data-m="teilen">📤 Raum teilen (z. B. an Claude → eigene Kachel in der App-Zentrale)</button>${letzterRoh ? '<button data-m="roh">🛠 Scan-Rohdaten senden (wenn etwas nicht stimmt)</button>' : ''}</div>
      <p class="note">Danach: 🚶 Gehen, ➕ Möbel stellen, 🎨 streichen. Fotos und Einrichtung aus/ein: Menü → Einstellungen.</p>`];
  },
  keintiefe() {
    return ['Scannen nicht möglich', `<p>Dieses Handy liefert im Browser keine Tiefendaten (ARCore Depth). Das Scannen im Durchgehen geht damit nicht.</p>
      <div class="list"><button data-m="aufmessen" class="main">📏 Stattdessen Ecken antippen</button><button data-m="raum">📐 Maße eintippen</button></div>
      <p class="note">${esc(scanFehler)}</p>`];
  },
  scanfehler() {
    return ['Scan nicht auswertbar', `<p><b>${esc(scanFehler)}</b></p>
      <ul class="help"><li>Langsam gehen und schwenken, Raum gut beleuchten.</li><li>Jede Wand vom Boden bis zur Decke filmen, auch die Ecken.</li><li>Einmal ganz im Kreis drehen, dann durch den Raum gehen.</li></ul>
      <div class="list"><button data-m="scannen" class="main">📹 Nochmal scannen</button><button data-m="aufmessen">📏 Ecken antippen</button>${letzterRoh ? '<button data-m="roh">🛠 Scan-Rohdaten senden (zur Fehlersuche an Claude)</button>' : ''}</div>`];
  },
  keinar() {
    return ['Aufmessen nicht möglich', `<p>Dieses Gerät bzw. dieser Browser kann kein AR im Browser.</p>
      <ul class="help"><li><b>Android-Handy</b> (z. B. Samsung S25): Seite in <b>Chrome</b> öffnen. „Google Play-Dienste für AR“ muss installiert sein (Play Store).</li>
      <li><b>iPhone</b>: Safari kann das derzeit nicht. Bitte Maße mit dem Maßband nehmen und unter „Neuer Raum nach Maß“ eintippen.</li>
      <li><b>PC</b>: geht nicht, Kamera und Bewegungssensoren fehlen.</li></ul>
      <button data-m="raum" style="width:100%">📐 Maße eintippen</button>`];
  },
  hilfe() {
    return ['So geht’s', `<ul class="help">
      <li><b>Eigenen Raum holen:</b> ☰ Menü → „🗂 Projekte“ → „📹 Neues Projekt: Raum aufnehmen“ (Android-Handy, Chrome). Langsam durchgehen und alles abfilmen, „Fertig“ – der Raum steht als 3D-Modell da.</li>
      <li><b>Ansicht oben:</b> 🚶 Gehen = durch die Wohnung laufen · 🏠 Haus = von schräg oben drehen · ⬛ Plan = Grundriss.</li>
      <li><b>Gehen:</b> ${MOBIL ? 'linker Kreis = laufen, rechts wischen = umsehen, Boden antippen = hingehen.' : 'W A S D oder Pfeiltasten, Maus ziehen = umsehen, Boden klicken = hingehen, Mausrad = vor/zurück.'}</li>
      <li><b>Möbel verschieben:</b> antippen (blauer Rahmen), dann nochmal drauf und ziehen. Drehen, Farbe, Kopie und Löschen im Feld unten.</li>
      <li><b>➕ Möbel:</b> Kategorie wählen, Möbel antippen. Bilder und Spiegel hängen sich an die nächste Wand.</li>
      <li><b>🎨 Wände:</b> Farbe wählen, Wand antippen. „ganzen Raum“ streicht alle Wände des Raums.</li>
      <li><b>💡 Licht:</b> Tageszeit, Himmelsrichtung, Lampen, Lichtfarbe.</li>
      <li><b>🛒 Einkauf:</b> alles im Plan mit Menge, Farbe in Litern und Boden in m².</li>
      <li><b>↶</b> macht den letzten Schritt rückgängig.</li></ul>`];
  },
};
function openSheet(name) {
  sheet = name; tool = name === 'farbe' ? 'farbe' : name === 'boden' ? 'boden' : 'auswahl';
  if (tool !== 'auswahl') deselect();
  if (selId && name) $('#sel').hidden = true;
  const [title, body] = SHEETS[name]();
  $('#shTitle').textContent = title; $('#shBody').innerHTML = body; $('#sheet').hidden = false;
  document.querySelectorAll('#tools button').forEach(b => b.classList.toggle('on', b.dataset.t === name));
  bindSheet(name);
}
function closeSheet(keepSel) {
  sheet = null; tool = 'auswahl'; $('#sheet').hidden = true;
  document.querySelectorAll('#tools button').forEach(b => b.classList.remove('on'));
  if (!keepSel && selId) renderSel();
}
$('#shX').onclick = () => closeSheet();
document.querySelectorAll('#tools button').forEach(b => { b.onclick = () => (sheet === b.dataset.t ? closeSheet() : openSheet(b.dataset.t)); });
document.querySelectorAll('#views button').forEach(b => { b.onclick = () => setMode(b.dataset.v); });
$('#bUndo').onclick = doUndo;

function bindSheet(name) {
  const body = $('#shBody');
  if (name === 'licht') {
    const L = plan.light, on = (id, fn) => { const el = $('#' + id); el.oninput = () => { fn(+el.value); applyLight(); save(); }; el.onpointerdown = el.onkeydown = pushUndoLight; };
    on('tod', v => { L.tod = v; $('#vTod').textContent = `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')} Uhr`; });
    on('nord', v => { L.nord = v; $('#vNord').textContent = ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'][Math.round(v / 45) % 8]; });
    on('level', v => { L.level = v; $('#vLevel').textContent = Math.round(v * 100) + ' %'; });
    on('kelvin', v => { L.kelvin = v; $('#vK').textContent = `${v} K · ${v < 3300 ? 'warmweiß' : v < 4800 ? 'neutralweiß' : 'tageslicht'}`; });
    on('exposure', v => { L.exposure = v; $('#vExp').textContent = v.toFixed(2); });
    $('#lamps').onchange = e => { L.lamps = e.target.checked; applyLamps(); save(); };
  }
  if (name === 'farbe') {
    $('#ganz').onchange = e => LS.set('rp3d-ganz', e.target.checked ? '1' : '0');
    $('#eigen').oninput = e => { farbe = farbInfo(e.target.value); };
    $('#eigen').onchange = () => openSheet('farbe');
  }
  if (name === 'aufmass' && $('#wolke2')) $('#wolke2').onchange = e => { LS.set('rp3d-wolke', e.target.checked ? '1' : '0'); baueWolke(); applyLight(); };
  if (name === 'menu') {
    $('#snap').onchange = e => LS.set('rp3d-snap', e.target.checked ? '1' : '0');
    $('#fotos').onchange = e => { LS.set('rp3d-fotos', e.target.checked ? '1' : '0'); buildStructure(); inv(); };
    $('#wolke').onchange = e => { LS.set('rp3d-wolke', e.target.checked ? '1' : '0'); baueWolke(); applyLight(); };
    $('#pname').onchange = e => { plan.name = e.target.value.trim().slice(0, 40) || plan.name; $('#sub').textContent = plan.name; save(); hint('Projektname gespeichert'); };
    $('#tag').onchange = e => { affTag = e.target.value.trim() || AFF_DEFAULT; LS.set('rp3d-tag', affTag); hint('Partner-ID gespeichert: ' + affTag); };
  }
  if (name === 'raum') {
    $('#fRaum').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target), n = k => parseFloat(String(f.get(k)).replace(',', '.'));
      const L = n('l'), B = n('b'), H = n('h');
      if (!(L >= 1 && B >= 1 && H >= 1.8)) return hint('Bitte gültige Maße eingeben (mind. 1 m, Höhe mind. 1,8 m).');
      neuesProjekt(rechteckRaum(String(f.get('n') || 'Mein Raum').slice(0, 40), L, B, H, +f.get('f'), f.get('t') === '1'));
      closeSheet(); setMode('haus'); hint(`Raum ${L.toFixed(2)} × ${B.toFixed(2)} m erstellt. ➕ Möbel hinzufügen!`);
    };
  }
  body.onclick = e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.kat) { katAktiv = d.kat; openSheet('moebel'); }
    else if (d.add) addItem(d.add);
    else if (d.farbe) { farbe = farbInfo(d.farbe); openSheet('farbe'); hint(`${farbe.name} – jetzt Wand antippen`); }
    else if (d.boden) { bodenAktiv = d.boden; openSheet('boden'); hint(`${BOEDEN[bodenAktiv].name} – jetzt Boden antippen`); }
    else if (d.alle) { pushUndo(); plan.rooms.forEach(r => { r.floor = bodenAktiv; delete r.foto; }); gFloors.children.forEach(m => { m.material = floorMat(bodenAktiv); }); save(); inv(); }
    else if (d.tod) { pushUndo(); plan.light.tod = +d.tod; plan.light.lamps = +d.tod > 18 || +d.tod < 7; applyLight(); save(); openSheet('licht'); }
    else if (d.copy) copyList();
    else if (d.m) menuAction(d.m);
    else if (d.km) kontrollmass();
  };
}
let lightUndoT = 0;
function pushUndoLight() { const now = Date.now(); if (now - lightUndoT > 1500) pushUndo(); lightUndoT = now; }

function addItem(cat) {
  const def = MOEBEL[cat]; pushUndo();
  const it = { id: uid(), cat, x: 0, z: 0, rot: 0 };
  let x, z, rot;
  if (mode === 'gehen') { const d = Math.max(1, def.d / 2 + 1); x = walk.x - Math.sin(walk.yaw) * d; z = walk.z - Math.cos(walk.yaw) * d; rot = Math.round(walk.yaw / (Math.PI / 2)) * (Math.PI / 2); }
  else { x = orb.tx; z = orb.tz; rot = mode === 'plan' ? 0 : Math.round(orb.th / (Math.PI / 2)) * (Math.PI / 2); }
  it.x = x; it.z = z; it.rot = rot;
  plan.items.push(it);
  if (def.mount === 'wand') hangOnWall(it, x, z);
  if (def.stack) it.y = stackY(it, itemBoxes());
  makeObj(it); applyLamps(); select(it.id); save();
  hint(def.mount === 'wand' ? 'An die Wand gehängt – ziehen zum Verschieben' : 'Zum Verschieben nochmal antippen und ziehen');
}

function renderSel() {
  const it = itemById(selId); if (!it) return deselect();
  const def = MOEBEL[it.cat], el = $('#sel'), col = it.color || def.farbe;
  el.innerHTML = `<div class="sh-head"><b>${def.icon} ${esc(def.name)}</b><span class="mut">${cm(def.w)}×${cm(def.d)}×${cm(def.h)} cm</span><button data-a="x" aria-label="Auswahl aufheben">✕</button></div>
    <div class="row"><button data-a="l" title="15° nach links">⟲ 15°</button><button data-a="r" title="15° nach rechts">⟳ 15°</button><button data-a="r90">↻ 90°</button>
    ${def.mount === 'wand' ? '<button data-a="up">⬆</button><button data-a="dn">⬇</button>' : ''}</div>
    <div class="row"><button data-a="dup">⧉ Kopie</button>${def.light ? `<button data-a="on">💡 Licht ${it.on === false ? 'ein' : 'aus'}</button>` : ''}<button data-a="del" class="no">🗑 Löschen</button></div>
    <div class="sw">${MOEBELFARBEN.map(c => `<button data-c="${c}" aria-label="Farbe ${c}" class="${c === col ? 'on' : ''}" style="background:${c}"></button>`).join('')}<input type="color" id="selCol" value="${col}" aria-label="Eigene Farbe"></div>
    <div class="row">${affLink(def.kw)}</div>${AFF_NOTE}`;
  el.hidden = false;
  el.onclick = e => { const t = e.target.closest('button'); if (!t) return; selAction(t.dataset.a, t.dataset.c); };
  $('#selCol').onchange = e => selAction(null, e.target.value);
}
function selAction(a, c) {
  const it = itemById(selId); if (!it) return; const def = MOEBEL[it.cat], step = Math.PI / 12;
  if (a === 'x') return deselect();
  pushUndo();
  if (a === 'l' || a === 'r') { it.rot = (it.rot || 0) + (a === 'l' ? step : -step); if (SNAP()) it.rot = Math.round(it.rot / step) * step; }
  else if (a === 'r90') it.rot = (it.rot || 0) - Math.PI / 2;
  else if (a === 'up' || a === 'dn') it.y = clamp((it.y ?? def.y) + (a === 'up' ? 0.05 : -0.05), def.h / 2 + 0.05, plan.height - def.h / 2);
  else if (a === 'on') { it.on = it.on === false; applyLamps(); }
  else if (a === 'del') { removeObj(it.id); plan.items = plan.items.filter(i => i !== it); deselect(); save(); applyLamps(); hint('Gelöscht – ↶ holt es zurück'); return; }
  else if (a === 'dup') {
    const n = { ...it, id: uid(), x: it.x + 0.3 * Math.cos(it.rot || 0), z: it.z - 0.3 * Math.sin(it.rot || 0) };
    plan.items.push(n); makeObj(n); applyLamps(); select(n.id); save(); return;
  }
  if (c) { it.color = c; removeObj(it.id); makeObj(it); applyLamps(); }
  placeObj(it); select(it.id); save();
}

// ---------- Aufmessen ----------
const KEIN_AR = 'Aufnehmen geht nur am Android-Handy in Chrome (mit „Google Play-Dienste für AR“).';
// Ohne offenes Projekt zurück zur Startseite, sonst Meldung über dem Plan
const zurueck = (msg, blatt) => { if (!aktId && !PLAN_URL) zeigeStart(msg); else if (blatt) openSheet(blatt); else hint(msg, 6000); };
async function aufmessen() {
  if (!(await arVerfuegbar())) return zurueck(KEIN_AR, 'keinar');
  $('#start').hidden = true; closeSheet(); deselect();
  let res;
  try { res = await starteAufmass($('#arUI')); }
  catch (e) { return zurueck(e.message + ' – Kamera-Erlaubnis erteilt? ARCore installiert?'); }
  if (!res) return zurueck('Aufmessen abgebrochen.');
  await ladeAufmass(res, 'Raum ' + new Date().toLocaleDateString('de-AT'));
}
let scanFehler = '';
async function scannen() {
  const test = window.rp3dTestScan;      // nur für automatische Tests: liefert einen simulierten Roh-Scan statt der Kamera
  if (!test && !(await arVerfuegbar())) return zurueck(KEIN_AR, 'keinar');
  $('#start').hidden = true; closeSheet(); deselect();
  let roh;
  try { roh = test ? await test() : await starteScan($('#arUI')); }
  catch (e) { scanFehler = e.message; return openSheet(e.keineTiefe ? 'keintiefe' : 'scanfehler'); }
  if (!roh) return zurueck('Aufnahme abgebrochen (mindestens 25 Aufnahmen nötig).');
  await ladeScan(roh, 'Raum ' + new Date().toLocaleDateString('de-AT'));
}
async function ladeScan(roh, name) {
  hint('Scan wird ausgewertet …', 60000); await new Promise(r => setTimeout(r, 30));
  try { letzterRoh = rohKompakt(roh); } catch { letzterRoh = null; }
  let res;
  try { res = await auswerten(roh, t => hint(t, 60000)); }
  catch (e) { scanFehler = e.message; hint('Scan nicht auswertbar', 4000); openSheet('scanfehler'); return null; }
  const p = await ladeAufmass(res, name); if (p) { p.aufmass.info = res.info; save(); }
  return p;
}
async function ladeAufmass(res, name) {
  hint('3D-Modell wird gebaut …', 60000);
  const id = 'a' + Date.now().toString(36);
  const { plan: p, tex, wolke } = await modellAusAufmass(res, name, id, t => hint(t, 60000));
  if (wolke) { const k = id + '-wolke'; wolken.set(k, wolke); p.wolke = { key: k, n: wolke.pos.length / 3 }; try { await idb.put(k, wolke); } catch { /* nur für diese Sitzung */ } }
  for (const [k, cv] of tex) {
    fotoTex.set(k, texAus(new THREE.CanvasTexture(cv)));
    try { const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85)); await idb.put(k, blob); } catch { /* nur für diese Sitzung */ }
  }
  neuesProjekt(p); setMode('haus'); openSheet('aufmass');
  hint(`Fertig: ${p.walls.length} Wände, ${tex.size} Fotoflächen${wolke ? ', Einrichtung als Punkte' : ''}`);
  return p;
}
function kontrollmass() {
  const ws = plan.walls.filter(w => w.innen), w = ws[+$('#kmWand').value], cmv = parseFloat(String($('#kmCm').value).replace(',', '.'));
  if (!w || !(cmv > 20)) return hint('Bitte das echte Maß in cm eintragen.');
  const k = cmv / 100 / w.innen;
  if (k < 0.85 || k > 1.15) return hint(`Abweichung ${((k - 1) * 100).toFixed(1)} % – zu groß. Richtige Wand gewählt?`, 5000);
  pushUndo(); skaliere(plan, k); rebuild(false); save(); openSheet('aufmass');
  hint(`Raum um ${((k - 1) * 100).toFixed(1).replace('.', ',')} % umgerechnet`);
}

function copyList() {
  const cnt = {}; plan.items.forEach(it => { cnt[it.cat] = (cnt[it.cat] || 0) + 1; });
  const txt = `Einkaufsliste – ${plan.name}\n` + Object.entries(cnt).map(([c, n]) => `${n}× ${MOEBEL[c].name}`).join('\n');
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => hint('Liste kopiert'), () => hint('Kopieren nicht möglich'));
}
function download(name, data) { const a = document.createElement('a'); a.href = data; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function menuAction(m) {
  if (m === 'raum' || m === 'hilfe') return openSheet(m);
  if (m === 'aufmessen') return aufmessen();
  if (m === 'scannen') return scannen();
  if (m === 'beispiel') { oeffneBeispiel(); closeSheet(); hint('Beispielwohnung geöffnet'); }
  if (m === 'start') zeigeStart();
  if (m === 'speichern') exportPlan();
  if (m === 'teilen') exportPlan(true);
  if (m === 'roh' && letzterRoh) teilen(`scan-roh-${letzterRoh.datum.slice(0, 16).replace(/[:T]/g, '-')}.txt`, JSON.stringify(letzterRoh));
  if (m === 'oeffnen') $('#file').click();
  if (m === 'foto') { selBox.visible = false; renderer.render(scene, camera); download('raumplan-3d.png', canvas.toDataURL('image/png')); selBox.visible = !!selId; inv(); }
  if (m === 'leeren') { if (!confirm('Alle Möbel aus dem Plan entfernen? (↶ holt sie zurück)')) return; pushUndo(); plan.items = []; buildItems(); deselect(); save(); hint('Alle Möbel entfernt'); }
}
// Projektdatei enthält auch die Fotos und die Punktwolke, damit der Raum auf jedem Gerät gleich aussieht
const b64 = u8 => { let t = ''; for (let i = 0; i < u8.length; i += 8192) t += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(t); };
const unb64 = t => Uint8Array.from(atob(t), ch => ch.charCodeAt(0));
// Teilen über das Android-Menü (Drive, Claude, Mail). Chrome teilt keine .json-Dateien, deshalb .txt.
async function teilen(name, text) {
  const file = new File([text], name, { type: 'text/plain' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } }
  catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(file); download(name, url); setTimeout(() => URL.revokeObjectURL(url), 5000); hint('Datei liegt im Download-Ordner: ' + name, 6000);
}
async function exportPlan(zumTeilen = false) {
  hint('Datei wird erstellt …', 20000);
  const out = JSON.parse(snapshot()), daten = { fotos: {}, wolken: {} }, keys = new Set();
  for (const w of plan.walls) for (const f of [w.fotoA, w.fotoB]) if (f) keys.add(f.key);
  for (const r of plan.rooms) if (r.foto) keys.add(r.foto.key);
  for (const k of keys) { try { const blob = await idb.get(k); if (blob) daten.fotos[k] = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); }); } catch { /* Foto fehlt */ } }
  const w = plan.wolke && wolken.get(plan.wolke.key);
  if (w) daten.wolken[plan.wolke.key] = { pos: b64(new Uint8Array(w.pos.buffer, w.pos.byteOffset, w.pos.byteLength)), col: b64(w.col) };
  if (Object.keys(daten.fotos).length || w) out.daten = daten;
  const uml = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue', 'ß': 'ss' };
  const datei = 'raumplan-3d-' + plan.name.replace(/[äöüÄÖÜß]/g, ch => uml[ch]).replace(/[^\w-]+/g, '_'), text = JSON.stringify(out);
  if (zumTeilen) { hint('', 1); return teilen(datei + '.txt', text); }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  download(datei + '.json', url); setTimeout(() => URL.revokeObjectURL(url), 5000);
  hint('Projekt gespeichert (mit Fotos' + (w ? ' und Einrichtung' : '') + ')');
}
// Rohdaten des letzten Scans klein verpackt (Lagen, Tiefenraster, Bilder als kleines JPEG): damit lässt sich
// ein misslungener Scan am PC genau nachrechnen. Datei öffnen = neu auswerten.
let letzterRoh = null;
function rohKompakt(roh) {
  const big = document.createElement('canvas'), cv = document.createElement('canvas'), cx = cv.getContext('2d'), kf = [];
  for (const f of roh.kf) {
    let img = null;
    if (f.img) { big.width = f.img.W; big.height = f.img.H; big.getContext('2d').putImageData(new ImageData(f.img.data, f.img.W, f.img.H), 0, 0); cv.width = Math.round(f.img.W / 2); cv.height = Math.round(f.img.H / 2); cx.drawImage(big, 0, 0, cv.width, cv.height); img = cv.toDataURL('image/jpeg', 0.6); }
    kf.push({ M: Array.from(f.M, v => +v.toFixed(5)), P: Array.from(f.P, v => +v.toFixed(6)), GW: f.GW, GH: f.GH, z: b64(new Uint8Array(f.z.buffer, f.z.byteOffset, f.z.byteLength)), img });
  }
  return { typ: 'rp3d-roh', v: 1, datum: new Date().toISOString(), geraet: navigator.userAgent, kf };
}
async function rohLaden(o) {
  const kf = [], c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
  for (const f of o.kf) {
    let img = null;
    if (f.img && /^data:image\/jpeg;base64,/.test(f.img)) { const im = new Image(); im.src = f.img; await im.decode(); c.width = im.width; c.height = im.height; x.drawImage(im, 0, 0); img = { data: x.getImageData(0, 0, c.width, c.height).data, W: c.width, H: c.height }; }
    const zb = unb64(f.z); kf.push({ M: Float32Array.from(f.M), P: Float32Array.from(f.P), GW: f.GW, GH: f.GH, z: new Uint16Array(zb.buffer, 0, zb.byteLength >> 1), img });
  }
  return { kf };
}
async function importPlan(p) {
  if (p.typ === 'rp3d-roh') { closeSheet(); return ladeScan(await rohLaden(p), 'Scan ' + String(p.datum || '').slice(0, 10)); }
  const d = p.daten; delete p.daten;
  if (d) {
    for (const [k, url] of Object.entries(d.fotos || {})) { if (!/^data:image\/(jpeg|png);base64,/.test(url)) continue; try { const blob = await (await fetch(url)).blob(); await idb.put(k, blob); } catch { /* ohne dieses Foto */ } }
    for (const [k, v] of Object.entries(d.wolken || {})) { try { const pb = unb64(v.pos), w = { pos: new Float32Array(pb.buffer, 0, pb.byteLength >> 2), col: unb64(v.col) }; wolken.set(k, w); await idb.put(k, w); } catch { /* ohne Punktwolke */ } }
  }
  if (PLAN_URL) { normalize(p); await ladeFotos(); rebuild(); deselect(); saveNow(); }
  else { neuesProjekt(p); if (await ladeFotos()) { buildStructure(); baueWolke(); applyLight(); } setMode('haus'); }
  closeSheet();
}
$('#file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const p = JSON.parse(await f.text()), roh = p.typ === 'rp3d-roh'; await importPlan(p); if (!roh) hint('Projekt geöffnet: ' + plan.name); }
  catch (err) { hint('Datei nicht lesbar: ' + err.message, 5000); }
};

// ---------- Tastatur ----------
const keys = new Set();
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,select,textarea')) return;
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); return doUndo(); }
  if (e.code === 'Escape') { deselect(); closeSheet(); return; }
  if (selId && (e.code === 'Delete' || e.code === 'Backspace')) { e.preventDefault(); return selAction('del'); }
  if (selId && e.code === 'KeyR') return selAction(e.shiftKey ? 'l' : 'r');
  keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- Joystick ----------
const joy = { x: 0, y: 0 }; let joyId = null;
const joyEl = $('#joy'), knob = $('#knob');
function joyMove(e) {
  const r = joyEl.getBoundingClientRect(), R = r.width / 2; let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  joy.x = Math.abs(x) < 0.12 ? 0 : x; joy.y = Math.abs(y) < 0.12 ? 0 : y;
  knob.style.transform = `translate(${x * R * 0.6}px,${y * R * 0.6}px)`;
}
joyEl.addEventListener('pointerdown', e => { joyId = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); e.preventDefault(); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; joy.x = joy.y = 0; knob.style.transform = ''; };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);

// ---------- Schleife ----------
function step(dt) {
  if (mode !== 'gehen') {
    let f = 0; if (keys.has('Equal') || keys.has('NumpadAdd')) f = -1; if (keys.has('Minus') || keys.has('NumpadSubtract')) f = 1;
    if (f) { zoom(1 + f * dt * 1.5); return true; }
    return false;
  }
  let f = 0, s = 0, turn = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
  if (keys.has('KeyD')) s += 1; if (keys.has('KeyA')) s -= 1;
  if (keys.has('ArrowLeft') || keys.has('KeyQ')) turn += 1; if (keys.has('ArrowRight') || keys.has('KeyE')) turn -= 1;
  f -= joy.y; s += joy.x;
  if (f || s || turn) {
    walk.target = null;
    const sp = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3 : 1.4) * dt, sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw);
    walk.yaw += turn * 1.8 * dt;
    [walk.x, walk.z] = collide(walk.x + (-sy * f + cy * s) * sp, walk.z + (-cy * f - sy * s) * sp);
    applyCam(); return true;
  }
  if (walk.target) {
    const dx = walk.target.x - walk.x, dz = walk.target.z - walk.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { walk.target = null; return false; }
    const sp = Math.min(d, 2.2 * dt), [nx, nz] = collide(walk.x + dx / d * sp, walk.z + dz / d * sp);
    if (Math.hypot(nx - walk.x, nz - walk.z) < sp * 0.3) walk.target = null;
    walk.x = nx; walk.z = nz; applyCam(); return true;
  }
  return false;
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (step(dt)) dirty = true;
  if (dirty) { dirty = false; if (selId) selBox.update(); renderer.render(scene, camera); }
  requestAnimationFrame(loop);
}
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); inv(); }
addEventListener('resize', resize);

// ---------- Start ----------
// Altbestand (bis Version 1.2 gab es nur eine Planung) als erstes Projekt übernehmen
if (!PLAN_URL && !projekte.length) { const alt = LS.get('rp3d-plan'); if (alt) { try { const p = JSON.parse(alt), id = neueId(); LS.set('rp3d-p:' + id, alt); projekte.push({ id, name: p.name || 'Mein Plan', t: Date.now() }); listeSichern(); LS.set('rp3d-akt', id); } catch { /* unlesbar */ } } }
let geladen = false;
try {
  if (PLAN_URL) { const s = LS.get(skey()); if (s) { normalize(JSON.parse(s)); geladen = true; } }
  else { const id = LS.get('rp3d-akt'); if (id && projekte.some(q => q.id === id)) { normalize(JSON.parse(LS.get('rp3d-p:' + id))); aktId = id; geladen = true; } }
} catch { geladen = false; aktId = null; }
if (!geladen) normalize(beispiel());      // Vorschau im Hintergrund, wird erst mit der ersten Änderung ein Projekt
resize(); rebuild(); setMode('haus');
zeigeStart();
arVerfuegbar().then(ok => { arOk = ok; if (!$('#start').hidden) zeigeStart(); });
requestAnimationFrame(loop);
// für Tests/Automatisierung
window.rp3d = { get plan() { return plan; }, get projekte() { return projekte; }, get aktId() { return aktId; }, setMode, openSheet, select, addItem, inv, ladeAufmass, ladeScan, exportPlan, importPlan, zeigeStart, get mode() { return mode; } };
ladeFotos().then(n => { if (n) { buildStructure(); baueWolke(); applyLight(); } });
// Verlinkter Raum (z. B. aus der App-Zentrale): index.html?plan=raeume/buero.json – nur vom eigenen Server
if (PLAN_URL && !geladen) {
  const u = new URL(PLAN_URL, location.href);
  if (u.origin === location.origin) fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(importPlan).then(() => { setMode('haus'); hint('Raum geladen: ' + plan.name); }).catch(e => hint('Raum konnte nicht geladen werden: ' + e.message, 6000));
}
