# Zwei Wege zur selben Zahl — und ein Urteil, das nicht sagte, worüber es urteilt

**28. August 2026.** Fortsetzung des Vorsatzes: erst die Ausgabe der
vorhandenen Werkzeuge lesen. Nach dem Katalogerzeuger die restlichen vier.
Zwei Befunde.

## 1. Die Höchstgebote der Anzeigen waren zu hoch

`npm run kampagne` rechnet für jede Anzeigengruppe einen Warenkorb durch und
leitet daraus das Höchstgebot je Klick ab. Es baut sein Kostenbild **von Hand**
zusammen, statt `berechneWarenkorb` zu rufen — und hat deshalb die gestern
eingebaute Untergrenze für Palette und Folierung nicht mitbekommen.

> **Zwei Wege zu derselben Zahl bedeuten, dass einer davon irgendwann alt
> ist** — und es ist immer der, den man beim Ändern vergisst.

Was sich ändert:

| Gruppe | max. Klick vorher | jetzt |
|---|---|---|
| Dämmung | 6,48 € | 5,91 € |
| Kamin | 8,79 € | 8,22 € |
| **Kanal** | **1,95 €** | **1,38 €** |
| **Mauerwerk** | **1,81 €** | **1,24 €** |
| WDVS, Mörtel | unverändert | (kein Sperrgut im Beispielkorb) |

Kanal und Mauerwerk verlieren fast dreißig Prozent ihres Spielraums. Beide
bleiben über dem Marktpreis von 0,50 €, also fällt keine Gruppe heraus — aber
wer mit 1,95 € statt 1,38 € bietet, zahlt den Unterschied aus dem Ertrag.

**Die Probe führt das Werkzeug jetzt aus** und hält seine Ausgabe Zeile für
Zeile gegen die Bibliothek. Sie fällt, sobald die beiden Wege wieder
auseinanderlaufen — gegengeprobt: Nimmt man die Nebenkosten aus dem Werkzeug
heraus, fällt sie.

Der saubere Weg wäre, das Kostenbild dort nicht mehr von Hand zu bauen. Das
ist ein größerer Umbau; bis dahin ist die Probe das Netz, und sie ist
ausdrücklich als Netz gekennzeichnet.

## 2. „Prüfung A: BESTANDEN" — über Antworten, die es nie gab

`npm run auswerten` endete mit:

```
Prüfung A: BESTANDEN
  tragende Marge: 40,0 %
  Folgen: 21366,70 € Umsatz, 33 Bestellungen, 1650 Sessions im Monat
```

Jede Eingabezeile darüber trug „FIKTIV" im Namen, und oben stand ein
ausführlicher Hinweis. Die **Urteilszeilen** trugen ihn nicht — und die liest
man zuerst.

> **Ein Urteil, das nicht sagt, worüber es urteilt, wird über den Markt
> gelesen** — auch wenn jede Zeile darüber „FIKTIV" heißt.

Jetzt steht ein Block vor dem ersten Urteil („PROBELAUF. Alle Eingaben sind
erfunden. Es liegt keine einzige echte Antwort vor — keine Anfrage ist
versendet."), und beide Urteilszeilen tragen den Zusatz „— an erfundenen
Daten".

**Abgeleitet, nicht hart gesetzt:** Der Hinweis erscheint, solange *jeder*
Eintrag „FIKTIV" trägt, und verschwindet von selbst, sobald eine echte
Antwort dabei ist. Ein Schalter, den jemand umlegen müsste, bliebe liegen —
und stünde dann über echten Zahlen. Beide Richtungen sind geprüft.

## Die anderen zwei, ohne Befund

- **`npm run suchvolumen`** sagt es bereits in der zweiten Zeile: „FIKTIVE
  Beispielmessung als Vorlage … sie belegen nichts." Genau die Form, die
  `auswerten` jetzt auch hat — sie war im Haus, nur nicht überall.
- **`npm run import`** ohne Argumente druckt seine Aufrufzeile und tut
  nichts. Richtig so.
- **`npm run build`** schreibt `demo.html` aus dem Platzhalterkatalog, wie
  vorgesehen.

## Stand

- 736 Tests grün (vorher 732; +4), `pruefe-tests` 735 Fälle / 0 Verdacht
- `pruefe-widerrufe` 135 Dateien / 48 Fundstellen, alle gedeckt
- Sämtliche npm-Skripte sind in dieser Runde einmal aufgerufen und ihre
  Ausgabe gelesen worden. Zwei von acht hatten einen Befund.
