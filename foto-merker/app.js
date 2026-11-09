'use strict';
/* Foto Merker – lokales Dokumenten-Archiv (IndexedDB), OCR (Tesseract.js), optional Claude-KI */

const $ = s => document.querySelector(s);
const DEF_CATS = ['Rechnung', 'Kassenbon/Garantie', 'Vertrag', 'Behörde/Steuer', 'Bank/Versicherung', 'Gesundheit', 'Bau/Haus', 'Auto', 'Termin/Einladung', 'Beschreibung/Anleitung', 'Notiz', 'Sonstiges'];
const CHECK = '__check';
const ICONS = { 'Rechnung': '🧾', 'Kassenbon/Garantie': '🛒', 'Vertrag': '📝', 'Behörde/Steuer': '🏛️', 'Bank/Versicherung': '🏦', 'Gesundheit': '🩺', 'Bau/Haus': '🏗️', 'Auto': '🚗', 'Termin/Einladung': '📅', 'Beschreibung/Anleitung': '📘', 'Notiz': '🗒️', 'Sonstiges': '📦' };
const icon = c => ICONS[c] || '📁';
/* Schlüsselwörter mit Gewicht (Wortanfang zählt, z.B. "rechnung" trifft auch "Rechnungsbetrag") */
const KW = Object.fromEntries(Object.entries({
  'Rechnung': 'rechnung:4 invoice:4 zahlbar:2 zahlungsziel:3 fällig:1 ust-id:2 uid-nr:2 mwst:2 ust:1 netto:2 brutto:2 iban:1 kundennummer:2 kundennr:2 leistungszeitraum:3 gesamtbetrag:2 rechnungsbetrag:3 skonto:3 mahnung:3 zahlungserinnerung:4 abrechnung:3 jahresabrechnung:4 vorschreibung:3',
  'Kassenbon/Garantie': 'kassenbon:5 bon:2 kassa:3 beleg:2 garantie:4 gewährleistung:3 rückgeld:4 gegeben:2 kartenzahlung:3 bankomat:3 filiale:2 kaufbeleg:4 seriennummer:2 umtausch:3 mwst-satz:2 summe:1 zwischensumme:3',
  'Vertrag': 'vertrag:4 vereinbarung:3 kündigung:3 kündigungsfrist:4 laufzeit:3 unterschrift:2 vertragspartner:4 agb:2 mietvertrag:5 kaufvertrag:5 mieter:2 vermieter:3 bevollmächtigt:2',
  'Behörde/Steuer': 'finanzamt:5 bescheid:4 magistrat:4 gemeinde:3 marktgemeinde:4 bezirkshauptmannschaft:5 steuer:2 einkommensteuer:5 behörde:3 aktenzahl:4 geschäftszahl:4 bundesministerium:4 republik:2 strafverfügung:5 meldezettel:5 pensionsversicherung:4 finanzonline:5 steuernummer:4 abgabe:2 grundsteuer:5 gebühr:1 lohnzettel:5 arbeitnehmerveranlagung:5',
  'Bank/Versicherung': 'versicherung:4 polizze:5 kontoauszug:5 bank:2 sparkasse:3 raiffeisen:3 volksbank:3 kredit:3 darlehen:4 prämie:3 schadensfall:4 schadensmeldung:4 versicherungsnehmer:5 depot:3 zinsen:2 bausparvertrag:5 uniqa:4 generali:4 allianz:4 wiener:1',
  'Gesundheit': 'arzt:3 ärztin:3 ordination:4 rezept:4 befund:5 krankenhaus:4 klinikum:4 ögk:5 svs:3 bvaeb:5 apotheke:4 diagnose:4 patient:3 e-card:4 impfung:4 zahnarzt:5 labor:2 therapie:3 physiotherapie:5 krankenstand:5',
  'Bau/Haus': 'baustelle:4 bauvorhaben:5 angebot:2 kostenvoranschlag:4 baumeister:4 statik:4 einreichplan:5 bauamt:5 baubewilligung:5 bauverhandlung:5 handwerker:3 fliesen:3 dach:2 estrich:4 elektriker:3 installateur:3 heizung:2 grundstück:3 grundbuch:4 hausverwaltung:4 betriebskosten:4 rauchfangkehrer:5 bauträger:4 fertigstellung:3 bauzeit:3 regie:3 aufmaß:4 leistungsverzeichnis:5 tischler:4 zimmerei:4 spengler:4 dachdecker:5 maler:2 bodenleger:5 schlosserei:4 küche:2 lieferschein:1 fenster:1 garten:1',
  'Auto': 'kfz:4 kennzeichen:4 pickerl:5 57a:5 werkstatt:3 reifen:3 zulassung:4 fahrzeug:3 fahrgestellnummer:5 ölwechsel:5 kilometerstand:4 vignette:4 parkstrafe:4 asfinag:4 autohaus:4 tankstelle:3 treibstoff:3 diesel:2',
  'Termin/Einladung': 'einladung:4 termin:3 veranstaltung:3 treffpunkt:3 hochzeit:3 geburtstag:3 anmeldung:2 elternabend:4 sitzung:2 save:1',
  'Beschreibung/Anleitung': 'anleitung:4 bedienungsanleitung:5 beschreibung:2 montage:3 sicherheitshinweise:4 inbetriebnahme:4 datenblatt:4 lieferumfang:4 wartung:2 technische:2',
  'Notiz': 'notiz:4 einkaufsliste:5 todo:3 merken:2'
}).map(([c, s]) => [c, s.split(' ').map(x => { const [k, w] = x.split(':'); return [k, +w]; })]));
const STOP = new Set('der die das und oder mit für von vom zum zur den dem des ein eine einer einen ist sind wird wurde bitte sehr geehrte geehrter damen herren ihre ihr ihren sie wir uns unser unsere auf aus bei bis nach über unter durch gegen ohne seite datum straße strasse telefon fax email mail www http https tel nr. betreff österreich'.split(' '));

const S = {
  get(k, d) { try { const v = localStorage.getItem('fm_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fm_' + k, JSON.stringify(v)); } catch {} }
};
let cats = S.get('cats', DEF_CATS);
let docs = [];
let filterCat = '';
let cur = null;
let dirty = {};
let filterSender = '';
let view = S.get('view', 'ordner');
let sumsOpen = false;
let pgUrls = [];

/* ---------- IndexedDB ---------- */
let dbp;
function db() {
  return dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('fotomerker', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction('docs', mode), st = t.objectStore('docs');
    const r = fn(st);
    t.oncomplete = () => res(r && r.result);
    t.onerror = () => rej(t.error);
  });
}
const dbAll = () => tx('readonly', s => s.getAll());
const dbPut = doc => tx('readwrite', s => s.put(doc));
const dbDel = id => tx('readwrite', s => s.delete(id));

/* ---------- Helfer ---------- */
function toast(m, ms = 2500) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => t.style.display = 'none', ms); }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const fmtD = iso => iso ? new Date(iso).toLocaleDateString('de-AT') : '';
const today = () => new Date().toISOString().slice(0, 10);
const urls = new Map();
const url = (doc, k) => { const key = doc.id + k; if (!urls.has(key) && doc[k]) urls.set(key, URL.createObjectURL(doc[k])); return urls.get(key) || ''; };
const dropUrls = id => { for (const k of ['img', 'thumb']) { const u = urls.get(id + k); if (u) { URL.revokeObjectURL(u); urls.delete(id + k); } } };

