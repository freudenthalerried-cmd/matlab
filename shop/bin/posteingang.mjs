#!/usr/bin/env node
/**
 * Vom Journal des Shops zum Angebot.
 *
 *   npm run posteingang                       — was liegt da?
 *   npm run posteingang -- --nummer B-2026-0001 --nach ../vorgaenge/0001
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg steht bis zur Zeile im
 * Journal, und `npm run vorgang` beginnt bei zwei Dateien. Dazwischen lag
 * Abtipparbeit — dieselbe, gegen die `npm run anfrage-lesen` am 3. September
 * gebaut wurde, nur eine Stufe später.
 *
 * ## Wo das Journal liegt
 *
 * Auf dem Hosting, in `bestellungen/journal-<jahr>.jsonl` **über** dem
 * Webverzeichnis. Der Betreiber lädt es herunter; dieses Werkzeug erwartet es
 * unter `ablage/posteingang/` — also im gesperrten Bereich, aus demselben
 * Grund wie die Vorgangsablage: Es trägt Namen, Anschriften und Beträge, und
 * dieses Verzeichnis ist öffentlich.
 *
 * ## Was es nicht tut
 *
 * Es rechnet nichts nach und entscheidet nichts. Ob die Positionen stimmen,
 * prüft `leseAnfrage` gegen den Katalog — dort, wo der Beleg entsteht. Eine
 * zweite Nachrechnung hier wären zwei Rechnungen über denselben Warenkorb.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import { BESTELLFELDER } from '../src/bestellfelder.js';
import { pruefeBestelldaten } from '../src/kunde.js';
import { ABLAGEORT } from '../src/ablageort.js';
import {
  kundendatei, leseJournal, posteingangsbefund, vorgaengeOhneBestellung,
} from '../src/posteingang.js';
import { ausJournal } from '../src/speicher.js';
import { geschaeftsjahr } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const argumente = process.argv.slice(2);
const wahl = (name, ersatz = null) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 && argumente[i + 1] ? argumente[i + 1] : ersatz;
};

// Das Wirtschaftsjahr entscheidet die Journaldatei. Am 1. Jänner um
// 00:30 Uhr ist das schon das neue — die Rechneruhr in UTC sagt noch
// das alte und fände die erste Bestellung des Jahres nicht.
const jahr = Number(wahl('jahr', String(geschaeftsjahr())));
const journal = wahl('journal', join(REPO, ABLAGEORT, 'posteingang', `journal-${jahr}.jsonl`));
const nummer = wahl('nummer');
const nach = wahl('nach');

if (!existsSync(journal)) {
  console.log(`Kein Posteingang unter ${relative(REPO, journal)}.\n`);
  console.log('Das Journal liegt auf dem Hosting, in bestellungen/journal-<jahr>.jsonl über dem');
  console.log('Webverzeichnis. Heruntergeladen gehört es hierher — in den gesperrten Bereich,');
  console.log('weil es Namen, Anschriften und Beträge trägt.');
  process.exit(0);
}

/**
 * **Die Vorgangsablage dazu — 12. September 2026, abends.**
 *
 * Ohne sie weiß dieses Werkzeug nicht, welche Bestellung schon ein Vorgang
 * ist, und schlägt an jedem Tag wieder die erste Zeile des Journals vor.
 * Gelesen werden Nummern und gezählt werden Papiere; kein Inhalt.
 */
const aktenwurzel = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);
const aktenjournal = join(aktenwurzel, `journal-${jahr}.jsonl`);
let vorgaenge = [];
let akteUnlesbar = null;
if (existsSync(aktenjournal)) {
  try {
    vorgaenge = ausJournal(readFileSync(aktenjournal, 'utf8')).eintraege;
  } catch (fehler) {
    /*
     * **Ein unlesbares Aktenjournal darf den Posteingang nicht schließen.**
     * `ausJournal` bricht streng ab — zu Recht, dort geht es um § 131 BAO.
     * Hier ist die Akte aber nur die **Auskunft** darüber, was schon
     * bearbeitet ist. Wer den Posteingang deshalb gar nicht mehr sieht, sieht
     * auch die neu eingegangenen Bestellungen nicht.
     *
     * Gesagt wird es laut, und die Sperre gegen das zweite Herausschneiden
     * fällt damit weg — deshalb steht der Satz oben und nicht im Kleingedruckten.
     */
    akteUnlesbar = fehler.message;
  }
}

