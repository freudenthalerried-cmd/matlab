/**
 * Die Gebindegröße aus der Artikelbezeichnung — und was ein Kilogramm kostet.
 *
 * **Der Anlass, 29. August 2026.** Zwei Artikel desselben Sortiments, beide
 * „25 kg" im Namen:
 *
 * | Artikel | Preis | Einheit |
 * |---|---|---|
 * | Capatect Putzgrund weiß 25 kg | 2,77 € | **je kg** |
 * | Baumit KlebeSpachtel 25 kg | 14,32 € | **je Sack** |
 *
 * Beide Angaben sind richtig und überall sauber beschriftet — auf der Karte,
 * auf der Artikelseite, im Mengenfeld. Trotzdem kann ein Kunde sie nicht
 * vergleichen: Der eine Sack kostet 69,25 €, der andere 14,32 €, und das
 * steht nirgends. Wer eine Zahl dreimal richtig beschriftet, hat noch keine
 * vergleichbare Zahl geliefert.
 *
 * Diese Datei liefert die fehlende: die Gebindegröße aus dem Namen und daraus
 * **beide** Preise — je Gebinde und je Kilogramm. Dasselbe Muster wie die
 * Vergleichstafel der Dämmgruppe („Was ein Zentimeter Stärke kostet").
 *
 * **Die Regel aus dem Plattenfehler gilt hier genauso.** „Die erste Zahl mit
 * `mm` ist nicht die Stärke, sondern die erste Zahl mit `mm`" — und die erste
 * Zahl mit `kg` ist nicht immer die Gebindegröße. Deshalb:
 *
 * - **Nur eine einzige** Zahl mit `kg` im Namen. „Isover … 8,64 m2" hat gar
 *   keine, „Fugenmasse FM 1,5 kg" genau eine. Kämen zwei vor, wüsste diese
 *   Funktion nicht, welche das Gebinde ist — und gibt `null` zurück.
 * - **Plausibilitätsgrenzen**: unter 0,1 kg und über 50 kg ist kein Gebinde
 *   dieses Sortiments. Die Zahl meint dann etwas anderes.
 * - **Liter sind kein Gewicht.** „Baumit ThermoMörtel 50 40 l" und „Soudal
 *   Perimeterkleber B3 750 ml" tragen ein Volumen; daraus ein Kilogramm zu
 *   rechnen hieße, eine Dichte zu erfinden. Sie bekommen kein Kilopreis, und
 *   die Seite sagt das, statt zu schätzen.
 */

/** Was als Gebinde in Frage kommt, in Kilogramm. */
export const KLEINSTES_GEBINDE_KG = 0.1;
export const GROESSTES_GEBINDE_KG = 50;

import { EINHEITEN } from './format.js';

const zahl = (roh) => Number(String(roh).replace(',', '.'));

/**
 * Die Gebindegröße in Kilogramm, oder `null`.
 *
 * @param {string} bezeichnung
 * @returns {number|null}
 */
export function gebindeKg(bezeichnung) {
  const t = String(bezeichnung ?? '');
  // `(?![\p{L}\d])` statt `\b`: `\b` ist in JavaScript an ASCII gebunden und
  // trennt vor einem Umlaut. Derselbe Grund wie bei `marke()` und `bauform()`.
  const treffer = [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*kg(?![\p{L}\d])/giu)];
  if (treffer.length !== 1) return null;
  const kg = zahl(treffer[0][1]);
  if (!Number.isFinite(kg)) return null;
  if (kg < KLEINSTES_GEBINDE_KG || kg > GROESSTES_GEBINDE_KG) return null;
  return kg;
}

/**
 * Ist das eine bestellbare Menge?
 *
 * **Berichtigt am 29.08.**, und am selben Tag hierher gezogen: Die Regel stand
 * in `warenkorb.js` und zwang damit das ganze Modul samt `preis.js` ins
 * Browserbündel — für eine Funktion von vier Zeilen. Sie gehört ohnehin
 * hierher, zu den Gebindegrößen. Hier stand `Number.isInteger`. Für Stückgut ist
 * das richtig — für Flächenware nicht: `XPS glatt SF 30 mm 0,75 m2` wird in
 * Platten zu 0,75 m² abgegeben, und eine Bestellung über vier Platten sind
 * **3,00 m²**, über fünf **3,75 m²**. Ganzzahlige Quadratmeter sind bei
 * dieser Platte gerade *nicht* lieferbar; die alte Regel erlaubte
 * ausschließlich unlieferbare Mengen.
 *
 * Zugelassen ist deshalb jede positive Zahl mit höchstens zwei
 * Nachkommastellen. Zwei, weil das die Genauigkeit ist, in der Gebinde
 * aufgehen (0,5 · 0,75 · 8,64 · 25) und in der eine Rechnung stellbar ist.
 * Was darüber hinausgeht, ist keine Menge, sondern ein Tippfehler.
 */
