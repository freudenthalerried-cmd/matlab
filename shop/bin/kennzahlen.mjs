#!/usr/bin/env node
/**
 * Die Kennzahlenseite bauen — elftes Ergebnis des Ursprungsauftrags.
 *
 *   npm run kennzahlen
 *
 * Erzeugt `ausgabe/kennzahlen.html`, eine einzelne Datei ohne Server und ohne
 * Nachladen, und schreibt dieselbe Aufstellung auf den Bildschirm.
 *
 * **Diese Seite ist intern.** Sie nennt Zielgewinn, Rohmarge und
 * Werbebudget — Zahlen, die auf keine Kundenseite gehören. Sie geht deshalb
 * nach `ausgabe/`, nicht nach `ausgabe/site/`, und trägt den Vermerk im Kopf.
 * Die Trennung ist dieselbe wie bei `grund` und `kunde` in `rechtstexte.js`:
 * Eine Begründung, die überzeugt, überzeugt auch die Konkurrenz.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kennzahlen, kennzahlbefund, schwellenbefund, ABSCHNITTE } from '../src/kennzahlen.js';
import { gruppen as offeneGruppen } from './offenepunkte.mjs';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const wurzel = dirname(dirname(fileURLToPath(import.meta.url)));
const ziel = JSON.parse(readFileSync(join(wurzel, 'data', 'zielgroessen.json'), 'utf8'));

// Die offenen Punkte kommen aus `bin/offenepunkte.mjs` selbst, nicht aus einer
// zweiten Zusammenstellung. Der erste Anlauf hat sie hier neu gebaut und
// meldete **2** statt 15 — er zählte die Gruppen statt der Punkte darin. Eine
// Zahl, die plausibel aussieht und falsch ist, fällt in einem Dashboard
// niemandem auf: Es gibt ja nichts, woran man sie prüfen würde.
const offen = Object.fromEntries(offeneGruppen.map((g) => [g.id, g.punkte.length]));

/**
 * **Die Zahl der Messbegriffe kommt aus der Messliste, nicht aus dieser
 * Datei — seit dem 5. September.**
 *
 * Sie stand als `33` in `src/kennzahlen.js`; die Liste führt **32**. Eine
 * abgeschriebene Schwelle verschiebt sich unbemerkt, und dieses Dokument gibt
 * es genau deshalb, weil Schwellen sich nicht verschieben sollen.
 *
 * Die Liste selbst stammt aus `ausgabe/kampagne/keywords.csv`. Über einem
 * veralteten Stand wird nicht gerechnet: Eine Schwelle aus den Anzeigen von
 * gestern ist dieselbe Sorte Zahl wie die abgeschriebene.
 */
{
  const stand = frischebefund(wurzel, 'ausgabe/kampagne');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}
const messlistendatei = join(wurzel, 'ausgabe', 'messliste-baustoff.json');
if (!existsSync(messlistendatei)) {
  console.error(`Abbruch: ${messlistendatei} fehlt — zuerst \`npm run messliste\`.`);
  console.error('Eine Schwelle über eine Liste, die es nicht gibt, ist eine Behauptung.');
  process.exit(2);
}
const messliste = JSON.parse(readFileSync(messlistendatei, 'utf8'));
const begriffe = messliste.gruppen.reduce((n, g) => n + g.keywords.length, 0);

const liste = kennzahlen({ ziel, offen, begriffe });

/**
 * **Und die Schwellen selbst — geprüft, statt versprochen.**
 *
 * Der Testfall „Die Schwellen sind gerechnet, nicht eingetragen" prüfte eine
 * von zehn. Hier wird zweimal mit deutlich verschiedenen Eingaben gerechnet;
 * was sich nicht rührt, ist eingetragen und braucht einen Grund im
 * Verzeichnis. Genau das hätte die abgeschriebene 33 gemeldet.
 */
