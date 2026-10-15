# Die Zahl aus der Zeichenkette

**4. September 2026.** Der Gebindeschritt ist der Wert mit dem größten Hebel
und der dünnsten Grundlage im ganzen Bestand. Er wird **aus dem Artikelnamen
gelesen**: „Capatect Putzgrund weiß 25 kg" ergibt 25.

An ihm hängen fünf Rechnungen:

| | |
|---|---|
| kleinste bestellbare Menge | ein Gebinde, nicht ein Kilogramm |
| Preis je Gebinde auf der Artikelseite | 0,56 € × 25 = 14,00 € |
| Aufrunden im Warenkorb | 5 m² werden zu 5,25 m² (7 Platten zu 0,75) |
| Frachtschwelle | „ab 150 kg übersteigt die Ware die Zustellung" |
| Mindestbestellwert je Artikel (seit 3.9.) | „angenommen wird eine Anfrage ab 450 kg — 18 Gebinde" |

Geprüft hat diesen Wert bisher nur, wovon er stammt: die Zeichenkette selbst,
über Testfälle mit erfundenen Namen.

> **Eine Zahl, die aus einer Zeichenkette gelesen wird und fünf Rechnungen
> trägt, gehört gegen etwas gehalten, das nicht dieselbe Zeichenkette ist.**

## Die zweite Quelle lag die ganze Zeit daneben

`preise/poschacher-positionen.csv` — dieselbe Datei, aus der der Katalog
entstanden ist — führt **70 tatsächlich fakturierte Positionen** mit Menge und
Einheit. Wird ein Artikel nur in ganzen Gebinden abgegeben, sind alle Mengen
Vielfache des Schritts. Das ist eine Prüfung, die nichts mit dem Namen zu tun
hat.

Der erste Lauf:

```
Gebindeprüfung: 18 Artikel mit Gebindeschritt gegen 70 Positionen

  Artikel mit Rechnungsposition   46
  davon mit Schritt aus dem Namen 18
  ohne Schritt im Namen           28
  Gutschriften (negative Mengen)   5
  Positionen ohne Artikel im Katalog 13

Jede fakturierte Menge ist ein Vielfaches des gelesenen Schritts.
```

**Kein Befund — und das ist das Ergebnis.** Achtzehn Artikel, deren Schritt aus
einem Produktnamen stammt, halten gegen die Wirklichkeit. Das ist mehr wert als
ein weiterer Testfall mit einem erfundenen Namen.

## Die Richtung, die nicht entscheidbar ist

Umgekehrt aus den Mengen einen Schritt zu **erraten**, geht nicht. Ich habe es
gemessen, bevor ich es aufgegeben habe: Für die 28 Artikel ohne Schritt im
Namen ergibt der größte gemeinsame Teiler ihrer Mengen scheinbar überall
etwas — 3 beim Kanalrohr, 2 beim Bogen, 10 bei der Rahmenschraube.

Nur stehen die meisten mit **einer einzigen** Position da.

> **Ein größter gemeinsamer Teiler über eine einzige Beobachtung ist die Menge,
> die jemand einmal gekauft hat.**

Daraus einen Gebindeschritt zu machen hieße, aus einer Bestellung eine Regel zu
machen — dieselbe Sorte Schluss, die bei den Paletten schon einmal abgelehnt
wurde („aus einem Punkt lässt sich keine Regel ziehen"). Die Verpackungseinheit
steht in der Artikelliste des Lieferanten, und die ist ein offener Punkt.

## Was die Prüfung ausdrücklich zählt statt zu überspringen

**Gutschriften.** Fünf der Positionen tragen negative Mengen. Sie zählen mit —
eine Rückgabe geht in denselben Gebinden zurück, in denen geliefert wurde —,
und sie werden eigens ausgewiesen. Eine Prüfung, die eine Belegart still
überspringt, meldet Grün über weniger, als sie behauptet.

**Positionen ohne Artikel im Katalog.** Dreizehn. Sie stehen in der Ausgabe,
statt stillschweigend zu verschwinden: Der Katalog führt nicht alles, was je
gekauft wurde (Gate 24 hält Artikel ohne bestätigten Einkaufspreis heraus), und
diese Zahl ist der Abstand zwischen Einkauf und Sortiment.

**Eine unlesbare Menge** ist ein Fehler und kein Übersprung — die Funktion
wirft. Eine Zeile, die niemand liest, ist keine Prüfung.

## Die Gegenprobe

Sie ersetzt den gelesenen Schritt bei Kilogrammware durch **20**. Bei
fakturierten Mengen von 25, 50 und 75 kg gibt das drei Abweichungen, und der
Prüfer wird rot. Ohne die Rechnungsmengen prüft diesen Wert nichts außer der
Zeichenkette, aus der er stammt.

## Was das für die Zukunft heißt

`npm run pruefe-gebinde` läuft ab sofort im Gesamtlauf mit (Schritt 21 von 23).
Ohne `preise/` endet er mit Code 2 und sagt, dass er nichts messen konnte —
nicht grün. Ein grüner Lauf über nichts wäre eine Lüge, und das ist die
Fehlerklasse, an der dieses Vorhaben die meiste Zeit verloren hat.

## Verweise

- `shop/src/gebindebeleg.js` — die Regeln
- `shop/bin/gebindepruefung.mjs` — `npm run pruefe-gebinde`
- `shop/test/gebindebeleg.test.js` — sieben Proben
- [`gate25-mindestbestellwert.md`](./gate25-mindestbestellwert.md) — die fünfte Rechnung, die am Schritt hängt
