#!/usr/bin/env node
/**
 * Hält die technischen Zusagen der Datenschutzseite gegen den gebauten Shop.
 *
 *   npm run pruefe-datenschutz
 *
 * **Der Anlass, 2. September 2026.** Auf `rechtliches/datenschutz.html` stehen
 * sechs Sätze über den Code: keine Cookies, kein Zählpixel, keine fremde
 * Einbindung, der Warenkorb bleibt im Browser. Geprüft war bisher, dass die
 * Sätze **dastehen** — `test/website.test.js` sucht die Zeichenkette „Keine
 * Cookies" auf der Seite. Ob sie stimmt, hat niemand gemessen.
 *
 * > **Eine Zusage auf einer Rechtsseite, die niemand nachmisst, ist eine
 * > Behauptung mit Haftung.**
 *
 * Ein einziges `document.cookie`, ein eingebundenes Zählpixel, ein `fetch` an
 * einen fremden Server — und der Satz auf der Rechtsseite ist unwahr, ohne
 * dass ein Prüfer rot wird. Die Zusage über die fremden Einbindungen war die
 * einzige mit einer Messung dahinter; sie steht seit dem 29. August in
 * `website.test.js`, weil an dem Tag drei Schriften von einem fremden Server
 * kamen.
 *
 * Geprüft wird der **gebaute** Bestand: die HTML-Dateien unter `ausgabe/site`
 * und das Bündel, das der Browser ausführt. Nicht der Quelltext — was der
 * Besucher bekommt, entsteht aus dem Bau und nicht aus `src/`.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { WEBSITE_VERARBEITUNG } from '../src/rechtstexte.js';
import { KORBSCHLUESSEL } from '../src/shopkern.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

/**
 * **Vorhanden ist nicht dasselbe wie aktuell.** Ergänzt am 4. September: Die
 * Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, stand seit dem
 * 29. August in zwei von neun Werkzeugen, die eines lesen. Die anderen sieben
 * fragten nur, ob es da ist. Das Register dazu steht in
 * `src/erzeugnisstand.js`; der Text ist dort **eine** Fassung für alle.
 */
{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}


if (!existsSync(SITE)) {
  console.error('ausgabe/site fehlt — erst `npm run website`.');
  console.error('Ohne gebaute Seiten ist jede Zusage ungemessen, und der Lauf sähe grün aus.');
  process.exit(2);
}

const dateien = [];
const sammle = (ordner) => {
  for (const e of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, e.name);
    if (e.isDirectory()) sammle(pfad);
    else if (/\.(html|js|css)$/.test(e.name)) dateien.push(pfad);
  }
};
sammle(SITE);

const inhalt = new Map(dateien.map((d) => [relative(SITE, d), readFileSync(d, 'utf8')]));
const htmlDateien = [...inhalt].filter(([n]) => n.endsWith('.html'));

/** Ein Befund je Datei, in der ein Muster trifft. */
function suche(muster, nur = null) {
  const treffer = [];
  for (const [name, text] of inhalt) {
    if (nur && !nur(name)) continue;
    const m = text.match(muster);
    if (m) treffer.push(`${name}: ${m[0].slice(0, 60)}`);
  }
  return treffer;
}

/**
 * Die Messungen, eine je Zusage.
 *
 * Jede sagt, **was** sie liest — damit ein grüner Lauf nicht für mehr
 * genommen wird, als er ist.
 */