export function istMenge(menge) {
  if (typeof menge !== 'number' || !Number.isFinite(menge) || menge <= 0) return false;
  return Math.abs(Math.round(menge * 100) - menge * 100) < 1e-9;
}

/** Was als Flächengebinde in Frage kommt, in Quadratmetern. */
export const KLEINSTES_GEBINDE_M2 = 0.1;
export const GROESSTES_GEBINDE_M2 = 200;

/**
 * Die Gebindegröße in Quadratmetern, oder `null`.
 *
 * Dieselbe Vorsicht wie bei `gebindeKg`, und eine zusätzliche: Gesucht wird
 * ausschließlich ein ausdrückliches `m2`/`m²`. „Grundmauerschutz 20 **1,5 m**"
 * und „Baumit TextilglasGitter **1,1x50 m**" tragen Meter, keine
 * Quadratmeter — die eine Zahl ist eine Bahnbreite, die andere ein
 * Rollenmaß. Aus ihnen eine Fläche zu rechnen hieße, die zweite Kante zu
 * erfinden. Beide bekommen deshalb nichts, obwohl gerade die 1,1 × 50 m
 * rechnerisch 55 m² wären: **Was die Bezeichnung nicht sagt, sagt sie
 * nicht.**
 */
export function gebindeM2(bezeichnung) {
  const t = String(bezeichnung ?? '');
  const treffer = [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*m[2²](?![\p{L}\d])/giu)];
  if (treffer.length === 1) {
    const m2 = zahl(treffer[0][1]);
    if (!Number.isFinite(m2)) return null;
    if (m2 < KLEINSTES_GEBINDE_M2 || m2 > GROESSTES_GEBINDE_M2) return null;
    return m2;
  }
  if (treffer.length > 1) return null;
  return rollenmass(t);
}

/**
 * Die Rollenfläche aus einem ausgeschriebenen Maß — „1,1x50 m".
 *
 * **Der Anlass, 2. September 2026.** Die Wegprobe hat den ersten Knopf der
 * WDVS-Gruppenseite gedrückt und im fertigen Anfragetext stand:
 *
 * ```
 * 1 m²   Baumit TextilglasGitter 1,1x50 m   POS-52058   1,19 €   1,19 €
 * ```
 *
 * Ein Quadratmeter von einer Rolle, die 1,1 mal 50 Meter misst. Der Kunde
 * hätte 1,19 € Ware und 75,50 € Zustellung angefragt; der Deckungsbeitrag
 * einer solchen Position trägt nichts, und kommissionieren lässt sie sich
 * auch nicht — man schneidet keinen Quadratmeter aus einer Rolle.
 *
 * **Das ist keine Schätzung, sondern eine Multiplikation zweier genannter
 * Zahlen.** Genau darin unterscheidet sich dieser Fall von „Grundmauerschutz
 * 20 1,5 m": Dort stehen zwei Zahlen **ohne** Malzeichen nebeneinander, und
 * ob das 20 Meter mal 1,5 Meter heißt oder etwas anderes, weiß der Name
 * nicht. Diese Funktion rechnet nur, wo ein `x` oder `×` zwischen den Zahlen
 * steht. Was ohne Malzeichen dasteht, bleibt offen und ist eine Frage an den
 * Lieferanten — sie ist in der Artikelliste mit Verpackungseinheit schon
 * gestellt.
 *
 * > **Zwei Zahlen mit einem Malzeichen sind ein Maß. Zwei Zahlen ohne eines
 * > sind zwei Zahlen.**
 *
 * Gerundet wird auf zwei Nachkommastellen — `1,1 * 50` ergibt in
 * Gleitkommaarithmetik 55,00000000000001, und diese Zahl wäre als
 * Mengenschritt weder eine Menge im Sinn von `istMenge()` noch eine, die
 * jemand liest.
 */
