#!/usr/bin/env python3
"""Bauteile und HWB-Abschaetzung Schembera - Pucking, Sanierung Bestandsgebaeude.

Basis ist der bestehende Energieausweis (EA-alt):
    EA Schembera - Pucking.pdf, 13.09.2022, Ist-Zustand, HWB_Ref,SK = 139,3 kWh/m2a

Kein Zubau. Die Waermedaemmmassnahmen laut handschriftlicher Notiz werden auf
das Bestandsgebaeude angewendet, Geometrie und Flaechen bleiben unveraendert.

Rechenweg U-Werte nach OENORM EN ISO 6946:
    R_tot = Rsi + Rse + sum(d_i / lambda_i)
    U     = 1 / R_tot

Schichtaufbauten, Flaechen, Korrekturfaktoren und Leitwerte sind 1:1 aus den
GEQ-Ausdrucken uebernommen. Die nachgerechneten Bestands-U-Werte stimmen mit
den GEQ-Werten ueberein - das ist der Plausibilitaetsnachweis fuer das Modell.

Aufruf:  python3 u_werte.py            -> Textausgabe
         python3 u_werte.py --markdown -> Markdown fuer die Doku
"""

import sys

# ---------------------------------------------------------------------------
# Kennwerte aus den beiden vorliegenden GEQ-Laeufen
# ---------------------------------------------------------------------------

EA_ALT = {           # EA Schembera - Pucking.pdf, 13.09.2022, Ist-Zustand
    "datum": "13.09.2022",
    "hwb_ref_sk": 139.3,
    "l_t": 560.36,       # Transmissions-Leitwert inkl. Waermebruecken [W/K]
    "l_v": 77.21,        # Lueftungs-Leitwert [W/K]
}
EA_VAR14 = {         # Schembera - Pucking.pdf, 07.03.2023, Variante 14 cm VWS
    "datum": "07.03.2023",
    "hwb_ref_sk": 47.4,
    "l_t": 208.58,
    "l_v": 77.21,
}

BGF = 389.93         # Brutto-Grundflaeche [m2]
ZUSCHLAG_WB = 0.10   # Waermebruecken pauschal nach ON B 8110-6-1 (aus EA-alt)
ZIELWERT_HWB = 44.0  # laut Notiz

# Festlegung Bauherr/Ersteller: Kellerdecke = nur 5 cm unterseitig,
# bestehender Fussbodenaufbau bleibt erhalten. Variante B ist als
# Alternative dokumentiert, falls der Aufbau doch geoeffnet wird.
GEWAEHLTE_KD_VARIANTE = "A"

# Bauteilflaechen und Korrekturfaktoren aus dem GEQ-Heizlastblatt
FLAECHEN = {
    "AD01": (192.58, 0.90),   # Decke zu unkond. geschlossenem Dachraum
    "AW02": (356.18, 1.00),   # Aussenwand
    "FD01": (4.77, 1.00),     # Aussendecke, Waermestrom nach oben
    "FE":   (52.90, 1.00),    # Fenster und Tueren
    "EB01": (49.68, 0.70),    # erdanliegender Fussboden
    "KD01": (147.67, 0.70),   # Decke zu unkonditioniertem Keller
}


class Schicht:
    def __init__(self, name, d_cm, lam, r_fix=None, neu=False):
        self.name = name
        self.d = d_cm / 100.0
        self.lam = lam
        self._r_fix = r_fix          # fuer Luftschichten: R direkt vorgegeben
        self.neu = neu               # True = neue Schicht laut Notiz

    @property
    def r(self):
        return self._r_fix if self._r_fix is not None else self.d / self.lam


class Bauteil:
    def __init__(self, kennung, name, r_s, schichten, flaeche_key,
                 anforderung=None, hinweis=None, u_geq=None):
        self.kennung = kennung
        self.name = name
        self.r_s = r_s               # Rsi + Rse, wie im GEQ-Ausdruck angegeben
        self.schichten = schichten
        self.flaeche_key = flaeche_key
        self.anforderung = anforderung
        self.hinweis = hinweis
        self.u_geq = u_geq           # GEQ-Wert zum Abgleich, falls Bestand

    @property
    def r_tot(self):
        return self.r_s + sum(s.r for s in self.schichten)

    @property
    def u(self):
        return 1.0 / self.r_tot

    @property
    def leitwert(self):
        a, f = FLAECHEN[self.flaeche_key]
        return a * self.u * f


