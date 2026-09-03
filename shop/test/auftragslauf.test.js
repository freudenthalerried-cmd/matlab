import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  SCHRITTE,
  WELT_HEUTE,
  WELT_AUSGEBAUT,
  trockenlauf,
  engpaesse,
  aufwandProMonat,
} from '../src/auftragslauf.js';

test('Im Vollausbau läuft die Kette ohne einen einzigen Handgriff durch', () => {
  const lauf = trockenlauf(WELT_AUSGEBAUT);
  assert.equal(lauf.laeuftDurch, true);
  assert.equal(lauf.minutenMensch, 0);
  assert.deepEqual(lauf.blockaden, []);
  assert.ok(lauf.protokoll.every((p) => p.stand === 'automatisch'));
});

test('Heute bricht die Kette ab, und zwar an der Zahlung', () => {
  const lauf = trockenlauf(WELT_HEUTE);
  assert.equal(lauf.laeuftDurch, false);
  assert.equal(lauf.abbruchBei, 'zahlung');
  assert.ok(lauf.blockaden.includes('zahlung'));
  assert.ok(lauf.blockaden.includes('rechnung'));
});

test('Der Trockenlauf löst nichts aus — er meldet nur', () => {
  const vorher = JSON.stringify(WELT_HEUTE);
  trockenlauf(WELT_HEUTE);
  assert.equal(JSON.stringify(WELT_HEUTE), vorher, 'die Welt darf sich nicht verändern');
});

test('Jeder Schritt trägt jede Voraussetzung, die es in der Welt gibt', () => {
  const bekannt = Object.keys(WELT_AUSGEBAUT);
  assert.ok(SCHRITTE.length >= 10, 'die Kette hat zehn Schritte');
  // pruefung: begruendet — `s.braucht` darf leer sein.
  // Eingang, Datenprüfung und Lieferung brauchen
  // nichts aus der Welt. Deshalb steht hier keine Längenzusicherung je Schritt,
  // sondern eine über alle: Irgendein Schritt muss Voraussetzungen haben.
  assert.ok(SCHRITTE.some((s) => s.braucht.length > 0), 'kein Schritt verlangt irgendetwas');
  for (const s of SCHRITTE) {
    for (const v of s.braucht) {
      assert.ok(bekannt.includes(v), `${s.id} verlangt unbekannte Fähigkeit ${v}`);
    }
  }
});

test('Jede Fähigkeit wird von mindestens einem Schritt gebraucht', () => {
  const gebraucht = new Set(SCHRITTE.flatMap((s) => s.braucht));
  assert.equal(Object.keys(WELT_AUSGEBAUT).length, 6, 'sechs Fähigkeiten stehen in der Welt');
  for (const v of Object.keys(WELT_AUSGEBAUT)) {
    assert.ok(gebraucht.has(v), `${v} steht in der Welt, wird aber von keinem Schritt verlangt`);
  }
});

test('Blockaden wiegen schwerer als Handarbeit', () => {
  const rang = engpaesse();
  const ersteMitBlockade = rang.findIndex((e) => e.blockiert.length > 0);
  const ersteOhne = rang.findIndex((e) => e.blockiert.length === 0);
  assert.ok(ersteMitBlockade < ersteOhne, 'blockierende Engpässe müssen oben stehen');
});

test('Der Zahlungsanbieter blockiert, die Produktdaten kosten Zeit', () => {
  const rang = engpaesse();
  const zahlung = rang.find((e) => e.faehigkeit === 'zahlungsanbieter');
  const daten = rang.find((e) => e.faehigkeit === 'produktdatenSchnittstelle');

  assert.deepEqual(zahlung.blockiert, ['zahlung']);
  assert.equal(zahlung.zusatzminuten, 0, 'eine Blockade kostet keine Minuten — sie kostet den Auftrag');

  assert.deepEqual(daten.blockiert, []);
  assert.equal(daten.zusatzminuten, 9, 'Bestellauslösung, Auftragsbestätigung, Termin');
});

test('Die Firmendaten blockieren die Rechnung, sonst nichts', () => {
  const b = engpaesse().find((e) => e.faehigkeit === 'betreiberdaten');
  assert.deepEqual(b.blockiert, ['rechnung']);
  assert.deepEqual(b.betroffeneSchritte, ['rechnung']);
});

