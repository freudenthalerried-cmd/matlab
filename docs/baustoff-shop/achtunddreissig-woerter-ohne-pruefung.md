# Achtunddreißig Wörter ohne Prüfung

**6. September 2026, nachts.** Die Runde davor endete mit einem benannten
offenen Punkt: Das Keyword „Drainage Grundmauerschutz" bietet auf ein Wort, das
das eigene Register als nicht geführt führt — und keiner der beiden Prüfer sah
es, weil jeder nur sein eigenes Register kennt.

Beim Nachsehen fiel der größere Befund auf. Die Kampagne rechnet **98
Keywords**. Geprüft wurden:

```
Landeseite sagt die Wörter des Keywords     nur erster Anlauf   60 von 98
Landeseite verneint das Wort                nur erster Anlauf   60 von 98
eigene Suche beantwortet das Keyword        nur erster Anlauf   60 von 98
```

Die 38 Keywords der zurückgestellten Gruppen **Kanal, Mörtel und Mauerwerk**
gingen durch keine einzige Prüfung — und standen in **keiner** Ausgabedatei.
Sie existierten nur im Speicher des Laufs.

> **Ein Prüfer, dessen Reichweite kleiner ist als die Reichweite der Regel, die
> er prüft.** Die Regel gilt für jedes Wort, auf das dieser Betrieb je bietet,
> nicht für die, auf die er zuerst bietet.

Die Gruppen sind zurückgestellt, bis eine Kaufquote gemessen ist — der
Rolloutplan sieht ihr Dazukommen ausdrücklich vor. **Am Tag, an dem eine Gruppe
dazukommt, hätte sie eine ungeprüfte Keywordliste vorgefunden**, und niemand
hätte es gemerkt: Die Prüfungen hätten weiter grün gemeldet, weil sie diese
Wörter nie gesehen haben.

---

## Der erste Lauf über alle 98

**Drei Keywords beantwortet die eigene Suche nicht:**

| Keyword | was gemessen war |
|---|---|
| `Ziegel 50 cm` | 0 Treffer — obwohl der Ziegel im Regal liegt |
| `Kanalbogen DN 100` | 0 Treffer — obwohl der Bogen im Regal liegt |
| `Mauermörtel Palette` | 0 Treffer — und das zu Recht |

**Fünf Keywords sagt ihre Landeseite nicht:** `Kanalschacht 800`, `Drainage
Grundmauerschutz`, `Noppenbahn Grundmauer`, `Leichtmörtel Palette`,
`Planziegel kaufen`.

Acht offene Entscheidungen aus einer einzigen Reichweitenerweiterung. Keine
davon ist mit einem Suchwort zu erledigen — der Fehler vom 1. September wäre
gewesen, die Suche so lange zu füttern, bis die Anzeige etwas findet.

---

## Was entschieden wurde, und warum

**Zwei Mal war der Shop im Recht und die Suche im Unrecht:**

* **`Ziegel 50 cm`.** Der Ziegel heißt „Ökotherm HL N+F **10 50 23,8 cm**" —
  dreimal Zentimeter, einmal geschrieben, wie es auf jedem Lieferschein steht.
  Vereinheitlicht wurde nur die Zahl unmittelbar vor der Einheit: `238mm`. Die
  50 blieb eine nackte Zahl, die Anfrage suchte `500mm`.
  > **Ein Maß, dessen Einheit am Ende steht, gilt für alle Zahlen davor.**
  Das betrifft nicht nur diesen Ziegel: „Isover TDPT **20** 1200 600 mm" ist
  20 mm dick, und genau danach fragt ein Bauleiter.
* **`Kanalbogen DN 100`.** DN und NW sind dieselbe Nennweite. Der Katalog des
  Lieferanten schreibt NW, die eigenen Wissens- und Systemseiten schreiben DN,
  der Kunde tippt DN. Neues Suchwort `dn` für die vier DN-100-Formteile —
  nicht für den Schachtring und nicht für den Grundmauerschutz, die keine
  Nennweitenware sind.

**Ein Mal war die Landeseite im Unrecht:**

* **`Noppenbahn Grundmauer`.** „Noppenbahn" ist unser Grundmauerschutz unter
  dem Namen, den die Baustelle sagt — das Suchregister weiß das seit dem
  27. August, die Landeseite sagte es nicht. Der Satz steht jetzt dort.

**Vier Keywords sind entfallen, jedes mit Grund:**

| Keyword | Grund |
|---|---|
| `Mauermörtel Palette` | Der ThermoMörtel ist ein Wärmedämmmörtel; wer Kalkzementmörtel sucht, bekäme das falsche Produkt. Und palettenweise verkauft dieser Shop nichts — die Anzeigentexte haben das Wort am 1. September aus demselben Grund verloren. |
| `Leichtmörtel Palette` | dieselbe Begründung |
| `Kanalschacht 800` | Wir führen einen **Schachtring**, keinen Schacht. Konus und Abdeckung fehlen, und die Abdeckung steht im Register ausdrücklich als nicht geführt. |
| `Planziegel kaufen` | Geführt ist ein Hochlochziegel mit Nut und Feder. Ein Planziegel ist plangeschliffen und wird im Dünnbett versetzt — anderes Bauteil, anderer Arbeitsgang. |
| `Drainage Grundmauerschutz` | Das Register sagt „Drainagerohre führen wir nicht", und die Landeseite sagt das Wort nicht. |

---

## Und damit schließt sich der offene Punkt von gestern

Solange auf „Drainage Grundmauerschutz" geboten wurde, war `drainage` als
Ausschluss gesperrt — **worauf geboten wird, wird nicht ausgeschlossen.** Mit
dem Wegfall des Keywords ist die Sperre weg:

```
Nicht im Sortiment: 22 von 24 Registerwörtern ausgeschlossen   (gestern 21)
zurückgehalten: abdichtung (17× eigener Text), gleitmittel (19×)
```

Der offene Punkt musste nicht entschieden werden — die größere Reichweite hat
ihn beantwortet.

---

## Geprüft

* `keywords-zurueckgestellt.csv` ist neu: Die geprüften Keywords der
  zurückgestellten Gruppen verschwinden nicht mehr, sondern stehen mit Gruppe
  und Herkunft in einer eigenen Datei. `keywords.csv` bleibt die Datei zum
  Hochladen und enthält weiter nur die Gruppen mit Budget.
* Die Probe „Jedes ausgelieferte Keyword findet seine Wörter auf der
  Landeseite" liest seither **beide** Dateien und verlangt, dass die zweite
  nicht leer ist — sonst prüfte sie wieder nur den ersten Anlauf.
* Die Probe der eigenen Suche ebenso.
* Vier neue Fälle in `test/shopkern.test.js` über den Maßlauf, dazu einer über
  den Bestand: „Ziegel 50 cm" findet den Ökotherm.
* Gegenprobe `keywords-der-zurueckgestellten-gruppen-ungeprueft` stellt die
  kleine Reichweite wieder her.

**Stand danach:** 88 Keywords statt 98, davon 60 im ersten Anlauf und 26
geprüft zurückgestellt, 2 mit Begründung verneint, **null ohne Deckung**.
