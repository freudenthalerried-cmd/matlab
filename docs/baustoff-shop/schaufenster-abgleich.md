# Schaufenster-Abgleich: was wo angezeigt wird, und ob es stimmt

Stand: 2026-08-26. Am 17. August stand hier schon einmal derselbe
Befund: **Eine nicht mitgezogene Anzeige ist eine stille
Falschaussage.** Seither sind drei Schaufenster dazugekommen und der
Bestand ist um mehrere hundert Testfälle gewachsen. Dieses Dokument
gleicht alle ab und hält fest, welches auf welchem Stand steht — damit
der nächste Lauf nicht raten muss.

## Der Bestand an Schaufenstern

| Anzeige | Zeigt | Stand | gültig? |
|---|---|---|---|
| **PR #14, Beschreibung** | den ganzen Vorhabenstand | **26.08., abends** | ja — mit Gate 21/23, 616 Testfällen und der Rekonstruierbarkeit |
| [Baustoffe zum Baumeisterpreis](https://claude.ai/code/artifact/fe6d720d-473d-4af5-a26b-6fcfbea929dc) | die Website | **26.08., 77 Seiten** | ja, zuletzt nach dem Umschreiben der Geltungsaussagen |
| [Was 25 % Marge tragen](https://claude.ai/code/artifact/6e356abb-b5d3-44a9-9b8d-f98a13fb0502) | die Kalkulation | 26.08., **vormittags** | **nein — trägt die berichtigte Gate-21-Aussage noch nicht** |
| [Der Weg zum ersten Klick](https://claude.ai/code/artifact/44ba340b-a126-457c-96d5-64fc34efa3a4) | den Ablaufplan | **26.08.** | ja, mit Rechtsseiten und GTIN-Lage |
| [Radonvorsorge Österreich](https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c) | den Radon-Bericht | 18.08. | **ja, für sein Modell** |
| [Radonvorsorge Fachhandel](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8) | das Radon-Funktionsmuster | 17.08. | **ja, für sein Modell** |
| `shop/demo.html` | dasselbe Funktionsmuster als Datei | heute neu gebaut | ja |

## Zwei Schaufenster stehen bewusst still

Die beiden Radon-Anzeigen sind **nicht veraltet, sondern gehören zu
einem anderen Modell.** Nach Gate 12 sind Shop und Leadmodell
gleichrangig, und nach der Gate-Entscheidung vom 26. August gilt für den
Radon-Streckenhandel weiterhin Gate 1 und Gate 5. Sie auf den
Baustoffstand zu ziehen hieße, zwei verschiedene Geschäfte in einer
Anzeige zu vermischen.

**Sie bleiben also stehen — und das ist eine Entscheidung, keine
Nachlässigkeit.** Damit sie nicht doch für den aktuellen Stand gehalten
werden, führt dieses Dokument sie mit Datum und Modellzuordnung.

## Zwei Anzeigen waren gültig, aber nicht vollständig — erledigt

Sie standen hier als offen, weil „später" ohne Notiz erfahrungsgemäß
„nie" heißt. Der Eintrag hat funktioniert: Im Lauf darauf sind beide
nachgezogen worden.

**Die Kalkulationsseite** hat jetzt einen eigenen Abschnitt zum Skonto —
mit der Gegenüberstellung 45.356 € gegen 38.786 € (beide bei Kartenzahlung), dem Vergleich zur
Zahlungsgebühr und Gate 21 samt der unbequemen Folge, dass ausgerechnet
der Rechnungskauf das Gate verletzt.

**Der Ablaufplan** streicht in Stufe 2 durch, was steht (46 Artikelseiten,
5 Rechtsseiten), benennt die vier fehlenden Impressumsangaben und sagt im
Abschluss, dass die GTIN der **einzige** verbleibende Punkt ist, der Arbeit
ist und nicht nur Entscheidung. „Was schon steht" führt jetzt neun Posten
statt sechs, darunter die Gates 21 und 22.

## Was `npm run build` heute verändert hat

Das Funktionsmuster meldet seit heute **vier statt drei Lieferanten**.
Der Grund ist harmlos und gehört trotzdem benannt: Am 25. August kam
`poschacher` in `data/lieferanten.json` dazu. Der Radonkatalog verweist
auf keinen seiner Artikel, die Zahl im Bauhinweis zählt aber alle
geladenen Lieferanten.

Das ist kein Fehler, aber es ist die Sorte Nebenwirkung, die man
bemerken sollte: **Eine Datei, die zwei Modelle bedient, verändert beide,
wenn man eines pflegt.**

## Die Regel, die daraus folgt

> Wer eine Zahl in einem Schaufenster ändert, ändert sie in **allen** —
> oder trägt hier ein, warum nicht.

Das ist billiger als die Alternative. Am 17. August waren drei Anzeigen
auf drei verschiedenen Ständen, und der Abgleich kostete einen ganzen
Lauf. Ein Eintrag in dieser Tabelle kostet zwei Minuten.

## Nächster Abgleich

Fällig, sobald eines der folgenden eintritt:

- ~~die Kalkulationsseite bekommt das Skonto~~ (erledigt 26.08.)
- ~~der Ablaufplan bekommt die Rechtsseiten und die GTIN-Lage~~ (erledigt 26.08.)
- ~~sechs Inhaltsseiten haben ihre Geltungsaussagen umgeschrieben~~
  (erledigt 26.08., Website neu veröffentlicht — `geltungsaussagen.md`)
- **offen: die Kalkulationsseite trägt die Berichtigung zu Gate 21 noch nicht.**
  Die Quelldatei `zuschlag-seite.html` im Repo ist berichtigt und um die
  Zahlwegtabelle erweitert; die Veröffentlichung wurde vom Artefaktdienst
  abgewiesen. Inzwischen **fünfmal**, auch nach vollständigem Lesen der
  veröffentlichten Fassung und nach einer echten inhaltlichen Erweiterung.
  Der Stand im Schaufenster sagt also weiterhin „nur der Rechnungskauf
  verletzt Gate 21" — was seit `zahlungsziel-entschieden.md` falsch ist.

  Die PR-Beschreibung weist die Anzeige seit dem 26.08. abends ausdrücklich
  als überholt aus und verweist auf die gültige Fassung im Verzeichnis —
  das ist der einzige Weg, der ohne Freigabe offensteht.

  **Kein weiterer Versuch ohne Freigabe.** Der Dienst bietet ein Überschreiben
  an, das ausdrücklich die Zustimmung des Auftraggebers verlangt; die ist nicht
  erteilt und wird nicht unterstellt. Damit steht hier der seltene Fall, dass
  eine Anzeige nachweislich falsch ist und nicht korrigiert werden kann. Die
  richtige Fassung liegt im Repo unter `docs/baustoff-shop/zuschlag-seite.html`
  und in `zahlungsziel-entschieden.md`. Ein späterer Lauf soll **nicht**
  wieder Zeit darauf verwenden.
- die GTIN trifft ein — dann ändert sich der Feedstand in allen Anzeigen
- das Repository wird auf privat gestellt — dann ändern sich die
  Hinweise zur Vertraulichkeit
