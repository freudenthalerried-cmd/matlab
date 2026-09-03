# Status und Einstieg

Stand: 2026-08-30. **Dieses Dokument zuerst lesen.** 155 Arbeitsdateien
sind entstanden, mehrere davon korrigieren einander. Hier steht, was gilt.

> **Vorsicht bei diesem Dokument selbst.** Am 29. August stand weiter unten
> noch „Die Modellwahl ist vertagt" mit einer Tabelle, die Radon-Shop und
> Leadvermittlung gegeneinanderstellt — eine Woche nach dem Kurswechsel vom
> 22. August, der beide Modelle abgelöst hat. Ein späterer Lauf hätte an der
> falschen Weggabelung gestanden. Genau dieselbe Sorte Fehler wie in
> `PARAMETER.md` am 28. August. Der Abschnitt trägt jetzt eine Kopfnotiz;
> **wer hier liest, prüft zuerst das Datum über dem Absatz.**

Veröffentlichter Bericht:
[claude.ai/code/artifact/3d669d15…](https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c)

Auf Stand 17. August 2026 gebracht: alle neunzehn Gates, fünf Befunde
(Straßenpreisanker, Händlerplatz, Pflichtgebiet, Bestand, Lagerhaus als
dreizehnter Adressat), dreizehn versandfertige Anfragen. Quelldatei im Repo unter `bericht-radon.html`; bei
Widerspruch gilt weiterhin [`gate-register.md`](./gate-register.md).

Lauffähiges Shop-Funktionsmuster:
[claude.ai/code/artifact/c40fd35f…](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8) —
Quelltext und 482 Testfälle unter `shop/`, auf Hohlheit geprüft. Alle Preise sind Platzhalter.
Baustand in [`umsetzung-shop.md`](./umsetzung-shop.md).

