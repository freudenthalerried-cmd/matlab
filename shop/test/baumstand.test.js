import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { ENDUNGEN, NICHT_HINEIN, baumabdruck, baumbefund, bewegungstext } from '../src/baumstand.js';
// **Nicht `mkdtempSync` von Hand.** Der Befund vom 4. September: 63.082
// Einträge unter `/tmp`, weil zwölf Proben sich selbst ein Verzeichnis
// anlegten und es liegen ließen. `src/wegwerf.js` räumt auch bei
// `process.exit` auf; eine Probe, die ihre Spuren behält, wird irgendwann
// selbst der Fehler.
import { wegwerfordner } from '../src/wegwerf.js';

const abdruckVon = (eintraege) => new Map(Object.entries(eintraege));

test('ein unveränderter Baum ist ruhig', () => {
  const a = abdruckVon({ 'src/a.js': 'aaa', 'src/b.js': 'bbb' });
  const b = new Map(a);
  const befund = baumbefund(a, b);
  assert.equal(befund.ruhig, true);
  assert.deepEqual(befund.bewegt, []);
});

test('eine geänderte Datei ist eine Bewegung', () => {
  const a = abdruckVon({ 'src/a.js': 'aaa' });
  const befund = baumbefund(a, abdruckVon({ 'src/a.js': 'zzz' }));
  assert.deepEqual(befund.geaendert, ['src/a.js']);
  assert.equal(befund.ruhig, false);
});

test('eine neue und eine verschwundene Datei zählen mit', () => {
  const a = abdruckVon({ 'src/a.js': 'aaa', 'src/weg.js': 'www' });
  const befund = baumbefund(a, abdruckVon({ 'src/a.js': 'aaa', 'src/neu.js': 'nnn' }));
  assert.deepEqual(befund.dazu, ['src/neu.js']);
  assert.deepEqual(befund.weg, ['src/weg.js']);
  assert.deepEqual(befund.bewegt, ['src/neu.js', 'src/weg.js']);
});

/**
 * Der Läufer schreibt die geprüfte Datei selbst — einmal falsch, einmal
 * zurück. Diese eine Datei ist seine Arbeit und keine fremde Bewegung.
 */
test('was der Lauf selbst hält, zählt nicht als Bewegung', () => {
  const a = abdruckVon({ 'src/a.js': 'aaa', 'src/b.js': 'bbb' });
  const jetzt = abdruckVon({ 'src/a.js': 'mutiert', 'src/b.js': 'bbb' });
  assert.deepEqual(baumbefund(a, jetzt, ['src/a.js']).bewegt, []);
  assert.deepEqual(baumbefund(a, jetzt).bewegt, ['src/a.js']);
});

test('der Satz nennt die Dateien — ohne sie wäre er dieselbe Anschuldigung', () => {
  const befund = baumbefund(abdruckVon({ 'src/a.js': 'aaa' }), abdruckVon({ 'src/a.js': 'zzz' }));
  const satz = bewegungstext(befund);
  assert.match(satz, /src\/a\.js/);
  assert.match(satz, /bewegt/);
});

test('bei vielen Dateien nennt der Satz die ersten und zählt den Rest', () => {
  const vorher = new Map();
  const jetzt = new Map();
  for (let i = 0; i < 9; i += 1) {
    vorher.set(`src/d${i}.js`, 'alt');
    jetzt.set(`src/d${i}.js`, 'neu');
  }
  const satz = bewegungstext(baumbefund(vorher, jetzt), 3);
  assert.match(satz, /und 6 weitere/);
});

test('der Abdruck liest den Inhalt, nicht die Änderungszeit', () => {
  const wurzel = wegwerfordner('baumstand-');
  {
    const datei = join(wurzel, 'a.js');
    writeFileSync(datei, 'const a = 1;\n');
    const vorher = baumabdruck(wurzel);
    // Zurückgeschrieben mit demselben Inhalt: neue Zeit, gleicher Abdruck.
    writeFileSync(datei, 'const a = 1;\n');
    assert.equal(baumbefund(vorher, baumabdruck(wurzel)).ruhig, true);
    writeFileSync(datei, 'const a = 2;\n');
    assert.deepEqual(baumbefund(vorher, baumabdruck(wurzel)).geaendert, ['a.js']);
    unlinkSync(datei);
    assert.deepEqual(baumbefund(vorher, baumabdruck(wurzel)).weg, ['a.js']);
  }
});

test('der Abdruck geht nicht in die ausgeschlossenen Ordner', () => {
  const wurzel = wegwerfordner('baumstand-');
  {
    writeFileSync(join(wurzel, 'a.js'), 'x');
    for (const name of NICHT_HINEIN) {
      mkdirSync(join(wurzel, name), { recursive: true });
      writeFileSync(join(wurzel, name, 'drin.js'), 'x');
    }
    assert.deepEqual([...baumabdruck(wurzel).keys()], ['a.js']);
  }
});

test('der Abdruck nimmt nur die Endungen des Bestands', () => {
  const wurzel = wegwerfordner('baumstand-');
  {
    writeFileSync(join(wurzel, 'a.js'), 'x');
    writeFileSync(join(wurzel, 'bild.png'), 'x');
    writeFileSync(join(wurzel, 'ohne'), 'x');
    assert.deepEqual([...baumabdruck(wurzel).keys()], ['a.js']);
    assert.ok(ENDUNGEN.includes('.js'));
  }
});
