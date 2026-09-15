/**
 * Wie ein Werkzeug abbricht — **ein Satzbau, ein Ende.**
 *
 * **Der Fund, 14. September 2026.** Die Dublettensuche vergleicht Zeichen.
 * Diese Runde hat sie um einen Vergleich der **Gestalt** erweitert: Bezeichner
 * werden durchnummeriert, Schlüsselwörter und Eigenschaftsnamen bleiben stehen.
 * Was dabei auffiel, hätte die Zeichensuche nie gemeldet — fünf Funktionen
 * namens `abbruch`, in **drei** Verträgen:
 *
 * | steht in | Aufruf | Vorspann „Abbruch:" | Ende |
 * |---|---|---|---|
 * | `bin/bestellprobe.mjs` | `(text, code = 2)` | vom Helfer | 2 |
 * | `bin/paketpruefung.mjs`, `bin/kopfzeilenpruefung.mjs` | `(...zeilen)` | **vom Aufrufer** | 2 |
 * | `bin/vermerk.mjs`, `bin/vorgang.mjs` | `(satz, nachsatz)` | vom Helfer | **1** |
 *
 * Zwei der drei Unterschiede waren Zufall: Ob der Aufrufer das Wort „Abbruch"
 * selbst schreibt, entscheidet nichts — es entscheidet nur darüber, ob es nach
 * einem Umzug zweimal oder gar nicht dasteht. Wie viele Nachsätze ein Aufruf
 * mitgeben darf, ebenso.
 *
 * > **Ein Name für drei Verträge ist schlimmer als drei Namen: Der Leser
 * > sieht den vertrauten Aufruf und liest den fremden Vertrag nicht nach.**
 *
 * ## Der eine Unterschied, der bleibt
 *
 * Die **Endziffer**. `src/prueferurteil.js` liest sie: `0` heißt „ohne
 * Treffer", `1` heißt „mit Treffern", und alles andere heißt „gar nicht erst
 * gemessen". Ein Prüfer, der mit `1` abbricht, meldet damit einen Befund, den
 * er nie erhoben hat. Ein Werkzeug ohne Prüferurteil — `vermerk`, `vorgang` —
 * ist an diese Bedeutung nicht gebunden; dort ist `1` das gewöhnliche
 * Scheitern.
 *
 * Deshalb gibt es hier keine Vorgabe: `abbruchmelder()` verlangt die Ziffer,
 * und sie steht in jedem Werkzeug **einmal, oben, mit Namen** statt fünfmal
 * verstreut in einer kopierten Zeile.
 */

/**
 * Ein Prüfer bricht mit `2` ab.
 *
 * `0` und `1` sind für sein Urteil vergeben (ohne/mit Treffern). Wer sie für
 * einen Abbruch nimmt, meldet ein Ergebnis statt des Umstands, dass es keines
 * gibt.
 */
export const ABBRUCH_PRUEFER = 2;

/** Ein Werkzeug ohne Prüferurteil bricht mit `1` ab — gewöhnliches Scheitern. */
export const ABBRUCH_WERKZEUG = 1;

/**
 * Der Abbruchmelder eines Werkzeugs.
 *
 * @param {number} code    die Endziffer — `ABBRUCH_PRUEFER` oder `ABBRUCH_WERKZEUG`
 * @param {object} [umgebung]  zum Prüfen; sonst Konsole und Ende
 * @returns {(satz: string, ...nachsaetze: string[]) => never}
 */
export function abbruchmelder(code, umgebung = {}) {
  const schreibe = umgebung.schreibe ?? ((zeile) => console.error(zeile));
  const beende = umgebung.beende ?? ((c) => process.exit(c));
  if (!Number.isInteger(code) || code <= 0) {
    // Ein Abbruch mit 0 sagt „alles in Ordnung" — das ist die eine Ziffer,
    // die er nie melden darf, und ein Vertipper wäre still.
    throw new Error(`abbruchmelder braucht eine Endziffer über null, bekommen: ${code}`);
  }
  return (satz, ...nachsaetze) => {
    schreibe(`\nAbbruch: ${satz}`);
    for (const zeile of nachsaetze) if (zeile) schreibe(zeile);
    return beende(code);
  };
}
