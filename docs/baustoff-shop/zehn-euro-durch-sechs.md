# Zehn Euro durch sechs — ein Budget, das für Rauschen bezahlt

**31. August 2026.** Beim Nachsehen der Anzeigentexte war mir aufgefallen,
dass ich am Vormittag eine Entscheidung dokumentiert hatte — *erster Anlauf nur
auf die tragenden Gruppen* —, die das Werkzeug nicht kennt. Es lieferte
weiterhin alle sechs Kampagnen aus. Eine Entscheidung, die nur im Dokument
steht, ist keine.

Beim Beheben kam ein größerer Befund heraus.

## Die Rechnung

`kampagnen.csv` teilte das Tagesbudget gleichmäßig: `tagesbudget /
gruppen.length`, also zehn Euro durch sechs = **1,67 € je Gruppe und Tag.**
Was das kauft:

| Klickpreis | sechs Gruppen | konzentriert |
|---|---|---|
| 0,50 € | 3,3 Klicks/Tag je Gruppe | 10,0 |
| 1,00 € | 1,7 | 5,0 |
| 1,50 € | 1,1 | 3,3 |
| 2,50 € | **0,7** | 2,0 |

Und daraus, auf den Monat und bei 1 % Kaufquote:

| Klickpreis | Klicks/Monat je Gruppe | Bestellungen |
|---|---|---|
| 0,50 € | 100 | 1,00 |
| 1,00 € | 50 | **0,50** |
| 1,50 € | 33 | **0,33** |

> **Bei gestreutem Budget bringt im erwarteten Fall keine einzige Gruppe eine
> Bestellung im ersten Monat.** Und aus fünfzig Klicks ohne Bestellung lässt
> sich die Kaufquote auch nicht schätzen — die wahre Quote kann dann alles
> zwischen null und zwei Prozent sein. Man bezahlt für Rauschen und lernt
> nichts.

Dasselbe Geld auf die tragenden Gruppen gelegt: 150 Klicks je Gruppe und
Monat, **1,5 Bestellungen**. Der erste Verkauf ist im erwarteten Fall im
ersten Monat drin — und das ist das Ziel, das der Auftraggeber gesetzt hat.

## Das Kriterium kommt aus den Parametern, nicht aus meiner Meinung

Eine Gruppe gehört in den ersten Anlauf, wenn ihr Deckungsbeitrag die
Werbekosten auch beim **oberen** Marktklickpreis trägt:

```
Werbekosten je Verkauf = MARKT_CPC.oben / kaufquote = 2,50 € / 2 % = 125 €
```

| Gruppe | Deckungsbeitrag | trägt 125 €? |
|---|---|---|
| Kamin | 410,94 € | ja |
| Dämmung | 295,42 € | ja |
| WDVS | 209,40 € | ja |
| Mörtel | 92,51 € | nein |
| Kanal | 69,07 € | nein |
| Mauerwerk | 61,81 € | nein |

**Berichtigung an mich selbst:** `weg-zum-ersten-verkauf.md` hatte am selben
Tag „nur Kamin und Dämmung" festgelegt — aus einer Tabelle, die ich über drei
Kaufquoten gespannt und dann nach dem pessimistischsten Fall entschieden
hatte. Die aus den Parametern abgeleitete Schwelle ergibt **drei** Gruppen.

Der gerechneten Regel gebührt der Vorrang vor meiner Vorabfestlegung. Wer eine
Zahl von Hand aus einer Tabelle abliest, liest sie so ab, wie er sie erwartet
hat; wer sie rechnen lässt, bekommt sie so, wie sie ist. Das ist dieselbe
Lektion wie beim Mühlviertel und bei der Domain, nur diesmal gegen mich
selbst.

## Was ausgegeben wird

`kampagnen.csv`, `anzeigen.csv`, `anzeigengruppen.csv` und `keywords.csv`
führen nur noch den ersten Anlauf — drei Kampagnen zu **3,33 € je Tag**, das
volle Budget, nur konzentriert. Ein Keyword ohne Anzeigengruppe lädt nicht,
und eine Anzeige für eine Gruppe ohne Budget wirbt nicht; alle vier Dateien
führen deshalb dieselbe Menge Gruppen.

Die übrigen drei stehen in **`spaeter-pruefen.csv`**, mit Deckungsbeitrag,
Höchstgebot, Schwelle und Begründung. Zurückgestellt, nicht verworfen: Sobald
eine **gemessene** Kaufquote vorliegt, verschiebt sich die Schwelle, und die
Rechnung entscheidet neu. Getrennte Datei, damit niemand sie versehentlich mit
hochlädt und das Budget wieder streut.

Trägt keine Gruppe die Schwelle, bricht das Werkzeug ab: Ein Budget auf alle
zu verteilen hieße, es gleichmäßig zu verlieren.

## Zum fünften Mal dieselbe Falle

Eine Probe von gestern verlangte „mindestens vier Anzeigen". Als das Budget
konzentriert wurde, fiel sie um — obwohl nichts kaputt war. Sie maß den
Bestand von gestern statt der Regel; es ist der **fünfte** Fund dieser Sorte
in diesem Projekt.

Geprüft wird jetzt die Zusicherung: **je Kampagne genau eine Anzeige**, aus
der Kampagnendatei abgeleitet statt als Zahl hingeschrieben.

## Gegenproben

| Mutation | erkannt |
|---|---|
| Budget wieder auf alle sechs gestreut | ja |
| alle Gruppen wieder in `kampagnen.csv` | ja — 3 rot |
| Keywords folgen dem Anlauf nicht | ja |
| Schwelle auf null — nichts wird zurückgestellt | ja — 3 rot |

`pruefe-tests` meldete danach eine Schleife ohne Längenzusicherung — ergänzt.

## Was das nicht ändert

Die Kampagnen bleiben **pausiert**, und die Kette zum Werbeweg ist unverändert
lang: Rechtstexte, Zahlungsanbieter und die GTIN-Liste stehen aus. Geändert
hat sich, dass am Tag des Schaltens das Budget dort liegt, wo es rechnerisch
einen Verkauf bringen kann, statt gleichmäßig auf sechs Gruppen zu verdunsten.

## Stand

1016 Testfälle grün (vorher 1013), `pruefe-tests` 1014/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 212/212.
