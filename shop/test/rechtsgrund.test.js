/**
 * Worauf sich dieser Bestand beruft.
 *
 * **Der Anlass, 9. September 2026, nachts.** Die Runde davor hat gemessen,
 * dass das Rechtsinformationssystem des Bundes aus dieser Umgebung gesperrt
 * ist. Daraus folgt ein Satz, der vorher nirgends stand: **Keine einzige
 * Paragraphenangabe dieses Bestands ist am Volltext belegt.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RECHTSGRUENDE, WIRKUNG, GESETZE, normiere, rechtsbefund, FUNDSTELLE,
} from '../src/rechtsgrund.js';

const finde = (text) => [...text.matchAll(FUNDSTELLE)];

test('das Register ist in Form und sagt zu jeder Nummer, was sie behauptet', () => {
  assert.ok(RECHTSGRUENDE.length >= 15, `nur ${RECHTSGRUENDE.length} Fundstellen`);
  const gesehen = new Set();
  for (const e of RECHTSGRUENDE) {
    assert.ok(!gesehen.has(e.zitat), `${e.zitat} steht zweimal im Register`);
    gesehen.add(e.zitat);
    assert.ok(e.behauptung.length >= 30, `${e.zitat}: Behauptung zu dünn`);
    assert.ok(Object.keys(WIRKUNG).includes(e.wirkung), `${e.zitat}: ${e.wirkung}`);
  }
});

/**
 * Der Kern dieser Runde: **Keine ist belegt, und das steht da.** Sobald
 * jemand eine Stelle am Gesetzestext geprüft hat, gehört ein Datum daneben —
 * dann ist `belegt` eine Aussage über einen Handgriff und kein Gefühl.
 */
test('keine Fundstelle behauptet, belegt zu sein', () => {
  assert.ok(RECHTSGRUENDE.length >= 15, 'bei leerer Liste prüft die Schleife nichts');
  for (const e of RECHTSGRUENDE) {
    assert.equal(e.belegt, false, `${e.zitat} behauptet einen Beleg, den es nicht gibt`);
  }
});

test('die Gesetzesliste kommt aus dem Register, nicht daneben', () => {
  assert.ok(GESETZE.includes('UStG') && GESETZE.includes('BAO') && GESETZE.includes('ABGB'));
  assert.ok(RECHTSGRUENDE.length >= 15, 'bei leerer Liste prüft die Schleife nichts');
  for (const e of RECHTSGRUENDE) {
    assert.ok(GESETZE.includes(e.zitat.split(/\s+/).at(-1)), `${e.zitat}: Gesetz fehlt in GESETZE`);
  }
});

/* ------------------------------------------------------------------ *
 * Wie eine Fundstelle gelesen wird
 * ------------------------------------------------------------------ */

test('Absatz, Ziffer und Litera werden erkannt und einheitlich geschrieben', () => {
  const faelle = [
    ['§ 11 UStG', '§ 11 UStG'],
    ['§ 11 Abs 1 Z 3 UStG', '§ 11 Abs 1 Z 3 UStG'],
    ['§ 11 Absatz 1 Ziffer 3 UStG', '§ 11 Abs 1 Z 3 UStG'],
    ['§ 132a BAO', '§ 132a BAO'],
    ['§ 11 Abs 1 Z 3 lit. a UStG', '§ 11 Abs 1 Z 3 lit a UStG'],
  ];
  assert.equal(faelle.length, 5, 'die Schleife prüfte zu wenig');
  for (const [roh, erwartet] of faelle) {
    const t = finde(roh);
    assert.equal(t.length, 1, roh);
    assert.equal(normiere(t[0]), erwartet, roh);
  }
});

/* ------------------------------------------------------------------ *
 * Der Abgleich, in beide Richtungen
 * ------------------------------------------------------------------ */

const eintrag = (zitat) => ({
  zitat, behauptung: 'b'.repeat(40), wirkung: 'erklaerung', belegt: false,
});

test('eine Fundstelle ohne Eintrag fällt auf', () => {
  const b = rechtsbefund([{ pfad: 'a.js', text: 'nach § 99 UStG gilt' }], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['fundstelle-ohne-eintrag']);
});

test('ein Eintrag ohne Fundstelle fällt auch auf', () => {
  const b = rechtsbefund([{ pfad: 'a.js', text: 'nichts' }], [eintrag('§ 99 UStG')]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['eintrag-ohne-fundstelle']);
});

