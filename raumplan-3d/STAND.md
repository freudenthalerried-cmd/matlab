# Raumplan 3D

Stand 22.11.2026, Version 1.5 (nach zweitem Handytest: Aufnahme gegen abweichendes Geräteverhalten abgesichert, erstmals mit WebXR-Attrappe wirklich ausgeführt). Die Version steht oben auf der Startseite. Kopie der Raumplan-App mit echter 3D-Ansicht zum Einrichten. Läuft im Browser (Handy + PC), keine Installation, kein Server nötig.

## Funktionen
- **Ansichten:** 🚶 Gehen (Ich-Perspektive, Wände blockieren, Türen frei), 🏠 Haus (Puppenhaus von schräg oben), ⬛ Plan (Grundriss von oben).
- **Möbel:** 29 Möbel in 7 Kategorien (`moebel.js`), aus Grundkörpern gebaut, keine Modelldateien. Antippen = auswählen, nochmal ziehen = verschieben (PC: direkt ziehen). Drehen 15°/90°, Farbe, Kopie, Löschen. Bilder/Spiegel/Wandregal hängen an der Wand, Pendelleuchten an der Decke, Tischlampe/TV/Pflanze stellen sich auf Möbel darunter.
- **Wände streichen:** 22 Farben + eigene Farbe, je Wandseite oder ganzer Raum. Wände werden an T-Stößen automatisch geteilt, damit jede Wandseite genau einen Raum hat.
- **Boden:** 8 Beläge (Texturen im Browser gezeichnet), je Raum oder alle.
- **Licht:** Tageszeit mit Sonnenstand und Schatten durch die Fenster, Himmelsrichtung, Lampen an/aus (auch einzeln), Helligkeit, Lichtfarbe 2200–6500 K, Belichtung.
- **Einkaufsliste:** Möbel mit Menge, Wandfarbe in m² und Litern (2 Anstriche, 7 m²/l), Boden in m² (+10 % Verschnitt), jeweils mit Amazon-Link.
- **Raum nach Maß:** Länge × Breite × Höhe (Innenmaße, z. B. aus der Raumplan-Messung), Fenster, Tür.
- Rückgängig (40 Schritte), automatisches Speichern im Browser, Projekt als JSON-Datei speichern/öffnen, Foto (PNG).

## Zweiter Handytest und WebXR-Attrappe (1.5)
**Meldung von Stefan (S25, Version 1.4):** „Aufnahme macht keine Fotos“. Wieder ohne Kennzahlen, die Ursache am Gerät ist **nicht bekannt**.
**Neu: `test/xr-attrappe.js`** ersetzt `navigator.xr`, `XRWebGLLayer` und `XRWebGLBinding` und spielt `starteScan`/`starteAufmass` die simulierten Aufnahmen als XR-Bilder vor (Startphase ohne Lage, Bilder ohne Tiefe, Lageverlust mittendrin). Damit läuft der Handy-Code erstmals wirklich (Testläufe in `test/lauf/`, brauchen Playwright und einen Webserver auf Port 8765 im Repo-Stamm, z. B. `python3 -m http.server 8765`).
**Ergebnis:** Bei normgerechtem Verhalten entstehen 210 Aufnahmen und ein richtiges Modell. Der Fehler am S25 kommt also von einer Abweichung des Geräts. Abgesichert und einzeln getestet:
| Abweichung | Verhalten jetzt |
|---|---|
| Tiefenpuffer verkehrt (S25, 05.11.) | Modell richtig |
| Gerät meldet dauerhaft „Position geschätzt“, Lage läuft aber mit | Meldung wird nach 90 Bildern und 25 cm Weg ignoriert, Modell richtig |
| unruhige Hand / niedrige Bildrate | Schwenktempo in °/s statt je Bild; nach 1,5 s ohne Aufnahme wird bis 150 °/s trotzdem aufgenommen |
| `getDepthInMeters` wirft zeitweise | Fehler angezeigt, Aufnahme läuft weiter |
| Tiefe kommt erst nach Sekunden | wartet ohne Last, dann normal |
| kein Kamerazugriff | Modell ohne Fotos, Hinweis |
| nie Tiefendaten / `getDepthInformation` wirft | klare Meldung mit Fehlertext, nach rund 8 s Knopf „📏 Ohne Tiefe: Ecken antippen“ |
| gar keine Position | Meldung „Handy findet seine Position nicht“ |
- Unten in der Aufnahme steht jetzt laufend **„Lage ✓/✗ · Tiefe ✓/✗ · Foto ✓/✗ · n/240“**. Daran sieht man sofort, was fehlt.
- **Ecken-Modus:** lief in der Attrappe zum ersten Mal durch. Gefundener Fehler behoben: Beim Schrittwechsel wurde das Ziel des vorigen Schritts gelesen (`toFixed` von undefined, im schlimmsten Fall Raumhöhe NaN). Fehler in einem Bild halten auch hier die Anzeige nicht mehr an.
**Grenze der Attrappe:** Sie prüft meinen Code, nicht das Handy. Was Chrome am S25 wirklich liefert, zeigt nur die Zeile „Lage/Tiefe/Foto“ bzw. „Letzte Aufnahme“ vom Gerät.

