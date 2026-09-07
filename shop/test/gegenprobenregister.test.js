import test from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { GEGENPROBEN, OHNE_GEGENPROBE, ARTEN, neueMeldungen, registerbefund, suchtextbefund } from '../src/gegenprobenregister.js';
import { PRUEFER } from '../src/pruefregister.js';

test('Jede Gegenprobe nennt Prüfer, Datei, Erwartung und Grund', () => {
  assert.ok(GEGENPROBEN.length >= 5, `nur ${GEGENPROBEN.length} Gegenproben`);
  for (const p of GEGENPROBEN) {
    assert.ok(p.pruefer && p.datei && p.was, p.id);
    assert.ok(ARTEN.includes(p.art), `${p.id}: ${p.art}`);
    assert.ok(p.erwartet instanceof RegExp, `${p.id}: ohne Erwartung ist jede rote Meldung recht`);
    assert.ok(p.warum.length >= 30, `${p.id}: der Grund fehlt`);
  }
});

test('Kein Prüfer bleibt ohne Gegenprobe und ohne Grund', () => {
  const b = registerbefund(PRUEFER.map((p) => p.name));
  assert.deepEqual(b.unerklaert, [], 'ein Prüfer ohne Gegenprobe ist eine Behauptung');
  assert.ok(b.gedeckt + b.begruendet >= PRUEFER.length, `${b.gedeckt + b.begruendet} von ${PRUEFER.length}`);
});

test('Jeder genannte Prüfer ist ein echter Befehl', async () => {
  // `pruefe-pruefer` steht bewusst nicht im Prüferregister — er prüft es. Er
  // ist aber ein npm-Befehl, und genau daran wird jeder Name gemessen: Ein
  // Tippfehler im Register wäre sonst eine Gegenprobe, die es nicht gibt.
  const { readFileSync } = await import('node:fs');
  const paket = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const namen = [...GEGENPROBEN.map((p) => p.pruefer), ...OHNE_GEGENPROBE.map((o) => o.pruefer)];
  assert.ok(namen.length >= 10, `nur ${namen.length} genannte Prüfer`);
  for (const n of namen) assert.ok(paket.scripts[n], `„${n}" ist kein npm-Befehl`);
});

test('Jeder Verzicht trägt seinen Grund', () => {
  // **Untergrenze auf 1 gesenkt am 02.09.** Sie stand auf 3, als die Liste
  // sieben Einträge hatte. An diesem Abend sind vier davon zu funktionierenden
  // Gegenproben geworden — die Zahl ist gefallen, weil die Sache besser wurde,
  // und eine Untergrenze, die das verbietet, hält den schlechteren Zustand
  // fest. Was die Zusicherung leisten soll, ist nur: Die Schleife darunter
  // läuft überhaupt.
  assert.ok(OHNE_GEGENPROBE.length >= 1, `nur ${OHNE_GEGENPROBE.length} begründete Verzichte`);
  for (const o of OHNE_GEGENPROBE) {
    assert.ok(o.warumKeine.length >= 30, `${o.pruefer}: der Grund ist zu knapp`);
  }
});

test('Ein Prüfer steht nicht zugleich mit und ohne Gegenprobe da', () => {
  const mit = new Set(GEGENPROBEN.map((p) => p.pruefer));
  assert.ok(mit.size >= 5 && OHNE_GEGENPROBE.length >= 1, 'zu wenige Einträge — die Schleife prüfte nichts');
  for (const o of OHNE_GEGENPROBE) {
    assert.ok(!mit.has(o.pruefer), `${o.pruefer} steht in beiden Listen`);
  }
});

test('Ein unvollständiger Eintrag wird abgewiesen, nicht gerechnet', () => {
  const ohneGrund = [{ id: 'x', pruefer: 'p', datei: 'd', art: 'anhaengen', text: 'y', erwartet: /x/, warum: 'kurz' }];
  assert.throws(() => registerbefund(['p'], ohneGrund, []), /Ohne Begründung/);
  const falscheArt = [{ ...ohneGrund[0], art: 'löschen', warum: 'ein hinreichend langer Grund für den Eintrag' }];
  assert.throws(() => registerbefund(['p'], falscheArt, []), /Mutationsart/);
  const halbesErsetzen = [{ id: 'x', pruefer: 'p', datei: 'd', art: 'ersetzen', erwartet: /x/, warum: 'ein hinreichend langer Grund für den Eintrag' }];
  assert.throws(() => registerbefund(['p'], halbesErsetzen, []), /suchen und ersetzen/);
});

test('Ein Prüfer, den weder Probe noch Grund kennt, fällt auf', () => {
  const b = registerbefund(['pruefe-erfunden'], [], []);
  assert.deepEqual(b.unerklaert, ['pruefe-erfunden']);
  assert.equal(b.vollstaendig, false);
});

