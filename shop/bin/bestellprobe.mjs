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
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beispielbestellung } from '../src/bestellfelder.js';
import { freierPort } from '../src/freierport.js';
import { pruefeBestelldaten } from '../src/kunde.js';
import { wegwerfordner } from '../src/wegwerf.js';
import { betreiberAmTagX } from '../src/tagx.js';
import { belegordner } from '../src/ablageort.js';
import { geschaeftsjahr, geschaeftstag, zeitstempel } from '../src/geschaeftszeit.js';

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

const ablage = wegwerfordner('bestellprobe-');
const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
const betreiberDatei = join(ablage, 'betreiber.json');
/*
 * **Eine Liste, nicht zwei — berichtigt am 11. September 2026.**
 *
 * Hier standen drei Felder mit eigener Begründung: die beiden Voraussetzungen
 * des Bestellwegs und die zugesagte Antwortzeit. Seit dem 11. September führt
 * `src/tagx.js` **dieselbe Sache** — die Angaben, die der Auftraggeber noch
 * schuldet, mit einer Probe je Feld —, und die beiden Listen kannten einander
 * nicht: Die dortige hatte sechs Felder, diese drei, und eines der drei fehlte
 * dort ganz.
 *
 * > **Zwei Listen über denselben Tag sind zwei Antworten, sobald eine Angabe
 * > dazukommt.**
 *
 * Diese Probe nimmt jetzt die Liste von dort. Kommt eine siebte Voraussetzung
 * dazu, fährt sie sie mit, ohne dass jemand daran denkt.
 */
writeFileSync(betreiberDatei, JSON.stringify(betreiberAmTagX(betreiber), null, 2));

