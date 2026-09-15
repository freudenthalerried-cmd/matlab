/**
 * Ausschlusswörter, gegen den eigenen Text gehalten.
 *
 * **Der Anlass, 6. September 2026.** Die Kampagne führt 69 einwortige
 * Ausschlüsse. Gezählt, wie oft jeder davon im **eigenen** Seitentext steht
 * (alle 82 gebauten Seiten, nur der Hauptbereich):
 *
 * ```
 * 112  wie          · Suche ohne Kaufabsicht
 *  39  vergleich    · Suche ohne Kaufabsicht
 *   3  einbau       · Falsche Absicht
 *   2  muster       · Preis und Menge
 *   1  gebraucht, einzeln
 *   0  die übrigen 63
 * ```
 *
 * > **Zwei Wörter stehen 112- und 39-mal im eigenen Text. Die anderen 67
 * > zusammen sieben Mal.** Das ist kein Verlauf, das ist eine Kante.
 *
 * Und die 39 sind nicht irgendein Vorkommen: Auf 39 Artikelseiten steht *„Der
 * **Vergleich** bezieht sich auf die Liste unseres Lieferanten"* — der Satz,
 * der das Verkaufsargument dieses Shops trägt. Wer Preise vergleicht, ist der
 * Kunde, für den „46 % unter Liste" geschrieben ist.
 *
 * ## Warum der vorhandene Prüfer es nicht fand
 *
 * Der Kopfkommentar der Ausschlussliste nennt zwei Bestände: kein Ortsname des
 * eigenen Liefergebiets, und kein Wort aus einem geführten Suchbegriff. Beides
 * prüft ein Testfall.
 *
 * > **Die Regel kannte zwei Bestände und nicht den dritten — die Seiten, auf
 * > die die Anzeige zeigt.**
 *
 * ## Was diese Regel sagt und was nicht
 *
 * Sie sagt **nicht**, dass ein häufiges Wort ein falscher Ausschluss ist. Sie
 * sagt: Ein einwortiger Ausschluss, der im eigenen Text gewöhnliches Deutsch
 * ist, trägt nicht die Absicht, die sein Thema behauptet — und gehört
 * angesehen. Die Entscheidung bleibt bei einem Menschen; die Regel sorgt
 * dafür, dass sie gestellt wird.
 *
 * Mehrwortige Ausschlüsse („was ist", „sanieren lassen") sind ausgenommen: Sie
 * tragen ihre Absicht in der Wendung und nicht im einzelnen Wort.
 */

/**
 * Ab wie vielen eigenen Fundstellen ein einwortiger Ausschluss angesehen
 * gehört.
 *
 * **Gemessen, nicht gesetzt.** Der Abstand im Bestand ist 3 gegen 39; die
 * Schwelle liegt dazwischen und näher am oberen Wert, damit ein Wort mit einer
 * Handvoll gewöhnlicher Vorkommen nicht jedes Mal aufhält.
 */
export const EIGENWORTGRENZE = 10;

/** Zählt, wie oft ein Wort als ganzes Wort im Text steht. */
export function eigenvorkommen(wort, text) {
  const w = String(wort ?? '').trim().toLowerCase();
  if (!w || w.includes(' ')) return null;
  const muster = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  return (String(text ?? '').toLowerCase().match(muster) ?? []).length;
}

/**
 * Der Befund über eine Ausschlussliste.
 *
 * @param {object} eingabe
 * @param {{thema: string, wort: string}[]} eingabe.ausschluesse
 * @param {string} eingabe.seitentext  Fließtext aller gebauten Seiten
 * @param {number} [eingabe.grenze]
 * @param {number} [eingabe.mindestens]  ab wie vielen Ausschlüssen die Aussage trägt
 */
export function ausschlussbefund({ ausschluesse, seitentext, grenze = EIGENWORTGRENZE, mindestens = 20 }) {
  const meldungen = [];
  const gezaehlt = [];
  for (const a of ausschluesse) {
    const n = eigenvorkommen(a.wort, seitentext);
    if (n === null) continue; // mehrwortig — trägt seine Absicht in der Wendung
    gezaehlt.push({ ...a, n });
    if (n > grenze) {
      meldungen.push({
        regel: 'eigenes-wort-ausgeschlossen',
        wort: a.wort,
        text: `„${a.wort}" (${a.thema}) steht ${n}× im eigenen Seitentext — `
          + `mehr als ${grenze}. Ein Wort, das die eigenen Seiten so oft benutzen, `
          + 'trägt nicht die Absicht, die sein Thema behauptet.',
      });
    }
  }
  if (gezaehlt.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-ausschluesse',
      wort: null,
      text: `nur ${gezaehlt.length} einwortige Ausschlüsse gezählt, erwartet mindestens ${mindestens}`,
    });
  }
  gezaehlt.sort((x, y) => y.n - x.n);
  return { gezaehlt, meldungen, sauber: meldungen.length === 0 };
}
