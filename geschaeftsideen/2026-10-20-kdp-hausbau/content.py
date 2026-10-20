# Inhalte des Buches. Rechtliche Angaben: Stand Oktober 2026, geprüft gegen offizielle Quellen (siehe QUELLEN.md).

TITLE = "Unser Hausbau"
SUBTITLE = "Das Bautagebuch für Bauherren in Österreich – Planen, Kosten im Griff, Baustelle dokumentieren, richtig abnehmen"
AUTHOR = "Ing. Stefan Freudenthaler"
STAND = "Oktober 2026"

IMPRESSUM = [
    f"<b>{TITLE}</b> – {SUBTITLE}",
    f"© {STAND[-4:]} {AUTHOR}. Alle Rechte vorbehalten. Die Formularseiten dürfen vom Käufer für das eigene Bauvorhaben kopiert werden.",
    f"Medieninhaber und Herausgeber: {AUTHOR}, Österreich.",
    "Druck und Vertrieb: Amazon Kindle Direct Publishing.",
    f"Rechtsstand: {STAND}. Bau- und Raumordnungsrecht ist in Österreich Landessache; Abläufe, Bezeichnungen und Fristen "
    "können je nach Bundesland und Gemeinde abweichen. Förderungen ändern sich laufend.",
    "Haftungsausschluss: Dieses Buch ist ein Planungs- und Dokumentationshilfsmittel und ersetzt keine Rechts-, Steuer- oder "
    "Fachberatung. Alle Angaben wurden sorgfältig geprüft, eine Haftung für Vollständigkeit und Aktualität ist ausgeschlossen. "
    "Verbindlich sind die jeweils geltenden Gesetze, Bescheide und Verträge sowie die Auskünfte Ihrer Baubehörde.",
]

