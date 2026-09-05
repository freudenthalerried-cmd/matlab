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
  wortmenge, aehnlichkeit, seitenbefund, eigenerText, abschnitte, abschnittsbefund,
  DUBLETTENGRENZE,
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

/* ------------------------------------------------------------------ *
 * Wo die Gleichheit sitzt — ergänzt am 5. September
 *
 * **Der Anlass.** Der Lauf meldete „137 von 220 Wörtern auf jeder Seite" und
 * schrieb darunter, was den Anteil senke, sei die Artikelliste des
 * Lieferanten. Gemessen war das nie — und es stimmt nicht: Der größte gleiche
 * Block ist der eigene Lieferabsatz.
 *
 * > **Eine Gesamtzahl sagt, wie viel gleich ist. Sie sagt nicht, wessen
 * > Gleichheit es ist** — und damit auch nicht, wer sie ändern kann.
 * ------------------------------------------------------------------ */

test('Navigation außerhalb der Kopfleiste zählt nicht als Inhalt', () => {
  // Drei Blöcke standen bis zum 5. September in der Messung, obwohl der
  // Kommentar daneben „Navigation, kein Inhalt" sagte.
  const mitChrom = '<head><title>Artikel — Bauversand</title></head>'
    + '<a class="springen" href="#inhalt">Zum Inhalt springen</a>'
    + '<noscript><p>Ohne JavaScript arbeiten Suchfeld und Warenkorb nicht.</p></noscript>'
    + '<main><h1>Dachlatte</h1><p>Sie ist gehobelt.</p></main>';
  assert.equal(eigenerText(mitChrom), 'Dachlatte Sie ist gehobelt.');
});

test('die Seite zerfällt an ihren Zwischenüberschriften', () => {
  const html = '<main><h1>Rohr</h1><p>Kopftext.</p>'
    + '<h2>Technische Kennwerte</h2><p>Keine da.</p>'
    + '<h2>Lieferung</h2><p>Auf Palette.</p></main>';
  const a = abschnitte(html);
  assert.deepEqual(a.map((x) => x.titel), ['Kopf und Preistafel', 'Technische Kennwerte', 'Lieferung']);
  assert.deepEqual(a.map((x) => x.text), ['Rohr Kopftext.', 'Keine da.', 'Auf Palette.']);
});

test('ein Abschnitt, den es nur auf einer Seite gibt, sagt das von sich', () => {
  const seiten = [
    [{ titel: 'A', text: 'eins zwei' }, { titel: 'B', text: 'drei' }],
    [{ titel: 'A', text: 'eins vier' }],
  ];
  const b = abschnittsbefund(seiten);
  assert.equal(b.find((x) => x.titel === 'A').aufJederSeite, true);
  assert.equal(b.find((x) => x.titel === 'B').aufJederSeite, false);
});

test('drei Zahlen je Abschnitt, weil keine allein genügt', () => {
  // Zwei Fassungen, je zur Hälfte. Der Schnitt über alle findet nur das eine
  // gemeinsame Wort; der Median liegt tief, weil mehr Paare kreuz als gleich
  // sind; erst die Fassungszahl sagt, wonach jemand handeln kann.
  const seiten = [
    [{ titel: 'K', text: 'gleich alpha beta' }],
    [{ titel: 'K', text: 'gleich alpha beta' }],
    [{ titel: 'K', text: 'gleich gamma delta' }],
    [{ titel: 'K', text: 'gleich gamma delta' }],
  ];
  const [k] = abschnittsbefund(seiten);
  assert.equal(k.gemeinsameWorte, 1, 'nur „gleich" steht auf jeder');
  assert.equal(k.fassungen, 2);
  assert.equal(k.groessteFassung, 2);
  assert.ok(k.median < 0.4, `Median ${k.median} — die Verteilung hat zwei Gipfel`);
});

test('ein Abschnitt, der überall wortgleich ist, kommt auf Anteil 1', () => {
  const seiten = [
    [{ titel: 'L', text: 'immer derselbe Satz' }],
    [{ titel: 'L', text: 'immer derselbe Satz' }],
  ];
  const [l] = abschnittsbefund(seiten);
  assert.equal(l.anteil, 1);
  assert.equal(l.fassungen, 1);
  assert.equal(l.median, 1);
});

test('unter zwei Seiten wird nicht gemessen, sondern abgebrochen', () => {
  assert.throws(() => abschnittsbefund([[{ titel: 'A', text: 'x' }]]), /zwei Seiten/);
});
