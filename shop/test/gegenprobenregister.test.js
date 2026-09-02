import test from 'node:test';
import assert from 'node:assert/strict';
import { GEGENPROBEN, OHNE_GEGENPROBE, ARTEN, registerbefund } from '../src/gegenprobenregister.js';
import { PRUEFER } from '../src/pruefregister.js';

test('Jede Gegenprobe nennt Prüfer, Datei, Erwartung und Grund', () => {
  assert.ok(GEGENPROBEN.length >= 5, `nur ${GEGENPROBEN.length} Gegenproben`);
  for (const p of GEGENPROBEN) {
    assert.ok(p.pruefer && p.datei && p.was, p.id);
    assert.ok(ARTEN.includes(p.art), `${p.id}: ${p.art}`);
    assert.ok(p.erwartet instanceof RegExp, `${p.id}: ohne Erwartung ist jede rote Meldung recht`);
    assert.ok(p.warum.length >= 30, `${p.id}: der Grund fehlt`);
  }
});

test('Kein Prüfer bleibt ohne Gegenprobe und ohne Grund', () => {
  const b = registerbefund(PRUEFER.map((p) => p.name));
  assert.deepEqual(b.unerklaert, [], 'ein Prüfer ohne Gegenprobe ist eine Behauptung');
  assert.ok(b.gedeckt + b.begruendet >= PRUEFER.length, `${b.gedeckt + b.begruendet} von ${PRUEFER.length}`);
});

test('Jeder genannte Prüfer ist ein echter Befehl', async () => {
  // `pruefe-pruefer` steht bewusst nicht im Prüferregister — er prüft es. Er
  // ist aber ein npm-Befehl, und genau daran wird jeder Name gemessen: Ein
  // Tippfehler im Register wäre sonst eine Gegenprobe, die es nicht gibt.
  const { readFileSync } = await import('node:fs');
  const paket = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const namen = [...GEGENPROBEN.map((p) => p.pruefer), ...OHNE_GEGENPROBE.map((o) => o.pruefer)];
  assert.ok(namen.length >= 10, `nur ${namen.length} genannte Prüfer`);
  for (const n of namen) assert.ok(paket.scripts[n], `„${n}" ist kein npm-Befehl`);
});

test('Jeder Verzicht trägt seinen Grund', () => {
  // **Untergrenze auf 1 gesenkt am 02.09.** Sie stand auf 3, als die Liste
  // sieben Einträge hatte. An diesem Abend sind vier davon zu funktionierenden
  // Gegenproben geworden — die Zahl ist gefallen, weil die Sache besser wurde,
  // und eine Untergrenze, die das verbietet, hält den schlechteren Zustand
  // fest. Was die Zusicherung leisten soll, ist nur: Die Schleife darunter
  // läuft überhaupt.
  assert.ok(OHNE_GEGENPROBE.length >= 1, `nur ${OHNE_GEGENPROBE.length} begründete Verzichte`);
  for (const o of OHNE_GEGENPROBE) {
    assert.ok(o.warumKeine.length >= 30, `${o.pruefer}: der Grund ist zu knapp`);
  }
});

test('Ein Prüfer steht nicht zugleich mit und ohne Gegenprobe da', () => {
  const mit = new Set(GEGENPROBEN.map((p) => p.pruefer));
  assert.ok(mit.size >= 5 && OHNE_GEGENPROBE.length >= 1, 'zu wenige Einträge — die Schleife prüfte nichts');
  for (const o of OHNE_GEGENPROBE) {
    assert.ok(!mit.has(o.pruefer), `${o.pruefer} steht in beiden Listen`);
  }
});

test('Ein unvollständiger Eintrag wird abgewiesen, nicht gerechnet', () => {
  const ohneGrund = [{ id: 'x', pruefer: 'p', datei: 'd', art: 'anhaengen', text: 'y', erwartet: /x/, warum: 'kurz' }];
  assert.throws(() => registerbefund(['p'], ohneGrund, []), /Ohne Begründung/);
  const falscheArt = [{ ...ohneGrund[0], art: 'löschen', warum: 'ein hinreichend langer Grund für den Eintrag' }];
  assert.throws(() => registerbefund(['p'], falscheArt, []), /Mutationsart/);
  const halbesErsetzen = [{ id: 'x', pruefer: 'p', datei: 'd', art: 'ersetzen', erwartet: /x/, warum: 'ein hinreichend langer Grund für den Eintrag' }];
  assert.throws(() => registerbefund(['p'], halbesErsetzen, []), /suchen und ersetzen/);
});

test('Ein Prüfer, den weder Probe noch Grund kennt, fällt auf', () => {
  const b = registerbefund(['pruefe-erfunden'], [], []);
  assert.deepEqual(b.unerklaert, ['pruefe-erfunden']);
  assert.equal(b.vollstaendig, false);
});
