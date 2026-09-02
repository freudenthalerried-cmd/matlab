#!/usr/bin/env node
/**
 * Wie viele Schritte liegen zwischen dem Klick und der fertigen Anfrage?
 *
 *   npm run wegprobe
 *
 * **Warum das zählbar ist, bevor ein Besucher kommt.** Der Shop erzeugt heute
 * keine Bestellungen, sondern Anfragen: Am Ende der Kasse steht ein fertiger
 * Text, den der Kunde kopiert und schickt. Der bezahlte Klick kostet zwischen
 * 4,19 € und 8,22 €; ob er etwas wert ist, hängt daran, wie weit es von der
 * Landeseite bis zu diesem Text ist. Die Kaufquote lässt sich ohne Besucher
 * nicht messen — **die Weglänge schon.**
 *
 * Gemessen wird am gebauten Shop, nicht am Quelltext: Der Weg wird wirklich
 * gegangen, Klick für Klick, und jeder Schritt zählt genau dann, wenn er eine
 * Handlung des Besuchers ist.
 *
 * Der Befund vom 2. September: **fünf Schritte, kein einziges Textfeld.** Der
 * Zahlweg ist vorbelegt, der Bezirk ist eine Auswahl, die Firmendaten fragt
 * die Kasse gar nicht — sie stehen erst in der Bestellung, die es noch nicht
 * gibt. Das ist kurz.
 *
 * Und die eine gemessene Länge, die daneben steht: Die **Gruppenseite hat
 * keinen Legen-Knopf.** Wer aus der Anzeige „Kleber, Gewebe, Dübel" kommt und
 * drei Positionen braucht, geht dreimal Artikel öffnen, legen, zurück — neun
 * Schritte statt fünf. Warum das so bleibt, steht in
 * `docs/baustoff-shop/fuenf-schritte-bis-zur-anfrage.md`.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const fuehreAus = promisify(execFile);
const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

/** Wie viele Schritte höchstens — überschritten heißt: nachsehen, nicht nachziehen. */
export const HOECHSTENS_SCHRITTE = 5;

function findeChromium() {
  const wurzeln = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean);
  for (const wurzel of wurzeln) {
    if (!existsSync(wurzel)) continue;
    for (const eintrag of readdirSync(wurzel).sort().reverse()) {
      for (const rest of [['chrome-linux', 'headless_shell'], ['chrome-linux', 'chrome']]) {
        const pfad = join(wurzel, eintrag, ...rest);
        if (existsSync(pfad)) return pfad;
      }
    }
  }
  return null;
}

const chromium = findeChromium();
if (!chromium) {
  console.error('Kein Chromium gefunden — die Wegprobe braucht einen Browser.');
  process.exit(2);
}

const seitePfad = join(SHOP, 'ausgabe', 'website.html');
if (!existsSync(seitePfad)) {
  console.error('ausgabe/website.html fehlt — erst `npm run website`.');
  process.exit(2);
}

const ANFANG = '<<<WEG';
const ENDE = 'WEG>>>';

// Die Sonde geht den Weg eines Besuchers, der aus der WDVS-Anzeige kommt.
// Jeder `schritt(...)` ist eine Handlung, die der Besucher selbst tut —
// Seitenwechsel, die daraus folgen, sind keine eigenen Schritte.
const SONDE = `
<script>
(async () => {
  const warte = () => new Promise((f) => setTimeout(f, 90));
  const geheZu = async (k) => { location.hash = k; await warte(); };
  const schritte = [];
  const merkmale = {};
  const schritt = (was) => schritte.push(was);
  try {
    await geheZu('gruppe/wdvs');
    merkmale.legenAufGruppenseite = document.querySelectorAll('#warenraster [data-legen]').length;
    merkmale.artikelAufGruppenseite = document.querySelectorAll('#warenraster a.karte').length;

    const karte = document.querySelector('#warenraster a.karte');
    karte.click(); await warte();
    schritt('Klick auf einen Artikel');

    const legen = document.querySelector('[data-legen]');
    merkmale.legenAufArtikelseite = legen ? 1 : 0;
    merkmale.mengenfeldVorbelegt = legen
      ? document.getElementById(legen.getAttribute('data-menge'))?.value ?? null : null;
    legen.click();
    schritt('In den Warenkorb legen');

    await geheZu('warenkorb');
    schritt('Warenkorb öffnen');

    await geheZu('kasse');
    schritt('Weiter zur Kasse');

    const ziel = document.getElementById('kasse-ziel');
    merkmale.auswahlfelder = ziel.querySelectorAll('select').length;
    merkmale.textfelder = ziel.querySelectorAll('input[type=text], input:not([type])').length;
    merkmale.vorbelegteZahlwege = ziel.querySelectorAll('input[type=radio]:checked').length;

    const sel = ziel.querySelector('select');
    sel.value = sel.options[1].value;
    sel.dispatchEvent(new Event('change'));
    await warte();
    schritt('Bezirk wählen');

    const kasten = ziel.querySelector('.anfrage');
    merkmale.anfragekasten = Boolean(kasten);
    const feld = kasten && kasten.querySelector('textarea, pre');
    merkmale.anfragezeichen = feld ? (feld.value || feld.textContent).length : 0;
    merkmale.knoepfe = kasten
      ? [...kasten.querySelectorAll('button, a')].map((n) => n.textContent.trim()).filter(Boolean) : [];
  } catch (e) {
    merkmale.gestolpert = String(e && e.message);
  }
  const b = document.createElement('div');
  b.textContent = '${ANFANG}' + JSON.stringify({ schritte, merkmale }) + '${ENDE}';
  document.documentElement.append(b);
})();
</script>`;

