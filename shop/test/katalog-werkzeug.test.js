import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Der Katalogerzeuger, wirklich ausgeführt.
 *
 * Anlass ist der Fund vom 28.08.: `npm run katalog` schrieb den Katalog neu
 * und **löschte dabei die sieben belegten Gewichte**, die ein anderes
 * Werkzeug eingetragen hatte. Kein Test hat das bemerkt, weil keiner den
 * Erzeuger je laufen ließ.
 *
 * > **Ein Erzeuger, den keine Probe ausführt, wird von der Probe nicht
 * > geprüft — egal wie viele Tests seine Ausgabe lesen.**
 *
 * Quelle und Ziele kommen deshalb aus der Umgebung; jeder Lauf schreibt in
 * einen frischen Ordner und lässt den Bestand in Ruhe.
 */
const werkzeug = fileURLToPath(new URL('../bin/katalog-aus-rechnungen.mjs', import.meta.url));
const quelle = fileURLToPath(new URL('../../preise/poschacher-positionen.csv', import.meta.url));
const gewichte = fileURLToPath(new URL('../../preise/gewichte-aus-rechnungen.json', import.meta.url));
const vorhanden = existsSync(quelle) && existsSync(gewichte);

const lauf = (umgebung) => {
  const ordner = mkdtempSync(join(tmpdir(), 'katalogprobe-'));
  const ziel = join(ordner, 'katalog.json');
  const preise = join(ordner, 'preise.json');
  const ergebnis = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: {
      ...process.env,
      KATALOG_QUELLE: quelle,
      KATALOG_ZIEL: ziel,
      KATALOG_PREISE_ZIEL: preise,
      KATALOG_GEWICHTE: gewichte,
      ...umgebung,
    },
  });
  return { ergebnis, ziel, ordner };
};

test('der Erzeuger schreibt die belegten Gewichte mit', { skip: !vorhanden && 'Belegdaten fehlen' }, () => {
  const { ergebnis, ziel } = lauf();
  assert.equal(ergebnis.status, 0, ergebnis.stderr);
  const katalog = JSON.parse(readFileSync(ziel, 'utf8'));
  const mitGewicht = katalog.artikel.filter((a) => a.gewichtKg != null);
  assert.equal(mitGewicht.length, 7, `${mitGewicht.length} statt 7 Artikel mit belegtem Gewicht`);
  for (const a of mitGewicht) {
    assert.equal(a.gewichtQuelle, 'rechnung', `${a.sku}: Gewicht ohne Quellenangabe`);
    assert.ok(a.gewichtKg > 0, `${a.sku}: Gewicht ist nicht positiv`);
  }
  assert.match(String(katalog._gewichtHinweis), /UNBEKANNT/,
    'der Hinweis, dass fehlende Gewichte nicht geschätzt werden, muss mitkommen');
});

test('ein zweiter Lauf ändert nichts', { skip: !vorhanden && 'Belegdaten fehlen' }, () => {
  // Ein Erzeuger, dessen zweiter Lauf ein anderes Ergebnis liefert, hat einen
  // Zustand, den niemand sieht.
  const erst = lauf();
  const zweit = lauf();
  assert.equal(readFileSync(erst.ziel, 'utf8'), readFileSync(zweit.ziel, 'utf8'));
});

test('ohne Gewichtsdatei bricht er ab, statt Belegtes zu löschen', { skip: !vorhanden && 'Belegdaten fehlen' }, () => {
  // Der Fehler vom 28.08., als Probe: Ein Lauf ohne die Gewichtsquelle darf
  // einen Katalog mit Gewichten nicht überschreiben.
  const { ziel, ordner } = lauf();
  assert.ok(JSON.parse(readFileSync(ziel, 'utf8')).artikel.some((a) => a.gewichtKg != null));

  const ergebnis = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: {
      ...process.env,
      KATALOG_QUELLE: quelle,
      KATALOG_ZIEL: ziel,
      KATALOG_PREISE_ZIEL: join(ordner, 'preise.json'),
      KATALOG_GEWICHTE: join(ordner, 'gibt-es-nicht.json'),
    },
  });
  assert.equal(ergebnis.status, 2, 'der Lauf muss abbrechen');
  assert.match(ergebnis.stderr, /belegte Gewichte gingen verloren/);
  assert.ok(JSON.parse(readFileSync(ziel, 'utf8')).artikel.some((a) => a.gewichtKg != null),
    'die Zieldatei darf dabei unverändert bleiben');
});


/* ------------------------------------------------------------------ *
 * Was am Tag der Artikelliste passiert
 * ------------------------------------------------------------------ */

