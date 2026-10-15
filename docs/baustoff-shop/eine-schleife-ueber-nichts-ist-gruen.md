# Eine Schleife über nichts ist grün

**9. September 2026.** Fünf Runden ohne Gesamtlauf — 37 Minuten, 47 Schritte,
124 Gegenproben. **39 grün, zwei rote Befunde, beide von mir, beide aus den
zwei Runden davor.** Beide sind durch den Haken hindurch committet worden.

---

## Erstens: zwei Testfälle, die nichts prüfen

```
startklar.test.js  Zeile 366
  → Schleife über `b.punkte` ohne vorherige Längenzusicherung
zahlung.test.js    Zeile 245
  → Schleife über `ZAHLUNGSBEDINGUNGEN.angeboten` ohne Längenzusicherung
```

Beides sind Testfälle, die ich als **die Regel statt das Beispiel**
geschrieben habe — „für *jeden* Punkt gilt …". Genau diese Form hat die Lücke:
Läuft die Liste leer, läuft die Schleife nicht, und der Testfall meldet grün.

`npm test` kann das nie finden. Eine Schleife über nichts wirft nichts.

> **Ein Testfall, der über eine Liste läuft, prüft die Liste — nicht die
> Regel. Wer die Regel meint, muss zuerst zusichern, dass die Liste nicht leer
> ist.**

Es ist dieselbe Sorte wie „elf Schleifen, die grün liefen und nichts prüften"
aus dem August. Damals entstand `npm run pruefe-tests`, und heute hat es genau
das wieder gefunden — nur eben erst im Gesamtlauf, achtzehn Stunden und drei
Commits später.

### Der Haken kannte den Prüfer nicht

Der pre-commit-Haken ruft `mutationspruefung`, die Frischeprüfung und
`npm test`. Er ruft **nicht** die Prüfer. Also ging beides hinaus.

Gemessen, bevor entschieden:

| Prüfer | Dauer | im Haken |
|---|---|---|
| `pruefe-tests` | **215 ms** | **ja, seit heute** |
| `pruefe-schaufenster` | 22.955 ms | nein |

215 Millisekunden gegen zwei Fehler, die `npm test` bauartbedingt nicht sehen
kann — das ist keine Abwägung. **`pruefe-schaufenster` bleibt draußen:** Es
verdoppelte jeden Commit, und sein Befund ist eine veraltete Zahl, kein
falsches Verhalten. Der Gesamtlauf holt es.

---

## Zweitens: die veraltete Zahl, und was sie über Zahlen sagt

```
✗ Testfälle [veraltet]
    die Untergrenze „über 1.000" ist bei 2009 nichtssagend geworden
```

Die PR-Beschreibung sagte „über 1.000 Testfälle". Das ist **nicht falsch** —
2009 sind über 1.000. Der Prüfer beanstandet etwas anderes:

> **Eine Untergrenze, die um den Faktor zwei unterschritten wird, ist keine
> Auskunft mehr, sondern eine Formalität, die immer stimmt.**

Nachgezogen auf „über 2.000". Ein Prüfer, der nur auf „falsch" prüfte, hätte
hier nie etwas gesagt.

---

## Und der Anker, der zum vierten Mal ins Leere lief

Die Gegenprobe `der-haken-ruft-einen-pruefer-der-nicht-mehr-so-heisst` sucht
in `haken.js` die Zeile, die sagt, was der Haken aufruft. Diese Zeile bekommt
in jeder Runde, die dem Haken etwas hinzufügt, einen Eintrag mehr — heute zum
zweiten Mal an einem Tag.

Bisher stand der **ganze Zeileninhalt** als Suchtext da. Ab heute die
kleinste Stelle, die den Ort eindeutig bezeichnet:

```diff
- suchen: "    ruft: ['bin/mutationspruefung.mjs', 'bin/erzeugnispruefung.mjs', 'npm test'],"
+ suchen: "      'bin/mutationspruefung.mjs',"
```

> **Ein Anker, der bei jeder Erweiterung anders lautet, ist keiner.**

Der Registertest hält fest, dass der Suchtext genau einmal vorkommt — im
Kopfkommentar steht derselbe Name ohne Anführungszeichen und zählt deshalb
nicht mit. Vier Mal derselbe Ärger, einmal die Ursache behoben.

---

## Was der Lauf sonst sagt

**39 von 47 Schritten grün, einer nicht messbar** — `pruefe-gebinde`, weil
`preise/poschacher-positionen.csv` seit dem 8. September fehlt. *Was nicht
gemessen wurde, ist nicht geprüft.*

Die übrigen roten Schritte sind Folgen der beiden Befunde: Drei Gegenproben an
`pruefe-schaufenster` meldeten „war schon vorher rot" — an einem roten Prüfer
lässt sich nichts zeigen. Mit der nachgezogenen Zahl sind sie wieder messbar.
