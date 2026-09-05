<!--
  Die Quelle der PR-Beschreibung von #14.

  Sie steht hier und nicht nur auf GitHub, aus dem Grund, aus dem in diesem
  Vorhaben nichts zweimal steht: Die Beschreibung war am 01.09. an neun
  Stellen überholt — 616 Testfälle bei 1.059, 77 Seiten bei 81, 23 Gates bei
  24, „Domain und Hosting" als offener Punkt, obwohl bauversand.com entschieden
  ist. Sie ist das Erste, was der Auftraggeber liest.

  `npm run pruefe-schaufenster` misst die Kennzahlen dieser Datei gegen das
  Verzeichnis. Was der Prüfer nicht kennt, prüft er nicht — er sagt selbst,
  welche Sätze er festhält.
-->

Machbarkeitsanalyse, Shop und Website für einen Baustoffhandel, der 3.000 € netto monatlich abwerfen soll. Markt Österreich, Lieferung regional.

**Kein realisierter Umsatz und kein realisierter Gewinn.** Nichts ist gegründet, verkauft oder eingenommen. Alle Wirtschaftlichkeitszahlen sind Modellrechnung.

## Einstieg

👉 **`docs/baustoff-shop/STATUS.md`** — Stand, offene Weisungen, Dokumentenverzeichnis und eine Tabelle aller Korrekturen, die im Verlauf nötig waren. Diese Datei zuerst lesen. Bei Gate-Fragen gilt **`gate-register.md`** (26 Gates, Stand 4. September).

Diese Beschreibung hat seit dem 1. September eine Quelle im Verzeichnis: `docs/baustoff-shop/pr-beschreibung.md`. `npm run pruefe-schaufenster` misst ihre 34 Kennzahlen gegen den Bestand — sie war zuvor an neun Stellen überholt, und seit dem 1. September ist auch die Leitzahl darunter. Seit dem 4. September sind **Aussagen** darunter, nicht nur Zahlen: An dem Tag stimmten alle 32 Zahlen, und der Satz daneben behauptete das Gegenteil dessen, was der Shop kann.

### Veröffentlichte Momentaufnahmen

Drei früher veröffentlichte Seiten. **Es sind Momentaufnahmen, kein Stand:** Der
aktuelle Shop entsteht mit `npm run website` aus dem Verzeichnis.

