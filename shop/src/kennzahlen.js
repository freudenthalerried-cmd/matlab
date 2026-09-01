/**
 * Die Kennzahlen, an denen dieses Vorhaben gemessen wird — vor dem ersten
 * Besucher aufgeschrieben.
 *
 * **Warum es das bis zum 1. September nicht gab.** Elftes Ergebnis des
 * Ursprungsauftrags: ein KPI-Dashboard als teilbare Seite. Der
 * Auftragsabgleich hat es als *offen* geführt, mit der Begründung: *„Es wäre
 * heute auch leer. Ein Dashboard ohne Daten ist ein Rahmen, der Betrieb
 * vortäuscht."*
 *
 * Der Einwand trifft eine **vorgetäuschte** Fassung — die mit Kurven, die bei
 * null verlaufen, und Kacheln, die „0 €" zeigen, als wäre gerade nichts
 * verkauft worden. Er trifft nicht die Sache. Denn was ein Dashboard vor dem
 * Start leisten kann, ist genau das, was es nachher nicht mehr kann:
 *
 * > **Festlegen, was gemessen wird, gegen welche Schwelle — und welche
 * > Entscheidung daran hängt.** Danach ist die Versuchung da, die Schwelle zu
 * > verschieben, weil man die Zahl schon kennt.
 *
 * Dieselbe Disziplin wie bei der vorab festgelegten Abbruchregel. Deshalb
 * trägt hier jede Kennzahl vier Dinge und nicht eines: den **Ist**-Wert (oder
 * ehrlich `null`), die **Schwelle**, die **Herkunft** der Schwelle und die
 * **Entscheidung**, die bei Erreichen fällt.
 *
 * `ist: null` heißt *nicht gemessen* und wird auch so ausgegeben — nie als
 * Null. Eine Null ist ein Messergebnis, ein Strich ist keines.
 */

import { noetigerUmsatz } from './kostenbild.js';
import { abbruchschwelle, leistbarerKlickpreis, quoteAmMarktboden } from './werbewirkung.js';

/** Wohin die Kennzahl laufen soll, damit sie die Schwelle „hält". */
export const RICHTUNGEN = Object.freeze({
  mindestens: 'Die Schwelle ist ein Boden — darunter trägt es nicht.',
  hoechstens: 'Die Schwelle ist eine Decke — darüber trägt es nicht.',
  genau: 'Die Schwelle ist ein Ziel, kein Grenzwert.',
});

/** Die drei Abschnitte, in denen gemessen wird — sie folgen aufeinander. */
export const ABSCHNITTE = Object.freeze([
  { id: 'freigabe', titel: 'Vor dem Start', wann: 'jetzt', frage: 'Was fehlt noch, bevor irgendetwas laufen kann?' },
  { id: 'versuch', titel: 'Der Versuch', wann: 'ab dem Schalten der Anzeigen', frage: 'Gibt es die Kaufquote, für die gerechnet wurde?' },
  { id: 'betrieb', titel: 'Der Betrieb', wann: 'ab dem ersten Verkauf', frage: 'Trägt das Modell die Zielgröße?' },
]);

const prozent = (x) => `${(x * 100).toFixed(2).replace('.', ',')} %`;

/**
 * Baut die Kennzahlenliste aus den Quellen, die sie ohnehin schon rechnen.
 *
 * Nichts hier wird noch einmal ausgerechnet — jede Schwelle kommt aus dem
 * Modul, das sie verantwortet. Eine zweite Rechnung wäre eine zweite Wahrheit.
 *
 * @param {object} p
 * @param {object} p.ziel        `data/zielgroessen.json`
 * @param {object} [p.gemessen]  bekannte Ist-Werte, je Kennzahl-Kennung
 * @param {object} [p.offen]     Zählung der offenen Punkte je Zuständigkeit; `null`
 *                               heißt **nicht erhoben** und nicht „keine"
 * @param {number} [p.klickpreis]
 * @param {number} [p.quote]     Kaufquote, die der Versuch ausschließen soll
 */