const MESSUNGEN = {
  'keine-cookies': {
    liest: 'jedes HTML, JS und CSS unter ausgabe/site nach document.cookie und Set-Cookie',
    pruefe: () => suche(/document\s*\.\s*cookie|Set-Cookie|<meta[^>]+http-equiv=["']?set-cookie/i),
  },
  'warenkorb-im-browser': {
    liest: 'den Speicherschlüssel und jeden Weg, auf dem etwas den Browser verlassen könnte',
    pruefe: () => {
      const befunde = [];
      // Der genannte Schlüssel muss der benutzte sein.
      const stehtImBau = [...inhalt.values()].some((t) => t.includes(KORBSCHLUESSEL));
      if (!stehtImBau) befunde.push(`der Schlüssel ${KORBSCHLUESSEL} kommt im Bau nicht vor`);
      // Fremde Schlüssel: alles, was gespeichert wird und nicht der Korb ist.
      for (const [name, text] of inhalt) {
        for (const m of text.matchAll(/(?:local|session)Storage\s*\.\s*setItem\(\s*(['"`])(.*?)\1/g)) {
          if (!m[2].startsWith(KORBSCHLUESSEL.split('-v')[0])) befunde.push(`${name}: speichert „${m[2]}"`);
        }
      }
      // „wird nicht an den Server übertragen" — dann darf nichts senden.
      befunde.push(...suche(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|new\s+EventSource/));
      return befunde;
    },
  },
  'keine-analyse': {
    liest: 'die gebauten Dateien nach den Namen der verbreiteten Zähl- und Werbewerkzeuge',
    pruefe: () => suche(
      /gtag\s*\(|googletagmanager|google-analytics|\bga\s*\(\s*['"]|matomo|piwik|_paq\b|plausible\.io|fathom|hotjar|clarity\.ms|connect\.facebook|fbq\s*\(|doubleclick|\btrack(?:ing)?Pixel\b/i,
    ),
  },
  'keine-fremden-einbindungen': {
    liest: 'jede Einbindung, die der Browser von sich aus holt — nicht die Verweise',
    pruefe: () => {
      const muster = [
        /<link\b[^>]*\brel=["']?(?:stylesheet|preconnect|preload|dns-prefetch)[^>]*\bhref=["']https?:\/\/[^"'/]+/gi,
        /<script\b[^>]*\bsrc=["']https?:\/\/[^"'/]+/gi,
        /<(?:img|iframe|video|audio|source|embed)\b[^>]*\bsrc=["']https?:\/\/[^"'/]+/gi,
        /@import\s+(?:url\()?["']https?:\/\/[^"'/)]+/gi,
        /url\(\s*["']?https?:\/\/[^"')]+/gi,
      ];
      return muster.flatMap((m) => suche(m));
    },
  },
  'verweise-nicht-eingebettet': {
    liest: 'die Seiten nach eingebetteten Rahmen und nach Verweisen auf Herstellerseiten',
    pruefe: () => {
      const befunde = suche(/<(?:iframe|embed|object)\b/i, (n) => n.endsWith('.html'));
      // Und die Gegenrichtung: Gibt es die Verweise überhaupt? Eine Zusage
      // über etwas, das es nicht gibt, ist keine Zusage.
      const mitVerweis = htmlDateien.filter(([, t]) => /<a\b[^>]+href=["']https?:\/\//i.test(t)).length;
      if (mitVerweis === 0) befunde.push('keine einzige Seite verweist nach außen — die Zusage geht ins Leere');
      return befunde;
    },
  },
};

const meldungen = [];
let gemessen = 0;

for (const zusage of WEBSITE_VERARBEITUNG) {
  if (!zusage.id) {
    meldungen.push(`Eine Zusage ohne Kennung: „${zusage.was}" — sie kann keiner Messung zugeordnet werden`);
    continue;
  }
  if (zusage.pruefbar === false) {
    if (!zusage.warumNicht || zusage.warumNicht.length < 40) {
      meldungen.push(`${zusage.id}: nicht prüfbar und ohne belastbaren Grund`);
    }
    continue;
  }
  const messung = MESSUNGEN[zusage.id];
  if (!messung) {
    meldungen.push(`${zusage.id}: als prüfbar geführt, aber es gibt keine Messung dazu`);
    continue;
  }
  gemessen += 1;
  for (const treffer of messung.pruefe()) {
    meldungen.push(`${zusage.id} — „${zusage.was}" stimmt nicht: ${treffer}`);
  }
}

console.log(`Datenschutzzusagen — ${WEBSITE_VERARBEITUNG.length} auf der Seite, ${gemessen} gemessen`);
console.log(`Gelesen: ${dateien.length} gebaute Dateien (${htmlDateien.length} Seiten).\n`);
for (const zusage of WEBSITE_VERARBEITUNG) {
  const messung = MESSUNGEN[zusage.id];
  console.log(`  ${zusage.was}`);
  console.log(`      ${messung ? messung.liest : `nicht messbar — ${zusage.warumNicht}`}`);
}

if (meldungen.length === 0) {
  console.log('\nKeine Meldung. Jede messbare Zusage der Datenschutzseite hält.');
  console.log('Was hier nicht steht, ist damit nicht geprüft — der Wortlaut der Erklärung');
  console.log('kommt vom Rechtstexteanbieter, gemessen ist nur der technische Befund.');
  process.exit(0);
}

console.log(`\n${meldungen.length} Meldung(en):\n`);
for (const m of meldungen) console.log(`  ✗ ${m}`);
console.log('\nEine Zusage auf einer Rechtsseite, die nicht stimmt, ist keine Kleinigkeit.');
process.exit(1);
