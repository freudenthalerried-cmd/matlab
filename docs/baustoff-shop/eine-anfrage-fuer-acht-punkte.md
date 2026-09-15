# Vier Fragen für acht Punkte — und die zwei Zeilen, die sie sperren

**2. September 2026.** `npm run offenepunkte` führt siebzehn Punkte in vier
Gruppen. Acht davon stehen unter **„Anfrage an Dritte"**:

| Punkt | Was er blockiert |
|---|---|
| `lieferzeit` | ohne sie darf keine Auftragsbestätigung hinaus |
| `feed:GTIN/EAN` | 43 von 43 Feedeinträgen — der Feed wird abgelehnt, nicht teilweise angenommen |
| `feed:Marke` | 20 von 43 |
| `feed:Produktbild` | 43 von 43 |
| `preisalter` | 7 Einkaufspreise über 90 Tage, ältester 133 |
| `preisrhythmus` | die 90-Tage-Grenze ist gesetzt, nicht gemessen |
| `liefergebiet-lieferant` | Gate 23 gilt auf der vorsichtigen Fläche der Kampagne |
| `artikelliste` | der Katalog hat 46 Artikel, die Weisung verlangt mindestens 100 |

Alle acht hängen an **einem** Gespräch mit **einem** Lieferanten. Und für
dieses Gespräch gab es keinen Text.

## Was es stattdessen gab

`docs/baustoff-shop/anschreiben-entwuerfe.md`, Stand 9. August: dreizehn
Radon-Hersteller, drei Entwürfe, ein Empfängerkreis in drei Prioritäten. Ein
sorgfältiges Dokument für ein Geschäftsmodell, das der Kurswechsel vom
22. August abgelöst hat. Es stand vierundzwanzig Tage ohne Kopfnotiz da.

Schlimmer als das Dokument war der Wegweiser darauf. In
`shop/data/lieferanten.json` stand bis heute:

> „Echte Werte entstehen erst aus den Antworten auf **Anschreiben A**, siehe
> `docs/baustoff-shop/anschreiben-entwuerfe.md`."

> **Ein Entwurf für ein abgelöstes Modell ist kein Entwurf, sondern ein
> Wegweiser in die falsche Richtung.**

Dieselbe Fehlerklasse, vor der `STATUS.md` in seinem eigenen Kopf warnt — die
überholte Modelltabelle, die eine Woche unmarkiert dastand, und die
32-%-Untergrenze in `PARAMETER.md`. Beide hat dieses Vorhaben schon einmal
bezahlt. Beide Stellen tragen jetzt eine Notiz.

## Der Brief: vier Fragen, nicht zwölf

`src/lieferantenanfrage.js` führt die Fragen als Register. Jede nennt, welche
Punkte sie schließt:

| Frage | schließt |
|---|---|
| Artikelliste aus dem Kundenkonto | `artikelliste`, `feed:GTIN/EAN`, `feed:Marke`, `feed:Produktbild`, `preisalter` |
| Lieferzeit in Werktagen | `lieferzeit` |
| Rhythmus der Preisänderungen | `preisrhythmus` |
| Liefergebiet und Frachtsätze | `liefergebiet-lieferant` |

Die erste Frage trägt fünf Punkte. Sie ist eine einzige Bitte — die
Artikelliste des eigenen Kundenkontos als Datei, mit Artikelnummer,
Bezeichnung, EAN, Hersteller, Verpackungseinheit und aktuellem Nettopreis.
Etwas, das ein Baustoffhändler auf Knopfdruck exportiert.

**Warum vier und nicht zwölf.** Wer einem Lieferanten zwölf Fragen schickt,
bekommt keine Antwort; jede zusätzliche Frage senkt die Wahrscheinlichkeit
aller übrigen. Deshalb prüft `npm run pruefe-anfrage` **beide** Richtungen:

- `punkteOhneFrage` — ein offener Punkt, den keine Frage schließt. Das ist die
  Richtung, die zählt: Er bleibt nach dem Gespräch offen, und **niemand merkt
  es, weil das Gespräch stattgefunden hat.**
- `fragenOhnePunkt` — eine Frage, die nichts mehr löst. Sie kostet die Antwort
  auf eine, die etwas löst.

Die offenen Punkte holt der Prüfer aus `bin/offenepunkte.mjs` selbst, nicht aus
einer zweiten Zusammenstellung. Ein erster Anlauf an anderer Stelle hat genau
das getan und meldete 2 statt 15.

## Der Befund: der billigste Punkt sperrt den teuersten

Der Brief braucht eine Rückantwortadresse. `betreiber.email` und
`betreiber.telefon` sind leer. Der Generator sagt das von selbst:

```
NICHT VERSANDFÄHIG:
  · Rückantwortadresse fehlt — betreiber.email ist leer
  · Telefonnummer fehlt — betreiber.telefon ist leer
```

Beide stehen in derselben Aufstellung, nur eine Gruppe weiter oben: **„Liegt
vor, fehlt nur in der Datei"**, Kosten *nichts*. Der Auftraggeber kennt seine
eigene E-Mail-Adresse; es sind zwei Zeilen in einer Datei.

> **Der billigste offene Punkt sperrt das Gespräch, das acht andere schließt.**

Das stand nirgends. Die Punkte lagen in zwei verschiedenen Gruppen, und
zwischen den Gruppen führte keine Linie. Die Aufstellung sortiert nach
Zuständigkeit und Kosten — was sie nicht kann, ist zeigen, dass ein billiger
Punkt einen teuren blockiert. Jetzt sagt es der Prüfer in seiner eigenen
Ausgabe.

Damit ändert sich die Rangfolge der offenen Punkte, ohne dass ein einziger
dazugekommen wäre: Die zwei Impressumsfelder sind nicht mehr eine
Formalie am Ende, sondern der erste Schritt.

## Was dieses Werkzeug nicht tut

Es versendet nichts. Der Text wird erzeugt und gedruckt; das Versenden an
Dritte bleibt Sache des Auftraggebers, wie jede Ausgabe und jeder Kauf. Der
Brief ist ein Ausgang wie jeder andere und steht als solcher im
Außentextverzeichnis — mit einer Fremdtextprobe, die prüft, dass ein
Zeilenumbruch in den Betreiberdaten keine **fünfte, erfundene Frage** in einen
nummerierten Brief schreibt.

## Stand

| | |
|---|---|
| Fragen im Brief | 4 |
| offene Punkte der Gruppe „Anfrage" | 8 |
| davon ohne Frage | 0 |
| Fragen ohne Punkt | 0 |
| versandfähig | **nein** — zwei leere Felder in `betreiber.json` |
| Prüfer ohne Browser | 17 |
| Gegenproben, die anschlagen | 16 von 16 |
| Tests | 1230 |

Der nächste Schritt gehört nicht mir: zwei Zeilen eintragen, dann geht der
Brief. Bis dahin steht er fertig da und sagt selbst, warum er wartet.