export function kennzahlen({ ziel, gemessen = {}, offen = null, klickpreis = 1.5, quote = 0.01 }) {
  const umsatz = noetigerUmsatz(ziel, ziel.zahlweg);
  if (!umsatz.tragfaehig) throw new Error(`Zielgrößen tragen sich nicht: ${umsatz.grund}`);

  const schwelleKlicks = abbruchschwelle(quote);
  const budgetJeMonat = umsatz.umsatzNetto * ziel.werbeanteil;
  // Gerechnet, nicht abgeschrieben. Die 0,77 % stehen in der Risikoliste; sie
  // hier als Zahl einzutragen hieße, eine gerechnete Größe zu einer gesetzten
  // zu machen — genau der Fehler, den die Schaufensterprüfung sonst findet.
  const bodenQuote = quoteAmMarktboden({
    werbebudgetJeMonat: budgetJeMonat,
    bestellungen: umsatz.bestellungen,
    marktUnten: 0.5,
  });

  const liste = [
    {
      id: 'freigaben-offen',
      abschnitt: 'freigabe',
      name: 'Offene Punkte, die nur der Auftraggeber schließen kann',
      einheit: 'Punkte',
      schwelle: 0,
      richtung: 'hoechstens',
      herkunft: 'npm run offenepunkte — Zuständigkeiten anfrage, ausgabe, entscheidung, eintragen',
      entscheidung: 'Solange einer offen ist, kann der Versuch nicht starten.',
    },
    {
      id: 'suchvolumen-gemessen',
      abschnitt: 'freigabe',
      name: 'Keywords mit gemessenem Suchvolumen',
      einheit: 'von 33',
      schwelle: 33,
      richtung: 'mindestens',
      herkunft: 'npm run messliste — die Liste steht, die Messung ist kostenlos',
      entscheidung: 'Reicht das Volumen das Budget nicht aus, dauert der Versuch ein Vielfaches — '
        + 'oder er findet nicht statt.',
    },
    {
      id: 'klicks',
      abschnitt: 'versuch',
      name: 'Klicks ohne Bestellung',
      einheit: 'Klicks',
      schwelle: schwelleKlicks,
      richtung: 'genau',
      herkunft: `abbruchschwelle(${prozent(quote)}) = ln(0,05)/ln(1−q), 95 % Sicherheit`,
      entscheidung: `Bei ${schwelleKlicks} Klicks ohne Bestellung ist eine Kaufquote von `
        + `${prozent(quote)} ausgeschlossen. Vorab festgelegt — nicht nachträglich verschiebbar.`,
    },
    {
      id: 'werbeausgabe-versuch',
      abschnitt: 'versuch',
      name: 'Ausgegeben bis zur Schwelle',
      einheit: '€',
      schwelle: Number((schwelleKlicks * klickpreis).toFixed(2)),
      richtung: 'hoechstens',
      herkunft: `${schwelleKlicks} Klicks × ${klickpreis.toFixed(2)} € — der gerechnete Preis des Wissens`,
      entscheidung: 'Was der Versuch kostet, steht vorher fest. Wird er teurer, ist der Klickpreis '
        + 'höher als angenommen und die Frist länger.',
    },
    {
      id: 'kaufquote',
      abschnitt: 'versuch',
      name: 'Gemessene Kaufquote',
      einheit: '%',
      schwelle: bodenQuote,
      richtung: 'mindestens',
      herkunft: 'leistbarerKlickpreis() gegen den unteren Marktpreis von 0,50 €',
      entscheidung: `Unter ${prozent(bodenQuote)} trägt das Modell nicht einmal den billigsten `
        + 'Marktklick. Dann ist der Klickkanal kein Kanal.',
    },
    {
      id: 'monatsumsatz',
      abschnitt: 'betrieb',
      name: 'Monatsumsatz netto',
      einheit: '€',
      schwelle: umsatz.umsatzNetto,
      richtung: 'mindestens',
      herkunft: `noetigerUmsatz() aus Zielgewinn ${ziel.zielgewinn} €, Fixkosten ${ziel.fixkosten} €, `
        + `Rohmarge ${prozent(ziel.rohmarge)}, Zahlweg ${ziel.zahlweg}`,
      entscheidung: 'Darunter wird der Zielgewinn nicht erreicht.',
    },
    {
      id: 'bestellungen',
      abschnitt: 'betrieb',
      name: 'Bestellungen im Monat',
      einheit: 'Stück',
      schwelle: umsatz.bestellungen,
      richtung: 'mindestens',
      herkunft: `Monatsumsatz ÷ Warenkorb ${ziel.warenkorbNetto} €`,
      entscheidung: 'Die Zahl, die der Betrieb von Hand schaffen muss, solange keine Schnittstelle da ist.',
    },
    {
      id: 'werbeanteil',
      abschnitt: 'betrieb',
      name: 'Werbeanteil am Umsatz',
      einheit: '%',
      schwelle: 0.23,
      richtung: 'hoechstens',
      herkunft: 'Tragfähigkeitsgrenze bei 25 % Rohmarge — empfindlichkeit.js',
      entscheidung: 'Darüber frisst die Werbung den Deckungsbeitrag auf.',
    },
    {
      id: 'werbebudget',
      abschnitt: 'betrieb',
      name: 'Werbebudget im Monat',
      einheit: '€',
      schwelle: Number(budgetJeMonat.toFixed(2)),
      richtung: 'genau',
      herkunft: `Monatsumsatz × geplanter Werbeanteil ${prozent(ziel.werbeanteil)}`,
      entscheidung: 'Der Rahmen, in dem sich der leistbare Klickpreis bewegt.',
    },
    {
      id: 'leistbarer-klickpreis',
      abschnitt: 'betrieb',
      name: 'Leistbarer Klickpreis bei gemessener Quote',
      einheit: '€',
      schwelle: Number(
        leistbarerKlickpreis({
          werbebudgetJeMonat: budgetJeMonat,
          bestellungen: umsatz.bestellungen,
          quote: ziel.umsatzProSession,
        }).klickpreis.toFixed(2),
      ),
      richtung: 'mindestens',
      herkunft: `leistbarerKlickpreis() bei der geplanten Quote ${prozent(ziel.umsatzProSession)}`,
      entscheidung: 'Liegt er unter dem Marktpreis, ist bei dieser Quote kein Gebot tragfähig.',
    },
  ];

  return liste.map((k) => {
    // **Kein `offen` heißt nicht „null offene Punkte".** Die erste Fassung
    // summierte ein leeres Objekt zu 0 und meldete die Kennzahl als gemessen
    // und gehalten — ein Dashboard, das ohne Daten eine glatte Bilanz zeigt.
    // Genau der Einwand, gegen den diese Datei geschrieben ist.
    const ist = k.id === 'freigaben-offen'
      ? (offen === null ? null : Object.values(offen).reduce((n, x) => n + x, 0))
      : (Object.prototype.hasOwnProperty.call(gemessen, k.id) ? gemessen[k.id] : null);
    return {
      ...k,
      ist,
      gemessen: ist !== null && ist !== undefined,
      haelt: ist === null || ist === undefined ? null : haeltSchwelle(ist, k.schwelle, k.richtung),
      richtungText: RICHTUNGEN[k.richtung],
    };
  });
}

/** Hält der Ist-Wert die Schwelle? `genau` kennt kein Halten — nur Erreichen. */
export function haeltSchwelle(ist, schwelle, richtung) {
  if (richtung === 'mindestens') return ist >= schwelle;
  if (richtung === 'hoechstens') return ist <= schwelle;
  return null;
}

/** Was die Liste über sich selbst sagt. */
export function kennzahlbefund(liste) {
  const gemessen = liste.filter((k) => k.gemessen);
  return {
    gesamt: liste.length,
    gemessen: gemessen.length,
    ungemessen: liste.length - gemessen.length,
    reissend: gemessen.filter((k) => k.haelt === false).map((k) => k.id),
    jeAbschnitt: ABSCHNITTE.map((a) => ({
      ...a,
      kennzahlen: liste.filter((k) => k.abschnitt === a.id),
    })),
  };
}
