# Neue Stromquellen: Top 10 aus 1.944 Kombinationen

Script: `stromideen.py`, alle Ergebnisse: `stromideen_alle.csv`

## Vorgehen
- **41 Standorte** (Autobahn, Tunnel, Kläranlage, Kiesgrube, Stahlwerk, Deponie, Rechenzentrum, Skigebiet, Stall …) mit **81 konkreten Energiequellen**
- × **24 Wandler** (PV, Turbinen, Lineargenerator, ORC, Kalina, Stirling, Thermoakustik, TEG, Nitinol, Curie-Generator, Piezo, triboelektrisch, mikrobielle Brennstoffzelle …)
- = **1.944 Kombinationen**, davon 1.521 physikalisch unpassend (z. B. Turbine an Wärmequelle), 79 mit zu kleinem Temperaturunterschied
- **344 bewertet** nach Stromkosten (40 %), Neuheit (30 %), Jahresertrag (20 %) und technischer Reife (10 %). Wärme wird über den Carnot-Wirkungsgrad gerechnet.
- **81 liegen unter 10 ct/kWh**, 27 davon gelten als neu oder als Forschungsstand.
- Für die Spitzenkandidaten habe ich anschließend nach Anlagen und Patenten gesucht.

## Top 10 (je Energiequelle die beste Kombination)

| # | Idee | Wandler | Ertrag/Jahr | Kosten | Recherche-Ergebnis | Noch offen? |
|---|---|---|---|---|---|---|
| 1 | Flüssige Hochofenschlacke (1.400 °C) verstromen | Dampfkolbenmotor / ORC | 13 GWh | 3,9 ct | Pilotanlage bei **voestalpine Linz** (Primetals), CSIRO-Pilot in Australien | ❌ besetzt |
| 2 | LKW-Bremsenergie an Gefällestrecken | Lineargenerator in der Fahrbahn | 280 MWh | 6,8 ct | **REPS GmbH** (23,6 Mio $ Finanzierung), Patent aus Taiwan | ❌ besetzt |
| 3 | Fernwärme-Rücklauf gegen Grundwasser | ORC | 1,5 GWh | 5,3 ct | Konzepte existieren. Physikalisch nur im Sommer sinnvoll, sonst wird Heizwärme vernichtet | ⚠️ schwach |
| 4 | Zementwerk-Klinkerkühler-Abluft (250 °C) | **Thermoakustik-Motor** | 2,3 GWh | 7,5 ct* | ORC/Kalina im Zementwerk Standard. Thermoakustik nur Labor (China-Prototyp 102 kW, 28 %), **keine Industrieanlage in Europa gefunden** | ✅ Anwendung offen |
| 5 | Müllverbrennung Rauchgas nach Kessel (180 °C) | **Thermoakustik-Motor** | 1,3 GWh | 7,5 ct* | wie 4 | ✅ Anwendung offen |
| 6 | Rechenzentrum, Flüssigkühlung 60 °C | Kalina / ORC | 1,2 GWh | 5,9 ct | Forschung (Rice University 2025, Modellrechnung), keine Serienanlage | ✅ teilweise offen |
| 7 | **Deponie-Innenwärme (50 °C) verstromen** | ORC | 100 MWh je Deponie | 7,1 ct | Wärmeentnahme mit Rohren **patentiert (US 8,672,586)**. Studie: bei 35 °C geregelt **verdoppelt sich der Deponiegasertrag**. Verstromung der Wärme selbst nicht gefunden | ✅ Kombination offen |
| 8 | Schachtförderung abwärts (Bergwerk) | Lineargenerator | 70 MWh | 8,7 ct | Fördermaschinen rekuperieren bereits über Umrichter | ❌ besetzt |
| 9 | Brüden/Dampfschwaden Molkerei, Brauerei (95 °C) | Kalina / ORC | 290 MWh | 6,0 ct | ORC ab 70 °C ist Stand der Technik | ❌ besetzt |
| 10 | Basistunnel-Gebirgswärme (40 °C, z. B. Brenner, Koralm) | Thermoakustik / ORC | 380 MWh | 12,6 ct | Tunnelwasser wird für Heizung genutzt, Verstromung kaum untersucht | ⚠️ offen, aber teuer |

