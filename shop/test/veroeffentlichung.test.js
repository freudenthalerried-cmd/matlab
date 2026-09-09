/**
 * Die Marke am Ende der veröffentlichten Beschreibung.
 *
 * **Woran diese Fälle hängen.** Die Marke ist die erste Prüfung dieses
 * Bestands, die ohne die Quelle auskommt: Sie hält eine Fassung gegen sich
 * selbst. Der Fall, für den das Ganze gebaut ist, ist `ein dazugeschriebener
 * Satz` — genau der Fehler, der in vier von sechs Veröffentlichungen passiert
 * ist und den vorher nur ein Augenvergleich finden konnte.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fingerabdruck, marke, markiere, markenbefund, MARKENMUSTER, TRENNER,
} from '../src/veroeffentlichung.js';

const QUELLE = 'docs/baustoff-shop/pr-beschreibung.md';
const BEFEHL = 'npm run pruefe-marke';
const TEXT = 'Eine Beschreibung mit zwei Absätzen.\n\nUnd der zweite endet hier.';

test('Der Fingerabdruck ist der sha256 über genau diese Zeichen', () => {
  assert.equal(fingerabdruck('').length, 64);
  assert.match(fingerabdruck('a'), /^[0-9a-f]{64}$/);
  assert.notEqual(fingerabdruck('a'), fingerabdruck('a '));
  assert.equal(fingerabdruck('a'), fingerabdruck('a'));
});

test('Ein einziges Zeichen ändert den Fingerabdruck vollständig', () => {
  const a = fingerabdruck(TEXT);
  const b = fingerabdruck(`${TEXT}.`);
  assert.notEqual(a, b);
  // Nicht „ein bisschen anders": Von 64 Stellen darf höchstens eine Handvoll
  // zufällig übereinstimmen. Sonst wäre der Vergleich eine Ähnlichkeitsfrage.
  const gleich = [...a].filter((z, i) => z === b[i]).length;
  assert.ok(gleich < 20, `${gleich} von 64 Stellen gleich — das ist kein Fingerabdruck`);
});

test('Die Marke nennt Fingerabdruck, Quelle und Prüfbefehl', () => {
  const m = marke(TEXT, QUELLE, BEFEHL);
  const treffer = MARKENMUSTER.exec(m);
  assert.ok(treffer, `Marke passt nicht auf ihr eigenes Muster: ${m}`);
  assert.equal(treffer[1], fingerabdruck(TEXT));
  assert.equal(treffer[2], QUELLE);
  assert.equal(treffer[3], BEFEHL);
});

test('Eine markierte Fassung deckt sich mit ihrer Marke', () => {
  const b = markenbefund(markiere(TEXT, QUELLE, BEFEHL));
  assert.equal(b.passt, true, b.text);
  assert.equal(b.regel, 'marke-passt');
  assert.equal(b.zeichen, TEXT.length);
  assert.equal(b.quelle, QUELLE);
});

test('Ein dazugeschriebener Satz fällt auf — der Fall, für den das gebaut ist', () => {
  const echt = markiere(TEXT, QUELLE, BEFEHL);
  const dazu = echt.replace('zweite endet hier.', 'zweite endet hier. Und noch ein Satz.');
  const b = markenbefund(dazu);
  assert.equal(b.passt, false);
  assert.equal(b.regel, 'marke-passt-nicht');
  assert.notEqual(b.ist, b.soll);
});

test('Ein gestrichener Satz fällt genauso auf', () => {
  const echt = markiere(TEXT, QUELLE, BEFEHL);
  const weniger = echt.replace('\n\nUnd der zweite endet hier.', '');
  assert.equal(markenbefund(weniger).regel, 'marke-passt-nicht');
});

test('Ein einziges verändertes Zeichen fällt auf', () => {
  const echt = markiere(TEXT, QUELLE, BEFEHL);
  assert.equal(markenbefund(echt.replace('zwei Absätzen', 'drei Absätzen')).regel,
    'marke-passt-nicht');
});

test('Eine Fassung ohne Marke sagt das, statt grün zu sein', () => {
  const b = markenbefund(TEXT);
  assert.equal(b.passt, false);
  assert.equal(b.regel, 'keine-marke');
});

test('Zwei Marken sind ein Befund, kein Zufall', () => {
  const echt = markiere(TEXT, QUELLE, BEFEHL);
  const b = markenbefund(`${echt}\n${marke('anderes', QUELLE, BEFEHL)}`);
  assert.equal(b.regel, 'mehrere-marken');
});

test('Text hinter der Marke wird von ihr nicht gedeckt', () => {
  const b = markenbefund(`${markiere(TEXT, QUELLE, BEFEHL)}\n\nNachtrag von Hand.`);
  assert.equal(b.passt, false);
  assert.equal(b.regel, 'text-hinter-der-marke');
});

test('Eine beschädigte Marke heißt nicht „passt nicht", sondern „unlesbar"', () => {
  const echt = markiere(TEXT, QUELLE, BEFEHL);
  const b = markenbefund(echt.replace('sha256:', 'sha256-'));
  assert.equal(b.passt, false);
  assert.equal(b.regel, 'marke-unlesbar');
});

test('Die Leerzeile vor der Marke gehört zur Marke, nicht zum Text', () => {
  // Der Fehler der ersten Fassung: Der Text wurde über die Zeilenliste
  // zusammengesetzt, die Leerzeile blieb drin, und der Prüfer meldete
  // `trenner-fehlt` über seine eigene, fehlerfreie Ausgabe.
  const echt = markiere(TEXT, QUELLE, BEFEHL);
  assert.ok(echt.includes(TRENNER + '<!-- fingerabdruck'));
  assert.equal(markenbefund(echt).passt, true);
  const ohne = echt.replace(TRENNER + '<!-- fingerabdruck', '\n<!-- fingerabdruck');
  assert.equal(markenbefund(ohne).regel, 'trenner-fehlt');
});

test('Die Marke prüft ohne die Quelle — sie kommt in der Rechnung nicht vor', () => {
  // Der ganze Zweck: Wer die Fassung hat, braucht das Verzeichnis nicht.
  // Deshalb darf der Befund nur von der Fassung abhängen.
  const a = markenbefund(markiere(TEXT, 'ein/pfad.md', BEFEHL));
  const b = markenbefund(markiere(TEXT, 'ein/ganz/anderer/pfad.md', BEFEHL));
  assert.equal(a.passt, b.passt);
  assert.equal(a.ist, b.ist);
});

test('Der Text darf selbst Leerzeilen und spitze Klammern tragen', () => {
  const heikel = 'Ein Text <!-- mit einem Kommentar --> darin.\n\n\nUnd drei Leerzeilen.';
  const b = markenbefund(markiere(heikel, QUELLE, BEFEHL));
  assert.equal(b.passt, true, b.text);
  assert.equal(b.zeichen, heikel.length);
});
