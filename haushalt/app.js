'use strict';

// ---------- Speicher (IndexedDB) ----------
const DB_NAME = 'wo-ist-was', STORE = 'spots';
let dbp;
function db() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(STORE, mode), s = t.objectStore(STORE);
    const out = fn(s);
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  });
}
let cache = null;   // alle Orte im Speicher; wird bei jedem Schreiben aktualisiert
const allSpots = async () => cache ? cache.slice() : (cache = await tx('readonly', s => s.getAll())).slice();
const putSpot = async spot => {
  await tx('readwrite', s => s.put(spot));
  if (cache) { const i = cache.findIndex(x => x.id === spot.id); i >= 0 ? cache[i] = spot : cache.push(spot); }
};
const delSpot = async id => { await tx('readwrite', s => s.delete(id)); if (cache) cache = cache.filter(x => x.id !== id); };
// Statistik: Zahl der ausgewerteten Bilder für die Kostenschätzung
const stats = {
  get calls() { return +store.get('calls', '0'); },
  bump() { store.set('calls', String(this.calls + 1)); }
};

// ---------- Hilfen ----------
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
// Suchschlüssel: „Löffel“, „Loeffel“ und „Loffel“ werden gleich behandelt
const skey = s => norm(s).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
const uid = () => crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2);
const store = {
  get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const settings = {
  get key() { return store.get('apikey'); },
  get model() { const m = store.get('model', 'claude-haiku-4-5'); return m === 'claude-haiku-4-5-20251001' ? 'claude-haiku-4-5' : m; },
  get auto() { return store.get('auto', '1') === '1'; },
  get gps() { return store.get('gps', '1') === '1'; }
};
const COMMON_ROOMS = ['Küche', 'Wohnzimmer', 'Schlafzimmer', 'Bad', 'Vorraum', 'Büro', 'Kinderzimmer', 'Keller', 'Garage', 'Dachboden'];
const PLACE_TYPES = ['Lade', 'Schrank', 'Regal', 'Kiste', 'Fach', 'Box'];

// ---------- Standort per GPS ----------
// GPS ist im Haus zu ungenau für Räume, unterscheidet aber Gebäude/Standorte (Haus, Lager, Gartenhaus …)
const geo = { site: store.get('site') || null };
const sites = {
  get list() { try { return JSON.parse(store.get('sites', '[]')); } catch { return []; } },
  save(l) { store.set('sites', JSON.stringify(l)); }
};
const curSite = () => geo.site || undefined;
const sameSite = s => (s.site || '') === (geo.site || '');
function distM(a, b) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
let locating = null;
function locate() {
  if (!settings.gps || !navigator.geolocation) return Promise.resolve(geo.site);
  return locating ||= new Promise(res => navigator.geolocation.getCurrentPosition(
    p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), () => res(null),
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
  )).then(async pos => {
    locating = null;
    if (!pos) return geo.site;
    const list = sites.list;
    let best = null, bd = Infinity;
    for (const s of list) { const d = distM(s, pos); if (d < bd) { bd = d; best = s; } }
    if (!best || bd > 200) {
      best = { name: list.length ? `Standort ${list.length + 1}` : 'Zuhause', ...pos };
      list.push(best); sites.save(list);
      // bisherige Orte ohne Standort gehören zum ersten Standort
      if (list.length === 1) for (const s of await allSpots()) if (!s.site) await putSpot({ ...s, site: best.name });
      toast(`📍 Neuer Standort „${best.name}“ – unter 🏠 Räume umbenennbar`);
    }
    geo.site = best.name; store.set('site', best.name);
    renderSiteLine();
    return geo.site;
  });
}
function renderSiteLine() {
  const el = $('site-line');
  if (el) el.textContent = geo.site ? `📍 Standort: ${geo.site}${settings.gps ? ' (GPS)' : ''}` : '';
}

// „Lade 3“ → „Lade 4“, „Lade links“ → „Lade links 2“
function nextPlace(p) {
  p = p.trim();
  if (!p) return '';
  const m = p.match(/^(.*?)(\d+)(\D*)$/);
  return m ? m[1] + (parseInt(m[2], 10) + 1) + m[3] : p + ' 2';
}
// nächste freie Nummer für einen Typ („Lade“) im Raum
function freePlace(spots, room, type) {
  const used = new Set(spots.filter(s => sameSite(s) && norm(s.room) === norm(room)).map(s => norm(s.place)));
  let n = 1;
  while (used.has(norm(`${type} ${n}`))) n++;
  return `${type} ${n}`;
}
function uniquePlace(spots, room, place) {
  const used = new Set(spots.filter(s => sameSite(s) && norm(s.room) === norm(room)).map(s => norm(s.place)));
  if (!used.has(norm(place))) return place;
  let n = 2;
  while (used.has(norm(`${place} ${n}`))) n++;
  return `${place} ${n}`;
}
const findSpot = (spots, room, place) => spots.find(s => sameSite(s) && norm(s.room) === norm(room) && norm(s.place) === norm(place));

// Bild verkleinern → JPEG-DataURL (spart Speicher & API-Kosten)
function shrink(file, max = 1280, q = 0.8) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => rej(new Error('Bild konnte nicht gelesen werden.'));
    img.src = URL.createObjectURL(file);
  });
}

