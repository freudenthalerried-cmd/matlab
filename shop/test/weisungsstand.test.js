import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import {
  GRUND_MINDESTLAENGE, QUELLE, WEISUNGEN, KOPFZEILEN, KEIN_WEISUNGSKOPF,
  weisungenAusParametern, weisungsbefund, quellenbefund,
} from '../src/weisungsstand.js';

const WURZEL = new URL('../../', import.meta.url);
const lies = (datei) => {
  try {
    return readFileSync(new URL(datei, WURZEL), 'utf8');
  } catch {
    return null;
  }
};

test('Die Weisungen kommen aus PARAMETER.md, nicht aus einer Liste hier', () => {
  const text = lies(QUELLE);
  assert.ok(text, `${QUELLE} fehlt`);
  const w = weisungenAusParametern(text);
  assert.ok(w.length >= 5, `nur ${w.length} Weisungen gelesen`);
  assert.deepEqual(w.map((x) => x.nr), w.map((_, i) => i + 1));
  for (const x of w) assert.match(x.datum, /^\d{2}\.\d{2}\.$/);

  // Unter der Weisungstabelle steht eine zweite mit den unveränderten
  // Parametern — Zielmarkt, Zielgröße, Logistik. Sie hat keine Datumsspalte,
  // und genau daran hört das Lesen auf.
  assert.ok(!w.some((x) => /Zielmarkt|Startbudget/.test(x.weisung)), 'die zweite Tabelle ist mitgelesen');
});

test('Jede Weisung wirkt an einer Stelle — oder steht als offener Punkt', () => {
  const weisungen = weisungenAusParametern(lies(QUELLE));
  const b = weisungsbefund({ weisungen, lies });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.equal(b.erfuellt + b.offen, WEISUNGEN.length);
  assert.ok(b.offen >= 1, 'keine offene Weisung — dann wäre der dritte Zustand nie geprüft');
});

test('Geprüft wird die Sache, nicht das Datum', () => {
  // Ein Muster, das nach „28.08." sucht, misst, ob jemand das Datum in einen
  // Kommentar geschrieben hat.
  assert.ok(WEISUNGEN.length >= 5, `nur ${WEISUNGEN.length} Einträge — die Schleife prüft fast nichts`);
  for (const w of WEISUNGEN) {
    const stellen = w.spuren ?? [w.offen];
    assert.ok(stellen.length >= 1, `Weisung ${w.nr}: keine einzige Stelle — die Schleife prüft nichts`);
    for (const s of stellen) {
      assert.doesNotMatch(String(s.muster), /\d{2}\\?\.\d{2}/, `Weisung ${w.nr}: das Muster sucht das Datum`);
      assert.ok(s.datei.startsWith('shop/'), `Weisung ${w.nr}: ${s.datei} liegt außerhalb des Shops`);
    }
    assert.ok(w.warum.length >= GRUND_MINDESTLAENGE, `Weisung ${w.nr}: der Grund ist zu knapp`);
    assert.equal(!!w.spuren === !!w.offen, false, `Weisung ${w.nr}: der Zustand ist nicht eindeutig`);
  }
});

test('Vergessen, verschoben, verschwunden — alle drei fallen auf', () => {
  const grund = 'x'.repeat(GRUND_MINDESTLAENGE);
  const eintrag = {
    nr: 1, datum: '01.01.', stichwort: 's', warum: grund,
    spuren: [{ datei: 'shop/da.js', muster: /da/ }],
  };
  const weisungen = [{ nr: 1, datum: '01.01.', weisung: 'w' }, { nr: 2, datum: '02.01.', weisung: 'w' }];

  const vergessen = weisungsbefund({ weisungen, lies: () => 'da', register: [eintrag] });
  assert.deepEqual(vergessen.meldungen.map((m) => m.regel), ['weisung-vergessen']);

  const verschoben = weisungsbefund({
    weisungen: [{ nr: 1, datum: '09.09.', weisung: 'w' }],
    lies: () => 'da',
    register: [eintrag],
  });
  assert.deepEqual(verschoben.meldungen.map((m) => m.regel), ['weisung-verschoben']);

  const weg = weisungsbefund({ weisungen: [weisungen[0]], lies: () => 'etwas anderes', register: [eintrag] });
  assert.deepEqual(weg.meldungen.map((m) => m.regel), ['spur-passt-nicht']);

  const zuviel = weisungsbefund({ weisungen: [], lies: () => 'da', register: [eintrag] });
  assert.deepEqual(zuviel.meldungen.map((m) => m.regel), ['eintrag-ohne-weisung']);

  // Ein offener Punkt, den die Liste nicht mehr führt, ist entweder erfüllt
  // (dann gehört eine Spur her) oder unter den Tisch gefallen.
  const offen = { ...eintrag, spuren: undefined, offen: { datei: 'shop/da.js', muster: /steht hier nicht/ } };
  const still = weisungsbefund({ weisungen: [weisungen[0]], lies: () => 'da', register: [offen] });
  assert.deepEqual(still.meldungen.map((m) => m.regel), ['offener-punkt-verschwunden']);

  const unklar = { ...eintrag, offen: { datei: 'shop/da.js', muster: /da/ } };
  const beides = weisungsbefund({ weisungen: [weisungen[0]], lies: () => 'da', register: [unklar] });
  assert.deepEqual(beides.meldungen.map((m) => m.regel), ['zustand-unklar']);
});

