/**
 * Der Vorgang als Klammer.
 *
 * Bis hierher entstehen die Papiere eines Geschäfts nebeneinander: `baueAuftrag`
 * macht den Auftrag, `erzeugeBestellungen` die Lieferantenpapiere,
 * `erzeugeRechnung` den Beleg an den Kunden. Jede Funktion für sich ist geprüft.
 * **Was sie zusammenhält, ist bisher nur die Sorgfalt des Aufrufers.**
 *
 * Nachgewiesen, nicht befürchtet: Werden `erzeugeBestellungen` und
 * `erzeugeRechnung` mit den Daten zweier verschiedener Kunden aufgerufen — zwei
 * Aufrufe, zwei Objekte, ein Vertipper —, dann geht die Ware nach Innsbruck und
 * die Rechnung nach Linz. Beide Papiere sind für sich tadellos:
 * `pruefeRechnungsmerkmale` meldet `vollstaendig: true`, die Gegenprobe an der
 * Bestellung meldet `deckungsgleich: true`, weil sie nur gegen den Warenkorb
 * vergleicht. Keine bestehende Sperre sieht etwas.
 *
 * Dass es heute nicht passiert, liegt allein an der Platzhaltersperre — und die
 * fällt, sobald der erste Hersteller echte Konditionen nennt. Sie ist keine
 * Sicherung gegen Verwechslung, sie ist eine gegen erfundene Preise.
 *
 * Diese Datei macht die Verwechslung **strukturell unmöglich**: Ein Vorgang wird
 * aus **einem** Satz Kundendaten gebaut, und alle Papiere gehen aus ihm hervor.
 * Wer zwei Kunden mischen will, muss zwei Vorgänge bauen — und die haben
 * verschiedene Nummern.
 */

import { baueAuftrag, pruefeBestelldaten } from './kunde.js';
import { erzeugeBestellungen, darfAutomatischAusgeloestWerden } from './bestellung.js';
import {
  erzeugeAngebot,
  erzeugeAuftragsbestaetigung,
  erzeugeRechnung,
  darfBestaetigtWerden,
  darfRechnungGestelltWerden,
} from './beleg.js';
import { lieferhinweise } from './rechtstexte.js';

/**
 * Baut den vollständigen Vorgang.
 *
 * Zeitpunkte und Nummern werden hereingereicht, nicht hier erzeugt — ein
 * Vorgang, der selbst auf die Uhr sieht oder selbst Nummern zieht, lässt sich
 * nicht prüfen und nicht wiederholen. Die Rechnungsnummer vergibt weiterhin die
 * Ablage, und zwar erst bei der Ausstellung.
 *
 * @param {object} eingabe
 * @param {string} eingabe.vorgangsnummer  Klammer über alle Papiere
 * @param {object} eingabe.kundendaten     **Ein** Satz Kundendaten für alles
 * @param {object} eingabe.warenkorb
 * @param {object} [eingabe.betreiber]
 * @param {string} [eingabe.datum]
 * @param {string} [eingabe.lieferdatum]
 * @param {string} [eingabe.rechnungsnummer]
 * @param {boolean} [eingabe.zahlungEingegangen]
 */
export function baueVorgang({
  vorgangsnummer,
  kundendaten,
  warenkorb,
  betreiber = {},
  datum = null,
  lieferdatum = null,
  rechnungsnummer = null,
  zahlungEingegangen = false,
  zahlung = {},
}) {
  if (!vorgangsnummer) throw new Error('Ein Vorgang braucht eine Nummer');

  const kundenpruefung = pruefeBestelldaten(kundendaten);
  const auftrag = baueAuftrag(vorgangsnummer, kundendaten, { zahlungEingegangen });
  auftrag.absender = { ...auftrag.absender, ...(betreiber.firma ? { firma: betreiber.firma } : {}) };

  // Derselbe normalisierte Datensatz für beide Richtungen. Das ist der ganze
  // Punkt dieser Datei: Es gibt nur einen, also kann nur einer verwendet werden.
  const kunde = { ...kundenpruefung.normalisiert };

  const bestellungen = erzeugeBestellungen(warenkorb, auftrag);
  const angebot = erzeugeAngebot(warenkorb, {
    nummer: `AN-${vorgangsnummer}`,
    datum,
    kunde,
    betreiber,
  });
  // Die Auftragsbestätigung trägt dieselben Hinweise, die der Kunde vor der
  // Bestellung gesehen hat. Ein Hinweis, der nur auf dem Bildschirm stand und
  // in keinem Papier steht, ist später nicht mehr auffindbar.
  const bestaetigung = erzeugeAuftragsbestaetigung(warenkorb, {
    nummer: `AB-${vorgangsnummer}`,
    datum,
    kunde,
    betreiber,
    auftrag,
    hinweise: lieferhinweise(auftrag),
  });
  // **Nachgezogen am 2. September.** `erzeugeRechnung` hat am Vormittag den
  // Zahlungsvermerk bekommen — den Satz, ohne den die Buchhaltung des Kunden
  // ein zweites Mal überweist. Die Klammer hier hat ihn nicht mitbekommen und
  // baute weiter Rechnungen ohne ihn. Gefunden hat es `npm run pruefe-kontrolle`
  // am Tag seiner Entstehung: „Zahlungsvermerk unbrauchbar — Kein Zahlweg".
  //
  // Fünfter Fall derselben Familie an zwei Tagen: Eine Regel wird an der einen
  // Stelle eingeführt und gilt an der anderen nicht, weil sie beim Schreiben
  // nicht im Blick war. Siehe `wo-die-regel-aufhoerte.md`.
  const rechnung = erzeugeRechnung(warenkorb, {
    nummer: rechnungsnummer,
    datum,
    lieferdatum,
    kunde,
    betreiber,
    zahlung,
  });

  return {
    vorgangsnummer,
    kunde,
    // Nicht mehr fest verdrahtet: Seit der Vorgang eine eigene Baustelle
    // führen kann, hängt die Annahme an den Daten. Die Klammer liest hier ab,
    // ob ihr Vergleich „Ware und Rechnung an dieselbe Firma" noch gilt — bei
    // abweichender Baustelle gilt er nicht, und genau dann würde er falsche
    // Alarme schlagen statt Fehler zu finden.
    lieferungAnRechnungsempfaenger: auftrag.lieferungAnRechnungsadresse,
    kundenpruefung,
    auftrag,
    warenkorb,
    bestellungen,
    angebot,
    bestaetigung,
    rechnung,
    freigabe: {
      kundendaten: kundenpruefung.gueltig,
      // Die Annahme steht bewusst vor der Bestellung: Erst binden, dann Geld
      // nehmen, dann auslösen. Vgl. AGB Punkt 2.
      // **Ergänzt am 4. September, spät.** Der Betreiber stand hier in der
      // Hand und wurde nicht weitergereicht — seit die Bestätigung die
      // Bankverbindung trägt, entscheidet er mit, ob sie hinaus darf.
      annahme: darfBestaetigtWerden(warenkorb, auftrag, betreiber),
      bestellung: darfAutomatischAusgeloestWerden(warenkorb, auftrag),
      rechnung: darfRechnungGestelltWerden(warenkorb, rechnung, auftrag),
    },
  };
}

