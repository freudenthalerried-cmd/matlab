/**
 * Wie alt ist die Preisbasis — und wo kostet das Geld?
 *
 * ## Der Befund vom 01.09.
 *
 * Der Shop rechnet jeden Verkaufspreis aus einem Einkaufspreis plus 25 %
 * Marge. Jeder dieser Einkaufspreise trägt einen `preisStand`, und der steht
 * auf den Artikelseiten, in der Preisliste und im Anfragetext. **Gemessen
 * wurde er nie.**
 *
 * ```
 * 2026-04-22    1 Artikel   132 Tage alt
 * 2026-05-26    6 Artikel    98 Tage alt
 * …
 * 2026-08-17    7 Artikel    15 Tage alt
 * ```
 *
 * Das ist keine Formalie. Hebt der Lieferant seine Preise an, ist der
 * Einkaufspreis von gestern die Marge von heute — und zwar nach unten. Der
 * Shop meldete weiterhin 25 %, Gate 20 rechnete weiterhin mit dem alten
 * Einstand, und die erste Bestellung trüge einen Ertrag, den es nicht gibt.
 *
 * **Ein Preis ohne Alter ist keine Zahl, sondern eine Erinnerung.**
 *
 * ## Warum 90 Tage — und warum das eine Setzung ist
 *
 * `data/lieferanten.json` führt `preisrhythmus: null`. Aus fünfzehn
 * Rechnungen ist er nicht ableitbar: Sie zeigen, wann *wir* gekauft haben,
 * nicht, wann *er* die Liste ändert. Die Grenze ist deshalb **gesetzt und
 * nicht gemessen** — ein Quartal, weil Baustoffpreislisten üblicherweise in
 * dieser Größenordnung fortgeschrieben werden.
 *
 * Sie steht hier als Zahl mit Begründung und nicht als stille Konstante,
 * damit sie sich austauschen lässt, sobald der Lieferant seinen Rhythmus
 * nennt. Diese Frage gehört auf dieselbe Liste wie die Lieferzeit und die
 * Artikelliste mit EAN-Spalte.
 *
 * ## Die Abstufung
 *
 * Nicht jeder alte Preis wiegt gleich schwer. Entscheidend ist, **wo Geld
 * darauf gesetzt wird**:
 *
 * | Lage | Urteil |
 * |---|---|
 * | kein `preisStand` | **Fehler** — unprüfbar zählt nicht als frisch |
 * | `preisStand` in der Zukunft | **Fehler** — ein Datum, das nicht sein kann |
 * | zu alt **und** im Referenzwarenkorb einer beworbenen Gruppe | **Fehler** — auf diese Marge wird geboten |
 * | zu alt, sonst | **Verdacht** — nachfragen, nicht sperren |
 *
 * Die dritte Zeile ist der ganze Grund für dieses Modul. Ein zu alter Preis
 * kostet nichts, solange niemand bestellt. Ein zu alter Preis **im
 * Referenzwarenkorb** kostet ab dem ersten bezahlten Klick, denn aus genau
 * diesem Korb rechnet das Kampagnenwerkzeug das Höchstgebot je Klick.
 *
 * **Erst gröber gedacht, dann nachgemessen.** Die erste Fassung eskalierte
 * jeden zu alten Artikel einer beworbenen *Gruppe*. Das traf den
 * Drehstiftdübel — 2,15 € Einkauf für hundert Stück, in keinem Keyword, in
 * keinem Referenzkorb — und hätte die WDVS-Kampagne wegen eines Dübels
 * angehalten. Eine Regel, die am ersten Tag den falschen trifft, wird am
 * zweiten abgeschaltet. Maßgeblich ist nicht, in welchem Regal ein Artikel
 * steht, sondern ob ein Gebot auf seinem Preis ruht.
 */

/** Ein Quartal. Gesetzt, nicht gemessen — siehe oben. */
export const GRENZE_TAGE = 90;