test('Ein anderer Abschnitt liefert keine Weisung — und behauptet keine', () => {
  assert.deepEqual(weisungenAusParametern('## Etwas anderes\n| 01.01. | x | y |\n'), []);
});

/*
 * **Die andere Richtung, 11. September 2026.** Dieser Prüfer hielt die Tafel
 * gegen den Bestand und meldete „0 vergessen". Die Zahl stimmte und sagte
 * weniger, als sie klang: Er misst die Tafel, nicht das, was der Auftraggeber
 * gesagt hat. Fünf Weisungen standen in Dokumenten, die sie im Wortlaut
 * festhalten, und in keiner Zeile.
 */

test('jedes Dokument, das eine Weisung festhält, hat eine Zeile in der Tafel', () => {
  const tafel = readFileSync(new URL(`../../${QUELLE}`, import.meta.url), 'utf8');
  const ordner = new URL('../../docs/baustoff-shop/', import.meta.url);
  const dokumente = readdirSync(ordner)
    .filter((n) => n.endsWith('.md'))
    .map((datei) => ({
      datei,
      kopf: readFileSync(new URL(datei, ordner), 'utf8').split('\n').slice(0, KOPFZEILEN).join('\n'),
    }));
  assert.ok(dokumente.length >= 200, `nur ${dokumente.length} Dokumente gelesen`);
  const b = quellenbefund(dokumente, weisungenAusParametern(tafel), tafel);
  assert.ok(b.quellen >= 5, `nur ${b.quellen} Dokumente halten eine Weisung fest`);
  assert.deepEqual(b.meldungen, []);
});

test('ein Dokument ohne Zeile in der Tafel ist ein Befund', () => {
  const b = quellenbefund(
    [{ datei: 'x.md', kopf: 'Stand: 2026-09-11. Weisung des Auftraggebers: tu dies.' }],
    [{ nr: 1, datum: '11.09.', weisung: 'tu dies' }],
    '| 11.09. | tu dies | ohne Beleg |',
    [],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['weisung-ohne-zeile']);
});

test('eine Zeile, die das Dokument nennt, schweigt', () => {
  const b = quellenbefund(
    [{ datei: 'x.md', kopf: 'Weisung des Auftraggebers: tu dies.' }],
    [{ nr: 1, datum: '11.09.', weisung: 'tu dies' }],
    '| 11.09. | tu dies | im Wortlaut in [`x.md`](./x.md) |',
    [],
  );
  assert.deepEqual(b.meldungen, []);
});

test('kein einziges gefundenes Dokument ist kein grünes Ergebnis', () => {
  // Ein Prüfer, der nichts findet, hat nichts geprüft — und muss das sagen.
  const b = quellenbefund([{ datei: 'x.md', kopf: 'ohne die Wendung' }], [], 'Tafel', []);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['keine-quelle-gefunden']);
});

test('jede Ausnahme zeigt auf ein Dokument und trägt einen Grund', () => {
  assert.equal(KEIN_WEISUNGSKOPF.length, 1, `${KEIN_WEISUNGSKOPF.length} Ausnahmen`);
  for (const a of KEIN_WEISUNGSKOPF) {
    assert.ok(a.warum.length >= 80, `${a.datei}: der Grund trägt die Ausnahme nicht`);
  }
  const b = quellenbefund(
    [{ datei: 'x.md', kopf: 'Weisung des Auftraggebers: tu dies.' }],
    [], '| x.md |',
    [{ datei: 'gibts-nicht.md', warum: 'x'.repeat(90) }],
  );
  assert.ok(b.meldungen.some((m) => m.regel === 'ausnahme-ohne-dokument'),
    JSON.stringify(b.meldungen));
});

test('die Überschrift der Startseite ist geführt, nicht vergessen', () => {
  /**
   * **Die teuerste der fünf nachgetragenen Weisungen.** Der Auftraggeber hat
   * am 3. September gesagt, „Baustoffe zum Baumeisterpreis" solle nicht
   * bleiben. Am 11. September stand der Satz noch in der `<h1>` — nicht
   * erfüllt, und in keiner Liste offener Punkte. Vergessen also, und der
   * Prüfer konnte es nicht sehen, weil die Weisung in keiner Zeile stand.
   */
  const w = WEISUNGEN.find((e) => e.stichwort.includes('Baustoffe zum Baumeisterpreis'));
  assert.ok(w, 'die Weisung fehlt wieder im Register');
  assert.ok(w.offen, 'sie ist nicht erfüllt und muss als offener Punkt geführt sein');
  assert.match(w.offen.datei, /offenepunkte/);
});
