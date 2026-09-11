import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';

import {
  HAKEN, HAKENWEG, NICHT_IM_HAKEN, hakenbefund, imSchnelllauf, auswahlbefund,
} from '../src/haken.js';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';
import { LESER } from '../src/erzeugnisstand.js';

/**
 * Die Lage, in der alles stimmt. Jeder Testfall verbiegt genau eine Sache
 * daran — sonst misst man am Ende, dass mehrere Fehler gleichzeitig auffallen,
 * und nicht, dass jeder einzelne auffällt.
 */
const gut = () => ({
  hakenweg: HAKENWEG,
  dateien: HAKEN.map((h) => h.name),
  lies: (name) => `#!/bin/sh\n${HAKEN.find((h) => h.name === name).ruft
    .map((r) => `# ruft ${r}`).join('\n')}\n`,
  ausfuehrbar: () => true,
  probiere: () => ({ mitZettel: 1, ohneZettel: 0 }),
  aufrufer: "import { richteHakenEin } from './hakeneinrichtung.mjs';",
});

test('das Register nennt mindestens einen Haken, jeden mit Grund', () => {
  assert.ok(HAKEN.length >= 1);
  for (const h of HAKEN) {
    assert.ok(h.name, 'ein Haken ohne Namen ist nicht auffindbar');
    assert.ok(Array.isArray(h.ruft) && h.ruft.length >= 1,
      'ein Haken, der nichts ruft, hält nichts auf');
    assert.ok(h.warum.length > 80, `${h.name}: der Grund ist zu knapp, um in einem Jahr zu tragen`);
  }
});

test('die heile Lage meldet nichts', () => {
  const b = hakenbefund(gut());
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.sauber, true);
  assert.equal(b.geprueft, HAKEN.length);
});

test('ein nicht gesetzter Hakenweg ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), hakenweg: null });
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'hakenweg-nicht-gesetzt');
});

test('ein Hakenweg, der woandershin zeigt, ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), hakenweg: '.git/hooks' });
  assert.equal(b.meldungen[0].regel, 'hakenweg-zeigt-woandershin');
});

test('ein fehlender Haken ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), dateien: [] });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['haken-fehlt']);
});

test('ein Haken ohne Ausführungsrecht ist ein Befund — git überspringt ihn wortlos', () => {
  const b = hakenbefund({ ...gut(), ausfuehrbar: () => false });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['haken-nicht-ausfuehrbar']);
});

test('für jedes ungerufene Werkzeug eine eigene Meldung', () => {
  const b = hakenbefund({ ...gut(), lies: () => '#!/bin/sh\nexit 0\n' });
  const erwartet = HAKEN.reduce((n, h) => n + h.ruft.length, 0);
  assert.equal(b.meldungen.length, erwartet,
    'ein Haken, der zwei Werkzeuge rufen soll und keines ruft, hat zwei Mängel');
  assert.ok(b.meldungen.every((m) => m.regel === 'haken-ruft-nicht'));
});

test('ein Haken, der nur eines von zweien ruft, meldet genau dieses eine', () => {
  const [erstes, ...weitere] = HAKEN[0].ruft;
  const b = hakenbefund({ ...gut(), lies: () => `#!/bin/sh\n# ruft ${erstes}\n` });
  assert.equal(b.meldungen.length, weitere.length);
  for (const w of weitere) assert.ok(b.meldungen.some((m) => m.text.includes(w)));
});

test('ein Haken, der den offenen Zettel durchlässt, ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), probiere: () => ({ mitZettel: 0, ohneZettel: 0 }) });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['haken-laesst-durch']);
});

/**
 * Der grüne Fall, und der Grund, warum er hier steht: Am 6. September fiel
 * auf, dass sieben Sperren nur ihren eigenen Sperrgrund kannten. Eine Sperre,
 * die immer sperrt, besteht jede Prüfung der Form „sperrt sie?".
 */
test('ein Haken, der auch ohne Zettel sperrt, ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), probiere: () => ({ mitZettel: 1, ohneZettel: 1 }) });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['haken-sperrt-immer']);
});

test('ein Haken ohne Registereintrag ist ein Befund — die zweite Richtung', () => {
  const b = hakenbefund({ ...gut(), dateien: [...HAKEN.map((h) => h.name), 'post-merge'] });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['haken-ohne-eintrag']);
});

test('ein Gegenprobenläufer, der den Weg nicht setzt, ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), aufrufer: '// hier wird mutiert, sonst nichts' });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['niemand-setzt-den-weg']);
});

test('ohne Aufrufer wird der Aufrufer nicht beurteilt', () => {
  const b = hakenbefund({ ...gut(), aufrufer: null });
  assert.deepEqual(b.meldungen, []);
});

// **Ergänzt am 9. September 2026.** Der Haken sperrte jeden Commit, sobald das
// Erzeugnis älter war als die Quelle — ein `touch` genügte —, und meldete
// dabei „npm test ist rot". Die Sperre bleibt, denn `ausgabe/site` liegt im
// Verzeichnis; was fehlte, war der Anlass in der Meldung. Ein Satz im
// Hakenskript, den niemand nachliest, ist wieder nur ein Satz.
test('der Haken nennt den Anlass, wenn das Erzeugnis veraltet ist', () => {
  const skript = readFileSync(new URL('../haken/pre-commit', import.meta.url), 'utf8');
  assert.match(skript, /erzeugnispruefung\.mjs/);
  assert.match(skript, /Das Erzeugnis ist älter als die Quelle/);
  // Die Meldung nennt den Weg heraus und nicht nur die Sperre.
  assert.match(skript, /npm --prefix shop run website/);
});

