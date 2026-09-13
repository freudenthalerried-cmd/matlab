/**
 * Die vierte Redaktionsregel — gegen den Bestand gehalten.
 *
 * **Befund vom 7. September 2026.** `wissen/redaktionsprinzipien` ist die
 * Seite, auf die `llms.txt` mit „Wie geprüft wird" verweist. Ihre vierte Regel
 * versprach: *„Wir sagen auch, wofür etwas nicht taugt. **Jede Produktseite
 * hat einen Abschnitt dazu.**"* Gezählt über die 46 gebauten Artikelseiten:
 * **null** hatten ihn.
 *
 * > **Eine Regel, die auf der eigenen Seite steht und auf keiner anderen
 * > eingelöst ist, ist eine Behauptung über den eigenen Betrieb.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { UEBERSCHRIFT, grenzenbausteine, grenzenbefund } from '../src/eignungsgrenzen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ARTIKEL = join(SHOP, 'ausgabe', 'site', 'artikel');

test('die Bausteine kommen aus der Warengruppe des Artikels', () => {
  const b = grenzenbausteine({
    artikel: { gruppe: 'Dämmung' },
    wissen: [
      { id: 'wissen/xps-oder-eps', titel: 'XPS oder EPS', frage: 'Was passiert beim Vertauschen?', gruppe: 'Dämmung' },
      { id: 'wissen/kaminzug-aufbau', titel: 'Kaminzug', frage: '…', gruppe: 'Kamin' },
    ],
    abgrenzungen: [{ satz: 'Die Fassadendämmplatte führen wir nicht' }],
    merkblatt: true,
  });
  assert.deepEqual(b.wissen.map((w) => w.id), ['wissen/xps-oder-eps']);
  assert.equal(b.abgrenzungen.length, 1);
  assert.equal(b.merkblatt, true);
});

test('derselbe Satz zweimal ist einmal', () => {
  // `abgegrenzteStaemme` findet denselben Satz über mehrere Wörter — auf der
  // Seite stünde er sonst doppelt.
  const b = grenzenbausteine({
    artikel: { gruppe: 'Kanal' },
    abgrenzungen: [{ satz: 'A' }, { satz: 'A' }, { satz: 'B' }],
  });
  assert.deepEqual(b.abgrenzungen.map((x) => x.satz), ['A', 'B']);
});

test('ohne Warengruppe bleibt die Wissensliste leer, statt fremde Seiten zu zeigen', () => {
  const b = grenzenbausteine({
    artikel: {},
    wissen: [{ id: 'a', titel: 'A', frage: '?', gruppe: 'Dämmung' }],
  });
  assert.deepEqual(b.wissen, []);
});

test('eine Produktseite ohne den Abschnitt ist der Fund', () => {
  const seiten = Array.from({ length: 21 }, (_, i) => ({
    name: `POS-${i}.html`,
    text: i === 0 ? 'ohne' : `… <h2>${UEBERSCHRIFT}</h2> …`,
  }));
  const b = grenzenbefund({ seiten });
  const m = b.meldungen.find((x) => x.regel === 'produktseite-ohne-grenzen');
  assert.ok(m, 'die Meldung fehlt');
  assert.equal(m.wo, 'POS-0.html');
  assert.equal(b.mitAbschnitt, 20);
});

test('zu wenige Seiten sind kein grüner Befund', () => {
  const b = grenzenbefund({ seiten: [{ name: 'x', text: UEBERSCHRIFT }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-seiten'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

test('jede gebaute Artikelseite trägt den Abschnitt', () => {
  if (!existsSync(ARTIKEL)) return; // ohne Bau keine Aussage
  const seiten = readdirSync(ARTIKEL).filter((d) => d.endsWith('.html')).map((d) => ({
    name: d,
    text: readFileSync(join(ARTIKEL, d), 'utf8'),
  }));
  const b = grenzenbefund({ seiten, mindestens: 40 });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
});

test('der Abschnitt schreibt keine Kennwerte ab, sondern sagt, wo sie stehen', () => {
  if (!existsSync(ARTIKEL)) return;
  const dateien = readdirSync(ARTIKEL).filter((d) => d.endsWith('.html'));
  assert.ok(dateien.length >= 40, `nur ${dateien.length} Artikelseiten`);
  for (const d of dateien) {
    const html = readFileSync(join(ARTIKEL, d), 'utf8');
    const ab = html.indexOf(UEBERSCHRIFT);
    assert.ok(ab > -1, `${d}: kein Abschnitt`);
    const stueck = html.slice(ab, ab + 900).replace(/<[^>]+>/g, ' ');
    assert.match(stueck, /Merkblatt des Herstellers/,
      `${d}: der Abschnitt nennt die Quelle der Eignungsgrenzen nicht`);
  }
});

test('die Redaktionsseite verspricht den Abschnitt weiterhin — und sagt, was er enthält', () => {
  const datei = join(SHOP, 'inhalte', 'wissen', 'redaktionsprinzipien.md');
  const text = readFileSync(datei, 'utf8');
  assert.match(text, /Jede Produktseite hat\s*\n?einen Abschnitt dazu/);
  // Und die Regel beschreibt seither, wie er entsteht: Ohne diesen Zusatz
  // liest sich „wir sagen, wofür etwas nicht taugt" wie eine eigene
  // technische Auskunft — und genau die gibt dieser Shop nicht.
  assert.match(text, /schreibt nichts ab/);
});
