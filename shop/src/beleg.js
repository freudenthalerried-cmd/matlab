/**
 * Belege an den Kunden: Angebot und Rechnung.
 *
 * Bis hierher erzeugt der Shop Bestellungen an die Lieferanten. Was fehlte, ist
 * die Gegenrichtung — das Dokument, das der Kunde bekommt. Es entsteht aus
 * demselben Warenkorb, damit es gar nicht erst von den Lieferantenbestellungen
 * abweichen kann.
 *
 * Grundlage der Pflichtangaben: § 11 UStG. Zwei Schwellen sind darin
 * eingebaut, und beide hängen am **Bruttobetrag**:
 *
 *   bis 400 €      Kleinbetragsrechnung, sechs Angaben genügen (§ 11 Abs 6)
 *   über 400 €     die vollen Merkmale
 *   über 10.000 €  zusätzlich die UID des Leistungsempfängers (§ 11 Abs 1 Z 2)
 *
 * Für diesen Shop ist die dritte Schwelle keine Hürde: Gate 7 verlangt die UID
 * ohnehin bei jeder Bestellung. Eine Auflage, die zum Ausschluss von
 * Verbrauchern eingeführt wurde, erfüllt hier nebenbei eine Steuerpflicht.
 */

import { EUR, LUECKE, textZeile, einheitText } from './format.js';
import { ZAHLUNGSBEDINGUNGEN } from './rechtstexte.js';
import { zahlwegName } from './zahlung.js';

export const KLEINBETRAG_GRENZE_BRUTTO = 400;
export const UID_EMPFAENGER_GRENZE_BRUTTO = 10000;

/**
 * Pflichtangaben nach § 11 UStG.
 * `ab` sagt, ab welcher Schwelle die Angabe verlangt wird.
 */
export const RECHNUNGSMERKMALE = [
  { feld: 'ausstellerName', bezeichnung: 'Name und Anschrift des liefernden Unternehmers', ab: 0 },
  { feld: 'leistung', bezeichnung: 'Menge und handelsübliche Bezeichnung der Gegenstände', ab: 0 },
  { feld: 'lieferdatum', bezeichnung: 'Tag der Lieferung oder Leistungszeitraum', ab: 0 },
  { feld: 'ausstellungsdatum', bezeichnung: 'Ausstellungsdatum', ab: 0 },
  { feld: 'bruttobetrag', bezeichnung: 'Entgelt', ab: 0 },
  { feld: 'steuersatz', bezeichnung: 'Steuersatz', ab: 0 },
  { feld: 'empfaengerName', bezeichnung: 'Name und Anschrift des Abnehmers', ab: KLEINBETRAG_GRENZE_BRUTTO },
  { feld: 'nettobetrag', bezeichnung: 'Entgelt netto und Steuerbetrag getrennt', ab: KLEINBETRAG_GRENZE_BRUTTO },
  { feld: 'ausstellerUid', bezeichnung: 'UID-Nummer des Ausstellers', ab: KLEINBETRAG_GRENZE_BRUTTO },
  { feld: 'rechnungsnummer', bezeichnung: 'Fortlaufende Rechnungsnummer', ab: KLEINBETRAG_GRENZE_BRUTTO },
  { feld: 'empfaengerUid', bezeichnung: 'UID-Nummer des Leistungsempfängers', ab: UID_EMPFAENGER_GRENZE_BRUTTO },
];

/** Welche Merkmale ein Beleg über diesen Bruttobetrag tragen muss. */
export function erforderlicheMerkmale(bruttobetrag) {
  return RECHNUNGSMERKMALE.filter((m) => bruttobetrag > m.ab || m.ab === 0);
}

const gefuellt = (wert) =>
  (typeof wert === 'string' && wert.trim() !== '') || (typeof wert === 'number' && Number.isFinite(wert));

/**
 * Prüft einen Belegentwurf gegen § 11 UStG und benennt jede Lücke einzeln.
 * @param {object} beleg Felder wie in RECHNUNGSMERKMALE benannt
 */
