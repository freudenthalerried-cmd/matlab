import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  GRUND_MINDESTLAENGE, QUELLE, WEISUNGEN, weisungenAusParametern, weisungsbefund,
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
