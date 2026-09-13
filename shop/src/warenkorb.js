/**
 * Warenkorb im Streckengeschäft.
 *
 * Der Unterschied zu einem gewöhnlichen Warenkorb: Die Positionen werden nach
 * Lieferant gruppiert, weil jede Gruppe zu einer eigenen Bestellung und zu
 * eigener Fracht führt. Was der Kunde als eine Bestellung sieht, sind
 * betrieblich mehrere.
 */

import { istMenge } from './gebinde.js';
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
    if (!istMenge(zeile.menge)) {
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
      // **Intern, und genau deshalb hier.** Die Frei-Haus-Schwelle misst am
      // Einkauf; sie gehört zu den Zahlen, die kein Kundenpapier nennen darf.
      // Sie wandert trotzdem in die Teillieferung, weil `pruefeMargenleck`
      // sonst einen zweiten Weg zu den Lieferantendaten bräuchte — und ein
      // Prüfer, dem man die Vergleichsgrößen erst hereinreichen muss, prüft
      // dort nicht, wo man es vergisst.
      frachtSchwelleNetto: f.schwelleNetto ?? null,
      mindestbestellwert: mbw,
      ...nebenkostenUntergrenze(positionen, lieferant),
    });
  }

  teillieferungen.sort((a, b) => a.lieferantId.localeCompare(b.lieferantId));

  const warenwertNetto = cent(teillieferungen.reduce((s, t) => s + t.warenwertNetto, 0));
  const frachtNetto = cent(teillieferungen.reduce((s, t) => s + t.frachtNetto, 0));
  const einkaufNetto = cent(teillieferungen.reduce((s, t) => s + t.einkaufNetto, 0));
  const nebenkostenUntergrenzeNetto = cent(
    teillieferungen.reduce((s, t) => s + (t.nebenkostenUntergrenzeNetto ?? 0), 0),
  );
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
    nebenkostenUntergrenzeNetto,
    nebenkostenGrund: teillieferungen.map((t) => t.nebenkostenGrund).filter(Boolean),
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

/**
 * Die **Untergrenze** der Kosten, die auf den Belegen stehen und bisher in
 * keiner Rechnung dieses Baus vorkommen.
 *
 * Auf der Rechnung über 1.934 € netto standen neben der Frachtpauschale:
 * sechs ÖBB-Paletten zu 22,00 €, eine Rückgabe mit −20,00 € und eine
 * Folierung zu 6,50 € — **118,50 € nicht gerechnete Nebenkosten, mehr als
 * die Frachtpauschale selbst.** Der Rechenkern kannte davon bis zum 28.
 * August nichts.
 *
 * Warum nur eine Untergrenze und keine Rechnung: Die **Stückzahl** der
 * Paletten hängt an Gewicht und Packmaß, und der Katalog führt Gewichte für
 * sieben von 46 Artikeln. Was sich aus den Belegen ohne Annahme ableiten
 * lässt, ist der Boden:
 *
 * > **Eine Lieferung mit palettierter Ware kostet mindestens eine Palette
 * > plus Folierung.**
 *
 * Die Rückgabegutschrift von 20,00 € wird **nicht** gegengerechnet. Sie fällt
 * nur an, wenn die Palette tatsächlich zurückgeht; elf der fünfzehn
 * Rechnungen lauten „Abholung Kunde", und was der Auftraggeber dabei mit der
 * Palette macht, steht auf keinem Beleg. Die vorsichtige Zahl ist hier die
 * ehrliche.
 *
 * Die Kranentladung (7,50 € je Hub) steht bewusst **nicht** in dieser Summe:
 * Sie wird dem Kunden als Sperrgutzuschlag weiterverrechnet und ist damit
 * durchlaufend. Sie hier noch einmal abzuziehen, hieße sie doppelt zu zahlen.
 *
 * @returns {{nebenkostenUntergrenzeNetto: number, nebenkostenGrund?: string}}
 */
export function nebenkostenUntergrenze(positionen, lieferant) {
  const n = lieferant?.nebenkosten;
  if (!n) return { nebenkostenUntergrenzeNetto: 0 };
  if (!positionen.some((p) => p.sperrgut)) return { nebenkostenUntergrenzeNetto: 0 };
  const palette = Number(n.paletteOebbNetto ?? 0);
  const folierung = Number(n.folierungNetto ?? 0);
  const summe = cent(palette + folierung);
  if (summe <= 0) return { nebenkostenUntergrenzeNetto: 0 };
  return {
    nebenkostenUntergrenzeNetto: summe,
    nebenkostenGrund: `mindestens eine Palette (${palette.toFixed(2)} €) und Folierung `
      + `(${folierung.toFixed(2)} €) je Lieferung mit palettierter Ware — Stückzahl unbekannt, `
      + 'Rückgabegutschrift nicht gegengerechnet',
  };
}
