import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  ZWILLINGE, VORSCHLAG_GEPRUEFT, ENGE_SCHWELLE,
  KENNUNGSFELDER,
  zwillingsbefund, zwillingsvorschlag, benannteZahlen, zahlenIn, ohneKommentare, traegtZahl,
} from '../src/zwillingszahlen.js';
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

/*
 * **Was am 13. September dazukam.** Das Register führte drei Zahlen, und jede
 * davon stand darin, weil sie an einem Tag im September zufällig aufgefallen
 * war. Am Vortag wurde repariert, **wie** verglichen wird. Womit verglichen
 * wird, entschied weiter der Zufall.
 *
 * > **Ein Register, das nur führt, was jemand eingetragen hat, ist so
 * > vollständig wie die Aufmerksamkeit des Eintragenden.**
 */
test('Eine benannte Zahl mit ganz wenigen Fundstellen wird vorgeschlagen', () => {
  const quellen = new Map([
    ['src/heim.js', 'export const SATZ = 7.5;'],
    ['src/anderswo.js', 'const eigen = 7.5;'],
  ]);
  const befund = zwillingsvorschlag(quellen, [], []);
  assert.equal(befund.meldungen.length, 1, 'die enge Zahl wurde nicht vorgeschlagen');
  assert.equal(befund.meldungen[0].regel, 'zahl-im-engen-band');
  assert.match(befund.meldungen[0].text, /anderswo/);

  // Eine geführte Zahl ist kein Vorschlag mehr — sie ist entschieden.
  const gefuehrt = zwillingsvorschlag(quellen, [{
    id: 'p', literal: '7.5', heimat: 'src/heim.js', name: 'SATZ', was: 'x', ausnahmen: [],
  }], []);
  assert.equal(gefuehrt.sauber, true, 'eine geführte Zahl wird noch einmal vorgeschlagen');

  // Und eine abgehakte auch nicht.
  const abgehakt = zwillingsvorschlag(quellen, [], [{
    name: 'SATZ',
    wert: 7.5,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb '
      + 'diesen Satz bis über die achtzig Zeichen hinaus fortsetzt.',
  }]);
  assert.equal(abgehakt.sauber, true);
});

test('Rauschen wird nicht vorgeschlagen — eine Zahl in fünfzig Dateien ist Zufall', () => {
  const viele = new Map([['src/heim.js', 'export const TIEFE = 10;']]);
  for (let i = 0; i < ENGE_SCHWELLE + 1; i += 1) viele.set(`src/f${i}.js`, 'const x = 10;');
  assert.equal(zwillingsvorschlag(viele, [], []).sauber, true,
    `${ENGE_SCHWELLE + 1} Fundstellen gelten noch als enges Band`);

  // Und eine Zahl, die sonst nirgends steht, ist erst recht kein Zwilling.
  const allein = new Map([['src/heim.js', 'export const TIEFE = 10;']]);
  assert.equal(zwillingsvorschlag(allein, [], []).sauber, true);
});

test('Die Gegenrichtung: ein Haken für eine Zahl, die es nicht mehr gibt', () => {
  const haken = [{
    name: 'FORT',
    wert: 7.5,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb '
      + 'diesen Satz bis über die achtzig Zeichen hinaus fortsetzt.',
  }];
  const weg = zwillingsvorschlag(new Map([['src/heim.js', 'export const DA = 7.5;']]), [], haken);
  assert.equal(weg.meldungen[0].regel, 'haken-ohne-zahl');

  // Und einer für eine Zahl, die das enge Band verlassen hat: Sie steht jetzt
  // überall, also erklärt der Haken einen Zustand von gestern.
  const breit = new Map([['src/heim.js', 'export const FORT = 7.5;']]);
  for (let i = 0; i < ENGE_SCHWELLE + 1; i += 1) breit.set(`src/f${i}.js`, 'const x = 7.5;');
  assert.equal(zwillingsvorschlag(breit, [], haken).meldungen[0].regel, 'haken-ausserhalb-des-bandes');

  // Ein Haken ohne belastbaren Grund ist kein Haken.
  const duenn = zwillingsvorschlag(new Map([
    ['src/heim.js', 'export const KURZ = 7.5;'],
    ['src/da.js', 'const x = 7.5;'],
  ]), [], [{ name: 'KURZ', wert: 7.5, warum: 'zu kurz' }]);
  assert.ok(duenn.meldungen.some((m) => m.regel === 'haken-ohne-grund'));
});

