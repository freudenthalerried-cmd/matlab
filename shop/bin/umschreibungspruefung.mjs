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
import { MEHRLIEFERUNG } from '../src/lieferungen.js';
import { GRENZAUSSAGEN } from '../src/untergrenze.js';
import { ZUSAGE } from '../src/abholung.js';
import { UEBERNAHMEBEHAUPTUNGEN } from '../src/merkblattverweis.js';
import {
  UMSCHREIBUNGEN, umschreibungsbefund, registerbefund, quellenbefund,
} from '../src/umschreibung.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
  // **Nachgetragen am 10. September, nachmittags.** Die beiden Regeln, die an
  // diesem Vormittag entstanden sind, fehlten hier — und fielen beim ersten
  // Lauf mit 0 von 5 und 1 von 5 durch. Ein Prüfer über die Reichweite, der
  // die jüngsten Regeln nicht kennt, misst die Vergangenheit.
  if (MEHRLIEFERUNG.test(satz)) return true;
  if (GRENZAUSSAGEN.some((a) => new RegExp(a.muster.source, a.muster.flags).test(satz))) return true;
  if (ZUSAGE.test(satz)) return true;
  if (UEBERNAHMEBEHAUPTUNGEN.some((e) => new RegExp(e.muster.source, e.muster.flags).test(satz))) return true;
  return false;
}

/**
 * Welche Musterausfuhren erreichen die Kundentext-Werkzeuge überhaupt?
 *
 * Gefunden statt aufgezählt: Die vier Werkzeuge sagen selbst, welche Module
 * sie laden, und die Module sagen selbst, was sie ausführen. Eine Aufzählung,
 * die von Hand gepflegt wird, hat dieselbe Lücke wie das Register, das sie
 * bewachen soll.
 */
const HIER = dirname(fileURLToPath(import.meta.url));
const WERKZEUGE = [
  'inhaltspruefung.mjs', 'belegpruefung.mjs', 'website.mjs', 'umschreibungspruefung.mjs',
];

async function musterausfuhren() {
  const module = new Set();
  for (const w of WERKZEUGE) {
    const quelle = readFileSync(join(HIER, w), 'utf8');
    for (const m of quelle.matchAll(/from '\.\.\/src\/([a-z]+)\.js'/g)) module.add(m[1]);
  }
  const gefunden = [];
  for (const name of [...module].sort()) {
    const mod = await import(join(HIER, '..', 'src', `${name}.js`));
    for (const [k, v] of Object.entries(mod)) {
      const istRegister = Array.isArray(v)
        && v.some((e) => e && typeof e === 'object' && (e.muster instanceof RegExp || e.wort instanceof RegExp));
      // **Nachgezogen am 10. September.** Die erste Fassung suchte nur nach
      // RegExp und Musterregistern — und übersah damit `VORRATSWORTE`, eine
      // Wortliste, die genauso eine Behauptung verbietet. Ein Suchlauf, der
      // eine Bauform nicht kennt, meldet vollständig über das, was er kennt.
      // Aufgenommen sind Zeichenkettenlisten, deren Name sie als Wortliste
      // ausweist; alle anderen wären Einheiten, Modulnamen und Gliederungen.
      const istWortliste = Array.isArray(v) && v.length > 0
        && v.every((e) => typeof e === 'string') && /WOERTER$|WORTE$/.test(k);
      if (v instanceof RegExp || istRegister || istWortliste) gefunden.push(`${name}.${k}`);
    }
  }
  return gefunden;
}

const quellen = quellenbefund(await musterausfuhren());

const form = registerbefund(UMSCHREIBUNGEN);
if (!form.sauber) {
  console.error('Das Umschreibungsregister ist unvollständig — ohne Grund kein Eintrag:');
  for (const m of form.maengel) console.error(`  ${m}`);
  console.error('\nEine Lücke ohne Begründung ist ein Versehen, das wie eine Entscheidung aussieht.');
  process.exit(2);
}

const b = umschreibungsbefund(faengt, UMSCHREIBUNGEN);

console.log(`Reichweite der Textprüfer: ${b.regeln} Regeln, ${b.gemessen} Umschreibungen`);
console.log(`${b.gemessen - b.offen} gefangen, ${b.offen} als offene Lücke geführt — jede mit Grund.`);
console.log(`${quellen.gefunden} Musterausfuhren erreichen die Kundentext-Werkzeuge, `
  + `${quellen.behauptungsregeln} davon sind Behauptungsregeln, `
  + `${quellen.offen} davon noch ohne Umschreibungen.\n`);

for (const regel of UMSCHREIBUNGEN) {
  const zeilen = regel.saetze.map((s) => `${s.gefangen ? '✓' : '·'} ${s.text}`);
  console.log(`  ${regel.id} (${regel.register}) — ${regel.aussage}`);
  for (const z of zeilen) console.log(`      ${z}`);
}

for (const m of [...b.meldungen, ...quellen.meldungen]) {
  console.log(`\n  ✗ ${m.wo} [${m.regel}]`);
  console.log(`      ${m.text}`);
}

console.log('');
if (b.sauber && quellen.sauber) {
  console.log('Jede Regel reicht so weit, wie das Register sagt.');
  console.log('Eine Lücke, die aufgeschrieben ist, ist eine Entscheidung —');
  console.log('eine Lücke, die niemand kennt, ist ein Versehen.');
  process.exit(0);
}
console.log('Mit Abweichung endet dieser Lauf rot. Ein Register, das die Reichweite');
console.log('falsch angibt, ist schlechter als keines: Es beruhigt.');
process.exit(1);
