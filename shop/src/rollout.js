/**
 * Der Weg von heute bis zur Entscheidung — als Kette, nicht als Kalender.
 *
 * **Warum es das bis zum 1. September nicht gab.** Der Ursprungsauftrag
 * verlangt als zwölftes Ergebnis einen `rollout-90-tage.md`. Der
 * Auftragsabgleich hat ihn als *offen* geführt, mit der Begründung: Eine
 * Zeitachse ließe sich nicht ehrlich schreiben, solange die tragende Annahme
 * — die Kaufquote — nicht gemessen ist.
 *
 * Die Begründung stimmt für einen **Kalender** und ist falsch für einen
 * **Plan**. „Woche 3: Anzeigen schalten" behauptet ein Datum, das niemand
 * halten kann, weil der erste Schritt eine Freigabe des Auftraggebers ist und
 * der zweite eine Antwort des Lieferanten. Was sich ehrlich schreiben lässt,
 * ist die Kette:
 *
 * > **Nicht „Woche 3", sondern „Tag N nach der Freigabe, die davor liegt."**
 *
 * Alles hängt an Ereignissen, die andere auslösen. Dieses Modul rechnet aus,
 * wie lange die Kette ist, welcher Strang sie bestimmt und ob die Entscheidung
 * in neunzig Tage passt.
 *
 * Jede Dauer trägt ihre Art:
 *
 *   `gerechnet`      folgt aus Budget, Klickpreis und Abbruchschwelle
 *   `gesetzt`        meine Annahme, mit Begründung — keine Messung
 *   `fremdbestimmt`  Wartezeit auf Dritte; die Zahl ist eine Annahme und
 *                    sagt nichts über die Wirklichkeit
 *
 * Wer die Kette abkürzen will, muss die Wartezeiten kürzen, nicht die Arbeit.
 */

import { abbruchschwelle, TAGE_JE_MONAT } from './werbewirkung.js';

/**
 * Die Etappen. `brauchtVor` ist die Abhängigkeit, nicht die Reihenfolge —
 * was nicht voneinander abhängt, läuft nebeneinander.
 */
