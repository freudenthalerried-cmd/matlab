# Buchhaltung – einfach


![Übersicht](app-pc.png)

Belege sammeln in 5 Rubriken: **Ausgangsrechnungen, Eingangsrechnungen, Private Barbelege, Sonstiges, Bank**.

## Start
1. Python 3 installieren (python.org, bei Windows „Add to PATH“ anhaken).
2. Doppelklick auf `start.bat` (oder `python server.py`).
3. PC: http://localhost:8765 · Handy (gleiches WLAN): Adresse wird im Fenster angezeigt, z. B. `http://192.168.0.20:8765` → im Handy-Browser „Zum Startbildschirm hinzufügen“.

## Belege erfassen
- **📷 Foto**: öffnet die Handykamera direkt.
- **📄 Datei / Scan**: Scan-Funktion des Handys (z. B. Google Drive / iPhone Notizen-Scan als PDF) oder vorhandene Datei wählen.
- Danach öffnet sich das Formular → Betrag, USt, Partner eintragen → Speichern. Belege ohne Betrag sind gelb markiert.
- Die Rubrik wird vom aktuell gewählten Tab übernommen.

## Ausgangsrechnungen automatisch übernehmen
Speichere deine am PC erstellte Rechnung (PDF) in den Ordner
`eingang_ordner/ausgangsrechnungen` – sie wird innerhalb von ~10 s automatisch gebucht und die Datei in `daten/belege/` abgelegt.
Den Ordner kannst du in `config.json` ändern (z. B. auf deinen bestehenden Rechnungsordner).
Gleiches gibt es für `eingangsrechnungen`, `barbelege`, `sonstiges` – praktisch, wenn die Handy-Scan-App in einen
OneDrive-/Google-Drive-Ordner speichert, der am PC synchronisiert wird.

Optional: `pip install pypdf` → Rechnungsnummer, Datum und Gesamtbetrag werden aus PDF-Rechnungen automatisch ausgelesen.

## Bank
Tab **Bank** → „Bank-CSV importieren“ (z. B. George-Export). Spalten Datum/Betrag/Text werden automatisch erkannt.

## Daten & Sicherung
- Alles liegt in `daten/` (Datenbank + Belegdateien nach Rubrik/Jahr). **Diesen Ordner regelmäßig sichern** (7 Jahre Aufbewahrungspflicht).
- Gelöschte Belege landen in `daten/papierkorb/`.
- **CSV-Export** pro Jahr für Steuerberater/Excel.

Hinweis: kein Passwortschutz – nur im eigenen Heim-WLAN betreiben, nicht ins Internet freigeben.