// ---------- Toast ----------
let toastTimer;
function toast(msg, action, fn) {
  $('toast-msg').textContent = msg;
  const b = $('toast-btn');
  b.classList.toggle('hidden', !action);
  b.textContent = action || '';
  b.onclick = () => { $('toast').classList.add('hidden'); fn?.(); };
  $('toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.add('hidden'), action ? 7000 : 3500);
}

// ---------- Bilderkennung (Claude Vision) ----------
class NoKeyError extends Error {}
async function recognize(dataUrl, room, place, opt = {}) {
  const key = settings.key;
  if (!key) throw new NoKeyError('Kein API-Schlüssel – bitte unter ⚙️ eintragen. Foto wird gemerkt und später erkannt.');
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 2000,
        tools: [{
          name: 'inhalt_speichern',
          description: 'Speichert die im Foto erkannten Gegenstände.',
          input_schema: {
            type: 'object',
            properties: {
              raum: { type: 'string', description: 'Wahrscheinlichster Raum im Haus, z. B. "Küche", "Bad", "Garage", "Keller", "Büro" – immer einen konkreten Raum raten, nie "unbekannt"' },
              ...(opt.current ? { gleicher_ort: { type: 'boolean', description: `true, wenn das Bild noch denselben Behälter/Ort zeigt wie "${opt.current}"; false, wenn eine andere Kiste/Lade/Regal zu sehen ist` } } : {}),
              ort: { type: 'string', description: 'Kurze Bezeichnung des Behälters/Orts, z. B. "Besteckschublade", "Werkzeugkiste"' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Kurzer deutscher Name, z. B. "Schere"' },
                    anzahl: { type: 'integer' },
                    suchbegriffe: { type: 'array', items: { type: 'string' }, description: 'Synonyme, Oberbegriffe, österr. Begriffe (z. B. Klebeband → Tixo, Tesa)' },
                    ...(opt.boxes ? { box: { type: 'array', items: { type: 'integer' }, description: `Position im Bild in Pixel als [x, y, breite, höhe]; das Bild ist ${opt.size?.[0] || 1280} × ${opt.size?.[1] || 960} Pixel groß` } } : {})
                  },
                  required: ['name', 'suchbegriffe']
                }
              }
            },
            required: ['items', 'ort', 'raum']
          }
        }],
        tool_choice: { type: 'tool', name: 'inhalt_speichern' },
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] } },
            { type: 'text', text: `Foto aus dem Haushalt (Raum: ${room || 'unbekannt'}, Ort: ${place || 'unbekannt'}). Liste jeden erkennbaren Gegenstand einzeln auf Deutsch auf, möglichst konkret (z. B. "AA-Batterien" statt "Batterien"). Gleiche Gegenstände zusammenfassen mit Anzahl. Den Behälter/das Möbel selbst nicht als Gegenstand aufzählen, sondern als "ort" benennen.${opt.boxes ? ' Gib zu jedem Gegenstand die Position "box" an.' : ''}${opt.current ? ` Bisheriger Behälter: "${opt.current}". Wenn jetzt ein anderer Behälter (andere Kiste, Lade, Regalfach) gezeigt wird, setze gleicher_ort=false und benenne den neuen eindeutig (z. B. "blaue Kiste", "Karton Weihnachtsdeko"). Ist kein Behälter offen, ort="offen im Raum".` : ''}${opt.known?.length ? ` Bereits erfasst (für Gleiches exakt diesen Namen verwenden): ${opt.known.join(', ')}.` : ''}` }
          ]
        }]
      })
    });
  } catch {
    throw new Error('Keine Internetverbindung – Foto wird gemerkt und später erkannt.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `API-Fehler ${r.status}`);
  if (!opt.boxes) stats.bump();
  const inp = j.content?.find(c => c.type === 'tool_use')?.input || {};
  // Platzhalter wie "<UNKNOWN>", "unbekannt", "?" nicht als Namen übernehmen
  const clean = v => { const s = String(v || '').trim(); return /^[<(\[]?\s*(unknown|unbekannt|n\/a|none|null|keine?r?|\?+)\s*[>)\]]?$/i.test(s) ? '' : s; };
  return {
    raum: clean(inp.raum),
    ort: clean(inp.ort),
    gleich: inp.gleicher_ort !== false,
    items: (inp.items || []).filter(i => i?.name).map(i => ({
      name: i.anzahl > 1 ? `${i.name} (${i.anzahl}×)` : i.name,
      tags: i.suchbegriffe || [],
      ...(opt.boxes ? { base: i.name, anzahl: i.anzahl || 1, box: Array.isArray(i.box) && i.box.length === 4 ? i.box : null } : {})
    }))
  };
}

// ---------- Navigation ----------
function show(v) {
  for (const s of ['search', 'add', 'rooms', 'settings']) $('v-' + s).classList.toggle('hidden', s !== v);
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  if (v === 'rooms') renderRooms();
  if (v === 'search') renderSearch();
  if (v === 'add') fillLists();
  if (v === 'settings') { $('apikey').value = settings.key; $('model').value = settings.model; $('gps').checked = settings.gps; renderInfo(); }
  if (v === 'add') { renderSiteLine(); locate(); }
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => show(b.dataset.v));

// ---------- Suche ----------
// Ähnlichkeit zweier Wörter über Buchstabenpaare (0–1); fängt Tippfehler und Diktierfehler ab
function similar(a, b) {
  if (a.length < 3 || b.length < 3 || Math.abs(a.length - b.length) > 2) return 0;   // „pasta“ ≠ „zahnpasta“
  const grams = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const ga = grams(a), gb = grams(b);
  let hit = 0;
  for (const [g, n] of ga) hit += Math.min(n, gb.get(g) || 0);
  return 2 * hit / (a.length - 1 + b.length - 1);
}
function fuzzyIn(w, text) {
  // Wort gegen alle Wörter (und zusammengesetzte Namen) des Textes prüfen
  for (const t of text.split(/[\s()/,+-]+/)) if (t && similar(w, t) >= 0.6) return true;
  return similar(w, text) >= 0.6;
}
function score(words, spot, item) {
  const name = skey(item.name), tags = (item.tags || []).map(skey).join(' ');
  const ctx = skey(spot.room + ' ' + spot.place);
  let s = 0;
  for (const w of words) {
    if (name === w) s += 10;
    else if (name.startsWith(w)) s += 6;
    else if (name.includes(w)) s += 4;
    else if (tags.includes(w)) s += 3;
    else if (ctx.includes(w)) s += 1;
    else if (fuzzyIn(w, name)) s += 2;          // ähnlich geschrieben
    else if (fuzzyIn(w, tags)) s += 1;
    else return 0;
  }
  return s;
}
function fillSuggest(spots) {
  const names = new Set();
  for (const s of spots) for (const i of s.items) names.add((i.base || i.name).replace(/\s*\(\d+×\)$/, ''));
  $('suggest').innerHTML = [...names].sort().slice(0, 300).map(n => `<option value="${esc(n)}">`).join('');
}
function hl(text, q) {
  let out = esc(text);
  for (const w of q.split(/\s+/).filter(x => x.length > 1)) {
    out = out.replace(new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
  }
  return out;
}
const thumb = s => s.photo ? `<img src="${s.photo}" alt="" data-open="${esc(s.id)}">` : '<div class="thumb"></div>';
async function renderSearch() {
  const q = $('q').value.trim(), spots = await allSpots(), el = $('results');
  fillSuggest(spots);
  const pending = spots.filter(s => s.status === 'pending').length;
  const keyNote = settings.key ? '' : `<div class="status">🔑 Für die automatische Erkennung fehlt noch der API-Schlüssel. <a href="#" id="setup-key">Jetzt eintragen</a></div>`;
  const pendNote = pending ? `<div class="status">⏳ ${pending} Foto(s) warten auf Erkennung. <a href="#" id="retry-link">Jetzt erkennen</a></div>` : '';
  if (!spots.length) {
    el.innerHTML = keyNote + `<div class="card"><b>Noch nichts erfasst.</b><p class="muted">Tippe unten auf 📷 Foto → <b>🎥 Filmen</b> und geh einmal durch den Raum: Kisten und Laden öffnen, Inhalt kurz filmen. Raum, Kisten und Produkte werden automatisch erkannt. Danach einfach hier suchen, z. B. „Zahnpasta“.</p></div>`;
    return;
  }
  if (!q) {
    const n = spots.reduce((a, s) => a + s.items.length, 0);
    const recent = [...spots].sort((a, b) => b.updated - a.updated).slice(0, 5);
    el.innerHTML = `${keyNote}${pendNote}<p class="muted">${n} Gegenstände an ${spots.length} Orten erfasst. Oben eintippen oder 🎤 antippen.</p>
      <h2>Zuletzt erfasst</h2>${recent.map(s => `
      <div class="card hit">${thumb(s)}<div><div class="path">📍 ${esc(s.room)} → ${esc(s.place)}</div>
      <div class="muted">${s.status === 'pending' ? '⏳ wartet auf Erkennung' : esc(s.items.slice(0, 6).map(i => i.name).join(', '))}</div></div></div>`).join('')}`;
    return;
  }
  const words = skey(q).split(/\s+/).filter(Boolean);
  const hits = [];
  for (const sp of spots) for (const it of sp.items) {
    const s = score(words, sp, it);
    if (s) hits.push({ s, sp, it });
  }
  hits.sort((a, b) => b.s - a.s);
  const multiSite = new Set(spots.map(s => s.site || '')).size > 1;
  const where = s => `${multiSite && s.site ? esc(s.site) + ' → ' : ''}${esc(s.room)} → ${esc(s.place)}`;
  const nSpots = new Set(hits.map(h => h.sp.id)).size;
  const onlyFuzzy = hits.length && hits[0].s < 3;
  el.innerHTML = pendNote + (hits.length ? `<p class="muted">„${esc(q)}“: ${hits.length} Treffer an ${nSpots} ${nSpots === 1 ? 'Ort' : 'Orten'}${onlyFuzzy ? ' – meintest du:' : ''}</p>` : '') + (hits.length ? hits.slice(0, 50).map(h => `
    <div class="card hit" data-spot="${esc(h.sp.id)}" data-item="${h.sp.items.indexOf(h.it)}">
      ${h.it.photo ? `<img src="${h.it.photo}" alt="" data-open="${esc(h.sp.id)}">` : thumb(h.sp)}
      <div style="flex:1">
        <div>${hl(h.it.name, q)}</div>
        <div class="path">📍 ${where(h.sp)}</div>
      </div>
      <div class="acts">
        <button class="ghost mini" data-act="rename" title="Umbenennen">✏️</button>
        <button class="ghost mini" data-act="take" title="Entnommen / verbraucht">✓</button>
      </div>
    </div>`).join('') : `<div class="card">Nichts gefunden für „${esc(q)}“.<br><span class="muted">Tipp: anders schreiben oder Oberbegriff probieren (z. B. „Werkzeug“).</span></div>`);
}
// Gegenstand aus einem Ort entfernen (entnommen/verbraucht) oder umbenennen
async function itemAction(act, spotId, idx) {
  const spots = await allSpots(), s = spots.find(x => x.id === spotId);
  if (!s || !s.items[idx]) return;
  const it = s.items[idx];
  if (act === 'take') {
    const prev = { ...s, items: [...s.items] };
    const items = s.items.filter((_, i) => i !== idx);
    await putSpot({ ...s, items, updated: Date.now() });
    toast(`✓ „${it.name}“ aus ${s.place} entfernt`, 'Rückgängig', async () => { await putSpot(prev); renderSearch(); });
  } else {
    const name = prompt('Neuer Name:', it.name)?.trim();
    if (!name || name === it.name) return;
    const items = s.items.map((x, i) => i === idx ? { ...x, name, base: name.replace(/\s*\(\d+×\)$/, '') } : x);
    await putSpot({ ...s, items, updated: Date.now() });
  }
  renderSearch();
  if (!$('v-rooms').classList.contains('hidden')) renderRooms();
}
$('q').addEventListener('input', () => show('search'));
$('results').onclick = e => {
  if (e.target.id === 'retry-link') { e.preventDefault(); retryPending(true); return; }
  if (e.target.id === 'setup-key') { show('settings'); return; }
  const act = e.target.dataset.act;
  if (act) { const c = e.target.closest('.hit'); return itemAction(act, c.dataset.spot, +c.dataset.item); }
  const id = e.target.dataset.open;
  if (!id) return;
  show('rooms');
  setTimeout(() => { const d = document.getElementById('spot-' + id); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth' }); } }, 50);
};

// Sprachsuche
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  $('mic').classList.remove('hidden');
  $('mic').onclick = () => {
    const r = new SR();
    r.lang = 'de-AT'; r.interimResults = false; r.maxAlternatives = 1;
    $('mic').classList.add('on');
    r.onresult = e => { $('q').value = e.results[0][0].transcript.replace(/[.?!]$/, ''); show('search'); };
    r.onend = () => $('mic').classList.remove('on');
    r.onerror = () => { $('mic').classList.remove('on'); toast('Sprachsuche nicht verfügbar.'); };
    r.start();
  };
}

// ---------- Foto aufnehmen ----------
let draft = null; // { id?, photo, items }
async function fillLists() {
  const spots = await allSpots();
  const rooms = [...new Set(spots.map(s => s.room))].sort();
  $('rooms').innerHTML = rooms.map(r => `<option value="${esc(r)}">`).join('');
  const chipsRooms = [...rooms, ...COMMON_ROOMS.filter(r => !rooms.some(x => norm(x) === norm(r)))].slice(0, 10);
  $('room-chips').innerHTML = chipsRooms.map(r => `<span class="chip pick${norm(r) === norm($('room').value) ? ' active' : ''}" data-room="${esc(r)}">${esc(r)}</span>`).join('');
  const room = $('room').value;
  const places = [...new Set(spots.filter(s => norm(s.room) === norm(room)).map(s => s.place))].sort();
  $('places').innerHTML = places.map(p => `<option value="${esc(p)}">`).join('');
  $('place-chips').innerHTML = PLACE_TYPES.map(t => `<span class="chip pick" data-type="${t}">+ ${t}</span>`).join('');
}
$('room').addEventListener('change', () => { store.set('room', $('room').value); fillLists(); });
$('room-chips').onclick = e => {
  const r = e.target.dataset.room;
  if (r) { $('room').value = r; store.set('room', r); $('place').value = ''; fillLists(); }
};
$('place-chips').onclick = async e => {
  const t = e.target.dataset.type;
  if (t) $('place').value = freePlace(await allSpots(), $('room').value, t);
};
$('btn-next').onclick = async () => {
  const p = $('place').value.trim();
  $('place').value = p ? nextPlace(p) : freePlace(await allSpots(), $('room').value, 'Lade');
};
$('auto').checked = settings.auto;
$('auto').onchange = () => { store.set('auto', $('auto').checked ? '1' : '0'); updateSaveBtn(); };
$('room').value = store.get('room');
function updateSaveBtn() { $('btn-save').textContent = draft?.id ? '💾 Änderungen speichern' : '💾 Speichern'; }

$('btn-cam').onclick = () => $('f-cam').click();
$('btn-file').onclick = () => $('f-file').click();
$('f-cam').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (f) await handlePhoto(f);
};
$('f-file').onchange = async e => {
  const files = [...e.target.files]; e.target.value = '';
  if (files.length === 1) await handlePhoto(files[0]);
  else if (files.length > 1) await handleBatch(files);
};

// Automatik: ein Foto erkennen und direkt speichern. Gibt den gespeicherten Ort zurück.
async function autoSave(photo, room, place) {
  const spots = await allSpots();
  let res = null, err = null;
  try { res = await recognize(photo, room, place); } catch (e) { err = e; }
  const finalRoom = room || res?.raum || 'Unsortiert';
  // gleicher Raum + Ort existiert schon → nachfotografiert, Inhalt ersetzen
  const existing = place ? findSpot(spots, finalRoom, place) : null;
  const finalPlace = place || uniquePlace(spots, finalRoom, res?.ort || 'Ort 1');
  const spot = {
    id: existing?.id || uid(), site: existing?.site ?? curSite(), room: existing?.room || finalRoom, place: existing?.place || finalPlace,
    photo, items: res ? res.items : (existing?.items || []),
    status: res ? 'done' : 'pending', updated: Date.now()
  };
  await putSpot(spot);
  return { spot, prev: existing, err };
}
function undoable(spot, prev, msg) {
  toast(msg, 'Rückgängig', async () => {
    if (prev) await putSpot(prev); else await delSpot(spot.id);
    toast('Rückgängig gemacht.');
    fillLists(); renderSearch();
  });
}

async function handlePhoto(file) {
  let photo;
  try { photo = await shrink(file); } catch (e) { return toast('⚠️ ' + e.message); }
  const room = $('room').value.trim(), place = $('place').value.trim();

  if (settings.auto && !draft?.id) {
    const st = $('add-status');
    st.classList.remove('hidden');
    st.textContent = '🔎 Erkenne und speichere …';
    $('prev-img').classList.remove('hidden');
    $('prev-img').src = photo;
    const { spot, prev, err } = await autoSave(photo, room, place);
    st.textContent = err ? `⚠️ ${err.message}` : `✅ ${spot.room} → ${spot.place}: ${spot.items.length} Gegenstände gespeichert.`;
    draft = null; renderDraftItems();
    $('add-items').innerHTML = spot.items.map(i => `<span class="chip">${esc(i.name)}</span>`).join('');
    undoable(spot, prev, err ? `⏳ ${spot.room} → ${spot.place} gemerkt` : `✅ ${spot.place}: ${spot.items.length} Gegenstände`);
    if (!room) { $('room').value = spot.room; store.set('room', spot.room); }
    $('place').value = place ? nextPlace(place) : '';
    fillLists();
    return;
  }

  // Manueller Modus: erkennen, prüfen lassen, dann speichern
  draft = { ...(draft?.id ? { id: draft.id } : {}), photo, items: draft?.id ? [] : (draft?.items || []) };
  $('prev-img').classList.remove('hidden');
  $('prev-img').src = photo;
  renderDraftItems();
  const st = $('add-status');
  st.classList.remove('hidden');
  st.textContent = '🔎 Erkenne Gegenstände …';
  $('btn-save').disabled = true;
  try {
    const res = await recognize(photo, room, place);
    const known = new Set(draft.items.map(i => norm(i.name)));
    draft.items.push(...res.items.filter(i => !known.has(norm(i.name))));
    if (!room && res.raum) $('room').value = res.raum;
    if (!place && res.ort) $('place').value = uniquePlace(await allSpots(), $('room').value, res.ort);
    st.textContent = `✅ ${res.items.length} Gegenstände erkannt. Prüfen, ergänzen, speichern.`;
  } catch (err) {
    st.textContent = '⚠️ ' + err.message;
    draft.pending = true;
  }
  $('btn-save').disabled = false;
  renderDraftItems();
}

// Mehrere Fotos auf einmal: nacheinander erkennen und speichern
async function handleBatch(files) {
  const room = $('room').value.trim();
  let place = $('place').value.trim();
  if (place && !/\d/.test(place)) place += ' 1';
  const q = $('queue');
  let ok = 0, wait = 0;
  for (let i = 0; i < files.length; i++) {
    q.textContent = `⏳ Foto ${i + 1} von ${files.length} wird verarbeitet …`;
    let photo;
    try { photo = await shrink(files[i]); } catch { continue; }
    $('prev-img').classList.remove('hidden');
    $('prev-img').src = photo;
    const { spot, err } = await autoSave(photo, room, place);
    err ? wait++ : ok++;
    if (!room) { $('room').value = spot.room; }
    if (place) place = nextPlace(place);
  }
  $('place').value = place;
  q.textContent = `✅ ${ok} Orte gespeichert${wait ? `, ⏳ ${wait} warten auf Erkennung` : ''}.`;
  toast(q.textContent);
  fillLists();
}

function renderDraftItems() {
  $('add-items').innerHTML = (draft?.items || []).map((it, i) =>
    `<span class="chip">${esc(it.name)} <b data-rm="${i}">✕</b></span>`).join('') || '<span class="muted">– noch keine –</span>';
  updateSaveBtn();
}
$('add-items').onclick = e => {
  const i = e.target.dataset.rm;
  if (i !== undefined && draft) { draft.items.splice(+i, 1); renderDraftItems(); }
};
function addManual() {
  const names = $('add-manual').value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  if (!names.length) return;
  draft ||= { photo: null, items: [] };
  for (const name of names) if (!draft.items.some(i => norm(i.name) === norm(name))) draft.items.push({ name, tags: [] });
  $('add-manual').value = '';
  renderDraftItems();
}
$('btn-add-manual').onclick = addManual;
$('add-manual').addEventListener('keydown', e => { if (e.key === 'Enter') addManual(); });

$('btn-save').onclick = async () => {
  const room = $('room').value.trim(), place = $('place').value.trim();
  if (!room || !place) return toast('Bitte Raum und Ort angeben.');
  const pending = draft?.pending && draft.photo;
  if (!draft?.items.length && !pending) return toast('Keine Gegenstände – bitte ergänzen.');
  const spots = await allSpots();
  const existing = draft.id ? spots.find(s => s.id === draft.id) : findSpot(spots, room, place);
  const spot = {
    id: existing?.id || uid(), site: existing?.site ?? curSite(), room, place, photo: draft.photo ?? existing?.photo ?? null,
    items: draft.items, status: pending && !draft.items.length ? 'pending' : 'done', updated: Date.now()
  };
  await putSpot(spot);
  undoable(spot, existing, `💾 ${room} → ${place} gespeichert`);
  draft = null;
  $('prev-img').classList.add('hidden');
  $('add-status').classList.add('hidden');
  renderDraftItems();
  $('place').value = nextPlace(place);
  store.set('room', room);
  fillLists();
};

// ---------- Film-Modus: filmen → Produkte einzeln erkennen, mit eigenem Foto speichern ----------
const FILM_INTERVAL = 2500;   // ms zwischen zwei Bildern
const FILM_MIN_DIFF = 12;     // Mindest-Bildänderung (0–255), sonst wird nichts gesendet
const film = { stream: null, timer: null, busy: false, paused: false, sig: null, spot: null, session: [], room: '', place: '', autoPlace: true, source: 'cam', sent: 0 };

// Bild aus dem Video holen (max. 1280 px)
function grabFrame(video) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return null;
  const f = Math.min(1, 1280 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * f); c.height = Math.round(h * f);
  c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
  return c;
}
// kleiner Graustufen-Fingerabdruck, um unveränderte Bilder zu überspringen
function signature(canvas) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(canvas, 0, 0, 16, 16);
  const d = g.getImageData(0, 0, 16, 16).data, out = new Uint8Array(256);
  for (let i = 0; i < 256; i++) out[i] = (d[i * 4] * 3 + d[i * 4 + 1] * 6 + d[i * 4 + 2]) / 10;
  return out;
}
const sigDiff = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
// Produkt aus dem Bild ausschneiden (box = [x, y, b, h] in Pixel des übergebenen Bildes)
function cropItem(canvas, box) {
  const W = canvas.width, H = canvas.height;
  let [x, y, w, h] = box ? [box[0] / W, box[1] / H, box[2] / W, box[3] / H].map(v => Math.max(0, Math.min(1, v))) : [0, 0, 1, 1];
  const pad = 0.08;
  x = Math.max(0, x - w * pad); y = Math.max(0, y - h * pad);
  w = Math.min(1 - x, w * (1 + 2 * pad)); h = Math.min(1 - y, h * (1 + 2 * pad));
  if (w < 0.02 || h < 0.02) [x, y, w, h] = [0, 0, 1, 1];
  const sx = x * canvas.width, sy = y * canvas.height, sw = w * canvas.width, sh = h * canvas.height;
  const f = Math.min(1, 320 / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * f)); c.height = Math.max(1, Math.round(sh * f));
  c.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.75);
}

