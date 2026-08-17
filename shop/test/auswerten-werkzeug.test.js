import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const werkzeug = fileURLToPath(new URL('../bin/auswerten.mjs', import.meta.url));

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
  const eigene = fileURLToPath(new URL('../beispiel/antworten-beispiel.json', import.meta.url));
  const ausgabe = execFileSync(process.execPath, [werkzeug, eigene], { encoding: 'utf8' });
  assert.ok(ausgabe.includes('antworten-beispiel.json'), 'die übergebene Datei wird im Kopf genannt');
  assert.ok(ausgabe.includes('Lieferantenantworten: 4'), 'alle vier Lieferantenantworten werden gezählt');
  assert.ok(ausgabe.includes('FIKTIV Schweigsam AG — unvollständig'), 'der leere Bogen wird als unvollständig ausgewiesen');
});
