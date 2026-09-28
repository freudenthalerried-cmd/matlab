"""Systematische Suche nach neuen, wirtschaftlichen Stromquellen.

Kombiniert Standort × Energiequelle × Wandler, filtert physikalisch unmögliche
Paare, schätzt Jahresertrag und Stromgestehungskosten (LCOE) und bewertet die
Neuheit. Wärmequellen werden über den Carnot-Wirkungsgrad gerechnet.
Alle Zahlen sind grobe Annahmen (Größenordnung), keine Planung.
"""
import csv
import math

# Quelle: (Name, Klasse, mittlere nutzbare Leistung kW, Spitzenfaktor, T_warm °C, T_kalt °C)
# Klassen: licht, luft, wasser, druck_wasser, druck_gas, masse, schwingung, waerme, chemisch, chemisch_nass
W = "waerme"
STANDORTE = {
    "Autobahn (1 km)": [("Sonne auf Lärmschutzwand", "licht", 17, 5), ("Fahrtwind LKW", "luft", 0.8, 4),
                        ("Asphaltwärme Sommer", W, 60, 3, 55, 20), ("Fahrbahnschwingung", "schwingung", 0.05, 3),
                        ("Bremsen vor Mautstelle/Abfahrt", "masse", 0.5, 5)],
    "Autobahn-Gefällestrecke (LKW-Bremsen)": [("LKW-Bremsenergie bergab", "masse", 40, 3)],
    "Straßentunnel": [("Lüftungs-/Kolbenwind", "luft", 5, 3), ("Bergwasser 20–30 °C", W, 800, 1.2, 28, 8),
                      ("Tunnelluft vs. Außenluft Winter", W, 150, 2, 18, -2)],
    "Bahntunnel (Basistunnel)": [("Gebirgswärme 40 °C Fels/Wasser", W, 1500, 1.2, 40, 10)],
    "Kläranlage": [("Abwassergefälle Zulauf", "wasser", 8, 1.5), ("Abwasserwärme", W, 900, 1.2, 16, 5),
                   ("Faulgas", "chemisch", 150, 1.2), ("Klärschlamm organisch", "chemisch_nass", 40, 1.2)],
    "Kiesgrube/Steinbruch": [("Schüttgut bergab (Band/LKW)", "masse", 25, 2), ("Brechervibration", "schwingung", 1, 2),
                             ("Sonne auf Baggersee", "licht", 150, 5), ("Grundwasser-Abpumpung Rücklauf", "wasser", 3, 1.5)],
    "Logistik-/Lagerhalle": [("Sonne Dach", "licht", 110, 5), ("Regalbediengerät absenken", "masse", 0.8, 4),
                             ("LKW-Rampe Anfahren/Bremsen", "masse", 0.3, 5), ("Hallenluft oben/unten", W, 20, 2, 30, 18)],
    "Rinder-/Schweinestall": [("Tierwärme Abluft", W, 80, 1.3, 22, 0), ("Gülle", "chemisch", 30, 1.2),
                              ("Mist-Kompostwärme", W, 25, 1.3, 60, 10)],
    "Gebäudefassade Hochhaus": [("Sonne Fassade", "licht", 40, 5), ("Eckwind", "luft", 2, 4)],
    "Trinkwasser-Hochbehälter": [("Wasser-Überdruck statt Druckminderer", "druck_wasser", 30, 1.5),
                                 ("Wasser 8 °C vs. Luft", W, 60, 2, 20, 8)],
    "Industriebetrieb": [("Abgas 200–400 °C", W, 300, 1.3, 300, 30), ("Kühlwasser 30–60 °C", W, 800, 1.3, 50, 15),
                         ("Druckluft-Abblasen", "druck_gas", 10, 1.5), ("Maschinenvibration", "schwingung", 0.5, 2)],
    "Kühlhaus": [("Kondensator-Abwärme", W, 150, 1.5, 35, 10)],
    "Rechenzentrum": [("Server-Abwärme Flüssigkühlung", W, 2000, 1.2, 60, 15), ("Kühlturm-Abluft", "luft", 3, 1.5)],
    "Baustelle": [("Kranlast absenken", "masse", 1.5, 5), ("Bagger-Hydraulik absenken", "masse", 2, 4),
                  ("Sonne auf Bauzaun/Container", "licht", 5, 5), ("Betonhydratationswärme", W, 30, 2, 45, 10)],
    "Bahntrasse": [("Schienenschwingung", "schwingung", 0.2, 3), ("Fahrtwind Zug", "luft", 1.5, 4),
                   ("Sonne Gleisbett", "licht", 60, 5)],
    "Gasnetz-Druckregelstation": [("Erdgas-Entspannung", "druck_gas", 200, 1.3), ("Entspannungskälte", W, 40, 1.3, 10, -30)],
    "Wasserstoff-Tankstelle": [("H2-Druckabbau 900→350 bar", "druck_gas", 5, 3)],
    "Hackschnitzel-/Kompostplatz": [("Rottewärme", W, 60, 1.3, 65, 10)],
    "Fluss/Bach": [("Strömung ohne Staustufe", "wasser", 15, 1.5)],
    "Schiffsschleuse": [("Schleusenwasser Ablassen", "wasser", 60, 4)],
    "Parkhaus": [("Autos Rampe abwärts", "masse", 0.3, 5), ("Sonne Oberdeck", "licht", 40, 5)],
    "Skigebiet": [("Beschneiungswasser Druck talwärts", "druck_wasser", 50, 3), ("Seilbahn talwärts beladen", "masse", 5, 3),
                  ("Speicherteich Schmelzwasser", "wasser", 30, 3)],
    "Bergwerk/Stollen": [("Grubenwasser warm", W, 500, 1.2, 30, 8), ("Schachtförderung abwärts", "masse", 10, 3)],
    "Stahlwerk": [("Flüssigschlacke 1400 °C", W, 5000, 1.5, 1000, 30), ("Walzwerk-Kühlwasser", W, 3000, 1.3, 45, 15)],
    "Glas-/Zementwerk": [("Ofenmantel-Abstrahlung", W, 400, 1.2, 250, 25), ("Klinkerkühler-Abluft", W, 2000, 1.2, 250, 25)],
    "Müllverbrennung": [("Rauchgas nach Kessel", W, 1500, 1.2, 180, 30)],
    "Molkerei/Brauerei": [("Brüden/Dampfschwaden", W, 300, 1.5, 95, 15), ("Reinigungsabwasser warm", W, 200, 1.5, 55, 10)],
    "Bäckerei": [("Backofen-Abgas", W, 60, 1.5, 200, 20)],
    "Hallen-/Freibad": [("Duschabwasser", W, 80, 1.5, 32, 10)],
    "Eishalle": [("Kältemaschinen-Abwärme", W, 400, 1.5, 40, 10)],
    "Wäscherei": [("Waschabwasser", W, 150, 1.5, 60, 10)],
    "Krankenhaus": [("Sterilisation-/Küchenabwärme", W, 150, 1.5, 70, 15)],
    "Fernwärmenetz": [("Rücklauf 50 °C vs. Grundwasser", W, 3000, 1.2, 50, 10),
                      ("Differenzdruck Übergabestation", "druck_wasser", 5, 1.5)],
    "Deponie": [("Deponiegas", "chemisch", 100, 1.2), ("Sickerwasser organisch", "chemisch_nass", 10, 1.2),
                ("Deponie-Innenwärme 50 °C", W, 200, 1.2, 50, 10)],
    "Biogasanlage": [("BHKW-Abgas nach Wärmetauscher", W, 150, 1.2, 180, 30), ("Gärrest warm", W, 100, 1.2, 40, 10)],
    "Gewächshaus": [("Sommer-Überschusswärme", W, 300, 3, 45, 15)],
    "Autowaschanlage": [("Hochdruckwasser-Rücklauf", "druck_wasser", 2, 3)],
    "Fitnessstudio": [("Trainingsgeräte", "masse", 0.5, 3)],
    "Aufzug Hochhaus": [("Kabine abwärts beladen", "masse", 2, 5)],
    "Landwirtschaft Feld": [("Sonne Agri-PV", "licht", 200, 5), ("Traktor-Hydraulik", "masse", 0.3, 4)],
}

