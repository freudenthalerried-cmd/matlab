/**
 * Kommentare aus dem ausgelieferten Skript entfernen.
 *
 * **Der Anlass, 29. August 2026.** `ausgabe/site/shop.js` ist 293 KB groß und
 * geht an jeden Besucher. Darin steht der **Quelltext der Rechenmodule samt
 * seiner Kommentare** — und die Kommentare erklären die Kalkulation:
 *
 * > „40 € Einkauf und 25 % Ziel ergeben 53,333… €"
 *
 * Damit ist die Weisung vom 28. August („keine Spanne ausgeben") auf der
 * Kundenseite unterlaufen: Die Zahl steht nicht auf der Seite, aber in der
 * Datei, die die Seite lädt. Schwerer wiegt die zweite Folge: Der offene
 * Punkt „Repository privat schalten" wäre damit **wirkungslos**. Wer die
 * Einkaufspreise rekonstruieren will, braucht das Repository nicht — die
 * ausgelieferte Seite reicht.
 *
 * Fehlerklasse: *eine Prüfung, die das Modell liest statt die Ausgabe.* Der
 * Interna-Prüfer sieht den gerenderten Seitentext an; das mitgelieferte
 * Skript hat er nie gelesen.
 *
 * **Warum von Hand und nicht mit einem Werkzeug.** Im ganzen `shop/` ist kein
 * Fremdpaket, und dabei bleibt es. Der Preis dafür ist, dass dieser Scanner
 * die Sonderfälle selbst kennen muss: Zeichenketten, Vorlagenliterale samt
 * `${…}`, reguläre Ausdrücke. Ein Kommentarentferner, der ein `//` in einer
 * Zeichenkette für einen Kommentar hält, macht aus gültigem Code Bruch.
 *
 * **Die Absicherung dagegen steht nicht in diesem Kommentar, sondern im
 * Bauschritt**: Das Ergebnis wird mit `node --check` geparst, bevor es
 * geschrieben wird, und 39 Browserszenarien fahren danach über die fertige
 * Seite. Ein Scannerfehler bricht den Bau ab, statt still auszuliefern.
 */

import { stuecke } from './quelltext.js';

/**
 * @param {string} quelle
 * @returns {{ text: string, entfernt: number, zeichen: number }}
 *
 * **Der Gang durch die Quelle steht seit dem 14. September 2026 in
 * `src/quelltext.js`.** Er stand hier, und er stand ein zweites Mal in
 * `src/testzerlegung.js`, und drei weitere Stellen lasen denselben Quelltext
 * mit regulären Ausdrücken — und lasen ihn falsch. Diese Datei behält ihre
 * Aufgabe (Kommentare heraus, Zeilen erhalten) und gibt das Lesen ab.
 *
 * **`streng` bleibt hier eingeschaltet.** Das Ergebnis geht an jeden
 * Besucher: Ein Scanner, der über einem unvollständigen Literal rät, macht
 * aus gültigem Code Bruch, und das fiele erst im Browser des Kunden auf.
 */
export function ohneKommentare(quelle) {
  let text = '';
  let entfernt = 0;
  let zeichen = 0;
  for (const st of stuecke(String(quelle), { streng: true })) {
    if (st.art === 'block') {
      entfernt += 1;
      zeichen += st.roh.length;
      // Zeilenumbrüche des Blocks erhalten, damit Zeilennummern in
      // Fehlermeldungen weiter zur Quelle passen.
      text += st.roh.replace(/[^\n]/g, '');
      continue;
    }
    if (st.art === 'zeile') {
      entfernt += 1;
      zeichen += st.roh.length; // der Zeilenumbruch bleibt stehen
      continue;
    }
    text += st.roh;
  }
  return { text, entfernt, zeichen };
}
