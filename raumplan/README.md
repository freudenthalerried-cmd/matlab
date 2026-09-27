# Raumplan – 2D-Grundriss aus Handyvideo

Browser-App (keine Installation, läuft offline am Handy): `raumplan/index.html` öffnen.

1. **Aufnahme** – Kreppband-Rechteck (z. B. 2,00 × 1,00 m, mit Maßband abgemessen) auf den Boden kleben, Raum filmen, Standbilder übernehmen (oder Fotos laden).
2. **Vermessen** – Ecken A-B-C-D des Rechtecks antippen → perspektivische Entzerrung des Bodens (Homographie). Dann Raumecken am Übergang Wand/Boden antippen → echte Maße in m. „Punkte → neuer Raum“ oder Strecken in die Messliste.
3. **Plan** – Räume verschieben (Fangen an Nachbarräume mit Innenwandstärke), Wandlängen/Winkel/Wandstärken korrigieren, Fenster (FE b/h, BRH), Türen, Durchgänge, Status Bestand/Neu/Abbruch. Schließfehler zeigt Messungenauigkeit.
4. **Einreichung** – Plankopf, Nordpfeil, Maßstab 1:50/100/200, A4–A2, Raumliste mit Nutzfläche. Export PDF (Drucken), SVG, DXF (CAD), Projekt als JSON.

Genauigkeit: nur Punkte **auf dem Boden** messen; Referenz-Rechteck möglichst groß und nahe an den Messpunkten; Kontrollmaß mit dem Maßband empfohlen.

## Genauigkeit (Ziel ±3 mm)

Simulation + Browser-Test (`sim/`), 95%-Fehler je Wandlänge, Raum 4,2 × 3,6 m:

| Variante | 95 % |
|---|---|
| Video 1080p, Kreppband-Rechteck, Tippen | 189 mm |
| Foto 12 MP, Kamera kalibriert | 61 mm |
| + Zusatz-Referenzpunkte + Subpixel-Eckenfang | 13 mm |
| + 3 Fotos per Ausgleich | 6,6 mm (Altbau-Boden ±2 mm: 14 mm) |
| **Maßband 4 Wände + Eckwinkel über Sehne/Diagonalen + Ausgleich** | **Wandlänge ±1,5 mm (1σ), Ecklage ≈ 5 mm** |

Fazit: ±3 mm nur mit Maßband-Längen; Fotos liefern Form, Lage und Kontrolle. Die App
zeigt für jede Wand die erreichte Genauigkeit (±mm) und erkennt Tipp-/Ablesefehler
(Baarda-Test). Gedruckte Zielmarken werden auf ~0,05 px gefunden, Kreppband-Kreuze nicht.

Tests: `node sim/test_ausgleich.js`, `node sim/test_boden.js`, `node sim/test_subpixel.js`,
`node sim/test_kalib.js`, `python3 sim/genauigkeit.py`, Browser: `sim/e2e.js` (Playwright).

## Messregeln für ±3 mm mit Maßband (Altbau, möbliert)

- **Messhöhe einheitlich 1,00 m** (Schnitthöhe des Grundrisses). Altbauwände sind oft 5–10 mm aus dem Lot – am Boden und in 1 m Höhe gemessen ergibt verschiedene Maße.
- **Haken-Spiel vermeiden:** vom Anschlag (Band gegen die Wand gedrückt) messen oder ab der 10-cm-Marke messen und 10 cm abziehen.
- Band straff und gerade: 5 cm Durchhang oder Schräglage auf 4 m ≈ 0,3 mm – unkritisch; ein Knick um ein Möbel dagegen nicht.
- Je Raum **2 Diagonalen** oder **Eckwinkel über Sehne** (Schenkel 1,50 m) an mind. 2 Ecken. Ohne Formmaß ist im Altbau die Ecklage nur ±3–8 cm genau.
- **Wandstärken** an Tür- und Fensterleibungen messen, Räume mit „Nachbarraum anschließen“ verbinden, **Außenmaße** am Gebäude zur Kontrolle.
- Die App meldet Tipp-/Ablesefehler (⚠) – betroffenes Maß nachmessen, nicht löschen.
