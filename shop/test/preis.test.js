import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cent,
  einkaufspreis,
  verkaufspreis,
  rohmarge,
  kalkuliere,
  artikelEinkauf,
  fracht,
  mindestbestellwertErfuellt,
  MARGENUNTERGRENZE,
} from '../src/preis.js';

test('Einkaufspreis ist UVP abzüglich Händlerrabatt', () => {
  assert.equal(einkaufspreis(100, 0.35), 65);
  assert.equal(einkaufspreis(398, 0.42), 230.84);
});

test('Einkaufspreis weist unsinnige Rabatte zurück', () => {
  assert.throws(() => einkaufspreis(100, 1));
  assert.throws(() => einkaufspreis(100, -0.1));
  assert.throws(() => einkaufspreis(0, 0.3));
});

test('Verkaufspreis erreicht die Zielmarge', () => {
  const vk = verkaufspreis(65, 0.35);
  assert.equal(vk, 100);
  assert.ok(Math.abs(rohmarge(65, vk) - 0.35) < 1e-9);
});

test('Verkaufspreis wird nie über die UVP gesetzt', () => {
  // EK 90 bei UVP 100: 40 % Marge wären 150 € — die UVP deckelt.
  assert.equal(verkaufspreis(90, 0.4, 100), 100);
});

test('Gate 1: 30 % Händlerrabatt tragen die Margenuntergrenze nicht', () => {
  const artikel = { sku: 'X', bezeichnung: 'Test', lieferantId: 'l', uvpNetto: 100, ekQuelle: 'platzhalter' };
  const lieferant = { haendlerrabattAufUvp: 0.30 };
  const k = kalkuliere(artikel, lieferant, 0.35);

  // Zielmarge 35 % verlangt VK 100 — genau die UVP. Die Marge bleibt bei 30 %.
  assert.equal(k.vkNetto, 100);
  assert.ok(k.rohmarge < MARGENUNTERGRENZE);
  assert.equal(k.margeErreicht, false);
});

test('Gate 1: 42 % Händlerrabatt tragen die Margenuntergrenze', () => {
  const artikel = { sku: 'Y', bezeichnung: 'Test', lieferantId: 'l', uvpNetto: 398, ekQuelle: 'platzhalter' };
  const lieferant = { haendlerrabattAufUvp: 0.42 };
  const k = kalkuliere(artikel, lieferant, 0.35);

  assert.ok(k.rohmarge >= MARGENUNTERGRENZE);
  assert.equal(k.margeErreicht, true);
  assert.equal(k.deckungsbeitragNetto, cent(k.vkNetto - k.ekNetto));
});

test('Platzhalterpreise werden als solche gekennzeichnet', () => {
  const artikel = { sku: 'Z', bezeichnung: 'T', lieferantId: 'l', uvpNetto: 50, ekQuelle: 'platzhalter' };
  const bestaetigt = { ...artikel, ekQuelle: 'bestaetigt' };
  const lieferant = { haendlerrabattAufUvp: 0.4 };

  assert.equal(kalkuliere(artikel, lieferant, 0.35).ekIstPlatzhalter, true);
  assert.equal(kalkuliere(bestaetigt, lieferant, 0.35).ekIstPlatzhalter, false);
});

test('Brutto enthält 20 % Umsatzsteuer', () => {
  const artikel = { sku: 'U', bezeichnung: 'T', lieferantId: 'l', uvpNetto: 200, ekQuelle: 'platzhalter' };
  const k = kalkuliere(artikel, { haendlerrabattAufUvp: 0.5 }, 0.35);
  assert.equal(k.vkBrutto, cent(k.vkNetto * 1.2));
});

const lieferant = {
  mindestbestellwertNetto: 250,
  fracht: { modell: 'pauschale', freiHausAbNetto: 1500, pauschaleNetto: 75, sperrgutZuschlagNetto: 25 },
};

test('Fracht: Pauschale plus Sperrgutzuschlag je Sperrgutposition', () => {
  const positionen = [
    { vkNetto: 100, ekNetto: 65, menge: 2, sperrgut: true },
    { vkNetto: 50, ekNetto: 32.5, menge: 1, sperrgut: false },
  ];
  const f = fracht(positionen, lieferant);
  assert.equal(f.warenwertNetto, 250);
  assert.equal(f.bestellwertNetto, 162.5);
  assert.equal(f.betragNetto, 100); // 75 + 1 × 25
  assert.match(f.grund, /Sperrgut/);
});

