#!/usr/bin/env node
/**
 * Die Einkaufspreise aus dem gebauten Shop zurückrechnen.
 *
 *   npm run preise-wiederherstellen
 *
 * **Der Anlass, 8. September 2026.** Die Arbeitsumgebung wurde neu
 * aufgesetzt, und `preise/baustoff-preise.json` war weg. Die Datei stand seit
 * jeher in `.gitignore` — zu Recht, sie trägt die Einkaufskonditionen des
 * Lieferanten, und das Verzeichnis ist öffentlich. Nur hieß das eben auch:
 *
 * > **Die Zahl, auf der alles ruht, lag in genau einer Kopie — in einem
 * > Behälter, der jederzeit neu aufgesetzt wird.**
 *
 * Ohne sie baut `npm run website` nicht, und ohne Bau steht der halbe
 * Prüfstand still.
 *
 * **Was dieses Werkzeug kann.** `npm run pruefe-geheimnis` misst seit dem
 * 30. August, dass aus den **veröffentlichten** Verkaufspreisen und der
 * dokumentierten Zielmarge die Einkaufspreise auf den Cent zurückzurechnen
 * sind — als Warnung gemeint, dass das Verzeichnis privat gehört. Heute ist
 * dieselbe Rechnung der Rettungsweg: `ekNetto = vkNetto × (1 − Marge)`.
 *
 * **Was es nicht kann.** Wo der Verkaufspreis am **Listendeckel** hängt, ist
 * die Rechnung nicht umkehrbar: Jeder Einkauf oberhalb einer Schwelle ergibt
 * denselben gedeckelten Verkaufspreis. Diese Artikel bleiben leer und werden
 * beim Namen genannt.
 *
 * **Und was es nicht behauptet.** Jeder zurückgerechnete Preis trägt
 * `ekQuelle: 'rekonstruiert'`. Der Beleg dafür ist die Lieferantenrechnung,
 * und die liegt nicht mehr hier — ein Wert, der stimmt, ist noch kein Wert,
 * der belegt ist. Der Shop führt solche Artikel folgerichtig mit
 * `ekIstPlatzhalter`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ZIELMARGE } from '../src/baustoffkatalog.js';
import { rekonstruiereEinkauf } from '../src/geheimnis.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const SKRIPT = join(SHOP, 'ausgabe', 'site', 'shop.js');
const ZIEL = join(REPO, 'preise', 'baustoff-preise.json');

if (existsSync(ZIEL) && !process.argv.includes('--ueberschreiben')) {
  console.error(`Abbruch: ${ZIEL} liegt bereits vor.`);
  console.error('Eine belegte Preisdatei durch eine zurückgerechnete zu ersetzen, wäre ein');
  console.error('Rückschritt: „bestaetigt" würde zu „rekonstruiert". Mit --ueberschreiben,');
  console.error('wenn das wirklich gemeint ist.');
  process.exit(2);
}

if (!existsSync(SKRIPT)) {
  console.error(`Abbruch: ${SKRIPT} fehlt — ohne den gebauten Shop gibt es nichts zurückzurechnen.`);
  console.error('Das ist der Fall, in dem nur die Lieferantenrechnungen helfen.');
  process.exit(2);
}

const treffer = readFileSync(SKRIPT, 'utf8').match(/window\.__SHOP__=(\{[\s\S]*?\});\n/);
if (!treffer) {
  console.error('Abbruch: in shop.js steht kein `window.__SHOP__` — die Ausgabe hat ein anderes Format.');
  process.exit(2);
}

const { artikel = [] } = JSON.parse(treffer[1]);
const preise = {};
const gedeckelt = [];
const ohneVk = [];

for (const a of artikel) {
  if (typeof a.vkNetto !== 'number') { ohneVk.push(a.sku); continue; }
  if (a.amListendeckel) { gedeckelt.push(a.sku); continue; }
  preise[a.sku] = {
    ekNetto: rekonstruiereEinkauf(a.vkNetto, ZIELMARGE),
    ekQuelle: 'rekonstruiert',
    ...(typeof a.uvpNetto === 'number' ? { uvpNetto: a.uvpNetto } : {}),
  };
}

const datei = {
  _hinweis: 'ZURUECKGERECHNET, NICHT BELEGT. Am 08.09.2026 mit npm run preise-wiederherstellen '
    + 'aus den veroeffentlichten Verkaufspreisen und der Zielmarge erzeugt, nachdem die '
    + 'urspruengliche Datei mit dem Neuaufsetzen der Arbeitsumgebung verloren ging. Die Zahlen '
    + 'stimmen auf den Cent, der Beleg dafuer ist die Lieferantenrechnung — und die liegt nicht '
    + 'hier. Jeder Eintrag traegt deshalb ekQuelle: rekonstruiert, und der Shop fuehrt ihn als '
    + 'Platzhalter. Ersetzen, sobald die Rechnungen wieder vorliegen.',
  _stand: new Date().toISOString().slice(0, 10),
  _zielmarge: ZIELMARGE,
  preise,
};

mkdirSync(dirname(ZIEL), { recursive: true });
writeFileSync(ZIEL, `${JSON.stringify(datei, null, 2)}\n`, 'utf8');

console.log(`\nPreise zurückgerechnet: ${Object.keys(preise).length} von ${artikel.length} Artikeln`);
console.log(`  geschrieben nach preise/baustoff-preise.json (gitignoriert)`);
console.log(`  Zielmarge ${(ZIELMARGE * 100).toFixed(0)} %, ekQuelle: rekonstruiert\n`);

if (gedeckelt.length) {
  console.log(`  ${gedeckelt.length} Artikel hängen am Listendeckel und lassen sich NICHT`);
  console.log('  zurückrechnen — jeder Einkauf oberhalb einer Schwelle ergibt denselben');
  console.log(`  gedeckelten Verkaufspreis: ${gedeckelt.join(', ')}`);
  console.log('  Für sie hilft nur die Lieferantenrechnung.\n');
}
if (ohneVk.length) console.log(`  ohne Verkaufspreis in der Ausgabe: ${ohneVk.join(', ')}\n`);

console.log('Ein Wert, der stimmt, ist noch kein Wert, der belegt ist.');
