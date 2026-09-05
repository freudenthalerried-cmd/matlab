/**
 * Lässt sich jede Quelldatei überhaupt einlesen?
 *
 * **Der Befund, 5. September 2026.** `npm run shopprobe` bricht ab:
 *
 * ```
 * file:///…/bin/shopprobe.mjs:982
 * }
 * ^
 * SyntaxError: Unexpected token '}'
 * ```
 *
 * Dieselbe geschweifte Klammer zu viel steht in `bin/oberflaechenprobe.mjs`.
 * Beide seit dem 4. September, 12:21 — aus derselben Runde, die den
 * Frischeschutz eingebaut hat. **Fünfzehn Stunden, elf Gesamtläufe, jeder
 * grün.**
 *
 * > **64 Browserszenarien, und die beiden Dateien, die sie fahren, ließen
 * > sich nicht einmal einlesen.**
 *
 * Warum es niemand gemerkt hat: `npm run alles` holt die Browserproben nicht
 * ab — sie kosten je einen Chromium-Start. Der einzige Schutz davor, dass sie
 * verrotten, war ein Schalter, den niemand umlegt.
 *
 * ## Was diese Prüfung ist und was nicht
 *
 * Sie ist die **unterste** Stufe: Eine Datei, die sich nicht einlesen lässt,
 * ist kein Werkzeug, sondern Text. Sie führt nichts aus, sie prüft keine
 * Logik, sie ersetzt keine Probe.
 *
 * Sie ist aber die einzige Prüfung, die **jede** Datei erreicht — auch die,
 * die aus Kostengründen aus dem Regellauf herausbleiben. Drei Sekunden gegen
 * fünfzehn Stunden.
 */

/** Wo Quelldateien liegen. Der Wurzelordner kommt getrennt dazu. */
export const QUELLORDNER = Object.freeze(['bin', 'src', 'test']);

/** Welche Endungen geprüft werden — und womit. */
export const ENDUNGEN = Object.freeze({
  '.js': 'node',
  '.mjs': 'node',
  '.php': 'php',
});

/**
 * Der Befund über eine Liste geprüfter Dateien.
 *
 * @param {{datei: string, ok: boolean, meldung?: string}[]} ergebnisse
 * @param {number} [mindestens]  ab wie vielen Dateien die Aussage etwas wert
 *   ist — ein Lauf über null Dateien ist grün und nutzlos
 */
export function lesbarkeitsbefund(ergebnisse, mindestens = 40) {
  const meldungen = [];
  for (const e of ergebnisse) {
    if (!e.ok) {
      meldungen.push({
        regel: 'nicht-einlesbar',
        datei: e.datei,
        text: `${e.datei}: ${(e.meldung ?? '').split('\n')[0] || 'lässt sich nicht einlesen'}`,
      });
    }
  }
  // **Ein leerer Lauf ist kein grüner.** Dieselbe Regel wie bei `mindestens`
  // im Prüferregister: Wer über nichts urteilt, urteilt nicht.
  if (ergebnisse.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-gefunden',
      datei: null,
      text: `nur ${ergebnisse.length} Dateien gefunden, erwartet mindestens ${mindestens}`,
    });
  }
  return {
    dateien: ergebnisse.length,
    kaputt: ergebnisse.filter((e) => !e.ok).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
