/**
 * Der Vermerk — die Aufzeichnung, wo kein Papier entsteht.
 *
 * **13. September 2026.** `ARTEN` führt `vermerk` seit dem 4. September, vier
 * Werkzeuge nehmen Rücksicht auf ihn — und geschrieben hat nie eines einen.
 * Alles, was in der Welt geschieht und kein Papier erzeugt, war in dieser
 * Akte nicht aufzeichenbar (§ 131 Abs 1 Z 5 BAO).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { wegwerfordner } from '../src/wegwerf.js';
import { belegordner } from '../src/ablageort.js';
import { geschaeftsjahr } from '../src/geschaeftszeit.js';

const werkzeug = fileURLToPath(new URL('../bin/vermerk.mjs', import.meta.url));

const lauf = (args, umgebung = {}) => {
  try {
    return {
      code: 0,
      aus: execFileSync(process.execPath, [werkzeug, ...args],
        { encoding: 'utf8', env: { ...process.env, ...umgebung } }),
    };
  } catch (e) {
    return { code: e.status ?? 1, aus: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

/** Eine Akte mit genau einem Angebot — der Geschäftsfall, zu dem vermerkt wird. */
function akteMitVorgang(jahr) {
  const akte = wegwerfordner('vermerk-');
  const eintrag = {
    lfd: 1,
    art: 'angebot',
    nummer: `AN-${jahr}-0110`,
    zeitpunkt: `${jahr}-09-12T09:00:00+02:00`,
    vorgang: `${jahr}-0110`,
    betragNetto: 500,
    betragBrutto: 600,
    text: 'Angebot',
    bezugAuf: null,
  };
  writeFileSync(join(akte, `journal-${jahr}.jsonl`),
    `${JSON.stringify({ typ: 'eintrag', eintrag })}\n`);
  return akte;
}

/*
 * **Dasselbe Jahr, das auch das Werkzeug nimmt.** Hier stand
 * `new Date().getFullYear()` — ein roher Blick auf die Uhr, und
 * `npm run pruefe-zeit` hat ihn sofort gemeldet: Am 1. Jänner um 00:30 Uhr
 * sagt die Rechneruhr in UTC noch das alte Jahr, `geschaeftsjahr()` schon das
 * neue. Ein Testfall, der das Journal eines anderen Jahres sucht als das
 * Werkzeug, schlägt genau dann fehl, wenn niemand hinsieht.
 */
const JAHR = geschaeftsjahr();
const zeilen = (akte) => readFileSync(join(akte, `journal-${JAHR}.jsonl`), 'utf8')
  .split('\n').filter(Boolean).map((z) => JSON.parse(z));

test('ein Vermerk kommt als Zeile in die Akte — ohne Nummer und ohne Blatt', () => {
  const akte = akteMitVorgang(JAHR);
  const e = lauf(['--vorgang', `${JAHR}-0110`, '--text', 'Kunde hat telefonisch verschoben'],
    { VORGANG_ABLAGE: akte });
  assert.equal(e.code, 0, e.aus);

  const letzte = zeilen(akte).at(-1).eintrag;
  assert.equal(letzte.art, 'vermerk');
  assert.equal(letzte.vorgang, `${JAHR}-0110`);
  assert.equal(letzte.nummer, null, 'ein Vermerk zieht keine Belegnummer');
  assert.equal(letzte.text, 'Kunde hat telefonisch verschoben');
  assert.equal(letzte.betragNetto, null);

  // **Keine Durchschrift.** `ARTEN.vermerk` trägt `beleg: false`: Wer eine
  // anlegte, legte eine Abschrift von etwas ab, das nie ein Blatt war.
  const ordner = join(akte, belegordner(JAHR));
  assert.equal(existsSync(ordner) && readdirSync(ordner).length > 0, false,
    'zum Vermerk ist eine Durchschrift angelegt worden');
});

test('ein Vermerk zu einem Vorgang, den die Akte nicht kennt, wird abgewiesen', () => {
  /*
   * Ein Vertipper in der Vorgangsnummer erzeugte sonst eine Aufzeichnung, die
   * niemand je wiederfindet — und § 131 Abs 1 Z 5 BAO verlangt die
   * Rückführbarkeit zum Geschäftsfall, nicht eine Zeile mit einer Nummer.
   */
  const akte = akteMitVorgang(JAHR);
  const e = lauf(['--vorgang', `${JAHR}-9999`, '--text', 'Notiz'], { VORGANG_ABLAGE: akte });
  assert.notEqual(e.code, 0, `zu einem unbekannten Vorgang vermerkt:\n${e.aus}`);
  assert.match(e.aus, /steht nichts in /);
  assert.equal(zeilen(akte).length, 1, 'abgewiesen und trotzdem geschrieben');
});

test('ein zu langer Vermerk wird abgewiesen und nicht gekürzt', () => {
  /*
   * `alsCsv` schneidet das Textfeld bei 200 Zeichen ab. Für einen Beleg ist
   * das harmlos — dort steht ein Betreff, und das Papier daneben trägt den
   * Inhalt. **Beim Vermerk ist der Text die Aufzeichnung selbst** und würde
   * auf dem Weg zum Steuerberater lautlos gekürzt.
   */
  const akte = akteMitVorgang(JAHR);
  const e = lauf(['--vorgang', `${JAHR}-0110`, '--text', 'x'.repeat(201)],
    { VORGANG_ABLAGE: akte });
  assert.notEqual(e.code, 0, `ein Vermerk über der Grenze ist durchgegangen:\n${e.aus}`);
  assert.match(e.aus, /201 Zeichen lang/);
  assert.equal(zeilen(akte).length, 1, 'abgewiesen und trotzdem geschrieben');

  // Genau an der Grenze geht er durch.
  const knapp = lauf(['--vorgang', `${JAHR}-0110`, '--text', 'y'.repeat(200)],
    { VORGANG_ABLAGE: akte });
  assert.equal(knapp.code, 0, knapp.aus);
});

test('ohne Vorgang oder ohne Text sagt das Werkzeug, was es braucht', () => {
  const akte = akteMitVorgang(JAHR);
  const ohneText = lauf(['--vorgang', `${JAHR}-0110`], { VORGANG_ABLAGE: akte });
  assert.equal(ohneText.code, 2, ohneText.aus);
  assert.match(ohneText.aus, /Beides ist Pflicht/);

  const ohneVorgang = lauf(['--text', 'Notiz'], { VORGANG_ABLAGE: akte });
  assert.equal(ohneVorgang.code, 2, ohneVorgang.aus);
  assert.equal(zeilen(akte).length, 1);
});
