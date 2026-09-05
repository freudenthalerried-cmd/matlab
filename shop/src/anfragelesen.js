/**
 * Die Anfrage zurücklesen, die der Shop erzeugt hat.
 *
 * **Der Anlass, 3. September 2026.** Der Anfragebetrieb ist eine Stunde zuvor
 * gerechnet worden: vier Schritte, fünfzehn Minuten je Anfrage. Der erste
 * davon heißt „Anfrage lesen und den Positionen zuordnen" und kostet drei
 * Minuten — drei Minuten, in denen ein Mensch Artikelnummern und Mengen aus
 * einer Mail in den Shop zurücktippt.
 *
 * > **Das ist die eine Stelle, an der ein Tippfehler falsche Ware auf eine
 * > Baustelle bringt.**
 *
 * Der Text stammt aus diesem Shop; er hat ein Format, und das Format ist
 * geprüft. Also gehört er gelesen und nicht abgeschrieben.
 *
 * ## Warum die Menge aus der Rechnung kommt und nicht aus der Zeile
 *
 * Eine Position sieht so aus:
 *
 *     1 STK    Thermo-Trennstein …    POS-51967   255,91 €   255,91 €
 *
 * Bei langen Namen bricht der Text um, und **die Menge steht dann auf einer
 * anderen Zeile als die Artikelnummer.** Ein Mailprogramm darf zusätzlich
 * umbrechen, wo es will. Auf diese Anordnung zu bauen hieße, auf die
 * Zeilenbreite eines fremden Programms zu bauen.
 *
 * Deshalb kommt die Menge aus `Zeilensumme ÷ Einzelpreis` — beide stehen mit
 * der Artikelnummer auf **derselben** Zeile, und sie stehen dort, weil der
 * Beleg sie so setzt.
 *
 * ## Und warum der Leser nachrechnet, statt zu glauben
 *
 * Am Ende hält er die zurückgelesenen Positionen gegen die Summen, die im Text
 * stehen. Stimmen sie nicht überein, gibt er **nichts** zurück, sondern den
 * Grund. Ein Leser, der bei Abweichung rät, ist schlimmer als das Abtippen: Er
 * hat die Autorität einer Maschine und die Verlässlichkeit einer Vermutung.
 */

import { zahlAusText } from './format.js';

/** Eine Artikelnummer, wie dieser Shop sie schreibt: Buchstaben, Bindestrich, Ziffern. */
const ARTIKELNUMMER = /\b([A-Z][A-Z0-9]*-[A-Z0-9]+(?:-[A-Z0-9]+)*)\b/;

/** Ein Betrag mit Eurozeichen, wie ihn `euro()` setzt. */
const BETRAG = /([\d.]+,\d{2})\s*€/g;

/**
 * Liest die Positionen aus einem Anfragetext.
 *
 * @param {string} text  der Anfragetext, wie der Kunde ihn geschickt hat
 * @returns {{zeilen: {sku: string, menge: number}[], bezirk: string|null,
 *            genannt: {warenwert: number|null, brutto: number|null},
 *            meldungen: string[]}}
 */
