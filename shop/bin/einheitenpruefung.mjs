#!/usr/bin/env node
/**
 * Die Einheitenliste gegen den Katalog.
 *
 *   npm run pruefe-einheiten
 *
 * **Der Anlass, 12. September 2026.** Diese Prüfung stand bis heute in
 * `bin/gebindepruefung.mjs`, und die bricht seit dem Verlust von
 * `preise/poschacher-positionen.csv` ganz oben ab. Gemessen wurde damit seit
 * vier Tagen nichts mehr — obwohl die Einheitenprüfung von der verlorenen
 * Datei gar nichts wissen will: Sie liest `data/katalog-baustoff.json`.
 *
 * > **Eine fehlende Grundlage legt die Prüfung still, die auf ihr steht —
 * > nicht die daneben.** Dieselbe Familie wie der Fehlalarm vom selben Tag:
 * > Ein Prüfer, der aus einem Grund stumm ist, macht alles unmessbar, was an
 * > ihm hängt — hier auch die Gegenprobe, die genau diese Regel beweist.
 *
 * Zwei Grundlagen, zwei Werkzeuge.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { einheitenbefund, STUECKEINHEITEN } from '../src/gebinde.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const artikel = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')).artikel;

console.log(`\nEinheitenprüfung: ${artikel.length} Artikel gegen die Einheitenliste\n`);
/*
 * **Die Einheitenliste gegen den Katalog — 5. September 2026.**
 *
 * `STUECKEINHEITEN` in `gebinde.js` führte `PAK`, `KAR` und `ROL`, die im
 * Katalog nicht vorkommen, und kannte `KRT`, `DOS` und `RLL` nicht, die
 * vorkommen. Folgenlos war das nur, weil `preisJeKilo` außerdem ein Kilogramm
 * im Namen braucht und keiner der sechs Artikel eines trägt.
 *
 * Dreißig Zeilen unter dieser Liste steht seit dem 30. August die Lehre aus
 * genau diesem Fehler, gezogen an `GEBINDELESER`: *„Wer eine Einheit ergänzt,
 * ergänzt sie jetzt hier, und beide Seiten wissen davon."* Die Menge daneben
 * blieb, wie sie war — **eine Lehre, die neben der Stelle gezogen wird, an der
 * sie noch einmal gebraucht wird.**
 */
const eb = einheitenbefund(artikel);
console.log(`  Einheiten im Katalog            ${eb.einheiten}, `
  + `${STUECKEINHEITEN.size} davon Stückeinheiten, ${eb.mitWort} mit lesbarem Wort`);
if (!eb.sauber) {
  console.log('\n  ✗ Die Einheitenliste passt nicht zum Katalog:');
  for (const m of eb.meldungen) console.log(`      ${m.text}  (${m.regel})`);
  console.log('\nEine Einheit, die keiner führt, prüft nichts; eine, die keine Liste kennt,');
  console.log('fällt still aus jeder Umrechnung. Beides sieht im Lauf gleich aus: grün.');
  process.exit(1);
}

console.log('\nJede Einheit des Katalogs steht in der Liste, und jede Liste kennt nur');
console.log('Einheiten, die es gibt. Eine Einheit, die keiner führt, prüft nichts;');
console.log('eine, die keine Liste kennt, fällt still aus jeder Umrechnung.');
process.exit(0);
