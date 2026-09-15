# Vier von vier Systemen unvollständig — und alle drei Anzeigen versprechen das Gegenteil

**2. September 2026.** Nach sieben Stunden am Prüfwerkzeug habe ich mir
angesehen, was am Shop selbst offen ist, und bin bei den drei Anzeigen des
ersten Anlaufs gelandet — bei dem, was ein Besucher liest, für den 4,19 € bis
8,22 € bezahlt werden.

## Was die Anzeigen versprachen

| Gruppe | Klickpreis | Versprechen |
| --- | ---: | --- |
| WDVS | 4,19 € | „Fassade komplett liefern" · „Das komplette Fassadensystem **aus einer Hand**" |
| Dämmung | 5,91 € | „XPS und EPS in **allen gängigen Stärken**" |
| Kamin | 8,22 € | „Kaminzug **komplett**" · „Der **ganze** Zug" · „Deshalb **komplett**" |

## Was die eigenen Systemlisten sagen

Alle vier Systemlisten des Shops benennen Positionen, die er nicht führt — und
sie tun es vorbildlich, in der Tabelle gekennzeichnet und im Fließtext
wiederholt:

| Systemliste | nicht geführt |
| --- | --- |
| `fassade-100-qm` (WDVS) | **die Dämmplatte in Flächenstärke** |
| `kellerwand-perimeter` (Dämmung) | Abdichtung, Abschlussschiene, Verfüllmaterial |
| `kanal-dn100` (Kanal) | Übergangsstücke, Gleitmittel, Abschlussschiene |
| `kaminzug` (Kamin) | Anschlussformteil der Feuerstätte |

Bei WDVS ist es nicht irgendeine Position, sondern **die Schicht, aus der eine
Fassadendämmung besteht.** Die Seite sagt es wörtlich:

> Die Dämmplatte selbst führen wir derzeit nicht in Flächenstärke. Im Sortiment
> stehen Fassadenplatten nur in dünnen Stärken.

Nachgezählt: Fassaden-EPS gibt es in **2, 3 und 5 cm**. Eine WDVS-Dämmung
beginnt bei acht. XPS dagegen hält, was die Anzeige sagt — 30, 50, 80 und
100 mm liegen im Katalog.

> **Ein Vollständigkeitsversprechen ist eine Aussage über den Katalog, nicht
> über die Absicht.**

Der Besucher klickt für 4,19 € auf „Fassade komplett" und findet die Hauptsache
nicht. Die Inhaltsseiten sind ehrlich; die Anzeige, die den Besucher dorthin
bezahlt, war es nicht.

## Dieselbe Familie, dritte Ebene

Am 31. August fiel „**ab Lager**" bei einem Betrieb ohne Lager. Am 1. September
fielen die **Paletten**, die kein Artikel ist. Heute die **Vollständigkeit**.

Dreimal dasselbe: Eine Anzeige behauptet etwas über den Bestand, das der Bestand
nicht hergibt. Und dreimal war der Widerspruch im selben Verzeichnis
nachlesbar — nur nicht an derselben Stelle.

## Berichtigt

| statt | jetzt |
| --- | --- |
| Fassade komplett liefern | Armierung bis Oberputz |
| Das komplette Fassadensystem aus einer Hand — geliefert … | Armierung, Putzgrund, Oberputz und Zubehör — geliefert … |
| XPS und EPS in allen gängigen Stärken, geliefert … | XPS von 30 bis 100 mm, EPS als Ausgleich — geliefert … |
| Kaminzug komplett | Kaminzug in einer Lieferung |
| Der ganze Zug: Fertigfuß, Mantelsteine, … | Fertigfuß, Mantelsteine, gedämmtes Rohr, Putztür und Haube. |
| … Deshalb komplett. | … Die Stückliste sagt es vorher. |

Die Aufzählungen bleiben — sie sind wahr und konkret. Weg ist nur das Wort, das
mehr behauptet als die Liste dahinter. Beim Kamin fehlt eine von zehn
Positionen; „in einer Lieferung" stimmt, „komplett" nicht.

## Die Prüfung

`npm run kampagne` liest jetzt die **eigenen Systemlisten**: `gruppe:` aus dem
Kopf, der Lückensatz aus dem Text. Nennt eine Systemliste für eine Gruppe eine
nicht geführte Position, darf keine Anzeige derselben Gruppe Vollständigkeit
versprechen — fünf Muster: *komplett*, *aus einer Hand*, *alle gängigen*,
*vollständig*, *das ganze System*.

Geprüft wird gegen die Systemliste und nicht gegen eine zweite Aufzählung
daneben. Wer eine Lücke schließt, schließt damit auch die Prüfregel.

**Der erste Lauf fand sofort zwei weitere** — in der zurückgestellten Gruppe
Kanal: „Kanal komplett liefern" und „abgestimmt und komplett", bei drei
fehlenden Positionen. Dieselbe Stelle wie am 31. August, als dort „PVC Kanal ab
Lager" stehen geblieben war: **Was pausiert ist, wird nicht gelesen.** Auch
berichtigt.

Eine Meldung je Feld, nicht je Muster — „Das komplette System aus einer Hand"
trifft zwei Muster und ist ein Satz. Ein Prüfer, der denselben Satz zweimal
meldet, wird nach dem Wortlaut gelesen und nicht nach der Zahl.

Gegenprobe im Register: „Armierung bis Oberputz" zurück auf „Fassade komplett
liefern" — der Lauf meldet rot. **Zehn von zehn Gegenproben schlagen an.**

## Was offen bleibt

Die Lücke selbst. Der Shop kann kein WDVS liefern, solange die Dämmplatte in
Flächenstärke fehlt — und sie fehlt, weil der Katalog aus fünfzehn
Lieferantenrechnungen stammt und dort keine steht. **Die Artikelliste des
Lieferanten löst auch das**, zusätzlich zu GTIN, Marke, Bild und der Weisung
über hundert Artikel. Sie ist damit der fünfte offene Punkt, der an derselben
einen Anfrage hängt.

Bis dahin ist die richtige Anzeige die, die nur nennt, was im Regal liegt.

## Die Frage für den nächsten Lauf

> **Was verspricht der Shop dem Besucher, das er erst nach dem Klick
> zurücknimmt?**

Die Anzeigen sind durchgesehen. Die Gruppenseiten, auf denen der Besucher
landet, und die Startseite sind es nicht — und dort steht mehr Text als in
allen Anzeigen zusammen.