# ---------------------------------------------------------------------------
# Bestandsbauteile laut EA-alt (13.09.2022) - unveraendert uebernommen
# ---------------------------------------------------------------------------

AW_BESTAND = [
    Schicht("Kalkzementputz innen", 1.0, 0.800),
    Schicht("Hochlochziegelmauer 30 cm", 30.0, 0.540),
    Schicht("Luftschicht stehend 2 cm", 2.0, None, r_fix=0.103),
    Schicht("Vollziegelmauerwerk 12 cm", 12.0, 0.830),
    Schicht("Kalkzementputz aussen", 1.5, 0.800),
]

KD_BESTAND = [
    Schicht("Bodenbelag", 1.0, 0.250),
    Schicht("Estrichbeton", 5.0, 1.480),
    Schicht("Folie", 0.2, 0.150),
    Schicht("Porit", 5.0, 0.040),
    Schicht("WO Hart", 14.0, 0.042),
    Schicht("Stahlbetondecke 20 cm", 20.0, 2.500),
    Schicht("Deckenputz", 0.2, 0.800),
]

BESTAND = [
    Bauteil("AW02", "Aussenwand zweischalig, ungedaemmt", 0.17, AW_BESTAND,
            "AW02", u_geq=1.00),
    Bauteil("KD01", "Decke zu unkonditioniertem Keller", 0.34, KD_BESTAND,
            "KD01", u_geq=0.196),
    Bauteil("AD01", "Decke zu unkond. geschlossenem Dachraum", 0.20, [
        Schicht("Deckenputz", 0.2, 0.800),
        Schicht("Stahlbetondecke 20 cm", 20.0, 1.700),
        Schicht("Dampfbremse", 0.01, 0.500),
        Schicht("Daemmung 18 cm", 18.0, 0.042),
        Schicht("Waermedaemmung 10 cm", 10.0, 0.035),
    ], "AD01", u_geq=0.134),
]

U_BESTAND_FE = 1.90          # Uw Bestandsfenster laut EA-alt
U_BESTAND_FD01 = 0.243       # Aussendecke, unveraendert
U_BESTAND_EB01 = 0.277       # erdanliegender Fussboden, unveraendert


# ---------------------------------------------------------------------------
# Bauteile nach den Massnahmen laut Notiz
# ---------------------------------------------------------------------------

MASSNAHMEN = [
    Bauteil(
        "AW-01", "Aussenwand Bestand + 18 cm Vollwaermeschutz", 0.17,
        AW_BESTAND + [
            Schicht("EPS-F Vollwaermeschutz 18 cm", 18.0, 0.038, neu=True),
            Schicht("Silikatputz armiert", 0.8, 0.800, neu=True),
        ],
        "AW02", anforderung=0.35,
        hinweis="Notiz: '18 VWS Altbau'. lambda 0,038 wie im bestehenden GEQ-Modell "
                "fuer EPS-F. Die Variante 2023 rechnet 14 cm und kommt auf U = 0,215.",
    ),
    Bauteil(
        "KD-01a", "Kellerdecke - Bestandsaufbau bleibt, + 5 cm unterseitig", 0.34,
        KD_BESTAND + [
            Schicht("Daemmung unterseitig 5 cm", 5.0, 0.035, neu=True),
        ],
        "KD01", anforderung=0.40,
        hinweis="GEWAEHLT. Notiz: 'Kellerdecke + 5 cm WD zusatz' / 'KG-Decke + 5 cm "
                "unten'. Kein Eingriff in den bestehenden Fussbodenaufbau, die "
                "19 cm Bestandsdaemmung bleiben erhalten.",
    ),
    Bauteil(
        "KD-01b", "Kellerdecke - Fussbodenaufbau neu + 5 cm unterseitig", 0.34,
        [
            Schicht("Zementestrich mit Fussbodenheizung", 6.0, 1.330, neu=True),
            Schicht("SDPL Trittschalldaemmplatte 3 cm", 3.0, 0.040, neu=True),
            Schicht("Granulatschuettung gebunden 7 cm", 7.0, 0.080, neu=True),
            Schicht("Stahlbetondecke 20 cm", 20.0, 2.500),
            Schicht("Deckenputz", 0.2, 0.800),
            Schicht("Daemmung unterseitig 5 cm", 5.0, 0.035, neu=True),
        ],
        "KD01", anforderung=0.40,
        hinweis="NICHT gewaehlt, als Alternative dokumentiert. Notiz: 'FB = 7 cm "
                "Granulat // SDPL 3 cm, Estrich'. Rueckbau des Bestandsaufbaus fuer "
                "die Fussbodenheizung - dabei gehen 5 cm Porit und 14 cm WO Hart "
                "verloren, das Bauteil wird schlechter als der Bestand.",
    ),
    Bauteil(
        "AD-01", "Decke zum Dachraum - Bestand, keine Massnahme", 0.20,
        [
            Schicht("Deckenputz", 0.2, 0.800),
            Schicht("Stahlbetondecke 20 cm", 20.0, 1.700),
            Schicht("Dampfbremse", 0.01, 0.500),
            Schicht("Daemmung 18 cm", 18.0, 0.042),
            Schicht("Waermedaemmung 10 cm", 10.0, 0.035),
        ],
        "AD01", anforderung=0.20,
        hinweis="Notiz: 'OG-Daemmung 22 cm Bestand'. Der EA-alt weist 18 + 10 = 28 cm "
                "aus - die Abweichung ist zu klaeren, siehe offene Punkte.",
    ),
]

