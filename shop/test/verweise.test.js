import test from 'node:test';
import assert from 'node:assert/strict';

import { GRUND_MINDESTLAENGE, OHNE_EINGANG, verweisbefund } from '../src/verweise.js';

const seite = (titel, inhalt = '') => `<title>${titel}</title>`
  + `<meta name="description" content="Beschreibung ${titel}">`
  + `<h1>Überschrift ${titel}</h1>${inhalt}`;

const bau = (dateien, zusatz = {}) => verweisbefund({
  seiten: new Map(Object.entries(dateien)),
  aufloesen: (von, ziel) => (ziel.startsWith('/') ? ziel.slice(1) : ziel),
  gibtEs: (pfad) => Object.hasOwn(dateien, pfad),
  ohneEingang: [],
  mindestens: 1,
  ...zusatz,
});

test('Ein Verweis ins Leere fällt auf', () => {
  const b = bau({
    'a.html': seite('A', '<a href="/b.html">B</a><a href="/weg.html">weg</a>'),
    'b.html': seite('B', '<a href="/a.html">A</a>'),
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['verweis-ins-leere']);
  assert.match(b.meldungen[0].text, /weg\.html/);
  assert.equal(b.verweise, 3);
});

test('Auswärtige Verweise und Anker zählen nicht mit', () => {
  const b = bau({
    'a.html': seite('A', '<a href="https://example.at/x">x</a><a href="mailto:a@b.at">m</a>'
      + '<a href="#unten">u</a><a href="/b.html#stelle">b</a>'),
    'b.html': seite('B', '<a href="/a.html">A</a>'),
  });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.verweise, 2, 'gezählt werden nur die internen');
});

test('Eine Seite ohne eingehenden Verweis braucht einen Grund', () => {
  const dateien = {
    'a.html': seite('A', '<a href="/a.html">selbst</a>'),
    'frei.html': seite('Frei'),
  };
  const ohne = bau(dateien);
  assert.deepEqual(ohne.meldungen.map((m) => m.regel), ['seite-ohne-eingang', 'seite-ohne-eingang']);

  const mit = bau(dateien, {
    ohneEingang: [
      { datei: 'a.html', warum: 'x'.repeat(GRUND_MINDESTLAENGE) },
      { datei: 'frei.html', warum: 'x'.repeat(GRUND_MINDESTLAENGE) },
    ],
  });
  assert.deepEqual(mit.meldungen, []);
  assert.equal(mit.ohneEingang, 2);

  // Ein Verweis auf sich selbst zählt nicht als eingehender.
  const grundWeg = bau({ 'a.html': seite('A', '<a href="/a.html">x</a>') }, {
    ohneEingang: [
      { datei: 'a.html', warum: 'x'.repeat(GRUND_MINDESTLAENGE) },
      { datei: 'gibt-es-nicht.html', warum: 'x'.repeat(GRUND_MINDESTLAENGE) },
    ],
  });
  assert.deepEqual(grundWeg.meldungen.map((m) => m.regel), ['grund-ohne-seite']);
});

test('Zwei Seiten mit demselben Titel fallen auf', () => {
  const b = bau({
    'a.html': '<title>Gleich</title><meta name="description" content="a"><h1>A</h1><a href="/b.html">b</a>',
    'b.html': '<title>Gleich</title><meta name="description" content="b"><h1>B</h1><a href="/a.html">a</a>',
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['Titel-doppelt']);
  assert.match(b.meldungen[0].text, /a\.html, b\.html/);
});

test('Eine Seite ohne Titel fällt auf, und eine zu kurze Liste auch', () => {
  const ohne = bau({ 'a.html': '<h1>A</h1>' }, {
    ohneEingang: [{ datei: 'a.html', warum: 'x'.repeat(GRUND_MINDESTLAENGE) }],
  });
  assert.deepEqual(ohne.meldungen.map((m) => m.regel).sort(),
    ['ohne-Beschreibung', 'ohne-Titel']);

  const kurz = bau({ 'a.html': seite('A') }, {
    ohneEingang: [{ datei: 'a.html', warum: 'x'.repeat(GRUND_MINDESTLAENGE) }],
    mindestens: 5,
  });
  assert.deepEqual(kurz.meldungen.map((m) => m.regel), ['zu-wenig-seiten']);
});

test('Jede verweisfreie Seite des Bestands nennt einen Grund, der einer ist', () => {
  assert.ok(OHNE_EINGANG.length >= 1, 'leeres Register — die Schleife prüft nichts');
  for (const o of OHNE_EINGANG) {
    assert.match(o.datei, /\.html$/, `${o.datei} ist keine Seite`);
    assert.ok(o.warum.length >= GRUND_MINDESTLAENGE, `${o.datei}: der Grund ist zu knapp`);
  }
});
