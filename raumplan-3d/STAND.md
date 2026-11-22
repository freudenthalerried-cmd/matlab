# Raumplan 3D

Stand 22.11.2026, Version 1.1 (neu: Aufmessen mit Handy-Kamera). Kopie der Raumplan-App mit echter 3D-Ansicht zum Einrichten. Läuft im Browser (Handy + PC), keine Installation, kein Server nötig.

## Funktionen
- **Ansichten:** 🚶 Gehen (Ich-Perspektive, Wände blockieren, Türen frei), 🏠 Haus (Puppenhaus von schräg oben), ⬛ Plan (Grundriss von oben).
- **Möbel:** 29 Möbel in 7 Kategorien (`moebel.js`), aus Grundkörpern gebaut, keine Modelldateien. Antippen = auswählen, nochmal ziehen = verschieben (PC: direkt ziehen). Drehen 15°/90°, Farbe, Kopie, Löschen. Bilder/Spiegel/Wandregal hängen an der Wand, Pendelleuchten an der Decke, Tischlampe/TV/Pflanze stellen sich auf Möbel darunter.
- **Wände streichen:** 22 Farben + eigene Farbe, je Wandseite oder ganzer Raum. Wände werden an T-Stößen automatisch geteilt, damit jede Wandseite genau einen Raum hat.
- **Boden:** 8 Beläge (Texturen im Browser gezeichnet), je Raum oder alle.
- **Licht:** Tageszeit mit Sonnenstand und Schatten durch die Fenster, Himmelsrichtung, Lampen an/aus (auch einzeln), Helligkeit, Lichtfarbe 2200–6500 K, Belichtung.
- **Einkaufsliste:** Möbel mit Menge, Wandfarbe in m² und Litern (2 Anstriche, 7 m²/l), Boden in m² (+10 % Verschnitt), jeweils mit Amazon-Link.
- **Raum nach Maß:** Länge × Breite × Höhe (Innenmaße, z. B. aus der Raumplan-Messung), Fenster, Tür.
- Rückgängig (40 Schritte), automatisches Speichern im Browser, Projekt als JSON-Datei speichern/öffnen, Foto (PNG).

## Aufmessen mit Handy-Kamera (neu in 1.1, `aufmass.js`)
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
`index.html` (Oberfläche), `app.js` (3D, Steuerung, Panels), `aufmass.js` (AR-Aufmaß, Fotoprojektion), `test/synth.js` (Simulation), `moebel.js` (Katalog), `daten.js` (Beispielwohnung, Farben, Böden), `lib/three.module.min.js` (three.js 0.160, MIT, lokal, damit es auch ohne CDN läuft).

## Getestet
Headless-Chromium (PC 1280×800 und Pixel 7): Laden ohne Fehler, alle Ansichten, Möbel hinzufügen/drehen/färben, ganzen Raum streichen, Nacht, Einkaufsliste (33 Links), Rückgängig. **Am echten Handy noch ungetestet.** Möbel untereinander kollidieren nicht (bewusst, damit Schieben einfach bleibt).
