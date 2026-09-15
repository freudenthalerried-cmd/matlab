/**
 * Wohin der Kunde überweist.
 *
 * **Der Anlass, 4. September 2026, spät.** Gate 21 hat Vorkasse ab Start
 * entschieden, und die Auftragsbestätigung sagt seither „Zahlbar sofort, ohne
 * Zahlungsziel". Sie ist damit das Dokument, auf das hin der Kunde zahlt —
 * und sie sagte ihm nicht, auf welches Konto.
 *
 * > **Ohne Kontonummer wartet der Kunde auf Ware und der Shop auf Geld.**
 *
 * Diese Proben halten drei Dinge fest: dass eine IBAN mit Zahlendreher
 * auffällt, dass die fehlende Bankverbindung als sichtbare Lücke auf dem
 * Papier steht statt still zu fehlen, und dass jedes Feld seinen Grund trägt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { AT_IBAN, BANKFELDER, bankzeilen, ibanPruefsummeStimmt } from '../src/bankverbindung.js';
import { LUECKE } from '../src/format.js';

test('die Prüfsumme trennt die IBAN vom Zahlendreher', () => {
  assert.equal(ibanPruefsummeStimmt('AT611904300234573201'), true);
  // Derselbe Betrag, zwei Ziffern vertauscht: sieht aus wie eine IBAN.
  assert.equal(ibanPruefsummeStimmt('AT611904300234573210'), false);
  // Leerzeichen und Kleinschreibung sind Schreibweise, kein Fehler.
  assert.equal(ibanPruefsummeStimmt('at61 1904 3002 3457 3201'), true);
  // Andere Länder gelten auch — der Kunde zahlt, wo der Betreiber ein Konto hat.
  assert.equal(ibanPruefsummeStimmt('DE89370400440532013000'), true);
  for (const unsinn of ['', null, undefined, 'AT', 'Bank Austria', 'AT00', 42]) {
    assert.equal(ibanPruefsummeStimmt(unsinn), false, `„${unsinn}" ist keine IBAN`);
  }
});

test('die österreichische Form ist zwanzig Stellen lang', () => {
  assert.equal(AT_IBAN.test('AT611904300234573201'), true);
  assert.equal(AT_IBAN.test('AT61190430023457320'), false, 'eine Stelle zu wenig');
  assert.equal(AT_IBAN.test('DE89370400440532013000'), false);
});

test('jedes Bankfeld trägt seinen Grund', () => {
  assert.equal(BANKFELDER.length, 2, 'Kontoinhaber und IBAN — mehr verlangt SEPA nicht');
  for (const f of BANKFELDER) {
    assert.ok(f.feld, 'ein Feld ohne Namen lässt sich nicht ausfüllen');
    assert.ok(f.bezeichnung, `${f.feld}: keine Beschriftung für die Lücke`);
    assert.ok(f.warum.length >= 80, `${f.feld}: Begründung zu kurz (${f.warum.length} Zeichen)`);
    // Aus den Beispielen bauen die Proben in `startklar.test.js` und
    // `website.test.js` ihre vollständige Lage. Ein Feld ohne Beispiel färbte
    // sie still rot, statt seine eigene gültige Angabe mitzubringen.
    assert.ok(f.beispiel, `${f.feld}: kein Beispiel — dann rät der Betreiber und raten die Proben`);
  }
});

/**
 * Der BIC fehlt mit Absicht, und diese Probe hält die Absicht fest: Im
 * SEPA-Raum genügt die IBAN, und eine Angabe, die niemand braucht, ist eine
 * Angabe, die niemand pflegt.
 */
test('der BIC steht nicht in der Liste', () => {
  assert.ok(!BANKFELDER.some((f) => /bic/i.test(f.feld)));
});

test('das Beispiel jedes geprüften Feldes besteht die eigene Prüfung', () => {
  const mitPruefung = BANKFELDER.filter((f) => f.pruefe);
  assert.ok(mitPruefung.length >= 1, 'ohne geprüftes Feld prüfte diese Probe nichts');
  for (const f of mitPruefung) {
    assert.equal(f.pruefe(f.beispiel), true, `${f.feld}: das eigene Beispiel fällt durch`);
  }
});

test('mit Konto stehen Inhaber, IBAN und Verwendungszweck auf dem Papier', () => {
  const b = bankzeilen(
    { kontoinhaber: 'Musterfirma GmbH', iban: 'AT611904300234573201' },
    'AB-2026-0007',
    LUECKE,
  );
  assert.equal(b.vollstaendig, true);
  assert.deepEqual(b.fehlend, []);
  const text = b.zeilen.join('\n');
  assert.match(text, /Musterfirma GmbH/);
  assert.match(text, /AT611904300234573201/);
  // Der Verwendungszweck ist die Vorgangsnummer: Ohne ihn ist ein Eingang auf
  // dem Kontoauszug keiner Bestellung zuzuordnen.
  assert.match(text, /Verwendungszweck: AB-2026-0007/);
});

test('ohne Konto steht die Lücke sichtbar da, statt still zu fehlen', () => {
  const b = bankzeilen({}, 'AB-2026-0007', LUECKE);
  assert.equal(b.vollstaendig, false);
  assert.deepEqual(b.fehlend, ['kontoinhaber', 'iban']);
  const text = b.zeilen.join('\n');
  assert.match(text, /Bitte überweisen Sie auf:/);
  assert.match(text, /FEHLT/, 'eine Lücke, die man nicht sieht, wird nicht gefüllt');
  assert.match(text, /Verwendungszweck: AB-2026-0007/);
});

/**
 * Der Fall, den eine reine Anwesenheitsprüfung durchgelassen hätte: Die IBAN
 * steht da, sie ist ausgefüllt, sie ist falsch. Anwesend ist nicht dasselbe
 * wie richtig — der Kunde überweist, das Geld kommt nicht an, und gemerkt
 * wird es, wenn die Ware ausbleibt.
 */
test('eine ausgefüllte, aber falsche IBAN gilt als fehlend', () => {
  const b = bankzeilen(
    { kontoinhaber: 'Musterfirma GmbH', iban: 'AT611904300234573210' },
    'AB-2026-0007',
    LUECKE,
  );
  assert.equal(b.vollstaendig, false);
  assert.deepEqual(b.fehlend, ['iban']);
  assert.match(b.zeilen.join('\n'), /IBAN.*FEHLT|FEHLT/);
});

test('Leerzeichen sind kein Kontoinhaber', () => {
  const b = bankzeilen({ kontoinhaber: '   ', iban: 'AT611904300234573201' }, 'A', LUECKE);
  assert.deepEqual(b.fehlend, ['kontoinhaber']);
});
