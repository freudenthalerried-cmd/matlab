// WebXR-Attrappe für automatische Tests (ohne Handy): spielt der echten Aufnahme (starteScan in aufmass.js)
// die Aufnahmen des simulierten Raums als XR-Bilder vor – mit Startphase ohne Orientierung, fehlender Tiefe
// und einem Orientierungsverlust mittendrin. Ersetzt navigator.xr, XRWebGLLayer und XRWebGLBinding.
// opts: zeilenUnten (Tiefenpuffer verkehrt wie am S25), ohneKamera, werfen (getDepthInMeters wirft n-mal),
//       immerEmu (Gerät meldet dauerhaft „Position geschätzt“), zittern (Grad Unruhe je Bild), tiefeSpaet (Bilder ohne Tiefe am Anfang),
//       tiefeNie, tiefeWirft (getDepthInformation wirft), stehen (Position bleibt 0 = wirklich keine Lage), ohneTreffer (kein Boden per Hit-Test)
export async function installiere(opts = {}) {
  const { synthRoh } = await import('./synth.js');
  const roh = await synthRoh(opts.synth || {});
  const KF = roh.kf, W = KF[0].img.W, H = KF[0].img.H, st = { bilder: 0, abfragen: 0, sitzung: null, max: 0, fehlwurf: opts.werfen || 0 };
  // Ablauf: 12 Bilder ohne Orientierung, dann je Aufnahme 4 Bilder; Aufnahme 3–5 ohne Tiefe; Aufnahme 60–62 Orientierung weg
  const plan = []; for (let i = 0; i < 12; i++) plan.push({ k: 0, emu: true });
  KF.forEach((f, k) => { for (let r = 0; r < 4; r++) plan.push({ k, emu: k >= 60 && k < 63, ohneTiefe: k >= 3 && k < 6 }); });
  const rnd = (() => { let a = 5; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff - 0.5; }; })();

  class Layer {
    constructor(session, gl) { this.gl = gl; this.framebuffer = null; this.framebufferWidth = gl.drawingBufferWidth; this.framebufferHeight = gl.drawingBufferHeight; }
    getViewport() { return { x: 0, y: 0, width: 208, height: 448 }; }
  }
  class Binding {
    constructor(session, gl) { this.gl = gl; this.tex = gl.createTexture(); }
    getCameraImage() {
      const gl = this.gl, f = st.akt, row = W * 4, buf = new Uint8Array(W * H * 4);
      for (let y = 0; y < H; y++) buf.set(f.img.data.subarray((H - 1 - y) * row, (H - y) * row), y * row);   // Zeile 0 = unten, wie bei GL-Texturen
      gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return this.tex;
    }
  }
  const tiefe = f => {
    const w = f.GW, h = f.GH, data = new Uint16Array(w * h);
    // zeilenUnten: Puffer steht kopf, die Matrix gleicht das NICHT aus (so verhielt sich das S25 im Feldtest)
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) data[r * w + c] = f.z[(opts.zeilenUnten ? h - 1 - r : r) * w + c];
    const m = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    return { width: w, height: h, data: data.buffer, rawValueToMeters: 0.001, normDepthBufferFromNormView: { matrix: m },
      getDepthInMeters(u, v) { st.abfragen++; if (st.fehlwurf > 0) { st.fehlwurf--; throw new DOMException('Tiefe nicht lesbar', 'InvalidStateError'); } if (u < 0 || u > 1 || v < 0 || v > 1) throw new RangeError('außerhalb'); return data[Math.min(h - 1, Math.floor(v * h)) * w + Math.min(w - 1, Math.floor(u * w))] * 0.001; } };
  };
  class Sitzung extends EventTarget {
    constructor() { super(); this.renderState = {}; this.enabledFeatures = ['depth-sensing', 'dom-overlay'].concat(opts.ohneKamera ? [] : ['camera-access']); this.depthDataFormat = 'luminance-alpha'; this.depthUsage = 'cpu-optimized'; this.inputSources = []; this.environmentBlendMode = 'alpha-blend'; this.cb = null; this.t = 1000; this.zu = false; }
    updateRenderState(s) { Object.assign(this.renderState, s); }
    async requestReferenceSpace(type) { return { type }; }
    async requestHitTestSource() { return { cancel() {} }; }
    requestAnimationFrame(cb) { this.cb = cb; if (!this.zu) setTimeout(() => this.bild(), 0); return 1; }
    cancelAnimationFrame() { this.cb = null; }
    bild() {
      const cb = this.cb; if (!cb || this.zu) return; this.cb = null;
      const s = plan[Math.min(st.bilder, plan.length - 1)], f = KF[s.k]; st.bilder++; st.akt = f; this.t += 100;
      if (st.bilder > plan.length + 30) return;   // Vorrat zu Ende: stehen bleiben, der Test tippt „Fertig“
      let M = f.M;
      if (opts.zittern) { const a = opts.zittern * 0.01745 * 2 * rnd(), c = Math.cos(a), si = Math.sin(a); M = Float32Array.from(f.M); for (let q = 0; q < 3; q++) { const x = f.M[q], z = f.M[8 + q]; M[q] = c * x + si * z; M[8 + q] = -si * x + c * z; } }
      if (opts.stehen) { M = Float32Array.from(M); M[12] = M[13] = M[14] = 0; }
      const ohneT = s.ohneTiefe || opts.tiefeNie || st.bilder < (opts.tiefeSpaet || 0);
      const view = { eye: 'none', transform: { matrix: M }, projectionMatrix: f.P, camera: opts.ohneKamera ? undefined : { width: W * 4, height: H * 4 } };
      const frame = { session: this, getViewerPose: () => ({ emulatedPosition: !!s.emu || !!opts.immerEmu || !!opts.stehen, views: [view], transform: view.transform }), getHitTestResults: () => { const dy = -M[9]; if (dy < 0.2 || opts.ohneTreffer) return []; const t = (M[13] - (opts.bodenY ?? -1.45)) / dy, hm = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, M[12] - M[8] * t, opts.bodenY ?? -1.45, M[14] - M[10] * t, 1]); return [{ getPose: () => ({ transform: { matrix: hm } }) }]; }, getDepthInformation: () => { if (opts.tiefeWirft) throw new DOMException('Depth sensing not enabled', 'NotSupportedError'); return ohneT ? null : tiefe(f); } };
      const t0 = performance.now(); cb(this.t, frame); st.max = Math.max(st.max, performance.now() - t0);
    }
    async end() { if (this.zu) return; this.zu = true; this.dispatchEvent(new Event('end')); }
  }
  window.XRWebGLLayer = Layer; window.XRWebGLBinding = Binding;
  WebGL2RenderingContext.prototype.makeXRCompatible = async function () {};
  const xr = { isSessionSupported: async () => true, requestSession: async (mode, init) => { st.init = init; st.sitzung = new Sitzung(); return st.sitzung; } };
  Object.defineProperty(navigator, 'xr', { value: xr, configurable: true });
  window.xrAttrappe = st; st.planLaenge = plan.length;
  return st;
}