test('Jeder geprüfte Vorschlag nennt, warum die Gleichheit Zufall ist', () => {
  assert.ok(VORSCHLAG_GEPRUEFT.length >= 5,
    `nur ${VORSCHLAG_GEPRUEFT.length} Haken — ohne Bestand prüft die Schleife darunter nichts`);
  for (const g of VORSCHLAG_GEPRUEFT) {
    assert.match(g.name, /^[a-zA-Z][a-zA-Z0-9_]*$/, `${g.name} ist kein Bezeichner`);
    assert.equal(typeof g.wert, 'number', `${g.name} hakt keinen bestimmten Wert ab`);
    assert.ok(g.warum.length >= 80, `${g.name}: Grund zu dünn`);
  }
  assert.ok(ENGE_SCHWELLE >= 1 && ENGE_SCHWELLE <= 10,
    `eine Schwelle von ${ENGE_SCHWELLE} misst nicht mehr das enge Band`);
});

/*
 * **Der Fund, der die Messung ausgelöst hat.** `shop-ui.js` liegt in der
 * Wurzel und in keinem der drei Ordner, die der Prüfer las — für ihn war die
 * Datei sauber. Sie trug die Höchstmenge zweimal als Literal, zwei
 * Bildschirmzeilen neben einem Knopf, der die Konstante liest.
 */
test('Die Oberfläche liest die Höchstmenge, statt sie zu tippen', () => {
  const quelle = readFileSync(fileURLToPath(new URL('../shop-ui.js', import.meta.url)), 'utf8');
  const felder = [...ohneKommentare(quelle).matchAll(/\.max = ([^;]+);/g)].map((m) => m[1].trim());
  assert.ok(felder.length >= 2, `nur ${felder.length} Mengenfelder gefunden — die Suche greift nicht`);
  for (const f of felder) {
    assert.equal(f, 'String(HOECHSTMENGE)', `ein Mengenfeld tippt seine Grenze: .max = ${f}`);
  }
});

/*
 * **Was am 13. September nachmittags dazukam.** Die Messung vom Vormittag las
 * `export const NAME = 0.25;`. Gemessen über denselben Bestand: 59 Zahlen
 * stehen so — und 218 in einem Objektfeld.
 *
 * > **Eine Messung, die nur eine Schreibweise liest, misst nicht den Bestand,
 * > sondern die Schreibweise.**
 *
 * Beweisbar an diesem Register selbst: Sein Eintrag `ANNAHMEN.umsatzProSession`
 * steht als `basis: 0.02` in einem Objekt. Die Messung hätte ihren eigenen
 * Eintrag nicht gefunden.
 */
test('Eine Zahl in einem Objektfeld ist eine benannte Zahl', () => {
  const gefunden = benannteZahlen([
    'export const AUSFUHR = 7.5;',
    '  basis: 0.02,',
    '    schwelle: 0.23',
    '  gate: 34,',
    '  summe: a + 5,',
    'nichtEingerueckt: 9,',
  ].join('\n'));
  assert.deepEqual(gefunden.map((g) => `${g.form}:${g.name}=${g.wert}`),
    ['ausfuhr:AUSFUHR=7.5', 'feld:basis=0.02', 'feld:schwelle=0.23'],
    'die Messung liest die falschen Zeilen');

  // Und der eigene dritte Eintrag ist damit auffindbar.
  const kaufquote = ZWILLINGE.find((z) => z.id === 'kaufquote');
  assert.ok(kaufquote, 'die Kaufquote steht nicht mehr im Register');
  assert.ok(benannteZahlen('  basis: 0.02,').some((g) => g.wert === Number(kaufquote.literal)),
    'die Messung findet den eigenen Eintrag des Registers nicht');
});

