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

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { ladeBaustoffkatalog, katalogbefund, ZIELMARGE } from '../src/baustoffkatalog.js';
import { pruefeSeiten } from '../src/interna.js';
import { artikelBild, gruppenBild } from '../src/bilder.js';
import { baueKern, KERNMODULE, SHOPMODULE } from '../src/buendel.js';
import { oeffentlicherArtikel, oeffentlicherLieferant } from '../src/shopkern.js';
import { LIEFERGEBIET } from '../src/liefergebiet.js';
import { ZAHLWEGE } from '../src/zahlung.js';
import { lesKopf, alsHtml, alsText, alsListe, esc } from '../src/markdown.js';
import {
  erzeugeImpressum, pruefeBetreiberdaten, AGB_GLIEDERUNG, ZAHLUNGSBEDINGUNGEN,
  DATENSCHUTZ_GLIEDERUNG, B2B_ABGRENZUNG, LIEFERHINWEISE,
} from '../src/rechtstexte.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');
const AUSGABE = join(WURZEL, 'ausgabe');

const FIRMA = 'Freudenthaler Bau GmbH';
const ORT = 'Ried in der Riedmark';
const BASIS = 'https://shop.freudenthaler-bau.at';

const EINHEITEN = {
  STK: 'Stück', M2: 'm²', KG: 'kg', SCK: 'Sack', KRT: 'Karton',
  LFM: 'lfm', DOS: 'Dose', EIM: 'Eimer', RLL: 'Rolle',
};

/**
 * Wo das technische Merkblatt zu finden ist.
 *
 * Bewusst nur die Herstellerseite, kein tiefer Link auf ein konkretes PDF:
 * Ein erfundener Dokumentpfad sieht aus wie ein Beleg und ist keiner, und
 * echte Merkblattlinks ändern sich mit jeder Überarbeitung. Der Weg über die
 * Herstellersuche ist einen Klick länger und bleibt richtig.
 */
const HERSTELLER = {
  Capatect: { name: 'Synthesa (Capatect)', url: 'https://www.synthesa.at/' },
  Baumit: { name: 'Baumit Österreich', url: 'https://www.baumit.at/' },
  Schiedel: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIKM: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIK: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  Isover: { name: 'Isover Österreich', url: 'https://www.isover.at/' },
  Soudal: { name: 'Soudal', url: 'https://www.soudal.com/' },
  // Produktlinien statt Firmennamen. Beleg dafür, dass „Absolut" und „SIH"
  // Schiedel-Linien sind: das Konditionenblatt des Lagerhauses führt sie
  // unter „Schiedel Absolut, SIH" (`lagerhaus-rabatte-gelesen.md`, Seite 18).
  Absolut: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIH: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
};

/**
 * Die Marke aus der Artikelbezeichnung.
 *
 * Der erste Wurf prüfte `bez.startsWith(m)` — die Marke musste ganz vorn
 * stehen. Bei Lieferantenbezeichnungen steht sie das oft nicht:
 * „Mantelstein MSTS EZ 16-18 **SIKM**", „Regenhaube mit Sicherungsseil 180
 * **Absolut & SIH**", „Thermo-Trennstein 12-18 EZ **Absolut**". Drei
 * Schiedel-Artikel trugen deshalb den Satz „Für diesen Artikel liegt uns
 * kein Herstellermerkblatt vor", obwohl der Hersteller in der Bezeichnung
 * steht.
 *
 * Gesucht wird jetzt überall im Text, aber nur als **ganzes Wort** — sonst
 * fände „SIK" das Wort „Sikkativ" und „Absolut" das Adverb. Die längste
 * Marke gewinnt, damit „SIKM" nicht von „SIK" verdeckt wird.
 */
