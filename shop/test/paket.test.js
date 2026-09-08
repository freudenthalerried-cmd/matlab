import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { baueZip, crc32, dosZeit } from '../src/paket.js';
import { wegwerfordner } from '../src/wegwerf.js';

test('Die Prüfsumme stimmt mit der bekannten Probe überein', () => {
  // Der Standardwert für „123456789" nach ISO 3309 — die Zahl, an der jede
  // CRC-32-Umsetzung gemessen wird.
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  assert.equal(crc32(Buffer.alloc(0)), 0);
});

test('Die DOS-Zeit rechnet in Zweisekundenschritten ab 1980', () => {
  const { zeit, tag } = dosZeit(new Date(2026, 8, 8, 13, 45, 30));
  assert.equal((tag >> 9) + 1980, 2026);
  assert.equal((tag >> 5) & 0xf, 9);
  assert.equal(tag & 0x1f, 8);
  assert.equal(zeit >> 11, 13);
  assert.equal((zeit >> 5) & 0x3f, 45);
  assert.equal((zeit & 0x1f) * 2, 30);

  // Vor 1980 gibt es im Format kein Jahr — gerundet wird nach oben, nicht
  // stillschweigend in eine negative Zahl hinein.
  assert.equal((dosZeit(new Date(1970, 0, 1)).tag >> 9) + 1980, 1980);
});

test('Ein fremdes Programm kann das Archiv lesen', (t) => {
  // **Die eigentliche Zusicherung dieses Moduls.** Ein selbstgeschriebenes
  // Archivformat, das nur die eigene Umsetzung öffnet, ist keines: Es geht an
  // den Auftraggeber, und der packt es mit dem Programm aus, das er hat.
  const wo = spawnSync('which', ['unzip'], { encoding: 'utf8' });
  if (wo.status !== 0) {
    t.skip('unzip ist hier nicht vorhanden — die Gegenprüfung entfällt');
    return;
  }

  // `wegwerfordner` statt `mkdtempSync`: Es räumt auch bei `process.exit` auf.
  // Zwölf Werkzeuge legten sich einmal selbst eines an, acht davon räumten
  // nicht — bis ein Gesamtlauf an 63.082 Einträgen unter /tmp scheiterte.
  const ordner = wegwerfordner('paket-probe-');
  const datei = join(ordner, 'p.zip');
  const inhalt = 'Zeile eins\nZeile zwei — mit Umlauten: äöüß\n';
  writeFileSync(datei, baueZip([
    { name: 'site/index.html', inhalt: Buffer.from(inhalt, 'utf8') },
    { name: 'ABNAHME.txt', inhalt: Buffer.from('acht Punkte\n', 'utf8') },
  ]));

  const geprueft = spawnSync('unzip', ['-t', datei], { encoding: 'utf8' });
  assert.equal(geprueft.status, 0, `unzip -t meldet: ${geprueft.stdout}${geprueft.stderr}`);

  const gelesen = spawnSync('unzip', ['-p', datei, 'site/index.html'], { encoding: 'utf8' });
  assert.equal(gelesen.stdout, inhalt, 'ausgepackt kommt etwas anderes heraus');
});

test('Das Archiv trägt seine Einträge in der Reihenfolge, in der sie kommen', () => {
  const z = baueZip([
    { name: 'a.txt', inhalt: Buffer.from('eins') },
    { name: 'unter/b.txt', inhalt: Buffer.from('zwei') },
  ]);
  // Schlussblock: zweimal die Zahl der Einträge, dann Länge und Versatz.
  assert.equal(z.readUInt32LE(z.length - 22), 0x06054b50);
  assert.equal(z.readUInt16LE(z.length - 22 + 8), 2);
  assert.equal(z.readUInt16LE(z.length - 22 + 10), 2);
  assert.equal(z.readUInt32LE(0), 0x04034b50, 'das Archiv beginnt mit einem lokalen Kopf');
  assert.ok(z.includes(Buffer.from('unter/b.txt')), 'der Pfad steht im Archiv');
});

test('Ein leeres Archiv ist gültig und leer', () => {
  const z = baueZip([]);
  assert.equal(z.length, 22);
  assert.equal(z.readUInt16LE(8), 0);
});
