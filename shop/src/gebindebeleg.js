/**
 * Der Gebindeschritt gegen die Lieferantenrechnungen.
 *
 * **Der Anlass, 4. September 2026.** Der Gebindeschritt ist der Wert mit dem
 * größten Hebel und der dünnsten Grundlage: Er wird **aus dem Artikelnamen
 * gelesen** — „Capatect Putzgrund weiß 25 kg" ergibt 25. Von ihm hängen ab:
 * die kleinste bestellbare Menge, der Preis je Gebinde auf der Artikelseite,
 * das Aufrunden im Warenkorb, die Frachtschwelle und seit dem 3. September der
 * Satz „angenommen wird eine Anfrage ab 450 kg".
 *
 * > **Eine Zahl, die aus einer Zeichenkette gelesen wird und fünf Rechnungen
 * > trägt, gehört gegen etwas gehalten, das nicht dieselbe Zeichenkette ist.**
 *
 * Das gibt es: In `preise/poschacher-positionen.csv` stehen 70 tatsächlich
 * fakturierte Positionen mit **Menge und Einheit**. Wird ein Artikel nur in
 * ganzen Gebinden abgegeben, sind alle Mengen Vielfache des Schritts.
 *
 * ## Die Richtung, die entscheidbar ist
 *
 * `Schritt aus dem Namen` → `passt zu allen Rechnungsmengen?` Ein Verlesen
 * fällt sofort auf: Wer aus „25 kg" eine 20 liest, bekommt bei Mengen von 25,
 * 50 und 75 kg drei Abweichungen.
 *
 * ## Und die, die es nicht ist
 *
 * Umgekehrt aus den Mengen einen Schritt zu **erraten**, geht nicht. Der
 * größte gemeinsame Teiler von „einmal 3 Stück gekauft" ist 3 — und sagt über
 * ein Gebinde nichts.
 *
 * > **Ein größter gemeinsamer Teiler über eine einzige Beobachtung ist die
 * > Menge, die jemand einmal gekauft hat.**
 *
 * Von den 46 Artikeln haben 28 keinen Schritt aus dem Namen, und für keinen
 * davon geben die Rechnungen genug her: Die meisten stehen mit **einer**
 * Position da. Das ist kein Versäumnis dieser Prüfung, sondern der Grund,
 * warum die Artikelliste des Lieferanten mit ihrer Verpackungseinheit als
 * offener Punkt geführt wird.
 *
 * ## Gutschriften
 *
 * Sieben der 70 Positionen sind Gutschriften und tragen **negative** Mengen.
 * Sie zählen mit — eine Rückgabe geht in denselben Gebinden zurück, in denen
 * geliefert wurde —, werden aber eigens ausgewiesen. Eine Prüfung, die eine
 * Belegart still überspringt, meldet Grün über weniger, als sie behauptet.
 */

/** Ab wann zwei Zahlen als verschieden gelten. */
export const TOLERANZ = 1e-6;

/** Ist `menge` ein ganzzahliges Vielfaches von `schritt`? */
export function istVielfaches(menge, schritt) {
  if (!(schritt > 0)) return false;
  const n = Math.abs(menge) / schritt;
  return Math.abs(n - Math.round(n)) <= TOLERANZ * Math.max(1, n);
}

/**
 * Hält den gelesenen Gebindeschritt gegen die fakturierten Mengen.
 *
 * @param {{sku: string, bezeichnung: string, lieferantenArtikelnummer: string|number}[]} artikel
 * @param {{artikelnummer: string, menge: number, belegart: string}[]} positionen
 * @param {(artikel: object) => number|null} schrittVon
 */
export function pruefeGebindeGegenBelege(artikel, positionen, schrittVon) {
  const nachNummer = new Map(artikel.map((a) => [String(a.lieferantenArtikelnummer), a]));
  const mengen = new Map();
  let ohneArtikel = 0;
  let gutschriften = 0;

  for (const p of positionen) {
    const a = nachNummer.get(String(p.artikelnummer));
    if (!a) { ohneArtikel += 1; continue; }
    if (!Number.isFinite(p.menge)) {
      throw new Error(`Position zu ${p.artikelnummer} ohne lesbare Menge — eine Zeile, die niemand liest, ist keine Prüfung`);
    }
    if (p.menge < 0) gutschriften += 1;
    if (!mengen.has(a.sku)) mengen.set(a.sku, []);
    mengen.get(a.sku).push(p.menge);
  }

  const abweichungen = [];
  let geprueft = 0;
  const ohneSchritt = [];

  for (const [sku, liste] of mengen) {
    const a = nachNummer.get(String(artikel.find((x) => x.sku === sku).lieferantenArtikelnummer));
    const schritt = schrittVon(a);
    if (!schritt) { ohneSchritt.push({ sku, positionen: liste.length }); continue; }
    geprueft += 1;
    const daneben = liste.filter((m) => !istVielfaches(m, schritt));
    if (daneben.length) {
      abweichungen.push({ sku, bezeichnung: a.bezeichnung, schritt, mengen: daneben });
    }
  }

  return {
    artikelMitPositionen: mengen.size,
    geprueft,
    ohneSchritt,
    gutschriften,
    ohneArtikel,
    abweichungen,
    sauber: abweichungen.length === 0,
  };
}
