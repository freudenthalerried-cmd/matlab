/**
 * Wirkt jede Weisung des Auftraggebers im Bestand — oder steht sie nur da?
 *
 * **Der Anlass, 7. September 2026.** Eine Runde zuvor hat `pruefe-gates` die
 * achtundzwanzig Gates gegen den Bestand gehalten. Ein Gate ist aber meine
 * eigene Entscheidung. Die Schicht darüber sind die **Weisungen** — acht
 * Ansagen des Auftraggebers seit dem 22. August, und sie sind der Grund, aus
 * dem dieses Vorhaben überhaupt so aussieht, wie es aussieht. Zwei davon haben
 * frühere Arbeit vollständig umgeworfen.
 *
 * Gehalten hat sie nichts. `npm run pruefe-auftrag` misst den **Ursprungs**-
 * auftrag vom 9. August — die zwölf Ergebnisse des Master-Prompts —, und dort
 * endet es. Was der Auftraggeber danach angeordnet hat, stand in einer Tabelle
 * und in keinem Prüfer.
 *
 * > **Eine Weisung, die nur im Protokoll steht, ist ein Missverständnis mit
 * > Datum.**
 *
 * Drei Zustände, nicht zwei — das ist der Unterschied zum Gate-Register:
 *
 *   1. **erfüllt** — die Weisung wirkt an einer benannten Stelle;
 *   2. **offen und geführt** — sie ist nicht erfüllt, und der Bestand weiß
 *      das: `npm run offenepunkte` nennt sie;
 *   3. **vergessen** — weder das eine noch das andere. Genau dafür gibt es
 *      diesen Prüfer.
 *
 * Geprüft wird die **Sache**, nicht das Datum: Ein Muster, das nach „28.08."
 * sucht, misst, ob jemand das Datum in einen Kommentar geschrieben hat.
 */

/** Woher die Weisungen kommen — gemessen, nicht abgeschrieben. */
export const QUELLE = 'docs/baustoff-shop/PARAMETER.md';

/** Überschrift des Abschnitts, in dem die Weisungen stehen. */
const ABSCHNITT = /^## Weisungen seit dem .+ — was jetzt gilt\s*$/;

/**
 * Liest die Weisungen aus `PARAMETER.md`.
 *
 * Gelesen wird nur die erste Tabelle des Abschnitts. Darunter steht eine
 * zweite mit den **unveränderten** Parametern — Zielmarkt, Zielgröße,
 * Logistik, Zielgruppe. Die gehören nicht hierher: Sie sind der Boden, nicht
 * die Änderung, und eine Änderung ist das, was driftet. Gemessen werden sie an
 * anderer Stelle (`npm run pruefe-leitzahlen`, `data/zielgroessen.json`), und
 * „kein eigenes Warenlager" hütet seit dem 6. September `BETRIEBSAUSSAGEN` in
 * `src/inhaltspruefung.js`.
 *
 * @returns {{nr: number, datum: string, weisung: string}[]}
 */
