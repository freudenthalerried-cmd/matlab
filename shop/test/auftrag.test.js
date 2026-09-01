import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ergebnisliste, pruefeErgebnisse, ERGEBNISKAPITEL } from '../src/auftrag.js';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const auftrag = () => readFileSync(join(REPO, 'docs', 'baustoff-shop', 'master-prompt.md'), 'utf8');

test('Die Ergebnisliste wird aus dem Auftrag gelesen, nicht abgeschrieben', () => {
  const liste = ergebnisliste(auftrag());
  assert.ok(liste.length >= 8, `nur ${liste.length} Ergebnisse — die Prüfungen darunter prüfen zu wenig`);

  // Fortlaufend nummeriert, keines übersprungen.
  assert.deepEqual(liste.map((e) => e.nr), liste.map((_, i) => i + 1));

  // Die meisten nennen einen Dateinamen, mindestens eines nicht — das
  // KPI-Dashboard ist eine Anforderung ohne festgelegte Form, und der Parser
  // darf daran nicht scheitern.
  assert.ok(liste.some((e) => e.datei), 'kein einziger Dateiname erkannt');
  assert.ok(liste.some((e) => e.datei === null), 'kein Eintrag ohne Dateinamen — der Fall fehlt');

  for (const e of liste) assert.ok(e.text.length > 10, `Ergebnis ${e.nr} ohne Text`);
});

test('Ohne Kapitel oder ohne Einträge wird geworfen, nicht leer zurückgegeben', () => {
  assert.throws(() => ergebnisliste('# Auftrag\n\nkein Kapitel hier'), new RegExp(ERGEBNISKAPITEL));
  assert.throws(() => ergebnisliste(`${ERGEBNISKAPITEL}\n\nnur Fließtext\n`), /leer/);
});

/**
 * Der wichtigste Zustand ist `ohne-zuordnung`. Eine Anforderung, die niemand
 * beantwortet hat, ist gefährlicher als eine offene: Sie fällt nicht auf.
 */
test('Eine Anforderung ohne Antwort und ein Beleg ohne Datei sind beide Fehler', () => {
  const liste = [{ nr: 1, datei: 'a.md', text: 'A' }, { nr: 2, datei: 'b.md', text: 'B' }];

  const ohne = pruefeErgebnisse(liste, { 1: { zustand: 'erfuellt' } }, () => true);
  assert.equal(ohne.befunde[1].zustand, 'ohne-zuordnung');
  assert.equal(ohne.sauber, false);

  const toterBeleg = pruefeErgebnisse(
    liste,
    { 1: { zustand: 'erfuellt', belege: ['gibt/es/nicht.md'] }, 2: { zustand: 'offen' } },
    () => false,
  );
  assert.equal(toterBeleg.befunde[0].zustand, 'beleg-fehlt');
  assert.deepEqual(toterBeleg.befunde[0].fehlendeBelege, ['gibt/es/nicht.md']);
  assert.equal(toterBeleg.sauber, false);

  // „offen" ist eine gültige Antwort und macht den Abgleich nicht unsauber.
  const sauber = pruefeErgebnisse(liste, { 1: { zustand: 'anders', belege: [] }, 2: { zustand: 'offen' } }, () => true);
  assert.equal(sauber.sauber, true);
  assert.equal(sauber.offen, 1);
  assert.equal(sauber.anders, 1);
});

/**
 * Und der echte Bestand: Jede der zwölf Anforderungen ist beantwortet, jede
 * Antwort trägt eine Begründung, und jeder genannte Beleg existiert.
 */
test('Jede Anforderung des Auftrags ist beantwortet und belegt', () => {
  const zuordnung = JSON.parse(readFileSync(fileURLToPath(new URL('../data/auftragszuordnung.json', import.meta.url)), 'utf8'));
  const liste = ergebnisliste(auftrag());
  const e = pruefeErgebnisse(liste, zuordnung, (b) => existsSync(join(REPO, b)));

  const ohneAntwort = e.befunde.filter((b) => b.zustand === 'ohne-zuordnung');
  assert.deepEqual(ohneAntwort.map((b) => b.nr), [], 'diese Anforderungen hat niemand beantwortet');

  const toteBelege = e.befunde.flatMap((b) => b.fehlendeBelege.map((f) => `${b.nr}: ${f}`));
  assert.deepEqual(toteBelege, [], 'diese Belege gibt es nicht');

  for (const b of e.befunde) {
    assert.ok(b.begruendung.length > 60, `Ergebnis ${b.nr}: Begründung zu dünn`);
    assert.ok(['erfuellt', 'anders', 'offen'].includes(b.zustand), `Ergebnis ${b.nr}: ${b.zustand}`);
    // Wer „erfüllt" oder „anders" sagt, muss zeigen, wo.
    if (b.zustand !== 'offen') assert.ok(b.belege.length > 0, `Ergebnis ${b.nr}: ${b.zustand} ohne Beleg`);
  }
});
