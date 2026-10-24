#!/usr/bin/env node
/**
 * Die Beispielrechnungen der Systemlisten — gegen den Rechenkern und gegen
 * die Weisung „keine spanne ausgeben".
 *
 *   npm run pruefe-rechnungen
 *
 * Der Anlass und die Regeln stehen im Kopf von `src/beispielrechnung.js`.
 * Kurz: Was ein Mensch einen Assistenten fragt, ist „was kostet ein
 * Kaminzug", und die Systemlisten nannten ihre Frage ohne eine Zahl.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EUR } from '../src/format.js';
import { ladeBaustoffkatalog, preisdateiWeigerung } from '../src/baustoffkatalog.js';
import {
  ZUORDNUNG, beispielrechnung, rechnungssatz, rechnungsbefund,
} from '../src/beispielrechnung.js';
import { WARENKOERBE } from './kampagne.mjs';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

const preisdatei = join(REPO, 'preise', 'baustoff-preise.json');
if (!existsSync(preisdatei)) {
  for (const zeile of preisdateiWeigerung('ohne Preise ist eine Rechnung eine Aufzählung mit Nullen.')) console.error(zeile);
  process.exit(2);
}

const katalog = ladeBaustoffkatalog(
  lies(join(SHOP, 'data', 'katalog-baustoff.json')),
  lies(preisdatei),
  lies(join(SHOP, 'data', 'lieferanten.json')),
);

/*
 * **Die Systemlisten kommen aus dem Verzeichnis, nicht aus einer Liste.** Eine
 * zweite Aufzählung der vier Dateinamen wäre die Stelle, an der eine neue
 * Systemliste unbemerkt ohne Rechnung bleibt.
 */
const listenordner = join(SHOP, 'inhalte', 'system');
const slugs = existsSync(listenordner)
  ? readdirSync(listenordner).filter((d) => d.endsWith('.md')).map((d) => d.replace(/\.md$/, ''))
  : [];

const rechnungen = ZUORDNUNG.map((z) => {
  const r = beispielrechnung(WARENKOERBE[z.gruppe], katalog);
  return r ? { ...r, slug: z.slug, gruppe: z.gruppe } : null;
}).filter(Boolean);

const e = rechnungsbefund({
  slugs,
  gruppen: Object.keys(WARENKOERBE),
  rechnungen,
});

console.log(`\nBeispielrechnungen — ${e.geprueft} Systemlisten mit Referenzwarenkorb`);
console.log(`  Systemlisten im Verzeichnis  ${String(slugs.length).padStart(2)}`);
console.log(`  Referenzwarenkörbe           ${String(Object.keys(WARENKOERBE).length).padStart(2)}`);
console.log(`  Rechnungen, die stehen       ${String(e.stehen).padStart(2)}\n`);

for (const r of rechnungen) {
  if (!r.steht) {
    console.log(`  ⃠ ${r.slug}: ${r.grund}`);
    continue;
  }
  console.log(`  · ${r.slug}`);
  console.log(`      ${rechnungssatz(r, EUR)}`);
}
console.log('');

if (e.sauber) {
  console.log(`Alle ${e.stehen} Rechnungen tragen ihren Warenwert, nennen ihre Positionen im`);
  console.log('Umfang und keine Spanne.');
  console.log('Eine Liste, die ihre Frage nennt und ihre Summe nicht, beantwortet die Frage nicht.');
  process.exit(0);
}

console.log(`${e.probleme.length} Meldung(en):\n`);
for (const p of e.probleme) {
  console.log(`  ✗ [${p.regel}]`);
  console.log(`      ${p.satz}`);
}
console.log('\nBerichtigt wird der Korb oder der Umfang, nicht die Summe: Eine Zahl, die für');
console.log('weniger gilt, als ihr Titel sagt, ist der teuerste Fehler, den eine');
console.log('Preisauskunft machen kann.');
process.exit(1);
