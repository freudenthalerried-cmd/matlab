/**
 * Die zweite Hälfte der dritten Redaktionsregel.
 *
 * **Befund vom 10. September 2026.** Die Regel lautet *„Normen nur mit Nummer
 * und Ausgabe"*. Gemessen wurde davon die Nummer — `NORM_OHNE_NUMMER` in
 * `inhaltspruefung.js` meldet „nach ÖNORM" ohne Ziffer. Die **Ausgabe** hat
 * nie jemand nachgeschlagen.
 *
 * > **Eine Regel, von der die Hälfte gemessen wird, ist zur Hälfte eine
 * > Zusage.**
 *
 * Der Bestand hielt sie: vier Normen, jede mit ihrer Ausgabe in Sichtweite.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  NORMBEZUG, AUSGABE, REIHE, NAHE, normstellenbefund,
} from '../src/normstelle.js';
import { nurText } from '../src/format.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

// `mindestens: 0` — diese Fälle prüfen die Regel, nicht den Umfang; die
// Untergrenze hat einen eigenen Testfall.
const befund = (text) => normstellenbefund([{ name: 'x', text }], 0);

test('eine Norm ohne Ausgabe ist ein Befund', () => {
  const b = befund('Nach ÖNORM B 3691 ist abzudichten.');
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'norm-ohne-ausgabe');
  assert.equal(b.meldungen[0].norm, 'ÖNORM B 3691');
});

test('die Ausgabe darf in Sichtweite stehen, nicht nur im selben Satz', () => {
  // Der Fall aus dem Bestand: Die Antwort in zwei Sätzen nennt die Norm, der
  // Abschnitt darunter zitiert sie vollständig.
  const text = 'Gefälle kommen aus der Planung — für den Regelfall nennt ÖNORM B 2501 aber '
    + `Untergrenzen.${'Zwischentext. '.repeat(14)}ÖNORM B 2501, Ausgabe 2009-09-01, Abschnitt 5.7.1 …`;
  assert.deepEqual(befund(text).meldungen, []);
});

test('die Ausgabe der Nachbarnorm deckt nicht mit', () => {
  // **Der Fund der Gegenprobe.** Die erste Fassung suchte die Ausgabe in
  // einem Zeichenfenster hinter der Nennung — und fand dort die Ausgabe der
  // anderen Norm, die vier Zeilen tiefer zitiert wird.
  const text = 'Für den Regelfall nennt ÖNORM B 5017 Untergrenzen. '
    + 'ÖNORM B 2501, Ausgabe 2009-09-01, Abschnitt 5.7.1 lässt Ausnahmen zu.';
  const b = befund(text);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].norm, 'ÖNORM B 5017');
});

test('die Ausgabe steht am Namen, nicht irgendwo', () => {
  assert.ok(NAHE >= 10 && NAHE <= 80, 'der Abstand am Namen bleibt eng');
});

test('eine Wiederholung verkürzt', () => {
  const text = 'ÖNORM B 2501, Ausgabe 2009-09-01 nennt Untergrenzen. '
    + 'Ebenfalls nach ÖNORM B 2501, Abschnitt 5.7.1 gilt …';
  assert.deepEqual(befund(text).meldungen, [], 'die zweite Nennung ist Zitiergepflogenheit');
});

test('eine Normenreihe hat keine Ausgabe', () => {
  assert.deepEqual(befund('ergänzt die europäischen Normen der Reihe EN 12056 um …').meldungen, []);
  assert.equal(REIHE.test('Normen der Reihe '), true);
});

test('eine Zulassungsleitlinie ist keine Norm', () => {
  // ETAG 004 trägt keine Ausgabe in diesem Sinn, und eine erfundene wäre
  // schlimmer als keine.
  const b = normstellenbefund([{ name: 'x', text: 'Prüfgrundlage ist ETAG 004 für WDVS.' }], 0);
  assert.deepEqual(b.meldungen, []);
  assert.equal(NORMBEZUG.test('ETAG 004'), false);
});

test('die Ausgabe wird in beiden Schreibweisen erkannt', () => {
  assert.equal(AUSGABE.test('Ausgabe 2009-09-01'), true);
  assert.equal(AUSGABE.test('Ausgabe 2009'), true);
  assert.equal(AUSGABE.test('ÖNORM B 2501:2009'), true);
  assert.equal(AUSGABE.test('Abschnitt 5.7.1'), false);
});

test('ein Lauf ohne Normen meldet, dass er nichts gemessen hat', () => {
  const b = normstellenbefund([{ name: 'x', text: 'kein Wort über Normen' }], 3);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-normen'));
});

test('jede Norm auf den gebauten Seiten nennt ihre Ausgabe', (t) => {
  if (!existsSync(SITE)) return t.skip('ohne Bau keine Aussage');
  const seiten = [];
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner)) {
      const pfad = join(ordner, e);
      if (statSync(pfad).isDirectory()) { gehe(pfad); continue; }
      if (e.endsWith('.html')) {
        seiten.push({ name: pfad.split('/site/')[1], text: nurText(readFileSync(pfad, 'utf8')) });
      }
    }
  };
  gehe(SITE);
  const b = normstellenbefund(seiten, 3);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.geprueft >= 3, `nur ${b.geprueft} Erstnennungen — der Bestand trägt mehr`);
});