FENSTER_NEU = {
    "kennung": "FE-01",
    "name": "Fenster 3-fach verglast, Internorm, mit Rollladen",
    "uw": 0.80,
    "g": 0.53,
    "anforderung": 1.40,
    "hinweis": "Notiz: 'Fenster + 3f. Internorm, Rollladen'. Bestand Uw = 1,90, g = 0,62. "
               "Uw je nach Typ 0,71-0,85 - Werte aus dem Angebot uebernehmen.",
}


# ---------------------------------------------------------------------------
# Leitwertbilanz und HWB-Abschaetzung
# ---------------------------------------------------------------------------

def leitwert_summe(u_aw, u_kd, u_fe):
    """Summe A*U*f ueber alle Bauteile [W/K]."""
    posten = [
        ("AD01", 0.134), ("FD01", U_BESTAND_FD01), ("EB01", U_BESTAND_EB01),
        ("AW02", u_aw), ("KD01", u_kd), ("FE", u_fe),
    ]
    return sum(FLAECHEN[k][0] * u * FLAECHEN[k][1] for k, u in posten)


def hwb_schaetzung(l_ges):
    """HWB_Ref,SK aus dem Gesamtleitwert, linear zwischen den zwei GEQ-Laeufen.

    Zwei bekannte Stuetzstellen desselben Gebaeudes bei identischer Geometrie,
    Nutzung und Klimadatei - dazwischen ist der Zusammenhang nahezu linear.
    Die Naeherung erfasst NICHT die Aenderung der solaren Gewinne durch den
    kleineren g-Wert der 3-fach-Verglasung; siehe Aufschlag in der Ausgabe.
    """
    l_alt = EA_ALT["l_t"] + EA_ALT["l_v"]
    l_var = EA_VAR14["l_t"] + EA_VAR14["l_v"]
    steigung = (EA_ALT["hwb_ref_sk"] - EA_VAR14["hwb_ref_sk"]) / (l_alt - l_var)
    achse = EA_VAR14["hwb_ref_sk"] - steigung * l_var
    return steigung * l_ges + achse


# Aufschlag fuer die geringeren solaren Gewinne bei g 0,62 -> 0,53:
# 37,01 m2 Glasflaeche, fs 0,65, rund 15 % weniger nutzbare Solargewinne.
# Groessenordnung 2-3 kWh/m2a bezogen auf 390 m2 BGF.
AUFSCHLAG_G_MIN, AUFSCHLAG_G_MAX = 2.0, 3.0


