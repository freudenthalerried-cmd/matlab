# Speicherkompass Österreich

Stromspeicher-Rechner für Österreich: Förderung je Bundesland, Ersparnis, Amortisation,
Vergleich von Balkonspeichern, Anleitung zur Anmeldung beim Netzbetreiber.
Start-Anleitung für den Betreiber: `SCHRITTE.md`. Hintergrund: `../geschaeftsidee-speicher-rechner.md`.

## Aufbau
- `src.html`: Arbeitsfassung der Startseite (dient auch als Vorschau)
- `config.json`: Domain, Impressum-Angaben, Partner-IDs
- `build.py`: baut `dist/` (lokale Schriften, Partner-Links, Impressum, Datenschutz, robots.txt, sitemap.xml, .htaccess)
- `assets/fonts/`: Schriften (SIL Open Font License), lokal eingebunden, damit keine Daten an Google gehen
- `../.github/workflows/speicherkompass.yml`: baut bei jedem Push und lädt per FTPS zu All-Inkl hoch,
  sobald die Secrets `SK_FTP_SERVER`, `SK_FTP_USERNAME`, `SK_FTP_PASSWORD` gesetzt sind

```
python3 build.py            # Entwurf
python3 build.py --strict   # wie im Deployment: bricht ab, wenn Impressum-Angaben fehlen
```

## Offen
- [ ] Impressum-Angaben und Domain-Hosting (siehe `SCHRITTE.md`)
- [ ] Partner-IDs (Awin, Amazon)
- [ ] Landesförderungen Wien, Niederösterreich, Steiermark klären
