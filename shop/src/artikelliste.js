/**
 * Eine Artikelliste des Lieferanten in Katalog und Preise zerlegen.
 *
 * **Wofür das gebaut ist.** Seit Wochen wartet dieses Vorhaben auf eine
 * Artikelliste — `sku;bezeichnung;einheit;ek_netto[;uvp_netto;gruppe;
 * gewicht_kg;sperrgut]`. Am 30.08. hat sich gezeigt, dass kein Werkzeug sie
 * verarbeiten kann: `bin/import.mjs` schrieb in den Platzhalterbestand des
 * abgelösten Modells, `bin/katalog-aus-rechnungen.mjs` liest Rechnungen und
 * meldete bei einer Artikelliste „0 Artikel". Beide sagen das inzwischen —
 * aber Sagen ist nicht Können.
 *
 * Dieses Modul rechnet. Es entscheidet **nichts**, was eine Entscheidung
 * ist: nicht die Warengruppe, nicht den Preisstand, nicht ob ein Artikel
 * Sperrgut ist. Was es nicht aus der Liste liest, verlangt es — und bricht
 * ab, wo es raten müsste.
 *
 * Die Trennung der beiden Ausgaben ist die Bedingung, unter der es überhaupt
 * gebaut werden darf: Der Katalog ist öffentlich und trägt keine Preise, die
 * Konditionen liegen unter `preise/` und sind von `.gitignore` gedeckt.
 */

import { leseCsv, zahl, jaNein } from './import.js';

/** Die sieben Warengruppen des Shops. Eine achte gibt es nicht. */
export const WARENGRUPPEN = Object.freeze([
  'Dämmung', 'Kamin', 'Kanal', 'Mauerwerk', 'Mörtel', 'WDVS', 'Zubehör',
]);

/**
 * Gruppen, deren Ware palettiert kommt und einen Kranhub braucht.
 * Dieselbe Einschätzung wie in `bin/katalog-aus-rechnungen.mjs` — sie steuert
 * den Frachtzuschlag und ist **keine** Angabe des Lieferanten.
 */
export const SPERRGUT_GRUPPEN = Object.freeze(['Dämmung', 'Kamin', 'Kanal', 'Mauerwerk']);

/** Einheitenkürzel, mit denen der Rechenkern umgehen kann. */
export const EINHEITEN = Object.freeze([
  'STK', 'M2', 'KG', 'SCK', 'KRT', 'KAR', 'LFM', 'DOS', 'EIM', 'RLL', 'ROL', 'PAK', 'M3', 'LTR',
]);

/**
 * Erlaubte Längen einer Artikelkennung: GTIN-8, -12 (UPC), -13 (EAN) und -14.
 * Der Baustoffhandel führt fast ausschließlich EAN-13.
 */
const GTIN_LAENGEN = Object.freeze([8, 12, 13, 14]);

/**
 * Ist das eine gültige Artikelkennung?
 *
 * **Warum das geprüft gehört und nicht nur das Vorhandensein.** Eine GTIN
 * trägt eine Prüfziffer: Die Ziffern werden von rechts abwechselnd mit 3 und 1
 * gewichtet, und die Summe muss auf null aufgehen. Ein Zahlendreher oder eine
 * abgeschnittene Stelle ergibt deshalb keine „ungefähr richtige" Kennung,
 * sondern eine falsche — und eine falsche Kennung ist schlimmer als gar
 * keine:
 *
 *   - Der Produktfeed wird abgelehnt, und zwar mit einem Fehler, der nach
 *     einem Tippfehler beim Hochladen aussieht statt nach einem in den Daten.
 *   - Schlimmer: Sie kann eine **andere** Ware bezeichnen. Dann bewirbt der
 *     Shop einen Artikel und liefert einen anderen.
 *
 * Der Aufwand ist eine Zeile Arithmetik, der Nutzen ist, dass der Fehler am
 * Tag des Einlesens auffällt statt beim Ablehnungsbescheid.
 *
 * Führende Nullen sind bedeutungstragend, deshalb wird auf der Zeichenkette
 * gerechnet und nicht auf einer Zahl.
 */
export function istGtin(wert) {
  const ziffern = String(wert ?? '').trim();
  if (!GTIN_LAENGEN.includes(ziffern.length)) return false;
  if (!/^\d+$/.test(ziffern)) return false;

  let summe = 0;
  // Von rechts, die Prüfziffer selbst ausgenommen: 3, 1, 3, 1 …
  for (let i = ziffern.length - 2, gewicht = 3; i >= 0; i -= 1, gewicht = gewicht === 3 ? 1 : 3) {
    summe += Number(ziffern[i]) * gewicht;
  }
  const pruefziffer = (10 - (summe % 10)) % 10;
  return pruefziffer === Number(ziffern.at(-1));
}

