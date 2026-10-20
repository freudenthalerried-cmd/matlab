<!-- erzeugt mit u_werte.py - nicht von Hand editieren -->

## Abgleich des Bestandsmodells gegen GEQ

| Bauteil | nachgerechnet U | GEQ U | |
| --- | ---: | ---: | --- |
| AW02 — Aussenwand zweischalig, ungedaemmt | 0.996 | 1.000 | ✓ |
| KD01 — Decke zu unkonditioniertem Keller | 0.196 | 0.196 | ✓ |
| AD01 — Decke zu unkond. geschlossenem Dachraum | 0.134 | 0.134 | ✓ |

Die nachgerechneten Bestands-U-Werte decken sich mit den GEQ-Werten des EA-alt — das Modell bildet den Bestand korrekt ab.

## Bauteile nach den Maßnahmen

`[neu]` = Schicht laut Notiz, alles andere ist Bestand aus dem EA-alt.

### AW-01 — Aussenwand Bestand + 18 cm Vollwaermeschutz

| Schicht (von innen nach außen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi + Rse (laut GEQ-Ausdruck) |  |  | 0.170 |
| Kalkzementputz innen | 1.0 | 0.800 | 0.012 |
| Hochlochziegelmauer 30 cm | 30.0 | 0.540 | 0.556 |
| Luftschicht stehend 2 cm | 2.0 | - | 0.103 |
| Vollziegelmauerwerk 12 cm | 12.0 | 0.830 | 0.145 |
| Kalkzementputz aussen | 1.5 | 0.800 | 0.019 |
| EPS-F Vollwaermeschutz 18 cm [neu] | 18.0 | 0.038 | 4.737 |
| Silikatputz armiert [neu] | 0.8 | 0.800 | 0.010 |
| **R_tot** | | | **5.751** |

**U = 0.174 W/m²K** — OIB-RL 6 Anforderung U_max 0.35 W/m²K: erfüllt

> Notiz: '18 VWS Altbau'. lambda 0,038 wie im bestehenden GEQ-Modell fuer EPS-F. Die Variante 2023 rechnet 14 cm und kommt auf U = 0,215.

### KD-01a — Kellerdecke - Bestandsaufbau bleibt, + 5 cm unterseitig

| Schicht (von innen nach außen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi + Rse (laut GEQ-Ausdruck) |  |  | 0.340 |
| Bodenbelag | 1.0 | 0.250 | 0.040 |
| Estrichbeton | 5.0 | 1.480 | 0.034 |
| Folie | 0.2 | 0.150 | 0.013 |
| Porit | 5.0 | 0.040 | 1.250 |
| WO Hart | 14.0 | 0.042 | 3.333 |
| Stahlbetondecke 20 cm | 20.0 | 2.500 | 0.080 |
| Deckenputz | 0.2 | 0.800 | 0.003 |
| Daemmung unterseitig 5 cm [neu] | 5.0 | 0.035 | 1.429 |
| **R_tot** | | | **6.522** |

**U = 0.153 W/m²K** — OIB-RL 6 Anforderung U_max 0.40 W/m²K: erfüllt

> GEWAEHLT. Notiz: 'Kellerdecke + 5 cm WD zusatz' / 'KG-Decke + 5 cm unten'. Kein Eingriff in den bestehenden Fussbodenaufbau, die 19 cm Bestandsdaemmung bleiben erhalten.

### KD-01b — Kellerdecke - Fussbodenaufbau neu + 5 cm unterseitig

| Schicht (von innen nach außen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi + Rse (laut GEQ-Ausdruck) |  |  | 0.340 |
| Zementestrich mit Fussbodenheizung [neu] | 6.0 | 1.330 | 0.045 |
| SDPL Trittschalldaemmplatte 3 cm [neu] | 3.0 | 0.040 | 0.750 |
| Granulatschuettung gebunden 7 cm [neu] | 7.0 | 0.080 | 0.875 |
| Stahlbetondecke 20 cm | 20.0 | 2.500 | 0.080 |
| Deckenputz | 0.2 | 0.800 | 0.003 |
| Daemmung unterseitig 5 cm [neu] | 5.0 | 0.035 | 1.429 |
| **R_tot** | | | **3.521** |

**U = 0.284 W/m²K** — OIB-RL 6 Anforderung U_max 0.40 W/m²K: erfüllt

> NICHT gewaehlt, als Alternative dokumentiert. Notiz: 'FB = 7 cm Granulat // SDPL 3 cm, Estrich'. Rueckbau des Bestandsaufbaus fuer die Fussbodenheizung - dabei gehen 5 cm Porit und 14 cm WO Hart verloren, das Bauteil wird schlechter als der Bestand.

### AD-01 — Decke zum Dachraum - Bestand, keine Massnahme

| Schicht (von innen nach außen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi + Rse (laut GEQ-Ausdruck) |  |  | 0.200 |
| Deckenputz | 0.2 | 0.800 | 0.003 |
| Stahlbetondecke 20 cm | 20.0 | 1.700 | 0.118 |
| Dampfbremse | 0.0 | 0.500 | 0.000 |
| Daemmung 18 cm | 18.0 | 0.042 | 4.286 |
| Waermedaemmung 10 cm | 10.0 | 0.035 | 2.857 |
| **R_tot** | | | **7.463** |

**U = 0.134 W/m²K** — OIB-RL 6 Anforderung U_max 0.20 W/m²K: erfüllt

> Notiz: 'OG-Daemmung 22 cm Bestand'. Der EA-alt weist 18 + 10 = 28 cm aus - die Abweichung ist zu klaeren, siehe offene Punkte.

### FE-01 — Fenster 3-fach verglast, Internorm, mit Rollladen

**Uw = 0.80 W/m²K**, g = 0.53 — OIB-RL 6 Anforderung U_max 1.40 W/m²K: erfüllt

> Notiz: 'Fenster + 3f. Internorm, Rollladen'. Bestand Uw = 1,90, g = 0,62. Uw je nach Typ 0,71-0,85 - Werte aus dem Angebot uebernehmen.

## HWB-Abschätzung

| Variante | U Kellerdecke | L_ges [W/K] | Heizlast | HWB_Ref,SK [kWh/m²a] |
| --- | ---: | ---: | ---: | ---: |
| EA-alt (13.09.2022) | 0,196 | 637.6 | 23,4 kW | 139.3 |
| Variante 2023 (14 cm VWS) | 0,196 | 285.8 | 10,5 kW | 47.4 |
| **A - Bestandsaufbau bleibt** — **gewählt** | 0.153 | 246.7 | 9.1 kW | **ca. 39–40** |
| **B - Fussbodenaufbau neu** | 0.284 | 261.6 | 9.6 kW | **ca. 43–44** |

Zielwert laut Notiz: **HWB ≤ 44 kWh/m²a**. Die Abschätzung interpoliert linear zwischen den beiden vorliegenden GEQ-Läufen desselben Gebäudes und enthält einen Aufschlag von 2–3 kWh/m²a für die geringeren solaren Gewinne der 3-fach-Verglasung. **Sie ersetzt den GEQ-Lauf nicht.**