/**
 * Darf dieser Vorgang als Ganzes laufen?
 *
 * Bewusst additiv über die bestehenden Sperren gelegt, nicht an ihre Stelle
 * gesetzt: Sie prüfen jede ihre eigene Sache, diese Funktion prüft, dass der
 * Vorgang zusammenhält. Beides wird gebraucht.
 */
export function darfVorgangLaufen(vorgang) {
  const gruende = [];

  if (!vorgang.kundenpruefung.gueltig) {
    gruende.push(...vorgang.kundenpruefung.fehler.map((f) => `Kundendaten: ${f}`));
  }
  if (!vorgang.freigabe.annahme.erlaubt) {
    gruende.push(...vorgang.freigabe.annahme.gruende.map((g) => `Annahme: ${g}`));
  }
  if (!vorgang.freigabe.bestellung.erlaubt) {
    gruende.push(...vorgang.freigabe.bestellung.gruende.map((g) => `Bestellung: ${g}`));
  }
  if (!vorgang.freigabe.rechnung.erlaubt) {
    gruende.push(...vorgang.freigabe.rechnung.gruende.map((g) => `Rechnung: ${g}`));
  }
  if (vorgang.bestellungen.length === 0) {
    gruende.push('Vorgang ohne eine einzige Lieferantenbestellung');
  }
  for (const b of vorgang.bestellungen) {
    if (!b.nummer.startsWith(vorgang.vorgangsnummer)) {
      gruende.push(`Bestellnummer ${b.nummer} gehört nicht zu Vorgang ${vorgang.vorgangsnummer}`);
    }
  }

  return { erlaubt: gruende.length === 0, gruende };
}

/**
 * Die Einträge, die dieser Vorgang in der Ablage hinterlässt.
 *
 * Alle tragen dieselbe Vorgangsnummer. Das ist die Voraussetzung dafür, dass
 * `vorgangsakte()` später die vollständige Akte liefert — und die braucht man
 * nicht erst bei einer Prüfung, sondern beim ersten Kunden, der anruft und
 * fragt, wo seine Ware bleibt.
 */
export function ablageEintraege(vorgang, zeitpunkt) {
  const eintraege = vorgang.bestellungen.map((b) => ({
    art: 'lieferantenbestellung',
    zeitpunkt,
    vorgang: vorgang.vorgangsnummer,
    betragNetto: b.einkaufNetto,
    text: b.betreff,
  }));

  eintraege.push({
    art: 'vermerk',
    zeitpunkt,
    vorgang: vorgang.vorgangsnummer,
    betragNetto: vorgang.warenkorb.summeNetto,
    betragBrutto: vorgang.warenkorb.summeBrutto,
    text: `Auftragsbestätigung an ${vorgang.kunde.firma} — Vertragsschluss nach AGB Punkt 2`,
  });

  eintraege.push({
    art: 'angebot',
    zeitpunkt,
    vorgang: vorgang.vorgangsnummer,
    betragNetto: vorgang.warenkorb.summeNetto,
    betragBrutto: vorgang.warenkorb.summeBrutto,
    text: `Angebot an ${vorgang.kunde.firma}`,
  });

  return eintraege;
}
