/**
 * Derselbe Rumpf an zwei Stellen.
 *
 * **Der Anlass, 14. September 2026.** Drei Runden lang hat ein Register für
 * **Sätze** doppelten **Code** gefunden — jedes Mal, weil wer eine Funktion
 * kopiert, den Absatz darüber mitkopiert. Die Runde davor hat direkt gesucht
 * und über 574 benannte Funktionen genau eine Dublette gefunden: `findeChromium`,
 * fünfmal, in zwei Fassungen, die zwei verschiedene Browser starteten.
 *
 * Diese Fassung liest mehr: auch **Pfeilfunktionen in Konstanten** und
 * **Methoden in Objekten**. Gemessen: 670 Funktionen, 50 Pfeilfunktionen,
 * 1279 Methoden — und darin vier Kopien von zwei Lesern derselben Sache
 * (`argZahl`, `wahl`).
 *
 * ## Was ausdrücklich nicht gelesen wird
 *
 * **Kontrollstrukturen.** `if (…) {` und `for (…) {` sehen aus wie Methoden,
 * und zwei gleiche `if`-Rümpfe sind keine Dublette, sondern zweimal dieselbe
 * kurze Antwort auf zwei verschiedene Fragen. Der erste Entwurf las sie mit
 * und meldete siebzehn Fundstellen von `for (const zeile of abbruchtext(stand))
 * console.error(zeile);` — der Frischeabbruch, der in siebzehn Werkzeugen
 * gleich aussieht, weil er dasselbe tut.
 *
 * > **Ein Aufruf, der überall gleich aussieht, ist kein kopierter Code,
 * > sondern eine benutzte Funktion.**
 *
 * ## Die Grenze
 *
 * Ein Rumpf zählt ab `MINDESTLAENGE` Zeichen. Gemessen über den Bestand:
 * 17 Dubletten ab 20 Zeichen, 16 ab 40, 14 ab 60, 6 ab 100. Der Sprung liegt
 * nicht an einer Stelle — die Grenze ist **gesetzt**.
 *
 * **Sie stand auf 60 und steht seit dem 14. September, abends, auf 50.** Der
 * Anlass ist keine Überlegung, sondern ein Fund: `bin/paketpruefung.mjs` und
 * `bin/kopfzeilenpruefung.mjs` trugen dieselbe Funktion `abbruch`, Zeichen für
 * Zeichen gleich — **57 Zeichen lang.** Drei unter der Schranke, und dieser
 * Prüfer lief darüber grün.
 *
 * > **Eine Schranke, die einen Fund knapp verfehlt, ist kein Maß, sondern ein
 * > Zufall — und sie war gesetzt worden, ohne dass etwas sie geprüft hätte.**
 *
 * Gemessen bei 50: zwei Gruppen gleicher Gestalt kommen dazu, beide begründet
 * (siehe `GESTALT_GEPRUEFT`), keine einzige zeichengleiche. Bei 45 kämen
 * Befundfunktionen dazu, die nur den gemeinsamen Bau eines Befundobjekts
 * teilen; das ist der Punkt, an dem die Messung anfängt, das Hausmuster zu
 * melden statt einer Kopie.
 */

import { bisSchliessend } from './testzerlegung.js';

/** Wörter, hinter denen eine Klammer keine Methode einleitet. */
export const KEINE_METHODE = Object.freeze(
  ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'else', 'do', 'try'],
);

/** Ab wie vielen Zeichen ein gleicher Rumpf als Dublette zählt. */
export const MINDESTLAENGE = 50;

