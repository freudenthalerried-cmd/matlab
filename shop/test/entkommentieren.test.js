import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentare } from '../src/entkommentieren.js';
import { baueKern, KERNMODULE, SHOPMODULE } from '../src/buendel.js';

const hier = fileURLToPath(new URL('.', import.meta.url));
const src = join(hier, '..', 'src');

test('Zeilen- und Blockkommentare verschwinden, der Code bleibt', () => {
  const { text, entfernt } = ohneKommentare(
    '/** Kopf */\nconst a = 1; // dahinter\n/* mitten */ const b = 2;\n');
  assert.equal(entfernt, 3);
  assert.match(text, /const a = 1;/);
  assert.match(text, /const b = 2;/);
  assert.ok(!text.includes('Kopf'));
  assert.ok(!text.includes('dahinter'));
  assert.ok(!text.includes('mitten'));
});

test('ein // in einer Zeichenkette ist kein Kommentar', () => {
  for (const quelle of [
    `const u = 'https://example.at/pfad';`,
    `const u = "a // b";`,
    'const u = `https://example.at`;',
    'const u = `${x} // kein Kommentar`;',
  ]) {
    const { text, entfernt } = ohneKommentare(quelle);
    assert.equal(entfernt, 0, `entfernt in: ${quelle}`);
    assert.equal(text, quelle);
  }
});

test('ein /* in einem regulären Ausdruck ist kein Kommentar', () => {
  const quelle = 'const r = /a\\/*b/g;\nconst t = x.replace(/\\/\\//g, "");';
  const { text, entfernt } = ohneKommentare(quelle);
  assert.equal(entfernt, 0);
  assert.equal(text, quelle);
});

test('Division wird nicht für einen regulären Ausdruck gehalten', () => {
  const quelle = 'const q = (a + b) / c / d;\nconst e = f[0] / 2;';
  const { text } = ohneKommentare(quelle);
  assert.equal(text, quelle);
});

test('Zeilennummern bleiben erhalten', () => {
  const quelle = '/**\n * drei\n * Zeilen\n */\nconst a = 1;\n';
  const { text } = ohneKommentare(quelle);
  assert.equal(text.split('\n').length, quelle.split('\n').length);
  assert.equal(text.split('\n')[4], 'const a = 1;');
});

test('jedes Modul in src/ übersteht das Entfernen und parst danach', () => {
  const module = readdirSync(src).filter((d) => d.endsWith('.js'));
  // Ohne diese Zusicherung liefe die Schleife bei leerem Ordner durch und
  // meldete Grün.
  assert.ok(module.length >= 30, `${module.length} Module gefunden`);

  const ablage = mkdtempSync(join(tmpdir(), 'ohne-kommentare-'));
  try {
    let gespart = 0;
    for (const m of module) {
      const roh = readFileSync(join(src, m), 'utf8');
      const { text } = ohneKommentare(roh);
      gespart += roh.length - text.length;
      const datei = join(ablage, m.replace(/\.js$/, '.mjs'));
      writeFileSync(datei, text, 'utf8');
      const lauf = spawnSync(process.execPath, ['--check', datei], { encoding: 'utf8' });
      assert.equal(lauf.status, 0, `${m} parst nach dem Entfernen nicht:\n${lauf.stderr}`);
    }
    // Und es wurde tatsächlich etwas entfernt — sonst prüfte der Test einen
    // Durchreicher.
    assert.ok(gespart > 50_000, `nur ${gespart} Zeichen entfernt`);
  } finally {
    rmSync(ablage, { recursive: true, force: true });
  }
});

test('das ausgelieferte Bündel trägt danach keine Erklärung der Kalkulation mehr', () => {
  // Der volle Kern, nicht das Browserbündel: Das Rechenbeispiel steht in
  // `preis.js`, und die Datei fährt seit dem 29.08. nicht mehr mit. Geprüft
  // wird hier der Kommentarentferner, nicht die Auswahl der Module.
  const roh = baueKern((name) => readFileSync(join(src, name), 'utf8'),
    [...KERNMODULE, ...SHOPMODULE]);
  const ohne = ohneKommentare(roh).text;

  // Die Gegenrichtung zuerst: Im rohen Bündel steht es, sonst prüft der Test
  // eine Abwesenheit, die es nie gab.
  assert.match(roh, /Einkauf und 25 % Ziel/,
    'im rohen Bündel muss das Rechenbeispiel stehen — sonst ist dieser Test hohl');
  assert.ok(!/Einkauf und 25 % Ziel/.test(ohne));
  assert.ok(!/Zielmarge (ist|beträgt|von)/i.test(ohne));

  // Der Code selbst muss dabei stehenbleiben.
  assert.match(ohne, /function kalkuliere\(/);
  assert.match(ohne, /function berechneWarenkorb\(/);
});
