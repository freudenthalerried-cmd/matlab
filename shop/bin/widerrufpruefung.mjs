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
import {
  pruefeBestand, WIDERRUFE, SICHTWEITE, BESTAENDE, bestandsdateien, findeWiderrufe,
} from '../src/widerruf.js';
import { nurText } from '../src/format.js';
import { frischebefund } from '../src/erzeugnisstand.js';

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
/* ------------------------------------------------------------------ *
 * Und die gebaute Seite — 5. September 2026, abends
 *
 * `BESTAENDE` in `src/widerruf.js` schließt `ausgabe/` ausdrücklich aus, und
 * die Begründung steht dort: Was ausgeliefert wird, entsteht aus `inhalte/`
 * und `bin/website.mjs` — beide im Bestand. Der Schluss ist richtig.
 *
 * **Er war nur nie geprüft.** Eine Begründung der Form „das kann nicht
 * vorkommen" ist eine Behauptung über einen Erzeugungsweg, und Erzeugungswege
 * ändern sich: Seit dem 4. September trägt jede Seite Text, den kein
 * `inhalte/`-Dokument kennt (der Bestellhinweis, der Mindestwertabsatz, die
 * Frachterklärung), und seit heute wird ein Absatz beim Zusammenbau
 * angehängt.
 *
 * > **Ein Ausschluss mit gutem Grund ist trotzdem ein Ausschluss — und der
 * > Grund gehört gemessen, nicht geglaubt.**
 *
 * Der Durchgang kostet nichts: 83 Dateien, ein Durchlauf, und er sagt beim
 * nächsten Mal, ob der Schluss noch trägt. Gelesen wird der **Text**, nicht
 * das Markup.
 * ------------------------------------------------------------------ */
let ausgabeFunde = 0;
let ausgabeDateien = 0;
if (!nurVerzeichnis) {
  const ordner = join(WURZEL, 'shop', 'ausgabe', 'site');
  const sammle = (d) => {
    for (const e2 of readdirSync(d, { withFileTypes: true })) {
      const voll = join(d, e2.name);
      if (e2.isDirectory()) { sammle(voll); continue; }
      if (!/\.(html|txt|js)$/.test(e2.name)) continue;
      ausgabeDateien += 1;
      for (const fund of findeWiderrufe(nurText(readFileSync(voll, 'utf8')), { sichtweite: 2, kopfzeilen: 0 })) {
        ausgabeFunde += 1;
        console.log(`  ✗ ${voll.slice(WURZEL.length)}`);
        console.log(`      „${fund.fundstelle}"`);
        console.log(`      widerrufen ${fund.eintrag.widerrufenAm} (${fund.eintrag.belegt})`);
        console.log(`      → ${fund.eintrag.statt}`);
      }
    }
  };
  // **Nicht abbrechen, aber sagen.** Ein Durchgang über ein veraltetes
  // Erzeugnis, der „0 Fundstellen" meldet, ist genau die Sorte Grün, gegen
  // die dieser Bestand seit dem 30. August anschreibt. Der Hauptbestand sind
  // aber die 514 Verzeichnisdateien; ihretwegen abzubrechen wäre
  // unverhältnismäßig.
  const stand = frischebefund(join(WURZEL, 'shop'), 'ausgabe/site');
  if (!stand.frisch) {
    console.log('\nHinweis: ausgabe/site ist älter als die Quelle — der Durchgang darüber');
    console.log('prüft die Seite von gestern. Die Akte prüft er trotzdem vollständig.');
  }
  try {
    sammle(ordner);
  } catch {
    console.log('\nDie gebaute Seite liegt nicht vor — der Durchgang über die Ausgabe entfällt.');
    console.log('Das ist kein Freispruch: Er sagt nichts, statt etwas Falsches zu sagen.');
  }
}

console.log(`\nBestände: ${bestaende.map((b) => b.was).join(', ')}`);
if (ausgabeDateien) {
  console.log(`Dazu ${ausgabeDateien} gebaute Ausgabedateien — nicht im Bestand, weil sie aus`);
  console.log('Quellen entstehen, die darin sind. Geprüft wird trotzdem: Der Schluss gilt für den');
  console.log(`Erzeugungsweg von heute. ${ausgabeFunde} Fundstelle(n).`);
}
console.log(`\n${e.dateien} Dateien, ${e.funde} Fundstellen, davon ${e.gedeckt} mit Widerruf in Sichtweite.`);
console.log(`Sichtweite: ±${SICHTWEITE} Zeilen im Fließtext — eine Tabellenzeile dagegen sieht nur`);
console.log('sich selbst, den Kopf ihrer Tabelle und den Text davor. Der Nachbareintrag deckt nichts.');

if (e.sauber && ausgabeFunde === 0) {
  console.log('\nKeine Meldung — jede widerrufene Aussage trägt ihren Widerruf mit.');
  console.log('Ein Widerruf, der nur an einer Stelle steht, ist ein Notizzettel, keine Berichtigung.');
  process.exit(0);
}

console.log(`\n${e.meldungen.length + ausgabeFunde} Meldung(en) — hier steht die Aussage ohne ihren Widerruf:\n`);
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
