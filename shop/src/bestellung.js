/**
 * Bestellübergabe an die Lieferanten.
 *
 * Nach Gate 6 ist dies der Bruchpunkt des ganzen Modells: Ohne automatische
 * Übergabe ist der Shop nach einem Tag Abwesenheit ein Betrieb, der Geld
 * genommen und nichts bestellt hat. Deshalb erzeugt diese Datei aus einem
 * bezahlten Warenkorb ohne weitere Eingabe je Lieferant eine fertige
 * Bestellung — als Text zum Versenden und als CSV für Schnittstellen.
 */

import { EUR, csvFeld, textZeile } from './format.js';

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
function bestelltext(nummer, teil, auftrag) {
  const zeilen = teil.positionen.map(
    (p) => `  ${String(p.menge).padStart(3)} × ${textZeile(p.sku).padEnd(12)} ${textZeile(p.bezeichnung)}`,
  );

  // Ein Hinweis zur Zufahrt steht direkt unter der Adresse und nicht am Ende:
  // Wer die Bestellung an die Spedition weiterreicht, kopiert den Adressblock,
  // nicht den ganzen Brief.
  const zufahrt = textZeile(auftrag.lieferadresse.hinweis);

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
    `  ${textZeile(auftrag.lieferadresse.name)}`,
    `  ${textZeile(auftrag.lieferadresse.strasse)}`,
    `  ${textZeile(auftrag.lieferadresse.plz)} ${textZeile(auftrag.lieferadresse.ort)}`,
    `  Ansprechpartner vor Ort: ${textZeile(auftrag.lieferadresse.telefon)}`,
    ...(zufahrt ? [`  Hinweis zur Zufahrt: ${zufahrt}`] : []),
    ``,
    `Bitte neutral verpackt und ohne Preisangaben liefern.`,
    `Rechnung an den Auftraggeber laut hinterlegten Stammdaten.`,
    ``,
    `Warenwert netto laut meiner Kalkulation: ${EUR(teil.einkaufNetto)}`,
    ``,
    `Mit freundlichen Grüßen`,
    textZeile(auftrag.absender.firma),
  ].join('\n');
}

function bestellCsv(nummer, teil, auftrag) {
  const kopf = 'bestellnummer;sku;menge;bezeichnung;liefername;lieferstrasse;lieferplz;lieferort';
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

  return { erlaubt: gruende.length === 0, gruende };
}