## Erster Handytest und Umbau der Aufnahme (1.4)
**Meldung von Stefan (S25, Version 1.3):** „Orientierung verloren, Handy hängt“. Keine Messdaten dazu.
**Vermutete Ursache (nicht am Gerät bestätigt):** Solange ARCore nach dem Start noch keine Tiefendaten liefert, wurde das volle Tiefenraster (64 × 138 = 8.832 Aufrufe von `getDepthInMeters`) in **jedem Bild** neu abgefragt, weil die Zeitsperre nur nach einer gelungenen Aufnahme griff. Das bremst genau in der Phase, in der sich ARCore orientiert.
**Geändert:**
- Höchstens ein Aufnahmeversuch alle 250 ms, egal ob er gelingt. Vorab 7 Sonden: ist die Tiefe noch leer, wird nichts weiter gerechnet.
- Tiefenraster direkt aus dem Puffer (`data` + `normDepthBufferFromNormView`) statt Einzelabfragen; einmalig an 30 Stellen gegen `getDepthInMeters` geprüft, bei Abweichung gröberes Raster (40 × ~86) mit Einzelabfragen (`leseTiefe`, Test `t7`: 7 statt 8.832 Aufrufe, Abweichung 0 mm).
- Jeder Fehler in einem Bild wird abgefangen und unten angezeigt, die Aufnahme läuft weiter (vorher blieb bei einer Ausnahme das Bild stehen, weil three.js das nächste Bild erst nach dem Rückruf anfordert).
- Leichter zu zeichnen: Bildpuffer halbe Auflösung, grüne Punkte in fester Größe (vorher wegen fehlender Rendergröße nur 1–2 Bildpunkte groß), nur neue Punkte werden zur Grafikkarte geschickt, Kamerabild 320 px.
- Start: „Kamera startet …“ statt sofort „Orientierung verloren“. Die Warnung kommt erst, wenn die Lage nach dem Start länger als 0,7 s fehlt.
- **Kennzahlen jeder Aufnahme** (Dauer, Bilder/s, Anteil ohne Orientierung, Versuche ohne Tiefe, Leseweg, Format, Ausrichtung, Fehler, Ergebnis) stehen danach als Zeile „Letzte Aufnahme …“ unten auf der Startseite und im Fehlerfeld. Bei Problemen diese Zeile schicken lassen.
- Auswertung: Vollbild-Fortschritt mit Balken, Rechnen in Etappen (Seite bleibt bedienbar), je Wandstelle nur die 3 besten Fotos statt aller, Texel 1,5 cm (Wand) / 2 cm (Boden).
**Offen:** ob das Hängen damit weg ist. Nächster Schritt nur anhand der Zeile „Letzte Aufnahme“ oder der Rohdaten.