const ablage = mkdtempSync(join(tmpdir(), 'wegprobe-'));
const variante = join(ablage, 'weg.html');
writeFileSync(variante, readFileSync(seitePfad, 'utf8') + SONDE);

let dom = '';
try {
  const { stdout } = await fuehreAus(chromium, [
    '--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=5000',
    '--dump-dom', pathToFileURL(variante).href,
  ], { maxBuffer: 64 * 1024 * 1024 });
  dom = stdout ?? '';
} catch (e) {
  dom = e.stdout ?? '';
} finally {
  rmSync(ablage, { recursive: true, force: true });
}

/**
 * Der DOM kommt maskiert zurück — dieselben drei Entitäten wie in shopprobe.
 *
 * **Und gesucht wird die maskierte Form**, nicht die rohe: Der Quelltext der
 * Sonde steht selbst im ausgegebenen DOM und enthält den Marker unmaskiert.
 * Der erste Anlauf fand ihn dort und versuchte, `' + JSON.stringify(...)` als
 * JSON zu lesen. Ein Marker, der auch im Werkzeug vorkommt, findet das
 * Werkzeug.
 */
const roh = (() => {
  const auf = dom.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const von = auf.lastIndexOf(ANFANG);
  const bis = auf.indexOf(ENDE, von);
  return von >= 0 && bis > von ? auf.slice(von + ANFANG.length, bis) : null;
})();
const befund = roh ? JSON.parse(roh) : null;

if (!befund) {
  console.error('Die Sonde ist nicht gelaufen — kein Marker in der Seite.');
  process.exit(1);
}

const { schritte, merkmale } = befund;

console.log('Weg vom Anzeigenklick bis zur fertigen Anfrage\n');
if (merkmale.gestolpert) {
  console.error(`Die Sonde ist gestolpert: ${merkmale.gestolpert}`);
  process.exit(1);
}

schritte.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
console.log(`\n${schritte.length} Schritte, höchstens ${HOECHSTENS_SCHRITTE} vorgesehen.`);
console.log(`Textfelder auszufüllen: ${merkmale.textfelder} · Auswahlfelder: ${merkmale.auswahlfelder} · `
  + `Zahlweg vorbelegt: ${merkmale.vorbelegteZahlwege === 1 ? 'ja' : 'nein'}`);
console.log(`Am Ende: ${merkmale.anfragezeichen} Zeichen Anfragetext, Knöpfe: ${merkmale.knoepfe.join(' / ')}`);
console.log(`\nAuf der Gruppenseite: ${merkmale.artikelAufGruppenseite} Artikel, `
  + `${merkmale.legenAufGruppenseite} davon direkt legbar.`);

const probleme = [];
if (schritte.length > HOECHSTENS_SCHRITTE) {
  probleme.push(`${schritte.length} Schritte statt höchstens ${HOECHSTENS_SCHRITTE}`);
}
if (merkmale.textfelder > 0) {
  probleme.push(`${merkmale.textfelder} Textfelder — jede Eingabe am Bau ist ein Absprung`);
}
if (!merkmale.anfragekasten || merkmale.anfragezeichen < 200) {
  probleme.push('Am Ende steht kein brauchbarer Anfragetext');
}
if (merkmale.vorbelegteZahlwege !== 1) {
  probleme.push('Der Zahlweg ist nicht vorbelegt — ein Klick mehr ohne Erkenntnis');
}

if (probleme.length) {
  console.log('');
  for (const p of probleme) console.log(`  ✗ ${p}`);
  console.log('\nEin Weg wird nicht kürzer, indem man ihn beschreibt. Nachsehen, was dazugekommen ist.');
  process.exitCode = 1;
} else {
  console.log('\nFünf Schritte, kein Textfeld, ein fertiger Text am Ende.');
  console.log('Was hier fehlt, ist der Legen-Knopf auf der Gruppenseite: Drei Positionen');
  console.log('kosten heute neun Schritte statt fünf — siehe fuenf-schritte-bis-zur-anfrage.md.');
}
