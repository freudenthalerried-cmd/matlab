#!/usr/bin/env python3
"""U-Wert-Berechnung der Bauteile Schembera (Zubau + Sanierung Altbau).

Rechenweg nach OENORM EN ISO 6946:
    R_tot = Rsi + sum(d_i / lambda_i) + Rse
    U     = 1 / R_tot

Alle lambda-Werte sind Bemessungswerte in W/(m.K). Werte, die aus der
handschriftlichen Notiz nicht hervorgehen, sind als ANNAHME gekennzeichnet
und muessen vor der GEQ-Eingabe gegen Produktdatenblatt bzw. Bestandsaufnahme
geprueft werden.

Aufruf:  python3 u_werte.py            -> Textausgabe
         python3 u_werte.py --markdown -> Markdown-Tabellen fuer die Doku
"""

import sys

# Waermeuebergangswiderstaende nach EN ISO 6946, Tab. 7
RSI_WAND, RSE_WAND = 0.13, 0.04
RSI_AUF, RSE_AUF = 0.10, 0.04           # Waermestrom aufwaerts (oberste Decke)
RSI_AB, RSE_AB = 0.17, 0.17             # Waermestrom abwaerts, beidseitig innen


class Schicht:
    def __init__(self, name, d_cm, lam, annahme=False):
        self.name = name
        self.d = d_cm / 100.0
        self.lam = lam
        self.annahme = annahme

    @property
    def r(self):
        return self.d / self.lam


class Bauteil:
    def __init__(self, kennung, name, rsi, rse, schichten, r_bestand=None,
                 anforderung=None, hinweis=None):
        self.kennung = kennung
        self.name = name
        self.rsi = rsi
        self.rse = rse
        self.schichten = schichten
        # r_bestand: (Beschreibung, R-Wert) fuer Bestandsaufbauten, die nicht
        # schichtweise bekannt sind (aus U_alt zurueckgerechnet, ohne Rsi/Rse)
        self.r_bestand = r_bestand
        self.anforderung = anforderung
        self.hinweis = hinweis

    @property
    def r_tot(self):
        r = self.rsi + self.rse + sum(s.r for s in self.schichten)
        if self.r_bestand:
            r += self.r_bestand[1]
        return r

    @property
    def u(self):
        return 1.0 / self.r_tot


def r_aus_u_alt(u_alt, rsi, rse):
    """Schichtwiderstand eines Bestandsbauteils aus dessen U-Wert."""
    return 1.0 / u_alt - rsi - rse


# --------------------------------------------------------------------------
# Bauteile laut Notiz
# --------------------------------------------------------------------------

# ANNAHME Bestandswand Altbau: 25 cm Hochlochziegel + beidseitig Putz,
# unsaniert, U_alt = 1,20 W/m2K (typ. Wohnhaus 1960-1980).
U_ALT_AW = 1.20

BAUTEILE = [
    Bauteil(
        "AW-01", "Aussenwand Altbau saniert - Bestand + 18 cm VWS",
        RSI_WAND, RSE_WAND,
        [
            Schicht("EPS-F Vollwaermeschutz 18 cm", 18.0, 0.035, annahme=True),
            Schicht("Klebe-/Armierungsmoertel, Oberputz", 1.0, 0.700, annahme=True),
        ],
        r_bestand=(f"Bestandswand (ANNAHME U_alt = {U_ALT_AW:.2f} W/m2K)",
                   r_aus_u_alt(U_ALT_AW, RSI_WAND, RSE_WAND)),
        anforderung=0.35,
        hinweis="Notiz: '18 VWS Altbau'. U_alt vor Ort bzw. aus EA-alt uebernehmen.",
    ),
    Bauteil(
        "AW-02", "Aussenwand Zubau - 50 cm Ziegel + 5 cm VWS",
        RSI_WAND, RSE_WAND,
        [
            Schicht("Innenputz Kalk-Gips", 1.0, 0.700, annahme=True),
            Schicht("Hochlochziegel-Planziegel 50 cm", 50.0, 0.110, annahme=True),
            Schicht("EPS-F Vollwaermeschutz 5 cm", 5.0, 0.035, annahme=True),
            Schicht("Klebe-/Armierungsmoertel, Oberputz", 1.0, 0.700, annahme=True),
        ],
        anforderung=0.35,
        hinweis="Notiz: 'Zubau 50 + 5 VWS'. lambda des 50er-Ziegels produktabhaengig "
                "(0,07-0,14) - massgeblicher Stellhebel, Datenblatt einsetzen.",
    ),
    Bauteil(
        "KD-01", "Kellerdecke gegen unbeheizten Keller",
        RSI_AB, RSE_AB,
        [
            Schicht("Zementestrich mit FB-Heizung", 6.0, 1.330, annahme=True),
            Schicht("SDPL Trittschalldaemmplatte 3 cm", 3.0, 0.040),
            Schicht("Granulatschuettung gebunden 7 cm", 7.0, 0.080, annahme=True),
            Schicht("Stahlbetondecke 18 cm", 18.0, 2.300, annahme=True),
            Schicht("Daemmung unterseitig 5 cm", 5.0, 0.035, annahme=True),
        ],
        anforderung=0.40,
        hinweis="Notiz: 'Kellerdecke + 5 cm WD zusatz' / 'KG-Decke + 5 cm unten', "
                "'FB = 7 cm Granulat // SDPL 3 cm, Estrich'.",
    ),
    Bauteil(
        "OD-01", "Oberste Geschossdecke / OG-Daemmung - Bestand 22 cm",
        RSI_AUF, RSE_AUF,
        [
            Schicht("Mineralwolle 22 cm (Bestand)", 22.0, 0.040, annahme=True),
            Schicht("Stahlbetondecke 18 cm", 18.0, 2.300, annahme=True),
        ],
        anforderung=0.20,
        hinweis="Notiz: 'OG-Daemmung 22 cm Bestand' - Bestand bleibt, keine Massnahme. "
                "Erfuellt § 38 Oe. BauTG 2013 (U_max 0,20).",
    ),
]

