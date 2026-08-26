/**
 * Skonto und Gate 21 — der Ertragshebel, der an einer Frist hängt.
 *
 * Eigenes Modul, weil zwei Seiten ihn brauchen und sie sonst im Kreis
 * verwiesen: `kostenbild.js` rechnet mit dem Skonto den Deckungsbeitrag,
 * `zahlung.js` prüft die Zahlwege gegen die Frist — und `kostenbild.js`
 * liest bereits die Zahlwege. Ein Ringschluss lässt sich in ESM zwar
 * auflösen, aber nur so lange, wie niemand die Reihenfolge der Importe
 * ändert. Ein drittes Modul, das nichts von beiden weiß, ist billiger.
 *
 * `kostenbild.js` gibt die Namen unverändert weiter, damit bestehende
 * Importe gültig bleiben.
 */

import { cent } from './preis.js';


/**
 * Der Skontosatz, den beide bekannten Lieferanten einräumen.
 * Belegt aus den Poschacher-Rechnungen und dem Pramer-Angebot,
 * siehe `docs/baustoff-shop/zweiter-lieferant-und-skonto.md`.
 */
export const SKONTO_SATZ = 0.03;
export const SKONTO_FRIST_TAGE = 14;

/**
 * Was das Skonto am Einkauf spart.
 *
 * **Die Fracht ist nicht skontofähig.** Beide Lieferanten schreiben das
 * ausdrücklich auf den Beleg — bei Pramer als Sternchen an den betroffenen
 * Positionen, bei Poschacher als eigene Skontobasis, die unter dem
 * Rechnungsbetrag liegt. Wer den Satz auf die ganze Rechnung rechnet, hat
 * den Ertrag zu hoch angesetzt, und zwar systematisch — also in die
 * optimistische Richtung, wie die anderen vier Fehler dieses Vorhabens auch.
 *
 * @param {number} einkaufNetto  Warenwert beim Lieferanten, ohne Fracht
 * @param {number} satz          Anteil, z. B. 0.03
 */
export function skontoErsparnis(einkaufNetto, satz = SKONTO_SATZ) {
  if (satz < 0 || satz >= 1) throw new Error('Skontosatz muss zwischen 0 und 1 liegen');
  return cent(Math.max(0, einkaufNetto) * satz);
}

/**
 * **Gate 21: Das Zahlungsziel des Kunden darf die Skontofrist nicht
 * überschreiten.**
 *
 * Der Grund ist keine Feinheit, sondern die Rechnung aus
 * `zweiter-lieferant-und-skonto.md`: Drei Prozent Skonto heben die Rohmarge
 * von 25 auf 27,25 % und senken den nötigen Monatsumsatz um ein Siebtel —
 * mehr, als die Zahlungsgebühr kostet. Wer dem Kunden dreißig Tage einräumt
 * und dem Lieferanten in vierzehn zahlen will, finanziert die Differenz aus
 * eigener Kasse. Bei diesem Umsatz ist das der Unterschied zwischen sechzig
 * und siebzig Bestellungen im Monat.
 *
 * Vorkasse und Kartenzahlung erfüllen das Gate von selbst: Das Geld ist da,
 * bevor die Lieferantenrechnung fällig wird.
 *
 * **Berichtigung vom 26. August.** Hier stand: „Nur der Rechnungskauf kann
 * es verletzen — und genau der ist im Baustoffhandel üblich." Das wirft zwei
 * verschiedene Dinge zusammen. Der Rechnungskauf **über einen Anbieter**
 * zahlt sofort aus und hält die Frist mühelos; er kostet dafür eine Gebühr.
 * Was das Gate verletzt, ist die **offene Rechnung auf eigenes Risiko** —
 * dreißig Tage Ziel, keine Gebühr, das Geld kommt nach der Skontofrist.
 * Die beiden zu trennen ändert die Entscheidung, siehe
 * `docs/baustoff-shop/zahlungsziel-entschieden.md`.
 *
 * Maßgeblich ist deshalb nicht, was auf der Kundenrechnung als Ziel steht,
 * sondern **wann das Geld im eigenen Konto liegt**. Das ist bei jedem
 * Zahlweg das Feld `tageBisEingang`.
 */
