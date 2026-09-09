/**
 * Ein Betrieb hat einen Kalender, keine zwei.
 *
 * **Der Anlass, 9. September 2026.** Das Empfangsskript stempelte jeden
 * Journaleintrag in UTC und wählte die Journaldatei mit der ungesetzten
 * Zeitzone des Hosts. `src/ablage.js` nennt dasselbe Feld seit ihrem ersten
 * Bau „Ausstellungsdatum" nach § 11 UStG.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ZEITZONE, geschaeftstag, geschaeftsjahr, zeitstempel,
  ohneKommentare, rohgriffe, zeitbefund, UHRSTELLEN,
} from '../src/geschaeftszeit.js';

/* ------------------------------------------------------------------ *
 * Der Kalender
 * ------------------------------------------------------------------ */

test('die Zeitzone ist die des Sitzes, nicht die des Hosts', () => {
  assert.equal(ZEITZONE, 'Europe/Vienna');
});

test('um 00:30 Uhr ist schon der neue Tag — UTC sagt den Vortag', () => {
  const nachts = new Date('2027-03-15T00:30:00+01:00');
  assert.equal(geschaeftstag(nachts), '2027-03-15');
  // Das ist der Fund: Der bisherige Weg hätte hier den 14. geschrieben.
  assert.equal(nachts.toISOString().slice(0, 10), '2027-03-14');
});

test('und am 1. Jänner entscheidet dieselbe halbe Stunde das Wirtschaftsjahr', () => {
  const neujahr = new Date('2027-01-01T00:30:00+01:00');
  assert.equal(geschaeftsjahr(neujahr), 2027);
  assert.equal(neujahr.getUTCFullYear(), 2026);
});

test('der Sommer verschiebt die Grenze um eine weitere Stunde', () => {
  const sommernacht = new Date('2027-07-15T01:30:00+02:00');
  assert.equal(geschaeftstag(sommernacht), '2027-07-15');
  assert.equal(sommernacht.toISOString().slice(0, 10), '2027-07-14');
});

test('der Zeitstempel trägt den Versatz und bleibt derselbe Augenblick', () => {
  const faelle = [
    ['2027-01-15T09:00:00+01:00', '+01:00'],
    ['2027-07-15T09:00:00+02:00', '+02:00'],
    ['2027-03-28T03:30:00+02:00', '+02:00'],
  ];
  assert.equal(faelle.length, 3, 'die Schleife prüfte zu wenig');
  for (const [roh, versatz] of faelle) {
    const d = new Date(roh);
    const s = zeitstempel(d);
    assert.ok(s.endsWith(versatz), `${s} sollte auf ${versatz} enden`);
    // Ohne diese Zusicherung wäre der Stempel eine Ortszeit ohne Ort.
    assert.equal(new Date(s).getTime(), d.getTime(), `${s} meint einen anderen Augenblick`);
  }
});

test('der Zeitstempel lässt das übergebene Datum in Ruhe', () => {
  // Die erste Fassung rechnete den Versatz mit `datum.setMilliseconds(0)` —
  // das hätte dem Aufrufer sein Datum verändert.
  const d = new Date('2027-07-15T09:00:00.123+02:00');
  zeitstempel(d);
  assert.equal(d.getMilliseconds(), 123);
});

/* ------------------------------------------------------------------ *
 * Das Register und sein Prüfer
 * ------------------------------------------------------------------ */

test('ein Uhrgriff im Kommentar ist keiner', () => {
  const quelle = '/* new Date() im Block */\n// new Date() in der Zeile\nconst a = new Date();\n';
  assert.equal(rohgriffe(quelle), 1);
  assert.match(ohneKommentare(quelle), /const a = new Date\(\);/);
});

test('PHP-Rauten zählen als Kommentar, Code daneben nicht', () => {
  const quelle = "# gmdate('c') erklärt\n$x = gmdate('c');\n$j = date('Y');\n";
  assert.equal(rohgriffe(quelle, true), 2);
});

test('das Register deckt jede Stelle des Bestands — beide Richtungen', () => {
  const dateien = UHRSTELLEN.map((e) => ({
    pfad: e.datei,
    text: e.uhr === 'geschaeft' && e.datei !== 'src/geschaeftszeit.js'
      ? `${'new Date();\n'.repeat(e.roh)}geschaeftstag();\n`
        + "date_default_timezone_set('Europe/Vienna');"
      : 'new Date();\n'.repeat(e.roh),
  }));
  assert.ok(dateien.length >= 10, `nur ${dateien.length} Einträge — das ist zu wenig`);
  const b = zeitbefund(dateien);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.eintraege, UHRSTELLEN.length);
  assert.ok(b.belegdateien >= 5, `nur ${b.belegdateien} Dateien mit Belegwirkung`);
});

