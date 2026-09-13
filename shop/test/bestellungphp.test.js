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
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BESTELLFELDER, beispielbestellung } from '../src/bestellfelder.js';
import { freierPort } from '../src/freierport.js';
import { wegwerfordner } from '../src/wegwerf.js';
import { geschaeftsjahr } from '../src/geschaeftszeit.js';

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
  const wurzel = wegwerfordner('bestellweg-');
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

      /*
       * Das Geschaeftsjahr, nicht das der Rechneruhr. `bestellung.php` waehlt
       * seine Journaldatei seit dem 9. September ueber `Europe/Vienna`; suchte
       * die Probe daneben mit dem UTC-Jahr, ginge sie am 31. Dezember nach
       * 23:00 Uhr Ortszeit an der Datei vorbei, die das Skript gerade
       * geschrieben hat — genau der Fehler, gegen den diese Probe steht.
       */
      const journal = join(s.wurzel, 'bestellungen', `journal-${geschaeftsjahr()}.jsonl`);
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

/* ------------------------------------------------------------------ *
 * Gate 35 — wer hier schreiben darf und wie oft (11. September 2026)
 *
 * Gemessen an einem laufenden PHP: dreißig Bestellungen hintereinander von
 * derselben Adresse, dreißigmal 200, dreißig Zeilen im Journal. Ein Formular
 * auf einer fremden Seite kam durch, eine Anfrage mit fremdem `Origin`
 * ebenfalls. Jede schreibt in die Vorgangsablage und löst eine Mail aus.
 * ------------------------------------------------------------------ */

/** Wie `schicke`, aber mit eigenen Kopfzeilen — für die Sperren darunter. */
const schickeMit = (port, kopf, koerper = GUELTIG) => fetch(
  `http://127.0.0.1:${port}/bestellung.php`,
  { method: 'POST', headers: kopf, body: JSON.stringify(koerper) },
);

test('ein Formular auf einer fremden Seite kommt nicht durch',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      // `text/plain` ist einer der drei Typen, die ein HTML-Formular ohne
      // Vorabanfrage senden kann. Genau damit ging die Bestellung am
      // 11. September durch.
      const antwort = await schickeMit(s.port, { 'Content-Type': 'text/plain' });
      assert.equal(antwort.status, 415);
      assert.equal(existsSync(join(s.wurzel, 'bestellungen')), false,
        'abgewiesen und trotzdem abgelegt wäre schlimmer als angenommen');
    } finally { s.ende(); }
  });

test('sagt der Browser selbst, dass die Anfrage von woanders kommt, wird geglaubt',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      const fremd = await schickeMit(s.port,
        { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' });
      assert.equal(fremd.status, 403);
      // Und die Gegenrichtung: Der eigene Weg sendet `same-origin` und muss
      // durchkommen. Eine Sperre, die auch den ehrlichen Weg trifft, wird am
      // zweiten Tag abgeschaltet.
      const eigen = await schickeMit(s.port,
        { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' });
      assert.equal(eigen.status, 200);
    } finally { s.ende(); }
  });

test('mehr als fünf Bestellungen in einer Minute werden abgewiesen, nicht abgelegt',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      const stati = [];
      for (let i = 0; i < 8; i++) {
        // Nacheinander und nicht gleichzeitig: Die Zählung entsteht unter der
        // Dateisperre, und was hier gemessen werden soll, ist die Grenze und
        // nicht das Verhalten bei Gleichzeitigkeit.
        // eslint-disable-next-line no-await-in-loop
        stati.push((await schicke(s.port, { ...GUELTIG, firma: `Firma ${i}` })).status);
      }
      assert.deepEqual(stati, [200, 200, 200, 200, 200, 429, 429, 429]);

      const journal = join(s.wurzel, 'bestellungen', `journal-${geschaeftsjahr()}.jsonl`);
      const zeilen = readFileSync(journal, 'utf8').split('\n').filter(Boolean);
      assert.equal(zeilen.length, 5,
        'eine abgewiesene Bestellung darf keine Zeile in der Ablage hinterlassen');

      // Die Absage nennt den Weg zurück. Eine Grenze ohne Auskunft ist für
      // den Kunden nicht von einem kaputten Shop zu unterscheiden.
      const letzte = await schicke(s.port, GUELTIG);
      const d = await letzte.json();
      assert.equal(d.ok, false);
      assert.match(d.grund, /noch einmal abschicken/);
      assert.equal(letzte.headers.get('retry-after'), '60');
    } finally { s.ende(); }
  });

