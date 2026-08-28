# Die Grenze lag am falschen Ort — und dahinter stand ein zweiter Fehler

**28. August 2026.** Gestern aufgeschrieben, heute geschlossen: Der
Seitenprüfer übersprang **ganze Seiten** — alles unter `wissen/`, `gruppe/`
und `system/`. Die Begründung war richtig: Dieser Text ist an der Quelle
geprüft, samt der begründeten Ausnahmen, die das Rendern nicht überleben. Die
Grenze lag nur am falschen Ort.

> **Auf einer übersprungenen Seite steht auch Text, den das Seitenbauwerkzeug
> selbst schreibt.** Der lief durch keine der beiden Prüfungen: nicht in
> `inhalte/`, also nicht in `pruefe-inhalte`; auf einer ausgenommenen Seite,
> also nicht in `pruefe-seiten`.

## Die Grenze verläuft jetzt am Absatz

Das Seitenbauwerkzeug klammert den Text aus der Quelle in
`<!--quelltext-->…<!--/quelltext-->`. Der Prüfer schneidet genau diesen
Bereich heraus und liest den Rest. Aus 54 geprüften Seiten mit 213 Absätzen
wurden **57 Seiten mit 216 Absätzen** — die drei zusätzlichen sind die, die
bisher niemand gelesen hat.

Eine unpaarige Marke bricht die Prüfung ab, statt stillschweigend zu viel oder
zu wenig zu lesen. Gegengeprobt: die schließende Marke entfernt, der Prüfer
meldet „2 öffnende, 0 schließende Quelltextmarken" und bricht ab. Ein Marker,
der unbemerkt verrutscht, wäre dieselbe Falle noch einmal.

## Der erste Blick in den blinden Fleck fand sofort etwas

Die neu gelesenen Absätze meldeten zwei Verdachtsfälle:

```
Absatz 2: Die Lagen stehen in Einbaureihenfolge …
  → Zahl ohne Quelle: 3 L — jede Zahl braucht Herkunft und Stand
```

**„3 Lagen" wurde als „3 Liter" gelesen.** Die Regel für Zahlen mit Maßeinheit
hatte keine Wortgrenze am Ende, und `l`, `h`, `min` stehen am Anfang
unzähliger deutscher Wörter — „5 Häuser" wären 5 Stunden gewesen, „12
Monteure" 12 Monate.

Das ist die **dritte** Stelle im Projekt mit exakt diesem Fehler, nach
`marke()` im Seitenbauwerkzeug und der Bauformerkennung in `bilder.js`. Und
wieder ist die Lösung `(?![\p{L}])` mit `/u` statt `\b`, dessen Wortgrenze
ASCII ist und kein „ö" kennt.

Bemerkenswert ist nicht der Fehler, sondern **wo er saß**: in einem Prüfer,
der ihn selbst nie melden konnte, weil er die Absätze mit den Fehltreffern
nicht las. Ein blinder Fleck versteckt nicht nur schlechten Text — er versteckt
auch die Fehler des Prüfers.

Gegenprobe in beide Richtungen: Ohne die Wortgrenze fallen die neuen Tests
*und* der bestehende Test über die gebauten Seiten. Sechs echte Einheiten
(25 kg, 750 l, 30 €, 5 °C, 50 cm, kg je Fläche) werden weiterhin verlangt —
eine Wortgrenze, die die Regel stumm macht, wäre schlimmer als keine.

## Stand

- 714 Tests grün (vorher 709; +5)
- `pruefe-seiten` **57 Seiten, 216 Absätze**, 0 Verdachtsfälle (vorher 54/213)
- `pruefe-inhalte` 24/355/0, `pruefe-widerrufe` sauber, `pruefe-pruefer` 6
- `shopprobe` 26 Szenarien, `oberflaechenprobe` 11
- Website 81 Seiten ohne toten Verweis

## Was von der Prüfkette offen bleibt

`schneideQuelltext` steht jetzt in `src/`, ist rein und getestet — der
`bin/`-Aufruf tut nur noch das Ausgeben und Abbrechen. Damit ist die
Trennung dieselbe wie überall sonst im Projekt: Die Regel ist prüfbar, das
Werkzeug drumherum nicht mehr als nötig.

Offen bleibt, was ein Prüfer grundsätzlich nicht kann: Ob die Aussage in
einem Absatz **stimmt**, sagt nur die Quelle. Der maschinelle Durchgang
liefert Verdacht, kein Urteil — daran ändert eine schärfere Grenze nichts.