export function rollenmass(bezeichnung) {
  const t = String(bezeichnung ?? '');
  const treffer = [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m(?![\p{L}\d²2])/giu)];
  if (treffer.length !== 1) return null;
  const breite = zahl(treffer[0][1]);
  const laenge = zahl(treffer[0][2]);
  if (!Number.isFinite(breite) || !Number.isFinite(laenge)) return null;
  const m2 = Math.round(breite * laenge * 100) / 100;
  if (m2 < KLEINSTES_GEBINDE_M2 || m2 > GROESSTES_GEBINDE_M2) return null;
  return m2;
}

export const KLEINSTES_GEBINDE_LFM = 0.1;
export const GROESSTES_GEBINDE_LFM = 100;

/**
 * Die Gebindelänge in laufenden Metern, oder `null`.
 *
 * **Der Anlass, 30.08.** Zwei Artikel im Bestand werden je laufendem Meter
 * fakturiert und kommen doch nur in fester Länge:
 *
 *   `Capatect Gewebeanschlussleiste 3D Universal Plus 2,55 m`  (LFM)
 *   `Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,5 m`  (LFM)
 *
 * Das Mengenfeld bot beliebige Meter an. Vier laufende Meter Leiste gibt es
 * nicht — es gibt zwei Stangen zu 2,55 m. Dieselbe Bestellung, die niemand
 * kommissionieren kann, wie beim 25-kg-Sack; nur eine Einheit weiter.
 *
 * Dieselbe Vorsicht wie bei `gebindeM2`, und dieselbe Grenze: Gesucht wird ein
 * blankes `m` — nicht `m2`, nicht `m²`, nicht `mm`, nicht `cm`. Der
 * Kantenschutz führt „11,5 13,5 **cm** 2,5 **m**" und darf nur die zweite
 * Zahl hergeben; das Klebeband „48 **mm** x 50 m" gehört gar nicht hierher,
 * weil es je Stück verkauft wird. Mehr als ein Treffer heißt: Die Bezeichnung
 * nennt ein Maß, keine Länge. Dann gibt es nichts.
 */
export function gebindeLfm(bezeichnung) {
  const t = String(bezeichnung ?? '');
  const treffer = [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*m(?![\p{L}\d²])/giu)];
  if (treffer.length !== 1) return null;
  const m = zahl(treffer[0][1]);
  if (!Number.isFinite(m)) return null;
  if (m < KLEINSTES_GEBINDE_LFM || m > GROESSTES_GEBINDE_LFM) return null;
  return m;
}

/**
 * Einheiten, die eine Stückzahl meinen — bei ihnen ist der Preis der
 * Gebindepreis und `gewichtKg` das Gewicht **einer Packung**.
 *
 * **Berichtigt am 5. September.** Hier standen `PAK`, `KAR` und `ROL` — drei
 * Kürzel, die im Katalog **nicht vorkommen** —, und es fehlten `KRT`
 * (3 Artikel), `DOS` (2) und `RLL` (1), die vorkommen. Die Liste war eine
 * plausible Erfindung, keine Ablesung.
 *
 * Der Schaden war bis heute keiner: `preisJeKilo` braucht **beides**, die
 * Einheit und ein Kilogramm im Namen, und keiner der sechs Artikel trägt eines.
 * Der Fehler war blind, nicht folgenlos — er wäre mit dem ersten Karton
 * aufgewacht, dessen Name ein Gewicht nennt.
 *
 * > **Eine Liste, die den Bestand von gestern festhält.** Der Satz steht seit
 * > dem 30. August dreißig Zeilen weiter unten über `GEBINDELESER` — dort
 * > wurde die Lehre gezogen und die Zuordnung an eine Stelle geholt. Diese
 * > Menge daneben blieb, wie sie war.
 *
 * `einheitenbefund` hält sie seither gegen den Katalog, in beide Richtungen.
 */
export const STUECKEINHEITEN = new Set(['SCK', 'STK', 'EIM', 'KRT', 'DOS', 'RLL']);

