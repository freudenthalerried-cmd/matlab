/**
 * Bestellübergabe an die Lieferanten.
 *
 * Nach Gate 6 ist dies der Bruchpunkt des ganzen Modells: Ohne automatische
 * Übergabe ist der Shop nach einem Tag Abwesenheit ein Betrieb, der Geld
 * genommen und nichts bestellt hat. Deshalb erzeugt diese Datei aus einem
 * bezahlten Warenkorb ohne weitere Eingabe je Lieferant eine fertige
 * Bestellung — als Text zum Versenden und als CSV für Schnittstellen.
 */

import { EUR, LUECKE, csvFeld, textZeile } from './format.js';
import { traegtSichSelbst } from './kostenbild.js';

/** Erzeugt je Teillieferung eine Bestellung an den Lieferanten. */
export function erzeugeBestellungen(warenkorb, auftrag) {
  return warenkorb.teillieferungen.map((teil, index) => {
    const nummer = `${auftrag.bestellnummer}-${String(index + 1).padStart(2, '0')}`;
    return {
      nummer,
      lieferantId: teil.lieferantId,
      lieferantName: teil.lieferantName,
      betreff: `Bestellung ${nummer} — Streckengeschäft, Direktversand an Endkunden`,
      text: bestelltext(nummer, teil, auftrag),
      csv: bestellCsv(nummer, teil, auftrag),
      warenwertNetto: teil.warenwertNetto,
      einkaufNetto: teil.einkaufNetto,
    };
  });
}

/**
 * Der Text ist so zeilenorientiert wie die CSV, nur merkt man es ihm nicht an.
 * Deshalb geht jedes fremde Feld durch `textZeile` — Artikelbezeichnungen aus
 * einer Herstellerdatei ebenso wie die Adresse, die der Kunde selbst eingibt.
 * Die Eingabeprüfung in `kunde.js` weist Zeilenumbrüche bereits ab; hier steht
 * die zweite Sperre, weil nicht jeder Weg in diese Funktion über eine
 * Eingabeprüfung führt.
 */
/**
 * Ein Feld für die Bestellung: der Inhalt auf einer Zeile — oder die sichtbare
 * Lücke.
 *
 * **Befund vom 1. September.** Diese Datei hatte die Behandlung nie bekommen,
 * die `beleg.js` am 30. August bekam. Eine Bestellung ohne Telefonnummer ging
 * hinaus mit der Zeile
 *
 *     Ansprechpartner vor Ort:
 *
 * — leer, und damit nicht als Lücke lesbar, sondern als Auskunft: *es gibt
 * keinen*. Auf einer Baustelle ist die Handynummer des Poliers die Angabe, an
 * der die Zustellung hängt. Fehlt sie, steht der LKW vor einer verschlossenen
 * Einfahrt, und die Ware geht auf Kosten des Bestellers retour.
 *
 * Ohne Absenderfirma endete der Brief nach „Mit freundlichen Grüßen" — eine
 * Bestellung, die niemand unterschreibt und die der Lieferant keinem Konto
 * zuordnen kann.
 *
 * > **Was der Kunde nicht sehen darf, darf der Lieferant erst recht nicht
 * > sehen.** Die Lückenmarkierung war ein halbes Jahr lang eine Regel für
 * > Kundenbelege. Der Bestelltext ist derselbe Außentext, nur mit einem
 * > anderen Empfänger.
 */
const feld = (v, bezeichnung) =>
  (typeof v === 'string' && v.trim() !== '') || (typeof v === 'number' && Number.isFinite(v))
    ? textZeile(v)
    : LUECKE(bezeichnung);

function bestelltext(nummer, teil, auftrag) {
  const zeilen = teil.positionen.map(
    (p) => `  ${String(p.menge).padStart(3)} × ${textZeile(p.sku).padEnd(12)} ${textZeile(p.bezeichnung)}`,
  );

  // Ein Hinweis zur Zufahrt steht direkt unter der Adresse und nicht am Ende:
  // Wer die Bestellung an die Spedition weiterreicht, kopiert den Adressblock,
  // nicht den ganzen Brief.
  const zufahrt = textZeile(auftrag.lieferadresse.hinweis ?? '');

  // Der Termin, der dem Kunden zugesagt wurde, gehört in die Bestellung.
  // Bisher stand er nur auf der Auftragsbestätigung: Der Shop versprach eine
  // Lieferzeit aus den Stammdaten und forderte sie beim Lieferanten nie an.
  // Ein zugesagter Termin, den niemand bestellt hat, ist eine Hoffnung.
  const termin = feld(
    teil.lieferzeitWerktage != null ? `${teil.lieferzeitWerktage} Werktage ab heute` : null,
    `Lieferzeit ${teil.lieferantName ?? teil.lieferantId}`,
  );

  return [
    `Bestellung ${nummer}`,
    ``,
    `Sehr geehrte Damen und Herren,`,
    ``,
    `hiermit bestelle ich im Streckengeschäft zur Direktlieferung an den unten`,
    `genannten Endkunden:`,
    ``,
    ...zeilen,
    ``,
    `Lieferadresse (Baustelle):`,
    `  ${feld(auftrag.lieferadresse.name, 'Name des Empfängers')}`,
    `  ${feld(auftrag.lieferadresse.strasse, 'Straße der Baustelle')}`,
    `  ${feld(auftrag.lieferadresse.plz, 'PLZ')} ${feld(auftrag.lieferadresse.ort, 'Ort')}`,
    `  Ansprechpartner vor Ort: ${feld(auftrag.lieferadresse.telefon, 'Telefon des Ansprechpartners')}`,
    ...(zufahrt ? [`  Hinweis zur Zufahrt: ${zufahrt}`] : []),
    ``,
    `Gewünschte Lieferzeit: ${termin}. Bitte den Termin bestätigen — wir haben`,
    `ihn dem Endkunden gegenüber zugesagt.`,
    ``,
    `Bitte neutral verpackt und ohne Preisangaben liefern.`,
    `Rechnung an den Auftraggeber laut hinterlegten Stammdaten.`,
    ``,
    `Warenwert netto laut meiner Kalkulation: ${EUR(teil.einkaufNetto)}`,
    ``,
    `Mit freundlichen Grüßen`,
    feld(auftrag.absender?.firma, 'Firma des Bestellers'),
  ].join('\n');
}

