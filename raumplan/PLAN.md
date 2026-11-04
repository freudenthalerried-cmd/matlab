# Raumplan – Umbauplan nach Master-Prompt

## 1. Was schon da ist (Analyse)

Die App ist eine **Web-App (PWA)** und keine Desktop-App. Sie läuft im Browser am Handy (Chrome/Android) und genauso am PC. Alles ist JavaScript ohne Server.

| Bereich | Stand |
|---|---|
| Aufnahme mit Markern | Live-Kamera mit Coach (Balken je Blatt, Richtungshinweise, Auto-Auslösen), Auswertung per Bündelausgleich (`pg.js`, `ba.js`), Selbstkalibrierung f/cx/cy/k1/k2, Plausibilitätsprüfung mit Neuberechnung |
| AR-Aufmaß | WebXR Hit-Test, Wandpunkte antippen → Wandgeraden → Ecken (`ar.js`), ±1–2 cm |
| Manuell | Referenzrechteck, Ecken antippen, Ausgleich von Handmaßen mit Baarda-Test (`ausgleich.js`) |
| Mehrere Räume | über Verbindungsmarken zusammenfügen, Wandstärke automatisch |
| Fenster/Türen | 2 Ecken im Foto antippen → Schnitt mit Wandebene |
| Plan | Editor, Bemaßung, Plankopf, PDF/SVG/DXF/JSON, Aufmaßprotokoll CSV |
| Genauigkeit (Simulation) | Marker: 0,3–2 mm je nach Aufnahme, siehe `KONZEPT-1MM.md` |

**Was fehlt gegenüber dem Master-Prompt:** feste Kameraeinstellungen und geführte Kalibrierung, Kontrollmaße per Sprache und Bluetooth-Laser, eine durchgehende Aufnahme durchs ganze Haus, Kombination von AR-Bewegungsdaten und Photogrammetrie, Variantenvergleich, Flächen nach ÖNORM B 1800, Raumbuch, 3D-Modell.

**Technische Grenzen im Browser:**
- COLMAP, Ceres und Gaussian Splatting laufen nicht im Handy-Browser. Ein schwerer 3D-Rundgang braucht später ein eigenes PC-Programm oder einen Server.
- Der eigene Bündelausgleich in JavaScript reicht für Marker, Kontrollmaße und Ebenen.
- AR-Bewegungsdaten **und** Kamerabilder gleichzeitig gibt es nur über „WebXR Raw Camera Access“ (Chrome Android). Das muss am Gerät geprüft werden.

## 2. Phasen

Nach jeder Phase ist die App lauffähig, und es gibt einen Maßbandtest.

| Phase | Inhalt | Test |
|---|---|---|
| **1 Kamera** | Kalibrier-Assistent mit gedruckter Kalibriertafel (Markerraster statt Schachbrett, siehe unten), Kamera fixieren (Hauptkamera, Fokus fest, Zoom 1×), verwackelte Bilder aussortieren, Kalibrierung in der Auswertung verwenden | Tafel kalibrieren (Restfehler < 0,5 px); danach einen Raum messen und eine Wand mit dem Maßband vergleichen |
| **2 Kontrollmaße** | Kontrollmaße per Sprache („Raumhöhe 2,55“, „Fenster Küche 1,20 breit“), Bluetooth-Laser (Leica DISTO/Bosch GLM über Web Bluetooth, sonst Eingabe von Hand), Zeitstempel, Zuordnung zu Raum/Wand im Bild, Kontrollmaße im Ausgleich | 3 Maße ansagen bzw. lasern → stehen richtig zugeordnet in der Liste; die Abweichung Modell ↔ Kontrollmaß wird angezeigt |
| **3 Ganzes Haus** | eine durchgehende Aufnahme mit Raumwechseln, Live-Rückmeldung je Raum (rot/grün/Haken), Rückkehr zum Startpunkt (Loop Closure), Qualitätscheck vor Ort, Projekt exportieren → am PC auswerten | 2 Räume + Gang in einem Durchgang, Schleife schließen, Schließfehler wird angezeigt |
| **4 AR + Bild** | AR-Posen als Startwerte und Bewegungsdaten im Ausgleich, Laserpunkt im Video erkennen, Ebenen für Wand/Boden/Decke/Schrägen | Variantenvergleich 1–3 gegen Maßband |
| **5 Ergebnisse** | Flächen nach ÖNORM B 1800 mit ±-Angabe, Raumbuch, Messprotokoll mit Kalibrierung und Kontrollmaßen, Vergleich mit hochgeladenem altem Plan | Wohnfläche gegen Handrechnung |
| **6 Schwierige Fälle** | in Wänden statt Räumen denken, Möbel ausblenden, Dachschrägen mit Höhenlinien, Stiege, Fenster/Türen automatisch | Testräume |
| später | ÖNORM A 6240, DWG/IFC, Installationen, Energieausweis, SiGe, 3D-Rundgang | – |

## 3. Phase 1 – Umsetzung

