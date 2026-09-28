/**
 * Ein Ordner, der sich selbst wieder wegräumt.
 *
 * **Der Anlass, 4. September 2026, Abend.** Ein Gesamtlauf brach ab, weil die
 * Ablage voll war: **63 082 Einträge unter `/tmp`.** Zwölf Proben und
 * Werkzeuge legen sich ein Wegwerfverzeichnis an, und nur acht räumen es weg.
 * `bin/bestellprobe.mjs` baut darin eine vollständige Website — rund zehn
 * Megabyte je Lauf, und im Gesamtlauf läuft sie mehrfach.
 *
 * > **Eine Probe, die ihre Spuren behält, wird irgendwann selbst der Fehler.**
 * > Sie meldete nichts; die Maschine tat es, dreißig Läufe später und an einer
 * > Stelle, die mit ihr nichts zu tun hatte.
 *
 * Aufgeräumt wird über `process.on('exit')` und nicht in einem `finally`: Ein
 * `finally` läuft nicht bei `process.exit()`, und genau so enden die meisten
 * dieser Werkzeuge — dieselbe Lehre wie beim Mutationsschutz vom Vormittag,
 * nur in die andere Richtung.
 *
 * **Was es nicht kann:** `SIGKILL`. Was dann liegen bleibt, liegt unter
 * `/tmp` und nicht im Bestand; ein Zettel wie beim Mutationsschutz wäre hier
 * unverhältnismäßig, weil nichts davon wiederherzustellen ist.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const angelegt = [];
let angemeldet = false;

/**
 * Legt einen Wegwerfordner an und merkt ihn zum Aufräumen vor.
 *
 * @param {string} praefix  wie bei `mkdtempSync`, z. B. `'bestellprobe-'`
 * @param {boolean} [behalten]  true lässt ihn stehen — für die Fehlersuche
 */
export function wegwerfordner(praefix, behalten = process.env.WEGWERF_BEHALTEN === '1') {
  const ordner = mkdtempSync(join(tmpdir(), praefix));
  if (behalten) return ordner;

  angelegt.push(ordner);
  if (!angemeldet) {
    angemeldet = true;
    process.on('exit', () => {
      for (const o of angelegt) {
        try {
          rmSync(o, { recursive: true, force: true });
        } catch {
          // Ein Ordner, der sich nicht wegräumen lässt, ist kein Grund, den
          // Ausgangscode des Werkzeugs zu ändern. Er liegt unter /tmp.
        }
      }
    });
  }
  return ordner;
}

// Eine Ausfuhr `vorgemerkt()` stand hier und zählte die vorgemerkten Ordner.
// Sie hätte nur einer Probe gedient, und die Probe hätte die Buchführung
// geprüft statt das Aufräumen. `test/wegwerf.test.js` startet stattdessen
// einen eigenen Prozess, lässt ihn einen Ordner anlegen und enden — und sieht
// danach nach, ob er weg ist.
