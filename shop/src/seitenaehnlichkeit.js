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
import { nurText } from './format.js';

const CHROM = ['script', 'style', 'svg', 'header', 'footer', 'nav', 'noscript', 'head'];

/**
 * Die Seite ohne alles, was auf jeder Seite gleich steht — noch mit Marken.
 *
 * **Erweitert am 5. September.** Bis dahin fielen sechs Marken heraus, und
 * zwei standen weiter drin: der `<noscript>`-Hinweis (dreißig Wörter, auf
 * allen 46 Seiten wortgleich) und der `<head>` mit dem Seitentitel. Dazu die
 * Sprungmarke „Zum Inhalt springen", die außerhalb der Kopfleiste sitzt,
 * damit sie als Erstes angesprungen wird.
 *
 * > **Der Kommentar sagte „Navigation, kein Inhalt" — und drei Stück
 * > Navigation wurden mitgezählt.**
 *
 * Die Zahl sinkt dadurch von 62 % auf 58 %. Das ist **keine Verbesserung der
 * Seiten**, sondern eine Berichtigung der Messung; die Seiten sind dieselben
 * geblieben.
 */
function ohneChrom(html) {
  let s = String(html ?? '');
  for (const marke of CHROM) {
    s = s.replace(new RegExp(`<${marke}[\\s>][\\s\\S]*?</${marke}>`, 'gi'), ' ');
  }
  s = s.replace(/<section class="querverweise">[\s\S]*?<\/section>/gi, ' ');
  return s.replace(/<a class="springen"[^>]*>[\s\S]*?<\/a>/gi, ' ');
}

// `nurText` steht seit dem 5. September in `format.js` — es gab die Funktion
// dreimal im Bestand, und die dritte Fassung wurde gebraucht, als der
// Flächenprüfer HTML lesen musste.

export function eigenerText(html) {
  return nurText(ohneChrom(html));
}

/**
 * Der eigene Text, aufgeteilt nach den Abschnitten der Seite.
 *
 * **Wozu, seit dem 5. September.** Die Dublettenprüfung meldete einen
 * gemeinsamen Anteil und schrieb darunter, was ihn senke, sei die Artikelliste
 * des Lieferanten. Gemessen war das nie. Nachgezählt sind die geteilten Wörter
 * fast vollständig **eigene Textbausteine** — Kennwerthinweis, Frachtabsatz,
 * Mindestbestellwert —, und die kämen mit keiner Lieferantenliste weg.
 *
 * > **Ein Befund, der die Ursache beim Dritten sucht, während sie im eigenen
 * > Haus liegt, macht aus einer lösbaren Aufgabe eine blockierte.**
 *
 * Geteilt wird an `<h2>`, weil die Überschriften der Artikelseiten stabil sind
 * („Technische Kennwerte", „Lieferung"). Was davor steht — Titel, Preistafel,
 * Vorteilssatz — heißt „Kopf und Preistafel".
 */