function filmStatus(msg) {
  $('film-where').textContent = (film.spot ? `${film.spot.room} → ${film.spot.place}` : `${film.room || 'Raum wird erkannt …'} → ${film.place || 'Kiste wird erkannt …'}`) + ' ✏️';
  const total = film.session.reduce((a, s) => a + s.items.length, 0);
  $('film-stat').textContent = msg ?? `${film.session.filter(s => s.items.length).length} Orte · ${total} Produkte · ${film.sent} Bilder`;
}
function renderFilmItems() {
  const items = film.spot?.items || [];
  $('film-items').innerHTML = items.slice().reverse().map(i =>
    `<div class="film-item">${i.photo ? `<img src="${i.photo}" alt="">` : ''}${esc(i.name)}</div>`).join('');
}

// ein Bild auswerten und Produkte in den aktuellen Ort übernehmen
async function filmProcess(canvas) {
  const sig = signature(canvas);
  if (film.sig && sigDiff(sig, film.sig) < FILM_MIN_DIFF) { filmStatus(); return; }
  film.sig = sig;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const known = (film.spot?.items || []).map(i => i.base || i.name);
  const current = film.autoPlace && film.spot ? film.spot.place : '';
  filmStatus('🔎 Erkenne …');
  let res;
  try { res = await recognize(dataUrl, film.room, film.autoPlace ? current : film.place, { boxes: true, known, current, size: [canvas.width, canvas.height] }); }
  catch (e) { filmStatus('⚠️ ' + e.message); return; }
  film.sent++; stats.bump();
  if (!film.room) {                       // Raum von der KI geschätzt, gilt für den ganzen Durchgang
    film.room = res.raum || 'Unsortiert';
    $('room').value = film.room; store.set('room', film.room);
  }
  // Automatischer Behälterwechsel: KI meldet eine andere Kiste/Lade
  if (film.autoPlace && film.spot && !res.gleich && res.ort && skey(res.ort) !== skey(film.spot.place)) {
    await filmCloseSpot();
    const back = film.session.find(s => skey(s.place) === skey(res.ort));   // zurück zu einer schon gefilmten Kiste
    if (back) film.spot = back;
    filmStatus(`📦 Neuer Ort erkannt: ${res.ort}`);
  }
  if (!film.spot) {
    const spots = await allSpots();
    const existing = !film.autoPlace ? findSpot(spots, film.room, film.place) : null;
    // bewusst gewählter, schon vorhandener Ort erneut gefilmt → Inhalt wird neu aufgebaut
    film.spot = {
      id: existing?.id || uid(), site: existing?.site ?? curSite(), room: existing?.room || film.room,
      place: existing?.place || (film.autoPlace ? uniquePlace(spots, film.room, res.ort || 'Ort 1') : film.place),
      photo: dataUrl, items: [], status: 'done', updated: Date.now()
    };
    film.session.push(film.spot);
  }
  let added = 0;
  for (const it of res.items) {
    const k = skey(it.base || it.name);
    const have = film.spot.items.find(x => skey(x.base || x.name) === k);
    if (have) {
      // gleiches Produkt: höhere Anzahl übernehmen, fehlendes Foto ergänzen
      if ((it.anzahl || 1) > (have.anzahl || 1)) { have.anzahl = it.anzahl; have.name = it.name; }
      if (!have.photo && it.box) have.photo = cropItem(canvas, it.box);
      continue;
    }
    film.spot.items.push({ name: it.name, base: it.base, anzahl: it.anzahl, tags: it.tags, photo: cropItem(canvas, it.box) });
    added++;
  }
  film.spot.updated = Date.now();
  if (film.spot.items.length) await putSpot(film.spot);   // laufend speichern – nichts geht verloren
  renderFilmItems();
  filmStatus(added ? `➕ ${added} neu · ${film.spot.items.length} Produkte` : undefined);
}
// aktuellen Ort abschließen (leere Orte, z. B. Raumübersicht ohne Inhalt, verwerfen)
async function filmCloseSpot() {
  const s = film.spot;
  film.spot = null; film.sig = null;
  $('film-items').innerHTML = '';
  if (s && !s.items.length) film.session = film.session.filter(x => x !== s);
}
// Raum/Ort während des Filmens korrigieren
async function filmEdit() {
  const room = prompt('Raum (für diesen Durchgang):', film.room || '')?.trim();
  if (room && room !== film.room) {
    for (const s of film.session) { s.room = room; if (s.items.length) await putSpot(s); }
    film.room = room; $('room').value = room; store.set('room', room);
  }
  if (film.spot) {
    const place = prompt('Name dieser Kiste / Lade:', film.spot.place)?.trim();
    if (place && place !== film.spot.place) { film.spot.place = place; if (film.spot.items.length) await putSpot(film.spot); }
  }
  filmStatus();
}

