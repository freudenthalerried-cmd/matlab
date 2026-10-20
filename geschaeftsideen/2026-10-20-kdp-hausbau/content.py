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

# Teil 1 (Ratgeber) steht in kapitel/*.md

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
    ("Kanal-/Wasseranschlussgebühr", "Gemeinde"), ("Stromanschluss", "Netzbetreiber"),
    ("Internetanschluss / Glasfaser", "Anbieter"), ("Planung, Einreichung, Bauaufsicht", "Honorarangebot"),
    ("Statik, Energieausweis", "Honorarangebot"), ("Baustellenkoordination (BauKG)", "falls erforderlich"),
    ("Baustrom, Bauwasser, Baustellen-WC", "laufende Kosten"), ("Versicherungen Bauzeit", "Haftpflicht, Rohbau"),
    ("Kreditnebenkosten", "Bearbeitung, Schätzung, Zinsen in der Bauzeit"), ("Behördengebühren, Verwaltungsabgaben", "Gemeinde"),
    ("Außenanlagen, Zaun, Zufahrt", "oft unterschätzt"), ("Küche, Beleuchtung, Möbel, Vorhänge", ""),
    ("Umzug, Doppelmiete", ""), ("Reserve 10–15 % der Bauwerkskosten", "für Unvorhergesehenes"),
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
            "Erder nach OVE E 8014 verlegt (bei gedämmter Bodenplatte: Ringerder außerhalb der Dämmung) und dokumentiert (Foto, Messprotokoll).",
            "Leerrohre für Hausanschlüsse (Strom, Wasser, Kanal, Telekom) lagerichtig eingelegt; Hauseinführungen dicht.",
            "Bewehrung vor dem Betonieren durch Tragwerksplaner bzw. Prüfingenieur abgenommen (Protokoll).",
            "Betonieren nur bei geeigneter Witterung bzw. mit Schutzmaßnahmen; Nachbehandlung (feucht halten) bei Hitze.",
            "Abdichtung erdberührter Bauteile lückenlos, Anschlüsse und Durchdringungen sauber ausgeführt, fotografiert.",
            "Schutzschicht und – falls geplant – Drainage vor dem Verfüllen kontrolliert (Drainage ersetzt keine Abdichtung)."],
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
            "Schutzabdeckungen bis zum Ende der Putzarbeiten; Rahmen-Schutzfolien laut Hersteller rechtzeitig entfernen."]},
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
            "Estrich nur bei mind. +5 °C (Luft und Untergrund) einbringen; danach laut Hersteller frostfrei halten, vor Zugluft und direkter Sonne schützen.",
            "Konsequent stoßlüften; Bautrockner nach Absprache.",
            "Bei Fußbodenheizung: Funktions- und Belegreifheizen nach Protokoll; Protokoll aufbewahren.",
            "Vor dem Belag: Belegreife durch CM-Messung des Bodenlegers bestätigen lassen."],
  "tip": "Zu frühes Verlegen auf feuchtem Estrich ist eine Hauptursache für gewölbte Parkettböden und lose Fliesen."},
 {"title": "Ausbau: Fliesen, Böden, Maler, Türen", "intro": "Optische Mängel sind jetzt leicht zu erkennen – prüfen Sie bei gutem Licht.",
  "items": ["Fliesen: Fugenbild, Höhenversatz, Gefälle in der Dusche zum Ablauf, Verbundabdichtung im Nassbereich (ÖNORM B 3407) vor dem Fliesen.",
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
 ("p", "Mit der Übernahme (Abnahme) nehmen Sie eine Leistung als erbracht entgegen. Ab der Übergabe läuft in der Regel die "
       "Gewährleistungsfrist; offensichtliche Mängel müssen Sie dabei rügen. Nehmen Sie sich Zeit und lassen Sie sich nicht drängen. "
       "Ausführlich dazu: Kapitel 12."),
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
            "Bei wesentlichen Mängeln kann die Übernahme verweigert werden (Voraussetzungen siehe Kapitel 12) – dann die Leistung nicht in Gebrauch nehmen."]),
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
    ("Abnahme / Übernahme", "Formelle Übernahme einer Bauleistung durch den Auftraggeber; meist Beginn der Gewährleistungsfrist."),
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
    ("Fundamenterder", "Erdungsanlage im Fundament nach OVE E 8014, vor dem Betonieren verlegt; bei gedämmter Bodenplatte als Ringerder im Erdreich."),
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