test('eine Artikelliste wird als falsches Format abgewiesen, nicht als leere Liste gelesen', () => {
  // **Gemessen am 30.08.** mit dem Format, um das der Auftraggeber gebeten
  // wurde: `sku;bezeichnung;einheit;ek_netto;…`. Das Werkzeug las die Datei,
  // fand kein `ArtNr` und meldete „Positionen gelesen: 2 / Artikel im
  // Katalog: 0" — mit Ausgang 0. Am entscheidenden Tag liest sich das wie
  // „die Liste enthält keine brauchbare Ware".
  const ordner = mkdtempSync(join(tmpdir(), 'artikelliste-'));
  const liste = join(ordner, 'artikelliste.csv');
  writeFileSync(liste, 'sku;bezeichnung;einheit;ek_netto\n10001;Ziegel;STK;0,42\n');
  const { ergebnis } = lauf({ KATALOG_QUELLE: liste });
  assert.equal(ergebnis.status, 2, 'Abbruch statt stiller Nullausgabe');
  assert.match(ergebnis.stderr, /Es fehlen die Spalten: ArtNr/);
  assert.match(ergebnis.stderr, /Positionstabelle aus Lieferantenrechnungen/);
  assert.match(ergebnis.stderr, /import\.mjs/, 'der Weg für eine Artikelliste wird genannt');
});

test('ohne einen einzigen gelesenen Artikel wird nichts geschrieben', () => {
  // Der Gewichtswächter hat den Katalog gerettet, aber aus dem falschen
  // Grund — er meldete verlorene Gewichte, wo kein Artikel gelesen worden
  // war. Trüge der Bestand keine belegten Gewichte, wäre ein leerer Katalog
  // über den vollen geschrieben worden, mit der Meldung „geschrieben:".
  const ordner = mkdtempSync(join(tmpdir(), 'leer-'));
  const leer = join(ordner, 'positionen.csv');
  // Richtiger Kopf, aber keine Zeile mit Artikelnummer.
  writeFileSync(leer, 'Rechnung;Datum;Pos;ArtNr;Bezeichnung;Menge;Einheit;Einzelpreis;Preisbasis;RabattProzent;Betrag;Belegart\n'
    + '1;01.01.2026;1;;Ohne Nummer;1;STK;1,00;;-10;1,00;Rechnung\n');
  const ziel = join(ordner, 'katalog.json');
  writeFileSync(ziel, JSON.stringify({ artikel: [{ sku: 'POS-1', bezeichnung: 'Bestand' }] }));
  const ergebnis = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, KATALOG_QUELLE: leer, KATALOG_ZIEL: ziel, KATALOG_PREISE_ZIEL: join(ordner, 'preise.json') },
  });
  assert.equal(ergebnis.status, 2, 'Abbruch statt leerem Katalog');
  assert.match(ergebnis.stderr, /kein einziger Artikel gelesen/);
  const danach = JSON.parse(readFileSync(ziel, 'utf8'));
  assert.equal(danach.artikel.length, 1, 'der Bestand bleibt unangetastet');
  assert.equal(existsSync(join(ordner, 'preise.json')), false, 'auch keine Preisdatei');
});


test('ein halb umgelenkter Lauf bricht ab, statt in den Bestand zu schreiben', () => {
  // **Der Vorfall vom 30.08.**, und er ist mir selbst passiert: Eine
  // Gegenprobe lenkte `KATALOG_ZIEL` um und schrieb das Preisziel unter dem
  // falschen Namen (`PREISE_ZIEL`). Der Katalog ging in den Testordner, die
  // **Preisdatei in den Bestand** — und weil der Lauf keinen Artikel las,
  // stand dort danach eine leere Liste.
  //
  // Die Datei ist gitignoriert; kein `git checkout` holt sie zurück. Sie
  // ließ sich aus der Positionstabelle neu erzeugen, mit einem Befehl. Wer
  // eine Ausgabe umlenkt, lenkt beide um.
  const ordner = mkdtempSync(join(tmpdir(), 'halb-'));
  const ergebnis = spawnSync(process.execPath, [werkzeug, '--pruefen'], {
    encoding: 'utf8',
    env: { ...process.env, KATALOG_ZIEL: join(ordner, 'katalog.json'), KATALOG_PREISE_ZIEL: undefined },
  });
  assert.equal(ergebnis.status, 2, 'Abbruch statt halber Umlenkung');
  assert.match(ergebnis.stderr, /Nur eines der beiden Ziele ist umgelenkt/);
  assert.match(ergebnis.stderr, /kein git zurückholt/);
});