# ------------------------------------------------------------------ Teil 1
KNOWLEDGE = [
 {"title": "So nutzen Sie dieses Buch", "blocks": [
  ("p", "Ein Hausbau besteht aus hunderten Entscheidungen, Terminen und Rechnungen. Wer sauber dokumentiert, behält die Kosten "
        "im Griff, erkennt Fehler früh und hat bei Streitigkeiten Beweise in der Hand. Dieses Buch begleitet Sie vom Grundstück "
        "bis zur Wartung nach dem Einzug."),
  ("h2", "Aufbau"),
  ("check", ["<b>Teil 1 – Wissen & Ablauf:</b> alle Phasen eines Hausbaus in Österreich mit Checklisten, Pflichten und typischen Fehlern.",
             "<b>Teil 2 – Planung & Kosten:</b> Projekt-Steckbrief, Kontakte, Kostenplan nach ÖNORM B 1801-1, Finanzierung, "
             "Rechnungsjournal, Angebotsvergleich je Gewerk, Bauzeitenplan, Bemusterung und Elektroplanung Raum für Raum.",
             "<b>Teil 3 – Bautagebuch:</b> 160 Tageseinträge für die Dokumentation der Baustelle.",
             "<b>Teil 4 – Kontrolle & Abnahme:</b> Besprechungsprotokolle, Kontroll-Checklisten je Gewerk, Abnahmeprotokolle, Mängellisten.",
             "<b>Teil 5 – Hausakte & Wartung:</b> Unterlagen, Gewährleistungsfristen, Wartungsplan, Zählerstände, Begriffe, Skizzen."]),
  ("h2", "Drei Grundregeln"),
  ("check", ["<b>Alles schriftlich.</b> Mündliche Zusagen auf der Baustelle sind im Streitfall kaum beweisbar. Wichtige Absprachen "
             "im Bautagebuch notieren und per E-Mail bestätigen.",
             "<b>Alles mit Datum und Foto.</b> Fotos mit Datum, Ort und Foto-Nummer im Tagebuch vermerken.",
             "<b>Nichts unterschreiben oder bezahlen, was Sie nicht geprüft haben.</b> Regieberichte, Rechnungen und Abnahmen "
             "zuerst kontrollieren."]),
  ("tip", "Legen Sie zusätzlich einen Ordner (Papier oder digital) mit derselben Gliederung an. Dieses Buch ist das Steuerungs- "
          "und Nachweisbuch, der Ordner nimmt Verträge, Pläne, Bescheide und Rechnungen auf."),
  ("warn", "Bau- und Raumordnungsrecht ist in Österreich Landessache. Bezeichnungen wie Bauanzeige, Baubewilligung, "
           "Fertigstellungsanzeige oder Benützungsbewilligung unterscheiden sich je Bundesland. Fragen Sie im Zweifel immer "
           "zuerst bei Ihrer Baubehörde (Gemeinde) nach."),
 ]},
 {"title": "Der Hausbau in 10 Phasen", "blocks": [
  ("p", "Die Reihenfolge gilt für ein typisches Einfamilienhaus in Massivbauweise. Bei Fertighäusern verkürzt sich die Bauphase, "
        "die Schritte davor und danach bleiben gleich."),
  ("table", (["Phase", "Was passiert", "Ergebnis"], [
    ["1  Bedarf & Budget", "Raumprogramm, Wünsche, finanzieller Rahmen, Haushaltsrechnung", "Budgetrahmen inkl. Nebenkosten und Reserve"],
    ["2  Grundstück", "Suche, Prüfung von Widmung, Bebauungsbestimmungen, Gefahrenzonen, Boden, Aufschließung; Kauf", "Kaufvertrag, Grundbucheintragung"],
    ["3  Finanzierung", "Kreditangebote einholen und vergleichen, Förderungen klären", "Finanzierungszusage"],
    ["4  Planung", "Planer beauftragen, Entwurf, Einreichplan, Baubeschreibung, Energieausweis, Statik", "Einreichunterlagen"],
    ["5  Behördenverfahren", "Bauansuchen bzw. Bauanzeige, ggf. Bauverhandlung mit Nachbarn, Bescheid", "Rechtskräftige Bewilligung"],
    ["6  Ausschreibung & Vergabe", "Leistungen beschreiben, Angebote einholen und vergleichen, Verträge", "Unterschriebene Werkverträge, Bauzeitenplan"],
    ["7  Bauausführung", "Baustelleneinrichtung, Rohbau, Dach, Fenster, Haustechnik, Putz, Estrich, Ausbau", "Fertiges Gebäude"],
    ["8  Fertigstellung & Abnahme", "Abnahme je Gewerk, Mängel, Befunde sammeln, Fertigstellung melden", "Abnahmeprotokolle, Befunde"],
    ["9  Einzug", "Meldezettel, Verträge (Strom, Internet), Versicherungen umstellen", "Bewohnbares Zuhause"],
    ["10 Gewährleistung & Wartung", "Mängel innerhalb der Fristen geltend machen, Rücklässe freigeben, warten", "Werterhalt"],
   ], [1.6, 4.2, 2.6])),
  ("tip", "Die teuersten Fehler passieren in den Phasen 2, 4 und 6 – also bevor der erste Bagger kommt. Nehmen Sie sich dort Zeit."),
 ]},
 {"title": "Phase 1: Bedarf & Budget", "blocks": [
  ("h2", "Raumprogramm"),
  ("check", ["Wie viele Personen wohnen jetzt und in 10–20 Jahren im Haus? (Kinder, Eltern, Homeoffice)",
             "Welche Räume werden gebraucht, welche Größe? Schlafzimmer im Erdgeschoß für das Alter?",
             "Barrierefreiheit von Anfang an mitdenken: schwellenlose Dusche, breite Türen, ebenerdiger Zugang.",
             "Stauraum: Abstellraum, Technikraum, Garage/Carport, Fahrräder, Gartengeräte.",
             "Keller ja oder nein? (Kosten vs. Nutzfläche; Grundwasser und Hanglage prüfen)",
             "Heizsystem und Energiestandard festlegen (Wärmepumpe, Fernwärme, Biomasse; Photovoltaik).",
             "Wunschliste in Muss / Soll / Kann einteilen – das erleichtert später das Sparen."]),
  ("h2", "Budget"),
  ("p", "Rechnen Sie nicht nur mit den reinen Baukosten. Zum Gesamtbudget gehören Grundstück, Erwerbsnebenkosten, "
        "Aufschließung, Planung, Gebühren, Außenanlagen, Küche, Einrichtung, Umzug und eine Reserve. Die Nebenkosten-Checkliste "
        "in Teil 2 hilft, nichts zu vergessen."),
  ("check", ["Haushaltsrechnung erstellen: monatliches Nettoeinkommen minus Lebenshaltung = möglicher Spielraum für die Kreditrate.",
             "Puffer für Zinsänderung, Jobverlust oder Elternkarenz einplanen.",
             "Eigenmittel ehrlich bewerten (Ersparnisse, Bausparvertrag, Wertpapiere, Familienhilfe).",
             "Eigenleistung nur einplanen, wenn Zeit, Können und Helfer wirklich vorhanden sind.",
             "Reserve von 10–15 % der Baukosten fix im Budget vorsehen."]),
  ("tip", "Lassen Sie sich die Kosten pro m² Wohnnutzfläche von mehreren Baufirmen für Ihre Region nennen und vergleichen Sie "
          "nur gleiche Leistungsumfänge (z. B. „schlüsselfertig“ ist kein genormter Begriff)."),
 ]},
 {"title": "Phase 2: Grundstück prüfen und kaufen", "blocks": [
  ("p", "Ein Grundstück lässt sich nachträglich kaum verändern. Prüfen Sie deshalb vor dem Kauf, ob Sie dort so bauen dürfen "
        "und können, wie Sie es vorhaben."),
  ("h2", "Rechtliche Prüfung"),
  ("check", ["<b>Grundbuchauszug</b> anfordern: Eigentümer, Lasten (Pfandrechte), Dienstbarkeiten (Servitute, z. B. Wegerecht, Leitungsrecht), Vorkaufsrechte.",
             "<b>Flächenwidmungsplan</b> (Gemeinde): Ist das Grundstück als Bauland gewidmet? Welche Kategorie (z. B. Wohngebiet, Dorfgebiet)? Gibt es eine Aufschließungszone oder Bausperre?",
             "<b>Bebauungsplan / Bebauungsbestimmungen</b>: Bauweise (offen, gekuppelt), Bebauungsdichte, Gebäudehöhe, Baufluchtlinien, Dachform, Abstände.",
             "<b>Gefahrenzonenplan</b>: Hochwasser, Wildbach, Lawine, Rutschung. Online über das Geoinformationssystem Ihres Landes einsehbar.",
             "<b>Altlasten- und Verdachtsflächenkataster</b> (Umweltbundesamt) bzw. Auskunft des Landes.",
             "<b>Leitungen</b> im Grundstück (Strom, Gas, Wasser, Kanal, Telekom): Auskunft bei den Leitungsträgern einholen.",
             "<b>Baulandsicherungsverträge, Bebauungsfristen oder Infrastrukturbeiträge</b> der Gemeinde erfragen.",
             "Bei Grundstücken aus einer Teilung: Ist die Teilung genehmigt und im Grundbuch durchgeführt?"]),
  ("h2", "Technische Prüfung"),
  ("check", ["<b>Aufschließung:</b> Zufahrt, Wasser, Kanal (Schmutz- und Regenwasser), Strom, ggf. Gas/Fernwärme, Internet. Wer zahlt welche Anschlüsse? "
             "Liegt ein öffentlicher Kanal in der Nähe, besteht nach Landesrecht meist Anschlusspflicht.",
             "<b>Boden:</b> Bodengutachten (Tragfähigkeit, Grundwasser, Versickerungsfähigkeit für Regenwasser) – besonders bei Hang, Keller oder Lehmboden.",
             "<b>Hanglage:</b> Stützmauern und Erdbewegungen können sehr teuer werden.",
             "<b>Lage und Umgebung:</b> Lärm (Straße, Bahn, Gewerbe), Besonnung, Ausrichtung, Nachbarbebauung, geplante Bauprojekte.",
             "<b>Grenzen:</b> Sind die Grenzpunkte vermessen und in der Natur ersichtlich? Grenzkataster oder Grundsteuerkataster?"]),
  ("h2", "Kauf"),
  ("check", ["Kaufvertrag durch Notar oder Rechtsanwalt errichten lassen; Abwicklung über ein Treuhandkonto.",
             "Kaufpreis erst zahlen, wenn die lastenfreie Eintragung gesichert ist (Rangordnung, Treuhand).",
             "Erwerbsnebenkosten einplanen: Grunderwerbsteuer, Grundbuch-Eintragungsgebühr, Vertragserrichtung/Treuhand, ggf. Maklerprovision.",
             "Grunderwerbsteuer und Eintragungsgebühr werden in der Regel vom Vertragserrichter selbst berechnet und abgeführt."]),
  ("table", (["Erwerbsnebenkosten (Richtwerte)", "Höhe", "Hinweis"], [
    ["Grunderwerbsteuer", "3,5 % der Gegenleistung", "Grunderwerbsteuergesetz 1987"],
    ["Grundbuch-Eintragungsgebühr Eigentum", "1,1 %", "Gerichtsgebührengesetz"],
    ["Eintragung Pfandrecht (Kredit)", "1,2 % des Pfandbetrags", "Gerichtsgebührengesetz"],
    ["Vertragserrichtung / Treuhand", "nach Vereinbarung bzw. Tarif", "vorab schriftliches Angebot einholen"],
    ["Maklerprovision (Käufer)", "höchstens 3 % zzgl. 20 % USt", "Höchstsatz bei Kaufpreis über 48.448,51 €"],
   ], [3, 2.6, 3])),
  ("warn", "Die befristete Befreiung von den Grundbuchgebühren für den Hauptwohnsitz (§ 25a GGG) galt für Anträge von Juli 2024 "
           "bis Juni 2026 und ist ausgelaufen. Fragen Sie Ihren Vertragserrichter, ob zum Zeitpunkt Ihres Kaufs eine neue Begünstigung gilt."),
 ]},
 {"title": "Phase 3: Finanzierung", "blocks": [
  ("p", "Holen Sie mindestens drei Kreditangebote ein und vergleichen Sie nicht nur den Zinssatz, sondern die Gesamtkosten. "
        "Banken müssen Ihnen vor Vertragsabschluss ein Europäisches Standardisiertes Merkblatt (ESIS) aushändigen – damit lassen "
        "sich Angebote vergleichen."),
  ("h2", "Worauf achten"),
  ("check", ["<b>Effektivzinssatz</b> (enthält Gebühren) statt nur Sollzinssatz vergleichen.",
             "<b>Fixzins, variabler Zins oder Mischform</b>: Wie lange ist der Zins fix? Was passiert danach?",
             "<b>Laufzeit und Rate</b>: Rate auch bei steigenden Zinsen leistbar?",
             "<b>Nebenkosten</b>: Bearbeitungsgebühr, Schätzgebühr, Kontoführung, Pfandrechtseintragung (1,2 %), Versicherungen.",
             "<b>Sondertilgungen</b> und vorzeitige Rückzahlung: kostenlos möglich? Entschädigung?",
             "<b>Auszahlung nach Baufortschritt</b>: Bereitstellungsprovision? Wie werden Rechnungen eingereicht?",
             "<b>Förderdarlehen</b> des Landes mit dem Bankkredit abstimmen (Rangordnung im Grundbuch)."]),
  ("h2", "Typische Unterlagen für die Bank"),
  ("check", ["Lohn-/Gehaltszettel der letzten Monate bzw. Einkommensteuerbescheide (Selbständige: Bilanzen/E/A-Rechnungen)",
             "Kontoauszüge, Nachweis der Eigenmittel, bestehende Kredite und Leasingverträge",
             "Grundbuchauszug, Kaufvertrag, Lageplan",
             "Einreichplan, Baubeschreibung, Kostenaufstellung bzw. Angebote, Baubewilligung (sobald vorhanden)",
             "Lichtbildausweis, Meldezettel"]),
  ("tip", "Lassen Sie sich die Finanzierungszusage erst geben, wenn die Kostenschätzung realistisch ist. Eine nachträgliche "
          "Aufstockung ist teurer und nicht garantiert."),
 ]},
 {"title": "Phase 4: Planung", "blocks": [
  ("p", "Der Einreichplan muss von einer befugten Person erstellt werden, etwa einem Baumeister, Architekten oder "
        "Zivilingenieur. Achten Sie bei der Auswahl auf Referenzen und darauf, was im Honorar enthalten ist "
        "(Entwurf, Einreichung, Ausführungsplanung, Ausschreibung, Bauaufsicht)."),
  ("h2", "Checkliste Planung"),
  ("check", ["Planungsvertrag mit klar definierten Leistungsphasen und Honorar abschließen.",
             "Vermessung / Lage- und Höhenplan des Grundstücks erstellen lassen.",
             "Bebauungsbestimmungen, Abstände zu Nachbargrenzen und Stellplatzverpflichtung berücksichtigen.",
             "Ausrichtung: Wohnräume nach Süden/Westen, Nebenräume nach Norden; sommerlichen Wärmeschutz (Verschattung) einplanen.",
             "Haustechnik früh planen: Lage Technikraum, Schächte, Lüftung, Wärmepumpe (Schall zum Nachbarn!), PV-Ausrichtung.",
             "Energieausweis erstellen lassen (wird im Bauverfahren benötigt; Zeitpunkt der Vorlage je nach Bundesland).",
             "Statik / Tragwerksplanung beauftragen.",
             "Baubeschreibung mit Materialien und Qualitäten erstellen – Grundlage für Angebote.",
             "Möblierung in den Plan einzeichnen: Passen Bett, Schrank, Küche, Esstisch? Türanschläge prüfen.",
             "Elektroplanung Raum für Raum (Teil 2) vor der Rohinstallation abschließen."]),
  ("tip", "Änderungen am Papier kosten fast nichts – Änderungen auf der Baustelle kosten viel. Gehen Sie den Plan Raum für "
          "Raum gedanklich durch einen ganzen Tag durch: Aufstehen, Kochen, Einkauf ausladen, Wäsche, Müll, Gäste."),
 ]},
 {"title": "Phase 5: Behördenverfahren", "blocks": [
  ("p", "Baubehörde erster Instanz ist in der Regel die Gemeinde (Bürgermeister bzw. in Wien der Magistrat). Je nach Bundesland "
        "und Vorhaben ist eine Baubewilligung nötig oder eine Bauanzeige ausreichend. Ein Einfamilienhaus ist fast überall "
        "bewilligungspflichtig."),
  ("h2", "Typischer Ablauf"),
  ("check", ["Vorbesprechung bei der Baubehörde bzw. dem Bausachverständigen der Gemeinde (spart Zeit und Nachreichungen).",
             "Bauansuchen mit Einreichplänen, Baubeschreibung, Energieausweis, Grundbuchauszug und weiteren geforderten Unterlagen einreichen.",
             "Ggf. Bauverhandlung an Ort und Stelle: Nachbarn (Anrainer) können Einwendungen erheben, die Behörde prüft die Vorschriften.",
             "Baubewilligungsbescheid abwarten – erst nach Rechtskraft (Ablauf der Beschwerdefrist) bauen.",
             "Bauführer und Baubeginn der Behörde melden, sofern vorgeschrieben.",
             "Auflagen im Bescheid lesen und auf der Baustelle bekanntgeben (z. B. Höhenlage, Oberflächenwasser, Bepflanzung)."]),
  ("h2", "Baurecht der Bundesländer"),
  ("table", (["Bundesland", "Wichtigste Rechtsgrundlage"], [
    ["Burgenland", "Burgenländisches Baugesetz 1997"],
    ["Kärnten", "Kärntner Bauordnung 1996, Kärntner Bauvorschriften"],
    ["Niederösterreich", "NÖ Bauordnung 2014, NÖ Bautechnikverordnung 2014"],
    ["Oberösterreich", "Oö. Bauordnung 1994, Oö. Bautechnikgesetz 2013"],
    ["Salzburg", "Baupolizeigesetz 1997, Bautechnikgesetz 2015"],
    ["Steiermark", "Steiermärkisches Baugesetz 1995"],
    ["Tirol", "Tiroler Bauordnung 2022"],
    ["Vorarlberg", "Baugesetz 2001, Bautechnikverordnung"],
    ["Wien", "Bauordnung für Wien"],
   ], [2, 6])),
  ("p", "Die bautechnischen Anforderungen (Statik, Brandschutz, Schallschutz, Energie, Barrierefreiheit) stützen sich in allen "
        "Bundesländern weitgehend auf die OIB-Richtlinien. Alle Gesetze finden Sie kostenlos im Rechtsinformationssystem "
        "des Bundes (RIS) unter ris.bka.gv.at."),
  ("tip", "Sprechen Sie vor dem Einreichen mit den Nachbarn und zeigen Sie ihnen den Plan. Das verhindert viele Einwendungen."),
 ]},
 {"title": "Phase 6: Ausschreibung, Angebote, Verträge", "blocks": [
  ("p", "Sie können ein Haus über einen Generalunternehmer (ein Vertrag, ein Ansprechpartner), einen Bauträger (Haus mit "
        "Grundstück) oder durch Einzelvergabe an die Gewerke (mehr Steuerungsaufwand, oft günstiger) errichten."),
  ("h2", "Angebote vergleichbar machen"),
  ("check", ["Allen Firmen dieselbe Leistungsbeschreibung bzw. dasselbe Leistungsverzeichnis geben.",
             "Mindestens drei Angebote je Gewerk einholen (Vergleichsseiten in Teil 2).",
             "Was ist nicht enthalten? (Baustelleneinrichtung, Gerüst, Entsorgung, Baustrom, Reinigung)",
             "Einheitspreis (Abrechnung nach Aufmaß) oder Pauschalpreis? Bei Pauschale den Leistungsumfang genau festlegen.",
             "Gewerbeberechtigung im Gewerbeinformationssystem Austria (GISA) und Firmenbuch prüfen.",
             "Referenzen anrufen, fertige Bauten ansehen.",
             "Termine und Bauzeit verbindlich vereinbaren, ggf. mit Vertragsstrafe (Pönale)."]),
  ("h2", "Inhalt eines guten Bauvertrags"),
  ("check", ["Vertragspartner, Leistungsumfang (Leistungsverzeichnis, Pläne, Baubeschreibung als Vertragsbestandteil)",
             "Preis, Preisart (fest/veränderlich), Umsatzsteuer, Regiepreise für Zusatzleistungen",
             "Ausführungsfristen, Beginn und Fertigstellung, Folgen von Verzug",
             "Zahlungsplan nach erbrachtem Baufortschritt – keine großen Vorauszahlungen",
             "Haftrücklass bzw. Bankgarantie zur Absicherung der Gewährleistung",
             "Ob die ÖNORM B 2110 (Allgemeine Vertragsbestimmungen für Bauleistungen) gelten soll – sie gilt nur, wenn sie vereinbart ist",
             "Regelung für Zusatzaufträge: nur schriftlich, mit Preis vor Ausführung",
             "Abnahme, Übergabe der Unterlagen (Pläne, Befunde, Anleitungen)"]),
  ("warn", "Beim Kauf von einem Bauträger mit Vorauszahlungen gilt das Bauträgervertragsgesetz (BTVG): Ihre Zahlungen müssen "
           "abgesichert sein, z. B. nach Ratenplan mit grundbücherlicher Sicherstellung. Lassen Sie solche Verträge immer "
           "von Notar oder Anwalt prüfen."),
  ("tip", "Regiearbeiten (Abrechnung nach Stunden) nur anordnen, wenn sie unvermeidbar sind, und die Regieberichte täglich "
          "kontrollieren und abzeichnen – nicht erst Wochen später."),
 ]},
 {"title": "Phase 7: Pflichten als Bauherr", "blocks": [
  ("p", "Auch private Bauherren haben auf der Baustelle Pflichten. Viele davon betreffen Sicherheit und Haftung."),
  ("h2", "Bauarbeitenkoordinationsgesetz (BauKG)"),
  ("check", ["Werden auf der Baustelle Arbeitnehmer mehrerer Arbeitgeber tätig, muss der Bauherr einen "
             "<b>Planungskoordinator</b> und einen <b>Baustellenkoordinator</b> bestellen (das kann auch der Planer oder Baumeister sein).",
             "Ein <b>Sicherheits- und Gesundheitsschutzplan (SiGe-Plan)</b> ist zu erstellen, wenn eine Vorankündigung nötig ist "
             "oder besonders gefährliche Arbeiten anfallen.",
             "Eine <b>Vorankündigung</b> an das Arbeitsinspektorat ist nötig, wenn die Arbeiten voraussichtlich länger als 30 "
             "Arbeitstage dauern und dabei mehr als 20 Arbeitnehmer gleichzeitig beschäftigt werden, oder wenn der Umfang "
             "500 Personentage übersteigt – spätestens zwei Wochen vor Baubeginn.",
             "Eine <b>Unterlage für spätere Arbeiten</b> am Bauwerk (z. B. Dachwartung) ist zu erstellen und aufzubewahren.",
             "Der Bauherr kann diese Pflichten einem geeigneten Projektleiter übertragen – schriftlich festhalten.",
             "Wer ausschließlich selbst bzw. mit Nachbarschaftshilfe ohne Arbeitnehmer baut, fällt nicht unter das BauKG."]),
  ("h2", "Weitere Pflichten und Empfehlungen"),
  ("check", ["Bauführer bestellen und der Behörde melden, sofern die Landesbauordnung dies vorsieht.",
             "Benützung von öffentlichem Gut (Gehsteig, Straße für Kran, Container, Material) vorher bewilligen lassen (§ 82 bzw. § 90 StVO).",
             "Vor Grabungen Leitungsauskünfte einholen.",
             "Beweissicherung: Nachbargebäude, Straße und Zaun vor Baubeginn fotografieren (mit Datum).",
             "Baustelle absichern (Absperrung, Beleuchtung, Zutritt Unbefugter verhindern).",
             "Baustrom und Bauwasser rechtzeitig beim Netzbetreiber bzw. der Gemeinde beantragen.",
             "Baustellen-WC und Müllentsorgung organisieren (Baurestmassen getrennt sammeln)."]),
  ("h2", "Versicherungen"),
  ("check", ["<b>Bauherren-Haftpflicht</b>: Schäden Dritter durch die Baustelle (oft in der Haushalts- oder Eigenheimversicherung prüfen).",
             "<b>Rohbau-/Feuerrohbauversicherung</b>: Feuer, Sturm, Hagel während der Bauzeit; später in die Eigenheimversicherung umwandeln.",
             "<b>Bauwesenversicherung</b>: unvorhergesehene Schäden am Bauwerk während der Errichtung.",
             "<b>Unfallversicherung</b> für private Helfer – bei Nachbarschaftshilfe beraten lassen."]),
  ("warn", "Schwarzarbeit ist verboten und für Bauherren riskant: keine Gewährleistung, keine Haftung, kein Versicherungsschutz "
           "bei Unfällen, und Förderungen verlangen Rechnungen befugter Unternehmen."),
 ]},
 {"title": "Phase 7: Bauablauf und Gewerke", "blocks": [
  ("p", "Die folgende Reihenfolge ist typisch für ein massiv errichtetes Einfamilienhaus. Einzelne Arbeiten überschneiden sich. "
        "Entscheidend sind die Übergabepunkte zwischen den Gewerken – dort entstehen die meisten Fehler."),
  ("table", (["Schritt", "Gewerk", "Vorher prüfen / Übergabepunkt"], [
    ["1", "Absteckung, Erdarbeiten, Aushub", "Höhenlage lt. Bescheid, Schnurgerüst durch Vermesser, Leitungen"],
    ["2", "Fundament / Bodenplatte", "Fundamenterder durch Elektriker, Leerverrohrungen, Bewehrungsabnahme vor dem Betonieren"],
    ["3", "Abdichtung erdberührter Bauteile, Drainage", "Abdichtung lückenlos, Schutzschicht vor dem Verfüllen"],
    ["4", "Mauerwerk, Decken, Stiegen", "Maße, Öffnungen, Schlitze und Aussparungen lt. Plan, Bewehrungsabnahme Decken"],
    ["5", "Dachstuhl, Dachdeckung, Spengler", "Unterdach dicht, Anschlüsse, Dachrinnen; Gebäude ist dann „dicht“"],
    ["6", "Fenster und Außentüren", "Einbau mit abgedichteter Anschlussfuge, Fensterbank-Anschlüsse"],
    ["7", "Rohinstallation Elektro, Sanitär, Heizung, Lüftung", "Fotos aller Leitungen mit Maßband; Druckprobe der Rohrleitungen"],
    ["8", "Innenputz", "Installationen geprüft, Steckdosenhöhen kontrolliert, Luftdichtheit"],
    ["9", "Estrich (ggf. Fußbodenheizung)", "Fußbodenheizung abgedrückt, Randdämmstreifen, Höhen; danach Trocknungszeit"],
    ["10", "Fassade / Wärmedämmung", "Anschlüsse an Fenster, Sockel, Dach; Witterung"],
    ["11", "Fliesen, Bodenbeläge, Maler", "Belegreife des Estrichs per CM-Messung, Aufheizprotokoll bei Fußbodenheizung"],
    ["12", "Innentüren, Fertiginstallation, Küche", "Steckdosen, Schalter, Sanitärobjekte, Endmontage Heizung"],
    ["13", "Außenanlagen", "Gefälle weg vom Haus, Sockelschutz, Regenwasser, Zufahrt"],
   ], [0.7, 3.2, 5])),
  ("tip", "Planen Sie die Estrich-Trocknung realistisch ein. Faustregel bei Zementestrich: etwa eine Woche pro Zentimeter Dicke "
          "bei guten Bedingungen bis 4 cm, darüber deutlich länger. Bodenbeläge erst nach bestätigter Belegreife verlegen."),
 ]},
 {"title": "Förderungen", "blocks": [
  ("p", "Förderungen für Neubau und Sanierung gibt es von Land, Bund, Gemeinde und teilweise von Energieversorgern. "
        "Höhe und Bedingungen ändern sich häufig – prüfen Sie den aktuellen Stand immer vor der Auftragsvergabe."),
  ("h2", "Wo nachfragen"),
  ("check", ["<b>Wohnbauförderung des Landes</b>: Darlehen oder Zuschüsse für Eigenheime; oft an Energiestandard, Einkommen "
             "und Hauptwohnsitz gebunden. Informationen auf der Website Ihres Landes.",
             "<b>Bundesförderungen</b> (z. B. für Heizungstausch, thermische Sanierung): Information, Registrierung und Antrag über "
             "umweltfoerderung.at. Achtung: Die Mittel sind oft begrenzt – 2026 waren sie bereits im Juli ausgeschöpft. Früh registrieren.",
             "<b>Photovoltaik und Speicher</b>: Förderungen bzw. Investitionszuschüsse je nach aktueller Rechtslage – beim "
             "Energieberater des Landes nachfragen.",
             "<b>Gemeinde</b>: viele Gemeinden fördern z. B. Photovoltaik, Regenwassernutzung oder Begrünung.",
             "<b>Energieberatung</b> des Landes nutzen – oft kostenlos oder günstig und mit aktuellem Überblick."]),
  ("h2", "Regeln, damit die Förderung nicht verloren geht"),
  ("check", ["Viele Förderungen müssen <b>vor</b> Baubeginn bzw. vor Auftragserteilung beantragt oder registriert werden.",
             "Förderbedingungen (Energiekennzahl, Dämmstärken, Heizsystem) in die Planung und Ausschreibung übernehmen.",
             "Nur Rechnungen befugter Unternehmen werden anerkannt; Zahlungsnachweise aufbewahren.",
             "Fristen für Endabrechnung bzw. Nachweise im Kalender eintragen.",
             "Förderzusagen und -bescheide in der Hausakte ablegen; Auflagen (z. B. Hauptwohnsitz für bestimmte Dauer) beachten."]),
  ("table", (["Förderung", "Stelle", "Antrag bis / gestellt am", "Zusage", "Betrag"], [["", "", "", "", ""]] * 6, [2.4, 2.2, 2, 1.4, 1.4])),
 ]},
 {"title": "Phase 8–9: Fertigstellung und Einzug", "blocks": [
  ("h2", "Vor der Fertigstellung"),
  ("check", ["Abnahmen je Gewerk durchführen und protokollieren (Teil 4).",
             "Befunde und Bestätigungen sammeln – je nach Bundesland und Anlage z. B.: Elektro-Prüfbefund und Anlagenbuch, "
             "Befund des Rauchfangkehrers für Fänge und Feuerstätten, Dichtheitsnachweis Kanal, Bestätigung des Bauführers, "
             "Energieausweis (endgültig), Aufheizprotokoll Fußbodenheizung, Druckprobe Heizung/Sanitär.",
             "Fertigstellung der Baubehörde anzeigen bzw. Benützungsbewilligung beantragen – wie es Ihre Landesbauordnung vorsieht.",
             "Abweichungen vom bewilligten Plan klären – eventuell ist eine Planänderung einzureichen.",
             "Hausnummer bei der Gemeinde beantragen bzw. bestätigen lassen."]),
  ("h2", "Beim Einzug"),
  ("check", ["Wohnsitz innerhalb von drei Tagen nach dem Bezug anmelden (Meldegesetz).",
             "Adressänderungen: Arbeitgeber, Bank, Versicherungen, Zulassungsschein (Kfz), Post-Nachsendeauftrag.",
             "Strom-, Gas-/Wärme- und Internetverträge abschließen; Zählerstände bei Übernahme notieren.",
             "Rohbauversicherung in eine Eigenheimversicherung umwandeln.",
             "Müllabfuhr und Kanal bei der Gemeinde anmelden (Gebührenbescheide).",
             "Rauchwarnmelder prüfen bzw. montieren."]),
  ("tip", "Machen Sie am Tag der Schlüsselübergabe eine Fotodokumentation jedes Raumes. Mängel, die beim Einzug durch Möbel "
          "entstehen, lassen sich sonst nicht mehr von Baumängeln unterscheiden."),
 ]},
 {"title": "Phase 10: Gewährleistung und Garantie", "blocks": [
  ("p", "<b>Gewährleistung</b> ist die gesetzliche Haftung des Unternehmers dafür, dass seine Leistung bei Übergabe mangelfrei "
        "ist. Für Bauleistungen an unbeweglichen Sachen beträgt die Gewährleistungsfrist <b>drei Jahre ab Übergabe</b> "
        "(§ 933 ABGB). Seit 2022 kann der Anspruch noch drei Monate nach Ablauf dieser Frist gerichtlich geltend gemacht werden. "
        "Vertraglich können längere oder – unter Unternehmern – kürzere Fristen vereinbart sein."),
  ("p", "<b>Garantie</b> ist eine freiwillige Zusage eines Herstellers oder Unternehmers mit eigenen Bedingungen "
        "(z. B. 10 Jahre auf Fenster nur bei jährlicher Wartung). Garantiebedingungen aufbewahren und einhalten."),
  ("h2", "So sichern Sie Ihre Ansprüche"),
  ("check", ["Mängel sofort schriftlich (E-Mail oder eingeschriebener Brief) mit Foto und Frist zur Behebung melden.",
             "Ende jeder Gewährleistungsfrist in der Übersicht (Teil 5) und im Kalender eintragen.",
             "Vor Ablauf der Gewährleistung eine Begehung machen (am besten mit Sachverständigem) und alle Mängel melden.",
             "Haftrücklass bzw. Bankgarantie erst freigeben, wenn alle gemeldeten Mängel behoben sind.",
             "Bei Streit: Sachverständigen beiziehen, Beweise sichern, Fristen nicht verstreichen lassen, rechtzeitig Rechtsberatung."]),
  ("warn", "Verlassen Sie sich nicht darauf, dass Gespräche über einen Mangel die Frist verlängern. Lassen Sie sich im Zweifel "
           "rechtzeitig beraten, bevor eine Frist abläuft."),
 ]},
]

