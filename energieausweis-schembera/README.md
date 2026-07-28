# Energieausweis Schembera — Ergänzungen und Änderungen

Aufbereitung der handschriftlichen Maßnahmenliste (Foto vom 28.07.2026) zu einer
prüffähigen Eingabevorlage für GEQ.

| | |
| --- | --- |
| Bauvorhaben | Zubau bestehendes Wohnhaus |
| Bauherrin | Monika Andrea Schembera, Fasangasse 20, 4050 Traun |
| Bauplatz | 4050 Traun, Gst.-Nr. 1715/14, KG 45311 Traun |
| Planverfasser | Freudenthaler Bau GmbH, Bmst. Ing. Stefan Freudenthaler |
| GEQ-Projekt | `Schembera Zubau Traun.geqx` |
| Grundlage | Baubeschreibung § 29 Abs. 1 Z 3 Oö. BauO 1994, Einreichplan |
| Regelwerk | OIB-RL 6, Ausgabe 2019 (Oberösterreich) |
| **Zielwert** | **HWB ≤ 44 kWh/m²a** |

> **Wichtig:** Die Neuberechnung selbst muss in GEQ erfolgen — dieses Dokument
> liefert die Eingabewerte und den Änderungsumfang, nicht das Rechenergebnis.
> Der erreichte HWB steht erst nach dem GEQ-Lauf fest.

---

## 1 Transkription der Notiz

```
HWB ≤ 44

EA - alt
+ Zubau lt. Plan bzw. BA
                 ↘ Luft/Luft
 •  WP + FB-Heizung gesamtes Haus
 ○  18 VWS Altbau, Zubau 50 + 5 VWS
 ○  Kellerdecke + 5 cm WD zusatz
 ○  PV - 20 kW Peak, 16 kW
 ○  Fenster + 3f. Internorm, Rollladen
 ◉  OG-Dämmung 22 cm Bestand
 •  KG-Decke + 5 cm unten
    FB = 7 cm Granulat // SDPL 3 cm, Estrich
```

Lesarten, die nicht eindeutig sind, sind in Abschnitt 5 als offene Punkte
festgehalten.

## 2 Ansatz

Der Energieausweis wird **nicht neu aufgebaut**, sondern der bestehende
Ausweis (`EA - alt`) wird um den Zubau erweitert und die Bestandsbauteile
werden auf den sanierten Zustand geändert. In GEQ heißt das:

1. Bestandsgebäude als Zone/Bauteilsatz beibehalten,
2. Zubau laut Einreichplan und Baubeschreibung als zusätzliche Geometrie
   ergänzen (49,02 m² überbaute Fläche, KG + EG + OG + DG, BRI 319,04 m³),
3. Bauteile des Altbaus auf die sanierten Aufbauten umstellen (Abschnitt 3),
4. Anlagentechnik für **das gesamte Haus** — Altbau und Zubau — neu
   hinterlegen (Abschnitt 4).

Flächen aus der Baubeschreibung, die für die Geometrie des Zubaus zu
übernehmen sind:

| Geschoß | Brutto-Grundfläche | mittl. Geschoßhöhe | Bauweise |
| --- | ---: | ---: | --- |
| Kellergeschoß | 50,39 m² | 2,50 m | Stahlbeton, Ziegel |
| Erdgeschoß | 51,02 m² | 2,90 m | Hochlochziegel |
| Obergeschoß | 53,80 m² | 2,90 m | Hochlochziegel |
| Dachgeschoß | 10,17 m² | 2,08 m | Ziegel, Holz |

Gesamtnutzfläche 162,60 m², Wohnnutzfläche 121,11 m², Gebäudehöhe 7,88 m.

## 3 Bauteile

U-Werte nach ÖNORM EN ISO 6946, gerechnet mit `u_werte.py`. Die vollständigen
Schichtaufbauten stehen in [`u-werte.md`](u-werte.md).

