# Belege an den Kunden — und ein Steuerbefund, der vorher niemandem aufgefallen ist

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/beleg.js`,
15 Testfälle.

Bis hierher erzeugte der Shop nur eine Richtung: Bestellungen an die
Lieferanten. Was fehlte, war das Dokument, das der Kunde bekommt. Es entsteht
jetzt aus demselben Warenkorb, damit Angebot, Rechnung und
Lieferantenbestellung gar nicht erst auseinanderlaufen können.

Beim Bauen ist etwas aufgefallen, das über den Beleg hinausgeht und in die
Kalkulation gehört. Der Reihe nach.

## Die drei Schwellen des § 11 UStG

Die Pflichtangaben einer Rechnung hängen in Österreich am **Bruttobetrag**, und
zwar in drei Stufen:

| Gesamtbetrag brutto | Was verlangt wird |
|---|---|
| bis 400 € | Kleinbetragsrechnung: sechs Angaben genügen (§ 11 Abs 6 UStG) |
| über 400 € | zusätzlich Empfänger, Rechnungsnummer, UID des Ausstellers, Netto und Steuer getrennt |
| über 10.000 € | zusätzlich die **UID des Leistungsempfängers** (§ 11 Abs 1 Z 2 UStG) |

`erforderlicheMerkmale(bruttobetrag)` bildet das ab, `pruefeRechnungsmerkmale`
benennt jede fehlende Angabe einzeln. Für das durchgerechnete Referenzgebäude —
12 × 10 m, vier Durchführungen, mit Drainage, **3.900,20 € brutto** — greift die
mittlere Stufe.

Eine Nebenwirkung, die hier als Glücksfall verbucht werden darf: Die dritte
Stufe ist für diesen Shop keine Hürde. Gate 7 verlangt die UID des Kunden
ohnehin bei jeder Bestellung, um Verbraucherbestellungen auszuschließen. Eine
Auflage, die aus dem Konsumentenschutzrecht kommt, erfüllt nebenbei eine
umsatzsteuerliche Pflicht — und zwar genau bei den großen Warenkörben, bei
denen ein Fehler teuer wäre.

## Der Befund: Streckengeschäft ist Reihengeschäft

Zwei der drei geplanten Lieferanten sitzen in Deutschland. Wenn ein deutscher
Hersteller im Streckengeschäft direkt an eine österreichische Baustelle
liefert, sind drei Beteiligte an einer einzigen Warenbewegung beteiligt. Das
ist ein **Reihengeschäft**, kein gewöhnlicher Einkauf.

Die Zuordnung ist im Regelfall eindeutig, weil der Lieferant befördert:

```
Hersteller (DE)  →  wir (AT)  →  Kunde (AT)
Ware bewegt sich direkt vom Hersteller zur Baustelle.

bewegte Lieferung  = DE → AT: steuerfreie innergemeinschaftliche Lieferung
                     gegen unsere UID
ruhende Lieferung  = AT → Kunde: steuerbar in Österreich, 20 % USt
```

**Praktische Folge in zwei Sätzen.** Die Eingangsrechnung aus Deutschland kommt
*ohne* Umsatzsteuer und ist als innergemeinschaftlicher Erwerb zu erklären. Die
Ausgangsrechnung an den österreichischen Kunden trägt trotzdem 20 %.

Das ist keine Steuerberatung und ersetzt keine. Es ist die Angabe, welche Frage
zu stellen ist — und bei zwei von drei Lieferanten ist sie zu stellen.
`reihengeschaeftEinordnung()` erkennt den Fall am Herkunftsland des Lieferanten
und schreibt den Hinweis in die Kasse, statt ihn in einer Fußnote abzulegen.
Dafür trägt jeder Lieferant in `data/lieferanten.json` jetzt ein Feld `land`;
ein Testfall besteht darauf.

### Was daran für die Kalkulation zählt

Zwei Dinge, beide bisher nicht festgehalten:

**Erstens: Die Einkaufspreise sind Nettopreise, und zwar wirklich.** Aus
Deutschland kommt keine Vorsteuer, die man sich zurückholt — es kommt gar keine
Umsatzsteuer. Wer die deutschen Listenpreise versehentlich als Bruttopreise
liest, rechnet sich um 19 % reicher. Die Margenrechnung in `preis.js` arbeitet
durchgehend netto und ist davon nicht betroffen; die Gefahr liegt beim
Abtippen, und genau deshalb gibt es den CSV-Import.

**Zweitens: Die Kleinunternehmerregelung ist keine Option.** Sie endet seit 2025
bei 55.000 € Umsatz im Kalenderjahr, mit einer Toleranz bis 60.500 €. Die
Zielgröße dieses Vorhabens liegt bei **24.200 € Umsatz im Monat**, also rund
290.000 € im Jahr — die Grenze ist um das Fünffache überschritten, bevor das
Ziel erreicht ist.

Auch für die Anlaufphase hilft sie nicht: Ein Kleinunternehmer hat keinen
Vorsteuerabzug, und beim Einkauf im Ausland bleibt die Steuer trotzdem an ihm
hängen — entweder als deutsche Umsatzsteuer, die niemand erstattet, oder ab der
Erwerbsschwelle als österreichische Erwerbsteuer ohne Abzug. In beiden Fällen
sind es rund 20 % auf den Einkauf, und die Rohmarge trägt keine 20 %. Sie hat
laut Gate 1 gerade einmal 32 % zu bieten.

**Planungsentscheidung: Regelbesteuerung von Anfang an, UID von Anfang an.**
Das war ohnehin die Annahme; jetzt ist es begründet statt vorausgesetzt.

## Was gebaut wurde

| Funktion | Zweck |
|---|---|
| `erforderlicheMerkmale` | welche Angaben ein Beleg über diesen Betrag tragen muss |
| `pruefeRechnungsmerkmale` | benennt jede fehlende Pflichtangabe einzeln |
| `erzeugeAngebot` | Angebot mit Bindefrist, Teillieferungen ausgewiesen |
| `erzeugeRechnung` | Rechnung mit sichtbaren Lücken statt stiller |
| `darfRechnungGestelltWerden` | die Sperre — dieselbe Haltung wie bei der Bestellung |
| `reihengeschaeftEinordnung` | erkennt den Auslandsfall und benennt die Folge |

Das Angebot trägt eine **Bindefrist von vierzehn Tagen**. Ohne Bindefrist bindet
ein Angebot nach § 862 ABGB für eine angemessene Zeit, und was angemessen ist,
entscheidet im Streitfall jemand anderer. Bei Herstellerpreisen, die sich
zwischendurch ändern, ist das keine gute Idee.

Die Rechnung wird **immer erzeugt und getrennt geprüft**. Ein Entwurf mit
sichtbaren Lücken ist besser als gar keiner: Er zeigt, welche Angabe fehlt,
statt die Rechnung zu verweigern und den Grund für sich zu behalten. Im
Funktionsmuster steht deshalb heute:

```
Keine Rechnung. Offen sind:
· Pflichtangaben nach § 11 UStG fehlen: Name und Anschrift des liefernden
  Unternehmers, UID-Nummer des Ausstellers
