/**
 * Zahlwege, ihre Gebühren und was sie den Deckungsbeitrag kosten.
 *
 * **Anlass.** In der gesamten Wirtschaftlichkeitsrechnung kommen
 * Zahlungsgebühren nicht vor — weder in `phase3-unit-economics.md` noch in
 * `phase4-sortiment-und-materialwert.md` noch in `phase5-technik.md`. Bei einem
 * Warenkorb von 650 € netto ist das keine Rundungsgröße: Ein Prozentsatz auf
 * den Bruttobetrag trifft eine Rohmarge von 32 % härter, als er aussieht.
 *
 * Der Trockenlauf hat den Zahlungseingang als eine der beiden harten Blockaden
 * benannt. Bevor dafür ein Anbieter gewählt wird — und das ist eine Ausgabe,
 * also freigabepflichtig — gehören die Bedingungen an einer Stelle
 * zusammengetragen und die Kosten gerechnet. Genau das tut diese Datei.
 *
 * Die Gebührensätze sind **öffentlich veröffentlichte Listenpreise**, kein
 * Angebot. Jeder trägt seine Quelle und seine Konfidenz mit; beim
 * B2B-Rechnungskauf ist sie niedrig, weil die Anbieter ihre Händlerkonditionen
 * nicht veröffentlichen.
 */

import { cent } from './preis.js';
import { zahlungszielTraegt } from './skonto.js';

/**
 * Zahlwege mit ihren Gebührenmodellen.
 *
 * `barumsatz` ist der Punkt aus `ablage-und-nummernkreis.md`: Zahlung vor Ort
 * löst die Registrierkassenpflicht aus, sobald 7.500 € im Jahr zusammenkommen.
 * `zahlungseingangMaschinell` entscheidet, ob die Kette aus dem Trockenlauf
 * überhaupt automatisch weiterlaufen kann.
 */
/**
 * Der lesbare Name eines Zahlwegs.
 *
 * **Die Kennung eines Zahlwegs ist eine Programmkennung, kein Kundenwort.**
 * `eps`, `karte-stripe`, `offene-rechnung` standen einmal wörtlich in der
 * AGB-Tabelle der Website. Sie verraten für sich genommen wenig — aber sie
 * waren der sichtbare Teil derselben Nachlässigkeit, die daneben die
 * Rohmarge ausgestellt hat: Die Seite gab aus, was im Datensatz stand,
 * statt das, was der Leser braucht.
 *
 * Stand bis zum 1. September als lokale Hilfsfunktion in `bin/website.mjs`
 * und war damit nur für die AGB-Seite zu haben. Der Zahlungsvermerk auf der
 * Rechnung braucht denselben Namen — und ein Beleg, der „eps" schreibt, wo
 * die Seite „eps-Überweisung im Online-Banking" sagt, ist derselbe Fehler
 * wie das Lieferantenkürzel in der Belegzeile: **Derselbe Kunde bekommt zur
 * selben Sache zwei Wörter.**
 *
 * Wirft bei unbekannter `id`, statt sie durchzureichen. Ein Zahlweg ohne
 * Eintrag hier ist ein Zahlweg, dessen Kosten niemand gerechnet hat.
 */
export function zahlwegName(id) {
  const z = ZAHLWEGE.find((w) => w.id === id);
  if (!z) throw new Error(`Zahlweg ohne Entsprechung in zahlung.js: ${id}`);
  if (!z.kundenname) throw new Error(`Zahlweg ohne Kundennamen: ${id}`);
  return z.kundenname;
}