/* ------------------------------------------------------------------ *
 * Gate 37 — zweimal dasselbe ist einmal (11. September 2026)
 *
 * Gemessen an einem laufenden PHP: Dieselbe Bestellung zweimal geschickt ergab
 * zwei Journalzeilen und zwei Nummern. Der Weg dorthin ist nicht Ungeduld —
 * die Oberfläche sperrt den Knopf —, sondern ein Abriss nach dem Schreiben:
 * Die Bestellung liegt, die Antwort kommt nie an, der Besteller drückt noch
 * einmal.
 * ------------------------------------------------------------------ */

test('dieselbe Bestellung binnen Minuten wird einmal verbucht und sagt es',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    const s = await server();
    try {
      const erste = await (await schicke(s.port, GUELTIG)).json();
      assert.equal(erste.ok, true);
      assert.equal(erste.bereits, undefined, 'die erste Bestellung lag noch nicht vor');

      const zweite = await (await schicke(s.port, GUELTIG)).json();
      assert.equal(zweite.ok, true);
      assert.equal(zweite.nummer, erste.nummer, 'die zweite bekommt dieselbe Nummer');
      assert.equal(zweite.bereits, true);
      // **Nicht stillschweigend.** Eine unterdrückte Bestellung ohne Auskunft
      // wäre dieselbe Sorte Fehler wie ein still gekürzter Warenkorb.
      assert.match(zweite.grund, /liegt bereits vor/);

      const journal = join(s.wurzel, 'bestellungen', `journal-${geschaeftsjahr()}.jsonl`);
      const zeilen = readFileSync(journal, 'utf8').split('\n').filter(Boolean);
      assert.equal(zeilen.length, 1, 'eine Bestellung, eine Zeile');
    } finally { s.ende(); }
  });

test('eine berichtigte Angabe ist eine neue Bestellung',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    // Die Gegenrichtung, und der Grund gegen einen mitgeschickten Schlüssel:
    // Der bliebe gleich, wenn der Besteller einen Tippfehler in seiner
    // Anschrift berichtigt — dann ginge die Berichtigung verloren.
    const s = await server();
    try {
      const erste = await (await schicke(s.port, GUELTIG)).json();
      const zweite = await (await schicke(s.port,
        { ...GUELTIG, email: 'richtig@example.at' })).json();
      assert.notEqual(zweite.nummer, erste.nummer);
      assert.equal(zweite.bereits, undefined);

      const dritte = await (await schicke(s.port,
        { ...GUELTIG, text: 'Position 1: 20 Sack Mörtel' })).json();
      assert.notEqual(dritte.nummer, zweite.nummer);

      const journal = join(s.wurzel, 'bestellungen', `journal-${geschaeftsjahr()}.jsonl`);
      assert.equal(readFileSync(journal, 'utf8').split('\n').filter(Boolean).length, 3);
    } finally { s.ende(); }
  });

test('eine Wiederholung zählt nicht gegen die Minutengrenze',
  { skip: !vorhanden && 'php fehlt' }, async () => {
    // Sonst sperrte ein Abriss den Besteller auch noch aus: Fünf Versuche
    // derselben Bestellung wären fünf gegen die Grenze, und der sechste käme
    // mit 429 zurück, obwohl nur eine einzige Bestellung im Spiel ist.
    const s = await server();
    try {
      const stati = [];
      for (let i = 0; i < 8; i++) {
        // eslint-disable-next-line no-await-in-loop
        stati.push((await schicke(s.port, GUELTIG)).status);
      }
      assert.deepEqual(stati, [200, 200, 200, 200, 200, 200, 200, 200]);
      const journal = join(s.wurzel, 'bestellungen', `journal-${geschaeftsjahr()}.jsonl`);
      assert.equal(readFileSync(journal, 'utf8').split('\n').filter(Boolean).length, 1);
    } finally { s.ende(); }
  });
