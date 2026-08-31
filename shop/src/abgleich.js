/**
 * Der Abgleich zwischen dem, was der Shop verspricht, und dem, was er tut.
 *
 * Die vorige Runde hat drei Befunde geliefert — ein Margenleck, einen
 * Widerspruch zwischen zwei AGB-Punkten und eine Ablehnung ohne
 * veröffentlichte Grundlage. Alle drei kamen aus einer **Durchsicht von Hand**:
 * dreizehn AGB-Punkte neben elf Ablaufschritte gelegt und verglichen.
 *
 * Eine Durchsicht findet nur, wonach man an dem Tag gesehen hat. Diese Datei
 * macht daraus ein Werkzeug — nach demselben Muster wie das Verzeichnis der
 * Fremdtext-Ausgänge: **Was hier nicht steht, ist unbelegt.**
 *
 * **Warum die Zuordnung nicht bloß eine Behauptung ist.** Der Fehler, der in
 * diesem Projekt schon zweimal aufgetreten ist: Eine Prüfung vergleicht eine
 * Erklärung mit sich selbst und geht immer auf. Hier zeigt jede Zuordnung
 * deshalb auf **Namen, die es geben muss** — eine Schritt-Kennung aus
 * `SCHRITTE`, eine exportierte Funktion aus einem Modul. `pruefeAbgleich`
 * schlägt jedes Ziel nach. Wird ein Schritt umbenannt oder eine Funktion
 * entfernt, fällt der Abgleich um, statt weiter zu behaupten.
 *
 * Was das Werkzeug **nicht** kann: Ob die benannte Funktion das Versprechen
 * auch einlöst, sieht es nicht. Es prüft, dass eine Zuordnung besteht und dass
 * ihr Ziel existiert — nicht, dass sie stimmt. Dafür sind die Testfälle der
 * jeweiligen Datei da.
 */

import { AGB_GLIEDERUNG, DATENSCHUTZ_GLIEDERUNG } from './rechtstexte.js';
import { SCHRITTE } from './auftragslauf.js';

/**
 * Womit ein AGB-Punkt eingelöst wird.
 *
 *   `code`      eine Funktion, die das Versprechen durchsetzt
 *   `ablauf`    ein Schritt in `SCHRITTE`
 *   `beleg`     ein Text, der an den Kunden geht
 *   `klausel`   reine Vertragsklausel, im Ablauf ohne Entsprechung
 *
 * `klausel` ist kein Schlupfloch, sondern eine Aussage: Für Gerichtsstand oder
 * Haftungsausschluss **gibt es** nichts umzusetzen. Wer einen Punkt so
 * einordnet, sagt das ausdrücklich, statt ihn stillschweigend auszulassen.
 */
export const ARTEN_DER_UMSETZUNG = ['code', 'ablauf', 'beleg', 'klausel'];

export const ZUORDNUNG = [
  {
    nr: 1,
    art: 'code',
    modul: 'kunde.js',
    ziel: ['pruefeBestelldaten'],
    wie: 'Gate 7 — ohne Unternehmerbestätigung und UID keine gültige Bestellung.',
  },
  {
    nr: 2,
    art: 'ablauf',
    ziel: ['annahme'],
    wie: 'Der Vertrag kommt mit der Auftragsbestätigung zustande; der Schritt steht vor der Zahlung.',
  },
  {
    nr: 3,
    art: 'beleg',
    modul: 'beleg.js',
    ziel: ['erzeugeRechnung', 'reihengeschaeftEinordnung'],
    wie: 'Nettopreise mit gesonderter Umsatzsteuer; das Reihengeschäft betrifft die Eingangsseite.',
  },
  {
    nr: 4,
    art: 'code',
    modul: 'warenkorb.js',
    ziel: ['berechneWarenkorb'],
    wie: 'Aufteilung nach Lieferant — Teillieferungen entstehen zwangsläufig.',
  },
  {
    nr: 5,
    art: 'code',
    modul: 'preis.js',
    ziel: ['mindestbestellwertErfuellt'],
    wie: 'Der Mindestbestellwert des Herstellers, gemessen am Bestellwert.',
  },
  {
    nr: 6,
    art: 'code',
    modul: 'preis.js',
    ziel: ['fracht'],
    wie: 'Fracht je Lieferant mit Sperrgutzuschlag; Abladen steht im Angebotstext.',
  },
  {
    nr: 7,
    art: 'code',
    modul: 'kunde.js',
    ziel: ['baueAuftrag'],
    wie: 'Abweichende Baustelle mit eigenem Ansprechpartner vor Ort.',
  },
  {
    nr: 8,
    art: 'beleg',
    modul: 'rechtstexte.js',
    ziel: ['lieferhinweise'],
    wie: '§ 377 UGB — die Rügefrist steht vor der Bestellung und in der Auftragsbestätigung.',
  },
  {
    nr: 9,
    art: 'code',
    modul: 'zahlung.js',
    ziel: ['pruefeZahlweg'],
    wie: 'Die Anforderung „kein Barumsatz" schließt Nachnahme und Barzahlung aus.',
  },
  { nr: 10, art: 'klausel', wie: 'Gewährleistung und Haftung sind Vertragsrecht, nicht Ablauf.' },
  { nr: 11, art: 'klausel', wie: 'Rücknahme angebrochener Gebinde — der Shop kennt keine Rücknahme.' },
  {
    nr: 12,
    art: 'code',
    modul: 'kunde.js',
    ziel: ['pruefeBestelldaten'],
    wie: 'Lieferland AT ist Pflicht; alles andere wird abgewiesen.',
  },
  { nr: 13, art: 'klausel', wie: 'Gerichtsstand und anwendbares Recht sind Vertragsrecht.' },
];

