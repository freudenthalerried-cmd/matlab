#!/usr/bin/env node
/**
 * Kommen die Kopfzeilen an — und überlebt die Seite ihr Fehlen?
 *
 *   npm run pruefe-kopfzeilen
 *
 * **Der Anlass, 11. September 2026.** Bis heute trug die ausgelieferte
 * `.htaccess` eine einzige Zeile, und der Kommentar daneben nannte den Grund:
 * eine Serverkonfiguration ohne Prüfung. Das stimmte, solange kein Server da
 * war. Einer lässt sich starten, und damit ist beides messbar.
 *
 * Dieser Prüfer fährt **zwei** Apachen gegen denselben gebauten Ordner:
 *
 *   1. **mit `mod_headers`** — jede geführte Kopfzeile muss ankommen, und
 *      keine der ausdrücklich nicht gesetzten darf es.
 *   2. **ohne `mod_headers`** — die Seite muss weiterhin mit 200 kommen.
 *      Das ist die eigentliche Zusicherung: Eine unbekannte Direktive
 *      beantwortet Apache mit **500 für die ganze Seite**; der `<IfModule>`
 *      nimmt genau diese Gefahr, und diese Hälfte beweist es.
 *
 * Dazu die Fehlerseite, die seit dem 6. September in der `.htaccess` steht und
 * bis heute nie an einem Apache gemessen wurde — Punkt 2 der Abnahmeliste.
 *
 * **Ohne Apache läuft er nicht** (Ausgang 2). Ein grüner Lauf über eine
 * Serverkonfiguration, die kein Server gelesen hat, wäre die eine Aussage, die
 * dieses Werkzeug nicht machen darf.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { KOPFZEILEN, NICHT_GESETZT } from '../src/serverkopf.js';
import { freierPort } from '../src/freierport.js';
import { wegwerfordner } from '../src/wegwerf.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

/** Wo die Module eines Apache liegen — je Verteilung anders benannt. */
const MODULORTE = ['/usr/lib/apache2/modules', '/usr/lib64/httpd/modules', '/usr/lib/httpd/modules'];

function abbruch(...zeilen) {
  for (const z of zeilen) console.error(z);
  process.exit(2);
}

{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}
if (!existsSync(join(SITE, '.htaccess'))) abbruch('Abbruch: ausgabe/site/.htaccess fehlt.');

const apache = ['apache2', 'httpd'].find((n) => spawnSync('which', [n], { encoding: 'utf8' }).status === 0);
if (!apache) {
  abbruch(
    'Abbruch: kein Apache vorhanden (apache2 oder httpd).',
    'Dieser Prüfer misst eine Serverkonfiguration — ohne Server bliebe nur die Behauptung,',
    'sie wirke. Genau die stand bis zum 11. September als Grund dafür, gar keine zu schreiben.',
  );
}
const modulordner = MODULORTE.find((o) => existsSync(o));
if (!modulordner) abbruch(`Abbruch: kein Modulordner gefunden (${MODULORTE.join(', ')}).`);

/** Die Module, die der Lauf braucht — ohne sie startet kein Apache. */
function modul(name) {
  const dateien = readdirSync(modulordner);
  const treffer = dateien.find((d) => d === `mod_${name}.so`);
  return treffer ? join(modulordner, treffer) : null;
}
const GRUNDMODULE = ['mpm_event', 'authz_core', 'mime', 'dir'];
const fehlend = GRUNDMODULE.filter((m) => !modul(m));
if (fehlend.length) abbruch(`Abbruch: es fehlen Apache-Module: ${fehlend.join(', ')}.`);
if (!modul('headers')) abbruch('Abbruch: mod_headers fehlt — dann ist die erste Hälfte nicht messbar.');

/** Startet einen Apache über dem gebauten Ordner. */
async function starte(mitHeaders) {
  const ablage = wegwerfordner('kopfzeilen-');
  const port = await freierPort();
  const konf = join(ablage, 'httpd.conf');
  writeFileSync(konf, [
    'ServerName 127.0.0.1',
    `Listen ${port}`,
    `PidFile ${join(ablage, 'httpd.pid')}`,
    `ErrorLog ${join(ablage, 'error.log')}`,
    ...GRUNDMODULE.map((m) => `LoadModule ${m}_module ${modul(m)}`),
    ...(mitHeaders ? [`LoadModule headers_module ${modul('headers')}`] : []),
    'TypesConfig /etc/mime.types',
    `DocumentRoot ${SITE}`,
    `<Directory ${SITE}>`,
    '  AllowOverride All',
    '  Require all granted',
    '</Directory>',
    '',
  ].join('\n'), 'utf8');
  const lauf = spawnSync(apache, ['-f', konf, '-k', 'start'], { encoding: 'utf8' });
  if (lauf.status !== 0) {
    abbruch(`Abbruch: Apache startete nicht (${lauf.status}).`, lauf.stderr ?? '');
  }
  const halt = () => spawnSync(apache, ['-f', konf, '-k', 'stop'], { encoding: 'utf8' });
  return { adresse: `http://127.0.0.1:${port}`, halt };
}

