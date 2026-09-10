# Ein Lauf ohne Aufzeichnung

**10. September 2026**

Die Runde davor hat den **Ausführungsweg aller 126 ersetzenden Gegenproben**
umgebaut: Ersetzt wird seither über gemessene Fundstellen statt mit
`String.replace`, und ein Anker darf ein Suchmuster sein. Gelaufen waren danach
**vier** Proben.

> **Ein Umbau, der jede Probe betrifft, ist an vier Proben nicht geprüft.**

Also der volle Lauf: 136 Proben, 129 ohne Browser, rund 45 Minuten.

---

## Was der Lauf gefunden hat — im eigenen Verzeichnis

**Erster Lauf: 125 von 129.** Drei Proben stehen als *nicht messbar* da
(`preise/poschacher-positionen.csv` fehlt seit dem 8. September). Aus der
Rechnung im Läufer folgt: **vier gescheitert.**

Alle vier aus einem Grund, und der war kein Probenfehler:

```
✗ pruefe-leitzahlen — war schon vorher rot
    ✗ docs/baustoff-shop/STATUS.md:1070 [noetiger-monatsumsatz]
    ✗ docs/baustoff-shop/STATUS.md:1070 [keyword-anzahl]
```

Zeile 1070 ist die Zeile, die **in der Runde davor entstanden ist** — der
Runde darüber, dass Anker auf Zahlen sitzen, die sich ändern. Sie schrieb
selbst zwei bewegliche Zahlen ohne ihre Bedingung hinein:

| Zahl | was fehlte |
|---|---|
| `45.356` | die Bedingung „Kartenzahlung" — es ist die abgelöste Leitzahl vom 25.08. |
| die Gatezahlen als Ziffernfolge | es sind **Gates**; als bloße Ziffer trifft die letzte von ihnen die abgelöste Begriffszahl der Messliste, und kein Prüfer kann die beiden auseinanderhalten |

Der Prüfer nennt beide richtigen Auswege selbst: die Zahl nachziehen, oder ihre
Bedingung danebenschreiben. Gewählt: die Bedingung neben die Leitzahl, und die
Gatezahlen ausgeschrieben — als Ziffer erzeugen sie eine Zweideutigkeit, die
auch ein Mensch nicht auflösen kann, der die Zeile liest.

**Zweiter Lauf, nach der Berichtigung: 129 von 129.** Der Umbau ist damit über
jede ersetzende Probe verifiziert.

---

## Drei eigene Fehler auf dem Weg dorthin

Sie gehören hierher, weil sie sich gegen Regeln richten, die dieser Bestand
selbst aufgestellt hat.

### 1. Die Ausgabe lief durch `tail`

Vom ersten Lauf blieben die letzten sechzig Zeilen. Die vier Fehlschläge
standen weiter oben. Ihre **Zahl** ließ sich nur aus der Formel im Läufer
zurückrechnen — welche Proben es waren, sagte niemand.

> **Ein Lauf ohne Aufzeichnung ist ein Lauf, dessen Ergebnis man glauben muss.**

45 Minuten Rechenzeit für eine Zahl ohne Beleg.

### 2. `pkill -f gegenprobenlauf` traf die eigene Shell

Der zweite Lauf sollte abgebrochen werden. Das Suchmuster steht in der
Befehlszeile, mit der gesucht wird — **der Aufrufer passt auf sein eigenes
Muster.** Die Shell starb (Ausgang 144), der Läufer lief weiter.

Neun Minuten lang hat er mutiert und neu gebaut, während daneben gemessen
wurde. Drei Messungen in Folge waren Artefakte und wiesen in drei Richtungen:
eine ausstehende Veröffentlichung, 16 statt 15 Lieferantenbelege, und bei jedem
Testlauf **andere** rote Fälle.

Gefunden wurde es erst mit `ps`, nach der dritten widersprüchlichen Messung.

> **Wer dreimal etwas anderes misst, misst nicht dreimal — er misst etwas
> anderes.**

### 3. `git add -A` auf einem laufenden Bau

In diesem Zustand legte ein `git add -A` einen Schnappschuss des laufenden Baus
in den Index: sieben Dateien gleichzeitig **als gelöscht vorgemerkt und als
unverfolgt vorhanden**. Committet wurde nichts — der Vor-Commit-Haken hat
gesperrt, allerdings aus einem anderen Grund. Zurückgenommen mit `git reset`
(nicht `git checkout`, der hätte Arbeit vernichtet), neu gebaut, danach 2115
Testfälle grün und kein offener Mutationszettel.

**Der Zettel hat gehalten.** Keine Quelldatei blieb falsch, obwohl der Lauf
mitten im Betrieb abgeschossen wurde. Das ist das eine, was in dieser Nacht
funktioniert hat wie gebaut.

---

## Was daraus gebaut wurde: der Satz bekommt ein Werkzeug

`npm run pruefe-mutationen` druckt seit dem 4. September auf seinem **grünen**
Weg:

> *„Ein Commit während einer Gegenprobe nimmt die Mutation mit."*

Eine Warnung, die niemand einforderte — und in dieser Nacht ist sie eingetreten.

> **Eine Regel, die nur als Satz dasteht, gilt für den, der sie liest.**

Der Prüfer fragt seither die **Prozessliste**: Läuft ein Gegenprobenlauf, ist
er rot und nennt die Kennung. Kein Merker auf der Platte, der einen Abbruch
überlebt und später falsch behauptet, es liefe noch etwas.

Warum das den Zettel nicht doppelt: Der Zettel kommt, wenn eine Mutation
**liegt**. Zwischen zwei Proben liegt keine — und genau dann sieht der Baum
ruhig aus und ist es nicht.

### Und die Sperre schwieg beim ersten Versuch

Der erste Entwurf nahm neben dem Fragenden auch dessen **Elternkennung** aus.
Damit fiel jedes **Geschwister** unter die Ausnahme — ein Lauf, der im selben
Terminal im Hintergrund liegt, während davor committet wird. Das ist genau die
Lage vom 10. September.

Gezeigt hat es der Versuch mit einem echten Prozess: Die Sperre blieb still.
Ausgenommen wird jetzt nur die **Kette der Vorfahren**, und eine Gegenprobe
hält die Unterscheidung wach.

> **Eine Ausnahme, die zu weit gezogen ist, deckt genau den Fall, für den die
> Sperre gebaut wurde.** Derselbe Satz wie bei den Grenzen nach draußen, eine
> Ebene tiefer.