const marke = (bez) => Object.keys(HERSTELLER)
  .sort((a, b) => b.length - a.length)
  .find((m) => new RegExp(`(?<![\\p{L}\\d])${m}(?![\\p{L}\\d])`, 'u').test(bez)) ?? null;

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
  return `
:root{--grund:#F2F0EC;--flaeche:#FBFAF8;--flaeche-2:#E6E2DA;--tinte:#1B1A17;--tinte-2:#45423B;
--gedaempft:#78736A;--linie:#D6D1C6;--linie-stark:#B4AEA0;--ocker:#A8621B;--ocker-weich:#F6E6D2;
--gruen:#3E6B45;--gruen-weich:#DEEADF;--ziegel:#9C3521;--ziegel-weich:#F4DCD5;
--schmal:"Barlow Condensed","Arial Narrow",sans-serif;--text:"Source Sans 3",system-ui,-apple-system,sans-serif;
--zahl:"JetBrains Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--grund:#171614;--flaeche:#201E1B;
--flaeche-2:#2B2823;--tinte:#EDEAE3;--tinte-2:#C6C1B7;--gedaempft:#8E887C;--linie:#33302B;
--linie-stark:#4A463F;--ocker:#E0964A;--ocker-weich:#362514;--gruen:#8CBE95;--gruen-weich:#1D2A1F;
--ziegel:#E08A72;--ziegel-weich:#341913}}
:root[data-theme="dark"]{--grund:#171614;--flaeche:#201E1B;--flaeche-2:#2B2823;--tinte:#EDEAE3;
--tinte-2:#C6C1B7;--gedaempft:#8E887C;--linie:#33302B;--linie-stark:#4A463F;--ocker:#E0964A;
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
.artikelbild{background:var(--grund);border:1px solid var(--linie);padding:1.4rem;margin:0 0 1.5rem;display:flex;justify-content:center}
.artikelbild svg.schema{max-height:12rem;max-width:22rem}
.mehr{font-family:var(--schmal);text-transform:uppercase;letter-spacing:.06em;font-size:.82rem}

/* --- Kopfleiste mit Suche und Warenkorb --- */
.kopfleiste{flex-wrap:wrap;gap:.6rem 1rem}
.suche{position:relative;flex:1 1 18rem;min-width:12rem}
#suchfeld{width:100%;font:inherit;font-size:.95rem;padding:.5rem .7rem;border:1px solid var(--linie-stark);background:var(--flaeche);color:var(--tinte);border-radius:0}
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

.karte{background:var(--flaeche);padding:.9rem 1rem;display:flex;flex-direction:column;gap:.4rem;text-decoration:none;color:inherit}
.karte:hover{background:var(--flaeche-2)}
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
const NAV = [
  ['gruppe/wdvs', 'WDVS'],
  ['gruppe/daemmung', 'Dämmung'],
  ['gruppe/mauerwerk', 'Mauerwerk'],
  ['gruppe/moertel', 'Mörtel'],
  ['gruppe/kamin', 'Kamin'],
  ['gruppe/kanal', 'Kanal'],
  ['gruppe/zubehoer', 'Zubehör'],
  ['lieferung', 'Lieferung'],
];

/* ------------------------------------------------------------------ *
 * Seiten bauen
 * ------------------------------------------------------------------ */

const euro = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function artikelKarte(a, befund, verweis) {
  const beipack = befund.nurBeipackSkus.includes(a.sku);
  const abstand = a.uvpNetto && !a.amListendeckel ? Math.round((1 - a.vkNetto / a.uvpNetto) * 100) : null;
  const marker = [];
  if (abstand !== null && abstand >= 5) marker.push(`<span class="marker vorteil">${abstand} % unter Liste</span>`);
  if (beipack) marker.push('<span class="marker beipack">Beipack</span>');
  return `<a class="karte" href="${verweis(`artikel/${a.sku}`)}">
  <span class="bild">${artikelBild(a)}</span>
  <span class="nr">${esc(a.lieferantenArtikelnummer)}</span>
  <span class="t">${esc(a.bezeichnung)}</span>
  ${marker.join('')}
  <span class="preis">${euro(a.vkNetto)}&nbsp;€ <span class="eh">je ${esc(EINHEITEN[a.einheit] ?? a.einheit)}, netto</span></span>
