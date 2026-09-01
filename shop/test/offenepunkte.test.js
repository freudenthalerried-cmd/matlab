import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { offenePunkte, ZUSTAENDIGKEITEN, OHNE_WERKZEUG } from '../src/offenepunkte.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));

test('Jede handgeführte Position nennt den Grund, warum kein Werkzeug sie kennt', () => {
  assert.ok(OHNE_WERKZEUG.length > 0, 'leere Liste — die Schleife darunter prüft nichts');
  for (const p of OHNE_WERKZEUG) {
    assert.ok(p.id && p.titel, `Position ohne Kennung oder Titel: ${JSON.stringify(p)}`);
    // Der Grund ist der ganze Zweck des Feldes: Wer hier etwas einträgt, das
    // ein Werkzeug messen könnte, soll beim Schreiben merken, dass er keinen
    // Grund hat.
    assert.ok(p.warumKeinWerkzeug.length > 40, `${p.id}: Grund zu dünn`);
    assert.ok(p.loest.length > 20, `${p.id}: sagt nicht, was er löst`);
    assert.ok(ZUSTAENDIGKEITEN[p.zustaendig], `${p.id}: unbekannte Zuständigkeit ${p.zustaendig}`);
  }
});

test('Die Gruppen stehen nach Rang und tragen jede Position genau einmal', () => {
  const ausWerkzeugen = [
    { id: 'a', titel: 'A', zustaendig: 'ausgabe', befund: 'x' },
    { id: 'b', titel: 'B', zustaendig: 'eintragen', befund: 'y' },
    { id: 'c', titel: 'C', zustaendig: 'eintragen', befund: 'z' },
  ];
  const g = offenePunkte(ausWerkzeugen, []);
  assert.deepEqual(g.map((x) => x.id), ['eintragen', 'ausgabe'], 'die Ränge greifen nicht');
  assert.equal(g[0].punkte.length, 2);

  // Nichts geht verloren: die Summe über die Gruppen ist die Zahl der Positionen.
  const alle = offenePunkte(ausWerkzeugen, OHNE_WERKZEUG);
  const summe = alle.reduce((s, x) => s + x.punkte.length, 0);
  assert.equal(summe, ausWerkzeugen.length + OHNE_WERKZEUG.length);

  // Eine unbekannte Zuständigkeit wird geworfen, nicht stillschweigend
  // einsortiert — eine Liste, die einen Punkt fallen lässt, ist schlimmer als
  // keine.
  assert.throws(() => offenePunkte([{ id: 'x', titel: 'X', zustaendig: 'irgendwas' }], []),
    /Unbekannte Zuständigkeit/);
});

/**
 * Die Aufstellung ist nur so viel wert, wie sie aus den Werkzeugen zieht.
 * Geprüft wird deshalb der Lauf selbst: Er muss die Befunde nennen, die
 * `startklar`, der Feed und die Preisalterprüfung gerade melden.
 */
test('Der Lauf zieht die Befunde aus den Werkzeugen', () => {
  const lauf = spawnSync('node', ['bin/offenepunkte.mjs'], { cwd: SHOP, encoding: 'utf8' });
  assert.equal(lauf.status, 0, `${lauf.stdout}${lauf.stderr}`);

  for (const quelle of ['npm run startklar', 'npm run veroeffentlichung', 'von Hand geführt']) {
    assert.ok(lauf.stdout.includes(`[${quelle}]`), `keine Position aus „${quelle}"`);
  }
  // Und jede Gruppe, die Positionen hat, steht mit ihrem Titel da.
  for (const z of Object.values(ZUSTAENDIGKEITEN)) {
    if (!lauf.stdout.includes(z.titel)) continue;
    assert.match(lauf.stdout, new RegExp(`${z.titel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\(\\d+\\)`));
  }
});
