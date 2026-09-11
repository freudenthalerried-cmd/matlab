/**
 * Das Gegenprobenregister — welcher Prüfer hat je gezeigt, dass er anschlägt?
 *
 * **Der Anlass, 1. September 2026, sechste Runde.** Beim Bauen des
 * Leitzahlprüfers liefen zwei Gegenproben ins Leere: Die eingesetzte falsche
 * Zahl wurde nicht gemeldet, und beide Male sah das Ergebnis aus wie eine
 * bestandene Probe. Erst der dritte Anlauf schlug an.
 *
 * > **Eine Gegenprobe, die man nicht anschlagen sieht, ist keine.**
 *
 * `bin/gegenprobe.mjs` gibt es seit dem 31. August; es wendet **eine**
 * Mutation an und stellt sicher, dass sie ankommt. Was fehlte, ist das
 * Verzeichnis: welche Gegenprobe zu welchem Prüfer gehört, und ob sie heute
 * noch anschlägt. Von Hand ausgeführte Gegenproben hinterlassen nichts — ich
 * habe heute vier gemacht und keine davon wäre morgen noch nachweisbar.
 *
 * Dieses Register führt sie. `npm run gegenproben` wendet jede an, verlangt
 * **vier** Dinge und begnügt sich mit keinem davon allein:
 *
 *   1. Der Prüfer ist **vorher grün** — an einem roten Prüfer lässt sich
 *      nichts zeigen.
 *   2. Die Mutation ist **angekommen** (die Datei hat sich geändert).
 *   3. Der Prüfer meldet **rot** und nennt dabei die erwartete Stelle.
 *   4. Nach dem Zurücksetzen ist er **wieder grün** — sonst hat die Probe
 *      etwas hinterlassen.
 *
 * Und es zählt auf, welche Prüfer **keinen** Eintrag haben. Das ist der
 * eigentliche Ertrag: Ein Prüfer ohne Gegenprobe ist eine Behauptung.
 */

/**
 * Zwei Arten von Mutation, beide über Dateien statt über Befehlszeilen —
 * dieselbe Lehre wie in `gegenprobe.mjs`: Jede Maskierungsschicht ist eine
 * Gelegenheit, dass die Änderung nicht ankommt.
 *
 * `anhaengen` ist die sichere Sorte: Sie kann nichts kaputt machen, was schon
 * da war. `ersetzen` braucht einen Suchtext, der genau einmal vorkommt.
 */
export const ARTEN = Object.freeze(['anhaengen', 'ersetzen']);