export function pruefeRechnungsmerkmale(beleg = {}) {
  const brutto = Number(beleg.bruttobetrag) || 0;
  const noetig = erforderlicheMerkmale(brutto);
  const fehlend = noetig.filter((m) => !gefuellt(beleg[m.feld]));

  return {
    vollstaendig: fehlend.length === 0,
    kleinbetrag: brutto <= KLEINBETRAG_GRENZE_BRUTTO,
    empfaengerUidNoetig: brutto > UID_EMPFAENGER_GRENZE_BRUTTO,
    fehlend: fehlend.map((m) => m.bezeichnung),
    fehlendeFelder: fehlend.map((m) => m.feld),
  };
}

/**
 * Ein Feld für eine Belegzeile: entweder der Inhalt, auf eine Zeile gezwungen,
 * oder die sichtbare Lückenmarkierung.
 *
 * `textZeile` statt `trim`, weil `trim` nur an den Enden räumt. Ein Umbruch in
 * der Mitte eines Firmennamens überlebt ihn — und schreibt dann eine Zeile in
 * einen Beleg, dessen Summenzeilen zeilenweise gelesen werden. Ein
 * untergeschobenes „Gesamtbetrag …" wäre ein Rechnungsmangel nach § 11 UStG,
 * und der Beleg landet unveränderbar in der Ablage.
 */
const wert = (v, bezeichnung) => (gefuellt(v) ? textZeile(v) : LUECKE(bezeichnung));

/**
 * Die Lieferzeit einer Teillieferung als Text — oder als sichtbare Lücke.
 *
 * **Befund vom 30. August.** Hier stand `${teil.lieferzeitWerktage} Werktage`,
 * roh eingesetzt. Für den einzigen Lieferanten, der die sechsundvierzig
 * geführten Artikel liefert, ist die Lieferzeit nicht bekannt — also stand auf
 * Angebot, Auftragsbestätigung und Rechnung jeder echten Bestellung wörtlich
 * `null Werktage`.
 *
 * Jede andere fehlende Angabe in diesem Modul geht durch `wert()` und wird zu
 * `[[ … — FEHLT ]]`. Die Lieferzeit war die eine, die daran vorbeilief. Sie
 * geht jetzt denselben Weg: Was nicht bekannt ist, sieht auch nicht bekannt
 * aus.
 */
function lieferzeitText(teil) {
  return gefuellt(teil.lieferzeitWerktage)
    ? `${teil.lieferzeitWerktage} Werktage`
    : LUECKE(`Lieferzeit ${teil.lieferantName}`);
}

function positionszeilen(warenkorb) {
  const zeilen = [];
  for (const teil of warenkorb.teillieferungen) {
    zeilen.push(`${textZeile(teil.lieferantName)} — Direktlieferung, ${lieferzeitText(teil)}`);
    for (const p of teil.positionen) {
      zeilen.push(
        // Das lesbare Wort, nicht das Kürzel des Lieferanten: Derselbe Kunde
        // bekommt zur selben Position einen Anfragetext mit „Sack“ und
        // hätte auf dem Angebot „SCK“ gelesen.
        `  ${String(p.menge).padStart(3)} ${textZeile(einheitText(p.einheit)).padEnd(6)} ` +
          `${textZeile(p.sku).padEnd(12)} ${textZeile(p.bezeichnung)}`,
      );
      zeilen.push(`      à ${EUR(p.vkNetto)} netto = ${EUR(p.zeilensummeNetto)}`);
    }
    zeilen.push(`  Fracht ${textZeile(teil.lieferantName)}: ${EUR(teil.frachtNetto)} (${textZeile(teil.frachtGrund)})`);
    zeilen.push('');
  }
  return zeilen;
}

