#!/usr/bin/env node
/**
 * Erzeugt die Google-Ads-Kampagne aus dem echten Katalog.
 *
 * Der Unterschied zu einer geplanten Kampagne: Die Gebote werden **gerechnet**,
 * nicht geschätzt. Was ein Klick kosten darf, ergibt sich aus dem
 * Deckungsbeitrag der Bestellung mal der Kaufquote — und der Deckungsbeitrag
 * steht seit dem Auslesen der Rechnungen artikelgenau fest.
 *
 * Zwei Regeln sind hier als Programm verankert, nicht als Empfehlung:
 *
 *   1. **Nur Artikel unter dem Listenpreis bekommen Anzeigen.** Wer einen
 *      Artikel bewirbt, dessen Verkaufspreis am Listendeckel klebt, bezahlt
 *      Klicks für einen Preisvergleich, den er verliert. Diese Artikel gehören
 *      in den Beipack. Der Katalogbefund trennt sie; dieses Werkzeug folgt ihm.
 *
 *   2. **Kein Gebot ohne Deckung.** Das Höchstgebot je Anzeigengruppe ist der
 *      Deckungsbeitrag des Referenzwarenkorbs mal der angenommenen Kaufquote.
 *      Liegt es unter dem Marktpreis für Klicks, wird die Gruppe als
 *      unwirtschaftlich gemeldet statt trotzdem ausgegeben.
 *
 * Ausgabe: Google Ads Editor liest CSV-Dateien je Ebene. Sie landen in
 * `ausgabe/kampagne/` und enthalten **keine Einkaufspreise** — nur Gebote,
 * Keywords und Anzeigentexte.
 *
 * Aufruf:  node bin/kampagne.mjs [--kaufquote 0.02] [--budget 10]
 *
 * Geschaltet wird nichts. Eine Kampagne löst Ausgaben aus; das entscheidet
 * der Auftraggeber, nicht dieses Werkzeug.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { bezirksliste, LIEFERGEBIET } from '../src/liefergebiet.js';
import { GRUPPENSEITE } from '../src/artikelliste.js';
import { ladeBaustoffkatalog, katalogbefund, ZIELMARGE } from '../src/baustoffkatalog.js';
import { ETAPPEN } from '../src/rollout.js';
import { PREISAUSSAGEN, VORRATSWORTE } from '../src/aussagen.js';
import { cent } from '../src/preis.js';
import { traegtSichSelbst } from '../src/kostenbild.js';
import { berechneWarenkorb } from '../src/warenkorb.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');

/**
 * Die Wörter eines Keywords, die auf der Landeseite vorkommen müssen.
 *
 * Zerlegt an Leerzeichen und Beistrichen; Wörter mit weniger als drei Zeichen
 * bleiben außen vor („und", „mm", „m2"), weil sie überall vorkommen und
 * deshalb nichts belegen.
 */
export function keywordWoerter(keyword) {
  return String(keyword ?? '').toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
}

/**
 * Der sichtbare Text im Hauptbereich einer gebauten Seite.
 *
 * Nur `<main>`: Kopfleiste und Fußzeile stehen auf **jeder** Seite und würden
 * jedes Wort decken, das dort zufällig auftaucht. Was zählt, ist der eigene
 * Inhalt der Landeseite.
 */
