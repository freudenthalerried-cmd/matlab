import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { kundendatei, leseJournal, posteingangsbefund } from '../src/posteingang.js';
import { BESTELLFELDER, beispielbestellung } from '../src/bestellfelder.js';
import { pruefeBestelldaten } from '../src/kunde.js';
import { wegwerfordner } from '../src/wegwerf.js';

const werkzeug = fileURLToPath(new URL('../bin/posteingang.mjs', import.meta.url));
const TEXT = 'Anfrage vom 4.9.2026\nPosition 1: 40 m2 POS-12569\n'
  + 'Warenwert netto 500,00 EUR\nGesamtbetrag brutto 700,00 EUR';

const VOLL = {
  nummer: 'B-2026-0001', zeitpunkt: '2026-09-04T16:40:00+00:00',
  bezirk: 'Perg', text: TEXT, ...beispielbestellung(),
};
const HALB = { nummer: 'B-2026-0002', bezirk: 'Perg', text: TEXT, firma: 'Halb GmbH' };

test('ein Journal wird zeilenweise gelesen, Fehler mit Zeilennummer', () => {
  const { zeilen, meldungen } = leseJournal(`${JSON.stringify(VOLL)}\nkein json\n\n{"a":1}\n`);
  assert.equal(zeilen.length, 1);
  assert.equal(zeilen[0].zeile, 1);
  assert.equal(meldungen.length, 2);
  assert.match(meldungen[0].text, /Zeile 2/);
  assert.equal(meldungen[1].regel, 'ohne-nummer');
});

test('eine doppelte Belegnummer ist ein Befund', () => {
  // Das Empfangsskript vergibt sie unter Sperre. Stehen zwei gleiche da, ist
  // entweder zweimal angehängt worden oder jemand hat die Datei bearbeitet.
  const { meldungen } = leseJournal(`${JSON.stringify(VOLL)}\n${JSON.stringify(VOLL)}\n`);
  assert.ok(meldungen.some((m) => m.regel === 'nummer-doppelt'), JSON.stringify(meldungen));
});

test('der Befund trennt angebotsreif von unvollständig', () => {
  const b = posteingangsbefund([VOLL, HALB], pruefeBestelldaten);
  assert.equal(b.length, 2);
  assert.equal(b[0].bereit, true, b[0].hindernisse.join('; '));
  assert.equal(b[1].bereit, false);
  // Die Hindernisse kommen aus derselben Prüfung, die `npm run vorgang`
  // anwendet — nicht aus einer nachgebauten.
  assert.ok(b[1].hindernisse.some((h) => /UID/.test(h)), b[1].hindernisse.join('; '));
});

test('ein Eintrag ohne Anfragetext ist nicht bereit, auch mit vollen Kundendaten', () => {
  const ohneText = { ...VOLL, text: '   ' };
  const b = posteingangsbefund([ohneText], pruefeBestelldaten);
  assert.equal(b[0].bereit, false);
  assert.ok(b[0].hindernisse.includes('kein Anfragetext'));
});

test('die Kundendatei trägt die Formularfelder und sonst nichts', () => {
  const d = kundendatei(VOLL, BESTELLFELDER);
  assert.ok(BESTELLFELDER.length >= 8, 'zu wenige Felder — die Schleife prüfte kaum etwas');
  for (const f of BESTELLFELDER) assert.ok(f.name in d, `${f.name} fehlt in der Kundendatei`);
  // Nummer, Zeitpunkt und Anfragetext stehen im Journal und im Anfragetext.
  // Ein zweiter Ort für dieselbe Angabe altert.
  for (const fremd of ['nummer', 'zeitpunkt', 'text', 'bezirk']) {
    assert.ok(!(fremd in d), `${fremd} gehört nicht in die Kundendatei`);
  }
  assert.equal(d.land, 'AT', 'das Land ist eine Folgerung, keine Eingabe — es muss dastehen');
  assert.equal(pruefeBestelldaten(d).gueltig, true, 'aus der Kundendatei wird kein Beleg');
});

/* ------------------------------------------------------------------ *
 * Das Werkzeug am ganzen Weg
 * ------------------------------------------------------------------ */

const lauf = (args) => {
  try {
    return { code: 0, aus: execFileSync(process.execPath, [werkzeug, ...args], { encoding: 'utf8' }) };
  } catch (e) { return { code: e.status ?? 1, aus: `${e.stdout ?? ''}${e.stderr ?? ''}` }; }
};

test('das Werkzeug schneidet die zwei Dateien heraus, die npm run vorgang liest', () => {
  const ordner = wegwerfordner('posteingang-');
  const journal = join(ordner, 'journal-2026.jsonl');
  writeFileSync(journal, `${JSON.stringify(VOLL)}\n${JSON.stringify(HALB)}\n`);
  const ziel = join(ordner, 'vorgang');

  const e = lauf(['--journal', journal, '--nummer', 'B-2026-0001', '--nach', ziel]);
  assert.equal(e.code, 0, e.aus);
  assert.equal(readFileSync(join(ziel, 'anfrage.txt'), 'utf8').trim(), TEXT);
  const kunde = JSON.parse(readFileSync(join(ziel, 'kunde.json'), 'utf8'));
  assert.equal(pruefeBestelldaten(kunde).gueltig, true);
  // Der nächste Befehl steht dabei — sonst hört der Weg hier wieder auf.
  assert.match(e.aus, /npm run vorgang/);
});

test('eine unvollständige Bestellung wird nicht herausgeschnitten', () => {
  const ordner = wegwerfordner('posteingang-');
  const journal = join(ordner, 'journal-2026.jsonl');
  writeFileSync(journal, `${JSON.stringify(HALB)}\n`);
  const ziel = join(ordner, 'vorgang');

  const e = lauf(['--journal', journal, '--nummer', 'B-2026-0002', '--nach', ziel]);
  assert.notEqual(e.code, 0);
  assert.match(e.aus, /wird kein Angebot/);
  assert.equal(existsSync(ziel), false, 'abgewiesen und trotzdem geschrieben');
});

test('in das Verzeichnis selbst wird nicht geschrieben', () => {
  // Dieselbe Regel wie bei der Ablage: Was Namen und Anschriften trägt,
  // gehört nicht in ein öffentliches Repository.
  const ordner = wegwerfordner('posteingang-');
  const journal = join(ordner, 'journal-2026.jsonl');
  writeFileSync(journal, `${JSON.stringify(VOLL)}\n`);
  const drinnen = fileURLToPath(new URL('../ausgabe/nicht-hierher', import.meta.url));

  const e = lauf(['--journal', journal, '--nummer', 'B-2026-0001', '--nach', drinnen]);
  assert.equal(e.code, 2, e.aus);
  assert.match(e.aus, /liegt im Verzeichnis/);
  assert.equal(existsSync(drinnen), false);
});
