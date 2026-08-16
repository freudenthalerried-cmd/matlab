/**
 * Prüfung der Bestelldaten.
 *
 * Setzt Gate 7 um: Der Warenverkauf richtet sich ausschließlich an Unternehmer.
 * Das ist keine Formalie — davon hängt ab, ob § 11 FAGG mit seiner
 * Zwölfmonatsfalle greift. Ein Hinweis „nur für Gewerbetreibende" im
 * Kleingedruckten genügt dafür nicht; der Bestellprozess muss
 * Verbraucherbestellungen tatsächlich ausschließen.
 */

import { hatSteuerzeichen } from './format.js';
import { ZUSICHERUNG_DRITTER } from './rechtstexte.js';

const AT_UID = /^ATU\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/**
 * Eine vierstellige Postleitzahl beweist **nicht** Österreich.
 *
 * Beim Bauen der Baustellenadresse aufgefallen und dann auch an der
 * Rechnungsanschrift nachgewiesen: `6900` ist Lugano, `9490` ist Vaduz, `8001`
 * ist Zürich — alle vierstellig, alle über 1000, alle bis hierher als
 * österreichisch durchgegangen. Die Schweiz und Liechtenstein sind
 * **Drittland**; eine Lieferung dorthin ist eine Ausfuhr und hat mit den 20 %
 * auf der Rechnung nichts zu tun.
 *
 * Das Land muss deshalb dastehen, statt aus der Postleitzahl geraten zu
 * werden. Voreinstellung `AT`, weil der Shop nur Österreich bedient — aber als
 * ausgesprochene Voreinstellung, nicht als stille Annahme.
 */
const LIEFERLAND = 'AT';

const landVon = (wert) => String(wert ?? LIEFERLAND).trim().toUpperCase() || LIEFERLAND;

/**
 * Prüfziffer einer österreichischen UID nach dem gebräuchlichen Verfahren.
 *
 * Bewusst **nur als Warnung** verwendet: Verbindlich ist allein die Abfrage
 * beim Mehrwertsteuer-Informationsaustauschsystem der EU. Ein Validator, der
 * eine gültige UID zurückweist, richtet mehr Schaden an als gar keiner.
 */
export function uidPruefzifferStimmt(uid) {
  if (!AT_UID.test(uid)) return false;
  const z = uid.slice(3).split('').map(Number);
  let summe = 0;
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) {
      summe += z[i];
    } else {
      const doppelt = z[i] * 2;
      summe += Math.floor(doppelt / 10) + (doppelt % 10);
    }
  }
  return (96 - summe) % 10 === z[7];
}

const pflicht = (wert) => typeof wert === 'string' && wert.trim().length > 0;

/**
 * Prüft die abweichende Lieferanschrift — die Baustelle.
 *
 * Der Regelfall, nicht die Ausnahme: Ein Handwerksbetrieb bestellt vom Büro
 * aus für eine Baustelle, die woanders liegt. Bis hierher konnte der Shop
 * diese Bestellung gar nicht abbilden; die Ware ging zwangsläufig an die
 * Rechnungsanschrift. Für die Zielgruppe aus `PARAMETER.md` — vorrangig
 * Handwerksbetriebe — ist das keine kleine Lücke.
 *
 * **Die Baustelle muss in Österreich liegen, und das ist keine Formalie.**
 * Der Rechnungstext schließt mit „Leistungsort Österreich, Steuersatz 20 %",
 * und `reihengeschaeftEinordnung` schließt daraus auf „Ausgangsrechnung mit
 * 20 %". Beides gilt nur, solange die Ware im Inland ankommt. Geht sie in
 * einen anderen Mitgliedstaat, ist die Lieferung nach Art 6 und 7 UStG
 * steuerfrei — dann wären 20 % auf der Rechnung schlicht falsch, und im
 * Reihengeschäft entscheidet zusätzlich die bewegte Lieferung. Solange das
 * nicht durchgerechnet ist, wird die Bestellung abgewiesen statt falsch
 * verrechnet.
 *
 * Der Ansprechpartner ist hier ein eigenes Feld. Die Spedition ruft nicht im
 * Büro an, sondern auf der Baustelle.
 */
