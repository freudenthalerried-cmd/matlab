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

import { ZWILLINGE, zwillingsbefund } from '../src/zwillingszahlen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

/** Jede Quelldatei des Rechenkerns und der Werkzeuge. */
function quellen() {
  const gefunden = new Map();
  for (const ordner of ['src', 'bin']) {
    const voll = join(SHOP, ordner);
    for (const name of readdirSync(voll).sort()) {
      const pfad = join(voll, name);
      if (!statSync(pfad).isFile() || !/\.(js|mjs)$/.test(name)) continue;
      gefunden.set(`${ordner}/${name}`, readFileSync(pfad, 'utf8'));
    }
  }
  return gefunden;
}

const dateien = quellen();
if (dateien.size < 50) {
  console.error(`Abbruch: nur ${dateien.size} Quelldateien gelesen — die Suche sagt dann nichts.`);
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

console.log('');
console.log(`Zwillingsabgleich: ${befund.gesucht} Fundstellen, jede gelesen oder begründet`);
console.log('Eine Zahl mit einer Heimat wird gelesen, nicht abgeschrieben.');
process.exit(0);
