/**
 * Was von außen zu sehen ist — gemessen statt angenommen.
 *
 * **Der Anlass, 9. September 2026, nachts.** In `src/startklar.js` stand seit
 * dem ersten Bau, ob das Repository privat ist, sei *„von hier aus nicht
 * feststellbar"*. Der Punkt trug seither ein Fragezeichen, und der Shop galt
 * deshalb als nicht startklar — mit einer Frage, die niemand gestellt hatte.
 *
 * Der Netzausgang dieser Umgebung ist gesperrt. **Das GitHub-Werkzeug ist es
 * nicht:** Es beantwortet die Frage in einem Aufruf, und die Antwort lautet
 * `visibility: public`.
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.** Solange „nicht feststellbar" dasteht, sieht niemand nach.
 *
 * Zwei Runden zuvor war dieselbe Bewegung schon einmal aufgefallen: Der
 * Vermerk über die veröffentlichte PR-Beschreibung behauptete, eine Prüfung
 * der Veröffentlichung sei aus dieser Umgebung unmöglich — auch das war
 * falsch, und auch das hatte niemand nachgesehen.
 *
 * ## Warum eine Datei und kein Prüfer
 *
 * Der Shop kann keines der beiden Felder selbst erheben: Sein Netzausgang ist
 * gesperrt, und das GitHub-Werkzeug gehört nicht zu ihm. Was hier steht, ist
 * deshalb ein **Vermerk über einen Handgriff** — dasselbe Muster wie bei der
 * veröffentlichten Beschreibung. Und wie dort trägt er sein Datum: Eine
 * Messung, die alt genug ist, gilt wieder als offene Frage.
 */

/**
 * Wie lange eine Messung trägt.
 *
 * **Vierzehn Tage, und der Grund ist die Richtung des Schadens.** Der
 * gefährliche Fall ist nicht „öffentlich und keiner weiß es" — das steht dann
 * ja da —, sondern „einmal privat gemessen, seither wieder öffentlich". Zwei
 * Wochen sind kurz genug, dass eine solche Umstellung nicht ein Vierteljahr
 * unbemerkt bleibt, und lang genug, dass der Handgriff nicht zur Zeremonie
 * wird.
 */
export const GRENZE_TAGE = 14;

const TAG_MS = 24 * 60 * 60 * 1000;

/** Tage zwischen zwei Tagesangaben, oder `null`, wenn eine unlesbar ist. */
export function tageSeit(gemessenAm, heute) {
  const form = /^\d{4}-\d{2}-\d{2}$/;
  if (!form.test(String(gemessenAm ?? '')) || !form.test(String(heute ?? ''))) return null;
  const a = Date.parse(`${gemessenAm}T00:00:00Z`);
  const b = Date.parse(`${heute}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / TAG_MS);
}

/**
 * Liest den Vermerk und sagt, was er heute noch trägt.
 *
 * Rückgabe je Feld: `true`, `false` oder `null`. **`null` heißt „keine
 * Auskunft"** — die Datei fehlt, das Feld fehlt, oder die Messung ist zu alt.
 * Der Grund steht daneben, damit die Bereitschaftsliste ihn weiterreichen
 * kann, statt „unbekannt" zu sagen und den Leser raten zu lassen.
 *
 * @param {object|null} vermerk  der Inhalt von `data/aussenlage.json`
 * @param {string} heute  Geschäftstag als `YYYY-MM-DD`
 */
export function aussenlage(vermerk, heute) {
  if (!vermerk || typeof vermerk !== 'object') {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter: null,
      grund: 'kein Vermerk über die Außenlage — data/aussenlage.json fehlt' };
  }
  const alter = tageSeit(vermerk.gemessenAm, heute);
  if (alter === null) {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter: null,
      grund: `der Vermerk nennt kein lesbares Messdatum („${vermerk.gemessenAm}")` };
  }
  if (alter < 0) {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter,
      grund: `der Vermerk ist auf den ${vermerk.gemessenAm} datiert und damit auf morgen` };
  }
  if (alter > GRENZE_TAGE) {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter,
      grund: `die Messung ist ${alter} Tage alt (Grenze ${GRENZE_TAGE}) — sie sagt über heute nichts` };
  }
  const feld = (wert) => (typeof wert === 'boolean' ? wert : null);
  return {
    repositoryOeffentlich: feld(vermerk.repositoryOeffentlich),
    domainErreichbar: feld(vermerk.domainErreichbar),
    alter,
    grund: null,
  };
}

/**
 * Hält den Vermerk gegen die Betreiberdatei.
 *
 * **Die Richtung, die den Fund machen würde:** Der Auftraggeber trägt „privat"
 * ein, und die Messung sagt „öffentlich". Ohne diesen Vergleich gewinnt, wer
 * zuletzt gelesen wird — und das ist die Angabe, nicht die Messung.
 *
 * @returns {{regel: string, text: string}[]}
 */
export function widerspruchsbefund(gemessen, erklaert) {
  if (gemessen.repositoryOeffentlich === null || typeof erklaert !== 'boolean') return [];
  const privatLautMessung = gemessen.repositoryOeffentlich === false;
  if (privatLautMessung === erklaert) return [];
  return [{
    regel: 'erklaerung-gegen-messung',
    text: `data/betreiber.json sagt „Repository ${erklaert ? 'privat' : 'öffentlich'}", `
      + `gemessen wurde „${gemessen.repositoryOeffentlich ? 'öffentlich' : 'privat'}" `
      + '— die Messung gilt, die Angabe gehört berichtigt',
  }];
}
