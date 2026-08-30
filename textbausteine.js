// Textbausteine für Baustellen-Protokolle ("Sicherheit am Bau")
// Gewonnen aus der Analyse der Berichte 2021–2025 (Freudenthaler Bau GmbH).
// freq = Häufigkeit in den analysierten Berichten (bestimmt die Grundreihenfolge).
// kuerzel = Tastatur-Shortcuts: Wort tippen + Leertaste/Senden ersetzt es durch den Text.
// keywords = Wörter, auf die der KI-Vorschlag reagiert.
// related = Bausteine, die in den Berichten häufig gemeinsam vorkommen.

const BAUSTEINE = [
  {
    id: 'psa',
    titel: 'PSA / Schutzhelm',
    kuerzel: ['helm', 'psa'],
    keywords: ['helm', 'schutzhelm', 'psa', 'schutzausrüstung', 'warnweste', 'sicherheitsschuhe', 'handschuhe'],
    text: 'Die persönliche Schutzausrüstung, einschließlich des Tragens eines Schutzhelmes, ist erforderlich.',
    freq: 5,
    related: ['besprochen']
  },
  {
    id: 'verkehrswege',
    titel: 'Verkehrswege / Bauschutt',
    kuerzel: ['wege', 'schutt'],
    keywords: ['verkehrsweg', 'verkehrswege', 'zugang', 'zugänge', 'hauptzugänge', 'bauschutt', 'restmaterial', 'stolper', 'unordnung', 'räumen', 'material'],
    text: 'Verkehrswege und Arbeitsplätze sind sicher zu gestalten. Bauschutt und Restmaterial ehestmöglich von der Baustelle räumen.',
    freq: 4,
    related: ['bodenoeffnungen']
  },
  {
    id: 'wehren',
    titel: 'Wehren ergänzen',
    kuerzel: ['wehren'],
    keywords: ['wehr', 'wehren', 'absturz', 'attika', 'dachrand', 'brüstung', 'fehlt', 'ergänzen'],
    text: 'Brust-, Mittel- und Fußwehren sind zu ergänzen.',
    freq: 4,
    related: ['kollektiv', 'besprochen']
  },
  {
    id: 'gasflaschen',
    titel: 'Gasflaschen',
    kuerzel: ['gas'],
    keywords: ['gasflasche', 'gasflaschen', 'propan', 'flüssiggas', 'lagerbox', 'flasche'],
    text: 'Gasflaschen sind gegen Umfallen und fremde Inbetriebnahme zu schützen. Zugelassene Lagerboxen verwenden oder von der Baustelle abtransportieren.',
    freq: 3,
    related: ['daemmstoff']
  },
  {
    id: 'besprochen',
    titel: 'Mit Polier besprochen',
    kuerzel: ['polier', 'bespr'],
    keywords: ['besprochen', 'polier', 'vorarbeiter', 'bauleitung', 'abschluss'],
    text: 'Die sicherheitsrelevanten Punkte und der weitere Bauablauf wurden mit dem Polier vor Ort besprochen.',
    freq: 3,
    related: []
  },
  {
    id: 'kollektiv',
    titel: 'Kollektive Schutzmaßnahmen',
    kuerzel: ['kollektiv'],
    keywords: ['kollektiv', 'schutzmaßnahmen', 'entfernt', 'demontage', 'schutzgerüst', 'deckenabsicherung', 'geländer'],
    text: 'Kollektive Schutzmaßnahmen wie Wehren, Schutzgerüst oder dergleichen dürfen niemals und von keinem Mitarbeiter entfernt werden. Ist eine Demontage aus arbeitstechnischer Sicht erforderlich, so ist dies mit dem Baukoordinator oder der Baufirma abzuklären und eine entsprechende Alternative zu errichten.',
    freq: 3,
    related: ['wehren']
  },
  {
    id: 'geruest',
    titel: 'Gerüst-Abnahmeprotokoll',
    kuerzel: ['gerüst', 'geruest'],
    keywords: ['gerüst', 'geruest', 'abnahmeprotokoll', 'arbeitsgerüst', 'aufstieg', 'protokoll'],
    text: 'Das Gerüst-Abnahmeprotokoll ist in wetterfester Hülle, für alle sichtbar, bei jedem Aufstieg anzubringen. Betreten des Arbeitsgerüstes nur nach vorangegangener Prüfung durch den Benützer und mit gültigem Abnahmeprotokoll. Jeder Gerüstbenützer hat vor dem Betreten augenscheinlich auf Sicherheitsmängel zu kontrollieren und dies schriftlich zu dokumentieren, vorzugsweise mit Vermerk am vorhandenen Gerüstabnahmeprotokoll.',
    freq: 2,
    related: ['wehren', 'kollektiv']
  },
  {
    id: 'gelaender_ok',
    titel: 'Geländer in Ordnung',
    kuerzel: ['gok'],
    keywords: ['geländer', 'absturzsicherung', 'ordnungsgemäß', 'vorhanden', 'passt'],
    text: 'Geländer und Absturzsicherungen sind ordnungsgemäß vorhanden.',
    freq: 2,
    related: ['lob']
  },
  {
    id: 'bauzaun',
    titel: 'Bauzaun (§ 4 Abs. 7 BauV)',
    kuerzel: ['zaun'],
    keywords: ['bauzaun', 'zaun', 'baugelände', 'zufahrtstore', 'absperrung', 'baustelleneinrichtung'],
    text: 'Die Baufirma sichert das Baugelände auf Baudauer mit einem mindestens zwei Meter hohen Bauzaun; die Situierung des Zaunes und der Zufahrtstore sind dem Baustelleneinrichtungsplan zu entnehmen (§ 4 Abs. 7 BauV).',
    freq: 2,
    related: []
  },
  {
    id: 'dach',
    titel: 'Dacharbeiten / Bestandsdächer',
    kuerzel: ['dach'],
    keywords: ['dach', 'dächer', 'bestandsdach', 'dacharbeiten', 'betreten', 'abgrenzung'],
    text: 'Vor dem Betreten des Daches sind kollektive Schutzmaßnahmen zu errichten. Bestandsdächer dürfen nicht betreten werden. Abgrenzungen gemäß § 9 BauV: Anstelle von Absturzsicherungen nach § 8 sind stabile Abgrenzungen durch Brustwehren aus Holz, Metallrohr, gespannten Seilen oder Ketten zulässig (nur auf Flächen bis 20° Neigung).',
    freq: 2,
    related: ['wehren', 'kollektiv']
  },
  {
    id: 'daemmstoff',
    titel: 'Lagerung Dämmstoffe',
    kuerzel: ['dämm', 'daemm'],
    keywords: ['dämmstoff', 'daemmstoff', 'dämmstoffplatten', 'lagerung', 'brennbar', 'brüstung'],
    text: 'Keine Lagerung von Dämmstoffplatten direkt neben Brüstungen. Schutzzonen bei Lagerung im Bereich von brennbaren Materialien wie Dämmstoffen sind zu beachten.',
    freq: 2,
    related: ['gasflaschen']
  },
  {
    id: 'leitern',
    titel: 'Leitern / Stehleitern',
    kuerzel: ['leiter'],
    keywords: ['leiter', 'leitern', 'stehleiter', 'anlegeleiter', 'spreizsicherung', 'sprossen'],
    text: 'Nur geprüfte Leitern verwenden. Mit der Stehleiter werden nur leichte Arbeiten im Greifraum durchgeführt. Keine Stehleiter unmittelbar neben Absturzkanten verwenden. Stehleitern müssen mit einer Spreizsicherung (textile Bänder, Ketten oder fixierbare Gelenke) versehen sein; bei Verwendung müssen die Spreizsicherungen gespannt oder eingerastet sein, weshalb das „Gehen" mit Stehleitern untersagt ist. Gelenke dürfen keine Quetschstellen bilden.',
    freq: 1,
    related: ['bodenoeffnungen']
  },
  {
    id: 'bodenoeffnungen',
    titel: 'Bodenöffnungen',
    kuerzel: ['boden'],
    keywords: ['bodenöffnung', 'bodenöffnungen', 'öffnung', 'vertiefung', 'abdecken', 'schacht', 'sturz'],
    text: 'Bodenöffnungen schließen oder abdecken. Bei Arbeiten mit der Stehleiter können Vertiefungen einen Sturz und Fall verursachen.',
    freq: 1,
    related: ['leitern', 'verkehrswege']
  },
  {
    id: 'kran',
    titel: 'Kran / Drehbereich',
    kuerzel: ['kran'],
    keywords: ['kran', 'untendrehkran', 'drehbereich', 'kranballast', 'ballast', 'hebemittel'],
    text: 'Der Drehbereich des Untendrehkrans ist mit Wehren abzusichern. Keine Lagerung von Material und kein Zutritt zum Gefahrenraum im Drehbereich des Kranballastes. Transport nur mit zugelassenen Hebemitteln.',
    freq: 1,
    related: ['wehren']
  },
  {
    id: 'kmf',
    titel: 'KMF / Mineralwolle',
    kuerzel: ['kmf'],
    keywords: ['kmf', 'mineralfaser', 'mineralwolle', 'schutzmaske', 'staub'],
    text: 'Bei Arbeiten mit KMF (Künstliche Mineralfaser, alte Mineralwolle) sind Schutzmasken und Schutzkleidung zu tragen sowie die KMF-Richtlinien einzuhalten. Lagerung nur in geschlossenen Behältern im Baustellenbereich.',
    freq: 1,
    related: ['psa']
  },
  {
    id: 'winterbau',
    titel: 'Winterbau',
    kuerzel: ['winter'],
    keywords: ['winter', 'winterbau', 'eis', 'schnee', 'kälte', 'frost', 'rutschig', 'gefroren'],
    text: 'WINTERBAU: Arbeitsplätze und Verkehrswege müssen trittsicher und rutschfest sein; sie sind von Eis und Schnee freizuhalten und ausreichend zu beleuchten. Gelagertes Material ist abzudecken und gegen Zusammenfrieren zu sichern. Aufwärmmöglichkeiten schaffen und Aufenthaltsräume auf mindestens 21 °C beheizen. Geeignete Schutzkleidung ist kostenlos zur Verfügung zu stellen.',
    freq: 1,
    related: ['verkehrswege']
  },
  {
    id: 'sanitaer',
    titel: 'Waschplatz / Aufenthaltsraum (§ 37 BauV)',
    kuerzel: ['wasch'],
    keywords: ['waschplatz', 'aufenthaltsraum', 'sanitär', 'container', 'mahlzeiten'],
    text: 'Auf der Baustelle muss den Arbeitnehmern ein Waschplatz mit ausreichend fließendem warmem Wasser und ein Aufenthaltsraum bzw. ein geeigneter Platz zum Einnehmen der Mahlzeiten und zum Aufwärmen zur Verfügung stehen (§ 37 BauV). Diese sind auf Baudauer vorzuhalten.',
    freq: 1,
    related: []
  },
  {
    id: 'erstehilfe',
    titel: 'Erste Hilfe / Feuerlöscher',
    kuerzel: ['eh'],
    keywords: ['erste hilfe', 'erstehilfe', 'feuerlöscher', 'verbandskasten', 'brandschutz'],
    text: 'Erste-Hilfe-Kasten und Feuerlöscher sind auf der Baustelle vorhanden.',
    freq: 1,
    related: []
  },
  {
    id: 'unterweisung',
    titel: 'Unterweisung',
    kuerzel: ['uw'],
    keywords: ['unterweisung', 'sige', 'sigeplan', 'mitarbeiter', 'baustart'],
    text: 'Unterweisung mit den Mitarbeitern durchgeführt. Inhalt unter anderem SiGe-Plan und aktuelle Schutzmaßnahmen.',
    freq: 1,
    related: ['bauzaun']
  },
  {
    id: 'lob',
    titel: 'Baustelle in Ordnung',
    kuerzel: ['gut'],
    keywords: ['gut', 'ordentlich', 'sauber', 'passt', 'in ordnung'],
    text: 'Gut und ordentlich geführte Baustelle.',
    freq: 1,
    related: ['gelaender_ok', 'besprochen']
  }
];

// Foto-Kategorien: Was ist am Foto zu sehen? → passende Bausteine.
// Abgeleitet aus den Foto-Text-Zusammenhängen der analysierten Berichte.
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
