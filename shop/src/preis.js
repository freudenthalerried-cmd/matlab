/**
 * Preis- und Margenrechnung.
 *
 * Bildet die Regeln ab, die in docs/baustoff-shop/ als Gates festgelegt wurden:
 *   Gate 1  Rohmarge unter 32 % ist unzulässig.
 *   Gate 7  Der Shop richtet sich an Unternehmer; alle Preise sind Nettopreise,
 *           die Umsatzsteuer wird getrennt ausgewiesen.
 *
 * Reine Rechenfunktionen, keine Dateizugriffe, keine Seiteneffekte.
 */

export const MARGENUNTERGRENZE = 0.32;
export const UST_SATZ = 0.20;

/** Kaufmännisch auf Cent runden. */
export function cent(betrag) {
  return Math.round((betrag + Number.EPSILON) * 100) / 100;
}

/**
 * Einkaufspreis aus UVP und Händlerrabatt.
 * @param {number} uvpNetto
 * @param {number} haendlerrabatt Anteil, z. B. 0.35 für 35 %
 */
export function einkaufspreis(uvpNetto, haendlerrabatt) {
  if (uvpNetto <= 0) throw new Error('UVP muss positiv sein');
  if (haendlerrabatt < 0 || haendlerrabatt >= 1) {
    throw new Error('Händlerrabatt muss zwischen 0 und 1 liegen');
  }
  return cent(uvpNetto * (1 - haendlerrabatt));
}

/**
 * Verkaufspreis aus Einkaufspreis und Zielmarge.
 *
 * Die Marge wird auf den Verkaufspreis bezogen — so, wie sie in der gesamten
 * Analyse gerechnet ist: Rohmarge = (VK − EK) / VK. Der Verkaufspreis wird nie
 * über die UVP gesetzt; wer über UVP verkauft, verliert den Fachhändlerstatus
 * schneller, als die Mehrmarge einbringt.
 */
export function verkaufspreis(ekNetto, zielmarge, uvpNetto = Infinity) {
  if (zielmarge < 0 || zielmarge >= 1) {
    throw new Error('Zielmarge muss zwischen 0 und 1 liegen');
  }
  return cent(Math.min(ekNetto / (1 - zielmarge), uvpNetto));
}

/** Rohmarge als Anteil am Verkaufspreis. */
export function rohmarge(ekNetto, vkNetto) {
  if (vkNetto <= 0) return 0;
  return (vkNetto - ekNetto) / vkNetto;
}

/**
 * Vollständige Kalkulation einer Artikelposition.
 * Liefert alles, was Shop und Prüfung brauchen — inklusive der Gate-1-Ampel.
 */
export function kalkuliere(artikel, lieferant, zielmarge) {
  const ekNetto = einkaufspreis(artikel.uvpNetto, lieferant.haendlerrabattAufUvp);
  const vkNetto = verkaufspreis(ekNetto, zielmarge, artikel.uvpNetto);
  const marge = rohmarge(ekNetto, vkNetto);

  return {
    sku: artikel.sku,
    bezeichnung: artikel.bezeichnung,
    lieferantId: artikel.lieferantId,
    uvpNetto: cent(artikel.uvpNetto),
    ekNetto,
    vkNetto,
    vkBrutto: cent(vkNetto * (1 + UST_SATZ)),
    deckungsbeitragNetto: cent(vkNetto - ekNetto),
    rohmarge: marge,
    margeErreicht: marge >= MARGENUNTERGRENZE - 1e-9,
    ekIstPlatzhalter: artikel.ekQuelle !== 'bestaetigt',
  };
}

/**
 * Frachtkosten für die Positionen **eines** Lieferanten.
 *
 * Im Streckengeschäft liefert jeder Lieferant getrennt, also fällt Fracht je
 * Lieferant an — nicht je Bestellung. Das ist der Grund, weshalb ein
 * Warenkorb aus drei Quellen dreimal Fracht trägt.
 */
export function fracht(positionen, lieferant) {
  const regel = lieferant.fracht;
  const warenwertNetto = cent(
    positionen.reduce((s, p) => s + p.vkNetto * p.menge, 0),
  );

  if (regel.freiHausAbNetto != null && warenwertNetto >= regel.freiHausAbNetto) {
    return { betragNetto: 0, grund: 'frei Haus ab ' + regel.freiHausAbNetto + ' €', warenwertNetto };
  }

  const sperrgutPositionen = positionen.filter((p) => p.sperrgut).length;
  const betragNetto = cent(
    regel.pauschaleNetto + sperrgutPositionen * (regel.sperrgutZuschlagNetto ?? 0),
  );

  return {
    betragNetto,
    grund:
      sperrgutPositionen > 0
        ? `Pauschale plus ${sperrgutPositionen}× Sperrgutzuschlag`
        : 'Pauschale',
    warenwertNetto,
  };
}

/** Prüft den Mindestbestellwert eines Lieferanten. */
export function mindestbestellwertErfuellt(warenwertNetto, lieferant) {
  const grenze = lieferant.mindestbestellwertNetto ?? 0;
  return {
    erfuellt: warenwertNetto >= grenze,
    grenze,
    fehlbetragNetto: cent(Math.max(0, grenze - warenwertNetto)),
  };
}
