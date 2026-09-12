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

import { ARTEN, aufbewahrungBis, vorgangsakte } from '../src/ablage.js';
import { ausJournal } from '../src/speicher.js';
import { ABLAGEORT, belegname, belegordner, istJournal } from '../src/ablageort.js';
import { EUR } from '../src/format.js';
import { bindefrist } from '../src/beleg.js';
import { vorgangsstand } from '../src/vorgangsstand.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const WURZEL = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);

const gesucht = (() => {
  const i = process.argv.indexOf('--vorgang');
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
})();

/*
 * **`--offen` macht aus der Akte eine Arbeitsliste.** Die Akte zeigt alles,
 * und das ist richtig: Sie ist die Auskunft über einen Geschäftsfall. Wer
 * morgens wissen will, was zu tun ist, braucht die andere Frage — und die
 * abgeschlossenen Vorgänge stehen ihr im Weg, weil es mit der Zeit die
 * meisten sind.
 */
const nurOffene = process.argv.includes('--offen');

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

const heute = geschaeftstag();
let gezeigt = 0;
let verfallen = 0;
let bindend = 0;
let laufend = 0;
let geschlossen = 0;
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
    const stand = vorgangsstand(akte, { heute });
    if (nurOffene && stand.abgeschlossen) {
      geschlossen += 1;
      continue;
    }
    gezeigt += 1;
    console.log(`  Vorgang ${vorgang} — ${akte.length} Eintrag/Einträge, Journal ${jahr}`);
    for (const e of akte) {
      /*
       * **Beides steht nebeneinander, und das ist der Zweck.** Die Zeile sagt,
       * was aufgezeichnet ist; die Datei daneben ist der Beleg. Fehlt sie,
       * steht hier eine Aufzeichnung über ein Papier, das niemand mehr hat —
       * derselbe Befund, den `npm run pruefe-ablage` meldet, nur an der
       * Stelle, an der jemand die Akte tatsächlich liest.
       *
       * **Nicht überall — berichtigt am 12. September 2026.** `vermerk` und
       * `uidabfrage` tragen in `ARTEN` seit heute `beleg: false`: Sie sind
       * die Aufzeichnung und haben kein Blatt. Hier stand für sie `FEHLT`,
       * also ein Mangel, wo keiner ist — und wer eine Akte liest, in der ein
       * Drittel der Zeilen grundlos `FEHLT` sagt, hört auf, es zu lesen.
       */
      const beschreibung = ARTEN[e.art];
      let beleg;
      if (beschreibung && !beschreibung.beleg) {
        beleg = `kein Blatt — ${e.art} ist selbst die Aufzeichnung`;
      } else {
        const name = belegname(e);
        const pfad = join(ordner, name);
        beleg = existsSync(pfad)
          ? `${name} (${statSync(pfad).size} Zeichen)`
          : `${name} FEHLT`;
      }
      const betrag = typeof e.betragBrutto === 'number'
        ? EUR(e.betragBrutto)
        : (typeof e.betragNetto === 'number' ? `${EUR(e.betragNetto)} netto` : '—');
      console.log(`    ${String(e.lfd).padStart(3)}. ${e.zeitpunkt}  ${e.art.padEnd(23)}`
        + `${(e.nummer ?? '—').padEnd(16)} ${betrag.padStart(12)}`);
      console.log(`         ${e.text}`);
      console.log(`         Beleg: ${beleg}`);
      /*
       * **Die Frist, die von selbst abläuft — 12. September 2026.**
       *
       * Die Betriebskette führt den Abzweig „das Angebot verfällt" ohne
       * Werkzeug, weil ein **Wächter** täglich laufen müsste und nichts in
       * diesem Haus täglich läuft. Das trifft die **Auskunft** nicht: Wer die
       * Akte aufschlägt, fragt genau das.
       *
       * > **Nimmt der Kunde am zwanzigsten Tag an, entsteht kein Vertrag zum
       * > Preis von damals (§ 862 ABGB)** — und Baustoffpreise bewegen sich.
       */
      if (e.art === 'angebot') {
        const frist = bindefrist(e.zeitpunkt, heute);
        if (!frist.lesbar) {
          console.log('         Bindefrist: aus diesem Zeitpunkt nicht zu rechnen');
        } else if (frist.abgelaufen) {
          verfallen += 1;
          console.log(`         Bindefrist: bis ${frist.bis} — VERFALLEN seit `
            + `${Math.abs(frist.offen)} Tag(en)`);
        } else {
          bindend += 1;
          console.log(`         Bindefrist: bis ${frist.bis} — bindet noch ${frist.offen} Tag(e)`);
        }
      }
    }
    /*
     * **Was als Nächstes zu tun ist — 12. September 2026, abends.**
     *
     * Die Akte sagte bis hierher, **was geschehen ist**: die Zeilen und ihre
     * Belege. Vier Vorgänge an vier verschiedenen Punkten der Betriebskette
     * bekamen dieselbe Auskunft. Der Kunde hat angenommen — und niemand
     * erinnerte daran, den Zahlungseingang zu prüfen; die Ware ist bestellt —
     * und niemand an das Lieferdatum, ohne das keine Rechnung entsteht.
     *
     * Der Schritt, sein Werkzeug und sein Gate kommen aus `SCHRITTE` in
     * `src/betriebskette.js` und werden hier nur abgelesen.
     */
    if (stand.abgeschlossen) {
      geschlossen += 1;
      console.log(`    Stand: abgeschlossen — ${stand.abgeschlossen}`);
      if (stand.abzweig) console.log(`           ${stand.abzweig.was}`);
    } else {
      laufend += 1;
      console.log(`    Stand: ${stand.erreicht ? `zuletzt „${stand.erreicht}"` : 'noch kein Papier'}`);
      if (stand.naechster) {
        console.log(`    Als Nächstes: ${stand.naechster.was}`);
        console.log(`           ${stand.naechster.werkzeug ?? 'kein Werkzeug — das geschieht in der Welt'}`);
        console.log(`           ${stand.naechster.gate}`);
      }
    }
    const frist = aufbewahrungBis(jahr);
    console.log(`    aufzubewahren bis ${frist.hinweis}\n`);
  }
}

if (!gezeigt) {
  console.log('  Kein Eintrag gefunden.\n');
  process.exit(1);
}

if (bindend || verfallen) {
  console.log(`Angebote: ${bindend} binden noch, ${verfallen} verfallen (Stand ${heute}).`);
  if (verfallen) {
    console.log('Ein verfallenes Angebot bindet nicht mehr — eine Annahme danach ist ein');
    console.log('neues Angebot des Kunden, und der Preis ist neu zu rechnen (§ 862 ABGB).');
  }
  console.log('');
}

console.log(`${laufend} Vorgang/Vorgänge laufen, ${geschlossen} sind abgeschlossen.`);
console.log('Was als Nächstes zu tun ist, steht bei jedem laufenden — der Schritt, sein');
console.log('Werkzeug und sein Gate kommen aus der Betriebskette (npm run betriebskette).\n');

console.log(`${gezeigt} Vorgang/Vorgänge gezeigt. Der Inhalt der Durchschriften steht`);
console.log('absichtlich nicht hier: Er trägt Namen und Anschrift des Kunden, und wer ihn');
console.log('lesen will, öffnet die genannte Datei.');
