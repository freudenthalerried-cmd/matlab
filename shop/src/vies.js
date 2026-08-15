/**
 * UID-Abfrage beim Mehrwertsteuer-Informationsaustauschsystem der EU.
 *
 * `kunde.js` prüft heute nur Format und Prüfziffer und sagt ausdrücklich, dass
 * die verbindliche Abfrage aussteht. Der Trockenlauf in
 * `docs/baustoff-shop/trockenlauf-auftrag.md` beziffert diese Lücke: zwei
 * Minuten Handarbeit je Bestellung, 1,2 Stunden im Monat — und sie ist der
 * einzige der sechs Engpässe, der ohne Freigabe und ohne Ausgabe lösbar wäre.
 *
 * **Was hier fehlt und warum.** Der Dienst ist aus dieser Umgebung nicht
 * erreichbar; der Proxy beantwortet den Verbindungsaufbau mit 403. Die
 * Antwortstruktur ist deshalb aus der Dokumentation nachgebildet, **nicht an
 * der echten Schnittstelle geprüft**. Die Auswertung ist entsprechend
 * misstrauisch gebaut: Was sie nicht sicher als gültig oder ungültig erkennt,
 * gilt als unbestätigt — nie als in Ordnung.
 *
 * Die drei Zustände sind der eigentliche Inhalt dieser Datei. Ein Dienst, der
 * nicht antwortet, sagt nichts über die UID. Wer daraus „ungültig" macht,
 * weist Kunden ab, weil ein fremder Server gerade neu startet; wer daraus
 * „gültig" macht, hat die Prüfung nicht.
 */

export const VIES_ENDPUNKT = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';

export const STAND = {
  GUELTIG: 'gueltig',
  UNGUELTIG: 'ungueltig',
  UNBESTAETIGT: 'unbestaetigt',
};

/** Fehlerkennungen, bei denen ein weiterer Versuch sinnvoll ist. */
const VORUEBERGEHEND = new Set([
  'MS_UNAVAILABLE',
  'MS_MAX_CONCURRENT_REQ',
  'SERVICE_UNAVAILABLE',
  'TIMEOUT',
  'SERVER_BUSY',
  'GLOBAL_MAX_CONCURRENT_REQ',
]);

/**
 * Länderkürzel, die der Dienst kennt.
 *
 * Zwei Fallen stecken darin. Griechenland führt seine UID unter **EL**, nicht
 * unter GR — wer die ISO-Liste nimmt, weist griechische Kunden ab. Und **XI**
 * steht für Nordirland, das nach dem Austritt für Warenlieferungen im
 * Mehrwertsteuersystem der Union geblieben ist; GB steht nicht darin.
 */
export const LAENDER = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR',
  'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI',
  'SK', 'XI',
]);

/**
 * Zerlegt eine UID in Länderkürzel und Nummer. Gibt null zurück, wenn das nicht geht.
 *
 * Das Länderkürzel wird gegen die Liste geprüft, nicht bloß gegen „zwei
 * Buchstaben". Sonst wird aus jedem Tippfehler eine Anfrage an einen Dienst,
 * der sie nicht beantworten kann — und aus „keine uid" ein Land namens KE.
 */
export function zerlegeUid(uid) {
  const roh = String(uid ?? '').toUpperCase().replace(/[\s.-]/g, '');
  const treffer = /^([A-Z]{2})([0-9A-Z+*]{2,13})$/.exec(roh);
  if (!treffer || !LAENDER.has(treffer[1])) return null;
  return { land: treffer[1], nummer: treffer[2] };
}

/**
 * Baut die Anfrage.
 *
 * Mit `eigeneUid` wird daraus eine **qualifizierte Bestätigungsanfrage**: Der
 * Dienst gibt dann eine Abfrage-Identifikation zurück, und genau die ist der
 * Nachweis, dass geprüft wurde. Ohne sie bleibt von der Prüfung nichts übrig,
 * was man später vorlegen könnte — und der Nachweis ist der ganze Zweck.
 */
export function baueAnfrage(uid, { eigeneUid = null } = {}) {
  const teil = zerlegeUid(uid);
  if (!teil) throw new Error(`Keine auswertbare UID: ${uid}`);

  const koerper = { countryCode: teil.land, vatNumber: teil.nummer };

  if (eigeneUid) {
    const eigen = zerlegeUid(eigeneUid);
    if (!eigen) throw new Error(`Keine auswertbare eigene UID: ${eigeneUid}`);
    koerper.requesterMemberStateCode = eigen.land;
    koerper.requesterNumber = eigen.nummer;
  }

  return { url: VIES_ENDPUNKT, methode: 'POST', koerper, qualifiziert: Boolean(eigeneUid) };
}

/**
 * Wertet eine Antwort aus.
 *
 * Alles, was nicht eindeutig ist, wird `unbestaetigt`. Das gilt ausdrücklich
 * auch für eine Antwort, deren Struktur nicht zu dieser Erwartung passt — die
 * Struktur ist hier aus der Dokumentation nachgebaut, nicht gemessen.
 */
