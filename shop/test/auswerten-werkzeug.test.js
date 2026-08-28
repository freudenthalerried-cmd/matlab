import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const werkzeug = fileURLToPath(new URL('../bin/auswerten.mjs', import.meta.url));
const beispiel = fileURLToPath(new URL('../beispiel/antworten-beispiel.json', import.meta.url));
const ablage = mkdtempSync(join(tmpdir(), 'auswerten-'));

test('das Auswertungswerkzeug läuft über die Beispieldatei und trägt vor', () => {
  const ausgabe = execFileSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.ok(ausgabe.includes('FIKTIVE Antworten'), 'der Hinweis auf die fiktive Vorlage fehlt');
  assert.ok(ausgabe.includes('Prüfung A: BESTANDEN'), 'Prüfung A der Beispieldatei muss bestehen');
  assert.ok(ausgabe.includes('tragende Marge: 40,0 %'), 'die tragende Marge der Beispieldatei ist 40 %');
  assert.ok(ausgabe.includes('Partnerrunde: MACHBAR'), 'die Partnerrunde der Beispieldatei ist machbar');
  assert.ok(ausgabe.includes('im Band 100–250 €'), 'der tragende Leadpreis liegt im Band');
  assert.ok(ausgabe.includes('Gate 17'), 'der Schlusssatz nennt Gate 17');
});

test('das Werkzeug nimmt eine eigene Antwortdatei als Argument', () => {
  const eigene = beispiel;
  const ausgabe = execFileSync(process.execPath, [werkzeug, eigene], { encoding: 'utf8' });
  assert.ok(ausgabe.includes('antworten-beispiel.json'), 'die übergebene Datei wird im Kopf genannt');
  assert.ok(ausgabe.includes('Lieferantenantworten: 4'), 'alle vier Lieferantenantworten werden gezählt');
  assert.ok(ausgabe.includes('FIKTIV Schweigsam AG — unvollständig'), 'der leere Bogen wird als unvollständig ausgewiesen');
});

test('fehlt der lage-Block, sagt das Werkzeug das, statt die Folgen stumm wegzulassen', () => {
  const daten = JSON.parse(readFileSync(beispiel, 'utf8'));
  delete daten.lage;
  const datei = join(ablage, 'ohne-lage.json');
  writeFileSync(datei, JSON.stringify(daten));
  const ausgabe = execFileSync(process.execPath, [werkzeug, datei], { encoding: 'utf8' });
  assert.ok(ausgabe.includes('Folgen: nicht berechenbar'), 'die fehlende Lage muss benannt werden');
  assert.ok(ausgabe.includes('lage-Block'), 'die Meldung nennt das fehlende Stück');
});

test('eine nicht tragfähige Lage wird mit ihrem Grund vorgetragen, nicht verschluckt', () => {
  const daten = JSON.parse(readFileSync(beispiel, 'utf8'));
  daten.lage.werbeanteil = 0.45;
  const datei = join(ablage, 'nicht-tragfaehig.json');
  writeFileSync(datei, JSON.stringify(daten));
  const ausgabe = execFileSync(process.execPath, [werkzeug, datei], { encoding: 'utf8' });
  assert.ok(ausgabe.includes('NICHT TRAGFÄHIG'), 'die Untragfähigkeit muss sichtbar sein');
  assert.ok(ausgabe.includes('Nach Werbung und Gebühren bleibt nichts übrig'), 'der Grund aus der Kaskade steht dabei');
});

test('eine fehlende oder kaputte Datei gibt eine Meldung, keinen Stacktrace', () => {
  const fehlt = spawnSync(process.execPath, [werkzeug, join(ablage, 'gibt-es-nicht.json')], { encoding: 'utf8' });
  assert.equal(fehlt.status, 1, 'fehlende Datei beendet mit Exit 1');
  assert.ok(fehlt.stderr.includes('Antwortdatei nicht lesbar'), 'die Meldung benennt das Problem');
  assert.ok(!fehlt.stderr.includes('at '), 'kein Stacktrace in der Meldung');

  const datei = join(ablage, 'kaputt.json');
  writeFileSync(datei, '[kaputt}');
  const kaputt = spawnSync(process.execPath, [werkzeug, datei], { encoding: 'utf8' });
  assert.equal(kaputt.status, 1, 'kaputtes JSON beendet mit Exit 1');
  assert.ok(kaputt.stderr.includes('antworten-beispiel.json'), 'die Meldung verweist auf das Muster');
});

test('ein Urteil über erfundene Daten sagt, dass es erfunden ist', () => {
  // Die Ausgabe endete bis zum 28.08. mit „Prüfung A: BESTANDEN" und einer
  // Umsatzfolge auf zwei Nachkommastellen — an Antworten, die es nie gegeben
  // hat. Der Hinweis stand oben; die Urteilszeile trug ihn nicht, und die
  // liest man zuerst.
  const ausgabe = execFileSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.match(ausgabe, /PROBELAUF\. Alle Eingaben sind erfunden\./);
  assert.match(ausgabe, /Prüfung A: BESTANDEN — an erfundenen Daten/);
  assert.match(ausgabe, /Partnerrunde: MACHBAR — an erfundenen Daten/);
});

test('sobald eine echte Antwort dabei ist, verschwindet der Hinweis', () => {
  // Abgeleitet statt hart gesetzt: Ein Schalter, den jemand umlegen müsste,
  // bliebe liegen — und dann stünde der Probelaufhinweis über echten Zahlen.
  const daten = JSON.parse(readFileSync(beispiel, 'utf8'));
  daten.lieferanten[0] = { ...daten.lieferanten[0], hersteller: 'Poschacher Baustoffe' };
  const pfad = join(ablage, 'mit-echter-antwort.json');
  writeFileSync(pfad, JSON.stringify(daten));
  const ausgabe = execFileSync(process.execPath, [werkzeug, pfad], { encoding: 'utf8' });
  assert.doesNotMatch(ausgabe, /PROBELAUF/);
  assert.doesNotMatch(ausgabe, /an erfundenen Daten/);
});