export function abschnitte(html) {
  const roh = ohneChrom(html);
  const teile = roh.split(/(?=<h2[\s>])/i);
  return teile
    .map((teil, i) => {
      const kopf = teil.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      return {
        titel: kopf ? nurText(kopf[1]) : 'Kopf und Preistafel',
        text: nurText(kopf ? teil.replace(kopf[0], ' ') : teil),
        erster: i === 0,
      };
    })
    .filter((a) => a.text !== '');
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

/**
 * Wo sitzt die Gleichheit? — der Befund je Abschnitt.
 *
 * **Der Anlass, 5. September 2026.** `npm run pruefe-dubletten` meldete
 * „137 von 220 Wörtern auf jeder Seite" und schrieb darunter, was den Anteil
 * senke, sei die Artikelliste des Lieferanten. Diese Zuschreibung war nie
 * gemessen — und sie ist falsch: Der geteilte Text sind fast durchweg eigene
 * Bausteine.
 *
 * > **Eine Gesamtzahl sagt, wie viel gleich ist. Sie sagt nicht, wessen
 * > Gleichheit es ist** — und damit auch nicht, wer sie ändern kann.
 *
 * Gezählt wird je Abschnitt: wie lang er im Mittel ist und wie viele seiner
 * Wörter auf **jeder** Seite stehen. Ein Abschnitt, der auf allen Seiten
 * derselbe ist, kommt auf einen Anteil von 1.
 *
 * @param {{titel: string, text: string}[][]} proSeite  je Seite ihre Abschnitte
 */
export function abschnittsbefund(proSeite) {
  if (!Array.isArray(proSeite) || proSeite.length < 2) {
    throw new Error('Unter zwei Seiten gibt es nichts zu vergleichen — ein leerer Lauf ist kein grüner.');
  }
  const nachTitel = new Map();
  const texteNachTitel = new Map();
  for (const seite of proSeite) {
    for (const a of seite) {
      if (!nachTitel.has(a.titel)) { nachTitel.set(a.titel, []); texteNachTitel.set(a.titel, []); }
      nachTitel.get(a.titel).push(wortmenge(a.text));
      texteNachTitel.get(a.titel).push(a.text);
    }
  }

  const zeilen = [];
  for (const [titel, mengen] of nachTitel) {
    // **Nur Abschnitte, die auf jeder Seite stehen.** Einer, den es nur auf
    // der Hälfte gibt, hätte einen Schnitt über die Hälfte — eine Zahl, die
    // etwas anderes bedeutet als die daneben.
    const aufJederSeite = mengen.length === proSeite.length;
    const gemeinsam = mengen.reduce((s, m) => new Set([...s].filter((w) => m.has(w))), mengen[0]);
    const laenge = mengen.reduce((n, m) => n + m.size, 0) / mengen.length;

    /**
     * **Der Median dazu, und er ist nicht dasselbe.** Der Schnitt über *alle*
     * Seiten ist streng: Ein einziger Ausreißer drückt ihn auf null. Genau das
     * geschieht bei „Technische Kennwerte" — 44 Seiten tragen denselben Absatz,
     * zwei tragen einen zweiten, und der Schnitt meldet fünf Wörter.
     *
     * > **Der Schnitt sagt, was ausnahmslos gleich ist; der Median sagt, wie
     * > gleich zwei beliebige Seiten sind.** Wer nur den Schnitt liest, hält
     * > einen Baustein für unterschiedlich, weil er zwei Fassungen hat.
     */
    const werte = [];
    for (let i = 0; i < mengen.length; i += 1) {
      for (let j = i + 1; j < mengen.length; j += 1) werte.push(aehnlichkeit(mengen[i], mengen[j]));
    }
    werte.sort((a, b) => a - b);

    /**
     * **Und die Zahl, die beide schlägt: wie viele Fassungen es gibt.**
     *
     * Bei „Technische Kennwerte" meldet der Schnitt 11 % und der Median 0,06 —
     * zwei Zahlen, die beide etwas Wahres sagen und beide in die Irre führen.
     * Der Median liegt so tief, weil die Verteilung **zweigipfelig** ist:
     * 24 Seiten tragen die eine Fassung, 22 die andere, und damit sind mehr
     * Paare kreuz als gleich.
     *
     * > **Zwei Fassungen auf 46 Seiten.** Das ist der Satz, nach dem jemand
     * > handeln kann — und keine der beiden Verhältniszahlen sagt ihn.
     */
    const texte = texteNachTitel.get(titel);
    const haeufigkeit = new Map();
    for (const t of texte) haeufigkeit.set(t, (haeufigkeit.get(t) ?? 0) + 1);
    const groesste = Math.max(...haeufigkeit.values());

    zeilen.push({
      titel,
      seiten: mengen.length,
      aufJederSeite,
      mittlereLaenge: laenge,
      gemeinsameWorte: gemeinsam.size,
      anteil: laenge > 0 ? gemeinsam.size / laenge : 0,
      median: werte.length ? werte[Math.floor(werte.length / 2)] : 0,
      fassungen: haeufigkeit.size,
      groessteFassung: groesste,
    });
  }
  zeilen.sort((a, b) => b.gemeinsameWorte - a.gemeinsameWorte);
  return zeilen;
}

/**
 * Welche **Sätze** stehen auf jeder Seite? — je Abschnitt.
 *
 * **Der Anlass, 14. September 2026.** `abschnittsbefund` beantwortet seit dem
 * 5. September die Frage, *wo* die Gleichheit sitzt, und sein eigener Kopf
 * sagt, warum es ihn gibt:
 *
 * > *„Eine Gesamtzahl sagt, wie viel gleich ist. Sie sagt nicht, wessen
 * > Gleichheit es ist — und damit auch nicht, wer sie ändern kann."*
 *
 * Damals war die ungemessene Zuschreibung, den Anteil senke die Artikelliste
 * des Lieferanten. Sie wurde je Abschnitt widerlegt — und durch eine zweite
 * ersetzt, die genauso ungemessen war: *„nur ein Absatz, der je Artikel etwas
 * anderes sagt."*
 *
 * > **Dieselbe Zuschreibung, eine Ebene tiefer — und wieder nicht gemessen.**
 *
 * Gemessen, was im größten Block („Lieferung", 93 von 124 Wörtern) wirklich
 * auf allen 46 Seiten steht: **fünf Sätze von 105.** Zwei davon sind Verweise
 * auf die Lieferseite, drei sind Bedingungen — Mindestbestellwert samt Quelle
 * und Stand, der Grund gegen „frei Haus", und dass die Grenze je Lieferung
 * gilt.
 *
 * > **Ein Satz, der eine Bedingung nennt, ist auf allen Seiten gleich, weil
 * > die Bedingung auf allen Seiten gilt.** Ihn in 46 Fassungen zu schreiben,
 * > sagt nichts Neues — es sagt dasselbe schlechter.
 *
 * Gezählt wird ein Satz als derselbe, wenn er nach Zusammenziehen der
 * Leerzeichen Zeichen für Zeichen gleich ist. Zwei Sätze, die dasselbe anders
 * sagen, gelten damit als verschieden — und das ist die richtige Härte: Genau
 * solche Fassungen sollen sichtbar werden und nicht als Gleichheit gelten.
 *
 * @param {{titel: string, text: string}[][]} proSeite  je Seite ihre Abschnitte
 * @returns {{titel: string, seiten: number, saetze: number, aufJederSeite: string[]}[]}
 */
export function gemeinsameSaetze(proSeite) {
  if (!Array.isArray(proSeite) || proSeite.length < 2) {
    throw new Error('Unter zwei Seiten gibt es nichts zu vergleichen — ein leerer Lauf ist kein grüner.');
  }
  const nachTitel = new Map();
  for (const seite of proSeite) {
    for (const a of seite) {
      if (!nachTitel.has(a.titel)) nachTitel.set(a.titel, []);
      nachTitel.get(a.titel).push(saetzeVon(a.text));
    }
  }

  const zeilen = [];
  for (const [titel, mengen] of nachTitel) {
    if (mengen.length !== proSeite.length) continue;
    const gemeinsam = mengen.reduce((s, m) => new Set([...s].filter((x) => m.has(x))), mengen[0]);
    const alle = new Set(mengen.flatMap((m) => [...m]));
    zeilen.push({
      titel,
      seiten: mengen.length,
      saetze: alle.size,
      aufJederSeite: [...gemeinsam],
    });
  }
  return zeilen;
}

/**
 * Ein Text in seine Sätze.
 *
 * Getrennt wird nach Punkt, Ruf- und Fragezeichen samt folgendem Leerraum. Das
 * ist grob — „z. B." trennt mit —, aber es trennt **auf jeder Seite gleich**,
 * und verglichen werden Seiten gegeneinander und nicht gegen eine Grammatik.
 */
export function saetzeVon(text) {
  return new Set(String(text ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean));
}

/**
 * Die Sätze, die auf **jeder** Artikelseite stehen — mit dem Grund, warum.
 *
 * **Warum es diese Liste gibt, 14. September 2026.** Der Prüfer schreibt unter
 * seine Zahl, die geteilten Sätze seien Bedingungen und Verweise, und in 46
 * Fassungen geschrieben sagten sie dasselbe schlechter. Das ist ein Urteil,
 * und ein Urteil, das nur dasteht, ist am nächsten Tag eine Behauptung.
 *
 * > **Ein Satz über eine Messung, den niemand hält, ist die nächste
 * > ungemessene Zuschreibung.**
 *
 * Geführt wird deshalb jeder geteilte Satz mit seinem Grund, und der Prüfer
 * hält die Liste in **beide** Richtungen: Ein neuer Satz, der auf allen Seiten
 * auftaucht, wird gemeldet — er ist entweder eine Bedingung und gehört hier
 * begründet, oder er ist Füllung und gehört weg. Ein Eintrag, dessen Satz
 * verschwunden ist, wird ebenso gemeldet.
 *
 * Geführt wird der **Anfang** des Satzes und nicht der ganze: Drei der fünf
 * tragen eine Zahl oder ein Datum aus den Daten, und die wandern.
 */
export const GETEILTE_SAETZE = Object.freeze([
  Object.freeze({
    abschnitt: 'Lieferung',
    anfang: 'Die Frachtsätze stehen unter',
    art: 'verweis',
    warum: 'Ein Verweis auf die Seite, die die Sätze führt. Er steht auf jeder Artikelseite, '
      + 'weil jede Artikelseite zu derselben Seite verweist — ihn zu variieren hieße, denselben '
      + 'Weg sechsundvierzigmal anders zu beschreiben.',
  }),
  Object.freeze({
    abschnitt: 'Lieferung',
    anfang: 'Warum die Fracht getrennt ausgewiesen wird',
    art: 'verweis',
    warum: 'Derselbe Fall: ein Verweis auf die Seite „Warum es keine Gratislieferung gibt". Der '
      + 'Grund gegen „frei Haus" gehört ausgeschrieben an eine Stelle und nicht in '
      + 'sechsundvierzig Kurzfassungen.',
  }),
  Object.freeze({
    abschnitt: 'Lieferung',
    anfang: 'Die Fahrt kostet dasselbe, ob ein Sack draufsteht',
    art: 'bedingung',
    warum: 'Der Satz begründet, warum die Frachtpauschale nicht mit der Ware wächst — eine '
      + 'Eigenschaft des Frachtmodells `pauschale`, nicht des Artikels. Er stünde auf jeder '
      + 'Seite gleich, solange dieses Modell gilt, und änderte sich für alle zugleich, wenn es '
      + 'ein anderes wäre.',
  }),
  Object.freeze({
    abschnitt: 'Lieferung',
    anfang: 'Der Mindestbestellwert beträgt',
    art: 'bedingung',
    warum: 'Der Mindestbestellwert samt Quelle und Stand. Er steht in `data/betreiber.json` und '
      + 'gilt je Lieferung — also für jeden Artikel derselbe. Ihn je Artikel anders zu '
      + 'formulieren hieße, eine geprüfte Zahl in sechsundvierzig ungeprüfte Sätze zu streuen.',
  }),
  Object.freeze({
    abschnitt: 'Lieferung',
    anfang: 'Wer mehrere Artikel desselben Lieferanten sammelt',
    art: 'bedingung',
    warum: 'Die Regel, dass die Grenze je Lieferung und nicht je Position gilt. Sie ist genau '
      + 'die Auskunft, die ein Kunde auf der Artikelseite braucht, auf der er steht — und sie '
      + 'ist für jeden Artikel dieselbe, weil die Grenze für jeden dieselbe ist.',
  }),
  /*
   * **Und drei, die ich beim ersten Schreiben dieser Liste übersehen habe.**
   * Eingetragen stand hier „Preis netto …", geraten aus dem Gedächtnis. Der
   * Prüfer hat es in derselben Minute gemeldet — der Eintrag traf keinen Satz,
   * und drei Sätze hatten keinen Eintrag.
   *
   * > **Eine Liste, die in beide Richtungen gehalten wird, berichtigt den, der
   * > sie schreibt.**
   */
  Object.freeze({
    abschnitt: 'Kopf und Preistafel',
    anfang: 'Er nennt den Tag, von dem die Grundlage dieses Preises stammt',
    art: 'bedingung',
    warum: 'Die Erklärung des Preisstands. Sie steht neben einem Datum, das je Artikel ein '
      + 'anderes ist — der erklärende Satz aber ist derselbe, weil der Begriff derselbe ist. '
      + 'Sechsundvierzig Fassungen einer Begriffserklärung wären sechsundvierzig Gelegenheiten, '
      + 'sie verschieden zu erklären.',
  }),
  Object.freeze({
    abschnitt: 'Kopf und Preistafel',
    anfang: 'Verbindlich wird der Preis nicht hier, sondern mit dem Angebot',
    art: 'bedingung',
    warum: 'Der Vorbehalt, dass der ausgewiesene Preis keine Zusage ist. Er trägt die '
      + 'Bindefrist und gilt für jeden Artikel gleich; ihn zu variieren hieße, eine '
      + 'rechtserhebliche Aussage in sechsundvierzig Fassungen zu führen.',
  }),
  Object.freeze({
    abschnitt: 'Kopf und Preistafel',
    anfang: 'Bis dahin ist die Zahl eine Auskunft und keine Zusage',
    art: 'bedingung',
    warum: 'Der Schlusssatz desselben Vorbehalts. Er gehört zum vorigen und teilt dessen Grund '
      + '— und gerade weil er kurz und deutlich ist, wäre jede zweite Fassung davon eine '
      + 'Abschwächung.',
  }),
]);

/**
 * Hält die geteilten Sätze gegen die Liste — in beide Richtungen.
 *
 * @param {{titel: string, aufJederSeite: string[]}[]} befund  aus `gemeinsameSaetze`
 * @param {object[]} gefuehrt
 */
export function geteiltebefund(befund, gefuehrt = GETEILTE_SAETZE) {
  const meldungen = [];
  const getroffen = new Set();

  for (const abschnitt of befund) {
    for (const satz of abschnitt.aufJederSeite) {
      const eintrag = gefuehrt.find((g) => g.abschnitt === abschnitt.titel && satz.startsWith(g.anfang));
      if (eintrag) { getroffen.add(eintrag); continue; }
      meldungen.push({
        regel: 'satz-ohne-grund',
        wo: abschnitt.titel,
        text: `„${satz.slice(0, 70)}…" steht auf jeder Seite und hat keinen Grund — entweder `
          + 'nennt er eine Bedingung und gehört in GETEILTE_SAETZE, oder er ist Füllung',
      });
    }
  }

  for (const g of gefuehrt) {
    if (!getroffen.has(g)) {
      meldungen.push({
        regel: 'grund-ohne-satz',
        wo: g.abschnitt,
        text: `„${g.anfang}…" steht als geteilter Satz mit Grund und steht nicht mehr auf jeder Seite`,
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', wo: g.abschnitt, text: `„${g.anfang}…": Grund zu dünn` });
    }
  }

  return { gefuehrt: gefuehrt.length, meldungen, sauber: meldungen.length === 0 };
}
