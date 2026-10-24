/**
 * Die Seiten, die eine Frage vor der Bestellung beantworten — und die die
 * Suche bis heute nicht kannte.
 *
 * **Der Anlass, 10. September 2026.** Der Suchindex, den jeder Besucher
 * mitgeliefert bekommt, trägt **46 Artikel und 24 Inhaltsseiten**. Gemessen
 * an zwanzig Fragen, die ein Besteller vor dem Absenden stellt, fand er
 * **zwei**:
 *
 * > „kranentladung" · „frachtpauschale" · „lieferzeit" ·
 * > „mindestbestellwert" · „liefergebiet" · „widerruf" · „rügefrist" ·
 * > „impressum" · „agb" · „datenschutz" · „zahlung" · „vorkasse" ·
 * > „versandkosten" · „abholung" · „umsatzsteuer" — **nichts gefunden**.
 *
 * Und „lieferung" führte auf die Gruppenseite *Zubehör und Kleinteile*, nicht
 * auf die Lieferseite.
 *
 * Der Shop hat für fast jede dieser Fragen eine Seite. Sie steht in der
 * Kopfleiste oder im Fuß — nur eben nicht dort, wo der Besucher sie sucht,
 * nachdem er über eine bezahlte Anzeige (4,19 € bis 8,22 € je Klick) auf
 * einer Gruppenseite gelandet ist.
 *
 * > **Eine Suche, die nur das Sortiment kennt, antwortet auf jede zweite
 * > Frage mit „nichts gefunden" — obwohl die Antwort im Haus liegt.**
 *
 * ## Warum ein eigenes Verzeichnis
 *
 * Die Inhaltsseiten tragen ihren Kopf (`titel`, `frage`, `kurz`) in der
 * Quelldatei; die Dienstseiten entstehen im Bauwerkzeug und haben keinen. Ein
 * Verzeichnis mit **Frage und Kurzantwort** ist die kleinere Lösung als ein
 * Kopfblock in fünf Seitenbauern — und es lässt sich in beide Richtungen
 * gegen den Bau halten: Was hier steht, muss gebaut werden, und was gebaut
 * wird und eine Frage beantwortet, muss hier stehen.
 */

/**
 * Je Seite: Was sie beantwortet und in einem Satz, was die Antwort ist.
 *
 * Die Kurzantwort ist **keine Werbung**: Sie steht so oder sinngleich auf der
 * Seite selbst, und der Suchtreffer zeigt sie an. Wer eine Antwort in den
 * Index schreibt, die auf der Seite nicht steht, hat die Suche zur zweiten
 * Quelle gemacht.
 */
