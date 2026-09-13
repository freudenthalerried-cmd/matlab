/**
 * Baut aus Daten und Rechenkern eine einzelne, in sich geschlossene HTML-Datei.
 *
 * Der Rechenkern wird nicht nachgebaut, sondern eingebettet — damit im Shop
 * dieselbe Logik läuft, die die Tests prüfen. Eine zweite Preisrechnung im
 * Frontend wäre die sicherste Art, unbemerkt falsche Preise anzuzeigen.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baueKern, fremdeModulzeilen, KERNMODULE, SHOPMODULE } from './src/buendel.js';
import { jsonFuerSkript } from './src/format.js';
import { ohneKommentare } from './src/entkommentieren.js';

const lies = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const daten = {
  lieferanten: JSON.parse(lies('./data/lieferanten.json')),
  artikel: JSON.parse(lies('./data/artikel.json')),
};

// Der Zusammenbau liegt in src/buendel.js — der Shop braucht denselben Kern.
//
// **Ohne Kommentare**, aus demselben Grund wie in bin/website.mjs: Die
// Kommentare des Rechenkerns erklären die Kalkulation samt Zielmarge, und
// diese Datei wird als Funktionsmuster weitergegeben. Dass die Preise darin
// Platzhalter sind, schützt die Kalkulationsregel nicht.
// Siehe docs/baustoff-shop/kommentare-im-schaufenster.md.
const kern = ohneKommentare(
  baueKern((name) => lies('./src/' + name), [...KERNMODULE, ...SHOPMODULE]),
).text;

// Ersetzt wird über Funktionen, nicht über Ersatztexte: In String.replace hat
// „$&" (und Verwandte) im Ersatztext Sonderbedeutung. Ein Artikelname mit
// „$&" — freier Text aus einer importierten Preisliste — würde sonst den
// Platzhalter zurück in die Seite schreiben, ohne dass der Bau es merkt.
const vorlage = lies('./demo-template.html');
for (const platzhalter of ['/*__KERN__*/', '/*__DATEN__*/']) {
  if (!vorlage.includes(platzhalter)) {
    throw new Error(`Platzhalter fehlt in demo-template.html: ${platzhalter}`);
  }
}
const html = vorlage
  .replace('/*__KERN__*/', () => kern)
  // `jsonFuerSkript` statt `JSON.stringify`: Die Daten landen zwischen
  // `<script>` und `</script>` im Vorlagentext, und `JSON.stringify`
  // maskiert kein `<`. Eine Artikelbezeichnung mit der Zeichenfolge
  // `</script>` beendete das Skriptelement — vierte Stelle desselben
  // Befundes vom 3. September.
  .replace('/*__DATEN__*/', () => jsonFuerSkript(daten));

// Der Kollisionswächter sieht nur den Kern. Das Template deklariert im selben
// Skript eigene Namen (daten, katalog, eur …) — eine Kollision dort, oder ein
// Ersetzungsschaden, fällt erst beim Parsen des fertigen Skripts auf. Genau
// wie beim EUR-Vorfall blieben die Tests grün, die Seite liefe nicht.
const skriptAnfang = html.indexOf('<script type="module">') + '<script type="module">'.length;
const skriptEnde = html.indexOf('</script>', skriptAnfang);
const pruefverzeichnis = mkdtempSync(join(tmpdir(), 'demo-pruefung-'));
try {
  const skript = html.slice(skriptAnfang, skriptEnde);
  /*
   * **Zuerst die Frage, die `node --check` nicht stellt — 13. September 2026.**
   * Eine Weiterausfuhr aus `preis.js` landete wörtlich hier drin. Syntaktisch
   * war sie in Ordnung — dieses Skript ist ein Modul —, und sie verlangte eine
   * Datei `./frachtsatz.js`, die neben `demo.html` nicht liegt. Das Modul lud
   * nicht, die Seite hatte kein Skript, und `--check` löst keine Einfuhren auf.
   * Gefunden hat es ein Zeitablauf in der Oberflächenprobe.
   */
  const fremd = fremdeModulzeilen(skript);
  if (fremd.length) {
    throw new Error(`Das zusammengefügte Skript trägt ${fremd.length} Modulzeile(n), die der `
      + `Bündelbauer nicht aufgelöst hat:\n`
      + fremd.map((f) => `  Zeile ${f.nr}: ${f.text}`).join('\n'));
  }
  const pruefdatei = join(pruefverzeichnis, 'skript.mjs');
  writeFileSync(pruefdatei, skript);
  const pruefung = spawnSync(process.execPath, ['--check', pruefdatei], { encoding: 'utf8' });
  if (pruefung.status !== 0) {
    throw new Error('Das zusammengefügte Skript parst nicht:\n' + pruefung.stderr);
  }
} finally {
  rmSync(pruefverzeichnis, { recursive: true, force: true });
}

writeFileSync(new URL('./demo.html', import.meta.url), html);
console.log('demo.html geschrieben — ' + daten.artikel.artikel.length + ' Artikel, ' + daten.lieferanten.lieferanten.length + ' Lieferanten');