## Startseite und Projekte (neu in 1.3)
- Beim Öffnen erscheint die Startseite: großer Knopf **„📹 Neues Projekt: Raum aufnehmen“** (startet sofort die AR-Aufnahme, ein Tipp ist wegen der Kamera-Erlaubnis nötig), darunter Ecken antippen, Maße eintippen, Datei öffnen, „Meine Projekte“ (öffnen, löschen mit Rückfrage), Beispielwohnung.
- Jede Aufnahme, jeder Raum nach Maß und jede geöffnete Datei wird ein **eigenes Projekt** (Name „Raum TT.MM.JJJJ“, im Menü umbenennbar). Bestehende Projekte werden nie überschrieben.
- Speicher: Liste `rp3d-liste`, Plan je Projekt `rp3d-p:<id>`, zuletzt offen `rp3d-akt` (localStorage); Fotos und Punktwolke in IndexedDB, beim Löschen mit entfernt. Die eine Planung aus Version 1.0–1.2 (`rp3d-plan`) wird beim ersten Start als Projekt übernommen.
- Ohne AR (PC, iPhone) steht ein Hinweis unter dem Knopf. Zurück zur Startseite: Menü → „🗂 Projekte · Neues Projekt“.
- Abgebrochene oder fehlgeschlagene Aufnahme ohne offenes Projekt führt zurück zur Startseite mit Meldung.
- Testnaht: `window.rp3dTestScan` (Funktion, die einen Roh-Scan liefert) ersetzt in automatischen Tests die Kamera.

## Raum scannen im Durchgehen (neu in 1.2, `scan.js` + `starteScan` in `aufmass.js`)
Startseite → „📹 Neues Projekt: Raum aufnehmen“ (oder Menü → „📹 Raum aufnehmen“). Nur Android + Chrome mit ARCore-Tiefendaten (WebXR `depth-sensing`, Pflicht; `camera-access` freiwillig). Ohne Tiefe: Hinweis und Ecken-Antippen.
- **Aufnahme:** je Aufnahme Kameralage M, Projektion P, Tiefenraster 64×~138 (mm, über `getDepthInMeters`), Kamerabild 400 px. Neue Aufnahme ab 15 cm Bewegung oder 9° Drehung, nur bei ruhigem Handy, höchstens 240. Anzeige: grüne Punkte = erfasst, Raster 12×3 = gefilmte Blickrichtungen (oben/Mitte/unten), Tipps was fehlt. „Fertig“ ab 25 Aufnahmen.
- **Ausrichtung selbst bestimmt** (Lehre aus Feldtest S25 vom 05.11., Tiefenbild-Zeilen verkehrt): 4 Varianten des Tiefenrasters, richtig ist die mit den wenigsten belegten Würfeln (Aufnahmen liegen übereinander); Reserve: bei Blick nach unten liegen die Punkte unter der Kamera. Kopfstehende Kamerabilder werden über die Farbstreuung je Raumstelle erkannt und gedreht.
- **Punktwolke:** ein Punkt je 2,5-cm-Würfel, Lage und Farbe gemittelt, Tiefensprünge (Kanten) und Einzelsichtungen verworfen.
- **Boden/Decke:** stärkste waagrechte Flächen. Ohne klare Decke (Dachschräge) wird die Höhe geschätzt und ein Hinweis gezeigt.
- **Grundriss:** senkrechte Flächen (≥ 5 Höhenstufen à 10 cm je 5-cm-Feld) → Hauptrichtung (schärfste Linien, 0,05°) → Wandlinien je Achse → Felder zwischen den Linien. Ein Feld gehört zum Raum, wenn die Kamera dort war oder ≥ 50 % davon von Sichtstrahlen durchquert wurden und kein raumhohes Wandstück dazwischen liegt. Niedrige Flächen (Sofa, Schrank bis 2,2 m) sperren nicht; ein nicht einsehbares Feld vor einer Wandlinie (bis 1 m tief) zählt als Möbel und gehört zum Raum. Offene Türen: Sturz über der Tür sperrt, durchschrittene Kanten sind offen. Nur rechtwinklige Räume (Wände in zwei Hauptrichtungen); schräge Wände → Ecken antippen.
- **Modell:** Wände/Boden bekommen die Fotos; das Tiefenbild blendet Möbel vor der Fläche aus, nie gesehene Stellen bekommen die mittlere Farbe. Alles, was mehr als 12 cm von Wand und 8 cm von Boden/Decke entfernt im Raum steht (Möbel, Dachschräge), bleibt als farbige Punktwolke („Echte Einrichtung zeigen“ ein/aus). Türen/Fenster werden noch nicht ausgeschnitten, sie sind als Foto auf der Wand zu sehen.
- **Speichern/Teilen:** Projektdatei enthält Fotos und Punktwolke (Testraum 0,6 MB). „📤 Raum teilen“ gibt sie als `.txt` ans Android-Teilen-Menü (Chrome teilt keine `.json`). Datei öffnen stellt alles wieder her.
- **Raum als eigene Kachel (App-Zentrale):** Projektdatei nach `raumplan-3d/raeume/<name>.json` legen, Link `index.html?plan=raeume/<name>.json` (nur eigener Server; eigener Speicherplatz je Link).
- **Fehlersuche:** „🛠 Scan-Rohdaten senden“ liefert alle Aufnahmen klein verpackt (Testraum 6 MB). Diese Datei in der App öffnen = Scan neu auswerten. Erst mit einer echten Rohdatei weiter abstimmen, kein Blindflug.

