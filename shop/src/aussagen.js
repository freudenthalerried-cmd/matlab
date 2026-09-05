/**
 * Aussagen über den eigenen Bestand, die auf **jeder** Fläche gleich falsch sind.
 *
 * **Warum sie hier stehen und nicht in `bin/kampagne.mjs` — 5. September 2026,
 * abends.** Beide Register sind aus Anzeigentexten entstanden und haben nur
 * Anzeigentexte gelesen. Auf der **Startseite** stand derweil, im ersten Satz
 * unter der Hauptüberschrift:
 *
 * > „Was ein Baumeister im Einkauf zahlt, **zahlen Sie auch**"
 *
 * Das ist wörtlich dieselbe Behauptung, die am selben Tag aus der
 * WDVS-Anzeige entfernt wurde („Ein Baumeister kauft ein, Sie zahlen seinen
 * Preis") — und sie stand auf der Seite, die jeder zuerst sieht.
 *
 * > **Der Prüfer, der dagegen gebaut wurde, las nur die Anzeigen.**
 *
 * Und ein zweites kam dazu: Über die 81 gebauten Seiten gelaufen, hätte er
 * **null** Treffer gemeldet. Die Muster kannten „zahlen … Preis", „zum
 * Einkaufspreis", „ohne Aufschlag" — die Gleichsetzung auf der Startseite ist
 * über das Wort „auch" gebaut und kommt ohne „Preis" aus.
 *
 * > **Ein Register aus Mustern, die aus einem beobachteten Fall abgeleitet
 * > sind, deckt genau diesen Fall.**
 */

/* ------------------------------------------------------------------ *
 * Aussagen über den Preis — 5. September 2026
 *
 * **Der Befund.** In der WDVS-Anzeige stand als Beschreibung 3:
 *
 * > „Ein Baumeister kauft ein, **Sie zahlen seinen Preis**."
 *
 * Die eigene Wissensseite `wissen/baumeisterpreis.md` — dieselbe, die von
 * jeder Artikelkarte verlinkt ist — beantwortet genau diese Frage im zweiten
 * Satz:
 *
 * > „Die Preise hier entstehen aus dem Einkauf eines Baumeisterbetriebs,
 * > **zuzüglich eines Aufschlags**, aus dem dieser Shop betrieben wird."
 *
 * Der Kunde zahlt nicht seinen Preis, sondern seinen Preis plus 25 %.
 *
 * > **Die Landeseite erklärt sorgfältig, warum die Aussage nicht stimmt, die
 * > die Anzeige macht, die auf sie führt.**
 *
 * Das ist keine Ungenauigkeit, sondern eine **Preisangabe in einer Werbung**
 * — die Gattung, bei der eine falsche Aussage nicht nur enttäuscht, sondern
 * eine Geschäftspraktik ist.
 *
 * **Nicht getroffen wird der Claim selbst.** „Zum Baumeisterpreis" ist die
 * Weisung des Auftraggebers, der Name der Website und durch eine eigene
 * Wissensseite eingeordnet („Was ‚Baumeisterpreis' heißt — und was nicht").
 * Getroffen wird die **Gleichsetzung**: Ihr Preis = sein Preis. Die Muster
 * sind deshalb eng und verlangen ein Wort der Gleichheit.
 *
 * Geprüft wird gegen `ZIELMARGE`, nicht gegen eine Liste: Wäre der Aufschlag
 * eines Tages null, hörte die Regel von selbst auf zu schlagen.
 * ------------------------------------------------------------------ */
export const PREISAUSSAGEN = Object.freeze([
  Object.freeze({
    muster: /\bzahlen\s+(?:Sie\s+)?(?:seinen|den|unseren)\s+(?:Einkaufs)?[Pp]reis\b/i,
    was: 'der Kunde zahle denselben Preis wie der Baumeister',
  }),
  Object.freeze({
    muster: /\bzum\s+Einkaufspreis\b|\bzum\s+Einstandspreis\b/i,
    was: 'der Verkaufspreis sei der Einkaufspreis',
  }),
  Object.freeze({
    muster: /\bohne\s+Auf(?:schlag|preis|geld)\b|\bkein\w*\s+Auf(?:schlag|preis)\b/i,
    was: 'es gebe keinen Aufschlag',
  }),
  // **Die Gleichsetzung ohne das Wort „Preis" — ergänzt am 5. September,
  // abends.** Die drei Muster darüber sind aus einem Anzeigentext abgeleitet
  // und trafen den Satz auf der Startseite nicht: „Was ein Baumeister im
  // Einkauf zahlt, zahlen Sie auch." Kein „Preis", kein „Einkaufspreis" —
  // die Behauptung hängt am Wort „auch".
  //
  // Eng gehalten: „zahlen Sie auch" allein wäre in einem Satz über die
  // Umsatzsteuer richtig. Verlangt wird deshalb ein Wort der Einkaufsseite
  // im selben Satz.
  Object.freeze({
    muster: /(Einkauf|Baumeister|Einstand)[^.!?]{0,90}\bzahlen\s+Sie\s+(auch|dasselbe|genauso|denselben)\b/i,
    was: 'der Kunde zahle dasselbe wie der Baumeister',
  }),
  Object.freeze({
    muster: /\bzahlen\s+Sie\s+(auch|dasselbe|genauso|denselben)\b[^.!?]{0,90}(Einkauf|Baumeister|Einstand)/i,
    was: 'der Kunde zahle dasselbe wie der Baumeister',
  }),
]);


