/**
 * Gemeinsame Darstellungshilfen.
 *
 * Sie stehen hier und nicht dreimal verstreut, aus einem Grund, der beim Bauen
 * aufgefallen ist: Beim Zusammenfügen zu `demo.html` teilen sich alle Module
 * einen Gültigkeitsbereich. Zwei gleichnamige Hilfsfunktionen ergeben dort
 * einen SyntaxError — und der legt die ganze Seite still, während die Tests
 * grün bleiben, weil sie die Module einzeln laden.
 */

/** Betrag in österreichischer Schreibweise. */
export const EUR = (n) => n.toFixed(2).replace('.', ',') + ' €';

/**
 * Entschärft ein Feld für eine CSV mit Semikolon als Trenner.
 *
 * Anlass: Eine Artikelbezeichnung mit Zeilenumbruch hat die Bestell-CSV an den
 * Lieferanten in zwei Zeilen zerlegt — die zweite wurde beim Zurücklesen zu
 * einer Geisterposition mit unlesbarer Menge. In einer Kette, die ohne Zutun
 * bestellt, wäre das eine falsche Bestellung.
 *
 * `ablage.js` hat das von Anfang an richtig gemacht, `bestellung.js` nicht —
 * ausgerechnet in der Datei, die Ware bewegt. Deshalb steht es jetzt an einer
 * Stelle.
 */
export const csvFeld = (wert) =>
  String(wert ?? '')
    .replaceAll(';', ',')
    .replace(/[\r\n]+/g, ' ');

/**
 * Sichtbare Markierung für eine fehlende Pflichtangabe.
 *
 * Absichtlich hässlich. Eine Lücke, die im Entwurf hübsch aussieht, geht
 * irgendwann versehentlich hinaus.
 */
export const LUECKE = (bezeichnung) => `[[ ${bezeichnung} — FEHLT ]]`;
