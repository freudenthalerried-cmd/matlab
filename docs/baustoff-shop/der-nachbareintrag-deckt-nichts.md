# Der Nachbareintrag deckt nichts

**2. September 2026, nachmittags.** Eine Stunde zuvor ist beim Nachziehen der
Keyword-Zahl etwas aufgefallen, das ich benannt und stehen gelassen habe: Eine
überholte Zahl in `STATUS.md` blieb ungemeldet, weil acht Zeilen weiter — in
einem **fremden** Tabelleneintrag über ein anderes Dokument — zufällig die
Worte „ersten Anlaufs" standen. Der Nachbar hat die Zeile gedeckt.

Der Satz von damals lautete: *„Die Regel ist für Tabellendokumente
nachweislich zu grob. Der schärfere Umbau steht aus."* Er steht hiermit nicht
mehr aus.

## Was „in Sichtweite" heißen soll

Zwei Prüfer hängen daran — der Widerrufsprüfer (seit 30. August) und der
Leitzahlenprüfer (seit 1. September). Beide fragen dasselbe: Sieht ein Leser,
der die Zahl oder die zurückgenommene Aussage liest, auch ihre Bedingung?

Bisher war die Antwort **±8 Zeilen**, ohne Ansehen dessen, was dort steht. In
Fließtext ist das ein brauchbares Maß. In einer Tabelle ist es falsch:
`STATUS.md` ist eine einzige lange Tabelle aus 260 Einträgen über
verschiedene Dokumente. Acht Zeilen weiter steht ein fremder Eintrag über ein
fremdes Thema.

> **Was der Leser als eigenen Eintrag liest, ist sein eigenes Sichtfeld.**

## Warum die Zeile allein zu streng wäre

Der erste Anlauf machte genau das: Eine Tabellenzeile sieht nur sich selbst.
Ergebnis: **21 neue Meldungen** — und die Hälfte davon zu Unrecht.

```
✗ marge-25-prozent.md:60   | 10 % | 13,3 % | 45.356 € |
✗ rechnung-zum-zuschlag.md:41   | 25 % | 13,3 % | 45.356 € | 70 |
```

Das sind **Rechentabellen**. Wer eine solche Zeile liest, liest den Kopf mit
und den Satz, der die Tabelle einführt — und dort steht die Bedingung, „bei
Kartenzahlung", „Stand 25.08.". Eine Zeile aus einer Rechentabelle ist nicht
kontextfrei; eine Zeile aus einem Einträgeverzeichnis ist es.

Die zweite Fassung trennt beides:

| Fundstelle in … | Sichtfeld |
|---|---|
| Fließtext | ±8 Zeilen, **ohne** fremde Tabellenzeilen |
| einer Tabellenzeile | die Zeile selbst, der Kopf ihrer Tabelle, der Text **vor** der Tabelle — **nicht** die Nachbarzeilen |

Damit fielen 9 der 21 Meldungen weg. Übrig blieben **12 echte**.

## Die zwölf

Alle vom selben Bau: eine Tabellenzeile, die eine abgelöste Zahl oder eine
zurückgenommene Aussage trägt, während die Bedingung im Nachbareintrag steht.

| Datei | was fehlte |
|---|---|
| `STATUS.md` (2×) | 45.356 €, 72.740 €, 70/112 Bestellungen ohne „Kartenzahlung"; die zurückgenommene These „Nur der Rechnungskauf kann das Gate verletzen" ohne ihre Rücknahme |
| `gate-register.md` | 45.356 € im Gate-21-Eintrag |
| `rechnung-zum-zuschlag.md` (2×) | die Vorher-Nachher-Zeilen ohne Zahlweg |
| `zweiter-lieferant-und-skonto.md` | dieselbe Zahl in der Skontotabelle |
| `marge-25-prozent.md` (3×) | „25 % Zuschlag" in drei Vergleichszeilen ohne Rücknahmevermerk |
| `fracht-nur-bei-zustellung.md` | siehe unten |

Alle zwölf sind berichtigt — die Bedingung steht jetzt **in der Zeile**, nicht
daneben. Das ist mehr Wiederholung im Text, und sie ist der Preis dafür, dass
eine Zeile für sich lesbar ist.

## Einer war etwas anderes

```
| Gewichtsdaten | vorhanden auf allen Belegen, Auslesung fehlerhaft |
```

Der Widerrufsprüfer las „auf allen Belegen" und meinte die zurückgenommene
Frachtaussage („Die Frachtpauschale steht auf jedem der fünfzehn Belege").
Hier geht es um **Gewichte**, nicht um Fracht. Ein Fehltreffer des Musters,
den die alte Sichtweite verdeckt hatte — der Nachbar deckte ihn zu, und
niemand hat je hingesehen.

Das Muster zu entschärfen wäre der falsche Ausweg; es ist am 1. September
absichtlich weit gefasst worden, weil derselbe Satz mit anderen Worten sechs
Tage lang im Warenkorb stand. Stattdessen sagt die Zeile jetzt, was sie meint:
„auf allen Belegen (Gewichte, nicht Fracht — die steht auf drei von
fünfzehn)".

> **Eine zu weite Sichtweite versteckt nicht nur überholte Zahlen, sondern
> auch die Fehltreffer des eigenen Musters.**

## Der Nachweis

Drei Proben und eine Gegenprobe. Die Gegenprobe hängt an ein Dokument zwei
Tabellenzeilen an: In der ersten steht die Bedingung, in der zweiten die
abgelöste Zahl. Vor dem 2. September wäre die zweite gedeckt gewesen.

## Stand

| | |
|---|---|
| Prüfer, die an der Sichtweite hängen | 2 |
| Meldungen beim ersten, zu strengen Anlauf | 21 (davon 9 zu Unrecht) |
| Meldungen nach der Trennung | 12, alle berichtigt |
| Fundstellen mit Deckung | Leitzahlen 148/148, Widerrufe 71/71 |
| Gegenproben, die anschlagen | 18 von 18 |
| Tests | 1237 |

Was bleibt: Die ±8 Zeilen im Fließtext sind weiterhin ein Maß und keine
Regel. Ein Absatz kann länger sein, und zwei kurze Absätze können näher
beieinanderliegen, als sie zusammengehören. Das ist heute kein Befund,
sondern eine bekannte Grobheit — und sie steht hier, damit ein grüner Lauf
nicht für mehr genommen wird, als er ist.