export const ETAPPEN = Object.freeze([
  Object.freeze({
    id: 'repository-privat',
    titel: 'Repository privat stellen',
    zustaendig: 'entscheidung',
    brauchtVor: [],
    tage: 0,
    art: 'gesetzt',
    woher: 'Ein Klick in den GitHub-Einstellungen.',
    gate: null,
    warumKeinGate: 'Kein Gate — eine Sicherheitsfrage, keine Modellentscheidung.',
    ergebnis: 'Solange es öffentlich ist, sind 44 von 46 Einkaufspreisen rekonstruierbar.',
  }),
  Object.freeze({
    id: 'impressum',
    titel: 'Vier Impressumsangaben eintragen (E-Mail, Telefon, UID, Gewerbewortlaut)',
    zustaendig: 'eintragen',
    brauchtVor: [],
    tage: 1,
    art: 'gesetzt',
    woher: 'Die Angaben liegen beim Auftraggeber vor; einzutragen ist eine Datei.',
    gate: null,
    warumKeinGate: 'Kein Gate — eine gesetzliche Pflicht nach § 5 ECG, keine Entscheidung.',
    ergebnis: 'Ohne E-Mail hat die fertig gerechnete Kundenanfrage keinen Empfänger.',
  }),
  Object.freeze({
    id: 'lieferantengespraech',
    titel: 'Ein Gespräch mit dem Lieferanten',
    zustaendig: 'anfrage',
    brauchtVor: [],
    tage: 7,
    art: 'fremdbestimmt',
    woher: 'Angenommene Antwortzeit eines Baustoffhändlers auf eine Kundenanfrage. '
      + 'Keine Messung — die Zahl ist ein Platzhalter, den eine Terminzusage ersetzt.',
    ergebnis: 'Löst acht offene Punkte auf einmal: Lieferzeit, Preisrhythmus, Liefergebiet '
      + 'und — über eine Artikelliste mit EAN-Spalte — GTIN, Marke und Bild.',
    gate: 'Gate 6 und Gate 23',
  }),
  Object.freeze({
    id: 'katalog-erweitern',
    titel: 'Katalog aus der Artikelliste auf mindestens 100 Artikel erweitern',
    zustaendig: 'werkzeug',
    brauchtVor: ['lieferantengespraech'],
    tage: 2,
    art: 'gesetzt',
    woher: 'Einlesen, zuordnen, prüfen — Arbeit an vorliegenden Daten, keine Wartezeit.',
    gate: 'Gate 22 und Gate 24',
    ergebnis: 'Erfüllt die Weisung vom 25.08. und macht den Feed einreichbar.',
  }),
  Object.freeze({
    id: 'rechtstexte',
    titel: 'Rechtstexte mit verbindlichem Wortlaut beauftragen',
    zustaendig: 'ausgabe',
    brauchtVor: [],
    tage: 10,
    art: 'fremdbestimmt',
    woher: 'Angenommene Bearbeitungszeit eines Rechtstexteanbieters. Die Vorarbeit '
      + '(Gliederung mit Begründungen) liegt fertig vor und verkürzt sie.',
    gate: null,
    warumKeinGate: 'Kein Gate — Pflichttexte, über die nichts zu entscheiden ist.',
    ergebnis: 'AGB, Widerruf und Datenschutz als Wortlaut statt als Gerüst.',
  }),
  Object.freeze({
    id: 'keywordmessung',
    titel: 'Suchvolumen der 33 Keywords im Liefergebiet messen',
    zustaendig: 'entscheidung',
    brauchtVor: [],
    tage: 1,
    art: 'gesetzt',
    woher: 'Keyword-Planer, kostenlos, ein Ads-Konto ohne geschaltete Kampagne. '
      + 'Liste steht: npm run messliste.',
    ergebnis: 'Sagt, ob der Markt die gerechneten Klicks überhaupt hergibt. '
      + 'Ist er zu klein, dauert der Versuch ein Vielfaches — oder findet nicht statt.',
    gate: 'Gate 15',
  }),
  Object.freeze({
    id: 'upload',
    titel: 'ausgabe/site/ auf bauversand.com hochladen',
    zustaendig: 'entscheidung',
    brauchtVor: ['impressum', 'rechtstexte'],
    tage: 1,
    art: 'gesetzt',
    woher: 'Ein FTP-Vorgang. Die Abhängigkeit ist keine technische: Das Impressum-Gerüst '
      + 'sagt selbst, dass es so nicht online gehen darf.',
    gate: null,
    warumKeinGate: 'Kein Gate — ein Vorgang, keine Entscheidung. Die Gates davor sind erfüllt oder nicht.',
    ergebnis: 'Ohne erreichbare Seite kein Klick, keine Auffindbarkeit, keine Anfrage.',
  }),
  Object.freeze({
    id: 'zahlungsanbieter',
    titel: 'Zahlungsanbieter wählen und anbinden',
    zustaendig: 'ausgabe',
    brauchtVor: ['impressum'],
    tage: 10,
    art: 'fremdbestimmt',
    woher: 'Angenommene Dauer der Legitimationsprüfung. Sie braucht die UID, deshalb '
      + 'hängt sie am Impressum.',
    gate: 'Gate 21',
    ergebnis: 'Erst danach kann die Kasse etwas auslösen. Vorher erzeugt der Shop Anfragen.',
  }),
  Object.freeze({
    id: 'feed-einreichen',
    titel: 'Produktfeed bei Google Merchant einreichen',
    zustaendig: 'entscheidung',
    brauchtVor: ['upload', 'katalog-erweitern'],
    tage: 3,
    art: 'fremdbestimmt',
    woher: 'Angenommene Prüfdauer bei Google. Eine erfundene GTIN sperrt das Konto, '
      + 'deshalb steht die Artikelliste zwingend davor.',
    gate: 'Gate 6',
    ergebnis: 'Ohne angenommenen Feed kein Shopping-Kanal.',
  }),
  Object.freeze({
    id: 'anzeigen-schalten',
    titel: 'Die drei Suchkampagnen des ersten Anlaufs schalten',
    zustaendig: 'ausgabe',
    brauchtVor: ['upload', 'keywordmessung'],
    tage: 1,
    art: 'gesetzt',
    woher: 'Die Kampagnen stehen fertig und pausiert. Das Schalten selbst ist ein Schalter.',
    gate: null,
    warumKeinGate: 'Kein Gate — ein Schalter. Was zu entscheiden war, steht in den Etappen davor.',
    ergebnis: 'Ab hier läuft die Uhr des Versuchs — und das Budget.',
  }),
  Object.freeze({
    id: 'klickversuch',
    titel: 'Klicks sammeln, bis die Kaufquote entschieden ist',
    zustaendig: 'entscheidung',
    brauchtVor: ['anzeigen-schalten'],
    tage: null,
    art: 'gerechnet',
    woher: 'Aus Tagesbudget, Klickpreis und der Abbruchschwelle — siehe werbewirkung.js.',
    ergebnis: 'Ein Verkauf beendet ihn früher. Bleibt er aus, schließt die Schwelle die '
      + 'Quote aus, für die das Modell gerechnet ist.',
    gate: 'Gate 20',
  }),
]);

