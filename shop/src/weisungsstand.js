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
  // **Fünf Weisungen nachgetragen am 11. September 2026.** Sie standen in
  // Dokumenten, die sie im Wortlaut festhalten, und in keiner Zeile der Tafel
  // — und damit in keinem Prüfer. Der Befund steht in `quellenbefund` unten.
  Object.freeze({
    nr: 3,
    datum: '22.08.',
    stichwort: 'Von KI-Assistenten genannt werden',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/maschinenlesbar.js', muster: /llms/i }),
    ]),
    warum: 'Die Weisung, die sechs Dokumente als Zweck des ganzen Baus nennen — und die bis '
      + 'zum 11. September in keiner Zeile dieser Tafel stand. Gebaut ist sie: `llms.txt` als '
      + 'Datei für Sprachmodelle, strukturierte Daten je Artikel, getrennte Crawler-Kennungen '
      + 'für Training und KI-Suche. Dass etwas gebaut ist, ersetzt den Eintrag nicht: Ein '
      + 'Prüfer, der die Tafel liest, kann nur finden, was in der Tafel steht.',
  }),
  Object.freeze({
    nr: 4,
    datum: '22.08.',
    stichwort: 'Für KI lesbar, geprüfte Inhalte, eigenes Prüfteam',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/bin/inhaltspruefung.mjs', muster: /Absätze geprüft/ }),
    ]),
    warum: 'Der Auftraggeber hat ein Team verlangt, das die Richtigkeit der Aussagen prüft. '
      + 'Ein Team gibt es nicht und wird es hier nicht geben; was es gibt, ist eine Prüfkette, '
      + 'die jede belegpflichtige Aussage der Inhaltsseiten gegen ihren Beleg hält und rot '
      + 'endet, wenn einer fehlt. Das ist die Sache der Weisung, nicht ihr Wortlaut — und '
      + 'genau diese Unterscheidung trifft dieser Prüfer: geprüft wird die Sache.',
  }),
  Object.freeze({
    nr: 5,
    datum: '22.08.',
    stichwort: 'YouTube zusammenfassen, prüfen, verwenden',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/quellen.js', muster: /export function istBelegt/ }),
    ]),
    warum: 'Von drei Schritten ist der mittlere gebaut und die beiden äußeren verweigert, mit '
      + 'Grund: YouTube ist aus dieser Umgebung gesperrt, und ein fremdes Transkript wäre '
      + 'urheberrechtlich fremdes Material — beides steht seit dem 22. August im Wortlaut in '
      + '`videos-als-quelle.md`. Was daraus wurde, ist `npm run pruefe-quellen`: jede '
      + 'belegpflichtige Aussage gegen ihre Quelle. Eine Weisung, die man teilweise ausführt, '
      + 'gehört genauso in die Tafel wie eine, die man ganz ausführt.',
  }),
  Object.freeze({
    nr: 6,
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
    nr: 7,
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
    nr: 8,
    datum: '26.08.',
    stichwort: 'Eher auf die Produkte konzentrieren',
    spuren: Object.freeze([
      Object.freeze({ datei: 'shop/src/systemlisten.js', muster: /export function systemlistenbefund/ }),
    ]),
    warum: 'Die kürzeste Weisung dieser Tafel und die folgenreichste für die Inhalte: Gebaut '
      + 'sind seither die Systemlisten — keine Wissensseite, sondern eine Bestellung mit '
      + 'Begründung, vier Listen über fünfunddreißig Positionen. Sie sind der produktnächste '
      + 'Inhalt, den dieser Shop hat, und sie sind aus dieser einen Zeile entstanden.',
  }),
  Object.freeze({
    nr: 9,
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
    nr: 10,
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
    nr: 11,
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
    nr: 12,
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
  Object.freeze({
    nr: 13,
    datum: '03.09.',
    stichwort: '„Baustoffe zum Baumeisterpreis" soll nicht bleiben',
    offen: Object.freeze({ datei: 'shop/src/offenepunkte.js', muster: /Überschrift der Startseite/ }),
    warum: 'Die teuerste der fünf nachgetragenen Weisungen. Der Auftraggeber hat am '
      + '3. September gesagt, die Überschrift solle nicht bleiben; drei Fassungen liegen ihm '
      + 'seither zur Wahl vor, und umgesetzt wird keine, bis er wählt. Bis zum 11. September '
      + 'stand sie in keiner Zeile dieser Tafel **und** in keiner Liste offener Punkte — acht '
      + 'Tage lang trug die `<h1>` der Startseite genau den Satz, der nicht bleiben soll. '
      + 'Nicht erfüllt und nicht geführt heißt vergessen, und das ist der Zustand, für den es '
      + 'diesen Prüfer gibt.',
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

/* ------------------------------------------------------------------
 * **Der Anlass, 11. September 2026 — Runde 29.**
 *
 * Dieser Prüfer hält die Weisungstafel gegen den Bestand und meldet seit vier
 * Tagen „0 vergessen". Die Zahl stimmt und sagt weniger, als sie klingt:
 * **Er misst die Tafel, nicht das, was der Auftraggeber gesagt hat.**
 *
 * Neun Dokumente halten in ihrem Kopf eine Weisung im Wortlaut fest. Die
 * Tafel hat acht Zeilen. Gemessen an diesem Tag standen **fünf** dieser
 * Weisungen in keiner davon:
 *
 * | Dokument | Datum | Weisung |
 * |---|---|---|
 * | `ki-sichtbarkeit-konzept.md` | 22.08. | von KI-Assistenten genannt werden |
 * | `inhalte-und-pruefteam.md` | 22.08. | für KI lesbar, geprüfte Inhalte, eigenes Prüfteam |
 * | `videos-als-quelle.md` | 22.08. | „youtube: fasse zusammen, überprüfe, verwende content" |
 * | `systemliste-kellerwand.md` | 26.08. | „eher auf die Produkte konzentrieren" |
 * | `die-ueberschrift-der-startseite.md` | 03.09. | „Baustoffe zum Baumeisterpreis" soll nicht bleiben |
 *
 * Die letzte ist die teuerste: Der Auftraggeber hat am 3. September gesagt,
 * die Überschrift solle **nicht bleiben**. Am 11. September stand sie noch
 * genauso in der `<h1>` der Startseite — nicht erfüllt, und in keiner Liste
 * offener Punkte. **Vergessen**, also genau der dritte Zustand, für den es
 * diesen Prüfer gibt; er konnte sie nur nicht sehen.
 *
 * Der Kopf der Tafel sagt seit dem 3. September: *„Diese Tafel ist ab jetzt
 * der Ort, an dem eine Weisung des Auftraggebers als Erstes landet."* An
 * demselben Tag ist eine daneben gelandet, zum zweiten Mal.
 *
 * > **Ein Prüfer, der eine Liste gegen den Bestand hält, misst die Liste.**
 * ------------------------------------------------------------------ */

/** Wo eine Weisung im Wortlaut festgehalten wird — Kopfzeilen eines Dokuments. */
export const KOPFZEILEN = 14;

/** Woran ein solcher Kopf zu erkennen ist. */
export const WEISUNGSKOPF = /Weisung des Auftraggebers/;

/**
 * Dokumente, deren Kopf die Wendung trägt und trotzdem **keine** Weisung
 * festhält — mit Grund.
 *
 * Ohne diese Liste hätte der Prüfer zwei Möglichkeiten, und beide wären
 * falsch: jede Fundstelle als Weisung zählen (dann meldet er Zitate über die
 * Tafel selbst) oder das Muster enger ziehen, bis es passt (dann übersieht er
 * die nächste, die anders formuliert ist).
 */
export const KEIN_WEISUNGSKOPF = Object.freeze([
  Object.freeze({
    datei: 'die-regel-hielt-sechs-stunden.md',
    warum: 'Der Kopf zitiert die Regel **über** die Tafel — „Diese Tafel ist ab jetzt der Ort, '
      + 'an dem eine Weisung des Auftraggebers als Erstes landet" —, nicht eine Weisung. Das '
      + 'Dokument handelt davon, dass genau diese Regel sechs Stunden gehalten hat; es hält '
      + 'die Markenweisung nicht fest, sondern ihren Weg an der Tafel vorbei.',
  }),
]);

/**
 * Hält die Weisungstafel gegen die Dokumente, die eine Weisung im Wortlaut
 * festhalten — die Richtung, die bis heute fehlte.
 *
 * @param {{datei: string, kopf: string}[]} dokumente  Dateiname und Kopfzeilen
 * @param {{nr: number, datum: string, weisung: string}[]} weisungen  aus der Tafel
 * @param {string} tafeltext  die Tafel im Wortlaut — dort stehen die Belege
 */
export function quellenbefund(dokumente, weisungen, tafeltext, ausnahmen = KEIN_WEISUNGSKOPF) {
  const meldungen = [];
  const ohneGrund = new Set(ausnahmen.map((a) => a.datei));

  for (const a of ausnahmen) {
    if (!dokumente.some((d) => d.datei === a.datei)) {
      meldungen.push({
        regel: 'ausnahme-ohne-dokument',
        text: `${a.datei} steht als Ausnahme und trägt die Wendung im Kopf nicht (mehr)`,
      });
    }
    if (!a.warum || a.warum.length < 80) {
      meldungen.push({
        regel: 'ausnahme-ohne-grund',
        text: `${a.datei}: der Grund trägt die Ausnahme nicht`,
      });
    }
  }

  const quellen = dokumente.filter((d) => WEISUNGSKOPF.test(d.kopf) && !ohneGrund.has(d.datei));
  if (!quellen.length) {
    meldungen.push({
      regel: 'keine-quelle-gefunden',
      text: 'Kein einziges Dokument hält eine Weisung im Wortlaut fest — '
        + 'dieser Befund prüft damit nichts',
    });
    return { quellen: 0, meldungen, sauber: false };
  }

  /*
   * **Gemessen wird der Beleg, nicht das Datum.** Zwei Weisungen desselben
   * Tages wären sonst dieselbe Zeile; und ein Dokument, das erst später
   * entsteht, trüge ein anderes Datum als die Tafel. Die Tafel nennt in ihrer
   * Folgespalte die Datei — daran hängt der Abgleich.
   */
  for (const q of quellen) {
    if (tafeltext.includes(q.datei)) continue;
    meldungen.push({
      regel: 'weisung-ohne-zeile',
      text: `${q.datei} hält eine Weisung im Wortlaut fest, und keine Zeile der Tafel `
        + 'nennt das Dokument',
    });
  }

  return {
    quellen: quellen.length,
    ausnahmen: ausnahmen.length,
    zeilen: weisungen.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
