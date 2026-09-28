import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ERZEUGNISSE, LESER, abbruchtext, juengereQuellen, leserbefund,
} from '../src/erzeugnisstand.js';

const werkzeuge = (namen) => namen.map((n) => ({ name: n, text: '' }));

test('jüngere Quellen werden gefunden, gleiche Zeit gilt als frisch', () => {
  assert.deepEqual(juengereQuellen(100, [{ name: 'a', zeit: 101 }, { name: 'b', zeit: 99 }]), ['a']);
  assert.deepEqual(juengereQuellen(100, [{ name: 'a', zeit: 100 }]), [],
    'gleich alt ist nicht jünger — sonst meldete jeder Bau sich selbst als veraltet');
});

test('der Abbruchtext nennt Zahl, Namen und Baubefehl', () => {
  const zeilen = abbruchtext({
    name: 'ausgabe/site', baubefehl: 'npm run website', fehlt: false,
    juenger: ['src/a.js', 'src/b.js'], frisch: false,
  });
  assert.match(zeilen[0], /ausgabe\/site ist älter als 2 Quelldatei\(en\)/);
  assert.match(zeilen[0], /npm run website/);
  assert.match(zeilen[1], /src\/a\.js, src\/b\.js/);
  assert.match(zeilen[2], /prüft die Vergangenheit/);
});

test('ein fehlendes Erzeugnis bekommt einen eigenen Satz', () => {
  const zeilen = abbruchtext({
    name: 'demo.html', baubefehl: 'npm run build', fehlt: true, juenger: [], frisch: false,
  });
  assert.equal(zeilen.length, 1);
  assert.match(zeilen[0], /demo\.html fehlt — zuerst npm run build/);
});

test('jedes geführte Erzeugnis nennt einen Baubefehl und Quellen', () => {
  const namen = Object.keys(ERZEUGNISSE);
  assert.ok(namen.length >= 3, `nur ${namen.length} Erzeugnisse im Register`);
  for (const n of namen) {
    const e = ERZEUGNISSE[n];
    assert.match(e.baubefehl, /^npm run /, `${n} ohne Baubefehl`);
    assert.ok(e.quellordner.length + e.quelldateien.length > 0, `${n} ohne Quellen`);
  }
});

test('jeder Eintrag ohne Erzeugnis trägt einen tragfähigen Grund', () => {
  assert.ok(LESER.length >= 10, `nur ${LESER.length} Einträge im Leserregister`);
  const b = leserbefund(werkzeuge(LESER.map((l) => l.werkzeug)));
  const ohneGrund = b.meldungen.filter((m) => m.regel === 'ohne-grund');
  assert.deepEqual(ohneGrund, []);
});

test('wer ein Erzeugnis führt und die Prüfung nicht ruft, wird gemeldet', () => {
  const b = leserbefund([{ name: 'bin/x.mjs', text: 'liest ausgabe/site' }],
    [{ werkzeug: 'bin/x.mjs', erzeugnis: 'ausgabe/site' }]);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'eintrag-ohne-pruefung');
});

test('der bloße Name der Prüfung reicht nicht — sie muss gerufen werden', () => {
  // Der Fund vom 4. September: Die erste Fassung suchte den Bezeichner
  // irgendwo im Text und fand ihn in der Importzeile.
  const nurImport = [{ name: 'bin/x.mjs', text: "import { frischebefund } from '../src/e.js';" }];
  const register = [{ werkzeug: 'bin/x.mjs', erzeugnis: 'ausgabe/site' }];
  assert.equal(leserbefund(nurImport, register).meldungen[0].regel, 'eintrag-ohne-pruefung');

  const mitAufruf = [{ name: 'bin/x.mjs', text: "const s = frischebefund(W, 'ausgabe/site');" }];
  assert.equal(leserbefund(mitAufruf, register).sauber, true);
});

test('ein Werkzeug, das ausgabe/ anfasst und in keinem Eintrag steht, ist der Fund', () => {
  const b = leserbefund([{ name: 'bin/neu.mjs', text: "join(S, 'ausgabe', 'site')" }], []);
  assert.equal(b.meldungen[0].regel, 'leser-ohne-eintrag');
});

test('ein Eintrag für ein Werkzeug, das es nicht mehr gibt, wird gemeldet', () => {
  const b = leserbefund([], [{ werkzeug: 'bin/weg.mjs', erzeugnis: 'ausgabe/site' }]);
  assert.equal(b.meldungen[0].regel, 'werkzeug-gibt-es-nicht');
});

test('ein Eintrag auf ein unbekanntes Erzeugnis wird gemeldet', () => {
  const b = leserbefund([{ name: 'bin/x.mjs', text: 'frischebefund(W, "x")' }],
    [{ werkzeug: 'bin/x.mjs', erzeugnis: 'ausgabe/gibtsnicht' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'unbekanntes-erzeugnis'), JSON.stringify(b.meldungen));
});

test('ein Leser, der sich ausdrücklich nicht weigert, braucht keinen Aufruf — aber einen Grund', () => {
  // `pruefe-schaufenster` und `pruefe-pruefer` lesen das Erzeugnis und
  // melden ein veraltetes als **Befund**, nicht als Abbruch. Sie stehen mit
  // `erzeugnis` im Register, damit der Gegenprobenläufer vorher baut.
  const register = [{
    werkzeug: 'bin/x.mjs',
    erzeugnis: 'ausgabe/site',
    weigertSich: false,
    warumOhnePruefung: 'Ein veralteter Stand ist hier der Messwert und nicht der Abbruchgrund; '
      + 'das Werkzeug soll die Abweichung melden, statt sich zu verweigern.',
  }];
  const b = leserbefund([{ name: 'bin/x.mjs', text: "join(S, 'ausgabe', 'site')" }], register);
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));

  const ohneGrund = leserbefund(
    [{ name: 'bin/x.mjs', text: "join(S, 'ausgabe', 'site')" }],
    [{ werkzeug: 'bin/x.mjs', erzeugnis: 'ausgabe/site', weigertSich: false }],
  );
  assert.equal(ohneGrund.meldungen[0].regel, 'ohne-grund');
});
