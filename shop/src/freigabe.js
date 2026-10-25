/**
 * Darf eine gebaute Ausgabe hinaus? — die vier Fragen vor dem Hochladen.
 *
 * **Der Anlass, 25. Oktober 2026.** Weisung des Auftraggebers: „mach die
 * github action". Die Action schiebt `ausgabe/site` auf den Webspace, und das
 * ist der erste Weg in diesem Projekt, auf dem etwas das Haus verlässt, ohne
 * dass ein Mensch es vorher ansieht.
 *
 * > **Ein Bau, der nur prüft, ob er gelingt, prüft nicht, ob er hinaus darf.**
 *
 * Das Gate vor jedem Commit fragt, ob der Bestand in sich stimmt. Diese
 * Prüfung fragt etwas anderes: ob das, was hier liegt, vor einem fremden
 * Menschen bestehen kann. Sie steht deshalb **nicht** im Prüfregister — sie
 * wäre heute rot, und zwar zu Recht: Das Impressum trägt vier sichtbare
 * Lücken, und daran darf kein Commit scheitern.
 *
 * ## Warum die Regeln hier stehen und nicht im Werkzeug
 *
 * Zuerst standen sie in `bin/freigabepruefung.mjs`, und `pruefe-regeln` hat
 * sie am selben Tag gemeldet: vier Regelstellen, die kein Testfall je hat
 * feuern sehen. Eine Regel in einem Skript ist eine Regel, die niemand
 * auslösen kann, ohne das Skript zu starten — und was man nur im Ganzen
 * auslösen kann, prüft man nicht.
 *
 * Diese Funktion bekommt deshalb **Befunde** herein und liest nichts selbst:
 * keine Dateien, keine Uhr, kein Git. Das Werkzeug sammelt, diese Stelle
 * urteilt.
 */

/**
 * Wie viele Seiten mindestens dastehen müssen.
 *
 * Keine Messung, eine Schranke: Der heutige Bau liefert 85 Seiten. Die Zahl
 * steht tief, weil sie nicht „ist der Bau vollständig" beantwortet, sondern
 * „ist hier überhaupt ein Bau". Ein halbes Verzeichnis über eine laufende
 * Seite zu spiegeln, ist der Schaden, den sie verhindert.
 */
export const MINDESTSEITEN = 10;

/**
 * @param {object} lage
 * @param {number} lage.seiten          Zahl der HTML-Seiten im Verzeichnis
 * @param {number} lage.quelleStand     Unix-Sekunden des jüngsten Quell-Commits
 * @param {number} lage.ausgabeStand    Unix-Sekunden des jüngsten Ausgabe-Commits
 * @param {{kennung:string,id:string,fund:string,umfeld:string,warum:string}[]} lage.internafunde
 * @param {{seite:string,was:string}[]} lage.luecken  sichtbare Lücken der Rechtsseiten
 * @param {boolean} [lage.ohneImpressum]  die vierte Frage ausdrücklich übergehen
 */
export function freigabebefund({
  seiten, quelleStand, ausgabeStand, internafunde = [], luecken = [],
  ohneImpressum = false, mindestens = MINDESTSEITEN,
}) {
  const meldungen = [];
  const tag = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ') : '—');

  /*
   * **1. Liegt überhaupt etwas da?** Ein leeres oder halbes Verzeichnis
   * hochzuladen, löscht im schlimmsten Fall eine laufende Seite.
   */
  if (seiten < mindestens) {
    meldungen.push({
      regel: 'ausgabe-zu-duenn',
      satz: `nur ${seiten} Seite(n) im Verzeichnis, erwartet sind mindestens ${mindestens} — `
        + 'ein halber Bau, der eine laufende Seite überschreibt, ist schlimmer als keiner',
    });
  }

  /*
   * **2. Ist die Ausgabe jünger als ihre Quelle?** Gemessen an den Commits
   * und nicht an den Dateizeiten: In einem frischen Klon tragen alle Dateien
   * die Zeit des Auscheckens, und ein Vergleich der Zeitstempel meldete dort
   * immer Grün. Eine Frischeprüfung, die im Klon nicht misst, ist genau dort
   * blind, wo sie gebraucht wird.
   */
  if (ausgabeStand < quelleStand) {
    meldungen.push({
      regel: 'ausgabe-haengt-hinterher',
      satz: `die Quelle ist am ${tag(quelleStand)} zuletzt geändert worden, das gebaute `
        + `Verzeichnis am ${tag(ausgabeStand)} — hochgeladen würde eine Seite von vorgestern. `
        + 'Zuerst `npm run website`, dann den Bau mitcommitten.',
    });
  }

  /*
   * **3. Steht ein internes Wort darin?** Dieselbe Prüfung wie im Bau, dort
   * aber über die Seiten. Hier über **jede** Datei des Verzeichnisses — am
   * 23. Oktober stand ein Pfad zur Preisdatei im ausgelieferten `shop.js`,
   * und beide Prüfungen des Baus sahen ihn nicht, weil beide Seiten lasen.
   */
  for (const f of internafunde) {
    meldungen.push({
      regel: 'internes-wort',
      satz: `${f.kennung} [${f.id}] „${f.fund}" — … ${f.umfeld} … → ${f.warum}`,
    });
  }

  /*
   * **4. Ist das Impressum vollständig?** Solange eine Rechtsseite eine
   * sichtbare Lücke trägt, ist sie ein Gerüst. Das darf man ansehen, und man
   * darf es nicht als Shop veröffentlichen: § 5 ECG verlangt diese Angaben ab
   * dem ersten Aufruf.
   */
  if (luecken.length && !ohneImpressum) {
    const was = [...new Set(luecken.map((l) => l.was))].join(', ');
    const seitenZahl = new Set(luecken.map((l) => l.seite)).size;
    meldungen.push({
      regel: 'pflichtangabe-fehlt',
      satz: `${luecken.length} sichtbare Lücke(n) auf ${seitenZahl} Seite(n): ${was}. `
        + '§ 5 ECG verlangt diese Angaben ab dem ersten Aufruf — eine Vorschau darf sie '
        + 'zeigen, ein Shop nicht. Einzutragen in data/betreiber.json; der Zettel dazu '
        + 'steht in `npm run zettel`.',
    });
  }

  return {
    geprueft: 4,
    durchgelassen: ohneImpressum && luecken.length > 0 ? luecken.length : 0,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