/* ---------- EXIF (Datum + GPS) ---------- */
function readExif(buf) {
  try {
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return {};
    let o = 2;
    while (o < v.byteLength - 10) {
      const m = v.getUint16(o), len = v.getUint16(o + 2);
      if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) return tiff(v, o + 10);
      if ((m & 0xFF00) !== 0xFF00) break;
      o += 2 + len;
    }
  } catch {}
  return {};
}
function tiff(v, t) {
  const le = v.getUint16(t) === 0x4949, u16 = p => v.getUint16(p, le), u32 = p => v.getUint32(p, le);
  const ifd = p => { const n = u16(p), r = {}; for (let i = 0; i < n; i++) { const e = p + 2 + i * 12; r[u16(e)] = { c: u32(e + 4), o: e + 8 }; } return r; };
  const str = g => { const p = g.c > 4 ? t + u32(g.o) : g.o; let s = ''; for (let i = 0; i < g.c - 1; i++) s += String.fromCharCode(v.getUint8(p + i)); return s; };
  const rat = g => { const p = t + u32(g.o), a = []; for (let i = 0; i < 3; i++) a.push(u32(p + i * 8) / (u32(p + i * 8 + 4) || 1)); return a[0] + a[1] / 60 + a[2] / 3600; };
  const out = {}, i0 = ifd(t + u32(t + 4));
  let ds;
  if (i0[0x8769]) { const ex = ifd(t + u32(i0[0x8769].o)); const g = ex[0x9003] || ex[0x9004]; if (g) ds = str(g); }
  if (!ds && i0[0x0132]) ds = str(i0[0x0132]);
  if (ds && /^\d{4}:\d\d:\d\d/.test(ds)) { const d = new Date(ds.replace(/^(\d{4}):(\d\d):(\d\d)/, '$1-$2-$3').replace(' ', 'T')); if (!isNaN(d)) out.date = d.toISOString(); }
  if (i0[0x8825]) {
    const g = ifd(t + u32(i0[0x8825].o));
    if (g[2] && g[4]) {
      out.lat = rat(g[2]) * (g[1] && String.fromCharCode(v.getUint8(g[1].o)) === 'S' ? -1 : 1);
      out.lon = rat(g[4]) * (g[3] && String.fromCharCode(v.getUint8(g[3].o)) === 'W' ? -1 : 1);
    }
  }
  return out;
}

/* ---------- Bild verkleinern ---------- */
async function shrink(file, max, q, opt = {}) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
  const w = bmp.width, h = bmp.height, f = Math.min(1, max / Math.max(w, h));
  const rot = opt.rotate || 0, dw = Math.round(w * f), dh = Math.round(h * f);
  const c = document.createElement('canvas'); c.width = rot % 180 ? dh : dw; c.height = rot % 180 ? dw : dh;
  const x = c.getContext('2d');
  x.translate(c.width / 2, c.height / 2); x.rotate(rot * Math.PI / 180); x.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
  if (opt.enhance) enhance(x, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', q));
}
/* Scan-Filter: Graustufen + automatische Tonwertkorrektur (Papier wird weiß) */
function enhance(x, w, h) {
  const im = x.getImageData(0, 0, w, h), p = im.data, hist = new Uint32Array(256), n = w * h;
  for (let i = 0; i < p.length; i += 4) { const l = (p[i] * 299 + p[i + 1] * 587 + p[i + 2] * 114) / 1000 | 0; p[i] = l; hist[l]++; }
  let lo = 0, hi = 255, a = 0;
  while (lo < 254 && (a += hist[lo]) < n * 0.02) lo++;
  a = 0; while (hi > lo + 1 && (a += hist[hi]) < n * 0.1) hi--;
  const s = 255 / Math.max(1, hi - lo);
  for (let i = 0; i < p.length; i += 4) { const v = Math.max(0, Math.min(255, (p[i] - lo) * s)); p[i] = p[i + 1] = p[i + 2] = v; }
  x.putImageData(im, 0, 0);
}