const { zeilen, meldungen } = leseJournal(readFileSync(journal, 'utf8'));
const befund = posteingangsbefund(zeilen, pruefeBestelldaten, { vorgaenge });
const bereit = befund.filter((b) => b.bereit);
const offen = befund.filter((b) => b.offen);

console.log(`Posteingang — ${befund.length} Bestellungen, ${bereit.length} angebotsreif, `
  + `${offen.length} davon noch offen\n`);

if (akteUnlesbar) {
  console.log(`  ! Das Aktenjournal ${aktenjournal} ist nicht lesbar: ${akteUnlesbar}`);
  console.log('    Ohne es weiß dieses Werkzeug nicht, was schon bearbeitet ist —');
  console.log('    und die Sperre gegen ein zweites Herausschneiden fällt weg.\n');
}
for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
if (meldungen.length) console.log('');

for (const b of befund) {
  // Drei Zustände, nicht zwei: offen, schon bearbeitet, nicht angebotsreif.
  const zeichen = b.bearbeitet ? '·' : (b.bereit ? '✓' : '·');
  console.log(`  ${zeichen} ${b.nummer}  ${b.zeitpunkt ?? ''}  ${b.firma ?? ''} (${b.bezirk ?? '—'})`);
  if (b.bearbeitet) {
    console.log(`        schon bearbeitet — Vorgang ${b.vorgang}, ${b.papiere} Papier(e) in der Akte`);
  }
  for (const h of b.hindernisse) console.log(`        ${h}`);
}
console.log('');

/*
 * Die Gegenrichtung, als **Auskunft** und nicht als Befund: Ein Vorgang ohne
 * Bestellung im Posteingang ist der telefonische Auftrag, den die
 * Betriebskette ausdrücklich führt. Sind es viele, ist entweder das Journal
 * unvollständig heruntergeladen oder jemand hat von Hand angelegt.
 */
const ohne = vorgaengeOhneBestellung(zeilen, vorgaenge);
if (ohne.length) {
  console.log(`  ${ohne.length} Vorgang/Vorgänge in der Akte ohne Bestellung im Posteingang: `
    + `${ohne.join(', ')}`);
  console.log('  Das ist der telefonische Auftrag — oder ein unvollständig geladenes Journal.\n');
}

// --- Herausschneiden --------------------------------------------------------

if (!nummer) {
  if (offen.length) {
    console.log('Zum Weiterarbeiten:');
    console.log(`  npm run posteingang -- --nummer ${offen[0].nummer} --nach ../vorgaenge/${offen[0].nummer}`);
  } else if (bereit.length) {
    console.log('Nichts offen: Zu jeder angebotsreifen Bestellung liegt ein Vorgang in der Akte.');
  }
  process.exit(meldungen.length ? 1 : 0);
}

const gewaehlt = befund.find((b) => b.nummer === nummer);
if (!gewaehlt) {
  console.error(`Abbruch: ${nummer} steht nicht im Journal.`);
  process.exit(1);
}
if (!gewaehlt.bereit) {
  console.error(`Abbruch: Aus ${nummer} wird kein Angebot.`);
  for (const h of gewaehlt.hindernisse) console.error(`  · ${h}`);
  console.error('\nDie fehlenden Angaben stehen im Formular der Kasse. Fehlen sie hier,');
  console.error('ist die Bestellung vor einer Änderung des Formulars eingegangen — oder');
  console.error('jemand hat die Zeile bearbeitet.');
  process.exit(1);
}
/*
 * **Zweimal herausgeschnitten heißt zweimal angeboten — 12. September 2026.**
 *
 * Dieselbe Bestellung ein zweites Mal durch `npm run vorgang` zu schicken
 * erzeugt ein zweites Angebot über dieselbe Ware, unter einer zweiten
 * Vorgangsnummer, an denselben Kunden. Beide Papiere sind für sich tadellos,
 * und keine Sperre in `vorgang.mjs` sieht etwas: Dort ist es der erste
 * Vorgang dieser Nummer.
 *
 * Gesperrt wird hier und nicht dort — hier ist die Stelle, an der aus einer
 * Zeile im Posteingang zum zweiten Mal ein Vorgang wird.
 *
 * `--erneut` hebt die Sperre auf. Es gibt den Fall: Die beiden Dateien sind
 * verlorengegangen, der Vorgang läuft weiter. Dann ist es kein zweites
 * Angebot, sondern dieselbe Arbeitsvorlage noch einmal — und wer sie holt,
 * weiß das und sagt es.
 */
