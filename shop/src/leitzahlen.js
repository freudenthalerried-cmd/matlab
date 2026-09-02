/**
 * Die Leitzahlen — jene Werte, die in mehr als einem Dokument stehen.
 *
 * **Warum es diese Datei gibt.** Am 1. September stellte sich heraus, dass der
 * nötige Monatsumsatz seit vier Tagen mit **45.356 €** in der Akte stand: der
 * Kartenzahl vom 25. August, zwei Tage älter als Gate 21, das EPS entschied.
 * Gefunden hat es keine Prüfung, sondern ein Zufall — die Kennzahlenseite
 * rechnete dieselbe Größe neu und kam auf 43.396 €.
 *
 * Nach der Berichtigung stand die alte Zahl immer noch an **achtundzwanzig
 * Stellen**. Die meisten davon zu Recht: `marge-25-prozent.md` rechnet
 * ausdrücklich mit Karte, das Gate-Register erzählt die Entscheidung, das
 * Widerrufsregister führt sie als abgelöste Behauptung. Aber ohne Werkzeug
 * lässt sich das eine nicht vom anderen trennen.
 *
 * > **Eine Zahl, die in acht Dokumenten steht, wird in keinem gepflegt.**
 *
 * Die Regel ist deshalb dieselbe wie im Widerrufsregister und nicht strenger:
 * Eine überholte Zahl darf stehen — **wenn ihre Bedingung danebensteht.**
 * „45.356 € (Karte)" ist richtig. „45.356 €" allein ist es nicht mehr.
 *
 * Was hier **nicht** steht: jede Zahl der Akte. Ein Prüfer, der jede Ziffer
 * als Behauptung liest, meldet jede Artikelnummer. Aufgenommen wird eine Zahl
 * erst, wenn sie **gerechnet** ist, in **mehr als einem Dokument** steht und
 * eine **Entscheidung trägt**.
 */

import { noetigerUmsatz } from './kostenbild.js';
import { quoteAmMarktboden } from './werbewirkung.js';
import { WIDERRUFSMERKMAL, sichtfeld, SICHTWEITE } from './widerruf.js';

/**
 * Die Register-Einträge.
 *
 * `jetzt(ziel, umfeld)` rechnet den heute gültigen Wert — nie eine eingetragene Zahl,
 * wobei `umfeld` trägt, was nicht aus den Zielgrößen folgt (die Zahl der
 * Begriffe etwa steht in der erzeugten Messliste und nirgends sonst),
 * sonst hätte das Register dasselbe Problem wie die Dokumente.
 * `abgeloest` sind die Werte, die einmal gegolten haben, jeder mit dem Grund
 * **und seiner eigenen `bedingung`**.
 *
 * **Die Bedingung gehört an den abgelösten Wert, nicht an die Leitzahl.** Der
 * erste Anlauf hatte eine gemeinsame, weite Fassung — `karte|skonto|20 %|alte|
 * damals|stand|seit dem` — und deckte damit 102 von 103 Fundstellen. Eine
 * Ausnahme, die fast alles trifft, ist keine Ausnahme.
 *
 * > **Ein Prüfer, dessen Freibrief überall gilt, meldet grün und hat nichts
 * > angesehen.**
 *
 * Jetzt rechtfertigt nur das Wort die Zahl, das sie tatsächlich erklärt:
 * „Karte" die 45.356, „Zuschlag" die 72.740, „Skonto" die 38.786. Dazu die
 * Berichtigungsmerkmale aus dem Widerrufsregister — ein „berichtigt am" deckt
 * jede abgelöste Zahl, weil es genau das sagt.
 */