# ------------------------------------------------------------------ Teil 2
KOSTEN_INTRO = ("Die ÖNORM B 1801-1 gliedert die Kosten eines Bauprojekts in Kostenbereiche. Wer von Anfang an nach dieser "
                "Gliederung plant, kann Angebote, Aufträge und Rechnungen sauber zuordnen und sieht Abweichungen sofort. "
                "Tragen Sie Budget, beauftragte Summen und abgerechnete Beträge regelmäßig nach.")
KOSTENBEREICHE = ["0 Grund (Kaufpreis, Erwerbsnebenkosten)", "1 Aufschließung (Anschlüsse, Abgaben, Erdarbeiten Grund)",
                  "2 Bauwerk – Rohbau", "3 Bauwerk – Technik (Heizung, Sanitär, Elektro, Lüftung)",
                  "4 Bauwerk – Ausbau (Fenster, Böden, Fliesen, Türen, Maler …)", "5 Einrichtung (Küche, Möbel)",
                  "6 Außenanlagen (Garten, Zufahrt, Zaun, Carport)", "7 Planungsleistungen (Planer, Statik, Energieausweis)",
                  "8 Nebenleistungen (Gebühren, Versicherungen, Finanzierung, Koordination)", "9 Reserven"]
NEBENKOSTEN_INTRO = "Diese Positionen werden bei der Budgetplanung am häufigsten vergessen."
NEBENKOSTEN = [
    ("Grunderwerbsteuer", "3,5 % vom Kaufpreis"), ("Grundbuch Eigentum", "1,1 % vom Kaufpreis"),
    ("Grundbuch Pfandrecht", "1,2 % vom Pfandbetrag"), ("Notar / Anwalt / Treuhand", "Angebot einholen"),
    ("Maklerprovision", "max. 3 % + USt"), ("Vermessung, Teilung, Absteckung", "Vermesser"),
    ("Bodengutachten", "vor Planung"), ("Aufschließungsabgabe / Bauabgabe", "Gemeinde – vorab erfragen"),
    ("Kanal-/Wasseranschlussgebühr", "Gemeinde"), ("Stromanschluss / Netzzutritt", "Netzbetreiber"),
    ("Internetanschluss / Glasfaser", "Anbieter"), ("Planung, Einreichung, Bauaufsicht", "Honorarangebot"),
    ("Statik, Energieausweis", "Honorarangebot"), ("Baustellenkoordination (BauKG)", "falls erforderlich"),
    ("Baustrom, Bauwasser, Baustellen-WC", "laufende Kosten"), ("Versicherungen Bauzeit", "Haftpflicht, Rohbau"),
    ("Kreditnebenkosten", "Bearbeitung, Schätzung, Zinsen in der Bauzeit"), ("Behördengebühren, Verwaltungsabgaben", "Gemeinde"),
    ("Außenanlagen, Zaun, Zufahrt", "oft unterschätzt"), ("Küche, Beleuchtung, Möbel, Vorhänge", ""),
    ("Umzug, Doppelmiete", ""), ("Reserve 10–15 %", "für Unvorhergesehenes"),
]
KREDIT_VERGLEICH = ["Kreditbetrag", "Laufzeit", "Sollzinssatz / Zinsbindung", "Effektivzinssatz", "Monatliche Rate",
                    "Gesamtbetrag lt. ESIS", "Bearbeitungs-/Schätzgebühr", "Sondertilgung möglich?", "Bereitstellungsprovision",
                    "Verlangte Versicherungen", "Angebot gültig bis"]
