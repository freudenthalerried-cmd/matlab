import { test } from 'node:test';
import assert from 'node:assert/strict';

import { KOPFZEILEN, kopfbefund } from '../src/statuskopf.js';

const kopf = (stand, n) => `# Status und Einstieg\n\n`
  + `Stand: ${stand}. **Dieses Dokument zuerst lesen.** ${n} Arbeitsdateien\n`
  + `sind entstanden, mehrere davon korrigieren einander.\n\n`
  + `Irgendein Fließtext mit Stand: 2020-01-01. und 7 Arbeitsdateien weiter unten.\n`;

test('stimmen Zahl und Datum, meldet der Kopfbefund nichts', () => {
  const b = kopfbefund({ text: kopf('2026-09-05', 338), dateien: 338, zuletzt: '2026-09-05' });
  assert.equal(b.sauber, true);
  assert.equal(b.stand, '2026-09-05');
  assert.equal(b.genannt, 338);
});

test('eine abgelöste Zahl im Kopf wird gemeldet — der Fall vom 5. September', () => {
  const b = kopfbefund({ text: kopf('2026-09-05', 155), dateien: 338, zuletzt: '2026-09-05' });
  const m = b.meldungen.find((x) => x.regel === 'zahl-abgeloest');
  assert.ok(m, 'zahl-abgeloest fehlt');
  assert.match(m.text, /155/);
  assert.match(m.text, /338/);
});

test('ein Stand vor dem jüngsten Eingriff wird gemeldet', () => {
  const b = kopfbefund({ text: kopf('2026-08-30', 338), dateien: 338, zuletzt: '2026-09-05' });
  assert.ok(b.meldungen.some((m) => m.regel === 'stand-abgeloest'));
});

test('ein Stand nach dem jüngsten Eingriff ist in Ordnung — nichts geschehen heißt nichts nachführen', () => {
  const b = kopfbefund({ text: kopf('2026-09-05', 338), dateien: 338, zuletzt: '2026-09-01' });
  assert.equal(b.sauber, true);
});

test('nicht messbar ist nicht grün', () => {
  const b = kopfbefund({ text: kopf('2026-09-05', 338), dateien: 338, zuletzt: '' });
  assert.ok(b.meldungen.some((m) => m.regel === 'stand-nicht-messbar'));
  assert.equal(b.sauber, false);
});

test('ein Abgleich über null Dateien ist kein Befund, sondern eine Meldung', () => {
  const b = kopfbefund({ text: kopf('2026-09-05', 338), dateien: 0, zuletzt: '2026-09-05' });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nichts-gezaehlt']);
  assert.equal(b.sauber, false);
});

test('fehlt die Zahl im Kopf, ist das kein stilles Bestehen', () => {
  const ohne = '# Status\n\nStand: 2026-09-05. Hier steht, was gilt.\n';
  const b = kopfbefund({ text: ohne, dateien: 338, zuletzt: '2026-09-05' });
  assert.ok(b.meldungen.some((m) => m.regel === 'kopf-ohne-zahl'));
});

test('fehlt das Datum im Kopf, ist das kein stilles Bestehen', () => {
  const ohne = '# Status\n\n338 Arbeitsdateien sind entstanden.\n';
  const b = kopfbefund({ text: ohne, dateien: 338, zuletzt: '2026-09-05' });
  assert.ok(b.meldungen.some((m) => m.regel === 'kopf-ohne-stand'));
});

/**
 * **Der Kopf ist der Kopf.** Ohne diese Grenze läse der Prüfer die datierten
 * Absätze weiter unten mit — „Stand 29. August 2026. … Neun Prüfer" ist heute
 * falsch und trotzdem richtig aufgeschrieben, weil es sein Datum bei sich
 * trägt und einen vergangenen Stand beschreibt.
 */
test('nur die ersten Zeilen zählen — datierte Absätze weiter unten bleiben unangetastet', () => {
  const text = `# Status\n\nStand: 2026-09-05. **Zuerst lesen.** 338 Arbeitsdateien\n`
    + `sind entstanden.\n\n`
    + `${'\n'.repeat(KOPFZEILEN)}Stand: 2020-01-01. Damals waren es 9 Arbeitsdateien.\n`;
  const b = kopfbefund({ text, dateien: 338, zuletzt: '2026-09-05' });
  assert.equal(b.sauber, true);
});

test('der Tausenderpunkt im Kopf wird gelesen, nicht abgeschnitten', () => {
  const b = kopfbefund({ text: kopf('2026-09-05', '1.204'), dateien: 1204, zuletzt: '2026-09-05' });
  assert.equal(b.genannt, 1204);
  assert.equal(b.sauber, true);
});
