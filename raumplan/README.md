# Raumplan – 2D-Grundriss / Einreichplan aus Fotos oder Video

Browser-App (keine Installation, läuft am Handy): `raumplan/index.html` öffnen.

## A · Automatisch mit Zielmarken – ohne Handmessung (empfohlen, ±1–3 mm)

1. **Marken drucken** (Tab „Aufnahme“ → 🖨): Bodenmarken 0–3, Wandmarken ab 4 (A4, 100 %).
2. **Maßband** am Boden auslegen, Marke 0 mit der Mitte auf 0 cm, Marke 1 auf 300 cm (einziger Maßstab – nichts ablesen). Marken 2, 3 flach auf den Boden (optional zweites Maßband-Paar im Nebenraum).
3. **Wandmarken** glatt an jede Wand kleben, 3–4 je Wand, verschiedene Höhen.
4. **Fotoserie** (am genauesten): in jeder Ecke 8–10 Fotos über den Raum, auch auf die Bodenmarken, ca. 40 Fotos. Oder **Video** mit kurzen Pausen (die App verwendet nur ruhige Momente).
5. **Auswerten** – Markenerkennung (Subpixel), Bündelausgleich mit Selbstkalibrierung der Kamera, Wände als Ebenen durch ihre Marken → Raumpolygon mit ±mm je Wand → in den Plan übernehmen.
   **Fenster/Türen:** je Wand „📐 Öffnung“ → in einem Foto 2 Ecken antippen → Breite, Höhe, Brüstung, Lage (Schnitt mit der Wandebene).
   **Gesamtplan:** je Raum eine eigene Fotoserie; Wandmarken je Raum mit eigenen Nummern („ab Nr.“), Verbindungsmarken 90–93 im Türbereich am Boden in beiden Serien → beim Übernehmen wird der Raum automatisch passgenau angesetzt (robust über RANSAC, Innenwandstärke aus der Messung).
   Mehrere Räume in einem Durchgang (Nummernbereiche je Raum): Wandstärken ergeben sich automatisch.

### Ergebnisse (synthetische Aufnahmen, echte Erkennung + Ausgleich)

| Szenario | Wandfehler |
|---|---|
| Rechteckraum, 48 Fotos 1280×720 | +0,1 / +0,4 / +0,5 / +0,5 mm (±1,1 mm) |
| L-Raum (6 Wände) | ≤ 5,5 mm |
| 2 Räume über Tür | Raum 1 ≤ 4 mm, Raum 2 ≤ 6 mm, Innenwand 117–121 mm (Soll 120), 6 von 8 Läufen; sonst Warnung |
| Video 21 s mit Pausen (Browser, WebM) | 0 bis 7 mm, App zeigt ±8–10 mm (zu wenige Blickpositionen) |
| Video mit Schwenk 30°/s ohne Pausen | 27 mm (Rolling Shutter) → nur ruhige Bilder verwenden |
| 2 Räume aus getrennten Fotoserien (Verbindungsmarken) | Passfehler 0,1–1,6 mm, Raum 2 ≤ 7 mm, Innenwand 117,3–118,6 mm (Soll 120) |
| Raumhöhe über Deckenmarke | 2,5991–2,6021 m (Soll 2,600) |
| Fenster aus 1 Foto (2 Ecken antippen, Browser) | 1,201 × 1,396 m, BRH 0,902, Lage 1,697 (Soll 1,20 × 1,40 / 0,90 / 1,70) |
| Markenerkennung: Rauschen, Licht, Kontrast, JPEG | ~91 % erkannt, Ecken 0,3 px; Unschärfe σ3 px 52 %, Bewegung 7 px 77 % |

Physik dahinter: Handykameras lesen das Bild zeilenweise aus (Rolling Shutter, ~30 ms) – beim Schwenken verzerrt das um viele Pixel. Ein Rolling-Shutter-Modell ist im Bündelausgleich enthalten, ist bei ~4 Marken je Bild aber nicht stabil bestimmbar und daher nur aktiv, wenn es den Bildfehler deutlich senkt.

## B · Manuell (Fotos antippen, Maßband)

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

Tests: `node sim/test_ba.js` (Bündelausgleich, RS), `node sim/test_pg.js` (Raytracing → Erkennung → Ausgleich), `node sim/test_pg_geo.js` (L-Raum, 2 Räume), `sim/e2e_pg.js` (Browser, Fotos/Video), `node sim/test_ausgleich.js`, `node sim/test_boden.js`, `node sim/test_subpixel.js`,
`node sim/test_kalib.js`, `python3 sim/genauigkeit.py`, Browser: `sim/e2e.js` (Playwright).

## Messregeln für ±3 mm mit Maßband (Altbau, möbliert)

- **Messhöhe einheitlich 1,00 m** (Schnitthöhe des Grundrisses). Altbauwände sind oft 5–10 mm aus dem Lot – am Boden und in 1 m Höhe gemessen ergibt verschiedene Maße.
- **Haken-Spiel vermeiden:** vom Anschlag (Band gegen die Wand gedrückt) messen oder ab der 10-cm-Marke messen und 10 cm abziehen.
- Band straff und gerade: 5 cm Durchhang oder Schräglage auf 4 m ≈ 0,3 mm – unkritisch; ein Knick um ein Möbel dagegen nicht.
- Je Raum **2 Diagonalen** oder **Eckwinkel über Sehne** (Schenkel 1,50 m) an mind. 2 Ecken. Ohne Formmaß ist im Altbau die Ecklage nur ±3–8 cm genau.
- **Wandstärken** an Tür- und Fensterleibungen messen, Räume mit „Nachbarraum anschließen“ verbinden, **Außenmaße** am Gebäude zur Kontrolle.
- Die App meldet Tipp-/Ablesefehler (⚠) – betroffenes Maß nachmessen, nicht löschen.
