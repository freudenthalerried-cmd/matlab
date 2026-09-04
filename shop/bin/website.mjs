#!/usr/bin/env node
/**
 * Baut die vollständige Website aus Katalog und Inhalten.
 *
 * Zwei Ausgaben aus derselben Quelle:
 *
 *   ausgabe/site/…            echte Mehrseiten-Website zum Hochladen,
 *                             samt robots.txt, llms.txt und sitemap.xml
 *   ausgabe/website.html      dieselbe Website als eine Datei, mit
 *                             Rautenrouting — zum Ansehen ohne Server
 *
 * Der Grund für beides: Die Mehrseitenfassung ist das, was online geht; die
 * Einzeldatei ist das, was man herumzeigen kann, ohne etwas einzurichten.
 * Sie aus derselben Quelle zu bauen ist die einzige Art, sie gleich zu
 * halten — zwei getrennt gepflegte Fassungen laufen auseinander, und die
 * Vorschau zeigt dann etwas, das es nicht gibt.
 *
 * Verweise stehen in den Inhalten als gewöhnliche relative Links
 * (`../wissen/xps-oder-eps`). Der Generator löst sie zu einer logischen
 * Seitenkennung auf und setzt sie je Ausgabeart ein: als Dateipfad oder als
 * Raute. Ein Verweis, der ins Leere geht, wird gemeldet und nicht ausgegeben.
 *
 * Aufruf:  node bin/website.mjs
 */

import {
  readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, existsSync, rmSync, } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { ladeBaustoffkatalog, katalogbefund, ZIELMARGE } from '../src/baustoffkatalog.js';
import { pruefeSeiten } from '../src/interna.js';
import { artikelBild, gruppenBild, schichten, schichtbild, dickeMm, bauform } from '../src/bilder.js';
import { VERFUEGBARKEIT, angebotsAuszeichnung, robotsTxt, liefergebietOrte } from '../src/maschinenlesbar.js';
import { baueKern, BROWSERMODULE } from '../src/buendel.js';
import { startklar, fehltSatz } from '../src/startklar.js';
import {
  baubefund, oberflaeche, EMPFANGSSKRIPT, KONFIGURATIONSDATEI,
} from '../src/bestellwegbau.js';
import { VORAUSSETZUNGEN } from '../src/bestellweg.js';
import { BESTELLFELDER } from '../src/bestellfelder.js';
import { ohneKommentare } from '../src/entkommentieren.js';
import { preisJeKilo, kilotafel, mengenschritt } from '../src/gebinde.js';
import { EINHEITEN, aufzaehlung, jsonFuerSkript, kurzfassung } from '../src/format.js';
import { GRUPPENSEITE } from '../src/artikelliste.js';
import { preisstandSpanne } from '../src/preisalter.js';
import { HERSTELLER, marke } from '../src/hersteller.js';
import {
  oeffentlicherArtikel, oeffentlicherLieferant, vorteil, ustText, KORBSCHLUESSEL,
} from '../src/shopkern.js';
import { LIEFERGEBIET } from '../src/liefergebiet.js';
import { ZAHLWEGE, zahlwegName } from '../src/zahlung.js';
import { fracht } from '../src/preis.js';
import { lesKopf, alsHtml, alsText, alsListe, esc } from '../src/markdown.js';
import { wegwerfordner } from '../src/wegwerf.js';
import {
  erzeugeImpressum, pruefeBetreiberdaten, AGB_GLIEDERUNG, ZAHLUNGSBEDINGUNGEN,
  DATENSCHUTZ_GLIEDERUNG, websiteVerarbeitung, B2B_ABGRENZUNG, LIEFERHINWEISE, IMPRESSUMSFELDER,
} from '../src/rechtstexte.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');

/**
 * **Keine Schrift von einem fremden Server.**
 *
 * Bis zum 29.08. lud jede Seite drei Schriften über
 * `fonts.googleapis.com` und `fonts.gstatic.com`. Das ist bequem und in
 * Österreich ein Rechtsmangel: Der Browser des Besuchers baut die
 * Verbindung auf, **bevor** er irgendetwas gefragt wurde, und übermittelt
 * dabei seine IP-Adresse an einen Dritten. Das Landgericht München I hat am
 * 20.01.2022 (3 O 17493/20) genau dafür Schadenersatz zugesprochen, und die
 * Rechtsgrundlage fehlt hier wie dort: Eine Schriftart ist kein berechtigtes
 * Interesse, wenn dieselbe Schrift auch vom eigenen Server kommen kann.
 *
 * Aufgefallen ist es nicht beim Lesen der Rechtsseiten, sondern beim
 * Nachsehen, welche fremden Adressen die gebauten Seiten überhaupt
 * enthalten: 162 Vorkommen von `fonts.googleapis.com` in 81 Seiten.
 *
 * **Der Ausweg wäre das Selbsthosten** — die Dateien neben die Seite legen
 * und per `@font-face` einbinden. Aus dieser Umgebung ist er versperrt:
 * `fonts.googleapis.com` hängt am Ausgangsproxy, die Dateien lassen sich
 * nicht holen. Bis dahin gilt die Ersatzkette, die ohnehin in jeder
 * Schriftangabe steht — „Arial Narrow", `system-ui`, `ui-monospace`. Sie war
 * bisher nur nie zu sehen: In dieser Umgebung ist **jede** Messung und jedes
 * Bildschirmfoto dieses Shops mit den Ersatzschriften entstanden, weil die
 * Webschriften hier nie geladen haben. Der Shop sieht also aus, wie er
 * gemessen wurde.
 *
 * Wenn der Auftraggeber die Schriftdateien beilegt, wird aus dieser
 * Konstante ein `<style>` mit `@font-face` — eine Zeile, kein Umbau.
 */
const SCHRIFTEINBINDUNG = '';


/**
 * Ein Skript vor dem Schreiben parsen lassen.
 *
 * `node --check` in einem eigenen Prozess, wie es `build-demo.mjs` seit dem
 * EUR-Vorfall tut. Der Aufwand ist ein Prozessstart je Ausgabefassung; der
 * Ertrag ist, dass ein Fehler des Kommentarentferners den **Bau** anhält
 * statt die Seite.
 */
function pruefeSkript(quelle, name) {
  const ordner = wegwerfordner('skriptpruefung-');
  try {
    const datei = join(ordner, 'skript.mjs');
    writeFileSync(datei, quelle, 'utf8');
    const lauf = spawnSync(process.execPath, ['--check', datei], { encoding: 'utf8' });
    if (lauf.status !== 0) {
      console.error(`${name} parst nicht — der Bau wird abgebrochen.`);
      console.error(lauf.stderr);
      process.exit(2);
    }
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
}
const REPO = join(WURZEL, '..');
// Beides über die Umgebung überschreibbar — damit eine Probe den **echten**
// Bau mit anderen Antworten laufen lassen kann, ohne den Bestand anzufassen.
// Ohne das wäre die Zusage „der Text kommt aus den Daten" nur eine Zusage:
// Niemand könnte zeigen, dass er sich ändert, wenn die Daten sich ändern.
const AUSGABE = process.env.WEBSITE_AUSGABE || join(WURZEL, 'ausgabe');
const BETREIBERDATEI = process.env.STARTKLAR_BETREIBER || join(WURZEL, 'data', 'betreiber.json');

/**
 * **Der Bestellweg entscheidet über zwei Dinge zugleich** (Gate 26): ob
 * `bestellung.php` mitgeliefert wird und was die Datenschutzseite über den
 * Warenkorb sagt. Beides kommt aus derselben Stelle, weil zwei Schalter für
 * dieselbe Sache ein Schalter sind, den einer vergisst.
 */
const WEG = baubefund(JSON.parse(readFileSync(BETREIBERDATEI, 'utf8')), KORBSCHLUESSEL, VORAUSSETZUNGEN);
// Dieselbe Überschreibbarkeit wie bei der Betreiberdatei, aus demselben Grund:
// Die Lieferzeit entscheidet mit über „Bestellen ist möglich", steht aber in
// der Lieferantendatei. Ohne diesen Griff könnte eine Probe den Satz nie
// kippen sehen — sie könnte nur die halbe Lage beantworten.
const LIEFERANTENDATEI = process.env.WEBSITE_LIEFERANTEN || join(WURZEL, 'data', 'lieferanten.json');

/**
 * Die Adresse, unter der der Shop steht.
 *
 * **Weisung vom 31.08.2026: `bauversand.com`, gehostet bei All-Inkl.**
 *
 * Sie kommt aus `data/betreiber.json` und nicht mehr aus dieser Zeile. Bis
 * heute stand sie hier **und** ein zweites Mal fest verdrahtet in
 * `bin/kampagne.mjs`, wo sie die finalen URLs der Anzeigen bildet — zwei Wege
 * zu derselben Adresse, und der zweite wäre beim Wechsel alt geblieben. Dann
 * hätten die Anzeigen auf eine Adresse gezeigt, unter der nichts steht.
 *
 * **Kein Rückfall auf eine andere Adresse.** Der erste Entwurf fiel auf die
 * alte zurück, damit ein Bau ohne Betreiberdatei nicht scheitert. Das ist
 * genau die falsche Richtung: Die Seiten trügen dann still eine Adresse, unter
 * der nichts steht — Verweise, Sitemap und `llms.txt` inklusive. Ein Abbruch
 * ist sichtbar, eine tote Adresse in achtzig Seiten nicht.
 */
function basisAdresse(betreiber) {
  const roh = String(betreiber?.domain ?? '').trim().replace(/\/+$/, '');
  if (roh === '') {
    console.error('Abbruch: data/betreiber.json nennt keine `domain`.');
    console.error('Ohne sie bekämen Verweise, Sitemap und llms.txt eine Adresse,');
    console.error('unter der nichts steht — das fällt erst dem Besucher auf.');
    process.exit(2);
  }
  return roh;
}

const BASIS = basisAdresse(existsSync(BETREIBERDATEI)
  ? JSON.parse(readFileSync(BETREIBERDATEI, 'utf8'))
  : {});

/**
 * Zwei Namen, und sie dürfen nicht ineinanderfallen.
 *
 * `FIRMA` ist die **Betreiberin** — sie steht im Impressum, auf allen
 * Kundenbelegen und als `seller`/`publisher` in den strukturierten Daten. `MARKE` ist der
 * Name, unter dem der Laden auftritt: Logo, Seitentitel, `llms.txt`.
 *
 * **Weisung vom 3. September 2026:** Die Marke ist `Bauversand`, passend zur
 * Domain. Bis dahin trug die Kopfleiste aller 81 Seiten „Freudenthaler Bau
 * GmbH" — den Namen eines Baumeisterbetriebs, nicht den eines Shops.
 *
 * **Beide kommen jetzt aus `data/betreiber.json`.** `FIRMA` stand hier als
 * fest verdrahtete Zeichenkette — dieselbe Bauart wie die Adresse vor dem
 * 31. August, und dieselbe Falle: Ein Name an zwei Stellen wandert an einer
 * nicht mit. Fehlt `marke`, tritt die Firma an ihre Stelle; ein Shop ohne
 * Namen wäre schlimmer als einer mit dem falschen.
 */
const BETREIBER = existsSync(BETREIBERDATEI)
  ? JSON.parse(readFileSync(BETREIBERDATEI, 'utf8'))
  : {};
const FIRMA = BETREIBER.firma || 'Freudenthaler Bau GmbH';
const MARKE = BETREIBER.marke || FIRMA;
const ORT = BETREIBER.ort || 'Ried in der Riedmark';

/**
 * Die Organisation, wie eine Maschine sie lesen soll — **einmal, für alle
 * Seiten.**
 *
 * **Der Befund, 3. September 2026, nachmittags.** Nach dem Markenwechsel trug
 * die Startseite `name: "Bauversand", legalName: "Freudenthaler Bau GmbH"`.
 * Auf allen übrigen 80 Seiten stand als `publisher` und als `seller` weiter
 * allein die GmbH. Für einen Menschen ist das ein Schönheitsfehler; für die
 * Leser, auf die dieser Shop ausgelegt ist, sind es **zwei Organisationen**:
 * eine, die die Startseite betreibt, und eine, die alles verkauft und
 * herausgibt. Verbunden waren sie an genau einer Stelle.
 *
 * > **Wer zwei Namen führt, muss sie überall zusammen führen — sonst hat er
 * > zwei Firmen, von denen eine nichts verkauft.**
 *
 * Deshalb eine Funktion und keine drei Literale. `legalName` ist das Feld, das
 * schema.org dafür vorsieht; fehlt eine Marke, bleibt es bei der Firma allein.
 */
const organisation = () => (MARKE === FIRMA
  ? { '@type': 'Organization', name: FIRMA }
  : { '@type': 'Organization', name: MARKE, legalName: FIRMA });



/* ------------------------------------------------------------------ *
 * Inhalte einlesen
 * ------------------------------------------------------------------ */

function lesInhalte() {
  const seiten = new Map();
  for (const art of ['wissen', 'gruppen', 'system']) {
    const ordner = join(WURZEL, 'inhalte', art);
    if (!existsSync(ordner)) continue;
    for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.md')).sort()) {
      const { kopf, koerper } = lesKopf(readFileSync(join(ordner, datei), 'utf8'));
      const slug = kopf.slug ?? datei.replace(/\.md$/, '');
      const id = `${art === 'gruppen' ? 'gruppe' : art}/${slug}`;
      seiten.set(id, { id, art, slug, kopf, koerper, datei: `${art}/${datei}` });
    }
  }
  return seiten;
}

/**
 * Löst einen relativen Verweis aus einer Inhaltsdatei zur logischen Kennung auf.
 * `../wissen/x` aus `system/…` wird `wissen/x`, `x` aus `wissen/…` wird `wissen/x`.
 */