/**
 * Beide Preise zu einem Artikel — je Gebinde und je Kilogramm.
 *
 * Zwei Fälle, und beide kommen im Bestand vor:
 *
 * | Einheit im Katalog | bekannt | gerechnet |
 * |---|---|---|
 * | `KG` | Kilopreis | Gebindepreis = Kilopreis × Gebinde |
 * | `SCK`, `STK`, … | Gebindepreis | Kilopreis = Gebindepreis ÷ Gebinde |
 *
 * @param {{bezeichnung: string, einheit: string, vkNetto: number}} artikel
 * @returns {{gebindeKg: number, jeKgNetto: number, jeGebindeNetto: number,
 *            grundlage: 'kilopreis'|'gebindepreis'} | null}
 */
export function preisJeKilo(artikel) {
  if (!artikel || typeof artikel.vkNetto !== 'number' || !(artikel.vkNetto > 0)) return null;
  const kg = gebindeKg(artikel.bezeichnung);
  if (kg === null) return null;

  const einheit = String(artikel.einheit ?? '').toUpperCase();
  const runde = (n) => Math.round(n * 100) / 100;

  if (einheit === 'KG') {
    return {
      gebindeKg: kg,
      jeKgNetto: runde(artikel.vkNetto),
      jeGebindeNetto: runde(artikel.vkNetto * kg),
      grundlage: 'kilopreis',
    };
  }
  if (STUECKEINHEITEN.has(einheit)) {
    return {
      gebindeKg: kg,
      jeKgNetto: runde(artikel.vkNetto / kg),
      jeGebindeNetto: runde(artikel.vkNetto),
      grundlage: 'gebindepreis',
    };
  }
  // Quadratmeter, laufende Meter, Liter: Der Preis bezieht sich auf etwas
  // anderes als auf das Gebinde. Eine Umrechnung wäre geraten.
  return null;
}

/**
 * Der Mengenschritt eines Artikels — in welchen Portionen er abgegeben wird.
 *
 * **Der Anlass.** Das Mengenfeld stand auf jedem Artikel gleich: `min="1"`,
 * `value="1"`. Bei `Capatect Putzgrund weiß 25 kg`, Einheit `KG`, heißt das:
 * Der Kunde legt **ein Kilogramm** in den Korb. Ein Kilogramm eines
 * 25-kg-Gebindes gibt es nicht; die Bestellung wäre nicht lieferbar, und
 * gemerkt hätte es niemand vor dem Kommissionieren.
 *
 * Dasselbe Muster wie beim Materialbedarf der Radonfolien: „Wer 140 m²
 * braucht und Rollen zu 37,5 m² kauft, zahlt Verschnitt — und erfährt das
 * heute erst an der Kasse." Hier ist es kein Verschnitt, sondern eine Menge,
 * die es gar nicht gibt.
 *
 * **Nur wo die Gebindegröße im Namen steht und der Preis je Kilogramm gilt.**
 * Ist die Einheit bereits das Gebinde (`SCK`, `STK`), ist der Schritt
 * ohnehin eins. Steht keine Gebindegröße im Namen, wird keine erfunden — das
 * Feld bleibt, wie es war.
 *
 * **Was hier eine Annahme ist, und welche.** Dass ein als „25 kg" benanntes
 * Gebinde nur ganz abgegeben wird, steht auf keiner Rechnung — der
 * Lieferant fakturiert je Kilogramm. Die Annahme ist trotzdem die
 * vorsichtigere: Eine Bestellung über 7 kg, die niemand kommissionieren
 * kann, kostet mehr als eine, die der Kunde auf 25 kg aufrundet. Verkauft
 * der Lieferant doch lose, fällt diese Funktion weg und sonst nichts.
 */
/**
 * Welche Einheit von welchem Leser gelesen wird — die **eine** Zuordnung.
 *
 * Sie stand bis zum 30.08. als Kette von `if`-Zeilen hier und ein zweites Mal
 * als Literal `['KG', 'M2']` in `test/gebinde.test.js`. Als die laufenden
 * Meter dazukamen, fiel die Probe um — nicht weil die Erkennung falsch war,
 * sondern weil sie den Bestand von gestern festhielt. Wer eine Einheit
 * ergänzt, ergänzt sie jetzt hier, und beide Seiten wissen davon.
 */
export const GEBINDELESER = Object.freeze({
  KG: gebindeKg,
  M2: gebindeM2,
  LFM: gebindeLfm,
});

