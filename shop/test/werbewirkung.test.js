import test from 'node:test';
import assert from 'node:assert/strict';
import { abbruchschwelle, pKeinVerkauf, nochPlausibleQuote, versuchsplan, TAGE_JE_MONAT, SICHERHEIT }
  from '../src/werbewirkung.js';

const nah = (ist, soll, toleranz = 1e-9) =>
  assert.ok(Math.abs(ist - soll) <= toleranz, `${ist} statt ${soll} (± ${toleranz})`);

test('Die Abbruchschwelle stimmt mit der Wahrscheinlichkeit überein, aus der sie kommt', () => {
  // Kein Nachrechnen der Formel mit derselben Formel: Geprüft wird, dass die
  // Schwelle genau dort liegt, wo P(kein Verkauf) unter 5 % fällt.
  for (const q of [0.005, 0.01, 0.02, 0.05, 0.2]) {
    const n = abbruchschwelle(q);
    assert.ok(pKeinVerkauf(q, n) <= 0.05, `bei q=${q} ist P(0) nach ${n} Klicks noch ${pKeinVerkauf(q, n)}`);
    assert.ok(pKeinVerkauf(q, n - 1) > 0.05,
      `bei q=${q} wäre schon ${n - 1} Klicks genug — die Schwelle ist zu hoch`);
  }
  assert.equal(abbruchschwelle(0.01), 299);
  assert.equal(abbruchschwelle(0.02), 149);
});

test('Eine kleinere Quote braucht mehr Klicks, eine größere Sicherheit auch', () => {
  assert.ok(abbruchschwelle(0.005) > abbruchschwelle(0.01));
  assert.ok(abbruchschwelle(0.01) > abbruchschwelle(0.02));
  assert.ok(abbruchschwelle(0.01, 0.99) > abbruchschwelle(0.01, 0.95));
});

test('pKeinVerkauf und nochPlausibleQuote sind Umkehrungen voneinander', () => {
  nah(pKeinVerkauf(0, 500), 1);
  nah(pKeinVerkauf(0.01, 0), 1);
  nah(pKeinVerkauf(0.5, 1), 0.5);

  for (const n of [50, 100, 299, 600]) {
    const q = nochPlausibleQuote(n);
    // Genau an der Grenze: Bei dieser Quote wäre ein Nullbefund gerade noch
    // 5 % wahrscheinlich.
    nah(pKeinVerkauf(q, n), 1 - SICHERHEIT, 1e-12);
  }
  // Ohne einen einzigen Klick ist nichts ausgeschlossen.
  assert.equal(nochPlausibleQuote(0), 1);
});

test('Der Versuchsplan rechnet Budget in Klicks, Klicks in Tage und Geld', () => {
  const p = versuchsplan({ tagesbudget: 10, klickpreis: 1.5, quote: 0.01, deckungsbeitragJeVerkauf: 410.94 });
  nah(p.klicksJeTag, 10 / 1.5);
  nah(p.klicksJeMonat, (10 / 1.5) * TAGE_JE_MONAT);
  assert.equal(p.schwelleKlicks, 299);
  nah(p.schwelleKosten, 299 * 1.5);
  nah(p.schwelleTage, 299 / (10 / 1.5));

  // Der Befund, um den es geht: 200 Klicks ohne Verkauf sind bei 1 % noch
  // gut jeder achte Fall. Ein Monat ohne Bestellung widerlegt nichts.
  assert.ok(p.pKeinVerkaufImMonat > 0.13 && p.pKeinVerkaufImMonat < 0.14,
    `P(Monat ohne Verkauf) = ${p.pKeinVerkaufImMonat}`);

  nah(p.werbekostenJeVerkauf, 150);
  assert.equal(p.traegt, true);
  nah(p.ueberschussJeVerkauf, 410.94 - 150);
});

test('Trägt/trägt nicht kippt genau am Deckungsbeitrag', () => {
  const plan = (db, q) => versuchsplan({ tagesbudget: 10, klickpreis: 1.5, quote: q, deckungsbeitragJeVerkauf: db });
  // Bei 0,5 % kostet ein Verkauf 300 € Werbung.
  assert.equal(plan(300.01, 0.005).traegt, true);
  assert.equal(plan(299.99, 0.005).traegt, false);
  // Gleichstand ist kein Tragen: Ein Deckungsbeitrag, der die Werbung genau
  // aufbraucht, lässt nichts übrig.
  assert.equal(plan(300, 0.005).traegt, false);

  // WDVS trägt bei 0,5 % nicht, Kamin schon — der Grund für die Verengung
  // des ersten Anlaufs.
  assert.equal(plan(209.40, 0.005).traegt, false);
  assert.equal(plan(410.94, 0.005).traegt, true);
});

test('Unbrauchbare Eingaben werfen, statt eine Zahl zu erfinden', () => {
  for (const q of [0, 1, -0.1, 1.5]) {
    assert.throws(() => abbruchschwelle(q), /Kaufquote/, `q=${q} kam durch`);
  }
  assert.throws(() => abbruchschwelle(0.01, 0), /Sicherheit/);
  assert.throws(() => abbruchschwelle(0.01, 1), /Sicherheit/);
  assert.throws(() => pKeinVerkauf(0.01, -1), /Klickzahl/);
  for (const feld of ['tagesbudget', 'klickpreis', 'deckungsbeitragJeVerkauf']) {
    const p = { tagesbudget: 10, klickpreis: 1.5, quote: 0.01, deckungsbeitragJeVerkauf: 100, [feld]: 0 };
    assert.throws(() => versuchsplan(p), new RegExp(feld), `${feld}=0 kam durch`);
  }
});
