'use strict';
/* ENTWICKLERMODUS (zum späteren Entfernen: diese Datei + <script src="dev.js"> + Zeilen mit „DEV“ in app.js löschen).
   Merkt sich jede Auswertung als „Fall“ (Einstellungen, Protokoll, Markenerkennungen je Bild, Ergebnis, Fotos, Video),
   nimmt die tatsächlichen Raummaße (Soll) auf, vergleicht und exportiert alles zur Analyse (sim/dev_analyse.js). */
const DEV = (() => {
  const LS = 'raumplan-dev';
  let on = true; try { if (/[?&]dev=1/.test(location.search)) localStorage.removeItem(LS); if (/[?&]dev=0/.test(location.search)) localStorage.setItem(LS, '0'); on = localStorage.getItem(LS) !== '0'; } catch (e) { } // immer an – jede Messung wird im Hintergrund gesichert
  const cam = {};
  const r4 = v => typeof v === 'number' ? +v.toFixed(4) : v;
  async function root() { try { const r = await navigator.storage.getDirectory(); return await r.getDirectoryHandle('dev', { create: true }); } catch (e) { return null; } }
  async function caseDir(name, create) { const d = await root(); if (!d) return null; try { return await d.getDirectoryHandle(name, { create }); } catch (e) { return null; } }
  async function put(dir, name, data) { const f = await dir.getFileHandle(name, { create: true }), w = await f.createWritable(); await w.write(data); await w.close(); }
  async function get(dir, name) { try { return await (await dir.getFileHandle(name)).getFile(); } catch (e) { return null; } }
  async function readJ(name) { const d = await caseDir(name, false); const f = d && await get(d, 'fall.json'); return f ? JSON.parse(await f.text()) : null; }
  async function writeJ(name, J) { const d = await caseDir(name, true); if (d) await put(d, 'fall.json', JSON.stringify(J)); }

  // Kamera-Infos beim Start der Aufnahme
  function camInfo(stream) { try { const t = stream.getVideoTracks()[0]; cam.settings = t.getSettings(); cam.caps = t.getCapabilities ? t.getCapabilities() : null; cam.label = t.label; } catch (e) { } }

  // Fall speichern (nach jeder Auswertung, auch wenn sie fehlschlägt)
  async function capture(o) {
    if (!on) return;
    try {
      const t = new Date(), name = 'fall-' + t.toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const inputs = {}; document.querySelectorAll('#auf input, #auf select, #auf textarea').forEach(e => { if (e.id && e.type !== 'file') inputs[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
      const rec = o.rec, J = {
        name, zeit: t.toISOString(), app: o.version, ua: navigator.userAgent, screen: [screen.width, screen.height, devicePixelRatio],
        cam: { ...cam }, calib: o.calib || null, inputs, layout: o.layout, printK: o.printK, opts: o.opts,
        quelle: o.source, W: o.W, H: o.H, still: o.still || null, video: o.video || null,
        log: o.log, fehler: o.err || null, kontrollmasse: o.km || [],
        frames: (o.frames || []).map(f => ({ t: r4(f.t), fi: f.fi, vt: r4(f.vt), sw: f.sw, dets: f.dets.map(d => ({ id: d.id, c: d.c.map(p => [+p[0].toFixed(3), +p[1].toFixed(3)]), res: r4(d.res), sharp: r4(d.sharp), nx: d.nx, dup: d.dup || undefined })) })),
        rec: rec ? { ok: rec.ok, msg: rec.msg, nImg: rec.nImg, ids: rec.ids, rms: r4(rec.res && rec.res.rms), it: rec.res && rec.res.it.map(r4), dropped: rec.dropped, suspect: rec.suspect || null,
          pts: rec.res && rec.kU ? Object.fromEntries([...rec.kU.entries()].map(([id, q]) => [id, [0, 1, 2, 3].map(c => rec.res.pts[4 * q + c].map(r4))])) : null } : null,
        res: (o.res || []).map(d => ({ name: d.name, ok: d.w.ok, msg: d.w.msg, lengths: d.w.lengths, sigma: d.w.sigma, groups: d.w.groups, poly: d.w.poly, height: d.w.height, hSig: d.w.hSig, warn: d.w.warn, ops: d.ops || [] })),
        ar: o.ar || null, soll: null, notiz: ''
      };
      const dir = await caseDir(name, true); if (!dir) return;
      const imgs = (o.imgs || []).filter(f => f && f.type && f.type.startsWith('image'));
      J.bilder = imgs.map((f, k) => `bild-${String(k).padStart(3, '0')}.${f.type.includes('png') ? 'png' : 'jpg'}`);
      await put(dir, 'fall.json', JSON.stringify(J));
      for (let k = 0; k < imgs.length; k++) await put(dir, J.bilder[k], imgs[k]);
      last = name; render();
    } catch (e) { console.warn('DEV.capture', e); }
  }
  let last = null;
  async function setVideo(name) { if (on && last) { const J = await readJ(last); if (J) { J.video = name; await writeJ(last, J); render(); } } }
  async function list() { const d = await root(), L = []; if (!d) return L; for await (const [n, h] of d.entries()) if (h.kind === 'directory') L.push(n); return L.sort().reverse(); }

  // Soll ↔ Ist: Wandreihenfolge/Drehrichtung automatisch zuordnen (kleinste Abweichung)
  function match(ist, soll) {
    const n = ist.length; if (!n || soll.length !== n) return null; let best = null;
    for (const dir of [1, -1]) for (let s = 0; s < n; s++) {
      const map = ist.map((_, i) => ((dir * i + s) % n + n) % n), d = ist.map((L, i) => L - soll[map[i]]), rms = Math.sqrt(d.reduce((a, v) => a + v * v, 0) / n);
      if (!best || rms < best.rms) best = { map, d, rms };
    }
    return best;
  }
  // Automatische Diagnose: typische Ursachen aus den gespeicherten Daten
  function diagnose(J) {
    const out = [], R = J.res.find(d => d.ok), seen = {};
    J.frames.forEach(f => f.dets.forEach(d => seen[d.id] = (seen[d.id] || 0) + 1));
    if (J.fehler) out.push('Auswertung abgebrochen: ' + J.fehler);
    if (J.rec && J.rec.rms > 0.6) out.push(`Bildfehler ${J.rec.rms} px zu hoch → Fehlsichtungen oder bewegte Blätter/Kamera (Bewegungsunschärfe, Rolling Shutter).`);
    if (J.rec && J.rec.suspect) out.push('Rekonstruktion unsicher: ' + J.rec.suspect);
    const rare = Object.entries(seen).filter(([, n]) => n < 3).map(([id]) => id); if (rare.length) out.push(`Marken in weniger als 3 Bildern gesehen: ${rare.join(', ')} → diese Wände sind schwach bestimmt.`);
    if (J.quelle !== 'ar') ['0', '1'].forEach(id => { if (!seen[id]) out.push(`Bodenmarke ${id} (Zollstock-Maßstab) nie erkannt → Maßstab fehlt.`); });
    const dups = J.frames.reduce((a, f) => a + f.dets.filter(d => d.dup).length, 0); if (dups) out.push(`${dups}× gleiche Marken-ID an zwei Stellen im Bild → doppelt gedrucktes Blatt?`);
    if (J.soll && J.soll.walls && R) {
      const m = match(R.lengths, J.soll.walls);
      if (!m) out.push(`Wandanzahl: gemessen ${R.lengths.length}, tatsächlich ${J.soll.walls.length} → Wand ohne Marke oder doppelt erkannt.`);
      else {
        const rel = R.lengths.map((L, i) => L / J.soll.walls[m.map[i]] - 1), mr = rel.reduce((a, v) => a + v, 0) / rel.length, sd = Math.sqrt(rel.reduce((a, v) => a + (v - mr) ** 2, 0) / rel.length);
        if (Math.abs(mr) > 0.002 && sd < Math.abs(mr) / 2) out.push(`Alle Wände um ca. ${(mr * 100).toFixed(2)} % ${mr > 0 ? 'zu lang' : 'zu kurz'} → Maßstabsfehler (Zollstock nicht genau 2,000 m an den Bodenblättern, Druck skaliert, „Kontrolllinie gemessen“ prüfen).`);
        m.d.forEach((d, i) => { if (Math.abs(d) > 0.01 && (Math.abs(mr) < 0.002 || sd > Math.abs(mr) / 2)) out.push(`Wand ${i + 1}: ${(d * 1000).toFixed(0)} mm Abweichung (Marken ${(R.groups[i] || []).join(', ')}, je ${(R.groups[i] || []).map(id => seen[id] || 0).join('/')}× gesehen).`); });
      }
      if (J.soll.h && R.height) out.push(`Raumhöhe: gemessen ${R.height.toFixed(3)} m, tatsächlich ${J.soll.h.toFixed(3)} m (${((R.height - J.soll.h) * 1000).toFixed(0)} mm).`);
    }
    if (J.ar) { const a = J.ar; out.push(`AR: ${a.corners ? a.corners.length : 0} Ecken, Kantenpunkte je Wand ${(a.walls || []).map(w => w.length).join('/')}, Maßstab ${a.auto ? `Zollstock ${((a.auto.k - 1) * 100).toFixed(2)} % (±${((a.auto.sig || 0) * 100).toFixed(2)} %)` : 'ohne Zollstock'}, Zollstock-Bilder ${(a.log || []).filter(l => l.pa).length}.`); if ((a.walls || []).some(w => w.length < 6)) out.push('Wand mit wenigen Kantenpunkten – an der Bodenkante entlangfahren, nicht quer durch den Raum.'); }
    if (!out.length) out.push(J.soll ? 'Keine Auffälligkeit gefunden.' : 'Tatsächliche Maße eintragen, dann wird verglichen.');
    return out;
  }
  const nums = s => String(s || '').split(/[;\s]+/).map(v => { const x = parseFloat(v.replace(',', '.')); return isFinite(x) ? (x > 20 ? x / 100 : x) : null; }).filter(v => v !== null);
  const fmt = v => (+v).toFixed(3).replace('.', ',');

  async function render() {
    let box = document.getElementById('devBox');
    if (!on) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('details'); box.id = 'devBox'; box.className = 'card'; box.open = true; const a = document.getElementById('pgRes'); (a ? a.parentNode : document.body).insertBefore(box, a ? a.nextSibling : null); }
    const L = await list(); let h = `<summary><b>🛠 Entwicklermodus</b> – ${L.length} Fälle gespeichert</summary><p class="hint">Jede Messung wird im Hintergrund mit allen Rohdaten gespeichert (zum Lernen und Nachrechnen). Tatsächliche Maße eintragen (Zollstock/Laser), dann „📦 Teilen“ → z. B. Google Drive, Ordner „Raumplan-Dev“ – Claude analysiert es dort.</p>`;
    for (const n of L.slice(0, 15)) {
      const J = await readJ(n); if (!J) continue; const R = J.res.find(d => d.ok), m = R && J.soll && J.soll.walls ? match(R.lengths, J.soll.walls) : null;
      h += `<div class="devcase" data-n="${n}"><p><b>${n.slice(5).replace(/-(\d\d)-(\d\d)-(\d\d)$/, ' $1:$2')}</b> · ${J.frames.length} Bilder · ${J.bilder.length} Fotos${J.video ? ' · 🎞' : ''} · ${R ? R.lengths.map(fmt).join(' / ') + ' m' : '<span class="warn">kein Ergebnis</span>'}${J.rec && J.rec.rms != null ? ` · rms ${J.rec.rms} px` : ''}</p>
        <div class="row"><label>Tatsächliche Wände (m, der Reihe nach) <input data-f="walls" size="24" placeholder="4,215 3,600 4,215 3,600" value="${J.soll && J.soll.walls ? J.soll.walls.map(fmt).join(' ') : ''}"></label><label>Raumhöhe <input data-f="h" size="6" value="${J.soll && J.soll.h ? fmt(J.soll.h) : ''}"></label></div>
        <div class="row"><label>Notiz (was war falsch?) <input data-f="notiz" size="34" value="${(J.notiz || '').replace(/"/g, '&quot;')}"></label></div>
        ${m ? `<table class="pgt"><tr><th>Wand</th><th>gemessen</th><th>tatsächlich</th><th>Diff.</th></tr>${R.lengths.map((x, i) => `<tr><td>${i + 1}</td><td>${fmt(x)}</td><td>${fmt(J.soll.walls[m.map[i]])}</td><td class="${Math.abs(m.d[i]) <= 0.005 ? 'ok' : 'warn'}">${(m.d[i] * 1000).toFixed(1)} mm</td></tr>`).join('')}</table>` : ''}
        <ul class="small">${diagnose(J).map(x => `<li>${x.replace(/[<>&]/g, '')}</li>`).join('')}</ul>
        <div class="row"><button data-a="share" class="pri">📦 Teilen</button><button data-a="json">nur Daten (klein)</button><button data-a="del" class="danger">🗑</button></div></div>`;
    }
    h += `<div class="row"><button id="devOff">Entwicklermodus aus</button></div>`;
    box.innerHTML = h;
    box.querySelectorAll('.devcase input').forEach(inp => inp.onchange = async () => { const n = inp.closest('.devcase').dataset.n, J = await readJ(n); if (!J) return; const f = inp.dataset.f;
      if (f === 'notiz') J.notiz = inp.value; else { J.soll = J.soll || {}; if (f === 'walls') J.soll.walls = nums(inp.value); else J.soll.h = nums(inp.value)[0] || null; }
      await writeJ(n, J); render(); });
    box.querySelectorAll('.devcase button').forEach(b => b.onclick = async () => { const n = b.closest('.devcase').dataset.n, a = b.dataset.a;
      if (a === 'del') { if (!confirm(`Fall ${n} löschen?`)) return; (await root()).removeEntry(n, { recursive: true }); render(); }
      else exportCase(n, a === 'share'); });
    document.getElementById('devOff').onclick = () => { try { localStorage.setItem(LS, '0'); } catch (e) { } on = false; render(); };
  }

  // ZIP (ohne Kompression) – Fotos/Video sind schon komprimiert
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function zip(files) { // [{name, blob}]
    const parts = [], cen = []; let off = 0;
    for (const f of files) {
      const data = new Uint8Array(await f.blob.arrayBuffer()), nm = new TextEncoder().encode(f.name), c = crc32(data);
      const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, c, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, c, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      parts.push(lh.buffer, nm, data); cen.push(ch.buffer, nm); off += 30 + nm.length + data.length;
    }
    const cs = cen.reduce((a, p) => a + p.byteLength, 0), end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cs, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...cen, end.buffer], { type: 'application/zip' });
  }
  async function exportCase(n, full) {
    const d = await caseDir(n, false); if (!d) return; const J = await readJ(n), out = [new File([JSON.stringify(J)], n + '.json', { type: 'application/json' })];
    if (full) {
      const fl = []; for (const b of J.bilder) { const f = await get(d, b); if (f) fl.push({ name: b, blob: f }); }
      if (J.video && typeof VID !== 'undefined') { const v = await VID.load(J.video); if (v) fl.push({ name: J.video, blob: v }); }
      if (fl.length) out.push(new File([await zip(fl)], n + '-medien.zip', { type: 'application/zip' }));
    }
    try { if (navigator.canShare && navigator.canShare({ files: out })) { await navigator.share({ files: out, title: 'Raumplan ' + n }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    out.forEach(f => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); });
  }
  // 5× auf den Titel tippen schaltet um
  let taps = 0, tT = 0; document.addEventListener('click', e => { if (!e.target.closest('h1')) return; const t = Date.now(); taps = t - tT < 600 ? taps + 1 : 1; tT = t; if (taps >= 5) { taps = 0; on = !on; try { on ? localStorage.setItem(LS, '1') : localStorage.removeItem(LS); } catch (x) { } alert('Entwicklermodus ' + (on ? 'EIN' : 'AUS')); render(); } });
  if (on) setTimeout(render, 500);
  async function shareLast() { if (!last) { const L = await list(); last = L[0] || null; } if (last) exportCase(last, true); }
  return { get on() { return on; }, capture, camInfo, setVideo, render, diagnose, match, zip, list, readJ, shareLast };
})();