export function hauptbereichText(html) {
  const treffer = String(html ?? '').match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!treffer) return null;
  return treffer[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Welche Wörter eines Keywords die Landeseite **nicht** sagt.
 *
 * ## Warum das eine Abbruchbedingung wert ist
 *
 * **Gemessen am 01.09.:** 14 von 36 Keywords des ersten Anlaufs enthielten ein
 * Wort, das auf ihrer Landeseite nirgends steht. Wer „Armierungsgewebe" sucht,
 * bezahlt den Klick und landet auf einer Seite, die durchgehend
 * „Glasgewebe" sagt — dieselbe Ware, ein anderes Wort. Wer „Schornstein
 * Bausatz" sucht, landet auf einer Seite, die das Wort „Schornstein" nicht
 * kennt.
 *
 * Das kostet zweimal: den bezahlten Klick, der sofort zurückspringt, und die
 * Anzeigenrelevanz, die Google aus genau diesem Abgleich bildet.
 *
 * **Kein Ausnahmenverzeichnis für „Absichtswörter" wie „kaufen".** Die Regel
 * lautet: *Wir bieten nur auf Wörter, die wir auch sagen.* Ein Shop, dessen
 * Seite nirgends „kaufen" sagt, hat ein Seitenproblem und kein Regelproblem —
 * und ein Ausnahmenverzeichnis wäre die Stelle, an der später jedes
 * unbequeme Wort landet.
 */
export function ungedeckteWoerter(keyword, seitentext) {
  const t = String(seitentext ?? '');
  return keywordWoerter(keyword).filter((w) => !t.includes(w));
}
const REPO = join(WURZEL, '..');
const AUSGABE = join(WURZEL, 'ausgabe', 'kampagne');

/** Marktübliche Klickpreise in Österreich, Bau und Handwerk. */
export const MARKT_CPC = { unten: 0.5, oben: 2.5 };

/** Grenzen des Anzeigenformats. Zu lange Texte weist Google beim Import ab. */
const MAX_UEBERSCHRIFT = 30;
const MAX_BESCHREIBUNG = 90;
const MAX_PFADTEIL = 15;

/**
 * Referenzwarenkörbe je Warengruppe.
 *
 * Sie sind der Kern der Gebotsrechnung und deshalb hier offen und begründet.
 * Der Befund aus `katalog-aus-rechnungen.md`: Die großen Belege bestehen aus
 * acht bis zwölf Positionen, nicht aus einer teuren. Wer je Artikel bietet,
 * bietet auf den Ein-Sack-Kunden — und der ist bei keinem Klickpreis bezahlbar.
 * Gerechnet wird deshalb auf die Bestellung, die eine Suche tatsächlich
 * auslöst.
 */
/**
 * **Umgebaut am 4. September.** Bis dahin trug jeder Warenkorb einen von Hand
 * geschriebenen `text` **neben** seinen Positionen. Beim WDVS-Korb sind die
 * beiden auseinandergelaufen:
 *
 * > „100 m² Wärmedämmverbundsystem: Kleber, Gewebe, Dübel, Putzgrund,
 * > **Oberputz**"
 *
 * Im Korb steht kein Oberputz. Statt seiner liegt **Kantenschutz** darin, den
 * der Text nicht nennt. Der Text geht als `Referenzwarenkorb` nach Google, die
 * Positionen tragen den Deckungsbeitrag und damit das Gebot — zwei Aussagen
 * über dieselbe Sache, und eine davon falsch.
 *
 * Es ist derselbe Befund wie am 1. September, eine Zeile weiter: Damals stand
 * „Eine Palette Mörtel" über einem Korb aus vierzig Säcken.
 *
 * > **Ein Text, der neben den Daten steht, beschreibt sie irgendwann nicht
 * > mehr.** Er wird jetzt aus ihnen gebaut.
 *
 * `umfang` ist der Teil, den nur ein Mensch sagen kann („100 m² Fassade"). Was
 * darin liegt, sagt die Liste — je Position ein `was` in der Sprache des
 * Bauleiters, nicht die Artikelbezeichnung des Lieferanten.
 */
export const WARENKOERBE = {
  WDVS: {
    umfang: '100 m² Wärmedämmverbundsystem',
    positionen: [
      { sku: 'POS-11283', menge: 500, was: 'Kleber' },      // Klebe- und Spachtelmasse, kg
      { sku: 'POS-50509', menge: 110, was: 'Gewebe' },      // Glasgewebe, m²
      { sku: 'POS-11082', menge: 6, was: 'Dübel' },         // Universaldübel, Karton
      { sku: 'POS-13728', menge: 25, was: 'Putzgrund' },    // Putzgrund, kg
      { sku: 'POS-53402', menge: 40, was: 'Kantenschutz' }, // lfm
    ],
  },
  'Dämmung': {
    umfang: '100 m²',
    positionen: [{ sku: 'POS-12575', menge: 100, was: 'Perimeterdämmung XPS 80 mm' }],
  },
  Kamin: {
    umfang: 'Ein Kaminzug',
    positionen: [
      { sku: 'POS-10837', menge: 13, was: 'Mantelsteine' },
      { sku: 'POS-12476', menge: 4, was: 'gedämmtes Rohr' },
      { sku: 'POS-12472', menge: 1, was: 'Fertigfußpaket' },
      { sku: 'POS-12467', menge: 1, was: 'Putztüranschluss' },
      { sku: 'POS-51875', menge: 1, was: 'Regenhaube' },
    ],
  },
  Kanal: {
    umfang: '30 lfm Kanal DN 100',
    positionen: [
      { sku: 'POS-10095', menge: 30, was: 'Rohre' },
      { sku: 'POS-10115', menge: 4, was: 'Bögen' },
      { sku: 'POS-10134', menge: 3, was: 'Abzweiger' },
      { sku: 'POS-11133', menge: 1, was: 'Schachtring' },
    ],
  },
  // **Berichtigt am 01.09.** Hier stand „Eine Palette Mörtel" und „Eine
  // Palette Planziegel" — derselbe Satz, den die Anzeigentexte gestern
  // verloren haben, nur eine Datei weiter. Der Text geht als
  // `Referenzwarenkorb` nach Google und beschreibt dort ein Gebinde, das kein
  // Artikel dieses Katalogs hat. Jetzt steht die Menge da, die tatsächlich
  // gerechnet wird.
  'Mörtel': {
    umfang: '40 Sack',
    positionen: [{ sku: 'POS-13550', menge: 40, was: 'Mörtel' }],
  },
  Mauerwerk: {
    umfang: '128',
    positionen: [{ sku: 'POS-29728', menge: 128, was: 'Planziegel' }],
  },
};

/**
 * Der Referenzwarenkorb, wie er nach Google geht — **aus den Positionen
 * gebaut** und nicht daneben geschrieben.
 *
 * Zwei Aussagen über dieselbe Sache laufen auseinander; eine, die aus der
 * anderen entsteht, kann es nicht.
 */
export function warenkorbText(korb) {
  const teile = korb.positionen.map((p) => p.was).filter(Boolean);
  if (teile.length !== korb.positionen.length) {
    throw new Error(`Referenzwarenkorb „${korb.umfang}": eine Position ohne Klartext`);
  }
  // Eine Position: Umfang und Sache bilden einen Ausdruck („40 Sack Mörtel").
  // Mehrere: der Umfang, ein Doppelpunkt, die Aufzählung.
  return teile.length === 1
    ? `${korb.umfang} ${teile[0]}`
    : `${korb.umfang}: ${teile.join(', ')}`;
}

/**
 * Marken, die im Artikelnamen vorkommen. Sie tragen die Kampagne: Auf
 * Gattungsbegriffe („Dämmplatte") gewinnt die Baumarkt-Eigenmarke, auf
 * Markenbegriffe („Capatect 186 M") vergleicht der Kunde Gleiches mit Gleichem.
 */
const MARKEN = ['Capatect', 'Baumit', 'Soudal', 'Isover', 'Schiedel', 'SIKM', 'SIK', 'Ravenit', 'SunCore', 'Ökotherm', 'Prima'];

/**
 * Ausschlussliste. Jeder Klick, der nicht zur Baustelle führt, ist verloren.
 *
 * **Erweitert am 3. September 2026 um die zwei harten Grenzen des Shops.** Die
 * vier vorhandenen Themen schließen aus, was *wahrscheinlich* nicht kauft.
 * Was fehlte, war das, was **nicht kaufen kann**:
 *
 *   * **Außerhalb des Liefergebiets.** Gate 23 nimmt keine Bestellung aus
 *     einem anderen Bezirk an. Die Ortssteuerung von Google richtet sich nach
 *     dem Standort des Suchenden — sie greift nicht, wenn jemand aus Linz
 *     „Dämmung kaufen Wien" tippt, weil er dort baut. Der Klick wird bezahlt,
 *     die Anfrage abgelehnt.
 *   * **Privatkunden.** Gate 7 lässt nur Unternehmer bestellen; alle Preise
 *     sind netto. Ein Heimwerker klickt, rechnet mit Brutto und geht.
 *
 * > **Ein Ausschluss ist billiger als jede Anzeige: Er kostet nichts und
 * > spart genau die Klicks, die nie zu einer Bestellung führen können.**
 *
 * **Was hier nicht hineingehört, ist ebenso wichtig.** Kein Ortsname des
 * eigenen Liefergebiets — „linz" auszuschließen wäre ein Ausschluss der
 * eigenen Kundschaft. Und kein Wort, das in einem geführten Suchbegriff
 * vorkommt. Beides prüft ein Testfall gegen `LIEFERGEBIET` und die
 * Keywordliste; ein Ausschluss, der eigene Ware oder das eigene Gebiet trifft,
 * ist teurer als kein Ausschluss.
 */
const NEGATIVE = {
  'Preis und Menge': ['günstig', 'billig', 'gebraucht', 'restposten', 'einzeln', 'einzelsack', 'kleinmenge', 'muster', 'probe', 'reststück'],
  Wettbewerb: ['baumarkt', 'obi', 'hornbach', 'bauhaus', 'lagerhaus', 'hagebau', 'amazon', 'willhaben'],
  'Suche ohne Kaufabsicht': ['anleitung', 'wie', 'video', 'youtube', 'erfahrung', 'test', 'vergleich', 'berechnen', 'rechner', 'wikipedia', 'was ist'],
  // **Erweitert am 5. September um die Leistungssuche.** Die Gruppe trug mit
  // „reparatur" schon ein Dienstleistungswort — und übersah die drei, nach
  // denen bei Dämmung und Kamin tatsächlich gesucht wird. Dieser Shop
  // verkauft **Ware und kein Gewerk**: Es gibt keine Werkleistung in der
  // AGB-Gliederung, keinen Montagepreis im Katalog und keine Gewährleistung
  // für eine Ausführung. Wer eine Leistung sucht, sucht einen Handwerker;
  // der Klick ist trotzdem bezahlt.
  //
  // Dieselbe Begründungsform wie „mieten" und „verleih": nicht „kauft
  // wahrscheinlich nicht", sondern **kann hier nicht kaufen, was er sucht**.
  'Falsche Absicht': [
    'job', 'jobs', 'lehre', 'gehalt', 'praktikum', 'miete', 'mieten', 'leihen', 'verleih',
    'entsorgung', 'entsorgen', 'reparatur',
    'montage', 'einbau', 'einbauen lassen', 'verlegen lassen', 'setzen lassen',
    'sanieren lassen', 'firma sucht', 'handwerker',
    // Förderung: Der Shop berät nicht und rechnet nichts ab. „Sanierungsbonus"
    // und „Förderung Fassadendämmung" sind Suchen nach Geld, nicht nach Ware —
    // und sie treffen genau die Gattungsbegriffe, auf denen dieser Shop
    // ohnehin am teuersten einkauft.
    'förderung', 'foerderung', 'sanierungsbonus', 'zuschuss',
  ],
  // Die größten österreichischen Städte und Länder **außerhalb** der fünf
  // Bezirke. Nicht alles, was außerhalb liegt — das wären hunderte Namen —,
  // sondern das, was jemand tatsächlich eintippt, wenn er dort baut.
  'Außerhalb des Liefergebiets': [
    'wien', 'graz', 'salzburg', 'innsbruck', 'klagenfurt', 'villach', 'wels', 'steyr',
    'st. pölten', 'dornbirn', 'bregenz', 'tirol', 'vorarlberg', 'kärnten', 'burgenland',
    'steiermark', 'deutschland', 'bayern', 'passau',
  ],
  // Gate 7: nur Unternehmer. Der Shop führt Nettopreise und einen
  // Mindestbestellwert von 250 € je Lieferung — ein Heimwerker ist an beidem
  // falsch beraten, und der Klick ist trotzdem bezahlt.
  Privatkunde: ['privat', 'heimwerker', 'diy', 'selber machen', 'für zuhause', 'hobby'],
};

/* ------------------------------------------------------------------ *
 * Was nicht ausgeschlossen wird — 5. September 2026
 *
 * Die Geo-Liste nennt Städte und Länder außerhalb der fünf Bezirke. Der
 * naheliegende nächste Eintrag wäre **„ried"** — Ried im Innkreis ist eine
 * oberösterreichische Bezirkshauptstadt weit außerhalb des Liefergebiets.
 *
 * Er wäre der teuerste Ausschluss der ganzen Liste. **Der Betrieb sitzt in
 * Ried in der Riedmark** (Marwach 5, 4312), Bezirk Perg. Ein Bauleiter, der
 * „Dämmplatten Ried" tippt, meint mit einiger Wahrscheinlichkeit den Ort, in
 * dem der Shop steht — und der Ausschluss träfe die eigene Kundschaft an
 * ihrer Haustür.
 *
 * Dieser Bestand ist an genau dieser Zweideutigkeit schon einmal gescheitert:
 * Vier Dokumente hielten **Ried im Innkreis** für den Heimatbezirk.
 *
 * > **Der gefährlichste Ausschluss ist der Ortsname, den es zweimal gibt.**
 *
 * **Und die Prüfung, die das verhindern soll, hätte ihn durchgelassen.** Sie
 * hält die Ausschlüsse gegen `LIEFERGEBIET.bezirke` — „Perg", „Linz",
 * „Linz-Land", „Freistadt", „Urfahr-Umgebung". Keiner davon enthält „ried".
 * Der **Ort**, an dem der Betrieb steht, stand in keiner Prüfung; er steht in
 * `data/betreiber.json`.
 *
 * Dieses Verzeichnis hält den Fall fest, damit ein späterer Lauf ihn nicht
 * arglos ergänzt — und `pruefeAusschluesse` hält es in beide Richtungen:
 * Ein Eintrag, der doch in der Liste steht, ist ein Befund.
 * ------------------------------------------------------------------ */
export const NICHT_AUSGESCHLOSSEN = Object.freeze([
  Object.freeze({
    wort: 'ried',
    warum: 'Der Betrieb sitzt in Ried in der Riedmark, Bezirk Perg — mitten im '
      + 'Liefergebiet. Gemeint wäre Ried im Innkreis, 100 km westlich. Ein Phrase-Ausschluss '
      + 'unterscheidet die beiden nicht und träfe die eigene Kundschaft an ihrer Haustür. '
      + 'Dieselbe Verwechslung stand am 26. August in vier Dokumenten dieses Bestands.',
  }),
  Object.freeze({
    wort: 'abholung',
    warum: 'Die Lieferseite sagt ausdrücklich „Ja, ausdrücklich vorgesehen. Wer selbst '
      + 'abholt, zahlt keine Fracht." Selbstabholung ist ein angebotener Weg und spart dem '
      + 'Shop die Frachtpauschale — eine Suche danach ist die günstigste Bestellung, die '
      + 'er bekommen kann.',
  }),
]);

/**
 * Hält die Ausschlussliste gegen das, was sie nicht treffen darf.
 *
 * Drei Quellen, keine zweite Liste: die Bezirke des Liefergebiets, der **Ort
 * des Betriebs** und die geführten Suchbegriffe.
 *
 * @param {string[]} ausschluesse  kleingeschrieben
 * @param {{bezirke: string[], ort: string, keywords: string[]}} lage
 */
export function pruefeAusschluesse(ausschluesse, lage, nichtAusgeschlossen = NICHT_AUSGESCHLOSSEN) {
  const fehler = [];
  const orte = [...(lage.bezirke ?? []), ...(lage.ort ? [lage.ort] : [])].map((o) => o.toLowerCase());
  if (orte.length === 0) {
    return ['pruefeAusschluesse ohne Orte — dann prüft sie nichts und meldet es als bestanden'];
  }

  for (const ort of orte) {
    for (const wort of ausschluesse) {
      // Phrase-Ausschluss: Er greift, wenn er als Wortfolge vorkommt. „linz"
      // trifft damit „linz-land", und „ried" träfe „ried in der riedmark".
      if (ort.includes(wort)) fehler.push(`„${wort}" schließt den eigenen Ort ${ort} aus`);
    }
  }
  for (const k of lage.keywords ?? []) {
    for (const wort of ausschluesse) {
      if (k.toLowerCase().includes(wort)) fehler.push(`„${wort}" schließt den eigenen Begriff „${k}" aus`);
    }
  }
  for (const n of nichtAusgeschlossen) {
    if (!n.warum || n.warum.length < 80) {
      fehler.push(`${n.wort}: im Verzeichnis der nicht ausgeschlossenen Wörter ohne tragfähigen Grund`);
    }
    if (ausschluesse.includes(n.wort)) {
      fehler.push(`„${n.wort}" steht in der Ausschlussliste, obwohl das Verzeichnis sagt, warum nicht`);
    }
  }
  return fehler;
}

function marke(bezeichnung) {
  return MARKEN.find((m) => bezeichnung.startsWith(m)) ?? null;
}

/**
 * Aus einer Artikelbezeichnung einen Suchbegriff machen — oder keinen.
 *
 * Eine Katalogbezeichnung ist kein Suchbegriff. „Capatect Glasgewebe M,
 * Breite 110cm, orange 55 m2" tippt niemand; wer daraus ein Keyword macht,
 * bezahlt den Aufwand und bekommt null Impressionen. Ein erster Versuch mit
 * einfachem Abschneiden erzeugte Fragmente wie „Baumit TextilglasGitter 1,1x"
 * — schlimmer als nichts, weil es nach einem gepflegten Konto aussieht.
 *
 * Deshalb: Gebinde- und Maßangaben entfernen, dann **prüfen**, ob übrig
 * bleibt, was ein Mensch eingibt. Was die Prüfung nicht besteht, wird
 * verworfen und gemeldet, nicht notdürftig repariert.
 */
export function suchname(bezeichnung) {
  let s = bezeichnung
    // Gebindeangaben am Ende: „55 m2", „0,75 m2", „25 kg", „750 ml", „50 m"
    .replace(/[\s,]*\d+[,.]?\d*\s*(m2|m²|kg|lfm|ml|l|stk|m)\s*$/i, '')
    // Farb- und Verpackungszusätze, die niemand mitsucht.
    // Lookahead statt \b: JavaScripts Wortgrenze ist ASCII-basiert, „ß" gilt
    // ihr nicht als Wortzeichen — `weiß\b` trifft deshalb nie. Dieselbe Falle
    // hat schon die ÖNORM-Regel des Hohlheitsprüfers blind gemacht
    // (docs/baustoff-shop/inhalte-und-pruefteam.md).
    .replace(/,?\s*(orange|weiß|weiss|gelb|lose|monolithisch)(?![\p{L}\d])/giu, '')
    // Klammerzusätze und Mengenangaben in Klammern
    .replace(/\s*\([^)]*\)/g, '')
    // „Breite 110cm", „inkl. Befestigungsset" — Beschreibung, keine Suche
    .replace(/,?\s*(Breite|Länge|inkl\.?)\s+[^,]*/gi, '')
    .replace(/[\s,;.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Ein Rest wie „1,1x" oder „2," ist ein abgeschnittenes Maß, kein Wort.
  s = s.replace(/[\s,]+[\d,.]+\s*x?$/i, '').replace(/[\s,;.]+$/, '').trim();

  return s;
}

/**
 * Kurzform aus Marke und Typkennung — so, wie im Fach danach gesucht wird.
 *
 * „Capatect Klebe- und Spachtelmasse 186 M" ist als Ganzes zu lang für eine
 * Suche, aber **„Capatect 186 M" wird gesucht**: Auf der Baustelle nennt man
 * die Typnummer, nicht die Produktbeschreibung. Die volle Bezeichnung
 * ersatzlos zu verwerfen, hätte genau die Begriffe weggeworfen, auf denen
 * dieser Shop konkurrenzfähig ist.
 *
 * Typkennungen sind Wortmarken mit Ziffern („186", „FK500", „TDPT 20") oder
 * durchgehend groß geschriebene Kürzel („N+F", „XPS"). Findet sich keine,
 * gibt es keine Kurzform — dann bleibt es beim Verwerfen.
 */
export function kurzform(bezeichnung, m) {
  if (!m) return null;
  const rest = suchname(bezeichnung).slice(m.length).trim();
  const tokens = rest.split(/\s+/).filter(Boolean);
  // Ein einzelner Großbuchstabe ist für sich keine Typkennung — hinter einer
  // Nummer aber sehr wohl: „186 M" und „190 FEIN" sind die Bezeichnungen, mit
  // denen auf der Baustelle bestellt wird. Wer das „M" wegwirft, landet bei
  // „Capatect 186" und damit auf beiden Produkten zugleich.
  const kennung = tokens.filter(
    (t, i) =>
      // Vierstellige Zahlen sind Maße („1200/600 mm") oder Katalognummern,
      // keine Typkennung. Sie hier zu behalten kostete „Isover TDPT 20":
      // die Kennung rutschte aus den ersten Stellen heraus.
      (!/\d{4,}/.test(t)) &&
      (/\d/.test(t) ||
      (/^[A-ZÄÖÜ+]{2,6}$/.test(t)) ||
      (/^[A-ZÄÖÜ]$/.test(t) && i > 0 && /\d/.test(tokens[i - 1]))),
  );
  if (!kennung.length) return null;
  // Zwei Kennungstoken genügen und sind zugleich die Obergrenze: „TDPT 20",
  // „186 M", „190 FEIN", „HL N+F". Ein drittes zog jedes Mal ein Maß herein
  // („Isover TDPT 20 600") und machte aus dem Suchbegriff eine Katalogzeile.
  return `${m} ${kennung.slice(0, 2).join(' ')}`.trim();
}

/**
 * Taugt der Begriff als Keyword?
 *
 * Die Regeln stehen vor den Kandidaten, nicht danach — sonst wird die Grenze
 * so lange verschoben, bis die Liste lang genug aussieht.
 */
export function taugtAlsKeyword(s) {
  if (s.length < 6) return { taugt: false, grund: 'zu kurz' };
  const woerter = s.split(/\s+/);
  if (woerter.length > 5) return { taugt: false, grund: 'zu lang — solche Ketten werden nicht gesucht' };
  if (/[,;]$/.test(s) || /\d[,.]$/.test(s)) return { taugt: false, grund: 'endet auf ein abgeschnittenes Maß' };
  if (/\b\d{4,}\b/.test(s)) return { taugt: false, grund: 'enthält eine Katalognummer' };
  // Mindestens zwei zusammenhängende Buchstaben — reine Zahlen-Maß-Ketten raus.
  if (!/[A-Za-zÄÖÜäöüß]{3,}/.test(s)) return { taugt: false, grund: 'kein Wortbestandteil' };
  return { taugt: true };
}

/**
 * Suchbegriffe, die Menschen tatsächlich eingeben.
 *
 * Handgeschrieben, weil sie aus dem Fach kommen und nicht aus dem Katalog.
 * Das ist die Gattungsebene; die Markenebene kommt aus den Artikelnamen.
 * Die Trennung entspricht dem Befund aus `erste-echte-zahlen.md`: Auf
 * Gattungsbegriffe allein ist dieser Shop nicht konkurrenzfähig — sie stehen
 * hier nur in der Kombination mit Menge, Lieferung oder Fachanforderung.
 */
const GATTUNGSBEGRIFFE = {
  WDVS: [
    'WDVS Kleber', 'Klebe und Spachtelmasse', 'Armierungsmörtel', 'Armierungsgewebe',
    'Fassadendübel', 'Putzgrund Fassade', 'WDVS System kaufen',
  ],
  'Dämmung': [
    'XPS Platten kaufen', 'XPS 80 mm', 'XPS 100 mm', 'Perimeterdämmung XPS',
    'EPS Fassadenplatten', 'Fassadendämmung EPS', 'Perimeterdämmung druckfest',
  ],
  Kamin: [
    'Schiedel Kamin', 'Kaminsystem einzügig', 'Mantelstein Kamin', 'Kaminrohr gedämmt',
    // „Kaminkopf Regenhaube“ ist am 01.09. entfallen. Der Shop führt die
    // Kaminkopfverkleidung ausdrücklich nicht — `suchwoerter.json` lehnt das Wort
    // mit Begründung ab, und die eigene Suche findet dazu nichts. Auf ein Wort zu
    // bieten, das die eigene Suche nicht beantwortet, ist ein bezahlter Klick auf
    // eine leere Trefferliste.
    'Kamin Fertigfuß',
  ],
  Kanal: [
    'Kanalrohr DN 100', 'PVC Kanalrohr', 'Kanalbogen DN 100', 'Kanalabzweiger 45 Grad',
    'Kanalschacht 800', 'Drainage Grundmauerschutz', 'Noppenbahn Grundmauer',
  ],
  'Mörtel': [
    'Baumit ThermoMörtel', 'Leichtmörtel Palette', 'Mauermörtel Palette', 'Vergussmörtel 25 kg',
  ],
  Mauerwerk: [
    'Planziegel kaufen', 'Hochlochziegel Palette', 'Ökotherm Ziegel', 'Ziegel 50 cm',
  ],
};

function csv(kopf, zeilen) {
  const feld = (w) => {
    const s = String(w ?? '');
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [kopf.join(','), ...zeilen.map((z) => kopf.map((k) => feld(z[k])).join(','))].join('\n') + '\n';
}

/**
 * Prüft Anzeigentexte gegen die Längengrenzen — und wirft, statt zu kürzen.
 *
 * Kürzen wäre die bequeme Variante und die falsche: Ein automatisch
 * abgeschnittener Anzeigentext liest sich wie ein Fehler und wirbt trotzdem.
 * Wer eine Überschrift zu lang schreibt, soll sie selbst kürzen.
 */

/**
 * Wörter, mit denen eine Überschrift nicht enden darf.
 *
 * **Zweiter Befund vom 31.08.** „Vom Baumeister, nicht vom" — fünfundzwanzig
 * Zeichen, also innerhalb der dreißig, und trotzdem ein Satzfragment. Jemand
 * hat „…nicht vom Baumarkt" gekürzt, statt es umzuformulieren.
 *
 * Genau der Fehler, den dieses Werkzeug bei den **Keywords** längst
 * verhindert: „Der erste Wurf schnitt einfach ab und erzeugte Fragmente wie
 * ‚Baumit TextilglasGitter 1,1x' — schlimmer als gar kein Keyword." Für die
 * Anzeigentexte galt die Regel nicht, obwohl sie dort ein Mensch liest.
 */
const ENDET_NICHT_AUF = ['vom', 'von', 'am', 'im', 'zum', 'zur', 'mit', 'für', 'und', 'oder',
  'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'auf', 'aus', 'bei', 'nach', 'ohne', 'bis'];

/**
 * Die Anzeigentexte je Warengruppe — **alle**, auch die zurückgestellten.
 *
 * Auf Modulebene und exportiert, seit am 31.08. auffiel, dass die
 * Textprüfung nur noch die ausgegebenen Anzeigen sah: In der
 * zurückgestellten Gruppe Kanal stand weiterhin „PVC Kanal ab Lager",
 * dieselbe unwahre Vorratszusage, die mittags aus der Dämmung entfernt
 * worden war. Sie wäre am Tag der Aktivierung hinausgegangen.
 */
export const ANZEIGENTEXTE = {
  WDVS: {
    k: ['WDVS zum Baumeisterpreis', 'Capatect und Baumit', 'Armierung bis Oberputz', 'Kleber, Gewebe, Dübel', 'Baumeisterpreis, nicht Liste', 'Fassade aus einer Bestellung'],
    b: ['Armierung, Putzgrund, Oberputz und Zubehör — geliefert auf die Baustelle.', 'Kleber, Gewebe, Dübel, Putzgrund. Was zusammengehört, kommt zusammen.', 'Ein Baumeister kauft ein — wie weit unter der Liste, steht bei jedem Artikel.'],
    pfad: ['fassade', 'wdvs'],
  },
  'Dämmung': {
    k: ['XPS und EPS vom Baumeister', 'Perimeterdämmung 80 mm', 'Dämmplatten auf die Baustelle', 'Baumeisterpreis auf XPS', 'Druckfestes XPS im Sockel', 'Kein Baumarktpreis', 'XPS 30 bis 100 mm'],
    b: ['XPS von 30 bis 100 mm, EPS als Ausgleich — geliefert auf die Baustelle.', 'Perimeter- und Fassadendämmung zum Preis, den ein Baumeister zahlt.', 'In Paketeinheiten gerechnet, damit kein Rest übrig bleibt.'],
    pfad: ['daemmung', 'xps'],
  },
  Kamin: {
    k: ['Schiedel Kaminsystem', 'Kaminzug in einer Lieferung', 'Mantelstein und Rohr', 'Vom Fertigfuß zur Haube', 'Kamin auf die Baustelle', 'SIKM Systemteile', 'Kamin zum Baumeisterpreis'],
    b: ['Fertigfuß, Mantelsteine, gedämmtes Rohr, Putztür und Haube.', 'Schiedel-Systemteile aus einer Bestellung, geliefert statt abgeholt.', 'Was beim Kamin fehlt, hält die Baustelle auf. Die Stückliste sagt es vorher.'],
    pfad: ['kamin', 'schiedel'],
  },
  Kanal: {
    k: ['Kanalrohr DN 100', 'Rohr, Bogen, Abzweig', 'Rohr, Bögen, Abzweiger', 'PVC Kanal vom Baumeister', 'Schacht und Formteile', 'Kanal zum Baumeisterpreis'],
    b: ['Kanalrohr, Bögen, Abzweiger und Schacht — aufeinander abgestimmt.', 'PVC-Kanal DN 100 mit allen Formteilen. Lieferung auf die Baustelle.', 'Ein Bogen zu wenig kostet einen halben Tag. Deshalb liefern wir das Set.'],
    pfad: ['kanal', 'dn100'],
  },
  'Mörtel': {
    k: ['Baumit ThermoMörtel', 'Mörtel auf die Baustelle', 'Baumeisterpreis auf Mörtel', 'Fracht getrennt ausgewiesen', 'Mauer- und Vergussmörtel'],
    b: ['Baumit-Mörtel geliefert auf die Baustelle, Fracht getrennt ausgewiesen.', 'Der Preisvorteil kommt aus dem Einkauf, nicht aus der Bestellmenge.', 'Mörtel zum Preis, den ein Baumeister im Einkauf zahlt.'],
    pfad: ['moertel', 'baumit'],
  },
  Mauerwerk: {
    k: ['Planziegel vom Baumeister', 'Ökotherm Hochlochziegel', 'Ziegel auf die Baustelle', 'Baumeisterpreis auf Ziegel', 'Mauerwerk komplett', 'Geliefert statt abgeholt'],
    b: ['Planziegel geliefert und mit Kran entladen, Fracht getrennt ausgewiesen.', 'Mauerwerk zum Preis, den ein Baumeister im Einkauf zahlt.', 'Auf die Baustelle geliefert statt im Baumarkt abgeholt.'],
    pfad: ['ziegel', 'mauerwerk'],
  },
};

/**
 * Der ganze Textvorrat als Prüfmenge — eine Zeile je Warengruppe.
 *
 * Getrennt von der Ausgabe und exportiert, damit eine Probe sie befragen kann.
 * **Wer den Ausgabeumfang verkleinert, verkleinert die Prüfung mit, wenn beide
 * an derselben Liste hängen** — genau das ist am 31.08. passiert.
 */
export function alleAnzeigentexte() {
  return Object.entries(ANZEIGENTEXTE).map(([gruppe, t]) => {
    const satz = { Anzeigengruppe: gruppe };
    t.k.forEach((k, i) => { satz[`Überschrift ${i + 1}`] = k; });
    t.b.forEach((b, i) => { satz[`Beschreibung ${i + 1}`] = b; });
    return satz;
  });
}

/**
 * Gebindeaussagen — was eine Anzeige über die **Verkaufseinheit** behauptet.
 *
 * ## Der Befund vom 01.09.
 *
 * Sechs von sechs Anzeigengruppen warben mit Paletten: „Dämmplatten
 * palettenweise", „Ganze Paletten statt Einzelplatten", „Wir liefern
 * Paletten, keine Einzelsäcke — das ist der ganze Preisvorteil."
 *
 * **Kein einziger der 46 Artikel hat eine Palette.** Die Einheiten des
 * Katalogs sind STK, M2, KG, KRT, SCK, LFM, DOS, EIM und RLL; das Wort
 * „Palette" kommt in `data/` genau einmal vor, und zwar als *Kostenposition*
 * des Lieferanten (132,00 € für sechs Paletten auf einem Beleg) — als
 * Nebenkosten, nicht als Verkaufseinheit.
 *
 * Die Anzeigen beschrieben also einen anderen Shop als den, der dahinter
 * steht. Dieselbe Familie wie „ab Lager" bei einem Betrieb ohne Lager, nur
 * eine Ebene tiefer: nicht die Verfügbarkeit war erfunden, sondern das
 * Gebinde.
 *
 * Zwei Richtungen, und beide sind derselbe Fehler:
 *
 * - **behauptet** — die Anzeige wirbt mit einem Gebinde, das kein Artikel
 *   führt. „Ganze Paletten" bei lauter Quadratmeter- und Stückpreisen.
 * - **schliesstAus** — die Anzeige schließt ein Gebinde aus, das der Shop
 *   sehr wohl verkauft. „Kein Sackverkauf" bei zwei Artikeln in Sack, und
 *   „statt Stückware" bei achtzehn in Stück.
 *
 * Geprüft wird gegen die Einheiten des Katalogs, nicht gegen eine Liste.
 * Nimmt der Shop einmal Palettenware auf, hört die Regel von selbst auf zu
 * schlagen — und niemand muss daran denken.
 */
export const GEBINDEAUSSAGEN = Object.freeze([
  Object.freeze({ muster: /palett/i, behauptet: 'PAL', was: 'Palettenware' }),
  Object.freeze({ muster: /kein\w* sackverkauf|keine Einzelsäcke/i, schliesstAus: 'SCK', was: 'Sackware' }),
  Object.freeze({ muster: /statt Stückware|keine Kleinmengen/i, schliesstAus: 'STK', was: 'Stückware' }),
]);

/**
 * Aussagen, die **Vollständigkeit** versprechen.
 *
 * **Befund vom 2. September.** Zwei der drei Anzeigengruppen des ersten
 * Anlaufs warben mit „Fassade komplett liefern", „Das komplette
 * Fassadensystem aus einer Hand" und „XPS und EPS in allen gängigen Stärken".
 * Die eigene Systemliste `system/fassade-100-qm.md` sagt im selben Verzeichnis:
 *
 * > **Die Dämmplatte selbst führen wir derzeit nicht in Flächenstärke.** Im
 * > Sortiment stehen Fassadenplatten nur in dünnen Stärken.
 *
 * Fassaden-EPS gibt es in 2, 3 und 5 cm. Eine WDVS-Dämmung beginnt bei acht.
 * Der Besucher klickt für 4,19 € auf „Fassade komplett" und findet die
 * Schicht nicht, aus der eine Fassadendämmung besteht.
 *
 * > **Ein Vollständigkeitsversprechen ist eine Aussage über den Katalog, nicht
 * > über die Absicht.**
 *
 * Dieselbe Familie wie „Paletten, die es nicht gibt" und „ab Lager ohne
 * Lager" — nur eine Ebene höher: nicht die Gebindeform, sondern der Umfang.
 * Geprüft wird gegen die **eigenen Systemlisten**: Nennt eine davon eine
 * Schicht als nicht geführt, darf keine Anzeige derselben Gruppe
 * Vollständigkeit versprechen.
 */
export const VOLLSTAENDIGKEITSWORTE = Object.freeze([
  /\bkomplett\w*/i,
  /\baus einer Hand\b/i,
  /\ball(?:e|en|er)\s+g(?:ä|ae)ngigen\b/i,
  /\bvollst(?:ä|ae)ndig\w*/i,
  /\bganze[sn]?\s+(?:System|Aufbau)\b/i,
]);

// `PREISAUSSAGEN` und `VORRATSWORTE` stehen seit dem 5. September in
// `src/aussagen.js`. Beide sind aus Anzeigentexten entstanden und haben nur
// Anzeigentexte gelesen — während auf der Startseite dieselbe Behauptung
// stand. Sie gelten für jede Fläche; die Begründung steht dort.
/* ------------------------------------------------------------------ *
 * Aussagen über die Bestellbarkeit — 5. September 2026
 *
 * **Der Befund.** Alle drei Anzeigen versprechen eine Bestellung:
 *
 * > „Fassade **aus einer Bestellung**" · „Kaminzug **in einer Lieferung**" ·
 * > „Schiedel-Systemteile aus einer Bestellung, **geliefert statt abgeholt**"
 *
 * Der Shop kann heute keine Bestellung entgegennehmen — Gate 26, der
 * Bestellweg ist gebaut und ausgeschaltet, und `llms.txt` sagt es wörtlich:
 * „Bestellen ist noch nicht möglich."
 *
 * Das allein ist kein Fehler: Die Kampagnen stehen auf PAUSIERT, und der
 * Rolloutplan setzt den Bestellweg auf Tag 10–12, das Schalten auf Tag 14–15.
 * Der Fehler war, dass die Reihenfolge **nur zeitlich** dastand und nicht als
 * Bedingung. `anzeigen-schalten` stützte sich auf `upload`, `keywordmessung`
 * und `indexierung` — nicht auf `bestellweg`. Verschiebt sich eine Etappe
 * davor, laufen Anzeigen, die etwas versprechen, was die Landeseite nicht
 * kann.
 *
 * > **Die Reihenfolge stand im Plan, die Bedingung nicht — und dazwischen
 * > liegt das ganze Werbebudget.**
 *
 * Nachgemessen: Die Kopplung kostet **null Tage**. Die Kette bleibt bei 60.
 *
 * **Keine Rückrichtung.** Sonst müsste dieser Prüfer verlangen, die
 * Abhängigkeit wieder zu entfernen, sobald keine Anzeige mehr von einer
 * Bestellung spricht — und ein Shop, der bestellfähig ist, bevor er Klicks
 * kauft, ist unabhängig vom Anzeigentext die richtige Reihenfolge.
 * ------------------------------------------------------------------ */
export const BESTELLAUSSAGEN = Object.freeze([
  /\baus einer Bestellung\b/i,
  /\bin einer Lieferung\b/i,
  /\bgeliefert statt abgeholt\b/i,
  /\bjetzt bestellen\b|\bhier bestellen\b/i,
]);

/**
 * Hält die Bestellversprechen der Anzeigen gegen den Rolloutplan.
 *
 * @param {object[]} anzeigen
 * @param {object[]} etappen  aus `src/rollout.js`
 */
export function pruefeBestellversprechen(anzeigen, etappen) {
  const schalten = etappen.find((e) => e.id === 'anzeigen-schalten');
  if (!schalten) {
    return ['Der Rolloutplan kennt keine Etappe „anzeigen-schalten" — die Kopplung '
      + 'zwischen Anzeigentext und Bestellweg lässt sich nicht prüfen'];
  }
  const gestuetzt = (schalten.brauchtVor ?? []).some((b) => b.etappe === 'bestellweg');
  if (gestuetzt) return [];

  const fehler = [];
  for (const a of anzeigen) {
    for (const [k, v] of Object.entries(a)) {
      if (!/^(Überschrift|Beschreibung)/.test(k) || !v) continue;
      if (!BESTELLAUSSAGEN.some((m) => m.test(v))) continue;
      fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" verspricht eine Bestellung — `
        + 'der Rolloutplan bindet das Schalten der Kampagnen nicht an den Bestellweg');
    }
  }
  return fehler;
}

/** Woran eine Systemliste sagt, dass sie eine Schicht nicht führt. */
export const LUECKENSATZ = /f(?:ü|ue)hren wir (?:derzeit )?nicht|nicht im Sortiment|steht nicht im Katalog/i;

/**
 * @param {object[]} anzeigen
 * @param {Iterable<string>} gefuehrteEinheiten Einheitenkürzel, die im
 *   Katalog tatsächlich vorkommen. **Pflichtangabe** — eine Voreinstellung
 *   wäre die Stelle, an der ein Aufrufer die Gebindeprüfung stillschweigend
 *   überspringt, und dann prüfte sie nichts und meldete es als bestanden.
 */
export function pruefeTexte(anzeigen, gefuehrteEinheiten, gruppenMitLuecke = new Set()) {
  const fehler = [];
  if (gefuehrteEinheiten === undefined) {
    throw new Error('pruefeTexte braucht die geführten Einheiten — ohne sie prüft die Gebinderegel nichts.');
  }
  const luecken = gruppenMitLuecke instanceof Set ? gruppenMitLuecke : new Set(gruppenMitLuecke);
  const einheiten = new Set(gefuehrteEinheiten);
  for (const a of anzeigen) {
    for (const [k, v] of Object.entries(a)) {
      if (!/^(Überschrift|Beschreibung)/.test(k) || !v) continue;

      for (const wort of VORRATSWORTE) {
        if (v.toLowerCase().includes(wort.toLowerCase())) {
          fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" behauptet Vorrat — `
            + 'der Shop führt kein eigenes Lager (PARAMETER.md, Streckengeschäft)');
        }
      }

      // Eine Meldung je Feld, nicht je Muster: „Das komplette System aus
      // einer Hand" trifft zwei Muster und ist ein Satz. Ein Prüfer, der
      // denselben Satz zweimal meldet, wird nach dem Wortlaut gelesen und
      // nicht nach der Zahl.
      if (luecken.has(a.Anzeigengruppe) && VOLLSTAENDIGKEITSWORTE.some((m) => m.test(v))) {
        fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" verspricht Vollständigkeit — `
          + 'die eigene Systemliste nennt für diese Gruppe eine Schicht, die der Katalog nicht führt');
      }

      // **Preisaussagen — gegen die Zielmarge, nicht gegen eine Liste.**
      // Der Aufschlag steht in `ZIELMARGE`; ist er null, hört diese Regel von
      // selbst auf zu schlagen, und niemand muss daran denken.
      if (ZIELMARGE > 0) {
        // Eine Meldung je Feld, nicht je Muster — dieselbe Regel wie bei den
        // Vollständigkeitsworten zwölf Zeilen weiter unten.
        const pa = PREISAUSSAGEN.find((x) => x.muster.test(v));
        if (pa) {
          fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" behauptet, ${pa.was} — `
            + `der Verkaufspreis trägt ${(ZIELMARGE * 100).toFixed(0)} % Aufschlag, `
            + 'und die eigene Wissensseite „Was Baumeisterpreis heißt" sagt das auch');
        }
      }

      for (const g of GEBINDEAUSSAGEN) {
        if (!g.muster.test(v)) continue;
        if (g.behauptet && !einheiten.has(g.behauptet)) {
          fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" wirbt mit ${g.was} — `
            + 'kein Artikel des Katalogs wird so verkauft');
        }
        if (g.schliesstAus && einheiten.has(g.schliesstAus)) {
          fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" schließt ${g.was} aus — `
            + 'der Katalog führt sie sehr wohl');
        }
      }

      const letztes = v.replace(/[.,;:!?]+$/, '').split(/\s+/).at(-1)?.toLowerCase() ?? '';
      if (ENDET_NICHT_AUF.includes(letztes)) {
        fehler.push(`${a.Anzeigengruppe} · ${k}: „${v}" endet auf „${letztes}" — `
          + 'abgeschnitten statt umformuliert');
      }
    }
    for (const [k, v] of Object.entries(a)) {
      if (/^Überschrift/.test(k) && v && v.length > MAX_UEBERSCHRIFT) {
        fehler.push(`${a.Anzeigengruppe} · ${k}: ${v.length} Zeichen (max ${MAX_UEBERSCHRIFT}) — „${v}"`);
      }
      if (/^Beschreibung/.test(k) && v && v.length > MAX_BESCHREIBUNG) {
        fehler.push(`${a.Anzeigengruppe} · ${k}: ${v.length} Zeichen (max ${MAX_BESCHREIBUNG}) — „${v}"`);
      }
      if (/^Pfad/.test(k) && v && v.length > MAX_PFADTEIL) {
        fehler.push(`${a.Anzeigengruppe} · ${k}: ${v.length} Zeichen (max ${MAX_PFADTEIL})`);
      }
    }
  }
  return fehler;
}

