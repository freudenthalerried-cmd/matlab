# Raumplan – Projektstand (Übergabe)

Stand: 03.11.2026 · Branch `claude/2d-floor-plan-video-0sv7hg`

## Ziel
Handy-Web-App (Android, Chrome, offline-fähig als PWA) für Bestandsgrundrisse und Einreichpläne in Österreich.
Einen Raum in 1–2 Minuten aufmessen, möglichst einfach bedienbar.

## Messmethode (Hauptweg)
- **Maßstab:** Zollstock 2 m mit 2 angeklebten Bodenblättern (Marken 0/2 bei 0 cm, 1/3 bei 200 cm), flach am Boden.
- **Wände:** je Wand ein A4-Blatt mit 4 Codemarken (80 mm), Mitte ca. 1,3 m hoch. Lange oder schiefe Wand → 2. Blatt.
- **Aufnahme:** Raum filmen. Die App nimmt automatisch Bilder aus dem Videostream, sobald das Bild ruhig ist und etwas Neues zeigt.
  Je Blatt ein Fortschrittsbalken (rot/gelb/grün) und Blickrichtung ◀ ● ▶; oben steht der nächste Schritt.
- **Auswertung:** Markenerkennung (Subpixel) → Startwerte → Bündelausgleich mit Selbstkalibrierung → Wände als Ebenen → Raumpolygon mit ±mm je Wand.
  Startet automatisch, bei gutem Ergebnis kommt der Raum automatisch in den Plan.
- **Kontrolle:** 150-mm-Kontrolllinie auf den Blättern (Druckmaßstab). Nach der Auswertung werden die Markenabstände auf den Wandblättern (110/197 mm) mit dem Ergebnis verglichen, Warnung ab 0,5 %.

**Alternative:** AR-Aufmaß ohne Blätter (WebXR/ARCore, `ar.js`). Je Wand 2–4 Punkte → Ausgleichsgerade, Ecken = Schnitt der Wände, Decke → Raumhöhe. Ca. ±1–2 cm.

**Weitere Wege (älter, noch im Code):** manuell mit Boden-Referenzrechteck (Homographie) und Antippen; Gesamtplan aus mehreren Räumen über Verbindungsmarken 90–93.

## Aufbau (`raumplan/`)
| Datei | Inhalt |
|---|---|
| `index.html`, `style.css` | Oberfläche, Reiter 1 Aufnahme · 2 Vermessen · 3 Plan · 4 Einreichung |
| `app.js` | App-Logik, Plan-Editor, Live-Aufnahme mit Coach, Export (PDF/SVG/DXF/CSV/JSON) |
| `guide.js` | Schritt-für-Schritt-Anleitung (beim ersten Start) |
| `marker.js` | Zielmarken: Druck, Erkennung, Subpixel-Ecken (DOM-frei) |
| `pg.js` | Photogrammetrie-Ablauf: Erkennungen → Startwerte → Ausgleich → Wände → Raum |
| `ba.js` | Bündelausgleich (inkl. optionalem Rolling-Shutter-Modell) |
| `ausgleich.js` | Ausgleichsrechnung (Gauß-Newton, Baarda-Test), Bodenentzerrung |
| `ar.js` | AR-Aufmaß (WebXR) |
| `sw.js`, `manifest.json`, `icon.svg` | PWA/Offline-Cache (bei Änderungen `VERSION` in `sw.js` erhöhen) |
| `sim/` | Simulationen und Tests (Node, Python, Playwright) |

## Testergebnisse (nur Simulation!)
| Szenario | Ergebnis |
|---|---|
| Coach-Aufnahme, Fake-Kamera (`sim/e2e_coach.js`), 3 Läufe | 60–80 s, Wände ≤ 6 mm (meist ≤ 1 mm) |
| Blätter-Methode, 4,2 × 3,6 m, 48 Bilder 1920 px | Wandfehler ≤ 1,3 mm |
| Blätter außermittig, 4,6 × 3,3 m | ≤ 8,9 mm |
| Video mit schnellem Schwenk ohne Pausen | ~27 mm (Rolling Shutter) → nur ruhige Bilder |
| Markenerkennung bei Rauschen/Licht/JPEG | ~91 % erkannt; bei starker Unschärfe deutlich weniger |

Tests: `node sim/test_ba.js`, `node sim/test_pg.js`, `node sim/test_pg_geo.js`, `node sim/test_robust.js`, Browser: `node sim/e2e_coach.js` (Playwright).

## Offene Punkte
1. **Test mit echten Handyfotos/-videos fehlt** – wichtigster nächster Schritt (Unschärfe, Rolling Shutter, Licht, echte Kameraoptik).
2. `README.md` ist teilweise veraltet (beschreibt noch Maßband 300 cm statt Zollstock 2 m) → an STAND.md angleichen.
3. Plan-Editor: Fenster, Türen, Wandstärken – Bedienung am Handy prüfen.
4. Export (PDF, SVG, DXF, CSV, JSON) und Plankopf im Praxistest prüfen.
5. Ergebnisse aus dem Brainstorming (separater Chat) hier eintragen und umsetzen.

## Hinweis
Einreichpläne muss in Österreich in der Regel ein Baumeister oder Architekt als Planverfasser unterschreiben.
