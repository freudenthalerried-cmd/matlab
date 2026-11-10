# Raumplan Versuch

Stand 10.11.2026 (Versuch 5). Versuchs-App mit zwei Varianten, keine Ecken von Hand. Stefan beurteilt das Ergebnis mit „Passt / Passt nicht“ und kann das echte Maß dazuschreiben.
Der Ordner `raumplan/` (altes Filmen mit Tiefendaten) bleibt unverändert.

## Lerntraining (neu, Versuch 5)
Stefan misst die gezeigten Werte nach und trägt das echte Maß ein. Variante 2 zeigt dafür Länge × Breite des Rechtecks als Hauptwert, die Fläche darunter.
- `RP.learnFit` (core.js): aus den Paaren (gemessen, echt) ein fester Versatz als Median, ab 2 Rückmeldungen aktiv. Ab 6 Rückmeldungen mit mindestens 1,5 m Längenunterschied zusätzlich ein Faktor (Theil-Sen, begrenzt auf ±8 %). Paare, die mehr als 25 % + 30 cm danebenliegen, gelten als Fehlmessung und werden nicht gelernt.
- Je Variante getrennt gelernt (`store.lern`, bleibt beim Leeren der Messliste erhalten). „Passt“ ohne Maß zählt den gezeigten Wert als richtig, „Passt nicht“ ohne Maß lehrt nichts.
- Die Korrektur gleicht nur gleichbleibende Fehler aus (z. B. Sockelleiste), keine Fehlmessungen. `fall-*.json` enthält `lern` und je Messung Rohwert, gezeigten Wert und die verwendete Korrektur.

## Variante 1: Wand für Wand, Zollstock mit Blättern
Zollstock liegt mittig im Raum. Jedes Foto mit beiden Blättern wird über die 16 Markenecken auf den Boden umgerechnet (Raster 2 cm). Nur was auf dem Boden liegt, bleibt aus allen Blickwinkeln an derselben Stelle. Aus der gemeinsamen Bodenfläche entsteht der Umriss, die Wand ist die fernste gerade Kante in Blickrichtung. Kern: `viewMap`, `supportMap`, `wallFromViews`.
Gerenderte Fotos mit Möbeln: ab 3 Fotos 2 bis 8 cm Fehler.

## Variante 2: Bodenfläche filmen, ohne Blätter, mit Referenzmaß (neu)
Vorgabe von Stefan: einmal ein Referenzmaß messen (z. B. die Türbreite), daraus die Flächen hochrechnen, zuerst nur die Bodenfläche.
- `ar.js`: WebXR-Sitzung (`immersive-ar`, `camera-access` Pflicht, `hit-test` und `local-floor` freiwillig). Gespeichert werden bis zu 70 Kamerabilder (960 px, grau) mit Kameralage M und Projektion P. **Keine Tiefendaten.** Bodenhöhe aus waagrechten Hit-Test-Treffern (`RP.floorLevel`), sonst `local-floor`.
- Referenz: Handy an das eine Ende halten, tippen, an das andere Ende, tippen. Abstand der zwei Handy-Positionen gegen das echte Maß ergibt den Maßstab `k`.
- `core.js`: `poseHi` (Boden → Bild aus M und P), `viewMapPose`, `accAdd`/`accSupport` (Übereinstimmung über die Bilder), `floorFromAcc` (Umriss über Strahlen von der Mitte, dazu Rechteck aus den vier fernsten deutlichen Kanten), `nccViews` (Gegenprobe, ob das Kamerabild richtig herum steht).

**Simulation** (`sim/render4.py`, `sim/test_ar.js`, 22 Bilder je Raum, gemusterter Boden):
- Raum ohne Sockelleiste: Fläche ±0 bis 2 %, bei 3 cm falscher Bodenhöhe +3,5 %.
- Raum mit 6 cm Sockelleiste: Fläche +5 bis +13 % (je Seite rund 7 cm zu weit außen). Die Oberkante der Leiste wird als Bodenkante gelesen. **Offen.**
- 3 cm Fehler in der Bodenhöhe machen rund 2 % in jeder Länge. Das Referenzmaß gleicht das nicht aus.

**Ungetestet am Handy:** ob Chrome am S25 `camera-access` liefert, die Bildrichtung, die Bodenhöhe, die Rechenzeit (PC 0,3 s je Bild), einfarbige Böden.
Jede Messung enthält in `fall-*.json` alle Bilder (640 px) mit M und P und lässt sich offline nachrechnen. Die Bilder liegen nur bis zum Neuladen im Speicher, also gleich nach dem Messen senden.

Ältere Stände in der Git-Geschichte: Wandfoto f2db5dc, Ecken antippen dc6c116, nur Variante 1 c97f61e.
Test am PC: `index.html?demo=1` braucht Testdaten in `demo/` (nicht im Repo).
