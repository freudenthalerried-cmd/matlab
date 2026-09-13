#!/usr/bin/env node
/**
 * Jede gebaute Seite im 390-px-Rahmen — nicht neun ausgesuchte.
 *
 * Die Shopprobe misst neun von Hand gewählte Seiten in einem 390 px breiten
 * `<iframe>`. Das hat einen echten Fehler gefunden (die AGB-Überschrift
 * „Geschäftsbedingungen", 437 px breit, 82 px Seitwärtsrollen) und ist
 * trotzdem eine Stichprobe: Wer die zehnte Seite baut, misst sie nicht.
 *
 * Genau das steht bevor. Das Sortiment soll auf mindestens hundert Artikel
 * wachsen; jeder neue Artikel bringt eine neue Seite mit, und niemand wird
 * für hundert Artikelseiten Szenarien von Hand schreiben. Dieser Prüfer
 * zählt deshalb nicht Szenarien, sondern **liest den Bestand**: Was in
 * `ausgabe/site/` als `.html` liegt, wird gemessen.
 *
 * Gemessen werden zwei Dinge, und das zweite ist nicht überflüssig:
 *
 * 1. **Rollt die Seite seitwärts?** `scrollTo(9999, 0)`, danach `scrollX`.
 *    Das ist der Test, der nicht lügt — anders als `scrollWidth`, der auch
 *    Inhalt zählt, der in einem eigenen Scrollkasten liegt und dort
 *    hingehört.
 * 2. **Steht alles, was über 390 px hinausreicht, in einem Scrollkasten?**
 *    Ein einziges `overflow-x: hidden` auf dem Rumpf würde Messung 1 für
 *    immer bestehen lassen und dabei den Inhalt abschneiden statt ihn
 *    erreichbar zu machen. Messung 2 sieht diesen Unterschied: Sie sucht
 *    Elemente, deren rechte Kante jenseits von 390 px liegt und die **kein**
 *    scrollendes Elternteil haben. „Scrollend" wird über den berechneten
 *    Stil ermittelt, nicht über die Klasse `.scroll` — sonst prüfte der
 *    Prüfer die eigene Schreibweise statt die Wirkung.
 *
 * Befund beim ersten Lauf: 81 von 81 Seiten in Ordnung. Acht Seiten tragen
 * Tabellen bis 667 px Breite — alle acht in einem Scrollkasten, keine
 * schiebt den Rumpf. Der Prüfer wurde gegengeprobt, indem eine dieser
 * Tabellen aus ihrem Kasten genommen wurde; siehe
 * `docs/baustoff-shop/rahmen-fuer-jede-seite.md`.
 *
 * Warum ein eigener Befehl und nicht ein Anhang an `npm run shopprobe`:
 * Der Zensus braucht 81 Chromium-Starts (rund 30 Sekunden), die Shopprobe
 * 34. Wer eine Änderung am Warenkorb prüft, will nicht auf den Zensus
 * warten; wer eine Seite hinzufügt, will genau ihn.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const hier = fileURLToPath(new URL('.', import.meta.url));
const siteOrdner = join(hier, '..', 'ausgabe', 'site');
const ANFANG = 'ZENSUS-ANFANG';
const ENDE = 'ZENSUS-ENDE';
const RAHMENBREITE = 390;

/** Nur eine Umgebungsvariable, damit die Gegenprobe nicht den Bestand ändern muss. */
const NUR = process.env.ZENSUS_NUR ? process.env.ZENSUS_NUR.split(',') : null;

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

