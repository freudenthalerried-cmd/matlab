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
 * Sichtbare Markierung für eine fehlende Pflichtangabe.
 *
 * Absichtlich hässlich. Eine Lücke, die im Entwurf hübsch aussieht, geht
 * irgendwann versehentlich hinaus.
 */
export const LUECKE = (bezeichnung) => `[[ ${bezeichnung} — FEHLT ]]`;