/**
 * Ablaufschritte, die keinen eigenen AGB-Punkt brauchen — mit Begründung.
 *
 * Die Gegenrichtung ist die unbequemere: Was der Shop **tut**, ohne dass es in
 * den AGB steht, ist gefährlicher als ein AGB-Punkt ohne Umsetzung. Genau so
 * ist die fehlende Mindestbestellmenge aufgefallen.
 */
export const SCHRITTE_OHNE_AGB = {
  eingang: 'Die Bestellung entgegenzunehmen ist kein Versprechen.',
  datenpruefung: 'Setzt Punkt 1 und Punkt 12 um, hat aber keinen eigenen Punkt nötig.',
  uidPruefung: 'Teil der Unternehmerprüfung nach Punkt 1.',
  zahlung: 'Punkt 9 regelt die Zahlung; der Schritt stellt nur den Eingang fest.',
  'bestellauslösung': 'Innenverhältnis zum Lieferanten — den Kunden betrifft es über Punkt 4.',
  lieferantenbestaetigung: 'Papier des Lieferanten an uns, kein Vorgang gegenüber dem Kunden.',
  terminauskunft: 'Auskunft, keine Zusage — die Lieferzeit steht in der Auftragsbestätigung.',
  lieferung: 'Punkt 4, 6 und 8 regeln sie; der Schritt selbst verspricht nichts.',
  rechnung: 'Punkt 3 regelt die Rechnung.',
  buchung: 'Rein innerbetrieblich, § 132 BAO.',
};

/**
 * Prüft den Abgleich in beide Richtungen.
 *
 * @param {object} module  Abbildung Dateiname → Modul, für das Nachschlagen der Ziele
 */
