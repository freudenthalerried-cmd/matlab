import test from 'node:test';
import assert from 'node:assert/strict';
import { SKONTO_SATZ, skontoErsparnis, zahlungszielTraegt, skontoGegenGebuehr } from '../src/skonto.js';
import { zahlwegGegenSkonto } from '../src/kostenbild.js';
import { ZAHLWEGE, findeZahlweg, pruefeZahlweg, ANFORDERUNGEN } from '../src/zahlung.js';

/* Die Referenzbestellung aus `kampagne-gerechnet.md`, auf einen mittleren
 * Warenkorb heruntergerechnet: 646 € Ware netto, 75,50 € Fracht, Einkauf
 * 484,50 € — also 25 % Marge auf die Ware. */
const BESTELLUNG = { warenwertNetto: 646, frachtNetto: 75.5, einkaufNetto: 484.5 };

test('Das Skonto rechnet auf den Einkauf, die Gebühr auf den Bruttobetrag', () => {
  const r = zahlwegGegenSkonto(BESTELLUNG, 'eps');
  assert.equal(r.bemessungSkonto, 484.5);
  assert.equal(r.bemessungGebuehr, 865.8, '(646 + 75,50) × 1,2');
  assert.ok(
    r.bemessungGebuehr > r.bemessungSkonto * 1.7,
    'die Gebühr bemisst sich an einer deutlich größeren Grundlage — daran hängt die ganze Entscheidung',
  );
});

test('Ohne gehaltene Frist gibt es kein Skonto, auch nicht anteilig', () => {
  const r = zahlwegGegenSkonto(BESTELLUNG, 'offene-rechnung');
  assert.equal(r.haeltFrist, false);
  assert.equal(r.skontoNetto, 0, 'Skonto ist eine Ja-Nein-Größe');
  assert.equal(r.gebuehrBrutto, 0, 'und kostet dafür keine Gebühr');
});

test('Der Weg ohne Gebühr ist nicht der günstigste', () => {
  // Der Kern des Befunds: „kostenlos" heißt hier, auf 14,54 € Skonto je
  // Bestellung zu verzichten, um 8,04 € Gebühr zu sparen.
  const eps = zahlwegGegenSkonto(BESTELLUNG, 'eps');
  const offen = zahlwegGegenSkonto(BESTELLUNG, 'offene-rechnung');
  assert.ok(eps.netto > offen.netto, `EPS ${eps.netto} muss über offener Rechnung ${offen.netto} liegen`);
});

test('Der Rechnungskauf über einen Anbieter hält die Frist — und kostet trotzdem mehr, als er bringt', () => {
  // Die Berichtigung vom 26. August: Anbieter und offene Rechnung sind nicht
  // dasselbe. Der Anbieter zahlt sofort aus, das Gate hält, aber die Gebühr
  // frisst das Skonto und mehr.
  const r = zahlwegGegenSkonto(BESTELLUNG, 'rechnungskauf');
  assert.equal(r.haeltFrist, true);
  assert.ok(r.skontoNetto > 0);
  assert.ok(r.netto < 0, `erwartet negativ, ist ${r.netto}`);
});

test('Gate 21 misst den Geldeingang, nicht das Ziel auf der Rechnung', () => {
  for (const z of ZAHLWEGE) {
    const erwartet = z.tageBisEingang + 2 <= 14;
    const gate = ANFORDERUNGEN.find((a) => a.id === 'skontoErreichbar');
    assert.equal(gate.erfuellt(z), erwartet, `${z.id}: ${z.tageBisEingang} Tage bis Eingang`);
  }
});

test('Genau zwei Wege verletzen Gate 21 — und beide aus demselben Grund', () => {
  const verletzt = ZAHLWEGE.filter((z) => !zahlungszielTraegt({ kundenzielTage: z.tageBisEingang }).traegt);
  assert.deepEqual(verletzt.map((z) => z.id).sort(), ['nachnahme', 'offene-rechnung']);
});

test('Die offene Rechnung steht als eigener Zahlweg neben dem Anbieter', () => {
  // Bis zum 26. August waren beide eine Zeile. Sie verhalten sich
  // gegensätzlich: der eine kostet Gebühr und hält die Frist, der andere
  // kostet nichts und verliert sie.
  const offen = findeZahlweg('offene-rechnung');
  const anbieter = findeZahlweg('rechnungskauf');
  assert.equal(offen.prozent, 0);
  assert.ok(anbieter.prozent > 0);
  assert.ok(offen.tageBisEingang > anbieter.tageBisEingang);
});

test('EPS ist der einzige Weg, der alle vier Anforderungen erfüllt', () => {
  const LAGE = { umsatzNetto: 38786, bestellungen: 60, zielgewinn: 5374, frachtProBestellungNetto: 75.5 };
  const geeignet = ZAHLWEGE.filter((z) => pruefeZahlweg(z.id, LAGE).geeignet).map((z) => z.id);
  assert.deepEqual(geeignet, ['eps']);
});

test('Der Skontosatz bleibt eine Angabe mit Herkunft', () => {
  assert.equal(SKONTO_SATZ, 0.03);
  assert.equal(skontoErsparnis(1000), 30);
  assert.equal(skontoErsparnis(1000, 0.02), 20);
  assert.throws(() => skontoErsparnis(1000, 1.5), /zwischen 0 und 1/);
});

test('Ohne Zahlweg rechnet die Gegenüberstellung nicht heimlich weiter', () => {
  assert.throws(() => skontoGegenGebuehr(BESTELLUNG, 'eps'), /braucht den Zahlweg/);
});
