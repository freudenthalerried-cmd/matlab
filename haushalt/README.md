# Wo ist was? – Haushalts-App

Web-App (PWA) zum Aufräumen und Wiederfinden:

1. **📷 Foto**: Raum + Ort (z. B. „Küche“ / „Lade links oben“) wählen, Inhalt fotografieren.
   Die Gegenstände werden per KI-Bilderkennung (Claude Vision) automatisch erkannt – inkl. Synonymen
   (z. B. Klebeband → Tixo). Liste prüfen, ergänzen, speichern.
2. **🔍 Suchen**: Gegenstand eintippen → sofort **Raum → Ort** mit Foto.
   **⚡ Automatik** (Standard): Foto → erkennen → sofort speichern → Ort zählt weiter (Lade 1 → Lade 2 …).
   Ohne Ortsangabe benennt die KI den Ort (z. B. „Besteckschublade“), ohne Raum schlägt sie den Raum vor.
   **🖼️ Fotos**: mehrere Fotos auf einmal auswählen → werden nacheinander erkannt und nummeriert gespeichert.
   Gleicher Raum + Ort nochmal fotografiert → Inhalt wird ersetzt (nach dem Aufräumen). Jeder Schritt mit „Rückgängig“.
   Ohne Internet / API-Schlüssel wird das Foto gemerkt und später automatisch erkannt.
   **🎥 Filmen**: Kamera langsam über Laden/Regale schwenken. Alle 2,5 s wird ein Bild ausgewertet (nur wenn
   sich das Bild verändert hat → spart Kosten). Jedes Produkt wird einzeln mit **eigenem ausgeschnittenem Foto**
   gespeichert, Doppelte werden zusammengeführt. „➡️ Nächster Ort“ springt zu Lade 2 usw. Alles wird laufend gespeichert.
   **📼 Video**: ein fertig aufgenommenes Video aus der Galerie wird genauso ausgewertet.
3. **🎤 Sprachsuche**, Suche tolerant bei Umlauten (Löffel = Loeffel = Loffel).
4. **🏠 Räume**: Übersicht aller Orte, bearbeiten, neues Foto, löschen.
5. **⚙️ Einstellungen**: eigenen Anthropic-API-Schlüssel eintragen, Sicherung exportieren/importieren.

Alle Daten und Fotos bleiben lokal im Browser (IndexedDB). Am Handy über „Zum Startbildschirm hinzufügen“
wie eine App installierbar. Aufruf: `/haushalt/`.
