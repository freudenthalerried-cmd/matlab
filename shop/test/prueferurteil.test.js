import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  // **Nicht mehr `assert.match(quelle, /beurteile\(…\)/)`.** Am 31.08. abends
  // mit `npm run gegenprobe` nachgemessen: Diese Zeile passiert auch dann,
  // wenn der Aufruf zwar dasteht, sein **Ergebnis aber weggeworfen** und
  // durch ein festes `{ art: 'grün', zahl: 99 }` ersetzt wird. Das Werkzeug
  // meldete dann jeden Prüfer als grün mit 99 Einheiten — der zustimmende
  // Prüfer, gegen den dieses ganze Modul gebaut ist.
  //
  // Eine Probe, die die Schreibweise prüft, prüft nicht das Verhalten. Das
  // Verhalten prüft der Testfall darunter, indem er die gemeldeten Zahlen
  // gegen die Prüfer selbst hält.
  const zeilen = quelle.split('\n').filter((z) => !z.trimStart().startsWith('//'));
  const eigenerVergleich = zeilen.filter((z) => /zahl\s*<\s*p\.mindestens|code !== 0/.test(z));
  assert.deepEqual(eigenerVergleich, [],
    'das Werkzeug urteilt wieder selbst — dann prüft prueferurteil.test.js nur noch die halbe Wahrheit');
});


test('Die gemeldeten Zahlen stammen von den Prüfern, nicht aus dem Werkzeug', () => {
  // **Die Verhaltensprobe.** Ein festverdrahtetes Urteil — „grün, 99
  // Einheiten" — käme durch jede Prüfung der Schreibweise. Es käme nicht
  // durch diese: Sie lässt zwei Prüfer **selbst** laufen und verlangt, dass
  // `pruefe-pruefer` genau deren Zahlen nennt.
  //
  // Damit ist die Zusicherung an das gebunden, worum es geht: dass das
  // Werkzeug wiedergibt, was die Prüfer sagen, statt sich etwas auszudenken.
  const lauf = (datei, argumente = []) => spawnSync(
    process.execPath, [fileURLToPath(new URL(`../bin/${datei}`, import.meta.url)), ...argumente],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  ).stdout ?? '';

  const bericht = lauf('prueferpruefung.mjs');
  assert.match(bericht, /Prüfer befragt/, 'das Werkzeug hat nicht berichtet');

  // Zwei Prüfer, die ohne Browser laufen und ihre Menge selbst nennen.
  const eigen = [
    ['pruefe-tests', lauf('testpruefung.mjs'), /(\d+) Testfälle geprüft/, 'Testfälle'],
    ['pruefe-stand', lauf('standpruefung.mjs'), /\d+ von (\d+) Dateien sind in STATUS/, 'Arbeitsdateien'],
  ];
  assert.equal(eigen.length, 2, 'ohne Vergleichsprüfer sagt diese Probe nichts');

  for (const [name, ausgabe, muster, einheit] of eigen) {
    const selbst = ausgabe.match(muster);
    assert.ok(selbst, `${name} nennt seine Menge nicht`);
    const gemeldet = bericht.match(new RegExp(`✓ ${name} — (\\d+) ${einheit}`));
    assert.ok(gemeldet, `pruefe-pruefer meldet ${name} nicht: ${bericht}`);
    assert.equal(gemeldet[1], selbst[1],
      `${name}: gemeldet ${gemeldet[1]}, selbst gezählt ${selbst[1]} — das Werkzeug denkt sich Zahlen aus`);
  }
});

/* ------------------------------------------------------------------ *
 * Kennt der Prüfer der Prüfer alle Prüfer?
 * ------------------------------------------------------------------ */

/**
 * **Der Fund vom 01.09.** `pruefe-preisalter` kam als neuntes Werkzeug dazu.
 * Das Register in `bin/prueferpruefung.mjs` kannte es nicht, und der Prüfer
 * der Prüfer meldete weiter „8 Prüfer befragt, 0 ohne belastbaren Umfang" —
 * ein vollständiges Ergebnis über eine unvollständige Liste.
 *
 * Genau die Fehlerfamilie, die dieses Werkzeug verhindern soll: nicht das
 * Urteil war falsch, sondern die Menge, über die geurteilt wurde. Und
 * abfangen konnte es niemand, weil das Register in einem Skript stand, das
 * beim Laden losläuft.
 *
 * Diese Probe hängt an `package.json` und nicht an einer zweiten Liste: Wer
 * einen `pruefe-*`-Befehl anlegt, wird hier daran erinnert, ihn eintragen zu
 * lassen.
 */
