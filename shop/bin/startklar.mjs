#!/usr/bin/env node
/**
 * Was fehlt, bevor der Shop online gehen darf.
 *
 *   npm run startklar
 *
 * Beantwortet die Frage „ist der Shop fertig?" aus den Daten statt aus dem
 * Gedächtnis. Punkte, die von hier aus nicht feststellbar sind, werden als
 * solche ausgewiesen — nicht als erfüllt.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startklar } from '../src/startklar.js';
import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');
const preisdateiVorhanden = existsSync(preisPfad);
const betreiberPfad = join(WURZEL, 'data', 'betreiber.json');

const katalog = ladeBaustoffkatalog(
  lies(join(WURZEL, 'data', 'katalog-baustoff.json')),
  preisdateiVorhanden ? lies(preisPfad) : null,
  lies(join(WURZEL, 'data', 'lieferanten.json')),
  ZIELMARGE,
);

const befund = startklar({
  betreiber: existsSync(betreiberPfad) ? lies(betreiberPfad) : {},
  impressumsfelder: IMPRESSUMSFELDER,
  katalog,
  preisdateiVorhanden,
  // Diese drei stehen nirgends in den Daten, weil es sie noch nicht gibt.
  // Sobald sie da sind, gehören sie in `data/betreiber.json` — dann meldet
  // dieses Werkzeug sie von selbst.
  zahlungsanbieter: null,
  rechtstexteFundstelle: null,
  domainZeigtAufShop: null,
  repositoryPrivat: null,
});

const zeichen = { erfuellt: '✓', offen: '✗', unpruefbar: '?' };
console.log('\nStartklar-Prüfung\n');
for (const p of befund.punkte) {
  console.log(`  ${zeichen[p.zustand]} ${p.titel}`);
  console.log(`      ${p.befund}${p.zustand === 'erfuellt' ? '' : `  ·  ${p.wer}`}`);
}

console.log(`\n${befund.erfuellt} erfüllt, ${befund.offen} offen, ${befund.unpruefbar} von hier aus nicht feststellbar.`);
console.log(befund.startklar
  ? '\nSTARTKLAR.'
  : '\nNICHT STARTKLAR. Ein Punkt, den niemand bestätigt hat, zählt nicht als erfüllt —'
    + '\nsonst ginge der Shop online, weil das Werkzeug nicht hinsehen konnte.');
