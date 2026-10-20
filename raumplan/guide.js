'use strict';
/* Raumplan – Schritt-für-Schritt-Anleitung (öffnet sich beim ersten Start, danach über „? Anleitung“). */
(() => {
  const GKEY = 'raumplan-guide';
  const sketch = `<svg viewBox="0 0 320 210" class="gsk" role="img" aria-label="Skizze: Raum mit Maßband und Marken">
    <rect x="10" y="10" width="300" height="190" fill="none" stroke="currentColor" stroke-width="6"/>
    <line x1="60" y1="150" x2="260" y2="150" stroke="#e0a800" stroke-width="7"/>
    <text x="160" y="176" font-size="11" text-anchor="middle" fill="currentColor">Maßband am Boden</text>
    ${[[60, 150, '0'], [260, 150, '1'], [90, 70, '2'], [230, 70, '3']].map(([x, y, t]) => `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="#fff" stroke="#000" stroke-width="3"/><text x="${x}" y="${y + 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#000">${t}</text>`).join('')}
    <text x="60" y="136" font-size="10" text-anchor="middle" fill="currentColor">0 cm</text><text x="260" y="136" font-size="10" text-anchor="middle" fill="currentColor">300 cm</text>
    ${[[60, 13], [160, 13], [260, 13], [13, 60], [13, 140], [307, 60], [307, 140], [110, 197], [210, 197]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#e0672b"/>`).join('')}
    <text x="160" y="40" font-size="11" text-anchor="middle" fill="#e0672b">■ Wandmarken: 3–4 je Wand</text>
  </svg>`;
  const steps = [
    { t: 'Willkommen', h: `<p>Mit dieser App machst du aus Handyfotos einen <b>maßgenauen Grundriss</b> (±1–3 mm) für den Einreichplan. Von Hand messen musst du nichts.</p>
      <p><b>Du brauchst:</b></p><ul><li>Drucker (A4)</li><li>1 Maßband (3 m)</li><li>Klebeband oder Malerkrepp</li><li>dieses Handy</li></ul>
      <p>Zeitaufwand pro Raum: ca. 10 Minuten Vorbereitung und 1 Minute fotografieren.</p>`,
      b: [['Beispiel ansehen', 'demo'], ['Los geht’s ›', 'next', 1]] },
    { t: 'Marken drucken', h: `<p>Die App erkennt gedruckte <b>Zielmarken</b> (schwarze Quadrate mit Nummer) auf den Fotos und berechnet daraus die Maße.</p>
      <ul><li><b>Marken 0–3</b> kommen auf den Boden.</li><li><b>Marken ab 4</b> kommen an die Wände (Standard: 16 Stück).</li><li>Beim Drucken <b>100 % / Originalgröße</b> wählen, nicht „an Seite anpassen“.</li></ul>
      <p class="hint">Mehrere Räume? Pro Raum andere Wand-Nummern drucken, z. B. Raum 2 „ab Nr. 20“. Die Felder dazu findest du unter „1 Aufnahme“.</p>`,
      b: [['🖨 Marken jetzt drucken', 'print'], ['Weiter ›', 'next', 1]] },
    { t: 'Marken auslegen', h: `${sketch}
      <ol><li>Maßband gerade am Boden auslegen.</li><li><b>Marke 0</b> mit der Mitte auf <b>0 cm</b>, <b>Marke 1</b> auf <b>300 cm</b>.</li><li><b>Marken 2 und 3</b> irgendwo flach auf den Boden.</li><li><b>Wandmarken</b> glatt an die Wände kleben: 3–4 pro Wand, unterschiedliche Höhen, nahe den Ecken.</li><li>Optional für die Raumhöhe: eine Wandmarke an die Decke.</li></ol>`,
      b: [['Weiter ›', 'next', 1]] },
    { t: 'Fotografieren', h: `<p>Stell dich nacheinander in <b>jede Raumecke</b> und mach dort 8–10 Fotos quer über den Raum. Einige Fotos sollen den Boden mit den Marken 0–3 zeigen.</p>
      <ul><li>Insgesamt ca. <b>40 Fotos</b>.</li><li>Handy bei jedem Foto <b>ruhig halten</b>.</li><li>Bei der <b>Live-Aufnahme</b> zeigt die App grün an, welche Marken schon gut erfasst sind. Orange heißt: noch öfter fotografieren.</li></ul>
      <p class="hint">Alternativ mit der normalen Kamera-App fotografieren und die Fotos danach auf einmal über „Fotos wählen“ laden.</p>`,
      b: [['📷 Live-Aufnahme starten', 'live'], ['📁 Fotos wählen', 'files'], ['Weiter ›', 'next', 1]] },
    { t: 'Auswerten', h: `<p>Tippe auf <b>▶ Auswerten</b>. Das dauert je nach Handy 1–5 Minuten, der Bildschirm soll dabei an bleiben.</p>
      <p>Danach siehst du jede Wand mit Länge und Genauigkeit, z. B. <b>4,215 m ± 1 mm (0,02 %)</b>. Grün heißt: Genauigkeit passt.</p>
      <p>Mit <b>„In Plan übernehmen“</b> kommt der Raum in den Grundriss. Beim nächsten Raum geht es wieder bei Schritt 3 los. Die App setzt die Räume über die Verbindungsmarken 90–93 im Türbereich automatisch zusammen.</p>`,
      b: [['▶ Jetzt auswerten', 'run'], ['Weiter ›', 'next', 1]] },
    { t: 'Plan und Einreichung', h: `<p><b>3 Plan</b>: Räume antippen, um Namen, Fenster, Türen und Wandstärken einzutragen. Ziehen verschiebt einen Raum.</p>
      <p><b>4 Einreichung</b>: Plankopf ausfüllen (Bauvorhaben, Adresse, Grundstück) und als <b>PDF</b>, <b>DXF</b> für CAD oder Aufmaßprotokoll ausgeben.</p>
      <p class="hint">Den Einreichplan muss in Österreich in der Regel ein Baumeister oder Architekt als Planverfasser unterschreiben.</p>
      <p>Diese Anleitung findest du jederzeit oben unter <b>? Anleitung</b>.</p>`,
      b: [['Fertig', 'close']] }
  ];
  let i = 0;
  const box = document.createElement('div');
  box.id = 'guide'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  document.body.appendChild(box);
  function render() {
    const s = steps[i];
    box.innerHTML = `<div class="gcard"><div class="ghead"><span class="gstep">Schritt ${i + 1} von ${steps.length}</span><button class="gx" data-a="close" aria-label="Schließen">✕</button></div>
      <div class="gdots">${steps.map((_, k) => `<button data-go="${k}" class="${k === i ? 'on' : k < i ? 'done' : ''}" aria-label="Schritt ${k + 1}"></button>`).join('')}</div>
      <h2>${s.t}</h2><div class="gbody">${s.h}</div>
      <div class="gbtns">${i > 0 ? '<button data-a="back">‹ Zurück</button>' : ''}<span class="sp"></span>${s.b.map(([l, a, p]) => `<button data-a="${a}" class="${p ? 'pri' : ''}">${l}</button>`).join('')}</div></div>`;
    box.querySelector('.gbody').scrollTop = 0;
  }
  function open(k = 0) { i = k; render(); box.hidden = false; }
  function close() { box.hidden = true; try { localStorage.setItem(GKEY, '1'); } catch (e) { } }
  function demo() {
    const a = newRoom('Wohnen (Beispiel)', rectSegs(4.5, 3.8), 0, 0), b = newRoom('Küche (Beispiel)', rectSegs(3.2, 3.8), 0, 0);
    [a, b].forEach(r => { placeFree(r); S.rooms.push(r); });
    selRoom = S.rooms.length - 2; save(); close(); showTab('plan');
  }
  box.onclick = e => {
    const g = e.target.closest('[data-go]'); if (g) { i = +g.dataset.go; return render(); }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'next') { i++; render(); }
    else if (a === 'back') { i--; render(); }
    else if (a === 'close') close();
    else if (a === 'demo') demo();
    else if (a === 'print') $('#pgPrint').click();
    else { const sel = { live: '#liveOpen', files: '#pgFile', run: '#pgRun' }[a]; close(); showTab('auf'); if (sel) $(sel).click(); }
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  $('#helpBtn').onclick = () => open(0);
  let seen = null; try { seen = localStorage.getItem(GKEY); } catch (e) { }
  if (!seen) open(0);
})();
