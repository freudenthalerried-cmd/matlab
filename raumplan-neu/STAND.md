# Raumplan Versuch

Stand 10.11.2026 (Versuch 6). Versuchs-App mit zwei Varianten, keine Ecken von Hand. Stefan beurteilt das Ergebnis mit „Passt / Passt nicht“ und kann das echte Maß dazuschreiben.
Der Ordner `raumplan/` (altes Filmen mit Tiefendaten) bleibt unverändert.

## Versuch 6: Genauigkeit der Bodenmessung (10.11.2026)
Stefan: zwei, drei Messungen desselben Raums, jedes Mal ein anderes Ergebnis. In Drive kam keine Messdatei an.
- **Senden war kaputt:** Chrome am Handy teilt keine `.json`-Dateien, die Messung landete im Download-Ordner. Jetzt als `fall-*.txt` (Inhalt weiter JSON).
- **Simulation zur Wiederholbarkeit** (`sim/rep_ar.js`, gleicher Raum, mehrere Durchgänge): andere Bildauswahl ±1 cm, Lagefehler ±1 cm / 0,2° ±2 cm, **Bodenhöhe ±2 cm ±5 cm (Spanne bis 19 cm)**. Längenfehler in % ≈ Höhenfehler / Kamerahöhe. Die Bodenhöhe ist der größte Hebel.
- **Neu: Referenzmaß am Boden.** Handy hochkant mit der Unterkante auf den Boden stellen, an beide Enden (am besten Zollstock 200 cm). Bodenhöhe = Kamerahöhe beim Aufsetzen − Linsenhöhe (Vorgabe 118 mm, einstellbar, für das S25 geschätzt). Weicht sie mehr als 8 cm von den Hit-Test-Treffern ab oder liegen die Enden über 4 cm verschieden hoch, gelten die Treffer. Beide Höhen stehen in der Messdatei (`floorTap`, `floorHit`).
- Abgreifen nur bei ruhigem Handy (Mittel aus 0,4 s, Streuung unter 8 mm), Drehung zwischen den Enden über 12° wird abgelehnt (`RP.steadyPos`, `RP.rotAngle`).
- Referenz zählt je nach Länge (`RP.refWeight`: 80 cm 44 %, 2 m 83 %). Annahme dahinter: Handy-Maßstab ±1,5 %, Abgreifen ±13,5 mm. Nicht am Handy geprüft.
- Bildauswahl: neues Bild ab 18 cm oder 10° (vorher 12 cm / 8°), bis 90 Bilder (vorher 70), Hinweis wenn die Grenze erreicht ist.
- **Verworfen nach Test:** Bodenhöhe aus den Bildern selbst (Paarvergleich über die Höhe: nur in einem Testraum und ohne Lagefehler brauchbar) und „jede Stelle nur aus nahen Bildern“ (mit wenigen Bildern Ausfälle, kein Gewinn bei der Höhe).

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
