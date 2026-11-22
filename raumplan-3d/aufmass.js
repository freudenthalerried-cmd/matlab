// Aufmessen mit der Handy-Kamera (WebXR/ARCore, Chrome Android).
// Ablauf: Boden finden → Ecken anpeilen → Raumhöhe → Türen/Fenster. Nebenbei werden Fotos mit Kameralage gespeichert
// und danach auf Wände und Boden projiziert. Alle Strahlen werden gespeichert und am Ende mit der endgültigen
// Bodenhöhe neu geschnitten (genauer als sofort rechnen).
import * as THREE from './lib/three.module.min.js';

const f2 = (v, d = 2) => v.toFixed(d).replace('.', ',');
const MAXF = 60, FOTO_PX = 512;
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };

export async function arVerfuegbar() {
  try { return !!navigator.xr && await navigator.xr.isSessionSupported('immersive-ar'); } catch { return false; }
}

// ---------- Geometrie (reine Funktionen, auch für Tests) ----------
export function rayFloor(o, d, y) { if (d[1] > -0.03) return null; const t = (y - o[1]) / d[1]; return t > 0 && t < 15 ? [o[0] + d[0] * t, y, o[2] + d[2] * t] : null; }
// Strahl gegen senkrechte Linie durch Bodenpunkt c=[x,z]: liefert Höhe (absolut) und Abstand
export function rayVertical(o, d, c) {
  const w0 = [o[0] - c[0], o[1], o[2] - c[1]], b = d[1], den = 1 - b * b; if (den < 1e-4) return null;
  const dd = d[0] * w0[0] + d[1] * w0[1] + d[2] * w0[2], e = w0[1], t = (b * e - dd) / den, s = (e - b * dd) / den;
  if (t <= 0) return null;
  const p = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
  return { y: s, dist: Math.hypot(p[0] - c[0], p[1] - s, p[2] - c[1]) };
}
// Strahl gegen senkrechte Wandebene von a nach b ([x,z]); liefert s (entlang Wand), y (absolut), t
export function rayWall(o, d, a, b) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = -uz, nz = ux;
  const den = d[0] * nx + d[2] * nz; if (Math.abs(den) < 1e-4) return null;
  const t = ((a[0] - o[0]) * nx + (a[1] - o[2]) * nz) / den; if (t <= 0) return null;
  const px = o[0] + d[0] * t, py = o[1] + d[1] * t, pz = o[2] + d[2] * t;
  return { s: (px - a[0]) * ux + (pz - a[1]) * uz, y: py, t, L };
}
const signedArea = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