· Katalog enthält Platzhalterpreise — der ausgewiesene Betrag wäre erfunden
```

Zwei Lücken, beide vom Betreiber zu füllen, beide namentlich. Der dritte Grund
ist der bekannte: Solange Platzhalterpreise im Katalog stehen, wäre der
ausgewiesene Betrag erfunden. Eine erfundene Rechnung ist schlimmer als eine
fehlende — sie wird bezahlt.

## Ein Fehler im eigenen Bauschritt

Der Rechenkern wird beim Bauen aus den Modulen zu einem einzigen Skript
zusammengefügt. Getrennte Module dürfen denselben Namen tragen; im
zusammengefügten Skript teilen sie sich einen Gültigkeitsbereich. Eine
Hilfsfunktion `EUR` gab es in `bestellung.js` und in `beleg.js` — das ergibt
einen `SyntaxError`, und der legt die **ganze Seite** still.

Die Testfälle blieben grün, weil sie die Module einzeln laden. Aufgefallen ist
es erst bei der Prüfung im Browser.

Zwei Konsequenzen, beide gezogen:

1. `EUR` und `LUECKE` stehen jetzt einmal in `src/format.js`.
2. `build-demo.mjs` prüft das Bündel selbst auf doppelte Deklarationen und
   bricht ab. Der Wächter hat beim ersten Lauf sofort eine **zweite** Kollision
   gefunden, von der bis dahin niemand wusste: `LUECKE` in `rechtstexte.js` und
   `beleg.js`.

Der Fall gehört ins Protokoll, weil er zeigt, wo die Testfälle nicht hinsehen.
Grüne Tests bedeuten hier: die Module rechnen richtig. Ob die ausgelieferte
Datei überhaupt startet, ist eine andere Frage — und die beantwortet nur der
Browser.

## Was daraus für die Anfragen an die Hersteller folgt

Eine Ergänzung für die Anschreiben in
[`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md), die bisher fehlte —
und sie lautet anders, als man zuerst denkt. Der erste Entwurf dieses Absatzes
sagte „bei den deutschen Herstellern klären, dass ohne Umsatzsteuer fakturiert
wird". Ein Blick in
[`phase2-lieferantenlandkarte.md`](./phase2-lieferantenlandkarte.md) zeigt, dass
das zu kurz greift: BMI führt DE/AT, Sika CH/AT, Liapor AT/DE. Mehrere der
Empfänger haben eine österreichische Gesellschaft.

Die richtige Frage ist deshalb nicht, wo der Hersteller sitzt, sondern **wer
fakturiert**:

| Es fakturiert | Folge |
|---|---|
| die österreichische Gesellschaft | Inlandsgeschäft, 20 % USt, Vorsteuerabzug, kein Reihengeschäft |
| die deutsche Gesellschaft | Reihengeschäft, Eingangsrechnung ohne USt, innergemeinschaftlicher Erwerb |
| eine Schweizer Gesellschaft | **weder noch** — Einfuhr, Zoll, Einfuhrumsatzsteuer |

Der dritte Fall betrifft Sika und Ampack und ist der unangenehmste: Bei einem
Direktversand aus der Schweiz an die Baustelle stellt sich zusätzlich die Frage,
wer als Anmelder auftritt. Das gehört vor eine Aufnahme ins Sortiment geklärt,
nicht danach.

Der Unterschied entscheidet über 19–20 % auf jeden Einkauf, und er steht auf
keiner Preisliste. Ein Satz im Anschreiben klärt ihn. Entwurf A enthält ihn
noch nicht; der Punkt ist in
[`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md) unter „Was vor dem
Versand zu klären ist" eingetragen.

Die Anschreiben werden dadurch nicht versendet — die Freigabe dafür steht
weiterhin aus. Der Punkt steht bereit, wenn sie kommt.