/* ---------- Standort ---------- */
const here = () => new Promise(res => {
  if (!navigator.geolocation) return res(null);
  navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), () => res(null), { timeout: 8000, maximumAge: 600000 });
});
async function placeName(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&accept-language=de&lat=${lat}&lon=${lon}`);
    const j = await r.json(); const a = j.address || {};
    return [a.road, a.village || a.town || a.city || a.municipality].filter(Boolean).join(', ') || j.display_name || '';
  } catch { return ''; }
}

/* ---------- OCR + Auswertung ---------- */
let ocrWorker;
async function ocr(blob) {
  if (!window.Tesseract) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  if (!ocrWorker) ocrWorker = await Tesseract.createWorker('deu+eng');
  const r = await ocrWorker.recognize(blob);
  return r.data.text.replace(/\n{3,}/g, '\n\n').trim();
}
async function ocrAll(doc) {
  const pages = [doc.img, ...(doc.more || [])], t = [];
  for (let i = 0; i < pages.length; i++) t.push((pages.length > 1 ? `--- Seite ${i + 1} ---\n` : '') + await ocr(pages[i]));
  return t.join('\n\n');
}
const tokens = t => String(t || '').toLowerCase().split(/[^a-z0-9äöüß-]+/).filter(x => x.length > 1);
const headTokens = doc => [...new Set(tokens((doc.sender || '') + ' ' + (doc.text || '').slice(0, 400)))].filter(t => t.length > 3 && !/^\d+$/.test(t) && !STOP.has(t));
function classify(text) {
  const toks = tokens(text), sc = {};
  cats.forEach(c => sc[c] = 0);
  for (const [c, kws] of Object.entries(KW)) if (c in sc) for (const [k, w] of kws) { let n = 0; for (const t of toks) if (t.startsWith(k)) n++; sc[c] += w * Math.min(n, 3); }
  // gelernt aus deinen Korrekturen: Wörter im Briefkopf + bekannte Absender
  const L = S.get('learn', {}), tot = {}, head = new Set(headTokens({ text }));
  for (const c in L) for (const t in L[c]) tot[t] = (tot[t] || 0) + L[c][t];
  for (const c in L) if (c in sc) for (const t of head) if (L[c][t]) sc[c] += 3 * Math.min(L[c][t], 3) * L[c][t] / tot[t];
  const nt = norm(text);
  for (const v of Object.values(S.get('senders', {}))) if (v.c in sc && norm(v.n).length > 3 && nt.includes(norm(v.n))) sc[v.c] += 25;
  const r = Object.entries(sc).filter(([c]) => c !== 'Sonstiges' && sc[c] > 0).sort((a, b) => b[1] - a[1]);
  const fallback = cats.includes('Sonstiges') ? 'Sonstiges' : cats[cats.length - 1];
  if (!r.length || r[0][1] < 3) return { cat: fallback, conf: 'unsicher', alts: r.slice(0, 3).map(x => x[0]) };
  const second = r[1] ? r[1][1] : 0;
  return { cat: r[0][0], conf: r[0][1] >= 8 && r[0][1] >= 1.6 * second ? 'sicher' : 'unsicher', alts: r.slice(1, 4).map(x => x[0]) };
}
function findSender(text) {
  const nt = norm(text);
  for (const v of Object.values(S.get('senders', {}))) if (norm(v.n).length > 3 && nt.includes(norm(v.n))) return v.n;
  const re = /(GmbH|Ges\.?m\.?b\.?H|\bAG\b|\bKG\b|\bOG\b|e\.U\.|Bank|Sparkasse|Versicherung|Magistrat|Finanzamt|Gemeinde|Stadt |Bezirkshauptmannschaft|Ordination|Dr\.|Klinikum|Krankenhaus|Apotheke|Autohaus|Baumeister)/;
  const l = text.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 15).find(s => re.test(s) && s.length < 60);
  return l ? l.replace(/\s{2,}/g, ' ').replace(/\s[|•·].*$/, '').trim().slice(0, 40) : '';
}
function learn(doc) {
  if (doc.learned === doc.category + '|' + doc.sender) return;
  const L = S.get('learn', {}), m = L[doc.category] = L[doc.category] || {};
  headTokens(doc).forEach(t => m[t] = (m[t] || 0) + 1);
  const e = Object.entries(m); if (e.length > 400) L[doc.category] = Object.fromEntries(e.sort((a, b) => b[1] - a[1]).slice(0, 300));
  S.set('learn', L);
  if (doc.sender) { const sd = S.get('senders', {}); sd[norm(doc.sender)] = { n: doc.sender, c: doc.category }; S.set('senders', sd); }
  doc.learned = doc.category + '|' + doc.sender;
}
const monthLabel = iso => iso ? new Date(iso).toLocaleDateString('de-AT', { month: 'long', year: 'numeric' }) : 'ohne Datum';
function autoTitle(doc) {
  if (doc.category === 'Sonstiges' && !doc.sender) return firstLine(doc.text) || 'Dokument';
  return [doc.category.split('/')[0], doc.sender, doc.date ? new Date(doc.date).toLocaleDateString('de-AT', { month: 'short', year: 'numeric' }) : ''].filter(Boolean).join(' · ');
}
function findDates(text) {
  const out = [];
  for (const m of text.matchAll(/\b(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{2,4})\b/g)) {
    let [, d, mo, y] = m; y = +y < 100 ? 2000 + +y : +y;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (!isNaN(dt) && dt.getUTCMonth() === mo - 1 && y > 1990 && y < 2100) out.push(dt.toISOString().slice(0, 10));
  }
  return [...new Set(out)].sort();
}
function findAmount(text) {
  const vals = [...text.matchAll(/(?:€|eur)\s?(\d{1,3}(?:[.\s]\d{3})*,\d{2})|(\d{1,3}(?:[.\s]\d{3})*,\d{2})\s?(?:€|eur)/gi)]
    .map(m => parseFloat((m[1] || m[2]).replace(/[.\s]/g, '').replace(',', '.')));
  return vals.length ? Math.max(...vals) : null;
}
function firstLine(text) { return (text.split('\n').map(s => s.trim()).find(s => s.length > 3) || '').slice(0, 60); }

/* ---------- Claude (optional) ---------- */
const key = () => S.get('key', '');
async function claude(content, max = 1200) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key(), 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: S.get('model', '') || 'claude-haiku-5-5', max_tokens: max, messages: [{ role: 'user', content }] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || r.status);
  return j.content.filter(c => c.type === 'text').map(c => c.text).join('');
}
const b64 = blob => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result.split(',')[1]); f.readAsDataURL(blob); });
async function aiAnalyze(doc) {
  const prompt = `Analysiere dieses fotografierte Dokument (ggf. mehrere Seiten; Österreich, heute ist ${today()}). Antworte NUR mit JSON:
{"title":"kurzer Titel (max 6 Wörter, z.B. 'Stromrechnung Energie AG Okt 2026')","category":"genau eine aus: ${cats.join(' | ')}","sender":"Absender kurz (Firma/Behörde/Person, z.B. 'Energie AG', 'Finanzamt Linz') oder null","text":"vollständiger Text des Dokuments","summary":"1-2 Sätze Kerninhalt","docDate":"YYYY-MM-DD oder null","amount":Zahl in EUR oder null,"due":"YYYY-MM-DD für Frist/Termin/Garantieende/Zahlungsziel oder null","dueNote":"worum es beim Termin geht oder null","repeat":"yearly bei jährlich wiederkehrender Frist (Versicherung, Pickerl, Wartung), monthly bei monatlich, sonst null","paid":true wenn bereits bezahlt (Kassenbon, Vermerk bezahlt) sonst false,"tags":["max 5 Stichworte"]}`;
  const content = [];
  for (const b of [doc.img, ...(doc.more || [])].slice(0, 8)) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await b64(b) } });
  content.push({ type: 'text', text: prompt });
  const out = await claude(content, 4000);
  const j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
  Object.assign(doc, {
    title: j.title || doc.title, sender: j.sender || doc.sender, conf: 'KI', alts: [], checked: false, paid: !!j.paid || !!doc.paid, category: cats.includes(j.category) ? j.category : doc.category,
    text: j.text || doc.text, summary: j.summary || '', amount: j.amount ?? doc.amount,
    tags: Array.isArray(j.tags) ? j.tags.join(', ') : doc.tags, ai: true
  });
  if (j.docDate && !doc.exifDate) doc.date = new Date(j.docDate).toISOString();
  if (j.due && !doc.due) { doc.due = j.due; doc.dueNote = j.dueNote || ''; if (['monthly', 'yearly'].includes(j.repeat)) doc.repeat = j.repeat; }
}

/* ---------- Aufnahme / Import ---------- */
async function addFiles(files, live) {
  const list = [...files];
  if (!list.length) return;
  const pos = live ? here() : null;
  let n = 0, dup = 0;
  const scan = S.get('scan', false);
  for (const f of list) {
    toast(`Speichere ${++n}/${list.length} …`, 60000);
    const src = f.name + '|' + f.size;
    if (!live && docs.some(d => d.src === src)) { dup++; continue; }
    const ex = readExif(await f.arrayBuffer());
    const doc = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      created: new Date().toISOString(),
      date: ex.date || (f.lastModified ? new Date(f.lastModified).toISOString() : new Date().toISOString()),
      src, exifDate: !!ex.date, lat: ex.lat, lon: ex.lon, place: '',
      title: f.name && !live ? f.name.replace(/\.[^.]+$/, '') : 'Neues Dokument',
      category: 'Sonstiges', text: '', notes: '', summary: '', tags: '', amount: null, due: '', dueNote: '', dueDone: false,
      img: await shrink(f, 1800, 0.82, { enhance: scan }), thumb: await shrink(f, 360, 0.7, { enhance: scan }), more: [], status: 'neu'
    };
    if (live && doc.lat == null) { const p = await pos; if (p) Object.assign(doc, p); }
    await dbPut(doc); docs.unshift(doc);
    render();
    queue.push(doc.id);
  }
  const added = list.length - dup;
  toast((added > 1 ? `${added} Fotos gespeichert – Erkennung läuft im Hintergrund` : added ? 'Gespeichert – Text wird erkannt …' : 'Nichts Neues') + (dup ? ` · ${dup} Duplikat(e) übersprungen` : ''), 4000);
  if (added === 1) openDoc(docs[0].id);
  work();
}
const queue = [];
let busy = false;
async function work() {
  if (busy) return; busy = true;
  while (queue.length) {
    const id = queue.shift(), doc = docs.find(d => d.id === id);
    if (!doc) continue;
    try { await processDoc(doc); } catch (e) { console.error(e); doc.status = 'fehler'; toast('Texterkennung fehlgeschlagen (beim 1. Mal Internet nötig). Später „Text neu erkennen" tippen.', 6000); }
    await dbPut(doc); render();
    if (cur && cur.id === doc.id) openDoc(doc.id, true);
  }
  busy = false;
}
async function processDoc(doc) {
  if (doc.lat != null && !doc.place) doc.place = await placeName(doc.lat, doc.lon);
  if (key() && S.get('autoAi', true)) {
    try { await aiAnalyze(doc); await detectPay(doc); doc.status = 'ok'; return; } catch (e) { toast('KI-Fehler: ' + e.message + ' – nutze lokale Erkennung'); }
  }
  doc.text = await ocrAll(doc);
  autoFill(doc);
  await detectPay(doc);
  doc.status = 'ok';
}
function autoFill(doc) {
  if (!doc.sender) doc.sender = findSender(doc.text);
  if (!doc.checked) { const g = classify(doc.text); Object.assign(doc, { category: g.cat, conf: g.conf, alts: g.alts }); }
  if (doc.title === 'Neues Dokument' || /^(img|dsc|pxl|photo|bild|screenshot|whatsapp|scan)[\s_-]?/i.test(doc.title)) doc.title = autoTitle(doc);
  if (doc.amount == null) doc.amount = findAmount(doc.text);
  const fut = findDates(doc.text).filter(d => d >= today());
  if (!doc.due && fut.length) { doc.due = fut[0]; doc.dueNote = 'Datum im Dokument gefunden – bitte prüfen'; }
  const t = doc.text || '';
  if (/\b(bezahlt|beglichen|zahlung erhalten|betrag erhalten|bar gegeben)\b/i.test(t) && !/nicht bezahlt|noch offen|mahnung|zahlungserinnerung/i.test(t)) doc.paid = true;
  if (!doc.due && doc.category === 'Kassenbon/Garantie' && doc.date) {
    const d = new Date(doc.date); d.setFullYear(d.getFullYear() + 2);
    if (d.toISOString().slice(0, 10) >= today()) { doc.due = d.toISOString().slice(0, 10); doc.dueNote = 'Gewährleistung endet (2 Jahre ab Kauf)'; }
  }
}

/* ---------- Suche ---------- */
function score(doc, q) {
  const words = norm(q).split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return 1;
  const hay = norm([doc.title, doc.sender, doc.category, doc.tags, doc.notes, doc.summary, doc.place, doc.dueNote, fmtD(doc.date), (doc.date || '').slice(0, 10), doc.amount, doc.text].join(' '));
  const head = norm([doc.title, doc.category, doc.tags, doc.sender].join(' '));
  let s = 0;
  for (const w of words) { const c = hay.split(w).length - 1; if (!c) return 0; s += c + (head.includes(w) ? 5 : 0); }
  return s;
}
function filtered() {
  const q = $('#q').value.trim();
  return docs.filter(d => !filterCat || matchF(d)).filter(d => !filterSender || d.sender === filterSender)
    .map(d => [d, score(d, q)]).filter(x => x[1] > 0)
    .sort((a, b) => q ? b[1] - a[1] : (b[0].date || '').localeCompare(a[0].date || '')).map(x => x[0]);
}

/* ---------- Anzeige ---------- */
const needsCheck = d => !d.checked && d.status !== 'neu';
const STAR = '__star', OPEN = '__open';
const isOpen = d => d.category === 'Rechnung' && !d.paid;
const matchF = d => filterCat === CHECK ? needsCheck(d) : filterCat === STAR ? d.star : filterCat === OPEN ? isOpen(d) : d.category === filterCat;
const sumOf = l => l.reduce((a, d) => a + (+d.amount || 0), 0);
function statsHtml(open, stars) {
  const y = String(new Date().getFullYear()), yr = docs.filter(d => (d.date || '').startsWith(y) && d.amount);
  const soon = docs.filter(d => d.due && !d.dueDone && (new Date(d.due) - new Date(today())) / 864e5 <= 14);
  const t = (c, ic, n, sub) => `<button class="stat" data-c="${c}"><span>${ic} ${n}</span><small>${sub}</small></button>`;
  return `<div class="stats">${t(OPEN, '💶', open.length, open.length ? 'offen · ' + eur(sumOf(open)) : 'offene Rechnungen')}${t('__due', '⏰', soon.length, 'fällig in 14 Tagen')}${t(STAR, '⭐', stars.length, 'wichtig')}${t('__year', '📅', eur(sumOf(yr)), 'Belege ' + y)}</div>`;
}
let trash = [];
async function loadAll() {
  const all = await dbAll(), lim = Date.now() - 30 * 864e5;
  for (const d of all.filter(d => d.deleted && new Date(d.deleted) < lim)) await dbDel(d.id);
  docs = all.filter(d => !d.deleted).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  trash = all.filter(d => d.deleted && new Date(d.deleted) >= lim).sort((a, b) => b.deleted.localeCompare(a.deleted));
  renderTrash();
}
function renderTrash() {
  $('#trash').innerHTML = trash.length ? trash.map(d => `<div class="row trow"><span>${esc(d.title)} <small class="mut">gelöscht ${fmtD(d.deleted)}</small></span><button data-restore="${d.id}">Wiederherstellen</button><button class="del" data-purge="${d.id}">Endgültig</button></div>`).join('') : '<p class="mut">Leer.</p>';
}
/* ---------- Zahlungsdaten: EPC-QR (Zahlschein) oder IBAN aus dem Text ---------- */
function ibanOk(s) { let m = 0; for (const ch of s.slice(4) + s.slice(0, 4)) { const v = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55); for (const c of v) m = (m * 10 + +c) % 97; } return m === 1; }
const fmtIban = s => s.replace(/(.{4})/g, '$1 ').trim();
async function detectPay(doc) {
  if ('BarcodeDetector' in window) {
    try {
      const det = new BarcodeDetector({ formats: ['qr_code'] });
      for (const b of [doc.img, ...(doc.more || [])]) for (const c of await det.detect(await createImageBitmap(b))) {
        const l = c.rawValue.split(/\r?\n/);
        if (l[0] === 'BCD' && l[6]) {
          doc.pay = { qr: true, name: l[5] || '', iban: l[6].replace(/\s/g, '').toUpperCase(), amount: l[7] ? parseFloat(l[7].replace(/^EUR/, '')) || null : null, ref: l[9] || l[10] || '' };
          if (doc.amount == null && doc.pay.amount) doc.amount = doc.pay.amount;
          return;
        }
      }
    } catch {}
  }
  if (doc.pay?.qr) return;
  for (const x of (doc.text || '').toUpperCase().match(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}/g) || []) {
    const s = x.replace(/\s/g, '');
    for (let n = Math.min(s.length, 34); n >= 15; n--) { const c = s.slice(0, n); if (c.startsWith('AT') && n !== 20) continue; if (ibanOk(c)) { doc.pay = { qr: false, name: doc.sender || '', iban: c, amount: doc.amount, ref: '' }; return; } }
  }
}
function payHtml(d) {
  const p = d.pay; if (!p || !p.iban) return '';
  return `<div class="card"><b>💳 Zahlungsdaten</b>${p.qr ? ' <span class="badge">aus QR-Code</span>' : ''}
    ${p.name ? `<div>Empfänger: ${esc(p.name)}</div>` : ''}<div>IBAN: <b>${esc(fmtIban(p.iban))}</b><button class="sm" data-copy="${esc(p.iban)}">kopieren</button></div>
    ${p.amount ? `<div>Betrag: ${eur(p.amount)}<button class="sm" data-copy="${String(p.amount).replace('.', ',')}">kopieren</button></div>` : ''}
    ${p.ref ? `<div>Verwendungszweck: ${esc(p.ref)}<button class="sm" data-copy="${esc(p.ref)}">kopieren</button></div>` : ''}
    <p class="mut">In der Banking-App einfügen.${p.qr ? '' : ' IBAN aus dem Text gelesen (Prüfziffer stimmt) – trotzdem kurz vergleichen.'}</p></div>`;
}
function cardItem(d) {
  return `<div class="item" data-id="${d.id}"><img loading="lazy" src="${url(d, 'thumb')}" alt=""><div><b>${esc(d.title)}</b>
    <span class="badge">${icon(d.category)} ${esc(d.category)}</span>${d.star ? '⭐' : ''}${isOpen(d) ? '<span class="badge open">offen</span>' : ''}${needsCheck(d) ? '<span class="badge warn">prüfen</span>' : ''}${d.due && !d.dueDone ? '⏰' : ''}${d.more?.length ? ' 📑' + (d.more.length + 1) : ''}${d.status === 'neu' ? ' ⏳' : ''}
    ${d.sender ? `<div class="mut one">${esc(d.sender)}</div>` : ''}<div class="mut">${fmtD(d.date)}${d.amount ? ' · ' + eur(d.amount) : ''}</div></div></div>`;
}
function folderTile(c, ic, name, list, warn) {
  const sum = list.reduce((a, d) => a + (+d.amount || 0), 0), latest = list.reduce((a, d) => (d.date || '') > a ? d.date : a, '');
  const snd = [...new Set(list.map(d => d.sender).filter(Boolean))];
  return `<button class="folder ${warn ? 'warn' : ''}" data-c="${esc(c)}"><span class="fic">${ic}</span><b>${esc(name)}</b><span class="n">${list.length}</span>
    <span class="mut one">${snd.length ? esc(snd.slice(0, 3).join(', ')) + (snd.length > 3 ? ' …' : '') : 'zuletzt ' + fmtD(latest)}</span>${sum ? `<span class="mut">${eur(sum)}</span>` : ''}</button>`;
}
function render() {
  const counts = {}, chk = docs.filter(needsCheck), stars = docs.filter(d => d.star), open = docs.filter(isOpen), q = $('#q').value.trim();
  docs.forEach(d => counts[d.category] = (counts[d.category] || 0) + 1);
  if (filterCat && !filterCat.startsWith('__') && !counts[filterCat]) filterCat = '';
  if ((filterCat === CHECK && !chk.length) || (filterCat === STAR && !stars.length)) filterCat = '';
  $('#cats').innerHTML = `<button class="chip ${filterCat ? '' : 'on'}" data-c="">Alle (${docs.length})</button>` +
    (chk.length ? `<button class="chip warn ${filterCat === CHECK ? 'on' : ''}" data-c="${CHECK}">🔎 Zu prüfen (${chk.length})</button>` : '') +
    (open.length ? `<button class="chip ${filterCat === OPEN ? 'on' : ''}" data-c="${OPEN}">💶 Offen (${open.length})</button>` : '') +
    (stars.length ? `<button class="chip ${filterCat === STAR ? 'on' : ''}" data-c="${STAR}">⭐ Wichtig (${stars.length})</button>` : '') +
    cats.filter(c => counts[c]).map(c => `<button class="chip ${filterCat === c ? 'on' : ''}" data-c="${esc(c)}">${icon(c)} ${esc(c)} (${counts[c]})</button>`).join('');
  let sub = '';
  if (filterCat && !filterCat.startsWith('__')) {
    const sc = {}; docs.filter(d => d.category === filterCat && d.sender).forEach(d => sc[d.sender] = (sc[d.sender] || 0) + 1);
    const ss = Object.entries(sc).sort((a, b) => b[1] - a[1]);
    if (ss.length) sub = `<button class="chip sm ${filterSender ? '' : 'on'}" data-s="">alle Absender</button>` + ss.map(([s, n]) => `<button class="chip sm ${filterSender === s ? 'on' : ''}" data-s="${esc(s)}">${esc(s)} (${n})</button>`).join('');
  }
  $('#subs').innerHTML = sub;
  const f = filtered(), folders = view === 'ordner' && !filterCat && !q && docs.length;
  $('#count').textContent = docs.length ? (folders ? `${docs.length} Dokument(e) · ${Object.keys(counts).length} Rubrik(en)` : `${f.length} Dokument(e)${filterCat === OPEN ? ' · offen ' + eur(sumOf(f)) : ''}`) : '';
  $('#viewBtn').textContent = view === 'ordner' ? '☰ Liste' : '📁 Ordner';
  $('#checkAll').classList.toggle('hide', filterCat !== CHECK);
  $('#sums').innerHTML = sumsOpen ? sumsHtml(f) : '';
  if (!docs.length) $('#list').innerHTML = '<p class="mut">Noch leer. Unten auf „Fotografieren" tippen oder vorhandene Fotos importieren.</p>';
  else if (folders) $('#list').innerHTML = statsHtml(open, stars) + (chk.length ? folderTile(CHECK, '🔎', 'Zu prüfen', chk, true) : '') + cats.filter(c => counts[c]).map(c => folderTile(c, icon(c), c, docs.filter(d => d.category === c))).join('');
  else {
    let last = '', html = '';
    for (const d of f) { if (!q) { const m = monthLabel(d.date); if (m !== last) { html += `<h3 class="grp">${m}</h3>`; last = m; } } html += cardItem(d); }
    $('#list').innerHTML = html || '<p class="mut">Nichts gefunden.</p>';
  }
  renderDue();
}
function renderDue() {
  const open = docs.filter(d => d.due && !d.dueDone).sort((a, b) => a.due.localeCompare(b.due));
  const soon = open.filter(d => (new Date(d.due) - new Date(today())) / 864e5 <= 7);
  const lb = S.get('lastBackup', ''), age = lb ? Math.floor((Date.now() - new Date(lb)) / 864e5) : null;
  $('#dueBanner').innerHTML = (soon.length ? `<div class="banner">⏰ ${soon.length} Erinnerung(en) in den nächsten 7 Tagen: ${soon.slice(0, 3).map(d => `<b>${esc(d.title)}</b> (${fmtD(d.due)})`).join(', ')}</div>` : '') +
    (docs.length >= 5 && (age === null || age > 30) ? `<div class="banner">💾 ${age === null ? 'Noch kein Backup' : `Letztes Backup vor ${age} Tagen`} – die Daten liegen nur auf diesem Gerät. <button class="sm" id="bkNow">Jetzt sichern</button></div>` : '');
  $('#dueList').innerHTML = open.length ? open.map(d => `<div class="card item" data-id="${d.id}" style="padding:12px">
    <b>${fmtD(d.due)} – ${esc(d.title)}${d.repeat ? ' 🔁' : ''}</b><div class="mut">${esc(d.dueNote || d.category)}${d.due < today() ? ' · <span style="color:var(--warn)">überfällig</span>' : ''}</div></div>`).join('')
    : '<p class="mut">Keine offenen Erinnerungen. Im Dokument ein Datum bei „Erinnerung" setzen.</p>';
}
function notifyDue() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const last = S.get('notified', '');
  if (last === today()) return;
  const soon = docs.filter(d => d.due && !d.dueDone && (new Date(d.due) - new Date(today())) / 864e5 <= 3);
  if (soon.length) new Notification('Foto Merker', { body: soon.map(d => `${fmtD(d.due)}: ${d.title}`).join('\n'), icon: 'icon.svg' });
  S.set('notified', today());
}

/* ---------- Detail ---------- */
function openDoc(id, keep) {
  const d = docs.find(x => x.id === id); if (!d) return;
  cur = d;
  if (!keep) dirty = {};
  pgUrls.forEach(u => URL.revokeObjectURL(u));
  pgUrls = [d.img, ...(d.more || [])].map(b => URL.createObjectURL(b));
  const map = d.lat != null ? `<a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lon}#map=16/${d.lat}/${d.lon}">📍 ${esc(d.place || d.lat.toFixed(5) + ', ' + d.lon.toFixed(5))}</a>` : '<span class="mut">kein Ort</span>';
  $('#detail').innerHTML = `
    <div class="pages ${pgUrls.length > 1 ? 'multi' : ''}">${pgUrls.map((u, i) => `<div class="pg"><a href="${u}" target="_blank"><img src="${u}" alt="Seite ${i + 1}"></a>
      <div class="pgbar"><button data-rot="${i}" title="Drehen">↻</button><button data-scan="${i}" title="Scan-Filter">S/W</button>${i ? `<button data-del="${i}" title="Seite löschen">✕</button>` : ''}</div></div>`).join('')}</div>
    <div class="row" style="margin:8px 0"><button id="pgCam">📷 Seite dazu</button><button id="pgGal">🖼 Seite aus Galerie</button></div>
    ${d.status === 'neu' ? '<p class="banner">⏳ Text wird erkannt …</p>' : ''}
    ${d.summary ? `<p class="card">${esc(d.summary)}</p>` : ''}
    <div class="card assign">
      <div class="row">
        <div><label>Rubrik</label><select id="f_cat">${cats.map(c => `<option value="${esc(c)}" ${c === d.category ? 'selected' : ''}>${icon(c)} ${esc(c)}</option>`).join('')}</select></div>
        <div><label>Absender</label><input id="f_sender" list="senderList" value="${esc(d.sender)}" placeholder="z.B. Energie AG"></div>
      </div>
      <datalist id="senderList">${[...new Set(docs.map(x => x.sender).filter(Boolean))].map(s => `<option value="${esc(s)}">`).join('')}</datalist>
      <div class="row flags"><label><input type="checkbox" id="f_star" ${d.star ? 'checked' : ''}> ⭐ wichtig</label>${d.category === 'Rechnung' ? `<label><input type="checkbox" id="f_paid" ${d.paid ? 'checked' : ''}> ✓ bezahlt</label>` : ''}</div>
      ${needsCheck(d) ? `<p class="hint">${d.conf === 'sicher' ? '✓ Automatisch zugeordnet' : d.conf === 'KI' ? '🤖 Von KI zugeordnet' : '⚠ Unsicher zugeordnet'} – passt das? Mit „Speichern" bestätigen, die App merkt sich Absender und Rubrik.</p>` : ''}
      ${needsCheck(d) && d.alts?.length ? `<div class="chips">${d.alts.filter(c => cats.includes(c)).map(c => `<button class="chip" data-alt="${esc(c)}">${icon(c)} ${esc(c)}</button>`).join('')}</div>` : ''}
    </div>
    ${payHtml(d)}
    <label>Titel</label><input id="f_title" value="${esc(d.title)}">
    <div class="row">
      <div><label>Datum</label><input type="date" id="f_date" value="${(d.date || '').slice(0, 10)}"></div>
      <div><label>Betrag €</label><input id="f_amount" inputmode="decimal" value="${d.amount ?? ''}"></div>
      <div><label>Stichworte</label><input id="f_tags" value="${esc(d.tags)}"></div>
    </div>
    <div class="card" style="margin-top:12px">
      <b>⏰ Erinnerung</b>
      <div class="row"><div><label>Datum</label><input type="date" id="f_due" value="${d.due || ''}"></div>
      <div><label>Worum geht's?</label><input id="f_dueNote" value="${esc(d.dueNote)}" placeholder="z.B. Zahlung fällig, Garantie endet"></div>
      <div><label>Wiederholen</label><select id="f_repeat">${[['', 'nie'], ['monthly', 'monatlich'], ['yearly', 'jährlich']].map(([v, t]) => `<option value="${v}" ${(d.repeat || '') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
      <div class="row" style="margin-top:8px"><label style="margin:0"><input type="checkbox" id="f_done" style="width:auto" ${d.dueDone ? 'checked' : ''}> erledigt</label>
      <button id="ics">In Kalender (.ics)</button></div>
    </div>
    <p>${map} · <span class="mut">aufgenommen ${fmtD(d.date)}</span></p>
    <label>Notizen</label><textarea id="f_notes">${esc(d.notes)}</textarea>
    <label>Erkannter Text</label><textarea id="f_text" style="min-height:180px">${esc(d.text)}</textarea>
    <div class="row" style="margin:12px 0">
      <button id="reOcr">Text neu erkennen</button>
      <button id="reAi" ${key() ? '' : 'disabled title="API-Schlüssel in Einstellungen"'}>KI-Analyse</button>
      <button id="pdf1">📄 PDF</button>
      <button id="share">Teilen</button>
      <button class="del" id="del">Löschen</button>
    </div>`;
  $('#modal').classList.add('open');
  $('#ics').onclick = () => { readForm(); icsFor(cur); };
  $('#reOcr').onclick = () => redo(false);
  $('#reAi').onclick = () => redo(true);
  document.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Kopiert: ' + b.dataset.copy); } catch { toast(b.dataset.copy, 6000); } });
  document.querySelectorAll('[data-alt]').forEach(b => b.onclick = () => {
    $('#f_cat').value = b.dataset.alt; dirty.f_cat = b.dataset.alt;
    document.querySelectorAll('[data-alt]').forEach(x => x.classList.toggle('on', x === b));
  });
  $('#pdf1').onclick = () => { readForm(); savePdf([d], d.title); };
  $('#pgCam').onclick = () => pickPage(true);
  $('#pgGal').onclick = () => pickPage(false);
  document.querySelectorAll('[data-rot]').forEach(b => b.onclick = () => editImg(+b.dataset.rot, { rotate: 90 }));
  document.querySelectorAll('[data-scan]').forEach(b => b.onclick = () => editImg(+b.dataset.scan, { enhance: true }));
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Diese Seite löschen?')) return;
    readForm(); d.more.splice(+b.dataset.del - 1, 1); await dbPut(d); render(); openDoc(d.id);
  });
  if (keep) for (const [k, v] of Object.entries(dirty)) { const el = $('#' + k); if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; } }
  $('#share').onclick = async () => {
    readForm();
    const file = new File([await makePdf([d])], safe(d.title) + '.pdf', { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: d.title, text: d.summary || d.title }).catch(() => {});
    else toast('Teilen wird hier nicht unterstützt');
  };
  $('#del').onclick = async () => {
    if (!confirm(`„${d.title}" in den Papierkorb? (30 Tage wiederherstellbar)`)) return;
    d.deleted = new Date().toISOString(); await dbPut(d);
    docs = docs.filter(x => x.id !== d.id); trash.unshift(d); renderTrash(); closeDoc(); render(); toast('In den Papierkorb verschoben');
  };
}
function readForm() {
  if (!cur) return;
  const a = $('#f_amount').value.replace(',', '.').trim();
  Object.assign(cur, {
    title: $('#f_title').value.trim() || 'Dokument', category: $('#f_cat').value, sender: $('#f_sender').value.trim(),
    date: $('#f_date').value ? new Date($('#f_date').value).toISOString() : cur.date,
    amount: a === '' || isNaN(+a) ? null : +a, tags: $('#f_tags').value, due: $('#f_due').value,
    dueNote: $('#f_dueNote').value, dueDone: $('#f_done').checked, notes: $('#f_notes').value, text: $('#f_text').value,
    repeat: $('#f_repeat').value, star: $('#f_star').checked, paid: $('#f_paid') ? $('#f_paid').checked : cur.paid
  });
  if (cur.dueDone && cur.repeat && cur.due) {
    cur.due = nextDue(cur.due, cur.repeat); cur.dueDone = false;
    $('#f_due').value = cur.due; $('#f_done').checked = false; delete dirty.f_done; delete dirty.f_due;
    toast('Erledigt – nächster Termin: ' + fmtD(cur.due));
  }
}
async function redo(ai) {
  readForm(); const d = cur;
  toast(ai ? 'KI analysiert …' : 'Texterkennung …', 60000);
  try {
    if (ai) await aiAnalyze(d); else { d.text = await ocrAll(d); autoFill(d); }
    await detectPay(d);
    await dbPut(d); render(); openDoc(d.id); toast('Fertig');
  } catch (e) { toast('Fehler: ' + e.message, 5000); }
}
function nextDue(iso, rep) {
  const d = new Date(iso + 'T12:00:00');
  if (rep === 'monthly') d.setMonth(d.getMonth() + 1); else d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function pickPage(live) {
  const i = $('#pg');
  if (live) i.setAttribute('capture', 'environment'); else i.removeAttribute('capture');
  i.click();
}
async function addPages(files) {
  readForm(); const d = cur; if (!d || !files.length) return;
  d.more = d.more || [];
  const start = d.more.length + 1, scan = S.get('scan', false), added = [];
  for (const f of files) { const b = await shrink(f, 1800, 0.82, { enhance: scan }); d.more.push(b); added.push(b); }
  await dbPut(d); render(); openDoc(d.id);
  toast('Seite(n) hinzugefügt – Text wird ergänzt …', 60000);
  try {
    if (key() && S.get('autoAi', true)) await aiAnalyze(d);
    else for (let i = 0; i < added.length; i++) d.text = (d.text ? d.text + '\n\n' : '') + `--- Seite ${start + i + 1} ---\n` + await ocr(added[i]);
    await dbPut(d); render(); if (cur === d) openDoc(d.id, true); toast('Fertig');
  } catch (e) { toast('Fehler: ' + e.message, 5000); }
}
async function editImg(i, opt) {
  readForm(); const d = cur;
  const nb = await shrink(i ? d.more[i - 1] : d.img, 1800, 0.85, opt);
  if (i) d.more[i - 1] = nb; else { d.img = nb; d.thumb = await shrink(nb, 360, 0.7); dropUrls(d.id); }
  await dbPut(d); render(); openDoc(d.id);
}
function closeDoc() { $('#modal').classList.remove('open'); cur = null; }
function icsFor(d) {
  if (!d.due) return toast('Erst ein Erinnerungsdatum setzen');
  const dt = d.due.replace(/-/g, ''), clean = s => String(s || '').replace(/[,;\\]/g, ' ').replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FotoMerker//DE', 'BEGIN:VEVENT', `UID:${d.id}@fotomerker`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${dt}`, ...(d.repeat ? [`RRULE:FREQ=${d.repeat === 'monthly' ? 'MONTHLY' : 'YEARLY'}`] : []), `SUMMARY:${clean(d.title)}`, `DESCRIPTION:${clean(d.dueNote + '\n' + (d.summary || ''))}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${clean(d.title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'erinnerung.ics'; a.click();
}

/* ---------- Fragen ---------- */
async function ask() {
  const q = $('#ask').value.trim(); if (!q) return;
  const stop = new Set(norm('der die das und oder wie wo wann was wer ist war hat habe ich mein meine meinen von vom zum zur mit für ein eine einen den dem im in am an auf bis noch letzte letzten wieviel viel hoch').split(' '));
  const words = norm(q).replace(/[?!.,]/g, '').split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
  const ranked = docs.map(d => [d, words.reduce((s, w) => s + score(d, w), 0)]).sort((a, b) => b[1] - a[1]);
  const hits = ranked.filter(x => x[1] > 0).map(x => x[0]);
  const pick = (hits.length ? hits : docs).slice(0, 12);
  if (!key()) {
    $('#answer').innerHTML = `<p class="mut">Ohne KI-Schlüssel: passende Dokumente</p>` + (hits.length ? hits.slice(0, 20).map(cardHtml).join('') : '<p>Nichts gefunden.</p>');
    return;
  }
  $('#answer').innerHTML = '<p class="mut">Denke nach …</p>';
  const ctx = pick.map((d, i) => `[#${i + 1}] Titel: ${d.title} | Rubrik: ${d.category} | Datum: ${(d.date || '').slice(0, 10)} | Ort: ${d.place || '-'} | Betrag: ${d.amount ?? '-'} | Erinnerung: ${d.due || '-'} ${d.dueNote || ''} | Notizen: ${d.notes || '-'}\nText: ${(d.summary ? d.summary + '\n' : '') + (d.text || '').slice(0, 1800)}`).join('\n\n');
  try {
    const a = await claude(`Du bist das Gedächtnis meines privaten Dokumentenarchivs. Heute ist ${today()}. Beantworte die Frage kurz und genau auf Deutsch, NUR anhand der Dokumente unten. Nenne die Quelle als [#Nummer]. Wenn es nicht drinsteht, sag das ehrlich.\n\nDOKUMENTE:\n${ctx}\n\nFRAGE: ${q}`);
    const used = [...new Set([...a.matchAll(/#(\d+)/g)].map(m => +m[1] - 1))].map(i => pick[i]).filter(Boolean);
    $('#answer').innerHTML = `<div class="card ans">${esc(a)}</div>` + used.map(cardHtml).join('');
  } catch (e) { $('#answer').innerHTML = `<p class="banner">Fehler: ${esc(e.message)}</p>`; }
}
const cardHtml = d => `<div class="card item" data-id="${d.id}" style="display:flex;gap:10px;padding:8px"><img src="${url(d, 'thumb')}" style="width:64px;height:64px;border-radius:8px"><div style="padding:0"><b>${esc(d.title)}</b><span class="mut">${esc(d.category)} · ${fmtD(d.date)}</span></div></div>`;

/* ---------- PDF (ohne Bibliothek: JPEG-Seiten direkt eingebettet) ---------- */
const safe = s => String(s || 'dokument').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 60) || 'dokument';
function dl(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 10000); }
async function makePdf(list) {
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const obj = (id, fn) => { offs[id] = len; add(`${id} 0 obj\n`); fn(); add('\nendobj\n'); };
  const imgs = list.flatMap(d => [d.img, ...(d.more || [])]), n = imgs.length;
  add('%PDF-1.4\n');
  obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => add(`<< /Type /Pages /Count ${n} /Kids [${imgs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] >>`));
  for (let i = 0; i < n; i++) {
    const bytes = new Uint8Array(await imgs[i].arrayBuffer()), bm = await createImageBitmap(imgs[i]);
    const w = bm.width, h = bm.height, s = Math.min(555 / w, 802 / h), dw = w * s, dh = h * s;
    const cs = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${((595 - dw) / 2).toFixed(2)} ${((842 - dh) / 2).toFixed(2)} cm /Im${i} Do Q`;
    obj(3 + 3 * i, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${4 + 3 * i} 0 R >> >> /Contents ${5 + 3 * i} 0 R >>`));
    obj(4 + 3 * i, () => { add(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`); add(bytes); add('\nendstream'); });
    obj(5 + 3 * i, () => add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
  }
  const xref = len, total = 3 + 3 * n;
  add(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let id = 1; id < total; id++) add(String(offs[id]).padStart(10, '0') + ' 00000 n \n');
  add(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}
async function savePdf(list, name) {
  toast('PDF wird erstellt …', 60000);
  try { dl(await makePdf(list), safe(name) + '.pdf'); toast('PDF heruntergeladen'); } catch (e) { toast('PDF-Fehler: ' + e.message, 5000); }
}

/* ---------- Summen / CSV ---------- */
const eur = v => '€ ' + Number(v).toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function sumsHtml(list) {
  const w = list.filter(d => d.amount);
  if (!w.length) return '<div class="card mut">Keine Beträge in der Auswahl.</div>';
  const by = {};
  w.forEach(d => { const y = (d.date || '').slice(0, 4) || '?'; by[y] = by[y] || {}; by[y][d.category] = (by[y][d.category] || 0) + +d.amount; });
  return '<div class="card">' + Object.keys(by).sort().reverse().map(y => {
    const cs = by[y], tot = Object.values(cs).reduce((a, b) => a + b, 0);
    return `<b>${y}: ${eur(tot)}</b><table class="sum">${Object.entries(cs).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td>${eur(v)}</td></tr>`).join('')}</table>`;
  }).join('') + `<p class="mut">${w.length} von ${list.length} Dokument(en) mit Betrag. Suche/Rubrik oben grenzt ein.</p></div>`;
}
function csv() {
  const list = filtered(), q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/\s*\n\s*/g, ' ') + '"';
  const rows = [['Datum', 'Titel', 'Rubrik', 'Absender', 'Betrag', 'Ort', 'Erinnerung', 'Stichworte', 'Notizen'].join(';')]
    .concat(list.map(d => [(d.date || '').slice(0, 10), d.title, d.category, d.sender, d.amount != null ? String(d.amount).replace('.', ',') : '', d.place, d.due, d.tags, d.notes].map(q).join(';')));
  dl(new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv' }), `fotomerker-${safe(filterCat || 'liste')}-${today()}.csv`);
}

/* ---------- Teilen aus anderen Apps (PWA Share Target) ---------- */
async function takeShared() {
  if (!/[?&]share=/.test(location.search)) return;
  history.replaceState(null, '', location.pathname);
  try {
    const c = await caches.open('fm-share'), files = [];
    for (const k of await c.keys()) {
      const r = await c.match(k);
      files.push(new File([await r.blob()], decodeURIComponent(r.headers.get('x-name') || 'geteilt.jpg'), { type: r.headers.get('content-type') || 'image/jpeg', lastModified: Date.now() }));
      await c.delete(k);
    }
    if (files.length) addFiles(files, false);
  } catch (e) { toast('Teilen fehlgeschlagen: ' + e.message); }
}

/* ---------- Backup ---------- */
async function exportAll() {
  toast('Backup wird erstellt …', 60000);
  const out = [];
  for (const d of docs) out.push({ ...d, img: await b64(d.img), thumb: await b64(d.thumb), more: await Promise.all((d.more || []).map(b64)) });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'fotomerker', v: 1, cats, docs: out })], { type: 'application/json' }));
  a.download = `fotomerker-backup-${today()}.json`; a.click(); S.set('lastBackup', new Date().toISOString()); renderDue(); toast('Backup heruntergeladen');
}
async function importAll(file) {
  try {
    const j = JSON.parse(await file.text());
    if (j.app !== 'fotomerker') throw new Error('kein Foto-Merker-Backup');
    const blob = s => fetch('data:image/jpeg;base64,' + s).then(r => r.blob());
    let n = 0;
    for (const d of j.docs) { if (docs.some(x => x.id === d.id)) continue; d.img = await blob(d.img); d.thumb = await blob(d.thumb); d.more = await Promise.all((d.more || []).map(blob)); await dbPut(d); n++; }
    if (j.cats) { cats = [...new Set([...cats, ...j.cats])]; S.set('cats', cats); }
    await loadAll(); render(); toast(`${n} Dokument(e) importiert`);
  } catch (e) { toast('Import fehlgeschlagen: ' + e.message, 5000); }
}

