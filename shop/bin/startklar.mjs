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
// Über die Umgebung überschreibbar, damit eine Probe das Werkzeug wirklich
// ausführen kann — mit anderen Antworten als denen des Bestands.
const betreiberPfad = process.env.STARTKLAR_BETREIBER || join(WURZEL, 'data', 'betreiber.json');

const lieferantenDatei = lies(join(WURZEL, 'data', 'lieferanten.json'));

const katalog = ladeBaustoffkatalog(
  lies(join(WURZEL, 'data', 'katalog-baustoff.json')),
  preisdateiVorhanden ? lies(preisPfad) : null,
  lieferantenDatei,
  ZIELMARGE,
);

const betreiber = existsSync(betreiberPfad) ? lies(betreiberPfad) : {};

/**
 * Die vier Angaben, die es noch nicht gibt, kommen **aus der Datei** — nicht
 * aus dieser Zeile.
 *
 * Die erste Fassung dieses Werkzeugs setzte sie hier hart auf `null` und
 * schrieb daneben, sie gehörten in `data/betreiber.json`, dann werde von
 * selbst gemeldet. Das war eine Zusage, die der Code nicht gehalten hätte:
 * Wer sie eingetragen hätte, hätte weiter „nicht feststellbar" gelesen.
 *
 * > **Ein Kommentar, der etwas verspricht, was der Code daneben nicht tut,
 * > ist schlimmer als kein Kommentar** — er verhindert, dass jemand
 * > nachsieht.
 *
 * `?? null` und nicht `|| null`: Ein ausdrückliches `false` („nein, das
 * Repository ist nicht privat") ist eine **Antwort** und muss als solche
 * durchkommen. `||` hätte sie in „unbeantwortet" verwandelt.
 */
const befund = startklar({
  betreiber,
  impressumsfelder: IMPRESSUMSFELDER,
  katalog,
  preisdateiVorhanden,
  zahlungsanbieter: betreiber.zahlungsanbieter ?? null,
  rechtstexteFundstelle: betreiber.rechtstexteFundstelle ?? null,
  domainZeigtAufShop: betreiber.domainZeigtAufShop ?? null,
  repositoryPrivat: betreiber.repositoryPrivat ?? null,
  lieferanten: lieferantenDatei.lieferanten,
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

/**
 * **Berichtigt am 3. September.** Dieses Werkzeug endete ohne jeden
 * `process.exit` — also **immer grün**, auch mit „NICHT STARTKLAR" auf dem
 * Bildschirm. Es ist das Werkzeug, das die Frage „darf der Shop online gehen?"
 * beantwortet; wer es in einen Veröffentlichungsschritt hängt, bekommt von ihm
 * jedes Mal ein Ja.
 *
 * > **Ein Urteil, das nur auf dem Bildschirm steht, ist keines.**
 *
 * Gefunden beim Durchsehen aller Werkzeuge ohne roten Ausgang — nachdem am
 * 2. September `pruefe-seiten` genau daran vorbeigelaufen war. Diesmal beim
 * Nachsehen und nicht durch eine gescheiterte Gegenprobe.
 *
 * `--bericht` unterdrückt den roten Ausgang, wie bei den Prüfern auch: Wer die
 * Liste nur lesen will, soll sie ohne Fehlerschluss bekommen.
 */
if (!befund.startklar && !process.argv.includes('--bericht')) {
  console.log('\nMit offenen Punkten endet dieser Lauf rot. Mit --bericht nicht.');
  process.exit(1);
}
process.exit(0);
