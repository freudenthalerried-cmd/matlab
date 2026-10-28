# Affiliate-Netzwerk – Playbook

10 Vergleiche unter einer Dachdomain (**pikko.at**), ein Generator, Auto-Deploy auf All-Inkl.
Inhalte stehen in `niches/*.json` → `python3 affiliate/build.py` → `affiliate/dist/` (Startseite + `dist/<slug>/`).

**Modus** in `config.json`: `"ordner"` (Standard seit 28.10.2026) = pikko.at/<slug>/, eine Sitemap, eine Domain. `"domains"` = jede Nische auf ihrer eigenen Domain (Feld `domain` in `niches/*.json`).

## 1. Ehrliche Einschätzung (bitte lesen)

| Annahme | Realität |
|---|---|
| 5–10 % Provision | Amazon.de zahlt je Kategorie unterschiedlich, Elektronik oft nur **1–3 %**, Haus & Garten etwas mehr. Aktuelle Gebührentabelle im PartnerNet prüfen. **Mehr Marge:** Hersteller-Programme (z. B. EcoFlow, Anker SOLIX, Bluetti, Zendure, Mähroboter-Marken) über Awin/Impact, dort oft 5–10 %. |
| Einnahmen in 1 Woche | SEO braucht **3–6 Monate**, bis Google neue Domains rankt. Kurzfristig bringen nur Ads und Social Media Besucher. |
| 100 € Ads pro Seite | Rechenbeispiel: 1 € pro Klick, 3 % kaufen, 3 % von 800 € = 24 € Provision → **33 € Kosten pro Verkauf = Verlust**. Ads lohnen sich nur bei günstigen Klicks oder Hersteller-Provisionen ab 5 %. |
| 20 Domains | **Eine Dachdomain** bündelt alle Links und Artikel, statt 10 neue Domains einzeln aufzubauen. Einzelne Nischen-Domains nur später als **301-Weiterleitung** auf pikko.at/<slug>/, keine doppelten Inhalte. |

**Amazon-Pflichten:** Jede Domain und jedes Social-Media-Profil im PartnerNet unter *Konto → Websites und mobile Apps* eintragen. Innerhalb von 180 Tagen 3 qualifizierte Verkäufe, sonst wird das Konto geschlossen. Keine festen Preise und keine Amazon-Produktbilder ohne API anzeigen (ist so umgesetzt). Keine Partnerlinks in E-Mails oder PDFs, daher ist das „E-Book“ als druckbare Checkliste ohne Links gebaut.

## 2. Deine To-dos (einmalig, ca. 1–2 Stunden)