test('Der Monatsaufwand je Bestellung rechnet sich nachvollziehbar hoch', () => {
  // Nur die Produktdaten fehlen: 4 + 3 + 2 Minuten je Bestellung.
  const welt = { ...WELT_AUSGEBAUT, produktdatenSchnittstelle: false };
  const a = aufwandProMonat(welt, 37);
  assert.equal(a.minutenJeBestellung, 9);
  assert.equal(a.stundenProMonat, 5.6);
  assert.deepEqual(a.blockaden, []);
});

test('Bei null Bestellungen fällt kein Aufwand an', () => {
  const a = aufwandProMonat(WELT_HEUTE, 0);
  assert.equal(a.stundenProMonat, 0);
});

test('Die Lieferung ist der einzige Schritt, der immer von selbst läuft', () => {
  const nichts = Object.fromEntries(Object.keys(WELT_AUSGEBAUT).map((k) => [k, false]));
  const lauf = trockenlauf(nichts);
  const lieferung = lauf.protokoll.find((p) => p.id === 'lieferung');
  assert.equal(lieferung.stand, 'automatisch');
});

test('Jeder nicht automatische Schritt nennt einen Grund', () => {
  const lauf = trockenlauf(WELT_HEUTE);
  assert.equal(lauf.protokoll.length, SCHRITTE.length, 'jeder Schritt steht im Protokoll');
  assert.ok(lauf.protokoll.some((p) => p.stand !== 'automatisch'), 'sonst prüft die Schleife nichts');
  for (const p of lauf.protokoll) {
    if (p.stand === 'automatisch') continue;
    assert.ok(p.grund && p.grund.length > 10, `${p.id} ohne Begründung`);
    assert.ok(p.fehlend.length > 0, `${p.id} ohne benannte fehlende Fähigkeit`);
  }
});

/* ------------------------------------------------------------------ *
 * Der Vertragsschluss hat im Ablauf gefehlt
 * ------------------------------------------------------------------ */

test('Die Auftragsbestätigung an den Kunden steht vor dem Zahlungseingang', () => {
  const ids = SCHRITTE.map((s) => s.id);
  const annahme = ids.indexOf('annahme');
  const zahlung = ids.indexOf('zahlung');

  assert.ok(annahme >= 0, 'Der Schritt fehlt — nach AGB Punkt 2 kommt der Vertrag damit zustande');
  assert.ok(zahlung >= 0);
  assert.ok(annahme < zahlung, 'Erst binden, dann Geld nehmen');
});

test('Die eigene Bestätigung ist nicht mit der des Lieferanten verwechselbar', () => {
  const eigene = SCHRITTE.find((s) => s.id === 'annahme');
  const fremde = SCHRITTE.find((s) => s.id === 'lieferantenbestaetigung');

  assert.ok(eigene && fremde, 'Beide Schritte müssen es geben');
  assert.match(eigene.name, /an den Kunden/);
  assert.match(fremde.name, /des Lieferanten/);
  assert.ok(SCHRITTE.indexOf(eigene) < SCHRITTE.indexOf(fremde));
});

/* ------------------------------------------------------------------ *
 * Der Anfragebetrieb
 * ------------------------------------------------------------------ */

/**
 * **Der Befund vom 3. September 2026.** Der Kopf von `bin/aufwand.mjs` sagt:
 * „Die Besucherstrecke ist gemessen — was danach kommt, macht ein Mensch."
 * Was danach kommt, begann in `SCHRITTE` mit „Bestellung geht ein" — und
 * Bestellungen gibt es nicht, solange kein Zahlungsanbieter angebunden ist.
 *
 * Dazwischen liegt der Zustand, in dem der Shop tatsächlich ist und den ganzen
 * 45-tägigen Klickversuch verbringen wird.
 *
 * > **Der Shop verspricht in der Kasse eine Rückmeldung, und niemand hat
 * > gerechnet, was sie kostet.**
 */