const schwellen = schwellenbefund(({ klickpreis, quote, begriffe: n, faktor }) => kennzahlen({
  ziel: { ...ziel, zielgewinn: ziel.zielgewinn * faktor },
  klickpreis,
  quote,
  begriffe: n,
}));
if (!schwellen.sauber) {
  console.error(`Abbruch: ${schwellen.meldungen.length} Schwelle(n) ohne Rechnung und ohne Grund.\n`);
  for (const m of schwellen.meldungen) console.error(`  ✗ ${m.text}  (${m.regel})`);
  console.error('\nEine abgeschriebene Schwelle verschiebt sich unbemerkt — und dieses');
  console.error('Dokument gibt es, weil Schwellen sich nicht verschieben sollen.');
  process.exit(2);
}
const befund = kennzahlbefund(liste);

const EUR = (n) => `${n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const PROZ = (n) => `${(n * 100).toFixed(2).replace('.', ',')} %`;
const wert = (k, v) => {
  if (v === null || v === undefined) return null;
  if (k.einheit === '€') return EUR(v);
  if (k.einheit === '%') return PROZ(v);
  return `${v.toLocaleString('de-AT')}${k.einheit && k.einheit !== 'Stück' ? ` ${k.einheit}` : ''}`;
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- Bildschirm

console.log('Kennzahlen — was gemessen wird, bevor gemessen werden kann\n');
for (const a of befund.jeAbschnitt) {
  console.log(`${a.titel} (${a.wann})`);
  console.log(`  ${a.frage}`);
  for (const k of a.kennzahlen) {
    const ist = wert(k, k.ist) ?? '— noch nicht gemessen';
    const zeichen = k.haelt === null ? ' ' : k.haelt ? '✓' : '✗';
    console.log(`  ${zeichen} ${k.name}`);
    console.log(`      ist ${ist}, Schwelle ${k.richtung} ${wert(k, k.schwelle)}`);
  }
  console.log('');
}
console.log(`${befund.gemessen} von ${befund.gesamt} Kennzahlen sind gemessen.`);
if (befund.reissend.length) console.log(`Reißend: ${befund.reissend.join(', ')}`);
console.log('');
console.log('Neun Striche sind kein Mangel dieser Seite, sondern ihr Zweck: Die Schwellen');
console.log('stehen fest, bevor die Zahlen da sind — danach ließen sie sich verschieben.');

// ---------------------------------------------------------------------- HTML

const zeile = (k) => `<tr class="${k.haelt === false ? 'reisst' : k.gemessen ? 'haelt' : 'offen'}">
<td class="n">${k.gemessen ? (k.haelt === false ? '✗' : k.haelt === true ? '✓' : '·') : ''}</td>
<td><strong>${esc(k.name)}</strong><div class="klein">${esc(k.entscheidung)}</div></td>
<td class="z">${k.gemessen ? esc(wert(k, k.ist)) : '<span class="strich">noch nicht gemessen</span>'}</td>
<td class="z">${esc(k.richtung)} ${esc(wert(k, k.schwelle))}</td>
<td class="klein">${esc(k.herkunft)}</td>
</tr>`;

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Kennzahlen — Baustoffhandel</title>
<style>
:root{--grund:#fbfaf8;--text:#1c1a17;--matt:#6b6660;--linie:#e0dcd5;--karte:#fff;
--haelt:#2f6b3d;--reisst:#a6382c;--offen:#8a7f6d;--akzent:#1f4e6b;}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--grund:#161513;--text:#eceae6;
--matt:#9a948b;--linie:#33302b;--karte:#1e1c1a;--haelt:#7fbf8d;--reisst:#e0897c;--offen:#a89b85;--akzent:#7fb3d0;}}
*{box-sizing:border-box}
body{margin:0;background:var(--grund);color:var(--text);
font:16px/1.55 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;}
main{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .3rem;text-wrap:balance}
h2{font-size:1.15rem;margin:2.6rem 0 .2rem;letter-spacing:.01em}
.unter{color:var(--matt);margin:0 0 2rem}
.warn{border-left:3px solid var(--reisst);background:var(--karte);padding:.8rem 1rem;margin:1.5rem 0}
.frage{color:var(--matt);font-style:italic;margin:.1rem 0 .8rem}
.rahmen{overflow-x:auto;border:1px solid var(--linie);border-radius:6px;background:var(--karte)}
table{border-collapse:collapse;width:100%;min-width:44rem}
th,td{text-align:left;padding:.6rem .7rem;border-bottom:1px solid var(--linie);vertical-align:top}
th{font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--matt);font-weight:600}
tr:last-child td{border-bottom:0}
td.n{width:1.6rem;text-align:center;font-weight:700}
td.z{white-space:nowrap;font-variant-numeric:tabular-nums;
font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.88rem}
.klein{font-size:.82rem;color:var(--matt);line-height:1.4;margin-top:.15rem}
.strich{color:var(--offen);font-style:italic}
tr.haelt td.n{color:var(--haelt)} tr.reisst td.n{color:var(--reisst)}
.summe{margin-top:2.5rem;padding-top:1.2rem;border-top:2px solid var(--linie)}
blockquote{margin:1.6rem 0;padding-left:1rem;border-left:3px solid var(--akzent);color:var(--text)}
footer{margin-top:3rem;color:var(--matt);font-size:.85rem}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85em}
</style></head><body><main>

<h1>Kennzahlen des Baustoffhandels</h1>
<p class="unter">Was gemessen wird, gegen welche Schwelle — und welche Entscheidung daran hängt.
Stand ${new Date().toISOString().slice(0, 10)}.</p>

<div class="warn"><strong>Interne Seite.</strong> Sie nennt Zielgewinn, Rohmarge und Werbebudget.
Diese Zahlen gehören auf keine Kundenseite.<br>
<strong>Kein realisierter Umsatz.</strong> Der Shop hat keine Bestellung, keinen Klick und keinen
Besucher gesehen. ${befund.ungemessen} der ${befund.gesamt} Kennzahlen sind deshalb ohne Wert.</div>

<blockquote><strong>Neun Striche sind kein Mangel dieser Seite, sondern ihr Zweck.</strong>
Die Schwellen stehen fest, bevor die Zahlen da sind. Danach ließen sie sich verschieben —
und man wüsste nicht mehr, ob man sie verschoben hat, weil sie falsch waren oder weil das
Ergebnis nicht gefiel.</blockquote>

${befund.jeAbschnitt.map((a) => `<h2>${esc(a.titel)} <span class="klein">— ${esc(a.wann)}</span></h2>
<p class="frage">${esc(a.frage)}</p>
<div class="rahmen"><table>
<thead><tr><th></th><th>Kennzahl und Entscheidung</th><th>Ist</th><th>Schwelle</th><th>Herkunft der Schwelle</th></tr></thead>
<tbody>${a.kennzahlen.map(zeile).join('')}</tbody></table></div>`).join('')}

<div class="summe">
<p><strong>${befund.gemessen} von ${befund.gesamt} gemessen.</strong>
${befund.reissend.length
    ? `Reißend: ${befund.reissend.map((r) => `<code>${esc(r)}</code>`).join(', ')}.`
    : 'Keine gemessene Kennzahl reißt ihre Schwelle.'}</p>
<p>Jede Schwelle stammt aus dem Modul, das sie verantwortet — <code>kostenbild.js</code>,
<code>werbewirkung.js</code>, <code>empfindlichkeit.js</code>. Keine ist hier noch einmal
gerechnet: Eine zweite Rechnung wäre eine zweite Wahrheit.</p>
</div>

<footer>Erzeugt mit <code>npm run kennzahlen</code> aus <code>src/kennzahlen.js</code>.
Nicht von Hand ändern — die nächste Ausgabe überschreibt sie.</footer>
</main></body></html>`;

const ausgabe = join(wurzel, 'ausgabe');
mkdirSync(ausgabe, { recursive: true });
const pfad = join(ausgabe, 'kennzahlen.html');
writeFileSync(pfad, html);
console.log(`\nSeite: ausgabe/kennzahlen.html (${(html.length / 1024).toFixed(1)} KB) — intern, nicht in ausgabe/site/`);
