import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  GRUND_MINDESTLAENGE, OHNE_SPUR, QUELLE, SPUREN, gatebefund, gatesAusRegister,
  registerkopfbefund,
} from '../src/gatestand.js';

const WURZEL = new URL('../../', import.meta.url);
const lies = (datei) => {
  try {
    return readFileSync(new URL(datei, WURZEL), 'utf8');
  } catch {
    return null;
  }
};

test('Die Gates kommen aus dem Register, nicht aus einer Liste hier', () => {
  const text = lies(QUELLE);
  assert.ok(text, `${QUELLE} fehlt`);
  const gates = gatesAusRegister(text);
  assert.ok(gates.length >= 20, `nur ${gates.length} Gates gelesen`);

  // Lückenlos von 1 an: Eine Lücke wäre entweder ein Tippfehler im Register
  // oder ein zurückgenommenes Gate — beides gehört gesehen, nicht überlesen.
  const nummern = gates.map((g) => g.nr);
  assert.deepEqual(nummern, [...nummern].sort((a, b) => a - b));
  assert.deepEqual(nummern, nummern.map((_, i) => i + 1), 'die Nummern haben eine Lücke');

  // Weiter unten stehen dieselben Nummern noch zweimal — als Auslöser und als
  // Vorbehalt. Wer das ganze Dokument liest, zählt Gate 5 dreimal.
  assert.equal(new Set(nummern).size, nummern.length, 'eine Nummer kommt doppelt vor');
  for (const g of gates) assert.equal(typeof g.abschnitt, 'string');
});

test('Jede Gate-Entscheidung wirkt an einer Stelle — oder sagt, warum nicht', () => {
  const gates = gatesAusRegister(lies(QUELLE));
  const b = gatebefund({ gates, lies });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.equal(b.mitSpur + b.ohneSpur, b.gates, 'Spuren und Gründe decken nicht alle Gates');
});

test('Geprüft wird die Sache, nicht die Gate-Nummer', () => {
  // Ein Muster wie /Gate 25/ wäre wertlos: Es misst, ob jemand die Nummer in
  // einen Kommentar geschrieben hat, und belohnt genau das.
  assert.ok(SPUREN.length >= 5, `nur ${SPUREN.length} Spuren — die Schleife prüfte fast nichts`);
  for (const s of SPUREN) {
    assert.doesNotMatch(String(s.muster), /Gate\s*\\?\s*\d/, `Gate ${s.gate}: das Muster sucht die Nummer`);
    assert.ok(s.datei.startsWith('shop/'), `Gate ${s.gate}: ${s.datei} liegt außerhalb des Shops`);
    assert.ok(s.warum.length >= GRUND_MINDESTLAENGE, `Gate ${s.gate}: der Grund ist zu knapp`);
  }
});

test('Kein Gate steht in beiden Listen, und keine Liste erfindet eines', () => {
  const mitSpur = SPUREN.map((s) => s.gate);
  const ohne = OHNE_SPUR.flatMap((o) => o.gates);
  assert.ok(mitSpur.length >= 5 && ohne.length >= 1, 'zu wenige Einträge — die Prüfung ist hohl');
  assert.equal(new Set(mitSpur).size, mitSpur.length, 'ein Gate hat zwei Spuren');
  assert.equal(new Set(ohne).size, ohne.length, 'ein Gate steht zweimal ohne Spur');
  for (const nr of mitSpur) assert.ok(!ohne.includes(nr), `Gate ${nr} steht in beiden Listen`);
  for (const o of OHNE_SPUR) assert.ok(o.warum.length >= GRUND_MINDESTLAENGE, `Gates ${o.gates}: Grund zu knapp`);
});

test('Ein Gate ohne Eintrag und ein Eintrag ohne Gate fallen beide auf', () => {
  const gates = [{ nr: 1, abschnitt: 'x' }, { nr: 2, abschnitt: 'x' }];
  const spuren = [{ gate: 1, datei: 'shop/da.js', muster: /da/, warum: 'x'.repeat(GRUND_MINDESTLAENGE) }];

  const fehlt = gatebefund({ gates, lies: () => 'da', spuren, ohneSpur: [] });
  assert.deepEqual(fehlt.meldungen.map((m) => m.regel), ['gate-ohne-eintrag']);

  const zuviel = gatebefund({
    gates: [gates[0]],
    lies: () => 'da',
    spuren,
    ohneSpur: [{ gates: [9], warum: 'x'.repeat(GRUND_MINDESTLAENGE) }],
  });
  assert.deepEqual(zuviel.meldungen.map((m) => m.regel), ['eintrag-ohne-gate']);

  const weg = gatebefund({ gates: [gates[0]], lies: () => null, spuren, ohneSpur: [] });
  assert.deepEqual(weg.meldungen.map((m) => m.regel), ['spur-fehlt']);

  const anders = gatebefund({ gates: [gates[0]], lies: () => 'etwas anderes', spuren, ohneSpur: [] });
  assert.deepEqual(anders.meldungen.map((m) => m.regel), ['spur-passt-nicht']);

  const doppelt = gatebefund({
    gates: [gates[0]],
    lies: () => 'da',
    spuren,
    ohneSpur: [{ gates: [1], warum: 'x'.repeat(GRUND_MINDESTLAENGE) }],
  });
  assert.deepEqual(doppelt.meldungen.map((m) => m.regel), ['gate-doppelt']);
});

