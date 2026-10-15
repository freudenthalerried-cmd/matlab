/**
 * Wann eine Inhaltsseite zuletzt geändert wurde.
 *
 * **Der Anlass, 6. September 2026.** Jede der 24 Inhaltsseiten trägt im
 * Kopfblock ein Feld `stand:`. Es hat genau **einen** Abnehmer:
 *
 * ```js
 * dateModified: seite.kopf.stand,   // bin/website.mjs
 * ```
 *
 * `dateModified` ist nach schema.org *„The date on which the CreativeWork was
 * most recently modified"* — und geht so an jede Maschine, die diese Seiten
 * liest. Für einen Shop, der auf maschinelle Auffindbarkeit gebaut ist, ist
 * das die Angabe, an der ein Assistent die Aktualität misst.
 *
 * Gemessen gegen die Änderungsgeschichte des Verzeichnisses:
 *
 * ```
 * Inhaltsseiten mit stand:                24
 * stand älter als die letzte Änderung:    10
 * ```
 *
 * Nicht um Tage: `kanal.md` trug den 25. August und war am 2. September
 * inhaltlich berichtigt worden — der Antwortsatz nennt seither die Lücke im
 * Sortiment. **Ein berichtigter Satz unter einem Datum, das vor der
 * Berichtigung liegt.**
 *
 * ## Warum das Feld verschwindet, statt geprüft zu werden
 *
 * Ein Prüfer wäre die naheliegende Antwort und die schlechtere: Das Feld ist
 * ein **von Hand geführtes Register über eine Tatsache, die das Verzeichnis
 * ohnehin kennt.** Dieser Bestand hat an zwei Tagen dreimal gesehen, was davon
 * zu halten ist — das Prüferregister, die Kopfzahl in `STATUS.md`, der
 * Gegenproben-Suchtext.
 *
 * > **Ein Datum, das jemand nachführen muss, ist so aktuell wie sein
 * > Gedächtnis. Ein Datum, das aus der Änderung selbst kommt, ist es immer.**
 *
 * ## Was das nicht kann
 *
 * Der Zeitpunkt der letzten **Einspielung** ist nicht dasselbe wie der
 * Zeitpunkt der letzten **inhaltlichen** Änderung: Eine berichtigte
 * Rechtschreibung verschiebt ihn genauso. Das ist die richtige Richtung —
 * `dateModified` fragt nach der Datei und nicht nach der Bedeutung —, und es
 * steht hier, damit niemand mehr hineinliest.
 *
 * ## Was mit dem alten Feld geschieht
 *
 * `stand:` bleibt im Kopfblock und ist seither der **Rückfall**: Er greift,
 * wenn die Geschichte nichts hergibt — eine Datei ohne Verzeichnis, ein
 * Bestand ohne git. Seine zehn abgelaufenen Werte werden **nicht** berichtigt,
 * und das ist keine Nachlässigkeit:
 *
 * > **Das Feld zu berichtigen hieße, die Dateien anzufassen — und damit würde
 * > die abgeleitete Angabe für zehn Seiten „heute" behaupten.** Der Wert, den
 * > sie früher falsch geliefert haben, wird von niemandem mehr gelesen; die
 * > wahre Geschichte dieser zehn Seiten steht im Verzeichnis und bliebe nur
 * > erhalten, wenn man sie in Ruhe lässt.
 */

/** Kein Datum ermittelbar: Was nicht bekannt ist, bekommt keinen Schlüssel. */
export const UNBEKANNT = null;

/**
 * Der Stand einer Datei aus ihrer Änderungsgeschichte.
 *
 * @param {object} eingabe
 * @param {string} eingabe.pfad        Pfad relativ zur Verzeichniswurzel
 * @param {(argumente: string[]) => string} eingabe.git  ruft git auf und gibt stdout zurück
 * @param {string} eingabe.heute       `JJJJ-MM-TT`
 * @returns {string|null}
 */
export function standAusGit({ pfad, git, heute }) {
  let offen = '';
  try {
    offen = String(git(['status', '--porcelain', '--', pfad]) ?? '').trim();
  } catch {
    return UNBEKANNT;
  }
  // **Unverbucht heißt heute.** Eine Datei, die im Baum liegt und noch nicht
  // eingespielt ist, ist heute geändert worden — alles andere behauptete ein
  // Alter, das sie nicht hat.
  if (offen) return heute;

  let letzte = '';
  try {
    letzte = String(git(['log', '-1', '--format=%cs', '--', pfad]) ?? '').trim();
  } catch {
    return UNBEKANNT;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(letzte) ? letzte : UNBEKANNT;
}
