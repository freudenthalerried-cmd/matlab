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
const allSpots = () => tx('readonly', s => s.getAll());
const putSpot = spot => tx('readwrite', s => s.put(spot));
const delSpot = id => tx('readwrite', s => s.delete(id));

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
  get model() { return store.get('model', 'claude-haiku-4-5-20251001'); },
  get auto() { return store.get('auto', '1') === '1'; }
};
const COMMON_ROOMS = ['Küche', 'Wohnzimmer', 'Schlafzimmer', 'Bad', 'Vorraum', 'Büro', 'Kinderzimmer', 'Keller', 'Garage', 'Dachboden'];
const PLACE_TYPES = ['Lade', 'Schrank', 'Regal', 'Kiste', 'Fach', 'Box'];

// „Lade 3“ → „Lade 4“, „Lade links“ → „Lade links 2“
function nextPlace(p) {
  p = p.trim();
  if (!p) return '';
  const m = p.match(/^(.*?)(\d+)(\D*)$/);
  return m ? m[1] + (parseInt(m[2], 10) + 1) + m[3] : p + ' 2';
}
// nächste freie Nummer für einen Typ („Lade“) im Raum
function freePlace(spots, room, type) {
  const used = new Set(spots.filter(s => norm(s.room) === norm(room)).map(s => norm(s.place)));
  let n = 1;
  while (used.has(norm(`${type} ${n}`))) n++;
  return `${type} ${n}`;
}
function uniquePlace(spots, room, place) {
  const used = new Set(spots.filter(s => norm(s.room) === norm(room)).map(s => norm(s.place)));
  if (!used.has(norm(place))) return place;
  let n = 2;
  while (used.has(norm(`${place} ${n}`))) n++;
  return `${place} ${n}`;
}
const findSpot = (spots, room, place) => spots.find(s => norm(s.room) === norm(room) && norm(s.place) === norm(place));

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
async function recognize(dataUrl, room, place) {
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
              raum: { type: 'string', description: 'Vermuteter Raum, z. B. "Küche", "Bad", "Garage"' },
              ort: { type: 'string', description: 'Kurze Bezeichnung des Behälters/Orts, z. B. "Besteckschublade", "Werkzeugkiste"' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Kurzer deutscher Name, z. B. "Schere"' },
                    anzahl: { type: 'integer' },
                    suchbegriffe: { type: 'array', items: { type: 'string' }, description: 'Synonyme, Oberbegriffe, österr. Begriffe (z. B. Klebeband → Tixo, Tesa)' }
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
            { type: 'text', text: `Foto aus dem Haushalt (Raum: ${room || 'unbekannt'}, Ort: ${place || 'unbekannt'}). Liste jeden erkennbaren Gegenstand einzeln auf Deutsch auf, möglichst konkret (z. B. "AA-Batterien" statt "Batterien"). Gleiche Gegenstände zusammenfassen mit Anzahl. Den Behälter/das Möbel selbst nicht als Gegenstand aufzählen, sondern als "ort" benennen.` }
          ]
        }]
      })
    });
  } catch {
    throw new Error('Keine Internetverbindung – Foto wird gemerkt und später erkannt.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `API-Fehler ${r.status}`);
  const inp = j.content?.find(c => c.type === 'tool_use')?.input || {};
  return {
    raum: (inp.raum || '').trim(),
    ort: (inp.ort || '').trim(),
    items: (inp.items || []).filter(i => i?.name).map(i => ({
      name: i.anzahl > 1 ? `${i.name} (${i.anzahl}×)` : i.name,
      tags: i.suchbegriffe || []
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
  if (v === 'settings') { $('apikey').value = settings.key; $('model').value = settings.model; }
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => show(b.dataset.v));

// ---------- Suche ----------
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
    else return 0;
  }
  return s;
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
  const pending = spots.filter(s => s.status === 'pending').length;
  const pendNote = pending ? `<div class="status">⏳ ${pending} Foto(s) warten auf Erkennung. <a href="#" id="retry-link">Jetzt erkennen</a></div>` : '';
  if (!spots.length) {
    el.innerHTML = `<div class="card"><b>Noch nichts erfasst.</b><p class="muted">Tippe unten auf 📷 Foto, wähle einen Raum und fotografiere eine Lade nach der anderen. Mit ⚡ Automatik wird jedes Foto sofort erkannt und gespeichert – die Ladennummer zählt automatisch weiter.</p></div>`;
    return;
  }
  if (!q) {
    const n = spots.reduce((a, s) => a + s.items.length, 0);
    const recent = [...spots].sort((a, b) => b.updated - a.updated).slice(0, 5);
    el.innerHTML = `${pendNote}<p class="muted">${n} Gegenstände an ${spots.length} Orten erfasst. Oben eintippen oder 🎤 antippen.</p>
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
  el.innerHTML = pendNote + (hits.length ? hits.slice(0, 50).map(h => `
    <div class="card hit">
      ${thumb(h.sp)}
      <div>
        <div>${hl(h.it.name, q)}</div>
        <div class="path">📍 ${esc(h.sp.room)} → ${esc(h.sp.place)}</div>
      </div>
    </div>`).join('') : `<div class="card">Nichts gefunden für „${esc(q)}“.</div>`);
}
$('q').addEventListener('input', () => show('search'));
$('results').onclick = e => {
  if (e.target.id === 'retry-link') { e.preventDefault(); retryPending(true); return; }
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
    id: existing?.id || uid(), room: existing?.room || finalRoom, place: existing?.place || finalPlace,
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
    id: existing?.id || uid(), room, place, photo: draft.photo ?? existing?.photo ?? null,
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
  const spots = (await allSpots()).sort((a, b) => a.room.localeCompare(b.room) || a.place.localeCompare(b.place, 'de', { numeric: true }));
  if (!spots.length) { $('room-list').innerHTML = '<p class="muted">Noch keine Räume erfasst.</p>'; return; }
  const byRoom = {};
  for (const s of spots) (byRoom[s.room] ||= []).push(s);
  $('room-list').innerHTML = Object.entries(byRoom).map(([room, list]) => `
    <h2>🏠 ${esc(room)} <span class="muted">(${list.length})</span></h2>
    ${list.map(s => `
      <details class="card" id="spot-${esc(s.id)}">
        <summary>📦 ${esc(s.place)} <span class="muted">· ${s.status === 'pending' ? '⏳ wartet auf Erkennung' : s.items.length + ' Gegenstände'}</span></summary>
        ${s.photo ? `<img class="preview" src="${s.photo}" alt="" style="margin-top:10px">` : ''}
        <div class="chips">${s.items.map(i => `<span class="chip">${esc(i.name)}</span>`).join('')}</div>
        <p class="muted">Aktualisiert: ${new Date(s.updated).toLocaleString('de-AT')}</p>
        <div class="row">
          <button class="ghost" data-edit="${esc(s.id)}">✏️ Bearbeiten / neues Foto</button>
          <button class="danger" data-del="${esc(s.id)}" style="flex:none">🗑️</button>
        </div>
      </details>`).join('')}`).join('');
}
$('room-list').onclick = async e => {
  const { edit, del } = e.target.dataset;
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
  toast('Gespeichert.');
  retryPending();
};
$('btn-export').onclick = async () => {
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

// ---------- Start ----------
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
renderSearch();
renderDraftItems();
retryPending();