/**
 * Alle Zahlungsbedingungen dieses Shops, nach `id` greifbar.
 * Quelle bleibt `rechtstexte.js` — hier steht nur der Zugriff.
 *
 * Der sperrige Name ist Absicht: `ZAHLWEGE` heißt schon die Kostentabelle in
 * `zahlung.js`. Im Modul wäre die Doppelung harmlos, im zusammengefügten
 * `shop.js` ein SyntaxError — und genau das hat `buendel.js` gemeldet, als
 * hier zwei Minuten lang `ZAHLWEGE` stand.
 */
const ZAHLUNGSBEDINGUNG_JE_ID = new Map(
  [
    ...ZAHLUNGSBEDINGUNGEN.angeboten,
    ...ZAHLUNGSBEDINGUNGEN.zurueckgestellt,
    ...ZAHLUNGSBEDINGUNGEN.ausgeschlossen,
  ].map((z) => [z.id, z]),
);

/** Angebotene Zahlwege — nur die dürfen auf einem Beleg stehen. */
export function angeboteneZahlwege() {
  return ZAHLUNGSBEDINGUNGEN.angeboten.map((z) => z.id);
}

/**
 * Verlangt dieser Zahlweg das Geld vor der Lieferung?
 * `null` heißt: Zahlweg unbekannt — und ein unbekannter Zahlweg gehört auf
 * keinen Beleg.
 */
export function zahlwegIstVorkasse(id) {
  const z = ZAHLUNGSBEDINGUNG_JE_ID.get(id);
  return z ? z.vorkasse === true : null;
}

/**
 * Der Zahlungsvermerk auf der Rechnung.
 *
 * **Befund vom 1. September, gefunden beim Lesen einer erzeugten Rechnung.**
 * Der Beleg endete mit `Gesamtbetrag 1.638,48 €` und zwei Rechtssätzen. Kein
 * Wort darüber, ob dieses Geld noch zu zahlen ist. Nach Punkt 9 der eigenen
 * AGB ist es das nie: Das Zahlungsziel ist null Tage, gezahlt wird bei der
 * Bestellung, und im Ablauf (`auftragslauf.js`) steht die Rechnung an
 * Position zehn — nach der Lieferung, also lange nach dem Geldeingang.
 *
 * > **Eine Rechnung, die einen Betrag nennt und über seinen Zustand
 * > schweigt, ist eine Zahlungsaufforderung.** Die Buchhaltung des Kunden
 * > liest sie als solche und überweist. Merken muss es dann der Händler,
 * > denn der Kunde hat keinen Anlass dazu.
 *
 * Deshalb trägt jede Rechnung dieses Shops den Vermerk — und wenn die
 * Angaben dazu fehlen, trägt sie die sichtbare Lücke und darf nach
 * `darfRechnungGestelltWerden` nicht hinaus.
 *
 * @param {{weg?: string, datum?: string, kennzeichen?: string}} zahlung
 */
export function zahlungsvermerk(zahlung = {}) {
  const vorkasse = zahlwegIstVorkasse(zahlung.weg);

  if (vorkasse === null) {
    return {
      vollstaendig: false,
      grund: gefuellt(zahlung.weg)
        ? `Unbekannter Zahlweg „${textZeile(zahlung.weg)}" — angeboten sind: ${angeboteneZahlwege().join(', ')}`
        : 'Kein Zahlweg angegeben',
      zeilen: [wert(null, 'Zahlweg und Zahlungsdatum')],
    };
  }

  if (!vorkasse) {
    // Heute unerreichbar: alle angebotenen Wege sind Vorkasse. Der Zweig
    // steht da, damit die Rechnung nicht stillschweigend falsch wird, falls
    // je ein Zahlungsziel freigegeben wird.
    return {
      vollstaendig: false,
      grund: `Zahlweg „${textZeile(zahlung.weg)}" ist keine Vorkasse — offene Rechnung braucht Bankverbindung und Frist`,
      zeilen: [
        `Zahlbar innerhalb von ${ZAHLUNGSBEDINGUNGEN.zielTage} Tagen ohne Abzug auf`,
        `  ${wert(null, 'Bankverbindung des Ausstellers')}`,
      ],
    };
  }

  if (!gefuellt(zahlung.datum)) {
    return {
      vollstaendig: false,
      grund: 'Zahlungsdatum fehlt — ohne Datum ist der Vermerk keine Quittung',
      zeilen: [
        `Bereits bezahlt über ${textZeile(zahlwegName(zahlung.weg))}, ${wert(null, 'Zahlungsdatum')}.`,
        'Bitte nicht überweisen.',
      ],
    };
  }

  const zeilen = [
    `Bereits bezahlt am ${textZeile(zahlung.datum)} über ${textZeile(zahlwegName(zahlung.weg))}.`,
  ];
  if (gefuellt(zahlung.kennzeichen)) {
    zeilen.push(`Zahlungsreferenz: ${textZeile(zahlung.kennzeichen)}`);
  }
  zeilen.push('Dieser Beleg dient dem Vorsteuerabzug. Bitte nicht noch einmal überweisen.');

  return { vollstaendig: true, grund: null, zeilen };
}

