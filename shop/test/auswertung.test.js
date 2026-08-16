import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GATE2_BEDINGUNGEN,
  BOGEN,
  margenspielraum,
  werteAntwortAus,
  werteRundeAus,
  pruefeBogen,
} from '../src/auswertung.js';

const LAGE = {
  zielgewinn: 5374,
  fixkosten: 650,
  werbeanteil: 0.10,
  warenkorbNetto: 650,
  umsatzProSession: 0.02,
  zahlweg: 'karte-stripe',
};

const guteAntwort = {
  hersteller: 'Muster Bahnen GmbH',
  sortiment: 'Bahnen',
  streckengeschaeft: true,
  haendlerrabatt: 0.38,
  frachtmodell: 'pauschale',
  produktdaten: 'csv',
  preisrhythmus: 'jährlich zum 1. März',
  fakturierendesLand: 'DE',
};

test('Gate 2 hat genau vier Bedingungen', () => {
  assert.equal(GATE2_BEDINGUNGEN.length, 4);
  assert.ok(GATE2_BEDINGUNGEN.some((b) => b.id === 'streckengeschaeft'));
  assert.ok(GATE2_BEDINGUNGEN.some((b) => b.id === 'produktdaten'));
});

test('Eine vollständige Zusage besteht', () => {
  const e = werteAntwortAus(guteAntwort);
  assert.equal(e.bestanden, true);
  assert.equal(e.erfuellt, 4);
  assert.deepEqual(e.fehlend, []);
});

test('Drei von vier ist nicht bestanden', () => {
  const e = werteAntwortAus({ ...guteAntwort, frachtmodell: 'nachAufwand' });
  assert.equal(e.bestanden, false);
  assert.equal(e.erfuellt, 3);
  assert.ok(e.fehlend.some((f) => /Frachtregelung/.test(f)));
});

test('Was der Hersteller nicht sagt, gilt als nicht zugesagt', () => {
  const e = werteAntwortAus({ hersteller: 'Schweigsam AG' });
  assert.equal(e.bestanden, false);
  assert.equal(e.erfuellt, 0);
  assert.equal(e.beziffert, false);
  assert.equal(e.spielraum, null);
});

test('Eine Preisliste ohne angekündigten Rhythmus reicht nicht', () => {
  const e = werteAntwortAus({ ...guteAntwort, preisrhythmus: '' });
  assert.equal(e.bestanden, false);
  assert.ok(e.fehlend.some((f) => /Produktdaten/.test(f)));
});

test('Ein Katalog ohne Datei ist keine maschinenlesbare Preisliste', () => {
  const e = werteAntwortAus({ ...guteAntwort, produktdaten: 'katalog' });
  assert.equal(e.bestanden, false);
});

test('Genau an der Untergrenze bleibt kein Preisspielraum', () => {
  const s = margenspielraum(0.32);
  assert.equal(s.reichtOhneNachlass, true);
  assert.equal(s.maxNachlass, 0);
  assert.match(s.hinweis, /Kein Preisspielraum/);
});

test('Erst über der Untergrenze entsteht Luft für Nachlässe', () => {
  const s = margenspielraum(0.38);
  assert.ok(s.maxNachlass > 0.08 && s.maxNachlass < 0.10, `${s.maxNachlass}`);
  assert.match(s.hinweis, /Nachlass auf die UVP/);
});

test('Unter der Untergrenze reicht der Rabatt nicht', () => {
  const s = margenspielraum(0.30);
  assert.equal(s.reichtOhneNachlass, false);
  assert.equal(s.maxNachlass, 0);
});

test('Nicht der Sitz entscheidet, sondern wer fakturiert', () => {
  assert.equal(werteAntwortAus({ ...guteAntwort, fakturierendesLand: 'AT' }).reihengeschaeft, false);
  assert.equal(werteAntwortAus({ ...guteAntwort, fakturierendesLand: 'DE' }).reihengeschaeft, true);
  assert.equal(werteAntwortAus({ hersteller: 'X' }).reihengeschaeft, null, 'ohne Angabe wird nichts unterstellt');
});

test('Ein einzelner bestandener Hersteller reicht nicht', () => {
  const r = werteRundeAus([guteAntwort, { hersteller: 'Absage GmbH', streckengeschaeft: false }], LAGE);
  assert.equal(r.bestanden, 1);
  assert.equal(r.pruefungA, false);
  assert.match(r.grund, /ein einzelner Lieferant ist kein Sortiment/);
});

test('Zwei vollständige Zusagen lassen Prüfung A bestehen', () => {
  const zweiter = { ...guteAntwort, hersteller: 'Muster Rohr GmbH', sortiment: 'Rohr', haendlerrabatt: 0.34 };
  const r = werteRundeAus([guteAntwort, zweiter], LAGE);

  assert.equal(r.pruefungA, true);
  assert.equal(r.bestanden, 2);
  assert.equal(r.tragendeMarge, 0.34, 'der schwächere der beiden begrenzt die Mischmarge');
});

test('Aus der tragenden Marge folgt unmittelbar der Besucherbedarf', () => {
  const zweiter = { ...guteAntwort, hersteller: 'Muster Rohr GmbH', haendlerrabatt: 0.34 };
  const r = werteRundeAus([guteAntwort, zweiter], LAGE);

  assert.equal(r.folgen.tragfaehig, true);
  assert.ok(r.folgen.sessions > 2000, `Sessions: ${r.folgen.sessions}`);
  assert.equal(r.folgen.bestellungen, Math.ceil(r.folgen.umsatzNetto / 650));
});

test('Ohne Lage wird keine Planungsfolge erfunden', () => {
  const zweiter = { ...guteAntwort, hersteller: 'Zwei' };
  const r = werteRundeAus([guteAntwort, zweiter], null);
  assert.equal(r.pruefungA, true);
  assert.equal(r.folgen, null);
});

test('Ohne Absagen gezählt wird nichts beschönigt', () => {
  const r = werteRundeAus([{ hersteller: 'A' }, { hersteller: 'B' }, { hersteller: 'C' }], LAGE);
  assert.equal(r.antworten, 3);
  assert.equal(r.beziffert, 0);
  assert.equal(r.pruefungA, false);
  assert.match(r.grund, /Kein Hersteller/);
});

test('Der Bogen nennt jedes Pflichtfeld, das fehlt', () => {
  const p = pruefeBogen({ hersteller: 'Nur der Name' });
  assert.equal(p.vollstaendig, false);
  assert.ok(p.fehlend.some((f) => /Händlerrabatt/.test(f)));
  assert.ok(p.fehlend.some((f) => /fakturiert/.test(f)));

  assert.equal(pruefeBogen(guteAntwort).vollstaendig, true);
});

test('Jedes Bogenfeld trägt eine Frage', () => {
  for (const f of BOGEN) {
    assert.ok(f.frage.length > 5, `${f.feld} ohne Frage`);
  }
});

test('Eine Antwort ohne Hersteller wird zurückgewiesen', () => {
  assert.throws(() => werteAntwortAus({ haendlerrabatt: 0.4 }), /braucht einen Hersteller/);
});
