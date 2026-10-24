/**
 * Die beiden Ausgaben des Katalogerzeugers — **zusammen oder gar nicht.**
 *
 * **Der Anlass, 30. August 2026.** Ein Lauf mit halb umgelenkten Zielen hat
 * die vertrauliche Preisdatei geleert. `KATALOG_ZIEL` nimmt den Katalog auf,
 * `KATALOG_PREISE_ZIEL` die Einkaufspreise; wer nur eines umlenkt, schreibt
 * das andere in den Bestand.
 *
 * > **Wer eine Ausgabe umlenkt, lenkt beide um. Die Preisdatei holt kein git
 * > zurück** — sie liegt außerhalb des Verzeichnisses, und das ist ihr Zweck.
 *
 * **Hierher gezogen am 14. September 2026, nachts.** Die Sperre stand
 * gleichlautend in `bin/artikelliste.mjs` und `bin/katalog-aus-rechnungen.mjs`
 * — dieselbe Bedingung, derselbe Abbruchsatz, zwei Stellen. Gefunden hat das
 * der Satzvergleich, nachdem sein Leser repariert war.
 */

/** Ist genau **eines** der beiden Ziele gesetzt? */
export function zieleHalb(umgebung = process.env) {
  return Boolean(umgebung.KATALOG_ZIEL) !== Boolean(umgebung.KATALOG_PREISE_ZIEL);
}

/** Der Abbruchsatz — ein Satz, zwei Werkzeuge. */
export const ZIELE_HALB_SATZ = '\nAbbruch: Nur eines der beiden Ziele ist umgelenkt.';