# Wandler: {Klasse: Wirkungsgrad oder Anteil vom Carnot}, Investition €/kW el (Spitze), Reife 0..1, min ΔT K
WANDLER = {
    "Photovoltaik": ({"licht": 0.20}, 900, 1.0, 0),
    "Kleinwindturbine": ({"luft": 0.30}, 4000, 0.9, 0),
    "Wasserturbine/Pumpe als Turbine": ({"wasser": 0.70, "druck_wasser": 0.70}, 3500, 1.0, 0),
    "Wasserrad/Strömungsrotor": ({"wasser": 0.40}, 5000, 0.8, 0),
    "Gasexpansionsturbine": ({"druck_gas": 0.75}, 2500, 0.9, 0),
    "Druckluft-Kolbenmotor": ({"druck_gas": 0.40}, 2000, 0.7, 0),
    "Lineargenerator": ({"masse": 0.80, "schwingung": 0.30}, 2000, 0.8, 0),
    "Elektromotor rekuperativ": ({"masse": 0.85}, 1200, 1.0, 0),
    "Hydraulikspeicher + Generator": ({"masse": 0.60}, 1800, 0.8, 0),
    "Piezo": ({"schwingung": 0.05, "masse": 0.02}, 50000, 0.6, 0),
    "Triboelektrisch": ({"schwingung": 0.03}, 80000, 0.3, 0),
    "Elektrostatischer Kondensator-Generator": ({"schwingung": 0.10, "luft": 0.05}, 60000, 0.2, 0),
    "ORC-Turbine": ({W: 0.45}, 3000, 0.9, 40),
    "Kalina-Kreisprozess": ({W: 0.50}, 3500, 0.6, 40),
    "Stirlingmotor": ({W: 0.35}, 5000, 0.7, 20),
    "Thermoakustik-Motor": ({W: 0.30}, 6000, 0.4, 30),
    "Thermoelektrik (TEG)": ({W: 0.12}, 8000, 0.8, 10),
    "Thermogalvanische Zelle": ({W: 0.20}, 30000, 0.2, 10),
    "Formgedächtnis-Motor (Nitinol)": ({W: 0.10}, 15000, 0.3, 15),
    "Thermomagnetischer Generator (Curie)": ({W: 0.10}, 20000, 0.1, 20),
    "Dampfkolbenmotor": ({W: 0.40}, 2500, 0.8, 100),
    "Mikrobielle Brennstoffzelle": ({"chemisch_nass": 0.10, "chemisch": 0.05}, 40000, 0.3, 0),
    "Gasmotor-BHKW": ({"chemisch": 0.38}, 1500, 1.0, 0),
    "Brennstoffzelle (SOFC)": ({"chemisch": 0.50}, 6000, 0.6, 0),
}