test('Fracht entfällt ab der Frei-Haus-Grenze — gemessen am Bestellwert', () => {
  const f = fracht([{ vkNetto: 1200, ekNetto: 780, menge: 2, sperrgut: true }], lieferant);
  assert.equal(f.warenwertNetto, 2400);
  assert.equal(f.bestellwertNetto, 1560);
  assert.equal(f.betragNetto, 0);
  assert.match(f.grund, /frei Haus/);
});

/*
 * Der Fehler, den diese beiden Testfälle festhalten: Die Schwelle wurde am
 * Verkaufswert gemessen statt am Bestellwert. Der Shop hat dann Frachtfreiheit
 * gewährt, die der Lieferant nicht gewährt, und die Pauschale aus der eigenen
 * Marge bezahlt. Bei 35 % Zielmarge liegen die beiden Werte rund 54 %
 * auseinander — das Fenster ist entsprechend breit.
 */
test('Fracht: Verkaufswert über der Grenze, Bestellwert darunter — Pauschale bleibt', () => {
  const f = fracht([{ vkNetto: 1600, ekNetto: 1040, menge: 1, sperrgut: false }], lieferant);
  assert.equal(f.warenwertNetto, 1600, 'über der Frei-Haus-Grenze von 1500');
  assert.equal(f.bestellwertNetto, 1040, 'aber die Bestellung liegt darunter');
  assert.equal(f.betragNetto, 75, 'also zahlt der Lieferant nicht');
  assert.equal(f.grund, 'Pauschale');
});

test('Fracht ohne Sperrgut ist die reine Pauschale', () => {
  const f = fracht([{ vkNetto: 100, ekNetto: 65, menge: 1, sperrgut: false }], lieferant);
  assert.equal(f.betragNetto, 75);
  assert.equal(f.grund, 'Pauschale');
});

test('Mindestbestellwert wird am Bestellwert gemessen', () => {
  const unter = mindestbestellwertErfuellt(180, lieferant);
  assert.equal(unter.erfuellt, false);
  assert.equal(unter.bestellwertNetto, 180);
  assert.equal(unter.fehlbetragNetto, 70);

  const drueber = mindestbestellwertErfuellt(250, lieferant);
  assert.equal(drueber.erfuellt, true);
  assert.equal(drueber.fehlbetragNetto, 0);
});

// --- Artikelgenaue Konditionen -------------------------------------------
// Der Grund steht in docs/baustoff-shop/katalog-aus-rechnungen.md: Über 46
// Artikel einer einzigen Lieferbeziehung reichen die Rabatte von 10 bis 88 %.

const LIEFERANT_25 = { id: 'test', haendlerrabattAufUvp: 0.25 };

test('Artikelrabatt schlägt den Rabattsatz des Lieferanten', () => {
  const mitEigenem = artikelEinkauf(
    { sku: 'A', uvpNetto: 100, haendlerrabattAufUvp: 0.6 },
    LIEFERANT_25,
  );
  const ohne = artikelEinkauf({ sku: 'B', uvpNetto: 100 }, LIEFERANT_25);
  assert.equal(mitEigenem, 40);
  assert.equal(ohne, 75);
});

test('Ein bestätigter Nettopreis schlägt jeden Rabattsatz', () => {
  const ek = artikelEinkauf(
    { sku: 'A', uvpNetto: 100, haendlerrabattAufUvp: 0.6, ekNetto: 12 },
    LIEFERANT_25,
  );
  assert.equal(ek, 12);
});

test('Ohne Einkaufspreis und ohne Rabattsatz wird abgewiesen, nicht geraten', () => {
  assert.throws(
    () => artikelEinkauf({ sku: 'A', uvpNetto: 100 }, { id: 'test' }),
    /weder Einkaufspreis noch Rabattsatz/,
  );
  assert.throws(() => artikelEinkauf({ sku: 'A', ekNetto: 0 }, LIEFERANT_25), /positiv/);
});