export const LEITZAHLEN = Object.freeze([
  Object.freeze({
    id: 'noetiger-monatsumsatz',
    name: 'Nötiger Monatsumsatz',
    traegt: 'Die ganze Wirtschaftlichkeitsrechnung — aus ihr folgen Bestellzahl, '
      + 'Werbebudget und leistbarer Klickpreis.',
    jetzt: (ziel) => Math.round(noetigerUmsatz(ziel, ziel.zahlweg).umsatzNetto),
    // Die Lesart „25 % Zuschlag" ist am 26.08. **zurückgenommen** worden: Der
    // Auftraggeber hat „25 %" als Marge vom Verkauf geklärt (`marge-25-prozent.md`).
    // Sie steht unten nur als Grund für eine abgelöste Zahl.
    abgeloest: Object.freeze([
      Object.freeze({ wert: 45356, weil: 'Zahlweg Kreditkarte, gerechnet am 25.08.', bedingung: /karte|stripe/i }),
      Object.freeze({ wert: 72740, weil: '20 % Rohmarge — die Lesart „25 % Zuschlag" vor dem 25.08.', bedingung: /20 %|zuschlag/i }),
      Object.freeze({ wert: 38786, weil: 'Karte mit 3 % Skonto', bedingung: /karte|skonto/i }),
    ]),
  }),
  Object.freeze({
    id: 'bestellungen-je-monat',
    name: 'Bestellungen im Monat',
    traegt: 'Die Zahl, die der Betrieb von Hand schaffen muss, solange keine '
      + 'Schnittstelle da ist.',
    jetzt: (ziel) => noetigerUmsatz(ziel, ziel.zahlweg).bestellungen,
    abgeloest: Object.freeze([
      Object.freeze({ wert: 70, weil: 'Zahlweg Kreditkarte', bedingung: /karte|stripe/i }),
      Object.freeze({ wert: 112, weil: '20 % Rohmarge', bedingung: /20 %|zuschlag/i }),
    ]),
    // Bestellzahlen sind kleine Zahlen und stehen überall; ohne enge Fassung
    // meldet der Prüfer Seitenzahlen und Artikelmengen. Deshalb nur, wo das
    // Wort „Bestellungen" in derselben Zeile steht — siehe `zeilenmuster`.
    zeilenmuster: /Bestellungen/i,
  }),
  Object.freeze({
    id: 'keyword-anzahl',
    name: 'Begriffe der Messliste',
    traegt: 'Was der Auftraggeber im Keyword-Planer eintippt, und woran der '
      + 'Bedarf von 2.500 bis 6.700 Suchanfragen je Monat hängt.',
    // **Warum diese Zahl hier steht.** Am 1. September ist „Kaminkopf
    // Regenhaube" aus der Kampagne genommen worden — die Kaminkopfverkleidung
    // führt der Shop nicht, und ein Suchwort ist kein Werbeversprechen. Aus 33
    // wurden 32. Die neue Zahl stand danach in **einer** Datei, die alte in
    // **elf**: zwei Quelltexten und neun Dokumenten. Genau der Fall, für den
    // dieses Register gebaut ist — und die Zahl stand nicht darin.
    jetzt: (ziel, umfeld) => umfeld?.keywordAnzahl ?? null,
    abgeloest: Object.freeze([
      Object.freeze({
        wert: 33,
        weil: 'vor dem 01.09., als „Kaminkopf Regenhaube" noch in der Kampagne stand',
        // Eng gefasst: „1. September" und „zurückgenommen" stehen in dieser Akte
        // auf zu vielen Zeilen. Eine Bedingung, die überall zutrifft, deckt alles
        // und prüft nichts — beim ersten Lauf blieb genau deshalb eine Fundstelle
        // in STATUS.md unbemerkt.
        bedingung: /Kaminkopf|erste[nrs]? An(?:lauf|zeigenanlauf)|01\.09\./i,
      }),
    ]),
    // Kleine Zahlen stehen überall. Ohne diese Fassung meldet der Prüfer jede
    // Seitenzahl und jede Artikelmenge — dieselbe Vorsicht wie bei den
    // Bestellungen.
    zeilenmuster: /Keyword|Begriff|Suchbegriff|Suchwort/i,
  }),
  Object.freeze({
    id: 'quote-am-marktboden',
    name: 'Kaufquote am Marktboden',
    traegt: 'Darunter trägt das Modell nicht einmal den billigsten Marktklick — '
      + 'das erste der drei größten Risiken.',
    jetzt: (ziel) => {
      const u = noetigerUmsatz(ziel, ziel.zahlweg);
      const q = quoteAmMarktboden({
        werbebudgetJeMonat: u.umsatzNetto * ziel.werbeanteil,
        bestellungen: u.bestellungen,
        marktUnten: 0.5,
      });
      return Number((q * 100).toFixed(2));
    },
    // Noch nie abgelöst — der Eintrag steht trotzdem, damit die Zahl gezählt
    // und mitgerechnet wird, bevor sie es wird. Ein Register, in das man erst
    // nach dem Schaden einträgt, ist eine Chronik.
    abgeloest: Object.freeze([]),
    zeilenmuster: /quote|klick/i,
  }),
]);

