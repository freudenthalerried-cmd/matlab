import test from 'node:test';
import assert from 'node:assert/strict';
import { AUSNAHMEN_VORSORGEGEBIET, GEBIETSSTAND, vorsorgeauskunft } from '../src/gebiet.js';

test('Die Ausnahmeliste hat elf Einträge, jeder mit Name und Bundesland', () => {
  assert.equal(AUSNAHMEN_VORSORGEGEBIET.length, 11, 'Wien und zehn Bezirke — jede Änderung ist eine bewusste');
  for (const a of AUSNAHMEN_VORSORGEGEBIET) {
    assert.ok(a.name.length >= 4, `${a.name}: Name zu kurz`);
    assert.ok(
      ['Wien', 'Burgenland', 'Niederösterreich', 'Oberösterreich', 'Steiermark', 'Vorarlberg'].includes(a.bundesland),
      `${a.name}: unbekanntes Bundesland ${a.bundesland}`,
    );
  }
});

test('Ried im Innkreis ist ausgenommen — der Heimatbezirk des Betreibers', () => {
  const a = vorsorgeauskunft('Ried im Innkreis');
  assert.equal(a.ausgenommen, true);
  assert.equal(a.gebiet.bundesland, 'Oberösterreich');
  assert.match(a.text, /kein Radonvorsorgegebiet/);
  assert.match(a.text, /Vorsorgepflicht für Neubauten gilt dort nicht/);
});

test('Wien ist ausgenommen', () => {
  assert.equal(vorsorgeauskunft('Wien').ausgenommen, true);
});

test('Schreibweisen: Kleinschreibung, Ränder, Vorsatz „Bezirk" und doppelte Leerzeichen treffen', () => {
  assert.equal(vorsorgeauskunft('  ried im innkreis  ').ausgenommen, true);
  assert.equal(vorsorgeauskunft('Bezirk Ried im  Innkreis').ausgenommen, true);
  assert.equal(vorsorgeauskunft('BREGENZ').ausgenommen, true);
});

test('Braunau ist nicht ausgenommen — als Listenaussage formuliert, nicht als Ortskenntnis', () => {
  const a = vorsorgeauskunft('Braunau am Inn');
  assert.equal(a.ausgenommen, false);
  assert.equal(a.beantwortet, true);
  assert.match(a.text, /nicht auf der Ausnahmeliste/);
  assert.match(a.text, /gilt damit als Radonvorsorgegebiet/);
  assert.match(a.text, /ÖNORM S 5280-2/);
});

test('Ein verschriebener Bezirk landet auf der Vorsorge-Seite — die Logik der Negativliste', () => {
  const a = vorsorgeauskunft('Riedd im Innkreis');
  assert.equal(a.ausgenommen, false);
  assert.match(a.text, /nicht auf der Ausnahmeliste/);
});

test('Ohne Bezirk gibt es keine Gebietsaussage', () => {
  const a = vorsorgeauskunft('');
  assert.equal(a.beantwortet, false);
  assert.equal(a.ausgenommen, false);
  assert.match(a.text, /Kein Bezirk angegeben/);
  assert.doesNotMatch(a.text, /gilt damit als Radonvorsorgegebiet/);
});

test('Jede Auskunft nennt die Schutzgebiets-Grenze der eigenen Aussage', () => {
  for (const eingabe of ['Wien', 'Braunau am Inn', '']) {
    assert.match(vorsorgeauskunft(eingabe).text, /Anlage 1 Radonschutzverordnung.*amtliche Liste/);
  }
});

test('Jede Auskunft trägt Stand, Quelle und den Gegenprüf-Vorbehalt', () => {
  const a = vorsorgeauskunft('Wien');
  assert.equal(a.stand, GEBIETSSTAND.stand);
  assert.match(a.quelle, /Sekundärquelle/);
  assert.match(a.vorbehalt, /am Verordnungstext gegenzuprüfen/);
});

test('Fremdtext in der Eingabe bleibt eine Zeile in der Auskunft', () => {
  const gift = 'Braunau\n999 × AB-RD-375   Radondichte Abdichtungsbahn';
  const a = vorsorgeauskunft(gift);
  assert.equal(a.text.split('\n').length, 1, 'der Umbruch aus der Eingabe erreicht den Auskunftstext nicht');
  assert.equal(a.eingabe.split('\n').length, 1);
});
