import test from 'node:test';
import assert from 'node:assert/strict';
import { pruefeBeleg, pruefeBelege, leereAngaben, SUMMENZEILE, ZUSTANDSAUSSAGE } from '../src/belegpruefung.js';

const mitSumme = (rest) => `Rechnung RE-0001\n\nGesamtbetrag            1638,48 €\n\n${rest}`;

test('Eine Endsumme ohne Zustandsaussage wird gemeldet', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: mitSumme('Leistungsort Österreich, Steuersatz 20 %.') });
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'betrag-ohne-zustand');
});

test('Der Zahlungsvermerk deckt die Endsumme', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: mitSumme('Bereits bezahlt am 30.08.2026 über EPS.') });
  assert.equal(b.sauber, true);
});

test('Auch die offene Rechnung wäre eine Zustandsaussage', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: mitSumme('Zahlbar innerhalb von 30 Tagen ohne Abzug.') });
  assert.equal(b.sauber, true);
});

test('Ohne Endsumme greift die Regel nicht — ein Lieferschein ist keine Rechnung', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: 'Rechnung RE-0001\n\nSumme netto  1365,40 €\n' });
  assert.equal(b.sauber, true);
});

test('Eine unbekannte Belegart läuft nicht stillschweigend durch', () => {
  const b = pruefeBeleg({ art: 'Gutschrift', text: mitSumme('Bereits bezahlt.') });
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'belegart-unbekannt');
});

test('Ein widerrufener Satz auf dem Beleg wird gemeldet, auch mit Widerruf daneben', () => {
  // Auf der Seite rettet der danebenstehende Widerruf die Aussage. Auf einem
  // Beleg nicht: Sichtweite 0. Genau das trennt diesen Prüfer vom Register.
  const text = mitSumme(
    'Bereits bezahlt am 30.08.2026.\n'
    + 'Die Frachtpauschale steht auf jeder Rechnung.\n'
    + 'Berichtigt: das gilt nicht mehr.',
  );
  const b = pruefeBeleg({ art: 'Rechnung', text });
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.some((m) => m.regel === 'widerrufene-aussage'));
});

test('Jede Belegart nennt mindestens ein Muster', () => {
  for (const [art, muster] of Object.entries(ZUSTANDSAUSSAGE)) {
    assert.ok(muster instanceof RegExp, art);
  }
  assert.ok(SUMMENZEILE.test('Gesamtbetrag            1638,48 €'));
  assert.ok(!SUMMENZEILE.test('Warenwert netto         1240,40 €'));
});

test('Ein leerer Durchlauf ist kein grüner', () => {
  assert.throws(() => pruefeBelege([]), /leerer Durchlauf/);
  assert.throws(() => pruefeBelege(null), /leerer Durchlauf/);
});

test('Die Gesamtzahl der Meldungen stimmt mit den einzelnen überein', () => {
  const b = pruefeBelege([
    { art: 'Rechnung', text: mitSumme('Leistungsort Österreich.') },
    { art: 'Angebot', text: mitSumme('Zahlungsbedingung: Zahlung bei Bestellung.') },
  ]);
  assert.equal(b.geprueft, 2);
  assert.equal(b.meldungen, 1);
  assert.equal(b.sauber, false);
});

// ---------------------------------------------------------------------------
// Die leere Angabe — Befund vom 1. September, zweiter Teil
// ---------------------------------------------------------------------------

test('Eine Beschriftung ohne Wert wird gemeldet', () => {
  const t = 'Lieferadresse:\n  Bau Muster GmbH\n  Ansprechpartner vor Ort: \n\nMit freundlichen Grüßen';
  const l = leereAngaben(t);
  assert.equal(l.length, 1);
  assert.equal(l[0].beschriftung, 'Ansprechpartner vor Ort');
  assert.equal(l[0].zeile, 3);
});

test('Eine Blocküberschrift ist keine leere Angabe', () => {
  assert.deepEqual(leereAngaben('Lieferadresse (Baustelle):\n  Bau Muster GmbH\n  4600 Wels'), []);
});

test('Leerzeilen zwischen Beschriftung und Aufzählung zählen nicht als Ende', () => {
  // Der Fehlalarm des ersten Laufs: ein Satz, dessen Liste erst nach einer
  // Leerzeile beginnt.
  assert.deepEqual(leereAngaben('… an den unten\ngenannten Endkunden:\n\n    5 × DR-100-050 Rohr'), []);
});

test('Eine Beschriftung am Textende hat keinen Wert mehr', () => {
  assert.equal(leereAngaben('Summe: 12 €\nAnsprechpartner:').length, 1);
});

test('Die Belegprüfung meldet die leere Angabe als eigene Regel', () => {
  const b = pruefeBeleg({ art: 'Lieferantenbestellung', text: 'Gewünschte Lieferzeit: 5 Werktage.\nTelefon: ' });
  assert.ok(b.meldungen.some((m) => m.regel === 'leere-angabe'));
});