test('Jeder Suchtext trifft genau die Stelle, die gemeint ist', async () => {
  // Am 7. September traf ein neuer Suchtext eine Zeile, die zweimal in
  // `shopkern.js` steht. Der Läufer ersetzt die erste Fundstelle — mutiert
  // wurde der Suchindex statt des öffentlichen Artikels, und der Prüfer meldete
  // zu Recht grün. Das sah aus wie ein Prüfer, der nicht anschlägt.
  //
  // Der volle Gegenprobenlauf braucht zwanzig Minuten und findet es erst dort.
  // Hier kostet dieselbe Auskunft Sekunden: gelesen wird nur, gemutet nichts.
  //
  // **Ausgenommen ist, was gerade selbst mutiert wird.** Läuft eine Gegenprobe,
  // steht ihre Datei mit ersetztem Suchtext da — dieser Fall meldete dann
  // `suchtext-passt-nicht` über eine Stelle, die es in einer Minute wieder
  // gibt. Der Mutationszettel sagt, welche Datei das gerade ist.
  const { readFileSync, existsSync } = await import('node:fs');
  const { markenpfad } = await import('../src/mutationsschutz.js');
  const wurzel = new URL('../../', import.meta.url);
  const lies = (datei) => {
    try {
      return readFileSync(new URL(datei, wurzel), 'utf8');
    } catch {
      return null;
    }
  };
  const unterMutation = (datei) => existsSync(markenpfad(fileURLToPath(new URL(datei, wurzel))));
  const b = suchtextbefund({ lies, unterMutation });
  assert.ok(b.geprueft >= 80, `nur ${b.geprueft} ersetzende Proben — die Schleife prüfte fast nichts`);
  assert.deepEqual(b.meldungen.map((m) => m.text), [], 'ein Suchtext trifft nicht die gemeinte Stelle');
});

test('Ein zweimal passender Suchtext fällt auf, ein gewollt mehrfacher nicht', () => {
  const eine = (zusatz) => [{
    id: 'x', pruefer: 'p', datei: 'd.txt', art: 'ersetzen',
    suchen: 'rot', ersetzen: 'blau', erwartet: /x/,
    warum: 'ein hinreichend langer Grund für den Eintrag', ...zusatz,
  }];
  const zweimal = () => 'rot und nochmal rot';

  const doppelt = suchtextbefund({ proben: eine({}), lies: zweimal });
  assert.equal(doppelt.sauber, false);
  assert.deepEqual(doppelt.meldungen.map((m) => m.regel), ['suchtext-mehrdeutig']);

  // `alle: true` meint genau das: Dort sollen alle Fundstellen fallen.
  assert.equal(suchtextbefund({ proben: eine({ alle: true }), lies: zweimal }).sauber, true);

  const fehlt = suchtextbefund({ proben: eine({}), lies: () => 'grün' });
  assert.deepEqual(fehlt.meldungen.map((m) => m.regel), ['suchtext-passt-nicht']);

  const weg = suchtextbefund({ proben: eine({}), lies: () => null });
  assert.deepEqual(weg.meldungen.map((m) => m.regel), ['datei-fehlt']);

  // Was gerade selbst mutiert wird, zählt nicht mit: Der Suchtext ist dort
  // ersetzt, und das ist kein Befund, sondern der Zweck der Mutation.
  const wegen = suchtextbefund({ proben: eine({}), lies: () => 'grün', unterMutation: () => true });
  assert.deepEqual(wegen.meldungen, []);
  assert.deepEqual(wegen.uebersprungen, ['x']);
  assert.equal(wegen.geprueft, 0);

  // Anhängende Proben haben keinen Suchtext — sie werden nicht gezählt.
  const anhaengen = suchtextbefund({
    proben: eine({ art: 'anhaengen', text: 'x', suchen: undefined, ersetzen: undefined }),
    lies: zweimal,
  });
  assert.equal(anhaengen.geprueft, 0);
  assert.equal(anhaengen.sauber, true);
});

test('Verglichen wird, was in der roten Ausgabe neu ist', () => {
  // Bis zum 7. September prüfte der Läufer die Erwartung gegen die **ganze**
  // rote Ausgabe. Gemessen passten 34 von 101 Erwartungen schon auf die
  // grüne — bei TAP fast alle, weil dort jeder Testfall beim Namen steht, ob
  // er durchläuft oder nicht. Eine Erwartung, die auch auf Grün passt, sagt
  // nur, dass es rot ist, nicht warum.
  const gruen = 'ok 1 - der Preis steht\nok 2 - die Fracht steht\n# duration_ms 12';
  const rot = 'ok 1 - der Preis steht\nnot ok 2 - die Fracht steht\n# duration_ms 19';
  const neu = neueMeldungen(gruen, rot);

  assert.match(neu, /not ok 2 - die Fracht steht/, 'die Fundzeile fehlt');
  assert.doesNotMatch(neu, /ok 1 - der Preis steht/, 'eine Zeile, die schon grün dastand, zählt nicht');
  assert.equal(neueMeldungen(gruen, gruen), '', 'ohne Unterschied bleibt nichts übrig');

  // Einrückung verschiebt sich zwischen zwei Läufen — verglichen wird beschnitten.
  assert.equal(neueMeldungen('  a\nb', 'a\n   b'), '');
});