export const GEGENPROBEN = Object.freeze([
  Object.freeze({
    id: 'leitzahlen-blanke-alte-zahl',
    pruefer: 'pruefe-leitzahlen',
    was: 'Eine abgelöste Leitzahl ohne ihre Bedingung im Fließtext',
    datei: 'docs/baustoff-shop/weg-zum-ersten-verkauf-nachgerechnet.md',
    art: 'anhaengen',
    text: '\n\nDer nötige Monatsumsatz liegt bei 45.356 €.\n',
    erwartet: /noetiger-monatsumsatz/,
    warum: 'Genau der Fall vom 1. September: die Kartenzahl, blank hingeschrieben. '
      + 'Zwei frühere Fassungen des Prüfers haben ihn nicht gemeldet.',
  }),
  Object.freeze({
    id: 'leitzahl-vom-nachbareintrag-gedeckt',
    pruefer: 'pruefe-leitzahlen',
    was: 'Eine abgelöste Zahl in einer Tabellenzeile, deren Bedingung nur nebenan steht',
    datei: 'docs/baustoff-shop/weg-zum-ersten-verkauf-nachgerechnet.md',
    art: 'anhaengen',
    text: '\n\n| Eintrag | Befund |\n|---|---|\n| erster | berichtigt am 25.08., '
      + 'gerechnet bei Kartenzahlung |\n| zweiter | Der nötige Monatsumsatz liegt bei 45.356 €. |\n',
    erwartet: /noetiger-monatsumsatz/,
    warum: 'Bis zum 2. September hätte die Bedingung im **Nachbareintrag** diese Zeile gedeckt — '
      + 'genau so blieb an dem Tag eine überholte Zahl in STATUS.md unbemerkt. Die Probe hält '
      + 'fest, dass eine Tabellenzeile nur sich selbst, ihren Kopf und den Text vor der Tabelle '
      + 'sieht.',
  }),
  Object.freeze({
    id: 'widerruf-ohne-widerruf',
    pruefer: 'pruefe-widerrufe',
    was: 'Eine zurückgenommene Aussage ohne ihre Rücknahme',
    datei: 'docs/baustoff-shop/weg-zum-ersten-verkauf-nachgerechnet.md',
    art: 'anhaengen',
    text: '\n\nDie Frachtpauschale steht auf jedem Beleg.\n',
    // Nicht die Regel-Kennung: Die steht auch in der **grünen** Ausgabe, weil der
    // Prüfer sein Register aufzählt. Gemessen am 7. September war das eine von 34
    // solchen Erwartungen. Die Fundzeile nennt Datei und Zeilennummer — die gibt
    // es ohne die Mutation nicht.
    erwartet: /weg-zum-ersten-verkauf-nachgerechnet\.md:\d+/,
    warum: 'Die Aussage ist am 27.08. zurückgenommen worden; sie stand danach noch '
      + 'sechs Tage im Warenkorb, weil der Prüfer die Datei nicht las.',
  }),
  Object.freeze({
    id: 'schaufenster-veraltete-leitzahl',
    pruefer: 'pruefe-schaufenster',
    was: 'Eine überholte Zahl in der PR-Beschreibung',
    datei: 'docs/baustoff-shop/pr-beschreibung.md',
    art: 'ersetzen',
    /*
     * **Auf ein Muster umgestellt (10.09.).** Diese Zahl ist dreimal berichtigt
     * worden — 45.356 → 43.396 → 43.792 —, und jedes Mal zeigte der Anker
     * danach ins Leere. Gemeint ist die fett gesetzte Leitzahl in ihrer Spalte,
     * nicht ihr jeweiliger Betrag.
     */
    suchenMuster: /\| \*\*[\d.]+ €\*\* \|/,
    ersetzen: '| **43.111 €** |',
    erwartet: /Nötiger Monatsumsatz/,
    warum: 'Die Beschreibung ist das Erste, was der Auftraggeber liest. Sie war '
      + 'schon einmal an neun Stellen überholt.',
  }),
  Object.freeze({
    id: 'inhalte-grenzwort',
    pruefer: 'pruefe-inhalte',
    was: 'Ein Werbeversprechen im Shoptext',
    datei: 'shop/inhalte/wissen/baumeisterpreis.md',
    art: 'anhaengen',
    text: '\n\nWir sind garantiert der günstigste Anbieter Österreichs.\n',
    erwartet: /baumeisterpreis/,
    warum: 'Die Redaktionsprinzipien verbieten Superlative ohne Beleg. Ohne Probe '
      + 'ist nicht gezeigt, dass die Regel im Bestand greift und nicht nur in der Probedatei.',
  }),
  Object.freeze({
    id: 'auftrag-beleg-fehlt',
    pruefer: 'pruefe-auftrag',
    was: 'Ein Beleg im Auftragsabgleich, den es nicht gibt',
    datei: 'shop/data/auftragszuordnung.json',
    art: 'ersetzen',
    suchen: '"shop/src/rollout.js"',
    ersetzen: '"shop/src/gibtesnicht.js"',
    erwartet: /beleg-fehlt|gibtesnicht/,
    warum: 'Der Abgleich behauptet, jede Antwort sei belegt. Ohne Probe ist das '
      + 'seine eigene Behauptung über sich selbst.',
  }),
  Object.freeze({
    id: 'belege-betrag-ohne-zustand',
    pruefer: 'pruefe-belege',
    was: 'Eine Rechnung, die eine Endsumme nennt und ihren Zustand verschweigt',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: '    ...vermerk.zeilen,\n',
    ersetzen: '',
    erwartet: /betrag-ohne-zustand/,
    warum: 'Der Befund vom 1. September: Die Buchhaltung des Kunden hätte ein '
      + 'zweites Mal überwiesen.',
  }),
  Object.freeze({
    id: 'test-ohne-zusicherung',
    pruefer: 'pruefe-tests',
    was: 'Ein Testfall, der eine leere Liste durchläuft und nichts prüft',
    datei: 'shop/test/zahlschreibweise.test.js',
    art: 'anhaengen',
    // **Zweiter Anlauf.** Der erste lief über ein leeres Literal `[]`. Der
    // Prüfer sucht Schleifen über eine **benannte** Liste — bei einem Literal
    // sieht jeder, dass sie leer ist, und die Regel zielt auf den Fall, in dem
    // man es nicht sieht. Die Mutation trifft jetzt die Regel, die es gibt.
    text: "\ntest('Probe: eine Schleife ohne Längenzusicherung', () => {\n"
      + "  const werte = [1];\n  for (const n of werte) {\n"
      + "    assert.equal(zahlText(n), '1');\n  }\n});\n",
    erwartet: /ohne vorherige Längenzusicherung|Schleife/,
    warum: 'Der Eintrag stand unter „begründeter Verzicht" mit dem Grund, eine Gegenprobe wäre '
      + 'ein absichtlich roter Test und der Lauf dauere vierzehn Sekunden. Beides trifft auf '
      + 'einen **Testlauf** zu — dieser Prüfer lässt aber nichts laufen, er liest den '
      + 'Quelltext der Testdateien und sucht drei Muster. Die Mutation ist deshalb billig: ein '
      + 'Testfall mit genau einem der Muster. Vierter Verzicht dieses Abends, dessen Begründung '
      + 'einen anderen Prüfer beschrieb als den, um den es ging.',
  }),
  Object.freeze({
    id: 'gebot-auf-altem-preis',
    pruefer: 'pruefe-preisalter',
    was: 'Ein beworbener Artikel, dessen Einkaufspreis über der Grenze liegt',
    datei: 'shop/data/katalog-baustoff.json',
    art: 'ersetzen',
    // POS-11283 steht im Referenzwarenkorb der beworbenen WDVS-Gruppe; auf ihm
    // ruht damit ein Gebot. Der Suchtext trägt die Artikelnummer mit, damit er
    // genau eine Stelle trifft — „preisStand" allein kommt sechsundvierzigmal vor.
    suchen: '"lieferantenArtikelnummer": "11283",\n      "bezeichnung": "Capatect Klebe- und Spachtelmasse 186 M 25 kg",\n      "gruppe": "WDVS",\n      "lieferantId": "poschacher",\n      "einheit": "KG",\n      "sperrgut": false,\n      "sperrgutQuelle": "eingeschaetzt",\n      "gtin": null,\n      "preisStand": "2026-08-17"',
    ersetzen: '"lieferantenArtikelnummer": "11283",\n      "bezeichnung": "Capatect Klebe- und Spachtelmasse 186 M 25 kg",\n      "gruppe": "WDVS",\n      "lieferantId": "poschacher",\n      "einheit": "KG",\n      "sperrgut": false,\n      "sperrgutQuelle": "eingeschaetzt",\n      "gtin": null,\n      "preisStand": "2025-01-02"',
    erwartet: /POS-11283|Gebot/,
    warum: 'Der Eintrag stand unter „begründeter Verzicht" mit dem Grund, die Grundlage sei '
      + '`preise/` — die eine Datei, die diese Arbeit nicht anfasst. Das stimmt für den '
      + '**Preis** und nicht für sein **Alter**: Der Preisstand steht im öffentlichen Katalog, '
      + 'und genau er ist der Gegenstand dieses Prüfers. Dritter Verzicht an diesem Abend, '
      + 'dessen Begründung schlüssig war und die Möglichkeit übersah.',
  }),
  Object.freeze({
    id: 'preis-nur-auf-der-karte-verschoben',
    pruefer: 'pruefe-preise',
    was: 'Ein Preis, der auf der Artikelkarte anders steht als in den drei übrigen Ausgaben',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: '  <span class="preis">${euro(a.vkNetto)}&nbsp;€ <span class="eh">je ${einheit}, netto</span></span>',
    ersetzen: '  <span class="preis">${euro(a.vkNetto + 1)}&nbsp;€ <span class="eh">je ${einheit}, netto</span></span>',
    erwartet: /Artikelkarte|Abweichung/,
    baueVorher: true,
    warum: 'Der Eintrag stand unter „begründeter Verzicht": Zwei Mutationen waren Leerläufe, '
      + 'weil alle vier Ausgaben aus **einem** Bau stammen und eine Änderung sie gemeinsam '
      + 'verschiebt. Die Stelle, die genau eine trifft, ist die Preiszeile der Kachel — sie '
      + 'kommt im Bauwerkzeug genau einmal vor. Was fehlte, war `baueVorher`: Ohne Bau '
      + 'dazwischen erreicht eine Änderung am Werkzeug die Ausgaben gar nicht.',
  }),
  Object.freeze({
    id: 'stand-datei-nicht-genannt',
    pruefer: 'pruefe-stand',
    was: 'Eine Arbeitsdatei, die in STATUS.md nicht mehr vorkommt',
    datei: 'docs/baustoff-shop/STATUS.md',
    art: 'ersetzen',
    suchen: '| `produktfeed-stand.md`',
    ersetzen: '| `produktfeed-stand-anders.md`',
    erwartet: /produktfeed-stand\.md/,
    warum: 'Der Eintrag stand bis zum 2. September unter „begründeter Verzicht" mit dem Grund, '
      + 'die Mutation sei eine **neue Datei**, und das Werkzeug könne nur ändern. Der Grund sah '
      + 'nur eine Richtung: Eine Datei ungenannt zu machen geht auch, indem man ihren Namen aus '
      + 'dem Verzeichnis entfernt. Dieselbe Sorte Irrtum wie bei `pruefe-seiten` eine Stunde '
      + 'davor — die Begründung war schlüssig und die Möglichkeit übersehen.',
  }),
  Object.freeze({
    id: 'kopfzahl-abgeloest',
    pruefer: 'pruefe-stand',
    was: 'Der Kopf von STATUS.md nennt eine Zahl, die der Prüfer selbst widerlegt',
    datei: 'docs/baustoff-shop/STATUS.md',
    art: 'ersetzen',
    suchen: 'zuerst lesen.** ',
    ersetzen: 'zuerst lesen.** 1',
    erwartet: /zahl-abgeloest/,
    warum: 'Genau der Zustand, in dem der Kopf sechs Tage lang stand, während der Prüfer '
      + 'darunter „338 von 338" meldete. Mutiert wird eine **vorangestellte Ziffer** und '
      + 'nicht die Zahl selbst: Die Zahl ändert sich jede Runde, ein Suchtext auf ihr wäre '
      + 'nach der nächsten Runde nicht mehr auffindbar — und eine Gegenprobe, deren Mutation '
      + 'nicht ankommt, prüft den unveränderten Bestand. Die zweite Angabe des Kopfes, das '
      + 'Datum, lässt sich hier nicht mutieren: Sobald die Datei angefasst ist, gilt der '
      + 'heutige Tag als jüngster Eingriff, und ein Stand von heute ist nie zu alt. Sie ist '
      + 'durch `test/statuskopf.test.js` in beide Richtungen abgedeckt.',
  }),
  Object.freeze({
    id: 'auszeichnung-ohne-ablauf',
    pruefer: 'test',
    was: 'Eine strukturierte Auskunft, die den Preis ohne Ablauf ausweist',
    datei: 'shop/src/preisalter.js',
    art: 'ersetzen',
    suchen: '  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return null;\n  const dann = Date.parse(`${s}T00:00:00Z`);\n  if (Number.isNaN(dann)) return null;\n  return new Date(dann + grenzeTage * TAG_MS).toISOString().slice(0, 10);',
    ersetzen: '  return null;',
    erwartet: /Gültigkeitsdatum|priceValidUntil/,
    warum: 'Die Artikelseite hat am 6. September den Satz „gültig bis zur nächsten Liste" '
      + 'zurückgenommen — auf allen 46 Seiten. Die strukturierte Auskunft ließ '
      + '`priceValidUntil` mit **derselben** Begründung weg („bis wann er gilt, weiß niemand") '
      + 'und behielt sie einen Tag länger. Die Mutation nimmt das gerechnete Datum wieder '
      + 'heraus: Ohne es sagt der Shop einer Maschine, sein Preis gelte unbefristet, während '
      + 'sieben seiner Artikelseiten im Klartext das Gegenteil sagen.',
  }),
  Object.freeze({
    id: 'korb-ohne-liste-ungeprueft',
    pruefer: 'pruefe-koerbe',
    was: 'Ein Referenzwarenkorb ohne Systemliste, den keine Prüfung ansieht',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "    ohneSystemliste:\n      'Kein Bauteil, sondern ein Baustoff.",
    ersetzen: "    ohneSystemlisteVergessen:\n      'Kein Bauteil, sondern ein Baustoff.",
    erwartet: /Mörtel/,
    warum: 'Die erste Fassung dieser Prüfung lief über die **Systemlisten** und sah die beiden '
      + 'Körbe nicht, zu denen es keine gibt — „Mörtel" und „Mauerwerk". Genau diese beiden '
      + 'Gruppen sind zurückgestellt: Die Entscheidung, die sie aus dem Budget nimmt, ruhte auf '
      + 'den Körben, die keine Prüfung ansah. Die Mutation kürzt den Grund unter die Grenze und '
      + 'verlangt, dass es auffällt.',
  }),
  Object.freeze({
    id: 'korb-ohne-die-halbe-bestellung',
    pruefer: 'pruefe-koerbe',
    was: 'Ein Referenzwarenkorb, dem eine geführte Position seiner Systemliste fehlt',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    // **Nachgezogen am 6. September, eine Stunde nach dem Eintrag.** Der
    // Suchtext war die Zeile der Dosierpistole — sie ist im selben Lauf wieder
    // aus dem Korb gefallen, weil `pruefe-preisalter` sie als 137 Tage alten
    // Preis meldete, auf dem ein Gebot ruht. Mutiert wird jetzt der
    // Thermo-Trennstein, der aus demselben Grund drinbleiben durfte: 73 Tage.
    suchen: "      { sku: 'POS-51967', menge: 1, was: 'Thermo-Trennstein', position: 'Thermo-Trennstein' },",
    ersetzen: '',
    erwartet: /Thermo-Trennstein/,
    warum: 'Der Deckungsbeitrag des Korbs trägt das Gebot. Bis zum 6. September lag im Korb '
      + 'der Gruppe „Dämmung" **eine von vier** geführten Positionen ihrer eigenen '
      + 'Systemliste, und das Gebot war 14 % zu klein. Ein zu kleines Gebot verliert '
      + 'Auktionen, ohne dass eine Abrechnung es zeigt — die Mutation nimmt eine Position '
      + 'wieder heraus und verlangt, dass es auffällt.',
  }),
  Object.freeze({
    id: 'gebot-auf-die-leere-trefferliste',
    pruefer: 'test',
    was: 'Ein geführtes Keyword, das die eigene Suche nicht beantwortet',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: '          artikel: D.artikel ?? [], seiten: D.seiten ?? [], suchwoerter: D.suchwoerter ?? [],',
    ersetzen: '          artikel: D.artikel ?? [], seiten: [], suchwoerter: D.suchwoerter ?? [],',
    erwartet: /leere Trefferliste/,
    warum: 'Die Regel steht seit dem 1. September als Kommentar in derselben Datei — „auf ein '
      + 'Wort zu bieten, das die eigene Suche nicht beantwortet, ist ein bezahlter Klick auf '
      + 'eine leere Trefferliste" —, und sie war ein Satz, ein Fall, kein Prüfer. '
      + '**Mutiert wird der Index, nicht die Wortliste**, und zwar genau so, wie der erste '
      + 'Messversuch am 6. September falsch lag: ohne die 24 Inhaltsseiten. Drei Keywords '
      + 'finden dann nichts. Damit hält diese Gegenprobe beides wach — die Regel und die '
      + 'Bedingung, unter der sie etwas wert ist: *Ein Prüfer, der einen anderen Index '
      + 'befragt als der Kunde, misst einen anderen Shop.*',
  }),
  Object.freeze({
    id: 'eigenes-wort-ausgeschlossen',
    pruefer: 'test',
    was: 'Ein Ausschluss, der ein Wort der eigenen Seiten trifft',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "  'Suche ohne Kaufabsicht': ['anleitung', 'video',",
    ersetzen: "  'Suche ohne Kaufabsicht': ['vergleich', 'anleitung', 'video',",
    erwartet: /vergleich/,
    warum: 'Genau der Zustand bis zum 6. September: „vergleich" stand als Ausschluss in der '
      + 'Kampagne und 39× im eigenen Seitentext — im Satz „Der Vergleich bezieht sich auf die '
      + 'Liste unseres Lieferanten", der das Verkaufsargument dieses Shops trägt. Der '
      + 'vorhandene Prüfer hielt die Ausschlüsse gegen das Liefergebiet und gegen die '
      + 'Keywordliste und kannte den dritten Bestand nicht: die Seiten, auf die die Anzeige '
      + 'zeigt.',
  }),
  Object.freeze({
    id: 'anzeige-verspricht-die-absage',
    pruefer: 'test',
    was: 'Ein Anzeigentext, der nennt, was die eigene Landeseite absagt',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "'Perimeter- und Sockeldämmung zum Preis",
    ersetzen: "'Perimeter- und Fassadendämmung zum Preis",
    erwartet: /führen wir nicht|Fassadendämmung/,
    warum: 'Genau der Text, der bis zum 6. September in der Anzeigengruppe „Dämmung" stand, '
      + 'während die Landeseite im zweiten Satz sagt, dass die Fassadendämmplatte in '
      + 'Flächenstärke nicht geführt wird. Die Regel vom Vortag hielt das gleichlautende '
      + '**Keyword** zurück und sah den **Text** nicht an.',
  }),
  Object.freeze({
    id: 'gebot-auf-die-absage',
    pruefer: 'test',
    was: 'Ein Anzeigen-Keyword, das die eigene Landeseite verneint',
    datei: 'shop/src/abgrenzung.js',
    art: 'ersetzen',
    suchen: '  /\\bführen wir (?:derzeit |hier |aktuell )?(?:nicht|keine[nrs]?\\b)/i;',
    ersetzen: '  /\\bfuehren wir bestimmt nicht\\b/i;',
    erwartet: /müsste zurückgehalten werden|gefunden:/,
    warum: 'Die Anzeigengruppe „Dämmung" bot auf „Fassadendämmung EPS", bis zu 5,91 € je Klick, '
      + 'während die Landeseite im zweiten Satz sagt, dass die Fassadendämmplatte in '
      + 'Flächenstärke nicht geführt wird. Die Mutation macht das Abgrenzungsmuster blind und '
      + 'verlangt, dass es auffällt: Ohne die Regel geht das Keyword wieder in die Kampagne, '
      + 'und der bezahlte Klick landet auf einer Absage.',
  }),
  Object.freeze({
    id: 'preisstand-ohne-alter',
    pruefer: 'test',
    was: 'Eine Preisgrundlage über der eigenen Grenze, ohne dass die Seite es sagt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: '    const alt = typeof tage === \'number\' && tage > GRENZE_TAGE;',
    ersetzen: '    const alt = false;',
    erwartet: /nennt das Alter nicht|Marke fehlt/,
    baueVorher: true,
    warum: 'Sieben von 46 Preisgrundlagen sind älter als die selbst gesetzte Grenze, die '
      + 'älteste 137 Tage. `pruefe-preisalter` lässt sie durchgehen, solange kein '
      + 'Anzeigengebot auf ihnen ruht — das schützt das Werbebudget und sagt dem Kunden '
      + 'nichts. Die Mutation schaltet die Marke ab und verlangt, dass es auffällt: Ohne sie '
      + 'stünde auf sieben Seiten ein Preis, dessen Grundlage älter ist als das, was dieser '
      + 'Betrieb selbst für vertretbar hält.',
  }),
  Object.freeze({
    id: 'abnahme-fragt-ins-leere',
    pruefer: 'test',
    was: 'Eine Abnahmeliste, die nach etwas fragt, das im Ausgabeordner nicht steht',
    datei: 'shop/src/abnahme.js',
    art: 'ersetzen',
    suchen: "      erwartet: 'window.__SHOP__',",
    ersetzen: "      erwartet: 'window.__GIBT_ES_NICHT__',",
    erwartet: /erwartung-steht-nicht-drin|skript/,
    warum: 'Die Liste wird abgearbeitet, wenn niemand mehr am Bau sitzt: Der Auftraggeber ruft '
      + 'acht Adressen auf und sieht nach, ob der genannte Text da ist. Fragt sie nach einem '
      + 'Text, den es im Ordner gar nicht gibt, meldet er einen Fehler des Servers, wo der '
      + 'Fehler in der Liste steht — und sucht ihn an der falschen Stelle.',
  }),
  Object.freeze({
    id: 'fehlerseite-ohne-auslieferung',
    pruefer: 'test',
    was: 'Eine Fehlerseite, die im Ordner liegt und die niemand ausliefert',
    // **Nachgezogen am 11. September**, mit dem Umzug der `.htaccess` nach
    // `src/serverkopf.js`. Der Suchtext stand im Seitenbauwerkzeug und traf
    // dort nichts mehr — der Testfall „Jeder Suchtext trifft genau die Stelle,
    // die gemeint ist" hat es sofort gesagt.
    datei: 'shop/src/serverkopf.js',
    art: 'ersetzen',
    suchen: "    `ErrorDocument 404 /${fehlerseite}.html`,",
    ersetzen: "    'ErrorDocument 404 /fehler.html',",
    erwartet: /zeigt auf \/fehler\.html/,
    baueVorher: true,
    warum: 'Die Fehlerseite wird nur ausgeliefert, weil `.htaccess` sie dem Server nennt. Wer '
      + 'sie umbenennt und die Zeile vergisst, hat wieder die Seite des Hosters — ohne Marke, '
      + 'ohne Kopfleiste, ohne Weg ins Sortiment, und ohne dass irgendetwas rot würde. Die '
      + 'Mutation lässt die Zeile stehen und zeigt auf eine Datei, die es nicht gibt: geprüft '
      + 'wird die Wirkung, nicht der Wortlaut.',
  }),
  Object.freeze({
    id: 'kopfvermerk-ohne-aussage',
    pruefer: 'pruefe-widerrufe',
    was: 'Ein Kopfvermerk, der nur ein Umgebungswort trägt statt einer Rücknahme',
    datei: 'docs/baustoff-shop/rechnung-zum-zuschlag.md',
    art: 'ersetzen',
    suchen: '> **Überholt seit 25.08.:**',
    ersetzen: '> **Abgelöst seit 25.08.:**',
    erwartet: /marge-als-zuschlag/,
    warum: 'Der Kopfvermerk dieser Datei deckt fünf Fundstellen im ganzen Dokument. Die '
      + 'Mutation tauscht das eine Wort, das ihn zu einer Rücknahme macht, gegen eines aus der '
      + 'Umgebungsliste eines Eintrags — genau der Zustand, der `STATUS.md:775` sechs Tage lang '
      + 'stillgestellt hat. Ohne diese Gegenprobe wäre die Sammeldeckung das einzige Stück des '
      + 'Prüfers, dessen Ausfall niemand bemerkt: Sie macht grün, wo sonst rot stünde.',
  }),
  Object.freeze({
    id: 'vorbehalt-erreicht-niemanden',
    pruefer: 'pruefe-vorbehalte',
    was: 'Ein Vorbehalt aus dem Rechenkern, der in keiner Ausgabe steht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: 'Lieferant in alle fünf Bezirke zustellt, ist nicht bestätigt:',
    ersetzen: 'Lieferant in alle fünf Bezirke zustellt, steht fest:',
    erwartet: /nicht-in-der-ausgabe/,
    baueVorher: true,
    warum: 'Der Zustand vom 26. August bis zum 5. September: `LIEFERGEBIET.vorbehalt` stand im '
      + 'Rechenkern, und 81 von 81 gebauten Seiten nannten das Gebiet als feststehende Tatsache. '
      + 'Die Mutation nimmt genau die Wendung heraus, an der der Vorbehalt in der Ausgabe '
      + 'erkennbar ist — sie prüft damit die Ausgabe und nicht den Bauer.',
  }),
  Object.freeze({
    id: 'korbflaeche-ohne-grenze',
    pruefer: 'shopprobe',
    was: 'Eine Fläche mit Legen-Knopf, auf der die Grenze aus Gate 25 fehlt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "const KARTENFLAECHEN = Object.freeze(['class=\"karte\"', 'id=\"suche-ziel\"']);",
    ersetzen: "const KARTENFLAECHEN = Object.freeze(['class=\"karte\"']);",
    /*
     * **Berichtigt am 10. September 2026.** Die Erwartung nannte das
     * **allgemeine** Szenario („Keine Fläche mit Legen-Knopf ohne die Grenze"),
     * und das bleibt unter dieser Mutation zu Recht grün: Die Suchergebnisseite
     * trägt vor dem ersten Tastendruck gar keinen Knopf. Rot wird das Szenario
     * daneben, das genau für sie gebaut wurde. Der Läufer hat es gesagt —
     * „meldete rot, aber nicht wegen …" —, und ohne diese Unterscheidung wäre
     * die Probe als geschlagen durchgegangen, obwohl sie auf die falsche Stelle
     * zeigte.
     *
     * Gesehen hat das erst der erste Lauf **mit Browser**: Die Probe stand seit
     * dem 5. September im Register und war bis heute nie ausgeführt.
     */
    erwartet: /Karten erst beim Tippen entstehen/,
    baueVorher: true,
    warum: 'Der Zustand vom 5. September: neun Karten mit neun Knöpfen „In den Warenkorb" auf '
      + 'der Suchergebnisseite, und kein Wort über die 250 € netto je Lieferung. Die Mutation '
      + 'nimmt genau das Merkmal wieder heraus, das die Fläche kenntlich macht — und muss das '
      + 'Szenario treffen, das **nicht** an dieser Liste hängt, sondern am Legen-Knopf im '
      + 'laufenden Browser.',
  }),
  Object.freeze({
    id: 'auszeichnung-sagt-mehr-als-die-seite',
    pruefer: 'pruefe-seiten',
    was: 'Eine maschinenlesbare Antwort mit einer Zahl, die auf der Seite nicht steht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "      'Nein. Die Frachtpauschale hängt an der Fahrt und nicht am Warenwert; wer sie trotzdem als '",
    ersetzen: "      'Nein, erst ab 3000 € netto. Die Frachtpauschale hängt an der Fahrt und nicht am Warenwert; wer sie trotzdem als '",
    erwartet: /3000|3\s?000/,
    baueVorher: true,
    warum: 'Eine Auszeichnung, die mehr sagt als die Seite, ist eine Behauptung an eine '
      + 'Maschine — sie wird zitiert und nicht gelesen. Dieselbe Familie wie `PreOrder` gegen '
      + '`InStock`: Beide Seiten stimmen für sich, und der Widerspruch fällt beim Kunden auf. '
      + '**Suchtext nachgezogen am 6. September:** Er mutierte die Antwort „Kann ich selbst '
      + 'abholen?", und die ist mit Gate 28 abgeleitet worden — ein Suchtext, der auf einen '
      + 'Satz zeigt, den es nicht mehr gibt, hält den Lauf an, statt etwas zu zeigen. Jetzt '
      + 'trifft er die Frei-Haus-Antwort: eine erfundene Schwelle in der maschinenlesbaren '
      + 'Fassung, die auf der Seite nirgends steht.',
  }),
  Object.freeze({
    id: 'agb-punkt-verschoben',
    pruefer: 'pruefe-belege',
    was: 'Ein Beleg, der auf eine Klausel zeigt, die etwas anderes regelt',
    datei: 'shop/src/rechtstexte.js',
    art: 'ersetzen',
    suchen: "    titel: 'Zahlung, Verzug, Eigentumsvorbehalt',",
    ersetzen: "    titel: 'Gewährleistung und Haftung',",
    erwartet: /verweis-zeigt-woanders|Punkt 9 heißt/,
    warum: 'Angebot und Auftragsbestätigung zitieren „Punkt 2" und „Punkt 9" der eigenen AGB. '
      + 'Beide Verweise hängen an einer Zählung, die niemand bewacht: Wer einen Punkt '
      + 'einschiebt, verschiebt jede Nummer dahinter, und der Kundenbeleg zitiert danach eine '
      + 'fremde Klausel. Die Gliederung bleibt dabei richtig und der Beleg lesbar.',
  }),
  Object.freeze({
    id: 'datenschutz-zusage-stimmt-nicht',
    pruefer: 'pruefe-datenschutz',
    was: 'Ein Cookie in einem Shop, dessen Rechtsseite „keine Cookies" zusagt',
    datei: 'shop/shop-ui.js',
    art: 'anhaengen',
    // **Kein Kommentar.** Der erste Versuch hängte `// document.cookie = …`
    // an; das Bündel wirft Kommentare weg, und die Probe blieb grün. Eine
    // Mutation, die der Bau entfernt, ist keine.
    text: '\ntry { document.cookie = "probe=1"; } catch (e) {}\n',
    erwartet: /keine-cookies|Keine Cookies/,
    baueVorher: true,
    warum: 'Die sechs Sätze auf der Datenschutzseite sind Aussagen über den Code, und geprüft '
      + 'war bisher nur, dass sie dastehen. Eine Zusage auf einer Rechtsseite, die niemand '
      + 'nachmisst, ist eine Behauptung mit Haftung.',
  }),
  Object.freeze({
    id: 'bestelltext-verliert-gebrochene-menge',
    pruefer: 'pruefe-kontrolle',
    was: 'Eine gebrochene Menge, die der Rückleser des Bestelltextes nicht sieht',
    datei: 'shop/src/kontrolle.js',
    art: 'ersetzen',
    suchen: "    const p = /^\\s*([\\d.,]+)\\s+×\\s+(\\S+)\\s+(.+)$/.exec(zeilen[i]);",
    ersetzen: "    const p = /^\\s+(\\d+)\\s+×\\s+(\\S+)\\s+(.+)$/.exec(zeilen[i]);",
    erwartet: /Position|Bestellung|Abweichung/i,
    warum: 'Der Befund vom 2. September: Der Rückleser verlangte ganze Zahlen, und der Shop '
      + 'gibt Platten zu 0,75 m² ab. Die Zeile verschwand still, und die Gegenprobe '
      + 'beschuldigte den Bestelltext, in dem die Position sehr wohl stand.',
  }),
  Object.freeze({
    id: 'rechnung-ohne-anschrift',
    pruefer: 'pruefe-belege',
    was: 'Eine Rechnung, die nur den Namen des Ausstellers trägt',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: "    wert(betreiber.strasse, 'Straße des Ausstellers'),\n",
    ersetzen: '',
    erwartet: /geprueft-aber-nicht-gedruckt|steht aber nicht im Beleg/,
    warum: 'Der Befund vom 2. September: Die Rechnung galt als vollständig nach § 11 UStG, '
      + 'während die Anschrift des Ausstellers im gedruckten Beleg fehlte. Die eine Prüfung '
      + 'las die Eingaben, die andere den Text, und niemand hielt beides gegeneinander.',
  }),
  Object.freeze({
    id: 'kranentladung-verrechnet-nicht-bestellt',
    pruefer: 'pruefe-belege',
    was: 'Eine Kranentladung, die dem Kunden verrechnet und beim Lieferanten nicht bestellt wird',
    datei: 'shop/src/bestellung.js',
    art: 'ersetzen',
    suchen: '    ...kranzeile(teil),\n',
    ersetzen: '',
    erwartet: /verrechnet-nicht-bestellt|nicht bestellt/,
    warum: 'Der Befund vom 2. September: Der Warenkorb rechnete je palettierter Position '
      + '7,50 € und die Bestellung sagte davon nichts. Jeder Beleg für sich war in Ordnung — '
      + 'der Fehler lag zwischen ihnen, und genau dort sieht niemand hin.',
  }),
  Object.freeze({
    id: 'quellen-aussage-ohne-beleg',
    pruefer: 'pruefe-quellen',
    was: 'Eine belegpflichtige Aussage ohne Fundstelle',
    datei: 'shop/inhalte/quellen.json',
    art: 'ersetzen',
    suchen: '"quellen": ["etag-004", "oenorm-b6400"]',
    ersetzen: '"quellen": []',
    erwartet: /a-wdvs-system|ohne Quelle|nicht belegt|NICHT VERWENDBAR/i,
    warum: 'Der Prüfer sagt „jede Aussage trägt ihre Quelle". Ohne Probe ist das seine '
      + 'eigene Behauptung über sich selbst — dieselbe Lage wie beim Auftragsabgleich.',
  }),
  Object.freeze({
    id: 'oberflaeche-erfindet-antwortzeit',
    pruefer: 'pruefe-oberflaeche',
    was: 'Eine Antwortzeit auf der Kasse, die niemand zugesagt hat',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    suchen: "        : ' — wir bestätigen Preis, Verfügbarkeit und Termin.';",
    ersetzen: "        : ' — wir bestätigen Preis, Verfügbarkeit und Termin innerhalb von 24 Stunden.';",
    erwartet: /Zeitzusage im Quelltext|24 Stunden/i,
    warum: 'Genau die Gegenprobe, die am 2. September nicht anschlug: Der Satz steht in '
      + 'keiner gebauten Datei, `pruefe-seiten` blieb zu Recht grün. Seit es einen Prüfer '
      + 'für die Oberflächensätze gibt, hat sie einen Adressaten. Beim ersten Lauf gegen '
      + 'ihn blieb er trotzdem grün — die allgemeine Zahlenregel kennt „Std“, nicht '
      + '„Stunden“. Wieder lag es an der Probe und nicht am Prüfer; erst die Regel gegen '
      + 'fest eingetragene Zeitspannen im Quelltext macht sie scharf.',
  }),
  Object.freeze({
    id: 'rollout-ueber-der-frist',
    pruefer: 'rollout',
    was: 'Eine Kette, die nicht mehr in die Frist passt',
    datei: 'shop/src/rollout.js',
    art: 'ersetzen',
    // **Zweiter Anlauf.** Der erste stellte ein zweites `tage: 60` **vor** das
    // vorhandene `tage: 10`. In einem Objektliteral gewinnt der letzte
    // Schlüssel — die Mutation kam an und bewirkte nichts. Eine Mutation, die
    // der Bau überschreibt, ist keine.
    suchen: "      + 'am selben Tag hinaus wie die Freigabe. Genau deshalb bestimmt diese Etappe den Strang.',\n    tage: 10,",
    ersetzen: "      + 'am selben Tag hinaus wie die Freigabe. Genau deshalb bestimmt diese Etappe den Strang.',\n    tage: 60,",
    erwartet: /passt mit \d+ Tagen nicht in die Frist|über der Frist/,
    warum: 'Der Plan druckte „passt in die Frist" oder „über der Frist" und endete beide Male '
      + 'grün. Eine Kette, die nicht mehr in neunzig Tage passt, ist ein Befund und keine '
      + 'Fußnote — dieselbe Familie wie `startklar`, das mit „NICHT STARTKLAR" grün endete.',
  }),
  Object.freeze({
    id: 'punkt-ohne-etappe',
    pruefer: 'rollout',
    was: 'Ein Punkt der Bereitschaftsliste, den der Plan nicht führt',
    datei: 'shop/src/bereitschaftsplan.js',
    art: 'ersetzen',
    suchen: "  Object.freeze({ punkt: 'bankverbindung', etappe: 'betreiberangaben' }),\n",
    ersetzen: '',
    erwartet: /bankverbindung/,
    warum: 'Genau der Fall vom 4. September: `startklar()` bekam abends die Bankverbindung als '
      + 'neuen Punkt, und der Rolloutplan — das Papier, das der Auftraggeber vor der '
      + 'Budgetfreigabe liest — erfuhr nichts davon. Zwei Listen über dieselbe Sache, und die '
      + 'kürzere gewinnt, weil ein Plan mit einer Voraussetzung weniger wie ein guter Plan '
      + 'aussieht. Diese Mutation nimmt den Eintrag wieder heraus.',
  }),
  Object.freeze({
    id: 'rollout-abhaengigkeit-ohne-grund',
    pruefer: 'rollout',
    was: 'Eine Etappe, die an nichts hängt und nicht sagt, warum',
    datei: 'shop/src/rollout.js',
    art: 'ersetzen',
    suchen: "    warumOhneVoraussetzung: 'Die Angaben liegen beim Auftraggeber; es fehlt nichts, worauf sie '\n      + 'warten müssten.',\n",
    ersetzen: '',
    erwartet: /impressum: hängt von nichts ab und sagt nicht, warum/,
    warum: 'Der Befund vom 2. September: `brauchtVor` war das einzige Feld im Plan ohne '
      + 'Pflichtgrund, und genau dieses Feld war falsch. Eine fehlende Abhängigkeit verkürzt '
      + 'die Kette und sieht aus wie ein guter Plan — die Probe hält fest, dass die leere '
      + 'Liste jetzt auffällt.',
  }),
  Object.freeze({
    id: 'anfrage-punkt-ohne-frage',
    pruefer: 'pruefe-anfrage',
    was: 'Ein offener Punkt, den keine Frage des Briefes schließt',
    datei: 'shop/src/lieferantenanfrage.js',
    art: 'ersetzen',
    suchen: "    schliesst: Object.freeze(['liefergebiet-lieferant']),",
    ersetzen: "    schliesst: Object.freeze(['liefergebiet-anderswo']),",
    erwartet: /liefergebiet-lieferant: offener Punkt, den keine Frage schließt/,
    warum: 'Der Brief geht einmal hinaus. Bleibt ein Punkt ungefragt, merkt es niemand — '
      + 'das Gespräch hat ja stattgefunden. Genau dagegen ist die Zuordnung gebaut, und '
      + 'ohne Probe ist sie nur eine Behauptung über sich selbst.',
  }),
  Object.freeze({
    id: 'crawler-sperre-ohne-ausweg',
    pruefer: 'pruefe-crawler',
    was: 'Eine Sperre, die den Anbieter ausschließt statt sein Training',
    datei: 'shop/src/crawler.js',
    art: 'ersetzen',
    suchen: "    kennung: 'Google-Extended',\n    anbieter: 'Google',\n    zweck: 'suche',\n    zugang: 'erlaubt',",
    ersetzen: "    kennung: 'Google-Extended',\n    anbieter: 'Google',\n    zweck: 'training',\n    zugang: 'gesperrt',",
    erwartet: /Google: keine erlaubte Such- oder Nutzerkennung/,
    warum: 'Der Befund vom 2. September, wörtlich zurückgesetzt: Google-Extended stand als '
      + 'Trainingszeile und war gesperrt, und daneben stand keine erlaubte Suchkennung. Die '
      + 'Probe hält fest, dass genau dieser Zustand auffällt und nicht wieder ein Jahr steht.',
  }),
  Object.freeze({
    id: 'aufwand-ueber-der-grenze',
    pruefer: 'aufwand',
    was: 'Ein Betrieb, der nicht mehr nebenbei läuft',
    datei: 'shop/src/auftragslauf.js',
    art: 'ersetzen',
    suchen: "    id: 'terminauskunft',\n    name: 'Liefertermin an den Kunden weitergeben',\n    braucht: ['produktdatenSchnittstelle'],\n    minutenOhne: 2,",
    ersetzen: "    id: 'terminauskunft',\n    name: 'Liefertermin an den Kunden weitergeben',\n    braucht: ['produktdatenSchnittstelle'],\n    minutenOhne: 20,",
    erwartet: /geht nicht nebenbei|Die Grenze reißt/,
    warum: 'Die Zielgröße von 67 Bestellungen liegt bei 73 % der Zahl, ab der die Handarbeit '
      + 'die gesetzte Grenze reißt. Eine Minute mehr je Schritt verschiebt diesen Abstand '
      + 'spürbar — die Probe hält fest, dass es auffällt.',
  }),
  Object.freeze({
    id: 'warenkorb-ohne-kleinmengensatz',
    pruefer: 'wegprobe',
    was: 'Ein Warenkorb, der die Fracht über der Ware verschweigt',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    suchen: '      if (rechnung.frachtNetto > rechnung.warenwertNetto) {',
    ersetzen: '      if (false && rechnung.frachtNetto > rechnung.warenwertNetto) {',
    erwartet: /Warenkorb sagt es nicht/,
    // Die Wegprobe geht durch den **gebauten** Shop. Eine Änderung an einer
    // Quelldatei erreicht sie erst nach `build` und `website`.
    baueVorher: true,
    warum: 'Der Befund vom 2. September: Der Warenkorb sagte „Das lohnt sich für Sie nicht", '
      + 'und das eine Papier, das den Shop verlässt, sagte es nicht. **Umgehängt am 3. September, '
      + 'wegen Gate 25.** Die Mutation zeigte bis dahin auf den Satz im Anfragetext. Der '
      + 'Mindestbestellwert von 250 € liegt über jedem Frachtsatz des Bestands (höchstens 100 €), '
      + 'also kann kein Korb, der überhaupt einen Anfragetext erzeugt, die Fracht noch '
      + 'unterschreiten — die Stelle ist über diesen Weg nicht mehr erreichbar. Der Satz im '
      + 'Anfragetext bleibt und wird von kundenanfrage.test.js gehalten; die Gegenprobe zeigt '
      + 'jetzt auf den Warenkorb, wo derselbe Hinweis weiter greift.',
  }),
  Object.freeze({
    id: 'weg-zahlweg-nicht-vorbelegt',
    pruefer: 'wegprobe',
    was: 'Ein Klick mehr auf dem Weg zur Anfrage',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    suchen: 'if (i === 0) r.checked = true;',
    ersetzen: 'if (i === -1) r.checked = true;',
    erwartet: /nicht vorbelegt/,
    warum: 'Der bezahlte Klick kostet 4,19 bis 8,22 €. Jeder zusätzliche Schritt bis zur '
      + 'Anfrage entwertet ihn, und ein nicht vorbelegter Zahlweg ist ein Klick ohne '
      + 'Erkenntnis.',
    baueVorher: true,
  }),
  Object.freeze({
    id: 'anzeige-verspricht-vollstaendigkeit',
    pruefer: 'kampagne',
    was: 'Eine Anzeige, die Vollständigkeit verspricht, obwohl die Systemliste eine Lücke nennt',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "'Armierung bis Oberputz'",
    ersetzen: "'Fassade komplett liefern'",
    erwartet: /verspricht Vollständigkeit/,
    warum: 'Der teuerste Klick des ersten Anlaufs führte auf ein Versprechen, das die '
      + 'eigene Systemliste im selben Verzeichnis widerlegt — die Dämmplatte in '
      + 'Flächenstärke führt der Shop nicht.',
  }),
  Object.freeze({
    id: 'anzeige-redet-den-aufschlag-weg',
    pruefer: 'kampagne',
    was: 'Eine Anzeige, die behauptet, der Kunde zahle den Einkaufspreis des Baumeisters',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "'Ein Baumeister kauft ein — wie weit unter der Liste, steht bei jedem Artikel.'",
    ersetzen: "'Ein Baumeister kauft ein, Sie zahlen seinen Preis.'",
    erwartet: /Aufschlag/,
    warum: 'Die Ersetzung ist keine erfundene Verschlechterung, sondern der Wortlaut, der bis '
      + 'zum 5. September in der WDVS-Anzeige stand. Die eigene Wissensseite — von jeder '
      + 'Artikelkarte verlinkt — beantwortet dieselbe Frage im zweiten Satz mit „zuzüglich '
      + 'eines Aufschlags". Der Kunde zahlt nicht seinen Preis, sondern seinen Preis plus '
      + '25 %. Das ist eine Preisangabe in einer Werbung, also die Gattung, bei der eine '
      + 'falsche Aussage nicht nur enttäuscht.',
  }),
  Object.freeze({
    id: 'schalten-ohne-bestellweg',
    pruefer: 'kampagne',
    was: 'Anzeigen, die eine Bestellung versprechen, ohne dass der Plan sie an den Bestellweg bindet',
    datei: 'shop/src/rollout.js',
    art: 'ersetzen',
    suchen: "        etappe: 'bestellweg',\n        warum: 'Alle drei Anzeigen versprechen eine Bestellung:",
    ersetzen: "        etappe: 'upload',\n        warum: 'Alle drei Anzeigen versprechen eine Bestellung:",
    erwartet: /verspricht eine Bestellung/,
    warum: 'Der Zustand bis zum 5. September: Der Bestellweg lag im Plan zwei Tage vor dem '
      + 'Schalten — aber nur zeitlich, nicht als Bedingung. Alle drei Anzeigen versprechen '
      + '„aus einer Bestellung", „in einer Lieferung", „geliefert statt abgeholt", und '
      + '`llms.txt` sagt daneben „Bestellen ist noch nicht möglich". Verschiebt sich eine '
      + 'Etappe davor, laufen bezahlte Anzeigen auf ein Versprechen, das die Landeseite '
      + 'nicht einlöst. Die Mutation ersetzt die Bedingung durch eine, die ohnehin '
      + 'dasteht — die Reihenfolge im Plan bleibt, die Bindung fällt weg, und genau das '
      + 'soll auffallen.',
  }),
  Object.freeze({
    id: 'ausschluss-trifft-den-eigenen-ort',
    pruefer: 'kampagne',
    was: 'Ein Geo-Ausschluss, der den Ort trifft, in dem der Betrieb sitzt',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "    'wien', 'graz', 'salzburg', 'innsbruck',",
    ersetzen: "    'ried', 'wien', 'graz', 'salzburg', 'innsbruck',",
    erwartet: /eigenen Ort|warum nicht/,
    warum: 'Ried im Innkreis liegt weit außerhalb des Liefergebiets, und der Eintrag sähe '
      + 'aus wie der nächste selbstverständliche Geo-Ausschluss. Der Betrieb sitzt in Ried '
      + 'in der Riedmark, Bezirk Perg — ein Phrase-Ausschluss unterscheidet die beiden '
      + 'nicht und träfe die eigene Kundschaft an ihrer Haustür. Bis zum 5. September wäre '
      + 'er durchgegangen: Die Prüfung hielt die Ausschlüsse gegen die fünf Bezirksnamen, '
      + 'und keiner davon enthält „ried". Dieselbe Verwechslung stand am 26. August in '
      + 'vier Dokumenten dieses Bestands.',
  }),
  Object.freeze({
    id: 'landeseite-verschweigt-luecke',
    pruefer: 'kampagne',
    was: 'Eine Landeseite, die die Lücke ihrer Systemliste nicht nennt',
    datei: 'shop/inhalte/gruppen/wdvs.md',
    art: 'ersetzen',
    suchen: 'führen wir nicht',
    ersetzen: 'ist eine eigene Position',
    // `alle: true`: Heute nennt `wdvs.md` die Lücke genau einmal, die Mutation
    // wäre auch ohne die Marke eindeutig. Sie steht trotzdem hier, weil der
    // Satz eine Aufzählung begleitet: Kommt eine zweite Lücke dazu, soll die
    // Probe beide entfernen und nicht die halbe Seite stehen lassen.
    alle: true,
    erwartet: /Landeseite nicht/,
    warum: 'Eine ehrliche Anzeige ist nur die halbe Ehrlichkeit — der Besucher klickt und '
      + 'landet auf der Gruppenseite. Dort soll er die Lücke lesen, nicht selbst bemerken.',
  }),
  Object.freeze({
    id: 'auftrag-nennt-was-es-nicht-gibt',
    pruefer: 'pruefe-auftrag',
    was: 'Eine Begründung, die einen Befehl nennt, den es nicht gibt',
    datei: 'shop/data/auftragszuordnung.json',
    art: 'ersetzen',
    suchen: 'npm run pruefe-kontrolle',
    ersetzen: 'npm run pruefe-erfunden',
    erwartet: /nennt den Befehl/,
    warum: 'Zum neunten Ergebnis stand ein Vorgang im Präsens, den es nicht gab — die '
      + 'Belegdatei existierte, der Aufruf nicht. Ein Beleg, der existiert, belegt noch nichts.',
  }),
  Object.freeze({
    id: 'kontrolle-margenleck',
    pruefer: 'pruefe-kontrolle',
    was: 'Der Wareneinsatz auf dem Kundenbeleg',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: "    'Leistungsort Österreich, Steuersatz 20 %.',",
    ersetzen: "    `Wareneinsatz: ${EUR(warenkorb.einkaufNetto)}`,\n    'Leistungsort Österreich, Steuersatz 20 %.',",
    erwartet: /Einkaufszahl|Wareneinsatz/i,
    warum: 'Die Weisung vom 28.08. lautet: keine Spanne ausgeben. Die zweite Rechnung '
      + 'liest den fertigen Belegtext und muss die Einkaufszahl darin finden — sonst '
      + 'bestätigt sie nur, statt zu prüfen.',
  }),
  Object.freeze({
    id: 'kasse-ohne-mindestbestellwert',
    pruefer: 'wegprobe',
    was: 'Eine Kasse, die jeden Warenkorb annimmt — auch den, den Gate 20 später ablehnt',
    datei: 'shop/src/shopkern.js',
    art: 'ersetzen',
    suchen: '  if (wert >= grenzeNetto) {',
    ersetzen: '  if (true || wert >= grenzeNetto) {',
    erwartet: /Mindestbestellwert nicht|Warenkorb sagt es nicht/,
    baueVorher: true,
    warum: 'Der Zustand bis zum 3. September, wörtlich: Gate 20 lief erst bei der Auslösung, '
      + 'und die Kasse rechnete einen Korb über 19,30 € durch, wies Preise aus und bot ihn als '
      + 'fertige Anfrage an. Eine Sperre, die erst nach dem Ja greift, ist keine Sperre, sondern '
      + 'eine Absage mit Verzögerung. Diese Mutation stellt genau das wieder her.',
  }),
  Object.freeze({
    id: 'schritt-ohne-werkzeug-ohne-grund',
    pruefer: 'pruefe-betriebskette',
    was: 'Ein Schritt des Betriebs, für den es kein Werkzeug gibt und keinen Grund',
    datei: 'shop/src/betriebskette.js',
    art: 'ersetzen',
    // Der Schlüssel wird umbenannt statt der Text gekürzt: Das bleibt gültiges
    // JavaScript und entspricht dem Fall, den es zu finden gilt — ein Eintrag,
    // dessen Begründung nicht dort steht, wo die Prüfung sie sucht.
    suchen: '    warumOhneWerkzeug: \'Ein Vorgang in der Welt',
    ersetzen: '    warumOhneWerkzeugX: \'Ein Vorgang in der Welt',
    erwartet: /ohne-werkzeug-ohne-grund/,
    warum: 'Der ganze Ertrag dieser Liste ist die Unterscheidung zwischen einer Lücke mit '
      + 'Grund und einer Lücke ohne. Fällt der Grund weg, ist die Liste eine Aufzählung von '
      + 'Wünschen — und der Auftraggeber liest daraus, dass hier Arbeit aussteht, wo eine '
      + 'Weisung gilt.',
  }),
  Object.freeze({
    id: 'abzweig-ins-leere',
    pruefer: 'pruefe-betriebskette',
    was: 'Ein Abzweig, der von einem Schritt abgeht, den es in der Kette nicht gibt',
    datei: 'shop/src/betriebskette.js',
    art: 'ersetzen',
    suchen: '    ab: \'posteingang\',',
    ersetzen: '    ab: \'posteingangX\',',
    erwartet: /abzweig-ins-leere/,
    warum: 'Ein Abzweig ist nur so viel wert wie die Stelle, an der er abgeht. Zeigt er ins '
      + 'Leere, liest der Betreiber, die Absage gehöre irgendwohin — und sucht sie an einem '
      + 'Punkt des Ablaufs, an dem sie nie entsteht.',
  }),
  Object.freeze({
    id: 'stufe-ohne-platz',
    pruefer: 'pruefe-betriebskette',
    was: 'Das Werkzeug kann eine Stufe, die in der Karte des Betriebs nicht vorkommt',
    datei: 'shop/src/betriebskette.js',
    art: 'ersetzen',
    // Mutiert wird die Karte und nicht das Werkzeug: Eine Stufe aus
    // `bin/vorgang.mjs` zu entfernen hielte die beiden Seiten wieder in
    // Übereinstimmung — und bewiese nichts.
    suchen: '    werkzeug: \'npm run vorgang -- --stufe absage\',',
    ersetzen: '    werkzeug: \'npm run vorgang -- --stufe mahnung\',',
    erwartet: /stufe-ohne-platz/,
    warum: 'Genau der Zustand vom 10. September: `bin/vorgang.mjs` bekam die Stufe `absage`, '
      + 'und die Karte des Betriebs meldete weiter, es sei alles in Ordnung. Eine Liste, die '
      + 'nur sich selbst gegen sich selbst hält, bleibt grün, während die Wirklichkeit '
      + 'davonläuft.',
  }),
  Object.freeze({
    id: 'methodenaufruf-als-testfall',
    pruefer: 'pruefe-tests',
    was: 'Der Prüfer hält `muster.test(`…`)` für die Erklärung eines Testfalls',
    datei: 'shop/bin/testpruefung.mjs',
    art: 'ersetzen',
    suchen: '  const muster = /(?<![.\\w$])test\\(',
    ersetzen: '  const muster = /\\btest\\(',
    erwartet: /nicht lesbar/,
    warum: 'Der Zustand bis zum 11. September: Eine Wortgrenze steht auch zwischen dem Punkt '
      + 'und dem Namen. Der Prüfer las jeden Aufruf von `RegExp.prototype.test` mit einem '
      + 'Schablonentext als Testfall, nahm dessen Inhalt als Namen und suchte einen Rumpf, den '
      + 'es nicht gibt. Zwei solche Zeilen standen im Bestand; eine davon galt seit Wochen als '
      + 'geprüfter Testfall. Ein Prüfer, der eine Zeile prüft, die es nicht gibt, verdeckt die, die es gibt.',
  }),
  Object.freeze({
    id: 'haken-ohne-schnelllauf',
    pruefer: 'pruefe-haken',
    was: 'Der Haken ruft den Schnelllauf nicht mehr auf',
    datei: 'shop/haken/pre-commit',
    art: 'ersetzen',
    suchen: 'if ! node "$WURZEL/shop/bin/schnelllauf.mjs"; then',
    ersetzen: 'if false; then',
    // Der Haken selbst ist eine Quelldatei: Wer ihn anfasst, macht das
    // Erzeugnis veraltet, und der Hakenprüfer weigert sich dann, bevor er
    // irgendetwas über den Haken sagt. Ohne diesen Bau meldete die Probe
    // `haken-sperrt-immer` und hätte nur bewiesen, dass die Frischeprüfung
    // wirkt.
    baueVorher: true,
    erwartet: /haken-ruft-nicht/,
    warum: 'Gate 38 steht und fällt mit dieser einen Zeile. Fällt sie weg, laufen wieder vier '
      + 'von fünfundfünfzig Prüfern vor einem Commit — und das Register in `src/haken.js` sagt '
      + 'weiter, es seien dreiundvierzig mehr. Ein Register, das der Haken nicht einlöst, ist '
      + 'schlimmer als keines: Es sagt, es sei geprüft.',
  }),
  Object.freeze({
    id: 'grund-ohne-pruefer',
    pruefer: 'test',
    was: 'Eine Ausnahme vom Haken zeigt auf einen Prüfer, den es nicht gibt',
    datei: 'shop/src/haken.js',
    art: 'ersetzen',
    suchen: "    pruefer: 'pruefe-lesbar', sekunden: 13.8,",
    ersetzen: "    pruefer: 'pruefe-lesbarkeit', sekunden: 13.8,",
    erwartet: /grund-ohne-pruefer/,
    warum: 'Ein Grund, der ins Leere zeigt, deckt keinen Prüfer — er lässt einen ungedeckt. '
      + 'Der gemeinte Prüfer liefe dann still im Schnelllauf mit, was hier zufällig gutginge; '
      + 'bei einer teuren Probe wäre es der Commit, der plötzlich eine halbe Minute braucht '
      + 'und niemand weiß warum.',
  }),
  Object.freeze({
    id: 'weigerung-sperrt-den-commit',
    pruefer: 'schnelllauf',
    was: 'Der Schnelllauf hält eine Weigerung für einen Fund',
    datei: 'shop/bin/schnelllauf.mjs',
    art: 'ersetzen',
    suchen: '  if (e.status === 2) {',
    ersetzen: '  if (e.status === 22) {',
    erwartet: /pruefe-gebinde/,
    warum: 'Ausgang 2 heißt: Dem Prüfer fehlt die Grundlage. `pruefe-gebinde` kann seit dem '
      + 'Verlust von `preise/poschacher-positionen.csv` nichts messen und wird das auch nicht '
      + 'wieder können, solange die Datei fehlt. Wer die Weigerung wie einen Fund behandelt, '
      + 'sperrt jeden Commit dieses Bestandes für immer.',
  }),
  Object.freeze({
    id: 'freibrief-ohne-hauptwort',
    pruefer: 'pruefe-punkte',
    was: 'Der Freibrief für Gate-Nummern liest die Zahl ohne ihr Hauptwort',
    datei: 'shop/src/punktezahlen.js',
    art: 'ersetzen',
    suchen: '    form: /\\bGate (\\d+)\\b/g,',
    ersetzen: '    form: /\\bGatter (\\d+)\\b/g,',
    erwartet: /zahl-ohne-eintrag/,
    warum: 'Bis zum 11. September standen hier fünf Gate-Nummern als bloße Ziffernfolgen, und '
      + 'seit Gate 34 war der Prüfer rot. Die Form deckt die Zahl nur neben ihrem Hauptwort — '
      + 'trifft das Hauptwort nicht mehr, ist jede Gate-Nummer wieder meldepflichtig, und das '
      + 'ist genau das Verhalten, das den Freibrief von einer Blankovollmacht unterscheidet.',
  }),
  Object.freeze({
    id: 'musterausfuhr-nicht-eingeordnet',
    pruefer: 'pruefe-umschreibung',
    was: 'Eine Musterausfuhr der Kundentexte steht in keiner Einordnung',
    datei: 'shop/src/umschreibung.js',
    art: 'ersetzen',
    suchen: "    modul: 'quellenstempel', ausfuhr: 'QUELLENSTEMPEL', behauptung: false,",
    ersetzen: "    modul: 'quellenstempelchen', ausfuhr: 'QUELLENSTEMPEL', behauptung: false,",
    erwartet: /regel-nicht-eingeordnet/,
    warum: 'Genau der Zustand, in dem dieser Prüfer vom 25. August bis zum 11. September rot '
      + 'stand: drei Musterausfuhren ohne Einordnung, siebzehn Tage lang, und kein Commit hat '
      + 'es aufgehalten. Ein Register über die Reichweite, das nicht jede Regel kennt, hat die '
      + 'Lücke, die es misst — eine Ebene höher.',
  }),
  Object.freeze({
    id: 'schaufenster-ohne-aussagen',
    pruefer: 'pruefe-schaufenster',
    was: 'Eine Beschreibung, deren Zahlen stimmen und deren Sätze überholt sind',
    datei: 'shop/src/schaufenster.js',
    art: 'ersetzen',
    suchen: "      gilt: messwerte.bestellwegGebaut,",
    ersetzen: "      gilt: false,",
    erwartet: /aussage-fehlt|aussage-ueberholt|Bestellweg gebaut/,
    warum: 'Am Abend des 4. September meldete der Prüfer „Alle 32 Kennzahlen stimmen" — und in '
      + 'derselben Beschreibung stand, der Shop nehme keine Bestellung entgegen, sechs Runden '
      + 'nach Gate 26. Ein Zahlenwerk, das stimmt, macht aus einem überholten Satz keinen '
      + 'richtigen. Diese Mutation dreht den gemessenen Zustand um und verlangt, dass die '
      + 'Beschreibung daran gemessen wird und nicht an der Erinnerung.',
  }),
  Object.freeze({
    id: 'befund-von-vorgestern',
    pruefer: 'test',
    was: 'Ein Befund, der den Zustand von vorgestern beschreibt',
    datei: 'shop/src/startklar.js',
    art: 'ersetzen',
    suchen: '  const wegbefund = (weg.moeglich === false && schalter.fehlend.length)',
    ersetzen: '  const wegbefund = (false && weg.moeglich === false && schalter.fehlend.length)',
    erwartet: /gebaut und ausgeschaltet|nichts gebaut oder nur nichts geschaltet/,
    warum: 'Der Punkt meldete „die Oberfläche schickt nichts ab; die Kasse rechnet und erzeugt '
      + 'einen Anfragetext zum Kopieren" — den Satz eines Shops, für den nichts gebaut ist. '
      + 'Gebaut ist seit dem 4. September alles; es fehlen zwei Einträge in der Betreiberdatei. '
      + 'Ein Befund, der die Vergangenheit beschreibt, ist eine Falschauskunft, auch wenn er in '
      + 'die vorsichtige Richtung irrt: Er hätte den Auftraggeber glauben lassen, hier stehe '
      + 'Arbeit aus.',
  }),
  Object.freeze({
    id: 'bereitschaft-liest-die-halbe-oberflaeche',
    pruefer: 'test',
    was: 'Eine Bereitschaftsliste, die nur die Hälfte dessen liest, was ausgeliefert wird',
    datei: 'shop/src/bestellwegbau.js',
    art: 'ersetzen',
    suchen: '  return aktiv ? `${grund}\\n${lies(ABSENDEDATEI)}` : grund;',
    ersetzen: '  return grund;',
    erwartet: /ausgelieferte Oberfläche trägt den Absendeweg/,
    warum: 'Genau der Zustand vom 4. September, abends: `npm run startklar` las `shop-ui.js` '
      + 'und entschied daran den ersten Punkt — während das Absenden am Nachmittag in eine '
      + 'Datei daneben gezogen war. Vier Runden Bestellweg, und die Bereitschaftsliste sagte '
      + 'auch mit vollständig beantworteter Betreiberdatei weiter, es gebe keinen.',
  }),
  Object.freeze({
    id: 'formular-erhebt-zu-wenig',
    pruefer: 'bestellprobe',
    was: 'Ein Bestellformular, aus dessen Angaben kein Angebot werden kann',
    datei: 'shop/src/bestellfelder.js',
    art: 'ersetzen',
    suchen: "    name: 'uid',",
    ersetzen: "    name: 'uidX',",
    erwartet: /Felder ohne Wert in der Probe|wird kein Angebot/,
    warum: 'Genau der Zustand vom 4. September: Das Formular sammelte drei Felder, '
      + '`pruefeBestelldaten` verlangt acht. Die Bestellung kommt an, ist abgelegt — und '
      + '`npm run vorgang` weist sie ab. Ohne UID und Unternehmerbestätigung gibt es nach '
      + 'Gate 7 keine Nettorechnung, und darauf ruht das ganze Modell.',
  }),
  Object.freeze({
    id: 'ablage-im-webverzeichnis',
    pruefer: 'bestellprobe',
    was: 'Ein Bestelljournal, das unter einer URL erreichbar ist',
    datei: 'shop/bestellung.php',
    art: 'ersetzen',
    suchen: "const ABLAGEORDNER = __DIR__ . '/../bestellungen';",
    ersetzen: "const ABLAGEORDNER = __DIR__ . '/bestellungen';",
    erwartet: /Ablage liegt im Webverzeichnis/,
    warum: 'Ein Zeichen Unterschied — `/../` gegen `/` — und das Journal mit Namen, '
      + 'Anschriften und Positionslisten liegt im ausgelieferten Verzeichnis. Es wäre dann '
      + 'kein Journal, sondern eine Veröffentlichung, und keine Prüfung des Bestandes außer '
      + 'dieser sieht je das fertig ausgelieferte Verzeichnis mit eingeschaltetem Bestellweg.',
  }),
  Object.freeze({
    id: 'schlafendes-fetch-im-buendel',
    pruefer: 'pruefe-datenschutz',
    was: 'Ein Absendeweg im Bündel, während die Rechtsseite sagt, es gebe keinen',
    /**
     * **Nachgezogen am 4. September, abends.** Die Mutation saß auf einer
     * Zeile in `bin/website.mjs`, die es nicht mehr gibt: Das Zusammensetzen
     * der Oberfläche ist nach `src/bestellwegbau.js` gezogen, damit
     * `npm run startklar` dieselbe Oberfläche misst, die ausgeliefert wird.
     *
     * Der Läufer hat es gemeldet — „Suchtext nicht gefunden" —, und das ist
     * genau der Zweck des Feldes: Eine Gegenprobe, deren Mutation ins Leere
     * geht, prüft nichts und sähe ohne diese Meldung aus wie eine bestandene.
     */
    datei: 'shop/src/bestellwegbau.js',
    art: 'ersetzen',
    suchen: '  return aktiv ? `${grund}\\n${lies(ABSENDEDATEI)}` : grund;',
    ersetzen: '  return `${grund}\\n${lies(ABSENDEDATEI)}`;',
    baueVorher: true,
    erwartet: /warenkorb-im-browser/,
    warum: 'Die Datenschutzseite sagt, solange der Bestellweg aus ist, dass nichts an den '
      + 'Server übertragen wird — und `pruefe-datenschutz` misst das am **Bündel**. Diese '
      + 'Mutation packt `shop-bestellen.js` mit dem einzigen `fetch` des Shops hinein, obwohl '
      + 'der Weg aus ist. Käme sie durch, ruhte die Zusage nicht mehr auf dem Code, sondern '
      + 'auf einer Bedingung, die zur Laufzeit nie wahr wird — und das kann kein Prüfer messen.',
  }),
  Object.freeze({
    id: 'leser-ohne-frischepruefung',
    pruefer: 'pruefe-erzeugnis',
    was: 'Ein Prüfer, der das Erzeugnis liest und nicht fragt, von wann es ist',
    datei: 'shop/bin/geheimnispruefung.mjs',
    art: 'ersetzen',
    suchen: "  const stand = frischebefund(wurzel, 'ausgabe/site');",
    ersetzen: "  const stand = { frisch: true };",
    erwartet: /eintrag-ohne-pruefung/,
    warum: 'Genau der Zustand vom 4. September: Sieben von neun Werkzeugen lasen das gebaute '
      + 'Erzeugnis, ohne zu fragen, ob es noch zur Quelle passt. Bei diesem hier wiegt es am '
      + 'schwersten — er misst, ob aus den veröffentlichten Verkaufspreisen die '
      + 'Einkaufspreise zurückzurechnen sind, und meldete das über einem veralteten Bau über '
      + 'die Seiten von gestern.',
  }),
  Object.freeze({
    id: 'abwicklername-im-kundennamen',
    pruefer: 'pruefe-geheimnis',
    was: 'Der interne Name eines Zahlwegs, der beim Kunden landet',
    datei: 'shop/src/zahlung.js',
    art: 'ersetzen',
    suchen: "    kundenname: 'Kreditkarte (EU-Karte)',\n    prozent: 0.014,",
    ersetzen: "    kundenname: 'Kreditkarte (EU-Karte, Listenpreis Stripe)',\n    prozent: 0.014,",
    erwartet: /internes-wort-im-kundennamen/,
    baueVorher: true,
    warum: 'Bis zum 5. September stand `pruefe-geheimnis` in `OHNE_GEGENPROBE`, und der '
      + 'Grund stimmte: Seine drei Durchgänge suchten Einkaufspreise, und eine Mutation '
      + 'hätte heißen müssen, einen davon in eine öffentliche Datei zu schreiben — die eine '
      + 'Datei, die diese Arbeit nicht anfassen darf. Durchgang 4 sucht keine Beträge, '
      + 'sondern Aussagen über Beträge, und der lässt sich gefahrlos gegenproben. Diese '
      + 'Mutation stellt genau den Zustand her, der bis heute ausgeliefert wurde: den '
      + 'Abwicklernamen im Kundentext der AGB-Seite, für einen Anbieter, der nicht gewählt '
      + 'ist. Der zweite Kartenweg trägt denselben Kundennamen; deshalb steht die '
      + 'Gebührenzeile im Suchtext, sonst träfe er zweimal.',
  }),
  Object.freeze({
    id: 'zweite-gitignore-uebersehen',
    pruefer: 'pruefe-ablage',
    was: 'Eine zweite .gitignore, die die Sperre aufhebt, ohne dass es auffällt',
    datei: 'shop/.gitignore',
    art: 'anhaengen',
    text: '\n!ablage/\n',
    erwartet: /ort-nicht-gesperrt/,
    warum: 'Gefunden von `npm run reichweite`: `shop/.gitignore` öffnete kein Prüfer. Sie '
      + 'enthält heute eine belanglose Zeile — aber eine `.gitignore` in einem Unterordner '
      + 'kann eine Regel der Wurzel mit `!muster` **aufheben**, und genau die Wurzelregel '
      + 'hält das Journal mit Namen, Anschriften und Beträgen aus dem öffentlichen '
      + 'Verzeichnis. Ein Prüfer, der nur die Wurzel liest, sähe die Aufhebung nicht und '
      + 'meldete die Sperre als bestehend. Diese Mutation hebt sie auf und verlangt, dass es '
      + 'auffällt.',
  }),
  Object.freeze({
    id: 'ablageort-ohne-sperre',
    pruefer: 'pruefe-ablage',
    was: 'Ein Ablageort, den die .gitignore nicht kennt',
    datei: 'shop/src/ablageort.js',
    art: 'ersetzen',
    suchen: "export const ABLAGEORT = 'ablage';",
    ersetzen: "export const ABLAGEORT = 'akte';",
    erwartet: /ort-nicht-gesperrt/,
    warum: 'Der Prüfer soll genau eines können: sagen, dass der Ordner, in den die Ablage '
      + 'schreibt, nicht von der .gitignore gedeckt ist. Diese Mutation verschiebt den Ordner '
      + 'unter einen Namen, den keine Sperre kennt — dann liegt das erste Journal mit Namen, '
      + 'Anschriften und Beträgen von Kunden beim nächsten `git add -A` im öffentlichen '
      + 'Verzeichnis, und die Geschichte behält es.',
  }),
  Object.freeze({
    id: 'liegen-gebliebene-mutation-uebersehen',
    pruefer: 'test',
    was: 'Eine absichtlich falsche Datei, die niemandem mehr auffällt',
    datei: 'shop/src/mutationsschutz.js',
    art: 'ersetzen',
    suchen: "        regel: 'mutation-liegen-geblieben',",
    ersetzen: "        regel: 'zettel-ohne-mutation',",
    erwartet: /Befund trennt|mutation-liegen-geblieben/,
    warum: 'Der Unterschied zwischen den beiden Meldungen ist der ganze Zweck des Zettels: '
      + 'Ein abgebrochener Lauf nach dem Zurückschreiben ist harmlos, eine liegen gebliebene '
      + 'Mutation steht als absichtlich falscher Code im Bestand — und dieser Loop committet '
      + 'ohne Rückfrage. Fallen beide Fälle zusammen, meldet der Prüfer den harmlosen Wortlaut '
      + 'über den gefährlichen Zustand.',
  }),
  Object.freeze({
    id: 'eigene-uid-ungeprueft',
    pruefer: 'test',
    was: 'Eine eigene UID, die dasteht und nicht stimmt',
    datei: 'shop/src/betreiberform.js',
    art: 'ersetzen',
    suchen: "    pruefe: (wert) => uidPruefzifferStimmt(String(wert).toUpperCase().replace(/\\s/g, '')),",
    ersetzen: '    pruefe: (wert) => String(wert).length > 0,',
    erwartet: /uid|falsch getippte UID/i,
    warum: 'Die eigene UID geht nach § 11 Abs 1 Z 3 UStG auf jede Rechnung über 400 € und '
      + 'gefährdet bei einem Tippfehler den Vorsteuerabzug des Kunden. Die Prüfziffernrechnung '
      + 'gibt es seit dem 27. August — sie bewachte bis zum 4. September nur die UID des '
      + 'Kunden. Diese Mutation nimmt sie wieder heraus und verlangt, dass es auffällt.',
  }),
  Object.freeze({
    id: 'stueckliste-verzaehlt-sich',
    pruefer: 'pruefe-systemlisten',
    was: 'Eine Stückliste, die über sich selbst falsch rechnet',
    datei: 'shop/inhalte/system/kellerwand-perimeter.md',
    art: 'ersetzen',
    suchen: 'Drei der sieben Positionen führen wir nicht',
    ersetzen: 'Fünf der sieben Positionen führen wir nicht',
    erwartet: /kellerwand|nicht-gefuehrt-zahl/,
    warum: 'Genau der Fall vom 5. September, nur andersherum: Die Seite versprach im Vorspann '
      + '„fünf davon aus unserem Sortiment" und schrieb zwanzig Zeilen weiter „Drei der sieben '
      + 'Positionen führen wir nicht" — und die fünfte war ausgerechnet die Position, die die '
      + 'Tabelle als „nicht im Sortiment" kennzeichnet und die zugleich unter „wird oft '
      + 'vergessen" steht. Eine Stückliste, die über sich selbst falsch rechnet, ist die eine '
      + 'Sorte Text, bei der ein Fehler direkt auf der Baustelle ankommt.',
  }),
  Object.freeze({
    id: 'abgeloeste-zahl-im-quelltext',
    pruefer: 'pruefe-leitzahlen',
    was: 'Eine abgelöste Leitzahl im Quelltext, wo sie nicht nur falsch dasteht, sondern rechnet',
    datei: 'shop/src/werbewirkung.js',
    art: 'anhaengen',
    text: '\n// Der nötige Monatsumsatz liegt bei 45.356 €.\n',
    erwartet: /noetiger-monatsumsatz/,
    warum: 'Bis zum 5. September durchsuchte `pruefe-leitzahlen` die Akte und die Shoptexte, '
      + 'ausdrücklich nicht den Quelltext. So ist die Schwelle „33 von 33" entstanden: Das '
      + 'Register kannte die 32 und wusste sogar, wann die 33 abgelöst wurde — es hat nur nie '
      + 'dort gesucht, wo sie stand. In einem Dokument steht eine abgelöste Zahl falsch da; im '
      + 'Quelltext rechnet sie. Diese Mutation legt eine abgelöste Zahl in eine Quelldatei, die '
      + 'in keinem Ausnahmeverzeichnis steht.',
  }),
  Object.freeze({
    id: 'abgeschriebene-schwelle',
    pruefer: 'test',
    was: 'Eine Schwelle, die als Zahl im Quelltext steht statt aus ihrer Liste zu kommen',
    datei: 'shop/src/kennzahlen.js',
    art: 'ersetzen',
    suchen: '      einheit: `von ${begriffe}`,\n      schwelle: begriffe,',
    ersetzen: "      einheit: 'von 33',\n      schwelle: 33,",
    erwartet: /Schwelle|suchvolumen/i,
    warum: 'Der Zustand bis zum 5. September: „Keywords mit gemessenem Suchvolumen — mindestens '
      + '33 von 33" stand als Zahl im Quelltext, während die Messliste 32 Begriffe führt. Ein '
      + 'Schwellendokument, dessen ganze Begründung lautet, Schwellen dürften sich nicht '
      + 'verschieben — und eine seiner Schwellen war eine abgeschriebene Zahl, die sich längst '
      + 'verschoben hatte. Der Testfall daneben heißt „Die Schwellen sind gerechnet, nicht '
      + 'eingetragen" und prüfte eine von zehn. Diese Mutation schreibt die Zahl wieder hinein.',
  }),
  Object.freeze({
    id: 'die-artikelseite-verschweigt-ihr-system',
    pruefer: 'pruefe-systemtreue',
    was: 'Eine Artikelseite, auf der die Schicht ausgewählt wird, ohne ihr System',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: '  if (e.schicht && e.system) {',
    ersetzen: '  if (false && e.schicht && e.system) {',
    erwartet: /artikelseite-ohne-system/,
    baueVorher: true,
    warum: 'Der Zustand vom 9. September, morgens: Die Systemtreue stand in der Kasse (seit dem '
      + '8.), in `llms.txt` und auf einer Wissensseite (seit dem 9.) — und auf **keiner** der 46 '
      + 'Artikelseiten. Das ist die Fläche, auf der die Schicht ausgewählt wird, und das Ziel '
      + 'der bezahlten Anzeigen: Die Warnung erreichte die Maschine und den Warenkorb, nicht die '
      + 'Stelle, an der entschieden wird. Die Mutation schaltet den abgeleiteten Satz ab und '
      + 'verlangt, dass der Prüfer jede stumme Schicht nennt.',
  }),
  Object.freeze({
    id: 'das-sinnbild-zeigt-ein-mass-das-es-nicht-gibt',
    pruefer: 'pruefe-sinnbilder',
    was: 'Ein Sinnbild auf der Startseite mit einem Maß, das kein Artikel der Gruppe hat',
    datei: 'shop/src/bilder.js',
    art: 'ersetzen',
    suchen: "  Mauerwerk: 'Ziegel N+F 23,8 cm',",
    ersetzen: "  Mauerwerk: 'Ziegel N+F 25 cm',",
    erwartet: /sinnbildmass-ohne-artikel/,
    warum: 'Der Zustand vom 9. September, morgens: Die Kachel der Warengruppe Mauerwerk auf der '
      + 'Startseite zeigte „Ziegel N+F 25 cm". Geführt wird in dieser Gruppe genau ein Artikel, '
      + 'mit 23,8 cm. Bei Mauersteinen ist die Wandstärke die entscheidende Eigenschaft — die '
      + 'Gruppenseite sagt selbst, Steinformat und Wandstärke kämen aus der Planung —, und ein '
      + 'rundes Maß auf der Seite, die jeder zuerst sieht, liest sich als Angebot. Die Mutation '
      + 'setzt das runde Maß zurück und verlangt, dass der Prüfer es nennt.',
  }),
  Object.freeze({
    id: 'die-paketgroesse-die-es-nicht-gibt',
    pruefer: 'pruefe-zahlen',
    was: 'Eine Paketgröße auf einer Inhaltsseite, die kein Artikel im Katalog hat',
    datei: 'shop/inhalte/wissen/xps-oder-eps.md',
    art: 'ersetzen',
    suchen: 'Fassaden-EPS kommt in 0,5 m² je Paket',
    ersetzen: 'Fassaden-EPS kommt in 0,6 m² je Paket',
    erwartet: /paketgroesse-ohne-artikel/,
    warum: 'Der Zustand vom 9. September, morgens: Die Seite gab den Bestellhinweis „die '
      + 'Paketgröße hängt an der Stärke — dünne Platten kommen in mehr Quadratmetern je Paket '
      + 'als dicke". Gegen `mengenschritt` gehalten, die Funktion, mit der die Kasse auf volle '
      + 'Pakete aufrechnet, ist beides falsch: EPS hat 0,5 m² bei 2 wie bei 5 cm, XPS 0,75 m² '
      + 'bei 30 wie bei 100 mm — die Größe hängt an der Reihe, und die dünnste Platte hat das '
      + 'kleinere Paket. Es ist die Seite, die ein Kunde beim Plattenvergleich liest. Die '
      + 'Mutation verschiebt die Zahl auf einen Wert, den kein Artikel hat, und verlangt, dass '
      + 'der Prüfer ihn nennt.',
  }),
  Object.freeze({
    id: 'die-gruppenseite-verspricht-eine-palette',
    pruefer: 'pruefe-sperrgut',
    was: 'Eine Gruppenseite, die eine Palette zusagt, wo keiner ihrer Artikel palettiert ist',
    datei: 'shop/inhalte/gruppen/moertel.md',
    art: 'ersetzen',
    suchen: 'Wir rechnen Mörtel **nicht** als palettierte Ware ab: Auf die drei Positionen',
    ersetzen: 'Mörtel wird palettenweise geliefert. Auf die drei Positionen',
    erwartet: /lieferaussage-ohne-einstufung/,
    baueVorher: true,
    warum: 'Der Zustand vom 9. September, morgens: Unter der Überschrift „Bestellhinweis" '
      + 'stand „Mörtel wird palettenweise geliefert", und alle drei Mörtelartikel sind '
      + '`sperrgut: false` — auf keinen fällt ein Kranhub an, verkauft wird sackweise. Die '
      + 'eine Gruppenseite mit der stärksten Palettenaussage war die einzige Gruppe, in der '
      + 'kein Artikel als palettiert gilt; der Kunde las eine Zusage, der die Rechnung '
      + 'widerspricht. Sieben Gruppentexte sind von Hand geschrieben, und keiner wurde je '
      + 'gegen den Katalog gehalten. Die Mutation setzt den alten Satz zurück und verlangt, '
      + 'dass der Prüfer den Widerspruch nennt.',
  }),
  Object.freeze({
    id: 'palettiert-ohne-herkunft',
    pruefer: 'pruefe-sperrgut',
    was: 'Eine maschinenlesbare Auskunft, die die Kranentladung nennt und ihre Herkunft nicht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "      + 'Die Angabe „palettiert\" ist geschätzt: Sie folgt aus der Warengruppe und nicht aus '\n"
      + "      + 'einer Angabe des Lieferanten. Sie entscheidet, ob die Kranentladung anfällt; wo ein '\n"
      + "      + 'Positionsgewicht dagegenspricht, steht es auf der Artikelseite. '",
    ersetzen: "      + ''",
    erwartet: /llms\.txt/,
    baueVorher: true,
    warum: 'Der Zustand vom 5. September, morgens: Die Artikelseite nannte die Herkunft der '
      + 'Einstufung seit dem Vortag, `llms.txt` sagte weiter nur „· palettiert". Eine Auskunft, '
      + 'die an einer Stelle qualifiziert ist und an der maschinenlesbaren blank steht, wird von '
      + 'Assistenten als Tatsache weitergegeben — und diese Einstufung kostet den Kunden 7,50 € '
      + 'je Position. Die Mutation nimmt den Satz wieder heraus.',
  }),
  Object.freeze({
    id: 'werkzeug-das-nicht-laedt',
    pruefer: 'pruefe-lesbar',
    was: 'Eine Klammer zu viel in einem Werkzeug, das der Regellauf nicht ausführt',
    datei: 'shop/bin/shopprobe.mjs',
    art: 'anhaengen',
    text: '\n}\n',
    erwartet: /shopprobe/,
    warum: 'Genau der Zustand vom 4. auf den 5. September: `bin/shopprobe.mjs` und '
      + '`bin/oberflaechenprobe.mjs` trugen je eine geschweifte Klammer zu viel, aus der Runde, '
      + 'die den Frischeschutz eingebaut hat. Fünfzehn Stunden und elf Gesamtläufe lang grün — '
      + '`npm run alles` holt die Browserproben nicht ab, weil jede einen Chromium-Start '
      + 'kostet. Der einzige Schutz davor, dass sie verrotten, war ein Schalter, den niemand '
      + 'umlegt. Diese Mutation setzt die Klammer wieder ein.',
  }),
  Object.freeze({
    id: 'flaeche-nur-im-verzeichnis',
    pruefer: 'pruefe-sperrgut',
    was: 'Eine Fläche, die die Kranentladung nennt und keine Prüfung erreicht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    // `alle: true`: `lieferung.html` nennt die Herkunft zweimal — in der
    // FAQ-Antwort und im Absatz unter der Preistafel. Eine Mutation, die nur
    // eine der beiden trifft, lässt die Datei zu Recht gedeckt.
    suchen: 'folgt aus der Warengruppe und nicht aus einer Angabe des Lieferanten',
    ersetzen: 'steht in der Preistafel',
    alle: true,
    erwartet: /lieferung\.html/,
    baueVorher: true,
    warum: 'Bis zum 5. September abends nahm `flaechenbefund` seine Flächen aus einem '
      + 'handgeführten Verzeichnis von zwei Dateien, und der Bericht meldete darüber '
      + '„Gebaute Flächen mit dem Wort 2" — die Länge des Verzeichnisses als Ergebnis der '
      + 'Prüfung. Gemessen sind es 31, und `lieferung.html` war eine davon: die Seite, auf '
      + 'der der Betrag steht und auf die jede Artikelseite verweist. Diese Mutation nimmt '
      + 'die Herkunftsangabe dort wieder heraus und verlangt, dass die gesuchte — nicht '
      + 'aufgezählte — Fläche es meldet.',
  }),
  Object.freeze({
    id: 'sperrgut-ohne-widerspruch',
    pruefer: 'pruefe-sperrgut',
    was: 'Ein Widerspruch zwischen belegtem Gewicht und Kranentladung, den niemand begründet',
    datei: 'shop/src/sperrguteinstufung.js',
    art: 'ersetzen',
    suchen: "    sku: 'POS-10115',",
    ersetzen: "    sku: 'POS-99999',",
    erwartet: /POS-10115|POS-99999/,
    warum: 'Auf der Seite des Kanalbogens stehen „Gewicht 0,285 kg je Stück, aus dem '
      + 'Lieferschein" und „Palettierte Ware. Sie wird mit dem Kran entladen" übereinander, '
      + 'seit es die Seite gibt. Die Einstufung stammt aus der Warengruppe und kostet den '
      + 'Kunden 7,50 € je Position. Diese Mutation zieht den Grund von einem der vier Fälle ab '
      + 'und verlangt, dass der Widerspruch wieder gemeldet wird — und dass zugleich der '
      + 'Eintrag ohne Artikel auffällt.',
  }),
  Object.freeze({
    id: 'abgeloeste-zahl-auf-der-seite',
    pruefer: 'pruefe-leitzahlen',
    was: 'Eine abgelöste Leitzahl auf einer ausgelieferten Seite',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "Geliefert wird im Umkreis, nicht in ganz Österreich: Das ist der Grund, warum die Rechnung aufgeht.",
    ersetzen: "Der nötige Monatsumsatz liegt bei 45.356 €. Geliefert wird im Umkreis, nicht in ganz Österreich.",
    erwartet: /index\.html|45\.?356/,
    baueVorher: true,
    warum: 'Die fünf Bestände des Leitzahlprüfers deckten alles ab, was **geschrieben** ist — '
      + 'und nichts, was beim Bauen **entsteht**. Die Startseite zeigt „39 von 46" und „26,7 % '
      + 'im Median", die Lieferseite „75,50 €": keine dieser Zahlen steht als Zahl in einer '
      + 'Quelldatei. Ein Bestand, der nur die Quellen liest, findet jede abgeschriebene Zahl '
      + 'und keine gerechnete. Beim Aufnehmen der Ausgabe waren es null Meldungen über 83 '
      + 'Dateien; diese Mutation stellt den Fall her, für den der Bestand da ist — die '
      + 'Kartenzahl 45.356 €, abgelöst am 1. September, auf der Seite, die jeder zuerst sieht.',
  }),
  Object.freeze({
    id: 'startseite-verspricht-den-einkaufspreis',
    pruefer: 'pruefe-seiten',
    was: 'Eine Seite, die behauptet, der Kunde zahle den Einkaufspreis des Baumeisters',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "}Der Einkauf eines Baumeisterbetriebs ist unsere Grundlage — deshalb liegen",
    ersetzen: "}Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — deshalb liegen",
    erwartet: /zahle dasselbe wie der Baumeister|Aufschlag/,
    baueVorher: true,
    warum: 'Die Ersetzung ist keine erfundene Verschlechterung, sondern der Wortlaut, der bis '
      + 'zum 5. September abends im ersten Satz unter der Hauptüberschrift der Startseite '
      + 'stand — auf der Seite, die jeder zuerst sieht. Dieselbe Behauptung war am selben Tag '
      + 'aus der WDVS-Anzeige entfernt worden, und der Prüfer, der dafür gebaut wurde, las nur '
      + 'die Anzeigen. Über die 81 Seiten gelaufen hätte er außerdem null Treffer gemeldet: '
      + 'Seine Muster kannten „zahlen … Preis", die Gleichsetzung auf der Startseite hängt am '
      + 'Wort „auch". Diese Gegenprobe hält beides wach — den Ort und das Muster.',
  }),
  Object.freeze({
    id: 'kartenseite-ohne-grenze',
    pruefer: 'pruefe-seiten',
    was: 'Eine Seite, auf der man einen Korb füllt, ohne die Grenze zu nennen, an der er abgewiesen wird',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: '  if (!KARTENFLAECHEN.some((merkmal) => html.includes(merkmal))) return html;',
    ersetzen: "  if (!html.includes('class=\"gibtesnicht\"')) return html;",
    erwartet: /Mindestbestellwert nicht/,
    baueVorher: true,
    // **Nachgezogen am 5. September, nachts.** Der Suchtext war die Zeile
    // `if (!html.includes('class="karte"'))`; sie ist beim Einbau der zweiten
    // Korbfläche zu `KARTENFLAECHEN.some(…)` geworden. Der Gegenprobenlauf hat
    // es gemeldet — eine Mutation, die nicht mehr ankommt, prüft nichts.
    warum: 'Der Zustand bis zum 5. September: Der Mindestbestellwert (Gate 25, 250 € netto je '
      + 'Lieferung) stand auf 48 der 81 gebauten Seiten — auf jeder Artikelseite, auf der '
      + 'Lieferseite, in den AGB. Auf **keiner** der Seiten mit Artikelkarten: nicht auf der '
      + 'Startseite mit ihren 46 Karten, nicht auf den sieben Gruppenseiten, nicht auf den vier '
      + 'Systemlisten. Die Gruppenseiten sind die Landeseiten der bezahlten Anzeigen, 4,19 € bis '
      + '8,22 € je Klick. Die Mutation nimmt den Einbau wieder heraus und verlangt, dass die '
      + 'Prüfung am Erzeugnis es meldet — sie misst die gebaute Seite und nicht den Bauer.',
  }),
  Object.freeze({
    id: 'navigation-als-inhalt',
    pruefer: 'test',
    was: 'Navigation, die als eigener Seiteninhalt mitgezählt wird',
    datei: 'shop/src/seitenaehnlichkeit.js',
    art: 'ersetzen',
    suchen: "const CHROM = ['script', 'style', 'svg', 'header', 'footer', 'nav', 'noscript', 'head'];",
    ersetzen: "const CHROM = ['script', 'style', 'svg', 'header', 'footer', 'nav'];",
    erwartet: /Navigation|Inhalt/i,
    warum: 'Der Kommentar über der Funktion sagte seit dem 3. September „Kopf, Fuß, Skript und '
      + 'Querverweise fallen heraus — sie stehen auf jeder Seite gleich und sind Navigation, '
      + 'kein Inhalt". Drei Stück Navigation standen trotzdem drin: der `noscript`-Hinweis mit '
      + 'dreißig wortgleichen Wörtern, der Seitentitel im `head` und die Sprungmarke. Die '
      + 'gemeldeten 62 % waren dadurch zu hoch. Diese Mutation setzt die alte, kürzere Liste '
      + 'wieder ein.',
  }),
  Object.freeze({
    id: 'sperre-ohne-gruenen-fall',
    pruefer: 'pruefe-sperren',
    was: 'Eine Sperre, von der keine Probe zeigt, dass sie je aufmacht',
    datei: 'shop/test/rechtstexteauftrag.test.js',
    art: 'ersetzen',
    suchen: "  assert.equal(f.darf, true, f.gruende.join(' | '));\n"
      + '  assert.deepEqual(f.gruende, []);',
    ersetzen: "  assert.equal(typeof f.darf, 'boolean');",
    erwartet: /darfBeauftragtWerden/,
    warum: 'Genau der Zustand vom 5. September: `darfBeauftragtWerden` wurde von keiner Probe '
      + 'aufgerufen, und `darfVorgangLaufen` nur in der roten Richtung. Sechs Zusicherungen der '
      + 'Form „dieser eine Grund kommt nicht" ergeben keine Aussage darüber, ob eine Sperre '
      + 'aufgeht — sie könnte jeden Auftrag abweisen, und keine Probe merkte es. Diese Mutation '
      + 'nimmt den grünen Fall wieder heraus und lässt die rote Richtung stehen.',
  }),
  Object.freeze({
    id: 'bestaetigung-ohne-konto',
    pruefer: 'test',
    was: 'Eine Auftragsbestätigung, die hinausdarf, ohne ein Konto zu nennen',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: '  if (!bank.vollstaendig) {',
    ersetzen: '  if (false) {',
    erwartet: /Konto/,
    warum: 'Die Regel steht seit dem 30. August in der Datei: Das Angebot darf die Lücke '
      + 'tragen und sichtbar machen, die Bestätigung nicht. Seit dem 4. September trägt die '
      + 'Bestätigung die Bankverbindung — und die Sperre bekam den Betreiber nie zu sehen, '
      + 'prüfte also genau die Lücke nicht, die sie verbietet. Mit der Bestätigung kommt nach '
      + 'Punkt 2 der AGB der Vertrag zustande; ohne Konto ist der Kunde gebunden, soll sofort '
      + 'zahlen und findet auf dem Papier keinen Weg dazu. Diese Mutation macht die Sperre '
      + 'wieder blind.',
  }),
  Object.freeze({
    id: 'iban-ungeprueft',
    pruefer: 'test',
    was: 'Eine IBAN mit Zahlendreher, die dasteht und angenommen wird',
    datei: 'shop/src/bankverbindung.js',
    art: 'ersetzen',
    suchen: '    pruefe: ibanPruefsummeStimmt,',
    ersetzen: '    pruefe: (wert) => String(wert).length > 0,',
    erwartet: /iban/i,
    warum: 'Gate 21 hat Vorkasse ab Start entschieden; die Auftragsbestätigung ist das '
      + 'Dokument, auf das hin der Kunde zahlt. Eine IBAN mit vertauschten Ziffern sieht aus '
      + 'wie eine IBAN, steht vollständig auf dem Papier und geht durch jede reine '
      + 'Anwesenheitsprüfung. Gemerkt würde der Fehler erst, wenn die Ware ausbleibt. Diese '
      + 'Mutation nimmt die Prüfsummenrechnung heraus und verlangt, dass es auffällt.',
  }),
  Object.freeze({
    id: 'gebindeschritt-verlesen',
    pruefer: 'pruefe-gebinde',
    was: 'Ein Gebindeschritt, der aus dem Namen falsch gelesen wird',
    datei: 'shop/src/gebinde.js',
    art: 'ersetzen',
    suchen: "  if (einheit === 'KG') return gebindeKg(artikel.bezeichnung);",
    ersetzen: "  if (einheit === 'KG') return gebindeKg(artikel.bezeichnung) ? 20 : null;",
    erwartet: /passt nicht zu dem, was fakturiert wurde|Schritt 20/,
    warum: 'Der Schritt kommt aus einer Zeichenkette („Putzgrund weiß 25 kg" ergibt 25) und '
      + 'trägt die kleinste Bestellmenge, den Preis je Gebinde, das Aufrunden im Warenkorb, die '
      + 'Frachtschwelle und den Mindestbestellwertsatz auf jeder Artikelseite. Wer aus 25 eine '
      + '20 liest, bekommt bei fakturierten Mengen von 25, 50 und 75 kg drei Abweichungen — '
      + 'genau das stellt diese Mutation her. Ohne die Rechnungsmengen prüft den Wert nichts '
      + 'außer der Zeichenkette, aus der er stammt.',
  }),
  Object.freeze({
    id: 'kuerzel-im-kundentext',
    pruefer: 'pruefe-belege',
    was: 'Das Einheitenkürzel des Lieferanten in der Mengenspalte eines Kundentexts',
    datei: 'shop/src/kundenanfrage.js',
    art: 'ersetzen',
    suchen: '      const menge = anfrageSpalte(`${mengeText} ${einheitText(p.einheit)}`, 14);',
    ersetzen: '      const menge = anfrageSpalte(`${mengeText} ${p.einheit}`, 14);',
    erwartet: /kuerzel-statt-wort/,
    warum: 'Die Ersetzung stellt den Zustand vom 4. September her — nicht im Quelltext, '
      + 'sondern im Text, den der Prüfer sah: `baueKundenanfrage` nahm die Einheitentafel als '
      + 'Aufrufparameter mit Vorgabewert `{}`, die Oberfläche reichte sie herein, '
      + '`bin/belegpruefung.mjs` nicht. Der einzige Prüfer über diesen Text las damit eine '
      + 'Fassung mit „500 KG" und „6 KRT", die es beim Kunden nie gab — und keine Regel konnte '
      + 'anschlagen, weil es keine gab. Diese Gegenprobe verlangt, dass sie es jetzt tut.',
  }),
  Object.freeze({
    id: 'einheitenliste-von-gestern',
    pruefer: 'pruefe-gebinde',
    was: 'Eine Einheitenliste, die den Bestand von gestern festhält',
    datei: 'shop/src/gebinde.js',
    art: 'ersetzen',
    suchen: "export const STUECKEINHEITEN = new Set(['SCK', 'STK', 'EIM', 'KRT', 'DOS', 'RLL']);",
    ersetzen: "export const STUECKEINHEITEN = new Set(['SCK', 'STK', 'PAK', 'EIM', 'KAR', 'ROL']);",
    erwartet: /einheit-ohne-artikel|einheit-unbekannt/,
    warum: 'Die Ersetzung ist keine erfundene Verschlechterung, sondern der Zustand vom '
      + '4. September: `PAK`, `KAR` und `ROL` standen in der Liste und kommen im Katalog nicht '
      + 'vor; `KRT` (3 Artikel), `DOS` (2) und `RLL` (1) kommen vor und fehlten. Folgenlos war '
      + 'das nur, weil `preisJeKilo` außerdem ein Kilogramm im Namen braucht und keiner der '
      + 'sechs eines trägt — der erste Karton mit Gewicht im Namen hätte den Kilopreis still '
      + 'weggelassen. Ein Prüfer, der eine Liste gegen den Bestand hält, muss beide Richtungen '
      + 'sehen: die tote Einheit und die unbekannte.',
  }),
  Object.freeze({
    id: 'beschreibung-als-schablone',
    pruefer: 'pruefe-dubletten',
    was: 'Eine maschinenlesbare Beschreibung, die nur wiederholt, was daneben als Feld steht',
    datei: 'shop/src/maschinenlesbar.js',
    art: 'ersetzen',
    suchen: "  const stand = textZeile(artikel.preisStand ?? '');\n  if (stand) teile.push(`Preisstand ${stand}`);",
    ersetzen: "  const stand = '';\n  if (stand) teile.push(`Preisstand ${stand}`);",
    erwartet: /nichts-eigenes/,
    baueVorher: true,
    warum: 'Bis zum 5. September abends trug die `description` der 46 Artikelseiten nur '
      + 'Bezeichnung, Warengruppe, Verkaufseinheit und einen auf allen identischen Satz zur '
      + 'Umsatzsteuer — und alle vier stehen als `name`, `category` und `valueAddedTaxIncluded` '
      + 'im selben Datensatz daneben. Neun Fassungen über 46 Seiten, unterschieden allein im '
      + 'Wort hinter „Verkaufseinheit". Diese Mutation nimmt den Preisstand wieder heraus; für '
      + 'die Artikel ohne Gebinde im Namen, ohne belegtes Gewicht und ohne Sperrguteinstufung '
      + 'bleibt dann nichts Eigenes übrig, und genau das soll auffallen.',
  }),
  Object.freeze({
    id: 'querverweise-ohne-marke',
    pruefer: 'pruefe-dubletten',
    was: 'Eine Messung, die die Navigation mitzählt und es Inhalt nennt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    // **Zweiter Anlauf.** Der erste suchte `` `<section class="querverweise"> ``
    // — und traf damit den **Kommentar** darüber, nicht die Zeile, die den
    // Abschnitt baut. Die Mutation kam an und bewirkte nichts; der Prüfer
    // meldete zu Recht grün. Dieselbe Familie wie die Rolloutmutation, die im
    // Objektliteral überschrieben wurde.
    suchen: 'teile.push(`<section class="querverweise">',
    ersetzen: 'teile.push(`<section class="nachbarn">',
    erwartet: /praktisch dieselbe Seite|Paar\(e\) ab 0\.98/,
    baueVorher: true,
    warum: 'Der Querverweisblock steht auf jeder Seite derselben Gruppe gleich und trägt mehr '
      + 'Wörter als der eigene Text. Fällt die Marke weg, an der die Messung ihn abschneidet, '
      + 'misst sie die Navigation — und weil die Navigation zweier Artikel derselben Gruppe '
      + 'identisch ist, entstehen Paare bei 1,00. Am 3. September war das der gemessene '
      + 'Zustand, bevor es die Marke gab. Diese Mutation stellt ihn wieder her.',
  }),
  Object.freeze({
    id: 'ausfuhr-ohne-rufer-und-ohne-grund',
    pruefer: 'pruefe-ungerufen',
    was: 'Eine Funktion, die außerhalb der Tests niemand ruft und für die das Register schweigt',
    datei: 'shop/src/ungerufen.js',
    art: 'ersetzen',
    suchen: "    funktionen: ['reihengeschaeftEinordnung'],",
    ersetzen: "    funktionen: [],",
    erwartet: /reihengeschaeftEinordnung.*ohne-grund|ohne-grund/,
    warum: 'Der Anlass sind zwei Funde desselben Tages: `erzeugeAngebot` (seit dem 31. August '
      + 'gebaut, geprüft, mit Bindefrist und § 11-Pflichtangaben) und `pruefeAnfrageAufGeheimnis` '
      + '(die zweite Reihe gegen Einkaufszahlen im Kundentext) waren angeschlossen an nichts. '
      + 'Beide Male hat es ein Mensch beim Hinsehen gefunden. Diese Mutation nimmt eine Funktion '
      + 'aus dem Register und verlangt, dass der Prüfer sie meldet — sonst wäre die Liste eine '
      + 'Sammlung von Entschuldigungen ohne Gegenstand.',
  }),
  Object.freeze({
    id: 'lieferhinweis-zeigt-auf-den-falschen-punkt',
    pruefer: 'pruefe-belege',
    was: 'Ein Kundenbeleg beruft sich auf eine AGB-Klausel, die etwas anderes regelt',
    datei: 'shop/src/rechtstexte.js',
    art: 'ersetzen',
    suchen: "export const PUNKT_EMPFANGSVOLLMACHT = 'AGB Punkt 7';",
    ersetzen: "export const PUNKT_EMPFANGSVOLLMACHT = 'AGB Punkt 6';",
    erwartet: /Punkt 6 heißt|verweis-zeigt-woanders|Punkt 7 .* wird in keinem Beleg/,
    warum: 'Der Zustand bis zum 3. September, wörtlich: Der Hinweis „Wer übernimmt, übernimmt '
      + 'für Sie" berief sich auf Punkt 6 — den Frachtpunkt —, während sein Wortlaut fast Satz '
      + 'für Satz in Punkt 7 steht. Die Regel dagegen gab es (`verweis-zeigt-woanders`), und sie '
      + 'hat nie zugeschlagen: Das Register kannte den Punkt nicht, und der Prüfer baute seine '
      + 'Auftragsbestätigung ohne die Hinweise — also ohne den Verweis. Diese Mutation stellt '
      + 'den falschen Verweis wieder her; grün bliebe der Prüfer nur, wenn er die Bestätigung '
      + 'wieder so bauen würde, wie der Betrieb sie nie erzeugt.',
  }),
  Object.freeze({
    id: 'registereintrag-nennt-eine-klammer-zu-viel',
    pruefer: 'pruefe-pruefer',
    was: 'Ein Registereintrag, der die zweite Klammer eines einklammrigen Musters liest',
    datei: 'shop/src/pruefregister.js',
    art: 'ersetzen',
    suchen: "    einheit: 'Zusagen über den Code',\n    mindestens: 5,",
    ersetzen: "    einheit: 'Zusagen über den Code',\n    mindestens: 5,\n    zweite: true,",
    erwartet: /pruefe-datenschutz/,
    warum: 'Der Eintrag stand unter „begründeter Verzicht" mit dem Grund, seine Gegenprobe '
      + 'wäre ein Prüfer mit leerem Ergebnis und damit dasselbe, was dieses Register ohnehin '
      + 'tut. Am 3. September ist der Fall von selbst eingetreten und sah anders aus: '
      + '`pruefe-datenschutz` trug `zweite: true`, sein Muster hat eine Klammer, '
      + '`Number(undefined)` ist NaN — und weil `NaN < 5` falsch ist, meldete der Prüfer der '
      + 'Prüfer „✓ pruefe-datenschutz — NaN Zusagen über den Code". Nicht leer, sondern '
      + 'unmessbar, und deshalb grün. Diese Mutation setzt genau das wieder ein.',
  }),
  Object.freeze({
    id: 'stand-aus-dem-gedaechtnis',
    pruefer: 'test',
    was: 'Ein Änderungsdatum, das jemand von Hand nachführen muss',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '    ...(seite.stand ? { dateModified: seite.stand } : {}),',
    ersetzen: '    dateModified: seite.kopf.stand,',
    erwartet: /ausgezeichnet .*geändert|dateModified|Änderungsgeschichte/,
    warum: 'Genau der Zustand vom 6. September, den diese Zeile abgelöst hat: `dateModified` '
      + 'kam aus dem Kopffeld `stand:`, und bei 10 von 24 Inhaltsseiten war dieses Feld älter '
      + 'als die letzte Änderung der Datei — bei `kanal.md` acht Tage, und dazwischen lag die '
      + 'inhaltliche Berichtigung vom 2. September. Ein berichtigter Satz unter einem Datum, '
      + 'das vor der Berichtigung liegt, ist für jeden maschinellen Leser die falsche Auskunft '
      + 'über die Aktualität — und niemandem fiel es auf, weil das Feld auf keiner Seite '
      + 'sichtbar ist. Die Mutation setzt das Handregister wieder ein und verlangt, dass es '
      + 'auffällt.',
  }),
  Object.freeze({
    id: 'auskunft-nur-im-leeren-fall',
    pruefer: 'shopprobe',
    was: 'Eine Auskunft, die nur erscheint, wenn die Trefferliste leer ist',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '    if (bekannt.length) {',
    ersetzen: '    if (bekannt.length && !t.length) {',
    erwartet: /ohneAuskunft=\[|Nicht-Sortiment/,
    warum: 'Der Zustand vom 6. September: Die redaktionelle Antwort „Das führen wir nicht" '
      + 'stand im Zweig für die leere Trefferliste, und geprüft wurde sie an „drainage" — '
      + 'einem Wort, das nichts findet. Drei Wörter des Registers finden sehr wohl etwas, '
      + 'und für die drei blieb die Antwort verborgen: bei „abdichtung" ausgerechnet die, '
      + 'die vor „dämmen ohne abzudichten" warnt, während die Trefferliste die Kellerwand- '
      + 'und die Perimeterseite zeigt. Eine Auskunft, die nur im leeren Fall erscheint, '
      + 'fehlt dort, wo die Trefferliste in die Irre führt. Diese Mutation setzt die alte '
      + 'Bedingung wieder ein.',
  }),
  Object.freeze({
    id: 'nicht-gefuehrt-und-trotzdem-beworben',
    pruefer: 'test',
    was: 'Ein Wort, das der Shop nicht führt und für das er trotzdem zahlt',
    datei: 'shop/src/nichtgefuehrt.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '    if (vorkommen >= grenze) {',
    ersetzen: '    if (vorkommen >= 0) {',
    erwartet: /Nicht-Sortiments|bitumen/,
    warum: 'Der Zustand vom 6. September: 24 Wörter im Register „das führen wir nicht", '
      + 'null davon in der Ausschlussliste. Die Anzeigen laufen auf Phrase und erscheinen, '
      + 'sobald die Anfrage den Produktbegriff enthält — „XPS 80 mm Sockelschiene" enthält '
      + 'ihn, der Klick ist bezahlt, und am Ende steht ein Satz, der mit „führen wir nicht" '
      + 'beginnt. Diese Mutation hält jedes Wort zurück, also auch die 21 ohne eigene '
      + 'Fundstelle, und stellt damit genau den alten Zustand wieder her.',
  }),
  Object.freeze({
    id: 'keywords-der-zurueckgestellten-gruppen-ungeprueft',
    pruefer: 'test',
    was: 'Keywords, die durch keine Prüfung gehen, weil ihre Gruppe noch nicht schaltet',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '  const keywordsGeprueft = keywordsEindeutig.filter((k) => {',
    ersetzen: '  const keywordsGeprueft = keywordsEindeutig'
      + '.filter((k) => imAnlauf.has(k.Anzeigengruppe)).filter((k) => {',
    erwartet: /zurueckgestellt|zurückgestellten/,
    warum: 'Der Zustand vom 6. September: Alle Keywordprüfungen — Landeseitendeckung, '
      + 'Abgrenzungssatz, eigene Suche — liefen nur über die drei Gruppen des ersten '
      + 'Anlaufs, 60 von 98 Keywords. Die 38 der zurückgestellten Gruppen gingen durch '
      + 'keine einzige und standen in keiner Ausgabedatei; am Tag, an dem eine Gruppe '
      + 'dazukommt, wären sie ungeprüft live gegangen. Beim ersten Lauf über alle fand die '
      + 'Prüfung sofort drei Keywords ohne Antwort in der eigenen Suche und fünf ohne Wort '
      + 'auf ihrer Landeseite. Diese Mutation stellt die kleine Reichweite wieder her.',
  }),
  Object.freeze({
    id: 'seiten-die-der-assistent-nie-sieht',
    pruefer: 'test',
    was: 'Eine gebaute Seite, die in der Datei für Maschinen nicht vorkommt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "    ...RECHTSSEITEN.map(([id, titel, kurz]) => `- [${titel}](${BASIS}/${id}.html): ${kurz}`),",
    ersetzen: "    ...RECHTSSEITEN.slice(0, 1).map(([id, titel, kurz]) => `- [${titel}](${BASIS}/${id}.html): ${kurz}`),",
    erwartet: /seite-ohne-eintrag|rechtliches\/(agb|datenschutz|abnahme)/,
    warum: 'Der Zustand vom 6. September: `llms.txt` nannte 70 von 82 gebauten Seiten, und vier '
      + 'der Auslassungen waren die Rechtsseiten. Wer einen Assistenten fragt, unter welchen '
      + 'Bedingungen dieser Händler liefert oder wie lange die Rügefrist läuft, bekam von der '
      + 'Datei, die genau für diesen Kanal gemacht ist, keine Antwort — und ein Assistent, der '
      + 'nichts findet, antwortet mit dem, was bei einem Baustoffhändler üblich ist. Diese '
      + 'Mutation lässt drei der vier wieder heraus.',
  }),
  Object.freeze({
    id: 'vorlage-die-ihr-werkzeug-abweist',
    pruefer: 'test',
    was: 'Eine Vorlage, die durch ihr eigenes Werkzeug nicht durchgeht',
    datei: 'shop/beispiel/artikelliste-muster.csv',
    art: 'ersetzen',
    suchen: 'sku;bezeichnung;einheit;ek_netto;uvp_netto;gruppe;gewicht_kg;sperrgut',
    ersetzen: 'artikel;name;einheit;preis;liste;gruppe;gewicht;sperrgut',
    erwartet: /Vorlage|Import|artikelliste/i,
    warum: 'Die Vorlage ist die Datei, die der Lieferant ausfüllt — der Importweg verweist auf '
      + 'sie, und sie löst zugleich die Weisung „Sortiment auf mindestens hundert Artikel". Bis '
      + 'zum 6. September öffnete sie kein Lauf: Ihre Spaltennamen waren eine Behauptung über '
      + 'ein Dateiformat. Merkt es jemand, dann am Tag, an dem die ausgefüllte Liste kommt. '
      + 'Diese Mutation vertauscht die Spaltennamen mit plausiblen anderen — genau das, was '
      + 'beim Abschreiben von Hand passiert.',
  }),
  Object.freeze({
    id: 'mehr-lieferungen-als-lieferanten',
    pruefer: 'test',
    was: 'Ein Text, der dem Kunden mehr Lieferungen verspricht, als es Lieferanten gibt',
    datei: 'shop/src/lieferungen.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "  return lieferanten <= 1",
    ersetzen: "  return false",
    // Gemessen am 7. September: Die Mutation lässt genau diesen Testfall fallen. Der
    // Korpusfall über die gebauten Seiten fällt **nicht** — die Seiten entstehen aus
    // derselben mutierten Quelle, Seite und Prüfer sind sich einig.
    erwartet: /bei einem Lieferanten sagt der Satz/,
    warum: 'Der Zustand vom 6. September: Vier Stellen sagten „Werden mehrere Hersteller '
      + 'bestellt, entstehen mehrere Lieferungen, und die Grenze gilt für jede einzelne" — der '
      + 'Katalog führt 46 Artikel von einem Lieferanten, und der Rechenkern teilt nach '
      + 'lieferantId. Wer Baumit, Schiedel und Soudal in den Korb legt, las, er brauche dreimal '
      + '250 € statt einmal; an der Kasse sah er dann eine Teillieferung. Die vorsichtige '
      + 'Richtung fällt nicht auf, weil abgeschreckte Körbe in keiner Abrechnung stehen. Diese '
      + 'Mutation lässt den Satz wieder unabhängig von der Lieferantenzahl stehen.',
  }),
  Object.freeze({
    id: 'abholung-an-einer-adresse-ohne-lager',
    pruefer: 'test',
    was: 'Eine zugesagte Abholung an einem Ort, an dem nie Ware liegt',
    datei: 'shop/src/abholung.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '  const erlaubt = lieferant?.abholungDurchKunden;',
    ersetzen: '  const erlaubt = true;',
    erwartet: /abholung-zugesagt-ohne-ort|sagt Abholung zu|Abholung/,
    warum: 'Der Zustand vom 6. September: Fünf Stellen sagten dem Kunden, er könne selbst '
      + 'abholen — die Fragen und Antworten, die Lieferseite mit eigener Überschrift, zweimal '
      + 'der Rat „unter der Grenze ist Abholung der bessere Weg" und AGB Punkt 12 mit dem '
      + 'Betriebssitz. Der Gründungsparameter lautet „reines Streckengeschäft, kein eigenes '
      + 'Warenlager", und Punkt 4 derselben AGB sagt Direktversand durch den Hersteller: In '
      + 'Marwach 5 liegt nie Ware. Belegt ist nur unsere eigene Abholung am Lager Mauthausen. '
      + 'Diese Mutation sagt Abholung wieder zu, ohne dass es jemand bestätigt hat.',
  }),
  Object.freeze({
    id: 'produktseite-ohne-eignungsgrenzen',
    pruefer: 'test',
    was: 'Eine Produktseite ohne den Abschnitt, den die eigene Redaktionsregel verspricht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '    teile.push(`<h2>${GRENZEN_UEBERSCHRIFT}</h2>`);',
    ersetzen: '    if (a.gruppe !== "Kamin") teile.push(`<h2>${GRENZEN_UEBERSCHRIFT}</h2>`);',
    erwartet: /produktseite-ohne-grenzen|Wofür dieser Artikel nicht gedacht/,
    warum: 'Der Zustand vom 7. September: Die vierte Redaktionsregel versprach „Jede '
      + 'Produktseite hat einen Abschnitt dazu", und null von 46 hatten ihn — auf der Seite, '
      + 'auf die `llms.txt` mit „Wie geprüft wird" verweist. Diese Mutation lässt ihn auf den '
      + 'Kaminseiten wieder weg, also genau dort, wo die Warengruppe keine eigenen '
      + 'Abgrenzungssätze hat und die Lücke am wenigsten auffiele.',
  }),
  Object.freeze({
    id: 'eine-zweite-hand-die-es-nicht-gibt',
    pruefer: 'pruefe-inhalte',
    was: 'Eine Zusage über den eigenen Betrieb, die er nicht einlöst',
    datei: 'shop/inhalte/wissen/redaktionsprinzipien.md',
    art: 'ersetzen',
    suchen: 'Jede Seite läuft\ndeshalb gegen Prüfprogramme',
    ersetzen: 'Jede Seite geht durch eine zweite Hand, bevor sie erscheint, und läuft\ndeshalb gegen Prüfprogramme',
    erwartet: /Betriebsaussage|zweite Hand/,
    warum: 'Der Fall vom 7. September, und er stand auf der Seite, die erklärt, wie hier '
      + 'geprüft wird: „Jede Seite geht durch eine zweite Hand, bevor sie erscheint." Es gibt '
      + 'keine zweite Hand — die Texte entstehen in einem Lauf, und was sie prüft, sind '
      + 'Programme. Eine Zusage über den eigenen Betrieb ist teurer als eine falsche Zahl: Sie '
      + 'lässt sich nicht nachrechnen, nur glauben. Das Register der Betriebsaussagen kannte '
      + 'bis dahin genau eine Regel (den Vorrat); diese Mutation setzt die abgelöste Zusage '
      + 'wieder ein.',
  }),
  Object.freeze({
    id: 'merkblatt-ohne-weg-dorthin',
    pruefer: 'test',
    was: 'Eine Seite, die ins Merkblatt schickt und den Weg dorthin verschweigt',
    datei: 'shop/src/merkblattverweis.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '    if (a?.gruppe !== gruppe) continue;',
    ersetzen: '    if (a?.gruppe !== gruppe) continue;\n    if (true) continue;',
    erwartet: /merkblatt-ohne-weg|Wo das Merkblatt steht/,
    warum: 'Der Zustand vom 7. September: Acht Inhaltsseiten schickten den Leser ins Merkblatt '
      + 'des Herstellers, vier nannten keinen — darunter „Mengen für 100 m² Fassade" mit acht '
      + 'Erwähnungen und null Verweisen, also ausgerechnet die Seite, deren ganzer Zweck der '
      + 'Rechenweg mit den Werten aus dem eigenen Merkblatt ist. Der Shop kennt den Weg seit '
      + 'dem 1. September in `src/hersteller.js`, nur kannten die Inhaltsseiten das Register '
      + 'nicht. Diese Mutation lässt die Herstellerliste je Gruppe wieder leer laufen.',
  }),
  Object.freeze({
    id: 'sitemap-ohne-aenderungsdatum',
    pruefer: 'test',
    was: 'Eine Sitemap, die das Änderungsdatum verschweigt, das der Bau kennt',
    datei: 'shop/src/sitemapstand.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '  if (String(id).startsWith(\'artikel/\')) return katalogStand ?? OHNE_QUELLE;',
    ersetzen: '  if (String(id).startsWith(\'artikel/\')) return OHNE_QUELLE;',
    erwartet: /lastmod|Änderungsdatum|sitemap/i,
    warum: 'Der Zustand vom 7. September: 78 Einträge in der Sitemap, null `<lastmod>` — '
      + 'obwohl der Bau seit dem Vortag für jede Inhaltsseite ein Änderungsdatum aus dem '
      + 'Verzeichnis ableitet und es als `dateModified` ausgibt. Die Angabe war da und stand '
      + 'nicht dort, wo eine Suchmaschine zuerst danach sieht. Diese Mutation nimmt sie den '
      + '46 Artikelseiten wieder weg — der Hälfte, bei der ein Preiswechsel der eigentliche '
      + 'Anlass zum Neubesuch wäre.',
  }),
  Object.freeze({
    id: 'pfad-auf-der-seite-ohne-auszeichnung',
    pruefer: 'test',
    was: 'Ein Pfad, den die Seite zeigt und keine Maschine liest',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '      stufen: krumeAusHtml(koerper),',
    ersetzen: '      stufen: id.startsWith(\'artikel/\') ? [] : krumeAusHtml(koerper),',
    erwartet: /krume-ohne-auszeichnung|zeigt einen Pfad/,
    warum: 'Der Zustand vom 7. September: 81 von 82 gebauten Seiten zeigten oben einen Pfad, '
      + 'und keine einzige zeichnete ihn aus — eine Suchmaschine stellt ihn statt der nackten '
      + 'Adresse ins Ergebnis, wenn er ausgezeichnet ist. Diese Mutation nimmt ihn den 46 '
      + 'Artikelseiten wieder weg, also der Hälfte, bei der der Pfad am meisten trägt: Er '
      + 'nennt die Warengruppe, in der der Artikel steht.',
  }),
  Object.freeze({
    id: 'eine-aufzaehlung-die-ablaeuft',
    pruefer: 'test',
    was: 'Eine Aufzählung im Plan, die eine Frage des Briefes nicht mehr kennt',
    datei: 'shop/src/rollout.js',
    art: 'ersetzen',
    suchen: '      FRAGEN.map((f) => f.titel).join(\'; \')}.`,',
    ersetzen: '      FRAGEN.slice(0, 2).map((f) => f.titel).join(\'; \')}.`,',
    erwartet: /frage-fehlt-im-plan|der Plan nennt/,
    warum: 'Der Fall vom 7. September: Die Etappe „Ein Gespräch mit dem Lieferanten" zählte '
      + 'von Hand auf, was das Gespräch löst. Am 3. September war daraus schon eine Zahl '
      + 'entfernt worden („Löst acht offene Punkte"), weil sie ablief — die Aufzählung blieb '
      + 'und lief am 6. September ab, als die sechste Frage dazukam. Eine Aufzählung ist auch '
      + 'eine Zahl. Diese Mutation lässt vier der sechs Fragen wieder aus dem Plan '
      + 'verschwinden, den der Auftraggeber vor der Budgetfreigabe liest.',
  }),
  Object.freeze({
    id: 'eine-nummer-ohne-aussage',
    pruefer: 'pruefe-recht',
    was: 'Eine Fundstelle, deren Behauptung nicht ausgeschrieben ist',
    datei: 'shop/src/rechtsgrund.js',
    art: 'ersetzen',
    suchen: "    behauptung: 'Die Rechnung trägt ein Ausstellungsdatum.',",
    ersetzen: "    behauptung: 'steht drauf.',",
    erwartet: /behauptung-zu-duenn/,
    warum: 'Am 9. September stellte sich heraus, dass keine Paragraphenangabe dieses Bestands '
      + 'am Volltext belegt ist — das Rechtsinformationssystem ist gesperrt. Was bleibt, ist '
      + 'eine Liste, die ein Rechtstexteanbieter in einer Sitzung abhaken kann — und die trägt '
      + 'nur, wenn neben jeder Nummer steht, **was** sie behauptet. Die Mutation kürzt eine '
      + 'Behauptung auf zwei Wörter. Bleibt der Prüfer grün, sammelt er Nummern statt Aussagen, '
      + 'und der Anbieter bekäme eine Liste, die er selbst erst nachschlagen müsste. Bewusst '
      + 'ohne Paragraphenzeichen im Mutationstext: Ein Zitat im Register ist selbst eine '
      + 'Fundstelle, und die Probe soll den Prüfer messen, nicht sich selbst.',
  }),
  Object.freeze({
    id: 'eine-grenze-die-niemand-versucht-hat',
    pruefer: 'pruefe-grenzen',
    was: 'Eine behauptete Grenze, zu der kein Versuch im Vermerk steht',
    datei: 'shop/data/aussenlage.json',
    art: 'ersetzen',
    suchen: '"repository-sichtbarkeit": {',
    ersetzen: '"repository-sichtbarkeit-anders": {',
    erwartet: /grenze-ohne-versuch/,
    warum: 'Am 9. September hat sich zweimal an einem Abend eine behauptete Grenze als zu weit '
      + 'gezogen erwiesen, und beide Male hatte niemand es versucht. Genau das ist der Zustand, '
      + 'den dieser Prüfer finden soll: Eine Grenze nennt ihren Weg, und im Vermerk steht kein '
      + 'Versuch dazu. Die Mutation benennt den Versuch um, sodass die Grenze ohne ihn dasteht — '
      + 'und der Versuch ohne Grenze daneben. Bleibt der Prüfer grün, misst er nichts: '
      + 'Nicht versucht ist nicht unmöglich.',
  }),
  Object.freeze({
    id: 'ein-name-aus-einem-fremden-modul',
    pruefer: 'pruefe-ungerufen',
    was: 'Eine ungerufene Ausfuhr, die den Namen einer gerufenen trägt',
    datei: 'shop/src/format.js',
    art: 'anhaengen',
    text: '\nexport function kennzahlen() { return null; }\n',
    erwartet: /format\.js#kennzahlen/,
    warum: 'Bis zum 9. September suchte diese Messung den bloßen Namen im ganzen Bestand. '
      + '`kennzahlen` gibt es in `kennzahlen.js` und wird gerufen — eine gleichnamige, von '
      + 'niemandem gerufene Ausfuhr daneben fiel damit nicht auf. Genau so blieb `vergleiche` '
      + 'aus `zahlung.js` unsichtbar, die Tafel, auf der Gate 21 ruht. Die Mutation hängt eine '
      + 'solche Zwillingsausfuhr an und verlangt, dass sie beim Namen ihres Moduls gemeldet '
      + 'wird. Bleibt der Prüfer grün, kennt er Funktionen wieder nur beim Vornamen.',
  }),
  Object.freeze({
    id: 'die-rechneruhr-im-beleg',
    pruefer: 'pruefe-zeit',
    was: 'Ein Belegdatum, das wieder aus der Rechneruhr kommt',
    datei: 'shop/bin/vorgang.mjs',
    art: 'ersetzen',
    suchen: 'const heute = geschaeftstag();',
    ersetzen: 'const heute = new Date().toISOString().slice(0, 10);',
    erwartet: /rohe-uhr-im-beleg/,
    warum: 'Genau diese Zeile stand hier bis zum 9. September und setzte das Ausstellungsdatum '
      + 'nach § 11 Abs 1 Z 4 UStG aus UTC — jede Rechnung zwischen Mitternacht und 01:00 Uhr '
      + 'trug den Vortag. Die Mutation dreht sie zurück. Bleibt der Prüfer grün, prüft er die '
      + 'Absicht im Register und nicht den Code daneben; genau davon gab es an diesem Tag '
      + 'sieben Fälle, und alle sahen richtig aus.',
  }),
  Object.freeze({
    id: 'die-rechneruhr-in-der-probe',
    pruefer: 'pruefe-zeit',
    was: 'Eine Probe, die das Erzeugnis gegen die Rechneruhr hält statt gegen den Kalender',
    datei: 'shop/test/preisstand-auf-der-seite.test.js',
    art: 'ersetzen',
    suchen: 'const HEUTE = geschaeftstag();',
    ersetzen: 'const HEUTE = new Date().toISOString().slice(0, 10);',
    erwartet: /rohe-uhr-im-beleg/,
    warum: 'Genau diese Zeile stand hier bis zum 10. September und hat die Probe um 00:01 Uhr '
      + 'Wiener Zeit rot gemacht: Die Artikelseite daneben trug „93 Tage", gerechnet mit dem '
      + 'Geschäftskalender, die Probe rechnete 92 aus der Rechneruhr. Der Prüfer sah die Datei '
      + 'damals nicht an — seine Liste endete bei `src` und `bin`. Die Mutation dreht die Zeile '
      + 'zurück. Bleibt der Prüfer grün, ist seine Grenze wieder zu eng gezogen, und keine Probe '
      + 'des Bestands steht unter der Uhrenaufsicht.',
  }),
  Object.freeze({
    id: 'eine-marke-ueber-den-falschen-text',
    pruefer: 'pruefe-marke',
    was: 'Eine Beschreibung, deren Marke den Text darüber nicht deckt',
    datei: 'shop/src/veroeffentlichung.js',
    art: 'ersetzen',
    suchen: '  return text + TRENNER + marke(text, quelle, befehl);',
    ersetzen: "  return text + TRENNER + marke(`${text} `, quelle, befehl);",
    erwartet: /marke-passt-nicht/,
    warum: 'Das ist der Fehler, für den die Marke gebaut wurde, an seiner kleinstmöglichen '
      + 'Stelle: Die Marke entsteht über einen Text mit einem Leerzeichen mehr als der, der '
      + 'darunter steht. Genau so sah der Fehler in Wirklichkeit aus — nur war es dort ein '
      + 'ganzer Satz, und niemand konnte ihn nachweisen. Der erste Anlauf dieser Probe hat '
      + 'stattdessen das Werkzeug mutiert, das die Marke setzt: Dann wächst die Marke mit, '
      + 'die Fassung bleibt in sich stimmig, und der Prüfer war zu Recht grün. Die Marke '
      + 'prüft eine Fassung gegen sich selbst — mutiert werden muss die Naht zwischen beiden. '
      + 'Bleibt der Prüfer grün, vergleicht er nicht die Zeichen, sondern etwas Ähnliches.',
  }),
  Object.freeze({
    id: 'die-quelle-ist-der-veroeffentlichung-voraus',
    pruefer: 'abgleich-veroeffentlichung',
    was: 'Eine Quelle, die sich seit der Veröffentlichung geändert hat',
    datei: 'shop/bin/prtext.mjs',
    art: 'ersetzen',
    suchen: "const FUSS = '\\n\\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\\n\\n'",
    ersetzen: "const FUSS = '\\n\\nNachgezogen und nicht veröffentlicht.\\n\\n'",
    erwartet: /weicht von der Ausgabe/,
    warum: 'Das ist der Fall vom 5. September, an dem der ganze Handgriff hängt: Die Quelle '
      + 'wurde nachgezogen, die Veröffentlichung vergessen, und `pruefe-schaufenster` war '
      + 'grün, weil es die Quelle gegen den Bestand misst und nicht gegen GitHub. Die '
      + 'Mutation ändert die Werkzeugausgabe, ohne die Veröffentlichung anzufassen — genau '
      + 'die Lage, die dreimal unbemerkt blieb. Bleibt der Prüfer grün, holt er die Fassung '
      + 'nicht wirklich oder vergleicht sie nicht wirklich.',
  }),
  Object.freeze({
    id: 'die-sperre-nimmt-geschwister-aus',
    pruefer: 'test',
    was: 'Eine Ausnahme, die neben dem Fragenden auch seine Geschwister deckt',
    datei: 'shop/src/mutationsschutz.js',
    art: 'ersetzen',
    suchen: '    .filter((p) => !ausgenommen.has(p.pid));',
    ersetzen: '    .filter((p) => !ausgenommen.has(p.pid) && !ausgenommen.has(p.ppid));',
    erwartet: /Wer selbst fragt/,
    warum: 'Genau so stand die Zeile im ersten Entwurf vom 10. September, und die Sperre schwieg '
      + 'gegen einen echten laufenden Prozess: Über die Elternkennung ausgenommen fällt jedes '
      + 'Geschwister mit heraus — ein Lauf, der im selben Terminal im Hintergrund liegt, während '
      + 'davor committet wird. Das ist die Lage, gegen die die Prüfung gebaut ist. Bleibt der '
      + 'Testlauf grün, prüft er die Ausnahme nur an dem Fall, für den sie gedacht ist, und '
      + 'nicht an dem, den sie nicht treffen darf.',
  }),
  Object.freeze({
    id: 'eine-pauschale-sperre-ohne-adresse',
    pruefer: 'pruefe-grenzen',
    was: 'Eine Aussage über den Ausgang dieser Umgebung ohne eine gemessene Adresse',
    datei: 'shop/src/paket.js',
    art: 'ersetzen',
    /*
     * **Mutiert wird die Adresse, nicht der Satz.** Der erste Entwurf schrieb den
     * pauschalen Satz als Ersetzungstext — und stellte damit den Prüfer rot,
     * bevor die Probe lief: Der Ersetzungstext steht in dieser Datei, und diese
     * Datei wird mitgelesen. Zum vierten Mal in vier Runden hat sich eine
     * Gegenprobe an ihrem eigenen Text gestoßen; ein Register, das seine
     * Mutationen aufschreibt, schreibt sie in den Bestand, den es prüft.
     */
    suchen: 'ausgabe/site/` auf bauversand.com',
    ersetzen: 'ausgabe/site/` auf die Zieladresse',
    erwartet: /pauschale-sperre/,
    warum: 'Bis zum 9. September stand dieser Satz in fünfzehn Quelldateien als Pauschale, und '
      + 'am 9. war gemessen, dass er zu weit gezogen ist: bauversand.com antwortet nicht, '
      + 'api.github.com schon. Berichtigt wurde die Datei, in der es stand — die übrigen führten '
      + 'die Pauschale weiter. Die Mutation nimmt einer Fundstelle ihre Adresse wieder weg. '
      + 'Bleibt der Prüfer grün, misst er die Berichtigung nur dort, wo sie schon angekommen ist.',
  }),
  Object.freeze({
    id: 'eine-zurueckstellung-die-nie-verfaellt',
    pruefer: 'pruefe-browserproben',
    was: 'Eine zurückgestellte Probe, deren letzter Anschlag aus einer anderen Woche stammt',
    datei: 'shop/data/browserproben.json',
    art: 'ersetzen',
    /*
     * **Ein Suchmuster, kein Suchtext.** Zwei Dinge bewegen sich hier: das
     * Datum, das der Läufer nach jedem Anschlag neu schreibt, und die
     * Formatierung, die dabei aus der kompakten Zeile einen Block macht. Ein
     * fester Suchtext wäre nach dem ersten Anschlag tot — genau der Fall, für
     * den das Muster zwei Runden zuvor gebaut wurde.
     */
    suchenMuster: /"korbflaeche-ohne-grenze":\s*\{\s*"am":\s*"\d{4}-\d{2}-\d{2}"/,
    ersetzen: '"korbflaeche-ohne-grenze": {\n      "am": "2026-07-01"',
    erwartet: /zu-lange-her/,
    warum: 'Genau dieser Zustand herrschte zwischen dem 5. und dem 10. September, nur ohne '
      + 'Datum: Vier Gegenproben standen im Register, der Lauf druckte ihre Namen als '
      + 'zurückgestellt, und keine lief. Als sie am 10. zum ersten Mal liefen, zeigte eine auf '
      + 'das falsche Szenario. Die Mutation setzt einen Anschlag weit zurück. Bleibt der Prüfer '
      + 'grün, verfällt die Zurückstellung wieder nie, und „zurückgestellt" heißt dauerhaft '
      + '„ungeprüft, ohne dass es jemand sieht".',
  }),
  Object.freeze({
    id: 'eine-zeile-nach-etwas-das-schon-dasteht',
    pruefer: 'zettel',
    was: 'Ein Zettel, der eine Angabe abfragt, die längst in der Datei steht',
    datei: 'shop/data/betreiber.json',
    art: 'ersetzen',
    suchen: '"email": ""',
    ersetzen: '"email": "office@bauversand.com"',
    erwartet: /schon-geliefert/,
    warum: 'Der Zettel ist die Liste der sieben Angaben, die nichts kosten. Sein Wert hängt '
      + 'daran, dass er stimmt: Wer ihn aufschlägt und als Erstes nach etwas gefragt wird, das '
      + 'er vor drei Wochen eingetragen hat, liest die übrigen sechs Zeilen nicht mehr. Die '
      + 'Mutation füllt ein Feld aus, ohne die Zeile zu entfernen. Bleibt der Prüfer grün, '
      + 'misst er den Zettel gegen sich selbst statt gegen die Datei.',
  }),
  Object.freeze({
    id: 'ein-betrag-ohne-seine-quelle',
    pruefer: 'pruefe-sperrgut',
    was: 'Der Kranbetrag auf der Artikelseite, ohne Quelle und Stand daneben',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: 'unten enthalten (Quelle: <a href="${verweis(\'lieferung\')}">Lieferung und Fracht</a>,',
    ersetzen: 'unten enthalten (<a href="${verweis(\'lieferung\')}">Lieferung und Fracht</a>,',
    baueVorher: true,
    erwartet: /zahl-ohne-quelle/,
    warum: 'Die Abhilfe zum Befund vom 5. September („Kranentladung für 285 Gramm") war, dem '
      + 'Kunden Herkunft, Gewicht und Betrag der Schätzung zu nennen. Fünf Tage lang hing sie '
      + 'allein an dieser Vorlage: Der Flächenprüfer verlangt nur „aus der Warengruppe" '
      + 'irgendwo in der Datei, und der Testfall prüfte eine Seite und den ersten Halbsatz. Die '
      + '7,50 €, die der Kunde je Position zahlt, standen in keiner Zusicherung. Die Mutation '
      + 'nimmt dem Betrag seine Quelle. Bleibt der Prüfer grün, hält die Offenlegung wieder nur '
      + 'so lange wie die Vorlage.',
  }),
  Object.freeze({
    id: 'veroeffentlichung-haengt-hinterher',
    pruefer: 'pruefe-schaufenster',
    was: 'Ein Beschreibungstext, der sich seit der letzten Veröffentlichung geändert hat',
    datei: 'shop/bin/prtext.mjs',
    art: 'ersetzen',
    suchen: '  .trimEnd() + FUSS;',
    ersetzen: "  .trimEnd() + FUSS + ' ';",
    erwartet: /veroeffentlichung-steht-aus/,
    warum: 'Am 9. September wurde die Regel gebaut, weil die veröffentlichte Beschreibung '
      + 'dreimal hinter der Quelle zurückblieb; eine Gegenprobe bekam sie damals nicht. '
      + 'Diese Mutation ändert den Text, der veröffentlicht gehört, um ein einziges '
      + 'Leerzeichen — unsichtbar für jeden Leser, aber der Fingerabdruck ist ein anderer. '
      + 'Bleibt der Prüfer grün, vergleicht er nicht, sondern nickt: Er hätte genau die '
      + 'Abweichung durchgehen lassen, für die er gebaut wurde.',
  }),
  Object.freeze({
    id: 'lebende-zahl-ohne-anker',
    pruefer: 'pruefe-schaufenster',
    was: 'Eine lebende Zahl der Beschreibung, die kein Muster misst',
    datei: 'shop/src/schaufenster.js',
    art: 'ersetzen',
    suchen: "      muster: /aus (\\d+) Lieferantenbelegen/, soll: m.belege },",
    ersetzen: "      muster: /aus (\\d+) Lieferantenbelegen/, soll: m.belege + 1 },",
    erwartet: /Lieferantenbelege/,
    warum: 'Der Befund vom 7. September: Diese Tafel misst, was jemand zu messen angeordnet '
      + 'hat. Beim Nachzählen aller Zahlen der Beschreibung standen zwei lebende Angaben da, '
      + 'die kein Muster berührte — die Zahl der Lieferantenbelege und die der gerechneten '
      + 'Suchkampagnen. Ein Prüfer, der nur die angeordneten Zahlen misst, ist so vollständig '
      + 'wie die Anordnung. Diese Mutation verschiebt den Sollwert um eins und verlangt, dass '
      + 'die Zahl wirklich gemessen wird und nicht bloß dasteht.',
  }),
  Object.freeze({
    id: 'die-kasse-rechnet-mit-einem-anderen-preis',
    pruefer: 'pruefe-preise',
    was: 'Ein Preis in den Daten der Kasse, den keine Seite nennt',
    datei: 'shop/src/shopkern.js',
    art: 'ersetzen',
    baueVorher: true,
    // Der Suchtext nimmt die Zeile darüber mit: `vkNetto: a.vkNetto ?? null`
    // steht zweimal in dieser Datei — einmal im Suchindex, einmal im
    // öffentlichen Artikel. Beim ersten Anlauf traf die Mutation den
    // Suchindex, und der Prüfer meldete zu Recht grün.
    suchen: '    sperrgut: !!a.sperrgut,\n    vkNetto: a.vkNetto ?? null,',
    ersetzen: '    sperrgut: !!a.sperrgut,\n'
      + '    vkNetto: a.vkNetto == null ? null : Math.round(a.vkNetto * 90) / 100,',
    erwartet: /shop\.js|Kasse rechnet/,
    warum: 'Bis zum 7. September verglich der Preisabgleich vier Ausgaben, und alle vier '
      + 'zeigen den Preis. Die fünfte rechnet mit ihm: `shop.js` trägt `vkNetto` für alle 46 '
      + 'Artikel, und daraus entstehen Warenkorbsumme, Fracht, Umsatzsteuer und der '
      + 'Anfragetext. Eine Abweichung dort ist die teuerste von allen — der Kunde liest auf '
      + 'der Seite den einen Betrag und bekommt im Korb den anderen. Diese Mutation zieht in '
      + 'den Kassendaten zehn Prozent ab und lässt jede sichtbare Seite unberührt.',
  }),
  Object.freeze({
    id: 'suchtext-trifft-die-falsche-stelle',
    pruefer: 'test',
    was: 'Eine Gegenprobe, deren Suchtext zweimal passt und die erste Stelle trifft',
    datei: 'shop/src/gegenprobenregister.js',
    art: 'ersetzen',
    suchen: "    ersetzen: 'steht in der Preistafel',\n    alle: true,",
    ersetzen: "    ersetzen: 'steht in der Preistafel',",
    erwartet: /2-mal vor/,
    warum: 'Der Fall vom 7. September: Ein neuer Suchtext traf eine Zeile, die zweimal in '
      + '`shopkern.js` steht. Der Läufer ersetzt die erste Fundstelle, mutiert wurde der '
      + 'Suchindex statt des öffentlichen Artikels, und der Preisprüfer meldete zu Recht '
      + 'grün — das sieht aus wie ein Prüfer, der nicht anschlägt. Die Einzelprobe bricht '
      + 'seit dem 31. August bei mehrfachem Treffer ab, der unbeaufsichtigte Läufer nicht: '
      + 'Was der Mensch von Hand ausführt, war abgesichert; was allein läuft, nicht. Diese '
      + 'Mutation nimmt `alle: true` bei einer Probe weg, deren Suchtext zweimal in '
      + '`website.mjs` steht — genau die Lage, die niemandem auffiel.',
  }),
  Object.freeze({
    id: 'erwartung-gegen-die-ganze-ausgabe',
    pruefer: 'test',
    was: 'Ein Vergleich, der die schon grün dastehenden Zeilen mitzählt',
    datei: 'shop/src/gegenprobenregister.js',
    art: 'ersetzen',
    suchen: '  const bekannt = new Set(vorher.split(\'\\n\').map((z) => z.trim()));\n'
      + '  return nachher.split(\'\\n\').filter((z) => !bekannt.has(z.trim())).join(\'\\n\');',
    ersetzen: '  return nachher;',
    erwartet: /Verglichen wird, was in der roten Ausgabe neu ist/,
    warum: 'Der Befund vom 7. September: Der Läufer sichert zu, der Prüfer melde rot **und '
      + 'nenne die erwartete Stelle** — verglichen wurde gegen die ganze rote Ausgabe. '
      + 'Gemessen passen 34 von 101 Erwartungen schon auf die grüne, bei `npm test` fast '
      + 'alle, weil TAP jeden Testfall beim Namen nennt. Eine Erwartung, die auch auf Grün '
      + 'passt, sagt nur, dass es rot ist, nicht warum. Diese Mutation gibt die ganze '
      + 'Ausgabe zurück und stellt damit genau den Zustand her, der ein Drittel der '
      + 'Zusicherungen wertlos machte.',
  }),
  Object.freeze({
    id: 'gate-nur-noch-im-protokoll',
    pruefer: 'pruefe-gates',
    was: 'Eine Gate-Entscheidung, die aus dem Bestand verschwunden ist',
    datei: 'shop/src/shopkern.js',
    art: 'ersetzen',
    // **Die Mutation nimmt das `export`, nicht den Namen.** Der erste Anlauf
    // benannte um — und `pruefe-ungerufen` hielt daraufhin
    // `untergrenzeFuerDenKorb` für eine Ausfuhr **dieser** Datei, weil der
    // Ersetzungstext die Zeile wörtlich mitführt. Ein Register, das Quelltext
    // zitiert, ist Quelltext. Dieselbe Falle wie bei den Gate-Mustern, am
    // selben Tag, eine Stunde später.
    suchen: 'export function mindestbestellwertKunde(',
    ersetzen: 'function mindestbestellwertKunde(',
    erwartet: /Gate 25/,
    warum: 'Der Befund vom 7. September: Achtundzwanzig Gates, und nichts hielt sie gegen '
      + 'den Bestand. Ein Gate ist die stärkste Festlegung dieses Vorhabens — eine '
      + 'Entscheidung, die nur im Protokoll steht, ist eine Absichtserklärung. Diese '
      + 'Mutation benennt die Stelle um, an der Gate 25 wirkt: Der Mindestbestellwert '
      + 'rechnet weiter, aber die Entscheidung ist im Bestand nicht mehr wiederzufinden — '
      + 'genau der Zustand, den niemand bemerkt, weil nichts davon rot wird.',
  }),
  Object.freeze({
    id: 'weisung-nur-noch-im-protokoll',
    pruefer: 'pruefe-weisungen',
    was: 'Eine Weisung des Auftraggebers, die aus dem Bestand verschwunden ist',
    datei: 'shop/src/baustoffkatalog.js',
    art: 'ersetzen',
    suchen: 'export const ZIELMARGE = 0.25;',
    ersetzen: 'export const ZIELMARGE = 1 / 4;',
    erwartet: /Weisung 3/,
    warum: 'Der Befund vom 7. September: Acht Weisungen seit dem 22. August, zwei davon haben '
      + 'frühere Arbeit vollständig umgeworfen — und gehalten hat sie nichts. `pruefe-auftrag` '
      + 'misst den Ursprungsauftrag vom 9. August, dort endet es. Diese Mutation schreibt '
      + 'dieselbe Zahl als Bruch: `1 / 4` **ist** 0,25. Gerechnet wird unverändert, kein '
      + 'Testfall fällt, kein Preis ändert sich — nur die Weisung „25 % ist Marge vom '
      + 'Verkauf" ist im Bestand nicht mehr wiederzufinden. Der erste Anlauf schrieb '
      + '`0.2500` und war zu Recht grün: Das Muster stand noch da.',
  }),
  Object.freeze({
    id: 'zahl-auf-der-seite-ohne-fundstelle',
    pruefer: 'pruefe-zahlen',
    was: 'Eine belegte Aussage, die aus dem Quellenregister fällt',
    datei: 'shop/inhalte/quellen.json',
    art: 'ersetzen',
    suchen: 'Füllungsgrad höchstens 70 % beträgt',
    ersetzen: 'Füllungsgrad nicht überschritten wird',
    erwartet: /70 %/,
    warum: 'Der Befund vom 7. September: `pruefe-quellen` meldete „6 von 6 belegt" — eine '
      + 'Aussage über das Register, nicht über die Seiten. Von der anderen Seite gemessen '
      + 'standen vier Zahlen ohne Eintrag da, und alle vier nannten ihre Quelle im laufenden '
      + 'Satz. Diese Mutation nimmt die Zahl aus der nachgetragenen Aussage heraus: Die '
      + 'Fundstelle bleibt im Register stehen, die Zahl auf der Seite verliert sie — genau '
      + 'der Zustand, den sechs Wochen lang niemand gesehen hat.',
  }),
  Object.freeze({
    id: 'vorlauf-vom-fremden-pruefer',
    pruefer: 'test',
    was: 'Ein gesparter Vorlauf, der vom Lauf eines anderen Prüfers stammt',
    datei: 'shop/src/gegenprobenplan.js',
    art: 'ersetzen',
    suchen: "  if (vorige.pruefer !== jetzige.pruefer) return false;",
    ersetzen: '',
    erwartet: /Vorlauf entfällt nur nach einer geschlagenen Probe/,
    warum: 'Seit dem 7. September spart der Läufer den „vorher grün"-Lauf, wenn die vorige '
      + 'Probe denselben Prüfer hatte und geschlagen wurde — aus 315 Prüferläufen werden 251, '
      + 'und die Ersparnis liegt fast ganz bei den dreißig Testproben zu je 23 Sekunden. Die '
      + 'Bedingung „derselbe Prüfer" ist dabei die ganze Sicherheit: Ohne sie übernähme eine '
      + 'Probe das grüne Ergebnis eines **anderen** Prüfers als Beweis, dass ihr eigener '
      + 'vorher grün war — und das ist kein Beweis, sondern eine Verwechslung.',
  }),
  Object.freeze({
    id: 'gebot-auf-das-wort-statt-den-korb',
    pruefer: 'pruefe-preisalter',
    was: 'Ein Keyword, das auf einen überalterten Einkaufspreis zeigt und trotzdem schaltet',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: '  const keywordsGeschaltet = keywordsGedeckt.filter((k) => !altpreisig.has(k.Keyword));',
    ersetzen: '  const keywordsGeschaltet = keywordsGedeckt;',
    erwartet: /ruht ein Gebot/,
    baueVorher: true,
    warum: 'Der Befund vom 8. September: `pruefe-preisalter` bestimmte die gebotstragenden '
      + 'Artikel über die Referenzwarenkörbe. Die eigene Begründung des Moduls nannte zwei '
      + 'Gründe — „in keinem Keyword, in keinem Referenzkorb" —, und geprüft wurde nur der '
      + 'zweite; gemessen traf das geschaltete Keyword „Fassadendübel" einen Artikel mit '
      + '104 Tage altem Preis. Diese Mutation hebt Gate 29 auf und schaltet das Wort wieder '
      + 'mit. Dann ruht ein Gebot auf einem Preis über der Grenze, und genau das muss der '
      + 'Prüfer melden — beides zugleich: dass die Vereinigung aus Korb und Wort greift und '
      + 'dass Gate 29 der Grund für das Grün ist.',
  }),
  Object.freeze({
    id: 'ein-wort-mehr-und-die-liste-ist-leer',
    pruefer: 'kampagne',
    was: 'Ein Keyword, das mit einem Wort mehr keinen Artikel mehr findet',
    datei: 'shop/data/suchwoerter.json',
    art: 'ersetzen',
    suchen: '"wort": "fassade",',
    // **Nicht „fassadenwand".** Der erste Anlauf benannte so um und der Prüfer
    // meldete zu Recht grün: Die Suche vergleicht Wortstämme, „fassadenwand"
    // trägt „fassade" in sich, und die Zuordnung galt weiter. Eine Mutation,
    // die den gemeinten Bezug nicht löst, prüft den unveränderten Bestand.
    ersetzen: '"wort": "regenrinne",',
    erwartet: /Putzgrund Fassade/,
    baueVorher: true,
    warum: 'Der Befund vom 8. September: Die eigene Suche verlangt alle Wortstämme. '
      + '„Putzgrund" fand den Artikel, „Putzgrund Fassade" fand ihn nicht — ein zusätzliches '
      + 'Wort macht die Liste nicht genauer, sondern leer, und für genau dieses Wort wäre '
      + 'bezahlt worden. Gedeckt hat das ein Freibrief, der für Systemfragen geschrieben war '
      + 'und über allen dreien stand. Diese Mutation benennt das nachgetragene Suchwort um: '
      + 'Der Artikel ist dann über „Fassade" wieder unerreichbar, und die Kampagne muss sich '
      + 'weigern, statt das Wort zu schalten.',
  }),
  Object.freeze({
    id: 'korbtext-nennt-ein-anderes-bauteil',
    pruefer: 'pruefe-korbtext',
    was: 'Ein Klartext im Referenzwarenkorb, der ein anderes Bauteil nennt',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "was: 'Hochlochziegel', position: null }],",
    ersetzen: "was: 'Planziegel', position: null }],",
    erwartet: /Planziegel/,
    warum: 'Der Befund vom 8. September: Der Korb der Gruppe Mauerwerk trug „128 Planziegel" '
      + 'mit dem Klartext „Planziegel" — geführt ist ein Hochlochziegel mit Nut und Feder. '
      + 'Das Wort war zwölf Zeilen weiter oben in derselben Datei schon zurückgenommen '
      + 'worden, als Keyword; es blieb an der Stelle stehen, die rechnet. Der Korbtext geht '
      + 'nach außen und beschreibt zugleich die Rechnung, aus der das Höchstgebot entsteht. '
      + 'Diese Mutation setzt das falsche Bauteil wieder ein.',
  }),
  Object.freeze({
    id: 'karte-ohne-zeile-in-der-stueckliste',
    pruefer: 'pruefe-systemlisten',
    was: 'Ein Artikel in der Kopfzeile, den keine Zeile der Stückliste erklärt',
    datei: 'shop/inhalte/system/kanal-dn100.md',
    art: 'ersetzen',
    suchen: 'skus: POS-10095, POS-10115, POS-10116, POS-10134, POS-11133, POS-21382',
    ersetzen: 'skus: POS-10095, POS-10115, POS-10116, POS-10134, POS-11133, POS-21382, POS-29023',
    erwartet: /POS-29023|keine Zeile der Tabelle/,
    warum: 'Der Befund vom 8. September: `pruefe-systemlisten` meldete „5 von 8 lieferbar, 7 '
      + 'Artikel" — zwei Zahlen nebeneinander und nichts dazwischen. Die PAE-Folie stand in '
      + 'der Kopfzeile der Kanalliste, und keine Zeile ihrer Tabelle erklärt, wozu sie in '
      + 'einer Grundleitung gehört; das Verzeichnis führt sie als Estrichfolie in der Gruppe '
      + 'Zubehör. Die Seite zeigte sie trotzdem als Karte, weil sie ihre Artikelkarten aus '
      + 'genau dieser Kopfzeile baut. Diese Mutation setzt sie wieder ein.',
  }),
  Object.freeze({
    id: 'archiv-das-kein-fremdes-programm-oeffnet',
    pruefer: 'test',
    was: 'Ein Archiv, dessen Prüfsumme nur die eigene Umsetzung für richtig hält',
    datei: 'shop/src/paket.js',
    art: 'ersetzen',
    suchen: '  return (c ^ 0xffffffff) >>> 0;',
    ersetzen: '  return c >>> 0;',
    erwartet: /fremdes Programm kann das Archiv lesen|123456789/,
    warum: 'Das Paket vom 8. September geht an den Auftraggeber, und der packt es mit dem '
      + 'Programm aus, das er hat. Ein selbstgeschriebenes Archivformat, das nur die eigene '
      + 'Umsetzung öffnet, ist keines. Diese Mutation lässt die Schlussverknüpfung der '
      + 'Prüfsumme weg — das Archiv sieht unverändert aus, unsere eigenen Zahlen bleiben in '
      + 'sich stimmig, und `unzip -t` weist es zurück. Genau deshalb prüft der Testfall '
      + 'gegen ein fremdes Programm und nicht gegen sich selbst.',
  }),
  Object.freeze({
    id: 'verweis-auf-eine-seite-die-es-nicht-gibt',
    pruefer: 'pruefe-verweise',
    was: 'Ein Verweis auf eine Seite, die im Ausgabeordner fehlt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: '  <a class="korb" href="${verweis(\'warenkorb\')}" aria-label="Warenkorb">Warenkorb<span',
    ersetzen: '  <a class="korb" href="${verweis(\'warenkorb\')}x" aria-label="Warenkorb">Warenkorb<span',
    erwartet: /verweist auf|ins Leere/,
    baueVorher: true,
    warum: 'Am 8. September von Hand gemessen: 2.650 interne Verweise, keiner ins Leere. Ein '
      + 'Befund, den kein Werkzeug wiederholt, gilt für den Tag, an dem er erhoben wurde — '
      + 'der Bau benennt Seiten um, Gruppen kommen dazu, eine Vorlage ändert sich. Diese '
      + 'Mutation hängt einen Buchstaben an die Warenkorbadresse in der Kopfleiste: Der '
      + 'Verweis steht dann auf **jeder** der 82 Seiten und führt auf nichts. Drei dieser '
      + 'Seiten sind Endziele bezahlter Anzeigen zu 4,19 € bis 8,22 € je Klick.',
  }),
  Object.freeze({
    id: 'der-kopf-des-registers-zaehlt-anders-als-die-tabelle',
    pruefer: 'pruefe-gates',
    was: 'Ein maßgebliches Dokument, dessen erste Zeilen anders zählen als sein Inhalt',
    datei: 'docs/baustoff-shop/gate-register.md',
    art: 'ersetzen',
    /*
     * **Auf ein Muster umgestellt (10.09.).** Dieser Anker saß auf genau dem
     * Zahlwort, das sich mit jedem neuen Gate ändert, und ist dreimal
     * nachgezogen worden: 31 → 32 → 33. Jedes Mal fiel es erst auf, als der
     * Testlauf rot wurde. Das Muster beschreibt die Stelle, ohne ihren
     * beweglichen Teil festzuschreiben — `\S+` steht für das Zahlwort, wie es
     * gerade lautet.
     *
     * **Und `\S+` statt `\w+`, nach dem ersten Fehlschlag.** `\w` ist ASCII:
     * Es trifft „Dreiunddrei" und bleibt am „ß" stehen. Die Mutation ließ „ßig"
     * stehen und erzeugte „Vierundzwanzigßig" — der Prüfer meldete rot, aber
     * aus einem anderen Grund als dem gemeinten. Dieselbe Falle hat diesen
     * Bestand schon einmal erwischt: `\b` kennt „Ö" nicht als Wortzeichen, und
     * die ÖNORM-Regel traf deshalb nie.
     */
    suchenMuster: /\*\*Maßgeblich für alle Gate-Fragen\.\*\* \S+/,
    ersetzen: '**Maßgeblich für alle Gate-Fragen.** Vierundzwanzig',
    erwartet: /kopfzahl-abgeloest/,
    warum: 'Der Zustand vom 9. September, morgens: Die dritte Zeile sagte „Vierundzwanzig '
      + 'Entscheidungen", die Überschrift siebenunddreißig Zeilen tiefer „Die einunddreißig '
      + 'Gates". Es ist die Datei, auf die die PR-Beschreibung mit „Bei Gate-Fragen gilt" '
      + 'zeigt — wer sie öffnet und nach drei Zeilen weiß, was er wissen wollte, geht mit '
      + 'der falschen Zahl. Der Prüfer zählte die Gates ohnehin und hielt seine Zahl nie '
      + 'gegen die gedruckte. Die Mutation setzt das alte Zahlwort zurück und verlangt, '
      + 'dass der Prüfer den Unterschied nennt.',
  }),
  Object.freeze({
    id: 'der-haken-ruft-einen-pruefer-der-nicht-mehr-so-heisst',
    pruefer: 'pruefe-haken',
    was: 'Ein Haken, der auf ein Werkzeug zeigt, das er nicht mehr aufruft',
    datei: 'shop/src/haken.js',
    art: 'ersetzen',
    // **Kürzer angesetzt am 9. September 2026.** Dieser Suchtext war zweimal
    // die ganze Zeile und ist zweimal ins Leere gelaufen, weil die Zeile einen
    // Eintrag mehr bekam — beim zweiten Mal am selben Tag. Eine Gegenprobe
    // hängt an einem Satz, und ein Satz, der bei jeder Erweiterung anders
    // lautet, ist ein schlechter Anker. Gesucht wird jetzt die **kleinste**
    // Stelle, die den Ort eindeutig bezeichnet: der Eintrag selbst, nicht die
    // Liste um ihn herum. Der Registertest hält fest, dass sie genau einmal
    // vorkommt — im Kopfkommentar steht der Name ohne Anführungszeichen.
    suchen: "      'bin/mutationspruefung.mjs',",
    ersetzen: "      'bin/mutationswache.mjs',",
    erwartet: /haken-ruft-nicht/,
    warum: 'Der Fall vom 8. September: Ein Commit dieses Loops nahm eine laufende Gegenprobe '
      + 'mit und stellte damit pruefe-schaufenster blind. Der Haken hält das seither auf — '
      + 'aber nur, solange er wirklich die Mutationsprüfung ruft. Wird das Werkzeug einmal '
      + 'umbenannt und der Haken nicht, steht die Datei weiter da, ist ausführbar, ist im '
      + 'Register genannt und hält nichts mehr auf. Diese Mutation benennt im Register um, '
      + 'was der Haken zu rufen hat, und verlangt, dass der Prüfer den Inhalt liest und '
      + 'nicht nur den Dateinamen.',
  }),
  Object.freeze({
    id: 'eine-aufgabe-fuer-drei-begriffe-die-es-nicht-mehr-gibt',
    pruefer: 'pruefe-punkte',
    was: 'Eine Zahl in der Aufgabenliste, die älter ist als der Bestand',
    datei: 'shop/src/offenepunkte.js',
    art: 'ersetzen',
    baueVorher: true,
    /*
     * **Auf ein Muster umgestellt (10.09.).** Die Zahl der Begriffe ist seit
     * dem 6. September zweimal gefallen (31 → 29), weil Gate 29 und die
     * Landeseite je einen zurückstellten. Der Anker meint die Aufgabe, nicht
     * ihren Zählstand.
     */
    suchenMuster: /    titel: 'Suchvolumen der \d+ Keywords im Liefergebiet messen',/,
    ersetzen: "    titel: 'Suchvolumen der 32 Keywords im Liefergebiet messen',",
    erwartet: /zahl-veraltet|Begriffe der Messliste/,
    warum: 'Der Fall vom 8. September: Der Punkt stand auf 32, während die Messliste seit '
      + 'dem 6. September 29 Begriffe führt — zwei hat die Landeseite verneint, einen hat '
      + 'Gate 29 zurückgestellt. Der Schaden ist nicht die Zahl, sondern die Aufgabe: Der '
      + 'Auftraggeber soll für drei Begriffe Suchvolumen holen, für die keine Anzeige mehr '
      + 'läuft. src/offenepunkte.js sagt in seinem eigenen Kopf, dass eine von Hand '
      + 'fortgeschriebene Liste an dem Tag falsch ist, an dem jemand einen Punkt schließt — '
      + 'das galt für die Punkte und nicht für die Sätze in ihnen.',
  }),
  Object.freeze({
    id: 'ein-brief-der-sich-selbst-falsch-zaehlt',
    pruefer: 'pruefe-anfrage',
    was: 'Ein Brief an einen Dritten, der seine eigenen Fragen falsch zählt',
    datei: 'shop/src/lieferantenanfrage.js',
    art: 'ersetzen',
    suchen: '      + `brauchen wir ${zahlwort(fragen.length)} Auskünfte.`,',
    ersetzen: "      + 'brauchen wir vier Auskünfte.',",
    erwartet: /brief-zaehlt-falsch|sagt „vier"/,
    warum: 'Der Zustand bis zum 8. September: Der Brief sagte im ersten und im letzten Absatz '
      + '„vier Auskünfte" und stellte sechs Fragen. Angefangen hatte er mit vier; am '
      + '3. September kam die fünfte dazu, am 6. September die sechste. Der Kopfkommentar '
      + 'derselben Datei hält den ersten Schritt sogar fest — geändert wurde die Zahl im '
      + 'Kommentar und nicht im Brief. Eine Zahl, die als Wort dasteht, findet kein Muster, '
      + 'das nach Ziffern sucht, und dies ist das einzige Dokument dieses Bestands, das an '
      + 'einen Dritten geht. Diese Mutation schreibt die Zahl wieder aus.',
  }),
  Object.freeze({
    id: 'eine-luecke-die-der-brief-nicht-mehr-nennt',
    pruefer: 'pruefe-anfrage',
    was: 'Eine Sortimentslücke, die stillschweigend zum eigenen Gewerk erklärt wird',
    datei: 'shop/inhalte/system/kanal-dn100.md',
    art: 'ersetzen',
    suchen: '| 6 | Gleitmittel *(nicht im Sortiment)* | nach Anzahl der Steckverbindungen | **ja** |',
    ersetzen: '| 6 | Gleitmittel *(nicht im Sortiment)* | nach Anzahl der Steckverbindungen | eigenes Gewerk |',
    erwartet: /gewerk-ohne-eintrag|Gleitmittel/,
    warum: 'Der Brief an den Lieferanten nennt seit dem 8. September die vier Positionen, die '
      + 'unsere eigenen Systemlisten führen und unser Sortiment nicht hergibt — gemessen aus '
      + 'den Listen, nicht getippt. Der bequemste Weg, eine Lücke loszuwerden, ist, sie zum '
      + 'eigenen Gewerk zu erklären: Dann steht die Marke weiter offen in der Tabelle, der '
      + 'Kunde liest dasselbe, und die Frage an den Lieferanten fällt weg. Diese Mutation '
      + 'tut genau das mit dem Gleitmittel und verlangt, dass jede solche Erklärung einen '
      + 'Eintrag mit Grund hat.',
  }),
  Object.freeze({
    id: 'die-kasse-schweigt-zum-gemischten-system',
    pruefer: 'pruefe-systemtreue',
    was: 'Ein Warenkorb aus zwei Systemen, der den Kunden nichts davon merken lässt',
    datei: 'shop/src/shopkern.js',
    art: 'ersetzen',
    suchen: '  if (bruch) offen.push(systembruchsatz(bruch));',
    ersetzen: '  if (false && bruch) offen.push(systembruchsatz(bruch));',
    erwartet: /kasse-schweigt|nichts davon/,
    warum: 'Der Zustand bis zum 8. September. Die eigene Wissensseite sagt seit dem ersten '
      + 'Tag, dass ein WDVS als Kombination geprüft wird und wer den Klebemörtel des einen '
      + 'Herstellers mit dem Gewebe eines anderen kombiniert die Zulassung verlässt — und der '
      + 'Katalog führt genau diese beiden Paare. Der Warenkorb rechnete sie anstandslos '
      + 'zusammen. Diese Mutation lässt die Erkennung im Modul stehen und schneidet nur den '
      + 'Weg zum Kunden ab: Eine Regel, die niemand hinausträgt, ist keine — dasselbe Muster '
      + 'wie bei den sieben Sperren ohne grünen Fall.',
  }),
  Object.freeze({
    id: 'eine-ausrede-die-ihren-anlass-ueberlebt',
    pruefer: 'pruefe-systemtreue',
    was: 'Ein Gewerk, das „nicht bestimmbar" heißt, ohne den Artikel zu nennen, an dem es scheitert',
    datei: 'shop/src/systemtreue.js',
    art: 'ersetzen',
    suchen: "    sku: 'POS-18110',",
    ersetzen: "    sku: 'POS-00000',",
    erwartet: /unbekannt-ohne-artikel|nicht mehr/,
    warum: 'Der Kaminzug behauptet die Systemtreue in seinem ersten Satz und lässt sich am '
      + 'Katalog nicht messen: Die Systemmarke steht in vier Schreibweisen, und der '
      + 'Mantelsteinkleber RMRTL trägt gar keine — ausgerechnet der Dünnbettmörtel, den '
      + 'dieselbe Seite als systemgebunden hervorhebt. Ein solcher Eintrag muss den Artikel '
      + 'nennen, an dem er scheitert: Verschwindet der, ist die Frage neu zu stellen. Sonst '
      + 'bliebe eine Begründung stehen, deren Anlass es nicht mehr gibt — und aus einem '
      + 'Befund würde eine Ausrede.',
  }),
  Object.freeze({
    id: 'eine-zweite-markenliste',
    pruefer: 'pruefe-systemtreue',
    was: 'Eine zweite Markenliste neben der einen in src/hersteller.js',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: 'const MARKEN = Object.keys(HERSTELLER);',
    ersetzen: "const MARKEN = ['Capatect', 'Baumit', 'Soudal'];",
    erwartet: /zweite-markenliste|src\/hersteller\.js/,
    warum: 'Der Zustand bis zum 8. September abends: Der Bestand führte drei Markenlisten. '
      + '`HERSTELLER` (neun Namen, mit Merkblattadresse), `MARKEN` in der Kampagne (elf, für '
      + 'die Anzeigen-Keywords) und seit einer Stunde eine dritte in `systemtreue.js`. Sie '
      + 'waren nicht deckungsgleich, und beide Richtungen hatten Folgen: Vier Artikel wurden '
      + 'als Markenbegriff beworben und sagten auf ihrer Seite, der Hersteller sei unbekannt; '
      + 'zwei Kaminteile hatten den Hersteller und ihre Marke floss in kein Keyword. Diese '
      + 'Mutation legt die zweite Liste wieder an.',
  }),
  Object.freeze({
    id: 'eine-frage-die-schliesst-ohne-zu-nennen',
    pruefer: 'pruefe-anfrage',
    was: 'Eine Frage, die einen Punkt zu schließen behauptet, ohne ihn zu nennen',
    datei: 'shop/bin/anfragepruefung.mjs',
    art: 'ersetzen',
    suchen: '      ohneAdresse: zuNennen[1].nennt,',
    ersetzen: '      ohneAdresse: [],',
    erwartet: /luecke-ungenannt|nennt aber nicht/,
    warum: 'Der Zustand vom 8. September abends: Die Frage nach der Artikelliste schloss '
      + 'sieben offene Punkte und nannte nur drei. Ein Lieferant schickt, wonach er gefragt '
      + 'wird — steht die Marke nicht im Brief, kommt die Zeile mit der Merkblattadresse '
      + 'vielleicht mit und vielleicht nicht. Der Auftraggeber hat genau ein Gespräch, und '
      + 'der Unterschied kostet ihn eine zweite Runde. Diese Mutation lässt die vier Marken '
      + 'aus dem Brief fallen und verlangt, dass die Deckung das merkt.',
  }),
  Object.freeze({
    id: 'eine-anfrage-ohne-ihre-warengruppe',
    pruefer: 'pruefe-belege',
    was: 'Eine Anfrage, die im Postfach von jeder anderen nicht zu unterscheiden ist',
    datei: 'shop/src/kundenanfrage.js',
    art: 'ersetzen',
    suchen: '    zeilen.push(`Warengruppen: ${gruppenImKorb(rechnung).join(\', \')}`);',
    ersetzen: '    zeilen.push(\'Warengruppen: siehe Positionen\');',
    erwartet: /gruppe-ungenannt|nennt die Gruppe nicht/,
    warum: 'Der Versuch läuft über drei Anzeigengruppen mit Klickpreisen von 4,19 € bis '
      + '9,41 €, und nach fünfundvierzig Tagen soll je Gruppe entschieden werden, ob der '
      + 'Klick sich trägt. Zählen kann der Betreiber nur, was die Mail ihm sagt: Der Shop '
      + 'überträgt nichts, mailto öffnet das Programm des Kunden, und eine Zählmarke '
      + 'verbietet die gemessene Datenschutzzusage. Diese Mutation ersetzt die Gruppennamen '
      + 'durch einen Verweis auf die Positionen — lesbar für einen Menschen, unbrauchbar '
      + 'für eine Auszählung von fünfundvierzig Tagen.',
  }),
  Object.freeze({
    id: 'llms-txt-verschweigt-die-luecke',
    pruefer: 'pruefe-systemlisten',
    was: 'Eine Systemliste, die einem Assistenten als vollständig bestellbar erscheint',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '          ? ` — davon liefern wir ${gelesen.ohneSortiment} von ${gelesen.positionen} Positionen nicht`',
    ersetzen: '          ? \'\'',
    erwartet: /system-unqualifiziert|vollständig bestellbar/,
    warum: 'llms.txt ist die Datei, für die dieser Shop laut Abnahmeliste überhaupt so '
      + 'geschrieben ist. Sie führte die vier Systemseiten mit ihrer Frage und sagte nicht, '
      + 'dass drei von acht Positionen der Grundleitung nicht im Sortiment sind — die Seite '
      + 'kennzeichnet es, die JSON-LD-ItemList trägt es, die maschinenlesbare Datei nicht. '
      + 'Ein Assistent empfiehlt dann „dort bekommst du die ganze Grundleitung", und es sind '
      + 'genau die drei Positionen, die dieselbe Liste als wird-oft-vergessen führt. Diese '
      + 'Mutation nimmt den Zusatz wieder heraus.',
  }),
  Object.freeze({
    id: 'llms-txt-verschweigt-das-system',
    pruefer: 'pruefe-systemtreue',
    was: 'Eine Artikelzeile, aus der ein Assistent zwei Systeme mischt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "        const system = e.schicht && e.system ? ` · ${e.schicht} des Systems ${e.system}` : '';",
    ersetzen: "        const system = '';",
    erwartet: /schicht-ohne-system-in-llms|Zeile schweigt/,
    warum: 'Die Kasse warnt seit dem 8. September, wenn ein Warenkorb Schichten zweier '
      + 'Hersteller mischt. llms.txt ist die Datei, aus der ein Assistent eine Bestellliste '
      + 'zusammenstellt — sie führte Capatect Glasgewebe zu 1,07 € und Baumit '
      + 'TextilglasGitter zu 1,19 € in derselben Gruppe, ohne Unterschied. Diese Mutation '
      + 'nimmt die Systemangabe aus den Zeilen und lässt den Satz im Vorspann stehen: Ein '
      + 'Assistent liest die Zeile, nicht den Vorspann.',
  }),
  Object.freeze({
    id: 'suche-ohne-die-dienstseiten',
    pruefer: 'test',
    was: 'Eine Suche, die nur das Sortiment kennt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "      ...DIENSTSEITEN.map((s) => ({ ...s, gruppe: null })),",
    ersetzen: '',
    erwartet: /diese Fragen an den Shop bleiben ohne Antwort/,
    warum: 'Der Zustand bis zum 10. September: Der ausgelieferte Suchindex trug 46 Artikel und '
      + '24 Inhaltsseiten. Gemessen an zwanzig Fragen, die ein Besteller vor dem Absenden stellt '
      + '— kranentladung, versandkosten, widerruf, rügefrist, impressum, vorkasse —, fand er '
      + 'zwei. Und „lieferung" führte auf die Gruppenseite „Zubehör und Kleinteile". Für den '
      + 'bezahlten Klick heißt das: Der Besucher landet auf einer Gruppenseite, tippt seine '
      + 'Frage und liest „nichts gefunden", obwohl die Antwort im Haus liegt.',
  }),
  Object.freeze({
    id: 'karte-ohne-auskunft-zur-liste',
    pruefer: 'pruefe-seiten',
    was: 'Eine Artikelkarte, die zum Abstand zur Liste schweigt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "  if (abstand === null && !a.amListendeckel && !beipack) {\n    marker.push('<span class=\"marker offen\">Listenpreis nicht bekannt</span>');\n  }",
    ersetzen: '',
    erwartet: /karte-ohne-auskunft/,
    warum: 'Der Zustand bis zum 10. September: Die Wissensseite sagte zweimal, der Abstand zur '
      + 'Liste stehe „auf jeder Artikelkarte" — gemessen stand er auf 39 von 46. Drei der '
      + 'übrigen tragen „Beipack" und damit die Auskunft, vier trugen nichts. Eine leere Stelle '
      + 'sieht aus wie ein Artikel ohne Vorteil, und der Leser kann beides nicht unterscheiden. '
      + 'Die Mutation nimmt den Grund wieder heraus.',
  }),
  Object.freeze({
    id: 'pruefer-die-den-text-nicht-kennen',
    pruefer: 'pruefe-inhalte',
    was: 'Eine Seite, die ihren Prüfprogrammen Unabhängigkeit vom Text nachsagt',
    datei: 'shop/inhalte/wissen/redaktionsprinzipien.md',
    art: 'ersetzen',
    suchen: "deshalb gegen Prüfprogramme, die das fertige Erzeugnis messen und nicht die\nAbsicht: Sie halten Zahlen gegen ihre Quelle",
    ersetzen: "deshalb gegen Prüfprogramme, die unabhängig vom Text entstehen und ihn nicht\nkennen: Sie halten Zahlen gegen ihre Quelle",
    erwartet: /unabh(?:ä|ae)ngig vom Text|den geprüften Text nicht kennen/,
    warum: 'Wörtlich der Zustand bis zum 10. September abends, auf der Seite, die erklärt, wie '
      + 'hier geprüft wird. An **diesem Tag** sind vier der laufenden Regeln aus Sätzen dieses '
      + 'Bestands entstanden — deshalb gibt es `src/umschreibung.js`, das ihre Reichweite misst. '
      + 'Eine Zusage über den eigenen Betrieb ist teurer als eine falsche Zahl: Sie lässt sich '
      + 'nicht nachrechnen, nur glauben.',
  }),
  Object.freeze({
    id: 'norm-ohne-ihre-ausgabe',
    pruefer: 'pruefe-inhalte',
    was: 'Eine Norm, die auf einer Kundenseite ohne ihre Ausgabe steht',
    datei: 'shop/inhalte/wissen/kanal-was-zusammengehoert.md',
    art: 'ersetzen',
    suchen: "— für den Regelfall nennt ÖNORM B 2501 aber Untergrenzen.",
    ersetzen: "— für den Regelfall nennt ÖNORM B 5017 aber Untergrenzen.",
    erwartet: /norm-ohne-ausgabe/,
    warum: 'Die dritte Redaktionsregel verlangt Nummer **und** Ausgabe; gemessen wurde bis zum '
      + '10. September nur die Nummer. Die Mutation setzt in den Vorspann eine zweite '
      + 'Normnummer, die sonst nirgends vorkommt — der häufigste Fall in der Praxis: Eine Norm '
      + 'wird genannt, und ihre Ausgabe steht nirgends. Die Ausgabe der bereits zitierten Norm '
      + 'aus derselben Seite herauszunehmen, hätte nicht gereicht: Sie steht dort dreimal, und '
      + 'jede Nennung in Sichtweite deckt die erste.',
  }),
  Object.freeze({
    id: 'uebernahme-ohne-einen-einzigen-kennwert',
    pruefer: 'pruefe-inhalte',
    was: 'Eine Seite, die verspricht, Kennwerte zu übernehmen, ohne einen einzigen zu tragen',
    datei: 'shop/inhalte/wissen/redaktionsprinzipien.md',
    art: 'ersetzen',
    suchen: "Herkunft, oder sie steht nicht da. Technische Kennwerte schreiben wir nicht ab\n— weder aus dem Merkblatt noch aus dem Gedächtnis: Wo eine Merkblattadresse\ndes Herstellers bekannt ist, steht der Verweis darauf; wo keine bekannt ist,\nsagt die Artikelseite, dass der Wert fehlt.",
    ersetzen: "Herkunft, oder sie steht nicht da. Technische Kennwerte werden aus dem\nDatenblatt des Herstellers übernommen und verlinkt.",
    erwartet: /uebernahme-ohne-kennwert/,
    warum: 'Wörtlich der Zustand bis zum 10. September, auf der Seite, die von sich sagt, sie '
      + 'erkläre, wie hier geprüft wird. Keine der 82 gebauten Seiten trägt einen '
      + 'Verbrauchswert, eine Schichtdicke oder eine Verarbeitungstemperatur; die zweite Regel '
      + 'derselben Seite sagte das die ganze Zeit richtig, der Vorspann widersprach ihr. Eine '
      + 'Stunde zuvor war derselbe Anspruch in llms.txt berichtigt worden — und blieb hier '
      + 'stehen.',
  }),
  Object.freeze({
    id: 'selbstbeschreibung-fuer-alle-behauptet',
    pruefer: 'test',
    was: 'Eine Datei für Maschinen, die den eigenen Bau besser beschreibt als er ist',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "    merkblattsatz(merkblattdeckung(\n      fertig.filter((f) => f.id.startsWith('artikel/')).map((f) => ({ name: f.id, html: f.html })),\n    ).mitVerweis, katalog.artikel.length),",
    ersetzen: "    '- Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller verlinkt.',",
    erwartet: /selbstbeschreibung-haelt-nicht|24 von 46/,
    warum: 'Der Zustand bis zum 10. September: `llms.txt` sagte jedem Assistenten, technische '
      + 'Kennwerte würden beim Hersteller verlinkt. Auf 24 von 46 Artikelseiten stimmt das; auf '
      + 'den übrigen 22 steht offen, dass kein Merkblatt vorliegt. Die Mutation setzt den '
      + 'kurzen Satz zurück — eine Selbstbeschreibung ist eine Zusage wie jede andere, nur '
      + 'liest sie niemand nach, weil sie über den eigenen Bau spricht.',
  }),
  Object.freeze({
    id: 'abholsuche-wieder-beworben',
    pruefer: 'test',
    was: 'Bezahlte Klicks auf eine Suche nach etwas, das dieser Betrieb nicht kann',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "  for (const w of abholungsausschluss(abholung)) {",
    ersetzen: '  for (const w of []) {',
    erwartet: /nicht zugesagt und trotzdem beworben/,
    warum: 'Der Zustand bis zum 10. September: „abholung" stand absichtlich **nicht** auf der '
      + 'Ausschlussliste, begründet mit einem wörtlichen Zitat der Lieferseite, das seit dem '
      + '6. September falsch war. Wer „baustoffe abholen perg" tippt, wollte genau das eine, '
      + 'was dieser Betrieb nicht kann — bei 4,19 € bis 8,22 € je Klick. Die Mutation nimmt '
      + 'den abgeleiteten Ausschluss wieder heraus.',
  }),
  Object.freeze({
    id: 'abholzusage-nur-in-zwei-worten',
    pruefer: 'pruefe-umschreibung',
    was: 'Die Abholzusage, zurück auf die zwei Formulierungen ihres Anlasses',
    datei: 'shop/src/abholung.js',
    art: 'ersetzen',
    suchen: "|(?:k(?:ö|oe)nnen|k(?:ö|oe)nnt?|d(?:ü|ue)rfen)\\s+(?:Sie\\s+)?[^.!?]{0,40}?abholen|Selbstabholer\\s+(?:sparen|zahlen|erhalten|bekommen)|Abholung\\s+nach Vereinbarung|zur\\s+Abholung\\s+(?:bereit|bereitstellen|bereitgestellt)|am\\s+Lager\\s+(?:ü|ue)bernommen|holen\\s+Sie\\s+selbst\\s+ab",
    ersetzen: '',
    erwartet: /regel-verengt/,
    warum: 'Der Zustand bis zum 10. September abends: Das Muster fing „Abholung ist möglich" und '
      + '„wer selbst abholt, zahlt keine Fracht" — und keine der sechs Formulierungen, die ein '
      + 'Shoptext zuerst wählt. Die Zusage ist keine Formalie: Es gibt kein eigenes Lager, und '
      + 'ob Kunden beim Lieferanten abholen dürfen, ist dort angefragt und unbeantwortet.',
  }),
  Object.freeze({
    id: 'reichweite-einer-jungen-regel',
    pruefer: 'pruefe-umschreibung',
    was: 'Eine Regel vom selben Tag, zurück auf die Sätze, aus denen sie gebaut wurde',
    datei: 'shop/src/lieferungen.js',
    art: 'ersetzen',
    suchen: "|(?:zwei|drei|mehrere[nr]?)\\s+(?:Fuhren|Teilmengen|Teilsendungen)|\\bin (?:Etappen|Teilmengen)\\b|eigene\\s+Fuhre",
    ersetzen: '',
    erwartet: /regel-verengt/,
    warum: 'Die Mutation setzt `MEHRLIEFERUNG` auf ihren ersten Wurf vom 10. September vormittags '
      + 'zurück — auf die vier Sätze, die an dem Morgen im Bestand standen. In dieser Fassung '
      + 'fing sie 0 von 5 Umschreibungen, und gefunden hat das nicht das Lesen, sondern die '
      + 'Reichweitenmessung am selben Nachmittag. Die Probe hält fest, dass die Messung genau '
      + 'diesen Rückschritt sieht.',
  }),
  Object.freeze({
    id: 'vorratsregel-wieder-verengt',
    pruefer: 'pruefe-umschreibung',
    was: 'Eine Textregel, die auf ihren eigenen Beispielsatz zurückgeschrumpft ist',
    datei: 'shop/src/inhaltspruefung.js',
    art: 'ersetzen',
    suchen: "|\\b(?:immer|st(?:ä|ae)ndig|stets)\\s+(?:bei uns\\s+)?da\\b|aus\\s+(?:unserem|eigenem)\\s+(?:Bestand|Lager)\\b|liegt\\s+(?:bei uns|hier)\\s+bereit\\b|\\bbevorratet\\b|\\bBevorratung\\b",
    ersetzen: '',
    erwartet: /regel-verengt/,
    warum: 'Die Mutation setzt das Vorratsmuster auf den Stand vom 31. August zurück — auf die '
      + 'Wörter, gegen die es geschrieben wurde. Bis zum 10. September war das der Zustand, und '
      + 'kein Prüfer hat gemerkt, dass „Wir haben die gängigen Größen immer da" durchgeht. Genau '
      + 'das ist die Frage, die dieser Prüfer stellt: nicht ob die Regel anschlägt, sondern wie '
      + 'weit sie reicht.',
  }),
  Object.freeze({
    id: 'angebot-verspricht-teillieferungen',
    pruefer: 'pruefe-belege',
    was: 'Ein Angebot mit Bindefrist, das Teillieferungen zum Regelfall erklärt',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: "    'Lieferung im Streckengeschäft: Die Ware geht vom Lieferanten direkt zur',\n"
      + "    'Baustelle, ein eigenes Lager gibt es nicht. Alle geführten Artikel kommen',\n"
      + "    'von einem Lieferanten; dieses Angebot ist deshalb eine Lieferung mit einer',\n"
      + "    'Frachtpauschale. Kommt ein zweiter Lieferant dazu, entsteht je Lieferant',\n"
      + "    'eine eigene Lieferung, und die Pauschale fällt für jede an.',",
    ersetzen: "    'Lieferung im Streckengeschäft ab Werk der Hersteller; Teillieferungen je',\n"
      + "    'Lieferant sind der Regelfall und werden nicht gesondert berechnet.',",
    erwartet: /mehrlieferung-ohne-bedingung/,
    warum: 'Wörtlich der Satz, der bis zum 10. September auf jedem Angebot stand — auf einem '
      + 'Beleg mit Bindefrist, also einer Zusage. Er hat drei Fehler: Die Ware kommt nicht ab '
      + 'Werk, Teillieferungen gibt es bei einem Lieferanten nicht, und „nicht gesondert '
      + 'berechnet" widerspricht Punkt 5 der eigenen AGB, wo die Fracht je Lieferung anfällt. '
      + 'Gefunden hat ihn nicht das Lesen, sondern der neue Prüfer bei seinem ersten Lauf.',
  }),
  Object.freeze({
    id: 'agb-macht-teillieferungen-zum-regelfall',
    pruefer: 'pruefe-seiten',
    was: 'Eine AGB-Klausel, die Teillieferungen zum Regelfall erklärt',
    datei: 'shop/src/rechtstexte.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "      'Die Ware geht vom Lieferanten direkt zur Baustelle; ein eigenes Lager gibt es nicht. ' +\n"
      + "      'Alle geführten Artikel kommen derzeit von einem Lieferanten, eine Bestellung ist ' +\n"
      + "      'deshalb eine Lieferung. Kommt ein zweiter Lieferant dazu, entsteht je Lieferant eine ' +\n"
      + "      'eigene Lieferung mit eigener Anfahrt.',",
    ersetzen: "      'Direktversand durch den Hersteller; Teillieferungen je Lieferant sind der Regelfall.',",
    erwartet: /mehrlieferung-ohne-bedingung/,
    warum: 'Der Zustand der AGB bis zum 10. September. Der Befund vom 6. September hat vier '
      + 'Kundenflächen erreicht und diese nicht — das Muster von damals kennt nur die dort '
      + 'berichtigte Formulierung. Die Mutation misst das Erzeugnis: Die Klausel steht auf '
      + 'der gebauten AGB-Seite, und dort trägt sie keinen Satz über die Zahl der Lieferanten.',
  }),
  Object.freeze({
    id: 'wissensseite-buendelt-was-nicht-geteilt-ist',
    pruefer: 'pruefe-inhalte',
    was: 'Eine Zusage, drei Teillieferungen zu bündeln, die es nicht gibt',
    datei: 'shop/inhalte/wissen/warum-keine-gratislieferung.md',
    art: 'ersetzen',
    suchen: '- **Eine Lieferung, ein Termin.** Alle geführten Artikel kommen von einem\n'
      + '  Lieferanten; ein Warenkorb ist deshalb eine Lieferung mit einer Anfahrt.\n'
      + '  Kommt ein zweiter Lieferant dazu, wird daraus je Lieferant eine eigene.\n'
      + '  (Bis zum 10. September stand hier „wir bündeln, was auf dieselbe Baustelle\n'
      + '  geht, statt drei Teillieferungen zu fahren" — der Shop fährt nicht, und\n'
      + '  drei Teillieferungen kann es bei einem Lieferanten nicht geben.)',
    ersetzen: '- **Eine Lieferung, ein Termin.** Wir bündeln, was auf dieselbe Baustelle\n'
      + '  geht, statt drei Teillieferungen zu fahren.',
    erwartet: /mehrlieferung-ohne-bedingung/,
    warum: 'Die dritte Formulierung derselben Behauptung, wörtlich vom Bestand. Sie verspricht '
      + 'außerdem eine Tätigkeit, die dieser Betrieb nicht ausübt: Gefahren wird von der '
      + 'Spedition des Lieferanten, ein eigenes Lager zum Bündeln gibt es nicht — dieselbe '
      + 'Sorte Zusage wie der Rat zum Abholen, der am 6. September aus demselben Absatz '
      + 'genommen wurde.',
  }),
  Object.freeze({
    id: 'untergrenze-auf-der-inhaltsseite',
    pruefer: 'pruefe-inhalte',
    was: 'Eine Inhaltsseite, die eine andere Bestellgrenze nennt als die geltende',
    datei: 'shop/inhalte/wissen/warum-keine-gratislieferung.md',
    art: 'ersetzen',
    suchen: 'Unter 250 Euro netto Warenwert je Lieferung',
    ersetzen: 'Unter 400 Euro netto Warenwert je Lieferung',
    erwartet: /nennt 400 € als untere Bestellgrenze/,
    warum: 'Der Zustand vom 3. bis zum 10. September, wörtlich. Gate 25 hat am 3. September '
      + 'die Lieferseite berichtigt; auf dieser Wissensseite blieben „etwa 400 Euro" stehen — '
      + 'der Nulldurchgang einer Kostenrechnung vom 25. August mit einer Marge, die am Tag '
      + 'darauf abgelöst wurde. Am 6. September hat ein Lauf denselben Absatz angefasst und '
      + 'die Zahl danebenstehen lassen. Kein Prüfer hat je nachgerechnet, welche Zahl dort '
      + 'steht.',
  }),
  Object.freeze({
    id: 'untergrenze-auf-der-gebauten-seite',
    pruefer: 'pruefe-seiten',
    was: 'Ein angehängter Grenzabsatz mit einem Betrag, den niemand entschieden hat',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: 'Mindestbestellwert ${euro(MINDESTWERT_NETTO)} € netto',
    ersetzen: 'Mindestbestellwert ${euro(MINDESTWERT_NETTO + 50)} € netto',
    erwartet: /nennt 300,00 € als untere Bestellgrenze/,
    warum: 'Die andere Richtung derselben Regel: nicht die handgeschriebene Seite, sondern '
      + 'der Absatz, den der Bau selbst auf 20 Kundenseiten hängt. Er nimmt die Zahl heute '
      + 'aus `data/betreiber.json` und ist damit richtig „von selbst" — genau die Sorte '
      + 'Richtigkeit, die niemand bemerkt, wenn sie aufhört. Die Mutation legt 50 € drauf.',
  }),
  Object.freeze({
    id: 'gate-nummer-im-angehaengten-absatz',
    pruefer: 'website',
    was: 'Eine interne Gate-Nummer in einem Absatz, den erst der Rahmen anhängt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: '(Quelle: eigene Entscheidung, Stand: ${MINDESTWERT_STAND}).',
    ersetzen: '(Quelle: eigene Entscheidung, Gate 25, Stand: ${MINDESTWERT_STAND}).',
    erwartet: /Interna auf der fertigen Seite/,
    warum: 'Wörtlich der Zustand vom 5. bis zum 10. September: Diese Zeile stand auf zwanzig '
      + 'Kundenseiten, und die Interna-Prüfung des Baus sah sie nie — sie las `seite.html`, '
      + 'also den Rumpf vor dem Rahmen. Die Mutation setzt die Gate-Nummer zurück; rot werden '
      + 'darf jetzt nur die Prüfung am Erzeugnis, denn im Rumpf steht der Absatz nicht.',
  }),
  Object.freeze({
    id: 'absage-ohne-naechsten-schritt',
    pruefer: 'shopprobe',
    was: 'Eine Absage im leeren Suchergebnis, die nicht sagt, was es stattdessen gibt',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "        return String(s.id).indexOf('gruppe/') === 0;",
    ersetzen: "        return String(s.id).indexOf('gruppe/') === 1;",
    erwartet: /Wer nichts findet|absatz=\[KEINER\]|gruppen=0/,
    warum: 'Der Zustand bis zum 10. September: Das leere Suchergebnis sagte wahrheitsgemäß '
      + '„Was nicht darin steht, führen wir nicht" und hörte dort auf. Gemessen an '
      + 'vierundzwanzig Baustoffwörtern, die dieser Shop nicht führt, endeten neunzehn auf '
      + 'einer Seite ohne nächsten Schritt — bei einem Klick, der zwischen 4,19 € und 8,22 € '
      + 'kostet. Die Mutation lässt den Filter ins Leere greifen, statt den Block zu löschen: '
      + 'So bleibt der Zweig stehen und die Liste wird still leer, also genau der Fehler, den '
      + 'niemand am fehlenden Code bemerkt. Gemessen wird an der ausgelieferten Seite, und '
      + 'das Szenario folgt dem ersten Verweis, statt nur seine Adresse zu lesen.',
  }),
  Object.freeze({
    id: 'beleg-mit-fremdem-stand',
    pruefer: 'pruefe-seiten',
    was: 'Ein Quellenbeleg, der den Stand einer anderen Sache nennt',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '§ 862 ABGB, Stand: ${esc(BINDEFRIST.stand)}).',
    ersetzen: '§ 862 ABGB, Stand: ${esc(a.preisStand)}).',
    erwartet: /stand-uneinheitlich|verschiedene Stände/,
    warum: 'Wörtlich der Zustand vom 6. bis zum 10. September: Die Artikelseite belegte die '
      + 'Bindefrist des Angebots — eine Zahl aus der eigenen Belegvorlage — mit dem Preisstand '
      + 'des jeweiligen Artikels. Auf 46 Seiten standen acht verschiedene Daten für eine einzige '
      + 'Regel; die älteste ließ sie 141 Tage alt aussehen, die jüngste 24. Sieben der acht '
      + 'Quellenstempel des Auftritts nannten je genau einen Stand. Die Mutation setzt den '
      + 'Preisstand zurück und verlangt, dass die Abweichung auffällt — gemessen an den gebauten '
      + 'Seiten, nicht an der Vorlage.',
  }),
  Object.freeze({
    id: 'stiller-wegfall-im-korb',
    pruefer: 'shopprobe',
    was: 'Eine Position, die aus dem Warenkorb verschwindet, ohne dass es jemand sagt',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: '    merkeEntfallen(speicher, bereinigt.entfallen);',
    ersetzen: '    void bereinigt.entfallen;',
    erwartet: /führen wir nicht mehr|stiller|entfallene Position/,
    warum: 'Der Zustand vom 22. August bis zum 10. September: `bereinige` gab die entfallenen '
      + 'Kennungen zurück, und die Oberfläche fragte nur, ob es welche gab. Ein Korb aus zwei '
      + 'Positionen, von denen eine nicht mehr im Katalog steht, wurde beim nächsten Aufruf zu '
      + 'einem mit einer — kleinere Summe, kein Wort dazu. Die Mutation nimmt den Vermerk heraus '
      + 'und lässt die Bereinigung stehen: So verschwindet die Position weiterhin, nur eben '
      + 'wieder still. Gemessen wird an der ausgelieferten Warenkorbseite mit gefülltem '
      + 'Speicher, denn dieser Zustand entsteht erst im Browser.',
  }),
  Object.freeze({
    id: 'einzahl-im-korbkopf',
    pruefer: 'shopprobe',
    was: 'Eine Überschrift, die bei einer Position „1 Positionen" sagt',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "          + (t.positionen.length === 1 ? ' Position' : ' Positionen')));",
    ersetzen: "          + ' Positionen'));",
    erwartet: /1 Positionen|Einzahl/,
    warum: 'Wörtlich der Zustand bis zum 10. September, gefunden beim Messen des stillen '
      + 'Wegfalls: Die Überschrift des Warenkorbs setzte die Zahl vor ein festes „Positionen". '
      + 'Die Regel dafür stand elf Zeilen tiefer am Gewichtssatz, der die Eins ausdrücklich '
      + 'behandelt. Von sieben Stellen dieser Oberfläche, an denen eine Zahl vor ein Hauptwort '
      + 'tritt, war dies die einzige, die es hätte tun müssen und nicht tat.',
  }),
  Object.freeze({
    id: 'knopf-nennt-die-eingabe',
    pruefer: 'shopprobe',
    was: 'Ein Knopf, der den Korbinhalt behauptet und die Eingabe zeigt',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "      var drin = zeileImKorb ? zeileImKorb.menge : menge;",
    ersetzen: "      var drin = menge;",
    erwartet: /Knopf sagt, was im Korb liegt|zweimal=\[5|2000× im Warenkorb/,
    warum: 'Wörtlich der Zustand bis zum 11. September: Der Knopf setzte `String(menge)` ein, '
      + 'also die Eingabe, und behauptete mit „im Warenkorb" den Korbinhalt. Gemessen an vier '
      + 'Fällen war das in zweien falsch — bei zweimal Drücken nannte er die Menge eines '
      + 'Drucks, an der Höchstmenge die eingetippte 2000, während 999 im Korb lagen. Die '
      + 'Mutation setzt die Eingabe zurück; rot werden müssen dann beide Szenarien, die den '
      + 'Knopf gegen den Korb halten.',
  }),
  Object.freeze({
    id: 'grenze-ohne-wort',
    pruefer: 'shopprobe',
    was: 'Eine Grenze, die den Wunsch kürzt und nichts dazu sagt',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "        + (drin < menge ? ' — mehr als ' + HOECHSTMENGE + ' geht hier nicht' : '');",
    ersetzen: "        + '';",
    erwartet: /mehr als 999 geht hier nicht|Höchstmenge kürzt/,
    warum: 'Die zweite Hälfte desselben Befundes und der Kern von Gate 34: Die Grenze darf '
      + 'greifen, schweigen darf sie nicht. Ohne den Zusatz nennt der Knopf zwar die richtige '
      + 'Zahl, aber der Kunde sieht nur, dass aus seinen 2000 eine 999 geworden ist, und '
      + 'erfährt nicht, warum. Die Mutation nimmt den Satz heraus und lässt die richtige Zahl '
      + 'stehen — sie trennt damit die beiden Hälften, statt beide zugleich abzuschalten.',
  }),
  Object.freeze({
    id: 'archiv-mit-fehlender-datei',
    pruefer: 'pruefe-paket',
    was: 'Ein Archiv, in dem eine gebaute Datei fehlt',
    datei: 'shop/bin/paket.mjs',
    art: 'ersetzen',
    suchen: '  ...dateien.map((d) => ({ name: `site/${d}`, inhalt: inhalte.get(d) })),',
    ersetzen: '  ...dateien.slice(1).map((d) => ({ name: `site/${d}`, inhalt: inhalte.get(d) })),',
    erwartet: /fehlt-im-archiv|ist gebaut und liegt nicht im Archiv/,
    warum: 'Der teuerste denkbare Fehler dieser Kette und zugleich der stillste: Geprüft wird '
      + 'der Bau, hochgeladen wird das Archiv. Eine Datei zu wenig ist ein halber Shop, und '
      + 'weder `unzip -t` noch die Abnahmeliste müssten es merken — das Archiv wäre in sich '
      + 'tadellos. Die Mutation lässt genau eine Datei weg; rot wird dann der Abgleich gegen '
      + 'den Bau, denn das Archiv selbst ist danach fehlerfrei.',
  }),
  Object.freeze({
    id: 'verzeichnis-mit-falscher-summe',
    pruefer: 'pruefe-paket',
    was: 'Ein Inhaltsverzeichnis, dessen Prüfsummen nicht zum Inhalt passen',
    datei: 'shop/bin/paket.mjs',
    art: 'ersetzen',
    suchen: '  ...dateien.map((d) => `${summe(inhalte.get(d))}  ${String(inhalte.get(d).length).padStart(8)}  ${d}`),',
    ersetzen: '  ...dateien.map((d) => `${summe(Buffer.concat([inhalte.get(d), Buffer.from("x")]))}  ${String(inhalte.get(d).length).padStart(8)}  ${d}`),',
    erwartet: /summe-weicht-ab|Prüfsumme im Verzeichnis stimmt nicht/,
    warum: 'Das Inhaltsverzeichnis ist das Versprechen, mit dem sich das Archiv nachrechnen '
      + 'lässt. Stimmen seine Summen nicht, ist es schlimmer als keines: Wer eine nachrechnet '
      + 'und eine Abweichung findet, hält ein tadelloses Paket für beschädigt — und wer keine '
      + 'nachrechnet, hat es umsonst. Die Mutation verfälscht jede Summe um ein Byte, ohne die '
      + 'Dateien selbst anzufassen.',
  }),
  Object.freeze({
    id: 'kaufquote-abgeschrieben',
    pruefer: 'test',
    was: 'Die Zahl, mit der jedes Höchstgebot multipliziert wird, zweimal im Bestand',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "  const kaufquote = argZahl('kaufquote', annahmewert('umsatzProSession'));",
    ersetzen: "  const kaufquote = argZahl('kaufquote', 0.03);",
    erwartet: /Kaufquote|zwei Wege zu derselben Zahl/,
    warum: 'Der Zustand bis zum 11. September: `bin/kampagne.mjs` hatte für die Kaufquote eine '
      + 'eigene 0.02 im Quelltext, während dieselbe Zahl als Annahme `umsatzProSession` mit '
      + 'Herkunft und Konfidenz im Register steht — samt der Zeile „DIESELBE GRÖSSE wie die '
      + 'Kaufquote der Kampagne". Das stand in einem Satz und nicht in einem Aufruf. Jedes '
      + 'Höchstgebot je Klick ist der Deckungsbeitrag mal dieser Zahl; wird die Annahme '
      + 'berichtigt, bewegen sich Kennzahlen und Leitzahlen, und die Gebote blieben als '
      + 'einzige stehen — obwohl sie die einzige Stelle sind, an der eine Annahme noch am '
      + 'selben Tag zu einer Zahlung wird. Die Mutation schreibt der Kampagne wieder eine '
      + 'eigene Zahl in den Quelltext — und zwar eine **andere** als die des Registers, denn '
      + 'genau darin liegt der Punkt: Mit 0.02 stimmten die beiden zufällig überein, und '
      + 'dieser Zufall war das, was niemand messen konnte.',
  }),
  Object.freeze({
    id: 'zielmarge-abgeschrieben',
    pruefer: 'pruefe-zwillinge',
    was: 'Die Weisung des Auftraggebers als zweite Zahl im Annahmenregister',
    datei: 'shop/src/empfindlichkeit.js',
    art: 'ersetzen',
    suchen: '    basis: ZIELMARGE,',
    ersetzen: '    basis: 0.25,',
    erwartet: /zahl-zweimal|0\.25 als eigenes Literal/,
    warum: 'Wörtlich der Zustand bis zum 11. September — und an dieser Zeile ist es schon '
      + 'einmal schiefgegangen: Bis zum 1. September stand hier 0,35 aus dem verlassenen '
      + 'Radonmodell, während der Shop längst mit 25 % rechnete; neun Tage lang maß die '
      + 'Empfindlichkeitsrechnung ein Drittel mehr Luft, als es gibt. Die Zahl ist die '
      + 'Weisung des Auftraggebers vom 25. August und bestimmt jeden Verkaufspreis. Die '
      + 'Mutation schreibt sie wieder ab; sie bleibt dabei richtig — genau deshalb kann nur '
      + 'ein Prüfer anschlagen, der die zweite Fundstelle als solche sieht.',
  }),
  Object.freeze({
    id: 'steuersatz-in-vierter-fassung',
    pruefer: 'pruefe-zwillinge',
    was: 'Der Umsatzsteuersatz als eigene Zahl in der Gebührenkaskade',
    datei: 'shop/src/kostenbild.js',
    art: 'ersetzen',
    suchen: 'export const UST = UST_SATZ;',
    ersetzen: 'export const UST = 0.20;',
    erwartet: /zahl-zweimal|0\.20 als eigenes Literal/,
    warum: 'Der Zustand bis zum 11. September: vier Fassungen desselben Steuersatzes im '
      + 'Bestand, drei davon aneinander gebunden — und diese vierte hatte als Zusicherung '
      + '`assert.equal(UST, 0.20)`. Ein Testfall, der eine Zahl gegen dieselbe Zahl hält, '
      + 'hält nichts. Mit diesem Satz wird die Zahlungsgebühr auf brutto gestreckt, und daran '
      + 'hängt `noetigerUmsatz`, die Leitzahl, die zehn Werkzeuge lesen.',
  }),
  Object.freeze({
    id: 'empfang-ohne-grenze',
    pruefer: 'test',
    was: 'Ein Empfangsskript, das beliebig viele Bestellungen hintereinander annimmt',
    datei: 'shop/bestellung.php',
    art: 'ersetzen',
    suchen: 'if ($imFenster >= HOECHSTENJEFENSTER) {',
    ersetzen: 'if (false && $imFenster >= HOECHSTENJEFENSTER) {',
    erwartet: /429|fünf Bestellungen in einer Minute/,
    warum: 'Wörtlich der Zustand bis zum 11. September: dreißig Bestellungen hintereinander von '
      + 'derselben Adresse, dreißigmal 200, dreißig Zeilen im Journal. Jede schreibt in die '
      + 'Vorgangsablage, die nach § 132 BAO sieben Jahre zu führen ist, und löst eine Mail an '
      + 'den Betrieb aus. Die Mutation lässt die Zählung stehen und schaltet nur die '
      + 'Entscheidung ab — so bleibt sichtbar, dass der Prüfer die Grenze misst und nicht das '
      + 'Rechnen.',
  }),
  Object.freeze({
    id: 'empfang-nimmt-jeden-typ',
    pruefer: 'test',
    was: 'Ein Empfangsskript, das ein Formular von einer fremden Seite annimmt',
    datei: 'shop/bestellung.php',
    art: 'ersetzen',
    suchen: "if ($art !== 'application/json') {",
    ersetzen: "if (false && $art !== 'application/json') {",
    erwartet: /415|fremden Seite/,
    warum: '`text/plain` ist einer der drei Typen, die ein HTML-Formular ohne Vorabanfrage '
      + 'senden kann — und genau damit ging die Bestellung am 11. September durch, von einer '
      + 'beliebigen fremden Seite aus. Die Mutation nimmt die Typprüfung heraus; der eigene '
      + 'Absendeweg setzt den Kopf weiterhin, also bleibt alles andere grün und nur der Fall '
      + 'der fremden Seite fällt um.',
  }),
  Object.freeze({
    id: 'anfragetext-ohne-namen',
    pruefer: 'shopprobe',
    was: 'Das Textfeld mit der ganzen Bestellung, ohne Beschriftung',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "      feld.setAttribute('aria-label', 'Ihre Anfrage als Text zum Kopieren');",
    ersetzen: '      void feld;',
    erwartet: /ohneNamen=\[TEXTAREA|Bedienelement der Kasse hat einen Namen/,
    warum: 'Wörtlich der Zustand bis zum 11. September: Alle 712 Bedienelemente der gebauten '
      + 'Seiten tragen eine Beschriftung, und von den fünf, die die Kasse im Browser erzeugt, '
      + 'vier — ausgerechnet das fünfte nicht. Es ist das Textfeld, in dem die ganze '
      + 'Bestellung steht. Der Absatz darüber erklärt es für den, der ihn sieht; ein Absatz '
      + 'über einem Feld ist aber keine Beschriftung, sondern Nachbarschaft.',
  }),
  Object.freeze({
    id: 'meldung-die-niemand-hoert',
    pruefer: 'shopprobe',
    was: 'Eine Auskunft über den eigenen Vorgang, die nur zu sehen ist',
    datei: 'shop/shop-ui.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "    gebietsantwort.setAttribute('role', 'status');",
    ersetzen: '    void gebietsantwort;',
    erwartet: /gebiet=null|gebiet=FEHLT|als Meldung ausgewiesen/,
    warum: 'Die zweite Hälfte desselben Befundes: Im ganzen Shop war kein einziger Bereich als '
      + 'Statusmeldung ausgewiesen — „Kopiert.", „Wir liefern nach Perg", „Es fehlt noch: …". '
      + 'Drei Auskünfte über den eigenen Vorgang, die nur zu sehen und nicht zu hören waren. '
      + 'Die Mutation nimmt eine der drei Rollen heraus und lässt die anderen stehen: So ist '
      + 'sichtbar, dass die Probe die Rolle misst und nicht das Erscheinen des Absatzes.',
  }),
  Object.freeze({
    id: 'kopfzeilen-ohne-ifmodule',
    pruefer: 'pruefe-kopfzeilen',
    was: 'Serverkopfzeilen ohne den Rahmen, der ein fehlendes Modul abfängt',
    datei: 'shop/src/serverkopf.js',
    art: 'ersetzen',
    baueVorher: true,
    suchen: "    '<IfModule mod_headers.c>',",
    ersetzen: "    '# ohne Rahmen',",
    erwartet: /ohne-modul-kaputt|<IfModule> trägt|500/,
    warum: 'Am 11. September an einem laufenden Apache gemessen: Eine Direktive, deren Modul '
      + 'fehlt, beantwortet Apache mit **500 für die ganze Seite** — dieselbe Zeile in einem '
      + '`<IfModule>` mit 200. Genau diese Gefahr war bis dahin der Grund, gar keine '
      + 'Kopfzeilen zu schreiben. Die Mutation nimmt den Rahmen heraus und lässt die Zeilen '
      + 'stehen; rot wird dann die Hälfte des Prüfers, die **ohne** mod_headers misst — die '
      + 'andere bleibt grün, denn mit Modul wirken die Zeilen ja.',
  }),
  Object.freeze({
    id: 'dieselbe-bestellung-zweimal',
    pruefer: 'test',
    was: 'Eine Bestellung, die nach einem Abriss ein zweites Mal verbucht wird',
    datei: 'shop/bestellung.php',
    art: 'ersetzen',
    suchen: 'if ($schonDa !== null) {',
    ersetzen: 'if (false && $schonDa !== null) {',
    erwartet: /dieselbe Bestellung binnen Minuten|eine Bestellung, eine Zeile/,
    warum: 'Wörtlich der Zustand bis zum 11. September: Dieselbe Bestellung zweimal geschickt '
      + 'ergab zwei Journalzeilen und zwei Nummern — zwei Geschäftsfälle, zwei Mails und, '
      + 'sobald der Shop wirklich verkauft, womöglich zwei Lieferungen derselben Palette auf '
      + 'dieselbe Baustelle. Der Weg dorthin ist nicht Ungeduld, sondern ein Abriss nach dem '
      + 'Schreiben. Die Mutation lässt den Abdruck berechnen und schaltet nur die '
      + 'Entscheidung ab: So bleibt sichtbar, dass der Prüfer das Verbuchen misst und nicht '
      + 'das Rechnen.',
  }),
  Object.freeze({
    id: 'abdruck-nimmt-die-nummer-mit',
    pruefer: 'test',
    was: 'Ein Abdruck, der die vergebene Nummer mitzählt und deshalb nie zweimal gleich ist',
    datei: 'shop/bestellung.php',
    art: 'ersetzen',
    suchen: "    unset($ohne['nummer'], $ohne['zeitpunkt']);",
    ersetzen: '    unset($ohne[\'zeitpunkt\']);',
    erwartet: /dieselbe Nummer|binnen Minuten/,
    warum: 'Der stille Weg, die Sperre unwirksam zu machen: Nummer und Zeitpunkt vergibt das '
      + 'Skript selbst, und wer sie in den Abdruck nimmt, bekommt für zwei Abschriften '
      + 'derselben Bestellung immer zwei verschiedene Abdrücke. Der Code sähe vollständig '
      + 'aus, die Sperre griffe nie. Die Mutation nimmt die Nummer wieder hinein.',
  }),
  Object.freeze({
    id: 'absage-in-der-sprache-des-betriebs',
    pruefer: 'test',
    was: 'Eine Absage, die den internen Grund im Original an den Kunden schickt',
    datei: 'shop/src/absage.js',
    art: 'ersetzen',
    suchen: '    kunde: \'Wir verkaufen ausschließlich an Unternehmer. Ihre Bestellung enthält keine \'',
    ersetzen: '    kunde: \'Unternehmerstatus nicht bestätigt (Gate 7). Ihre Bestellung enthält keine \'',
    erwartet: /Gate-Nummer in|Internum|kommen nicht im Original hinaus/,
    warum: 'Der Kern des Befundes vom 11. September: Von neun internen Absagegründen tragen '
      + 'zwei ein Internum — eine Gate-Nummer und den Namen des Lieferanten. Die Mutation '
      + 'schreibt die Gate-Nummer in den Satz für den Kunden; rot wird dann die Probe, die '
      + 'den fertigen Brief durch `findeInterna` schickt. Ohne sie wäre die Übersetzung eine '
      + 'Absichtserklärung.',
  }),
  Object.freeze({
    id: 'grund-ohne-satz-faellt-weg',
    pruefer: 'test',
    was: 'Ein Absagegrund, für den es keinen Satz gibt und der stillschweigend verschwindet',
    datei: 'shop/src/absage.js',
    art: 'ersetzen',
    suchen: "    if (!treffer) { ohneSatz.push(String(g)); continue; }",
    ersetzen: '    if (!treffer) { continue; }',
    erwartet: /unübersetzt|ohneSatz|ohne Satz/,
    warum: 'Die stille Art, dieses Modul unbrauchbar zu machen: Ein Grund ohne Satz fällt weg, '
      + 'die Absage entsteht trotzdem — und sagt dann nicht, warum sie absagt. Der Kunde liest '
      + 'einen von zwei Gründen und hält den zweiten für erledigt. Die Mutation lässt das '
      + 'Weglassen zu; rot werden muss der Fall, der einen unbekannten Grund hineingibt.',
  }),
]);

/**
 * Prüfer ohne Gegenprobe — mit dem Grund, warum keine da ist.
 *
 * Der Grund ist Pflicht, aus demselben Grund wie bei `OHNE_WERKZEUG` in
 * `offenepunkte.js`: Wer hier etwas einträgt, das sich leicht gegenproben
 * ließe, soll beim Schreiben des Grundes merken, dass er keinen hat.
 */
export const OHNE_GEGENPROBE = Object.freeze([
  Object.freeze({
    pruefer: 'pruefe-mutationen',
    warumKeine: 'Er wird nicht durch Code rot, sondern durch einen Zettel auf der Platte — '
      + 'eine liegen gebliebene Mutation. Eine Mutation an seiner Quelle könnte ihn nur dazu '
      + 'bringen, einen Fund zu behaupten, den es nicht gibt; das zeigt nichts über den Fall, '
      + 'für den es ihn gibt. Sein rotes Verhalten prüft `test/mutationsschutz.test.js` mit '
      + 'einer echten liegen gebliebenen Datei, und die Gegenprobe '
      + '„liegen-gebliebene-mutation-uebersehen" hält diese Prüfung wach.',
  }),
]);


/**
 * Was in der roten Ausgabe steht und in der grünen nicht stand.
 *
 * **Der Befund vom 7. September.** Der Läufer sichert vier Dinge zu, und das
 * dritte lautet: Der Prüfer meldet rot **und nennt die erwartete Stelle**.
 * Geprüft wurde das gegen die **ganze** rote Ausgabe. Gemessen über das
 * Register passen aber **34 von 101 Erwartungen schon auf die grüne** — bei
 * `npm test` sogar fast alle, weil TAP jeden Testfall beim Namen nennt, ob er
 * nun durchläuft oder nicht.
 *
 * > **Eine Erwartung, die auch auf Grün passt, sagt nur, dass es rot ist —
 * > nicht, warum.**
 *
 * Verglichen wird deshalb, was **neu** ist. Bei einem Testlauf ist das die
 * Zeile `not ok … — <Name>` (in Grün stand dort `ok`), bei einem Prüfer die
 * Fundzeile. Der Rest der Ausgabe zählt nicht mehr, und damit misst die
 * Erwartung wieder das, wofür sie da ist.
 *
 * Verglichen wird zeilenweise und beschnitten, weil Einrückung und
 * Zeilennummern sich zwischen zwei Läufen ohnehin verschieben.
 *
 * @param {string} vorher   Ausgabe des grünen Laufs
 * @param {string} nachher  Ausgabe des roten Laufs
 * @returns {string} nur die hinzugekommenen Zeilen
 */
export function neueMeldungen(vorher, nachher) {
  const bekannt = new Set(vorher.split('\n').map((z) => z.trim()));
  return nachher.split('\n').filter((z) => !bekannt.has(z.trim())).join('\n');
}


/* ------------------------------------------------------------------ *
 * Wo eine Probe zupackt
 * ------------------------------------------------------------------ */

/**
 * **Der Anlass, 10. September 2026.** Der Suchtext der Probe
 * `der-kopf-des-registers-zaehlt-anders-als-die-tabelle` sitzt auf dem Zahlwort
 * im Kopf des Gate-Registers — auf genau der Stelle, die sich mit jedem neuen
 * Gate ändert. Er ist dreimal nachgezogen worden: 31 → 32 → 33. Jedes Mal fiel
 * es erst auf, als der Testlauf rot wurde.
 *
 * > **Ein Anker auf einer Zahl, die sich ändert, ist ein Anker auf Sand.**
 *
 * Eine Probe kann seither statt `suchen` ein `suchenMuster` tragen. Das Muster
 * beschreibt die Stelle, ohne ihren beweglichen Teil festzuschreiben:
 * `/\*\*Maßgeblich für alle Gate-Fragen\.\*\* \w+/` findet den Kopf, gleich
 * welches Zahlwort dort steht.
 *
 * **Ersetzt wird über Stellen, nicht mit `String.replace`.** Das ist kein
 * Umweg: `replace` deutet in seinem Ersetzungstext `$&`, ``$` ``, `$'` und
 * `$1` als Anweisungen. Kein Eintrag dieses Registers nutzt heute eine davon —
 * gemessen —, und der Erste, der es täte, bekäme eine Mutation, die woanders
 * landet als im Register steht. Ein Prüfer, der daraufhin grün meldet, sieht
 * aus wie einer, der nicht anschlägt.
 *
 * @param {string} text der Dateiinhalt
 * @param {object} probe ein Eintrag mit `suchen` oder `suchenMuster`
 * @returns {{index: number, laenge: number}[]}
 */
export function fundstellen(text, probe) {
  const t = String(text ?? '');
  const stellen = [];

  if (probe.suchenMuster) {
    const m = probe.suchenMuster;
    const re = new RegExp(m.source, m.flags.includes('g') ? m.flags : `${m.flags}g`);
    let treffer = re.exec(t);
    while (treffer) {
      stellen.push({ index: treffer.index, laenge: treffer[0].length });
      // Ein Muster, das die leere Zeichenkette trifft, stünde sonst ewig still.
      if (treffer[0].length === 0) re.lastIndex += 1;
      treffer = re.exec(t);
    }
    return stellen;
  }

  const s = String(probe.suchen ?? '');
  if (s === '') return stellen;
  let i = t.indexOf(s);
  while (i >= 0) {
    stellen.push({ index: i, laenge: s.length });
    i = t.indexOf(s, i + s.length);
  }
  return stellen;
}

/** Der mutierte Text — die erste Fundstelle, oder mit `alle: true` jede. */
export function mutiere(text, probe) {
  let t = String(text ?? '');
  const stellen = fundstellen(t, probe);
  const genutzt = probe.alle ? stellen : stellen.slice(0, 1);
  // Von hinten nach vorn, damit die früheren Stellen ihre Lage behalten.
  for (const stelle of [...genutzt].reverse()) {
    t = t.slice(0, stelle.index) + probe.ersetzen + t.slice(stelle.index + stelle.laenge);
  }
  return t;
}

/** Wie der Anker in einer Meldung dasteht — Muster und Text sehen verschieden aus. */
export function ankerbeschreibung(probe) {
  return probe.suchenMuster
    ? `Suchmuster ${String(probe.suchenMuster)}`
    : `Suchtext ${JSON.stringify(String(probe.suchen ?? '').slice(0, 50))}`;
}

/**
 * Wie weit ein Muster greifen darf.
 *
 * **Warum es eine Grenze braucht.** Ein Suchtext zeigt, was er ersetzt — man
 * liest ihn im Register. Ein Muster zeigt es nicht: `/Gate[\s\S]*Register/`
 * sieht harmlos aus und verschluckt vierhundert Zeilen. Die Mutation wäre dann
 * nicht die im Register beschriebene, und ein rot meldender Prüfer bewiese
 * nichts über die gemeinte Stelle.
 */
export const MUSTER_HOECHSTLAENGE = 400;

/**
 * Passt jeder Suchtext genau dorthin, wo er gemeint ist?
 *
 * **Der Anlass, 7. September 2026.** Beim Schreiben einer neuen Gegenprobe
 * traf der Suchtext `    vkNetto: a.vkNetto ?? null,` — und die Zeile steht in
 * `shopkern.js` **zweimal**: einmal im Suchindex, einmal im öffentlichen
 * Artikel. Der Läufer ersetzt die **erste** Fundstelle, mutiert wurde also der
 * Suchindex, und der Preisprüfer meldete zu Recht grün.
 *
 * > **Ein Suchtext, der zweimal passt, trifft die erste Stelle — nicht die
 * > gemeinte.** Und das sieht aus wie ein Prüfer, der nicht anschlägt.
 *
 * Die Einzelprobe (`bin/gegenprobe.mjs`) bricht seit dem 31. August bei
 * mehrfachem Treffer ab. Der Läufer, der unbeaufsichtigt im Gesamtlauf steckt,
 * tat es nicht — dieselbe Ungleichheit wie damals bei den Signalen: Was der
 * Mensch von Hand ausführt, ist abgesichert; was allein läuft, nicht.
 *
 * `alle: true` ist die Ausnahme und bleibt eine: Dort sollen **alle**
 * Fundstellen fallen, weil eine halbe Mutation den Prüfer zu Recht grün
 * melden lässt.
 *
 * **Nachtrag vom selben Tag.** Während eine Gegenprobe läuft, steht die Datei,
 * die sie mutiert, nicht so da wie im Register — der Suchtext ist gerade
 * ersetzt. Dieser Prüfer schlug deshalb bei **jeder fremden Mutation** an und
 * meldete `suchtext-passt-nicht` über eine Stelle, die es in einer Minute
 * wieder gibt. Gefunden hat das die schärfere Regel dieser Runde: Der Testlauf
 * ging rot, und zwar an einer Zeile, die mit der geprüften Mutation nichts zu
 * tun hatte.
 *
 * > **Ein Prüfer, der den Bestand liest, während ein anderer ihn absichtlich
 * > verstellt, misst die Verstellung.**
 *
 * Übersprungen wird deshalb, was einen offenen Mutationszettel trägt — und nur
 * das: Der Zettel liegt genau so lange, wie die Mutation steht.
 *
 * @param {object} eingabe
 * @param {object[]} eingabe.proben
 * @param {(datei: string) => string|null} eingabe.lies  Dateiinhalt oder null
 * @param {(datei: string) => boolean} [eingabe.unterMutation]  trägt einen offenen Zettel
 */
export function suchtextbefund({ proben = GEGENPROBEN, lies, unterMutation = () => false }) {
  const meldungen = [];
  const uebersprungen = [];
  for (const p of proben) {
    if (p.art !== 'ersetzen') continue;
    if (unterMutation(p.datei)) { uebersprungen.push(p.id); continue; }
    const text = lies(p.datei);
    if (text === null) {
      meldungen.push({ regel: 'datei-fehlt', id: p.id, text: `${p.id}: ${p.datei} gibt es nicht` });
      continue;
    }
    const stellen = fundstellen(text, p);
    const treffer = stellen.length;
    const wie = p.suchenMuster ? 'das Suchmuster' : 'der Suchtext';
    if (treffer === 0) {
      meldungen.push({
        regel: 'suchtext-passt-nicht',
        id: p.id,
        text: `${p.id}: ${wie} kommt in ${p.datei} nicht vor — die Mutation käme nie an`,
      });
      continue;
    }
    if (!p.alle && treffer > 1) {
      meldungen.push({
        regel: 'suchtext-mehrdeutig',
        id: p.id,
        text: `${p.id}: ${wie} kommt in ${p.datei} ${treffer}-mal vor — mutiert würde die `
          + 'erste Stelle, und das ist nicht unbedingt die gemeinte',
      });
    }
    /*
     * **Nur für Muster.** Ein Suchtext zeigt im Register, was er ersetzt; ein
     * Muster nicht. Greift es weiter, als ein Mensch beim Lesen annimmt, ist
     * die ausgeführte Mutation eine andere als die beschriebene — und ein rot
     * meldender Prüfer beweist etwas über eine Stelle, die niemand gemeint hat.
     */
    const zuLang = p.suchenMuster && stellen.find((s) => s.laenge > MUSTER_HOECHSTLAENGE);
    if (zuLang) {
      meldungen.push({
        regel: 'muster-greift-zu-weit',
        id: p.id,
        text: `${p.id}: das Suchmuster fasst ${zuLang.laenge} Zeichen in ${p.datei} — mehr als `
          + `die erlaubten ${MUSTER_HOECHSTLAENGE}. Ein Muster, das zu viel greift, ersetzt `
          + 'mehr, als im Register steht',
      });
    }
  }
  return {
    geprueft: proben.filter((p) => p.art === 'ersetzen').length - uebersprungen.length,
    uebersprungen,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/** Was das Register über sich selbst weiß. */
export function registerbefund(pruefernamen, proben = GEGENPROBEN, ohne = OHNE_GEGENPROBE) {
  const mitProbe = new Set(proben.map((p) => p.pruefer));
  const begruendet = new Set(ohne.map((o) => o.pruefer));
  const unerklaert = pruefernamen.filter((n) => !mitProbe.has(n) && !begruendet.has(n));

  for (const p of proben) {
    if (!ARTEN.includes(p.art)) throw new Error(`Unbekannte Mutationsart „${p.art}" bei ${p.id}`);
    if (p.art === 'ersetzen') {
      if (p.ersetzen === undefined) throw new Error(`„ersetzen" braucht ersetzen: ${p.id}`);
      /*
       * **Genau einer der beiden Anker, seit dem 10. September.** Beide
       * zugleich wäre nicht doppelt gesichert, sondern unentschieden: Wer den
       * Eintrag liest, sähe zwei Stellen und wüsste nicht, welche mutiert wird.
       */
      const anker = [p.suchen, p.suchenMuster].filter((a) => a !== undefined).length;
      if (anker !== 1) {
        throw new Error(`„ersetzen" braucht genau einen Anker — suchen ODER suchenMuster: ${p.id}`);
      }
      if (p.suchenMuster && !(p.suchenMuster instanceof RegExp)) {
        throw new Error(`suchenMuster ist kein regulärer Ausdruck: ${p.id}`);
      }
    }
    if (p.art === 'anhaengen' && !p.text) throw new Error(`„anhaengen" braucht text: ${p.id}`);
    if (!p.warum || p.warum.length < 30) throw new Error(`Ohne Begründung kein Eintrag: ${p.id}`);
  }
  for (const o of ohne) {
    if (!o.warumKeine || o.warumKeine.length < 30) throw new Error(`Ohne Grund kein Eintrag: ${o.pruefer}`);
  }

  return {
    proben: proben.length,
    gedeckt: mitProbe.size,
    begruendet: begruendet.size,
    unerklaert,
    vollstaendig: unerklaert.length === 0,
  };
}

/* ------------------------------------------------------------------ *
 * Browserproben: zurückgestellt, aber nicht vergessen
 * ------------------------------------------------------------------ */

/**
 * **Der Anlass, 10. September 2026.** Vier Gegenproben laufen nicht im
 * Regellauf mit. Der Grund ist gut und steht in `bin/gegenprobenlauf.mjs`:
 * Zwei von ihnen meldeten am 4. September unter Last etwas anderes als allein.
 *
 * > **Eine Probe, die unter Last etwas anderes meldet als allein, misst die
 * > Last.**
 *
 * Gefehlt hat die andere Hälfte. Der Lauf druckte die vier Namen als Zeile
 * *„zurückgestellt — mit `--mit-browser` laufen sie mit"*, und niemand ließ sie
 * mitlaufen. Am 10. September liefen sie zum ersten Mal seit ihrer Aufnahme.
 * Drei schlugen an; die vierte stand seit dem 5. September im Register und
 * zeigte auf das **falsche Szenario**.
 *
 * > **Eine Zurückstellung, die nie verfällt, ist eine Probe, die nie läuft.**
 *
 * Gemessen kostet der ganze Satz **2 Minuten** — gegen 46 Minuten des
 * Regellaufs. Die Zurückstellung bleibt trotzdem: Sie war nie eine Frage der
 * Kosten, sondern der Last. Was dazukommt, ist ein Datum je Probe und eine
 * Frist, nach der „zurückgestellt" wieder „ungeprüft" heißt.
 */
export const BROWSERPROBEN_GRENZE_TAGE = 14;

/**
 * Hält den Vermerk gegen das Register — in beide Richtungen.
 *
 * @param {object[]} proben die Browsergegenproben aus dem Register
 * @param {object} vermerk der Inhalt von data/browserproben.json
 * @param {string} heute Geschäftstag als YYYY-MM-DD
 */
export function browserprobenbefund(proben, vermerk, heute) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const eintraege = vermerk?.proben ?? {};
  const grenze = Number(vermerk?.grenzeTage ?? BROWSERPROBEN_GRENZE_TAGE);
  let frisch = 0;
  let aeltester = null;

  for (const p of proben) {
    const e = eintraege[p.id];
    if (!e?.am) {
      melde('nie-geschlagen',
        `${p.id} ist zurückgestellt und hat nie angeschlagen — eine Zurückstellung ohne `
        + 'Datum ist eine Probe, die nie läuft');
      continue;
    }
    const tage = Math.floor((Date.parse(`${heute}T00:00:00Z`) - Date.parse(`${e.am}T00:00:00Z`))
      / 86400000);
    if (!Number.isFinite(tage)) {
      melde('datum-unlesbar', `${p.id}: „${e.am}" ist kein Datum`);
      continue;
    }
    if (tage > grenze) {
      melde('zu-lange-her',
        `${p.id} hat zuletzt vor ${tage} Tagen angeschlagen — die Frist sind ${grenze}. `
        + 'Mit `npm run gegenproben -- --mit-browser` nachziehen');
      continue;
    }
    frisch += 1;
    if (aeltester === null || tage > aeltester) aeltester = tage;
  }

  /*
   * Die Richtung, die den Fund gemacht hätte: Ein Eintrag ohne Probe. Wird eine
   * Browsergegenprobe gelöscht oder in eine andere Prüfergruppe verschoben,
   * bliebe ihr Datum hier stehen und sagte über etwas aus, das es nicht gibt.
   */
  const bekannt = new Set(proben.map((p) => p.id));
  for (const id of Object.keys(eintraege)) {
    if (!bekannt.has(id)) {
      melde('vermerk-ohne-probe',
        `${id} steht im Vermerk und ist keine zurückgestellte Browserprobe mehr`);
    }
  }

  return {
    meldungen,
    proben: proben.length,
    frisch,
    aeltester,
    grenze,
    sauber: meldungen.length === 0,
  };
}
