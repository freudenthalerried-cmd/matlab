# Raumplan – Weg zu ±1 mm

Ziel und Alleinstellungsmerkmal: **Wandlängen auf ±1 mm**, schnell und einfach aufgenommen, mit einem Prüfprotokoll als Nachweis.
Grundlage dieses Konzepts sind Simulationen mit dem Raytracer in `sim/test_pg.js` (Raum 4,20 × 3,60 m) und eine Fehlerrechnung. **Mit echten Aufnahmen ist noch nichts bestätigt.**

## 1. Was „±1 mm“ heißen soll

- **Messgröße:** Länge einer Wand zwischen den beiden angrenzenden Wandebenen, in Messhöhe ca. 1,3 m (dort kleben die Blätter).
- **Aussage:** In 95 % der Fälle ist die Abweichung ≤ 1 mm, also 1σ ≤ 0,5 mm. Das gilt für Wände bis 5 m.
- **Nicht gemeint:** die Ebenheit der Wand. Altbauwände weichen oft 5–20 mm von einer Ebene ab. Das wird im Protokoll eigens ausgewiesen, z. B. „Wand 2 nicht eben: 7 mm“.
- **Vorschlag für die Werbeaussage:** „Aufmaß auf ±1 mm (95 %), mit Prüfprotokoll zu jeder Messung.“ Erst verwenden, wenn die Feldvalidierung (Abschnitt 6) das bestätigt.

## 2. Was die Simulation zeigt

Die Streuung (1σ) wurde mit Monte-Carlo-Läufen bestimmt: Die gleichen Bilder wurden 10× neu verrauscht und jeweils ausgewertet. „App σ“ ist die Unsicherheit, die die App selbst anzeigt.

| Variante | Auflösung | Streuung 1σ | Bemerkung |
|---|---|---|---|
| 4 Ecken, 1 Blatt/Wand (Stand jetzt) | 1920 px (Video) | ≈ 3,5 mm | App σ 2,7 mm |
| 4 Ecken, 2 Blätter/Wand | 1920 px | ≈ 3,5 mm | bringt bei geraden Wänden kaum etwas |
| Große Marken (2 × 120 mm/Blatt) | 1920 px | App σ 3,6–5,5 mm | bringt nichts |
| Kamera vorab kalibriert | 1920 px | ≈ 3 mm | bringt kaum etwas |
| Planlos herumgehen | 1920 px | bis 14 mm Fehler | **schlecht**, Blätter selten gemeinsam im Bild |
| **8 Standorte** (4 Ecken + 4 Wandmitten) | 1920 px | ≈ 2,2 mm | Geometrie besser |
| **8 Standorte + 6 Bilder von oben auf den Maßstab** | 1920 px | **≈ 1,3 mm** | Maßstab war der größte Fehler |
| 4 Ecken, 1 Blatt/Wand | 3840 px (Foto) | App σ 1,4 mm, Fehler ≤ 0,8 mm | volle Auflösung halbiert den Fehler |
| **8 Standorte + Bilder von oben** | **3840 px** | **≈ 0,7 mm** (95 %: 1,15 mm; 36 von 40 Wänden ≤ 1 mm) | ohne Zusatzrauschen alle Wände ≤ 0,31 mm |

**Ergebnis:** Mit voller Auflösung, 8 Standorten und Bildern von oben auf den Maßstab sind wir in der Simulation bei **≈ 0,7 mm (1σ)**. Das ist bewusst pessimistisch gerechnet, mit zusätzlichem Bildrauschen. Bis zu „±1 mm in 95 % der Fälle“ fehlt noch etwa ein Drittel. Das lässt sich mit mehr Bildern (≈ 100 statt 70), der Live-Genauigkeitsprüfung (4.3) und dem Abbruch erst bei Zielgenauigkeit schließen. In der Praxis kommen Fehler dazu, die die Simulation nicht kennt: Papier, Fokus, Referenzlänge. Deshalb ist die Feldvalidierung (Abschnitt 6) Pflicht, bevor wir „±1 mm“ versprechen.

**Wichtigste Erkenntnisse:**
1. **Der Maßstab ist die größte Fehlerquelle.** In jedem Lauf lagen alle Wände in dieselbe Richtung falsch. Die Bodenblätter am Zollstock werden von weitem sehr flach gesehen. Bilder schräg von oben auf den Maßstab halbieren den Fehler.
2. **Die Aufnahmegeometrie zählt mehr als Markengröße oder Markenzahl.** Feste Standorte mit langem Blick über den Raum, viele Blätter pro Bild.
3. **Volle Fotoauflösung** (ca. 4000 px statt 1920 px Video) halbiert den Fehler.
4. Ein Lauf von zehn ist **grob falsch** ausgegangen. Die App muss solche Fälle selbst erkennen und neu rechnen.

