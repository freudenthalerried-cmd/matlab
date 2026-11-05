'use strict';
/* Raumplan – 3D-Kontrollansicht: zeigt die aufgenommene Punktwolke als drehbares Drahtgitter mit Bodenraster (1 m / 10 cm),
   Höhen-Schattierung, Kameraweg und (falls vorhanden) dem erkannten Raum. Reines Canvas 2D, keine Abhängigkeiten.
   VIEW3D.show(canvas, { pts, n, cams, floor, ceil, poly, k }) ; Touch/Maus: ziehen = drehen, zwei Finger/Rad = zoomen. */
const VIEW3D = (() => {
  function show(cv, data) {
    const g = cv.getContext('2d'), { pts, n } = data, cams = data.cams || [], floor = data.floor ?? 0, ceil = data.ceil ?? null, poly = data.poly || null, k = data.k || 1;
    // Mitte und Größe
    const step = Math.max(1, Math.floor(n / 40000)), P = []; let sx = 0, sz = 0, c = 0;
    for (let i = 0; i < n; i += step) { const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2]; if (!isFinite(x + y + z)) continue; P.push(x, y, z); sx += x; sz += z; c++; }
    const cx = c ? sx / c : 0, cz = c ? sz / c : 0; let R = 1; for (let i = 0; i < P.length; i += 3) R = Math.max(R, Math.hypot(P[i] - cx, P[i + 2] - cz));
    R = Math.min(R, 8); const H = ceil !== null ? ceil : floor + 2.6;
    const st = { yaw: 0.6, pitch: 0.45, zoom: 1, mode: 'frei' };
    const project = (x, y, z) => { // Welt → Bildschirm: Orbit um die Raummitte, Drehen (yaw) um die Hochachse, Kippen (pitch, 90° = Draufsicht), Perspektive
      const dx = x - cx, dy = y - (floor + H) / 2, dz = z - cz, cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy, y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
      const d = 3.2 * R, s = d / (d + z2), f = 0.42 * Math.min(cv.width, cv.height) / R * st.zoom;
      return [cv.width / 2 + x1 * f * s, cv.height / 2 - y2 * f * s, s]; };
    function draw() {
      const W = cv.width, Hh = cv.height; g.fillStyle = '#10151a'; g.fillRect(0, 0, W, Hh);
      // Bodenraster 1 m (hell) und 10 cm (dunkel) über die Ausdehnung
      const x0 = Math.floor(cx - R), x1 = Math.ceil(cx + R), z0 = Math.floor(cz - R), z1 = Math.ceil(cz + R);
      for (const [stepG, col] of [[0.1, '#1e2a33'], [1, '#3b5566']]) { g.strokeStyle = col; g.lineWidth = stepG === 1 ? 1.2 : 0.5; g.beginPath();
        for (let x = x0; x <= x1 + 1e-9; x += stepG) { const a = project(x, floor, z0), b = project(x, floor, z1); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
        for (let z = z0; z <= z1 + 1e-9; z += stepG) { const a = project(x0, floor, z), b = project(x1, floor, z); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } g.stroke(); }
      // Meterbeschriftung an der x-Achse
      g.fillStyle = '#7c9bb0'; g.font = '11px system-ui'; for (let x = x0; x <= x1; x++) { const p = project(x, floor, z0); g.fillText(`${x - x0} m`, p[0] + 2, p[1] - 2); }
      // Punkte: Farbe nach Höhe (Boden blau → Decke gelb), Helligkeit nach Tiefe (hinten dunkler)
      const idx = []; for (let i = 0; i < P.length; i += 3) { const p = project(P[i], P[i + 1], P[i + 2]); idx.push([p[2], p[0], p[1], P[i + 1]]); }
      idx.sort((a, b) => a[0] - b[0]);
      for (const [s, x, y, h] of idx) { if (x < -2 || y < -2 || x > W + 2 || y > Hh + 2) continue; const t = Math.max(0, Math.min(1, (h - floor) / (H - floor))), br = Math.max(0.35, Math.min(1, s * 1.6)); g.fillStyle = `hsl(${210 - 160 * t} 80% ${Math.round(28 + 42 * br)}%)`; const r = Math.max(1, 2.2 * s); g.fillRect(x - r / 2, y - r / 2, r, r); }
      // Kameraweg
      if (cams.length) { g.strokeStyle = '#ffffffaa'; g.lineWidth = 1.5; g.beginPath(); cams.forEach((cm, i) => { const p = project(cm[0], cm[1], cm[2]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke(); const l = project(...cams[cams.length - 1]); g.fillStyle = '#29b6f6'; g.beginPath(); g.arc(l[0], l[1], 4, 0, 7); g.fill(); }
      // erkannter Raum: Wände als orange Kanten (unten und oben) + senkrechte Ecken
      if (poly && poly.length >= 3) { g.strokeStyle = '#ff9800'; g.lineWidth = 2; g.beginPath(); for (const yy of [floor, H]) poly.forEach((q, i) => { const p = project(q[0] / k, yy, q[1] / k); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); const q0 = poly[0], p0 = project(q0[0] / k, yy, q0[1] / k); if (i === poly.length - 1) g.lineTo(p0[0], p0[1]); });
        poly.forEach(q => { const a = project(q[0] / k, floor, q[1] / k), b = project(q[0] / k, H, q[1] / k); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }); g.stroke(); }
      // Handy-Höhe und Raumhöhe als Hinweis
      g.fillStyle = '#cfd8dc'; g.font = '12px system-ui'; g.fillText(`${(P.length / 3).toLocaleString('de-AT')} Punkte · Boden ${floor.toFixed(2)} · ${ceil !== null ? 'Decke ' + (ceil - floor).toFixed(2) + ' m' : 'Decke ?'} · Raster 1 m`, 8, Hh - 8);
    }
    // Bedienung
    let drag = null, pinch = null;
    const pos = e => e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
    cv.onpointerdown = e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (!drag) return; st.yaw += (e.clientX - drag[0]) * 0.01; st.pitch = Math.max(-0.2, Math.min(1.5, st.pitch + (e.clientY - drag[1]) * 0.01)); drag = [e.clientX, e.clientY]; draw(); };
    cv.onpointerup = cv.onpointercancel = () => { drag = null; };
    cv.addEventListener('wheel', e => { e.preventDefault(); st.zoom = Math.max(0.4, Math.min(4, st.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); draw(); }, { passive: false });
    cv.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    cv.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); st.zoom = Math.max(0.4, Math.min(4, st.zoom * d / pinch)); pinch = d; draw(); } }, { passive: true });
    const api = { draw, top() { st.yaw = 0; st.pitch = 1.5; draw(); }, side() { st.yaw = 0; st.pitch = 0.05; draw(); }, free() { st.yaw = 0.6; st.pitch = 0.45; draw(); }, set poly(p) { data.poly = p; draw(); } };
    draw(); return api;
  }
  return { show };
})();
if (typeof module !== 'undefined') module.exports = VIEW3D;
