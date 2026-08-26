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
  // Die Fracht schulden wir dem Frachtführer in jedem Fall.
  const deckungsbeitragNetto = cent(erloesNetto - einkaufNachSkontoNetto - frachtNetto - gebuehrNetto);

  const gruende = [];
  if (deckungsbeitragNetto <= 0) {
    gruende.push(
      `Deckungsbeitrag ${deckungsbeitragNetto.toFixed(2)} € — die Bestellung trägt sich nicht` +
        (frachtVerrechnet ? '' : ' (Lieferung frei Haus: die Fracht geht zu unseren Lasten)'),
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

/* ------------------------------------------------------------------ *
 * Skonto — Gate 21
 * ------------------------------------------------------------------ */

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
 * bevor die Lieferantenrechnung fällig wird. Nur der Rechnungskauf kann es
 * verletzen — und genau der ist im Baustoffhandel üblich.
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
