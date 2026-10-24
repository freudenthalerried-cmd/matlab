#!/usr/bin/env node
/**
 * Der Artikelvergleich — gegen den Katalog und gegen seine eigenen Warnungen.
 *
 *   npm run pruefe-vergleich
 *
 * Der Anlass und die drei Warnungen stehen im Kopf von
 * `src/artikelvergleich.js`. Kurz: Verglichen wird, was der Betrieb selbst
 * weiß, und zu jeder Lücke steht ein Satz — denn eine Tafel, die schweigend
 * kürzt, sieht vollständig aus und ist es nicht.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { einheitText, zahlText } from '../src/format.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';
import { ladeBaustoffkatalog, preisdateiWeigerung } from '../src/baustoffkatalog.js';
import {
  MERKMALE, vergleichstafel, vergleichsbefund, GRUND_MINDESTLAENGE,
} from '../src/artikelvergleich.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

const preisdatei = join(REPO, 'preise', 'baustoff-preise.json');
if (!existsSync(preisdatei)) {
  for (const zeile of preisdateiWeigerung('ohne Preise ist die halbe Tafel eine Reihe Gedankenstriche.')) console.error(zeile);
  process.exit(2);
}

const katalog = ladeBaustoffkatalog(
  lies(join(SHOP, 'data', 'katalog-baustoff.json')),
  lies(preisdatei),
  lies(join(SHOP, 'data', 'lieferanten.json')),
);
const umgebung = { einheitText, zahlText, heute: geschaeftstag() };

const e = vergleichsbefund({ artikel: katalog.artikel, umgebung });

console.log(`\nArtikelvergleich — ${e.geprueft} Merkmale über ${e.artikel} Artikel`);
console.log(`  Mindestlänge einer Begründung  ${GRUND_MINDESTLAENGE} Zeichen\n`);

/*
 * **Die Deckung je Merkmal, und zwar als Zahl.** Ein Merkmal, das bei drei von
 * 46 Artikeln einen Wert hat, ist keine Spalte, sondern eine Fußnote — und das
 * sieht man nur, wenn es dasteht. Die Zahlen sind kein Befund: Dass der
 * Katalog das Gewicht für sieben Artikel kennt, ist eine offene Frage an den
 * Lieferanten und nicht ein Fehler dieser Tafel.
 */
for (const m of MERKMALE) {
  const mit = katalog.artikel.filter((a) => m.wert(a, umgebung) !== null).length;
  const anteil = Math.round((mit / katalog.artikel.length) * 100);
  const balken = '█'.repeat(Math.round(anteil / 5)).padEnd(20, '·');
  console.log(`  ${m.titel.padEnd(32)} ${balken} ${String(mit).padStart(2)}/${katalog.artikel.length}`);
}
console.log('');

/*
 * **Und eine Probe, die die Warnungen wirklich fährt.** Zwei Artikel aus
 * verschiedenen Gruppen mit verschiedenen Einheiten — gesucht im Bestand und
 * nicht erfunden. Ohne diesen Lauf stünde oben eine Merkmalstafel und
 * niemand hätte die Warnungen je gesehen.
 */
const einheiten = [...new Set(katalog.artikel.map((a) => a.einheit))];
const probe = [
  katalog.artikel.find((a) => a.einheit === einheiten[0]),
  katalog.artikel.find((a) => a.einheit === einheiten[1] && a.gruppe !== undefined),
].filter(Boolean);
if (probe.length === 2) {
  const t = vergleichstafel(probe, umgebung);
  console.log(`  Probe: ${probe.map((a) => a.sku).join(' gegen ')} — `
    + `${t.warnungen.length} Warnung(en): ${t.warnungen.map((w) => w.art).join(', ') || 'keine'}`);
  console.log('');
}

if (e.sauber) {
  console.log(`Alle ${e.geprueft} Merkmale haben Werte, nennen ihre Lücken und ihren Grund.`);
  console.log('Dass niemand etwas weiß, ist keine Übereinstimmung.');
  process.exit(0);
}

console.log(`${e.probleme.length} Meldung(en):\n`);
for (const p of e.probleme) {
  console.log(`  ✗ ${p.merkmal ?? ''}  [${p.regel}]`);
  console.log(`      ${p.satz}`);
}
console.log('\nBerichtigt wird das Merkmal, nicht die Tafel: Eine Spalte, die bei keinem');
console.log('Artikel etwas sagt, gehört entweder gefüllt oder herausgenommen — und eine');
console.log('Lücke ohne Satz liest sich wie ein Mangel am Artikel statt an unserer Auskunft.');
process.exit(1);
