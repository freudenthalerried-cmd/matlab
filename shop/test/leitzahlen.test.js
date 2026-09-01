import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LEITZAHLEN, LEITDOKUMENTE, schreibweisen, fundstellen, inSpanne, pruefeLeitzahlen,
} from '../src/leitzahlen.js';

const ziel = JSON.parse(readFileSync(new URL('../data/zielgroessen.json', import.meta.url), 'utf8'));

test('Jede Leitzahl rechnet ihren gültigen Wert, statt ihn einzutragen', () => {
  for (const lz of LEITZAHLEN) {
    assert.equal(typeof lz.jetzt, 'function', lz.id);
    const wert = lz.jetzt(ziel);
    assert.ok(Number.isFinite(wert) && wert > 0, `${lz.id}: ${wert}`);
    assert.ok(lz.traegt && lz.traegt.length > 30, `${lz.id}: wofür sie steht, fehlt`);
  }
});

test('Jeder abgelöste Wert nennt Grund und eigene Bedingung', () => {
  for (const lz of LEITZAHLEN) {
    for (const a of lz.abgeloest) {
      assert.ok(a.weil && a.weil.length > 10, `${lz.id}/${a.wert}: der Grund fehlt`);
      assert.ok(a.bedingung instanceof RegExp, `${lz.id}/${a.wert}: die Bedingung fehlt`);
      assert.notEqual(a.wert, lz.jetzt(ziel), `${lz.id}: ${a.wert} ist der gültige Wert`);
    }
  }
});

test('Die Bedingungen sind eng — eine, die überall gilt, ist keine', () => {
  // Der erste Anlauf hatte eine gemeinsame, weite Fassung und deckte 102 von
  // 103 Fundstellen. Diese Probe hält fest, dass keine Bedingung auf einen
  // gewöhnlichen Satz der Akte anspricht.
  const harmlos = 'Der Shop führt 46 Artikel und liefert in fünf Bezirke. Stand August, alte Fassung, damals.';
  for (const lz of LEITZAHLEN) {
    for (const a of lz.abgeloest) {
      assert.ok(!a.bedingung.test(harmlos), `${lz.id}/${a.wert}: die Bedingung trifft einen harmlosen Satz`);
    }
  }
});

test('Deutsche Schreibweisen werden gefunden', () => {
  const f = schreibweisen(45356);
  assert.ok(f.includes('45356'));
  assert.ok(f.some((x) => x === '45.356'));
});

test('Eine Zahl in einer Spanne ist keine Angabe', () => {
  // Die einzige Meldung des ersten Laufs, und sie war falsch.
  assert.equal(inSpanne('zwischen 60 und 70 Bestellungen', '70'), true);
  assert.equal(inSpanne('60 bis 70 Bestellungen', '70'), true);
  assert.equal(inSpanne('70 Bestellungen im Monat', '70'), false);
});

test('Die Zahl wird nicht in einer längeren zerschnitten', () => {
  assert.equal(fundstellen('Warenwert 145.356,20 €', 45356, { bedingung: /karte/i }).length, 0);
  assert.equal(fundstellen('Umsatz 45.356 €', 45356, { bedingung: /karte/i }).length, 1);
});

test('Eine abgelöste Zahl mit ihrer Bedingung in Sichtweite ist gedeckt', () => {
  const mit = 'Bei Kartenzahlung:\n\nnötiger Monatsumsatz 45.356 €';
  const ohne = 'nötiger Monatsumsatz 45.356 €';
  assert.equal(fundstellen(mit, 45356, { bedingung: /karte/i })[0].gedeckt, true);
  assert.equal(fundstellen(ohne, 45356, { bedingung: /karte/i })[0].gedeckt, false);
});

test('Die blanke abgelöste Zahl wird gemeldet', () => {
  const b = pruefeLeitzahlen('Der nötige Monatsumsatz liegt bei 45.356 €.', 'probe.md', ziel);
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.some((m) => m.leitzahl === 'noetiger-monatsumsatz'));
});

test('Ein führendes Dokument, das die Leitzahl gar nicht nennt, fällt auf', () => {
  const b = pruefeLeitzahlen('Nichts von Belang.', LEITDOKUMENTE[0], ziel);
  assert.equal(b.meldungen.length, LEITZAHLEN.length);
  assert.ok(b.meldungen.every((m) => m.text.includes('führt nichts')));
});

test('Im führenden Dokument darf die abgelöste Zahl nicht vor der gültigen stehen', () => {
  // Zwei Gegenproben liefen ins Leere, bevor diese Regel da war: Die
  // Bedingung in Sichtweite deckte auch die wieder eingesetzte alte Zahl.
  const gueltig = LEITZAHLEN.map((lz) => lz.jetzt(ziel));
  const vorne = `Umsatz 45.356 € bei Karte.\n\n${gueltig.join(' und ')} und 67 Bestellungen.`;
  const b = pruefeLeitzahlen(vorne, LEITDOKUMENTE[0], ziel);
  assert.ok(b.meldungen.some((m) => m.text.includes('liest die erste Zahl')));
});

test('Ein gewöhnliches Dokument kennt die Reihenfolgeregel nicht', () => {
  const text = 'Umsatz 45.356 € bei Karte.\n\nHeute 43.396 €.';
  const b = pruefeLeitzahlen(text, 'irgendwo.md', ziel);
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));
});