function bestellCsv(nummer, teil, auftrag) {
  // `liefertelefon` kam am 1. September dazu. Die Textfassung nannte den
  // Ansprechpartner, die CSV nicht — und die CSV ist der Weg, den eine
  // Schnittstelle nimmt. Zwei Fassungen derselben Bestellung, und die
  // maschinelle war die ärmere.
  const kopf =
    'bestellnummer;sku;menge;bezeichnung;liefername;lieferstrasse;lieferplz;lieferort;liefertelefon';
  const zeilen = teil.positionen.map((p) =>
    [
      nummer,
      csvFeld(p.sku),
      p.menge,
      csvFeld(p.bezeichnung),
      csvFeld(auftrag.lieferadresse.name),
      csvFeld(auftrag.lieferadresse.strasse),
      csvFeld(auftrag.lieferadresse.plz),
      csvFeld(auftrag.lieferadresse.ort),
      csvFeld(auftrag.lieferadresse.telefon ?? ''),
    ].join(';'),
  );
  return [kopf, ...zeilen].join('\n');
}

/**
 * Prüft, ob eine Bestellung ohne menschliches Zutun ausgelöst werden darf.
 * Alles, was hier false liefert, muss liegen bleiben statt falsch zu laufen.
 */
export function darfAutomatischAusgeloestWerden(warenkorb, auftrag) {
  const gruende = [];

  if (!warenkorb.bestellbar) gruende.push('Mindestbestellwert nicht erreicht');
  if (!auftrag.zahlungEingegangen) gruende.push('Zahlung nicht eingegangen');
  if (!auftrag.kundeIstUnternehmer) gruende.push('Kunde ist nicht als Unternehmer bestätigt (Gate 7)');
  if (!auftrag.uid) gruende.push('UID fehlt');
  if (warenkorb.teillieferungen.some((t) => t.positionen.some((p) => p.ekIstPlatzhalter))) {
    gruende.push('Katalog enthält Platzhalterpreise — keine echten Konditionen');
  }

  // **Ergänzt am 1. September**, nach dem Lesen eines erzeugten Bestelltexts.
  // Die Sperren oben schützen alle das Geld: Zahlung, Marge, Konditionen. Was
  // fehlte, war der Schutz der **Zustellung**. Eine Bestellung ohne Telefon
  // des Ansprechpartners und ohne Absenderfirma war auslösbar; sie geht dann
  // mit sichtbaren Lücken zum Lieferanten und ist dort weder zustellbar noch
  // zuordenbar.
  const adresse = auftrag.lieferadresse ?? {};
  const pflicht = [
    [adresse.name, 'Name des Empfängers'],
    [adresse.strasse, 'Straße der Baustelle'],
    [adresse.plz, 'PLZ'],
    [adresse.ort, 'Ort'],
    [adresse.telefon, 'Telefon des Ansprechpartners — ohne ihn fährt die Spedition ins Blinde'],
    [auftrag.absender?.firma, 'Firma des Bestellers — der Lieferant kann die Bestellung sonst nicht zuordnen'],
  ];
  for (const [wert, bezeichnung] of pflicht) {
    if (typeof wert !== 'string' || wert.trim() === '') gruende.push(`Bestelltext unvollständig: ${bezeichnung}`);
  }
  const ohneLieferzeit = warenkorb.teillieferungen
    .filter((t) => t.lieferzeitWerktage == null)
    .map((t) => t.lieferantName ?? t.lieferantId);
  if (ohneLieferzeit.length) {
    gruende.push(`Lieferzeit unbekannt (${ohneLieferzeit.join(', ')}) — der Termin wäre unbestellt zugesagt`);
  }

  // Gate 20: Keine Bestellung ohne positiven Deckungsbeitrag. Der Mindest-
  // bestellwert oben ist eine Kondition des Lieferanten uns gegenüber und sagt
  // nichts darüber, ob WIR an dieser Bestellung etwas verdienen. Bei 20 %
  // Rohmarge und frei Haus kippt ein kleiner Warenkorb ins Minus, während
  // jeder Mindestbestellwert erfüllt ist. Siehe rechnung-zum-zuschlag.md.
  // Die Prüfung läuft immer, nicht nur wenn der Auftrag die Felder trägt: Eine
  // Sperre, die sich bei fehlender Angabe selbst überspringt, ist keine Sperre.
  // Voreinstellung ist die günstigste Annahme (Fracht wird verrechnet) — wer
  // frei Haus liefert, muss das im Auftrag sagen und bekommt die schärfere
  // Rechnung.
  const deckung = traegtSichSelbst(warenkorb, {
    zahlwegId: auftrag.zahlweg ?? 'karte-stripe',
    frachtVerrechnet: auftrag.frachtVerrechnet ?? true,
  });
  if (!deckung.traegt) gruende.push(`Gate 20 — ${deckung.gruende[0]}`);

  return { erlaubt: gruende.length === 0, gruende };
}
