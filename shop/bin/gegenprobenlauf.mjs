#!/usr/bin/env node
/**
 * Jede Gegenprobe des Registers anwenden und ansehen, ob sie anschlägt.
 *
 *   npm run gegenproben
 *
 * Antwort auf die Frage vom 1. September: **Welche Gegenprobe habe ich für
 * bestanden gehalten, ohne sie anschlagen zu sehen?** An diesem Tag waren es
 * zwei von drei, und beide sahen aus wie eine Bestätigung.
 *
 * Vier Zusicherungen je Eintrag, und keine reicht allein:
 *
 *   1. Der Prüfer ist **vorher grün**.
 *   2. Die Mutation ist **angekommen** — sonst lief der Prüfer über den
 *      unveränderten Bestand und meldete zu Recht nichts.
 *   3. Er meldet **rot** und nennt die erwartete Stelle.
 *   4. Nach dem Zurücksetzen ist er **wieder grün**.
 *
 * Die Datei wird immer zurückgeschrieben — auch bei Abbruch.
 *
 * **Danach neu bauen.** Das Zurückschreiben ändert das Änderungsdatum, und die
 * Browserproben halten das Erzeugnis gegen die Quelle: Sie melden dann „eine
 * Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit". Das ist
 * richtig so und keine Fehlfunktion — aber `npm run website` gehört danach.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GEGENPROBEN, OHNE_GEGENPROBE, registerbefund } from '../src/gegenprobenregister.js';
import { PRUEFER } from '../src/pruefregister.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const laufe = (name) => {
  const r = spawnSync('npm', ['run', '--silent', name], { cwd: SHOP, encoding: 'utf8' });
  return { gruen: r.status === 0, ausgabe: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

/**
 * Manche Prüfer lesen nicht die Quelle, sondern das **Erzeugnis** —
 * `pruefe-seiten` die gebauten Seiten, `pruefe-preise` die vier Ausgaben. Eine
 * Mutation an der Quelle erreicht sie nur, wenn dazwischen gebaut wird.
 *
 * **Der Eintrag trug das Feld `baueVorher`, und der Läufer hat es ignoriert.**
 * Die Gegenprobe meldete „schlägt nicht an" und beschuldigte damit einen
 * Prüfer, der nichts falsch gemacht hatte.
 *
 * > **Ein Register, dessen Felder der Läufer nicht kennt, erfindet Befunde.**
 * > Dieselbe Familie wie eine Gegenprobe, die nicht ankommt — nur meldet
 * > diese rot statt grün, und eine falsche Anschuldigung ist auch eine
 * > Fehlmeldung.
 */
const baue = () => {
  // `build` **vor** `website`: Die Oberfläche `shop-ui.js` geht durch das
  // Bündel, und eine Mutation dort erreicht die gebaute Seite sonst nicht.
  spawnSync('npm', ['run', '--silent', 'build'], { cwd: SHOP, encoding: 'utf8' });
  return spawnSync('npm', ['run', '--silent', 'website'], { cwd: SHOP, encoding: 'utf8' });
};

const nurEine = process.argv[2] ?? null;
const proben = nurEine ? GEGENPROBEN.filter((p) => p.id === nurEine || p.pruefer === nurEine) : GEGENPROBEN;
if (nurEine && proben.length === 0) {
  console.error(`Keine Gegenprobe zu „${nurEine}". Bekannt: ${GEGENPROBEN.map((p) => p.id).join(', ')}`);
  process.exit(2);
}

const befund = registerbefund(PRUEFER.map((p) => p.name));

console.log(`Gegenproben — ${GEGENPROBEN.length} im Register für ${befund.gedeckt} Prüfer,`);
console.log(`${befund.begruendet} weitere mit begründetem Verzicht.\n`);

const ergebnisse = [];

for (const p of proben) {
  const pfad = join(REPO, p.datei);
  const vorher = readFileSync(pfad, 'utf8');
  const schritte = [];
  let urteil = 'geschlagen';

  try {
    const vor = laufe(p.pruefer);
    if (!vor.gruen) {
      schritte.push('war schon vorher rot — an einem roten Prüfer lässt sich nichts zeigen');
      urteil = 'unbrauchbar';
    } else {
      // `alle: true` ersetzt jedes Vorkommen. Der Anlass: Die Landeseite nennt
      // ihre Lücke zweimal — im Kopf und im Fließtext —, und eine Mutation, die
      // nur eine der beiden trifft, lässt den Prüfer zu Recht grün melden.
      // Das sah aus wie „schlägt nicht an" und war eine halbe Mutation.
      const mutiert = p.art === 'anhaengen'
        ? vorher + p.text
        : (p.alle ? vorher.split(p.suchen).join(p.ersetzen) : vorher.replace(p.suchen, p.ersetzen));

      if (mutiert === vorher) {
        schritte.push(p.art === 'ersetzen'
          ? `Suchtext nicht gefunden: ${JSON.stringify(p.suchen.slice(0, 50))}`
          : 'Mutation hat nichts geändert');
        urteil = 'nicht angekommen';
      } else {
        writeFileSync(pfad, mutiert);
        if (p.baueVorher) baue();
        const nach = laufe(p.pruefer);
        if (nach.gruen) {
          schritte.push('meldete trotz Mutation grün');
          urteil = 'schlägt nicht an';
        } else if (!p.erwartet.test(nach.ausgabe)) {
          schritte.push(`meldete rot, aber nicht wegen ${p.erwartet} — er hat etwas anderes gefunden`);
          urteil = 'falsche Meldung';
        } else {
          schritte.push('meldete rot an der erwarteten Stelle');
        }
      }
    }
  } finally {
    writeFileSync(pfad, vorher);
    if (p.baueVorher) baue();
  }

  if (urteil === 'geschlagen') {
    const zurueck = laufe(p.pruefer);
    if (!zurueck.gruen) {
      schritte.push('nach dem Zurücksetzen nicht wieder grün — die Probe hat etwas hinterlassen');
      urteil = 'nicht sauber';
    }
  }

  ergebnisse.push({ ...p, urteil, schritte });
  const zeichen = urteil === 'geschlagen' ? '✓' : '✗';
  console.log(`  ${zeichen} ${p.pruefer} — ${p.was}`);
  console.log(`      ${p.datei} (${p.art})`);
  for (const s of schritte) console.log(`      ${s}`);
  console.log('');
}

const gescheitert = ergebnisse.filter((e) => e.urteil !== 'geschlagen');

console.log(`${ergebnisse.length - gescheitert.length} von ${ergebnisse.length} Gegenproben schlagen an.\n`);

if (OHNE_GEGENPROBE.length && !nurEine) {
  console.log('Ohne Gegenprobe, mit Grund:');
  for (const o of OHNE_GEGENPROBE) {
    console.log(`  · ${o.pruefer}`);
    console.log(`      ${o.warumKeine}`);
  }
  console.log('');
}

if (befund.unerklaert.length) {
  console.log(`${befund.unerklaert.length} Prüfer ohne Gegenprobe und ohne Grund: ${befund.unerklaert.join(', ')}`);
  console.log('Ein Prüfer ohne Gegenprobe ist eine Behauptung.');
  process.exitCode = 1;
} else if (gescheitert.length === 0) {
  console.log('Jeder Prüfer im Register hat gezeigt, dass er anschlägt — oder sagt, warum nicht.');
  console.log('Eine Gegenprobe, die man nicht anschlagen sieht, ist keine.');
}

if (gescheitert.length) process.exitCode = 1;
