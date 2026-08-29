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
  if (String(artikel.einheit ?? '').toUpperCase() !== 'KG') return null;
  const kg = gebindeKg(artikel.bezeichnung);
  if (kg === null) return null;
  // Ein gebrochener Schritt wäre im Mengenfeld nicht ganzzahlig, und der
  // Warenkorb rechnet nur mit ganzen Mengen. 1,5 kg Fugenmasse wird je Stück
  // verkauft und kommt hier ohnehin nicht an.
  if (!Number.isInteger(kg)) return null;
  return kg;
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
