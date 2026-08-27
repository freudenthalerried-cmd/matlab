#!/usr/bin/env node
/**
 * Widerrufe prüfen: Steht irgendwo noch eine Aussage, die zurückgenommen
 * wurde — ohne ihren Widerruf daneben?
 *
 *   node bin/widerrufpruefung.mjs [verzeichnis]
 *
 * Ohne Argument läuft der Prüfer über `docs/baustoff-shop/`. Er meldet
 * einen **Verdacht**: Jeder Treffer gehört angesehen, und ein Zitat mit
 * Widerruf in Sichtweite ist ausdrücklich erlaubt.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruefeBestand, WIDERRUFE, SICHTWEITE } from '../src/widerruf.js';

const verzeichnis = process.argv[2]
  ?? fileURLToPath(new URL('../../docs/baustoff-shop/', import.meta.url));

let namen;
try {
  namen = readdirSync(verzeichnis).filter((n) => n.endsWith('.md')).sort();
} catch (fehler) {
  console.error(`Verzeichnis nicht lesbar: ${verzeichnis}`);
  console.error(`  ${fehler.message}`);
  process.exit(1);
}

const dateien = namen.map((name) => ({ name, text: readFileSync(join(verzeichnis, name), 'utf8') }));
const e = pruefeBestand(dateien);

console.log(`\nWiderrufsregister: ${e.register} zurückgenommene Aussagen`);
for (const w of WIDERRUFE) {
  console.log(`  · ${w.id} — widerrufen ${w.widerrufenAm}, belegt in ${w.belegt}`);
}
console.log(`\n${e.dateien} Dateien, ${e.funde} Fundstellen, davon ${e.gedeckt} mit Widerruf in Sichtweite (±${SICHTWEITE} Zeilen).`);

if (e.sauber) {
  console.log('\nKeine Meldung — jede widerrufene Aussage trägt ihren Widerruf mit.');
  console.log('Ein Widerruf, der nur an einer Stelle steht, ist ein Notizzettel, keine Berichtigung.');
  process.exit(0);
}

console.log(`\n${e.meldungen.length} Meldung(en) — hier steht die Aussage ohne ihren Widerruf:\n`);
for (const m of e.meldungen) {
  console.log(`  ✗ ${m.datei}:${m.zeile}`);
  console.log(`      „${m.fundstelle}"`);
  console.log(`      widerrufen ${m.eintrag.widerrufenAm} (${m.eintrag.belegt})`);
  console.log(`      → ${m.eintrag.statt}`);
  console.log('');
}
console.log('Zwei richtige Auswege: den Satz nachziehen, oder den Widerruf danebenschreiben.');
console.log('Der falsche wäre, das Muster zu entschärfen.');
process.exit(1);
