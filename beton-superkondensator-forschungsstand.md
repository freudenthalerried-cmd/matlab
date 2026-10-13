# Beton-Superkondensator – Forschungsstand und eigener Forschungsplan

Stand: 27.09.2026. Zusammengestellt aus Fachartikeln (MIT/PNAS 2023 und 2025, Advanced Science 2026, Construction and Building Materials 2025, Übersichtsarbeiten 2026) und der Patentlage.

## 1. Was die Forschung bisher gezeigt hat

| Quelle | Kernaussage | Zahlen |
|---|---|---|
| Chanut et al., PNAS 2023 (MIT) | Zement + Wasser + Ruß wird zum Superkondensator. Kapazität ist eine **intensive Größe**: sie skaliert linear mit dem Volumen. | w/z = 0,42; ab **ca. 3 Vol-% Ruß** durchgehendes Leitnetz (Perkolation); Elektrolyt 1 mol/l KCl; **0,22 kWh/m³** (45 m³ für 10 kWh) |
| MIT / PNAS 2025 | **10-fach höhere Energiedichte** durch organische Elektrolyte (LiClO₄ in Propylencarbonat, TEABF₄/TPABF₄ in Acetonitril, Spannungsfenster 2,5–3 V statt 1 V) und **„Cast-in-Electrolyte“**: Elektrolyt wird beim Gießen eingebracht, zentimeterdicke Elektroden ohne Nachtränken. | **ca. 2 kWh/m³** (5 m³ für 10 kWh); Modul **12 V / 50 F** (= 1 Wh); 9-V-Bogen als tragendes Bauteil; dicke Elektroden (10 mm) halten Spannung viel länger als dünne (1 mm) |
| PNAS 2025, Elektrolytvergleich | **KOH** ist chemisch verträglich und **mindert Korrosionsrisiko** in tragenden Teilen (hoher pH schützt Stahl). NaCl/KCl günstig, aber chloridhaltig. | – |
| Liu et al., Advanced Science 2026 (China) | Ruß mit SDS benetzt, **Polyacrylamid-Hydrogel** im Porenraum polymerisiert, Elektrode bei 90 °C thermomechanisch verdichtet. | **1708 mF/cm²**; 83 % Kapazität nach **10.000 Zyklen**; Druckfestigkeit > 8 MPa; 92 % Kapazität unter Last; −20 bis +80 °C; **nicht brennbar** |
| Constr. Build. Mater. 2025 | **Hüttensand (alkalisch aktiviert) + Ruß** statt Portlandzement. Ultraschall-Dispersion verbessert Leitfähigkeit stark. | 4,5 % Ruß → Leitfähigkeit × 594; bis 95 mF/cm²; Coulomb-Effizienz 79 % |
| Übersichtsarbeiten 2026 | Entscheidende Einflussgrößen: Rußtyp und -dispersion, Elektrodendicke und -fläche, w/z, Porosität, Rissbildung. Offener Zielkonflikt: **Festigkeit gegen Kapazität** (Ruß saugt Wasser, erzeugt Makroporen). | – |

### Einordnung der Energiedichte
- Wässriger Elektrolyt (KCl, 1 V): ca. 0,2 kWh/m³. Eine 10 × 10 × 0,3 m Bodenplatte (30 m³) speichert **ca. 6 kWh**.
- Organischer Elektrolyt (3 V): ca. 2 kWh/m³ → dieselbe Platte **ca. 60 kWh**. Aber: Acetonitril und Propylencarbonat sind brennbar bzw. giftig, im Fundament eines Wohnhauses kaum genehmigungsfähig.
- Lithium-Powerwall: ca. 320 kWh/m³. Beton gewinnt nur, weil das Volumen ohnehin da ist.

## 2. Patentlage (wichtig für Österreich)
- **EP 3 737 654** (MIT, CNRS, Université de Bordeaux, Anmeldung 2019): elektrisch leitfähiger Zementverbund mit **2–10 Gew.-% nanoporösem Ruß**, **50–70 % Portlandzement**, Dispergierung mit Carboxymethylcellulose, sowie Verfahren und Superkondensator daraus. Parallel US 10,875,809, US 11,512,022, US 11,897,813. Laufzeit bis 2039.
- Folge: Das **Material mit Portlandzement** ist in Europa geschützt. Selbst bauen für Forschung ist erlaubt (Versuchsprivileg), verkaufen nicht ohne Lizenz (MIT TLO bietet Lizenzen an).
- **Offen** sind: Bauprodukte und Einbauverfahren (Fertigteil mit Elektroden und Anschlussdose, Regelung), und vermutlich **Bindemittel außerhalb von Portlandzement** (alkalisch aktivierter Hüttensand / Geopolymer). Das muss ein Patentanwalt prüfen, die Chance ist aber real.

