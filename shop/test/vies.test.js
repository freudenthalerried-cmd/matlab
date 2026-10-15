import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAND,
  LAENDER,
  zerlegeUid,
  baueAnfrage,
  werteAntwortAus,
  pruefeUid,
  belegzeile,
  ergaenzeFreigabe,
} from '../src/vies.js';

/**
 * Nachgebildete Antworten — **nicht an der echten Schnittstelle aufgezeichnet**.
 * Der Dienst ist aus dieser Umgebung nicht erreichbar. Sobald eine echte
 * Antwort vorliegt, gehört sie hier hinein, und die Auswertung ist erneut zu
 * prüfen.
 */
const ANTWORTEN = {
  gueltig: {
    isValid: true,
    requestDate: '2026-08-15+02:00',
    userError: 'VALID',
    name: 'Musterfirma GmbH',
    address: 'Musterweg 1, 4600 Wels',
    requestIdentifier: 'WAPIAAAAXjJ2t1Zs',
    countryCode: 'AT',
    vatNumber: 'U12345675',
  },
  ungueltig: { isValid: false, requestDate: '2026-08-15+02:00', userError: 'INVALID', name: '---', address: '---' },
  dienstAus: { isValid: false, userError: 'MS_UNAVAILABLE' },
  ueberlastet: { isValid: false, userError: 'MS_MAX_CONCURRENT_REQ' },
  ohneNachweis: { isValid: true, userError: 'VALID', name: 'Musterfirma GmbH', requestIdentifier: '' },
  fremd: { status: 'ok', ergebnis: 'passt schon' },
};

test('Eine UID wird in Land und Nummer zerlegt', () => {
  assert.deepEqual(zerlegeUid('ATU12345675'), { land: 'AT', nummer: 'U12345675' });
  assert.deepEqual(zerlegeUid('at u123 456-75'), { land: 'AT', nummer: 'U12345675' });
  assert.deepEqual(zerlegeUid('DE123456789'), { land: 'DE', nummer: '123456789' });
  assert.equal(zerlegeUid('12345675'), null);
  assert.equal(zerlegeUid(''), null);
});

test('Ein Buchstabenpaar ist noch kein Länderkürzel', () => {
  assert.equal(zerlegeUid('keine uid'), null, 'KE ist kein Mitgliedstaat');
  assert.equal(zerlegeUid('GB123456789'), null, 'GB ist seit dem Austritt draußen');
});

test('Die beiden Sonderfälle der Länderliste stehen drin', () => {
  assert.ok(LAENDER.has('EL'), 'Griechenland führt EL, nicht GR');
  assert.ok(!LAENDER.has('GR'));
  assert.ok(LAENDER.has('XI'), 'Nordirland bleibt für Waren im System');
  assert.equal(LAENDER.size, 28, '27 Mitgliedstaaten plus XI');
});

test('Ohne eigene UID ist die Anfrage einfach, mit ihr qualifiziert', () => {
  const einfach = baueAnfrage('ATU12345675');
  assert.equal(einfach.qualifiziert, false);
  assert.deepEqual(einfach.koerper, { countryCode: 'AT', vatNumber: 'U12345675' });

  const qualifiziert = baueAnfrage('DE123456789', { eigeneUid: 'ATU12345675' });
  assert.equal(qualifiziert.qualifiziert, true);
  assert.equal(qualifiziert.koerper.requesterMemberStateCode, 'AT');
  assert.equal(qualifiziert.koerper.requesterNumber, 'U12345675');
});

test('Eine unbrauchbare UID wirft, statt eine sinnlose Anfrage zu bauen', () => {
  assert.throws(() => baueAnfrage('keine uid'), /Keine auswertbare UID/);
});

test('Gültig, ungültig und unbestätigt sind drei verschiedene Dinge', () => {
  assert.equal(werteAntwortAus(ANTWORTEN.gueltig).stand, STAND.GUELTIG);
  assert.equal(werteAntwortAus(ANTWORTEN.ungueltig).stand, STAND.UNGUELTIG);
  assert.equal(werteAntwortAus(ANTWORTEN.dienstAus).stand, STAND.UNBESTAETIGT);
});

test('Ein ausgefallener Dienst macht keine ungültige UID', () => {
  const a = werteAntwortAus(ANTWORTEN.dienstAus);
  assert.notEqual(a.stand, STAND.UNGUELTIG);
  assert.equal(a.wiederholbar, true);
  assert.match(a.grund, /MS_UNAVAILABLE/);
});

