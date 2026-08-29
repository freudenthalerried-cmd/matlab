/**
 * Den Rechenkern zu einem Inline-Skript zusammenfügen.
 *
 * Herausgelöst aus `build-demo.mjs`, als der Shop denselben Kern brauchte.
 * Der Grundsatz bleibt der von dort:
 *
 * > **Der Rechenkern wird nicht nachgebaut, sondern eingebettet** — damit im
 * > Shop dieselbe Logik läuft, die die Tests prüfen. Eine zweite
 * > Preisrechnung im Frontend wäre die sicherste Art, unbemerkt falsche
 * > Preise anzuzeigen.
 *
 * Zwei Läufe haben hier je einen Fehler hinterlassen, und beide Schutzmaßnahmen
 * stehen unten im Code: das übersehene `export { … };` (Parserfehler beim Bau)
 * und die Namenskollision `EUR` (SyntaxError erst im Browser, Tests grün).
 */

/**
 * Import-Zeilen entfernen, Exporte entkleiden.
 *
 * Weitergereichte Namen (`export { a, b };`) fallen ersatzlos weg: Im
 * zusammengefügten Skript stehen sie ohnehin schon im selben Bereich. Ohne
 * diese Zeile blieb ein `export` im Nicht-Modul stehen, und der Bau brach mit
 * einem Parserfehler ab — gefunden, als `kostenbild.js` zum ersten Mal Namen
 * aus `skonto.js` weiterreichte.
 */
export const entkleide = (quelle) =>
  quelle
    .replace(/^import[^;]+;\s*$/gm, '')
    .replace(/^export \{[^}]*\};\s*$/gm, '')
    .replace(/^export (const|let|function|class|async function) /gm, '$1 ');

/**
 * Namenskollisionen im Bündel finden.
 *
 * Getrennte Module dürfen denselben Namen tragen; im zusammengefügten Skript
 * ist das ein SyntaxError, und dann läuft die ganze Seite nicht. Genau das ist
 * mit einer Hilfsfunktion namens `EUR` passiert — die Tests blieben grün, weil
 * sie die Module einzeln laden. Der Bauschritt muss es deshalb selbst merken.
 */
export function pruefeNamenskollisionen(quelle) {
  const gesehen = new Map();
  const doppelt = [];
  const muster = /^(?:const|let|var|class|async\s+function|function)\s+([A-Za-z_$][\w$]*)/gm;
  for (const treffer of quelle.matchAll(muster)) {
    const name = treffer[1];
    if (gesehen.has(name)) doppelt.push(name);
    else gesehen.set(name, true);
  }
  if (doppelt.length) {
    throw new Error(
      'Doppelt deklariert im Bündel: ' + [...new Set(doppelt)].join(', ') +
        '\nIm Modul harmlos, im zusammengefügten Skript ein SyntaxError.',
    );
  }
}

/** Reihenfolge der Module — Abhängigkeiten stehen vor ihren Nutzern. */
export const KERNMODULE = Object.freeze([
  'format.js', 'gebiet.js', 'preis.js', 'warenkorb.js', 'bedarf.js',
  'liefergebiet.js', 'kunde.js', 'messwert.js', 'rechtstexte.js',
  'bestellung.js', 'beleg.js', 'vorgang.js', 'auftragslauf.js', 'vies.js',
  'ablage.js', 'speicher.js', 'skonto.js', 'zahlung.js', 'kostenbild.js',
]);

/** Die Module des Shops, die zusätzlich in die Seiten wandern. */
export const SHOPMODULE = Object.freeze(['shopkern.js', 'gebinde.js', 'kundenanfrage.js']);

/**
 * @param {(name: string) => string} lies  liest `src/<name>` als Text
 * @param {string[]} module
 */
export function baueKern(lies, module = KERNMODULE) {
  const kern = module.map((m) => entkleide(lies(m))).join('\n');
  pruefeNamenskollisionen(kern);
  return kern;
}