## 3. Fehlerbudget für eine 4-m-Wand (Ziel 1σ ≤ 0,5 mm)

| Fehlerquelle | heute | Ziel | Maßnahme |
|---|---|---|---|
| Länge des Maßstabs | Zollstock Klasse III: bis ±1,4 mm auf 2 m, Gelenkspiel ändert sich bei jedem Aufklappen → bis 2,8 mm auf 4 m | ≤ 0,1 mm auf 2 m | starre Messlatte statt Zollstock, **einmal gemeinsam kalibriert** (4.1) |
| Lage der Blätter an der Latte | ±0,3 mm je Ende → bis 0,8 mm auf 4 m | 0 | fällt weg: die Kalibrierung misst den echten Abstand der Marken |
| Temperatur | Alu: 0,46 mm/2 m bei 10 K | ≤ 0,1 mm | Raumtemperatur eingeben → Korrektur, oder Stahllatte |
| Bildmessung + Geometrie | ≈ 2–3,5 mm | ≤ 0,4 mm | volle Auflösung, Standort-Coach, Bilder von oben auf die Latte (4.2, 4.3) |
| Papier wellig, Kleber | bis 0,3 mm | ≤ 0,1 mm | **selbstklebende Etikettenbögen** (plan, schnell) |
| Autofokus ändert die Brennweite je Bild | unbekannt, bei echten Handys mm-relevant | 0 | Fokus fixieren, Hauptkamera 1×, kein Zoom |
| Grobe Fehlrechnung | 1 von 10 Läufen | erkannt | Prüfungen + automatische Neuberechnung (4.4) |

## 4. Maßnahmen

### 4.1 Gemeinsam kalibrieren (einmalig, ca. 10 Minuten)
1. **Stahlmaßband EG-Klasse I** (5 m) gerade auf einen langen Boden legen, z. B. Gang oder Wohnzimmer.
2. Zwei Kalibrierblätter genau auf **0 cm** und **450 cm** kleben. Dabei mit Lupe auf die Mittelstriche achten.
3. Die Messlatte mit ihren Blättern daneben legen.
4. In der App „Kalibrieren“ wählen und 3× kurz filmen. Zwischen den Durchgängen die Latte etwas verschieben.
5. Die App berechnet:
   - die **echte Länge der Messlatte**, z. B. 1999,62 mm ± 0,05 mm,
   - die **Kamera** (Brennweite, Verzeichnung bei fixiertem Fokus).

   Beides wird gespeichert, dazu ein Kalibrierschein als PDF.
6. **Prüfstrecke:** eine zweite, bekannte Strecke messen. Erst wenn die Abweichung ≤ 0,3 mm ist, gilt das Gerät als freigegeben.
7. **Später:** monatlich oder nach einem Sturz der Latte die Prüfstrecke wiederholen (2 Minuten).

Warum das funktioniert: Die lange, genaue Referenz (4,5 m Stahlband) überträgt ihre Genauigkeit auf die kurze Latte. Ein Klasse-I-Band hat auf 4,5 m höchstens ±0,55 mm Fehler, typischerweise deutlich weniger. Ein Band mit Werkskalibrierschein ist noch genauer. In Österreich kalibriert z. B. das BEV Längenmaße.

### 4.2 Präzisions-Aufnahme mit Standort-Coach
- **Statt „herumgehen“ feste Standorte:** 4 Ecken und 4 Wandmitten. Die App zeigt eine Raumskizze mit dem nächsten Standort („Stell dich in Ecke 2“). Dort schwenkst du langsam, die App macht ca. 5 Bilder.
- **Maßstab von oben:** 6 Bilder schräg von oben auf die Messlatte. Die App fordert sie ausdrücklich an.
- **Volle Auflösung:** Fotos mit ca. 12 MP statt Videobildern. Pro Bild ca. 0,5 s ruhig halten, die App zeigt das mit einem Kreis an.
- **Fokus fix, Zoom 1×:** Die App sperrt den Fokus, sobald das geht.
- **Blätter:** 2 pro Wand (nahe beiden Ecken), gedruckt auf selbstklebende, matte, ablösbare Etiketten. Bei geraden Wänden bringt das zweite Blatt wenig, bei schiefen Altbauwänden ist es nötig, und es macht die Messung robuster.
- **Dauer:** ca. 2–3 Minuten pro Raum (8 Standorte × 15 s + Messlatte).

