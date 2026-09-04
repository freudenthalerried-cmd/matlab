#!/usr/bin/env node
/**
 * Liegt irgendwo im Verzeichnis eine absichtlich falsche Datei?
 *
 *   npm run pruefe-mutationen
 *
 * **Der Anlass, 4. September 2026.** Die Abschlussprüfung eines Laufs meldete
 * „uncommitted changes" — `src/betreiberform.js` mit ausgehängter
 * UID-Prüfziffer. Es war keine Arbeit, sondern eine Gegenprobe: Der letzte
 * Schritt von `npm run alles` mutiert 37-mal eine Quelldatei und schreibt sie
 * zurück, und ich hatte den Lauf für beendet gehalten.
 *
 * > **Wer währenddessen committet, committet die Mutation.** Genau dafür ist
 * > dieser Loop gebaut: Er committet und pusht ohne Rückfrage.
 *
 * Der Prüfer ist deshalb nicht der eigentliche Schutz — das ist der Zettel in
 * `src/mutationsschutz.js`, der das Original auf die Platte legt, bevor die
 * Mutation geschrieben wird. Der Prüfer ist die **Auskunft** darüber, und er
 * gehört vor jeden Commit.
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { mutationsbefund } from '../src/mutationsschutz.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const { marken, angesehen, meldungen } = mutationsbefund(REPO);

// **Gezählt wird das Angesehene, nicht das Gefundene.** Der gesunde Zustand
// ist null Zettel; „nichts gefunden" und „nicht hingesehen" sähen in einer
// Fundzahl gleich aus, und genau das misst `src/pruefregister.js` sonst.
console.log(`Mutationsschutz — ${angesehen} Einträge angesehen, ${marken.length} offene Zettel\n`);

if (meldungen.length === 0) {
  console.log('Keine Meldung. Keine Datei ist gerade absichtlich falsch.');
  console.log('Ein Commit während einer Gegenprobe nimmt die Mutation mit.');
  process.exit(0);
}

for (const m of meldungen) {
  console.log(`  ✗ ${m.text}`);
  console.log(`      ${m.pfad}  [${m.regel}]`);
}

console.log(`\n${meldungen.length} Meldung(en).`);
console.log('`node bin/gegenprobenlauf.mjs` räumt beim Start auf — oder der Zettel');
console.log('trägt das Original zum Zurückschreiben von Hand.');
process.exit(1);
