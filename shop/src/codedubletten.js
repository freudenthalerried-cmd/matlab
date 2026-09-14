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
 * nicht an einer Stelle — die Grenze ist **gesetzt**: Unter sechzig Zeichen
 * ist ein gleicher Rumpf häufiger dieselbe triviale Antwort als eine Kopie.
 */

import { bisSchliessend } from './testzerlegung.js';

/** Wörter, hinter denen eine Klammer keine Methode einleitet. */
export const KEINE_METHODE = Object.freeze(
  ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'else', 'do', 'try'],
);

/** Ab wie vielen Zeichen ein gleicher Rumpf als Dublette zählt. */
export const MINDESTLAENGE = 60;

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
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 */
export function codedublettenbefund(quellen, gefuehrt = DUBLETTE_GEPRUEFT,
  hoechstens = DUBLETTEN_HOECHSTENS, mindestens = MINDESTLAENGE) {
  const nach = new Map();
  let gelesen = 0;
  for (const [pfad, text] of quellen) {
    for (const stelle of rumpfstellen(pfad, text)) {
      gelesen += 1;
      if (stelle.code.length < mindestens) continue;
      const schluessel = `${stelle.art}|${stelle.code}`;
      if (!nach.has(schluessel)) nach.set(schluessel, []);
      nach.get(schluessel).push(stelle);
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

  return { gelesen, offen, meldungen, sauber: meldungen.length === 0 };
}
