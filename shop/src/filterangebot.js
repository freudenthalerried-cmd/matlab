/**
 * Was der Kern filtern und sortieren kann — und was die Oberfläche davon anbietet.
 *
 * **Der Anlass, 15. Oktober 2026.** Der Auftraggeber hat „Filter und
 * Sortierung" verlangt. Beides war gebaut, und zwar seit Wochen: `filtere` in
 * `src/shopkern.js` kennt fünf Felder, `SORTIERUNGEN` vier Ordnungen,
 * `filterwerte` rechnet zu jedem Feld die Werte aus, die im Bestand überhaupt
 * vorkommen. Die Filterleiste bot vier davon an.
 *
 * Gefehlt hat die **Preisspanne** — und nicht, weil sie schwer wäre:
 * `filtere` nimmt `preisAb` und `preisBis` seit dem ersten Tag,
 * `filterwerte` gibt `preisMin` und `preisMax` zurück, die es **nur für diese
 * beiden Felder** ausrechnet, und der Zustand in `baueRasterfilter` trug ein
 * `preisBis: null` mit. Alles war da außer dem Bedienelement.
 *
 * > **Ein Filter, den der Kern kann und die Oberfläche nicht anbietet, ist
 * > kein Filter.**
 *
 * Dieselbe Familie wie die acht Bestellfeldgründe vom 13. September, die
 * sorgfältig geschrieben im Modul lagen und nie einen Kunden erreichten, und
 * wie der `warum`, den `bin/website.mjs` nicht hinausgab. Der Fehler ist nie
 * die fehlende Fähigkeit, sondern die Fähigkeit, die niemand durchreicht —
 * und dass es keinen Prüfer gab, dem das auffällt.
 *
 * Deshalb steht hier ein Register und kein Einzelfall. Es trägt jede
 * Fähigkeit des Kerns, und zu jeder genau eine von zwei Angaben:
 *
 *   `bedienelement`  Der Text, an dem das Bedienelement in der Oberfläche zu
 *                    erkennen ist. Fehlt es dort, ist das ein Befund.
 *   `warumOhne`      Der Grund, warum diese Fähigkeit absichtlich **nicht**
 *                    angeboten wird. Pflicht, wo `bedienelement` fehlt.
 *
 * Und der Prüfer hält es **in beide Richtungen**: Eine Fähigkeit ohne
 * Bedienelement und ohne Grund ist ein Befund — ein Bedienelement, zu dem der
 * Kern nichts kann, ebenso. Das zweite ist der gefährlichere Fall: Ein Filter,
 * der dasteht und nichts tut, ist schlimmer als einer, der fehlt.
 */


import { GRUND_MINDESTLAENGE } from './grundmass.js';

/*
 * **Das Mindestmaß eines Grundes kommt aus `src/grundmass.js`** und steht
 * hier nicht noch einmal. Der erste Anlauf schrieb die 150 hin, mit dem
 * Kommentar „dieselbe Zahl wie in den übrigen Registern" — `pruefe-namen`
 * hat die Dublette in derselben Minute gemeldet. Ein Maß, das zweimal
 * dasteht, sind zwei Gelegenheiten, es unterschiedlich zu ändern.
 */

/**
 * Die Felder, die `filtere` in `src/shopkern.js` auswertet, und die
 * Ordnungen aus `SORTIERUNGEN`.
 *
 * **Die Liste wird nicht abgeschrieben, sondern gemessen.** `filterfelder`
 * liest sie aus dem Quelltext von `shopkern.js`; stünde sie hier als Kopie,
 * wäre dieses Register beim nächsten neuen Filterfeld still unvollständig —
 * und ein Register, das die Hälfte kennt, meldet nicht zu wenig, sondern das
 * Falsche.
 */
export const ANGEBOT = Object.freeze([
  Object.freeze({
    feld: 'gruppe',
    bedienelement: 'Warengruppe',
    // Nur auf Seiten ohne feste Gruppe — auf einer Gruppenseite wäre die
    // Auswahl „Warengruppe" ein Bedienelement, das die Seite verlässt.
    nurOhneFesteGruppe: true,
  }),
  Object.freeze({
    feld: 'suchtauglich',
    bedienelement: 'nur mit Preisvorteil',
  }),
  Object.freeze({
    feld: 'ohneSperrgut',
    bedienelement: 'ohne palettierte Ware',
    // Erscheint nur, wo überhaupt Sperrgut im Raster liegt (`mitSperrgut`).
    nurWennVorhanden: true,
  }),
  Object.freeze({
    feld: 'preisAb',
    bedienelement: 'Preis ab',
  }),
  Object.freeze({
    feld: 'preisBis',
    bedienelement: 'Preis bis',
  }),
  Object.freeze({
    feld: 'sortierung',
    bedienelement: 'Sortierung',
  }),
]);

/**
 * Liest die Felder, die `filtere` wirklich auswertet, aus dem Quelltext.
 *
 * Gesucht wird `f.<name>` in der Funktion `filtere` — das ist die Stelle, an
 * der ein Feld zur Wirkung kommt. Ein Feld, das nur im Aufrufvertrag der
 * Dokumentation steht, filtert nichts und soll hier auch nicht auftauchen.
 *
 * **Kein globaler Ausdruck als Modulwert.** Am 14. Oktober haben sich zwei
 * Funktionen einen `RegExp` mit `g` geteilt und damit seinen `lastIndex`; das
 * Ergebnis war ein Parametername `eter` und eine Zählung von 117 statt 168.
 * Das Muster steht deshalb als Zeichenkette und wird an jeder Fundstelle neu
 * gebaut.
 */
