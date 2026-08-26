/**
 * Das Liefergebiet — und warum der Shop es kennen muss, bevor er annimmt.
 *
 * Die Weisung vom 22. August lautet: **regional, nicht österreichweit.**
 * Umgesetzt war sie an genau einer Stelle — in der Kampagne, als Zeichenkette
 * in einer Anzeigenzeile. Der Rechenkern nahm bis heute jede österreichische
 * Adresse an, und Punkt 12 der Geschäftsbedingungen sagte „Lieferorte nur in
 * Österreich", was eine Erlaubnis ist und keine Grenze.
 *
 * **Ein Zielgebiet, das nur in der Werbung steht, ist kein Zielgebiet.** Es
 * bestimmt, wem die Anzeige gezeigt wird, nicht, wessen Bestellung angenommen
 * wird. Wer von außerhalb bestellt, bestellt trotzdem.
 *
 * ## Warum der Bezirk und nicht die Postleitzahl
 *
 * Aus demselben Grund, aus dem `kunde.js` das Land verlangt statt es aus der
 * Postleitzahl zu erraten: **Eine Postleitzahl beweist keinen Bezirk.** Sie
 * überschreitet Bezirks- und sogar Landesgrenzen, und die amtliche Zuordnung
 * ist von hier aus nicht abrufbar — dieselbe Sperre, an der schon die
 * Gebietsauskunft des Radonmodells endete (`gebiet.js`).
 *
 * Eine aus dem Gedächtnis zusammengeschriebene Postleitzahlentabelle wäre der
 * bequeme Weg und der falsche: Sie sähe amtlich aus und wäre es nicht. Der
 * Bezirk wird deshalb **gefragt**, nicht abgeleitet.
 *
 * ## Warum eng und nicht großzügig
 *
 * Der Shop ist ein Streckengeschäft. Was er liefern kann, liefert der
 * Lieferant — und **wie weit der liefert, steht in keiner der fünfzehn
 * Rechnungen.** Die Frachtpauschale ist auf jedem Beleg dieselbe, unabhängig
 * vom Ort; eine Entfernungsgrenze ist daraus weder ablesbar noch
 * ausschließbar.
 *
 * Solange das offen ist, gilt die vorsichtige Richtung: Das Liefergebiet ist
 * die Fläche, für die die Kampagne wirbt, und keinen Bezirk mehr. Ein
 * angenommener Auftrag, den der Lieferant nicht fährt, kostet mehr als ein
 * abgelehnter — er kostet die Zusage.
 */

import { textZeile } from './format.js';

/**
 * Die Bezirke, in die geliefert wird.
 *
 * Deckungsgleich mit der Ausrichtung der Kampagne (`bin/kampagne.mjs`), und
 * das ist kein Zufall, sondern die Bedingung: Beworben und beliefert muss
 * dieselbe Fläche sein. Ein Testfall hält beide Listen aneinander.
 */
export const LIEFERGEBIET = Object.freeze({
  stand: '2026-08-26',
  herkunft: 'docs/baustoff-shop/liefergebiet-entschieden.md',
  land: 'AT',
  bezirke: Object.freeze([
    { name: 'Perg', bundesland: 'Oberösterreich', grund: 'Sitz des Betriebs (Marwach 5, 4312 Ried in der Riedmark)' },
    { name: 'Urfahr-Umgebung', bundesland: 'Oberösterreich', grund: 'Nachbarbezirk, Mühlviertel' },
    { name: 'Freistadt', bundesland: 'Oberösterreich', grund: 'Nachbarbezirk, Mühlviertel' },
    { name: 'Linz-Land', bundesland: 'Oberösterreich', grund: 'Ballungsraum, größte Bautätigkeit im Umkreis' },
    { name: 'Linz', bundesland: 'Oberösterreich', grund: 'Statutarstadt im selben Ballungsraum' },
  ]),
  vorbehalt:
    'Das tatsächliche Liefergebiet des Lieferanten ist unbekannt — aus fünfzehn Rechnungen '
    + 'nicht ableitbar, weil die Frachtpauschale nicht nach Entfernung staffelt. Beim '
    + 'Lieferanten zu erfragen; bis dahin gilt diese Liste als die engere der beiden.',
  selbstabholung:
    'Abholung am Betriebssitz ist von der Bezirksgrenze unberührt — sie setzt keine Lieferung voraus.',
});

/** Vergleichsform eines Bezirksnamens: ohne Zierrat, damit „Linz Land" trifft. */
const schluessel = (name) =>
  textZeile(name)
    .toLowerCase()
    .replace(/[\s.\-–—]+/g, '')
    .replace(/bezirk/g, '');

const GEBIETSSCHLUESSEL = new Set(LIEFERGEBIET.bezirke.map((b) => schluessel(b.name)));

/** Liegt dieser Bezirk im Liefergebiet? */
export function imLiefergebiet(bezirk) {
  const s = schluessel(bezirk ?? '');
  return s !== '' && GEBIETSSCHLUESSEL.has(s);
}

/** Die Bezirksnamen als lesbare Aufzählung — für Fehlermeldungen und Seiten. */
export const bezirksliste = () => LIEFERGEBIET.bezirke.map((b) => b.name).join(', ');

/**
 * Prüft einen Lieferort gegen das Gebiet.
 *
 * Drei Ausgänge, und der mittlere ist der wichtige: **Ein fehlender Bezirk
 * ist kein Ja.** Ihn stillschweigend durchzulassen hieße, die Grenze genau
 * dort zu öffnen, wo sie am leichtesten zu übersehen ist — beim
 * unvollständigen Formular.
 *
 * @param {{land?: string, bezirk?: string}} ort
 */
export function pruefeLieferort(ort = {}) {
  const land = textZeile(ort.land ?? '').toUpperCase();
  const bezirk = textZeile(ort.bezirk ?? '');

  if (land !== '' && land !== LIEFERGEBIET.land) {
    return {
      liefern: false,
      grund: `Lieferung nur innerhalb Österreichs, angegeben ist ${land}`,
    };
  }
  if (bezirk === '') {
    return {
      liefern: false,
      grund:
        'Bezirk der Baustelle fehlt — er lässt sich aus der Postleitzahl nicht bestimmen '
        + `und wird deshalb gefragt. Geliefert wird nach: ${bezirksliste()}.`,
    };
  }
  if (!imLiefergebiet(bezirk)) {
    return {
      liefern: false,
      grund:
        `Bezirk ${bezirk} liegt außerhalb des Liefergebiets. Geliefert wird nach: `
        + `${bezirksliste()}. Abholung am Betriebssitz ist davon unberührt.`,
    };
  }
  return { liefern: true, grund: null, bezirk };
}