export function zahlungszielTraegt({ kundenzielTage, skontofristTage = SKONTO_FRIST_TAGE, bearbeitungstage = 2 }) {
  if (!Number.isFinite(kundenzielTage) || kundenzielTage < 0) {
    throw new Error('Kundenzahlungsziel muss eine Zahl ab null sein');
  }
  // Zwischen Zahlungseingang und Überweisung an den Lieferanten liegt
  // Bearbeitungszeit. Sie zählt zur Frist, nicht daneben.
  const spaetesterAusgang = kundenzielTage + bearbeitungstage;
  const traegt = spaetesterAusgang <= skontofristTage;

  const gruende = [];
  if (!traegt) {
    gruende.push(
      `Zahlungsziel ${kundenzielTage} Tage plus ${bearbeitungstage} Tage Bearbeitung ` +
        `überschreitet die Skontofrist von ${skontofristTage} Tagen um ` +
        `${spaetesterAusgang - skontofristTage} Tage — das Skonto ist dann nicht zu holen, ` +
        'ohne die Differenz vorzufinanzieren.',
    );
  }

  return { traegt, kundenzielTage, skontofristTage, bearbeitungstage, spaetesterAusgang, gruende };
}

/**
 * Was ein Zahlweg je Bestellung kostet — und was er am Skonto rettet.
 *
 * Die Frage, an der die Wahl des Zahlwegs hängt, ist nicht „welche Gebühr
 * ist die niedrigste". Sie lautet: **Rettet die Gebühr mehr, als sie
 * kostet?** Ein Anbieter, der sofort auszahlt, hält die Skontofrist und
 * bringt damit 3 % des Einkaufs; er nimmt dafür einen Satz auf den
 * Bruttobetrag. Die beiden Prozentsätze sehen gleich aus und sind es nicht:
 *
 *   - Das Skonto rechnet auf den **Einkauf netto** — bei 25 % Marge sind
 *     das drei Viertel des Warenwerts, und die Fracht ist ausgenommen.
 *   - Die Gebühr rechnet auf den **Bruttobetrag** — Warenwert plus Fracht,
 *     plus 20 % Umsatzsteuer, die dem Finanzamt gehört und trotzdem
 *     mitverzinst wird.
 *
 * Die Bemessungsgrundlage der Gebühr ist damit **60 % größer** als die des
 * Skontos, wenn die Fracht wegfällt (1,2 W gegen 0,75 W), und bei der
 * Referenzbestellung mit 75,50 € Fracht **79 %** (865,80 € gegen 484,50 €).
 * Gleicher Prozentsatz heißt hier: deutliches Minus.
 *
 * @param {{warenwertNetto: number, frachtNetto?: number, einkaufNetto: number}} bestellung
 * @param {string} zahlwegId
 */
export function skontoGegenGebuehr(bestellung, zahlwegId, opt = {}) {
  const { warenwertNetto, frachtNetto = 0, einkaufNetto } = bestellung;
  const { skontoSatz = SKONTO_SATZ, ust = 0.2, bearbeitungstage = 2 } = opt;
  const z = opt.zahlweg ?? null;
  if (!z) throw new Error('skontoGegenGebuehr braucht den Zahlweg als opt.zahlweg');

  const frist = zahlungszielTraegt({ kundenzielTage: z.tageBisEingang, bearbeitungstage });
  // Ohne gehaltene Frist gibt es das Skonto nicht — nicht zum halben Satz,
  // nicht anteilig. Es ist eine Ja-Nein-Grösse.
  const skontoNetto = frist.traegt ? skontoErsparnis(einkaufNetto, skontoSatz) : 0;
  const bruttobetrag = cent((warenwertNetto + frachtNetto) * (1 + ust));
  const gebuehrBrutto = cent(bruttobetrag * z.prozent + z.fixEuro);

  return {
    zahlweg: zahlwegId,
    name: z.name,
    haeltFrist: frist.traegt,
    skontoNetto,
    gebuehrBrutto,
    // Positiv heisst: Der Weg bringt mehr, als er kostet.
    netto: cent(skontoNetto - gebuehrBrutto),
    bemessungSkonto: cent(einkaufNetto),
    bemessungGebuehr: bruttobetrag,
  };
}