ZAHLUNG_INTRO = ("Jede Rechnung vor der Zahlung prüfen: Stimmt die Leistung mit Auftrag und Baufortschritt überein? Sind Teilzahlungen "
                 "und vereinbarte Rücklässe richtig abgezogen? Erst dann zahlen und das Datum eintragen.")
GEWERKE_ANGEBOT = ["Baumeister / Rohbau", "Zimmerer / Dachstuhl", "Dachdecker / Spengler", "Fenster / Außentüren", "Elektro",
                   "Sanitär / Heizung / Lüftung", "Estrich", "Fassade / Wärmedämmung", "Fliesen", "Bodenbeläge", "Maler",
                   "Innentüren", "Außenanlagen", "", ""]
ANGEBOT_KRITERIEN = ["Angebotsdatum / gültig bis", "Preis netto €", "Preis brutto €", "Einheitspreis oder Pauschale",
                     "Leistungsumfang vollständig?", "Nicht enthalten", "Ausführungszeitraum", "Zahlungsbedingungen",
                     "Haftrücklass / Garantie", "Gewerbeberechtigung (GISA) geprüft", "Referenzen geprüft",
                     "Eindruck / Erreichbarkeit", "Rückfragen offen", "Entscheidung ✓"]
BAUABLAUF = ["Planung / Einreichung", "Bewilligung", "Erdarbeiten", "Fundament / Bodenplatte", "Rohbau", "Dach",
             "Fenster / Türen", "Rohinstallation Elektro", "Rohinstallation Sanitär/Heizung", "Innenputz", "Estrich + Trocknung",
             "Fassade", "Fliesen / Böden", "Maler", "Innentüren / Fertiginstallation", "Küche", "Außenanlagen", "Abnahmen", "Einzug"]
