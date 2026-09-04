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
    erwartet: /fracht-auf-jedem-beleg/,
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
    id: 'auszeichnung-sagt-mehr-als-die-seite',
    pruefer: 'pruefe-seiten',
    was: 'Eine maschinenlesbare Antwort mit einer Zahl, die auf der Seite nicht steht',
    datei: 'shop/bin/website.mjs',
    art: 'ersetzen',
    suchen: "      'Ja, ausdrücklich vorgesehen. Wer selbst abholt, zahlt keine Fracht.'],",
    ersetzen: "      'Ja, ausdrücklich vorgesehen. Wer selbst abholt, zahlt keine Fracht und bekommt 3 % Nachlass.'],",
    erwartet: /3 %/,
    baueVorher: true,
    warum: 'Eine Auszeichnung, die mehr sagt als die Seite, ist eine Behauptung an eine '
      + 'Maschine — sie wird zitiert und nicht gelesen. Dieselbe Familie wie `PreOrder` gegen '
      + '`InStock`: Beide Seiten stimmen für sich, und der Widerspruch fällt beim Kunden auf.',
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
    id: 'landeseite-verschweigt-luecke',
    pruefer: 'kampagne',
    was: 'Eine Landeseite, die die Lücke ihrer Systemliste nicht nennt',
    datei: 'shop/inhalte/gruppen/wdvs.md',
    art: 'ersetzen',
    suchen: 'führen wir nicht',
    ersetzen: 'ist eine eigene Position',
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
    pruefer: 'pruefe-geheimnis',
    warumKeine: 'Seine Mutation wäre, einen Einkaufspreis in eine öffentliche Datei zu '
      + 'schreiben. Auch nur für Sekunden und auch nur lokal — das ist die eine Datei, '
      + 'die diese Arbeit nicht anfassen darf.',
  }),
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
