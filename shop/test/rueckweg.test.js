/**
 * Zeigt jeder Rückweg auf eine Stelle, an der wirklich etwas steht?
 *
 * **Der Anlass, 15. September 2026.** Die Kasse sagte, wenn keine Mailadresse
 * hinterlegt ist, man möge den Text „an die Adresse aus dem Impressum"
 * schicken — und im Impressum steht dieselbe Lücke.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KANAELE, abweisungskanalbefund, kanalGefuellt, kanalbefund, rueckwegsatz,
} from '../src/rueckweg.js';

test('der Rückweg nennt den Kanal, der wirklich dasteht', () => {
  assert.equal(rueckwegsatz({ email: 'office@bauversand.com' }).feld, 'email');
  assert.match(rueckwegsatz({ email: 'office@bauversand.com' }).text, /office@bauversand\.com/);

  // Die Reihenfolge ist die, in der ein Kunde sie braucht: schreiben vor rufen.
  const beide = rueckwegsatz({ email: 'a@b.at', telefon: '+43 1 2' });
  assert.equal(beide.feld, 'email');

  const nurTelefon = rueckwegsatz({ email: '', telefon: '+43 7752 12345' });
  assert.equal(nurTelefon.feld, 'telefon');
  assert.match(nurTelefon.text, /\+43 7752 12345/);
});

test('ohne jeden Kanal wird nicht auf das Impressum verwiesen', () => {
  /*
   * Dort steht dasselbe Nichts. Ein zweiter Verweis auf eine leere Stelle ist
   * eine Ausrede mit Fußnote — und ein Kunde, der eine fertig gerechnete
   * Positionsliste kopiert und dann nirgends hinschicken kann, hat mehr Zeit
   * verloren als einer, dem man es vorher sagt.
   */
  const ohne = rueckwegsatz({ email: '', telefon: '' });
  assert.equal(ohne.feld, null);
  // Die Menge, über die dieser Fall spricht: **alle** geführten Kanäle sind
  // leer, und das sind genau die aus dem Register.
  assert.equal(KANAELE.filter((k) => !kanalGefuellt(undefined)).length, KANAELE.length);
  assert.doesNotMatch(ohne.text, /Impressum/);
  assert.match(ohne.text, /noch nicht entgegennehmen/,
    'der Kunde erfährt vorher, dass es nicht geht');
});

test('ein leeres Feld gilt nicht als gefüllt — auch nicht mit Leerzeichen', () => {
  assert.equal(kanalGefuellt('office@bauversand.com'), true);
  assert.equal(kanalGefuellt(''), false);
  assert.equal(kanalGefuellt('   '), false);
  assert.equal(kanalGefuellt(null), false);
  assert.equal(kanalGefuellt(undefined), false);
  assert.equal(kanalGefuellt(42), false, 'eine Zahl ist keine Adresse');
});

test('ein Rückweg, der nicht aus der Quelle kommt, ist ein Befund', () => {
  const leer = { email: '', telefon: '' };
  const alt = 'Bitte den Text kopieren und an die Adresse aus dem Impressum schicken.';
  assert.deepEqual(kanalbefund(alt, leer, 'die Kasse').meldungen.map((m) => m.regel),
    ['rueckweg-nicht-aus-der-quelle', 'verweis-auf-dieselbe-luecke']);

  const richtig = rueckwegsatz(leer).text;
  assert.deepEqual(kanalbefund(richtig, leer, 'die Kasse').meldungen, []);
});

test('sobald ein Kanal dasteht, ist der Verweis ins Impressum kein Befund mehr', () => {
  // Dann steht dort etwas, und der Verweis ist eine Auskunft statt einer Ausrede.
  const mit = { email: 'office@bauversand.com', telefon: '' };
  const satz = `${rueckwegsatz(mit).text} Mehr im Impressum.`;
  assert.deepEqual(kanalbefund(satz, mit, 'die Kasse').meldungen, []);
});

test('ein veralteter Rückweg fällt auf, sobald die Adresse kommt', () => {
  /*
   * Der Fall am Tag X: Die Mailadresse wird eingetragen, und ein Satz, der
   * noch „ist noch nicht hinterlegt" sagt, steht weiter da. Ohne diese Regel
   * bliebe er, bis ihn jemand liest.
   */
  const mit = { email: 'office@bauversand.com' };
  const veraltet = rueckwegsatz({ email: '', telefon: '' }).text;
  assert.deepEqual(kanalbefund(veraltet, mit, 'die Kasse').meldungen.map((m) => m.regel),
    ['rueckweg-nicht-aus-der-quelle']);
});

test('die Kanäle stehen in einem Register, nicht in einem Satz', () => {
  assert.ok(KANAELE.length >= 2, `nur ${KANAELE.length} Kanäle`);
  for (const k of KANAELE) {
    assert.ok(k.feld, 'ein Kanal ohne Feld ist in keiner Datei nachzusehen');
    assert.ok(k.wort, `${k.feld}: ohne Namen ist er in einer Meldung nicht wiederzufinden`);
    assert.equal(typeof k.satz, 'function', `${k.feld}: ohne Satz gibt es nichts zu zeigen`);
    assert.equal(k.muster, undefined,
      `${k.feld}: ein Muster über die Prosa meldete „Die E-Mail-Adresse ist nicht lesbar" — `
      + 'gemeint ist dort die des Kunden');
  }
});

test('eine Abweisung, die auf einen leeren Kanal zeigt, ist ein Befund', () => {
  /*
   * Zwei Sätze des Empfangsskripts endeten am 14. September auf „…oder rufen
   * Sie uns an". Eine Telefonnummer führt dieser Betrieb nirgends.
   */
  const eintrag = [{ id: 'probe', nenntKanal: 'telefon' }];
  const leer = { telefon: '' };
  assert.deepEqual(
    abweisungskanalbefund(eintrag, leer).meldungen.map((m) => m.regel), ['rueckweg-ins-leere'],
  );
  assert.deepEqual(abweisungskanalbefund(eintrag, { telefon: '+43 1 2' }).meldungen, [],
    'steht die Nummer da, ist der Satz richtig');
});

test('eine Abweisung, die einen unbekannten Kanal nennt, ist ein Befund', () => {
  const b = abweisungskanalbefund([{ id: 'probe', nenntKanal: 'brieftaube' }], {});
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['kanal-gibt-es-nicht'],
    'ein Kanal, den das Register nicht führt, wird von keinem Prüfer gehalten');
  assert.equal(b.gefuehrt, 1);
});

test('eine Abweisung ohne Kanalangabe wird nicht geprüft', () => {
  // Der Normalfall: Der Satz sagt, was zu tun ist, und nennt keinen Kanal.
  const ohne = [{ id: 'a' }, { id: 'b' }];
  const b = abweisungskanalbefund(ohne, {});
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.gefuehrt, 0, 'zwei Einträge, keiner mit Kanal');
});
