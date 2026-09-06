/**
 * Trägt der Referenzwarenkorb die Bestellung, die eine Suche auslöst?
 *
 * **Der Anlass, 6. September 2026.** Über `WARENKOERBE` steht seit dem
 * 1. September der Grund, aus dem es sie gibt:
 *
 * > *„Die großen Belege bestehen aus acht bis zwölf Positionen, nicht aus
 * > einer teuren. Wer je Artikel bietet, bietet auf den Ein-Sack-Kunden — und
 * > der ist bei keinem Klickpreis bezahlbar. Gerechnet wird deshalb auf die
 * > Bestellung, die eine Suche tatsächlich auslöst."*
 *
 * Gezählt, was die eigenen Systemlisten als Positionen des Bauteils führen und
 * was davon im Korb liegt:
 *
 * | Gruppe | Positionen | davon geführt | im Korb |
 * |---|---|---|---|
 * | WDVS | 10 | 9 | 5 |
 * | Kamin | 10 | 9 | 5 |
 * | Kanal | 8 | 5 | 4 |
 * | **Dämmung** | 7 | 4 | **1** |
 *
 * > **Die Regel steht über der Liste, und die Liste hält sie nicht.**
 *
 * Bei „Dämmung" liegt **eine von vier** geführten Positionen im Korb — genau
 * der Ein-Positionen-Korb, gegen den der Kommentar darüber anschreibt.
 *
 * ## Wohin der Fehler zeigt
 *
 * Der Deckungsbeitrag des Korbs trägt das Gebot. Ein zu kleiner Korb ergibt
 * ein zu kleines Gebot: **verlorene Auktionen, nicht verbranntes Geld.** Das
 * fällt in keiner Abrechnung auf — dieselbe stille Richtung wie beim
 * Ausschluss, der das Verkaufsargument traf.
 *
 * Und eine Stufe schärfer: Drei Anzeigengruppen sind **zurückgestellt**, weil
 * ihr Deckungsbeitrag 125 € Werbekosten je Verkauf nicht trägt. Diese
 * Entscheidung ist auf demselben Korb gerechnet.
 *
 * ## Was diese Prüfung verlangt
 *
 * Jede geführte Position der Systemliste liegt im Korb — **oder** der Korb
 * sagt, warum nicht. Ein Grund ist Pflicht und keine Höflichkeit: Die meisten
 * fehlenden Positionen fehlen zu Recht, weil ihre Menge an einem Verbrauchswert
 * oder an einem Bauwerk hängt, das der Korb nicht kennt.
 *
 * > **Eine geratene Menge im Korb ergäbe ein geratenes Gebot.**
 */

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const MINDESTGRUND = 40;

/** Die Positionszeilen einer Systemliste, in der Reihenfolge der Tabelle. */
export function positionen(markdown) {
  return [...String(markdown ?? '').matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/gm)]
    .map((m) => m[2].trim());
}

/** Ob eine Positionszeile als nicht geführt gekennzeichnet ist. */
export const nichtGefuehrt = (zeile) =>
  /\(nicht im Sortiment\)|\(nicht in Flächenstärke\)/.test(String(zeile ?? ''));

/** Der Name ohne die Kennzeichnung — so steht er im Korb. */
export const positionsname = (zeile) => String(zeile ?? '')
  .replace(/\*?\(nicht[^)]*\)\*?/g, '')
  .replace(/\*/g, '')
  .trim();

/**
 * Der Befund.
 *
 * @param {object} eingabe
 * @param {Record<string, {positionen: {position?: string}[], ohne?: {position: string, warum: string}[]}>} eingabe.koerbe
 * @param {Record<string, string>} eingabe.systemlisten  Gruppe → Markdown
 */
export function korbbefund({ koerbe, systemlisten }) {
  const meldungen = [];
  const uebersicht = [];

  for (const [gruppe, markdown] of Object.entries(systemlisten)) {
    const korb = koerbe[gruppe];
    if (!korb) {
      meldungen.push({
        regel: 'korb-fehlt',
        gruppe,
        text: `${gruppe}: Systemliste vorhanden, Referenzwarenkorb keiner`,
      });
      continue;
    }
    const zeilen = positionen(markdown);
    const gefuehrt = zeilen.filter((z) => !nichtGefuehrt(z)).map(positionsname);
    const imKorb = new Set(korb.positionen.map((p) => p.position).filter(Boolean));
    const begruendet = new Map((korb.ohne ?? []).map((o) => [o.position, o.warum]));

    for (const p of korb.positionen) {
      if (!p.position) {
        meldungen.push({
          regel: 'korbposition-ohne-namen',
          gruppe,
          text: `${gruppe}: eine Korbposition nennt keine Position der Systemliste`,
        });
        continue;
      }
      if (!gefuehrt.includes(p.position)) {
        meldungen.push({
          regel: 'korbposition-nicht-in-der-liste',
          gruppe,
          text: `${gruppe}: „${p.position}" liegt im Korb und steht in der Systemliste nicht als geführte Position`,
        });
      }
    }

    for (const p of gefuehrt) {
      if (imKorb.has(p)) continue;
      const grund = begruendet.get(p);
      if (!grund || grund.length < MINDESTGRUND) {
        meldungen.push({
          regel: 'position-ohne-grund',
          gruppe,
          text: `${gruppe}: „${p}" ist eine geführte Position der Systemliste, liegt nicht im `
            + 'Korb und nennt keinen tragfähigen Grund',
        });
      }
    }

    for (const o of korb.ohne ?? []) {
      if (imKorb.has(o.position)) {
        meldungen.push({
          regel: 'grund-fuer-etwas-im-korb',
          gruppe,
          text: `${gruppe}: „${o.position}" liegt im Korb und trägt trotzdem einen Grund, warum nicht`,
        });
      } else if (!gefuehrt.includes(o.position)) {
        meldungen.push({
          regel: 'grund-fuer-etwas-ausserhalb',
          gruppe,
          text: `${gruppe}: „${o.position}" steht in keiner geführten Position der Systemliste`,
        });
      }
    }

    uebersicht.push({
      gruppe,
      positionen: zeilen.length,
      gefuehrt: gefuehrt.length,
      imKorb: imKorb.size,
      mitGrund: (korb.ohne ?? []).length,
    });
  }

  return { uebersicht, meldungen, sauber: meldungen.length === 0 };
}
