#!/usr/bin/env node
/**
 * Liegt irgendwo im Verzeichnis eine absichtlich falsche Datei?
 *
 *   npm run pruefe-mutationen
 *
 * **Der Anlass, 4. September 2026.** Die Abschlussprüfung eines Laufs meldete
 * „uncommitted changes" — `src/betreiberform.js` mit ausgehängter
 * UID-Prüfziffer. Es war keine Arbeit, sondern eine Gegenprobe: Der letzte
 * Schritt von `npm run alles` mutiert 37-mal eine Quelldatei und schreibt sie
 * zurück, und ich hatte den Lauf für beendet gehalten.
 *
 * > **Wer währenddessen committet, committet die Mutation.** Genau dafür ist
 * > dieser Loop gebaut: Er committet und pusht ohne Rückfrage.
 *
 * Der Prüfer ist deshalb nicht der eigentliche Schutz — das ist der Zettel in
 * `src/mutationsschutz.js`, der das Original auf die Platte legt, bevor die
 * Mutation geschrieben wird. Der Prüfer ist die **Auskunft** darüber, und er
 * gehört vor jeden Commit.
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mutationsbefund, laufendeGegenproben } from '../src/mutationsschutz.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const { marken, angesehen, meldungen } = mutationsbefund(REPO);

// **Gezählt wird das Angesehene, nicht das Gefundene.** Der gesunde Zustand
// ist null Zettel; „nichts gefunden" und „nicht hingesehen" sähen in einer
// Fundzahl gleich aus, und genau das misst `src/pruefregister.js` sonst.
console.log(`Mutationsschutz — ${angesehen} Einträge angesehen, ${marken.length} offene Zettel\n`);

/*
 * **Die zweite Frage, seit dem 10. September 2026.** Der Satz unten stand
 * hier seit dem 4. September auf dem grünen Weg — als Warnung, die niemand
 * einforderte. In der Nacht auf den 10. ist er eingetreten: Ein Lauf überlebte
 * seinen Abbruch, mutierte neun Minuten weiter, und daneben wurde gemessen und
 * committet. Der Zettel hat gehalten, keine Quelldatei blieb falsch — aber der
 * Zettel kommt erst, wenn eine Mutation **liegt**. Zwischen zwei Proben liegt
 * keine, und genau dann sieht der Baum ruhig aus und ist es nicht.
 *
 * > **Eine Regel, die nur als Satz dasteht, gilt für den, der sie liest.**
 *
 * Gefragt wird die Prozessliste und keine Datei: Ein abgebrochener Lauf
 * hinterlässt so nichts, was später behauptet, er liefe noch.
 */
const ps = spawnSync('ps', ['-eo', 'pid,ppid,cmd'], { encoding: 'utf8' });
if (ps.status !== 0) {
  console.error('Weigerung: Die Prozessliste war nicht zu lesen.');
  console.error('Ob gerade ein Gegenprobenlauf mutiert, ist damit offen — und');
  console.error('nicht messbar ist nicht grün.');
  process.exit(2);
}
const ahnen = [process.pid, process.ppid];
for (let i = 0; i < 8; i += 1) {
  const zeile = ps.stdout.split('\n').map((z) => z.trim().split(/\s+/))
    .find((f) => Number(f[0]) === ahnen[ahnen.length - 1]);
  if (!zeile || !Number.isFinite(Number(zeile[1])) || Number(zeile[1]) <= 1) break;
  ahnen.push(Number(zeile[1]));
}
const laufend = laufendeGegenproben(ps.stdout, ahnen);
if (laufend.length > 0) {
  console.log(`  ✗ ${laufend.length} Gegenprobenlauf(e) laufen gerade — der Arbeitsbaum bewegt`);
  console.log('      sich unter jeder Messung, und ein Commit nimmt die Mutation mit.');
  for (const l of laufend) console.log(`      PID ${l.pid}: ${l.cmd}`);
  console.log('');
  console.log('Abwarten, bis der Lauf durch ist. Beenden nur über die Kennung —');
  console.log('`pkill -f gegenprobenlauf` trifft auf sein eigenes Muster die aufrufende');
  console.log('Shell und lässt den Läufer stehen. Genau so ist es am 10. September gegangen.');
  process.exit(1);
}

if (meldungen.length === 0) {
  console.log('Keine Meldung. Keine Datei ist gerade absichtlich falsch,');
  console.log('und es läuft keine Gegenprobe, die daran gerade etwas ändert.');
  process.exit(0);
}

for (const m of meldungen) {
  console.log(`  ✗ ${m.text}`);
  console.log(`      ${m.pfad}  [${m.regel}]`);
}

console.log(`\n${meldungen.length} Meldung(en).`);
console.log('`node bin/gegenprobenlauf.mjs` räumt beim Start auf — oder der Zettel');
console.log('trägt das Original zum Zurückschreiben von Hand.');
process.exit(1);