function summenblock(warenkorb) {
  return [
    `Warenwert netto      ${EUR(warenkorb.warenwertNetto).padStart(12)}`,
    `Fracht netto         ${EUR(warenkorb.frachtNetto).padStart(12)}`,
    `Summe netto          ${EUR(warenkorb.summeNetto).padStart(12)}`,
    `Umsatzsteuer 20 %    ${EUR(warenkorb.ust).padStart(12)}`,
    `Gesamtbetrag         ${EUR(warenkorb.summeBrutto).padStart(12)}`,
  ];
}

/**
 * Angebot an den Kunden.
 *
 * Kein Beleg im Sinne des § 11 UStG, deshalb ohne Rechnungsnummer — aber mit
 * Bindefrist. Ein Angebot ohne Bindefrist bindet nach § 862 ABGB für eine
 * angemessene Zeit, und „angemessen" entscheidet im Streitfall jemand anderer.
 * Bei Streckengeschäft mit Herstellerpreisen ist das keine gute Idee.
 */
export function erzeugeAngebot(warenkorb, { nummer, datum, bindefristTage = 14, kunde = {}, betreiber = {} }) {
  const zeilen = [
    `Angebot ${wert(nummer, 'Angebotsnummer')}`,
    `Datum: ${wert(datum, 'Datum')}`,
    '',
    wert(betreiber.firma, 'Firma des Betreibers'),
    '',
    'An:',
    `  ${wert(kunde.firma, 'Firma des Kunden')}`,
    `  ${wert(kunde.strasse, 'Anschrift')}`,
    `  ${wert(kunde.plz, 'PLZ')} ${wert(kunde.ort, 'Ort')}`,
    '',
    'Alle Preise verstehen sich netto zuzüglich Umsatzsteuer.',
    '',
    ...positionszeilen(warenkorb),
    ...summenblock(warenkorb),
    '',
    `Bindefrist: ${bindefristTage} Tage ab Angebotsdatum.`,
    // Ohne diesen Satz gilt im B2B die Verkehrssitte, und die ist ein
    // Zahlungsziel. Der Shop bietet keines an (Punkt 9 der AGB) — dann muss
    // die Bedingung auf dem Angebot stehen und nicht erst im Warenkorb.
    `Zahlungsbedingung: ${ZAHLUNGSBEDINGUNGEN.zielTage === 0
      ? 'Zahlung bei Bestellung, kein Zahlungsziel'
      : `${ZAHLUNGSBEDINGUNGEN.zielTage} Tage netto`}`
      + ` (${angeboteneZahlwege().map((id) => zahlwegName(id)).join(', ')}).`,
    'Lieferung im Streckengeschäft ab Werk der Hersteller; Teillieferungen je',
    'Lieferant sind der Regelfall und werden nicht gesondert berechnet.',
    'Abladen, Zufahrt und Anwesenheit auf der Baustelle obliegen dem Besteller.',
  ];

  if (warenkorb.hinweise.length) {
    zeilen.push('', 'Hinweise:', ...warenkorb.hinweise.map((h) => `  · ${textZeile(h)}`));
  }

  return { text: zeilen.join('\n'), bruttobetrag: warenkorb.summeBrutto, bindefristTage };
}

