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
    { t: 'Willkommen', h: `<p>Mit dieser App machst du aus einem kurzen Handy-Video einen <b>maßgenauen Grundriss</b> (±1–5 mm) für den Einreichplan.</p>
      <p><b>So geht es:</b></p><ol><li><b>Blätter hinlegen</b>: Zollstock mit 2 Bodenblättern auf den Boden, an jede Wand ein Blatt (ca. 1 Minute).</li><li><b>Raum filmen</b>: mit dem Handy herumgehen – die App sagt dir, wohin, und macht die Bilder selbst (1–2 Minuten).</li><li><b>Fertig</b>: Die App rechnet von selbst und zeichnet den Raum in den Plan.</li></ol>
      <p><b>Du brauchst:</b> Drucker (einmalig), Zollstock 2 m, Klebeband, Android-Handy mit Chrome.</p>`,
      b: [['Beispiel ansehen', 'demo'], ['Los geht’s ›', 'next', 1]] },
    { t: 'Blätter drucken (einmalig)', h: `<ul><li><b>2 Bodenblätter</b> – kommen dauerhaft unter den Zollstock.</li><li><b>1 Blatt pro Wand</b> – für einen normalen Raum 4 Blätter.</li><li>Mit <b>100 % / Originalgröße</b> drucken, nichts ausschneiden.</li><li><b>Kontrolle:</b> Auf einem Blatt die Linie 0–15 nachmessen. Genau 150 mm? Passt. Sonst den Wert unter „Kontrolllinie gemessen“ eintragen.</li></ul>
      <p><b>Zollstock herrichten (einmalig):</b> Zollstock auf den grauen Streifen der Bodenblätter legen, Anfang bzw. Ende genau auf die senkrechte Linie, Blätter von unten ankleben – beide auf derselben Seite.</p>`,
      b: [['🖨 Blätter drucken', 'wsheets'], ['Weiter ›', 'next', 1]] },
    { t: 'Blätter auslegen', h: `${sketch}
      <ol><li><b>Zollstock</b> ganz aufklappen und flach auf den Boden legen, irgendwo frei im Raum.</li><li>An <b>jede Wand ein Blatt</b> kleben (2 Klebestreifen), Mitte ca. 1,3 m hoch, nicht hinter Möbeln. Welches Blatt an welche Wand, ist egal.</li></ol>
      <p class="hint">Schiefe oder sehr lange Wand? Dann ein zweites Blatt an diese Wand (mehr Blätter drucken: Feld „Erwartete Wände“ erhöhen).</p>`,
      b: [['Weiter ›', 'next', 1]] },
    { t: 'Raum filmen', h: `<p>Tippe auf <b>📹 Raum aufnehmen</b>. Dann:</p>
      <ul><li><b>Herumgehen ist erwünscht!</b> Die App braucht jedes Blatt aus mindestens zwei Richtungen. Abstand 1–3 m.</li><li><b>Nicht zoomen</b> – der Weitwinkel ist richtig. Lieber näher hingehen.</li><li><b>Langsam schwenken.</b> Du musst nichts auslösen: Sobald das Bild ruhig ist und etwas Neues zeigt, macht die App selbst ein Bild (kurzes Vibrieren).</li></ul>
      <p><b>Die Balken unten</b> zeigen je Blatt den Fortschritt: <span style="color:#c62828">rot</span> = noch nicht gesehen, <span style="color:#b8860b">gelb</span> = teilweise, <span style="color:#2e7d32">grün ✓</span> = fertig. ◀ ● ▶ zeigt, aus welchen Richtungen das Blatt schon gefilmt ist. Oben steht immer, was als Nächstes zu tun ist.</p>
      <p>Sind alle Balken grün, startet die Auswertung <b>von selbst</b>.</p>`,
      b: [['📹 Raum aufnehmen', 'live'], ['Weiter ›', 'next', 1]] },
    { t: 'Ergebnis', h: `<p>Die App rechnet 1–3 Minuten (Bildschirm anlassen). Dann siehst du jede Wand mit Länge und Genauigkeit, z. B. <b>4,215 m ± 2 mm</b>. Passt alles, kommt der Raum <b>automatisch in den Plan</b>.</p>
      <p>Ist eine Wand <span style="color:#c62828">rot</span> oder klappt die Auswertung nicht, steht dabei, was zu tun ist – meist: noch einmal filmen und dabei mehr Bilder mit <b>zwei Blättern gleichzeitig</b> (in den Ecken) machen.</p>`,
      b: [['Weiter ›', 'next', 1]] },
    { t: 'Plan und Einreichung', h: `<p><b>3 Plan</b>: Räume antippen, um Namen, Fenster, Türen und Wandstärken einzutragen. Ziehen verschiebt einen Raum. „Plan leeren“ löscht alles.</p>
      <p><b>4 Einreichung</b>: Plankopf ausfüllen und als <b>PDF</b>, <b>DXF</b> (CAD) oder Aufmaßprotokoll ausgeben.</p>
      <p class="hint">Den Einreichplan muss in Österreich in der Regel ein Baumeister oder Architekt als Planverfasser unterschreiben.</p>`,
      b: [['Fertig', 'close'], ['Ohne Blätter? ›', 'next']] },
    { t: 'Ohne Blätter: AR-Messung', h: `<p>Schnell, aber ungenauer (±1–2 cm): <b>📱 AR-Aufmaß starten</b>, Kreis auf eine Wand richten (über den Möbeln), je Wand 2–3 Mal <b>Punkt</b> tippen, dann <b>Nächste Wand</b>, rundherum. Zum Schluss <b>✔ Fertig</b>.</p>
      <p class="hint">Braucht ein Android-Handy mit ARCore.</p>`,
      b: [['📱 AR starten', 'ar'], ['Fertig', 'close', 1]] }
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
    else if (a === 'sheet') $('#pgSheet').click();
    else if (a === 'wsheets') $('#pgWallSheets').click();
    else { const sel = { live: '#liveOpen', files: '#pgFile', run: '#pgRun', ar: '#arOpen' }[a]; close(); showTab('auf'); if (sel) $(sel).click(); }
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  $('#helpBtn').onclick = () => open(0);
  let seen = null; try { seen = localStorage.getItem(GKEY); } catch (e) { }
  if (!seen) open(0);
})();