/** Wie eine Zahl in deutschem Fließtext aussehen kann. */
export function schreibweisen(wert) {
  const ganz = Math.round(wert);
  const formen = new Set();
  formen.add(String(ganz));
  formen.add(ganz.toLocaleString('de-AT').replace(/ /g, '.'));
  formen.add(ganz.toLocaleString('de-DE'));
  if (!Number.isInteger(wert)) formen.add(String(wert).replace('.', ','));
  return [...formen];
}

const entwerte = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Sucht eine Zahl in einem Text und sagt je Fundstelle, ob ihre Bedingung
 * in Sichtweite steht.
 *
 * @param {string} text
 * @param {number} wert
 * @param {{bedingung: RegExp, zeilenmuster?: RegExp, sichtweite?: number}} opt
 */
/**
 * Steht die Zahl in einer Spanne statt als Behauptung?
 *
 * „zwischen 60 und 70 Bestellungen" nennt keine Leitzahl, es umreißt eine
 * Größenordnung. Der erste Lauf hat genau diesen Satz gemeldet — die einzige
 * Meldung, und sie war falsch. Eine Spanne ist keine Angabe.
 */
export function inSpanne(zeile, form) {
  const z = entwerte(form);
  return new RegExp(`(zwischen\\s+[\\d.,]+\\s+und\\s+${z}|${z}\\s+(?:bis|–|—|-)\\s*[\\d.,]|[\\d.,]+\\s*(?:bis|–|—)\\s*${z})`, 'i').test(zeile);
}

export function fundstellen(text, wert, { bedingung, zeilenmuster = null, sichtweite = SICHTWEITE } = {}) {
  const zeilen = text.split('\n');
  const formen = schreibweisen(wert).map(entwerte).sort((a, b) => b.length - a.length);
  // Wortgrenzen von Hand: `\b` trennt an Punkt und Komma und würde „45.356"
  // in zwei Treffer zerlegen. Geprüft wird deshalb auf keine Ziffer davor und
  // keine Ziffer, kein Punkt und kein Komma danach.
  const muster = new RegExp(`(?<![\\d.,])(?:${formen.join('|')})(?![\\d.,]*\\d)`);
  const treffer = [];

  for (const [i, zeile] of zeilen.entries()) {
    if (!muster.test(zeile)) continue;
    if (zeilenmuster && !zeilenmuster.test(zeile)) continue;
    if (schreibweisen(wert).some((f) => inSpanne(zeile, f))) continue;
    const umfeld = sichtfeld(text, i + 1, sichtweite);
    treffer.push({
      zeile: i + 1,
      inhalt: zeile.trim().slice(0, 120),
      gedeckt: (bedingung ? bedingung.test(umfeld) : false) || WIDERRUFSMERKMAL.test(umfeld),
    });
  }
  return treffer;
}

