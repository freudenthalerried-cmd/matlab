import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rekonstruiereEinkauf, rekonstruierbarkeit, findeAbfluss } from '../src/geheimnis.js';

/* ------------------------------------------------------------------ *
 * Die Rechnung, die jeder anstellen kann
 *
 * `.gitignore` deckt die Preisdatei. Er deckt nicht die Angabe: Im
 * Verzeichnis stehen die Verkaufspreise (die gehören dorthin) und die
 * Zielmarge (die steht in einem Dutzend Dokumenten). Ein Schritt genügt.
 * ------------------------------------------------------------------ */

test('Aus Verkaufspreis und Marge folgt der Einkaufspreis', () => {
  assert.equal(rekonstruiereEinkauf(100, 0.25), 75);
  assert.equal(rekonstruiereEinkauf(53.33, 0.25), 40);
  assert.throws(() => rekonstruiereEinkauf(0, 0.25), /positiv/);
  assert.throws(() => rekonstruiereEinkauf(100, 1), /zwischen 0 und 1/);
});

test('Ein gekappter Verkaufspreis ist das Einzige, was etwas verbirgt', () => {
  // Gate 22 kappt den Verkaufspreis am Listenpreis des Lieferanten. Genau
  // dort greift die Rückrechnung zu tief — die Sperre, die den Preisvorteil
  // ausweist, verbirgt nebenbei den Einkauf.
  const e = rekonstruierbarkeit([
    { sku: 'FREI', vkNetto: 100, ekNetto: 75 },
    { sku: 'DECKEL', vkNetto: 45, ekNetto: 40 },
  ], 0.25);
  assert.equal(e.geprueft, 2);
  assert.equal(e.getroffen, 1);
  assert.deepEqual(e.verfehlt.map((z) => z.sku), ['DECKEL']);
  assert.equal(e.verfehlt[0].rekonstruiert, 33.75);
});

test('Der Anteil ist eine Zahl, keine Beruhigung', () => {
  const e = rekonstruierbarkeit([{ sku: 'A', vkNetto: 100, ekNetto: 75 }], 0.25);
  assert.equal(e.anteil, 1);
  assert.equal(rekonstruierbarkeit([], 0.25).anteil, 0, 'ohne Artikel keine Division durch null');
});

test('Artikel ohne Preis fallen heraus, statt als Treffer zu zählen', () => {
  const e = rekonstruierbarkeit([
    { sku: 'A', vkNetto: 100, ekNetto: 75 },
    { sku: 'LEER', vkNetto: 0, ekNetto: 0 },
  ], 0.25);
  assert.equal(e.geprueft, 1);
});

/* ------------------------------------------------------------------ *
 * Abfluss
 * ------------------------------------------------------------------ */

test('Ein Feldname mit Zahl daneben ist ein Verdacht', () => {
  const t = findeAbfluss('  "ekNetto": 1.45,', 'preise.json');
  assert.equal(t.length, 1);
  assert.equal(t[0].zeile, 1);
  assert.match(t[0].art, /Einkaufspreis/);
});

test('Ein Rechenschritt ist kein Wert', () => {
  // Ohne die Wortgrenze davor traf die Regel `t.einkaufNetto : 1` — der
  // Doppelpunkt kam aus einem Bedingungsausdruck. Ein Prüfer, der den
  // Rechenkern meldet statt des Lecks, wird abgeschaltet.
  assert.deepEqual(findeAbfluss('const hebel = t.einkaufNetto > 0 ? t.warenwertNetto / t.einkaufNetto : 1;'), []);
  assert.deepEqual(findeAbfluss('const x = summe.ekNetto = 0;'), [], 'Eigenschaftszugriff zählt nicht');
});

test('Der Feldname allein löst nichts aus', () => {
  assert.deepEqual(findeAbfluss('export function artikelEinkauf(artikel, lieferant) {'), []);
  assert.deepEqual(findeAbfluss('  ekNetto,'), []);
});

test('Die Zeilennummer zeigt auf die Fundstelle', () => {
  const t = findeAbfluss('eins\nzwei\nhaendlerrabattAufUvp: 0.42\n', 'x');
  assert.equal(t[0].zeile, 3);
});

/* ------------------------------------------------------------------ *
 * Das Werkzeug selbst
 * ------------------------------------------------------------------ */

test('Das Werkzeug läuft und benennt beide Durchgänge', () => {
  const werkzeug = fileURLToPath(new URL('../bin/geheimnispruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /Durchgang 1 — Abfluss/);
  assert.match(lauf.stdout, /Durchgang 2 — Rekonstruktion/);
  assert.match(lauf.stdout, /übergangen/, 'was nicht angesehen wurde, steht dabei');
  assert.match(lauf.stdout, /schützt keine Angabe/, 'das Werkzeug benennt seine eigene Aussage');
});
