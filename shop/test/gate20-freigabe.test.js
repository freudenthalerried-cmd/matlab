import test from 'node:test';
import assert from 'node:assert/strict';
import { darfAutomatischAusgeloestWerden } from '../src/bestellung.js';

// Ein Warenkorb, dessen Positionen bestätigte Preise tragen und dessen
// Mindestbestellwerte erfüllt sind — an ihm allein entscheidet Gate 20.
const korb = (warenwertNetto, einkaufNetto, frachtNetto) => ({
  bestellbar: true,
  warenwertNetto,
  einkaufNetto,
  frachtNetto,
  teillieferungen: [{ lieferantName: 'Testlieferant', lieferzeitWerktage: 5, positionen: [{ ekIstPlatzhalter: false }] }],
});
// Seit dem 1. September gehören Lieferadresse, Ansprechpartner und
// Absenderfirma zu einem auslösbaren Auftrag. Der Fixture-Auftrag trug sie
// nicht — er war nie „gesund", nur nie danach gefragt worden.
const auftrag = (zusatz = {}) => ({
  zahlungEingegangen: true,
  kundeIstUnternehmer: true,
  uid: 'ATU12345675',
  absender: { firma: 'Musterfirma GmbH' },
  lieferadresse: {
    name: 'Bau Muster GmbH',
    strasse: 'Baustellenweg 7',
    plz: '4600',
    ort: 'Wels',
    telefon: '+43 660 1234567',
  },
  ...zusatz,
});

test('Gate 20 sperrt eine Bestellung, die ihre Fracht nicht trägt', () => {
  // 50 € Warenkorb, 20 % Rohmarge, 25 € Fracht frei Haus.
  const freigabe = darfAutomatischAusgeloestWerden(korb(50, 40, 25), auftrag({ frachtVerrechnet: false }));
  assert.equal(freigabe.erlaubt, false);
  assert.ok(
    freigabe.gruende.some((g) => g.startsWith('Gate 20')),
    'die Sperre nennt sich beim Namen, damit man sie im Betrieb wiedererkennt',
  );
});

test('derselbe Warenkorb geht durch, wenn die Fracht verrechnet wird', () => {
  const freigabe = darfAutomatischAusgeloestWerden(korb(50, 40, 25), auftrag({ frachtVerrechnet: true }));
  assert.equal(freigabe.erlaubt, true, 'zahlt der Kunde die Fracht, trägt die Bestellung sich');
});

test('der erfüllte Mindestbestellwert rettet eine Verlustbestellung nicht', () => {
  // bestellbar: true — die Kondition des Lieferanten ist erfüllt. Sie sagt
  // nichts darüber, ob wir an der Bestellung etwas verdienen.
  const k = korb(120, 96, 60);
  assert.equal(k.bestellbar, true);
  const freigabe = darfAutomatischAusgeloestWerden(k, auftrag({ frachtVerrechnet: false }));
  assert.equal(freigabe.erlaubt, false);
  assert.ok(!freigabe.gruende.includes('Mindestbestellwert nicht erreicht'), 'der Mindestbestellwert ist erfüllt');
  assert.ok(freigabe.gruende.some((g) => g.startsWith('Gate 20')), 'trotzdem sperrt Gate 20');
});

test('die Prüfung läuft auch ohne Angaben im Auftrag — sie überspringt sich nicht selbst', () => {
  // Kein zahlweg, kein frachtVerrechnet: Es gilt die Voreinstellung, und die
  // Prüfung findet trotzdem statt. Ein Verkauf unter Einkaufspreis fällt auf.
  const unterEinkauf = darfAutomatischAusgeloestWerden(korb(100, 130, 0), auftrag());
  assert.equal(unterEinkauf.erlaubt, false);
  assert.ok(unterEinkauf.gruende.some((g) => g.startsWith('Gate 20')));
});

test('eine gesunde Bestellung passiert alle Sperren', () => {
  const freigabe = darfAutomatischAusgeloestWerden(korb(650, 520, 25), auftrag({ frachtVerrechnet: false }));
  assert.equal(freigabe.erlaubt, true, freigabe.gruende.join('; '));
  assert.equal(freigabe.gruende.length, 0);
});

