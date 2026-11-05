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

## Stand 05.11.2026 (Commit e954f8e)
- 2 Reiter (Aufmaß / Ergebnis), Marken-Selbsterkennung, sonst AR-Angebot.
- Ergebnis-Overlay: Skizze, Wandlängen ±mm, Raumhöhe eintragen, „📐 Fenster/Tür“ je Wand (2 Ecken im Foto), Öffnungsliste.
- 🧊 3D-Ansicht (isometrisch, `view3d()` in app.js) mit Fenstern/Türen B/H in cm.
- ✂ Schnitt (05.11.): im Plan „✂ Schnitt“ → 2 Punkte tippen (fängt waagrecht/senkrecht) → Schnittansicht mit Decke/Boden, Wänden, Fenster (BRH/FE-Kette), Tür, RH und lichter Breite kotiert, Ansicht von Öffnungen dahinter; ⇆ Blickrichtung; auch auf PDF-Seite (neben/unter Grundriss) und im DXF (Layer SCHNITT_*). `cutGeom()/cutSVG()` in app.js. Test: `sim/e2e_schnitt.js`.
- Offen: Raumhöhe aus Video, Test am S23/S25, Phasen 3–6 laut PLAN.md.
- Tests: `python3 -m http.server 8766` in raumplan/, dann `NP=/opt/node-tools/node_modules Y4M=<sheets8.y4m> URL=http://127.0.0.1:8766/index.html node sim/e2e_speed.js` (y4m mit `sim/make_y4m.js` erzeugen).
