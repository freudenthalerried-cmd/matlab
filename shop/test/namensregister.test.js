/**
 * Ein Name, zwei Module.
 *
 * „Derselbe Name für einen anderen Vertrag ist schlimmer als zwei Fassungen"
 * ist an vier Tagen durch Zufall wiedergefunden worden. Diese Reihe hält die
 * Messung, die den Satz seither trägt — und sieht jede ihrer Regeln einmal
 * anschlagen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  exportierteNamen, namensbefund, NAME_GEPRUEFT, NAMEN_HOECHSTENS,
} from '../src/namensregister.js';

const regelnVon = (b) => b.meldungen.map((m) => m.regel).sort();
const GRUND = 'x'.repeat(90);

test('Gelesen werden nur Ausfuhren, und jede nur einmal', () => {
  const quelle = [
    'export function eins() {}',
    'export const zwei = 1;',
    'export async function drei() {}',
    'export class vier {}',
    'function oertlich() {}',
    "const zitat = 'export const fuenf = 1;';",
    '  export const eingerueckt = 2;',
  ].join('\n');
  const namen = exportierteNamen(quelle);
  assert.deepEqual(namen.sort(), ['drei', 'eins', 'vier', 'zwei'], JSON.stringify(namen));
  assert.equal(exportierteNamen('export const a = 1;\nexport const a = 2;').length, 1,
    'derselbe Name zweimal in einer Datei zählt zweimal');
});

test('Ein Name in zwei Modulen fällt auf', () => {
  const quellen = new Map([
    ['src/a.js', 'export function doppelt() {}\nexport const nurhier = 1;'],
    ['src/b.js', 'export function doppelt() {}'],
  ]);
  const b = namensbefund(quellen, [], 0);
  assert.deepEqual(b.offen.map((o) => o.name), ['doppelt'], JSON.stringify(b.offen));
  assert.deepEqual(b.offen[0].module, ['src/a.js', 'src/b.js']);
  assert.ok(regelnVon(b).includes('mehr-doppelnamen-als-erlaubt'), JSON.stringify(b.meldungen));
});

test('Ein Grund für zwei ist keiner für drei', () => {
  const quellen = new Map([
    ['src/a.js', 'export function doppelt() {}'],
    ['src/b.js', 'export function doppelt() {}'],
    ['src/c.js', 'export function doppelt() {}'],
  ]);
  const gefuehrt = [{ name: 'doppelt', hoechstens: 2, warum: GRUND }];
  assert.deepEqual(regelnVon(namensbefund(quellen, gefuehrt, 0)), ['mehr-module-als-begruendet']);
  const weit = [{ name: 'doppelt', hoechstens: 3, warum: GRUND }];
  assert.deepEqual(namensbefund(quellen, weit, 0).meldungen, []);
});

test('Ein Grund für einen Namen, der nur noch einmal steht', () => {
  const quellen = new Map([['src/a.js', 'export function einmal() {}']]);
  const gefuehrt = [{ name: 'einmal', hoechstens: 2, warum: GRUND }];
  assert.deepEqual(regelnVon(namensbefund(quellen, gefuehrt, 0)), ['grund-ohne-namen']);
  const duenn = [{ name: 'einmal', hoechstens: 2, warum: 'zu kurz' }];
  assert.deepEqual(regelnVon(namensbefund(quellen, duenn, 0)), ['grund-ohne-namen', 'grund-zu-duenn']);
});

test('Die Sperrklinke fällt und steigt nicht', () => {
  const quellen = new Map([
    ['src/a.js', 'export function doppelt() {}'],
    ['src/b.js', 'export function doppelt() {}'],
  ]);
  assert.deepEqual(regelnVon(namensbefund(quellen, [], 3)), ['sperrklinke-nachziehen']);
  assert.deepEqual(namensbefund(quellen, [], 1).meldungen, []);
});

test('Das Verzeichnis dieses Hauses trägt Gründe', () => {
  assert.ok(NAME_GEPRUEFT.length >= 3, `nur ${NAME_GEPRUEFT.length} Einträge`);
  for (const g of NAME_GEPRUEFT) {
    assert.ok(g.warum.length >= 80, `${g.name}: Grund zu dünn`);
    assert.ok(Number.isInteger(g.hoechstens) && g.hoechstens >= 2, `${g.name}: keine Zahl der Module`);
  }
  assert.ok(Number.isInteger(NAMEN_HOECHSTENS) && NAMEN_HOECHSTENS >= 0);
});

/*
 * Und die drei Zusammenlegungen dieser Runde: Sie sind der Grund, dass die
 * Schranke fallen konnte, und ein Testfall hält sie fest.
 */
test('Die drei Namen dieser Runde stehen je einmal', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const quellen = new Map();
  for (const n of readdirSync(new URL('../src/', import.meta.url))) {
    if (/\.js$/.test(n)) quellen.set(`src/${n}`, readFileSync(new URL(`../src/${n}`, import.meta.url), 'utf8'));
  }
  assert.ok(quellen.size >= 100, `nur ${quellen.size} Module gelesen`);
  const b = namensbefund(quellen, [], null);
  const offen = new Set(b.offen.map((o) => o.name));
  for (const name of ['GRUND_MINDESTLAENGE', 'MINDESTGRUND', 'KOPFZEILEN', 'ohneKommentare']) {
    assert.ok(!offen.has(name), `${name} steht wieder in mehr als einem Modul`);
  }
});