test('Eine fremde Antwortstruktur gilt als unbestätigt, nicht als in Ordnung', () => {
  const a = werteAntwortAus(ANTWORTEN.fremd);
  assert.equal(a.stand, STAND.UNBESTAETIGT);
  assert.equal(werteAntwortAus(null).stand, STAND.UNBESTAETIGT);
  assert.equal(werteAntwortAus('gültig').stand, STAND.UNBESTAETIGT);
});

test('Die Platzhalter --- werden nicht als Name ausgegeben', () => {
  const a = werteAntwortAus(ANTWORTEN.ungueltig);
  assert.equal(a.name, null);
  assert.equal(a.anschrift, null);
});

test('Ein vorübergehender Fehler wird wiederholt, ein endgültiger nicht', async () => {
  let aufrufe = 0;
  const wackelig = async () => {
    aufrufe++;
    return aufrufe < 3 ? ANTWORTEN.ueberlastet : ANTWORTEN.gueltig;
  };
  const a = await pruefeUid('ATU12345675', { abruf: wackelig });
  assert.equal(a.stand, STAND.GUELTIG);
  assert.equal(a.versuche, 3);

  aufrufe = 0;
  const klar = async () => {
    aufrufe++;
    return ANTWORTEN.ungueltig;
  };
  const b = await pruefeUid('ATU12345675', { abruf: klar });
  assert.equal(b.stand, STAND.UNGUELTIG);
  assert.equal(aufrufe, 1, 'ein klares Nein wird nicht wiederholt');
});

test('Bleibt der Dienst aus, endet es unbestätigt — nicht in einer Schleife', async () => {
  let aufrufe = 0;
  const tot = async () => {
    aufrufe++;
    throw new Error('Verbindung abgelehnt');
  };
  const a = await pruefeUid('ATU12345675', { abruf: tot, versuche: 2 });
  assert.equal(a.stand, STAND.UNBESTAETIGT);
  assert.equal(aufrufe, 2);
  assert.match(a.grund, /Abruf gescheitert/);
});

test('Ohne Abruf lässt sich nichts prüfen, und das wird gesagt', async () => {
  await assert.rejects(() => pruefeUid('ATU12345675'), /braucht einen Abruf/);
});

test('Die Belegzeile benennt eine fehlende Abfrage-Identifikation ausdrücklich', () => {
  const mit = belegzeile(werteAntwortAus(ANTWORTEN.gueltig), 'ATU12345675');
  assert.match(mit, /Abfrage-ID WAPIAAAAXjJ2t1Zs/);
  assert.match(mit, /Musterfirma GmbH/);

  const ohne = belegzeile(werteAntwortAus(ANTWORTEN.ohneNachweis), 'ATU12345675');
  assert.match(ohne, /nicht als Nachweis geeignet/);
});

test('Eine ungültige UID sperrt, eine unbestätigte hält nur an', () => {
  const frei = { erlaubt: true, gruende: [] };

  const ungueltig = ergaenzeFreigabe(frei, werteAntwortAus(ANTWORTEN.ungueltig));
  assert.equal(ungueltig.erlaubt, false);
  assert.ok(ungueltig.gruende.some((g) => /Gate 7 nicht erfüllt/.test(g)));

  const unbestaetigt = ergaenzeFreigabe(frei, werteAntwortAus(ANTWORTEN.dienstAus));
  assert.equal(unbestaetigt.erlaubt, false);
  assert.ok(
    unbestaetigt.gruende.some((g) => /sie ist nicht abgelehnt/.test(g)),
    'ein Ausfall in Brüssel darf keinen Auftrag kosten',
  );
});

test('Eine bestätigte UID ohne Nachweis reicht nicht', () => {
  const f = ergaenzeFreigabe({ erlaubt: true, gruende: [] }, werteAntwortAus(ANTWORTEN.ohneNachweis));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /kein vorlegbarer Nachweis/.test(g)));
});

test('Eine bestätigte UID mit Nachweis fügt keinen Grund hinzu', () => {
  const f = ergaenzeFreigabe({ erlaubt: true, gruende: [] }, werteAntwortAus(ANTWORTEN.gueltig));
  assert.equal(f.erlaubt, true);
  assert.deepEqual(f.gruende, []);
  assert.equal(f.uidStand, STAND.GUELTIG);
});

test('Bestehende Gründe bleiben erhalten', () => {
  const vorher = { erlaubt: false, gruende: ['Zahlung nicht eingegangen'] };
  const f = ergaenzeFreigabe(vorher, werteAntwortAus(ANTWORTEN.gueltig));
  assert.deepEqual(f.gruende, ['Zahlung nicht eingegangen']);
  assert.deepEqual(vorher.gruende, ['Zahlung nicht eingegangen'], 'die Vorlage darf sich nicht ändern');
});
