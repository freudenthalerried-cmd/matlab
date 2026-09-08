import test from 'node:test';
import assert from 'node:assert/strict';

import { HAKEN, HAKENWEG, hakenbefund } from '../src/haken.js';

/**
 * Die Lage, in der alles stimmt. Jeder Testfall verbiegt genau eine Sache
 * daran — sonst misst man am Ende, dass mehrere Fehler gleichzeitig auffallen,
 * und nicht, dass jeder einzelne auffällt.
 */
const gut = () => ({
  hakenweg: HAKENWEG,
  dateien: HAKEN.map((h) => h.name),
  lies: (name) => `#!/bin/sh\nexec node "$W/${HAKEN.find((h) => h.name === name).ruft}"\n`,
  ausfuehrbar: () => true,
  probiere: () => ({ mitZettel: 1, ohneZettel: 0 }),
  aufrufer: "import { richteHakenEin } from './hakeneinrichtung.mjs';",
});

test('das Register nennt mindestens einen Haken, jeden mit Grund', () => {
  assert.ok(HAKEN.length >= 1);
  for (const h of HAKEN) {
    assert.ok(h.name, 'ein Haken ohne Namen ist nicht auffindbar');
    assert.ok(h.ruft, 'ein Haken, der nichts ruft, hält nichts auf');
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

test('ein Haken, der den Prüfer nicht ruft, ist ein Befund', () => {
  const b = hakenbefund({ ...gut(), lies: () => '#!/bin/sh\nexit 0\n' });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['haken-ruft-nicht']);
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