function pruefeBaustelle(baustelle) {
  const fehler = [];

  const strasse = String(baustelle.strasse ?? '').trim();
  const plz = String(baustelle.plz ?? '').trim();
  const ort = String(baustelle.ort ?? '').trim();
  const telefon = String(baustelle.telefon ?? '').trim();
  const name = String(baustelle.name ?? '').trim();
  const hinweis = String(baustelle.hinweis ?? '').trim();
  // Hier **ohne** Voreinstellung. Die Baustelle ist der neue, freiwillige Block;
  // ein Land zu verlangen kostet nichts und schließt genau die Lücke, um die es
  // geht. Bei der Rechnungsanschrift bleibt `AT` die Voreinstellung — dort
  // stützt die verlangte ATU-Nummer die Annahme, hier stützt sie nichts.
  const land = String(baustelle.land ?? '').trim().toUpperCase();

  if (!pflicht(strasse)) fehler.push('Baustelle: Straße und Hausnummer fehlen');
  if (!pflicht(ort)) fehler.push('Baustelle: Ort fehlt');
  if (!pflicht(telefon)) {
    fehler.push('Baustelle: Ansprechpartner vor Ort fehlt — die Spedition braucht eine Nummer');
  }

  for (const [bezeichnung, wert] of [
    ['Baustelle — Name', baustelle.name],
    ['Baustelle — Straße', baustelle.strasse],
    ['Baustelle — Ort', baustelle.ort],
    ['Baustelle — Ansprechpartner', baustelle.telefon],
    ['Baustelle — Hinweis', baustelle.hinweis],
  ]) {
    if (hatSteuerzeichen(wert)) {
      fehler.push(`${bezeichnung}: Zeilenumbrüche und Steuerzeichen sind hier nicht zulässig`);
    }
  }

  // Das Land zuerst, die Postleitzahl danach — in dieser Reihenfolge, weil die
  // Postleitzahl das Land nicht bestimmt.
  if (land === '') {
    fehler.push('Baustelle: Land fehlt — eine vierstellige Postleitzahl beweist nicht Österreich');
  } else if (land !== LIEFERLAND) {
    fehler.push(
      `Baustelle: Lieferung nur innerhalb Österreichs, angegeben ist ${land} — außerhalb ` +
        'wäre die Rechnung mit 20 % Umsatzsteuer falsch (Art 6, 7 UStG; Drittland: Ausfuhr)',
    );
  } else if (!/^\d{4}$/.test(plz) || Number(plz) < 1000) {
    fehler.push('Baustelle: Postleitzahl muss vierstellig und österreichisch sein');
  }

  return { fehler, normalisiert: { name, strasse, plz, ort, land, telefon, hinweis } };
}

/**
 * @param {object} daten
 * @returns {{gueltig: boolean, fehler: string[], warnungen: string[], normalisiert: object}}
 */
