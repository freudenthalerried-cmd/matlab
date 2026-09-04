import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wegwerfordner } from '../src/wegwerf.js';
import {
  MARKENENDUNG, markenpfad, markiere, nimmAb, lies, offeneMarken, stelleZurueck, mutationsbefund,
} from '../src/mutationsschutz.js';

/** Ein Wegwerfverzeichnis mit einer Datei darin. */
const bau = (inhalt = 'echt\n') => {
  const ordner = wegwerfordner('mutation-');
  const datei = join(ordner, 'quelle.js');
  writeFileSync(datei, inhalt);
  return { ordner, datei };
};

test('der Zettel liegt neben der Datei und trägt ihr Original', () => {
  const { datei } = bau('const a = 1;\n');
  const pfad = markiere(datei, 'const a = 1;\n', 'probe');
  assert.equal(pfad, markenpfad(datei));
  assert.ok(pfad.includes('.sicherung'), 'der Zettel gehört in den gitignorierten Bereich');
  assert.ok(pfad.endsWith(MARKENENDUNG));
  const m = lies(pfad);
  assert.equal(m.lesbar, true);
  assert.equal(m.original, 'const a = 1;\n');
  assert.equal(m.wer, 'probe');
});

test('ein Zettel ohne Absender wird abgelehnt', () => {
  const { datei } = bau();
  assert.throws(() => markiere(datei, 'egal', ''), /Absender/);
});

test('nimmAb entfernt den Zettel und sagt, ob es einen gab', () => {
  const { datei } = bau();
  markiere(datei, 'echt\n', 'probe');
  assert.equal(nimmAb(datei), true);
  assert.equal(existsSync(markenpfad(datei)), false);
  assert.equal(nimmAb(datei), false, 'zweimal abnehmen ist kein Fehler, aber auch kein Fund');
});

test('offeneMarken findet den Zettel und zählt, was es angesehen hat', () => {
  const { ordner, datei } = bau();
  markiere(datei, 'echt\n', 'probe');
  const marken = offeneMarken(ordner);
  assert.equal(marken.length, 1);
  assert.equal(marken[0].datei, datei);
  // Der gesunde Zustand ist null Funde. Ohne diese Zahl sähe „nichts
  // gefunden" genauso aus wie „nicht hingesehen".
  assert.ok(marken.angesehen >= 3, `nur ${marken.angesehen} Einträge angesehen`);
});

test('stelleZurueck holt die absichtlich falsche Datei zurück', () => {
  const { datei } = bau('echt\n');
  markiere(datei, 'echt\n', 'probe');
  writeFileSync(datei, 'absichtlich falsch\n');
  const marke = lies(markenpfad(datei));
  const ergebnis = stelleZurueck(marke);
  assert.equal(ergebnis.schonRichtig, false);
  assert.equal(readFileSync(datei, 'utf8'), 'echt\n');
  assert.equal(existsSync(markenpfad(datei)), false, 'der Zettel gehört danach weg');
});

test('ein Zettel über einer bereits richtigen Datei ist harmlos und wird gesagt', () => {
  const { datei } = bau('echt\n');
  markiere(datei, 'echt\n', 'probe');
  const ergebnis = stelleZurueck(lies(markenpfad(datei)));
  assert.equal(ergebnis.schonRichtig, true);
});

test('der Befund trennt die liegen gebliebene Mutation vom bloßen Zettel', () => {
  const { ordner, datei } = bau('echt\n');
  markiere(datei, 'echt\n', 'probe');
  const harmlos = mutationsbefund(ordner);
  assert.equal(harmlos.meldungen.length, 1);
  assert.equal(harmlos.meldungen[0].regel, 'zettel-ohne-mutation');

  writeFileSync(datei, 'absichtlich falsch\n');
  const ernst = mutationsbefund(ordner);
  assert.equal(ernst.meldungen.length, 1);
  assert.equal(ernst.meldungen[0].regel, 'mutation-liegen-geblieben');
  assert.equal(ernst.sauber, false);
  assert.ok(ernst.angesehen >= 3, `nur ${ernst.angesehen} Einträge angesehen`);
});

test('ein unlesbarer Zettel ist ein Fund, kein Absturz', () => {
  const { ordner, datei } = bau();
  const pfad = markenpfad(datei);
  mkdirSync(join(ordner, '.sicherung'), { recursive: true });
  writeFileSync(pfad, 'kein JSON');
  const befund = mutationsbefund(ordner);
  assert.equal(befund.meldungen.length, 1);
  assert.equal(befund.meldungen[0].regel, 'zettel-unlesbar');
  assert.throws(() => stelleZurueck(lies(pfad)), /Unlesbarer Zettel/);
});

test('ein leeres Verzeichnis ist sauber, sagt aber, dass es hingesehen hat', () => {
  const ordner = wegwerfordner('mutation-leer-');
  writeFileSync(join(ordner, 'a.js'), 'x');
  writeFileSync(join(ordner, 'b.js'), 'y');
  const befund = mutationsbefund(ordner);
  assert.equal(befund.sauber, true);
  assert.equal(befund.angesehen, 2);
});