**Simulation** (`test/synth.js`, `synthRoh`): L-Raum 4,2 × 4,1 m, um 25° verdreht, Schrank, Tisch, Sofa, offene Tür mit Flur, 216 Aufnahmen, Tiefenrauschen 1,2 %. 7 Fälle (normal, ohne Rauschen, 3 % Rauschen, Zeilen verkehrt wie S25, zusätzlich Bild kopf, Tür zu, Dachschräge): immer 6 Wände, größte Abweichung 1,4 cm, Höhe ±0,5 cm, Ausrichtung und Kopfstand richtig erkannt, Rechenzeit rund 2 s am PC. Export → Öffnen auf zweitem Gerät, `?plan=`-Link und Rohdaten-Neuauswertung geprüft.
**Am Handy ungetestet.** Echte Tiefendaten sind viel unruhiger als die Simulation (weiße Wände, Fenster, Spiegel); beim alten Raumplan-Projekt waren ±5–10 cm das Ergebnis. Die Punktwolke sieht aus der Nähe klötzchenhaft aus, fotorealistisch wäre nur Gaussian Splatting am PC (wie Rundgang 3D).

## Aufmessen mit Ecken-Antippen (neu in 1.1, `aufmass.js`)
Menü → „📏 Raum mit Handy-Kamera aufmessen“. Nur Android + Chrome (WebXR/ARCore, „Google Play-Dienste für AR“). iPhone/PC: Hinweis und Eintippen.
1. **Boden suchen:** Handy schräg auf den Boden, bewegen, bis „Boden erkannt“. Bodenhöhe = Median der waagrechten Hit-Test-Treffer, wird laufend verfeinert.
2. **Ecken:** Fadenkreuz auf jede Bodenecke, tippen. Länge zur letzten Ecke live. Nahe der ersten Ecke schließt Tippen den Raum.
3. **Raumhöhe:** Kreuz auf die Deckenecke über einer Bodenecke (Strahl gegen senkrechte Linie durch die Ecke). Überspringen = 2,60 m.
4. **Türen/Fenster:** untere Ecke + schräg gegenüberliegende obere Ecke (Strahl gegen Wandebene).
- Gespeichert werden die **Strahlen**, nicht die Punkte. Am Ende wird mit der endgültigen Bodenhöhe neu geschnitten.
- Nebenbei bis zu 60 **Fotos** (512 px, mit Kameralage M und P), nur wenn das Handy bewegt und dann ruhig gehalten wird.
- Danach: Plan mit Wandachsen um t/2 nach außen versetzt (Innenflächen = gemessene Ecken), längste Wand waagrecht. Fotos werden auf jede Wand und den Boden projiziert (gewichtet nach Blickwinkel und Abstand, bei verwinkelten Räumen mit Verdeckungsprüfung) und als JPEG in IndexedDB gespeichert (Plan merkt sich nur den Schlüssel).
- **Kontrollmaß:** eine Wand mit Maßband/Laser messen, eintragen → ganzer Raum wird gleichmäßig umgerechnet (Handy-Maßstab ±1–2 %). Grenze ±15 %.
- Wand streichen bzw. Boden wechseln ersetzt das Foto dieser Fläche. Fotos ein/aus: Menü → Einstellungen.
- Erwartete Genauigkeit ohne Kontrollmaß ±5–10 cm (Erfahrung Raumplan-Projekt), mit Kontrollmaß rund ±1–2 cm, abhängig davon, wie genau die Ecken angepeilt werden.

