#!/usr/bin/env node
/**
 * Was das Werbebudget an Erkenntnis kauft.
 *
 *   node bin/werbeprobe.mjs [--budget 10] [--sicherheit 0.95]
 *
 * Liest Tagesbudget und Deckungsbeiträge aus den gebauten Kampagnendateien —
 * nicht aus einer zweiten Annahme daneben. Fehlen sie, bricht das Werkzeug
 * ab, statt mit erfundenen Zahlen zu rechnen.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versuchsplan, nochPlausibleQuote, TAGE_JE_MONAT, SICHERHEIT } from '../src/werbewirkung.js';
import { MARKT_CPC } from './kampagne.mjs';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const kampagne = join(SHOP, 'ausgabe', 'kampagne');

const argZahl = (name, vor) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return vor;
  const wert = Number(process.argv[i + 1]);
  if (!Number.isFinite(wert)) {
    console.error(`--${name} braucht eine Zahl, bekommen: ${process.argv[i + 1]}`);
    process.exit(2);
  }
  return wert;
};

for (const datei of ['kampagnen.csv', 'anzeigengruppen.csv']) {
  if (existsSync(join(kampagne, datei))) continue;
  console.error(`Abbruch: ausgabe/kampagne/${datei} fehlt — zuerst \`npm run kampagne\`.`);
  console.error('Ein Versuchsplan über erfundene Deckungsbeiträge plant nichts.');
  process.exit(2);
}

const zeilen = (n) => readFileSync(join(kampagne, n), 'utf8').trim().split('\n').slice(1);
const kampagnen = zeilen('kampagnen.csv').map((z) => ({ name: z.split(',')[0], budget: Number(z.split(',')[3]) }));
const gruppen = zeilen('anzeigengruppen.csv').map((z) => {
  const f = z.split(',');
  return { gruppe: f[1], db: Number(f.at(-1)) };
});

const tagesbudget = argZahl('budget', kampagnen.reduce((s, k) => s + k.budget, 0));
const sicherheit = argZahl('sicherheit', SICHERHEIT);
if (!(tagesbudget > 0)) {
  console.error('Abbruch: Das Tagesbudget der Kampagnendateien ist null.');
  process.exit(2);
}

const QUOTEN = [0.005, 0.01, 0.02];
const KLICKPREISE = [MARKT_CPC.unten, 1.0, 1.5, MARKT_CPC.oben];
const eur = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

console.log(`\nWerbeprobe — Tagesbudget ${eur(tagesbudget)} € auf ${gruppen.length} Anzeigengruppe(n)`);
console.log(`Markt-Klickpreis ${eur(MARKT_CPC.unten)}–${eur(MARKT_CPC.oben)} €, Sicherheit ${(sicherheit * 100).toFixed(0)} %,`
  + ` ${TAGE_JE_MONAT} Tage je Monat.\n`);

console.log('Wenn die Kaufquote wirklich q ist, wie lange dauert es, bis ein Ausbleiben');
console.log('jeder Bestellung sie ausschließt?\n');
console.log('   q     Klick    Klicks/Mon   P(Monat ohne Verkauf)   Schwelle        kostet     dauert');
for (const q of QUOTEN) {
  for (const cpc of KLICKPREISE) {
    const p = versuchsplan({ tagesbudget, klickpreis: cpc, quote: q, deckungsbeitragJeVerkauf: 1, sicherheit });
    console.log(
      `  ${(q * 100).toFixed(1).padStart(4)} %  ${eur(cpc).padStart(5)} €  ${p.klicksJeMonat.toFixed(0).padStart(8)}`
      + `   ${(p.pKeinVerkaufImMonat * 100).toFixed(1).padStart(18)} %`
      + `   ${String(p.schwelleKlicks).padStart(5)} Klicks  ${eur(p.schwelleKosten).padStart(8)} €`
      + `  ${p.schwelleTage.toFixed(0).padStart(4)} Tage`,
    );
  }
}

console.log('\nTrägt der Deckungsbeitrag die Werbekosten je Verkauf?\n');
console.log('  Gruppe          DB        bei 0,5 %      bei 1,0 %      bei 2,0 %');
for (const g of gruppen) {
  const zellen = QUOTEN.map((q) => {
    const p = versuchsplan({ tagesbudget, klickpreis: 1.5, quote: q, deckungsbeitragJeVerkauf: g.db });
    return `${p.traegt ? '+' : '−'}${eur(Math.abs(p.ueberschussJeVerkauf))} €`.padStart(13);
  });
  console.log(`  ${g.gruppe.padEnd(12)} ${eur(g.db).padStart(8)} € ${zellen.join(' ')}`);
}
console.log('  (Klickpreis 1,50 €; Werbekosten je Verkauf = Klickpreis ÷ Quote)');

console.log('\nWas ein Fehlversuch zeigt — die größte Quote, die danach noch plausibel ist:\n');
for (const n of [50, 100, 200, 300, 600]) {
  console.log(`  ${String(n).padStart(4)} Klicks ohne Bestellung  →  Quote über `
    + `${(nochPlausibleQuote(n, sicherheit) * 100).toFixed(2)} % ausgeschlossen`);
}

console.log('\nWas diese Rechnung nicht kann:');
console.log('  · Sie unterstellt gleich gute Klicks ab der ersten Minute — die optimistische Richtung.');
console.log('  · Sie sagt nicht, ob der Markt so viele Suchanfragen hergibt. Wird das Budget nicht');
console.log('    ausgeschöpft, dauert jede Zeile länger als angeschrieben.');
console.log('  · Sie zählt Verkäufe. Der Shop erzeugt heute Anfragen, keine Verkäufe — und gezählt');
console.log('    werden können sie nur an einer Stelle: im Posteingang des Betreibers.');
console.log('\nAlle Kampagnen stehen auf PAUSIERT. Das Schalten löst Ausgaben aus.');
