import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync, copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const werkzeug = fileURLToPath(new URL('../bin/import.mjs', import.meta.url));
const beispielVerzeichnis = fileURLToPath(new URL('../beispiel/', import.meta.url));
const musterdatei = join(beispielVerzeichnis, 'preisliste-muster-bahnen.csv');
const artikelDatei = fileURLToPath(new URL('../data/artikel.json', import.meta.url));

test('der Muster-Riegel prüft den aufgelösten Pfad, nicht nur das Argument', () => {
  // Ein markerfreier Dateiname in einem als Beispiel markierten Verzeichnis:
  // nur der aufgelöste Pfad trägt den Marker. Vor der Korrektur schrieb genau
  // dieser Aufruf vier erfundene Preise als bestätigt in den Katalog.
  const verzeichnis = mkdtempSync(join(tmpdir(), 'beispiel-'));
  copyFileSync(musterdatei, join(verzeichnis, 'preisliste-bahnen.csv'));
  const vorher = readFileSync(artikelDatei, 'utf8');
  const lauf = spawnSync(
    process.execPath,
    [werkzeug, 'bahnen-de', 'preisliste-bahnen.csv', '--schreiben'],
    { encoding: 'utf8', cwd: verzeichnis },
  );
  assert.equal(lauf.status, 3, 'der Riegel muss mit Exit 3 abbrechen');
  assert.ok(lauf.stderr.includes('als Muster gekennzeichnet'), 'die Meldung nennt den Grund');
  assert.equal(readFileSync(artikelDatei, 'utf8'), vorher, 'der Katalog bleibt unangetastet');
});

test('die ausgelieferte Musterdatei trägt den Marker im eigenen Namen', () => {
  // Zweite Verteidigungslinie: Auch eine an einen markerfreien Ort kopierte
  // Datei bleibt gesperrt, solange niemand zusätzlich den Namen ändert.
  const lauf = spawnSync(
    process.execPath,
    [werkzeug, 'bahnen-de', musterdatei, '--schreiben'],
    { encoding: 'utf8' },
  );
  assert.equal(lauf.status, 3, 'der Riegel muss mit Exit 3 abbrechen');
});

test('der Probelauf über die Musterdatei bleibt erlaubt und schreibt nichts', () => {
  const vorher = readFileSync(artikelDatei, 'utf8');
  const lauf = spawnSync(
    process.execPath,
    [werkzeug, 'bahnen-de', 'preisliste-muster-bahnen.csv'],
    { encoding: 'utf8', cwd: beispielVerzeichnis },
  );
  assert.equal(lauf.status, 0, 'der Probelauf ist kein Fehlerfall');
  assert.ok(lauf.stdout.includes('Probelauf'), 'die Ausgabe benennt den Probelauf');
  assert.equal(readFileSync(artikelDatei, 'utf8'), vorher, 'der Katalog bleibt unangetastet');
});

test('eine fehlende Preisliste gibt eine Meldung, keinen Stacktrace', () => {
  const lauf = spawnSync(
    process.execPath,
    [werkzeug, 'bahnen-de', 'gibt-es-nicht.csv'],
    { encoding: 'utf8', cwd: beispielVerzeichnis },
  );
  assert.equal(lauf.status, 2, 'fehlende Datei beendet mit Exit 2 wie die übrigen Aufruffehler');
  assert.ok(lauf.stderr.includes('Preisliste nicht lesbar'), 'die Meldung benennt das Problem');
  assert.ok(!lauf.stderr.includes('at '), 'kein Stacktrace in der Meldung');
});


test('das Werkzeug schreibt nicht mehr — auch nicht mit einer echten Liste', () => {
  // **Der Befund vom 30.08.:** `--schreiben` hätte den Import nach
  // `data/artikel.json` geschrieben — dem Platzhalterbestand des abgelösten
  // Radon-Modells, den der Shop gar nicht liest — und dabei `ekNetto` und
  // `uvpNetto` in ein **versioniertes, öffentliches** Verzeichnis getragen.
  //
  // Der Musterriegel oben greift nur bei Dateinamen mit „muster", „beispiel"
  // oder „demo". Eine echte Liste wäre durchgekommen.
  const verzeichnis = mkdtempSync(join(tmpdir(), 'liste-'));
  const liste = join(verzeichnis, 'artikelliste.csv');
  writeFileSync(liste, 'sku;bezeichnung;uvp_netto;ek_netto\nZ-1;Ware;100;60\n');
  const vorher = readFileSync(artikelDatei, 'utf8');
  const lauf = spawnSync(process.execPath, [werkzeug, 'bahnen-de', liste, '--schreiben'], { encoding: 'utf8' });
  assert.equal(lauf.status, 3, 'Abbruch statt Schreiben');
  assert.match(lauf.stderr, /schreibt nicht mehr/);
  assert.match(lauf.stderr, /katalog-aus-rechnungen/, 'der richtige Weg wird genannt');
  assert.equal(readFileSync(artikelDatei, 'utf8'), vorher, 'die Datei bleibt unangetastet');
});

test('der Probelauf bleibt und rechnet die Liste durch', () => {
  // Was am Tag der Lieferantenliste zuerst gebraucht wird: eine Liste
  // einlesen und die Befunde lesen. Das bleibt, gesperrt ist nur das
  // Schreiben.
  const verzeichnis = mkdtempSync(join(tmpdir(), 'liste-'));
  const liste = join(verzeichnis, 'artikelliste.csv');
  writeFileSync(liste, 'sku;bezeichnung;uvp_netto;ek_netto\nZ-1;Ware;100;60\nZ-2;Ware zwei;20;18\n');
  const lauf = spawnSync(process.execPath, [werkzeug, 'bahnen-de', liste], { encoding: 'utf8' });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /Gelesen: 2 Artikel/);
  assert.match(lauf.stdout, /Gate 22/, 'der gedeckelte Artikel wird gemeldet');
  assert.match(lauf.stdout, /Probelauf/);
});
