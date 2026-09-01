import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zahlAus, kennzahlen, pruefeSchaufenster } from '../src/schaufenster.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

test('zahlAus liest deutsche Schreibweise', () => {
  assert.equal(zahlAus('46'), 46);
  assert.equal(zahlAus('1.059'), 1059);
  assert.equal(zahlAus('8,22'), 8.22);
  assert.equal(zahlAus('132'), 132);
});

/**
 * Drei Ausgänge, und der mittlere ist der, um den es geht: Ein Muster, das
 * nichts mehr findet, ist ein **Fehler** und keine übersprungene Zeile. Wer
 * den Satz umschreibt, in dem eine Zahl steht, nimmt dem Prüfer den Anker —
 * und eine Wache ohne Anker ist eine Vermutung.
 */
test('Der Abgleich unterscheidet veraltet, ohne Anker und ungemessen', () => {
  const messwerte = { artikel: 46, gates: 24 };
  const nur = (name) => kennzahlen(messwerte).filter((k) => k.name === name);
  assert.equal(nur('Artikel im Katalog').length, 1, 'die Kennzahl fehlt — der Test prüft nichts');

  // Passt.
  let e = pruefeSchaufenster('… **46 echte Artikel** aus 15 Belegen …',
    { ...messwerte, artikel: 46 });
  assert.deepEqual(e.meldungen.filter((m) => m.name === 'Artikel im Katalog'), []);

  // Zahl veraltet.
  e = pruefeSchaufenster('… **46 echte Artikel** aus 15 Belegen …', { ...messwerte, artikel: 52 });
  const veraltet = e.meldungen.find((m) => m.name === 'Artikel im Katalog');
  assert.equal(veraltet.art, 'veraltet');
  assert.equal(veraltet.ist, 46);
  assert.equal(veraltet.soll, 52);

  // Satz umgeschrieben — der Anker ist weg.
  e = pruefeSchaufenster('… sechsundvierzig echte Artikel …', messwerte);
  assert.equal(e.meldungen.find((m) => m.name === 'Artikel im Katalog').art, 'anker');

  // Kein Messwert: Der Prüfer sagt das, statt die Zeile stillschweigend
  // durchzuwinken. Ein `undefined === undefined` wäre grün gewesen.
  e = pruefeSchaufenster('… **46 echte Artikel** …', { gates: 24 });
  assert.equal(e.meldungen.find((m) => m.name === 'Artikel im Katalog').art, 'ungemessen');
  assert.equal(e.sauber, false);
});

test('Jede Kennzahl bringt genau eine Fanggruppe mit', () => {
  const liste = kennzahlen({});
  assert.ok(liste.length >= 12, `nur ${liste.length} Kennzahlen — die Schleife prüft zu wenig`);
  for (const k of liste) {
    assert.ok(k.name && k.wie, `Kennzahl ohne Namen oder Herkunft: ${k.muster}`);
    // Eine Fanggruppe, nicht null und nicht zwei: `treffer[1]` wäre sonst
    // undefiniert oder die falsche Zahl.
    const gruppen = new RegExp(`${k.muster.source}|`).exec('').length - 1;
    assert.equal(gruppen, 1, `„${k.name}" hat ${gruppen} Fanggruppen statt einer`);
  }
});

/**
 * Der Abgleich gegen die echte Beschreibung — ohne die Messwerte, die einen
 * Bau oder einen Testlauf brauchen. Was hier geprüft wird, ist, dass **jedes
 * Muster in der Datei noch etwas findet**: Der Anker ist das, was am
 * leisesten verlorengeht.
 */
test('Jedes Muster findet seine Stelle in der echten Beschreibung', () => {
  const text = readFileSync(pfad('../../docs/baustoff-shop/pr-beschreibung.md'), 'utf8');
  const ohneAnker = kennzahlen({}).filter((k) => !k.muster.test(text));
  assert.deepEqual(ohneAnker.map((k) => k.name), [],
    'diese Kennzahlen haben in der Beschreibung keine Fundstelle mehr');
});

/**
 * Die Untergrenze für Zahlen, die sich täglich ändern. Ohne sie wäre der
 * Prüfer nach jeder neuen Probe rot, und ein Dauerroter wird abgeschaltet.
 * Geprüft werden **beide** Richtungen: überholt und nichtssagend.
 */
test('Eine Untergrenze gilt, solange sie stimmt und noch etwas sagt', () => {
  const mitGrenze = kennzahlen({ tests: 1 }).find((k) => k.art === 'mindestens');
  assert.ok(mitGrenze, 'keine Kennzahl mit Untergrenze — der Test prüft nichts');

  const satz = (n) => `| Testbestand | **über ${n} Testfälle**, alle grün |`;
  const meldung = (text, tests) =>
    pruefeSchaufenster(text, { tests }).meldungen.find((m) => m.name === 'Testfälle');

  // Gilt: 1.063 sind mehr als 1.000.
  assert.equal(meldung(satz('1.000'), 1063), undefined);
  // Genau darauf: „über 1.000" bei 1.000 stimmt nicht mehr.
  assert.match(meldung(satz('1.000'), 1000).grund, /gemessen sind nur/);
  // Überholt.
  assert.match(meldung(satz('1.200'), 900).grund, /gemessen sind nur/);
  // Nichtssagend: ab dem Doppelten gehört sie nachgezogen.
  assert.match(meldung(satz('1.000'), 2000).grund, /nichtssagend/);
  // Knapp darunter noch nicht.
  assert.equal(meldung(satz('1.000'), 1999), undefined);
});
