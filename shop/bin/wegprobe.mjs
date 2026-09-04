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
 * Der Befund vom 2. September, vormittags: **fünf Schritte, kein einziges
 * Textfeld.** Der Zahlweg ist vorbelegt, der Bezirk ist eine Auswahl, die
 * Firmendaten fragt die Kasse gar nicht — sie stehen erst in der Bestellung,
 * die es noch nicht gibt. Das war kurz.
 *
 * Daneben stand eine zweite gemessene Länge: Die Gruppenseite hatte **keinen
 * Legen-Knopf.** Wer aus der Anzeige „Kleber, Gewebe, Dübel" kam und drei
 * Positionen brauchte, ging dreimal Artikel öffnen, legen, zurück — neun
 * Schritte statt fünf.
 *
 * **Nachmittags gebaut.** Die Kachel trägt jetzt Mengenfeld und Knopf. Der
 * Hauptweg ist damit **vier** Schritte statt fünf — der Umweg über die
 * Artikelseite entfällt —, und drei Positionen kosten **sechs** statt neun.
 * Hergeleitet in `docs/baustoff-shop/legen-knopf-auf-der-landeseite.md`.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const fuehreAus = promisify(execFile);
const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * **Vorhanden ist nicht dasselbe wie aktuell.** Ergänzt am 4. September: Die
 * Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, stand seit dem
 * 29. August in zwei von neun Werkzeugen, die eines lesen. Die anderen sieben
 * fragten nur, ob es da ist. Das Register dazu steht in
 * `src/erzeugnisstand.js`; der Text ist dort **eine** Fassung für alle.
 */
{
  const stand = frischebefund(SHOP, 'ausgabe/website.html');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}


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
    const knoepfe = [...document.querySelectorAll('#warenraster [data-legen]')];
    merkmale.legenAufGruppenseite = knoepfe.length;
    merkmale.artikelAufGruppenseite = document.querySelectorAll('#warenraster .karte').length;
    merkmale.kartenMitVerweis = document.querySelectorAll('#warenraster .karte a.kopf').length;
    // Ein Knopf in einem Verweis wäre ein Bedienelement in einem
    // Bedienelement. Gemessen wird, dass keiner mehr in einem steckt.
    merkmale.knopfImVerweis = knoepfe.filter((k) => k.closest('a')).length;
    merkmale.mengenfeldVorbelegt = knoepfe.length
      ? knoepfe[0].closest('.legen')?.querySelector('input[type=number]')?.value ?? null : null;

    knoepfe[0].click(); await warte();
    schritt('In den Warenkorb legen');

    await geheZu('warenkorb');
    schritt('Warenkorb öffnen');

    // **Gate 25, ab 3. September.** Ein Gebinde reicht den Mindestbestellwert
    // nicht — und das ist der Punkt: Bis dahin lief dieser Weg mit 65,45 €
    // Warenwert bis zum fertigen Anfragetext durch, den Gate 20 bei der
    // Auslösung abgelehnt hätte. Gemessen wird jetzt beides: dass der Hinweis
    // im Korb steht, wenn die Menge nicht reicht — und dass die Erhöhung
    // genau einen Schritt kostet und nicht drei.
    merkmale.mindestwertHinweis = Boolean(document.querySelector('.mindestwert'));
    // Der Kleinmengensatz — bei einem Gebinde uebersteigt die Fracht die Ware,
    // und genau dort gehoert er hin. Gemessen wird er seit dem 3. September
    // hier statt im Anfragetext: Gate 25 liegt ueber jedem Frachtsatz des
    // Bestands, also kann ein Korb, der ueberhaupt einen Anfragetext erzeugt,
    // die Fracht nie mehr unterschreiten. Der Satz in kundenanfrage.js bleibt
    // stehen — gebraucht wird er, sobald der Mindestbestellwert faellt —, nur
    // nachweisen laesst er sich dort nicht mehr ueber diesen Weg, sondern in
    // kundenanfrage.test.js.
    //
    // KEINE Backslashes und KEINE Backticks in diesem Block: Er wandert als
    // Zeichenkette durch eine Schablone in eine HTML-Datei. Steht oben schon.
    // Gelesen wird der **gezeichnete Bereich**, nicht document.body: Dessen
    // textContent enthaelt auch den Inhalt der Skript-Elemente, und die
    // Zeichenkette steht im Quelltext des Buendels. Der erste Anlauf meldete
    // deshalb ja, auch nachdem die Gegenprobe den Hinweis abgeschaltet hatte —
    // eine Messung, die ihren eigenen Quelltext liest, kann nicht rot werden.
    const korbBereich = document.getElementById('warenkorb-ziel');
    merkmale.kleinmengensatzImKorb = /mehr als die Ware/
      .test(korbBereich ? korbBereich.textContent : '');
    const mengenfeld = document.querySelector('.korbzeile input[type=number]');
    if (merkmale.mindestwertHinweis && mengenfeld) {
      mengenfeld.value = '999';
      mengenfeld.dispatchEvent(new Event('change'));
      await warte();
      schritt('Menge erhöhen');
      merkmale.hinweisNachErhoehung = Boolean(document.querySelector('.mindestwert'));
    }

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
    // Trägt das Papier, das der Kunde verschickt, dieselbe unangenehme Zahl
    // wie die Seite? Gelesen wird aus dem Text selbst, nicht aus dem Korb —
    // geprüft wird das Erzeugnis und nicht die Absicht.
    //
    // **Ohne Backslash geschrieben, und das ist kein Stil.** Diese Zeilen
    // wandern als Zeichenkette durch eine Schablone in eine HTML-Datei; dort
    // schluckt die Schablone jeden Backslash, und aus einer Leerzeichenklasse
    // wird ein Buchstabe s. Der erste Lauf meldete deshalb „Fracht über
    // Warenwert: nein" bei 65,45 € Ware und 75,50 € Fracht. Dieselbe Falle
    // steht in shopprobe.mjs schon aufgeschrieben, und ich bin trotzdem
    // hineingelaufen.
    const zahl = (t) => Number(String(t).split('.').join('').replace(',', '.'));
    const anfragetext = feld ? (feld.value || feld.textContent) : '';
    const ware = anfragetext.match(/Warenwert[ ]+([0-9.,]+)/);
    const fracht = anfragetext.match(/Zustellung[ ]+([0-9.,]+)/);
    merkmale.frachtUeberWare = Boolean(ware && fracht && zahl(fracht[1]) > zahl(ware[1]));
    merkmale.kleinmengensatz = /mehr als die Ware/.test(anfragetext);
    // Der zweite gemessene Weg: drei Positionen aus derselben Anzeige. Bis zum
    // 2. September kostete jede zusätzliche vier Schritte — Artikel öffnen,
    // legen, zurück zur Gruppe. Gezählt werden nur die Handlungen **auf** der
    // Gruppenseite; der Rest des Weges ist derselbe wie oben.
    await geheZu('gruppe/wdvs');
    const drei = [...document.querySelectorAll('#warenraster [data-legen]')].slice(0, 3);
    let handlungen = 0;
    for (const k of drei) { k.click(); handlungen += 1; await warte(); }
    merkmale.dreiPositionen = handlungen + (schritte.length - 1);
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
console.log(`Fracht über Warenwert: ${merkmale.frachtUeberWare ? 'ja' : 'nein'} · `
  + `Kleinmengensatz im Anfragetext: ${merkmale.kleinmengensatz ? 'ja' : 'nein'}`);
