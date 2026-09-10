/**
 * Die Untergrenze auf den Kundenseiten — eine Zahl, ein Ort.
 *
 * **Anlass, 10. September 2026.** `inhalte/wissen/warum-keine-gratislieferung.md`
 * sagte dem Kunden im hervorgehobenen Kasten:
 *
 * > „Unter etwa **400 Euro** netto Warenwert lohnt eine Lieferung für keine
 * > der beiden Seiten."
 *
 * Verbindlich ist seit dem 3. September **250 €** netto Warenwert je
 * Lieferung (Gate 25, `data/betreiber.json`). Die Kasse nimmt ab 250 € an,
 * 67 gebaute Seiten nennen 250 €, und eine Seite nannte 400 €.
 *
 * Die 400 waren nicht erfunden: Sie sind der Nulldurchgang aus der
 * Kostenrechnung vom **25. August**, gerechnet mit 20 % Rohmarge — der
 * Lesart „25 % Zuschlag", die der Auftraggeber am **26. August** abgelöst
 * hat (`marge-25-prozent.md`). Mit 25 % Marge liegt derselbe Nulldurchgang
 * bei 317 € (EPS) bzw. 302 € (Vorkasse); mit den Nebenkosten, die erst am
 * 28. August auftauchten, wieder bei rund 400. Drei Rechnungen, drei Zahlen
 * — und keine davon ist die Grenze, die gilt.
 *
 * > **Eine Zahl, die eine Entscheidung trägt, gehört an die Stelle, die sie
 * > entschieden hat — nicht in den Satz, der sie einmal hergeleitet hat.**
 *
 * Der Befund war am 3. September schon einmal da: `gate25-mindestbestellwert.md`
 * führt ihn unter „Drei Zahlen für dieselbe Frage" auf und berichtigt die
 * **Lieferseite**. Die Wissensseite blieb stehen. Am 6. September hat ein
 * späterer Lauf sogar denselben Absatz angefasst — den Rat zur Abholung
 * herausgenommen — und die 400 danebenstehen lassen.
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 *
 * Deshalb dieses Modul: nicht die Seite berichtigen und weitergehen, sondern
 * die Regel messbar machen.
 *
 * **Was gemessen wird.** Jede Kundenfläche — die Quelltexte unter `inhalte/`
 * und die Absätze, die das Seitenbauwerkzeug selbst schreibt — darf einen
 * unteren Bestellwert nennen, und zwar genau den hinterlegten. Eine zweite
 * Zahl ist ein Befund, gleich wie gut sie hergeleitet ist.
 *
 * **Was ausdrücklich nicht gemessen wird.** Jeder Eurobetrag. Die Seiten
 * nennen Frachtpauschale (75,50 €), Kranentladung (7,50 €), Palette (22,00 €)
 * und die Kleinbetragsgrenze des § 11 UStG (400 € — dieselbe Ziffer, eine
 * ganz andere Sache). Getroffen wird nur der Betrag **innerhalb** einer
 * Grenzaussage, nicht jeder Betrag im selben Satz: Der erste Entwurf las den
 * ganzen Satz und meldete auf `lieferung.html` die Frachttabelle mit.
 *
 * **Keine Ausnahme über ein Berichtigungswort.** Im Verzeichnis darf eine
 * abgelöste Zahl stehen, wenn ihre Bedingung danebensteht — dort liest ein
 * Bearbeiter die Akte. Auf einer Kundenseite liest ein Bauleiter, was er
 * bestellen kann. Genau die Seite, um die es geht, trägt einen sauber
 * gesetzten Berichtigungsvermerk im selben Kasten; eine Ausnahme über
 * Berichtigungswörter hätte den Fund **gedeckt** statt gefunden.
 */

/**
 * Die Formen, in denen eine untere Bestellgrenze auf einer Seite steht.
 *
 * Jedes Muster fängt **den Betrag** ein und nicht den Satz. Die Abstände
 * (`{0,60}`) sind mit `[^.!?]` begrenzt: Ein Muster, das über den Punkt
 * hinausgreift, verbindet zwei Aussagen zu einer.
 */
