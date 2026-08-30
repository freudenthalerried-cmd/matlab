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
export function leseArtikelliste(csvText, lieferant, stand) {
  const fehler = [];
  const warnungen = [];

  if (!istStand(stand)) {
    fehler.push(`Kein brauchbarer Stand: „${stand ?? ''}" — erwartet wird YYYY-MM-DD`);
    return { artikel: [], preise: {}, fehler, warnungen };
  }

  const { kopf, zeilen } = leseCsv(csvText);
  for (const pflicht of PFLICHTSPALTEN) {
    if (!kopf.includes(pflicht)) fehler.push(`Pflichtspalte fehlt: ${pflicht}`);
  }
  if (!kopf.includes('ek_netto') && !kopf.includes('uvp_netto')) {
    fehler.push('Es fehlt eine Preisspalte: ek_netto oder uvp_netto');
  }
  if (fehler.length) return { artikel: [], preise: {}, fehler, warnungen };

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

    // **Die Warengruppe wird nicht geraten.** Am 29.08. gemessen: Ein
    // Regelwerk erkannte 0 von 16 Gruppen aus der Bezeichnung. Die Gruppe ist
    // eine Entscheidung dieses Shops, keine Eigenschaft des Artikels — und
    // ein Artikel ohne gültige Gruppe steht auf keiner Seite, weshalb der
    // Seitenbau abbricht.
    const gruppe = satz.gruppe;
    if (!WARENGRUPPEN.includes(gruppe)) {
      fehler.push(`${ort}: ${nummer} trägt die Gruppe „${gruppe}" — bekannt sind ${WARENGRUPPEN.join(', ')}`);
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
      gtin: satz.gtin || null,
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

  return { artikel, preise, fehler, warnungen };
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