const FORMEN = Object.freeze([
  Object.freeze({ art: 'funktion', muster: /(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g }),
  Object.freeze({ art: 'pfeil', muster: /(?:^|\n)(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g }),
  Object.freeze({ art: 'methode', muster: /\n[ \t]+([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/g }),
]);

/** Der Rumpf ohne Kommentare und ohne überflüssigen Leerraum. */
export function rumpfVon(quelltext, abKlammer) {
  const auf = quelltext.indexOf('{', abKlammer);
  if (auf === -1) return null;
  const zu = bisSchliessend(quelltext, auf);
  if (zu === -1) return null;
  return quelltext.slice(auf + 1, zu)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Jede Funktion, Pfeilfunktion und Methode einer Datei. */
export function rumpfstellen(pfad, quelltext) {
  const gefunden = [];
  for (const { art, muster } of FORMEN) {
    for (const m of String(quelltext).matchAll(muster)) {
      if (art === 'methode' && KEINE_METHODE.includes(m[1])) continue;
      const code = rumpfVon(quelltext, m.index + m[0].length - 1);
      if (!code) continue;
      gefunden.push({ pfad, name: m[1], art, code });
    }
  }
  return gefunden;
}

/**
 * Wörter, die beim Vergleich der **Gestalt** stehen bleiben.
 *
 * Ein Bezeichner, der hier steht, wird nicht durchnummeriert. Das trennt die
 * Gestalt vom Namen: `console.error(a)` und `console.error(b)` sind dieselbe
 * Gestalt, `console.error(a)` und `process.exit(a)` sind es nicht.
 */
export const FESTE_WOERTER = Object.freeze([
  'const', 'let', 'var', 'if', 'else', 'for', 'of', 'in', 'while', 'do', 'switch',
  'case', 'default', 'break', 'continue', 'return', 'throw', 'new', 'typeof',
  'instanceof', 'delete', 'void', 'try', 'catch', 'finally', 'function', 'class',
  'extends', 'super', 'this', 'async', 'await', 'yield', 'true', 'false', 'null',
  'undefined', 'NaN', 'Infinity',
  'console', 'process', 'Error', 'Number', 'String', 'Boolean', 'Object', 'Array',
  'Map', 'Set', 'Math', 'JSON', 'Date', 'RegExp', 'Promise', 'Symbol', 'BigInt',
]);

/**
 * Der Rumpf mit durchnummerierten Bezeichnern — seine **Gestalt**.
 *
 * **Warum es diesen zweiten Vergleich gibt.** Der erste vergleicht Zeichen.
 * Zwei Funktionen, die dasselbe tun und sich in einem Variablennamen
 * unterscheiden, sind für ihn verschieden — das stand am Ende der Runde vom
 * 14. September als offener Punkt. Hier wird jeder freie Bezeichner durch
 * `#1`, `#2`, … in der Reihenfolge seines ersten Auftretens ersetzt.
 *
 * ## Was ausdrücklich **nicht** umbenannt wird
 *
 * **Eigenschaften hinter einem Punkt.** `a.sku` und `b.gruppe` sollen
 * verschieden bleiben: Der Name einer Eigenschaft ist der Vertrag mit den
 * Daten, nicht die Wahl des Schreibers.
 *
 * **Was diese Ausnahme heute wirklich hält — gemessen, nicht behauptet.** Bei
 * der gesetzten Grenze von 50 Zeichen ändert sie am Bestand **nichts**: mit
 * und ohne sie zwei Gruppen. Bei 40 hält sie `src/belegpruefung.js:findeBeleg`
 * und `src/crawler.js:kennungenNach` auseinander, bei 20 zusätzlich
 * `geschaeftstag` und `sperrgutAusGruppe`. Sie steht also nicht gegen einen
 * Fehlalarm von heute, sondern gegen den, der beim nächsten Senken der
 * Schranke käme — und sie steht hier aufgeschrieben, damit niemand sie für
 * gemessen hält, wo sie nur vorsorglich ist.
 *
 * Zeichenketten und Zahlen bleiben ebenfalls stehen. Ein Rumpf, der `2`
 * zurückgibt, und einer, der `1` zurückgibt, sind zwei Antworten.
 */
export function gerippeVon(code) {
  const nummern = new Map();
  let davor = '';
  const nummer = (wort) => {
    if (!nummern.has(wort)) nummern.set(wort, `#${nummern.size + 1}`);
    return nummern.get(wort);
  };
  const ersetze = (stueck) => {
    if (/^`/.test(stueck)) {
      // Im Zeichenkettenteil steht Text, in `${…}` steht **Code**. Ohne diese
      // Unterscheidung wären `` `Abbruch: ${satz}` `` und `` `Abbruch: ${text}` ``
      // verschieden — und das war der Unterschied zwischen zwei der fünf
      // Abbruchmelder, die diese Messung finden sollte.
      davor = stueck;
      return stueck.replace(/\$\{([^{}]*)\}/g, (ganz, drin) => `\${${gerippeTeil(drin, nummer)}}`);
    }
    if (/^['"]/.test(stueck)) { davor = stueck; return stueck; }
    if (!/^[A-Za-z_$]/.test(stueck)) { davor = stueck; return stueck; }
    const nachPunkt = /\.\s*$/.test(davor) && !/\.\.\.\s*$/.test(davor);
    davor = stueck;
    if (nachPunkt || FESTE_WOERTER.includes(stueck)) return stueck;
    return nummer(stueck);
  };
  return String(code).replace(STUECKE, ersetze);
}

/** Die Bezeichner eines Ausdrucks nummerieren — für das Innere von `${…}`. */
function gerippeTeil(text, nummer) {
  let davor = '';
  return String(text).replace(STUECKE, (stueck) => {
    if (/^['"`]/.test(stueck)) { davor = stueck; return stueck; }
    if (!/^[A-Za-z_$]/.test(stueck)) { davor = stueck; return stueck; }
    const nachPunkt = /\.\s*$/.test(davor) && !/\.\.\.\s*$/.test(davor);
    davor = stueck;
    if (nachPunkt || FESTE_WOERTER.includes(stueck)) return stueck;
    return nummer(stueck);
  });
}

const STUECKE = /(['"`])(?:\\.|(?!\1)[\s\S])*\1|[A-Za-z_$][\w$]*|[^A-Za-z_$'"`]+/g;

/**
 * Dubletten, die mit Grund stehen dürfen.
 *
 * Geführt wird der **Name** und die Zahl der Stellen — ein Grund für zwei ist
 * keiner für fünf.
 */
export const DUBLETTE_GEPRUEFT = Object.freeze([
  Object.freeze({
    name: 'zahlAusText',
    hoechstens: 2,
    warum: 'Steht in `src/format.js` und in `src/kontrolle.js`, und das ist der Zweck: Die '
      + 'Belegkontrolle führt **keine** Einfuhren, damit sie nicht dasselbe liest wie das '
      + 'Geprüfte. Ein Leser, der die Schreibweise vom Schreiber bezieht, bestätigt jede '
      + 'Schreibweise, auch eine falsche. Der Grund steht seit dem 30. August im Kopf von '
      + '`src/kontrolle.js` ausgeschrieben.',
  }),
  Object.freeze({
    name: 'lies',
    hoechstens: 2,
    warum: 'Drei Zeilen in `bin/gatepruefung.mjs` und `bin/weisungspruefung.mjs`: eine Datei '
      + 'lesen und `null` zurückgeben, wenn es sie nicht gibt. Der Unterschied zu '
      + '`findeChromium`, das an fünf Stellen stand und auseinanderlief: Dort steckte eine '
      + '**Entscheidung** drin — welche Suchreihenfolge, welcher Rückfall —, und die kann '
      + 'abweichen, ohne dass es auffällt. Hier steckt keine. Ein Modul für drei Zeilen ohne '
      + 'Entscheidung tauschte zwei klare Kopien gegen eine Umleitung.',
  }),
]);

/**
 * Wie viele ungeführte Dubletten stehen bleiben dürfen.
 *
 * **Null**, und das ist keine Strenge, sondern der Stand: Die eine gefundene
 * Dublette ist behoben (`argZahl`, `wahl` → `src/argumente.js`), die eine
 * verbliebene ist begründet.
 */
export const DUBLETTEN_HOECHSTENS = 0;

/**
 * Gleiche **Gestalt**, die mit Grund stehen darf.
 *
 * Geführt wird die Menge der **Namen** — nicht ein Name mit einer Zahl wie
 * oben: Zwei Rümpfe gleicher Gestalt heißen in der Regel verschieden, und
 * genau das ist der Grund, warum der Zeichenvergleich sie nicht fand. Dazu
 * `bisZeichen`: die gemessene Rumpflänge, bis zu der der Grund gilt.
 *
 * **Ein Eintrag, der wieder verschwand.** Hier stand kurz
 * `findeAnnahme`/`findeZahlweg` — bis die Messung zeigte, dass die beiden gar
 * keine Gruppe sind: Ihre Klagen lauten verschieden („Unbekannte Annahme" /
 * „Unbekannter Zahlweg"), und Zeichenketten bleiben beim Nummerieren stehen.
 * Ein Grund für etwas, das der Prüfer nicht meldet, ist selbst ein Befund —
 * die Regel `grund-ohne-gestalt` hat ihn gemeldet, bevor ein Mensch ihn las.
 */
export const GESTALT_GEPRUEFT = Object.freeze([
  Object.freeze({
    namen: Object.freeze(['istBeleg', 'istBuchhaltung', 'istJournal']),
    bisZeichen: 63,
    warum: 'Drei Prädikate in `src/ablageort.js`, je ein Muster auf den Dateinamen — '
      + '`JOURNALMUSTER`, `BUCHHALTUNGSMUSTER`, `BELEGMUSTER`. Gleiche Gestalt, drei '
      + 'verschiedene Muster, und das Muster ist die ganze Aussage. Ein gemeinsames '
      + '`passtAuf(muster, pfad)` verlegte den Unterschied vom Namen der Funktion an die '
      + 'Aufrufstelle: Statt `istBeleg(p)` stünde dort `passtAuf(BELEGMUSTER, p)`. Die '
      + 'Ortssperre liest sich dann nicht mehr wie der Satz, den sie durchsetzt.',
  }),
  Object.freeze({
    namen: Object.freeze(['kundenformen', 'kundenwoerter']),
    bisZeichen: 58,
    warum: 'Zwei Weiterreichungen in `src/shopkern.js` an dasselbe `kundenwortteile`, die '
      + 'sich in genau einem Argument unterscheiden: `wortstaemme` stutzt, `wortformen` '
      + 'nicht. Das **ist** das Ergebnis der Zusammenlegung vom 14. September — vorher '
      + 'standen hier zwei gleiche Schleifen mit 205 Zeichen. Was übrig bleibt, ist die '
      + 'Stelle, an der die beiden Verträge ihre Namen bekommen; sie wegzukürzen hieße, '
      + 'den Aufrufer die Zerlegungsfunktion wählen zu lassen.',
  }),
]);

/**
 * Wie viele ungeführte Gestaltgleichheiten stehen bleiben dürfen.
 *
 * **Null.** Gemessen am 14. September über den Stand davor: drei Gruppen
 * gleicher Gestalt ab 60 Zeichen, alle drei zusammengelegt —
 * `kundenwoerter`/`kundenformen` → `kundenwortteile`,
 * `zahlAus`/`betragAlsZahl` → `deutscheZahl`, `abbruch`/`abbruch` →
 * `abbruchmelder`. Die beiden Gruppen, die das Senken der Schranke auf 50
 * dazubringt, stehen begründet in `GESTALT_GEPRUEFT`.
 */
export const GESTALTEN_HOECHSTENS = 0;

/**
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 */
export function codedublettenbefund(quellen, gefuehrt = DUBLETTE_GEPRUEFT,
  hoechstens = DUBLETTEN_HOECHSTENS, mindestens = MINDESTLAENGE,
  gestaltGefuehrt = GESTALT_GEPRUEFT, gestaltenHoechstens = GESTALTEN_HOECHSTENS) {
  const nach = new Map();
  const nachGestalt = new Map();
  let gelesen = 0;
  for (const [pfad, text] of quellen) {
    for (const stelle of rumpfstellen(pfad, text)) {
      gelesen += 1;
      // Gemessen wird die Länge am **Rohtext**. Die Gestalt ist kürzer —
      // `zeilen` wird zu `#1` —, und eine Grenze auf ihr ließe längere Rümpfe
      // durchfallen, je mehr sprechende Namen sie tragen.
      if (stelle.code.length < mindestens) continue;
      const schluessel = `${stelle.art}|${stelle.code}`;
      if (!nach.has(schluessel)) nach.set(schluessel, []);
      nach.get(schluessel).push(stelle);
      const gestalt = `${stelle.art}|${gerippeVon(stelle.code)}`;
      if (!nachGestalt.has(gestalt)) nachGestalt.set(gestalt, []);
      nachGestalt.get(gestalt).push(stelle);
    }
  }

  const meldungen = [];
  const offen = [];
  const getroffen = new Set();
  for (const [, stellen] of nach) {
    if (stellen.length < 2) continue;
    // Zwei Stellen in **derselben** Datei mit demselben Namen sind ein
    // Treffer des Lesers und keine Dublette — etwa eine Methode, die in zwei
    // Objekten desselben Registers gleich heißt und gleich aussieht.
    const eintrag = gefuehrt.find((g) => stellen.every((s) => s.name === g.name));
    if (eintrag) {
      getroffen.add(eintrag);
      if (stellen.length > eintrag.hoechstens) {
        meldungen.push({
          regel: 'mehr-stellen-als-begruendet',
          text: `\`${eintrag.name}\` steht an ${stellen.length} Stellen, begründet sind ${eintrag.hoechstens}`,
        });
      }
      continue;
    }
    offen.push(stellen);
  }
  offen.sort((a, b) => b[0].code.length - a[0].code.length);

  for (const g of gefuehrt) {
    if (!getroffen.has(g)) {
      meldungen.push({
        regel: 'grund-ohne-dublette',
        text: `\`${g.name}\` steht als begründete Dublette und ist keine mehr`,
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `\`${g.name}\`: Grund zu dünn` });
    }
  }

  if (hoechstens != null && offen.length > hoechstens) {
    meldungen.push({
      regel: 'mehr-dubletten-als-erlaubt',
      text: `${offen.length} gleiche Rümpfe ab ${mindestens} Zeichen — erlaubt sind ${hoechstens}`,
    });
  }
  if (hoechstens != null && offen.length < hoechstens) {
    meldungen.push({
      regel: 'sperrklinke-nachziehen',
      text: `nur noch ${offen.length} gleiche Rümpfe — die Schranke steht auf ${hoechstens} `
        + 'und gehört nachgezogen (DUBLETTEN_HOECHSTENS in src/codedubletten.js)',
    });
  }

  // --- Zweiter Durchgang: gleiche Gestalt, andere Zeichen -------------------
  const gestalten = [];
  const gestaltGetroffen = new Set();
  for (const [, stellen] of nachGestalt) {
    if (stellen.length < 2) continue;
    // Wo alle Zeichen gleich sind, hat der erste Durchgang schon geurteilt.
    if (new Set(stellen.map((st) => st.code)).size < 2) continue;
    const namen = [...new Set(stellen.map((st) => st.name))].sort();
    const eintrag = gestaltGefuehrt.find((g) => [...g.namen].sort().join('|') === namen.join('|'));
    if (eintrag) {
      gestaltGetroffen.add(eintrag);
      // Der Grund ist für **diese** Rümpfe geschrieben. Ein Name bleibt
      // derselbe, während der Rumpf darunter wächst — und ein Grund, der für
      // achtundfünfzig Zeichen galt, deckte dann zweihundert. Deshalb steht
      // die gemessene Länge im Eintrag und wird mitgeprüft.
      const laenge = Math.max(...stellen.map((st) => st.code.length));
      if (eintrag.bisZeichen != null && laenge > eintrag.bisZeichen) {
        meldungen.push({
          regel: 'gestalt-groesser-als-begruendet',
          text: `\`${[...eintrag.namen].join('`, `')}\` sind auf ${laenge} Zeichen gewachsen, `
            + `begründet sind ${eintrag.bisZeichen}`,
        });
      }
      continue;
    }
    gestalten.push(stellen);
  }
  gestalten.sort((a, b) => b[0].code.length - a[0].code.length);

  for (const g of gestaltGefuehrt) {
    if (!gestaltGetroffen.has(g)) {
      meldungen.push({
        regel: 'grund-ohne-gestalt',
        text: `\`${[...g.namen].join('`, `')}\` stehen als begründet gleiche Gestalt und sind keine mehr`,
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `\`${[...g.namen].join('`, `')}\`: Grund zu dünn` });
    }
  }

  if (gestaltenHoechstens != null && gestalten.length > gestaltenHoechstens) {
    meldungen.push({
      regel: 'mehr-gestalten-als-erlaubt',
      text: `${gestalten.length} Gruppen gleicher Gestalt ab ${mindestens} Zeichen — `
        + `erlaubt sind ${gestaltenHoechstens}`,
    });
  }
  if (gestaltenHoechstens != null && gestalten.length < gestaltenHoechstens) {
    meldungen.push({
      regel: 'sperrklinke-nachziehen',
      text: `nur noch ${gestalten.length} Gruppen gleicher Gestalt — die Schranke steht auf `
        + `${gestaltenHoechstens} und gehört nachgezogen (GESTALTEN_HOECHSTENS in src/codedubletten.js)`,
    });
  }

  return { gelesen, offen, gestalten, meldungen, sauber: meldungen.length === 0 };
}