test('das Register verlangt vom Haken die Frischeprüfung', () => {
  const eintrag = HAKEN.find((h) => h.name === 'pre-commit');
  assert.ok(eintrag.ruft.includes('bin/erzeugnispruefung.mjs'),
    'ohne Eintrag im Register hält haken-ruft-nicht das Skript nicht fest');
});

test('der Hakenprüfer liest das Erzeugnis durch den Haken hindurch', () => {
  const eintrag = LESER.find((l) => l.werkzeug === 'bin/hakenpruefung.mjs');
  assert.ok(eintrag, 'ohne Eintrag misst er den Haken über einem veralteten Stand');
  assert.equal(eintrag.erzeugnis, 'ausgabe/site');
});

/*
 * **Gate 38, 11. September 2026.** Der Haken rief vier der fünfundfünfzig
 * Prüfer, und warum die anderen draußen blieben, stand in Kommentaren.
 * Gemessen: drei Prüfer waren rot, einer seit dem 25. August, und kein Commit
 * hat das aufgehalten.
 */

test('jeder Prüfer läuft im Haken oder steht mit Grund draußen', () => {
  const alle = [...PRUEFER, ...BROWSERPRUEFER];
  assert.ok(alle.length >= 50, `nur ${alle.length} Prüfer im Register`);
  const b = auswahlbefund(alle);
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.imHaken + b.imSchnelllauf + b.draussen, alle.length,
    'jeder Prüfer gehört zu genau einer der drei Gruppen');
});

test('jeder Grund nennt die gestoppte Laufzeit', () => {
  // Ein Grund, der sich auf die Laufzeit beruft, muss die Zahl mitführen —
  // sonst ist er in einem halben Jahr eine Behauptung über einen Rechner,
  // den es nicht mehr gibt.
  assert.equal(NICHT_IM_HAKEN.length, 8, `${NICHT_IM_HAKEN.length} Ausnahmen`);
  for (const e of NICHT_IM_HAKEN) {
    assert.equal(typeof e.sekunden, 'number', `${e.pruefer}: keine gestoppte Zeit`);
    assert.ok(e.warum.length >= 80, `${e.pruefer}: der Grund trägt den Verzicht nicht`);
  }
});

test('ein Grund, der auf einen erfundenen Prüfer zeigt, wird gemeldet', () => {
  const b = auswahlbefund(
    [{ name: 'pruefe-x', werkzeug: 'x.mjs' }],
    [],
    [{ pruefer: 'gibts-nicht', sekunden: 1, warum: 'x'.repeat(90) }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-ohne-pruefer']);
});

test('ein Prüfer, der zugleich läuft und ausgenommen ist, wird gemeldet', () => {
  // Die stille Sorte: Beide Seiten sehen für sich richtig aus.
  const b = auswahlbefund(
    [{ name: 'pruefe-x', werkzeug: 'x.mjs' }],
    ['bin/x.mjs'],
    [{ pruefer: 'pruefe-x', sekunden: 1, warum: 'x'.repeat(90) }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ausgenommen-und-drin']);
});

test('ein zu dünner Grund wird gemeldet', () => {
  const b = auswahlbefund(
    [{ name: 'pruefe-x', werkzeug: 'x.mjs' }],
    [],
    [{ pruefer: 'pruefe-x', sekunden: 1, warum: 'zu kurz' }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-zu-duenn']);
});

test('der Schnelllauf nimmt weder die Ausgenommenen noch die schon Gerufenen', () => {
  const alle = [...PRUEFER, ...BROWSERPRUEFER];
  const namen = new Set(imSchnelllauf(alle).map((p) => p.name));
  assert.ok(namen.size >= 40, `nur ${namen.size} im Schnelllauf`);
  assert.equal(NICHT_IM_HAKEN.length, 8, 'sonst prüft die Schleife bei leerer Liste nichts');
  for (const e of NICHT_IM_HAKEN) {
    assert.equal(namen.has(e.pruefer), false, `${e.pruefer} ist ausgenommen und läuft trotzdem`);
  }
  for (const n of ['pruefe-tests', 'pruefe-mutationen', 'pruefe-erzeugnis', 'pruefe-schaufenster']) {
    assert.equal(namen.has(n), false, `${n} steht schon als eigene Zeile im Haken`);
  }
});

test('das Register verlangt vom Haken den Schnelllauf', () => {
  const eintrag = HAKEN.find((h) => h.name === 'pre-commit');
  assert.ok(eintrag.ruft.includes('bin/schnelllauf.mjs'),
    'ohne Eintrag im Register hält haken-ruft-nicht das Skript nicht fest');
  const skript = readFileSync(new URL('../haken/pre-commit', import.meta.url), 'utf8');
  assert.match(skript, /schnelllauf\.mjs/);
  assert.match(skript, /npm --prefix shop run schnelllauf/, 'die Meldung nennt den Weg heraus');
});

test('der Schnelllauf lässt eine Weigerung durch und einen Fund nicht', () => {
  /**
   * **Beides gehört zusammen.** Wer Ausgang 2 wie einen Fund behandelt,
   * sperrt jeden Commit für immer — `pruefe-gebinde` kann seit dem Verlust
   * von `preise/poschacher-positionen.csv` nichts messen. Wer ihn verschweigt,
   * hat einen Prüfer, der nichts tut und grün aussieht.
   */
  const quelle = readFileSync(new URL('../bin/schnelllauf.mjs', import.meta.url), 'utf8');
  assert.match(quelle, /e\.status === 2/, 'die Weigerung hat einen eigenen Zweig');
  assert.match(quelle, /weigerungen\.push/, 'und wird gemeldet statt verschluckt');
  assert.match(quelle, /keine Entwarnung/, 'die Meldung sagt, dass sie keine ist');
});
