#!/usr/bin/env node
/**
 * Die schnellen Prüfer — der Teil des Bestandes, der vor jeden Commit passt.
 *
 *   npm run schnelllauf
 *
 * **Gate 38, 11. September 2026.** Die Begründung steht in `src/haken.js`.
 * Kurz: Der Gesamtlauf dauert 72 Minuten und läuft deshalb nie zwischen zwei
 * Commits. In ihm standen an diesem Tag drei Prüfer rot — einer seit dem
 * 25. August —, und kein Commit hat das aufgehalten.
 *
 * > **Ein Prüfer, der rot ist und nichts aufhält, ist kein Prüfer, sondern
 * > eine Notiz.**
 *
 * Dieser Lauf fährt jeden Prüfer, der unter einer Sekunde bleibt: gemessen
 * 47 von 55, zusammen etwa fünf Sekunden. Welche das sind, rechnet
 * `imSchnelllauf` aus dem Prüferregister und der Ausnahmeliste aus — hier
 * steht keine zweite Aufzählung, die davon abweichen könnte.
 *
 * ## Eine Weigerung sperrt nicht
 *
 * Ausgang 2 heißt im ganzen Bestand: Dem Prüfer fehlt die Grundlage. Wer das
 * wie einen Fund behandelt, sperrt jeden Commit für immer — `pruefe-gebinde`
 * kann seit dem Verlust von `preise/poschacher-positionen.csv` nichts messen.
 * Wer es verschweigt, hat einen Prüfer, der nichts tut und grün aussieht.
 * Gemeldet wird sie, gesperrt wird nicht.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { imSchnelllauf, auswahlbefund } from '../src/haken.js';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';
import { befundzeilen } from '../src/prueferurteil.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ALLE = [...PRUEFER, ...BROWSERPRUEFER];

/*
 * **Erst die Auswahl, dann der Lauf.** Ein Prüfer ohne Grund und ohne Platz
 * wäre sonst einfach nicht gelaufen — still, und der Lauf meldete seine
 * Vollzähligkeit trotzdem.
 */
const auswahl = auswahlbefund(ALLE);
if (!auswahl.sauber) {
  console.error('Abbruch: Die Auswahl der Prüfer trägt nicht.');
  for (const m of auswahl.meldungen) console.error(`  ✗ ${m.text}  [${m.regel}]`);
  process.exit(2);
}

const laeufer = imSchnelllauf(ALLE);
if (!laeufer.length) {
  console.error('Abbruch: kein einziger Prüfer in der Auswahl — dieser Lauf prüfte nichts.');
  process.exit(2);
}

const begonnen = Date.now();
const rot = [];
const weigerungen = [];

/*
 * **Die Grenze wird gemessen, nicht geglaubt — 11. September 2026, abends.**
 *
 * Gate 38 sagt: Was unter einer Sekunde bleibt, läuft vor jedem Commit. Wer
 * in der Auswahl steht, war damit am Tag der Messung schnell genug — und
 * nichts hielt das nach. Am selben Abend ist es prompt eingetreten: `wegprobe`
 * kam ins Register, landete im Schnelllauf und kostete dort mehr als die
 * anderen dreiundvierzig zusammen.
 *
 * > **Eine Grenze, die einmal gemessen wurde, ist eine Behauptung über den
 * > Tag, an dem gemessen wurde.**
 *
 * Rot wird davon nichts: Ein langsamer Prüfer ist kein Fehler im Bestand, und
 * eine Sperre über eine Laufzeit hielte irgendwann einen Commit auf, weil der
 * Rechner gerade beschäftigt war. Gemeldet wird er.
 */
const GRENZE_MS = 1000;
const langsame = [];

for (const p of laeufer) {
  const seitPruefer = Date.now();
  const e = spawnSync(process.execPath, [join(SHOP, 'bin', p.werkzeug), ...(p.argumente ?? [])],
    { cwd: SHOP, encoding: 'utf8' });
  const gebraucht = Date.now() - seitPruefer;
  if (gebraucht > GRENZE_MS) langsame.push({ name: p.name, ms: gebraucht });
  const ausgabe = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  if (e.status === 2) {
    weigerungen.push(`${p.name}: ${ausgabe.trim().split('\n')[0] || 'ohne Angabe'}`);
    continue;
  }
  if (e.status !== 0) {
    rot.push({ name: p.name, zeilen: befundzeilen(ausgabe) });
  }
}

const dauer = ((Date.now() - begonnen) / 1000).toFixed(1);

if (weigerungen.length) {
  console.log(`${weigerungen.length} Prüfer können nicht messen — das ist keine Entwarnung:`);
  for (const w of weigerungen) console.log(`  ⃠ ${w}`);
  console.log('');
}

if (langsame.length) {
  console.log(`${langsame.length} Prüfer über der Sekunde aus Gate 38 — sie gehören `
    + 'angesehen und entweder beschleunigt oder mit Grund nach NICHT_IM_HAKEN:');
  for (const l of langsame) console.log(`  ! ${l.name} — ${(l.ms / 1000).toFixed(1)} s`);
  console.log('');
}

if (rot.length) {
  console.log(`${rot.length} von ${laeufer.length} Prüfern rot — ${dauer} s:\n`);
  for (const r of rot) {
    console.log(`  ✗ ${r.name}`);
    for (const z of r.zeilen) console.log(`      ${z}`);
  }
  console.log('\nEinzeln ansehen mit: npm --prefix shop run <name>');
  process.exit(1);
}

console.log(`Schnelllauf — ${laeufer.length} Prüfer grün in ${dauer} s.`);
console.log('Was hier nicht läuft, steht mit Grund in NICHT_IM_HAKEN und im Gesamtlauf.');