export function mengenschritt(artikel) {
  if (!artikel) return null;
  const einheit = String(artikel.einheit ?? '').toUpperCase();
  if (einheit === 'KG') return gebindeKg(artikel.bezeichnung);
  // **Erweitert am 29.08. auf Flächenware.** Hier stand vorher, ein
  // gebrochener Schritt passe nicht ins Mengenfeld, „der Warenkorb rechnet
  // nur mit ganzen Mengen". Das war der eigentliche Fehler: Bei einer Platte
  // zu 0,75 m² sind ganze Quadratmeter gerade *nicht* lieferbar. Seit
  // `istMenge()` sind zwei Nachkommastellen zugelassen, und der Schritt darf
  // die Gebindegröße sein.
  if (einheit === 'M2') return gebindeM2(artikel.bezeichnung);
  // **Erweitert am 30.08. auf Längenware**, aus demselben Grund wie damals
  // die Fläche: Bei einer Leiste zu 2,55 m sind ganze laufende Meter gerade
  // *nicht* lieferbar.
  if (einheit === 'LFM') return gebindeLfm(artikel.bezeichnung);
  return null;
  // Absichtlich als Kette und nicht über `GEBINDELESER` aufgelöst: Die
  // Zuordnung ist die Zusicherung, die Kette ihre Ausführung. Liefe beides
  // über dieselbe Tabelle, prüfte die Probe darunter nur noch, dass eine
  // Tabelle sich selbst gleicht.
}

/* ------------------------------------------------------------------ *
 * Was die kleinste lieferbare Packung wiegt — 5. September 2026
 *
 * **Der Anlass.** `sperrgutpruefung.mjs` meldete „46 Artikel, **7 mit
 * belegtem Gewicht**" und hielt diese sieben gegen eine Handgrenze von 25 kg.
 * Zwei der sieben sind `Capatect PrimaPor K20 weiß 25 kg` und `Capatect
 * Putzgrund weiß 25 kg` — Einheit `KG`, `gewichtKg: 1`, Quelle „rechnung".
 *
 * Ein Kilogramm je Kilogramm. Die Angabe ist wahr und sagt nichts; gegen eine
 * Grenze von 25 kg kann sie **nie** anschlagen. Beide Artikel wiegen in
 * Wirklichkeit 25 kg je Sack — und die Zahl steht in ihrem Namen.
 *
 * Sie steht dort nicht ungelesen: `mengenschritt()` liest sie seit dem
 * 29. August, und jede Artikelseite druckt „Abgabe ab 25 kg". Zwei Leser
 * derselben Zeile, und der eine kennt das Gebinde, während der andere ein
 * Kilo wiegt.
 *
 * > **Eine Zahl ohne ihre Einheit ist keine Angabe. `gewichtKg` heißt bei
 * > Stückware „je Packung" und bei Kiloware „je Kilogramm" — dasselbe Feld,
 * > zwei Bedeutungen.**
 *
 * Diese Funktion beantwortet die eine Frage, die der Sperrgutprüfer stellt:
 * **Was hebt der Fahrer an?** Sie rät nichts — wo sie es nicht sagen kann,
 * gibt sie `null` zurück.
 * ------------------------------------------------------------------ */

/**
 * Das Gewicht der kleinsten lieferbaren Packung in Kilogramm, oder `null`.
 *
 * | Einheit | Grundlage |
 * |---|---|
 * | `KG` | die Gebindegröße aus dem Namen — Kilogramm sind Kilogramm, `gewichtKg` ist hier die Identität |
 * | Stückeinheit | `gewichtKg` aus der Rechnung, sonst die Gebindegröße aus dem Namen |
 * | `M2`, `LFM` | Mengenschritt × `gewichtKg`, wenn beide bekannt sind |
 *
 * @param {{bezeichnung: string, einheit: string, gewichtKg?: number}} artikel
 * @returns {number|null}
 */
