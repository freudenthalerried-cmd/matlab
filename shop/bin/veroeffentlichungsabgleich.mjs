#!/usr/bin/env node
/**
 * Hält die veröffentlichte Beschreibung gegen die Quelle — gerechnet, nicht gelesen.
 *
 *   npm run abgleich-veroeffentlichung
 *
 * **Der Anlass, 10. September 2026.** Seit dem 9. September wird die
 * veröffentlichte PR-Beschreibung zurückgelesen und mit der Werkzeugausgabe
 * verglichen. In vier von sechs Runden fand dieser Abgleich eine Abweichung —
 * und er war jedes Mal ein **Augenvergleich**, weil die veröffentlichte
 * Fassung als Werkzeugantwort vorlag und nicht als Datei.
 *
 * > Ein Abgleich, den niemand rechnet, findet nur, was auffällt.
 *
 * **Warum es das jetzt gibt.** In `data/aussenlage.json` stand, der Netzausgang
 * dieser Umgebung sei gesperrt — gemessen an bauversand.com, den
 * Herstellerseiten und dem Rechtsinformationssystem, die alle mit „CONNECT
 * tunnel failed, response 403" antworten. Für `api.github.com` hatte das
 * niemand versucht. Sie antwortet mit 200.
 *
 * ***Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * ausschließt*** — zum dritten Mal in fünf Runden, und diesmal deckte sie den
 * Abgleich, der die vier Abweichungen hätte finden sollen.
 *
 * Dieses Werkzeug holt die veröffentlichte Fassung selbst, prüft sie gegen ihre
 * eigene Marke und hält sie Zeichen für Zeichen gegen `npm run pr-text`. Ohne
 * Netz weigert es sich; „nicht messbar" ist nicht grün.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { markenbefund, WEGZUSATZ } from '../src/veroeffentlichung.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const PR = 'https://api.github.com/repos/freudenthalerried-cmd/matlab/pulls/14';

const eigen = spawnSync('node', [join(SHOP, 'bin', 'prtext.mjs')], { cwd: SHOP, encoding: 'utf8' });
if (eigen.status !== 0) {
  console.error('Abbruch: `npm run pr-text` lief nicht — ohne seine Ausgabe ist nichts zu vergleichen.');
  process.exit(2);
}
const soll = eigen.stdout.replace(/\n$/, '');

const holen = spawnSync('curl', ['-sS', '--max-time', '25', PR], { encoding: 'utf8' });
if (holen.status !== 0 || !holen.stdout) {
  console.error('Weigerung: Die veröffentlichte Fassung war nicht zu holen.');
  console.error(`  ${PR}`);
  console.error(`  ${(holen.stderr || '').trim() || 'keine Antwort'}`);
  console.error('Ohne sie ließe sich nur behaupten, dass sie stimmt. Nicht messbar ist nicht grün.');
  process.exit(2);
}

let ist;
try {
  const antwort = JSON.parse(holen.stdout);
  if (typeof antwort.body !== 'string') throw new Error('kein Feld body');
  ist = antwort.body;
} catch (fehler) {
  console.error('Weigerung: Die Antwort war keine lesbare Beschreibung.');
  console.error(`  ${fehler.message}`);
  process.exit(2);
}

console.log('\nAbgleich der veröffentlichten Beschreibung\n');

const marke = markenbefund(ist);
console.log(marke.passt
  ? `  ✓ Die veröffentlichte Fassung deckt sich mit ihrer eigenen Marke (${marke.zeichen} Zeichen)`
  : `  ✗ ${marke.text}  [${marke.regel}]`);

/*
 * **Zwei verschiedene Fragen, und beide gehören gestellt.** Die Marke sagt, ob
 * die Fassung in sich stimmt — ob also beim Übertragen etwas dazugekommen ist.
 * Der Vergleich mit der Quelle sagt, ob die *richtige* Fassung draußen steht.
 * Eine alte, in sich stimmige Veröffentlichung besteht die erste Prüfung und
 * fällt bei der zweiten durch; genau dieser Fall ist am 5. September passiert.
 */
/*
 * **Der Zusatz des Weges gehört abgezogen, seit dem 10. September 2026.** Wird
 * die Beschreibung direkt über die Schnittstelle geschrieben — seit diesem Tag
 * der Weg —, hängt der Übertragungsweg selbst eine Attributionszeile an. Sie
 * gehört dorthin, steht aber hinter der Marke und nach dem Text, den das
 * Werkzeug ausgibt. Verglichen wird deshalb, was ohne sie dasteht; dass sie es
 * ist und nichts anderes, hat `markenbefund` eine Zeile zuvor geprüft.
 */
const ohneZusatz = ist.endsWith(WEGZUSATZ) ? ist.slice(0, -WEGZUSATZ.length) : ist;
const gleich = ohneZusatz === soll;
console.log(gleich
  ? '  ✓ Sie ist Zeichen für Zeichen die Ausgabe von `npm run pr-text`'
  : '  ✗ Sie weicht von der Ausgabe von `npm run pr-text` ab');

if (!gleich) {
  const kurz = Math.min(ohneZusatz.length, soll.length);
  let i = 0;
  while (i < kurz && ohneZusatz[i] === soll[i]) i++;
  const zeile = soll.slice(0, i).split('\n').length;
  console.log(`      erste Abweichung in Zeile ${zeile}, Zeichen ${i}`);
  console.log(`      veröffentlicht: …${JSON.stringify(ohneZusatz.slice(Math.max(0, i - 40), i + 40))}`);
  console.log(`      Quelle        : …${JSON.stringify(soll.slice(Math.max(0, i - 40), i + 40))}`);
  console.log(`      Länge: ${ohneZusatz.length} veröffentlicht, ${soll.length} in der Quelle`);
}

console.log(`\nAbgleich: ${gleich && marke.passt ? 'ohne Befund' : 'mit Befund'} — gerechnet, nicht gelesen.`);
console.log('Vier Abweichungen in sechs Runden hat der Augenvergleich gefunden;');
console.log('was er übersehen hat, weiß niemand. Ab hier rechnet es jemand.');

process.exit(gleich && marke.passt ? 0 : 1);
