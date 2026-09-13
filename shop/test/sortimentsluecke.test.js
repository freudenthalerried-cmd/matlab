import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { EIGENES_GEWERK, lueckensatz, sortimentsluecken } from '../src/sortimentsluecke.js';
import { liesSystemliste } from '../src/systemlisten.js';

const SYSTEM = fileURLToPath(new URL('../inhalte/system', import.meta.url));

/** Die echten Listen — dieselbe Quelle, aus der der Brief schöpft. */
function echteListen() {
  return readdirSync(SYSTEM).filter((n) => n.endsWith('.md')).sort().map((datei) => {
    const text = readFileSync(join(SYSTEM, datei), 'utf8');
    return {
      name: datei.replace(/\.md$/, ''),
      titel: (/^titel:\s*(.+)$/m.exec(text)?.[1] ?? datei).replace(/\s+—\s+die Liste.*$/, ''),
      gelesen: liesSystemliste(text),
    };
  });
}

const zeile = (nr, position, hinweis) => ({
  nr, position, gefuehrt: !/nicht im Sortiment/.test(position), eingeschraenkt: false, hinweis,
});

test('jeder Eintrag im Gewerkregister trägt einen Grund, der trägt', () => {
  assert.ok(EIGENES_GEWERK.length >= 1);
  for (const e of EIGENES_GEWERK) {
    assert.ok(e.position, 'ein Eintrag ohne Position deckt nichts');
    assert.ok(e.warum.length > 150,
      `${e.position}: der Grund ist zu knapp — er soll erklären, warum wir das nicht führen wollen`);
  }
});

test('die echten Systemlisten ergeben einen sauberen Befund', () => {
  const b = sortimentsluecken(echteListen());
  assert.deepEqual(b.meldungen, []);
  assert.ok(b.luecken.length >= 1, 'ohne Lücke hätte der Brief nichts zu fragen');
});

test('eine Position in zwei Listen steht einmal da und nennt beide', () => {
  const b = sortimentsluecken([
    { name: 'a', titel: 'Liste A', gelesen: { zeilen: [zeile(1, 'Schiene *(nicht im Sortiment)*', '—')] } },
    { name: 'b', titel: 'Liste B', gelesen: { zeilen: [zeile(1, 'Schiene *(nicht im Sortiment)*', '—')] } },
  ]);
  assert.equal(b.luecken.length, 1);
  assert.deepEqual(b.luecken[0].listen, ['Liste A', 'Liste B']);
});

test('„wird oft vergessen" wird mitgeführt — es ist der Zweck dieser Tabellen', () => {
  const b = sortimentsluecken([
    { name: 'a', titel: 'A', gelesen: { zeilen: [zeile(1, 'Gleitmittel *(nicht im Sortiment)*', '**ja**')] } },
  ]);
  assert.equal(b.luecken[0].oftVergessen, true);
  assert.equal(b.oftVergessen, 1);
});

test('eigenes Gewerk ist keine Lücke', () => {
  const b = sortimentsluecken([
    { name: 'a', titel: 'A', gelesen: { zeilen: [zeile(1, 'Abdichtung *(nicht im Sortiment)*', 'eigenes Gewerk')] } },
  ]);
  assert.deepEqual(b.luecken, []);
  assert.deepEqual(b.gewerke, ['Abdichtung']);
});

test('ein Gewerk ohne Registereintrag ist ein Befund', () => {
  const b = sortimentsluecken([
    { name: 'a', titel: 'A', gelesen: { zeilen: [zeile(1, 'Estrich *(nicht im Sortiment)*', 'eigenes Gewerk')] } },
  ]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['gewerk-ohne-eintrag', 'eintrag-ohne-position',
    'eintrag-ohne-position']);
});

test('ein Registereintrag, dessen Position verschwunden ist, ist ein Befund — die zweite Richtung', () => {
  const b = sortimentsluecken([
    { name: 'a', titel: 'A', gelesen: { zeilen: [zeile(1, 'Abdichtung *(nicht im Sortiment)*', 'eigenes Gewerk')] } },
  ]);
  const uebrig = EIGENES_GEWERK.filter((e) => e.position !== 'Abdichtung');
  assert.equal(b.meldungen.length, uebrig.length);
  for (const e of uebrig) assert.ok(b.meldungen.some((m) => m.text.includes(e.position)));
});

test('eine Position, die der Katalog doch führt, ist ein Befund', () => {
  const b = sortimentsluecken(
    [{ name: 'a', titel: 'A', gelesen: { zeilen: [zeile(1, 'Dübel *(nicht im Sortiment)*', '—')] } }],
    (name) => name === 'Dübel',
  );
  assert.ok(b.meldungen.some((m) => m.regel === 'luecke-die-keine-ist'));
  assert.deepEqual(b.luecken, []);
});

test('der Satz nennt jede Lücke mit ihrer Liste und schreibt die Zahl aus', () => {
  const { luecken } = sortimentsluecken(echteListen());
  // Ohne diese Zusicherung prüfte die Schleife darunter bei leerer Liste nichts
  // — der Befund vom 22. August über elf grüne Schleifen ohne Inhalt.
  assert.ok(luecken.length >= 1, 'ohne Lücke prüft die Schleife darunter nichts');
  const satz = lueckensatz(luecken);
  for (const l of luecken) {
    assert.ok(satz.includes(l.position), `${l.position} fehlt im Satz`);
    for (const n of l.listen) assert.ok(satz.includes(n), `${n} fehlt im Satz`);
  }
  assert.doesNotMatch(satz, /\d+ Positionen bekommen/, 'die Zahl gehört ausgeschrieben');
});

test('ohne Lücke gibt es keinen Satz — kein leerer Absatz im Brief', () => {
  assert.equal(lueckensatz([]), '');
});