export const GRENZAUSSAGEN = Object.freeze([
  Object.freeze({
    id: 'mindestbestellwert',
    muster: /Mindestbestellwert[^.!?]{0,60}?(\d[\d.]*(?:,\d+)?)\s*(?:€|EUR|Euro)/gi,
    form: 'Mindestbestellwert … Betrag',
  }),
  Object.freeze({
    id: 'unter-warenwert',
    muster: /\bunter\s+(?:etwa\s+|rund\s+|ca\.\s*)?(\d[\d.]*(?:,\d+)?)\s*(?:€|EUR|Euro)[^.!?]{0,60}?(?:netto\s+)?(?:Warenwert|Bestellwert)/gi,
    form: 'unter … Betrag … Warenwert',
  }),
  Object.freeze({
    id: 'ab-warenwert',
    muster: /\bab\s+(\d[\d.]*(?:,\d+)?)\s*(?:€|EUR|Euro)[^.!?]{0,60}?(?:netto\s+)?(?:Warenwert|Bestellwert)/gi,
    form: 'ab … Betrag … Warenwert',
  }),
]);

/**
 * Ein deutscher Betrag als Zahl. `1.250,00` sind tausendzweihundertfünfzig,
 * nicht eins Komma zwei fünf.
 */
export function betragAlsZahl(roh) {
  return Number(String(roh).replace(/\./g, '').replace(',', '.'));
}

/** Die Zeile, in der eine Fundstelle steht — aus dem Text, nicht aus einem Zähler. */
function zeileVon(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * Hält jede Grenzaussage gegen die eine hinterlegte Grenze.
 *
 * @param {{name: string, text: string}[]} dateien Kundenflächen — Quelltext
 *   aus `inhalte/` oder der eigene Text einer gebauten Seite.
 * @param {number|null} grenzeNetto `betreiber.mindestbestellwertNetto`.
 * @param {number} mindestens Wie viele Aussagen der Bestand mindestens
 *   trägt. Ein Lauf, der keine findet, ist kein grüner: Er hat nichts
 *   gemessen und sagt „sauber".
 */
export function untergrenzenbefund(dateien, grenzeNetto, mindestens = 1) {
  if (grenzeNetto === null || grenzeNetto === undefined) {
    return {
      messbar: false,
      grund: 'kein Mindestbestellwert hinterlegt (data/betreiber.json, mindestbestellwertNetto) — '
        + 'ohne die geltende Zahl ist auf den Seiten nichts zu vergleichen',
    };
  }
  const meldungen = [];
  let gefunden = 0;
  const flaechen = new Set();
  for (const { name, text } of dateien) {
    for (const aussage of GRENZAUSSAGEN) {
      const muster = new RegExp(aussage.muster.source, aussage.muster.flags);
      let treffer;
      while ((treffer = muster.exec(text)) !== null) {
        gefunden += 1;
        flaechen.add(name);
        const wert = betragAlsZahl(treffer[1]);
        if (wert === grenzeNetto) continue;
        meldungen.push({
          regel: 'abweichende-grenze',
          datei: name,
          zeile: zeileVon(text, treffer.index),
          form: aussage.form,
          wert,
          auszug: treffer[0].replace(/\s+/g, ' ').trim(),
          text: `nennt ${treffer[1]} € als untere Bestellgrenze — verbindlich sind `
            + `${grenzeNetto} € netto Warenwert je Lieferung (Gate 25, data/betreiber.json)`,
        });
      }
    }
  }
  if (gefunden < mindestens) {
    meldungen.push({
      regel: 'nichts-gemessen',
      datei: '—',
      zeile: 0,
      form: '—',
      wert: null,
      auszug: '',
      text: `nur ${gefunden} Grenzaussage(n) gefunden, erwartet mindestens ${mindestens} — `
        + 'ein Prüfer ohne Fundstellen meldet sauber über nichts',
    });
  }
  return {
    messbar: true,
    sauber: meldungen.length === 0,
    grenzeNetto,
    gefunden,
    flaechen: flaechen.size,
    meldungen,
  };
}
