#!/usr/bin/env node
/**
 * Verhaltensprobe des Shops — die gebaute Seite im echten Headless-Chromium.
 *
 *   node bin/shopprobe.mjs
 *
 * Warum eine zweite Probe neben `oberflaechenprobe.mjs`: Jene prüft
 * `demo.html`, die Arbeitsoberfläche des Rechenkerns. Diese prüft
 * `ausgabe/website.html`, den **Shop** — Suche, Filter, Warenkorb, Kasse.
 * Beides sind verschiedene Seiten mit verschiedenen Fehlern.
 *
 * Die Lehren aus der ersten Probe stecken auch hier drin:
 *
 * 1. **Jedes Szenario beweist mit einem Marker, dass es gelaufen ist.** Eine
 *    Probe ohne Marker gilt als Fehlschlag, nicht als bestanden.
 * 2. **Geprüft wird nur der gerenderte Text** zwischen zwei Markern, nicht
 *    das ganze Dokument. Der eingebettete Rechenkern steht als Quelltext in
 *    der Seite; ein Grep darüber fände jeden Erwartungstext in einem
 *    String-Literal und meldete Grün für Szenarien, die nie liefen.
 *
 * Genutzt wird die Einzeldateifassung: Sie navigiert über die Raute, also
 * ohne neuen Seitenladevorgang. Damit ist die Probe unabhängig davon, ob
 * `localStorage` unter `file://` erlaubt ist — der Warenkorb lebt im
 * laufenden Skript. Dass er auch **über einen Seitenwechsel hinweg** hält,
 * ist eine Eigenschaft des Speichers und wird im Testlauf geprüft
 * (`shopkern.test.js`), nicht hier.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hier = fileURLToPath(new URL('.', import.meta.url));
const shopDatei = join(hier, '..', 'ausgabe', 'website.html');
const siteOrdner = join(hier, '..', 'ausgabe', 'site');
const ANFANG = 'SHOPPROBE-ANFANG';
const ENDE = 'SHOPPROBE-ENDE';

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

/** Wartet, bis die Rautennavigation den neuen Inhalt gezeichnet hat. */
const GEHEZU = `
  async function geheZu(kennung) {
    location.hash = kennung;
    await new Promise((f) => setTimeout(f, 60));
  }
  const text = (wahl) => [...document.querySelectorAll(wahl)].map((n) => n.textContent).join(' | ');
`;