/**
 * Auftragsbestätigung an den Kunden — das Papier, mit dem der Vertrag zustande
 * kommt.
 *
 * **Es hat bis hierher gefehlt, und das war kein Schönheitsfehler.** Punkt 2
 * der eigenen AGB lautet: „Bestellung ist Angebot, Annahme durch
 * Auftragsbestätigung." Der Ablauf in `auftragslauf.js` kannte diesen Schritt
 * nicht — er ging vom Zahlungseingang direkt zur Lieferantenbestellung. Der
 * Shop hätte also **Geld genommen, bevor nach seinen eigenen Bedingungen ein
 * Vertrag bestand**, und die einzige „Auftragsbestätigung" im Ablauf war die
 * des Lieferanten an uns, nicht unsere an den Kunden.
 *
 * Zwei Dinge stehen deshalb hier, die in keinem anderen Beleg stehen:
 *
 *   1. **Wann der Vertrag zustande kommt** — ausdrücklich, mit Verweis auf die
 *      AGB, damit die beiden Texte dasselbe sagen.
 *   2. **Wann die Baustelle vollständig beliefert ist.** Im Streckengeschäft
 *      liefert jeder Hersteller selbst, und der Kunde kann erst arbeiten, wenn
 *      das **letzte** Teil da ist. Angebot und Rechnung nennen die Lieferzeit
 *      je Lieferant; keiner von beiden nennt die längste. Genau die braucht der
 *      Bauleiter für seinen Terminplan.
 */