export function pruefeBestelldaten(daten = {}) {
  const fehler = [];
  const warnungen = [];

  const firma = String(daten.firma ?? '').trim();
  const uid = String(daten.uid ?? '').trim().toUpperCase().replace(/\s/g, '');
  const email = String(daten.email ?? '').trim();
  const strasse = String(daten.strasse ?? '').trim();
  const plz = String(daten.plz ?? '').trim();
  const ort = String(daten.ort ?? '').trim();
  const telefon = String(daten.telefon ?? '').trim();
  const land = landVon(daten.land);

  if (!pflicht(firma)) fehler.push('Firmenname fehlt');
  if (!pflicht(strasse)) fehler.push('Straße und Hausnummer fehlen');
  if (!pflicht(ort)) fehler.push('Ort fehlt');
  if (!pflicht(telefon)) fehler.push('Telefonnummer fehlt — die Spedition braucht sie für die Baustelle');

  // Zeilenumbrüche in einem Adressfeld sind keine Formalie. Die Felder wandern
  // unverändert in den Bestelltext an den Lieferanten, und der ist
  // zeilenorientiert: Wer eine Zeile unterbringt, die aussieht wie eine
  // Position, hat eine Position bestellt. Nachgewiesen mit dem Firmennamen
  // "Bau Muster GmbH\n  999 × AB-RD-375  Abdichtungsbahn" — er kam durch diese
  // Prüfung und stand danach als zweite Position in der Bestellung.
  //
  // Abgewiesen statt stillschweigend bereinigt: Ein Firmenname mit
  // Zeilenumbruch ist keine Schreibweise, die jemand versehentlich wählt.
  for (const [name, wert] of [
    ['Firmenname', daten.firma],
    ['Straße', daten.strasse],
    ['Ort', daten.ort],
    ['Telefonnummer', daten.telefon],
    ['E-Mail-Adresse', daten.email],
  ]) {
    if (hatSteuerzeichen(wert)) {
      fehler.push(`${name}: Zeilenumbrüche und Steuerzeichen sind hier nicht zulässig`);
    }
  }

  if (land !== LIEFERLAND) {
    fehler.push(`Rechnungsanschrift außerhalb Österreichs (${land}) — dieser Shop bedient nur Österreich`);
  } else if (!/^\d{4}$/.test(plz) || Number(plz) < 1000) {
    fehler.push('Postleitzahl muss vierstellig und österreichisch sein');
  }

  if (!EMAIL.test(email)) fehler.push('E-Mail-Adresse fehlt oder ist unvollständig');

  // Gate 7 — beides zusammen, nicht eines von beiden.
  if (daten.unternehmerBestaetigt !== true) {
    fehler.push('Bestätigung fehlt, dass die Bestellung für ein Unternehmen erfolgt (Gate 7)');
  }
  if (!AT_UID.test(uid)) {
    fehler.push('UID-Nummer fehlt oder hat nicht das Format ATU gefolgt von acht Ziffern');
  } else if (!uidPruefzifferStimmt(uid)) {
    warnungen.push(
      'Die Prüfziffer der UID passt nicht zum üblichen Verfahren. Verbindlich ist ' +
        'die Abfrage beim EU-Informationsaustauschsystem — bitte vor der Rechnung prüfen.',
    );
  }

  // Die Baustelle ist freiwillig. Fehlt sie, geht die Ware an die
  // Rechnungsanschrift — das bisherige Verhalten, unverändert.
  let baustelle = null;
  if (daten.baustelle) {
    const b = pruefeBaustelle(daten.baustelle);
    fehler.push(...b.fehler);
    baustelle = b.normalisiert;

    // Art. 14 DSGVO: Der Ansprechpartner vor Ort ist ein Dritter. Der Shop
    // erreicht ihn nicht — der Besteller schon. Die Zusicherung wird deshalb
    // hier verlangt und nicht im Kleingedruckten vermutet.
    //
    // Bewusst an die Baustelle geknüpft und nicht an eine Namensprüfung: Ob der
    // genannte Ansprechpartner der Besteller selbst ist, kann der Shop nicht
    // zuverlässig erkennen. Eine Kästchenauswahl zu viel kostet den Kunden
    // nichts; eine zu wenig kostet die Grundlage.
    if (daten[ZUSICHERUNG_DRITTER.feld] !== true) {
      fehler.push(
        'Baustelle: Bestätigung fehlt, dass der Ansprechpartner vor Ort über die ' +
          'Weitergabe seiner Daten informiert wurde (Art. 14 DSGVO)',
      );
    }
    // Ohne eigenen Namen steht der Besteller auf dem Lieferschein. Das ist die
    // richtige Voreinstellung: Wer die Ware annimmt, ist im Zweifel er selbst.
    if (!baustelle.name) baustelle.name = firma;
  }

  return {
    gueltig: fehler.length === 0,
    fehler,
    warnungen,
    normalisiert: { firma, uid, email, strasse, plz, ort, land, telefon, baustelle },
  };
}

/**
 * Führt Warenkorb und Kundendaten zu einem Auftrag zusammen, wie ihn
 * erzeugeBestellungen() und darfAutomatischAusgeloestWerden() erwarten.
 */
export function baueAuftrag(bestellnummer, kundendaten, { zahlungEingegangen = false } = {}) {
  const { normalisiert } = pruefeBestelldaten(kundendaten);
  const b = normalisiert.baustelle;

  return {
    bestellnummer,
    zahlungEingegangen,
    kundeIstUnternehmer: kundendaten.unternehmerBestaetigt === true,
    uid: normalisiert.uid || null,
    absender: { firma: '— Firmendaten des Betreibers fehlen noch —' },
    // Ohne angegebene Baustelle bleibt es beim bisherigen Verhalten: Die Ware
    // geht an die Rechnungsanschrift.
    lieferungAnRechnungsadresse: b === null,
    lieferadresse: b
      ? { name: b.name, strasse: b.strasse, plz: b.plz, ort: b.ort, telefon: b.telefon, hinweis: b.hinweis }
      : {
          name: normalisiert.firma,
          strasse: normalisiert.strasse,
          plz: normalisiert.plz,
          ort: normalisiert.ort,
          telefon: normalisiert.telefon,
          hinweis: '',
        },
  };
}
