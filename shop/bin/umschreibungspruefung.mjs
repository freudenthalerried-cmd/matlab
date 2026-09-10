#!/usr/bin/env node
/**
 * Wie weit die Textprüfer reichen — gemessen an Umschreibungen.
 *
 *   npm run pruefe-umschreibung
 *
 * **Der Anlass steht in `docs/baustoff-shop/ein-pruefer-der-den-beispielsatz-kennt.md`.**
 * `BEHAUPTUNG` in `src/lieferungen.js` kannte genau die Formulierung, gegen
 * die sie geschrieben wurde, und war vier Tage lang grün, während dieselbe
 * Behauptung an sieben Stellen in anderen Worten stand.
 *
 * > **Ein Prüfer, der aus einem Beispielsatz gebaut wird, erkennt den
 * > Beispielsatz.**
 *
 * Dieses Werkzeug stellt jedem Textregister Sätze vor, die **dieselbe**
 * Behauptung in anderen Worten aufstellen, und hält das Ergebnis gegen das,
 * was in `src/umschreibung.js` als gemessen eingetragen ist — in beide
 * Richtungen. Wird eine Regel enger, ist das ein Befund. Wird sie weiter, ist
 * es auch einer: Dann behauptet das Register eine Lücke, die es nicht mehr
 * gibt.
 *
 * **Warum die Prüfer hier zusammengestellt werden und nicht im Register.**
 * Ein Register, das seine eigenen Prüfer wählt, prüft seine Auswahl. Was „der
 * Bestand fängt diesen Satz" heißt, entscheidet diese Datei — und sie nimmt
 * dafür genau die Register, die auf einer Kundenfläche laufen.
 */

import { BETRIEBSAUSSAGEN, GRENZWOERTER } from '../src/inhaltspruefung.js';
import { findeInterna } from '../src/interna.js';
import { PREISAUSSAGEN, VORRATSWORTE } from '../src/aussagen.js';
import { UMSCHREIBUNGEN, umschreibungsbefund, registerbefund } from '../src/umschreibung.js';

/**
 * Würde dieser Satz auf einer Kundenfläche gemeldet?
 *
 * Alle fünf Register, die dort laufen — nicht das eine, um das es gerade
 * geht. Ein Satz, den irgendeines fängt, kommt nicht durch, und genau das
 * ist die Frage.
 */
function faengt(satz) {
  if (BETRIEBSAUSSAGEN.some((e) => e.wort.test(satz))) return true;
  if (GRENZWOERTER.some((e) => e.wort.test(satz))) return true;
  if (findeInterna(satz).length > 0) return true;
  if (PREISAUSSAGEN.some((e) => new RegExp(e.muster.source, e.muster.flags).test(satz))) return true;
  if (VORRATSWORTE.some((w) => satz.toLowerCase().includes(w.toLowerCase()))) return true;
  return false;
}

const form = registerbefund(UMSCHREIBUNGEN);
if (!form.sauber) {
  console.error('Das Umschreibungsregister ist unvollständig — ohne Grund kein Eintrag:');
  for (const m of form.maengel) console.error(`  ${m}`);
  console.error('\nEine Lücke ohne Begründung ist ein Versehen, das wie eine Entscheidung aussieht.');
  process.exit(2);
}

const b = umschreibungsbefund(faengt, UMSCHREIBUNGEN);

console.log(`Reichweite der Textprüfer: ${b.regeln} Regeln, ${b.gemessen} Umschreibungen`);
console.log(`${b.gemessen - b.offen} gefangen, ${b.offen} als offene Lücke geführt — jede mit Grund.\n`);

for (const regel of UMSCHREIBUNGEN) {
  const zeilen = regel.saetze.map((s) => `${s.gefangen ? '✓' : '·'} ${s.text}`);
  console.log(`  ${regel.id} (${regel.register}) — ${regel.aussage}`);
  for (const z of zeilen) console.log(`      ${z}`);
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) {
    console.log(`  ✗ ${m.wo} [${m.regel}]`);
    console.log(`      ${m.text}`);
  }
}

console.log('');
if (b.sauber) {
  console.log('Jede Regel reicht so weit, wie das Register sagt.');
  console.log('Eine Lücke, die aufgeschrieben ist, ist eine Entscheidung —');
  console.log('eine Lücke, die niemand kennt, ist ein Versehen.');
  process.exit(0);
}
console.log('Mit Abweichung endet dieser Lauf rot. Ein Register, das die Reichweite');
console.log('falsch angibt, ist schlechter als keines: Es beruhigt.');
process.exit(1);
