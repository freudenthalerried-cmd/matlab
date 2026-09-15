# Zwei Gegenproben, die nichts bewiesen

**12. September 2026. Runde 40.**

## Der Anlass: ein ganzer Lauf

Der Gesamtlauf ist seit Gate 38 (11. September) nicht mehr vollständig
gefahren worden — zwölf Runden, zehn neue Prüfer, vier neue Gates. Er lief
heute Nacht: **109 Minuten, 63 von 65 Schritten grün.**

Rot war nur ein Schritt, und zwar der, der die anderen bewacht: die
**Gegenproben**. Vier Meldungen, zwei davon die bekannte Weigerung von
`pruefe-gebinde` (die verlorene Positionsliste). Die anderen zwei sind der
Fund dieser Runde:

> **Zwei Gegenproben, die seit Tagen im Register stehen und nichts beweisen —
> die eine schlägt aus dem falschen Grund an, die andere läuft überhaupt nicht
> mehr.**

Der Schnelllauf vor jedem Commit fährt keine Gegenproben. Deshalb war beides
nur im vollen Lauf zu sehen, und der stand still.

## Die erste: eine Nummer, die weitergewandert ist

`weisung-nur-noch-im-protokoll` schreibt `ZIELMARGE = 0.25` als `1 / 4` —
dieselbe Zahl, kein Testfall fällt, kein Preis ändert sich, nur die Spur der
Weisung „25 % ist Marge vom Verkauf" verschwindet aus dem Bestand. Erwartet
wurde die Meldung **`Weisung 3`**.

Am 9. September ist die Weisungstafel von acht auf **dreizehn** Weisungen
gewachsen und dabei neu durchnummeriert worden. Die Marge-Weisung ist seither
die **sechste**. Die Mutation wurde weiter rot — nur über eine andere Weisung,
und der Läufer hat es wörtlich gesagt: *„meldete rot, aber nicht wegen
/Weisung 3/ — er hat etwas anderes gefunden."*

> **Eine Gegenprobe, die auf eine laufende Nummer zeigt, zeigt nach dem
> nächsten Einschub woandershin.**

Gesucht wird jetzt die **Spur**, die diese Mutation entfernt
(`trägt /ZIELMARGE = 0\.25/ nicht mehr`). Sie kann sich nicht verschieben, ohne
dass sich die Mutation selbst ändert. Dieselbe Lehre wie bei den
Leitzahlen — nur eine Ebene höher: Diesmal stand die abgeschriebene Zahl in
der Prüfung der Prüfung.

## Die zweite: der Prüfer der Prüfer hatte keinen Lauf mehr

`pruefe-pruefer` ruft jeden der einundsechzig Prüfer auf und fragt ihn nach
seinem Umfang. Er steht mit Grund **nicht** im Register der Prüfer — er läse
sich selbst, eine Schleife ohne Boden. Sein einziger regelmäßiger Lauf ist
damit seine eigene Gegenprobe.

Diese Gegenprobe wurde bei jedem Gesamtlauf **zurückgestellt**: *„Der Prüfer
kann nichts messen."*

Die Ursache liegt vier Tage zurück und war eine gute Entscheidung. Am
8. September wurde getrennt, was nicht ineinanderfallen darf: Ein Prüfer, der
zu wenig ansieht, ist ein **Befund** (Ausgang 1). Ein Prüfer, der gar nicht
läuft, ist ein Befund über die **Umgebung** (Ausgang 2). Seither galt:

```
process.exit(gescheitert ? 1 : (abgebrochen ? 2 : 0));
```

> **Seit dem Verlust von `preise/poschacher-positionen.csv` bricht einer der
> einundsechzig dauerhaft ab. Damit endete `pruefe-pruefer` immer mit Ausgang
> 2 — und eine Gegenprobe braucht einen Prüfer, der vorher grün war.**

Eine fehlende Datei außerhalb des Verzeichnisses legte die Prüfung still, die
alle anderen Prüfungen bewacht. Vier Tage lang, unbemerkt, weil das einzige
Werkzeug, das es hätte sagen können, dieselbe Gegenprobe ist.

**Entschieden wie Gate 38, und das ist die jüngere Entscheidung:** Eine
Weigerung wird gemeldet — mit Code, Grund und dem Satz *„Das ist keine
Entwarnung"* —, aber sie ist nicht der Ausgang. Die Regel steht jetzt in
`ausgang()` in `src/prueferurteil.js`, wo sie mit fünf Zeilen prüfbar ist,
statt als Ausdruck am Ende eines Skripts, das zwei Minuten braucht.

Der Beweis: Die Gegenprobe ist heute zum ersten Mal seit Tagen gelaufen und
hat angeschlagen — **4 min 24 s**, und sie meldet wieder genau den Fall, für
den es sie gibt (ein Registereintrag, der die zweite Klammer eines
einklammrigen Musters liest, `Number(undefined)` → „NaN Zusagen über den
Code").

## Ausgang

| | |
| --- | --- |
| Gesamtlauf | 63 von 65 Schritten grün, 109 min |
| `weisung-nur-noch-im-protokoll` | rot aus falschem Grund → **an der Spur verankert** |
| `registereintrag-nennt-eine-klammer-zu-viel` | zurückgestellt → **schlägt an, 4 min 24 s** |
| Ausgang des Prüferprüfers | Weigerung sperrte → **Weigerung meldet** |
| Testfälle | 2.378 |
| Gegenproben | 209 → **210** |

## Was daraus offen bleibt

Der Gesamtlauf braucht **109 Minuten**, davon 105 für die Gegenproben. Zwischen
zwei Runden fährt ihn niemand, und genau deshalb standen diese beiden Funde
zwölf Runden lang da. Der Schnelllauf hat dieses Problem für die Prüfer
gelöst; für die Gegenproben ist es offen. Eine Auswahl, die nur die Mutationen
fährt, deren Datei sich seit dem letzten grünen Lauf geändert hat, wäre der
naheliegende Schnitt — aufgeschrieben, nicht gebaut.

---

**Die Regel dieser Runde:** *Eine Prüfung, die niemand mehr fährt, ist keine
Prüfung; und eine, die aus dem falschen Grund rot wird, ist schlimmer als
keine — sie beruhigt.*
