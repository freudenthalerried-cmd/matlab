# „Ausgang 1" und sonst nichts

**8. September 2026, nachts.** Ein Gesamtlauf endete mit einer Zeile, die
nichts sagt:

```
✗ oberflaechenprobe         3 s  Ausgang 1
```

Welches der elf Szenarien gescheitert war, stand nirgends. Der Lauf hatte die
Ausgabe des Werkzeugs verworfen. Beim nächsten Bau war die Probe grün — und
**der Grund ist nicht mehr feststellbar.** Genau das ist der Schaden: Ein Lauf
dauert vierzig Minuten, und wer ihn liest, hat den Zustand von damals nicht
mehr.

**Vier Zeilen darüber macht derselbe Code es richtig.** Der Zweig für Ausgang 2
— die Weigerung — nimmt die erste Zeile der Ausgabe als Grund mit. Die Regel
dafür steht seit dem 4. September im Gegenprobenläufer:

> **Ein Urteil über einen Prüfer, das seine Begründung wegwirft, ist eine
> Anschuldigung.**

Angewandt war sie dort, wo sie auffiel, und nicht im Zweig daneben. Dasselbe
Muster wie heute Nachmittag beim Lieferantenbrief, wo die Lehre zwanzig Zeilen
entfernt stand.

Ein roter Schritt nennt jetzt bis zu drei Zeilen aus seiner eigenen Ausgabe —
zuerst `not ok`, sonst `✗`, sonst die letzten Zeilen. Dieselbe Reihenfolge wie
im Gegenprobenläufer und aus demselben Grund: Bei `npm test` steht das ✗ auch
in der Ausgabe der geprüften Werkzeuge.

---

## Und dann der Abend, den das erklärt hätte

Danach folgten mehrere rote Testläufe, jeder mit einem anderen, überzeugend
klingenden Befund:

| gemeldet | Zahl der roten Testfälle |
|---|---|
| `llms.txt` nennt die Rechtsseiten nicht | 2 |
| ein Anzeigenwort wird nicht ausgeschlossen | 3 |
| die Abnahmeliste zeigt auf fehlenden Text | 2 |
| keine Seite sagt Abholung zu | 3 |
| „Der Sprung führt in einen Bereich" und neun weitere | 12 |

Jedes Mal habe ich den genannten Fehler gesucht. Jedes Mal war der Bestand in
Ordnung.

**Und die Ursache war jedes Mal dieselbe, und sie war ich.** Um 21:56:54
nachgesehen: **drei** Testreihen liefen gleichzeitig, und im Vordergrund baute
ich neu — `ausgabe/site` wurde um 21:56:53 überschrieben, mitten in allen
dreien.

Wie es dazu kam, ist der eigentliche Merksatz: `npm test` überschreitet die
Vordergrundfrist von zwei Minuten und wandert **unbemerkt in den
Hintergrund**. Sichtbar ist nur, dass die Eingabe wieder frei ist. Ich habe
weitergearbeitet, dreimal.

> **Eine Messung, die in den Hintergrund wandert, läuft weiter. Sichtbar ist
> nur, dass die Eingabe frei ist.**

Dagegen hilft keine Regel im Bestand — nur die vom Nachmittag, jetzt eine
Ebene kleiner: *Wer während einer Messung baut, misst zwei Zustände.*

**Trotzdem steckt darin eine echte Lücke**, und sie ist gemessen:

> **Fünfunddreißig Testdateien lesen `ausgabe/site`. Genau eine fragte, ob es
> auf dem Stand der Quelle ist.**

Die Prüfer machen es seit dem 4. September richtig: `frischebefund` prüft, und
wer über einem veralteten Erzeugnis messen soll, **weigert sich** mit Ausgang 2
und nennt die jüngere Quelldatei.

> **Die Prüfer weigern sich über einem veralteten Erzeugnis. Die Testfälle
> messen es** — und melden dann den falschen Fehler, mit voller Überzeugung.

Ein Testfall kann sich nicht weigern; er kann nur bestehen oder scheitern. Also
scheitert `test/erzeugnisfrische.test.js` — **mit der richtigen Diagnose**:

```
Testfälle unter dieser Zeile messen ein veraltetes Erzeugnis.
Ihre Befunde beschreiben die Vergangenheit und nicht den Bestand:

    Abbruch: ausgabe/site ist älter als 1 Quelldatei(en) — zuerst npm run website.
    Abbruch: demo.html ist älter als 1 Quelldatei(en) — zuerst npm run build.
```

Lebend nachgewiesen: `touch src/preis.js`, und die Diagnose steht da, mit
Datei und Befehl.

Er liegt in einer eigenen Datei, weil `node --test` die Dateien in beliebiger
Reihenfolge fährt. **Wo** er landet, ist nicht zu steuern; **dass** er dasteht,
schon.

---

## Was das über den Tag sagt

Dreimal heute derselbe Unterschied, und jedes Mal eine Ebene weiter innen:

| | |
|---|---|
| vormittags | die **Weigerung** eines Prüfers galt als Befund |
| nachmittags | ein **bewegter Bestand** galt als roter Prüfer |
| nachts | ein **veraltetes Erzeugnis** gilt als Fehler im Bestand |

Immer geht es darum, ob eine Messung überhaupt stattgefunden hat. Und immer
war die Antwort im Haus schon aufgeschrieben — einmal im Gesamtlauf, einmal
im Gegenprobenläufer, einmal in vierzig Prüfern.

> **Eine Regel, die an einer Stelle gilt, gilt nicht dort, wo sie nicht steht.**