# Fenster werden nicht schichtweise gerechnet - Herstellerwerte
FENSTER = {
    "kennung": "FE-01",
    "name": "Fenster 3-fach verglast, Internorm, mit Rollladen",
    "uw": 0.80,
    "ug": 0.50,
    "g": 0.53,
    "anforderung": 1.40,
    "hinweis": "Notiz: 'Fenster + 3f. Internorm, Rollladen'. Uw je nach Typ "
               "(KF 410 / KF 520 / HF 410) 0,71-0,85 - Werte aus Angebot uebernehmen. "
               "Rollladen in GEQ als temporaerer Waermeschutz bzw. Verschattung erfassen.",
}


def zeilen(b):
    out = []
    out.append((f"Rsi (Waermeuebergang innen)", "", "", f"{b.rsi:.3f}"))
    if b.r_bestand:
        out.append((b.r_bestand[0], "", "", f"{b.r_bestand[1]:.3f}"))
    for s in b.schichten:
        out.append((s.name + (" *" if s.annahme else ""),
                    f"{s.d * 100:.1f}", f"{s.lam:.3f}", f"{s.r:.3f}"))
    out.append((f"Rse (Waermeuebergang aussen)", "", "", f"{b.rse:.3f}"))
    return out


def ausgabe_text():
    print("U-WERTE BAUTEILE SCHEMBERA - nach OENORM EN ISO 6946")
    print("* = Annahme, vor GEQ-Eingabe pruefen\n")
    for b in BAUTEILE:
        print(f"{b.kennung}  {b.name}")
        print(f"  {'Schicht':<48}{'d [cm]':>8}{'lambda':>9}{'R [m2K/W]':>11}")
        for n, d, lam, r in zeilen(b):
            print(f"  {n:<48}{d:>8}{lam:>9}{r:>11}")
        print(f"  {'R_tot':<48}{'':>8}{'':>9}{b.r_tot:>11.3f}")
        print(f"  -> U = {b.u:.3f} W/m2K   (OIB 6 max. {b.anforderung:.2f} -> "
              f"{'erfuellt' if b.u <= b.anforderung else 'NICHT erfuellt'})")
        print(f"  {b.hinweis}\n")
    f = FENSTER
    print(f"{f['kennung']}  {f['name']}")
    print(f"  -> Uw = {f['uw']:.2f} W/m2K, Ug = {f['ug']:.2f}, g = {f['g']:.2f}   "
          f"(OIB 6 max. {f['anforderung']:.2f} -> "
          f"{'erfuellt' if f['uw'] <= f['anforderung'] else 'NICHT erfuellt'})")
    print(f"  {f['hinweis']}")


def ausgabe_markdown():
    print("<!-- erzeugt mit u_werte.py - nicht von Hand editieren -->")
    print("\n`*` = Annahme, vor der GEQ-Eingabe pruefen.\n")
    for b in BAUTEILE:
        print(f"### {b.kennung} — {b.name}\n")
        print("| Schicht (von innen nach aussen) | d [cm] | λ [W/mK] | R [m²K/W] |")
        print("| --- | ---: | ---: | ---: |")
        for n, d, lam, r in zeilen(b):
            print(f"| {n} | {d} | {lam} | {r} |")
        print(f"| **R_tot** | | | **{b.r_tot:.3f}** |")
        status = "erfüllt" if b.u <= b.anforderung else "**nicht erfüllt**"
        print(f"\n**U = {b.u:.3f} W/m²K** — OIB-RL 6 Anforderung "
              f"U_max {b.anforderung:.2f} W/m²K: {status}\n")
        print(f"> {b.hinweis}\n")
    f = FENSTER
    print(f"### {f['kennung']} — {f['name']}\n")
    print(f"**Uw = {f['uw']:.2f} W/m²K**, Ug = {f['ug']:.2f} W/m²K, g = {f['g']:.2f} "
          f"— OIB-RL 6 Anforderung U_max {f['anforderung']:.2f} W/m²K: erfüllt\n")
    print(f"> {f['hinweis']}\n")


if __name__ == "__main__":
    if "--markdown" in sys.argv:
        ausgabe_markdown()
    else:
        ausgabe_text()
