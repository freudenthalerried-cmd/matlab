import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leseZahl, leseTabelle, lesePreisliste, fuegeZusammen, PFLICHTSPALTEN } from '../src/preisliste.js';
import { wegwerfordner } from '../src/wegwerf.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const werkzeug = pfad('../bin/preisliste.mjs');

/* ------------------------------------------------------------------ *
 * Zahlen aus fremden Dateien
 * ------------------------------------------------------------------ */

test('deutsche und englische Schreibweise meinen dasselbe', () => {
  assert.equal(leseZahl('1.234,56'), 1234.56);
  assert.equal(leseZahl('1234.56'), 1234.56);
  assert.equal(leseZahl('12,50'), 12.5);
  assert.equal(leseZahl('75,50 €'), 75.5);
  assert.equal(leseZahl('0,45'), 0.45);
});

test('ein Tausenderpunkt ist kein Komma', () => {
  // „1.234" sind tausendzweihundertvierunddreißig. Wer das als 1,234 liest,
  // verkauft eine Palette zum Preis eines Sacks.
  assert.equal(leseZahl('1.234'), 1234);
  assert.equal(leseZahl('1.5'), 1.5, 'eine Nachkommastelle bleibt eine Nachkommastelle');
});

test('was keine Zahl ist, wird keine', () => {
  for (const s of ['auf Anfrage', 'ANFRAGE', '', '   ', 'a. A.', '-']) {
    assert.equal(leseZahl(s), null, `„${s}" wurde zu einer Zahl`);
  }
});

/* ------------------------------------------------------------------ *
 * Die Tabelle
 * ------------------------------------------------------------------ */

test('Semikolon, Komma und Tabulator werden erkannt', () => {
  const felder = ['sku', 'bezeichnung'];
  for (const t of [';', ',', '\t']) {
    const { kopf, zeilen } = leseTabelle(`sku${t}bezeichnung\nA-1${t}Etwas`);
    assert.deepEqual(kopf, felder, `Trenner „${t}" nicht erkannt`);
    assert.equal(zeilen.length, 1);
    assert.equal(zeilen[0].bezeichnung, 'Etwas');
  }
});

test('eine leere Datei ergibt keine Zeilen und keinen Absturz', () => {
  assert.deepEqual(leseTabelle(''), { kopf: [], zeilen: [] });
  assert.deepEqual(leseTabelle('nur eine Spalte'), { kopf: [], zeilen: [] });
});

/* ------------------------------------------------------------------ *
 * Gate 24 an der Quelle
 * ------------------------------------------------------------------ */

const kopfzeile = 'sku;bezeichnung;einheit;ek_netto;uvp_netto;gruppe;gewicht_kg;sperrgut';
const lage = { lieferantId: 'poschacher', stand: '2026-08-28' };

test('eine fehlende Pflichtspalte hält die ganze Datei auf', () => {
  assert.ok(PFLICHTSPALTEN.length >= 4);
  const e = lesePreisliste('sku;bezeichnung\nA-1;Etwas', lage);
  assert.equal(e.artikel.length, 0);
  assert.ok(e.fehler.some((f) => /einheit/.test(f)), e.fehler.join(' | '));
  assert.ok(e.fehler.some((f) => /ek_netto/.test(f)));
});

test('ohne brauchbaren Einkaufspreis kommt kein Artikel in den Katalog', () => {
  // Gate 24, an der Stelle, an der die Daten hereinkommen. „Auf Anfrage" ist
  // dasselbe wie leer: Der Shop kann damit nicht rechnen.
  const e = lesePreisliste([kopfzeile,
    'A-1;Mit Preis;STK;10,00;20,00;Zubehör;;nein',
    'A-2;Auf Anfrage;STK;auf Anfrage;;Zubehör;;nein',
    'A-3;Leer;STK;;;Zubehör;;nein',
    'A-4;Null;STK;0;;Zubehör;;nein',
  ].join('\n'), lage);
  assert.deepEqual(e.artikel.map((a) => a.sku), ['A-1']);
  assert.equal(e.abgelehnt.length, 3);
  for (const a of e.abgelehnt) assert.match(a.grund, /kein brauchbarer Einkaufspreis/);
  assert.ok(e.abgelehnt.every((a) => a.bezeichnung), 'jede Ablehnung nennt den Artikel beim Namen');
});

