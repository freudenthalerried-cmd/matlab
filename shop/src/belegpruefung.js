/**
 * Die Belege durchsehen, die der Kunde bekommt.
 *
 * **Warum es diese Datei gibt.** Am 1. September habe ich eine erzeugte
 * Rechnung zum ersten Mal von oben nach unten gelesen — nicht als Testfall,
 * sondern als Kunde. Sie nannte 1.638,48 € Gesamtbetrag und schwieg darüber,
 * ob dieses Geld noch zu zahlen ist. Nach Punkt 9 der eigenen AGB ist es das
 * nie: Das Zahlungsziel ist null Tage, und im Ablauf steht die Rechnung nach
 * der Lieferung. Die Buchhaltung des Kunden hätte ein zweites Mal überwiesen.
 *
 * Gefunden hat das kein Prüfer, weil keiner hinsah:
 *
 * | Prüfer | liest |
 * | --- | --- |
 * | `pruefe-inhalte` | `inhalte/` und die gebauten Seiten |
 * | `pruefe-seiten` | die gebauten Seiten |
 * | `pruefe-widerrufe` | den **Quelltext** von `src/`, `bin/`, `inhalte/`, `docs/` |
 *
 * > **Der Beleg ist das einzige Kundendokument, das erst im Betrieb
 * > entsteht.** Ein Prüfer, der Quelltext liest, sieht die Bausteine; was aus
 * > ihnen zusammengesetzt beim Kunden ankommt, sieht er nicht.
 *
 * Also wird hier der **fertige Text** geprüft — genau der, der in den
 * Briefumschlag geht. Zwei Regeln, beide aus dem Befund:
 *
 *   1. **Kein Betrag ohne Zustand.** Wer eine Endsumme nennt, muss sagen, ob
 *      sie noch zu zahlen oder schon bezahlt ist. Ein Angebot sagt die
 *      Bedingung, eine Rechnung den Vermerk.
 *   2. **Kein widerrufener Satz.** Dieselbe Prüfung wie überall — aber ohne
 *      die Ausnahme „Widerruf in Sichtweite". Ein Beleg hat keine Fußnoten;
 *      was auf ihm steht, gilt.
 */

import { findeWiderrufe } from './widerruf.js';
import { ZAHLUNGSBEDINGUNGEN } from './rechtstexte.js';

/** Die Zeile, die eine Endsumme ausweist. */
export const SUMMENZEILE = /^Gesamtbetrag\s+[\d.,]+\s*€/m;

/**
 * Woran erkennt man, dass ein Beleg den Zustand seines Betrags nennt?
 *
 * Absichtlich mehrere Formulierungen je Belegart, nicht eine: Der Prüfer soll
 * die **Aussage** finden und nicht den Wortlaut, sonst steht er in einem Jahr
 * wieder da, wo das Frachtmuster am 27. August stand.
 */
export const ZUSTANDSAUSSAGE = Object.freeze({
  Angebot: /Zahlungsbedingung:|Zahlung bei Bestellung|Tage netto/,
  Auftragsbestätigung: /Zahlbar (?:sofort|innerhalb)/,
  Rechnung: /Bereits bezahlt|Zahlbar innerhalb|nicht (?:noch einmal |mehr )?überweisen/,
  // Die Anfrage nennt keine Endsumme zum Zahlen, sondern einen Preisstand.
  // Sie steht hier trotzdem, weil sie beim Kunden landet und damit unter die
  // zweite Regel fällt — und weil eine Belegart ohne Eintrag gemeldet wird.
  Kundenanfrage: /UNVERBINDLICHE ANFRAGE|keine Bestellung/,
  // Der Bestelltext geht an den Lieferanten, nicht an den Kunden. Er steht
  // hier trotzdem: Ein Außentext ist ein Außentext, und die zweite und dritte
  // Regel gelten für ihn wortgleich. Die Endsumme darauf ist der Einkauf und
  // keine Forderung an den Empfänger — die Zustandsaussage bezieht sich
  // deshalb auf den **Termin**, der bestellt sein muss.
  Lieferantenbestellung: /Gewünschte Lieferzeit:/,
});

