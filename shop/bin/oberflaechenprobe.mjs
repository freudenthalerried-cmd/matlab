#!/usr/bin/env node
/**
 * Verhaltensprobe der Oberfläche — demo.html im echten Browser.
 *
 *   node bin/oberflaechenprobe.mjs
 *
 * Der Rechenkern ist getestet, aber die Verdrahtung im Template (Formulare,
 * zeichne*-Funktionen) lief bisher ohne Verhaltensprobe. Diese Probe füllt
 * die Formulare programmatisch aus, schickt sie ab und prüft die gerenderte
 * Antwort.
 *
 * Zwei Lehren aus dem eigenen ersten Wurf stecken im Aufbau:
 *
 * 1. **Angehängt, nicht ersetzt.** demo.html endet ohne </body>-Tag; ein
 *    `replace('</body>', …)` war ein stiller No-op, und keine Sonde lief je.
 *    Das Sondenskript wird deshalb angehängt — und jedes Szenario beweist
 *    mit einem Marker, dass es wirklich gelaufen ist. Eine Probe ohne
 *    Marker gilt als Fehlschlag, nicht als bestanden.
 * 2. **Geprüft wird nur der gerenderte Text.** Der eingebettete Rechenkern
 *    steht als Quelltext in der Seite; ein Grep über das ganze Dokument
 *    findet Erwartungstexte in String-Literalen und Kommentaren und meldet
 *    Grün für Szenarien, die nie liefen. Die Sonde kopiert deshalb den
 *    textContent der Zielelemente zwischen zwei Marker, und nur dieser
 *    Ausschnitt wird geprüft.
 *
 * Braucht ein installiertes Chromium (Headless); ohne eines bricht die
 * Probe mit klarer Meldung und Exit 2 ab. Sie läuft als Betreiberwerkzeug
 * und nicht in npm test, damit die Testfälle nicht von einer
 * Browserinstallation abhängen.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hier = fileURLToPath(new URL('.', import.meta.url));
const demoDatei = join(hier, '..', 'demo.html');
const ANFANG = 'SONDEN-ERGEBNIS-ANFANG';
const ENDE = 'SONDEN-ERGEBNIS-ENDE';

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

const SZENARIEN = [
  {
    name: 'Gebietsauskunft beim Laden (Heimatbezirk ist die Ausnahme)',
    aktionen: '',
    ziele: ['k-gebiet-auskunft'],
    erwartet: ['steht auf der Ausnahmeliste und ist kein Radonvorsorgegebiet', 'amtliche Liste auf Gemeindeebene'],
  },
  {
    name: 'Messwert genau 300 überschreitet 300 nicht',
    aktionen: `
      document.getElementById('mw-wert').value = '300';
      document.getElementById('mw-dauer').value = '12';
      document.getElementById('messwert').requestSubmit();`,
    ziele: ['mw-ergebnis'],
    erwartet: ['Referenzwert eingehalten', '300 Bq/m³ überschreiten den gesetzlichen Referenzwert von 300 Bq/m³ nicht'],
  },
  {
    name: 'Kurzzeitwert wird nicht mit dem Referenzwert verglichen',
    aktionen: `
      document.getElementById('mw-wert').value = '450';
      document.getElementById('mw-dauer').value = '2';
      document.getElementById('messwert').requestSubmit();`,
    ziele: ['mw-ergebnis'],
    erwartet: ['Hinweis, kein Ergebnis', 'Langzeitmessung bei einer ermächtigten Überwachungsstelle'],
    verboten: ['liegen über dem Referenzwert'],
  },
  {
    name: 'Langzeitwert über 300 führt zur Sanierungsempfehlung',
    aktionen: `
      document.getElementById('mw-wert').value = '450';
      document.getElementById('mw-dauer').value = '12';
      document.getElementById('messwert').requestSubmit();`,
    ziele: ['mw-ergebnis'],
    erwartet: ['Referenzwert überschritten', 'S 5280-3'],
  },
  {
    name: 'Materialbedarf weist die Rollenbindung aus',
    aktionen: `document.getElementById('rechner').requestSubmit();`,
    ziele: ['rechner-ergebnis'],
    erwartet: ['über dem Bedarf', 'Teilmengen gibt es nicht'],
  },
  {
    name: 'Kasse: Dienstausfall ist keine ungültige UID, und es geht nichts hinaus',
    aktionen: `
      document.querySelector('#katalog .add').click();
      document.getElementById('kasse').requestSubmit();`,
    ziele: ['kasse-ergebnis'],
    erwartet: ['UID-Abfrage (simuliert)', 'Es geht nichts hinaus'],
    verboten: ['als ungültig'],
  },
  {
    name: 'Kasse: eine ungültige UID wird als ungültig ausgewiesen',
    aktionen: `
      document.querySelector('#katalog .add').click();
      document.getElementById('k-vies').value = 'ungueltig';
      document.getElementById('kasse').requestSubmit();`,
    ziele: ['kasse-ergebnis'],
    erwartet: ['ungültig'],
  },
];

const chromium = findeChromium();
if (!chromium) {
  console.error('Kein Chromium gefunden (PLAYWRIGHT_BROWSERS_PATH oder /opt/pw-browsers).');
  console.error('Die Oberflächenprobe ist damit NICHT gelaufen.');
  process.exit(2);
}
if (!existsSync(demoDatei)) {
  console.error('demo.html fehlt — zuerst npm run build.');
  process.exit(2);
}

const seite = readFileSync(demoDatei, 'utf8');
const ablage = mkdtempSync(join(tmpdir(), 'oberflaechenprobe-'));
let fehlgeschlagen = 0;

try {
  for (const [i, s] of SZENARIEN.entries()) {
    const sonde = `
<script type="module">
${s.aktionen}
{
  // Die Marker werden zur Laufzeit zusammengesetzt: Stünden sie wörtlich in
  // diesem Skript, fände die Auswertung den Quelltext statt der Ausgabe.
  const texte = ${JSON.stringify(s.ziele)}.map((id) => (document.getElementById(id)?.textContent ?? '[[ZIEL ' + id + ' FEHLT]]'));
  const beweis = document.createElement('div');
  beweis.textContent = '${ANFANG.slice(0, 7)}' + '${ANFANG.slice(7)}' + texte.join(' | ') + '${ENDE.slice(0, 7)}' + '${ENDE.slice(7)}';
  document.documentElement.append(beweis);
}
</script>`;
    const variante = join(ablage, `szenario-${i}.html`);
    writeFileSync(variante, seite + sonde);
    const lauf = spawnSync(chromium, ['--no-sandbox', '--dump-dom', pathToFileURL(variante).href], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const dom = lauf.stdout ?? '';
    const von = dom.indexOf(ANFANG);
    const bis = dom.indexOf(ENDE, von);
    const gerendert = von >= 0 && bis > von ? dom.slice(von + ANFANG.length, bis) : null;

    const probleme = [];
    if (lauf.status !== 0) probleme.push(`Browser-Exit ${lauf.status}: ${(lauf.stderr ?? '').slice(0, 200)}`);
    if (gerendert === null) probleme.push('die Sonde ist nicht gelaufen — kein Marker in der Seite');
    else {
      for (const text of s.erwartet ?? []) {
        if (!gerendert.includes(text)) probleme.push(`fehlt im gerenderten Ergebnis: „${text}"`);
      }
      for (const text of s.verboten ?? []) {
        if (gerendert.includes(text)) probleme.push(`steht fälschlich im gerenderten Ergebnis: „${text}"`);
      }
    }

    if (probleme.length) {
      fehlgeschlagen++;
      console.log(`✗ ${s.name}`);
      for (const p of probleme) console.log(`    ${p}`);
      if (gerendert !== null) console.log(`    gerendert war: ${gerendert.slice(0, 300).replace(/\s+/g, ' ')}`);
    } else {
      console.log(`✓ ${s.name}`);
    }
  }
} finally {
  rmSync(ablage, { recursive: true, force: true });
}

console.log(`\n${SZENARIEN.length} Szenarien, ${fehlgeschlagen} fehlgeschlagen.`);
process.exit(fehlgeschlagen ? 1 : 0);