/**
 * Die Dokumente, in denen der **gültige** Wert stehen muss.
 *
 * **Der Grund ist eine misslungene Gegenprobe.** Um zu sehen, ob der Prüfer
 * findet, wofür er gebaut ist, habe ich in `PARAMETER.md` die alte Zahl wieder
 * eingesetzt — und er meldete **nichts**. Denn direkt daneben steht meine
 * eigene Berichtigung, und die enthält das Wort „Kreditkarte". Die Bedingung
 * war in Sichtweite, also galt der Fund als gedeckt.
 *
 * > **Ein Freibrief in Sichtweite deckt auch den, der ihn nicht verdient.**
 * > Die Regel „abgelöste Zahl braucht ihre Bedingung" kann nicht unterscheiden,
 * > ob eine Zahl zitiert oder behauptet wird.
 *
 * Deshalb die zweite Regel, die von der anderen Seite kommt: In den führenden
 * Dokumenten muss der **heute gültige** Wert vorkommen — **und zwar vor jedem
 * abgelösten.**
 *
 * Auch die bloße Anwesenheit reichte nicht. Der zweite Anlauf der Gegenprobe
 * ersetzte in `PARAMETER.md` beide gültigen Vorkommen durch die alte Zahl, und
 * der Prüfer schwieg wieder: Die gültige Zahl stand weiterhin in der
 * Berichtigung weiter unten. **Anwesend ist nicht dasselbe wie führend.** Wer
 * ein Dokument aufschlägt, liest die erste Zahl, nicht die vollständigste.
 */
export const LEITDOKUMENTE = Object.freeze([
  'docs/baustoff-shop/PARAMETER.md',
  'docs/baustoff-shop/pr-beschreibung.md',
]);

/**
 * Prüft eine Datei gegen das ganze Register.
 *
 * @param {string} text
 * @param {string} name
 * @param {object} ziel  die Zielgrößen
 */
export function pruefeLeitzahlen(text, name, ziel, register = LEITZAHLEN, umfeld = {}) {
  const meldungen = [];
  const gefunden = [];

  const istLeitdokument = LEITDOKUMENTE.some((d) => name.endsWith(d) || d.endsWith(name));

  for (const lz of register) {
    const gueltig = lz.jetzt(ziel, umfeld);
    const aktuelle = fundstellen(text, gueltig, lz);
    for (const f of aktuelle) {
      gefunden.push({ leitzahl: lz.id, wert: gueltig, aktuell: true, ...f });
    }
    if (istLeitdokument) {
      if (aktuelle.length === 0) {
        meldungen.push({
          datei: name,
          zeile: 0,
          leitzahl: lz.id,
          text: `${lz.name} kommt in diesem führenden Dokument gar nicht mit dem gültigen Wert `
            + `${gueltig} vor. Ein Leitdokument, das die Leitzahl nicht nennt, führt nichts.`,
          inhalt: '',
        });
      } else {
        const ersteAlte = lz.abgeloest
          .flatMap((a) => fundstellen(text, a.wert, { ...lz, bedingung: a.bedingung }).map((f) => f.zeile))
          .sort((a, b) => a - b)[0];
        if (ersteAlte !== undefined && ersteAlte < aktuelle[0].zeile) {
          meldungen.push({
            datei: name,
            zeile: ersteAlte,
            leitzahl: lz.id,
            text: `${lz.name}: Die abgelöste Zahl steht in Zeile ${ersteAlte}, die gültige `
              + `(${gueltig}) erst in Zeile ${aktuelle[0].zeile}. Wer ein führendes Dokument `
              + 'aufschlägt, liest die erste Zahl, nicht die vollständigste.',
            inhalt: '',
          });
        }
      }
    }
    for (const alt of lz.abgeloest) {
      for (const f of fundstellen(text, alt.wert, { ...lz, bedingung: alt.bedingung })) {
        gefunden.push({ leitzahl: lz.id, wert: alt.wert, aktuell: false, ...f });
        if (!f.gedeckt) {
          meldungen.push({
            datei: name,
            zeile: f.zeile,
            leitzahl: lz.id,
            text: `${lz.name} steht mit ${alt.wert} ohne ihre Bedingung — gültig ist ${gueltig}. `
              + `Abgelöst: ${alt.weil}`,
            inhalt: f.inhalt,
          });
        }
      }
    }
  }

  return { datei: name, gefunden, meldungen, sauber: meldungen.length === 0 };
}
