#!/usr/bin/env node
/**
 * Wer eine Grenze behauptet — hat er sie je geprüft?
 *
 *   npm run pruefe-grenzen
 *
 * **Der Anlass: zweimal dasselbe an einem Abend, 9. September 2026.** Der
 * Vermerk über die veröffentlichte PR-Beschreibung erklärte eine Prüfung der
 * Veröffentlichung für unmöglich — das GitHub-Werkzeug beantwortet sie. Zwei
 * Runden später dasselbe beim Repositorypunkt der Bereitschaftsliste, mit
 * demselben Ergebnis: **Es hatte nie jemand versucht.**
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.**
 *
 * Dieser Prüfer misst nicht, ob eine Grenze **stimmt** — das kann er nicht,
 * er läuft ohne Netz. Er misst, ob jemand sie **versucht** hat, wann, und ob
 * ein Beleg danebensteht. Wo es keinen Weg gibt, verlangt er stattdessen
 * einen Grund, und zwar einen ganzen.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  AUSSENGRENZEN, aussengrenzenbefund, VERSUCH_GRENZE_TAGE, aussagenbefund,
} from '../src/aussenlage.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const pfad = process.env.STARTKLAR_AUSSENLAGE || join(SHOP, 'data', 'aussenlage.json');

if (!existsSync(pfad)) {
  console.error('Abbruch: data/aussenlage.json fehlt — ohne den Vermerk ist kein Versuch belegt.');
  console.error('Ein Prüfer, der eine fehlende Datei als „nichts zu beanstanden" liest,');
  console.error('bestätigt genau den Zustand, für den es ihn gibt.');
  process.exit(2);
}

let vermerk;
try {
  vermerk = JSON.parse(readFileSync(pfad, 'utf8'));
} catch (fehler) {
  console.error(`Abbruch: der Vermerk ist nicht lesbar — ${fehler.message}`);
  process.exit(2);
}

const b = aussengrenzenbefund(vermerk, geschaeftstag(), AUSSENGRENZEN);

// Gezählt wird das Angesehene, nicht das Gefundene.
/*
 * **Die zweite Frage, seit dem 10. September 2026.** Bis zum 9. stand in 15
 * Quelldateien derselbe pauschale Satz über den Ausgang, und am 9. war
 * gemessen, dass er zu weit gezogen ist: bauversand.com antwortet nicht,
 * api.github.com schon. Berichtigt wurde die Datei, in der es stand — gezählt
 * waren es 22 solche Sätze.
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 *
 * Deshalb liest dieser Prüfer seither auch den Quelltext: Wer sperrt, nennt die
 * Adresse, zu der ein Versuch mit Datum und Beleg vorliegt.
 */
const quellen = [];
for (const ordner of ['src', 'bin']) {
  for (const name of readdirSync(join(SHOP, ordner))) {
    if (!/\.(js|mjs)$/.test(name)) continue;
    quellen.push({
      pfad: `${ordner}/${name}`,
      text: readFileSync(join(SHOP, ordner, name), 'utf8'),
    });
  }
}
const a = aussagenbefund(quellen, vermerk.versuche);

console.log(`\nAußengrenzen — ${b.grenzen} behauptete Grenzen, ${b.gemessen} mit belegtem Versuch,`);
console.log(`${b.begruendet} ohne Weg und mit Grund; Versuche gelten ${VERSUCH_GRENZE_TAGE} Tage\n`);

console.log(`Sperraussagen im Quelltext: ${a.gefunden}, gemessene Adressen: ${a.adressen}`);

if (b.sauber && a.sauber) {
  for (const g of AUSSENGRENZEN) {
    const v = vermerk.versuche?.[g.id];
    const zeichen = v ? (v.ergebnis === 'moeglich' ? '!' : '·') : '—';
    console.log(`  ${zeichen} ${g.id.padEnd(26)} ${v ? `${v.ergebnis}, ${v.am}` : 'ohne Weg, mit Grund'}`);
  }
  if (b.moeglich) {
    console.log(`\n${b.moeglich} Grenze(n) haben sich als überschreitbar erwiesen — sie sind`);
    console.log('keine Grenze mehr, sondern eine Auskunft. Wer sie weiter als Grenze führt,');
    console.log('behauptet etwas, das er selbst widerlegt hat.');
  }
  console.log('\nJede behauptete Grenze nennt ihren Weg und ihr Ergebnis — oder sagt,');
  console.log('warum es keinen Weg gibt. Nicht versucht ist nicht unmöglich.');
  process.exit(0);
}

for (const m of [...b.meldungen, ...a.meldungen]) {
  console.log(`  ✗ ${m.text}  [${m.regel}]`);
}
console.log(`\n${b.meldungen.length + a.meldungen.length} Meldung(en).`);
process.exit(1);
