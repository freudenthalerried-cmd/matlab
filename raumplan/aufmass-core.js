'use strict';
/* Aufmaß AR – Rechenkern (ohne DOM, in Node testbar).
   Koordinaten: WebXR „local“-Raum, y nach oben. Grundriss = (x, z). Alle Werte in m. */
(function (G) {
  const hyp = Math.hypot;
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

  // Robuste Gerade durch 2D-Punkte (Hauptachse, Ausreißer > max(3σ, 8 mm) raus, mehrfach)
  function fitLine(P) {
    // Startmenge per Paar-Suche (RANSAC): Gerade durch 2 Punkte mit den meisten Punkten innerhalb 1,5 cm – Möbel/Fehlklicks fallen raus
    let Q = P.slice(), L = null;
    if (P.length >= 3) {
      let best = null, m = P.length, tries = Math.min(400, m * (m - 1) / 2), k = 0;
      for (let i = 0; i < m && k < tries; i++) for (let j = i + 1; j < m && k < tries; j++, k++) {
        const a = m > 30 ? P[(Math.random() * m) | 0] : P[i], b = m > 30 ? P[(Math.random() * m) | 0] : P[j], dl = hyp(b[0] - a[0], b[1] - a[1]); if (dl < 0.1) continue;
        const nn = [-(b[1] - a[1]) / dl, (b[0] - a[0]) / dl], inl = P.filter(p => Math.abs((p[0] - a[0]) * nn[0] + (p[1] - a[1]) * nn[1]) < 0.015);
        if (!best || inl.length > best.length) best = inl;
      }
      if (best && best.length >= 2) Q = best;
    }
    for (let it = 0; it < 4; it++) {
      if (Q.length < 2) break;
      const m = Q.length, cx = Q.reduce((s, p) => s + p[0], 0) / m, cz = Q.reduce((s, p) => s + p[1], 0) / m;
      let sxx = 0, szz = 0, sxz = 0; Q.forEach(p => { const a = p[0] - cx, b = p[1] - cz; sxx += a * a; szz += b * b; sxz += a * b; });
      const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), d = [Math.cos(th), Math.sin(th)], n = [-d[1], d[0]];
      const res = Q.map(p => (p[0] - cx) * n[0] + (p[1] - cz) * n[1]);
      const rin = Q.map(p => (p[0] - cx) * n[0] + (p[1] - cz) * n[1]), sig = Math.sqrt(rin.reduce((s, r) => s + r * r, 0) / Math.max(1, m - 2));
      const ts = Q.map(p => (p[0] - cx) * d[0] + (p[1] - cz) * d[1]);
      L = { c: [cx, cz], d, n, sig: m > 2 ? sig : 0.004, m, span: Math.max(...ts) - Math.min(...ts) };
      const lim = Math.max(3 * sig, 0.008), Q2 = Q.filter((p, i) => Math.abs(res[i]) <= lim);
      if (Q2.length === Q.length || Q2.length < 2) break; Q = Q2;
    }
    return L;
  }
  function cross2(A, B) {
    const den = A.d[0] * B.d[1] - A.d[1] * B.d[0]; if (Math.abs(den) < 1e-9) return null;
    const t = ((B.c[0] - A.c[0]) * B.d[1] - (B.c[1] - A.c[1]) * B.d[0]) / den; return [A.c[0] + A.d[0] * t, A.c[1] + A.d[1] * t];
  }
  const area = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

  // Raum aus den Wänden: Gerade je Wand, Sockelleiste nach außen schieben, Ecken = Schnittpunkte
  function room(walls, opt = {}) {
    const lines = walls.map(w => fitLine(w.pts)), err = [];
    lines.forEach((L, i) => { if (!L || L.m < 2 || L.span < 0.2) err.push(`Wand ${i + 1}: zu wenige Punkte (mindestens 2, über 20 cm verteilt).`); });
    if (lines.length < 3) err.push('Mindestens 3 Wände messen.');
    if (err.length) return { ok: false, err };
    const n = lines.length;
    for (let i = 0; i < n; i++) { const A = lines[i], B = lines[(i + 1) % n], a = Math.abs(A.d[0] * B.d[1] - A.d[1] * B.d[0]); if (a < Math.sin(20 / 57.3)) err.push(`Wand ${i + 1} und Wand ${(i + 1) % n + 1} sind fast parallel – fehlt eine Wand dazwischen, oder wurde eine Wand doppelt gemessen?`); }
    if (err.length) return { ok: false, err };
    let P = lines.map((L, i) => cross2(lines[(i - 1 + n) % n], L));
    // Sockelleiste: Gerade um sk nach außen (vom Raum weg) – nur für Punkte am Boden
    const ctr = [P.reduce((s, p) => s + p[0], 0) / n, P.reduce((s, p) => s + p[1], 0) / n];
    lines.forEach((L, i) => { const sk = walls[i].floorPts ? (opt.skirt || 0) : 0; let nn = L.n; if (dot(sub(L.c, ctr), nn) < 0) nn = [-nn[0], -nn[1]]; L.out = nn; if (sk) L.c = [L.c[0] + nn[0] * sk, L.c[1] + nn[1] * sk]; });
    P = lines.map((L, i) => cross2(lines[(i - 1 + n) % n], L));
    const s = opt.scale || 1, Ps = P.map(p => [p[0] * s, p[1] * s]);
    const len = Ps.map((p, i) => hyp(Ps[(i + 1) % n][0] - p[0], Ps[(i + 1) % n][1] - p[1]));
    const ang = Ps.map((p, i) => { const a = Ps[(i - 1 + n) % n], b = Ps[(i + 1) % n], u = sub(a, p), v = sub(b, p); return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / hyp(...u) / hyp(...v)))) * 57.29578; });
    // Plausibilität: Ecken müssen in der Nähe der gemessenen Punkte liegen (sonst Selbstüberschneidung o. Ä.)
    walls.forEach((w, i) => { const a = P[i], b = P[(i + 1) % n], L = hyp(b[0] - a[0], b[1] - a[1]); w.pts.forEach(p => { const t = dot(sub(p, a), sub(b, a)) / (L * L); if (t < -0.25 || t > 1.25) err.push(`Wand ${i + 1}: ein Punkt liegt weit außerhalb der Wand – evtl. zur falschen Wand gehörig (Rückgängig).`); }); });
    const warn = [];
    walls.forEach((w, i) => { const L = lines[i], ln = hyp(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]); if (L.span < 0.45 * ln) warn.push(`Wand ${i + 1}: Punkte nur auf ${Math.round(L.span / ln * 100)} % der Wand – für genaue Ecken über die ganze Wand verteilen.`); if (L.sig > 0.012) warn.push(`Wand ${i + 1}: Punkte streuen stark (±${Math.round(L.sig * 1000)} mm) – Wand uneben oder Möbel mitgemessen?`); });
    const sumA = ang.reduce((a, b) => a + b, 0), expA = (n - 2) * 180;
    if (Math.abs(sumA - expA) > 5) err.push('Der Umriss überschneidet sich – Reihenfolge der Wände prüfen (immer rundherum in einer Richtung).');
    // Genauigkeit je Wand: Lage der beiden Nachbarwände + Maßstab
    const sScale = opt.scaleSig || 0.004;
    const sig = len.map((L, i) => { const a = lines[(i - 1 + n) % n], b = lines[(i + 1) % n], sa = a.sig / Math.sqrt(a.m) + 0.002, sb = b.sig / Math.sqrt(b.m) + 0.002; return Math.sqrt(sa * sa + sb * sb + (L * sScale) ** 2); });
    const A = Math.abs(area(Ps)), per = len.reduce((a, b) => a + b, 0);
    return { ok: !err.length, err, warn, P, Ps, lines, len, ang, sig, area: A, per, ccw: area(Ps) > 0 };
  }

  // Strahl ∩ Ebene y = y0 (Boden)
  function rayFloor(o, d, y0) { if (Math.abs(d[1]) < 1e-6) return null; const t = (y0 - o[1]) / d[1]; return t > 0 ? [o[0] + d[0] * t, y0, o[2] + d[2] * t] : null; }
  // Strahl ∩ senkrechte Wandebene durch Wandkante i (AR-Raum, ungeskaliert). Liefert Position entlang der Wand und Höhe.
  function rayWall(o, d, R, i, floorY) {
    const n = R.P.length, a = R.P[i], b = R.P[(i + 1) % n], L = hyp(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nn = [-u[1], u[0]];
    const den = d[0] * nn[0] + d[2] * nn[1]; if (Math.abs(den) < 1e-6) return null;
    const t = ((a[0] - o[0]) * nn[0] + (a[1] - o[2]) * nn[1]) / den; if (t <= 0.05) return null;
    const x = o[0] + d[0] * t, z = o[2] + d[2] * t, y = o[1] + d[1] * t, pos = (x - a[0]) * u[0] + (z - a[1]) * u[1];
    return { t, pos, y: y - floorY, L, inside: pos > -0.05 && pos < L + 0.05, p: [x, y, z] };
  }
  // Welche Wand trifft der Strahl zuerst (innerhalb der Wandlänge)?
  function pickWall(o, d, R, floorY) {
    let best = null; R.P.forEach((_, i) => { const h = rayWall(o, d, R, i, floorY); if (h && h.inside && h.y > -0.1 && (!best || h.t < best.t)) best = { ...h, i }; });
    return best;
  }
  // Öffnung aus zwei gegenüberliegenden Ecken auf derselben Wand (AR-Maße → mit Maßstab s)
  function opening(type, h1, h2, s) {
    const p0 = Math.min(h1.pos, h2.pos) * s, p1 = Math.max(h1.pos, h2.pos) * s, y0 = Math.max(0, Math.min(h1.y, h2.y) * s), y1 = Math.max(h1.y, h2.y) * s;
    const brh = type === 'fenster' ? y0 : 0;
    return { type, wall: h1.i, pos: p0, w: p1 - p0, h: y1 - brh, brh };
  }
  // Maßstab aus Zollstock-Lagen: je Lage gemessene Länge; s = Soll / Mittel
  function zScale(lagen, soll) {
    const d = lagen.map(z => hyp(z[1][0] - z[0][0], z[1][1] - z[0][1], z[1][2] - z[0][2]));
    if (!d.length) return { s: 1, d, sig: null };
    const m = d.reduce((a, b) => a + b, 0) / d.length, sd = d.length > 1 ? Math.sqrt(d.reduce((a, v) => a + (v - m) ** 2, 0) / (d.length - 1)) : 0.006;
    return { s: soll / m, d, mean: m, sig: Math.max(sd / Math.sqrt(d.length), 0.003 / Math.sqrt(d.length)) / m, spread: d.length > 1 ? Math.max(...d) - Math.min(...d) : 0 };
  }
  // Dachschräge: Kniestock an Wand j (Höhe kh), Neigung aus einem Punkt auf der Schräge (Abstand dq von Wand j, Höhe hq)
  function slope(j, kh, dq, hq, H) { const ang = Math.atan2(hq - kh, dq) * 57.29578; return { wall: j, kh, ang, depth: H > hq ? (H - kh) / Math.tan(ang / 57.29578) : null }; }
  const distLine = (p, a, b) => { const L = hyp(b[0] - a[0], b[1] - a[1]); return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / L; };
  // Polygon an Halbebene „Abstand zur Wand j ≥ d“ abschneiden (Sutherland-Hodgman)
  function clipFrom(P, j, d) {
    const n = P.length, a = P[j], b = P[(j + 1) % n], L = hyp(b[0] - a[0], b[1] - a[1]); let nn = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    const c = P.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]); if ((c[0] - a[0]) * nn[0] + (c[1] - a[1]) * nn[1] < 0) nn = [-nn[0], -nn[1]];
    const f = p => (p[0] - a[0]) * nn[0] + (p[1] - a[1]) * nn[1] - d, out = [];
    P.forEach((p, i) => { const q = P[(i + 1) % n], fp = f(p), fq = f(q); if (fp >= 0) out.push(p); if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } });
    return out;
  }
  // Höhe an einem Grundrisspunkt (alle Schrägen, Deckenhöhe H)
  function heightAt(p, P, slopes, H) { let h = H; (slopes || []).forEach(s => { const n = P.length; h = Math.min(h, s.kh + Math.tan(s.ang / 57.29578) * distLine(p, P[s.wall], P[(s.wall + 1) % n])); }); return h; }
  // Fläche mit lichter Höhe ≥ hmin (eine Schräge exakt, mehrere näherungsweise nacheinander geschnitten)
  function areaAbove(P, slopes, hmin) { let Q = P; (slopes || []).forEach(s => { if (hmin <= s.kh) return; const d = (hmin - s.kh) / Math.tan(s.ang / 57.29578); const j = s.wall; Q = clipFrom(Q === P ? P : Q, Q === P ? j : nearestEdge(Q, P[j], P[(j + 1) % P.length]), d); }); return Math.abs(area(Q)); }
  function nearestEdge(Q, a, b) { let bi = 0, bd = 1e9; Q.forEach((p, i) => { const q = Q[(i + 1) % Q.length], d = distLine(p, a, b) + distLine(q, a, b); if (d < bd) { bd = d; bi = i; } }); return bi; }
  G.AM = { slope, heightAt, areaAbove, clipFrom, distLine, fitLine, room, rayFloor, rayWall, pickWall, opening, zScale, area };
  if (typeof module !== 'undefined') module.exports = G.AM;
})(typeof window !== 'undefined' ? window : globalThis);