1. **`config.json`**: Amazon-Tracking-ID (`xxx-21`) und Impressum-Adresse eintragen.
2. **All-Inkl**: pikko.at im Members-Bereich bestellen → im KAS unter *Domain → Neue Domain anlegen* auf `/affiliate/` zeigen lassen → SSL (Let's Encrypt) aktivieren.
3. **FTP-Zugang** im KAS anlegen, Verzeichnis **`/affiliate/`** (Zugriff nur auf diesen Ordner) → in GitHub unter *Settings → Secrets → Actions*: `ALLINKL_FTP_HOST`, `ALLINKL_FTP_USER`, `ALLINKL_FTP_PASS`. Danach wird jeder Merge auf `main` automatisch hochgeladen.
4. **Google Search Console** und **Bing Webmaster Tools**: pikko.at hinzufügen, `https://pikko.at/sitemap.xml` einreichen (enthält alle 51 Seiten). Bing ist wichtig, weil ChatGPT-Suche und Copilot auf den Bing-Index zugreifen (GEO).
5. pikko.at im **Amazon PartnerNet** eintragen.

## 3. SEO / GEO – bereits eingebaut

- Kurzantwort-Box ganz oben (wird von KI-Suchen bevorzugt zitiert)
- FAQ-, ItemList- und Article-Schema (JSON-LD), Canonical, Sitemap, robots.txt
- `llms.txt` pro Domain (strukturierte Zusammenfassung für KI-Crawler)
- Interaktiver Rechner + Gratis-Checkliste pro Nische = echter Mehrwert (wichtig für Google-Ads-Freigabe und Backlinks)
- Querverlinkung der Portale untereinander, keine Cookies, keine Tracker (keine Cookie-Banner nötig)

**Erledigt:** 3 Ratgeber-Artikel pro Nische (`artikel/<slug>.json`, 30 Seiten). **Nächster Hebel (Monat 2–3):** weitere Long-Tail-Unterseiten, z. B. „Laser-TV vs. OLED“, „Balkonkraftwerk Speicher Österreich Förderung“, „Mähroboter Hanglage“. Ich kann sie im gleichen Generator ergänzen.

## 4. Google Ads – Startplan (statt 10 × 100 €)

- **Phase 1 (Monat 1):** 3 Portale testen: Balkonkraftwerk-Speicher, Powerstation, Mähroboter (hohe Warenkörbe, Hersteller-Programme verfügbar). Je 100 €, max. CPC 0,40 €.
- Nur **Suchnetzwerk**, Region AT + DE, exakte und Phrase-Keywords mit Kaufabsicht: „balkonkraftwerk speicher vergleich“, „powerstation test 2026“, „mähroboter ohne begrenzungsdraht test“.
- **Verboten (Amazon-Regeln):** auf „Amazon“ oder Tippfehler davon bieten, Anzeigen direkt auf Amazon verlinken.
- Ausschließende Keywords: gebraucht, reparatur, anleitung, pdf, kostenlos, defekt.
- Nach 2 Wochen: Klickrate unter 3 % → Anzeigentext ändern. Kein Verkauf nach 100 € → Kampagne stoppen und Budget umschichten.

## 5. Social Media

Accounts (Telefon-Verifizierung, Identität) musst du selbst anlegen, ich liefere die Inhalte.

- **Pinterest (Priorität 1):** passt am besten zu Affiliate-Vergleichen, Pins ranken monatelang. 1 Konto, 10 Boards (eins pro Nische), 3 Pins pro Woche pro Board. Link auf die eigene Seite, nicht direkt auf Amazon.
- **YouTube Shorts / TikTok:** Rechner-Ergebnisse als 20-Sekunden-Clip („So viel spart ein Balkonkraftwerk mit Speicher wirklich“).
- **Facebook-Gruppen** (Balkonkraftwerk, Pool, BBQ): nur echte Antworten mit Rechner-Link, keine Spam-Posts.

Pin-/Post-Vorlage:
> **[Frage aus der Zielgruppe]?** 🤔 Wir haben [Anzahl] Modelle verglichen und einen kostenlosen [Rechner] gebaut. Ergebnis in 30 Sekunden 👉 [Domain] #[Nische] #Vergleich #Österreich

## 6. Fertige Marketing-Dateien (`affiliate/marketing/`)

- **`pinterest-bulk.csv`** – 40 Pins (4 pro Nische), Bilder liegen nach dem Deploy unter `https://pikko.at/<slug>/pins/*.jpg`. Pinterest → *Erstellen → Pins in großen Mengen erstellen* → CSV hochladen. Vorher die 10 Boards (Namen = Spalte „Pinterest board“) anlegen. Erst hochladen, wenn die Domains online sind.
- **`google-ads-editor.csv`** – Keywords (Phrase), ausschließende Keywords inkl. „amazon“, 8 Anzeigentitel und 3 Beschreibungen pro Nische, Längen geprüft. In Google Ads Editor importieren oder Titel/Beschreibungen in eine responsive Suchanzeige kopieren. Nur die 3 Test-Nischen aus Abschnitt 4 aktivieren.
- Pins neu erzeugen nach Textänderungen: `python3 affiliate/build.py && node affiliate/pins.js && python3 affiliate/build.py`

## 7. Cashback-Portal (Alternative zu Amazon)

Amazon verbietet Cashback. Darum gibt es ein eigenes Portal (`cashback/`, PHP + MySQL), das über **Awin** läuft. Viele Hersteller rechnen dort ab und erlauben teilweise Cashback.

**Ablauf (vollautomatisch):** Kunde registriert sich (E-Mail-Bestätigung) → klickt „Zum Shop mit Cashback“ → seine zufällige Kennung geht als `clickref` an Awin → täglicher Cronjob holt die Verkäufe über die Awin-API → Cashback wird vorgemerkt bzw. nach Bestätigung durch den Shop gutgeschrieben → Kunde wird per E-Mail informiert → Auszahlungsantrag ab 20 € → du bekommst eine E-Mail, überweist und klickst im Admin auf „bezahlt“.

Einzige Handarbeit: die Überweisung selbst. Automatische Auszahlungen habe ich bewusst nicht gebaut. Bei echtem Geld ist die Kontrolle durch dich der Schutz gegen Betrug.

**Einrichten (einmalig, ca. 1 Stunde):**
1. Bei **Awin** als Publisher registrieren (einmalige Kaution von 5 €, wird mit der ersten Auszahlung erstattet). Bei der Anmeldung „Cashback/Loyalty“ als Werbeform angeben und alle Domains eintragen.
2. Bei den Partnerprogrammen der Hersteller bewerben (Kandidaten stehen in `cashback/shops.json`). **In den Programmbedingungen prüfen, ob „Cashback“ erlaubt ist.** Nur dann in `shops.json` `advertiser_id`, `provision_prozent` und `"aktiv": true` setzen.
3. Das Portal liegt automatisch unter `https://pikko.at/cashback/` (keine eigene Domain nötig).
4. KAS → Datenbanken → neue MySQL-DB anlegen → in phpMyAdmin `schema.sql` ausführen.
5. `config.sample.php` als `config.php` ausfüllen (`site_url` = `https://pikko.at/cashback`, `basis` = `/cashback`, DB-Daten, Awin Publisher-ID + API-Token, langen Zufallswert für `cron_key`, Adresse) und per FTP nach `/affiliate/cashback/` hochladen. Diese Datei liegt nie im Git.
6. KAS → Tools → Cronjobs: täglich `https://pikko.at/cashback/cron.php?key=<cron_key>`.
7. In `config.json` `"cashback_aktiv": true` setzen (im Modus `domains` stattdessen `cashback_domain`). Danach zeigen die Vergleichsseiten bei passenden Produkten zusätzlich den Button „Beim Hersteller mit X % Cashback“.
8. Mit `admin_email` registrieren: Dann erscheint im Menü „Admin“.

**Ehrlich:**
- Neue Cashback-Publisher ohne Besucher werden von manchen Händlern abgelehnt. Starte mit den Vergleichsseiten, Cashback ist der Zusatznutzen.
- Bei 50 % Weitergabe bleibt dir die halbe Provision. Dafür kaufen mehr Besucher über deinen Link statt über Shoop, iGraal & Co.
- Ausgezahltes Cashback ist für dich Betriebsausgabe; die Provisionen sind steuerpflichtiges Einkommen. Gewerbeanmeldung und Steuer mit Steuerberater klären, Teilnahmebedingungen vor dem Start rechtlich prüfen lassen.
- Getestet: Registrierung, Bestätigung, Login-Sperre, Passwort-Reset, Klick-Tracking, Awin-Abgleich (mit Test-API), Gutschrift, Auszahlung, Admin. Die echte Awin-API konnte ich ohne Zugangsdaten nicht testen; das Datenformat entspricht der Awin-Dokumentation.

## 8. Vor dem Go-live prüfen

- Produktdaten in `niches/*.json` sind Herstellerangaben (Stand Oktober 2026), Modellnamen und Specs vor dem Launch einmal kontrollieren. Neue Generationen ersetzen alte schnell.
- Impressum ausgefüllt? Amazon-Tag gesetzt? (Der Build warnt sonst.)
