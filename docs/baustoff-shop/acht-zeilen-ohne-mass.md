# Acht Zeilen ohne Maß

**6. September 2026, nachts.** Die Runde davor endete mit einem Satz, der wie
ein Vorbehalt aussah und in Wahrheit eine Aufgabe war:

> *„Die Sichtweite von ±8 Zeilen ist eine Zahl ohne Messung. **Nicht
> angefasst** — eine Zahl zu ändern, für die man kein Maß hat, tauscht nur eine
> Vermutung gegen eine andere."*

Richtig. Die Folgerung daraus ist nicht, die Zahl zu lassen, sondern **das Maß
zu holen**.

---

## Was die Zahl entscheidet

`findeWiderrufe` deckt eine zurückgenommene Aussage, wenn ihr Widerruf **in
Sichtweite** steht: ±8 Zeilen im Fließtext. Die Konstante steht seit dem
31. August da, ohne dass je jemand nachgesehen hätte, wie viel davon gebraucht
wird.

Sie hat zwei Fehlerrichtungen, und sie sind ungleich:

| Zu klein | Zu groß |
|---|---|
| **Fehlalarm.** Der Prüfer meldet eine Aussage, deren Berichtigung zwei Zeilen weiter steht. Laut, sichtbar, harmlos. | **Falsche Deckung.** Ein Nachbarabsatz über etwas anderes deckt eine Falschangabe zu. Still. |

Die gefährliche Richtung ist die zweite, und sie ist an diesem Bestand schon
zweimal eingetreten: am 2. September durch **Tabellennachbarn**
(`STATUS.md` ist eine einzige lange Tabelle, acht Zeilen weiter steht ein
fremder Eintrag) und am 5. September durch den **Kopfvermerk**, der ein Wort
aus der Umgebungsliste eines Eintrags gelten ließ. Beide sind behoben. Die
dritte Möglichkeit — ein Nachbarabsatz im Fließtext — hängt an genau dieser
Zahl.

---

## Das Maß

Für jede gedeckte Fundstelle die **kleinste** Sichtweite, bei der ihr Widerruf
noch im Fenster liegt. Über die Akte, 78 Fundstellen im Fließtext (die 27
Tabellenzeilen und die 23 durch Kopfvermerk gedeckten zählen nicht mit — sie
haben ein anderes Sichtfeld):

```
38× ±0   14× ±1   6× ±2   7× ±3   4× ±4   4× ±5   2× ±6   2× ±7   1× ±8
```

> **Zwei Drittel aller Widerrufe stehen in derselben oder der nächsten Zeile.
> Und genau eine Fundstelle im ganzen Bestand lag bei ±8 von ±8 — am Rand.**

Die eine war `zwei-ried.md:53`: der Satz, der „Ried im Innkreis" als
Beispielwert einsetzt. Der Widerruf dazu stand acht Zeilen höher („Der Irrtum
lag auf der bequemen Seite"). Eine eingefügte Zeile dazwischen, und der Prüfer
hätte die Stelle gemeldet — kein stiller Schaden, aber ein Fehlalarm an einer
Stelle, an der alles richtig ist.

**Geändert wurde nicht die Konstante, sondern der Satz.** Er nennt jetzt auf
seiner eigenen Zeile, was mit dem Wert nicht stimmt:

> „…setzte „Ried im Innkreis" ein — **irrtümlich, der Sitz liegt in Ried in der
> Riedmark** —, und ab da war der Beispielwert die Behauptung"

Das ist die bessere Änderung, weil sie den Text besser macht: Ein Leser, der an
dieser Zeile stehen bleibt, liest nicht mehr einen falschen Bezirksnamen ohne
Warnung. Danach:

```
Die knappste Deckung liegt bei ±7 von ±8.
```

---

## Was jetzt anders ist

`npm run pruefe-widerrufe` gibt die Verteilung und die knappste Deckung **bei
jedem Lauf** aus, mitsamt dem Zusatz „— **also am Rand**", wenn sie die
Konstante ausschöpft.

**Die Konstante bleibt bei 8**, und das ist jetzt eine begründete Entscheidung
statt einer stehengebliebenen: Der Bestand braucht heute höchstens 7, also
deckt 8 alles mit einer Zeile Reserve. Sie kleiner zu machen hieße, den ersten
eingefügten Absatz mit einem Fehlalarm zu bezahlen; sie größer zu machen hieße,
in die stille Richtung zu gehen, ohne dass irgendetwas es verlangt.

> **Eine Konstante wird nicht dadurch richtig, dass man sie ändert, sondern
> dadurch, dass jemand weiß, was sie trägt.**

Ein Testfall hält die tragende Richtung fest: Keine Fundstelle im Bestand
braucht mehr, als die Konstante hergibt, und die Messung läuft über mindestens
20 Fundstellen — sonst misst sie nichts.

---

## Und der Testprüfer hatte recht

Der Gesamtlauf meldete den neuen Testfall:

```
✗ Zeile 194: kein Fund im Bestand braucht mehr Sichtweite …
    → Schleife über `dateien` ohne vorherige Längenzusicherung
    → Schleife über `findeWiderrufe(d.text` ohne vorherige Längenzusicherung
```

Der Fall zählte die gemessenen Stellen und sicherte die Zahl **am Ende** zu —
sachlich dieselbe Aussage, aber der Prüfer kann das nicht sehen, und er soll es
auch nicht raten müssen. Für die **innere** Schleife wäre eine Zusicherung
davor obendrein falsch: Die meisten Dateien haben null Funde, und das ist in
Ordnung.

Umgebaut auf **erst sammeln, dann zusichern, dann durchgehen** — eine flache
Liste aller Fundstellen, deren Länge vor der Schleife geprüft wird. Das ist
nicht bloß die Form, die der Prüfer verlangt, sondern die richtige: *Zugesichert
wird die Liste, um die es geht.*

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-widerrufe` misst zusätzlich |
| Neue Ausfuhren | `noetigeSichtweite` |
| Neue Testfälle | 4 (`test/widerruf.test.js`, 20 → 24) |
| Geänderte Konstanten | **keine** — 8 bleibt 8, jetzt mit Maß |
| Gefundene Fehler | keine; ein Satz verbessert |

## Was offen bleibt

- **Die dritte Möglichkeit falscher Deckung** — ein Nachbarabsatz im Fließtext,
  der ein Widerrufswort über etwas anderes trägt — ist mechanisch nicht
  feststellbar: Ob ein Widerruf **von dieser** Aussage handelt, weiß nur, wer
  ihn liest. Die Zahl begrenzt den Schaden, sie schließt ihn nicht aus. *Das
  ist keine Lücke, die eine Runde schließt.*
- **Die Gebietsfrage an den Lieferanten** — freigabepflichtig.
- **`PARAMETER.md` trägt ein Kopfdatum ohne Prüfer** — bewusst nicht gebaut.