- **Kalibriertafel:** ein A4-Blatt mit 20 Codemarken (4 × 5, je 38 mm). Das ist besser als ein Schachbrett: Jede Marke hat eine eindeutige Nummer, auch Teilansichten sind verwendbar, und die Ecken werden mit Subpixel-Genauigkeit erkannt. Die gedruckte Größe ist für die Kamerawerte egal, ein Druckfehler stört also nicht.
- **Assistent:** Tafel flach auf den Tisch legen und aus verschiedenen Richtungen filmen. Ein 3 × 3-Raster zeigt, welche Bildbereiche schon abgedeckt sind. Die App löst selbst aus, nach 15 Bildern rechnet sie (Zhang-Startwerte + Levenberg-Marquardt) und speichert das Ergebnis.
- **Kamera fixieren:** Rückkamera, Zoom 1×, Fokus fest auf ca. 1,5 m. Das geschieht nur, wenn das Gerät es unterstützt. Die Einstellungen sind für Kalibrierung und Messung identisch.
- **Schärfe:** Jedes Bild bekommt einen Schärfewert. Unscharfe Bilder werden nicht genommen.
- **Auswertung:** Ist eine Kalibrierung vorhanden, werden Brennweite und Verzeichnung festgehalten und auf die Bildgröße umgerechnet.

### Stand Phase 1 (erledigt)
- `calib.js`: Kamera fixieren (`CAM.open`), Schärfewert (`CAM.sharpness`), Kalibriertafel (`CAL.boardSVG`), Kalibrierung (`CAL.solve`: Zhang-Startwerte + Levenberg-Marquardt + Ausreißer)
- Assistent in der App: Einstellungen → „🎯 Kamera kalibrieren“ / „🖨 Kalibriertafel“; Status unter dem Hauptknopf
- Live-Aufnahme: feste Kameraeinstellungen, unscharfe Bilder werden aussortiert; Auswertung nutzt die Kalibrierung (nur bei festem Fokus)
- Tests: `sim/test_calib.js` (f auf 0,03 % genau), `sim/e2e_calib.js` mit Fake-Kamera (f 1499,8 statt 1500 px, Restfehler 0,08 px, ca. 20 s), `sim/e2e_coach.js` weiterhin ok

**Test am Handy:** Kalibriertafel drucken → Einstellungen → „Kamera kalibrieren“ → Tafel auf dem Tisch filmen, bis der Balken voll ist. Danach einen Raum aufnehmen und eine Wand mit dem Maßband vergleichen (einmal mit, einmal ohne Kalibrierung).

### Stand Phase 2 (erledigt)
- `kontroll.js`: Kontrollmaße aus Sprache (Web Speech, de-AT), Bluetooth-Laser (Leica DISTO; Bosch GLM experimentell) und Eingabe von Hand; Zeitstempel, Wand im Bild, Aufnahme-Nummer
- Ansage ohne Zahl („Raumhöhe“) beschreibt die letzte Lasermessung (15 s)
- Karte „📏 Kontrollmaße“ auf der Startseite und Knöpfe 🎤/📏 in der Live-Aufnahme
- Nach der Auswertung: Tabelle Kontrollmaß ↔ Modell mit Abweichung (Wandlänge über Wand im Bild, Raumhöhe, Diagonale); Wandmaße werden als Kontrollmaß im Plan gespeichert, Raumhöhe ohne Deckenmarke wird übernommen
- Tests: `sim/test_kontroll.js` (11/11 Sätze), `sim/e2e_kontroll.js` (Laser während der Aufnahme → Wand 2, Abweichung −1,2 mm ✔)
- Offen für Phase 4: Laserpunkt im Video erkennen, Fenster/Türen zuordnen, Kontrollmaße als Beobachtung im Ausgleich

**Test am Handy:** Raum aufnehmen; während der Aufnahme „🎤 Maß ansagen“ → „Raumhöhe 2,55“; mit dem Laser eine Wand messen, während das Wandblatt im Bild ist. Nach der Auswertung steht unten die Tabelle „Kontrollmaße“ mit der Abweichung. Zum Vergleich dieselbe Wand mit dem Maßband messen.

### Stand Phase 2b (erledigt)
- Marken werden schon während der Aufnahme im Hintergrund erkannt (`detworker.js`, bis 4 Threads) → Plan < 1 s nach der Aufnahme
- Video wird im Hintergrund gesichert (OPFS, 7 Tage), „🔬 Genauer auswerten“ nutzt die ruhigen Videostellen (24–64 s)
- Fotos in voller Sensorauflösung (ImageCapture, z. B. Galaxy S23 4000 × 3000), Fallback Videobild
- Tests: `sim/e2e_speed.js` (Fake-Kamera über http)

## 4. Neue Wünsche – Einschätzung und Reihenfolge

