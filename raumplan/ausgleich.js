'use strict';
/* Rechenkern: Ausgleichsrechnung (Gauß-Newton, Baarda-Test), Bodenentzerrung mit
   Verzeichnungsschätzung, Subpixel-Eckenfang und Monte-Carlo-Unsicherheit.
   DOM-frei (außer refineCorner, das ImageData bekommt) – auch in Node testbar. */
const AG = (() => {
  const hyp = Math.hypot;

  function solveLin(A, b) {
    const n = b.length; A = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      if (Math.abs(A[m][c]) < 1e-15) return null;
      [A[c], A[m]] = [A[m], A[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; if (f) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r, i) => r[n] / r[i]);
  }
  function inv(M) {
    const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => +(i === j))]);
    for (let c = 0; c < n; c++) {
      let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      if (Math.abs(A[m][c]) < 1e-18) return null;
      [A[c], A[m]] = [A[m], A[c]]; const p = A[c][c];
      for (let k = 0; k < 2 * n; k++) A[c][k] /= p;
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; if (f) for (let k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map(r => r.slice(n));
  }
  // Gewichtete Ausgleichung: Zeilen a (Gradient), l (Widerspruch), w (=1/σ²)
  function normal(rows, n) {
    const N = Array.from({ length: n }, () => new Array(n).fill(0)), u = new Array(n).fill(0);
    for (const { a, l, w } of rows) for (let i = 0; i < n; i++) if (a[i]) { u[i] += a[i] * w * l; for (let j = 0; j < n; j++) if (a[j]) N[i][j] += a[i] * w * a[j]; }
    return { N, u };
  }
  function grad(f, x, h = 1e-7) {
    const f0 = f(x), g = new Array(x.length);
    for (let k = 0; k < x.length; k++) { const xx = x.slice(); xx[k] += h; g[k] = (f(xx) - f0) / h; }
    return { f0, g };
  }

  /* ---------- Geometrie-Beobachtungen am Raum-Polygon ---------- */
  const P = (x, i) => [x[2 * i], x[2 * i + 1]];
  const dist = (x, i, j) => hyp(x[2 * j] - x[2 * i], x[2 * j + 1] - x[2 * i + 1]);
  function cornerAngle(x, i, n) { // Winkel zwischen den beiden Wänden an Ecke i (0..π, ohne Vorzeichen)
    const p = P(x, i), a = P(x, (i - 1 + n) % n), b = P(x, (i + 1) % n);
    const u = [a[0] - p[0], a[1] - p[1]], v = [b[0] - p[0], b[1] - p[1]];
    return Math.atan2(Math.abs(u[0] * v[1] - u[1] * v[0]), u[0] * v[0] + u[1] * v[1]);
  }
  function chordAngle(a, b, c, s) { // Eckwinkel aus Schenkeln a,b und Sehne c (je σ s)
    const th = Math.acos(Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b))));
    const sn = Math.sin(th) || 1e-9, dc = c / (a * b * sn);
    const da = -(a * a - b * b + c * c) / (2 * a * a * b * sn), db = -(b * b - a * a + c * c) / (2 * a * b * b * sn);
    return { th, s: Math.sqrt((dc * s) ** 2 + (da * s) ** 2 + (db * s) ** 2) };
  }
  // Beobachtung -> {f(x), wert, σ} (Längen m, Winkel rad)
  function obsModel(o, n) {
    const i = o.i, j = o.j;
    switch (o.typ) {
      case 'wand': return { f: x => dist(x, i, (i + 1) % n), v: o.v, s: o.s };
      case 'diag': case 'strecke': case 'foto': return { f: x => dist(x, i, j), v: o.v, s: o.s };
      case 'sehne': { const r = chordAngle(o.a, o.b, o.c, o.s); return { f: x => cornerAngle(x, i, n), v: r.th, s: r.s, ang: 1 }; }
      case 'winkel': case 'fotowinkel': return { f: x => cornerAngle(x, i, n), v: o.v * Math.PI / 180, s: o.s * Math.PI / 180, ang: 1 };
    }
    return null;
  }

  /* Ausgleich eines Raum-Polygons. P0: Näherungsecken, obs: Beobachtungen.
     Rückgabe: ausgeglichene Ecken, Verbesserungen, Standardabweichungen, Tests. */
  function adjust(P0, obs) {
    const n = P0.length, npar = 2 * n;
    let x = P0.flat();
    const M = obs.map(o => ({ o, m: obsModel(o, n) })).filter(e => e.m && isFinite(e.m.v) && e.m.s > 0);
    const need = 2 * n - 3, warn = [];
    // Unterbestimmt -> schwache Winkel-Annahmen aus der aktuellen Form ergänzen
    const prior = [];
    const angleObs = new Set(M.filter(e => e.m.ang).map(e => e.o.i));
    if (M.length < need || M.filter(e => !e.m.ang).length < n - 1) {
      for (let i = 0; i < n; i++) if (!angleObs.has(i)) prior.push({ o: { typ: 'annahme', i }, m: { f: xx => cornerAngle(xx, i, n), v: cornerAngle(x, i, n), s: 2 * Math.PI / 180, ang: 1 } });
      warn.push('Zu wenige Maße für eine eindeutige Form – fehlende Eckwinkel wurden aus der Skizze angenommen (±2°). Diagonalen oder Eckwinkel (Sehne) nachmessen!');
    }
    const all = M.concat(prior);
    // Lagerung: Ecke 1 fix, Richtung Wand 1 fix
    const th0 = Math.atan2(x[3] - x[1], x[2] - x[0]), X0 = x[0], Y0 = x[1];
    const datum = [{ f: xx => xx[0], v: X0 }, { f: xx => xx[1], v: Y0 }, { f: xx => Math.atan2(xx[3] - xx[1], xx[2] - xx[0]), v: th0 }];
    let Q = null, rowsLast = null;
    for (let it = 0; it < 30; it++) {
      const rows = all.map(e => { const { f0, g } = grad(e.m.f, x); let l = e.m.v - f0; return { a: g, l, w: 1 / e.m.s ** 2, e, f0 }; });
      const D = datum.map(d => { const { f0, g } = grad(d.f, x); return { a: g, l: d.v - f0, w: 1e12 }; });
      const { N, u } = normal(rows.concat(D), npar);
      const dx = solveLin(N, u); if (!dx) return { ok: false, warn: ['Gleichungssystem singulär – Maße widersprüchlich oder unvollständig.'] };
      x = x.map((v, k) => v + dx[k]); rowsLast = rows; Q = N;
      if (Math.max(...dx.map(Math.abs)) < 1e-10) break;
    }
    const rows = all.map(e => { const { f0, g } = grad(e.m.f, x); return { a: g, l: e.m.v - f0, w: 1 / e.m.s ** 2, e, f0 }; });
    const D = datum.map(d => ({ a: grad(d.f, x).g, l: 0, w: 1e12 }));
    const Qxx = inv(normal(rows.concat(D), npar).N);
    const red = M.length + prior.length - need;
    let vpv = 0; rows.forEach(r => vpv += r.l * r.l * r.w);
    const s0 = red > 0 ? Math.sqrt(vpv / red) : null;
    const qf = a => { let s = 0; for (let i = 0; i < npar; i++) if (a[i]) for (let j = 0; j < npar; j++) if (a[j]) s += a[i] * Qxx[i][j] * a[j]; return s; };
    const res = rows.map(r => {
      const qll = qf(r.a), ri = Math.max(0, 1 - qll * r.w); // Redundanzanteil
      const v = -r.l; // Verbesserung = ausgeglichen - gemessen
      const w = ri > 1e-6 ? v / (r.e.m.s * Math.sqrt(ri)) : 0; // normierte Verbesserung (Baarda)
      return { o: r.e.o, v, sv: r.e.m.s, ang: !!r.e.m.ang, ri, w, adj: r.f0 };
    });
    const Pn = Array.from({ length: n }, (_, i) => P(x, i));
    const wallSigma = Pn.map((_, i) => Math.sqrt(qf(grad(xx => dist(xx, i, (i + 1) % n), x).g)));
    const cornerSigma = Pn.map((_, i) => Math.sqrt(Qxx[2 * i][2 * i] + Qxx[2 * i + 1][2 * i + 1]));
    const worst = res.filter(r => r.o.typ !== 'annahme').sort((a, b) => Math.abs(b.w) - Math.abs(a.w))[0];
    const realRed = M.length - need; // Überbestimmung ohne Annahmen
    const blunder = worst && Math.abs(worst.w) > 3.29;
    if (blunder) warn.push(realRed >= 2 ? `Vermutlich grober Messfehler bei „${worst.o.typ} ${worst.o.i + 1}${worst.o.j != null ? '–' + (worst.o.j + 1) : ''}“ (Tipp-/Ablesefehler) – nachmessen.`
      : 'Die Maße widersprechen sich (grober Fehler), der Fehler ist aber nicht eindeutig zuordenbar – zusätzliche Kontrollmaße (Diagonale/Eckwinkel) messen.');
    if (s0 && s0 > 2) warn.push(`Maße passen schlechter zusammen als erwartet (σ₀ = ${s0.toFixed(1)}). Maßband-Genauigkeit zu optimistisch oder Messfehler.`);
    return { ok: true, P: Pn, res, s0, red, wallSigma, cornerSigma, warn, worst: blunder && realRed >= 2 ? worst : null, realRed };
  }

  /* ---------- Bodenentzerrung: Homographie + radiale Verzeichnung k1 ---------- */
  // Bildpunkte werden auf den halben Bilddiagonalen-Radius normiert
  function norm(W, H) { const c = [W / 2, H / 2], f = hyp(W, H) / 2; return p => [(p[0] - c[0]) / f, (p[1] - c[1]) / f]; }
  const undist = (u, k1) => { const r2 = u[0] * u[0] + u[1] * u[1], s = 1 + k1 * r2; return [u[0] * s, u[1] * s]; };
  const hmap = (h, u) => { const w = h[6] * u[0] + h[7] * u[1] + 1; return [(h[0] * u[0] + h[1] * u[1] + h[2]) / w, (h[3] * u[0] + h[4] * u[1] + h[5]) / w]; };
  function dlt(U, Wd) { // kleinste Quadrate, h33 = 1
    const A = [], b = [];
    U.forEach(([x, y], i) => { const [X, Y] = Wd[i]; A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X); A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y); });
    const AtA = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0)));
    const Atb = Array.from({ length: 8 }, (_, i) => A.reduce((s, r, k) => s + r[i] * b[k], 0));
    return solveLin(AtA, Atb);
  }
  /* img: Bildpunkte (px), world: Bodenkoordinaten (m), k1: Verzeichnung aus Kamera-Kalibrierung.
     (k1 aus den Referenzpunkten mitzuschätzen hat sich in der Simulation als schädlich erwiesen.) */
  function fitFloor(img, world, W, H, k1 = 0) {
    const nz = norm(W, H), U = img.map(p => undist(nz(p), k1));
    const h = dlt(U, world); if (!h) return null;
    const map = q => hmap(h, undist(nz(q), k1));
    const rms = img.length > 4 ? Math.sqrt(img.reduce((s, q, i) => { const m = map(q); return s + (m[0] - world[i][0]) ** 2 + (m[1] - world[i][1]) ** 2; }, 0) / (img.length - 4)) : 0;
    return { map, k1, rms, n: img.length };
  }
  /* Kamera-Kalibrierung (Lotlinien-Methode): Punkte auf geraden Kanten -> k1.
     lines: [[p,p,...],...] in px. Minimiert die Abweichung von Geraden nach Entzerrung. */
  function calibK1(lines, W, H) {
    const nz = norm(W, H), L = lines.filter(l => l.length >= 3).map(l => l.map(nz));
    if (!L.length) return null;
    const cost = k => L.reduce((s, l) => {
      const q = l.map(u => undist(u, k)), m = q.reduce((a, p) => [a[0] + p[0] / q.length, a[1] + p[1] / q.length], [0, 0]);
      let sxx = 0, sxy = 0, syy = 0; q.forEach(p => { const dx = p[0] - m[0], dy = p[1] - m[1]; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; });
      return s + ((sxx + syy) - Math.sqrt((sxx - syy) ** 2 + 4 * sxy * sxy)) / 2; // kleinster Eigenwert = Quadratsumme Abstände
    }, 0);
    let a = -0.4, b = 0.4; const gr = (Math.sqrt(5) - 1) / 2;
    let c = b - gr * (b - a), d = a + gr * (b - a);
    for (let i = 0; i < 80; i++) { if (cost(c) < cost(d)) b = d; else a = c; c = b - gr * (b - a); d = a + gr * (b - a); }
    const k = (a + b) / 2, npts = L.reduce((s, l) => s + l.length, 0);
    return { k1: k, rms: Math.sqrt(cost(k) / Math.max(1, npts - 2 * L.length - 1)) * Math.hypot(W, H) / 2 };
  }

  // Normalverteilte Zufallszahl
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* Monte-Carlo: Streuung abgeleiteter Größen.
     calc(img, world, pts) -> Array von Werten. sc = Tippgenauigkeit px, sw = Lage Referenz m, sf = Boden-Unebenheit (m, wirkt ~2x) */
  function monteCarlo(img, world, pts, calc, sc, sw, sf, it = 200, scp = sc) {
    const acc = [];
    for (let k = 0; k < it; k++) {
      const im = img.map(p => [p[0] + gauss() * sc, p[1] + gauss() * sc]);
      const wd = world.map(p => [p[0] + gauss() * sw, p[1] + gauss() * sw]);
      const pp = pts.map(p => [p[0] + gauss() * scp, p[1] + gauss() * scp]);
      const v = calc(im, wd, pp, sf ? () => gauss() * sf * 2 : () => 0); if (v) acc.push(v);
    }
    if (!acc.length) return null;
    return acc[0].map((_, i) => { const a = acc.map(r => r[i]), m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); });
  }

  function refineOnce(getGray, p, win) {
    let q = [p[0], p[1]];
    for (let it = 0; it < 12; it++) {
      const x0 = Math.floor(q[0]) - win - 1, y0 = Math.floor(q[1]) - win - 1, sz = 2 * win + 3, g = getGray(x0, y0, sz, sz);
      if (!g) return null;
      let a = 0, b = 0, c = 0, bx = 0, by = 0, mx = 0;
      for (let y = 1; y < sz - 1; y++) for (let x = 1; x < sz - 1; x++) {
        const gx = (g[y * sz + x + 1] - g[y * sz + x - 1]) / 2, gy = (g[(y + 1) * sz + x] - g[(y - 1) * sz + x]) / 2;
        const px = x0 + x + 0.5, py = y0 + y + 0.5, d2 = ((px - q[0]) ** 2 + (py - q[1]) ** 2) / (win * win), wt = Math.exp(-d2);
        const xx = gx * gx * wt, xy = gx * gy * wt, yy = gy * gy * wt;
        a += xx; b += xy; c += yy; bx += xx * px + xy * py; by += xy * px + yy * py; mx = Math.max(mx, gx * gx + gy * gy);
      }
      const det = a * c - b * b, tr = a + c;
      // Ecke nur, wenn Gradienten in zwei Richtungen deutlich vorhanden (nicht bloß Kante/Fläche)
      if (tr < 1e-6 || mx < 25 || det < 0.02 * tr * tr) return null;
      const nq = [(c * bx - b * by) / det, (a * by - b * bx) / det];
      const mv = hyp(nq[0] - q[0], nq[1] - q[1]); q = nq;
      if (hyp(q[0] - p[0], q[1] - p[1]) > win) return null;
      if (mv < 0.005) break;
    }
    return q;
  }
  /* Subpixel-Eckenfang (wie cornerSubPix): q = (Σ g gᵀ)⁻¹ Σ g gᵀ p mit Gauß-Fenster.
     Am genauesten bei X-Kreuzungen (gedruckte Zielmarke: 0,05 px), L-Ecken ca. 0,2 px.
     Ist im Fenster keine Ecke (Fläche/Kante), bleibt der getippte Punkt. getGray(x0,y0,w,h) -> Grauwerte. */
  function refineCorner(getGray, p, win = 6) {
    const q = refineOnce(getGray, p, win);
    return q ? refineOnce(getGray, q, win) || q : p;
  }

  return { adjust, fitFloor, calibK1, undist, norm, monteCarlo, refineCorner, cornerAngle, chordAngle, solveLin, inv, gauss };
})();
if (typeof module !== 'undefined') module.exports = AG;