console.log(`Mindestbestellwert: Hinweis bei einem Gebinde ${merkmale.mindestwertHinweis ? 'ja' : 'nein'} · `
  + `nach dem Erhöhen ${merkmale.hinweisNachErhoehung ? 'immer noch da' : 'weg'}`);
console.log(`Kleinmengensatz im Warenkorb bei einem Gebinde: ${merkmale.kleinmengensatzImKorb ? 'ja' : 'nein'}`);
console.log(`\nAuf der Gruppenseite: ${merkmale.artikelAufGruppenseite} Artikel, `
  + `${merkmale.legenAufGruppenseite} davon direkt legbar, `
  + `${merkmale.kartenMitVerweis} mit Verweis auf die Artikelseite.`);
console.log(`Drei Positionen aus derselben Anzeige: ${merkmale.dreiPositionen} Schritte.`);

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
if (merkmale.legenAufGruppenseite < 1) {
  probleme.push('Kein Legen-Knopf auf der Gruppenseite — jede Position kostet wieder vier Schritte');
}
if (merkmale.knopfImVerweis > 0) {
  probleme.push(`${merkmale.knopfImVerweis} Knöpfe stecken in einem Verweis — für die Tastatur eine Falle`);
}
if (merkmale.kartenMitVerweis !== merkmale.artikelAufGruppenseite) {
  probleme.push('Nicht jede Kachel führt zur Artikelseite — der Umbau hat einen Verweis verloren');
}
// **Ergänzt am 02.09.** Der Warenkorb sagt seit jeher „Das lohnt sich für Sie
// nicht", wenn die Fracht die Ware übersteigt. Im Anfragetext — dem einzigen
// Papier, das den Shop verlässt — stand der Satz nicht. Ein Hinweis, der nur
// auf der Seite steht, fehlt in dem Papier, das der Kunde verschickt.
if (merkmale.frachtUeberWare && !merkmale.kleinmengensatz) {
  probleme.push('Die Fracht übersteigt die Ware, und der Anfragetext sagt es nicht');
}
if (!merkmale.frachtUeberWare && merkmale.kleinmengensatz) {
  probleme.push('Der Kleinmengensatz steht im Anfragetext, obwohl der Korb die Fracht trägt');
}
// Gate 25 muss **im Korb** stehen und nicht erst in der Kasse: Wer erst nach
// Bezirk und Zahlweg erfährt, dass die Menge nicht reicht, hat drei Schritte
// umsonst gemacht. Und er muss verschwinden, sobald die Menge reicht — ein
// Hinweis, der stehen bleibt, ist ein Hinweis, den niemand mehr liest.
if (!merkmale.mindestwertHinweis) {
  probleme.push('Ein Gebinde reicht den Mindestbestellwert nicht, und der Warenkorb sagt es nicht');
}
if (merkmale.hinweisNachErhoehung) {
  probleme.push('Der Mindestwerthinweis bleibt stehen, obwohl die Menge reicht');
}
if (!merkmale.kleinmengensatzImKorb) {
  probleme.push('Die Fracht übersteigt bei einem Gebinde die Ware, und der Warenkorb sagt es nicht');
}
if (merkmale.dreiPositionen > HOECHSTENS_SCHRITTE + 2) {
  probleme.push(`Drei Positionen kosten ${merkmale.dreiPositionen} Schritte`);
}

if (probleme.length) {
  console.log('');
  for (const p of probleme) console.log(`  ✗ ${p}`);
  console.log('\nEin Weg wird nicht kürzer, indem man ihn beschreibt. Nachsehen, was dazugekommen ist.');
  process.exitCode = 1;
} else {
  // Die Zahl kommt aus der Messung. Hier stand „Vier Schritte" als Text,
  // während der Weg fünf zählte — ein Schlusssatz, der die eigene Messung
  // überschreibt, ist die kleinste Form von zwei Wahrheiten.
  console.log(`\n${schritte.length} Schritte, kein Textfeld, ein fertiger Text am Ende.`);
  console.log('Der Legen-Knopf sitzt seit dem 02.09. auf der Gruppenseite: Jede weitere');
  console.log('Position kostet einen Klick statt vier — siehe legen-knopf-auf-der-landeseite.md.');
}
