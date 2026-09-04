/**
 * Wie weit reicht der Betrieb — und wo hört er auf?
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg vom Klick bis zum Angebot
 * ist heute gebaut und in einem Befehl belegt: `npm run bestellprobe` fährt
 * Kasse, Empfangsskript, Ablage, Posteingang und Angebot.
 *
 * Danach hört er auf. Ein Geschäftsfall endet nicht beim Angebot, sondern beim
 * Zahlungseingang und der Aufbewahrung, und dazwischen liegen die Bestellung
 * beim Lieferanten, die Lieferung und die Rechnung.
 *
 * > **Der Plan sagt, wie der Shop online geht. Nichts sagt, wie ein
 * > Geschäftsfall zu Ende geht.** Die Werkzeuge dafür sind teils da, teils
 * > nicht, und welche fehlen, stand nirgends.
 *
 * Diese Liste ist keine Anleitung, sondern eine **Landkarte mit weißen
 * Flecken**: Sie führt die Schritte eines Geschäftsfalls, nennt je Schritt das
 * Werkzeug und das Gate, das dabei greift — und sagt bei jedem Schritt ohne
 * Werkzeug, **warum** es keines gibt. Ein Schritt ohne Werkzeug und ohne
 * Grund ist der Fund.
 *
 * ## Was hier nicht steht
 *
 * Der Weg **bis** zum ersten Kunden. Den rechnet `src/rollout.js` mit seinen
 * vierzehn Etappen und ihren Abhängigkeiten. Zwei Listen über dieselbe Sache
 * wären zwei Antworten; diese beginnt, wo jene endet.
 */

/**
 * Die Schritte eines Geschäftsfalls, in der Reihenfolge, in der sie eintreten.
 *
 * `werkzeug` ist der npm-Befehl, `gate` die Entscheidung, die dabei greift,
 * `warumOhneWerkzeug` der Pflichtgrund, wo keines existiert.
 */
