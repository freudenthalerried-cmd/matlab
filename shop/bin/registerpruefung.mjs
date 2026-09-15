#!/usr/bin/env node
/**
 * Kennen die beiden Register einander?
 *
 *   npm run pruefe-register
 *
 * **Der Anlass, 11. September 2026.** Zwei Register beschreiben dieselbe
 * Sache: `src/pruefregister.js` führt die Prüfer, `src/gegenprobenregister.js`
 * führt je Prüfer die Mutation, die ihn rot machen muss. Das zweite verlangt
 * von jedem genannten Namen, dass es ihn als npm-Befehl gibt. **Keines der
 * beiden fragt das andere.**
 *
 * Gemessen in beide Richtungen: acht Namen hatten eine Gegenprobe und standen
 * in keinem Prüferregister — darunter `wegprobe` mit dreien. Zwei Prüfer
 * standen ohne Gegenprobe und ohne begründeten Verzicht da.
 *
 * > **Bei `wegprobe` war es die Umkehrung eines Prüfers ohne Gegenprobe: Man
 * > hatte dreimal gesehen, dass sie anschlägt, und nie, dass sie schweigt.**
 *
 * Dieses Werkzeug liest `package.json`, beide Register und den Bestand der
 * Werkzeugdateien und hält sie gegeneinander. Es misst nichts am Erzeugnis
 * und braucht deshalb keinen Bau.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRUEFER, BROWSERPRUEFER, KEIN_PRUEFER, registerbefund } from '../src/pruefregister.js';
import { GEGENPROBEN, OHNE_GEGENPROBE } from '../src/gegenprobenregister.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const skripte = Object.keys(
  JSON.parse(readFileSync(join(SHOP, 'package.json'), 'utf8')).scripts ?? {},
);

/*
 * **Ein leeres Skriptverzeichnis wäre grün.** Jede Regel dieses Prüfers fragt,
 * ob ein Name als Befehl dasteht; ohne Befehle meldete er lauter Funde oder,
 * bei umgekehrter Lesart, gar nichts. Beides wäre eine Aussage über eine
 * Datei, die er nicht lesen konnte.
 */
if (skripte.length < 50) {
  console.error(`Abbruch: package.json nennt nur ${skripte.length} Befehle — `
    + 'das ist keine Grundlage für einen Abgleich.');
  process.exit(2);
}

const b = registerbefund({
  skripte,
  ausGegenproben: GEGENPROBEN.map((p) => p.pruefer),
  ohneGegenprobe: OHNE_GEGENPROBE.map((o) => o.pruefer),
  gibtEs: (werkzeug) => existsSync(join(SHOP, 'bin', werkzeug)),
});

console.log(`Registerabgleich — ${b.pruefer} Prüfer, ${b.ausgenommen} begründet ausgenommen, `
  + `${b.gemessen} Namen aus den Gegenproben\n`);

if (b.meldungen.length) {
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log(`\n${b.meldungen.length} Meldung(en).`);
  console.log('„gegenprobe-ohne-platz" heißt: Der Bestand hat bewiesen, dass dieser Befehl');
  console.log('anschlägt — und fragt ihn in keinem Lauf. „pruefer-ohne-gegenprobe" heißt:');
  console.log('Niemand hat ihn je rot gesehen. Beides ist einzutragen, nicht wegzulassen.');
  process.exit(1);
}

console.log('Jeder Prüfer läuft in einem Lauf, und jeder hat gezeigt, dass er anschlägt —');
console.log('oder sagt, warum nicht. Beide Register sind gegeneinander gehalten.');