const SZENARIEN = [
  {
    name: 'Suche findet das Wort im zusammengesetzten Wort',
    // Der Grund für diesen Fall: Der erste Entwurf suchte nur Wortanfänge und
    // fand „Baumit KlebeSpachtel" bei der Eingabe „spachtel" nicht.
    aktionen: `
      await geheZu('suche?q=spachtel');
      out = text('#suche-ziel .karte .t');`,
    erwartet: ['KlebeSpachtel'],
  },
  {
    name: 'Suche grenzt mit zwei Wörtern ein statt zu erweitern',
    aktionen: `
      await geheZu('suche?q=xps%2050');
      out = text('#suche-ziel .karte .t');`,
    erwartet: ['XPS glatt SF 50 mm'],
    verboten: ['100 mm', '30 mm'],
  },
  {
    name: 'Suche schweigt lieber, als etwas zu erfinden',
    aktionen: `
      await geheZu('suche?q=dachziegel');
      out = text('#suche-kopf') + ' | ' + text('#suche-ziel .antwort');`,
    erwartet: ['Kein Treffer', 'Was nicht darin steht, führen wir nicht'],
  },
  {
    name: 'Artikel in den Warenkorb legen zählt hoch',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.getElementById('menge-POS-12566').value = '4';
      document.querySelector('[data-legen="POS-12566"]').click();
      out = 'Zaehler:' + document.querySelector('[data-korbzaehler]').textContent;`,
    erwartet: ['Zaehler:4'],
  },
  {
    name: 'Der Warenkorb rechnet Fracht und Sperrgutzuschlag getrennt aus',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .preistafel');`,
    // POS-12566 ist palettiert: 75,50 Pauschale plus 7,50 Kranentladung.
    erwartet: ['83,00 €', 'Pauschale plus 1× Sperrgutzuschlag', '20 % USt'],
  },
  {
    name: 'Der Warenkorb überlebt den Seitenwechsel',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('wissen/baumeisterpreis');
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .korbzeile .kz-t');`,
    erwartet: ['Fassaden EPS'],
  },
  {
    name: 'Kasse: Perg liegt im Liefergebiet',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = 'Perg';
      sel.dispatchEvent(new Event('change'));
      out = text('#kasse-ziel .gebiet');`,
    erwartet: ['Wir liefern nach Perg'],
  },
  {
    name: 'Kasse: ein anderer Bezirk wird abgelehnt, mit Grund',
    // Gate 23 in der Oberfläche. Die Liste kommt aus liefergebiet.js.
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = '__anderer__';
      sel.dispatchEvent(new Event('change'));
      out = text('#kasse-ziel .gebiet');`,
    erwartet: ['Außerhalb des Liefergebiets', 'Perg'],
  },
  {
    name: 'Die Kasse löst nichts aus und sagt das auch',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      out = text('#kasse-ziel .antwort');`,
    erwartet: ['Hier endet die Vorschau', 'Zahlungsanbieter ist nicht gewählt'],
    verboten: ['Bestellung ausgelöst'],
  },
  {
    name: 'Der Warenkorb nennt das Gewicht und sagt, wo es fehlt',
    // POS-10095 (Kanalrohr) hat ein belegtes Gewicht, POS-12566 (EPS) nicht.
    aktionen: `
      await geheZu('artikel/POS-10095');
      document.getElementById('menge-POS-10095').value = '10';
      document.querySelector('[data-legen="POS-10095"]').click();
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .preistafel');`,
    erwartet: ['17,33 kg', '1 Position ohne belegtes Gewicht'],
  },
  {
    name: 'Der Warenkorb sagt es, wenn die Fracht die Ware übersteigt',
    // Dieselbe Haltung wie bei der Zahlungsgebühr, die im Angebot gefehlt
    // hat: Die unangenehme Zahl steht auf der Seite, nicht erst auf der
    // Rechnung.
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .antwort');`,
    erwartet: ['Die Fracht kostet hier mehr als die Ware', 'lieber hier als auf der Rechnung'],
  },
  {
    name: 'Der Filter grenzt ein und sagt, wie viel übrig bleibt',
    aktionen: `
      await geheZu('gruppe/daemmung');
      const s = document.querySelector('#filterleiste select');
      s.value = 'preis-auf';
      s.dispatchEvent(new Event('change'));
      const preise = [...document.querySelectorAll('#warenraster .karte .preis')]
        .map((n) => n.textContent.split(' €')[0]);
      out = 'erste:' + preise[0] + ' letzte:' + preise[preise.length - 1]
        + ' | ' + text('#filterleiste .f-zahl');`,
    erwartet: ['9 Artikel'],
  },
  {
    name: 'Preisvorteil-Filter wirft die Artikel ohne Vergleichspreis heraus',
    aktionen: `
      await geheZu('index');
      const schalter = [...document.querySelectorAll('#filterleiste input[type=checkbox]')][0];
      schalter.click();
      out = text('#filterleiste .f-zahl');`,
    erwartet: ['von 46 Artikeln'],
  },
  {
    name: 'Der Vorschlag unter dem Suchfeld zeigt Preis und Gruppe',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'kanalbogen';
      feld.dispatchEvent(new Event('input'));
      out = text('#suchvorschlag .vorschlag');`,
    erwartet: ['Kanalbogen', 'netto', 'Kanal'],
  },
];

/**
 * Szenarien, die die Seite in einem **schmalen Rahmen** messen.
 *
 * Warum eigens: Headless-Chromium erzwingt in dieser Umgebung eine
 * Fensterbreite von mindestens 500 px. Ein Bildschirmfoto mit
 * `--window-size=390` zeigt deshalb einen 500 px breiten Aufbau, von dem
 * 390 px abgeschnitten sind — es sieht aus wie ein Umbruchfehler und ist
 * keiner, und einen echten Umbruchfehler zeigt es nicht.
 *
 * Ein `<iframe width="390">` dagegen hat einen echten eigenen Viewport.
 * Darin gemessen wird, was zählt: **ob die Seite seitwärts scrollt.**
 * `scrollTo(9999, 0)` und danach `scrollX` ist der einzige Test, der nicht
 * lügt — `scrollWidth` allein zählt auch Inhalt, der in einem eigenen
 * Scrollkasten liegt und dort hingehört (Tabellen in `.scroll`).
 *
 * Gefunden hat diese Probe einen echten Fehler: „Geschäftsbedingungen" ist
 * als Überschrift 437 px breit; die AGB-Seite scrollte 82 px seitwärts.
 */
const RAHMENSZENARIEN = [
  { name: 'Startseite scrollt bei 390 px nicht seitwärts', kennung: 'index' },
  { name: 'AGB-Seite scrollt bei 390 px nicht seitwärts', kennung: 'rechtliches/agb' },
  { name: 'Artikelseite scrollt bei 390 px nicht seitwärts', kennung: 'artikel/POS-11082' },
  { name: 'Gruppenseite scrollt bei 390 px nicht seitwärts', kennung: 'gruppe/wdvs' },
  {
    name: 'Wissensseite mit langem Titel scrollt bei 390 px nicht seitwärts',
    kennung: 'wissen/perimeterdaemmung-und-grundmauerschutz',
  },
];

const chromium = findeChromium();
if (!chromium) {
  console.error('Kein Chromium gefunden (PLAYWRIGHT_BROWSERS_PATH oder /opt/pw-browsers).');
  console.error('Die Shopprobe ist damit NICHT gelaufen.');
  process.exit(2);
}
if (!existsSync(shopDatei) || !existsSync(siteOrdner)) {
  console.error('ausgabe/website.html oder ausgabe/site/ fehlt — zuerst npm run website.');
  process.exit(2);
}

const fuehreAus = promisify(execFile);

/**
 * Die Szenarien laufen **nebeneinander**.
 *
 * Ein Chromium-Start mit dieser Seite kostet rund dreizehn Sekunden — fast
 * alles davon Start und Parsen der 1,1 MB, nicht das Szenario selbst. Nach-
 * einander wären zwölf Szenarien knapp drei Minuten; nebeneinander sind es
 * gut zwanzig Sekunden. Die Grenze hält die Maschine bei Verstand.
 */
const GLEICHZEITIG = 6;

const seite = readFileSync(shopDatei, 'utf8');
const ablage = mkdtempSync(join(tmpdir(), 'shopprobe-'));
let fehlgeschlagen = 0;

async function laufe(s, i) {
  const sonde = `
<script type="module">
(async () => {
  ${GEHEZU}
  let out = '';
  try {
    ${s.aktionen}
  } catch (fehler) {
    out = '[[SONDE GESTOLPERT: ' + fehler.message + ']]';
  }
  const beweis = document.createElement('div');
  beweis.textContent = '${ANFANG.slice(0, 5)}' + '${ANFANG.slice(5)}' + out + '${ENDE.slice(0, 5)}' + '${ENDE.slice(5)}';
  document.documentElement.append(beweis);
})();
</script>`;
  const variante = join(ablage, `szenario-${i}.html`);
  writeFileSync(variante, seite + sonde);

  let dom = '';
  let fehler = null;
  try {
    const { stdout } = await fuehreAus(chromium, [
      '--no-sandbox', '--headless', '--disable-gpu',
      '--virtual-time-budget=2500', '--dump-dom', pathToFileURL(variante).href,
    ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 90_000 });
    dom = stdout ?? '';
  } catch (e) {
    fehler = e;
    dom = e.stdout ?? '';
  }

  const von = dom.indexOf(ANFANG);
  const bis = dom.indexOf(ENDE, von);
  const gerendert = von >= 0 && bis > von ? dom.slice(von + ANFANG.length, bis) : null;

  const probleme = [];
  if (fehler && gerendert === null) probleme.push(`Browser gescheitert: ${String(fehler.message).slice(0, 200)}`);
  if (gerendert === null) probleme.push('die Sonde ist nicht gelaufen — kein Marker in der Seite');
  else if (gerendert.includes('[[SONDE GESTOLPERT')) probleme.push(gerendert);
  else {
    for (const text of s.erwartet ?? []) {
      if (!gerendert.includes(text)) probleme.push(`fehlt im gerenderten Ergebnis: „${text}"`);
    }
    for (const text of s.verboten ?? []) {
      if (gerendert.includes(text)) probleme.push(`steht fälschlich im Ergebnis: „${text}"`);
    }
  }
  return { s, probleme, gerendert };
}

