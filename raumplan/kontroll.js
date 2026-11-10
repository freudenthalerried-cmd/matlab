'use strict';
/* Raumplan – Phase 2: Kontrollmaße per Sprache („Raumhöhe 2,55“, „Fenster Küche 1,20 breit“), Bluetooth-Laser
   (Leica DISTO, Bosch GLM – über Web Bluetooth) oder von Hand. Jedes Maß bekommt Zeitstempel und die Wand, die gerade im Bild ist. */
const KM = (() => {
  const KEY = 'raumplan-km'; let list = []; const subs = [];
  try { list = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { }
  const changed = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { } subs.forEach(f => f(list)); };
  const KIND = { hoehe: 'Raumhöhe', wand: 'Wandlänge', diag: 'Diagonale', fenster: 'Fenster', tuer: 'Tür', mass: 'Maß' };
  const DIM = { b: 'breit', h: 'hoch', p: 'Parapet' };

  // Text → Maß. Zahlen: „2,55“, „2.55“, „255 cm“, „1 Meter 20“, „2550 mm“; ohne Einheit: > 20 → cm, > 1000 → mm
  function parse(text) {
    const t = ' ' + String(text || '').toLowerCase().replace(/(\d)\s*,\s*(\d)/g, '$1,$2') + ' ';
    let v = null, m;
    if ((m = t.match(/(\d+)\s*(?:m|meter)\s+(\d{1,3})(?!\s*[.,\d])/))) v = +m[1] + +m[2] / (m[2].length === 3 ? 1000 : 100);
    else if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*(mm|millimeter|cm|zentimeter|m\b|meter)?/))) {
      const n = parseFloat(m[1].replace(',', '.')), u = m[2] || '';
      v = /^mm|milli/.test(u) ? n / 1000 : /^cm|zenti/.test(u) ? n / 100 : /^m/.test(u) ? n : n > 1000 ? n / 1000 : n > 20 ? n / 100 : n;
    }
    const kind = /raumh(ö|oe)he|lichte h(ö|oe)he|deckenh(ö|oe)he/.test(t) ? 'hoehe' : /diagonal/.test(t) ? 'diag' : /fenster/.test(t) ? 'fenster' : /t(ü|ue)r/.test(t) ? 'tuer' : /wand|l(ä|ae)nge/.test(t) ? 'wand' : /h(ö|oe)he/.test(t) ? 'hoehe' : 'mass';
    const dim = /parapet|br(ü|ue)stung/.test(t) ? 'p' : /\bhoch\b|h(ö|oe)he/.test(t) && kind !== 'hoehe' ? 'h' : /breit/.test(t) || kind === 'fenster' || kind === 'tuer' ? 'b' : null;
    const label = String(text || '').replace(/(\d+(?:[.,]\d+)?)\s*(mm|millimeter|cm|zentimeter|meter|m)?\b/gi, '').replace(/\b(breit|hoch)\b/gi, '').replace(/\s+/g, ' ').trim();
    return { v: v && v > 0.05 && v < 60 ? +v.toFixed(4) : null, kind, dim, label };
  }
  function describe(e) { return `${e.label || KIND[e.kind] || 'Maß'}${e.dim ? ' (' + DIM[e.dim] + ')' : ''}`; }
  // ctx(): liefert {wall, ids, room, shot, session} – was gerade im Bild ist
  let ctx = () => ({});
  function add(v, src, info = {}) {
    const e = { id: Date.now() + Math.random(), t: Date.now(), v, src, kind: info.kind || 'mass', dim: info.dim || null, label: info.label || '', text: info.text || '', ...ctx() };
    // Laser ohne Ansage: Wand im Bild → Wandlänge annehmen
    if (src === 'laser' && e.kind === 'mass' && e.wall) e.kind = 'wand';
    list.push(e); changed(); return e;
  }
  // Ansage ohne Zahl (z. B. „Raumhöhe“) beschreibt die letzte Lasermessung der letzten 15 s
  function annotate(p, text) {
    const last = [...list].reverse().find(e => e.src === 'laser' && Date.now() - e.t < 15000);
    if (!last) return null; Object.assign(last, { kind: p.kind, dim: p.dim, label: p.label, text }); changed(); return last;
  }
  function remove(id) { list = list.filter(e => e.id !== id); changed(); }
  function clear() { list = []; changed(); }

  /* ---------- Sprache (Web Speech API, Deutsch) ---------- */
  function listen(onResult, onState) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return onResult(null, 'Spracheingabe wird von diesem Browser nicht unterstützt – bitte Chrome verwenden oder das Maß eintippen.');
    const r = new SR(); r.lang = 'de-AT'; r.interimResults = false; r.maxAlternatives = 3;
    r.onstart = () => onState && onState('hört zu …');
    r.onerror = ev => onResult(null, ev.error === 'not-allowed' ? 'Mikrofon nicht freigegeben – in Chrome erlauben.' : 'Nicht verstanden – bitte nochmal (z. B. „Raumhöhe 2,55“).');
    r.onresult = ev => {
      const alts = [...ev.results[0]].map(a => a.transcript); const best = alts.find(a => parse(a).v) || alts[0], p = parse(best);
      if (p.v) onResult(add(p.v, 'sprache', { ...p, text: best }));
      else { const a = annotate(p, best); onResult(a, a ? null : `„${best}“ – keine Zahl erkannt. Bitte z. B. „Raumhöhe 2,55“ sagen.`); }
    };
    r.onend = () => onState && onState('');
    try { r.start(); } catch (e) { onResult(null, 'Spracheingabe konnte nicht starten: ' + e.message); }
  }

  /* ---------- Bluetooth-Laser (Web Bluetooth) ---------- */
  const LEICA = { svc: '3ab10100-f831-4395-b29d-570977d5bf94', chr: '3ab10101-f831-4395-b29d-570977d5bf94' };
  const BOSCH = { svc: '02a6c0d0-0451-4000-b000-fb3210111989', chr: '02a6c0d1-0451-4000-b000-fb3210111989' };
  let dev = null;
  async function connect(onValue, onState) {
    if (!navigator.bluetooth) throw new Error('Bluetooth wird von diesem Browser nicht unterstützt – bitte Chrome am Android-Handy verwenden.');
    dev = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'DISTO' }, { namePrefix: 'Disto' }, { namePrefix: 'GLM' }, { namePrefix: 'PLR' }, { namePrefix: 'Bosch' }], optionalServices: [LEICA.svc, BOSCH.svc] });
    dev.addEventListener('gattserverdisconnected', () => onState && onState('getrennt'));
    const srv = await dev.gatt.connect(); let ch; KMc.connected = true; dev.addEventListener('gattserverdisconnected', () => { KMc.connected = false; });
    try { // Leica DISTO: Entfernung als float32 (m)
      const s = await srv.getPrimaryService(LEICA.svc); ch = await s.getCharacteristic(LEICA.chr);
      ch.addEventListener('characteristicvaluechanged', ev => { const v = ev.target.value.getFloat32(0, true); if (v > 0.05 && v < 300) onValue(+v.toFixed(4)); });
      await ch.startNotifications(); onState && onState('Leica DISTO verbunden'); return dev.name;
    } catch (e) { }
    // Bosch GLM (Protokoll aus freien Projekten, experimentell): Synchronisierung einschalten, Messwert float32 ab Byte 7
    const s = await srv.getPrimaryService(BOSCH.svc); ch = await s.getCharacteristic(BOSCH.chr);
    ch.addEventListener('characteristicvaluechanged', ev => { const d = ev.target.value; if (d.byteLength >= 11 && d.getUint8(0) === 0xC0 && d.getUint8(1) === 0x55 && d.getUint8(2) === 0x10) { const v = d.getFloat32(7, true); if (v > 0.05 && v < 300) onValue(+v.toFixed(4)); } });
    await ch.startNotifications(); try { await ch.writeValue(new Uint8Array([0xC0, 0x55, 0x02, 0x01, 0x00, 0x1A])); } catch (e) { }
    onState && onState('Bosch GLM verbunden (experimentell)'); return dev.name;
  }
  const KMc = { parse, describe, add, annotate, remove, clear, listen, connect, get list() { return list; }, onChange: f => subs.push(f), setContext: f => ctx = f, KIND, connected: false };
  return KMc;
})();
if (typeof module !== 'undefined') module.exports = KM;