test('jeder Anfrageschritt trägt Minuten und eine Herkunft', async () => {
  const { ANFRAGESCHRITTE } = await import('../src/auftragslauf.js');
  assert.ok(ANFRAGESCHRITTE.length >= 3, `nur ${ANFRAGESCHRITTE.length} Schritte — zu wenig zum Prüfen`);
  for (const s of ANFRAGESCHRITTE) {
    assert.ok(s.id && s.name, 'Schritt ohne Kennung oder Namen');
    assert.ok(Number.isFinite(s.minuten) && s.minuten > 0, `${s.id}: ${s.minuten} Minuten`);
    assert.equal(typeof s.wartetAufDritte, 'boolean', `${s.id}: wartetAufDritte fehlt`);
    assert.ok(s.woher && s.woher.length >= 40, `${s.id}: ohne belastbare Herkunft`);
  }
});

test('die eigene Arbeit je Anfrage ist die Summe der Schritte', async () => {
  const { ANFRAGESCHRITTE, anfrageaufwand } = await import('../src/auftragslauf.js');
  const summe = ANFRAGESCHRITTE.reduce((n, s) => n + s.minuten, 0);
  const a = anfrageaufwand(20);
  assert.equal(a.minutenEigen, summe);
  assert.equal(a.stundenProMonat, Math.round((summe * 20 / 60) * 10) / 10);
  assert.equal(anfrageaufwand(0).stundenProMonat, 0, 'ohne Anfrage keine Stunden');
  assert.throws(() => anfrageaufwand(-1), /negativ/);
});

test('ohne die Antwortzeit des Lieferanten ist keine zusagbar', async () => {
  const { anfrageaufwand } = await import('../src/auftragslauf.js');
  const a = anfrageaufwand(10);
  assert.equal(a.zusagbar, false, 'ein Schritt wartet auf Dritte — dann ist nichts zusagbar');
  assert.ok(a.warteschritte.includes('verfuegbarkeit'));
  assert.ok(a.warumNichtZusagbar.includes('Lieferanten'), 'der Grund nennt nicht, worauf gewartet wird');

  // Die Gegenrichtung: Ohne Warteschritt wäre eine Zusage möglich. Ohne diese
  // Probe könnte `zusagbar` fest auf false stehen und der Fall bliebe grün.
  const ohneWarten = anfrageaufwand(10, [
    { id: 'x', name: 'Nur eigene Arbeit', minuten: 4, wartetAufDritte: false, woher: 'Probe' },
  ]);
  assert.equal(ohneWarten.zusagbar, true);
  assert.equal(ohneWarten.warumNichtZusagbar, null);
});

test('die Kasse sagt keine Antwortzeit zu, solange keine zusagbar ist', async () => {
  // Die Verbindung, auf die es ankommt: Solange ein Schritt auf einen Dritten
  // wartet, steht in den Betreiberdaten keine Antwortzeit — und die Kasse
  // nennt keine. Eine geratene Zusage wäre schlechter als keine.
  const { anfrageaufwand } = await import('../src/auftragslauf.js');
  const betreiber = JSON.parse(
    readFileSync(fileURLToPath(new URL('../data/betreiber.json', import.meta.url)), 'utf8'),
  );
  // **Ohne `if`.** Der erste Anlauf stellte die Zusicherung hinter „solange
  // nichts zusagbar ist" — und `pruefe-tests` hat ihn gemeldet: Sobald die
  // Bedingung nicht mehr zutrifft, prüft der Fall nichts und bleibt grün.
  // Geprüft wird deshalb die **Folgerung** selbst, und die gilt immer.
  const zusagbar = anfrageaufwand(1).zusagbar;
  const zugesagt = betreiber.antwortzeitWerktage !== null;
  assert.ok(!zugesagt || zusagbar,
    'die Betreiberdaten sagen eine Antwortzeit zu, die der Anfragebetrieb nicht halten kann');

  // Und der heutige Stand, damit die Folgerung nicht leer läuft: Solange ein
  // Schritt auf den Lieferanten wartet, ist nichts zusagbar. Beantwortet er
  // die Frage, fällt dieser Fall — und dann gehört die Zusage entschieden.
  assert.equal(zusagbar, false,
    'es ist eine Antwortzeit zusagbar — dann gehört sie in betreiber.antwortzeitWerktage '
      + 'und dieser Testfall nachgezogen');
});
