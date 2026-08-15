import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { berechneBedarf } from '../src/bedarf.js';
import { cent } from '../src/preis.js';
import {
  ZAHLWEGE,
  ANFORDERUNGEN,
  gebuehr,
  wirkungAufBestellung,
  wirkungAufMonat,
  pruefeZahlweg,
  vergleiche,
} from '../src/zahlung.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);

/** Das Referenzgebäude aus phase4: 12 × 10 m, vier Durchführungen, mit Drainage. */
const referenz = berechneWarenkorb(
  berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4, mitDrainage: true }, katalog).warenkorbzeilen,
  katalog,
);

/** Die Planungslage aus PARAMETER.md und phase4. */
const LAGE = { umsatzNetto: 24200, bestellungen: 37, zielgewinn: 5374 };

test('Die Gebühr ist Prozentsatz auf brutto plus Fixbetrag', () => {
  assert.equal(gebuehr(1000, 'karte-stripe'), 14.25);
  assert.equal(gebuehr(1000, 'vorkasse'), 0);
  assert.equal(gebuehr(1000, 'paypal'), 25.25);
});

test('Ein unbekannter Zahlweg und ein Betrag von null werden zurückgewiesen', () => {
  assert.throws(() => gebuehr(1000, 'bitcoin'), /Unbekannter Zahlweg/);
  assert.throws(() => gebuehr(0, 'karte-stripe'), /positiven Bruttobetrag/);
});

test('Die Gebühr trifft den Deckungsbeitrag härter, als der Prozentsatz aussieht', () => {
  const w = wirkungAufBestellung(referenz, 'karte-stripe');

  assert.equal(w.bruttobetrag, 3900.2);
  assert.equal(w.gebuehr, 54.85);
  // 1,4 % auf brutto sind gerechnet auf den Warenwert netto spürbar mehr.
  assert.ok(w.effektivAufWarenwert > 0.014, 'auf den Warenwert netto gerechnet liegt es über dem Listensatz');
  assert.ok(w.anteilAmDeckungsbeitrag > 0.04 && w.anteilAmDeckungsbeitrag < 0.07);
  assert.equal(w.deckungsbeitragNachher, cent(referenz.deckungsbeitragNetto - 54.85));
});

test('Rechnungskauf kostet ein Vielfaches der Karte', () => {
  const karte = wirkungAufBestellung(referenz, 'karte-stripe');
  const rechnung = wirkungAufBestellung(referenz, 'rechnungskauf');
  assert.ok(rechnung.gebuehr > karte.gebuehr * 2);
});

test('Die Monatshochrechnung rechnet auf den Bruttoumsatz', () => {
  const m = wirkungAufMonat(LAGE, 'karte-stripe');
  assert.equal(m.umsatzBrutto, 29040);
  assert.equal(m.gebuehrProMonat, 415.81);
  assert.ok(m.anteilAmZielgewinn > 0.07 && m.anteilAmZielgewinn < 0.08);
});

test('Vorkasse kostet im Modell nichts', () => {
  const m = wirkungAufMonat(LAGE, 'vorkasse');
  assert.equal(m.gebuehrProMonat, 0);
  assert.equal(m.anteilAmZielgewinn, 0);
});

test('Ohne Bestellungen wird nicht hochgerechnet', () => {
  assert.throws(() => wirkungAufMonat({ ...LAGE, bestellungen: 0 }, 'karte-stripe'), /braucht Bestellungen/);
});

test('Nachnahme scheitert an der Registrierkasse und an der Rückmeldung', () => {
  const p = pruefeZahlweg('nachnahme', LAGE);
  assert.equal(p.geeignet, false);
  assert.ok(p.verletzt.some((v) => /Registrierkassenpflicht/.test(v)));
  assert.ok(p.verletzt.some((v) => /maschinell/.test(v)));
});

test('Vorkasse scheitert allein an der fehlenden maschinellen Rückmeldung', () => {
  const p = pruefeZahlweg('vorkasse', LAGE);
  assert.equal(p.geeignet, false);
  assert.deepEqual(p.verletzt, ['Meldet den Zahlungseingang maschinell zurück']);
});

test('Rechnungskauf reißt die Kostenschwelle', () => {
  const p = pruefeZahlweg('rechnungskauf', LAGE);
  assert.equal(p.geeignet, false);
  assert.ok(p.verletzt.some((v) => /10 % des Zielgewinns/.test(v)));
});

test('EPS erfüllt alle drei Anforderungen', () => {
  const p = pruefeZahlweg('eps', LAGE);
  assert.equal(p.geeignet, true);
  assert.deepEqual(p.verletzt, []);
});

test('Jede Anforderung nennt, woher sie kommt', () => {
  for (const a of ANFORDERUNGEN) {
    assert.ok(a.herkunft && a.herkunft.length > 5, `${a.id} ohne Herkunft`);
  }
});

test('Der Vergleich sortiert nach Monatskosten und lässt keinen Zahlweg aus', () => {
  const v = vergleiche(LAGE);
  assert.equal(v.length, ZAHLWEGE.length);
  for (let i = 1; i < v.length; i++) {
    assert.ok(v[i].gebuehrProMonat >= v[i - 1].gebuehrProMonat);
  }
  assert.equal(v[0].zahlweg, 'vorkasse', 'der billigste Weg ist der, den niemand anbietet');
});

test('Jeder Zahlweg trägt Quelle und Konfidenz', () => {
  for (const z of ZAHLWEGE) {
    assert.ok(['hoch', 'mittel', 'niedrig'].includes(z.konfidenz), `${z.id} ohne Konfidenz`);
    assert.ok(z.quelle && z.quelle.length > 5, `${z.id} ohne Quelle`);
  }
});

test('Beim Rechnungskauf ist die Konfidenz ausdrücklich niedrig', () => {
  const r = ZAHLWEGE.find((z) => z.id === 'rechnungskauf');
  assert.equal(r.konfidenz, 'niedrig');
  assert.match(r.quelle, /nicht veröffentlicht/);
});
