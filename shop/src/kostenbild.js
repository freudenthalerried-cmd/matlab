/**
 * Was von der Rohmarge übrig bleibt — und was das für den nötigen Umsatz heißt.
 *
 * Wareneinkauf, Fracht und Zahlungsgebühr sind einzeln gerechnet, aber nie
 * zusammengeführt worden. `phase3-unit-economics.md` bildet die Kaskade
 * Rohmarge → Werbung → Deckungsbeitrag ab; Zahlungsgebühren fehlen darin, wie
 * `zahlwege-und-gebuehren.md` gezeigt hat.
 *
 * Diese Datei zieht die Kaskade einmal vollständig durch und dreht sie dann
 * um: Nicht „wie viel bleibt bei 24.200 € Umsatz", sondern „wie viel Umsatz
 * braucht es, damit am Ende die Zielgröße steht". Das ist die Frage, an der
 * die Planung hängt, denn aus dem Umsatz folgen Bestellungen und aus den
 * Bestellungen der Besucherbedarf.
 *
 * Ein Hinweis zur Fracht: Sie wird im Streckengeschäft eins zu eins an den
 * Kunden weitergegeben und ist deshalb **margenneutral**. Sie taucht in der
 * Kaskade nicht als Kostenposten auf, sondern nur im Bruttobetrag — und damit
 * in der Bemessungsgrundlage der Zahlungsgebühr. Auch das ist ein Effekt, den
 * man leicht übersieht: Man zahlt Gebühr auf durchlaufende Fracht.
 */

import { cent } from './preis.js';
import { ZAHLWEGE, findeZahlweg } from './zahlung.js';

export const UST = 0.20;

/**
 * Anteil der Zahlungsgebühr am **Nettoumsatz**.
 *
 * Die Gebühr fällt auf brutto an, gerechnet wird die Kaskade netto — der
 * Prozentsatz ist deshalb mit 1,2 zu strecken. Der Fixbetrag hängt an der Zahl
 * der Bestellungen, also am Warenkorb; sein Anteil ist damit unabhängig von der
 * Höhe des Umsatzes.
 */
export function gebuehrenanteil(zahlwegId, warenkorbNetto) {
  const z = findeZahlweg(zahlwegId);
  if (!(warenkorbNetto > 0)) throw new Error('Der Gebührenanteil braucht einen Warenkorb');
  return z.prozent * (1 + UST) + z.fixEuro / warenkorbNetto;
}

/**
 * Die Kaskade für einen gegebenen Umsatz.
 *
 * @param {object} lage
 * @param {number} lage.umsatzNetto
 * @param {number} lage.rohmarge      Anteil, z. B. 0.35
 * @param {number} lage.werbeanteil   Anteil am Nettoumsatz, z. B. 0.10
 * @param {number} lage.fixkosten     € im Monat
 * @param {number} lage.warenkorbNetto
 * @param {string} zahlwegId
 */
export function kaskade(lage, zahlwegId) {
  const { umsatzNetto, rohmarge, werbeanteil, fixkosten, warenkorbNetto } = lage;
  if (!(umsatzNetto > 0)) throw new Error('Die Kaskade braucht einen Umsatz');

  const anteilGebuehr = gebuehrenanteil(zahlwegId, warenkorbNetto);
  const rohertrag = cent(umsatzNetto * rohmarge);
  const werbung = cent(umsatzNetto * werbeanteil);
  const gebuehren = cent(umsatzNetto * anteilGebuehr);
  const deckungsbeitrag = cent(rohertrag - werbung - gebuehren);

  return {
    zahlweg: zahlwegId,
    umsatzNetto,
    wareneinsatz: cent(umsatzNetto * (1 - rohmarge)),
    rohertrag,
    werbung,
    gebuehren,
    deckungsbeitrag,
    fixkosten,
    gewinnVorSteuer: cent(deckungsbeitrag - fixkosten),
    deckungsbeitragsrate: rohmarge - werbeanteil - anteilGebuehr,
    bestellungen: Math.ceil(umsatzNetto / warenkorbNetto),
  };
}

