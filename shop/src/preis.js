/**
 * Preis- und Margenrechnung.
 *
 * Bildet die Regeln ab, die in docs/baustoff-shop/ als Gates festgelegt wurden:
 *   Gate 7  Der Shop richtet sich an Unternehmer; alle Preise sind Nettopreise,
 *           die Umsatzsteuer wird getrennt ausgewiesen.
 *   Gate 20 Jede Bestellung muss einen positiven Deckungsbeitrag tragen,
 *           in Euro geprüft.
 *   Gate 22 Kein Verkaufspreis über dem Listenpreis des Lieferanten.
 *
 * **Berichtigt am 30.08.** Hier stand als erste Zeile „Gate 1 Rohmarge unter
 * 32 % ist unzulässig". Diese Regel ist seit dem 22. August abgelöst — Gate 20
 * prüft den Deckungsbeitrag je Bestellung in Euro, nicht die Marge je Artikel
 * in Prozent. `STATUS.md` führt die Ablösung; dieser Dateikopf tat es nicht
 * und behauptete eine Regel, die das Modul nicht mehr durchsetzt.
 *
 * Reine Rechenfunktionen, keine Dateizugriffe, keine Seiteneffekte.
 */

import { frachtGrundText } from './frachttext.js';

/**
 * **Zwei Margen, die nicht dasselbe messen** — und die zu verwechseln kostet
 * eine Fehlentscheidung.
 *
 * | | misst | Wert im Bestand |
 * |---|---|---|
 * | `ZIELMARGE` (`baustoffkatalog.js`) | was dieser Shop **nimmt**: die Spanne, mit der er kalkuliert | 25 %, Weisung vom 25.08. |
 * | `MARGENUNTERGRENZE` (hier) | was eine Lieferantenkondition **hergäbe**, verkauft man zur vollen Liste | Median 45 % Händlerrabatt |
 *
 * Gemessen am 30.08.: **kein einziger** der 46 Artikel erreicht 32 % erzielte
 * Rohmarge — sie liegen bei 25 %, weil der Shop mit 25 % kalkuliert. Wer das
 * für ein Reißen der Untergrenze hält, hält die Preisentscheidung für ein
 * Konditionenproblem. Die Konditionen sind gut: 37 der 42 Rabattsätze liegen
 * über 32 %.
 *
 * `MARGENUNTERGRENZE` ist deshalb **keine Verkaufsregel**, sondern der Maßstab
 * für die Antworten auf die dreizehn Anfragen (`auswertung.js`): Unter dieser
 * Kondition lohnt kein zweiter Lieferant.
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
 * Der Einkaufspreis einer Artikelposition — aus dem, was tatsächlich bekannt ist.
 *
 * Drei Lagen, in dieser Reihenfolge. Der Grund für die Reihenfolge steht in
 * `docs/baustoff-shop/katalog-aus-rechnungen.md`: Die echten Konditionen sind
 * **artikelgenau**, nicht lieferantengenau. Über sechsundvierzig Artikel einer
 * einzigen Lieferbeziehung reichen die Rabatte von zehn bis achtundachtzig
 * Prozent. Ein Satz je Lieferant hätte den Einkauf bei Kleinteilen um mehr als
 * den Faktor zwei danebengelegt — und zwar nach unten, also in die
 * optimistische Richtung.
 *
 *   1. `ekNetto` am Artikel — ein bestätigter Nettopreis. Manche Positionen
 *      werden ohne Liste fakturiert (Projekt- oder Aktionspreis); dann gibt es
 *      keinen Rabattsatz, aus dem sich etwas ableiten ließe.
 *   2. Rabattsatz am Artikel auf dessen Liste.
 *   3. Rabattsatz des Lieferanten — die alte Annahme, jetzt nur noch Rückfall.
 */
export function artikelEinkauf(artikel, lieferant) {
  if (typeof artikel.ekNetto === 'number') {
    if (artikel.ekNetto <= 0) throw new Error(`Einkaufspreis von ${artikel.sku} muss positiv sein`);
    return cent(artikel.ekNetto);
  }
  const rabatt = artikel.haendlerrabattAufUvp ?? lieferant.haendlerrabattAufUvp;
  if (typeof rabatt !== 'number') {
    throw new Error(`Für ${artikel.sku} ist weder Einkaufspreis noch Rabattsatz bekannt`);
  }
  return einkaufspreis(artikel.uvpNetto, rabatt);
}

/**
 * Vollständige Kalkulation einer Artikelposition.
 * Liefert alles, was Shop und Prüfung brauchen — inklusive der Gate-1-Ampel.
 *
 * Zur Deckelung auf die Liste: `verkaufspreis` setzt den Verkaufspreis nie über
 * `uvpNetto`. Bei den Artikeln, deren Einkauf nah an der Liste liegt, greift der
 * Deckel — und die ausgewiesene Rohmarge fällt unter die Zielmarge. Das ist
 * kein Rechenfehler, sondern der Befund: Auf diesen Artikeln **gibt** es die
 * Zielmarge nicht. Wer sie trotzdem nimmt, verkauft über dem Listenpreis.
 * Fehlt eine Liste (Nettopreis), gibt es nichts zu deckeln.
 */
