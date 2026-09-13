#!/usr/bin/env node
/**
 * Eine Mutation anwenden, prüfen **dass sie angekommen ist**, testen, zurücksetzen.
 *
 *   node bin/gegenprobe.mjs <datei> <suchdatei> <ersatzdatei> -- <befehl…>
 *
 * **Der Anlass, 31. August 2026.** An einem einzigen Tag sind mir drei
 * Gegenproben nicht angekommen: einmal zerlegte eine Schleife die Felder an
 * `|`, und die beiden Bedingungen mit `||` zerfielen; zweimal schrieb eine
 * Ersetzung `\n` als echten Zeilenumbruch statt als die zwei Zeichen im
 * Quelltext. Jedes Mal blieb die Datei unverändert, der Testlauf lief über den
 * unveränderten Code — und meldete **Grün**.
 *
 * > **Eine Gegenprobe, die nicht ankommt, sieht aus wie eine bestandene.**
 * > Sie ist die tückischste Sorte Fehlmeldung, die dieses Vorhaben kennt:
 * > schlimmer als ein roter Test, weil sie Vertrauen erzeugt, wo nichts
 * > geprüft wurde. Dieselbe Familie wie der Prüfer, der auf eine leere Seite
 * > zeigt und Grün meldet.
 *
 * Deshalb ist die erste Zusicherung dieses Werkzeugs nicht der Test, sondern
 * **dass die Datei sich geändert hat**. Ändert sie sich nicht, bricht es ab,
 * bevor irgendetwas läuft.
 *
 * Such- und Ersatztext kommen aus **Dateien**, nicht aus Befehlszeilen-
 * argumenten. Genau daran sind die drei gescheitert: Jede Schicht — Shell,
 * Python, JavaScript — hat ihre eigene Maskierung, und drei Schichten
 * übereinander sind nicht zu überblicken. Eine Datei hat keine.
 *
 * Die Datei wird **immer** zurückgesetzt, auch wenn der Test abstürzt oder
 * das Werkzeug unterbrochen wird.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const trenner = args.indexOf('--');
if (trenner < 3) {
  console.error('Aufruf: node bin/gegenprobe.mjs <datei> <suchdatei> <ersatzdatei> -- <befehl…>');
  console.error('\nSuch- und Ersatztext stehen in Dateien, damit keine Maskierung dazwischenkommt.');
  process.exit(2);
}

const [ziel, suchdatei, ersatzdatei] = args.slice(0, 3);
const befehl = args.slice(trenner + 1);
if (befehl.length === 0) {
  console.error('Abbruch: kein Befehl nach `--`.');
  process.exit(2);
}

const original = readFileSync(ziel, 'utf8');
const suche = readFileSync(suchdatei, 'utf8').replace(/\n$/, '');
const ersatz = readFileSync(ersatzdatei, 'utf8').replace(/\n$/, '');

// **Vor allem anderen: Kommt die Mutation an?**
const treffer = original.split(suche).length - 1;
if (treffer === 0) {
  console.error(`Abbruch: Der Suchtext kommt in ${ziel} nicht vor.`);
  console.error('Die Mutation wäre nicht angekommen, und der Testlauf hätte den');
  console.error('unveränderten Code geprüft — also Grün gemeldet, ohne etwas zu prüfen.');
  console.error(`\nGesucht wurde (${suche.length} Zeichen):\n${suche}`);
  process.exit(2);
}
if (treffer > 1) {
  console.error(`Abbruch: Der Suchtext kommt in ${ziel} ${treffer}-mal vor.`);
  console.error('Eine Gegenprobe, die mehrere Stellen zugleich ändert, sagt nicht,');
  console.error('welche davon der Test bemerkt hat.');
  process.exit(2);
}

const mutiert = original.replace(suche, ersatz);
if (mutiert === original) {
  console.error(`Abbruch: Such- und Ersatztext sind gleich — die Datei bliebe unverändert.`);
  process.exit(2);
}

let ausgang = 0;
const zuruecksetzen = () => writeFileSync(ziel, original);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { zuruecksetzen(); process.exit(130); });
}

try {
  writeFileSync(ziel, mutiert);
  console.log(`Mutation angewandt: ${ziel} (${original.length} → ${mutiert.length} Zeichen)\n`);

  const lauf = spawnSync(befehl[0], befehl.slice(1), { encoding: 'utf8', stdio: 'inherit' });
  ausgang = lauf.status ?? 1;
} finally {
  zuruecksetzen();
}

const wiederhergestellt = readFileSync(ziel, 'utf8') === original;
console.log(`\n${wiederhergestellt ? '✓' : '✗'} ${ziel} ${wiederhergestellt ? 'wiederhergestellt' : 'NICHT wiederhergestellt — von Hand prüfen!'}`);
if (!wiederhergestellt) process.exit(3);

// **Der Ausgangscode ist umgekehrt.** Eine Gegenprobe ist bestanden, wenn der
// Test die Mutation **bemerkt** — also fehlschlägt. Läuft er durch, prüft er
// die mutierte Stelle nicht.
if (ausgang === 0) {
  console.log('\n✗ Gegenprobe NICHT bestanden: Der Test lief durch, obwohl der Code verändert war.');
  console.log('  Die Stelle ist ungeprüft.');
  process.exit(1);
}
console.log(`\n✓ Gegenprobe bestanden: Der Test hat die Mutation bemerkt (Ausgangscode ${ausgang}).`);
