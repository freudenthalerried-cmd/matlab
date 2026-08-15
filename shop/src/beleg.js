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

import { EUR, LUECKE } from './format.js';

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

const wert = (v, bezeichnung) => (gefuellt(v) ? String(v).trim() : LUECKE(bezeichnung));

function positionszeilen(warenkorb) {
  const zeilen = [];
  for (const teil of warenkorb.teillieferungen) {
    zeilen.push(`${teil.lieferantName} — Direktlieferung, ${teil.lieferzeitWerktage} Werktage`);
    for (const p of teil.positionen) {
      zeilen.push(
        `  ${String(p.menge).padStart(3)} ${(p.einheit ?? 'Stk').padEnd(4)} ` +
          `${p.sku.padEnd(12)} ${p.bezeichnung}`,
      );
      zeilen.push(`      à ${EUR(p.vkNetto)} netto = ${EUR(p.zeilensummeNetto)}`);
    }
    zeilen.push(`  Fracht ${teil.lieferantName}: ${EUR(teil.frachtNetto)} (${teil.frachtGrund})`);
    zeilen.push('');
  }
  return zeilen;
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
    'Lieferung im Streckengeschäft ab Werk der Hersteller; Teillieferungen je',
    'Lieferant sind der Regelfall und werden nicht gesondert berechnet.',
    'Abladen, Zufahrt und Anwesenheit auf der Baustelle obliegen dem Besteller.',
  ];

  if (warenkorb.hinweise.length) {
    zeilen.push('', 'Hinweise:', ...warenkorb.hinweise.map((h) => `  · ${h}`));
  }

  return { text: zeilen.join('\n'), bruttobetrag: warenkorb.summeBrutto, bindefristTage };
}

/**
 * Rechnung an den Kunden.
 *
 * Erzeugt wird sie immer — geprüft wird getrennt. Ein Entwurf mit sichtbaren
 * Lücken ist besser als gar keiner: Er zeigt, welche Angabe fehlt, statt die
 * Rechnung zu verweigern und den Grund für sich zu behalten.
 */
export function erzeugeRechnung(warenkorb, { nummer, datum, lieferdatum, kunde = {}, betreiber = {} }) {
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
