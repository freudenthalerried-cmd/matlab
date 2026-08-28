import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Der Katalogerzeuger, wirklich ausgeführt.
 *
 * Anlass ist der Fund vom 28.08.: `npm run katalog` schrieb den Katalog neu
 * und **löschte dabei die sieben belegten Gewichte**, die ein anderes
 * Werkzeug eingetragen hatte. Kein Test hat das bemerkt, weil keiner den
 * Erzeuger je laufen ließ.
 *
 * > **Ein Erzeuger, den keine Probe ausführt, wird von der Probe nicht
 * > geprüft — egal wie viele Tests seine Ausgabe lesen.**
 *
 * Quelle und Ziele kommen deshalb aus der Umgebung; jeder Lauf schreibt in
 * einen frischen Ordner und lässt den Bestand in Ruhe.
 */
const werkzeug = fileURLToPath(new URL('../bin/katalog-aus-rechnungen.mjs', import.meta.url));
const quelle = fileURLToPath(new URL('../../preise/poschacher-positionen.csv', import.meta.url));
const gewichte = fileURLToPath(new URL('../../preise/gewichte-aus-rechnungen.json', import.meta.url));
const vorhanden = existsSync(quelle) && existsSync(gewichte);

const lauf = (umgebung) => {
  const ordner = mkdtempSync(join(tmpdir(), 'katalogprobe-'));
  const ziel = join(ordner, 'katalog.json');
  const preise = join(ordner, 'preise.json');
  const ergebnis = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: {
      ...process.env,
      KATALOG_QUELLE: quelle,
      KATALOG_ZIEL: ziel,
      KATALOG_PREISE_ZIEL: preise,
      KATALOG_GEWICHTE: gewichte,
      ...umgebung,
    },
  });
  return { ergebnis, ziel, ordner };
};

test('der Erzeuger schreibt die belegten Gewichte mit', { skip: !vorhanden && 'Belegdaten fehlen' }, () => {
  const { ergebnis, ziel } = lauf();
  assert.equal(ergebnis.status, 0, ergebnis.stderr);
  const katalog = JSON.parse(readFileSync(ziel, 'utf8'));
  const mitGewicht = katalog.artikel.filter((a) => a.gewichtKg != null);
  assert.equal(mitGewicht.length, 7, `${mitGewicht.length} statt 7 Artikel mit belegtem Gewicht`);
  for (const a of mitGewicht) {
    assert.equal(a.gewichtQuelle, 'rechnung', `${a.sku}: Gewicht ohne Quellenangabe`);
    assert.ok(a.gewichtKg > 0, `${a.sku}: Gewicht ist nicht positiv`);
  }
  assert.match(String(katalog._gewichtHinweis), /UNBEKANNT/,
    'der Hinweis, dass fehlende Gewichte nicht geschätzt werden, muss mitkommen');
});

test('ein zweiter Lauf ändert nichts', { skip: !vorhanden && 'Belegdaten fehlen' }, () => {
  // Ein Erzeuger, dessen zweiter Lauf ein anderes Ergebnis liefert, hat einen
  // Zustand, den niemand sieht.
  const erst = lauf();
  const zweit = lauf();
  assert.equal(readFileSync(erst.ziel, 'utf8'), readFileSync(zweit.ziel, 'utf8'));
});

test('ohne Gewichtsdatei bricht er ab, statt Belegtes zu löschen', { skip: !vorhanden && 'Belegdaten fehlen' }, () => {
  // Der Fehler vom 28.08., als Probe: Ein Lauf ohne die Gewichtsquelle darf
  // einen Katalog mit Gewichten nicht überschreiben.
  const { ziel, ordner } = lauf();
  assert.ok(JSON.parse(readFileSync(ziel, 'utf8')).artikel.some((a) => a.gewichtKg != null));

  const ergebnis = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: {
      ...process.env,
      KATALOG_QUELLE: quelle,
      KATALOG_ZIEL: ziel,
      KATALOG_PREISE_ZIEL: join(ordner, 'preise.json'),
      KATALOG_GEWICHTE: join(ordner, 'gibt-es-nicht.json'),
    },
  });
  assert.equal(ergebnis.status, 2, 'der Lauf muss abbrechen');
  assert.match(ergebnis.stderr, /belegte Gewichte gingen verloren/);
  assert.ok(JSON.parse(readFileSync(ziel, 'utf8')).artikel.some((a) => a.gewichtKg != null),
    'die Zieldatei darf dabei unverändert bleiben');
});
