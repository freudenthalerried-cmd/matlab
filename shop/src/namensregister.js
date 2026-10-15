/**
 * Ein Name, zwei Module — **31-mal in diesem Haus.**
 *
 * **Der Anlass, 14. September 2026, mittags.** „Derselbe Name für einen
 * anderen Vertrag ist schlimmer als zwei Fassungen" steht seit dem
 * 8. September in den Runden dieses Hauses, und seither ist der Satz am 11.,
 * am 13. und zweimal am 14. September durch **Zufall** wiedergefunden worden:
 * fünfmal `findeChromium` in zwei Fassungen, viermal `argZahl`/`wahl` in zwei
 * Verträgen, fünfmal `abbruch` in drei Verträgen. Jedes Mal hat ein Werkzeug
 * ihn gefunden, das nach etwas anderem suchte.
 *
 * > **Ein Satz, der viermal durch Zufall wiedergefunden wird, gehört
 * > gemessen.**
 *
 * Gemessen: **972 exportierte Namen, 31 davon in mehr als einem Modul.**
 *
 * ## Was dabei herauskam
 *
 * Nicht jede Doppelung ist ein Fehler. Ein Haus darf eine Sprache haben:
 * `registerbefund` heißt in vier Modulen dasselbe, weil es dasselbe tut. Drei
 * Gruppen sind aber keine Sprache, sondern eine Verwechslung:
 *
 * | Name | Werte |
 * |---|---|
 * | `GRUND_MINDESTLAENGE` | 150, 150, 150, 150, **120**, **120** |
 * | `MINDESTGRUND` — derselbe Begriff, zweiter Name | 60, **40**, **40** |
 * | `KOPFZEILEN` | 6, 6, 6, **14**, **15** — und in `src/serverkopf.js` **eine Liste** |
 * | `ohneKommentare` | drei Fassungen, drei Verträge |
 *
 * **„Wie lang muss ein Grund sein?" beantwortet dieses Haus fünfmal
 * verschieden** — 40, 60, 80 (in drei Registern gar nicht benannt), 120, 150 —
 * unter **zwei** Namen. Keine dieser Zahlen ist je entschieden worden; sie
 * sind entstanden.
 *
 * ## Was gemessen wird
 *
 * Nur **exportierte** Namen, und nur die Deklarationen (`export function`,
 * `export const`). Ein örtlicher Helfer darf in jeder Datei `lies` heißen —
 * er verlässt sie nicht. Ein exportierter Name ist ein Versprechen nach außen,
 * und zwei Versprechen unter einem Namen sind eines zu viel.
 */

/** Woran eine Ausfuhr erkannt wird — am Zeilenanfang, damit kein Zitat zählt. */
const AUSFUHR = /^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm;

/** @returns {string[]} die Namen, die diese Datei nach außen gibt */
export function exportierteNamen(quelltext) {
  return [...new Set([...String(quelltext ?? '').matchAll(AUSFUHR)].map((m) => m[1]))];
}

/**
 * Namen, die mit Grund in mehr als einem Modul stehen.
 *
 * Geführt wird der **Name** und die Zahl der Module — ein Grund für zwei ist
 * keiner für sechs.
 */
