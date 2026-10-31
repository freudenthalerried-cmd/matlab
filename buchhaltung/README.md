# Buchhaltung – einfach


![Übersicht](app-pc.png)

Belege sammeln in 5 Rubriken: **Ausgangsrechnungen, Eingangsrechnungen, Private Barbelege, Sonstiges, Bank**.

## Am PC: als App einrichten (einmalig)
1. Python 3 installieren (python.org, beim Setup **„Add python.exe to PATH“** anhaken).
2. Doppelklick auf **`einrichten.bat`**.
   → Symbol **„Buchhaltung“** auf dem Desktop, und die Buchhaltung startet beim Hochfahren still im Hintergrund
   (nötig, damit Handy-Belege und der Rechnungsordner jederzeit übernommen werden).
3. Ab jetzt: Doppelklick aufs Desktop-Symbol → öffnet sich als eigenes App-Fenster (ohne Browser-Leisten).

Alternativ ohne Einrichtung: `start.bat` (mit sichtbarem Konsolenfenster, zum Testen/Fehlersuchen).
Entfernen: die zwei Verknüpfungen „Buchhaltung“ auf dem Desktop und in `shell:startup` löschen.

## Am Handy: als App (Android & iPhone, auch unterwegs) – empfohlen
Über **Tailscale** (kostenlos für Privatnutzer): verbindet Handy und PC verschlüsselt, auch außerhalb des WLANs,
ohne etwas ins Internet freizugeben. Nur deine eigenen Geräte haben Zugriff.
1. Tailscale auf PC und Handy installieren (tailscale.com/download), mit demselben Konto anmelden.
2. Im Tailscale-Adminbereich unter **DNS** „MagicDNS“ und **„HTTPS Certificates“** aktivieren.
3. Am PC einmalig in der Eingabeaufforderung: `tailscale serve --bg 8765`
   → zeigt die Adresse, z. B. `https://mein-pc.tail1234.ts.net`.
4. Diese Adresse am Handy öffnen:
   - **Android (Chrome):** Menü ⋮ → **App installieren**. „Buchhaltung“ erscheint dann auch im **Teilen**-Menü.
   - **iPhone (Safari):** Teilen-Symbol → **Zum Home-Bildschirm**. Für „Teilen → Buchhaltung“ zusätzlich den
     Kurzbefehl unten anlegen (iPhone erlaubt Web-Apps nicht im Teilen-Menü).

Voraussetzung: der PC ist eingeschaltet (Autostart erledigt den Rest).

**Teilen:** Foto/Scan → **Teilen** → **Buchhaltung** → Beleg wird gespeichert, ausgelesen und in die richtige Rubrik
einsortiert; danach öffnet er sich kurz zur Kontrolle.

**iPhone-Kurzbefehl** (einmalig, Kurzbefehle-App → ＋) – danach in **Fotos, Dateien, Mail** unter Teilen:
1. Oben auf den Namen tippen → „An Buchhaltung“; ⓘ → *Im Share-Sheet anzeigen* an, Typen: **Bilder** und **PDFs**.
2. Aktion **Inhalte von URL abrufen**: URL `https://mein-pc.tail1234.ts.net/api/upload?kategorie=auto&name=beleg.jpg`,
   Methode *POST*, Anfragetext *Datei* → **Kurzbefehl-Eingabe**.
3. Optional Aktion **Mitteilung zeigen** „Beleg gespeichert ✓“.
4. Im Teilen-Menü ganz unten *Aktionen bearbeiten* → „An Buchhaltung“ zu den Favoriten (steht dann oben).

Fotos und PDFs gehen mit demselben Kurzbefehl (der Dateityp wird automatisch erkannt). iPhone-Fotos (HEIC) werden
in JPEG umgewandelt, wenn am PC `pip install pillow pillow-heif` installiert ist – sonst in den iPhone-Einstellungen
→ Kamera → Formate → **Maximale Kompatibilität** wählen.

**Android:** In Google Fotos / Galerie → Teilen → **Buchhaltung** (lange drücken → *Anpinnen*, dann steht es oben).

