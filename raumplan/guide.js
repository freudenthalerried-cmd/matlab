'use strict';
/* Raumplan – Schritt-für-Schritt-Anleitung (öffnet sich beim ersten Start, danach über „? Anleitung“). */
(() => {
  const GKEY = 'raumplan-guide';
  const sketch = `<svg viewBox="0 0 320 210" class="gsk" role="img" aria-label="Skizze: Raum mit Zollstock und Marken">
    <rect x="10" y="10" width="300" height="190" fill="none" stroke="currentColor" stroke-width="6"/>
    <line x1="60" y1="150" x2="260" y2="150" stroke="#e0a800" stroke-width="7"/>
    <text x="160" y="176" font-size="11" text-anchor="middle" fill="currentColor">Zollstock am Boden</text>
    ${[[60, 150, '0'], [260, 150, '1'], [90, 70, '2'], [230, 70, '3']].map(([x, y, t]) => `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" fill="#fff" stroke="#000" stroke-width="3"/><text x="${x}" y="${y + 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#000">${t}</text>`).join('')}
    <text x="60" y="136" font-size="10" text-anchor="middle" fill="currentColor">0 cm</text><text x="260" y="136" font-size="10" text-anchor="middle" fill="currentColor">200 cm</text>
    ${[[60, 13], [160, 13], [260, 13], [13, 60], [13, 140], [307, 60], [307, 140], [110, 197], [210, 197]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#e0672b"/>`).join('')}
    <text x="160" y="40" font-size="11" text-anchor="middle" fill="#e0672b">■ Wandmarken: 3–4 je Wand</text>
  </svg>`;
  const steps = [
    { t: 'Willkommen', h: `<p>Mit dieser App misst du einen Raum in etwa <b>1 Minute</b> nur mit dem Handy auf – ohne Maßband, ohne Marken – und bekommst einen Grundriss für den Einreichplan.</p>
      <p><b>Du brauchst:</b> ein Android-Handy mit Chrome und ARCore (fast alle neueren Handys). Genauigkeit ca. ±1–2 cm.</p>
      <p class="hint">Für Millimeter-Genauigkeit gibt es zusätzlich den Weg mit gedruckten Zielmarken (am Ende der Anleitung).</p>`,
      b: [['Beispiel ansehen', 'demo'], ['Los geht’s ›', 'next', 1]] },
    { t: 'Raum mit AR messen', h: `<ol><li><b>📱 AR-Aufmaß starten</b> tippen und das Handy langsam bewegen, bis der Boden erkannt ist.</li>
      <li>Den <b>Kreis in der Mitte</b> auf eine Wand richten – über den Möbeln. Grün = Wand erkannt.</li>
      <li><b>Punkt</b> tippen, ein Stück die Wand entlang zielen, nochmal <b>Punkt</b>. 2–3 Punkte pro Wand, möglichst weit auseinander.</li>
      <li><b>Nächste Wand</b> tippen und der Reihe nach rundherum weitermachen.</li>
      <li>Optional: auf die <b>Decke</b> zielen (blau) und Punkt tippen – das ergibt die Raumhöhe.</li>
      <li><b>✔ Fertig</b> – die App berechnet Ecken, Winkel und Wandlängen und legt den Raum im Plan an.</li></ol>`,
      b: [['📱 AR-Aufmaß starten', 'ar'], ['Weiter ›', 'next', 1]] },
    { t: 'Plan und Einreichung', h: `<p><b>3 Plan</b>: Räume antippen, um Namen, Fenster, Türen und Wandstärken einzutragen. Ziehen verschiebt einen Raum – nebeneinander liegende Räume rasten ein.</p>
      <p><b>4 Einreichung</b>: Plankopf ausfüllen und als <b>PDF</b>, <b>DXF</b> (CAD) oder Aufmaßprotokoll ausgeben.</p>
      <p class="hint">Den Einreichplan muss in Österreich in der Regel ein Baumeister oder Architekt als Planverfasser unterschreiben.</p>`,
      b: [['Fertig', 'close'], ['Genauer mit Marken ›', 'next']] },
    { t: 'Genauer: Marken drucken', h: `<p class="hint">Optional – nur wenn ±1–2 cm nicht reichen.</p><p>Die App erkennt gedruckte <b>Zielmarken</b> (schwarze Quadrate mit Nummer) auf den Fotos und berechnet daraus die Maße.</p>
      <ul><li>Alles auf <b>einem A4-Blatt</b>: 16 Marken, je 4,5 cm groß. An den grauen Linien ausschneiden.</li><li><b>Marken 0–3</b> kommen auf den Boden, <b>Marken 4–15</b> an die Wände (3 pro Wand).</li><li>Beim Drucken <b>100 % / Originalgröße</b> wählen, nicht „an Seite anpassen“.</li></ul>
      <p class="hint">Mehrere Räume? Pro Raum andere Wand-Nummern drucken, z. B. Raum 2 „ab Nr. 20“. Die Felder dazu findest du unter „1 Aufnahme“.</p>`,
      b: [['🖨 1 Blatt drucken', 'sheet'], ['Weiter ›', 'next', 1]] },
    { t: 'Marken auslegen', h: `${sketch}
      <ol><li>Zollstock ganz aufklappen und gerade auf den Boden legen.</li><li><b>Marke 0</b> mit dem Mittelstrich auf <b>0 cm</b>, <b>Marke 1</b> auf <b>200 cm</b>.</li><li><b>Marken 2 und 3</b> irgendwo flach auf den Boden.</li><li><b>Wandmarken</b> glatt an die Wände kleben: 3 pro Wand, unterschiedliche Höhen (z. B. 0,8 / 1,2 / 1,7 m), nahe den Ecken.</li><li>Optional für die Raumhöhe: eine Wandmarke an die Decke.</li></ol>`,
      b: [['Weiter ›', 'next', 1]] },
    { t: 'Raum filmen', h: `<p>Tippe auf <b>📹 Raum aufnehmen</b> und film einfach den Raum. Du musst keine Fotos auslösen – die App fotografiert selbst, sobald du kurz ruhig hältst.</p>
      <ol><li>Stell dich in eine Ecke und dreh dich langsam: zuerst zum Boden mit den Marken 0–3, dann die Wände entlang.</li><li>Bei jeder neuen Stelle <b>kurz ruhig halten</b>, bis es kurz vibriert.</li><li>Dann in die nächste Ecke gehen und wiederholen.</li></ol>
      <p>Oben siehst du den Fortschritt und welche Marken noch fehlen. Wenn alle Marken grün ✓ sind, tippst du auf <b>✔ Fertig – auswerten</b>. Dauer: ca. 1–2 Minuten.</p>`,
      b: [['📹 Raum aufnehmen', 'live'], ['Weiter ›', 'next', 1]] },
    { t: 'Auswerten', h: `<p>Nach „Fertig“ startet die Auswertung von selbst. Das dauert je nach Handy 1–5 Minuten, der Bildschirm soll dabei an bleiben.</p>
      <p>Danach siehst du jede Wand mit Länge und Genauigkeit, z. B. <b>4,215 m ± 1 mm (0,02 %)</b>. Grün heißt: Genauigkeit passt.</p>
      <p>Mit <b>„In Plan übernehmen“</b> kommt der Raum in den Grundriss. Beim nächsten Raum geht es wieder bei „Marken auslegen“ los. Die App setzt die Räume über die Verbindungsmarken 90–93 im Türbereich automatisch zusammen.</p>`,
      b: [['▶ Jetzt auswerten', 'run'], ['Weiter ›', 'next', 1]] },
    { t: 'Fertig', h: `<p>Das war der genaue Weg mit Marken. Die Anleitung findest du jederzeit oben unter <b>? Anleitung</b>.</p>`, b: [['Fertig', 'close']] }
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
    else if (a === 'sheet') $('#pgSheet').click();
    else { const sel = { live: '#liveOpen', files: '#pgFile', run: '#pgRun', ar: '#arOpen' }[a]; close(); showTab('auf'); if (sel) $(sel).click(); }
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  $('#helpBtn').onclick = () => open(0);
  let seen = null; try { seen = localStorage.getItem(GKEY); } catch (e) { }
  if (!seen) open(0);
})();