test('eine neue Stelle ohne Eintrag fällt auf', () => {
  const b = zeitbefund([{ pfad: 'bin/neu.mjs', text: 'const t = new Date();' }], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['stelle-ohne-eintrag']);
  assert.match(b.meldungen[0].text, /bin\/neu\.mjs/);
});

test('ein Eintrag, dessen Datei nicht mehr auf die Uhr sieht', () => {
  const b = zeitbefund([{ pfad: 'a.js', text: 'const t = 1;' }],
    [{ datei: 'a.js', roh: 1, uhr: 'technisch', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['rohzahl-abgeloest']);
});

test('ein Eintrag ohne Datei bleibt nicht unbemerkt', () => {
  const b = zeitbefund([], [{ datei: 'weg.js', roh: 1, uhr: 'technisch', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['eintrag-ohne-datei']);
});

test('ein zweiter Uhrgriff in einer bekannten Datei wird gezählt', () => {
  const b = zeitbefund([{ pfad: 'a.js', text: 'new Date(); new Date();' }],
    [{ datei: 'a.js', roh: 1, uhr: 'technisch', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['rohzahl-abgeloest']);
  assert.match(b.meldungen[0].text, /erlaubt 1 rohe Uhrgriffe, gezählt sind 2/);
});

/**
 * Der Kern: Eine Datei mit Belegwirkung darf gar nicht roh auf die Uhr sehen.
 * Genau das taten am 9. September sieben Dateien, und alle sieben sahen
 * richtig aus — die Uhr ging ja nicht falsch, sie ging nach einem anderen Ort.
 */
test('ein roher Uhrgriff in einer Belegdatei ist ein eigener Befund', () => {
  const b = zeitbefund([{ pfad: 'a.mjs', text: 'const t = new Date();\ngeschaeftstag();' }],
    [{ datei: 'a.mjs', roh: 0, uhr: 'geschaeft', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['rohe-uhr-im-beleg']);
  assert.match(b.meldungen[0].text, /falsche Tag/);
});

/**
 * Die Richtung, die den Fund gemacht hätte: Ein Eintrag darf „geschaeft"
 * sagen, ohne dass die Datei den Kalender je aufruft. Dann steht die Absicht
 * im Register und die UTC-Uhr im Code — und der Prüfer wäre grün.
 */
test('eine Absicht ohne Aufruf ist keine Umsetzung', () => {
  const b = zeitbefund([{ pfad: 'a.mjs', text: 'const t = 1;' }],
    [{ datei: 'a.mjs', roh: 0, uhr: 'geschaeft', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['beleguhr-nicht-verwendet']);
});

test('ein Kalenderaufruf im Kommentar ist keiner', () => {
  const b = zeitbefund([{ pfad: 'a.mjs', text: '// geschaeftstag() gehört hierher\nconst t = 1;' }],
    [{ datei: 'a.mjs', roh: 0, uhr: 'geschaeft', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['beleguhr-nicht-verwendet']);
});

test('bei PHP zählt die gesetzte Zeitzone als Aufruf', () => {
  const ohne = zeitbefund([{ pfad: 'a.php', text: "$j = date('Y');" }],
    [{ datei: 'a.php', roh: 1, uhr: 'geschaeft', warum: 'a'.repeat(50) }]);
  assert.deepEqual(ohne.meldungen.map((m) => m.regel), ['beleguhr-nicht-verwendet']);

  const mit = zeitbefund(
    [{ pfad: 'a.php', text: "date_default_timezone_set('Europe/Vienna');\n$j = date('Y');" }],
    [{ datei: 'a.php', roh: 1, uhr: 'geschaeft', warum: 'a'.repeat(50) }]);
  assert.deepEqual(mit.meldungen, []);
});

/**
 * Die gesetzte Zeitzone allein genügt nicht: `gmdate` geht an ihr vorbei und
 * stempelt weiter UTC. Genau diese Mischung stand in `bestellung.php` — die
 * Jahreszahl aus der einen Uhr, der Stempel aus der anderen.
 */
test('eine gesetzte Zeitzone rettet einen UTC-Stempel nicht', () => {
  const b = zeitbefund([{
    pfad: 'a.php',
    text: "date_default_timezone_set('Europe/Vienna');\n$j = date('Y');\n$z = gmdate('c');",
  }], [{ datei: 'a.php', roh: 2, uhr: 'geschaeft', warum: 'a'.repeat(50) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['utc-stempel-im-beleg']);
});

test('ein Grund, der in eine Zeile passt, ist keiner', () => {
  const b = zeitbefund([{ pfad: 'a.js', text: 'new Date();' }],
    [{ datei: 'a.js', roh: 1, uhr: 'technisch', warum: 'weil halt' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-zu-duenn'));
});

test('eine dritte Uhr gibt es nicht', () => {
  const b = zeitbefund([{ pfad: 'a.js', text: 'new Date();' }],
    [{ datei: 'a.js', roh: 1, uhr: 'ungefaehr', warum: 'a'.repeat(50) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'uhr-unbekannt'));
});
