import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHRITTE,
  WELT_HEUTE,
  WELT_AUSGEBAUT,
  trockenlauf,
  engpaesse,
  aufwandProMonat,
} from '../src/auftragslauf.js';

test('Im Vollausbau läuft die Kette ohne einen einzigen Handgriff durch', () => {
  const lauf = trockenlauf(WELT_AUSGEBAUT);
  assert.equal(lauf.laeuftDurch, true);
  assert.equal(lauf.minutenMensch, 0);
  assert.deepEqual(lauf.blockaden, []);
  assert.ok(lauf.protokoll.every((p) => p.stand === 'automatisch'));
});

test('Heute bricht die Kette ab, und zwar an der Zahlung', () => {
  const lauf = trockenlauf(WELT_HEUTE);
  assert.equal(lauf.laeuftDurch, false);
  assert.equal(lauf.abbruchBei, 'zahlung');
  assert.ok(lauf.blockaden.includes('zahlung'));
  assert.ok(lauf.blockaden.includes('rechnung'));
});

test('Der Trockenlauf löst nichts aus — er meldet nur', () => {
  const vorher = JSON.stringify(WELT_HEUTE);
  trockenlauf(WELT_HEUTE);
  assert.equal(JSON.stringify(WELT_HEUTE), vorher, 'die Welt darf sich nicht verändern');
});

test('Jeder Schritt trägt jede Voraussetzung, die es in der Welt gibt', () => {
  const bekannt = Object.keys(WELT_AUSGEBAUT);
  assert.ok(SCHRITTE.length >= 10, 'die Kette hat zehn Schritte');
  // pruefung: begruendet — `s.braucht` darf leer sein.
  // Eingang, Datenprüfung und Lieferung brauchen
  // nichts aus der Welt. Deshalb steht hier keine Längenzusicherung je Schritt,
  // sondern eine über alle: Irgendein Schritt muss Voraussetzungen haben.
  assert.ok(SCHRITTE.some((s) => s.braucht.length > 0), 'kein Schritt verlangt irgendetwas');
  for (const s of SCHRITTE) {
    for (const v of s.braucht) {
      assert.ok(bekannt.includes(v), `${s.id} verlangt unbekannte Fähigkeit ${v}`);
    }
  }
});

test('Jede Fähigkeit wird von mindestens einem Schritt gebraucht', () => {
  const gebraucht = new Set(SCHRITTE.flatMap((s) => s.braucht));
  assert.equal(Object.keys(WELT_AUSGEBAUT).length, 6, 'sechs Fähigkeiten stehen in der Welt');
  for (const v of Object.keys(WELT_AUSGEBAUT)) {
    assert.ok(gebraucht.has(v), `${v} steht in der Welt, wird aber von keinem Schritt verlangt`);
  }
});

test('Blockaden wiegen schwerer als Handarbeit', () => {
  const rang = engpaesse();
  const ersteMitBlockade = rang.findIndex((e) => e.blockiert.length > 0);
  const ersteOhne = rang.findIndex((e) => e.blockiert.length === 0);
  assert.ok(ersteMitBlockade < ersteOhne, 'blockierende Engpässe müssen oben stehen');
});

test('Der Zahlungsanbieter blockiert, die Produktdaten kosten Zeit', () => {
  const rang = engpaesse();
  const zahlung = rang.find((e) => e.faehigkeit === 'zahlungsanbieter');
  const daten = rang.find((e) => e.faehigkeit === 'produktdatenSchnittstelle');

  assert.deepEqual(zahlung.blockiert, ['zahlung']);
  assert.equal(zahlung.zusatzminuten, 0, 'eine Blockade kostet keine Minuten — sie kostet den Auftrag');

  assert.deepEqual(daten.blockiert, []);
  assert.equal(daten.zusatzminuten, 9, 'Bestellauslösung, Auftragsbestätigung, Termin');
});

test('Die Firmendaten blockieren die Rechnung, sonst nichts', () => {
  const b = engpaesse().find((e) => e.faehigkeit === 'betreiberdaten');
  assert.deepEqual(b.blockiert, ['rechnung']);
  assert.deepEqual(b.betroffeneSchritte, ['rechnung']);
});

test('Der Monatsaufwand je Bestellung rechnet sich nachvollziehbar hoch', () => {
  // Nur die Produktdaten fehlen: 4 + 3 + 2 Minuten je Bestellung.
  const welt = { ...WELT_AUSGEBAUT, produktdatenSchnittstelle: false };
  const a = aufwandProMonat(welt, 37);
  assert.equal(a.minutenJeBestellung, 9);
  assert.equal(a.stundenProMonat, 5.6);
  assert.deepEqual(a.blockaden, []);
});

test('Bei null Bestellungen fällt kein Aufwand an', () => {
  const a = aufwandProMonat(WELT_HEUTE, 0);
  assert.equal(a.stundenProMonat, 0);
});

test('Die Lieferung ist der einzige Schritt, der immer von selbst läuft', () => {
  const nichts = Object.fromEntries(Object.keys(WELT_AUSGEBAUT).map((k) => [k, false]));
  const lauf = trockenlauf(nichts);
  const lieferung = lauf.protokoll.find((p) => p.id === 'lieferung');
  assert.equal(lieferung.stand, 'automatisch');
});

test('Jeder nicht automatische Schritt nennt einen Grund', () => {
  const lauf = trockenlauf(WELT_HEUTE);
  assert.equal(lauf.protokoll.length, SCHRITTE.length, 'jeder Schritt steht im Protokoll');
  assert.ok(lauf.protokoll.some((p) => p.stand !== 'automatisch'), 'sonst prüft die Schleife nichts');
  for (const p of lauf.protokoll) {
    if (p.stand === 'automatisch') continue;
    assert.ok(p.grund && p.grund.length > 10, `${p.id} ohne Begründung`);
    assert.ok(p.fehlend.length > 0, `${p.id} ohne benannte fehlende Fähigkeit`);
  }
});
