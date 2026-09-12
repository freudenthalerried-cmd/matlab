#!/usr/bin/env node
/**
 * Die Akte eines Vorgangs — alles, was zu einem Geschäftsfall abgelegt ist.
 *
 *   npm run akte -- --vorgang 2026-0110
 *   npm run akte                      (alle Vorgänge des Bestands)
 *
 * **Der Anlass, 12. September 2026.** Seit gestern gehen alle fünf Papiere
 * eines Geschäftsfalls in die Akte: Angebot, Auftragsbestätigung, Rechnung,
 * Absage und seit heute früh die Lieferantenbestellung. Damit gibt es zum
 * ersten Mal etwas zu lesen — und keinen Weg, es zu lesen.
 *
 * > **§ 131 Abs 1 Z 5 BAO verlangt, dass zu jedem Geschäftsfall ein Beleg
 * > gehört und rückführbar bleibt.** Rückführbar heißt: Jemand muss ihn
 * > finden. Ein Journal aus JSONL-Zeilen und ein Ordner voller Textdateien
 * > sind für den Rechner rückführbar und für einen Menschen nicht.
 *
 * `vorgangsakte` gibt es seit dem Bau der Ablage, gerufen hat sie außerhalb
 * der Tests niemand — mit dem Grund, sie setze eine abgeschlossene Akte
 * voraus. Seit heute früh gibt es die.
 *
 * ## Was hier bewusst **nicht** steht
 *
 * Der **Inhalt** der Durchschriften. Er trägt Namen, Anschrift und Beträge
 * des Kunden; wer ihn lesen will, öffnet die genannte Datei. Ein Werkzeug,
 * das ihn auf den Bildschirm schreibt, macht aus einer Übersicht eine zweite
 * Kopie — und die liegt dann im Sitzungsprotokoll, im Terminalpuffer und im
 * Zweifel in einer Bildschirmaufnahme.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { aufbewahrungBis, vorgangsakte } from '../src/ablage.js';
import { ausJournal } from '../src/speicher.js';
import { ABLAGEORT, belegname, belegordner, istJournal } from '../src/ablageort.js';
import { EUR } from '../src/format.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const WURZEL = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);

const gesucht = (() => {
  const i = process.argv.indexOf('--vorgang');
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
})();

if (!existsSync(WURZEL)) {
  console.error(`Es gibt keine Ablage: ${WURZEL} fehlt.`);
  console.error('Ohne abgelegten Geschäftsfall ist hier nichts zu zeigen — und ein leerer');
  console.error('Bericht sähe aus wie eine Akte ohne Einträge. Das ist nicht dasselbe.');
  process.exit(2);
}

const journale = readdirSync(WURZEL).filter(istJournal).sort();
if (!journale.length) {
  console.error(`Kein Journal in ${WURZEL}.`);
  console.error('Ohne abgelegten Geschäftsfall ist hier nichts zu zeigen.');
  process.exit(2);
}

console.log(`\nAkte — ${journale.length} Geschäftsjahr(e) in ${WURZEL}\n`);

let gezeigt = 0;
for (const datei of journale) {
  const jahr = Number(datei.match(/journal-(\d{4})\.jsonl$/)[1]);
  const ablage = ausJournal(readFileSync(join(WURZEL, datei), 'utf8'));
  const ordner = join(WURZEL, belegordner(jahr));

  const vorgaenge = gesucht
    ? [gesucht]
    : [...new Set(ablage.eintraege.map((e) => e.vorgang).filter(Boolean))].sort();

  for (const vorgang of vorgaenge) {
    const akte = vorgangsakte(ablage, vorgang);
    if (!akte.length) {
      if (gesucht) console.log(`  Zu Vorgang ${vorgang} steht nichts im Journal ${jahr}.`);
      continue;
    }
    gezeigt += 1;
    console.log(`  Vorgang ${vorgang} — ${akte.length} Eintrag/Einträge, Journal ${jahr}`);
    for (const e of akte) {
      const name = belegname(e);
      const pfad = join(ordner, name);
      /*
       * **Beides steht nebeneinander, und das ist der Zweck.** Die Zeile sagt,
       * was aufgezeichnet ist; die Datei daneben ist der Beleg. Fehlt sie,
       * steht hier eine Aufzeichnung über ein Papier, das niemand mehr hat —
       * derselbe Befund, den `npm run pruefe-ablage` meldet, nur an der
       * Stelle, an der jemand die Akte tatsächlich liest.
       */
      const beleg = existsSync(pfad)
        ? `${name} (${statSync(pfad).size} Zeichen)`
        : `${name} FEHLT`;
      const betrag = typeof e.betragBrutto === 'number'
        ? EUR(e.betragBrutto)
        : (typeof e.betragNetto === 'number' ? `${EUR(e.betragNetto)} netto` : '—');
      console.log(`    ${String(e.lfd).padStart(3)}. ${e.zeitpunkt}  ${e.art.padEnd(23)}`
        + `${(e.nummer ?? '—').padEnd(16)} ${betrag.padStart(12)}`);
      console.log(`         ${e.text}`);
      console.log(`         Beleg: ${beleg}`);
    }
    const frist = aufbewahrungBis(jahr);
    console.log(`    aufzubewahren bis ${frist.hinweis}\n`);
  }
}

if (!gezeigt) {
  console.log('  Kein Eintrag gefunden.\n');
  process.exit(1);
}

console.log(`${gezeigt} Vorgang/Vorgänge gezeigt. Der Inhalt der Durchschriften steht`);
console.log('absichtlich nicht hier: Er trägt Namen und Anschrift des Kunden, und wer ihn');
console.log('lesen will, öffnet die genannte Datei.');