test('Jeder pruefe-Befehl steht im Register des Prüferprüfers', async () => {
  const { PRUEFER, BROWSERPRUEFER } = await import('../src/pruefregister.js');
  const paket = JSON.parse(
    readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
  );

  const befehle = Object.keys(paket.scripts).filter((n) => n.startsWith('pruefe-'));
  assert.ok(befehle.length >= 5, `nur ${befehle.length} pruefe-Befehle — die Schleife prüft zu wenig`);

  const registriert = new Set([...PRUEFER, ...BROWSERPRUEFER].map((p) => p.name));
  assert.ok(registriert.size > 0, 'leeres Register — die Schleife darunter prüft nichts');

  // Der Prüfer der Prüfer prüft sich nicht selbst: Er würde sich beim Lauf
  // rekursiv aufrufen. Das ist die eine begründete Ausnahme, und sie steht
  // hier namentlich statt als Muster.
  const AUSGENOMMEN = new Set(['pruefe-pruefer']);

  const fehlend = befehle.filter((n) => !registriert.has(n) && !AUSGENOMMEN.has(n));
  assert.deepEqual(fehlend, [],
    'diese Prüfer laufen, werden aber vom Prüfer der Prüfer nicht befragt');

  // Und die Gegenrichtung: ein Registereintrag ohne Befehl liefe ins Leere.
  const ohneBefehl = [...registriert].filter(
    (n) => !befehle.includes(n) && !Object.keys(paket.scripts).includes(n),
  );
  assert.deepEqual(ohneBefehl, [], 'diese Registereinträge haben keinen npm-Befehl');
});

/**
 * Die Klammer, die das Register nennt, muss es im Muster geben.
 *
 * Am 3. September meldete `pruefe-pruefer` „✓ pruefe-datenschutz — NaN Zusagen
 * über den Code". Der Eintrag trug `zweite: true`, sein Muster hat aber nur
 * eine Klammer; `Number(undefined)` ist NaN, und `NaN < 5` ist falsch — also
 * grün. Ein Prüfer, der nichts messen kann, gab damit das beste Zeugnis ab.
 *
 * Die Anzahl der Klammern eines Musters lässt sich messen, ohne den Prüfer zu
 * starten: Ein Muster mit angehängtem `|` trifft auf den leeren Text und
 * liefert genau so viele Gruppen, wie es Klammern hat.
 */
test('Jeder Registereintrag liest eine Klammer, die sein Muster hat', async () => {
  const { PRUEFER, BROWSERPRUEFER } = await import('../src/pruefregister.js');
  const alle = [...PRUEFER, ...BROWSERPRUEFER];
  assert.ok(alle.length >= 15, `nur ${alle.length} Registereinträge — die Schleife prüft zu wenig`);

  const falsch = alle
    .map((p) => {
      const klammern = new RegExp(`${p.muster.source}|`).exec('').length - 1;
      return { name: p.name, klammern, gelesen: p.zweite ? 2 : 1 };
    })
    .filter((e) => e.gelesen > e.klammern);

  assert.deepEqual(falsch, [],
    'diese Einträge lesen eine Klammer, die ihr Muster nicht hat — ihr Umfang wäre NaN');
});

/** Und das Urteil selbst darf NaN nicht durchlassen, egal wer es erzeugt. */
test('Eine Nichtzahl an der abgefragten Stelle ist keine Menge', () => {
  const urteil = beurteile(
    { code: 0, ausgabe: 'Datenschutzzusagen — 6 auf der Seite' },
    { muster: /Datenschutzzusagen — (\d+) auf der Seite/, mindestens: 5, zweite: true },
  );
  assert.equal(urteil.art, 'ohne-menge',
    'NaN < mindestens ist falsch — ohne Fangstelle wäre das Urteil grün gewesen');
  assert.equal(urteil.zahl, null);
});