export const NAME_GEPRUEFT = Object.freeze([
  Object.freeze({
    name: 'registerbefund',
    hoechstens: 4,
    warum: 'Die Sprache dieses Hauses, nicht eine Verwechslung: Ein Register wird gegen die '
      + 'Wirklichkeit gehalten, und das Ergebnis heißt `registerbefund` — in '
      + '`src/gegenprobenregister.js`, `src/pruefregister.js`, `src/quellenstempel.js` und '
      + '`src/umschreibung.js`. Alle vier nehmen ein Verzeichnis und geben `{ meldungen, '
      + 'sauber }` zurück. Vier verschiedene Namen für dieselbe Bauart wären schwerer zu '
      + 'lesen, nicht leichter.',
  }),
  Object.freeze({
    name: 'kennzahlen',
    hoechstens: 3,
    warum: 'Dieselbe Bauart wie `registerbefund`: die messbaren Zahlen eines Gegenstandes, '
      + 'gesammelt an einer Stelle — in `src/kennzahlen.js` für den Betrieb, in '
      + '`src/punktezahlen.js` für die Kampagne, in `src/schaufenster.js` für die '
      + 'PR-Beschreibung. Jede der drei nimmt ihren eigenen Gegenstand entgegen; keine '
      + 'könnte für eine andere einspringen, und keine gibt vor, es zu können.',
  }),
  Object.freeze({
    name: 'TAGE_JE_MONAT',
    hoechstens: 2,
    warum: 'Dreißig Tage, zweimal gleich, in `src/suchbedarf.js` und `src/werbewirkung.js`. '
      + 'Beide rechnen Suchanfragen eines Monats auf Tage um, und beide runden auf dieselbe '
      + 'glatte Zahl — das ist keine Messung, sondern eine Rechenvereinbarung. Sie in ein '
      + 'gemeinsames Modul zu ziehen tauschte zwei klare Zeilen gegen eine Einfuhr, und die '
      + 'Zahl stünde weiter zweimal da: einmal als Wert, einmal als Erwartung im Test.',
  }),
]);

/**
 * Wie viele ungeführte Doppelnamen stehen bleiben dürfen.
 *
 * **Eine Sperrklinke auf dem gemessenen Stand.** Sie darf fallen und nie
 * steigen. Gemessen am 14. September: 31 von 972 Namen. Drei sind behoben,
 * drei begründet.
 */
export const NAMEN_HOECHSTENS = 25;

/**
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 */
export function namensbefund(quellen, gefuehrt = NAME_GEPRUEFT, hoechstens = NAMEN_HOECHSTENS) {
  const wo = new Map();
  for (const [pfad, text] of quellen) {
    for (const name of exportierteNamen(text)) {
      if (!wo.has(name)) wo.set(name, []);
      wo.get(name).push(pfad);
    }
  }

  const meldungen = [];
  const getroffen = new Set();
  const offen = [];
  for (const [name, module] of wo) {
    if (module.length < 2) continue;
    const eintrag = gefuehrt.find((g) => g.name === name);
    if (eintrag) {
      getroffen.add(eintrag);
      if (module.length > eintrag.hoechstens) {
        meldungen.push({
          regel: 'mehr-module-als-begruendet',
          text: `\`${name}\` steht in ${module.length} Modulen, begründet sind ${eintrag.hoechstens}`,
        });
      }
      continue;
    }
    offen.push({ name, module: module.sort() });
  }
  offen.sort((a, b) => b.module.length - a.module.length || a.name.localeCompare(b.name));

  for (const g of gefuehrt) {
    if (!getroffen.has(g)) {
      meldungen.push({
        regel: 'grund-ohne-namen',
        text: `\`${g.name}\` steht als begründeter Doppelname und steht nicht mehr in zwei Modulen`,
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `\`${g.name}\`: Grund zu dünn` });
    }
  }

  if (hoechstens != null && offen.length > hoechstens) {
    meldungen.push({
      regel: 'mehr-doppelnamen-als-erlaubt',
      text: `${offen.length} exportierte Namen stehen in mehr als einem Modul — `
        + `erlaubt sind ${hoechstens}`,
    });
  }
  if (hoechstens != null && offen.length < hoechstens) {
    meldungen.push({
      regel: 'sperrklinke-nachziehen',
      text: `nur noch ${offen.length} ungeführte Doppelnamen — die Schranke steht auf `
        + `${hoechstens} und gehört nachgezogen (NAMEN_HOECHSTENS in src/namensregister.js)`,
    });
  }

  return { namen: wo.size, offen, meldungen, sauber: meldungen.length === 0 };
}
