#!/usr/bin/env node
/**
 * Erzeugt die Shop-Seite aus dem echten Katalog.
 *
 * Eine einzelne, in sich geschlossene HTML-Datei — kein Fremdpaket, kein
 * Nachladen. Sie zeigt, was der Shop heute wirklich anbieten kann: 46 Artikel
 * aus den Lieferantenrechnungen, gerechnet auf 25 % Marge, gruppiert nach
 * Warengruppe.
 *
 * Was die Seite bewusst NICHT tut:
 *   - Sie nimmt keine Bestellung entgegen. Die Strecke endet vor der Zahlung,
 *     solange Zahlungsanbieter und Rechtstexte fehlen.
 *   - Sie zeigt keinen Einkaufspreis. Nur Verkaufspreise und den Abstand zur
 *     Liste des Lieferanten in Prozent.
 *   - Sie erfindet keinen Preis. Ohne Preisdatei bricht sie ab, statt eine
 *     Seite mit Platzhaltern auszugeben, die echt aussieht.
 *
 * Aufruf:  node bin/shopseite.mjs [--ziel pfad.html]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { ladeBaustoffkatalog, katalogbefund, ZIELMARGE } from '../src/baustoffkatalog.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');

const EINHEITEN = {
  STK: 'Stück', M2: 'm²', KG: 'kg', SCK: 'Sack', KRT: 'Karton',
  LFM: 'lfm', DOS: 'Dose', EIM: 'Eimer', RLL: 'Rolle',
};

const GRUPPENTEXT = {
  WDVS: 'Kleber, Gewebe, Dübel, Putzgrund und Oberputz — was ein Fassadensystem ausmacht.',
  'Dämmung': 'XPS und EPS in den gängigen Stärken, palettenweise auf die Baustelle.',
  Kamin: 'Schiedel-Systemteile vom Fertigfuß bis zur Regenhaube.',
  Kanal: 'PVC-Kanal DN 100 mit Formteilen, Schacht und Grundmauerschutz.',
  'Mörtel': 'Mauer-, Thermo- und Vergussmörtel.',
  Mauerwerk: 'Planziegel palettenweise.',
  'Zubehör': 'Schäume, Bänder, Kleinteile. Kein Suchsortiment — Beipack zur Lieferung.',
};

const REIHENFOLGE = ['WDVS', 'Dämmung', 'Kamin', 'Kanal', 'Mörtel', 'Mauerwerk', 'Zubehör'];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const euro = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function stil() {
  return `
  :root {
    --grund: #F2F0EC;
    --flaeche: #FBFAF8;
    --flaeche-2: #E6E2DA;
    --tinte: #1B1A17;
    --tinte-2: #45423B;
    --gedaempft: #78736A;
    --linie: #D6D1C6;
    --linie-stark: #B4AEA0;
    --ocker: #A8621B;
    --ocker-weich: #F6E6D2;
    --gruen: #3E6B45;
    --gruen-weich: #DEEADF;
    --ziegel: #9C3521;
    --ziegel-weich: #F4DCD5;
    --schmal: "Barlow Condensed", "Arial Narrow", sans-serif;
    --text: "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif;
    --zahl: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --grund: #171614;
      --flaeche: #201E1B;
      --flaeche-2: #2B2823;
      --tinte: #EDEAE3;
      --tinte-2: #C6C1B7;
      --gedaempft: #8E887C;
      --linie: #33302B;
      --linie-stark: #4A463F;
      --ocker: #E0964A;
      --ocker-weich: #362514;
      --gruen: #8CBE95;
      --gruen-weich: #1D2A1F;
      --ziegel: #E08A72;
      --ziegel-weich: #341913;
    }
  }
  :root[data-theme="dark"] {
    --grund: #171614;
    --flaeche: #201E1B;
    --flaeche-2: #2B2823;
    --tinte: #EDEAE3;
    --tinte-2: #C6C1B7;
    --gedaempft: #8E887C;
    --linie: #33302B;
    --linie-stark: #4A463F;
    --ocker: #E0964A;
    --ocker-weich: #362514;
    --gruen: #8CBE95;
    --gruen-weich: #1D2A1F;
    --ziegel: #E08A72;
    --ziegel-weich: #341913;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--grund);
    color: var(--tinte);
    font-family: var(--text);
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .huelle { max-width: 68rem; margin: 0 auto; padding: 2rem 1.25rem 5rem; }

  h1, h2, h3 { font-family: var(--schmal); font-weight: 600; margin: 0; text-wrap: balance; letter-spacing: 0.01em; }
  h1 { font-size: clamp(2.4rem, 6vw, 3.8rem); line-height: 1.02; text-transform: uppercase; }
  h2 { font-size: clamp(1.5rem, 3vw, 2rem); text-transform: uppercase; }
  h3 { font-size: 1.02rem; font-family: var(--text); font-weight: 600; line-height: 1.3; }
  p { margin: 0; }

  header { border-bottom: 3px solid var(--tinte); padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .marke { font-family: var(--zahl); font-size: 0.74rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ocker); font-weight: 600; }
  .lede { max-width: 44rem; color: var(--tinte-2); font-size: 1.06rem; margin-top: 0.9rem; }

  .kennzahlen { display: flex; flex-wrap: wrap; gap: 0 2.5rem; margin-top: 1.5rem; }
  .kennzahl { display: flex; flex-direction: column; }
  .kennzahl .z { font-family: var(--schmal); font-size: 2rem; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
  .kennzahl .b { font-size: 0.78rem; color: var(--gedaempft); text-transform: uppercase; letter-spacing: 0.07em; }

  .hinweis {
    border-left: 4px solid var(--ocker);
    background: var(--ocker-weich);
    padding: 0.9rem 1.1rem;
    margin: 1.75rem 0;
    font-size: 0.93rem;
    color: var(--tinte-2);
  }
  .hinweis strong { color: var(--tinte); }

  nav.gruppen { position: sticky; top: 0; z-index: 5; background: var(--grund); border-bottom: 1px solid var(--linie); padding: 0.7rem 0; margin-bottom: 2rem; display: flex; gap: 0.4rem; overflow-x: auto; }
  nav.gruppen a {
    font-family: var(--schmal); font-size: 1rem; text-transform: uppercase; letter-spacing: 0.03em;
    color: var(--tinte-2); text-decoration: none; white-space: nowrap;
    padding: 0.25rem 0.7rem; border: 1px solid var(--linie); border-radius: 2px;
  }
  nav.gruppen a:hover, nav.gruppen a:focus-visible { background: var(--flaeche-2); color: var(--tinte); border-color: var(--linie-stark); }

  section.gruppe { margin-bottom: 3rem; scroll-margin-top: 4rem; }
  .gruppenkopf { display: flex; align-items: baseline; gap: 0.9rem; border-bottom: 2px solid var(--linie-stark); padding-bottom: 0.4rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
  .gruppenkopf .anzahl { font-family: var(--zahl); font-size: 0.8rem; color: var(--gedaempft); font-variant-numeric: tabular-nums; }
  .gruppentext { color: var(--gedaempft); font-size: 0.93rem; margin-bottom: 1.1rem; }

  .raster { display: grid; grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr)); gap: 1px; background: var(--linie); border: 1px solid var(--linie); }
  .karte { background: var(--flaeche); padding: 1rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: 0.55rem; }
  .karte .nr { font-family: var(--zahl); font-size: 0.7rem; color: var(--gedaempft); letter-spacing: 0.04em; }
  .karte .preis { margin-top: auto; display: flex; align-items: baseline; gap: 0.45rem; font-variant-numeric: tabular-nums; }
  .karte .netto { font-family: var(--schmal); font-size: 1.85rem; font-weight: 600; line-height: 1; }
  .karte .eh { font-size: 0.82rem; color: var(--gedaempft); }
  .karte .brutto { font-family: var(--zahl); font-size: 0.76rem; color: var(--gedaempft); }

  .marker { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.14rem 0.45rem; border-radius: 2px; width: fit-content; }
  .marker.vorteil { background: var(--gruen-weich); color: var(--gruen); }
  .marker.beipack { background: var(--ziegel-weich); color: var(--ziegel); }
  .marker.sperrig { background: var(--flaeche-2); color: var(--tinte-2); }

  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .scroll { overflow-x: auto; border: 1px solid var(--linie); }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--linie); white-space: nowrap; }
  th { font-family: var(--schmal); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.04em; background: var(--flaeche-2); }
  td.n { text-align: right; font-family: var(--zahl); font-variant-numeric: tabular-nums; }
  tbody tr:last-child td { border-bottom: none; }

  .fracht { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 1px; background: var(--linie); border: 1px solid var(--linie); margin-top: 1rem; }
  .fracht > div { background: var(--flaeche); padding: 0.9rem 1rem; }
  .fracht .k { font-family: var(--schmal); text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.05em; color: var(--ocker); }
  .fracht .w { font-family: var(--schmal); font-size: 1.5rem; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .fracht .e { font-size: 0.84rem; color: var(--gedaempft); }

  footer { margin-top: 3.5rem; padding-top: 1.5rem; border-top: 1px solid var(--linie); font-size: 0.85rem; color: var(--gedaempft); display: flex; flex-direction: column; gap: 0.6rem; }
  code { font-family: var(--zahl); font-size: 0.86em; }
  a { color: var(--ocker); }
  @media (max-width: 34rem) { .kennzahlen { gap: 0 1.4rem; } }
  `;
}

function karte(a, befund) {
  const eh = EINHEITEN[a.einheit] ?? a.einheit;
  const beipack = befund.nurBeipackSkus.includes(a.sku);
  const abstand = a.uvpNetto && !a.amListendeckel ? Math.round((1 - a.vkNetto / a.uvpNetto) * 100) : null;

  const marker = [];
  if (abstand !== null && abstand >= 5) marker.push(`<span class="marker vorteil">${abstand} % unter Liste</span>`);
  if (beipack) marker.push('<span class="marker beipack">Beipack</span>');
  if (a.sperrgut) marker.push('<span class="marker sperrig">palettiert</span>');

  return `      <article class="karte">
        <span class="nr">${esc(a.lieferantenArtikelnummer)}</span>
        <h3>${esc(a.bezeichnung)}</h3>
        ${marker.join('\n        ')}
        <div class="preis">
          <span class="netto">${euro(a.vkNetto)}&nbsp;€</span>
          <span class="eh">je ${esc(eh)}, netto</span>
        </div>
        <span class="brutto">${euro(a.vkBrutto)} € brutto · inkl. 20 % USt</span>
      </article>`;
}

function seite(katalog, befund, lieferant) {
  const jeGruppe = new Map();
  for (const a of katalog.artikel) {
    if (!jeGruppe.has(a.gruppe)) jeGruppe.set(a.gruppe, []);
    jeGruppe.get(a.gruppe).push(a);
  }
  const gruppen = REIHENFOLGE.filter((g) => jeGruppe.has(g));
  for (const g of jeGruppe.keys()) if (!gruppen.includes(g)) gruppen.push(g);

  const anker = (g) => g.toLowerCase().replace(/[^a-z]/g, '');

  const abschnitte = gruppen.map((g) => {
    const liste = jeGruppe.get(g).sort((a, b) => a.bezeichnung.localeCompare(b.bezeichnung, 'de'));
    return `    <section class="gruppe" id="${anker(g)}">
      <div class="gruppenkopf">
        <h2>${esc(g)}</h2>
        <span class="anzahl">${liste.length} Artikel</span>
      </div>
      <p class="gruppentext">${esc(GRUPPENTEXT[g] ?? '')}</p>
      <div class="raster">
${liste.map((a) => karte(a, befund)).join('\n')}
      </div>
    </section>`;
  });

  const f = lieferant.fracht;

  return `<title>Baustoffe zum Baumeisterpreis</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap">
<style>${stil()}</style>

<div class="huelle">
  <header>
    <p class="marke">Freudenthaler Bau GmbH · Ried in der Riedmark</p>
    <h1>Baustoffe zum<br>Baumeisterpreis</h1>
    <p class="lede">Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — zuzüglich einer
      Handelsspanne von ${Math.round(katalog.zielmarge * 100)} %. Geliefert wird im Umkreis, nicht in ganz
      Österreich: Das ist der Grund, warum die Rechnung aufgeht.</p>
    <div class="kennzahlen">
      <div class="kennzahl"><span class="z">${befund.artikelGesamt}</span><span class="b">Artikel</span></div>
      <div class="kennzahl"><span class="z">${befund.unterListe}</span><span class="b">unter Listenpreis</span></div>
      <div class="kennzahl"><span class="z">${befund.medianAbstandZurListe} %</span><span class="b">im Median darunter</span></div>
      <div class="kennzahl"><span class="z">${Math.round(katalog.zielmarge * 100)} %</span><span class="b">Handelsspanne</span></div>
    </div>
  </header>

  <div class="hinweis">
    <strong>Dies ist eine Vorschau, kein laufender Shop.</strong> Es kann nichts bestellt
    werden: Zahlungsanbieter, Impressum und Rechtstexte fehlen noch, und die Preise sind vor
    der Veröffentlichung beim Lieferanten zu bestätigen. Alle Preise sind
    <strong>Nettopreise für Unternehmer</strong>; die Umsatzsteuer ist getrennt ausgewiesen.
  </div>

  <nav class="gruppen" aria-label="Warengruppen">
${gruppen.map((g) => `    <a href="#${anker(g)}">${esc(g)}</a>`).join('\n')}
    <a href="#lieferung">Lieferung</a>
  </nav>

${abschnitte.join('\n\n')}

  <section class="gruppe" id="lieferung">
    <div class="gruppenkopf"><h2>Lieferung</h2></div>
    <p class="gruppentext">Die Frachtsätze stammen aus den tatsächlichen Lieferantenrechnungen,
      nicht aus einer Annahme. Sie sind der Grund, warum es einen Mindestbestellwert braucht:
      Eine kleine Lieferung trägt ihre eigene Fracht nicht.</p>
    <div class="fracht">
      <div><span class="k">Pauschale je Lieferung</span><span class="w">${euro(f.pauschaleNetto)} €</span><span class="e">Fracht zuzüglich Energiekostenzuschlag</span></div>
      <div><span class="k">Palettierte Ware</span><span class="w">+ ${euro(f.sperrgutZuschlagNetto)} €</span><span class="e">Kranentladung je Hub</span></div>
      <div><span class="k">Frei Haus ab</span><span class="w">—</span><span class="e">gibt es nicht: Die Pauschale steht auf jedem Beleg</span></div>
      <div><span class="k">Liefergebiet</span><span class="w">~40 km</span><span class="e">Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz und Linz-Land</span></div>
    </div>
  </section>

  <footer>
    <p><strong>Preisstand:</strong> ${esc(katalog.artikel.reduce((m, a) => (a.preisStand > m ? a.preisStand : m), ''))}.
      Alle Preise netto in Euro, Umsatzsteuer 20 % getrennt ausgewiesen. Der Vergleich „unter
      Listenpreis" bezieht sich auf den Listenpreis des Lieferanten, nicht auf einen
      Marktpreis.</p>
    <p>Erzeugt aus <code>data/katalog-baustoff.json</code> mit <code>npm run shopseite</code>.
      Nichts ist gegründet, verkauft oder eingenommen.</p>
  </footer>
</div>
`;
}

function main() {
  const i = process.argv.indexOf('--ziel');
  const ziel = i >= 0 ? process.argv[i + 1] : join(WURZEL, 'ausgabe', 'shop.html');

  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const katalogDatei = lies(join(WURZEL, 'data', 'katalog-baustoff.json'));
  const lieferantenDatei = lies(join(WURZEL, 'data', 'lieferanten.json'));
  const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');

  if (!existsSync(preisPfad)) {
    console.error('Die Preisdatei fehlt: preise/baustoff-preise.json');
    console.error('Eine Shop-Seite mit Platzhalterpreisen sieht aus wie eine echte —');
    console.error('das ist genau der Fehler, den dieses Vorhaben schon viermal gemacht hat.');
    process.exit(2);
  }

  const katalog = ladeBaustoffkatalog(katalogDatei, lies(preisPfad), lieferantenDatei, ZIELMARGE);
  if (!katalog.vollstaendig) {
    console.error(`Für ${katalog.ohnePreis.length} Artikel fehlt ein Preis: ${katalog.ohnePreis.join(', ')}`);
    process.exit(2);
  }

  const befund = katalogbefund(katalog);
  const lieferant = katalog.lieferantenById.get(katalogDatei.lieferantId);
  const html = seite(katalog, befund, lieferant);

  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, html, 'utf8');

  console.log(`${befund.artikelGesamt} Artikel in ${new Set(katalog.artikel.map((a) => a.gruppe)).size} Gruppen`);
  console.log(`${befund.unterListe} unter Liste, ${befund.amDeckel} als Beipack markiert`);
  console.log(`geschrieben: ${ziel} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { seite, karte };
