import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WIDERRUFE, WIDERRUFSMERKMAL, SICHTWEITE, KOPFZEILEN,
  findeWiderrufe, pruefeBestand, kopfwiderruf, sichtfeld,
} from '../src/widerruf.js';

const verzeichnis = fileURLToPath(new URL('../../docs/baustoff-shop/', import.meta.url));

test('eine widerrufene Aussage ohne Widerruf daneben wird gemeldet', () => {
  const text = [
    '# Ein Bericht',
    '',
    'Die Trennlinie verläuft entlang des Rohstoffs.',
    '',
    'Und sonst nichts.',
  ].join('\n');
  const funde = findeWiderrufe(text);
  assert.equal(funde.length, 1);
  assert.equal(funde[0].id, 'lagerhaus-rohstoff');
  assert.equal(funde[0].zeile, 3, 'die Zeile kommt aus der Fundstelle, nicht aus einem Zähler');
  assert.equal(funde[0].gedeckt, false);
});

test('dieselbe Aussage mit ihrem Widerruf daneben ist erlaubt', () => {
  const text = [
    '# Ein Bericht',
    '',
    'Die erste Fassung schrieb: die Trennlinie verläuft entlang des Rohstoffs.',
    '',
    '**Auch das hält nicht** — Planziegel stehen auf Anfrage, N+F-Ziegel nicht.',
  ].join('\n');
  const [fund] = findeWiderrufe(text);
  assert.equal(fund.gedeckt, true, 'ein Zitat mit Widerruf in Sichtweite bleibt zitierbar');
});

test('der Widerruf muss in Sichtweite stehen, nicht irgendwo in der Datei', () => {
  const weit = [
    'Die Trennlinie verläuft entlang des Rohstoffs.',
    ...Array.from({ length: SICHTWEITE + 3 }, (_, i) => `Füllzeile ${i}`),
    'Das ist widerlegt.',
  ].join('\n');
  assert.equal(findeWiderrufe(weit)[0].gedeckt, false, 'zwölf Zeilen weiter ist kein Widerruf daneben');
});

test('ein Widerruf deckt nur seine eigene Aussage', () => {
  // Der Grund für das eintragseigene Merkmal: In STATUS.md stand acht Zeilen
  // unter der alten Zuschlagsrechnung, dass *Gate 1* abgelöst wurde. Ein
  // beliebiges Berichtigungswort in der Nähe darf den Prüfer nicht beruhigen.
  const fremd = [
    'Das berührt Gate 1 (25 % Zuschlag = 20 % Rohmarge).',
    '',
    'Gate 1 ist inzwischen durch Gate 20 abgelöst.',
  ].join('\n');
  assert.equal(findeWiderrufe(fremd)[0].gedeckt, false);

  const eigen = [
    'Das berührt Gate 1 (25 % Zuschlag = 20 % Rohmarge).',
    '',
    'Gültig ist seit 25.08. die Lesart 25 % Marge.',
  ].join('\n');
  assert.equal(findeWiderrufe(eigen)[0].gedeckt, true);
});

test('ein Kopfvermerk im Zitatblock deckt die ganze Datei', () => {
  const zeilen = [
    '# Was 25 % Zuschlag bedeuten',
    '',
    '> **Überholt seit 25.08.:** gemeint ist Marge, nicht Zuschlag.',
    '',
    ...Array.from({ length: 40 }, (_, i) => `Füllzeile ${i}`),
    'Erstens: 25 % Zuschlag sind 20 % Rohmarge.',
  ];
  assert.equal(kopfwiderruf(zeilen.join('\n')), true);
  assert.equal(findeWiderrufe(zeilen.join('\n'))[0].gedeckt, true);

  const alsFliesstext = zeilen.map((z) => z.replace(/^> /, '')).join('\n');
  assert.equal(kopfwiderruf(alsFliesstext), false, 'ein Widerruf, der wie Fließtext aussieht, wird überlesen');
});

