import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { baueZip, crc32, dosZeit, archivbefund, inhaltsbefund } from '../src/paket.js';
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

/* ------------------------------------------------------------------ *
 * Was im Archiv steht, gegen das, was gebaut wurde — 11. September 2026
 *
 * Die Probe oben hält ein **selbstgebautes Archiv aus zwei Einträgen** gegen
 * `unzip -t`. Das echte trägt 89 Einträge und 3,35 MB. Diese Fälle prüfen die
 * Regeln, mit denen `npm run pruefe-paket` das ausgepackte gegen das gebaute
 * hält — der Lauf selbst steht im Prüferregister.
 * ------------------------------------------------------------------ */

test('Eine Datei zu wenig im Archiv meldet sich, eine zu viel auch', () => {
  const bau = new Map([
    ['index.html', Buffer.from('eins')],
    ['artikel/POS-1.html', Buffer.from('zwei')],
  ]);
  assert.equal(archivbefund(new Map(bau), bau).sauber, true);

  const ohne = new Map(bau);
  ohne.delete('artikel/POS-1.html');
  const fehlt = archivbefund(ohne, bau);
  assert.equal(fehlt.meldungen[0].regel, 'fehlt-im-archiv');
  assert.match(fehlt.meldungen[0].text, /POS-1/);

  const zuviel = new Map(bau);
  zuviel.set('geheim.txt', Buffer.from('drei'));
  const extra = archivbefund(zuviel, bau);
  assert.equal(extra.meldungen[0].regel, 'nicht-gebaut');
});

test('Ein Byte Unterschied im Inhalt fällt auf, nicht erst die fehlende Datei', () => {
  // Gleiche Länge, anderes Byte: Wer nur Namen und Größen vergleicht, sieht
  // hier nichts — und genau so sieht ein halb geschriebenes Archiv aus.
  const bau = new Map([['shop.js', Buffer.from('window.__SHOP__=1')]]);
  const archiv = new Map([['shop.js', Buffer.from('window.__SHOP__=2')]]);
  const b = archivbefund(archiv, bau);
  assert.equal(b.meldungen[0].regel, 'inhalt-weicht-ab');
});

test('Das Inhaltsverzeichnis wird in beide Richtungen nachgerechnet', () => {
  const inhalt = Buffer.from('hallo');
  const summe = createHash('sha256').update(inhalt).digest('hex');
  const summen = new Map([['index.html', summe]]);
  const groessen = new Map([['index.html', inhalt.length]]);

  assert.equal(inhaltsbefund(`${summe}  5  index.html`, summen, groessen).sauber, true);

  const falsch = inhaltsbefund(`${'0'.repeat(64)}  5  index.html`, summen, groessen);
  assert.equal(falsch.meldungen[0].regel, 'summe-weicht-ab');

  const zuGross = inhaltsbefund(`${summe}  9  index.html`, summen, groessen);
  assert.equal(zuGross.meldungen[0].regel, 'groesse-weicht-ab');

  const ohneZeile = inhaltsbefund('', summen, groessen);
  const regeln = ohneZeile.meldungen.map((m) => m.regel);
  assert.ok(regeln.includes('datei-ohne-zeile'));
  assert.ok(regeln.includes('kein-verzeichnis'), 'ein leeres Verzeichnis darf nicht sauber melden');

  const ohneDatei = inhaltsbefund(`${summe}  5  gibt-es-nicht.html`, summen, groessen);
  assert.ok(ohneDatei.meldungen.some((m) => m.regel === 'zeile-ohne-datei'));
});