BEMUSTERUNG_INTRO = ("Halten Sie jede Ausstattungsentscheidung fest – mit Produkt, Farbe und Preis. Erst wenn eine Position als "
                     "„fix“ markiert ist, wird bestellt. So vermeiden Sie Missverständnisse und teure Nachbestellungen.")
ELEKTRO_INTRO = ("Die Elektroplanung muss vor der Rohinstallation fertig sein. Gehen Sie jeden Raum gedanklich durch: "
                 "Wo stehen Möbel, wo wird gearbeitet, geladen, gekocht? Diese Punkte werden besonders oft vergessen:")
ELEKTRO_VERGESSEN = ["Steckdosen außen (Terrasse, Garten, Eingang) und für Weihnachtsbeleuchtung",
                     "Leerverrohrung bzw. Zuleitung für Wallbox / E-Auto in Garage oder Carport",
                     "Netzwerkkabel (LAN) in Büro, Wohnzimmer (TV) und zu Access-Points an Decke/Gang",
                     "Leerrohre vom Technikraum in alle Geschoße und zum Dach (Photovoltaik, Sat, Nachrüstungen)",
                     "Strom für Raffstore/Jalousien, Garagentor, Bewegungsmelder, Klingel/Gegensprechanlage",
                     "Steckdosen auf Arbeitshöhe in der Küche (genug!) und für Dunstabzug, Kühlschrank, Geschirrspüler",
                     "Herd- und Backofenanschluss (Starkstrom), Waschmaschine und Trockner im richtigen Raum",
                     "Steckdose am Dachboden, im Abstellraum (Staubsauger-Akku) und neben dem Bett beidseitig",
                     "Lichtschalter bei jedem Zugang eines Raumes (Wechsel-/Kreuzschaltung)",
                     "Rauchwarnmelder-Positionen; Orientierungslicht im Gang"]
