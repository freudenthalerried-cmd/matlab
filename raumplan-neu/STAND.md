# Raumplan neu (Wandfoto)

Neubau vom 09.11.2026. Ersetzt das Filmen mit ARCore-Tiefendaten (Ordner `raumplan/` bleibt unverändert).

**Verfahren:** Zollstock mit den 2 Bodenblättern (4 Marken 80 mm, 2000 × 155 mm) mittig an die Wand legen. Von gegenüber ein Foto, das beide Blätter und beide Ecken zeigt. Die 16 Markenecken ergeben die Abbildung Foto → Boden in mm. Die Wandlänge kommt aus den zwei Ecken im selben Bild.

**Dateien:** `core.js` (Erkennung, Abbildung, Prüfungen, ohne DOM), `app.js` (Bedienung), `druck.html` (Blätter), `sim/` (Vergleich, Renderer, Test).

**Prüfungen:** Wand kürzer als der dort liegende Zollstock wird gemeldet. Markenkante muss 80 mm ergeben. Restfehler der Marken und Unsicherheit je Wand werden geprüft. Gegenüberliegende Wände werden verglichen.

**Vergleich (Simulation, Fehler Wandlänge Median / 90 %):** an der Wand mittig 6 / 19 mm; von der Seite 5 / 15 mm; Zollstock irgendwo an der Wand 8 / 29 mm; Zollstock in Raummitte 28 / 90 mm; Video 1920 px 9 / 27 mm.
**Gerenderte 12-MP-Fotos mit den echten Druckblättern (40 Stück):** alle erkannt, mit richtigen Ecken Median 4,6 mm, 90 % 12,8 mm. Automatische Ecken allein: 28 von 40 unter 1 cm, daher zeigt die App sie immer zum Prüfen.

**Am Handy noch ungetestet:** echte Kamera (getUserMedia/ImageCapture), echte Fotos, Linsenfehler. Fälle kommen über „An Claude senden“ als `fall-*.json`.
Test am PC: `index.html?demo=1` braucht Testfotos in `demo/` (nicht im Repo, Erzeugung mit `sim/render.py`).