### 4.3 Rechnen im Hintergrund, während du filmst
- Ein **Web Worker** rechnet nach jeweils ca. 5 neuen Bildern einen vorläufigen Bündelausgleich.
- Daraus kommt die **Live-Genauigkeit je Wand**, die im Coach als Balken erscheint: „Wand 3: ±0,8 mm – noch 2 Bilder von Standort 5“.
- Die Aufnahme ist fertig, wenn **jede Wand ±0,4 mm (1σ)** erreicht. Der Balken springt erst dann auf grün. Im normalen Modus (±3 mm) entsprechend früher.
- Sobald die Aufnahme endet, liegt fast schon das fertige Ergebnis vor, das Warten entfällt weitgehend.

### 4.4 Prüfungen nach der Aufnahme (automatisch)
1. **Feinauswertung:** Marken in voller Auflösung erkennen, Bündelausgleich mit Kalibrierung der Kamera und der Messlatte.
2. **Bootstrap:** 20× mit zufällig weggelassenen Bildern neu rechnen. Daraus kommt die **echte Streuung** statt einer reinen Formel.
3. **Konsistenzprüfungen:**
   - Markenabstände auf jedem Blatt (bekannt aus dem Druck),
   - Blätter eben,
   - Messlatte gerade,
   - erwartete Zahl der Wände,
   - Maßstabsprüfung über die Wandblätter (gibt es schon).
4. **Grobfehler:** Fällt eine Prüfung durch, rechnet die App mit anderen Startwerten neu. Klappt das nicht, sagt sie klar, was nachzufilmen ist.
5. **Siegel:** „±1 mm bestätigt“ erscheint nur, wenn alle Prüfungen bestanden sind. Dann kommen Siegel und **Prüfprotokoll (PDF)** in den Plankopf.

### 4.5 Einfache Bedienung bleibt
- Normalmodus (Zollstock, ±3 mm) und Präzisionsmodus (Messlatte, ±1 mm) als zwei Schalter.
- Der Coach sagt immer genau **einen** nächsten Schritt, mit Skizze des Raums und Standortpunkten.

## 5. Umsetzung in Etappen

| Etappe | Inhalt | Aufwand |
|---|---|---|
| 1 | Präzisions-Aufnahme: volle Auflösung, Fokus fix, Standort-Coach mit Raumskizze, Messlatte von oben, Etiketten-Vorlage 2 Blätter/Wand | mittel |
| 2 | Kalibrier-Assistent: Messlatte + Kamera, Prüfstrecke, Kalibrierschein | mittel |
| 3 | Hintergrund-Worker: Live-Genauigkeit je Wand, Ende bei Zielgenauigkeit | groß |
| 4 | Prüfungen: Bootstrap, Konsistenz, Grobfehler, Neuberechnung, Siegel, Prüfprotokoll | mittel |
| 5 | **Feldvalidierung mit dir:** 3 Räume × 5 Wiederholungen gegen Stahlmaßband Klasse I → Statistik → erst dann die Werbeaussage | dein Zeitaufwand ca. 2 h |

Vorschlag: Etappe 1 + 2 zuerst. Das bringt den größten Gewinn, und du kannst sofort echte Vergleichsmessungen machen.

## 6. Nachweis für die Werbeaussage
- **Feldtest:** Die Referenzmaße nimmst du mit dem Stahlmaßband Klasse I, jede Wand 3× gemessen und gemittelt. Dann jeden Raum 5× mit der App aufnehmen.
- **Ausgewertet werden:** mittlere Abweichung, Streuung, 95-%-Wert. Die Werbeaussage ist nur zulässig, wenn der 95-%-Wert ≤ 1 mm ist.
- **Protokoll aufbewahren:** Damit lässt sich die Aussage gegenüber Kunden und Wettbewerbern belegen.

## 7. Einkaufsliste (ca. 60–90 €)
- Aluminium-Richtlatte 2 m, gerade, mit glatter Seite (ca. 25–40 €). Alternativ eine Stahllatte, die ist weniger temperaturempfindlich.
- Stahlmaßband **EG-Klasse I**, 5 m (ca. 20–30 €), ideal mit Werkskalibrierschein.
- A4-Etiketten, selbstklebend, matt, **ablösbar**, für Laserdrucker (ca. 15 € für 25 Blatt).
- Optional: einfaches Thermometer.

## 8. Offene Fragen
1. Welches Handy genau (Modell)? Davon hängen volle Auflösung, Fokussperre und 4K-Video ab.
2. Sind 2–3 Minuten pro Raum im Präzisionsmodus in Ordnung?
3. Soll der Normalmodus mit dem Zollstock (±3 mm) bleiben?
4. Gibt es einen Ort für die Kalibrierstrecke (mind. 5 m gerader, ebener Boden)?
