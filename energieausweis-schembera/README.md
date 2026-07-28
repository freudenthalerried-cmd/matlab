# Energieausweis Schembera — Pucking, Sanierung Bestandsgebäude

Aufbereitung der handschriftlichen Maßnahmenliste zu einer prüffähigen
Eingabevorlage für GEQ.

| | |
| --- | --- |
| Objekt | Schembera — Pucking, 4055 Pucking, Gst.-Nr. 1006/15, KG 45522 |
| Baujahr | 1999 |
| Umfang | Sanierung Bestandsgebäude, **kein Zubau** |
| Ersteller | Freudenthaler Bau GmbH, Bmst. Ing. Stefan Freudenthaler |
| Grundlage | `EA Schembera - Pucking.pdf`, 13.09.2022 (EA-alt, Ist-Zustand) |
| Regelwerk | OIB-RL 6, Ausgabe April 2019 (Oberösterreich) |
| **Zielwert** | **HWB ≤ 44 kWh/m²a** |

> Die Neuberechnung erfolgt in GEQ. Dieses Dokument liefert die Eingabewerte,
> den Änderungsumfang und eine Plausibilitätsrechnung — nicht den Ausweis.

## 0 Getroffene Festlegungen

| Punkt | Festlegung |
| --- | --- |
| Umfang | nur Bestandsgebäude, **kein Zubau** |
| Basis | **EA-alt vom 13.09.2022**, unsanierter Ist-Zustand |
| Wärmepumpe | **Luft/Wasser** — passend zur Fußbodenheizung |
| Kellerdecke | **Variante A: + 5 cm unterseitig**, bestehender Fußbodenaufbau bleibt |

Damit ergibt die Abschätzung **HWB_Ref,SK ≈ 39–40 kWh/m²a** — der Zielwert von
44 wird mit rund 4–5 kWh/m²a Reserve erreicht.

---

## 1 Transkription der Notiz

```
HWB ≤ 44

EA - alt
+ Zubau lt. Plan bzw. BA          ← entfällt, Zubau wird nicht gebaut
                 ↘ Luft/Luft      ← korrigiert: Luft/Wasser
 •  WP + FB-Heizung gesamtes Haus
 ○  18 VWS Altbau, Zubau 50 + 5 VWS
 ○  Kellerdecke + 5 cm WD zusatz
 ○  PV - 20 kW Peak, 16 kW
 ○  Fenster + 3f. Internorm, Rollladen
 ◉  OG-Dämmung 22 cm Bestand
 •  KG-Decke + 5 cm unten
    FB = 7 cm Granulat // SDPL 3 cm, Estrich   ← kein Rückbau des Bestandsaufbaus
```

Gerechnet wird ausschließlich das Bestandsgebäude laut EA-alt. Der Zubau und
damit die Zeile „Zubau 50 + 5 VWS" entfallen. Geometrie, Flächen und
Nutzungsprofil bleiben gegenüber dem EA-alt unverändert.

## 2 Ausgangslage

Es liegen zwei GEQ-Läufe desselben Gebäudes vor:

| Datei | Datum | Stand | HWB_Ref,SK | f_GEE,SK | mittl. U | Klasse |
| --- | --- | --- | ---: | ---: | ---: | :-: |
| `EA Schembera - Pucking.pdf` | 13.09.2022 | **EA-alt, unsaniert** | 139,3 | 1,80 | 0,70 | D |
| `Schembera - Pucking.pdf` | 07.03.2023 | Variante mit 14 cm VWS | 47,4 | 0,93 | 0,26 | B |

Der Lauf von 2023 ist zwar als „Ist-Zustand" beschriftet, enthält aber bereits
14 cm EPS-F auf der Außenwand und Fenster mit Uw 1,10 — er ist damit eine
bereits gerechnete Sanierungsvariante, nicht der Bestand. **Basis ist der Lauf
von 2022.**

Gebäudekenndaten (in allen Varianten gleich):

| | |
| --- | --- |
| Brutto-Grundfläche BGF | 389,9 m² |
| Bezugsfläche BF | 311,9 m² |
| Brutto-Volumen V_B | 1.253,3 m³ |
| Gebäude-Hüllfläche A | 803,8 m² |
| Kompaktheit A/V | 0,64 1/m |
| charakteristische Länge l_c | 1,56 m |
| Norm-Außentemperatur | −14,7 °C |
| Heizgradtage | 3.765 Kd |

## 3 Bauteile

U-Werte nach ÖNORM EN ISO 6946, gerechnet mit `u_werte.py`; vollständige
Schichtaufbauten in [`u-werte.md`](u-werte.md). Die Bestandsschichten sind 1:1
aus dem EA-alt übernommen — die nachgerechneten Bestands-U-Werte decken sich
mit den GEQ-Werten, damit ist das Modell verifiziert.

