import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { preisalterTage, preisalterBefund, GRENZE_TAGE, GRENZE_HERKUNFT } from '../src/preisalter.js';
import { WARENKOERBE } from '../bin/kampagne.mjs';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

// Ein festes Vergleichsdatum. `new Date()` in einer Probe wäre eine
// Zeitbombe mit unbekanntem Zünddatum: Sie liefe heute grün und irgendwann
// rot, ohne dass sich eine Zeile Code geändert hätte.
const HEUTE = '2026-09-01';

test('preisalterTage rechnet in Kalendertagen', () => {
  assert.equal(preisalterTage('2026-09-01', HEUTE), 0);
  assert.equal(preisalterTage('2026-08-17', HEUTE), 15);
  assert.equal(preisalterTage('2026-04-22', HEUTE), 132);

  // Über eine Sommerzeitgrenze hinweg — gerechnet wird in UTC, damit die
  // Umstellung ein Alter nicht um eine Stunde über eine Tagesgrenze schiebt.
  assert.equal(preisalterTage('2026-03-28', '2026-03-30'), 2);
  assert.equal(preisalterTage('2026-10-24', '2026-10-26'), 2);

  // Ein Datum in der Zukunft ergibt eine negative Zahl und keinen Fehler —
  // die Bewertung macht `preisalterBefund`, nicht die Rechnung.
  assert.equal(preisalterTage('2026-09-08', HEUTE), -7);

  // Was kein Datum ist, ist kein Alter — und keine Null.
  for (const nichts of [null, undefined, '', '  ', 'Juni 2026', '2026-6-9', '26-06-09']) {
    assert.equal(preisalterTage(nichts, HEUTE), null, `„${nichts}" ergibt kein null`);
  }
});

test('Eskaliert wird nur, wo ein Gebot auf dem Preis ruht', () => {
  const artikel = [
    { sku: 'A', gruppe: 'Kamin', bezeichnung: 'Im Korb, zu alt', preisStand: '2026-01-01' },
    { sku: 'B', gruppe: 'Kamin', bezeichnung: 'Nicht im Korb, zu alt', preisStand: '2026-01-01' },
    { sku: 'C', gruppe: 'Kamin', bezeichnung: 'Im Korb, frisch', preisStand: '2026-08-20' },
    { sku: 'D', gruppe: 'Zubehör', bezeichnung: 'Ohne Preisstand', preisStand: null },
    { sku: 'E', gruppe: 'Zubehör', bezeichnung: 'Aus der Zukunft', preisStand: '2026-12-24' },
  ];
  const e = preisalterBefund({ artikel, heute: HEUTE, beworbeneSkus: ['A', 'C'] });

  assert.equal(e.geprueft, 5);
  assert.deepEqual(e.fehler.map((f) => f.sku).sort(), ['A', 'D', 'E']);
  assert.deepEqual(e.verdacht.map((v) => v.sku), ['B']);
  assert.equal(e.sauber, false);

  // Der Unterschied zwischen A und B ist **nur** das Gebot — gleiche Gruppe,
  // gleiches Datum. Genau darauf kam es bei der Verschärfung an.
  assert.match(e.fehler.find((f) => f.sku === 'A').grund, /ruht ein Gebot/);
  assert.doesNotMatch(e.verdacht[0].grund, /Gebot/);

  // Und die Kennzahlen zählen nur, was ein Alter hat.
  assert.equal(e.juengste, 12);
  assert.equal(e.aelteste, 243);
});

test('Ohne beworbene Artikel wirft der Befund, statt die Verschärfung zu überspringen', () => {
  assert.throws(
    () => preisalterBefund({ artikel: [], heute: HEUTE }),
    /beworbenen Artikelnummern/,
  );
  // Die leere Menge ist dagegen eine Antwort: keine Anzeigen, keine Gebote.
  const e = preisalterBefund({
    artikel: [{ sku: 'A', gruppe: 'Kamin', bezeichnung: 'alt', preisStand: '2026-01-01' }],
    heute: HEUTE,
    beworbeneSkus: [],
  });
  assert.equal(e.sauber, true);
  assert.equal(e.verdacht.length, 1);
});

test('Die Grenze nennt ihre Herkunft und ist als Setzung gekennzeichnet', () => {
  assert.equal(GRENZE_HERKUNFT.wert, GRENZE_TAGE);
  assert.equal(GRENZE_HERKUNFT.art, 'gesetzt');
  assert.match(GRENZE_HERKUNFT.grund, /preisrhythmus/i);
});

/**
 * Der Bestand am 01.09.: kein Artikel ohne Preisstand, keiner aus der
 * Zukunft. Gemessen wird die **Regel** — der Befund muss über den echten
 * Katalog laufen und darf keinen unbewertbaren Artikel finden.
 */
test('Jeder Artikel des Katalogs trägt einen brauchbaren Preisstand', () => {
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  assert.ok(katalog.artikel.length > 0, 'leerer Katalog — die Schleife darunter prüft nichts');

  const ohne = katalog.artikel.filter((a) => preisalterTage(a.preisStand, HEUTE) === null);
  assert.deepEqual(ohne.map((a) => a.sku), [],
    'diese Artikel haben keinen brauchbaren Preisstand — unprüfbar zählt nicht als frisch');
});

/**
 * Die Positionen der Referenzwarenkörbe müssen es im Katalog geben. Ein Korb,
 * der auf eine gestrichene Artikelnummer zeigt, rechnet ein Höchstgebot aus
 * weniger Positionen als angeschrieben — und meldet es als vollständig.
 */
test('Jede Position der Referenzwarenkörbe steht im Katalog', () => {
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  const bekannt = new Set(katalog.artikel.map((a) => a.sku));
  const gruppen = Object.keys(WARENKOERBE);
  assert.ok(gruppen.length > 0, 'keine Warenkörbe — die Schleife darunter prüft nichts');

  const fehlend = [];
  for (const g of gruppen) {
    assert.ok(WARENKOERBE[g].positionen.length > 0, `${g} hat einen leeren Referenzwarenkorb`);
    for (const p of WARENKOERBE[g].positionen) {
      if (!bekannt.has(p.sku)) fehlend.push(`${g}/${p.sku}`);
    }
  }
  assert.deepEqual(fehlend, [], 'diese Korbpositionen gibt es im Katalog nicht');
});