test('ein Listenpreis unter dem Einkaufspreis ist ein Datenfehler, kein Schnäppchen', () => {
  const e = lesePreisliste(`${kopfzeile}\nA-9;Verdreht;STK;10,00;5,00;Zubehör;;nein`, lage);
  assert.equal(e.artikel.length, 0);
  assert.match(e.abgelehnt[0].grund, /Listenpreis 5 liegt unter dem Einkaufspreis 10/);
});

test('doppelte Artikelnummern werden gemeldet, nicht überschrieben', () => {
  const e = lesePreisliste([kopfzeile,
    'A-1;Erste;STK;10,00;20,00;Zubehör;;nein',
    'A-1;Zweite;STK;11,00;20,00;Zubehör;;nein',
  ].join('\n'), lage);
  assert.equal(e.artikel.length, 1);
  assert.equal(e.artikel[0].bezeichnung, 'Erste');
  assert.match(e.abgelehnt[0].grund, /mehrfach/);
});

test('Gewicht und Sperrgut werden übernommen, wenn sie dastehen', () => {
  const e = lesePreisliste([kopfzeile,
    'A-1;Schwer;STK;10,00;20,00;Kanal;3,4;ja',
    'A-2;Leicht;STK;10,00;20,00;Zubehör;;nein',
  ].join('\n'), lage);
  const [schwer, leicht] = e.artikel;
  assert.equal(schwer.gewichtKg, 3.4);
  assert.equal(schwer.gewichtQuelle, 'liste');
  assert.equal(schwer.sperrgut, true);
  assert.equal(leicht.gewichtKg, undefined, 'ohne Angabe kein Gewicht — und keine Null');
  assert.equal(leicht.sperrgut, false);
});

/* ------------------------------------------------------------------ *
 * Zusammenführen — der Bestand gewinnt
 * ------------------------------------------------------------------ */

const bestand = {
  artikel: [{
    sku: 'B-1', bezeichnung: 'Aus der Rechnung', gruppe: 'Kanal', einheit: 'STK',
    lieferantId: 'poschacher', preisStand: '2026-06-09', ekQuelle: 'bestaetigt',
    gewichtKg: 1.7333, gewichtQuelle: 'rechnung', sperrgut: true,
  }],
};
const bestandPreise = { preise: { 'B-1': { ekNetto: 2.2, stand: '2026-06-09' } } };

test('ein Gewicht aus der Rechnung überlebt den Import', () => {
  // Dieselbe Lehre wie beim Katalogerzeuger, der die Gewichte gelöscht hat:
  // Ein belegtes Gewicht ist mehr wert als eine Listenangabe.
  const gelesen = lesePreisliste(
    `${kopfzeile}\nB-1;Aus der Liste;STK;9,99;30,00;Kanal;99;nein`, lage,
  );
  const z = fuegeZusammen(bestand, bestandPreise, gelesen);
  const b1 = z.artikel.find((a) => a.sku === 'B-1');
  assert.equal(b1.gewichtKg, 1.7333, 'die Liste hat das Rechnungsgewicht überschrieben');
  assert.equal(b1.gewichtQuelle, 'rechnung');
  assert.equal(b1.bezeichnung, 'Aus der Rechnung');
  assert.equal(z.preise['B-1'].ekNetto, 2.2, 'der Preis aus dem Beleg bleibt');
});

test('neue Artikel kommen dazu, der Bestand bleibt vollzählig', () => {
  const gelesen = lesePreisliste([kopfzeile,
    'N-1;Neu eins;STK;10,00;20,00;Zubehör;;nein',
    'N-2;Neu zwei;M2;5,00;9,00;Dämmung;;ja',
  ].join('\n'), lage);
  const z = fuegeZusammen(bestand, bestandPreise, gelesen);
  assert.equal(z.artikel.length, 3);
  assert.deepEqual(z.neu.sort(), ['N-1', 'N-2']);
  assert.ok(z.artikel.some((a) => a.sku === 'B-1'), 'der Bestandsartikel fehlt');
  assert.equal(z.preise['N-1'].ekNetto, 10);
  assert.equal(z.preise['N-1'].uvpNetto, 20);
});

/* ------------------------------------------------------------------ *
 * Das Werkzeug, wirklich ausgeführt
 * ------------------------------------------------------------------ */

