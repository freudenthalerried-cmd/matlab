/**
 * Die Entscheidungen der Kopfzeilenprobe — ohne Apache.
 *
 * **14. September 2026, abends.** Neun Regelstellen aus
 * `bin/kopfzeilenpruefung.mjs` standen als „nie gesehen" in der Zählung der
 * Regelnamen — mehr als aus jeder anderen Datei. Der naheliegende Grund war
 * falsch: Nicht die Regeln brauchen den Server, sondern die Messung.
 *
 * > **Was ein Prüfer misst und was er daraus schließt, sind zwei Dinge — und
 * > nur das erste braucht den Server.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SICHERHEITSKOPFZEILEN, NICHT_GESETZT, MINDESTZEICHEN, FEHLERSEITENSATZ,
  kopfzeilenbefund, fehlerseitenbefund, ohneModulbefund, htaccessText,
} from '../src/serverkopf.js';

const regeln = (b) => b.meldungen.map((m) => m.regel);
const alleDa = () => new Map(SICHERHEITSKOPFZEILEN.map((k) => [k.name, k.wert]));

test('Kommen alle geführten Kopfzeilen an, ist nichts zu melden', () => {
  assert.ok(SICHERHEITSKOPFZEILEN.length >= 3, `nur ${SICHERHEITSKOPFZEILEN.length} Kopfzeilen`);
  const b = kopfzeilenbefund({ status: 200, kopfzeilen: alleDa() });
  assert.deepEqual(b.meldungen, [], JSON.stringify(b.meldungen));
  assert.equal(b.geprueft, SICHERHEITSKOPFZEILEN.length);
});

test('Eine Startseite, die nicht mit 200 kommt', () => {
  const b = kopfzeilenbefund({ status: 500, kopfzeilen: alleDa() });
  assert.deepEqual(regeln(b), ['startseite-nicht-200'], JSON.stringify(b.meldungen));
});

test('Eine fehlende und eine abweichende Kopfzeile', () => {
  const ohne = alleDa();
  ohne.delete(SICHERHEITSKOPFZEILEN[0].name);
  assert.deepEqual(regeln(kopfzeilenbefund({ status: 200, kopfzeilen: ohne })), ['kopfzeile-fehlt']);

  const anders = alleDa();
  anders.set(SICHERHEITSKOPFZEILEN[0].name, 'etwas anderes');
  assert.deepEqual(regeln(kopfzeilenbefund({ status: 200, kopfzeilen: anders })), ['kopfzeile-weicht-ab']);
});

/*
 * HSTS ist ein Versprechen, das sich für die Dauer seiner `max-age` nicht
 * zurücknehmen lässt. Kommt es an, ohne dass es jemand entschieden hat, ist
 * das kein Schönheitsfehler, sondern eine unumkehrbare Zusage.
 */
test('Eine ausdrücklich nicht gesetzte Kopfzeile, die trotzdem ankommt', () => {
  assert.ok(NICHT_GESETZT.length >= 1, 'das Register der nicht gesetzten Kopfzeilen ist leer');
  const zuviel = alleDa();
  for (const n of NICHT_GESETZT) zuviel.set(n.name, 'max-age=31536000');
  const b = kopfzeilenbefund({ status: 200, kopfzeilen: zuviel });
  assert.deepEqual(regeln(b), NICHT_GESETZT.map(() => 'nicht-gesetzt-und-doch-da'),
    JSON.stringify(b.meldungen));
});

test('Eine einfache Tafel statt einer Headers-Tafel wird auch gelesen', () => {
  const tafel = Object.fromEntries(SICHERHEITSKOPFZEILEN.map((k) => [k.name, k.wert]));
  assert.deepEqual(kopfzeilenbefund({ status: 200, kopfzeilen: tafel }).meldungen, []);
});

test('Die Fehlerseite: falscher Code und fremde Seite zählen einzeln', () => {
  assert.deepEqual(fehlerseitenbefund(404, `… ${FEHLERSEITENSATZ} …`).meldungen, []);
  assert.deepEqual(regeln(fehlerseitenbefund(200, FEHLERSEITENSATZ)), ['fehlerseite-falscher-code']);
  assert.deepEqual(regeln(fehlerseitenbefund(404, 'Not Found')), ['fehlerseite-fremd']);
  assert.deepEqual(regeln(fehlerseitenbefund(500, 'Not Found')),
    ['fehlerseite-falscher-code', 'fehlerseite-fremd']);
});

/*
 * Am 11. September an einem laufenden Apache gemessen: Eine Direktive, deren
 * Modul fehlt, beantwortet Apache mit 500 für die ganze Seite — dieselbe
 * Zeile in einem `<IfModule>` mit 200.
 */
test('Ohne mod_headers: kaputt, leer, und die Messung selbst', () => {
  assert.deepEqual(ohneModulbefund({ status: 200, laenge: MINDESTZEICHEN + 1 }).meldungen, []);
  assert.deepEqual(regeln(ohneModulbefund({ status: 500, laenge: 0 })), ['ohne-modul-kaputt']);
  assert.deepEqual(regeln(ohneModulbefund({ status: 200, laenge: 10 })), ['ohne-modul-leer']);
  assert.deepEqual(regeln(ohneModulbefund({ status: 200, laenge: MINDESTZEICHEN + 1, kopfzeile: 'da' })),
    ['ohne-modul-und-doch-kopfzeile']);
});

test('Der Rahmen steht in der .htaccess und die Fehlerseite darin', () => {
  const text = htaccessText('fehler');
  assert.match(text, /<IfModule mod_headers\.c>/, 'ohne Rahmen legt ein fehlendes Modul die Seite lahm');
  assert.match(text, /ErrorDocument 404 \/fehler\.html/);
  assert.ok(SICHERHEITSKOPFZEILEN.length >= 3, `nur ${SICHERHEITSKOPFZEILEN.length} Kopfzeilen`);
  for (const k of SICHERHEITSKOPFZEILEN) {
    assert.ok(text.includes(k.name), `${k.name} steht nicht in der .htaccess`);
  }
});
