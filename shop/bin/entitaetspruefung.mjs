#!/usr/bin/env node
/**
 * Sagt die ausgezeichnete Entität überall dasselbe — und das Belegte?
 *
 *   npm run pruefe-entitaet
 *
 * **Der Anlass, 11. September 2026.** `ki-sichtbarkeit-konzept.md` nennt drei
 * Dinge, aus denen bei KI-Assistenten Vertrauen entsteht. Das erste ist die
 * **Konsistenz der Entität** — „der billigste und meistvernachlässigte Hebel".
 *
 * Gemessen an diesem Tag: **71 Organisationsblöcke** im Auslieferungsordner,
 * davon **70 nur mit `name` und `legalName`**. Straße, Postleitzahl und
 * Firmenbuchnummer standen belegt in `data/betreiber.json` und in keiner
 * einzigen Auszeichnung.
 *
 * > **Der billigste Hebel war nicht gezogen — und die Angaben lagen die ganze
 * > Zeit in der Datei daneben.**
 *
 * Dieses Werkzeug liest jeden Organisationsblock aus den gebauten Seiten und
 * hält ihn gegen die Betreiberdatei: Jede belegte Angabe muss drin stehen,
 * keine unbelegte darf drin stehen, und alle Blöcke müssen dasselbe sagen.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { entitaetsbefund } from '../src/maschinenlesbar.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

if (!existsSync(SITE)) {
  console.error('Abbruch: ausgabe/site fehlt — zuerst npm run website.');
  process.exit(2);
}
{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    console.error(abbruchtext(stand));
    process.exit(2);
  }
}

/** Alle .html unter ausgabe/site, eine Ebene tief wie der Bau sie legt. */
function seiten(ordner) {
  const gefunden = [];
  for (const e of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, e.name);
    if (e.isDirectory()) gefunden.push(...seiten(pfad));
    else if (e.name.endsWith('.html')) gefunden.push(pfad);
  }
  return gefunden;
}

/*
 * **Gelesen wird, was ausgeliefert wird.** Die Blöcke aus dem Bauwerkzeug zu
 * nehmen hieße, die Absicht zu prüfen statt die Seite — und genau daran ist
 * am 3. September der Markenwechsel hängengeblieben: Die Startseite trug den
 * neuen Namen, achtzig Seiten den alten.
 */
const bloecke = [];
let unlesbar = 0;
for (const pfad of seiten(SITE)) {
  const text = readFileSync(pfad, 'utf8');
  for (const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let daten;
    try {
      daten = JSON.parse(m[1]);
    } catch {
      unlesbar += 1;
      continue;
    }
    const durch = (d) => {
      if (Array.isArray(d)) { d.forEach(durch); return; }
      if (!d || typeof d !== 'object') return;
      if (['Organization', 'LocalBusiness', 'Store'].includes(d['@type'])) bloecke.push(d);
      Object.values(d).forEach(durch);
    };
    durch(daten);
  }
}

/*
 * **Ein unlesbarer Block ist kein fehlender.** Wer ihn überspringt, misst die
 * Seiten, die sich einlesen ließen — und eine kaputte Auszeichnung liest gar
 * kein Assistent.
 */
if (unlesbar) {
  console.error(`Abbruch: ${unlesbar} Auszeichnungsblock/Blöcke lassen sich nicht einlesen.`);
  process.exit(1);
}

const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
const b = entitaetsbefund(bloecke, betreiber);

console.log(`Entität — ${b.bloecke} Organisationsblöcke in den gebauten Seiten, `
  + `${b.fassungen ?? 0} Fassung(en)\n`);

if (b.meldungen.length) {
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log(`\n${b.meldungen.length} Meldung(en).`);
  console.log('Firmenname, Rechtsform, Adresse, UID und Firmenbuchnummer müssen überall');
  console.log('identisch sein — ein Assistent, der drei Schreibweisen derselben Firma');
  console.log('findet, hat drei schwache Entitäten statt einer starken.');
  process.exit(1);
}

console.log('Jeder Block sagt dasselbe, und er sagt genau das Belegte.');
console.log('Was in der Betreiberdatei leer ist, steht nirgends gefüllt.');
