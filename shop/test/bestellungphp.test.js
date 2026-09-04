/**
 * Das Empfangsskript des Bestellwegs, am laufenden PHP geprüft.
 *
 * **Warum als echter Lauf und nicht als Textprüfung.** Die teuren Fehler eines
 * Empfangsskripts sind keine Tippfehler, sondern Verhalten: eine
 * Kopfzeileneinschleusung, die durchgeht; eine Nummer, die zweimal vergeben
 * wird; ein Journal, das im Webverzeichnis landet. Keines davon sieht man dem
 * Quelltext an, wenn man ihn nicht ausführt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BESTELLFELDER, beispielbestellung } from '../src/bestellfelder.js';
import { freierPort } from '../src/freierport.js';

const skript = fileURLToPath(new URL('../bestellung.php', import.meta.url));

/**
 * Ohne PHP kann diese Probe nichts fahren — und sagt das, statt still grün zu
 * sein. `vorhanden` ist selbst eine Zusicherung, damit eine Umgebung **mit**
 * PHP den Fall auch wirklich fährt.
 */
const vorhanden = spawnSync('php', ['-v'], { encoding: 'utf8' }).status === 0;

test('ob PHP da ist, entscheidet, was diese Probe prüfen kann', () => {
  assert.equal(typeof vorhanden, 'boolean');
});

/** Startet einen Wegwerfserver mit dem Skript und gibt Adresse und Ordner. */
async function server({ konfiguriert = true } = {}) {
  const wurzel = mkdtempSync(join(tmpdir(), 'bestellweg-'));
  const site = join(wurzel, 'site');
  mkdirSync(site);
  copyFileSync(skript, join(site, 'bestellung.php'));
  if (konfiguriert) {
    // **Dieselbe Erzeugung wie in `npm run website`.** Die Feldliste des
    // Skripts kommt aus `src/bestellfelder.js`; eine eigene Liste in dieser
    // Probe prüfte das Skript gegen etwas, das der Bau nie ausliefert.
    const felder = BESTELLFELDER.map((f) => `    ${JSON.stringify(f.name)} => `
      + `${JSON.stringify(f.art)},`).join('\n');
    writeFileSync(join(site, 'bestellung-konfiguration.php'),
      `<?php return [\n  'empfaenger' => 'office@example.at',\n  'felder' => [\n${felder}\n  ],\n];\n`);
  }
  const port = await freierPort();
  const kind = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', site], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/bestellung.php`, { method: 'HEAD' });
      break;
    } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  return { wurzel, port, ende: () => kind.kill() };
}

const schicke = (port, koerper) => fetch(`http://127.0.0.1:${port}/bestellung.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: typeof koerper === 'string' ? koerper : JSON.stringify(koerper),
});

const GUELTIG = {
  text: 'Position 1: 10 Sack Mörtel', bezirk: 'Perg', ...beispielbestellung(),
};

test('eine vollständige Bestellung wird angenommen und abgelegt',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      const antwort = await schicke(s.port, GUELTIG);
      assert.equal(antwort.status, 200);
      const d = await antwort.json();
      assert.equal(d.ok, true);
      assert.match(d.nummer, /^B-\d{4}-0001$/);

      const journal = join(s.wurzel, 'bestellungen', `journal-${new Date().getFullYear()}.jsonl`);
      const zeilen = readFileSync(journal, 'utf8').split('\n').filter(Boolean).map((z) => JSON.parse(z));
      assert.equal(zeilen.length, 1);
      assert.equal(zeilen[0].firma, 'Musterbau GmbH');
      // Die Ablage liegt **über** dem Webverzeichnis. Ein Journal mit Namen
      // und Anschriften unter einer URL ist kein Journal, sondern eine
      // Veröffentlichung.
      assert.equal(existsSync(join(s.wurzel, 'site', 'bestellungen')), false);
    } finally { s.ende(); }
  });

test('die zweite Bestellung bekommt die zweite Nummer',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      await schicke(s.port, GUELTIG);
      const d = await (await schicke(s.port, { ...GUELTIG, firma: 'Zwei GmbH' })).json();
      assert.match(d.nummer, /-0002$/);
    } finally { s.ende(); }
  });

test('ein Zeilenumbruch in einer Angabe kommt nicht durch',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    // Kopfzeileneinschleusung: Der Umbruch machte aus einer Angabe eine
    // zweite Kopfzeile, und die zweite kann ein weiterer Empfänger sein.
    const s = await server();
    try {
      const antwort = await schicke(s.port, { ...GUELTIG, firma: 'A\nBcc: opfer@example.at' });
      assert.equal(antwort.status, 400);
      assert.match((await antwort.json()).grund, /Unerlaubtes Zeichen/);
      assert.equal(existsSync(join(s.wurzel, 'bestellungen')), false, 'abgewiesen und trotzdem abgelegt');
    } finally { s.ende(); }
  });

test('eine unlesbare Adresse, ein fehlendes Feld und kein JSON werden abgewiesen',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      for (const [koerper, muster] of [
        [{ ...GUELTIG, email: 'keine-adresse' }, /E-Mail-Adresse/],
        [{ ...GUELTIG, ort: '' }, /ort/],
        ['kein json', /JSON/],
      ]) {
        const antwort = await schicke(s.port, koerper);
        assert.equal(antwort.status, 400, JSON.stringify(koerper));
        assert.match((await antwort.json()).grund, muster);
      }
    } finally { s.ende(); }
  });

test('ohne Konfiguration nimmt das Skript nichts an',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    // Der Zustand von heute: Die E-Mail-Adresse des Betreibers fehlt. Eine
    // Bestellung, die niemanden erreicht, ist schlechter als eine Absage.
    const s = await server({ konfiguriert: false });
    try {
      const antwort = await schicke(s.port, GUELTIG);
      assert.equal(antwort.status, 503);
      assert.match((await antwort.json()).grund, /noch nicht eingerichtet/);
    } finally { s.ende(); }
  });

test('GET wird abgewiesen', { skip: !vorhanden && 'php fehlt' }, async () => {
  const s = await server();
  try {
    const antwort = await fetch(`http://127.0.0.1:${s.port}/bestellung.php`);
    assert.equal(antwort.status, 405);
  } finally { s.ende(); }
});
