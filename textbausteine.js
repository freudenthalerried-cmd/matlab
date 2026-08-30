// Textbausteine für Baustellen-Protokolle ("Sicherheit am Bau")
// Quellen: eigene Berichte 2021–2025 und die Blaue Mappe "Sicherheit am Bau"
// (Bundesinnung Bau / AUVA / BUAK, Ausgabe 2010).
// freq     = Häufigkeit in den analysierten Berichten (Grundreihenfolge).
// kuerzel  = Tastatur-Shortcuts: Wort tippen + Leertaste/Senden ersetzt es.
// keywords = Wörter, auf die der KI-Vorschlag reagiert.
// related  = Bausteine, die in den Berichten häufig gemeinsam vorkommen.
// kurz     = Kurzfassung (Minus-Stufe), text = Normalfassung,
//            gesetz = Rechtsgrundlage/Zusatztext (Plus-Stufe).
// icon     = Symbolbild bei komplexeren Sicherheitsthemen (siehe ICONS).
// sicherheit:false = wird vom KI-Vorschlag nicht angeboten (nicht sicherheitsrelevant).

const BAUSTEINE = [
  {
    id: 'psa',
    titel: 'PSA / Schutzhelm',
    kuerzel: ['helm', 'psa'],
    keywords: ['helm', 'schutzhelm', 'psa', 'schutzausrüstung', 'warnweste', 'sicherheitsschuhe', 'handschuhe'],
    kurz: 'PSA und Schutzhelm sind zu tragen.',
    text: 'Die persönliche Schutzausrüstung, einschließlich des Tragens eines Schutzhelmes, ist erforderlich.',
    gesetz: { ref: 'ASchG § 69 f.; Blaue Mappe C 1 „Kopfschutz"', text: 'Arbeitnehmer haben die zur Verfügung gestellte persönliche Schutzausrüstung zu benutzen. Der Schutzhelm ist bei Gefahr von herabfallenden oder pendelnden Gegenständen sowie im Kran- und Gerüstbereich zu tragen.' },
    icon: 'helm',
    freq: 5,
    related: ['besprochen']
  },
  {
    id: 'verkehrswege',
    titel: 'Verkehrswege / Bauschutt',
    kuerzel: ['wege', 'schutt'],
    keywords: ['verkehrsweg', 'verkehrswege', 'zugang', 'zugänge', 'hauptzugänge', 'bauschutt', 'restmaterial', 'stolper', 'unordnung', 'räumen', 'material'],
    kurz: 'Verkehrswege und Arbeitsplätze sicher gestalten, Bauschutt räumen.',
    text: 'Verkehrswege und Arbeitsplätze sind sicher zu gestalten. Bauschutt und Restmaterial ehestmöglich von der Baustelle räumen.',
    gesetz: { ref: 'BauV §§ 6–9, 48; Blaue Mappe B 6 „Zugänge und Wege"', text: 'Zugänge und Verkehrswege müssen sicher begehbar, ausreichend breit und beleuchtet sein und sind von Hindernissen, Bauschutt sowie Eis und Schnee freizuhalten.' },
    freq: 4,
    related: ['bodenoeffnungen']
  },
  {
    id: 'wehren',
    titel: 'Wehren ergänzen',
    kuerzel: ['wehren'],
    keywords: ['wehr', 'wehren', 'absturz', 'attika', 'dachrand', 'brüstung', 'fehlt', 'ergänzen'],
    kurz: 'Wehren sind zu ergänzen.',
    text: 'Brust-, Mittel- und Fußwehren sind zu ergänzen.',
    gesetz: { ref: 'BauV § 8 (Absturzsicherungen), § 9 (Abgrenzungen)', text: 'Bei Absturzgefahr sind Absturzsicherungen aus Brust-, Mittel- und Fußwehren herzustellen. Anstelle von Absturzsicherungen sind stabile Abgrenzungen nur auf Flächen bis 20° Neigung zulässig.' },
    icon: 'absturz',
    freq: 4,
    related: ['kollektiv', 'besprochen']
  },
  {
    id: 'gasflaschen',
    titel: 'Gasflaschen',
    kuerzel: ['gas'],
    keywords: ['gasflasche', 'gasflaschen', 'propan', 'flüssiggas', 'lagerbox', 'flasche'],
    kurz: 'Gasflaschen sichern, in zugelassenen Lagerboxen lagern.',
    text: 'Gasflaschen sind gegen Umfallen und fremde Inbetriebnahme zu schützen. Zugelassene Lagerboxen verwenden oder von der Baustelle abtransportieren.',
    gesetz: { ref: 'BauV § 127 Abs. 2 u. 4; Blaue Mappe B 14 „Flüssiggasanlagen"', text: 'Lagerung auf der Baustelle nur im Umfang des Tagesbedarfs; in Räumen bis 1000 m³ höchstens 2 Flaschen à 15 kg, im Freien keine Begrenzung. Propan ist schwerer als Luft und sammelt sich an der tiefsten Stelle – keine Verwendung und Lagerung unter Erdgleiche.' },
    icon: 'gas',
    freq: 3,
    related: ['daemmstoff']
  },
  {
    id: 'besprochen',
    titel: 'Mit Polier besprochen',
    kuerzel: ['polier', 'bespr'],
    keywords: ['besprochen', 'polier', 'vorarbeiter', 'bauleitung', 'abschluss'],
    kurz: 'Sicherheitspunkte mit Polier besprochen.',
    text: 'Die sicherheitsrelevanten Punkte und der weitere Bauablauf wurden mit dem Polier vor Ort besprochen.',
    freq: 3,
    related: []
  },
  {
    id: 'kollektiv',
    titel: 'Kollektive Schutzmaßnahmen',
    kuerzel: ['kollektiv'],
    keywords: ['kollektiv', 'schutzmaßnahmen', 'entfernt', 'demontage', 'schutzgerüst', 'deckenabsicherung', 'geländer'],
    kurz: 'Kollektive Schutzmaßnahmen dürfen nicht entfernt werden.',
    text: 'Kollektive Schutzmaßnahmen wie Wehren, Schutzgerüst oder dergleichen dürfen niemals und von keinem Mitarbeiter entfernt werden. Ist eine Demontage aus arbeitstechnischer Sicht erforderlich, so ist dies mit dem Baukoordinator oder der Baufirma abzuklären und eine entsprechende Alternative zu errichten.',
    gesetz: { ref: 'BauV § 8; ASchG § 8 (Zusammenarbeit)', text: 'Kollektive Schutzeinrichtungen haben Vorrang vor individuellen Maßnahmen. Die Instandhaltung der Absturzsicherungen ist zu organisieren und verbindlich einem Unternehmen zuzuordnen.' },
    icon: 'absturz',
    freq: 3,
    related: ['wehren']
  },
  {
    id: 'geruest',
    titel: 'Gerüst-Abnahmeprotokoll',
    kuerzel: ['gerüst', 'geruest'],
    keywords: ['gerüst', 'geruest', 'abnahmeprotokoll', 'arbeitsgerüst', 'aufstieg', 'protokoll'],
    kurz: 'Gerüst-Abnahmeprotokoll sichtbar am Gerüst anbringen.',
    text: 'Das Gerüst-Abnahmeprotokoll ist in wetterfester Hülle, für alle sichtbar, bei jedem Aufstieg anzubringen. Betreten des Arbeitsgerüstes nur nach vorangegangener Prüfung durch den Benützer und mit gültigem Abnahmeprotokoll.',
    gesetz: { ref: 'Blaue Mappe, Kapitel Gerüste', text: 'Jeder Gerüstbenützer hat das Arbeitsgerüst vor dem Betreten augenscheinlich auf Sicherheitsmängel zu kontrollieren und dies schriftlich zu dokumentieren, vorzugsweise mit Vermerk am vorhandenen Gerüstabnahmeprotokoll.' },
    icon: 'geruest',
    freq: 2,
    related: ['wehren', 'kollektiv']
  },
  {
    id: 'gelaender_ok',
    titel: 'Geländer in Ordnung',
    kuerzel: ['gok'],
    keywords: ['geländer', 'absturzsicherung', 'ordnungsgemäß', 'vorhanden', 'passt'],
    kurz: 'Geländer und Absturzsicherungen vorhanden.',
    text: 'Geländer und Absturzsicherungen sind ordnungsgemäß vorhanden.',
    freq: 2,
    related: ['lob']
  },
  {
    id: 'bauzaun',
    titel: 'Bauzaun (§ 4 Abs. 7 BauV)',
    kuerzel: ['zaun'],
    keywords: ['bauzaun', 'zaun', 'baugelände', 'zufahrtstore', 'absperrung', 'baustelleneinrichtung'],
    kurz: 'Baugelände ist mit mind. 2 m hohem Bauzaun gesichert.',
    text: 'Die Baufirma sichert das Baugelände auf Baudauer mit einem mindestens zwei Meter hohen Bauzaun; die Situierung des Zaunes und der Zufahrtstore sind dem Baustelleneinrichtungsplan zu entnehmen (§ 4 Abs. 7 BauV).',
    freq: 2,
    related: []
  },
  {
    id: 'dach',
    titel: 'Dacharbeiten / Bestandsdächer',
    kuerzel: ['dach'],
    keywords: ['dach', 'dächer', 'bestandsdach', 'dacharbeiten', 'betreten', 'abgrenzung'],
    kurz: 'Vor Dacharbeiten kollektive Schutzmaßnahmen errichten.',
    text: 'Vor dem Betreten des Daches sind kollektive Schutzmaßnahmen zu errichten. Bestandsdächer dürfen nicht betreten werden.',
    gesetz: { ref: 'BauV §§ 8–9; Blaue Mappe D 14 „Arbeiten auf Dächern"', text: 'Abgrenzungen gemäß § 9 BauV: Anstelle von Absturzsicherungen nach § 8 sind stabile Abgrenzungen durch Brustwehren aus Holz, Metallrohr, gespannten Seilen oder Ketten zulässig – nur auf Flächen bis 20° Neigung.' },
    icon: 'dach',
    freq: 2,
    related: ['wehren', 'kollektiv']
  },
  {
    id: 'daemmstoff',
    titel: 'Lagerung Dämmstoffe',
    kuerzel: ['dämm', 'daemm'],
    keywords: ['dämmstoff', 'daemmstoff', 'dämmstoffplatten', 'lagerung', 'brennbar', 'brüstung'],
    kurz: 'Keine Dämmstofflagerung neben Brüstungen.',
    text: 'Keine Lagerung von Dämmstoffplatten direkt neben Brüstungen. Schutzzonen bei Lagerung im Bereich von brennbaren Materialien wie Dämmstoffen sind zu beachten.',
    gesetz: { ref: 'BauV §§ 42–47 (Brandschutz); Blaue Mappe B 10', text: 'Brennbare Materialien sind mit Schutzzonen zu Zündquellen und Flüssiggas zu lagern; Feuerlöscher sind bereitzuhalten.' },
    freq: 2,
    related: ['gasflaschen']
  },
  {
    id: 'leitern',
    titel: 'Leitern / Stehleitern',
    kuerzel: ['leiter'],
    keywords: ['leiter', 'leitern', 'stehleiter', 'anlegeleiter', 'spreizsicherung', 'sprossen'],
    kurz: 'Nur geprüfte Leitern verwenden.',
    text: 'Nur geprüfte Leitern verwenden. Mit der Stehleiter werden nur leichte Arbeiten im Greifraum durchgeführt. Keine Stehleiter unmittelbar neben Absturzkanten verwenden.',
    gesetz: { ref: 'Blaue Mappe, Blatt „Leitern"', text: 'Stehleitern müssen mit einer Spreizsicherung (textile Bänder, Ketten oder fixierbare Gelenke) versehen sein; bei Verwendung müssen die Spreizsicherungen gespannt oder eingerastet sein, weshalb das „Gehen" mit Stehleitern untersagt ist. Gelenke dürfen keine Quetschstellen bilden.' },
    icon: 'leiter',
    freq: 1,
    related: ['bodenoeffnungen']
  },
  {
    id: 'bodenoeffnungen',
    titel: 'Bodenöffnungen',
    kuerzel: ['boden'],
    keywords: ['bodenöffnung', 'bodenöffnungen', 'öffnung', 'vertiefung', 'abdecken', 'schacht', 'sturz'],
    kurz: 'Bodenöffnungen schließen oder abdecken.',
    text: 'Bodenöffnungen schließen oder abdecken. Bei Arbeiten mit der Stehleiter können Vertiefungen einen Sturz und Fall verursachen.',
    gesetz: { ref: 'BauV § 8', text: 'Boden- und Deckenöffnungen sind tragfähig und unverschiebbar abzudecken oder mit Absturzsicherungen zu versehen.' },
    icon: 'absturz',
    freq: 1,
    related: ['leitern', 'verkehrswege']
  },
  {
    id: 'kran',
    titel: 'Kran / Drehbereich',
    kuerzel: ['kran'],
    keywords: ['kran', 'untendrehkran', 'drehbereich', 'kranballast', 'ballast', 'hebemittel'],
    kurz: 'Drehbereich des Krans absichern.',
    text: 'Der Drehbereich des Untendrehkrans ist mit Wehren abzusichern. Keine Lagerung von Material und kein Zutritt zum Gefahrenraum im Drehbereich des Kranballastes. Transport nur mit zugelassenen Hebemitteln.',
    gesetz: { ref: 'Blaue Mappe E 2 „Krane", E 3 „Anschlagen von Lasten"', text: 'Der Gefahrenbereich des Kranballastes ist abzugrenzen. Lasten nur mit geprüften, zugelassenen Anschlag- und Hebemitteln transportieren; Sicherheitsabstände zu Freileitungen einhalten.' },
    icon: 'kran',
    freq: 1,
    related: ['wehren']
  },
  {
    id: 'kmf',
    titel: 'KMF / Mineralwolle',
    kuerzel: ['kmf'],
    keywords: ['kmf', 'mineralfaser', 'mineralwolle', 'schutzmaske', 'staub'],
    kurz: 'Bei KMF-Arbeiten Schutzmaske und Schutzkleidung tragen.',
    text: 'Bei Arbeiten mit KMF (Künstliche Mineralfaser, alte Mineralwolle) sind Schutzmasken und Schutzkleidung zu tragen sowie die KMF-Richtlinien einzuhalten. Lagerung nur in geschlossenen Behältern im Baustellenbereich.',
    gesetz: { ref: 'KMF-Richtlinien; Blaue Mappe B 15 „Bauchemikalien/Gefahrstoffe"', text: 'Staubarme Arbeitsverfahren wählen, Atemschutz und Schutzkleidung benutzen, Abfälle in geschlossenen, gekennzeichneten Behältern sammeln und ordnungsgemäß entsorgen.' },
    icon: 'kmf',
    freq: 1,
    related: ['psa']
  },
  {
    id: 'winterbau',
    titel: 'Winterbau',
    kuerzel: ['winter'],
    keywords: ['winter', 'winterbau', 'eis', 'schnee', 'kälte', 'frost', 'rutschig', 'gefroren'],
    kurz: 'Winterbau: Wege eis- und schneefrei halten, Aufwärmmöglichkeit schaffen.',
    text: 'WINTERBAU: Arbeitsplätze und Verkehrswege müssen trittsicher und rutschfest sein; sie sind von Eis und Schnee freizuhalten und ausreichend zu beleuchten. Gelagertes Material ist abzudecken und gegen Zusammenfrieren zu sichern. Aufwärmmöglichkeiten schaffen und Aufenthaltsräume auf mindestens 21 °C beheizen.',
    gesetz: { ref: 'BauV §§ 27–29, 34–38; Blaue Mappe B 12 „Arbeiten im Freien"', text: 'Wer in der kalten Jahreszeit im Freien arbeitet, muss gegen Kälte, Nässe, Wind, Schnee und Eis geschützt sein. Geeignete Schutzkleidung ist kostenlos zur Verfügung zu stellen; die Bereitstellung alkoholfreier heißer Getränke wird empfohlen.' },
    icon: 'winter',
    freq: 1,
    related: ['verkehrswege']
  },
  {
    id: 'sanitaer',
    titel: 'Waschplatz / Aufenthaltsraum',
    kuerzel: ['wasch'],
    keywords: ['waschplatz', 'aufenthaltsraum', 'sanitär', 'container', 'mahlzeiten'],
    kurz: 'Waschplatz und Aufenthaltsraum sind vorzuhalten.',
    text: 'Auf der Baustelle muss den Arbeitnehmern ein Waschplatz mit ausreichend fließendem warmem Wasser und ein Aufenthaltsraum bzw. ein geeigneter Platz zum Einnehmen der Mahlzeiten und zum Aufwärmen zur Verfügung stehen. Diese sind auf Baudauer vorzuhalten.',
    gesetz: { ref: 'BauV §§ 33–37; Blaue Mappe B 8', text: 'Aufenthaltsräume sind auf mindestens 21 °C zu beheizen; je 5 Arbeitnehmer ist eine Waschstelle mit Warmwasseranschluss vorzusehen. Regelmäßige Reinigung veranlassen.' },
    freq: 1,
    related: []
  },
  {
    id: 'erstehilfe',
    titel: 'Erste Hilfe / Feuerlöscher',
    kuerzel: ['eh'],
    keywords: ['erste hilfe', 'erstehilfe', 'feuerlöscher', 'verbandskasten', 'brandschutz'],
    kurz: 'Erste-Hilfe-Kasten und Feuerlöscher vorhanden.',
    text: 'Erste-Hilfe-Kasten und Feuerlöscher sind auf der Baustelle vorhanden.',
    gesetz: { ref: 'BauV §§ 31, 32, 41 (Erste Hilfe); §§ 42–47 (Brandschutz)', text: 'Verbandskästen, Meldesystem und Ersthelfer sind vorzuhalten; das Aushangblatt „Ersthelfer" und die Erste-Hilfe-Anleitung sind gut sichtbar anzubringen.' },
    freq: 1,
    related: []
  },
  {
    id: 'unterweisung',
    titel: 'Unterweisung',
    kuerzel: ['uw'],
    keywords: ['unterweisung', 'sige', 'sigeplan', 'mitarbeiter', 'baustart'],
    kurz: 'Unterweisung der Mitarbeiter durchgeführt.',
    text: 'Unterweisung mit den Mitarbeitern durchgeführt. Inhalt unter anderem SiGe-Plan und aktuelle Schutzmaßnahmen.',
    gesetz: { ref: 'ASchG § 14 (Unterweisung)', text: 'Die Unterweisung hat vor Aufnahme der Tätigkeit und bei geänderten Arbeitsbedingungen zu erfolgen und ist nachweislich zu dokumentieren.' },
    freq: 1,
    related: ['bauzaun']
  },
  {
    id: 'lob',
    titel: 'Baustelle in Ordnung',
    kuerzel: ['gut'],
    keywords: ['gut', 'ordentlich', 'sauber', 'passt', 'in ordnung'],
    kurz: 'Gut geführte Baustelle.',
    text: 'Gut und ordentlich geführte Baustelle.',
    sicherheit: false,
    freq: 1,
    related: ['gelaender_ok', 'besprochen']
  }
];

