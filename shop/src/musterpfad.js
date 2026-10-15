/**
 * Ist diese Datei als **Muster** gekennzeichnet?
 *
 * **Der Fund, 14. September 2026, nachts.** Zwei Werkzeuge tragen denselben
 * Riegel: `bin/import.mjs` liest Lieferantenpreislisten ein, `bin/preisliste.mjs`
 * schreibt sie fort. Beide weigern sich über einer Musterdatei, weil deren
 * Preise erfunden sind und der Shop sie sonst für bestätigte hielte.
 *
 * Derselbe Riegel — und **nicht dasselbe Muster**:
 *
 * ```
 * bin/import.mjs      /muster|beispiel|demo/i
 * bin/preisliste.mjs  /muster|beispiel|demo|probe/i
 * ```
 *
 * Eine Datei mit `probe` im Pfad kam durch den einen und nicht durch den
 * anderen. Welcher der beiden recht hat, ist keine Geschmacksfrage: Der
 * strengere, denn was hier durchrutscht, steht danach als **bestätigter**
 * Einkaufspreis im Katalog.
 *
 * > **Zwei Fassungen eines Riegels sind kein Riegel, sondern ein Riegel und
 * > eine Lücke — und welche von beiden gerade greift, entscheidet, welches
 * > Werkzeug man genommen hat.**
 *
 * Geprüft wird der **aufgelöste** Pfad, nicht das Argument: Ein relativer Name
 * aus `beispiel/` heraus trüge das Verzeichnis sonst nicht im Text.
 */

import { resolve } from 'node:path';

/** Die Wörter, an denen eine Musterdatei zu erkennen ist — die strengere Fassung. */
export const MUSTERWOERTER = /muster|beispiel|demo|probe/i;

/** @param {string} datei  der Pfad, wie er auf der Befehlszeile stand */
export function istMusterpfad(datei, aufloesen = resolve) {
  return MUSTERWOERTER.test(aufloesen(String(datei ?? '')));
}

/** Warum eine Musterdatei nicht in den Katalog darf — ein Satz, zwei Werkzeuge. */
export const MUSTER_SATZ = 'Muster enthalten erfundene Preise und dürfen nicht als bestätigt in den Katalog.';
