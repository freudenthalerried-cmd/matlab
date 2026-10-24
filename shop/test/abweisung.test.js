/**
 * Was der Besteller liest, wenn die Bestellung nicht durchgeht.
 *
 * **Der Anlass, 15. September 2026.** Gestern haben die acht Eingabefelder
 * einen Satz für den Kunden bekommen — die Frage. Die Antwort lautete an
 * achtzehn Stellen „Ablage belegt.", „Kein lesbares JSON.", „Nur POST." und
 * „Feld fehlt oder ist leer: unternehmerBestaetigt".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  ABWEISUNGEN, WERKSTATTWOERTER, abweisungsbefund, werkstattwoerter, zusammengesetzt,
} from '../src/abweisung.js';

const PHP = readFileSync(new URL('../bestellung.php', import.meta.url), 'utf8');

test('das Empfangsskript dieses Hauses ist in Ordnung', () => {
  const b = abweisungsbefund(PHP);
  assert.deepEqual(b.meldungen, [], JSON.stringify(b.meldungen, null, 2));
  assert.ok(b.stellen >= 10, `nur ${b.stellen} Abweisungen gefunden — die Messung sagt dann wenig`);
});

test('jeder Eintrag nennt den nächsten Schritt', () => {
  assert.ok(ABWEISUNGEN.length >= 10, `nur ${ABWEISUNGEN.length} Einträge`);
  for (const e of ABWEISUNGEN) {
    assert.ok(e.satz, `${e.id}: ohne Satz`);
    assert.ok(e.weiter && e.weiter.length >= 20,
      `${e.id}: eine Abweisung ohne nächsten Schritt lässt den Kunden mit seinem Geld in der Hand stehen`);
    assert.equal(typeof e.status, 'number', `${e.id}: ohne Status`);
  }
});

test('die drei Fälle, die wir verschulden, sagen es auch', () => {
  /*
   * Wer glaubt, er sei schuld, versucht es anders; wer weiß, dass es an uns
   * liegt, ruft an. „Ablage nicht erreichbar." sagte weder das eine noch das
   * andere.
   */
  const eigene = ABWEISUNGEN.filter((e) => e.unsereSchuld);
  assert.ok(eigene.length >= 2, `nur ${eigene.length} eigene Fehler im Register`);
  for (const e of eigene) {
    assert.match(e.satz, /an uns|ungewöhnlich viele/,
      `${e.id}: der Fehler liegt bei uns, und der Satz sagt es nicht`);
  }
});

const probe = (mehr) => [{
  id: 'probe',
  status: 400,
  satz: 'Ein Satz, der im Skript steht.',
  weiter: 'Und ein nächster Schritt, der lang genug ist.',
  unsereSchuld: false,
  ...mehr,
}];
const regeln = (eintraege, quelle = "antworte(400, ['ok' => false, 'grund' => 'Ein Satz, der im Skript steht.']);",
  interna) => abweisungsbefund(quelle, eintraege, interna ?? (() => []))
  .meldungen.map((m) => m.regel);

test('ein Satz, den das Skript nicht kennt, ist ein Befund', () => {
  assert.deepEqual(regeln(probe({})), [], 'der gedeckte Eintrag meldet nichts');
  assert.deepEqual(regeln(probe({ satz: 'Steht dort nirgends.' })), ['satz-ohne-stelle', 'stelle-ohne-satz'],
    'ein umgeschriebener Satz lässt beide Richtungen anschlagen');
});

test('eine Abweisung im Skript ohne Eintrag ist ein Befund — die andere Richtung', () => {
  const zweiStellen = "antworte(400, ['ok' => false, 'grund' => 'Ein Satz, der im Skript steht.']);\n"
    + "antworte(500, ['ok' => false, 'grund' => 'Ablage belegt.']);";
  assert.deepEqual(regeln(probe({}), zweiStellen), ['stelle-ohne-satz'],
    'wer eine Abweisung schreibt, schreibt sie in der Sprache dessen, der sie liest');
});

test('eine Abweisung ohne nächsten Schritt ist ein Befund', () => {
  assert.deepEqual(regeln(probe({ weiter: '' })), ['abweisung-ohne-weiter']);
  assert.deepEqual(regeln(probe({ weiter: 'Nochmal.' })), ['abweisung-ohne-weiter'],
    'ein Wort ist kein nächster Schritt');
});

test('ein eigener Fehler, der sich nicht dazu bekennt, ist ein Befund', () => {
  assert.deepEqual(regeln(probe({ unsereSchuld: true })), ['eigener-fehler-verschwiegen']);
  assert.deepEqual(
    regeln(probe({ unsereSchuld: true, satz: 'Das liegt an uns.' }),
      "antworte(500, ['ok' => false, 'grund' => 'Das liegt an uns.']);"),
    [], 'sagt der Satz es, meldet nichts',
  );
});

test('Werkstattwörter gehören in keinen Satz an den Besteller', () => {
  assert.ok(WERKSTATTWOERTER.length >= 5, `nur ${WERKSTATTWOERTER.length} Wörter`);
  for (const w of WERKSTATTWOERTER) {
    assert.ok(w.wort && w.warum, 'ein Wort ohne Grund ist eine Verbotsliste');
  }
  assert.deepEqual(werkstattwoerter('Kein lesbares JSON.').map((w) => w.wort), ['JSON']);
  assert.deepEqual(werkstattwoerter('Bitte laden Sie die Seite neu.'), []);

  const mitWort = "antworte(400, ['ok' => false, 'grund' => 'Ablage belegt, kein JSON.']);";
  assert.deepEqual(regeln(probe({ satz: 'Ablage belegt, kein JSON.' }), mitWort),
    ['abweisung-aus-der-werkstatt', 'abweisung-aus-der-werkstatt'],
    'Ablage und JSON — zwei Wörter, zwei Meldungen');
});

test('ein Satz an den Besteller trägt nichts Internes hinaus', () => {
  const quelle = "antworte(400, ['ok' => false, 'grund' => 'Gate 7 verlangt die Bestätigung.']);";
  assert.deepEqual(
    abweisungsbefund(quelle, probe({ satz: 'Gate 7 verlangt die Bestätigung.' }))
      .meldungen.map((m) => m.regel),
    ['abweisung-mit-interna'],
    'Gate-Nummern sind für den Kunden eine Chiffre',
  );
});

test('ein Satz, den der Setzer umbricht, ist derselbe Satz', () => {
  /*
   * **Der erste Lauf dieses Prüfers.** Er meldete den Satz über die
   * fehlgeschlagene Ablage als „steht in keiner Abweisung" — und er stand
   * dort, nur über drei Zeilen verteilt.
   */
  assert.equal(zusammengesetzt("'Erster Teil '\n    . 'zweiter Teil'"), "'Erster Teil zweiter Teil'");
  assert.equal(zusammengesetzt('"a" . "b"'), '"ab"');
  assert.equal(zusammengesetzt("'unberührt'"), "'unberührt'");
});