export const ZAHLWEGE = [
  {
    id: 'vorkasse',
    name: 'Vorkasse per Überweisung',
    kundenname: 'Vorkasse per Überweisung',
    prozent: 0,
    fixEuro: 0,
    tageBisEingang: 1,
    barumsatz: false,
    zahlungseingangMaschinell: false,
    b2bUeblich: false,
    konfidenz: 'hoch',
    quelle: 'keine Gebühr; nur Kontoführung',
    anmerkung: 'Kostenlos, aber im B2B-Baustoffhandel ein Verkaufshindernis — und der Eingang muss vom Konto gelesen werden.',
  },
  {
    id: 'karte-stripe',
    name: 'Kreditkarte (EU-Karte, Listenpreis Stripe)',
    kundenname: 'Kreditkarte (EU-Karte)',
    prozent: 0.014,
    fixEuro: 0.25,
    tageBisEingang: 0,
    barumsatz: false,
    zahlungseingangMaschinell: true,
    b2bUeblich: false,
    konfidenz: 'hoch',
    quelle: 'Listenpreis 1,4 % + 0,25 € für europäische Karten',
    anmerkung: 'Karten außerhalb des EWR kosten deutlich mehr; im B2B kommen sie kaum vor.',
  },
  {
    id: 'karte-mollie',
    name: 'Kreditkarte (EU-Karte, Listenpreis Mollie)',
    kundenname: 'Kreditkarte (EU-Karte)',
    prozent: 0.018,
    fixEuro: 0.25,
    tageBisEingang: 0,
    barumsatz: false,
    zahlungseingangMaschinell: true,
    b2bUeblich: false,
    konfidenz: 'hoch',
    quelle: 'Listenpreis 1,8 % + 0,25 €',
    anmerkung: 'Teurer bei Karte, dafür EPS vorkonfiguriert.',
  },
  {
    id: 'eps',
    name: 'EPS-Onlineüberweisung',
    kundenname: 'EPS-Onlineüberweisung',
    prozent: 0.009,
    fixEuro: 0.25,
    tageBisEingang: 0,
    barumsatz: false,
    zahlungseingangMaschinell: true,
    b2bUeblich: true,
    konfidenz: 'mittel',
    quelle: 'Größenordnung; die Anbieter weisen EPS uneinheitlich aus',
    anmerkung: 'In Österreich verbreitet, sofortige Rückmeldung, kein Rückbuchungsrisiko wie bei Lastschrift.',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    kundenname: 'PayPal',
    prozent: 0.0249,
    fixEuro: 0.35,
    tageBisEingang: 0,
    barumsatz: false,
    zahlungseingangMaschinell: true,
    b2bUeblich: false,
    konfidenz: 'mittel',
    quelle: 'Listenpreis Größenordnung 2,49 % + 0,35 €',
    anmerkung: 'Bei diesen Warenkörben der teuerste elektronische Weg.',
  },
  {
    id: 'rechnungskauf',
    name: 'B2B-Rechnungskauf über einen Anbieter',
    kundenname: 'Rechnungskauf für Gewerbekunden',
    prozent: 0.03,
    fixEuro: 0,
    tageBisEingang: 0,
    barumsatz: false,
    zahlungseingangMaschinell: true,
    b2bUeblich: true,
    konfidenz: 'niedrig',
    quelle: 'Spanne 2–4 %, hier mit 3 % gerechnet — Händlerkonditionen sind nicht veröffentlicht',
    anmerkung: 'Der Anbieter trägt das Ausfallrisiko und zahlt sofort aus. Das ist der teuerste, aber der einzige Weg, der dem entspricht, was Handwerksbetriebe erwarten.',
  },
  {
    id: 'offene-rechnung',
    name: 'Offene Rechnung, 30 Tage netto — auf eigenes Risiko',
    kundenname: 'Offene Rechnung, 30 Tage netto',
    prozent: 0,
    fixEuro: 0,
    tageBisEingang: 30,
    barumsatz: false,
    zahlungseingangMaschinell: false,
    b2bUeblich: true,
    konfidenz: 'hoch',
    quelle: 'eigene Bedingung; keine Gebühr, weil kein Anbieter dazwischensteht',
    anmerkung:
      'Was Handwerksbetriebe tatsächlich erwarten — und der einzige Weg, der ohne Gebühr auskommt. '
      + 'Dafür kommt das Geld nach der Skontofrist, das Ausfallrisiko bleibt im Haus, und der Eingang '
      + 'muss vom Konto gelesen werden. Bis zum 26. August war dieser Weg mit dem Rechnungskauf ueber '
      + 'einen Anbieter in einer Zeile zusammengefasst; die beiden verhalten sich gegensaetzlich.',
  },
  {
    id: 'nachnahme',
    name: 'Nachnahme',
    kundenname: 'Nachnahme',
    prozent: 0,
    fixEuro: 6,
    tageBisEingang: 14,
    barumsatz: true,
    zahlungseingangMaschinell: false,
    b2bUeblich: true,
    konfidenz: 'mittel',
    quelle: 'Speditionsübliche Nachnahmegebühr',
    anmerkung: 'Ausgeschlossen: löst die Registrierkassenpflicht aus, siehe ablage-und-nummernkreis.md.',
  },
];