export function weisungenAusParametern(text) {
  const zeilen = text.split('\n');
  const von = zeilen.findIndex((z) => ABSCHNITT.test(z));
  if (von < 0) return [];
  const gefunden = [];
  for (const z of zeilen.slice(von + 1)) {
    if (/^#{2,3} /.test(z)) break;
    const m = z.match(/^\|\s*(\d{2}\.\d{2}\.)\s*\|\s*(.+?)\s*\|/);
    if (!m) continue;
    gefunden.push({ nr: gefunden.length + 1, datum: m[1], weisung: m[2] });
  }
  return gefunden;
}

/**
 * Was jede Weisung im Bestand bewirkt hat.
 *
 * `nr` ist die Zeilennummer in der Tabelle, `datum` steht daneben und wird
 * mitgeprüft: Wer eine Zeile einfügt oder umstellt, verschiebt die Nummern —
 * und dann zeigt der Eintrag auf die falsche Weisung, ohne dass es auffiele.
 */
export const WEISUNGEN = Object.freeze([
  Object.freeze({
    nr: 1,
    datum: '22.08.',
    stichwort: 'Baumeister-Einkaufspreise als Grundlage',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/baustoffkatalog.js', muster: /preisDatei/ }),
    ]),
    warum: 'Der Katalog wird aus zwei Dateien geladen: der öffentlichen Artikelliste und '
      + 'einer getrennten Preisdatei, die nicht im Verzeichnis liegt. Genau diese Trennung '
      + 'ist die Weisung — gerechnet wird auf eigene Einkaufspreise, und die gehören nicht '
      + 'in ein öffentliches Repository.',
  }),
  Object.freeze({
    nr: 2,
    datum: '22.08.',
    stichwort: 'Google Shopping, Lieferung regional',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/maschinenlesbar.js', muster: /export\s+function\s+katalogFeed/ }),
      Object.freeze({ datei: 'shop/src/liefergebiet.js', muster: /bezirk/i }),
    ]),
    warum: 'Zwei Ansagen in einer Zeile, und beide brauchen ihre eigene Stelle: der '
      + 'Produktfeed für Google Shopping und die Bezirksfrage für die regionale Lieferung. '
      + 'Bis zum 26. August war „regional" an genau einer Stelle umgesetzt — als '
      + 'Zeichenkette in einer Anzeigenzeile, die keine Bestellung aufhält.',
  }),
  Object.freeze({
    nr: 3,
    datum: '25.08.',
    stichwort: '25 % ist Marge vom Verkauf, nicht Zuschlag',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/baustoffkatalog.js', muster: /ZIELMARGE = 0\.25/ }),
    ]),
    warum: 'Die teuerste Verwechslung dieses Vorhabens: 25 % Zuschlag sind 20 % Marge, und '
      + 'der nötige Monatsumsatz unterscheidet sich um mehr als 24.000 €. Die Zahl steht an '
      + 'einer Stelle und heißt dort, was sie ist.',
  }),
  Object.freeze({
    nr: 4,
    datum: '26.08.',
    stichwort: 'Die Firma existiert bereits',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/data/betreiber.json', muster: /FN 347938z/ }),
    ]),
    warum: 'Keine Gründung nötig — und das ist keine Randnotiz: Firmenbuchnummer, Gericht, '
      + 'Kammer und Gewerbebehörde sind Pflichtangaben des Impressums. Sie stehen belegt in '
      + 'der Betreiberdatei, nicht als Platzhalter im Bauwerkzeug.',
  }),
  Object.freeze({
    nr: 5,
    datum: '28.08.',
    stichwort: 'Keine Spanne ausgeben',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/geheimnis.js', muster: /ABFLUSSMUSTER/ }),
    ]),
    warum: 'Die Handelsspanne erscheint nicht auf Kundenseiten. Der Prüfer dazu sucht nicht '
      + 'das Wort, sondern die Zahl und ihre Umschreibungen — eine Schranke auf einer '
      + 'geheimen Zahl ist selbst eine Aussage über sie, und das hat er am 6. September '
      + 'auch gefunden.',
  }),
  Object.freeze({
    nr: 6,
    datum: '28.08.',
    stichwort: 'Sortiment auf mindestens 100 Artikel',
    offen: Object.freeze({ datei: 'shop/src/offenepunkte.js', muster: /hundert Artikel/ }),
    warum: 'Die einzige Weisung, die **nicht** erfüllt ist — 46 Artikel sind das Maximum aus '
      + 'fünfzehn Rechnungen, und mehr geben sie nicht her. Sie ist deshalb nicht vergessen, '
      + 'sondern geführt: `npm run offenepunkte` nennt sie unter den Anfragen an Dritte, '
      + 'gelöst durch eine Artikelliste aus dem Kundenkonto des Lieferanten. Der Unterschied '
      + 'zwischen „offen" und „vergessen" ist genau diese Zeile.',
  }),
  Object.freeze({
    nr: 7,
    datum: '31.08.',
    stichwort: 'bauversand.com verwenden',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/data/betreiber.json', muster: /bauversand\.com/ }),
    ]),
    warum: 'Die Adresse steht in der Betreiberdatei und nicht als Konstante im Bauwerkzeug — '
      + 'bis zum 31. August war sie an zwei Stellen fest verdrahtet, und zwei Wege zu '
      + 'derselben Adresse heißen, dass einer beim nächsten Wechsel alt ist. Seiten, '
      + 'Sitemap, `llms.txt` und die finalen URLs der Anzeigen nehmen sie von dort.',
  }),
  Object.freeze({
    nr: 8,
    datum: '03.09.',
    stichwort: 'Auftritt als „Bauversand"',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/data/betreiber.json', muster: /"marke":\s*"Bauversand"/ }),
    ]),
    warum: 'Die Marke steht dort, wo der Kunde den Laden erkennt: Logo, Seitentitel, '
      + '`llms.txt`, Absender jedes Belegs. Die Freudenthaler Bau GmbH bleibt daneben die '
      + 'Betreiberin — Impressum, Belege, `seller` und `publisher`. Ein Feld, zwei Rollen, '
      + 'und das Impressum verbindet beide in einer Zeile.',
  }),
]);

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const GRUND_MINDESTLAENGE = 150;