// schneidet die Sichtlinie (ax,az)→(bx,bz) die Wand w=[[x,z],[x,z]]? (für verwinkelte Räume)
function kreuzt(ax, az, bx, bz, w) {
  const [[cx, cz], [dx, dz]] = w, o = (px, pz, qx, qz, rx, rz) => (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
  const d1 = o(cx, cz, dx, dz, ax, az), d2 = o(cx, cz, dx, dz, bx, bz), d3 = o(ax, az, bx, bz, cx, cz), d4 = o(ax, az, bx, bz, dx, dz);
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9;
}
// Fotos auf eine Fläche projizieren. surf: { TW, TH, pt(u,v,out) → Weltpunkt, n: Normale zur Kamera hin, mask?(u,v), occ?: Wände, self?: eigene Wand }
export function backe(frames, surf, leer = [216, 212, 204]) {
  const { TW, TH } = surf, cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(TW, TH), D = img.data, p = [0, 0, 0], n = surf.n;
  const proj = (f, q) => { const e = f.e, w = e[3] * q[0] + e[7] * q[1] + e[11] * q[2] + e[15]; if (w < 0.05) return null; return [(e[0] * q[0] + e[4] * q[1] + e[8] * q[2] + e[12]) / w, (e[1] * q[0] + e[5] * q[1] + e[9] * q[2] + e[13]) / w]; };
  const cand = frames.filter(f => { for (const u of [0.05, 0.5, 0.95]) for (const v of [0.05, 0.5, 0.95]) { surf.pt(u, v, p); const r = proj(f, p); if (r && Math.abs(r[0]) < 1 && Math.abs(r[1]) < 1) return true; } return false; });
  let gefuellt = 0;
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
    const k = (j * TW + i) * 4, u = (i + 0.5) / TW, v = (j + 0.5) / TH;
    D[k + 3] = 255;
    if (surf.mask && !surf.mask(u, v)) { D[k] = leer[0]; D[k + 1] = leer[1]; D[k + 2] = leer[2]; continue; }
    surf.pt(u, v, p);
    let r = 0, g = 0, b = 0, W = 0;
    for (const f of cand) {
      const e = f.e, w = e[3] * p[0] + e[7] * p[1] + e[11] * p[2] + e[15]; if (w < 0.05) continue;
      const nx = (e[0] * p[0] + e[4] * p[1] + e[8] * p[2] + e[12]) / w, ny = (e[1] * p[0] + e[5] * p[1] + e[9] * p[2] + e[13]) / w;
      const m = Math.max(Math.abs(nx), Math.abs(ny)); if (m > 0.97) continue;
      const vx = f.c[0] - p[0], vy = f.c[1] - p[1], vz = f.c[2] - p[2], dist = Math.hypot(vx, vy, vz), cos = (vx * n[0] + vy * n[1] + vz * n[2]) / dist;
      if (cos < 0.2) continue;
      if (surf.occ) { let bl = false; for (let k = 0; k < surf.occ.length; k++) if (k !== surf.self && kreuzt(f.c[0], f.c[2], p[0], p[2], surf.occ[k])) { bl = true; break; } if (bl) continue; }
      let wt = cos * cos / (dist * dist) * (1 - m ** 6); wt *= wt;
      const px = Math.min(f.W - 1, ((nx + 1) / 2 * f.W) | 0), py = Math.min(f.H - 1, ((1 - ny) / 2 * f.H) | 0), q = (py * f.W + px) * 4;
      r += f.data[q] * wt; g += f.data[q + 1] * wt; b += f.data[q + 2] * wt; W += wt;
    }
    if (W > 0) { D[k] = r / W; D[k + 1] = g / W; D[k + 2] = b / W; gefuellt++; } else { D[k] = leer[0]; D[k + 1] = leer[1]; D[k + 2] = leer[2]; }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, anteil: gefuellt / (TW * TH) };
}
const prepFrames = frames => frames.map(f => {
  const m = new THREE.Matrix4().fromArray(f.M), vp = new THREE.Matrix4().fromArray(f.P).multiply(m.clone().invert());
  return { ...f, e: vp.elements, c: [f.M[12], f.M[13], f.M[14]] };
});

