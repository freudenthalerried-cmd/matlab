import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beurteile, abbruchgrund, GELAUFEN } from '../src/prueferurteil.js';

const PRUEFER = { muster: /(\d+) Dinge geprüft/, mindestens: 20 };

test('Gelaufen, Menge genannt, über dem Mindestmaß — grün', () => {
  const u = beurteile({ code: 0, ausgabe: '42 Dinge geprüft, 0 mit Verdacht.' }, PRUEFER);
  assert.equal(u.art, 'grün');
  assert.equal(u.zahl, 42);
});

test('Treffer gemeldet (Code 1) zählt als gelaufen', () => {
  // Ein Prüfer, der etwas findet, endet mit 1. Das ist sein Befund, nicht
  // sein Scheitern — sonst meldete jeder erfolgreiche Fund einen toten Prüfer.
  const u = beurteile({ code: 1, ausgabe: '42 Dinge geprüft, 3 mit Verdacht.' }, PRUEFER);
  assert.equal(u.art, 'grün');
  assert.equal(u.zahl, 42);
});

test('Zu wenig angesehen — der Prüfer zeigt womöglich auf eine Probedatei', () => {
  const u = beurteile({ code: 0, ausgabe: '3 Dinge geprüft' }, PRUEFER);
  assert.equal(u.art, 'zu-wenig');
  assert.equal(u.zahl, 3);
});

test('Genau das Mindestmaß ist erfüllt, nicht verfehlt', () => {
  // Die Grenze gehört benannt, sonst entscheidet sie niemand: `mindestens`
  // heißt „mindestens". Ohne diesen Fall bleibt ein Vorzeichenfehler an der
  // Grenze unbemerkt — er verwirft dann genau den Prüfer, der sein Soll
  // gerade erfüllt.
  assert.equal(beurteile({ code: 0, ausgabe: '20 Dinge geprüft' }, PRUEFER).art, 'grün');
  assert.equal(beurteile({ code: 0, ausgabe: '19 Dinge geprüft' }, PRUEFER).art, 'zu-wenig');
});

test('Keine Mengenangabe — der Prüfer kann nicht sagen, ob er etwas ansah', () => {
  const u = beurteile({ code: 0, ausgabe: 'Alles in Ordnung.' }, PRUEFER);
  assert.equal(u.art, 'ohne-menge');
  assert.equal(u.zahl, null);
});

test('Ein Abbruch ist kein Prüfer ohne Mengenangabe', () => {
  // **Der Fehler, wegen dem dieses Modul entstanden ist.** Bis zum 30. August
  // meldete `pruefe-pruefer` genau diesen Fall als „keine Mengenangabe in der
  // Ausgabe" und schickte damit auf die Suche nach einem Muster, während die
  // Antwort — `npm run build` — im Abbruchtext stand.
  const u = beurteile(
    {
      code: 2,
      ausgabe: '',
      fehlerstrom:
        '\nAbbruch: demo.html ist älter als 1 Quelldatei(en) — zuerst npm run build.\n' +
        '  src/preis.js\n' +
        'Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.\n',
    },
    PRUEFER,
  );
  assert.equal(u.art, 'abbruch');
  assert.equal(u.code, 2);
  assert.equal(u.grund.length, 3);
  assert.match(u.grund[0], /zuerst npm run build/);
});

test('Ein Abbruch bleibt ein Abbruch, auch wenn zufällig eine Zahl dasteht', () => {
  // Sonst entschiede die Reihenfolge der Prüfung: Wer erst das Muster sucht
  // und dann den Code ansieht, erklärt einen abgestürzten Prüfer für grün,
  // weil in seiner halben Ausgabe noch eine Zahl stand.
  const u = beurteile({ code: 2, ausgabe: '99 Dinge geprüft' }, PRUEFER);
  assert.equal(u.art, 'abbruch');
});

test('Ohne Begründung auf stderr bleibt der Abbruch trotzdem ein Abbruch', () => {
  const u = beurteile({ code: 139, ausgabe: '' }, PRUEFER);
  assert.equal(u.art, 'abbruch');
  assert.equal(u.code, 139);
  assert.deepEqual(u.grund, []);
});

test('Der Abbruchgrund nimmt die letzten drei Zeilen, nicht den Fortschritt davor', () => {
  const text = ['Lade 1', 'Lade 2', 'Lade 3', 'Ursache', '  Datei', 'Merksatz'].join('\n');
  assert.deepEqual(abbruchgrund(text), ['Ursache', '  Datei', 'Merksatz']);
});

test('Die zweite Fangzahl wird genommen, wo das Muster zwei nennt', () => {
  const u = beurteile(
    { code: 0, ausgabe: '195 von 200 Dateien genannt' },
    { muster: /(\d+) von (\d+) Dateien genannt/, mindestens: 100, zweite: true },
  );
  assert.equal(u.zahl, 200);
  assert.equal(u.art, 'grün');
});

test('Nur 0 und 1 gelten als gelaufen', () => {
  assert.deepEqual(GELAUFEN, [0, 1]);
  for (const code of [2, 3, 127, 139, -1]) {
    assert.equal(beurteile({ code, ausgabe: '42 Dinge geprüft' }, PRUEFER).art, 'abbruch',
      `Code ${code} müsste als Abbruch gelten`);
  }
});

test('Das Werkzeug fällt sein Urteil nicht selbst', () => {
  // Gegen die Wiederkehr des Musters „zwei Wege zur selben Ausgabe": Sobald
  // `bin/prueferpruefung.mjs` wieder eigene Vergleiche gegen `mindestens`
  // oder den Ausgangscode anstellt, gibt es zwei Urteile, und diese Probe
  // deckt nur noch eines davon ab.
  const quelle = readFileSync(
    fileURLToPath(new URL('../bin/prueferpruefung.mjs', import.meta.url)), 'utf8',
  );
  assert.match(quelle, /beurteile\(\{ code, ausgabe, fehlerstrom \}, p\)/);
  const zeilen = quelle.split('\n').filter((z) => !z.trimStart().startsWith('//'));
  const eigenerVergleich = zeilen.filter((z) => /zahl\s*<\s*p\.mindestens|code !== 0/.test(z));
  assert.deepEqual(eigenerVergleich, [],
    'das Werkzeug urteilt wieder selbst — dann prüft prueferurteil.test.js nur noch die halbe Wahrheit');
});