test('ein Kopfvermerk unterhalb der Kopfzeilen deckt nicht mehr', () => {
  const text = [
    '# Titel',
    ...Array.from({ length: KOPFZEILEN }, (_, i) => `Füllzeile ${i}`),
    '> **Überholt:** gemeint ist Marge.',
    '',
    'Erstens: 25 % Zuschlag sind 20 % Rohmarge.',
  ].join('\n');
  assert.equal(kopfwiderruf(text), false);
});

test('sichtfeld greift an den Rändern nicht daneben', () => {
  const text = Array.from({ length: 5 }, (_, i) => `Zeile ${i + 1}`).join('\n');
  assert.equal(sichtfeld(text, 1, 2), 'Zeile 1\nZeile 2\nZeile 3');
  assert.equal(sichtfeld(text, 5, 2), 'Zeile 3\nZeile 4\nZeile 5');
});

test('das Register ist vollständig ausgefüllt', () => {
  assert.ok(WIDERRUFE.length >= 5);
  const ids = new Set();
  for (const w of WIDERRUFE) {
    assert.ok(w.id && !ids.has(w.id), `doppelte oder fehlende Kennung: ${w.id}`);
    ids.add(w.id);
    for (const feld of ['these', 'statt', 'widerrufenAm', 'belegt']) {
      assert.ok(w[feld], `${w.id}: ${feld} fehlt`);
    }
    assert.match(w.widerrufenAm, /^\d{4}-\d{2}-\d{2}$/, `${w.id}: Datum ohne Form`);
    assert.ok(w.muster instanceof RegExp, `${w.id}: Muster fehlt`);
    assert.ok(w.muster.flags.includes('g'), `${w.id}: Muster ohne g — findet nur den ersten Treffer`);
  }
});

test('jeder Registereintrag findet seine eigene These wieder', () => {
  // Ein Muster, das die Aussage nicht mehr trifft, ist ein stiller Ausfall —
  // der Prüfer meldet dann nichts und wirkt wie ein Erfolg.
  assert.ok(WIDERRUFE.length >= 5, 'ein leeres Register würde diese Schleife stumm bestehen');
  for (const w of WIDERRUFE) {
    assert.ok(w.beispiel, `${w.id}: der ursprüngliche Wortlaut fehlt`);
    const treffer = findeWiderrufe(w.beispiel, { register: [w] });
    assert.equal(
      treffer.length, 1,
      `${w.id}: das Muster findet den widerrufenen Wortlaut nicht mehr — ein stiller Ausfall`,
    );
    assert.equal(treffer[0].gedeckt, false, `${w.id}: der blanke Wortlaut gilt als ungedeckt`);
  }
});

test('das Merkmal ist ohne g-Flag — sonst ist test() zustandsbehaftet', () => {
  assert.equal(WIDERRUFSMERKMAL.flags.includes('g'), false);
  assert.ok(WIDERRUFE.length >= 5, 'ein leeres Register würde diese Schleife stumm bestehen');
  for (const w of WIDERRUFE) {
    if (w.merkmal) assert.equal(w.merkmal.flags.includes('g'), false, `${w.id}: Merkmal mit g`);
  }
  const text = 'Das ist widerlegt.';
  assert.equal(WIDERRUFSMERKMAL.test(text), WIDERRUFSMERKMAL.test(text), 'zweimal dasselbe Ergebnis');
});

test('der eigene Bestand trägt jeden Widerruf mit', () => {
  const dateien = readdirSync(verzeichnis)
    .filter((n) => n.endsWith('.md'))
    .map((name) => ({ name, text: readFileSync(join(verzeichnis, name), 'utf8') }));
  const e = pruefeBestand(dateien);
  const offen = e.meldungen.map((m) => `${m.datei}:${m.zeile} (${m.id})`).join('\n  ');
  assert.ok(e.sauber, `widerrufene Aussagen ohne Widerruf:\n  ${offen}`);
  assert.ok(e.funde > 0, 'wenn nichts mehr gefunden wird, prüft der Prüfer nichts mehr');
});
