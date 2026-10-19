# AbendKino – Fire TV App

Werbefreier Film-Browser für Fire TV. Quellen: Eporner, Pornhub, RedTube (öffentliche APIs), gemischt und ohne Duplikate.
Nur Filme ≥ 10 Min. Reihen laden beim Scrollen endlos nach. Quellen einzeln abschaltbar unter Einstellungen.

## Installieren (Downloader)
URL in Downloader eingeben:

    https://github.com/freudenthalerried-cmd/matlab/releases/download/firetv/AbendKino.apk

**Downloader-Code: `5263007`** (bzw. aftv.news/5263007) – zeigt immer auf die neueste Version.

Updates: in der App unter Einstellungen → „Jetzt aktualisieren“ (App prüft beim Start automatisch).
Beim ersten Update einmal „Unbekannte Apps installieren“ für AbendKino erlauben.

## Bedienung
- OK: abspielen / Pause · ◀ ▶: ±15 s · ▲ ▼: ±2 min · Zurück: Player schließen
- Menü-Taste ☰: Film merken („Meine Liste“)

## Lernfunktion
Tags der angesehenen Filme werden gewichtet (≥ 5 Min. geschaut = +, < 45 s = −, gemerkt = ++),
ältere Vorlieben verblassen langsam. Daraus entstehen „Für dich“ und die Kategorie-Auswahl am Start.
Zurücksetzen unter Einstellungen.

## Build
GitHub Actions (`.github/workflows/firetv-apk.yml`) baut bei jedem Push und aktualisiert das Release `firetv`.
