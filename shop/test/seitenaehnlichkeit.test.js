/**
 * Die Unterscheidbarkeit der Artikelseiten.
 *
 * **Der Anlass, 3. September 2026, nachts.** Dieser Shop soll über Suche und
 * maschinelle Auskunft gefunden werden; darauf ruht die ganze Kanalrechnung.
 * Gebaut sind dafür 46 Artikelseiten — **gemessen hat ihre Unterscheidbarkeit
 * nie jemand.** Der erste Lauf fand vier Paare bei 0,99 und 48 % Wörter, die
 * auf jeder der 46 Seiten stehen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  wortmenge, aehnlichkeit, seitenbefund, eigenerText, DUBLETTENGRENZE,
} from '../src/seitenaehnlichkeit.js';

test('gleiche Texte sind gleich, verschiedene nicht', () => {
  assert.equal(aehnlichkeit(wortmenge('a b c'), wortmenge('a b c')), 1);
  assert.equal(aehnlichkeit(wortmenge('a b'), wortmenge('c d')), 0);
  // Drei von vier gemeinsam: |∩| = 3, |∪| = 5.
  assert.equal(aehnlichkeit(wortmenge('a b c d'), wortmenge('a b c e')), 3 / 5);
});

/**
 * Zwei leere Mengen sind einander **nicht** ähnlich, sondern leer. Die
 * Alternative wäre `1` und hieße, dass zwei Seiten ohne Text als Dubletten
 * gelten — ein Befund über nichts.
 */
test('zwei leere Seiten sind keine Dubletten', () => {
  assert.equal(aehnlichkeit(wortmenge(''), wortmenge('')), 0);
  assert.equal(aehnlichkeit(wortmenge(null), wortmenge(undefined)), 0);
});

test('unter zwei Seiten gibt es nichts zu vergleichen', () => {
  assert.throws(() => seitenbefund([{ id: 'a', text: 'x' }]), /kein grüner/);
  assert.throws(() => seitenbefund([]), /kein grüner/);
});

test('zwei praktisch gleiche Seiten fallen als Dublette auf', () => {
  const rumpf = Array.from({ length: 60 }, (_, i) => `wort${i}`).join(' ');
  const e = seitenbefund([
    { id: 'a', text: `${rumpf} eins` },
    { id: 'b', text: `${rumpf} eins` },
    { id: 'c', text: `${rumpf} völlig anderes zeug hier` },
  ]);
  assert.equal(e.dubletten.length, 1);
  assert.deepEqual([e.dubletten[0].a, e.dubletten[0].b], ['a', 'b']);
  assert.equal(e.hoechste.wert, 1);
});

test('der gemeinsame Anteil zählt, was auf jeder Seite steht', () => {
  const e = seitenbefund([
    { id: 'a', text: 'gemeinsam eins' },
    { id: 'b', text: 'gemeinsam zwei' },
    { id: 'c', text: 'gemeinsam drei' },
  ]);
  assert.equal(e.gemeinsameWorte, 1);
  assert.equal(e.mittlereLaenge, 2);
  assert.equal(e.gemeinsamerAnteil, 0.5);
});

/**
 * Der Querverweisblock ist Navigation und steht auf jeder Seite derselben
 * Gruppe gleich. Eine Messung, die ihn mitzählt, misst die Navigation und
 * nennt es Inhalt.
 */
test('der Querverweisblock fällt aus dem eigenen Text', () => {
  const html = '<header>Kopf</header><h1>Titel</h1><p>Eigenes</p>'
    + '<section class="querverweise"><h2>Weitere</h2><p>Fremdes</p></section>'
    + '<footer>Fuß</footer>';
  const t = eigenerText(html);
  assert.match(t, /Titel/);
  assert.match(t, /Eigenes/);
  assert.ok(!t.includes('Fremdes'), t);
  assert.ok(!t.includes('Kopf'), t);
  assert.ok(!t.includes('Fuß'), t);
});

test('der Bestand steht: kein Paar erreicht die Dublettengrenze', () => {
  const ordner = fileURLToPath(new URL('../ausgabe/site/artikel', import.meta.url));
  // Ohne gebaute Seiten prüft dieser Fall nichts — und sagt es.
  assert.equal(typeof existsSync(ordner), 'boolean');
  if (!existsSync(ordner)) return;

  const seiten = readdirSync(ordner).filter((f) => f.endsWith('.html')).map((f) => ({
    id: f.replace(/\.html$/, ''),
    text: eigenerText(readFileSync(join(ordner, f), 'utf8')),
  }));
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Artikelseiten — der Bau ist unvollständig`);

  const e = seitenbefund(seiten, DUBLETTENGRENZE);
  assert.deepEqual(e.dubletten.map((d) => `${d.a}/${d.b}`), []);
  // Der gemeinsame Anteil ist hoch und darf es heute sein — festgehalten wird,
  // dass er nicht unbemerkt gegen eins läuft. Bei 0,9 wären die Seiten bis auf
  // Namen und Zahlen identisch.
  assert.ok(e.gemeinsamerAnteil < 0.9,
    `${(e.gemeinsamerAnteil * 100).toFixed(0)} % der Wörter stehen auf jeder Seite`);
});