async function filmTick() {
  if (film.busy || film.paused) return;
  const canvas = grabFrame($('film-video'));
  if (!canvas) return;
  film.busy = true;
  try { await filmProcess(canvas); } finally { film.busy = false; }
}

function filmOpen() {
  film.spot = null; film.sig = null; film.sent = 0; film.paused = false; film.session = [];
  film.room = $('room').value.trim(); film.place = $('place').value.trim();
  film.autoPlace = !film.place;   // kein Ort angegeben → KI erkennt Kisten selbst und wechselt automatisch
  locate();
  $('film-items').innerHTML = '';
  $('film-pause').textContent = '⏸';
  $('film-rec').classList.remove('paused');
  $('film').classList.remove('hidden');
  filmStatus('Kamera wird gestartet …');
}

async function startFilm() {
  if (!settings.key) return toast('Für den Film-Modus bitte zuerst den API-Schlüssel unter ⚙️ eintragen.');
  if (!navigator.mediaDevices?.getUserMedia) return toast('Kamera nicht verfügbar (nur über https möglich).');
  filmOpen();
  film.source = 'cam';
  try {
    film.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
  } catch {
    $('film').classList.add('hidden');
    return toast('Kein Kamerazugriff – bitte in den Browser-Einstellungen erlauben.');
  }
  const v = $('film-video');
  v.srcObject = film.stream;
  await v.play().catch(() => {});
  const track = film.stream.getVideoTracks()[0];
  film.torch = false;
  $('film-torch').classList.toggle('hidden', !track?.getCapabilities?.().torch);
  filmStatus('Langsam über den Inhalt schwenken …');
  film.timer = setInterval(filmTick, FILM_INTERVAL);
  setTimeout(filmTick, 800);
}

