# Die ersten echten Zahlen — und was sie über das Modell sagen

Stand: 2026-08-22, Zahlen überarbeitet 2026-08-25. **Die Rechnungen sind gefunden.** Nicht im Repository,
sondern dort, wo sie hingehören: in Drive und im Postfach des
Auftraggebers. Damit ist der Blocker gefallen, an dem alles hing — und
die erste vollständig ausgelesene Rechnung beantwortet die Kernfrage
des neuen Modells.

## Vorbemerkung: Dieses Repository ist öffentlich

Beim Prüfen der Ablage ist aufgefallen, dass
`freudenthalerried-cmd/matlab` auf **public** steht. Deshalb steht in
diesem Dokument **kein einziger Einkaufspreis**. Die Konditionen, die
ein Lieferant einem Baumeister einräumt, sind dessen Geschäftsgeheimnis
und zugleich die Verhandlungsposition des Auftraggebers; sie in ein
offenes Verzeichnis zu schreiben, wäre ein Fehler, den man nicht
zurücknehmen kann. Die Rechenwege stehen hier, die Zahlen bleiben beim
Auftraggeber.

**Empfehlung:** Vor dem Einpflegen echter Preise das Repository auf
privat stellen — oder die Preisdaten dauerhaft außerhalb halten
(Preisdatei in `.gitignore`, Zugriff über eine lokale Datei).

## Was gefunden wurde

**„Peither" ist der Steuerberater, nicht der Lieferant.** Die
Bürozubau-Rechnungen laufen über dessen Buchhaltung — daher die
Formulierung in der Weisung. Die tatsächlichen Baustofflieferanten sind
andere:

| Lieferant | Rechnungen | Rolle |
|---|---|---|
| **Poschacher Baustoffhandel** | 17 im Postfach | Hauptlieferant, Baustoffgroßhandel |
| **Quarzolith** (Mörtelerzeugung Sattledt) | 1, vollständig ausgelesen | Werk, Mörtel und Kleber |
| **Pramer Baustoffe** | 1 erfasst, weitere Angebote | Baustoffhandel |
| GK-Dach, LW Hochbau | je 2 | Bauleistung, keine Handelsware |

In Drive liegen vier Aufstellungen; die jüngste enthält **eine Rechnung
vollständig mit Positionen**, die übrigen nur Kopfdaten. Die
Positionsdaten der anderen stecken in PDF-Anhängen im Postfach — **die
kann diese Umgebung nicht öffnen**; das Gmail-Werkzeug gibt Anhänge
nicht heraus.

