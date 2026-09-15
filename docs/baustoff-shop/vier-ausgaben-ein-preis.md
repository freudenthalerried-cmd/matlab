# Vier Ausgaben, ein Preis — und der Prüfer fand sofort etwas

Stand: 2026-08-29

## Warum es diesen Prüfer gibt

Heute wurde derselbe Fehler viermal nacheinander gefunden: Der Preis je
Einheit stand da, die kleinste bestellbare Menge nicht. Erst auf der
Artikelseite berichtigt, dann im Produktfeed, dann in `llms.txt`, dann auf der
Artikelkarte. Jedes Mal sah es danach erledigt aus.

> **Ein Fehler, der an einer Stelle behoben ist, sieht behoben aus.**

Die drei Nachzügler waren nicht vergessen worden — es hat niemand nachgesehen,
und der Bau meldete nichts, weil keine Prüfung die Ausgaben **miteinander**
verglich. Zwei handgeschriebene Tests mit drei Artikelnummern haben das
Problem für diese drei Artikel geschlossen und für die anderen 43 nicht.

`npm run pruefe-preise` vergleicht deshalb für **jeden** bepreisten Artikel
vier Ausgaben:

| Ausgabe | Quelle |
| --- | --- |
| Preistafel der Artikelseite | `ausgabe/site/artikel/<sku>.html` |
| JSON-LD derselben Seite | dieselbe Datei |
| Artikelkarte auf der Gruppenseite | `ausgabe/site/gruppe/<gruppe>.html` |
| `llms.txt` | `ausgabe/site/llms.txt` |

Geprüft wird zweierlei: **derselbe Preis überall** und — wo es eine
Gebindebindung gibt — **die Mindestmenge überall**. Was er nicht prüft, steht
im Werkzeug: ob der Preis richtig gerechnet ist. Dafür gibt es die Tests.

## Der erste Lauf fand eine Regression von vor einer Stunde

```
✗ POS-12294: JSON-LD nennt den Artikel nicht
✗ POS-53215: JSON-LD nennt den Artikel nicht
✗ POS-31631: JSON-LD nennt den Artikel nicht
```

Drei Artikelseiten **ohne strukturierte Daten**. Ursache: Im vorigen Lauf habe
ich die Artikelseite auf `produktAuszeichnung()` umgestellt, damit Seite und
Feed nicht auseinanderlaufen. Diese Funktion beantwortet aber zwei Fragen auf
einmal — *wie sieht die Auszeichnung aus?* und *gehört der Artikel in den
Feed?* —, und bei den drei Beipackartikeln am Listendeckel (Gate 22) lautet
die zweite Antwort „nein". Damit verlor die **Seite** ihre Auszeichnung.

Das war falsch: Gate 22 ist eine Entscheidung über den Feed. Eine
Artikelseite ist eine Produktseite, auch wenn ihr Artikel nicht beworben
wird — und für den Kanal, für den dieser Shop gebaut ist, ist eine
Produktseite ohne strukturierte Daten eine leere Seite.

`angebotsAuszeichnung()` baut jetzt die Auszeichnung, `produktAuszeichnung()`
stellt die Freigabefrage davor. Die Seite ruft die erste, der Feed die zweite.
Der Feed hält weiter drei Artikel zurück, die Seiten tragen wieder alle ihr
JSON-LD.

**Der Prüfer hat sich damit im ersten Lauf bezahlt gemacht** — an einem
Fehler, den ich selbst eine Stunde zuvor eingebaut hatte und der durch 826
grüne Testfälle gelaufen war.

## Was jetzt gilt

```
Preisabgleich: 46 Artikel über 4 Ausgaben, 15 davon mit Gebindebindung
  Jede Ausgabe nennt denselben Preis, und wo es ein Gebinde gibt, nennen ihn alle.
46 Artikel geprüft, 0 Abweichungen.
```

Dazu ein Test, der jede gebaute Artikelseite auf ein `Product`-JSON-LD prüft —
nicht drei ausgesuchte, sondern alle, mit der Zusicherung, dass es mindestens
40 sind.

## Gegengeprobt

| Eingriff | Befund des Prüfers |
| --- | --- |
| Mindestmenge aus `llms.txt` entfernt | 15 Abweichungen |
| Kartenpreis um 1 € verfälscht | 46 Abweichungen |
| unverändert | 0 |

Eingetragen ist er als siebter Prüfer im Regellauf des Prüferprüfers, mit
einem Mindestmaß von 30 Artikeln: Zeigt er eines Tages auf einen leeren
Katalog, meldet er „0 Artikel geprüft", und das sähe ohne Mindestmaß wie Grün
aus. Derselbe Schutz sitzt im Werkzeug — ein Abgleich über null Artikel endet
mit Code 2.

## Notiert

Die Fehlerklasse hat einen Namen bekommen: **eine Angabe, die an einer Stelle
vollständig ist und an drei anderen nicht.** Der Prüfstein dagegen ist nicht,
eine Stelle zu reparieren, sondern die Stellen gegeneinander zu halten.

Und der Nebenbefund ist der ältere Bekannte: **eine Funktion, die zwei Fragen
auf einmal beantwortet.** Solange beide Antworten zusammenfielen, fiel es
nicht auf.
