# Das Einzugsgebiet ist das ganze Verzeichnis

**12. September 2026. Runde 41.**

## Die Aufgabe, die die Runde davor hinterlassen hat

Der Gesamtlauf braucht **109 Minuten, davon 105 für die Gegenproben**.
Zwischen zwei Runden fährt ihn niemand — und genau deshalb standen zwei
stumpfe Gegenproben zwölf Runden lang da. Aufgeschrieben war der naheliegende
Schnitt:

> *Eine Auswahl, die nur die Mutationen fährt, deren Datei sich seit dem
> letzten grünen Lauf geändert hat.*

Er ist gebaut, und er ist **gemessen**. Das Ergebnis ist nicht das erwartete.

## Zuerst: die Auswahl darf nicht die Mutation allein lesen

Die Runde davor hat den Gegenbeweis selbst geliefert.
`weisung-nur-noch-im-protokoll` mutiert `baustoffkatalog.js` und wurde stumpf,
weil **`weisungsstand.js`** die Weisungen neu durchnummeriert hat. Eine
Auswahl nach der mutierten Datei allein hätte sie übersprungen — und der
einzige Lauf, der den Fund gemacht hat, wäre nicht gefahren.

Das **Einzugsgebiet** einer Gegenprobe ist deshalb alles, was der Prüfer liest,
um zu seinem Urteil zu kommen. `src/einzugsgebiet.js` rechnet es aus, und zwar
aus drei Quellen, nicht aus einer gepflegten Liste (die wäre nach dem ersten
neuen `import` falsch):

| | |
| --- | --- |
| `importe()` | die Einfuhren, rekursiv — `from './x.js'`, auch über mehrere Zeilen |
| `genanntePfade()` | die Dateien, über die er **urteilt**: `QUELLE = 'docs/…/gate-register.md'` |
| `liestOrdner()` | ob er ein ganzes Verzeichnis liest — dann ist sein Gebiet nicht aufzählbar |

Der dritte Punkt ist der wichtige. `pruefe-stand` zählt die Dateien unter
`docs/baustoff-shop/`; eine **neue** Datei steht in keiner Einfuhr und in
keiner Zeichenkette. Wer einen Ordner liest, läuft immer.

## Und dann die Messung

Ohne eine einzige geänderte Datei — der günstigste denkbare Fall:

| Grund | Gegenproben |
| --- | ---: |
| liest einen Ordner | **142** |
| Gebiet unbekannt | 31 |
| unverändert, übersprungen | **37** |

> **Achtzig Prozent der Gegenproben laufen auch dann, wenn sich nichts geändert
> hat — nicht aus Vorsicht, sondern weil ihre Prüfer Verzeichnisse lesen.**

Das ist kein Fehler der Auswahl. Es ist die Bauweise dieses Bestands, und sie
ist die richtige: Ein Prüfer hält hier ein **Register gegen die Wirklichkeit**,
und Wirklichkeit heißt alle Dateien. Wer das Verzeichnis liest, hängt am
Verzeichnis.

`--seit <stand>` ist trotzdem gebaut und steht zur Verfügung — mit der Zahl,
die es wert ist: Es spart ein knappes Fünftel, sagt bei jedem übersprungenen
Eintrag, warum er übersprungen wurde, und schreibt darunter **„Übersprungen ist
nicht grün. Der Gesamtlauf fährt sie alle."** Der Gesamtlauf selbst wählt
nichts aus.

## Was der eigentliche Hebel ist

Die Messung zeigt ihn nebenbei. **57 der 210 Gegenproben haben `test` als
Prüfer**, und jede lässt die ganze Testreihe laufen — dreimal je Probe, gut
100 Sekunden. Das ist der Löwenanteil der 105 Minuten, und dagegen hilft keine
Auswahl nach Dateien, sondern ein **Zeuge**:

> Wenn eine Gegenprobe anschlägt, steht in der Ausgabe, **welcher Testfall in
> welcher Datei** rot geworden ist. Wer das mitschreibt, hat beim nächsten Mal
> keine Vermutung über das Einzugsgebiet, sondern den Namen des Zeugen — und
> kann genau diese eine Testdatei fahren.

Aufgeschrieben, nicht gebaut: Der Zeuge muss erst einmal von jeder der 57
Proben eingesammelt werden, und das geht nur in einem vollen Lauf.

## Ausgang

| | |
| --- | --- |
| `src/einzugsgebiet.js` | neu — Einfuhren, genannte Dateien, Ordnerleser |
| `npm run gegenproben -- --seit <stand>` | neu, opt-in; der Gesamtlauf bleibt vollständig |
| gemessene Ersparnis | **37 von 210** — und die Zahl steht in einem Testfall |
| Testfälle | 2.385 |
| Gegenproben | 210 → **211** |

Die Zahl steht bewusst in einer Zusicherung: Fällt sie eines Tages anders aus,
weil die Prüfer anders gebaut sind, wird der Testfall rot und dieses Dokument
ist nachzuziehen. *Eine gemessene Zahl in einem Dokument ist eine Zahl von
gestern, sobald sie nirgends gehalten wird.*

---

**Die Regel dieser Runde:** *Bevor man eine Abkürzung baut, misst man, wie weit
sie trägt — und schreibt die Zahl dorthin, wo sie rot wird.*