export function erzeugeAuftragsbestaetigung(
  warenkorb,
  { nummer, datum, kunde = {}, betreiber = {}, auftrag = {}, hinweise = [] },
) {
  // **`?? 0` stand hier bis zum 30. August**, und das war die teuerste
  // Zeile des Moduls: Eine unbekannte Lieferzeit wurde zu null Werktagen und
  // damit zum optimistischsten aller möglichen Werte. Auf einem Dokument, das
  // drei Zeilen weiter oben schreibt „Mit dieser Bestätigung kommt der Vertrag
  // zustande", stand danach „Vollständig auf der Baustelle: nach 0 Werktagen".
  //
  // Unbekannt plus bekannt ergibt unbekannt. Das Maximum gibt es nur, wenn
  // jede Teillieferung ihre Zahl kennt.
  const werktage = warenkorb.teillieferungen.map((t) => t.lieferzeitWerktage);
  const alleBekannt = werktage.length > 0 && werktage.every((w) => gefuellt(w));
  const laengste = alleBekannt ? Math.max(...werktage) : null;
  const lieferadresse = auftrag.lieferadresse ?? null;

  const zeilen = [
    `Auftragsbestätigung ${wert(nummer, 'Auftragsnummer')}`,
    `Datum: ${wert(datum, 'Datum')}`,
    '',
    wert(betreiber.firma, 'Firma des Betreibers'),
    '',
    'Auftraggeber:',
    `  ${wert(kunde.firma, 'Firma des Kunden')}`,
    `  ${wert(kunde.strasse, 'Anschrift')}`,
    `  ${wert(kunde.plz, 'PLZ')} ${wert(kunde.ort, 'Ort')}`,
    '',
    'Wir nehmen Ihre Bestellung hiermit an. Mit dieser Bestätigung kommt der',
    'Vertrag zustande (Punkt 2 unserer Allgemeinen Geschäftsbedingungen).',
    '',
    // Die Bestätigung ist im Ablauf der Schritt **vor** der Zahlung. Sie ist
    // damit das Dokument, auf das hin der Kunde zahlt — und der einzige Ort,
    // an dem stehen kann, dass bis dahin nichts bestellt wird. Ohne den Satz
    // wartet der Kunde auf Ware und der Shop auf Geld.
    ZAHLUNGSBEDINGUNGEN.zielTage === 0
      ? 'Zahlbar sofort, ohne Zahlungsziel (Punkt 9 der Geschäftsbedingungen). Die'
      : `Zahlbar innerhalb von ${ZAHLUNGSBEDINGUNGEN.zielTage} Tagen. Die`,
    'Bestellungen bei den Herstellern lösen wir nach Zahlungseingang aus; die',
    'Lieferzeiten unten laufen ab diesem Zeitpunkt.',
    '',
  ];

  if (lieferadresse) {
    zeilen.push(
      'Lieferanschrift:',
      `  ${wert(lieferadresse.name, 'Name der Lieferanschrift')}`,
      `  ${wert(lieferadresse.strasse, 'Anschrift')}`,
      `  ${wert(lieferadresse.plz, 'PLZ')} ${wert(lieferadresse.ort, 'Ort')}`,
      `  Ansprechpartner vor Ort: ${wert(lieferadresse.telefon, 'Ansprechpartner vor Ort')}`,
    );
    if (auftrag.lieferungAnRechnungsadresse === false) {
      zeilen.push('  (abweichend von der Rechnungsanschrift)');
    }
    zeilen.push('');
  }

  zeilen.push(...positionszeilen(warenkorb), ...summenblock(warenkorb), '');

  // Die Lieferzeiten einzeln — und die längste ausdrücklich. Ein Kunde, der
  // drei Zahlen liest und selbst das Maximum bilden soll, bildet es nicht.
  zeilen.push('Lieferzeiten je Hersteller, ab Bestellauslösung:');
  for (const t of warenkorb.teillieferungen) {
    zeilen.push(`  ${textZeile(t.lieferantName)}: ${lieferzeitText(t)}`);
  }
  zeilen.push(
    '',
    alleBekannt
      ? `Vollständig auf der Baustelle: nach ${laengste} Werktagen.`
      : `Vollständig auf der Baustelle: ${LUECKE('Gesamtlieferzeit')} — solange eine `
        + 'Lieferzeit oben fehlt, gibt es keinen Termin, den wir zusagen können.',
    'Bis dahin treffen die Teillieferungen einzeln ein; jede ist für sich zu prüfen.',
  );

  if (hinweise.length) {
    zeilen.push('', 'Bitte beachten Sie:');
    for (const h of hinweise) {
      zeilen.push(`  · ${textZeile(h.titel)}: ${textZeile(h.text)} (${textZeile(h.grundlage)})`);
    }
  }

  return {
    text: zeilen.join('\n'),
    bruttobetrag: warenkorb.summeBrutto,
    lieferzeitLaengsteWerktage: laengste,
    teillieferungen: warenkorb.teillieferungen.length,
  };
}

/**
 * Darf dieser Auftrag überhaupt angenommen werden?
 *
 * Die Annahme ist die Stelle, an der der Shop sich bindet. Sie gehört deshalb
 * **vor** die Zahlung und nicht danach — und sie darf nur erklärt werden, wenn
 * die Bestellung beim Lieferanten auch platzierbar ist.
 *
 * Der Fall aus `frachtschwelle-und-bestellwert.md` ist genau dieser: Ein
 * Warenkorb unter dem Mindestbestellwert des Lieferanten wurde als bestellbar
 * gemeldet. Wer so etwas bestätigt, hat einen Vertrag geschlossen, den er nicht
 * erfüllen kann — schlimmer als eine abgelehnte Bestellung.
 */
