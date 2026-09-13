/**
 * Das Absenden der Bestellung — Gate 26, 4. September 2026.
 *
 * **Diese Datei geht nur ins Bündel, wenn der Bestellweg eingeschaltet ist.**
 * Das ist keine Sparsamkeit, sondern die Bedingung einer Zusage: Die
 * Datenschutzseite sagt, solange der Weg aus ist, dass nichts an den Server
 * übertragen wird — und `npm run pruefe-datenschutz` misst das am **Bündel**,
 * indem es nach `fetch(`, `XMLHttpRequest`, `sendBeacon` und Verwandten sucht.
 *
 * > **Ein schlafendes `fetch(` im Bündel machte die Zusage von einer Tatsache
 * > zu einer Behauptung über den Kontrollfluss.** Wer sie prüfen will, müsste
 * > dann beweisen, dass eine Bedingung nie wahr wird — und das kann kein
 * > Textprüfer.
 *
 * Der erste Wurf hatte das `fetch` in `shop-ui.js`. Der Prüfer hat es beim
 * ersten Lauf gemeldet, und er hatte recht.
 */
window.bestellSenden = function (ziel, angaben, fertig) {
  fetch(ziel, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(angaben)
  }).then(function (r) {
    return r.json();
  }).then(fertig).catch(function () {
    // Ein abgerissener Aufruf ist für den Kunden dasselbe wie eine Absage:
    // Er weiß nicht, ob die Bestellung angekommen ist. Deshalb dieselbe
    // Rückmeldung wie bei einer Ablehnung — und der Kopiertext steht darüber.
    fertig({ ok: false });
  });
};