/* ------------------------------------------------------------------ *
 * Am echten Katalog: wo die Schwelle jetzt liegt
 * ------------------------------------------------------------------ */

test('eine kleine Palettenbestellung trägt sich nicht mehr, auch mit verrechneter Fracht', async () => {
  // Der Befund vom 28.08., als Probe festgehalten. 50 m² Fassaden-EPS sind
  // 96,50 € Warenwert; die Fracht zahlt der Kunde. Vor dem Einbau von Palette
  // und Folierung stand hier ein Deckungsbeitrag von +24,00 €, jetzt −4,50 €.
  //
  // Ohne Preisdatei ist dieser Test still: Er prüft eine Zahl, die es dann
  // nicht gibt — und ein Test, der ohne Daten grün meldet, wäre schlimmer als
  // keiner.
  const { existsSync, readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
  const preise = pfad('../../preise/baustoff-preise.json');
  if (!existsSync(preise)) return;

  const { ladeBaustoffkatalog } = await import('../src/baustoffkatalog.js');
  const { berechneWarenkorb } = await import('../src/warenkorb.js');
  const { traegtSichSelbst } = await import('../src/kostenbild.js');
  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const lieferanten = lies(pfad('../data/lieferanten.json'));
  const k = ladeBaustoffkatalog(lies(pfad('../data/katalog-baustoff.json')), lies(preise), lieferanten);
  const katalog = { artikel: k.artikel, lieferantenById: new Map(lieferanten.lieferanten.map((l) => [l.id, l])) };

  const klein = berechneWarenkorb([{ sku: 'POS-12566', menge: 50 }], katalog);
  assert.equal(klein.nebenkostenUntergrenzeNetto, 28.5, 'Palette und Folierung stehen im Warenkorb');
  const kleinDeckung = traegtSichSelbst(klein, { frachtVerrechnet: true, zahlwegId: 'vorkasse' });
  assert.equal(kleinDeckung.traegt, false, 'die kleine Palettenbestellung trägt sich nicht');

  const gross = berechneWarenkorb([{ sku: 'POS-12566', menge: 300 }], katalog);
  const grossDeckung = traegtSichSelbst(gross, { frachtVerrechnet: true, zahlwegId: 'vorkasse' });
  assert.equal(grossDeckung.traegt, true, 'die große trägt sich weiterhin');
});

/* ------------------------------------------------------------------ *
 * Die Zustellung, nicht das Geld — Befund vom 1. September
 *
 * Alle Sperren davor schützen das Geld: Zahlung, Konditionen, Marge. Der
 * erzeugte Bestelltext zeigte, was ungeschützt war.
 * ------------------------------------------------------------------ */

const gesund = () => korb(650, 520, 25);

test('Ohne Telefon des Ansprechpartners wird nicht ausgelöst', () => {
  const f = darfAutomatischAusgeloestWerden(gesund(), auftrag({
    lieferadresse: { name: 'B', strasse: 'S 1', plz: '4600', ort: 'Wels' },
    frachtVerrechnet: false,
  }));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Telefon')));
});

test('Ohne Absenderfirma wird nicht ausgelöst — der Lieferant kann sie nicht zuordnen', () => {
  const f = darfAutomatischAusgeloestWerden(gesund(), auftrag({ absender: {}, frachtVerrechnet: false }));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Firma des Bestellers')));
});

test('Ohne bekannte Lieferzeit wird kein Termin unbestellt zugesagt', () => {
  const k = gesund();
  k.teillieferungen = [{ lieferantName: 'Testlieferant', positionen: [{ ekIstPlatzhalter: false }] }];
  const f = darfAutomatischAusgeloestWerden(k, auftrag({ frachtVerrechnet: false }));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Lieferzeit unbekannt')));
});

test('Eine fehlende Lieferadresse meldet jedes Feld einzeln, nicht pauschal', () => {
  const f = darfAutomatischAusgeloestWerden(gesund(), auftrag({ lieferadresse: {}, frachtVerrechnet: false }));
  assert.equal(f.erlaubt, false);
  assert.equal(f.gruende.filter((g) => g.startsWith('Bestelltext unvollständig')).length, 5);
});