def varianten():
    u_aw = next(b for b in MASSNAHMEN if b.kennung == "AW-01").u
    u_kd_a = next(b for b in MASSNAHMEN if b.kennung == "KD-01a").u
    u_kd_b = next(b for b in MASSNAHMEN if b.kennung == "KD-01b").u
    u_fe = FENSTER_NEU["uw"]
    out = []
    for kuerzel, name, u_kd in (("A", "A - Bestandsaufbau bleibt", u_kd_a),
                                ("B", "B - Fussbodenaufbau neu", u_kd_b)):
        s = leitwert_summe(u_aw, u_kd, u_fe)
        l_t = s * (1 + ZUSCHLAG_WB)
        l_ges = l_t + EA_ALT["l_v"]
        h = hwb_schaetzung(l_ges)
        out.append({
            "name": name, "u_kd": u_kd, "summe": s, "l_t": l_t, "l_ges": l_ges,
            "hwb_min": h + AUFSCHLAG_G_MIN, "hwb_max": h + AUFSCHLAG_G_MAX,
            "gewaehlt": kuerzel == GEWAEHLTE_KD_VARIANTE,
            # Heizlast-Abschaetzung analog GEQ: L_ges * Temperaturdifferenz
            "heizlast": l_ges * 36.7 / 1000.0,
        })
    return out


# ---------------------------------------------------------------------------
# Ausgabe
# ---------------------------------------------------------------------------

def _schichtzeilen(b):
    rows = [("Rsi + Rse (laut GEQ-Ausdruck)", "", "", f"{b.r_s:.3f}")]
    for s in b.schichten:
        lam = "-" if s.lam is None else f"{s.lam:.3f}"
        rows.append((s.name + (" [neu]" if s.neu else ""),
                     f"{s.d * 100:.1f}", lam, f"{s.r:.3f}"))
    return rows


def ausgabe_text():
    print("BAUTEILE UND HWB-ABSCHAETZUNG SCHEMBERA - PUCKING")
    print(f"Basis: EA-alt vom {EA_ALT['datum']}, "
          f"HWB_Ref,SK = {EA_ALT['hwb_ref_sk']:.1f} kWh/m2a\n")

    print("--- Abgleich Bestandsmodell gegen GEQ ---")
    for b in BESTAND:
        ok = "OK" if abs(b.u - b.u_geq) < 0.006 else "ABWEICHUNG"
        print(f"  {b.kennung:<6} nachgerechnet U = {b.u:.3f}   "
              f"GEQ U = {b.u_geq:.3f}   {ok}")

    print("\n--- Bauteile nach den Massnahmen ---")
    for b in MASSNAHMEN:
        print(f"\n{b.kennung}  {b.name}")
        print(f"  {'Schicht':<44}{'d [cm]':>8}{'lambda':>9}{'R [m2K/W]':>11}")
        for n, d, lam, r in _schichtzeilen(b):
            print(f"  {n:<44}{d:>8}{lam:>9}{r:>11}")
        print(f"  {'R_tot':<44}{'':>8}{'':>9}{b.r_tot:>11.3f}")
        status = "erfuellt" if b.u <= b.anforderung else "NICHT erfuellt"
        print(f"  -> U = {b.u:.3f} W/m2K   (OIB 6 max. {b.anforderung:.2f} -> {status})")
        print(f"  {b.hinweis}")

    f = FENSTER_NEU
    print(f"\n{f['kennung']}  {f['name']}")
    print(f"  -> Uw = {f['uw']:.2f} W/m2K, g = {f['g']:.2f}   "
          f"(OIB 6 max. {f['anforderung']:.2f} -> erfuellt)")
    print(f"  {f['hinweis']}")

    print("\n--- HWB-Abschaetzung ---")
    print(f"  {'Variante':<30}{'U_KD':>8}{'L_ges':>10}{'Heizlast':>11}"
          f"{'HWB [kWh/m2a]':>17}")
    for v in varianten():
        marke = " <-- gewaehlt" if v["gewaehlt"] else ""
        print(f"  {v['name']:<30}{v['u_kd']:>8.3f}{v['l_ges']:>10.1f}"
              f"{v['heizlast']:>9.1f} kW   ca. {v['hwb_min']:.0f}-{v['hwb_max']:.0f}"
              f"{marke}")
    print(f"\n  Zielwert laut Notiz: HWB <= {ZIELWERT_HWB:.0f} kWh/m2a")
    print("  Abschaetzung aus dem Gesamtleitwert - ersetzt den GEQ-Lauf nicht.")


