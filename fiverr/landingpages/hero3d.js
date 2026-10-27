/* Real-time 3D hero scenes for the classic demos (three.js r147, UMD).
   <canvas class="h3d" data-scene="wallbox|stones|cards"> — the scene follows the mouse, can be dragged
   (wallbox, stones), floats gently, pauses when off screen and renders a still frame for reduced motion. */
(() => {
  'use strict';
  if (!window.THREE || !THREE.RoomEnvironment || !THREE.RoundedBoxGeometry) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, {passive: true});

  const phys = o => new THREE.MeshPhysicalMaterial(Object.assign({roughness: .35, clearcoat: .6, clearcoatRoughness: .2}, o));
  const rbox = (w, h, d, r, mat) => new THREE.Mesh(new THREE.RoundedBoxGeometry(w, h, d, 4, r), mat);
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
  const bolt = (s, depth, mat) => {
    const sh = new THREE.Shape();
    [[.15, 1], [-.45, -.05], [-.05, -.05], [-.2, -1], [.45, .15], [.05, .15], [.15, 1]].forEach(([x, y], i) => i ? sh.lineTo(x * s, y * s) : sh.moveTo(x * s, y * s));
    const g = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: true, bevelSize: s * .04, bevelThickness: s * .04, bevelSegments: 2});
    g.center();
    return new THREE.Mesh(g, mat);
  };

  // ---------------- scenes ----------------
  const SCENES = {
    wallbox(root, tick) {                       // electrician: wallbox, coiled cable, solar panel, flying bolts
      const white = phys({color: 0xf4f5f7, roughness: .25, clearcoat: 1});
      const glass = phys({color: 0x0d1420, roughness: .08, metalness: .2, clearcoat: 1});
      const amber = new THREE.MeshStandardMaterial({color: 0xffc928, emissive: 0xffb300, emissiveIntensity: 1.2});
      const rubber = phys({color: 0x1a1d22, roughness: .55, clearcoat: .2});
      const box = new THREE.Group(); root.add(box);
      box.add(rbox(1.7, 2.5, .55, .26, white));
      const face = rbox(1.36, 1.7, .06, .12, glass); face.position.set(0, .2, .29); box.add(face);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.34, .045, 16, 64), amber); ring.position.set(0, .35, .33); box.add(ring);
      const b = bolt(.22, .04, amber); b.position.set(0, .35, .33); box.add(b);
      const dots = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), amber.clone()); d.position.set(-.18 + i * .18, -.35, .33); box.add(d); return d; });
      // cable leaves the bottom and coils toward a plug
      const pts = [V(0, -1.25, 0), V(0, -1.7, .1)];
      for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3.2; pts.push(V(Math.cos(a) * .55 + .55, -1.9 - i * .012, Math.sin(a) * .55 + .3)); }
      pts.push(V(1.6, -2.1, .9), V(2.1, -1.8, 1.2));
      const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, .07, 12), rubber); root.add(cable);
      const plug = new THREE.Group(); plug.position.set(2.15, -1.75, 1.25); plug.rotation.z = .6; root.add(plug);
      plug.add(rbox(.32, .55, .32, .1, rubber));
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .14, 24), white); tip.position.y = .33; plug.add(tip);
      // solar panel
      const cells = canvasTex(512, 320, (g, w, h) => {
        g.fillStyle = '#0d2a5c'; g.fillRect(0, 0, w, h);
        for (let x = 0; x < 8; x++) for (let y = 0; y < 5; y++) { const gr = g.createLinearGradient(x * 64, y * 64, x * 64 + 64, y * 64 + 64); gr.addColorStop(0, '#1d4b9a'); gr.addColorStop(1, '#10336f'); g.fillStyle = gr; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
        g.strokeStyle = 'rgba(220,230,255,.35)'; g.lineWidth = 1.5;   // busbars
        for (let x = 0; x < 8; x++) for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x * 64 + 3 + k * 16, 0); g.lineTo(x * 64 + 3 + k * 16, h); g.stroke(); }
      });
      const panel = new THREE.Group(); panel.position.set(-2.3, 1.4, -1.2); panel.rotation.set(-.9, .5, .15); root.add(panel);
      panel.add(rbox(2.7, 1.75, .09, .03, phys({color: 0xc9ced6, metalness: .8, roughness: .3})));
      const cellMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 1.6), phys({map: cells, roughness: .15, metalness: .3, clearcoat: 1}));
      cellMesh.position.z = .05; panel.add(cellMesh);
      // orbiting bolts
      const flyers = Array.from({length: 7}, (_, i) => { const m = bolt(.12 + Math.random() * .08, .03, amber); root.add(m); return {m, a: i / 7 * Math.PI * 2, r: 2.4 + Math.random() * .6, y: (Math.random() - .5) * 2.6, sp: .3 + Math.random() * .25}; });
      root.position.set(.2, .5, 0);
      tick((t, dt) => {
        const p = .75 + Math.sin(t * 2.4) * .45;
        amber.emissiveIntensity = p; ring.rotation.z = t * .6;
        dots.forEach((d, i) => { d.material.emissiveIntensity = (Math.sin(t * 4 - i) > .3 ? 1.6 : .15); });
        flyers.forEach(f => { f.a += f.sp * dt; f.m.position.set(Math.cos(f.a) * f.r, f.y + Math.sin(f.a * 2) * .2, Math.sin(f.a) * f.r * .6); f.m.rotation.set(t, f.a * 2, t * .5); });
        panel.position.y = 1.4 + Math.sin(t * .9) * .12; plug.position.y = -1.75 + Math.sin(t * 1.3) * .06;
      });
      return {dist: 8.6, drag: true};
    },

    stones(root, tick) {                         // coaching: balanced pebbles, slow orbit rings
      const noisy = (r, sx, sy, sz, seed) => {
        const g = new THREE.SphereGeometry(r, 64, 40), p = g.attributes.position, v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * 3 + seed) * Math.sin(v.y * 4 + seed * 2) * Math.sin(v.z * 3.5 + seed) * .06; v.multiplyScalar(1 + n); p.setXYZ(i, v.x * sx, v.y * sy, v.z * sz); }
        g.computeVertexNormals(); return g;
      };
      const cols = [0x8fa58a, 0xd8ccb8, 0xc9826b, 0xb9b4ab, 0x3f5f4a];
      const spec = [[1.15, 1, .42, 1, 0], [.95, 1.05, .4, .95, .03], [.78, 1, .45, 1, -.05], [.6, 1.1, .5, .95, .04], [.42, 1, .55, 1, 0]];
      let y = -1.6;
      const stack = spec.map(([r, sx, sy, sz, off], i) => {
        const m = new THREE.Mesh(noisy(r, sx, sy, sz, i * 1.7), phys({color: cols[i], roughness: .55, clearcoat: .35}));
        y += r * sy * (i ? 1 : .2) + (i ? spec[i - 1][0] * spec[i - 1][2] : 0) * .92;
        m.position.set(off, y, 0); m.rotation.y = i; root.add(m); return {m, base: y, off};
      });
      const gold = new THREE.MeshStandardMaterial({color: 0xd8b56a, metalness: .9, roughness: .25});
      const rings = [[2.4, .2], [2.9, -.35]].map(([R, tilt]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(R, .018, 12, 160), gold); t.rotation.set(Math.PI / 2 + tilt, 0, tilt); t.position.y = .2; root.add(t); return t; });
      const motes = Array.from({length: 14}, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05 + Math.random() * .05, 16, 12), gold); root.add(m); return {m, a: Math.random() * 6.28, r: 2.4 + Math.random() * .6, y: -1 + Math.random() * 2.6, sp: .15 + Math.random() * .2}; });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({map: canvasTex(128, 128, (g, w) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(30,40,30,.45)'); r.addColorStop(1, 'rgba(30,40,30,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false}));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.95; root.add(shadow);
      tick((t, dt) => {
        stack.forEach((s, i) => { s.m.position.x = s.off + Math.sin(t * .8 + i * .6) * .03 * i + mx * .08 * i; s.m.rotation.z = Math.sin(t * .7 + i) * .03 * i - mx * .04 * i; s.m.position.y = s.base + Math.sin(t * 1.1) * .03 * i; });
        rings[0].rotation.z += dt * .15; rings[1].rotation.z -= dt * .1;
        motes.forEach(m => { m.a += m.sp * dt; m.m.position.set(Math.cos(m.a) * m.r, m.y + Math.sin(t + m.a) * .1, Math.sin(m.a) * m.r); });
      });
      return {dist: 10.5, drag: true, fov: 30};
    },

    cards(root, tick, el) {                      // app: floating task cards and 3D icons around the headline
      const tags = [['Marketing', '#7c5cff'], ['Produkt', '#2de2e6'], ['Dringend', '#ff6b8a'], ['Design', '#ffc928'], ['Team', '#2de2e6'], ['Finanzen', '#ff6b8a']];
      const titles = ['Launch-Kampagne', 'Onboarding testen', 'Angebot Berger', 'Logo final', 'Kick-off Q4', 'Rechnungen Q3'];
      const cardTex = (i) => canvasTex(512, 300, (g, w, h) => {
        g.fillStyle = '#161a30'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#ffffff14'; g.fillRect(0, 0, w, 6);
        g.font = '600 40px "Segoe UI",system-ui,sans-serif'; g.fillStyle = '#eef0ff'; g.fillText(titles[i], 36, 92);
        g.fillStyle = tags[i][1] + '40'; g.fillRect(36, 128, 190, 50); g.fillStyle = tags[i][1]; g.font = '600 28px "Segoe UI",system-ui,sans-serif'; g.fillText(tags[i][0], 52, 163);
        g.fillStyle = '#ffffff22'; g.fillRect(36, 216, 300, 14); g.fillStyle = tags[i][1]; g.fillRect(36, 216, 120 + i * 30, 14);
        ['#7c5cff', '#2de2e6', '#ff6b8a'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(420 + k * 26, 222, 22, 0, 7); g.fill(); g.strokeStyle = '#161a30'; g.lineWidth = 5; g.stroke(); });
      });
      const edge = phys({color: 0x2a2f55, roughness: .3, metalness: .2});
      const spots = [[-10.4, 2.3, -1], [-9.4, -1.7, .6], [-12.6, .2, -3], [10.4, 2.5, -.6], [9.4, -1.5, .8], [12.6, .4, -3]];
      const items = spots.map(([x, y, z], i) => {
        const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
        g.add(rbox(3, 1.76, .1, .14, edge));
        const face = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.62), new THREE.MeshBasicMaterial({map: cardTex(i), toneMapped: false})); face.position.z = .056; g.add(face);
        return {g, x, y, z, ph: Math.random() * 6.28, ry: (x < 0 ? .45 : -.45)};
      });
      const violet = phys({color: 0x7c5cff, roughness: .15, clearcoat: 1}), cyan = phys({color: 0x2de2e6, roughness: .15, clearcoat: 1}), pink = phys({color: 0xff6b8a, roughness: .2, clearcoat: 1});
      const check = new THREE.Group(); check.position.set(-7.3, .2, 1.6); root.add(check);
      check.add(rbox(1.1, 1.1, 1.1, .26, violet));
      const tick3 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.28, 0, .58), V(-.08, -.2, .58), V(.3, .25, .58)], false, 'catmullrom', 0), 24, .07, 10), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .4}));
      check.add(tick3);
      const tor = new THREE.Mesh(new THREE.TorusGeometry(.55, .22, 24, 64), cyan); tor.position.set(7.4, .9, 1.4); root.add(tor);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.42, 48, 32), pink); ball.position.set(-7, 3.3, -.4); root.add(ball);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(.42, .7, 48), cyan); cone.position.set(7, -2.1, .6); root.add(cone);
      const floaters = [check, tor, ball, cone].map(o => ({o, y: o.position.y, ph: Math.random() * 6.28}));
      tick((t) => {
        items.forEach(it => { it.g.position.y = it.y + Math.sin(t * .8 + it.ph) * .18; it.g.rotation.set(Math.sin(t * .5 + it.ph) * .06 - my * .2, it.ry + mx * .35, Math.sin(t * .4 + it.ph) * .03); it.g.position.x = it.x + mx * (2.2 - it.z * .4); });
        floaters.forEach(f => { f.o.position.y = f.y + Math.sin(t * 1.1 + f.ph) * .2; f.o.rotation.x = t * .5 + f.ph; f.o.rotation.y = t * .7; });
      });
      return {dist: 16, drag: false, fov: 40, still: true};
    },
  };

  // ---------------- runner ----------------
  document.querySelectorAll('canvas.h3d').forEach(canvas => {
    const make = SCENES[canvas.dataset.scene];
    if (!make) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'}); } catch (_) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0, 0);
    const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new THREE.RoomEnvironment(), .04).texture;
    const key = new THREE.DirectionalLight(0xfff2e0, 1.3); key.position.set(5, 8, 7); scene.add(key);
    const root = new THREE.Group(), spinner = new THREE.Group(); spinner.add(root); scene.add(spinner);
    const ticks = [];
    const cfg = make(root, f => ticks.push(f), canvas);
    const camera = new THREE.PerspectiveCamera(cfg.fov || 32, 1, .1, 200);
    camera.position.set(0, .4, cfg.dist);
    let spin = 0, vel = 0, drag = false, lastX = 0, visible = true;
    if (cfg.drag && fine) {
      canvas.style.cursor = 'grab'; canvas.style.touchAction = 'pan-y';
      canvas.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
      canvas.addEventListener('pointermove', e => { if (!drag) return; vel = (e.clientX - lastX) * .012; spin += vel; lastX = e.clientX; });
      const up = () => { drag = false; canvas.style.cursor = 'grab'; };
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    }
    const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.fov = (cfg.fov || 32) * (camera.aspect < .9 && !cfg.still ? 1.25 : 1); camera.updateProjectionMatrix(); };
    resize(); addEventListener('resize', resize);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
    canvas.classList.add('live'); canvas.parentElement.classList.add('h3d-live');
    const t0 = performance.now(); let last = t0;
    const frame = now => {
      if (!reduce) requestAnimationFrame(frame);
      if (!visible && !reduce) return;
      const t = (now - t0) / 1000, dt = Math.min((now - last) / 1000, .05); last = now;
      if (!drag) { vel *= .94; spin += vel; }
      const sway = cfg.still ? 0 : Math.sin(t * .4) * .25;
      spinner.rotation.y += ((cfg.still ? 0 : mx * .9) + sway + spin - spinner.rotation.y) * .07;
      spinner.rotation.x += ((cfg.still ? 0 : my * .35) - spinner.rotation.x) * .07;
      root.position.y = (root.userData.y ??= root.position.y) + (reduce ? 0 : Math.sin(t * .9) * .08);
      ticks.forEach(f => f(reduce ? 2 : t, reduce ? 0 : dt));
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
  });
})();