// fertiges Video aus der Galerie: alle 2,5 s ein Bild auswerten
async function processVideoFile(file) {
  if (!settings.key) return toast('Bitte zuerst den API-Schlüssel unter ⚙️ eintragen.');
  filmOpen();
  film.source = 'file';
  const v = $('film-video');
  v.srcObject = null;
  v.src = URL.createObjectURL(file);
  try {
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = rej; });
    v.pause();
    const dur = isFinite(v.duration) ? v.duration : 0;
    for (let t = 0; t <= dur && !$('film').classList.contains('hidden'); t += FILM_INTERVAL / 1000) {
      while (film.paused && !$('film').classList.contains('hidden')) await new Promise(r => setTimeout(r, 300));
      v.currentTime = Math.min(t, Math.max(0, dur - 0.05));
      await new Promise(r => { v.onseeked = r; setTimeout(r, 1500); });
      const canvas = grabFrame(v);
      if (canvas) await filmProcess(canvas);
      filmStatus(`${film.spot?.items.length || 0} Produkte · ${Math.round(Math.min(t, dur))} / ${Math.round(dur)} s`);
    }
    if (!$('film').classList.contains('hidden')) stopFilm();
  } catch {
    stopFilm();
    toast('Video konnte nicht gelesen werden.');
  }
}