/** Alle gebauten Seiten, als Kennung ohne `.html`. Der Bestand, nicht eine Liste. */
function alleSeiten(ordner, wurzel = ordner) {
  const raus = [];
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) raus.push(...alleSeiten(pfad, wurzel));
    else if (eintrag.endsWith('.html')) {
      raus.push(relative(wurzel, pfad).split(sep).join('/').replace(/\.html$/, ''));
    }
  }
  return raus.sort();
}

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function rahmenSeite(kennung) {
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0}iframe{width:${RAHMENBREITE}px;height:2600px;border:0;display:block}</style>
<iframe id="f" src="/${kennung}.html"></iframe>
<script>
setTimeout(function () {
  var aus;
  try {
    var f = document.getElementById('f'), d = f.contentDocument, w = f.contentWindow;
    // Ein Element ist entschuldigt, wenn es selbst oder ein Vorfahr waagrecht
    // scrollt. Ermittelt über den berechneten Stil — nicht über eine Klasse.
    function imKasten(n) {
      for (var e = n; e && e !== d.body; e = e.parentElement) {
        var o = w.getComputedStyle(e).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
      }
      return false;
    }
    var ueber = [];
    d.querySelectorAll('body *').forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.width > 0 && r.right > ${RAHMENBREITE} + 1 && !imKasten(n)) {
        ueber.push(n.tagName.toLowerCase()
          + (n.className ? '.' + String(n.className).trim().split(/\\s+/)[0] : '')
          + ' bis ' + Math.round(r.right) + ' px');
      }
    });
    // Erst messen, dann rollen. Andersherum verschiebt das seitwärts
    // gerollte Fenster jede Kante um genau den Betrag nach links, den es
    // aufzudecken gilt — die Übeltäter enden dann rechnerisch bei 390 px,
    // und Messung 2 findet nichts. Gegengeprobt: mit vertauschter
    // Reihenfolge meldete die Kaminzug-Seite 18 px Seitwärtsrollen und
    // null Elemente über der Kante.
    w.scrollTo(9999, 0);
    aus = JSON.stringify({ scrollX: Math.round(w.scrollX), ueber: ueber.slice(0, 5),
                           ueberZahl: ueber.length,
                           h1: (d.querySelector('h1') || {}).textContent || null });
  } catch (fehler) { aus = JSON.stringify({ zugriff: String(fehler.message) }); }
  var o = document.createElement('div');
  o.textContent = '${ANFANG.slice(0, 4)}' + '${ANFANG.slice(4)}' + aus + '${ENDE.slice(0, 4)}' + '${ENDE.slice(4)}';
  document.documentElement.append(o);
}, 1200);
</script>`;
}

function starteServer() {
  return new Promise((fertig, schiefgegangen) => {
    const server = createServer((anfrage, antwort) => {
      try {
        const url = new URL(anfrage.url, 'http://127.0.0.1');
        if (url.pathname === '/__rahmen') {
          antwort.writeHead(200, { 'content-type': TYPEN['.html'] });
          antwort.end(rahmenSeite(url.searchParams.get('ziel') ?? 'index'));
          return;
        }
        const ziel = join(siteOrdner, url.pathname.replace(/^\/+/, ''));
        if (!ziel.startsWith(siteOrdner) || !existsSync(ziel)) {
          antwort.writeHead(404).end('nicht gefunden');
          return;
        }
        antwort.writeHead(200, { 'content-type': TYPEN[extname(ziel)] ?? 'application/octet-stream' });
        antwort.end(readFileSync(ziel));
      } catch (fehler) {
        antwort.writeHead(500).end(String(fehler.message));
      }
    });
    server.on('error', schiefgegangen);
    server.listen(0, '127.0.0.1', () => fertig(server));
  });
}

const chromium = findeChromium();
if (!chromium) {
  console.error('Kein Chromium gefunden (PLAYWRIGHT_BROWSERS_PATH oder /opt/pw-browsers).');
  console.error('Der Rahmenzensus ist damit NICHT gelaufen.');
  process.exit(2);
}
if (!existsSync(siteOrdner)) {
  console.error('ausgabe/site/ fehlt — zuerst npm run website.');
  process.exit(2);
}

// Dieselben Flaggen wie in der Shopprobe: kein Weg nach außen. Die Seiten
// binden Schriften von fonts.googleapis.com ein; über den Ausgangsproxy
// **hängt** dieser Aufruf, hält den Parser an, und die Seite bekommt kein
// Skript. Ohne Proxy scheitert er sofort, und gemessen wird der Umbruch mit
// den Ersatzschriften der Maschine — das ist die Grenze dieser Messung.
const GRUNDFLAGGEN = ['--no-sandbox', '--headless', '--disable-gpu',
  '--proxy-server=127.0.0.1:9', '--proxy-bypass-list=127.0.0.1',
  '--virtual-time-budget=4000', '--dump-dom'];
const OHNE_PROXY = {
  ...process.env,
  HTTPS_PROXY: '', HTTP_PROXY: '', https_proxy: '', http_proxy: '',
  NO_PROXY: '*', no_proxy: '*',
};
const fuehreAus = promisify(execFile);
const GLEICHZEITIG = 6;

const seiten = alleSeiten(siteOrdner).filter((k) => !NUR || NUR.includes(k));
// Ein Prüfer, dessen Voreinstellung nicht auf den Bestand zeigt, meldet
// „alles in Ordnung", weil er nichts gefunden hat. Leer ist ein Fehler.
if (seiten.length === 0) {
  console.error('Keine Seite gefunden. Ein Zensus über null Seiten ist kein Befund.');
  process.exit(2);
}

console.log(`Rahmenzensus: ${seiten.length} Seiten in einem Rahmen von ${RAHMENBREITE} px\n`);

const server = await starteServer();
const adresse = `http://127.0.0.1:${server.address().port}`;
let auffaellig = 0;
let mitScrollkasten = 0;

