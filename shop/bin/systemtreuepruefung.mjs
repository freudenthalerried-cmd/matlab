#!/usr/bin/env node
/**
 * Kennt der Warenkorb die Systemtreue, von der die Wissensseite spricht?
 *
 *   npm run pruefe-systemtreue
 *
 * Die Begründung steht in `src/systemtreue.js`. Kurz: Der Bestand sagt an zwei
 * Stellen, dass ein WDVS als Kombination geprüft wird und Mischen die Zulassung
 * verlässt — und führt zugleich Gewebe und Klebe-Spachtelmasse zweier
 * Hersteller. Der Warenkorb rechnete beides anstandslos zusammen.
 *
 * Geprüft wird dreierlei:
 *
 *   1. Jeder Schichtartikel ist einer Schicht **und** einem System zugeordnet.
 *   2. Jeder Artikel ohne Schicht steht mit Grund im Register — und umgekehrt.
 *   3. Der Warenkorb **meldet** einen Systembruch wirklich: gemessen an einem
 *      Korb, der einen enthält, und an einem, der keinen enthält.
 *
 * Der dritte Punkt ist der eigentliche: Eine Regel, die nur im Modul steht und
 * die die Kasse nicht ruft, ist keine. Das ist der Befund vom 6. September über
 * die sieben Sperren ohne grünen Fall.
 */

import { readFileSync, existsSync} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readdirSync } from 'node:fs';

import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { HERSTELLER, markenlistenbefund, ohneKommentarzeilen } from '../src/hersteller.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import {
  GEWERKE, SCHICHTEN, gewerkbefund, llmssystembefund, systembruch, zuordnungsbefund,
} from '../src/systemtreue.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (...p) => JSON.parse(readFileSync(join(...p), 'utf8'));

const katalog = ladeBaustoffkatalog(
  lies(SHOP, 'data', 'katalog-baustoff.json'),
  lies(REPO, 'preise', 'baustoff-preise.json'),
  lies(SHOP, 'data', 'lieferanten.json'),
);

/**
 * Wer in die Prüfung kommt: die WDVS-Gruppe und jeder Artikel, der eine
 * Schicht trifft. Die Gruppe allein genügt nicht — die Baumit-Klebespachtel
 * steht unter „Mörtel", und genau deshalb fällt sie auf keiner Gruppenseite
 * neben ihrem Capatect-Gegenstück auf.
 */
const kandidaten = katalog.artikel.filter(
  (a) => a.gruppe === 'WDVS' || SCHICHTEN.some((s) => s.muster.test(a.bezeichnung)),
);
// Seit die Kaminschichten dazugehören, sind es zwei Gewerke; die Zeile darüber
// zieht beide ein, weil die Schichtmuster nicht nach Gruppe fragen.

const befund = zuordnungsbefund(kandidaten);
// **Und die Gewerke daneben — 8. September, abends.** Der Kaminzug behauptet
// dieselbe Regel schärfer als das WDVS und lässt sich nicht messen: Die
// Systemmarke steht in vier Schreibweisen, und der Dünnbettmörtel trägt gar
// keine. Das steht als Eintrag mit Grund und mit dem Artikel, an dem es
// scheitert — verschwindet der, ist die Frage neu zu stellen.
const gewerke = gewerkbefund(katalog.artikel);
// **Und die eine Liste — 8. September, abends.** Der Bestand führte drei
// Markenlisten mit verschiedenem Umfang; vier Artikel wurden als Marke
// beworben und sagten auf ihrer Seite, der Hersteller sei unbekannt.
const quellen = [];
for (const ordner of ['src', 'bin']) {
  for (const datei of readdirSync(join(SHOP, ordner))) {
    if (!/\.(js|mjs)$/.test(datei) || datei === 'hersteller.js') continue;
    quellen.push({
      datei: `${ordner}/${datei}`,
      quelle: readFileSync(join(SHOP, ordner, datei), 'utf8'),
    });
  }
}
const listen = markenlistenbefund(quellen, Object.keys(HERSTELLER), ohneKommentarzeilen);

