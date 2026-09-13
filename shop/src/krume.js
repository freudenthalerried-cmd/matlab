/**
 * Die Brotkrume — sichtbar seit jeher, maschinenlesbar seit heute.
 *
 * **Der Anlass, 7. September 2026.** Jede Seite dieses Shops trägt oben eine
 * Krume: *Start › Wissen › XPS oder EPS*. Gezählt über den gebauten Bestand:
 *
 * ```
 * Seiten mit sichtbarer Krume:   81 von 82
 * Seiten mit BreadcrumbList:      0
 * ```
 *
 * Die Krume sagt dem Leser, wo er steht. Eine Suchmaschine zeigt denselben
 * Pfad statt der nackten Adresse im Ergebnis an — wenn er ausgezeichnet ist.
 *
 * > **Der Pfad stand auf jeder Seite und in keiner Auszeichnung.** Dieselbe
 * > Familie wie das Änderungsdatum, das die Seite kannte und die Sitemap
 * > verschwieg.
 *
 * ## Aus der gebauten Seite, nicht aus einer zweiten Liste
 *
 * Die Auszeichnung entsteht **aus der gerenderten Krume**. Der Grund steht
 * seit dem 5. September im Kopf von `mitMindestwert`, und er gilt hier
 * genauso: *Ein Absatz, den jeder Seitentyp selbst anhängt, ist ein Absatz,
 * den ein fünfter Seitentyp vergisst.* Eine zweite Liste wäre außerdem die
 * Gelegenheit, dass sichtbarer Pfad und ausgezeichneter auseinanderlaufen —
 * und **eine Auszeichnung, die etwas anderes sagt als die Seite, ist eine
 * Behauptung an eine Maschine.**
 */

/** Die Krume einer gebauten Seite: `<p class="krume">Start › Wissen › …</p>`. */
export const KRUMENMUSTER = /<p class="krume">([\s\S]*?)<\/p>/;

/**
 * Zerlegt die sichtbare Krume in ihre Stufen.
 *
 * @param {string} html  die gebaute Seite
 * @returns {{name: string, href: string|null}[]}
 */
export function krumeAusHtml(html) {
  const treffer = KRUMENMUSTER.exec(String(html ?? ''));
  if (!treffer) return [];
  return treffer[1]
    .split('›')
    .map((stueck) => {
      const verweis = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(stueck);
      const name = (verweis ? verweis[2] : stueck).replace(/<[^>]+>/g, '').trim();
      return { name, href: verweis ? verweis[1] : null };
    })
    .filter((s) => s.name);
}

/**
 * Die Auszeichnung zur Krume.
 *
 * Die letzte Stufe ist die Seite selbst; sie bekommt ihre eigene Adresse,
 * damit die Liste vollständig ist. Verweise werden gegen die Seitenadresse
 * aufgelöst — die Krume trägt relative Pfade, eine Auszeichnung braucht
 * absolute.
 *
 * `normalisiere` bringt eine aufgelöste Adresse auf die kanonische Form. Ohne
 * sie stünde in der Liste `bauversand.com/index.html`, während die Startseite
 * selbst `bauversand.com/` als maßgeblich ausweist — zwei Adressen für
 * dieselbe Seite, genau der Fehler, den die Sitemap am 3. September hatte.
 *
 * @param {object} eingabe
 * @param {{name: string, href: string|null}[]} eingabe.stufen
 * @param {string} eingabe.seiteUrl  absolute Adresse dieser Seite
 * @param {(url: string) => string} [eingabe.normalisiere]
 * @returns {object|null}
 */
export function brotkrume({ stufen, seiteUrl, normalisiere = (u) => u }) {
  const liste = (stufen ?? []).filter((s) => s?.name);
  // Eine Krume mit einer einzigen Stufe ist die Startseite selbst — dort
  // beschreibt eine Liste mit einem Eintrag nichts, was die Adresse nicht
  // schon sagt.
  if (liste.length < 2 || !seiteUrl) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: liste.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: i === liste.length - 1
        ? normalisiere(seiteUrl)
        : (() => {
          try { return normalisiere(new URL(s.href ?? '', seiteUrl).toString()); } catch { return normalisiere(seiteUrl); }
        })(),
    })),
  };
}

/**
 * Trägt jede Seite mit sichtbarer Krume auch die Auszeichnung — und sagen
 * beide dasselbe?
 *
 * @param {object} eingabe
 * @param {{name: string, text: string}[]} eingabe.seiten
 * @param {number} [eingabe.mindestens]
 */
export function krumenbefund({ seiten, mindestens = 40 }) {
  const meldungen = [];
  const liste = seiten ?? [];

  if (liste.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-seiten',
      text: `nur ${liste.length} Seiten gemessen — darüber lässt sich nichts aussagen`,
    });
  }

  let ausgezeichnet = 0;
  for (const s of liste) {
    const stufen = krumeAusHtml(s.text);
    if (stufen.length < 2) continue;

    /*
     * **Ohne Kanonisch keine Krume.** Die Fehlerseite zeigt einen Pfad und
     * trägt bewusst kein `rel="canonical"`: Sie wird unter jeder Adresse
     * ausgeliefert, die es *nicht* gibt (Entscheidung vom 6. September). Eine
     * `BreadcrumbList` behauptete dasselbe wie ein Kanonisch — dass diese
     * Seite an einer Stelle der Site steht. Geprüft wird die Ausnahme an der
     * Seite selbst und nicht an einer Namensliste: Wer eine zweite Seite ohne
     * Kanonisch baut, bekommt dieselbe Regel, ohne daran zu denken.
     */
    if (!/<link rel="canonical"/.test(String(s.text))) continue;

    const bloecke = [...String(s.text).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap((m) => {
        try {
          const daten = JSON.parse(m[1]);
          return Array.isArray(daten) ? daten : [daten];
        } catch { return []; }
      });
    const krume = bloecke.find((b) => b?.['@type'] === 'BreadcrumbList');

    if (!krume) {
      meldungen.push({
        regel: 'krume-ohne-auszeichnung',
        wo: s.name,
        text: `${s.name} zeigt einen Pfad und zeichnet ihn nicht aus`,
      });
      continue;
    }
    ausgezeichnet += 1;

    const gezeigt = stufen.map((x) => x.name);
    const genannt = (krume.itemListElement ?? []).map((x) => x.name);
    if (gezeigt.join(' › ') !== genannt.join(' › ')) {
      meldungen.push({
        regel: 'krume-sagt-etwas-anderes',
        wo: s.name,
        text: `${s.name}: sichtbar „${gezeigt.join(' › ')}", ausgezeichnet „${genannt.join(' › ')}"`,
      });
    }
  }

  return {
    geprueft: liste.length,
    ausgezeichnet,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
