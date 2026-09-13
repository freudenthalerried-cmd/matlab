/**
 * Kennen die beiden Register einander?
 *
 * **Der Anlass, 11. September 2026.** `src/pruefregister.js` führt die
 * Prüfer, `src/gegenprobenregister.js` führt je Prüfer die Mutation, die ihn
 * rot machen muss. Beide beschreiben dieselbe Sache — was rot werden kann —,
 * und keines von beiden fragte das andere.
 *
 * Gemessen: acht Namen hatten eine Gegenprobe und standen in keinem
 * Prüferregister, darunter `wegprobe` mit dreien. Zwei Prüfer standen ohne
 * Gegenprobe und ohne begründeten Verzicht da.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PRUEFER, BROWSERPRUEFER, KEIN_PRUEFER, registerbefund } from '../src/pruefregister.js';
import { GEGENPROBEN, OHNE_GEGENPROBE } from '../src/gegenprobenregister.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SKRIPTE = Object.keys(
  JSON.parse(readFileSync(join(SHOP, 'package.json'), 'utf8')).scripts,
);

const echteLage = () => ({
  skripte: SKRIPTE,
  ausGegenproben: GEGENPROBEN.map((p) => p.pruefer),
  ohneGegenprobe: OHNE_GEGENPROBE.map((o) => o.pruefer),
  gibtEs: (werkzeug) => existsSync(join(SHOP, 'bin', werkzeug)),
});

test('beide Register decken sich', () => {
  const b = registerbefund(echteLage());
  assert.deepEqual(b.meldungen, []);
  assert.ok(b.pruefer >= 55, `nur ${b.pruefer} Prüfer im Register`);
});

test('jede Ausnahme nennt einen Befehl, den es gibt, und einen Grund, der trägt', () => {
  assert.ok(KEIN_PRUEFER.length >= 3, `nur ${KEIN_PRUEFER.length} Ausnahmen`);
  const namen = new Set([...PRUEFER, ...BROWSERPRUEFER].map((p) => p.name));
  for (const e of KEIN_PRUEFER) {
    assert.ok(SKRIPTE.includes(e.name), `${e.name} ist kein npm-Befehl`);
    assert.equal(namen.has(e.name), false, `${e.name} steht in beiden Listen`);
    assert.ok(e.warum.length >= 80, `${e.name}: der Grund trägt die Ausnahme nicht`);
  }
});

test('ein Befehl mit Gegenprobe, den kein Lauf fragt, ist ein Befund', () => {
  /**
   * **Die Richtung, wegen der es diese Prüfung gibt.** Eine Gegenprobe ist der
   * Beweis, dass ein Befehl rot werden kann und dass das jemandem wichtig war.
   * Steht er dann in keinem Lauf, hat der Bestand bewiesen, dass er anschlägt
   * — und fragt ihn nie. Genau so stand `wegprobe` mit drei Gegenproben da.
   */
  const b = registerbefund({
    ...echteLage(),
    ausGegenproben: ['wegprobe'],
    pruefer: [],
    kein: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['gegenprobe-ohne-platz']);
  assert.match(b.meldungen[0].text, /wegprobe/);
});