/* ---------- Events ---------- */
$('#camBtn').onclick = () => $('#cam').click();
$('#galBtn').onclick = () => $('#gal').click();
$('#cam').onchange = e => { addFiles(e.target.files, true); e.target.value = ''; };
$('#gal').onchange = e => { addFiles(e.target.files, false); e.target.value = ''; };
$('#q').oninput = () => { showTab('archiv'); render(); };
$('#cats').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { filterCat = b.dataset.c; filterSender = ''; render(); } };
$('#subs').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { filterSender = b.dataset.s; render(); } };
$('#dueBanner').addEventListener('click', e => { if (e.target.id === 'bkNow') exportAll(); });
$('#trash').onclick = async e => {
  const r = e.target.dataset.restore, p = e.target.dataset.purge;
  if (r) { const d = trash.find(x => x.id === r); delete d.deleted; await dbPut(d); trash = trash.filter(x => x !== d); docs.push(d); docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')); render(); renderTrash(); toast('Wiederhergestellt'); }
  if (p) { if (!confirm('Endgültig löschen? Das kann nicht rückgängig gemacht werden.')) return; await dbDel(p); dropUrls(p); trash = trash.filter(x => x.id !== p); renderTrash(); toast('Endgültig gelöscht'); }
};
$('#list').addEventListener('click', e => {
  const s = e.target.closest('.stat');
  if (s) { const c = s.dataset.c; if (c === '__due') showTab('termine'); else if (c === '__year') { sumsOpen = true; render(); } else { filterCat = c; filterSender = ''; render(); scrollTo(0, 0); } }
});
$('#list').addEventListener('click', e => { const b = e.target.closest('.folder'); if (b) { filterCat = b.dataset.c; filterSender = ''; render(); scrollTo(0, 0); } });
$('#viewBtn').onclick = () => { view = view === 'ordner' ? 'liste' : 'ordner'; S.set('view', view); if (view === 'ordner') { filterCat = ''; filterSender = ''; } render(); };
$('#checkAll').onclick = async () => {
  const l = docs.filter(needsCheck);
  if (!confirm(`${l.length} Zuordnung(en) so bestätigen?`)) return;
  for (const d of l) { d.checked = true; learn(d); await dbPut(d); }
  filterCat = ''; render(); toast(`${l.length} bestätigt`);
};
document.body.addEventListener('click', e => { const it = e.target.closest('.item[data-id]'); if (it && !e.target.closest('#modal')) openDoc(it.dataset.id); });
$('#close').onclick = closeDoc;
$('#save').onclick = async () => { const oldAuto = autoTitle(cur); readForm(); if (cur.title === oldAuto) cur.title = autoTitle(cur); cur.checked = true; learn(cur); await dbPut(cur); render(); closeDoc(); toast('Gespeichert ✓'); };
$('#askBtn').onclick = ask;
$('#pg').onchange = e => { addPages([...e.target.files]); e.target.value = ''; };
$('#detail').addEventListener('input', e => { if (e.target.id) dirty[e.target.id] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
$('#sumBtn').onclick = () => { sumsOpen = !sumsOpen; render(); };
$('#csvBtn').onclick = csv;
$('#pdfAll').onclick = () => {
  const f = filtered(); if (!f.length) return toast('Keine Dokumente in der Auswahl');
  if (f.length > 40 && !confirm(`${f.length} Dokumente in ein PDF?`)) return;
  savePdf(f, `fotomerker-${filterCat || 'auswahl'}-${today()}`);
};
$('#scanOn').onchange = e => S.set('scan', e.target.checked);
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) $('#mic').classList.add('hide');
else $('#mic').onclick = () => {
  const r = new SR(); r.lang = 'de-AT';
  r.onresult = e => { $('#ask').value = e.results[0][0].transcript; ask(); };
  r.onerror = e => toast('Spracheingabe: ' + e.error);
  r.start(); toast('Sprich jetzt …');
};
function showTab(t) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('main > section').forEach(s => s.classList.toggle('hide', s.id !== 't-' + t));
}
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) showTab(b.dataset.t); };
$('#saveKey').onclick = () => {
  S.set('key', $('#key').value.trim()); S.set('model', $('#model').value.trim()); S.set('autoAi', $('#autoAi').checked);
  toast('Gespeichert'); setupHints();
};
$('#saveCats').onclick = () => {
  const c = $('#catEdit').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!c.includes('Sonstiges')) c.push('Sonstiges');
  cats = c; S.set('cats', cats); render(); toast('Rubriken gespeichert');
};
$('#exp').onclick = exportAll;
$('#impBtn').onclick = () => $('#imp').click();
$('#imp').onchange = e => { if (e.target.files[0]) importAll(e.target.files[0]); e.target.value = ''; };
function setupHints() {
  $('#key').value = key(); $('#model').value = S.get('model', ''); $('#autoAi').checked = S.get('autoAi', true);
  $('#catEdit').value = cats.join(', ');
  $('#scanOn').checked = S.get('scan', false);
  $('#askHint').textContent = key() ? 'Antwort per KI aus deinen Dokumenten.' : 'Ohne API-Schlüssel werden passende Dokumente gesucht (keine KI-Antwort).';
}

/* ---------- Start ---------- */
(async () => {
  setupHints();
  await loadAll();
  render();
  takeShared();
  docs.filter(d => d.status === 'neu').forEach(d => queue.push(d.id)); work();
  if (navigator.storage?.persist) navigator.storage.persist();
  if ('Notification' in window && Notification.permission === 'default' && docs.some(d => d.due)) Notification.requestPermission().then(notifyDue);
  else notifyDue();
  const st = await navigator.storage?.estimate?.();
  if (st) $('#stats').textContent = `${docs.length} Dokumente · ${(st.usage / 1048576).toFixed(1)} MB belegt`;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
