/**
 * Anker der Gegenproben: Suchtext und Suchmuster.
 *
 * **Warum es das Muster gibt.** Der Anker der Probe zum Kopf des
 * Gate-Registers saß auf dem Zahlwort, das sich mit jedem neuen Gate ändert,
 * und ist dreimal nachgezogen worden (31 → 32 → 33). *Ein Anker auf einer
 * Zahl, die sich ändert, ist ein Anker auf Sand.*
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEGENPROBEN, fundstellen, mutiere, ankerbeschreibung, MUSTER_HOECHSTLAENGE,
  suchtextbefund, registerbefund,
} from '../src/gegenprobenregister.js';

test('Ein Suchtext findet jede seiner Stellen, ohne sich zu überlappen', () => {
  const stellen = fundstellen('aXbXc', { suchen: 'X' });
  assert.deepEqual(stellen, [{ index: 1, laenge: 1 }, { index: 3, laenge: 1 }]);
  // Überlappende Treffer wären doppelt gezählt und die Mutation kaputt.
  assert.equal(fundstellen('aaaa', { suchen: 'aa' }).length, 2);
  assert.deepEqual(fundstellen('abc', { suchen: 'X' }), []);
  assert.deepEqual(fundstellen('abc', { suchen: '' }), []);
});

test('Ein Suchmuster findet, was der Suchtext nicht kann', () => {
  const probe = { suchenMuster: /Gate-Fragen\.\*\* \S+/ };
  const text = '**Maßgeblich für alle Gate-Fragen.** Dreiunddreißig Entscheidungen';
  const stellen = fundstellen(text, probe);
  assert.equal(stellen.length, 1);
  assert.equal(text.slice(stellen[0].index, stellen[0].index + stellen[0].laenge),
    'Gate-Fragen.** Dreiunddreißig');
});

test('\\w hätte am „ß" aufgehört — deshalb \\S', () => {
  // Der erste Anlauf am 10. September: `\w+` traf „Dreiunddrei", ließ „ßig"
  // stehen und erzeugte „Vierundzwanzigßig". Der Prüfer meldete rot, aber aus
  // einem anderen Grund als dem gemeinten. Dieselbe Falle wie bei `\b` und
  // „ÖNORM".
  const text = 'Kopf: Dreiunddreißig Gates';
  assert.equal(fundstellen(text, { suchenMuster: /Kopf: \w+/ })[0].laenge, 'Kopf: Dreiunddrei'.length);
  assert.equal(fundstellen(text, { suchenMuster: /Kopf: \S+/ })[0].laenge, 'Kopf: Dreiunddreißig'.length);
});

test('Ein Muster ohne g-Flag findet trotzdem alle Stellen', () => {
  assert.equal(fundstellen('a1b2c3', { suchenMuster: /\d/ }).length, 3);
  assert.equal(fundstellen('a1b2c3', { suchenMuster: /\d/g }).length, 3);
});

test('Ein Muster, das die leere Zeichenkette trifft, bleibt nicht stehen', () => {
  // Ohne den Vorschub liefe die Schleife ewig — eine Probe, die den Lauf
  // aufhängt, wäre schlimmer als eine, die nichts findet.
  assert.equal(fundstellen('abc', { suchenMuster: /x?/ }).length, 4);
});

test('Mutiert wird die erste Stelle — mit `alle` jede', () => {
  assert.equal(mutiere('aXbXc', { suchen: 'X', ersetzen: 'Y' }), 'aYbXc');
  assert.equal(mutiere('aXbXc', { suchen: 'X', ersetzen: 'Y', alle: true }), 'aYbYc');
  assert.equal(mutiere('a1b2', { suchenMuster: /\d/, ersetzen: 'Z' }), 'aZb2');
  assert.equal(mutiere('a1b2', { suchenMuster: /\d/, ersetzen: 'Z', alle: true }), 'aZbZ');
});

test('Ein Ersetzungstext mit $& wird nicht gedeutet, sondern eingesetzt', () => {
  /*
   * `String.replace` deutet `$&`, ``$` ``, `$'` und `$1` in seinem
   * Ersetzungstext als Anweisungen. Kein Eintrag des Registers nutzt heute eine
   * davon — der Erste, der es täte, bekäme eine Mutation, die woanders landet
   * als im Register steht, und ein daraufhin grün meldender Prüfer sähe aus wie
   * einer, der nicht anschlägt. Über Stellen ersetzt gibt es die Falle nicht.
   */
  assert.equal(mutiere('abc', { suchen: 'b', ersetzen: '$&' }), 'a$&c');
  assert.equal(mutiere('abc', { suchen: 'b', ersetzen: "$'" }), "a$'c");
  assert.equal(mutiere('abc', { suchenMuster: /b/, ersetzen: '$1' }), 'a$1c');
  assert.equal('abc'.replace('b', '$&'), 'abc', 'so verhielte sich replace — deshalb nicht replace');
});