async function miss(kennung) {
  try {
    const { stdout } = await fuehreAus(chromium,
      [...GRUNDFLAGGEN, `${adresse}/__rahmen?ziel=${encodeURIComponent(kennung)}`],
      { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 90_000, env: OHNE_PROXY });
    const treffer = stdout.match(new RegExp(`${ANFANG}([\\s\\S]*?)${ENDE}`));
    if (!treffer) return { kennung, probleme: ['keine Messung — die Rahmenseite hat nichts berichtet'] };
    const m = JSON.parse(treffer[1]);
    if (m.zugriff) return { kennung, probleme: [`kein Zugriff auf den Rahmen: ${m.zugriff}`] };
    const probleme = [];
    if (m.scrollX > 0) probleme.push(`rollt ${m.scrollX} px seitwärts`);
    if (m.ueberZahl > 0) {
      probleme.push(`${m.ueberZahl} Element(e) über ${RAHMENBREITE} px ohne Scrollkasten: ${m.ueber.join(', ')}`);
    }
    // Eine Seite ohne h1 hat wahrscheinlich gar nicht geladen. Ohne diese
    // Prüfung bestünde eine leere Seite den Zensus mühelos.
    if (!m.h1) probleme.push('keine Überschrift gefunden — hat die Seite geladen?');
    return { kennung, probleme };
  } catch (fehler) {
    return { kennung, probleme: [`Chromium gestolpert: ${String(fehler.message).slice(0, 120)}`] };
  }
}

try {
  for (let start = 0; start < seiten.length; start += GLEICHZEITIG) {
    const teil = seiten.slice(start, start + GLEICHZEITIG);
    for (const { kennung, probleme } of await Promise.all(teil.map(miss))) {
      if (probleme.length) {
        auffaellig++;
        console.log(`✗ ${kennung}`);
        for (const p of probleme) console.log(`    ${p}`);
      }
    }
  }
} finally {
  server.close();
}

console.log(`\n${seiten.length - auffaellig} von ${seiten.length} Seiten rollen bei ${RAHMENBREITE} px nicht seitwärts.`);
if (auffaellig) console.log(`${auffaellig} auffällig.`);
process.exit(auffaellig ? 1 : 0);
