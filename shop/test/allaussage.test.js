/**
 * Ein Testname, der alle sagt, und ein Rumpf, der eine prüft.
 *
 * **Der Anlass, 14. September 2026.** Am Vortag ist dieselbe Bauart dreimal
 * aufgefallen, jedes Mal durch Zufall und jedes Mal an einer anderen Stelle.
 *
 * > **Dreimal an einem Tag hat eine Zusicherung etwas anderes zugesichert, als
 * > ihr Name sagt.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALLQUANTOREN, ALLAUSSAGEN_GEPRUEFT, OFFENE_ALLAUSSAGEN_HOECHSTENS,
  traegtAllquantor, sichertMengeZu, allaussagebefund,
} from '../src/allaussage.js';

test('Ein Name mit Allquantor wird erkannt, einer ohne nicht', () => {
  assert.ok(ALLQUANTOREN.length >= 4, 'die Quantorenliste ist zu kurz');
  for (const wort of ALLQUANTOREN) {
    assert.equal(traegtAllquantor(`der Prüfer nennt ${wort} Lücke`), true, wort);
  }
  assert.equal(traegtAllquantor('Ein fehlender Betrag wird gemeldet'), false);
  // Ein Wort, das einen Quantor enthält, ist keiner: „Jederzeit" ist kein „jeder".
  assert.equal(traegtAllquantor('jederzeit kündbar'), false);
  assert.equal(traegtAllquantor(''), false);
});

/*
 * Drei Formen sichern eine Menge zu, alle drei im Bestand belegt — und eine
 * vierte, die es nicht tut.
 */
test('Eine Menge wird durch Schleife, deepEqual oder Anzahl zugesichert', () => {
  const proben = [
    ['for (const f of FELDER) { assert.ok(f); }', 'schleife'],
    ['FELDER.forEach((f) => assert.ok(f));', 'schleife'],
    ['assert.deepEqual(p.fehlend, [1, 2]);', 'deepEqual'],
    ['assert.equal(p.fehlend.length, FELDER.length - 2);', 'anzahl'],
    ['assert.ok(p.fehlend.length > 3);', 'anzahl'],
    ['assert.ok(p.fehlend.some((f) => /E-Mail/.test(f)));', null],
    ['assert.equal(p.vollstaendig, false);', null],
  ];
  assert.ok(proben.length >= 6, 'zu wenige Proben');
  for (const [rumpf, erwartet] of proben) {
    assert.equal(sichertMengeZu(rumpf), erwartet, `„${rumpf}" gilt als ${sichertMengeZu(rumpf)}`);
  }
});

/*
 * **Der Fall, der die Regel schärft.** Ein `.length` in der Meldung sagt über
 * das Geprüfte nichts — es beschreibt nur, was schiefging. Zählte es mit,
 * ginge jede Stichprobe mit einer guten Fehlermeldung als Allaussage durch.
 */
test('Ein .length in der Meldung zählt nicht als Zusicherung', () => {
  const nurMeldung = "assert.ok(p.fehlend.some((f) => /x/.test(f)), `nur ${p.fehlend.length} Felder`);";
  assert.equal(sichertMengeZu(nurMeldung), null, 'die Meldung gilt als Zusicherung');
  // Und die Gegenprobe: dasselbe `.length` vor dem Komma zählt.
  assert.equal(sichertMengeZu('assert.equal(p.fehlend.length, 3, `nur ${p.fehlend.length}`);'), 'anzahl');
});

test('Ein Name mit Allquantor ohne Mengenzusicherung wird gemeldet', () => {
  const faelle = [
    { titel: 'jede Lücke wird genannt', rumpf: 'assert.ok(x.some(f));', datei: 'test/x.js', zeile: 1 },
    { titel: 'ein Betrag fehlt', rumpf: 'assert.ok(x.some(f));', datei: 'test/x.js', zeile: 9 },
  ];
  const b = allaussagebefund(faelle, [], null);
  assert.equal(b.mitQuantor, 1, 'der Name ohne Quantor wurde mitgezählt');
  assert.equal(b.offen.length, 1);
  assert.equal(b.meldungen[0].regel, 'allaussage-ohne-menge');
  assert.match(b.meldungen[0].wo, /test\/x\.js:1/);

  // Mit Schleife im Rumpf ist derselbe Name gedeckt.
  const gedeckt = allaussagebefund(
    [{ titel: 'jede Lücke wird genannt', rumpf: 'for (const f of F) assert.ok(f);' }], [], null);
  assert.equal(gedeckt.sauber, true);
});

test('Die Gegenrichtung: ein Grund für einen Fall, den es nicht mehr gibt', () => {
  const grund = {
    titel: 'jede Lücke wird genannt',
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb diesen Satz '
      + 'bis über die achtzig Zeichen hinaus fortsetzt.',
  };
  const weg = allaussagebefund([{ titel: 'etwas anderes', rumpf: '' }], [grund], null);
  assert.ok(weg.meldungen.some((m) => m.regel === 'grund-ohne-fall'));

  // Und einer, der inzwischen eine Menge zusichert — auch das ist ein Zustand
  // von gestern, kein Freibrief.
  const gedeckt = allaussagebefund(
    [{ titel: grund.titel, rumpf: 'for (const f of F) assert.ok(f);' }], [grund], null);
  assert.ok(gedeckt.meldungen.some((m) => m.regel === 'grund-ohne-fall'));

  const duenn = allaussagebefund(
    [{ titel: 'jede Lücke', rumpf: 'assert.ok(1);' }],
    [{ titel: 'jede Lücke', warum: 'zu kurz' }], null);
  assert.ok(duenn.meldungen.some((m) => m.regel === 'grund-zu-duenn'));
});

test('Jede begründete Ausnahme nennt einen Titel und einen tragfähigen Grund', () => {
  assert.ok(ALLAUSSAGEN_GEPRUEFT.length >= 10,
    `nur ${ALLAUSSAGEN_GEPRUEFT.length} Einträge — ohne Bestand prüft die Schleife nichts`);
  for (const g of ALLAUSSAGEN_GEPRUEFT) {
    assert.ok(g.titel.length > 10, `${g.titel}: kein Titel`);
    assert.ok(traegtAllquantor(g.titel), `${g.titel}: trägt gar keinen Allquantor`);
    assert.ok(g.warum.length >= 80, `${g.titel}: Grund zu dünn`);
  }
  assert.equal(OFFENE_ALLAUSSAGEN_HOECHSTENS, 0,
    'die Schranke steht über null — dann liegt ein Vorrat an Fällen da, den niemand ansieht');
});

test('Die Sperrklinke meldet in beide Richtungen', () => {
  const offen = [{ titel: 'jede Lücke', rumpf: 'assert.ok(1);' }];
  assert.ok(allaussagebefund(offen, [], 0).meldungen.some((m) => m.regel === 'mehr-offene-als-erlaubt'));
  assert.ok(allaussagebefund(offen, [], 5).meldungen.some((m) => m.regel === 'sperrklinke-nachziehen'));
});
