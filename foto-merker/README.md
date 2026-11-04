# Foto Merker

Papier fotografieren → Text wird erkannt → automatisch in Rubriken (Rechnung, Vertrag, Garantie, Behörde, Bau …) → später suchen oder fragen.

**Funktionen**
- 📷 Foto aufnehmen (Handykamera) oder 🖼 bestehende Fotos importieren (mehrere auf einmal)
- Datum + GPS-Ort aus Foto-EXIF bzw. aktueller Standort, Ortsname via OpenStreetMap
- Texterkennung lokal am Gerät (Tesseract, Deutsch+Englisch) – Betrag, Datum, Rubrik automatisch
- Erinnerungen (Fristen, Garantieende, Zahlungsziel) + Export als Kalendertermin (.ics)
- Volltextsuche, Filter nach Rubrik
- Optional Claude-KI (eigener API-Schlüssel): bessere Erkennung inkl. Handschrift, Titel/Zusammenfassung, Fragen in normaler Sprache
- Ordneransicht nach Rubrik (mit Anzahl, Absendern, Summe), Unterfilter nach Absender, Liste nach Monat gruppiert
- Zuordnung: gewichtete Schlüsselwörter + Absender-Erkennung; „Zu prüfen"-Ordner für neue Dokumente; lernt aus Korrekturen (Absender → Rubrik)
- Mehrseitige Dokumente (Seiten nachfotografieren), Drehen, Scan-Filter (Papier weiß)
- PDF-Export (einzeln oder ganze Auswahl, z. B. „alle Rechnungen 2026“ für den Steuerberater), Teilen als PDF
- Summen der Beträge nach Jahr/Rubrik, CSV-Export (Excel)
- Wiederkehrende Erinnerungen (monatlich/jährlich, z. B. Pickerl, Versicherung)
- Spracheingabe für Fragen, Duplikat-Erkennung beim Import
- Teilen aus WhatsApp/Mail/Galerie direkt in die App (Android, installierte App)
- Offline-fähig, als App installierbar (PWA), Backup-Export/-Import

**Daten** liegen nur im Browser-Speicher des Geräts → regelmäßig Backup exportieren.

**Nutzung:** Ordner per HTTPS hosten (z. B. GitHub Pages), am Handy öffnen → „Zum Startbildschirm hinzufügen".
