/**
 * Wie viele Artikelnamen tragen ein **eindeutiges** Maß?
 *
 * **Die Frage, 13. September 2026.** Am selben Tag wurde beziffert, dass 21 von
 * 46 maschinenlesbaren Beschreibungen über die Ware selbst nichts sagen. Der
 * naheliegende Ausweg liegt sichtbar da: In den Bezeichnungen stehen Maße —
 * „750 ml", „100 m2", „133cm", „48 mm x 50 m". Ein Leser darüber, und jede
 * Beschreibung trüge eine Eigenschaft.
 *
 * Die Runde davor hat den Ausweg ausdrücklich nicht genommen und die Bedingung
 * aufgeschrieben:
 *
 * > *Wer es dennoch tut, misst zuerst, wie viele der 46 Namen **eindeutig**
 * > sind — und nicht, wie viele sich irgendwie lesen lassen.*
 *
 * Dieses Modul ist diese Messung. **Es ist kein Leser für den Betrieb.** Es
 * beantwortet eine Frage und wird an keiner Kundenseite, in keinem Feed und in
 * keiner Beschreibung aufgerufen.
 *
 * ## Was gemessen wurde
 *
 * | | Artikel |
 * |---|---|
 * | Namen, in denen der Leser mindestens ein Maß findet | **34** |
 * | davon: genau ein Maß und keine weitere Zahl | **10** |
 * | davon: vom Leser **falsch** gelesen (die x-Form) | **2** |
 * | **eindeutig lesbar** | **8 von 46** |
 *
 * ## Warum der Rest nicht lesbar ist
 *
 * Drei Bauarten, jede mit einem Beleg aus dem Bestand:
 *
 * **Mehrere Maße ohne Rolle.** `Schachtring 800 300 80 mm` — Durchmesser,
 * Höhe, Wandstärke, in einer Einheit am Ende. Der Leser nimmt die letzte Zahl
 * und wirft zwei weg. `Isover TDPT 20 1200 600 mm 8,64 m2` ebenso: 20 mm dick,
 * 1200 × 600 groß, 8,64 m² je Paket — gelesen wird `600 mm`.
 *
 * **Eine Typenbezeichnung, die wie ein Maß aussieht.** `Capatect Klebe- und
 * Spachtelmasse 186 M 25 kg` — das `186 M` ist die Produktkennung des
 * Herstellers. Der Leser liest **186 Meter** und hängt sie an einen Sack
 * Klebemörtel.
 *
 * > **Ein Leser, der ein Maß findet, wo eine Kennung steht, erfindet eine
 * > Eigenschaft — und zwar eine, die plausibel aussieht.**
 *
 * **Zwei Zahlen unter einer Einheit.** `Baumit TextilglasGitter 1,1x50 m` und
 * `Rahmenschraube Zylinderkopf vz 7,5x182 mm lose`. Beide standen zuerst in
 * der Spalte „eindeutig", weil der Leser genau **ein** Paar aus Zahl und
 * Einheit fand. Der Name trägt zwei.
 *
 * > **„Eindeutig" hieß: Der Leser findet genau eine Zahl. Es hieß nicht: Der
 * > Name trägt genau eine.**
 *
 * Dieselbe Bauart wie der Befund vom selben Tag über die Beschreibungen, und
 * dieselbe Abhilfe: Die x-Form wird eigens gelesen, damit sie als das zählt,
 * was sie ist — zwei Maße.
 *
 * ## Das Ergebnis
 *
 * Ein Leser über die Bezeichnungen wäre für **8 von 46** richtig, für 2 still
 * falsch und für 36 stumm oder unvollständig. Die 21 Beschreibungen ohne
 * Angabe über die Ware senkt er nicht; er tauscht eine Lücke gegen eine
 * Vermutung.
 *
 * > **Ein Werkzeug, das in 17 von 100 Fällen recht hat, ist keine Datenquelle.**
 *
 * Die Eigenschaften kommen aus der Artikelliste des Lieferanten oder aus den
 * Merkblättern der Hersteller — beides offene Punkte, beides freigabepflichtig.
 */

/** Einheiten, die in diesem Katalog überhaupt vorkommen. */
export const EINHEITEN_IM_NAMEN = Object.freeze(
  ['mm', 'cm', 'm2', 'm²', 'lfm', 'ml', 'kg', 'STK', 'KAR', '°C', 'm', 'l', 'g'],
);

const ZAHL = '\\d+(?:[.,]\\d+)?';
const EINHEIT = '(mm|cm|m2|m²|lfm|ml|kg|STK|KAR|°C|m|l|g)';

