/**
 * Welchen Browser die Proben dieses Hauses starten — und welchen sie meinen.
 *
 * **Der Fund, 14. September 2026.** Fünf Proben trugen eine Funktion namens
 * `findeChromium`, in **zwei** Fassungen, die zwei verschiedene Browser
 * fanden — und keine Probe sagte, welchen sie genommen hat.
 *
 * > **Eine Messung, die ihr Messgerät nicht nennt, ist eine Behauptung über
 * > das Messgerät.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import {
  BROWSERWURZELN, SYSTEMPFADE, findeChromium, browserzeile,
} from '../src/browsersuche.js';

const BIN = fileURLToPath(new URL('../bin', import.meta.url));

test('Der Browser dieser Umgebung wird gefunden und benannt', () => {
  const befund = findeChromium();
  assert.ok(befund, 'kein Chromium gefunden — dann laufen die Browserproben nicht');
  assert.ok(existsSync(befund.pfad), `${befund.pfad} gibt es nicht`);
  assert.ok(['vom Aufrufer genannt', 'Headless-Shell', 'volles Chromium', 'aus dem System']
    .includes(befund.art), `unbekannte Art: ${befund.art}`);
  assert.match(browserzeile(befund), /^Browser: \//);
});

/*
 * **Die Reihenfolge stand zuerst andersherum.** Mein erster Entwurf gab dem
 * vollen Chromium den Vorzug — es sei der nähere Verwandte des
 * Kundenbrowsers. Die Oberflächenprobe meldete daraufhin 11 von 11
 * Szenarien fehlgeschlagen: Das volle Chromium verlangt einen D-Bus, den
 * dieser Behälter nicht hat.
 *
 * > **Die Probe entscheidet, welcher Browser der richtige ist, und nicht die
 * > Überlegung darüber, welcher der echtere wäre.**
 */
test('Der Headless-Shell geht vor, solange es ihn gibt', () => {
  const befund = findeChromium();
  assert.equal(befund.art, 'Headless-Shell',
    `gewählt wurde „${befund.art}" — in dieser Umgebung läuft die Oberflächenprobe nur im Shell`);
  assert.match(befund.pfad, /headless_shell$/);
});

test('Ein ausdrücklich genannter Pfad geht allem vor', () => {
  const vorher = process.env.CHROME_PFAD;
  try {
    process.env.CHROME_PFAD = '/bin/sh';
    const befund = findeChromium();
    assert.equal(befund.pfad, '/bin/sh');
    assert.equal(befund.art, 'vom Aufrufer genannt');

    // Ein genannter Pfad, den es nicht gibt, wird übergangen statt geglaubt.
    process.env.CHROME_PFAD = '/gibt/es/nicht';
    assert.notEqual(findeChromium().pfad, '/gibt/es/nicht');
  } finally {
    if (vorher === undefined) delete process.env.CHROME_PFAD;
    else process.env.CHROME_PFAD = vorher;
  }
});

test('Ohne Browser sagt die Zeile das, statt zu schweigen', () => {
  assert.match(browserzeile(null), /Kein Chromium gefunden/);
  assert.ok(BROWSERWURZELN.length >= 1, 'keine Browserwurzel — dann sucht die Funktion nirgends');
  assert.ok(SYSTEMPFADE.length >= 2, 'zu wenige Systempfade');
});

/*
 * Und der Bestand: Keine Probe darf die Suche wieder selbst führen. Genau das
 * war der Fund — fünf Fassungen, zwei Verhaltensweisen, ein Name.
 */
test('Keine Probe trägt die Browsersuche ein zweites Mal', () => {
  const dateien = readdirSync(BIN).filter((n) => n.endsWith('.mjs'));
  assert.ok(dateien.length >= 40, `nur ${dateien.length} Werkzeuge gefunden`);
  const eigene = [];
  const nutzer = [];
  for (const name of dateien) {
    const text = readFileSync(join(BIN, name), 'utf8');
    if (/function\s+findeChromium\s*\(/.test(text)) eigene.push(name);
    if (/browserzeile\(/.test(text)) nutzer.push(name);
  }
  assert.deepEqual(eigene, [], `diese Werkzeuge führen die Suche selbst: ${eigene.join(', ')}`);
  assert.equal(nutzer.length, 5,
    `${nutzer.length} Proben nennen ihren Browser, erwartet sind fünf: ${nutzer.join(', ')}`);
});
