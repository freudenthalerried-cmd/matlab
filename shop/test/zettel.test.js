/**
 * Der Zettel für den Auftraggeber.
 *
 * **Der Anlass, 10. September 2026.** 25 offene Punkte, kein einziger bei mir;
 * sieben davon kosten nichts und verteilen sich über vier Werkzeugausgaben.
 * *Eine Zulieferung, die man sich zusammensuchen muss, wird nicht geliefert.*
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ZULIEFERUNGEN, ZIELDATEI, formangaben, geliefert, zettelbefund,
} from '../src/zettel.js';
import { pruefeBetreiberform, FORMREGELN } from '../src/betreiberform.js';

const betreiber = JSON.parse(readFileSync(
  new URL('../data/betreiber.json', import.meta.url), 'utf8'));

test('Jede Zeile des Zettels nennt Feld, Grundlage und Wofür', () => {
  assert.ok(ZULIEFERUNGEN.length >= 7, `nur ${ZULIEFERUNGEN.length} Zeilen`);
  for (const z of ZULIEFERUNGEN) {
    assert.ok(z.feld, 'ohne Feld wüsste niemand, wohin');
    assert.ok(z.bezeichnung);
    assert.ok(z.rechtsgrund, `${z.feld}: auch „keine Vorschrift" ist eine Auskunft`);
    assert.ok(z.loest.length >= 40, `${z.feld}: ohne Wofür ist die Zeile eine Bitte`);
  }
});

test('Form und Beispiel kommen aus dem Register, das sie prüft', () => {
  // Zweimal geschrieben hieße: einmal gepflegt.
  assert.ok(ZULIEFERUNGEN.length >= 7,
    `nur ${ZULIEFERUNGEN.length} Zeilen — eine leere Liste prüft nichts`);
  for (const z of ZULIEFERUNGEN) {
    const f = formangaben(z.feld);
    assert.ok(f, `${z.feld} hat keine Formregel — wer liefert, müsste raten`);
    assert.ok(f.beispiel, `${z.feld} ohne Beispiel`);
  }
});

test('Geliefert heißt nicht leer — auch die Null zählt nicht als Antwort', () => {
  assert.equal(geliefert(''), false);
  assert.equal(geliefert('   '), false);
  assert.equal(geliefert(null), false);
  assert.equal(geliefert(undefined), false);
  assert.equal(geliefert('x'), true);
  assert.equal(geliefert(2), true);
  assert.equal(geliefert(0), true, 'eine eingetragene Null ist eine Antwort, wenn auch eine falsche');
  assert.equal(geliefert(Number.NaN), false);
});

test('Ein ausgefülltes Feld gehört vom Zettel herunter', () => {
  const b = zettelbefund({ ...betreiber, email: 'office@bauversand.com' }, []);
  assert.ok(b.meldungen.some((m) => m.regel === 'schon-geliefert'),
    'ein Zettel, der nach Ausgefülltem fragt, wird nicht ernst genommen');
});

test('Ein leeres Feld ohne Zeile fällt auf — die andere Richtung', () => {
  const b = zettelbefund(betreiber, ['ein-feld-ohne-zeile']);
  assert.ok(b.meldungen.some((m) => m.regel === 'fehlt-auf-dem-zettel'));
});

test('Der echte Zettel deckt sich mit der Betreiberdatei', () => {
  const leer = ZULIEFERUNGEN.map((z) => z.feld).filter((f) => !geliefert(betreiber[f]));
  const b = zettelbefund(betreiber, leer);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
});

test('Die Antwortzeit wird auch als Zahl geprüft', () => {
  /*
   * **Der Fund vom 10. September.** `pruefeBetreiberform` übersprang jeden
   * Wert, der keine Zeichenkette war — und dieses Feld trägt eine Zahl. 2, 0
   * und 99 gingen alle durch, während „0" in Anführungszeichen gemeldet wurde.
   * *Eine Prüfung, die nur für einen Typ greift, ist für den anderen keine.*
   */
  const basis = {
    email: 'a@b.at', telefon: '+43 1 2', uid: 'ATU12345675',
    firmenbuchnummer: 'FN 347938z', plz: '4312', gewerbewortlaut: 'Handel mit Waren aller Art',
  };
  const mangel = (wert) => pruefeBetreiberform({ ...basis, antwortzeitWerktage: wert })
    .maengel.filter((m) => m.feld === 'antwortzeitWerktage').length;
  assert.equal(mangel(2), 0);
  assert.equal(mangel('2'), 0);
  assert.equal(mangel(10), 0);
  assert.equal(mangel(0), 1, 'null Werktage ist keine Zusage, sondern derselbe Augenblick');
  assert.equal(mangel(99), 1, 'mehr als zehn ist ein Ausbleiben mit Datum');
  assert.equal(mangel(11), 1);
  assert.equal(mangel(2.5), 1, 'halbe Werktage stehen auf keiner Kundenseite');
});

test('Ein leeres Feld bleibt ein offener Punkt, kein Formfehler', () => {
  const b = pruefeBetreiberform({ email: '', antwortzeitWerktage: null });
  assert.deepEqual(b.maengel, []);
  assert.equal(b.geprueft, 0);
});

test('Der Gewerbewortlaut ist mehr als ein Wort', () => {
  const wort = (w) => pruefeBetreiberform({ gewerbewortlaut: w })
    .maengel.filter((m) => m.feld === 'gewerbewortlaut').length;
  assert.equal(wort('Handel mit Waren aller Art'), 0);
  assert.equal(wort('Bau'), 1, 'ein einzelnes Wort ist kein Wortlaut');
  assert.equal(wort('TODO'), 1, 'ein Platzhalter, der online geht, ist eine falsche Angabe');
  assert.equal(wort('Gewerbe'), 1);
});

test('Der Zettel zeigt auf die Datei, in die eingetragen wird', () => {
  assert.match(ZIELDATEI, /betreiber\.json$/);
  assert.ok(FORMREGELN.length >= 7, `nur ${FORMREGELN.length} Formregeln`);
});
