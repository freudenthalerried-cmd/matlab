# Raumplan neu: Bodenaufmaß

Stand 09.11.2026, nach Vorgabe von Stefan: **vorerst nur Boden, Zollstock liegt einmal mittig im Raum, kein Umlegen.**
Der Ordner `raumplan/` (altes Filmen) bleibt unverändert.

**Verfahren:** Zollstock mit den 2 Bodenblättern (4 Marken 80 mm, 2000 × 155 mm) mittig im Raum. Je Raumecke ein Foto, das beide Blätter und die Ecke zeigt, am besten von zwei Stellen. Die 16 Markenecken ergeben je Foto die Abbildung Foto → Boden in mm. Alle Fotos liegen im selben Bodensystem, dieselbe Ecke wird automatisch zusammengeführt (unter 25 cm) und nach Unsicherheit gewichtet.

**Dateien:** `core.js` (Erkennung, Abbildung, `roomFromPins`, Prüfungen, ohne DOM), `app.js` (Bedienung), `druck.html` (Blätter), `sim/` (Vergleich, Renderer, Tests).

**Prüfungen:** Der Zollstock muss im Umriss liegen, sonst Warnung. Markenkante muss 80 mm ergeben. Abweichung derselben Ecke zwischen Fotos über 5 cm wird gemeldet.

**Genauigkeit (Simulation):** Zollstock in Raummitte, 8 Fotos, 0,6×: Median ca. 3,5 cm, 90 % ca. 9 cm. Mit 1× passt das Bild nur in rund jedem vierten Raum. Zum Vergleich Zollstock mittig an der Wand, je Wand umgelegt: 6 mm / 19 mm. Der Code dafür ist in der Git-Geschichte (Commit f2db5dc).
**Gerenderte Fotos (2 Räume, 8 Wände, Tippfehler simuliert):** Median 25 mm, Maximum 49 mm.

**Am Handy noch ungetestet:** Live-Kamera, 0,6×-Umschaltung, echte Fotos, Verzeichnung des Weitwinkels. Fälle kommen über „An Claude senden“ als `fall-*.json`.
Test am PC: `index.html?demo=1` braucht Testfotos in `demo/` (nicht im Repo, `sim/render2.py`).