RAEUME = ["Eingang / Windfang", "Garderobe / Gang EG", "Wohnzimmer", "Esszimmer", "Küche", "Speis / Abstellraum", "WC EG",
          "Technikraum", "Stiegenhaus", "Schlafzimmer", "Kinderzimmer 1", "Kinderzimmer 2", "Bad", "WC OG", "Büro / Gästezimmer",
          "Gang OG", "Garage / Carport", "Terrasse / Außen", "", ""]
ELEKTRO_ELEMENTE = ["Steckdosen (einfach/doppelt)", "Lichtauslass Decke/Wand", "Schalter", "Netzwerk (LAN)", "TV / Sat",
                    "Rauchwarnmelder", "Jalousie / Raffstore", "Sonstiges"]

# ------------------------------------------------------------------ Teil 3
TAGEBUCH_INTRO = ("Das Bautagebuch ist Ihr wichtigstes Beweismittel. Es zeigt, wer wann was gemacht hat, welche Probleme es gab "
                  "und was vereinbart wurde. Einträge sollen am selben Tag gemacht werden – nachträgliche Notizen sind weniger glaubwürdig.")
TAGEBUCH_TIPPS = ["Jeden Baustellenbesuch eintragen, auch wenn niemand gearbeitet hat (\"keine Firma anwesend\" ist ebenfalls eine wichtige Information).",
                  "Wetter notieren – Frost, Regen und Hitze beeinflussen Beton, Estrich, Putz und Abdichtungen.",
                  "Fotos nummerieren und die Nummern im Eintrag vermerken; Detailfotos mit Maßband.",
                  "Behinderungen sofort festhalten (fehlendes Material, Vorgewerk nicht fertig) – wichtig bei Terminverzug und Mehrkosten.",
                  "Anordnungen an Firmen mit Namen der Person notieren und per E-Mail bestätigen.",
                  "Lieferscheine kontrollieren: Menge, Qualität, Beschädigungen."]

