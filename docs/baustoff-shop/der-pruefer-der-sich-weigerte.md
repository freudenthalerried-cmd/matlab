# Der Prüfer, der sich weigerte — und als stumm gemeldet wurde

**30. August 2026.** Zweiter Durchgang des Tages, diesmal nach der eigenen
Anleitung im Loop-Abschnitt: erst `npm run startklar`, dann die Prüfer laufen
lassen und **einem Befund nachgehen**, statt einen neuen Prüfer zu bauen.

`startklar` meldet unverändert 2 erfüllt, 3 offen, 2 nicht feststellbar — alle
fünf offenen Punkte gehören dem Auftraggeber. Die neun Prüfer sind grün. Der
Befund kam von dem Werkzeug, das die Prüfer prüft.

## Was dastand

```
Abbruch: demo.html ist älter als 2 Quelldatei(en) — zuerst npm run build.
  src/baustoffkatalog.js, src/preis.js
Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.
✗ oberflaechenprobe
    keine Mengenangabe in der Ausgabe — Muster /(\d+) Szenarien/
    Ein Prüfer ohne Mengenangabe kann nicht sagen, ob er etwas angesehen hat.
```

Beide Absätze stimmen für sich. Zusammen sind sie irreführend, und zwar in
drei Punkten:

1. **Das Urteil beschreibt den falschen Fehler.** Die Probe hat keine
   Mengenangabe unterschlagen — sie ist gar nicht gelaufen. Sie hat sich
   geweigert, mit Ausgangscode 2 und einer vollständigen Begründung.
2. **Die Begründung hat den falschen Absender.** Sie steht auf `stderr`, und
   `execFileSync` vererbt `stderr` an das Terminal, statt es zu reichen. Der
   Text erschien deshalb auf dem Bildschirm, aber **vor** dem Prüfernamen und
   ohne Einrückung — als hätte ihn `pruefe-pruefer` geschrieben.
3. **Die Schlusszeile zählt ihn falsch.** „2 ohne belastbaren Umfang" schickt
   den Lesenden ein Regex-Muster suchen. Die Antwort stand vier Zeilen höher:
   `npm run build`.

> **Ein Werkzeug, das sich weigert zu laufen, hat einen Befund über die
> Umgebung geliefert, keinen über sich selbst.** Wer beides in denselben
> Zähler wirft, verliert genau die Information, die weiterhilft.

## Wie es jetzt aussieht

```
✗ oberflaechenprobe
    abgebrochen mit Code 2 — der Prüfer hat sich geweigert zu laufen:
      Abbruch: demo.html ist älter als 1 Quelldatei(en) — zuerst npm run build.
        src/preis.js
      Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.

11 Prüfer befragt, 0 ohne belastbaren Umfang, 2 abgebrochen.
Ein Abbruch ist kein Befund über den Umfang — der Prüfer ist gar nicht
gelaufen. Erst die genannte Ursache beheben, dann erneut befragen.
```

`stderr` wird gereicht statt vererbt, der Abbruchgrund steht eingerückt unter
dem Namen dessen, der ihn geschrieben hat, und die Zählung trennt „stumm" von
„nicht gelaufen".

## Der eigentliche Befund: das Werkzeug hatte selbst keine Probe

`bin/prueferpruefung.mjs` prüft seit Wochen die neun Prüfer darauf, ob sie
überhaupt etwas angesehen haben. Es war damit das einzige Werkzeug im Bestand
**ohne eigene Probe** — die Entscheidung steckte in einer Schleife über
Unterprozesse, und die bewegt man nur mit echten Prüferläufen. Genau deshalb
ist der Fehler so lange dagestanden.

Das Urteil ist jetzt herausgezogen: `src/prueferurteil.js`, vier Ausgänge,
die nicht ineinanderfallen dürfen.

| Ausgang | heißt |
|---|---|
| `grün` | gelaufen, Menge genannt, über dem Mindestmaß |
| `zu-wenig` | gelaufen, aber zu wenig angesehen — zeigt er auf eine Probedatei? |
| `ohne-menge` | gelaufen und stumm über den Umfang |
| `abbruch` | **nicht** gelaufen; er hat gesagt, warum |

Ausgangscode 0 und 1 heißen „gelaufen" (1 = mit Treffern, das ist sein Befund,
nicht sein Scheitern). Alles andere ist Abbruch. Die Prüfung des Codes steht
**vor** der Suche nach dem Muster — sonst erklärt eine Zahl in der halben
Ausgabe eines abgestürzten Prüfers ihn zu grün.

## Gegenproben

Zwölf neue Testfälle in `test/prueferurteil.test.js`. Sechs Mutationen, jede
mit `.bak`-Sicherung und danach zurückgesetzt:

| Mutation | erkannt |
|---|---|
| Abbrucherkennung ausgeschaltet (der behobene Fehler) | ja — 4 rot |
| Code 2 gilt als „gelaufen" | ja — 3 rot |
| Abbruchgrund nimmt alle Zeilen statt der letzten drei | ja |
| zweite Fangzahl ignoriert (`pruefe-stand` zählt 195 **von 195**) | ja |
| Untergrenze `<` zu `<=` verschoben | **nein** — Lücke, siehe unten |
| Werkzeug urteilt wieder selbst statt über das Modul | ja |

Die fünfte Mutation blieb grün, weil kein Testfall genau auf der Grenze lag:
42 und 3 gegen ein Mindestmaß von 20 sagen nichts über den Fall 20. Ein
Testfall dafür ergänzt, danach wird auch diese Mutation erkannt. Eine Grenze,
die kein Testfall berührt, ist keine geprüfte Grenze.

Die sechste ist die Absicherung gegen das Muster, das dieses Projekt am
häufigsten getroffen hat: Der Testfall liest den Quelltext von
`bin/prueferpruefung.mjs` und fällt um, sobald dort wieder eigene Vergleiche
gegen `mindestens` oder den Ausgangscode stehen. Zwei Wege zur selben Ausgabe,
und der kürzere gewinnt — hier gäbe es dann zwei Urteile, und die Probe deckte
nur noch eines ab.

## Was bewusst nicht geändert wurde

Der Frischewächter nimmt **alle** Dateien in `src/` als Quellen von
`demo.html`, auch solche, die keine Seite bündelt — `src/prueferurteil.js`
selbst hat prompt einen Neubau erzwungen. Das ist ungenau, aber in die
sichere Richtung: Er baut zu oft neu, nie zu selten. Die genaue Antwort wäre
der Importgraph aus `src/buendel.js`; sie tauscht eine harmlose Fehlmeldung
gegen die gefährliche ein — ein neuer Import, den der Graph nicht mitbekommt,
und ein veraltetes Erzeugnis geht als geprüft durch. Bleibt wie es ist, mit
diesem Vermerk als Begründung.

## Stand

933 Testfälle grün (vorher 921), `pruefe-tests` 931/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 196/196.