export function packungsgewichtKg(artikel) {
  if (!artikel) return null;
  const einheit = String(artikel.einheit ?? '').toUpperCase();
  const ausName = gebindeKg(artikel.bezeichnung);
  const ausRechnung = Number.isFinite(artikel.gewichtKg) ? artikel.gewichtKg : null;
  const runde = (n) => Math.round(n * 1000) / 1000;

  if (einheit === 'KG') return ausName;
  if (STUECKEINHEITEN.has(einheit)) return ausRechnung ?? ausName;

  // Fläche und Länge: Das Gewicht steht je Quadratmeter oder je laufendem
  // Meter da, die Packung ist der Mengenschritt. Ohne beides bleibt es offen —
  // eine Platte, deren Gewicht niemand notiert hat, wiegt nicht null.
  const schritt = mengenschritt(artikel);
  if (schritt != null && ausRechnung != null) return runde(schritt * ausRechnung);
  return null;
}

/**
 * Hält `STUECKEINHEITEN` und die Maßeinheiten gegen den Katalog — in beide
 * Richtungen. Eine Einheit, die keiner führt, prüft nichts; eine, die keine
 * der beiden Listen kennt, fällt still aus jeder Umrechnung.
 */
export function einheitenbefund(artikel = [], woerter = EINHEITEN) {
  const meldungen = [];
  const gefuehrt = new Set(artikel.map((a) => String(a.einheit ?? '').toUpperCase()).filter(Boolean));
  const gemessen = new Set(Object.keys(GEBINDELESER));

  // **Die dritte Liste, ergänzt am 5. September.** `EINHEITEN` in `format.js`
  // ist die einzige, die dem Kunden begegnet: Ohne Eintrag reicht
  // `einheitText` das Kürzel des Lieferanten durch — richtig so, denn Raten
  // wäre schlimmer —, und dann steht „6 KRT" auf einem Kundentext. Genau das
  // stand dort, bis heute, in der Fassung, die der Prüfer las.
  for (const e of gefuehrt) {
    if (!woerter[e]) {
      meldungen.push({
        regel: 'einheit-ohne-wort',
        einheit: e,
        text: `${e}: kein lesbares Wort — das Kürzel ginge so an den Kunden`,
      });
    }
  }

  for (const e of STUECKEINHEITEN) {
    if (!gefuehrt.has(e)) {
      meldungen.push({ regel: 'einheit-ohne-artikel', einheit: e, text: `${e}: kein Artikel führt diese Einheit` });
    }
  }
  for (const e of gefuehrt) {
    if (!STUECKEINHEITEN.has(e) && !gemessen.has(e)) {
      meldungen.push({
        regel: 'einheit-unbekannt',
        einheit: e,
        text: `${e}: weder Stückeinheit noch Maßeinheit — fällt aus jeder Umrechnung`,
      });
    }
  }

  return {
    einheiten: gefuehrt.size,
    mitWort: [...gefuehrt].filter((e) => woerter[e]).length,
    sauber: meldungen.length === 0,
    meldungen,
  };
}

/**
 * Wie viele ganze Gebinde eine Menge ergibt — und wie viel dabei herauskommt.
 *
 * Für die Anzeige gedacht, nicht für die Rechnung: Der Warenkorb führt die
 * Menge in der Einheit des Artikels, nicht in Stück. Diese Funktion sagt dem
 * Kunden, was hinter seiner Zahl steckt.
 */
export function gebindezahl(menge, schritt) {
  if (!(schritt > 0) || !(menge > 0)) return null;
  const stueck = Math.ceil(Math.round((menge / schritt) * 1e6) / 1e6);
  const gedeckteMenge = Math.round(stueck * schritt * 100) / 100;
  return { stueck, gedeckteMenge, gehtAuf: Math.abs(gedeckteMenge - menge) < 0.005 };
}

/**
 * Die Vergleichstafel für eine Warengruppe: nur die Artikel, für die beide
 * Preise bekannt sind, sortiert nach dem Kilopreis.
 *
 * Wichtig ist, was **nicht** in der Tafel steht. Die Funktion gibt deshalb
 * auch die Zahl der übergangenen Artikel zurück — eine Tafel, die schweigend
 * kürzt, sieht vollständig aus und ist es nicht.
 */
export function kilotafel(artikel = []) {
  const zeilen = [];
  let ohne = 0;
  for (const a of artikel) {
    const p = preisJeKilo(a);
    if (p) zeilen.push({ ...a, ...p });
    else ohne++;
  }
  zeilen.sort((x, y) => x.jeKgNetto - y.jeKgNetto);
  return { zeilen, ohne, gesamt: artikel.length };
}