| Kennung | Bauteil | Maßnahme laut Notiz | U [W/m²K] | OIB-RL 6 max. |
| --- | --- | --- | ---: | ---: |
| AW-01 | Außenwand Altbau | + 18 cm Vollwärmeschutz | 0,167 | 0,35 |
| AW-02 | Außenwand Zubau | 50 cm Ziegel + 5 cm VWS | 0,162 | 0,35 |
| KD-01 | Kellerdecke | + 5 cm Dämmung unterseitig, Fußbodenaufbau neu | 0,284 | 0,40 |
| OD-01 | Oberste Geschoßdecke | 22 cm Bestand, keine Maßnahme | 0,175 | 0,20 |
| FE-01 | Fenster | 3-fach Internorm, Rollladen | 0,80 | 1,40 |

Alle Bauteile liegen unter den Höchstwerten der OIB-RL 6. Die beiden
Außenwände sind mit 0,167 bzw. 0,162 W/m²K bewusst auf gleichem Niveau —
Altbau und Zubau verhalten sich thermisch gleich.

Fußbodenaufbau über der Kellerdecke laut Notiz, von oben nach unten:
Estrich mit Fußbodenheizung → 3 cm SDPL (Trittschalldämmplatte) →
7 cm gebundene Granulatschüttung → Rohdecke → 5 cm Dämmung unterseitig.

**Achtung:** Die 5 cm unterseitig sind für ein Bauteil mit Fußbodenheizung
knapp. Bei U = 0,284 W/m²K wird der Höchstwert zwar eingehalten, die
Abwärtsverluste der FBH gehen aber voll in den HWB ein. Wenn der Zielwert
HWB ≤ 44 im GEQ-Lauf nicht erreicht wird, ist die Kellerdecke der erste
Stellhebel — 8 statt 5 cm bringen rund 0,05 W/m²K.

## 4 Anlagentechnik

Laut Notiz für das **gesamte Haus**, also Altbau und Zubau gemeinsam:

| Position | Ansatz | GEQ-Eingabe |
| --- | --- | --- |
| Wärmebereitstellung | Wärmepumpe | Wärmeerzeuger Raumheizung + Warmwasser |
| Wärmeabgabe | Fußbodenheizung, gesamtes Haus | Niedertemperatur-Flächenheizung, Auslegung 35/28 °C |
| Warmwasser | über Wärmepumpe | WW-Bereitstellung = Raumheizungssystem |
| Photovoltaik | 20 kWp Modulleistung, 16 kW Wechselrichter | Endenergieertrag Strom, Ausrichtung/Neigung aus Einreichplan |
| Lüftung | keine Angabe | derzeit Fensterlüftung — siehe offene Punkte |

Die Umstellung auf Wärmepumpe + Flächenheizung wirkt im Ausweis vor allem auf
HEB, EEB, PEB, CO₂ und f_GEE, nicht auf den HWB. Der Zielwert HWB ≤ 44 wird
ausschließlich über die Gebäudehülle aus Abschnitt 3 erreicht. Die PV-Anlage
verbessert EEB und f_GEE, der HWB bleibt davon unberührt.

Die Baubeschreibung ist bei Punkt 12 („Beheizung — Wärmebereitstellung“)
entsprechend nachzuziehen: zentral für das Gebäude, hocheffizientes
alternatives Energiesystem = Wärmepumpe.

## 5 Offene Punkte

1. **„Luft/Luft“ vs. Luft/Wasser.** Die Notiz vermerkt beim Wärmepumpen-Punkt
   „Luft/Luft“. Zusammen mit einer Fußbodenheizung ist das technisch nicht
   stimmig — eine FBH braucht eine **Luft/Wasser**-Wärmepumpe. Vor der
   GEQ-Eingabe klären; im Bauteilkatalog ist Luft/Wasser unterstellt.