test('Ein anderer Abschnitt liefert kein Gate — und behauptet keines', () => {
  assert.deepEqual(gatesAusRegister('## Etwas anderes\n| **1** | x |\n'), []);
});

// **Ergänzt am 9. September 2026.** Der Kopf des Registers sagte
// „Vierundzwanzig Entscheidungen", die Überschrift darunter „Die einunddreißig
// Gates". Der Prüfer zählte beide Zahlen nie gegeneinander.
const kopftext = (stand, wort, ueberschrift, rest = 'Nachgetragen am 26. August.') => [
  '# Gate-Register',
  '',
  `Stand: ${stand}. **Maßgeblich für alle Gate-Fragen.** ${wort}`,
  'Entscheidungen sind über die Phasen verteilt gefallen.',
  '',
  '',
  `## Die ${ueberschrift} Gates`,
  '',
  rest,
].join('\n');

test('ein Kopf, der mit der gezählten Zahl übereinstimmt, meldet nichts', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-08-27', 'Vierundzwanzig', 'vierundzwanzig'),
    gates: 24,
  });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.sauber, true);
});

test('ein Kopf, der weniger nennt als gezählt sind, ist ein Befund', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-08-27', 'Vierundzwanzig', 'einunddreißig'),
    gates: 31,
  });
  const regeln = b.meldungen.map((m) => m.regel);
  assert.ok(regeln.includes('kopfzahl-abgeloest'));
  assert.ok(!regeln.includes('ueberschrift-abgeloest'),
    'die Überschrift stimmt hier — sie darf nicht mitgemeldet werden');
});

test('auch die Überschrift wird gehalten, nicht nur der Kopf', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-08-27', 'einunddreißig', 'vierundzwanzig'),
    gates: 31,
  });
  assert.ok(b.meldungen.some((m) => m.regel === 'ueberschrift-abgeloest'));
});

test('ein Kopfdatum vor dem jüngsten Datum im Text ist ein Befund', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-08-27', 'einunddreißig', 'einunddreißig', 'Nachgetragen am 7. September.'),
    gates: 31,
  });
  const m = b.meldungen.find((x) => x.regel === 'stand-aelter-als-der-inhalt');
  assert.ok(m);
  assert.match(m.text, /2026-09-07/);
});

test('ein Kopfdatum nach dem jüngsten Datum im Text ist keiner — das Register darf alt sein', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-09-09', 'einunddreißig', 'einunddreißig', 'Nachgetragen am 7. September.'),
    gates: 31,
  });
  assert.deepEqual(b.meldungen, []);
});

test('ohne ausgeschriebenes Datum im Text weigert sich der Prüfer, statt grün zu melden', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-08-27', 'einunddreißig', 'einunddreißig', 'Kein Datum hier.'),
    gates: 31,
  });
  assert.ok(b.meldungen.some((m) => m.regel === 'stand-nicht-messbar'));
});

test('ein unlesbares Zahlwort zählt nicht als null', () => {
  const b = registerkopfbefund({
    text: kopftext('2026-09-09', 'Ungefähreviele', 'einunddreißig'),
    gates: 31,
  });
  const regeln = b.meldungen.map((m) => m.regel);
  assert.ok(regeln.includes('kopf-ohne-zahl'));
  assert.ok(!regeln.includes('kopfzahl-abgeloest'),
    'ein nicht gelesenes Wort darf keinen Zahlenunterschied behaupten');
});

test('ohne gezählte Gates wird nicht verglichen', () => {
  const b = registerkopfbefund({ text: kopftext('2026-09-09', 'einunddreißig', 'einunddreißig'), gates: 0 });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nichts-gezaehlt']);
});

test('das echte Register hält seinen eigenen Kopf', () => {
  const text = readFileSync(new URL('../../docs/baustoff-shop/gate-register.md', import.meta.url), 'utf8');
  const b = registerkopfbefund({ text, gates: gatesAusRegister(text).length });
  assert.deepEqual(b.meldungen, []);
});