# ------------------------------------------------------------------ Teil 4
KONTROLLE = [
 {"title": "Erdarbeiten und Fundament", "intro": "Fehler in dieser Phase sind später kaum oder nur sehr teuer zu beheben.",
  "items": ["Absteckung und Höhenlage (Fußbodenoberkante) entsprechen Plan und Bescheid; durch Vermesser bestätigt.",
            "Leitungsauskünfte liegen vor; vorhandene Leitungen markiert.",
            "Aushub-Material: Was bleibt für die Hinterfüllung, was wird abtransportiert?",
            "Fundamenterder vom Elektriker eingelegt und dokumentiert (Foto, Messprotokoll).",
            "Leerrohre für Hausanschlüsse (Strom, Wasser, Kanal, Telekom) lagerichtig eingelegt; Hauseinführungen dicht.",
            "Bewehrung vor dem Betonieren durch Statiker/Bauleiter abgenommen (Protokoll).",
            "Betonieren nicht bei Frost; Nachbehandlung (feucht halten) bei Hitze.",
            "Abdichtung erdberührter Bauteile lückenlos, Anschlüsse und Durchdringungen sauber ausgeführt, fotografiert.",
            "Drainage und Schutzschicht vor dem Verfüllen kontrolliert."],
  "tip": "Lassen Sie sich die Bewehrungsabnahme immer schriftlich bestätigen. Nach dem Betonieren ist nichts mehr zu sehen."},
 {"title": "Rohbau", "intro": "Kontrollieren Sie Maße und Öffnungen, solange Änderungen noch einfach möglich sind.",
  "items": ["Raummaße, Wandstärken und Raumhöhen stimmen mit dem Polierplan überein.",
            "Fenster- und Türöffnungen: Breite, Höhe, Parapethöhe kontrolliert.",
            "Schlitze und Durchbrüche für Haustechnik an den geplanten Stellen.",
            "Mauerwerk lot- und fluchtgerecht, Stoßfugen nach Herstellervorgabe, keine beschädigten Steine vermauert.",
            "Deckenbewehrung vor dem Betonieren abgenommen; Leerrohre in der Decke vor dem Betonieren fotografiert.",
            "Stiegenmaße (Steigung, Auftritt, Kopfhöhe) geprüft.",
            "Rohbau vor Witterung geschützt (Mauerkronen abgedeckt)."]},
 {"title": "Dach und Spengler", "intro": "Ab hier soll das Gebäude dicht sein.",
  "items": ["Holzqualität und Dimensionen lt. Statik; Holzschutz wo erforderlich.",
            "Unterdach bzw. Unterdeckbahn dicht, Überlappungen und Anschlüsse verklebt.",
            "Dämmung lückenlos; Dampfbremse/Luftdichtheitsebene innen dicht verklebt, Durchdringungen abgedichtet.",
            "Dachdeckung nach Herstellervorgabe befestigt (Sturmsicherung).",
            "Spenglerarbeiten: Rinnen mit Gefälle, Ablaufrohre an Kanal oder Versickerung angeschlossen.",
            "Sicherheitseinrichtungen für spätere Dacharbeiten (Anschlagpunkte, Steigschutz) laut Unterlage vorhanden.",
            "Durchführungen für Photovoltaik, Lüftung und Kamin sauber eingebunden."]},
 {"title": "Fenster und Außentüren", "intro": "Undichte Fensteranschlüsse sind eine der häufigsten Ursachen für Bauschäden.",
  "items": ["Lieferung kontrolliert: Maße, Öffnungsrichtung, Glas (Sicherheitsglas wo vereinbart), Farbe, keine Kratzer.",
            "Montage in der geplanten Lage in der Dämmebene.",
            "Anschlussfuge innen luftdicht, außen schlagregendicht und diffusionsoffen ausgeführt (z. B. nach ÖNORM B 5320).",
            "Befestigung nach Herstellervorgabe, keine Montageschaum-Verklebung als alleinige Befestigung.",
            "Fensterbänke innen/außen mit Gefälle und dichten seitlichen Anschlüssen.",
            "Funktion geprüft: Öffnen, Kippen, Schließen, Dichtungen, Haustürschloss.",
            "Schutzfolien und Abdeckungen bis zum Ende der Putzarbeiten."]},
 {"title": "Elektro-Rohinstallation", "intro": "Vor dem Verputzen ist die letzte Chance für Änderungen ohne Stemmarbeiten.",
  "items": ["Alle Auslässe lt. Elektroplanung (Teil 2) vorhanden – Raum für Raum abhaken.",
            "Höhen von Steckdosen und Schaltern kontrolliert (Küche: über Arbeitsplatte, Bad: Schutzbereiche).",
            "Leerrohre für Netzwerk, Photovoltaik, Wallbox, Außenbereich vorhanden.",
            "Unterverteiler mit ausreichend Reserveplatz.",
            "Leitungen nur in den Installationszonen geführt.",
            "Alle Leitungen mit Maßband fotografiert und Fotos nummeriert.",
            "Nach Fertigstellung: Prüfbefund und Anlagenbuch (nach OVE E 8101) von der Elektrofirma verlangen."]},
 {"title": "Sanitär, Heizung, Lüftung", "intro": "Wasser- und Heizungsleitungen müssen vor dem Verschließen geprüft sein.",
  "items": ["Lage aller Anschlüsse (WC, Waschtisch, Dusche, Küche, Waschmaschine, Außenwasser) lt. Plan.",
            "Druckprobe der Trinkwasser- und Heizungsleitungen mit Protokoll.",
            "Gefälle der Abwasserleitungen, Rückstausicherung wo erforderlich.",
            "Leitungen gedämmt (Warmwasser, Heizung, Kaltwasser gegen Tauwasser).",
            "Fußbodenheizung: Verlegeabstände, Heizkreise beschriftet, Druckprobe vor dem Estrich.",
            "Wärmepumpe: Aufstellort mit Abstand und Schallschutz zum Nachbarn wie geplant.",
            "Lüftungsanlage: Kanäle sauber verschlossen während der Bauzeit (kein Staub).",
            "Alle Leitungen vor dem Verschließen fotografiert."]},
 {"title": "Innenputz und Estrich", "intro": "Diese Arbeiten bringen sehr viel Feuchtigkeit ins Haus – Lüften ist Pflicht.",
  "items": ["Vor dem Putz: Installationen fertig und geprüft, Fenster geschützt, Ecken mit Schutzprofilen.",
            "Luftdichtheitsmessung (Blower-Door-Test) einplanen, solange Leckagen noch zugänglich sind – oft Voraussetzung für Förderungen.",
            "Putzoberflächen eben, Kanten gerade, keine Risse; Oberflächenqualität wie vereinbart.",
            "Estrich: Randdämmstreifen umlaufend, Trittschalldämmung lückenlos, Höhen gemessen.",
            "Estrich nicht bei Frost einbringen; in den ersten Tagen vor Zugluft und direkter Sonne schützen.",
            "Konsequent stoßlüften; Bautrockner nach Absprache.",
            "Bei Fußbodenheizung: Funktions- und Belegreifheizen nach Protokoll; Protokoll aufbewahren.",
            "Vor dem Belag: Belegreife durch CM-Messung des Bodenlegers bestätigen lassen."],
  "tip": "Zu frühes Verlegen auf feuchtem Estrich ist eine Hauptursache für gewölbte Parkettböden und lose Fliesen."},
 {"title": "Ausbau: Fliesen, Böden, Maler, Türen", "intro": "Optische Mängel sind jetzt leicht zu erkennen – prüfen Sie bei gutem Licht.",
  "items": ["Fliesen: Fugenbild, Höhenversatz, Gefälle in der Dusche zum Ablauf, Abdichtung im Nassbereich vor dem Fliesen.",
            "Silikonfugen sauber und vollständig (Wartungsfugen!).",
            "Parkett/Boden: Dehnfugen zu Wänden, Übergänge, keine Hohlstellen, Sockelleisten.",
            "Maler: gleichmäßige Deckung, keine Ansätze, Kanten sauber, Farbe lt. Bemusterung.",
            "Innentüren: Maße, Anschlag, Schließfunktion, Luftspalt für Lüftung, keine Beschädigungen.",
            "Schutz bereits fertiger Bauteile (Böden abdecken) bis zum Ende der Arbeiten."]},
 {"title": "Außenanlagen", "intro": "Die Außenanlagen schützen das Haus vor Wasser.",
  "items": ["Gelände fällt vom Haus weg; Sockel vor Spritzwasser geschützt (Kiesstreifen).",
            "Regenwasser: Versickerung oder Kanal wie bewilligt; Sickerschacht ausreichend dimensioniert.",
            "Zufahrt und Stellplätze tragfähig, Entwässerung vorhanden.",
            "Zaun und Mauern innerhalb der Grundgrenze und lt. Bauvorschriften (Höhe).",
            "Außenwasserhahn frostsicher bzw. absperrbar und entleerbar.",
            "Bepflanzung mit Abstand zu Gebäude, Leitungen und Nachbargrenze."]},
]
ABNAHME_WISSEN = [
 ("p", "Mit der Abnahme bestätigen Sie, dass eine Leistung im Wesentlichen vertragsgemäß erbracht wurde. Ab der Übergabe läuft "
       "in der Regel die Gewährleistungsfrist. Nehmen Sie sich Zeit und lassen Sie sich nicht drängen."),
 ("h2", "Vorbereitung"),
 ("check", ["Termin bei Tageslicht vereinbaren; Taschenlampe, Wasserwaage, Maßband, Kamera und dieses Buch mitnehmen.",
            "Vertrag, Pläne, Baubeschreibung und Bemusterungsliste griffbereit haben.",
            "Bei größeren Gewerken oder Unsicherheit einen unabhängigen Sachverständigen beiziehen."]),
 ("h2", "Durchführung"),
 ("check", ["Raum für Raum systematisch prüfen: Decke, Wände, Boden, Fenster, Türen, Installationen, Funktionen.",
            "Jeden Mangel genau beschreiben (Ort, Art, Größe) und fotografieren.",
            "Ein gemeinsames, von beiden Seiten unterschriebenes Protokoll anfertigen.",
            "Behebungsfrist für jeden Mangel vereinbaren.",
            "Unterlagen übernehmen: Bestandspläne, Prüfbefunde, Bedienungsanleitungen, Garantiescheine, Wartungshinweise.",
            "Bei wesentlichen Mängeln, die die Benutzung beeinträchtigen, kann die Abnahme verweigert werden."]),
 ("tip", "Unterschreiben Sie kein Protokoll mit dem Satz „mängelfrei übernommen“, wenn Ihnen Mängel aufgefallen sind. Lassen "
         "Sie diese Mängel ausdrücklich ins Protokoll schreiben."),
]
MAENGEL_INTRO = ("Jeden Mangel mit Datum, genauem Ort und Foto-Nummer erfassen. Die betroffene Firma schriftlich zur Behebung "
                 "innerhalb einer angemessenen Frist auffordern und das Datum der Behebung eintragen.")

# ------------------------------------------------------------------ Teil 5
HAUSAKTE_INTRO = ("Diese Unterlagen brauchen Sie bei Verkauf, Umbau, Versicherungsfällen, Gewährleistung und Förderprüfungen. "
                  "Bewahren Sie sie dauerhaft auf – Originale an einem sicheren Ort, Kopien digital.")
