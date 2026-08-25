import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pruefeAbsatz, pruefeInhalt, inAbsaetze, GRENZWOERTER, ohneKopfblock } from '../src/inhaltspruefung.js';

const absatz = (text) => ({ text, zeile: 1 });
const verdachtVon = (text) => pruefeAbsatz(absatz(text)).join(' | ');

test('eine Zahl mit Einheit braucht eine Quelle', () => {
  assert.match(verdachtVon('Der Verbrauch liegt bei 1,2 kg/m².'), /Zahl ohne Quelle/);
  assert.equal(
    verdachtVon('Der Verbrauch liegt bei 1,2 kg/m² — Quelle: [Merkblatt](https://x.at/m.pdf), Stand: 2026-08.'),
    '',
    'mit Quelle und Stand schweigt der Prüfer',
  );
});

test('ein Normbezug ohne Nummer wird gemeldet — auch der mit Umlaut', () => {
  // Der Umlaut ist der eigentliche Prüfpunkt: JavaScripts \b kennt „Ö" nicht
  // als Wortzeichen, weshalb die erste Fassung ÖNORM nie traf.
  assert.match(verdachtVon('Verarbeitung nach ÖNORM und sorgfältig.'), /ÖNORM.*ohne Nummer/);
  assert.match(verdachtVon('Verarbeitung nach DIN und EN gearbeitet.'), /DIN.*ohne Nummer/);
  assert.equal(verdachtVon('Verarbeitung nach ÖNORM B 3346, Ausgabe 2020.'), '', 'mit Nummer ist es belegt');
});

test('die Grenzen aus dem Prüfteam-Konzept werden erkannt', () => {
  assert.ok(GRENZWOERTER.length >= 4, 'die Grenzwortliste ist gefüllt');
  assert.match(verdachtVon('Radon ist gesundheitlich bedenklich.'), /Gesundheitsaussage/);
  assert.match(verdachtVon('Unsere Ausführung ist rechtssicher.'), /Rechtsauskunft/);
  assert.match(verdachtVon('Wir garantieren die Dichtheit.'), /Erfolgszusage/);
  assert.match(verdachtVon('Ihr Keller bleibt dauerhaft trocken.'), /Erfolgszusage/);
});

test('ein Preis braucht netto/brutto und einen Stand', () => {
  const ohne = verdachtVon('Der Sack kostet 12,90 €.');
  assert.match(ohne, /netto\/brutto/);
  assert.match(ohne, /ohne Stand/);
  assert.equal(verdachtVon('Der Sack kostet 12,90 € netto, Stand: 2026-08-22.'), '');
});

test('ein Blockzitat ohne Quelle ist fremder Text ohne Beleg', () => {
  assert.match(verdachtVon('> Spachtelmasse trägt man zweilagig auf.'), /Zitat ohne Quellenangabe/);
  assert.equal(
    verdachtVon('> Spachtelmasse trägt man zweilagig auf.\n> — Quelle: [Merkblatt](https://x.at/m.pdf)'),
    '',
  );
});

test('Überschriften und begründete Ausnahmen bleiben stumm', () => {
  assert.equal(verdachtVon('## Verbrauch je m² bei 2 mm Schichtdicke'), '', 'Überschriften tragen keine Behauptung');
  assert.equal(
    verdachtVon('<!-- pruefung: begruendet — Beispielsatz -->\nHier stünden 42 kg/m².'),
    '',
    'die aufgeschriebene Ausnahme wird geachtet',
  );
});

test('die Probedatei im Repo löst genau die erwarteten Verdachtsfälle aus', () => {
  const pfad = fileURLToPath(new URL('../inhalte/probe/probe.md', import.meta.url));
  const ergebnis = pruefeInhalt(readFileSync(pfad, 'utf8'), 'probe.md');
  assert.ok(ergebnis.absaetze >= 10, 'die Probedatei ist gefüllt');
  assert.equal(ergebnis.treffer.length, 6, 'sechs fehlerhafte Absätze, die sauberen bleiben stumm');
  const alle = ergebnis.treffer.flatMap((t) => t.verdacht).join(' | ');
  for (const muster of [/Zahl ohne Quelle/, /ohne Nummer/, /Gesundheitsaussage/, /Erfolgszusage/, /netto\/brutto/, /Zitat ohne Quellenangabe/]) {
    assert.match(alle, muster);
  }
});

test('das Werkzeug läuft über die Probedatei und meldet, ohne zu urteilen', () => {
  const werkzeug = fileURLToPath(new URL('../bin/inhaltspruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /6 mit Verdacht/);
  assert.match(lauf.stdout, /nicht automatisch zu beheben/);
  assert.match(lauf.stdout, /ersetzt dieses Werkzeug nicht/, 'das Werkzeug benennt seine eigene Grenze');
});

test('ein unlesbarer Ordner gibt eine Meldung, keinen Stacktrace', () => {
  const werkzeug = fileURLToPath(new URL('../bin/inhaltspruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug, '/gibt/es/nicht'], { encoding: 'utf8' });
  assert.equal(lauf.status, 2);
  assert.match(lauf.stderr, /nicht lesbar/);
  assert.ok(!lauf.stderr.includes('at '), 'kein Stacktrace');
});

test('Absätze werden mit brauchbarer Zeilennummer zerlegt', () => {
  const teile = inAbsaetze('Erster Absatz.\n\nZweiter Absatz.\n\nDritter.');
  assert.equal(teile.length, 3);
  assert.equal(teile[0].zeile, 1);
  assert.ok(teile[1].zeile > teile[0].zeile, 'die Zeilennummer wächst');
});

// --- Kopfblock ------------------------------------------------------------
// Metadaten sind keine Behauptungen. Der Prüfer schlug auf jeder Seite an,
// deren Titel eine Menge nennt („Mengen für 100 m² Fassade") — und ein
// Prüfer, der überall anschlägt, wird abgeschaltet statt befolgt.

test('Der Kopfblock wird nicht als Aussage geprüft', () => {
  const text = '---\ntitel: Mengen für 100 m² Fassade\nstand: 2026-08-25\n---\n\nEin harmloser Satz.\n';
  const e = pruefeInhalt(text, 'probe.md');
  assert.equal(e.sauber, true, `unerwarteter Verdacht: ${JSON.stringify(e.treffer)}`);
});

test('Nach dem Kopfblock stimmen die Zeilennummern noch', () => {
  // Der Kopf wird durch Leerzeilen ersetzt, nicht entfernt — sonst zeigt
  // jeder Treffer auf die falsche Zeile, und das ist schlimmer als kein
  // Treffer: Es schickt den Prüfenden an die falsche Stelle.
  const kopf = '---\ntitel: Probe\nstand: 2026-08-25\n---\n';
  const mitKopf = pruefeInhalt(`${kopf}\nEine Wand ist 5 m² groß.\n`, 'a.md');
  const ohne = pruefeInhalt('\n\n\n\n\nEine Wand ist 5 m² groß.\n', 'b.md');
  assert.equal(mitKopf.sauber, false);
  assert.equal(mitKopf.treffer[0].zeile, ohne.treffer[0].zeile);
});

test('Ohne Kopfblock bleibt der Text unverändert', () => {
  const text = 'Kein Kopf hier.\n\nZweiter Absatz.\n';
  assert.equal(ohneKopfblock(text), text);
});

test('Ein Trennstrich mitten im Text ist kein Kopfblock', () => {
  const text = 'Erster Absatz.\n\n---\nnicht: metadaten\n---\n\nZweiter.\n';
  assert.equal(ohneKopfblock(text), text);
});
