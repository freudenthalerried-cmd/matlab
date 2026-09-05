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

const hier = dirname(fileURLToPath(import.meta.url));
// Ein Ordner lässt sich übergeben — sonst wäre nicht nachweisbar, dass der
// Prüfer die Muster tatsächlich findet, die er zu finden behauptet.
const testOrdner = process.argv[2] ? process.argv[2] : join(hier, '..', 'test');

/** Findet die schließende Klammer zu der bei `start`. Naiv, aber ausreichend. */
/**
 * Das Ende einer Zeichenkette, die bei `start` mit ihrem Anführungszeichen
 * beginnt — Rückstriche übersprungen. -1, wenn sie nicht geschlossen wird.
 */
function endeDerZeichenkette(text, start) {
  const anfuehrung = text[start];
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === '\\') { i++; continue; }
    if (text[i] === anfuehrung) return i;
  }
  return -1;
}

/**
 * Steht das `/` bei `start` am Anfang eines Muster-Literals — oder ist es eine
 * Division?
 *
 * Zu unterscheiden sind die beiden nur am Zeichen davor: Nach einem Wert
 * (`a / b`, `zahl) / 2`) teilt es, nach einem Operator oder einer öffnenden
 * Klammer beginnt es ein Muster. Diese Liste ist die übliche Heuristik; sie
 * deckt jede Schreibweise ab, die im Testbestand vorkommt.
 */
function istMusteranfang(text, start) {
  let i = start - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  if (i < 0) return true;
  // Der Pfeil ist der häufigste Fall im Bestand: `(m) => /muster/.test(m)`.
  // Ein einzelnes `>` ist dagegen ein Vergleich, hinter dem geteilt wird.
  if (text[i] === '>' && text[i - 1] === '=') return true;
  if ('(,=:[!&|?+-*%^~{};'.includes(text[i])) return true;
  return /\b(return|typeof|case|in|of|do|else|yield|await|new|delete|void|instanceof)$/
    .test(text.slice(0, i + 1));
}

/**
 * Das Ende eines Muster-Literals, das bei `start` beginnt. Zeichenklassen
 * zählen mit: In `[^/]` schließt der Schrägstrich das Muster nicht.
 */
function endeDesMusters(text, start) {
  let inKlasse = false;
  for (let i = start + 1; i < text.length; i++) {
    const z = text[i];
    if (z === '\\') { i++; continue; }
    if (z === '\n') return -1;
    if (inKlasse) { if (z === ']') inKlasse = false; continue; }
    if (z === '[') { inKlasse = true; continue; }
    if (z === '/') return i;
  }
  return -1;
}

/**
 * Die passende schließende Klammer — **ohne** Klammern in Zeichenketten,
 * Muster-Literalen und Kommentaren mitzuzählen.
 *
 * **Der Anlass, 3. September 2026.** `test/geheimnis.test.js` hat neun
 * Testfälle; dieser Prüfer sah acht. Einer davon zeigt einer Prüfregel eine
 * Codezeile als Text:
 *
 *     assert.deepEqual(findeAbfluss('export function artikelEinkauf(a, l) {'), []);
 *
 * Die geschweifte Klammer steht in Anführungszeichen und schließt nie. Diese
 * Zählung lief davon bis zum Dateiende, fand keine Balance, gab -1 zurück —
 * und die Schleife darüber übersprang den Testfall mit `continue`. Still.
 *
 * > **Ein Prüfer, der eine Stelle nicht lesen kann, muss das sagen. Wer sie
 * > überspringt, prüft weniger, als er meldet — und meldet es nicht.**
 *
 * Deshalb zwei Änderungen an einer Stelle: Diese Zählung kennt jetzt
 * Zeichenketten und Kommentare, und ein Testfall, der sich trotzdem nicht
 * abgrenzen lässt, wird gemeldet statt übersprungen.
 *
 * Muster-Literale gehören dazu: Der erste Anlauf kannte nur Zeichenketten und
 * machte acht weitere Fälle unlesbar — `/role="img" aria-label="[^"]+"/` trägt
 * fünf Anführungszeichen, und beim fünften lief die Zeichenkettenerkennung in
 * den Rest der Datei. **Ein Prüfer, der eine Schreibweise nicht kennt, meldet
 * nicht zu wenig, sondern das Falsche** — dieselbe Lehre wie beim
 * Optionsobjekt am 28.08., einen Stock tiefer.
 */
