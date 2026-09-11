#!/usr/bin/env node
/**
 * Erwartet der Bestand den Tag, an dem die Angaben kommen?
 *
 *   npm run pruefe-tagx
 *
 * **Der Anlass, 11. September 2026.** Jeder Prüfer dieses Bestandes misst den
 * Zustand von heute: ein Impressum mit vier Lücken, eine Entität ohne UID,
 * einen ausgeschalteten Bestellweg. Alle sind grün, und alle prüfen denselben
 * halbfertigen Stand.
 *
 * > **Jeder Prüfer misst den Zustand von heute. Der Tag, auf den alles
 * > zuläuft, ist ungeprüft.**
 *
 * Dieses Werkzeug baut den Shop mit einer **vollständigen** Betreiberdatei in
 * einen Wegwerfordner und sieht nach, ob die vier Angaben dort ankommen, wo
 * sie hingehören: im Impressum, in jedem Organisationsblock, im mitgelieferten
 * Bestellweg und im Hinweis, der dann schrumpfen muss.
 *
 * ## Zwei Dinge, die es ausdrücklich nicht tut
 *
 * Es schreibt **nichts** in den Bestand: Die Probewerte leben in einem Ordner,
 * den das Betriebssystem beim Beenden wegräumt, und `data/betreiber.json`
 * bleibt unberührt. Eine erfundene UID im echten Impressum wäre genau der
 * Fehler, gegen den dieser ganze Bestand gebaut ist.
 *
 * Und es prüft **nicht** die Ausgabe, die ausgeliefert wird — dafür gibt es
 * die anderen Prüfer. Es prüft einen Bau, den es heute noch nicht geben darf.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OFFENE_ANGABEN, betreiberAmTagX, tagxbefund } from '../src/tagx.js';
import { wegwerfordner } from '../src/wegwerf.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const heute = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
const ordner = wegwerfordner('tagx-');
const betreiberdatei = join(ordner, 'betreiber.json');
writeFileSync(betreiberdatei, JSON.stringify(betreiberAmTagX(heute), null, 2));

const ausgabe = join(ordner, 'ausgabe');
const bau = spawnSync('npm', ['run', '--silent', 'website'], {
  cwd: SHOP,
  encoding: 'utf8',
  env: { ...process.env, STARTKLAR_BETREIBER: betreiberdatei, WEBSITE_AUSGABE: ausgabe },
});
if (bau.status !== 0) {
  console.error('Abbruch: Der Bau mit vollständiger Betreiberdatei scheitert.');
  console.error(`${bau.stdout ?? ''}${bau.stderr ?? ''}`.trim().split('\n').slice(-6).join('\n'));
  process.exit(1);
}

const site = join(ausgabe, 'site');
if (!existsSync(site)) {
  console.error('Abbruch: Der Bau hat keinen Auslieferungsordner hinterlassen.');
  process.exit(2);
}

/** Jeden Organisationsblock aus den gebauten Seiten, gleich wie tief er liegt. */
function entitaeten(ordnerpfad) {
  const gefunden = [];
  const durch = (d) => {
    if (Array.isArray(d)) { d.forEach(durch); return; }
    if (!d || typeof d !== 'object') return;
    if (['Organization', 'LocalBusiness', 'Store'].includes(d['@type'])) gefunden.push(d);
    Object.values(d).forEach(durch);
  };
  const lauf = (o) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      const pfad = join(o, e.name);
      if (e.isDirectory()) { lauf(pfad); continue; }
      if (!e.name.endsWith('.html')) continue;
      const text = readFileSync(pfad, 'utf8');
      for (const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        try {
          durch(JSON.parse(m[1]));
        } catch {
          console.error(`Abbruch: unlesbare Auszeichnung in ${e.name}.`);
          process.exit(1);
        }
      }
    }
  };
  lauf(ordnerpfad);
  return gefunden;
}

const artikel = readdirSync(join(site, 'artikel')).filter((n) => n.endsWith('.html'));
if (!artikel.length) {
  console.error('Abbruch: keine Artikelseite im Bau des Tages X.');
  process.exit(2);
}
const seite = readFileSync(join(site, 'artikel', artikel[0]), 'utf8');
const hinweis = (/Vorschau ohne Bestellmöglichkeit[^<]*/.exec(seite.replace(/<[^>]+>/g, ' '))
  ?? [''])[0];

const b = tagxbefund({
  impressum: readFileSync(join(site, 'rechtliches', 'impressum.html'), 'utf8'),
  entitaeten: entitaeten(site),
  dateien: readdirSync(site),
  hinweis,
});

console.log(`Tag X — ${b.angaben} offene Angaben eingesetzt, `
  + `${b.entitaeten} Organisationsblöcke gebaut\n`);
for (const a of OFFENE_ANGABEN) {
  console.log(`  · ${a.feld.padEnd(16)} → ${a.sichtbarIn.join(', ')}`);
}
console.log('');

if (b.meldungen.length) {
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log(`\n${b.meldungen.length} Meldung(en).`);
  console.log('Was der Auftraggeber liefert, muss an dem Tag ankommen, an dem er es liefert —');
  console.log('und nicht erst, wenn jemand daran denkt.');
  process.exit(1);
}

console.log(`Alle ${b.angaben} Angaben kommen an: im Impressum, in jedem Organisationsblock,`);
console.log('im mitgelieferten Bestellweg. Der Hinweis nennt keine von ihnen mehr.');
console.log(`Gebaut wurde nach ${ordner} — der Bestand ist unberührt.`);
