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
// Skonto und Gate 21 liegen in einem eigenen Modul, weil `zahlung.js` sie
// ebenfalls braucht und dieses Modul die Zahlwege liest — die Namen werden
// hier weitergereicht, damit bestehende Importe gültig bleiben.
import {
  SKONTO_SATZ, SKONTO_FRIST_TAGE, skontoErsparnis, zahlungszielTraegt, skontoGegenGebuehr,
} from './skonto.js';

export { SKONTO_SATZ, SKONTO_FRIST_TAGE, skontoErsparnis, zahlungszielTraegt };

/**
 * `skontoGegenGebuehr` mit nachgeschlagenem Zahlweg.
 *
 * Die Rechnung selbst steht in `skonto.js` und kennt die Zahlwege nicht —
 * sonst verwiesen die beiden Module im Kreis. Hier, wo beide Seiten bekannt
 * sind, wird der Weg nachgeschlagen und durchgereicht.
 */
export function zahlwegGegenSkonto(bestellung, zahlwegId, opt = {}) {
  return skontoGegenGebuehr(bestellung, zahlwegId, { ...opt, zahlweg: findeZahlweg(zahlwegId) });
}

export const UST = 0.20;

/**
 * Anteil der Zahlungsgebühr am **Nettoumsatz** (Warenwert).
 *
 * Die Gebühr fällt auf brutto an, gerechnet wird die Kaskade netto — der
 * Prozentsatz ist deshalb mit 1,2 zu strecken. Der Fixbetrag hängt an der Zahl
 * der Bestellungen, also am Warenkorb; sein Anteil ist damit unabhängig von der
 * Höhe des Umsatzes.
 *
 * **Und die Fracht gehört in die Bemessungsgrundlage.** Der Kundenzahlbetrag
 * enthält die durchlaufende Fracht; der Prozentsatz des Zahlwegs fällt auch
 * auf sie an. Genau dieser Effekt stand seit der ersten Fassung als Satz im
 * Kopf dieser Datei — „man zahlt Gebühr auf durchlaufende Fracht" — und
 * fehlte trotzdem in der Rechnung. `proBestellung` hatte ihn (dort steht der
 * volle `summeBrutto`), die Kaskade nicht: dieselbe Gebühr, zwei
 * Bemessungsgrundlagen, und der Fehler zeigte wie bei der Frachtschwelle und
 * der Brutto-UVP in die optimistische Richtung.
 */