> **Nachtrag 25.08.:** Die fünfzehn Poschacher-Belege sind inzwischen
> vollständig ausgelesen — 70 Positionen, 46 Handelswaren, jede mit
> Listenpreis und Rabattsatz. Zwei Aussagen dieses Dokuments sind damit
> überholt: die Nebenkostenquote (6,6 % statt „ein Fünftel") und die
> Annahme, der Katalog werde ein bis zwei Dutzend Artikel umfassen.
> Der vollständige Befund steht in `katalog-aus-rechnungen.md`.

## Erster Befund: Eine Baustoffrechnung ist kaum ein Katalog

Von den acht Positionen der ausgelesenen Rechnung sind **zwei
verkaufbare Artikel**. Der Rest ist Silo mit Mischer, Krangebühr,
Transportpauschale, Schrumpffolie, Paletten und Energiekostenzuschlag —
Logistik und Nebenkosten, knapp ein Fünftel des Rechnungsbetrags.

Das ändert die Erwartung an den Katalogaufbau: Siebzehn Rechnungen
ergeben keine siebzehn mal zehn Artikel, sondern eher ein bis drei je
Rechnung. Der Katalog aus dem Bürozubau wird **klein** — mit hoher
Wahrscheinlichkeit ein bis zwei Dutzend Artikel, nicht Hunderte. Für
einen Start ist das genug; für „wenn jemand Spachtelmasse sucht" ist es
knapp, weil die gesuchte Ware zufällig dabei sein muss.

## Zweiter Befund — der entscheidende: der Preisvergleich kippt

Für den einen Kleber, dessen Einkaufspreis vorliegt, ergibt die
vorgegebene Marge von 25 % einen Bruttopreis von rund **50,70 €** je
25-kg-Sack. Der Artikel ist ein **Profi-Flexkleber** eines
österreichischen Werks. (Die erste Fassung dieses Dokuments rechnete
mit 25 % *Zuschlag* und kam auf 47,54 €; die Weisung vom 25.08. hat das
auf 25 % *Marge* geklärt, siehe `marge-25-prozent.md`.)

Was ein Kunde sieht, der bei Google Shopping „Flexkleber 25 kg" sucht:

| Anbieter | Produkt | Preis brutto |
|---|---|---|
| BAUHAUS | Eigenmarke Flexkleber 25 kg | rund 10 € |
| OBI | Fliesenkleber flexibel 25 kg | 10,49 € |
| HORNBACH | Baumit FlexSteinkleber 25 kg | 54,99 € |
| **hier** | **Profi-Flexkleber 25 kg** | **rund 51 €** |

**Der Einkaufsvorteil trägt gegen den Fachhandel, aber nicht gegen die
Baumarkt-Eigenmarke.** Das ist keine Frage des Zuschlags: Selbst ohne
jeden Aufschlag läge der Profi-Kleber beim Dreifachen des
Baumarktprodukts. Es sind verschiedene Warenklassen — nur sieht das der
Preisvergleich nicht.

Daraus folgt eine Korrektur an der Vertriebsidee, und sie ist
folgenreich:

> **Auf generische Suchbegriffe („Flexkleber", „Spachtelmasse") ist
> dieser Shop nicht konkurrenzfähig, und er wird es nie sein.** Dort
> gewinnen Baumarkt-Eigenmarken. Konkurrenzfähig ist er auf
> **Produktnamen** („Quarzolith FK500") und auf **Fachanforderungen**
> („Trass-Bettbeton", „Flexkleber C2TE S1 für außen") — dort vergleicht
> der Kunde Gleiches mit Gleichem, und dort zählt der Einkaufsvorteil.

Das deckt sich mit dem Sichtbarkeitskonzept: Wer über KI-Antworten
gefunden werden will, gewinnt mit der **spezifischen** Frage, nicht mit
der allgemeinen. Für Google Shopping heißt es: Gebote auf
Markenbegriffe, nicht auf Gattungsbegriffe. Der Werbeanteil, an dem das
Modell nach `rechnung-zum-zuschlag.md` ohnehin hängt, entscheidet sich
genau hier.

## Dritter Befund: Gate 20 an echten Zahlen

Mit dem realen Kleberpreis und den Frachtsätzen der Rechnung:

| Bestellung | Fracht | frei Haus | Fracht verrechnet |
|---|---|---|---|
| 1 Sack | 25 € | **−15,40 €** | +9,18 € |
| 4 Sack | 25 € | +14,16 € | +38,74 € |
| 12 Sack | 80 € | +37,99 € | +116,65 € |
| 30 Sack | 80 € | +215,35 € | +294,01 € |

Bei der **Transportpauschale von 80 €**, die auf der echten Rechnung
steht, trägt eine frei-Haus-Bestellung erst ab rund **344 € Warenkorb**
— das sind gut acht Sack Kleber. Ein einzelner Sack, geliefert, ist ein
Verlust von 15,40 €.

Die Empfehlung aus `rechnung-zum-zuschlag.md` bestätigt sich damit an
echten Zahlen: **Fracht verrechnen, Mindestbestellwert setzen.** Beides
ist keine Feinheit, sondern die Bedingung, unter der das Modell
überhaupt rechnet.

## Was jetzt zu tun ist

1. **Repository auf privat stellen** oder Preisdaten dauerhaft
   außerhalb halten — vor dem ersten echten Preis.
2. ~~Die PDF-Rechnungen auslesen.~~ **Erledigt am 25.08.** — alle
   fünfzehn Belege, 70 Positionen, mit Summenprobe je Beleg geprüft.
   `katalog-aus-rechnungen.md`.
3. **Sortiment nach Vergleichbarkeit ordnen**, nicht nach Warengruppe:
   Was trägt einen Markennamen, unter dem verglichen wird? Das gehört
   in den Shop. Was gegen Baumarkt-Eigenmarken antritt, gehört nicht
   hinein.
4. Erst danach Google-Shopping-Gebote — und zwar auf Marken- und
   Fachbegriffe.