// Aufmaß (AR-Koordinaten) → Plan für die 3D-App + Fototexturen
// res: { corners:[[x,z]], floorY, height, heightSrc, opens:[{typ,wall,s0,s1,y0,y1}], frames }
export async function modellAusAufmass(res, name, scanId, fortschritt = () => {}) {
  const C = res.corners, N = C.length, H = res.height, T = 0.12;
  // längste Wand waagrecht legen, Ursprung links oben
  let li = 0, lm = 0; for (let i = 0; i < N; i++) { const q = C[(i + 1) % N], l = Math.hypot(q[0] - C[i][0], q[1] - C[i][1]); if (l > lm) { lm = l; li = i; } }
  const q = C[(li + 1) % N], ang = Math.atan2(q[1] - C[li][1], q[0] - C[li][0]), ca = Math.cos(ang), sa = Math.sin(ang);
  const rot = ([x, z]) => [x * ca + z * sa, -x * sa + z * ca];
  const R = C.map(rot), mx = Math.min(...R.map(p => p[0])), mz = Math.min(...R.map(p => p[1]));
  const fwd = p => { const r = rot(p); return [r[0] - mx, r[1] - mz]; };
  const inv = ([X, Z]) => { X += mx; Z += mz; return [X * ca - Z * sa, X * sa + Z * ca]; };
  const P = C.map(p => fwd(p).map(v => Math.round(v * 1000) / 1000));
  const A = signedArea(P), sideIn = A > 0 ? 'A' : 'B', sgn = A > 0 ? 1 : -1;
  // Wandachsen nach außen versetzen, damit die Innenflächen genau auf den gemessenen Ecken liegen
  const edge = i => { const a = P[i], b = P[(i + 1) % N], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; return { a, u, L, out: [sgn * u[1], -sgn * u[0]] }; };
  const O = P.map((p, i) => {
    const e1 = edge((i - 1 + N) % N), e2 = edge(i), h = T / 2;
    const p1 = [p[0] + e1.out[0] * h, p[1] + e1.out[1] * h], p2 = [p[0] + e2.out[0] * h, p[1] + e2.out[1] * h];
    const cr = e1.u[0] * e2.u[1] - e1.u[1] * e2.u[0];
    if (Math.abs(cr) < 0.05) return p2;
    const t = ((p2[0] - p1[0]) * e2.u[1] - (p2[1] - p1[1]) * e2.u[0]) / cr;
    return [p1[0] + e1.u[0] * t, p1[1] + e1.u[1] * t];
  });
  const walls = P.map((p, i) => {
    const a = O[i], b = O[(i + 1) % N], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const x0 = (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1], innen = edge(i).L;
    const open = res.opens.filter(o => o.wall === i).map(o => {
      const s0 = Math.max(0, Math.min(o.s0, o.s1)), s1 = Math.min(innen, Math.max(o.s0, o.s1)), y0 = Math.min(o.y0, o.y1), y1 = Math.max(o.y0, o.y1);
      return o.typ === 'tuer' ? { at: x0 + (s0 + s1) / 2, w: s1 - s0, sill: 0, h: Math.min(H, y1), typ: 'tuer' } : { at: x0 + (s0 + s1) / 2, w: s1 - s0, sill: Math.max(0, y0), h: Math.min(H, y1) - Math.max(0, y0), typ: 'fenster' };
    }).filter(o => o.w > 0.2 && o.h > 0.2);
    return { id: 'm' + i, a: a.map(v => +v.toFixed(4)), b: b.map(v => +v.toFixed(4)), t: T, open, innen: +innen.toFixed(4), x0: +x0.toFixed(4), seiteInnen: sideIn };
  });
  const cx = P.reduce((s, p) => s + p[0], 0) / N, cz = P.reduce((s, p) => s + p[1], 0) / N;
  const room = { name, poly: P, floor: 'eiche_hell' };
  const plan = { name, height: +H.toFixed(3), hoeheQuelle: res.heightSrc, start: { x: cx, z: cz, yaw: 0 }, walls, rooms: [room], items: [],
    light: { tod: 14, nord: 0, lamps: false, level: 1, kelvin: 3000, exposure: 1 }, aufmass: { datum: new Date().toISOString().slice(0, 10), fotos: res.frames.length, korr: 1 } };
  // Fotos backen (in AR-Koordinaten)
  const tex = new Map();
  if (res.frames.length) {
    const fr = prepFrames(res.frames), y0 = res.floorY, sAin = A > 0 ? 1 : -1;
    // Verdeckung nur bei nicht-konvexen Räumen prüfen (kostet Rechenzeit)
    const konvex = P.every((p, i) => { const a = P[(i + N - 1) % N], b = P[(i + 1) % N]; return ((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])) * sAin >= -1e-6; });
    const occ = konvex ? null : C.map((c, i) => [c, C[(i + 1) % N]]);
    for (let i = 0; i < N; i++) {
      fortschritt(`Fotos auf Wand ${i + 1} von ${N} …`); await new Promise(r => setTimeout(r, 0));
      const a = C[i], b = C[(i + 1) % N], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      const n = [-uz * sAin, 0, ux * sAin];
      const TW = Math.max(16, Math.min(1024, Math.round(L / 0.012))), TH = Math.max(16, Math.min(512, Math.round(H / 0.012)));
      const r = backe(fr, { TW, TH, n, occ, self: i, pt: (u, v, o) => { o[0] = a[0] + ux * L * u + n[0] * 0.005; o[1] = y0 + (1 - v) * H; o[2] = a[1] + uz * L * u + n[2] * 0.005; return o; } });
      if (r.anteil > 0.15) { const key = `${scanId}-w${i}`; tex.set(key, r.canvas); walls[i]['foto' + sideIn] = { key, x0: walls[i].x0, len: walls[i].innen }; }
    }
    fortschritt('Fotos auf den Boden …'); await new Promise(r => setTimeout(r, 0));
    const W = Math.max(...P.map(p => p[0])), Dd = Math.max(...P.map(p => p[1]));
    const TW = Math.max(16, Math.min(1024, Math.round(W / 0.015))), TH = Math.max(16, Math.min(1024, Math.round(Dd / 0.015)));
    const pip = (x, z) => { let ins = false; for (let i = 0, j = N - 1; i < N; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };
    const r = backe(fr, { TW, TH, n: [0, 1, 0], occ, self: -1, mask: (u, v) => pip(u * W, v * Dd), pt: (u, v, o) => { const w = inv([u * W, v * Dd]); o[0] = w[0]; o[1] = y0 + 0.003; o[2] = w[1]; return o; } }, [190, 180, 165]);
    if (r.anteil > 0.15) { const key = `${scanId}-boden`; tex.set(key, r.canvas); room.foto = { key, x0: 0, z0: 0, w: W, d: Dd }; }
  }
  return { plan, tex };
}