/** Die Zahl, die der Bau eingesetzt bekommt — dieselbe, die die Kasse nennen muss. */
const ANTWORTZEIT = betreiberAmTagX(betreiber).antwortzeitWerktage;

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
  else {
    /**
     * **Geprüft wird die Zusage, nicht der Wortlaut.** Die erste Fassung
     * verlangte den Satz genau — und ging kaputt, als er um den Hinweis auf
     * AGB Punkt 2 wuchs. Eine Probe, die auf den Wortlaut besteht, verbietet
     * die Verbesserung des Textes.
     *
     * Drei Dinge muss der Besteller nach dem Absenden lesen: dass es
     * angekommen ist, unter welcher Nummer, und dass er noch keinen Vertrag
     * hat.
     */
    const satz = gemeldet.trim();
    const fehlt = [
      [/Angekommen/, 'die Bestätigung, dass es angekommen ist'],
      [/B-\d{4}-\d{4}/, 'die Nummer'],
      [/Auftragsbestätigung/, 'der Hinweis, dass der Vertrag erst mit ihr entsteht'],
      // **Aus der Liste gelesen, nicht abgeschrieben.** Hier stand `/1 Werktag/`,
      // während die Probe ihre Betreiberdatei selbst schrieb. Seit sie
      // `betreiberAmTagX` nimmt, kommt die Zahl von dort — und eine zweite
      // Fassung derselben Zahl wäre genau die Sorte Fehler, wegen der die
      // beiden Listen zusammengelegt wurden.
      [new RegExp(`${ANTWORTZEIT} Werktag`), 'die zugesagte Antwortzeit'],
    ].filter(([muster]) => !muster.test(satz)).map(([, was]) => was);
    if (fehlt.length) probleme.push(`der Kasse fehlt nach dem Absenden: ${fehlt.join(', ')} — „${satz}"`);
    else bestanden.push(`Die Kasse meldet Nummer, Vertragslage und Antwortzeit: ${satz.slice(0, 60)}…`);
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

  const journal = join(ablage, 'bestellungen', `journal-${geschaeftsjahr()}.jsonl`);
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

      /*
       * **Der Stempel, am laufenden PHP gemessen — seit dem 9. September.**
       * An dem Tag bekam `bestellung.php` seine Zeitzone: Vorher wählte es
       * die Journaldatei aus der ungesetzten Zeitzone des Hosts und stempelte
       * den Eintrag in UTC, sodass jede Bestellung zwischen Mitternacht und
       * 01:00 Uhr das Datum des Vortags trug. Gezeigt wurde das mit einem
       * eigenen kleinen PHP-Schnipsel — **an der echten Kette gemessen hat es
       * niemand.** Ein Beleg über einen Schnipsel ist ein Beleg über den
       * Schnipsel.
       *
       * Geprüft wird die Sache, nicht die Schreibweise: Der Stempel muss
       * denselben **Kalendertag** nennen wie `geschaeftstag()` und denselben
       * Augenblick meinen wie seine eigene Zeichenkette. Ein Stempel ohne
       * Zonenversatz wäre eine Ortszeit ohne Ort — er käme durch jede
       * Datumsprüfung und wäre trotzdem nicht vergleichbar.
       */
      if (typeof z.zeitpunkt !== 'string' || !z.zeitpunkt) {
        probleme.push('der Journaleintrag trägt keinen Zeitpunkt');
      } else if (!/[+-]\d{2}:\d{2}$/.test(z.zeitpunkt)) {
        probleme.push(`der Zeitpunkt ${z.zeitpunkt} trägt keinen Zonenversatz — eine Ortszeit ohne Ort`);
      } else if (z.zeitpunkt.slice(0, 10) !== geschaeftstag()) {
        probleme.push(`der Zeitpunkt nennt den ${z.zeitpunkt.slice(0, 10)}, `
          + `der Geschäftstag ist der ${geschaeftstag()}`);
      } else if (zeitstempel(new Date(z.zeitpunkt)) !== z.zeitpunkt) {
        probleme.push(`PHP stempelt ${z.zeitpunkt}, der Kalender dieses Betriebs `
          + `${zeitstempel(new Date(z.zeitpunkt))} — zwei Uhren`);
      } else {
        bestanden.push(`Der Stempel nennt den Geschäftstag: ${z.zeitpunkt}`);
      }

      /*
       * Und die Datei, in der er steht. Sie entscheidet die fortlaufende
       * Nummer und damit, ab wann die sieben Jahre des § 132 BAO laufen.
       */
      const jahrImNamen = Number(journal.match(/journal-(\d{4})\.jsonl$/)?.[1]);
      const jahrImStempel = Number(String(z.zeitpunkt).slice(0, 4));
      if (jahrImNamen !== jahrImStempel) {
        probleme.push(`Die Zeile steht in journal-${jahrImNamen}, der Stempel nennt ${jahrImStempel}`);
      }

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
      '--journal', journal, '--nummer', 'B-' + geschaeftsjahr() + '-0001', '--nach', ziel],
    { cwd: SHOP, encoding: 'utf8' });
    if (schnitt.status !== 0) {
      probleme.push(`posteingang schneidet nicht heraus: ${(schnitt.stderr || '').trim().slice(0, 200)}`);
    } else {
      /*
       * **Dieselbe Betreiberdatei wie der Bau — berichtigt am 11. September.**
       *
       * Bis heute baute diese Probe die Seiten mit der Datei des Tages X und
       * ließ die **Belege** gegen die echte laufen, also gegen eine ohne
       * E-Mail und ohne UID. Für das Angebot fiel das nicht auf: Es braucht
       * beides nicht.
       *
       * > **Eine Probe mit zwei Ständen desselben Betriebs prüft keinen von
       * > beiden ganz.**
       */
      const werkzeugumgebung = { ...process.env, VORGANG_BETREIBER: betreiberDatei };
      const beleg = spawnSync(process.execPath, [join(SHOP, 'bin', 'vorgang.mjs'),
        join(ziel, 'anfrage.txt'), '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001'],
      { cwd: SHOP, encoding: 'utf8', env: werkzeugumgebung });
      const aus = `${beleg.stdout ?? ''}${beleg.stderr ?? ''}`;
      if (beleg.status !== 0 || !/Angebot AN-2026-9001/.test(aus)) {
        probleme.push(`aus der Bestellung entsteht kein Beleg: ${aus.trim().split('\n').slice(-4).join(' | ')}`);
      } else {
        bestanden.push('Aus dem Journal entsteht über posteingang und vorgang ein Angebot');
      }

      /*
       * **Der Vertragsschluss — 13. September 2026.**
       *
       * Diese Probe ging bisher vom Angebot direkt zur Rechnung. Sie baute
       * damit eine Akte, in der eine Rechnung ohne Auftragsbestätigung liegt
       * — genau die Lücke, gegen die es seit gestern eine Regel gibt:
       *
       * ```
       * FEHLT: auftragsbestaetigung — rechnung liegt in der Akte,
       *        das Papier davor nicht
       * ```
       *
       * > **Die Probe, die sagt „der Weg trägt", baute eine Akte, die nicht
       * > zusammenpasst.** Der dreizehnte Schritt blieb grün, weil
       * > `pruefe-ablage` Journal und Durchschriften vergleicht und von
       * > Voraussetzungen nichts wusste.
       *
       * Möglich ist der Schritt erst seit gestern nacht: Bis dahin schnitt
       * `bin/vorgang.mjs` die Bankfelder ab, und ohne Konto weist
       * `darfBestaetigtWerden` die Bestätigung ab. Die Lieferzeit braucht sie
       * zusätzlich — sie ist eine offene Frage an den Lieferanten, und für die
       * Probe steht sie in einer eigenen Datei. Eine erfundene Lieferzeit im
       * echten Bestand wäre eine Zusage an Kunden; hier ist sie ein Wert, mit
       * dem sich der Weg fahren lässt.
       */
      // Der Wegwerfordner der Akte — eine Probe, die den Bestand verändert,
      // ist keine. Seit dem Vertragsschluss weiter oben wird er früher
      // gebraucht als bei der Rechnung.
      const akte = join(ziel, 'akte');

      const lieferantenDatei = join(ablage, 'lieferanten.json');
      {
        const echt = JSON.parse(readFileSync(join(SHOP, 'data', 'lieferanten.json'), 'utf8'));
        writeFileSync(lieferantenDatei, JSON.stringify({
          ...echt,
          lieferanten: echt.lieferanten.map((l) => ({
            ...l, lieferzeitWerktage: l.lieferzeitWerktage ?? 6,
          })),
        }, null, 2));
      }
      werkzeugumgebung.VORGANG_LIEFERANTEN = lieferantenDatei;

      const vertrag = spawnSync(process.execPath, [join(SHOP, 'bin', 'vorgang.mjs'),
        join(ziel, 'anfrage.txt'), '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001',
        '--stufe', 'bestaetigung', '--ablegen'],
      { cwd: SHOP, encoding: 'utf8', env: { ...werkzeugumgebung, VORGANG_ABLAGE: akte } });
      const vtext = `${vertrag.stdout ?? ''}${vertrag.stderr ?? ''}`;
      if (vertrag.status !== 0 || !/Abgelegt: auftragsbestaetigung/.test(vtext)) {
        probleme.push(`der Vertrag kommt nicht zustande: ${vtext.trim().split('\n').slice(-3).join(' | ')}`);
      } else if (!readFileSync(join(akte, belegordner(2026), 'AB-2026-9001.txt'), 'utf8')
        .includes('IBAN')) {
        // Ohne Konto verlangt die Bestätigung Zahlung sofort und sagt nicht wohin.
        probleme.push('die Auftragsbestätigung nennt keine Bankverbindung');
      } else {
        bestanden.push('Die Auftragsbestätigung schließt den Vertrag und nennt das Konto');
      }

      /*
       * **Und das letzte Papier — 11. September 2026.**
       *
       * Die Betriebskette führt neun Schritte; das Angebot ist der dritte.
       * Die Rechnung ist der achte und hat seit heute ein Werkzeug, das aber
       * an der fehlenden UID des Ausstellers abbricht — zu Recht, denn sie ist
       * Pflichtangabe nach § 11 Abs 1 Z 6 UStG.
       *
       * Mit der Betreiberdatei des Tages X fällt diese Sperre, und damit läuft
       * die Papierkette zum ersten Mal **ganz** durch: aus einem Klick wird
       * eine Rechnung. Lieferdatum und Zahlungseingang setzt diese Probe
       * selbst — in der Welt stellt sie der Betreiber fest, und genau deshalb
       * sind sie Argumente und keine Vermutung.
       */
      const rechnung = spawnSync(process.execPath, [join(SHOP, 'bin', 'vorgang.mjs'),
        join(ziel, 'anfrage.txt'), '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001',
        '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08'],
      { cwd: SHOP, encoding: 'utf8', env: werkzeugumgebung });
      const rtext = `${rechnung.stdout ?? ''}${rechnung.stderr ?? ''}`;
      const pflicht = [
        [/2026-09-09/, 'das Lieferdatum'],
        [/20 ?%/, 'der Steuersatz'],
        [new RegExp(betreiberAmTagX(betreiber).uid), 'die UID des Ausstellers'],
      ].filter(([muster]) => !muster.test(rtext)).map(([, was]) => was);
      if (rechnung.status !== 0) {
        probleme.push(`aus dem Vorgang entsteht keine Rechnung: ${rtext.trim().split('\n').slice(-4).join(' | ')}`);
      } else if (pflicht.length) {
        probleme.push(`der Rechnung fehlt: ${pflicht.join(', ')}`);
      } else {
        bestanden.push('Am Tag X entsteht aus derselben Bestellung eine Rechnung nach § 11 UStG');
      }

      /*
       * **Und was davon übrig bleibt — 11. September 2026, abends.**
       *
       * Bis heute endete die Papierkette auf dem Bildschirm: `--ablegen`
       * schrieb eine Journalzeile, der Beleg selbst wurde gedruckt und war
       * danach fort. § 132 BAO verlangt die Belege sieben Jahre, § 11 Abs 2
       * UStG vom Aussteller eine Durchschrift jeder Rechnung.
       *
       * Abgelegt wird in einen Wegwerfordner: `VORGANG_ABLAGE` — eine Probe,
       * die den Bestand verändert, ist keine. Seit heute hält das Werkzeug
       * diesen Satz selbst ein und weist `--ablegen` ohne den Schalter ab,
       * sobald `VORGANG_BETREIBER` gesetzt ist.
       */

      /*
       * **Das sechste Papier — 13. September 2026.**
       *
       * Die Kette hat sechs Papierarten; diese Probe fuhr fünf. Es fehlte
       * ausgerechnet die **Lieferantenbestellung** — der Schritt, an dem Geld
       * aus dem Haus geht und den Gate 20 bewacht.
       *
       * > **Damit hatte die eine Probe, die den ganzen Weg fährt, noch nie
       * > einen Einkaufswert in der Akte.** Die Regel vom 12. September —
       * > nur Rechnung und Gutschrift sind ein Umsatz, die
       * > Lieferantenbestellung trägt die **Ausgabe** — war im Durchgang nie
       * > geprüft worden, obwohl sie der gefährlichste Punkt des
       * > Buchhaltungsauszugs ist: Ohne sie stünde der Einkauf mit
       * > umgekehrtem Vorzeichen in der Umsatzsteuervoranmeldung.
       *
       * Fahrbar ist der Schritt erst seit gestern: Ohne Auftragsbestätigung
       * in der Akte bricht er ab (AGB Punkt 2, Gate 20).
       */
      const bestellt = spawnSync(process.execPath, [join(SHOP, 'bin', 'vorgang.mjs'),
        join(ziel, 'anfrage.txt'), '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001',
        '--stufe', 'bestellung', '--bezahlt', '2026-09-08', '--ablegen'],
      { cwd: SHOP, encoding: 'utf8', env: { ...werkzeugumgebung, VORGANG_ABLAGE: akte } });
      const btext = `${bestellt.stdout ?? ''}${bestellt.stderr ?? ''}`;
      const bestelldurchschrift = join(akte, belegordner(2026), 'LB-2026-9001-01.txt');
      if (bestellt.status !== 0 || !existsSync(bestelldurchschrift)) {
        probleme.push(`die Ware wird nicht bestellt: ${btext.trim().split('\n').slice(-3).join(' | ')}`);
      } else if (!readFileSync(bestelldurchschrift, 'utf8').includes('2026-9001-01')) {
        probleme.push('die Durchschrift der Bestellung nennt ihre Nummer nicht');
      } else {
        bestanden.push('Die Ware wird beim Lieferanten bestellt, mit Durchschrift in der Akte');
      }

      const abgelegt = spawnSync(process.execPath, [join(SHOP, 'bin', 'vorgang.mjs'),
        join(ziel, 'anfrage.txt'), '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001',
        '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08', '--ablegen'],
      { cwd: SHOP, encoding: 'utf8', env: { ...werkzeugumgebung, VORGANG_ABLAGE: akte } });
      const atext = `${abgelegt.stdout ?? ''}${abgelegt.stderr ?? ''}`;
      const durchschrift = join(akte, belegordner(2026), 'RE-2026-0001.txt');
      if (abgelegt.status !== 0) {
        probleme.push(`die Rechnung lässt sich nicht ablegen: ${atext.trim().split('\n').slice(-4).join(' | ')}`);
      } else if (!existsSync(durchschrift)) {
        probleme.push('die Rechnung ist abgelegt, die Durchschrift fehlt (§ 132 BAO)');
      } else if (!readFileSync(durchschrift, 'utf8').includes('RE-2026-0001')) {
        probleme.push('die Durchschrift trägt die Rechnungsnummer nicht');
      } else if (/— FEHLT \]\]/.test(readFileSync(durchschrift, 'utf8'))) {
        // Ein Papier mit sichtbarer Lückenmarke stünde sieben Jahre in der
        // Akte (§ 132 BAO). Bis zum 11. September ging genau das durch.
        probleme.push('die abgelegte Rechnung trägt eine Lückenmarke');
      } else {
        bestanden.push('Die Rechnung liegt als Durchschrift in der Akte, nicht nur als Journalzeile');

        /*
         * **Die vier Schritte nach der Rechnung — 12. September 2026, nachmittags.**
         *
         * Seit heute gibt es sie alle: die Akte lesen, eine falsche Rechnung
         * aufheben, die Periode an die Buchhaltung geben, das Ganze sichern.
         * Jeder einzelne ist geprüft — **die Reihenfolge war es nicht**, und
         * genau dort saßen die Funde der letzten Tage: eine Nummer, die
         * zweimal gezogen wurde, ein Betreff, der den Belegtext mitnahm, ein
         * Einkaufswert, der als Umsatz gezählt hätte.
         *
         * > **Was einzeln läuft, läuft nicht deshalb hintereinander.**
         *
         * Sie laufen deshalb hier, in der einen Probe, die den ganzen Weg
         * fährt — mit echtem PHP, echtem Browser und echter Akte in einem
         * Wegwerfordner.
         */
        const ruf = (werkzeug, argumente) => {
          const r = spawnSync(process.execPath, [join(SHOP, 'bin', werkzeug), ...argumente],
            { cwd: SHOP, encoding: 'utf8', env: { ...werkzeugumgebung, VORGANG_ABLAGE: akte } });
          return { code: r.status, aus: `${r.stdout ?? ''}${r.stderr ?? ''}` };
        };

        const gelesen = ruf('akte.mjs', ['--vorgang', '2026-9001']);
        if (gelesen.code !== 0 || !/RE-2026-0001\.txt \(\d+ Zeichen\)/.test(gelesen.aus)) {
          probleme.push(`die Akte liest den Vorgang nicht zurück: ${gelesen.aus.trim().split('\n').slice(-3).join(' | ')}`);
        } else if (gelesen.aus.includes('Baustellenweg')) {
          // Die Übersicht zeigt, **was** abgelegt ist, nicht **was darin steht**.
          probleme.push('die Aktenübersicht schreibt die Anschrift des Kunden auf den Bildschirm');
        } else {
          bestanden.push('Die Akte liest den Vorgang zurück und nennt Beleg und Frist');
        }

        /*
         * **Das letzte Papier ohne Durchgang — 13. September 2026.**
         *
         * Von den sechs Papierarten fuhr diese Probe nach gestern fünf. Die
         * **Absage** fehlte — der vierte Brief an einen Kunden, und der
         * einzige, der ein *Nein* ist.
         *
         * Sie kann nicht in denselben Vorgang: Seit heute früh schließen
         * Absage und Auftragsbestätigung einander aus (AGB Punkt 2), und das
         * Werkzeug bricht ab. Sie bekommt deshalb einen **eigenen Vorgang** —
         * und das ist keine Krücke, sondern der Fall selbst: Der Abzweig
         * heißt „Der Fall kommt nicht zustande".
         */
        const abgesagt = ruf('vorgang.mjs', [join(ziel, 'anfrage.txt'),
          '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9002',
          '--datum', '2026-09-13', '--stufe', 'absage', '--ablegen']);
        const absagedurchschrift = join(akte, belegordner(2026), 'AS-2026-9002.txt');
        if (abgesagt.code !== 0 || !existsSync(absagedurchschrift)) {
          probleme.push(`die Absage entsteht nicht: ${abgesagt.aus.trim().split('\n').slice(-3).join(' | ')}`);
        } else {
          const text = readFileSync(absagedurchschrift, 'utf8');
          /*
           * **Sie erfindet keinen Grund, sie übersetzt einen.** `src/absage.js`
           * gibt jedem Grund, den `darfVorgangLaufen` ausrechnet, einen Satz
           * an den Kunden — und dazu, was er tun kann. Eine Absage ohne
           * nächsten Schritt ist bei einem Kunden, der schon bestellt hat,
           * teurer als bei einem Besucher.
           */
          if (!/Was Sie tun können/.test(text)) {
            probleme.push('die Absage sagt dem Kunden nicht, was er tun kann');
          } else if (!/Ein Vertrag ist damit nicht zustande gekommen/.test(text)) {
            probleme.push('die Absage sagt nicht, dass kein Vertrag zustande gekommen ist');
          } else {
            bestanden.push('Die Absage geht als eigener Vorgang hinaus und nennt ihren Grund');
          }
        }
        /*
         * **Und ein Schalter, den diese Stufe nicht kennt — 13. September 2026.**
         *
         * `--grund` gehört zur Gutschrift. Bei der Absage lief er bis heute
         * stillschweigend durch: Der Brief nannte einen ganz anderen Grund,
         * und der eingetippte stand weder auf dem Papier noch im Journal.
         */
        const mitGrund = ruf('vorgang.mjs', [join(ziel, 'anfrage.txt'),
          '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9003',
          '--datum', '2026-09-13', '--stufe', 'absage',
          '--grund', 'Baustelle außerhalb des Liefergebiets', '--ablegen']);
        if (mitGrund.code === 0) {
          probleme.push('die Absage nimmt --grund an und schreibt einen anderen Grund auf den Brief');
        } else if (!/gehört zur Gutschrift/.test(mitGrund.aus)) {
          probleme.push(`die Absage lehnt --grund ab, sagt aber nicht warum: ${mitGrund.aus.trim().split('\n').slice(-2).join(' | ')}`);
        } else if (existsSync(join(akte, belegordner(2026), 'AS-2026-9003.txt'))) {
          probleme.push('abgewiesen und trotzdem abgelegt');
        } else {
          bestanden.push('Ein Schalter, den die Absage nicht kennt, wird abgelehnt statt verschluckt');
        }

        const vorherRechnung = readFileSync(durchschrift, 'utf8');
        const storno = ruf('vorgang.mjs', [join(ziel, 'anfrage.txt'),
          '--kunde', join(ziel, 'kunde.json'), '--nummer', '2026-9001', '--stufe', 'gutschrift',
          '--storniert', 'RE-2026-0001', '--grund', 'Probelauf', '--ablegen']);
        const gutschrift = join(akte, belegordner(2026), 'GS-2026-0001.txt');
        if (storno.code !== 0 || !existsSync(gutschrift)) {
          probleme.push(`die Rechnung lässt sich nicht aufheben: ${storno.aus.trim().split('\n').slice(-3).join(' | ')}`);
        } else if (readFileSync(durchschrift, 'utf8') !== vorherRechnung) {
          // § 131 Abs 1 Z 6 BAO: Der ursprüngliche Inhalt muss feststellbar
          // bleiben — die Rechnung wird aufgehoben, nicht geändert.
          probleme.push('das Storno hat die Rechnung geändert statt sie aufzuheben');
        } else {
          bestanden.push('Die Gutschrift hebt die Rechnung auf, ohne sie zu ändern');
        }

        /*
         * **Die Zahl, an der die ganze Kette hängt.** Rechnung plus Gutschrift
         * ist null — und zwar netto **und** in der Steuer. Kommt hier etwas
         * anderes heraus, hat entweder die Gutschrift einen anderen Betrag als
         * die Rechnung, oder ein Papier ohne Umsatz ist mitgezählt worden.
         */
        const buch = ruf('buchhaltung.mjs', ['--jahr', '2026', '--monat', '9']);
        if (buch.code !== 0) {
          probleme.push(`der Auszug für die Buchhaltung läuft nicht: ${buch.aus.trim().split('\n').slice(-3).join(' | ')}`);
        } else if (!/Umsatzbelege \(Rechnung, Gutschrift\)\s+2/.test(buch.aus)) {
          probleme.push('der Auszug zählt nicht genau zwei Umsatzbelege');
        } else if (!/übrige Papiere ohne Umsatz\s+3/.test(buch.aus)) {
          /*
           * **Der Einkaufswert darf nicht mitzählen — seit dem 13. September
           * hier geprüft.** In der Akte liegen jetzt zwei Papiere ohne
           * Umsatz: die Auftragsbestätigung, die Lieferantenbestellung und
           * die Absage. Die zweite trägt den **Einkaufswert**; zählte sie
           * mit, stünde der Einkauf mit umgekehrtem Vorzeichen in der
           * Voranmeldung.
           */
          probleme.push('der Auszug zählt die Papiere ohne Umsatz nicht richtig');
        } else if (!/Bemessungsgrundlage netto\s+0,00 €/.test(buch.aus)
          || !/Umsatzsteuer\s+0,00 €/.test(buch.aus)) {
          probleme.push('Rechnung und Gutschrift heben sich im Auszug nicht auf');
        } else {
          bestanden.push('Der Auszug für die Buchhaltung zählt nur Umsätze, und sie heben sich auf');
        }

        const gesichert = spawnSync(process.execPath, [join(SHOP, 'bin', 'sicherung.mjs')],
          { cwd: SHOP, encoding: 'utf8', env: { ...werkzeugumgebung, SICHERUNG_ORDNER: akte } });
        const stext = `${gesichert.stdout ?? ''}${gesichert.stderr ?? ''}`;
        const kopien = existsSync(join(akte, belegordner(2026), '.sicherung'))
          ? readdirSync(join(akte, belegordner(2026), '.sicherung')) : [];
        if (gesichert.status !== 0) {
          probleme.push(`die Sicherung läuft nicht: ${stext.trim().split('\n').slice(-3).join(' | ')}`);
        } else if (kopien.length < 2) {
          // Die Durchschriften liegen in einem **Unterordner**. Eine
          // Sicherung, die nur die oberste Ebene sieht, meldet trotzdem
          // „gesichert" — bis zum 12. September tat sie genau das.
          probleme.push(`die Sicherung erreicht die Durchschriften nicht (${kopien.length} Kopien)`);
        } else {
          bestanden.push('Die Sicherung erreicht auch die Durchschriften in den Unterordnern');
        }

        /*
         * **Die zwei Hälften treffen sich hier — 12. September 2026, abends.**
         *
         * Bis zu diesem Schritt zeigt die Probe, dass die Werkzeuge eine Akte
         * **bauen**; `npm run pruefe-ablage` zeigt, dass eine Akte **trägt**.
         * Getroffen haben sie sich nie: Der Prüfer las nur das Verzeichnis,
         * und die einzige Akte, die es gibt, entsteht hier in einem
         * Wegwerfordner. Alle seine Regeln waren an von Hand gebauten
         * Beispielen gezeigt und noch nie an einer Akte, die die Werkzeuge
         * selbst erzeugt haben.
         *
         * > **Er läuft absichtlich nach der Sicherung.** Die datierten Kopien
         * > liegen dann schon in `.sicherung`, und seit heute abend erkennen
         * > die drei Muster sie — für den Ort. Zählte der Abgleich sie mit,
         * > meldete er jede gesicherte Akte als doppelt geführt.
         */
        const geprueft = spawnSync(process.execPath, [join(SHOP, 'bin', 'ablagepruefung.mjs')],
          { cwd: SHOP, encoding: 'utf8', env: { ...werkzeugumgebung, VORGANG_ABLAGE: akte } });
        const ptext = `${geprueft.stdout ?? ''}${geprueft.stderr ?? ''}`;
        // Geprüft wird, dass er die Akte **angesehen** hat, nicht nur, dass er
        // still blieb: Ein Prüfer, der nichts findet, weil er nichts liest,
        // sieht von außen aus wie ein bestandener Lauf. Die Zahl der Journale
        // steht bewusst nicht fest — seit heute abend zählt der Stand aus
        // `.sicherung` für den Ort mit.
        if (!/Probeakte aus VORGANG_ABLAGE: [1-9]\d* Journal/.test(ptext)
          || !/journal-2026\.jsonl: [1-9]\d* Eintrag\/Datei abgeglichen/.test(ptext)) {
          probleme.push('der Prüfer der Ablage sieht die Probeakte nicht an');
        } else if (geprueft.status !== 0) {
          probleme.push(`die gebaute Akte hält dem Prüfer nicht stand: ${ptext.trim().split('\n').filter((z) => z.includes('✗')).join(' | ')}`);
        } else {
          bestanden.push('Die gebaute Akte hält npm run pruefe-ablage stand');
        }
      }
    }
  }

  // **Gezählt wird, was geprüft wurde.** Ohne die Zahl sähe eine Probe, die
  // nach dem ersten Schritt abbricht, genauso still aus wie eine bestandene —
  // dieselbe Regel wie im Prüferregister.
  console.log(`Bestellprobe — ${bestanden.length + probleme.length} Prüfungen `
    + 'von Klick bis Sicherung\n');
  for (const b of bestanden) console.log(`  ✓ ${b}`);
  console.log('');
  if (probleme.length) {
    for (const p of probleme) console.log(`  ✗ ${p}`);
    console.log(`\n${probleme.length} Meldung(en). Der Weg vom Klick bis in die Ablage trägt nicht.`);
    process.exit(1);
  }
  console.log('Der Weg trägt: Klick, Empfangsskript, Ablage, Posteingang, Angebot,');
  console.log('Vertrag, Lieferantenbestellung, Rechnung, Akte, Gutschrift, Absage,');
  console.log('Buchhaltung, Sicherung, Prüfer.');
  console.log('Die Papierkette läuft ganz durch, und der Prüfer der Ablage hat die');
  console.log('gebaute Akte gesehen —');
  console.log('was dazwischen in der Welt geschieht (der Zahlungseingang und die Lieferung),');
  console.log('steht in der Betriebskette und bleibt dort stehen.');
} finally {
  server.kill();
}
