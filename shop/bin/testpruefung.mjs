/**
 * Prüft die eigenen Testfälle darauf, ob sie überhaupt etwas behaupten.
 *
 * Anlass ist ein Testfall aus `verhandlung.test.js`, der grün lief und nichts
 * prüfte: Seine Behauptung stand hinter einem `if`, das wegen eines falschen
 * Gruppennamens nie zutraf. Bei über zweihundert Testfällen ist die Frage, wie
 * viele weitere sich so verstecken, nicht durch Lesen zu beantworten.
 *
 * Der Prüfer ist bewusst grob. Er versteht kein JavaScript, er zählt Klammern
 * und sucht Muster. Was er meldet, ist ein **Verdacht**, kein Urteil — jeder
 * Treffer gehört angesehen. Ein Prüfer, der Urteile fällt, würde nur dazu
 * führen, dass man ihn ruhigstellt.
 *
 * Drei Muster gelten als verdächtig:
 *
 *   1. Ein Testfall ohne jede Zusicherung.
 *   2. Eine Zusicherung, die nur innerhalb eines `if` steht — trifft die
 *      Bedingung nie zu, prüft der Fall nichts.
 *   3. Eine Schleife über eine Liste, deren Länge vorher nicht zugesichert
 *      wurde — ist die Liste leer, läuft der Rumpf nie.
 *
 * Wo ein Treffer begründet abgelehnt wird, steht im Testfall die Zeile
 * `// pruefung: begruendet` mit dem Grund daneben. Der Prüfer schweigt dann für
 * diesen Fall. Das ist Absicht: Eine Ausnahme, die man aufschreiben muss, wird
 * seltener aus Bequemlichkeit gemacht als eine, die man wegkonfiguriert.
 *
 * Aufruf: `node bin/testpruefung.mjs [ordner]`
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { zerlege, bisSchliessend, nurCode } from '../src/testzerlegung.js';

const hier = dirname(fileURLToPath(import.meta.url));
// Ein Ordner lässt sich übergeben — sonst wäre nicht nachweisbar, dass der
// Prüfer die Muster tatsächlich findet, die er zu finden behauptet.
const testOrdner = process.argv[2] ? process.argv[2] : join(hier, '..', 'test');


/** Alle Bereiche, die innerhalb eines `if` liegen. */
function ifBereiche(rumpf) {
  const bereiche = [];
  const muster = /\bif\s*\(/g;

  for (const treffer of rumpf.matchAll(muster)) {
    const klammerZu = bisSchliessend(rumpf, treffer.index + treffer[0].length - 1, '(', ')');
    if (klammerZu === -1) continue;
    const nachBedingung = rumpf.slice(klammerZu + 1);
    const versatz = nachBedingung.search(/\S/);
    if (versatz === -1) continue;

    const start = klammerZu + 1 + versatz;
    if (rumpf[start] === '{') {
      const ende = bisSchliessend(rumpf, start);
      if (ende !== -1) bereiche.push([start, ende]);
    } else {
      // Einzeiler ohne Block: bis zum nächsten Semikolon.
      const semikolon = rumpf.indexOf(';', start);
      bereiche.push([start, semikolon === -1 ? rumpf.length : semikolon]);
    }
  }
  return bereiche;
}

/** Prüft einen einzelnen Testfall auf die drei Muster. */
/**
 * Stellen, an denen eine leere Liste der **Regelfall** ist.
 *
 * **Aufgenommen am 9. September 2026, beim ersten Lauf von Regel 4.** Acht der
 * neun Verdachtsfälle waren echt und sind behoben. Einer nicht:
 *
 * ```js
 * // `ohne` ist bei einem stummen Wort leer, und das ist der Regelfall.
 * assert.ok(ohne.every((id) => mit.includes(id)), …);
 * ```
 *
 * Dort wird geprüft, dass **nichts wegfällt** — nicht, dass etwas da war. Eine
 * Längenzusicherung wäre an dieser Stelle sachlich falsch, und der Kommentar
 * daneben sagt das seit dem Tag, an dem der Testfall entstand, also lange vor
 * dieser Regel.
 *
 * > **Ein Prüfer, der einen richtigen Testfall zwingt, falsch zu werden, ist
 * > schlechter als keiner.**
 *
 * Deshalb ein Register statt einer Ausnahme im Code: mit Pflichtgrund und in
 * **beide Richtungen** gehalten — ein Eintrag, dessen Stelle die Regel gar
 * nicht mehr auslöst, ist selbst ein Befund. Sonst sammeln sich hier
 * Freibriefe für Stellen, die es nicht mehr gibt.
 */
const OHNE_LAENGENZUSICHERUNG = Object.freeze([
  Object.freeze({
    datei: 'shopkern.test.js',
    fall: 'achtzehn Wörter, die vorher nichts fanden, finden jetzt Ware',
    ausdruck: 'ohne',
    warum: 'Geprüft wird, dass das Wortregister keine Treffer wegnimmt. Bei einem Wort, '
      + 'das vorher stumm war, ist `ohne` leer — das ist der Regelfall und nicht die '
      + 'Ausnahme. Eine Längenzusicherung verlangte, dass jedes der achtzehn Wörter '
      + 'vorher schon etwas fand, und genau das ist die Behauptung, die der Testfall '
      + 'widerlegt.',
  }),
]);

function pruefeFall(fall) {
  const verdacht = [];

  // Ein Fall, dessen Rumpf sich nicht abgrenzen ließ, ist ungeprüft — und das
  // ist der Befund. Er steht vor der begründeten Ablehnung, denn ein `//
  // pruefung: begruendet` in einem Rumpf, den niemand lesen konnte, wäre
  // ebenfalls nicht gelesen worden.
  if (fall.unlesbar) {
    verdacht.push(`nicht lesbar: ${fall.unlesbar} — dieser Fall wurde nicht geprüft`);
    return verdacht;
  }

  // Begründete Ablehnung im Testfall selbst.
  if (/\/\/\s*pruefung:\s*begruendet/.test(fall.rumpf)) return verdacht;
  const zusicherungen = [...fall.rumpf.matchAll(/\bassert\s*\.\s*\w+/g)];

  if (zusicherungen.length === 0) {
    verdacht.push('behauptet nichts — kein einziges assert');
    return verdacht;
  }

  const bereiche = ifBereiche(fall.rumpf);
  const inIf = (pos) => bereiche.some(([a, b]) => pos > a && pos < b);
  const versteckt = zusicherungen.filter((z) => inIf(z.index));

  if (versteckt.length === zusicherungen.length) {
    verdacht.push(
      `alle ${zusicherungen.length} Zusicherungen stehen in einem if — ` +
        'trifft die Bedingung nie zu, prüft der Fall nichts',
    );
  }

  /*
   * Schleifen über Listen, deren Länge nicht zugesichert wurde.
   *
   * **Gelesen wird der Rumpf ohne Zeichenketten — seit 14. September 2026.**
   * `test/allaussage.test.js` führt Testrümpfe als Zeichenketten mit, weil es
   * einen Leser prüft, der Rümpfe liest. Diese Regel las sie als Schleifen.
   * Eine Schleife in Anführungszeichen läuft nie.
   */
  const code = nurCode(fall.rumpf);
  for (const schleife of code.matchAll(/\bfor\s*\(\s*(?:const|let)\s+\w+\s+of\s+([^)]+)\)/g)) {
    const ueber = schleife[1].trim();

    // Eine Schleife über ein Literal kann nicht leer sein, wenn im Literal
    // etwas steht. Das zu melden wäre nur Lärm, und ein Prüfer, der Lärm
    // macht, wird ruhiggestellt statt befolgt.
    if (/^\[[^\]]/.test(ueber)) continue;

    const start = code.indexOf('{', schleife.index);
    if (start === -1) continue;
    const ende = bisSchliessend(fall.rumpf, start);
    const rumpfDerSchleife = code.slice(start, ende === -1 ? undefined : ende);
    if (!/\bassert\s*\./.test(rumpfDerSchleife)) continue;

    // Wurde vorher die Länge oder Anzahl zugesichert — und zwar die DIESER
    // Liste? Ein bloßes `.length` irgendwo davor genügte früher; damit
    // schirmte die Längenzusicherung einer fremden Liste eine hohle Schleife
    // ab. Jetzt muss ein Name aus dem Schleifenausdruck in derselben
    // Zusicherung stehen wie `.length` oder `.size`.
    const davor = code.slice(0, schleife.index);
    const namen = [...ueber.matchAll(/[A-Za-z_$][\w$]*/g)]
      .map((t) => t[0])
      .filter((n) => !['Object', 'Array', 'Map', 'Set', 'entries', 'keys', 'values', 'from', 'new', 'filter', 'map', 'slice', 'flat'].includes(n));
    const laengeGeprueft = namen.some((n) =>
      new RegExp(`assert[^;\\n]*\\b${n}\\b[^;\\n]*\\.(?:length|size)|assert[^;\\n]*\\.(?:length|size)[^;\\n]*\\b${n}\\b`).test(davor),
    );

    if (!laengeGeprueft) {
      verdacht.push(`Schleife über \`${ueber}\` ohne vorherige Längenzusicherung — bei leerer Liste prüft sie nichts`);
    }
  }

  /**
   * **Regel 4, ergänzt am 9. September 2026.** Regel 3 fand am Vortag zwei
   * hohle Testfälle — beide Schleifen. Die Frage danach war, ob dieselbe
   * Lücke eine andere Schreibweise hat, und sie hat eine:
   *
   * ```js
   * assert.ok(liste.every((x) => …));   // bei leerer Liste: true
   * ```
   *
   * `Array.prototype.every` auf einer leeren Liste ist `true` — die leere
   * Allaussage. Für die Zusicherung ist das dasselbe wie eine Schleife, die
   * nicht läuft: **grün, ohne etwas geprüft zu haben.** Gemessen im Bestand:
   * 23 Fundstellen.
   *
   * Geprüft wird derselbe Umstand wie bei Regel 3 — steht in **derselben**
   * Zusicherung oder davor eine Aussage über die Länge genau dieser Liste? —
   * und mit derselben Zurückhaltung: Ein Literal mit Inhalt kann nicht leer
   * sein, und ein Verdacht ist kein Urteil.
   */
  for (const treffer of fall.rumpf.matchAll(/\bassert\s*\.\s*ok\s*\(\s*([^;]*?)\.every\s*\(/g)) {
    const ueber = treffer[1].trim();
    if (/^\[[^\]]/.test(ueber)) continue;

    // **Eine verneinte Allaussage kennt die Falle nicht.** `!x.every(…)` ist
    // auf der leeren Liste `!true`, also `false` — die Zusicherung fiele
    // durch, statt still zu bestehen. Sie zu melden wäre Lärm, und ein
    // Prüfer, der Lärm macht, wird ruhiggestellt statt befolgt.
    // Gefunden beim ersten Lauf dieser Regel: `quellen.test.js:176`.
    if (ueber.startsWith('!')) continue;

    // Die Zeile selbst zählt mit: `assert.ok(x.length > 0 && x.every(…))`
    // sichert die Länge in derselben Zusicherung zu.
    const zeilenende = fall.rumpf.indexOf('\n', treffer.index);
    const davor = fall.rumpf.slice(0, zeilenende === -1 ? undefined : zeilenende);
    const namen = [...ueber.matchAll(/[A-Za-z_$][\w$]*/g)]
      .map((t) => t[0])
      .filter((n) => !['Object', 'Array', 'Map', 'Set', 'entries', 'keys', 'values', 'from', 'new', 'filter', 'map', 'slice', 'flat'].includes(n));
    const laengeGeprueft = namen.some((n) =>
      new RegExp(`assert[^;\\n]*\\b${n}\\b[^;\\n]*\\.(?:length|size)|assert[^;\\n]*\\.(?:length|size)[^;\\n]*\\b${n}\\b`).test(davor),
    );

    const befreit = OHNE_LAENGENZUSICHERUNG.some(
      (e) => e.datei === fall.datei && e.fall === fall.titel && e.ausdruck === ueber,
    );
    if (befreit) { genutzteBefreiungen.add(`${fall.datei}|${fall.titel}|${ueber}`); continue; }

    if (!laengeGeprueft) {
      verdacht.push(`\`${ueber}.every(…)\` ohne Längenzusicherung — bei leerer Liste ist die Allaussage wahr`);
    }
  }

  return verdacht;
}

let dateien;
try {
  dateien = readdirSync(testOrdner).filter((d) => d.endsWith('.test.js')).sort();
} catch (fehler) {
  console.error(`Testordner nicht lesbar: ${testOrdner}`);
  console.error(`  ${fehler.message}`);
  process.exit(2);
}
const genutzteBefreiungen = new Set();
let faelleGesamt = 0;
let verdaechtig = 0;

for (const datei of dateien) {
  const quelle = readFileSync(join(testOrdner, datei), 'utf8');
  const faelle = zerlege(quelle);
  faelleGesamt += faelle.length;

  const treffer = faelle
    .map((f) => ({ ...f, verdacht: pruefeFall({ ...f, datei }) }))
    .filter((f) => f.verdacht.length > 0);

  if (treffer.length === 0) continue;
  verdaechtig += treffer.length;

  console.log(`\n${datei}`);
  for (const t of treffer) {
    console.log(`  Zeile ${t.zeile}: ${t.titel}`);
    for (const v of t.verdacht) console.log(`    → ${v}`);
  }
}

console.log(`\n${faelleGesamt} Testfälle geprüft, ${verdaechtig} mit Verdacht.`);
// **Die zweite Richtung — und wofür sie gilt.** Ein Register ohne Gegenprobe
// sammelt Freibriefe für Stellen, die es nicht mehr gibt: Wird der Testfall
// umgeschrieben oder gelöscht, bleibt der Eintrag stehen und deckt beim
// nächsten Mal etwas, das niemand geprüft hat.
//
// **Berichtigt, bevor es hinausging.** Der erste Anlauf prüfte das bei *jedem*
// Lauf und rief `process.exit(1)`, ohne `--bericht` anzusehen. Beides falsch,
// und der eigene Testfall dieses Prüfers hat es sofort gefunden: Über den
// Probeordner ist der Eintrag zu Recht ungenutzt — dort steht der gemeinte
// Testfall gar nicht. Ein ungenutzter Eintrag ist nur dann ein Befund, wenn
// **der Bestand gemeint war, für den das Register geschrieben wurde.**
//
//   Die Gegenrichtung eines Registers muss wissen, über welchen Bestand sie
//   spricht. Sonst meldet sie eine Lücke, wo nur jemand woanders hingesehen hat.
const eigenerBestand = !process.argv[2];
const ungenutzt = !eigenerBestand ? [] : OHNE_LAENGENZUSICHERUNG.filter(
  (e) => !genutzteBefreiungen.has(`${e.datei}|${e.fall}|${e.ausdruck}`),
);
if (ungenutzt.length) {
  console.log(`\n${ungenutzt.length} Eintrag/Einträge im Ausnahmeregister greifen nicht mehr:`);
  for (const e of ungenutzt) {
    console.log(`  ✗ ${e.datei} — „${e.fall}" (${e.ausdruck})`);
  }
  console.log('Eine Ausnahme für eine Stelle, die es nicht mehr gibt, deckt beim');
  console.log('nächsten Mal etwas, das niemand geprüft hat.');
  if (!process.argv.includes('--bericht') && !process.argv.includes('--probe')) process.exit(1);
}
console.log('Jeder Treffer ist anzusehen, nicht automatisch zu beheben.');

/**
 * **Ergänzt am 1. September**, aus demselben Grund wie in
 * `inhaltspruefung.mjs` und `quellenpruefung.mjs`: Hier stand `exit(0)`, auch
 * mit Funden. Drei Prüfer, dasselbe Muster, an einem Tag entdeckt — und alle
 * drei aus derselben gut gemeinten Überlegung: Ein Verdacht ist kein Urteil,
 * also soll er nicht blockieren.
 *
 * > **Ein Verdacht, den niemand ansieht, ist ein grünes Licht.** Der Vorbehalt
 * > gehört in die Ausgabe, nicht in den Rückgabewert.
 *
 * Ausgerechnet dieser Prüfer hat elf Schleifen gefunden, die grün liefen und
 * nichts prüften. Er selbst lief grün und meldete nichts weiter.
 */
// `--probe` ist der Selbstnachweis über eine absichtlich fehlerhafte Datei.
// Er soll finden und melden, nicht sperren.
if (verdaechtig > 0 && !process.argv.includes('--bericht') && !process.argv.includes('--probe')) {
  console.log('\nMit Verdacht endet dieser Lauf rot. Mit --bericht nicht.');
  process.exit(1);
}
process.exit(0);
