# Eine Probe, die hängen darf

**13. September 2026, siebte Runde des Tages.** Die Vorrunde endete mit einem
Satz, der nicht stehenbleiben sollte:

> Gefunden hat es keine Prüfung, sondern ein **Zeitablauf**. Das ist der
> schlechteste Fundweg, den dieser Bestand kennt: Er sagt nicht, was falsch
> ist, und er sagt es erst nach zwanzig Minuten.

Diese Runde fragt, warum zwanzig Minuten.

## Gemessen

```
ein Chromium-Lauf über die echte demo.html:   664 ms
derselbe Aufruf am 13. September:             > 20 Minuten, keine Zeile Ausgabe
```

Der Bestand hat fünf Werkzeuge, die einen Browser starten. Vier von ihnen
starten ihn wirklich; zwei davon mit Zeitschranke, zwei ohne:

| Werkzeug | Zeitschranke |
|---|---|
| `shopprobe.mjs` | 90 s |
| `bestellprobe.mjs` | 120 s |
| `oberflaechenprobe.mjs` | **keine** |
| `wegprobe.mjs` | **keine** |

> **Ausgerechnet die ohne Schranke war die einzige Stelle, an der der tote Shop
> auffiel.**

`wegprobe` trägt immerhin `--virtual-time-budget=5000`. Das deckelt die **Uhr
der Seite**, nicht den Prozess: Lädt das Skript gar nicht, wartet `--dump-dom`
trotzdem.

## Warum das mehr ist als Unbequemlichkeit

Ein Hänger sieht aus wie eine langsame Maschine. Diese Umgebung ist
zwischendurch wirklich langsam — der Schnelllauf schwankte heute zwischen 5,9 s
und 16,3 s —, und genau deshalb war die naheliegende Erklärung die falsche.

Was danach passiert, ist die eigentliche Gefahr: Wer wartet, bricht irgendwann
ab.

> **Eine Probe ohne Zeitschranke meldet nicht „langsam", sondern gar nichts —
> und wer sie abbricht, hat den Befund weggeworfen.**

Der Bestand kennt diesen Gedanken längst in anderer Gestalt. `pruefe-gebinde`
weigert sich lieber, als über eine fehlende Datei grün zu melden; der
Rückwegprüfer nennt seit heute Mittag die Artikel, die er **nicht** gefahren
ist. Beide sagen dasselbe: *Nicht messbar ist nicht grün.* Ein Zeitablauf ohne
Schranke sagt nicht einmal „nicht messbar".

## Was geändert wurde

**Beide Proben bekommen 60 s** — das Neunzigfache des gemessenen Laufs. Die
Zahl ist nicht dazu da, eine langsame Maschine aufzuhalten, sondern dazu, aus
einem Warten einen **Befund** zu machen.

**Und der Befund sagt, was er bedeutet.** `spawnSync` setzt bei Ablauf
`error.code === 'ETIMEDOUT'` und tötet den Browser; ohne eigenen Zweig stünde
dann „Browser-Exit null" da, und niemand wüsste, wonach zu suchen ist. Jetzt
steht:

```
der Browser hat nach 60 s nicht geantwortet — ein Lauf über die echte Seite
dauert unter einer Sekunde. Fast immer heißt das: Das Skript der Seite ist
nicht angelaufen. Zuerst ansehen, ob das Bündel geschlossen ist
(`fremdeModulzeilen` in src/buendel.js) und ob demo.html überhaupt parst
```

Das ist die Meldung, die gestern zwanzig Minuten und einen langen Umweg
gespart hätte.

## Der Wächter

Ein Testfall über den **Quelltext** der Browserproben, nicht über ihr
Verhalten — ein Lauf, der heute schnell ist, ist keine Zusage über morgen:

1. Jedes Werkzeug im Browserprüferregister, das einen Browser startet, trägt
   eine Zeitschranke.
2. Und die Gegenrichtung: Kein Werkzeug unter `bin/` startet einen Browser,
   ohne im Register zu stehen — sonst liefe es in keinem Gesamtlauf mit, und
   niemand hielte seine Zahl gegen ein Mindestmaß.

Die zweite Richtung ist beim ersten Lauf grün gewesen, und das war eine
Überraschung: Ich hatte `wegprobe.mjs` draußen vermutet. Sie steht im Register.
Die Zusicherung bleibt trotzdem stehen — sie hält einen Zustand fest, der gilt,
statt einen zu beschreiben, den ich erwartet hatte.

## Gegenprobe

| Gegenprobe | was sie einsetzt |
|---|---|
| `die-oberflaechenprobe-darf-wieder-haengen` | die Zeitschranke fällt weg |

## Was diese Runde nicht kann

Sie macht aus einem Hänger einen Befund. Sie macht aus dem Befund keine
Ursache: Steht eines Tages „der Browser hat nach 60 s nicht geantwortet" da und
liegt es nicht am Skript, dann sagt die Meldung das Falsche — sie nennt den
häufigsten Grund, nicht den gemessenen. Das ist eine bewusste Abwägung: Ein
Hinweis auf die wahrscheinliche Ursache ist mehr wert als keiner, solange
dabeisteht, dass er eine Vermutung ist.
