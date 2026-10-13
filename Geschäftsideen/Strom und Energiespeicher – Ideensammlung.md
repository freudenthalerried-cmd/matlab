---
title: Strom und Energiespeicher – Ideensammlung
erstellt: 2026-09-26
aktualisiert: 2026-10-13
tags: [geschäftsidee, energie, strom, speicher, patent, lager-enns]
status: ideenphase
quelle: Claude-Chat „Osmosekraftwerk – Strom aus Salz-/Süßwasser-Übergang“
repo: freudenthalerried-cmd/matlab (Branch claude/osmosekraftwerk-selber-bauen-owzhl5, PR #38)
---

# Strom und Energiespeicher – Ideensammlung

## Kurzfassung
- Eine völlig neue, einfache Stromquelle, die „die Menschheit revolutioniert“, gibt es nicht zu finden: Jede Methode wandelt eine vorhandene Energiequelle um, und die großen Quellen sind bekannt.
- Geld liegt in **Speicher-Bauprodukten**, **Nischenanwendungen** und **Stromverkauf auf eigenen Flächen**, nicht in neuer Physik.
- **Beste nächste Schritte** (Stand 28.09.2026):
  1. Landstrom für Kühlauflieger auf der LKW-Parkfläche Enns (Nachfrage abfragen, Elektriker-Angebot)
  2. Geopolymer-Superkondensator in der Werkstatt testen (ca. 160–270 €)
  3. Mini-Schotterspeicher 1 m³ auf der Wiese (ca. 500–950 €)

## Verlauf der Ideen
1. **Osmosekraftwerk** (Salz-/Süßwasser): physikalisch möglich (ca. 0,6–0,7 kWh/m³), aber Membranen teuer, nur Nische. Sole-Variante mit Saline etwas besser. → verworfen
2. **Alle Energiequellen durchgegangen** (Sonne, Wind, Wasser, Wärme, Chemie, Speicher). Ergebnis: Speichern statt Erzeugen ist der Markt.
3. **Sandspeicher / Schotterspeicher im Fundament**: Hochtemperatur-Wärmespeicher (300–450 °C) unter Hallen, geladen mit PV-Überschuss. → eigener Chat „Sandspeicher im Fundament“
4. **Kombinationen ohne Osmose**: Kiesgruben-Kraftwerk, Pumpspeicher im Baggersee, Asphalt-Kollektor, Bauteilaktivierung, Kompostwärme, Kanalwärme.
5. **Beton-Superkondensator** (MIT 2023/2025): Zement + Ruß + Elektrolyt speichert Strom. → Forschungsstand, Patentlage, eigener Ansatz Geopolymer
6. **2.808 Rezeptvarianten** bewertet → Top 10 alle Geopolymer + KOH
7. **1.944 Stromerzeugungs-Kombinationen** bewertet → 3 echte Lücken
8. **Nur testbare Ideen** mit vorhandenen Flächen/Geräten → Top 10 mit Stücklisten und Wirtschaftlichkeit

## Idee A: Beton-/Geopolymer-Superkondensator
- **Prinzip:** Ruß bildet in Zement ein leitendes Netz, mit Elektrolyt entsteht ein Kondensator. MIT 2025: ca. 2 kWh/m³ mit organischem Elektrolyt, 12-V-Modul 50 F.
- **Patent:** EP 3 737 654 (MIT/CNRS) schützt 2–10 % Ruß in **Portlandzement**. Verkauf nur mit Lizenz.
- **Eigener Ansatz:** **Hüttensand-Geopolymer** (Abfall voestalpine Linz) statt Portlandzement. Porenlösung ist schon KOH/NaOH → korrosionsschonend, ca. 80 % weniger CO₂, vermutlich außerhalb des MIT-Patents (Patentanwalt prüfen).
- **Bestes Rezept laut Modell:** Geopolymer, 8–12 % Ruß, SDS als Benetzer, KOH 1 mol/l, Elektrode 10 mm, w/b 0,35.
- **Erster Test:** 9 Zellen (Rang 4, Rang 2, CEM-I-Referenz). Stabmixer + SDS reicht, Ultraschall nicht nötig.
- **Grenze:** Stunden-Puffer für PV, kein Saisonspeicher. Selbstentladung ist das Hauptproblem.
- Dateien: `beton-superkondensator-versuchsreihe.xlsx`, `beton-superkondensator-forschungsstand.md`, `top10-varianten.md`, `variantenbewertung.py`

## Idee B: Schotterspeicher unter der Parkfläche
- PV-Mittagsstrom → Heizstab → Schotter 250–450 °C → abends Wärme per Luft.
- 10 t Schotter ≈ 1 MWh Wärme. 10 × 10 × 1 m ≈ 12 MWh.
- **Neu:** Hochtemperatur-Speicher unter befestigter Fläche (Parkfläche als Deckel) nicht gefunden. Bisher nur Niedertemperatur-Erdsonden unter Parkplätzen.
- **Vorstufe:** Mini-Speicher 1 m³ auf der Wiese (ca. 75 kWh Wärme bei 200 K).
- Siehe auch Chat „Sandspeicher im Fundament“.

## Idee C: Landstrom für Kühlauflieger (Lager Enns)
- Kühlauflieger brauchen **CEE 32 A / 400 V, 5-polig**, im Mittel ca. 3–6 kW.
- Diesel-Aggregat ≈ 78 ct/kWh, Verkauf ≈ 38 ct/kWh → **für den Fahrer halb so teuer**, leise, ohne Abgas.
- 2 Stellplätze: Investition ca. 1.700–3.500 €, Marge ca. 2.200 €/Jahr → **Amortisation ca. 1–1,5 Jahre**.
- Vollelektrische Kühlauflieger kommen (TIP/SolarEdge/Mitsubishi) → Nachfrage steigt.
- Offene Frage: Stromweiterverrechnung an Dritte zulässig oder Pauschale? (Netzbetreiber/WKO)

## Idee D: PV-Carport über LKW-Stellplätzen
- 1.000 m² ≈ 180 kWp ≈ 190 MWh/Jahr. Investition 250.000–320.000 €.
- Amortisation 11–15 Jahre ohne Förderung → **erst später**, wenn Landstrom-Kunden da sind oder Förderung (EAG) passt.

## Echte Lücken aus der großen Suche (1.944 Kombinationen)
- **Deponie-Innenwärme verstromen + Deponiegasertrag verdoppeln** (Wärmeentnahme patentiert US 8,672,586, Kombination nicht gefunden).
- **Thermoakustik-Motor an Industrie-Abwärme** (Zement, Müllverbrennung) – Anwendungspatent möglich.
- **Rechenzentrum-Abwärme verstromen** – Forschung, großer Markt.
- Besetzt: Schlackewärme (voestalpine-Pilot), LKW-Bremsenergie in Fahrbahn (REPS), Brüden-ORC, Schachtförderung.

## Top 10 testbar (endgültige Reihenfolge)
1. Landstrom Kühlauflieger
2. Geopolymer-Superkondensator
3. Mini-Schotterspeicher 1 m³
4. Energiegemeinschaft (PV-Überschuss an Nachbarn)
5. Kompressor-Abwärme für Halle (+ TEG-Experiment)
6. Vertikaler bifazialer PV-Zaun
7. PV-Carport LKW-Plätze
8. Asphalt-/Schotterkollektor 2 × 2 m
9. Parkfläche als Speicherdeckel (nach 3)
10. Kompost-/Hackschnitzel-TEG (nur Experiment)

## To-do
- [ ] LKW-Parker fragen: Kühlauflieger? Mehrpreis für Stellplatz mit Kühlstrom?
- [ ] Elektriker-Angebot 2 × CEE 32 A mit FI + geeichten Zählern
- [ ] Netzbetreiber/WKO: Stromweiterverrechnung oder Pauschale?
- [ ] Material Superkondensator bestellen, 9 Zellen gießen (7 Tage Aushärtung)
- [ ] Mini-Schotterspeicher bauen und messen
- [ ] Vor Patentanmeldung: Recherche Österreichisches Patentamt / Espacenet, Patentanwalt

## Verknüpfungen
- [[Lager Enns]]
- [[Sandspeicher im Fundament]]
- [[Patente]]