function bisSchliessend(text, start, auf = '{', zu = '}') {
  let tiefe = 0;
  for (let i = start; i < text.length; i++) {
    const zeichen = text[i];

    if (zeichen === '/' && text[i + 1] === '/') {
      const ende = text.indexOf('\n', i);
      if (ende === -1) return -1;
      i = ende;
      continue;
    }
    if (zeichen === '/' && text[i + 1] === '*') {
      const ende = text.indexOf('*/', i + 2);
      if (ende === -1) return -1;
      i = ende + 1;
      continue;
    }
    if (zeichen === "'" || zeichen === '"' || zeichen === '`') {
      const ende = endeDerZeichenkette(text, i);
      if (ende === -1) return -1;
      i = ende;
      continue;
    }
    if (zeichen === '/' && istMusteranfang(text, i)) {
      const ende = endeDesMusters(text, i);
      if (ende === -1) return -1;
      i = ende;
      continue;
    }

    if (zeichen === auf) tiefe++;
    else if (zeichen === zu) {
      tiefe--;
      if (tiefe === 0) return i;
    }
  }
  return -1;
}

/** Zerlegt eine Testdatei in ihre einzelnen Testfälle. */
function zerlege(quelle) {
  const faelle = [];
  const muster = /\btest\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,/g;

  for (const treffer of quelle.matchAll(muster)) {
    const titel = treffer[2];
    // `node:test` erlaubt drei Formen: test(name, fn), test(name, options, fn)
    // und test(name, options). Die zweite hat dieser Prüfer bis zum 28.08.
    // falsch gelesen: Er nahm die **erste** geschweifte Klammer nach dem Namen
    // als Rumpf — und das ist bei `test('…', { skip: … }, () => { … })` das
    // Optionsobjekt. Zwei Testfälle in `baustoffkatalog.test.js` galten
    // deshalb als „behauptet nichts", obwohl sie zusammen zwölf
    // Zusicherungen tragen.
    //
    // > **Ein Prüfer, der eine gültige Schreibweise nicht kennt, meldet
    // > nicht zu wenig, sondern das Falsche** — und wer den Fehlalarm
    // > abhakt, hakt beim nächsten Mal auch den echten Treffer ab.
    let stelle = treffer.index + treffer[0].length;
    const versatz = quelle.slice(stelle).search(/\S/);
    if (versatz !== -1 && quelle[stelle + versatz] === '{') {
      const optionenZu = bisSchliessend(quelle, stelle + versatz);
      if (optionenZu === -1) continue;
      stelle = optionenZu + 1;
    }
    const zeile = quelle.slice(0, treffer.index).split('\n').length;
    const klammerAuf = quelle.indexOf('{', stelle);
    // Kein Rumpf zu finden ist kein Grund zu schweigen — siehe
    // `bisSchliessend`. Der Fall zählt mit und trägt seinen Grund.
    if (klammerAuf === -1) {
      faelle.push({ titel, rumpf: '', zeile, unlesbar: 'kein Rumpf nach dem Namen gefunden' });
      continue;
    }
    const klammerZu = bisSchliessend(quelle, klammerAuf);
    if (klammerZu === -1) {
      faelle.push({
        titel, rumpf: '', zeile,
        unlesbar: 'die geschweifte Klammer des Rumpfes schließt nicht',
      });
      continue;
    }

    faelle.push({
      titel,
      rumpf: quelle.slice(klammerAuf + 1, klammerZu),
      zeile,
    });
  }
  return faelle;
}

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

  // Schleifen über Listen, deren Länge nicht zugesichert wurde.
  for (const schleife of fall.rumpf.matchAll(/\bfor\s*\(\s*(?:const|let)\s+\w+\s+of\s+([^)]+)\)/g)) {
    const ueber = schleife[1].trim();

    // Eine Schleife über ein Literal kann nicht leer sein, wenn im Literal
    // etwas steht. Das zu melden wäre nur Lärm, und ein Prüfer, der Lärm
    // macht, wird ruhiggestellt statt befolgt.
    if (/^\[[^\]]/.test(ueber)) continue;

    const start = fall.rumpf.indexOf('{', schleife.index);
    if (start === -1) continue;
    const ende = bisSchliessend(fall.rumpf, start);
    const rumpfDerSchleife = fall.rumpf.slice(start, ende === -1 ? undefined : ende);
    if (!/\bassert\s*\./.test(rumpfDerSchleife)) continue;

    // Wurde vorher die Länge oder Anzahl zugesichert — und zwar die DIESER
    // Liste? Ein bloßes `.length` irgendwo davor genügte früher; damit
    // schirmte die Längenzusicherung einer fremden Liste eine hohle Schleife
    // ab. Jetzt muss ein Name aus dem Schleifenausdruck in derselben
    // Zusicherung stehen wie `.length` oder `.size`.
    const davor = fall.rumpf.slice(0, schleife.index);
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
let faelleGesamt = 0;
let verdaechtig = 0;

for (const datei of dateien) {
  const quelle = readFileSync(join(testOrdner, datei), 'utf8');
  const faelle = zerlege(quelle);
  faelleGesamt += faelle.length;

  const treffer = faelle
    .map((f) => ({ ...f, verdacht: pruefeFall(f) }))
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