export function pruefeAbgleich(module = {}, tafeln = {}) {
  // **Ergänzt am 31.08.: die Tafeln sind hereinreichbar.**
  //
  // Bis dahin las diese Funktion `ZUORDNUNG`, `AGB_GLIEDERUNG`, `SCHRITTE` und
  // `SCHRITTE_OHNE_AGB` unmittelbar aus dem Modul. Weil diese vier Tafeln im
  // Bestand zueinander passen, meldete sie **immer** „vollständig" — und
  // sieben ihrer Mängelzweige waren von keinem Testfall erreichbar.
  //
  // Der Dateikopf oben warnt genau davor: „Eine Prüfung vergleicht eine
  // Erklärung mit sich selbst und geht immer auf." Für die Ziele war das
  // längst gelöst — die Module kommen als Parameter herein, und ein
  // weggelassenes Modul lässt die Prüfung durchfallen. Für die Tafeln selbst
  // war es nicht gelöst.
  //
  // Die Vorgabewerte sind der Bestand; jeder Aufruf ohne zweites Argument
  // verhält sich wie zuvor.
  const {
    zuordnung = ZUORDNUNG,
    gliederung = AGB_GLIEDERUNG,
    schritte = SCHRITTE,
    ohneAgb = SCHRITTE_OHNE_AGB,
  } = tafeln;

  const maengel = [];

  const punkte = new Map(gliederung.map((a) => [a.nr, a]));
  const schrittIds = new Set(schritte.map((s) => s.id));
  const zugeordnet = new Set();

  for (const z of zuordnung) {
    if (!punkte.has(z.nr)) {
      maengel.push(`Zuordnung für Punkt ${z.nr} — den Punkt gibt es nicht`);
      continue;
    }
    if (zugeordnet.has(z.nr)) maengel.push(`Punkt ${z.nr} ist doppelt zugeordnet`);
    zugeordnet.add(z.nr);

    if (!ARTEN_DER_UMSETZUNG.includes(z.art)) {
      maengel.push(`Punkt ${z.nr}: unbekannte Art der Umsetzung „${z.art}"`);
      continue;
    }
    if (!z.wie || z.wie.trim() === '') maengel.push(`Punkt ${z.nr}: ohne Begründung`);

    if (z.art === 'klausel') {
      if (z.ziel) maengel.push(`Punkt ${z.nr}: als Klausel eingeordnet, nennt aber ein Ziel`);
      continue;
    }

    if (!Array.isArray(z.ziel) || z.ziel.length === 0) {
      maengel.push(`Punkt ${z.nr}: ${z.art}, aber ohne Ziel`);
      continue;
    }

    // Hier wird es ernst: Jedes Ziel muss es wirklich geben.
    for (const ziel of z.ziel) {
      if (z.art === 'ablauf') {
        if (!schrittIds.has(ziel)) maengel.push(`Punkt ${z.nr}: Ablaufschritt „${ziel}" gibt es nicht`);
        continue;
      }
      const modul = module[z.modul];
      if (!modul) {
        maengel.push(`Punkt ${z.nr}: Modul „${z.modul}" wurde nicht übergeben`);
        continue;
      }
      if (typeof modul[ziel] !== 'function') {
        maengel.push(`Punkt ${z.nr}: ${z.modul} exportiert keine Funktion „${ziel}"`);
      }
    }
  }

  for (const a of gliederung) {
    if (!zugeordnet.has(a.nr)) {
      maengel.push(`AGB-Punkt ${a.nr} („${a.titel}") hat keine Zuordnung — Versprechen ohne Umsetzung`);
    }
  }

  // Die Gegenrichtung: ein Ablaufschritt, den weder eine Zuordnung noch eine
  // Begründung nennt, ist Verhalten ohne veröffentlichte Grundlage.
  const ausAgb = new Set(zuordnung.filter((z) => z.art === 'ablauf').flatMap((z) => z.ziel ?? []));
  for (const s of schritte) {
    if (ausAgb.has(s.id)) continue;
    if (!ohneAgb[s.id]) {
      maengel.push(`Ablaufschritt „${s.id}" steht in keinem AGB-Punkt und ist nicht begründet`);
    }
  }
  for (const id of Object.keys(ohneAgb)) {
    if (!schrittIds.has(id)) maengel.push(`Begründung für Schritt „${id}" — den Schritt gibt es nicht`);
  }

  return { vollstaendig: maengel.length === 0, maengel };
}

/** Die Übersicht, wie sie ein Mensch liest. */
export function alsUebersicht() {
  const punkte = new Map(AGB_GLIEDERUNG.map((a) => [a.nr, a]));
  return ZUORDNUNG.map((z) => ({
    nr: z.nr,
    titel: punkte.get(z.nr)?.titel ?? '— unbekannter Punkt —',
    art: z.art,
    ziel: z.art === 'klausel' ? '—' : `${z.modul ? z.modul + ': ' : ''}${(z.ziel ?? []).join(', ')}`,
    wie: z.wie,
  }));
}

/**
 * Welche personenbezogenen Daten der Shop tatsächlich verarbeitet — und wohin
 * sie gehen.
 *
 * Dieselbe Gegenrichtung wie oben, auf ein anderes Papier angewandt: Nicht
 * „steht in der Erklärung etwas, das der Shop nicht tut", sondern **„tut der
 * Shop etwas, das in der Erklärung nicht steht"**. Die zweite Frage ist die
 * unbequemere und die einzige, die vor einer Beschwerde schützt.
 *
 * Der Befund dieser Runde steckt in den beiden letzten Zeilen: Der
 * **Ansprechpartner vor Ort** ist ein Dritter. Er hat mit dem Shop keinen
 * Vertrag, seine Nummer geht trotzdem an die Spedition eines Lieferanten, und
 * Art. 6 Abs. 1 lit. b trägt das nicht. Dasselbe bei der UID-Abfrage: Bei
 * einem Einzelunternehmer ist die UID personenbezogen, und die Abfrage ist
 * eine Übermittlung.
 *
 * `traegtPunkt` verweist auf den Punkt der Datenschutzgliederung, der den Fluss
 * abdeckt — geprüft wird, dass es ihn gibt.
 */
