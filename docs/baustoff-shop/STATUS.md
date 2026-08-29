# Status und Einstieg

Stand: 2026-08-29. **Dieses Dokument zuerst lesen.** 155 Arbeitsdateien
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
> **18 von 33 Suchbegriffen fanden nichts** — „Rauchfang", „Noppenbahn",
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
> `pruefe-quellen` 6/6, `shopprobe` 28, `oberflaechenprobe` 11, Website 81
> Seiten ohne toten Verweis.

> **29. August — sechzehn Läufe.** Ausführlich je ein Dokument.
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
> **Stand der Prüfmittel:** 833 Tests, `pruefe-tests` 832/0, `pruefe-preise` 46/0, `pruefe-inhalte`
> 24/355/0, `pruefe-seiten` 60 von 81 gebauten Seiten (die übrigen 23 tragen
> nur Text aus `inhalte/`, dort geprüft), `pruefe-widerrufe` 167 Dateien/48
> Fundstellen, `pruefe-quellen` 6/6, `shopprobe` 45 (davon 10 im Rahmen),
> `oberflaechenprobe` 11, `rahmenzensus` 81/81, `pruefe-stand` 166/166,
> `pruefe-pruefer` 11 Prüfer ohne Leerlauf, Website 81 Seiten ohne toten
> Verweis.

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
| **Domain und Hosting** | eine Entscheidung | die Seite existiert im Netz statt nur im Repository |
| **Rechtstexte** (AGB, Widerruf, Datenschutz) | ein Rechtstexteanbieter | verbindlicher Wortlaut statt Gerüst mit Begründungen |
| **Repository privat schalten** | einen Klick | 44 von 46 Einkaufspreisen sind heute aus zwei veröffentlichten Zahlen rekonstruierbar |
| **Mindestbestellwert entscheiden** | eine Entscheidung | palettierte Bestellungen unter ~114 € Warenwert tragen sich nicht (Gate 20) |

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
| `zweiter-lieferant-und-skonto.md` | **3 % Skonto sind mehr wert als die gesamte Zahlungsgebühr** — und **Gate 21** setzt es durch: Das Kundenzahlungsziel darf die Skontofrist nicht überschreiten. Nur der Rechnungskauf kann das Gate verletzen, und genau der ist im Baustoffhandel üblich. — beide Lieferanten geben 3 % bei 14 Tagen, Fracht ausgenommen. Das hebt die Marge von 25 auf 27,25 % und senkt den nötigen Monatsumsatz von 45.356 auf 38.786 €, also um ein Siebtel. Folge: Die Kundenzahlungsfrist darf die Skontofrist nicht überschreiten (AGB Punkt 9, bisher nicht bedacht). Pramer als zweiter Lieferant gefunden, aber **nicht** in den Katalog übernommen — Angebot statt Rechnung, kein Listenpreis, Maßware, und das XPS ist nicht dasselbe. Auslesewerkzeug hatte einen stillen Nullfund (`/Type/Page` gegen `/Type /Page`), behoben |
| `rechtstexte-stand.md` | **Fünf Rechtsseiten als Gerüst mit sichtbaren Lücken** — Impressum aus belegbaren Firmenbuchdaten, vier Pflichtangaben ausdrücklich offen statt geraten; AGB in 13 Punkten und Datenschutz in 9 Punkten als Gliederung mit Begründung, Wortlaut vom Rechtstexteanbieter. Widerruf entfällt bei reinem B2B — aber nur, solange Verbraucherbestellungen wirksam ausgeschlossen sind |
| `werkzeuge/` | **Die Auslesekette liegt im Repository** — `entpacken.py`, `pdftext.py`, `positionen.py` samt README; sie existierte bisher nur in einem flüchtigen Container |
| `shop/inhalte/` + `npm run website` | **Die Website steht: 72 Seiten** — 46 Artikelseiten, 13 Wissensseiten, 3 Systemlisten, 7 Warengruppen, Lieferung und Start. Alle 23 Inhaltsseiten gehen ohne Verdacht durch `npm run pruefe-inhalte`; drei Beanstandungen wurden belegt statt weggeschaltet. Zwei Ausgaben aus einer Quelle: `ausgabe/site/` zum Hochladen (robots.txt, llms.txt, sitemap.xml, JSON-LD) und `ausgabe/website.html` als Einzeldatei. Neu: `src/markdown.js` ohne Fremdpaket. [Vorschau](https://claude.ai/code/artifact/fe6d720d-473d-4af5-a26b-6fcfbea929dc) |
| `kampagne-gerechnet.md` | **Die Kampagne ist importfertig und pausiert** — sechs Anzeigengruppen, Gebote aus dem Deckungsbeitrag des Referenzwarenkorbs gerechnet statt geschätzt: Kamin 8,79 €, Dämmung 6,48 €, WDVS 4,19 € gegen einen Markt von 0,50–2,50 €; Kanal, Mörtel und Mauerwerk knapp bei ~1,85 €. Zwei Regeln stehen jetzt im Programm statt im Dokument: kein Artikel am Listendeckel bekommt eine Anzeige, kein Gebot ohne Deckung. `npm run kampagne` |
| `katalog-aus-rechnungen.md` | **Die Rechnungen sind ausgelesen** — 15 Belege, 70 Positionen, 46 Handelswaren mit Listenpreis und Rabattsatz; Summenprobe je Beleg deckte vier Parserfehler auf, die Preisbasis „per 1000" eine fünfte. Zentraler Befund: Der Einkaufsvorteil ist extrem ungleich verteilt — tief bei Dämmung, Kanal und Systemware, dünn bei Kleinteilen. **Kleinteile gehören nicht als Suchartikel in den Shop**, das dreht die frühere Staffelungsempfehlung um. Preisdaten liegen unter `preise/` und sind gitignoriert |
| `marge-25-prozent.md` | **„25 %" heißt Marge, nicht Zuschlag** — nötiger Umsatz 45.356 € statt 72.740 €, 70 statt 112 Bestellungen, Werbeanteil trägt bis 23 % statt 18 %; frei-Haus-Schwellen fallen um ein Fünftel; der Preisvorteil gegenüber dem Fachhandel schrumpft von 14 % auf 8 %; Vorschlag für gestaffelte Margen liegt bei |
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

**Läufe vom 29. August** — die sechzehn Dokumente dieses Tages:

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
