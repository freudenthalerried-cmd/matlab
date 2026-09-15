# Dieselbe Frage kommt über zwei Wege

Stand: 2026-08-29

## Der Anlass

Vor einer Stunde haben die 23 begründeten Ablehnungen einen Kundensatz
bekommen und stehen seither auf der **Suchseite**. Die Regel dieses
Nachmittags verlangt die Nachfrage:

> Wo wird dieselbe Frage noch gestellt?

Sie wird über zwei Wege gestellt. Der Kunde tippt „Drainage" ins Suchfeld,
ein Assistent liest `llms.txt`. Die Suchseite antwortete seit einer Stunde;
`llms.txt` schwieg weiter.

**Für diesen Kanal wiegt die Lücke schwerer.** Wer einen Assistenten fragt, ob
dieser Händler Estrich führt, bekommt ohne Angabe die wahrscheinlichste
Ersatzantwort — und die lautet bei einem Baustoffhändler „ja". Die Datei
zählt 46 Artikel auf; dass die Liste vollständig ist, steht sogar darin. Ein
Modell schließt daraus nicht zuverlässig, dass alles andere fehlt.

## Was jetzt in `llms.txt` steht

```
## Was wir nicht führen

Danach wird gefragt, und wir haben es nicht. Genannt ist jeweils, was
stattdessen im Sortiment steht — als Abgrenzung, nicht als Ersatz.

- **drainage**: Drainagerohre führen wir nicht. Die Noppenbahn schützt die
  Kellerwand und leitet Wasser ab, sie ersetzt aber keine Drainageleitung.
- **rauchrohr**: Ofenrohre vom Ofen zum Kamin führen wir nicht. Unser
  gedämmtes Innenrohr ist ein Teil des Systemkamins und kein Ersatz dafür.
- …
```

23 Zeilen, 1,5 KB. Ausgeliefert wird der **Kundensatz**, nicht die
redaktionelle Begründung — dieselbe Trennung wie im Browserbündel.

## Geprüft

Ein Test verlangt den Abschnitt und **jedes** der 23 Wörter darin — nicht
drei ausgesuchte. Dazu die Gegenrichtung: Keine der langen
`warum`-Begründungen darf im Kundenkanal auftauchen. Gegengeprobt durch
Abschalten des Abschnitts: Der Testfall fällt.

## Der Stand nach diesem Tag

Die Auskunft „was führt dieser Shop nicht" steht jetzt an zwei Stellen, und
das sind die beiden, an denen gefragt wird. Der Vollständigkeit halber die
Karte der heute berührten Angaben:

| Angabe | Artikelseite | Karte | `llms.txt` | Feed | Suchseite |
| --- | --- | --- | --- | --- | --- |
| Preis je Einheit | ✓ | ✓ | ✓ | ✓ | ✓ |
| kleinste bestellbare Menge | ✓ | ✓ | ✓ | ✓ | — |
| Bezugsgröße des Preises | ✓ | — | — | ✓ | — |
| was wir nicht führen | — | — | **✓** | — | **✓** |

Die Striche sind kein Versehen: Eine Artikelkarte trägt keine Bezugsgröße,
und eine Artikelseite beantwortet keine Frage nach fehlender Ware. Was
dieser Tag gelehrt hat, ist die Frage — nicht, überall alles hinzuschreiben.

## Notiert

Der Preisabgleich (`npm run pruefe-preise`) hält Preis und Mindestmenge über
vier Ausgaben zusammen. Für die Nicht-Sortiment-Auskunft gibt es keinen
solchen Abgleich; sie steht in zwei Kanälen und wird von zwei Tests gehalten.
Ein dritter Kanal wäre der Anlass, auch dafür einen Abgleich zu bauen — nicht
vorher.