export function darfBestaetigtWerden(warenkorb, auftrag = {}) {
  const gruende = [];

  if (!auftrag.kundeIstUnternehmer) gruende.push('Unternehmerstatus nicht bestätigt (Gate 7)');
  if (!auftrag.uid) gruende.push('Keine UID-Nummer hinterlegt');
  if (warenkorb.teillieferungen.length === 0) gruende.push('Leerer Warenkorb');
  if (!warenkorb.bestellbar) {
    gruende.push(...warenkorb.hinweise.map((h) => `Nicht platzierbar — ${h}`));
  }
  if (warenkorb.teillieferungen.some((t) => t.positionen.some((p) => p.ekIstPlatzhalter))) {
    gruende.push('Katalog enthält Platzhalterpreise — der bestätigte Betrag wäre erfunden');
  }
  // Dieselbe Regel, andere Größe. Die Auftragsbestätigung ist die Annahme:
  // Mit ihr kommt der Vertrag zustande, und sie nennt den Termin. Wer einen
  // Termin zusagt, den er nicht kennt, hat ihn erfunden — genauso wie einen
  // Betrag aus einem Platzhalterpreis. **Entschieden am 30.08.**: Das Angebot
  // darf die Lücke tragen und sichtbar machen, die Bestätigung nicht.
  const ohneLieferzeit = warenkorb.teillieferungen
    .filter((t) => !gefuellt(t.lieferzeitWerktage))
    .map((t) => t.lieferantName ?? t.lieferantId);
  if (ohneLieferzeit.length) {
    gruende.push(`Lieferzeit unbekannt (${ohneLieferzeit.join(', ')}) — der zugesagte Termin wäre erfunden`);
  }

  return { erlaubt: gruende.length === 0, gruende };
}

/**
 * Rechnung an den Kunden.
 *
 * Erzeugt wird sie immer — geprüft wird getrennt. Ein Entwurf mit sichtbaren
 * Lücken ist besser als gar keiner: Er zeigt, welche Angabe fehlt, statt die
 * Rechnung zu verweigern und den Grund für sich zu behalten.
 */
export function erzeugeRechnung(warenkorb, { nummer, datum, lieferdatum, kunde = {}, betreiber = {}, zahlung = {} }) {
  const vermerk = zahlungsvermerk(zahlung);
  const pruefung = pruefeRechnungsmerkmale({
    ausstellerName: betreiber.firma,
    ausstellerUid: betreiber.uid,
    empfaengerName: kunde.firma,
    empfaengerUid: kunde.uid,
    rechnungsnummer: nummer,
    ausstellungsdatum: datum,
    lieferdatum,
    leistung: warenkorb.teillieferungen.length ? 'ja' : '',
    nettobetrag: warenkorb.summeNetto,
    bruttobetrag: warenkorb.summeBrutto,
    steuersatz: '20 %',
  });

  const zeilen = [
    `Rechnung ${wert(nummer, 'Rechnungsnummer')}`,
    `Ausstellungsdatum: ${wert(datum, 'Ausstellungsdatum')}`,
    `Lieferdatum: ${wert(lieferdatum, 'Lieferdatum')}`,
    '',
    wert(betreiber.firma, 'Firma und Anschrift des Ausstellers'),
    `UID: ${wert(betreiber.uid, 'UID des Ausstellers')}`,
    '',
    'Rechnungsempfänger:',
    `  ${wert(kunde.firma, 'Firma des Kunden')}`,
    `  ${wert(kunde.strasse, 'Anschrift')}`,
    `  ${wert(kunde.plz, 'PLZ')} ${wert(kunde.ort, 'Ort')}`,
    `  UID: ${wert(kunde.uid, 'UID des Leistungsempfängers')}`,
    '',
    ...positionszeilen(warenkorb),
    ...summenblock(warenkorb),
    '',
    ...vermerk.zeilen,
    '',
    'Leistungsort Österreich, Steuersatz 20 %.',
    'Untersuchungs- und Rügepflicht nach § 377 UGB wird ausdrücklich vereinbart.',
  ];

  if (pruefung.kleinbetrag) {
    zeilen.push(
      '',
      'Kleinbetragsrechnung nach § 11 Abs 6 UStG — die vereinfachten Angaben',
      'genügen bis 400 € Gesamtbetrag.',
    );
  }

  return {
    text: zeilen.join('\n'),
    ...pruefung,
    bruttobetrag: warenkorb.summeBrutto,
    zahlungsvermerk: vermerk,
  };
}

