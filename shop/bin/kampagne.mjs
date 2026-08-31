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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { bezirksliste } from '../src/liefergebiet.js';
import { ladeBaustoffkatalog, katalogbefund, ZIELMARGE } from '../src/baustoffkatalog.js';
import { cent } from '../src/preis.js';
import { traegtSichSelbst } from '../src/kostenbild.js';
import { berechneWarenkorb } from '../src/warenkorb.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
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
export const WARENKOERBE = {
  WDVS: {
    text: '100 m² Wärmedämmverbundsystem: Kleber, Gewebe, Dübel, Putzgrund, Oberputz',
    positionen: [
      { sku: 'POS-11283', menge: 500 },   // Klebe- und Spachtelmasse, kg
      { sku: 'POS-50509', menge: 110 },   // Glasgewebe, m²
      { sku: 'POS-11082', menge: 6 },     // Universaldübel, Karton
      { sku: 'POS-13728', menge: 25 },    // Putzgrund, kg
      { sku: 'POS-53402', menge: 40 },    // Kantenschutz, lfm
    ],
  },
  'Dämmung': {
    text: '100 m² Perimeterdämmung XPS 80 mm',
    positionen: [{ sku: 'POS-12575', menge: 100 }],
  },
  Kamin: {
    text: 'Ein Kaminzug, Fertigfuß bis Regenhaube',
    positionen: [
      { sku: 'POS-10837', menge: 13 },    // Mantelstein
      { sku: 'POS-12476', menge: 4 },     // gedämmtes Rohr
      { sku: 'POS-12472', menge: 1 },     // Fertigfußpaket
      { sku: 'POS-12467', menge: 1 },     // Putztüranschluss
      { sku: 'POS-51875', menge: 1 },     // Regenhaube
    ],
  },
  Kanal: {
    text: '30 lfm Kanal DN 100 mit Formteilen und Schacht',
    positionen: [
      { sku: 'POS-10095', menge: 30 },
      { sku: 'POS-10115', menge: 4 },
      { sku: 'POS-10134', menge: 3 },
      { sku: 'POS-11133', menge: 1 },
    ],
  },
  'Mörtel': {
    text: 'Eine Palette Mörtel',
    positionen: [{ sku: 'POS-13550', menge: 40 }],
  },
  Mauerwerk: {
    text: 'Eine Palette Planziegel',
    positionen: [{ sku: 'POS-29728', menge: 128 }],
  },
};

/**
 * Marken, die im Artikelnamen vorkommen. Sie tragen die Kampagne: Auf
 * Gattungsbegriffe („Dämmplatte") gewinnt die Baumarkt-Eigenmarke, auf
 * Markenbegriffe („Capatect 186 M") vergleicht der Kunde Gleiches mit Gleichem.
 */
const MARKEN = ['Capatect', 'Baumit', 'Soudal', 'Isover', 'Schiedel', 'SIKM', 'SIK', 'Ravenit', 'SunCore', 'Ökotherm', 'Prima'];

