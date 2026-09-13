/**
 * Trägt jede Zahl auf den Inhaltsseiten eine Fundstelle?
 *
 * **Der Anlass, 7. September 2026.** `npm run pruefe-quellen` meldet seit
 * Wochen „Aussagen: 6 von 6 belegt" — und das stimmt. Es ist nur eine Aussage
 * über das **Register**, nicht über die Seiten: Gezählt werden die
 * eingetragenen Aussagen, nicht die geschriebenen.
 *
 * > **Ein Quellenregister, das nur die eingetragenen Aussagen zählt, ist so
 * > vollständig wie die Eintragung.**
 *
 * Gemessen wurde deshalb von der anderen Seite: alle Zahlen mit Einheit auf
 * den Inhaltsseiten. Es sind wenige genug, um jede einzeln anzusehen — und
 * vier standen ohne Eintrag da. Bitter daran: **Alle vier nennen ihre Quelle
 * im laufenden Satz.** Zwei berufen sich auf denselben Abschnitt 5.7.1 der
 * ÖNORM B 2501, aus dem vier Zeilen darüber die eingetragenen Gefällewerte
 * stammen; zwei auf die eigenen Lieferantenrechnungen. Der Text war ehrlich,
 * das Register unvollständig — und geprüft hat es niemand.
 *
 * Eine Zahl ohne Fundstelle ist auf diesen Seiten keine Kleinigkeit: Sie
 * stehen dort, damit ein Handwerker den richtigen Artikel bestellt. Ein
 * falscher Gefällewert kostet eine Kanalleitung.
 */

/** Zahlen mit Einheit — das, was man nachrechnen oder nachschlagen kann. */
export const ZAHLMUSTER = /(\d[\d.]*(?:,\d+)?)\s*(€|%|Tage|Werktage|mm|cm|m²|kg|°)/g;

/**
 * Ordner unter `inhalte/`, die nicht gemessen werden.
 *
 * Nur einer, und er ist keine Inhaltsseite: `probe/` ist die Vorlage für
 * `npm run pruefe-quellen --probe` und enthält mit Absicht erfundene Zahlen.
 * Sie dort zu belegen hieße, die Vorlage zur Wahrheit zu erklären.
 */
export const AUSSER = Object.freeze(['probe/']);

/**
 * Zahlen, die keine Fundstelle brauchen — mit dem Grund.
 *
 * Gruppiert nach dem Zahlwert, weil der Grund am Wert hängt und nicht an der
 * Seite: Dieselbe Bezugsgröße steht auf vier Seiten.
 */
export const OHNE_FUNDSTELLE = Object.freeze([
  Object.freeze({
    wert: '100 m²',
    warum: 'Die **Bezugsgröße** der Systemlisten und der Mengenseite, nicht eine Aussage über '
      + 'die Welt: Gerechnet wird beispielhaft auf hundert Quadratmeter Fassade, weil eine '
      + 'Mengenliste eine Fläche braucht, auf die sie sich bezieht. Belegpflichtig ist, was '
      + 'daraus folgt — Kleber je m², Dübel je m², Gewebeüberlappung —, und das steht mit '
      + 'seiner Norm im Register.',
  }),
  Object.freeze({
    wert: '1.934 €',
    warum: 'Die Summe eines zugestellten Lieferantenbelegs, neben der Summe eines zweiten der '
      + 'Beleg dafür, dass die Frachtpauschale an der Fahrt hängt und nicht am Warenwert. Sie '
      + 'steht **nicht** im Quellenregister, und das ist Absicht: Dessen `_grenze` sagt seit '
      + 'dem 27. August, eine eigene Rechnung sei kein Beleg in seinem Sinn, sondern ein '
      + 'Geschäftsvorfall. Nachprüfbar ist sie in `preise/`, und das liegt bewusst außerhalb '
      + 'des Verzeichnisses.',
  }),
  Object.freeze({
    wert: '614 €',
    warum: 'Die zweite der beiden Rechnungssummen — sie erst macht die Aussage zu einer: '
      + 'Zwei Belege, dieselbe Frachtpauschale, dreifacher Warenwert. Gleiche Lage wie bei '
      + '1.934 €: Ein Geschäftsvorfall ist keine Fundstelle, und aus zwei Rechnungssummen '
      + 'lässt sich keine Spanne rechnen — sie sagen etwas über die Fracht, nicht über den '
      + 'Aufschlag eines Artikels.',
  }),
  Object.freeze({
    wert: '87 °',
    warum: 'Die **Handelsbezeichnung** des gebräuchlichen KG-Bogens, kein Satz über die Welt: '
      + 'So heißt das Teil im Katalog und beim Lieferanten. Belegpflichtig ist die Aussage '
      + 'daneben — dass er in Grund- und Sammelleitungen der falsche Artikel ist —, und die '
      + 'steht als `a-kanal-bogen` mit der ÖNORM B 2501 im Register.',
  }),
  Object.freeze({
    wert: '90 °',
    warum: 'Rechnung, keine Fundstelle: Zwei Bögen zu 45° ergeben einen Richtungswechsel um '
      + '90°. Der Satz wendet die eingetragene 45°-Regel an, statt eine zweite Behauptung '
      + 'aufzustellen — und eine Quelle für „zweimal fünfundvierzig ist neunzig" wäre eine '
      + 'Verlegenheitsangabe.',
  }),
]);

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const GRUND_MINDESTLAENGE = 150;

/**
 * Hält jede Zahl der Inhaltsseiten gegen das Quellenregister — in beide
 * Richtungen.
 *
 * @param {object} eingabe
 * @param {{datei: string, text: string}[]} eingabe.seiten
 * @param {{text: string}[]} eingabe.aussagen  aus `inhalte/quellen.json`
 */
export function zahlenbefund({
  seiten, aussagen, ohneFundstelle = OHNE_FUNDSTELLE, ausser = AUSSER,
}) {
  const meldungen = [];
  const belegtexte = aussagen.map((a) => a.text).join('\n');
  const ausnahmen = new Map(ohneFundstelle.map((o) => [o.wert, o]));
  const benutzt = new Set();
  const gefunden = [];

  for (const s of seiten) {
    if (ausser.some((a) => s.datei.startsWith(a))) continue;
    for (const m of s.text.matchAll(ZAHLMUSTER)) {
      const wert = `${m[1]} ${m[2]}`;
      gefunden.push({ datei: s.datei, wert });
      if (ausnahmen.has(wert)) { benutzt.add(wert); continue; }
      if (belegtexte.includes(m[1])) continue;
      meldungen.push({
        regel: 'zahl-ohne-fundstelle',
        datei: s.datei,
        wert,
        text: `${s.datei}: „${wert}" steht auf der Seite und in keiner belegten Aussage — `
          + 'entweder gehört die Aussage ins Register oder die Zahl von der Seite',
      });
    }
  }

  for (const o of ohneFundstelle) {
    if (!benutzt.has(o.wert)) {
      meldungen.push({
        regel: 'grund-ohne-zahl',
        wert: o.wert,
        text: `„${o.wert}" ist als fundstellenfrei begründet und steht auf keiner Seite mehr — `
          + 'die Begründung deckt einen Zustand, den es nicht gibt',
      });
    }
    if (o.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({ regel: 'grund-zu-kurz', wert: o.wert, text: `„${o.wert}": der Grund ist zu knapp` });
    }
  }

  return {
    seiten: seiten.filter((s) => !ausser.some((a) => s.datei.startsWith(a))).length,
    zahlen: gefunden.length,
    ohneFundstelle: benutzt.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