| Kennung | Bauteil | Bestand | nach Maßnahme | OIB-RL 6 max. |
| --- | --- | ---: | ---: | ---: |
| AW-01 | Außenwand + 18 cm VWS | 1,00 | **0,174** | 0,35 |
| **KD-01a** | **Kellerdecke, Bestandsaufbau + 5 cm unten — gewählt** | 0,196 | **0,153** | 0,40 |
| KD-01b | Kellerdecke, Aufbau neu + 5 cm unten — Alternative | 0,196 | 0,284 | 0,40 |
| AD-01 | Decke zum Dachraum, Bestand | 0,134 | 0,134 | 0,20 |
| FE-01 | Fenster 3-fach Internorm | 1,90 | **0,80** | 1,40 |

Unverändert übernommen: FD01 Außendecke 0,243 · EB01 erdanliegender Fußboden
0,277 · ZD01 warme Zwischendecke 0,25.

Die Außenwand ist der große Hebel: 356,18 m² bei U 1,00 sind allein
354,6 W/K von 509,4 W/K Gesamtleitwert des Bestands. Mit 18 cm VWS bleiben
davon 62,0 W/K.

### 3.1 Kellerdecke — Variante A festgelegt

Die bestehende Kellerdecke ist **bereits sehr gut gedämmt** — 5 cm Porit plus
14 cm WO Hart über der Stahlbetondecke, U = 0,196 W/m²K.

**Gewählt ist Variante A:** der Bestandsaufbau bleibt unangetastet, es kommen
5 cm unterseitig dazu. U = 0,153 W/m²K.

Zur Einordnung bleibt Variante B dokumentiert: würde der Fußbodenaufbau für die
FB-Heizung erneuert (7 cm Granulat + 3 cm SDPL + Estrich laut Notiz), stiege der
U-Wert auf 0,284 W/m²K — **schlechter als der Bestand**, weil dem Aufbau 19 cm
Dämmung entnommen und nur 10 cm deutlich schwächeres Material plus 5 cm
unterseitig eingebracht würden. Der OIB-Höchstwert von 0,40 wäre zwar weiter
eingehalten, der HWB läge aber rund 4 kWh/m²a höher.

**Was daraus für die Ausführung folgt:** die Fußbodenheizung muss in den
bestehenden Aufbau eingebracht werden, ohne die 19 cm Bestandsdämmung
zurückzubauen. Wenn sich das auf der Baustelle nicht halten lässt, ändert sich
die Rechnung — dann ist Variante B maßgeblich und die unterseitige Dämmung
sollte auf 10–12 cm erhöht werden.

## 4 Anlagentechnik

| Position | Bestand laut EA-alt | neu laut Notiz |
| --- | --- | --- |
| Wärmebereitstellung | Hackgut-Brennwertkessel, 27,2 kW | **Luft/Wasser-Wärmepumpe** |
| Wärmeabgabe | Radiatoren 90/70, Ventile von Hand | Fußbodenheizung, gesamtes Haus |
| Warmwasser | kombiniert mit Raumheizung, 546 l Speicher | über Wärmepumpe |
| Lüftung | Fensterlüftung | unverändert |
| Photovoltaik | keine | 20 kWp, 16 kW Wechselrichter |

Die Umstellung auf Wärmepumpe und Flächenheizung wirkt auf HEB, EEB, PEB, CO₂
und f_GEE — **nicht auf den HWB**. Der Zielwert HWB ≤ 44 wird ausschließlich
über die Gebäudehülle erreicht. Die PV-Anlage verbessert EEB und f_GEE, der HWB
bleibt unberührt.

Die Heizlast sinkt von 23,4 kW (Bestand) auf rund 9,1 kW — relevant für die
Auslegung der Wärmepumpe. Für die Dimensionierung ist eine Heizlastberechnung
nach ÖNORM H 7500 erforderlich; die EA-Abschätzung genügt dafür nicht.

## 5 HWB-Abschätzung

| Variante | L_ges | Heizlast | HWB_Ref,SK |
| --- | ---: | ---: | ---: |
| EA-alt (13.09.2022) | 637,6 | 23,4 kW | 139,3 |
| Variante 2023 (14 cm VWS) | 285,8 | 10,5 kW | 47,4 |
| **A — Bestandsaufbau Kellerdecke bleibt — gewählt** | 246,7 | 9,1 kW | **ca. 39–40** |
| B — Fußbodenaufbau neu (Alternative) | 261,6 | 9,6 kW | ca. 43–44 |

