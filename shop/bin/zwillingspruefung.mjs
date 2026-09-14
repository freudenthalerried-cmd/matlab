#!/usr/bin/env node
/**
 * Steht eine Zahl, die es nur einmal geben darf, ein zweites Mal im Quelltext?
 *
 *   npm run pruefe-zwillinge
 *
 * **Der Anlass, 11. September 2026.** An drei aufeinanderfolgenden Tagen fiel
 * dieselbe Bauart auf — jedes Mal durch Zufall, jedes Mal an einer Zahl, an
 * der Geld hängt: die Bindefrist, die Kaufquote jedes Höchstgebots, die
 * Zielmarge des Auftraggebers und der Umsatzsteuersatz in vier Fassungen.
 * Dreimal stand die Gleichheit in einem **Satz** und nicht in einem Aufruf.
 *
 * > **Drei Funde durch Zufall sind kein Grund zu glauben, es seien die
 * > letzten.**
 *
 * Das Register dazu steht in `src/zwillingszahlen.js`. Es ist keine Jagd auf
 * doppelte Literale — `fixEuro: 0.25` ist die Kartengebühr und hat mit der
 * Zielmarge nichts zu tun. Geführt sind nur Zahlen mit einer **Heimat**, und
 * jedes weitere Vorkommen liest sie entweder oder steht mit Grund im Register.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ZWILLINGE, zwillingsbefund, zwillingsvorschlag, ENGE_SCHWELLE } from '../src/zwillingszahlen.js';
import { zuWenigQuellen } from '../src/prueferurteil.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Jede Quelldatei des Rechenkerns und der Werkzeuge — **und die Datendateien**.
 *
 * **`data/` ergänzt am 13. September 2026.** Die Suche endete am Dateityp:
 * gelesen wurden `src/` und `bin/`, also genau die Orte, an denen eine Zahl
 * einen Namen haben kann. Die zweite Fassung stand woanders.
 *
 * Gemessen: `data/zielgroessen.json` trägt `rohmarge: 0.25` und
 * `umsatzProSession: 0.02` — beide mit einem Satz daneben, der die Gleichheit
 * behauptet („Muss mit ZIELMARGE in src/baustoffkatalog.js uebereinstimmen",
 * „DIESELBE GROESSE wie die Kaufquote der Kampagne"). Genau die Bauart, für
 * die dieses Register gebaut wurde: *Die Gleichheit stand in einem Satz und
 * nicht in einem Aufruf.*
 *
 * > **Eine Zahl in einer Datendatei ist genauso eine zweite Fassung wie eine
 * > im Quelltext.** Sie kann dort sogar schlechter stehen: In JSON gibt es
 * > keinen Import, mit dem man sie lesen könnte.
 *
 * Am Vortag hat dieselbe Lücke Geld gekostet: `paletteOebbNetto: 22` in
 * `data/lieferanten.json` gegen die berichtigten 13,47 € in
 * `src/palettenkreis.js` — neun Tage lang, unbemerkt.
 */
function quellen() {
  const gefunden = new Map();
  for (const ordner of ['src', 'bin', 'data']) {
    const voll = join(SHOP, ordner);
    for (const name of readdirSync(voll).sort()) {
      const pfad = join(voll, name);
      if (!statSync(pfad).isFile() || !/\.(js|mjs|json)$/.test(name)) continue;
      gefunden.set(`${ordner}/${name}`, readFileSync(pfad, 'utf8'));
    }
  }
  /*
   * **Und die Oberflaeche, ergaenzt am 13. September 2026.** Am Vortag endete
   * die Suche am Dateityp und wurde um `data/` erweitert. Sie endete auch am
   * **Ort**: Gelesen wurden drei Ordner, und `shop-ui.js` liegt in keinem —
   * es liegt daneben, in der Wurzel, weil es als Ganzes ins Browserbuendel
   * geht.
   *
   * Gemessen, was dort stand: `feld.max = '999'` an zwei Stellen, waehrend
   * derselbe Knopf zwei Bildschirmzeilen weiter `HOECHSTMENGE` liest. Genau
   * die Zahl, zu der `src/gatestand.js` bei Gate 34 sagt, sie sei *„eine
   * benannte Zahl mit Begruendung und kein Literal: Vorher stand 999 an fuenf
   * Stellen ohne Grund"*.
   *
   * > **Eine Datei, die ein Register nicht liest, ist fuer das Register
   * > sauber.**
   */
  gefunden.set('shop-ui.js', readFileSync(join(SHOP, 'shop-ui.js'), 'utf8'));
  return gefunden;
}

const dateien = quellen();
if (dateien.size < 50) {
  console.error(zuWenigQuellen(dateien.size));
  process.exit(2);
}

const befund = zwillingsbefund(dateien);

console.log(`\nZwillingszahlen — ${ZWILLINGE.length} Zahlen mit einer Heimat, `
  + `${befund.gesucht} Fundstellen in ${dateien.size} Quelldateien\n`);

for (const e of ZWILLINGE) {
  console.log(`  ${e.literal.padEnd(6)} ${e.name} in ${e.heimat}`);
  console.log(`         ${e.was}`);
  for (const a of e.ausnahmen) console.log(`         · ${a.datei} — begründete Ausnahme`);
}

if (befund.meldungen.length) {
  console.log('');
  for (const m of befund.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Zwei Wege zu derselben Zahl bedeuten, dass einer davon irgendwann alt ist —');
  console.log('und es ist immer der, den man beim Ändern vergisst.');
  process.exit(1);
}

/*
 * Und die Gegenrichtung des Registers selbst: Welche benannte Zahl *gehoerte*
 * hinein, ohne dass es jemand gemerkt hat? Ohne diese Messung fuehrt das
 * Register genau das, was jemandem zufaellig aufgefallen ist.
 */
const vorschlag = zwillingsvorschlag(dateien);

console.log('');
console.log(`Enges Band — ${vorschlag.vorschlaege.length} benannte Zahlen stehen in hoechstens `
  + `${ENGE_SCHWELLE} weiteren Dateien:`);
for (const v of vorschlag.vorschlaege) {
  console.log(`  ${String(v.wert).padEnd(8)} ${v.name} (${v.heimat}) — auch in ${v.andere.join(', ')}`);
}

if (vorschlag.meldungen.length) {
  console.log('');
  for (const m of vorschlag.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Eine Zahl mit ganz wenigen Fundstellen ist kein Zufall, sondern eine Entscheidung —');
  console.log('und eine Entscheidung, die niemand aufgeschrieben hat, ist keine.');
  process.exit(1);
}

console.log('');
console.log(`Zwillingsabgleich: ${befund.gesucht} Fundstellen, jede gelesen oder begründet`);
console.log(`Enges Band: ${vorschlag.vorschlaege.length} Zahlen, jede geführt oder abgehakt`);
console.log('Eine Zahl mit einer Heimat wird gelesen, nicht abgeschrieben.');
process.exit(0);