\* Thermoakustik-Kosten sind besonders unsicher, weil es noch keine Serienprodukte gibt.

## Ehrliches Ergebnis
- **Keine der 1.944 Kombinationen ist eine völlig neue Physik.** Wirtschaftlich gute Stromquellen hängen immer an einer großen, freien Energiequelle, und die großen sind längst bekannt.
- Von den 10 besten sind **5 schon besetzt** (Anlagen oder Patente vorhanden), 2 physikalisch schwach und **3 echte Lücken**:
  1. **Deponie-Innenwärme verstromen + Gasertrag verdoppeln.** Zwei Effekte in einem System: Die Wärmeentnahme regelt die Deponie auf ca. 35 °C, dadurch entsteht laut Studie doppelt so viel Deponiegas, und die entnommene Wärme wird zusätzlich verstromt. Die Wärmeentnahme selbst ist patentiert (US 8,672,586). Offen ist die Kombination mit Verstromung und Gasertragssteuerung. **Passt zum Bau**, weil es Tiefbau mit Rohren ist.
  2. **Thermoakustik-Motor an Industrie-Abwärme** (Zement, Müllverbrennung). Er hat keine beweglichen Teile außer dem Lineargenerator, damit wenig Wartung und ist robust gegen Staub. In der Industrie ist er noch nicht eingesetzt. Ein Anwendungspatent (Einbau, Wärmetauscher, Staubschutz) ist möglich, die Technik selbst kommt aus der Forschung.
  3. **Rechenzentrum-Abwärme verstromen.** Ein großer, wachsender Markt, aber bei 60 °C nur 5–8 % Wirkungsgrad. Die Konkurrenz ist die Wärmepumpe mit Fernwärme.

## Grenzen
Alle Werte sind Größenordnungen aus einem einfachen Modell. „Nicht gefunden“ heißt nicht „kein Patent“. Vor jeder Investition braucht es eine professionelle Patentrecherche (Österreichisches Patentamt, Espacenet).

## Quellen
- Schlacke: [Primetals – Tapping hot slag for energy](https://www.primetals.com/en/metals-magazine/tapping-hot-slag-for-energy/), [CSIRO Dry slag granulation](https://www.csiro.au/en/work-with-us/industries/mining-resources/processing/dry-slag-granulation)
- Fahrbahn: [REPS GmbH](https://www.reps.energy/), [Mechanical roadway system (Applied Energy)](https://www.sciencedirect.com/science/article/abs/pii/S0306261911006556)
- Thermoakustik: [pv magazine 2026](https://www.pv-magazine.com/2026/04/23/thermoacoustic-heat-pumps-on-the-verge-of-commercial-breakthrough/), [Thermoacoustic engines startups](https://www.climafix.in/ref/cis/innovation/thermoacoustic-engines/)
- Zementwerk: [Waste heat recovery in cement plants – review](https://www.sciencedirect.com/science/article/abs/pii/S0360544224038659), [TEG am Drehrohrofen](https://www.sciencedirect.com/science/article/pii/S2451904925002215)
- Rechenzentrum: [Rice University 2025](https://news.rice.edu/news/2025/rice-researchers-turn-wasted-data-center-heat-clean-power)
- Deponie: [Heat energy potential of MSW landfills](https://www.sciencedirect.com/science/article/pii/S1364032122007183), [US 8,672,586](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8672586)
- Fernwärme/ORC: [Low temperature district heating with ORC](https://www.sciencedirect.com/science/article/abs/pii/S0360544222001839)
- Brüden/ORC: [ORC unter 100 °C](https://www.process.vogel.de/orc-anlage-erzeugt-strom-aus-abwaerme-von-unter-100-c-a-432836/)
