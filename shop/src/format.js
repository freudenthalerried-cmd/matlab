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

/*
 * Alle Zeichen, die in einem einzeiligen Feld nichts verloren haben:
 * Steuerzeichen U+0000–U+001F samt Tabulator, U+007F, dazu die drei Zeichen,
 * die Unicode ausdrücklich als Zeilentrenner führt — U+0085 (NEL), U+2028
 * (Line Separator), U+2029 (Paragraph Separator).
 *
 * Der Tabulator ist bewusst dabei. Er bricht zwar keine Zeile, verschiebt aber
 * die mit `padStart`/`padEnd` gesetzten Spalten der Belege und bei manchen
 * Lesern die Feldgrenzen einer CSV.
 */
const STEUERZEICHEN = /[\u0000-\u001F\u007F\u0085\u2028\u2029]/;
const STEUERZEICHEN_FOLGE = /[\u0000-\u001F\u007F\u0085\u2028\u2029]+/g;

/**
 * Zwingt fremden Text in **eine** Zeile.
 *
 * Alle Belege dieses Shops sind zeilenorientiert: Eine Position ist eine Zeile,
 * eine Summe ist eine Zeile, eine CSV-Position ist eine Zeile. Wer einen
 * Zeilenumbruch in ein Feld unterbringt, das in so einen Beleg wandert,
 * schreibt dort eine zusätzliche Zeile — und eine zusätzliche Zeile in einer
 * Bestellung ist eine zusätzliche Position.
 *
 * Nachgewiesen, nicht befürchtet: Der Firmenname
 * `"Bau Muster GmbH\n  999 × AB-RD-375  Abdichtungsbahn"` hat die
 * Eingabeprüfung anstandslos passiert und im Bestelltext an den Lieferanten
 * eine zweite Position über 999 Rollen erzeugt.
 */
export const textZeile = (wert) => String(wert ?? '').replace(STEUERZEICHEN_FOLGE, ' ').trim();

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
export const csvFeld = (wert) => textZeile(wert).replaceAll(';', ',');

/**
 * Eine Zahl, wie sie hierzulande geschrieben wird.
 *
 * **Der Befund vom 2. September.** Die Buchhaltungs-CSV geht mit Semikolon
 * als Trenner hinaus — das ist die hiesige Schreibweise — und trug die
 * Beträge mit **Punkt**:
 *
 * ```
 * 1;rechnung;RE-2026-0001;2026-09-02;V-1;768.39;922.07;;…
 * ```
 *
 * In einer Tabellenkalkulation mit deutscher Ländereinstellung ist der Punkt
 * das **Tausendertrennzeichen**. Aus 768,39 € werden 76.839 €, und zwar
 * lautlos: Die Zahl sieht nach dem Import wie eine Zahl aus. Dieselbe Datei
 * geht zum Steuerberater.
 *
 * > **Eine Datei, die zur Hälfte deutsch formatiert ist, ist falsch
 * > formatiert.**
 *
 * `zahlText` schreibt ganze Zahlen ohne Nachkomma („55") und gebrochene mit
 * Komma und höchstens zwei Stellen („0,75") — die Genauigkeit, in der Gebinde
 * aufgehen und eine Rechnung stellbar ist. `csvBetrag` schreibt Geld immer
 * mit zwei Stellen: „1234,5" ist in einer Buchhaltung kein Betrag.
 */
const keineZahl = (wert) => wert === null || wert === undefined || wert === ''
  || !Number.isFinite(Number(wert));

export const zahlText = (wert) => {
  // `Number(null)` ist 0, und `null` heißt hier „keine Angabe". Ohne diese
  // Wache stünde in der Buchhaltungszeile eines Vermerks ohne Betrag ein
  // sauberes „0,00 €" — eine erfundene Null sieht aus wie eine gebuchte.
  if (keineZahl(wert)) return '';
  const n = Number(wert);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');
};

/** Geldbeträge — immer zwei Nachkommastellen, Komma. Leer, wenn es keine Zahl ist. */
export const csvBetrag = (wert) => (keineZahl(wert) ? '' : Number(wert).toFixed(2).replace('.', ','));

/**
 * Zurück aus beiden Schreibweisen.
 *
 * Liest „0,75" und „0.75". Absichtlich beides: Die alten Dateien im Umlauf
 * tragen den Punkt, und ein Leser, der sie ab heute nicht mehr versteht,
 * macht aus einem Formatfehler einen Datenverlust.
 */
