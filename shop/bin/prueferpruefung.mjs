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

const hier = dirname(fileURLToPath(import.meta.url));

/**
 * Das Mindestmaß ist bewusst **deutlich unter** dem heutigen Stand
 * angesetzt: Es soll anschlagen, wenn ein Prüfer auf eine Probe oder ins
 * Leere zeigt, und nicht bei jeder gelöschten Seite.
 */
const PRUEFER = [
  {
    name: 'pruefe-inhalte',
    werkzeug: 'inhaltspruefung.mjs',
    muster: /(\d+) Dateien, (\d+) Absätze geprüft/,
    einheit: 'Inhaltsseiten',
    mindestens: 20,
  },
  {
    name: 'pruefe-seiten',
    werkzeug: 'inhaltspruefung.mjs',
    argumente: ['--seiten'],
    muster: /(\d+) Seiten, (\d+) Fließtextabsätze geprüft/,
    einheit: 'gebaute Seiten',
    mindestens: 40,
  },
  {
    name: 'pruefe-quellen',
    werkzeug: 'quellenpruefung.mjs',
    muster: /Aussagen: \d+ von (\d+) belegt/,
    einheit: 'belegpflichtige Aussagen',
    mindestens: 5,
  },
  {
    name: 'pruefe-widerrufe',
    werkzeug: 'widerrufpruefung.mjs',
    muster: /(\d+) Dateien, (\d+) Fundstellen/,
    einheit: 'Verzeichnisdateien',
    mindestens: 90,
  },
  {
    name: 'pruefe-geheimnis',
    werkzeug: 'geheimnispruefung.mjs',
    muster: /(\d+) von (\d+) Einkaufspreisen/,
    einheit: 'Artikel',
    mindestens: 40,
    zweite: true,
  },
  {
    name: 'pruefe-tests',
    werkzeug: 'testpruefung.mjs',
    muster: /(\d+) Testfälle geprüft/,
    einheit: 'Testfälle',
    mindestens: 500,
  },
];

/**
 * Die Browserproben.
 *
 * Sie bleiben aus dem Regellauf heraus, weil jede einen Chromium-Start je
 * Einheit kostet — je Szenario bei den Proben, je gebauter Seite beim
 * Zensus; zusammen gut eine Minute. Mit `--mit-browser` kommen sie
 * dazu. Geprüft wird auch hier nur der **Umfang**: Eine gelöschte Datei mit
 * Szenarien fiele sonst niemandem auf.
 *
 * Für die Frage, ob ein einzelnes Szenario etwas gesehen hat, ist dieses
 * Werkzeug der falsche Ort. Das muss jedes Szenario selbst beweisen — durch
 * eine Erwartung, die auf einer leeren Seite nicht erfüllbar ist (die
 * Überschrift, die Zahl der gefundenen Elemente, der Zustand **vor** der
 * geprüften Handlung).
 */
const BROWSERPRUEFER = [
  {
    name: 'oberflaechenprobe',
    werkzeug: 'oberflaechenprobe.mjs',
    muster: /(\d+) Szenarien/,
    einheit: 'Szenarien',
    mindestens: 9,
  },
  {
    name: 'shopprobe',
    werkzeug: 'shopprobe.mjs',
    muster: /(\d+) Szenarien/,
    einheit: 'Szenarien',
    mindestens: 18,
  },
  // Der Zensus zählt keine Szenarien, sondern gebaute Seiten. Genau deshalb
  // steht er hier: Zeigt er eines Tages auf einen leeren Ausgabeordner,
  // meldet er „0 von 0 Seiten" — und das sähe ohne Mindestmaß wie Grün aus.
  {
    name: 'rahmenzensus',
    werkzeug: 'rahmenzensus.mjs',
    muster: /(\d+) von (\d+) Seiten rollen/,
    einheit: 'gebaute Seiten im 390-px-Rahmen',
    mindestens: 40,
    zweite: true,
  },
];

const mitBrowser = process.argv.includes('--mit-browser');
const liste = mitBrowser ? [...PRUEFER, ...BROWSERPRUEFER] : PRUEFER;

let gescheitert = 0;

for (const p of liste) {
  let ausgabe = '';
  let lief = true;
  try {
    ausgabe = execFileSync(process.execPath, [join(hier, p.werkzeug), ...(p.argumente ?? [])], {
      encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    });
  } catch (fehler) {
    // Ein Prüfer, der Treffer meldet, endet mit Code 1. Das ist kein Fehler
    // dieses Werkzeugs — seine Ausgabe zählt trotzdem.
    ausgabe = fehler.stdout ?? '';
    lief = Boolean(ausgabe);
  }

  const treffer = ausgabe.match(p.muster);
  const zahl = treffer ? Number(treffer[p.zweite ? 2 : 1]) : null;

  if (!lief || zahl === null) {
    gescheitert++;
    console.log(`✗ ${p.name}`);
    console.log(`    keine Mengenangabe in der Ausgabe — Muster ${p.muster}`);
    console.log(`    Ein Prüfer ohne Mengenangabe kann nicht sagen, ob er etwas angesehen hat.`);
    continue;
  }
  if (zahl < p.mindestens) {
    gescheitert++;
    console.log(`✗ ${p.name}`);
    console.log(`    nur ${zahl} ${p.einheit} angesehen, erwartet mindestens ${p.mindestens}`);
    console.log(`    Zeigt der Prüfer auf eine Probedatei statt auf den Bestand?`);
    continue;
  }
  console.log(`✓ ${p.name} — ${zahl} ${p.einheit}`);
}

console.log(`\n${liste.length} Prüfer befragt, ${gescheitert} ohne belastbaren Umfang.`);
if (!mitBrowser) {
  console.log(`Die ${BROWSERPRUEFER.length} Browserproben sind nicht dabei — sie kosten einen Chromium-Start`);
  console.log('je Szenario bzw. je gebauter Seite. Mit `--mit-browser` laufen sie mit.');
}
console.log('Geprüft ist damit der Umfang, nicht der Befund: Was die Prüfer melden,');
console.log('steht in ihrer eigenen Ausgabe und gehört einzeln angesehen.');
process.exit(gescheitert ? 1 : 0);
