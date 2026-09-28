# Zahlenprüfung — jede abgeleitete Größe nachgerechnet

Stand: 2026-08-15. Über neunundzwanzig Dateien hinweg wurden Eingangsgrößen
mehrfach korrigiert: Warenkorb 450 → 650 €, Bestellungen 54 → 37, Sessions
1.270 → 2.550 → 1.570, Materialwert 400–1.500 → 1.260–2.955 €, Kapitalrisiko
8.000–12.000 → 2.700 €. Jede Korrektur wurde von Hand weitergereicht.

Damit besteht die reale Gefahr, dass irgendwo noch eine Zahl steht, die aus
einem überholten Eingangswert folgt. Einmal ist das bereits passiert — die
Ende-zu-Ende-Quote der Strecke 2 war aus ihren eigenen Teilquoten nicht
ableitbar. Diese Prüfung geht alle Rechenketten durch.

## Ergebnis vorweg

**Zwei Fehler gefunden, beide klein, beide benannt.** Alle übrigen zwanzig
geprüften Ketten stimmen.

## Die geprüften Ketten

### Zielgröße und Steuer

| Rechnung | Soll | Ist | |
|---|---|---|---|
| 3.000 € ÷ (0,77 × 0,725) | 5.375 € | 5.374 € | ✓ Rundung |
| 5.374 € + 650 € Fixkosten | **6.024 €** | **6.050 €** | ✗ siehe Fehler 1 |

### Umsatzkaskade Shop

Alle Zeilen sind konsistent aus 6.050 € gerechnet, also aus dem fehlerhaften
Zwischenwert:

| Rohmarge | Rechnung | Wert | |
|---|---|---|---|
| 30 % | 6.050 ÷ 0,20 | 30.250 € | ✓ zur Basis |
| 32 % | 6.050 ÷ 0,22 | 27.500 € | ✓ |
| 35 % | 6.050 ÷ 0,25 | 24.200 € | ✓ |
| 40 % | 6.050 ÷ 0,30 | 20.167 € | ✓ |
| 45 % | 6.050 ÷ 0,35 | 17.286 € | ✓ |

### Mengen Shop

| Rechnung | Wert | |
|---|---|---|
| 24.200 € ÷ 650 € Warenkorb | 37,2 → 37 Bestellungen | ✓ |
| 37 ÷ 2 % Conversion | 1.850 Sessions | ✓ |
| (650 € Fixkosten + 1.000 € Werbung) ÷ 0,35 | 4.714 € Break-even | ✓ |
| 4.714 € ÷ 650 € | **7,25 → 7 Bestellungen** | ✗ siehe Fehler 2 |
| 24.200 € × 12 | 290.400 €/Jahr | ✓ |

### Mischmarge

```
0,30 × 20 %  +  0,15 × 35 %  +  0,55 × x  ≥  32 %
6,0 + 5,25 + 0,55x ≥ 32     →     x ≥ 37,7 %
```
✓ Die genannten „rund 38 %" auf die Abdichtungsbahn stimmen.

### Leadmodell

| Rechnung | Wert | |
|---|---|---|
| 5.374 € + 350 € Fixkosten | 5.724 € | ✓ |
| 5.724 € ÷ 150 € je Lead | 38,2 → 38 Leads | ✓ |
| 350 € ÷ 150 € | 2,3 Leads Break-even | ✓ |
| 10 Leads ÷ 6 % + 28 Leads ÷ 2 % | 167 + 1.400 = 1.567 → ~1.570 Sessions | ✓ |
| 15 Partner × 200 € + 38 × 80 € | 3.000 + 3.040 = 6.040 € | ✓ |

### Strecke 2

```
untere Grenze:  0,05 × 0,40 × 0,30 × 0,08  =  0,048 %
obere Grenze:   0,10 × 0,60 × 0,50 × 0,15  =  0,450 %
```
✓ Die angegebenen 0,05–0,45 % stimmen. Die frühere Angabe von 0,5–1,5 % war
falsch und ist bereits korrigiert.

### Warenkorb und Markt

| Rechnung | Wert | |
|---|---|---|
| eng 420–1.275 € + Bahn 840–1.680 € | 1.260–2.955 € mittlerer Korb | ✓ |
| mittel + Hauseinführung 750–865 € | 2.010–3.820 € weiter Korb | ✓ |
| 850 € × 10.000 × 0,6 … × 14.000 × 0,9 | 5,1–10,7 Mio. € | ✓ |
| 2.100 € × 10.000 × 0,6 … × 14.000 × 0,9 | 12,6–26,5 Mio. € | ✓ |