const PFLICHTSPALTEN = ['sku', 'bezeichnung', 'einheit', 'gruppe'];

/** `2026-08-30` und nichts anderes — ein Stand, der sich nicht sortieren lässt, ist keiner. */
export function istStand(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(text ?? ''));
}

/**
 * Liest die Liste und trennt sie in Katalog- und Preisangaben.
 *
 * @param {string} csvText
 * @param {{id: string}} lieferant
 * @param {string} stand  Datum der Liste, `YYYY-MM-DD`
 * @returns {{artikel: Array, preise: object, fehler: string[], warnungen: string[]}}
 */
export function leseArtikelliste(csvText, lieferant, stand, sparten = {}) {
  const fehler = [];
  const warnungen = [];
  /** Sparten, die keine Zuordnung haben — je Name die Zahl der Artikel. */
  const offeneSparten = new Map();

  if (!istStand(stand)) {
    fehler.push(`Kein brauchbarer Stand: „${stand ?? ''}" — erwartet wird YYYY-MM-DD`);
    return { artikel: [], preise: {}, fehler, warnungen, offeneSparten: new Map() };
  }

  const { kopf, zeilen } = leseCsv(csvText);
  const hatGruppe = kopf.includes('gruppe') || kopf.includes('sparte');
  for (const pflicht of PFLICHTSPALTEN) {
    if (pflicht === 'gruppe' ? !hatGruppe : !kopf.includes(pflicht)) {
      fehler.push(`Pflichtspalte fehlt: ${pflicht === 'gruppe' ? 'gruppe oder sparte' : pflicht}`);
    }
  }
  if (!kopf.includes('ek_netto') && !kopf.includes('uvp_netto')) {
    fehler.push('Es fehlt eine Preisspalte: ek_netto oder uvp_netto');
  }
  if (fehler.length) return { artikel: [], preise: {}, fehler, warnungen, offeneSparten };

  const artikel = [];
  const preise = {};
  const gesehen = new Set();

  for (const satz of zeilen) {
    const ort = `Zeile ${satz._zeile}`;
    const nummer = satz.sku;
    if (!nummer) { fehler.push(`${ort}: sku fehlt`); continue; }
    if (gesehen.has(nummer)) { fehler.push(`${ort}: ${nummer} kommt mehrfach vor`); continue; }
    gesehen.add(nummer);

    if (!satz.bezeichnung) { fehler.push(`${ort}: Bezeichnung fehlt für ${nummer}`); continue; }

    /**
     * **Die Warengruppe wird nicht geraten.** Am 29.08. gemessen: Ein
     * Regelwerk erkannte 0 von 16 Gruppen aus der Bezeichnung. Die Gruppe ist
     * eine Entscheidung dieses Shops, keine Eigenschaft des Artikels — und
     * ein Artikel ohne gültige Gruppe steht auf keiner Seite, weshalb der
     * Seitenbau abbricht.
     *
     * **Zwei Wege dorthin, seit dem 30.08.** Nennt die Liste eine unserer
     * sieben Gruppen, gilt sie. Nennt sie die Sparte des Lieferanten — und
     * das ist der wahrscheinliche Fall, denn er gliedert nach seinem eigenen
     * Sortiment —, entscheidet die Zuordnungstabelle. Sie wird einmal von
     * Hand gefüllt, nicht je Artikel.
     */
    const roh = satz.gruppe || satz.sparte || '';
    const gruppe = WARENGRUPPEN.includes(roh) ? roh : sparten[roh];
    if (!WARENGRUPPEN.includes(gruppe)) {
      if (roh && !gruppe) {
        // **Keine Fehlerzeile je Artikel.** Bei dreihundert Artikeln aus
        // zwanzig Sparten stünden hier dreihundert Zeilen mit derselben
        // Aussage, und die Arbeit bestünde darin, sie zu sortieren. Gezählt
        // wird nach Sparte; der Bericht führt sie gebündelt und in der Form,
        // in der sie in die Zuordnungstabelle gehören.
        offeneSparten.set(roh, (offeneSparten.get(roh) ?? 0) + 1);
      } else {
        fehler.push(`${ort}: ${nummer} trägt die Gruppe „${roh}" — bekannt sind ${WARENGRUPPEN.join(', ')}`);
      }
      continue;
    }

    const einheit = String(satz.einheit ?? '').toUpperCase();
    if (!EINHEITEN.includes(einheit)) {
      fehler.push(`${ort}: ${nummer} trägt die Einheit „${satz.einheit}" — bekannt sind ${EINHEITEN.join(', ')}`);
      continue;
    }

    const ek = zahl(satz.ek_netto);
    const uvp = zahl(satz.uvp_netto);
    const rabatt = zahl(satz.rabatt_prozent);
    const gewicht = zahl(satz.gewicht_kg);

    // **Eine falsche Kennung ist schlimmer als keine** — deshalb ein Fehler
    // und keine Warnung. Eine Warnung ließe die Zeile durch, und die falsche
    // Ziffer stünde im Feed.
    const rohGtin = String(satz.gtin ?? '').trim();
    let gtin = null;
    if (rohGtin !== '') {
      if (!istGtin(rohGtin)) {
        fehler.push(`${ort}: ${nummer} trägt „${rohGtin}" als GTIN — die Prüfziffer geht nicht auf`);
        continue;
      }
      gtin = rohGtin;
    }
    if ([ek, uvp, rabatt, gewicht].some((w) => Number.isNaN(w))) {
      fehler.push(`${ort}: Zahl nicht lesbar bei ${nummer}`);
      continue;
    }
    if (ek == null && uvp == null) {
      fehler.push(`${ort}: ${nummer} hat weder Einkaufspreis noch Listenpreis`);
      continue;
    }
    if (ek != null && ek <= 0) { fehler.push(`${ort}: Einkaufspreis muss positiv sein (${nummer})`); continue; }
    if (uvp != null && ek != null && ek > uvp) {
      fehler.push(`${ort}: Einkaufspreis über Listenpreis (${nummer}) — Liste prüfen`);
      continue;
    }

    // Sperrgut aus der Liste, wenn sie es sagt; sonst nach Gruppe geschätzt.
    // Die Herkunft steht daneben, damit niemand die Schätzung für eine
    // Lieferantenangabe hält.
    const ausListe = kopf.includes('sperrgut') && satz.sperrgut !== '';
    const sperrgut = ausListe ? jaNein(satz.sperrgut) : SPERRGUT_GRUPPEN.includes(gruppe);

    const eintrag = {
      sku: `POS-${nummer}`,
      lieferantenArtikelnummer: String(nummer),
      bezeichnung: satz.bezeichnung.replace(/\s+/g, ' ').trim(),
      gruppe,
      lieferantId: lieferant.id,
      einheit,
      sperrgut,
      sperrgutQuelle: ausListe ? 'liste' : 'eingeschaetzt',
      gtin: gtin,
      preisStand: stand,
      ekQuelle: ek != null ? 'bestaetigt' : 'ausListe',
    };
    if (gewicht != null && gewicht > 0) {
      eintrag.gewichtKg = gewicht;
      eintrag.gewichtQuelle = 'liste';
    }
    artikel.push(eintrag);

    // Die Konditionen — sie gehen in die zweite Datei und nirgends sonst hin.
    preise[eintrag.sku] = ek != null
      ? { ekNetto: ek, stand, ...(uvp != null ? { uvpNetto: uvp } : {}) }
      : { uvpNetto: uvp, haendlerrabattAufUvp: rabatt != null ? Math.abs(rabatt) / 100 : null, stand };

    if (ek == null) {
      warnungen.push(`${ort}: ${nummer} ohne Einkaufspreis — Verkaufspreis erst mit Rabattsatz rechenbar`);
    }
    if (!eintrag.gtin) warnungen.push(`${ort}: ${nummer} ohne GTIN — für den Produktfeed verlangt`);
  }

  return { artikel, preise, fehler, warnungen, offeneSparten };
}

