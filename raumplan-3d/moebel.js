// Möbelkatalog: jedes Möbel wird aus einfachen Grundkörpern gebaut.
// Ursprung = Mitte der Grundfläche am Boden, Vorderseite zeigt nach +z.
// Wandmöbel (mount 'wand'): Ursprung = Mitte des Möbels. Deckenmöbel: Ursprung = Decke.
import * as THREE from './lib/three.module.min.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const geoCache = new Map();
const matCache = new Map();

export function mat(color, rough = 0.75, metal = 0) {
  const k = color + '|' + rough + '|' + metal;
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }); matCache.set(k, m); }
  return m;
}
export function shade(hex, l) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, l); return '#' + c.getHexString(); }
function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function mesh(g, geo, m) { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
// Quader: Breite, Höhe, Tiefe, Mitte x, Unterkante y, Mitte z
function B(g, w, h, d, x, y, z, m, ry = 0) { const o = mesh(g, BOX, m); o.scale.set(w, h, d); o.position.set(x, y + h / 2, z); if (ry) o.rotation.y = ry; return o; }
function C(g, rt, rb, h, x, y, z, m, seg = 20) {
  const k = 'c' + rt + ',' + rb + ',' + seg;
  let geo = geoCache.get(k); if (!geo) { geo = new THREE.CylinderGeometry(rt, rb, 1, seg); geoCache.set(k, geo); }
  const o = mesh(g, geo, m); o.scale.y = h; o.position.set(x, y + h / 2, z); return o;
}
function S(g, r, x, y, z, m, sy = 1, detail = 1) {
  const k = 'i' + detail; let geo = geoCache.get(k); if (!geo) { geo = new THREE.IcosahedronGeometry(1, detail); geoCache.set(k, geo); }
  const o = mesh(g, geo, m); o.scale.set(r, r * sy, r); o.position.set(x, y, z); return o;
}
// leuchtendes Material je Lampe (wird beim Ein-/Ausschalten geändert)
function glow(g, color) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0 });
  (g.userData.glow ||= []).push(m); return m;
}
const DUNKEL = () => mat('#2b2b2b', 0.55, 0.1);
const METALL = () => mat('#9aa0a6', 0.35, 0.55);
const HOLZ = () => mat('#a9805a', 0.6);
function beine(g, w, d, h, m, i = 0.06, r = 0.018) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, r, r * 0.85, h, sx * (w / 2 - i), 0, sz * (d / 2 - i), m, 10); }
const BUCH = ['#7a2e2e', '#2f4a5a', '#c9a227', '#3d4042', '#6f7651', '#b55d3c', '#e8e2d6', '#22344d', '#8b5a3c'];
function buecher(g, x0, x1, y, z, r, maxH = 0.28) {
  let x = x0 + r() * 0.05;
  while (x < x1 - 0.04) {
    if (r() < 0.12) { x += 0.06 + r() * 0.1; continue; }
    const bw = 0.02 + r() * 0.03, bh = Math.min(maxH, 0.16 + r() * 0.12);
    B(g, bw, bh, 0.16 + r() * 0.05, x + bw / 2, y, z, mat(BUCH[(r() * BUCH.length) | 0], 0.8));
    x += bw + 0.004;
  }
}
const artCache = [];
function artMat(v) {
  v = Math.abs(v | 0) % 4;
  if (!artCache[v]) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 172; const x = c.getContext('2d');
    const pal = [['#e9e1d3', '#c86b4a', '#2f4a5a', '#d9a441'], ['#f1efe9', '#22344d', '#9fae8f', '#c4a27a'], ['#1d2b33', '#e0b26b', '#d06a5a', '#f3ede2'], ['#ece6da', '#6f7651', '#b55d3c', '#3d4042']][v];
    x.fillStyle = pal[0]; x.fillRect(0, 0, 256, 172); const r = rnd(v * 97 + 5);
    for (let i = 0; i < 8; i++) {
      x.fillStyle = pal[1 + (i % 3)]; x.globalAlpha = 0.85; x.beginPath();
      if (r() < 0.5) x.arc(r() * 256, r() * 172, 14 + r() * 46, 0, 7); else x.rect(r() * 220, r() * 140, 20 + r() * 80, 10 + r() * 60);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    artCache[v] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  }
  return artCache[v];
}

export const KATEGORIEN = ['Wohnen', 'Essen & Küche', 'Schlafen', 'Arbeiten', 'Bad', 'Licht', 'Deko'];

