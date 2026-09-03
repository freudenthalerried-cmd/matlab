// Probedatei für bin/testpruefung.mjs — ABSICHTLICH hohle Testfälle.
//
// Diese Datei wird von npm test NICHT ausgeführt (das Muster test/*.test.js
// greift nur eine Ebene tief) und vom Prüfer im Normallauf NICHT gelesen
// (er liest den Ordner nicht rekursiv). Sie existiert nur als Zielscheibe:
// test/testpruefung-werkzeug.test.js richtet den Prüfer auf diesen Ordner
// und weist nach, dass er jedes der Muster findet — und beim sauberen Fall
// schweigt. Vorher lag dieser Nachweis außerhalb des Repos und war nach
// jeder Umgebung weg.
import test from 'node:test';
import assert from 'node:assert/strict';

test('behauptet nichts', () => {
  const x = 1 + 1;
});

test('versteckt alles hinter einem if', () => {
  const treffer = [].find((z) => z.gruppe === 'tippfehler');
  if (treffer) {
    assert.equal(treffer.gruppe, 'tippfehler');
  }
});

test('schleift ueber eine moeglicherweise leere Liste', () => {
  const liste = [].filter((z) => false);
  for (const z of liste) {
    assert.ok(z.egal);
  }
});

test('fremde Laengenzusicherung schirmt die Schleife nicht mehr ab', () => {
  const andereListe = [1, 2, 3];
  assert.equal(andereListe.length, 3);
  const leereListe = [].filter(Boolean);
  for (const eintrag of leereListe) {
    assert.ok(eintrag > 0);
  }
});

test('begruendet abgelehnt', () => {
  // pruefung: begruendet — die Liste darf leer sein.
  const liste = [];
  for (const z of liste) {
    assert.ok(z.egal);
  }
});

test('sauber: eigene Laenge zugesichert, dann geschleift', () => {
  const eintraege = [10, 20].map((n) => n + 1);
  assert.equal(eintraege.length, 2);
  for (const e of eintraege) {
    assert.ok(e > 10);
  }
});

test('mit Optionsobjekt: das ist ein Rumpf, kein leerer Test', { concurrency: 1 }, () => {
  // Bis zum 28.08. las der Prüfer das Optionsobjekt als Rumpf und meldete
  // „behauptet nichts". Dieser Fall hält die Schreibweise fest.
  assert.equal(1 + 1, 2);
});

test('behauptet nichts, aber zeigt eine geschweifte Klammer in einer Zeichenkette', () => {
  // Bis zum 3.9. war dieser Fall unsichtbar: Die Klammerzählung sah das `{`
  // im Text, fand keine Balance und übersprang den ganzen Testfall — still.
  // Ein hohler Test blieb dadurch unentdeckt. Genau das steht hier.
  const zeile = 'export function artikelEinkauf(artikel, lieferant) {';
});

test('behauptet nichts hinter einem Muster mit Anführungszeichen', () => {
  // Der zweite Anlauf am selben Tag: Zeichenketten erkannt, Muster-Literale
  // nicht. `/role="img" aria-label="[^"]+"/` hat fünf Anführungszeichen — beim
  // fünften lief die Erkennung in den Rest der Datei.
  const muster = /role="img" aria-label="[^"]+"/;
});