/** Ausschlussliste. Jeder Klick, der nicht zur Baustelle führt, ist verloren. */
const NEGATIVE = {
  'Preis und Menge': ['günstig', 'billig', 'gebraucht', 'restposten', 'einzeln', 'einzelsack', 'kleinmenge', 'muster', 'probe', 'reststück'],
  Wettbewerb: ['baumarkt', 'obi', 'hornbach', 'bauhaus', 'lagerhaus', 'hagebau', 'amazon', 'willhaben'],
  'Suche ohne Kaufabsicht': ['anleitung', 'wie', 'video', 'youtube', 'erfahrung', 'test', 'vergleich', 'berechnen', 'rechner', 'wikipedia', 'was ist'],
  'Falsche Absicht': ['job', 'jobs', 'lehre', 'gehalt', 'praktikum', 'miete', 'mieten', 'leihen', 'verleih', 'entsorgung', 'entsorgen', 'reparatur'],
};

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
    'Fassadendübel', 'Putzgrund Fassade', 'WDVS System kaufen', 'Fassadendämmung Material',
  ],
  'Dämmung': [
    'XPS Platten kaufen', 'XPS 80 mm', 'XPS 100 mm', 'Perimeterdämmung XPS',
    'EPS Fassadenplatten', 'Dämmplatten palettenweise', 'XPS Palette', 'Perimeterdämmung druckfest',
  ],
  Kamin: [
    'Schiedel Kamin', 'Kaminsystem einzügig', 'Mantelstein Kamin', 'Kaminrohr gedämmt',
    'Kamin Fertigfuß', 'Kaminkopf Regenhaube', 'Schornstein Bausatz',
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
function pruefeTexte(anzeigen) {
  const fehler = [];
  for (const a of anzeigen) {
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
      text: korb.text,
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
  const ANZEIGENTEXTE = {
    WDVS: {
      k: ['WDVS zum Baumeisterpreis', 'Capatect und Baumit', 'Fassade komplett liefern', 'Kleber, Gewebe, Dübel', 'Vom Baumeister, nicht vom', 'Systemware auf Palette', 'Lieferung ins Mühlviertel'],
      b: ['Das komplette Fassadensystem aus einer Hand — geliefert auf die Baustelle.', 'Kleber, Gewebe, Dübel, Putzgrund. Was zusammengehört, kommt zusammen.', 'Ein Baumeister kauft ein, Sie zahlen seinen Preis. Regionale Lieferung.'],
      pfad: ['fassade', 'wdvs'],
    },
    'Dämmung': {
      k: ['XPS und EPS ab Lager', 'Perimeterdämmung 80 mm', 'Dämmplatten palettenweise', 'Baumeisterpreis auf XPS', 'Dämmung auf die Baustelle', 'Kein Baumarktpreis', 'XPS 30 bis 100 mm'],
      b: ['XPS und EPS in allen gängigen Stärken, palettenweise auf die Baustelle.', 'Perimeter- und Fassadendämmung zum Preis, den ein Baumeister zahlt.', 'Ganze Paletten statt Einzelplatten. Lieferung im Umkreis von Linz.'],
      pfad: ['daemmung', 'xps'],
    },
    Kamin: {
      k: ['Schiedel Kaminsystem', 'Kaminzug komplett', 'Mantelstein und Rohr', 'Vom Fertigfuß zur Haube', 'Kamin auf die Baustelle', 'SIKM Systemteile', 'Kamin zum Baumeisterpreis'],
      b: ['Der ganze Zug: Fertigfuß, Mantelsteine, gedämmtes Rohr, Putztür, Haube.', 'Schiedel-Systemteile aus einer Bestellung, geliefert statt abgeholt.', 'Was beim Kamin fehlt, hält die Baustelle auf. Deshalb komplett.'],
      pfad: ['kamin', 'schiedel'],
    },
    Kanal: {
      k: ['Kanalrohr DN 100', 'Rohr, Bogen, Abzweig', 'Kanal komplett liefern', 'PVC Kanal ab Lager', 'Schacht und Formteile', 'Kanal zum Baumeisterpreis', 'Erdbau im Mühlviertel'],
      b: ['Kanalrohr, Bögen, Abzweiger und Schacht — abgestimmt und komplett.', 'PVC-Kanal DN 100 mit allen Formteilen. Lieferung auf die Baustelle.', 'Ein Bogen zu wenig kostet einen halben Tag. Deshalb liefern wir das Set.'],
      pfad: ['kanal', 'dn100'],
    },
    'Mörtel': {
      k: ['Mörtel palettenweise', 'Baumit ThermoMörtel', 'Mörtel auf die Baustelle', 'Baumeisterpreis auf Mörtel', 'Ganze Paletten', 'Mörtel im Mühlviertel', 'Kein Sackverkauf'],
      b: ['Baumit-Mörtel palettenweise, geliefert auf die Baustelle.', 'Wir liefern Paletten, keine Einzelsäcke — das ist der ganze Preisvorteil.', 'Mörtel zum Preis, den ein Baumeister im Einkauf zahlt.'],
      pfad: ['moertel', 'palette'],
    },
    Mauerwerk: {
      k: ['Planziegel ab Palette', 'Ökotherm Hochlochziegel', 'Ziegel auf die Baustelle', 'Baumeisterpreis auf Ziegel', 'Mauerwerk komplett', 'Ziegel im Mühlviertel', 'Palettenweise liefern'],
      b: ['Planziegel palettenweise, geliefert und mit Kran entladen.', 'Mauerwerk zum Baumeisterpreis. Regionale Lieferung, keine Kleinmengen.', 'Ganze Paletten auf die Baustelle statt Stückware aus dem Baumarkt.'],
      pfad: ['ziegel', 'mauerwerk'],
    },
  };

  // **Berichtigt am 31.08.** Hier stand die Adresse fest verdrahtet — ein
  // zweites Mal neben `bin/website.mjs`. Eine Anzeige mit veralteter Ziel-URL
  // ist der teuerste Tippfehler von allen: Sie kostet den Klick und liefert
  // eine Fehlerseite. Die Adresse kommt jetzt aus den Betreiberdaten.
  const betreiberPfad = join(WURZEL, 'data', 'betreiber.json');
  const basis = String((existsSync(betreiberPfad) ? lies(betreiberPfad) : {}).domain ?? '')
    .trim().replace(/\/+$/, '');
  if (basis === '') {
    console.error('Abbruch: data/betreiber.json nennt keine `domain` — ohne sie hätten die');
    console.error('Anzeigen keine Ziel-URL, und eine erfundene wäre teurer als keine Anzeige.');
    process.exit(2);
  }

  const anzeigen = [];
  for (const g of gruppen) {
    const t = ANZEIGENTEXTE[g.gruppe];
    if (!t) continue;
    const satz = { Kampagne: `Baustoffe ${g.gruppe}`, Anzeigengruppe: g.gruppe, Anzeigentyp: 'Responsive Suchanzeige', 'Finale URL': `${basis}/${t.pfad[0]}` };
    t.k.forEach((k, i) => { satz[`Überschrift ${i + 1}`] = k; });
    t.b.forEach((b, i) => { satz[`Beschreibung ${i + 1}`] = b; });
    satz['Pfad 1'] = t.pfad[0];
    satz['Pfad 2'] = t.pfad[1];
    anzeigen.push(satz);
  }

  const textfehler = pruefeTexte(anzeigen);
  if (textfehler.length) {
    console.error('Anzeigentexte überschreiten die Längengrenzen von Google Ads:\n');
    for (const f of textfehler) console.error(`  ${f}`);
    console.error('\nGekürzt wird hier nichts — ein abgeschnittener Anzeigentext wirbt trotzdem.');
    process.exit(1);
  }

  // --- Ausgabe ------------------------------------------------------------
  mkdirSync(AUSGABE, { recursive: true });

  const kampagnen = gruppen.map((g) => ({
    Kampagne: `Baustoffe ${g.gruppe}`,
    Kampagnentyp: 'Suchnetzwerk',
    Status: 'Pausiert',
    'Tagesbudget EUR': (tagesbudget / gruppen.length).toFixed(2),
    Gebotsstrategie: 'Manueller CPC',
    // Die Ausrichtung stand hier als Zeichenkette — und war damit die einzige
    // Stelle im ganzen Vorhaben, an der das regionale Liefergebiet festgelegt
    // war. Beworben und beliefert muss dieselbe Fläche sein; die Quelle ist
    // jetzt `LIEFERGEBIET`.
    Ausrichtung: `Bezirk ${bezirksliste()}`,
    Sprache: 'Deutsch',
    Werbezeit: 'Mo–Fr 06:00–18:00',
  }));

  const anzeigengruppen = gruppen.map((g) => ({
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

  const schreibe = (name, inhalt) => {
    writeFileSync(join(AUSGABE, name), inhalt, 'utf8');
    console.log(`  ${name}`);
  };

  console.log('Geschrieben nach shop/ausgabe/kampagne/:');
  schreibe('kampagnen.csv', csv(Object.keys(kampagnen[0]), kampagnen));
  schreibe('anzeigengruppen.csv', csv(Object.keys(anzeigengruppen[0]), anzeigengruppen));
  schreibe('keywords.csv', csv(['Kampagne', 'Anzeigengruppe', 'Keyword', 'Übereinstimmungstyp', 'Herkunft', 'Marke'], keywordsEindeutig));
  schreibe('negative-keywords.csv', csv(['Liste', 'Thema', 'Keyword', 'Übereinstimmungstyp'], negative));
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