// Plan gleichmäßig umrechnen (Kontrollmaß)
export function skaliere(p, k) {
  const s = v => +(v * k).toFixed(4);
  for (const w of p.walls) {
    w.a = w.a.map(s); w.b = w.b.map(s); if (w.innen) w.innen = s(w.innen); if (w.x0 != null) w.x0 = s(w.x0);
    for (const o of w.open || []) { o.at = s(o.at); o.w = s(o.w); o.sill = s(o.sill || 0); o.h = s(o.h); }
    for (const f of [w.fotoA, w.fotoB]) if (f) { f.x0 = s(f.x0); f.len = s(f.len); }
  }
  for (const r of p.rooms) { r.poly = r.poly.map(q => q.map(s)); if (r.foto) { r.foto.x0 = s(r.foto.x0); r.foto.z0 = s(r.foto.z0); r.foto.w = s(r.foto.w); r.foto.d = s(r.foto.d); } }
  for (const it of p.items || []) { it.x = s(it.x); it.z = s(it.z); }
  if (p.start) { p.start.x = s(p.start.x); p.start.z = s(p.start.z); }
  if (p.hoeheQuelle === 'ar') p.height = s(p.height);
  if (p.aufmass) p.aufmass.korr = +((p.aufmass.korr || 1) * k).toFixed(5);
  return p;
}

// ---------- AR-Sitzung ----------
// Kamerabild (WebGL-Textur) verkleinert auslesen, oberste Zeile zuerst
function grabber(gl, SW, SH) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 t; void main(){ t = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float; uniform sampler2D u; varying vec2 t; void main(){ gl_FragColor = texture2D(u, t); }'));
  gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const loc = gl.getAttribLocation(pr, 'p'), px = new Uint8Array(SW * SH * 4);
  return camTex => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, SW, SH); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE); gl.disable(gl.SCISSOR_TEST);
    gl.useProgram(pr); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, camTex); gl.uniform1i(gl.getUniformLocation(pr, 'u'), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.readPixels(0, 0, SW, SH, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const out = new Uint8ClampedArray(SW * SH * 4), row = SW * 4;
    for (let y = 0; y < SH; y++) out.set(px.subarray((SH - 1 - y) * row, (SH - y) * row), y * row);
    return out;
  };
}

