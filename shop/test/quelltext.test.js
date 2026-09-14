/**
 * Der eine Leser des Quelltexts.
 *
 * Fünf Stellen dieses Hauses lesen Javascript-Quelltext. Bis zum
 * 14. September taten es zwei mit einem Scanner und drei mit regulären
 * Ausdrücken — und die drei lasen falsch. Diese Reihe hält die Regeln fest,
 * an denen ein Musterleser scheitert.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { stuecke } from '../src/quelltext.js';

const arten = (q) => stuecke(q).map((s) => s.art);
const texte = (q, art) => stuecke(q).filter((s) => s.art === art).map((s) => s.text);

test('Aneinandergehängt ergeben die Stücke wieder die Quelle', () => {
  const proben = [
    "const a = 'eins'; // Ende",
    '/* Block */ const b = `vorlage ${a + 1} zu Ende`;',
    'const c = /ab[/]c/gi.test(x) ? 1 : 2;',
    "const d = \"mit 'Apostroph' darin\";",
    '',
  ];
  assert.ok(proben.length >= 4, 'die Schleife prüft zu wenig');
  for (const q of proben) {
    assert.equal(stuecke(q).map((s) => s.roh).join(''), q, `nicht zeichengleich: ${q}`);
  }
});

/*
 * **Der Fund vom 14. September, vormittags.** Ein Apostroph in einem
 * Kommentar kippte den Musterleser für den Rest der Datei. Hier kann er es
 * nicht: Der Kommentar ist ein Stück, bevor irgendein Anführungszeichen
 * gelesen wird.
 */
test('Ein Apostroph im Kommentar beginnt keine Zeichenkette', () => {
  const q = "/* der's trägt */\nconst a = 'eins';\nconst b = 'zwei';";
  assert.deepEqual(texte(q, 'kette'), ['eins', 'zwei'], JSON.stringify(stuecke(q)));
  assert.deepEqual(texte(q, 'block'), [" der's trägt "]);
});

test('Ein Zeilenumbruch beendet eine einfach begrenzte Zeichenkette', () => {
  const q = "const a = 'ohne Ende\nconst b = 'zwei';";
  // Nachsichtig: Das erste Anführungszeichen war keines — es gehört zum Code.
  assert.deepEqual(texte(q, 'kette'), ['zwei'], JSON.stringify(stuecke(q)));
  assert.throws(() => stuecke(q, { streng: true }), /Zeichenkette ohne Ende/);
  const vorlage = 'const a = `über\nzwei Zeilen`;';
  assert.deepEqual(texte(vorlage, 'kette'), ['über\nzwei Zeilen'], 'ein Vorlagenliteral darf das');
});

/*
 * **Der Fund vom 14. September, nachmittags.** Ein Anführungszeichen in einem
 * regulären Ausdruck kippte den Leser genauso — `/['"]/` beginnt für einen
 * Musterleser eine Zeichenkette. Gemessen: 415 Sätze, die es nicht gibt.
 */
test('Ein Anführungszeichen in einem Muster beginnt keine Zeichenkette', () => {
  const q = 'const m = /[\'"]/g;\nconst a = \'echt\';';
  assert.deepEqual(texte(q, 'kette'), ['echt'], JSON.stringify(stuecke(q)));
  assert.deepEqual(texte(q, 'muster'), ['/[\'"]/g']);
});

test('Ein Muster wird von einer Division unterschieden', () => {
  assert.deepEqual(texte('const a = b / c / d;', 'muster'), [], 'eine Division gilt als Muster');
  assert.deepEqual(texte('const a = /x/.test(b);', 'muster'), ['/x/']);
  assert.deepEqual(texte('return /x/;', 'muster'), ['/x/'], 'nach return beginnt ein Muster');
  assert.deepEqual(texte("const a = 'x' / 2;", 'muster'), [],
    'nach einer Zeichenkette teilt der Schrägstrich');
});

test('Ein Schrägstrich im Muster steht in einer Zeichenklasse', () => {
  assert.deepEqual(texte('const a = /[/]x/g;', 'muster'), ['/[/]x/g']);
});

test('In einem Vorlagenliteral steht Code, im Text daneben nicht', () => {
  const q = 'const a = `vorher ${b + `tief ${c}`} nachher`;';
  assert.equal(stuecke(q).map((s) => s.roh).join(''), q);
  const ketten = texte(q, 'kette');
  assert.ok(ketten.some((t) => t.includes('vorher')), JSON.stringify(ketten));
  assert.ok(ketten.some((t) => t.includes('tief')), 'das geschachtelte Literal fehlt');
});

test('Ein Zeilenkommentar in einer Zeichenkette ist keiner', () => {
  const q = "const u = 'https://beispiel.at/x'; // echter Kommentar";
  assert.deepEqual(texte(q, 'kette'), ['https://beispiel.at/x'], JSON.stringify(stuecke(q)));
  assert.deepEqual(texte(q, 'zeile'), [' echter Kommentar']);
});

test('Streng bricht ab, wo nachsichtig weiterliest', () => {
  const faelle = ['/* ohne Ende', 'const a = `ohne Ende', "const a = 'ohne Ende", 'const a = /ohne Ende'];
  assert.equal(faelle.length, 4, 'die Schleife prüft zu wenig');
  for (const q of faelle) {
    assert.throws(() => stuecke(q, { streng: true }), /ohne Ende/, `streng ging durch: ${q}`);
    assert.ok(stuecke(q).length >= 1, `nachsichtig gab nichts zurück: ${q}`);
    assert.equal(stuecke(q).map((s) => s.roh).join(''), q, `nicht zeichengleich: ${q}`);
  }
});

test('Jede Quelldatei dieses Hauses zerfällt zeichengleich', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const wurzel = new URL('../', import.meta.url);
  let gelesen = 0;
  for (const [ordner, muster] of [['src', /\.js$/], ['bin', /\.mjs$/]]) {
    const namen = readdirSync(new URL(`${ordner}/`, wurzel)).filter((n) => muster.test(n));
    assert.ok(namen.length >= 80, `nur ${namen.length} Dateien in ${ordner}/ — die Schleife prüft zu wenig`);
    for (const name of namen) {
      const text = readFileSync(new URL(`${ordner}/${name}`, wurzel), 'utf8');
      const st = stuecke(text, { streng: true });
      assert.equal(st.map((s) => s.roh).join(''), text, `${ordner}/${name} zerfällt nicht zeichengleich`);
      assert.ok(arten(text).includes('code'), `${ordner}/${name} hat kein Codestück`);
      gelesen += 1;
    }
  }
  assert.ok(gelesen >= 200, `nur ${gelesen} Dateien gelesen — die Allaussage prüft zu wenig`);
});
