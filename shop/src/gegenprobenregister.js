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
    suchen: '| nötiger Monatsumsatz | 67.826 € | **43.396 €** |',
    ersetzen: '| nötiger Monatsumsatz | 67.826 € | **43.111 €** |',
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
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "    + `ErrorDocument 404 /${FEHLERSEITE}.html\\n`, 'utf8');",
    ersetzen: "    + 'ErrorDocument 404 /fehler.html\\n', 'utf8');",
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
    erwartet: /ohneGrenze=suche|Legen-Knopf/,
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
    id: 'palettiert-ohne-herkunft',
    pruefer: 'pruefe-sperrgut',
    was: 'Eine maschinenlesbare Auskunft, die die Kranentladung nennt und ihre Herkunft nicht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "      + 'Die Angabe „palettiert\" ist geschätzt: Sie folgt aus der Warengruppe und nicht aus '\n"
      + "      + 'einer Angabe des Lieferanten. Sie entscheidet, ob die Kranentladung anfällt; wo ein '\n"
      + "      + 'Positionsgewicht dagegenspricht, steht es auf der Artikelseite.',",
    ersetzen: "      + '',",
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
    id: 'der-haken-ruft-einen-pruefer-der-nicht-mehr-so-heisst',
    pruefer: 'pruefe-haken',
    was: 'Ein Haken, der auf ein Werkzeug zeigt, das er nicht mehr aufruft',
    datei: 'shop/src/haken.js',
    art: 'ersetzen',
    suchen: "    ruft: 'bin/mutationspruefung.mjs',",
    ersetzen: "    ruft: 'bin/mutationswache.mjs',",
    erwartet: /haken-ruft-nicht/,
    warum: 'Der Fall vom 8. September: Ein Commit dieses Loops nahm eine laufende Gegenprobe '
      + 'mit und stellte damit pruefe-schaufenster blind. Der Haken hält das seither auf — '
      + 'aber nur, solange er wirklich die Mutationsprüfung ruft. Wird das Werkzeug einmal '
      + 'umbenannt und der Haken nicht, steht die Datei weiter da, ist ausführbar, ist im '
      + 'Register genannt und hält nichts mehr auf. Diese Mutation benennt im Register um, '
      + 'was der Haken zu rufen hat, und verlangt, dass der Prüfer den Inhalt liest und '
      + 'nicht nur den Dateinamen.',
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
    const treffer = text.split(p.suchen).length - 1;
    if (treffer === 0) {
      meldungen.push({
        regel: 'suchtext-passt-nicht',
        id: p.id,
        text: `${p.id}: der Suchtext kommt in ${p.datei} nicht vor — die Mutation käme nie an`,
      });
      continue;
    }
    if (!p.alle && treffer > 1) {
      meldungen.push({
        regel: 'suchtext-mehrdeutig',
        id: p.id,
        text: `${p.id}: der Suchtext kommt in ${p.datei} ${treffer}-mal vor — mutiert würde die `
          + 'erste Stelle, und das ist nicht unbedingt die gemeinte',
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
    if (p.art === 'ersetzen' && (p.suchen === undefined || p.ersetzen === undefined)) {
      throw new Error(`„ersetzen" braucht suchen und ersetzen: ${p.id}`);
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