/** Misst eine Seite in einem 390-px-Rahmen. */
async function laufeRahmen(r, i) {
  const wrapper = join(ablage, `rahmen-${i}.html`);
  writeFileSync(wrapper, `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0}iframe{width:390px;height:2600px;border:0;display:block}</style>
<iframe id="f" src="${pathToFileURL(join(siteOrdner, r.kennung + '.html')).href}"></iframe>
<script>
setTimeout(function () {
  var f = document.getElementById('f'), aus;
  try {
    var d = f.contentDocument, w = f.contentWindow;
    w.scrollTo(9999, 0);
    // Die Überschrift wird mitgemeldet: Eine Messung an einer leeren Seite
    // ergibt immer „scrollX=0" und sähe wie ein bestandener Test aus. Genau
    // das ist beim ersten Anlauf passiert — der Rahmen zeigte die
    // Einzeldateifassung, deren Inhalt im iframe nicht aufgebaut wurde.
    var h1 = d.querySelector('h1');
    aus = 'scrollX=' + Math.round(w.scrollX) + ' breite=' + d.documentElement.scrollWidth
        + '/' + d.documentElement.clientWidth + ' h1=' + (h1 ? h1.textContent.trim().slice(0, 40) : 'KEINE');
  } catch (e) { aus = 'ZUGRIFF ' + e.message; }
  var o = document.createElement('div');
  o.textContent = '${ANFANG.slice(0, 5)}' + '${ANFANG.slice(5)}' + aus + '${ENDE.slice(0, 5)}' + '${ENDE.slice(5)}';
  document.documentElement.append(o);
}, 1200);
</script>`, 'utf8');

  let dom = '';
  try {
    const { stdout } = await fuehreAus(chromium, [
      '--no-sandbox', '--headless', '--disable-gpu', '--allow-file-access-from-files',
      '--virtual-time-budget=5000', '--dump-dom', pathToFileURL(wrapper).href,
    ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 90_000 });
    dom = stdout ?? '';
  } catch (e) { dom = e.stdout ?? ''; }

  const von = dom.indexOf(ANFANG);
  const bis = dom.indexOf(ENDE, von);
  const gerendert = von >= 0 && bis > von ? dom.slice(von + ANFANG.length, bis) : null;

  const probleme = [];
  if (gerendert === null) probleme.push('die Messung ist nicht gelaufen — kein Marker in der Seite');
  else if (gerendert.startsWith('ZUGRIFF')) probleme.push(gerendert);
  else {
    if (/h1=KEINE/.test(gerendert)) probleme.push(`die Seite war leer: ${gerendert}`);
    else if (!/scrollX=0\b/.test(gerendert)) probleme.push(`die Seite scrollt seitwärts: ${gerendert}`);
  }
  return { s: r, probleme, gerendert };
}

