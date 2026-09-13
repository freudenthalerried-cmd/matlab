#!/usr/bin/env node
/**
 * Der Auszug für die Buchhaltung — eine Periode, eine Datei, drei Zahlen.
 *
 *   npm run buchhaltung -- --jahr 2026
 *   npm run buchhaltung -- --jahr 2026 --monat 9
 *
 * **Der Anlass, 12. September 2026.** `alsCsv` gibt es seit dem Bau der
 * Ablage am 4. September. Gerufen hat sie außerhalb der Tests niemand, geführt
 * mit dem Grund, es fehle „eine Buchhaltung, die etwas abholt".
 *
 * > **Sie kommt mit der ersten Rechnung — und dann sofort.** Die
 * > Umsatzsteuervoranmeldung ist am 15. des zweitfolgenden Monats fällig
 * > (§ 21 Abs 1 UStG). Ein Werkzeug, das erst danach gebaut wird, kommt zu
 * > spät; dieselbe Lehre wie beim Ablageort, der **vor** dem ersten Datensatz
 * > da sein musste.
 *
 * ## Was gezählt wird
 *
 * Nur, was ein **Umsatz** ist. `ARTEN` sagt seit heute, welche Papierart das
 * ist: die Rechnung und die Gutschrift, die sie aufhebt. Alles andere ist ein
 * Schritt davor oder daneben — am gefährlichsten die **Lieferantenbestellung**,
 * die seit heute früh einen Nettobetrag trägt. Der ist die *Ausgabe* dieses
 * Betriebs, nicht sein Umsatz; ohne die Unterscheidung stünde er mit
 * umgekehrtem Vorzeichen in der Voranmeldung.
 *
 * **Und die Unterscheidung geht seit heute abend mit in die Datei.** Bis dahin
 * stand sie nur auf dem Bildschirm: Die CSV trug beide Beträge in derselben
 * Spalte `netto`, und wer sie zusammenzählte — genau dafür öffnet ein
 * Steuerberater eine CSV — bekam am Probejournal 1.359,22 € statt 759,22 €.
 * Die Spalte `umsatz` sagt jetzt je Zeile `ja` oder `nein`.
 *
 * ## Was hier nicht auf dem Bildschirm steht
 *
 * Die CSV-Zeilen selbst. Sie tragen Vorgangsnummern, Beträge und Betreffs;
 * geschrieben werden sie in eine Datei neben dem Journal — in denselben
 * gesperrten Ordner. Auf dem Bildschirm stehen die Summen, nicht die Belege:
 * dieselbe Regel wie bei `npm run akte` seit heute Vormittag.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { alsCsv, umsatzsumme } from '../src/ablage.js';
import { ausJournal } from '../src/speicher.js';
import { ABLAGEORT } from '../src/ablageort.js';
import { EUR } from '../src/format.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const WURZEL = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);

const wahl = (name, ersatz = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : ersatz;
};

const jahr = Number(wahl('jahr', geschaeftstag().slice(0, 4)));
const monat = wahl('monat') ? Number(wahl('monat')) : null;
if (!Number.isInteger(jahr)) {
  console.error('--jahr erwartet ein Geschäftsjahr, etwa 2026.');
  process.exit(2);
}
if (monat !== null && !(monat >= 1 && monat <= 12)) {
  console.error('--monat erwartet 1 bis 12.');
  process.exit(2);
}

const journal = join(WURZEL, `journal-${jahr}.jsonl`);
if (!existsSync(journal)) {
  console.error(`Kein Journal ${jahr} in ${WURZEL}.`);
  console.error('Ohne abgelegten Geschäftsfall gibt es nichts abzuholen — und eine leere');
  console.error('Datei an den Steuerberater sähe aus wie ein Monat ohne Umsatz.');
  process.exit(2);
}

const ablage = ausJournal(readFileSync(journal, 'utf8'));
const vorsatz = monat === null ? `${jahr}-` : `${jahr}-${String(monat).padStart(2, '0')}-`;
const eintraege = ablage.eintraege.filter((e) => String(e.zeitpunkt).startsWith(vorsatz));

const zeitraum = monat === null ? `${jahr}` : `${jahr}-${String(monat).padStart(2, '0')}`;
const summe = umsatzsumme(eintraege);

console.log(`\nBuchhaltung ${zeitraum} — ${eintraege.length} Eintrag/Einträge in der Periode\n`);
console.log(`  Umsatzbelege (Rechnung, Gutschrift)   ${String(summe.belege).padStart(4)}`);
console.log(`  übrige Papiere ohne Umsatz            ${String(summe.ohneUmsatz).padStart(4)}`);
console.log(`  Bemessungsgrundlage netto      ${EUR(summe.netto).padStart(14)}`);
console.log(`  Umsatzsteuer                   ${EUR(summe.steuer).padStart(14)}`);
console.log(`  Gesamt brutto                  ${EUR(summe.brutto).padStart(14)}`);

if (!eintraege.length) {
  console.log('\nKein Eintrag in dieser Periode — es wird keine Datei geschrieben.');
  console.log('Eine leere CSV sähe aus wie ein geprüfter Monat ohne Umsatz.');
  process.exit(1);
}

const ordner = join(WURZEL, 'buchhaltung');
mkdirSync(ordner, { recursive: true });
const ziel = join(ordner, `buchhaltung-${zeitraum}.csv`);

/*
 * **Was ersetzt wird, wird gesagt — 12. September 2026, abends.**
 *
 * Der Auszug ist kein Beleg: Er wird aus dem Journal gerechnet und darf
 * jederzeit neu entstehen. Überschrieben wird er deshalb absichtlich, anders
 * als die Durchschrift (`flag: 'wx'`). Was fehlte, ist der Satz darüber —
 * ein zweiter Lauf ersetzte eine Datei, die vielleicht längst beim
 * Steuerberater liegt, und sagte nur „Geschrieben".
 */
const vorher = existsSync(ziel)
  ? readFileSync(ziel, 'utf8').split('\n').filter((z) => z.trim()).length - 1
  : null;

writeFileSync(ziel, `${alsCsv({ eintraege })}\n`, 'utf8');

console.log(`\nGeschrieben: ${ziel}`);
if (vorher !== null) {
  console.log(`Ersetzt den vorigen Auszug dieser Periode, der ${vorher} Zeile(n) kannte —`);
  console.log('wer ihn weitergegeben hat, hat jetzt zwei Fassungen derselben Periode.');
}
console.log('Die Zeilen stehen in der Datei und nicht hier: Sie tragen Vorgangsnummern,');
console.log('Beträge und Betreffs, und der Ordner ist derselbe gesperrte wie das Journal.');
console.log('Die Spalte `umsatz` sagt je Zeile, ob sie ein Umsatz ist — ohne sie stünde der');
console.log('Einkaufswert der Lieferantenbestellung in derselben Spalte wie der Umsatz.');
console.log('Die Voranmeldung ist am 15. des zweitfolgenden Monats fällig (§ 21 Abs 1 UStG).');
console.log('`npm run pruefe-ablage` hält diese Datei von jetzt an gegen das Journal.');
