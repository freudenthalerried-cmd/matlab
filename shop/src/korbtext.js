/**
 * Nennt der Referenzwarenkorb die Artikel, die er zusammenrechnet?
 *
 * **Der Anlass, 8. September 2026.** Der Korb der Gruppe Mauerwerk trug
 * `umfang: '128 Planziegel'` und `was: 'Planziegel'`. Geführt ist
 * `POS-29728 Ökotherm HL N+F` — ein **Hochlochziegel** mit Nut und Feder.
 *
 * Das Wort war am 6. September schon einmal zurückgenommen worden, zwölf
 * Zeilen weiter oben in derselben Datei: *„«Planziegel kaufen» entfällt: Ein
 * Planziegel ist plangeschliffen und wird im Dünnbett versetzt — ein anderes
 * Bauteil und ein anderer Arbeitsgang."* Gestrichen wurde das **Keyword**.
 *
 * > **Das Wort wurde an einer Stelle zurückgenommen und blieb an der, die
 * > rechnet.**
 *
 * `warenkorbText` baut daraus den Text, der nach Google geht — und weil bei
 * einer einzelnen Position Umfang und Sache aneinandergehängt werden, lautete
 * er wörtlich **„128 Planziegel Planziegel"**. Zwei Fehler in einer Zeile: das
 * falsche Bauteil und ein doppeltes Wort.
 *
 * Geprüft wird deshalb beides: dass jedes Wort eines Klartexts im Artikel
 * wiederzufinden ist, und dass der fertige Satz sich nicht wiederholt.
 */

/**
 * Klartexte, die im Artikelnamen nicht vorkommen — mit dem Grund.
 *
 * Der Lieferant benennt nach Marke und Bauform, der Kunde nach Verwendung.
 * Wo beides auseinandergeht, gehört der Grund hierher und nicht in den Kopf
 * dessen, der die Zeile geschrieben hat.
 */
export const OHNE_WORTDECKUNG = Object.freeze([
  Object.freeze({
    was: 'Perimeterdämmung XPS 80 mm',
    sku: 'POS-12575',
    warum: 'Der Lieferant nennt die Platte nach Bauform und Kante — „XPS glatt SF 80 mm". '
      + '„Perimeterdämmung" ist die **Verwendung**: erdberührt, druckfest, hinter der '
      + 'Abdichtung. Genau so heißt sie auf der Systemliste `kellerwand-perimeter`, und genau '
      + 'so sucht der Handwerker danach.',
  }),
  Object.freeze({
    was: 'Bögen',
    sku: 'POS-10115',
    warum: 'Mehrzahl mit Umlaut: Der Artikel heißt „PVC Kanalbogen", die Position im Korb '
      + 'zählt vier davon. Die Wortstammbildung führt „Bögen" und „Kanalbogen" nicht '
      + 'zusammen — das ist eine Eigenheit der Stammbildung und keine Abweichung in der '
      + 'Sache.',
  }),
]);

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const GRUND_MINDESTLAENGE = 150;

/**
 * Hält jeden Klartext des Korbs gegen den Artikel, den er benennt.
 *
 * @param {object} eingabe
 * @param {Record<string, {umfang: string, positionen: object[]}>} eingabe.koerbe
 * @param {Map<string, string>} eingabe.bezeichnungJeSku
 * @param {(text: string) => string[]} eingabe.staemme  Wortstämme wie in der Suche
 * @param {(korb: object) => string} eingabe.text  der fertige Korbtext
 */
export function korbtextbefund({
  koerbe, bezeichnungJeSku, staemme, text, ohneWortdeckung = OHNE_WORTDECKUNG,
}) {
  const meldungen = [];
  const benutzt = new Set();
  let geprueft = 0;

  for (const [gruppe, korb] of Object.entries(koerbe)) {
    for (const p of korb.positionen) {
      geprueft += 1;
      const ausnahme = ohneWortdeckung.find((o) => o.was === p.was && o.sku === p.sku);
      if (ausnahme) { benutzt.add(`${ausnahme.was}|${ausnahme.sku}`); continue; }

      const bezeichnung = bezeichnungJeSku.get(p.sku);
      if (bezeichnung === undefined) {
        meldungen.push({
          regel: 'position-ohne-artikel',
          gruppe,
          text: `${gruppe}: ${p.sku} steht im Korb und nicht im Katalog`,
        });
        continue;
      }
      const imArtikel = staemme(bezeichnung);
      const fehlt = staemme(p.was)
        .filter((w) => !imArtikel.some((b) => b.includes(w) || w.includes(b)));
      if (fehlt.length) {
        meldungen.push({
          regel: 'klartext-nennt-etwas-anderes',
          gruppe,
          text: `${gruppe}: „${p.was}" steht für ${p.sku} „${bezeichnung}" — `
            + `${fehlt.join(', ')} kommt darin nicht vor`,
        });
      }
    }

    /*
     * **Bei einer einzelnen Position hängt `warenkorbText` Umfang und Sache
     * aneinander** („40 Sack" + „Mörtel"). Steht die Sache schon im Umfang,
     * entsteht „128 Planziegel Planziegel" — und das ging so nach außen.
     */
    const satz = text(korb);
    const doppelt = doppeltesWort(satz);
    if (doppelt) {
      meldungen.push({
        regel: 'wort-doppelt',
        gruppe,
        text: `${gruppe}: „${satz}" nennt „${doppelt}" zweimal — der Umfang trägt die Sache `
          + 'schon, und der Klartext hängt sie noch einmal an',
      });
    }
  }

  for (const o of ohneWortdeckung) {
    if (!benutzt.has(`${o.was}|${o.sku}`)) {
      meldungen.push({
        regel: 'grund-ohne-position',
        gruppe: null,
        text: `„${o.was}" ist für ${o.sku} begründet und steht in keinem Korb mehr`,
      });
    }
    if (o.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({ regel: 'grund-zu-kurz', gruppe: null, text: `„${o.was}": der Grund ist zu knapp` });
    }
  }

  return {
    koerbe: Object.keys(koerbe).length,
    positionen: geprueft,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/** Das erste Wort, das in einem Satz zweimal vorkommt — oder null. */
export function doppeltesWort(satz) {
  const gesehen = new Set();
  for (const roh of String(satz).split(/[^\p{L}\p{N}]+/u)) {
    const w = roh.toLowerCase();
    if (w.length < 4) continue;
    if (gesehen.has(w)) return roh;
    gesehen.add(w);
  }
  return null;
}
