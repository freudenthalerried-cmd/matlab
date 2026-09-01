/**
 * Was das Werbebudget an Erkenntnis kauft — nicht nur an Klicks.
 *
 * ## Die Frage, die noch niemand gestellt hat
 *
 * Die Kampagne rechnet mit einer **Kaufquote von 2 %**, hilfsweise 1 %. Seit
 * dem 15. August steht in jedem Dokument derselbe Vorbehalt: *eine Annahme,
 * keine Messung.* Daraus folgt eine zweite Frage, die bisher niemand gestellt
 * hat:
 *
 * > **Wenn die Anzeigen einen Monat laufen und nichts verkaufen — was weiß
 * > man dann?**
 *
 * Nachgerechnet, und die Antwort ist unbequem: bei 10 € Tagesbudget und
 * 1,50 € Klickpreis rund 200 Klicks im Monat. Läge die wahre Kaufquote bei
 * 1 %, wäre die Wahrscheinlichkeit, in 200 Klicks **keinen einzigen**
 * Verkauf zu sehen, noch immer `0,99^200 ≈ 13 %`.
 *
 * Ein Monat ohne Verkauf widerlegt also nichts. Wer nach diesem Monat
 * abbricht, wirft in etwa jedem achten Fall ein funktionierendes Geschäft
 * weg; wer weiterzahlt, ohne die Schwelle vorher zu kennen, zahlt nach
 * Gefühl.
 *
 * **Ein Versuch ohne vorher festgelegte Abbruchschwelle ist kein Versuch,
 * sondern eine Hoffnung mit Rechnung.**
 *
 * ## Was hier gerechnet wird
 *
 * Klicks sind unabhängige Versuche mit gleicher Erfolgswahrscheinlichkeit
 * `q`. Die Wahrscheinlichkeit, in `n` Klicks keinen Verkauf zu sehen, ist
 * `(1 − q)^n`. Daraus die **Abbruchschwelle**: die kleinste Klickzahl, ab
 * der ein Ausbleiben jeder Bestellung die Quote `q` mit 95 % Sicherheit
 * ausschließt.
 *
 *     n = ln(0,05) / ln(1 − q)
 *
 * Bei q = 1 % sind das **299 Klicks**. Bei q = 2 % **149**.
 *
 * ## Was das Modell nicht kann
 *
 * Es unterstellt gleich gute Klicks von der ersten Minute an. Das ist die
 * **optimistische** Richtung, und zwar aus drei Gründen:
 *
 * - Google lernt anfangs; die ersten Klicks sind im Schnitt schlechter.
 * - Ein Kleinbudget schöpft die guten Suchanfragen nicht ab.
 * - Der Shop kann heute gar nichts verkaufen, sondern nur Anfragen erzeugen
 *   (`startklar`). Eine Anfrage ist kein Verkauf, und der Weg von der einen
 *   zum anderen ist hier nicht gemessen.
 *
 * Die errechnete Schwelle ist damit eine **Untergrenze der nötigen Klicks**,
 * nicht ihr Erwartungswert. Wer sie unterschreitet, weiß sicher nichts; wer
 * sie erreicht, weiß im günstigsten Fall etwas.
 */

/** Tage je Monat, wie in der übrigen Kampagnenrechnung. */
export const TAGE_JE_MONAT = 30;

/** Übliche Schranke für „ausgeschlossen". */
export const SICHERHEIT = 0.95;

/**
 * Die kleinste Klickzahl, ab der ausbleibende Verkäufe die Quote ausschließen.
 *
 * @param {number} quote Kaufquote als Anteil (0,01 = 1 %)
 * @param {number} sicherheit 0,95 heißt: 5 % Irrtumswahrscheinlichkeit
 */
export function abbruchschwelle(quote, sicherheit = SICHERHEIT) {
  if (!(quote > 0 && quote < 1)) throw new Error(`Kaufquote außerhalb (0,1): ${quote}`);
  if (!(sicherheit > 0 && sicherheit < 1)) throw new Error(`Sicherheit außerhalb (0,1): ${sicherheit}`);
  return Math.ceil(Math.log(1 - sicherheit) / Math.log(1 - quote));
}

/** Wahrscheinlichkeit, in `klicks` Klicks keinen einzigen Verkauf zu sehen. */
export function pKeinVerkauf(quote, klicks) {
  if (!(quote >= 0 && quote < 1)) throw new Error(`Kaufquote außerhalb [0,1): ${quote}`);
  if (!(klicks >= 0)) throw new Error(`Klickzahl negativ: ${klicks}`);
  return (1 - quote) ** klicks;
}

/**
 * Die größte Kaufquote, die nach `klicks` ohne Verkauf noch plausibel ist.
 *
 * Die Umkehrung der Abbruchschwelle: Nach 100 Klicks ohne Bestellung sind
 * Quoten über rund 3 % ausgeschlossen — darunter ist alles offen. Diese Zahl
 * ist das, was ein Fehlversuch tatsächlich **gezeigt** hat.
 */
export function nochPlausibleQuote(klicks, sicherheit = SICHERHEIT) {
  if (!(klicks > 0)) return 1;
  return 1 - (1 - sicherheit) ** (1 / klicks);
}