## 3. Ableitung: Wo eine eigene Forschung ansetzen kann

**These: Geopolymer-Superkondensator mit eingebautem Elektrolyt**
- Alkalisch aktivierter Hüttensand hat von Natur aus eine **hochalkalische Porenlösung (NaOH/KOH)**. Genau das, was das MIT 2025 als korrosionsschonenden Elektrolyt identifiziert hat, ist hier schon drin.
- Hüttensand ist ein Abfallprodukt der Stahlindustrie (voestalpine Linz), billig und mit **ca. 80 % weniger CO₂** als Portlandzement.
- Liegt voraussichtlich **außerhalb des MIT-Anspruchs** (kein Portlandzement 50–70 %).
- Kombiniert mit dem Hydrogel-Ansatz (Elektrolyt als Gel im Porenraum) ergibt das einen nicht brennbaren, tragenden, günstigen Speicher.
- Bisher gibt es dazu nur eine einzige Arbeit (2025) mit niedriger Kapazität. Das ist die Lücke.

## 4. Eigener Forschungsplan (Werkstatt-Maßstab)

| Stufe | Versuch | Ziel / Messgröße |
|---|---|---|
| 0 | **Referenz nach MIT 2023**: CEM I, 10 % Ruß, w/z 0,42, CMC als Dispergierhilfe, 1 mol/l KCl | Reproduzieren: erwartet 0,5–5 F je 10×10-cm-Zelle |
| 1 | **Geopolymer**: Hüttensand + Wasserglas/NaOH-Aktivator + 5/10/15 % Ruß, Ultraschall- oder Stabmixer-Dispersion | Kapazität und Widerstand gegen Referenz |
| 2 | **Elektrolyt**: KCl 1 mol/l, KCl gesättigt, KOH 1 mol/l, Porenlösung des Geopolymers ohne Zusatz | Kapazität, Selbstentladung nach 1 h / 24 h |
| 3 | **Dicke**: 3 / 6 / 10 mm Elektroden | Selbstentladung (MIT: dick hält länger) |
| 4 | **Korrosion**: Bewehrungsstahl-Plättchen 30 Tage in Zelle bei 1 V, Massenverlust wiegen | KCl gegen KOH gegen Geopolymer |
| 5 | **Gel-Elektrolyt (Hobby-sicher)**: Agar oder Gelatine 2–3 % mit KCl statt Polyacrylamid (Acrylamid-Monomer ist giftig) | Kapazität, Austrocknung nach 7 Tagen offen |
| 6 | **Last**: Zelle unter 1–5 MPa Druck (Schraubzwinge mit Kraftmesser) | Kapazität unter Last |
| 7 | **Modul**: 12 Zellen in Serie auf 12 V, LED-Dauerbetrieb | Praxisnachweis |

Ergebnisse werden in `beton-superkondensator-versuchsreihe.xlsx` eingetragen (Spalte „Variante“ um G1–G3 für Geopolymer erweitern).

## 5. Ehrliche Einschätzung
- Der Beton-Superkondensator ist **ein Tages- und Stundenspeicher**, kein Saisonspeicher. Selbstentladung ist das ungelöste Hauptproblem aller Superkondensatoren.
- Die hohe Energiedichte gibt es bisher nur mit brennbaren organischen Elektrolyten. Ein sicherer wässriger Elektrolyt mit hoher Spannung ist die eigentliche wissenschaftliche Lücke, und die ist auch für Universitäten noch offen.
- Für den Bau realistisch: **Fertigteil-Wandelement oder Fundamentstreifen als Puffer für PV** (Stunden), gekoppelt mit normaler Batterie. Das Geld liegt im Bauprodukt und im Einbauverfahren, nicht im Material.

## Quellen
- Chanut et al., PNAS 2023: https://www.pnas.org/doi/10.1073/pnas.2304318120
- MIT/PNAS 2025: https://www.pnas.org/doi/10.1073/pnas.2511912122 ; MIT News: https://news.mit.edu/2025/concrete-battery-now-packs-ten-times-power-1001
- Liu et al., Advanced Science 2026: https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.202515769
- Hüttensand + Ruß, Constr. Build. Mater. 2025: https://www.sciencedirect.com/science/article/pii/S0950061825029198
- Übersicht 2026: https://www.sciencedirect.com/science/article/abs/pii/S2352152X26010558
- Patent EP3737654A1: https://patents.google.com/patent/EP3737654A1/en ; MIT TLO: https://tlo.mit.edu/industry-entrepreneurs/available-technologies/electron-conducting-carbon-based-cement-e-c3
- Kritische Einordnung Energiedichte: https://www.geeky-gadgets.com/mit-organic-electrolyte-concrete/