HAUSAKTE = ["Kaufvertrag Grundstück, Grundbuchauszug", "Einreichpläne, Baubewilligungsbescheid, Planänderungen",
            "Polier-/Ausführungspläne und Bestandspläne", "Statik, Bewehrungsabnahmen", "Energieausweis",
            "Bauverträge, Angebote, Leistungsverzeichnisse", "Schlussrechnungen und Zahlungsnachweise",
            "Abnahme- und Übergabeprotokolle", "Elektro-Prüfbefund und Anlagenbuch", "Befund Rauchfangkehrer",
            "Druckproben Heizung/Sanitär, Aufheizprotokoll", "Luftdichtheitsmessung (Blower-Door)", "Dichtheitsnachweis Kanal",
            "Fertigstellungsanzeige bzw. Benützungsbewilligung", "Fotos aller Leitungen vor dem Verputzen",
            "Bedienungsanleitungen, Garantiescheine", "Wartungsverträge und Wartungsnachweise", "Förderansuchen, Förderzusagen",
            "Kreditverträge", "Versicherungspolizzen", "Unterlage für spätere Arbeiten (BauKG)", "Farben, Fliesen, Bodenbeläge (Restmengen, Typen)"]
GEWAEHR_INTRO = ("Tragen Sie für jedes Gewerk das Abnahmedatum und das Ende der Gewährleistung ein (bei Bauleistungen in der Regel "
                 "drei Jahre ab Übergabe, sofern nichts anderes vereinbart ist). Planen Sie einige Wochen vor Fristende eine Begehung ein.")
WARTUNG_INTRO = ("Regelmäßige Wartung erhält den Wert des Hauses und ist oft Bedingung für Herstellergarantien. "
                 "Herstellervorgaben gehen diesen allgemeinen Empfehlungen vor.")
WARTUNG = [
    ("Heizung / Wärmepumpe", "jährlich", "Fachfirma", "Service lt. Hersteller; Garantiebedingungen beachten"),
    ("Rauchfang und Feuerstätten", "lt. Kehrordnung", "Rauchfangkehrer", "gesetzliche Überprüfungen nach Landesrecht"),
    ("Rauchwarnmelder", "regelmäßig", "selbst", "Testknopf drücken; Batterie bzw. Gerät lt. Hersteller tauschen"),
    ("Lüftungsanlage", "lt. Hersteller", "selbst/Fachfirma", "Filter wechseln, Ventile reinigen"),
    ("Dachrinnen und Abläufe", "jährlich (Herbst)", "selbst/Spengler", "Laub entfernen, Abläufe freihalten"),
    ("Dach (Sichtkontrolle)", "jährlich, nach Sturm", "Dachdecker", "lose Ziegel, Anschlüsse, Durchdringungen"),
    ("Fenster und Türen", "jährlich", "selbst", "Beschläge ölen, Dichtungen pflegen, Entwässerung frei"),
    ("Silikon- und Wartungsfugen", "jährlich", "selbst/Fliesenleger", "Risse und Ablösungen erneuern"),
    ("Rückstausicherung", "lt. Hersteller", "selbst/Installateur", "Funktion prüfen, reinigen"),
    ("Außenwasserhahn", "vor dem Frost", "selbst", "absperren und entleeren"),
    ("Photovoltaik", "jährlich", "selbst/Fachfirma", "Ertrag kontrollieren, Sichtprüfung, Wechselrichter-Meldungen"),
    ("FI-Schutzschalter", "lt. Hersteller", "selbst", "Prüftaste drücken"),
    ("Fassade, Sockel", "jährlich", "selbst", "Risse, Algen, Spritzwasserschäden"),
    ("Sickerschacht / Drainage", "alle paar Jahre", "Fachfirma", "Funktion prüfen, ggf. spülen"),
]
GLOSSAR = [
    ("Abnahme", "Formelle Übernahme einer Bauleistung durch den Auftraggeber; meist Beginn der Gewährleistungsfrist."),
    ("Anrainer", "Nachbarn, die im Bauverfahren Parteistellung haben können."),
    ("Aufschließung", "Anbindung eines Grundstücks an Straße, Wasser, Kanal, Strom usw."),
    ("Baubewilligung", "Bescheid der Baubehörde, der ein Bauvorhaben erlaubt."),
    ("Bauführer", "Befugte Person bzw. Firma, die für die fachgerechte Ausführung verantwortlich ist (je nach Landesrecht)."),
    ("Bauträger", "Unternehmen, das Gebäude errichtet und samt Grund verkauft; Schutz durch das BTVG."),
    ("Bebauungsplan", "Verordnung der Gemeinde mit Regeln zu Bauweise, Höhe, Dichte und Lage von Gebäuden."),
    ("Belegreife", "Zustand, in dem der Estrich trocken genug für den Bodenbelag ist; Prüfung per CM-Messung."),
    ("Bescheid", "Schriftliche, rechtsverbindliche Entscheidung einer Behörde."),
    ("Blower-Door-Test", "Messung der Luftdichtheit der Gebäudehülle."),
    ("Einheitspreis", "Preis je Mengeneinheit (m², m, Stück); abgerechnet wird nach tatsächlicher Menge."),
    ("Einlagezahl (EZ)", "Nummer der Grundbuchseinlage, in der ein Grundstück eingetragen ist."),
    ("Einreichplan", "Planunterlagen für das Bauansuchen bei der Behörde."),
    ("Energieausweis", "Dokument über die energetische Qualität eines Gebäudes (z. B. Heizwärmebedarf HWB)."),
    ("ESIS", "Europäisches Standardisiertes Merkblatt – Pflichtinformation der Bank zu einem Wohnkredit."),
    ("Flächenwidmungsplan", "Verordnung der Gemeinde, die festlegt, wie Flächen genutzt werden dürfen (z. B. Bauland, Grünland)."),
    ("Fundamenterder", "Erdungsanlage im Fundament, vom Elektriker vor dem Betonieren eingelegt."),
    ("Garantie", "Freiwillige Zusage eines Herstellers oder Unternehmers über die gesetzliche Gewährleistung hinaus."),
    ("Gewährleistung", "Gesetzliche Haftung für Mängel, die bei Übergabe vorhanden sind; bei Bauleistungen meist drei Jahre."),
    ("GISA", "Gewerbeinformationssystem Austria – öffentliche Abfrage von Gewerbeberechtigungen."),
    ("Haftrücklass", "Einbehalt eines Teils der Schlussrechnung als Sicherheit für die Gewährleistung; oft durch Bankgarantie ablösbar."),
    ("HWB", "Heizwärmebedarf in kWh/m²a – Kennzahl im Energieausweis."),
    ("Katastralgemeinde (KG)", "Vermessungs- und Grundbuchsbezirk innerhalb einer Gemeinde."),
    ("Leistungsverzeichnis (LV)", "Detaillierte Beschreibung der Leistungen mit Positionen und Mengen als Grundlage für Angebote."),
    ("OIB-Richtlinien", "Bautechnische Richtlinien des Österreichischen Instituts für Bautechnik, von den Ländern übernommen."),
    ("ÖBA", "Örtliche Bauaufsicht – überwacht für den Bauherrn die Ausführung auf der Baustelle."),
    ("ÖNORM B 2110", "Allgemeine Vertragsbestimmungen für Bauleistungen; gilt nur, wenn sie vereinbart wird."),
    ("Pauschalpreis", "Fixer Gesamtpreis für einen festgelegten Leistungsumfang."),
    ("Polier", "Vorarbeiter bzw. Baustellenleiter einer Baufirma vor Ort."),
    ("Pönale", "Vertragsstrafe, z. B. bei Terminüberschreitung."),
    ("Regiearbeit", "Arbeit, die nach tatsächlichem Aufwand (Stunden, Material) abgerechnet wird."),
    ("SiGe-Plan", "Sicherheits- und Gesundheitsschutzplan nach dem BauKG."),
    ("Teilrechnung", "Rechnung über einen Teil der Leistung nach Baufortschritt."),
    ("Treuhand", "Abwicklung des Kaufpreises über Notar oder Anwalt zur Absicherung beider Seiten."),
]
