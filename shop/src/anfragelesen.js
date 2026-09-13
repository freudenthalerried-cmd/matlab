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
 * ## Und warum die Teilung allein nicht genügt — 13. September 2026
 *
 * Beide Zahlen sind auf **Cent gerundet** gedruckt. Die Teilung gibt die Menge
 * deshalb nur bis auf `0,005 ÷ Einzelpreis` zurück, und bei billiger Ware ist
 * das mehr als der Rundungsschritt der Menge selbst. Gemessen am Bestand:
 *
 * ```
 * POS-53402  Capatect Kantenschutz … 2,5 m   LFM   0,95 €
 *   bestellt  302,50 LFM  →  Zeilensumme 287,38 €  →  gelesen 302,51 LFM
 * ```
 *
 * > **Der Kunde bestellt 121 Stangen zu 2,5 m, und der Leser gibt eine Menge
 * > zurück, die kein ganzes Stück ist.**
 *
 * Die Nachrechnung am Ende sah nichts: `302,51 × 0,95` sind 287,3845 €, auf
 * Cent gerundet wieder 287,38 € — dieselbe Zahl, die im Text steht. Der
 * Fehler ist **kleiner als ein Cent in Geld und trotzdem eine andere Ware**.
 *
 * Was ihn auflöst, steht nicht in der Zeile, sondern im Katalog: Der Artikel
 * wird in Stangen zu 2,5 m abgegeben. Von allen Mengen, die dieselbe
 * Zeilensumme ergeben, ist nur ein **ganzes Vielfaches des Gebindes**
 * überhaupt lieferbar — und zwei benachbarte Vielfache trennt hier ein
 * Unterschied von 2,38 €, also weit mehr als der gedruckte Cent.
 *
 * `schrittFuer(sku)` wird deshalb hereingereicht, wie `rechne` auch: Dieser
 * Leser soll keinen zweiten Katalog kennen. Ohne Schritt bleibt es bei der
 * Teilung auf zwei Nachkommastellen — dann gibt es nichts, woran zu runden
 * wäre, und geraten wird nichts.
 *
 * ## Und warum der Leser nachrechnet, statt zu glauben
 *
 * Am Ende hält er die zurückgelesenen Positionen gegen die Summen, die im Text
 * stehen. Stimmen sie nicht überein, gibt er **nichts** zurück, sondern den
 * Grund. Ein Leser, der bei Abweichung rät, ist schlimmer als das Abtippen: Er
 * hat die Autorität einer Maschine und die Verlässlichkeit einer Vermutung.
 */

import { EUR, zahlAusText } from './format.js';

/*
 * Kaufmännisch auf Cent runden. **Bewusst hier und nicht aus `preis.js`**:
 * Dieser Leser hängt an keiner Kalkulation — er reicht `rechne` und
 * `schrittFuer` von außen herein. Ein Import zöge `preis.js` mit, und
 * `gebinde.js` trägt seit dem 29. August die Notiz, warum das ein Fehler
 * ist: Vier Zeilen Regel zwangen damals das ganze Modul ins Browserbündel.
 */
