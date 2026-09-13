/**
 * Einordnung eines Radon-Messwerts.
 *
 * Umsetzung der Vorgabe aus docs/baustoff-shop/messwert-einordnung.md.
 *
 * Der Rechner ordnet einen Messwert **rechtlich und bautechnisch** ein — mehr
 * nicht. Keine Aussage zu Gesundheit oder persönlichem Risiko, keine Bewertung
 * einer fremden Messung als Ergebnis, keine Sanierungszusage. Diese drei
 * Grenzen gehen mit jeder Ausgabe hinaus, nicht ins Impressum: Wer bei einem
 * radioaktiven Gas zurückhaltend formuliert, wird eher geglaubt als jemand, der
 * Gewissheit verkauft.
 */

/** Gesetzlicher Referenzwert im Jahresmittel, Radonschutzverordnung. */
export const REFERENZWERT = 300;

/** Mindestdauer einer Langzeitmessung in Monaten, damit der Vergleich zählt. */
export const MINDESTDAUER_MONATE = 6;

export const GRENZEN = [
  'Diese Einordnung sagt nichts über Gesundheit oder persönliches Risiko aus. ' +
    'Dafür sind die Fachstelle für Radon und die zuständigen Stellen da.',
  'Verlässlich ist nur eine Messung durch eine ermächtigte Überwachungsstelle — ' +
    'etwa AGES oder das Strahlenschutzlabor der Stadt Wien.',
  'Welche Maßnahme im Einzelfall taugt, entscheidet die Bausubstanz, nicht der ' +
    'Messwert. Genannt ist die übliche Maßnahme, nicht eine Zusage.',
];

/**
 * @param {object} messung
 * @param {number} messung.wert  Messwert in Bq/m³
 * @param {number} messung.messdauerMonate  Dauer der Messung in Monaten
 */
export function ordneEin({ wert, messdauerMonate } = {}) {
  if (typeof wert !== 'number' || !Number.isFinite(wert) || wert < 0) {
    throw new Error('Messwert muss eine Zahl ab 0 sein');
  }
  if (typeof messdauerMonate !== 'number' || !Number.isFinite(messdauerMonate) || messdauerMonate <= 0) {
    throw new Error('Messdauer muss eine positive Zahl sein');
  }

  const istLangzeit = messdauerMonate >= MINDESTDAUER_MONATE;

  if (!istLangzeit) {
    return {
      wert,
      messdauerMonate,
      istLangzeit: false,
      stufe: 'kurzzeit',
      vergleichbar: false,
      ueberschreitung: null,
      istQualifizierterAnlass: false,
      titel: 'Hinweis, kein Ergebnis',
      aussage:
        `Eine Messung über ${messdauerMonate} Monate darf nicht mit dem Referenzwert ` +
        `von ${REFERENZWERT} Bq/m³ verglichen werden — dafür verlangt die ` +
        `Radonschutzverordnung mindestens ${MINDESTDAUER_MONATE} Monate.`,
      massnahme:
        'Langzeitmessung bei einer ermächtigten Überwachungsstelle veranlassen. ' +
        'Sie ist für Privathaushalte derzeit kostenlos.',
      grenzen: GRENZEN,
    };
  }

  // Die Grenze ist „überschreitet", nicht „erreicht": Genau 300 Bq/m³
  // überschreiten den Referenzwert nicht — weder sprachlich noch nach der
  // Radonschutzverordnung, und das Partnerangebot definiert die qualifizierte
  // Anfrage ausdrücklich als Messwert ÜBER 300. Die erste Fassung zählte
  // >= 300 als Überschreitung und schrieb bei genau 300 die falsche Aussage
  // „liegen über dem Referenzwert von 300" in die Leadstrecke.
  if (wert <= REFERENZWERT) {
    return {
      wert,
      messdauerMonate,
      istLangzeit: true,
      stufe: 'unter',
      vergleichbar: true,
      ueberschreitung: false,
      istQualifizierterAnlass: false,
      titel: 'Referenzwert eingehalten',
      aussage:
        `${wert} Bq/m³ überschreiten den gesetzlichen Referenzwert von ${REFERENZWERT} Bq/m³ nicht. ` +
        'Eine Maßnahme ist nicht vorgeschrieben.',
      massnahme:
        'Der Referenzwert ist ein gesetzlicher Bezugswert, keine naturwissenschaftliche ' +
        'Schwelle. Eine Senkung ist auch darunter möglich und mit einfachen Mitteln oft ' +
        'günstig zu erreichen.',
      grenzen: GRENZEN,
    };
  }

  if (wert <= 1000) {
    return {
      wert,
      messdauerMonate,
      istLangzeit: true,
      stufe: 'ueber',
      vergleichbar: true,
      ueberschreitung: true,
      istQualifizierterAnlass: true,
      titel: 'Referenzwert überschritten',
      aussage:
        `${wert} Bq/m³ liegen über dem Referenzwert von ${REFERENZWERT} Bq/m³. ` +
        'Eine bauliche Sanierung wird empfohlen.',
      massnahme:
        'Übliche Maßnahme ist die Unterbodenabsaugung nach ÖNORM S 5280-3, ' +
        'ergänzend die Abdichtung erdberührter Bauteile.',
      grenzen: GRENZEN,
    };
  }

  return {
    wert,
    messdauerMonate,
    istLangzeit: true,
    stufe: 'deutlich',
    vergleichbar: true,
    ueberschreitung: true,
    istQualifizierterAnlass: true,
    titel: 'Deutliche Überschreitung',
    aussage:
      `${wert} Bq/m³ liegen weit über dem Referenzwert von ${REFERENZWERT} Bq/m³.`,
    massnahme:
      'Bauliche Sanierung empfohlen, Planung durch einen fachkundigen Betrieb, ' +
      'anschließend Wirksamkeitskontrolle durch Nachmessung.',
    grenzen: GRENZEN,
  };
}