test('Eine fortlaufende Nummer ist kein Zwilling, sondern ein Name aus Ziffern', () => {
  assert.ok(KENNUNGSFELDER.includes('gate'), 'die Gate-Nummer zählt wieder als Größe');
  assert.ok(KENNUNGSFELDER.length >= 1,
    'die Kennungsliste ist leer — dann prüft die Schleife darunter nichts');
  for (const feld of KENNUNGSFELDER) {
    assert.deepEqual(benannteZahlen(`  ${feld}: 34,`), [],
      `${feld} wird als Größe gelesen`);
  }
  // Gegenprobe zur Ausnahme: Ein Feld, das nicht in der Liste steht, zählt.
  assert.equal(benannteZahlen('  schwelle: 34,').length, 1);
});

/*
 * Objektfelder heißen `basis`, `wert`, `mindestens`. In
 * `src/empfindlichkeit.js` tragen drei Annahmen ein Feld `basis` mit drei
 * verschiedenen Zahlen — ein Haken auf den Namen allein häkte alle drei ab.
 */
test('Ein Haken gilt für eine Zahl, nicht für einen Feldnamen', () => {
  const quellen = new Map([
    ['src/heim.js', '  basis: 7.5,\n  basis: 4.25,'],
    ['src/da.js', 'const a = 7.5; const b = 4.25;'],
  ]);
  const haken = [{
    name: 'basis',
    wert: 7.5,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb '
      + 'diesen Satz bis über die achtzig Zeichen hinaus fortsetzt.',
  }];
  const befund = zwillingsvorschlag(quellen, [], haken);
  const offen = befund.meldungen.filter((m) => m.regel === 'zahl-im-engen-band');
  assert.equal(offen.length, 1, 'der Haken auf den Namen hat beide Zahlen abgehakt');
  assert.match(offen[0].text, /4\.25/);
});

/*
 * `zahlenIn` beantwortet auf einmal, was `traegtZahl` einzeln beantwortet.
 * Zwei Lesarten derselben Sache sind zwei Lesarten — gemessen wird, dass sie
 * dieselbe bleiben.
 */
test('Die Mengenlesart und die Einzelfrage lesen dieselben Zahlen', () => {
  const proben = [
    'const a = 0.2; const b = 10.20; const c = satz0; const d = -3;',
    '  basis: 0.02,\n  gate: 34,\n  x: 2.49',
    'https://www.w3.org/2000/svg',
    '',
  ];
  assert.ok(proben.length >= 3, 'zu wenige Proben — dann prüft die Schleife darunter nichts');

  // Erst einsammeln, dann prüfen: Eine leere Probe gehört dazu (sie darf keine
  // Zahl tragen), und über eine leere Schleife lässt sich nichts zusichern.
  const gefunden = proben.flatMap((text) => [...zahlenIn(text)].map((zahl) => ({ text, zahl })));
  assert.ok(gefunden.length >= 7, `nur ${gefunden.length} Zahlen gelesen — die Proben tragen zu wenig`);
  for (const { text, zahl } of gefunden) {
    assert.equal(traegtZahl(text, zahl), true,
      `zahlenIn findet ${zahl}, traegtZahl nicht — in: ${text}`);
  }

  // Und die Gegenrichtung, an festen Kandidaten: Was die eine Lesart nicht
  // findet, darf die andere auch nicht finden.
  const kandidaten = [0.2, 0.02, 34, 2000, 2.49, -3, 999];
  assert.ok(kandidaten.length >= 5, 'zu wenige Kandidaten');
  for (const text of proben) {
    const menge = zahlenIn(text);
    for (const zahl of kandidaten) {
      assert.equal(menge.has(zahl), traegtZahl(text, zahl),
        `die beiden Lesarten sind bei ${zahl} uneins — in: ${text}`);
    }
  }
});
