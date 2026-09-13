/**
 * Wofür ein Artikel nicht taugt — die vierte Redaktionsregel.
 *
 * **Der Anlass, 7. September 2026.** Die Seite `wissen/redaktionsprinzipien`
 * ist die Glaubwürdigkeitsseite dieses Shops; `llms.txt` verweist auf sie mit
 * „Wie geprüft wird". Ihre vierte Regel lautet:
 *
 * > *„Viertens: Wir sagen auch, wofür etwas nicht taugt. **Jede Produktseite
 * > hat einen Abschnitt dazu.** Das kostet Umsatz an der einen Stelle und
 * > spart ihn an der anderen — eine Rücklieferung ist für beide Seiten teurer
 * > als ein verlorener Auftrag."*
 *
 * Gezählt über die 46 gebauten Artikelseiten: **null** haben ihn. Die
 * Abschnitte heißen „Technische Kennwerte", „Lieferung", „Gehört zu diesen
 * Systemen", „Wird damit zusammen verbaut", „Weitere Artikel aus …" — keiner
 * sagt, wofür der Artikel nicht gedacht ist.
 *
 * > **Eine Regel, die auf der eigenen Seite steht und auf keiner anderen
 * > eingelöst ist, ist eine Behauptung über den eigenen Betrieb.**
 *
 * ## Warum der Abschnitt nicht einfach geschrieben wird
 *
 * Eignungsgrenzen sind technische Aussagen. Regel zwei derselben Seite sagt:
 * *„Eine Zahl ohne Herkunft ist keine Zahl"*, und die Artikelseiten führen
 * seit jeher keine Kennwerte, weil sie ins Merkblatt des Herstellers gehören
 * und sich dort ändern. Sie hier zu erfinden wäre der teurere Fehler.
 *
 * ## Was der Bestand tatsächlich hergibt
 *
 * Der Shop **weiß** einiges über Grenzen, nur steht es woanders:
 *
 * * die **Wissensseiten mit Warengruppe** — „XPS oder EPS: was passiert, wenn
 *   man es vertauscht", „Verarbeitung bei Kälte und Nässe", „Untergrund
 *   prüfen, bevor geklebt wird";
 * * die **Abgrenzungssätze der Gruppenseite** — was auf der Systemliste steht
 *   und nicht im Regal;
 * * das **Merkblatt des Herstellers**, das die Seite ohnehin verlinkt.
 *
 * Der Abschnitt wird daraus **abgeleitet**. Er erfindet nichts und verweist
 * dorthin, wo es belegt steht — und er steht auf **jeder** Artikelseite, auch
 * wenn der Bestand für sie nur das Merkblatt hergibt. Eine Seite, die den
 * Abschnitt weglässt, weil nichts da ist, sieht aus wie eine Seite ohne
 * Grenzen.
 */

/** Überschrift des Abschnitts — einmal geschrieben, von Prüfer und Bau gelesen. */
export const UEBERSCHRIFT = 'Wofür dieser Artikel nicht gedacht ist';

/**
 * Die Bausteine des Abschnitts für einen Artikel.
 *
 * @param {object} eingabe
 * @param {{gruppe: string}} eingabe.artikel
 * @param {{id: string, titel: string, frage: string, gruppe: string}[]} eingabe.wissen
 * @param {{satz: string}[]} [eingabe.abgrenzungen]  Sätze der Gruppenseite
 * @param {boolean} [eingabe.merkblatt]  Ist ein Herstellerverweis auf der Seite?
 */
export function grenzenbausteine({ artikel, wissen = [], abgrenzungen = [], merkblatt = false }) {
  const gruppe = artikel?.gruppe ?? null;
  return {
    wissen: wissen.filter((w) => w.gruppe === gruppe),
    abgrenzungen: [...new Map(abgrenzungen.map((a) => [a.satz, a])).values()],
    merkblatt: Boolean(merkblatt),
  };
}

/**
 * Trägt eine gebaute Seite den Abschnitt?
 *
 * @param {object} eingabe
 * @param {{name: string, text: string}[]} eingabe.seiten  Artikelseiten
 * @param {number} [eingabe.mindestens]
 */
export function grenzenbefund({ seiten, mindestens = 20 }) {
  const meldungen = [];
  const gepruefte = seiten ?? [];

  if (gepruefte.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-seiten',
      text: `nur ${gepruefte.length} Artikelseiten gemessen — darüber lässt sich nichts aussagen`,
    });
  }

  for (const s of gepruefte) {
    if (!String(s.text ?? '').includes(UEBERSCHRIFT)) {
      meldungen.push({
        regel: 'produktseite-ohne-grenzen',
        wo: s.name,
        text: `${s.name} hat keinen Abschnitt „${UEBERSCHRIFT}" — die vierte Redaktionsregel `
          + 'verspricht ihn auf jeder Produktseite',
      });
    }
  }

  return {
    geprueft: gepruefte.length,
    mitAbschnitt: gepruefte.filter((s) => String(s.text ?? '').includes(UEBERSCHRIFT)).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
