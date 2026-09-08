/**
 * Stammen die Schichten eines Warenkorbs aus **einem** Wärmedämmverbundsystem?
 *
 * **Der Anlass, 8. September 2026.** `inhalte/wissen/wdvs-systemaufbau.md`
 * trägt seit dem ersten Tag einen eigenen Abschnitt:
 *
 * > *„**Systemtreue — warum man nicht mischen sollte.** Ein WDVS wird als
 * > Kombination geprüft, nicht Bestandteil für Bestandteil. Die Prüfgrundlage
 * > ist ETAG 004 … Wer den Klebemörtel des einen Herstellers mit dem Gewebe
 * > eines anderen kombiniert, verlässt die geprüfte Zusammenstellung."*
 *
 * Und die Gruppenseite sagt es ein zweites Mal: *„Mischen verlässt die
 * geprüfte Kombination."*
 *
 * Der Katalog führt daneben **beides**:
 *
 * | Rolle | Capatect | Baumit |
 * |---|---|---|
 * | Klebe-/Armierungsmörtel | 186 M, 190 FEIN | KlebeSpachtel 25 kg |
 * | Glasgewebe | Glasgewebe M 55 m² | TextilglasGitter 1,1 × 50 m |
 *
 * Zwei Karten nebeneinander auf derselben Gruppenseite, ohne Unterschied im
 * Aussehen, und die günstigere gewinnt. Der Warenkorb rechnet beides
 * anstandslos zusammen.
 *
 * > **Die Systemtreue stand in der Prosa. Der Warenkorb kannte sie nicht.**
 *
 * Und die Daten konnten sie gar nicht kennen: Der Katalog führt `gruppe`,
 * `einheit`, `sperrgut` — **keinen Hersteller**. Der Markenname steht nur im
 * Fließtext der Bezeichnung.
 *
 * ## Was hier bewusst **nicht** gewarnt wird
 *
 * Nicht jeder Bestandteil eines WDVS ist systemgebunden. Die eigene
 * Wissensseite sagt es beim Dübel selbst: *„Das ist eine Bemessung … sie kommt
 * vom Planer oder **aus der Dübelzulassung**, nicht aus dem Baustoffhandel."*
 * Ein Dübel trägt seine eigene Zulassung; ihn aus einem anderen Haus zu nehmen
 * ist kein Systembruch. Gewarnt wird deshalb nur bei den Schichten, die die
 * Prüfgrundlage als Kombination prüft — und jede Ausnahme steht mit Grund im
 * Register.
 *
 * > **Eine Warnung, die bei jedem Korb angeht, liest nach dem dritten Mal
 * > niemand mehr.**
 */

/**
 * Die Systemfamilien, wie sie im Katalog vorkommen — erkannt am Markennamen
 * am Anfang der Bezeichnung.
 *
 * Der Katalog führt keinen Herstellerfeld; bis die Artikelliste des
 * Lieferanten vorliegt (offener Punkt „artikelliste"), ist der Markenname der
 * Bezeichnung die einzige Quelle. Sie steht dort seit dem ersten Import und
 * stammt aus den Lieferantenrechnungen, nicht aus einer Zuschreibung.
 */
export const SYSTEME = Object.freeze([
  Object.freeze({
    name: 'Capatect',
    hersteller: 'Synthesa',
    muster: /^Capatect\b/,
    warum: 'Neun der elf WDVS-Artikel tragen diesen Namen; zusammen ergeben sie einen '
      + 'vollständigen Aufbau von der Klebe- und Spachtelmasse bis zum Reibputz.',
  }),
  Object.freeze({
    name: 'Baumit',
    hersteller: 'Baumit',
    muster: /^Baumit\b/,
    warum: 'Zwei Schichtbestandteile aus einem zweiten Haus — das Gewebe in der '
      + 'WDVS-Gruppe, die Klebe-Spachtelmasse unter „Mörtel". Sie sind kein Zubehör, '
      + 'sondern Ersatz für zwei Positionen des Capatect-Aufbaus.',
  }),
]);

/**
 * Die Schichten, die nach der eigenen Wissensseite als **Kombination** geprüft
 * werden — und nur bei denen eine Vermischung gemeldet wird.
 *
 * Die Dämmplatte fehlt hier, weil der Shop sie nicht in Flächenstärke führt;
 * das steht seit dem 30. August auf der Systemliste und ist keine Auslassung.
 */
