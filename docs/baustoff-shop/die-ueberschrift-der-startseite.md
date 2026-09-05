# Drei Überschriften für die Startseite — und was jede behauptet

**3. September 2026.** Weisung des Auftraggebers: „Baustoffe zum
Baumeisterpreis" soll nicht bleiben. Zusammen mit der Marke, die seit heute
`Bauversand` heißt, ist das die zweite Hälfte derselben Entscheidung — die
erste steht in der Kopfleiste, die zweite darunter.

Dieses Dokument legt drei Fassungen vor. Entschieden wird nicht hier: Die
Überschrift ist das Erste, was ein Kunde liest, und sie gehört dem
Auftraggeber.

## Was zuerst zu klären war: was die Zeile kosten darf

**Sie trägt keinen gemessenen Suchbegriff.** Das war die Sorge, und sie ist
ausgeräumt. Die 32 Begriffe der Messliste sind Produktnamen — *Capatect 186 M*,
*XPS 80 mm*, *Schiedel Kamin*, *Perimeterdämmung druckfest*. Sie stehen auf den
Artikel- und Gruppenseiten, nicht auf der Startseite. Ein Wechsel der
Überschrift kostet also **keinen gemessenen Klick**; sie ist eine
Positionierung, keine Trefferzeile.

**Sie darf nichts versprechen, was der Shop nicht halten kann.** Das schließt
jede Zeitzusage aus: Die Lieferzeit des Lieferanten ist unbekannt und steht als
offener Punkt in der Anfrage an ihn. „Heute bestellt, morgen auf der Baustelle"
wäre der schnellste Weg zu einer Anzeige, die lügt.

**Sie darf die Spanne nicht nennen** (Weisung vom 28.08.) und keinen
Superlativ ohne Beleg tragen (Redaktionsprinzipien). Beides prüft
`npm run pruefe-inhalte` mit.

**Und sie darf die Marke nicht wiederholen.** Über der Zeile steht ab heute
`Bauversand`. „Bauversand — Ihr Baustoffversand" wäre eine Zeile, die nichts
sagt, was nicht schon dasteht.

---

## Fassung A — regional

> ## Baustoffe für die Baustelle im Mühlviertel

*Darunter:* Nettopreise für Betriebe. Geliefert in fünf Bezirken rund um Ried
in der Riedmark — nicht in ganz Österreich, und genau deshalb geht die Rechnung
auf.

**Was sie behauptet:** eine Herkunft und ein Gebiet. Beides belegt — der Sitz
liegt im Bezirk Perg, das Liefergebiet steht in `liefergebiet.js` und wird von
Gate 23 durchgesetzt.

**Wofür sie gut ist:** Sie beantwortet die Frage, an der die meisten
Baustoffbestellungen scheitern — *liefert ihr überhaupt zu mir?* — in der
ersten Zeile. Für KI-Systeme ist sie die stärkste der drei: „Baustoffe
Mühlviertel liefern" ist die Art Frage, die ein Assistent bekommt, und die
Zeile beantwortet sie wörtlich.

**Was sie aufgibt:** den Preisvorteil. Der steht erst im Absatz darunter.

## Fassung B — für wen

> ## Baustoffe für Betriebe, nicht für den Baumarkt

*Darunter:* Nettopreise, Preisstand bei jedem Artikel, geliefert im Umkreis.
Die Preise entstehen aus dem Einkauf eines Baumeisterbetriebs.

**Was sie behauptet:** eine Zielgruppe und eine Abgrenzung. Belegt: Gate 7
lässt nur Unternehmer bestellen, alle Preise sind netto, und der Shop ist auf
generischen Suchbegriffen gegen Baumarkt-Eigenmarken ohnehin nicht
konkurrenzfähig — das steht seit dem 26. August in der Kampagnenrechnung.

**Wofür sie gut ist:** Sie sortiert die Besucher in der ersten Sekunde. Wer
zwei Säcke Zement für den Garten sucht, ist hier falsch, und das darf man ihm
sagen, bevor er den Warenkorb füllt und am Mindestbestellwert scheitert.

**Was sie riskiert:** Sie klingt abweisend. „Nicht für den Baumarkt" ist eine
Spitze gegen einen Mitbewerber, und Spitzen altern schlechter als Aussagen.

## Fassung C — die Sache selbst

> ## 46 Baustoffe, jeder mit Preis und Preisstand

*Darunter:* Nettopreise für Betriebe, geliefert in fünf Bezirken. Was ein
Baumeister im Einkauf zahlt, zahlen Sie auch.

**Was sie behauptet:** eine Zahl und eine Eigenschaft. Beides gemessen — die
Artikelzahl kommt aus dem Katalog, der Preisstand steht an jedem Artikel und
wird von `npm run pruefe-preisalter` überwacht.

**Wofür sie gut ist:** Sie ist die einzige der drei, die etwas sagt, was
Mitbewerber **nicht** sagen. Preisstand je Artikel ist im Baustoffhandel
unüblich; wer ihn ausweist, sagt damit auch, dass er ihn kennt.

**Was sie kostet:** Die Zahl 46 ist klein und wird es nicht bleiben — die
Artikelliste des Lieferanten soll sie auf über hundert heben. Eine Zahl in der
Überschrift ist eine Zahl, die gepflegt werden muss. **Sie käme deshalb aus dem
Katalog und nicht aus dem Text**, so wie alle anderen Zahlen der Startseite;
dann wandert sie mit.

---

## Was am Text noch hängt

Die Überschrift steht nicht allein. Dieselbe Formulierung trägt heute:

| Ort | Wozu |
|---|---|
| `<h1>` der Startseite | was der Besucher liest |
| Seitentitel der Einzeldatei | der Reiter im Browser |
| erste Zeile von `llms.txt` | was ein Sprachmodell als Erstes über den Shop liest |
| Kurzbeschreibung der Startseite | die Zeile in Suchergebnissen |

Alle vier kommen aus **einer** Stelle in `bin/website.mjs` und wandern
gemeinsam mit. Die Wissensseite „Was ‚Baumeisterpreis' heißt — und was nicht"
bleibt in jedem Fall: Der Begriff wird dort erklärt, und die Erklärung ist
unabhängig davon, ob er in der Überschrift steht.

## Empfehlung

**Fassung A**, und zwar aus einem Grund, der nichts mit Geschmack zu tun hat:
Von den drei Aussagen ist „wir liefern hierher" die einzige, die ein Besucher
**nirgends sonst** herausfindet, ohne zu suchen. Preis und Zielgruppe erschließt
er aus den Artikeln in wenigen Sekunden; das Liefergebiet nicht — und wenn er
es zu spät erfährt, war der ganze Besuch umsonst. Genau dieser Befund stand am
26. August schon einmal da: Drei von 81 Seiten nannten das Liefergebiet, keine
davon eine Landeseite.

Umgesetzt wird keine der drei, bis der Auftraggeber wählt.