/**
 * Dreht die Kaskade um: Welcher Umsatz trägt die Zielgröße?
 *
 * Geschlossen lösbar, weil alle drei Abzüge Anteile am Nettoumsatz sind — der
 * Fixbetrag der Zahlungsgebühr hängt an der Bestellzahl und die wiederum am
 * Umsatz, sodass sich sein Anteil herauskürzt.
 */
export function noetigerUmsatz(ziel, zahlwegId) {
  const { zielgewinn, fixkosten, rohmarge, werbeanteil, warenkorbNetto, umsatzProSession = null } = ziel;

  const rate = rohmarge - werbeanteil - gebuehrenanteil(zahlwegId, warenkorbNetto);
  if (rate <= 0) {
    return { tragfaehig: false, rate, grund: 'Nach Werbung und Gebühren bleibt nichts übrig' };
  }

  const noetigerDeckungsbeitrag = zielgewinn + fixkosten;
  const umsatzNetto = cent(noetigerDeckungsbeitrag / rate);
  const bestellungen = Math.ceil(umsatzNetto / warenkorbNetto);

  return {
    tragfaehig: true,
    zahlweg: zahlwegId,
    rate,
    noetigerDeckungsbeitrag,
    umsatzNetto,
    bestellungen,
    sessions: umsatzProSession ? Math.ceil(bestellungen / umsatzProSession) : null,
  };
}

/**
 * Vergleicht die Zahlwege daran, was sie an zusätzlichem Umsatz kosten.
 *
 * Der Bezugspunkt ist Vorkasse — der Weg ohne Gebühr. Was darüber liegt, ist
 * der Preis des jeweiligen Zahlwegs, ausgedrückt nicht in Euro Gebühr, sondern
 * in Umsatz, den man dafür zusätzlich machen muss.
 */
export function mehrumsatzGegenVorkasse(ziel) {
  const grund = noetigerUmsatz(ziel, 'vorkasse');

  return ZAHLWEGE.filter((z) => z.id !== 'nachnahme')
    .map((z) => {
      const e = noetigerUmsatz(ziel, z.id);
      if (!e.tragfaehig) return { zahlweg: z.id, name: z.name, tragfaehig: false };
      return {
        zahlweg: z.id,
        name: z.name,
        umsatzNetto: e.umsatzNetto,
        bestellungen: e.bestellungen,
        mehrumsatz: cent(e.umsatzNetto - grund.umsatzNetto),
        mehrBestellungen: e.bestellungen - grund.bestellungen,
        tragfaehig: true,
      };
    })
    .sort((a, b) => (a.umsatzNetto ?? Infinity) - (b.umsatzNetto ?? Infinity));
}

/**
 * Was von einer einzelnen Bestellung übrig bleibt.
 *
 * Nimmt den gerechneten Warenkorb, nicht die Durchschnittsannahme — damit die
 * Rollenbindung aus `bedarf.js` und die Fracht je Lieferant tatsächlich
 * drinstehen.
 */
export function proBestellung(warenkorb, zahlwegId, werbeanteil) {
  const z = findeZahlweg(zahlwegId);
  const gebuehr = cent(warenkorb.summeBrutto * z.prozent + z.fixEuro);
  const werbung = cent(warenkorb.warenwertNetto * werbeanteil);

  return {
    zahlweg: zahlwegId,
    bruttobetrag: warenkorb.summeBrutto,
    umsatzsteuer: warenkorb.ust,
    warenwertNetto: warenkorb.warenwertNetto,
    frachtNetto: warenkorb.frachtNetto,
    wareneinsatz: warenkorb.einkaufNetto,
    rohertrag: warenkorb.deckungsbeitragNetto,
    werbung,
    gebuehr,
    bleibt: cent(warenkorb.deckungsbeitragNetto - werbung - gebuehr),
    // Was von der ausgewiesenen Rohmarge nach allem übrig ist.
    margeNachAllem:
      warenkorb.warenwertNetto > 0
        ? cent(warenkorb.deckungsbeitragNetto - werbung - gebuehr) / warenkorb.warenwertNetto
        : 0,
  };
}