# Bekannter Stand je (Quelle, Wandler): 0 = Markt, 0.1–0.3 = Anlagen/Piloten, 0.4–0.6 = Forschung
BEKANNT = {
    ("Sonne auf Lärmschutzwand", "Photovoltaik"): 0.1, ("Sonne Dach", "Photovoltaik"): 0.0, ("Sonne Fassade", "Photovoltaik"): 0.0,
    ("Sonne auf Baggersee", "Photovoltaik"): 0.1, ("Sonne Gleisbett", "Photovoltaik"): 0.3, ("Sonne Oberdeck", "Photovoltaik"): 0.0,
    ("Sonne auf Bauzaun/Container", "Photovoltaik"): 0.2, ("Sonne Agri-PV", "Photovoltaik"): 0.0,
    ("Faulgas", "Gasmotor-BHKW"): 0.0, ("Gülle", "Gasmotor-BHKW"): 0.0, ("Deponiegas", "Gasmotor-BHKW"): 0.0,
    ("Faulgas", "Brennstoffzelle (SOFC)"): 0.3, ("Deponiegas", "Brennstoffzelle (SOFC)"): 0.3, ("Gülle", "Brennstoffzelle (SOFC)"): 0.4,
    ("Wasser-Überdruck statt Druckminderer", "Wasserturbine/Pumpe als Turbine"): 0.0,
    ("Erdgas-Entspannung", "Gasexpansionsturbine"): 0.1, ("Abgas 200–400 °C", "ORC-Turbine"): 0.0,
    ("Rauchgas nach Kessel", "ORC-Turbine"): 0.1, ("BHKW-Abgas nach Wärmetauscher", "ORC-Turbine"): 0.0,
    ("Klinkerkühler-Abluft", "ORC-Turbine"): 0.1, ("Klinkerkühler-Abluft", "Kalina-Kreisprozess"): 0.2,
    ("Abgas 200–400 °C", "Kalina-Kreisprozess"): 0.2, ("Kühlwasser 30–60 °C", "ORC-Turbine"): 0.3,
    ("Server-Abwärme Flüssigkühlung", "ORC-Turbine"): 0.4, ("Abgas 200–400 °C", "Thermoelektrik (TEG)"): 0.3,
    ("Abgas 200–400 °C", "Stirlingmotor"): 0.2, ("Backofen-Abgas", "Stirlingmotor"): 0.5,
    ("Flüssigschlacke 1400 °C", "ORC-Turbine"): 0.5, ("Flüssigschlacke 1400 °C", "Dampfkolbenmotor"): 0.5,
    ("Ofenmantel-Abstrahlung", "Thermoelektrik (TEG)"): 0.4, ("Brüden/Dampfschwaden", "ORC-Turbine"): 0.4,
    ("Kranlast absenken", "Elektromotor rekuperativ"): 0.3, ("Schüttgut bergab (Band/LKW)", "Elektromotor rekuperativ"): 0.2,
    ("Regalbediengerät absenken", "Elektromotor rekuperativ"): 0.0, ("Bagger-Hydraulik absenken", "Elektromotor rekuperativ"): 0.3,
    ("Kabine abwärts beladen", "Elektromotor rekuperativ"): 0.0, ("Seilbahn talwärts beladen", "Elektromotor rekuperativ"): 0.0,
    ("Schachtförderung abwärts", "Elektromotor rekuperativ"): 0.1, ("Trainingsgeräte", "Elektromotor rekuperativ"): 0.1,
    ("Fahrbahnschwingung", "Piezo"): 0.2, ("Bremsen vor Mautstelle/Abfahrt", "Lineargenerator"): 0.3,
    ("Autos Rampe abwärts", "Lineargenerator"): 0.4, ("Fahrtwind LKW", "Kleinwindturbine"): 0.3,
    ("Lüftungs-/Kolbenwind", "Kleinwindturbine"): 0.3, ("Eckwind", "Kleinwindturbine"): 0.2, ("Fahrtwind Zug", "Kleinwindturbine"): 0.3,
    ("Abwassergefälle Zulauf", "Wasserturbine/Pumpe als Turbine"): 0.2, ("Strömung ohne Staustufe", "Wasserrad/Strömungsrotor"): 0.1,
    ("Strömung ohne Staustufe", "Wasserturbine/Pumpe als Turbine"): 0.2, ("Schleusenwasser Ablassen", "Wasserturbine/Pumpe als Turbine"): 0.3,
    ("Speicherteich Schmelzwasser", "Wasserturbine/Pumpe als Turbine"): 0.1,
    ("Beschneiungswasser Druck talwärts", "Wasserturbine/Pumpe als Turbine"): 0.2,
    ("Klärschlamm organisch", "Mikrobielle Brennstoffzelle"): 0.5, ("Sickerwasser organisch", "Mikrobielle Brennstoffzelle"): 0.5,
    ("Bergwasser 20–30 °C", "ORC-Turbine"): 0.5, ("Abwasserwärme", "ORC-Turbine"): 0.6, ("Grubenwasser warm", "ORC-Turbine"): 0.5,
    ("Gebirgswärme 40 °C Fels/Wasser", "ORC-Turbine"): 0.5, ("Entspannungskälte", "ORC-Turbine"): 0.4,
    ("Schienenschwingung", "Piezo"): 0.4, ("LKW-Bremsenergie bergab", "Elektromotor rekuperativ"): 0.3,
    ("Schüttgut bergab (Band/LKW)", "Lineargenerator"): 0.3, ("Schüttgut bergab (Band/LKW)", "Hydraulikspeicher + Generator"): 0.3, ("Maschinenvibration", "Piezo"): 0.3, ("Druckluft-Abblasen", "Gasexpansionsturbine"): 0.4,
}
NEUHEIT_STANDARD = 0.75

