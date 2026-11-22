// Simulation fürs Aufmaß ohne Handy: L-förmiger Raum mit bekannten Maßen und Mustern an den Wänden,
// "gefilmt" aus vielen Kamerapositionen. Liefert dasselbe Ergebnisobjekt wie die AR-Sitzung.
// Aufruf im Browser: const { synthScan } = await import('./test/synth.js'); const res = await synthScan();
import * as THREE from '../lib/three.module.min.js';

export const WAHR = [[0, 0], [4.2, 0], [4.2, 3.0], [2.5, 3.0], [2.5, 4.1], [0, 4.1]]; // Innenmaße in m
export const HOEHE = 2.55;

function muster(text, farbe, L, H) {
  const c = document.createElement('canvas'); c.width = Math.round(L * 200); c.height = Math.round(H * 200); const x = c.getContext('2d');
  x.fillStyle = farbe; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#0006'; x.lineWidth = 3;
  for (let m = 0; m <= L; m += 0.5) { x.beginPath(); x.moveTo(m * 200, 0); x.lineTo(m * 200, c.height); x.stroke(); }
  for (let m = 0; m <= H; m += 0.5) { x.beginPath(); x.moveTo(0, c.height - m * 200); x.lineTo(c.width, c.height - m * 200); x.stroke(); }
  x.fillStyle = '#111'; x.font = 'bold 160px sans-serif'; x.textAlign = 'center'; x.fillText(text, c.width / 2, c.height / 2 + 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function synthScan({ drehung = 25, versatz = [1.3, -2.0], bodenY = -1.45, rauschen = 0 } = {}) {
  const a = THREE.MathUtils.degToRad(drehung), ca = Math.cos(a), sa = Math.sin(a);
  const xr = ([x, z]) => [x * ca - z * sa + versatz[0], x * sa + z * ca + versatz[1]];
  const C = WAHR.map(xr), N = C.length;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#222');
  const farben = ['#e8c07a', '#9fc3a0', '#a7b8d8', '#e0a0a0', '#c9b3e0', '#d8d890'];
  for (let i = 0; i < N; i++) {
    const p = C[i], q = C[(i + 1) % N], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, HOEHE), new THREE.MeshBasicMaterial({ map: muster(String(i + 1), farben[i], L, HOEHE), side: THREE.DoubleSide }));
    m.position.set((p[0] + q[0]) / 2, bodenY + HOEHE / 2, (p[1] + q[1]) / 2); m.rotation.y = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); scene.add(m);
  }
  const fc = document.createElement('canvas'); fc.width = fc.height = 256; const fx = fc.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { fx.fillStyle = (i + j) % 2 ? '#6b4a32' : '#d9c3a0'; fx.fillRect(i * 32, j * 32, 32, 32); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 3); ft.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.set(...xr([2, 2]).flatMap((v, k) => k ? [bodenY, v] : [v])); scene.add(floor);

  const W = 384, H = 512, rt = new THREE.WebGLRenderTarget(W, H), r = new THREE.WebGLRenderer(); r.setSize(W, H, false);
  const cam = new THREE.PerspectiveCamera(65, W / H, 0.05, 50); cam.rotation.order = 'YXZ';
  const frames = [], px = new Uint8Array(W * H * 4);
  for (const st of [[1.2, 1.2], [3.2, 1.5], [1.2, 3.2]]) for (let k = 0; k < 9; k++) for (const pitch of [-0.25, -0.85]) {
    const [x, z] = xr(st); cam.position.set(x, bodenY + 1.4, z); cam.rotation.set(pitch, k * 2 * Math.PI / 9, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    r.setRenderTarget(rt); r.render(scene, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, px);
    const data = new Uint8ClampedArray(W * H * 4), row = W * 4; for (let y = 0; y < H; y++) data.set(px.subarray((H - 1 - y) * row, (H - y) * row), y * row);
    frames.push({ data, W, H, M: Float32Array.from(cam.matrixWorld.elements), P: Float32Array.from(cam.projectionMatrix.elements) });
  }
  r.dispose(); rt.dispose();
  const n = () => (Math.random() - 0.5) * 2 * rauschen;
  return {
    corners: C.map(([x, z]) => [x + n(), z + n()]), floorY: bodenY, height: HOEHE, heightSrc: 'ar', camH: 1.4, frames,
    opens: [{ typ: 'tuer', wall: 2, s0: 0.3, s1: 1.15, y0: 0, y1: 2.05 }, { typ: 'fenster', wall: 0, s0: 1.4, s1: 2.8, y0: 0.9, y1: 2.2 }],
  };
}

