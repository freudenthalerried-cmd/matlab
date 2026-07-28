<!-- erzeugt mit u_werte.py - nicht von Hand editieren -->

`*` = Annahme, vor der GEQ-Eingabe pruefen.

### AW-01 — Aussenwand Altbau saniert - Bestand + 18 cm VWS

| Schicht (von innen nach aussen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi (Waermeuebergang innen) |  |  | 0.130 |
| Bestandswand (ANNAHME U_alt = 1.20 W/m2K) |  |  | 0.663 |
| EPS-F Vollwaermeschutz 18 cm * | 18.0 | 0.035 | 5.143 |
| Klebe-/Armierungsmoertel, Oberputz * | 1.0 | 0.700 | 0.014 |
| Rse (Waermeuebergang aussen) |  |  | 0.040 |
| **R_tot** | | | **5.990** |

**U = 0.167 W/m²K** — OIB-RL 6 Anforderung U_max 0.35 W/m²K: erfüllt

> Notiz: '18 VWS Altbau'. U_alt vor Ort bzw. aus EA-alt uebernehmen.

### AW-02 — Aussenwand Zubau - 50 cm Ziegel + 5 cm VWS

| Schicht (von innen nach aussen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi (Waermeuebergang innen) |  |  | 0.130 |
| Innenputz Kalk-Gips * | 1.0 | 0.700 | 0.014 |
| Hochlochziegel-Planziegel 50 cm * | 50.0 | 0.110 | 4.545 |
| EPS-F Vollwaermeschutz 5 cm * | 5.0 | 0.035 | 1.429 |
| Klebe-/Armierungsmoertel, Oberputz * | 1.0 | 0.700 | 0.014 |
| Rse (Waermeuebergang aussen) |  |  | 0.040 |
| **R_tot** | | | **6.173** |

**U = 0.162 W/m²K** — OIB-RL 6 Anforderung U_max 0.35 W/m²K: erfüllt

> Notiz: 'Zubau 50 + 5 VWS'. lambda des 50er-Ziegels produktabhaengig (0,07-0,14) - massgeblicher Stellhebel, Datenblatt einsetzen.

### KD-01 — Kellerdecke gegen unbeheizten Keller

| Schicht (von innen nach aussen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi (Waermeuebergang innen) |  |  | 0.170 |
| Zementestrich mit FB-Heizung * | 6.0 | 1.330 | 0.045 |
| SDPL Trittschalldaemmplatte 3 cm | 3.0 | 0.040 | 0.750 |
| Granulatschuettung gebunden 7 cm * | 7.0 | 0.080 | 0.875 |
| Stahlbetondecke 18 cm * | 18.0 | 2.300 | 0.078 |
| Daemmung unterseitig 5 cm * | 5.0 | 0.035 | 1.429 |
| Rse (Waermeuebergang aussen) |  |  | 0.170 |
| **R_tot** | | | **3.517** |

**U = 0.284 W/m²K** — OIB-RL 6 Anforderung U_max 0.40 W/m²K: erfüllt

> Notiz: 'Kellerdecke + 5 cm WD zusatz' / 'KG-Decke + 5 cm unten', 'FB = 7 cm Granulat // SDPL 3 cm, Estrich'.

### OD-01 — Oberste Geschossdecke / OG-Daemmung - Bestand 22 cm

| Schicht (von innen nach aussen) | d [cm] | λ [W/mK] | R [m²K/W] |
| --- | ---: | ---: | ---: |
| Rsi (Waermeuebergang innen) |  |  | 0.100 |
| Mineralwolle 22 cm (Bestand) * | 22.0 | 0.040 | 5.500 |
| Stahlbetondecke 18 cm * | 18.0 | 2.300 | 0.078 |
| Rse (Waermeuebergang aussen) |  |  | 0.040 |
| **R_tot** | | | **5.718** |

**U = 0.175 W/m²K** — OIB-RL 6 Anforderung U_max 0.20 W/m²K: erfüllt

> Notiz: 'OG-Daemmung 22 cm Bestand' - Bestand bleibt, keine Massnahme. Erfuellt § 38 Oe. BauTG 2013 (U_max 0,20).

### FE-01 — Fenster 3-fach verglast, Internorm, mit Rollladen

**Uw = 0.80 W/m²K**, Ug = 0.50 W/m²K, g = 0.53 — OIB-RL 6 Anforderung U_max 1.40 W/m²K: erfüllt

> Notiz: 'Fenster + 3f. Internorm, Rollladen'. Uw je nach Typ (KF 410 / KF 520 / HF 410) 0,71-0,85 - Werte aus Angebot uebernehmen. Rollladen in GEQ als temporaerer Waermeschutz bzw. Verschattung erfassen.