export const zahlAusText = (wert) => {
  const roh = String(wert ?? '').trim().replace(',', '.');
  return roh === '' ? NaN : Number(roh);
};

/**
 * Findet Zeichen, die `textZeile` entfernen würde.
 *
 * Das Gegenstück für den **Eingang**: Am Ausgang wird entschärft, am Eingang
 * abgewiesen. Beides wird gebraucht. Nur entschärfen hieße, stillschweigend
 * eine Eingabe anzunehmen, die so niemand gemeint haben kann — und wer eine
 * Bestellposition in ein Namensfeld schreibt, hat sie gemeint. Nur abweisen
 * deckt bloß die Felder ab, die durch eine Eingabeprüfung kommen;
 * Artikelbezeichnungen aus einer Herstellerdatei kommen das nicht.
 */
export const hatSteuerzeichen = (wert) => STEUERZEICHEN.test(String(wert ?? ''));

/**
 * Sichtbare Markierung für eine fehlende Pflichtangabe.
 *
 * Absichtlich hässlich. Eine Lücke, die im Entwurf hübsch aussieht, geht
 * irgendwann versehentlich hinaus.
 */
export const LUECKE = (bezeichnung) => `[[ ${bezeichnung} — FEHLT ]]`;

/**
 * Die Einheitenkürzel des Lieferanten in lesbaren Text.
 *
 * **Hierher verlegt am 31.08.** Die Zuordnung stand in `bin/website.mjs`, also
 * in einem Bauwerkzeug — erreichbar nur für die Seiten. Wer sie anderswo
 * brauchte, half sich selbst, und das dreimal mit derselben Zeile:
 * `einheit === 'KG' ? 'kg' : 'm²'`. Solange nur diese beiden Einheiten einen
 * Gebindeschritt hatten, war die Fallunterscheidung vollständig; mit den
 * laufenden Metern stand danach „2,55 m²" auf einer Leiste, im Warenkorb, im
 * Vorlesetext und in einem Satz, der sich selbst widersprach.
 *
 * `beleg.js` half sich anders und gar nicht: Angebot und Rechnung setzten das
 * Kürzel roh, während der Anfragetext derselben Bestellung „Sack" schrieb —
 * derselbe Kunde, dieselbe Position, zwei Schreibweisen.
 *
 * Ein unbekanntes Kürzel wird **nicht** übersetzt, sondern durchgereicht.
 * Erfinden wäre schlimmer als stehenlassen: „PAK" als „Paket" zu lesen ist
 * eine Vermutung, und sie stünde dann auf einer Rechnung.
 */
export const EINHEITEN = Object.freeze({
  STK: 'Stück', M2: 'm²', KG: 'kg', SCK: 'Sack', KRT: 'Karton',
  LFM: 'lfm', DOS: 'Dose', EIM: 'Eimer', RLL: 'Rolle',
});

/** Das lesbare Wort zu einem Einheitenkürzel — oder das Kürzel selbst. */
export const einheitText = (kuerzel) => EINHEITEN[kuerzel] ?? kuerzel ?? 'Stk';

/**
 * Eine Aufzählung, wie man sie spricht: „Perg, Linz und Freistadt".
 *
 * Steht hier und nicht an der Verwendungsstelle, weil die Liste, die sie
 * aufzählt, an mehreren Stellen ausgegeben wird — im Seitenfuß, auf der
 * Lieferseite, in den Anzeigentexten. Drei handgeschriebene Fassungen
 * derselben fünf Bezirke wären drei Gelegenheiten, sie auseinanderlaufen zu
 * lassen; die vierte wäre die, die niemand nachzieht.
 *
 * Leere Liste ergibt leeren Text — nicht „und", nicht „—". Wer eine leere
 * Aufzählung ausgibt, hat ein Datenproblem und keinen Satzbaufehler, und ein
 * eingesetztes Füllwort würde es verstecken.
 */
export function aufzaehlung(teile, bindewort = 'und') {
  const w = [...teile].map((t) => textZeile(t)).filter((t) => t !== '');
  if (w.length === 0) return '';
  if (w.length === 1) return w[0];
  return `${w.slice(0, -1).join(', ')} ${bindewort} ${w[w.length - 1]}`;
}