function stopFilm() {
  clearInterval(film.timer); film.timer = null;
  film.stream?.getTracks().forEach(t => t.stop()); film.stream = null;
  const v = $('film-video');
  if (v.src) { URL.revokeObjectURL(v.src); v.removeAttribute('src'); }
  v.srcObject = null;
  $('film').classList.add('hidden');
  const saved = film.session.filter(s => s.items.length);
  if (saved.length) {
    const n = saved.reduce((a, s) => a + s.items.length, 0);
    toast(`✅ ${saved.length} ${saved.length === 1 ? 'Ort' : 'Orte'} mit ${n} Produkten archiviert – unter 🏠 Räume prüfen/umbenennen`);
    $('place').value = film.autoPlace ? '' : nextPlace(saved.at(-1).place);
    film.session = [];
    fillLists(); show('rooms');
    return;
  }
  fillLists(); renderSearch();
}

$('btn-film').onclick = startFilm;
$('btn-video').onclick = () => $('f-video').click();
$('f-video').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) processVideoFile(f); };
$('film-done').onclick = stopFilm;
$('film-where').onclick = filmEdit;
$('film-torch').onclick = async () => {
  const track = film.stream?.getVideoTracks()[0];
  if (!track) return;
  film.torch = !film.torch;
  try { await track.applyConstraints({ advanced: [{ torch: film.torch }] }); } catch { film.torch = false; }
  $('film-torch').classList.toggle('on', film.torch);
};
$('film-pause').onclick = () => {
  film.paused = !film.paused;
  $('film-pause').textContent = film.paused ? '▶️' : '⏸';
  $('film-rec').classList.toggle('paused', film.paused);
  $('film-rec').textContent = film.paused ? 'Pause' : '● REC';
};
$('film-next').onclick = async () => {
  // nächster Ort: gleicher Raum, Nummer +1 oder neu von der KI benennen lassen
  const prev = film.spot;
  if (!film.autoPlace) film.place = nextPlace(prev?.place || film.place || freePlace(await allSpots(), film.room, 'Lade'));
  await filmCloseSpot();
  filmStatus(prev ? `✅ ${prev.place}: ${prev.items.length} Produkte gespeichert` : '');
};

// ---------- Warteschlange: gemerkte Fotos nachträglich erkennen ----------
let retrying = false;
async function retryPending(verbose) {
  if (retrying || !settings.key || !navigator.onLine) {
    if (verbose) toast(!settings.key ? 'Bitte zuerst API-Schlüssel eintragen.' : 'Keine Internetverbindung.');
    return;
  }
  retrying = true;
  let done = 0;
  try {
    for (const s of (await allSpots()).filter(s => s.status === 'pending' && s.photo)) {
      try {
        const res = await recognize(s.photo, s.room, s.place);
        const known = new Set(s.items.map(i => norm(i.name)));
        await putSpot({ ...s, items: [...s.items, ...res.items.filter(i => !known.has(norm(i.name)))], status: 'done', updated: Date.now() });
        done++;
      } catch { break; }
    }
  } finally { retrying = false; }
  if (done) { toast(`✅ ${done} gemerkte(s) Foto(s) erkannt.`); renderSearch(); if (!$('v-rooms').classList.contains('hidden')) renderRooms(); }
  else if (verbose) toast('Erkennung noch nicht möglich.');
}
window.addEventListener('online', () => retryPending());

// ---------- Räume ----------
async function renderRooms() {
  const spots = (await allSpots()).sort((a, b) => (a.site || '').localeCompare(b.site || '') || a.room.localeCompare(b.room) || a.place.localeCompare(b.place, 'de', { numeric: true }));
  if (!spots.length) { $('room-list').innerHTML = '<p class="muted">Noch keine Räume erfasst.</p>'; return; }
  const multiSite = new Set(spots.map(s => s.site || '')).size > 1;
  const groups = {};
  for (const s of spots) (groups[JSON.stringify([s.site || '', s.room])] ||= []).push(s);
  let lastSite = null, html = '';
  for (const [k, list] of Object.entries(groups)) {
    const [site, room] = JSON.parse(k);
    if (site && site !== lastSite && multiSite) {
      html += `<h2 class="site-h">📍 ${esc(site)} <button class="ghost mini" data-rename-site="${esc(site)}">✏️</button></h2>`;
    }
    lastSite = site;
    const n = list.reduce((a, s) => a + s.items.length, 0);
    html += `<h2>🏠 ${esc(room)} <span class="muted">(${list.length} ${list.length === 1 ? 'Ort' : 'Orte'}, ${n} ${n === 1 ? 'Ding' : 'Dinge'})</span> <button class="ghost mini" data-rename-room="${esc(k)}">✏️</button></h2>
    ${list.map(s => `
      <details class="card" id="spot-${esc(s.id)}">
        <summary>📦 ${esc(s.place)} <span class="muted">· ${s.status === 'pending' ? '⏳ wartet auf Erkennung' : s.items.length + (s.items.length === 1 ? ' Gegenstand' : ' Gegenstände')}</span></summary>
        ${s.photo ? `<img class="preview" src="${s.photo}" alt="" style="margin-top:10px">` : ''}
        <div class="chips">${s.items.map((i, k) => `<span class="chip pick" data-item="${k}" data-spot="${esc(s.id)}" title="Antippen zum Bearbeiten">${i.photo ? `<img src="${i.photo}" alt="">` : ''}${esc(i.name)}</span>`).join('')}</div>
        <p class="muted">Aktualisiert: ${new Date(s.updated).toLocaleString('de-AT')}</p>
        <div class="row">
          <button class="ghost" data-edit="${esc(s.id)}">✏️ Bearbeiten / verschieben</button>
          <button class="danger" data-del="${esc(s.id)}" style="flex:none">🗑️</button>
        </div>
      </details>`).join('')}`;
  }
  $('room-list').innerHTML = html;
}
async function renameRoom(key) {
  const [site, room] = JSON.parse(key);
  const name = prompt('Raum umbenennen:', room)?.trim();
  if (!name || name === room) return;
  for (const s of await allSpots()) if ((s.site || '') === site && s.room === room) await putSpot({ ...s, room: name });
  if (store.get('room') === room) { store.set('room', name); $('room').value = name; }
  toast(`Raum „${room}“ → „${name}“`); renderRooms();
}
async function renameSite(site) {
  const name = prompt('Standort umbenennen (z. B. Haus, Lager, Gartenhaus):', site)?.trim();
  if (!name || name === site) return;
  sites.save(sites.list.map(s => s.name === site ? { ...s, name } : s));
  for (const s of await allSpots()) if (s.site === site) await putSpot({ ...s, site: name });
  if (geo.site === site) { geo.site = name; store.set('site', name); renderSiteLine(); }
  toast(`Standort „${site}“ → „${name}“`); renderRooms();
}
$('room-list').onclick = async e => {
  const chip = e.target.closest('.chip[data-item]');
  if (chip) {
    const spots = await allSpots(), s = spots.find(x => x.id === chip.dataset.spot), it = s?.items[+chip.dataset.item];
    if (!it) return;
    const v = prompt(`„${it.name}“ – neuer Name (leer lassen = entfernen):`, it.name);
    if (v === null) return;
    const name = v.trim();
    const items = name ? s.items.map((x, i) => i === +chip.dataset.item ? { ...x, name, base: name.replace(/\s*\(\d+×\)$/, '') } : x) : s.items.filter((_, i) => i !== +chip.dataset.item);
    await putSpot({ ...s, items, updated: Date.now() });
    return renderRooms();
  }
  const { edit, del, renameRoom: rr, renameSite: rs } = e.target.dataset;
  if (rr) return renameRoom(rr);
  if (rs) return renameSite(rs);
  if (!edit && !del) return;
  const spots = await allSpots();
  if (del) {
    const s = spots.find(x => x.id === del);
    if (confirm(`„${s.room} → ${s.place}“ wirklich löschen?`)) { await delSpot(del); renderRooms(); }
  } else {
    const s = spots.find(x => x.id === edit);
    draft = { id: s.id, photo: s.photo, items: [...s.items] };
    show('add');
    $('room').value = s.room; $('place').value = s.place;
    $('prev-img').classList.toggle('hidden', !s.photo);
    $('prev-img').src = s.photo || '';
    $('add-status').classList.remove('hidden');
    $('add-status').textContent = '✏️ Bearbeiten: neues Foto ersetzt die Liste, oder Gegenstände ändern und speichern.';
    renderDraftItems();
  }
};