const lauf = (dateiInhalt, args = []) => {
  const ordner = wegwerfordner('preisliste-');
  const csv = join(ordner, 'artikelliste.csv');
  writeFileSync(csv, dateiInhalt);
  const katalog = join(ordner, 'katalog.json');
  const preise = join(ordner, 'preise.json');
  copyFileSync(pfad('../data/katalog-baustoff.json'), katalog);
  const quellePreise = pfad('../../preise/baustoff-preise.json');
  writeFileSync(preise, existsSync(quellePreise) ? readFileSync(quellePreise, 'utf8') : '{"preise":{}}');
  const e = spawnSync(process.execPath, [werkzeug, csv, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PREISLISTE_KATALOG: katalog, PREISLISTE_PREISE: preise },
  });
  return { e, katalog, preise, ordner };
};

const dreiZeilen = [kopfzeile,
  'X-1;Neuer Artikel eins;STK;10,00;20,00;Zubehör;;nein',
  'X-2;Neuer Artikel zwei;M2;5,00;9,00;Dämmung;;ja',
  'X-3;Ohne Preis;STK;auf Anfrage;;Zubehör;;nein',
].join('\n');

test('ohne --schreiben ändert das Werkzeug nichts', () => {
  const { e, katalog } = lauf(dreiZeilen);
  assert.equal(e.status, 0, e.stderr);
  assert.match(e.stdout, /Probelauf/);
  assert.match(e.stdout, /Neu:\s+2/);
  assert.match(e.stdout, /Abgelehnt:\s+1/);
  const nachher = JSON.parse(readFileSync(katalog, 'utf8'));
  assert.ok(!nachher.artikel.some((a) => a.sku === 'X-1'), 'der Probelauf hat geschrieben');
});

test('mit --schreiben stehen die Artikel im Katalog und die Preise daneben', () => {
  const { e, katalog, preise } = lauf(dreiZeilen, ['--schreiben']);
  assert.equal(e.status, 0, e.stderr);
  const k = JSON.parse(readFileSync(katalog, 'utf8'));
  const p = JSON.parse(readFileSync(preise, 'utf8'));
  // Relativ gezählt, nicht absolut: Eine Probe, die „48" erwartet, fällt an
  // dem Tag um, an dem der Katalog wächst — und dann sieht es aus, als wäre
  // der Import kaputt. Aufgefallen im Lastlauf vom 28.08.
  const vorher = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8')).artikel.length;
  assert.equal(k.artikel.length, vorher + 2, 'der Bestand plus zwei neue');
  assert.ok(k.artikel.some((a) => a.sku === 'X-1'));
  assert.ok(!k.artikel.some((a) => a.sku === 'X-3'), 'der Artikel ohne Preis ist draußen');
  assert.equal(p.preise['X-1'].ekNetto, 10);
  // Der Katalog bleibt preisfrei — dieselbe Trennung wie bei den Rechnungen.
  assert.ok(!JSON.stringify(k).includes('ekNetto'), 'ein Preis ist in die öffentliche Datei geraten');
});

test('eine als Muster gekennzeichnete Datei wird abgewiesen', () => {
  const ordner = wegwerfordner('preisliste-');
  const csv = join(ordner, 'muster-liste.csv');
  writeFileSync(csv, dreiZeilen);
  const e = spawnSync(process.execPath, [werkzeug, csv, '--schreiben'], { encoding: 'utf8' });
  assert.equal(e.status, 3);
  assert.match(e.stderr, /als Muster gekennzeichnet/);
});

test('eine Datei ohne Pflichtspalten bricht ab und sagt, was fehlt', () => {
  const { e } = lauf('sku;bezeichnung\nA-1;Etwas');
  assert.equal(e.status, 2);
  assert.match(e.stderr, /Pflichtspalte fehlt: einheit/);
  assert.match(e.stderr, /sku;bezeichnung;einheit;ek_netto/);
});

test('Artikel ohne Warengruppe werden gemeldet, nicht stillschweigend eingeordnet', () => {
  // Gefunden beim Probeimport einer Liste ohne Spalte `gruppe`: Die Artikel
  // landeten in „Ohne Gruppe", der Seitenbau lief durch, und sie waren im
  // Shop nur über die Suche erreichbar — in keiner Sortimentsliste, in keiner
  // Kachel. Ein Artikel, den niemand findet, ist kein Sortiment.
  const { e } = lauf([kopfzeile.split(';').filter((s) => s !== 'gruppe').join(';'),
    'OG-1;Ohne Warengruppe;STK;10,00;20,00;;nein'].join('\n'));
  assert.equal(e.status, 0, e.stderr);
  assert.match(e.stdout, /1 Artikel ohne Warengruppe/);
  assert.match(e.stdout, /bricht deshalb ab/);
});