/** `7,5x182 mm` — zwei Zahlen unter einer Einheit. Zuerst gelesen, sonst zählt sie als eine. */
const XFORM = new RegExp(`(${ZAHL})\\s*[x×]\\s*(${ZAHL})\\s*${EINHEIT}\\b`, 'gi');
/** `750 ml`, `133cm`, `0,75 m2` — ein Paar aus Zahl und Einheit. */
const PAAR = new RegExp(`(${ZAHL})\\s*${EINHEIT}\\b`, 'gi');
/** Jede Zahl, gleich ob eine Einheit danebensteht. */
const JEDE_ZAHL = new RegExp(`(?:^|[^0-9A-Za-zÄÖÜäöüß.,])(${ZAHL})`, 'g');

/**
 * Die Maße eines Namens — und was daneben noch an Zahlen steht.
 *
 * @param {string} bezeichnung
 */
export function masseImNamen(bezeichnung) {
  const name = String(bezeichnung ?? '');
  const masse = [];
  let rest = name;

  for (const t of name.matchAll(XFORM)) {
    masse.push({ zahl: t[1], einheit: t[3], form: 'x' });
    masse.push({ zahl: t[2], einheit: t[3], form: 'x' });
    rest = rest.replace(t[0], ' '.repeat(t[0].length));
  }
  for (const t of rest.matchAll(PAAR)) {
    masse.push({ zahl: t[1], einheit: t[2], form: 'paar' });
  }

  const zahlen = [...name.matchAll(JEDE_ZAHL)].length;
  return { masse, zahlen, ohneEinheit: Math.max(0, zahlen - masse.length) };
}

/**
 * Wie ein Name zu lesen ist: gar nicht, eindeutig oder mehrdeutig.
 *
 * **Eindeutig** heißt: genau ein Maß, und keine Zahl daneben, die keines ist.
 * Beides muss gelten — `Grundmauerschutz 20 1,5 m` trägt ein Maß und eine
 * nackte 20, und welche der beiden die Eigenschaft ist, sagt der Name nicht.
 */
export function lesbarkeit(bezeichnung) {
  const { masse, ohneEinheit } = masseImNamen(bezeichnung);
  if (masse.length === 0) return 'ohne';
  if (masse.length === 1 && ohneEinheit === 0) return 'eindeutig';
  return 'mehrdeutig';
}

export const GEMESSEN = Object.freeze({ artikel: 46, ohne: 12, eindeutig: 8, mehrdeutig: 26 });

/**
 * Der Befund über einen ganzen Katalog.
 *
 * **Warum die Zahlen festgehalten sind.** Der Satz, für den es dieses Modul
 * gibt — *ein Leser über die Namen wäre für 8 von 46 richtig* —, ist eine
 * Aussage über **diesen** Katalog. Wächst er, gilt sie nicht mehr, und der
 * Auftraggeber hat die Erweiterung auf mindestens hundert Artikel angeordnet.
 *
 * > **Ein Urteil über einen Bestand, das den Bestand nicht kennt, wird mit dem
 * > Bestand alt.**
 *
 * Deshalb melden abweichende Zahlen, statt still zu gelten: Die Messung gehört
 * dann wiederholt und `GEMESSEN` nachgezogen — zusammen mit den Sätzen, die
 * sich darauf berufen.
 *
 * @param {{sku: string, bezeichnung: string}[]} artikel
 * @param {number} mindestens  weniger Artikel messen nichts
 * @param {object|null} erwartet  die festgehaltene Messung; `null` schaltet den Abgleich ab
 */
export function massbefund(artikel = [], mindestens = 20, erwartet = GEMESSEN) {
  const meldungen = [];
  const nachLage = { ohne: [], eindeutig: [], mehrdeutig: [] };

  for (const a of artikel) {
    const lage = lesbarkeit(a.bezeichnung);
    nachLage[lage].push(a.sku);
  }

  if (erwartet) {
    for (const [feld, soll] of Object.entries(erwartet)) {
      const ist = feld === 'artikel' ? artikel.length : nachLage[feld].length;
      if (ist !== soll) {
        meldungen.push({
          regel: 'bestand-gewandert',
          text: `${feld}: gemessen ${ist}, festgehalten ${soll} — der Bestand ist ein anderer `
            + 'als der, über den das Urteil gefällt wurde (GEMESSEN in src/bezeichnungsmass.js)',
        });
      }
    }
  }

  if (artikel.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-artikel',
      text: `nur ${artikel.length} Namen gemessen, erwartet mindestens ${mindestens}`,
    });
  }

  return {
    artikel: artikel.length,
    ohne: nachLage.ohne.length,
    eindeutig: nachLage.eindeutig.length,
    mehrdeutig: nachLage.mehrdeutig.length,
    skus: nachLage,
    anteilEindeutig: artikel.length ? nachLage.eindeutig.length / artikel.length : 0,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
