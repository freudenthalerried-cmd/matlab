import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LEITZAHLEN, LEITDOKUMENTE, schreibweisen, fundstellen, inSpanne, pruefeLeitzahlen,
  fremdeEinheit, EINHEITSZEICHEN,
} from '../src/leitzahlen.js';
import { rolloutplan } from '../src/rollout.js';

const ziel = JSON.parse(readFileSync(new URL('../data/zielgroessen.json', import.meta.url), 'utf8'));

/**
 * Was nicht aus den Zielgrößen folgt — dieselbe Zusammenstellung, die
 * `bin/leitzahlpruefung.mjs` macht. Die Probe muss die Leitzahlen so aufrufen
 * wie das Werkzeug; ein Aufruf ohne Umfeld meldete `null` und wäre rot
 * gewesen, ohne dass etwas kaputt ist.
 */
const umfeld = {
  keywordAnzahl: JSON.parse(readFileSync(new URL('../ausgabe/messliste-baustoff.json', import.meta.url), 'utf8'))
    .gruppen.reduce((k, g) => k + g.keywords.length, 0),
  // Dieselben Hauptfallwerte wie `npm run rollout` — kein Nachbau der Kette,
  // sondern derselbe Rechenweg. Wer sie hier zweitrechnete, hätte zwei Ketten
  // und prüfte die falsche.
  planTage: rolloutplan({ tagesbudget: 9.99, klickpreis: 1.5, quote: 0.01, frist: 90 }).gesamt,
};

test('Jede Leitzahl rechnet ihren gültigen Wert, statt ihn einzutragen', () => {
  assert.ok(LEITZAHLEN.length >= 3, `nur ${LEITZAHLEN.length} Leitzahlen im Register`);
  for (const lz of LEITZAHLEN) {
    assert.equal(typeof lz.jetzt, 'function', lz.id);
    const wert = lz.jetzt(ziel, umfeld);
    assert.ok(Number.isFinite(wert) && wert > 0, `${lz.id}: ${wert}`);
    assert.ok(lz.traegt && lz.traegt.length > 30, `${lz.id}: wofür sie steht, fehlt`);
  }
});

test('Jeder abgelöste Wert nennt Grund und eigene Bedingung', () => {
  const abgeloest = LEITZAHLEN.flatMap((lz) => lz.abgeloest);
  assert.ok(abgeloest.length >= 3, `nur ${abgeloest.length} abgelöste Werte — die Schleife prüfte zu wenig`);
  assert.ok(LEITZAHLEN.length >= 3, 'zu wenige Leitzahlen');
  for (const lz of LEITZAHLEN) {
    for (const a of lz.abgeloest) {
      assert.ok(a.weil && a.weil.length > 10, `${lz.id}/${a.wert}: der Grund fehlt`);
      assert.ok(a.bedingung instanceof RegExp, `${lz.id}/${a.wert}: die Bedingung fehlt`);
      assert.notEqual(a.wert, lz.jetzt(ziel, umfeld), `${lz.id}: ${a.wert} ist der gültige Wert`);
    }
  }
});

test('Die Bedingungen sind eng — eine, die überall gilt, ist keine', () => {
  // Der erste Anlauf hatte eine gemeinsame, weite Fassung und deckte 102 von
  // 103 Fundstellen. Diese Probe hält fest, dass keine Bedingung auf einen
  // gewöhnlichen Satz der Akte anspricht.
  const harmlos = 'Der Shop führt 46 Artikel und liefert in fünf Bezirke. Stand August, alte Fassung, damals.';
  assert.ok(LEITZAHLEN.flatMap((lz) => lz.abgeloest).length >= 3, 'zu wenige abgelöste Werte');
  for (const lz of LEITZAHLEN) {
    for (const a of lz.abgeloest) {
      assert.ok(!a.bedingung.test(harmlos), `${lz.id}/${a.wert}: die Bedingung trifft einen harmlosen Satz`);
    }
  }
});

test('Deutsche Schreibweisen werden gefunden', () => {
  const f = schreibweisen(45356);
  assert.ok(f.includes('45356'));
  assert.ok(f.some((x) => x === '45.356'));
});

test('Eine Zahl in einer Spanne ist keine Angabe', () => {
  // Die einzige Meldung des ersten Laufs, und sie war falsch.
  assert.equal(inSpanne('zwischen 60 und 70 Bestellungen', '70'), true);
  assert.equal(inSpanne('60 bis 70 Bestellungen', '70'), true);
  assert.equal(inSpanne('70 Bestellungen im Monat', '70'), false);
});

test('Die Zahl wird nicht in einer längeren zerschnitten', () => {
  assert.equal(fundstellen('Warenwert 145.356,20 €', 45356, { bedingung: /karte/i }).length, 0);
  assert.equal(fundstellen('Umsatz 45.356 €', 45356, { bedingung: /karte/i }).length, 1);
});

test('Eine abgelöste Zahl mit ihrer Bedingung in Sichtweite ist gedeckt', () => {
  const mit = 'Bei Kartenzahlung:\n\nnötiger Monatsumsatz 45.356 €';
  const ohne = 'nötiger Monatsumsatz 45.356 €';
  assert.equal(fundstellen(mit, 45356, { bedingung: /karte/i })[0].gedeckt, true);
  assert.equal(fundstellen(ohne, 45356, { bedingung: /karte/i })[0].gedeckt, false);
});

test('Die blanke abgelöste Zahl wird gemeldet', () => {
  const b = pruefeLeitzahlen('Der nötige Monatsumsatz liegt bei 45.356 €.', 'probe.md', ziel);
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.some((m) => m.leitzahl === 'noetiger-monatsumsatz'));
});

