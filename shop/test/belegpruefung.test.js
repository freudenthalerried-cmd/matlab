import test from 'node:test';
import assert from 'node:assert/strict';
import { pruefeBeleg, pruefeBelege, leereAngaben, SUMMENZEILE, ZUSTANDSAUSSAGE , pruefeVerrechnetUndBestellt, VERRECHNET_UND_BESTELLT } from '../src/belegpruefung.js';

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


/* ------------------------------------------------------------------ *
 * Was verrechnet wird, muss bestellt sein
 *
 * Befund vom 2. September: Der Warenkorb rechnete je palettierter Position
 * 7,50 € Kranentladung und wies sie dem Kunden aus; die Bestellung an den
 * Lieferanten sagte davon nichts. Jeder Beleg für sich war in Ordnung — der
 * Fehler lag zwischen ihnen.
 * ------------------------------------------------------------------ */

const kunde = (n) => ({ art: 'Angebot', text: `Fracht: 90,50 € (Pauschale plus ${n}× Kranentladung)` });
const lieferant = (n) => ({
  art: 'Lieferantenbestellung',
  text: `Bitte mit Kranentladung zustellen — ${n} palettierte Positionen.`,
});

test('verrechnet und bestellt: gleiche Zahl, keine Meldung', () => {
  assert.deepEqual(pruefeVerrechnetUndBestellt([kunde(2), lieferant(2)]), []);
});

test('verrechnet, aber nicht bestellt', () => {
  const m = pruefeVerrechnetUndBestellt([
    kunde(2),
    { art: 'Lieferantenbestellung', text: 'Bitte neutral verpackt liefern.' },
  ]);
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verrechnet-nicht-bestellt');
  assert.match(m[0].text, /2×/);
});

test('verrechnet und anders bestellt', () => {
  const m = pruefeVerrechnetUndBestellt([kunde(2), lieferant(1)]);
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verrechnet-anders-bestellt');
});

test('nichts verrechnet, nichts gemeldet', () => {
  assert.deepEqual(pruefeVerrechnetUndBestellt([
    { art: 'Angebot', text: 'Fracht: 75,50 € (Pauschale)' },
    { art: 'Lieferantenbestellung', text: 'Bitte neutral verpackt liefern.' },
  ]), []);
});

test('fehlt der Zielbeleg, wird das gesagt statt verschwiegen', () => {
  // Ein halber Lauf soll nicht aussehen wie ein ganzer.
  const m = pruefeVerrechnetUndBestellt([kunde(2)]);
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verrechnet-ohne-beleg');
});

test('jeder Eintrag des Registers nennt seinen Grund', () => {
  assert.ok(VERRECHNET_UND_BESTELLT.length >= 1, 'das Register ist leer');
  for (const e of VERRECHNET_UND_BESTELLT) {
    assert.ok(e.warum && e.warum.length >= 40, `${e.id}: ohne belastbaren Grund`);
    assert.ok(e.verrechnet instanceof RegExp && e.bestellt instanceof RegExp, e.id);
  }
});
