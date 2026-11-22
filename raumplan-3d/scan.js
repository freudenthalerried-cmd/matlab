// Raum-Scan auswerten: Tiefenraster + Kamerabilder + Kameralagen → Punktwolke, Boden/Decke, Grundriss.
// Eingabe roh = { kf: [{ M, P, GW, GH, z: Uint16Array (mm, 0 = ungültig), img: { data, W, H } | null }] }
// M = Kameralage (4×4, spaltenweise), P = Projektion. Reine Rechnung, keine Browser-Schnittstellen.

export const VOX = 0.025;          // Kantenlänge der Punktwolken-Würfel in m
const RMIN = 300, RMAX = 5500;     // gültiger Tiefenbereich in mm
const G = 0.05;                    // Raster für den Grundriss in m
const RAD = Math.PI / 180;

// Rasterpunkt (u,v wie an getDepthInMeters übergeben) → Bildkoordinate. Die Ausrichtung des Tiefenbilds ist je Gerät
// verschieden (Feldtest S25, 05.11.), deshalb 4 Varianten: Zeilen von oben/unten, Zeilen/Spalten vertauscht.
export const ndcX = (u, v, m) => (m < 2 ? 2 * u - 1 : 2 * v - 1);
export const ndcY = (u, v, m) => (m === 0 ? 1 - 2 * v : m === 1 ? 2 * v - 1 : m === 2 ? 1 - 2 * u : 2 * u - 1);
// Bildpunkt + Tiefe (Abstand zur Kameraebene) → Weltpunkt
export function welt(M, P, nx, ny, d, o) {
  const X = d * (nx + P[8]) / P[0], Y = d * (ny + P[9]) / P[5], Z = -d;
  o[0] = M[0] * X + M[4] * Y + M[8] * Z + M[12]; o[1] = M[1] * X + M[5] * Y + M[9] * Z + M[13]; o[2] = M[2] * X + M[6] * Y + M[10] * Z + M[14];
  return o;
}
const vkey = (p, c) => Math.round(p[0] / c) + 2048 + (Math.round(p[1] / c) + 2048) * 4096 + (Math.round(p[2] / c) + 2048) * 16777216;
const popc = v => { v -= (v >>> 1) & 0x55555555; v = (v & 0x33333333) + ((v >>> 2) & 0x33333333); return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };

