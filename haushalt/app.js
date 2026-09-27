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
const settings = {
  get key() { try { return localStorage.getItem('apikey') || ''; } catch { return ''; } },
  get model() { try { return localStorage.getItem('model') || 'claude-haiku-4-5-20251001'; } catch { return 'claude-haiku-4-5-20251001'; } },
  save(k, m) { try { localStorage.setItem('apikey', k); localStorage.setItem('model', m); } catch {} }
};

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
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

// ---------- Bilderkennung (Claude Vision) ----------
async function recognize(dataUrl, room, place) {
  const key = settings.key;
  if (!key) throw new Error('Kein API-Schlüssel – bitte unter ⚙️ eintragen oder Gegenstände manuell ergänzen.');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
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
          required: ['items']
        }
      }],
      tool_choice: { type: 'tool', name: 'inhalt_speichern' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] } },
          { type: 'text', text: `Foto aus dem Haushalt (Raum: ${room || '?'}, Ort: ${place || '?'}). Liste jeden erkennbaren Gegenstand einzeln auf Deutsch auf, möglichst konkret (z. B. "AA-Batterien" statt "Batterien"). Gleiche Gegenstände zusammenfassen mit Anzahl. Keine Möbel/Behälter selbst aufzählen.` }
        ]
      }]
    })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `API-Fehler ${r.status}`);
  const tu = j.content?.find(c => c.type === 'tool_use');
  return (tu?.input?.items || []).map(i => ({
    name: i.anzahl > 1 ? `${i.name} (${i.anzahl}×)` : i.name,
    tags: i.suchbegriffe || []
  }));
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
function score(q, spot, item) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const name = norm(item.name), tags = (item.tags || []).map(norm).join(' ');
  const ctx = norm(spot.room + ' ' + spot.place);
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
    out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
  }
  return out;
}
async function renderSearch() {
  const q = $('q').value.trim(), spots = await allSpots(), el = $('results');
  if (!spots.length) {
    el.innerHTML = `<div class="card"><b>Noch nichts erfasst.</b><p class="muted">Tippe unten auf 📷 Foto, wähle Raum und Ort (z. B. „Küche“ / „Lade links“) und fotografiere den Inhalt. Die App erkennt die Gegenstände automatisch – danach findest du alles hier über die Suche.</p></div>`;
    return;
  }
  if (!q) {
    const n = spots.reduce((a, s) => a + s.items.length, 0);
    el.innerHTML = `<p class="muted">${n} Gegenstände an ${spots.length} Orten erfasst. Einfach oben eintippen, was du suchst.</p>`;
    return;
  }
  const hits = [];
  for (const sp of spots) for (const it of sp.items) {
    const s = score(q, sp, it);
    if (s) hits.push({ s, sp, it });
  }
  hits.sort((a, b) => b.s - a.s);
  el.innerHTML = hits.length ? hits.slice(0, 50).map(h => `
    <div class="card hit">
      ${h.sp.photo ? `<img src="${h.sp.photo}" alt="" data-open="${h.sp.id}">` : '<div class="thumb"></div>'}
      <div>
        <div>${hl(h.it.name, q)}</div>
        <div class="path">📍 ${esc(h.sp.room)} → ${esc(h.sp.place)}</div>
      </div>
    </div>`).join('') : `<div class="card">Nichts gefunden für „${esc(q)}“.</div>`;
}
$('q').addEventListener('input', () => { show('search'); });

// ---------- Foto aufnehmen ----------
let draft = null; // { id?, photo, items }
async function fillLists() {
  const spots = await allSpots();
  const rooms = [...new Set(spots.map(s => s.room))].sort();
  $('rooms').innerHTML = rooms.map(r => `<option value="${esc(r)}">`).join('');
  const places = [...new Set(spots.filter(s => s.room === $('room').value).map(s => s.place))].sort();
  $('places').innerHTML = places.map(p => `<option value="${esc(p)}">`).join('');
}
$('room').addEventListener('change', fillLists);
$('btn-cam').onclick = () => $('f-cam').click();
$('btn-file').onclick = () => $('f-file').click();
for (const id of ['f-cam', 'f-file']) $(id).onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (f) await handlePhoto(f);
};