test('Der Anker steht in Meldungen so da, wie er im Register steht', () => {
  assert.match(ankerbeschreibung({ suchen: 'ein Text' }), /^Suchtext "ein Text"$/);
  assert.match(ankerbeschreibung({ suchenMuster: /ein Muster/ }), /^Suchmuster \/ein Muster\/$/);
});

test('Ein Muster, das zu weit greift, ist ein Befund', () => {
  const lang = 'A'.repeat(MUSTER_HOECHSTLAENGE + 10);
  const b = suchtextbefund({
    proben: [{
      id: 'weit', art: 'ersetzen', datei: 'x.js',
      suchenMuster: /A+/, ersetzen: 'B', warum: 'x'.repeat(40),
    }],
    lies: () => lang,
  });
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'muster-greift-zu-weit');
});

test('Ein Muster knapp unter der Grenze ist keiner', () => {
  const b = suchtextbefund({
    proben: [{
      id: 'knapp', art: 'ersetzen', datei: 'x.js',
      suchenMuster: /A+/, ersetzen: 'B', warum: 'x'.repeat(40),
    }],
    lies: () => 'A'.repeat(MUSTER_HOECHSTLAENGE),
  });
  assert.deepEqual(b.meldungen, []);
});

test('Genau ein Anker je Probe — keiner und beide sind ein Fehler', () => {
  const grund = 'x'.repeat(40);
  const eintrag = (zusatz) => [{ id: 'p', pruefer: 'a', art: 'ersetzen', datei: 'x.js',
    ersetzen: 'B', warum: grund, ...zusatz }];
  assert.throws(() => registerbefund([], eintrag({}), []), /genau einen Anker/);
  assert.throws(() => registerbefund([], eintrag({ suchen: 'a', suchenMuster: /a/ }), []),
    /genau einen Anker/);
  assert.throws(() => registerbefund([], eintrag({ suchenMuster: 'kein Muster' }), []),
    /kein regulärer Ausdruck/);
  assert.doesNotThrow(() => registerbefund([], eintrag({ suchen: 'a' }), []));
  assert.doesNotThrow(() => registerbefund([], eintrag({ suchenMuster: /a/ }), []));
});

test('Die Anker des echten Registers sind entweder Text oder Muster', () => {
  const ersetzend = GEGENPROBEN.filter((p) => p.art === 'ersetzen');
  assert.ok(ersetzend.length >= 100, `nur ${ersetzend.length} ersetzende Proben`);
  const mitMuster = ersetzend.filter((p) => p.suchenMuster);
  // Die drei, die auf einer Zahl sitzen, die sich mit dem Bestand ändert.
  assert.ok(mitMuster.length >= 3, `nur ${mitMuster.length} Proben mit Muster`);
  for (const p of ersetzend) {
    const anker = [p.suchen, p.suchenMuster].filter((a) => a !== undefined);
    assert.equal(anker.length, 1, `${p.id}: ${anker.length} Anker`);
  }
});