// ---------- Roh-Scan wie vom Handy: Tiefenraster + Kamerabild + Kameralage je Aufnahme ----------
// Raum wie oben (L-Form), dazu Decke, Schrank (2,0 m hoch) an der Westwand, Tisch, Sofa, offene Tür mit Flur dahinter.
// opts: zeilenUnten = Tiefenraster mit Zeile 0 unten (wie am S25 beobachtet), bildKopf = Kamerabild steht kopf,
//       rauschen = Tiefenfehler (Anteil), dach = Dachschräge an der Nordwand
export const HOEHE2 = 2.5;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export async function synthRoh({ drehung = 25, versatz = [1.3, -2.0], bodenY = -1.45, rauschen = 0.012, zeilenUnten = false, bildKopf = false, dach = false, tuerOffen = true } = {}) {
  const H = HOEHE2, world = new THREE.Group(), scene = new THREE.Scene(); scene.background = new THREE.Color('#9db8d0'); scene.add(world);
  world.rotation.y = -THREE.MathUtils.degToRad(drehung); world.position.set(versatz[0], bodenY, versatz[1]);
  const mat = (t, f, L, Hh) => new THREE.MeshBasicMaterial({ map: muster(t, f, L, Hh), side: THREE.DoubleSide });
  const wand = (a, b, y0, y1, t, f) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = new THREE.Mesh(new THREE.PlaneGeometry(L, y1 - y0), mat(t, f, L, y1 - y0)); m.position.set((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2); m.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]); world.add(m); };
  const kiste = (x0, x1, z0, z1, y0, y1, f, t = '') => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat(t, f, Math.max(x1 - x0, z1 - z0), y1 - y0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); world.add(m); };
  const F = ['#e8c07a', '#9fc3a0', '#a7b8d8', '#e0a0a0', '#c9b3e0', '#d8d890'];
  WAHR.forEach((p, i) => {
    const q = WAHR[(i + 1) % WAHR.length];
    if (i === 1 && tuerOffen) { wand([4.2, 0], [4.2, 1.0], 0, H, '2', F[1]); wand([4.2, 1.9], [4.2, 3.0], 0, H, '2', F[1]); wand([4.2, 1.0], [4.2, 1.9], 2.05, H, '', F[1]); }
    else wand(p, q, 0, H, String(i + 1), F[i]);
  });
  if (tuerOffen) { wand([5.5, 0], [5.5, 3.0], 0, H, 'F', '#cccccc'); wand([4.2, 0.2], [5.5, 0.2], 0, H, '', '#bbbbbb'); wand([4.2, 2.8], [5.5, 2.8], 0, H, '', '#bbbbbb'); }
  const fc = document.createElement('canvas'); fc.width = fc.height = 256; const fx = fc.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { fx.fillStyle = (i + j) % 2 ? '#6b4a32' : '#d9c3a0'; fx.fillRect(i * 32, j * 32, 32, 32); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 4); ft.colorSpace = THREE.SRGBColorSpace;
  const boden = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: ft, side: THREE.DoubleSide })); boden.rotation.x = -Math.PI / 2; boden.position.set(2.5, 0, 2); world.add(boden);
  if (dach) { const d = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), mat('D', '#f0e8d8', 4.2, 2.2)); d.position.set(2.1, 1.2 + 0.75, 0.75 + 0.02); d.rotation.x = -Math.PI / 4; d.rotation.order = 'YXZ'; world.add(d); }
  const decke = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat('', '#f4f4f0', 8, 8)); decke.rotation.x = Math.PI / 2; decke.position.set(2.5, H, 2); world.add(decke);
  kiste(0, 0.6, 1.0, 2.2, 0, 2.0, '#7a5a3a', 'S');            // Schrank an der Westwand
  kiste(1.7, 2.9, 1.25, 1.95, 0.7, 0.75, '#8b5a3c');           // Tischplatte
  for (const [x, z] of [[1.75, 1.3], [2.85, 1.3], [1.75, 1.9], [2.85, 1.9]]) kiste(x - 0.03, x + 0.03, z - 0.03, z + 0.03, 0, 0.7, '#5a3a22');
  if (!dach) { kiste(2.6, 4.1, 0.05, 0.85, 0, 0.42, '#5f7f9a'); kiste(2.6, 4.1, 0.05, 0.25, 0.42, 0.85, '#5f7f9a'); }   // Sofa an der Nordwand
  scene.updateMatrixWorld(true);

  const W = 208, Hpx = 448, GW = 64, GH = 138, rtC = new THREE.WebGLRenderTarget(W, Hpx), rtD = new THREE.WebGLRenderTarget(GW, GH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const r = new THREE.WebGLRenderer(); r.setSize(W, Hpx, false);
  const tiefe = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: 'varying float vZ; void main(){ vec4 p = modelViewMatrix * vec4(position, 1.0); vZ = -p.z; gl_Position = projectionMatrix * p; }', fragmentShader: 'varying float vZ; void main(){ float mm = floor(vZ * 1000.0 + 0.5); gl_FragColor = vec4(floor(mm / 256.0) / 255.0, mod(mm, 256.0) / 255.0, 0.0, 1.0); }' });
  const cam = new THREE.PerspectiveCamera(66, W / Hpx, 0.05, 50); cam.rotation.order = 'YXZ';
  const SRGB = new Uint8Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; SRGB[i] = Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); }
  const rnd = rng(7), gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rnd(); return (s - 3) * 1.41; };
  const kf = [], pc = new Uint8Array(W * Hpx * 4), pd = new Uint8Array(GW * GH * 4), v = new THREE.Vector3();
  const orte = [[1.2, 0.8], [3.3, 1.3], [3.4, 2.3], [2.0, 2.5], [1.3, 3.4], [1.1, 2.7]];
  for (const [ox, oz] of orte) for (let k = 0; k < 12; k++) for (const pitch of [-0.8, -0.15, 0.55]) {
    v.set(ox + (rnd() - 0.5) * 0.2, 1.45 + (rnd() - 0.5) * 0.1, oz + (rnd() - 0.5) * 0.2).applyMatrix4(world.matrixWorld); cam.position.copy(v);
    cam.rotation.set(pitch + (rnd() - 0.5) * 0.1, k * Math.PI / 6 + (rnd() - 0.5) * 0.2, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    scene.overrideMaterial = null; r.setRenderTarget(rtC); r.render(scene, cam); r.readRenderTargetPixels(rtC, 0, 0, W, Hpx, pc);
    scene.overrideMaterial = tiefe; const bg = scene.background; scene.background = null; r.setClearColor(0x000000, 1); r.setRenderTarget(rtD); r.clear(); r.render(scene, cam); r.readRenderTargetPixels(rtD, 0, 0, GW, GH, pd); scene.background = bg;
    const data = new Uint8ClampedArray(W * Hpx * 4), row = W * 4;
    for (let y = 0; y < Hpx; y++) { const src = (bildKopf ? y : Hpx - 1 - y) * row, dst = y * row; for (let x = 0; x < row; x++) data[dst + x] = (x & 3) === 3 ? 255 : SRGB[pc[src + x]]; }
    const z = new Uint16Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const s = ((zeilenUnten ? j : GH - 1 - j) * GW + i) * 4, mm = pd[s] * 256 + pd[s + 1]; z[j * GW + i] = mm ? Math.max(1, Math.round(mm * (1 + rauschen * gauss()) + 8 * gauss() * (rauschen > 0 ? 1 : 0))) : 0; }
    kf.push({ M: Float32Array.from(cam.matrixWorld.elements), P: Float32Array.from(cam.projectionMatrix.elements), GW, GH, z, img: { data, W, H: Hpx } });
  }
  r.dispose(); rtC.dispose(); rtD.dispose();
  return { kf };
}
