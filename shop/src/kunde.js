/**
 * Prüfung der Bestelldaten.
 *
 * Setzt Gate 7 um: Der Warenverkauf richtet sich ausschließlich an Unternehmer.
 * Das ist keine Formalie — davon hängt ab, ob § 11 FAGG mit seiner
 * Zwölfmonatsfalle greift. Ein Hinweis „nur für Gewerbetreibende" im
 * Kleingedruckten genügt dafür nicht; der Bestellprozess muss
 * Verbraucherbestellungen tatsächlich ausschließen.
 */

const AT_UID = /^ATU\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

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

  if (!pflicht(firma)) fehler.push('Firmenname fehlt');
  if (!pflicht(strasse)) fehler.push('Straße und Hausnummer fehlen');
  if (!pflicht(ort)) fehler.push('Ort fehlt');
  if (!pflicht(telefon)) fehler.push('Telefonnummer fehlt — die Spedition braucht sie für die Baustelle');

  if (!/^\d{4}$/.test(plz)) {
    fehler.push('Postleitzahl muss vierstellig sein');
  } else if (Number(plz) < 1000) {
    fehler.push('Postleitzahl außerhalb des österreichischen Bereichs');
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

  return {
    gueltig: fehler.length === 0,
    fehler,
    warnungen,
    normalisiert: { firma, uid, email, strasse, plz, ort, telefon },
  };
}

/**
 * Führt Warenkorb und Kundendaten zu einem Auftrag zusammen, wie ihn
 * erzeugeBestellungen() und darfAutomatischAusgeloestWerden() erwarten.
 */
export function baueAuftrag(bestellnummer, kundendaten, { zahlungEingegangen = false } = {}) {
  const { normalisiert } = pruefeBestelldaten(kundendaten);
  return {
    bestellnummer,
    zahlungEingegangen,
    kundeIstUnternehmer: kundendaten.unternehmerBestaetigt === true,
    uid: normalisiert.uid || null,
    absender: { firma: '— Firmendaten des Betreibers fehlen noch —' },
    lieferadresse: {
      name: normalisiert.firma,
      strasse: normalisiert.strasse,
      plz: normalisiert.plz,
      ort: normalisiert.ort,
      telefon: normalisiert.telefon,
    },
  };
}
