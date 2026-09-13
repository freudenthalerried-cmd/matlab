#!/usr/bin/env node
/**
 * Der Vermerk — die Aufzeichnung, wo kein Papier entsteht.
 *
 *   npm run vermerk -- --vorgang 2026-0110 --text "Kunde hat telefonisch verschoben"
 *
 * **Der Anlass, 13. September 2026.** `ARTEN` führt `vermerk` seit dem
 * 4. September. Seit dem 12. nimmt `durchschriftenbefund` ausdrücklich
 * Rücksicht darauf, dass er kein Blatt hat, `npm run akte` schreibt „kein
 * Blatt — vermerk ist selbst die Aufzeichnung", und `alsCsv` führt ihn mit
 * `umsatz: nein`. Vier Werkzeuge kennen ihn.
 *
 * > **Geschrieben hat nie eines einen.** Alles, was in der Welt geschieht und
 * > kein Papier erzeugt — der Kunde ruft an und verschiebt, der Lieferant
 * > sagt ab, das Geld geht ein —, war in dieser Akte nicht aufzeichenbar.
 *
 * § 131 Abs 1 Z 5 BAO verlangt zu jedem Geschäftsfall einen Beleg; wo keiner
 * entsteht, tritt der Vermerk an seine Stelle. Ohne ihn hat die Akte für
 * genau die Ereignisse keine Zeile, für die sie die einzige Quelle wäre.
 *
 * ## Was dieses Werkzeug nicht tut
 *
 * Es **schließt keinen Vorgang ab**. Ein Vermerk hält fest, was geschehen
 * ist, und sagt nichts darüber, ob ein Fall erledigt ist — der Abzweig
 * „Nach Vertragsschluss und Zahlung sagt der Lieferant ab" hat weiterhin
 * keine veröffentlichte Regel, und eine erfundene wäre eine Zusage an Kunden,
 * die auf keiner Seite steht.
 *
 * Und es erzeugt **keine Durchschrift**: `ARTEN.vermerk` trägt `beleg: false`.
 * Wer eine anlegte, legte eine Abschrift von etwas ab, das nie ein Blatt war.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { haltefest, vorgangsakte } from '../src/ablage.js';
import { ausJournal, journalzeile } from '../src/speicher.js';
import { ABLAGEORT } from '../src/ablageort.js';
import { geschaeftstag, geschaeftsjahr } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const WURZEL = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);

/**
 * **Die Grenze ist die des Auszugs — 200 Zeichen.**
 *
 * `alsCsv` schneidet das Textfeld bei 200 Zeichen ab. Für einen Beleg ist das
 * harmlos: Dort steht ein **Betreff**, und das Papier daneben trägt den
 * Inhalt. Für einen Vermerk ist der Text die Aufzeichnung selbst — er würde
 * auf dem Weg zum Steuerberater lautlos gekürzt.
 *
 * Abgewiesen statt gekürzt: Was hier nicht hineinpasst, gehört in zwei
 * Vermerke, und dann steht beides vollständig da.
 */
const HOECHSTLAENGE = 200;

const argumente = process.argv.slice(2);
const wahl = (name) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 && argumente[i + 1] ? argumente[i + 1] : null;
};

const abbruch = (satz, nachsatz = '') => {
  console.error(`\nAbbruch: ${satz}`);
  if (nachsatz) console.error(nachsatz);
  process.exit(1);
};

const vorgang = wahl('vorgang');
const text = wahl('text');

if (!vorgang || !text) {
  console.error('\nnpm run vermerk -- --vorgang 2026-0110 --text "Kunde hat telefonisch verschoben"');
  console.error('');
  console.error('Beides ist Pflicht. Ein Vermerk ohne Vorgang gehört zu keinem Geschäftsfall,');
  console.error('und ein Vermerk ohne Text zeichnet nichts auf.');
  process.exit(2);
}

if (text.trim().length === 0) abbruch('Der Vermerk ist leer.');
if (text.length > HOECHSTLAENGE) {
  abbruch(`Der Vermerk ist ${text.length} Zeichen lang, erlaubt sind ${HOECHSTLAENGE}.`,
    'Der Auszug für die Buchhaltung schneidet das Textfeld bei 200 Zeichen ab. Bei einem\n'
    + 'Beleg steht dort ein Betreff und der Inhalt auf dem Papier daneben; beim Vermerk ist\n'
    + 'der Text die Aufzeichnung selbst. Zwei Vermerke sind vollständig, einer gekürzt nicht.');
}

const jahr = geschaeftsjahr();
const journal = join(WURZEL, `journal-${jahr}.jsonl`);
if (!existsSync(journal)) {
  abbruch(`Kein Journal ${jahr} in ${WURZEL}.`,
    'Ein Vermerk zu einem Geschäftsfall, den keine Akte kennt, ist ein Zettel.');
}

const ablage = ausJournal(readFileSync(journal, 'utf8'));

/*
 * **Der Vorgang muss es geben.** Ein Vermerk unter einer Nummer, zu der nichts
 * abgelegt ist, steht für sich allein — und § 131 Abs 1 Z 5 BAO verlangt die
 * Rückführbarkeit zum Geschäftsfall, nicht eine Zeile mit einer Nummer darauf.
 * Ein Vertipper in der Vorgangsnummer erzeugte sonst eine Aufzeichnung, die
 * niemand je wiederfindet.
 */
if (vorgangsakte(ablage, vorgang).length === 0) {
  abbruch(`Zu Vorgang ${vorgang} steht nichts im Journal ${jahr}.`,
    'Ein Vermerk gehört zu einem Geschäftsfall. Welche Vorgänge es gibt, zeigt\n'
    + 'npm run akte.');
}

mkdirSync(WURZEL, { recursive: true });
ablage.schreibe = (e) => appendFileSync(journal, `${journalzeile(e)}\n`, 'utf8');

const eintrag = haltefest(ablage, {
  art: 'vermerk',
  nummer: null,
  zeitpunkt: geschaeftstag(),
  vorgang,
  betragNetto: null,
  betragBrutto: null,
  text,
  bezugAuf: null,
});

console.log(`\nVermerkt zu Vorgang ${vorgang} als lfd. ${eintrag.lfd}, ${eintrag.zeitpunkt}`);
console.log(`  ${text}`);
console.log('');
console.log('Kein Blatt und keine Durchschrift: Der Vermerk ist selbst die Aufzeichnung');
console.log('(§ 131 Abs 1 Z 5 BAO). Abgeschlossen wird damit nichts — er hält fest, was');
console.log('geschehen ist, und sagt nicht, wie es weitergeht.');