const cent = (b) => Math.round((b + Number.EPSILON) * 100) / 100;

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
export function lesePositionen(text, { schrittFuer = null } = {}) {
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
    const roh = summe / einzel;
    const schritt = schrittFuer ? schrittFuer(nummer[1]) : null;
    /*
     * **Auf das Gebinde einrasten — 13. September 2026.** Ohne diesen Schritt
     * las der Bestand `302,50 LFM` als `302,51` zurück: Die Teilung gibt die
     * Menge nur bis auf `0,005 ÷ Einzelpreis` her, und bei 0,95 € je Einheit
     * ist das mehr als der Rundungsschritt der Menge.
     */
    let menge;
    if (schritt > 0) {
      /*
       * Zuerst: Ist die Antwort überhaupt eindeutig? Zwei benachbarte
       * Vielfache trennt `schritt × einzel` an Zeilensumme. Liegt das unter
       * einem Cent, kann die gedruckte Zeile sie nicht auseinanderhalten —
       * und dann rät dieser Leser nicht, sondern sagt es.
       */
      if (cent(schritt * einzel) < 0.01) {
        meldungen.push(`${nummer[1]}: ein Gebinde zu ${schritt} kostet ${cent(schritt * einzel)} € `
          + '— weniger als der gedruckte Cent, die Menge ist aus dieser Zeile nicht eindeutig');
        continue;
      }
      const stueck = Math.round(roh / schritt);
      menge = cent(stueck * schritt);
      /*
       * Und die Probe: Nur eine Menge, die die **gedruckte** Zeilensumme auf
       * den Cent wiederherstellt, ist die gemeinte. Trifft kein ganzes
       * Gebinde sie, ist die Zeile nicht die dieses Shops — oder der Preis
       * hat sich geändert. Beides gehört angesehen, nicht überschrieben.
       */
      if (Math.abs(cent(menge * einzel) - summe) > 0.005) {
        meldungen.push(`${nummer[1]}: ${summe} € ÷ ${einzel} € sind ${roh.toFixed(4)} — `
          + `kein ganzes Gebinde zu ${schritt} trifft diese Zeilensumme`);
        continue;
      }
    } else {
      // Zwei Nachkommastellen, wie `istMenge()` sie zulässt. Mehr wäre eine
      // Genauigkeit, die der Beleg gar nicht hergibt.
      menge = Math.round(roh * 100) / 100;
    }
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
export function leseAnfrage(text, rechne, { schrittFuer = null } = {}) {
  const roh = lesePositionen(text, { schrittFuer });
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

/**
 * Kommt aus jeder Menge, die die Oberfläche bilden kann, dieselbe zurück?
 *
 * **Der Anlass, 13. September 2026.** Der Leser gibt es seit dem 3. September,
 * und er trägt seither den Satz über sich: *„Ein Leser, der bei Abweichung
 * rät, ist schlimmer als das Abtippen — er hat die Autorität einer Maschine
 * und die Verlässlichkeit einer Vermutung."* Geprüft war daran die
 * **Abweichung**: Stimmen die Summen nicht, gibt er nichts zurück.
 *
 * > **Nicht geprüft war der Fall, in dem die Summen stimmen und die Menge
 * > trotzdem eine andere ist.** Der Fehler war kleiner als ein Cent in Geld
 * > und trotzdem eine andere Ware.
 *
 * Diese Prüfung geht den Weg hin und zurück: Für jeden Artikel des Katalogs
 * und jede Menge, die die Oberfläche daraus bilden kann — ein ganzes
 * Vielfaches des Gebindes —, wird die Positionszeile gesetzt, wie der Beleg
 * sie setzt, und wieder gelesen. Zurückkommen muss **dieselbe** Zahl.
 *
 * Die Zeile wird hier absichtlich **nachgebaut und nicht aus dem Belegbauer
 * geholt**: Was der Leser braucht, sind Artikelnummer, Einzelpreis und
 * Zeilensumme auf einer Zeile. Käme sie aus derselben Funktion, prüfte diese
 * Probe nur noch, dass eine Formatierung sich selbst gleicht — und genau die
 * Rundung, um die es geht, geschieht **vor** dem Formatieren.
 *
 * @param {object[]} artikel  die Artikel in Kundensicht (`sku`, `bezeichnung`,
 *   `einheit`, `vkNetto`)
 * @param {(sku: string) => number|null} schrittFuer  der Gebindeschritt
 * @param {object} [lage]
 * @param {number} [lage.bis]  wie viele Gebinde je Artikel durchgerechnet werden
 * @param {(sku: string) => number|null} [lage.leseMit]  womit **zurückgelesen**
 *   wird. Standard ist `schrittFuer` — also derselbe Katalog, den der Betrieb
 *   benutzt. Getrennt führbar ist es, damit ein Testfall die Prüfung selbst
 *   prüfen kann: Ein Sweep, der auch über einem blinden Leser grün bleibt,
 *   deckt eine Strecke ab, auf der es nichts zu finden gibt.
 */
export function rueckwegbefund(artikel = [], schrittFuer = null, lage = {}) {
  const { bis = 200 } = lage;
  const leser = 'leseMit' in lage ? lage.leseMit : schrittFuer;
  const meldungen = [];
  let mengen = 0;
  let krumme = 0;
  let ohnePreis = 0;

  for (const a of artikel) {
    if (!(a.vkNetto > 0)) { ohnePreis += 1; continue; }
    /*
     * `gebinde` ist der **bekannte** Schritt oder `null`; `schritt` ist das,
     * woraus der Sweep seine Mengen baut. Bei Ware ohne Packungsangabe ist
     * jede ganze Einheit bestellbar — dort gibt es kein Gebinde, an dem
     * einzurasten wäre, und der Leser rundet auf zwei Nachkommastellen.
     */
    const gebinde = schrittFuer ? schrittFuer(a.sku) : null;
    const schritt = gebinde || 1;
    for (let n = 1; n <= bis; n++) {
      const menge = cent(n * schritt);
      const summe = cent(a.vkNetto * menge);
      // Genau die drei Angaben, an denen der Leser die Zeile erkennt.
      const zeile = `  ${a.sku}   ${EUR(a.vkNetto)}   ${EUR(summe)}`;
      const gelesen = lesePositionen(zeile, { schrittFuer: leser });
      mengen += 1;
      const zurueck = gelesen.zeilen[0]?.menge ?? null;
      if (zurueck === null) {
        meldungen.push({
          regel: 'menge-nicht-lesbar',
          sku: a.sku,
          text: `${a.sku}: ${menge} ${a.einheit ?? ''} ergeben die Zeilensumme ${EUR(summe)}, `
            + `und daraus kommt keine Menge zurück — ${gelesen.meldungen[0] ?? 'ohne Grund'}`,
        });
        continue;
      }
      if (Math.abs(zurueck - menge) > 1e-9) {
        meldungen.push({
          regel: 'menge-kommt-anders-zurueck',
          sku: a.sku,
          text: `${a.sku}: bestellt ${menge}, Zeilensumme ${EUR(summe)} bei ${EUR(a.vkNetto)} `
            + `je Einheit, zurückgelesen ${zurueck} — der Beleg nennt eine andere Ware als die `
            + 'bestellte, und in Geld ist der Unterschied kleiner als ein Cent',
        });
      }
    }

    /*
     * **Und die Gegenrichtung, einmal je Artikel.** Das Einrasten aufs Gebinde
     * ist eine Annahme über die Zeile. Eine Zeilensumme, die **kein** ganzes
     * Gebinde trifft — hier die Mitte zwischen zwei Vielfachen —, darf nicht
     * auf das nächste gerundet werden: Sie stammt dann aus einem geänderten
     * Preis oder aus einem fremden Text, und beides gehört angesehen.
     *
     * Ohne diese Richtung prüfte der Sweep oben nur, dass richtig Gerundetes
     * richtig zurückkommt — und eine Fassung, die **jede** Zahl rundet,
     * bestünde ihn.
     */
    if (gebinde > 0 && leser && leser(a.sku) > 0) {
      const dazwischen = cent(a.vkNetto * cent(gebinde / 2 + gebinde));
      const zeile = `  ${a.sku}   ${EUR(a.vkNetto)}   ${EUR(dazwischen)}`;
      const gelesen = lesePositionen(zeile, { schrittFuer: leser });
      krumme += 1;
      if (gelesen.zeilen.length) {
        meldungen.push({
          regel: 'krummer-betrag-wird-uebernommen',
          sku: a.sku,
          text: `${a.sku}: die Zeilensumme ${EUR(dazwischen)} liegt zwischen zwei ganzen `
            + `Gebinden zu ${gebinde}, und der Leser übernimmt daraus `
            + `${gelesen.zeilen[0].menge} — geraten statt gefragt`,
        });
      }
    }
  }

  return {
    artikel: artikel.length,
    ohnePreis,
    mengen,
    krumme,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