export const DATENFLUESSE = [
  {
    datum: 'Firmenname, Anschrift, UID des Bestellers',
    quelle: 'Bestellformular',
    empfaenger: ['Betreiber'],
    grundlage: 'Art. 6 Abs. 1 lit. b DSGVO',
    traegtPunkt: 'Welche Daten bei der Bestellung verarbeitet werden',
  },
  {
    datum: 'Lieferanschrift und Positionen',
    quelle: 'Bestellformular',
    empfaenger: ['Lieferant', 'Spedition des Lieferanten'],
    grundlage: 'Art. 6 Abs. 1 lit. b DSGVO',
    traegtPunkt: 'Weitergabe an Lieferanten zur Direktlieferung — mit Nennung der Empfängerkategorien',
  },
  {
    datum: 'Name und Telefonnummer des Ansprechpartners vor Ort',
    quelle: 'Bestellformular, angegeben vom Besteller',
    empfaenger: ['Lieferant', 'Spedition des Lieferanten'],
    grundlage: 'Art. 6 Abs. 1 lit. f DSGVO — nicht lit. b, er ist nicht Vertragspartner',
    massnahme:
      'Der Besteller sichert im Bestellprozess zu, den Genannten informiert zu haben ' +
      '(ZUSICHERUNG_DRITTER); ohne Haken keine Bestellung mit Baustelle. Seine Rufnummer ' +
      'geht nicht in die Ablage — dort wäre sie nach § 131 BAO unlöschbar.',
    offen:
      'Ob die Zusicherung des Bestellers die Informationspflicht nach Art. 14 erfüllt, ' +
      'entscheidet der Rechtstexteanbieter — der Shop erreicht den Dritten nicht selbst',
    traegtPunkt: 'Daten Dritter: Ansprechpartner vor Ort auf der Baustelle — Art. 6 Abs. 1 lit. f, Informationspflicht nach Art. 14',
  },
  {
    datum: 'UID-Nummer',
    quelle: 'Bestellformular',
    empfaenger: ['EU-Informationsaustauschsystem'],
    grundlage: 'Art. 6 Abs. 1 lit. c DSGVO — Nachweispflicht im Reihengeschäft',
    offen: 'Bei Einzelunternehmern ist die UID personenbezogen',
    traegtPunkt: 'UID-Abfrage beim EU-Informationsaustauschsystem — Übermittlung und Zweck',
  },
  {
    datum: 'Belege und Journal',
    quelle: 'Vorgang',
    empfaenger: ['Buchhaltung', 'Finanzamt auf Verlangen'],
    grundlage: 'Art. 6 Abs. 1 lit. c DSGVO, § 132 BAO',
    traegtPunkt: 'Speicherdauer und steuerliche Aufbewahrungsfristen',
  },
];

/**
 * Prüft, ob die Datenschutzerklärung jeden tatsächlichen Datenfluss abdeckt.
 *
 * Bewusst über den **Wortlaut** des Gliederungspunkts und nicht über einen
 * Index: Ein Index bleibt gültig, wenn jemand den Punkt inhaltlich austauscht.
 */
export function pruefeDatenfluesse(tafeln = {}) {
  // Dieselbe Hereinreichbarkeit wie bei `pruefeAbgleich` und aus demselben
  // Grund: Die beiden Tafeln passen im Bestand zueinander, also meldete diese
  // Prüfung immer „vollständig" — der Zweig, der einen Datenfluss ohne
  // deckenden Punkt der Datenschutzerklärung meldet, war unerreichbar. Bei
  // einer Auskunft nach Art. 13 DSGVO ist gerade das der teure Fall.
  const { fluesse = DATENFLUESSE, gliederung = DATENSCHUTZ_GLIEDERUNG } = tafeln;

  const maengel = [];
  const punkte = new Set(gliederung);

  for (const f of fluesse) {
    if (!f.grundlage) maengel.push(`${f.datum}: ohne Rechtsgrundlage`);
    if (!f.empfaenger || f.empfaenger.length === 0) maengel.push(`${f.datum}: ohne Empfänger`);
    if (!punkte.has(f.traegtPunkt)) {
      maengel.push(`${f.datum}: kein Punkt der Datenschutzerklärung deckt das ab`);
    }
  }

  const offen = fluesse.filter((f) => f.offen).map((f) => `${f.datum}: ${f.offen}`);
  return { vollstaendig: maengel.length === 0, maengel, offen };
}
