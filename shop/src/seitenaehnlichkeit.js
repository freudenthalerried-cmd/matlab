/**
 * Wie ähnlich sind sich die Artikelseiten?
 *
 * **Der Anlass, 4. September 2026 (in der Nacht des 3.).** Dieser Shop soll
 * über Suche und maschinelle Auskunft gefunden werden — das ist die Weisung,
 * auf der die ganze Kanalrechnung ruht. Gebaut sind dafür 46 Artikelseiten.
 * Gemessen hat ihre Unterscheidbarkeit nie jemand.
 *
 * Der erste Lauf, über die ganzen Seiten:
 *
 * | | |
 * |---|---|
 * | ähnlichste Paare | **0,99** — vier Paare |
 * | Median über alle Paare | 0,55 |
 * | Wörter auf **jeder** der 46 Seiten | 167 von 345 (48 %) |
 *
 * Zwei Seiten mit 0,99 unterschieden sich in vier Zahlen und einem Namen. Für
 * eine Suchmaschine sind das keine zwei Antworten, sondern eine Antwort mit
 * einem Tippfehler.
 *
 * ## Gemessen wird der eigene Teil, nicht die ganze Seite
 *
 * Ein Shop verlinkt quer — das ist richtig so, und ein Bauleiter, der die
 * Klebemasse ansieht, braucht das Gewebe daneben. Diese Blöcke stehen deshalb
 * seit heute in `<section class="querverweise">` und fallen aus der Messung.
 * Was bleibt, ist der **eigene** Text: Überschrift, Preistafel, die Sätze zu
 * Vorteil, Kennwerten, Fracht und Mindestbestellwert.
 *
 * > **Eine Messung, die den Querverweisblock mitzählt, misst die Navigation
 * > und nennt es Inhalt.**
 *
 * ## Was die Zahl nicht ist
 *
 * Sie ist **kein Google-Wert**. Wie eine Suchmaschine Dubletten behandelt,
 * steht in keiner öffentlichen Formel, und niemand hier hat Zugriff darauf.
 * Was hier gemessen wird, ist die Wortmengenähnlichkeit (Jaccard) — eine
 * grobe, aber nachrechenbare Größe: `|A ∩ B| / |A ∪ B|`.
 *
 * Sie taugt für zwei Aussagen, und für keine dritte:
 *
 * 1. **Zwei Seiten sind praktisch dieselbe.** Ab 0,98 unterscheiden sie sich
 *    nur noch in einer Handvoll Zeichen. Das ist ein Befund, kein Geschmack.
 * 2. **Wie viel Text jede Seite mit allen anderen teilt.** Steigt der Anteil,
 *    wird die Seite austauschbarer — unabhängig davon, wie ein Anbieter das
 *    bewertet.
 */

/**
 * Der **eigene** Text einer gebauten Seite.
 *
 * Kopf, Fuß, Skript, Zeichnung und der Querverweisblock fallen heraus. Die
 * Marke ist `<section class="querverweise">` und nicht eine Überschrift: Eine
 * Messung, die an einer Überschrift hängt, misst beim nächsten Umformulieren
 * etwas anderes.
 */
export function eigenerText(html) {
  let s = String(html ?? '');
  for (const marke of ['script', 'style', 'svg', 'header', 'footer', 'nav']) {
    s = s.replace(new RegExp(`<${marke}[\\s>][\\s\\S]*?</${marke}>`, 'gi'), ' ');
  }
  s = s.replace(/<section class="querverweise">[\s\S]*?<\/section>/gi, ' ');
  return s.replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Die Wortmenge eines Textes — kleingeschrieben, ohne Mehrfachnennung. */
export function wortmenge(text) {
  return new Set(String(text ?? '').toLowerCase().split(/\s+/).filter(Boolean));
}

/**
 * Jaccard-Ähnlichkeit zweier Wortmengen.
 *
 * Zwei leere Mengen sind einander **nicht** ähnlich, sondern leer: `0`. Die
 * Alternative wäre `1` und hieße, dass zwei Seiten ohne Text als Dubletten
 * gelten — ein Befund über nichts.
 */
export function aehnlichkeit(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let schnitt = 0;
  for (const w of a) if (b.has(w)) schnitt += 1;
  return schnitt / (a.size + b.size - schnitt);
}

/** Ab hier sind zwei Seiten praktisch dieselbe. */
export const DUBLETTENGRENZE = 0.98;

/**
 * Der Befund über eine Menge von Seiten.
 *
 * @param {{id: string, text: string}[]} seiten  der **eigene** Text je Seite
 * @param {number} [grenze]
 */
export function seitenbefund(seiten, grenze = DUBLETTENGRENZE) {
  if (!Array.isArray(seiten) || seiten.length < 2) {
    throw new Error('Unter zwei Seiten gibt es nichts zu vergleichen — ein leerer Lauf ist kein grüner.');
  }
  const mengen = seiten.map((s) => ({ id: s.id, worte: wortmenge(s.text) }));

  const paare = [];
  for (let i = 0; i < mengen.length; i += 1) {
    for (let j = i + 1; j < mengen.length; j += 1) {
      paare.push({ a: mengen[i].id, b: mengen[j].id, wert: aehnlichkeit(mengen[i].worte, mengen[j].worte) });
    }
  }
  paare.sort((x, y) => y.wert - x.wert);

  // Was auf **jeder** Seite steht — der Anteil, den keine Seite für sich hat.
  const gemeinsam = mengen.reduce((s, m) => new Set([...s].filter((w) => m.worte.has(w))), mengen[0].worte);
  const mittlereLaenge = mengen.reduce((n, m) => n + m.worte.size, 0) / mengen.length;

  return {
    seiten: mengen.length,
    paare: paare.length,
    hoechste: paare[0],
    median: paare[Math.floor(paare.length / 2)].wert,
    gemeinsameWorte: gemeinsam.size,
    mittlereLaenge,
    gemeinsamerAnteil: mittlereLaenge > 0 ? gemeinsam.size / mittlereLaenge : 0,
    dubletten: paare.filter((p) => p.wert >= grenze),
    kuerzeste: mengen.reduce((k, m) => (m.worte.size < k.worte.size ? m : k)).id,
  };
}