// Welche der 4 Ausrichtungen stimmt? Richtig ist die, bei der die Aufnahmen am besten übereinander liegen
// (wenigste belegte Würfel). Reserve: bei Blick nach unten müssen die Punkte unter der Kamera liegen.
export function ausrichtung(kf) {
  const p = [0, 0, 0], sets = [0, 1, 2, 3].map(() => new Set()), vote = [0, 1, 2, 3].map(() => [0, 0]);
  const step = Math.max(1, Math.floor(kf.length / 90));
  for (let k = 0; k < kf.length; k += step) {
    const f = kf[k], look = -f.M[9], cy = f.M[13];
    for (let j = 1; j < f.GH; j += 3) for (let i = 1; i < f.GW; i += 3) {
      const dm = f.z[j * f.GW + i]; if (dm < RMIN || dm > RMAX) continue;
      const u = (i + 0.5) / f.GW, v = (j + 0.5) / f.GH;
      for (let m = 0; m < 4; m++) {
        welt(f.M, f.P, ndcX(u, v, m), ndcY(u, v, m), dm / 1000, p); sets[m].add(vkey(p, 0.06));
        if (Math.abs(look) > 0.4) { vote[m][1]++; if ((look < 0) === (p[1] < cy)) vote[m][0]++; }
      }
    }
  }
  const size = sets.map(s => s.size), ord = [0, 1, 2, 3].sort((a, b) => size[a] - size[b]);
  const quote = vote.map(v => (v[1] ? v[0] / v[1] : 0)), vb = [0, 1, 2, 3].sort((a, b) => quote[b] - quote[a])[0];
  let modus = 0, sicher = false;
  if (size[ord[0]] && size[ord[0]] < 0.9 * size[ord[1]]) { modus = ord[0]; sicher = true; }
  else if (vote[vb][1] >= 300 && quote[vb] >= 0.75) { modus = vb; sicher = true; }
  return { modus, sicher, size, quote: quote.map(q => +q.toFixed(2)) };
}
// Tiefenraster in Normallage bringen: Zeile 0 = oben, Spalte 0 = links
function kanon(f, m) {
  if (m === 0) return { zc: f.z, CW: f.GW, CH: f.GH };
  const { GW, GH, z } = f, tr = m >= 2, CW = tr ? GH : GW, CH = tr ? GW : GH, zc = new Uint16Array(CW * CH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) zc[(m === 1 ? GH - 1 - j : m === 2 ? i : GW - 1 - i) * CW + (tr ? j : i)] = z[j * GW + i];
  return { zc, CW, CH };
}
// Stehen die Kamerabilder kopf? Dieselbe Stelle im Raum muss aus verschiedenen Aufnahmen gleich hell sein.
export function bildKopf(kf) {
  const idx = new Map(), p = [0, 0, 0]; let n = 0, cap = 1 << 15, A = new Float64Array(cap * 5);
  for (const f of kf) {
    const im = f.img; if (!im) continue; const { zc, CW, CH } = f, D = im.data;
    for (let r = 1; r < CH; r += 3) for (let c = 1; c < CW; c += 3) {
      const dm = zc[r * CW + c]; if (dm < RMIN || dm > 4500) continue;
      welt(f.M, f.P, 2 * (c + 0.5) / CW - 1, 1 - 2 * (r + 0.5) / CH, dm / 1000, p);
      const key = vkey(p, 0.08); let i = idx.get(key);
      if (i === undefined) { if (n === cap) { cap *= 2; const B = new Float64Array(cap * 5); B.set(A); A = B; } i = n++; idx.set(key, i); }
      const px = Math.min(im.W - 1, ((c + 0.5) / CW * im.W) | 0), py = Math.min(im.H - 1, ((r + 0.5) / CH * im.H) | 0);
      const o0 = (py * im.W + px) * 4, o1 = ((im.H - 1 - py) * im.W + px) * 4, L0 = D[o0] + 2 * D[o0 + 1] + D[o0 + 2], L1 = D[o1] + 2 * D[o1 + 1] + D[o1 + 2];
      A[i * 5]++; A[i * 5 + 1] += L0; A[i * 5 + 2] += L0 * L0; A[i * 5 + 3] += L1; A[i * 5 + 4] += L1 * L1;
    }
  }
  let v0 = 0, v1 = 0, m = 0;
  for (let i = 0; i < n; i++) { const c = A[i * 5]; if (c < 4) continue; v0 += A[i * 5 + 2] / c - (A[i * 5 + 1] / c) ** 2; v1 += A[i * 5 + 4] / c - (A[i * 5 + 3] / c) ** 2; m++; }
  return { kopf: m > 200 && v1 < 0.7 * v0, v0: Math.round(v0 / (m || 1)), v1: Math.round(v1 / (m || 1)) };
}

