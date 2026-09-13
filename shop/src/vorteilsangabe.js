/**
 * Der Abstand zur Liste — und wo er fehlt, warum.
 *
 * **Der Anlass, 10. September 2026.** Die Wissensseite *„Was Baumeisterpreis
 * heißt"* beantwortet die Frage „wo ist der Haken?" und sagt dabei zweimal
 * dasselbe:
 *
 * > *„…deshalb steht auf **jeder Artikelkarte**, wie weit der Preis unter der
 * > Liste des Lieferanten liegt."* · *„Sie steht auf **jeder Artikelkarte**,
 * > artikelweise und nachrechenbar, denn nur sie sagt etwas über Ihre
 * > Ersparnis."*
 *
 * Gemessen: **39 von 46**. Drei der sieben übrigen tragen „Beipack" — und die
 * Seite erklärt Beipack ausdrücklich als *kein Preisvorteil*, das ist die
 * Auskunft. **Vier trugen nichts.**
 *
 * Der Grund ist harmlos: Für sie ist kein Listenpreis des Lieferanten
 * bekannt. Genau deshalb gehört er auf die Karte — die zweite Redaktionsregel
 * dieses Shops lautet *„Fehlt der Beleg, fehlt der Wert — und die Seite sagt,
 * dass er fehlt."*
 *
 * > **Eine leere Stelle ist keine Auskunft: Sie sieht aus wie ein Artikel
 * > ohne Vorteil, und der Leser kann beides nicht unterscheiden.**
 *
 * Dieselbe Sorte wie der Merkblattsatz vom Nachmittag — nur steht diesmal
 * nicht zu viel auf der Seite, sondern zu wenig.
 */

/** Die drei Auskünfte, von denen eine auf jeder Artikelfläche stehen muss. */
export const AUSKUENFTE = Object.freeze([
  Object.freeze({
    id: 'vorteil',
    muster: /\d+\s*%\s*unter\s*Liste(?:npreis)?/i,
    was: 'der gemessene Abstand zur Liste des Lieferanten',
  }),
  Object.freeze({
    id: 'beipack',
    muster: /Beipack/i,
    was: 'Beipack — die Seite erklärt ihn als „kein Preisvorteil"',
  }),
  Object.freeze({
    id: 'listenpreis-offen',
    muster: /Listenpreis(?:\s+des\s+Lieferanten)?\s+nicht\s+bekannt/i,
    was: 'kein Listenpreis bekannt, und die Karte sagt es',
  }),
]);

/**
 * Zerlegt eine gebaute Seite in ihre Artikelkarten.
 *
 * Geschnitten wird an `class="karte"` und nicht an einem Element: Der
 * Kartenaufbau hat sich zweimal geändert, die Marke nicht — und eine Messung,
 * die an der Verschachtelung hängt, misst beim nächsten Umbau etwas anderes.
 */
export function karten(html) {
  const roh = String(html ?? '');
  const stellen = [...roh.matchAll(/class="karte"/g)].map((m) => m.index);
  return stellen.map((von, i) => roh.slice(von, stellen[i + 1] ?? roh.length));
}

/**
 * Trägt jede Artikelfläche eine der drei Auskünfte?
 *
 * @param {{name: string, html: string}[]} seiten gebaute Seiten
 * @param {number} mindestens Wie viele Karten der Bestand trägt
 */
export function vorteilsangabebefund(seiten = [], mindestens = 40) {
  const meldungen = [];
  let gesamt = 0;
  const nach = new Map(AUSKUENFTE.map((a) => [a.id, 0]));
  for (const { name, html } of seiten) {
    for (const karte of karten(html)) {
      gesamt += 1;
      const text = karte.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const treffer = AUSKUENFTE.find((a) => a.muster.test(text));
      if (treffer) { nach.set(treffer.id, nach.get(treffer.id) + 1); continue; }
      const sku = /artikel\/(POS-\d+)/.exec(karte);
      meldungen.push({
        regel: 'karte-ohne-auskunft',
        wo: `${name}${sku ? ` · ${sku[1]}` : ''}`,
        text: `${name} zeigt eine Artikelkarte${sku ? ` (${sku[1]})` : ''} ohne jede Auskunft über `
          + 'den Abstand zur Liste — weder die Zahl noch den Grund, warum keine dasteht',
      });
    }
  }
  if (gesamt < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-karten',
      wo: '—',
      text: `nur ${gesamt} Artikelkarten gefunden, erwartet mindestens ${mindestens} — `
        + 'ein Prüfer ohne Fundstellen meldet sauber über nichts',
    });
  }
  return { gesamt, nach: Object.fromEntries(nach), meldungen, sauber: meldungen.length === 0 };
}