// kw = Suchbegriff für den Amazon-Link. Keine Preise (ändern sich laufend).
export const MOEBEL = {
  sofa3: { name: '3-Sitzer-Sofa', kat: 'Wohnen', icon: '🛋️', w: 2.1, d: 0.9, h: 0.85, farbe: '#7a8a99', kw: 'Sofa 3 Sitzer Stoff',
    build(g, f) { const m = mat(f, 0.92), k = mat(shade(f, 0.05), 0.95), w = 2.1, d = 0.9;
      beine(g, w, d, 0.1, DUNKEL(), 0.08); B(g, w, 0.28, d, 0, 0.1, 0, m);
      const cw = (w - 0.36) / 3; for (let i = 0; i < 3; i++) B(g, cw - 0.02, 0.14, d - 0.26, -w / 2 + 0.18 + cw * (i + 0.5), 0.38, 0.1, k);
      B(g, w - 0.36, 0.44, 0.2, 0, 0.38, -d / 2 + 0.1, m);
      for (const s of [-1, 1]) B(g, 0.18, 0.55, d, s * (w / 2 - 0.09), 0.1, 0, m); } },
  ecksofa: { name: 'Ecksofa', kat: 'Wohnen', icon: '🛋️', w: 2.6, d: 1.8, h: 0.85, farbe: '#b9b2a7', kw: 'Ecksofa L Form',
    build(g, f) { const m = mat(f, 0.92), k = mat(shade(f, 0.05), 0.95), L = DUNKEL();
      for (const [x, z] of [[-1.22, -0.82], [1.22, -0.82], [-1.22, -0.08], [1.22, 0.82], [0.48, 0.82]]) C(g, 0.018, 0.015, 0.1, x, 0, z, L, 10);
      B(g, 2.6, 0.28, 0.9, 0, 0.1, -0.45, m); B(g, 0.9, 0.28, 0.9, 0.85, 0.1, 0.45, m);
      B(g, 2.6, 0.44, 0.2, 0, 0.38, -0.8, m); B(g, 0.18, 0.55, 0.9, -1.21, 0.1, -0.45, m); B(g, 0.18, 0.55, 1.6, 1.21, 0.1, 0.1, m);
      B(g, 0.72, 0.14, 0.62, -0.75, 0.38, -0.38, k); B(g, 0.74, 0.14, 0.62, 0, 0.38, -0.38, k); B(g, 0.7, 0.14, 1.58, 0.76, 0.38, 0.1, k); } },
  sessel: { name: 'Sessel', kat: 'Wohnen', icon: '💺', w: 0.8, d: 0.8, h: 0.87, farbe: '#6f7651', kw: 'Sessel Stoff Wohnzimmer',
    build(g, f) { const m = mat(f, 0.92), k = mat(shade(f, 0.05), 0.95);
      beine(g, 0.8, 0.8, 0.12, HOLZ(), 0.07); B(g, 0.8, 0.25, 0.8, 0, 0.12, 0, m); B(g, 0.56, 0.13, 0.6, 0, 0.37, 0.08, k);
      B(g, 0.56, 0.5, 0.16, 0, 0.37, -0.32, m); for (const s of [-1, 1]) B(g, 0.12, 0.36, 0.8, s * 0.34, 0.37, 0, m); } },
  couchtisch: { name: 'Couchtisch', kat: 'Wohnen', icon: '🟫', w: 1.1, d: 0.6, h: 0.42, farbe: '#b08560', kw: 'Couchtisch Holz',
    build(g, f) { const m = mat(f, 0.6); B(g, 1.1, 0.04, 0.6, 0, 0.38, 0, m); B(g, 1.0, 0.02, 0.5, 0, 0.1, 0, m);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.04, 0.38, 0.04, sx * 0.51, 0, sz * 0.26, m); } },
  tvboard: { name: 'TV-Lowboard', kat: 'Wohnen', icon: '🗄️', w: 1.8, d: 0.4, h: 0.48, farbe: '#e8e4dc', kw: 'TV Lowboard',
    build(g, f) { const m = mat(f, 0.5), fr = mat(shade(f, -0.05), 0.45); beine(g, 1.8, 0.4, 0.1, DUNKEL(), 0.08, 0.015);
      B(g, 1.8, 0.38, 0.4, 0, 0.1, 0, m); for (let i = 0; i < 3; i++) B(g, 0.585, 0.34, 0.01, -0.6 + 0.6 * i, 0.12, 0.2, fr); } },
  tv: { name: 'Fernseher 55"', kat: 'Wohnen', icon: '📺', w: 1.23, d: 0.25, h: 0.78, farbe: '#141414', stack: true, kw: 'Fernseher 55 Zoll 4K',
    build(g, f) { const m = mat(f, 0.4); B(g, 0.42, 0.02, 0.24, 0, 0, 0, m); B(g, 0.06, 0.08, 0.03, 0, 0.02, -0.03, m);
      B(g, 1.23, 0.71, 0.035, 0, 0.07, 0, m);
      const s = B(g, 1.19, 0.67, 0.004, 0, 0.09, 0.019, mat('#0b1622', 0.15)); s.castShadow = false; } },
  regal: { name: 'Bücherregal', kat: 'Wohnen', icon: '📚', w: 0.8, d: 0.3, h: 1.8, farbe: '#c8a27a', kw: 'Bücherregal Holz',
    build(g, f, it) { const m = mat(f, 0.6), r = rnd(String(it.id).length * 13 + 3);
      for (const s of [-1, 1]) B(g, 0.02, 1.8, 0.3, s * 0.39, 0, 0, m);
      for (let i = 0; i < 6; i++) B(g, 0.76, 0.02, 0.3, 0, i * 0.355, 0, m);
      B(g, 0.8, 1.8, 0.01, 0, 0, -0.145, mat(shade(f, -0.05), 0.6));
      for (let i = 0; i < 5; i++) buecher(g, -0.37, 0.37, i * 0.355 + 0.02, 0.01, r, 0.3); } },
  teppich: { name: 'Teppich 140×200', kat: 'Wohnen', icon: '🟦', w: 2.0, d: 1.4, h: 0.012, farbe: '#9aa3a8', flat: true, kw: 'Teppich Wohnzimmer 140x200',
    build(g, f) { const o = B(g, 2.0, 0.012, 1.4, 0, 0, 0, mat(f, 1)); o.castShadow = false;
      const b = B(g, 1.8, 0.013, 1.2, 0, 0, 0, mat(shade(f, 0.08), 1)); b.castShadow = false; } },
  pflanze: { name: 'Zimmerpflanze', kat: 'Wohnen', icon: '🪴', w: 0.5, d: 0.5, h: 1.35, farbe: '#d9d4cc', stack: true, kw: 'Zimmerpflanze groß',
    build(g, f) { C(g, 0.17, 0.13, 0.32, 0, 0, 0, mat(f, 0.6)); C(g, 0.16, 0.16, 0.02, 0, 0.3, 0, mat('#3b2a1e', 1));
      C(g, 0.015, 0.02, 0.6, 0, 0.32, 0, mat('#5a4030', 0.9));
      const l = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.8, flatShading: true });
      S(g, 0.24, 0, 1.0, 0, l, 0.8); S(g, 0.18, 0.12, 0.85, 0.1, l, 0.8); S(g, 0.17, -0.12, 1.15, -0.05, l, 0.8); S(g, 0.14, 0.04, 1.22, 0.12, l, 0.8); } },
  esstisch: { name: 'Esstisch 160', kat: 'Essen & Küche', icon: '🍽️', w: 1.6, d: 0.9, h: 0.75, farbe: '#b08560', kw: 'Esstisch Holz 160x90',
    build(g, f) { const m = mat(f, 0.6); B(g, 1.6, 0.04, 0.9, 0, 0.71, 0, m);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.06, 0.71, 0.06, sx * 0.72, 0, sz * 0.37, m); } },
  stuhl: { name: 'Esszimmerstuhl', kat: 'Essen & Küche', icon: '🪑', w: 0.45, d: 0.5, h: 0.86, farbe: '#2f3336', kw: 'Esszimmerstuhl',
    build(g, f) { const m = mat(f, 0.55), s = mat(shade(f, 0.08), 0.9);
      for (const sx of [-1, 1]) { B(g, 0.03, 0.43, 0.03, sx * 0.195, 0, 0.2, m); B(g, 0.03, 0.86, 0.03, sx * 0.195, 0, -0.21, m); }
      B(g, 0.45, 0.05, 0.46, 0, 0.43, 0.01, s); B(g, 0.42, 0.28, 0.03, 0, 0.55, -0.215, m); } },
  kueche: { name: 'Küchenzeile 240', kat: 'Essen & Küche', icon: '🍳', w: 2.4, d: 0.6, h: 0.9, farbe: '#f1efe9', kw: 'Küchenzeile 240 cm',
    build(g, f) { const m = mat(f, 0.5), fr = mat(shade(f, 0.03), 0.4), top = mat('#4a4440', 0.45), me = METALL();
      B(g, 2.4, 0.1, 0.54, 0, 0, -0.03, DUNKEL()); B(g, 2.4, 0.76, 0.58, 0, 0.1, -0.01, m);
      for (let i = 0; i < 4; i++) { B(g, 0.59, 0.72, 0.012, -0.9 + 0.6 * i, 0.12, 0.285, fr); B(g, 0.14, 0.012, 0.02, -0.9 + 0.6 * i, 0.76, 0.3, me); }
      B(g, 2.42, 0.04, 0.62, 0, 0.86, 0, top);
      B(g, 0.5, 0.006, 0.4, -0.5, 0.9, 0.02, mat('#c9ced3', 0.2, 0.6)); C(g, 0.012, 0.012, 0.26, -0.5, 0.9, -0.22, me, 10); B(g, 0.02, 0.02, 0.16, -0.5, 1.14, -0.15, me);
      B(g, 0.58, 0.006, 0.5, 0.55, 0.9, 0.02, mat('#0a0a0a', 0.15)); } },
  kuehlschrank: { name: 'Kühl-Gefrier-Kombi', kat: 'Essen & Küche', icon: '🧊', w: 0.6, d: 0.65, h: 1.85, farbe: '#e9e9e9', kw: 'Kühl Gefrierkombination freistehend',
    build(g, f) { const m = mat(f, 0.35), me = METALL(); B(g, 0.6, 1.85, 0.65, 0, 0, 0, m); B(g, 0.6, 0.008, 0.01, 0, 1.2, 0.326, DUNKEL());
      B(g, 0.02, 0.3, 0.03, 0.26, 1.3, 0.34, me); B(g, 0.02, 0.4, 0.03, 0.26, 0.7, 0.34, me); } },
  bett: { name: 'Doppelbett 160×200', kat: 'Schlafen', icon: '🛏️', w: 1.7, d: 2.1, h: 1.0, farbe: '#8a7d70', kw: 'Doppelbett 160x200',
    build(g, f) { const m = mat(f, 0.85); beine(g, 1.7, 2.1, 0.08, DUNKEL(), 0.08); B(g, 1.7, 0.3, 2.1, 0, 0.08, 0, m);
      B(g, 1.6, 0.2, 2.0, 0, 0.38, 0.02, mat('#f4f2ee', 0.95)); B(g, 1.64, 0.07, 1.45, 0, 0.56, 0.33, mat('#d7dbe0', 0.95));
      for (const s of [-1, 1]) B(g, 0.65, 0.12, 0.4, s * 0.4, 0.58, -0.75, mat('#fafafa', 0.95));
      B(g, 1.7, 1.0, 0.08, 0, 0, -1.01, m); } },
  nachttisch: { name: 'Nachttisch', kat: 'Schlafen', icon: '🟫', w: 0.45, d: 0.4, h: 0.5, farbe: '#c8a27a', kw: 'Nachttisch',
    build(g, f) { const m = mat(f, 0.6); beine(g, 0.45, 0.4, 0.08, m, 0.04, 0.015); B(g, 0.45, 0.42, 0.4, 0, 0.08, 0, m);
      B(g, 0.43, 0.005, 0.005, 0, 0.32, 0.201, DUNKEL()); B(g, 0.12, 0.015, 0.02, 0, 0.4, 0.21, METALL()); } },
  kleiderschrank: { name: 'Kleiderschrank', kat: 'Schlafen', icon: '🚪', w: 1.5, d: 0.6, h: 2.1, farbe: '#f1efe9', kw: 'Kleiderschrank 150 cm',
    build(g, f) { const m = mat(f, 0.5); B(g, 1.5, 2.1, 0.6, 0, 0, 0, m); B(g, 0.006, 2.06, 0.005, 0, 0.02, 0.301, DUNKEL());
      for (const s of [-1, 1]) B(g, 0.02, 0.35, 0.02, s * 0.05, 0.9, 0.31, METALL()); } },
  kommode: { name: 'Kommode', kat: 'Schlafen', icon: '🗄️', w: 1.0, d: 0.45, h: 0.85, farbe: '#c8a27a', kw: 'Kommode Holz',
    build(g, f) { const m = mat(f, 0.6); beine(g, 1, 0.45, 0.1, DUNKEL(), 0.06, 0.015); B(g, 1, 0.75, 0.45, 0, 0.1, 0, m);
      for (let i = 0; i < 3; i++) { if (i) B(g, 0.98, 0.006, 0.005, 0, 0.1 + 0.25 * i, 0.226, DUNKEL()); B(g, 0.16, 0.015, 0.02, 0, 0.1 + 0.25 * i + 0.17, 0.23, METALL()); } } },
  schreibtisch: { name: 'Schreibtisch', kat: 'Arbeiten', icon: '🖥️', w: 1.4, d: 0.7, h: 0.75, farbe: '#c8a27a', kw: 'Schreibtisch 140 cm',
    build(g, f) { const m = mat(f, 0.6); B(g, 1.4, 0.03, 0.7, 0, 0.72, 0, m); for (const s of [-1, 1]) B(g, 0.04, 0.72, 0.6, s * 0.66, 0, 0, METALL());
      B(g, 0.55, 0.32, 0.02, 0, 0.83, -0.2, mat('#151515', 0.4)); B(g, 0.06, 0.08, 0.06, 0, 0.75, -0.22, mat('#151515', 0.4)); } },
  buerostuhl: { name: 'Bürostuhl', kat: 'Arbeiten', icon: '💺', w: 0.62, d: 0.62, h: 1.1, farbe: '#33363a', kw: 'Bürostuhl ergonomisch',
    build(g, f) { const m = mat(f, 0.8), me = METALL();
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; B(g, 0.3, 0.03, 0.04, Math.cos(a) * 0.15, 0.04, Math.sin(a) * 0.15, me, -a); S(g, 0.025, Math.cos(a) * 0.29, 0.025, Math.sin(a) * 0.29, DUNKEL()); }
      C(g, 0.025, 0.025, 0.36, 0, 0.06, 0, me, 10); B(g, 0.5, 0.08, 0.48, 0, 0.42, 0.02, m);
      B(g, 0.05, 0.25, 0.03, 0, 0.42, -0.25, me); B(g, 0.46, 0.55, 0.06, 0, 0.55, -0.25, m); } },
  waschtisch: { name: 'Waschtisch 80', kat: 'Bad', icon: '🚰', w: 0.8, d: 0.48, h: 0.86, farbe: '#8b5a3c', kw: 'Waschtisch mit Unterschrank 80 cm',
    build(g, f) { const m = mat(f, 0.6); B(g, 0.8, 0.45, 0.46, 0, 0.35, -0.01, m); B(g, 0.78, 0.005, 0.005, 0, 0.57, 0.221, DUNKEL());
      B(g, 0.8, 0.06, 0.48, 0, 0.8, 0, mat('#f7f7f5', 0.2)); B(g, 0.5, 0.005, 0.32, 0, 0.86, 0.03, mat('#e6e8e8', 0.15));
      C(g, 0.012, 0.012, 0.12, 0, 0.86, -0.17, METALL(), 10); } },
  wc: { name: 'Wand-WC', kat: 'Bad', icon: '🚽', w: 0.38, d: 0.58, h: 1.1, farbe: '#f7f7f5', kw: 'Hänge WC spülrandlos Set',
    build(g, f) { const m = mat(f, 0.2); B(g, 0.36, 0.3, 0.5, 0, 0.12, 0.04, m); B(g, 0.37, 0.025, 0.48, 0, 0.42, 0.05, mat(f, 0.3));
      B(g, 0.37, 0.4, 0.025, 0, 0.445, -0.2, mat(f, 0.3)); B(g, 0.25, 0.17, 0.01, 0, 0.92, -0.285, METALL()); } },
  badewanne: { name: 'Badewanne 170×75', kat: 'Bad', icon: '🛁', w: 1.7, d: 0.75, h: 0.58, farbe: '#f7f7f5', kw: 'Badewanne 170x75',
    build(g, f) { const m = mat(f, 0.2); B(g, 1.7, 0.1, 0.75, 0, 0, 0, m);
      for (const s of [-1, 1]) { B(g, 1.7, 0.48, 0.07, 0, 0.1, s * 0.34, m); B(g, 0.07, 0.48, 0.61, s * 0.815, 0.1, 0, m); }
      B(g, 1.56, 0.005, 0.61, 0, 0.1, 0, mat('#e9eef0', 0.1)); C(g, 0.015, 0.015, 0.2, 0.75, 0.58, 0, METALL(), 10); } },
  stehlampe: { name: 'Stehlampe', kat: 'Licht', icon: '🏮', w: 0.4, d: 0.4, h: 1.65, farbe: '#efe6d6', light: { y: 1.42, p: 1 }, kw: 'Stehlampe Stoffschirm',
    build(g, f) { const me = METALL(); C(g, 0.16, 0.17, 0.025, 0, 0, 0, me); C(g, 0.012, 0.012, 1.4, 0, 0.025, 0, me, 8);
      const s = C(g, 0.13, 0.2, 0.28, 0, 1.33, 0, glow(g, f)); s.castShadow = false; } },
  tischlampe: { name: 'Tischlampe', kat: 'Licht', icon: '💡', w: 0.25, d: 0.25, h: 0.45, farbe: '#efe6d6', stack: true, light: { y: 0.36, p: 0.45 }, kw: 'Tischlampe Nachttisch',
    build(g, f) { const me = METALL(); C(g, 0.08, 0.09, 0.02, 0, 0, 0, me); C(g, 0.008, 0.008, 0.26, 0, 0.02, 0, me, 8);
      const s = C(g, 0.08, 0.12, 0.17, 0, 0.27, 0, glow(g, f)); s.castShadow = false; } },
  deckenlampe: { name: 'Pendelleuchte', kat: 'Licht', icon: '💡', w: 0.4, d: 0.4, h: 0.56, farbe: '#2f3336', mount: 'decke', light: { y: -0.52, p: 1.3 }, kw: 'Pendelleuchte Esstisch',
    build(g, f) { C(g, 0.06, 0.06, 0.03, 0, -0.03, 0, mat('#f4f4f4', 0.5)); C(g, 0.004, 0.004, 0.4, 0, -0.43, 0, DUNKEL(), 6);
      const s = C(g, 0.05, 0.2, 0.16, 0, -0.56, 0, mat(f, 0.5, 0.3)); s.castShadow = false;
      const b = S(g, 0.045, 0, -0.55, 0, glow(g, '#fff8e8'), 1, 2); b.castShadow = false; } },
  spot: { name: 'Deckenleuchte flach', kat: 'Licht', icon: '⚪', w: 0.4, d: 0.4, h: 0.08, farbe: '#ffffff', mount: 'decke', light: { y: -0.15, p: 1.1 }, kw: 'LED Deckenleuchte rund',
    build(g, f) { const s = C(g, 0.2, 0.2, 0.07, 0, -0.07, 0, glow(g, f), 28); s.castShadow = false; } },
  bild: { name: 'Wandbild', kat: 'Deko', icon: '🖼️', w: 0.9, d: 0.03, h: 0.6, farbe: '#2b2b2b', mount: 'wand', y: 1.55, kw: 'Wandbild Leinwand abstrakt',
    build(g, f, it) { B(g, 0.9, 0.6, 0.03, 0, -0.3, 0, mat(f, 0.5)); const a = B(g, 0.84, 0.54, 0.004, 0, -0.27, 0.017, artMat(it.v ?? String(it.id).charCodeAt(1))); a.castShadow = false; } },
  spiegel: { name: 'Wandspiegel', kat: 'Deko', icon: '🪞', w: 0.6, d: 0.02, h: 1.2, farbe: '#2b2b2b', mount: 'wand', y: 1.5, kw: 'Wandspiegel 60x120',
    build(g, f) { B(g, 0.6, 1.2, 0.02, 0, -0.6, 0, mat(f, 0.4)); const s = B(g, 0.54, 1.14, 0.004, 0, -0.57, 0.012, mat('#dfe7ea', 0.05, 0.6)); s.castShadow = false; } },
  wandregal: { name: 'Wandregal', kat: 'Deko', icon: '📏', w: 0.8, d: 0.22, h: 0.26, farbe: '#c8a27a', mount: 'wand', y: 1.6, kw: 'Wandregal Holz schwebend',
    build(g, f, it) { B(g, 0.8, 0.03, 0.22, 0, -0.13, 0, mat(f, 0.6)); buecher(g, -0.38, 0.05, -0.1, 0, rnd(String(it.id).length * 7 + 11), 0.22);
      C(g, 0.05, 0.04, 0.09, 0.25, -0.1, 0, mat('#d9d4cc', 0.6)); S(g, 0.07, 0.25, 0.04, 0, new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.8, flatShading: true }), 0.8); } },
};

export function baue(it) {
  const def = MOEBEL[it.cat];
  const g = new THREE.Group();
  def.build(g, it.color || def.farbe, it);
  Object.assign(g.userData, { kind: 'item', id: it.id });
  return g;
}