/**
 * Eine Zeile, die nur aus einer Beschriftung und einem Doppelpunkt besteht.
 *
 * **Befund vom 1. September, zweiter Teil.** Der Bestelltext an den
 * Lieferanten ging ohne Telefonnummer hinaus mit der Zeile
 * `Ansprechpartner vor Ort:` — leer. Eine leere Angabe liest sich nicht als
 * Lücke, sondern als **Auskunft**: es gibt keinen. Die Spedition fährt
 * daraufhin trotzdem, findet eine verschlossene Baustelle, und die Ware geht
 * auf Kosten des Bestellers retour.
 *
 * Nicht jede solche Zeile ist falsch: `Lieferadresse (Baustelle):` ist eine
 * **Blocküberschrift**, ihr Wert steht eingerückt darunter. Der Unterschied
 * ist die Einrückung der nächsten Zeile mit Inhalt, und genau daran wird er
 * festgemacht — nicht an einer Liste erlaubter Beschriftungen, die niemand
 * pflegt.
 *
 * *Berichtigt beim ersten Lauf:* Die erste Fassung sah nur auf die unmittelbar
 * folgende Zeile und meldete deshalb „…an den unten genannten Endkunden:" —
 * einen Satz, dessen Aufzählung nach einer Leerzeile beginnt. Leerzeilen
 * werden jetzt übersprungen. Ein Prüfer, der bei der ersten Leerzeile aufgibt,
 * meldet die Absatzgestaltung als Fehler.
 */
export function leereAngaben(text) {
  const zeilen = text.split('\n');
  const treffer = [];
  for (const [i, zeile] of zeilen.entries()) {
    const m = /^(\s*)(\S.*?):[ \t]*$/.exec(zeile);
    if (!m) continue;
    const naechste = zeilen.slice(i + 1).find((z) => z.trim() !== '') ?? '';
    const tieferEingerueckt = naechste !== '' && /^\s*/.exec(naechste)[0].length > m[1].length;
    if (!tieferEingerueckt) treffer.push({ zeile: i + 1, beschriftung: m[2].trim() });
  }
  return treffer;
}

/**
 * Ein einzelner Beleg.
 * @param {{art: string, text: string}} beleg
 */
export function pruefeBeleg({ art, text }) {
  const meldungen = [];
  const musterFuerArt = ZUSTANDSAUSSAGE[art];

  if (musterFuerArt === undefined) {
    // Eine neue Belegart ohne Eintrag darf nicht stillschweigend durchlaufen.
    // Sonst ist die Lücke wieder genau dort, wo sie schon einmal war.
    meldungen.push({
      regel: 'belegart-unbekannt',
      text: `Belegart „${art}" ist in ZUSTANDSAUSSAGE nicht eingetragen — ungeprüft`,
    });
  } else if (SUMMENZEILE.test(text) && !musterFuerArt.test(text)) {
    meldungen.push({
      regel: 'betrag-ohne-zustand',
      text: 'Nennt eine Endsumme, sagt aber nicht, ob sie zu zahlen oder bezahlt ist',
    });
  }

  for (const l of leereAngaben(text)) {
    meldungen.push({
      regel: 'leere-angabe',
      zeile: l.zeile,
      text: `„${l.beschriftung}:" steht ohne Wert da — das liest sich als Auskunft, nicht als Lücke`,
    });
  }

  // Sichtweite 0: Auf einem Beleg gibt es keinen Platz, den Widerruf
  // danebenzuschreiben — der Satz muss weg, nicht erläutert werden.
  for (const fund of findeWiderrufe(text, { sichtweite: 0, kopfzeilen: 0 })) {
    meldungen.push({
      regel: 'widerrufene-aussage',
      zeile: fund.zeile,
      text: `„${fund.fundstelle}" — widerrufen ${fund.eintrag.widerrufenAm} (${fund.eintrag.belegt})`,
    });
  }

  return { art, meldungen, sauber: meldungen.length === 0 };
}

/**
 * Alle Belege eines Durchlaufs.
 * @param {{art: string, text: string}[]} belege
 */
export function pruefeBelege(belege) {
  if (!Array.isArray(belege) || belege.length === 0) {
    throw new Error('Ohne Belege gibt es nichts zu prüfen — ein leerer Durchlauf ist kein grüner.');
  }
  const befunde = belege.map(pruefeBeleg);
  return {
    befunde,
    geprueft: befunde.length,
    meldungen: befunde.reduce((n, b) => n + b.meldungen.length, 0),
    sauber: befunde.every((b) => b.sauber),
    zielTage: ZAHLUNGSBEDINGUNGEN.zielTage,
  };
}
