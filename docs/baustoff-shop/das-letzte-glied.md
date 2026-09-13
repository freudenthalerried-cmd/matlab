# Das letzte Glied

**11. September 2026, siebzehnte Runde.** Diese Runde hat **keinen Mangel
gefunden** — und deshalb einen Prüfer gebaut. Das ist die Ausnahme in diesem
Vorhaben, und sie steht hier mit ihrer Begründung.

## Wo gesucht wurde

Fünf Stellen, alle gemessen, alle in Ordnung:

| geprüft | Ergebnis |
|---|---|
| Sitemap gegen die gebauten Seiten | 78 von 82 — die vier fehlenden sind Suche, Kasse, Warenkorb, Fehlerseite |
| die acht Abnahmepunkte gegen den Bestand | acht von acht belegt |
| „Die Kasse nimmt unter 250 € keine Anfrage an" (llms.txt) | stimmt: kein Anfragetext, und der fehlende Betrag steht zweimal auf der Seite |
| die 146 Quellenstempel nach der Berichtigung von gestern | acht Formen, je ein Stand |
| das hochzuladende Archiv, von Hand ausgepackt | 87 Dateien, Byte für Byte gleich |

Die letzte Zeile ist der Grund für diese Runde.

## Was nicht geprüft war

`npm run paket` schreibt das Archiv, das der Auftraggeber hochlädt: **89
Einträge, 3,35 MB**, ein handgeschriebenes ZIP ohne fremde Bibliothek. Geprüft
war davon seit dem 8. September ein **selbstgebautes Archiv aus zwei
Einträgen** — `test/paket.test.js` legt zwei kleine Dateien an und ruft
`unzip -t`.

Die Richtung stimmt: Ein fremder Leser ist genau das Richtige. Die Größe
stimmt nicht. Ein ZIP, das Versätze, ein Zentralverzeichnis und UTF-8-Namen von
Hand schreibt, kann bei zwei kleinen Einträgen tragen und bei neunundachtzig
brechen — und niemand hätte es bemerkt.

> **Das Paket ist das letzte Glied: Alles, was hier in drei Wochen gebaut
> wurde, erreicht die Welt durch diese eine Datei.**

Und der Fehler wäre der stillste von allen: Geprüft wird der **Bau**,
hochgeladen wird das **Archiv**. Fehlt darin eine Datei, ist das Archiv in sich
tadellos — `unzip -t` ist zufrieden, die Abnahmeliste stimmt, die Prüfsummen
stimmen. Nur der Shop ist halb.

## Was jetzt gilt

`npm run pruefe-paket` misst das Erzeugnis und nicht den Bauer:

1. Es ruft **`npm run paket` als eigenen Vorgang** — geprüft wird die Datei,
   die das Werkzeug wirklich schreibt, und nicht ein zweiter Nachbau. (Genau
   dieser Fehler hat am 10. September eine Messung verdorben: *wer den Index
   anders baut als der Shop, misst seinen eigenen Nachbau.*)
2. `unzip -t` ist ein **fremder** Leser. Wer sein eigenes ZIP mit seinem
   eigenen Leser öffnet, prüft seinen Leser.
3. Ausgepackt wird in einen Wegwerfordner und **Byte für Byte** gegen
   `ausgabe/site/` gehalten — **in beide Richtungen**. Eine Datei zu wenig ist
   ein halber Shop; eine zu viel ist etwas, das niemand geprüft hat.
4. `INHALT.txt` wird gegen die ausgepackten Dateien nachgerechnet, ebenfalls in
   beide Richtungen. Ein Verzeichnis mit falschen Summen ist schlimmer als
   keines: Wer eine nachrechnet, hält ein tadelloses Paket für beschädigt.
5. `ABNAHME.txt` gilt gegen die **ausgepackten** Dateien und nicht gegen den
   Bau. Was der Auftraggeber nach dem Hochladen abhakt, muss in dem liegen, was
   er hochlädt.

**Ohne `unzip` läuft der Prüfer nicht** (Ausgang 2). Ein grüner Lauf ohne
fremden Leser wäre genau die Aussage, die dieses Werkzeug nicht machen darf.

Der Wegwerfordner räumt sich über `process.on('exit')` weg und nicht über ein
`finally` — der Prüfer endet an fünf Stellen mit `process.exit`, und ein
`finally` läuft dabei nicht. Das stand schon im Bestand; die Probe dazu hat es
mir gesagt, bevor ich es selbst gemerkt hätte.

## Die zwei Gegenproben

Sie trennen die beiden Hälften, statt beide zugleich abzuschalten:

- **Eine Datei weniger im Archiv.** Rot wird nur der Abgleich gegen den Bau —
  das Archiv selbst ist danach fehlerfrei, und genau das ist der Punkt.
- **Jede Prüfsumme um ein Byte verfälscht**, ohne die Dateien anzufassen. Rot
  wird nur die Nachrechnung des Inhaltsverzeichnisses.

Beide meldeten rot an der erwarteten Stelle, beide in einer Sekunde.

## Warum ein Prüfer und kein Befund

Die Regel dieses Vorhabens lautet: *einem Befund nachgehen, statt einen neuen
Prüfer zu bauen.* Sie gilt weiter. Hier war die Abwägung eine andere: Der
gemessene Zustand ist gut, aber **niemand hätte es gemerkt, wenn er es nicht
wäre** — und der Ort ist der letzte vor der Übergabe. Ein Prüfer, der eine
heute richtige Sache richtig hält, ist an dieser einen Stelle mehr wert als ein
weiterer Fund an einer Stelle, die schon dreifach gemessen wird.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2254 | **2257** |
| Prüfer | 48 | **49** |
| Gegenproben | 163 | **165** |

`npm test` grün (2257 bestanden, 3 übersprungen), `npm run pruefe-tests` (2260
Testfälle, 0 mit Verdacht), `npm run pruefe-pruefer` (49 Prüfer, 0 ohne
belastbaren Umfang, 1 abgebrochen — `pruefe-gebinde`), `npm run pruefe-paket`
(87 Dateien, 87 Prüfsummen, 8 Abnahmepunkte).