/**
 * Hält die Weisungen gegen den Bestand — in beide Richtungen.
 *
 * @param {object} eingabe
 * @param {{nr: number, datum: string}[]} eingabe.weisungen  aus `weisungenAusParametern`
 * @param {(datei: string) => string|null} eingabe.lies
 */
export function weisungsbefund({ weisungen, lies, register = WEISUNGEN }) {
  const meldungen = [];
  const nachNr = new Map(register.map((w) => [w.nr, w]));

  for (const w of weisungen) {
    const e = nachNr.get(w.nr);
    if (!e) {
      meldungen.push({
        regel: 'weisung-vergessen',
        nr: w.nr,
        text: `Weisung ${w.nr} vom ${w.datum} steht in ${QUELLE} und in keinem Eintrag — `
          + 'weder erfüllt noch als offener Punkt geführt',
      });
      continue;
    }
    if (e.datum !== w.datum) {
      meldungen.push({
        regel: 'weisung-verschoben',
        nr: w.nr,
        text: `Weisung ${w.nr}: der Eintrag nennt ${e.datum}, in ${QUELLE} steht ${w.datum} — `
          + 'die Zeilen sind verrutscht, und der Eintrag beschreibt eine andere Weisung',
      });
    }
  }

  for (const e of register) {
    if (!weisungen.some((w) => w.nr === e.nr)) {
      meldungen.push({
        regel: 'eintrag-ohne-weisung',
        nr: e.nr,
        text: `Weisung ${e.nr} („${e.stichwort}") ist geführt, steht aber nicht mehr in ${QUELLE}`,
      });
    }
    if (e.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({ regel: 'grund-zu-kurz', nr: e.nr, text: `Weisung ${e.nr}: der Grund ist zu knapp` });
    }
    if (!!e.spuren === !!e.offen) {
      meldungen.push({
        regel: 'zustand-unklar',
        nr: e.nr,
        text: `Weisung ${e.nr}: entweder Spuren oder ein offener Punkt — nicht beides und nicht keines`,
      });
      continue;
    }
    for (const s of e.spuren ?? [e.offen]) {
      const text = lies(s.datei);
      if (text === null) {
        meldungen.push({
          regel: 'spur-fehlt',
          nr: e.nr,
          text: `Weisung ${e.nr}: ${s.datei} gibt es nicht mehr`,
        });
        continue;
      }
      if (!s.muster.test(text)) {
        meldungen.push({
          regel: e.offen ? 'offener-punkt-verschwunden' : 'spur-passt-nicht',
          nr: e.nr,
          text: e.offen
            ? `Weisung ${e.nr}: ${s.datei} führt sie nicht mehr als offenen Punkt — entweder `
              + 'ist sie erfüllt (dann gehört eine Spur her) oder sie ist unter den Tisch gefallen'
            : `Weisung ${e.nr}: ${s.datei} trägt ${s.muster} nicht mehr — die Weisung steht nur `
              + 'noch in PARAMETER.md',
        });
      }
    }
  }

  return {
    weisungen: weisungen.length,
    erfuellt: register.filter((w) => w.spuren).length,
    offen: register.filter((w) => w.offen).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
