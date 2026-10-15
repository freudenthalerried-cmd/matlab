/**
 * Der Prüfer, der fragt, ob die Sperren je aufmachen.
 *
 * **Der Anlass, 5. September 2026.** Von Hand nachgesehen waren es zwei von
 * sieben: `darfVorgangLaufen` hatte vier Proben, alle rot, und
 * `darfBeauftragtWerden` wurde von keiner einzigen aufgerufen.
 *
 * Diese Proben halten den Prüfer selbst fest — sein Fund, seine Sichtweite
 * und die Grenzen, an denen er schweigt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SICHTWEITE,
  OHNE_GRUENEN_FALL,
  sperrenDerDatei,
  gruenerFall,
  sperrenbefund,
} from '../src/sperren.js';

const quelle = `
export function darfHinaus(a) {
  const gruende = [];
  if (!a) gruende.push('nichts da');
  return { erlaubt: gruende.length === 0, gruende };
}
export function darfWeg(b) {
  const gruende = [];
  return { darf: gruende.length === 0, gruende };
}
export function rechne(x) { return x + 1; }
`;

test('die Sperren kommen aus der Quelle, samt ihrem Urteilsfeld', () => {
  const s = sperrenDerDatei('src/probe.js', quelle);
  assert.deepEqual(s.map((x) => x.name), ['darfHinaus', 'darfWeg']);
  // Das Feld heißt nicht überall gleich. Ein Prüfer, der `erlaubt` fest
  // verdrahtet, überspränge `darfVersendetWerden` stillschweigend.
  assert.deepEqual(s.map((x) => x.feld), ['erlaubt', 'darf']);
});

test('eine Datei ohne Sperre liefert nichts, statt zu raten', () => {
  assert.deepEqual(sperrenDerDatei('src/leer.js', 'export const X = 1;\n'), []);
});

test('alle drei bejahenden Schreibweisen zählen', () => {
  const proben = [
    ['  const f = darfHinaus(x);', '  assert.equal(f.erlaubt, true);'],
    ['  const f = darfHinaus(x);', '  assert.ok(f.erlaubt);'],
    ['  const f = darfHinaus(x);', "  assert.equal(f.erlaubt, true, 'mit Meldung');"],
    ['  const f = darfHinaus(x);', '  assert.deepEqual(f.gruende, []);'],
  ];
  assert.equal(proben.length, 4, 'sonst prüfte die Schleife weniger als behauptet');
  for (const zeilen of proben) {
    assert.equal(gruenerFall(zeilen, 'darfHinaus', 'erlaubt'), true, zeilen[1]);
  }
});

/**
 * Der Fall, um den es geht: sechs Zusicherungen der Form „dieser eine Grund
 * kommt nicht" ergeben keine einzige Aussage darüber, ob die Sperre aufgeht.
 */
test('„dieser Grund fehlt" ist kein grüner Fall', () => {
  const zeilen = [
    '  const f = darfHinaus(x);',
    '  assert.equal(f.erlaubt, false);',
    '  assert.ok(!f.gruende.some((g) => /Lieferzeit/.test(g)));',
  ];
  assert.equal(gruenerFall(zeilen, 'darfHinaus', 'erlaubt'), false);
});

test('die Sichtweite hat eine Grenze, und sie ist benannt', () => {
  const nah = ['  const f = darfHinaus(x);', ...Array(SICHTWEITE - 1).fill('  //'), '  assert.ok(f.erlaubt);'];
  const fern = ['  const f = darfHinaus(x);', ...Array(SICHTWEITE).fill('  //'), '  assert.ok(f.erlaubt);'];
  assert.equal(gruenerFall(nah, 'darfHinaus', 'erlaubt'), true);
  assert.equal(gruenerFall(fern, 'darfHinaus', 'erlaubt'), false,
    'jenseits der Sichtweite handelt eine Zusicherung meistens von etwas anderem');
});

