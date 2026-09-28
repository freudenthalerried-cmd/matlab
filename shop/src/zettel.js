/**
 * Der Zettel: was der Auftraggeber ausfüllen kann, ohne etwas auszugeben.
 *
 * **Der Anlass, 10. September 2026.** `npm run punkte` führt an diesem Tag
 * **25 offene Punkte in vier Gruppen**, und kein einziger davon liegt bei mir.
 * Fünf stehen unter *„Liegt vor, fehlt nur in der Datei"* — sie kosten nichts,
 * brauchen keine Freigabe, keinen Vertrag und keinen Dritten. Sieben Angaben
 * sind es zusammen mit der Bankverbindung.
 *
 * Diese sieben Angaben verteilen sich über vier Werkzeugausgaben, und wer sie
 * liefern soll, müsste alle vier lesen und daraus die Felder heraussuchen.
 *
 * > **Eine Zulieferung, die man sich zusammensuchen muss, wird nicht
 * > geliefert.**
 *
 * Der Zettel dreht das um: eine Seite, sieben Zeilen, je Zeile das Feld, die
 * Form, die Fundstelle im Gesetz und der Satz, was sie freigibt.
 *
 * ## Warum ein Register und keine geschriebene Liste
 *
 * Eine geschriebene Liste veraltet mit der ersten ausgefüllten Angabe. Dieses
 * Register wird gegen `data/betreiber.json` gehalten, **in beide Richtungen**:
 * Ein leeres Feld, das nichts kostet und hier fehlt, ist ein Befund; ein
 * Eintrag, dessen Feld längst ausgefüllt ist, ebenso — er gehört vom Zettel
 * herunter, sonst fragt der Zettel nach etwas, das schon dasteht.
 *
 * Form und Beispiel stehen **nicht** hier. Sie stehen in `betreiberform.js`
 * und `bankverbindung.js`, wo sie geprüft werden, und werden von dort geholt.
 * Zweimal geschrieben hieße: einmal gepflegt.
 */

import { FORMREGELN } from './betreiberform.js';
import { BANKFELDER } from './bankverbindung.js';

/**
 * Die Angaben, die der Auftraggeber ohne Ausgabe liefern kann.
 *
 * `loest` ist der Satz, der auf dem Zettel neben der Zeile steht: **wofür**.
 * Ohne ihn ist eine Zeile eine Bitte; mit ihm ist sie eine Entscheidung, die
 * jemand in einer Minute treffen kann.
 */
export const ZULIEFERUNGEN = Object.freeze([
  Object.freeze({
    feld: 'email',
    bezeichnung: 'E-Mail-Adresse des Betriebs',
    rechtsgrund: '§ 5 ECG — Angaben zur raschen Kontaktaufnahme',
    loest: 'Sie ist die erste von zwei Voraussetzungen des Bestellwegs: Ohne sie hat das '
      + 'Empfangsskript keinen Empfänger, und `npm run website` liefert es gar nicht erst mit. '
      + 'Zugleich eine der vier fehlenden Impressumsangaben.',
  }),
  Object.freeze({
    feld: 'telefon',
    bezeichnung: 'Telefonnummer',
    rechtsgrund: '§ 5 ECG — Angaben zur raschen Kontaktaufnahme',
    loest: 'Eine der vier fehlenden Impressumsangaben. Sie steht außerdem auf dem Brief an den '
      + 'Rechtstexteanbieter, den die Sperre sonst zurückhält.',
  }),
  Object.freeze({
    feld: 'uid',
    bezeichnung: 'UID-Nummer',
    rechtsgrund: '§ 11 Abs 1 Z 3 UStG — Pflichtangabe auf Rechnungen über 400 €',
    loest: 'Ohne sie trägt keine Kundenrechnung über 400 € die vorgeschriebenen Angaben, und '
      + 'der Vorsteuerabzug des Kunden hängt daran. Die Prüfziffer wird nachgerechnet.',
  }),
  Object.freeze({
    feld: 'gewerbewortlaut',
    bezeichnung: 'Wortlaut des angemeldeten Gewerbes',
    rechtsgrund: '§ 5 ECG — die Gewerbebezeichnung im Impressum',
    loest: 'Die vierte fehlende Impressumsangabe. Sie steht im Gewerberegisterauszug wörtlich '
      + 'so, wie sie angemeldet wurde — abschreiben, nicht formulieren.',
  }),
  Object.freeze({
    feld: 'antwortzeitWerktage',
    bezeichnung: 'Antwortzeit in Werktagen',
    rechtsgrund: 'keine Vorschrift — eine Zusage, die der Shop heute ohne Zeitangabe macht',
    loest: 'Die Kasse verspricht eine Rückmeldung und sagt nicht, wann. Eine Zahl macht daraus '
      + 'eine Zusage, die man einhalten kann; sie ist zugleich eine Etappe des Rolloutplans.',
    beispielRoh: '2',
  }),
  Object.freeze({
    feld: 'kontoinhaber',
    bezeichnung: 'Kontoinhaber',
    rechtsgrund: 'keine Vorschrift — die Bank des Kunden prüft den Namen gegen die IBAN',
    loest: 'Gate 21 hat Vorkasse ab Start entschieden. Die Auftragsbestätigung sagt seither '
      + '„Zahlbar sofort" und sagt bis heute nicht, wohin.',
  }),
  Object.freeze({
    feld: 'iban',
    bezeichnung: 'IBAN',
    rechtsgrund: 'keine Vorschrift — ohne sie kann niemand überweisen',
    loest: 'Vorkasse braucht keinen Zahlungsanbieter, sondern ein Konto: keine Gebühr, kein '
      + 'Vertrag, keine zehn Tage Legitimationsprüfung. Es ist der einzige Weg, auf dem der '
      + 'Shop am ersten Tag Geld annehmen kann.',
  }),
]);

