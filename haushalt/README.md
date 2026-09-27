# Wo ist was? – Haushalts-App

Web-App (PWA) zum Aufräumen und Wiederfinden:

1. **📷 Foto**: Raum + Ort (z. B. „Küche“ / „Lade links oben“) wählen, Inhalt fotografieren.
   Die Gegenstände werden per KI-Bilderkennung (Claude Vision) automatisch erkannt – inkl. Synonymen
   (z. B. Klebeband → Tixo). Liste prüfen, ergänzen, speichern.
2. **🔍 Suchen**: Gegenstand eintippen → sofort **Raum → Ort** mit Foto.
3. **🏠 Räume**: Übersicht aller Orte, bearbeiten, neues Foto, löschen.
4. **⚙️ Einstellungen**: eigenen Anthropic-API-Schlüssel eintragen, Sicherung exportieren/importieren.

Alle Daten und Fotos bleiben lokal im Browser (IndexedDB). Am Handy über „Zum Startbildschirm hinzufügen“
wie eine App installierbar. Aufruf: `/haushalt/`.
