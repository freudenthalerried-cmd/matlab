import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { BROWSERMODULE, KERNMODULE, SHOPMODULE, importhuelle, baueKern } from '../src/buendel.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const src = pfad('../src');


/* ------------------------------------------------------------------ *
 * Was im Browser landet — und was nicht
 * ------------------------------------------------------------------ */

test('die Browserliste ist genau ihre eigene Importhülle', () => {
  // Von Hand geführt, maschinell geprüft: Importiert eines dieser Module
  // eines Tages etwas Neues, fällt es hier auf, statt still wieder ins
  // ausgelieferte Skript zu fahren.
  const lies = (name) => readFileSync(join(src, name), 'utf8');
  assert.deepEqual(importhuelle(lies, [...BROWSERMODULE]), [...BROWSERMODULE].sort());
});

test('das Browserbündel trägt keine Rechnung, die dem Betrieb gehört', () => {
  // Keine Einkaufszahl steht in diesen Dateien — aber die Methode, und die
  // gehört dem Betrieb. Genannt wird, was ausdrücklich draußen bleibt.
  for (const draussen of ['preis.js', 'kostenbild.js', 'skonto.js', 'zahlung.js',
    'beleg.js', 'ablage.js', 'vies.js', 'bestellung.js', 'auftragslauf.js',
    'rechtstexte.js', 'kunde.js', 'bedarf.js', 'warenkorb.js']) {
    assert.ok(!BROWSERMODULE.includes(draussen), `${draussen} gehört nicht in den Browser`);
  }
  // Und die Gegenrichtung: Was der Shop braucht, ist drin.
  for (const drin of ['shopkern.js', 'gebinde.js', 'kundenanfrage.js', 'liefergebiet.js']) {
    assert.ok(BROWSERMODULE.includes(drin), `${drin} fehlt im Browserbündel`);
  }
});

test('das gebaute shop.js enthält keine ausgeschlossene Funktion', () => {
  const datei = pfad('../ausgabe/site/shop.js');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const js = readFileSync(datei, 'utf8');
  // Namen, die es nur in den ausgeschlossenen Modulen gibt.
  for (const name of ['berechneWarenkorb', 'erzeugeBestellungen', 'pruefeUid',
    'traegtSichSelbst', 'erzeugeImpressum', 'materialbedarf']) {
    assert.ok(!new RegExp(`function ${name}\\\\b`).test(js),
      `${name} fährt weiter im Browser mit`);
  }
  // Und was drin sein muss, ist drin — sonst prüft der Test eine leere Datei.
  assert.match(js, /function kundenWarenkorb\(/);
  assert.match(js, /function baueKundenanfrage\(/);
});