// Alle Aufnahmen zu einer Punktwolke verschmelzen (ein Punkt je Würfel, Lage und Farbe gemittelt)
export async function fusion(kf, tick = async () => {}) {
  let cap = 1 << 17, n = 0, S = new Float64Array(cap * 6), LK = new Int16Array(cap), NK = new Uint8Array(cap), CN = new Uint16Array(cap);
  const idx = new Map(), p = [0, 0, 0];
  for (let k = 0; k < kf.length; k++) {
    if ((k & 7) === 7) await tick(k / kf.length);
    const f = kf[k], { zc, CW, CH } = f, im = f.img;
    for (let r = 0; r < CH; r++) for (let c = 0; c < CW; c++) {
      const q = r * CW + c, dm = zc[q]; if (dm < RMIN || dm > RMAX) continue;
      const tol = dm * 0.08 + 30; let a;   // Tiefensprung zum Nachbarn = Kante, dort sind die Werte unzuverlässig
      if ((c > 0 && (a = zc[q - 1]) && Math.abs(a - dm) > tol) || (c < CW - 1 && (a = zc[q + 1]) && Math.abs(a - dm) > tol) || (r > 0 && (a = zc[q - CW]) && Math.abs(a - dm) > tol) || (r < CH - 1 && (a = zc[q + CW]) && Math.abs(a - dm) > tol)) continue;
      welt(f.M, f.P, 2 * (c + 0.5) / CW - 1, 1 - 2 * (r + 0.5) / CH, dm / 1000, p);
      const key = vkey(p, VOX); let i = idx.get(key);
      if (i === undefined) {
        if (n >= 3000000) continue;       // Obergrenze gegen Speichernot bei sehr unruhigen Tiefendaten
        if (n === cap) { cap *= 2; const S2 = new Float64Array(cap * 6); S2.set(S); S = S2; const L2 = new Int16Array(cap); L2.set(LK); LK = L2; const N2 = new Uint8Array(cap); N2.set(NK); NK = N2; const C2 = new Uint16Array(cap); C2.set(CN); CN = C2; }
        i = n++; idx.set(key, i); LK[i] = -1;
      }
      const o = i * 6; S[o] += p[0]; S[o + 1] += p[1]; S[o + 2] += p[2];
      if (im) { const b = (Math.min(im.H - 1, ((r + 0.5) / CH * im.H) | 0) * im.W + Math.min(im.W - 1, ((c + 0.5) / CW * im.W) | 0)) * 4; S[o + 3] += im.data[b]; S[o + 4] += im.data[b + 1]; S[o + 5] += im.data[b + 2]; }
      else { S[o + 3] += 170; S[o + 4] += 170; S[o + 5] += 170; }
      if (CN[i] < 65535) CN[i]++; if (LK[i] !== k) { LK[i] = k; if (NK[i] < 255) NK[i]++; }
    }
  }
  const minK = kf.length >= 12 ? 2 : 1; let m = 0;
  for (let i = 0; i < n; i++) if (NK[i] >= minK) m++;
  const pos = new Float32Array(m * 3), col = new Uint8Array(m * 3); let j = 0;
  for (let i = 0; i < n; i++) { if (NK[i] < minK) continue; const c = CN[i], o = i * 6; pos[j * 3] = S[o] / c; pos[j * 3 + 1] = S[o + 1] / c; pos[j * 3 + 2] = S[o + 2] / c; col[j * 3] = S[o + 3] / c; col[j * 3 + 1] = S[o + 4] / c; col[j * 3 + 2] = S[o + 5] / c; j++; }
  return { pos, col, n: m };
}

// Boden und Decke: stärkste waagrechte Flächen unten bzw. oben
export function bodenDecke(W, warn = []) {
  const { pos, n } = W, B = 0.02; let y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) { const y = pos[i * 3 + 1]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const nb = Math.ceil((y1 - y0) / B) + 2, h = new Float32Array(nb), hs = new Float32Array(nb);
  for (let i = 0; i < n; i++) h[((pos[i * 3 + 1] - y0) / B) | 0]++;
  for (let k = 1; k < nb - 1; k++) hs[k] = (h[k - 1] + 2 * h[k] + h[k + 1]) / 4;
  const quant = q => { let s = 0; for (let k = 0; k < nb; k++) { s += h[k]; if (s >= q * n) return k; } return nb - 1; };
  const peak = (a, b) => { let m = -1, mk = -1; for (let k = Math.max(1, a); k < Math.min(nb - 1, b); k++) if (hs[k] > m) { m = hs[k]; mk = k; } return mk; };
  const fein = k => { let s = 0, w = 0; for (let q = Math.max(0, k - 2); q <= Math.min(nb - 1, k + 2); q++) { s += h[q] * (q + 0.5); w += h[q]; } return y0 + s / w * B; };
  const q0 = quant(0.005), kb = peak(q0 - 8, q0 + 30); if (kb < 0) throw new Error('Kein Boden erkannt. Bitte auch den Boden abfilmen.');
  const boden = fein(kb), kMin = kb + Math.round(1.9 / B), kd = peak(kMin, nb);
  let decke, sicher = false;
  if (kd > 0 && hs[kd] >= 0.15 * hs[kb]) { decke = fein(kd); sicher = true; }
  else { decke = y0 + quant(0.995) * B; warn.push('Decke nicht klar erkannt (Dachschräge oder Decke nicht gefilmt) – Raumhöhe geschätzt'); }
  const hoehe = Math.max(1.9, Math.min(4.5, decke - boden));
  return { boden, decke: boden + hoehe, hoehe, sicher };
}