function argZahl(name, ersatz) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return ersatz;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) ? n : ersatz;
}

function main() {
  const kaufquote = argZahl('kaufquote', 0.02);
  const tagesbudget = argZahl('budget', 10);

  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const katalogDatei = lies(join(WURZEL, 'data', 'katalog-baustoff.json'));
  const lieferantenDatei = lies(join(WURZEL, 'data', 'lieferanten.json'));
  const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');

  if (!existsSync(preisPfad)) {
    console.error('Die Preisdatei fehlt: preise/baustoff-preise.json');
    console.error('Ohne bestätigte Einkaufspreise gibt es keinen Deckungsbeitrag —');
    console.error('und ohne Deckungsbeitrag kein Gebot. Geraten wird hier nichts.');
    process.exit(2);
  }

  const katalog = ladeBaustoffkatalog(katalogDatei, lies(preisPfad), lieferantenDatei, ZIELMARGE);
  const befund = katalogbefund(katalog);
  const suchtauglich = new Set(befund.suchtauglicheSkus);
  const artikelBySku = new Map(katalog.artikel.map((a) => [a.sku, a]));

  console.log(`Katalog: ${befund.artikelGesamt} Artikel, davon ${befund.unterListe} unter Liste`);
  console.log(`Kaufquote ${(kaufquote * 100).toFixed(1)} %, Tagesbudget ${tagesbudget} €\n`);

  const gruppen = [];
  const uebersprungen = [];

  for (const [gruppe, korb] of Object.entries(WARENKOERBE)) {
    const positionen = korb.positionen
      .map((p) => ({ ...p, artikel: artikelBySku.get(p.sku) }))
      .filter((p) => p.artikel);

    const fehlend = korb.positionen.filter((p) => !artikelBySku.has(p.sku));
    if (fehlend.length) {
      uebersprungen.push({ gruppe, grund: `Artikel fehlen im Katalog: ${fehlend.map((f) => f.sku).join(', ')}` });
      continue;
    }
    const nichtTauglich = positionen.filter((p) => !suchtauglich.has(p.sku));

    // **Ein Weg zur Zahl, nicht zwei.**
    //
    // Bis zum 28. August rechnete dieses Werkzeug Warenwert, Einkauf und
    // Fracht selbst aus — dieselbe Rechnung wie `berechneWarenkorb`, nur
    // noch einmal aufgeschrieben. Am selben Tag kam im Warenkorb die
    // Untergrenze für Palette und Folierung dazu, und hier fehlte sie: Die
    // Höchstgebote hingen an einem Deckungsbeitrag, der je Gruppe um
    // 28,50 € zu hoch war.
    //
    // > **Zwei Wege zu derselben Zahl bedeuten, dass einer davon irgendwann
    // > alt ist** — und es ist immer der, den man beim Ändern vergisst.
    //
    // Der Nachbau ist deshalb weg. Was hier steht, ist derselbe Warenkorb,
    // den auch der Shop rechnet; kommt dort eine Kostenart dazu, ist sie
    // hier ohne Zutun drin.
    const warenkorb = berechneWarenkorb(korb.positionen, katalog);
    const { warenwertNetto, frachtNetto } = warenkorb;
    const traegt = traegtSichSelbst(warenkorb, { frachtVerrechnet: true });
    const maxCpc = cent(traegt.deckungsbeitragNetto * kaufquote);

    const zeile = {
      gruppe,
      text: warenkorbText(korb),
      warenwertNetto,
      frachtNetto,
      deckungsbeitragNetto: traegt.deckungsbeitragNetto,
      nebenkostenNetto: traegt.nebenkostenNetto,
      maxCpc,
      wirtschaftlich: maxCpc >= MARKT_CPC.unten,
      knapp: maxCpc >= MARKT_CPC.unten && maxCpc < MARKT_CPC.oben,
      nichtTauglich: nichtTauglich.map((p) => p.sku),
    };

    if (!traegt.traegt) {
      uebersprungen.push({ gruppe, grund: `Gate 20: Deckungsbeitrag ${traegt.deckungsbeitragNetto.toFixed(2)} €` });
      continue;
    }
    if (!zeile.wirtschaftlich) {
      uebersprungen.push({
        gruppe,
        grund: `Höchstgebot ${maxCpc.toFixed(2)} € liegt unter dem Marktpreis von ${MARKT_CPC.unten.toFixed(2)} €`,
      });
      continue;
    }
    gruppen.push(zeile);
  }

  // --- Keywords -----------------------------------------------------------
  // Zwei Quellen, bewusst getrennt: Gattungsbegriffe aus dem Fach, Markenbegriffe
  // aus dem Katalog. Beide laufen durch dieselbe Prüfung, und was durchfällt,
  // wird gemeldet statt stillschweigend übernommen.
  const keywords = [];
  const verworfeneKeywords = [];

  const nimm = (gruppe, begriff, herkunft, m) => {
    const urteil = taugtAlsKeyword(begriff);
    if (!urteil.taugt) {
      verworfeneKeywords.push({ gruppe, begriff, grund: urteil.grund, herkunft });
      return;
    }
    // Nur Phrase und exakt. Weitgehende Übereinstimmung ist bei dieser
    // Marge der teuerste Fehler, den man machen kann.
    for (const typ of ['Phrase', 'Exakt']) {
      keywords.push({
        Kampagne: `Baustoffe ${gruppe}`,
        Anzeigengruppe: gruppe,
        Keyword: begriff,
        Übereinstimmungstyp: typ,
        Herkunft: herkunft,
        Marke: m ?? '',
      });
    }
  };

  for (const g of gruppen) {
    for (const b of GATTUNGSBEGRIFFE[g.gruppe] ?? []) nimm(g.gruppe, b, 'Gattung', marke(b));

    for (const a of katalog.artikel) {
      if (a.gruppe !== g.gruppe || !suchtauglich.has(a.sku)) continue;
      const m = marke(a.bezeichnung);
      // Ohne Marke bleibt nur ein Gattungsbegriff übrig — und auf die ist
      // dieser Shop nicht konkurrenzfähig. Die stehen oben, handverlesen.
      if (!m) continue;

      const voll = suchname(a.bezeichnung);
      if (taugtAlsKeyword(voll).taugt) {
        nimm(g.gruppe, voll, 'Marke', m);
        continue;
      }
      // Zu lang als Ganzes — aber die Typkennung wird gesucht.
      const kurz = kurzform(a.bezeichnung, m);
      if (kurz && taugtAlsKeyword(kurz).taugt) {
        nimm(g.gruppe, kurz, 'Typkennung', m);
      } else {
        verworfeneKeywords.push({
          gruppe: g.gruppe,
          begriff: voll,
          grund: kurz ? `auch die Kurzform „${kurz}" taugt nicht` : 'zu lang, und keine Typkennung erkennbar',
          herkunft: 'Marke',
        });
      }
    }
  }

  const gesehen = new Set();
  const keywordsEindeutig = keywords.filter((k) => {
    const s = `${k.Anzeigengruppe}|${k.Keyword.toLowerCase()}|${k.Übereinstimmungstyp}`;
    if (gesehen.has(s)) return false;
    gesehen.add(s);
    return true;
  });

  // --- Anzeigen -----------------------------------------------------------

  // **Berichtigt am 31.08.** Hier stand die Adresse fest verdrahtet — ein
  // zweites Mal neben `bin/website.mjs`. Eine Anzeige mit veralteter Ziel-URL
  // ist der teuerste Tippfehler von allen: Sie kostet den Klick und liefert
  // eine Fehlerseite. Die Adresse kommt jetzt aus den Betreiberdaten.
  const betreiberPfad = join(WURZEL, 'data', 'betreiber.json');
  const betreiber = existsSync(betreiberPfad) ? lies(betreiberPfad) : {};
  const basis = String(betreiber.domain ?? '')
    .trim().replace(/\/+$/, '');
  if (basis === '') {
    console.error('Abbruch: data/betreiber.json nennt keine `domain` — ohne sie hätten die');
    console.error('Anzeigen keine Ziel-URL, und eine erfundene wäre teurer als keine Anzeige.');
    process.exit(2);
  }

  /**
   * Die Ortsangabe jeder Anzeige — aus `LIEFERGEBIET`, nicht von Hand.
   *
   * **Befund vom 31.08.** In den Anzeigentexten stand viermal „im
   * Mühlviertel" und einmal „im Umkreis von Linz". Beides ist nicht das
   * Liefergebiet:
   *
   *   Mühlviertel      = Perg, Urfahr-Umgebung, Freistadt **und Rohrbach**
   *   Liefergebiet     = Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz
   *
   * Die Anzeigen versprachen also einen Bezirk zu viel — Rohrbach, wo nicht
   * geliefert wird — und ließen zwei aus, Linz und Linz-Land, die zum
   * Liefergebiet gehören und nicht zum Mühlviertel. Dasselbe wie eine tote
   * Ziel-URL, nur subtiler: **Man bezahlt für Klicks, die in der Kasse
   * abgelehnt werden, und verschenkt die beiden größten Bezirke.**
   *
   * Die Gruppe Kamin trug gar keine Ortsangabe — ausgerechnet die mit dem
   * höchsten Deckungsbeitrag, in die der erste Euro Werbebudget fließen soll.
   *
   * Erzeugt statt geschrieben: Ändert sich das Liefergebiet, ändern sich die
   * Anzeigen mit. Die Kurzform hält die 30 Zeichen einer Überschrift ein, die
   * Langform nennt in der Beschreibung alle Bezirke.
   */
  const ORT_KURZ = `Lieferung ${LIEFERGEBIET.bezirke[0].name} bis ${LIEFERGEBIET.bezirke.at(-1).name}`;
  const ORT_LANG = `Geliefert wird in die Bezirke ${bezirksliste()}.`;
  if (ORT_KURZ.length > MAX_UEBERSCHRIFT) {
    console.error(`Abbruch: Die Ortsüberschrift „${ORT_KURZ}" hat ${ORT_KURZ.length} Zeichen `
      + `(max ${MAX_UEBERSCHRIFT}). Ein gekürztes Liefergebiet wäre ein falsches.`);
    process.exit(2);
  }

  /**
   * **Der erste Anlauf bekommt das Budget, nicht alle sechs Gruppen.**
   *
   * Bis zum 31.08. teilte diese Zeile `tagesbudget / gruppen.length` — zehn
   * Euro durch sechs, also 1,67 € je Gruppe und Tag. Nachgerechnet:
   *
   * |  | sechs Gruppen | konzentriert |
   * |---|---|---|
   * | Klicks/Tag je Gruppe bei 1,00 € | 1,7 | 5,0 |
   * | Klicks/Monat je Gruppe | 50 | 150 |
   * | Bestellungen bei 1 % Kaufquote | **0,5** | **1,5** |
   *
   * Bei gestreutem Budget bringt im erwarteten Fall **keine einzige Gruppe**
   * eine Bestellung im ersten Monat — und aus fünfzig Klicks ohne Bestellung
   * lässt sich die Kaufquote auch nicht schätzen. Man bezahlt für Rauschen.
   * Dasselbe Geld auf die tragenden Gruppen gelegt macht den ersten Verkauf
   * im ersten Monat rechnerisch wahrscheinlich.
   *
   * **Das Kriterium kommt aus den Parametern, nicht aus einer Meinung:** Eine
   * Gruppe gehört in den ersten Anlauf, wenn ihr Deckungsbeitrag die
   * Werbekosten auch beim **oberen** Marktklickpreis trägt — also
   * `MARKT_CPC.oben / kaufquote` je Verkauf.
   *
   * Berichtigung an mich selbst: `weg-zum-ersten-verkauf.md` hatte am selben
   * Tag „nur Kamin und Dämmung" festgelegt. Die Regel ergibt **drei** Gruppen,
   * weil WDVS bei der angenommenen Kaufquote ebenfalls trägt. Der gerechneten
   * Schwelle gebührt der Vorrang vor meiner Vorabfestlegung.
   */
  const kostenJeVerkauf = MARKT_CPC.oben / kaufquote;
  const ersterAnlauf = gruppen.filter((g) => g.deckungsbeitragNetto >= kostenJeVerkauf);
  const spaeter = gruppen.filter((g) => g.deckungsbeitragNetto < kostenJeVerkauf);
  if (ersterAnlauf.length === 0) {
    console.error(`Abbruch: Keine Gruppe trägt ${kostenJeVerkauf.toFixed(0)} € Werbekosten je Verkauf.`);
    console.error('Ein Budget auf alle zu verteilen hieße, es gleichmäßig zu verlieren.');
    process.exit(2);
  }

  const anzeigen = [];
  for (const g of ersterAnlauf) {
    const t = ANZEIGENTEXTE[g.gruppe];
    if (!t) continue;
    // **Berichtigt am 31.08.** Hier stand `${basis}/${t.pfad[0]}` — der
    // Google-**Anzeigepfad** als Ziel-URL. Der Anzeigepfad ist Zierwerk, das
    // unter der Adresse eingeblendet wird („bauversand.com/fassade/wdvs"); die
    // Seite heißt `gruppe/wdvs.html`. Alle drei Anzeigen des ersten Anlaufs
    // zeigten damit auf Seiten, die es nicht gibt — jeder Klick bezahlt und
    // auf einer Fehlerseite gelandet.
    const seite = GRUPPENSEITE[g.gruppe];
    if (!seite) {
      console.error(`Abbruch: Für die Gruppe „${g.gruppe}" gibt es keine Seitenkennung.`);
      console.error('Eine Anzeige ohne Ziel ist teurer als keine Anzeige.');
      process.exit(2);
    }
    const satz = { Kampagne: `Baustoffe ${g.gruppe}`, Anzeigengruppe: g.gruppe, Anzeigentyp: 'Responsive Suchanzeige', 'Finale URL': `${basis}/gruppe/${seite}.html` };
    // Die Ortsangabe steht in **jeder** Anzeige, an letzter Stelle, damit sie
    // keine der beworbenen Eigenschaften verdrängt.
    [...t.k, ORT_KURZ].forEach((k, i) => { satz[`Überschrift ${i + 1}`] = k; });
    [...t.b, ORT_LANG].forEach((b, i) => { satz[`Beschreibung ${i + 1}`] = b; });
    satz['Pfad 1'] = t.pfad[0];
    satz['Pfad 2'] = t.pfad[1];
    anzeigen.push(satz);
  }

  // **Geprüft wird der ganze Vorrat an Texten, nicht nur der ausgegebene.**
  //
  // Befund vom 31.08., abends: Seit das Budget mittags auf die tragenden
  // Gruppen konzentriert wurde, laufen nur noch drei Anzeigen durch diese
  // Prüfung. In der zurückgestellten Gruppe Kanal stand weiterhin „PVC Kanal
  // ab Lager" — dieselbe unwahre Vorratszusage, die am Nachmittag aus der
  // Dämmung entfernt wurde.
  //
  // Sie wäre nicht aufgefallen und am Tag der Aktivierung hinausgegangen: ein
  // Fehler mit bekanntem Auslösetag, kein latenter. Und die Blindstelle war
  // die Folge meiner eigenen Änderung — wer den Ausgabeumfang verkleinert,
  // verkleinert die Prüfung mit, wenn beide an derselben Liste hängen.
  // Die geführten Einheiten kommen aus dem Katalog, nicht aus einer Liste —
  // siehe `GEBINDEAUSSAGEN`. Damit prüft die Regel den Shop, den es gibt.
  const gefuehrteEinheiten = new Set(katalog.artikel.map((a) => a.einheit));

  // Welche Warengruppe hat laut **eigener** Systemliste eine Lücke? Gelesen
  // wird die Liste, nicht eine zweite Aufzählung daneben: Die Systemlisten
  // benennen jede Position, die der Shop nicht führt, und tun das sorgfältig
  // — alle vier tun es. Eine Anzeige derselben Gruppe darf dann keine
  // Vollständigkeit versprechen.
  const gruppenMitLuecke = new Set();
  const systemOrdner = join(WURZEL, 'inhalte', 'system');
  for (const datei of readdirSync(systemOrdner).filter((d) => d.endsWith('.md'))) {
    const text = readFileSync(join(systemOrdner, datei), 'utf8');
    const gruppe = /^gruppe:\s*(.+)$/m.exec(text)?.[1]?.trim();
    if (gruppe && LUECKENSATZ.test(text)) gruppenMitLuecke.add(gruppe);
  }

  // **Zweite Hälfte derselben Regel, 2. September.** Eine Anzeige, die keine
  // Vollständigkeit verspricht, ist nur die halbe Ehrlichkeit: Der Besucher
  // klickt und landet auf der Gruppenseite. Nennt die Systemliste eine Lücke,
  // muss **auch die Landeseite** sie nennen — sonst muss der Besucher selbst
  // bemerken, dass in der Aufzählung die Hauptsache fehlt.
  //
  // Die Gruppenseite Kamin machte es von Anfang an richtig: „das
  // Anschlussformteil der Feuerstätte steht auf der Stückliste, aber nicht im
  // Regal." WDVS und Dämmung zählten nur auf, was da ist.
  const textfehlerLandeseite = [];
  const gruppenseiten = join(WURZEL, 'inhalte', 'gruppen');
  for (const gruppe of gruppenMitLuecke) {
    const datei = readdirSync(gruppenseiten)
      .filter((d) => d.endsWith('.md'))
      .find((d) => new RegExp(`^gruppe:\\s*${gruppe}\\s*$`, 'm')
        .test(readFileSync(join(gruppenseiten, d), 'utf8')));
    if (!datei) continue;
    const text = readFileSync(join(gruppenseiten, datei), 'utf8');
    if (!LUECKENSATZ.test(text) && !/nicht im Regal/i.test(text)) {
      textfehlerLandeseite.push(`Gruppenseite ${datei}: Die Systemliste nennt für „${gruppe}" eine `
        + 'nicht geführte Position, die Landeseite nicht. Der Besucher soll es nicht selbst merken müssen.');
    }
  }

  const textfehler = [
    ...pruefeTexte(alleAnzeigentexte(), gefuehrteEinheiten, gruppenMitLuecke),
    ...pruefeTexte(anzeigen, gefuehrteEinheiten, gruppenMitLuecke),
    ...pruefeBestellversprechen(anzeigen, ETAPPEN),
    ...textfehlerLandeseite,
  ];
  if (textfehler.length) {
    // **Berichtigt am 31.08.** Hier stand „überschreiten die Längengrenzen" —
    // seit die Prüfung auch Vorratsbehauptungen und abgeschnittene Sätze
    // findet, wäre das eine falsche Überschrift über einer richtigen Liste.
    console.error('Anzeigentexte, die so nicht hinausgehen:\n');
    for (const f of textfehler) console.error(`  ${f}`);
    console.error('\nGekürzt wird hier nichts — ein abgeschnittener Anzeigentext wirbt trotzdem,');
    console.error('und eine unwahre Zusage wirbt am besten.');
    process.exit(1);
  }

  // --- Ausgabe ------------------------------------------------------------
  mkdirSync(AUSGABE, { recursive: true });

  const kampagnen = ersterAnlauf.map((g) => ({
    Kampagne: `Baustoffe ${g.gruppe}`,
    Kampagnentyp: 'Suchnetzwerk',
    Status: 'Pausiert',
    'Tagesbudget EUR': (tagesbudget / ersterAnlauf.length).toFixed(2),
    Gebotsstrategie: 'Manueller CPC',
    // Die Ausrichtung stand hier als Zeichenkette — und war damit die einzige
    // Stelle im ganzen Vorhaben, an der das regionale Liefergebiet festgelegt
    // war. Beworben und beliefert muss dieselbe Fläche sein; die Quelle ist
    // jetzt `LIEFERGEBIET`.
    Ausrichtung: `Bezirk ${bezirksliste()}`,
    Sprache: 'Deutsch',
    Werbezeit: 'Mo–Fr 06:00–18:00',
  }));

  const anzeigengruppen = ersterAnlauf.map((g) => ({
    Kampagne: `Baustoffe ${g.gruppe}`,
    Anzeigengruppe: g.gruppe,
    Status: 'Pausiert',
    'Max CPC EUR': g.maxCpc.toFixed(2),
    Referenzwarenkorb: g.text,
    'Warenwert netto EUR': g.warenwertNetto.toFixed(2),
    'Deckungsbeitrag EUR': g.deckungsbeitragNetto.toFixed(2),
  }));

  const negative = [];
  for (const [thema, woerter] of Object.entries(NEGATIVE)) {
    for (const w of woerter) negative.push({ Liste: 'Baustoffe — Ausschluss', Thema: thema, Keyword: w, Übereinstimmungstyp: 'Phrase' });
  }

  // **Gegen drei Quellen, nicht gegen eine zweite Liste** — und seit dem
  // 5. September auch gegen den **Ort des Betriebs**. Bis dahin prüfte nur
  // ein Testfall, und der kannte die fünf Bezirksnamen; „ried" wäre
  // durchgegangen, obwohl der Betrieb in Ried in der Riedmark sitzt.
  const ausschlussfehler = pruefeAusschluesse(
    negative.map((n) => n.Keyword.toLowerCase()),
    {
      bezirke: LIEFERGEBIET.bezirke.map((b) => b.name),
      ort: betreiber.ort ?? '',
      keywords: keywordsEindeutig.map((k) => k.Keyword),
    },
  );

  const schreibe = (name, inhalt) => {
    writeFileSync(join(AUSGABE, name), inhalt, 'utf8');
    console.log(`  ${name}`);
  };

  console.log('Geschrieben nach shop/ausgabe/kampagne/:');
  schreibe('kampagnen.csv', csv(Object.keys(kampagnen[0]), kampagnen));
  schreibe('anzeigengruppen.csv', csv(Object.keys(anzeigengruppen[0]), anzeigengruppen));
  // Auch die Keywords folgen dem ersten Anlauf: Ein Keyword ohne Anzeigengruppe
  // lädt nicht, und eines für eine Gruppe ohne Budget wirbt nicht.
  const imAnlauf = new Set(ersterAnlauf.map((g) => g.gruppe));
  const keywordsAnlauf = keywordsEindeutig.filter((k) => imAnlauf.has(k.Anzeigengruppe));

  // **Jedes Keyword gegen seine eigene Landeseite.** Siehe `ungedeckteWoerter`.
  // Fehlt die gebaute Seite, wird nicht geraten, sondern abgebrochen: Eine
  // Deckungsprüfung ohne Seite prüft nichts und meldete es als bestanden.
  const seitentexte = new Map();
  for (const g of ersterAnlauf) {
    const datei = join(WURZEL, 'ausgabe', 'site', 'gruppe', `${GRUPPENSEITE[g.gruppe]}.html`);
    if (!existsSync(datei)) {
      console.error(`Abbruch: Die Landeseite ${datei} ist nicht gebaut.`);
      console.error('Ohne sie lässt sich nicht prüfen, ob die Anzeige verspricht, was die Seite sagt.');
      console.error('Erst `npm run website`, dann `npm run kampagne`.');
      process.exit(2);
    }
    const text = hauptbereichText(readFileSync(datei, 'utf8'));
    if (text === null) {
      console.error(`Abbruch: ${datei} hat keinen Hauptbereich — die Seite ist unvollständig gebaut.`);
      process.exit(2);
    }
    seitentexte.set(g.gruppe, text);
  }

  const ohneDeckung = [];
  const keywordsGedeckt = keywordsAnlauf.filter((k) => {
    const fehlt = ungedeckteWoerter(k.Keyword, seitentexte.get(k.Anzeigengruppe));
    if (fehlt.length === 0) return true;
    ohneDeckung.push({
      Anzeigengruppe: k.Anzeigengruppe,
      Keyword: k.Keyword,
      Herkunft: k.Herkunft,
      Landeseite: `gruppe/${GRUPPENSEITE[k.Anzeigengruppe]}.html`,
      'Fehlende Wörter': fehlt.join(' '),
    });
    return false;
  });

  schreibe('keywords.csv', csv(['Kampagne', 'Anzeigengruppe', 'Keyword', 'Übereinstimmungstyp', 'Herkunft', 'Marke'], keywordsGedeckt));
  schreibe('keywords-ohne-deckung.csv', csv(
    ['Anzeigengruppe', 'Keyword', 'Herkunft', 'Landeseite', 'Fehlende Wörter'], ohneDeckung));
  schreibe('negative-keywords.csv', csv(['Liste', 'Thema', 'Keyword', 'Übereinstimmungstyp'], negative));

  // **Zurückgestellt, nicht verworfen.** Die schwachen Gruppen kommen dazu,
  // sobald eine gemessene Kaufquote vorliegt — dann verschiebt sich die
  // Schwelle, und die Rechnung entscheidet neu. Sie stehen in einer eigenen
  // Datei, damit niemand sie versehentlich mit hochlädt und das Budget wieder
  // streut.
  schreibe('spaeter-pruefen.csv', csv(
    ['Gruppe', 'Deckungsbeitrag EUR', 'max. Klick EUR', 'Werbekosten je Verkauf EUR', 'Grund'],
    spaeter.map((g) => ({
      Gruppe: g.gruppe,
      'Deckungsbeitrag EUR': g.deckungsbeitragNetto.toFixed(2),
      'max. Klick EUR': g.maxCpc.toFixed(2),
      'Werbekosten je Verkauf EUR': kostenJeVerkauf.toFixed(2),
      Grund: `Deckungsbeitrag trägt die Werbekosten beim oberen Marktklickpreis nicht — `
        + `wartet auf eine gemessene Kaufquote (angenommen: ${(kaufquote * 100).toFixed(1)} %)`,
    })),
  ));
  const anzeigenKopf = [...new Set(anzeigen.flatMap((a) => Object.keys(a)))];
  schreibe('anzeigen.csv', csv(anzeigenKopf, anzeigen));

  // --- Bericht ------------------------------------------------------------
  console.log('\nAnzeigengruppen und ihre Höchstgebote:\n');
  console.log('  Gruppe        Warenkorb      DB        max. Klick   Markt 0,50–2,50 €');
  for (const g of gruppen) {
    const lage = g.maxCpc >= MARKT_CPC.oben ? 'trägt mit Abstand' : 'knapp — beobachten';
    console.log(
      `  ${g.gruppe.padEnd(12)} ${g.warenwertNetto.toFixed(2).padStart(9)} € ${g.deckungsbeitragNetto.toFixed(2).padStart(8)} € ${g.maxCpc.toFixed(2).padStart(8)} €   ${lage}`,
    );
  }

  console.log(`\nErster Anlauf — diese Gruppen bekommen das Budget (${(tagesbudget / ersterAnlauf.length).toFixed(2)} € je Gruppe und Tag):`);
  for (const g of ersterAnlauf) console.log(`  ${g.gruppe}`);
  if (spaeter.length) {
    console.log(`\nZurückgestellt in spaeter-pruefen.csv — tragen ${kostenJeVerkauf.toFixed(0)} € Werbekosten je Verkauf nicht:`);
    for (const g of spaeter) console.log(`  ${g.gruppe.padEnd(12)} Deckungsbeitrag ${g.deckungsbeitragNetto.toFixed(2)} €`);
    console.log('  Das Budget zu streuen hieße, es gleichmäßig zu verlieren.');
  }

  if (uebersprungen.length) {
    console.log('\nNicht ausgegeben:');
    for (const u of uebersprungen) console.log(`  ${u.gruppe.padEnd(12)} ${u.grund}`);
  }

  const beipack = befund.nurBeipackSkus.map((s) => artikelBySku.get(s).bezeichnung);
  if (beipack.length) {
    console.log('\nBewusst ohne Anzeigen (Verkaufspreis am Listendeckel — Beipack, kein Suchartikel):');
    for (const b of beipack) console.log(`  ${b}`);
  }

  if (verworfeneKeywords.length) {
    console.log('\nAls Keyword verworfen — eine Bezeichnung ist kein Suchbegriff:');
    for (const v of verworfeneKeywords) {
      console.log(`  ${v.gruppe.padEnd(10)} „${v.begriff}" — ${v.grund}`);
    }
  }

  const jeHerkunft = keywordsEindeutig.reduce((m, k) => ({ ...m, [k.Herkunft]: (m[k.Herkunft] ?? 0) + 1 }), {});
  console.log(`\nKeywords: ${keywordsEindeutig.length} (${Object.entries(jeHerkunft).map(([h, n]) => `${n} ${h}`).join(', ')})`);
  if (ohneDeckung.length) {
    const versch = new Set(ohneDeckung.map((k) => `${k.Anzeigengruppe}|${k.Keyword}`)).size;
    console.log(`\nZurückgehalten — die Landeseite sagt das Wort nicht (keywords-ohne-deckung.csv): ${versch}`);
    const gezeigt = new Set();
    for (const k of ohneDeckung) {
      const s = `${k.Anzeigengruppe}|${k.Keyword}`;
      if (gezeigt.has(s)) continue;
      gezeigt.add(s);
      console.log(`  ${k.Anzeigengruppe.padEnd(10)} „${k.Keyword}" — fehlt: ${k['Fehlende Wörter']}`);
    }
    console.log('  Zwei richtige Auswege: das Wort gehört auf die Seite, oder das Keyword gehört weg.');
  }
  if (ausschlussfehler.length) {
    console.log('\n  ✗ Die Ausschlussliste trifft, was sie nicht treffen darf:');
    for (const f of ausschlussfehler) console.log(`      ${f}`);
    console.log('\nEin Ausschluss, der eigene Ware oder das eigene Gebiet trifft, ist teurer');
    console.log('als kein Ausschluss — er kostet nicht Klicks, sondern Bestellungen.');
    process.exit(1);
  }
  console.log(`Ausschlüsse: ${negative.length} | Anzeigen: ${anzeigen.length}`);
  console.log('\nAlle Kampagnen stehen auf PAUSIERT. Das Schalten löst Ausgaben aus');
  console.log('und ist Sache des Auftraggebers.');
}

// Nur ausführen, wenn direkt aufgerufen. Die Testdatei importiert die reinen
// Funktionen aus dieser Datei; ohne diesen Riegel schriebe jeder Testlauf
// nebenbei die Kampagnendateien neu — eine Nebenwirkung, die man erst
// bemerkt, wenn sie einmal etwas überschreibt, das man behalten wollte.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