/* ------------------------------------------------------------------ *
 * Der Name des Zahlwegs hat zwei Leser — 5. September 2026
 *
 * **Der Befund.** `name` stand in einem Feld und ging an zwei Adressaten:
 *
 *   - an die **interne Kostentabelle** (`kostenbild.js`, `wirkungAufMonat`,
 *     `vergleiche`), wo „Listenpreis Stripe" genau die Angabe ist, die zählt —
 *     der Satz ist nicht verhandelt, und das gehört dazu;
 *   - an den **Kunden** (`beleg.js` und die AGB-Seite über `zahlwegName`), wo
 *     derselbe Text drei Dinge sagt, die ihn nichts angehen: dass wir einen
 *     Abwickler benutzen, welchen, und dass wir dessen Listenpreis zahlen.
 *
 * Nachgewiesen, nicht befürchtet: In `ausgabe/website.html` steht seit dem
 * ersten Bau der Seite
 *
 * > „Kreditkarte (EU-Karte, Listenpreis Stripe) — angeboten"
 *
 * für einen Anbieter, der **noch nicht gewählt ist**; der Absatz zwei Zeilen
 * darunter sagt das ausdrücklich.
 *
 * Der zweite Fall im selben Feld ist stiller und schlimmer: „Offene Rechnung,
 * 30 Tage netto — **auf eigenes Risiko**". Gemeint ist unser Risiko; auf einer
 * Kundenseite liest das jeder als seines.
 *
 * > **Ein Feld, zwei Leser — dieselbe Familie wie der Frachtsatz und der
 * > Bestellwert.**
 * ------------------------------------------------------------------ */

/**
 * Wörter, die in die interne Kostentabelle gehören und in keinen Kundentext.
 *
 * Das Register wird **in beide Richtungen** gehalten: `namensbefund` verlangt,
 * dass kein Kundenname eines dieser Wörter trägt — und dass jedes Wort in
 * mindestens einem internen Namen wirklich vorkommt. Ein Eintrag, den nichts
 * mehr betrifft, ist eine Regel, die grün bleibt, weil sie nichts prüft.
 */
export const INTERNE_WOERTER = Object.freeze([
  Object.freeze({
    wort: 'Stripe',
    warum: 'Der Abwickler hinter der Kartenzahlung. Der Kunde zahlt mit Karte, nicht bei '
      + 'Stripe — und gewählt ist der Anbieter noch gar nicht (Gate Zahlungsanbieter offen).',
  }),
  Object.freeze({
    wort: 'Mollie',
    warum: 'Derselbe Fall wie Stripe. Beide stehen nebeneinander in der Liste, weil sie '
      + 'verglichen werden; verglichen wird intern.',
  }),
  Object.freeze({
    wort: 'auf eigenes Risiko',
    warum: 'Gemeint ist unser Ausfallrisiko. In einer Kundentabelle steht es neben seinem '
      + 'Zahlweg und liest sich als seines — der Satz kehrt seine Bedeutung um, sobald er '
      + 'die Seite wechselt.',
  }),
]);

/**
 * **Warum „Listenpreis" allein nicht im Register steht.**
 *
 * Der erste Wurf führte das Wort für sich. Der Lauf meldete daraufhin
 * **216 Fundstellen in 47 Ausgabedateien** — und alle 216 waren richtig so:
 *
 * > „73 % unter dem Listenpreis des Lieferanten."
 *
 * Das ist der **Listenpreis des Herstellers**, die UVP. Sie steht auf jeder
 * Artikelseite, sie ist öffentlich, und der Abstand zu ihr ist das Argument
 * des Shops. Der „Listenpreis Stripe" ist der **Satz unseres Abwicklers**.
 * Ein Wort, zwei Sachen — und ein Prüfer, der 216 richtige Sätze anschwärzt,
 * um einen falschen zu finden, wird nach dem zweiten Lauf abgeschaltet; dann
 * meldet er auch den echten Fall nicht mehr.
 *
 * Gesucht wird deshalb der Abwickler beim Namen. Er kommt in beiden
 * Kartenzeilen vor und trägt den Listenpreis mit.
 */
