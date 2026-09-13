# Der Prüfer las den falschen Katalog — und sagte es nicht

**1. September 2026, dritte Runde.** `npm run pruefe-belege` ist heute Vormittag
entstanden, weil kein Prüfer je einen fertigen Beleg gelesen hatte. Am Abend
habe ich ihn selbst gelesen. Er meldete:

```
Belege geprüft: 5 (Angebot, Auftragsbestätigung, Rechnung, Kundenanfrage, …)

  ✓ Angebot
  ✓ Auftragsbestätigung
  …
```

Fünf Häkchen, keine Meldung — und **kein Wort darüber, woraus die Belege
gebaut waren.** Sie kamen aus `data/artikel.json`: dem Radonkatalog mit neun
Platzhalterartikeln des abgelösten Modells. Der laufende Handel hat
sechsundvierzig Artikel mit bestätigten Baumeisterpreisen, und die Preisdatei
lag die ganze Zeit an ihrem Platz.

> **Ein Prüfer, der nicht sagt, was er gelesen hat, wird für etwas gehalten,
> was er nicht ist.** Genau die Familie, die dieser Prüfer finden soll — nur
> diesmal er selbst, am Tag seiner Entstehung.

`veroeffentlichung.mjs` macht es seit dem 31. August richtig: Baustoffkatalog,
sobald die Preisdatei zur Hand ist, sonst Rückfall **mit Meldung**. Der
Belegprüfer hat den Rückfall genommen, ohne dass es einen gab.

## Zwei Warenkörbe, beide unbrauchbar

Mit dem echten Katalog war der nächste Fehler sofort da. Der Prüfer nahm die
ersten beiden Artikel der Liste — zwei Zuschnitte Fassadendämmung zu 1,93 € und
2,81 €:

```
Warenwert netto           43,37 €
Fracht netto              90,50 €
```

Die Fracht ist mehr als das Doppelte der Ware. Das ist genau der Gate-22-Fall
(Kleinteile gehören als Beipack, nicht als Suchartikel) und ein
Gate-20-Verstoß: Diese Bestellung geht nie hinaus.

Nach Preis absteigend sortiert kippte es ins Gegenteil — 5.362 € Ware, das
Achtfache des Bezugswarenkorbs.

> **Ein Prüfer, der ein Dokument liest, das der Betrieb nie erzeugt, prüft eine
> Möglichkeit statt eines Falls.**

Der Warenkorb wird jetzt auf `warenkorbNetto` aus `data/zielgroessen.json`
gebaut — die 650 €, mit denen die ganze Wirtschaftlichkeitsrechnung arbeitet.
Zwei Positionen zu je einer Hälfte, Mengen ganzzahlig: **677,89 € netto.**

Dazu die Betreiberdaten aus `data/betreiber.json` statt erfundener. Der Prüfer
liest damit die Belege, die **heute** entstünden — samt ihrer Lücken:

```
Freudenthaler Bau GmbH
UID: [[ UID des Ausstellers — FEHLT ]]
```

## Was der Prüfer jetzt zusätzlich sagt

Ein sauber geprüfter Text über einen gesperrten Auftrag ist kein Freibrief.
Deshalb steht `darfAutomatischAusgeloestWerden` daneben — als Auskunft, nicht
als Meldung:

```
Auslösbar wäre sie nicht — offene Punkte, keine Textfehler:
    · Lieferzeit unbekannt (Poschacher Baustoffhandel) — der Termin wäre unbestellt zugesagt
```

**Ein einziger Punkt.** Die ganze Bestellstrecke hängt an einer Zahl, die eine
Frage an den Lieferanten beantworten würde — dieselbe, die im Auftragsabgleich
seit Tagen offen steht.

## Der Mailknopf, endlich gemessen

`MAILTO_HOECHSTLAENGE = 1800` gibt es seit Beginn, mit einer guten Begründung:
Mailprogramme kürzen lange `mailto:`-Adressen stillschweigend, eine halbe
Positionsliste in der Mail wäre schlimmer als kein Knopf. Was fehlte, ist die
Zahl daneben — **ab welcher Position verschwindet er?**

Gemessen am echten Katalog:

| Positionen | Warenwert | mailto-Länge | Knopf |
| ---: | ---: | ---: | :--- |
| 1 | 10 € | 1.381 | ja |
| 2 | 24 € | 1.609 | ja |
| **3** | **47 €** | **1.814** | **nein** |
| 8 | 320 € | 2.809 | nein |
| 11 | 731 € | 3.379 | nein |

Der Bezugswarenkorb liegt bei 650 € netto — bei diesen Preisen rund **elf
Positionen**. Die Analyse hält ohnehin fest, dass die großen Belege aus acht bis
zwölf Positionen bestehen.

> **Der Mailknopf trägt keine Bestellung, für die dieser Handel gebaut ist.**

Das ist kein Fehler, sondern eine Tatsache, die niemand gemessen hatte. Die
Oberfläche verhält sich richtig: Der Kopiertext ist der Weg, der Knopf die
Abkürzung, und wo er fehlt, steht der Grund dabei. Er bleibt — für die
Nachbestellung von ein, zwei vergessenen Positionen, ein echter Fall, nur nicht
der Regelfall.

Vier Proben halten die Schwelle jetzt fest, und die vierte ist die wichtigste:
`MAILTO_HOECHSTLAENGE` darf **nicht über 2000** steigen. Wer die Grenze anhebt,
um „den Knopf endlich sichtbar zu machen", verschiebt sie nicht, sondern
schaltet die stillschweigende Kürzung frei — der Kunde verschickt dann eine
halbe Liste und merkt nichts.

Nebenbei gestolpert: Der erste Anlauf der Probe schlug fehl, weil die
Prüfvorlage `email: ''` trägt. Der Knopf fehlt heute doppelt — zu lange Liste
*und* keine hinterlegte Adresse. Die E-Mail ist einer der vier offenen
Impressumspunkte.

## Was daraus für den nächsten Lauf folgt

Drei Werkzeuge sind heute entstanden oder gewachsen, und alle drei hatten beim
ersten Lesen einen Fehler derselben Art: Der Belegprüfer las den falschen
Katalog, die Regel „leere Angabe" meldete die Absatzgestaltung, und der
Warenkorb war zweimal unrepräsentativ.

> **Ein Werkzeug, das am Tag seiner Entstehung grün meldet, hat sich meistens
> selbst geprüft.** Der erste Lauf ist kein Beleg, sondern eine Behauptung —
> gelesen werden muss, was es ausgibt, nicht ob es ausgibt.

Offen als letzter ungelesener Außentext: was ein Zahlungsanbieter eines Tages
an den Kunden schickt. Noch niemandes Text.