async function handlePhoto(file) {
  const photo = await shrink(file);
  draft = { ...(draft?.id ? { id: draft.id } : {}), photo, items: draft?.items || [] };
  $('prev-img').classList.remove('hidden');
  $('prev-img').src = photo;
  renderDraftItems();
  const st = $('add-status');
  st.classList.remove('hidden');
  st.textContent = '🔎 Erkenne Gegenstände …';
  $('btn-save').disabled = true;
  try {
    const items = await recognize(photo, $('room').value, $('place').value);
    const known = new Set(draft.items.map(i => norm(i.name)));
    draft.items.push(...items.filter(i => !known.has(norm(i.name))));
    st.textContent = `✅ ${items.length} Gegenstände erkannt. Prüfen, ergänzen, speichern.`;
  } catch (err) {
    st.textContent = '⚠️ ' + err.message;
  }
  $('btn-save').disabled = false;
  renderDraftItems();
}
function renderDraftItems() {
  $('add-items').innerHTML = (draft?.items || []).map((it, i) =>
    `<span class="chip">${esc(it.name)} <b data-rm="${i}">✕</b></span>`).join('') || '<span class="muted">– noch keine –</span>';
}
$('add-items').onclick = e => {
  const i = e.target.dataset.rm;
  if (i !== undefined) { draft.items.splice(+i, 1); renderDraftItems(); }
};
function addManual() {
  const v = $('add-manual').value.trim();
  if (!v) return;
  draft ||= { photo: null, items: [] };
  draft.items.push({ name: v, tags: [] });
  $('add-manual').value = '';
  renderDraftItems();
}
$('btn-add-manual').onclick = addManual;
$('add-manual').addEventListener('keydown', e => { if (e.key === 'Enter') addManual(); });

$('btn-save').onclick = async () => {
  const room = $('room').value.trim(), place = $('place').value.trim();
  if (!room || !place) return alert('Bitte Raum und Ort angeben.');
  if (!draft?.items.length) return alert('Keine Gegenstände – bitte ergänzen.');
  await putSpot({
    id: draft.id || (crypto.randomUUID?.() || String(Date.now() + Math.random())),
    room, place, photo: draft.photo, items: draft.items, updated: Date.now()
  });
  draft = null;
  $('prev-img').classList.add('hidden');
  renderDraftItems();
  $('add-status').classList.add('hidden');
  $('place').value = '';
  show('rooms');
};

// ---------- Räume ----------
async function renderRooms() {
  const spots = (await allSpots()).sort((a, b) => a.room.localeCompare(b.room) || a.place.localeCompare(b.place));
  if (!spots.length) { $('room-list').innerHTML = '<p class="muted">Noch keine Räume erfasst.</p>'; return; }
  const byRoom = {};
  for (const s of spots) (byRoom[s.room] ||= []).push(s);
  $('room-list').innerHTML = Object.entries(byRoom).map(([room, list]) => `
    <h2>🏠 ${esc(room)} <span class="muted">(${list.length})</span></h2>
    ${list.map(s => `
      <details class="card" id="spot-${esc(s.id)}">
        <summary>📦 ${esc(s.place)} <span class="muted">· ${s.items.length} Gegenstände</span></summary>
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
  const spots = await allSpots();
  if (del) {
    const s = spots.find(x => x.id === del);
    if (confirm(`„${s.room} → ${s.place}“ wirklich löschen?`)) { await delSpot(del); renderRooms(); }
  } else if (edit) {
    const s = spots.find(x => x.id === edit);
    draft = { id: s.id, photo: s.photo, items: [...s.items] };
    show('add');
    $('room').value = s.room; $('place').value = s.place;
    $('prev-img').classList.toggle('hidden', !s.photo);
    $('prev-img').src = s.photo || '';
    $('add-status').classList.add('hidden');
    renderDraftItems();
  }
};
$('results').onclick = e => {
  const id = e.target.dataset.open;
  if (!id) return;
  show('rooms');
  setTimeout(() => { const d = document.getElementById('spot-' + id); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth' }); } }, 50);
};

// ---------- Einstellungen / Sicherung ----------
$('btn-save-settings').onclick = () => { settings.save($('apikey').value.trim(), $('model').value); alert('Gespeichert.'); };
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
    for (const s of data) if (s.id && s.room && s.place && Array.isArray(s.items)) await putSpot(s);
    alert(`${data.length} Orte importiert.`);
  } catch { alert('Ungültige Sicherungsdatei.'); }
};

// ---------- Start ----------
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
renderSearch();
renderDraftItems();
