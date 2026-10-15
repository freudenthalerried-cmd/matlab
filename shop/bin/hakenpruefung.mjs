#!/usr/bin/env node
/**
 * Hält der Haken einen Commit auf, solange eine Datei absichtlich falsch ist?
 *
 *   npm run pruefe-haken
 *
 * **Der Anlass, 8. September 2026** — die ganze Begründung steht in
 * `src/haken.js`. Kurz: Ein Commit dieses Loops nahm eine laufende Gegenprobe
 * mit und stellte einen Prüfer blind. Der Schutz dagegen existierte seit dem
 * 4. September als Satz in einem Kopfkommentar.
 *
 * Dieser Prüfer sieht den Haken nicht an, er **ruft ihn auf** — einmal mit
 * einem eigens gelegten Zettel (muss sperren) und einmal ohne (muss
 * durchlassen). Der Zettel wird über dasselbe Modul gelegt, das die
 * Gegenproben benutzen, und in einem `finally` wieder abgenommen; er zeigt auf
 * eine Datei, die es nicht gibt, damit keine echte Quelle daran hängt.
 */

import { execFileSync } from 'node:child_process';
import { accessSync, constants, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HAKENWEG, hakenbefund } from '../src/haken.js';
import { markiere, markenpfad, nimmAb } from '../src/mutationsschutz.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const ORDNER = join(REPO, HAKENWEG);

/** Die Datei, auf die der Probezettel zeigt. Sie existiert nicht und soll es nicht. */
const PROBEDATEI = join(SHOP, 'src', 'haken-probe-gibt-es-nicht.js');

function gitConfig(name) {
  try {
    return execFileSync('git', ['-C', REPO, 'config', '--get', name], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** Führt einen Haken aus und gibt seinen Ausgang zurück — Ausgabe verworfen. */
function ausgangVon(name) {
  try {
    execFileSync(join(ORDNER, name), [], { cwd: REPO, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return typeof e.status === 'number' ? e.status : 1;
  }
}

function probiere(name) {
  const ohneZettel = ausgangVon(name);
  let mitZettel;
  try {
    markiere(PROBEDATEI, '// nur zur Probe\n', 'bin/hakenpruefung.mjs',
      'misst, ob der Haken einen offenen Zettel wirklich aufhält');
    mitZettel = ausgangVon(name);
  } finally {
    nimmAb(PROBEDATEI);
  }
  if (existsSync(markenpfad(PROBEDATEI))) {
    throw new Error(`Der Probezettel liegt noch: ${markenpfad(PROBEDATEI)}`);
  }
  return { mitZettel, ohneZettel };
}

// **Ergänzt am 9. September 2026.** Dieser Prüfer liest das Erzeugnis nicht
// selbst — er ruft den Haken, und der ruft `npm test`, und fünfunddreißig
// Testdateien lesen `ausgabe/site`. Über einem veralteten Erzeugnis sperrt der
// Haken zu Recht, und die Messung nannte das `haken-sperrt-immer`: ein Befund
// über den Haken, der in Wahrheit einer über den Bauzustand war.
//
//   Ein Prüfer, der durch ein anderes Werkzeug hindurch liest, liest.
//
// Nicht messbar ist nicht grün — deshalb Ausgang 2 und nicht 0.
const stand = frischebefund(SHOP, 'ausgabe/site');
if (!stand.frisch) {
  for (const zeile of abbruchtext(stand)) console.error(zeile);
  process.exit(2);
}

if (!existsSync(ORDNER)) {
  console.error(`Der Hakenordner fehlt: ${HAKENWEG} — ohne ihn ist hier nichts zu messen.`);
  process.exit(2);
}

const dateien = readdirSync(ORDNER).filter((n) => !n.startsWith('.')).sort();

const { geprueft, meldungen } = hakenbefund({
  hakenweg: gitConfig('core.hooksPath'),
  dateien,
  lies: (name) => readFileSync(join(ORDNER, name), 'utf8'),
  ausfuehrbar: (name) => {
    try {
      accessSync(join(ORDNER, name), constants.X_OK);
      return true;
    } catch {
      return false;
    }
  },
  probiere,
  aufrufer: readFileSync(join(SHOP, 'bin', 'gegenprobenlauf.mjs'), 'utf8'),
});

// **Gezählt wird das Angeordnete, nicht das Gefundene** — dieselbe Regel wie
// bei der Mutationsprüfung: „nichts gefunden" und „nicht hingesehen" dürfen
// nicht gleich aussehen.
console.log(`Haken — ${geprueft} angeordnete Haken, jeder einmal mit und einmal ohne Zettel gerufen\n`);

if (meldungen.length === 0) {
  console.log('Keine Meldung. Ein Commit bleibt stehen, solange eine Datei absichtlich falsch ist.');
  process.exit(0);
}

for (const m of meldungen) {
  console.log(`  ✗ ${m.text}`);
  console.log(`      [${m.regel}]`);
}

console.log(`\n${meldungen.length} Meldung(en).`);
console.log('`npm run haken` setzt core.hooksPath; der Haken selbst steht in shop/haken/.');
process.exit(1);