try {
  const ergebnisse = [];
  for (let start = 0; start < SZENARIEN.length; start += GLEICHZEITIG) {
    const teil = SZENARIEN.slice(start, start + GLEICHZEITIG);
    ergebnisse.push(...await Promise.all(teil.map((s, k) => laufe(s, start + k))));
  }
  for (let start = 0; start < RAHMENSZENARIEN.length; start += GLEICHZEITIG) {
    const teil = RAHMENSZENARIEN.slice(start, start + GLEICHZEITIG);
    ergebnisse.push(...await Promise.all(teil.map((r, k) => laufeRahmen(r, start + k))));
  }

  for (const { s, probleme, gerendert } of ergebnisse) {
    if (probleme.length) {
      fehlgeschlagen++;
      console.log(`✗ ${s.name}`);
      for (const p of probleme) console.log(`    ${p}`);
      if (gerendert !== null) console.log(`    gerendert war: ${gerendert.slice(0, 320).replace(/\s+/g, ' ')}`);
    } else {
      console.log(`✓ ${s.name}`);
    }
  }
} finally {
  rmSync(ablage, { recursive: true, force: true });
}

console.log(`\n${SZENARIEN.length + RAHMENSZENARIEN.length} Szenarien (davon ${RAHMENSZENARIEN.length} im 390-px-Rahmen), ${fehlgeschlagen} fehlgeschlagen.`);
process.exit(fehlgeschlagen ? 1 : 0);