export function gebuehrenanteil(zahlwegId, warenkorbNetto, frachtProBestellungNetto = 0) {
  const z = findeZahlweg(zahlwegId);
  if (!(warenkorbNetto > 0)) throw new Error('Der Gebührenanteil braucht einen Warenkorb');
  if (!(frachtProBestellungNetto >= 0)) throw new Error('Die Fracht je Bestellung darf nicht negativ sein');
  return (
    z.prozent * (1 + UST) * (1 + frachtProBestellungNetto / warenkorbNetto) +
    z.fixEuro / warenkorbNetto
  );
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
  const { umsatzNetto, rohmarge, werbeanteil, fixkosten, warenkorbNetto, frachtProBestellungNetto = 0 } = lage;
  if (!(umsatzNetto > 0)) throw new Error('Die Kaskade braucht einen Umsatz');

  const anteilGebuehr = gebuehrenanteil(zahlwegId, warenkorbNetto, frachtProBestellungNetto);
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
  const {
    zielgewinn,
    fixkosten,
    rohmarge,
    werbeanteil,
    warenkorbNetto,
    frachtProBestellungNetto = 0,
    umsatzProSession = null,
  } = ziel;

  const rate = rohmarge - werbeanteil - gebuehrenanteil(zahlwegId, warenkorbNetto, frachtProBestellungNetto);
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

/**
 * Gate 20 — trägt sich diese eine Bestellung selbst?
 *
 * Die Margenuntergrenze (Gate 1) war für den Streckenhandel mit
 * Herstellerkonditionen gesetzt: 32 % vom Verkauf, sonst fiel die Nische.
 * Mit eigenen Baumeister-Einkaufspreisen und 25 % Zuschlag (= 20 % Rohmarge)
 * ist das ein anderes Geschäft — Preisführerschaft statt Margenführerschaft.
 * An die Stelle einer Prozentschwelle tritt deshalb die härtere und zugleich
 * ehrlichere Bedingung: **Keine Bestellung ohne positiven Deckungsbeitrag.**
 *
 * Der Unterschied zu `deckungsbeitragNetto` im Warenkorb ist Absicht. Der
 * dortige Wert ist Warenwert minus Einkauf und behandelt die Fracht als
 * durchlaufend — das stimmt nur, wenn der Kunde sie zahlt. Sobald „frei Haus"
 * geworben wird, frisst die Fracht den Ertrag, und genau daran scheitern
 * kleine Warenkörbe: Bei 25 € Fracht und 20 % Rohmarge liegt der
 * Nulldurchgang bei rund 145 € Warenkorb. Siehe
 * `docs/baustoff-shop/rechnung-zum-zuschlag.md`.
 *
 * @param {object} warenkorb Ergebnis von `berechneWarenkorb`
 * @param {object} lage `{ zahlwegId, frachtVerrechnet }` — `frachtVerrechnet`
 *   false bedeutet: Lieferung frei Haus, die Fracht geht zu unseren Lasten.
 */
export function traegtSichSelbst(
  warenkorb,
  { zahlwegId = 'karte-stripe', frachtVerrechnet = true, skontoSatz = 0 } = {},
) {
  const z = findeZahlweg(zahlwegId);
  const warenwertNetto = warenkorb.warenwertNetto ?? 0;
  const einkaufNetto = warenkorb.einkaufNetto ?? 0;
  const frachtNetto = warenkorb.frachtNetto ?? 0;

  // Was der Kunde zahlt — die Fracht nur dann, wenn sie ihm verrechnet wird.
  const erloesNetto = cent(warenwertNetto + (frachtVerrechnet ? frachtNetto : 0));
  // Die Zahlungsgebühr fällt auf den Bruttobetrag an, den der Kunde zahlt.
  const gebuehrNetto = cent(erloesNetto * (1 + UST) * z.prozent + z.fixEuro);
  // Skonto mindert den Einkauf, nicht die Fracht — sie ist bei beiden
  // Lieferanten ausdrücklich nicht skontofähig. Voreinstellung ist null:
  // Wer das Skonto einrechnen will, muss sagen, dass er es auch zieht.
  const skontoNetto = skontoErsparnis(einkaufNetto, skontoSatz);
  const einkaufNachSkontoNetto = cent(einkaufNetto - skontoNetto);
  // Palette und Folierung — die Kosten, die auf den Belegen stehen und bis
  // zum 28. August in keiner Rechnung dieses Baus vorkamen. Sie werden dem
  // Kunden nicht verrechnet, also mindern sie den Deckungsbeitrag.
  //
  // Genommen wird die **Untergrenze** aus dem Warenkorb (`warenkorb.js`) und
  // nicht eine Schätzung: Die Stückzahl der Paletten hängt an Gewichten, die
  // für 39 von 46 Artikeln fehlen. Ein zu niedriger, aber belegter Abzug ist
  // brauchbar; ein geratener wäre es nicht. Gate 20 bleibt damit optimistisch
  // — aber nachweislich weniger als vorher, und es steht dabei, um wie viel.
  const nebenkostenNetto = cent(warenkorb.nebenkostenUntergrenzeNetto ?? 0);
  // Die Fracht schulden wir dem Frachtführer in jedem Fall.
  const deckungsbeitragNetto = cent(
    erloesNetto - einkaufNachSkontoNetto - frachtNetto - gebuehrNetto - nebenkostenNetto,
  );

  const gruende = [];
  if (deckungsbeitragNetto <= 0) {
    gruende.push(
      `Deckungsbeitrag ${deckungsbeitragNetto.toFixed(2)} € — die Bestellung trägt sich nicht` +
        (frachtVerrechnet ? '' : ' (Lieferung frei Haus: die Fracht geht zu unseren Lasten)') +
        (nebenkostenNetto > 0
          ? ` (davon ${nebenkostenNetto.toFixed(2)} € Palette und Folierung, die niemand weiterverrechnet)`
          : ''),
    );
  }

  return {
    traegt: deckungsbeitragNetto > 0,
    deckungsbeitragNetto,
    erloesNetto,
    einkaufNetto,
    skontoNetto,
    einkaufNachSkontoNetto,
    frachtNetto,
    gebuehrNetto,
    nebenkostenNetto,
    frachtVerrechnet,
    gruende,
  };
}

/**
 * Ab welchem Warenkorb trägt eine frei-Haus-Bestellung sich selbst?
 *
 * Beantwortet die Frage, die am Mindestbestellwert hängt: Unterhalb dieser
 * Schwelle ist eine gelieferte Bestellung ein Verlustgeschäft — unabhängig
 * davon, wie gut der Einkauf war.
 */
export function mindestwarenkorbFreiHaus({ rohmarge, frachtNetto, zahlwegId = 'karte-stripe' }) {
  if (!(rohmarge > 0 && rohmarge < 1)) throw new Error('Die Rohmarge muss zwischen 0 und 1 liegen');
  if (!(frachtNetto >= 0)) throw new Error('Die Fracht darf nicht negativ sein');
  const z = findeZahlweg(zahlwegId);
  // Warenwert w: w·rohmarge − fracht − (w·(1+UST)·prozent + fixEuro) > 0
  const rate = rohmarge - (1 + UST) * z.prozent;
  if (rate <= 0) return { erreichbar: false, grund: 'Die Rohmarge deckt nicht einmal die Zahlungsgebühr' };
  const schwelle = (frachtNetto + z.fixEuro) / rate;
  return { erreichbar: true, warenkorbNetto: cent(schwelle) };
}