export function starteAufmass(root) {
  return new Promise(async (resolve, reject) => {
    const el = id => root.querySelector('#' + id);
    root.hidden = false;
    let session;
    try { session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'camera-access'], domOverlay: { root } }); }
    catch (e) { root.hidden = true; reject(new Error('AR startet nicht: ' + e.message)); return; }
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local');
    try { await renderer.xr.setSession(session); }
    catch (e) { try { session.end(); } catch { /* */ } root.hidden = true; reject(new Error('AR startet nicht: ' + e.message)); return; }
    const gl = renderer.getContext(), ref = renderer.xr.getReferenceSpace();
    let hitSrc = null; try { hitSrc = await session.requestHitTestSource({ space: await session.requestReferenceSpace('viewer') }); } catch { /* ohne Treffer: Boden aus local-Raum schätzen */ }
    let glb = null; const feats = Array.from(session.enabledFeatures || ['camera-access']);
    if (feats.includes('camera-access')) { try { glb = new XRWebGLBinding(session, gl); } catch { glb = null; } }

    // --- 3D-Hilfsgrafik ---
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(), BOX = new THREE.BoxGeometry(1, 1, 1);
    const M = { pt: new THREE.MeshBasicMaterial({ color: 0x4da3ff }), seg: new THREE.MeshBasicMaterial({ color: 0x4da3ff }), ghost: new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      wall: new THREE.MeshBasicMaterial({ color: 0x4da3ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
      open: new THREE.MeshBasicMaterial({ color: 0xff9900, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }) };
    const reticle = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.05, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    const ghost = new THREE.Mesh(BOX, M.ghost); reticle.visible = dot.visible = ghost.visible = false;
    const deko = new THREE.Group(); scene.add(reticle, dot, ghost, deko);
    const label = txt => { const c = document.createElement('canvas'); c.width = 256; c.height = 80; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.65)'; x.beginPath(); x.roundRect(4, 4, 248, 72, 20); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 44px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 42); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(0.24, 0.075, 1); return s; };
    const segTo = (m, a, b, y, w = 0.014) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); m.scale.set(Math.max(L, 0.001), 0.004, w); m.position.set((a[0] + b[0]) / 2, y + 0.003, (a[1] + b[1]) / 2); m.rotation.set(0, Math.atan2(-dz, dx), 0); return L; };
    const ghostLbl = label(''); ghostLbl.visible = false; scene.add(ghostLbl); let ghostTxt = '';

    const st = { phase: 'boden', sub: 0, floorHits: [], floorY: null, corners: [], hRay: null, height: 2.6, heightSrc: 'standard', opens: [], typ: null, p1: null, frames: [], last: null, lastT: 0, prevD: null, aim: null, lost: 0, finished: false, camH: [] };
    const cornersXZ = () => st.corners.map(c => { const p = rayFloor(c.o, c.d, st.floorY); return p ? [p[0], p[2]] : [c.o[0], c.o[2]]; });
    function redraw() {
      deko.clear(); if (st.floorY == null) return;
      const C = cornersXZ(), closed = st.phase !== 'ecken';
      C.forEach((c, i) => {
        const s = new THREE.Mesh(BOX, M.pt); s.scale.set(0.04, 0.01, 0.04); s.position.set(c[0], st.floorY + 0.005, c[1]); deko.add(s);
        if (i < C.length - 1 || (closed && C.length > 2)) {
          const b = C[(i + 1) % C.length], m = new THREE.Mesh(BOX, M.seg), L = segTo(m, c, b, st.floorY); deko.add(m);
          const l = label(f2(L) + ' m'); l.position.set((c[0] + b[0]) / 2, st.floorY + 0.08, (c[1] + b[1]) / 2); deko.add(l);
          if (closed) { const w = new THREE.Mesh(BOX, M.wall); w.scale.set(L, st.height, 0.004); w.position.set((c[0] + b[0]) / 2, st.floorY + st.height / 2, (c[1] + b[1]) / 2); w.rotation.y = Math.atan2(-(b[1] - c[1]), b[0] - c[0]); deko.add(w); }
        }
        if (st.phase === 'hoehe') { const v = new THREE.Mesh(BOX, M.seg); v.scale.set(0.01, 3, 0.01); v.position.set(c[0], st.floorY + 1.5, c[1]); deko.add(v); }
      });
      for (const o of st.opens) {
        const a = C[o.wall], b = C[(o.wall + 1) % C.length], r1 = rayWall(o.r1.o, o.r1.d, a, b), r2 = rayWall(o.r2.o, o.r2.d, a, b); if (!r1 || !r2) continue;
        const L = r1.L, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, s0 = Math.min(r1.s, r2.s), s1 = Math.max(r1.s, r2.s);
        const y0 = o.typ === 'tuer' ? st.floorY : Math.min(r1.y, r2.y), y1 = Math.max(r1.y, r2.y), m = new THREE.Mesh(BOX, M.open);
        m.scale.set(s1 - s0, y1 - y0, 0.01); m.position.set(a[0] + ux * (s0 + s1) / 2, (y0 + y1) / 2, a[1] + uz * (s0 + s1) / 2); m.rotation.y = Math.atan2(-uz, ux); deko.add(m);
      }
    }
    // --- Oberfläche ---
    const B1 = el('arB1'), B2 = el('arB2'), B3 = el('arB3');
    root.querySelectorAll('button').forEach(b => b.addEventListener('beforexrselect', e => e.preventDefault()));
    root.addEventListener('beforexrselect', e => e.preventDefault());
    const buzz = () => navigator.vibrate && navigator.vibrate(25);
    let msg = '', msgT = 0; const say = t => { msg = t; msgT = performance.now(); };
    function ui() {
      const n = st.corners.length, a = st.aim; let step = '', txt = '', live = '', b1 = '', b2 = '', b3 = '', d1 = false;
      if (st.phase === 'boden') { step = 'Boden suchen'; txt = 'Handy schräg auf den Boden richten und langsam hin und her bewegen.'; live = st.floorY != null ? '✓ Boden erkannt' : 'Boden wird gesucht …'; b1 = 'Weiter'; d1 = st.floorY == null; b2 = 'Abbrechen'; }
      else if (st.phase === 'ecken') {
        step = `1/3 · Ecken (${n})`; txt = n ? 'Nächste Ecke, einmal rundherum. Verdeckte Ecke: Kreuz dorthin, wo sie wäre.' : 'Kreuz genau auf eine Bodenecke richten (wo zwei Wände den Boden treffen), dann tippen.';
        live = !a ? 'Kreuz auf den Boden richten' : a.snap ? 'Tippen schließt den Raum' : n ? `${f2(a.len)} m` : 'Ecke anpeilen';
        b1 = a && a.snap ? '✓ Raum schließen' : '➕ Ecke setzen'; d1 = !a; b2 = n ? '↶ Ecke zurück' : 'Abbrechen'; b3 = n >= 3 ? '✓ Schließen' : '';
      } else if (st.phase === 'hoehe') { step = '2/3 · Raumhöhe'; txt = 'Kreuz auf die Deckenecke genau über einer Bodenecke richten (blaue Linie), dann tippen.'; live = a ? `Raumhöhe ${f2(a.h)} m` : 'Deckenecke anpeilen'; b1 = 'Höhe übernehmen'; d1 = !a; b2 = 'Überspringen (2,60 m)'; }
      else if (st.phase === 'oeff') {
        step = `3/3 · Türen & Fenster (${st.opens.length})`;
        if (!st.sub) { txt = 'Freiwillig: Türen und Fenster erfassen, dann „Fertig“.'; b1 = '🚪 Tür'; b3 = '🪟 Fenster'; b2 = '✓ Fertig'; }
        else { const was = st.typ === 'tuer' ? 'Tür' : 'Fenster'; txt = st.sub === 1 ? `${was}: Kreuz auf eine UNTERE Ecke${st.typ === 'tuer' ? ' (am Boden)' : ''}, tippen.` : `${was}: jetzt die schräg gegenüberliegende OBERE Ecke.`; b1 = 'Punkt setzen'; d1 = !a; b2 = 'Abbrechen'; }
        live = a ? `Wand ${a.wall + 1} · ${f2(a.s)} m · Höhe ${f2(a.y)} m` : 'Kreuz auf eine Wand richten';
      }
      el('arStep').textContent = step; el('arTxt').textContent = txt; el('arLive').textContent = live;
      B1.textContent = b1; B1.disabled = d1; B2.textContent = b2; B3.textContent = b3; B3.hidden = !b3;
      const now = performance.now();
      el('arInfo').textContent = (msg && now - msgT < 5000 ? '⚠ ' + msg + ' · ' : '') + (st.lost > 20 ? '⚠ Tracking unsicher – langsamer bewegen · ' : '') + (glb ? `Fotos ${st.frames.length}/${MAXF}` : 'Ohne Kamerafotos (nicht erlaubt)');
    }
    const ray = () => st.ray && { o: [...st.ray.o], d: [...st.ray.d] };
    B1.onclick = () => {
      buzz(); const a = st.aim;
      if (st.phase === 'boden' && st.floorY != null) st.phase = 'ecken';
      else if (st.phase === 'ecken' && a) { if (a.snap) close(); else { st.corners.push(ray()); redraw(); } }
      else if (st.phase === 'hoehe' && a) { st.hRay = { ...ray(), c: a.c }; st.height = a.h; st.heightSrc = 'ar'; st.phase = 'oeff'; redraw(); }
      else if (st.phase === 'oeff') {
        if (!st.sub) { st.typ = 'tuer'; st.sub = 1; }
        else if (a && st.sub === 1) { st.p1 = { ...ray(), wall: a.wall }; st.sub = 2; }
        else if (a && st.sub === 2) { if (a.wall !== st.p1.wall) say('Zweiter Punkt liegt auf einer anderen Wand.'); else { st.opens.push({ typ: st.typ, wall: a.wall, r1: st.p1, r2: ray() }); st.sub = 0; redraw(); } }
      }
      ui();
    };
    B2.onclick = () => {
      buzz();
      if (st.phase === 'boden' || (st.phase === 'ecken' && !st.corners.length)) return end(false);
      if (st.phase === 'ecken') { st.corners.pop(); redraw(); }
      else if (st.phase === 'hoehe') { st.height = 2.6; st.heightSrc = 'standard'; st.phase = 'oeff'; redraw(); }
      else if (st.phase === 'oeff') { if (st.sub) st.sub = 0; else return end(true); }
      ui();
    };
    B3.onclick = () => { buzz(); if (st.phase === 'ecken' && st.corners.length >= 3) close(); else if (st.phase === 'oeff' && !st.sub) { st.typ = 'fenster'; st.sub = 1; } ui(); };
    function close() { st.phase = 'hoehe'; redraw(); }
    function end(ok) { st.finished = ok; try { session.end(); } catch { /* schon beendet */ } }

    let grab = null, gdim = '', lastUi = 0;
    const invP = new THREE.Matrix4(), camM = new THREE.Matrix4(), v3 = new THREE.Vector3();
    renderer.setAnimationLoop((t, frame) => {
      if (!frame) return;
      const pose = frame.getViewerPose(ref);
      if (!pose) { st.lost++; renderer.render(scene, cam); return; }
      const view = pose.views[0], Mx = view.transform.matrix, Px = view.projectionMatrix;
      if (pose.emulatedPosition) st.lost++; else st.lost = Math.max(0, st.lost - 1);
      const o = [Mx[12], Mx[13], Mx[14]];
      invP.fromArray(Px).invert(); camM.fromArray(Mx); v3.set(0, 0, 0.5).applyMatrix4(invP).normalize().transformDirection(camM);
      const d = [v3.x, v3.y, v3.z]; st.ray = { o, d };
      // Bodenhöhe aus waagrechten Treffern (Median, laufend verfeinert)
      if (hitSrc) for (const h of frame.getHitTestResults(hitSrc)) { const p = h.getPose(ref); if (!p) continue; const m = p.transform.matrix, dy = o[1] - m[13]; if (m[5] > 0.95 && dy > 0.3 && dy < 2.4) { st.floorHits.push(m[13]); if (st.floorHits.length > 600) st.floorHits.shift(); } }
      if (st.floorHits.length >= 15) st.floorY = median(st.floorHits);
      if (st.floorY != null) st.camH.push(o[1] - st.floorY), st.camH.length > 200 && st.camH.shift();
      // Zielpunkt je Schritt
      st.aim = null; reticle.visible = dot.visible = ghost.visible = ghostLbl.visible = false;
      if (st.floorY != null) {
        if (st.phase === 'ecken' || st.phase === 'boden') {
          const p = rayFloor(o, d, st.floorY);
          if (p) {
            reticle.position.set(p[0], p[1] + 0.003, p[2]); reticle.visible = true;
            if (st.phase === 'ecken') {
              const C = cornersXZ(), n = C.length; let q = [p[0], p[2]], snap = false;
              if (n >= 3 && Math.hypot(q[0] - C[0][0], q[1] - C[0][1]) < 0.15) { q = C[0]; snap = true; reticle.position.set(q[0], st.floorY + 0.003, q[1]); }
              const len = n ? segTo(ghost, C[n - 1], q, st.floorY, 0.01) : 0; ghost.visible = n > 0;
              if (n) { const tx = f2(len) + ' m'; if (tx !== ghostTxt) { ghostTxt = tx; const nl = label(tx); ghostLbl.material.map.dispose(); ghostLbl.material.dispose(); ghostLbl.material = nl.material; } ghostLbl.position.set((C[n - 1][0] + q[0]) / 2, st.floorY + 0.1, (C[n - 1][1] + q[1]) / 2); ghostLbl.visible = true; }
              st.aim = { len, snap };
            }
          }
        } else if (st.phase === 'hoehe') {
          let best = null; cornersXZ().forEach((c, i) => { const r = rayVertical(o, d, c); if (r && r.dist < 0.25 && (!best || r.dist < best.dist)) best = { ...r, c: i }; });
          if (best) { const h = best.y - st.floorY; if (h > 1.7 && h < 6) { const c = cornersXZ()[best.c]; dot.position.set(c[0], best.y, c[1]); dot.visible = true; st.aim = { h, c: best.c }; } }
        } else if (st.phase === 'oeff') {
          const C = cornersXZ(); let best = null;
          C.forEach((a, i) => { const r = rayWall(o, d, a, C[(i + 1) % C.length]); if (r && r.s > -0.05 && r.s < r.L + 0.05 && r.y > st.floorY - 0.1 && r.y < st.floorY + st.height + 0.2 && (!best || r.t < best.t)) best = { ...r, wall: i }; });
          if (best) { dot.position.set(o[0] + d[0] * best.t, o[1] + d[1] * best.t, o[2] + d[2] * best.t); dot.visible = true; st.aim = { wall: best.wall, s: best.s, y: best.y - st.floorY }; }
        }
      }
      // Fotos mit Kameralage (nur wenn bewegt und ruhig gehalten)
      if (glb && view.camera && st.phase !== 'boden' && !pose.emulatedPosition && st.frames.length < MAXF && t - st.lastT > 400) {
        const L = st.last, dot3 = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
        const moved = !L || Math.hypot(o[0] - L.o[0], o[1] - L.o[1], o[2] - L.o[2]) > 0.25 || dot3(d, L.d) < 0.985;
        const steady = st.prevD && dot3(d, st.prevD) > 0.99993;
        if (moved && steady) {
          try {
            const cw = view.camera.width, ch = view.camera.height, sc = FOTO_PX / Math.max(cw, ch), SW = Math.round(cw * sc), SH = Math.round(ch * sc);
            if (!grab || gdim !== SW + 'x' + SH) { grab = grabber(gl, SW, SH); gdim = SW + 'x' + SH; }
            if (grab) { const data = grab(glb.getCameraImage(view.camera)); st.frames.push({ data, W: SW, H: SH, M: Float32Array.from(Mx), P: Float32Array.from(Px) }); st.last = { o, d }; st.lastT = t; }
          } catch (e) { say('Kamerabild: ' + e.message); glb = null; }
          renderer.resetState();
        }
      }
      st.prevD = d;
      renderer.render(scene, cam);
      if (t - lastUi > 150) { lastUi = t; ui(); }
    });
    ui();
    session.addEventListener('end', () => {
      renderer.setAnimationLoop(null); root.hidden = true;
      const res = st.finished && st.corners.length >= 3 && st.floorY != null ? (() => {
        const corners = cornersXZ();
        let height = st.height;
        if (st.hRay) { const r = rayVertical(st.hRay.o, st.hRay.d, corners[st.hRay.c]); if (r) height = r.y - st.floorY; }
        const opens = st.opens.map(o => { const a = corners[o.wall], b = corners[(o.wall + 1) % corners.length], r1 = rayWall(o.r1.o, o.r1.d, a, b), r2 = rayWall(o.r2.o, o.r2.d, a, b); return r1 && r2 ? { typ: o.typ, wall: o.wall, s0: r1.s, s1: r2.s, y0: r1.y - st.floorY, y1: r2.y - st.floorY } : null; }).filter(Boolean);
        return { corners, floorY: st.floorY, height, heightSrc: st.heightSrc, opens, frames: st.frames, camH: median(st.camH) };
      })() : null;
      try { renderer.dispose(); renderer.forceContextLoss(); } catch { /* egal */ }
      resolve(res);
    });
  });
}
