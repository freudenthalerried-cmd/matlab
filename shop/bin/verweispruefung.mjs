#!/usr/bin/env node
/**
 * Hängen die gebauten Seiten zusammen?
 *
 *   npm run pruefe-verweise
 *
 * **Der Anlass, 8. September 2026.** Von Hand gemessen: 2.650 interne
 * Verweise, keiner ins Leere; zwei Seiten ohne eingehenden Verweis, beide zu
 * Recht; 82 verschiedene Titel auf 82 Seiten. Alles grün — und niemand
 * wiederholt es.
 *
 * > **Ein Befund, den kein Werkzeug wiederholt, gilt für den Tag, an dem er
 * > erhoben wurde.**
 *
 * Ein toter Verweis kostet hier mehr als anderswo: Drei der Seiten sind
 * Endziele bezahlter Anzeigen zu 4,19 € bis 8,22 € je Klick.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import { verweisbefund } from '../src/verweise.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}

if (!existsSync(SITE)) {
  console.error('Abbruch: ausgabe/site liegt nicht vor — erst `npm run website`.');
  console.error('Eine Verweisprüfung ohne Seiten prüft nichts und meldete Grün.');
  process.exit(2);
}

const seiten = new Map();
const gehe = (ordner) => {
  for (const e of readdirSync(ordner, { withFileTypes: true })) {
    const voll = join(ordner, e.name);
    if (e.isDirectory()) { gehe(voll); continue; }
    if (statSync(voll).isFile() && e.name.endsWith('.html')) {
      seiten.set(relative(SITE, voll).split('\\').join('/'), readFileSync(voll, 'utf8'));
    }
  }
};
gehe(SITE);

const b = verweisbefund({
  seiten,
  // Verweise ab der Wurzel („/index.html") zeigen auf den Ausgabeordner,
  // relative auf den Ordner der Seite. Beides ist im Bau in Gebrauch.
  aufloesen: (von, ziel) => (ziel.startsWith('/')
    ? ziel.slice(1)
    : relative(SITE, resolve(dirname(join(SITE, von)), ziel)).split('\\').join('/')),
  gibtEs: (pfad) => existsSync(join(SITE, pfad)),
});

console.log(`\nVerweise — ${b.seiten} gebaute Seiten, ${b.verweise} interne Verweise\n`);
console.log(`  ${b.ohneEingang} Seiten ohne eingehenden Verweis, beide mit Grund`);
console.log('  Titel, Beschreibung und Überschrift je Seite verschieden\n');

if (b.sauber) {
  console.log('Kein Verweis geht ins Leere, und keine Seite hängt ohne Grund frei.');
  console.log('Drei dieser Seiten sind Endziele bezahlter Anzeigen: Ein toter Verweis');
  console.log('dort ist ein bezahlter Klick auf eine Fehlerseite.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
