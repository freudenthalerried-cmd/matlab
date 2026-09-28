# Top 10 Rezeptvarianten Beton-/Geopolymer-Superkondensator

Bewertet wurden **2.808 gültige Varianten** (Script `variantenbewertung.py`, alle Ergebnisse in `variantenbewertung_alle.csv`):
3 Bindemittel × 6 Rußanteile (3–15 %) × 4 Dispergierverfahren × 5 Elektrolyte × 3 Elektrodendicken × 3 w/b-Werte
(Porenlösung ohne Zusatz nur beim Geopolymer möglich).

**Gewichtung:** Energie 35 %, Festigkeit 20 %, Korrosionsschutz 15 %, Selbstentladung 10 %, Kosten 10 %, CO₂ 10 %.
**K.-o.-Kriterium:** Ohne durchgehendes Rußnetz (unter ca. 3 Vol-%) fällt die Punktzahl gegen null.

| Rang | Punkte | Bindemittel | Ruß | Dispergierung | Elektrolyt | Dicke | w/b | Ruß Vol-% |
|---|---|---|---|---|---|---|---|---|
| 1 | 67,2 | Geopolymer (Hüttensand) | 10 % | Ultraschall + SDS | KOH 1 mol/l | 10 mm | 0,35 | 7,4 |
| 2 | 66,8 | Geopolymer (Hüttensand) | 8 % | Ultraschall + SDS | KOH 1 mol/l | 10 mm | 0,35 | 6,0 |
| 3 | 66,5 | Geopolymer (Hüttensand) | 12 % | Ultraschall + SDS | KOH 1 mol/l | 10 mm | 0,35 | 8,8 |
| 4 | 65,4 | Geopolymer (Hüttensand) | 10 % | Stabmixer + SDS | KOH 1 mol/l | 10 mm | 0,35 | 7,4 |
| 5 | 65,3 | Geopolymer (Hüttensand) | 8 % | Stabmixer + SDS | KOH 1 mol/l | 10 mm | 0,35 | 6,0 |
| 6 | 64,9 | Geopolymer (Hüttensand) | 10 % | Ultraschall + SDS | KOH 1 mol/l | 6 mm | 0,35 | 7,4 |
| 7 | 64,6 | Geopolymer (Hüttensand) | 12 % | Ultraschall + SDS | KOH 1 mol/l | 10 mm | 0,42 | 8,0 |
| 8 | 64,6 | Geopolymer (Hüttensand) | 10 % | Ultraschall + SDS | KOH 1 mol/l | 10 mm | 0,42 | 6,8 |
| 9 | 64,5 | Geopolymer (Hüttensand) | 12 % | Ultraschall + SDS | KOH 1 mol/l | 6 mm | 0,35 | 8,8 |
| 10 | 64,5 | Geopolymer (Hüttensand) | 8 % | Ultraschall + SDS | eigene Porenlösung | 10 mm | 0,35 | 6,0 |

Vergleich: beste CEM-III-Variante auf Rang 98 (57,7 Punkte), beste CEM-I-Variante (MIT-Referenz) auf Rang 209 (53,5 Punkte), jeweils mit 10 % Ruß, Ultraschall + SDS, KOH, 10 mm, w/b 0,35.

## Was das Ergebnis sagt
- **Geopolymer + KOH** gewinnt klar: gute Festigkeit, Korrosionsschutz, niedriges CO₂ und vermutlich außerhalb des MIT-Patents.
- **8–12 % Ruß** ist der Bereich, in dem das Leitnetz sicher steht, ohne die Festigkeit zu stark zu schwächen.
- **SDS als Benetzer** ist wichtiger als das Gerät: Stabmixer + SDS (Rang 4–5) liegt nur knapp hinter Ultraschall.
- **Dicke Elektroden (10 mm)** und **wenig Wasser (w/b 0,35)** liegen fast immer vorne.
- **Robustheit:** Auch mit anderer Gewichtung (Energie 60 % oder Kosten 20 % statt CO₂) bleibt Geopolymer + KOH + SDS an der Spitze. Bei starker Energie-Gewichtung wandert das Optimum zu 15 % Ruß und dünnen 3-mm-Elektroden.

## Grenzen
Das ist ein **halbempirisches Modell** aus Literaturtrends mit geschätzten Koeffizienten, keine Messung. Es legt fest, **welche Varianten zuerst gebaut werden**. Die echte Rangfolge entscheidet die Versuchsreihe (`beton-superkondensator-versuchsreihe.xlsx`).

## Empfehlung für den ersten Versuch
Rang 4 statt Rang 1: gleiche Rezeptur, aber **Stabmixer + SDS statt Ultraschall** (kein Zusatzgerät nötig), dazu Rang 2 (8 % Ruß) und als Referenz die beste CEM-I-Variante. Das sind 3 Varianten × 3 Zellen = 9 Zellen.