ANNUITAET = 0.09     # 20 Jahre, ca. 6 % Zins + Wartung
FIXKOSTEN = 20000    # € je Anlage: Planung, Genehmigung, Netzanschluss
STROMWERT = 0.10     # €/kWh Eigenverbrauch Gewerbe 2026 (grob)


REIFE_WAERMEWANDLER = {"ORC-Turbine", "Kalina-Kreisprozess", "Dampfkolbenmotor", "Stirlingmotor", "Thermoelektrik (TEG)"}


def neuheit_regel(klasse, q, wandler):
    """Grobe Regel, wo keine Einzelbewertung vorliegt: Hochtemperatur-Abwärme mit
    Standardmaschinen ist Stand der Technik, Niedertemperatur Forschung."""
    if klasse == W and wandler in REIFE_WAERMEWANDLER:
        return 0.25 if q[4] >= 150 else 0.5
    if klasse in ("druck_gas", "druck_wasser"):
        return 0.4
    if klasse == "masse" and wandler in ("Elektromotor rekuperativ", "Hydraulikspeicher + Generator"):
        return 0.4
    return NEUHEIT_STANDARD


def carnot(th, tc):
    return max(0.0, 1.0 - (tc + 273.15) / (th + 273.15))


def main():
    zeilen, verworfen, inkompatibel = [], 0, 0
    for ort, quellen in STANDORTE.items():
        for q in quellen:
            name, klasse, p_kw, spitze = q[:4]
            for wandler, (eta_map, capex_kw, reife, dt_min) in WANDLER.items():
                if klasse not in eta_map:
                    inkompatibel += 1
                    continue
                if klasse == W:
                    th, tc = q[4], q[5]
                    if th - tc < dt_min:
                        verworfen += 1
                        continue
                    eta = eta_map[W] * carnot(th, tc)
                    # kleine Temperaturdifferenz = große Wärmetauscher = teurer
                    capex_eff = capex_kw * math.sqrt(max(1.0, 80.0 / (th - tc)))
                else:
                    eta = eta_map[klasse]
                    capex_eff = capex_kw
                p_el = p_kw * eta
                kwh = p_el * 8760
                invest = p_el * spitze * capex_eff + FIXKOSTEN
                lcoe = invest * ANNUITAET / kwh if kwh > 0 else 99
                neu = BEKANNT.get((name, wandler), neuheit_regel(klasse, q, wandler))
                zeilen.append(dict(ort=ort, quelle=name, wandler=wandler, eta=eta, kw_el=p_el, kwh_jahr=kwh,
                                   invest=invest, lcoe=lcoe, neuheit=neu, reife=reife))

    for z in zeilen:
        wirtschaft = max(0.0, min(1.0, (0.30 - z["lcoe"]) / (0.30 - 0.03)))   # 3 ct = 1, 30 ct = 0
        groesse = max(0.0, min(1.0, math.log10(max(z["kwh_jahr"], 1)) / 6.5))  # ca. 3 GWh = 1
        z["punkte"] = 100 * (0.40 * wirtschaft + 0.30 * z["neuheit"] + 0.20 * groesse + 0.10 * z["reife"])
        if z["lcoe"] > 3 * STROMWERT:
            z["punkte"] *= 0.3

    zeilen.sort(key=lambda z: z["punkte"], reverse=True)
    with open("stromideen_alle.csv", "w", newline="", encoding="utf-8") as f:
        cols = ["rang", "punkte", "ort", "quelle", "wandler", "eta", "kw_el", "kwh_jahr", "invest", "lcoe", "neuheit", "reife"]
        w = csv.writer(f, delimiter=";")
        w.writerow(cols)
        for i, z in enumerate(zeilen, 1):
            w.writerow([i] + [round(z[c], 4) if isinstance(z[c], float) else z[c] for c in cols[1:]])
    gepr = len(zeilen) + verworfen + inkompatibel
    wirt = sum(1 for z in zeilen if z["lcoe"] <= STROMWERT)
    neu_wirt = sum(1 for z in zeilen if z["lcoe"] <= STROMWERT and z["neuheit"] >= 0.5)
    print(f"{gepr} Kombinationen geprüft, {inkompatibel} unpassend (Wandler passt nicht zur Quelle), {verworfen} ΔT zu klein, {len(zeilen)} bewertet, "
          f"{wirt} unter {STROMWERT*100:.0f} ct/kWh, davon {neu_wirt} neu/Forschung")
    for i, z in enumerate(zeilen[:30], 1):
        print(f"{i:2d}. {z['punkte']:5.1f} | {z['ort']} | {z['quelle']} | {z['wandler']} | "
              f"{z['kwh_jahr']/1000:8.1f} MWh/a | {z['lcoe']*100:5.1f} ct | neu {z['neuheit']}")


if __name__ == "__main__":
    main()
