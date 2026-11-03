# Raumplan – Projektstand

Handy-Web-App (Android, Chrome, offline als PWA) für Bestandsgrundrisse und Einreichpläne (Österreich).
Reines HTML/JS, keine Abhängigkeiten. Branch: `claude/2d-floor-plan-video-0sv7hg`, Draft-PR #32.
Zum Testen am Handy: https://raw.githack.com/freudenthalerried-cmd/matlab/claude/2d-floor-plan-video-0sv7hg/raumplan/index.html

## Messmethoden

| Methode | Ablauf | Genauigkeit (Simulation) |
|---|---|---|
| **Blätter + Filmen** (Hauptweg) | Zollstock 2 m mit 2 angeklebten Bodenblättern (Marken 0+2 bei 0 cm, 1+3 bei 200 cm), je Wand ein A4 mit 4 Marken (80 mm). Raum filmen, App fotografiert selbst, Coach zeigt Fortschritt je Blatt, Auswertung und Übernahme automatisch. | Wände meist ≤ 1–2 mm, max. ~9 mm bei ungünstiger Lage; σ 2,5–9 mm |
| AR-Messung (WebXR/ARCore) | je Wand 2–3 Punkte antippen, Ecken aus Wandgeraden | ca. ±1–2 cm |
| Manuell (Weg B) | Referenzrechteck am Boden, Ecken im Foto antippen, Handmaße mit Ausgleich | je nach Handmaßen |

Noch offen: **Test mit echten Handyaufnahmen**.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html`, `style.css` | Oberfläche: 1 Aufnahme, 2 Vermessen (manuell), 3 Plan, 4 Einreichung; Live-Overlay `#live`, AR-Overlay `#arUI` |
| `app.js` | Hauptlogik: Projekt (localStorage), Live-Aufnahme mit Coach (`liveStart`, `liveCoach`, `liveGroups`), Auswertung (`pgRun`), Übernahme (`pgTake`), Plan-Editor, Export (SVG/PDF/DXF/CSV), Druckvorlagen |
| `guide.js` | Schritt-für-Schritt-Anleitung (beim ersten Start, „? Anleitung“) |
| `marker.js` | Markenwörterbuch (5×5-Code, 100 IDs), Erkennung mit Subpixel-Kanten, Druckvorlagen (`cornerSheetSVG`, `floorSheetSVG`, `sheetSVG`, Kontrolllinie `ctrlSVG`) |
| `pg.js` | Photogrammetrie: Startwerte, Neustarts, Bündelausgleich mit Datum/Maßstab (Zollstock), starre Marken, Wände als Ebenen, Öffnungen, Zusammenfügen mehrerer Räume |
| `ba.js` | Bündelausgleich (Levenberg-Marquardt, Huber, Schur-Komplement, Selbstkalibrierung f/cx/cy/k1/k2, Kovarianz) |
| `ausgleich.js` | Ausgleichsrechnung für Handmaße, Bodenhomographie, k1-Kalibrierung |
| `ar.js` | AR-Aufmaß mit WebXR Hit-Test |
| `sw.js`, `manifest.json` | Offline-Cache (Version bei Änderungen erhöhen) |
| `sim/` | Simulationen und Browser-Tests (Raytracer `test_pg.js`, Fake-Kamera-Tests `e2e_*.js`) |

## Wichtige Tests

- `node sim/test_pg.js` mit `SHEET=0.5 FLOOR2=1 MS=0.08 SD=2 IW=1920 NF=48` – Blatt-Methode, gibt Wandfehler gegen Sollmaß aus.
- `sim/make_y4m.js` erzeugt ein Fake-Kamera-Video, `sim/e2e_coach.js` testet damit die komplette Aufnahme im Browser (Playwright).

## Offene Ideen

Siehe `KONZEPT-1MM.md` (Weg zu 1 mm Genauigkeit).
