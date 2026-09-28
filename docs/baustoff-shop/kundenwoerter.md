# Achtzehn von dreiunddreißig Wörtern fanden nichts

**27. August 2026.** Der Katalog spricht die Sprache des Lieferanten. Der
Kunde tippt das Wort, das er auf der Baustelle sagt. Gemessen mit 33
geläufigen Begriffen gegen den Bestand:

| Eingabe | Treffer vorher |
|---|---|
| noppenbahn, styropor, dämmplatte, bauschaum | 0 |
| rauchfang, schornstein, kamin | 0 |
| armierungsmörtel, armierungsgewebe, anputzleiste | 0 |
| vollwärmeschutz, perimeterdämmung, sockeldämmung | 0 |
| ziegel, trittschalldämmung, tellerdübel, baufolie, pe-folie | 0 |

**18 von 33 lieferten null Treffer.** „Rauchfang" fand nichts, weil kein
Kaminartikel das Wort im Namen trägt — und das ist das österreichische Wort
für den Kamin. „Noppenbahn" fand nichts, weil der Artikel *Grundmauerschutz*
heißt. Eine Suche, die nur Artikelnamen und Lieferantennummern kennt, ist eine
Suche für den, der das Sortiment schon auswendig kann.

## Das Register

`data/suchwoerter.json`, 36 Einträge, von Hand entschieden, **mit einer
Begründung je Wort**. Keine automatische Ähnlichkeitssuche: Ein Suchwort ist
ein Versprechen, dass der gefundene Artikel die gemeinte Aufgabe erfüllt.

Ein Eintrag zeigt entweder auf einzelne Artikel („noppenbahn" → die eine
Bahn) oder auf eine Gruppe („rauchfang" → Kamin). Kundenwörter zählen im
Index als **schwacher** Treffer: Ein Artikel, der das Wort im eigenen Namen
trägt, steht immer davor.

## Die Gegenzusage, und sie ist die wichtigere

Die Datei führt auch, was **nicht** aufgenommen wurde, mit Begründung:

| abgelehnt | warum |
|---|---|
| drainage | Wir führen kein Drainagerohr. Die Noppenbahn ist Schutz- und Drainschicht, aber keine Drainage — sie hier zu finden, wäre genau die Verwechslung, vor der die Wissensseite warnt. |
| abdichtung, bitumen | Führen wir nicht. Ein Suchwort, das auf die Dämmplatte zeigt, erzeugt den Fehler, den die Systemliste verhindert: dämmen ohne abzudichten. |
| gleitmittel | Steht als Position auf der Kanalliste, ist aber kein Artikel. |
| estrichfolie | Ob die PAE-Folie für einen konkreten Estrichaufbau taugt, sagt das Merkblatt, nicht die Suche. |

> **Was der Shop nicht führt, bleibt unauffindbar.** Ein Suchwort, das
> ersatzweise auf etwas Ähnliches zeigt, verkauft das Falsche.

Diese Zusage ist als Test formuliert, nicht als Vorsatz: Trägt jemand
„drainage" ins Register ein, fällt der Testlauf um. Gegengeprobt genau so —
der Eintrag hinzugefügt, der Test fiel, der Eintrag wieder entfernt.

## Der schwächste Eintrag steht im Register selbst

„trittschalldämmung" → Isover TDPT. Die Zuordnung stammt aus dem Typenkürzel
des Herstellers, **von uns gelesen**, nicht aus einem Merkblatt — isover.at
ist aus dieser Umgebung nicht erreichbar. Das steht so in der Begründung des
Eintrags und ist damit im Register selbst nachlesbar, nicht nur hier.

## Was die zweite Gegenprobe zutage förderte

Der Test „der eigene Name schlägt das Kundenwort" ging zuerst auch dann durch,
wenn man die Kundenwörter ins **starke** Feld hob — der Artikel mit dem Wort
im Namen hatte zufällig den kürzeren Titel und gewann über den Stichentscheid.
Der Test bewies also nichts über die Gewichtung.

> **Zwei Ursachen, die zum selben Ergebnis führen, sind eine Probe, die nichts
> misst.**

Behoben, indem der Artikel mit dem Kundenwort jetzt den *kürzeren* Titel
trägt: Wäre die Gewichtung gleich, gewänne er — und der Test fällt. Mit der
Mutation fällt er tatsächlich.

Dasselbe Muster wie gestern bei „keine Kappung", nur eine Schicht tiefer: Dort
fehlte die Probe ganz, hier gab es eine, die aus dem falschen Grund grün war.

## Im Browser, nicht nur im Testlauf

Das Register wird beim Bauen in die Seitendaten gelegt. Wer das vergisst,
bekommt einen grünen Testlauf und eine stumme Suche. Zwei neue
Browser-Szenarien in `shopprobe`:

- „Wer ‚Rauchfang' tippt, findet den Kamin" — acht Vorschläge, Mantelstein
  darunter
- „Ein Wort ohne Ware im Sortiment findet keine Ware" — „drainage" liefert
  keinen einzigen Vorschlag mit Preis

## Stand

- 705 Tests grün (vorher 698; +7)
- `shopprobe` **25** Szenarien (vorher 23), `oberflaechenprobe` 11
- `pruefe-inhalte` 24/355/0, `pruefe-seiten` 54/213/0, `pruefe-widerrufe` 127
  Dateien sauber, `pruefe-pruefer` 6 Prüfer mit Umfang
- Website 81 Seiten ohne toten Verweis

## Was das für die Auffindbarkeit durch Sprachmodelle heißt

Die Weisung nennt Auffindbarkeit über KI-Systeme als Kanal. Das Register wirkt
dort mit: `llms.txt` und die Artikelseiten tragen die Lieferantennamen, das
Register trägt die Wörter, unter denen ein Mensch — oder ein Modell, das für
ihn sucht — dieselbe Ware benennt. Es ist absichtlich klein und begründet
statt groß und automatisch: Ein Register, das alles mit allem verbindet,
findet für jede Frage etwas und ist deshalb wertlos.