const meldungen = [...befund.meldungen, ...gewerke.meldungen, ...listen.meldungen];

// **Der grüne und der rote Fall, beide gemessen.** Ein Korb aus zwei Systemen
// muss melden; einer aus einem darf nicht.
const sku = (s) => kandidaten.find((a) => a.sku === s);
const gemischt = ['POS-11283', 'POS-52058'].map(sku).filter(Boolean);
const rein = ['POS-11283', 'POS-50509'].map(sku).filter(Boolean);

if (gemischt.length === 2 && !systembruch(gemischt)) {
  meldungen.push({
    regel: 'bruch-nicht-erkannt',
    text: 'Ein Korb aus Capatect-Klebespachtel und Baumit-Gewebe gilt als systemtreu — '
      + 'das ist genau der Fall, den die eigene Wissensseite als Beispiel nennt',
  });
}
if (rein.length === 2 && systembruch(rein)) {
  meldungen.push({
    regel: 'bruch-ohne-bruch',
    text: 'Ein Korb aus zwei Capatect-Positionen gilt als gemischt — eine Warnung, die '
      + 'bei jedem Korb angeht, liest nach dem dritten Mal niemand mehr',
  });
}

// Und die Stelle, die handelt: Trägt die Kasse den Satz wirklich hinaus?
const korb = kundenWarenkorb(
  gemischt.map((a) => ({ sku: a.sku, menge: 1 })),
  { artikel: katalog.artikel, lieferanten: [...katalog.lieferantenById.values()] },
);
if (gemischt.length === 2 && !(korb.offen ?? []).some((o) => /Systemtreue/.test(o))) {
  meldungen.push({
    regel: 'kasse-schweigt',
    text: 'Der Warenkorb rechnet zwei Systeme zusammen und sagt dem Kunden nichts davon — '
      + 'eine Regel, die nur im Modul steht, ist keine',
  });
}

/*
 * **Und was `llms.txt` daraus macht — 9. September 2026.** Die Kasse warnt
 * seit gestern; die Datei, aus der ein Assistent eine Bestellliste
 * zusammenstellt, wusste nichts davon. Gelesen wird sie nur, wenn sie da und
 * auf dem Stand der Quelle ist — sonst misst die Prüfung die Vergangenheit.
 *
 * Der Block steht **vor** der Auswertung, nicht hinter `process.exit(0)`.
 * Dreimal in der Nacht zuvor lag eine neue Regel hinter einem Ausgang oder in
 * einem Zweig, der nie läuft; seither wird zuerst nachgesehen, wo der Prüfer
 * endet.
 */
const llmsDatei = join(SHOP, 'ausgabe', 'site', 'llms.txt');
if (existsSync(llmsDatei)) {
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
  meldungen.push(...llmssystembefund(readFileSync(llmsDatei, 'utf8'), katalog.artikel).meldungen);
}
const messbar = GEWERKE.filter((g) => g.messbar).length;
console.log(`Systemtreue — ${befund.geprueft} Artikel mit Systembindung, `
  + `${SCHICHTEN.length} geprüfte Schichten`);
console.log(`${GEWERKE.length} Gewerke mit Systemtreue in ihrer Wissensseite, `
  + `${messbar} davon am Katalog messbar\n`);
for (const g of GEWERKE.filter((x) => !x.messbar)) {
  console.log(`  ⃠ ${g.gruppe}: nicht bestimmbar — ${g.blockiert} trägt keine Systemmarke.`);
  console.log('      Auflösbar mit dem Herstellerfeld aus der Artikelliste des Lieferanten.');
}
if (messbar < GEWERKE.length) console.log('');

if (meldungen.length === 0) {
  console.log('Keine Meldung. Jede Schicht kennt ihr System, jede Ausnahme ihren Grund,');
  console.log('und ein gemischter Warenkorb sagt es dem Kunden.');
  process.exit(0);
}

for (const m of meldungen) {
  console.log(`  ✗ ${m.text}`);
  console.log(`      [${m.regel}]`);
}
console.log(`\n${meldungen.length} Meldung(en).`);
process.exit(1);
