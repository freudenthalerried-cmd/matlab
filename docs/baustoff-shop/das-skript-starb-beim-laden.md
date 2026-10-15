# Das Skript starb beim Laden

**Stand: 30. August 2026** · Zweiter Befund desselben Laufs, gefunden beim
Nachmessen der Suche. Betroffen: `shop/src/buendel.js`,
`shop/bin/oberflaechenprobe.mjs`, `shop/bin/shopprobe.mjs`.

## Wie er auffiel

Nach der Umstellung der Suche liefen alle Prüfer noch einmal. Die
Oberflächenprobe meldete zwei Fehlschläge — ausgerechnet an der
Radon-Gebietsauskunft, die mit der Suche nichts zu tun hat:

```
✗ Gebietsauskunft beim Laden
    fehlt im gerenderten Ergebnis: „steht nicht auf der Ausnahmeliste"
    gerendert war:
```

*Gerendert war:* nichts. Das Element existierte, aber niemand hatte es
gefüllt. Der Verdacht lag zuerst bei mir — ich hatte eine Stunde zuvor
`shopkern.js` umgebaut. Die Gegenprobe mit dem alten Stand widerlegte das:
Auch ohne meine Änderung blieb die Auskunft leer. Ein Browserlauf mit
Konsolenausgabe nannte den Grund in einer Zeile:

```
Uncaught ReferenceError: Cannot access 'KORBSCHLUESSEL' before initialization
```

**Das Skript der Demoseite war beim Laden gestorben.** Nicht ein Teil davon —
das ganze Modulskript, und damit Katalog, Warenkorb, Kasse, Rechner.

## Die Ursache

`demo.html` entsteht, indem die Module des Kerns zu **einem** Skript
aneinandergehängt werden. Die Reihenfolge stand als Liste von Hand in
`src/buendel.js`, darüber der Satz:

> „Reihenfolge der Module — Abhängigkeiten stehen vor ihren Nutzern."

Am 29. August bekam die Datenschutzseite ihren Eintrag zum
`localStorage`-Schlüssel — und zwar richtig: nicht als erfundene
Zeichenkette, sondern aus `KORBSCHLUESSEL` in `shopkern.js`. Damit hing
`rechtstexte.js` plötzlich an `shopkern.js`. In der Liste steht
`rechtstexte.js` an neunter, `shopkern.js` an zwanzigster Stelle.

Im Modulbetrieb ist das gleichgültig — `import` sorgt selbst für die
Reihenfolge, und deshalb waren alle 852 Tests grün. Im zusammengefügten
Skript ist es tödlich: `const` in der zeitlichen Totzone.

> **Der Kommentar war eine Zusage, die niemand einlöste.** Eine Reihenfolge,
> die von Hand gepflegt wird, kann still falsch werden — und wird es an dem
> Tag, an dem jemand eine Abhängigkeit hinzufügt und die Liste nicht kennt.

## Warum es einen Tag lang niemand merkte

Weil die Probe eine Datei prüfte, die es so nicht mehr gab.

`demo.html` ist ein **Erzeugnis**, das im Repository liegt. Es wurde am
28. August zuletzt gebaut. Alles seither — die Gebindemengen, der
Mengenschritt, die Datenschutztabelle, die Maßvereinheitlichung — stand im
Quelltext, aber nicht in der Datei. Die Oberflächenprobe las die Datei und
meldete 11 von 11 grün.

Dieselbe Fehlerklasse wie die `llms.txt` zwei Stunden zuvor, nur an der
anderen Seite: dort **zwei Erzeuger** für eine Datei, hier **ein Erzeugnis,
das seinem Erzeuger davongelaufen ist.**

## Was geändert wurde

**1. Die Reihenfolge wird gerechnet, nicht gepflegt.** `reihenfolge()` liest
die `import`-Zeilen und sortiert topologisch. Ein Ringschluss wird gemeldet,
nicht wegsortiert — zwei Module, die einander brauchen, *haben* keine
Reihenfolge. Die Liste sagt jetzt nur noch, **welche** Module gebraucht
werden.

**2. Zwei Proben lehnen veraltete Erzeugnisse ab.** `oberflaechenprobe` und
`shopprobe` vergleichen die Änderungszeit ihres Prüflings mit der jedes
Quellmoduls, jeder Datendatei und des Bauwerkzeugs. Ist eine Quelle jünger,
brechen sie mit Ausgang 2 ab:

```
Abbruch: demo.html ist älter als 2 Quelldatei(en) — zuerst npm run build.
  src/buendel.js, src/shopkern.js
Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.
```

Die Rechnung dahinter (`juengereQuellen`) bekommt Zeitstempel und gibt Namen
zurück — sie fasst keine Datei an und lässt sich deshalb prüfen, ohne welche
anzulegen.

## Was die Gegenprobe zeigte

| Eingriff | Ergebnis |
|---|---|
| Sortierung abgeschaltet, neu gebaut | `das gebaute demo.html führt sein Skript wirklich aus` fällt |
| Frischeprüfung, eine Quelle angefasst | beide Proben brechen ab, statt grün zu melden |
| Ringschluss aus zwei erfundenen Modulen | `reihenfolge` meldet ihn, statt eine Reihenfolge zu erfinden |

Der erste Testfall ist der wichtige: Er prüft nicht die Funktion, sondern
das **ausgelieferte Erzeugnis** — steht die Deklaration des Schlüssels vor
seiner ersten Verwendung? Genau die Frage, die einen Tag lang niemand
gestellt hat.

## Was offen bleibt

`demo.html`, `ausgabe/website.html` und `ausgabe/site/` liegen als
Erzeugnisse im Repository. Die Frischeprüfung fängt jetzt ab, dass ein
Prüfer sie veraltet misst — sie hindert niemanden daran, einen veralteten
Stand zu **committen**. Der saubere Weg wäre, Erzeugnisse gar nicht
einzuchecken; das ist eine Entscheidung über den Auslieferungsweg und wartet
auf Hosting und Domain. Bis dahin gilt die Reihenfolge: erst `npm run build`
und `npm run website`, dann die Proben, dann committen.
