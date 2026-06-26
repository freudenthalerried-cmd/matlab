# Einrichtungskonzept Musterzimmer – Business & Bed OG

Konzept für die hochwertige Möblierung der Kurzzeit-Apartments (gehobenes Klientel),
mit einem Budget-Ziel von **max. 1.000 €** (Bestellung über amazon.de, Lieferung Österreich).

## Inhalt

| Datei | Beschreibung |
|-------|--------------|
| `Business_und_Bed_Einrichtungskonzept.pdf` | Das fertige Konzept (4 Seiten): Vision, Stil/Farbwelt, Grundriss-Skizze, Rezensions-Analyse, abhakbare Amazon-Einkaufsliste, Budget-Aufschlüsselung |
| `konzept.html` | Quelle des PDF (zum Anpassen von Preisen, Artikeln, Links und anschließendem Neu-Rendern) |
| `vorschau.png` | Schnelle Bildvorschau der ersten Seite |

## Eckdaten

- **Stil:** modern & elegant (Boutique-Hotel-Look), warme Neutraltöne mit Holz- und Schwarz-Akzenten
- **Budget:** ≈ 945 € + ~55 € Puffer = rund 1.000 € (45 % Optik · 36 % Funktion · 15 % Bad-Textilien)
- **Vorhanden bleibt:** Betten, Boiler
- **Schwerpunkte:** großer Teppich, XL-Kunstpflanze, Wandbilder, Vorhänge, warmes Licht,
  Vorzimmer (Garderobe/Schuhschrank/Spiegel), Essplatz, Küchen-Starterset, Bad-Textilien

## PDF neu erzeugen (nach Änderungen an `konzept.html`)

```bash
chromium --headless --no-sandbox --disable-gpu \
  --print-to-pdf="Business_und_Bed_Einrichtungskonzept.pdf" \
  --no-pdf-header-footer \
  "file://$PWD/konzept.html"
```

## Hinweise

- Preise und Verfügbarkeit auf amazon.de sind Richtwerte und können schwanken.
- Beim Bestellen jeweils die Variante mit 4+ Sternen und passender Größe/Farbe wählen;
  vor dem Kauf Maße prüfen (Vorhanghöhe, Teppichlänge, Garderobenbreite).
- Original-Zimmerfotos waren bei Erstellung nicht verfügbar – das Layout basiert auf einer
  schematischen Grundriss-Skizze und lässt sich mit echten Fotos/Maßen weiter verfeinern.
