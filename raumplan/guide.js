'use strict';
/* Raumplan – Schritt-für-Schritt-Anleitung (öffnet sich beim ersten Start, danach über „? Anleitung“). */
(() => {
  const GKEY = 'raumplan-guide';
  const sketch = `<svg viewBox="0 0 320 210" class="gsk" role="img" aria-label="Skizze: Raum mit Zollstock, zwei Bodenblättern und einem Blatt je Wand">
    <rect x="10" y="10" width="300" height="190" fill="none" stroke="currentColor" stroke-width="6"/>
    <line x1="70" y1="120" x2="250" y2="120" stroke="#e0a800" stroke-width="7"/>
    <text x="160" y="112" font-size="11" text-anchor="middle" fill="currentColor">Zollstock 2 m</text>
    ${[[70, '0 cm'], [250, '200 cm']].map(([x, t]) => `<rect x="${x - 16}" y="124" width="32" height="44" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="${x - 7}" y="128" width="14" height="14" fill="#000"/><rect x="${x - 7}" y="150" width="14" height="14" fill="#000"/><text x="${x}" y="182" font-size="10" text-anchor="middle" fill="currentColor">${t}</text>`).join('')}
    ${[[160, 18, 0], [302, 105, 1], [160, 192, 0], [18, 105, 1]].map(([x, y, r]) => `<rect x="${x - (r ? 5 : 16)}" y="${y - (r ? 16 : 5)}" width="${r ? 10 : 32}" height="${r ? 32 : 10}" fill="#e0672b"/>`).join('')}
    <text x="160" y="45" font-size="11" text-anchor="middle" fill="#e0672b">■ 1 Blatt je Wand</text>
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
    { t: 'Genauer: Blätter drucken', h: `<p class="hint">Optional – nur wenn ±1–2 cm nicht reichen.</p>
      <p>Die App erkennt gedruckte <b>Zielmarken</b> (schwarze Quadrate) auf den Bildern und berechnet daraus die Maße auf wenige Millimeter.</p>
      <ul><li><b>2 Bodenblätter</b> – je eines für jedes Ende des Zollstocks.</li><li><b>1 Blatt pro Wand</b> – bei einem normalen Raum 4 Blätter.</li><li>Mit <b>100 % / Originalgröße</b> drucken. Nichts ausschneiden.</li><li><b>Kontrolle:</b> Auf einem Blatt die Linie 0–15 mit dem Zollstock nachmessen. Genau 150 mm? Passt. Sonst den gemessenen Wert unter „Kontrolllinie gemessen“ eintragen.</li></ul>`,
      b: [['🖨 Blätter drucken', 'wsheets'], ['Weiter ›', 'next', 1]] },
    { t: 'Blätter auslegen', h: `${sketch}
      <ol><li><b>Zollstock</b> ganz aufklappen und gerade auf den Boden legen.</li><li><b>Bodenblätter einmal herrichten:</b> Zollstock auf den grauen Streifen legen (Kanten auf die Linien), Anfang bzw. Ende genau auf die senkrechte Linie, Blatt von unten ankleben. Beide Blätter auf derselben Seite. Bleiben dauerhaft dran.</li><li>An <b>jede Wand ein Blatt</b> kleben (2 Klebestreifen), Mitte ca. 1,3 m hoch, nicht hinter Möbeln.</li></ol>
      <p class="hint">Ca. 1 Minute. Schiefe Altbauwand? Dann ein zweites Blatt an dieselbe Wand, nahe der anderen Ecke.</p>`,
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
    else if (a === 'wsheets') $('#pgWallSheets').click();
    else { const sel = { live: '#liveOpen', files: '#pgFile', run: '#pgRun', ar: '#arOpen' }[a]; close(); showTab('auf'); if (sel) $(sel).click(); }
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  $('#helpBtn').onclick = () => open(0);
  let seen = null; try { seen = localStorage.getItem(GKEY); } catch (e) { }
  if (!seen) open(0);
})();