// Allgemeine Punkte (optional einfügbar, damit ein kurzer Bericht nicht leer wirkt).
// Zusammengestellt aus den wiederkehrenden Standardpunkten der Berichte und der Blauen Mappe.
const ALLGEMEINE_PUNKTE = [
  { id: 'ap_psa', text: 'Die persönliche Schutzausrüstung, einschließlich des Tragens eines Schutzhelmes, ist erforderlich.' },
  { id: 'ap_eh', text: 'Erste-Hilfe-Kasten und Feuerlöscher sind auf der Baustelle vorhanden.' },
  { id: 'ap_wege', text: 'Verkehrswege und Arbeitsplätze sind sicher zu gestalten. Bauschutt und Restmaterial ehestmöglich von der Baustelle räumen.' },
  { id: 'ap_zaun', text: 'Das Baugelände ist auf Baudauer mit einem mindestens zwei Meter hohen Bauzaun gesichert (§ 4 Abs. 7 BauV).' },
  { id: 'ap_aushang', text: 'Aushänge (SiGe-Plan, Erste-Hilfe-Anleitung, Ersthelfer) sind gut sichtbar angebracht.' },
  { id: 'ap_sanitaer', text: 'Aufenthaltsraum und Waschgelegenheit stehen den Arbeitnehmern zur Verfügung (BauV §§ 33–37).' }
];

