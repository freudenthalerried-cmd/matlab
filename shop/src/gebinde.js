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
  if (treffer.length !== 1) return null;
  const m2 = zahl(treffer[0][1]);
  if (!Number.isFinite(m2)) return null;
  if (m2 < KLEINSTES_GEBINDE_M2 || m2 > GROESSTES_GEBINDE_M2) return null;
  return m2;
}

/** Einheiten, die eine Stückzahl meinen — bei ihnen ist der Preis der Gebindepreis. */
const STUECKEINHEITEN = new Set(['SCK', 'STK', 'PAK', 'EIM', 'KAR', 'ROL']);

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
  return null;
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
