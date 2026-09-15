#!/usr/bin/env node
/**
 * Entspricht das Gelieferte dem Bestellten?
 *
 *   node bin/auftragspruefung.mjs
 *
 * Liest die Ergebnisliste aus `master-prompt.md` — dem Auftrag selbst, nicht
 * aus einer Abschrift — und hält sie gegen `data/auftragszuordnung.json`.
 * Jede Anforderung braucht eine Antwort, jede Antwort ihre Belege, und jeder
 * Beleg muss existieren.
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ergebnisliste, pruefeErgebnisse, pruefeBegruendungen } from '../src/auftrag.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(SHOP, '..');

const auftragPfad = join(REPO, 'docs', 'baustoff-shop', 'master-prompt.md');
const zuordnungPfad = join(SHOP, 'data', 'auftragszuordnung.json');
for (const p of [auftragPfad, zuordnungPfad]) {
  if (existsSync(p)) continue;
  console.error(`Abbruch: ${p} fehlt.`);
  process.exit(2);
}

const liste = ergebnisliste(readFileSync(auftragPfad, 'utf8'));
const zuordnung = JSON.parse(readFileSync(zuordnungPfad, 'utf8'));
const e = pruefeErgebnisse(liste, zuordnung, (b) => existsSync(join(REPO, b)));

const zeichen = { erfuellt: '✓', anders: '≈', offen: '✗', 'ohne-zuordnung': '?', 'beleg-fehlt': '!' };

console.log(`\nAuftragsabgleich — ${e.gesamt} Ergebnisse aus master-prompt.md`);
console.log('Gelesen aus dem Auftrag, nicht abgeschrieben. Belege werden auf Existenz geprüft.\n');

for (const b of e.befunde) {
  console.log(`  ${zeichen[b.zustand] ?? '?'} ${String(b.nr).padStart(2)}. ${b.datei ?? b.text.slice(0, 40)}`);
  if (b.begruendung) console.log(`        ${b.begruendung.replace(/\s+/g, ' ').slice(0, 300)}`);
  if (b.belege?.length) console.log(`        Belege: ${b.belege.join(', ')}`);
  for (const f of b.fehlendeBelege ?? []) console.log(`        ✗ Beleg fehlt: ${f}`);
  if (b.zustand === 'ohne-zuordnung') {
    console.log('        ✗ Zu dieser Anforderung sagt die Zuordnung nichts.');
  }
}

/**
 * **Zweiter Durchgang seit dem 2. September: was die Begründung nennt.**
 *
 * Der Abgleich oben prüft, dass die Belegdateien existieren. Das reichte nicht:
 * Zum neunten Ergebnis stand „kontrolle.js prüft jeden Beleg gegen die
 * Rechnung" — die Datei gab es, den Vorgang nicht. Ein Beleg, der existiert,
 * belegt noch nichts.
 *
 * Geprüft wird deshalb jede Datei, jeder `npm run`-Befehl und jede Kennung,
 * die in einer Begründung beim Namen genannt wird. Die Auskünfte kommen von
 * außen — Dateisystem, package.json, Quelltext —, damit dieses Werkzeug nicht
 * sich selbst befragt.
 */
const findeDatei = (name) => {
  const r = spawnSync('bash', ['-c',
    `find ${REPO} -name ${JSON.stringify(name)} -not -path '*/node_modules/*' -print -quit`],
  { encoding: 'utf8' });
  return (r.stdout ?? '').trim() !== '';
};
const paket = JSON.parse(readFileSync(join(SHOP, 'package.json'), 'utf8'));
const findeKennung = (name) => {
  const r = spawnSync('bash', ['-c',
    `grep -rl -- ${JSON.stringify(name)} ${join(SHOP, 'src')} ${join(SHOP, 'bin')} 2>/dev/null | head -1`],
  { encoding: 'utf8' });
  return (r.stdout ?? '').trim() !== '';
};

const b = pruefeBegruendungen(zuordnung, {
  datei: findeDatei,
  befehl: (n) => Boolean(paket.scripts[n]),
  kennung: findeKennung,
});

console.log(`\nWas die Begründungen nennen: ${b.geprueft} Angaben geprüft, `
  + `${b.ausnahmen} begründete Ausnahmen.`);
for (const m of b.meldungen) console.log(`  ✗ ${m.text}`);
if (b.sauber) {
  console.log('Jede genannte Datei, jeder genannte Befehl und jede genannte Kennung gibt es.');
  console.log('Ein Beleg, der existiert, belegt noch nichts — deshalb wird auch das Genannte geprüft.');
}

console.log(`\n${e.erfuellt} erfüllt, ${e.anders} unter anderem Namen vorhanden, ${e.offen} offen.`);

if (e.sauber && b.sauber) {
  console.log('\nJede Anforderung ist beantwortet und jeder Beleg existiert.');
  console.log('Beantwortet heißt nicht erfüllt: „offen" ist eine gültige Antwort, „vergessen" nicht.');
  process.exit(0);
}
console.log('\nEine Anforderung ohne Antwort ist gefährlicher als eine offene — sie fällt niemandem auf.');
process.exit(1);
