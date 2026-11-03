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
