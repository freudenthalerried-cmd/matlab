#!/usr/bin/env node
/**
 * Wie weit reicht der Betrieb?
 *
 *   npm run betriebskette
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg vom Klick bis zum Angebot
 * ist heute gebaut und in einem Befehl belegt. Danach hört er auf — und
 * nirgends stand, wo genau.
 *
 * > **Der Plan sagt, wie der Shop online geht. Nichts sagte, wie ein
 * > Geschäftsfall zu Ende geht.**
 *
 * Dieses Werkzeug zeichnet die Karte und markiert den weißen Fleck. Es
 * entscheidet nichts und baut nichts; es sagt, ab welchem Schritt der Betrieb
 * von Hand weitergeht und warum.
 */

import { SCHRITTE, kettenbefund } from '../src/betriebskette.js';

const b = kettenbefund();

console.log(`Betriebskette — ${b.schritte} Schritte, ${b.mitWerkzeug} mit Werkzeug\n`);

SCHRITTE.forEach((s, i) => {
  const zeichen = s.werkzeug ? (i < b.erreicht ? '✓' : '·') : '✗';
  console.log(`  ${zeichen} ${String(i + 1).padStart(2)}. ${s.was}`);
  console.log(`         ${s.werkzeug ?? '— kein Werkzeug'}`);
  console.log(`         ${s.gate}`);
  if (s.warumOhneWerkzeug) console.log(`         ${s.warumOhneWerkzeug}`);
  console.log('');
});

/**
 * **Der Ertrag steht in dieser Zeile.** Fünf Schritte haben ein Werkzeug, und
 * die Kette reicht trotzdem nur bis zum vierten: Die Aufbewahrung ist gebaut
 * und liegt jenseits der Lücke. Eine Zählung ohne diese Unterscheidung hätte
 * „fünf von neun" gemeldet und damit mehr versprochen, als zusammenhängt.
 */
if (b.ersteLuecke) {
  console.log(`Zusammenhängend gebaut bis Schritt ${b.erreicht}: `
    + `${SCHRITTE[b.erreicht - 1].was}.`);
  console.log(`Dort hört die Kette auf — der nächste Schritt ist „${b.ersteLuecke.was}“,`);
  console.log('und er geht von Hand weiter. Der Grund steht oben bei ihm.');
} else {
  console.log('Die Kette reicht von der Bestellung bis zur Aufbewahrung.');
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log(`\n${b.meldungen.length} Meldung(en). Ein Schritt ohne Werkzeug und ohne Grund`);
  console.log('ist der Fund, für den es diese Liste gibt.');
  process.exit(1);
}

console.log('\nJeder Schritt ohne Werkzeug sagt, warum es keines gibt.');