test('ohne erkennbares Urteilsfeld gilt nichts als nachgewiesen', () => {
  assert.equal(gruenerFall(['  assert.ok(f.erlaubt);'], 'darfHinaus', null), false);
});

/* ------------------------------------------------------------------ *
 * Der Befund
 * ------------------------------------------------------------------ */

const sperren = sperrenDerDatei('src/probe.js', quelle);

test('eine Sperre, die keine Probe aufruft', () => {
  const b = sperrenbefund(sperren, ['  assert.ok(true);']);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nie-aufgerufen', 'nie-aufgerufen']);
});

test('eine Sperre, die nur rot geprüft wird', () => {
  const b = sperrenbefund(sperren, [
    '  const f = darfHinaus(x);', '  assert.equal(f.erlaubt, false);',
    '  const g = darfWeg(y);', '  assert.ok(g.darf);',
  ]);
  assert.equal(b.nachgewiesen, 1);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ohne-gruenen-fall']);
  assert.match(b.meldungen[0].text, /darfHinaus/);
});

test('ein begründeter Verzicht schweigt — ein unbegründeter nicht', () => {
  const zeilen = ['  const f = darfHinaus(x);', '  assert.equal(f.erlaubt, false);',
    '  const g = darfWeg(y);', '  assert.ok(g.darf);'];
  const mitGrund = sperrenbefund(sperren, zeilen, [{
    sperre: 'darfHinaus',
    warumKeiner: 'Ein erfundener Grund, der lang genug ist, um als tragfähig zu gelten — '
      + 'genau das soll die Längenschwelle verhindern, wenn er es nicht ist.',
  }]);
  assert.equal(mitGrund.sauber, true);

  const ohneGrund = sperrenbefund(sperren, zeilen, [{ sperre: 'darfHinaus', warumKeiner: 'zu kurz' }]);
  assert.ok(ohneGrund.meldungen.some((m) => m.regel === 'verzicht-ohne-grund'));
});

test('ein Verzicht auf eine Sperre, die es nicht gibt', () => {
  const b = sperrenbefund(sperren, ['  const f = darfHinaus(x);', '  assert.ok(f.erlaubt);',
    '  const g = darfWeg(y);', '  assert.ok(g.darf);'], [{
    sperre: 'darfGibtEsNicht',
    warumKeiner: 'Ein Grund, der lang genug ist, damit diese Probe nicht an der Länge '
      + 'scheitert statt an der fehlenden Sperre.',
  }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-ohne-sperre'));
});

/**
 * Die Gegenrichtung: Ein Verzicht, der stehenbleibt, nachdem der grüne Fall
 * geschrieben wurde, deckt später eine Lücke, die es nicht mehr gibt — und
 * verdeckt eine neue, wenn der Fall wieder verschwindet.
 */
test('ein Verzicht auf eine Sperre, die längst einen grünen Fall hat', () => {
  const b = sperrenbefund(sperren, ['  const f = darfHinaus(x);', '  assert.ok(f.erlaubt);',
    '  const g = darfWeg(y);', '  assert.ok(g.darf);'], [{
    sperre: 'darfHinaus',
    warumKeiner: 'Ein Grund, der lang genug ist, damit diese Probe am Widerspruch scheitert '
      + 'und nicht an der Länge des Grundes.',
  }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-ohne-fall'));
});

test('eine Funktion ohne Gründeliste ist keine erkennbare Sperre', () => {
  const s = sperrenDerDatei('src/x.js', 'export function darfIrgendwas(a) { return a > 1; }\n');
  const b = sperrenbefund(s, ['  darfIrgendwas(1);']);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['kein-urteilsfeld']);
});

test('der Verzicht ist heute leer — und das ist eine Aussage', () => {
  // Er darf wachsen; jeder Eintrag kostet dann eine Begründung. Leer heißt:
  // Für jede Sperre dieses Hauses ist gezeigt, dass sie aufgeht.
  assert.deepEqual(OHNE_GRUENEN_FALL, []);
});
