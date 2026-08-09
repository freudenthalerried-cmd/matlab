# Phase 3 — Unit Economics

Stand: 2026-08-09. Basis: [`PARAMETER.md`](./PARAMETER.md), Nische
Radonvorsorge im Neubau aus [`phase1-nischen.md`](./phase1-nischen.md).

> **Es gibt keinen realisierten Gewinn.** Der Shop existiert nicht, es wurde
> nichts verkauft und nichts eingenommen. Alle Zahlen dieses Dokuments sind
> Modellrechnung. Der Konfidenzgrad jeder Eingangsgröße ist unten ausgewiesen.

## Zielgröße

```
3.000 € netto beim Gesellschafter
  ÷ 0,558   (nach 23 % KöSt und 27,5 % KESt)
= 5.374 € Gewinn vor Steuer pro Monat
+   650 € Fixkosten
= 6.024 € benötigter Deckungsbeitrag nach Werbung  → gerechnet mit 6.050 €
```

## Szenarien

| | Pessimistisch | Realistisch | Optimistisch |
|---|---|---|---|
| Rohmarge | 30 % | 35 % | 40 % |
| Werbekostenanteil | 14 % | 10 % | 7 % |
| Deckungsbeitragsrate | 16 % | 25 % | 33 % |
| **Nötiger Umsatz/Monat** | **37.800 €** | **24.200 €** | **18.330 €** |
| Ø Warenkorb | 350 € | 450 € | 600 € |
| **Bestellungen/Monat** | **108** | **54** | **31** |
| Sessions bei CR 2 % | 5.400 | 2.700 | 1.530 |

Das pessimistische Szenario ist im Streckengeschäft ohne Lager und ohne
Bestandskundenstamm nicht erreichbar — 108 Bestellungen im Monat in einer
Spezialnische mit rund 12.000 relevanten Neubauten pro Jahr würde einen
Marktanteil bedeuten, den ein Neueinsteiger nicht holt. Es dient als
Abbruchmarke, nicht als Planungsfall.

**Planungsfall ist das realistische Szenario: 24.200 € Umsatz, 54 Bestellungen
im Monat.**

## Marktgröße — mit amtlicher Statistik unterlegt

Statistik Austria, Baubewilligungen 2025:

- 47.636 Wohnungen insgesamt bewilligt, −3,7 % gegenüber 2024
- davon **31.979 im Neubau**, −7,1 % — **niedrigster Stand seit Erhebungsbeginn
  2010**
- 46 % in Gebäuden mit drei oder mehr Wohnungen, 21 % in Ein- und
  Zweiwohnungsgebäuden

Die kaufende Einheit ist das **Gebäude**, nicht die Wohnung. Aus 31.979
Wohnungen im Neubau werden überschlägig 10.000–14.000 Gebäude mit erdberührten
Aufenthaltsräumen. Bei 400–1.500 € Materialwert je Gebäude ergibt das ein
adressierbares Volumen von **4–21 Mio. € pro Jahr**.

Die frühere Schätzung von 10–25 Mio. € war zu optimistisch, weil sie
Wohnungen statt Gebäude zählte. Korrigiert.

Das Umsatzziel von 290.000 €/Jahr entspricht damit **1,4–7 % Marktanteil** — je
nachdem, wo im Korridor der tatsächliche Materialwert liegt. Am unteren Rand
des Korridors ist das Ziel sportlich, am oberen komfortabel. Der Materialwert je
Gebäude ist damit die wichtigste noch unbelegte Größe des ganzen Modells.

### Gegenwind, der ausgesprochen gehört

Der Neubaumarkt schrumpft und liegt auf dem tiefsten Stand seit Beginn der
Erhebung. Ein Geschäftsmodell auf einen fallenden Markt zu setzen, ist ein
echtes Risiko und kein Detail.

Zwei Gegenargumente, die es abschwächen, aber nicht aufheben:

1. Die **Durchdringung steigt**, während das Volumen fällt. Die Radonpflicht ist
   jung, viele ausführende Betriebe setzen sie erst seit Kurzem um. Ein
   wachsender Anteil eines schrumpfenden Marktes kann in Summe wachsen.
2. Der **Bestand** ist unberührt. Sanierung und Nachrüstung stehen nicht in
   dieser Rechnung und wären ein zweites Standbein.