test('ein Prüfer ohne Gegenprobe und ohne Verzicht ist ein Befund', () => {
  const b = registerbefund({
    ...echteLage(),
    ausGegenproben: [],
    ohneGegenprobe: [],
    pruefer: [{ name: 'test', werkzeug: 'gesamtlauf.mjs' }],
    kein: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['pruefer-ohne-gegenprobe']);
});

test('ein begründeter Verzicht schweigt', () => {
  const b = registerbefund({
    ...echteLage(),
    ausGegenproben: [],
    ohneGegenprobe: ['test'],
    pruefer: [{ name: 'test', werkzeug: 'gesamtlauf.mjs' }],
    kein: [],
  });
  assert.deepEqual(b.meldungen, []);
});

test('ein Eintrag ohne Befehl und ein Werkzeug ohne Datei werden gemeldet', () => {
  const b = registerbefund({
    ...echteLage(),
    ausGegenproben: ['gibts-nicht'],
    ohneGegenprobe: ['gibts-nicht'],
    pruefer: [{ name: 'gibts-nicht', werkzeug: 'gibtsauchnicht.mjs' }],
    kein: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel).sort(),
    ['eintrag-ohne-befehl', 'eintrag-ohne-werkzeug']);
});

test('ein Name in beiden Listen wird gemeldet', () => {
  // Die stille Sorte: Beide Seiten sehen für sich richtig aus, und der Prüfer
  // liefe, während daneben steht, warum er nicht läuft.
  const b = registerbefund({
    ...echteLage(),
    ausGegenproben: ['test'],
    pruefer: [{ name: 'test', werkzeug: 'gesamtlauf.mjs' }],
    kein: [{ name: 'test', warum: 'x'.repeat(90) }],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['gefuehrt-und-ausgenommen']);
});

test('die drei Aufgenommenen stehen im Register', () => {
  // Sie standen am 11. September in keinem Lauf; zwei hatten Gegenproben.
  const namen = new Set([...PRUEFER, ...BROWSERPRUEFER].map((p) => p.name));
  for (const n of ['wegprobe', 'rollout', 'abnahme']) {
    assert.ok(namen.has(n), `${n} fehlt wieder im Register`);
  }
});

test('der Prüfer der Prüfer steht nicht in seiner eigenen Liste', () => {
  /**
   * **Der Eintrag, der beim ersten Versuch falsch war.** `pruefe-pruefer`
   * stand am 11. September eine halbe Stunde im Register oben. Er liest diese
   * Liste, um jeden Prüfer aufzurufen — mit sich selbst darin ruft er sich
   * selbst, und nicht einmal, sondern immer weiter: Im Prozessbaum standen
   * nach zehn Minuten neun Kopien.
   *
   * > **Ein Prüfer, der seine eigene Liste liest, gehört nicht hinein.**
   */
  const namen = new Set([...PRUEFER, ...BROWSERPRUEFER].map((p) => p.name));
  assert.equal(namen.has('pruefe-pruefer'), false,
    'er ruft jeden Eintrag auf — mit sich selbst darin endet der Lauf nie');
  const eintrag = KEIN_PRUEFER.find((e) => e.name === 'pruefe-pruefer');
  assert.ok(eintrag, 'und er steht mit Grund daneben, statt still zu fehlen');
  assert.match(eintrag.warum, /Schleife ohne Boden/);
});

test('jede Browserprobe hat eine Zeitschranke — und jede, die einen Browser startet, steht im Register', () => {
  /*
   * **Der Fund vom 13. September 2026.** Eine Weiterausfuhr blieb im
   * gebündelten Skript stehen; die Seite bekam kein laufendes Skript, und
   * `--dump-dom` wartete auf einen Zustand, der nicht mehr eintreten konnte.
   *
   * ```
   * ein Lauf über die echte Seite:   664 ms
   * derselbe Aufruf an jenem Tag:    > 20 Minuten, keine Zeile Ausgabe
   * ```
   *
   * `shopprobe` trug seit jeher 90 s, `bestellprobe` 120 s — `oberflaechenprobe`
   * und `wegprobe` trugen **keine**. Ausgerechnet die ohne Schranke war die
   * einzige Stelle, an der der tote Shop auffiel.
   *
   * > **Eine Probe ohne Zeitschranke meldet nicht „langsam", sondern gar
   * > nichts — und wer sie abbricht, hat den Befund weggeworfen.**
   *
   * Gemessen wird der **Quelltext** und nicht das Verhalten: Ein Lauf, der
   * heute schnell ist, ist keine Zusage über morgen.
   */
  const bin = join(SHOP, 'bin');
  const startetBrowser = (text) => /spawnSync\(chromium|fuehreAus\(chromium/.test(text);
  // Eine Schleife über eine leere Liste prüft nichts und meldet grün.
  assert.ok(BROWSERPRUEFER.length >= 4,
    `nur ${BROWSERPRUEFER.length} Browserprüfer im Register — dann misst dieser Fall zu wenig`);

  let geprueft = 0;
  for (const p of BROWSERPRUEFER) {
    const datei = join(bin, p.werkzeug);
    if (!existsSync(datei)) continue;
    const text = readFileSync(datei, 'utf8');
    if (!startetBrowser(text)) continue;
    geprueft += 1;
    assert.match(text, /timeout:\s*\d/,
      `${p.werkzeug} startet einen Browser ohne Zeitschranke — ein Hänger sieht dann aus wie eine langsame Maschine`);
  }
  assert.ok(geprueft >= 2, `nur ${geprueft} Browserproben angesehen — das misst zu wenig`);

  /*
   * Und die Gegenrichtung: Ein Werkzeug, das einen Browser startet und **nicht**
   * im Register steht, läuft in keinem Gesamtlauf mit — und niemand hält seine
   * Zahl gegen ein Mindestmaß.
   */
  const imRegister = new Set(BROWSERPRUEFER.map((p) => p.werkzeug));
  const draussen = readdirSync(bin)
    .filter((n) => n.endsWith('.mjs') && !imRegister.has(n))
    .filter((n) => startetBrowser(readFileSync(join(bin, n), 'utf8')));
  assert.deepEqual(draussen, [],
    'ein Werkzeug startet einen Browser und steht in keinem Register — es läuft in keinem '
    + 'Gesamtlauf mit, und niemand hält seine Zahl gegen ein Mindestmaß');
});