// Grundriss: senkrechte Flächen → Hauptrichtung → Wandlinien → Felder zwischen den Linien → Felder, durch die
// Sichtstrahlen gingen und die mit dem Kameraweg zusammenhängen, sind der Raum.
export function grundriss(W, kf, bd, warn = []) {
  const { pos, n } = W, { boden, decke, hoehe: H } = bd, p = [0, 0, 0];
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const ext = (x, z) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; };
  for (let i = 0; i < n; i++) { const y = pos[i * 3 + 1]; if (y > boden - 0.2 && y < decke + 0.2) ext(pos[i * 3], pos[i * 3 + 2]); }
  for (const f of kf) ext(f.M[12], f.M[14]);
  x0 -= 0.3; z0 -= 0.3; x1 += 0.3; z1 += 0.3;
  const nx = Math.min(900, Math.ceil((x1 - x0) / G) + 1), nz = Math.min(900, Math.ceil((z1 - z0) / G) + 1);
  const ci = (x, z) => { const i = Math.floor((x - x0) / G), j = Math.floor((z - z0) / G); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
  // je Rasterfeld: in welchen Höhenstufen (10 cm) liegen Punkte → Wand = viele Stufen übereinander
  const vmask = new Uint32Array(nx * nz), vtop = new Float32Array(nx * nz), frei = new Uint8Array(nx * nz);
  for (let i = 0; i < n; i++) {
    const hh = pos[i * 3 + 1] - boden; if (hh < 0.15 || hh > H - 0.08) continue;
    const c = ci(pos[i * 3], pos[i * 3 + 2]); if (c < 0) continue;
    vmask[c] |= 1 << Math.min(31, (hh / 0.1) | 0); if (hh > vtop[c]) vtop[c] = hh;
  }
  const tallThr = Math.min(H - 0.3, 2.25);
  let topMask = 0; for (let b = Math.ceil((H - 0.5) / 0.1); b <= Math.min(31, Math.floor((H - 0.15) / 0.1) - 1); b++) topMask |= 1 << b;
  // freie Sicht: Felder zwischen Kamera und gemessenem Punkt
  for (const f of kf) {
    const cx = f.M[12], cy = f.M[13], cz = f.M[14], { zc, CW, CH } = f;
    for (let r = 1; r < CH; r += 3) for (let c = 1; c < CW; c += 3) {
      const dm = zc[r * CW + c]; if (dm < RMIN || dm > RMAX) continue;
      welt(f.M, f.P, 2 * (c + 0.5) / CW - 1, 1 - 2 * (r + 0.5) / CH, dm / 1000, p);
      if (p[1] < boden - 0.2 || p[1] > decke + 0.2) continue;
      const dx = p[0] - cx, dz = p[2] - cz, l2 = Math.hypot(dx, dz), l3 = Math.hypot(dx, p[1] - cy, dz), tEnd = 1 - 0.15 / l3; if (l2 < 0.1 || tEnd <= 0) continue;
      const steps = Math.ceil(l2 * tEnd / (G * 0.7)); let lastC = -1;
      for (let s = 0; s <= steps; s++) { const t = tEnd * s / steps, q = ci(cx + dx * t, cz + dz * t); if (q >= 0 && q !== lastC) { if (frei[q] < 255) frei[q]++; lastC = q; } }
    }
  }
  // Wandfelder sammeln
  const wl = []; let mx = 0, mz = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const pc = popc(vmask[j * nx + i]); if (pc >= 5) { const x = x0 + (i + 0.5) * G, z = z0 + (j + 0.5) * G; wl.push(x, z, pc); mx += x; mz += z; } }
  const nw = wl.length / 3; if (nw < 30) throw new Error('Keine Wände erkannt. Bitte die Wände vom Boden bis oben langsam abfilmen.');
  mx /= nw; mz /= nw; let R = 0; for (let k = 0; k < nw; k++) R = Math.max(R, Math.hypot(wl[k * 3] - mx, wl[k * 3 + 1] - mz));
  R += 0.5;
  // Hauptrichtung: Winkel, bei dem die Wandfelder die schärfsten Linien bilden
  const schaerfe = th => {
    const c = Math.cos(th), s = Math.sin(th), nb = Math.ceil(2 * R / 0.04) + 2, ha = new Float32Array(nb), hb = new Float32Array(nb);
    for (let k = 0; k < nw; k++) { const x = wl[k * 3] - mx, z = wl[k * 3 + 1] - mz, w = wl[k * 3 + 2]; ha[((x * c + z * s + R) / 0.04) | 0] += w; hb[((-x * s + z * c + R) / 0.04) | 0] += w; }
    let q = 0; for (let k = 0; k < nb; k++) q += ha[k] * ha[k] + hb[k] * hb[k]; return q;
  };
  let grad = 0, best = -1;
  for (let d = 0; d < 90; d += 0.5) { const q = schaerfe(d * RAD); if (q > best) { best = q; grad = d; } }
  for (let d = grad - 0.5, g0 = grad; d <= g0 + 0.5; d += 0.05) { const q = schaerfe(d * RAD); if (q > best) { best = q; grad = d; } }
  const c = Math.cos(grad * RAD), s = Math.sin(grad * RAD);
  const zuA = (x, z) => x * c + z * s, zuB = (x, z) => -x * s + z * c;     // gedrehtes Achsenkreuz a/b
  // Was steht an der Stelle (a,b)? Bit 0 = senkrechte Fläche, Bit 1 = raumhoch, Bit 2 = Fläche knapp unter der Decke
  const probe = (a, b) => {
    const x = a * c - b * s, z = a * s + b * c, i0 = Math.floor((x - x0) / G), j0 = Math.floor((z - z0) / G); let r = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
      const q = j * nx + i, m = vmask[q]; if (!m) continue;
      if (popc(m) >= 5) { r |= 1; if (vtop[q] >= tallThr) r |= 2; }
      if (popc(m & topMask) >= 2) r |= 4;
    }
    return r;
  };
  const istFrei = (a, b) => { const q = ci(a * c - b * s, a * s + b * c); return q >= 0 && frei[q] >= 2; };
  // Wandlinien je Achse: Spitzen im Histogramm der Wandfelder
  const linien = achse => {
    let lo = Infinity, hi = -Infinity; const v = new Float32Array(nw);
    for (let k = 0; k < nw; k++) { const t = achse ? zuB(wl[k * 3], wl[k * 3 + 1]) : zuA(wl[k * 3], wl[k * 3 + 1]); v[k] = t; if (t < lo) lo = t; if (t > hi) hi = t; }
    lo -= 0.2; const B = 0.025, nb = Math.ceil((hi - lo + 0.2) / B) + 2, h = new Float32Array(nb); let hs = new Float32Array(nb);
    for (let k = 0; k < nw; k++) h[((v[k] - lo) / B) | 0] += wl[k * 3 + 2];
    hs.set(h); for (let it = 0; it < 2; it++) { const t = new Float32Array(nb); for (let k = 1; k < nb - 1; k++) t[k] = (hs[k - 1] + 2 * hs[k] + hs[k + 1]) / 4; hs = t; }
    let max = 0; for (let k = 0; k < nb; k++) if (hs[k] > max) max = hs[k];
    const thr = Math.max(0.1 * max, 40), ord = []; for (let k = 1; k < nb - 1; k++) if (hs[k] >= thr && hs[k] >= hs[k - 1] && hs[k] >= hs[k + 1]) ord.push(k);
    ord.sort((a, b) => hs[b] - hs[a]); const out = [];
    for (const k of ord) {
      let sw = 0, sp = 0; for (let q = Math.max(0, k - 3); q <= Math.min(nb - 1, k + 3); q++) { sw += h[q]; sp += h[q] * (q + 0.5); }
      const t = lo + sp / sw * B; if (out.every(o => Math.abs(o - t) >= 0.2)) out.push(t); if (out.length >= 14) break;
    }
    return out.sort((a, b) => a - b);
  };
  const A = linien(0), Bl = linien(1);
  // Außengrenze der freien Sicht als Hilfslinie, falls außen keine Wand gefunden wurde (z. B. Glasfront)
  { const ha = [], hb = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (frei[j * nx + i] >= 2) { const x = x0 + (i + 0.5) * G, z = z0 + (j + 0.5) * G; ha.push(zuA(x, z)); hb.push(zuB(x, z)); }
    if (ha.length < 100) throw new Error('Zu wenig vom Raum gesehen. Bitte länger filmen.');
    ha.sort((a, b) => a - b); hb.sort((a, b) => a - b); const q = (arr, f) => arr[Math.min(arr.length - 1, Math.floor(arr.length * f))];
    const hilf = (L, mn, mxv) => { if (!L.length || mn < L[0] - 0.12) L.unshift(mn); if (mxv > L[L.length - 1] + 0.12) L.push(mxv); };
    hilf(A, q(ha, 0.005), q(ha, 0.995)); hilf(Bl, q(hb, 0.005), q(hb, 0.995)); }
  const na = A.length, nb = Bl.length; if (na < 2 || nb < 2) throw new Error('Raumgrenzen nicht erkannt. Bitte alle Wände abfilmen.');
  const NI = na - 1, NJ = nb - 1;
  // Wandlinie = mindestens 80 cm raumhohe Wandfläche auf der Linie
  const wandA = A.map(a => { let t = 0; for (let b = Bl[0]; b <= Bl[nb - 1]; b += 0.05) if (probe(a, b) & 2) t++; return t * 0.05 >= 0.8; });
  const wandB = Bl.map(b => { let t = 0; for (let a = A[0]; a <= A[na - 1]; a += 0.05) if (probe(a, b) & 2) t++; return t * 0.05 >= 0.8; });
  const proben = (lo, hi) => { if (hi - lo < 0.25) return [(lo + hi) / 2]; const o = []; for (let t = lo + 0.075; t <= hi - 0.07; t += 0.05) o.push(t); return o; };
  const fr = new Float32Array(NI * NJ), vis = new Uint16Array(NI * NJ);
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { let t = 0, f = 0; for (const a of proben(A[i], A[i + 1])) for (const b of proben(Bl[j], Bl[j + 1])) { t++; if (istFrei(a, b)) f++; } fr[i * NJ + j] = f / t; }
  const feld = (a, b) => { let i = -1, j = -1; for (let k = 0; k < NI; k++) if (a >= A[k] && a < A[k + 1]) i = k; for (let k = 0; k < NJ; k++) if (b >= Bl[k] && b < Bl[k + 1]) j = k; return i < 0 || j < 0 ? -1 : i * NJ + j; };
  // Kameraweg: besuchte Felder gehören zum Raum, durchschrittene Kanten sind offen (Tür)
  const quer = new Set(); let lq = -1, lp = null;
  for (const f of kf) {
    const a = zuA(f.M[12], f.M[14]), b = zuB(f.M[12], f.M[14]), q = feld(a, b); if (q >= 0) vis[q]++;
    if (lp && Math.hypot(a - lp[0], b - lp[1]) < 1.2) { let pq = lq; for (let t = 0.1; t <= 1; t += 0.1) { const q2 = feld(lp[0] + (a - lp[0]) * t, lp[1] + (b - lp[1]) * t); if (q2 >= 0 && pq >= 0 && q2 !== pq) quer.add(Math.min(pq, q2) * 100000 + Math.max(pq, q2)); if (q2 >= 0) pq = q2; } }
    lq = q; lp = [a, b];
  }
  // Kante gesperrt = liegt auf einer Wandlinie und dort steht raumhohe Wand (oder ein Sturz über einer Tür).
  // Niedrige senkrechte Flächen (Sofalehne, Schrank) sperren nicht, auch wenn sie in einer Wandflucht stehen.
  const sperrA = (i1, j) => { if (i1 <= 0 || i1 >= na - 1 || !wandA[i1]) return i1 <= 0 || i1 >= na - 1; if (quer.has(((i1 - 1) * NJ + j) * 100000 + i1 * NJ + j)) return false; let t = 0, k = 0; for (let b = Bl[j] + 0.05; b < Bl[j + 1] - 0.02; b += 0.05) { t++; if (probe(A[i1], b) & 6) k++; } return t > 0 && k / t >= 0.25; };
  const sperrB = (i, j1) => { if (j1 <= 0 || j1 >= nb - 1 || !wandB[j1]) return j1 <= 0 || j1 >= nb - 1; if (quer.has((i * NJ + j1 - 1) * 100000 + i * NJ + j1)) return false; let t = 0, k = 0; for (let a = A[i] + 0.05; a < A[i + 1] - 0.02; a += 0.05) { t++; if (probe(a, Bl[j1]) & 6) k++; } return t > 0 && k / t >= 0.25; };
  const innen = new Uint8Array(NI * NJ), offen = [];
  for (let q = 0; q < NI * NJ; q++) if (vis[q]) { innen[q] = 1; offen.push(q); }
  if (!offen.length) throw new Error('Kameraweg liegt außerhalb der erkannten Wände. Bitte nochmal scannen.');
  while (offen.length) {
    const q = offen.pop(), i = (q / NJ) | 0, j = q % NJ;
    const nach = (i2, j2, zu) => { if (zu || i2 < 0 || j2 < 0 || i2 >= NI || j2 >= NJ) return; const q2 = i2 * NJ + j2; if (innen[q2] || fr[q2] < 0.5) return; innen[q2] = 1; offen.push(q2); };
    nach(i + 1, j, sperrA(i + 1, j)); nach(i - 1, j, sperrA(i, j)); nach(i, j + 1, sperrB(i, j + 1)); nach(i, j - 1, sperrB(i, j));
  }
  // Möbel an der Wand: nicht einsehbares Feld (Schrank), hinter dem innerhalb von 1 m eine Wandlinie liegt, gehört zum Raum
  for (let lauf = 0, neu = true; neu && lauf < 6; lauf++) {
    neu = false;
    for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) {
      if (!innen[i * NJ + j]) continue;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const weg = []; let tiefe = 0, ii = i, jj = j;
        for (;;) {
          const zu = di ? sperrA(di > 0 ? ii + 1 : ii, jj) : sperrB(ii, dj > 0 ? jj + 1 : jj); if (zu) break;
          ii += di; jj += dj; if (ii < 0 || jj < 0 || ii >= NI || jj >= NJ || innen[ii * NJ + jj]) break;
          tiefe += di ? A[ii + 1] - A[ii] : Bl[jj + 1] - Bl[jj]; if (tiefe > 1.05) break;
          weg.push(ii * NJ + jj);
          if (di ? wandA[di > 0 ? ii + 1 : ii] : wandB[dj > 0 ? jj + 1 : jj]) { for (const q of weg) innen[q] = 1; neu = true; break; }
        }
      }
    }
  }
  // Löcher füllen (von außen nicht erreichbare Felder gehören zum Raum)
  { const aussen = new Uint8Array(NI * NJ), st = [];
    const push = (i, j) => { if (i < 0 || j < 0 || i >= NI || j >= NJ) return; const q = i * NJ + j; if (innen[q] || aussen[q]) return; aussen[q] = 1; st.push(q); };
    for (let i = 0; i < NI; i++) { push(i, 0); push(i, NJ - 1); } for (let j = 0; j < NJ; j++) { push(0, j); push(NI - 1, j); }
    while (st.length) { const q = st.pop(), i = (q / NJ) | 0, j = q % NJ; push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1); }
    for (let q = 0; q < NI * NJ; q++) if (!aussen[q]) innen[q] = 1; }
  // Umriss verketten
  const I = (i, j) => i >= 0 && j >= 0 && i < NI && j < NJ && innen[i * NJ + j] === 1, out = new Map();
  const add = (i0, j0, i1, j1) => { const k = i0 * 1000 + j0; if (!out.has(k)) out.set(k, []); out.get(k).push([i1, j1]); };
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) if (I(i, j)) {
    if (!I(i, j - 1)) add(i, j, i + 1, j); if (!I(i + 1, j)) add(i + 1, j, i + 1, j + 1);
    if (!I(i, j + 1)) add(i + 1, j + 1, i, j + 1); if (!I(i - 1, j)) add(i, j + 1, i, j);
  }
  let poly = null, flMax = 0;
  while (out.size) {
    const k0 = out.keys().next().value, loop = []; let vi = Math.floor(k0 / 1000), vj = k0 % 1000, di = 0, dj = 0;
    for (let g = 0; g < 5000; g++) {
      const k = vi * 1000 + vj, L = out.get(k); if (!L) break;
      let pick = 0; if (L.length > 1) { let bs = -9; L.forEach((e, q) => { const ei = e[0] - vi, ej = e[1] - vj, sc = di * ej - dj * ei < 0 ? 2 : di * ei + dj * ej > 0 ? 1 : 0; if (sc > bs) { bs = sc; pick = q; } }); }
      const e = L.splice(pick, 1)[0]; if (!L.length) out.delete(k);
      if (!(e[0] - vi === di && e[1] - vj === dj)) loop.push([A[vi], Bl[vj]]);
      di = e[0] - vi; dj = e[1] - vj; vi = e[0]; vj = e[1];
      if (vi === Math.floor(k0 / 1000) && vj === k0 % 1000) break;
    }
    if (loop.length > 1 && loop[0][0] !== undefined) { const a = loop[loop.length - 1], b = loop[0], d = loop[1]; if ((b[0] - a[0]) * (d[1] - b[1]) - (b[1] - a[1]) * (d[0] - b[0]) === 0) loop.shift(); }
    const fl = Math.abs(loop.reduce((sum, q, k) => { const r = loop[(k + 1) % loop.length]; return sum + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2;
    if (fl > flMax) { flMax = fl; poly = loop; }
  }
  if (!poly || poly.length < 4 || flMax < 1.5) throw new Error('Kein geschlossener Raum erkannt. Bitte alle Wände und Ecken abfilmen.');
  if (flMax > 150) warn.push('Sehr große Fläche erkannt – bitte Maße prüfen');
  if (!wandA.some(Boolean) && !wandB.some(Boolean)) warn.push('Keine raumhohen Wände gefunden – Wände bis zur Decke filmen macht das Ergebnis genauer');
  const r2 = v => +v.toFixed(2);
  return { corners: poly.map(([a, b]) => [a * c - b * s, a * s + b * c]), flaeche: flMax, winkel: grad,
    linien: { a: A.map(r2), b: Bl.map(r2), wandA: wandA.map(Number), wandB: wandB.map(Number), frei: Array.from(fr, v => Math.round(v * 9)).join(''), innen: Array.from(innen).join(''), ni: NI, nj: NJ } };
}

// Gesamte Auswertung. Liefert dasselbe Format wie das Aufmaß mit Ecken-Antippen, dazu die Punktwolke.
export async function auswerten(roh, prog = () => {}) {
  const kf = (roh.kf || []).filter(f => f && f.z && f.GW && f.GH);
  if (kf.length < 12) throw new Error('Zu wenige Aufnahmen. Bitte länger und langsamer filmen.');
  const warn = [], tick = async (t, a) => { prog(t, a); await new Promise(r => setTimeout(r, 0)); };
  await tick('Ausrichtung prüfen …', 0.08);
  const aus = ausrichtung(kf); if (!aus.sicher) warn.push('Ausrichtung des Tiefenbilds unsicher – beim Scannen auch nach unten und oben schwenken');
  for (const f of kf) Object.assign(f, kanon(f, aus.modus));
  const bk = kf.some(f => f.img) ? bildKopf(kf) : { kopf: false };
  if (bk.kopf) for (const f of kf) { if (!f.img) continue; const { data, W, H } = f.img, row = W * 4, t = new Uint8ClampedArray(row); for (let y = 0; y < H >> 1; y++) { const a = y * row, b = (H - 1 - y) * row; t.set(data.subarray(a, a + row)); data.copyWithin(a, b, b + row); data.set(t, b); } }
  await tick('Punktwolke bauen …', 0.12);
  const W = await fusion(kf, a => tick('Punktwolke bauen …', 0.12 + 0.23 * a)); if (W.n < 3000) throw new Error('Zu wenige Tiefenpunkte. Raum heller machen und langsamer bewegen.');
  await tick('Boden, Decke und Wände suchen …', 0.37);
  const bd = bodenDecke(W, warn), gr = grundriss(W, kf, bd, warn);
  if (!kf.some(f => f.img)) warn.push('Ohne Kamerabilder gescannt – Modell ohne Farben und Fotos');
  return {
    corners: gr.corners, floorY: bd.boden, height: bd.hoehe, heightSrc: bd.sicher ? 'scan' : 'geschätzt', opens: [], cloud: W, warn,
    frames: kf.filter(f => f.img).map(f => ({ data: f.img.data, W: f.img.W, H: f.img.H, M: f.M, P: f.P, zc: f.zc, CW: f.CW, CH: f.CH })),
    info: { bilder: kf.length, punkte: W.n, modus: aus.modus, sicher: aus.sicher, wuerfel: aus.size, quote: aus.quote, bildKopf: bk, winkel: +gr.winkel.toFixed(2), linien: gr.linien, flaeche: +gr.flaeche.toFixed(2) },
  };
}