</a>`;
}

function artikelSeite(a, katalog, befund, seiten, verweis) {
  const m = marke(a.bezeichnung);
  const h = m ? HERSTELLER[m] : null;
  const abstand = a.uvpNetto && !a.amListendeckel ? Math.round((1 - a.vkNetto / a.uvpNetto) * 100) : null;
  const beipack = befund.nurBeipackSkus.includes(a.sku);
  const gruppenSeite = [...seiten.values()].find((s) => s.art === 'gruppen' && s.kopf.gruppe === a.gruppe);
  const systemSeiten = [...seiten.values()].filter(
    (s) => s.art === 'system' && alsListe(s.kopf.skus).includes(a.sku),
  );
  const geschwister = katalog.artikel.filter((x) => x.gruppe === a.gruppe && x.sku !== a.sku).slice(0, 8);

  const teile = [];
  teile.push(`<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis(gruppenSeite ? gruppenSeite.id : 'index')}">${esc(a.gruppe)}</a></p>`);
  teile.push(`<h1>${esc(a.bezeichnung)}</h1>`);
  // Die Zeichnung steht vor den Zahlen: Wer auf einer Artikelseite landet,
  // will zuerst wissen, ob er beim richtigen Bauteil ist.
  teile.push(`<div class="artikelbild">${artikelBild(a)}</div>`);

  const marker = [];
  if (abstand !== null && abstand >= 5) marker.push(`<span class="marker vorteil">${abstand} % unter Listenpreis</span>`);
  if (beipack) marker.push('<span class="marker beipack">Beipack — kein Preisvorteil</span>');
  if (a.sperrgut) marker.push('<span class="marker sperrig">palettiert, Kranentladung</span>');
  if (marker.length) teile.push(`<p class="verwandt">${marker.join('')}</p>`);

  teile.push(`<div class="preistafel">
  <div><span class="k">Netto</span><span class="w">${euro(a.vkNetto)} €</span><span class="e">je ${esc(EINHEITEN[a.einheit] ?? a.einheit)}, für Unternehmer</span></div>
  <div><span class="k">Brutto</span><span class="w">${euro(a.vkBrutto)} €</span><span class="e">inkl. 20 % USt</span></div>
  <div><span class="k">Artikelnummer</span><span class="w">${esc(a.lieferantenArtikelnummer)}</span><span class="e">Lieferantennummer</span></div>
  <div><span class="k">Preisstand</span><span class="w">${esc(a.preisStand)}</span><span class="e">gültig bis zur nächsten Liste</span></div>
  <div><span class="k">Gewicht</span><span class="w">${typeof a.gewichtKg === 'number'
    ? `${String(a.gewichtKg).replace('.', ',')} kg`
    : '—'}</span><span class="e">${typeof a.gewichtKg === 'number'
    ? `je ${esc(EINHEITEN[a.einheit] ?? a.einheit)}, aus dem Lieferschein`
    : 'liegt uns nicht belegt vor'}</span></div>
</div>`);

  if (a.vkNetto !== null) {
    teile.push(`<div class="legen">
  <label><span class="f-b">Menge in ${esc(EINHEITEN[a.einheit] ?? a.einheit)}</span>
    <input id="menge-${esc(a.sku)}" type="number" min="1" max="999" value="1" inputmode="numeric"></label>
  <button class="knopf" type="button" data-legen="${esc(a.sku)}" data-menge="menge-${esc(a.sku)}">In den Warenkorb</button>
</div>`);
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

  if (systemSeiten.length) {
    teile.push('<h2>Gehört zu diesen Systemen</h2>');
    teile.push(`<div class="kacheln">${systemSeiten.map((s) => `<a class="kachel" href="${verweis(s.id)}">
      <span class="k">Systemliste</span><span class="t">${esc(s.kopf.titel)}</span>
      <span class="b">${esc(alsText(String(s.kopf.kurz ?? '')).slice(0, 150))}</span></a>`).join('')}</div>`);
  }

  if (geschwister.length) {
    teile.push(`<h2>Weitere Artikel aus ${esc(a.gruppe)}</h2>`);
    teile.push(`<div class="raster">${geschwister.map((g) => artikelKarte(g, befund, verweis)).join('')}</div>`);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: a.bezeichnung,
    sku: a.sku,
    category: a.gruppe,
    ...(h ? { brand: { '@type': 'Brand', name: m } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: a.vkNetto.toFixed(2),
      // Kein priceValidUntil: Wir wissen nicht, bis wann der Preis gilt — das
      // hängt an der nächsten Liste des Lieferanten. Ein erfundenes Datum
      // wäre eine Zusage, und `null` weisen die Prüfwerkzeuge zurecht ab.
      valueAddedTaxIncluded: false,
      availability: 'https://schema.org/PreOrder',
      areaServed: 'Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land',
      seller: { '@type': 'Organization', name: FIRMA },
    },
  };

  return {
    titel: `${a.bezeichnung} — ${euro(a.vkNetto)} € netto`,
    kurz: `${a.bezeichnung}, ${euro(a.vkNetto)} € netto je ${EINHEITEN[a.einheit] ?? a.einheit}${abstand !== null ? `, ${abstand} % unter dem Listenpreis des Lieferanten` : ''}. Preisstand ${a.preisStand}.`,
    html: teile.join('\n'),
    jsonLd,
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

  if (seite.art === 'gruppen' && warenraster) {
    // Auf einer Sortimentsseite kommt die Ware zuerst. Der Fachtext stand
    // vorher davor — wer eine Warengruppe anklickt, sucht aber Artikel und
    // nicht einen Aufsatz. Eingesetzt wird nach dem einleitenden Absatz,
    // damit die Seite trotzdem sagt, worum es geht.
    const schnitt = koerper.indexOf('</p>');
    if (schnitt === -1) {
      teile.push(warenraster, koerper);
    } else {
      teile.push(koerper.slice(0, schnitt + 4), warenraster, koerper.slice(schnitt + 4));
    }
  } else {
    teile.push(koerper);
    if (warenraster) teile.push(warenraster);
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': seite.art === 'system' ? 'HowTo' : 'Article',
    headline: seite.kopf.titel,
    description: alsText(kurz),
    inLanguage: 'de-AT',
    dateModified: seite.kopf.stand,
    publisher: { '@type': 'Organization', name: FIRMA },
    ...(seite.kopf.frage
      ? {
          mainEntity: {
            '@type': 'Question',
            name: seite.kopf.frage,
            acceptedAnswer: { '@type': 'Answer', text: alsText(kurz) },
          },
        }
      : {}),
  };

  return { titel: seite.kopf.titel, kurz: alsText(kurz), html: teile.join('\n'), jsonLd, intern: seite.kopf.intern };
}

/**
 * Der jüngste Preisstand im Katalog.
 *
 * Die Startseite nennt die Handelsspanne — eine Zahl, und jede Zahl braucht
 * nach den eigenen Regeln Herkunft und Stand. Die Herkunft ist der Satz
 * selbst („was ein Baumeister im Einkauf zahlt"), der Stand kommt von hier.
 * Gefunden hat die fehlende Angabe der Inhaltsprüfer, als er zum ersten Mal
 * über die gebauten Seiten lief.
 */
function preisStand(katalog) {
  const staende = katalog.artikel.map((a) => a.preisStand).filter(Boolean).sort();
  return staende.length ? staende[staende.length - 1] : 'siehe Artikelseiten';
}

function startSeite(katalog, befund, seiten, verweis, katalogDatei) {
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
    // Die Startseite nennt die Handelsspanne im ersten Satz — das ist das
    // Verkaufsargument, nicht ein Ausrutscher. Die Ausnahme ist deshalb
    // eingegrenzt: Gate-Nummern, Lieferantennamen, Betriebsrechnung und
    // Programmkennungen bleiben auch hier gemeldet.
    intern: 'begruendet — die Handelsspanne ist die Kernaussage der Startseite; '
      + 'die Kachel der Wissensseite „Baumeisterpreis" trägt sie mit. Ob sie öffentlich '
      + 'genannt bleibt, ist eine offene Entscheidung des Auftraggebers.',
    internNur: ['eigene-marge', 'lieferantenkondition'],
    kurz: `Baustoffe zum Baumeisterpreis, geliefert im Umkreis von ${ORT}. ${befund.artikelGesamt} Artikel, ${befund.unterListe} davon unter dem Listenpreis des Lieferanten.`,
    html: `<h1>Baustoffe zum<br>Baumeisterpreis</h1>
<p class="lede">Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — zuzüglich einer Handelsspanne von
${Math.round(katalog.zielmarge * 100)} %. Alle Preise Stand: ${esc(preisStand(katalog))}.
Geliefert wird im Umkreis, nicht in ganz Österreich: Das ist der Grund, warum die Rechnung aufgeht.</p>

<div class="preistafel">
  <div><span class="k">Artikel</span><span class="w">${befund.artikelGesamt}</span><span class="e">aus dem laufenden Einkauf</span></div>
  <div><span class="k">unter Liste</span><span class="w">${befund.unterListe}</span><span class="e">von ${befund.mitPreis} mit Preisvergleich</span></div>
  <div><span class="k">im Median</span><span class="w">${befund.medianAbstandZurListe} %</span><span class="e">unter dem Listenpreis</span></div>
  <div><span class="k">Handelsspanne</span><span class="w">${Math.round(katalog.zielmarge * 100)} %</span><span class="e">offen ausgewiesen</span></div>
</div>

<div class="antwort"><strong>Dies ist eine Vorschau, kein laufender Shop.</strong> Es kann nichts bestellt
werden: Zahlungsanbieter, Impressum und Rechtstexte fehlen noch, und jeder Preis ist vor der
Veröffentlichung beim Lieferanten zu bestätigen. Alle Preise sind Nettopreise für Unternehmer.</div>

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
      '@type': 'Organization',
      name: FIRMA,
      address: { '@type': 'PostalAddress', addressLocality: ORT, addressCountry: 'AT' },
      areaServed: 'Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land',
      url: BASIS,
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
B2B-Baustoffhandel ungewöhnlich, und der Grund steht dabei: Dieser Shop verkauft zum
Baumeister-Einkaufspreis plus Handelsspanne. Ein Zahlungsziel müsste in diese Spanne
eingerechnet werden und läge damit auf jedem Preis — auch auf dem des Kunden, der sofort
zahlt. <strong>Wer nicht auf Ziel kauft, zahlt hier nicht für den, der es tut.</strong></p>
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

/**
 * Die Kennung eines Zahlwegs ist eine Programmkennung, kein Kundenwort.
 *
 * `eps`, `karte-stripe`, `offene-rechnung` standen wörtlich in der
 * AGB-Tabelle. Sie verraten für sich genommen wenig — aber sie sind der
 * sichtbare Teil derselben Nachlässigkeit, die daneben die Rohmarge
 * ausgestellt hat: Die Seite hat ausgegeben, was im Datensatz stand,
 * statt das, was der Leser braucht.
 */
function zahlwegName(id) {
  const z = ZAHLWEGE.find((w) => w.id === id);
  if (!z) throw new Error(`Zahlweg ohne Entsprechung in zahlung.js: ${id}`);
  return z.name;
}

function datenschutzSeite(verweis) {
  return {
    titel: 'Datenschutz — Gliederung',
    kurz: 'Neun Punkte nach DSGVO. Der schwierigste ist der Ansprechpartner vor Ort: ein Dritter, den der Shop nie erreicht und über den er trotzdem informieren müsste.',
    html: `<p class="krume"><a href="${verweis('index')}">Start</a> › <a href="${verweis('rechtliches/index')}">Rechtliches</a> › Datenschutz</p>
<h1>Datenschutz</h1>
<div class="antwort"><strong>Gliederung, kein fertiger Text.</strong> Der Wortlaut kommt vom
Rechtstexteanbieter. Was hier steht, ist die Liste der Punkte, die er abdecken muss — und einer
davon ist im Baustoffhandel unangenehmer als in den meisten Branchen.</div>
<ol>${DATENSCHUTZ_GLIEDERUNG.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
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

function lieferungSeite(katalog, katalogDatei, verweis) {
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
  <div><span class="k">Liefergebiet</span><span class="w">~40 km</span><span class="e">Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land</span></div>
</div>

<h2>Warum es kein „frei Haus" gibt</h2>
<p>Weil die Frachtpauschale bei unserem Lieferanten auf jedem Beleg steht — auch auf den großen. Wer sie
trotzdem als „frei Haus" bewirbt, hat sie in die Warenpreise eingerechnet, und zwar in alle. Auch in die
des Kunden, der selbst abholt.</p>
<p>Die ausführliche Begründung samt Rechnung steht unter
<a href="${verweis('wissen/warum-keine-gratislieferung')}">Warum es keine Gratislieferung gibt</a>.</p>

<h2>Ab wann sich eine Lieferung lohnt</h2>
<p>Unter etwa 400 € netto Warenwert trägt eine gelieferte Bestellung ihre eigenen Nebenkosten nicht —
für keine der beiden Seiten. Darunter ist Selbstabholung der bessere Weg, oder das Zusammenlegen mit der
nächsten Bestellung. Stand: 2026-08-25.</p>

<h2>Selbstabholung</h2>
<p>Ausdrücklich vorgesehen und nicht schlechter gestellt. Wer selbst abholt, zahlt keine Fracht — das ist
der ganze Vorteil der getrennten Ausweisung.</p>`,
    jsonLd: null,
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
function shopdaten(katalog, befund, seiten, lieferantenDatei) {
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
    einheiten: EINHEITEN,
    bezirke: LIEFERGEBIET.bezirke.map((b) => b.name),
    zahlwege: ZAHLUNGSBEDINGUNGEN.angeboten.map((z) => ({
      id: z.id,
      name: (ZAHLWEGE.find((w) => w.id === z.id) ?? {}).name ?? z.id,
      kunde: z.kunde,
    })),
  };
}

function rahmen(seite, verweis, { eigenstaendig, skriptDatei, tiefe = false, daten = null }) {
  const nav = NAV.map(([id, t]) => `<a href="${verweis(id)}">${esc(t)}</a>`).join('');
  const kopf = `<header class="kopfleiste">
  <a class="logo" href="${verweis('index')}">${esc(FIRMA)}</a>
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
  <p>${esc(FIRMA)}, ${esc(ORT)} · Alle Preise netto in Euro für Unternehmer, Umsatzsteuer 20 % getrennt
  ausgewiesen · <a href="${verweis('wissen/redaktionsprinzipien')}">Wie wir unsere Angaben prüfen</a>
  · <a href="${verweis('wissen/index')}">Wissen</a>
  · <a href="${verweis('rechtliches/index')}">Rechtliches</a>
  · <a href="${verweis('rechtliches/impressum')}">Impressum</a>
  · <a href="${verweis('rechtliches/datenschutz')}">Datenschutz</a></p>
  <p>Vorschau ohne Bestellmöglichkeit. Nichts ist gegründet, verkauft oder eingenommen.
  Keine Steuer- oder Rechtsberatung.</p>
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
    ? `\n<script type="application/ld+json">${JSON.stringify(seite.jsonLd, null, 0)}</script>`
    : '';
  return `<!doctype html>
<html lang="de-AT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seite.titel)} — ${esc(FIRMA)}</title>
<meta name="description" content="${esc(seite.kurz.slice(0, 300))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap">
<style>${stil()}</style>${ld}
</head>
<body><div class="huelle">
${koerper}
</div>
${shopskript}
</body>
</html>
`;
}

function main() {
  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const katalogDatei = lies(join(WURZEL, 'data', 'katalog-baustoff.json'));
  const lieferantenDatei = lies(join(WURZEL, 'data', 'lieferanten.json'));
  const betreiber = lies(join(WURZEL, 'data', 'betreiber.json'));
  const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');

  if (!existsSync(preisPfad)) {
    console.error('Die Preisdatei fehlt: preise/baustoff-preise.json — ohne sie keine Website.');
    process.exit(2);
  }

  let katalog = ladeBaustoffkatalog(katalogDatei, lies(preisPfad), lieferantenDatei, ZIELMARGE);
  const befund = katalogbefund(katalog);

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

  // --- alle Seiten aufbauen ---
  const alle = new Map();
  const pfadVerweis = (von) => (ziel) => {
    const tiefe = von.includes('/') ? '../' : '';
    return ziel === 'index' ? `${tiefe}index.html` : `${tiefe}${ziel}.html`;
  };
  const rautenVerweis = () => (ziel) => `#${ziel}`;

  const bauen = (verweisFabrik) => {
    const m = new Map();
    m.set('index', startSeite(katalog, befund, seiten, verweisFabrik('index'), katalogDatei));
    m.set('wissen/index', wissenIndex(seiten, verweisFabrik('wissen/index')));
    m.set('lieferung', lieferungSeite(katalog, katalogDatei, verweisFabrik('lieferung')));
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
  const kernBuendel = baueKern(
    (name) => readFileSync(join(WURZEL, 'src', name), 'utf8'),
    [...KERNMODULE, ...SHOPMODULE],
  );
  const shopOberflaeche = readFileSync(join(WURZEL, 'shop-ui.js'), 'utf8');

  // --- Mehrseitenfassung ---
  const site = join(AUSGABE, 'site');
  rmSync(site, { recursive: true, force: true });
  mkdirSync(site, { recursive: true });
  const dateiSeiten = bauen(pfadVerweis);
  const nutzdaten = shopdaten(katalog, befund, seiten, lieferantenDatei);
  const shopskriptQuelle = `window.__SHOP__=${JSON.stringify(nutzdaten)};\n`
    + `window.__SHOP__.adressform=window.__SHOP_ADRESSFORM__||'datei';\n`
    + `window.__SHOP__.tiefe=!!window.__SHOP_TIEFE__;\n`
    + kernBuendel + '\n' + shopOberflaeche;
  writeFileSync(join(site, 'shop.js'), shopskriptQuelle, 'utf8');
  for (const [id, seite] of dateiSeiten) {
    const pfad = join(site, `${id}.html`);
    const tiefe = id.includes('/');
    mkdirSync(dirname(pfad), { recursive: true });
    writeFileSync(pfad, rahmen(seite, pfadVerweis(id), {
      eigenstaendig: true,
      skriptDatei: `${tiefe ? '../' : ''}shop.js`,
      tiefe,
    }), 'utf8');
  }

  // robots.txt, llms.txt, sitemap.xml
  writeFileSync(join(site, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${BASIS}/sitemap.xml
`, 'utf8');

  const llms = [`# ${FIRMA} — Baustoffe zum Baumeisterpreis`, '',
    `> Baustoffhandel in ${ORT}, Oberösterreich. Lieferung regional (Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land), nicht österreichweit. Preise sind Nettopreise für Unternehmer.`,
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
    ''].join('\n');
  writeFileSync(join(site, 'llms.txt'), llms, 'utf8');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...dateiSeiten.keys()].map((id) => `  <url><loc>${BASIS}/${id}.html</loc></url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(site, 'sitemap.xml'), sitemap, 'utf8');

  // --- Einzeldateifassung ---
  const shopskriptRoh = `window.__SHOP__=${JSON.stringify(nutzdaten)};\n`
    + `window.__SHOP__.adressform=window.__SHOP_ADRESSFORM__||'datei';\n`
    + `window.__SHOP__.tiefe=!!window.__SHOP_TIEFE__;\n`
    + kernBuendel + '\n' + shopOberflaeche;
  const rautenSeiten = bauen(rautenVerweis);
  const eingebettet = [...rautenSeiten].map(([id, seite]) =>
    `<template data-seite="${esc(id)}" data-titel="${esc(seite.titel)}">${rahmen(seite, rautenVerweis(id), { eigenstaendig: false })}</template>`,
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap">
<style>${stil()}</style>
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
    document.title = s.titel + ' — ${FIRMA}';
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
  console.log(`\nMehrseitenfassung: ausgabe/site/ (plus robots.txt, llms.txt, sitemap.xml)`);
  console.log(`Einzeldatei:       ausgabe/website.html (${(Buffer.byteLength(einzeln) / 1024).toFixed(0)} KB)`);
  console.log(`\nAlle Verweise geprüft: ${kennungen.size} Kennungen, kein toter Link.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { loeseVerweis, loeseVerwandt, lesInhalte, marke, HERSTELLER };
