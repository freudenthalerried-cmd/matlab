#!/usr/bin/env node
/**
 * Wirkt jede Weisung des Auftraggebers im Bestand — oder steht sie nur da?
 *
 *   npm run pruefe-weisungen
 *
 * **Der Anlass, 7. September 2026.** `npm run pruefe-auftrag` misst den
 * Ursprungsauftrag vom 9. August. Was der Auftraggeber **danach** angeordnet
 * hat — acht Weisungen, zwei davon haben frühere Arbeit vollständig
 * umgeworfen —, stand in einer Tabelle und in keinem Prüfer.
 *
 * > **Eine Weisung, die nur im Protokoll steht, ist ein Missverständnis mit
 * > Datum.**
 *
 * Drei Zustände: erfüllt, offen und geführt, vergessen. Der dritte ist der
 * Grund für diesen Prüfer.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { QUELLE, WEISUNGEN, weisungenAusParametern, weisungsbefund } from '../src/weisungsstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const lies = (datei) => {
  try {
    return readFileSync(join(REPO, datei), 'utf8');
  } catch {
    return null;
  }
};

const parameter = lies(QUELLE);
if (parameter === null) {
  console.error(`Abbruch: ${QUELLE} gibt es nicht — ohne die Weisungen gibt es nichts zu halten.`);
  process.exit(2);
}

const weisungen = weisungenAusParametern(parameter);
if (!weisungen.length) {
  console.error(`Abbruch: in ${QUELLE} steht keine einzige Weisung — der Abschnitt heißt anders,`);
  console.error('und ein Prüfer, der nichts findet, meldet sonst zu Recht nichts.');
  process.exit(2);
}

const b = weisungsbefund({ weisungen, lies });

console.log(`\nWeisungsstand — ${b.weisungen} Weisungen aus ${QUELLE}\n`);
for (const w of WEISUNGEN) {
  const zeichen = w.offen ? '○' : '✓';
  const wo = (w.spuren ?? [w.offen]).map((s) => s.datei.replace(/^shop\//, '')).join(', ');
  console.log(`  ${zeichen} ${w.datum} ${w.stichwort}`);
  console.log(`      ${w.offen ? 'offen, geführt in' : 'wirkt in'} ${wo}`);
}
console.log(`\n  ${b.erfuellt} erfüllt, ${b.offen} offen und geführt, 0 vergessen\n`);

if (b.sauber) {
  console.log('Jede Weisung wirkt an einer Stelle — oder steht als offener Punkt in der Liste.');
  console.log('Der Unterschied zwischen „offen" und „vergessen" ist genau diese Zeile.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
