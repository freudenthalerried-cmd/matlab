/**
 * Welchen Browser die Proben dieses Hauses starten — **und welchen sie meinen**.
 *
 * **Der Fund, 14. September 2026.** Die Runde davor hat gefragt, ob es
 * doppelten Code **ohne** Kommentar darüber gibt. Gemessen über 574 Funktionen
 * in `src/` und `bin/`: genau **einen** — und der stand viermal wörtlich
 * gleich. Nachgezählt waren es **fünf**, und die fünfte war anders:
 *
 * | Fassung | sucht | findet hier |
 * |---|---|---|
 * | vier Proben | `PLAYWRIGHT_BROWSERS_PATH`, rekursiv nach `chrome-linux/headless_shell` | `chromium_headless_shell-1194/…/headless_shell` |
 * | `bin/bestellprobe.mjs` | feste Pfade, dann `which chromium` | `/opt/pw-browsers/chromium` |
 *
 * Beide laufen. Beide heißen `findeChromium`. Und sie starten **zwei
 * verschiedene Browser**: einen abgespeckten Headless-Shell und ein volles
 * Chromium.
 *
 * > **Fünf Funktionen, ein Name, zwei Browser** — und keine Probe sagte,
 * > welchen sie genommen hat.
 *
 * Das ist mehr als eine Dublette. Der Zweck dieser Proben ist, zu sehen, was
 * der Browser eines Kunden tut; welcher Browser das war, stand nirgends im
 * Ergebnis.
 *
 * ## Die Reihenfolge, und warum sie so ist
 *
 * 1. **`CHROME_PFAD`** — was der Aufrufer ausdrücklich nennt, gilt.
 * 2. **Der Headless-Shell** unter den Browserwurzeln.
 * 3. **Ein volles Chromium** derselben Wurzeln.
 * 4. **Die Systempfade** und zuletzt `which chromium`.
 *
 * **Und diese Reihenfolge stand zuerst andersherum.** Mein erster Entwurf gab
 * dem vollen Chromium den Vorzug: Es sei der nächste Verwandte des
 * Kundenbrowsers, ein Headless-Shell lasse Teile weg. Das klingt richtig und
 * ist hier falsch. Die Oberflächenprobe meldete **11 von 11 Szenarien
 * fehlgeschlagen**:
 *
 * > `Failed to connect to the bus: /run/dbus/system_bus_socket: No such file
 * > or directory`
 *
 * Das volle Chromium verlangt einen D-Bus, den dieser Behälter nicht hat; der
 * Headless-Shell verlangt ihn nicht. Drei der fünf Proben liefen damit
 * trotzdem — die vierte nicht, und sie hat es gesagt.
 *
 * > **Die Probe entscheidet, welcher Browser der richtige ist, und nicht die
 * > Überlegung darüber, welcher der echtere wäre.**
 *
 * Gewählt wird der erste Treffer, und `art` sagt, welcher es war. Eine Probe,
 * die ihr Ergebnis ausgibt, gibt die Zeile mit aus.
 */

import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

/** Wo Playwright seine Browser ablegt. */
export const BROWSERWURZELN = Object.freeze(
  [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean),
);

/** Feste Pfade, an denen ein System-Chromium liegen kann. */
export const SYSTEMPFADE = Object.freeze(
  ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'],
);

function unterWurzeln(rest) {
  for (const wurzel of BROWSERWURZELN) {
    if (!existsSync(wurzel)) continue;
    // Absteigend, damit die höchste Fassungsnummer zuerst kommt.
    for (const eintrag of readdirSync(wurzel).sort().reverse()) {
      const pfad = join(wurzel, eintrag, ...rest);
      if (existsSync(pfad)) return pfad;
    }
  }
  return null;
}

/**
 * Der Browser, in dem eine Probe läuft.
 *
 * @returns {{pfad: string, art: string}|null}
 */
export function findeChromium() {
  if (process.env.CHROME_PFAD && existsSync(process.env.CHROME_PFAD)) {
    return { pfad: process.env.CHROME_PFAD, art: 'vom Aufrufer genannt' };
  }
  const schale = unterWurzeln(['chrome-linux', 'headless_shell']);
  if (schale) return { pfad: schale, art: 'Headless-Shell' };

  const voll = unterWurzeln(['chrome-linux', 'chrome']);
  if (voll) return { pfad: voll, art: 'volles Chromium' };

  const direkt = BROWSERWURZELN.map((w) => join(w, 'chromium')).find((p) => existsSync(p));
  if (direkt) return { pfad: direkt, art: 'volles Chromium' };

  const system = SYSTEMPFADE.find((p) => existsSync(p));
  if (system) return { pfad: system, art: 'aus dem System' };

  const wo = spawnSync('which', ['chromium'], { encoding: 'utf8' });
  if (wo.status === 0 && wo.stdout.trim()) {
    return { pfad: wo.stdout.trim(), art: 'aus dem System' };
  }
  return null;
}

/**
 * Die Zeile, die eine Probe über ihren Browser ausgibt.
 *
 * **Warum sie sein muss:** Ein Befund über eine Oberfläche gilt für den
 * Browser, in dem er entstanden ist. Solange fünf Proben zwei verschiedene
 * Browser nahmen und keine es sagte, war jeder grüne Lauf eine Aussage über
 * etwas, das im Bericht nicht vorkam.
 *
 * > **Eine Messung, die ihr Messgerät nicht nennt, ist eine Behauptung über
 * > das Messgerät.**
 */
export function browserzeile(befund = findeChromium()) {
  if (!befund) return 'Kein Chromium gefunden — die Probe kann nicht laufen.';
  return `Browser: ${befund.pfad} (${befund.art})`;
}