**Simulation:** `test/synth.js` erzeugt einen L-Raum mit bekannten Maßen und 54 gerenderten Kamerabildern. Ergebnis: alle 6 Wandlängen und Höhe exakt, Tür/Fenster richtig, Fotos lagegenau (Raster durchgehend), Kontrollmaß +2 % korrekt, Fotos nach Neuladen vorhanden, Rechenzeit 0,6 s.
**Am Handy ungetestet:** AR-Start, Kamerazugriff (`camera-access`), Bildausrichtung, Treffsicherheit der Bodenhöhe, Rechenzeit am S25.

## Affiliate
- Links: `https://www.amazon.de/s?k=<Suchbegriff>&tag=<Partner-ID>` (Suchlinks, keine Preise, weil die sich ändern und Amazon fixe Preise ohne API nicht erlaubt).
- Partner-ID Standard `eprotect-21` in `app.js` (`AFF_DEFAULT`), im Menü änderbar. **Prüfen, ob die ID genau so stimmt.**
- Hinweis „Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.“ steht bei jedem Link.
- Weitere Shops: neue Funktion analog `amazon()` in `app.js`, Suchbegriffe stehen je Möbel als `kw`.

## Planformat (JSON)
```json
{ "name": "…", "height": 2.6, "start": {"x":4,"z":6,"yaw":0},
  "walls": [{"a":[0,0],"b":[10,0],"t":0.3,"open":[{"at":3.8,"w":1.4,"sill":0.9,"h":1.3,"typ":"fenster"}],"colA":"#f3f1ec","colB":"#e4ded2"}],
  "rooms": [{"name":"Wohnküche","poly":[[0,0],[6,0],[6,4.5],[0,4.5]],"floor":"eiche_hell"}],
  "items": [{"cat":"sofa3","x":1.5,"z":3.97,"rot":3.14,"color":"#7a8a99"}],
  "light": {"tod":15,"nord":0,"lamps":false,"level":1,"kelvin":3000,"exposure":1} }
```
Meter, x nach Osten, z nach Süden. Wand = Mittellinie a→b, Stärke t. `at` = Mitte der Öffnung ab Punkt a. Seite A = links in Laufrichtung a→b.
Damit kann ein Export der Raumplan-App direkt geladen werden (nächster Schritt: Export dort einbauen).

## Dateien
`index.html` (Oberfläche), `app.js` (3D, Steuerung, Panels), `aufmass.js` (AR-Sitzungen, Fotoprojektion, Plan aus Aufmaß), `scan.js` (Auswertung des Scans), `test/synth.js` (Simulation), `moebel.js` (Katalog), `daten.js` (Beispielwohnung, Farben, Böden), `lib/three.module.min.js` (three.js 0.160, MIT, lokal, damit es auch ohne CDN läuft).

## Getestet
Headless-Chromium (PC 1280×800 und Pixel 7): Laden ohne Fehler, alle Ansichten, Möbel hinzufügen/drehen/färben, ganzen Raum streichen, Nacht, Einkaufsliste (33 Links), Rückgängig. **Am echten Handy noch ungetestet.** Möbel untereinander kollidieren nicht (bewusst, damit Schieben einfach bleibt).