> **Kurswechsel vom 22. August — das Modell hat sich geändert.**
> Der Auftraggeber gibt seine eigenen Baumeister-Einkaufspreise aus den
> Bürozubau-Rechnungen (Peither) als Kalkulationsgrundlage vor, Zuschlag
> 25 %, Vertrieb über Google Shopping, Lieferung regional statt
> österreichweit. Das berührt Gate 1 (25 % Zuschlag = 20 % Rohmarge —
> **diese Lesart ist seit 25.08. überholt, siehe Nachtrag unten**,
> unter der Untergrenze von 32 %), Gate 5 (Sortiment nicht mehr
> radonspezifisch) und den Werbeanteil. Wortlaut, Folgenanalyse, offene
> Fragen und Ablaufplan in [`auftrag-baumeisterpreise.md`](./auftrag-baumeisterpreise.md).
> Die Rechnung dazu ist gemacht: [`rechnung-zum-zuschlag.md`](./rechnung-zum-zuschlag.md)
> — und **Gate 1 ist durch Gate 20 abgelöst** (keine Bestellung ohne
> positiven Deckungsbeitrag, ausführbar im Rechenkern).
>
> **Nachtrag 25. August — zwei Klärungen, beide erheblich:**
> „25 %" heißt **Marge**, nicht Zuschlag. Der nötige Monatsumsatz fällt
> damit von 72.740 € auf **45.356 €**, die Bestellungen von 112 auf 70,
> und die Tragfähigkeitsgrenze des Werbeanteils steigt von 18 % auf
> **23 %** — erst damit ist der Klickpreis-Kanal vertretbar. Vollständig
> in [`marge-25-prozent.md`](./marge-25-prozent.md).
> *(Beide Umsatzzahlen bei Kartenzahlung; nach der Entscheidung für EPS
> am 27.08. sind es 67.826 € / 105 und 43.396 € / 67 —
> [`die-leitzahl-war-vom-falschen-zahlweg.md`](./die-leitzahl-war-vom-falschen-zahlweg.md).)*
> Zweitens: **Die Firma existiert bereits** — Freudenthaler Bau GmbH,
> FN 347938z, Baustoffhandel als Gewerbe eingetragen, Domain
> `freudenthaler-bau.at` in Betrieb. Die Domainempfehlung hat sich
> dadurch geändert ([`domainwahl.md`](./domainwahl.md)).
>
> Zwei weitere Weisungen vom selben Tag: Der Shop soll für **KI-Suchen**
> optimiert werden ([`ki-sichtbarkeit-konzept.md`](./ki-sichtbarkeit-konzept.md),
> erste Bauteile in [`maschinenlesbare-ausgabe.md`](./maschinenlesbare-ausgabe.md)),
> und er soll **umfangreiche geprüfte Inhalte** tragen
> ([`inhalte-und-pruefteam.md`](./inhalte-und-pruefteam.md) — fremde
> YouTube-Transkripte sind dabei nicht zulässig, die Prüfkette läuft als
> `npm run pruefe-inhalte`).
>
> **Nachtrag 26. August:** Die Inhaltsprüfung hatte einen blinden Fleck —
> alle Regeln hingen an einer Zahl, einer Normnummer oder einem Grenzwort.
> Sätze wie „als System geprüft und zugelassen" kamen durch, obwohl sie die
> tragende Verkaufsaussage der Systemlisten sind. Achte Regel, zwei
> nebenbei gefundene Fehler (falsche Zeilennummern, ungeprüfter Kopfblock)
> und die daraus entstandene Beschaffungsliste für Datenblätter in
> [`geltungsaussagen.md`](./geltungsaussagen.md).
>
> **Gate 21 ist entschieden** (26.08., abends): EPS und Vorkasse ab Start,
> Karte als Zusatz, **keine offene Rechnung**, Kundenzahlungsziel null Tage.
> Dabei berichtigt: Der Rechnungskauf **über einen Anbieter** hält das Gate
> (er zahlt sofort aus), was es verletzt, ist die **offene Rechnung auf
> eigenes Risiko** — beide standen bis dahin in einer Zeile. Rechnung,
> Kippzahlen und Begründung in
> [`zahlungsziel-entschieden.md`](./zahlungsziel-entschieden.md).
>
> **Gate 23 — das Liefergebiet** (26.08., abends): Die Weisung „regional
> statt österreichweit" war an genau einer Stelle umgesetzt — als Text in
> einer Anzeigenzeile der Kampagne. Der Rechenkern nahm jede österreichische
> Adresse an, AGB Punkt 12 erlaubte ganz Österreich, und der Feed las sein
> Gebiet aus einer Umgebungsvariablen. Jetzt eine Quelle: Perg,
> Urfahr-Umgebung, Freistadt, Linz-Land, Linz — der Bezirk wird gefragt,
> nicht aus der Postleitzahl erraten.
> [`liefergebiet-entschieden.md`](./liefergebiet-entschieden.md).
>
> **Berichtigung vom 26. August, abends:** Vier Dokumente behaupteten, der
> Heimatbezirk des Auftraggebers sei **Ried im Innkreis** und damit von der
> Radon-Vorsorgepflicht ausgenommen. Der Sitz liegt in **Ried in der
> Riedmark, Bezirk Perg** — ein anderer Bezirk, rund 150 km entfernt, und
> Perg steht nicht auf der Ausnahmeliste. Der Heimatbezirk ist
> Vorsorgegebiet; die Folgerung für die regionale Ansprache dreht sich um.
> Aufgedeckt durch eine Oberflächenprobe, die etwas ganz anderes prüfen
> sollte — [`zwei-ried.md`](./zwei-ried.md).
>
> **Das Repository ist öffentlich, und das wiegt schwerer als gedacht**
> (26.08.): `.gitignore` hält die Einkaufskonditionen draußen — aber aus
> den veröffentlichten Verkaufspreisen und der überall dokumentierten
> Zielmarge von 25 % sind **44 von 46 Einkaufspreisen auf den Cent
> rekonstruierbar**. Die Sperre lautete nie „keine Einkaufspreise im
> Verzeichnis", sondern „keine Verkaufspreise, solange die Marge dort
> steht". `npm run pruefe-geheimnis` misst es;
> [`rekonstruierbare-einkaufspreise.md`](./rekonstruierbare-einkaufspreise.md)
> wiegt die drei Möglichkeiten ab. **Empfehlung: Repository privat
> stellen — das ist eine Einstellung am Konto des Auftraggebers.**
>
> **Die Normen lagen im eigenen Ablagefach** (26.08., nachts): Die
> Beschaffungsliste vom Vormittag nannte drei äußere Wege, an die fehlenden
> Fundstellen zu kommen. Der vierte war, im Drive des Auftraggebers
> nachzusehen — dort liegen ÖNORM B 6400 (WDVS), B 3346, B 2501 und
> weitere. WDVS-Systemtreue und Dübeluntergrenze sind damit wieder belegt;
> die Herstellerunterlagen fehlen weiterhin.
> [`normen-im-eigenen-bestand.md`](./normen-im-eigenen-bestand.md).
>
> **Nachtrag 27. August:** Beide vorliegenden Fundstellen eingearbeitet.
> ÖNORM B 2501:2009 gibt der Kanalseite die Regeln, die sie bisher an die
> Planung weiterreichte — Bögen bis 45°, Doppelabzweiger unzulässig,
> Mindestgefälle 2 % bei DN 100. **ÖNORM B 2110 dagegen passt nicht:** Sie
> ist eine Werkvertragsnorm für Bauleistungen, der Shop verkauft Waren. AGB
> Punkt 10 bleibt bewusst ohne Fundstelle.
> [`norm-b2501-und-die-falsche-norm.md`](./norm-b2501-und-die-falsche-norm.md).
>
> **Die Bezugsquelle der Zahlen war nicht gesichert** (27.08.): Der ganze
> Katalog hängt an `preise/baustoff-preise.json`, die nur örtlich existiert.
> Werkzeug und Verfahren lagen im Verzeichnis, **welche fünfzehn Nachrichten**
> nirgends. Der Suchausdruck steht jetzt in `werkzeuge/README.md` und liefert
> nachgeprüft genau fünfzehn Treffer. **Nebenbei gefunden: ein
> Konditionenblatt des Lagerhaus Eferding von 2025** — die erste
> Original-Rabattstaffel des Vorhabens und ein möglicher zweiter Bezugsweg.
> [`herkunft-der-rechnungen.md`](./herkunft-der-rechnungen.md).
>
> **Das Konditionenblatt ist ausgelesen** (27.08.): Lagerhaus Eferding hat
> **Filialen in Münzbach und Perg**, also im Liefergebiet, und ein
> **gestaffeltes Frachtmodell** — Kleintransporter 41,66 € gegen Poschachers
> 75,50 € Pauschale je Lieferung. Damit halbiert sich die Frachtschwelle von
> 332 auf 167 € Warenwert. Das Sortiment deckt alle sechs Warengruppen des
> Katalogs. Die Rabattsätze selbst liegen als Bilder vor und sind ohne
> Renderer nicht auszulesen.
> [`zweiter-bezugsweg-lagerhaus.md`](./zweiter-bezugsweg-lagerhaus.md).
>
> **Die Rabattstaffel ist gelesen** (27.08.): Kanal 25–80 %, Mörtel/Putz
> 15–45 % — die vorab gestellte Bedingung („zwei von sechs Gruppen reichen
> heran") ist erfüllt. **Aber Dämmung und Fertigteile stehen auf
> „ANFRAGE"**, und das sind die Gruppen mit den höchsten Kampagnengeboten.
> **Zweimal berichtigt, zehn Seiten gelesen.** Es gibt kein einfaches
> Prinzip: Weder „Regal gegen Baustelle" noch „Rohstoff" hält, seit die
> Ziegelseite zeigt, dass N+F-Ziegel 60 % haben und **Planziegel auf
> Anfrage stehen** — derselbe Ton, nur geschliffen. Was bleibt, ist eine
> Liste. **Alle sechs Warengruppen sind ganz oder teilweise kalkulierbar**,
> Kamin (30–35 %) vollständig; auf Anfrage stehen Polystyrol,
> Betonfertigteile, Planziegel, Edelstahlkamine und Öfen. Der
> Referenzwarenkorb „eine Palette Planziegel" ist damit ausgerechnet nicht
> kalkulierbar.
> [`lagerhaus-rabatte-gelesen.md`](./lagerhaus-rabatte-gelesen.md).
>
> **Widerrufe sind jetzt maschinell geprüft** (27.08.): Dreimal in vier Tagen
> hat eine zurückgenommene Aussage in einem Nachbardokument überlebt. `npm run
> pruefe-widerrufe` führt ein Register der fünf bekannten Widerrufe und meldet
> jede Fundstelle, neben der **kein eigener** Widerruf steht — ein beliebiges
> Berichtigungswort in der Nähe genügt ausdrücklich nicht. Drei echte Funde:
> der **vierte** Innkreis-Überlebende in `umsetzung-shop.md`, eine
> **beantwortete Frage, die offen aussah** (die 25-%-Zweideutigkeit in
> `auftrag-baumeisterpreise.md`, Unterschied 27.384 € Monatsumsatz), und eine
> Zahl in diesem Dokument, deren Berichtigung neun Zeilen entfernt stand.
> Alle drei berichtigt; 32 Fundstellen, keine Meldung.
> [`widerrufe-maschinell.md`](./widerrufe-maschinell.md).
>
> **Die AGB-Seite hat die eigene Kalkulation ausgestellt** (27.08.): Auf eine
> Frage des Auftraggebers hin nachgesehen — auf `rechtliches/agb.html`, einer
> **Kundenseite**, standen Rohmarge (25 → 27,25 %), das Skonto beider
> Lieferanten, die Mehrkosten je Zahlweg, die Ausfallquote und interne
> Gate-Nummern. Ursache: `ZAHLUNGSBEDINGUNGEN` kannte nur die
> *Entscheidungs*begründung, und die Seite hat sie gerendert. Neuer Riegel
> `src/interna.js`, im Bauwerkzeug — **eine Seite mit einem Treffer wird
> nicht geschrieben**. Erster Lauf: 14 Treffer auf vier Seiten. AGB neu
> geschrieben, Zahlwege mit getrenntem Kundensatz. **Offen und dem
> Auftraggeber vorgelegt:** ob die Handelsspanne von 25 % öffentlich genannt
> bleibt — sie steht auf drei Seiten als Verkaufsargument.
> [`interna-auf-der-kundenseite.md`](./interna-auf-der-kundenseite.md).
>
> **Der Shop ist auf die Ware gedreht** (27.08.): Vier Rückmeldungen des
> Auftraggebers. **41 tote Verweise** — jeder Verweis aus einem Seitenkörper
> ging in der Mehrseitenfassung ins Leere, während der Bau „kein toter Link"
> meldete: Die Prüfung las den Quelltext statt der ausgegebenen Adresse.
> Behoben plus zweite Prüfung an der Adresse. **Bilder**: `src/bilder.js`
> zeichnet 14 Bauformen aus den Artikeldaten — Maße werden gezeichnet, nicht
> nur beschriftet; ein Herstellerfoto wäre ein fremdes Werk. **Struktur**:
> Kopfleiste nur noch Sortiment, alle 46 Artikel auf der Startseite, Wissen
> auf eine Zeile. **„Viel mehr" hat eine Grenze**: 15 Rechnungen, 70
> Positionen, 53 Artikelnummern, davon 7 Nebenkosten — die 46 sind alles,
> was belegbar ist. Der Hebel wäre eine Artikelpreisliste von Poschacher und
> damit eine E-Mail, also freigabepflichtig.
> [`shop-auf-die-ware-gedreht.md`](./shop-auf-die-ware-gedreht.md).
>
> **Dritter Lieferant ausgelesen, für den Katalog ergebnislos** (27.08.):
> Die Schachermayer-Rechnung 9116667544 enthält **eine** Position —
> Aluminium-Flachstangen für den Bürozubau, kein Baustoff. Der Katalog
> bleibt bei 46. Drei Nebenbefunde wiegen mehr: **2 % Skonto bei 14 Tagen**
> (die 3 % sind eine Eigenschaft der beiden Baustofflieferanten, keine
> Branchenkonstante — Gate 21 gilt unverändert, seine Begründung ist
> präzisiert), **17,90 € Fracht** als dritter Beleg dafür, dass Fracht eine
> Eigenschaft der Ware ist, und die Rechnungsanschrift **4312 Ried in der
> Riedmark** als unabhängige Bestätigung des Perg-Befunds. Die Auslesekette
> ist zu zwei Dritteln allgemein: `entpacken.py` und `pdftext.py` lesen das
> fremde Layout, `positionen.py` nicht. Stiller Nullfund in `entpacken.py`
> behoben.
> [`dritter-lieferant-schachermayer.md`](./dritter-lieferant-schachermayer.md).
>
> **Gate 24 ist entschieden, und das Inhaltsverzeichnis war die ganze Zeit
> lesbar** (27.08.): Seite 2 des Lagerhaus-Blatts ist Text, kein Bild — sie
> nennt für die sieben Warengruppen des Shops **21 von 72 Seiten**. „62
> ungelesene Seiten" war nie die richtige Beschreibung. Drei davon gelesen:
> **Kanalrohre 82 % durchgehend** (Pipelife/Ostendorf, EN 1401-1; Poschacher
> liegt bei 81–84 %), **Schachtringe 53 %** samt Mindermengenzuschlag nach
> Tonnage und der ausdrücklichen Zeile „Preise laut Werkspreisliste",
> **Quarzolith Sackware 20 % / dieselbe Ware lose ANFRAGE**. Der dritte
> Anlauf auf ein Prinzip („abgepackt gegen lose") wäre naheliegend gewesen
> und ist **nicht aufgeschrieben worden**: Schachtringe sind lose und
> gestaffelt, Planziegel abgepackt und Anfrage. Damit ist **Gate 24**
> entschieden — kein Artikel, dessen Einkaufspreis nur auf Anfrage zu haben
> ist —, weil die Anfrage-Zeilen mitten in der Warengruppe stehen, beim
> selben Produkt im anderen Gebinde.
> [`lagerhaus-drei-seiten-mehr.md`](./lagerhaus-drei-seiten-mehr.md).
>
> **Gate 24 ist ausführbar — bevor es einen Fall gibt** (27.08.): Der
> Entscheidungstext sagte „umzusetzen ist vorerst nichts". Das ist die
> häufigste Art, wie eine Regel verschwindet; Gate 23 hat fünf Tage lang
> gezeigt, was mit einer beschlossenen und nicht gebauten Regel geschieht.
> `ekQuelle: 'anfrage'` sperrt jetzt im Rechenkern — **vor** dem Blick in die
> Preisdatei, sonst machte eine dort notierte Zahl den Artikel doch
> verkäuflich —, `katalogbefund()` weist `verkaeuflich` und `nurAnfrageSkus`
> aus, und `npm run website` lässt die Artikel weg **und nennt sie**. Still
> verschwinden darf nichts. Gegenprobe mit Katalogkopie in beide Richtungen.
> [`gate24-ausfuehrbar.md`](./gate24-ausfuehrbar.md).
>
> **Aus dem Schaufenster wird ein Laden** (27.08.): Weisung „baue einen
> richtig hochwertigen Shop wie Amazon". Gebaut sind die vier Dinge, die ein
> Kunde tut — **Suche** (mit Vorschlägen, Kompositum-Treffer ab vier Zeichen,
> Umlautfaltung), **Filter und Sortierung**, **Warenkorb** mit Zähler und
> Mengen, **Kasse** mit Gate 23 und ehrlichem Ende. Drei neue Seiten, neuer
> `src/shopkern.js`, neue `npm run shopprobe` mit 13 Headless-Szenarien.
> Der Warenkorb sagt selbst, wenn die Fracht die Ware übersteigt (im
> Probekorb: 6,39 € Ware, 83,00 € Fracht). Der Interna-Riegel hat den
> Lieferantennamen in den Nutzdaten gemeldet — entfernt, weil die Oberfläche
> ihn nicht braucht. **Die Probe hat einen echten Fehler gefunden:** Die
> Einzeldatei hatte **keine Zeichensatzangabe**, alle Umlaute standen auf der
> Ratewilligkeit des Browsers. 677 Testfälle grün.
> [`shop-mit-warenkorb.md`](./shop-mit-warenkorb.md).
>
> **Paketdienste für kleine Einheiten geprüft** (27.08.): Post
> Geschäftskunden 6,32 € bis 20,78 € (bis 31,5 kg), GLS bis 40 kg, DPD bis
> 31,5 kg. Ein 25-kg-Sack ginge für rund 21 € statt 75,50 € Frachtpauschale —
> die Schwelle, ab der eine Bestellung trägt, fiele von 332 auf rund 95 €.
> **Drei Vorbehalte**: Die Zahlen stammen aus Suchauszügen (post.at und
> wko.at sind gesperrt) und sind damit Hinweis, keine Fundstelle; der Katalog
> **kennt kein Gewicht** und `sperrgut` ist bei allen 46 Artikeln geschätzt;
> und im Streckengeschäft hat niemand das Paket in der Hand — es braucht eine
> Vereinbarung mit dem Lieferanten oder Abholung (Lagerhaus Münzbach/Perg).
> [`paketversand-kleine-einheiten.md`](./paketversand-kleine-einheiten.md).
>
> **Fracht steht auf drei von fünfzehn Belegen — und 118,50 € fehlen im
> Modell** (27.08.): Beim erneuten Durchsehen der Rechnungen drei Funde.
> **(1)** Das Gewicht steht auf jeder Rechnung („Positionsgewicht",
> „Gesamtgewicht") — genau das Feld, das gestern als „existiert nicht"
> notiert wurde. Übernommen ist es **nicht**: Die Summenprobe schlägt bei elf
> von vierzehn Belegen fehl, weil Verpackungseinheiten und Palettengewichte
> anders zählen. **(2)** Die Zeile `Versandart:` zeigt: elf Belege lauten
> „Abholung Kunde", nur drei tragen Fracht. Die Aussage „die Frachtpauschale
> steht auf jedem Beleg" ist **widerrufen** und im Register; die
> Frei-Haus-Aussage gilt weiter, stützt sich aber auf zwei Belege statt
> fünfzehn. **(3)** Der große Beleg trägt **132 € Paletten, −20 € Rückgabe
> und 6,50 € Folierung** — 118,50 €, die der Rechenkern nicht rechnet, mehr
> als die Frachtpauschale selbst. Gate 20 bleibt gültig, rechnet aber
> nachweislich zu optimistisch; die Stückpreise stehen jetzt in
> `lieferanten.json`.
> [`fracht-nur-bei-zustellung.md`](./fracht-nur-bei-zustellung.md).
>
> **Sieben Gewichte mit bestandener Summenprobe** (27.08.):
> `werkzeuge/gewichte.py` liest die Positionsgewichte und **verwendet nur
> Belege ohne Rest** — vier von vierzehn. Ergebnis: 7 Artikel mit Gewicht,
> **null Widersprüche** zwischen Belegen. Der Befund darin ist größer als die
> Zahl: **Die ganze Kanalgruppe ist leicht** (Rohr 1,73 kg/m, Bogen 0,285 kg)
> — eine typische Kanalbestellung wiegt rund 40 kg und passt in zwei Pakete.
> Und Kanal ist die Gruppe mit dem größten Preisvorteil (81–84 % unter
> Liste). Im Shop stehen Gewicht je Artikel und Gesamtgewicht im Warenkorb,
> **samt Zahl der Positionen ohne belegtes Gewicht**. Zehn Belege tragen
> einen ungeklärten Rest; zwei davon entsprechen genau dem Gewicht der ersten
> Position — als Beobachtung notiert, **nicht** als Regel.
> **Nachgeschärft:** Ein vierter Beleg galt zunächst als sauber und ging nur
> deshalb auf, weil eine Position **gar keine Gewichtszeile** trägt — die
> Prüfung verlangt jetzt beides, keinen Rest und keine ungewogene Position.
> Damit sind **sechs der zehn Reste erklärt**: Auf den großen Belegen fehlen
> die Gewichtszeilen genau bei den Leistungen (Fracht, Kranentladung,
> Folierung), und Leistungen wiegen nichts. Übrig bleiben **zwei** ungeklärte
> Reste. Die naheliegende Erklärung dafür wurde **geprüft und widerlegt**,
> bevor sie aufgeschrieben wurde. Drei weitere Gewichte ergeben sich aus der
> Differenz und liegen als **Kandidaten** bereit, nicht im Katalog.
> [`gewichte-mit-summenprobe.md`](./gewichte-mit-summenprobe.md).
>
> **82 Pixel seitwärts, und drei Messfehler auf dem Weg dorthin** (27.08.):
> Die AGB-Seite scrollte am Telefon seitwärts — Ursache war ein Wort,
> „Geschäftsbedingungen", als Überschrift 437 px breit in einem 335-px-Kasten.
> Behoben. Lehrreicher war der Weg: **das Bildschirmfoto log** (Headless
> erzwingt 500 px Fensterbreite und schneidet ab), **`scrollWidth` allein
> log** (es zählt auch Tabellen, die in ihrem eigenen Scrollkasten richtig
> liegen), und **der erste Prüfer konnte nicht durchfallen** — er maß eine
> leere Seite und meldete grün. `npm run shopprobe` misst jetzt in einem
> echten 390-px-iframe, prüft mit `scrollTo(9999,0)` und verlangt die
> Überschrift als Beweis, dass überhaupt etwas gemessen wurde. 19 Szenarien.
> [`shop-am-telefon.md`](./shop-am-telefon.md).
>
> **Daumen und Tastatur** (27.08.): Was `scrollX` nicht misst, jetzt gemessen.
> **Die Bedienelemente waren zu klein** — Navigationsknöpfe 31 px,
> Warenkorb 38, Suchfeld 42; WCAG verlangt 24, Apple empfiehlt 44. Alle jetzt
> ≥ 44 px, Fließtextverweise ausdrücklich ausgenommen. **Die Vorschlagsliste
> war nur mit der Maus bedienbar** — jetzt Pfeiltasten, Eingabe, Esc,
> umlaufend, mit `role="listbox"` und `aria-activedescendant` (ohne die liest
> ein Vorleseprogramm die Vorschläge gar nicht vor). Die Probe fand dabei
> einen Versatz um eins: Aus „nichts gewählt" landete Pfeil auf auf der
> vorletzten statt der letzten Zeile. 22 Szenarien.
> [`bedienbar-mit-daumen-und-tastatur.md`](./bedienbar-mit-daumen-und-tastatur.md).
>
> **Der Rahmen misst ohne JavaScript** (27.08.) — **widerrufen am 28.08.,
> siehe [`rahmen-lief-doch.md`](./rahmen-lief-doch.md).** Beim Versuch,
> Warenkorb und Kasse im 390-px-Rahmen zu messen, hieß es: **Ein
> eingebettetes Dokument führt hier seine Skripte nicht aus** — beide
> `<script>`-Elemente vorhanden, `window.__SHOP__` undefiniert. Die
> Beobachtung stimmte, die Ursache war falsch zugeordnet: Angehalten hat der
> Parser am Stylesheet von `fonts.googleapis.com`, das hinter dem
> Ausgangsproxy **hängt** statt zu scheitern. Ohne Proxyvariablen führt
> derselbe Rahmen seine Skripte aus. Nebengewinn bleibt: Die Seiten halten
> ihr Layout auch ohne Skript.
> **Zwei neue Szenarien waren hohl** — eine leere Seite hat null zu kleine
> Bedienelemente, und die eingebaute Absicherung dagegen zählte auch die
> Kopfleiste mit. Beide entfernt — **aus einem Grund, der sich am 28.08. als
> falsch herausstellte**; sie sind wieder da und messen jetzt tatsächlich
> (28 Szenarien, davon 8 im Rahmen). Rahmenproben laufen über HTTP statt
> `file://`, und Chromium startet ohne Weg nach außen.
> [`rahmen-ohne-javascript.md`](./rahmen-ohne-javascript.md).
>
> **Der Inhaltsprüfer zeigte auf die Probedatei** (27.08.): `npm run
> pruefe-inhalte` meldete „1 Dateien, 15 Absätze" — das war der
> Selbstnachweis an einer Datei mit absichtlich falschen Absätzen, nicht der
> Bestand. Voreinstellung jetzt auf alle drei Inhaltsordner (**23 Seiten, 334
> Absätze, 0 Verdacht**), der Selbstnachweis heißt `--probe`. Dabei fiel auf:
> **Die Hälfte des Shoptextes stand nie unter den Regeln** — Startseite,
> Rechtstexte, Artikelseiten, Warenkorb kommen aus dem Seitenbauwerkzeug.
> Neu `npm run pruefe-seiten` (54 Seiten, 136 Absätze). Drei Kalibrierungen
> waren nötig (Artikelnamen sind keine Aussagen; ein gerenderter Verweis
> verliert seine Quelle; Seiten aus `inhalte/` sind an der Quelle geprüft),
> dazu ein Fehler im Prüfer selbst: `<p([^>]*)>` trifft auch `<path …>`.
> **Zwei echte Funde:** Die Startseite nannte die Handelsspanne ohne Stand,
> und die Datenschutzseite verwies auf „die Pflicht", deren Fundstelle einen
> Absatz höher stand. Beide behoben.
> [`pruefer-zeigte-auf-die-probe.md`](./pruefer-zeigte-auf-die-probe.md).
>
> **Fünfmal an einem Tag: der Prüfer, der nichts angesehen hat** (27.08.):
> Derselbe Fehler in fünf Werkzeugen — Inhaltsprüfer auf der Probedatei,
> Quellenprüfer auf einer Vorlage mit erfundenen Quellen, Rahmenprobe auf
> einer Seite ohne ausgeführtes Skript, Warenkorbprobe auf einer leeren
> Seite, und deren Absicherung zählte die Kopfleiste mit. **Keiner war
> kaputt; jeder sah das Falsche an, und alle meldeten grün.** Neu
> `npm run pruefe-pruefer`: fragt jeden Prüfer nach seinem Umfang und meldet,
> wer unter dem Mindestmaß bleibt — Gegenprobe mit den alten
> Voreinstellungen zeigt beide Fehler in einem Aufruf. **Zweiter Fund: Es gab
> kein Quellenregister.** Der Quellenprüfer stand seit dem 25.08. bereit und
> hatte nie echte Eingabe. Jetzt `inhalte/quellen.json` mit 4 Normen, 5
> Herstellerseiten (als Hinweis, tragen keine Aussage) und 6 belegten
> Aussagen. 687 Testfälle grün.
> [`pruefer-die-nichts-angesehen-haben.md`](./pruefer-die-nichts-angesehen-haben.md).
>
> **Die Prüfkette ist geschlossen** (27.08. abends): `pruefe-pruefer
> --mit-browser` befragt auch die beiden Browserproben nach ihrem Umfang;
> ein schwaches Szenario ist nachgeschärft (die Escape-Probe zählte nur
> hinterher — **der Beweis gehört vor die Handlung**). Damit trägt jedes der
> 34 Browserszenarien eine Erwartung, die auf einer leeren Seite nicht
> erfüllbar ist. **Weitere Arbeit an der Prüfkette wäre Selbstzweck.** Was
> den Shop weiterbringt, steht im Bericht in zwei Spalten: was beim
> Auftraggeber liegt (Preisliste, Zahlungsanbieter, Impressum, Domain,
> Rechtstexte, Repository privat) und was ohne Rückfrage geht (Gewichte,
> Gate 20 mit Nebenkosten, 12 relevante Lagerhaus-Seiten).
> [`pruefkette-geschlossen.md`](./pruefkette-geschlossen.md).
>
> **Herstellerverweise: drei Artikel zurückgewonnen** (27.08.): `marke()`
> prüfte `startsWith`, die Marke musste ganz vorn stehen. Drei
> Schiedel-Artikel trugen deshalb „kein Herstellermerkblatt vorhanden",
> obwohl der Hersteller in der Bezeichnung steht („… EZ **Absolut**", „…
> **SIKM**"). Jetzt Ganzwortsuche im ganzen Text, längste Marke gewinnt;
> 24 statt 21 von 46 Artikeln mit Merkblattverweis.
>
> ---
>
> **28. August — sieben Läufe, in Kurzform.** Ausführlich je ein Dokument.
>
> **Vierte Systemliste** „Kellerwand außen dämmen" (8 Artikel). Damit stehen
> 32 von 46 Artikeln in mindestens einer Liste. Beim Auszählen fiel auf, dass
> die **Fassadenliste zehn Positionen und neun Artikel** führt — es fehlt die
> Dämmplatte, die teuerste Position; die Seite sagte es nirgends. Jetzt sagt
> sie es vor dem Rechenweg.
> [`systemliste-kellerwand.md`](./systemliste-kellerwand.md).
>
> **„Wird damit zusammen verbaut"** auf 32 Artikelseiten — die Amazon-Zeile
> ohne Amazon-Daten. Grundlage sind die Systemlisten, nicht erfundenes
> Kaufverhalten; **ein Artikel ohne Systemliste bekommt keinen Vorschlag.**
> Die Zusage „keine Kappung" war zuerst ungeprüft: Eine eingebaute Kappung
> auf vier lief durch alle fünf neuen Tests.
> [`mitverbaut-statt-kaufverhalten.md`](./mitverbaut-statt-kaufverhalten.md).
>
> **Drei Artikel trugen das falsche Bild** — Pistolen*schaum* als Pistole,
> Mantelstein*kleber* als Stein, Putztüranschluss*paket* als Sack. Der Kopf
> eines Kompositums steht hinten. Der eigentliche Befund war die Prüfung:
> Sie fragte „ist es ein Bild?", nicht „ist es das richtige Bild?". Jetzt
> hält `SOLLFORM` die Antwort für alle 46 Artikel.
> [`drei-falsche-bilder.md`](./drei-falsche-bilder.md).
>
> **18 von 33 Suchbegriffen fanden nichts** (Stand 01.09., mit „Kaminkopf
> Regenhaube“) — „Rauchfang", „Noppenbahn",
> „Styropor", „Vollwärmeschutz". Neu: `data/suchwoerter.json`, 36 Einträge
> mit Begründung, dazu eine Ablehnungsliste (drainage, abdichtung, bitumen,
> gleitmittel, estrichfolie): **Was der Shop nicht führt, bleibt
> unauffindbar.** [`kundenwoerter.md`](./kundenwoerter.md).
>
> **Schichtenschnitt** auf zwei Systemlisten; die fremden Lagen sind
> schraffiert und beschriftet. Eine Probe hält Bild und Text gegeneinander.
> [`schichtenschnitt.md`](./schichtenschnitt.md).
>
> **Prüfgrenze vom Dokument auf den Absatz:** `pruefe-seiten` übersprang
> ganze Seiten und damit auch den Text, den das Seitenbauwerkzeug selbst auf
> sie schreibt. Jetzt 57 Seiten/216 Absätze statt 54/213 — und der erste
> Blick in den blinden Fleck fand einen Fehler **im Prüfer**: „3 Lagen" las
> er als „3 Liter".
> [`grenze-vom-dokument-auf-den-absatz.md`](./grenze-vom-dokument-auf-den-absatz.md).
>
> **Widerrufen:** Der Rahmen führt seine Skripte doch aus — der Proxy war es.
> Beide Browserproben starten jetzt ohne Weg nach außen, und die zwei aus
> falschem Grund entfernten Szenarien (Warenkorb, Kasse bei 390 px) sind
> zurück. **28 Szenarien, davon 8 im Rahmen.**
> [`rahmen-lief-doch.md`](./rahmen-lief-doch.md).
>
> **Maschinenkanal:** Versandkosten je Artikel im Feed (nur noch die GTIN
> fehlt), eine Verfügbarkeitsangabe für beide Ausgänge statt `PreOrder` gegen
> `InStock`, und `llms.txt` nennt jetzt alle 46 Artikel mit Preis statt nur
> die Gruppen.
> [`maschinenkanal-geschlossen.md`](./maschinenkanal-geschlossen.md).
>
> **Gate 20 rechnet mit der Palette** (28,50 € je Lieferung mit palettierter
> Ware, Untergrenze). Folge: **Eine palettierte Bestellung unter rund 114 €
> Warenwert trägt sich nicht — auch wenn der Kunde die volle Fracht zahlt.**
> Gate 20 hält sie jetzt an. Offen für den Auftraggeber: Mindestbestellwert,
> Palettenzuschlag oder bewusst hinnehmen.
> [`gate20-mit-palette.md`](./gate20-mit-palette.md).
>
> **Stand der Prüfmittel:** 729 Tests, `pruefe-inhalte` 24/355/0,
> `pruefe-seiten` 57/216/0, `pruefe-widerrufe` 131 Dateien/48 Fundstellen,
> `pruefe-quellen` 6/6, `shopprobe` 28, `oberflaechenprobe` 11 (bricht jetzt bei veraltetem Bau ab), Website 81
> Seiten ohne toten Verweis.

> **29. August — dreiundzwanzig Läufe.** Ausführlich je ein Dokument.
>
> **Der Gruppenvorschlag wurde gemessen und verworfen.** Ein Regelwerk, das
> aus der Artikelbezeichnung eine Warengruppe rät, trifft am eigenen Bestand
> 40 von 46 — und das zählt nicht, weil die Regeln an genau diesen Zeilen
> geschrieben wurden. An zurückgehaltenen Daten 25 von 41, und aufgeschlüsselt
> bricht die Zahl auseinander: **25 von 25** auf der Isover-Seite, wo das
> Herstellerkürzel zufällig die Gruppe ist, **0 von 16** auf der
> Vollwärmeschutz-Seite. Die Gruppe ist keine Eigenschaft des Artikels,
> sondern eine Entscheidung dieses Shops — derselbe Baumit KlebeSpachtel ist
> bei uns `Mörtel` und steht beim Lieferanten unter „Vollwärmeschutz". Am
> Liefertag wird stattdessen einmal die Gliederung des Lieferanten auf unsere
> sieben Gruppen abgebildet: rund zwanzig Zeilen statt hundert Entscheidungen.
> [`gruppenvorschlag-nicht-gebaut.md`](./gruppenvorschlag-nicht-gebaut.md).
>
> **Der 390-px-Rahmen gilt jetzt für jede gebaute Seite** statt für neun
> ausgesuchte. `npm run rahmenzensus` liest den Bestand: 81 von 81 Seiten
> rollen nicht seitwärts, die acht Tabellen bis 667 px stehen alle in ihrem
> Scrollkasten. Neun Sekunden. Zwei Messungen, weil `overflow-x: hidden` die
> erste für immer zum Schweigen brächte und den Inhalt dabei abschneidet.
> Die Gegenprobe hat einen Fehler im Prüfer selbst gefunden: erst rollen,
> dann Kanten messen verschiebt jede Kante um genau den Betrag, den es
> aufzudecken gilt. [`rahmen-fuer-jede-seite.md`](./rahmen-fuer-jede-seite.md).
>
> **Die Kasse hat einen Ausgang bekommen.** Sie rechnete den Korb durch und
> sagte dann, dass sie nichts auslöst — richtig für den Betrieb, eine Wand
> für den Besucher, der am weitesten gekommen ist. Nach der Bezirkswahl steht
> jetzt die fertig gerechnete Positionsliste zum Kopieren da: Positionen,
> Fracht, USt, Gewicht, Preisstand, „unverbindliche Anfrage, keine
> Bestellung". Es wird **nichts gesendet** — damit entsteht kein
> Verarbeitungsvorgang, den eine noch fehlende Datenschutzerklärung tragen
> müsste. Gate 23 wird aufgerufen statt nachgebaut.
> [`anfrage-statt-wand.md`](./anfrage-statt-wand.md).
>
> **Und dieser Weg stand danach auf keiner Seite.** Startseite, Kasse und
> `llms.txt` sagen es jetzt — und leiten es aus derselben Rechnung ab wie
> `npm run startklar`, statt aus einem festen Satz, der stehenbliebe, wenn
> der Auftraggeber einen der drei Punkte schließt. Ein Test lässt den echten
> Bau zweimal laufen und verlangt, dass die Auskunft kippt.
> [`was-hier-moeglich-ist.md`](./was-hier-moeglich-ist.md).
>
> **Der ausgelieferte Quelltext trug die Kalkulationsregel.** `shop.js` ging
> mit 293 KB samt aller Kommentare an jeden Besucher, darunter „40 € Einkauf
> und 25 % Ziel ergeben 53,333… €". Damit wäre der offene Punkt „Repository
> privat schalten" **wirkungslos** gewesen — zum Rekonstruieren der
> Einkaufspreise hätte die veröffentlichte Seite genügt. Jetzt wird
> entkommentiert (293 → 202 KB), abgesichert durch `node --check` vor dem
> Schreiben und durch dieselbe Testsuite auf entkommentiertem Quelltext:
> 787 vergleichbare Tests, kein Unterschied.
> [`kommentare-im-schaufenster.md`](./kommentare-im-schaufenster.md).
>
> **Stand der Prüfmittel (01.09.):** 1097 Tests, `pruefe-preise` 46/0, `pruefe-inhalte`
> 24/375/0, `pruefe-seiten` 81 von 81 gebauten Seiten, `pruefe-widerrufe` **348 Dateien/63
> Fundstellen**, `pruefe-preisalter` 46 Artikel (neu), `pruefe-schaufenster` 24 Kennzahlen (neu),
> **10 Prüfer** statt 8 (liest seit 31.08. auch Shoptexte, Werkzeuge und Rechenkern — vorher nur die Akte),
> `pruefe-quellen` 6/6, `shopprobe` 50 (davon 10 im Rahmen),
> `oberflaechenprobe` 11 (bricht jetzt bei veraltetem Bau ab), `rahmenzensus` 81/81, `pruefe-stand` 219/219,
> `pruefe-pruefer` 11 Prüfer ohne Leerlauf (unterscheidet jetzt Abbruch von Leerlauf), Website 81 Seiten ohne toten
> Verweis, **81 von 81 nennen das Liefergebiet** (am Morgen: 3).

## Wo das Projekt steht

**Stand 29. August 2026.** Nichts ist verkauft oder eingenommen — es gibt
keinen Umsatz und keinen Gewinn. Was existiert:

- **Die Firma** — Freudenthaler Bau GmbH, FN 347938z, Baustoffhandel als
  Gewerbe eingetragen. Nichts zu gründen.
- **46 Artikel** mit belegtem Einkaufspreis aus den eigenen
  Lieferantenrechnungen, alle gerechnet, keiner mit Platzhalter. Das ist das
  Maximum aus den vorliegenden Belegen; für die geforderten hundert braucht es
  die Artikelliste des Lieferanten.
- **Eine gebaute Website** — 81 Seiten, 46 Artikelseiten, 14 Wissensseiten, 4
  Systemlisten, 7 Gruppenseiten, Warenkorb und Kasse, dazu `robots.txt`,
  `llms.txt`, `sitemap.xml` und JSON-LD.
- **Ein Anfrageweg**, der ohne Zahlungsanbieter funktioniert.
- **Neun Prüfer**, die den Bestand messen und nicht eine Probe.

**Was fehlt, entscheidet der Auftraggeber**, nicht dieser Loop:
`npm run startklar` nennt es in einem Satz — drei Punkte offen, zwei von hier
aus nicht feststellbar. Die Tabelle unter „Was als Nächstes gebraucht wird"
führt sie einzeln auf.

---

> **Überholt seit 22. August — die Modellfrage ist entschieden.** Was ab
> hier folgt und bis zum 29. August unmarkiert dastand, ist die
> Gegenüberstellung von **Radon-Shop und Leadvermittlung** aus der Zeit vor
> dem Kurswechsel. Beide Modelle sind abgelöst: Der Auftraggeber kalkuliert
> seit dem 22. August mit **eigenen Baumeisterpreisen**, 25 % Marge,
> Vertrieb über Google Shopping, Lieferung **regional**. Es gibt keine
> Modellwahl mehr zu treffen.
>
> Der Abschnitt bleibt als Fehlergeschichte stehen — **er beschreibt nicht,
> woran gearbeitet wird.** Ein Lauf, der ihn für aktuell hält, arbeitet an
> der falschen Sache. Dieselbe Sorte Fehler wie die überholte
> 32-%-Untergrenze in `PARAMETER.md`, und sie stand hier eine Woche länger.

Aus zehn geprüften Baustoffnischen und vier Geschäftsmodellen sind **zwei
Kandidaten** übrig, die beide auf derselben inhaltlichen Grundlage aufbauen —
Radonvorsorge und Bausanierung in Österreich.

| | Radon-Shop | Leadvermittlung Bausanierung |
|---|---|---|
| Nötiger Erlös | 24.200 €/Monat | 5.724 €/Monat |
| Break-even | ~4.714 € (7 Bestellungen) | ~350 € (2–3 Leads) |
| Sessions für Zielgröße | **1.900–2.550/Monat** | ~1.570/Monat, **unter Vorbehalt** |
| Kapital bis erste Einnahme | 2.700 € | < 1.000 € |
| Laufender Aufwand | 6,5–15 h/Monat | 4–6 h/Monat |
| Bestandseffekt | keiner | ja, ab Stufe B |
| Obergrenze | offen nach oben | ~8.000–12.000 €/Monat |
| Engpass | Rohmarge | Lead-Quote der Feuchtethemen |
| Zeit bis erstem Erlös | Wochen | Wochen über Strecke 1 und Gruppe C |
| Zeit bis Ziel | 18–30 Monate | ähnlich, geringeres Kapitalrisiko |

Beide erreichen 3.000 € netto nur, wenn die Annahmen halten. Die schwächsten
sind unten benannt.

## Die Modellwahl ist vertagt — begründet

> **Überholt seit 22. August.** Auch dieser Abschnitt gehört zum abgelösten
> Radon-Stufenmodell. Die Wahl ist nicht mehr vertagt, sie ist gegenstandslos.

Drei Bedingungen stehen gegeneinander und sind nicht gleichzeitig zu haben:

| Verzicht auf | Ergebnis |
|---|---|
| Passivität | Radon-Shop bauen — schnellster Weg zu Umsatz, dauerhafter Aufwand |
| Tempo | Inhalte und Leadvermittlung — geringster Kapitaleinsatz, längerer Anlauf |
| Alleinstellung | in ein besetztes Feld eintreten — Wettbewerb über Preis |

**Empfehlung: Inhalte zuerst.** Sie werden für beide Modelle gebraucht, kosten
wenig und halten die Entscheidung offen, bis die Herstellerkonditionen
vorliegen.

In [`phase9-meilensteine-und-abbruch.md`](./phase9-meilensteine-und-abbruch.md)
ist daraus **Gate 4** geworden: Die Stufen 0 bis 2 sind für beide Modelle
identisch, getrennt wird erst bei der Monetarisierung. Die Wahl fällt am Ende
von Stufe 2 anhand des ersten tatsächlichen Geschäfts — sie ist damit keine
offene Blockade mehr.

## Was als Nächstes gebraucht wird

**Stand 28. August 2026 — für den Baustoff-Shop.** Der Abschnitt darunter
(„Zwei Freigaben") gehört zum Radon-Stufenmodell und ist seit dem Kurswechsel
vom 22. August **überholt**; er bleibt als Fehlergeschichte stehen.

Nichts davon kann der Arbeitsloop selbst auslösen. Sortiert danach, was den
Shop am weitesten bringt:

| Nächster Schritt | Braucht | Ergebnis |
|---|---|---|
| **Artikelliste** aus dem Poschacher-Webshop (Kundenkonto → Export als CSV) | eine Ausleitung durch den Auftraggeber | aus 46 Artikeln werden hunderte; der Importweg steht (`npm run preisliste`) |
| **Impressum vervollständigen** — E-Mail, Telefon, UID, Gewerbewortlaut | vier Angaben aus dem laufenden Betrieb | die Seite darf online; unvollständig ist sie abmahnfähig |
| **Zahlungsanbieter wählen** | eine Entscheidung, dann ein Vertrag | die Kasse löst tatsächlich Bestellungen aus — bis dahin erzeugt sie die gerechnete Anfrage zum Kopieren |
| ~~Domain und Hosting~~ | **entschieden 31.08.: `bauversand.com` bei All-Inkl** | eingetragen in `data/betreiber.json`; das Hochladen bleibt offen, und vor den Rechtstexten gehört die Seite nicht öffentlich |
| **Rechtstexte** (AGB, Widerruf, Datenschutz) | ein Rechtstexteanbieter | verbindlicher Wortlaut statt Gerüst mit Begründungen |
| **Repository privat schalten** | einen Klick | 44 von 46 Einkaufspreisen sind heute aus zwei veröffentlichten Zahlen rekonstruierbar |
| **Mindestbestellwert entscheiden** | eine Entscheidung | palettierte Bestellungen unter ~114 € Warenwert tragen sich nicht (Gate 20) |
| **Lieferzeit von Poschacher** in Werktagen ab Bestellauslösung | eine Zahl aus dem laufenden Betrieb | ohne sie darf keine Auftragsbestätigung hinaus — der zugesagte Termin wäre erfunden; `null-werktage.md` |

Zwei Entscheidungen sind am 28. August **getroffen** worden und hier nur noch
der Vollständigkeit halber vermerkt: Die Handelsspanne wird auf der
Kundenseite **nicht** mehr genannt, und das Sortiment soll auf mindestens
hundert Artikel wachsen.

**Was sich am 29. August daran geändert hat:** Nichts an der Liste — aber der
erste Punkt ist billiger geworden, als er aussieht. Für die E-Mail-Adresse im
Impressum spricht seit heute ein zweiter Grund: Ohne sie hat der Anfragetext
auf der Kasse keinen Mailknopf, sondern nur den Hinweis, dass die Adresse
fehlt. Eine Angabe, vier Minuten Aufwand, und der einzige heute begehbare Weg
wird vom Kopieren zum Klicken.

---

> **Überholt seit 22. August — Radon-Stufenmodell.** Was folgt, beschreibt
> die Freigaben des früheren Modells (Herstelleranfragen, Keyword-Werkzeug).
> Es gilt nicht mehr; der Auftraggeber hat auf eigene Baumeisterpreise und
> regionale Lieferung umgestellt. Siehe `auftrag-baumeisterpreise.md`.

Zwei Freigaben. Der Arbeitsloop kann keine davon selbst auslösen, zusammen
kosten sie unter 200 €.

| Nächster Schritt | Braucht | Entscheidet | Vorbereitet in |
|---|---|---|---|
| Rohmarge belegen (Stufe 0) | Freigabe für E-Mails an dreizehn Adressaten (zwölf Hersteller, Lagerhaus) | den **Shop** — Gate 1, 2, 6 | `anschreiben-entwuerfe.md`, Zugänge in `adressaten-und-zugaenge.md`, Auswertung per `npm run auswerten` |
| Suchvolumina prüfen (Stufe 1) | Werkzeug festgelegt: Mangools-Monat ~50 €, bei Grenzbefund Sistrix-Monat ~119 € — Rahmen 100–200 € unverändert | **beide Modelle** — Gate 15 | `entscheidungsmatrix.md`, Werkzeugwahl in `werkzeugwahl-suchvolumen.md` |
| Rechtsform, Shop, Inhalte | erst ab Stufe 2, nach den beiden obigen | — | `phase5-technik.md`, `phase8-*` |

Beide Freigaben sind gleichrangig, und sie sollten **zugleich** laufen. Muss
eine zuerst, dann das Keyword-Werkzeug: Es entscheidet über beide Modelle,
während die Herstelleranfragen nur den Shop betreffen.

> **Zusatz vom 15. August**, aus
> [`empfindlichkeit-der-annahmen.md`](./empfindlichkeit-der-annahmen.md): Die
> Reihenfolgefrage stellt sich streng genommen gar nicht. Die
> Herstelleranfragen kosten **0 €** und klären mit der Rohmarge die
> empfindlichste der vier Planungsgrößen — Elastizität 1,75, und als einzige
> mit einem Kipppunkt. Es gibt keinen Grund, eine kostenlose Freigabe auf eine
> kostenpflichtige warten zu lassen. Und: **Das Keyword-Werkzeug misst nicht
> die Umsatzquote**, sondern das Suchvolumen; die 2 % bleiben auch nach dieser
> Ausgabe eine Annahme.

Was welcher Ausgang bedeutet, steht in
[`entscheidungsmatrix.md`](./entscheidungsmatrix.md).

Das Kapitalrisiko bis zur ersten belegten Einnahme liegt im Stufenmodell bei
**2.700 €**, nicht bei den früher genannten 8.000–12.000 €.

## Die Zahlen, auf denen alles ruht

1. **Rohmarge 35 %** — weiterhin **unbelegt**, aber seit 16. August mit
   Straßenpreisanker: Die Leitposition kostet im herstellereigenen Endkundenshop
   398 € **brutto** (~331,67 € netto AT) — unsere Platzhalter-UVP war die
   Bruttozahl. Am VK-Deckel braucht die Bahn 38 % Rabatt auf die Netto-Liste;
   alles hängt an der Bezugsbasis, und die kann nur der Hersteller nennen.
   Unter 32 % fällt die Nische (Gate 3). Zweiter, unabhängiger Anker seit
   16. August: Zertifizierte Radonabdichtung kostet am Markt herstellerübergreifend
   ~10–11 €/m² brutto (Vedagard AL-E ab 10,27 €/m² im klassischen Händlerkanal).
   Siehe `alternativen-ohne-freigabe.md` und `vertriebswege-der-hersteller.md`.
2. **Suchvolumen** — weiterhin **nicht gemessen**. Die Inhaltslandkarte beruht
   auf Plausibilität.
3. **Lead-Quote der Feuchte- und Abdichtungsthemen** — mit 2 % angenommen und
   nach Gate 15 **nicht mehr als Planungsgrundlage** geführt. Das Segment ist von
   vertikal integrierten Franchisesystemen besetzt. Siehe `pruefung-gruppe-c.md`.
4. **Umsetzungsquote der Radonvorsorge** — wird nirgends erhoben, hat aber
   seit 16. August einen Anker: **~2.000 Haushalte/Jahr** nutzen die kostenlose
   AGES-Messung, österreichweit. Der akute Sanierungsmarkt liefert damit
   Hunderte Fälle pro Jahr, nicht Tausende pro Monat — die Sessions müssen aus
   dem Neubau-Pflichtkanal kommen. Der ist seit dem 16. August auch räumlich
   beziffert: fast flächendeckend, ausgenommen Wien und zehn Bezirke
   (darunter Ried im Innkreis); EFH-Kern ~8.000–9.000 Häuser/Jahr. Siehe
   `alternativen-ohne-freigabe.md`, `marktrisiko-neubau.md` und
   `nachfragezahlen-pflichtgebiet-und-bestand.md`.
5. **Materialwert je Gebäude** — ~~reine Schätzung 400–1.500 €~~ hergeleitet:
   1.260–2.955 € für den beschlossenen Warenkorb, Konfidenz mittel — **seit
   16. August als optimistisch markiert**: Alle drei Warengruppen stehen mit
   ihrer Netto-Platzhalter-UVP auf oder über dem Brutto-Straßenpreis, die
   Drainagegruppe Faktor 2 über dem Markt. Siehe
   `strassenpreisanker-sortiment.md` und `phase4-sortiment-und-materialwert.md`.

## Dokumente

### Grundlagen
| Datei | Inhalt |
|---|---|
| `PARAMETER.md` | Festgelegte Vorgaben, Umrechnung netto → vor Steuer, Margenschwelle |
| `README.md` | Ursprüngliche Denkgrundlage. Teilweise überholt, Grundrechnungen gültig |
| `master-prompt.md` | Die ursprüngliche Auftragsfassung. Als Handlungsanweisung überholt |
| `schaufenster-abgleich.md` | **Sieben Anzeigen, drei Stände** — PR-Beschreibung und Website-Vorschau heute nachgezogen; Kalkulationsseite und Ablaufplan sind gültig, aber unvollständig (kennen Skonto bzw. Rechtsseiten nicht); die beiden Radon-Anzeigen stehen **bewusst** still, weil sie zu einem anderen Modell gehören. Die Regel: Wer eine Zahl in einem Schaufenster ändert, ändert sie in allen — oder trägt dort ein, warum nicht |
| `produktfeed-stand.md` | **„46 veröffentlichbar" war die optimistischste Falschaussage des Vorhabens** — `katalogFeed()` rechnete die fehlende GTIN aus und warf sie weg, und Gate 22 lief nicht mit. Jetzt: 43 im Feed, 3 als Beipack zurückgehalten, **einreichbar: nein**, weil bei allen 43 die GTIN fehlt. Der echte Katalog ist angeschlossen; ohne Preisdatei fällt das Werkzeug auf den Radonkatalog zurück und sagt welchen es benutzt |
| `gate-register.md` | **Alle neunzehn Gates an einer Stelle.** Maßgeblich bei Widerspruch |
| `entscheidungsmatrix.md` | **Wie die zwei ausstehenden Prüfungen zu lesen sind.** Vier Ausgänge, vorab festgelegt |
| `zahlenpruefung.md` | Alle zweiundzwanzig Rechenketten nachgerechnet; zwei kleine Fehler benannt |
| `analyse-abgeschlossen.md` | **Gate 18 — die Analysephase ist geschlossen.** Was den Loop wieder aufweckt |
| `umsetzung-shop.md` | **Bauprotokoll des Shops.** Baustand, Sperren, nächste Bausteine |
| `zweite-rechnung.md` | **Der gerenderte Beleg wurde von keinem Testfall geprüft** — 3.402 Belege zurückgelesen, nichts gefunden; wie viel das wert ist |
| `gegenprobe-bestellung.md` | **Ein Zeilenumbruch zerlegte die Bestell-CSV** — behoben; die Bestellung, die Ware bewegt, wird jetzt gegen den Warenkorb zurückgelesen |
| `fremdtext-ein-und-ausgaenge.md` | **Ein Firmenname konnte 999 Rollen bestellen** — behoben; Verzeichnis aller fünf Eingänge und acht Ausgänge für fremden Text |
| `frachtschwelle-und-bestellwert.md` | **Die Frei-Haus-Grenze wurde am Verkaufswert gemessen statt am Einkauf** — behoben; 1.024 Teillieferungen betroffen, Referenzgebäude unverändert |
| `vorgangsklammer.md` | **Ware nach Innsbruck, Rechnung nach Linz** — nichts band die Papiere eines Vorgangs aneinander; behoben, und die Klammer hat zuerst sich selbst verraten |
| `baustelle-als-lieferort.md` | **Eine vierstellige PLZ beweist nicht Österreich** — Lugano, Zürich und Vaduz kamen durch; dazu die Baustelle als eigene Lieferanschrift |
| `ruegefrist-und-baustelle.md` | **Wer auf der Baustelle übernimmt, übernimmt für den Besteller** — § 377 UGB läuft ab Ablieferung; zwei neue AGB-Punkte und Hinweise vor der Bestellung |
| `auftragsbestaetigung.md` | **Geld genommen, bevor ein Vertrag bestand** — AGB Punkt 2 verlangt eine Auftragsbestätigung, die es nicht gab; jetzt vor der Zahlung im Ablauf |
| `margenleck-im-angebot.md` | **Das Angebot nannte den Einkaufswert** — 30 % Handelsspanne in Ziffern, aus einer eigenen Korrektur entstanden; dazu zwei AGB-Befunde |
| `abgleich-versprechen-und-verhalten.md` | **Der Ansprechpartner auf der Baustelle hat nie zugestimmt** — Art. 14 DSGVO; der Abgleich Versprechen gegen Verhalten als Werkzeug statt als Durchsicht |
| `zusicherung-und-ablage.md` | **Was in die Ablage geht, geht für sieben Jahre hinein** — Zusicherung nach Art. 14; Daten Dritter bleiben aus dem unveränderbaren Journal |
| `alternativen-ohne-freigabe.md` | **Die Platzhalter-UVP war der Bruttopreis** — Straßenpreisanker statt Herstellerantwort, AGES-Zahlen statt Keyword-Werkzeug; beide Freigaben bleiben nötig, aber entlastet |
| `strassenpreisanker-sortiment.md` | **Das Drainagerohr kostet am Markt die Hälfte unseres Platzhalters** — die Drainagegruppe kann kein Margenträger sein; die Zange aus Commodity und Hersteller-Direktvertrieb ist vollständig benannt |
| `felder-der-ablage.md` | **Ein eingefrorenes Feld kann nie wahr werden** — das Felderverzeichnis der Ablage; jedes Journalfeld trägt Grundlage oder Beweislast, das tote Feld `storniert` ist entfernt |
| `gedaechtnis-der-ablage.md` | **Erst das Journal, dann der Speicher** — die Ablage überlebt den Neustart als Anhangdatei; auch die Nummernvergabe wird eine Zeile, sonst vergäbe der Neustart Rechnungsnummern doppelt |
| `nachfragezahlen-pflichtgebiet-und-bestand.md` | **Das Pflichtgebiet ist fast ganz Österreich — ausgenommen Wien und zehn Bezirke** (nicht darunter: der Heimatbezirk Perg — die frühere Zuschreibung an Ried im Innkreis war eine Verwechslung, [`zwei-ried.md`](./zwei-ried.md)) — EFH-Kern ~8.000–9.000 Häuser/Jahr; Bestand ~240.000 betroffene Wohnungen, Engpass ist die Messquote |
| `gebietsauskunft-zwischenloesung.md` | **Elf Einträge statt 2.095 Gemeinden** — die Vorsorgegebiets-Auskunft über die Negativliste, als Auskunft mit ausgesprochenen Grenzen statt als Sperre; Schutzgebiets-Stufe bleibt am Verordnungstext blockiert |
| `vertriebswege-der-hersteller.md` | **Die Zange ist kein Branchengesetz** — Vedagard AL-E läuft im klassischen Händlerkanal zum selben m²-Straßenpreis wie die AlphaBlock; die Anschreiben entscheiden über die Marge, nicht mehr allein über die Lieferfähigkeit; ein Großhändler wird dreizehnter Adressat |
| `auswertung-grosshandelsweg.md` | **Ein Einkaufspreis ohne Deckel ist keine Kondition** — der Auswertungsbogen liest jetzt beide Antwortwege; nennt eine Antwort beide, gilt der schlechtere; alle dreizehn Antworten sind am Tag ihres Eintreffens auswertbar |
| `gegenpruefung-bezirksliste.md` | **Sieben von zehn Bezirken bestätigt, Ried amtlich** — die Negativliste der Gebietsauskunft hält der Gegenprüfung stand; der Verordnungstext bleibt die ausständige Instanz, drei Fundstellen für den ersten freien Netzzugang notiert |
| `partnerauswertung.md` | **Machbar ab zwei Bestandenen** — der Partner-Auswertungsbogen; die Fristenlösung braucht je Bezirk zwei genannte Betriebe, der zweithöchste Leadpreis trägt; alle drei 0-€-Auslöser sind jetzt vorab auswertbar |
| `gebuehr-auf-die-fracht.md` | **Die Kaskade widersprach ihrer eigenen Kopfzeile** — die Zahlungsgebühr fällt auch auf die durchlaufende Fracht; vierter Zahlenfehler, vierter in die optimistische Richtung; Kaskade und Einzelbestellung rechnen jetzt auf den Cent gleich |
| `mehrdeutige-zahlen-im-import.md` | **1.234 kann zweierlei heißen — jetzt wird abgewiesen statt geraten** — ein mehrdeutiger Preis hätte echte Katalogdaten still um den Faktor 1.000 geschrumpft; die Importzeile scheitert jetzt sichtbar |
| `belegzeile-fremdfelder.md` | **Dieselbe Regel, bisher ein Drittel der Felder** — die UID-Belegzeile entschärfte nur den Namen; jetzt geht die ganze Zeile durch textZeile, egal welches fremde Feld vergiftet ist |
| `untergrenze-in-der-empfindlichkeit.md` | **Die Elastizität rechnete Betriebspunkte aus, die Gate 1 verbietet** — das nie gelesene Untergrenzen-Feld ist verdrahtet; die Nische fällt an Gate 1 bei 8,6 % Verschlechterung, lange vor dem rechnerischen Kipppunkt |
| `grenze-bei-genau-300.md` | **Genau 300 überschreiten 300 nicht** — die Leadstrecke qualifizierte einen Anlass ohne Überschreitung und schrieb dem Kunden eine falsche Aussage; Grenze und Testfall korrigiert |
| `verschnitt-auf-der-falschen-basis.md` | **22 % über dem Bedarf, nicht 18** — die Verschnitt-Prozentzahl stand auf der gelieferten Fläche statt auf dem Bedarf; und Positionen, die das Sortiment nicht führt, verschwinden nicht mehr stumm aus der Stückliste |
| `verhandlung-geprueft-artefakt-aktuell.md` | **Zehntes Audit ohne Fund** — die Rückwärtsrechnung hält ihrer Erklärung stand; Funktionsmuster-Artefakt auf den Abendstand gebracht; die Audit-Serie braucht ab jetzt neue Eingangsdaten oder einen neuen Prüfwinkel |
| `generalprobe-freigabetag.md` | **Die Kette läuft, bevor es zählt** — fiktive Antworten laufen von Bogen bis Sessionzahl und Leadpreis durch; Gate 17 ist nicht mehr gefolgert, sondern vorgeführt, und die Probe läuft bei jedem npm test mit |
| `auswertung-als-werkzeug.md` | **Der Bogen als Werkzeug, nicht als Testprotokoll** — `npm run auswerten -- <datei>` trägt die Antworten des Freigabetags vor: Bogenvollständigkeit, Prüfung A, Folgen, Partnerrunde; die Beispieldatei ist fiktiv und als solche beschriftet |
| `adressaten-und-zugaenge.md` | **Der dreizehnte Adressat ist das Lagerhaus** — Quester ist im Konkurs (Räumung bis April 2026), BayWa AT verkauft ihre Lagerhaus-Mehrheit; das Lagerhaus führt BMI-Bitumenbahnen inkl. Vedatect; alle zwölf Herstellerzugänge erhoben, sieben mit AT-Sitz |
| `import-riegel-umgangen.md` | **Der Muster-Riegel prüfte das Argument, nicht den Pfad** — aus beispiel/ heraus wären vier erfundene Preise als bestätigt in den Katalog geschrieben worden; Riegel am aufgelösten Pfad, Marker im Dateinamen, Meldung statt Stacktrace |
| `bau-pruefte-nur-den-kern.md` | **Der Wächter bewachte nur den Kern** — Template-Kollisionen, $-Ersetzungsmuster und fehlende Platzhalter passierten den Bau stumm; jetzt parst der Bau das fertige Modulskript mit node --check; Nebenfund: export async function stand seit jeher unentkleidet im Bündel |
| `pruefer-der-pruefer-auditiert.md` | **Eine fremde Länge schirmte hohle Schleifen ab** — die Längenregel des Hohlheitsprüfers band die Zusicherung nicht an die geschleifte Liste; verschärft ohne einen neuen Verdacht im Bestand; die Probedatei liegt jetzt im Repo und der Nachweis läuft bei jedem npm test |
| `tagesstand-17-august.md` | **Alle Schaufenster auf denselben Stand** — Bericht-Artefakt, Funktionsmuster-Artefakt und PR-Beschreibung auf den 17. August gezogen (Lagerhaus, 422 Testfälle, vierzehn Audits); eine nicht mitgezogene Anzeige ist eine stille Falschaussage |
| `werkzeugwahl-suchvolumen.md` | **Das Messgerät für Prüfung B ist festgelegt** — zweistufig: Mangools-Monat (~50 €), nur bei Grenzbefund Sistrix Start (~119 €); der Keyword Planner misst die 200er-Schwelle nicht und bleibt Gegenprobe; Rahmen 100–200 € unverändert, gekauft ist nichts |
| `suchauswertung-als-werkzeug.md` | **Prüfung B ist ausführbar** — Matrix-Regeln als Modul (Difficulty-Skala und Drittelgrenze vorab zahlenfest), messfertige Keyword-Liste mit 31 Begriffen in sechs Clustern, `npm run suchvolumen` trägt vor; die fiktive Beispielmessung zeigt absichtlich einen Grenzbefund |
| `partner-suchweg.md` | **Der Suchweg zu den Partnerbetrieben steht** — WKO Firmen A-Z bezirksscharf (241 Bauwerksabdichter in OÖ), Zielbezirke Mühlviertel zuerst, Vorfilter, zwei Kandidaten je Bezirk; Firmennamen bewusst nicht im Repo, die Liste entsteht am Versandtag lokal |
| `oberflaeche-am-verhalten.md` | **Sieben Headless-Szenarien durch die echte Oberfläche** — genau-300, Kurzzeitregel, VIES-Dreizustand, Rollenbindung, Gebietsauskunft, alle grün; der Ertrag lag in der Sonde selbst: stiller No-op-Einbau und Grün durch Quelltext-Kollision, beide behoben mit Selbstnachweis-Marker und Nur-gerendert-Prüfung |
| `warteordnung.md` | **Was der Loop tut, wenn nichts mehr ansteht** — Blockadenliste, Wartelauf (RIS-Nachprüfung, PR, Schaufenster nur bei Substanzänderung, sonst ehrlich enden); erfundene Runden verwässern die echten |
| `auftrag-baumeisterpreise.md` | **Neue Weisung vom 22. August** — eigene Baumeisterpreise +25 % statt unbelegter Platzhalter, Google Shopping, regionales Liefergebiet; Gate 1 und Gate 5 sind damit neu zu entscheiden. Rechnungen fehlen noch, Loop pausiert bis nächste Woche |
| `ki-sichtbarkeit-konzept.md` | **Genannt werden, wenn eine KI nach Baustoffen gefragt wird** — vier Wege (Feed, KI-Suche, Trainingswissen, Agentenbesuch), Vertrauen entsteht aus Entitätskonsistenz, Drittquellen und Überprüfbarkeit; Empfehlung gegen den Parallelshop, für eine zweite Ausgabeform desselben Shops; das regionale Liefergebiet ist dabei ein Vorteil |
| `rechnung-zum-zuschlag.md` (+ [Seite](https://claude.ai/code/artifact/6e356abb-b5d3-44a9-9b8d-f98a13fb0502)) | **Was 25 % Zuschlag kosten** — 20 % Rohmarge, nötiger Umsatz 72.740 €; der Werbeanteil ist der Killer (Tragfähigkeit endet bei 18 %); kleine Warenkörbe tragen ihre Fracht nicht. Gate 1 abgelöst durch **Gate 20: keine Bestellung ohne positiven Deckungsbeitrag**, ausführbar im Rechenkern. *Zahlen überholt durch `marge-25-prozent.md`* |
| `gate-register.md` | **Nachgeführt auf 24 Gates** (Stand 28. August; am 26. waren es 22) — Gate 20 in der berichtigten Lesart (25 % Marge statt Zuschlag), neu **Gate 21** (Zahlungsziel ≤ Skontofrist) und **Gate 22** (nur unter Listenpreis kommt in den Shop). **Gate 5 ist entschieden:** gegenstandslos für dieses Modell, weil kein einziger der 46 Artikel radonspezifisch ist — für das Radon-Streckenmodell gilt es unverändert weiter |
| `zweiter-lieferant-und-skonto.md` | **3 % Skonto sind mehr wert als die gesamte Zahlungsgebühr** — und **Gate 21** setzt es durch: Das Kundenzahlungsziel darf die Skontofrist nicht überschreiten. Nur der Rechnungskauf kann das Gate verletzen, und genau der ist im Baustoffhandel üblich. **Der Satz davor ist am 26.08. zurückgenommen worden** — gemessen wird der Geldeingang; der Rechnungskauf über einen Anbieter hält das Gate. — beide Lieferanten geben 3 % bei 14 Tagen, Fracht ausgenommen. Das hebt die Marge von 25 auf 27,25 % und senkt den nötigen Monatsumsatz von 45.356 auf 38.786 €, also um ein Siebtel. Folge: Die Kundenzahlungsfrist darf die Skontofrist nicht überschreiten (AGB Punkt 9, bisher nicht bedacht). Pramer als zweiter Lieferant gefunden, aber **nicht** in den Katalog übernommen — Angebot statt Rechnung, kein Listenpreis, Maßware, und das XPS ist nicht dasselbe. Auslesewerkzeug hatte einen stillen Nullfund (`/Type/Page` gegen `/Type /Page`), behoben |
| `rechtstexte-stand.md` | **Fünf Rechtsseiten als Gerüst mit sichtbaren Lücken** — Impressum aus belegbaren Firmenbuchdaten, vier Pflichtangaben ausdrücklich offen statt geraten; AGB in 13 Punkten und Datenschutz in 9 Punkten als Gliederung mit Begründung, Wortlaut vom Rechtstexteanbieter. Widerruf entfällt bei reinem B2B — aber nur, solange Verbraucherbestellungen wirksam ausgeschlossen sind |
| `werkzeuge/` | **Die Auslesekette liegt im Repository** — `entpacken.py`, `pdftext.py`, `positionen.py` samt README; sie existierte bisher nur in einem flüchtigen Container |
| `shop/inhalte/` + `npm run website` | **Die Website steht: 72 Seiten** — 46 Artikelseiten, 13 Wissensseiten, 3 Systemlisten, 7 Warengruppen, Lieferung und Start. Alle 23 Inhaltsseiten gehen ohne Verdacht durch `npm run pruefe-inhalte`; drei Beanstandungen wurden belegt statt weggeschaltet. Zwei Ausgaben aus einer Quelle: `ausgabe/site/` zum Hochladen (robots.txt, llms.txt, sitemap.xml, JSON-LD) und `ausgabe/website.html` als Einzeldatei. Neu: `src/markdown.js` ohne Fremdpaket. [Vorschau](https://claude.ai/code/artifact/fe6d720d-473d-4af5-a26b-6fcfbea929dc) |
| `kampagne-gerechnet.md` | **Die Kampagne ist importfertig und pausiert** — sechs Anzeigengruppen, Gebote aus dem Deckungsbeitrag des Referenzwarenkorbs gerechnet statt geschätzt: Kamin 8,79 €, Dämmung 6,48 €, WDVS 4,19 € gegen einen Markt von 0,50–2,50 €; Kanal, Mörtel und Mauerwerk knapp bei ~1,85 €. Zwei Regeln stehen jetzt im Programm statt im Dokument: kein Artikel am Listendeckel bekommt eine Anzeige, kein Gebot ohne Deckung. `npm run kampagne` |
| `katalog-aus-rechnungen.md` | **Die Rechnungen sind ausgelesen** — 15 Belege, 70 Positionen, 46 Handelswaren mit Listenpreis und Rabattsatz; Summenprobe je Beleg deckte vier Parserfehler auf, die Preisbasis „per 1000" eine fünfte. Zentraler Befund: Der Einkaufsvorteil ist extrem ungleich verteilt — tief bei Dämmung, Kanal und Systemware, dünn bei Kleinteilen. **Kleinteile gehören nicht als Suchartikel in den Shop**, das dreht die frühere Staffelungsempfehlung um. Preisdaten liegen unter `preise/` und sind gitignoriert |
| `marge-25-prozent.md` | **„25 %" heißt Marge, nicht Zuschlag** — nötiger Umsatz 45.356 € statt 72.740 €, 70 statt 112 Bestellungen (**beides Kartenzahlung, Stand 25.08.**; mit dem am 27.08. entschiedenen Zahlweg EPS sind es 43.396 € und 67), Werbeanteil trägt bis 23 % statt 18 %; frei-Haus-Schwellen fallen um ein Fünftel; der Preisvorteil gegenüber dem Fachhandel schrumpft von 14 % auf 8 %; Vorschlag für gestaffelte Margen liegt bei |
| `inhalte-und-pruefteam.md` | **Inhalte, Datenblätter, Prüfkette** — fremde YouTube-Transkripte sind unzulässig (§ 42f UrhG), tragfähig ist die Nutzung als Recherchequelle; Datenblätter verlinken statt spiegeln; vier Rollen mit sieben vorab festgelegten Regeln, Prüfschicht als `npm run pruefe-inhalte` gebaut |
| `videos-als-quelle.md` | **Ein Video ist ein Hinweis, keine Fundstelle** — YouTube ist aus dieser Umgebung gesperrt; die Prüfregel steht trotzdem: eine tragende Quelle genügt, zwei Videos desselben Kanals sind eine Quelle, Kennwerte brauchen Norm oder Datenblatt. Die eigene Berufserfahrung trägt. `npm run pruefe-quellen` |
| `maschinenlesbare-ausgabe.md` | **Schema.org, Feed und robots.txt** — Preise werden übernommen statt nachgerechnet, Platzhalter gehen nicht hinaus, Zurückgehaltenes wird begründet |
| `domainwahl.md` | **Die Firma und ihre Domain gibt es schon** — Freudenthaler Bau GmbH, FN 347938z, Baustoffhandel eingetragen, `freudenthaler-bau.at` in Betrieb; Empfehlung daher `shop.freudenthaler-bau.at` plus `baustoffe-muehlviertel.at` als Weiterleitung. Zwei Korrekturen: Ried in der Riedmark liegt im **Mühlviertel**, nicht im Innviertel; der Entitätswert ist bereits aufgebaut und wäre bei einer neuen Domain verloren |
| `pruefung-der-testfaelle.md` | **Grüne Tests sind eine Aussage über die Testfälle, nicht über den Code** — elf hohle Schleifen gefunden und entschärft |
| `shop-mit-warenkorb.md` | **Was an einem Shop hochwertig ist, sind vier Dinge, die ein Kunde tut** — Suche, Filter, Warenkorb, Kasse; die Suche musste Deutsch lernen (Kompositum-Treffer), der Warenkorb sagt selbst, wenn die Fracht die Ware übersteigt, und die neue Shopprobe fand die fehlende Zeichensatzangabe |
| `pruefkette-geschlossen.md` | **Ein Werkzeug, das Fehler findet, ist kein Ort, an dem keine Fehler wohnen** — Abschluss des Werkzeugtags mit Bilanz: acht Prüfer, neun Funde, und die Liste dessen, was jetzt wirklich offen ist |
| `pruefer-die-nichts-angesehen-haben.md` | **Ein Prüfer, der nichts angesehen hat, ist nicht still — er ist zustimmend** — fünf Fälle an einem Tag, neue Stufe `pruefe-pruefer` fragt nach dem Umfang statt nach dem Befund. Dazu das erste echte Quellenregister: 4 Normen, 6 belegte Aussagen |
| `pruefer-zeigte-auf-die-probe.md` | **Ein Prüfer, dessen Voreinstellung nicht auf den Bestand zeigt, wird mit der Voreinstellung aufgerufen** — und die Hälfte des Shoptextes stand nie unter den Inhaltsregeln. Zwei echte Funde: Handelsspanne ohne Stand, Pflicht ohne Fundstelle im eigenen Absatz |
| `rahmen-ohne-javascript.md` | **Ein Prüfer, der nicht durchfallen kann, ist schlimmer als kein Prüfer** — zwei Szenarien gebaut, beide hohl, beide entfernt. Dabei gemessen: Eingebettete Dokumente führen in dieser Prüfumgebung keine Skripte aus |
| `bedienbar-mit-daumen-und-tastatur.md` | **Wer einen Suchvorschlag nur mit der Maus erreicht, für den ist die Liste eine Zierde** — Tastaturbedienung samt ARIA nachgerüstet, alle Bedienelemente auf 44 px gebracht. Die Zahl im Fehlertext ist der Unterschied zwischen einem Hinweis und einer Diagnose |
| `shop-am-telefon.md` | **Ob eine Seite seitwärts scrollt, beantwortet man, indem man sie seitwärts scrollt** — Bildschirmfoto und scrollWidth führten beide auf falsche Fährten, und der erste Prüfer maß eine leere Seite. Der echte Fehler war ein deutsches Kompositum in einer Überschrift |
| `gewichte-mit-summenprobe.md` | **Keine Zahl ohne bestandene Summenprobe** — 7 Artikelgewichte aus vier resterfreien Belegen, null Widersprüche. Die Kanalgruppe wiegt so wenig, dass sie ins Paket passt, und hat zugleich den größten Preisvorteil |
| `fracht-nur-bei-zustellung.md` | **Elf von fünfzehn Belegen lauten „Abholung Kunde"** — die Aussage „Fracht auf jedem Beleg" ist widerrufen. Dazu: Das Gewicht stand die ganze Zeit auf den Rechnungen (Auslesung noch fehlerhaft), und 118,50 € Paletten- und Folierungskosten fehlen im Rechenkern — mehr als die Fracht selbst |
| `paketversand-kleine-einheiten.md` | **Ein 25-kg-Sack ginge für rund 21 € statt 75,50 €** — die Frachtschwelle fiele von 332 auf rund 95 €. Drei Vorbehalte: Zahlen nur als Hinweis, kein Gewicht im Katalog, und im Streckengeschäft hat niemand das Paket in der Hand |
| `gate24-ausfuehrbar.md` | **„Umzusetzen ist vorerst nichts" ist die häufigste Art, wie eine Regel verschwindet** — Gate 24 im Rechenkern, die Sperre vor dem Preisabgleich, weggelassene Artikel werden beim Bauen genannt |
| `lagerhaus-drei-seiten-mehr.md` | **Der dritte falsche Schluss wurde nicht gezogen** — Quarzolith zeigt dasselbe Produkt als Sackware mit 20 % und lose auf Anfrage, was nach einem Prinzip aussieht und an den Schachtringen scheitert. Kanal 82 %, Schachtringe 53 %. **Gate 24 entschieden.** Dazu: das Inhaltsverzeichnis war immer lesbar — nur 21 der 72 Seiten betreffen den Shop |
| `dritter-lieferant-schachermayer.md` | **Ein Lieferant ist nicht dasselbe wie ein Sortiment** — eine Rechnung, eine Position, kein Baustoff. Der negative Befund ist die Antwort; wertvoller sind 2 % statt 3 % Skonto (dritter Lieferant), 17,90 € Fracht und die Anschrift, die Perg unabhängig bestätigt |
| `shop-auf-die-ware-gedreht.md` | **Eine Prüfung, die das Modell liest statt die Ausgabe, prüft die eigene Absicht** — 41 tote Verweise trotz grüner Verweisprüfung; dazu selbstgezeichnete Artikelschemata statt fremder Fotos, produktzuerst-Aufbau und die belegte Obergrenze des Katalogs (46 von 53 Artikelnummern, Rest sind Nebenkosten) |
| `interna-auf-der-kundenseite.md` | **Gehört das überhaupt auf diese Seite?** — die fünfte Frage der Prüfkette, die keinem der vier Prüfer gehörte. Rohmarge, Lieferantenskonto und Gate-Nummern standen auf der AGB-Kundenseite. `src/interna.js` prüft im Bau, Ausnahmen kosten einen begründeten Satz und lassen sich auf einzelne Muster eingrenzen |
| `widerrufe-maschinell.md` | **Ein Widerruf deckt nur seine eigene Aussage** — Register der fünf zurückgenommenen Thesen, `npm run pruefe-widerrufe` meldet jede Fundstelle ohne ihren eigenen Widerruf in Sichtweite (±8 Zeilen oder Kopfvermerk). Drei echte Funde, darunter der vierte Innkreis-Überlebende und eine seit dem 25.08. beantwortete Frage, die noch offen aussah |
| `verhandlungsziel-konditionen.md` | **Zehn Prozent Nachlass kosten 38,8 % Rabatt** — das Verhandlungsziel liegt über der Gate-2-Schwelle |
| `auswertungsbogen-hersteller.md` | **Genau 35 % Rabatt lassen 4,4 % Preisspielraum** — die Auswertung der zwölf Antworten steht fertig bereit |
| `empfindlichkeit-der-annahmen.md` | **Welche Annahme zuerst gemessen gehört** — die Rohmarge, Elastizität 1,75, als einzige mit Kipppunkt |
| `kostenbild-und-sessionbedarf.md` | **Von 34 % Mischmarge bleiben 22,5 %** — und der Sessionbedarf liegt bei 1.900–2.550, nicht bei 1.850 |
| `zahlwege-und-gebuehren.md` | **Zahlungsgebühren fehlten in der ganzen Rechnung** — 0 bis 16 % des Zielgewinns; Rechnungskauf entspricht der Zielgruppe und ist das Teuerste |
| `ablage-und-nummernkreis.md` | **Nummer erst bei der Ausstellung**, Ablage nur ergänzend; Nachnahme würde eine Registrierkasse auslösen |
| `uid-abfrage.md` | **Drei Zustände statt zwei** — ein Dienstausfall ist keine ungültige UID; Nachweis nur mit qualifizierter Anfrage |
| `trockenlauf-auftrag.md` | **Läuft die Kette ohne Zutun?** Zehn Schritte durchgezählt; zwei Blockaden, 13 Minuten je Bestellung |
| `beleg-und-reihengeschaeft.md` | **Gate 19** — Auslandslieferant macht das Streckengeschäft zum Reihengeschäft; § 11 UStG im Beleg |

### Analysen
| Datei | Kernaussage |
|---|---|
| `phase1-nischen.md` | Radonvorsorge gewählt; Brandschutz und Betoninstandsetzung verworfen |
| `phase2-lieferantenlandkarte.md` | 14 Hersteller kartiert; Empfängerkreis auf zwölf erweitert; Bahn muss 38 % Marge tragen |
| `phase3-unit-economics.md` | Drei Szenarien, Break-even 4.714 €, Zeithorizont 18–30 Monate |
| `phase3b-leadmodell.md` | Leadmodell durchgerechnet: Break-even bei 2–3 Leads; Gate 9 zweistufiges Erlösmodell |
| `phase4-sortiment-und-materialwert.md` | Stückliste, Warenkorb 650 €, 37 Bestellungen; Fracht als vierte Gate-2-Bedingung |
| `phase5-technik.md` | WordPress mit verwaltetem Hosting, weil ohne Neuaufbau erweiterbar |
| `phase6-automatisierung.md` | Vier-Wochen-Test; Gate 6 Produktdaten, Gate 7 reiner B2B-Shop |
| `phase7-inhalte-und-funnel.md` | Inhaltslandkarte, 500 € Landesförderung als Zugmagnet |
| `phase7b-messstrecke.md` | Messung ist kostenlos — Gate 10 Erinnerungsdienst; Sessionbedarf auf 2.550 korrigiert |
| `phase8-rechtsform-steuer.md` | GmbH, sobald anderes Einkommen besteht |
| `phase8-compliance.md` | Messung nur über anerkannte Stelle; FAGG-Fristfalle |
| `phase9-meilensteine-und-abbruch.md` | Fünf Stufen mit Kostendeckel, Kennzahlen und vier harten Abbruchregeln |
| `phase10-datengrundlage-gebietsabfrage.md` | Gebietsabfrage auf Gemeindeebene aus freiem Verordnungstext; Lizenzblocker gelöst |
| `marktrisiko-neubau.md` | Neubau −40 % in zehn Jahren; Gate 12 kehrt die Beweislast um |
| `partnerangebot-leadvermittlung.md` | Gate 13 Bezirke statt 104 Gemeinden; Exklusivität ist die DSGVO-Bauform |
| `messwert-einordnung.md` | Messdauer sechs Monate; Gate 14 — den Motor liefert der Keller, nicht Radon |
| `pruefung-gruppe-c.md` | Gate 15 — der Keller ist von Franchisesystemen besetzt; die zweite Freigabe wird entscheidend |
| `franchise-zeitfenster.md` | Gate 16 — ISOTEC gründet ab H2 2026 in Österreich; die Lücke ist eine Frist |
| `content-und-leadgen.md` | Displaywerbung und Affiliate scheitern an der Reichweite |
| `skalierung-und-passivitaet.md` | Bestandseffekt; digitale Vorlagen fallen durch |

**Läufe vom 28. August** — bis zum 29. waren diese Dateien nur im Fließtext
zusammengefasst und im Verzeichnis nicht auffindbar:

| Datei | Kernaussage |
|---|---|
| `spanne-nicht-mehr-ausgeben.md` | Weisung „keine spanne ausgeben" umgesetzt; alle drei Ausnahmen des Interna-Prüfers gelöscht, der Bau bricht bei Rückkehr der Zahl ab |
| `hundert-artikel-was-fehlt.md` | 46 sind das Maximum aus den Rechnungen; über hundert Artikel liegen bereit, es fehlen die Preise |
| `importweg-artikelliste.md` | `npm run preisliste` — der Weg vom Lieferantenexport in den Katalog, gebaut bevor die Liste da ist |
| `lastlauf-hundert-artikel.md` | 141 Artikel eingespielt: fünf Unit-Tests und zwei Proben schrieben den 46er-Bestand fest |
| `artikel-ohne-gruppe-sind-unauffindbar.md` | Ein Artikel ohne Warengruppe steht auf keiner Seite; der Bau bricht deshalb ab |
| `startklar-pruefung.md` | `npm run startklar` beantwortet „shop fertig?" aus den Daten, mit dem dritten Zustand „von hier aus nicht feststellbar" |
| `zusage-die-der-code-nicht-hielt.md` | Der Kommentar versprach, `betreiber.json` zu lesen; der Code setzte `null`. Jetzt liest er wirklich, mit `??` statt `\|\|` |
| `oberste-regel-war-ueberholt.md` | `PARAMETER.md` forderte noch 32 % Rohmarge und hätte das laufende Modell verworfen |
| `statusseite-zeigte-den-falschen-plan.md` | `STATUS.md` nannte noch die Freigaben des Radon-Modells |
| `dreiundzwanzig-hohle-stellen.md` | `pruefe-tests` meldete seit Tagen 23 Verdachtsfälle und lief als „grün" mit; sein eigener Parser las `test(name, options, fn)` falsch |
| `zwei-wege-zur-selben-zahl.md` | Kampagne und Veröffentlichung bauten Fracht und Deckungsbeitrag nach, statt den Rechenkern zu rufen |
| `ein-weg-zur-zahl.md` | Die Nachbauten sind weg — ein Weg zur Zahl |
| `erzeuger-loeschte-die-gewichte.md` | `npm run katalog` löschte die sieben belegten Gewichte, still, bei jedem Lauf |
| `eine-platte-mit-sechzig-zentimetern.md` | 600 mm Plattenbreite als Stärke gelesen; Plausibilitätsgrenze 300 mm, eine Quelle für Etikett und Zeichnung |
| `zustellung-steht-auf-der-artikelseite.md` | Zustellkosten auf der Artikelseite; der erste Entwurf verglich die Fracht mit dem Stückpreis und log damit |
| `meinten-sie.md` | Acht von neun Vertippern fanden nichts; Abstandsmaß statt Wortliste |
| `vorschlag-auch-im-suchfeld.md` | Der Vorschlag steht jetzt dort, wo getippt wird, nicht nur auf der Suchseite |
| `dem-verweis-folgen.md` | Die Proben lasen die Adresse des Verweises statt ihm zu folgen |
| `erste-echte-zahlen.md` | Die Lieferantenrechnungen sind gefunden — die Grundlage der ganzen Kalkulation (22.08.) |
| `google-kampagne.md` | Die Kampagne ist vollständig geplant und **nicht geschaltet** (22.08.) |

**Läufe vom 29. August** — die dreiundzwanzig Dokumente dieses Tages:

| Datei | Kernaussage |
|---|---|
| `gruppenvorschlag-nicht-gebaut.md` | Warengruppe aus der Bezeichnung raten: 0 von 16 auf zurückgehaltenen Daten. Nicht gebaut; am Liefertag die Gliederung des Lieferanten abbilden |
| `rahmen-fuer-jede-seite.md` | `npm run rahmenzensus` misst alle 81 gebauten Seiten im 390-px-Rahmen statt neun ausgesuchte; 81/81 in Ordnung |
| `anfrage-statt-wand.md` | Die Kasse erzeugt nach der Bezirkswahl die gerechnete, unverbindliche Anfrage zum Kopieren — der Weg, der ohne Zahlungsanbieter funktioniert |
| `was-hier-moeglich-ist.md` | Startseite, Kasse und `llms.txt` sagen aus den Daten, ob bestellt werden kann — der Satz kippt, wenn die Betreiberdatei vollständig wird |
| `status-hatte-eine-woche-verspaetung.md` | Dieses Dokument stellte noch Radon-Shop und Leadvermittlung gegenüber; 20 Arbeitsdateien waren hier nie genannt. `npm run pruefe-stand` hält den Abgleich |
| `kommentare-im-schaufenster.md` | Das ausgelieferte `shop.js` enthielt den Quelltext samt Kommentaren und darin die Kalkulationsregel; „Repository privat schalten" wäre wirkungslos gewesen. Jetzt entkommentiert, mit drittem Durchgang in `pruefe-geheimnis` |
| `dreimal-richtig-beschriftet.md` | „25 kg" je Kilogramm gegen „25 kg" je Sack: 2,77 € gegen 14,32 €, der teurere sah fünfmal billiger aus. Beide Preise stehen jetzt nebeneinander, dazu die Tafel „Was ein Kilogramm kostet" |
| `ein-kilogramm-von-einem-sack.md` | Der Knopf legte **ein Kilogramm** eines 25-kg-Gebindes in den Korb — eine Menge, die es nicht gibt. Mengenfeld und Warenkorb zählen jetzt in Gebinden und runden auf |
| `ganze-quadratmeter-gibt-es-nicht.md` | Der Korb ließ nur ganze Mengen zu — bei einer Platte zu 0,75 m² sind das ausschließlich die unlieferbaren. `istMenge()` erlaubt jetzt zwei Nachkommastellen; 15 von 46 Artikeln haben einen Gebindeschritt |
| `dreissig-komma-zwei-fuenf-stueck.md` | Wer sonst nahm ganze Mengen an? Der Korbzähler summierte Stück, m² und kg zu „30.25", der Anfragetext schrieb „5.25 M2". Beides war älter als die Gebindemengen und nur unauffällig |
| `ein-preis-fuer-nichts.md` | Der Feed nannte 5,23 € je m² für eine Platte, die es nur zu 0,75 m² gibt. Jetzt mit Bezugsgröße und Mindestmenge nach schema.org — und die Artikelseite zeichnet nicht mehr getrennt aus |
| `dieselbe-halbe-auskunft-an-drei-stellen.md` | Dieselbe Lücke stand noch in `llms.txt` und auf der Artikelkarte. Ein Assistent hätte „10,69 €" geantwortet, die Rechnung lautet über 92,36 € |
| `vier-ausgaben-ein-preis.md` | `npm run pruefe-preise` hält Preistafel, JSON-LD, Karte und `llms.txt` gegeneinander — und fand im ersten Lauf drei Artikelseiten, denen ich eine Stunde zuvor das JSON-LD genommen hatte |
| `eine-schwelle-die-niemand-bestellen-kann.md` | „Ab 16 m² übersteigt die Ware die Zustellung" — bei einer Platte zu 0,75 m². Jede genannte Menge ist jetzt ein Vielfaches der Gebindegröße, und der Preisabgleich prüft es |
| `siebzehn-module-fuhren-mit.md` | Das ausgelieferte `shop.js` trug alle 22 Kernmodule; die Oberfläche benutzt fünf. 202 → 117 KB, und Kostenbild, Skonto und Margenregel bleiben im Betrieb |
| `die-falsche-zahl-fast-optimiert.md` | Die Zeichnungen sind 39 KB roh und **2,4 KB gezippt** — der Eingriff unterbleibt. Nebenbei: Die Bündelverschlankung brachte 72 % statt der notierten 60 % |
| `acht-zentimeter-sind-achtzig-millimeter.md` | „xps 8 cm" fand nichts, „eps 5 cm" schon — der Katalog schreibt die eine Gruppe in cm, die andere in mm. Beide Maße jetzt auf einen Stamm; 78 Baustellenwörter gemessen, 11 aufgenommen, 18 begründet abgelehnt |
| `was-wir-nicht-fuehren-steht-jetzt-da.md` | Die 23 begründeten Ablehnungen lagen ungenutzt im Repository. Jede trägt jetzt zwei Texte — `warum` für den nächsten Lauf, `antwort` für den Kunden auf der Suchseite |
| `dieselbe-frage-zwei-kanaele.md` | Dieselbe Frage kommt über Suchfeld und `llms.txt`. Der Abschnitt „Was wir nicht führen" steht jetzt auch dort — ohne ihn antwortet ein Assistent wahrscheinlich „ja" |
| `die-schrift-kam-von-google.md` | Jede Seite lud drei Schriften von `fonts.googleapis.com` und gab dabei die IP jedes Besuchers weiter (LG München I, 3 O 17493/20). Einbindung entfernt, Wächter gebaut, Datenschutzseite um den technischen Befund ergänzt |
| `vier-farbpaare-zu-schwach.md` | Zensus über 81 Seiten: `lang`, Überschriftenfolge, `alt`, Beschriftungen — null Befunde. Der Kontrast dagegen lag bei fünf Paaren des hellen Anstrichs unter WCAG 2.1, darunter Verweisfarbe und Knopfschrift |
| `der-fokus-blieb-stehen.md` | Die Artikelkarte sah mit Fokus aus wie ohne — die Zierlinie des Rasters überschrieb den Fokusring. Dazu ein Sprungverweis an der Kopfleiste vorbei |
| `ohne-javascript-ein-totes-suchfeld.md` | Der Inhalt braucht kein Skript (Artikelseite 4.000 Zeichen ohne), aber 79 Seiten trugen ein totes Bedienelement ohne ein Wort dazu. Nebenwirkung: `pruefe-seiten` deckt jetzt 81 von 81 Seiten |

**Lauf vom 30. August:**

| Datei | Kernaussage |
|---|---|
| `robots-erlaubte-das-gegenteil.md` | Die ausgelieferte `robots.txt` erlaubte GPTBot, ClaudeBot und CCBot genau das, was die Entscheidung ausschließt — zwei Wege zur selben Datei, und der kürzere gewann |
| `eine-llms-txt-nicht-zwei.md` | Dieselbe Frage an die Nachbardatei: Die `llms.txt` des Veröffentlichungswerkzeugs war 149 Bytes lang, die gebaute 15.687 — `seiten: []` ließ genau die Abschnitte weg, für die der Shop gebaut ist. Veröffentlicht wird jetzt, was der Bau erzeugt; fehlt er, bricht das Werkzeug ab |
| `der-kunde-tippt-den-plural.md` | 31 von 35 Wortpaaren verloren beim Wechsel in die Mehrzahl **jeden** Treffer — „schornsteine", „abflussrohre", „spachtelmassen": null. Ein Wortstamm je Wort behebt es; von drei eingebauten Sperren hat die Gegenprobe zwei widerlegt, und zwei Registereinträge sind dadurch entfallen |
| `das-skript-starb-beim-laden.md` | Beim Nachmessen aufgefallen: Das Skript der Demoseite starb beim Laden — `rechtstexte.js` liest seit dem 29.08. den Warenkorbschlüssel aus `shopkern.js`, stand im Bündel aber elf Plätze davor. Niemand merkte es, weil die Probe eine `demo.html` vom 28.08. las. Reihenfolge wird jetzt gerechnet, beide Browserproben lehnen veraltete Erzeugnisse ab |
| `die-startseite-sprang-ins-leere.md` | Der gestern eingebaute Sprungverweis hatte auf 80 von 81 Seiten ein Ziel — nicht auf der Startseite, weil der Anker an die Brotkrume gehängt war. Derselbe Zensus: `warenkorb`, `kasse` und `suche` tragen 43, 53 und 214 Zeichen eigenen Inhalt und standen in der Sitemap; sie tragen jetzt `noindex,follow` |
| `sieben-positionen-von-zehn.md` | Zwei Systemseiten zählten im eigenen Antwortsatz falsch — „Sieben Positionen" über einer Tabelle mit zehn Zeilen, „vier" über sieben. Die fehlenden waren fast genau die, die in der Tabelle als „wird oft vergessen" markiert sind, und der Satz steht in Meta-Beschreibung, JSON-LD-Antwort und `llms.txt`. `pruefe-inhalte` zählt jetzt mit |
| `was-die-gruppenseite-verspricht.md` | „bogen" fand nichts, obwohl der Shop zwei Kanalbögen führt — der Wortstamm vom Vortag stutzte das Kompositum, nicht die Frage. Dazu: Fünf Gruppenseiten versprachen Ware, die die Gruppe nicht führt (Mauermörtel, Planziegel, Anschlussformteil, Dübel, Trennlage), und acht Wörter der eigenen Positionslisten fanden im eigenen Katalog nichts |
| `fuenf-positionen-ohne-hinweis.md` | Zensus über alle 35 Positionen der vier Systemlisten: sieben ohne Artikel, fünf davon ohne Hinweis — vier mit der Markierung „wird oft vergessen". Bei Übergangsstücken und Gleitmittel stand die Entscheidung längst im Register unter „nicht aufgenommen". Alle gekennzeichnet; die Probe prüft jetzt beide Richtungen |
| `eine-anleitung-ohne-schritte.md` | Die vier Systemseiten trugen `HowTo` ohne einen einzigen `step`, und alle 24 Inhaltsseiten hängten ihre Frage als `mainEntity` an ein `Article` — eine Form, die kein Leser als Frage-Antwort erkennt. Jetzt `FAQPage` mit Fragenliste, und die Positionslisten stehen als `ItemList` samt Vermerk „nicht im Sortiment" |
| `das-liefergebiet-war-ein-satz.md` | `areaServed` stand fest im Quelltext der Startseite — neben der Entscheidung in `LIEFERGEBIET`, und schon in abweichender Reihenfolge. Dazu als Zeichenkette statt als Ort. Jetzt benannte `AdministrativeArea`-Knoten aus der Entscheidung, geprüft an 47 Auszeichnungen |
| `vierzig-prozent-waren-neununddreissig.md` | „40 % unter Listenpreis" bei gerechneten 39,80 %: `Math.round` rundete den Preisvorteil auf, bei 21 von 39 Artikeln mit Marker. Ein Werbeversprechen wird abgerundet. Die Zahl entstand an drei Stellen — jetzt ruft der Seitenbau `vorteil()` |
| `drei-steuersaetze-und-ein-abgleich.md` | Der Steuersatz steht an drei Stellen — und zwei davon mit Grund: Das Kontrollwerkzeug darf seine Vergleichsgröße nicht vom Geprüften holen. Der erste Griff (Import) war falsch und ist zurückgenommen; was fehlte, war nicht die Vereinheitlichung, sondern der Abgleich. Dazu „20 % USt" als Zeichenkette neben einer Zahl, die niemand danebenhielt |
| `der-name-klebte-an-der-nummer.md` | Im Anfragetext — dem einzigen Weg, auf dem heute eine Bestellung zustande kommt — lief bei 12 der 46 Artikel der Name ohne Leerzeichen in die Artikelnummer. Die Spalte füllte nur kurzen Text auf. Jetzt Mindestabstand plus Umbruch an Wortgrenzen, damit die Summenspalte gerade bleibt |
| `zwei-lieferungen-eine-zeile.md` | Ein Korb aus zwei Lieferantensortimenten ergibt zwei Anfahrten — der Anfragetext nannte eine Zeile „Zustellung", die Oberfläche den Frachtgrund der **ersten** Teillieferung neben der Summe aller. Heute unauffällig, scharf am Tag der Artikelliste. Jetzt je Lieferung ein Block, mit Nummer statt Lieferantenname |
| `das-werkzeug-fuer-den-tag-danach.md` | `npm run import` — das Werkzeug für den Tag der Artikelliste — schrieb in den Platzhalterbestand des abgelösten Modells, warnte gegen eine abgelöste Margenregel bei **jeder** Zeile und hätte Einkaufspreise in ein öffentliches Verzeichnis getragen. Schreiben gesperrt, Probelauf bleibt |
| `eine-haelfte-umgelenkt.md` | `npm run katalog` las eine Artikelliste als „0 Artikel" mit Ausgang 0; der Gewichtswächter rettete den Katalog aus dem falschen Grund. Beim Gegenproben habe ich mit einem falschen Umgebungsnamen die vertrauliche Preisdatei geleert — wiederhergestellt in einem Befehl, weil sie abgeleitet und nicht gepflegt wird. Drei neue Sperren |
| `das-netz-unter-den-gepflegten-dateien.md` | Der offene Punkt umgesetzt: `src/sicherung.js` legt vor jedem Überschreiben eine datierte Kopie an, `npm run sicherung` sichert alle sieben Dateien unter `preise/`. Zehn Stände je Datei; der Aufräumer fasst nur an, was er selbst angelegt hat. Der eigene Test fand dabei zwei Begriffe für „Stand dieser Datei" |
| `die-liste-die-noch-nicht-da-ist.md` | `npm run artikelliste` liest die Artikelliste im angeforderten Format und schreibt Katalog und Konditionen getrennt. Es entscheidet nichts, was eine Entscheidung ist: Warengruppe, Preisstand und Einheit werden verlangt, nicht geraten; Wegfall wird gemeldet, nicht vollzogen |
| `zwanzig-zeilen-statt-dreihundert.md` | Die Liste des Lieferanten wird seine Sparten tragen, nicht unsere sieben Gruppen. `data/sparten.json` ordnet sie einmal zu; unzugeordnete Sparten meldet das Werkzeug gebündelt und nach Artikelzahl geordnet, in der Form, in der sie in die Tabelle gehören |
| `die-rolle-die-ein-rohr-war.md` | Formerkennung der Artikelzeichnungen an 40 fremden Namen gemessen: 2 falsche Zeichnungen. „X mit Y" ist ein X (der Eckwinkel war eine Rolle), und die Einheit schlägt den Namen, wo sie eindeutig ist (50 m Drainagerohr sind ein Ring). Danach 0 falsche, Bestandsverteilung unverändert |
| `generalprobe-mit-hundertzweiundsiebzig.md` | Der ganze Liefertag im Sandkasten durchgespielt: 126 erfundene Zeilen eingelesen, 172 Artikel, 207 Seiten, alle Prüfer grün — und drei Tests, die am Bestand von 46 hingen und am Liefertag gefeuert hätten. Eine Probe, die den Bestand misst, ist eine Zeitbombe mit bekanntem Zünddatum |
| `zwei-margen-ein-wort.md` | `MARGENUNTERGRENZE = 0,32` sah nach einer abgelösten Regel aus: kein einziger der 46 Artikel erreicht sie. Gemessen — der Median liegt auf genau 25,00 %, weil der Shop mit 25 % kalkuliert, und die Konditionen des Lieferanten liegen im Median bei 45 %. Verdacht zurückgezogen; falsch war der Dateikopf, der noch „Gate 1“ behauptete |
| `der-pruefer-der-sich-weigerte.md` | `pruefe-pruefer` meldete eine abgebrochene Probe als „keine Mengenangabe" und verdeckte damit die Antwort, die vier Zeilen höher stand. Der Abbruchgrund stand auf stderr, das an das Terminal vererbt statt gereicht wurde. Urteil nach `src/prueferurteil.js` herausgezogen — das Werkzeug, das die Prüfer prüft, hatte selbst keine Probe |
| `null-werktage.md` | Die Auftragsbestätigung sagte für jede echte Bestellung „Vollständig auf der Baustelle: nach 0 Werktagen" zu — `?? 0` machte aus der unbekannten Lieferzeit des einzigen liefernden Lieferanten den optimistischsten Wert, auf dem Dokument, mit dem der Vertrag zustande kommt. Keine Probe konnte es sehen: Sie rechnen auf dem Altkatalog, dessen Lieferanten alle eine Zahl tragen |
| `vier-meter-leiste.md` | Nachgang zum Befund über die Proben: Zwei Artikel werden je laufendem Meter fakturiert und kommen nur in Stangen zu 2,55 m — das Mengenfeld bot beliebige Meter an. Stehen geblieben, weil der Altkatalog, auf dem dreizehn Testdateien rechnen, keine Einheit `LFM` kennt. `GEBINDELESER` löst das Literal `['KG','M2']` in der Probe ab |
| `eine-einheit-vier-woerter.md` | Der Gebindeschritt für Längenware machte sichtbar, dass drei Stellen `einheit === 'KG' ? 'kg' : 'm²'` selbst gebaut hatten: Der Warenkorb nannte „2 Einheiten zu 2,55 m²" für eine Leiste, die Artikelseite widersprach sich in zwölf Wörtern. Ursache war der Ort — die Zuordnung stand in einem Bauwerkzeug; jetzt in `src/format.js`, auch für die Belege, die dem Kunden bis dahin „SCK" statt „Sack" zeigten |
| `null-kilo.md` | Dritter Fund derselben Form in drei Tagen: `gewichtKg: gewicht ?? 0` machte aus „unbekannt" null Kilogramm — und weil 0 eine Zahl ist, galt die Position als belegt, der Warenkorb sagte „aus den Lieferscheinen" statt „ohne belegtes Gewicht". Danach alle 22 Nullen in `src/` durchgesehen: eine Fundstelle, der Rest begründet in Ordnung |
| `durchsicht-mit-einem-fund.md` | Statt auf einen vierten Einzelbefund zu warten: alle 46 Artikel durch jeden Erzeuger geschickt und die Ausgabe auf Spuren unbehandelter Lücken abgesucht. Belege, Anfragetext und 81 Seiten sauber; `katalogFeed` trug 43-mal `priceValidUntil: null`. `bin/website.mjs` wusste das und berichtigte es beim Abnehmer — bei einem von zweien. Jetzt an der Quelle |
| `der-zweig-den-niemand-betrat.md` | `bin/veroeffentlichung.mjs` fällt ohne Preisdatei auf den Platzhalterkatalog zurück — der Zustand **jeder frischen Arbeitskopie**, weil `preise/` außerhalb des Repositories liegt, und trotzdem der einzige ungeprüfte Zweig: Alle zehn Testfälle liefen in der einen Lage, in der er nicht greift. Zusage hält; nebenbei rechnete der Rückfall noch mit der abgelösten Marge von 35 % |
| `ein-anker-ist-kein-bereich.md` | Acht bauliche Zusicherungen über alle 81 Seiten gemessen; sieben erfüllt, eine auf keiner Seite: Es gab kein `<main>`. Das Sprungziel war ein leeres `div` — ein Punkt statt eines Bereichs, ohne Landmarkennavigation und ohne Abgrenzung für die Textauszieher, für die dieser Shop gebaut ist. Dabei kam heraus, dass beide Wachen in `sprungziel` von keiner Probe auslösbar waren |
| `wachen-ohne-probe.md` | Zweimal hintereinander war eine Wache nicht auslösbar, also einmal durchgezählt. Der Griff über die Fehlertexte meldete 70 von 76 ungeprüft und maß das Falsche; der Deckungslauf nennt **fünf**. Vier davon sind das ungeprüfte Geschwister einer längst geprüften Wache — darunter die Namenskollision im Bündel, die schon einmal zugeschlagen hat |
| `drei-zusagen-ohne-fall.md` | Der Deckungslauf weiter benutzt, aber nicht auf die Prozentzahl gerichtet: In den Lücken standen drei Zusagen ohne Fall — die Stückliste, die stumm kürzt (zwei Stellen, die Leitposition eigens), die Lieferung ins Ausland und zwei Sperren vor der Rechnung. Eine davon hatte ich beim ersten Anlauf verwechselt: Der Deckungslauf nennt die Zeile, nicht den Grund |
| `der-pruefer-der-nie-etwas-fand.md` | Eine der Deckungslücken aufgeschlagen statt abgearbeitet: In `kontrolle.js` — der zweiten, absichtlich anders gebauten Rechnung — waren sieben Zweige unerreicht, und **alle sieben sind Fundmeldungen**. Bei vieren war jeweils die auffälligere Schwester geprüft und die leisere nicht: umgelenkte Adresse ja, fehlende nein |
| `pruefung-die-sich-selbst-recht-gibt.md` | Zweiter Prüfer, dieselbe Frage: `abgleich.js` warnt im eigenen Dateikopf davor, dass „eine Prüfung eine Erklärung mit sich selbst vergleicht und immer aufgeht" — und tat genau das. Für die Ziele war vorgesorgt, für die Tafeln nicht; acht Mängelmeldungen plus eine DSGVO-Deckungslücke waren unerreichbar. Die halbe Vorkehrung ist die gefährlichere |
| `weg-zum-ersten-verkauf.md` | **Weisung 31.08.: erster Verkauf mit 25 % Marge, über Shop und Werbung.** Die Marge hält (drei Warenkörbe durchgerechnet, alle 25,0 %); was fehlt, ist der Weg zum Kunden. Sieben Glieder bis zur ersten Anzeige, davon drei kostenlos. Neues Glied: 43 Artikel ohne GTIN — ohne Kennungen kein Feed, ohne Feed keine Shopping-Anzeigen. Entschieden: erster Anlauf nur auf Kamin und Dämmung |
| `kennung-die-niemand-nachgerechnet-hat.md` | Am kritischen Pfad zum Werbeweg: `istGtin()` prüft die Prüfziffer beim Einlesen, eine falsche Kennung hält die Zeile an statt zu warnen — sie kann eine andere Ware bezeichnen. Gegen 3000 erzeugte Fälle geprüft; dabei fielen zwei **erfundene** Platzhalter der eigenen Testdatei durch. Beim Gegenproben zeigte sich, dass `Number(' ')` null ist: Eine Kennung mit Leerstelle ginge ohne Ziffernprüfung durch |
| `bauversand-com.md` | **Weisung 31.08.: Domain `bauversand.com` bei All-Inkl.** Eingetragen in `data/betreiber.json`, wo Firma und Anschrift stehen. Dabei kam heraus, dass die Adresse doppelt verdrahtet war — auch in `kampagne.mjs` als finale URL der Anzeigen, das teuerste aller Duplikate: eine Anzeige mit toter Ziel-URL kostet den Klick und liefert eine Fehlerseite |
| `muehlviertel-ist-nicht-das-liefergebiet.md` | Vier von sechs Anzeigen warben „im Mühlviertel" — das umfasst Rohrbach, wo nicht geliefert wird, und lässt Linz und Linz-Land aus, die dazugehören. Kamin, die ertragreichste Gruppe, trug gar keine Ortsangabe. Bezahlte Klicks, die in der Kasse abgelehnt werden: dieselbe Verschwendung wie eine tote Ziel-URL. Ortsangabe wird jetzt aus `LIEFERGEBIET` erzeugt |
| `zehn-euro-durch-sechs.md` | Das Werkzeug streute zehn Euro Tagesbudget über sechs Gruppen — 1,67 € je Gruppe, bei 1 € Klickpreis 50 Klicks im Monat, also 0,5 Bestellungen bei 1 % Kaufquote. Im erwarteten Fall bringt **keine einzige Gruppe** einen Verkauf, und aus 50 Klicks ohne Bestellung lässt sich die Quote auch nicht schätzen. Konzentriert auf die drei tragenden Gruppen; die aus den Parametern abgeleitete Schwelle korrigiert dabei meine eigene Vorabfestlegung von zwei auf drei |
| `anzeigen-die-ins-leere-zeigten.md` | Alle drei Anzeigen des ersten Anlaufs zeigten auf Seiten, die es nicht gibt: Die Ziel-URL war der Google-**Anzeigepfad** — Zierwerk, das unter der Adresse eingeblendet wird. Jeder bezahlte Klick wäre auf einer Fehlerseite gelandet. Dritter Fund derselben Familie an einem Tag; `GRUPPENSEITE` liegt jetzt bei den Warengruppen, und die Probe **schlägt die Datei nach**, statt Zeichenketten zu vergleichen |
| `ab-lager-ohne-lager.md` | Nicht mehr wohin die Anzeige führt, sondern was sie behauptet: „XPS und EPS **ab Lager**" — bei einem Betrieb, dessen tragende Entscheidung „reines Streckengeschäft, kein eigenes Warenlager" ist. Im Baustoffhandel eine Terminzusage, nach der ein Bauleiter plant. Dazu eine abgeschnittene Überschrift („Vom Baumeister, nicht vom") — derselbe Fehler, den das Werkzeug bei Keywords längst verhindert. Nachtrag: Die 81 Seiten sind sauber, und `BETRIEBSAUSSAGEN` in `inhaltspruefung.js` hält sie es — getrennt von den `GRENZWOERTER`, weil „ab Lager“ für einen Händler **mit** Lager wahr ist; Verneinungen schlagen nicht an |
| `sechs-tage-im-warenkorb.md` | `shop-ui.js` war die einzige große Quelldatei, die ich heute nicht gelesen hatte — und die einzige, die **im Browser des Kunden läuft**. Im Warenkorb stand dort der am 27.08. zurückgenommene Satz über die Fracht auf jedem Beleg, **sechs Tage länger als überall sonst**. Zwei Lücken hintereinander, beide meine: Die Datei liegt im Wurzelverzeichnis und fiel durch alle vier Bestände; und nach der Aufnahme meldete der Prüfer trotzdem nichts, weil sein Muster „auf jedem **Beleg**" kannte und die Oberfläche „auf jedem unserer **Lieferantenbelege**" sagt. Ein Muster, das eine Formulierung kennt, prüft die Formulierung und nicht die Aussage. Bestand jetzt 348 Dateien statt 219 am Morgen des 31.08. |
| `der-erste-satz-war-zwei-modelle-alt.md` | `README.md` ist die Datei, die ein Leser zuerst öffnet — ihr Kopf warnte vor Überholtem und war **selbst überholt**: Er nannte 32 % als gültige Margenschwelle, und 32 % war Gate 1, gegenstandslos seit dem 22.08. Ein Vermerk, der vor Überholtem warnt und selbst überholt ist, ist schlimmer als keiner. Kopf berichtigt samt Wegweiser auf `PARAMETER.md`, `STATUS.md`, `offenepunkte`, Risikoliste und Weg zum ersten Verkauf; der Rumpf bleibt unangetastet. Nachgezählt: 32 % steht sonst überall mit Marker daneben, und 320 von 327 Verweisen in der Akte lösen auf — die sieben Ausreißer sind falsche Treffer der Suche, daraus wurde bewusst **kein** Prüfwerkzeug |
| `die-drei-groessten-risiken.md` | Das erste Ergebnis des Ursprungsauftrags verlangt „Empfehlung und die drei größten Risiken"; der Auftragsabgleich hat festgehalten, dass genau die fehlten. Nachgetragen, jede Zahl gemessen: **(1) Die Kaufquote entscheidet alles** — unter **0,77 %** kann sich das Modell nicht einmal den billigsten Marktklick (0,50 €) leisten, gerechnet mit 2 %, Faktor 2,6 dazwischen. **(2) Der Markt ist vielleicht zu klein** und niemand hat nachgesehen, obwohl es nichts kostet. **(3) Die Rohmarge ist der empfindlichste Hebel** (Elastizität 2,24) und die Preisbasis altert bereits. Empfehlung: die beiden kostenlosen Auskünfte zuerst — sie rechtfertigen den teuren Versuch oder stoppen ihn vorher |
| `zwoelf-ergebnisse-null-treffer.md` | Der Ursprungsauftrag nennt **zwölf Ergebnisse**, acht mit Dateinamen — **kein einziger existiert.** 237 Dokumente, ein Funktionsmuster, über tausend Testfälle, und niemand hat je nachgezählt, ob das Gelieferte dem Bestellten entspricht. `npm run pruefe-auftrag` liest die Liste **aus dem Auftrag** und hält sie gegen `auftragszuordnung.json`: **0 erfüllt, 8 unter anderem Namen, 4 offen** — darunter die Wettbewerbspreise, die nie erhoben wurden. Kein einziges Tabellenblatt, kein Textdokument: eine benannte Abweichung statt einer stillschweigenden. `ohne-zuordnung` ist der eigentliche Zweck — eine unbeantwortete Anforderung fällt niemandem auf |
| `rechnung-ueber-bereits-gezahltes-geld.md` | Die erzeugte Rechnung von oben nach unten gelesen — als Kunde, nicht als Testfall. Sie nannte **1.638,48 € Gesamtbetrag** und schwieg darüber, ob dieses Geld noch zu zahlen ist. Nach Punkt 9 der eigenen AGB ist es das nie: Zahlungsziel null Tage, alle drei angebotenen Zahlwege Vorkasse, und die Rechnung steht im Ablauf an **Position zehn** — nach der Lieferung. Eine Rechnung, die einen Betrag nennt und über seinen Zustand schweigt, ist eine Zahlungsaufforderung, und die Buchhaltung des Kunden zahlt ein zweites Mal. Der Fehler geht dabei **zugunsten** des Shops, also merkt ihn sonst niemand. Vermerk auf der Rechnung, Zahlungsbedingung auf dem Angebot, Zahlungshinweis auf der Auftragsbestätigung, alle drei aus `ZAHLUNGSBEDINGUNGEN.zielTage` gespeist. Gefunden hat es kein Prüfer, weil keiner je einen **fertigen** Beleg gelesen hatte — `npm run pruefe-belege` baut jetzt vier Kundendokumente aus echten Daten und liest den Text, der im Umschlag landet, mit Widerrufssichtweite **null** |
| `ansprechpartner-vor-ort-doppelpunkt.md` | Der Bestelltext an den **Lieferanten** — kein Kundendokument, und genau deshalb nie gelesen. Ohne Telefonnummer ging er hinaus mit der Zeile `Ansprechpartner vor Ort:` und nichts dahinter: Der Disponent liest das nicht als *fehlt noch*, sondern als *gibt es nicht*, der LKW fährt, findet eine verschlossene Baustelle, die Ware geht auf Kosten des Bestellers retour. Ohne Absenderfirma endete der Brief nach „Mit freundlichen Grüßen" — beim Lieferanten keinem Konto zuordenbar. Und der Termin, den die Auftragsbestätigung dem Kunden zusagt, war beim Lieferanten **nie bestellt**. Die Lückenmarkierung aus `beleg.js` (30.08.) gilt jetzt auch hier; `darfAutomatischAusgeloestWerden` schützte fünfmal das Geld und kein einziges Mal die Zustellung. Der Fixture-Auftrag „eine gesunde Bestellung passiert alle Sperren" fiel durch — er war nie gesund, es hatte ihn nur nie jemand gefragt. Dritte Regel im Belegprüfer: eine Beschriftung ohne Wert, erkannt an der Einrückung statt an einer Namensliste |
| `der-pruefer-las-den-falschen-katalog.md` | Der am Vormittag gebaute Belegprüfer las `data/artikel.json` — den **Radonkatalog mit neun Platzhalterartikeln** — und schrieb „Belege geprüft: 5" darunter, ohne zu sagen, woraus. Die Preisdatei des echten 46-Artikel-Katalogs lag die ganze Zeit an ihrem Platz; `veroeffentlichung.mjs` macht es seit 31.08. richtig. Mit dem echten Katalog kam der nächste Fehler sofort: zwei Zuschnitte Fassadendämmung, **43,37 € Ware gegen 90,50 € Fracht** — ein Gate-20-Verstoß, der nie hinausgeht; nach Preis sortiert dann 5.362 €, das Achtfache. Der Warenkorb wird jetzt auf `warenkorbNetto` aus `zielgroessen.json` gebaut (677,89 €), die Betreiberdaten kommen aus `betreiber.json` samt ihrer Lücken, und `darfAutomatischAusgeloestWerden` steht als Auskunft daneben: **ein einziger offener Punkt** sperrt die ganze Strecke, die Lieferzeit des Lieferanten. Dazu der Mailknopf endlich gemessen — ab **drei Positionen (47 € Warenwert)** ist er weg, der Bezugswarenkorb hat elf; vier Proben halten die Schwelle und verbieten, `MAILTO_HOECHSTLAENGE` über 2000 zu heben |
| `rollout-90-tage.md` | **Das erste von zwölf Ergebnissen des Ursprungsauftrags, das unter dem verlangten Namen erfüllt ist.** Es stand als offen mit der Begründung, eine Zeitachse hänge am Uploaddatum des Auftraggebers — das stimmt für einen Kalender und ist falsch für einen Plan: Nicht „Woche 3", sondern „Tag N nach der Freigabe, die davor liegt". `npm run rollout` rechnet elf Etappen mit Abhängigkeiten, Dauern und Gate-Bezug. Ergebnis im Hauptfall: **57 Tage bis zur Entscheidung, davon 45 der Klickversuch, 10 Warten auf Dritte und zwei Tage eigene Arbeit** im bestimmenden Strang (Rechtstexte → Upload → Anzeigen → Versuch). Der Versuch ist die längste Etappe, davor liegt fast nur Warten — wer den Termin halten will, verkürzt keine Arbeit, er löst früher aus. Und die Frist trägt nicht alles: 1 % Kaufquote ist bei jedem Marktklickpreis ausschließbar, 0,5 % nur am unteren Marktrand. Neunzig Tage reichen, um das Modell zu widerlegen, nicht um es knapp zu retten |
| `neun-striche-und-ein-kreuz.md` | **Zweites erfülltes Ergebnis: das KPI-Dashboard.** Es galt als offen, weil „ein Dashboard ohne Daten ein Rahmen ist, der Betrieb vortäuscht" — der Einwand trifft die vorgetäuschte Fassung mit Kurven bei null, nicht die Sache: Was eine solche Seite **vor** dem Start leisten kann, ist das Festlegen der Schwellen, bevor man die Zahlen kennt; danach ließen sie sich verschieben. `npm run kennzahlen` erzeugt zehn Kennzahlen in drei Abschnitten, jede mit Ist, Schwelle, **Herkunft der Schwelle** und der Entscheidung, die daran hängt — keine Schwelle hier gerechnet, jede aus dem Modul, das sie verantwortet. Heute: **1 von 10 gemessen, neun Striche und ein Kreuz** (15 offene Punkte gegen eine Schwelle von 0). Zwei eigene Fehler dabei, beide von der Sorte, gegen die die Seite geschrieben ist: eine leere Erhebung ergab eine **makellose Nullbilanz mit Haken** (eine Null ist ein Messergebnis, ein Strich ist keines), und die offenen Punkte wurden hier neu zusammengesetzt und ergaben **2 statt 15** — gezählt waren die Gruppen. Wettbewerbspreise erneut geprüft: der Netzausgang antwortet auf bauhaus.at, obi.at, hornbach.at, lagerhaus.at und quester.at mit 403 |
| `die-leitzahl-war-vom-falschen-zahlweg.md` | Die Kennzahlenseite rechnete **43.396 €** nötigen Monatsumsatz, überall in der Akte stehen **45.356 €**. Beide gerechnet, beide richtig — für verschiedene Zahlwege: Die 45.356 sind die **Kartenzahl vom 25.08.**, zwei Tage bevor Gate 21 EPS und Vorkasse entschied. Die Leitzahl des Geschäftsmodells ist zwei Tage älter als die Entscheidung, die sie bestimmt; sie war nie falsch, sie **wurde** es. Niemandem aufgefallen, weil sie plausibel war, in die **vorsichtige** Richtung ging (der wahre Bedarf liegt 1.960 € und drei Bestellungen niedriger — der erste Befund dieser Reihe, der nicht optimistisch war) — und weil `pruefe-schaufenster` vierundzwanzig Kennzahlen misst: Seiten, Testfälle, Gebote, GTIN-Lücken, **nicht die Zahl, um die es geht**. Ein Prüfer, der alles misst außer der Leitzahl, meldet grün über ein Geschäftsmodell, das er nie angesehen hat. Jetzt 26 Kennzahlen, gemessen auf ganze Euro, weil die Beschreibung ganze Euro nennt. PARAMETER.md, PR-Beschreibung und `marge-25-prozent.md` berichtigt — letzteres behält seine Kartentabelle mit Nachtrag: Eine richtige Rechnung wird nicht falsch, wenn die Voraussetzung wechselt, sie wird zur Rechnung von vorgestern |
| `eine-zahl-in-acht-dokumenten.md` | Antwort auf die Frage vom Vortag: **45.356 € stand nach der Berichtigung immer noch an 28 Stellen.** `npm run pruefe-leitzahlen` trennt jetzt Zitat von Behauptung — eine abgelöste Zahl darf stehen, wenn ihre **Bedingung danebensteht**. Der erste Lauf deckte **102 von 103** Fundstellen: Die Bedingung war gemeinsam und weit (`alte`, `damals`, `Stand`), also traf sie alles — ein Prüfer, dessen Freibrief überall gilt, meldet grün und hat nichts angesehen. Eng gefasst je abgelöstem Wert: **17 echte Meldungen in acht Dateien**, darunter zwei Lieferstücke — `zuschlag-seite.html` (die von der PR als *gültig* bezeichnete Seite) **entscheidet EPS und rechnet mit Karte**. Der eigentliche Ertrag sind aber **zwei Gegenproben, die ins Leere liefen**: Die alte Zahl neben der eigenen Berichtigung galt als gedeckt, und die bloße Anwesenheit der gültigen reichte der zweiten Regel. Erst die dritte greift — im Leitdokument muss die gültige Zahl **vor** jeder abgelösten stehen. Sofortfund: Die **0,77 %** am Marktboden, das erste der drei größten Risiken, kamen in **keinem** der beiden Leitdokumente vor |
| `drei-pruefer-die-nie-rot-werden-konnten.md` | `npm run gegenproben`: ein Register, das je Prüfer eine Mutation führt, die ihn rot machen **muss** — vier Zusicherungen je Eintrag (vorher grün, Mutation angekommen, rot an der erwarteten Stelle, danach wieder grün). Der erste Lauf fand sofort: **`pruefe-inhalte` fand eine verbotene Erfolgszusage, meldete sie vollständig — und endete mit Rückgabewert 0.** Damit stand er in jeder Prüferschleife auf „OK", die ich tagelang als Statusbericht gelesen habe. Ein `grep` fand zwei weitere: `pruefe-quellen` („NOCH NICHT VERWENDBAR" mit Rückgabewert 0 heißt für jede Maschine: verwendbar) und `pruefe-tests`. **Drei von vierzehn Prüfern konnten nie rot werden** — alle drei aus derselben gut gemeinten Überlegung, ein Verdacht solle nicht blockieren. Ein Verdacht, den niemand ansieht, ist ein grünes Licht; der Vorbehalt gehört in die Ausgabe, nicht in den Rückgabewert. Sobald `pruefe-tests` rot werden konnte: **13 Schleifen ohne Längenzusicherung**, alle in Testdateien von heute. Zwei Einträge zurückgezogen, weil die Schuld beim Register lag — ein Feld `baueVorher`, das der Läufer ignorierte: Ein Register, dessen Felder der Läufer nicht kennt, erfindet Befunde |
| `wo-die-regel-aufhoerte.md` | `fremdtext.test.js` nennt sich selbst ein Verzeichnis — *„was hier nicht steht, ist ungeprüft"*. Der Satz stimmte, die Liste nicht: **Angebot und Rechnung standen darin, die Auftragsbestätigung nicht** — das Dokument, mit dem der Vertrag zustande kommt und das zwischen beiden liegt. Anfragetext und mailto-Adresse fehlten ganz. Fünf Proben nachgetragen, **alle fünf halten** — und das ist der unangenehmere Befund: Es war nichts zu flicken, die Zusicherung galt nur weniger weit, als sie behauptete. Vierter Fall derselben Familie an einem Tag (Lückenmarkierung nur für Kundenbelege, Rückgabewert 1 nur für elf von vierzehn Prüfern, Bedingung in Sichtweite nur in der Akte): **Jedes Mal war die Regel richtig und ihr Geltungsbereich zufällig — er endete dort, wo an dem Tag die Aufmerksamkeit endete.** `src/aussentexte.js` hält die Liste jetzt gegen den Quelltext statt gegen die Erinnerung: zehn Ausgänge, neun begründete Nicht-Ausgänge, ein Namensmuster über alle `export function`. Gegenprobe mit einer angehängten `erzeugeMahnung` schlägt an |
| `eine-kontrolle-die-nur-ein-test-aufruft.md` | Gezählt, welche Ausfuhren des Rechenkerns außerhalb der Tests niemand aufruft: **30 Funktionen**. Darunter die sieben Kontrollen aus `kontrolle.js` — der **zweiten Rechnung**, die den gerenderten Belegtext zurückliest und weder `warenkorb.js` noch `preis.js` kennt: **53 Testverweise, kein einziger Aufruf aus dem Betrieb.** Und der Auftragsabgleich behauptete im Präsens „kontrolle.js prüft jeden Beleg gegen die Rechnung". Eine Kontrolle, die nur ein Test aufruft, kontrolliert einen Test — es fehlte nicht die Rechnung, es fehlte der Knopf. `npm run pruefe-kontrolle` läuft jetzt über einen aus dem echten Katalog gebauten Vorgang. Drei Funde beim Bauen: `baueVorgang` war beim Zahlungsvermerk nicht nachgezogen worden (fünfter Fall derselben Familie in zwei Tagen); **mein eigener Prüfer konnte an drei von sieben Stellen nicht rot werden**, weil er das Ergebnis als `abweichungen ?? fehler ?? []` las — ein Sammelgriff auf „irgendein Feld mit Abweichungen" ist keine Auswertung, sondern eine Hoffnung; und eine wahre Meldung über ein Objekt, das nie ein Bestelltext war. **Gelöscht wurde nichts** — die übrigen 13 sind vorbereitete Schritte ohne Anlass, nicht Ballast |
| `ein-beleg-der-existiert-belegt-noch-nichts.md` | Die acht mit „unter anderem Namen vorhanden" beantworteten Ergebnisse einzeln nachgeprüft — **alle halten.** Zwei meiner Prüfgriffe waren falsch, nicht die Begründungen (`klaertDurch` statt `klaerungsweg`, `konditionenStand` statt `belegstand`): zum dritten Mal an zwei Tagen war die Gegenprobe falsch und nicht die Sache. Der Ertrag ist die Mechanik: `pruefe-auftrag` prüfte bisher nur, dass die **Belegdateien existieren** — zu wenig, wie Ergebnis 9 gezeigt hat. Jetzt wird geprüft, was jede Begründung **beim Namen nennt**: 21 Angaben, sechs begründete Ausnahmen (alle von der Form „etwas wird genannt, **weil** es fehlt"). Das Kennungsmuster meldete zunächst `DREI`, `GROESSTEN` und `RISIKEN` — in deutscher Prosa ist Großschreibung Betonung, und `IMPRESSUMSFELDER` sieht aus wie `WETTBEWERBSPREISEN`: **Was sich nicht unterscheiden lässt, wird nicht geprüft, nicht geraten.** Geprüft wird nur camelCase und GROSS_MIT_UNTERSTRICH; der Verzicht steht benannt im Muster. Eine Ausnahmeliste für deutsche Wörter wäre mitgewachsen — und eine Ausnahmeliste, die wächst, ist eine Regel, die nicht gilt |
| `vier-von-vier-systemen-unvollstaendig.md` | Nach sieben Stunden Werkzeugbau die drei Anzeigen des ersten Anlaufs gelesen — das, wofür 4,19 bis 8,22 € je Klick bezahlt werden. **Alle drei versprachen Vollständigkeit** („Fassade komplett", „alle gängigen Stärken", „Kaminzug komplett"), und **alle vier Systemlisten des Shops benennen Positionen, die er nicht führt.** Bei WDVS ist es die **Dämmplatte in Flächenstärke** — die Schicht, aus der eine Fassadendämmung besteht; Fassaden-EPS gibt es in 2, 3 und 5 cm, eine WDVS-Dämmung beginnt bei acht. Die Inhaltsseiten sagen das wörtlich; die Anzeige, die den Besucher dorthin bezahlt, sagte das Gegenteil. Dritte Ebene derselben Familie nach „ab Lager ohne Lager" (31.08.) und den Paletten (01.09.). Sechs Texte berichtigt — weg ist nur das Wort, das mehr behauptet als die Aufzählung dahinter. `npm run kampagne` liest jetzt die eigenen Systemlisten (`gruppe:` plus Lückensatz) und weist fünf Vollständigkeitsmuster zurück; **der erste Lauf fand sofort zwei weitere in der pausierten Gruppe Kanal** — dieselbe Stelle wie am 31.08.: **was pausiert ist, wird nicht gelesen** |
| `eine-ehrliche-anzeige-ist-die-halbe-ehrlichkeit.md` | Die drei Landeseiten gelesen, auf denen der bezahlte Klick ankommt. **Eine von drei machte es richtig:** Kamin nennt seine Lücke im ersten Absatz („das Anschlussformteil … steht auf der Stückliste, aber nicht im Regal"). WDVS zählte sechs Bestandteile auf und schwieg über den siebten — der Besucher musste selbst bemerken, dass die Dämmplatte fehlt. Dämmung sagte „EPS als Fassadenplatte" bei 2, 3 und 5 cm Ausgleichsstärken. Alle drei sagen es jetzt im Antwortsatz, dazu **Kanal**, das der neue Prüfer im selben Lauf fand. `npm run kampagne` prüft seither beide Hälften: Die Anzeige darf keine Vollständigkeit versprechen **und** die Landeseite muss die Lücke nennen. Mein erster Entwurf sagte „Fassadenplatten in WDVS-Stärke — sie beginnen bei 8 cm"; `pruefe-inhalte` meldete **Zahl ohne Quelle** — zu Recht, Herstellerseiten sind gesperrt: **Eine Zahl, die ich nicht belegen kann, gehört nicht auf eine Kundenseite, auch wenn sie stimmt.** Zwei weitere Proben schlugen an: die Versprechensliste in beide Richtungen („Ausgleichsplatte" findet keinen Artikel — ein Versprechen, das der Kunde nicht eintippt, ist keines), und eine **halbe Mutation**, die aussah wie ein blinder Prüfer; das Gegenprobenregister kennt jetzt `alle: true` |
| `fuenf-schritte-bis-zur-anfrage.md` | Erste gemessene Zahl der Besucherstrecke: `npm run wegprobe` geht den Weg im gebauten Shop wirklich, ab der Landeseite der Anzeige. **Fünf Schritte, kein einziges Textfeld**, Zahlweg vorbelegt, am Ende 775 Zeichen Anfragetext — anders als die Kaufquote ohne einen einzigen Besucher zählbar. Daneben die eine gemessene Länge: **die Gruppenseite hat keinen Legen-Knopf** (11 Artikel, 0 direkt legbar). Drei Positionen kosten damit **neun Schritte statt fünf**. Der Grund ist die Gebindemenge — ein Legen-Knopf ohne Mengenfeld legt „ein Quadratmeter Glasgewebe", genau der am 31.08. behobene Fehler; der Umbau bedeutet die Artikelkarte von `<a>` auf `<div>`, und fünfzig Browserszenarien hängen daran: **Ein halber Umbau der Landeseite ist schlechter als keiner** — er verdient eine eigene Runde, und der Preis steht jetzt gemessen daneben. Vier Zusicherungen halten den Weg kurz. Nebenbei: `baueVorher` im Gegenprobenregister lief nur `website`, nicht `build` — eine Mutation in `shop-ui.js` erreichte die gebaute Seite nie; fünfter Fall einer halben Gegenprobe in drei Tagen. Und: **ein Marker, der auch im Werkzeug vorkommt, findet das Werkzeug** |
| `vierzehneinhalb-stunden-im-monat.md` | Die Gegenrichtung zur Wegprobe: `npm run aufwand` hält den Betreiberweg gegen die Zielgröße — die Zahlen gab es seit Wochen, verglichen hat sie niemand. Bei 67 Bestellungen: heute 17,9 h und **blockiert** (Zahlung und Rechnung gesperrt, es läuft gar nichts), nach den Freigaben **13 Minuten je Bestellung und 14,5 Stunden im Monat** — das geht neben einer Bau GmbH. Die Zahl, die den Plan beschreibt: **ab 92 Bestellungen geht es nicht mehr nebenbei, das 1,4-fache der Zielgröße.** Wer das Modell vergrößert, erhöht nicht den Gewinn, sondern die Handarbeit — und stößt vorher an diese Grenze als an eine wirtschaftliche. Grenze mit 20 h/Monat **gesetzt und benannt**, damit ihr widersprochen werden kann. Zehn der 14,5 Stunden gehen für **eine** fehlende Anbindung drauf: Gate 6 in Stunden statt in Worten — und milder, als das Gate klingt: Das Modell fällt nicht, es kostet zehn Stunden im Monat. Zahlungsanbieter und Betreiberdaten kosten **null** Minuten und sperren trotzdem: keine Arbeit, eine Bedingung. Drei benannte Vorbehalte, der schwerste: Die Rechnung kennt nur den Regelfall — 10 % Retouren zu je einer halben Stunde schrumpfen den Abstand von 1,4× auf 1,25× |
| `der-einzige-termin-den-der-shop-selbst-zusagt.md` | Die Zeit zwischen den beiden gemessenen Wegen: Sie steht in keiner Rechnung, weil sie **zwischen** den Schritten liegt. Die Kasse versprach „wir melden uns mit **Preis**, Verfügbarkeit und Termin" — der Preis steht auf derselben Seite; ihn als offen anzukündigen nimmt der Preistransparenz den Boden, mit der der Shop wirbt. Jetzt „wir **bestätigen** Preis, Verfügbarkeit und Termin". Die Zeitangabe fehlte und **wird nicht erfunden**: Eine Antwortzeit ist eine Zusage im Namen des Auftraggebers. Stattdessen geführte Angabe wie E-Mail und UID — `antwortzeitWerktage: null` in `betreiber.json`, offener Punkt in `startklar`, Kassenwort „eine zugesagte Antwortzeit"; steht dort eine Zahl, schreibt die Kasse sie von selbst (mit `1` nachgewiesen). **Die Antwortzeit ist der einzige Termin, den dieser Shop selbst zusagt** — alle anderen kommen vom Lieferanten. Eine Gegenprobe zurückgezogen und der Grund ist der Befund: `pruefe-seiten` blieb bei einer erfundenen Zeit **zu Recht** grün, denn der Kassentext steht in keiner gebauten Datei — er entsteht erst im Browser. **Was erst im Browser entsteht, prüft keine Datei** — dritter Fall dieser Familie nach den Belegen und `shop-ui.js` |
| `was-erst-im-browser-entsteht.md` | Die Antwort auf den Befund vom selben Tag: ein Prüfer für die Sätze, die erst im Browser entstehen. `oberflaechensaetze()` liest die Zeichenketten aus `shop-ui.js`, zieht verkettete Literale zusammen (sonst hätte eine Zahl ihre Quelle nie im selben Stück) und behält, was eine Aussage sein kann — **23 Sätze**, dieselben Regeln wie jede Inhaltsseite. Erster Befund: **1 von 23** — der Frachtsatz im Warenkorb nannte 1.934 € und 614 € ohne Quelle und Stand, beides stand seit Tagen auf der Wissensseite. Jetzt 0 mit Verdacht. Zweiter Befund: Die zurückgezogene Gegenprobe kam zurück und blieb **grün** — `ZAHL_MIT_EINHEIT` kennt „Std“, nicht „Stunden“, und das aus gutem Grund. **Zum dritten Mal an zwei Tagen war die Gegenprobe falsch und nicht die Sache.** Statt die allgemeine Regel zu weiten (heute gratis, aber sie verlangte künftig eine Quelle für die berechtigte Zusage „innerhalb von 2 Werktagen“) eine schärfere: **Eine feste Zeitspanne in einem Oberflächensatz ist immer erfunden** — echte Fristen setzt die Laufzeit ein und stehen in keinem Literal. Ausbeute heute null; die Regel bewacht die Stelle, an der eine Zusage entsteht. Nebenbei: der Registereintrag trug das Argument im Feld `werkzeug` und lief ins Nichts („1 ohne belastbaren Umfang“), und der fünfzehnte Prüfer machte die PR-Beschreibung überholt — gemeldet vom Schaufensterprüfer, bevor der Auftraggeber sie las |
| `crawler-register.md` | Die `robots.txt` war die **einzige Entscheidung im Bestand ohne Register** — zwei Listen aus Zeichenketten ohne Grund je Kennung. Beim bloßen Aufschreiben der Gründe fielen zwei Löcher auf: **„Training gesperrt" stimmte nicht** (Apples `Applebot-Extended` fehlte in beiden Listen — nicht entschieden, sondern vergessen), und **`Google-Extended` war als Trainingssperre geführt, obwohl daneben keine erlaubte Suchkennung stand**. Daraus die Regel: **Eine Sperre ohne erlaubte Geschwisterkennung sperrt nicht das Training, sondern den Anbieter** — prüfbar allein aus dem Register, weil sie nur fragt, ob für einen Anbieter, der Fragen beantwortet, noch etwas erlaubt ist. `CCBot` bleibt gesperrt und schlägt nicht an: ein Archiv beantwortet niemandem eine Frage (`beantwortetFragen`). Entscheidung: Google-Extended auf **erlaubt**, weil eine zu Unrecht gesetzte Sperre genau das Ziel kostet und eine zu Unrecht erlaubte nur Trainingsmaterial; die **nicht belegbare Annahme** dahinter steht im Grund der Zeile und als offener Punkt (Netzausgang gesperrt, 403). Neu benannt: `ChatGPT-User`, `Claude-User`, `Perplexity-User` — sie hingen an der Sammelzeile `User-agent: *`. **Drittes Loch:** `robotsTxt` stand in keinem Ausgangsverzeichnis, weil `NAMENSMUSTER` auf `[Tt]ext$` endete und die Funktion auf `Txt` — dritter Fall nach `\bÖNORM` und „Std“ statt „Stunden“: **ein Muster prüft die Schreibweise, die sein Verfasser im Kopf hatte.** Muster erweitert, Fremdtextprobe nachgetragen (Gift in der Sitemap-Adresse darf keine zusätzliche `Disallow`-Zeile erzeugen). `robotsTxt()` rendert jetzt das Register, `npm run pruefe-crawler` liest die ausgelieferte Datei zurück; Regeln gegen den **alten** Stand geprüft |
| `eine-anfrage-fuer-acht-punkte.md` | Acht der siebzehn offenen Punkte hängen an **einem** Gespräch mit **einem** Lieferanten — und dafür gab es keinen Text. Was es gab: `anschreiben-entwuerfe.md` vom 9. August, dreizehn **Radon**-Hersteller, überholt seit dem Kurswechsel vom 22. August und vierundzwanzig Tage ohne Kopfnotiz; `data/lieferanten.json` zeigte mit `_hinweis` dorthin und nannte sie „die Quelle der echten Werte“. **Ein Entwurf für ein abgelöstes Modell ist ein Wegweiser in die falsche Richtung** — beide Stellen tragen jetzt eine Notiz. Neu: `src/lieferantenanfrage.js` mit **vier** Fragen (nicht zwölf — jede zusätzliche senkt die Antwortwahrscheinlichkeit aller übrigen), jede nennt die Punkte, die sie schließt; `npm run pruefe-anfrage` prüft **beide** Richtungen: ein Punkt ohne Frage bleibt offen, **und niemand merkt es, weil das Gespräch stattgefunden hat**. Der Befund: Der Brief ist **nicht versandfähig**, weil `betreiber.email` und `betreiber.telefon` leer sind — zwei Zeilen aus der Gruppe „Liegt vor, fehlt nur in der Datei“. **Der billigste offene Punkt sperrt das Gespräch, das acht andere schließt** — das stand nirgends, weil zwischen den Gruppen keine Linie führte |
| `der-plan-hing-an-nichts.md` | Die Folge des Befundes vom selben Tag: Der Rolloutplan ließ das Lieferantengespräch an **Tag 0** beginnen, obwohl der Brief eine Rückantwortadresse braucht, die erst die Etappe `impressum` einträgt. `brauchtVor` war das **einzige Feld im Plan ohne Pflichtgrund** — Dauer, Ergebnis und fehlendes Gate tragen alle einen — **und genau dieses Feld war falsch**. Jetzt `{etappe, warum}`, und eine **leere** Liste verlangt `warumOhneVoraussetzung`: Eine falsche Abhängigkeit verlängert die Kette und fällt beim Rechnen auf, **eine fehlende verkürzt sie und sieht aus wie ein guter Plan**. `npm run rollout` bricht vor dem Rechnen ab. Folge für den Plan: Gespräch Tag 1–8, Katalog Tag 8–10, an Tag 0 beginnen nur noch **vier** statt sechs Etappen — **die Kette bleibt bei 57 Tagen**, weil das Gespräch nicht auf dem bestimmenden Strang liegt. Das macht den Fehler nicht klein: Ein Plan, der heute zufällig stimmt, ist kein geprüfter Plan |
| `die-zahl-die-in-elf-stellen-stand.md` | `npm run messliste` meldet **32 Begriffe**, die Akte an neun Stellen und der Quelltext an zwei weiteren **33**. Ursache ist eine gute Entscheidung vom Vortag: „Kaminkopf Regenhaube“ fiel aus der Kampagne, weil der Shop die Kaminkopfverkleidung nicht führt — **ein Suchwort ist kein Werbeversprechen**. Die neue Zahl stand danach in **einer** Datei. Genau der Fall, für den es das Leitzahlregister gibt („eine Zahl, die in acht Dokumenten steht, wird in keinem gepflegt“) — und sie stand nicht darin. Vierter Eintrag; `jetzt(ziel, umfeld)` bekam ein zweites Argument, weil diese Zahl nicht aus den Zielgrößen folgt, sondern aus der erzeugten Messliste (keine zweite Zusammenfassung von Phrase und Exakt). Zwei Befunde am Prüfer selbst: Die Bedingung war **zu weit** („1. September“ steht überall — eine Bedingung, die überall zutrifft, prüft nichts), und die **±8-Zeilen-Sichtweite hat in `STATUS.md` versagt** — ein fremder Tabelleneintrag acht Zeilen weiter deckte die Zeile mit seinen Worten. Der schärfere Umbau (Absatz statt Zeilen) steht aus und ist benannt. Das Lauf-Protokoll in `messliste-fuer-das-laufende-modell.md` blieb **bewusst** bei 33: Eine Abschrift zu ändern wäre das Fälschen eines Protokolls |
| `der-nachbareintrag-deckt-nichts.md` | Der eine Stunde zuvor benannte, offen gelassene Umbau: „in Sichtweite“ hieß **±8 Zeilen**, ohne Ansehen dessen, was dort steht. In `STATUS.md` — einer Tabelle aus 260 unabhängigen Einträgen — deckte damit der **Nachbareintrag** eine überholte Zahl. Erster Anlauf („eine Tabellenzeile sieht nur sich selbst“) war **zu streng**: 21 Meldungen, 9 davon zu Unrecht, weil eine Zeile einer **Rechentabelle** ihren Kopf und den einführenden Satz sehr wohl mitliest. Getrennt: Fließtext ±8 Zeilen ohne fremde Tabellenzeilen; eine Tabellenzeile sieht sich selbst, ihren Kopf und den Text **vor** der Tabelle, nicht die Nachbarn. Übrig blieben **12 echte**, alle berichtigt — die Bedingung steht jetzt in der Zeile. Einer war etwas anderes: „vorhanden auf allen Belegen“ meinte **Gewichte**, nicht Fracht — ein Fehltreffer des Musters, den die alte Sichtweite verdeckt hatte. **Eine zu weite Sichtweite versteckt nicht nur überholte Zahlen, sondern auch die Fehltreffer des eigenen Musters** |
| `legen-knopf-auf-der-landeseite.md` | Die am Vormittag ausdrücklich verlangte „eigene Runde“: Die Gruppenseite — die **Landeseite jeder Anzeige** — hatte keinen Legen-Knopf, drei Positionen kosteten neun Schritte statt fünf. Kachel von Verweiselement auf `div` umgebaut (ein Knopf in einem Verweis ist für die Tastatur eine Falle), Kopfbereich verlinkt, Mengenfeld mit **Gebindeschritt** (55 m² Glasgewebe, nicht 1 m²), Fokusring wandert auf den Kopf. **Weg 5 → 4 Schritte, drei Positionen 9 → 6.** Drei Befunde nebenbei: die Knöpfe der Kacheln waren gar nicht verdrahtet (`baueKorbknoepfe` band einzeln, die Kacheln entstehen später — jetzt ein Behandler am Dokument, mit Wache gegen doppeltes Anhängen); **dieselbe Kennung zweimal auf einer Seite**, weil derselbe Artikel auf einer Artikelseite in zwei Listen steht — gefunden von einer neuen Probe, die ich für eine Formalie hielt, behoben durch Suche in der **eigenen Zeile** statt über die Kennung; und `pruefe-preise` trennte an `<a class="karte"` und meldete danach für alle 46 Artikel eine fehlende Mindestmenge — **ein Anker im HTML ist eine Verabredung mit dem Bauwerkzeug** |
| `ein-quadratmeter-von-einer-rolle.md` | Nachgesehen, was der Shop am Ende ausspuckt — der Anfragetext ist das einzige Papier, das ihn verlässt. Er lautete: **1 m² Baumit TextilglasGitter 1,1x50 m, 1,19 € Ware, 75,50 € Zustellung.** Zwei Fehler. **Erstens** las `mengenschritt` „1,1x50 m“ nicht — mit der Begründung im Test „Meter sind keine Quadratmeter, die zweite Kante wird nicht erfunden“. Der Satz stimmt für eine einzelne Länge und nicht hier: **Zwei Zahlen mit einem Malzeichen sind ein Maß, zwei Zahlen ohne eines sind zwei Zahlen.** „Grundmauerschutz 20 1,5 m“ bleibt deshalb `null` und ist eine Frage an den Lieferanten. Bestätigt vom Nachbarartikel: „Capatect Glasgewebe … **55 m2**“, dieselbe Warenart, dieselbe Rolle. Jetzt 55 m² / 65,45 €. **Zweitens** stand der Satz „Die Fracht kostet hier mehr als die Ware“ nur im Warenkorb — **ein Hinweis, der nur auf der Seite steht, fehlt in dem Papier, das der Kunde verschickt.** Kostet rund 200 Zeichen und damit den Mailknopf ab zwei statt drei Positionen, aber nur in Körben, von denen der Shop ohnehin abrät. Und ein dritter Fehler, meiner: Die neue Prüfung meldete „Fracht über Warenwert: nein“ bei 65,45 € gegen 75,50 € — die Schablone schluckt jeden Backslash, eine Falle, die in `shopprobe.mjs` seit dem 29.08. aufgeschrieben steht |
| `verrechnet-und-nicht-bestellt.md` | Dieselbe Methode, anderes Papier: die **Bestellung an den Lieferanten** gelesen. Das Angebot verrechnet dem Kunden „Pauschale plus 2× Kranentladung“ (2 × 7,50 €), die Bestellung sagte kein Wort vom Kran. **Verrechnet und nicht bestellt ist eine Rechnung über nichts** — der Lastwagen wäre ohne Kran gekommen. Kein Prüfer hat es gesehen, weil **jeder Beleg für sich in Ordnung war**; der Fehler lag zwischen ihnen. Neu: `pruefeVerrechnetUndBestellt` hält Kundenbelege gegen die Lieferantenbestellung, mit derselben Zahl, und meldet auch einen fehlenden Zielbeleg statt zu schweigen. Zweiter Befund: **zwei Namen für dieselbe Zahl** — die Seiten sagen „Kranentladung je Hub“, die Belege sagten „Sperrgutzuschlag“; ein Zuschlag ist ein Aufpreis, eine Kranentladung ist etwas, das jemand tut (dieselbe Bauart wie `PreOrder` gegen `InStock`). Dritter: Das Angebot sagte „Abladen … obliegt dem Besteller“ **neben** einer berechneten Kranentladung — jetzt steht dort, wo die bezahlte Leistung aufhört. Und „Ansprechpartner vor Ort:“ trug eine Telefonnummer |
| `name-und-anschrift.md` | Die **Rechnung** gelesen — das Dokument mit den strengsten Anforderungen. Der Empfänger stand mit Straße, PLZ und Ort da, der **Aussteller nur mit seinem Namen**, während zwei Absätze tiefer „Dieser Beleg dient dem Vorsteuerabzug“ steht. § 11 Abs 1 Z 3 UStG verlangt Name **und Anschrift**. Drei Stellen, drei Aussagen: Das Register verlangte es richtig, die Prüfung bekam `betreiber.firma`, der Ausdruck war mit „Firma und Anschrift“ beschriftet und gab die Firma aus. **Eine Prüfung, die ein Feld prüft statt der Angabe, prüft den Namen des Feldes.** Verdeckt hat es der Testbestand: Er stopfte die ganze Anschrift in das Feld für den Namen und traf damit genau den Fall nicht, der beim echten Betreiber eintritt. Keine neue Lücke — die Anschrift liegt seit Wochen in `betreiber.json`. Neu: `absenderzeilen()` auf allen drei Kundenbelegen, `anschriftEinzeilig()` ist leer, sobald ein Teil fehlt, und `pruefeBeleg` nimmt `mussEnthalten` — **was geprüft wurde, muss auch dastehen**. Der Fehler lag diesmal zwischen zwei **Prüfungen** desselben Belegs |
| `eine-datei-halb-deutsch.md` | Das Papier für den **Steuerberater** gelesen: Die Buchhaltungs-CSV trennt mit **Semikolon** (hiesige Schreibweise) und schrieb die Beträge mit **Punkt** — `768.39`. In einer Tabelle mit deutscher Ländereinstellung ist der Punkt das Tausendertrennzeichen: aus 768,39 € werden lautlos 76.839 €. **Eine Datei, die zur Hälfte deutsch formatiert ist, ist falsch formatiert.** Dazu `1234.5` — ein Betrag mit einer Nachkommastelle ist in einer Buchhaltung kein Betrag. Neu: `zahlText`, `csvBetrag`, `zahlAusText` (liest Komma **und** Punkt, damit ein Formatfehler kein Datenverlust wird), mit Wache gegen `Number(null) === 0` — **eine erfundene Null sieht aus wie eine gebuchte**. Zweiter Befund: `leseBestellung` verlangte `(\d+)` und ließ jede **gebrochene Menge still verschwinden** — bei einem Shop, der Platten zu 0,75 m² abgibt. Dritter und unangenehmster: Die Gegenprobe dazu schlug nicht an, weil der **Prüfkorb** der Kontrolle nur ganze Mengen enthielt — **ein Prüfkorb ohne die schwierigen Fälle prüft die leichten**; er trägt jetzt eine gebrochene Menge und sagt es in seiner Ausgabe. `kontrolle.js` importiert die neue Funktion **nicht**, sondern führt sie zweitens: Ein Leser, der die Schreibweise vom Schreiber bezieht, bestätigt jede |
| `zusagen-die-niemand-nachmisst.md` | Die **Datenschutzseite** gelesen: Sechs Sätze darauf sind Aussagen über den **Code** — keine Cookies, kein Zählpixel, keine fremde Einbindung, Warenkorb nur im Browser. Geprüft war, dass sie **dastehen** (`website.test.js` sucht die Zeichenkette „Keine Cookies“); ob sie stimmen, hat niemand gemessen. **Eine Zusage auf einer Rechtsseite, die niemand nachmisst, ist eine Behauptung mit Haftung.** Genau eine der sechs hatte eine Messung — die über fremde Einbindungen, seit dem 29.08., weil an dem Tag drei Schriften von Google kamen: **Der Satz existiert, weil der Fehler passiert ist.** Neu: `npm run pruefe-datenschutz` liest die 82 gebauten Dateien, je Zusage eine Messung (u. a. „nicht an den Server übertragen“ = kein `fetch`, `sendBeacon`, `WebSocket`), jede Zusage mit Kennung, `pruefbar: false` verlangt `warumNicht`. Eine Probe verbietet Paragraphen in dieser Liste — der technische Befund gehört dem Bau, der Rechtstext der Kanzlei. Die Gegenprobe schlug zuerst nicht an: Sie hängte einen **Kommentar** an, und das Bündel wirft Kommentare weg — eine Mutation, die der Bau entfernt, ist keine |
| `ein-verweis-auf-eine-nummer.md` | Angebot und Auftragsbestätigung zitieren „**Punkt 2**“ und „**Punkt 9**“ der eigenen AGB. Beides stimmt — und beides hängt an einer **Zählung, die niemand bewacht**: Wer einen Punkt einschiebt, verschiebt jede Nummer dahinter, und der Kundenbeleg zitiert danach eine Klausel, die etwas anderes regelt. **Das fällt nicht auf** — die Gliederung bleibt richtig, der Beleg lesbar, nur der Verweis zeigt woanders hin. **Ein Verweis auf eine Nummer ist eine Verabredung mit einer Reihenfolge** (dieselbe Bauart wie der HTML-Anker des Preisabgleichs). Neu: `AGB_VERWEISE` mit Zweck und einem **Wort**, das im Titel vorkommen muss (kein Titelabgleich — der wäre bei jeder Umformulierung rot), und `pruefeAgbVerweise` in drei Richtungen; die dritte (ein Eintrag, den kein Beleg mehr zitiert) gilt **nur beim vollständigen Durchlauf**, weil ein Prüfer, der bei jedem Ausschnitt rot wird, abgeschaltet wird |
| `die-seite-die-die-maschine-nicht-las.md` | Jede Artikel-, Wissens-, System- und Gruppenseite trägt maschinenlesbare Auszeichnung — **`lieferung.html` trug keine**, ausgerechnet die Seite mit Frachtsätzen und Liefergebiet, den beiden Auskünften, nach denen ein Assistent zuerst fragt. Jetzt `FAQPage` aus **denselben Werten** wie die Preistafel; **keine Frage nach der Lieferzeit**, weil sie unbekannt ist — eine erfundene Frist in einer Auszeichnung wird zitiert und nicht gelesen. Bewusst **kein** `shippingDetails` am Angebot: Die Fracht fällt **je Lieferung** an, und „Versand 75,50 €“ an jedem Artikel sagte für drei Positionen das Dreifache — falsch in die teure Richtung. Zweitens: Niemand prüfte, ob eine ausgezeichnete Antwort dasselbe sagt wie die Seite — **eine Auszeichnung, die mehr sagt als die Seite, ist eine Behauptung an eine Maschine**; `pruefe-seiten` hält jetzt jede Zahl mit Einheit gegen den sichtbaren Text (29 Antworten). Und der Befund dabei: **`pruefe-seiten` endete mit `process.exit(0)` ohne Bedingung** — 81 Seiten gelesen, Verdacht gezählt, gedruckt, immer grün. **Ein Prüfer, der nicht rot werden kann, ist ein Bericht.** Aufgefallen nicht beim Lesen, sondern weil eine Gegenprobe scheiterte, die etwas anderes prüfen wollte; damit kommt auch die am 01.09. **zurückgezogene** Gegenprobe zurück — die Mutationen waren angekommen, der Prüfer meldete sie, nur der Ausgang war grün |
| `vier-begruendungen-die-nicht-hielten.md` | Nachdem eine zurückgezogene Gegenprobe zurückkam, die übrigen sechs Verzichte noch einmal angesehen — **vier hielten nicht**. `pruefe-stand` („die Mutation ist eine neue Datei“): Man kann eine Datei auch ungenannt machen, indem man ihren Namen aus dem Verzeichnis **entfernt**. `pruefe-preise` („eine Mutation trifft alle vier Ausgaben gemeinsam“): Die Preiszeile der Kachel kommt genau **einmal** vor — es fehlte `baueVorher`. `pruefe-preisalter` („Grundlage ist `preise/`“): Das stimmt für den **Preis**, nicht für sein **Alter** — der Preisstand steht im öffentlichen Katalog. `pruefe-tests` („ein absichtlich roter Test, vierzehn Sekunden je Lauf“): Der Prüfer lässt nichts laufen, er liest Quelltext. **Eine Begründung, die niemand nachprüft, wird mit der Zeit zur Tatsache.** Alle vier waren ehrlich gemeint und beschrieben etwas anderes als das, worum es ging. Zwei halten (`pruefe-pruefer` wäre ein Ring, `pruefe-geheimnis` fasst die eine verbotene Datei an). Nebenbei: Eine Untergrenze „mindestens 3 Verzichte“ musste auf 1 fallen — **eine Untergrenze, die verbietet, dass eine Liste schrumpft, hält den schlechteren Zustand fest.** Gegenproben 29 von 29, Prüfer ohne Nachweis 2 statt 6 |
| `kein-preiswechsel-in-fuenf-monaten.md` | Dieselben Augen auf das **andere** Register: `OHNE_WERKZEUG` in `offenepunkte.js`. Fünf der sechs Begründungen halten, eine nicht — „Preisrhythmus … aus fünfzehn Rechnungen nicht ableitbar“ stimmt für den **Rhythmus** und nicht für die **Beobachtung**. `npm run preiswechsel` misst: 70 Positionen, 8 mehrfach gekaufte Artikelnummern, **8 von 8 unverändert**, längste Spanne 32 Tage. Fast schiefgegangen: Ein erster Durchlauf über die **ausgewiesenen** Einzelpreise meldete zwei Änderungen — Pfand bei einer Palettenrückgabe und ein halbierter Listenpreis bei entfallenem 50-%-Rabatt (Nettopreis gleich). **Der ausgewiesene Preis ist nicht der bezahlte**; verglichen wird `Betrag / Menge`. Der Katalog hatte den effektiven Preis übernommen — der Fehler steckt nicht im Bestand. Die Frage bleibt **offen** (32 Tage beobachtet gegen 90 gesetzt), aber sie hat jetzt einen Befund daneben und ist entsprechend geschärft. Das Werkzeug druckt **keinen einzigen Preis**: `.gitignore` deckt die Datei, nicht die Ausgabe — eine Probe hält es fest |
| `json-zwischen-script-und-script.md` | Drittes Register mit denselben Augen: `KEIN_AUSGANG`. Acht der neun Begründungen halten, eine nicht — `baueSuchindex` „geht als JSON ins Bündel, nicht als Zeilentext hinaus“ hört einen Schritt zu früh auf: Das Bündel geht **in eine HTML-Seite**. `JSON.stringify` maskiert kein `<` und kein `/`; eine Artikelbezeichnung mit `</script>` beendet das Skriptelement, alles dahinter liest der Browser als HTML. **Vier Stellen** betroffen — Einzeldatei, `demo.html`, `shop.js` und die `ld+json`-Auszeichnung **jeder der 81 Seiten**. Heute nicht ausnutzbar (die Namen kommen aus eigenen Lieferantenrechnungen), aber die Zusicherung „Fremdtext wird entschärft“ galt dort nicht. Neu: `jsonFuerSkript` (maskiert `<`, `>`, U+2028/29). **Zweiter Befund:** Der Leser des Verzeichnisses sucht nur `^export function` — **sechzehn Ausfuhren sind Pfeilfunktionen**, darunter `textZeile`, also die Entschärfung selbst. Dritter Fall nach `\bÖNORM` und `Text`/`Txt`: **Ein Leser prüft die Schreibweise, die sein Verfasser im Kopf hatte.** |
| `ein-urteil-nur-am-bildschirm.md` | Nach dem `exit(0)`-Befund bei `pruefe-seiten` alle Werkzeuge durchgesehen: **Wer fällt ein Urteil und behält es für sich?** Neun ohne roten Ausgang, sieben davon zu Recht (Berichte). Zwei nicht: **`startklar`** druckte „NICHT STARTKLAR“ und endete mit Null — das Werkzeug, dessen ganzer Zweck es ist, Nein zu sagen, hatte überhaupt kein `process.exit`; wer es in einen Veröffentlichungsschritt hängt, bekam jedes Mal ein Ja. **Ein Urteil, das nur auf dem Bildschirm steht, ist keines.** Und **`rollout`** druckte „über der Frist“ ebenso grün. Beide jetzt rot bei negativem Urteil, mit `--bericht` wie bei den Prüfern. Die Gegenprobe dazu überschrieb sich zuerst selbst: ein zweites `tage: 60` **vor** dem vorhandenen `tage: 10` — im Objektliteral gewinnt der letzte Schlüssel. **Eine Mutation, die der Bau überschreibt, ist keine.** 30 von 30 Gegenproben |
| `gate25-mindestbestellwert.md` | **Gate 25 entschieden: 250 € netto Warenwert je Lieferung.** Gate 20 („kein negativer Deckungsbeitrag") lief seit dem 28.08. — aber in `darfAutomatischAusgeloestWerden`, also **nach** der Kasse: Ein Korb über 19,30 € wurde durchgerechnet, mit Preisen ausgewiesen und als fertige Anfrage angeboten; abgelehnt worden wäre er erst danach. **Eine Sperre, die erst nach dem Ja greift, ist keine Sperre, sondern eine Absage mit Verzögerung.** Die Zahl ist gerechnet: Nulldurchgang 114–129 € für eine Palette, 202–224 € für zwei; 250 € deckt zwei auf dem ungünstigsten Zahlweg, drei nicht — dafür bleibt Gate 20. Gemessen je Teillieferung. Umgesetzt in `shopkern.js`, `kundenanfrage.js`, `shop-ui.js`, auf der Lieferseite und in AGB-Punkt 5; ein Testfall hält die Grenze gegen den Rechenkern, damit sie nicht unter Gate 20 rutscht. Nebenbefunde: die Lieferseite nannte seit 25.08. **400 €** für dieselbe Frage (dritte Zahl, die einzige ohne Rechnung dahinter); die Wegprobe las `document.body.textContent` und damit ihren eigenen Bündelquelltext — sie konnte nicht rot werden; `pruefe-schaufenster` zählte Gates über `/Gate (\d+)/` im Fließtext und sah Gate 25 nicht, weil dessen eigene Zeile den Namen nie schreibt. 32 Gegenproben, 1.288 Testfälle. Die Grenze steht seither auch in der PR-Beschreibung und wird dort gehalten — 29 Kennzahlen |
| `neun-testfaelle-acht-angesehen.md` | `npm run alles` gebaut (`bin/gesamtlauf.mjs`): ein Befehl, der die Prüferliste **aus `src/pruefregister.js` liest** statt aus dem Gedächtnis — 21 Befehle von Hand waren der Anlass. Sein erster Lauf fand drei Dinge. (1) `node --test test/` meldete „1 Testfall, rot“, `npm test` 1.276 grüne: Node 22 nimmt den Pfad als Modul. Der Lauf ruft jetzt den veröffentlichten Befehl auf, damit es keine zweite Dateiliste gibt. (2) `✓ pruefe-datenschutz — NaN Zusagen`: Der Registereintrag trug `zweite: true`, sein Muster hat eine Klammer, und `NaN < 5` ist falsch. **Ein Häkchen hinter einer Nichtzahl ist schlimmer als ein Kreuz.** Urteil fängt NaN, ein Testfall hält jeden Eintrag gegen sein Muster, und `pruefe-pruefer` verlässt den begründeten Verzicht — 31 Gegenproben. (3) `Testlauf 1278` neben `pruefe-tests 1276`: `test/geheimnis.test.js` hat neun Fälle, der Prüfer sah acht. Eine `{` in einer Zeichenkette ließ die Klammerzählung bis zum Dateiende laufen; der Fall wurde still übersprungen. Zeichenketten, Kommentare und Muster-Literale erkannt — der zweite Anlauf machte es erst schlimmer (acht unlesbare Fälle durch ein Muster mit fünf Anführungszeichen) —, und ein unlesbarer Fall wird jetzt gemeldet statt übersprungen. 1.277 angesehen, 0 Verdacht. **20 von 20 Schritten grün**. Dazu bei der PR-Runde: Der auf GitHub sichtbare Text stand auf „12 Prüfer“ (18) und „50 Shopszenarien“ (53) — die Quelldatei war gepflegt, das Schaufenster nicht nachgezogen; Beschreibung erneuert. Und der eine Satz, den `pruefe-schaufenster` nicht prüfte, war der über sich selbst („26 Kennzahlen“ bei 27) — er ist jetzt die 28. und misst sich mit |
| `weg-zum-ersten-verkauf-nachgerechnet.md` | Nachfolger des Dokuments vom 31.08., das einen Tag später überholt war (Domain entschieden, drei Punkte dazugekommen, Gebote verschoben). Trägt die drei Rechnungen von heute: Der erste Anlauf ist mit 300 €/Monat ein **Vierzehntel** des Werbebudgets der Zielgröße — ein Versuch, kein Betrieb; die Abbruchregel in Klicks statt Tagen; und **wahrscheinlich bindet der Markt, nicht das Geld**. Die Reihenfolge beginnt mit dem einen Gespräch, das acht Punkte schließt |
| `offene-punkte-gezogen-statt-gefuehrt.md` | Die Liste dessen, was der Auftraggeber tun muss, stand über **ein Dutzend Dokumente** verteilt — und `weg-zum-ersten-verkauf.md` führte einen Tag später die Domain noch als offen. Neu: `npm run offenepunkte` zieht sie aus `startklar`, dem Feed und der Preisalterprüfung; was kein Werkzeug weiß, steht in `src/offenepunkte.js` **mit dem Grund**, warum keines es weiß. Geordnet danach, wer handeln muss und was es kostet. Der Befund beim Sortieren: **acht der fünfzehn Punkte hängen an einer einzigen Anfrage** an den Lieferanten — vorher unsichtbar, weil sie in sechs Dokumenten standen. Dazu eine Berichtigung an der Quelle: Die Lieferzeit ist eine Anfrage, keine Eintragung |
| `zwei-rechnungen-ein-median.md` | Die Startseite sagt **26,7 %** unter Liste, die PR-Beschreibung sagte **26 %** — und `pruefe-schaufenster` meldete beide grün. Der Prüfer maß mit einer **eigenen Rechnung** (`vorteil()` rundet je Artikel ab) statt mit der des Shops (`katalogbefund()` rundet einmal am Ende) und bestätigte damit eine Zahl, die auf keiner Seite steht. Regel: gemessen wird an der Quelle, aus der die Aussage stammt; jede Kennzahl trägt ihre Herkunft im Klartext. Die eine ehrliche Ausnahme — die Browserszenarien — steht jetzt als solche dabei. Neue Wache: Beschreibung und gebaute Seite müssen dieselbe Zahl nennen |
| `alle-preise-stand-eines.md` | Der Auftraggeber wollte die Seite sehen; beim Nachlesen der Startseite: **„Alle Preise Stand: 2026-08-17"** — gerechnet als **Maximum** aller Preisstände, während der älteste Einkaufspreis vom 22. April ist. Für 31 von 46 Artikeln eine Frische behauptet, die sie nicht haben, und wieder zugunsten des Plans. Derselbe Satz stand in `llms.txt`. Der Anfragetext bildet seit jeher die **Spanne** — der Code lag fertig drei Dateien weiter. `preisstandSpanne()` jetzt für alle drei Ausgaben. Beim Beheben zwei eigene Fehler: die Quellenmarke `Stand:` verloren (der Seitenprüfer fing es) und eine Bestandszahl 46 hingeschrieben, in derselben Stunde, in der ich sie anderswo herausnehme |
| `keyword-ohne-treffer.md` | Einen Schritt weiter im Trichter: **6 von 33 Anzeigen-Keywords fanden in der eigenen Shopsuche nichts.** Die gestern ergänzten Handelsbegriffe standen im Seitentext, aber nicht in `suchwoerter.json` — zwei Listen, die dasselbe meinen. Und „kaufen" machte zwei Suchen leer, weil alle Wörter treffen müssen; `ABSICHTSWOERTER` lässt jetzt neun Vorgangswörter aus, allein bleiben sie ergebnislos. **Ein Testfall hat mich korrigiert:** „kaminkopf" war eine begründete Ablehnung (die Verkleidung führen wir nicht) — zurückgenommen und das Keyword gestrichen. Neue Wache: jedes Keyword muss in der Suche einen Treffer finden. Dabei zwei eigene Fehler: ein Tippfehler, den die Deckungsprüfung fing, und eine verhaltensgleiche Mutation, die grün blieb |
| `drei-pflichtangaben-statt-einer.md` | Gestern „nur noch die Kennungen" geschrieben — wieder zu früh. Die restlichen Merchant-Pflichtangaben durchgezählt: **Marke, Beschreibung und Bild fehlten alle drei**. Die Marke stand auf jeder Artikelseite und in **keiner** der 43 Feedzeilen, weil die `HERSTELLER`-Tabelle im Bauwerkzeug lag statt im Modul (verlegt nach `src/hersteller.js`; jetzt 23 von 43, der Rest nicht bestimmbar und deshalb gemeldet statt geraten). Beschreibung aus Katalogfeldern gebaut. **Das Bild kann hier niemand schließen** — es gibt keine Produktfotos, nur eingebettete SVG-Zeichnungen; eine Beschaffungsaufgabe wie die GTIN, die auf keiner Liste stand. Alle drei löst dieselbe Artikelliste aus dem Kundenkonto |
| `feed-ohne-adresse.md` | Fünfmal geschrieben: „nicht einreichbar, weil die GTIN fehlt". Die Auszeichnung trug aber **gar keine Produktadresse** — und `link` ist für einen Produktfeed Pflicht. Der Feed wäre an dem Tag, an dem die Kennungen eintreffen, als vollständig gemeldet und trotzdem abgelehnt worden; ein Testfall („Mit GTIN ist derselbe Feed einreichbar") hat es bestätigt statt gefunden, weil die Vorrichtung dieselbe Lücke hatte wie die Wirklichkeit. Für den zweiten Kanal ebenso schwer: Ein Sprachmodell konnte den Preis nennen, aber nicht, wo. Dabei gefunden: **keine der 81 Seiten trug `rel="canonical"`** — jetzt jede, die Startseite auf die Wurzel |
| `empfindlichkeit-des-falschen-plans.md` | `src/empfindlichkeit.js` rechnete mit **0,35 Rohmarge und Gate 1** — dem Modell, das der Auftraggeber am 22.08. verlassen hat, und in die günstige Richtung. Bei 25 % ist die Rohmarge **empfindlicher** (Elastizität 2,24 statt ~1,6) und die einzige Annahme, die kippen kann. Der Grenzwertvergleich war fest auf „kleiner" gestellt — die einzige Grenze des laufenden Modells gehört aber zum Werbeanteil und wird beim *Steigen* gerissen: eine Wache, die in die falsche Richtung sah. Und kein Werkzeug hat das Modul je aufgerufen. Neu: `npm run empfindlichkeit`, `data/zielgroessen.json` mit Herkunft je Zahl. Erstmals gegeneinander gehalten: **Besucherbedarf 3.350/Monat gegen 4.340 € Werbebudget — das Modell schreibt sich selbst 1,30 € Klickpreis vor**, mitten im Marktband. Drei Proben wurden rot an Schwellen, die beim alten Modell abgeschrieben worden waren |
| `messliste-fuer-das-laufende-modell.md` | Die vorbereitete Suchvolumenmessung (Gate 15) führt bis heute die **Radon-Keywords** — wer misst, misst ein Modell ohne Kampagne, ohne Landeseiten und ohne Budget. Und sie misst **österreichweit**, während in fünf Bezirken geworben wird. Neu: `npm run messliste` erzeugt 32 Begriffe aus `keywords.csv` mit dem Liefergebiet als Ort (33 bis zum 01.09., dann fiel „Kaminkopf Regenhaube“ weg). Die Schwelle ist diesmal **abgeleitet statt gesetzt**: Der Plan braucht 200 Klicks, also 2.500–6.700 Suchanfragen je Monat. Befund, den ich nicht erwartet hatte: **wahrscheinlich bindet der Markt und nicht das Geld** — bei 1.000 Suchen/Monat werden aus 45 Tagen sechs Monate, und 225 €/Monat bleiben liegen. Die Messung kostet nichts und ist der einzige Punkt der Kette, der ohne Freigabe beantwortbar ist |
| `wann-kein-verkauf-eine-antwort-ist.md` | Die Frage, die zur Kaufquotenannahme gehört und nie gestellt wurde: **Was weiß man, wenn ein Monat Werbung nichts verkauft?** Bei 10 € Tagesbudget und 1,50 € Klick sind das 200 Klicks — und bei einer wahren Quote von 1 % ist ein leerer Monat noch mit **13,4 %** zu erwarten. Ein leerer Monat widerlegt nichts. Neu: `npm run werbeprobe` und die **vorher festgelegte Abbruchregel**, gezählt in Klicks statt in Tagen: 299 Klicks (≈ 449 €) schließen 1 % aus → auf Kamin verengen; 598 Klicks (≈ 897 €) schließen 0,5 % aus → Klickkanal beenden. Der Haken trägt die ganze Regel: Gezählt werden kann nur im Posteingang des Betreibers — **die E-Mail-Adresse ist nicht nur der Kontakt, sondern das einzige Messgerät des Versuchs** |
| `pr-beschreibung.md` | Die **Quelle der PR-Beschreibung**, bisher nur auf GitHub. Sie war an neun Stellen überholt — 616 Testfälle bei über 1.000, 77 Seiten bei 81, 23 Gates bei 24, „Domain und Hosting" als offener Punkt, obwohl bauversand.com entschieden ist. Keine dieser Zahlen war je falsch; sie waren einmal richtig und sind es nicht geblieben. Das Erste, was der Auftraggeber liest, hatte als einziges Artefakt keine Quelle im Verzeichnis |
| `schaufenster-drift.md` | `npm run pruefe-schaufenster` misst 24 Kennzahlen der Beschreibung gegen den Bestand und liest jede Zahl **dort, wo sie steht**. Drei Ausgänge statt zwei: `veraltet`, `anker` (das Muster findet nichts mehr — wer den Satz umschreibt, nimmt der Wache den Halt) und `ungemessen`. Für Zahlen, die sich täglich ändern, eine Untergrenze statt eines genauen Werts: Ein Prüfer, der nach jeder neuen Probe rot ist, wird abgeschaltet |
| `preis-von-gestern.md` | Drei Dinge, die heute stimmen und kein Ablaufdatum eingebaut hatten. Der Satz „Vorschau ohne Bestellmöglichkeit" stand fest verdrahtet im Fuß **aller 81 Seiten**, während Kasse und Startseite denselben Stand längst aus `startklar()` rechnen — er wäre am Tag des Onlinegangs stehengeblieben. Die **Preisbasis hat nie jemand gemessen**: ältester Einkaufspreis 132 Tage, Median 50; ein alter Einstand ist die Marge von gestern, ausgewiesen als die von heute. Neuer Prüfer `pruefe-preisalter`, Grenze 90 Tage als **Setzung gekennzeichnet** (der Preisrhythmus des Lieferanten ist unbekannt). Die erste Fassung hätte wegen eines Dübels für 2,15 € die WDVS-Kampagne angehalten — eskaliert wird jetzt nur, wo ein Gebot auf dem Preis ruht. Und der Prüfer der Prüfer kannte den neunten Prüfer nicht: „8 Prüfer befragt", vollständiges Ergebnis über unvollständige Liste. Register nach `src/pruefregister.js`, an `package.json` gebunden |
| `paletten-die-es-nicht-gibt.md` | Zwei Befunde an derselben Kette. **14 von 36 Keywords** enthielten ein Wort, das auf ihrer Landeseite nirgends steht — wer „Armierungsgewebe" sucht, bezahlt den Klick und liest „Glasgewebe". Und keine Gruppenseite sagte „kaufen", „bestellen" oder „Warenkorb": Werbebudget auf eine Seite ohne Bestellweg. Schwerer wiegt der zweite: **sechs von sechs Anzeigengruppen warben mit Paletten**, kein einziger der 46 Artikel wird palettenweise verkauft — „Palette" steht in `data/` nur als Kostenposition des Lieferanten. Zwei Sätze gingen sogar gegen den eigenen Katalog („Kein Sackverkauf" bei zwei Sackartikeln). Neue Regel: *Wir bieten nur auf Wörter, die wir auch sagen* — plus `GEBINDEAUSSAGEN`, geprüft gegen die Einheiten des Katalogs statt gegen eine Liste |
| `liefergebiet-auf-der-seite.md` | Die Anzeige verspricht „Lieferung Perg bis Linz", die Landeseite nannte weder Gebiet noch Fracht: **3 von 81 Seiten** trugen das Liefergebiet, keine der drei Landeseiten des ersten Anlaufs. Es stand in `llms.txt`, `areaServed` und der Kasse — an allen drei Orten, an denen eine **Maschine** liest, an keinem, an dem der Besucher liest. Jetzt im Seitenfuß aller 81 Seiten und über dem Warenraster jeder Gruppenseite, aus `LIEFERGEBIET` erzeugt. Dabei gefunden: Der am 27.08. zurückgenommene Satz „Frachtpauschale auf jedem Beleg" stand noch an drei Stellen **im Shop**, einer davon mit Stand 28.08. — geschrieben nach dem Widerruf. `pruefe-widerrufe` las nur `docs/`; die Reichweite stand im Werkzeug und war damit von keiner Probe messbar. Verlegt nach `src/widerruf.js`, 219 → 315 Dateien, vier Fundstellen berichtigt (darunter „25 % Zuschlag" im Kopfkommentar von Gate 20) |
| `gegenprobe-die-nicht-ankam.md` | Dreimal an einem Tag kam meine eigene Mutation nicht an — zerlegte Maskierung, `\n` als echter Zeilenumbruch — und der Testlauf über den unveränderten Code meldete Grün. Eine Gegenprobe, die nicht ankommt, sieht aus wie eine bestandene. `npm run gegenprobe` nimmt die Texte aus Dateien, prüft **zuerst**, ob die Mutation ankommt, und kehrt den Ausgangscode um: bestanden heißt, der Test ist rot geworden. Danach sechs der heutigen Zusicherungen damit nachgeprüft — alle halten |
| `blindstelle-die-ich-selbst-gemacht-habe.md` | Erste Aufgabe für das Gegenprobenwerkzeug: Seit der Budgetkonzentration sah `pruefeTexte` nur noch die drei ausgegebenen Anzeigen — in der zurückgestellten Gruppe Kanal stand weiter „PVC Kanal ab Lager". Ein Fehler mit bekanntem Auslösetag, und die Blindstelle war Folge meiner eigenen Änderung. Das Werkzeug fand zudem, dass mein erster Testfall die **Schreibweise** prüfte statt des Verhaltens |
| `schreibweise-statt-verhalten.md` | Die Fehlerklasse vom Abend nachgezählt: Zwölf Testdateien lesen Quelltext, die meisten prüfen damit Ausgaben. Eine prüfte die **Schreibweise** — `assert.match(quelle, /beurteile\(…\)/)` blieb grün, als die Mutation den Aufruf stehen ließ und sein Ergebnis wegwarf. Das Werkzeug hätte jeden Prüfer als grün mit 99 Einheiten gemeldet: der zustimmende Prüfer, gegen den das Modul gebaut ist. Ersetzt durch einen Abgleich der gemeldeten Zahlen mit den Prüfern selbst |
| `fuenf-kilo-die-anderthalb-waren.md` | Die Landeseite gelesen, wie ein Kunde sie liest: Zwei Artikelkarten trugen ein **falsches Maß** — „5 kg" auf einem 1,5-kg-Eimer, „55 m" auf einer 2,55-m-Leiste. Das Muster griff den Rest einer Dezimalzahl; derselbe Fehler war am 28.08. schon einmal fallweise behoben worden. Regel jetzt in `mass()`. Die Gegenprobe zeigte, dass eine grün bleibende Mutation eine Frage ist, keine Entwarnung |
| `segment-arbeitsplatzmessung.md` | Nebenstrecke, kein eigenes Segment |
| `strategie-modellvergleich.md` | Kapitalweg braucht ~900.000 €; enthält überholte Empfehlung |
| `anschreiben-entwuerfe.md` | Drei Anschreiben (Hersteller, Großhändler, Partnerbetriebe), versandfertig, nicht versendet |

### Korrekturen, die im Verlauf nötig waren

Damit niemand einer überholten Aussage folgt:

| Ursprünglich | Korrigiert zu |
|---|---|
| Pflicht nur in 104 Schutzgemeinden | Vorsorgegebiet ist nahezu ganz Österreich; nur die Drainage hängt an den 104 |
| Kein spezialisierter Wettbewerber | RadonTec/radonshop.com existiert, Schwerpunkt aber Sanierung im Bestand |
| Markt 10–25 Mio. € | 4–21 Mio. €; die erste Zahl zählte Wohnungen statt Gebäude |
| Digitale BauKG-Vorlagen empfohlen | Fällt durch Gate 2, Markt besetzt |
| Content-Seite am passivsten und damit erste Wahl | Scheitert an der Reichweite |
| Dosimeter-Verkauf als Funnel-Einstieg | Unzulässig; Vermittlung an anerkannte Messstelle |
| Arbeitsplatz-Messpflicht österreichweit | Nur für spezielle Arbeitsplätze; Frist lief 2022 ab |
| Anlaufverlust 8.000–12.000 € vorab | Gilt nur für „Shop zuerst"; gestuft sind es 2.700 € bis zur ersten Einnahme |
| Modellwahl als offene Blockade | Vertagt auf Ende Stufe 2, weil Stufe 0–2 für beide Modelle gleich sind |
| Modellwahl überhaupt | **Gegenstandslos seit 22.08.**: eigene Baumeisterpreise, 25 % Marge, regional. Die Zeile darüber und die ganze Radon-Rechnung beschreiben ein abgelöstes Vorhaben |
| „32 % Rohmarge sind die Untergrenze" (`PARAMETER.md`) | Abgelöst durch Gate 20: positiver Deckungsbeitrag je Bestellung, in Euro geprüft |
| „Es kann nichts bestellt werden" als letztes Wort der Startseite | Stimmt weiter, war aber unvollständig: Eine gerechnete Anfrage ist möglich, und die Seiten sagen es jetzt (29.08.) |
| Ein Regelwerk kann die Warengruppe aus der Bezeichnung raten | 0 von 16 auf zurückgehaltenen Daten; die Gruppe ist eine Entscheidung dieses Shops, keine Eigenschaft des Artikels (29.08.) |
| Ø Warenkorb 450 €, 54 Bestellungen | 650 € und 37 Bestellungen — die Stückliste liegt deutlich höher |
| Materialwert je Gebäude reine Schätzung | Aus Stückliste hergeleitet, amtlich gegengeprüft |
| FAGG-Rücktritt als Hauptrisiko des Shops | Entfällt im reinen B2B-Geschäft; dafür Auflage, Verbraucher wirksam auszuschließen |
| „Unabhängig von meiner Person" als Zielbild | An eine messbare Marke gebunden: Beratungsanfragen je Bestellung ≤ 0,2 |
| Sechs Adressaten für Anschreiben A | Zwölf — mit sechs wäre Gate 0 in 42 % der Fälle gar nicht entscheidbar |
| Messdauer rund drei Monate | Sechs Monate nach Radonschutzverordnung — die tote Zeit verdoppelt sich |
| Strecke 2 mit 0,5–1,5 % Ende-zu-Ende | 0,05–0,45 %; die Spanne war aus den eigenen Teilquoten nicht ableitbar |
| Radon als Mengenquelle des Leadmodells | Den Motor liefern die Feuchtethemen; Radon liefert die Alleinstellung |
| Feuchtethemen als sichere Mengenquelle | Von ISOTEC und GETIFIX besetzt, samt Kostenrechner und Betriebsvermittlung — ungeprüft |
| Österreich als dünn besetzte Chance in Gruppe C | Eine Frist, keine Lücke — ISOTEC gründet ab H2 2026, zuerst Wien, Tirol, Vorarlberg |
| Keyword-Werkzeug als nützliche Ergänzung | Entscheidet über beide Modelle — auch der Shop braucht 1.850 organische Besuche |
| „A entscheidet den Shop, B das Leadmodell" | Zu sauber gezeichnet: A entscheidet nur den Shop, B beide |
| Sessionbedarf Shop 1.850/Monat | 1.900–2.550 — die alte Zahl war der beste Fall: ohne Gebühren und bei 35 % statt der zulässigen 32 % |
| Kostenseite ohne Zahlungsgebühren | 0–871 €/Monat je nach Zahlweg, bis 16 % des Zielgewinns — fehlten in Phase 3, 4 und 5 |
| Restaufwand ohne Datenfeed ~12 h/Monat | ~15 h — UID-Abfrage und Auftragsbestätigung fehlten in der Tabelle, zusammen 3,1 h |
| Deckungsbeitrag 6.050 € | Rechnerisch 6.024 €; die Kaskade ist um 0,4 % zu hoch, aber in die sichere Richtung |
| Break-even ≈ 10–11 Bestellungen | 7 Bestellungen — die Stückzahl stammte aus dem alten Warenkorb von 450 € |
| Margenschwelle 28 % im master-prompt | 32 %, seit die Zielgröße auf netto umgestellt wurde |
| „Bei den Gates anhalten und warten" | Ersetzt durch die Freigaberegeln — Gates werden selbst entschieden |
| Hauff-Technik als Lieferant gelistet | Gestrichen; Hauseinführungen sind nach Gate 5 kein Sortimentsbestandteil |
| Leadmodell braucht 1.270 Sessions | ~2.550 — der Weg der noch nicht Gemessenen war übersprungen |
| Radonkarte als Lizenzrisiko für den Rechner | Die rechtlich entscheidende Liste ist Verordnungstext und damit frei |
| Shop als Standardweg, Leadmodell als Auffangnetz | Gleichrangig; der Bestandsbezug ist das robustere Fundament |
| Inhalte zuerst zur Neubaupflicht | Zuerst Bestandsthemen — sie hängen an keinem schrumpfenden Nenner |
| Partnerbetriebe in den 104 Radonschutzgemeinden | Gebietseinheit ist der politische Bezirk; die 104 bestimmen nur die Ausbaufolge |
| Gebietsexklusivität als reines Verkaufsargument | Zugleich Voraussetzung für eine wirksame Einwilligung — Struktur ab Tag 1, Bezahlung ab Stufe B |
| Leadmodell braucht weniger Reichweite als der Shop | Falsch; es braucht mehr. Break-even- und Kapitalvorteil bleiben |
| Messeinstieg erzeugt einen Kundendatensatz | Nein — die Messung ist kostenlos, also gibt es keine Transaktion |

## Zum Arbeitsloop

**Neu gefasst am 29. August.** Hier stand bis dahin, der Loop arbeite am
Stufenmodell und der Lieferantenlandkarte und nehme „die eigentliche Arbeit"
auf, „sobald eine der beiden Freigaben vorliegt". Beides gehört zum
abgelösten Radon-Modell; die zwei Freigaben gibt es nicht mehr. Ein Lauf, der
diesen Absatz für aktuell hielt, hätte auf etwas gewartet, das nie kommt.

**Was der Loop tut.** Er arbeitet ab, was ohne Entscheidung, Freigabe oder
Geld möglich ist, und das ist am Shop derzeit reichlich. Der Reihe nach
brauchbare Einstiege:

1. `npm run startklar` — sagt aus den Daten, was zwischen hier und „online"
   steht. Was dort bei „Auftraggeber" steht, kann der Loop **nicht**
   schließen; er kann es nur vorbereiten, damit es am Tag der Antwort läuft.
2. Die neun Prüfer laufen lassen und **einem Befund nachgehen**, statt einen
   neuen Prüfer zu bauen. `npm run pruefe-pruefer -- --mit-browser` sagt
   zuerst, ob überhaupt jeder etwas angesehen hat.
3. Eine Zusage suchen, die keine Probe widerlegen kann — und die Probe
   nachziehen. Die Gegenprobe steht dabei **vor** der Zusage: Wer eine neue
   Prüfung schreibt, schaltet erst das Geprüfte ab und sieht nach, ob sie
   umfällt.

**Was der Loop nicht tut:** Dokumente ohne Adressaten erzeugen. Findet ein
Durchlauf keine Aufgabe, prüft er den Stand und endet ohne neue Datei.

**Wo die offenen Fäden liegen:** in „Was als Nächstes gebraucht wird" weiter
oben. Alle sieben Zeilen dort brauchen den Auftraggeber.
