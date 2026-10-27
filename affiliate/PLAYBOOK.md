# Affiliate-Netzwerk – Playbook

10 Vergleichsportale, ein Generator, Auto-Deploy auf All-Inkl.
Inhalte stehen in `niches/*.json` → `python3 affiliate/build.py` → `affiliate/dist/<slug>/`.

## 1. Ehrliche Einschätzung (bitte lesen)

| Annahme | Realität |
|---|---|
| 5–10 % Provision | Amazon.de zahlt je Kategorie unterschiedlich, Elektronik oft nur **1–3 %**, Haus & Garten etwas mehr. Aktuelle Gebührentabelle im PartnerNet prüfen. **Mehr Marge:** Hersteller-Programme (z. B. EcoFlow, Anker SOLIX, Bluetti, Zendure, Mähroboter-Marken) über Awin/Impact, dort oft 5–10 %. |
| Einnahmen in 1 Woche | SEO braucht **3–6 Monate**, bis Google neue Domains rankt. Kurzfristig bringen nur Ads und Social Media Besucher. |
| 100 € Ads pro Seite | Rechenbeispiel: 1 € pro Klick, 3 % kaufen, 3 % von 800 € = 24 € Provision → **33 € Kosten pro Verkauf = Verlust**. Ads lohnen sich nur bei günstigen Klicks oder Hersteller-Provisionen ab 5 %. |
| 20 Domains | 10 Hauptdomains reichen. Die restlichen 10 nur als **.de-Variante mit 301-Weiterleitung** nutzen, keine doppelten Inhalte (das schadet dem SEO). |

**Amazon-Pflichten:** Jede Domain und jedes Social-Media-Profil im PartnerNet unter *Konto → Websites und mobile Apps* eintragen. Innerhalb von 180 Tagen 3 qualifizierte Verkäufe, sonst wird das Konto geschlossen. Keine festen Preise und keine Amazon-Produktbilder ohne API anzeigen (ist so umgesetzt). Keine Partnerlinks in E-Mails oder PDFs, daher ist das „E-Book“ als druckbare Checkliste ohne Links gebaut.

## 2. Deine To-dos (einmalig, ca. 1–2 Stunden)

1. **`config.json`**: Amazon-Tracking-ID (`xxx-21`) und Impressum-Adresse eintragen.
2. **All-Inkl KAS** → Domains bestellen (Namen in `niches/*.json` → `domain`, frei änderbar) → jede Domain auf den Ordner `/affiliate/<slug>/` zeigen lassen → SSL (Let's Encrypt) aktivieren.
3. **FTP-Zugang** im KAS anlegen → in GitHub unter *Settings → Secrets → Actions*: `ALLINKL_FTP_HOST`, `ALLINKL_FTP_USER`, `ALLINKL_FTP_PASS`. Danach wird jeder Merge auf `main` automatisch hochgeladen.
4. **Google Search Console** und **Bing Webmaster Tools**: Domains hinzufügen, `sitemap.xml` einreichen. Bing ist wichtig, weil ChatGPT-Suche und Copilot auf den Bing-Index zugreifen (GEO).
5. Alle Domains im **Amazon PartnerNet** eintragen.

## 3. SEO / GEO – bereits eingebaut

- Kurzantwort-Box ganz oben (wird von KI-Suchen bevorzugt zitiert)
- FAQ-, ItemList- und Article-Schema (JSON-LD), Canonical, Sitemap, robots.txt
- `llms.txt` pro Domain (strukturierte Zusammenfassung für KI-Crawler)
- Interaktiver Rechner + Gratis-Checkliste pro Nische = echter Mehrwert (wichtig für Google-Ads-Freigabe und Backlinks)
- Querverlinkung der Portale untereinander, keine Cookies, keine Tracker (keine Cookie-Banner nötig)

**Nächster Hebel (Monat 2–3):** Pro Nische 5–10 Long-Tail-Unterseiten, z. B. „Laser-TV vs. OLED“, „Balkonkraftwerk Speicher Österreich Förderung“, „Mähroboter Hanglage“. Ich kann sie im gleichen Generator ergänzen.

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

## 6. Vor dem Go-live prüfen

- Produktdaten in `niches/*.json` sind Herstellerangaben (Stand Oktober 2026), Modellnamen und Specs vor dem Launch einmal kontrollieren. Neue Generationen ersetzen alte schnell.
- Impressum ausgefüllt? Amazon-Tag gesetzt? (Der Build warnt sonst.)