function loeseVerweis(ziel, vonArt) {
  if (/^(https?:|mailto:|#)/i.test(ziel)) return null;
  const eigen = vonArt === 'gruppen' ? 'gruppe' : vonArt;
  const teile = `${eigen}/${ziel}`.split('/');
  const stapel = [];
  for (const t of teile) {
    if (t === '..') stapel.pop();
    else if (t !== '.' && t !== '') stapel.push(t);
  }
  return stapel.join('/');
}

/**
 * Löst einen Eintrag aus `verwandt:` zur logischen Kennung auf.
 *
 * Konvention, ausdrücklich festgelegt statt geraten: Ein nackter Name meint
 * eine **Wissensseite** — das ist der Regelfall, weil dorthin fast alle
 * Querverweise gehen. Andere Gattungen werden mit Vorsatz geschrieben,
 * `system/kaminzug` oder `gruppe/kanal`.
 *
 * Die Alternative wäre, der Reihe nach in mehreren Gattungen zu suchen und
 * die erste Fundstelle zu nehmen. Das hätte einen Tippfehler stillschweigend
 * auf eine falsche, aber vorhandene Seite gelenkt — und ein Verweis, der
 * irgendwohin zeigt, ist schlimmer als einer, der meldet, dass er kaputt ist.
 */
function loeseVerwandt(eintrag) {
  const t = String(eintrag).trim();
  if (/^(https?:|mailto:|#)/i.test(t)) return null;
  return /^(wissen|system|gruppe|artikel)\//.test(t) ? t : `wissen/${t}`;
}

/* ------------------------------------------------------------------ *
 * Seitenrahmen
 * ------------------------------------------------------------------ */

function stil() {
  /*
   * **Die Farbwerte sind gerechnet, nicht gewählt.**
   *
   * Gemessen am 29.08. gegen WCAG 2.1: 4,5:1 für Fließtext, 3:1 für die
   * Umrandung von Bedienelementen. Vier Paare lagen im hellen Anstrich
   * darunter — und der helle ist der, den die meisten sehen:
   *
   * | Paar | vorher | jetzt |
   * |---|---|---|
   * | Gedämpft auf Grund | 4,14 | 5,24 |
   * | Gedämpft auf Fläche-2 | 3,65 | 4,62 |
   * | Ocker auf Grund (Verweise) | 4,17 | 4,92 |
   * | Knopfschrift auf Ocker | 4,17 | 4,92 |
   * | Feldumrandung auf Grund | 1,94 | 3,02 |
   *
   * Verschoben wurde so wenig wie nötig: `--gedaempft`, `--ocker` und
   * `--linie-stark` sind abgedunkelt, bis die Schwelle erreicht ist, nicht
   * weiter. Die Farbfamilie bleibt dieselbe.
   *
   * Im dunklen Anstrich lagen nur zwei Paare darunter; auch dort ist
   * nachgezogen. `--linie` bleibt, wie es war: Es zeichnet Trennlinien und
   * Kartenränder, die keine Bedienelemente sind — für sie verlangt WCAG
   * 1.4.11 nichts, und ein Kontrast, den niemand braucht, macht die Seite
   * nur unruhiger.
   */
  return `
:root{--grund:#F2F0EC;--flaeche:#FBFAF8;--flaeche-2:#E6E2DA;--tinte:#1B1A17;--tinte-2:#45423B;
--gedaempft:#68635A;--linie:#D6D1C6;--linie-stark:#908A7C;--ocker:#9C560F;--ocker-weich:#F6E6D2;
--gruen:#3E6B45;--gruen-weich:#DEEADF;--ziegel:#9C3521;--ziegel-weich:#F4DCD5;
--schmal:"Barlow Condensed","Arial Narrow",sans-serif;--text:"Source Sans 3",system-ui,-apple-system,sans-serif;
--zahl:"JetBrains Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--grund:#171614;--flaeche:#201E1B;
--flaeche-2:#2B2823;--tinte:#EDEAE3;--tinte-2:#C6C1B7;--gedaempft:#9A9488;--linie:#33302B;
--linie-stark:#787266;--ocker:#E0964A;--ocker-weich:#362514;--gruen:#8CBE95;--gruen-weich:#1D2A1F;
--ziegel:#E08A72;--ziegel-weich:#341913}}
:root[data-theme="dark"]{--grund:#171614;--flaeche:#201E1B;--flaeche-2:#2B2823;--tinte:#EDEAE3;
--tinte-2:#C6C1B7;--gedaempft:#9A9488;--linie:#33302B;--linie-stark:#787266;--ocker:#E0964A;
--ocker-weich:#362514;--gruen:#8CBE95;--gruen-weich:#1D2A1F;--ziegel:#E08A72;--ziegel-weich:#341913}
*{box-sizing:border-box}
body{margin:0;background:var(--grund);color:var(--tinte);font-family:var(--text);font-size:16px;
line-height:1.6;-webkit-font-smoothing:antialiased}
.huelle{max-width:64rem;margin:0 auto;padding:1.5rem 1.25rem 4rem}
/* Deutsche Komposita in großen Überschriften sprengen schmale Anzeigen:
   „Geschäftsbedingungen" ist bei 390 px Breite 437 px breit, und die
   AGB-Seite scrollte deshalb 82 px seitwärts. Die Seiten tragen
   lang="de-AT", ein Browser mit deutschem Trennwörterbuch trennt also
   sauber. Was den Fehler tatsächlich behebt, ist die zweite Regel:
   overflow-wrap auf body. Die Gegenprobe zeigt es — nur die
   Überschriftenregel zu entfernen ändert nichts, beide zu entfernen bringt
   die 82 px zurück. hyphens:auto bleibt trotzdem stehen, weil es auf einem
   echten Telefon den schöneren Umbruch macht; im Prüf-Chromium fehlt das
   Wörterbuch und es tut nichts.
   Gefunden durch Messung in einem 390-px-Rahmen, nicht durch Hinsehen —
   Headless-Chromium erzwingt 500 px Fensterbreite und schneidet das
   Bildschirmfoto einfach ab. */
h1,h2,h3,.kachel .t,.karte .t,.kz-t{overflow-wrap:break-word;hyphens:auto}
body{overflow-wrap:break-word}
h1,h2,h3,h4{font-family:var(--schmal);font-weight:600;margin:2rem 0 .6rem;text-wrap:balance;line-height:1.15}
h1{font-size:clamp(2rem,5vw,3rem);text-transform:uppercase;margin-top:.5rem}
h2{font-size:clamp(1.35rem,3vw,1.8rem);text-transform:uppercase;border-bottom:2px solid var(--linie-stark);padding-bottom:.25rem}
h3{font-size:1.15rem}h4{font-size:1rem;font-family:var(--text)}
p,ul,ol{margin:0 0 1rem}li{margin-bottom:.3rem}
a{color:var(--ocker)}
.kopfleiste{display:flex;flex-wrap:wrap;gap:.4rem 1rem;align-items:baseline;border-bottom:3px solid var(--tinte);padding-bottom:.7rem;margin-bottom:1rem}
.kopfleiste .logo{font-family:var(--schmal);font-weight:700;text-transform:uppercase;font-size:1.15rem;letter-spacing:.02em;text-decoration:none;color:var(--tinte)}
.kopfleiste nav{display:flex;gap:.15rem;flex-wrap:wrap;margin-left:auto}
.kopfleiste nav a{font-family:var(--schmal);text-transform:uppercase;font-size:.95rem;text-decoration:none;color:var(--tinte-2);padding:.15rem .55rem;border:1px solid var(--linie);border-radius:2px}
.kopfleiste nav a:hover{background:var(--flaeche-2);color:var(--tinte)}
.krume{font-size:.82rem;color:var(--gedaempft);margin-bottom:.5rem}
.krume a{color:var(--gedaempft)}
.lede{font-size:1.08rem;color:var(--tinte-2);max-width:44rem}
.antwort{border-left:4px solid var(--ocker);background:var(--ocker-weich);padding:.9rem 1.1rem;margin:1.2rem 0;color:var(--tinte-2)}
.liefernotiz{border:1px solid var(--linie);border-left:4px solid var(--linie);background:var(--flaeche-2);padding:.65rem .9rem;margin:1rem 0;font-size:.9rem;color:var(--tinte-2);max-width:52rem}
.liefernotiz strong{color:var(--tinte)}
.antwort strong{color:var(--tinte)}
blockquote{border-left:3px solid var(--linie-stark);margin:1.2rem 0;padding:.2rem 0 .2rem 1rem;color:var(--tinte-2)}
blockquote p:last-child{margin-bottom:0}
.scroll{overflow-x:auto;border:1px solid var(--linie);margin-bottom:1rem}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th,td{padding:.45rem .7rem;text-align:left;border-bottom:1px solid var(--linie);vertical-align:top}
th{font-family:var(--schmal);text-transform:uppercase;font-size:.85rem;background:var(--flaeche-2);white-space:nowrap}
tbody tr:last-child td{border-bottom:none}
code{font-family:var(--zahl);font-size:.86em;background:var(--flaeche-2);padding:.05em .3em;border-radius:2px}
hr{border:none;border-top:1px solid var(--linie);margin:2rem 0}
.raster{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:1px;background:var(--flaeche);border:1px solid var(--linie);margin-bottom:1.5rem}
.raster>*{outline:1px solid var(--linie)}
.karte .bild{display:block;background:var(--flaeche-2);margin:-1rem -1.1rem .7rem;padding:.7rem .6rem;border-bottom:1px solid var(--linie)}
svg.schema{display:block;width:100%;height:auto;max-height:7.5rem}
svg.schema.gruppe{max-height:5.5rem}
.kachel .bild{display:block;background:var(--flaeche-2);margin:-1rem -1.1rem .6rem;padding:.6rem;border-bottom:1px solid var(--linie)}
.artikelbild{background:var(--grund);border:1px solid var(--linie);padding:1.4rem;margin:0 0 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.9rem}
.bildhinweis{margin:0;max-width:34rem;text-align:center;font-size:.86rem;color:var(--gedaempft)}
.artikelbild svg.schema{max-height:12rem;max-width:22rem}
.schichtbild{background:var(--grund);border:1px solid var(--linie);padding:1.2rem .8rem;margin:0 0 1rem}
.schichtbild svg{display:block;width:100%;height:auto;max-width:32rem;margin:0 auto}
.mehr{font-family:var(--schmal);text-transform:uppercase;letter-spacing:.06em;font-size:.82rem}

/* --- Kopfleiste mit Suche und Warenkorb --- */
.kopfleiste{flex-wrap:wrap;gap:.6rem 1rem}
.suche{position:relative;flex:1 1 18rem;min-width:12rem}
#suchfeld{width:100%;font:inherit;font-size:.95rem;padding:.5rem .7rem;border:1px solid var(--linie-stark);background:var(--flaeche);color:var(--tinte);border-radius:0}
/* **Ein sichtbarer Fokus für alles, was bedienbar ist.**
   Gemessen am 29.08. im Browser: Die Artikelkarte hatte mit und ohne Fokus
   denselben Umriss — die Zierlinie auf .raster > * überschrieb den
   Fokusring des Browsers. Ein Kunde, der mit der
   Tastatur durch 46 Karten geht, sah nichts wandern. Die beiden zweiten
   zweite Regel ist **nicht** aus Vorrangsgründen nötig — das stand hier
   zuerst und war falsch: Der Universalselektor zählt für die Genauigkeit
   nicht, beide Regeln sind gleich genau, und die spätere gewinnt.
   Nachgemessen: Ohne die Zweitregel wandert der Ring trotzdem. Sie steht
   da, weil ein Raster ohne Zwischenraum baut — ein Ring mit Abstand nach
   außen liefe in die Nachbarkarte hinein, deshalb dort drei Pixel nach
   innen. */
:focus-visible{outline:2px solid var(--ocker);outline-offset:2px}
.raster>*:focus-visible,.kacheln>*:focus-visible{outline:3px solid var(--ocker);outline-offset:-3px}
/* Zum Inhalt springen — die Kopfleiste trägt neun Verweise, und ohne diesen
   einen muss ein Tastaturkunde sie auf jeder Seite durchlaufen. Sichtbar
   wird er erst, wenn er den Fokus hat. */
.springen{position:absolute;left:-9999px;top:0;background:var(--ocker);color:var(--grund);
padding:.6rem 1rem;z-index:10;text-decoration:none}
.springen:focus{left:0}
#suchfeld:focus-visible{outline:2px solid var(--ocker);outline-offset:1px}
.vorschlaege{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 2px);background:var(--flaeche);border:1px solid var(--linie-stark);max-height:22rem;overflow-y:auto;box-shadow:0 6px 24px rgba(0,0,0,.14)}
.vorschlag{display:flex;flex-direction:column;gap:.1rem;padding:.5rem .7rem;text-decoration:none;color:inherit;border-bottom:1px solid var(--linie)}
.vorschlag:last-child{border-bottom:0}
.vorschlag:hover,.vorschlag:focus-visible{background:var(--flaeche-2)}
.vorschlag.gewaehlt{background:var(--ocker-weich);outline:2px solid var(--ocker);outline-offset:-2px}
.vorschlag .v-t{font-family:var(--schmal);font-size:1.05rem;font-weight:600;line-height:1.2}
.vorschlag .v-a{font-size:.8rem;color:var(--gedaempft);font-variant-numeric:tabular-nums}
.korb{position:relative;font-family:var(--schmal);text-transform:uppercase;letter-spacing:.05em;font-size:.85rem;text-decoration:none;color:inherit;border:1px solid var(--linie-stark);padding:.45rem .8rem;white-space:nowrap}
.korb:hover{background:var(--flaeche-2)}
.korb .zahl{display:inline-block;margin-left:.45rem;min-width:1.35rem;padding:0 .3rem;text-align:center;background:var(--ocker);color:var(--grund);font-family:var(--zahl);font-size:.78rem;border-radius:999px}

/* --- Filterleiste --- */
.filterleiste{display:flex;flex-wrap:wrap;gap:.8rem 1.2rem;align-items:flex-end;padding:.9rem 1rem;background:var(--flaeche);border:1px solid var(--linie);margin-bottom:1rem}
.filterleiste .f{display:flex;flex-direction:column;gap:.2rem}
.filterleiste .f-b{font-family:var(--schmal);text-transform:uppercase;font-size:.75rem;letter-spacing:.06em;color:var(--ocker)}
.filterleiste select{font:inherit;font-size:.9rem;padding:.35rem .5rem;border:1px solid var(--linie-stark);background:var(--grund);color:var(--tinte)}
.filterleiste .f-schalter{flex-direction:row;align-items:center;gap:.4rem;font-size:.9rem}
.filterleiste .f-zahl{margin-left:auto;font-family:var(--zahl);font-size:.85rem;color:var(--gedaempft)}

/* --- In den Warenkorb --- */
.legen{display:flex;flex-wrap:wrap;gap:.7rem;align-items:flex-end;margin:0 0 1.5rem}
.legen .f-b{display:block;font-family:var(--schmal);text-transform:uppercase;font-size:.75rem;letter-spacing:.06em;color:var(--ocker);margin-bottom:.2rem}
.legen input{font:inherit;width:5.5rem;padding:.5rem;border:1px solid var(--linie-stark);background:var(--flaeche);color:var(--tinte);font-variant-numeric:tabular-nums}
.knopf{display:inline-block;font-family:var(--schmal);text-transform:uppercase;letter-spacing:.06em;font-size:.9rem;padding:.62rem 1.2rem;background:var(--ocker);color:var(--grund);border:1px solid var(--ocker);text-decoration:none;cursor:pointer}
.knopf:hover{filter:brightness(1.08)}
.knopf.getan{background:var(--gruen);border-color:var(--gruen)}
.knopf.gross{font-size:1rem;padding:.8rem 1.6rem;margin-top:1rem}

/* --- Warenkorbseite --- */
.korbblock{border:1px solid var(--linie);background:var(--flaeche);padding:1rem 1.1rem;margin-bottom:1.2rem}
.korbblock h2{margin-top:0}
.korbzeile{display:grid;grid-template-columns:5.5rem 1fr 5rem 6rem auto;gap:.8rem;align-items:center;padding:.7rem 0;border-top:1px solid var(--linie)}
.korbzeile:first-of-type{border-top:0}
.kz-bild{background:var(--flaeche-2);padding:.3rem;border:1px solid var(--linie)}
.kz-bild svg{max-height:3.4rem}
.kz-mitte{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.kz-t{font-family:var(--schmal);font-size:1.1rem;font-weight:600;line-height:1.2;color:inherit}
.kz-e{font-size:.82rem;color:var(--gedaempft)}
.kz-menge{font:inherit;width:100%;padding:.4rem;border:1px solid var(--linie-stark);background:var(--grund);color:var(--tinte);font-variant-numeric:tabular-nums;text-align:right}
.kz-summe{font-family:var(--schmal);font-size:1.15rem;font-weight:600;text-align:right;font-variant-numeric:tabular-nums}
.kz-weg{font:inherit;font-size:.82rem;background:none;border:0;color:var(--gedaempft);text-decoration:underline;cursor:pointer;padding:.2rem}
.kz-weg:hover{color:var(--ziegel)}
@media(max-width:38rem){.korbzeile{grid-template-columns:1fr 4.5rem 5.5rem;grid-template-areas:"m m m" "t menge summe"}.kz-bild{display:none}}

/* --- Kasse --- */
.kasse{background:var(--flaeche);border:1px solid var(--linie);padding:1rem 1.1rem;margin-bottom:1.2rem}
.kasse h2:first-child{margin-top:0}
.kasse .f{display:flex;flex-direction:column;gap:.25rem;max-width:26rem}
.kasse select{font:inherit;padding:.5rem;border:1px solid var(--linie-stark);background:var(--grund);color:var(--tinte)}
.gebiet{font-size:.92rem;margin:.6rem 0 0;padding:.55rem .8rem;border-left:3px solid var(--linie-stark);background:var(--grund)}
.gebiet:empty{display:none}
.gebiet.ja{border-left-color:var(--gruen);background:var(--gruen-weich)}
.gebiet.nein{border-left-color:var(--ziegel);background:var(--ziegel-weich)}
.zahlwege{display:flex;flex-direction:column;gap:1px;background:var(--linie);border:1px solid var(--linie)}
.zw{display:flex;gap:.7rem;align-items:flex-start;padding:.7rem .9rem;background:var(--grund);cursor:pointer}
.zw:hover{background:var(--flaeche-2)}
.zw-t{display:flex;flex-direction:column;gap:.2rem}
.zw-g{font-size:.85rem;color:var(--gedaempft)}
/* Der Anfragetext: volle Breite mit border-box. Ein Textfeld mit cols
   sprengt sonst jeden schmalen Rahmen. Die Liste ist auf feste Spalten
   ausgerichtet und soll im Feld waagrecht rollen, nicht die Seite. */
.anfragetext{display:block;width:100%;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.82rem;line-height:1.45;padding:.7rem;border:1px solid var(--linie-stark);background:var(--grund);color:var(--tinte);white-space:pre;overflow:auto;min-height:44px}
.anfrage-knoepfe{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.7rem}
.anfrage-echo{font-size:.9rem;color:var(--gedaempft)}
.anfrage-hinweis{font-size:.88rem;color:var(--gedaempft);margin:.6rem 0 0}
.gebindehinweis{font-size:.9rem;color:var(--gedaempft);margin:.5rem 0 1.2rem}
.karte .ab{display:block;font-size:.82rem;color:var(--gedaempft);margin-top:.15rem}

/* Die Karte war bis zum 02.09. ein Verweiselement um die ganze Kachel. Ein Knopf darin
   wäre ein Bedienelement in einem Bedienelement gewesen — im Browser eine
   Fehlkonstruktion und für die Tastatur eine Falle. Jetzt trägt die Karte einen
   Kopfbereich, der verlinkt, und darunter Preis und Legen-Zeile. Der
   Fokusring gehört seither dem Kopf, nicht der Kachel. */
.karte{background:var(--flaeche);padding:.9rem 1rem;display:flex;flex-direction:column;gap:.4rem;color:inherit}
.karte:hover{background:var(--flaeche-2)}
.karte .kopf{display:flex;flex-direction:column;gap:.4rem;text-decoration:none;color:inherit}
.karte .kopf:hover .t{text-decoration:underline}
/* Die Legen-Zeile sitzt am Fuß der Kachel und drängt sich nicht vor den Preis:
   Wer vergleicht, liest zuerst die Zahl. */
.legen-klein{margin:.5rem 0 0;gap:.5rem;align-items:center}
.legen-klein input{width:4.6rem;padding:.4rem}
.legen-klein .knopf{padding:.5rem .7rem;font-size:.85rem;flex:1 1 auto}
.karte .nr{font-family:var(--zahl);font-size:.68rem;color:var(--gedaempft)}
.karte .t{font-weight:600;line-height:1.3}
.karte .preis{margin-top:auto;font-family:var(--schmal);font-size:1.55rem;font-weight:600;font-variant-numeric:tabular-nums}
.karte .eh{font-size:.78rem;color:var(--gedaempft);font-family:var(--text);font-weight:400}
.marker{display:inline-flex;font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:.1rem .4rem;border-radius:2px;width:fit-content}
.marker.vorteil{background:var(--gruen-weich);color:var(--gruen)}
.marker.beipack{background:var(--ziegel-weich);color:var(--ziegel)}
.marker.sperrig{background:var(--flaeche-2);color:var(--tinte-2)}
.kacheln{display:grid;grid-template-columns:repeat(auto-fill,minmax(17rem,1fr));gap:1px;background:var(--flaeche);border:1px solid var(--linie);margin-bottom:1.5rem}
.kacheln>*{outline:1px solid var(--linie)}
.kachel{background:var(--flaeche);padding:1rem 1.1rem;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:.35rem}
.kachel:hover{background:var(--flaeche-2)}
.kachel .k{font-family:var(--schmal);text-transform:uppercase;font-size:.78rem;letter-spacing:.06em;color:var(--ocker)}
.kachel .t{font-family:var(--schmal);font-size:1.25rem;font-weight:600;line-height:1.2}
.kachel .b{font-size:.88rem;color:var(--gedaempft)}
.preistafel{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--linie);border:1px solid var(--linie);margin:1.2rem 0}
.preistafel>div{background:var(--flaeche);padding:.9rem 1rem}
.preistafel .k,.preistafel .w,.preistafel .e{display:block}
.preistafel .k{font-family:var(--schmal);text-transform:uppercase;font-size:.78rem;letter-spacing:.05em;color:var(--ocker)}
.preistafel .w{font-family:var(--schmal);font-size:1.7rem;font-weight:600;line-height:1.1;font-variant-numeric:tabular-nums}
.preistafel .e{font-size:.82rem;color:var(--gedaempft)}
.rechtstext{font-family:var(--zahl);font-size:.86rem;line-height:1.7;white-space:pre-wrap;
background:var(--flaeche);border:1px solid var(--linie);padding:1.1rem 1.2rem;overflow-x:auto;margin-bottom:1rem}
mark.luecke{background:var(--ziegel-weich);color:var(--ziegel);font-weight:600;padding:.05em .35em;border-radius:2px}
td.n{text-align:right;font-family:var(--zahl);font-variant-numeric:tabular-nums}
footer{margin-top:3rem;padding-top:1.2rem;border-top:1px solid var(--linie);font-size:.85rem;color:var(--gedaempft)}
footer a{color:var(--gedaempft)}
.verwandt{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem}
.verwandt a{font-size:.88rem;text-decoration:none;border:1px solid var(--linie);padding:.2rem .6rem;border-radius:2px;background:var(--flaeche)}
.verwandt a:hover{background:var(--flaeche-2)}
@media(max-width:40rem){.kopfleiste nav{margin-left:0;width:100%}}
/* Bedienbarkeit mit dem Daumen. Gemessen im 390-px-Rahmen: Die
   Navigationsknöpfe waren 31 px hoch, der Warenkorb 38, das Suchfeld 42.
   WCAG 2.5.8 verlangt mindestens 24 px, Apple empfiehlt 44, Google 48 —
   und ein Baustoffhändler bedient die Seite mit Arbeitshandschuhen oder
   staubigen Fingern, nicht mit der Mausspitze.
   Fließtextverweise bleiben ausgenommen: Sie stehen im Satz, und WCAG
   nimmt sie ausdrücklich aus. Ein Absatz mit aufgeblasenen Zeilenabständen
   wäre schlechter lesbar und nicht barrierefreier. */
.kopfleiste nav a,.korb,.knopf,.kz-weg{min-height:44px;display:inline-flex;align-items:center}
.kopfleiste nav a{padding:.15rem .7rem}
#suchfeld{min-height:44px}
.filterleiste select,.kasse select,.kz-menge,.legen input{min-height:44px}
.legen-klein input,.legen-klein .knopf{min-height:44px}
.zw{min-height:44px}
`;
}

/**
 * Die Rechtsseiten.
 *
 * Sie sind bewusst als **Gerüst mit sichtbaren Lücken** ausgegeben, nicht als
 * fertiger Rechtstext. Der Grund steht in `src/rechtstexte.js`: Ein
 * Rechtstexteanbieter mit Aktualisierungsdienst ist vorgesehen und bleibt es.
 * Was diese Seiten leisten, ist die Zuarbeit — jede Lücke benannt, damit
 * niemand mit einem halben Impressum online geht und es für ein ganzes hält.
 *
 * Eine erfundene Klausel wäre hier der teuerste Fehler des ganzen Vorhabens:
 * Sie sieht aus wie Recht, ist keines, und man merkt es erst im Streitfall.
 */
/**
 * Die Kopfleiste führt das Sortiment, sonst nichts.
 *
 * Vorher standen dort vier von sieben Warengruppen, dazwischen „Wissen"
 * und am Ende „Rechtliches". Ein Baustoffhändler, dessen Hauptnavigation
 * zu einem Drittel aus Aufsätzen besteht, sieht aus wie ein Blog mit
 * Preisliste. Wissen und Rechtliches stehen im Fuß und auf der Startseite
 * — erreichbar, aber nicht im Weg.
 */
// Die Reihenfolge ist eine Gestaltungsfrage und steht deshalb hier; die
// **Kennungen** kommen seit dem 31.08. aus `GRUPPENSEITE`, damit das
// Kampagnenwerkzeug dieselben Adressen bildet wie der Bau. Vorher hatte es
// keine und nahm den Google-Anzeigepfad — dann zeigten die Anzeigen auf
// Seiten, die es nicht gibt.
const NAV_REIHENFOLGE = ['WDVS', 'Dämmung', 'Mauerwerk', 'Mörtel', 'Kamin', 'Kanal', 'Zubehör'];

/**
 * Die Bezirke als Satz — einmal gebildet, überall dieselben.
 *
 * **Gemessen am 31.08.** an allen 81 gebauten Seiten: **drei** nannten das
 * Liefergebiet, 78 nicht. Darunter alle drei Seiten, auf die der erste
 * Anlauf der Anzeigen zeigt (`gruppe/wdvs`, `gruppe/daemmung`,
 * `gruppe/kamin`). Ich hatte vorher in die Akte geschrieben, es stehe „in der
 * Kopfzeile jeder Seite". Es stand in der Kasse, in `llms.txt` und in den
 * strukturierten Daten — also überall dort, wo es eine **Maschine** liest,
 * und nirgends dort, wo der Besucher es liest.
 *
 * Das ist die teuerste Fassung des Fehlers: Die Anzeige verspricht
 * „Lieferung Perg bis Linz", der Klick kostet Geld, und die Seite, auf der
 * er landet, sagt weder, wohin geliefert wird, noch dass zu den gezeigten
 * Nettopreisen Fracht kommt. Wer in Salzburg sitzt, erfährt es in der Kasse
 * — nach dem bezahlten Klick.
 */
const LIEFERBEZIRKE = aufzaehlung(LIEFERGEBIET.bezirke.map((b) => b.name));
const NAV = [
  ...NAV_REIHENFOLGE.map((g) => [`gruppe/${GRUPPENSEITE[g]}`, g]),
  ['lieferung', 'Lieferung'],
];

/* ------------------------------------------------------------------ *
 * Seiten bauen
 * ------------------------------------------------------------------ */

const euro = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function artikelKarte(a, befund, verweis) {
  const beipack = befund.nurBeipackSkus.includes(a.sku);
  // Eine Quelle für den Vorteil — `vorteil()` rundet ab, siehe dort.
  const abstand = vorteil(a);
  const marker = [];
  if (abstand !== null && abstand >= 5) marker.push(`<span class="marker vorteil">${abstand} % unter Liste</span>`);
  if (beipack) marker.push('<span class="marker beipack">Beipack</span>');
  const einheit = esc(EINHEITEN[a.einheit] ?? a.einheit);
  const schritt = mengenschritt(a);
  // Der Punkt bleibt im Attribut — `step="0,75"` ist für den Browser kein
  // Wert; im sichtbaren Text steht das Komma. Dieselbe Trennung wie auf der
  // Artikelseite.
  const wert = schritt === null ? '1' : String(schritt);
  return `<div class="karte">
  <a class="kopf" href="${verweis(`artikel/${a.sku}`)}">
    <span class="bild">${artikelBild(a)}</span>
    <span class="nr">${esc(a.lieferantenArtikelnummer)}</span>
    <span class="t">${esc(a.bezeichnung)}</span>
  </a>
  ${marker.join('')}
  <span class="preis">${euro(a.vkNetto)}&nbsp;€ <span class="eh">je ${einheit}, netto</span></span>
  ${
    // Die Karte ist oft das Einzige, was ein Kunde von einem Artikel sieht.
    // „5,23 € je m²" ohne den Zusatz, dass es die Platte nur zu 0,75 m² gibt,
    // ist dieselbe halbe Auskunft wie im Feed und in llms.txt.
    schritt
      ? `<span class="ab">ab ${esc(String(schritt).replace('.', ','))} ${einheit} · ${
          euro(a.vkNetto * schritt)}&nbsp;€</span>`
      : ''
  }
  <div class="legen legen-klein">
    <input type="number" min="${wert}" max="999" value="${wert}"${
      schritt ? ` step="${wert}"` : ''} inputmode="decimal"
      aria-label="Menge in ${einheit} für ${esc(a.bezeichnung)}">
    <button class="knopf" type="button" data-legen="${esc(a.sku)}"
      aria-label="${esc(a.bezeichnung)} in den Warenkorb">In den Warenkorb</button>
  </div>
</div>`;
}

/**
 * Die Artikel, die mit diesem zusammen verbaut werden.
 *
 * Das Vorbild ist die Zeile „Wird oft zusammen gekauft" der großen Shops —
 * nur ohne deren Grundlage. Wir haben kein Kaufverhalten: Der Shop hat noch
 * keine Bestellung gesehen, und eine erfundene Statistik wäre genau die Art
 * Angabe, die dieses Projekt sonst überall verweigert.
 *
 * Was wir stattdessen haben, ist besser begründet als eine Statistik: die
 * **Systemlisten**. Dort steht von Hand aufgeschrieben, welche Positionen ein
 * Bauteil ausmachen — geprüft, mit Quelle, mit den Positionen, die der Shop
 * gar nicht führt. Wer den Perimeterkleber ansieht, braucht die Platte und die
 * Pistole, weil sie in derselben Liste stehen, nicht weil jemand sie zufällig
 * mitbestellt hat.
 *
 * Deshalb die Regel, und sie ist der ganze Unterschied zur Vorlage:
 *
 * > **Ein Artikel ohne Systemliste bekommt hier keinen Vorschlag.**
 *
 * Nicht die meistverkauften, nicht die aus derselben Gruppe, nicht „ähnliche
 * Artikel". Die Gruppengeschwister stehen weiter unten auf der Seite und sind
 * als das gekennzeichnet, was sie sind: dasselbe Regal, nicht dasselbe
 * Bauteil.
 *
 * Keine Kappung: Steht ein Artikel in zwei Listen, werden beide vollständig
 * gezeigt. Eine stillschweigend abgeschnittene Liste sähe aus wie ein
 * vollständiges Bauteil und wäre keines.
 *
 * @returns {{artikel: object[], listen: object[]}} in Listenreihenfolge, ohne
 *   den Artikel selbst und ohne Doppelte
 */
export function mitverbaut(a, katalog, systemSeiten) {
  const gesehen = new Set([a.sku]);
  const artikel = [];
  for (const s of systemSeiten) {
    for (const sku of alsListe(s.kopf.skus)) {
      if (gesehen.has(sku)) continue;
      gesehen.add(sku);
      const gefunden = katalog.artikel.find((x) => x.sku === sku);
      if (gefunden) artikel.push(gefunden);
    }
  }
  return { artikel, listen: systemSeiten };
}

function artikelSeite(a, katalog, befund, seiten, verweis) {
  const m = marke(a.bezeichnung);
  const h = m ? HERSTELLER[m] : null;
  // Eine Quelle für den Vorteil — `vorteil()` rundet ab, siehe dort.
  const abstand = vorteil(a);
  const beipack = befund.nurBeipackSkus.includes(a.sku);
  const gruppenSeite = [...seiten.values()].find((s) => s.art === 'gruppen' && s.kopf.gruppe === a.gruppe);
  const systemSeiten = [...seiten.values()].filter(
    (s) => s.art === 'system' && alsListe(s.kopf.skus).includes(a.sku),
  );
  const zusammen = mitverbaut(a, katalog, systemSeiten);
  /**
   * **Berichtigt am 3. September.** Diese Zeile nahm die ersten acht Artikel
   * der Gruppe — ohne anzusehen, welche darüber schon unter „Wird damit
   * zusammen verbaut" standen. Auf einer WDVS-Seite waren das **sieben von
   * acht**: derselbe Artikel, derselbe Preis, dieselbe Karte, zweimal auf
   * einer Seite unter zwei Überschriften.
   *
   * > **Zwei Überschriften über derselben Liste sind keine zwei Auskünfte.**
   * > Der Leser sucht beim zweiten Block, was daran anders ist, und findet
   * > nichts.
   *
   * Aufgefallen beim Messen der Artikelseiten gegeneinander: Zwei Seiten
   * desselben Sortiments glichen einander zu 99 % — und der Grund war nicht
   * ihr eigener Text, sondern diese doppelte Liste.
   */
  const schonGezeigt = new Set(zusammen.artikel.map((x) => x.sku));
  const geschwister = katalog.artikel
    .filter((x) => x.gruppe === a.gruppe && x.sku !== a.sku && !schonGezeigt.has(x.sku))
    .slice(0, 8);

  const teile = [];
  teile.push(`<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis(gruppenSeite ? gruppenSeite.id : 'index')}">${esc(a.gruppe)}</a></p>`);
  teile.push(`<h1>${esc(a.bezeichnung)}</h1>`);
  // Die Zeichnung steht vor den Zahlen: Wer auf einer Artikelseite landet,
  // will zuerst wissen, ob er beim richtigen Bauteil ist.
  /**
   * **Der Platzhalter sagt es auch dem, der sieht — seit dem 4. September.**
   *
   * `artikelBild` trägt die Auskunft seit heute in der Bildbeschreibung; die
   * liest ein Vorleseprogramm und sonst niemand. Ein Bauleiter, der eine
   * Zeichnung sieht, hält sie für eine Zeichnung dieses Artikels.
   *
   * Betroffen sind drei Kaminpakete — und es sind dieselben drei, deren Seiten
   * einander am ähnlichsten sind (0,96 in `npm run pruefe-dubletten`). Wo der
   * Shop am wenigsten über einen Artikel weiß, sieht seine Seite jeder anderen
   * am ähnlichsten; das ist kein Zufall, sondern dieselbe Ursache zweimal.
   */
  const platzhalterform = bauform(a) === 'teil';
  teile.push(`<div class="artikelbild">${artikelBild(a)}${platzhalterform
    ? `<p class="bildhinweis">Die Form dieses Artikels ist aus seiner Bezeichnung nicht ablesbar —
die Zeichnung ist ein Platzhalter und kein Schema dieses Erzeugnisses. Was zum Paket gehört, sagt
${systemSeiten.length ? `die Systemliste unten` : 'die Systemliste'}.</p>`
    : ''}</div>`);

  const marker = [];
  if (abstand !== null && abstand >= 5) marker.push(`<span class="marker vorteil">${abstand} % unter Listenpreis</span>`);
  if (beipack) marker.push('<span class="marker beipack">Beipack — kein Preisvorteil</span>');
  if (a.sperrgut) marker.push('<span class="marker sperrig">palettiert, Kranentladung</span>');
  if (marker.length) teile.push(`<p class="verwandt">${marker.join('')}</p>`);

  // Der zweite Preis, wo er sich aus der Bezeichnung ergibt. Ein Artikel, der
  // „25 kg" heißt und je Kilogramm kostet, sieht neben einem, der „25 kg"
  // heißt und je Sack kostet, fünfmal billiger aus. Beide Zahlen stehen jetzt
  // nebeneinander; welche im Katalog steht, sagt `grundlage`.
  const kilo = preisJeKilo(a);

  teile.push(`<div class="preistafel">
  <div><span class="k">Netto</span><span class="w">${euro(a.vkNetto)} €</span><span class="e">je ${esc(EINHEITEN[a.einheit] ?? a.einheit)}, für Unternehmer</span></div>
  ${kilo ? `<div><span class="k">${kilo.grundlage === 'kilopreis' ? 'Je Gebinde' : 'Je Kilogramm'}</span><span class="w">${
    euro(kilo.grundlage === 'kilopreis' ? kilo.jeGebindeNetto : kilo.jeKgNetto)} €</span><span class="e">${
    kilo.grundlage === 'kilopreis'
      ? `netto, für ${esc(String(kilo.gebindeKg).replace('.', ','))} kg aus der Bezeichnung`
      : `netto, aus ${esc(String(kilo.gebindeKg).replace('.', ','))} kg je Gebinde gerechnet`}</span></div>` : ''}
  <div><span class="k">Brutto</span><span class="w">${euro(a.vkBrutto)} €</span><span class="e">inkl. ${ustText()} USt</span></div>
  <div><span class="k">Artikelnummer</span><span class="w">${esc(a.lieferantenArtikelnummer)}</span><span class="e">Lieferantennummer</span></div>
  <div><span class="k">Preisstand</span><span class="w">${esc(a.preisStand)}</span><span class="e">gültig bis zur nächsten Liste</span></div>
  <div><span class="k">Gewicht</span><span class="w">${typeof a.gewichtKg === 'number'
    ? `${String(a.gewichtKg).replace('.', ',')} kg`
    : '—'}</span><span class="e">${typeof a.gewichtKg === 'number'
    ? `je ${esc(EINHEITEN[a.einheit] ?? a.einheit)}, aus dem Lieferschein`
    : 'liegt uns nicht belegt vor'}</span></div>
</div>`);

  if (a.vkNetto !== null) {
    // Das Mengenfeld stand bis zum 29.08. auf jedem Artikel gleich: min 1,
    // Vorgabe 1. Bei einem Gebindeartikel, der je Kilogramm kostet, hieß das
    // „ein Kilogramm" — eine Menge, die es nicht gibt und die niemand
    // kommissionieren kann. Wo die Gebindegröße im Namen steht, beginnt das
    // Feld jetzt bei einem Gebinde und zählt in Gebinden weiter.
    const schritt = mengenschritt(a);
    // Der Punkt bleibt im Attribut — `step="0,75"` ist für den Browser kein
    // Wert. Im Satz darunter steht das Komma.
    const wert = schritt === null ? '1' : String(schritt);
    teile.push(`<div class="legen">
  <label><span class="f-b">Menge in ${esc(EINHEITEN[a.einheit] ?? a.einheit)}</span>
    <input id="menge-${esc(a.sku)}" type="number" min="${wert}" max="999" value="${wert}"${
      schritt ? ` step="${wert}"` : ''} inputmode="decimal"></label>
  <button class="knopf" type="button" data-legen="${esc(a.sku)}" data-menge="menge-${esc(a.sku)}">In den Warenkorb</button>
</div>`);
    if (schritt) {
      // Der Inhaltsprüfer hat diesen Satz beim ersten Wurf beanstandet, und
      // zu Recht: „25 kg" und „69,25 €" standen darin ohne Herkunft und ohne
      // Stand. Dass beides eine Zeile höher in der Preistafel steht, half
      // nicht — der Satz wird für sich gelesen. Jetzt trägt er beides.
      // **Berichtigt am 31.08.** `a.einheit === 'KG' ? 'kg' : 'm²'` stand hier —
      // eine Zeile über der Stelle, die dieselbe Auskunft schon aus
      // `EINHEITEN` nimmt. Für die Anschlussleiste ergab das einen Satz, der
      // sich selbst widerspricht: „Abgabe in ganzen Einheiten zu 2,55 **m²** …
      // Der Preis gilt je **lfm**".
      const einheitKurz = EINHEITEN[a.einheit] ?? a.einheit;
      const wortEinheit = a.einheit === 'KG' ? 'ganzen Gebinden' : 'ganzen Einheiten';
      teile.push(`<p class="gebindehinweis">Abgabe in ${wortEinheit} zu ${
        esc(String(schritt).replace('.', ','))} ${esc(einheitKurz)} laut Artikelbezeichnung. Der Preis gilt je ${
        esc(EINHEITEN[a.einheit] ?? a.einheit)}; eine Einheit kostet danach ${
        euro(a.vkNetto * schritt)} € netto, Stand: ${esc(a.preisStand)}.</p>`);
    }
  }

  if (beipack) {
    teile.push(`<div class="antwort"><strong>Dieser Artikel ist Beipack.</strong> Unser Einkauf liegt hier nah
am Listenpreis des Lieferanten — es gibt keinen Preisvorteil zu bewerben. Der Artikel ist bestellbar, weil er
zur Lieferung gehört; wenn Sie nur ihn brauchen, kaufen Sie ihn günstiger im Fachhandel vor Ort.
Warum das so ist, steht unter <a href="${verweis('wissen/baumeisterpreis')}">Was „Baumeisterpreis" heißt</a>.</div>`);
  } else if (abstand !== null) {
    teile.push(`<div class="antwort"><strong>${abstand} % unter dem Listenpreis des Lieferanten.</strong>
Der Vergleich bezieht sich auf die Liste unseres Lieferanten, nicht auf einen Marktpreis — er zeigt, wie viel
vom Baumeister-Einkaufsvorteil bei diesem Artikel ankommt. Wie der Preis entsteht:
<a href="${verweis('wissen/baumeisterpreis')}">Was „Baumeisterpreis" heißt</a>.</div>`);
  }

  teile.push('<h2>Technische Kennwerte</h2>');
  if (h) {
    teile.push(`<p><strong>Die Kennwerte stehen hier bewusst nicht.</strong> Verbrauch, Schichtdicke,
Untergrund und zulässige Verarbeitungstemperatur gehören ins technische Merkblatt des Herstellers und
ändern sich mit jeder Überarbeitung. Eine abgeschriebene Tabelle ist in dem Moment falsch, in dem der
Hersteller sie ändert — und niemand merkt es.</p>
<p>Merkblatt und Sicherheitsdatenblatt: <a href="${h.url}" target="_blank" rel="noopener noreferrer">${esc(h.name)}</a>.
Wenn Sie das passende Dokument nicht finden, schicken wir es Ihnen — mit Angabe, welche Ausgabe es ist.</p>`);
  } else {
    teile.push(`<p>Für diesen Artikel liegt uns kein Herstellermerkblatt vor. Wir tragen es nach, sobald
wir es beim Lieferanten angefordert haben. Bis dahin steht hier nichts — eine erfundene Kennwerttabelle
wäre schlimmer als eine leere.</p>`);
  }

  teile.push('<h2>Lieferung</h2>');
  teile.push(`<p>${a.sperrgut
    ? 'Palettierte Ware. Sie wird mit dem Kran entladen; die Entladung fällt je Hub an und wird getrennt ausgewiesen.'
    : 'Wird mit der übrigen Bestellung geliefert und braucht keine eigene Entladung.'}
Die Frachtsätze stehen unter <a href="${verweis('lieferung')}">Lieferung</a>. Warum die Fracht getrennt
ausgewiesen wird und es kein „frei Haus" gibt, steht unter
<a href="${verweis('wissen/warum-keine-gratislieferung')}">Warum es keine Gratislieferung gibt</a>.</p>`);

  // **Die Zustellung dieses einen Artikels, in Euro.**
  //
  // Der Produktfeed nennt sie seit dem 28. August je Artikel; die
  // Artikelseite verwies bis dahin nur auf die Frachtseite. Ein Kunde, der
  // eine Dämmplatte für 1,93 € ansieht, soll nicht erst im Warenkorb
  // erfahren, dass die Zustellung 83 € kostet — dieselbe Haltung wie überall
  // sonst hier: **die unangenehme Zahl steht vorne.**
  //
  // Gerechnet mit `fracht()`, also mit derselben Funktion wie Warenkorb und
  // Feed. Genannt wird der Fall, den die Zahl trifft: eine Bestellung mit
  // genau diesem Artikel. Bei mehreren Positionen fällt die Pauschale nur
  // einmal an, und das steht dabei.
  const lieferant = katalog.lieferantenById.get(a.lieferantId);
  if (lieferant?.fracht?.pauschaleNetto != null && a.vkNetto !== null) {
    const zustellung = fracht([{ ...a, menge: 1 }], lieferant).betragNetto;
    // **Nicht „teurer als die Ware" — das wäre eine irreführende Rechnung.**
    //
    // Der erste Entwurf verglich die Zustellung mit dem Preis **je Einheit**
    // und meldete deshalb bei fast jedem Artikel, die Fracht koste mehr als
    // die Ware. Bei 1,93 € je m² stimmt das für einen Quadratmeter und für
    // nichts sonst; wer 100 m² bestellt, hat 193 € Warenwert.
    //
    // Gesagt wird deshalb die Zahl, die der Kunde wirklich braucht: **ab
    // welcher Menge der Warenwert die Zustellung übersteigt.** Sie ist aus
    // denselben zwei Zahlen gerechnet und beantwortet die Frage, die er sich
    // ohnehin stellt — lohnt eine eigene Fahrt?
    // **Und die Menge muss lieferbar sein.** Der erste Entwurf rundete auf
    // ganze Einheiten: 83,00 € ÷ 5,23 € ergab 16 m². Diese Platte wird in
    // Einheiten zu 0,75 m² abgegeben — 16 m² gibt es nicht, die nächste
    // lieferbare Menge sind 16,5 m². Eine Schwelle, die der Kunde nicht
    // bestellen kann, ist dieselbe Sorte Zahl wie ein Preis, den er für
    // nichts bekommt.
    const schrittHier = mengenschritt(a);
    let menge = null;
    if (a.vkNetto > 0) {
      const roh = zustellung / a.vkNetto;
      menge = schrittHier
        ? Math.round(Math.ceil(roh / schrittHier - 1e-9) * schrittHier * 100) / 100
        : Math.ceil(roh);
    }
    const eh = esc(EINHEITEN[a.einheit] ?? a.einheit);
    teile.push(`<div class="preistafel">
  <div><span class="k">Zustellung</span><span class="w">${euro(zustellung)} €</span><span class="e">netto je Lieferung${a.sperrgut ? ', inkl. Kranentladung' : ''}</span></div>
  <div><span class="k">Ware</span><span class="w">${euro(a.vkNetto)} €</span><span class="e">je ${eh}, netto</span></div>
  ${menge ? `<div><span class="k">gleich viel wert</span><span class="w">${esc(String(menge).replace('.', ','))} ${eh}</span><span class="e">ab hier übersteigt die Ware die Zustellung</span></div>` : ''}
</div>`);
    teile.push(`<p>Die Pauschale fällt <strong>je Lieferung</strong> an, nicht je Position: Wer diesen Artikel
mit der übrigen Bestellung sammelt, zahlt sie einmal. Die Fahrt kostet dasselbe, ob ein Sack draufsteht
oder eine Palette — das ist der ganze Grund, warum es hier kein „frei Haus" gibt.</p>`);

    /**
     * **Gate 25, auf diesen Artikel gerechnet — aufgenommen am 3. September.**
     *
     * Die Grenze von 250 € netto Warenwert je Lieferung steht seit dem Mittag
     * auf der Lieferseite, in `llms.txt` und in der Kasse. Auf der
     * Artikelseite stand sie nicht — und dort entscheidet sich, ob jemand
     * überhaupt in den Warenkorb legt.
     *
     * > **Eine Grenze in Euro ist auf einer Seite mit einem Kilopreis keine
     * > Auskunft.** „250 € netto" heißt bei 0,56 € je kg: 450 kg, also
     * > 18 Gebinde. Das ist die Zahl, die der Bauleiter braucht, und sie ist
     * > für jeden Artikel eine andere.
     *
     * Gerechnet wird in **lieferbaren** Mengen, nicht in glatten: Ein Wert,
     * den die Kasse gar nicht annimmt, wäre dieselbe Sorte Zahl wie die
     * Frachtschwelle darüber, bevor sie am 2. September auf ganze Gebinde
     * gebracht wurde.
     */
    const grenzeNetto = BETREIBER.mindestbestellwertNetto ?? null;
    if (grenzeNetto > 0 && a.vkNetto > 0) {
      const rohMenge = grenzeNetto / a.vkNetto;
      const gebinde = schrittHier ? Math.ceil(rohMenge / schrittHier - 1e-9) : null;
      const mindestmenge = schrittHier
        ? Math.round(gebinde * schrittHier * 100) / 100
        : Math.ceil(rohMenge);
      teile.push(`<p><strong>Angenommen wird eine Anfrage ab ${esc(String(mindestmenge).replace('.', ','))} ${eh}</strong>,
wenn dieser Artikel allein bestellt wird${gebinde ? ` — ${gebinde} Gebinde zu ${esc(String(schrittHier).replace('.', ','))} ${eh}` : ''}.
Der Mindestbestellwert beträgt ${euro(grenzeNetto)} € netto Warenwert je Lieferung; darunter trägt die Lieferung
sich nicht (Quelle: <a href="${verweis('lieferung')}">Lieferung und Fracht</a>, Stand: ${esc(preisStand(katalog))}).
Wer mehrere Artikel <strong>desselben Lieferanten</strong> sammelt, erreicht die Grenze gemeinsam — sie gilt je
Lieferung, nicht je Position.</p>`);
    }
  }

  /**
   * **Ab hier die Querverweise — seit dem 3. September in einem eigenen
   * Abschnitt.**
   *
   * Drei Blöcke, die dieselben Artikel zeigen wie auf jeder anderen Seite
   * derselben Gruppe. Sie gehören auf die Seite: Ein Bauleiter, der die
   * Klebemasse sucht, braucht das Gewebe daneben. Sie gehören aber nicht zum
   * **eigenen** Text der Seite, und genau der ist es, den eine Suchmaschine
   * und ein Assistent gegen die 45 anderen Artikelseiten halten.
   *
   * `<section class="querverweise">` ist die Marke — und nicht `verwandt`:
   * Diese Klasse trägt schon die Markerzeile über dem Preis., an der `npm run
   * pruefe-dubletten` den eigenen Teil vom übernommenen trennt. Ohne sie
   * müsste die Messung an Überschriften raten — und eine Messung, die an
   * einer Überschrift hängt, misst beim nächsten Umformulieren etwas anderes.
   */
  const verwandtes = [];
  if (systemSeiten.length) {
    verwandtes.push('<h2>Gehört zu diesen Systemen</h2>');
    verwandtes.push(`<div class="kacheln">${systemSeiten.map((s) => `<a class="kachel" href="${verweis(s.id)}">
      <span class="k">Systemliste</span><span class="t">${esc(s.kopf.titel)}</span>
      <span class="b">${esc(alsText(String(s.kopf.kurz ?? '')).slice(0, 150))}</span></a>`).join('')}</div>`);
  }

  if (zusammen.artikel.length) {
    verwandtes.push('<h2>Wird damit zusammen verbaut</h2>');
    verwandtes.push(`<p>Nicht „andere Kunden kauften auch" — dieser Shop hat noch keine Bestellung gesehen und
rechnet Ihnen keine erfundene Statistik vor. Die Artikel unten stehen mit diesem zusammen in
${zusammen.listen.length === 1 ? 'der Systemliste' : 'den Systemlisten'}
${zusammen.listen.map((s) => `<a href="${verweis(s.id)}">${esc(s.kopf.titel)}</a>`).join(' und ')},
weil sie zum selben Bauteil gehören. Was dort zusätzlich auf der Liste steht und wir <em>nicht</em> führen,
sagt die Liste ebenfalls.</p>`);
    verwandtes.push(`<div class="raster">${zusammen.artikel.map((g) => artikelKarte(g, befund, verweis)).join('')}</div>`);
  }

  if (geschwister.length) {
    verwandtes.push(`<h2>Weitere Artikel aus ${esc(a.gruppe)}</h2>`);
    verwandtes.push(`<p>Dasselbe Regal, nicht dasselbe Bauteil: Diese Artikel gehören zur Gruppe
${esc(a.gruppe)}. Ob einer davon der richtige ist, entscheidet die Planung.</p>`);
    verwandtes.push(`<div class="raster">${geschwister.map((g) => artikelKarte(g, befund, verweis)).join('')}</div>`);
  }

  if (verwandtes.length) {
    teile.push(`<section class="querverweise">\n${verwandtes.join('\n')}\n</section>`);
  }

  // **Eine Auszeichnung, nicht zwei.** Bis zum 29.08. baute diese Stelle das
  // JSON-LD der Artikelseite von Hand, und `produktAuszeichnung()` baute das
  // des Feeds. Beide beschreiben dasselbe Angebot, und sie sind
  // auseinandergelaufen: Der Feed nennt seit heute die Bezugsgröße („je
  // 1 m²") und die kleinste bestellbare Menge (0,75 m²), die Seite nannte
  // beides nicht. Dieselbe Fehlerklasse wie bei der Verfügbarkeit im August,
  // die als PreOrder im Feed und als InStock auf der Seite stand — damals mit
  // einer Konstante geheilt, hier mit der gemeinsamen Funktion.
  //
  // Was die Seite darüber hinaus trägt, steht darunter und nicht anstelle:
  // Liefergebiet, Verkäufer und die Marke.
  // `angebotsAuszeichnung` und nicht `produktAuszeichnung`: Die Freigabefrage
  // gehört zum Feed. Ein Artikel, den Gate 22 nicht bewirbt, hat trotzdem
  // eine Produktseite — und eine Produktseite ohne strukturierte Daten ist
  // für den Kanal, für den dieser Shop gebaut ist, eine leere Seite.
  const auszeichnung = angebotsAuszeichnung(a, {
    liefergebiet: { land: LIEFERGEBIET.land, bezirke: LIEFERGEBIET.bezirke },
    // Die Adresse, unter der diese Seite ausgeliefert wird. `BASIS` kommt aus
    // den Betreiberdaten und bricht ab, wenn dort keine Domain steht — eine
    // erfundene Produktadresse wäre schlimmer als keine.
    seitenadresse: (art) => `${BASIS}/artikel/${art.sku}.html`,
    // Gate 25 aus derselben Quelle wie Kasse, Lieferseite und llms.txt.
    mindestbestellwertNetto: BETREIBER.mindestbestellwertNetto ?? null,
  });
  const jsonLd = auszeichnung.daten
    ? {
        ...auszeichnung.daten,
        ...(h ? { brand: { '@type': 'Brand', name: m } } : {}),
        offers: {
          ...auszeichnung.daten.offers,
          // Kein `priceValidUntil` mehr zurückzusetzen: `angebotsAuszeichnung`
          // setzt den Schlüssel seit dem 31.08. gar nicht erst, wenn die
          // Preisgültigkeit unbekannt ist. Die Begründung steht dort — an der
          // Quelle, wo auch der Feed sie mitbekommt.
          areaServed: liefergebietOrte({ land: LIEFERGEBIET.land, bezirke: LIEFERGEBIET.bezirke.map((b) => b.name) }),
          seller: organisation(),
        },
      }
    : null;

  return {
    titel: `${a.bezeichnung} — ${euro(a.vkNetto)} € netto`,
    kurz: `${a.bezeichnung}, ${euro(a.vkNetto)} € netto je ${EINHEITEN[a.einheit] ?? a.einheit}${abstand !== null ? `, ${abstand} % unter dem Listenpreis des Lieferanten` : ''}. Preisstand ${a.preisStand}.`,
    html: teile.join('\n'),
    jsonLd,
  };
}

/**
 * Die Positionsliste einer Systemseite, maschinenlesbar.
 *
 * Die vier Systemseiten sind das, wofür dieser Shop gebaut wird: Sie sagen,
 * **was zu einem Bauteil zusammengehört**. Genau das stand bisher nirgends in
 * maschinenlesbarer Form — die Seite trug ein `HowTo` ohne einen einzigen
 * Arbeitsschritt, und die zehn Positionen lagen nur als Tabelle im Fließtext.
 *
 * Eine `ItemList` sagt es richtig: nummerierte Positionen, in der Reihenfolge
 * der Liste. Was nicht im Sortiment steht, bleibt drin und trägt den Vermerk
 * mit — dieselbe Entscheidung wie auf der Seite selbst. Eine Liste, die nur
 * zeigt, was im Regal liegt, ist ein Angebot.
 *
 * @param {string} markdown  der Seitenkörper
 * @returns {object|null} die Liste, oder null ohne Positionstabelle
 */
export function positionsliste(markdown) {
  const zeilen = [...String(markdown ?? '').matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|/gm)];
  if (zeilen.length < 3) return null;
  return {
    '@type': 'ItemList',
    numberOfItems: zeilen.length,
    itemListElement: zeilen.map(([, nummer, roh]) => {
      const fehlt = /nicht im Sortiment/.test(roh);
      const name = roh.replace(/\*\(nicht im Sortiment\)\*/, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      return {
        '@type': 'ListItem',
        position: Number(nummer),
        name,
        ...(fehlt ? { disambiguatingDescription: 'nicht im Sortiment' } : {}),
      };
    }),
  };
}

function inhaltsSeite(seite, katalog, befund, seiten, verweis) {
  const teile = [];
  const kurz = String(seite.kopf.kurz ?? '');
  const gruppenArtikel = seite.kopf.gruppe
    ? katalog.artikel.filter((a) => a.gruppe === seite.kopf.gruppe)
    : [];

  const wo = { wissen: 'Wissen', gruppe: 'Sortiment', system: 'Systemlisten' }[seite.id.split('/')[0]];
  teile.push(`<p class="krume"><a href="${verweis('index')}">Start</a> › ${esc(wo)}</p>`);

  // Der Titel steht im Kopfblock; der Körper beginnt mit derselben Überschrift.
  // Ausgegeben wird sie einmal — aus dem Körper, damit der Text die Quelle bleibt.
  const koerper = alsHtml(seite.koerper, {
    verweisAuf: (u) => {
      const id = loeseVerweis(u, seite.art);
      return id ? verweis(id) : null;
    },
  });
  const warenraster = gruppenArtikel.length
    ? `<h2>${gruppenArtikel.length} Artikel in dieser Gruppe</h2>
<div class="filterleiste" id="filterleiste"></div>
<div class="raster" id="warenraster" data-gruppe="${esc(seite.kopf.gruppe ?? '')}">${gruppenArtikel
        .sort((a, b) => a.bezeichnung.localeCompare(b.bezeichnung, 'de'))
        .map((a) => artikelKarte(a, befund, verweis)).join('')}</div>`
    : '';

  // Marker um den Text aus `inhalte/`. Er ist an der Quelle geprüft, samt
  // seiner begründeten Ausnahmen; der Seitenprüfer soll ihn überspringen.
  // Bisher übersprang er dafür die **ganze Seite** — und damit auch die
  // Absätze, die dieses Werkzeug selbst auf dieselbe Seite schreibt. Der
  // Marker verlegt die Grenze vom Dokument auf den Absatz.
  const ausQuelle = (html) => `<!--quelltext-->${html}<!--/quelltext-->`;

  // **Was ein Anzeigenbesucher zuerst wissen muss.**
  //
  // Eine Gruppenseite ist die Landeseite der Anzeigen. Wer hier ankommt,
  // sieht ein Preisraster und hat drei Fragen, die keine der Zahlen
  // beantwortet: Sind das Netto- oder Bruttopreise? Liefert ihr zu mir?
  // Kommt Fracht dazu? Alle drei standen bisher im Fuß oder gar nicht.
  //
  // Der Kasten steht deshalb **über** dem Raster, nicht darunter: Er ist
  // die Bedingung, unter der die Zahlen darunter gelten.
  const liefernotiz = `<p class="liefernotiz"><strong>Preise netto für Unternehmer</strong> —
Umsatzsteuer ${ustText()} kommt dazu. <strong>Geliefert wird in ${esc(LIEFERBEZIRKE)}</strong>,
nicht österreichweit. Fracht fällt je Lieferung an und wird getrennt ausgewiesen
(<a href="${verweis('lieferung')}">Sätze</a>); Selbstabholung ist vorgesehen.</p>`;

  if (seite.art === 'gruppen' && warenraster) {
    // Auf einer Sortimentsseite kommt die Ware zuerst. Der Fachtext stand
    // vorher davor — wer eine Warengruppe anklickt, sucht aber Artikel und
    // nicht einen Aufsatz. Eingesetzt wird nach dem einleitenden Absatz,
    // damit die Seite trotzdem sagt, worum es geht.
    const schnitt = koerper.indexOf('</p>');
    if (schnitt === -1) {
      teile.push(liefernotiz, warenraster, ausQuelle(koerper));
    } else {
      teile.push(
        ausQuelle(koerper.slice(0, schnitt + 4)),
        liefernotiz,
        warenraster,
        ausQuelle(koerper.slice(schnitt + 4)),
      );
    }
  } else {
    teile.push(ausQuelle(koerper));
    if (warenraster) teile.push(warenraster);
  }

  // Der Schichtenschnitt: Er steht **vor** der Artikelliste, weil er die
  // Reihenfolge zeigt, in der die Artikel verbaut werden — und weil er die
  // Lagen mitzeichnet, die der Shop nicht führt. Eine Liste ohne dieses Bild
  // sieht vollständig aus; das Bild sagt, wo sie es nicht ist.
  const lagen = schichten(seite.kopf.schichten);
  if (lagen.length) {
    const fremd = lagen.filter((l) => !l.gefuehrt);
    teile.push('<h2>Der Aufbau im Schnitt</h2>');
    teile.push(`<div class="schichtbild">${schichtbild(lagen)}</div>`);
    teile.push(`<p>Die Lagen stehen in Einbaureihenfolge, von innen nach außen. Die Zeichnung ist
<strong>nicht maßstäblich</strong>: Welche Stärke jede Lage braucht, entscheidet die Planung, nicht das
Sortiment.${fremd.length ? ` Schraffiert und mit „nicht von uns" beschriftet sind die
${fremd.length === 1 ? 'Lage' : `${fremd.length} Lagen`}, die dieser Shop nicht führt —
${fremd.map((l) => esc(l.name)).join(', ')}.` : ''}</p>`);
  }

  // --- Stärkenvergleich, nur wo er etwas bedeutet ---------------------
  //
  // Der Kunde vergleicht Dämmplatten nicht nach dem Quadratmeterpreis,
  // sondern danach, was ihn ein Zentimeter Stärke kostet: Eine 3-cm-Platte
  // für 2,81 € ist nicht „billiger" als eine 5-cm-Platte für 4,67 €.
  //
  // Zwei Zusagen macht diese Tafel **nicht**, und beide stehen darunter:
  // Sie vergleicht nicht die Dämmwirkung (die steht im Nachweis, nicht im
  // Preis), und sie vergleicht nicht über die Plattenart hinweg — EPS und
  // XPS gehören an verschiedene Stellen des Bauwerks.
  //
  // Wo die Stärke nicht aus der Bezeichnung ablesbar ist, steht ein
  // Gedankenstrich. Eine geschätzte Stärke wäre hier besonders teuer: Sie
  // ginge unmittelbar in einen Preisvergleich ein.
  const vergleich = seite.kopf.vergleich === 'staerke'
    ? gruppenArtikel
        .filter((a) => a.vkNetto !== null)
        .map((a) => ({ a, mm: dickeMm(a.bezeichnung) }))
        .sort((x, y) => (y.mm ?? -1) - (x.mm ?? -1) || x.a.bezeichnung.localeCompare(y.a.bezeichnung, 'de'))
    : [];
  if (vergleich.length) {
    const ohneStaerke = vergleich.filter((v) => v.mm === null).length;
    teile.push('<h2>Was ein Zentimeter Stärke kostet</h2>');
    teile.push(`<div class="scroll"><table>
<thead><tr><th>Platte</th><th>Stärke</th><th>je ${esc(EINHEITEN.M2 ?? 'm²')}, netto</th><th>je ${esc(EINHEITEN.M2 ?? 'm²')} und cm</th></tr></thead>
<tbody>${vergleich.map(({ a, mm }) => `<tr>
<td><a href="${verweis(`artikel/${a.sku}`)}">${esc(a.bezeichnung)}</a></td>
<td>${mm === null ? '—' : `${mm} mm`}</td>
<td>${euro(a.vkNetto)} €</td>
<td>${mm === null ? '—' : `${euro(a.vkNetto / (mm / 10))} €`}</td>
</tr>`).join('')}</tbody></table></div>`);
    teile.push(`<p>Die letzte Spalte ist ein <strong>Preisvergleich, keine Bauteilempfehlung</strong>.
Welche Stärke Ihr Bauteil braucht, steht im Wärmeschutznachweis, und ob EPS oder XPS hingehört, entscheidet
der Einbauort — beides sagt der Preis nicht: <a href="${verweis('wissen/xps-oder-eps')}">XPS oder EPS</a>.
Verglichen werden darf nur innerhalb derselben Plattenart.${ohneStaerke
      ? ` Bei ${ohneStaerke === 1 ? 'einer Platte' : `${ohneStaerke} Platten`} steht ein Gedankenstrich:
Die Stärke ist aus der Bezeichnung nicht ablesbar, und geschätzt wird sie nicht.`
      : ''}</p>`);
  }

  // --- Kilovergleich, wo Gebinde im Spiel sind -----------------------
  //
  // Zwei Artikel desselben Sortiments, beide „25 kg" im Namen: Capatect
  // Putzgrund 2,77 € **je kg**, Baumit KlebeSpachtel 14,32 € **je Sack**.
  // Beide Angaben sind überall sauber beschriftet — auf der Karte, auf der
  // Artikelseite, im Mengenfeld — und trotzdem nicht vergleichbar. Der eine
  // Sack kostet 69,25 €, der andere 14,32 €, und das stand nirgends.
  //
  // > **Wer eine Zahl dreimal richtig beschriftet, hat noch keine
  // > vergleichbare Zahl geliefert.**
  //
  // Die Tafel nennt beide Preise. Artikel ohne ablesbare Gebindegröße
  // (Quadratmeterware, Liter, Stückgut) stehen nicht darin, und die Zeile
  // darunter sagt, wie viele das sind.
  if (seite.kopf.vergleich === 'gebinde') {
    const tafel = kilotafel(gruppenArtikel.filter((a) => a.vkNetto !== null));
    if (tafel.zeilen.length) {
      teile.push('<h2>Was ein Kilogramm kostet</h2>');
      teile.push(`<div class="scroll"><table>
<thead><tr><th>Artikel</th><th>Gebinde</th><th>je Gebinde, netto</th><th>je kg, netto</th></tr></thead>
<tbody>${tafel.zeilen.map((z) => `<tr>
<td><a href="${verweis(`artikel/${z.sku}`)}">${esc(z.bezeichnung)}</a></td>
<td>${esc(String(z.gebindeKg).replace('.', ','))} kg</td>
<td>${euro(z.jeGebindeNetto)} €</td>
<td>${euro(z.jeKgNetto)} €</td>
</tr>`).join('')}</tbody></table></div>`);
      teile.push(`<p>Die Gebindegröße ist aus der Artikelbezeichnung gelesen, der zweite Preis daraus
gerechnet — je nachdem, welcher der beiden im Katalog steht. <strong>Verglichen werden darf nur, was
denselben Zweck hat</strong>: Ein Klebespachtel und ein Oberputz stehen hier nebeneinander und gehören
an verschiedene Stellen der Wand.${tafel.ohne
        ? ` ${tafel.ohne === 1 ? 'Ein Artikel steht' : `${tafel.ohne} Artikel stehen`} nicht in der Tafel:
Bei ${tafel.ohne === 1 ? 'ihm' : 'ihnen'} ist keine Gebindegröße aus der Bezeichnung ablesbar, oder der
Preis bezieht sich auf Fläche, Länge oder Volumen. Geschätzt wird nichts.`
        : ''}</p>`);
    }
  }

  const skus = alsListe(seite.kopf.skus);
  if (skus.length) {
    const artikel = skus.map((s) => katalog.artikel.find((a) => a.sku === s)).filter(Boolean);
    teile.push('<h2>Die Artikel dieser Liste</h2>');
    teile.push(`<div class="raster">${artikel.map((a) => artikelKarte(a, befund, verweis)).join('')}</div>`);
  }

  const verwandt = alsListe(seite.kopf.verwandt)
    .map((v) => loeseVerwandt(v))
    .map((id) => seiten.get(id))
    .filter(Boolean);
  if (verwandt.length) {
    teile.push('<h2>Weiterlesen</h2>');
    teile.push(`<div class="verwandt">${verwandt.map((v) => `<a href="${verweis(v.id)}">${esc(v.kopf.titel)}</a>`).join('')}</div>`);
  }

  const liste = positionsliste(seite.koerper);
  const jsonLd = {
    '@context': 'https://schema.org',
    /**
     * **Berichtigt am 30.08.** Hier stand `seite.art === 'system' ? 'HowTo'
     * : 'Article'`, und die Frage hing als einzelnes `mainEntity` an einem
     * `Article`. Beides war eine Auszeichnung, die der Inhalt nicht deckt:
     *
     * - Ein `HowTo` ohne `step` ist keine Anleitung, sondern eine
     *   Typbehauptung. Die Systemseiten führen keine Arbeitsschritte,
     *   sondern eine **Positionsliste** — das ist eine `ItemList`.
     * - Eine `Question` mit `acceptedAnswer` wird in zwei Seitenarten
     *   gelesen: `FAQPage` (die Antwort schreibt der Betreiber) und
     *   `QAPage` (die Antwort schreiben Leser). Ein `Article` mit
     *   `mainEntity: Question` ist keines von beiden — die Auszeichnung
     *   stand da und wurde von niemandem als Frage-Antwort verstanden.
     *
     * Der Betreiber schreibt hier die Antwort selbst, also `FAQPage`, und
     * `mainEntity` ist dort eine **Liste** von Fragen.
     */
    '@type': seite.kopf.frage ? ['Article', 'FAQPage'] : 'Article',
    headline: seite.kopf.titel,
    description: alsText(kurz),
    inLanguage: 'de-AT',
    dateModified: seite.kopf.stand,
    publisher: organisation(),
    ...(seite.kopf.frage
      ? {
          mainEntity: [{
            '@type': 'Question',
            name: seite.kopf.frage,
            acceptedAnswer: { '@type': 'Answer', text: alsText(kurz) },
          }],
        }
      : {}),
    ...(liste ? { about: liste } : {}),
  };

  return { titel: seite.kopf.titel, kurz: alsText(kurz), html: teile.join('\n'), jsonLd, intern: seite.kopf.intern };
}

/**
 * Der jüngste Preisstand im Katalog.
 *
 * Die Startseite nennt den Abstand zum Listenpreis — eine Zahl, und jede
 * Zahl braucht nach den eigenen Regeln Herkunft und Stand. Die Herkunft ist
 * der Vergleich mit der Lieferantenliste, der Stand kommt von hier. Gefunden
 * hat die fehlende Angabe der Inhaltsprüfer, als er zum ersten Mal über die
 * gebauten Seiten lief.
 */
/**
 * **Berichtigt am 01.09.** Hier stand das **Maximum** aller Preisstände, und
 * die Startseite schrieb „Alle Preise Stand: …" davor. Der älteste
 * Einkaufspreis ist vom 22. April, der jüngste vom 17. August — der Satz
 * behauptete für einunddreißig Artikel eine Frische, die sie nicht haben.
 *
 * Der Anfragetext konnte es die ganze Zeit richtig („Preisstand der
 * Positionen: X bis Y"). Die Spanne kommt jetzt aus `preisstandSpanne()` in
 * `src/preisalter.js`, damit alle drei Ausgaben dieselbe benutzen.
 */
function preisStand(katalog) {
  return preisstandSpanne(katalog.artikel)?.text ?? 'siehe Artikelseiten';
}

function startSeite(katalog, befund, seiten, verweis, katalogDatei, bereitschaft) {
  const gruppen = [...seiten.values()].filter((s) => s.art === 'gruppen');
  const systeme = [...seiten.values()].filter((s) => s.art === 'system');
  const wissen = [...seiten.values()].filter((s) => s.art === 'wissen');

  const kachel = (s, marke_, bild) => `<a class="kachel" href="${verweis(s.id)}">
  ${bild ? `<span class="bild">${bild}</span>` : ''}
  <span class="k">${esc(marke_)}</span>
  <span class="t">${esc(s.kopf.titel)}</span>
  <span class="b">${esc(alsText(String(s.kopf.kurz ?? '')).slice(0, 160))}…</span></a>`;

  return {
    titel: 'Baustoffe zum Baumeisterpreis',
    // **Weisung vom 28. August: keine Spanne ausgeben.** Bis dahin stand die
    // Handelsspanne im ersten Satz der Startseite und in der Preistafel —
    // als Verkaufsargument, mit einer begründeten Ausnahme vom
    // Interna-Prüfer. Die Ausnahme ist weg, und damit meldet der Prüfer jede
    // Rückkehr der Zahl von selbst.
    //
    // An ihre Stelle tritt die Angabe, die dem Kunden ohnehin mehr sagt:
    // **wie weit der Preis unter der Liste des Lieferanten liegt.** Sie ist
    // aus seiner Sicht die Ersparnis; die Spanne war aus unserer Sicht der
    // Ertrag. Beide Zahlen beschreiben dieselbe Kalkulation von zwei Seiten
    // — nur verrät die eine die Einkaufskondition und die andere nicht.
    kurz: `Baustoffe zum Baumeisterpreis, geliefert im Umkreis von ${ORT}. ${befund.artikelGesamt} Artikel, ${befund.unterListe} davon unter dem Listenpreis des Lieferanten.`,
    html: `<h1>Baustoffe zum<br>Baumeisterpreis</h1>
<p class="lede">Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — deshalb liegen
${befund.unterListe} von ${befund.mitPreis} Artikeln unter dem Listenpreis des Lieferanten, im Median um
${String(befund.medianAbstandZurListe).replace('.', ',')} %. Preise der ${befund.artikelGesamt} Artikel, Stand: ${esc(preisStand(katalog))}.
Geliefert wird im Umkreis, nicht in ganz Österreich: Das ist der Grund, warum die Rechnung aufgeht.</p>

<div class="preistafel">
  <div><span class="k">Artikel</span><span class="w">${befund.artikelGesamt}</span><span class="e">aus dem laufenden Einkauf</span></div>
  <div><span class="k">unter Liste</span><span class="w">${befund.unterListe}</span><span class="e">von ${befund.mitPreis} mit Preisvergleich</span></div>
  <div><span class="k">im Median</span><span class="w">${String(befund.medianAbstandZurListe).replace('.', ',')} %</span><span class="e">unter dem Listenpreis</span></div>
  <div><span class="k">Lieferung</span><span class="w">${LIEFERGEBIET.bezirke.length} Bezirke</span><span class="e">regional, nicht österreichweit</span></div>
</div>

${bereitschaft.startklar ? `<div class="antwort">Alle Preise sind Nettopreise für Unternehmer und tragen einen Preisstand.</div>`
  : `<div class="antwort"><strong>Dies ist eine Vorschau, kein laufender Shop.</strong> Bestellen können Sie
hier noch nicht${fehltSatz(bereitschaft.kassenhinweise)
  ? ` — ${esc(fehltSatz(bereitschaft.kassenhinweise))}`
  : ''}. Jeder Preis ist vor der
Veröffentlichung beim Lieferanten zu bestätigen. <strong>Was schon geht:</strong> Warenkorb füllen,
Bezirk wählen — und in der <a href="${verweis('kasse')}">Kasse</a> die fertig gerechnete Anfrage
mitnehmen, mit Positionen, Fracht und Preisstand. Alle Preise sind Nettopreise für Unternehmer.</div>`}

<h2>Sortiment</h2>
<div class="kacheln">${gruppen
  .sort((a, b) => (befund.jeGruppe[b.kopf.gruppe]?.gesamt ?? 0) - (befund.jeGruppe[a.kopf.gruppe]?.gesamt ?? 0))
  .map((s) => kachel(s, `${(befund.jeGruppe[s.kopf.gruppe]?.gesamt ?? 0)} Artikel`, gruppenBild(s.kopf.gruppe)))
  .join('')}</div>

<h2>Alle ${befund.artikelGesamt} Artikel</h2>
<p>Vollständig, mit Nettopreis und Preisstand. Jede Zeichnung ist ein Schema aus den Maßen des
Artikels — kein Herstellerfoto: Was gezeigt wird, steht auch im Datensatz.</p>
<div class="filterleiste" id="filterleiste"></div>
<div class="raster" id="warenraster">${[...katalog.artikel]
  .sort((a, b) => a.gruppe.localeCompare(b.gruppe, 'de') || a.bezeichnung.localeCompare(b.bezeichnung, 'de'))
  .map((a) => artikelKarte(a, befund, verweis)).join('')}</div>

<h2>Systemlisten — was zusammengehört</h2>
<p>Die häufigste Ursache für einen Baustellenstillstand ist nicht die fehlende Palette, sondern das
fehlende Kantenschutzprofil. Diese Listen führen auf, was zu einer Aufgabe gehört — vollständig, damit
Sie streichen können statt nachzubestellen.</p>
<div class="kacheln">${systeme.map((s) => kachel(s, 'Systemliste')).join('')}</div>

<h2>Vor der Bestellung</h2>
<p class="mehr"><a href="${verweis('wissen/index')}">${wissen.length} fachliche Seiten</a> zu den Fragen,
die vor einer Baustoffbestellung zu klären sind — Untergrund, Mengen, Lagerung, Verarbeitung bei Kälte.
Jede beantwortet genau eine Frage, und die Antwort steht in den ersten zwei Sätzen.</p>`,
    jsonLd: {
      '@context': 'https://schema.org',
      ...organisation(),
      address: { '@type': 'PostalAddress', addressLocality: ORT, addressCountry: 'AT' },
      areaServed: liefergebietOrte({ land: LIEFERGEBIET.land, bezirke: LIEFERGEBIET.bezirke.map((b) => b.name) }),
      // Dieselbe Schreibweise wie das `rel="canonical"` der Startseite. Hier
      // stand `BASIS` ohne Schrägstrich — eine dritte Fassung derselben
      // Adresse neben `/` und `/index.html`.
      url: kanonisch(BASIS, 'index'),
    },
  };
}

/* ------------------------------------------------------------------ *
 * Die drei Seiten, die aus dem Schaufenster einen Laden machen
 * ------------------------------------------------------------------ */

function sucheSeite(verweis) {
  return {
    titel: 'Suche',
    kurz: 'Suche im Sortiment und in den Fachseiten.',
    nurBedienung: true,
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › Suche</p>
<h1>Suche</h1>
<p class="lede" id="suche-kopf">Geben Sie oben einen Suchbegriff ein.</p>
<noscript><p class="antwort">Die Suche braucht JavaScript. Ohne das führen
<a href="${verweis('index')}">die Startseite</a> und die Warengruppen in der Kopfleiste
zum vollständigen Sortiment — es sind keine versteckten Artikel dabei.</p></noscript>
<div id="suche-ziel"></div>`,
    jsonLd: null,
  };
}

function warenkorbSeite(verweis) {
  return {
    titel: 'Warenkorb',
    kurz: 'Der Warenkorb mit Warenwert, Fracht und Umsatzsteuer, getrennt ausgewiesen.',
    nurBedienung: true,
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › Warenkorb</p>
<h1>Warenkorb</h1>
<noscript><p class="antwort">Der Warenkorb braucht JavaScript.</p></noscript>
<div id="warenkorb-ziel"></div>`,
    jsonLd: null,
  };
}

function kasseSeite(verweis) {
  return {
    titel: 'Lieferadresse und Zahlung',
    kurz: 'Lieferbezirk und Zahlweg — die Bestellung wird durchgerechnet, aber nicht ausgelöst.',
    nurBedienung: true,
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> ›
<a href="${verweis('warenkorb')}">Warenkorb</a> › Lieferung und Zahlung</p>
<h1>Lieferung und Zahlung</h1>
<noscript><p class="antwort">Diese Seite braucht JavaScript.</p></noscript>
<div id="kasse-ziel"></div>`,
    jsonLd: null,
  };
}

function wissenIndex(seiten, verweis) {
  const wissen = [...seiten.values()].filter((s) => s.art === 'wissen');
  return {
    titel: 'Wissen — Fragen vor der Bestellung',
    kurz: 'Fachliche Seiten zu den Fragen, die vor einer Baustoffbestellung zu klären sind.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › Wissen</p>
<h1>Wissen</h1>
<p class="lede">Jede Seite beantwortet genau eine Frage, und die Antwort steht in den ersten zwei Sätzen.
Wer weiterliest, will die Begründung; wer nicht weiterliest, soll trotzdem die Antwort haben.</p>
<div class="kacheln">${wissen.map((s) => `<a class="kachel" href="${verweis(s.id)}">
  <span class="k">${esc(String(s.kopf.gruppe ?? 'Grundsätzlich'))}</span>
  <span class="t">${esc(s.kopf.titel)}</span>
  <span class="b">${esc(String(s.kopf.frage ?? ''))}</span></a>`).join('')}</div>`,
    jsonLd: null,
  };
}

/* ------------------------------------------------------------------ *
 * Rechtsseiten
 * ------------------------------------------------------------------ */

/** Wandelt die Lückenmarke `[[ X — FEHLT ]]` in sichtbares Markup. */
function mitLuecken(text) {
  return esc(text).replace(
    /\[\[\s*(.+?)\s*—\s*FEHLT\s*\]\]/g,
    (_, was) => `<mark class="luecke">${was} — fehlt</mark>`,
  );
}

function rechtlichesIndex(betreiber, verweis) {
  const p = pruefeBetreiberdaten(betreiber);
  const seiten = [
    ['rechtliches/impressum', 'Impressum', 'Pflichtangaben nach § 5 ECG und § 14 UGB'],
    ['rechtliches/agb', 'Geschäftsbedingungen', 'Gliederung in dreizehn Punkten, ausschließlich für Unternehmer'],
    ['rechtliches/datenschutz', 'Datenschutz', 'Neun Punkte nach DSGVO, samt der Stelle, die im Baustoffhandel wirklich klemmt'],
    ['rechtliches/abnahme', 'Abnahme und Rügefrist', 'Warum § 377 UGB auf der Baustelle beginnt, nicht im Büro'],
  ];
  return {
    titel: 'Rechtliches',
    kurz: 'Impressum, Geschäftsbedingungen, Datenschutz und die Rügefrist — als Gerüst mit ausgewiesenen Lücken, nicht als fertiger Rechtstext.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › Rechtliches</p>
<h1>Rechtliches</h1>
<p class="lede">Diese Seiten sind ein <strong>Gerüst mit sichtbaren Lücken</strong>, kein fertiger
Rechtstext. Jede Lücke ist benannt und farblich markiert, damit niemand mit einem halben Impressum
online geht und es für ein ganzes hält.</p>

<div class="antwort"><strong>Warum das so gemacht ist.</strong> Eine erfundene Klausel wäre der
teuerste Fehler dieses Vorhabens: Sie sieht aus wie Recht, ist keines, und man merkt es erst im
Streitfall. Für den endgültigen Text ist ein Rechtstexteanbieter mit Aktualisierungsdienst
vorgesehen. Was hier steht, ist die Zuarbeit — jedes Feld, das er ohnehin abfragt, schon
zusammengetragen.</p>

<div class="preistafel">
  <div><span class="k">Impressum</span><span class="w">${p.vollstaendig ? 'vollständig' : `${p.fehlend.length} Lücken`}</span><span class="e">${p.vollstaendig ? 'alle Pflichtfelder besetzt' : 'Pflichtfelder nach § 5 ECG'}</span></div>
  <div><span class="k">Geschäftsbedingungen</span><span class="w">${AGB_GLIEDERUNG.length} Punkte</span><span class="e">Gliederung steht, Wortlaut fehlt</span></div>
  <div><span class="k">Datenschutz</span><span class="w">${DATENSCHUTZ_GLIEDERUNG.length} Punkte</span><span class="e">Gliederung steht, Wortlaut fehlt</span></div>
  <div><span class="k">Widerrufsbelehrung</span><span class="w">entfällt</span><span class="e">nur bei Verbrauchergeschäft nötig</span></div>
</div>

<div class="kacheln">${seiten.map(([id, t, b]) => `<a class="kachel" href="${verweis(id)}">
  <span class="k">Pflichtangabe</span><span class="t">${esc(t)}</span><span class="b">${esc(b)}</span></a>`).join('')}</div>

<h2>Was ohne Verbrauchergeschäft entfällt</h2>
<p>Der Shop richtet sich <strong>ausschließlich an Unternehmer</strong>. Das erspart drei Pflichten —
und das ist keine Sorglosigkeit, sondern eine Bedingung: Wer Verbraucherbestellungen nicht wirksam
ausschließt, dem gilt Verbraucherrecht trotzdem.</p>
<ul>${B2B_ABGRENZUNG.entfaellt.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>

<h2>Was trotzdem bleibt</h2>
<ul>${B2B_ABGRENZUNG.bleibt.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`,
    jsonLd: null,
  };
}

function impressumSeite(betreiber, verweis) {
  const i = erzeugeImpressum(betreiber);
  return {
    titel: 'Impressum',
    kurz: 'Pflichtangaben nach § 5 E-Commerce-Gesetz und § 14 Unternehmensgesetzbuch.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis('rechtliches/index')}">Rechtliches</a> › Impressum</p>
<h1>Impressum</h1>
${i.vollstaendig ? '' : `<div class="antwort"><strong>Noch nicht vollständig.</strong> ${i.fehlend.length} Pflichtangaben fehlen und sind unten markiert. Solange eine Marke sichtbar ist, darf diese Seite nicht online gehen — ein unvollständiges Impressum ist im Merchant Center der häufigste Ablehnungsgrund und außerhalb davon abmahnfähig.</div>`}
<pre class="rechtstext">${mitLuecken(i.text)}</pre>
${i.vollstaendig ? '' : `<h2>Was fehlt</h2><ul>${i.fehlend.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<p>Diese Angaben liegen beim Auftraggeber: Kontaktdaten aus dem laufenden Betrieb, die
UID-Nummer aus dem Steuerakt, der Gewerbewortlaut aus dem Gewerberegisterauszug. Sie werden
hier bewusst nicht erraten.</p>`}
<p>Anwendbare Rechtsvorschriften und der Gewerberegisterauszug sind über das
<a href="https://www.ris.bka.gv.at/" target="_blank" rel="noopener noreferrer">Rechtsinformationssystem des Bundes</a>
und das <a href="https://firmen.wko.at/" target="_blank" rel="noopener noreferrer">WKO-Firmenverzeichnis</a> nachprüfbar.</p>`,
    jsonLd: null,
  };
}

function agbSeite(verweis) {
  return {
    titel: 'Geschäftsbedingungen — Gliederung',
    kurz: 'Dreizehn Punkte, ausschließlich für Unternehmer. Die Gliederung steht mit Begründung je Punkt; der verbindliche Wortlaut kommt vom Rechtstexteanbieter.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis('rechtliches/index')}">Rechtliches</a> › Geschäftsbedingungen</p>
<h1>Geschäftsbedingungen</h1>
<div class="antwort"><strong>Das hier ist die Gliederung, nicht der Vertrag.</strong> Jeder Punkt
steht mit dem Grund, warum er nötig ist — das ist genau die Vorarbeit, die ein Rechtstexteanbieter
sonst mit Rückfragen erhebt. Der verbindliche Wortlaut fehlt und wird nicht erfunden.</div>
<div class="scroll"><table><thead><tr><th>Nr.</th><th>Punkt</th><th>Warum</th></tr></thead><tbody>
${AGB_GLIEDERUNG.map((p) => `<tr><td class="n">${p.nr}</td><td><strong>${esc(p.titel)}</strong></td><td>${p.hinweis ? esc(p.hinweis) : '<span class="marker sperrig">noch zu begründen</span>'}</td></tr>`).join('')}
</tbody></table></div>
<h2>Punkt 9: Zahlung</h2>
<p>Die Zahlungsbedingungen sind als einzige schon entschieden.
<strong>Zahlungsziel: null Tage.</strong> Gezahlt wird bei der Bestellung. Das ist im
B2B-Baustoffhandel ungewöhnlich, und der Grund steht dabei: Dieser Shop rechnet knapp. Ein
Zahlungsziel kostet Geld — Zinsen, Ausfälle, Mahnaufwand — und dieses Geld müsste auf jeden
Preis aufgeschlagen werden, auch auf den des Kunden, der sofort zahlt. <strong>Wer nicht auf Ziel kauft, zahlt hier nicht für den, der es tut.</strong></p>
<div class="scroll"><table><thead><tr><th>Zahlweg</th><th>Stand</th><th>Was das heißt</th></tr></thead><tbody>
${[
  ...ZAHLUNGSBEDINGUNGEN.angeboten.map((z) => ({ ...z, stand: 'angeboten' })),
  ...ZAHLUNGSBEDINGUNGEN.zurueckgestellt.map((z) => ({ ...z, stand: 'noch nicht' })),
  ...ZAHLUNGSBEDINGUNGEN.ausgeschlossen.map((z) => ({ ...z, stand: 'nicht angeboten' })),
].map((z) => `<tr><td><strong>${esc(zahlwegName(z.id))}</strong></td><td>${esc(z.stand)}</td><td>${esc(z.kunde)}</td></tr>`).join('')}
</tbody></table></div>
<p><span class="marker sperrig">offen</span> Der Zahlungsanbieter ist noch nicht gewählt.
Solange steht hier eine Bedingung ohne Abwicklung — die Bestellstrecke endet vor der
Zahlung.</p>

<h2>Der Punkt, der am meisten kostet</h2>
<p>Punkt 8 — die Rügefrist nach § 377 UGB. Sie läuft ab der Ablieferung <strong>auf der
Baustelle</strong>, nicht ab dem Tag, an dem der Besteller die Palette zum ersten Mal sieht.
Ausführlich unter <a href="${verweis('rechtliches/abnahme')}">Abnahme und Rügefrist</a>.</p>`,
    jsonLd: null,
  };
}

function datenschutzSeite(verweis) {
  return {
    titel: 'Datenschutz — Gliederung',
    kurz: `${DATENSCHUTZ_GLIEDERUNG.length} Punkte nach DSGVO, dazu der technische Befund zur Website selbst. Der schwierigste Punkt ist der Ansprechpartner vor Ort: ein Dritter, den der Shop nie erreicht und über den er trotzdem informieren müsste.`,
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis('rechtliches/index')}">Rechtliches</a> › Datenschutz</p>
<h1>Datenschutz</h1>
<div class="antwort"><strong>Gliederung, kein fertiger Text.</strong> Der Wortlaut kommt vom
Rechtstexteanbieter. Was hier steht, ist die Liste der Punkte, die er abdecken muss — und einer
davon ist im Baustoffhandel unangenehmer als in den meisten Branchen.</div>
<ol>${DATENSCHUTZ_GLIEDERUNG.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
<h2>Was beim bloßen Besuch dieser Seite geschieht</h2>
<p>Der technische Befund, aus dem Quelltext gelesen und nicht aus einer Vorlage. Er ist kein
Rechtstext — er ist das, was der Rechtstexteanbieter wissen muss und außer dem Bau niemand kennt.</p>
<div class="scroll"><table>
<thead><tr><th>Punkt</th><th>Befund</th></tr></thead>
<tbody>${websiteVerarbeitung(WEG.aktiv).map((v) => `<tr><td>${esc(v.was)}</td><td>${esc(v.befund)}</td></tr>`).join('')}</tbody>
</table></div>
<h2>Die Stelle, die wirklich klemmt</h2>
<p>Wer auf der Baustelle die Ware übernimmt, ist ein <strong>Dritter</strong>. Er hat mit dem Shop
keinen Vertrag, seine Rufnummer stammt vom Besteller, und Artikel 14 DSGVO verlangt, <em>ihn</em>
zu informieren — eine Person, die der Shop nie erreicht.</p>
<p>Der einzige offene Weg führt über den, der ihn kennt: Der Besteller sichert im Bestellvorgang
zu, ihn unterrichtet zu haben, und der Shop hält die Zusicherung fest. <strong>Das ist keine
Erfüllung der Informationspflicht aus Artikel 14 DSGVO durch den Shop</strong>, sondern ihre
Verlagerung auf denjenigen, der sie erfüllen kann — samt Dokumentation, dass danach gefragt wurde. Ob das genügt, entscheidet der
Rechtstexteanbieter; hier steht der Wortlaut, über den er dann reden kann.</p>`,
    jsonLd: null,
  };
}

function abnahmeSeite(verweis) {
  return {
    titel: 'Abnahme und Rügefrist auf der Baustelle',
    kurz: 'Nach § 377 UGB beginnt die Untersuchungs- und Rügepflicht mit der Ablieferung auf der Baustelle. Wer erst beim Verlegen hinsieht, ist zu spät — und die Ware gilt als genehmigt.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis('rechtliches/index')}">Rechtliches</a> › Abnahme</p>
<h1>Abnahme und Rügefrist</h1>
<p class="lede">Im Geschäft zwischen Unternehmern ist die Untersuchungs- und Rügepflicht nach
§ 377 UGB eine echte Obliegenheit — keine Formalie. Die Frist läuft ab der Ablieferung
<strong>auf der Baustelle</strong>.</p>
<div class="antwort"><strong>Warum das teuer wird.</strong> Ein Transportschaden an einer Rolle
oder einer Palette fällt oft erst beim Verarbeiten auf, also Wochen später. Dann ist die Rüge
verspätet, und die Ware gilt als genehmigt. Deshalb ist der Ansprechpartner vor Ort ein
Pflichtfeld: Er ist nicht für die Spedition da, sondern für diese Frist.</div>
<h2>Was vor der Anlieferung geklärt sein muss</h2>
<ul>${LIEFERHINWEISE.map((h) => `<li>${esc(typeof h === 'string' ? h : (h.text ?? h.titel ?? JSON.stringify(h)))}</li>`).join('')}</ul>
<p>Praktische Folge für die Bestellung: Wer selbst nicht auf der Baustelle ist, benennt jemanden,
der übernimmt <em>und hinsieht</em>. Das kann ein anderes Gewerk oder der Bauherr sein — wer
übernimmt, nimmt für den Besteller an.</p>
<div class="antwort"><strong>Ein Punkt oben trifft heute noch nicht zu.</strong> Der Hinweis auf
mehrere Sendungen an verschiedenen Tagen stammt aus dem ursprünglichen Zuschnitt mit mehreren
Herstellern. Das jetzige Sortiment läuft über <em>einen</em> Lieferanten, also kommt eine
Bestellung in einer Sendung. Der Punkt bleibt trotzdem stehen: Sobald ein zweiter Lieferant
dazukommt, gilt er wieder — und ein Hinweis, der einmal weggelassen wurde, kommt selten
zurück.</div>`,
    jsonLd: null,
  };
}

/**
 * Die Lieferseite maschinenlesbar — die Fragen, die ein Assistent bekommt.
 *
 * **Der Befund vom 2. September.** Jede Artikelseite trägt `Product`, jede
 * Wissens- und Gruppenseite `Article` und `FAQPage`, die Startseite
 * `Organization`. Die **Lieferseite** trug nichts — ausgerechnet die Seite mit
 * den Frachtsätzen und dem Liefergebiet, also den beiden Auskünften, nach
 * denen ein Kaufinteressent zuerst fragt.
 *
 * Die Antworten entstehen aus **denselben Werten** wie die Preistafel darüber;
 * eine zweite Fassung wäre eine zweite Wahrheit. Was die Daten nicht hergeben,
 * steht nicht da: Nach der **Lieferzeit** wird hier nichts gefragt, weil sie
 * unbekannt ist — eine erfundene Frist in der maschinenlesbaren Auszeichnung
 * wäre schlimmer als in der Prosa, denn sie wird zitiert und nicht gelesen.
 */
function lieferungFragen(f, verweis, mindestNetto) {
  const bezirke = LIEFERGEBIET.bezirke.map((b) => b.name).join(', ');
  return [
    ['Was kostet die Zustellung?',
      `${euro(f.pauschaleNetto)} € netto Pauschale je Lieferung, bei palettierter Ware zuzüglich `
      + `${euro(f.sperrgutZuschlagNetto)} € netto Kranentladung je Hub. Die Fracht fällt je Lieferung `
      + 'an und nicht je Artikel.'],
    ['Gibt es eine Frei-Haus-Schwelle?',
      'Nein. Die Frachtpauschale hängt an der Fahrt und nicht am Warenwert; wer sie trotzdem als '
      + '„frei Haus" bewirbt, hat sie in alle Warenpreise eingerechnet.'],
    ['Wohin wird geliefert?',
      `In die Bezirke ${bezirke} — regional, nicht österreichweit.`],
    ['Kann ich selbst abholen?',
      'Ja, ausdrücklich vorgesehen. Wer selbst abholt, zahlt keine Fracht.'],
    ['Gibt es einen Mindestbestellwert?',
      mindestNetto
        ? `Ja: ${euro(mindestNetto)} € netto Warenwert je Lieferung. Werden mehrere Hersteller `
          + 'bestellt, entstehen mehrere Lieferungen, und die Grenze gilt für jede einzelne — '
          + 'Anfahrt und Verpackung fallen je Lieferung an. Darunter ist Selbstabholung der '
          + 'bessere Weg oder das Zusammenlegen mit der nächsten Bestellung.'
        : 'Der Mindestbestellwert ist derzeit nicht hinterlegt; die Kasse nimmt deshalb keine '
          + 'Anfrage an.'],
  ].map(([frage, antwort]) => ({
    '@type': 'Question',
    name: frage,
    acceptedAnswer: { '@type': 'Answer', text: antwort },
  }));
}

function lieferungSeite(katalog, katalogDatei, verweis, mindestNetto) {
  const f = katalog.lieferantenById.get(katalogDatei.lieferantId).fracht;
  return {
    titel: 'Lieferung und Frachtkosten',
    kurz: 'Frachtpauschale je Lieferung, Kranentladung je Hub, kein Frei-Haus-Versand. Liefergebiet ist der Umkreis, nicht ganz Österreich.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › Lieferung</p>
<h1>Lieferung</h1>
<p class="lede">Die Frachtsätze stammen aus den tatsächlichen Lieferantenrechnungen, nicht aus einer
Annahme. Sie werden getrennt ausgewiesen, weil sie je Lieferung anfallen und nicht je Artikel.</p>

<div class="preistafel">
  <div><span class="k">Pauschale je Lieferung</span><span class="w">${euro(f.pauschaleNetto)} €</span><span class="e">netto, Fracht plus Energiekostenzuschlag</span></div>
  <div><span class="k">Palettierte Ware</span><span class="w">+ ${euro(f.sperrgutZuschlagNetto)} €</span><span class="e">netto, Kranentladung je Hub</span></div>
  <div><span class="k">Frei Haus ab</span><span class="w">—</span><span class="e">gibt es nicht</span></div>
  <div><span class="k">Mindestbestellwert</span><span class="w">${mindestNetto ? `${euro(mindestNetto)} €` : '—'}</span><span class="e">netto Warenwert, je Lieferung</span></div>
  <div><span class="k">Liefergebiet</span><span class="w">${LIEFERGEBIET.bezirke.length} Bezirke</span><span class="e">${esc(LIEFERBEZIRKE)}</span></div>
</div>

<h2>Warum es kein „frei Haus" gibt</h2>
<p>Weil die Frachtpauschale bei unserem Lieferanten an der Fahrt hängt und nicht am Warenwert: Der
zugestellte Beleg über 1.934 € netto trägt dieselbe Pauschale wie der über 614 € netto (Quelle: eigene
Lieferantenrechnungen, Stand: 2026-08-31). Wer sie trotzdem als
„frei Haus" bewirbt, hat sie in die Warenpreise eingerechnet, und zwar in alle. Auch in die des Kunden,
der selbst abholt.</p>
<p>Woher wir das wissen: aus fünfzehn eigenen Lieferantenrechnungen, April bis August 2026. Fracht steht
auf drei von fünfzehn — die übrigen sind Abholungen durch den Kunden. Wenige Belege, offen gesagt statt
hoch gerechnet. Stand: 2026-08-31.</p>
<p>Die ausführliche Begründung samt Rechnung steht unter
<a href="${verweis('wissen/warum-keine-gratislieferung')}">Warum es keine Gratislieferung gibt</a>.</p>

<h2>Der Mindestbestellwert</h2>
<p>${mindestNetto
  ? `Wir liefern ab ${euro(mindestNetto)} € netto Warenwert je Lieferung (Quelle: eigene `
    + 'Lieferantenrechnungen und die daraus gerechneten Nebenkosten je Lieferung, Stand: '
    + '2026-09-03). Der Grund ist derselbe wie oben: '
    + 'Anfahrt und Verpackung hängen an der Fahrt und nicht am Warenwert. Eine kleine Zustellung kostet '
    + 'dasselbe wie eine große, und unter dieser Grenze zahlt am Ende einer von beiden drauf.'
  : 'Derzeit ist kein Mindestbestellwert hinterlegt; die Kasse nimmt deshalb keine Anfrage an.'}</p>
<p>Bestellen Sie bei mehreren Herstellern, entstehen mehrere Lieferungen — dann gilt die Grenze
<strong>je Lieferung</strong> und nicht für die Summe. Der Warenkorb sagt Ihnen, was noch fehlt.
Darunter ist Selbstabholung der bessere Weg, oder das Zusammenlegen mit der nächsten Bestellung.</p>

<h2>Selbstabholung</h2>
<p>Ausdrücklich vorgesehen und nicht schlechter gestellt. Wer selbst abholt, zahlt keine Fracht — das ist
der ganze Vorteil der getrennten Ausweisung.</p>`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: lieferungFragen(f, verweis, mindestNetto),
    },
  };
}

/* ------------------------------------------------------------------ *
 * Ausgabe
 * ------------------------------------------------------------------ */

/**
 * Die Daten, die der Shop im Browser braucht.
 *
 * **Was hier nicht hineinkommt, ist der eigentliche Punkt.** Nicht der
 * Lieferantensatz als Ganzes (er führt bei den Platzhalterlieferanten
 * Händlerrabatt und Mindestbestellwert), nicht der Einkaufspreis, nicht die
 * Kalkulation. `oeffentlicherArtikel()` und `oeffentlicherLieferant()` in
 * `shopkern.js` schneiden zu; der Interna-Prüfer sieht die fertige Seite und
 * würde melden, was durchrutscht.
 */
function shopdaten(katalog, befund, seiten, lieferantenDatei, suchwoerterDatei, betreiber = {}, bereitschaft = { startklar: false, kassenhinweise: [] }) {
  const verwendet = new Set(katalog.artikel.map((a) => a.lieferantId));
  const bilder = {};
  for (const a of katalog.artikel) bilder[a.sku] = artikelBild(a);
  return {
    artikel: katalog.artikel.map(oeffentlicherArtikel),
    lieferanten: lieferantenDatei.lieferanten
      .filter((l) => verwendet.has(l.id))
      .map(oeffentlicherLieferant),
    seiten: [...seiten.values()].map((s) => ({
      id: s.id,
      art: s.art,
      titel: s.kopf.titel,
      kurz: alsText(String(s.kopf.kurz ?? '')),
      frage: String(s.kopf.frage ?? ''),
      gruppe: s.kopf.gruppe ?? null,
      // Der Fließtext geht bewusst **nicht** mit: Er wiegt 300 KB, und ein
      // Treffer im vierzigsten Absatz einer Wissensseite hilft niemandem beim
      // Bestellen. Gesucht wird in Titel, Frage und Kurzfassung.
    })),
    bilder,
    // Nur Wort und Ziel: Die Begründung je Eintrag steht in
    // data/suchwoerter.json und gehört ins Repository, nicht in jede
    // ausgelieferte Seite.
    suchwoerter: (suchwoerterDatei?.woerter ?? []).map((w) => ({
      wort: w.wort,
      ...(w.skus ? { skus: w.skus } : {}),
      ...(w.gruppe ? { gruppe: w.gruppe } : {}),
    })),
    // **Was wir nicht führen — und warum, in einem Satz für den Kunden.**
    //
    // Die Suchseite sagte bei jedem Fehlschlag denselben allgemeinen Satz.
    // Für 23 Wörter wissen wir es genauer: Die redaktionelle Entscheidung ist
    // begründet aufgeschrieben, und der Kunde bekam davon nichts zu sehen.
    //
    // Mitgeliefert wird nur `antwort`, nicht `warum`. Das sind zwei Texte für
    // zwei Fragen: `warum` erklärt dem nächsten Lauf die Entscheidung („ein
    // Treffer wäre irreführend"), `antwort` beantwortet die Frage des Kunden
    // („Fugenmörtel für Fliesen führen wir nicht"). Einen davon für den
    // anderen zu halten, ist derselbe Fehler wie eine Funktion, die zwei
    // Fragen auf einmal beantwortet.
    nichtGefuehrt: (suchwoerterDatei?._nichtAufgenommen ?? [])
      .filter((w) => typeof w.antwort === 'string' && w.antwort.trim())
      .map((w) => ({ wort: w.wort, antwort: w.antwort.trim() })),
    einheiten: EINHEITEN,
    bezirke: LIEFERGEBIET.bezirke.map((b) => b.name),
    zahlwege: ZAHLUNGSBEDINGUNGEN.angeboten.map((z) => ({
      id: z.id,
      name: (ZAHLWEGE.find((w) => w.id === z.id) ?? {}).name ?? z.id,
      kunde: z.kunde,
    })),
    // Nur die Angaben, die ohnehin im Impressum stehen. Sie gehen mit, weil
    // der Anfragetext den Empfänger nennen muss — und weil ein leeres
    // `email` der Oberfläche erlaubt zu sagen, **warum** kein Mailknopf da
    // ist, statt ihn stillschweigend wegzulassen.
    betreiber: {
      firma: betreiber.firma ?? '',
      ort: betreiber.ort ?? '',
      email: betreiber.email ?? '',
      telefon: betreiber.telefon ?? '',
      // Die einzige Zusage, die dieser Shop selbst gibt. `null`, solange sie
      // niemand entschieden hat — die Kasse nennt dann keine Zeit, statt eine
      // zu erfinden.
      antwortzeitWerktage: betreiber.antwortzeitWerktage ?? null,
    },
    // Gate 25 — der Mindestbestellwert je Lieferung. Er gehört in die Seite
    // und nicht nur in den Rechenkern: Bis zum 3. September rechnete die
    // Kasse jeden Korb durch und bot ihn als Anfrage an, auch den, den Gate 20
    // bei der Auslösung abgelehnt hätte. `null` heißt hier nicht „egal",
    // sondern „nicht erfüllbar" — `mindestbestellwertKunde` sperrt dann.
    mindestbestellwertNetto: betreiber.mindestbestellwertNetto ?? null,
    // Der Bereitschaftsstand, wie ihn `npm run startklar` rechnet. Die Kasse
    // sagt damit aus den Daten, warum nichts bestellt werden kann — statt
    // aus einem festen Satz, der stehenbliebe, wenn einer der drei Punkte
    // geschlossen wird.
    bestellung: {
      moeglich: bereitschaft.startklar,
      fehlt: bereitschaft.kassenhinweise.map((h) => h.wort),
      // **Ergänzt am 3. September.** Die Kasse bekam bis dahin nur die Liste
      // und bildete den Satz selbst — mit „Es fehlt" auch bei fünf Punkten.
      // Der Fuß und die Startseite bildeten denselben Satz richtig. Jetzt
      // bildet ihn `fehltSatz()` einmal, und der Browser bekommt ihn fertig.
      satz: fehltSatz(bereitschaft.kassenhinweise),
      /**
       * **Der Bestellweg, Gate 26 — ergänzt am 4. September.** `moeglich`
       * oben sagt, ob der Auftraggeber alles beigebracht hat; `wegZiel` sagt,
       * ob es eine Gegenstelle gibt, die eine Bestellung entgegennimmt.
       *
       * Beides ist nicht dasselbe, und die Verwechslung war der Befund vom
       * 3. September: Neun erfüllte Punkte hätten „Bestellen ist möglich"
       * gemeldet, während im ganzen Shop kein `fetch` stand.
       *
       * `null` heißt: kein Weg. Die Kasse zeigt dann den Kopiertext wie
       * bisher — sie erfindet keinen Knopf, der ins Leere führt.
       */
      wegZiel: WEG.aktiv ? EMPFANGSSKRIPT : null,
      /**
       * **Die Felder kommen aus dem Register, nicht aus der Oberfläche.**
       * Der erste Wurf am 4. September hatte drei Felder im Browser stehen,
       * während `pruefeBestelldaten` acht verlangt — die Kasse hätte
       * Bestellungen entgegengenommen, aus denen kein Angebot werden kann.
       */
      felder: WEG.aktiv ? BESTELLFELDER.map((f) => ({
        name: f.name, beschriftung: f.beschriftung, art: f.art, beispiel: f.beispiel ?? null,
      })) : [],
    },
  };
}

/**
 * Das Ziel des Sprungverweises — vor dem ersten eigenen Inhalt der Seite.
 *
 * **Berichtigt am 30.08.** Hier stand
 * `koerper.replace('<p class="krume">', …)`: Der Anker wurde vor die
 * Brotkrume gesetzt. Das traf 80 von 81 Seiten — und ausgerechnet die
 * Startseite nicht, denn die trägt keine Brotkrume. Ihr Sprungverweis
 * „Zum Inhalt springen" zeigte auf ein `#inhalt`, das es dort nicht gibt.
 *
 * Die erste Seite, die ein Besucher sieht, war die einzige ohne Ziel. Genau
 * die Sorte Befund, die eine Stichprobe nicht findet: Neun ausgesuchte
 * Seiten hätten neunmal grün gemeldet.
 *
 * Der erste Anlauf setzte den Anker bei fehlender Brotkrume an den Anfang
 * des Körpers — also **vor** den Sprungverweis selbst. Damit gab es zwar ein
 * Ziel, aber der Sprung übersprang nichts: Kopfleiste, Suchfeld und Menü
 * blieben dahinter. Ein Sprungverweis, der auf den Punkt vor sich selbst
 * zeigt, ist schlimmer als keiner, weil er behauptet, etwas zu tun.
 *
 * Der Anker gehört hinter die Kopfleiste — dort, wo der eigene Inhalt der
 * Seite beginnt. Das ist auf allen 81 Seiten dieselbe Stelle, mit und ohne
 * Brotkrume, und braucht keine Fallunterscheidung mehr.
 */
/**
 * **Erweitert am 31.08.: aus dem Anker wird ein `<main>`.**
 *
 * Der Anker war ein leeres `<div id="inhalt" tabindex="-1">`. Er tat, was er
 * sollte — der Sprungverweis setzte den Fokus hinter die Kopfleiste —, und
 * doch fehlte allen 81 Seiten damit die Hauptbereichs-Landmarke.
 *
 * Der Unterschied ist nicht formal:
 *
 * 1. **Der Sprung landete an einer Stelle, nicht in einem Bereich.** Wer per
 *    Vorleseprogramm „zum Inhalt" springt, erfährt anschließend nicht, wo der
 *    Inhalt wieder aufhört. Eine Landmarke hat einen Anfang **und** ein Ende.
 * 2. **Landmarkennavigation gab es gar nicht.** Ein Vorleseprogramm listet
 *    `banner`, `main` und `contentinfo` zum Anspringen auf; `main` fehlte in
 *    dieser Liste auf jeder Seite.
 * 3. **Der Kanal, für den dieser Shop gebaut ist, liest mit.** Textauszieher
 *    und Sprachmodelle gewichten `<main>` als das stärkste Signal dafür, wo
 *    der eigene Inhalt einer Seite steht und wo Kopfleiste, Menü und Fußzeile
 *    aufhören. Eine Seite ohne `main` überlässt diese Abgrenzung der Heuristik.
 *
 * Die Grenzen sind auf allen 81 Seiten eindeutig: genau ein `</header>` und
 * genau ein `<footer>`. Fehlt eine der beiden, bricht der Bau ab, statt eine
 * Landmarke zu setzen, deren Ende geraten wäre — dieselbe Haltung wie beim
 * Anker zuvor.
 */
function sprungziel(koerper) {
  if (!koerper.includes('</header>')) {
    throw new Error('Seite ohne Kopfleiste — das Ziel des Sprungverweises ist unbestimmt.');
  }
  if (!koerper.includes('<footer>')) {
    throw new Error('Seite ohne Fußzeile — das Ende des Hauptbereichs wäre geraten.');
  }
  return koerper
    .replace('</header>', '</header>\n<main id="inhalt" tabindex="-1">')
    .replace('<footer>', '</main>\n<footer>');
}

/**
 * Der Satz im Seitenfuß, der sagt, was der Shop heute kann.
 *
 * **Befund vom 01.09.** Im Fuß aller 81 Seiten stand fest verdrahtet:
 * „Vorschau ohne Bestellmöglichkeit. Nichts ist gegründet, verkauft oder
 * eingenommen." Der Satz stimmt heute. Er stimmt an dem Tag nicht mehr, an
 * dem der Auftraggeber Zahlungsanbieter, Rechtstexte und Impressum
 * geschlossen hat — und dann steht er trotzdem noch da, auf jeder Seite, und
 * sagt dem Kunden, dass er hier nicht bestellen kann.
 *
 * Die Kasse hat genau diesen Fehler schon hinter sich: Sie zählte früher fest
 * auf, was fehlt, und rechnet es seither aus `startklar()`. Die Startseite
 * ebenso. **Der Fuß war der dritte Weg zur selben Aussage — und der einzige
 * ohne Quelle.** Dass er auf achtzig Seiten steht statt auf einer, macht ihn
 * zum teuersten der drei.
 *
 * Ein Fehler mit bekanntem Auslösetag ist kein latenter, sondern ein
 * terminierter.
 */
export function betriebshinweis(bereitschaft) {
  const offen = bereitschaft?.kassenhinweise ?? [];
  if (bereitschaft?.startklar && offen.length === 0) {
    return 'Alle Preise netto für Unternehmer. Keine Steuer- oder Rechtsberatung.';
  }
  const satz = fehltSatz(offen);
  const was = satz ? ` — ${satz}` : '';
  return `Vorschau ohne Bestellmöglichkeit${was}. Nichts ist gegründet, verkauft oder eingenommen. `
    + 'Keine Steuer- oder Rechtsberatung.';
}

/**
 * Die kanonische Adresse einer Seite.
 *
 * **Gefunden am 01.09.:** Keine der 81 Seiten trug ein `rel="canonical"`.
 * Für einen Shop, der über Suche und maschinelle Auskunft gefunden werden
 * soll, ist das eine Lücke mit drei Ausgängen: `bauversand.com/`,
 * `bauversand.com/index.html` und `www.bauversand.com/…` sind für einen
 * Indexer drei Adressen mit demselben Inhalt. Welche davon zählt, entscheidet
 * dann er — und zerlegt die Signale auf drei Seiten statt sie zu bündeln.
 *
 * Die Startseite ist der Sonderfall: Ihre kanonische Adresse ist die Wurzel
 * und nicht `/index.html`. Das ist die Adresse, die jemand tippt und die in
 * einer Anzeige steht.
 */
export function kanonisch(basis, id) {
  const wurzel = String(basis ?? '').replace(/\/+$/, '');
  if (!wurzel) return null;
  return id === 'index' ? `${wurzel}/` : `${wurzel}/${id}.html`;
}

function rahmen(seite, verweis, { eigenstaendig, skriptDatei, tiefe = false, daten = null, bereitschaft, id = null }) {
  const nav = NAV.map(([id, t]) => `<a href="${verweis(id)}">${esc(t)}</a>`).join('');
  // **Was ohne JavaScript nicht geht — auf jeder Seite, nicht nur auf dreien.**
  //
  // Gemessen am 29.08.: Warenkorb, Kasse und Suchseite erklären sich seit
  // jeher selbst. Das Suchfeld in der Kopfleiste steht aber auf **allen 81
  // Seiten**, und der Knopf „In den Warenkorb" auf allen 46 Artikelseiten —
  // beide ohne ein Wort dazu. Ein Bedienelement, das aussieht wie ein
  // Bedienelement und nichts tut, ist eine Zusage, die der Shop nicht hält.
  //
  // Der Inhalt selbst braucht kein JavaScript: Eine Artikelseite trägt rund
  // 4.000 Zeichen Text, eine Gruppenseite 3.300, die Startseite 8.500 — alles
  // im ausgelieferten HTML. Gesagt wird deshalb, was **nicht** geht, und
  // wohin es stattdessen geht.
  const kopf = `<a class="springen" href="#inhalt">Zum Inhalt springen</a>
<noscript><p class="antwort"><strong>Ohne JavaScript</strong> arbeiten Suchfeld und Warenkorb nicht.
Alle Artikel-, Wissens- und Gruppenseiten sind vollständig lesbar; das Sortiment steht über die
Warengruppen in der Kopfleiste.</p></noscript>
<header class="kopfleiste">
  <a class="logo" href="${verweis('index')}">${esc(MARKE)}</a>
  <div class="suche">
    <input id="suchfeld" type="search" autocomplete="off" placeholder="Artikel suchen — z. B. Spachtel, XPS 50, Kanalbogen"
      aria-label="Im Sortiment suchen">
    <div id="suchvorschlag" class="vorschlaege" hidden></div>
  </div>
  <a class="korb" href="${verweis('warenkorb')}" aria-label="Warenkorb">Warenkorb<span
    class="zahl" data-korbzaehler hidden></span></a>
  <nav>${nav}</nav>
</header>`;
  const fuss = `<footer>
  <p><strong>Liefergebiet:</strong> ${esc(LIEFERBEZIRKE)} — regional, nicht österreichweit.
  Fracht fällt je Lieferung an und wird getrennt ausgewiesen; kein Frei-Haus-Versand.
  <a href="${verweis('lieferung')}">Frachtsätze und Gebiet</a></p>
  <p>${esc(FIRMA)}, ${esc(ORT)} · Alle Preise netto in Euro für Unternehmer, Umsatzsteuer ${ustText()} getrennt
  ausgewiesen · <a href="${verweis('wissen/redaktionsprinzipien')}">Wie wir unsere Angaben prüfen</a>
  · <a href="${verweis('wissen/index')}">Wissen</a>
  · <a href="${verweis('rechtliches/index')}">Rechtliches</a>
  · <a href="${verweis('rechtliches/impressum')}">Impressum</a>
  · <a href="${verweis('rechtliches/datenschutz')}">Datenschutz</a></p>
  <p>${esc(betriebshinweis(bereitschaft))}</p>
</footer>`;
  const shopskript = skriptDatei
    ? `<script>window.__SHOP_TIEFE__=${tiefe ? 'true' : 'false'};</script>\n`
      + `<script src="${skriptDatei}" defer></script>`
    : daten
      ? `<script>${daten}</script>`
      : '';
  const koerper = `${kopf}\n${seite.html}\n${fuss}`;
  if (!eigenstaendig) return koerper;

  const ld = seite.jsonLd
    ? `\n<script type="application/ld+json">${jsonFuerSkript(seite.jsonLd)}</script>`
    : '';
/**
 * Drei Seiten, die nichts zu sagen haben — und es jetzt auch sagen.
 *
 * **Gemessen am 30.08.** an allen 81 gebauten Seiten: eigener Inhalt ohne
 * Kopfleiste, Brotkrume und Fußzeile. `warenkorb.html` trägt **43 Zeichen**
 * („Warenkorb. Der Warenkorb braucht JavaScript."), `kasse.html` 53,
 * `suche.html` 214. Die nächstdünnere Seite hat 1.173 — dazwischen liegt
 * kein Übergang, sondern eine Kante.
 *
 * Alle drei standen in der `sitemap.xml`. Eine Sitemap ist aber eine
 * Behauptung: *Diese Seiten lohnen die Aufnahme.* Für einen Warenkorb, der
 * je Besucher anders aussieht und ohne Skript leer ist, stimmt sie nicht —
 * weder für eine Suchmaschine noch für das Sprachmodell, für dessen
 * Auffindbarkeit dieser Shop gebaut wird.
 *
 * `noindex,follow` statt `noindex`: Die Verweise auf diesen Seiten sollen
 * weiterverfolgt werden, nur die Seite selbst gehört nicht in den Index.
 */
function bedienhinweis(seite) {
  return seite.nurBedienung ? '\n<meta name="robots" content="noindex,follow">' : '';
}


  return `<!doctype html>
<html lang="de-AT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seite.titel)} — ${esc(MARKE)}</title>
<meta name="description" content="${esc(kurzfassung(seite.kurz, 300))}">${bedienhinweis(seite)}${
  kanonisch(BASIS, id) ? `\n<link rel="canonical" href="${esc(kanonisch(BASIS, id))}">` : ''}
${SCHRIFTEINBINDUNG}<style>${stil()}</style>${ld}
</head>
<body><div class="huelle">
${sprungziel(koerper)}
</div>
${shopskript}
</body>
</html>
`;
}

function main() {
  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const katalogDatei = lies(join(WURZEL, 'data', 'katalog-baustoff.json'));
  const lieferantenDatei = lies(LIEFERANTENDATEI);
  const suchwoerterDatei = lies(join(WURZEL, 'data', 'suchwoerter.json'));
  const betreiber = lies(BETREIBERDATEI);
  const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');

  if (!existsSync(preisPfad)) {
    console.error('Die Preisdatei fehlt: preise/baustoff-preise.json — ohne sie keine Website.');
    process.exit(2);
  }

  let katalog = ladeBaustoffkatalog(katalogDatei, lies(preisPfad), lieferantenDatei, ZIELMARGE);
  const befund = katalogbefund(katalog);

  /**
   * Der Quelltext der Kundenoberfläche — einmal gelesen, zweimal gebraucht:
   * Er geht ins Bündel, und er beantwortet den ersten Punkt der
   * Bereitschaftsliste („kann der Kunde eine Bestellung abschicken?").
   *
   * Über die Umgebung überschreibbar, wie Betreiber- und Lieferantendatei
   * auch. Eine Probe muss den Bau mit einer Oberfläche laufen lassen können,
   * die abschickt — sonst wäre der grüne Zweig der Auskunft „Bestellen ist
   * möglich" einer, den nie jemand ausgeführt hat.
   */
  /**
   * **Nur mit eingeschaltetem Bestellweg.** `shop-bestellen.js` enthält das
   * einzige `fetch` des Shops; solange der Weg aus ist, darf es nicht ins
   * Bündel — sonst wäre die gemessene Zusage „wird nicht an den Server
   * übertragen" eine Behauptung über den Kontrollfluss statt über den Code.
   *
   * Zusammengesetzt wird in `src/bestellwegbau.js`, damit `npm run startklar`
   * dieselbe Oberfläche misst, die hier ausgeliefert wird.
   */
  const oberflaecheRoh = oberflaeche(
    (datei) => readFileSync(datei === 'shop-ui.js' && process.env.WEBSITE_OBERFLAECHE
      ? process.env.WEBSITE_OBERFLAECHE
      : join(WURZEL, datei), 'utf8'),
    WEG.aktiv,
  );

  // Dieselbe Rechnung wie `npm run startklar`, nicht eine zweite. Die Seiten
  // sagen dem Besucher, was hier möglich ist — und das darf nicht auf einem
  // festen Satz stehen, der eines Tages falsch wird, ohne dass jemand ihn
  // ändert. Fehlerklasse „zwei Wege zur selben Zahl", nur mit Wörtern.
  const bereitschaft = startklar({
    betreiber,
    impressumsfelder: IMPRESSUMSFELDER,
    katalog,
    preisdateiVorhanden: true,
    zahlungsanbieter: betreiber.zahlungsanbieter ?? null,
    rechtstexteFundstelle: betreiber.rechtstexteFundstelle ?? null,
    domainZeigtAufShop: betreiber.domainZeigtAufShop ?? null,
    repositoryPrivat: betreiber.repositoryPrivat ?? null,
    lieferanten: lieferantenDatei.lieferanten,
    // Derselbe Quelltext, der weiter unten ins Bündel geht — **eine** Lesung,
    // nicht zwei. Er entscheidet, ob die Kasse eine Bestellung abschicken
    // kann; gemessen und nicht angenommen. Zwei Lesungen wären die
    // Fehlerklasse „zwei Wege zur selben Zahl": Die Bereitschaft könnte eine
    // Oberfläche beurteilen, die gar nicht ausgeliefert wird.
    oberflaechenQuelltext: oberflaecheRoh,
  });

  // Gate 24: Artikel, deren Einkaufspreis nur auf Anfrage zu haben ist,
  // bekommen keine Seite. Gemeldet wird das trotzdem — **still verschwinden
  // darf nichts**. Eine Ware, die aus dem Katalog fällt, ohne dass es jemand
  // sieht, ist derselbe Fehler wie eine Zahl, die berechnet und verschwiegen
  // wird; nur in die andere Richtung.
  if (befund.nurAnfrageSkus.length) {
    console.log(`Gate 24 — ${befund.nurAnfrageSkus.length} Artikel ohne Seite `
      + `(Einkaufspreis nur auf Anfrage): ${befund.nurAnfrageSkus.join(', ')}`);
    console.log('');
    katalog = { ...katalog, artikel: katalog.artikel.filter((a) => a.ekQuelle !== 'anfrage') };
  }
  const seiten = lesInhalte();

  // Verweise in den Inhalten prüfen, bevor irgendetwas ausgegeben wird.
  const kennungen = new Set([
    'index', 'lieferung', 'wissen/index', 'suche', 'warenkorb', 'kasse',
    'rechtliches/index', 'rechtliches/impressum', 'rechtliches/agb',
    'rechtliches/datenschutz', 'rechtliches/abnahme',
    ...seiten.keys(),
    ...katalog.artikel.map((a) => `artikel/${a.sku}`),
  ]);
  const kaputt = [];
  for (const s of seiten.values()) {
    for (const m of s.koerper.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const id = loeseVerweis(m[1], s.art);
      if (id && !kennungen.has(id)) kaputt.push(`${s.datei}: „${m[1]}" → ${id}`);
    }
    for (const v of alsListe(s.kopf.verwandt)) {
      const id = loeseVerwandt(v);
      if (id && !kennungen.has(id)) kaputt.push(`${s.datei}: verwandt „${v}" → ${id}`);
    }
    for (const sku of alsListe(s.kopf.skus)) {
      if (!kennungen.has(`artikel/${sku}`)) kaputt.push(`${s.datei}: skus „${sku}" gibt es nicht im Katalog`);
    }
  }
  if (kaputt.length) {
    console.error('Verweise, die ins Leere gehen:\n');
    for (const k of kaputt) console.error(`  ${k}`);
    console.error('\nNichts ausgegeben. Ein toter Verweis auf einer Seite, die Vertrauen aufbauen soll,');
    console.error('ist teurer als eine fehlende Seite.');
    process.exit(1);
  }

  /**
   * Jede Warengruppe des Katalogs braucht eine Seite.
   *
   * **Neu am 29.08.**, gefunden beim Probeimport einer Artikelliste **ohne
   * Spalte `gruppe`**: Die Artikel landeten in einer Gruppe „Ohne Gruppe",
   * die es als Seite nicht gibt. Der Bau meldete nichts — es entstand kein
   * toter Verweis, weil die Krume solcher Artikel auf die Startseite
   * ausweicht.
   *
   * > **Ein Artikel in einer Gruppe ohne Seite ist nicht kaputt, sondern
   * > unauffindbar** — er steht in keiner Sortimentsliste und in keiner
   * > Kachel. Nur die Suche kennt ihn.
   *
   * Das ist schlimmer als ein toter Verweis, weil es niemandem auffällt.
   * Deshalb bricht der Bau jetzt auch hier ab und sagt, was zu tun ist:
   * entweder die Artikel einer vorhandenen Gruppe zuordnen oder eine
   * Gruppenseite anlegen.
   */
  const gruppenMitSeite = new Set(
    [...seiten.values()].filter((s) => s.art === 'gruppen').map((s) => s.kopf.gruppe),
  );
  const ohneSeite = new Map();
  for (const a of katalog.artikel) {
    if (gruppenMitSeite.has(a.gruppe)) continue;
    if (!ohneSeite.has(a.gruppe)) ohneSeite.set(a.gruppe, []);
    ohneSeite.get(a.gruppe).push(a.sku);
  }
  if (ohneSeite.size) {
    console.error('Warengruppen ohne Seite:\n');
    for (const [gruppe, skus] of ohneSeite) {
      console.error(`  „${gruppe}" — ${skus.length} Artikel: ${skus.slice(0, 5).join(', ')}`
        + (skus.length > 5 ? ` … und ${skus.length - 5} weitere` : ''));
    }
    console.error('\nNichts ausgegeben. Diese Artikel stünden in keiner Sortimentsliste und in');
    console.error('keiner Kachel — nur die Suche kennt sie. Entweder einer vorhandenen Gruppe');
    console.error('zuordnen oder eine Seite in inhalte/gruppen/ anlegen.');
    process.exit(1);
  }

  // --- alle Seiten aufbauen ---
  const alle = new Map();
  const pfadVerweis = (von) => (ziel) => {
    const tiefe = von.includes('/') ? '../' : '';
    return ziel === 'index' ? `${tiefe}index.html` : `${tiefe}${ziel}.html`;
  };
  const rautenVerweis = () => (ziel) => `#${ziel}`;

  const bauen = (verweisFabrik) => {
    const m = new Map();
    m.set('index', startSeite(katalog, befund, seiten, verweisFabrik('index'), katalogDatei, bereitschaft));
    m.set('wissen/index', wissenIndex(seiten, verweisFabrik('wissen/index')));
    m.set('lieferung', lieferungSeite(katalog, katalogDatei, verweisFabrik('lieferung'),
      betreiber.mindestbestellwertNetto ?? null));
    m.set('suche', sucheSeite(verweisFabrik('suche')));
    m.set('warenkorb', warenkorbSeite(verweisFabrik('warenkorb')));
    m.set('kasse', kasseSeite(verweisFabrik('kasse')));
    m.set('rechtliches/index', rechtlichesIndex(betreiber, verweisFabrik('rechtliches/index')));
    m.set('rechtliches/impressum', impressumSeite(betreiber, verweisFabrik('rechtliches/impressum')));
    m.set('rechtliches/agb', agbSeite(verweisFabrik('rechtliches/agb')));
    m.set('rechtliches/datenschutz', datenschutzSeite(verweisFabrik('rechtliches/datenschutz')));
    m.set('rechtliches/abnahme', abnahmeSeite(verweisFabrik('rechtliches/abnahme')));
    for (const s of seiten.values()) m.set(s.id, inhaltsSeite(s, katalog, befund, seiten, verweisFabrik(s.id)));
    for (const a of katalog.artikel) {
      m.set(`artikel/${a.sku}`, artikelSeite(a, katalog, befund, seiten, verweisFabrik(`artikel/${a.sku}`)));
    }
    return m;
  };

  // --- Interna prüfen, bevor irgendetwas ausgegeben wird ---
  //
  // Dieselbe Stelle und derselbe Grundsatz wie bei den toten Verweisen:
  // Nichts wird geschrieben, was den Prüfer nicht passiert hat. Ein Prüfer,
  // den man nach dem Bauen aufrufen muss, wird irgendwann nicht aufgerufen —
  // und genau so ist die Rohmarge auf die AGB-Seite gekommen.
  const proben = [...bauen(rautenVerweis)].map(([kennung, seite]) => ({
    kennung,
    html: `${seite.titel ?? ''}\n${seite.kurz ?? ''}\n${seite.frage ?? ''}\n${seite.html ?? ''}`,
    ausnahme: seite.intern,
    nur: seite.internNur,
  }));
  const innen = pruefeSeiten(proben);
  if (!innen.sauber) {
    console.error('Interna auf Kundenseiten — nichts ausgegeben:\n');
    for (const m of innen.meldungen) {
      console.error(`  ${m.kennung}  [${m.id}] „${m.fund}"`);
      console.error(`      … ${m.umfeld} …`);
      console.error(`      → ${m.warum}`);
    }
    console.error('\nEntweder gehört die Angabe umformuliert, oder die Seite trägt');
    console.error('`intern: begruendet — Grund` im Kopf. Das Muster zu entschärfen ist');
    console.error('der falsche Ausweg.');
    process.exit(1);
  }
  if (innen.ausnahmen.length) {
    console.log('Begründete Ausnahmen von der Interna-Prüfung:');
    for (const a of innen.ausnahmen) {
      console.log(`  ${a.kennung}${a.nur ? ` (nur ${a.nur.join(', ')})` : ''} — ${a.grund}`);
    }
    console.log('');
  }

  // --- Die Adressen prüfen, nicht die Kennungen ---
  //
  // Die Prüfung oben liest den Markdown-Quelltext und löst jeden Verweis zu
  // einer logischen Kennung auf. Sie war grün, während in der
  // Mehrseitenfassung **41 Verweise** ins Leere gingen: Die Kennung stimmte,
  // die ausgegebene Adresse hatte kein `.html`. Gemeldet hat es der
  // Auftraggeber, nicht der Bau.
  //
  // > **Eine Prüfung, die das Modell liest statt die Ausgabe, prüft die
  // > eigene Absicht.** Diese hier liest die fertigen `href`-Werte.
  const adressPruefung = (seitenMap, zurueck, name) => {
    const gueltig = new Set(seitenMap.keys());
    const tot = [];
    for (const [id, seite] of seitenMap) {
      for (const m of String(seite.html ?? '').matchAll(/href="([^"]+)"/g)) {
        const h = m[1];
        if (/^(?:https?:|mailto:|tel:)/i.test(h)) continue;
        const kennung = zurueck(h, id);
        if (kennung === null || !gueltig.has(kennung)) tot.push(`${name}  ${id} → „${h}"`);
      }
    }
    return tot;
  };

  // Die Adresse zurück in eine Kennung rechnen — aus der Sicht der Seite, auf
  // der sie steht. „../artikel/X.html" bedeutet auf einer Wissensseite etwas
  // anderes als auf der Startseite, und genau dieser Unterschied war der
  // Fehler.
  const dateiZurueck = (h, von) => {
    if (!h.endsWith('.html')) return null;
    const ordner = von.includes('/') ? von.slice(0, von.lastIndexOf('/')) : '';
    const teile = [...ordner.split('/').filter(Boolean), ...h.slice(0, -5).split('/')];
    const weg = [];
    for (const t of teile) {
      if (t === '.') continue;
      if (t === '..') { if (!weg.length) return null; weg.pop(); continue; }
      weg.push(t);
    }
    return weg.join('/');
  };

  const tote = [
    ...adressPruefung(bauen(pfadVerweis), dateiZurueck, 'Datei '),
    ...adressPruefung(bauen(rautenVerweis), (h) => (h.startsWith('#') ? h.slice(1) : null), 'Raute'),
  ];
  if (tote.length) {
    console.error(`Ausgegebene Adressen, die ins Leere gehen (${tote.length}):\n`);
    for (const t of tote.slice(0, 40)) console.error(`  ${t}`);
    if (tote.length > 40) console.error(`  … und ${tote.length - 40} weitere`);
    console.error('\nNichts ausgegeben.');
    process.exit(1);
  }

  // Rechenkern und Oberfläche einmal bauen — beide Ausgabefassungen teilen sie.
  //
  // **Ohne Kommentare.** Bis zum 29. August ging der Quelltext samt seiner
  // Kommentare an jeden Besucher — 293 KB, darin die Erklärung der
  // Kalkulation („40 € Einkauf und 25 % Ziel ergeben 53,333… €"). Damit war
  // die Weisung „keine Spanne ausgeben" auf der Kundenseite unterlaufen, und
  // der offene Punkt „Repository privat schalten" wäre wirkungslos gewesen:
  // Zum Rekonstruieren der Einkaufspreise hätte die ausgelieferte Seite
  // gereicht. Siehe `docs/baustoff-shop/kommentare-im-schaufenster.md`.
  const kernRoh = baueKern(
    (name) => readFileSync(join(WURZEL, 'src', name), 'utf8'),
    BROWSERMODULE,
  );
  const kernBuendel = ohneKommentare(kernRoh).text;
  const shopOberflaeche = ohneKommentare(oberflaecheRoh).text;
  const gespart = (kernRoh.length + oberflaecheRoh.length)
    - (kernBuendel.length + shopOberflaeche.length);

  // --- Mehrseitenfassung ---
  const site = join(AUSGABE, 'site');
  rmSync(site, { recursive: true, force: true });
  mkdirSync(site, { recursive: true });
  const dateiSeiten = bauen(pfadVerweis);
  const nutzdaten = shopdaten(katalog, befund, seiten, lieferantenDatei, suchwoerterDatei, betreiber, bereitschaft);
  const shopskriptQuelle = `window.__SHOP__=${jsonFuerSkript(nutzdaten)};\n`
    + `window.__SHOP__.adressform=window.__SHOP_ADRESSFORM__||'datei';\n`
    + `window.__SHOP__.tiefe=!!window.__SHOP_TIEFE__;\n`
    + kernBuendel + '\n' + shopOberflaeche;
  // Erst parsen lassen, dann schreiben. Der Kommentarentferner ist ein
  // Scanner ohne Parser; ein Sonderfall, den er falsch liest, macht aus
  // gültigem Code Bruch. Ein Bau, der abbricht, ist harmlos — eine
  // ausgelieferte Seite ohne Skript ist es nicht.
  pruefeSkript(shopskriptQuelle, 'ausgabe/site/shop.js');
  writeFileSync(join(site, 'shop.js'), shopskriptQuelle, 'utf8');
  for (const [id, seite] of dateiSeiten) {
    const pfad = join(site, `${id}.html`);
    const tiefe = id.includes('/');
    mkdirSync(dirname(pfad), { recursive: true });
    writeFileSync(pfad, rahmen(seite, pfadVerweis(id), {
      eigenstaendig: true,
      skriptDatei: `${tiefe ? '../' : ''}shop.js`,
      tiefe,
      bereitschaft,
      id,
    }), 'utf8');
  }

  // robots.txt, llms.txt, sitemap.xml
  // **Eine robots.txt, nicht zwei.**
  //
  // Bis zum 30.08. schrieb dieser Bau drei eigene Zeilen — „User-agent: *,
  // Allow: /" —, während `npm run veroeffentlichung` dieselbe Datei aus
  // `robotsTxt({ suche: true, training: false })` erzeugte. Die zweite
  // Fassung trägt die Entscheidung aus `ki-sichtbarkeit-konzept.md`:
  // **gefunden werden ja, Trainingsmaterial nein.** Ausgeliefert wurde die
  // erste, und die erlaubt GPTBot, ClaudeBot, CCBot und Google-Extended
  // genau das, was die Entscheidung ausschließt.
  //
  // Die Fehlerklasse ist die des ganzen Vortags: zwei Wege zur selben
  // Ausgabe, und der kürzere gewinnt, weil er näher am Schreibaufruf steht.
  writeFileSync(join(site, 'robots.txt'),
    robotsTxt({ sitemap: `${BASIS}/sitemap.xml` }), 'utf8');

  // Gate 25 aus derselben Quelle wie die Seite und die Kasse.
  const mindestNetto = betreiber.mindestbestellwertNetto ?? null;

  const llms = [`# ${MARKE} — Baustoffe zum Baumeisterpreis`, '',
    `> Baustoffhandel in ${ORT}, Oberösterreich. Lieferung regional (Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land), nicht österreichweit. Preise sind Nettopreise für Unternehmer.`,
    // Was ein Besucher hier **tun** kann, stand bis zum 29.08. nirgends in
    // dieser Datei. Ein Assistent, den jemand fragt „kann ich dort
    // bestellen?", hätte darauf keine Antwort gefunden — und die
    // wahrscheinlichste Ersatzantwort eines Sprachmodells auf einer
    // Shop-artigen Seite ist „ja". Die Auskunft steht deshalb oben und nennt
    // beides: die Absage und den Weg, der offen ist.
    '', '## Was hier möglich ist', '',
    bereitschaft.startklar
      ? '- **Bestellen ist möglich.** Warenkorb füllen, Bezirk der Baustelle wählen, Zahlweg wählen.'
      // **Ein Satz, der eine Aufzählung ankündigt, muss eine haben.** Steht
      // ein offener Punkt auf der Liste, der den Kunden nichts angeht, wäre
      // hier sonst „Es fehlen: ." gestanden — eine Ankündigung ohne Inhalt,
      // die wie ein Anzeigefehler aussieht und den Grund verschweigt.
      : bereitschaft.kassenhinweise.length
        ? `- **Bestellen ist noch nicht möglich** — ${fehltSatz(bereitschaft.kassenhinweise)}.`
        : '- **Bestellen ist noch nicht möglich.** Was fehlt, betrifft den Betrieb, nicht Ihre Bestellung.',
    `- **Möglich ist eine Anfrage.** Warenkorb füllen, Bezirk der Baustelle wählen, und die Kasse (${BASIS}/kasse.html) erzeugt eine fertig gerechnete Positionsliste mit Fracht, Umsatzsteuer und Preisstand zum Kopieren. Sie ist unverbindlich und wird nicht automatisch versendet.`,
    '- **Nur im Liefergebiet.** Anfragen aus anderen Bezirken werden nicht angenommen; die Fracht trägt sie nicht.',
    // **Ergänzt am 3. September, nach Gate 25.** Diese Datei sagte „möglich ist
    // eine Anfrage" und nannte die Untergrenze nicht. Ein Assistent, den jemand
    // fragt „kann ich dort 10 m² Dämmung anfragen?", hätte ja gesagt — die
    // Kasse sagt nein, und zwar bei jedem Korb unter 250 €.
    //
    // > **Eine maschinenlesbare Datei, die mehr verspricht als die Kasse
    // > hergibt, erzeugt genau die Anfrage, die abgelehnt wird.**
    ...(mindestNetto
      ? [`- **Mindestbestellwert ${euro(mindestNetto)} € netto Warenwert je Lieferung.** Darunter `
        + 'nimmt die Kasse keine Anfrage an und nennt den fehlenden Betrag. Bei mehreren '
        + 'Herstellern entstehen mehrere Lieferungen, und die Grenze gilt für jede einzelne.']
      : []),
    `- **Fracht fällt je Lieferung an, es gibt keine Frei-Haus-Schwelle.** Die Sätze und die Begründung stehen unter ${BASIS}/lieferung.html.`,
    '', '## Wie diese Seiten aufgebaut sind', '',
    '- Jede Seite beantwortet genau eine Frage; die Antwort steht in den ersten zwei Sätzen.',
    '- Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller verlinkt.',
    '- Preise tragen einen Preisstand und die Angabe netto oder brutto.',
    `- Wie geprüft wird: ${BASIS}/wissen/redaktionsprinzipien.html`,
    '', '## Wissen', '',
    ...[...seiten.values()].filter((s) => s.art === 'wissen')
      .map((s) => `- [${s.kopf.titel}](${BASIS}/${s.id}.html): ${alsText(String(s.kopf.frage ?? ''))}`),
    '', '## Systemlisten', '',
    ...[...seiten.values()].filter((s) => s.art === 'system')
      .map((s) => `- [${s.kopf.titel}](${BASIS}/${s.id}.html): ${alsText(String(s.kopf.frage ?? ''))}`),
    '', '## Sortiment', '',
    ...[...seiten.values()].filter((s) => s.art === 'gruppen')
      .map((s) => `- [${s.kopf.titel}](${BASIS}/${s.id}.html): ${befund.jeGruppe[s.kopf.gruppe]?.gesamt ?? 0} Artikel`),
    // Bis zum 28. August endete diese Datei hier — mit Wissensseiten,
    // Systemlisten und sieben Gruppenseiten, **ohne einen einzigen Artikel**.
    // Für den Kanal, für den sie gemacht ist, war das die falsche Auslassung:
    // Wer einen Assistenten fragt, wo er in Oberösterreich XPS in 80 mm
    // bekommt, wird über den Artikel gefunden oder gar nicht.
    //
    // Genannt wird, was der Shop verkaufen kann. Artikel ohne kalkulierbaren
    // Einkaufspreis (Gate 24) stehen nicht in der Liste — und die Zeile
    // darunter sagt, wie viele das sind. Eine Auslassung, die sich selbst
    // beziffert, ist keine Lücke mehr.
    '', '## Artikel', '',
    `> Alle Preise netto je Einheit, Preisstand ${preisStand(katalog)}; je Artikel steht er auf der Artikelseite. `
      + 'Die Zustellung kostet eine Pauschale je Lieferung, bei palettierter Ware zuzüglich '
      + 'Kranentladung je Hub; sie steht auf der Seite ' + `${BASIS}/lieferung.html. `
      + 'Es gibt keine Frei-Haus-Schwelle.',
    '',
    ...katalog.artikel
      .filter((a) => a.vkNetto !== null)
      .sort((a, b) => a.gruppe.localeCompare(b.gruppe, 'de') || a.bezeichnung.localeCompare(b.bezeichnung, 'de'))
      // Der Preis je Einheit **und** die kleinste bestellbare Menge. Ohne die
      // zweite Angabe antwortet ein Assistent auf „was kostet die
      // Isover-Platte?" mit „10,69 €" — und der Kunde, der eine bestellt,
      // bekommt eine Rechnung über 92,36 €. Derselbe Fehler wie im
      // Produktfeed, im Kanal, für den diese Datei gemacht ist.
      .map((a) => {
        const schritt = mengenschritt(a);
        const eh = EINHEITEN[a.einheit] ?? a.einheit;
        return `- [${a.bezeichnung}](${BASIS}/artikel/${a.sku}.html): `
        + `${euro(a.vkNetto)} € je ${eh}, netto`
        + (schritt ? ` · Abgabe ab ${String(schritt).replace('.', ',')} ${eh}`
            + ` (${euro(a.vkNetto * schritt)} €)` : '')
        + ` · ${a.gruppe}`
        + (typeof a.gewichtKg === 'number' ? ` · ${String(a.gewichtKg).replace('.', ',')} kg je Einheit` : '')
        + (a.sperrgut ? ' · palettiert' : '');
      }),
    '',
    (() => {
      const ohne = katalog.artikel.filter((a) => a.vkNetto === null);
      return ohne.length
        ? `Nicht in dieser Liste: ${ohne.length} Artikel ohne kalkulierbaren Einkaufspreis. `
          + 'Sie sind im Shop sichtbar, aber nicht bepreist — was nicht gerechnet werden kann, wird nicht angeboten.'
        : 'Jeder geführte Artikel steht in dieser Liste.';
    })(),
    // **Was wir ausdrücklich nicht führen.**
    //
    // Dieselbe Frage erreicht den Shop über zwei Wege: Der Kunde tippt sie
    // ins Suchfeld, ein Assistent liest diese Datei. Seit heute beantwortet
    // die Suchseite 23 solcher Fragen mit einem eigenen Satz; hier stand
    // weiterhin nichts.
    //
    // Für diesen Kanal wiegt die Lücke schwerer: Wer einen Assistenten
    // fragt, ob dieser Händler Estrich führt, bekommt ohne Angabe die
    // wahrscheinlichste Ersatzantwort — und die lautet bei einem
    // Baustoffhändler „ja". Eine Auskunft, die nur an einer Stelle steht,
    // ist die Fehlerklasse dieses Tages.
    ...((suchwoerterDatei?._nichtAufgenommen ?? []).filter((w) => w.antwort).length
      ? ['', '## Was wir nicht führen', '',
          'Danach wird gefragt, und wir haben es nicht. Genannt ist jeweils, was stattdessen im Sortiment steht — als Abgrenzung, nicht als Ersatz.', '',
          ...(suchwoerterDatei?._nichtAufgenommen ?? [])
            .filter((w) => w.antwort)
            .map((w) => `- **${w.wort}**: ${String(w.antwort).trim()}`)]
      : []),
    ''].join('\n');
  writeFileSync(join(site, 'llms.txt'), llms, 'utf8');

  /**
   * **Das Empfangsskript geht nur mit, wenn der Weg eingeschaltet ist**
   * (Gate 26). Ein Skript, das ohne Empfänger im Netz steht, nähme
   * Bestellungen entgegen, die niemand liest — es antwortet zwar mit 503,
   * aber die ehrlichere Lage ist, dass es gar nicht da ist.
   *
   * Die Konfiguration steht in einer eigenen Datei: So bleibt `bestellung.php`
   * ein unveränderter Quelltext, der sich prüfen lässt, und die Adresse ist
   * dort, wo sie hingehört — in den Daten des Betreibers.
   */
  if (WEG.aktiv) {
    const betreiberDaten = JSON.parse(readFileSync(BETREIBERDATEI, 'utf8'));
    copyFileSync(join(WURZEL, EMPFANGSSKRIPT), join(site, EMPFANGSSKRIPT));
    // **Das Empfangsskript bekommt dieselbe Feldliste.** PHP kann das Register
    // nicht importieren; es aus derselben Quelle zu **erzeugen** ist der
    // nächstbeste Weg. Eine handgepflegte zweite Liste im Skript wäre genau
    // der Fehler, den dieses Register auflöst.
    writeFileSync(join(site, KONFIGURATIONSDATEI),
      `<?php\n// Erzeugt von npm run website aus data/betreiber.json und src/bestellfelder.js.\n`
      + `return [\n  'empfaenger' => ${JSON.stringify(String(betreiberDaten.email))},\n`
      + `  'felder' => [${BESTELLFELDER.map((f) => `\n    ${JSON.stringify(f.name)} => `
        + `${JSON.stringify(f.art)},`).join('')}\n  ],\n];\n`, 'utf8');
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...dateiSeiten.entries()].filter(([, seite]) => !seite.nurBedienung)
    // **Über `kanonisch`, seit dem 3. September.** Hier stand
    // `${BASIS}/${id}.html` — für die Startseite also
    // `bauversand.com/index.html`, während ihr eigenes `rel="canonical"`
    // `bauversand.com/` sagt. Zwei Adressen für dieselbe Seite, und die
    // Sitemap nannte die, die die Seite selbst nicht gelten lässt.
    //
    // > **Ein Werkzeug, das die Regel kennt und an einer Stelle nicht anwendet,
    // > hat die Regel nicht.**
    //
    // Der Dateikopf von `kanonisch` beschreibt genau diesen Schaden — er stand
    // seit dem 1. September da, und die Sitemap ging daran vorbei.
    .map(([id]) => `  <url><loc>${kanonisch(BASIS, id)}</loc></url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(site, 'sitemap.xml'), sitemap, 'utf8');

  // --- Einzeldateifassung ---
  const shopskriptRoh = `window.__SHOP__=${jsonFuerSkript(nutzdaten)};\n`
    + `window.__SHOP__.adressform=window.__SHOP_ADRESSFORM__||'datei';\n`
    + `window.__SHOP__.tiefe=!!window.__SHOP_TIEFE__;\n`
    + kernBuendel + '\n' + shopOberflaeche;
  const rautenSeiten = bauen(rautenVerweis);
  const eingebettet = [...rautenSeiten].map(([id, seite]) =>
    `<template data-seite="${esc(id)}" data-titel="${esc(seite.titel)}">${
      rahmen(seite, rautenVerweis(id), { eigenstaendig: false, bereitschaft })}</template>`,
  ).join('\n');

  // Die Zeichensatzangabe steht **zuerst**. Sie hat in der Einzeldatei
  // vollständig gefehlt: Die Mehrseitenfassung bekommt ihr `<meta charset>`
  // aus dem HTML-Gerüst, die Einzeldatei hat kein Gerüst und hatte deshalb
  // keine Angabe. Ein Browser, der nicht rät, zeigt dann „fÃ¼r" statt „für"
  // — auf jeder Seite, in jedem Preis, in jedem Bezirksnamen.
  //
  // Gefunden hat es die Shopprobe, nicht das Auge: Die Erwartungstexte der
  // Szenarien enthielten Umlaute, und drei Szenarien schlugen fehl, obwohl
  // der Inhalt stimmte. **Ein Testfall, der über Umlaute stolpert, ist kein
  // schlechter Testfall.**
  const einzeln = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Baustoffe zum Baumeisterpreis</title>
${SCHRIFTEINBINDUNG}<style>${stil()}</style>
<div class="huelle" id="inhalt"></div>
${eingebettet}
<script>window.__SHOP_ADRESSFORM__='raute';</script>
<script>${shopskriptRoh}</script>
<script>
(function () {
  var seiten = {};
  document.querySelectorAll('template[data-seite]').forEach(function (t) {
    seiten[t.dataset.seite] = { html: t.innerHTML, titel: t.dataset.titel };
  });
  var ziel = document.getElementById('inhalt');
  function zeige() {
    var roh = decodeURIComponent(location.hash.replace(/^#/, ''));
    // Die Suche hängt „?q=…" an die Raute. Für die Seitenwahl zählt nur der
    // Teil davor; den Rest liest die Suchseite selbst aus dem Hash.
    var id = roh.split('?')[0] || 'index';
    var s = seiten[id] || seiten['index'];
    ziel.innerHTML = s.html;
    document.title = s.titel + ' — ${MARKE}';
    window.scrollTo(0, 0);
    if (window.__SHOP_START__) window.__SHOP_START__();
  }
  window.addEventListener('hashchange', zeige);
  zeige();
})();
</script>
`;
  writeFileSync(join(AUSGABE, 'website.html'), einzeln, 'utf8');

  // --- Bericht ---
  const jeArt = [...rautenSeiten.keys()].reduce((m, id) => {
    const k = id.includes('/') ? id.split('/')[0] : 'stamm';
    return { ...m, [k]: (m[k] ?? 0) + 1 };
  }, {});
  console.log(`Seiten: ${rautenSeiten.size}`);
  for (const [k, n] of Object.entries(jeArt).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(10)} ${String(n).padStart(3)}`);
  }
  /**
   * **Roh und gezippt, und die zweite Zahl ist die, die zählt.**
   *
   * Am 29.08. wäre beinahe eine Optimierung auf der falschen Zahl passiert:
   * Die Zeichnungen im Nutzdatenblock sind 39 KB roh — ein Drittel von
   * `shop.js` — und sahen nach dem nächsten großen Posten aus. Gezippt sind
   * sie **2,4 KB**: Sie bestehen aus denselben Pfaden mit anderen Maßen und
   * lassen sich außergewöhnlich gut packen. Wer sie herauswirft, verliert
   * die Bilder im Warenkorb und spart nichts.
   *
   * Jeder Server liefert diese Dateien komprimiert aus. Ein Bericht, der nur
   * die Rohgröße nennt, lädt zur nächsten Fehlmessung ein.
   */
  const gezippt = (text) => (gzipSync(Buffer.from(text), { level: 9 }).length / 1024).toFixed(1);
  console.log(`\nMehrseitenfassung: ausgabe/site/ (plus robots.txt, llms.txt, sitemap.xml)`);
  console.log(`  shop.js:         ${(Buffer.byteLength(shopskriptQuelle) / 1024).toFixed(0)} KB roh, `
    + `${gezippt(shopskriptQuelle)} KB gezippt — je Besucher einmal, danach im Zwischenspeicher`);
  /**
   * Die Einzeldateifassung ist die Vorschau zum Doppelklicken: eine Datei,
   * kein Server, alle Seiten als Vorlagen eingebettet. Genau das macht sie
   * mit dem Sortiment größer — und irgendwann unbrauchbar.
   *
   * Gemessen im Lastlauf vom 28.08.: 46 Artikel → 1,5 MB, 141 → 3,3 MB.
   * Das sind rund 19 KB je Artikel; bei fünfhundert Artikeln wären es etwa
   * zehn Megabyte, und das lädt niemand mehr zur Ansicht herunter.
   *
   * **Die Grenze steht hier als Zahl, nicht als Gefühl.** Ab 6 MB meldet
   * der Bau es; die Mehrseitenfassung ist davon nicht betroffen, sie lädt
   * je Seite. Der Ausweg wäre dann, die Vorschau auf die Stammseiten und
   * eine Auswahl zu beschränken — und das ist eine Entscheidung, keine
   * Optimierung: Eine Vorschau, die nur einen Teil des Sortiments zeigt,
   * muss sagen, dass sie es tut.
   */
  const EINZELDATEI_GRENZE_MB = 6;
  const einzelnMb = Buffer.byteLength(einzeln) / 1024 / 1024;
  console.log(`Einzeldatei:       ausgabe/website.html (${(einzelnMb * 1024).toFixed(0)} KB roh, `
    + `${gezippt(einzeln)} KB gezippt, `
    + `${(einzelnMb * 1024 / Math.max(1, katalog.artikel.length)).toFixed(0)} KB je Artikel)`);
  if (einzelnMb > EINZELDATEI_GRENZE_MB) {
    console.log(`\nHinweis: Die Einzeldatei überschreitet ${EINZELDATEI_GRENZE_MB} MB.`);
    console.log('Als Vorschau zum Doppelklicken ist sie damit am Ende ihrer Nutzbarkeit.');
    console.log('Die Mehrseitenfassung in ausgabe/site/ ist davon nicht betroffen.');
    console.log('Siehe docs/baustoff-shop/lastlauf-hundert-artikel.md.');
  }
  for (const zeile of WEG.saetze) console.log(zeile);
  console.log(`\nAlle Verweise geprüft: ${kennungen.size} Kennungen, kein toter Link.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { loeseVerweis, loeseVerwandt, lesInhalte, marke, HERSTELLER, sprungziel };
