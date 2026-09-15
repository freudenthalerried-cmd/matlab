#!/usr/bin/env node
/**
 * Trägt ein Sinnbild einer Warengruppe ein Maß, das es im Sortiment nicht gibt?
 *
 *   npm run pruefe-sinnbilder
 *
 * **Der Anlass, 9. September 2026.** Die Kachel der Warengruppe Mauerwerk auf
 * der **Startseite** zeigte „Ziegel N+F 25 cm". Geführt wird in dieser Gruppe
 * genau ein Artikel: „Ökotherm HL N+F 10 50 23,8 cm". Bei Mauersteinen ist die
 * Wandstärke die entscheidende Eigenschaft — ein rundes Maß auf der Seite, die
 * jeder zuerst sieht, liest sich als Angebot.
 *
 * Die Muster sind absichtlich grob: „Mantelstein" trägt gar keine Zahl, und das
 * ist richtig so. Geprüft wird nur, was nachrechenbar ist — jedes **Maß** muss
 * im Namen eines Artikels seiner Gruppe vorkommen.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { GRUPPENMUSTER, sinnbildbefund } from '../src/bilder.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const lies = (...p) => JSON.parse(readFileSync(join(...p), 'utf8'));

let katalog;
try {
  katalog = ladeBaustoffkatalog(
    lies(SHOP, 'data', 'katalog-baustoff.json'),
    lies(SHOP, '..', 'preise', 'baustoff-preise.json'),
    lies(SHOP, 'data', 'lieferanten.json'),
  );
} catch (fehler) {
  console.error(`Abbruch: der Katalog ist nicht lesbar — ${fehler.message}`);
  console.error('Ohne ihn ist kein Maß mit irgendetwas vergleichbar.');
  process.exit(2);
}

const b = sinnbildbefund(GRUPPENMUSTER, katalog.artikel);

// **Gezählt wird das Angesehene, nicht das Gefundene** — dieselbe Regel wie bei
// den anderen Prüfern: „kein Maß daneben" und „kein Maß angesehen" dürfen nicht
// gleich aussehen.
console.log(`\nSinnbilder — ${b.gruppen} Warengruppen, ${b.masse} Maße gegen den Katalog\n`);

if (b.sauber) {
  console.log('Jedes Maß in einem Sinnbild kommt im Namen eines Artikels seiner Gruppe vor.');
  console.log('Ein Sinnbild darf grob sein. Eine Zahl darin ist trotzdem eine Zahl.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
