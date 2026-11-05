'use strict';
/* Raumplan – Schritt-für-Schritt-Anleitung (öffnet sich beim ersten Start, danach über „? Anleitung“). */
(() => {
  const GKEY = 'raumplan-guide';
  // Skizze: Raum von oben, Zollstock am Boden, Ecken 1–4 werden im Kamerabild angepeilt
  const sketch = `<svg viewBox="0 0 320 210" class="gsk" role="img" aria-label="Skizze: Raum von oben mit Zollstock am Boden und den vier Ecken">
    <rect x="10" y="10" width="300" height="190" fill="none" stroke="currentColor" stroke-width="6"/>
    <line x1="90" y1="125" x2="230" y2="125" stroke="#e0a800" stroke-width="8"/>
    <text x="160" y="115" font-size="11" text-anchor="middle" fill="currentColor">Zollstock 2 m (am Boden)</text>
    ${[[18, 18, 1], [302, 18, 2], [302, 192, 3], [18, 192, 4]].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="11" fill="#e0672b"/><text x="${x}" y="${y + 4}" font-size="11" font-weight="700" text-anchor="middle" fill="#fff">${n}</text>`).join('')}
    <text x="160" y="60" font-size="11" text-anchor="middle" fill="#e0672b">● Ecken unten anpeilen, der Reihe nach</text>
  </svg>`;
  const steps = [
    { t: 'Willkommen', h: `<p>Mit dieser App misst du einen Raum mit dem Handy aus und bekommst einen <b>maßstäblichen Grundriss</b> für den Einreichplan.</p>
      <p><b>So geht es:</b></p><ol><li><b>Zollstock</b> ganz ausgeklappt auf den Boden legen.</li><li><b>„📹 Raum messen“</b> tippen: zuerst den Zollstock filmen, dann jede <b>Ecke unten</b> anpeilen und „Ecke“ tippen, zuletzt die Decke.</li><li><b>Fertig</b>: Die App rechnet und zeichnet den Raum in den Plan.</li></ol>
      <p><b>Du brauchst:</b> Zollstock 2 m und ein Android-Handy mit Chrome und ARCore („Google Play-Dienste für AR“). Kein Drucker, nichts kleben.</p>`,
      b: [['Beispiel ansehen', 'demo'], ['Los geht’s ›', 'next', 1]] },
    { t: 'Raum messen', h: `${sketch}
      <ol><li><b>Zollstock</b>: Handy auf den Zollstock richten, 1–2 m Abstand. Die App erkennt ihn selbst und nimmt ihn als Maßstab. Wird er nicht erkannt: Kreis auf Anfang bzw. Ende richten und „Punkt“ tippen.</li>
      <li><b>Ecken</b>: Den Kreis genau auf eine Raumecke <b>unten</b> (Boden/Wand) richten und „📍 Ecke“ tippen. So rundherum, zum Schluss wieder auf die erste Ecke – dann ist der Raum geschlossen.</li>
      <li><b>Decke</b>: Kreis auf die Kante Wand/Decke richten und „📍 Decke“ tippen – das ist die Raumhöhe.</li></ol>
      <p><b>Oben im Bild</b> steht laufend die Genauigkeit in % (<span style="color:#2e7d32">grün</span> = gut) und was noch fehlt. Langsam bewegen, Möbel überspringen – die App sortiert sie aus.</p>`,
      b: [['📹 Raum messen', 'live'], ['Weiter ›', 'next', 1]] },
    { t: 'Ergebnis', h: `<p>Nach „✔ Fertig“ zeigt die App eine Skizze mit jeder Wandlänge und ihrer Genauigkeit, z. B. <b>4,21 m ± 8 mm</b>.</p>
      <ul><li><b>Kontrollmaß:</b> Eine lange Wand mit Maßband oder Laser nachmessen und eintragen – damit stimmt der Maßstab sicher.</li><li><b>Korrigieren:</b> Ein Maß antippen und eintippen oder ansagen (🎤).</li><li><b>Übernehmen:</b> Der Raum kommt in den Plan (Reiter „2 Ergebnis“).</li></ul>
      <p class="hint">Fenster und Türen: im Plan den Raum antippen → bei der Wand „+ Öffnung“.</p>`,
      b: [['Weiter ›', 'next', 1]] },
    { t: 'Plan und Export', h: `<p><b>Reiter „2 Ergebnis“</b>: Raum antippen, um Namen, Raumhöhe, Fenster, Türen und Wandstärken einzutragen. Ziehen verschiebt einen Raum. „🧊 3D“ und „✂ Schnitt“ zeigen den Raum räumlich.</p>
      <p><b>„📄 Plankopf &amp; Export“</b>: Plankopf ausfüllen und als <b>PDF</b>, <b>DXF</b> (CAD) oder Aufmaßprotokoll ausgeben. Das Projekt bleibt am Handy gespeichert.</p>
      <p class="hint">Den Einreichplan muss in Österreich in der Regel ein Baumeister oder Architekt als Planverfasser unterschreiben.</p>`,
      b: [['Fertig', 'close', 1], ['Andere Messarten ›', 'next']] },
    { t: 'Andere Messarten', h: `<p><b>Kein ARCore am Handy?</b> Oder soll es <b>millimetergenau</b> werden? Dann gibt es zwei Wege:</p>
      <ul><li><b>🎯 Mit Marken-Blättern</b> (±1–5 mm): gedruckte Blätter an die Wände kleben, Raum filmen, die App rechnet. Braucht einmalig einen Drucker. Zu finden unter „⚙️ Einstellungen“ im Reiter 1.</li>
      <li><b>Von Hand</b>: Breite und Tiefe eintippen, „+ Rechteckraum“ im Reiter 2 – Wände und Winkel dann im Raum anpassen.</li></ul>
      <p class="hint">Die Kamera-Kalibrierung (unter Einstellungen) macht nur die Marken-Messung genauer; für den Zollstock-Weg ist sie nicht nötig.</p>`,
      b: [['🎯 Mit Marken messen', 'mk'], ['Fertig', 'close', 1]] }
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
    [a, b].forEach(r => { r.demo = true; placeFree(r); S.rooms.push(r); });
    selRoom = S.rooms.length - 2; save(); close(); showTab('plan');
  }
  box.onclick = e => {
    const g = e.target.closest('[data-go]'); if (g) { i = +g.dataset.go; return render(); }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'next') { i++; render(); }
    else if (a === 'back') { i--; render(); }
    else if (a === 'close') close();
    else if (a === 'demo') demo();
    else if (a === 'mk') { close(); showTab('auf'); const d = document.querySelector('#auf details.more'); if (d) d.open = true; $('#liveMk').click(); }
    else { const sel = { live: '#liveOpen', files: '#pgFile', run: '#pgRun', ar: '#arOpen' }[a]; close(); showTab('auf'); if (sel) $(sel).click(); }
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  $('#helpBtn').onclick = () => open(0);
  let seen = null; try { seen = localStorage.getItem(GKEY); } catch (e) { }
  if (!seen) open(0);
})();