/**
 * **Eine Nummer ohne Gesetz ist eine Zahl.** Beim ersten Lauf hat der Prüfer
 * drei solche Stellen gefunden — in `kontrolle.js`, `belegpruefung.mjs` und
 * `kontrolllauf.mjs` stand ein Paragraph, dessen Gesetz nirgends in der Datei
 * genannt war.
 */
test('ein Paragraph ohne Gesetz in der ganzen Datei fällt auf', () => {
  const b = rechtsbefund([{ pfad: 'a.js', text: 'die Frist nach § 132 gilt' }], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['fundstelle-ohne-gesetz']);
});

test('die Kurzform ist erlaubt, wenn die Langform vorher steht', () => {
  const b = rechtsbefund(
    [{ pfad: 'a.js', text: 'zuerst § 132 BAO, später nur noch § 132 ohne alles' }],
    [eintrag('§ 132 BAO')]);
  assert.deepEqual(b.meldungen, []);
});

/** Und die Gegenrichtung: vorher kurz, nachher lang, hilft nicht. */
test('die Langform danach rettet die Kurzform davor nicht', () => {
  const b = rechtsbefund(
    [{ pfad: 'a.js', text: `nur § 132 hier${'\n'.repeat(3)}${'x'.repeat(200)} und § 132 BAO dort` }],
    [eintrag('§ 132 BAO')]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['fundstelle-ohne-gesetz']);
});

/**
 * **Ein Zitat überlebt einen Zeilenumbruch.** In Kopfkommentaren steht
 * regelmäßig „§ 132\n * verlangt sieben Jahre" — dazwischen liegt der
 * Kommentarrand, nicht das Ende der Fundstelle.
 */
test('ein Zitat über einen Kommentarrand hinweg bleibt eines', () => {
  const b = rechtsbefund(
    [{ pfad: 'a.js', text: '/**\n * aufzubewahren nach § 132\n * BAO, sieben Jahre.\n */' }],
    [eintrag('§ 132 BAO')]);
  assert.deepEqual(b.meldungen, []);
});

/**
 * **„§§ 864a, 879 ABGB" ist eine Fundstelle, keine zwei halben** — und die
 * erste Nummer trägt trotzdem ihre eigene Behauptung. Die erste Fassung ließ
 * sie durchgehen; damit wäre die Regel über überraschende Klauseln nie im
 * Register gelandet.
 */
test('auch die erste Nummer einer Reihe braucht ihren Eintrag', () => {
  const ohne = rechtsbefund([{ pfad: 'a.js', text: 'nach § 864a, § 879 ABGB gilt' }],
    [eintrag('§ 879 ABGB')]);
  assert.deepEqual(ohne.meldungen.map((m) => m.regel), ['fundstelle-ohne-eintrag']);
  assert.match(ohne.meldungen[0].text, /§ 864a ABGB/);

  const mit = rechtsbefund([{ pfad: 'a.js', text: 'nach § 864a, § 879 ABGB gilt' }],
    [eintrag('§ 864a ABGB'), eintrag('§ 879 ABGB')]);
  assert.deepEqual(mit.meldungen, []);
});

test('eine Behauptung, die in zwei Wörter passt, ist keine', () => {
  const b = rechtsbefund([{ pfad: 'a.js', text: '§ 99 UStG' }],
    [{ zitat: '§ 99 UStG', behauptung: 'gilt halt', wirkung: 'erklaerung', belegt: false }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'behauptung-zu-duenn'));
});

test('ein Beleg ohne Datum ist ein Gefühl', () => {
  const b = rechtsbefund([{ pfad: 'a.js', text: '§ 99 UStG' }],
    [{ ...eintrag('§ 99 UStG'), belegt: true }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'beleg-ohne-datum'));
});

test('eine fünfte Wirkung gibt es nicht', () => {
  const b = rechtsbefund([{ pfad: 'a.js', text: '§ 99 UStG' }],
    [{ ...eintrag('§ 99 UStG'), wirkung: 'irgendwie' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'wirkung-unbekannt'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand selbst
 * ------------------------------------------------------------------ */

test('zwei Fundstellen wirken auf einem Papier, das der Kunde bekommt', () => {
  const aufPapier = RECHTSGRUENDE.filter((e) => e.wirkung === 'beleg');
  assert.ok(aufPapier.length >= 1, 'keine einzige — dann wäre die Einteilung sinnlos');
  for (const e of aufPapier) assert.match(e.zitat, /UStG/);
});
