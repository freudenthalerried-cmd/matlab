import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ZWILLINGE, zwillingsbefund, ohneKommentare, traegtZahl } from '../src/zwillingszahlen.js';
import { UST_SATZ } from '../src/preis.js';
import { UST } from '../src/kostenbild.js';
import { UST_SATZ_KUNDE } from '../src/shopkern.js';
import { ZIELMARGE } from '../src/baustoffkatalog.js';
import { annahmewert } from '../src/empfindlichkeit.js';

test('Jede geführte Zahl nennt Heimat, Ausfuhr und was sie bedeutet', () => {
  assert.ok(ZWILLINGE.length >= 3,
    `nur ${ZWILLINGE.length} Einträge — ohne Bestand prüft die Schleife darunter nichts`);
  for (const e of ZWILLINGE) {
    assert.match(e.heimat, /^(src|bin)\//, `${e.id} nennt keine Heimatdatei`);
    assert.ok(e.name.length > 2, `${e.id} nennt keine Ausfuhr`);
    assert.ok(e.was.length > 20, `${e.id} sagt nicht, was die Zahl bedeutet`);
    for (const a of e.ausnahmen) assert.ok(a.warum.length >= 40, `${a.datei}: Grund zu dünn`);
  }
});

test('Kommentare zählen nicht als Fundstelle — sonst fände der Prüfer jede Begründung', () => {
  assert.equal(ohneKommentare('const a = 1; // 0.20 steht hier nur im Satz').includes('0.20'), false);
  assert.equal(ohneKommentare('/* 0.20 */ const a = 1;').includes('0.20'), false);
  assert.equal(ohneKommentare('const ust = 0.20;').includes('0.20'), true);
  // Eine Adresse ist kein Kommentar.
  assert.equal(ohneKommentare("const u = 'https://x/y';").includes('https://x/y'), true);
});

test('Eine Zahl, die zweimal im Quelltext steht, wird gemeldet', () => {
  const eintrag = [{
    id: 'probe',
    literal: '0.42',
    heimat: 'src/heim.js',
    name: 'WERT',
    was: 'eine Zahl, die es nur einmal geben darf',
    ausnahmen: [],
  }];
  const sauber = zwillingsbefund(new Map([['src/heim.js', 'export const WERT = 0.42;']]), eintrag);
  assert.equal(sauber.sauber, true);

  const doppelt = zwillingsbefund(new Map([
    ['src/heim.js', 'export const WERT = 0.42;'],
    ['src/anderswo.js', 'const eigen = 0.42;'],
  ]), eintrag);
  assert.equal(doppelt.meldungen[0].regel, 'zahl-zweimal');
  assert.match(doppelt.meldungen[0].text, /anderswo/);
});

test('Die Gegenrichtung: eine Heimat ohne ihre Zahl und eine Ausnahme ohne Fundstelle', () => {
  const eintrag = [{
    id: 'probe',
    literal: '0.42',
    heimat: 'src/heim.js',
    name: 'WERT',
    was: 'eine Zahl, die es nur einmal geben darf',
    ausnahmen: [{ datei: 'src/alt.js', warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten.' }],
  }];
  const b = zwillingsbefund(new Map([['src/heim.js', 'export const WERT = 0.43;']]), eintrag);
  const regeln = b.meldungen.map((m) => m.regel);
  assert.ok(regeln.includes('heimat-ohne-zahl'));
  assert.ok(regeln.includes('ausnahme-ohne-fund'), 'ein Grund für einen Zustand, den es nicht gibt');
});

test('Eine längere Zahl trifft nicht auf ihre eigene Vorsilbe', () => {
  const eintrag = [{
    id: 'probe', literal: '0.02', heimat: 'src/heim.js', name: 'Q',
    was: 'eine Zahl, die es nur einmal geben darf', ausnahmen: [],
  }];
  // 0.025 und 10.02 sind andere Zahlen. Ein Prüfer, der sie mitnimmt, zwingt
  // Ausnahmen für Dinge, die nie eine Kopie waren.
  const b = zwillingsbefund(new Map([
    ['src/heim.js', 'export const Q = 0.02;'],
    ['src/anderswo.js', 'const a = 0.025; const b = 10.02;'],
  ]), eintrag);
  assert.equal(b.sauber, true);
});

/*
 * Die vier Fassungen des Steuersatzes, an einer Stelle gehalten. `kontrolle.js`
 * führt bewusst eine eigene und wird von `test/kontrolle.test.js` gegen die
 * Heimat gehalten — dort, weil die Kontrolle ihren Prüfling nicht importieren
 * soll.
 */
test('Steuersatz, Zielmarge und Kaufquote sind je eine Zahl', () => {
  assert.equal(UST, UST_SATZ, 'die Gebührenkaskade rechnet mit einem anderen Steuersatz');
  assert.equal(UST_SATZ_KUNDE, UST_SATZ, 'die Oberfläche rechnet mit einem anderen Steuersatz');
  assert.equal(annahmewert('rohmarge'), ZIELMARGE,
    'die Empfindlichkeitsrechnung misst die Empfindlichkeit eines anderen Plans');
});

test('verglichen werden Zahlen, nicht Schreibweisen', () => {
  /*
   * **Der Fund vom 13. September 2026.** Dieses Register verglich
   * Zeichenketten: gesucht wurde `0.20`, und `0.2` fand es nicht.
   *
   * > **Zwei Schreibweisen derselben Zahl sind dieselbe Zahl. Ein Register,
   * > das Zeichen vergleicht statt Werte, führt genau die Zwillinge, die
   * > niemand versteckt hat.**
   *
   * Verborgen blieben zwei Fundstellen des Steuersatzes, beide als `0.2`: die
   * begründete in `src/shopkern.js` und eine **unbegründete** in
   * `src/skonto.js`, dort als Vorgabewert einer Parameterliste — genau die
   * Bauart, die `shopkern.js` am 30. August bei sich selbst beschrieben hat:
   * *„nicht falsch, aber unauffindbar."*
   */
  assert.equal(traegtZahl('const ust = 0.2;', '0.20'), true,
    '0.2 und 0.20 gelten wieder als verschiedene Zahlen');
  assert.equal(traegtZahl('const ust = 0.20;', '0.2'), true);
  assert.equal(traegtZahl('const x = 0.2500;', '0.25'), true);

  /*
   * Und die Fallen, die das alte Muster schon kannte: Eine Zahl ist ein
   * eigenes Wort. `0.20` steckt in `0.255`, in `10.20` und in einem
   * Bezeichner wie `satz0_20` — keines davon ist der Steuersatz.
   */
  assert.equal(traegtZahl('const x = 0.255;', '0.20'), false, 'trifft in einer längeren Zahl');
  assert.equal(traegtZahl('const x = 10.20;', '0.20'), false, 'trifft in einer größeren Zahl');
  assert.equal(traegtZahl('const satz0 = 1;', '0'), false, 'trifft in einem Bezeichner');
  assert.equal(traegtZahl('const x = 0.2;', '0.25'), false);
  assert.equal(traegtZahl('', '0.20'), false);
});

test('der Steuersatz steht in skonto.js nicht mehr als Vorgabewert', () => {
  /*
   * Gemessen wird der **Quelltext** und nicht das Ergebnis: Dass der
   * Vorgabewert heute denselben Wert hätte, ist kein Schutz — er ist eine
   * zweite Zahl, und eine zweite Zahl ist irgendwann alt.
   */
  const quelle = readFileSync(fileURLToPath(new URL('../src/skonto.js', import.meta.url)), 'utf8');
  assert.match(quelle, /ust = UST_SATZ/,
    'skonto.js trägt den Steuersatz wieder als eigene Zahl');
  assert.doesNotMatch(quelle, /ust = 0\.2\b/);
});
