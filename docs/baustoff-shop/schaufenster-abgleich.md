# Schaufenster-Abgleich: was wo angezeigt wird, und ob es stimmt

Stand: 2026-09-03. Am 17. August stand hier schon einmal derselbe
Befund: **Eine nicht mitgezogene Anzeige ist eine stille
Falschaussage.** Dieses Dokument führt alle veröffentlichten Anzeigen und
hält fest, welche mitwandert und welche bewusst stillsteht — damit der
nächste Lauf nicht raten muss.

> **Berichtigt am 3. September.** Die Tafel darunter stand acht Tage auf dem
> 26. August und trug Zahlen: „77 Seiten", „616 Testfälle", „26.08., abends".
> Alle drei waren längst überholt, während das Dokument sie als *gültig*
> auswies. **Ein Register der Stände, das selbst einen Stand hat, ist ein
> Schaufenster** — und die eigene Regel weiter unten („wer eine Zahl in einem
> Schaufenster ändert, ändert sie in allen") galt für alle außer für dieses.
>
> Die Tafel führt deshalb keine Zahlen mehr. Sie führt, was nicht altert:
> **welches Modell** eine Anzeige zeigt, **ob sie mitwandert oder stillsteht**
> und **wo die gültige Fassung liegt**. Die Zahlen stehen dort, wo ein Prüfer
> sie misst.

## Der Bestand an Schaufenstern

| Anzeige | Zeigt | Modell | Zustand — und wo die gültige Fassung liegt |
|---|---|---|---|
| **PR #14, Beschreibung** | den ganzen Vorhabenstand | Baustoff | **wandert mit.** Quelle im Verzeichnis: `pr-beschreibung.md`; ihre Zahlen misst `npm run pruefe-schaufenster` gegen den Bestand |
| [Baustoffe zum Baumeisterpreis](https://claude.ai/code/artifact/fe6d720d-473d-4af5-a26b-6fcfbea929dc) | die Website | Baustoff | **steht still**, Momentaufnahme aus dem August. Der gültige Bau entsteht mit `npm run website` und liegt in `ausgabe/site/` |
| [Was 25 % Marge tragen](https://claude.ai/code/artifact/6e356abb-b5d3-44a9-9b8d-f98a13fb0502) | die Kalkulation | Baustoff | **überholt und nicht ersetzbar** — fünf abgewiesene Veröffentlichungsversuche. Gültig ist `zuschlag-seite.html` im Verzeichnis; die PR-Beschreibung weist die Anzeige ausdrücklich als überholt aus |
| [Der Weg zum ersten Klick](https://claude.ai/code/artifact/44ba340b-a126-457c-96d5-64fc34efa3a4) | den Ablaufplan | Baustoff | **steht still**, Momentaufnahme aus dem August. Gültig ist `weg-zum-ersten-verkauf-nachgerechnet.md` |
| [Radonvorsorge Österreich](https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c) | den Radon-Bericht | **Radon** | **steht bewusst still**, Stand 17. August 2026 — gilt für sein Modell, siehe den Abschnitt darunter. Quelldatei `bericht-radon.html` |
| [Radonvorsorge Fachhandel](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8) | das Radon-Funktionsmuster | **Radon** | **steht bewusst still** — gilt für sein Modell |
| `shop/demo.html` | dasselbe Funktionsmuster als Datei | **Radon** | wird bei jedem `npm run build` neu erzeugt; der Baustoff-Shop liegt in `ausgabe/website.html` |

**Ein Einfrierdatum ist keine Kopie.** Wo eine Anzeige stillsteht, ist ihr
Stand eine feste Tatsache und altert nicht — deshalb steht er dabei. Was
gefehlt hat, war eine Quelle dafür: Der Radon-Bericht stand mit drei
verschiedenen Daten in drei Dateien (16.08. in `PARAMETER.md`, 17.08. in
`STATUS.md`, 18.08. hier). Maßgeblich ist, was die Anzeige selbst trägt, und
das steht in ihrer Quelldatei `bericht-radon.html`: **Stand 17. August 2026.**

**Keine Zahl über den heutigen Bestand in dieser Tafel.** Das ist die Lehre aus acht Tagen: Eine Zahl
hier ist eine Kopie, und Kopien altern. Was der Bau heute umfasst, sagt
`npm run alles`; was die PR-Beschreibung behauptet, misst
`npm run pruefe-schaufenster`.

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