// Foto-Kategorien: Was ist am Foto zu sehen? → passende Bausteine.
const FOTO_KATEGORIEN = [
  { label: 'Dachrand / Absturz', bausteine: ['wehren', 'dach', 'kollektiv'] },
  { label: 'Gerüst', bausteine: ['geruest', 'wehren'] },
  { label: 'Leiter', bausteine: ['leitern', 'bodenoeffnungen'] },
  { label: 'Gasflaschen', bausteine: ['gasflaschen', 'daemmstoff'] },
  { label: 'Lagerung / Material', bausteine: ['daemmstoff', 'verkehrswege', 'gasflaschen'] },
  { label: 'Verkehrsweg / Schutt', bausteine: ['verkehrswege', 'bodenoeffnungen'] },
  { label: 'Kran', bausteine: ['kran', 'wehren'] },
  { label: 'Bauzaun / Einrichtung', bausteine: ['bauzaun', 'sanitaer', 'erstehilfe'] },
  { label: 'Alles in Ordnung', bausteine: ['gelaender_ok', 'lob', 'besprochen'] }
];

// Symbolbilder (Inline-SVG, Strichstil) für komplexere Sicherheitsthemen.
const ICONS = {
  helm: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15a8 8 0 0 1 16 0"/><path d="M2.5 15h19"/><path d="M12 7V4.5"/><path d="M8 8.5V15M16 8.5V15"/></svg>',
  absturz: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 21V9M12 21V9M20 21V9"/><path d="M3 9h18M3 14h18"/></svg>',
  gas: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="7" width="8" height="14" rx="2"/><path d="M10 7V5h4v2"/><path d="M12 3v2"/><path d="M8 12h8"/></svg>',
  leiter: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v18M16 3v18"/><path d="M8 7h8M8 12h8M8 17h8"/></svg>',
  kran: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21h6M7 21V4"/><path d="M7 4h13"/><path d="M7 8l6-4"/><path d="M17 4v6"/><circle cx="17" cy="12" r="1.6"/></svg>',
  dach: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-8 9 8"/><path d="M6 10v10M18 10v10"/><path d="M6 20h12"/></svg>',
  kmf: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10a7 4.5 0 0 1 14 0v3a7 4.5 0 0 1-14 0z"/><path d="M9 11.5h6M9 14h6"/><path d="M5 11l-2.5 1M19 11l2.5 1"/></svg>',
  winter: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 6l16 12M20 6L4 18"/><path d="M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2"/></svg>',
  geruest: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18M19 3v18"/><path d="M5 7h14M5 15h14"/><path d="M5 7l14 8M19 7L5 15"/></svg>'
};