**Ohne Tailscale (nur im Heim-WLAN):** Adresse aus `start.bat` (z. B. `http://192.168.0.20:8765`) verwenden, dem PC im
Router eine feste IP geben und bei Android einmalig in `chrome://flags/#unsafely-treat-insecure-origin-as-secure` diese
Adresse eintragen (sonst lässt Chrome die App nicht installieren).

## Belege erfassen
- **📷 Foto**: öffnet die Handykamera direkt.
- **📄 Datei / Scan**: Scan-Funktion des Handys (PDF/Bild) oder vorhandene Datei wählen.
- Danach öffnet sich das Formular zur Kontrolle. Belege ohne Betrag sind gelb markiert.
- Im Tab **Alle** wird die Rubrik automatisch erkannt (mit KI), in einem bestimmten Tab gilt dieser Tab.

## Automatische Belegerkennung (optional, empfohlen)
Ohne Erkennung musst du Betrag & Co. selbst eintippen. Mit Erkennung liest Claude (KI von Anthropic) aus Foto/PDF:
Rubrik, Datum, Firma, Rechnungsnummer, Bruttobetrag, USt-Satz.
1. `pip install anthropic`
2. API-Key auf https://console.anthropic.com erstellen und in `config.json` bei `"anthropic_api_key"` eintragen.
3. Bei `"eigene_firma"` deinen Namen/Firmennamen eintragen (damit eigene Rechnungen als *Ausgangsrechnung* erkannt werden).

Kosten: ca. 1–2 Cent pro Beleg (Modell in `"ki_modell"`; `claude-haiku-5-5` ist deutlich billiger, aber ungenauer).
Datenschutz: Die Belegbilder werden dafür an Anthropic übertragen.
Im Tab **Alle** wird die Rubrik automatisch erkannt; in einem bestimmten Tab gilt immer dieser Tab.

## Ausgangsrechnungen automatisch übernehmen
Speichere deine am PC erstellte Rechnung (PDF) in den Ordner
`eingang_ordner/ausgangsrechnungen` – sie wird innerhalb von ~10 s automatisch gebucht und die Datei in `daten/belege/` abgelegt.
Den Ordner kannst du in `config.json` ändern (z. B. auf deinen bestehenden Rechnungsordner).
Gleiches gibt es für `eingangsrechnungen`, `barbelege`, `sonstiges` – praktisch, wenn die Handy-Scan-App in einen
OneDrive-/Google-Drive-Ordner speichert, der am PC synchronisiert wird.

Optional: `pip install pypdf` → Rechnungsnummer, Datum und Gesamtbetrag werden aus PDF-Rechnungen automatisch ausgelesen.

## Weitere Funktionen
- **Suche** über Firma, Rechnungsnr., Text und Betrag.
- **Ausgabenart** (Material, Fahrzeug, Energie …) je Beleg – wird mit KI automatisch gesetzt.
- **Überfällige Rechnungen**: Ausgangsrechnungen nach `zahlungsziel_tage` (Standard 14) rot markiert.
- **Bankabgleich**: beim Bank-Import werden Zahlungen automatisch offenen Rechnungen zugeordnet
  (gleicher Betrag, Rechnungsnr. im Buchungstext) und als bezahlt markiert. Button „Zahlungen zuordnen“ im Tab Bank.
- **Auswertung**: Monatsübersicht mit Einnahmen, Ausgaben, USt, Vorsteuer, Zahllast (Basis für die UVA) und Ausgaben nach Art.
- **Duplikat-Warnung** bei gleicher Rechnungsnr. vom gleichen Partner.
- **Export für Steuerberater**: ZIP mit Belegliste (CSV) und allen Belegdateien des Jahres.

## Bank
Tab **Bank** → „Bank-CSV importieren“ (z. B. George-Export). Spalten Datum/Betrag/Text werden automatisch erkannt.

## Daten & Sicherung
- Alles liegt in `daten/` (Datenbank + Belegdateien nach Rubrik/Jahr). **Diesen Ordner regelmäßig sichern** (7 Jahre Aufbewahrungspflicht).
- Gelöschte Belege landen in `daten/papierkorb/`.

Hinweis: kein Passwortschutz – nur im Heim-WLAN oder über Tailscale nutzen, niemals per Portfreigabe ins Internet stellen.