export function werteAntwortAus(antwort) {
  if (!antwort || typeof antwort !== 'object') {
    return { stand: STAND.UNBESTAETIGT, grund: 'Keine auswertbare Antwort', wiederholbar: true };
  }

  const fehler = antwort.userError ?? antwort.errorWrappers?.[0]?.error ?? null;

  if (fehler && fehler !== 'VALID' && fehler !== 'INVALID') {
    return {
      stand: STAND.UNBESTAETIGT,
      grund: `Dienst meldet ${fehler}`,
      wiederholbar: VORUEBERGEHEND.has(fehler),
    };
  }

  if (typeof antwort.isValid !== 'boolean') {
    return {
      stand: STAND.UNBESTAETIGT,
      grund: 'Antwort ohne verwertbares Gültigkeitskennzeichen',
      wiederholbar: true,
    };
  }

  return {
    stand: antwort.isValid ? STAND.GUELTIG : STAND.UNGUELTIG,
    name: antwort.name && antwort.name !== '---' ? antwort.name : null,
    anschrift: antwort.address && antwort.address !== '---' ? antwort.address : null,
    abfrageId: antwort.requestIdentifier || null,
    abfrageDatum: antwort.requestDate || null,
    grund: antwort.isValid ? 'Vom Mitgliedstaat bestätigt' : 'Vom Mitgliedstaat als ungültig gemeldet',
    wiederholbar: false,
  };
}

/**
 * Führt die Abfrage aus. Der Abruf wird hereingereicht, damit die Testfälle
 * ohne Netz auskommen — und damit später ein anderer Weg eingesetzt werden
 * kann, ohne diese Datei zu ändern.
 *
 * @param {string} uid
 * @param {{abruf: Function, eigeneUid?: string, versuche?: number}} optionen
 */
export async function pruefeUid(uid, { abruf, eigeneUid = null, versuche = 3 } = {}) {
  if (typeof abruf !== 'function') throw new Error('pruefeUid braucht einen Abruf');

  const anfrage = baueAnfrage(uid, { eigeneUid });
  let letzte = { stand: STAND.UNBESTAETIGT, grund: 'Nicht ausgeführt', wiederholbar: true };

  for (let versuch = 1; versuch <= versuche; versuch++) {
    let auswertung;
    try {
      auswertung = werteAntwortAus(await abruf(anfrage));
    } catch (fehler) {
      auswertung = { stand: STAND.UNBESTAETIGT, grund: `Abruf gescheitert: ${fehler.message}`, wiederholbar: true };
    }

    letzte = { ...auswertung, versuche: versuch, qualifiziert: anfrage.qualifiziert };
    if (!auswertung.wiederholbar) return letzte;
  }

  return letzte;
}

/**
 * Die Zeile, die in die Ablage gehört.
 *
 * Eine Prüfung, die niemand belegen kann, ist keine Prüfung. Bei der
 * qualifizierten Anfrage steht die Abfrage-Identifikation darin; fehlt sie,
 * sagt die Zeile das ausdrücklich, statt es zu verschweigen.
 */
export function belegzeile(auswertung, uid) {
  const teile = [
    `UID ${uid}`,
    auswertung.stand,
    auswertung.abfrageDatum ?? 'ohne Datum',
    auswertung.abfrageId ? `Abfrage-ID ${auswertung.abfrageId}` : 'ohne Abfrage-ID — nicht als Nachweis geeignet',
  ];
  if (auswertung.name) teile.push(auswertung.name);
  return teile.join(' · ');
}

/**
 * Ergänzt eine bestehende Freigabeprüfung um das Abfrageergebnis.
 *
 * Bewusst additiv: `darfAutomatischAusgeloestWerden` bleibt unverändert, diese
 * Funktion legt einen Grund oben drauf. Eine unbestätigte UID hält die
 * **automatische Auslösung** an — sie weist die Bestellung nicht zurück. Der
 * Unterschied ist der ganze Punkt: Der Dienst fällt regelmäßig aus, und ein
 * Ausfall in Brüssel darf keinen Auftrag in Wels kosten.
 */
export function ergaenzeFreigabe(freigabe, auswertung) {
  const gruende = [...freigabe.gruende];

  if (auswertung.stand === STAND.UNGUELTIG) {
    gruende.push('UID vom Mitgliedstaat als ungültig gemeldet — Gate 7 nicht erfüllt');
  } else if (auswertung.stand !== STAND.GUELTIG) {
    gruende.push(`UID nicht bestätigt (${auswertung.grund}) — Bestellung wartet, sie ist nicht abgelehnt`);
  } else if (!auswertung.abfrageId) {
    gruende.push('UID bestätigt, aber ohne Abfrage-Identifikation — kein vorlegbarer Nachweis');
  }

  return { erlaubt: gruende.length === 0, gruende, uidStand: auswertung.stand };
}
