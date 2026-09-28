# Was einzeln läuft, läuft nicht hintereinander

**12. September 2026. Runde 52.**

## Der Anlass

Seit heute gibt es alle Schritte **nach** der Rechnung: die Akte zurücklesen,
eine falsche Rechnung aufheben, die Periode an die Buchhaltung geben, das Ganze
sichern. Jeder einzelne ist geprüft — **die Reihenfolge war es nicht.**

Und genau dort saßen die Funde der letzten Tage: eine Nummer, die zweimal
gezogen wurde; ein Betreff, der den ganzen Belegtext mitnahm; ein Einkaufswert,
der beinahe als Umsatz gezählt hätte.

> **Was einzeln läuft, läuft nicht deshalb hintereinander.**

## Die Bestellprobe fährt jetzt zwölf Schritte

Sie ist die eine Probe, die den ganzen Weg mit echtem PHP, echtem Browser und
echter Akte in einem Wegwerfordner fährt. Vier Prüfungen sind dazugekommen:

| | |
| --- | --- |
| **9** | Die Akte liest den Vorgang zurück und nennt Beleg und Frist — und **nicht** die Anschrift des Kunden |
| **10** | Die Gutschrift hebt die Rechnung auf, **ohne die Durchschrift zu verändern** (§ 131 Abs 1 Z 6 BAO) |
| **11** | Der Auszug für die Buchhaltung zählt **genau zwei** Umsatzbelege, und sie heben sich auf: netto 0,00 €, Steuer 0,00 € |
| **12** | Die Sicherung erreicht auch die Durchschriften im **Unterordner** |

Die elfte ist die Zahl, an der die ganze Kette hängt. Kommt dort etwas anderes
als null heraus, hat entweder die Gutschrift einen anderen Betrag als die
Rechnung, oder ein Papier ohne Umsatz ist mitgezählt worden — beides wäre in
der Voranmeldung gelandet.

Das Mindestmaß im Prüferregister steht auf **12**: *Fiele eine der neuen
Prüfungen wieder heraus, stünde dort die alte Zahl — und die sähe gesund aus.*

## Der Fund beim Gegenprobenlauf

Beim Prüfen der neuen Probe meldete der Läufer:

```
✗ bestellprobe — Ein Bestelljournal, das unter einer URL erreichbar ist
    der Arbeitsbaum hat sich unter dem Lauf bewegt:
    shop/data/browserproben.json
```

Die Datei ist der **Vermerk des Läufers selbst**. Er schreibt nach jeder
Browserprobe ihr Datum hinein — damit eine Zurückstellung nach vierzehn Tagen
wieder als ungeprüft gilt. Die nächste Probe vergleicht den Baum mit dem
zuletzt genommenen Abdruck, sah die eigene Buchführung als Bewegung und stellte
sich zurück.

> **Systematisch traf es jede zweite Gegenprobe einer Browserprobe.** Ein
> Läufer, der seinen eigenen Vermerk für eine fremde Änderung hält, erklärt
> sich selbst für unzuständig.

Nicht der Abdruck ist enger gefasst worden, sondern der **Zeitpunkt** richtig
gewählt: Was dieser Läufer selbst schreibt, gehört zum Stand **vor** der
nächsten Messung. Gemessen: aus „2 von 2, eine zurückgestellt" wurden **3 von 3
— und zwei gesparte Prüferläufe**, weil auch die Wiederverwendung des grünen
Vorlaufs an der vermeintlichen Bewegung hing.

## Ausgang

| | |
| --- | --- |
| Bestellprobe | 8 → **12 Prüfungen**, Klick bis Sicherung |
| Gegenproben zu `bestellprobe` | 2 messbar → **3 von 3** |
| gesparte Prüferläufe dabei | 0 → **2** |
| Testfälle | 2.407 |

---

**Die Regel dieser Runde:** *Wer prüft, ob sich etwas bewegt hat, muss wissen,
was er selbst bewegt hat.*