def ausgabe_markdown():
    print("<!-- erzeugt mit u_werte.py - nicht von Hand editieren -->\n")
    print("## Abgleich des Bestandsmodells gegen GEQ\n")
    print("| Bauteil | nachgerechnet U | GEQ U | |")
    print("| --- | ---: | ---: | --- |")
    for b in BESTAND:
        ok = "✓" if abs(b.u - b.u_geq) < 0.006 else "Abweichung"
        print(f"| {b.kennung} — {b.name} | {b.u:.3f} | {b.u_geq:.3f} | {ok} |")
    print("\nDie nachgerechneten Bestands-U-Werte decken sich mit den GEQ-Werten "
          "des EA-alt — das Modell bildet den Bestand korrekt ab.\n")

    print("## Bauteile nach den Maßnahmen\n")
    print("`[neu]` = Schicht laut Notiz, alles andere ist Bestand aus dem EA-alt.\n")
    for b in MASSNAHMEN:
        print(f"### {b.kennung} — {b.name}\n")
        print("| Schicht (von innen nach außen) | d [cm] | λ [W/mK] | R [m²K/W] |")
        print("| --- | ---: | ---: | ---: |")
        for n, d, lam, r in _schichtzeilen(b):
            print(f"| {n} | {d} | {lam} | {r} |")
        print(f"| **R_tot** | | | **{b.r_tot:.3f}** |")
        status = "erfüllt" if b.u <= b.anforderung else "**nicht erfüllt**"
        print(f"\n**U = {b.u:.3f} W/m²K** — OIB-RL 6 Anforderung "
              f"U_max {b.anforderung:.2f} W/m²K: {status}\n")
        print(f"> {b.hinweis}\n")

    f = FENSTER_NEU
    print(f"### {f['kennung']} — {f['name']}\n")
    print(f"**Uw = {f['uw']:.2f} W/m²K**, g = {f['g']:.2f} — OIB-RL 6 Anforderung "
          f"U_max {f['anforderung']:.2f} W/m²K: erfüllt\n")
    print(f"> {f['hinweis']}\n")

    print("## HWB-Abschätzung\n")
    print("| Variante | U Kellerdecke | L_ges [W/K] | Heizlast | HWB_Ref,SK [kWh/m²a] |")
    print("| --- | ---: | ---: | ---: | ---: |")
    print(f"| EA-alt ({EA_ALT['datum']}) | 0,196 | "
          f"{EA_ALT['l_t'] + EA_ALT['l_v']:.1f} | 23,4 kW | {EA_ALT['hwb_ref_sk']:.1f} |")
    print(f"| Variante 2023 (14 cm VWS) | 0,196 | "
          f"{EA_VAR14['l_t'] + EA_VAR14['l_v']:.1f} | 10,5 kW | {EA_VAR14['hwb_ref_sk']:.1f} |")
    for v in varianten():
        marke = " — **gewählt**" if v["gewaehlt"] else ""
        print(f"| **{v['name']}**{marke} | {v['u_kd']:.3f} | "
              f"{v['l_ges']:.1f} | {v['heizlast']:.1f} kW | "
              f"**ca. {v['hwb_min']:.0f}–{v['hwb_max']:.0f}** |")
    print(f"\nZielwert laut Notiz: **HWB ≤ {ZIELWERT_HWB:.0f} kWh/m²a**. "
          "Die Abschätzung interpoliert linear zwischen den beiden vorliegenden "
          "GEQ-Läufen desselben Gebäudes und enthält einen Aufschlag von "
          f"{AUFSCHLAG_G_MIN:.0f}–{AUFSCHLAG_G_MAX:.0f} kWh/m²a für die geringeren "
          "solaren Gewinne der 3-fach-Verglasung. **Sie ersetzt den GEQ-Lauf nicht.**\n")


if __name__ == "__main__":
    if "--markdown" in sys.argv:
        ausgabe_markdown()
    else:
        ausgabe_text()