export const NICHT_IM_REGISTER = Object.freeze([
  Object.freeze({
    wort: 'Listenpreis',
    warumNicht: 'Bezeichnet an 216 Fundstellen in 47 Ausgabedateien den Listenpreis des '
      + 'Herstellers — eine '
      + 'öffentliche Angabe und das Verkaufsargument des Shops. Nur in Gesellschaft eines '
      + 'Abwicklernamens ist es eine Angabe über unsere Kosten, und dafür genügt der Name.',
  }),
]);

/**
 * Hält die Kundennamen gegen das Register — in beide Richtungen.
 *
 * @param {Array} zahlwege
 * @param {Array<{wort: string, warum: string}>} woerter
 */
export function namensbefund(zahlwege = ZAHLWEGE, woerter = INTERNE_WOERTER) {
  const meldungen = [];

  for (const z of zahlwege) {
    if (!z.kundenname) {
      meldungen.push({ regel: 'kundenname-fehlt', id: z.id, text: `${z.id}: kein Kundenname` });
      continue;
    }
    for (const w of woerter) {
      if (z.kundenname.toLowerCase().includes(w.wort.toLowerCase())) {
        meldungen.push({
          regel: 'internes-wort-im-kundennamen',
          id: z.id,
          text: `${z.id}: „${w.wort}" steht im Kundennamen „${z.kundenname}"`,
        });
      }
    }
  }

  for (const w of NICHT_IM_REGISTER) {
    if (!w.warumNicht || w.warumNicht.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', wort: w.wort, text: `${w.wort}: Grund zu kurz` });
    }
    if (woerter.some((x) => x.wort.toLowerCase() === w.wort.toLowerCase())) {
      meldungen.push({
        regel: 'zweimal-gefuehrt',
        wort: w.wort,
        text: `„${w.wort}" steht im Register und in der Begründung, warum es nicht darin steht`,
      });
    }
  }

  for (const w of woerter) {
    if (!w.warum || w.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', wort: w.wort, text: `${w.wort}: Grund zu kurz` });
    }
    const trifft = zahlwege.some((z) => (z.name ?? '').toLowerCase().includes(w.wort.toLowerCase()));
    if (!trifft) {
      meldungen.push({
        regel: 'wort-ohne-fall',
        wort: w.wort,
        text: `„${w.wort}" kommt in keinem internen Namen vor — der Eintrag prüft nichts mehr`,
      });
    }
  }

  return {
    sauber: meldungen.length === 0,
    zahlwege: zahlwege.length,
    woerter: woerter.length,
    nichtGefuehrt: NICHT_IM_REGISTER.length,
    meldungen,
  };
}

/** Nachschlagen mit klarer Fehlermeldung. Einmal hier, damit es im Bündel nicht kollidiert. */
export const findeZahlweg = (id) => {
  const z = ZAHLWEGE.find((w) => w.id === id);
  if (!z) throw new Error(`Unbekannter Zahlweg: ${id}`);
  return z;
};

/** Gebühr für einen einzelnen Zahlungsvorgang über diesen Bruttobetrag. */
export function gebuehr(bruttobetrag, zahlwegId) {
  const z = findeZahlweg(zahlwegId);
  if (!(bruttobetrag > 0)) throw new Error('Die Gebühr braucht einen positiven Bruttobetrag');
  return cent(bruttobetrag * z.prozent + z.fixEuro);
}

/**
 * Was die Gebühr vom Deckungsbeitrag einer Bestellung wegnimmt.
 *
 * Die Gebühr fällt auf den **Bruttobetrag** an, der Deckungsbeitrag entsteht
 * aber nur auf dem Warenwert netto. Genau diese Schere macht den Unterschied
 * zwischen „1,4 %" und dem, was es wirklich kostet.
 */
export function wirkungAufBestellung(warenkorb, zahlwegId) {
  const betrag = gebuehr(warenkorb.summeBrutto, zahlwegId);
  const db = warenkorb.deckungsbeitragNetto;

  return {
    zahlweg: zahlwegId,
    bruttobetrag: warenkorb.summeBrutto,
    gebuehr: betrag,
    deckungsbeitragVorher: db,
    deckungsbeitragNachher: cent(db - betrag),
    anteilAmDeckungsbeitrag: db > 0 ? betrag / db : 0,
    // Was der Prozentsatz auf den Bruttobetrag am Warenwert netto wirklich ausmacht.
    effektivAufWarenwert: warenkorb.warenwertNetto > 0 ? betrag / warenkorb.warenwertNetto : 0,
  };
}