/**
 * Wörter, die ein Vorrat behaupten, den es nicht gibt.
 *
 * **Befund vom 31.08.** Eine Überschrift lautete „XPS und EPS **ab Lager**".
 * `PARAMETER.md` legt fest: *Reines Streckengeschäft, kein eigenes
 * Warenlager.* Die Ware geht vom Lieferanten direkt auf die Baustelle.
 *
 * Im B2B-Baustoffhandel ist „ab Lager" keine Floskel, sondern eine
 * **Terminzusage** — der Bauleiter plant danach und stellt die Kolonne
 * darauf ein. Sie zu machen, ohne ein Lager zu haben, ist nicht bloß
 * ungenau; sie kostet den Kunden einen Tag.
 */
export const VORRATSWORTE = ['ab Lager', 'auf Lager', 'lagernd', 'sofort verfügbar', 'vorrätig', 'Lagerware'];

/**
 * Fundstellen auf gebauten Seiten, die stehen bleiben — mit dem Grund.
 *
 * **Der eine Fall, 5. September.** Beim ersten Lauf über die 81 Seiten meldete
 * die Vorratsregel `wissen/xps-oder-eps.html`:
 *
 * > „Welche Stärke die richtige ist, ergibt sich aus dem Wärmeschutznachweis
 * > des Bauvorhabens — nicht aus dem Preis und **nicht aus dem, was vorrätig
 * > ist**."
 *
 * Das ist eine **Verneinung** und das Gegenteil einer Zusage. In einer
 * Anzeigenüberschrift von dreißig Zeichen kommt das nicht vor; in einem
 * Fließtext sehr wohl — und das ist der Unterschied zwischen den beiden
 * Flächen, den die Regel beim Umzug mitbekommen musste.
 *
 * > **Ein Prüfer, der einen richtigen Satz anschwärzt, wird abgeschaltet.**
 *
 * Nicht über eine Verneinungserkennung gelöst: „nicht immer vorrätig, aber
 * meist" wäre eine Zusage und rutschte durch. Ein Verzeichnis zwingt zum
 * Begründen und wird in beide Richtungen gehalten.
 */
export const HINGENOMMENE_STELLEN = Object.freeze([
  Object.freeze({
    datei: 'wissen/xps-oder-eps.html',
    wort: 'vorrätig',
    warum: 'Der Satz sagt, dass die Plattenstärke sich aus dem Wärmeschutznachweis ergibt und '
      + '„nicht aus dem, was vorrätig ist" — eine Verneinung und damit das Gegenteil einer '
      + 'Vorratszusage. Er steht dort, um genau die Erwartung abzuräumen, gegen die die Regel '
      + 'gebaut ist.',
  }),
]);

/**
 * Sucht die Aussagen in einem Seitentext — Fundstellen mit Grund bleiben außen vor.
 *
 * @param {string} datei  Pfad relativ zu `ausgabe/site/`
 * @param {string} text   der Fließtext der Seite, nicht das Markup
 */
export function aussagenbefund(datei, text, hingenommen = HINGENOMMENE_STELLEN) {
  const meldungen = [];
  const gedeckt = (wort) => hingenommen.some((h) => h.datei === datei && h.wort === wort);

  // Eine Meldung je Seite, nicht je Muster: Ein Satz, der zwei Muster trifft,
  // ist ein Satz.
  const pa = PREISAUSSAGEN.find((x) => x.muster.test(text));
  if (pa && !gedeckt(pa.was)) meldungen.push({ regel: 'preisgleichheit', datei, was: pa.was });

  for (const wort of VORRATSWORTE) {
    if (!text.toLowerCase().includes(wort.toLowerCase())) continue;
    if (gedeckt(wort)) continue;
    meldungen.push({ regel: 'vorrat-ohne-lager', datei, was: wort });
  }
  return meldungen;
}

/** Was das Verzeichnis über sich selbst weiß — die Rückrichtung. */
export function stellenbefund(gefunden, hingenommen = HINGENOMMENE_STELLEN) {
  const meldungen = [];
  for (const h of hingenommen) {
    if (!h.warum || h.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', datei: h.datei, was: h.wort });
    }
    if (!gefunden.some((g) => g.datei === h.datei && g.wort === h.wort)) {
      meldungen.push({ regel: 'stelle-ohne-fall', datei: h.datei, was: h.wort });
    }
  }
  return meldungen;
}