export function lesePositionen(text) {
  const zeilen = [];
  const meldungen = [];

  for (const zeile of String(text ?? '').split('\n')) {
    const nummer = ARTIKELNUMMER.exec(zeile);
    if (!nummer) continue;
    const betraege = [...zeile.matchAll(BETRAG)].map((t) => zahlAusText(t[1]));
    // Eine Positionszeile trägt zwei Beträge: Einzelpreis und Zeilensumme.
    // Eine Summenzeile trägt einen — und keine Artikelnummer.
    if (betraege.length !== 2) {
      meldungen.push(`${nummer[1]}: die Zeile trägt ${betraege.length} Beträge statt zwei`);
      continue;
    }
    const [einzel, summe] = betraege;
    if (!(einzel > 0)) {
      meldungen.push(`${nummer[1]}: Einzelpreis ${einzel} — daraus lässt sich keine Menge rechnen`);
      continue;
    }
    // Zwei Nachkommastellen, wie `istMenge()` sie zulässt. Mehr wäre eine
    // Genauigkeit, die der Beleg gar nicht hergibt.
    const menge = Math.round((summe / einzel) * 100) / 100;
    if (!(menge > 0)) {
      meldungen.push(`${nummer[1]}: Menge ${menge} aus ${summe} ÷ ${einzel}`);
      continue;
    }
    zeilen.push({ sku: nummer[1], menge });
  }

  const bezirk = /Baustelle im Bezirk:\s*(.+)/.exec(text ?? '');
  const warenwert = /Warenwert\s+([\d.]+,\d{2})\s*€/.exec(text ?? '');
  const brutto = /Brutto gesamt\s+([\d.]+,\d{2})\s*€/.exec(text ?? '');

  return {
    zeilen,
    bezirk: bezirk ? bezirk[1].trim() : null,
    genannt: {
      warenwert: warenwert ? zahlAusText(warenwert[1]) : null,
      brutto: brutto ? zahlAusText(brutto[1]) : null,
    },
    meldungen,
  };
}

/**
 * Liest die Anfrage **und rechnet sie nach**.
 *
 * `rechne` ist die Funktion, die aus Zeilen einen Warenkorb macht — im Betrieb
 * `kundenWarenkorb`. Sie wird hereingereicht und nicht importiert: Dieser
 * Leser soll keine zweite Kalkulation kennen, sondern dieselbe benutzen.
 *
 * @returns {{gelesen: boolean, grund: string|null, zeilen: object[],
 *            bezirk: string|null, rechnung: object|null, meldungen: string[]}}
 */
export function leseAnfrage(text, rechne) {
  const roh = lesePositionen(text);
  const leer = { zeilen: roh.zeilen, bezirk: roh.bezirk, rechnung: null, meldungen: roh.meldungen };

  if (roh.zeilen.length === 0) {
    return { gelesen: false, grund: 'Keine Position gefunden — ist das ein Anfragetext dieses Shops?', ...leer };
  }
  if (roh.genannt.warenwert === null || roh.genannt.brutto === null) {
    return { gelesen: false, grund: 'Der Text nennt keine Summen — ohne sie ist nichts nachzurechnen.', ...leer };
  }

  let rechnung;
  try {
    rechnung = rechne(roh.zeilen);
  } catch (fehler) {
    return { gelesen: false, grund: `Der Warenkorb ließ sich nicht rechnen: ${fehler.message}`, ...leer };
  }

  // **Die eigentliche Zusicherung.** Zurückgelesen ist nur, was sich
  // nachrechnen lässt. Ein Cent Abweichung ist eine Abweichung: Sie bedeutet,
  // dass entweder der Preis sich geändert hat oder der Text nicht der ist, für
  // den er gehalten wird — und beides gehört angesehen, nicht überschrieben.
  const abweichungen = [];
  if (Math.abs(rechnung.warenwertNetto - roh.genannt.warenwert) > 0.005) {
    abweichungen.push(`Warenwert: Text ${roh.genannt.warenwert} €, nachgerechnet ${rechnung.warenwertNetto} €`);
  }
  if (Math.abs(rechnung.bruttoGesamt - roh.genannt.brutto) > 0.005) {
    abweichungen.push(`Brutto: Text ${roh.genannt.brutto} €, nachgerechnet ${rechnung.bruttoGesamt} €`);
  }
  if (abweichungen.length) {
    return {
      gelesen: false,
      grund: `Die Summen stimmen nicht überein — ${abweichungen.join('; ')}. `
        + 'Möglich sind ein geänderter Preis oder ein veränderter Text; beides gehört angesehen.',
      ...leer,
      rechnung,
    };
  }

  return { gelesen: true, grund: null, ...leer, rechnung };
}