test('Dünner Rabatt: der Listendeckel greift und die Zielmarge fällt aus', () => {
  // 10 % Rabatt — der reale Fall der Rahmenschraube. 25 % Marge daraus wäre
  // ein Verkaufspreis über der Liste des Lieferanten.
  const k = kalkuliere(
    { sku: 'KLEIN', bezeichnung: 'Kleinteil', uvpNetto: 100, haendlerrabattAufUvp: 0.1, ekQuelle: 'bestaetigt' },
    LIEFERANT_25,
    0.25,
  );
  assert.equal(k.ekNetto, 90);
  assert.equal(k.vkNetto, 100, 'nie über die Liste');
  assert.equal(k.amListendeckel, true);
  assert.equal(k.zielmargeErreicht, false);
  assert.ok(Math.abs(k.rohmarge - 0.1) < 1e-9);
});

test('Genau am Deckel gilt die Zielmarge noch als erreicht', () => {
  // EK = Liste × (1 − Zielmarge): der Verkaufspreis trifft die Liste exakt.
  // Diese Kante trennt `>=` von `>` — ohne sie bliebe die Vertauschung
  // unbemerkt, wie schon bei Gate 20 und der 300-Bq/m³-Grenze.
  const k = kalkuliere(
    { sku: 'KANTE', bezeichnung: 'Genau', uvpNetto: 100, haendlerrabattAufUvp: 0.25, ekQuelle: 'bestaetigt' },
    LIEFERANT_25,
    0.25,
  );
  assert.equal(k.vkNetto, 100);
  assert.equal(k.amListendeckel, true);
  assert.equal(k.zielmargeErreicht, true, 'genau getroffen ist erreicht');
});

test('Ohne Liste gibt es nichts zu deckeln — die Zielmarge trägt voll', () => {
  const k = kalkuliere(
    { sku: 'NETTO', bezeichnung: 'Projektpreis', ekNetto: 12, ekQuelle: 'bestaetigt' },
    LIEFERANT_25,
    0.25,
  );
  assert.equal(k.uvpNetto, null);
  assert.equal(k.vkNetto, 16);
  assert.equal(k.amListendeckel, false);
  assert.equal(k.zielmargeErreicht, true);
});

test('Tiefer Rabatt: die Zielmarge trägt mit Abstand unter der Liste', () => {
  // 60 % Rabatt — der reale Fall der XPS-Platten.
  const k = kalkuliere(
    { sku: 'XPS', bezeichnung: 'Dämmplatte', uvpNetto: 100, haendlerrabattAufUvp: 0.6, ekQuelle: 'bestaetigt' },
    LIEFERANT_25,
    0.25,
  );
  assert.equal(k.ekNetto, 40);
  assert.ok(Math.abs(k.vkNetto - 53.33) < 0.01);
  assert.equal(k.amListendeckel, false);
  assert.equal(k.zielmargeErreicht, true);
});

test('Die Cent-Rundung allein lässt die Zielmarge nicht durchfallen', () => {
  // 40 € Einkauf, 25 % Ziel → 53,333… €, gerundet 53,33 €. Daraus rechnet
  // sich eine Marge von 24,995 % — knapp unter dem Ziel. Gemessen wird
  // deshalb gegen den ungedeckelten Wunschpreis, nicht gegen die Marge.
  const k = kalkuliere(
    { sku: 'RUND', bezeichnung: 'Rundungsfall', ekNetto: 40, ekQuelle: 'bestaetigt' },
    LIEFERANT_25,
    0.25,
  );
  assert.equal(k.vkNetto, 53.33);
  assert.ok(k.rohmarge < 0.25, 'die gerundete Marge liegt tatsächlich darunter');
  assert.equal(k.zielmargeErreicht, true, 'trotzdem hat nichts sie beschnitten');
});

test('Ein zu niedriger Listendeckel lässt die Zielmarge durchfallen', () => {
  // Gegenprobe zum Rundungsfall: Hier beschneidet der Deckel wirklich.
  const k = kalkuliere(
    { sku: 'DECKEL', bezeichnung: 'Gedeckelt', uvpNetto: 45, ekNetto: 40, ekQuelle: 'bestaetigt' },
    LIEFERANT_25,
    0.25,
  );
  assert.equal(k.vkNetto, 45);
  assert.equal(k.zielmargeErreicht, false);
});