test('Ein führendes Dokument, das die Leitzahl gar nicht nennt, fällt auf', () => {
  const dokument = LEITDOKUMENTE[0];
  const b = pruefeLeitzahlen('Nichts von Belang.', dokument, ziel);

  // **Nicht mehr „alle", seit dem 3. September.** Eine Leitzahl kann für ein
  // einzelnes Leitdokument ausgenommen sein — die Länge der Kette gehört nicht
  // in `PARAMETER.md`, weil diese Datei Weisungen führt und keine Ergebnisse.
  // Die Ausnahme kostet einen Grund, und der wird hier mitgeprüft.
  const ausgenommen = LEITZAHLEN.filter((lz) => (lz.ohneLeitdokument ?? [])
    .some((a) => a.dokument.endsWith(dokument) || dokument.endsWith(a.dokument)));
  // Ohne diese Zusicherung prüften die beiden Schleifen darunter nichts,
  // sobald die Ausnahme wegfällt — und der Fall bliebe grün.
  assert.equal(ausgenommen.length, 1,
    `${ausgenommen.length} Ausnahmen für ${dokument} — erwartet ist genau eine (plan-gesamtdauer)`);
  for (const lz of ausgenommen) {
    assert.ok(lz.ohneLeitdokument.length >= 1, `${lz.id}: leere Ausnahmeliste`);
    for (const a of lz.ohneLeitdokument) {
      assert.ok(a.warum && a.warum.length >= 40, `${lz.id}: Ausnahme ohne belastbaren Grund`);
    }
  }

  assert.equal(b.meldungen.length, LEITZAHLEN.length - ausgenommen.length);
  assert.ok(b.meldungen.every((m) => m.text.includes('führt nichts')));
  for (const lz of ausgenommen) {
    assert.ok(!b.meldungen.some((m) => m.leitzahl === lz.id),
      `${lz.id} ist ausgenommen und wird trotzdem verlangt`);
  }
});

test('Im führenden Dokument darf die abgelöste Zahl nicht vor der gültigen stehen', () => {
  // Zwei Gegenproben liefen ins Leere, bevor diese Regel da war: Die
  // Bedingung in Sichtweite deckte auch die wieder eingesetzte alte Zahl.
  const gueltig = LEITZAHLEN.map((lz) => lz.jetzt(ziel, umfeld));
  const vorne = `Umsatz 45.356 € bei Karte.\n\n${gueltig.join(' und ')} und 67 Bestellungen.`;
  const b = pruefeLeitzahlen(vorne, LEITDOKUMENTE[0], ziel);
  assert.ok(b.meldungen.some((m) => m.text.includes('liest die erste Zahl')));
});

test('Ein gewöhnliches Dokument kennt die Reihenfolgeregel nicht', () => {
  const text = 'Umsatz 45.356 € bei Karte.\n\nHeute 43.396 €.';
  const b = pruefeLeitzahlen(text, 'irgendwo.md', ziel);
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));
});

/**
 * Eine Zahl mit fremder Einheit ist nicht diese Leitzahl.
 *
 * **Der Anlass, 4. September 2026.** In `STATUS.md` stand „hob den gemeinsamen
 * Anteil von 57 % auf 62 %" — ein Prozentwert aus der Dublettenmessung. Der
 * Prüfer meldete ihn als abgelöste **Tageszahl** des Rolloutplans.
 *
 * > **Ein Prüfer, der eine Prozentzahl für eine Tageszahl hält, wird beim
 * > dritten Fehlalarm abgeschaltet** — und findet dann auch den echten nicht
 * > mehr.
 */
test('eine Prozentzahl ist keine Tageszahl', () => {
  const text = 'Der Anteil stieg von 57 % auf 62 % — gemessen an den Artikelseiten.';
  assert.deepEqual(fundstellen(text, 57, { bedingung: /gibt es nicht/, einheit: 'tage' }), []);
  // Ohne Einheitsangabe bleibt die Zahl verdächtig — die sichere Richtung,
  // denn Leitzahlen stehen in dieser Akte oft nackt im Fließtext.
  assert.equal(fundstellen(text, 57, { bedingung: /gibt es nicht/ }).length, 1);
  // Und dieselbe Zahl in Tagen wird weiterhin gefunden.
  assert.equal(
    fundstellen('Die Kette dauerte 57 Tage.', 57, { bedingung: /gibt es nicht/, einheit: 'tage' }).length,
    1,
  );
});

test('die eigene Einheit deckt nicht, die fremde schon', () => {
  assert.equal(fremdeEinheit('Umsatz 57 € netto', 'Umsatz 57'.length, 'euro'), null);
  assert.equal(fremdeEinheit('Umsatz 57 € netto', 'Umsatz 57'.length, 'tage'), 'euro');
  assert.equal(fremdeEinheit('Anteil 57 % davon', 'Anteil 57'.length, 'tage'), 'prozent');
  // Kein Einheitszeichen: nichts entschieden, also nicht ausgeschlossen.
  assert.equal(fremdeEinheit('genau 57 Stück', 'genau 57'.length, 'tage'), null);
});

test('jede Leitzahl sagt, ob sie eine Einheit trägt', () => {
  assert.ok(LEITZAHLEN.length >= 4, 'das Register ist zu kurz');
  for (const lz of LEITZAHLEN) {
    assert.ok('einheit' in lz, `${lz.id}: sagt nicht, ob eine Einheit hinter der Zahl steht`);
    assert.ok(lz.einheit === null || lz.einheit in EINHEITSZEICHEN,
      `${lz.id}: „${lz.einheit}" steht in keinem Einheitszeichen`);
  }
});