- [Baustoffe zum Baumeisterpreis](https://claude.ai/code/artifact/fe6d720d-473d-4af5-a26b-6fcfbea929dc) — die Website, Stand August
- [Der Weg zum ersten Klick](https://claude.ai/code/artifact/44ba340b-a126-457c-96d5-64fc34efa3a4) — der Ablaufplan
- [Was 25 % Marge tragen](https://claude.ai/code/artifact/6e356abb-b5d3-44a9-9b8d-f98a13fb0502) — die Kalkulation. ⚠️ **Überholt und nicht mehr veröffentlichbar** (fünf abgewiesene Versuche, siehe `schaufenster-abgleich.md`); sie behauptet zu Gate 21 das Gegenteil des heutigen Stands. Gültig ist `docs/baustoff-shop/zuschlag-seite.html` im Verzeichnis.

## Wo das Vorhaben steht

Ursprünglich ein Streckenhandel für Radonvorsorge auf **unbelegten** Platzhalterpreisen. Der Auftraggeber hat die Grundlage gewechselt: **eigene Baumeister-Einkaufspreise aus den Lieferantenrechnungen, 25 % Marge, Google Shopping, regionale Lieferung.** Beide Modelle liegen nebeneinander im Bestand und sind nach Gate 12 gleichrangig.

| | Stand |
|---|---|
| Katalog | **46 echte Artikel** aus 15 Lieferantenbelegen, Preise bestätigt |
| Website | **81 Seiten** — 46 Artikel, 14 Wissensseiten, 4 Systemlisten, 7 Gruppen, 5 Rechtsseiten, 5 im Wurzelverzeichnis |
| Kampagne | 6 Suchkampagnen gerechnet, **3 im ersten Anlauf**, alle **pausiert** |
| Produktfeed | 43 Einträge — **nicht einreichbar**, GTIN fehlt bei allen 46 Artikeln |
| Testbestand | **über 1.000 Testfälle**, alle grün, dazu 11 Oberflächenszenarien und 53 Shopszenarien im Browser |
| Prüfwerkzeuge | **27 Prüfer** ohne Browser, 4 Browserproben zusätzlich |
| Messliste für Gate 15 | **32 Begriffe** in 3 Anzeigengruppen, Ort = Liefergebiet |
| Mindestbestellwert | **250 € netto Warenwert je Lieferung** (Gate 25), gerechnet aus Fracht, Palette und Zielmarge |
| Bestellweg | **gebaut und ausgeschaltet** (Gate 26) — Formular, Empfangsskript, Ablage, Posteingang; eingeschaltet mit E-Mail und Rechtstextewortlaut |

## Die Zahlen, die das Modell tragen

Zielgewinn 5.374 € vor Steuer, Fixkosten 650 €, Warenkorb 650 € netto,
**Zahlweg EPS** — der nach Gate 21 entschiedene:

| | 20 % Marge | **25 % Marge** | mit 3 % Skonto |
|---|---|---|---|
| nötiger Monatsumsatz | 67.826 € | **43.396 €** | **37.343 €** |
| Bestellungen im Monat | 105 | 67 | 58 |
| Tragfähigkeitsgrenze Werbeanteil | 18 % | 23 % | — |

**Berichtigt am 1. September.** Diese Zeile stand seit dem 25. August mit
72.740 / 45.356 / 38.786 € da — gerechnet mit **Kreditkarte**, zwei Tage bevor
Gate 21 EPS und Vorkasse entschied. Die Zahlen waren nie falsch, sie wurden es;
und weil sie in die vorsichtige Richtung falsch waren, hat sie niemand
nachgerechnet. Seit heute misst `npm run pruefe-schaufenster` auch sie.

**Der Engpass ist die Werbung, nicht der Einkauf.** Fünf Prozentpunkte Puffer machen den Klickpreis-Kanal überhaupt erst vertretbar.

**Und darunter hört der Kanal auf zu existieren:** Unter einer Kaufquote von **0,77 %** trägt das Modell nicht einmal den billigsten Marktklick (0,50 €). Gerechnet wird mit 2 % — Faktor 2,6 dazwischen, und gemessen ist keine der beiden Zahlen. Das ist das erste der drei größten Risiken (`die-drei-groessten-risiken.md`).

**Wie lange bis zur Entscheidung: 60 Tage.** `npm run rollout` rechnet die Kette aus 15 Etappen mit ihren Abhängigkeiten — Tag 0 ist nicht heute, sondern der Tag, an dem die erste Freigabe erfolgt. Davon sind 45 Tage der Klickversuch selbst, der Rest ist Warten auf Dritte und vier Tage eigene Arbeit. Die vierzehnte Etappe kam am 4. September dazu: **den Bestellweg bauen** — der Plan führte bis zur gemessenen Anfragequote und hätte den Shop danach genauso bestellunfähig zurückgelassen, wie er es an dem Tag war. Die fünfzehnte kam am selben Abend dazu: **Antwortzeit und Bankverbindung eintragen** — der Plan führte zehn Tage Legitimationsprüfung beim Zahlungsanbieter und keinen Schritt, mit dem der Shop am ersten Tag Geld annehmen kann, obwohl Gate 21 die Überweisung gleichrangig nennt. Seither hält `npm run rollout` den Plan gegen die Bereitschaftsliste: Jeder Punkt, der den Shop aufhält, hat eine Etappe oder einen Pflichtgrund, warum keine. Die Frist von 90 Tagen trägt das, aber nicht alles: Eine Quote von 1 % lässt sich bei jedem Marktklickpreis ausschließen, eine von 0,5 % nur am unteren Rand des Marktes.

**Der Shop hat seit dem 4. September einen Bestellweg** (Gate 26): Ein Formular der Kasse schickt die fertig gerechnete Bestellung an ein eigenes Empfangsskript auf dem Hosting des Auftraggebers, das sie ablegt und den Betreiber benachrichtigt. `npm run bestellprobe` fährt die Kette in einem Befehl — echter Bau, echtes PHP, echter Browser: Klick, Empfangsskript, Ablage, Posteingang, Angebot. Er ist **gebaut und ausgeschaltet**: Ohne `betreiber.email` hat das Skript keinen Empfänger, und die gemessene Datenschutzzusage „wird nicht an den Server übertragen“ stimmt heute noch — sie muss mit demselben Bau fallen, mit dem der Weg entsteht, denn Art. 13 DSGVO verlangt die Beschreibung **vor** der ersten Übertragung.

**Was der Versuch entscheidet, ist eine Absage.** Bis der Weg eingeschaltet ist, erzeugt der Shop Anfragen; gemessen wird deshalb die **Anfragequote**. Bleibt jede Anfrage aus, ist sie ausgeschlossen — und ohne Anfrage entsteht kein Auftrag, also die Kaufquote mit. Kommen Anfragen, sagt die Anzeigenstatistik über die Kaufquote nichts: Der Schritt von der Anfrage zum Auftrag entsteht im Postfach und steht seit dem 3. September als eigene Etappe im Plan.

## Befunde aus den echten Daten

**Der Einkaufsvorteil ist extrem ungleich verteilt.** 39 von 46 Artikeln liegen unter dem Listenpreis des Lieferanten, im Median 26,7 % darunter. Daraus **Gate 22**: Kleinteile gehören nicht als Suchartikel in den Shop, sondern als Beipack. Das dreht die Lehrbuchregel um, die vorher im Bestand stand.

**3 % Skonto sind mehr wert als die gesamte Zahlungsgebühr** — sie heben die Rohmarge von 25 auf 27,25 % und senken den nötigen Monatsumsatz um ein Siebtel. Daraus **Gate 21**: Maßgeblich ist nicht das Zahlungsziel auf der Kundenrechnung, sondern **wann das Geld im eigenen Konto liegt.**

**Der Weg ohne Gebühr ist nicht der günstigste.** Bei der Referenzbestellung (646 € Ware netto, 75,50 € Fracht, Einkauf 484,50 €):

| Zahlweg | Gebühr | Skonto | netto | Gate 21 |
|---|---|---|---|---|
| Vorkasse | 0,00 € | 14,54 € | **+14,54 €** | hält |
| **EPS** | 8,04 € | 14,54 € | **+6,50 €** | hält |
| Karte (Stripe) | 12,37 € | 14,54 € | +2,17 € | hält |
| offene Rechnung, 30 Tage | 0,00 € | **0,00 €** | 0,00 € | **reißt** |
| Rechnungskauf (Anbieter) | 25,97 € | 14,54 € | **−11,43 €** | hält |

Grund: Das Skonto rechnet auf den Einkauf netto (484,50 €), die Gebühr auf den Bruttobetrag samt Fracht und Umsatzsteuer (865,80 €). Gleicher Prozentsatz, 79 % größere Grundlage. **Entschieden:** EPS und Vorkasse ab Start, Karte als Zusatz, keine offene Rechnung, Kundenzahlungsziel null Tage.

**Gebote gehören auf die Bestellung gerechnet, nicht auf den Artikel.** Die großen Belege bestehen aus acht bis zwölf Positionen. Zulässiger Klickpreis: Kamin 8,22 €, Dämmung 5,91 €, WDVS 4,19 € gegen einen Markt von 0,50–2,50 €. Kanal 1,38 €, Mörtel 1,85 € und Mauerwerk 1,24 € tragen den Klick nicht verlässlich und sind **zurückgestellt**, bis eine gemessene Kaufquote vorliegt — das Budget zu streuen hieße, es gleichmäßig zu verlieren.

**Auf generische Suchbegriffe ist dieser Shop nicht konkurrenzfähig** und wird es nie sein — dort gewinnen Baumarkt-Eigenmarken. Konkurrenzfähig ist er auf Produktnamen und Fachanforderungen.

## Die Website

81 Seiten aus `npm run website`, zwei Ausgaben aus einer Quelle: `ausgabe/site/` zum Hochladen (robots.txt, llms.txt, sitemap.xml, JSON-LD je Seite) und `ausgabe/website.html` als Einzeldatei zum Ansehen ohne Server. Zieladresse ist **bauversand.com** bei All-Inkl; sie steht in `data/betreiber.json` und wird von dort in Seiten *und* Anzeigen eingesetzt.

Die Inhaltsseiten sind nach den eigenen Redaktionsprinzipien gebaut, die selbst eine Seite sind: **eine Frage je Seite, Antwort in den ersten zwei Sätzen, jede Zahl mit Herkunft.**

**Technische Kennwerte stehen bewusst nicht auf den Artikelseiten.** Sie gehören ins Herstellermerkblatt und ändern sich dort; verlinkt wird die Herstellerseite, kein erfundener PDF-Pfad.

Die fünf Rechtsseiten sind ein **Gerüst mit sichtbaren Lücken**, kein fertiger Rechtstext. Das Impressum trägt, was aus dem Firmenbuch belegbar ist; vier Pflichtangaben bleiben als farbige Marken offen, und die Seite sagt selbst, dass sie so nicht online gehen darf.

## Was das Bauen an sich selbst gefunden hat

Über zwanzig Verhaltensaudits, über vierzig behobene Widersprüche zwischen Erklärung und Verhalten — nahezu alle in die optimistische Richtung. Eine Auswahl:

| Ebene | Befund |
|---|---|
| Bündel | 155 grüne Testfälle, während `demo.html` gar nicht startete |
| Testfall | elf Schleifen, die grün liefen und nichts prüften |
| Zahlenbasis | Frachtschwelle, Brutto-UVP, Gebührenbasis, Verschnitt — alle vier nach oben verzerrt |
| Oberfläche | die Prüfsonde meldete Grün für nie gelaufene Szenarien |
| Inhaltsprüfung | die ÖNORM-Regel traf nie — `\b` kennt „Ö" nicht als Wortzeichen |
| Rechnungsauslese | ein stiller Nullfund: `/Type/Page` gegen `/Type /Page`, Ergebnis eine leere Datei ohne Fehler |
| Produktfeed | „46 veröffentlichbar, 0 zurückgehalten" — während bei allen 46 die GTIN fehlte |
| Liefergebiet | „regional" war an genau einer Stelle umgesetzt: als Zeichenkette in einer Anzeigenzeile. Der Rechenkern nahm jede österreichische Adresse an |
| Ortsangabe | vier Dokumente hielten **Ried im Innkreis** für den Heimatbezirk. Der Sitz liegt in **Ried in der Riedmark, Bezirk Perg** |
| Anzeigenziel | alle drei Anzeigen des ersten Anlaufs zeigten auf Seiten, die es nicht gibt — die Ziel-URL war der Google-**Anzeigepfad** |
| Landeseite | **3 von 81 Seiten** nannten das Liefergebiet, keine davon eine Landeseite der Anzeigen. Es stand in `llms.txt`, `areaServed` und der Kasse — überall dort, wo eine Maschine liest |
| Anzeigentext | sechs von sechs Anzeigengruppen warben mit **Paletten**; kein einziger Artikel wird palettenweise verkauft |
| Preisbasis | nie gemessen: ältester Einkaufspreis 132 Tage, Median 50 — ein alter Einstand ist die Marge von gestern, ausgewiesen als die von heute |
| Prüfer der Prüfer | meldete „8 Prüfer befragt", während neun liefen — ein vollständiges Ergebnis über eine unvollständige Liste |
| Kundenbeleg | die Rechnung nannte **1.638,48 € Gesamtbetrag** und schwieg darüber, ob das Geld noch zu zahlen ist — bei Zahlungsziel null Tage und Vorkasse auf allen Wegen. Kein Prüfer las je einen **fertigen** Beleg |
| Leitzahl | der nötige Monatsumsatz stand seit 25.08. mit **45.356 €** da: die **Kartenzahl**, zwei Tage älter als Gate 21, das EPS entschied. Mit dem entschiedenen Zahlweg sind es **43.396 €**. Zwölf Prüfer, und keiner sah die Zahl an, um die es geht |
| Kasse | Der Shop hatte gegenüber dem Kunden **keine Untergrenze**: Ein Warenkorb über 19,30 € wurde durchgerechnet, mit Preisen ausgewiesen und als fertige Anfrage zum Abschicken angeboten — abgelehnt worden wäre er erst bei der Auslösung. Eine Sperre, die erst nach dem Ja greift, ist keine. Gate 25 entschieden: **250 € netto Warenwert je Lieferung** |
| Testprüfer | `test/geheimnis.test.js` hat neun Testfälle, der Prüfer sah **acht**. Eine geschweifte Klammer in einer Zeichenkette ließ die Klammerzählung bis zum Dateiende laufen — der Fall wurde still übersprungen. Aufgefallen erst, als ein Gesamtlauf beide Zählungen nebeneinanderstellte |
| Bereitschaftsliste | `npm run startklar` führte **neun Punkte, und keiner war der Bestellweg selbst** — alle waren Zulieferungen des Auftraggebers. Mit vollständig beantworteter Betreiberdatei meldete es „startklar", und vier Oberflächen lesen das als **„Bestellen ist möglich"**, `llms.txt` schreibt den Satz Assistenten wörtlich hin. Abgeschickt wird im ganzen Shop nichts: kein `fetch`, kein Formular, kein Beacon. **Die Probe trug dieselbe Annahme** und hätte den Befund nie finden können |
| Kassenprobe | Drei von 53 Browserszenarien standen sechs Stunden rot, ohne dass ein Lauf es meldete: Gate 25 nimmt unter 250 € netto keine Anfrage mehr an, die drei legten 0,97 € in den Korb und prüfen den **Anfragetext**, nicht die Untergrenze. `npm run alles` holt die Browserproben nicht ab — es endete mit „20 von 20 grün" |
| Kundenbeleg im Betrieb | `erzeugeAngebot` gibt es seit dem 31. August, mit Bindefrist und § 11-Pflichtangaben — **aufgerufen hat sie außerhalb der Tests nur ihr eigener Prüfer**, mit einem erfundenen Warenkorb. Der erste echte Lauf (`npm run vorgang`) fand sofort zwei Fehler: Die Auftragsbestätigung des Betriebs trägt Lieferhinweise mit zwei weiteren AGB-Verweisen, die der Prüfer nie zu sehen bekam — und einer zeigte auf **Punkt 6** (Fracht) statt **Punkt 7** (Empfangsvollmacht) |
| Rolloutplan | Die längste Etappe — 45 Tage, das ganze Werbebudget — hieß „bis die **Kaufquote** entschieden ist", und der Shop konnte damals keine Bestellung entgegennehmen. Die Einschränkung stand seit dem 1.9. im Kopfkommentar eines Moduls und in einer Fußnote, nicht im Plan, den der Auftraggeber vor der Budgetfreigabe liest. Und die Etappenzahl stand als **Wort** in dieser Beschreibung — ein Wort findet `pruefe-schaufenster` nicht, also war sie außerhalb jeder Messung |
| Ungerufene Ausfuhren | An einem Tag zweimal dasselbe: `erzeugeAngebot` (seit 31.08. gebaut, geprüft, mit Bindefrist und § 11-Pflichtangaben) und `pruefeAnfrageAufGeheimnis` (die zweite Reihe gegen Einkaufszahlen im Kundentext) waren an nichts angeschlossen. Beide Male hat es ein Mensch beim Hinsehen gefunden. **Gemessen: 34 Ausfuhren rufen außerhalb der Tests niemand** — jede steht jetzt mit Pflichtgrund im Register, `npm run pruefe-ungerufen` hält es gegen die Wirklichkeit, in beide Richtungen. Beim ersten Lauf hat es zwei eigene Fehler im frisch geschriebenen Register gefunden |
| Bestellweg, beide Hälften | `bestellung.php` an laufendem PHP geprüft, der Schalter im Testlauf, das Bündel am Datenschutzprüfer — **zusammen ausgeführt hatte sie niemand**. Die 53 Browserszenarien laufen über `file://` mit ausgeschaltetem Weg; der Knopf war dort nie auf der Seite. `npm run bestellprobe` fährt seither die ganze Kette in einem Befehl: Klick, Empfangsskript, Ablage, Posteingang, Angebot |
| Bestellformular | Es sammelte **drei** Felder, `pruefeBestelldaten` verlangt **acht**. Die Kasse nahm Bestellungen entgegen, aus denen kein Angebot werden kann: ohne Anschrift keine Rechnung nach § 11 UStG, ohne UID und Bestätigung keine Nettorechnung nach Gate 7 |
| Bereitschaftsliste, zweites Mal | Vier Runden Bestellweg, und `npm run startklar` sagte mit **vollständig beantworteter** Betreiberdatei weiter „die Oberfläche schickt nichts ab“ — es las `shop-ui.js`, und das Absenden war in eine Datei daneben gezogen, damit kein schlafendes `fetch` die Datenschutzzusage aushöhlt. Beide Entscheidungen waren richtig; zusammen ergaben sie einen Prüfer, der das Falsche liest |
| Wegwerfverzeichnisse | Ein Gesamtlauf brach mit `ENOSPC` ab: **63.082 Einträge unter `/tmp`**. Zwölf Proben legen sich eines an, acht räumten es weg — eine Probe, die ihre Spuren behält, wird irgendwann selbst der Fehler |
| Geratene Ports | Drei rote Gesamtläufe an drei verschiedenen Stellen, einzeln alles grün: Zwei Proben starten je einen PHP-Server und **rieten** ihren Port. Ein geratener Port ist kein Port, sondern eine Wette |
| Kundenzahlung | Gate 21 hat **Vorkasse ab Start** entschieden, die Auftragsbestätigung sagt seither „Zahlbar sofort, ohne Zahlungsziel" — und sagte nie, **auf welches Konto**. Der Kommentar eine Zeile darüber beschreibt den Schaden bereits: *ohne den Satz wartet der Kunde auf Ware und der Shop auf Geld.* Der Satz war da, die Kontonummer nicht. `zahlungsvermerk` kennt die Bankverbindung sogar als Lücke — aber nur im Zweig für eine offene Rechnung mit Zahlungsziel, und den hat Gate 21 mit null Tagen unerreichbar gemacht. **Eine Prüfung, die nur im ungenutzten Fall greift, ist keine** |
| Plan gegen Bereitschaftsliste | `startklar()` bekam abends die **Bankverbindung** als Punkt, der Rolloutplan erfuhr nichts davon — er führte weiter zehn Tage Legitimationsprüfung beim Zahlungsanbieter und **keinen Schritt, mit dem der Shop am ersten Tag Geld annehmen kann**, obwohl Gate 21 die Überweisung gleichrangig nennt. Der Plan sagt selbst, ein Verkauf beende den Versuch früher als jede Schwelle, und enthielt keinen Schritt, der einen Verkauf zu Ende bringt. Zwei Punkte fehlten, nicht einer: auch die **Antwortzeit**, seit dem 2. September in der Liste. Nicht der neue Punkt fehlte, sondern die **Verbindung** zwischen beiden Listen |
| Sperren ohne grünen Fall | Sieben Funktionen entscheiden, ob ein Papier hinausgeht. `darfBestaetigtWerden` hat sechs Sperrgründe und hatte sechs Proben — **jede prüfte nur, dass ihr Grund kommt.** Sechs Zusicherungen der Form „dieser eine Grund fehlt" ergeben keine Aussage darüber, ob die Sperre je aufgeht: Sie könnte jeden Auftrag abweisen, und keine Probe merkte es. **`darfBeauftragtWerden` rief keine einzige Probe je auf**, obwohl sie den Brief an den Rechtstexteanbieter bewacht. `npm run pruefe-sperren` misst das seither, mit einer Liste aus den Quelldateien statt aus einem Register. Und der erste grüne Fall fand sofort einen zweiten Fehler: Der Brief druckt eine Telefonnummer, die Sperre verlangte sie nicht — er durfte „versandfähig" heißen und `[[ Telefonnummer — FEHLT ]]` tragen |
| Kranentladung für 285 Gramm | Auf der Artikelseite standen „Gewicht **0,285 kg** je Stück, aus dem Lieferschein" und „Palettierte Ware. Sie wird mit dem **Kran** entladen" übereinander — seit es die Seite gibt. Die Einstufung stammt aus der **Warengruppe**; **keine der 46 ist belegt**, und sie entscheidet 7,50 € je Position auf der Kundenrechnung. In allen vier Fällen, in denen ein belegtes Gewicht dagegenhält, hält es dagegen. Die naheliegende Ausrede („so etwas wird palettenweise bestellt") stand schon in der Datei, bevor ich sie prüfte — die Lieferantenpositionen zeigen zwei bis drei Stück. **Umgestuft wird nichts** (ob ein Hub verrechnet wird, sagt der Lieferant); geändert wird, was der Kunde erfährt: Die Seite nennt seither Herkunft, Gewicht und Betrag der Schätzung |
| Diese Beschreibung | an neun Stellen überholt: 616 Testfälle statt über 1.000, 77 Seiten statt 81, 23 Gates statt 24. Am 4. September ein zweites Mal: Alle 32 Zahlen stimmten, und der Satz daneben sagte, der Shop könne keine Bestellung entgegennehmen |

Der gemeinsame Nenner: **eine Angabe, die berechnet und dann verschwiegen wird.** Immer meldet sich etwas *nicht*, und immer sieht das Ergebnis besser aus als es ist.

## Was fehlt — und was der Auftraggeber entscheiden muss

- **Das Repository ist öffentlich, und das wiegt schwerer als bisher notiert.** `.gitignore` hält die Einkaufskonditionen draußen, aber aus den veröffentlichten Verkaufspreisen und der überall dokumentierten Zielmarge sind **44 von 46 Einkaufspreisen** auf den Cent rekonstruierbar (`npm run pruefe-geheimnis`). **Empfehlung: privat stellen.**
- **GTIN je Artikel** — bei allen 46 offen. Ohne sie läuft Google Shopping nicht. Eine erfundene GTIN führt nicht zur Ablehnung des Artikels, sondern zur Sperre des Kontos. Die Beschaffung ist eine Anfrage an Dritte und damit freigabepflichtig.
- **Vier Impressumsangaben** — E-Mail, Telefon, UID, Gewerbewortlaut. Die E-Mail-Adresse ist zugleich eine der beiden Voraussetzungen des Bestellwegs: Ohne sie hat das Empfangsskript keinen Empfänger, und `npm run website` liefert es gar nicht erst mit.
- **Kontoinhaber und IBAN** — zwei Zeilen in `data/betreiber.json`, und die **einzige offene Zulieferung, die nichts kostet.** Gate 21 lässt ab Start per Vorkasse zahlen; die Auftragsbestätigung sagt seither „Zahlbar sofort" und sagte bis zum 4. September nicht, wohin. Heute steht dort `[[ Kontoinhaber und IBAN — FEHLT ]]`. Vorkasse braucht keinen Zahlungsanbieter, sondern ein Konto — ohne Gebühr und ohne Vertrag.
- **Rechtstexte und Zahlungsanbieter** — Ausgaben, also freigabepflichtig. Welche Wege der Anbieter können muss, steht fest: EPS, Vorkasse, Karte.
- **5 Fragen an den Lieferanten**, alle freigabepflichtig, weil sie eine Anfrage an Dritte sind — sie stehen als fertiger Brief in `npm run pruefe-anfrage` und schließen zusammen alle neun offenen Punkte dieser Gruppe: die **Lieferzeit in Werktagen**, sein **Liefergebiet** (aus fünfzehn Rechnungen nicht ableitbar, weil die Frachtpauschale nicht nach Entfernung staffelt), sein **Preisrhythmus** (er entscheidet, ob die 90-Tage-Grenze der Preisalterprüfung die richtige ist), die **Palettenzahl je Lieferung** (auf ihr ruht der Mindestbestellwert aus Gate 25 — und eine Stufe davor: welche Artikel überhaupt palettiert kommen, was wir heute aus der Warengruppe schätzen) und eine **Artikelliste mit EAN-Spalte** aus dem Kundenkonto, die zugleich die GTIN-Frage und die Weisung löst, das Sortiment auf mindestens 100 Artikel zu erweitern.
- **Datenblätter der Hersteller.** Sieben Inhaltsseiten verweisen darauf, keine verlinkt eines: `baumit.at`, `schiedel.at`, `synthesa.at`, `isover.at` und `ris.bka.gv.at` sind aus der Arbeitsumgebung gesperrt.

Erledigt seit der letzten Fassung dieser Beschreibung: Domain und Hosting (bauversand.com bei All-Inkl), Liefergebiet als Bezirksliste (Gate 23), Kundenzahlungsziel (Gate 21) — und seit dem 4. September der **Bestellweg** (Gate 26), gebaut und von Ende zu Ende gefahren.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NUkcuRkCJDZFDntY4wU3xy
