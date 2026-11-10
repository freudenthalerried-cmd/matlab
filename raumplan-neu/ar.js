'use strict';
/* Raumplan Versuch – Variante ohne Blätter (WebXR/ARCore).
   Das Handy verfolgt seine eigene Bewegung. Gespeichert werden nur Kamerabilder mit der zugehörigen Kameralage, keine Tiefendaten.
   Ein Referenzmaß (z. B. Türbreite) wird einmal abgegriffen: Handy an das eine Ende halten, dann an das andere. */
const ARF = (() => {
  const el = id => document.getElementById(id), MAXF = 70, st = { s: null };
  const f2 = (v, d = 1) => v.toFixed(d).replace('.', ',');
  async function supported() { if (!navigator.xr) return false; try { return await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) { return false; } }
  // Kamerabild verkleinert als Graubild holen (oberste Zeile zuerst)
  function grabber(gl, SW, SH) {
    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p; varying vec2 t; void main(){ t = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, 'precision mediump float; uniform sampler2D u; varying vec2 t; void main(){ gl_FragColor = texture2D(u, t); }'); gl.compileShader(fs);
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const loc = gl.getAttribLocation(pr, 'p'), px = new Uint8Array(SW * SH * 4);
    return camTex => { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, SW, SH); gl.useProgram(pr); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, camTex); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.readPixels(0, 0, SW, SH, gl.RGBA, gl.UNSIGNED_BYTE, px); const g = new Uint8Array(SW * SH); for (let y = 0; y < SH; y++) { const r = (SH - 1 - y) * SW * 4; for (let x = 0; x < SW; x++) { const j = r + x * 4; g[y * SW + x] = (px[j] * 77 + px[j + 1] * 151 + px[j + 2] * 28) >> 8; } } return g; };
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  function ui() { const T = el('arTxt'), I = el('arInfo'), B = el('arBtn'), B2 = el('arBtn2'); if (!T) return; const n = st.frames.length, fl = RP.floorLevel(st.hitsY), hgt = fl !== null && st.pos ? st.pos[1] - fl : null;
    let warn = ''; if (st.emu) warn += '⚠ Das Handy hat die Orientierung verloren. Langsamer bewegen. '; if (st.noCam > 150) warn += '⚠ Kein Kamerabild vom Handy. '; if (st.camErr) warn += '⚠ ' + st.camErr + ' ';
    B.disabled = false;
    if (st.phase === 'ref1') { T.textContent = 'Referenzmaß: Handy mit einer Kante an das EINE Ende halten, z. B. an die linke Türkante.'; B.textContent = 'Hier ist Ende 1'; B2.textContent = 'Ohne Referenz'; B.disabled = !st.pos; }
    else if (st.phase === 'ref2') { T.textContent = 'Jetzt an das ANDERE Ende. Gleiche Handykante, Handy nicht drehen.'; B.textContent = 'Hier ist Ende 2'; B2.textContent = 'Zurück'; }
    else if (st.phase === 'refok') { const d = (st.refMeas / st.refReal - 1) * 100; T.textContent = `Handy misst ${f2(st.refMeas / 10)} cm, echt ${f2(st.refReal / 10)} cm (${d > 0 ? '+' : ''}${f2(d)} %).` + (Math.abs(d) > 8 ? ' Das passt schlecht zusammen, bitte nochmal.' : ''); B.textContent = 'Weiter: Boden filmen'; B2.textContent = 'Referenz nochmal'; }
    else { T.textContent = n >= MAXF ? 'Genug Bilder. Bitte „Fertig“ tippen.' : 'Langsam den ganzen Boden filmen, Handy schräg nach unten, bis zu jeder Wand. Einmal im Raum herumgehen.'; B.textContent = 'Fertig'; B2.textContent = 'Abbrechen'; B.disabled = n < 10; }
    I.textContent = warn + (st.phase === 'film' ? `Bilder ${n} von ${MAXF} · ` : '') + (hgt !== null ? `Boden erkannt, Handy ${f2(hgt, 2)} m hoch` : 'Boden wird gesucht: Handy schräg nach unten halten'); }
  function conclude() { const fl = RP.floorLevel(st.hitsY), r = { frames: st.frames, floorY: fl !== null ? fl : st.floorRef ? 0 : null, floorSrc: fl !== null ? 'treffer' : st.floorRef ? 'geschätzt' : 'keiner', hits: st.hitsY.length, ref: st.refMeas ? { real: st.refReal, meas: st.refMeas, pts: st.ref } : null, secs: Math.round((Date.now() - st.t0) / 1000), lost: st.lostN, camErr: st.camErr || null, features: st.features };
    if (st.cancelled) r.err = 'abbruch'; else if (!st.frames.length) r.err = 'nobilder'; else if (r.floorY === null) r.err = 'noboden'; const d = st.done; st.done = null; d && d(r); }
  async function start(opts, onDone) {
    const root = el('arUI'); root.hidden = false;
    Object.assign(st, { frames: [], hitsY: [], ref: [], refReal: opts.refCm ? opts.refCm * 10 : null, refMeas: null, pos: null, fwd: null, prevFwd: null, last: null, lastT: 0, lastUi: 0, emu: false, lostN: 0, noCam: 0, camErr: '', done: onDone, grab: null, gdim: '', phase: opts.refCm ? 'ref1' : 'film', t0: Date.now(), finished: false, cancelled: false, floorRef: false, features: [] });
    let s; try { s = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['camera-access'], optionalFeatures: ['hit-test', 'dom-overlay', 'local-floor'], domOverlay: { root } }); }
    catch (e) { root.hidden = true; st.done = null; return onDone({ err: 'noar', msg: e.message }); }
    st.s = s; try { st.features = Array.from(s.enabledFeatures || []); } catch (e) { }
    const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { xrCompatible: true }); await s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
    let space; try { space = await s.requestReferenceSpace('local-floor'); st.floorRef = true; } catch (e) { space = await s.requestReferenceSpace('local'); }
    let glb = null; try { glb = new XRWebGLBinding(s, gl); } catch (e) { st.camErr = 'Kamerazugriff: ' + e.message; }
    let hit = null; try { const vs = await s.requestReferenceSpace('viewer'); hit = await s.requestHitTestSource({ space: vs }); } catch (e) { }
    s.addEventListener('end', () => { root.hidden = true; st.s = null; if (!st.finished) { st.finished = true; conclude(); } });
    el('arBtn').onclick = () => { if (st.phase === 'ref1' && st.pos) { st.ref = [st.pos.slice()]; st.phase = 'ref2'; } else if (st.phase === 'ref2' && st.pos) { st.ref.push(st.pos.slice()); st.refMeas = dist(st.ref[0], st.ref[1]) * 1000; st.phase = 'refok'; } else if (st.phase === 'refok') st.phase = 'film'; else if (st.phase === 'film') finish(); navigator.vibrate && navigator.vibrate(30); ui(); };
    el('arBtn2').onclick = () => { if (st.phase === 'ref1') { st.refReal = null; st.phase = 'film'; } else if (st.phase === 'ref2' || st.phase === 'refok') { st.refMeas = null; st.phase = 'ref1'; } else { st.cancelled = true; finish(); } ui(); };
    ui();
    const frame = (t, f) => { if (!st.s) return; s.requestAnimationFrame(frame);
      const bl = s.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const vp = f.getViewerPose(space); if (!vp || !vp.views.length) { st.lostN++; return; } const view = vp.views[0], M = view.transform.matrix, P = view.projectionMatrix;
      st.pos = [M[12], M[13], M[14]]; st.fwd = [-M[8], -M[9], -M[10]]; st.emu = !!vp.emulatedPosition; if (st.emu) st.lostN++;
      if (hit) { try { for (const h of f.getHitTestResults(hit)) { const p = h.getPose(space); if (!p) continue; const m = p.transform.matrix, dy = st.pos[1] - m[13]; if (m[5] > 0.95 && dy > 0.4 && dy < 2.3 && st.hitsY.length < 6000) st.hitsY.push(m[13]); } } catch (e) { } }
      if (!view.camera) st.noCam++;
      if (st.phase === 'film' && glb && view.camera && !st.emu && t - st.lastT > 450 && st.frames.length < MAXF && st.fwd[1] < 0.15) { const L = st.last, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], moved = !L || dist(st.pos, L.p) > 0.12 || dot(st.fwd, L.f) < 0.99, steady = st.prevFwd && dot(st.fwd, st.prevFwd) > 0.99994;
        if (moved && steady) { try { const cw = view.camera.width, ch = view.camera.height, sc = 960 / Math.max(cw, ch), SW = Math.round(cw * sc), SH = Math.round(ch * sc); if (!st.grab || st.gdim !== SW + 'x' + SH) { st.grab = grabber(gl, SW, SH); st.gdim = SW + 'x' + SH; }
            if (st.grab) { const g = st.grab(glb.getCameraImage(view.camera)); st.frames.push({ g, W: SW, H: SH, M: Float32Array.from(M), P: Float32Array.from(P), t: Math.round(t) }); st.last = { p: st.pos, f: st.fwd }; st.lastT = t; }
            gl.bindFramebuffer(gl.FRAMEBUFFER, bl.framebuffer); gl.viewport(0, 0, bl.framebufferWidth, bl.framebufferHeight); } catch (e) { st.camErr = 'Kamerabild: ' + e.message; } } }
      st.prevFwd = st.fwd; if (t - st.lastUi > 300) { st.lastUi = t; ui(); } };
    s.requestAnimationFrame(frame);
  }
  function finish() { if (!st.s || st.finished) return; st.finished = true; const s = st.s; conclude(); try { s.end(); } catch (e) { } }
  return { supported, start, finish, MAXF, _st: st };
})();