export const SCHICHTEN = Object.freeze([
  Object.freeze({
    rolle: 'Klebe- und Armierungsmörtel',
    // „Klebe- und Spachtelmasse" trägt zwischen den beiden Wörtern einen
    // Bindestrich **und** ein Leerzeichen; der erste Anlauf las nur eines von
    // beidem und ließ ausgerechnet die zwei Capatect-Massen durchfallen —
    // eine Schicht, die kein Muster trifft, verschwindet aus der Prüfung.
    muster: /Klebe[-\s]*(?:und\s+)?Spachtel|Armierungsm[öo]rtel/i,
    warum: 'Die Prüfgrundlage nennt ausdrücklich den Klebemörtel des einen Herstellers mit '
      + 'dem Gewebe eines anderen als den Fall, der die Zusammenstellung verlässt.',
  }),
  Object.freeze({
    rolle: 'Glasgewebe',
    muster: /Glasgewebe|Textilglasgitter/i,
    warum: 'Das Gewebe liegt eingebettet im Armierungsmörtel; die beiden werden als Paar '
      + 'geprüft und sind der im Regelwerk genannte Beispielfall.',
  }),
  Object.freeze({
    rolle: 'Putzgrund',
    muster: /Putzgrund/i,
    warum: 'Der Putzgrund stellt die Haftung zwischen Armierungsschicht und Oberputz her — '
      + 'beide Seiten davon gehören dem System.',
  }),
  Object.freeze({
    rolle: 'Oberputz',
    muster: /Reibputz|Oberputz|Silikatputz|Silikonharzputz/i,
    warum: 'Die oberste Schicht des geprüften Aufbaus; ihre Körnung und Bindemittelbasis '
      + 'stehen in den Systemunterlagen des Herstellers.',
  }),
]);

/**
 * Artikel der WDVS-Gruppe, die **keiner** Schicht zugeordnet sind — mit Grund.
 *
 * Ohne dieses Register wäre die Zuordnung einseitig: Ein neuer Artikel, den
 * kein Schichtmuster trifft, verschwände stillschweigend aus der Prüfung.
 */
export const OHNE_SCHICHT = Object.freeze([
  Object.freeze({
    sku: 'POS-11082',
    was: 'Capatect Universaldübel Schraubdübel',
    warum: 'Dübel tragen eine eigene Zulassung. Die eigene Wissensseite sagt es beim Dübel '
      + 'selbst: Zahl und Anordnung kommen vom Planer oder aus der Dübelzulassung, nicht aus '
      + 'dem Baustoffhandel. Ein Dübel aus einem anderen Haus ist deshalb kein Systembruch.',
  }),
  Object.freeze({
    sku: 'POS-52537',
    was: 'Drehstiftdübel PK(100) K 6',
    warum: 'Derselbe Grund wie beim Universaldübel — und dieser trägt gar keinen '
      + 'Markennamen. Er ist der Beleg dafür, dass die Marke aus der Bezeichnung kein '
      + 'Ersatz für ein Herstellerfeld ist, sondern eine Behelfslösung bis zur '
      + 'Artikelliste des Lieferanten.',
  }),
  Object.freeze({
    sku: 'POS-29610',
    was: 'Capatect Polystyrol-Rondelle',
    warum: 'Die Rondelle gehört zum Dübel und nicht zur Schichtenfolge: Sie deckt den '
      + 'versenkt gesetzten Teller ab. Ihre Passung richtet sich nach dem Dübel, dessen '
      + 'Zulassung eigenständig ist.',
  }),
  Object.freeze({
    sku: 'POS-53402',
    was: 'Capatect Kantenschutz mit Gewebe Carbon',
    warum: 'Ein Profil für Außenecken und Laibungen. Es trägt zwar ein Gewebefähnchen, '
      + 'bildet aber keine Fläche der Armierungsschicht, sondern deren Rand — es ersetzt '
      + 'keine Schicht und steht in keiner Verbrauchsrechnung je m².',
  }),
  Object.freeze({
    sku: 'POS-52124',
    was: 'Capatect Gewebeanschlussleiste 3D Universal Plus',
    warum: 'Dasselbe am Fenster- und Türanschluss: ein Anschlussprofil mit Dichtband, das '
      + 'die Putzfläche vom Rahmen trennt. Es ist die Position, die am häufigsten vergessen '
      + 'wird, und keine Schicht des geprüften Aufbaus.',
  }),
]);