/**
 * Der ganze Versuchsplan zu einem Budget.
 *
 * @param {object} p
 * @param {number} p.tagesbudget  € je Tag, über alle Anzeigengruppen
 * @param {number} p.klickpreis   € je Klick, der tatsächlich gezahlt wird
 * @param {number} p.quote        die zu prüfende Kaufquote (0,01 = 1 %)
 * @param {number} p.deckungsbeitragJeVerkauf € je Bestellung
 */
export function versuchsplan({ tagesbudget, klickpreis, quote, deckungsbeitragJeVerkauf, sicherheit = SICHERHEIT }) {
  for (const [name, wert] of Object.entries({ tagesbudget, klickpreis, deckungsbeitragJeVerkauf })) {
    if (!(wert > 0)) throw new Error(`${name} muss größer als null sein, ist ${wert}`);
  }
  const klicksJeTag = tagesbudget / klickpreis;
  const klicksJeMonat = klicksJeTag * TAGE_JE_MONAT;
  const schwelle = abbruchschwelle(quote, sicherheit);
  const kosten = schwelle * klickpreis;
  const tage = schwelle / klicksJeTag;
  const werbekostenJeVerkauf = klickpreis / quote;

  return {
    klicksJeTag,
    klicksJeMonat,
    erwarteteVerkaeufeJeMonat: klicksJeMonat * quote,
    pKeinVerkaufImMonat: pKeinVerkauf(quote, klicksJeMonat),
    schwelleKlicks: schwelle,
    schwelleKosten: kosten,
    schwelleTage: tage,
    werbekostenJeVerkauf,
    deckungsbeitragJeVerkauf,
    // Trägt eine Bestellung ihre eigene Werbung? Dieselbe Frage wie Gate 20,
    // nur für den Klickkanal statt für die Fracht.
    traegt: deckungsbeitragJeVerkauf > werbekostenJeVerkauf,
    ueberschussJeVerkauf: deckungsbeitragJeVerkauf - werbekostenJeVerkauf,
  };
}

/* ------------------------------------------------------------------ *
 * Was der Plan sich leisten kann
 * ------------------------------------------------------------------ */

/**
 * Der Klickpreis, den das Modell bei einer gegebenen Kaufquote **tragen**
 * kann — und der Punkt, an dem er unter den Marktpreis fällt.
 *
 * ## Warum das die schärfste Fassung der offenen Frage ist
 *
 * Das Modell legt zwei Größen fest: den Werbeanteil am Umsatz (10 %) und die
 * Zahl der Bestellungen, die den Zielgewinn tragen (67). Daraus folgt das
 * Werbebudget. Wie viele **Besucher** man dafür braucht, hängt allein an der
 * Kaufquote — und damit auch, was ein einzelner Klick kosten darf:
 *
 *     leistbarer Klickpreis = Werbebudget ÷ (Bestellungen ÷ Kaufquote)
 *
 * Gerechnet am Stand vom 01.09. (4.340 € Budget, 67 Bestellungen):
 *
 * | Kaufquote | Besucher nötig | leistbarer Klick |
 * |---|---|---|
 * | 2,0 % | 3.350 | 1,30 € |
 * | 1,0 % | 6.700 | 0,65 € |
 * | **0,75 %** | 8.933 | **0,49 €** |
 * | 0,5 % | 13.400 | 0,32 € |
 *
 * Der Markt kostet 0,50 bis 2,50 € je Klick. **Unter etwa 0,75 % Kaufquote
 * kann sich das Modell den billigsten Klick nicht mehr leisten** — nicht
 * knapp, sondern grundsätzlich: Dann trägt der Klickkanal die Zielgröße bei
 * keinem Gebot mehr.
 *
 * Das ist keine Prognose. Es ist die Umrechnung der einen Zahl, die niemand
 * gemessen hat, in die Frage, die sie entscheidet.
 */
export function leistbarerKlickpreis({ werbebudgetJeMonat, bestellungen, quote }) {
  for (const [name, wert] of Object.entries({ werbebudgetJeMonat, bestellungen })) {
    if (!(wert > 0)) throw new Error(`${name} muss größer als null sein, ist ${wert}`);
  }
  if (!(quote > 0 && quote < 1)) throw new Error(`Kaufquote außerhalb (0,1): ${quote}`);
  const besucher = bestellungen / quote;
  return { besucher, klickpreis: werbebudgetJeMonat / besucher };
}

/**
 * Die Kaufquote, unter der das Modell den **günstigsten** Marktklick nicht
 * mehr trägt. Gelöst statt gesucht — die Beziehung ist linear in der Quote.
 */
export function quoteAmMarktboden({ werbebudgetJeMonat, bestellungen, marktUnten }) {
  if (!(marktUnten > 0)) throw new Error(`Der untere Marktklickpreis muss positiv sein, ist ${marktUnten}`);
  const { klickpreis } = leistbarerKlickpreis({ werbebudgetJeMonat, bestellungen, quote: 0.5 });
  // klickpreis(q) = Budget · q / Bestellungen — also linear; aus einem
  // Stützpunkt lässt sich die Nullstelle direkt bestimmen.
  return marktUnten * 0.5 / klickpreis;
}
