# AbendKino – Fire TV App

Werbefreier Film-Browser für Fire TV (Quelle: öffentliche Eporner-API). Nur Filme ≥ 10 Min., ohne Low-Quality.

## Installieren (Downloader)
URL in Downloader eingeben:

    https://github.com/freudenthalerried-cmd/matlab/releases/download/firetv/AbendKino.apk

Kurzcode: URL unter https://go.aftvnews.com registrieren → Zahlencode für Downloader.
Updates: gleicher Link, einfach drüberinstallieren (gleiche Signatur).

## Bedienung
- OK: abspielen / Pause · ◀ ▶: ±15 s · ▲ ▼: ±2 min · Zurück: Player schließen
- Menü-Taste ☰: Film merken („Meine Liste“)

## Lernfunktion
Tags der angesehenen Filme werden gewichtet (≥ 5 Min. geschaut = +, < 45 s = −, gemerkt = ++),
ältere Vorlieben verblassen langsam. Daraus entstehen „Für dich“ und die Kategorie-Auswahl am Start.
Zurücksetzen unter Einstellungen.

## Build
GitHub Actions (`.github/workflows/firetv-apk.yml`) baut bei jedem Push und aktualisiert das Release `firetv`.