/** Was zu einem Artikel bekannt ist: Schicht und System, oder nichts davon. */
export function einordnung(artikel) {
  const text = String(artikel.bezeichnung ?? '');
  const schicht = SCHICHTEN.find((s) => s.muster.test(text)) ?? null;
  const system = SYSTEME.find((s) => s.muster.test(text)) ?? null;
  return { sku: artikel.sku, schicht: schicht?.rolle ?? null, system: system?.name ?? null };
}

/**
 * Hält den Katalog gegen das Register — in beide Richtungen.
 *
 * @param {object[]} artikel  alle Artikel, die in einen WDVS-Aufbau gehören
 */
export function zuordnungsbefund(artikel, ohneSchicht = OHNE_SCHICHT) {
  const meldungen = [];
  const befreit = new Map(ohneSchicht.map((e) => [e.sku, e]));
  const gesehen = new Set();

  for (const a of artikel) {
    const e = einordnung(a);
    if (e.schicht === null) {
      if (!befreit.has(a.sku)) {
        meldungen.push({
          regel: 'artikel-ohne-schicht',
          text: `${a.sku} „${a.bezeichnung}" gehört keiner Schicht an und steht in keinem `
            + 'Eintrag von OHNE_SCHICHT — wer ihn aus der Systemprüfung nimmt, schreibt den Grund dazu',
        });
      } else {
        gesehen.add(a.sku);
      }
      continue;
    }
    if (befreit.has(a.sku)) {
      meldungen.push({
        regel: 'befreiter-artikel-ist-schicht',
        text: `${a.sku} steht als schichtlos im Register und trifft doch die Schicht `
          + `„${e.schicht}"`,
      });
      gesehen.add(a.sku);
      continue;
    }
    if (e.system === null) {
      meldungen.push({
        regel: 'schicht-ohne-system',
        text: `${a.sku} „${a.bezeichnung}" ist eine Schicht (${e.schicht}), und aus der `
          + 'Bezeichnung ist kein System ablesbar — eine Schicht ohne System lässt sich gegen '
          + 'keine andere prüfen',
      });
    }
  }

  for (const e of ohneSchicht) {
    if (gesehen.has(e.sku)) continue;
    meldungen.push({
      regel: 'eintrag-ohne-artikel',
      text: `${e.sku} („${e.was}") steht als schichtlos im Register, im Katalog aber nicht mehr`,
    });
  }
  return { geprueft: artikel.length, meldungen, sauber: meldungen.length === 0 };
}

/**
 * Mischt dieser Warenkorb zwei Systeme?
 *
 * Gemeldet wird **nur**, wenn zwei verschiedene Systeme mit je einer Schicht
 * vertreten sind. Ein Korb aus einem System und einem Dübel des anderen Hauses
 * ist kein Fund.
 */
export function systembruch(artikelImKorb) {
  const schichten = artikelImKorb.map(einordnung).filter((e) => e.schicht && e.system);
  const systeme = [...new Set(schichten.map((e) => e.system))].sort();
  if (systeme.length < 2) return null;
  const jeSystem = systeme.map((s) => ({
    system: s,
    rollen: [...new Set(schichten.filter((e) => e.system === s).map((e) => e.schicht))].sort(),
  }));
  return { systeme, jeSystem };
}

/**
 * Der Satz für den Kunden. Er warnt und entscheidet nicht: Welche
 * Zusammenstellung geprüft ist, steht in den Systemunterlagen des Herstellers
 * — das sagt die eigene Wissensseite, und dabei bleibt es.
 */
export function systembruchsatz(bruch) {
  if (!bruch) return '';
  const teile = bruch.jeSystem.map((s) => `${s.system} (${s.rollen.join(', ')})`);
  return `Hinweis zur Systemtreue: Ihr Warenkorb enthält Schichten aus zwei Systemen — `
    + `${teile.join(' und ')}. Ein Wärmedämmverbundsystem wird als Kombination geprüft `
    + '(ETAG 004, ÖNORM B 6400); wer den Klebemörtel des einen Herstellers mit dem Gewebe '
    + 'eines anderen kombiniert, verlässt die geprüfte Zusammenstellung. Welche '
    + 'Zusammenstellung geprüft ist, steht in den Systemunterlagen des Herstellers. '
    + 'Wir liefern, was Sie bestellen — diese Zeile soll nur verhindern, dass es niemand '
    + 'bemerkt hat.';
}
