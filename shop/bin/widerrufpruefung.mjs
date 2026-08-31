#!/usr/bin/env node
/**
 * Widerrufe prüfen: Steht irgendwo noch eine Aussage, die zurückgenommen
 * wurde — ohne ihren Widerruf daneben?
 *
 *   node bin/widerrufpruefung.mjs [verzeichnis]
 *
 * Mit Argument läuft der Prüfer über genau dieses Verzeichnis (`.md`).
 * Ohne Argument über **alle Bestände, in denen eine widerrufene Aussage
 * überleben kann** — siehe `BESTAENDE`. Er meldet einen **Verdacht**: Jeder
 * Treffer gehört angesehen, und ein Zitat mit Widerruf in Sichtweite ist
 * ausdrücklich erlaubt.
 *
 * ## Warum nicht nur die Aktenlage
 *
 * Bis zum 31.08. las dieser Prüfer ausschließlich `docs/baustoff-shop/`.
 * Gemessen an diesem Bestand war er grün — und zwar an dem Tag, an dem der
 * Shop selbst auf drei Seiten den Satz trug, der am 27.08. zurückgenommen
 * worden war („die Frachtpauschale steht auf jedem Beleg"). Der Wissensbeitrag
 * mit dem Satz trägt sogar den Stand **2026-08-28** — geschrieben nach dem
 * Widerruf, in Kenntnis des Gegenteils.
 *
 * **Ein Widerruf, der nur die Akte erreicht, hat den Kunden nicht erreicht.**
 * Die Akte liest niemand außer mir; der Shop wird beworben. Der Prüfer, der
 * nur die Akte liest, misst deshalb genau die Hälfte, in der ein falscher Satz
 * nichts kostet.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruefeBestand, WIDERRUFE, SICHTWEITE, BESTAENDE, bestandsdateien } from '../src/widerruf.js';

const WURZEL = fileURLToPath(new URL('../../', import.meta.url));

/** Der Verzeichnisleser, den `bestandsdateien` erwartet — hier auf der Platte. */
const liesOrdner = (ordner) => readdirSync(join(WURZEL, ordner), { withFileTypes: true })
  .map((e) => ({ name: e.name, verzeichnis: e.isDirectory() }));

const nurVerzeichnis = process.argv[2];
const bestaende = nurVerzeichnis
  ? [{ ordner: [nurVerzeichnis], endung: '.md', was: 'Verzeichnis' }]
  : BESTAENDE;

let pfade;
try {
  pfade = nurVerzeichnis
    ? readdirSync(nurVerzeichnis).filter((n) => n.endsWith('.md')).sort().map((n) => join(nurVerzeichnis, n))
    : bestandsdateien(liesOrdner).map((p) => join(WURZEL, p));
} catch (fehler) {
  console.error(`Bestand nicht lesbar: ${fehler.message}`);
  process.exit(1);
}

const dateien = pfade.map((pfad) => ({
  name: nurVerzeichnis ? pfad : pfad.slice(WURZEL.length),
  text: readFileSync(pfad, 'utf8'),
}));
const e = pruefeBestand(dateien);

console.log(`\nWiderrufsregister: ${e.register} zurückgenommene Aussagen`);
for (const w of WIDERRUFE) {
  console.log(`  · ${w.id} — widerrufen ${w.widerrufenAm}, belegt in ${w.belegt}`);
}
console.log(`\nBestände: ${bestaende.map((b) => b.was).join(', ')}`);
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
