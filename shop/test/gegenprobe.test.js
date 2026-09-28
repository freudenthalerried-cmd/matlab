import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wegwerfordner } from '../src/wegwerf.js';

/**
 * **Der Anlass, 31. August 2026.** An einem Tag sind mir drei Gegenproben
 * nicht angekommen — zerlegte Maskierung, `\n` als echter Zeilenumbruch — und
 * jedes Mal lief der Test über den **unveränderten** Code und meldete Grün.
 *
 * Eine Gegenprobe, die nicht ankommt, sieht aus wie eine bestandene. Sie ist
 * die tückischste Fehlmeldung dieses Vorhabens: schlimmer als ein roter Test,
 * weil sie Vertrauen erzeugt, wo nichts geprüft wurde.
 *
 * Das Werkzeug prüft deshalb **zuerst**, ob die Mutation angekommen ist. Diese
 * Datei prüft, dass es das tut.
 */

const werkzeug = fileURLToPath(new URL('../bin/gegenprobe.mjs', import.meta.url));

function lauf({ inhalt, suche, ersatz, befehl }) {
  const ablage = wegwerfordner('gegenprobe-');
  const ziel = join(ablage, 'ziel.txt');
  const sDatei = join(ablage, 'suche.txt');
  const eDatei = join(ablage, 'ersatz.txt');
  writeFileSync(ziel, inhalt);
  writeFileSync(sDatei, suche);
  writeFileSync(eDatei, ersatz);
  const r = spawnSync(process.execPath, [werkzeug, ziel, sDatei, eDatei, '--', ...befehl],
    { encoding: 'utf8' });
  const danach = readFileSync(ziel, 'utf8');
  rmSync(ablage, { recursive: true, force: true });
  return { ...r, danach };
}

test('Kommt die Mutation nicht an, bricht das Werkzeug ab — statt Grün zu melden', () => {
  // **Der Fehler, gegen den dieses Werkzeug gebaut ist.** Ohne diese Sperre
  // liefe der Befehl über den unveränderten Code und meldete „bestanden".
  const r = lauf({
    inhalt: 'const a = 1;\n',
    suche: 'const b = 2;',
    ersatz: 'const b = 3;',
    befehl: ['true'],
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Suchtext kommt in .* nicht vor/);
  assert.match(r.stderr, /Grün gemeldet, ohne etwas zu prüfen/);
  assert.equal(r.danach, 'const a = 1;\n', 'die Datei wurde angefasst');
});

test('Ein mehrdeutiger Suchtext bricht ab', () => {
  // Eine Gegenprobe, die mehrere Stellen zugleich ändert, sagt nicht, welche
  // davon der Test bemerkt hat.
  const r = lauf({
    inhalt: 'x = 1;\nx = 1;\n',
    suche: 'x = 1;',
    ersatz: 'x = 2;',
    befehl: ['true'],
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /2-mal vor/);
});

test('Bemerkt der Test die Mutation nicht, gilt die Gegenprobe als gescheitert', () => {
  // **Der Ausgangscode ist umgekehrt.** Läuft der Befehl durch, obwohl der
  // Code verändert ist, prüft er die Stelle nicht.
  const r = lauf({
    inhalt: 'const a = 1;\n',
    suche: 'const a = 1;',
    ersatz: 'const a = 2;',
    befehl: ['true'],
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /NICHT bestanden/);
  assert.match(r.stdout, /Die Stelle ist ungeprüft/);
});

test('Bemerkt der Test die Mutation, ist die Gegenprobe bestanden', () => {
  const r = lauf({
    inhalt: 'const a = 1;\n',
    suche: 'const a = 1;',
    ersatz: 'const a = 2;',
    befehl: ['false'],
  });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Gegenprobe bestanden/);
});

test('Die Datei wird zurückgesetzt, auch wenn der Befehl abstürzt', () => {
  // Ohne diese Zusicherung bliebe nach einem Absturz mutierter Code liegen —
  // und der nächste Lauf prüfte etwas anderes, als er glaubt.
  const r = lauf({
    inhalt: 'unverändert\n',
    suche: 'unverändert',
    ersatz: 'mutiert',
    befehl: [process.execPath, '-e', 'process.abort()'],
  });
  assert.equal(r.danach, 'unverändert\n', 'die Mutation ist liegen geblieben');
  assert.match(r.stdout, /wiederhergestellt/);
});

test('Such- und Ersatztext dürfen nicht gleich sein', () => {
  const r = lauf({
    inhalt: 'const a = 1;\n',
    suche: 'const a = 1;',
    ersatz: 'const a = 1;',
    befehl: ['true'],
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /gleich/);
});

test('Ohne Befehl nach `--` bricht es ab', () => {
  const r = spawnSync(process.execPath, [werkzeug, 'a', 'b', 'c', '--'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /kein Befehl/);
});