export const DIENSTSEITEN = Object.freeze([
  Object.freeze({
    id: 'lieferung',
    art: 'dienst',
    titel: 'Lieferung und Frachtkosten',
    frage: 'Was kostet die Lieferung, wohin wird geliefert, und ab welchem Wert nimmt die Kasse an?',
    kurz: 'Frachtpauschale und Kranentladung je Lieferung, getrennt ausgewiesen, kein frei Haus. '
      + 'Liefergebiet Perg, Urfahr-Umgebung, Freistadt, Linz und Linz-Land. Mindestbestellwert je '
      + 'Lieferung. Versandkosten, Lieferzeit und Abholung stehen hier.',
  }),
  Object.freeze({
    id: 'rechtliches/impressum',
    art: 'dienst',
    titel: 'Impressum',
    frage: 'Wer betreibt diesen Shop, und wie ist er erreichbar?',
    kurz: 'Firma, Anschrift, Kontakt und UID — die Pflichtangaben nach § 5 ECG und § 14 UGB.',
  }),
  Object.freeze({
    id: 'rechtliches/agb',
    art: 'dienst',
    titel: 'Geschäftsbedingungen',
    frage: 'Zu welchen Bedingungen wird verkauft — welche Zahlungsarten, welche Lieferung, welcher Eigentumsvorbehalt?',
    kurz: 'AGB: dreizehn Punkte, ausschließlich für Unternehmer — Vertragsschluss, Preise und '
      + 'Umsatzsteuer, Zahlung und Vorkasse, Rechnung, Lieferung im Streckengeschäft, '
      + 'Mindestbestellwert, Gewährleistung, Eigentumsvorbehalt und Gerichtsstand.',
  }),
  Object.freeze({
    id: 'rechtliches/datenschutz',
    art: 'dienst',
    titel: 'Datenschutz',
    frage: 'Welche Daten werden verarbeitet, und was geschieht beim bloßen Besuch der Seite?',
    kurz: 'Neun Punkte nach DSGVO und der technische Befund: keine Cookies, keine Zählpixel, '
      + 'keine fremden Einbindungen. Der Warenkorb bleibt im Browser.',
  }),
  /*
   * **Die Übersicht gehört dazu, und zwar wegen einer Frage, die sie als
   * einzige beantwortet:** „widerruf". Ein Widerrufsrecht gibt es hier nicht —
   * verkauft wird ausschließlich an Unternehmer —, und genau das steht in
   * ihrer Tabelle. „Nichts gefunden" wäre die falsche Antwort auf eine
   * Frage, die eine hat.
   */
  Object.freeze({
    id: 'rechtliches/index',
    art: 'dienst',
    titel: 'Rechtliches im Überblick',
    frage: 'Welche Rechtstexte gibt es, und was ist Pflicht — gibt es ein Widerrufsrecht?',
    kurz: 'Impressum, AGB, Datenschutz und Rügefrist als Gerüst mit ausgewiesenen Lücken. Eine '
      + 'Widerrufsbelehrung entfällt: Sie ist nur im Verbrauchergeschäft nötig, und hier wird '
      + 'ausschließlich an Unternehmer verkauft.',
  }),
  Object.freeze({
    id: 'rechtliches/abnahme',
    art: 'dienst',
    titel: 'Abnahme und Rügefrist',
    frage: 'Wer nimmt die Ware auf der Baustelle an, und wie lange kann ich einen Mangel rügen?',
    kurz: 'Die Rügefrist nach § 377 UGB beginnt mit der Ablieferung auf der Baustelle, nicht im '
      + 'Büro. Wer übernimmt, übernimmt für den Besteller. Reklamation und Transportschaden '
      + 'gehören sofort geprüft.',
  }),
]);

/**
 * Hält das Verzeichnis gegen den Bau — in beide Richtungen.
 *
 * @param {string[]} gebaut Kennungen aller gebauten Seiten
 * @param {object[]} verzeichnis
 * @param {string[]} ausgenommen Gebaute Seiten, die keine Frage beantworten
 *   (Warenkorb, Kasse, Suche, Fehlerseite, Übersichten) — jede mit Grund im
 *   Aufrufer.
 */
export function dienstseitenbefund(gebaut = [], verzeichnis = DIENSTSEITEN, ausgenommen = []) {
  const meldungen = [];
  const vorhanden = new Set(gebaut);
  const geführt = new Set(verzeichnis.map((s) => s.id));
  for (const s of verzeichnis) {
    if (!vorhanden.has(s.id)) {
      meldungen.push({
        regel: 'eintrag-ohne-seite',
        wo: s.id,
        text: `${s.id} steht im Verzeichnis der Dienstseiten, wird aber nicht gebaut — `
          + 'der Suchtreffer führte ins Leere',
      });
    }
    for (const feld of ['titel', 'frage', 'kurz']) {
      if (!String(s[feld] ?? '').trim()) {
        meldungen.push({ regel: 'eintrag-unvollstaendig', wo: s.id, text: `${s.id}: ${feld} fehlt` });
      }
    }
  }
  for (const id of gebaut) {
    if (geführt.has(id) || ausgenommen.includes(id)) continue;
    if (!/^(?:lieferung|rechtliches\/)/.test(id)) continue;
    meldungen.push({
      regel: 'seite-nicht-gefuehrt',
      wo: id,
      text: `${id} wird gebaut, beantwortet eine Frage vor der Bestellung und steht in keinem `
        + 'Verzeichnis — die Suche findet sie nicht',
    });
  }
  return { geführt: verzeichnis.length, meldungen, sauber: meldungen.length === 0 };
}
