/*
 * KI-Vorschläge für BauKG-Protokolle
 *
 * Vorschaufenster mit Eingabefeld oben:
 *  - Steht Text im Eingabefeld, wird dieser Text für die KI-Antwort verwendet.
 *  - Ist das Feld leer, analysiert die KI das Foto.
 * Die Antwort besteht immer aus genau 3 Sätzen.
 *
 * Verwendung:
 *   KiVorschlag.open(fotoDataUrl, (text) => { ... });   // text = übernommener Vorschlag
 * Endpoint konfigurierbar über window.KI_ENDPOINT (Default: '/api/ki-vorschlag').
 */
(function (global) {
  'use strict';

  const SATZ_ANZAHL = 3;

  let overlay, promptInput, bildEl, ergebnisEl, statusEl, holenBtn, uebernehmenBtn;
  let aktuellesFoto = null;
  let onUebernehmen = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'ki-overlay';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="ki-fenster" role="dialog" aria-modal="true" aria-label="KI-Vorschlag">',
      '  <input class="ki-prompt" type="text" placeholder="Optionaler Hinweis für die KI – leer lassen, um das Foto zu analysieren" aria-label="Hinweis für die KI">',
      '  <div class="ki-vorschau"><img class="ki-bild" alt="Foto zum Mangel"></div>',
      '  <p class="ki-status" aria-live="polite"></p>',
      '  <div class="ki-ergebnis" aria-live="polite"></div>',
      '  <div class="ki-aktionen">',
      '    <button type="button" class="ki-btn ki-abbrechen">Abbrechen</button>',
      '    <button type="button" class="ki-btn ki-holen">Vorschlag erstellen</button>',
      '    <button type="button" class="ki-btn ki-primaer ki-uebernehmen" disabled>Übernehmen</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    promptInput = overlay.querySelector('.ki-prompt');
    bildEl = overlay.querySelector('.ki-bild');
    ergebnisEl = overlay.querySelector('.ki-ergebnis');
    statusEl = overlay.querySelector('.ki-status');
    holenBtn = overlay.querySelector('.ki-holen');
    uebernehmenBtn = overlay.querySelector('.ki-uebernehmen');

    holenBtn.addEventListener('click', vorschlagHolen);
    uebernehmenBtn.addEventListener('click', uebernehmen);
    overlay.querySelector('.ki-abbrechen').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (!overlay.hidden && e.key === 'Escape') close();
    });
  }

  /* Antwort der KI auf genau 3 Sätze kürzen bzw. begrenzen. */
  function aufDreiSaetze(text) {
    const saetze = String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .match(/[^.!?]+[.!?]*/g) || [];
    return saetze
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, SATZ_ANZAHL)
      .map((s) => (/[.!?]$/.test(s) ? s : s + '.'))
      .join(' ');
  }

  async function vorschlagHolen() {
    const hinweis = promptInput.value.trim();
    const modus = hinweis ? 'text' : 'foto';

    if (modus === 'foto' && !aktuellesFoto) {
      statusEl.textContent = 'Kein Foto vorhanden – bitte einen Hinweis eingeben.';
      return;
    }

    setLaden(true);
    statusEl.textContent = modus === 'text'
      ? 'KI formuliert aus dem eingegebenen Text …'
      : 'KI analysiert das Foto …';

    try {
      const antwort = await anfrage({
        modus: modus,
        text: hinweis,
        foto: modus === 'foto' ? aktuellesFoto : null,
        saetze: SATZ_ANZAHL
      });
      const text = aufDreiSaetze(antwort);
      ergebnisEl.textContent = text;
      uebernehmenBtn.disabled = !text;
      statusEl.textContent = '';
    } catch (err) {
      ergebnisEl.textContent = '';
      uebernehmenBtn.disabled = true;
      statusEl.textContent = 'Fehler: ' + (err && err.message ? err.message : 'KI nicht erreichbar.');
    } finally {
      setLaden(false);
    }
  }

  /* Ruft den KI-Endpoint auf. Erwartet JSON mit { text: "..." }. */
  async function anfrage(payload) {
    const endpoint = global.KI_ENDPOINT || '/api/ki-vorschlag';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Serverantwort ' + res.status);
    const daten = await res.json();
    return daten.text || daten.antwort || '';
  }

  function setLaden(laden) {
    holenBtn.disabled = laden;
    promptInput.disabled = laden;
  }

  function uebernehmen() {
    const text = ergebnisEl.textContent.trim();
    if (!text) return;
    if (typeof onUebernehmen === 'function') onUebernehmen(text);
    close();
  }

  function open(fotoDataUrl, callback) {
    if (!overlay) build();
    aktuellesFoto = fotoDataUrl || null;
    onUebernehmen = callback || null;

    bildEl.src = aktuellesFoto || '';
    bildEl.hidden = !aktuellesFoto;
    promptInput.value = '';
    ergebnisEl.textContent = '';
    statusEl.textContent = '';
    uebernehmenBtn.disabled = true;

    overlay.hidden = false;
    promptInput.focus();
  }

  function close() {
    if (overlay) overlay.hidden = true;
    aktuellesFoto = null;
    onUebernehmen = null;
  }

  global.KiVorschlag = { open: open, close: close, aufDreiSaetze: aufDreiSaetze };
})(window);
