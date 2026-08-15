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

/**
 * Zahlwege mit ihren Gebührenmodellen.
 *
 * `barumsatz` ist der Punkt aus `ablage-und-nummernkreis.md`: Zahlung vor Ort
 * löst die Registrierkassenpflicht aus, sobald 7.500 € im Jahr zusammenkommen.
 * `zahlungseingangMaschinell` entscheidet, ob die Kette aus dem Trockenlauf
 * überhaupt automatisch weiterlaufen kann.
 */
export const ZAHLWEGE = [
  {
    id: 'vorkasse',
    name: 'Vorkasse per Überweisung',
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
    id: 'nachnahme',
    name: 'Nachnahme',
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
 * @param {{umsatzNetto: number, bestellungen: number, zielgewinn: number}} lage
 */
export function wirkungAufMonat(lage, zahlwegId) {
  const { umsatzNetto, bestellungen, zielgewinn } = lage;
  if (!(bestellungen > 0)) throw new Error('Die Hochrechnung braucht Bestellungen');

  const z = findeZahlweg(zahlwegId);
  const umsatzBrutto = cent(umsatzNetto * 1.2);
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