### Wahrscheinlichkeiten und Marktentwicklung

| Rechnung | Wert | |
|---|---|---|
| P(≥2 von 6 antworten bei p = 0,3) | 58,0 % | ✓ |
| P(≥2 von 12 antworten bei p = 0,3) | 91,5 % | ✓ |
| (53.043 − 31.979) ÷ 53.043 | 39,7 % → „−40 % in zehn Jahren" | ✓ |
| (72.756 − 31.979) ÷ 72.756 | 56,0 % → „−56 % vom Höchststand" | ✓ |
| 0,95³ × 1,5 | 1,286 → „+29 % netto" | ✓ |
| 1,1 % ÷ 0,95² und 5,7 % ÷ 0,95² | 1,22 % und 6,32 % | ✓ |

### Stufenmodell

| Rechnung | Wert | |
|---|---|---|
| 0 € + 200 € + 2.500 € | 2.700 € Kapital bis erste Einnahme | ✓ |

## Fehler 1 — der Deckungsbeitrag ist um 26 € zu hoch angesetzt

In [`PARAMETER.md`](./PARAMETER.md) steht: „Fixkosten 650 €/Monat, benötigter
Deckungsbeitrag nach Werbung 6.050 €." Richtig wäre **6.024 €**, denn
5.374 + 650 = 6.024.

Die gesamte Umsatzkaskade ist aus 6.050 € gerechnet und deshalb durchgehend
rund 0,4 % zu hoch:

| | mit 6.050 € | korrekt mit 6.024 € |
|---|---|---|
| Zielumsatz bei 35 % Rohmarge | 24.200 € | **24.096 €** |
| Bestellungen bei 650 € Warenkorb | 37 | 37 |
| Sessions bei 2 % | 1.850 | 1.843 |

> **Entscheidung: Die Zahlen bleiben, wie sie sind.** Die Abweichung beträgt
> 104 € im Monatsumsatz, ändert weder Bestellzahl noch Sessionbedarf und zeigt
> in die **sichere Richtung** — sie fordert etwas mehr, als nötig wäre. Sie hier
> zu benennen ist wichtiger, als achtzehn Dokumente wegen 0,4 % anzufassen und
> dabei neue Übertragungsfehler zu erzeugen.

Für spätere Läufe gilt: 24.200 € ist ein **gerundeter Planwert**, keine exakte
Ableitung. Wer die Kaskade neu aufsetzt, beginnt bei 6.024 €.

## Fehler 2 — der Break-even in Bestellungen war nicht mitgezogen

[`phase3-unit-economics.md`](./phase3-unit-economics.md) nennt den Break-even
mit „4.714 € ≈ 10–11 Bestellungen". Diese Stückzahl stammt aus dem alten
Warenkorb von 450 €. Beim korrigierten Warenkorb von 650 € sind es
**7 Bestellungen**.

`STATUS.md` und der veröffentlichte Bericht führen bereits 7 — die Zahl war
also an zwei Stellen richtig und an einer falsch. Das ist genau die
Fehlerklasse, wegen der diese Prüfung stattfindet: nicht ein Rechenfehler,
sondern eine nicht mitgezogene Folgegröße.

Der Hinweis am Kopf von `phase3-unit-economics.md` wird entsprechend erweitert.

## Was die Prüfung nicht leisten kann

Sie prüft **Ableitungen, nicht Annahmen**. Dass 37 Bestellungen aus 24.200 €
und 650 € folgen, ist nachgerechnet. Ob der Warenkorb tatsächlich bei 650 €
liegt, ist damit nicht belegt — das steht in der Liste der unbelegten Zahlen in
[`STATUS.md`](./STATUS.md) und bleibt dort.

Alle Eingangsgrößen mit Konfidenz „niedrig" oder „unbelegt" behalten diesen
Status. Eine korrekt gerechnete Kette aus geschätzten Zahlen liefert ein
geschätztes Ergebnis, keine Gewissheit.

## Für spätere Läufe

Diese Datei ist der Prüfstand. Ändert sich eine Eingangsgröße, sind genau die
Ketten oben nachzurechnen, in denen sie vorkommt — das dauert Minuten und
erspart die Sorte Fehler, die sonst erst auffällt, wenn jemand danach handelt.