/**
 * Hochrechnung auf den Monat.
 *
 * Die Bemessungsgrundlage ist der volle Kundenzahlbetrag — Warenumsatz
 * **plus durchlaufende Fracht**, beides brutto. `wirkungAufBestellung` hat
 * das immer so gehalten (dort steht `summeBrutto`); diese Hochrechnung ließ
 * die Fracht aus und widersprach damit der eigenen Erklärung.
 *
 * @param {{umsatzNetto: number, bestellungen: number, zielgewinn: number, frachtProBestellungNetto?: number}} lage
 */
export function wirkungAufMonat(lage, zahlwegId) {
  const { umsatzNetto, bestellungen, zielgewinn, frachtProBestellungNetto = 0 } = lage;
  if (!(bestellungen > 0)) throw new Error('Die Hochrechnung braucht Bestellungen');

  const z = findeZahlweg(zahlwegId);
  const umsatzBrutto = cent((umsatzNetto + frachtProBestellungNetto * bestellungen) * 1.2);
  const betrag = cent(umsatzBrutto * z.prozent + z.fixEuro * bestellungen);

  return {
    zahlweg: zahlwegId,
    name: z.name,
    umsatzBrutto,
    gebuehrProMonat: betrag,
    anteilAmZielgewinn: zielgewinn > 0 ? betrag / zielgewinn : 0,
    konfidenz: z.konfidenz,
  };
}

/**
 * Die Bedingungen, die sich aus den bisherigen Bausteinen ergeben haben.
 *
 * Sie standen bisher in fünf verschiedenen Dokumenten. Hier stehen sie als
 * prüfbare Liste, damit die Auswahl später nicht wieder von vorn beginnt.
 */
export const ANFORDERUNGEN = [
  {
    id: 'keinBarumsatz',
    text: 'Löst keine Registrierkassenpflicht aus',
    herkunft: 'ablage-und-nummernkreis.md',
    erfuellt: (z) => z.barumsatz === false,
  },
  {
    id: 'eingangMaschinell',
    text: 'Meldet den Zahlungseingang maschinell zurück',
    herkunft: 'trockenlauf-auftrag.md — sonst bleibt die Kette stehen',
    erfuellt: (z) => z.zahlungseingangMaschinell === true,
  },
  {
    id: 'skontoErreichbar',
    text: 'Lässt das Lieferantenskonto erreichbar (Gate 21)',
    herkunft: 'zweiter-lieferant-und-skonto.md — 3 % Skonto wiegen schwerer als jede Zahlungsgebühr',
    // Maßgeblich ist nicht das Ziel auf der Kundenrechnung, sondern wann das
    // Geld im eigenen Konto liegt: Ein Anbieter, der sofort auszahlt, darf
    // dem Kunden dreißig Tage einräumen, ohne das Skonto zu kosten.
    erfuellt: (z) => zahlungszielTraegt({ kundenzielTage: z.tageBisEingang }).traegt,
  },
  {
    id: 'bezahlbar',
    text: 'Kostet höchstens 10 % des Zielgewinns',
    herkunft: 'PARAMETER.md — 5.374 € Gewinn vor Steuer',
    erfuellt: (z, lage) => wirkungAufMonat(lage, z.id).anteilAmZielgewinn <= 0.10,
  },
];

/** Prüft einen Zahlweg gegen alle Anforderungen. */
export function pruefeZahlweg(zahlwegId, lage) {
  const z = findeZahlweg(zahlwegId);
  const ergebnisse = ANFORDERUNGEN.map((a) => ({
    id: a.id,
    text: a.text,
    herkunft: a.herkunft,
    erfuellt: a.erfuellt(z, lage),
  }));

  return {
    zahlweg: zahlwegId,
    name: z.name,
    geeignet: ergebnisse.every((e) => e.erfuellt),
    verletzt: ergebnisse.filter((e) => !e.erfuellt).map((e) => e.text),
    ergebnisse,
  };
}

/** Alle Zahlwege gegen die Anforderungen, nach Monatskosten aufsteigend. */
export function vergleiche(lage) {
  return ZAHLWEGE.map((z) => ({
    ...pruefeZahlweg(z.id, lage),
    ...wirkungAufMonat(lage, z.id),
    b2bUeblich: z.b2bUeblich,
    anmerkung: z.anmerkung,
  })).sort((a, b) => a.gebuehrProMonat - b.gebuehrProMonat);
}