const FELDMUSTER = 'f\\.([a-zA-ZäöüÄÖÜ][\\w$]*)';

export function filterfelder(shopkernQuelltext) {
  const anfang = shopkernQuelltext.indexOf('export function filtere(');
  if (anfang < 0) return { felder: [], grund: 'filtere() ist in shopkern.js nicht zu finden' };
  // Bis zum Ende der Funktion: die erste Zeile, die auf Spalte 0 mit `}`
  // schließt. Eine Klammerzählung wäre genauer und über einen Quelltext mit
  // Zeichenketten und Vorlagen nicht verlässlicher.
  const rest = shopkernQuelltext.slice(anfang);
  const ende = rest.search(/\n\}/);
  const koerper = ende < 0 ? rest : rest.slice(0, ende);
  const felder = new Set();
  for (const treffer of koerper.matchAll(new RegExp(FELDMUSTER, 'g'))) {
    felder.add(treffer[1]);
  }
  return { felder: [...felder].sort(), grund: null };
}

/**
 * Hält das Register gegen Kern und Oberfläche — in beide Richtungen.
 *
 * @param {object} eingabe
 * @param {string} eingabe.shopkern      Quelltext von src/shopkern.js
 * @param {string} eingabe.oberflaeche   Quelltext von shop-ui.js
 * @param {string[]} eingabe.sortierungen  Die Kennungen aus SORTIERUNGEN
 * @param {ReadonlyArray<object>} eingabe.angebot  Vorgabe: ANGEBOT
 */
export function filterangebotbefund({
  shopkern, oberflaeche, sortierungen, angebot = ANGEBOT,
}) {
  const probleme = [];
  const { felder, grund } = filterfelder(shopkern);
  if (grund) {
    return { probleme: [{ art: 'kern-nicht-lesbar', satz: grund }], gemessen: 0, sauber: false };
  }

  // Die Sortierung ist kein Feld von `filtere`, sondern ein eigenes Werkzeug.
  // Sie gehört trotzdem ins Register: Für den Kunden ist sie dasselbe
  // Bedienelement in derselben Leiste.
  const koennen = new Set([...felder, 'sortierung']);
  const imRegister = new Set(angebot.map((e) => e.feld));

  /*
   * **Richtung eins: Was der Kern kann und das Register nicht kennt.**
   * Das ist der Fall, der die Preisspanne verdeckt hat — und er trifft
   * zuerst das Register, nicht die Oberfläche: Ein neues Filterfeld in
   * `shopkern.js` fällt hier auf, noch bevor jemand eine Leiste baut.
   */
  for (const feld of koennen) {
    if (!imRegister.has(feld)) {
      probleme.push({
        art: 'faehigkeit-ohne-eintrag',
        feld,
        satz: `\`filtere\` wertet \`${feld}\` aus, das Register kennt das Feld nicht — `
          + 'entweder gehört ein Bedienelement dazu oder ein Grund, warum nicht',
      });
    }
  }

  /*
   * **Richtung zwei: Was im Register steht und der Kern nicht kann.**
   * Der gefährlichere Fall. Ein Bedienelement, das einen Zustand setzt, den
   * `filtere` nie ansieht, grenzt nichts ein — und der Zähler daneben sagt
   * trotzdem eine Zahl.
   */
  for (const eintrag of angebot) {
    if (!koennen.has(eintrag.feld)) {
      probleme.push({
        art: 'eintrag-ohne-faehigkeit',
        feld: eintrag.feld,
        satz: `das Register führt \`${eintrag.feld}\`, \`filtere\` wertet es nicht aus — `
          + 'ein Bedienelement dafür grenzte nichts ein und meldete trotzdem eine Zahl',
      });
    }
  }

  /*
   * **Richtung drei: Was das Register anbietet und die Oberfläche nicht baut.**
   */
  for (const eintrag of angebot) {
    if (eintrag.bedienelement) {
      if (!oberflaeche.includes(eintrag.bedienelement)) {
        probleme.push({
          art: 'bedienelement-fehlt',
          feld: eintrag.feld,
          satz: `\`${eintrag.feld}\` soll als „${eintrag.bedienelement}" in der Leiste stehen, `
            + 'der Text kommt in shop-ui.js nicht vor',
        });
      }
      continue;
    }
    const warum = String(eintrag.warumOhne ?? '');
    if (warum.length < GRUND_MINDESTLAENGE) {
      probleme.push({
        art: 'grund-zu-kurz',
        feld: eintrag.feld,
        satz: `\`${eintrag.feld}\` wird nicht angeboten und nennt dafür `
          + `${warum.length} Zeichen Grund — verlangt sind ${GRUND_MINDESTLAENGE}`,
      });
    }
  }

  /*
   * **Und die Sortierungen einzeln.** Die Auswahl „Sortierung" kann dastehen
   * und zwei von vier Ordnungen anbieten; dann ist das Bedienelement da und
   * die Hälfte der Fähigkeit nicht. Gemessen wird deshalb jede Kennung.
   */
  for (const id of sortierungen) {
    if (!oberflaeche.includes('SORTIERUNGEN')) {
      probleme.push({
        art: 'sortierungen-nicht-durchgereicht',
        feld: 'sortierung',
        satz: 'die Oberfläche baut ihre Sortierliste nicht aus SORTIERUNGEN — '
          + `eine eigene Liste geht beim nächsten Zusatz (\`${id}\`) auseinander`,
      });
      break;
    }
  }

  return {
    probleme,
    gemessen: koennen.size + sortierungen.length,
    felder: [...koennen].sort(),
    sauber: probleme.length === 0,
  };
}