/**
 * Prüft, ob eine Rechnung gestellt werden darf.
 *
 * Dieselbe Haltung wie bei der Bestellsperre: Solange ein Platzhalterpreis im
 * Warenkorb liegt, ist der ausgewiesene Betrag erfunden. Eine erfundene
 * Rechnung ist schlimmer als eine fehlende — sie wird bezahlt.
 */
export function darfRechnungGestelltWerden(warenkorb, rechnung, auftrag = {}) {
  const gruende = [];

  if (!rechnung.vollstaendig) {
    gruende.push(`Pflichtangaben nach § 11 UStG fehlen: ${rechnung.fehlend.join(', ')}`);
  }
  if (warenkorb.teillieferungen.some((t) => t.positionen.some((p) => p.ekIstPlatzhalter))) {
    gruende.push('Katalog enthält Platzhalterpreise — der ausgewiesene Betrag wäre erfunden');
  }
  if (auftrag.geliefert === false) {
    gruende.push('Lieferung noch nicht erfolgt — Lieferdatum wäre unzutreffend');
  }
  // Der Zahlungsvermerk ist keine Pflichtangabe nach § 11 UStG — er steht in
  // Punkt 9 der eigenen AGB. Deshalb sperrt er hier und nicht in
  // `pruefeRechnungsmerkmale`: Das Gesetz verlangt ihn nicht, dieser Shop
  // schon, weil bei ihm das Geld vor der Rechnung da ist.
  if (rechnung.zahlungsvermerk && !rechnung.zahlungsvermerk.vollstaendig) {
    gruende.push(`Zahlungsvermerk unbrauchbar — ${rechnung.zahlungsvermerk.grund}`);
  }

  return { erlaubt: gruende.length === 0, gruende };
}

/**
 * Umsatzsteuerliche Einordnung des Streckengeschäfts.
 *
 * Sitzt der Lieferant im Ausland und liefert direkt an die österreichische
 * Baustelle, ist das ein **Reihengeschäft**: drei Beteiligte, ein
 * Warenbewegung. Der Lieferant befördert, also ist die bewegte Lieferung seine
 * — steuerfreie innergemeinschaftliche Lieferung an uns, gegen unsere UID. Was
 * wir dem Kunden liefern, ist die ruhende Lieferung am Ende der Beförderung:
 * steuerbar in Österreich, 20 % Umsatzsteuer.
 *
 * Die praktische Folge steht in zwei Sätzen: Die Eingangsrechnung aus
 * Deutschland kommt **ohne Umsatzsteuer** und ist als innergemeinschaftlicher
 * Erwerb zu erklären. Die Ausgangsrechnung trägt trotzdem 20 %.
 *
 * Das ist keine Steuerberatung und ersetzt keine. Es ist die Angabe, welche
 * Frage der Steuerberaterin zu stellen ist — und das ist bei zwei von drei
 * Lieferanten eine.
 */
export function reihengeschaeftEinordnung(warenkorb, katalog) {
  const auslaendisch = warenkorb.teillieferungen.filter((t) => {
    const l = katalog.lieferantenById.get(t.lieferantId);
    return l && l.land && l.land !== 'AT';
  });

  const hinweise = auslaendisch.map(
    (t) =>
      `${t.lieferantName} liefert aus ${katalog.lieferantenById.get(t.lieferantId).land} direkt ` +
      `an die Baustelle: Reihengeschäft. Eingangsrechnung ohne Umsatzsteuer ` +
      `(innergemeinschaftlicher Erwerb), Ausgangsrechnung mit 20 %.`,
  );

  return {
    reihengeschaeft: auslaendisch.length > 0,
    betroffeneLieferanten: auslaendisch.map((t) => t.lieferantId),
    hinweise,
    uidPflicht: auslaendisch.length > 0,
  };
}
