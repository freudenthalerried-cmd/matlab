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
