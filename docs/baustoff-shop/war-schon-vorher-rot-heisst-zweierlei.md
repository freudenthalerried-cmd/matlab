# „War schon vorher rot" heißt zweierlei

**8. September 2026.** Ein Gesamtlauf meldete die Gegenproben rot: sieben
Proben gegen den Prüfer `test`, fünf davon mit demselben Satz.

```
✗ test — Eine Fehlerseite, die im Ordner liegt und die niemand ausliefert
    war schon vorher rot — an einem roten Prüfer lässt sich nichts zeigen
```

Am Bestand war nichts. Unmittelbar danach gemessen: **1.910 Testfälle, keiner
rot.** Der nächste vollständige Lauf: **45 von 46 Schritten grün, Gegenproben
107 von 107.**

Was dazwischenlag, war ich. Ich habe an der nächsten Runde gearbeitet, während
der Lauf lief, und für ein paar Minuten war `npm test` tatsächlich rot: Eine
frisch geschriebene Gegenprobe trug einen Suchtext, dem eine Ersetzung die
Einrückung genommen hatte. Der Läufer sah einen roten Prüfer und schrieb den
Satz, den er für diesen Fall hat.

Der Satz ist richtig. Er traf den Falschen.

> **„War schon vorher rot" meint zweierlei: der Bestand hat einen Fehler — oder
> jemand hat unter dem Lauf geschraubt.** Das eine ist ein Befund, das andere
> ist keiner.

---

## Der dritte Fall desselben Tages

| Vormittag | der Gesamtlauf zählte die **Weigerung** eines Prüfers als Befund — bis `⃠ nicht messbar` dazukam |
|---|---|
| Nachmittag | ein Commit nahm eine **laufende Mutation** mit — bis der Haken davorstand |
| Abend | der Läufer hielt einen **bewegten Bestand** für einen roten Prüfer |

Jedes Mal derselbe Unterschied: *etwas gefunden* gegen *nicht gemessen*. Und
jedes Mal ist die falsche Zusammenfassung die optimistische in eine Richtung
und die anklagende in die andere — sie behauptet einen Befund, wo keiner ist,
und verdeckt, dass nichts geprüft wurde.

---

## Was jetzt vor jeder Probe steht

`src/baumstand.js` nimmt einen **Inhaltsabdruck** des Bestands — 377 Dateien,
ohne `ausgabe/`, `.sicherung/`, `preise/` und `node_modules`. Vor jeder Probe
wird er neu genommen und gegen den der **vorigen** Probe gehalten. Hat sich
etwas bewegt, wird gar nicht erst gemessen:

```
✗ pruefe-schaufenster — Eine Beschreibung, deren Zahlen stimmen …
    shop/src/schaufenster.js (ersetzen) · 0 s
    der Arbeitsbaum hat sich unter dem Lauf bewegt: shop/src/probe-bewegung.js
    — an einem Bestand, der sich ändert, lässt sich nichts zeigen
```

Das ist kein erdachtes Beispiel, sondern der Nachweis: Während drei Proben
liefen, wurde eine Datei angelegt. Die betroffene Probe steht auf **0 Sekunden**
statt neunzig — sie hat den Prüfer gar nicht mehr gerufen —, nennt die Datei
und ist **zurückgestellt, nicht gescheitert**. Die beiden anderen liefen
normal durch.

### Zwei Entscheidungen dahinter

**Der Abdruck geht über den Inhalt, nicht über die Zeit.** Der Läufer schreibt
jede geprüfte Datei selbst zweimal — einmal falsch, einmal zurück. Danach ist
ihre Änderungszeit neu und ihr Inhalt derselbe; ein Abdruck aus Zeitstempeln
hätte jede einzelne Probe als Bewegung gemeldet.

**Er steht vor jeder Probe, nicht erst im Verdachtsfall.** Der erste Entwurf
wollte ihn aus Sorge um die Laufzeit nur ziehen, wenn ein Prüfer rot meldet.
Nachgemessen: 377 Dateien in **16 Millisekunden**, bei 114 Proben also knapp
zwei Sekunden auf zweiunddreißig Minuten.

> **Eine Sparmaßnahme, die niemand nachgerechnet hat, kostet den Befund und
> spart nichts.**

Und weil er vor jeder Probe steht, meldet er auch dann, wenn der Prüfer grün
bleibt: Eine Probe, die einen anderen Bestand misst als die vorige, hat etwas
gezeigt — nur nicht unbedingt das, was in ihrem Registereintrag steht.

---

## Eine Zeile, die mitkorrigiert wurde

Der Sammelsatz am Ende hieß *„zurückgestellt — ihr Prüfer kann nichts messen"*.
Das stimmte, solange es nur einen Grund gab: die fehlende Rechnungsdatei vom
Vormittag. Für einen bewegten Bestand ist es falsch — der Prüfer könnte sehr
wohl messen, er kam nur nicht dazu. Der Grund steht jetzt bei jeder Zeile
statt in der Überschrift.

**Und die Regel, die daraus folgt, ist keine für die Maschine:** Wer während
eines Laufs am Bestand arbeitet, bekommt kein Ergebnis, sondern einen Bericht
über zwei Zustände. Seit heute sagt der Läufer das, statt einen Prüfer dafür
verantwortlich zu machen.
