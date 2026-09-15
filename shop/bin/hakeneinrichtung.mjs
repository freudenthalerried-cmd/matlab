#!/usr/bin/env node
/**
 * Setzt `core.hooksPath` auf den versionierten Hakenordner.
 *
 *   npm run haken
 *
 * Wird auch von `bin/gegenprobenlauf.mjs` gerufen — **vor** der ersten
 * Mutation. Der Grund steht in `src/haken.js`: Der Schutz gehört zu der
 * Stelle, die die Gefahr erzeugt, nicht in eine Anleitung, die in einem
 * unbeaufsichtigten Lauf niemand liest.
 *
 * `.git/hooks` wird nicht angefasst und ist ohnehin nicht versioniert; in
 * einem frisch aufgesetzten Behälter wäre dort nichts. Genau das ist der Fall,
 * in dem dieser Loop arbeitet.
 */

import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HAKENWEG } from '../src/haken.js';

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export function richteHakenEin(repo = REPO) {
  const jetzt = (() => {
    try {
      return execFileSync('git', ['-C', repo, 'config', '--get', 'core.hooksPath'], { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  })();
  if (jetzt === HAKENWEG) return { geaendert: false, weg: HAKENWEG };
  execFileSync('git', ['-C', repo, 'config', 'core.hooksPath', HAKENWEG]);
  return { geaendert: true, weg: HAKENWEG, vorher: jetzt };
}

if (process.argv[1] && process.argv[1].endsWith('hakeneinrichtung.mjs')) {
  const { geaendert, weg, vorher } = richteHakenEin();
  console.log(geaendert
    ? `core.hooksPath steht jetzt auf ${weg}${vorher ? ` (vorher: ${vorher})` : ''}.`
    : `core.hooksPath stand schon auf ${weg}.`);
}
