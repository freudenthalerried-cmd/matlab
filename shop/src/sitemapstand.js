/**
 * Wann eine Seite zuletzt geändert wurde — für die Sitemap.
 *
 * **Der Anlass, 7. September 2026.** Seit dem 6. September leitet der Bau das
 * Änderungsdatum jeder Inhaltsseite aus dem Verzeichnis ab und schreibt es als
 * `dateModified` in die strukturierte Auskunft. Gezählt in der `sitemap.xml`,
 * also an der Stelle, an der eine Suchmaschine zuerst nach genau dieser Angabe
 * sieht:
 *
 * ```
 * <url> in sitemap.xml:   78
 * davon mit <lastmod>:     0
 * ```
 *
 * > **Die Angabe war da, und sie stand nicht dort, wo danach gefragt wird.**
 * > Dieselbe Bauart wie die Marke, die im Bauwerkzeug lag und im Produktfeed
 * > fehlte, und wie der Herstellerverweis, den die Artikelseiten trugen und
 * > die Inhaltsseiten nicht.
 *
 * ## Warum nicht überall eines steht
 *
 * `lastmod` ist eine Behauptung, und eine Suchmaschine, die sie zweimal
 * widerlegt findet, glaubt sie nicht mehr. Angegeben wird sie deshalb nur, wo
 * es eine **Quelle** gibt, die sich datieren lässt:
 *
 * * **Inhaltsseiten** — die Markdown-Datei, aus der sie entstehen
 *   (`src/inhaltsstand.js`, aus der Änderungsgeschichte).
 * * **Artikelseiten** — die Katalogdatei; ändert sich ein Preis oder eine
 *   Bezeichnung, ändert sich die Seite.
 *
 * Für die übrigen — Startseite, Lieferseite, Rechtsseiten, Übersichten —
 * steht **keines**. Ihre Quelle ist das Bauwerkzeug, und das ändert sich fast
 * täglich, ohne dass sich der Satz auf der Seite ändern muss. Ein `lastmod`,
 * das immer heute sagt, ist genau die Angabe, die eine Suchmaschine ignoriert
 * — und für die eigene Seite die schlechteste Auskunft: Sie entwertet auch
 * die richtigen daneben.
 */

/** Kennt der Bau eine datierbare Quelle für diese Seite? */
export const OHNE_QUELLE = null;

/**
 * Das Änderungsdatum einer Seite für die Sitemap.
 *
 * @param {object} eingabe
 * @param {string} eingabe.id            Seitenkennung, z. B. `wissen/xps-oder-eps`
 * @param {Map<string, {stand?: string|null}>} [eingabe.inhalte]  die Inhaltsseiten
 * @param {string|null} [eingabe.katalogStand]  Änderungsdatum der Katalogdatei
 * @returns {string|null} `JJJJ-MM-TT` oder null
 */
export function lastmodFuer({ id, inhalte = new Map(), katalogStand = null }) {
  if (String(id).startsWith('artikel/')) return katalogStand ?? OHNE_QUELLE;
  const seite = inhalte.get(id);
  return seite?.stand ?? OHNE_QUELLE;
}

/** Ein Datum, das eine Sitemap tragen darf. */
export const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Hält die gebaute Sitemap gegen das, was der Bau über seine Quellen weiß.
 *
 * @param {object} eingabe
 * @param {{id: string, lastmod: string|null}[]} eingabe.eintraege
 * @param {(id: string) => string|null} eingabe.erwartet
 * @param {string} eingabe.heute
 * @param {number} [eingabe.mindestens]
 */
export function sitemapbefund({ eintraege, erwartet, heute, mindestens = 40 }) {
  const meldungen = [];
  const liste = eintraege ?? [];

  if (liste.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-eintraege',
      text: `nur ${liste.length} Einträge — darüber lässt sich nichts aussagen`,
    });
  }

  for (const e of liste) {
    const soll = erwartet(e.id);
    if (soll && e.lastmod !== soll) {
      meldungen.push({
        regel: 'lastmod-weicht-ab',
        wo: e.id,
        text: `${e.id}: Sitemap sagt ${e.lastmod ?? '(nichts)'}, die Quelle sagt ${soll}`,
      });
      continue;
    }
    if (!soll && e.lastmod) {
      meldungen.push({
        regel: 'lastmod-ohne-quelle',
        wo: e.id,
        text: `${e.id} trägt ein lastmod, obwohl der Bau für diese Seite keine datierbare Quelle kennt`,
      });
      continue;
    }
    if (e.lastmod && !DATUM.test(e.lastmod)) {
      meldungen.push({ regel: 'lastmod-unbrauchbar', wo: e.id, text: `${e.id}: „${e.lastmod}" ist kein Datum` });
      continue;
    }
    if (e.lastmod && e.lastmod > heute) {
      meldungen.push({
        regel: 'lastmod-in-der-zukunft',
        wo: e.id,
        text: `${e.id} nennt ${e.lastmod} — das liegt nach heute (${heute})`,
      });
    }
  }

  return {
    geprueft: liste.length,
    mitDatum: liste.filter((e) => e.lastmod).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