2. **U-Wert der Bestandswand.** Für AW-01 ist U_alt = 1,20 W/m²K angenommen
   (25 cm Hochlochziegel, unsaniert). Der tatsächliche Wert ist aus dem
   Energieausweis-alt bzw. der Bestandsaufnahme zu übernehmen — er verschiebt
   den U-Wert von AW-01 spürbar.
3. **λ des 50er-Ziegels.** Je nach Produkt zwischen 0,07 und 0,14 W/mK.
   Gerechnet ist 0,11. Das ist der größte Einzelunsicherheitsfaktor bei AW-02.
4. **Rohdecken.** Für Keller- und oberste Geschoßdecke ist 18 cm Stahlbeton
   angenommen. Laut Baubeschreibung ist das Kellergeschoß in Stahlbeton/Ziegel
   ausgeführt, das Dachgeschoß in Ziegel/Holz — bei Holzbalkendecke ist der
   Aufbau von OD-01 anzupassen.
5. **Fenster-Kennwerte.** Uw = 0,80 W/m²K ist ein typischer Internorm-Wert für
   3-fach-Verglasung. Die tatsächlichen Uw-, Ug- und g-Werte aus dem Angebot
   übernehmen; g wirkt über die solaren Gewinne direkt auf den HWB.
6. **Rollläden.** In GEQ als temporärer Wärmeschutz und/oder als Verschattung
   erfassen — beides beeinflusst den HWB gegenläufig.
7. **Lüftungsanlage.** Nicht in der Notiz erwähnt. Sollte HWB ≤ 44 knapp
   verfehlt werden, ist eine kontrollierte Wohnraumlüftung mit
   Wärmerückgewinnung die wirksamste Ergänzung.
8. **Zuordnung EA-alt.** Im Ablagebestand liegen unter „Schembera“ zwei
   Standorte: dieses Projekt in **Traun** und ein älterer Ausweis
   `Schembera - Pucking.pdf` (Baujahr 1999, BGF 389,9 m², HWB_Ref,SK
   47,4 kWh/m²a). Für den Zubau Traun ist der Traun-Ausweis heranzuziehen —
   vor dem GEQ-Lauf bestätigen, welcher Ausweis als „EA-alt“ gilt.

## 6 Checkliste für den GEQ-Lauf

- [ ] Geometrie Zubau laut Einreichplan ergänzen (Flächen siehe Abschnitt 2)
- [ ] AW-01 Altbau auf 18 cm VWS umstellen
- [ ] AW-02 Zubau anlegen, λ des Ziegels aus Datenblatt
- [ ] KD-01 Kellerdecke: 5 cm unterseitig + neuer Fußbodenaufbau
- [ ] OD-01 unverändert übernehmen (22 cm Bestand)
- [ ] FE-01 Fenster tauschen, Uw/Ug/g aus Angebot, Rollläden erfassen
- [ ] Wärmeerzeuger auf Wärmepumpe umstellen (Bauart klären, Punkt 5.1)
- [ ] Wärmeabgabe auf Fußbodenheizung, gesamtes Haus
- [ ] PV 20 kWp / 16 kW WR mit Ausrichtung und Neigung erfassen
- [ ] Wärmebrücken und Luftdichtheit für den Zubau prüfen
- [ ] **HWB ≤ 44 kWh/m²a kontrollieren** — bei Zielverfehlung: Kellerdecke
      verstärken, dann KWL mit WRG
- [ ] Baubeschreibung Punkt 11a (Energiekennzahl) und Punkt 12 (Beheizung)
      nachziehen

## 7 Dateien

| Datei | Inhalt |
| --- | --- |
| `README.md` | dieses Dokument |
| `u_werte.py` | U-Wert-Berechnung nach ÖNORM EN ISO 6946 |
| `u-werte.md` | erzeugte Schichttabellen (`python3 u_werte.py --markdown`) |

Nach jeder Änderung an `u_werte.py`:

```sh
python3 u_werte.py --markdown > u-werte.md
```
