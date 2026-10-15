/**
 * **Ein Keyword, das die eigene Landeseite verneint — 6. September 2026.**
 *
 * `kampagne.mjs` bot in der Gruppe „Dämmung" auf „Fassadendämmung EPS", bis zu
 * 5,91 € je Klick, während die Landeseite im zweiten Satz sagt: *„Die
 * Fassadendämmplatte in Flächenstärke führen wir nicht."* Die vorhandene
 * Deckungsprüfung ließ es durch, weil sie fragt, **ob** das Wort auf der Seite
 * steht, und nicht, **in welchem Satz**.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ABGRENZUNGSMUSTER, STAMMLAENGE, abgegrenzteStaemme, abgegrenztesKeyword, saetze, stamm,
} from '../src/abgrenzung.js';
import { hauptbereichText, ungedeckteWoerter } from '../bin/kampagne.mjs';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SEITE = join(SHOP, 'ausgabe', 'site', 'gruppe', 'daemmung.html');

test('ein Abgrenzungssatz liefert die Stämme dessen, was nicht geführt wird', () => {
  const t = 'Wir liefern XPS in mehreren Stärken. Die Fassadendämmplatte in Flächenstärke führen wir nicht.';
  const s = abgegrenzteStaemme(t).map((x) => x.wort);
  assert.ok(s.includes('Fassadendämmplatte'), `gefunden: ${s.join(', ')}`);
});

test('ein Satz ohne Abgrenzung liefert nichts', () => {
  assert.deepEqual(abgegrenzteStaemme('Wir führen XPS von 30 bis 100 mm für den Sockelbereich.'), []);
});

test('das Keyword wird am Stamm erkannt, auch im Kompositum', () => {
  const t = 'Die Fassadendämmplatte in Flächenstärke führen wir nicht.';
  assert.equal(abgegrenztesKeyword('Fassadendämmung EPS', t).wort, 'Fassadendämmplatte');
  assert.equal(abgegrenztesKeyword('XPS 80 mm', t), null);
});

/**
 * **Die Grenze der Regel, festgehalten statt verschwiegen.** Aus
 * „Fassadendämmplatte" wird `fassadendä`; „EPS Fassadenplatten" trägt den
 * Stamm nicht, obwohl dasselbe Bauteil gemeint ist. Dieses Wort ist von Hand
 * entfernt worden. Fällt der Fall eines Tages doch in die Regel, wird dieser
 * Fall rot und verlangt eine Entscheidung.
 */
test('die Regel fängt nicht jede Schreibweise desselben Bauteils', () => {
  const t = 'Die Fassadendämmplatte in Flächenstärke führen wir nicht.';
  assert.equal(abgegrenztesKeyword('EPS Fassadenplatten', t), null,
    'wenn dieser Fall rot wird, fängt die Regel jetzt mehr — Kommentar in kampagne.mjs nachziehen');
});

test('Füllwörter des Abgrenzungssatzes werden nicht zu Stämmen', () => {
  const s = abgegrenzteStaemme('Drainagerohre führen wir derzeit nicht.').map((x) => x.stamm);
  assert.equal(s.includes(stamm('führen')), false);
  assert.equal(s.includes(stamm('derzeit')), false);
});

test('das Muster ist eng — „wir führen" allein grenzt nichts ab', () => {
  assert.equal(ABGRENZUNGSMUSTER.test('Wir führen XPS in mehreren Stärken.'), false);
  assert.equal(ABGRENZUNGSMUSTER.test('Drainagerohre führen wir nicht.'), true);
  assert.equal(ABGRENZUNGSMUSTER.test('Eine Kaminkopfverkleidung führen wir keine.'), true);
});

test('Sätze werden auch am Gedankenstrich getrennt — dort steht die zweite Hälfte der Aussage', () => {
  const s = saetze('Die Platte führen wir nicht — XPS haben wir.');
  assert.equal(s.length, 2);
  assert.equal(ABGRENZUNGSMUSTER.test(s[1]), false);
});

test('der Stamm ist kurz genug für Beugung und lang genug für Trennschärfe', () => {
  assert.equal(STAMMLAENGE, 10);
  assert.equal(stamm('Fassadendämmplatte'), stamm('Fassadendämmung'));
  assert.notEqual(stamm('Fassadendämmplatte'), stamm('Fassadenplatten'));
});

/**
 * **Und gegen die echte Landeseite.** Ohne diesen Fall prüften die Fälle
 * darüber nur eine erfundene Zeichenkette.
 */
test('die gebaute Landeseite grenzt die Flächenstärke ab, und kein XPS-Keyword fällt darunter', () => {
  if (!existsSync(SEITE)) return; // ohne Bau keine Aussage — und keine falsche
  const text = hauptbereichText(readFileSync(SEITE, 'utf8'));
  const staemme = abgegrenzteStaemme(text);
  assert.ok(staemme.some((s) => s.stamm === stamm('Fassadendämmplatte')),
    `gefunden: ${staemme.map((s) => s.wort).join(', ')}`);

  assert.ok(abgegrenztesKeyword('Fassadendämmung EPS', text), 'das Keyword müsste zurückgehalten werden');
  for (const frei of ['XPS Platten kaufen', 'XPS 80 mm', 'XPS 100 mm', 'Perimeterdämmung XPS']) {
    assert.equal(abgegrenztesKeyword(frei, text), null, `${frei} wird zu Unrecht zurückgehalten`);
    assert.deepEqual(ungedeckteWoerter(frei, text), [], `${frei} steht nicht auf der Seite`);
  }
});
