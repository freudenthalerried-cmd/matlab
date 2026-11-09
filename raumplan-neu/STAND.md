# Raumplan Versuch

Stand 09.11.2026, Vorgabe von Stefan: **keine Ecken von Hand, Wand für Wand, mehrere Blickwinkel, Möbel dürfen verdecken, es ist eine Versuchs-App.** Sie zeigt die errechnete Wandlänge, Stefan sagt, ob sie passt. Zollstock liegt mittig im Raum.
Der Ordner `raumplan/` (altes Filmen) bleibt unverändert.

**Verfahren:** Jedes Foto mit beiden Blättern wird über die 16 Markenecken auf den Boden umgerechnet (Raster 2 cm). Nur was auf dem Boden liegt, bleibt aus allen Blickwinkeln an derselben Stelle, Möbelkanten und Wände nicht. Aus der gemeinsamen Bodenfläche entsteht der Umriss. Die Wand ist die fernste gerade Kante in Blickrichtung, die Enden sind die Schnittpunkte mit den Seitenwänden. Verdeckte Stücke werden so überbrückt. Kern: `viewMap`, `supportMap`, `wallFromViews` in `core.js`.

**Tests (gerenderte 12-MP-Fotos, 2 Räume mit Möbeln, stark gemusterter Boden):** ab 3 Fotos Fehler 2 bis 8 cm. Mit 2 Fotos einmal über 1 m daneben, darum verlangt die App mindestens 3.

**Ungetestet:** echte Fotos, einfarbige Böden (dort gibt es kaum Bodenkanten, Rückfall auf reine Kanten ist eingebaut, aber nicht geprüft), Live-Kamera und 0,6× am S25. Sockelleisten sind nicht eingerechnet.
Rückmeldung: „Passt / Passt nicht“ und echtes Maß, „An Claude senden“ als `fall-*.json` (Drive „Raumplan-Dev“).
Ältere Stände in der Git-Geschichte: Wandfoto f2db5dc, Ecken antippen dc6c116.
Test am PC: `index.html?demo=1` braucht Testfotos in `demo/` (nicht im Repo, `sim/render3.py`).
