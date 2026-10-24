# Eine Sperre, die den Anlass nicht nennt

**9. September 2026.** Der Gesamtlauf nach der letzten Runde meldete
zwei rote Schritte. Beide waren meine, beide aus der Runde davor, und
beide zeigen dieselbe Stelle aus zwei Richtungen.

---

## Erstens: die Regel, die ich selbst befolgt und nicht angemeldet habe

```
✗ pruefe-erzeugnis: Ausgang 1
    ✗ bin/systemtreuepruefung.mjs fasst ausgabe/ an und steht
      in keinem Eintrag  [leser-ohne-eintrag]
```

In der Runde davor hatte ich `bin/systemtreuepruefung.mjs` eine
Frischeprüfung gegeben — **genau die Regel, für die das Register `LESER`
existiert**: Wer das Erzeugnis liest, weigert sich über einem veralteten
Stand. Ich habe die Regel angewandt und den Eintrag nicht geschrieben.

Gefunden hat es das Register in der **anderen** Richtung: nicht „steht der
Eintrag als Datei da?", sondern „gibt es eine Datei ohne Eintrag?". Deshalb
hat jedes Register hier zwei Richtungen.

Und drei Wächter haben es durchgelassen:

| | sah es |
|---|---|
| `npm test` (1983 grün) | nein |
| der pre-commit-Haken | nein |
| `npm run alles` | **ja** |

> **Ein Haken ist kein Gesamtlauf. Was er nicht ruft, hält er nicht auf.**

---

## Zweitens: der Haken sperrte alles

```
✗ pruefe-haken — Ein Haken, der auf ein Werkzeug zeigt,
                 das er nicht mehr aufruft
    war schon vorher rot
      ✗ pre-commit sperrte auch ohne offenen Zettel (Ausgang 1)
```

Im Ruhezustand war der Prüfer grün. Also habe ich den Zustand nachgestellt,
in dem er rot war — **eine einzige Zeile**, ohne jede Inhaltsänderung:

```
$ touch src/format.js
$ node bin/hakenpruefung.mjs
  ✗ pre-commit sperrte auch ohne offenen Zettel (Ausgang 1)
      [haken-sperrt-immer]
```

Der Haken ruft `npm test`, und `npm test` enthält seit dem 8. September
`test/erzeugnisfrische.test.js`. Eine berührte Quelldatei genügt, und **jeder
Commit war gesperrt** — mit der Meldung:

```
Abbruch: npm test ist rot — der Commit bleibt stehen.
```

Das ist wahr und nutzlos. Es nennt nicht, was rot ist, und nicht, was zu tun
wäre.

> **Eine Sperre, die den Anlass nicht nennt, ist von einer Störung nicht zu
> unterscheiden — und wer sie für eine Störung hält, umgeht sie.**

### Gesperrt wird weiter — mit Anlass

`ausgabe/site` liegt im Verzeichnis. Ein Commit mit Quelle von jetzt und
Erzeugnis von vorhin hält einen Stand fest, den es nie gab. Die Sperre ist
richtig; falsch war ihre Auskunft. Der Haken prüft die Frische seither selbst
und sagt:

```
Abbruch: Das Erzeugnis ist älter als die Quelle — der Commit hielte
einen Stand fest, den es nie gab.
Bauen mit: npm --prefix shop run website && … run build && … run kampagne
Was genau veraltet ist: npm --prefix shop run pruefe-erzeugnis
```

### Und der Prüfer misst nicht mehr den Bauzustand

`bin/hakenpruefung.mjs` liest das Erzeugnis nicht selbst — es ruft den Haken,
der ruft `npm test`, und fünfunddreißig Testdateien lesen `ausgabe/site`. Über
einem veralteten Stand sperrt der Haken **zu Recht**, und die Messung nannte
das `haken-sperrt-immer`: ein Befund über den Haken, der in Wahrheit einer
über den Bauzustand war.

> **Ein Prüfer, der durch ein anderes Werkzeug hindurch liest, liest.**

Er steht jetzt in `LESER`, weigert sich mit **Ausgang 2** statt rot zu melden,
und der Gegenprobenläufer baut vor ihm. Nachgemessen: veraltet → Ausgang 2 mit
Namen der zwei Quelldateien; frisch → Ausgang 0, keine Meldung.

Beide Richtungen greifen von selbst: `haken-ruft-nicht` verlangt, dass das
Skript jedes im Register genannte Werkzeug wirklich aufruft, und
`leser-ohne-eintrag` verlangt den Eintrag für jede Datei, die `ausgabe/`
anfasst. Der Eintrag ist keine Notiz, sondern die Bedingung.

---

## Drittens, und zum zweiten Mal an einem Tag

Meine Änderung an `src/haken.js` bestand aus einem Wort in einer Liste:

```diff
- ruft: ['bin/mutationspruefung.mjs', 'npm test'],
+ ruft: ['bin/mutationspruefung.mjs', 'bin/erzeugnispruefung.mjs', 'npm test'],
```

Damit war die Gegenprobe, die genau diese Zeile sucht, entwaffnet — dieselbe
Sache wie am Morgen, als der umgeschriebene `llms.txt`-Vorspann den Anker der
Probe `palettiert-ohne-herkunft` verschob. Zweimal an einem Tag ist kein
Zufall, sondern eine Eigenschaft:

> **Das Gegenprobenregister hält Quelltext als Zeichenkette. Quelltext ist
> genau das, was eine Runde ändert. Jede Runde, die eine geankerte Zeile
> anfasst, entwaffnet eine Probe — lautlos, denn eine Mutation, die nicht
> ankommt, lässt den Prüfer grün.**

Gefunden hat es beide Male derselbe Testfall — *„Jeder Suchtext trifft genau
die Stelle, die gemeint ist"* —, und er ist der einzige Grund, dass es
auffiel. Er läuft in `npm test`, also im Haken, also vor jedem Commit.

---

## Stand

- `npm test`: **1983 grün, 0 rot**, davon 3 neue Testfälle am Haken.
- `pruefe-haken`: Ausgang 0 bei frischem, Ausgang 2 bei veraltetem Erzeugnis.
- `pruefe-erzeugnis`: grün, zwei Einträge mehr im Register.
- Gegenprobe `leser-ohne-frischepruefung`: *meldete rot an der erwarteten
  Stelle*; `der-haken-ruft-einen-pruefer-der-nicht-mehr-so-heisst`: Suchtext
  nachgezogen.