/** Wo die Angaben hingehören. */
export const ZIELDATEI = 'shop/data/betreiber.json';

/** Was Form und Beispiel angeht, gilt das Register, das sie prüft. */
export function formangaben(feld) {
  const aus = [...FORMREGELN, ...BANKFELDER].find((r) => r.feld === feld);
  return aus ? { beispiel: aus.beispiel, geprueft: typeof aus.pruefe === 'function' } : null;
}

/** Ob ein Wert als geliefert gilt. */
export function geliefert(wert) {
  if (wert === null || wert === undefined) return false;
  if (typeof wert === 'string') return wert.trim() !== '';
  if (typeof wert === 'number') return Number.isFinite(wert);
  return true;
}

/**
 * Hält den Zettel gegen die Betreiberdatei — in beide Richtungen.
 *
 * @param {object} betreiber der Inhalt von data/betreiber.json
 * @param {string[]} kostenlosLeer Felder, die leer sind und nichts kosten
 * @param {object[]} [register]
 */
export function zettelbefund(betreiber, kostenlosLeer, register = ZULIEFERUNGEN) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const aufDemZettel = new Set(register.map((z) => z.feld));

  for (const z of register) {
    if (!z.loest || z.loest.length < 40) {
      melde('ohne-wofuer', `${z.feld}: ohne den Satz, was sie freigibt, ist die Zeile eine Bitte`);
    }
    if (!z.rechtsgrund) {
      melde('ohne-grund', `${z.feld}: keine Angabe, worauf die Pflicht beruht — auch „keine `
        + 'Vorschrift" ist eine Auskunft');
    }
    if (geliefert(betreiber?.[z.feld])) {
      melde('schon-geliefert',
        `${z.feld} steht in ${ZIELDATEI} und wird trotzdem noch abgefragt — ein Zettel, der `
        + 'nach Ausgefülltem fragt, wird nicht ernst genommen');
    }
    if (!formangaben(z.feld)) {
      melde('ohne-form',
        `${z.feld}: keine Form und kein Beispiel in betreiberform.js oder bankverbindung.js — `
        + 'wer liefert, wüsste nicht, wie es aussehen soll');
    }
  }

  for (const feld of kostenlosLeer) {
    if (!aufDemZettel.has(feld)) {
      melde('fehlt-auf-dem-zettel',
        `${feld} ist leer und kostet nichts, steht aber auf keinem Zettel — genau so bleiben `
        + 'Zulieferungen liegen');
    }
  }

  return {
    meldungen,
    zeilen: register.length,
    sauber: meldungen.length === 0,
  };
}