### 4.1 Ohne Marker bzw. nur mit dem Zollstock
| Variante | Machbar? | Erwartete Genauigkeit (4-m-Wand) |
|---|---|---|
| Nur AR (gibt es) | ja | ±1–2 cm |
| AR + Zollstock als Maßstab (beide Enden antippen → Maßstab korrigieren) | ja, klein | ca. ±5–10 mm |
| Zollstock mit 2 Bodenblättern + Wände **ohne** Marken, Auswertung über natürliche Bildmerkmale (Kanten, Steckdosen, Struktur) und Ebenen aus vielen Punkten | nur am PC sinnvoll (COLMAP, BSD-Lizenz) | ca. ±3–10 mm bei strukturierten Wänden, glatte weiße Wände deutlich schlechter |
| Ganz ohne Marker und ohne Maß | Maßstab nur aus AR-Sensorik oder Normmaßen | ca. ±2–5 cm |

**±1 mm ohne Marker ist nach heutigem Stand nicht erreichbar.** Glatte Wände geben der Kamera zu wenig Anhaltspunkte. Ohne Referenz fehlt außerdem der genaue Maßstab.
**Auslagern:** Claude bzw. Sprach-KI eignet sich nicht für Millimeter-Geometrie. Eine **lokale Auswertung am PC** (COLMAP + eigene Ebenenausgleichung, optional KI-Tiefenmodelle wie MASt3R/VGGT) ist möglich. Achtung: Mehrere dieser KI-Modelle sind nur **nicht-kommerziell** lizenziert, das ist für ein Produkt wichtig.
**Vorschlag:** Phase 4a „AR + Zollstock“ (klein) und Phase 4b „PC-Auswertung ohne Wandmarken“ als Versuch, beide gegen Maßband verglichen.

### 4.2 Dachgeschoss, Treppenhaus, Fassade (Phase 6)
- **Dachschrägen:** Ebenen mit Neigung (Blatt auf der Schräge oder AR-Punkte), Schnittlinien mit Wänden, Höhenlinien 1,50 m und 2,00 m, Flächen nach ÖNORM B 1800.
- **Treppenhaus:** Geschoße über durchgehende Aufnahme verbinden, Stufenhöhe/-tiefe gemittelt, Geschoßhöhe.
- **Fassade:** große Blätter (A3) oder Marken auf Platten, Aufnahme von außen mit Abstand, Fenster/Öffnungen in der Fassadenebene, Außenmaße als Kontrollmaße.

### 4.3 App für andere Nutzer (Produkt)
- Eigenes Hosting mit eigener Adresse statt raw.githack (z. B. GitHub Pages oder eigener Server), Versionierung, Updates.
- **Datenschutz (DSGVO):** Videos von Wohnungen sind personenbezogen. Die Auswertung am Gerät ist ein Vorteil. Uploads nur mit Einwilligung, Löschfristen.
- Kalibrierung je Gerät, Gerätetests (Samsung, Pixel, Xiaomi), Hilfe/Videoanleitung, verständliche Fehlermeldungen (läuft schon).
- Haftung: Genauigkeitsangabe mit Prüfprotokoll, klarer Hinweis auf Grenzen.
- Lizenzen aller verwendeten Bausteine prüfen (nur kommerziell nutzbare).

### Simulation Galaxy S23 (Fotos 4000 × 3000, 8 Standorte, 6 Bilder von oben auf den Zollstock, Monte-Carlo mit Zusatzrauschen)
| Blätter je Wand | Streuung (1σ) | 95 % der Wände | ≤ 1 mm |
|---|---|---|---|
| 1 | 0,49 mm | 0,94 mm | 39 von 40 |
| 2 (nahe beiden Ecken) | ≈ 0,25 mm | 0,6 mm | 36 von 36 |

Voraussetzung in der Simulation: Der Abstand der Bodenmarken am Zollstock ist auf ±0,5 mm bekannt. In der Praxis braucht es dafür die einmalige Kalibrierung des Maßstabs bzw. eine starre Messlatte (siehe `KONZEPT-1MM.md`).

### Stand AR + Zollstock (erledigt)
- `ar.js`: Zollstock-Maßstab (Anfang/Ende antippen, mehrere Lagen „↻ Zollstock umgelegt“), automatisches Abtasten (Punkt alle 2 cm), Möbel einseitig aussortieren (liegen vor der Wand), Genauigkeit je Wand, Rohdaten-Export
- Simulation `sim/test_ar.js` (angenommenes ARCore-Modell: 6 mm Rauschen, 1 % Maßstab, 3 mm Drift je Wand, 15 % Möbelpunkte, 5 mm Tippfehler):

| Variante | Fehler rms | 95 % |
|---|---|---|
| Antippen ohne Zollstock | 40 mm | 76 mm |
| Abtasten + Zollstock (1 Lage, 3 Tipps) | 9 mm | 18 mm |
| Abtasten + Zollstock (3 Lagen, 5 Tipps) | 6 mm | 12 mm |
| ohne Drift und Tippfehler (Grenze des Verfahrens) | 2,8 mm | 5,5 mm |

**Test am Handy nötig:** 2–3 Räume mit AR + Zollstock messen, Wände mit dem Maßband nachmessen, AR-Daten exportieren und schicken → Fehlermodell an echte Daten anpassen.
