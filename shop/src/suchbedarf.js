/**
 * Wie viele Suchanfragen der Versuchsplan braucht — und was eine Messung
 * darüber sagt.
 *
 * ## Die Lücke, die `werbewirkung.js` offengelassen hat
 *
 * Die Abbruchregel steht: 299 Klicks schließen eine Kaufquote von 1 % aus,
 * 598 Klicks eine von 0,5 %. Bei 10 € Tagesbudget und 1,50 € Klickpreis wären
 * das 45 bzw. 90 Tage.
 *
 * **Diese Rechnung unterstellt, dass das Budget ausgegeben werden kann.** Sie
 * unterstellt also, dass im Liefergebiet überhaupt so oft gesucht wird. Fünf
 * Bezirke, ein Fachsortiment, Suchbegriffe wie „Kaminsystem einzügig" — ob
 * das 200 Klicks im Monat hergibt, ist die eine Zahl, die dieses Vorhaben
 * nicht selbst erzeugen kann.
 *
 * Was es kann, ist die Frage umdrehen:
 *
 * > **Nicht: „Reicht das gemessene Volumen?" — sondern: „Wie viel Volumen
 * > muss die Messung zeigen, damit der Plan aufgeht?"**
 *
 * Dann kommt die Schwelle aus dem Plan und nicht aus einer Zahl, die jemand
 * für plausibel hält. Genau daran krankt die alte Messliste: Ihre
 * Mindestvolumen (200 je Cluster, 2.000 kumuliert) stammen aus dem
 * Radonmodell, sind österreichweit gedacht und beantworten die Frage dieses
 * Modells nicht.
 *
 * ## Die eine Annahme, die von außen kommt
 *
 * `KLICKRATE` — der Anteil der Suchenden, die auf die Anzeige klicken. Diese
 * Zahl stammt **nicht** aus den Daten dieses Vorhabens; es gibt keine
 * geschaltete Anzeige, aus der sie abzulesen wäre. Sie steht deshalb als
 * **Band** und nicht als Wert, und jede Ausgabe zeigt alle drei Ränder. Wie
 * bei der Kaufquote gilt: Eine Spanne, die man sieht, ist ehrlicher als ein
 * Mittelwert, den man glaubt.
 */

/**
 * Klickraten, über die gerechnet wird — von vorsichtig bis günstig.
 *
 * Bewusst kein Mittelwert: Der Plan muss auch am unteren Rand tragen, sonst
 * trägt er nur im Prospekt.
 */
export const KLICKRATE = Object.freeze({
  vorsichtig: 0.03,
  mittel: 0.05,
  guenstig: 0.08,
  _herkunft: 'Erfahrungswert für Suchanzeigen auf spezifische Fachbegriffe in oberer Position. '
    + 'NICHT aus den Daten dieses Vorhabens — es gibt keine geschaltete Anzeige. Deshalb ein Band '
    + 'und kein Wert; beim ersten gemessenen Wert gehört es ersetzt.',
});

export const TAGE_JE_MONAT = 30;

/**
 * Wie viele Suchanfragen je Monat nötig sind, um eine Klickzahl zu erreichen.
 *
 * @param {number} klicks gewünschte Klicks je Monat
 * @param {number} klickrate Anteil (0,05 = 5 %)
 */
export function noetigesSuchvolumen(klicks, klickrate) {
  if (!(klicks >= 0)) throw new Error(`Klickzahl negativ: ${klicks}`);
  if (!(klickrate > 0 && klickrate <= 1)) throw new Error(`Klickrate außerhalb (0,1]: ${klickrate}`);
  return klicks / klickrate;
}

/**
 * Wie lange der Versuch **tatsächlich** dauert, wenn das Volumen begrenzt ist.
 *
 * Der Engpass ist entweder das Geld oder der Markt — was zuerst greift,
 * bestimmt die Dauer. Das Werkzeug nennt beide, damit sichtbar bleibt,
 * welcher von beiden gerade bindet.
 *
 * @param {object} p
 * @param {number} p.suchvolumenJeMonat gemessen, im Liefergebiet
 * @param {number} p.klickrate
 * @param {number} p.tagesbudget €
 * @param {number} p.klickpreis €
 * @param {number} p.schwelleKlicks aus `werbewirkung.abbruchschwelle`
 */
export function versuchsdauer({ suchvolumenJeMonat, klickrate, tagesbudget, klickpreis, schwelleKlicks }) {
  for (const [name, wert] of Object.entries({ tagesbudget, klickpreis, schwelleKlicks })) {
    if (!(wert > 0)) throw new Error(`${name} muss größer als null sein, ist ${wert}`);
  }
  if (!(suchvolumenJeMonat >= 0)) throw new Error(`Suchvolumen negativ: ${suchvolumenJeMonat}`);
  if (!(klickrate > 0 && klickrate <= 1)) throw new Error(`Klickrate außerhalb (0,1]: ${klickrate}`);

  const klicksAusBudget = (tagesbudget / klickpreis) * TAGE_JE_MONAT;
  const klicksAusMarkt = suchvolumenJeMonat * klickrate;
  const klicksJeMonat = Math.min(klicksAusBudget, klicksAusMarkt);
  // Welcher Engpass bindet? Bei Gleichstand der Markt: Er ist der, den man
  // nicht durch eine Entscheidung ändern kann.
  const engpass = klicksAusMarkt <= klicksAusBudget ? 'Markt' : 'Budget';

  return {
    klicksAusBudget,
    klicksAusMarkt,
    klicksJeMonat,
    engpass,
    // Ohne Klicks gibt es kein Ende — und `Infinity` ist hier die richtige
    // Antwort und keine Panne: Der Versuch endet nie von selbst.
    monateBisSchwelle: klicksJeMonat > 0 ? schwelleKlicks / klicksJeMonat : Infinity,
    ausgegebenBisSchwelle: schwelleKlicks * klickpreis,
    // Was vom Budget übrig bleibt, wenn der Markt bindet — das Geld, das man
    // einplant und nicht ausgeben kann.
    ungenutztesBudgetJeMonat: Math.max(0, (klicksAusBudget - klicksJeMonat) * klickpreis),
  };
}

/**
 * Der Bedarf zu einem Versuchsplan, über das ganze Klickratenband.
 *
 * @returns {{klickrate: number, name: string, noetigesVolumen: number}[]}
 */
export function volumenbedarf(klicksJeMonat) {
  return Object.entries(KLICKRATE)
    .filter(([name]) => !name.startsWith('_'))
    .map(([name, klickrate]) => ({
      name,
      klickrate,
      noetigesVolumen: noetigesSuchvolumen(klicksJeMonat, klickrate),
    }));
}
