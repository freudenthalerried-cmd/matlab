#!/usr/bin/env node
/**
 * Sind die zurückgestellten Browsergegenproben noch frisch?
 *
 *   npm run pruefe-browserproben
 *
 * **Der Anlass, 10. September 2026.** Vier Gegenproben laufen aus gutem Grund
 * nicht im Regellauf mit: Zwei von ihnen meldeten am 4. September unter Last
 * etwas anderes als allein. Der Lauf druckte seither ihre Namen als Zeile
 * *„zurückgestellt — mit `--mit-browser` laufen sie mit"* — und niemand ließ
 * sie mitlaufen. Am 10. September liefen sie zum ersten Mal seit ihrer
 * Aufnahme. Drei schlugen an; die vierte stand seit dem 5. September im
 * Register und zeigte auf das falsche Szenario.
 *
 * > **Eine Zurückstellung, die nie verfällt, ist eine Probe, die nie läuft.**
 *
 * Dieser Prüfer nimmt der Zurückstellung ihre Unbefristetheit. Er startet
 * keinen Browser — er liest ein Datum. Das genügt: Was er misst, ist nicht der
 * Zustand des Shops, sondern das Alter einer Aussage über ihn.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { GEGENPROBEN, browserprobenbefund } from '../src/gegenprobenregister.js';
import { BROWSERPRUEFER } from '../src/pruefregister.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const pfad = join(SHOP, 'data', 'browserproben.json');

if (!existsSync(pfad)) {
  console.error(`Abbruch: ${relative(SHOP, pfad)} fehlt.`);
  console.error('Ohne Vermerk ließe sich nicht sagen, wann die zurückgestellten Proben');
  console.error('zuletzt angeschlagen haben — und nicht messbar ist nicht grün.');
  process.exit(2);
}

const vermerk = JSON.parse(readFileSync(pfad, 'utf8'));
const namen = new Set(BROWSERPRUEFER.map((p) => p.name));
const proben = GEGENPROBEN.filter((p) => namen.has(p.pruefer));

const b = browserprobenbefund(proben, vermerk, geschaeftstag());

console.log(`\nBrowsergegenproben — ${b.proben} zurückgestellt, ${b.frisch} innerhalb der Frist`);
console.log(`von ${b.grenze} Tagen; der älteste Anschlag ist ${b.aeltester ?? '—'} Tage her\n`);

if (b.sauber) {
  for (const p of proben) {
    const e = vermerk.proben[p.id];
    console.log(`  ✓ ${p.id.padEnd(28)} ${e.am}, ${e.sekunden ?? '?'} s`);
  }
  console.log('\nZurückgestellt heißt nicht ungeprüft — solange ein Datum danebensteht.');
  console.log('Eine Zurückstellung, die nie verfällt, ist eine Probe, die nie läuft.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
console.log('Nachziehen mit: npm run gegenproben -- --mit-browser');
process.exit(1);