/** Wartet, bis der Server antwortet. */
async function hole(adresse, pfad) {
  for (let i = 0; i < 60; i++) {
    try {
      return await fetch(`${adresse}${pfad}`);
    } catch {
      await new Promise((f) => setTimeout(f, 100));
    }
  }
  throw new Error(`${adresse}${pfad} antwortet nicht`);
}

const meldungen = [];
const melde = (regel, text) => meldungen.push({ regel, text });

console.log('\nKopfzeilenprobe — die .htaccess an einem laufenden Apache\n');

/* --- 1. Mit mod_headers ---------------------------------------------------- */
{
  const s = await starte(true);
  try {
    const antwort = await hole(s.adresse, '/index.html');
    if (antwort.status !== 200) melde('startseite-nicht-200', `die Startseite kommt mit ${antwort.status}`);
    for (const k of KOPFZEILEN) {
      const wert = antwort.headers.get(k.name);
      if (wert === null) {
        melde('kopfzeile-fehlt', `${k.name} kommt nicht an — ${k.warum.slice(0, 80)}…`);
      } else if (wert !== k.wert) {
        melde('kopfzeile-weicht-ab', `${k.name} kommt als „${wert}" an, geführt ist „${k.wert}"`);
      }
    }
    for (const n of NICHT_GESETZT) {
      if (antwort.headers.get(n.name) !== null) {
        melde('nicht-gesetzt-und-doch-da',
          `${n.name} steht als ausdrücklich nicht gesetzt im Register und kommt trotzdem an`);
      }
    }
    console.log(`  ✓ ${KOPFZEILEN.length} Kopfzeilen kommen an, `
      + `${NICHT_GESETZT.length} ausdrücklich nicht gesetzte fehlen`);

    // Die Fehlerseite — Punkt 2 der Abnahmeliste, bis heute nie an einem
    // Apache gemessen.
    const fehler = await hole(s.adresse, '/gibt-es-nicht-abnahme.html');
    const text = await fehler.text();
    if (fehler.status !== 404) melde('fehlerseite-falscher-code', `sie kommt mit ${fehler.status}`);
    if (!text.includes('Diese Seite gibt es nicht')) {
      melde('fehlerseite-fremd', 'die Fehlerseite ist nicht unsere — ErrorDocument greift nicht');
    }
    if (fehler.status === 404 && text.includes('Diese Seite gibt es nicht')) {
      console.log('  ✓ ErrorDocument greift: 404 mit der eigenen Fehlerseite');
    }
  } finally { s.halt(); }
}

/* --- 2. Ohne mod_headers --------------------------------------------------- */
{
  const s = await starte(false);
  try {
    const antwort = await hole(s.adresse, '/index.html');
    const laenge = (await antwort.text()).length;
    if (antwort.status !== 200) {
      melde('ohne-modul-kaputt',
        `ohne mod_headers kommt die Startseite mit ${antwort.status} — der <IfModule> trägt nicht`);
    } else if (laenge < 1000) {
      melde('ohne-modul-leer', `ohne mod_headers kommt die Seite mit ${laenge} Zeichen`);
    } else {
      console.log(`  ✓ ohne mod_headers: 200 und ${laenge} Zeichen — der <IfModule> trägt`);
    }
    if (antwort.headers.get(KOPFZEILEN[0].name) !== null) {
      melde('ohne-modul-und-doch-kopfzeile',
        'ohne mod_headers kommt trotzdem eine Kopfzeile — dann misst dieser Lauf nicht, was er soll');
    }
  } finally { s.halt(); }
}

if (meldungen.length) {
  console.log('');
  for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Eine Serverkonfiguration, die niemand gelesen hat, ist eine Behauptung.');
  process.exit(1);
}

console.log('');
console.log(`Kopfzeilenprobe: ${KOPFZEILEN.length} Kopfzeilen an einem Apache gemessen`);
console.log('Der schlimmste Fall ist „die Kopfzeilen fehlen", nicht „die Seite ist weg".');
process.exit(0);