Rechenweg: Leitwertbilanz über alle Bauteile mit den Flächen und
Korrekturfaktoren des GEQ-Heizlastblatts, Wärmebrücken pauschal +10 % wie im
EA-alt, Lüftungsleitwert 77,21 W/K unverändert. Der HWB wird linear zwischen
den beiden vorliegenden GEQ-Läufen interpoliert — dieselbe Geometrie, dasselbe
Nutzungsprofil, dieselbe Klimadatei, daher ist der Zusammenhang in diesem
Bereich nahezu linear. Enthalten ist ein Aufschlag von 2–3 kWh/m²a für die
geringeren solaren Gewinne der 3-fach-Verglasung (g sinkt von 0,62 auf 0,53).

**Beurteilung:** Die gewählte Variante A erreicht den Zielwert mit rund
4–5 kWh/m²a Reserve. Das ist genug Puffer, um Abweichungen bei λ-Werten,
Wärmebrücken oder Fenster-Kennwerten aufzufangen.

**Die Abschätzung ersetzt den GEQ-Lauf nicht** — sie sagt, ob der Zielwert
plausibel erreichbar ist, und wo die Reserve liegt.

## 6 Offene Punkte

1. **„OG-Dämmung 22 cm Bestand"** — der EA-alt weist für AD01 18 cm λ 0,042
   plus 10 cm λ 0,035 aus, also 28 cm, U = 0,134 W/m²K. Entweder ist die Notiz
   ungenau oder der EA-alt bildet den Dachraum zu günstig ab. Bei tatsächlich
   22 cm läge der U-Wert bei rund 0,16 W/m²K, der HWB rund 0,5 kWh/m²a höher —
   für den Zielwert nicht entscheidend, für die Richtigkeit des Ausweises schon.
2. **Fenster-Kennwerte** aus dem Angebot übernehmen. Uw wirkt über den
   Leitwert, g über die solaren Gewinne — beide direkt auf den HWB.
3. **Rollläden** in GEQ als temporärer Wärmeschutz und/oder Verschattung
   erfassen; die beiden Effekte wirken gegenläufig.
4. **λ des Vollwärmeschutzes.** Gerechnet ist 0,038 wie im bestehenden
   GEQ-Modell. Mit einem Grauschaum-EPS bei 0,032 sinkt der U-Wert der
   Außenwand von 0,174 auf 0,153 W/m²K.
5. **Bestandswand.** Der EA-alt modelliert eine zweischalige Wand mit
   Luftschicht (U = 1,00), der Lauf von 2023 einen einschaligen 38er-Ziegel.
   Für den neuen Ausweis den zweischaligen Aufbau des EA-alt verwenden.
6. **Ausführung Fußbodenheizung** — siehe Abschnitt 3.1: die FBH muss ohne
   Rückbau der 19 cm Bestandsdämmung in der Kellerdecke eingebracht werden,
   sonst gilt Variante B.

## 7 Checkliste für den GEQ-Lauf

- [ ] Projekt aus dem EA-alt vom 13.09.2022 kopieren, Geometrie unverändert
- [ ] AW02: 18 cm EPS-F + Silikatputz ergänzen → U 0,174
- [ ] KD01: 5 cm unterseitig ergänzen, Bestandsaufbau unverändert → U 0,153
- [ ] AD01 unverändert lassen, Dämmstärke vor Ort prüfen (Punkt 6.1)
- [ ] Fenster tauschen: Uw, Ug, g aus dem Angebot, Rollläden erfassen
- [ ] Wärmeerzeuger auf **Luft/Wasser-Wärmepumpe** umstellen
- [ ] Wärmeabgabe auf Fußbodenheizung, Systemtemperatur 35/28
- [ ] Warmwasser über Wärmepumpe, Speicher prüfen
- [ ] PV 20 kWp / 16 kW WR mit Ausrichtung und Neigung erfassen
- [ ] **HWB_Ref,SK ≤ 44 kWh/m²a kontrollieren** (Erwartung: 39–40)
- [ ] Bei Zielverfehlung: λ des VWS senken (Grauschaum 0,032), unterseitige
      Dämmung der Kellerdecke erhöhen, zuletzt KWL mit Wärmerückgewinnung

## 8 Dateien

| Datei | Inhalt |
| --- | --- |
| `README.md` | dieses Dokument |
| `u_werte.py` | Bauteile, Leitwertbilanz, HWB-Abschätzung |
| `u-werte.md` | erzeugte Tabellen |

Nach jeder Änderung an `u_werte.py`:

```sh
python3 u_werte.py --markdown > u-werte.md
```
