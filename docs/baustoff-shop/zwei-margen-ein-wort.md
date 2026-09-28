# Zwei Margen, ein Wort — und ein Befund, der keiner war

**30. August 2026.** Beim Durchsehen des Rechenkerns fiel eine Zahl auf, die
nirgends sonst mehr vorkommt: `MARGENUNTERGRENZE = 0.32` in `src/preis.js`.
Der Verdacht lag nahe — eine Regel aus der Zeit vor dem Kurswechsel, die
niemand mitgezogen hat. Also gemessen, bevor irgendetwas geändert wurde.

## Die Messung sah zunächst wie ein Alarm aus

46 Artikel im Bestand, alle mit bestätigtem Einkaufspreis:

| | |
|---|---|
| kleinste erzielte Rohmarge | 10,4 % |
| Median | **25,00 %** |
| größte | 25,26 % |
| Artikel über 32 % | **0 von 46** |

Kein einziger Artikel erreicht die Untergrenze. Wer nur diese Tabelle sieht,
liest daraus, dass der gesamte Bestand eine Regel reißt — und fängt an, die
Preise zu suchen, die schuld sind.

Es gibt keine. Der Median liegt auf 25,00 %, weil der Shop mit 25 %
kalkuliert. Das ist die Weisung vom 25. August, kein Befund. Die drei Artikel
unter dem Median sind die drei am Listendeckel (Gate 22): Dort gibt es die
Zielmarge nicht, weil der Verkaufspreis sonst über dem Listenpreis des
Lieferanten läge.

## Die Gegenrichtung entlastet die Konditionen

`MARGENUNTERGRENZE` steht in `auswertung.js` und beurteilt dort etwas anderes:
die Antworten der dreizehn angeschriebenen Lieferanten. Die Frage lautet nicht
„wieviel nimmt der Shop", sondern „wieviel **gäbe** diese Kondition her,
verkaufte man zur vollen Liste". Gemessen an den 42 artikelgenauen
Rabattsätzen der laufenden Lieferbeziehung:

| | |
|---|---|
| kleinster Händlerrabatt | 10 % |
| Median | **45 %** |
| größter | 88 % |
| unter 32 % | 5 von 42 |

37 der 42 Sätze liegen über der Untergrenze. Der Maßstab ist also weder tot
noch zu streng — er misst nur nicht das, wofür ich ihn kurz gehalten habe.

> **Zwei Zahlen mit demselben Wort im Namen messen nicht dasselbe.**
> `ZIELMARGE` sagt, was dieser Shop nimmt. `MARGENUNTERGRENZE` sagt, was eine
> fremde Kondition hergeben müsste, damit ein zweiter Bezugsweg sich lohnt.
> Sie gegeneinander zu halten ergibt eine Zahl, die nichts bedeutet.

Der Verdacht ist damit zurückgezogen: `auswertung.js` bleibt unverändert.

## Was wirklich falsch war

Nicht die Konstante — der Dateikopf über ihr. `src/preis.js` begann mit:

> Gate 1  Rohmarge unter 32 % ist unzulässig.

Diese Regel ist seit dem 22. August durch **Gate 20** abgelöst (positiver
Deckungsbeitrag je Bestellung, in Euro geprüft, nicht in Prozent je Artikel).
`STATUS.md` führt die Ablösung seit acht Tagen. Der Dateikopf tat es nicht und
behauptete eine Regel, die das Modul gar nicht mehr durchsetzt — wer den Kern
liest statt der Statusdatei, bekam den Stand von vor dem Kurswechsel.

Berichtigt: Der Kopf nennt jetzt Gate 7, 20 und 22, mit einer Notiz, was dort
vorher stand. Über `MARGENUNTERGRENZE` steht die Unterscheidung samt
gemessener Zahlen; über `ZIELMARGE` in `baustoffkatalog.js` der Verweis
zurück.

## Festgenagelt

`test/preis.test.js` bekommt eine Probe, die beide Richtungen misst: erzielte
Marge im Median ≈ Zielmarge und **unter** der Untergrenze, Median der
Rabattsätze **über** der Untergrenze. Ohne Preisdatei meldet sie sich als
übersprungen ab, statt still durchzulaufen.

Drei Gegenproben, jede mit `.bak`-Sicherung und danach zurückgesetzt:

| Mutation | Ergebnis |
|---|---|
| `verkaufspreis` rechnet Zuschlag statt Marge | **erkannt** — „Median-Rohmarge 20,0 % statt der Zielmarge 25 %", 8 Testfälle rot |
| `MARGENUNTERGRENZE` → 0,20 | **erkannt** — „die erzielte Marge liegt über der Untergrenze" |
| `ZIELMARGE` → 0,32 | **nicht erkannt**, und das ist richtig so |

Die dritte verdient eine Erklärung, weil sie eine Grenze der Probe zeigt:
Setzt man die Zielmarge auf 32 %, folgt der Median brav mit — die Probe misst
das Verhältnis der beiden Zahlen, nicht die Höhe der einen. Dass 0,25 die
richtige Zahl ist, hängt an der Weisung und ist in `baustoffkatalog.test.js`
und `import.test.js` als Literal festgenagelt. Der Kommentar in der Probe sagt
das ausdrücklich, damit niemand ihr eine Zusicherung zutraut, die sie nicht
gibt.

Nebenbei entfernt: Die Probe rief `ladeBaustoffkatalog` zunächst mit
ausdrücklicher Zielmarge auf und maß damit einen Weg, den sie sich selbst
aussucht. Jetzt ohne vierten Parameter — gemessen wird der Weg, den der Shop
geht.

## Stand

921 Testfälle grün, `pruefe-tests` ohne Verdacht. Keine Preisänderung, keine
Regeländerung; berichtigt wurden zwei Dateiköpfe und eine Lücke in der
Prüfung.
