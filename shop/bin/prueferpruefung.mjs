#!/usr/bin/env node
/**
 * Prüft die Prüfer: Hat jeder von ihnen überhaupt etwas angesehen?
 *
 *   node bin/prueferpruefung.mjs
 *
 * An einem einzigen Tag ist derselbe Fehler fünfmal aufgetreten, jedes Mal
 * in einem anderen Werkzeug:
 *
 * | Werkzeug | zeigte auf |
 * |---|---|
 * | `pruefe-inhalte` | eine Probedatei mit 15 Absätzen statt auf 23 Seiten |
 * | `pruefe-quellen` | eine Vorlage mit erfundenen Quellen — es gab gar kein Register |
 * | Rahmenprobe im Shop | eine Seite ohne ausgeführtes Skript |
 * | Warenkorbprobe | eine leere Seite: null zu kleine Bedienelemente von null |
 * | deren Absicherung | zählte die Kopfleiste mit und war damit immer erfüllt |
 *
 * Alle fünf meldeten **Grün**. Keiner war kaputt; jeder sah nur das
 * Falsche an.
 *
 * > **Ein Prüfer, der nichts angesehen hat, ist nicht still — er ist
 * > zustimmend.** Und Zustimmung ist die teuerste Sorte Fehlmeldung, weil
 * > niemand ihr nachgeht.
 *
 * Dieses Werkzeug stellt an jeden Prüfer **eine** Frage: Wie viele Einheiten
 * hast du angesehen? Bleibt die Zahl unter dem hinterlegten Mindestmaß, gilt
 * der Prüfer als nicht gelaufen — unabhängig davon, ob er Treffer gemeldet
 * hat.
 *
 * Es ersetzt die Prüfer nicht und liest ihre Befunde nicht. Es beantwortet
 * nur die Frage, die vor jedem Befund kommt.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { beurteile } from '../src/prueferurteil.js';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';

const hier = dirname(fileURLToPath(import.meta.url));

/**
 * Das Mindestmaß ist bewusst **deutlich unter** dem heutigen Stand
 * angesetzt: Es soll anschlagen, wenn ein Prüfer auf eine Probe oder ins
 * Leere zeigt, und nicht bei jeder gelöschten Seite.
 */
const mitBrowser = process.argv.includes('--mit-browser');
const liste = mitBrowser ? [...PRUEFER, ...BROWSERPRUEFER] : PRUEFER;

let gescheitert = 0;
let abgebrochen = 0;

for (const p of liste) {
  let ausgabe = '';
  let fehlerstrom = '';
  let code = 0;
  try {
    ausgabe = execFileSync(process.execPath, [join(hier, p.werkzeug), ...(p.argumente ?? [])], {
      encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
      // stderr gehört gereicht, nicht vererbt — sonst gehört der Abbruchgrund
      // optisch dem Aufrufer und nicht dem Prüfer, der ihn geschrieben hat.
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (fehler) {
    // Ein Prüfer, der Treffer meldet, endet mit Code 1. Das ist kein Fehler
    // dieses Werkzeugs — seine Ausgabe zählt trotzdem.
    ausgabe = fehler.stdout ?? '';
    fehlerstrom = fehler.stderr ?? '';
    code = fehler.status ?? -1;
  }

  // Das Urteil selbst steht in `src/prueferurteil.js` — dort ist es prüfbar.
  // Hier bleibt nur, es auszusprechen.
  const urteil = beurteile({ code, ausgabe, fehlerstrom }, p);

  // **Ein Abbruch ist keine fehlende Mengenangabe.** Die Proben enden mit
  // Code 2, wenn sie sich weigern zu laufen — etwa weil das Erzeugnis älter
  // ist als seine Quelle. Sie sagen dabei genau, was zu tun ist. Wer das als
  // „keine Mengenangabe" meldet, schickt den Lesenden ein Muster suchen,
  // während die Antwort danebensteht: `npm run build`.
  if (urteil.art === 'abbruch') {
    abgebrochen++;
    console.log(`\u2717 ${p.name}`);
    console.log(`    abgebrochen mit Code ${urteil.code} — der Prüfer hat sich geweigert zu laufen:`);
    for (const zeile of urteil.grund.length ? urteil.grund : ['(keine Begründung auf stderr)']) {
      console.log(`      ${zeile}`);
    }
    continue;
  }
  if (urteil.art === 'ohne-menge') {
    gescheitert++;
    console.log(`\u2717 ${p.name}`);
    console.log(`    keine Mengenangabe in der Ausgabe — Muster ${p.muster}`);
    console.log(`    Ein Prüfer ohne Mengenangabe kann nicht sagen, ob er etwas angesehen hat.`);
    continue;
  }
  if (urteil.art === 'zu-wenig') {
    gescheitert++;
    console.log(`\u2717 ${p.name}`);
    console.log(`    nur ${urteil.zahl} ${p.einheit} angesehen, erwartet mindestens ${p.mindestens}`);
    console.log(`    Zeigt der Prüfer auf eine Probedatei statt auf den Bestand?`);
    continue;
  }
  console.log(`\u2713 ${p.name} — ${urteil.zahl} ${p.einheit}`);
}

console.log(`\n${liste.length} Prüfer befragt, ${gescheitert} ohne belastbaren Umfang${
  abgebrochen ? `, ${abgebrochen} abgebrochen` : ''
}.`);
if (abgebrochen) {
  console.log('Ein Abbruch ist kein Befund über den Umfang — der Prüfer ist gar nicht');
  console.log('gelaufen. Erst die genannte Ursache beheben, dann erneut befragen.');
}
if (!mitBrowser) {
  console.log(`Die ${BROWSERPRUEFER.length} Browserproben sind nicht dabei — sie kosten einen Chromium-Start`);
  console.log('je Szenario bzw. je gebauter Seite. Mit `--mit-browser` laufen sie mit.');
}
console.log('Geprüft ist damit der Umfang, nicht der Befund: Was die Prüfer melden,');
console.log('steht in ihrer eigenen Ausgabe und gehört einzeln angesehen.');
process.exit(gescheitert || abgebrochen ? 1 : 0);