/** Die Etappe zu einer Kennung, oder ein Fehler — kein stilles Überspringen. */
function etappeVon(liste, id) {
  const e = liste.find((x) => x.id === id);
  if (!e) throw new Error(`Etappe „${id}" steht in brauchtVor, aber nicht in ETAPPEN`);
  return e;
}

/**
 * Rechnet die Kette durch.
 *
 * @param {object} p
 * @param {number} p.tagesbudget    Euro je Tag über alle Anzeigengruppen
 * @param {number} p.klickpreis     Euro je Klick
 * @param {number} p.quote          Kaufquote, die ausgeschlossen werden soll (0…1)
 * @param {number} [p.frist]        Frist in Tagen, gegen die geprüft wird
 * @param {object[]} [p.etappen]
 */
export function rolloutplan({ tagesbudget, klickpreis, quote, frist = 90, etappen = ETAPPEN }) {
  if (!(tagesbudget > 0) || !(klickpreis > 0)) throw new Error('Tagesbudget und Klickpreis müssen positiv sein');
  if (!(quote > 0) || quote >= 1) throw new Error('Die Quote muss zwischen 0 und 1 liegen');

  const schwelleKlicks = abbruchschwelle(quote);
  const klicksJeTag = tagesbudget / klickpreis;
  const versuchstage = Math.ceil(schwelleKlicks / klicksJeTag);

  const dauerVon = (e) => (e.id === 'klickversuch' ? versuchstage : e.tage);

  // Frühester Beginn: die längste Kette der Vorbedingungen. Zyklen fallen
  // durch die Tiefenbegrenzung auf — eine Kette kann nicht länger sein als die
  // Liste selbst.
  const fertigAm = new Map();
  const beginnAm = new Map();
  const rechne = (e, tiefe) => {
    if (tiefe > etappen.length) throw new Error(`Ringschluss in brauchtVor bei „${e.id}"`);
    if (fertigAm.has(e.id)) return fertigAm.get(e.id);
    const beginn = e.brauchtVor.reduce((max, id) => Math.max(max, rechne(etappeVon(etappen, id), tiefe + 1)), 0);
    beginnAm.set(e.id, beginn);
    const ende = beginn + dauerVon(e);
    fertigAm.set(e.id, ende);
    return ende;
  };
  for (const e of etappen) rechne(e, 0);

  const gesamt = Math.max(...fertigAm.values());

  // Der bestimmende Strang: rückwärts von der spätesten Etappe über den
  // jeweils spätesten Vorgänger.
  const letzte = etappen.find((e) => fertigAm.get(e.id) === gesamt);
  const strang = [];
  let lauf = letzte;
  while (lauf) {
    strang.unshift(lauf.id);
    const vor = lauf.brauchtVor
      .map((id) => etappeVon(etappen, id))
      .sort((a, b) => fertigAm.get(b.id) - fertigAm.get(a.id))[0];
    lauf = vor;
  }

  const plan = etappen
    .map((e) => ({
      ...e,
      dauer: dauerVon(e),
      beginntTag: beginnAm.get(e.id),
      fertigTag: fertigAm.get(e.id),
      imStrang: strang.includes(e.id),
    }))
    .sort((a, b) => a.beginntTag - b.beginntTag || a.fertigTag - b.fertigTag);

  // Wartezeit auf Dritte im bestimmenden Strang — die Zahl, die sagt, wo
  // gedrückt werden muss.
  const wartenImStrang = plan
    .filter((e) => e.imStrang && e.art === 'fremdbestimmt')
    .reduce((n, e) => n + e.dauer, 0);

  return {
    plan: plan.map((e) => ({ ...e, woche: Math.floor(e.beginntTag / 7) + 1 })),
    strang,
    gesamt,
    frist,
    passt: gesamt <= frist,
    versuch: { schwelleKlicks, klicksJeTag, versuchstage, klickpreis, tagesbudget, quote },
    wartenImStrang,
    // Drei Größen, die sich nicht überschneiden dürfen. Der erste Lauf zählte
    // den Versuch als Arbeit mit und meldete „45 Tage Versuch, 47 Tage
    // Arbeit" bei einer Kette von 57 — eine Summe, die niemand nachrechnet
    // und die niemandem auffällt, weil sie plausibel aussieht.
    arbeitImStrang: plan
      .filter((e) => e.imStrang && e.art === 'gesetzt')
      .reduce((n, e) => n + e.dauer, 0),
    tageJeMonat: TAGE_JE_MONAT,
  };
}
