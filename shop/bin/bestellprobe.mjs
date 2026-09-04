#!/usr/bin/env node
/**
 * Kommt eine Bestellung wirklich an? — der Weg vom Klick bis in die Ablage.
 *
 *   npm run bestellprobe
 *
 * **Der Anlass, 4. September 2026.** Gate 26 ist gebaut: `bestellung.php`
 * nimmt entgegen, `shop-bestellen.js` schickt, die Kasse zeigt drei Felder und
 * einen Knopf. Jede Hälfte ist geprüft — das Skript an einem laufenden PHP,
 * der Schalter im Testlauf, das Bündel am Datenschutzprüfer.
 *
 * > **Die beiden Hälften sind einander nie begegnet.** Die 53 Browserszenarien
 * > laufen gegen die Einzeldatei über `file://` und mit ausgeschaltetem Weg;
 * > der Knopf war dort nie auf der Seite, und ein `fetch` ginge von `file://`
 * > ohnehin nicht hinaus.
 *
 * Dieselbe Familie, die dieser Bestand seit Wochen findet: gebaut, geprüft,
 * nicht **zusammen** ausgeführt. Diese Probe führt es zusammen — echter Bau,
 * echtes PHP, echter Browser, echte Datei am Ende.
 *
 * ## Was sie baut
 *
 * Einen vollständigen Shop in ein Wegwerfverzeichnis, mit einer
 * Betreiberdatei, in der E-Mail und Rechtstextefundstelle stehen. Damit ist
 * der Bestellweg **an** — der einzige Weg, ihn zu prüfen, ohne den Bestand
 * anzufassen.
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beispielbestellung } from '../src/bestellfelder.js';
import { freierPort } from '../src/freierport.js';
import { pruefeBestelldaten } from '../src/kunde.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const ANFANG = '[[PROBE-ANFANG]]';
const ENDE = '[[PROBE-ENDE]]';

const abbruch = (text, code = 2) => { console.error(`\nAbbruch: ${text}`); process.exit(code); };

if (spawnSync('php', ['-v'], { encoding: 'utf8' }).status !== 0) {
  abbruch('Ohne PHP kann diese Probe nichts fahren. Sie sagt das, statt still grün zu sein.');
}

/** Chromium dort suchen, wo die Umgebung ihn hinlegt. */
function findeChromium() {
  for (const p of [process.env.CHROME_PFAD, '/opt/pw-browsers/chromium',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (p && existsSync(p)) return p;
  }
  const wo = spawnSync('which', ['chromium'], { encoding: 'utf8' });
  return wo.status === 0 ? wo.stdout.trim() : null;
}
const chromium = findeChromium();
if (!chromium) abbruch('Kein Chromium gefunden.');

// --- 1. Bauen, mit eingeschaltetem Bestellweg -------------------------------

const ablage = mkdtempSync(join(tmpdir(), 'bestellprobe-'));
const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
const betreiberDatei = join(ablage, 'betreiber.json');
writeFileSync(betreiberDatei, JSON.stringify({
  ...betreiber,
  // Die zwei Voraussetzungen aus `src/bestellweg.js`. Sie stehen hier und
  // nicht im Bestand: Der Weg ist heute **aus**, und diese Probe prüft, was
  // an dem Tag geschieht, an dem er an ist.
  email: 'office@example.at',
  rechtstexteFundstelle: 'Kanzlei X, Fassung vom 4.9.2026',
}, null, 2));

const bau = spawnSync('npm', ['run', '--silent', 'website'], {
  cwd: SHOP,
  encoding: 'utf8',
  env: { ...process.env, WEBSITE_AUSGABE: ablage, STARTKLAR_BETREIBER: betreiberDatei },
});
if (bau.status !== 0) abbruch(`Der Bau ist gescheitert:\n${bau.stdout}${bau.stderr}`);

const site = join(ablage, 'site');
if (!existsSync(join(site, 'bestellung.php'))) {
  abbruch('Der Bau hat bestellung.php nicht mitgeliefert — der Weg ist aus, und die Probe '
    + 'hätte den ausgeschalteten Zustand geprüft und für den eingeschalteten gehalten.');
}

// --- 2. Die Sonde in die Kassenseite legen ----------------------------------
//
// Zwei Skripte, und die Reihenfolge trägt sie: Das erste läuft **vor**
// `shop.js` und legt den Warenkorb in den Speicher; das zweite läuft danach
// und bedient die Oberfläche. Ein einziges Skript am Ende käme zu spät für
// den Korb und zu früh für die Seite.

const KORB = [{ sku: 'POS-12569', menge: 40 }, { sku: 'POS-51967', menge: 4 }];
const kasse = readFileSync(join(site, 'kasse.html'), 'utf8');
// **Der Schlüssel wird aus dem Bündel gelesen, nicht hier notiert.** Ein
// zweiter Ort für denselben Namen wäre am Tag der nächsten Fassung (`-v2`)
// eine Probe, die einen leeren Warenkorb füllt und nichts merkt.
const schluessel = /KORBSCHLUESSEL\s*=\s*['"]([^'"]+)['"]/.exec(readFileSync(join(site, 'shop.js'), 'utf8'));
if (!schluessel) abbruch('Der Warenkorbschlüssel steht nicht im Bündel — die Sonde wüsste nicht, wohin.');

const vorher = `<script>localStorage.setItem(${JSON.stringify(schluessel[1])}, `
  + `${JSON.stringify(JSON.stringify(KORB))});</script>`;
const nachher = `
<script type="module">
(async () => {
  const warte = (ms) => new Promise((f) => setTimeout(f, ms));
  let out = '';
  try {
    await warte(300);
    const sel = document.querySelector('#kasse-ziel select');
    if (!sel) throw new Error('kein Bezirksfeld');
    sel.value = 'Perg';
    sel.dispatchEvent(new Event('change'));
    await warte(200);

    const form = document.querySelector('#kasse-ziel .bestellform');
    if (!form) throw new Error('kein Bestellformular — der Weg ist in der Oberfläche nicht da');

    /**
     * Ausgefuellt wird nach Namen, nicht nach Reihenfolge. Der erste Wurf
     * setzte die ersten drei Eingabefelder der Reihe nach — und als das
     * Formular aus dem Feldregister wuchs, fuellte die Sonde Firma, Strasse
     * und PLZ mit einer Firma, einer Adresse und einer Telefonnummer.
     */
    const werte = ${JSON.stringify(beispielbestellung())};
    for (const [name, wert] of Object.entries(werte)) {
      const feld = form.querySelector('[name=' + JSON.stringify(name) + ']');
      if (!feld) throw new Error('kein Feld für ' + name + ' — das Formular kennt es nicht');
      if (feld.type === 'checkbox') feld.checked = wert === true;
      else feld.value = String(wert);
    }
    const unbekannt = [...form.querySelectorAll('input')]
      .map((e) => e.name).filter((n) => !(n in werte));
    if (unbekannt.length) throw new Error('Felder ohne Wert in der Probe: ' + unbekannt.join(', '));

    form.querySelector('button').click();

    for (let i = 0; i < 60 && !/Angekommen|Nicht angekommen/.test(out); i++) {
      await warte(100);
      out = form.querySelector('.anfrage-echo').textContent;
    }
  } catch (fehler) {
    out = '[[SONDE GESTOLPERT: ' + fehler.message + ']]';
  }
  // **Der Marker steht geteilt im Quelltext.** Ungeteilt fände ihn die Suche
  // im Skript selbst — das steht als Text in der Seite —, und gemeldet würde
  // die Sonde statt ihres Ergebnisses. Genau das ist beim ersten Lauf passiert.
  const beweis = document.createElement('div');
  beweis.textContent = ${JSON.stringify(ANFANG.slice(0, 6))} + ${JSON.stringify(ANFANG.slice(6))}
    + out + ${JSON.stringify(ENDE.slice(0, 6))} + ${JSON.stringify(ENDE.slice(6))};
  document.documentElement.append(beweis);
})();
</script>`;
writeFileSync(join(site, 'kasse.html'),
  kasse.replace('<script src="shop.js" defer>', `${vorher}<script src="shop.js" defer>`) + nachher);

// --- 3. PHP davor, Chromium darauf ------------------------------------------

const port = await freierPort();
const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', site], { stdio: 'ignore' });

const OHNE_PROXY = {
  ...process.env,
  HTTPS_PROXY: '', HTTP_PROXY: '', https_proxy: '', http_proxy: '', NO_PROXY: '*', no_proxy: '*',
};

try {
  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${port}/kasse.html`); break; } catch { await new Promise((f) => setTimeout(f, 100)); }
  }

  const lauf = spawnSync(chromium, [
    '--no-sandbox', '--headless', '--disable-gpu',
    '--proxy-server=127.0.0.1:9', '--proxy-bypass-list=127.0.0.1',
    '--virtual-time-budget=12000', '--dump-dom', `http://127.0.0.1:${port}/kasse.html`,
  ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 120_000, env: OHNE_PROXY });

  const dom = `${lauf.stdout ?? ''}`;
  const von = dom.indexOf(ANFANG);
  const bis = dom.indexOf(ENDE, von);
  const gemeldet = von >= 0 && bis > von ? dom.slice(von + ANFANG.length, bis) : null;

  const probleme = [];
  const bestanden = [];
  if (gemeldet === null) probleme.push('die Sonde ist nicht gelaufen — kein Marker in der Seite');
  else if (gemeldet.includes('[[SONDE GESTOLPERT')) probleme.push(gemeldet);
  else if (!/^Angekommen\. Ihre Nummer: B-\d{4}-\d{4}$/.test(gemeldet.trim())) {
    probleme.push(`die Kasse meldet: „${gemeldet.trim()}"`);
  } else {
    bestanden.push(`Die Kasse meldet: ${gemeldet.trim()}`);
  }

  // **Der eigentliche Beweis liegt nicht im Browser.** Eine Kasse, die
  // „Angekommen" schreibt, ohne dass etwas ankam, wäre der teuerste Fehler
  // dieses ganzen Wegs.
  /**
   * **Die gefährliche Frage zuerst, und für sich.** Sie stand zunächst im
   * else-Zweig der Journalprüfung — und als die Gegenprobe die Ablage ins
   * Webverzeichnis verschob, fand die Probe dort kein Journal, meldete „es ist
   * nichts angekommen" und sah die Veröffentlichung gar nicht.
   *
   * > **Eine Prüfung, die nur im gelungenen Fall läuft, prüft den Fall nicht,
   * > für den es sie gibt.**
   */
  if (existsSync(join(site, 'bestellungen'))) {
    probleme.push('die Ablage liegt im Webverzeichnis — das Journal wäre unter einer URL erreichbar');
  } else {
    bestanden.push('Die Ablage liegt außerhalb des Webverzeichnisses');
  }

  const journal = join(ablage, 'bestellungen', `journal-${new Date().getFullYear()}.jsonl`);
  if (!existsSync(journal)) probleme.push('kein Journal in der Ablage — es ist nichts angekommen');
  else {
    const zeilen = readFileSync(journal, 'utf8').split('\n').filter(Boolean).map((z) => JSON.parse(z));
    if (zeilen.length !== 1) probleme.push(`${zeilen.length} Zeilen im Journal statt einer`);
    else {
      const z = zeilen[0];
      for (const [feld, erwartet] of [['firma', 'Musterbau GmbH'], ['email', 'kunde@example.at'],
        ['bezirk', 'Perg']]) {
        if (z[feld] !== erwartet) probleme.push(`${feld} in der Ablage: „${z[feld]}" statt „${erwartet}"`);
      }
      if (!z.text || z.text.length < 100) probleme.push('die Positionsliste ist nicht mitgekommen');
      else bestanden.push(`In der Ablage: ${z.nummer}, ${z.firma}, ${z.text.length} Zeichen Positionsliste`);

      /**
       * **Die eigentliche Frage: Lässt sich daraus ein Angebot machen?**
       *
       * Am 4. September sammelte das Formular drei Felder, und
       * `pruefeBestelldaten` verlangt acht. Die Bestellung kam an, war
       * abgelegt — und `npm run vorgang` hätte sie abgewiesen. Eine
       * Bestellung, aus der kein Beleg werden kann, ist keine.
       */
      const geprueft = pruefeBestelldaten({ ...z, land: 'AT' });
      if (!geprueft.gueltig) {
        probleme.push(`aus dieser Bestellung wird kein Angebot: ${geprueft.fehler.join('; ')}`);
      } else {
        bestanden.push('Aus der abgelegten Bestellung lässt sich ein Angebot machen');
      }
    }
  }

  /**
   * **Der letzte Schritt: Wird daraus wirklich ein Beleg?**
   *
   * Bis hierher ist gezeigt, dass die Bestellung ankommt und dass die
   * Kundendaten der Prüfung genügen. Das ist noch nicht dasselbe wie ein
   * Angebot: Dazwischen liegen `npm run posteingang` (schneidet die zwei
   * Dateien heraus) und `npm run vorgang` (rechnet nach und erzeugt den
   * Beleg). Beide sind einzeln geprüft — hier fahren sie am echten Journal.
   */
  if (existsSync(journal) && existsSync(join(REPO, 'preise', 'baustoff-preise.json'))) {
    const ziel = join(ablage, 'vorgang');
    const schnitt = spawnSync(process.execPath, [join(SHOP, 'bin', 'posteingang.mjs'),
      '--journal', journal, '--nummer', 'B-' + new Date().getFullYear() + '-0001', '--nach', ziel],
    { cwd: SHOP, encoding: 'utf8' });
    if (schnitt.status !== 0) {
      probleme.push(`posteingang schneidet nicht heraus: ${(schnitt.stderr || '').trim().slice(0, 200)}`);
    } else {
      const beleg = spawnSync(process.execPath, [join(SHOP, 'bin', 'vorgang.mjs'),
        join(ziel, 'anfrage.txt'), '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001'],
      { cwd: SHOP, encoding: 'utf8' });
      const aus = `${beleg.stdout ?? ''}${beleg.stderr ?? ''}`;
      if (beleg.status !== 0 || !/Angebot AN-2026-9001/.test(aus)) {
        probleme.push(`aus der Bestellung entsteht kein Beleg: ${aus.trim().split('\n').slice(-4).join(' | ')}`);
      } else {
        bestanden.push('Aus dem Journal entsteht über posteingang und vorgang ein Angebot');
      }
    }
  }

  // **Gezählt wird, was geprüft wurde.** Ohne die Zahl sähe eine Probe, die
  // nach dem ersten Schritt abbricht, genauso still aus wie eine bestandene —
  // dieselbe Regel wie im Prüferregister.
  console.log(`Bestellprobe — ${bestanden.length + probleme.length} Prüfungen `
    + 'von Klick bis Angebot\n');
  for (const b of bestanden) console.log(`  ✓ ${b}`);
  console.log('');
  if (probleme.length) {
    for (const p of probleme) console.log(`  ✗ ${p}`);
    console.log(`\n${probleme.length} Meldung(en). Der Weg vom Klick bis in die Ablage trägt nicht.`);
    process.exit(1);
  }
  console.log('Der Weg trägt: Klick, Empfangsskript, Ablage, Posteingang, Angebot.');
} finally {
  server.kill();
}