// ---------- Einstellungen / Sicherung ----------
$('btn-save-settings').onclick = () => {
  store.set('apikey', $('apikey').value.trim());
  store.set('model', $('model').value);
  store.set('gps', $('gps').checked ? '1' : '0');
  toast('Gespeichert.');
  retryPending();
};
// Kostenschätzung: ~1.800 Token pro Bild (Foto + Anweisung) + ~400 Token Antwort
const PRICE = { 'claude-haiku-4-5': [1, 5], 'claude-sonnet-5': [2, 10] };   // $ pro Mio. Token (Eingabe, Ausgabe)
const costPerImage = m => { const [i, o] = PRICE[m] || PRICE['claude-haiku-4-5']; return (1800 * i + 400 * o) / 1e6; };
async function renderInfo() {
  const spots = await allSpots();
  const n = spots.reduce((a, s) => a + s.items.length, 0);
  let storage = '';
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.usage) storage = ` · Speicher: ${(est.usage / 1048576).toFixed(1)} MB` + (est.quota ? ` von ${Math.round(est.quota / 1048576)} MB` : '');
  } catch {}
  const last = store.get('lastExport');
  const days = last ? Math.floor((Date.now() - +last) / 864e5) : null;
  $('info').innerHTML = `${spots.length} Orte, ${n} Gegenstände${storage}<br>
    Bilder ausgewertet: ${stats.calls} (≈ ${(stats.calls * costPerImage(settings.model) * 100).toFixed(1)} Cent, grobe Schätzung; ${settings.model.includes('sonnet') ? 'Sonnet' : 'Haiku'} ≈ ${(costPerImage(settings.model) * 100).toFixed(2)} Cent pro Bild)<br>
    Letzte Sicherung: ${last ? new Date(+last).toLocaleDateString('de-AT') + (days > 14 ? ' ⚠️ schon ' + days + ' Tage her' : '') : '⚠️ noch nie'}`;
}
$('btn-export').onclick = async () => {
  store.set('lastExport', String(Date.now()));
  const blob = new Blob([JSON.stringify(await allSpots())], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wo-ist-was-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('btn-import').onclick = () => $('f-import').click();
$('f-import').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data)) throw new Error();
    let n = 0;
    for (const s of data) if (s.id && s.room && s.place && Array.isArray(s.items)) { await putSpot(s); n++; }
    toast(`${n} Orte importiert.`);
  } catch { toast('Ungültige Sicherungsdatei.'); }
};

