# Zweimal dasselbe ist einmal

**11. September 2026, dreiundzwanzigste Runde.** Die zwanzigste Runde hat
gefragt, was ein **Fremder** mit dem Empfangsskript anstellen kann. Diese fragt,
was ein **ehrlicher Kunde** damit anstellt, wenn die Verbindung abreißt.

## Die Messung

Dieselbe Bestellung zweimal an ein laufendes PHP geschickt:

```
{"ok":true,"nummer":"B-2026-0001","gemeldet":false}
{"ok":true,"nummer":"B-2026-0002","gemeldet":false}
Journalzeilen: 2
```

Zwei Geschäftsfälle, zwei Mails — und sobald der Shop wirklich verkauft,
womöglich zwei Lieferungen derselben Palette auf dieselbe Baustelle.

## Der Weg dorthin ist nicht Ungeduld

Das war die erste Vermutung, und sie war falsch. Die Oberfläche sperrt den
Knopf beim Absenden (`senden.disabled = true`) und gibt ihn erst wieder frei,
wenn eine Absage kommt. Ein hektischer Doppelklick erzeugt also **keinen**
zweiten Eintrag.

Der Doppeleintrag entsteht anders: durch einen **Abriss nach dem Schreiben**.
Die Bestellung liegt im Journal, die Antwort erreicht den Browser nie, der
Besteller sieht „Nicht angekommen" — oder gar nichts mehr — und drückt noch
einmal. Auf einer Baustelle mit einem Balken Empfang ist das kein Sonderfall.

> **Wer nicht weiß, ob seine Bestellung angekommen ist, schickt sie noch
> einmal — und das ist vernünftig. Unvernünftig wäre, sie zweimal zu
> verbuchen.**

## Gate 37, selbst entschieden

**Eine Bestellung, die binnen zehn Minuten wortgleich zweimal eingeht, ist
eine.**

### Verglichen wird der Inhalt, nicht ein mitgeschickter Schlüssel

Die übliche Lösung wäre ein Schlüssel, den der Browser mitschickt. Hier ist sie
die schlechtere: Der Schlüssel bliebe gleich, wenn der Besteller einen
Tippfehler in seiner Anschrift berichtigt und erneut abschickt — **und dann
ginge die Berichtigung verloren.** Der Abdruck über die eingegangenen Angaben
ändert sich mit ihnen.

Gemessen, beide Richtungen:

| Versuch | Ergebnis |
|---|---|
| dreimal dasselbe | **eine** Zeile, dreimal dieselbe Nummer |
| dieselbe Ware, berichtigte E-Mail-Adresse | neue Nummer |
| andere Menge im Text | neue Nummer |

Nummer und Zeitpunkt gehören ausdrücklich **nicht** in den Abdruck: Die vergibt
das Skript selbst, und zwei Abschriften derselben Bestellung unterschieden sich
sonst immer. *Das ist die stille Art, eine Sperre unwirksam zu machen — der
Code sähe vollständig aus und griffe nie.* Eine eigene Gegenprobe nimmt genau
das wieder hinein.

### Warum ein Fenster und keine Ewigkeit

Eine Baustelle, die dieselbe Palette in vier Wochen noch einmal bestellt, muss
eine zweite Nummer bekommen. Zehn Minuten fangen den Abriss und treffen die
Wiederbestellung praktisch nie.

### Und es wird nicht verschwiegen

```
{"ok":true,"nummer":"B-2026-0001","bereits":true,
 "grund":"Diese Bestellung liegt bereits vor. Ihre Nummer bleibt B-2026-0001."}
```

Die Oberfläche schreibt seither **„Lag schon vor. Ihre Nummer bleibt …"** statt
„Angekommen" — wer nach einem Abriss noch einmal drückt, darf nicht denken, er
habe jetzt zwei Vorgänge.

*Eine stille Unterdrückung wäre dieselbe Sorte Fehler wie die stille Kürzung
des Warenkorbs vom Vortag.*

### Ein Zusammenspiel, das leicht danebengegangen wäre

Die Wiederholung zählt **nicht** gegen die Minutengrenze aus Gate 35. Ohne
diese Ausnahme wäre die Rechnung: fünf Versuche derselben Bestellung, fünf
gegen die Grenze, der sechste mit 429 — *ein Abriss hätte den Besteller auch
noch ausgesperrt.* Ein eigener Prüffall schickt achtmal dasselbe und verlangt
achtmal 200 bei einer einzigen Journalzeile.

Gerechnet wird alles in **derselben Lesung unter derselben Sperre**, die schon
die laufende Nummer vergibt. Ein zweiter Durchgang über dieselbe Datei wäre ein
zweiter Weg zur selben Zahl.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2267 | **2270** |
| Gegenproben | 173 | **175** |
| Gates | 36 | **37** (21 mit Spur im Bestand) |

`npm test` grün (2270 bestanden, 3 übersprungen), `npm run pruefe-tests` (2273
Testfälle, 0 mit Verdacht), `npm run bestellprobe` grün (Klick, Empfangsskript,
Ablage, Posteingang, Angebot), `npm run pruefe-gates` (37 Gates), `npm run
pruefe-pruefer` (51 Prüfer, 1 abgebrochen — `pruefe-gebinde`).
