"""Bewertung aller Rezeptvarianten für den Beton-/Geopolymer-Superkondensator.

Halbempirisches Modell aus Literaturtrends (MIT PNAS 2023/2025, Adv. Science 2026,
Constr. Build. Mater. 2025). Es ersetzt keine Messung, sondern legt fest, welche
Varianten zuerst gebaut werden sollen. Alle Koeffizienten stehen oben und sind
als Annahmen gekennzeichnet.
"""
import csv
import itertools
import math

# ---------------- Parameterraum ----------------
BINDER = {  # Dichte g/cm³, Festigkeits-Faktor, CO2 kg/t, Kosten €/kg, pH-Porenlösung vorhanden
    "CEM I (Portland)": dict(rho=3.10, fest=1.00, co2=850, eur=0.20, porenlsg=False, patentfrei=False),
    "CEM III (Hüttensandzement)": dict(rho=2.95, fest=0.90, co2=400, eur=0.18, porenlsg=False, patentfrei=False),
    "Geopolymer (Hüttensand + NaOH/Wasserglas)": dict(rho=2.90, fest=1.10, co2=180, eur=0.30, porenlsg=True, patentfrei=True),
}
RUSS = [3, 5, 8, 10, 12, 15]                       # Gew.-% bezogen auf Bindemittel
DISPERSION = {  # Wirksamkeit (verschiebt Perkolation, erhöht zugängliche Oberfläche), Aufwand
    "Handrühren": dict(eff=0.55, aufwand=0.0),
    "Stabmixer": dict(eff=0.75, aufwand=0.1),
    "Stabmixer + SDS": dict(eff=0.90, aufwand=0.15),
    "Ultraschall + SDS": dict(eff=1.00, aufwand=0.35),
}
ELEKTROLYT = {  # rel. Ionenleitfähigkeit, Spannungsfenster V, Korrosionsschutz 0..1, Auslaufsicher, Kosten-Faktor
    "KCl 1 mol/l": dict(leit=0.80, U=1.0, korr=0.35, gel=False, eur=0.05, nur_geo=False),
    "KCl gesättigt": dict(leit=1.00, U=1.0, korr=0.20, gel=False, eur=0.10, nur_geo=False),
    "KOH 1 mol/l": dict(leit=0.95, U=1.0, korr=0.90, gel=False, eur=0.10, nur_geo=False),
    "Agar-Gel + KCl": dict(leit=0.55, U=1.0, korr=0.35, gel=True, eur=0.08, nur_geo=False),
    "Eigene Porenlösung (ohne Zusatz)": dict(leit=0.60, U=1.0, korr=1.00, gel=True, eur=0.00, nur_geo=True),
}
DICKE = [3, 6, 10]                                 # mm je Elektrode
WB = [0.35, 0.42, 0.50]                            # Wasser/Bindemittel

# ---------------- Modellannahmen ----------------
RHO_RUSS = 1.8          # g/cm³
PERKOLATION = 0.030     # Vol.-Anteil Ruß (MIT 2023: ca. 3 Vol-%)
GEWICHTE = dict(energie=0.35, festigkeit=0.20, korrosion=0.15, selbstentl=0.10, kosten=0.10, co2=0.10)


def volumenanteil_russ(russ_pct, wb, rho_binder):
    v_b = 1.0 / rho_binder
    v_w = wb
    v_c = (russ_pct / 100.0) / RHO_RUSS
    return v_c / (v_b + v_w + v_c)


