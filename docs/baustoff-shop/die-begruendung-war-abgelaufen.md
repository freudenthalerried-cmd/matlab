# Die Begründung war abgelaufen

*5. September 2026. Runde 125. **Gate 27.***

## Die Frage, die die letzte Runde offengelassen hat

Gestern Nacht ließen sich zwei Probendateien fünfzehn Stunden lang nicht
einmal einlesen, und elf Gesamtläufe meldeten Grün. `npm run pruefe-lesbar`
schließt seither die unterste Stufe: Was sich nicht einlesen lässt, fällt
sofort auf.

Der eigentliche Grund stand damit noch da:

> **`npm run alles` holt die Browserproben nicht ab. Der einzige Schutz davor,
> dass sie verrotten, war ein Schalter, den niemand umlegt.**

Die Begründung dafür steht seit dem 1. September im Prüferregister:

> *Sie bleiben aus dem Regellauf heraus, weil jede einen Chromium-Start je
> Einheit kostet — je Szenario bei den Proben, je gebauter Seite beim Zensus;
> **zusammen gut eine Minute.***

Das war richtig. Am 1. September hatte dieser Lauf **zwanzig Schritte** und
dauerte rund drei Minuten. Eine Minute war ein Drittel — ein Preis, über den
man reden muss.

## Nachgemessen

Vier Läufe, einzeln gestoppt:

| Probe | Dauer |
|---|---|
| `oberflaechenprobe` | 12 s |
| `shopprobe` | 12 s |
| `bestellprobe` | 5 s |
| `rahmenzensus` | 8 s |
| **zusammen** | **37 s** |

Dagegen der Regellauf von heute, zweimal gestoppt: **820 und 1.259
Sekunden** — der längere lief neben anderer Arbeit.

> **Drei bis fünf Prozent.**

*Zwei Messungen, weil eine Zahl bei einer schwankenden Größe keine Messung
ist. Der erste Anlauf dieses Abschnitts nannte „rund eine Viertelstunde",
geschätzt und nicht gestoppt — das wäre in dieselbe Falle gelaufen wie die
Begründung, die hier abläuft.*

> **Die Begründung ist nicht falsch geworden, sie ist abgelaufen.** Der Preis
> ist derselbe geblieben, und der Vergleichsmaßstab ist um das Fünffache
> gewachsen. Niemand hat die Rechnung je nachgezogen, weil an ihr nichts
> falsch aussah.

Und was in der ausgelassenen Hälfte lag, sagen acht Tage:

| Datum | Befund | wo er saß |
|---|---|---|
| 30.08. | Prüfer lief gegen ein veraltetes `demo.html` und meldete Grün | Browserprobe |
| 03.09. | Drei von 53 Szenarien standen sechs Stunden rot, ungemeldet | Browserprobe |
| 05.09. | Zwei Probendateien ließen sich nicht einlesen, 15 Stunden | Browserprobe |

**Alle drei in dem Teil, den der Regellauf nicht anfasste.** Das ist kein
Zufall: Ein Teil, der nicht läuft, sammelt Fehler, und ein Teil, der nicht
gemeldet wird, sammelt sie unbemerkt.

## Gate 27

> **Die Browserproben laufen im Regellauf mit.**

`--ohne-browser` bleibt für den eiligen Lauf — und sagt in der Ausgabe dazu,
was er ausgelassen hat:

```
Gesamtlauf — 32 Schritte OHNE Browserproben (--ohne-browser)

  ! 4 Browserproben übersprungen — was hier nicht läuft, ist nicht geprüft.
```

`--mit-browser` bleibt gültig und tut nichts mehr. **Ein Schalter, der einmal
etwas bedeutet hat, gehört nicht stillschweigend zum Fehler:** Wer ihn aus
Gewohnheit setzt, soll nicht plötzlich etwas anderes bekommen, als er erwartet
— er bekommt genau das, was er wollte.

**Begründung für die Selbstentscheidung:** Sie kostet kein Geld, ändert keine
Zusage nach außen und ist mit einer Zeile zurückzunehmen. Offen zu lassen
hieße, die einzigen Proben, die sehen, was ein Mensch sieht, weiter von einem
Schalter abhängig zu machen, den niemand umlegt.

## Was der Lauf jetzt meldet

```
Gesamtlauf — 36 Schritte, mit Browserproben
…
  ✓ oberflaechenprobe      11 Szenarien
  ✓ shopprobe              53 Szenarien
  ✓ bestellprobe           5 Prüfungen von Klick bis Angebot
  ✓ rahmenzensus           81 gebaute Seiten im 390-px-Rahmen
  ✓ gegenproben            52 von 52
  ✓ nichts liegen geblieben 0 offene Zettel

36 von 36 Schritten grün.
```

**Nebenbei gemessen, und es überrascht:** Die ersten zwanzig Prüfer zusammen
brauchen **35 Sekunden**. Der Rest der dreizehn Minuten sind Testlauf und
Gegenproben — letztere fahren je Mutation einen ganzen Prüfer, teils mit
Neubau. Die Browserproben waren also nie der teure Teil; sie waren nur der
sichtbare.

## Was das für die Laufzeit heißt

Der Lauf dauert jetzt knapp vierzehn Minuten, davon 37 Sekunden Browser. Wer das nicht
bezahlen will, hat zwei Wege, und beide sind ehrlicher als die alte
Voreinstellung: `--ohne-browser` sagt, was fehlt, und ein einzelner Prüfer
lässt sich weiterhin direkt aufrufen.

**Was nicht geschieht:** die Proben schneller machen, indem weniger geprüft
wird. Die 37 Sekunden sind 64 Szenarien und 81 gebaute Seiten; sie kosten, was
sie sehen.

## Die Lehre

> **Eine Begründung, die einmal gestimmt hat, gilt nicht auf Dauer — und sie
> sieht nie so aus, als müsste man sie nachrechnen.** Sie stand in einem
> Kopfkommentar, sie war sauber geschrieben, sie nannte sogar eine Zahl. Was
> ihr fehlte, war das Datum, gegen das die Zahl zu halten war.

Dieselbe Familie wie der nötige Monatsumsatz, der zwei Tage vor Gate 21
gerechnet wurde und danach fünf Tage als aktuelle Zahl dastand. Damals war es
die Kartenzahl gegen EPS; hier ist es eine Minute gegen drei Minuten Laufzeit,
gemessen an einem Lauf, den es nicht mehr gibt.