Trotzdem: Wenn der Neubau weitere Jahre um 7 % fällt, verschiebt das die
Zielerreichung nach hinten. Das gehört in jede Fortschreibung.

## Break-even und Kapitalbedarf

Break-even liegt weit unter dem Zielumsatz. Bei 35 % Rohmarge, 650 € Fixkosten
und zunächst 1.000 € Werbebudget im Monat:

```
Break-even-Umsatz = (650 + 1.000) / 0,35 = 4.714 € pro Monat
                  ≈ 10–11 Bestellungen pro Monat
```

Das ist früh erreichbar — realistisch im vierten bis achten Monat. Kumulierter
Anlaufverlust bis dahin überschlägig **8.000–12.000 €**, was sich mit dem
Startbudget von 10.000 € deckt, aber keinen Puffer lässt. Am unteren Rand des
Budgets (5.000 €) wird es eng.

## Der ehrliche Zeithorizont

Break-even ist nicht das Ziel. Der Weg von 4.714 € auf 24.200 € Monatsumsatz
ist der eigentliche Aufwand.

Im Streckengeschäft mit SEO-getriebenem Wachstum und moderatem Werbebudget ist
die Zielgröße realistisch in **18–30 Monaten** erreichbar, nicht in zwölf. Die
Wunschvorgabe „so schnell wie möglich" ändert daran wenig, weil in dieser
Nische der begrenzende Faktor nicht das Werbebudget ist, sondern die Zahl der
Bauvorhaben und die Geschwindigkeit, mit der ausführende Betriebe einen neuen
Lieferanten aufnehmen. Beides lässt sich nicht kaufen.

Wer schneller will, müsste die Nische verbreitern — Radonvorsorge als Einstieg,
danach angrenzende Bauwerksabdichtung — oder den Bestandsmarkt mitnehmen.

## Konfidenz der Eingangsgrößen

| Größe | Wert | Konfidenz | Grundlage |
|---|---|---|---|
| Neubauzahlen | 31.979 Wohnungen 2025 | **hoch** | Statistik Austria |
| Gebäude statt Wohnungen | 10.000–14.000 | mittel | eigene Ableitung |
| Materialwert je Gebäude | 400–1.500 € | **niedrig** | Schätzung, unbelegt |
| Rohmarge | 35 % | **niedrig** | Branchenannahme, keine Konditionen erhoben |
| Warenkorb | 450 € | niedrig | B2B-Annahme |
| Conversion-Rate | 2 % | mittel | B2B-Erfahrungswert |
| Fixkosten | 650 €/Monat | mittel | kalkuliert |
| Steuerlast | 23 % + 27,5 % | hoch | geltendes Recht |

**Die zwei schwächsten Stellen sind Rohmarge und Materialwert je Gebäude.**
Beide lassen sich nur durch direkte Herstelleranfragen belegen — und die sind
freigabepflichtig, weil dafür E-Mails an Dritte hinausgehen. Solange sie
unbelegt sind, steht das gesamte Modell auf einer Annahme, nicht auf Daten.

## Gate-3-Entscheidung

Das realistische Szenario erreicht das Ziel — aber in 18–30 Monaten, nicht in
zwölf, und auf einer Margenannahme, die noch niemand bestätigt hat.

**Entscheidung: fortsetzen**, mit zwei Auflagen.

1. Vor jeder Ausgabe für Gründung oder Shop müssen die Händlerkonditionen von
   mindestens zwei Herstellern schriftlich vorliegen. Liegt die Marge unter
   32 %, fällt die Nische und Phase 1 wird neu aufgerollt.
2. Der Zeithorizont wird auf 18–30 Monate korrigiert. Die Zwölf-Monats-Vorgabe
   ist mit dieser Nische nicht haltbar; das ist eine Feststellung, keine
   Verhandlung.

## Quellen

- [Baubewilligungen 2025, Statistik Austria](https://www.statistik.at/fileadmin/announcement/2026/04/20260424Baubewilligungen2025.pdf)
- [Baubewilligungen, Statistik Austria Übersicht](https://www.statistik.at/statistiken/bevoelkerung-und-soziales/wohnen/baubewilligungen)
- [Bewilligungen für Neubauwohnungen 2025 auf historischem Tiefstand, ImmoFokus](https://immofokus.at/a/bewilligungen-fuer-neubauwohnungen-2025-auf-historischem-tiefstand)
