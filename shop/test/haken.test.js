import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';

import { HAKEN, HAKENWEG, hakenbefund } from '../src/haken.js';
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