def bewerte(b, r, d, e, t, wb):
    B, D, E = BINDER[b], DISPERSION[d], ELEKTROLYT[e]
    phi = volumenanteil_russ(r, wb, B["rho"])
    # Leitnetz: Sigmoid um die Perkolationsschwelle, bessere Dispersion senkt die Schwelle
    schwelle = PERKOLATION / (0.7 + 0.3 * D["eff"])
    leitnetz = 1.0 / (1.0 + math.exp(-(phi - schwelle) / 0.006))
    # Zugängliche Oberfläche: Ruß-Anteil × Dispersion, sättigt bei hohem Ruß (Agglomeration)
    oberflaeche = phi * D["eff"] * (1.0 - 0.25 * max(0.0, phi - 0.08) / 0.08)
    # Ionenzugang: mehr Porosität (w/b) und Elektrolytleitfähigkeit; Geopolymer mit eigener Porenlösung durchtränkt
    ionen = E["leit"] * (0.7 + 0.6 * (wb - 0.35))
    if E["nur_geo"] or b.startswith("Geopolymer"):
        ionen *= 1.05
    # Kapazität je Volumen (rel.), Dicke: dicke Elektroden verlieren leicht an Ausnutzung
    ausnutzung = 1.0 / (1.0 + 0.03 * (t - 3))
    kap_vol = leitnetz * oberflaeche * ionen * ausnutzung
    energie = 0.5 * kap_vol * E["U"] ** 2
    # Festigkeit: Ruß und Wasser schwächen, Geopolymer stärker
    festigkeit = B["fest"] * (1.0 - 0.035 * r) * (1.0 - 1.2 * (wb - 0.35))
    festigkeit = max(festigkeit, 0.0)
    # Korrosionsschutz für bewehrte Bauteile
    korrosion = E["korr"] * (1.1 if B["porenlsg"] else 1.0)
    # Selbstentladung: dicker hält länger (MIT 2025), Gel verhindert Austrocknen
    selbstentl = (0.4 + 0.06 * t) * (1.1 if E["gel"] else 1.0)
    # Kosten je Liter Elektrode (grob): Ruß ca. 40 €/kg, Bindemittel, Elektrolyt, Dispergieraufwand
    kosten = 1.6 * (B["eur"] + r / 100.0 * 40.0) + E["eur"] + D["aufwand"]
    co2 = B["co2"]
    return dict(phi=phi, leitnetz=leitnetz, energie=energie, festigkeit=festigkeit,
                korrosion=korrosion, selbstentl=selbstentl, kosten=kosten, co2=co2)


def main():
    varianten = []
    for b, r, d, e, t, wb in itertools.product(BINDER, RUSS, DISPERSION, ELEKTROLYT, DICKE, WB):
        if ELEKTROLYT[e]["nur_geo"] and not BINDER[b]["porenlsg"]:
            continue
        varianten.append(dict(bindemittel=b, russ=r, dispersion=d, elektrolyt=e, dicke=t, wb=wb,
                              **bewerte(b, r, d, e, t, wb)))

    # Normieren 0..1 (Kosten und CO2 umgekehrt) und gewichten
    def norm(key, invers=False):
        vals = [v[key] for v in varianten]
        lo, hi = min(vals), max(vals)
        for v in varianten:
            x = (v[key] - lo) / (hi - lo) if hi > lo else 0.0
            v["n_" + key] = 1.0 - x if invers else x

    for k in ("energie", "festigkeit", "korrosion", "selbstentl"):
        norm(k)
    norm("kosten", invers=True)
    norm("co2", invers=True)
    for v in varianten:
        # K.-o.-Kriterium: ohne durchgehendes Leitnetz speichert die Zelle nichts, egal wie fest oder billig
        v["punkte"] = 100 * sum(GEWICHTE[k] * v["n_" + k] for k in GEWICHTE) * v["leitnetz"]
        v["patentfrei_vermutl"] = "ja" if BINDER[v["bindemittel"]]["patentfrei"] else "nein (EP 3 737 654)"

    varianten.sort(key=lambda v: v["punkte"], reverse=True)
    with open("variantenbewertung_alle.csv", "w", newline="", encoding="utf-8") as f:
        cols = ["rang", "punkte", "bindemittel", "russ", "dispersion", "elektrolyt", "dicke", "wb",
                "phi", "energie", "festigkeit", "korrosion", "selbstentl", "kosten", "co2", "patentfrei_vermutl"]
        w = csv.writer(f, delimiter=";")
        w.writerow(cols)
        for i, v in enumerate(varianten, 1):
            w.writerow([i] + [round(v[c], 4) if isinstance(v[c], float) else v[c] for c in cols[1:]])
    print(f"{len(varianten)} gültige Varianten bewertet")
    for i, v in enumerate(varianten[:10], 1):
        print(f"{i:2d}. {v['punkte']:5.1f}  {v['bindemittel']} | Ruß {v['russ']} % | {v['dispersion']} | "
              f"{v['elektrolyt']} | {v['dicke']} mm | w/b {v['wb']} | φ={v['phi']*100:.1f} Vol-%")
    return varianten


if __name__ == "__main__":
    main()