// ---------- Beispielhaus (Demo-Daten zum Ausprobieren) ----------
const DEMO = [
  ['Küche', 'Besteckschublade', ['Messer (6×)|Küchenmesser', 'Gabeln (6×)|Besteck', 'Löffel (6×)|Besteck,Esslöffel', 'Teelöffel (8×)|Kaffeelöffel', 'Schere|Küchenschere', 'Flaschenöffner|Kapselheber', 'Korkenzieher|Weinöffner']],
  ['Küche', 'Gewürzregal', ['Salz|Speisesalz', 'Pfeffer|Pfefferkörner', 'Paprikapulver|edelsüß', 'Oregano|Kräuter', 'Zimt|Gewürz', 'Kümmel|Gewürz', 'Curry|Gewürz', 'Vanillezucker|Backen']],
  ['Küche', 'Vorratsschrank', ['Nudeln (3×)|Pasta,Spaghetti', 'Reis|Langkornreis', 'Mehl (2×)|Weizenmehl,glatt', 'Zucker|Kristallzucker', 'Passierte Tomaten (4×)|Tomatensauce,Dose', 'Linsen|Hülsenfrüchte', 'Haferflocken|Müsli', 'Olivenöl|Öl']],
  ['Küche', 'Lade unter Herd', ['Backpapier|Backen', 'Alufolie|Alu', 'Frischhaltefolie|Folie', 'Gefrierbeutel|Sackerl,Tiefkühl', 'Muffinförmchen|Backen']],
  ['Bad', 'Spiegelschrank', ['Zahnpasta (2×)|Zahncreme,Elmex', 'Zahnbürsten (3×)|Zahnbürste', 'Zahnseide|Zahnpflege', 'Deo|Deodorant', 'Rasierer|Rasierapparat', 'Nagelschere|Nagelpflege', 'Pinzette|Nagelpflege']],
  ['Bad', 'Kiste unter Waschbecken', ['Zahnpasta (4×)|Vorrat,Zahncreme', 'Duschgel (3×)|Vorrat', 'Shampoo (2×)|Vorrat,Haarwaschmittel', 'Klopapier (12×)|Toilettenpapier,WC-Papier', 'Wattestäbchen|Q-Tips', 'Pflaster|Hansaplast,Verband', 'Fieberthermometer|Thermometer']],
  ['Bad', 'Waschmaschinenregal', ['Waschmittel|Waschpulver,Persil', 'Weichspüler|Wäsche', 'Fleckenentferner|Vanish', 'Wäscheklammern|Kluppen']],
  ['Vorraum', 'Schlüsselschublade', ['Ersatzschlüssel Haus|Schlüssel', 'Autoschlüssel Zweitschlüssel|Schlüssel', 'Garagenfernbedienung|Fernbedienung,Garage', 'Taschenlampe|Lampe', 'Batterien AA (8×)|Batterie,Mignon', 'Batterien AAA (4×)|Batterie,Micro', 'Kugelschreiber (5×)|Kuli,Stift']],
  ['Vorraum', 'Schuhkasten', ['Schuhputzzeug|Schuhcreme,Bürste', 'Regenschirm (2×)|Schirm', 'Einkaufstaschen|Sackerl,Stofftasche', 'Hundeleine|Leine']],
  ['Schlafzimmer', 'Nachtkästchen links', ['Ladekabel USB-C|Ladegerät,Kabel', 'Ohrstöpsel|Ohropax', 'Lesebrille|Brille', 'Handcreme|Creme', 'Taschentücher|Tempo']],
  ['Schlafzimmer', 'Kasten oberes Fach', ['Bettwäsche (3×)|Überzug,Leintuch', 'Decke Gäste|Zudecke', 'Polster Gäste (2×)|Kissen', 'Koffer klein|Reisekoffer,Handgepäck']],
  ['Kinderzimmer', 'Spielzeugkiste', ['Lego|Bausteine', 'Puzzle (4×)|Spiel', 'Malstifte|Buntstifte,Filzstifte', 'Kuscheltier Hase|Stofftier', 'Autos (12×)|Matchbox,Spielzeugauto']],
  ['Büro', 'Schreibtischlade', ['Tacker|Hefter,Klammermaschine', 'Locher|Büro', 'Tixo|Klebeband,Tesa', 'Büroklammern|Klammern', 'Textmarker (3×)|Leuchtstift', 'Briefmarken|Post', 'Reisepass|Ausweis,Dokument', 'Ladekabel Laptop|Netzteil']],
  ['Büro', 'Ordnerregal', ['Ordner Versicherungen|Polizze,Unterlagen', 'Ordner Haus|Bauunterlagen,Pläne', 'Ordner Steuer 2025|Finanzamt,Belege', 'Ordner Auto|Zulassung,Service', 'Drucker-Toner|Patrone']],
  ['Keller', 'Werkzeugkiste', ['Hammer|Werkzeug', 'Schraubenzieher-Set|Schraubendreher,Werkzeug', 'Zange (2×)|Kombizange,Werkzeug', 'Maßband|Meterstab,Rollmeter', 'Wasserwaage|Werkzeug', 'Akkuschrauber|Bohrmaschine,Bosch', 'Schrauben sortiert|Dübel,Nägel', 'Cuttermesser|Stanleymesser,Teppichmesser']],
  ['Keller', 'Regal Vorräte', ['Mineralwasser (2 Kisten)|Getränke,Wasser', 'Bier (1 Kiste)|Getränke', 'Passata (6×)|Tomaten,Konserve', 'Mais Dosen (4×)|Konserve', 'Marmelade selbstgemacht (9×)|Einmachglas,Konfitüre', 'Apfelsaft (6×)|Saft,Getränke']],
  ['Keller', 'Karton Weihnachtsdeko', ['Christbaumkugeln|Weihnachten,Deko', 'Lichterkette (3×)|Weihnachten,Beleuchtung', 'Adventkranz-Kerzen|Kerzen', 'Christbaumständer|Weihnachten', 'Krippe|Weihnachten,Figuren']],
  ['Keller', 'Karton Camping', ['Zelt|Camping', 'Schlafsäcke (2×)|Camping', 'Gaskocher|Camping,Kocher', 'Isomatte (2×)|Camping,Matte', 'Stirnlampe|Lampe,Camping']],
  ['Garage', 'Regal 1', ['Motoröl|Öl,Auto', 'Scheibenfrostschutz|Frostschutz,Auto', 'Fahrradpumpe|Pumpe,Rad', 'Fahrradschloss|Schloss,Rad', 'Schneeketten|Winter,Auto', 'Eiskratzer (2×)|Winter,Auto']],
  ['Garage', 'Regal 2', ['Rasenmäher-Benzin|Sprit,Kanister', 'Gartenschere|Schere,Garten', 'Blumenerde (2 Sack)|Erde,Garten', 'Dünger|Garten', 'Gartenhandschuhe|Handschuhe', 'Grillkohle|Grill,Holzkohle', 'Grillanzünder|Grill']],
  ['Dachboden', 'Kiste Babysachen', ['Babykleidung Gr. 68|Gewand,Baby', 'Babyphone|Baby', 'Wickelauflage|Baby', 'Kinderwagen-Regenschutz|Kinderwagen']],
  ['Dachboden', 'Kiste Skiausrüstung', ['Skihelm (2×)|Helm,Ski', 'Skibrille (2×)|Brille,Ski', 'Skihandschuhe|Handschuhe,Ski', 'Skisocken|Socken', 'Skiwachs|Ski']]
];
const DEMO_COLORS = ['#e57373', '#f06292', '#ba68c8', '#7986cb', '#4fc3f7', '#4db6ac', '#81c784', '#dce775', '#ffd54f', '#ffb74d', '#a1887f', '#90a4ae'];
// Platzhalterbild mit Text (statt echtem Foto)
function demoImage(text, color, size = 320, sub = '') {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, size, size);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(size * .78, size * .22, size * .3, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = `bold ${size / 9}px system-ui,sans-serif`; g.textAlign = 'center';
  const words = text.split(' '); let lines = [''];
  for (const w of words) { if ((lines.at(-1) + ' ' + w).trim().length > 14) lines.push(w); else lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim(); }
  lines.slice(0, 3).forEach((l, i) => g.fillText(l, size / 2, size / 2 + (i - (Math.min(lines.length, 3) - 1) / 2) * size / 7));
  if (sub) { g.font = `${size / 14}px system-ui,sans-serif`; g.fillText(sub, size / 2, size * .9); }
  return c.toDataURL('image/jpeg', 0.7);
}
async function loadDemo(silent) {
  const spots = await allSpots();
  if (spots.length && !silent && !confirm(`Es sind schon ${spots.length} Orte gespeichert. Beispielhaus trotzdem dazuladen?`)) return;
  let n = 0, k = 0;
  for (const [room, place, items] of DEMO) {
    const col = DEMO_COLORS[k++ % DEMO_COLORS.length];
    if (findSpot(spots, room, place)) continue;
    await putSpot({
      id: uid(), site: 'Zuhause', room, place, status: 'done', demo: true,
      photo: demoImage(place, col, 640, room),
      items: items.map((s, i) => {
        const [name, tags = ''] = s.split('|');
        return { name, base: name.replace(/\s*\(.*\)$/, ''), tags: tags.split(',').filter(Boolean), photo: demoImage(name.replace(/\s*\(.*\)$/, ''), DEMO_COLORS[(k + i) % DEMO_COLORS.length], 200) };
      }),
      updated: Date.now() - (DEMO.length - n) * 36e5
    });
    n++;
  }
  if (!sites.list.length) sites.save([{ name: 'Zuhause', lat: 0, lon: 0 }]);
  if (!geo.site) { geo.site = 'Zuhause'; store.set('site', 'Zuhause'); }
  toast(`🏠 Beispielhaus geladen: ${n} Orte. Such z. B. „Zahnpasta“, „Tixo“ oder „Batterien“.`);
  $('q').value = ''; show('search');
}
async function removeDemo() {
  const d = (await allSpots()).filter(s => s.demo);
  if (!d.length) return toast('Kein Beispielhaus vorhanden.');
  if (!confirm(`${d.length} Beispiel-Orte löschen? Eigene Daten bleiben.`)) return;
  for (const s of d) await delSpot(s.id);
  toast('Beispielhaus entfernt.'); renderInfo(); renderSearch();
}
$('btn-demo').onclick = () => loadDemo();
$('btn-demo-del').onclick = removeDemo;

// ---------- Start ----------
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
// Browser bitten, die Daten nicht bei Speicherknappheit zu löschen
navigator.storage?.persist?.().catch(() => {});
renderDraftItems();
retryPending();
// ?demo in der Adresse lädt das Beispielhaus (zum Ausprobieren)
if (new URLSearchParams(location.search).has('demo')) allSpots().then(s => s.some(x => x.demo) ? renderSearch() : loadDemo(true));
else renderSearch();