export const GRENZE_HERKUNFT = Object.freeze({
  wert: GRENZE_TAGE,
  art: 'gesetzt',
  grund: 'Der Preisrhythmus des Lieferanten ist unbekannt (lieferanten.json: preisrhythmus null) '
    + 'und aus den Rechnungen nicht ableitbar. Ein Quartal ist die übliche Fortschreibung von '
    + 'Baustoffpreislisten; die Zahl gehört ersetzt, sobald der Lieferant seinen Rhythmus nennt.',
});

const TAG_MS = 24 * 60 * 60 * 1000;

/**
 * Alter eines Preisstands in Tagen — oder `null`, wenn es keinen gibt.
 *
 * Gerechnet wird auf Kalendertagen in UTC, nicht auf Millisekunden: Ein
 * Preisstand ist ein Datum und keine Uhrzeit, und eine Sommerzeitumstellung
 * darf ein Alter nicht um eine Stunde und damit über eine Tagesgrenze
 * schieben.
 */
export function preisalterTage(preisStand, heute) {
  const s = String(preisStand ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dann = Date.parse(`${s}T00:00:00Z`);
  if (Number.isNaN(dann)) return null;
  const jetzt = Date.parse(`${String(heute).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(jetzt)) throw new Error(`Unbrauchbares Vergleichsdatum: ${heute}`);
  return Math.round((jetzt - dann) / TAG_MS);
}

/**
 * @param {object[]} artikel mit `sku`, `gruppe`, `bezeichnung`, `preisStand`
 * @param {string} heute ISO-Datum
 * @param {Set<string>|string[]} beworbeneSkus Artikelnummern, auf deren Preis
 *   ein Gebot ruht — die Positionen der Referenzwarenkörbe der Gruppen mit
 *   Anzeigen. **Pflichtangabe.** Eine Voreinstellung wäre die Stelle, an der
 *   ein Aufrufer die Verschärfung stillschweigend überspringt — und dann
 *   prüfte das Werkzeug genau dort nicht, wo es teuer wird.
 * @param {number} grenzeTage
 */
export function preisalterBefund({ artikel, heute, beworbeneSkus, grenzeTage = GRENZE_TAGE }) {
  if (beworbeneSkus === undefined) {
    throw new Error('preisalterBefund braucht die beworbenen Artikelnummern — ohne sie prüft die Verschärfung nichts.');
  }
  const beworben = new Set(beworbeneSkus);
  const fehler = [];
  const verdacht = [];
  const alter = [];

  for (const a of artikel) {
    const tage = preisalterTage(a.preisStand, heute);
    if (tage === null) {
      fehler.push({ sku: a.sku, gruppe: a.gruppe, bezeichnung: a.bezeichnung, tage: null,
        grund: 'kein Preisstand — unprüfbar zählt nicht als frisch' });
      continue;
    }
    if (tage < 0) {
      fehler.push({ sku: a.sku, gruppe: a.gruppe, bezeichnung: a.bezeichnung, tage,
        grund: `Preisstand ${a.preisStand} liegt in der Zukunft` });
      continue;
    }
    alter.push(tage);
    if (tage <= grenzeTage) continue;
    const eintrag = { sku: a.sku, gruppe: a.gruppe, bezeichnung: a.bezeichnung, tage,
      grund: `${tage} Tage alt (Grenze ${grenzeTage})` };
    if (beworben.has(a.sku)) {
      fehler.push({ ...eintrag, grund: `${eintrag.grund} — und auf diesen Preis ruht ein Gebot` });
    } else {
      verdacht.push(eintrag);
    }
  }

  const sortiert = [...alter].sort((x, y) => x - y);
  return {
    geprueft: artikel.length,
    grenzeTage,
    beworben: [...beworben].sort(),
    juengste: sortiert.length ? sortiert[0] : null,
    aelteste: sortiert.length ? sortiert.at(-1) : null,
    median: sortiert.length ? sortiert[Math.floor(sortiert.length / 2)] : null,
    fehler: fehler.sort((x, y) => (y.tage ?? Infinity) - (x.tage ?? Infinity)),
    verdacht: verdacht.sort((x, y) => y.tage - x.tage),
    sauber: fehler.length === 0,
  };
}
