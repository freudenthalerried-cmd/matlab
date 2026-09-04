import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cpSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wegwerfordner } from '../src/wegwerf.js';

const wurzel = fileURLToPath(new URL('..', import.meta.url));

// Der Bau schreibt demo.html neben sich. Jede Sonde bekommt deshalb eine
// eigene Kopie von Bauskript, Vorlage, Daten und Kern — das echte demo.html
// bleibt unangetastet.
const baustelle = () => {
  const ziel = wegwerfordner('bau-');
  for (const teil of ['build-demo.mjs', 'demo-template.html', 'data', 'src']) {
    cpSync(join(wurzel, teil), join(ziel, teil), { recursive: true });
  }
  return ziel;
};

const baue = (ziel) => spawnSync(process.execPath, [join(ziel, 'build-demo.mjs')], { encoding: 'utf8' });

test('der Bau läuft auf dem Repostand durch und ersetzt beide Platzhalter', () => {
  const ziel = baustelle();
  const lauf = baue(ziel);
  assert.equal(lauf.status, 0, lauf.stderr);
  const seite = readFileSync(join(ziel, 'demo.html'), 'utf8');
  assert.ok(!seite.includes('/*__KERN__*/'), 'der Kern-Platzhalter ist ersetzt');
  assert.ok(!seite.includes('/*__DATEN__*/'), 'der Daten-Platzhalter ist ersetzt');
});

test('ein Artikelname mit Ersetzungsmuster übersteht den Bau wörtlich', () => {
  const ziel = baustelle();
  const artikelDatei = join(ziel, 'data', 'artikel.json');
  const daten = JSON.parse(readFileSync(artikelDatei, 'utf8'));
  daten.artikel[0].bezeichnung = 'Bahn $& Rolle $` Sonderposten';
  writeFileSync(artikelDatei, JSON.stringify(daten, null, 2));
  const lauf = baue(ziel);
  assert.equal(lauf.status, 0, lauf.stderr);
  const seite = readFileSync(join(ziel, 'demo.html'), 'utf8');
  assert.ok(seite.includes('Bahn $& Rolle $` Sonderposten'), 'der Name steht wörtlich in der Seite');
  assert.ok(!seite.includes('/*__DATEN__*/'), 'kein Platzhalter wurde zurückgeschrieben');
});

test('eine Kollision zwischen Template-Skript und Kern lässt den Bau scheitern', () => {
  const ziel = baustelle();
  const vorlage = join(ziel, 'demo-template.html');
  const seite = readFileSync(vorlage, 'utf8');
  // textZeile kommt aus src/format.js in den Kern; das Template deklariert sie
  // hier ein zweites Mal im selben Skript — der Kern-Wächter sieht das nicht,
  // erst das Parsen des fertigen Skripts muss es melden.
  writeFileSync(vorlage, seite.replace('const daten = /*__DATEN__*/;', 'const daten = /*__DATEN__*/;\nconst textZeile = 1;'));
  const lauf = baue(ziel);
  assert.notEqual(lauf.status, 0, 'der Bau darf nicht grün durchlaufen');
  assert.ok(lauf.stderr.includes('parst nicht'), 'die Meldung benennt den Parsefehler');
});

test('ein fehlender Platzhalter in der Vorlage fällt sofort auf', () => {
  const ziel = baustelle();
  const vorlage = join(ziel, 'demo-template.html');
  writeFileSync(vorlage, readFileSync(vorlage, 'utf8').replace('/*__KERN__*/', ''));
  const lauf = baue(ziel);
  assert.notEqual(lauf.status, 0, 'der Bau darf ohne Kern-Platzhalter nicht durchlaufen');
  assert.ok(lauf.stderr.includes('Platzhalter fehlt'), 'die Meldung benennt den fehlenden Platzhalter');
});

test('der Kollisionswächter im Kern meldet weiterhin doppelte Namen', () => {
  const ziel = baustelle();
  appendFileSync(join(ziel, 'src', 'format.js'), '\nexport const cent2 = 1;\nexport const cent2Doppel = 1;\n');
  appendFileSync(join(ziel, 'src', 'preis.js'), '\nexport const cent2 = 2;\n');
  const lauf = baue(ziel);
  assert.notEqual(lauf.status, 0, 'der Bau darf bei Kern-Kollision nicht durchlaufen');
  assert.ok(lauf.stderr.includes('Doppelt deklariert'), 'die Meldung nennt die Kollision');
  assert.ok(lauf.stderr.includes('cent2'), 'die Meldung nennt den Namen');
});