export const SCHRITTE = Object.freeze([
  Object.freeze({
    id: 'bestellung-kommt-an',
    was: 'Der Kunde schickt die gerechnete Bestellung ab',
    werkzeug: 'bestellung.php (auf dem Hosting)',
    gate: 'Gate 25 — die Kasse nimmt unter 250 € netto keine Anfrage an',
  }),
  Object.freeze({
    id: 'posteingang',
    was: 'Die Bestellung wird gelesen und für den Beleg vorbereitet',
    werkzeug: 'npm run posteingang',
    gate: 'Gate 7 — ohne UID und Unternehmerbestätigung keine Nettorechnung',
  }),
  Object.freeze({
    id: 'angebot',
    was: 'Das Angebot mit Bindefrist entsteht und wird abgelegt',
    werkzeug: 'npm run vorgang -- --stufe angebot --ablegen',
    gate: 'Gate 20 — kein Vorgang ohne positiven Deckungsbeitrag',
  }),
  Object.freeze({
    id: 'annahme',
    was: 'Der Kunde nimmt an; die Auftragsbestätigung schließt den Vertrag',
    werkzeug: 'npm run vorgang -- --stufe bestaetigung --ablegen',
    gate: 'AGB Punkt 2 — der Vertrag entsteht mit der Auftragsbestätigung',
  }),
  Object.freeze({
    id: 'zahlung',
    was: 'Der Kunde zahlt; das Geld geht ein',
    werkzeug: null,
    gate: 'Gate 21 — Kundenzahlungsziel null Tage, Vorkasse und EPS',
    warumOhneWerkzeug: 'Der Zahlungseingang entsteht beim Zahlungsanbieter, und der ist nicht '
      + 'gewählt — eine Ausgabe und damit Sache des Auftraggebers. Ein Werkzeug, das ihn heute '
      + 'nachbildete, bildete einen Anbieter nach, den niemand kennt.',
  }),
  Object.freeze({
    id: 'lieferantenbestellung',
    was: 'Die Ware wird beim Lieferanten bestellt',
    werkzeug: null,
    gate: 'Gate 20 — erst nach Zahlungseingang, und nur mit bekannter Lieferzeit',
    warumOhneWerkzeug: '`erzeugeBestellungen` baut den Text seit dem 30. August, und '
      + '`npm run vorgang` zeigt ihn. Was fehlt, ist das Absenden: Es geht per Mail an einen '
      + 'Dritten, und das ist nach PARAMETER.md ausdrücklich dem Auftraggeber vorbehalten. '
      + 'Ein Werkzeug, das versendet, wäre gegen die Weisung gebaut.',
  }),
  Object.freeze({
    id: 'lieferung',
    was: 'Der Lieferant liefert auf die Baustelle',
    werkzeug: null,
    gate: 'Gate 23 — nur in die fünf Bezirke des Liefergebiets',
    warumOhneWerkzeug: 'Ein Vorgang in der Welt, kein Vorgang im Rechner. Was davon zählt, ist '
      + 'das Lieferdatum, und das trägt der Betreiber ein, wenn es feststeht.',
  }),
  Object.freeze({
    id: 'rechnung',
    was: 'Die Rechnung wird ausgestellt und bekommt ihre Nummer',
    werkzeug: null,
    gate: '§ 11 UStG — fortlaufend und einmalig, Pflichtangaben vollständig',
    warumOhneWerkzeug: '`erzeugeRechnung` und `stelleRechnungAus` sind gebaut und geprüft; die '
      + 'Nummer fällt erst bei der Ausstellung, damit kein abgebrochener Kauf eine verbrennt. '
      + 'Was fehlt, ist der Befehl, der beides zusammenführt — und ihm fehlen zwei Angaben, die '
      + 'kein Kommandozeilenwert sind: das **Lieferdatum** und der **Zahlungseingang**.',
  }),
  Object.freeze({
    id: 'aufbewahrung',
    was: 'Beleg und Journal bleiben sieben Jahre erhalten',
    werkzeug: 'ablage/ (gesperrt) und npm run pruefe-ablage',
    gate: '§ 132 BAO — sieben Jahre; § 131 BAO — nur ergänzen, nie ändern',
  }),
]);

/**
 * Der Befund über die Kette.
 *
 * `erreicht` ist der Punkt, an dem sie **zusammenhängend** aufhört — nicht die
 * Zahl der Schritte mit Werkzeug. Der Unterschied ist der Ertrag dieser Liste:
 * Die Aufbewahrung hat ein Werkzeug und liegt trotzdem jenseits der Lücke.
 */
export function kettenbefund(schritte = SCHRITTE) {
  const meldungen = [];
  for (const s of schritte) {
    if (!s.gate) meldungen.push({ regel: 'ohne-gate', text: `${s.id}: nennt kein Gate` });
    if (!s.werkzeug && (!s.warumOhneWerkzeug || s.warumOhneWerkzeug.length < 80)) {
      meldungen.push({
        regel: 'ohne-werkzeug-ohne-grund',
        text: `${s.id}: kein Werkzeug und kein tragfähiger Grund`,
      });
    }
    if (s.werkzeug && s.warumOhneWerkzeug) {
      meldungen.push({
        regel: 'grund-ohne-fall',
        text: `${s.id}: hat ein Werkzeug und begründet trotzdem, warum keines da ist`,
      });
    }
  }

  const ersteLuecke = schritte.findIndex((s) => !s.werkzeug);
  return {
    schritte: schritte.length,
    mitWerkzeug: schritte.filter((s) => s.werkzeug).length,
    erreicht: ersteLuecke === -1 ? schritte.length : ersteLuecke,
    ersteLuecke: ersteLuecke === -1 ? null : schritte[ersteLuecke],
    meldungen,
    sauber: meldungen.length === 0,
  };
}