/**
 * Führt eine gelesene Liste mit dem vorhandenen Katalog zusammen.
 *
 * **Zusammenführen und nicht ersetzen.** Eine Liste kann das ganze Sortiment
 * sein oder eine Ergänzung; das sieht man ihr nicht an. Was fehlt, wird
 * gemeldet und bleibt stehen — löschen ist eine Entscheidung und braucht
 * `--entfernen`.
 */
export function fuehreZusammen(bestand, neue, { entfernen = false } = {}) {
  const nachSku = new Map(bestand.map((a) => [a.sku, a]));
  const neuSku = new Set(neue.map((a) => [a.sku][0]));
  const zugang = neue.filter((a) => !nachSku.has(a.sku)).map((a) => a.sku);
  const geaendert = neue
    .filter((a) => nachSku.has(a.sku) && JSON.stringify(nachSku.get(a.sku)) !== JSON.stringify(a))
    .map((a) => a.sku);
  const fehlend = bestand.filter((a) => !neuSku.has(a.sku)).map((a) => a.sku);

  for (const a of neue) nachSku.set(a.sku, a);
  if (entfernen) for (const sku of fehlend) nachSku.delete(sku);

  const artikel = [...nachSku.values()].sort(
    (a, b) => a.gruppe.localeCompare(b.gruppe, 'de') || a.bezeichnung.localeCompare(b.bezeichnung, 'de'),
  );
  return { artikel, zugang, geaendert, fehlend };
}
