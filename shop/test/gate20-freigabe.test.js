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
  teillieferungen: [{ positionen: [{ ekIstPlatzhalter: false }] }],
});
const auftrag = (zusatz = {}) => ({
  zahlungEingegangen: true,
  kundeIstUnternehmer: true,
  uid: 'ATU12345675',
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
