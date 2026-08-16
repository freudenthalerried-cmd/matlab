/**
 * Warenkorb im Streckengeschäft.
 *
 * Der Unterschied zu einem gewöhnlichen Warenkorb: Die Positionen werden nach
 * Lieferant gruppiert, weil jede Gruppe zu einer eigenen Bestellung und zu
 * eigener Fracht führt. Was der Kunde als eine Bestellung sieht, sind
 * betrieblich mehrere.
 */

import { cent, fracht, kalkuliere, mindestbestellwertErfuellt, UST_SATZ, MARGENUNTERGRENZE } from './preis.js';

export function ladeKatalog(daten, zielmarge) {
  const lieferantenById = new Map(daten.lieferanten.lieferanten.map((l) => [l.id, l]));

  const artikel = daten.artikel.artikel.map((a) => {
    const lieferant = lieferantenById.get(a.lieferantId);
    if (!lieferant) throw new Error(`Unbekannter Lieferant: ${a.lieferantId}`);
    return { ...a, ...kalkuliere(a, lieferant, zielmarge) };
  });

  return { artikel, lieferantenById };
}

/**
 * Rechnet einen Warenkorb durch.
 * @param {Array<{sku: string, menge: number}>} zeilen
 */
export function berechneWarenkorb(zeilen, katalog) {
  const gruppen = new Map();

  for (const zeile of zeilen) {
    if (!Number.isInteger(zeile.menge) || zeile.menge < 1) {
      throw new Error(`Ungültige Menge für ${zeile.sku}`);
    }
    const artikel = katalog.artikel.find((a) => a.sku === zeile.sku);
    if (!artikel) throw new Error(`Unbekannte Artikelnummer: ${zeile.sku}`);

    const position = {
      ...artikel,
      menge: zeile.menge,
      zeilensummeNetto: cent(artikel.vkNetto * zeile.menge),
      zeileneinkaufNetto: cent(artikel.ekNetto * zeile.menge),
    };

    if (!gruppen.has(artikel.lieferantId)) gruppen.set(artikel.lieferantId, []);
    gruppen.get(artikel.lieferantId).push(position);
  }

  const teillieferungen = [];
  for (const [lieferantId, positionen] of gruppen) {
    const lieferant = katalog.lieferantenById.get(lieferantId);
    const f = fracht(positionen, lieferant);
    // Am Bestellwert gemessen, nicht am Warenwert: Der Mindestbestellwert ist
    // eine Kondition des Lieferanten uns gegenüber.
    const mbw = mindestbestellwertErfuellt(f.bestellwertNetto, lieferant);

    teillieferungen.push({
      lieferantId,
      lieferantName: lieferant.name,
      lieferzeitWerktage: lieferant.lieferzeitWerktage,
      positionen,
      warenwertNetto: f.warenwertNetto,
      einkaufNetto: f.bestellwertNetto,
      frachtNetto: f.betragNetto,
      frachtGrund: f.grund,
      mindestbestellwert: mbw,
    });
  }

  teillieferungen.sort((a, b) => a.lieferantId.localeCompare(b.lieferantId));

  const warenwertNetto = cent(teillieferungen.reduce((s, t) => s + t.warenwertNetto, 0));
  const frachtNetto = cent(teillieferungen.reduce((s, t) => s + t.frachtNetto, 0));
  const einkaufNetto = cent(teillieferungen.reduce((s, t) => s + t.einkaufNetto, 0));
  const summeNetto = cent(warenwertNetto + frachtNetto);
  const ust = cent(summeNetto * UST_SATZ);

  // Die Fracht wird an den Kunden weitergegeben und ist damit margenneutral.
  // Die Mischmarge bezieht sich deshalb auf den Warenwert, nicht auf die Summe.
  const mischmarge = warenwertNetto > 0 ? (warenwertNetto - einkaufNetto) / warenwertNetto : 0;

  return {
    teillieferungen,
    warenwertNetto,
    frachtNetto,
    einkaufNetto,
    summeNetto,
    ust,
    summeBrutto: cent(summeNetto + ust),
    deckungsbeitragNetto: cent(warenwertNetto - einkaufNetto),
    mischmarge,
    mischmargeErreicht: mischmarge >= MARGENUNTERGRENZE - 1e-9,
    frachtanteilAmWarenwert: warenwertNetto > 0 ? frachtNetto / warenwertNetto : 0,
    bestellbar: teillieferungen.every((t) => t.mindestbestellwert.erfuellt),

    // **Zwei Fassungen desselben Hinweises, und der Unterschied ist Geld wert.**
    //
    // Die Mindestbestellwerte der Lieferanten gelten für den Einkaufswert. Ein
    // Hinweis, der ihn nennt, verrät dem Kunden die Handelsspanne: Neben einem
    // Warenwert von 330 € stand „erreicht sind 231 €" — daraus liest jeder
    // Einkäufer 30 % Marge ab, und der Hersteller steht mit Namen daneben.
    // Genau das ging über 1.005 von 1.533 geprüften Angeboten hinaus.
    //
    // `hinweise` ist deshalb das, was der Kunde lesen darf: der Fehlbetrag in
    // **seiner** Währung, dem Warenwert. `hinweiseIntern` bleibt vollständig
    // und geht in keinen Beleg an den Kunden.
    hinweise: teillieferungen
      .filter((t) => !t.mindestbestellwert.erfuellt)
      .map((t) => {
        const hebel = t.einkaufNetto > 0 ? t.warenwertNetto / t.einkaufNetto : 1;
        const fehlt = Math.ceil(t.mindestbestellwert.fehlbetragNetto * hebel);
        return (
          `${t.lieferantName}: Die Bestellmenge für diesen Hersteller ist noch zu klein. ` +
          `Es fehlen rund ${fehlt} € Warenwert netto.`
        );
      }),

    hinweiseIntern: teillieferungen
      .filter((t) => !t.mindestbestellwert.erfuellt)
      .map(
        (t) =>
          `${t.lieferantName}: Mindestbestellwert ${t.mindestbestellwert.grenze} € netto Bestellwert, ` +
          `erreicht sind ${t.mindestbestellwert.bestellwertNetto} €, es fehlen ` +
          `${t.mindestbestellwert.fehlbetragNetto} €.`,
      ),
  };
}