export function kalkuliere(artikel, lieferant, zielmarge) {
  const ekNetto = artikelEinkauf(artikel, lieferant);
  const deckel = typeof artikel.uvpNetto === 'number' ? artikel.uvpNetto : Infinity;
  const vkNetto = verkaufspreis(ekNetto, zielmarge, deckel);
  const marge = rohmarge(ekNetto, vkNetto);

  // Gegen den ungedeckelten Wunschpreis messen, nicht gegen die gerundete
  // Marge. Sonst entscheidet der Cent: 40 € Einkauf und 25 % Ziel ergeben
  // 53,333… €, gerundet 53,33 € — und daraus rechnet sich eine Marge von
  // 24,995 %, die eine Prüfung auf `>= 0,25` verfehlt. Die Zielmarge wäre
  // dann bei jedem zweiten Artikel „nicht erreicht", obwohl nichts sie
  // beschnitten hat außer der Rundung.
  const wunschVkNetto = verkaufspreis(ekNetto, zielmarge);

  return {
    sku: artikel.sku,
    bezeichnung: artikel.bezeichnung,
    lieferantId: artikel.lieferantId,
    uvpNetto: Number.isFinite(deckel) ? cent(deckel) : null,
    ekNetto,
    vkNetto,
    vkBrutto: cent(vkNetto * (1 + UST_SATZ)),
    deckungsbeitragNetto: cent(vkNetto - ekNetto),
    rohmarge: marge,
    margeErreicht: marge >= MARGENUNTERGRENZE - 1e-9,
    zielmargeErreicht: vkNetto >= wunschVkNetto - 1e-9,
    amListendeckel: Number.isFinite(deckel) && vkNetto >= cent(deckel) - 1e-9,
    ekIstPlatzhalter: artikel.ekQuelle !== 'bestaetigt',
  };
}

/**
 * Frachtkosten für die Positionen **eines** Lieferanten.
 *
 * Im Streckengeschäft liefert jeder Lieferant getrennt, also fällt Fracht je
 * Lieferant an — nicht je Bestellung. Das ist der Grund, weshalb ein
 * Warenkorb aus drei Quellen dreimal Fracht trägt.
 *
 * **Die Schwelle wird am Einkauf gemessen, nicht am Verkauf.** `freiHausAbNetto`
 * ist eine Kondition des Lieferanten uns gegenüber — die Frage im Anschreiben
 * lautet „ab welchem Auftragswert liefern **Sie** frachtfrei?". Maßgeblich ist
 * also der Wert unserer Bestellung, nicht der Rechnungsbetrag des Kunden. Bei
 * 35 % Zielmarge liegen die beiden rund 54 % auseinander; wer sie verwechselt,
 * gewährt Frachtfreiheit, die der Lieferant nicht gewährt, und zahlt die
 * Pauschale aus der eigenen Marge. Genau das hat diese Funktion getan.
 */
export function fracht(positionen, lieferant) {
  const regel = lieferant.fracht;

  // Zwei verschiedene Beträge, und sie dürfen nicht verwechselt werden.
  // `warenwertNetto` ist, was der Kunde für die Ware zahlt.
  // `bestellwertNetto` ist, was wir beim Lieferanten bestellen — der Wert, an
  // dem der Lieferant seine Schwellen misst.
  const warenwertNetto = cent(positionen.reduce((s, p) => s + p.vkNetto * p.menge, 0));
  const bestellwertNetto = cent(positionen.reduce((s, p) => s + p.ekNetto * p.menge, 0));

  if (regel.freiHausAbNetto != null && bestellwertNetto >= regel.freiHausAbNetto) {
    return {
      betragNetto: 0,
      grund: `frei Haus ab ${regel.freiHausAbNetto} € Bestellwert`,
      warenwertNetto,
      bestellwertNetto,
    };
  }

  const sperrgutPositionen = positionen.filter((p) => p.sperrgut).length;
  const betragNetto = cent(
    regel.pauschaleNetto + sperrgutPositionen * (regel.sperrgutZuschlagNetto ?? 0),
  );

  return {
    betragNetto,
    // **Umbenannt am 2. September.** Hier stand „Sperrgutzuschlag". Die
    // Seiten des Shops nennen dieselben 7,50 € durchgehend **Kranentladung
    // je Hub** — und das ist die Leistung, für die das Geld verlangt wird.
    // Ein Zuschlag ist ein Aufpreis, eine Kranentladung ist etwas, das
    // jemand tut. Zwei Namen für dieselbe Zahl sind dieselbe Familie wie
    // `PreOrder` gegen `InStock` am 28. August: Der Widerspruch fällt nicht
    // auf, weil beide Seiten für sich stimmen.
    grund: frachtGrundText(sperrgutPositionen),
    warenwertNetto,
    bestellwertNetto,
  };
}

/**
 * Prüft den Mindestbestellwert eines Lieferanten.
 *
 * Gemessen wird am **Bestellwert**, also an dem, was wir beim Lieferanten
 * einkaufen — nicht an dem, was der Kunde bezahlt. Der Unterschied ist bei 35 %
 * Zielmarge rund die Hälfte: Ein Warenkorb über 330 € Verkauf ist eine
 * Bestellung über 231 € Einkauf, und an einem Mindestbestellwert von 250 €
 * scheitert die zweite Zahl, nicht die erste.
 */
export function mindestbestellwertErfuellt(bestellwertNetto, lieferant) {
  const grenze = lieferant.mindestbestellwertNetto ?? 0;
  return {
    erfuellt: bestellwertNetto >= grenze,
    grenze,
    bestellwertNetto,
    fehlbetragNetto: cent(Math.max(0, grenze - bestellwertNetto)),
  };
}