if (gewaehlt.bearbeitet && !argumente.includes('--erneut')) {
  console.error(`Abbruch: Zu ${nummer} liegt schon Vorgang ${gewaehlt.vorgang} in der Akte, `
    + `mit ${gewaehlt.papiere} Papier(en).`);
  console.error('');
  console.error('Ein zweites Herausschneiden führt zu einem zweiten Angebot über dieselbe');
  console.error('Ware, unter einer zweiten Vorgangsnummer, an denselben Kunden.');
  console.error(`Was abgelegt ist, zeigt: npm run akte -- --vorgang ${gewaehlt.vorgang}`);
  console.error('');
  console.error('Wenn die Arbeitsdateien verlorengegangen sind und der Vorgang weiterläuft:');
  console.error('  --erneut hebt diese Sperre auf.');
  process.exit(1);
}
if (gewaehlt.bearbeitet) {
  console.log(`Hinweis: Zu ${nummer} liegt Vorgang ${gewaehlt.vorgang} mit `
    + `${gewaehlt.papiere} Papier(en) in der Akte. Mit --erneut trotzdem herausgeschnitten.`);
}

if (!nach) {
  console.error('Abbruch: Ohne --nach weiß dieses Werkzeug nicht, wohin.');
  console.error('Erwartet wird ein Ordner außerhalb dieses Verzeichnisses — Kundendaten');
  console.error('sind die des Kunden.');
  process.exit(2);
}

/**
 * **Nicht ins Verzeichnis schreiben.** Dieselbe Regel wie bei der Ablage: Was
 * Namen und Anschriften trägt, gehört nicht in ein öffentliches Repository,
 * und `.gitignore` hilft nur, solange niemand daran vorbeischreibt.
 */
const ziel = resolve(nach);
if ((ziel + '/').startsWith(REPO + '/') && !(ziel + '/').startsWith(join(REPO, ABLAGEORT) + '/')) {
  console.error(`Abbruch: ${ziel} liegt im Verzeichnis.`);
  console.error(`Erlaubt sind Orte außerhalb — oder ${ABLAGEORT}/, das gesperrt ist.`);
  process.exit(2);
}

mkdirSync(ziel, { recursive: true });
writeFileSync(join(ziel, 'anfrage.txt'), `${gewaehlt.eintrag.text}\n`, 'utf8');
writeFileSync(join(ziel, 'kunde.json'),
  `${JSON.stringify(kundendatei(gewaehlt.eintrag, BESTELLFELDER), null, 2)}\n`, 'utf8');

console.log(`Herausgeschnitten nach ${ziel}:`);
console.log('  anfrage.txt   der Text, den die Kasse gebaut hat');
console.log('  kunde.json    die Angaben aus dem Bestellformular');
console.log('\nWeiter mit:');
console.log(`  npm run vorgang -- ${join(ziel, 'anfrage.txt')} \\`);
console.log(`    --kunde ${join(ziel, 'kunde.json')} --nummer ${nummer.replace(/^B-/, '')}`);
console.log('\nDort wird nachgerechnet, geprüft und der Beleg erzeugt. Hier wurde nur');
console.log('herausgeschnitten — nichts entschieden und nichts versendet.');
