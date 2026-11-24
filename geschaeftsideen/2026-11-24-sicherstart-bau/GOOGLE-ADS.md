# Google Ads für Sicherstart Bau

Die Website misst Conversions (Bestellung, Demo-Anfrage) mit Google Ads, aber erst nach Zustimmung im Cookie-Banner.
Ohne Eintrag in `site/config.js` lädt die Seite nichts von Google.

## 1. Conversion-Tracking verbinden

1. Google-Ads-Konto anlegen (ads.google.com), Abrechnung hinterlegen.
2. Ziele → Conversions → **Neue Conversion-Aktion** → Website → manuell einrichten:
   - Aktion „Bestellung“: Kategorie *Kauf*, Wert *für jede Conversion unterschiedlich*, Zählung *Jede*.
   - Aktion „Demo-Anfrage“: Kategorie *Lead-Formular senden*, Wert *keinen Wert verwenden*, Zählung *Eine*.
3. Bei „Tag einrichten“ → „Selbst installieren“: aus dem Code die **Conversion-ID** (`AW-…`) und je Aktion das **Conversion-Label** kopieren.
4. In `site/config.js` eintragen:
   ```js
   googleAds: { id: "AW-123456789", bestellung: "AbCdEf…", anfrage: "GhIjKl…" }
   ```
5. Neu deployen, Seite öffnen, Cookie-Banner akzeptieren, Testanfrage senden. In Google Ads erscheint die Conversion nach einigen Stunden.

## 2. Kampagne „Sicherstart Bau – Suche AT“ (Vorschlag)

| Einstellung | Wert |
|---|---|
| Typ | Suchnetzwerk, ohne Displaynetzwerk und Suchpartner |
| Standort | Österreich (Personen, die sich dort befinden) |
| Sprache | Deutsch |
| Budget | 20 € pro Tag zum Start, nach 4 Wochen anhand der Kosten pro Anfrage anpassen |
| Gebotsstrategie | zuerst „Klicks maximieren“ mit max. CPC 2,50 €, ab etwa 30 Conversions auf „Conversions maximieren“ wechseln |
| Werbezeiten | Mo–Fr 6–19 Uhr (Bauleiter und Poliere suchen werktags) |
| Zielseite | Startseite, Anzeigengruppe BauKG optional auf `#unterlagen` |

Anzeigengruppen, Keywords (Phrase und Exact) und negative Keywords stehen in `google-ads/keywords.csv`.
Responsive Suchanzeigen (15 Titel, 4 Beschreibungen, Zeichenlimits geprüft) stehen in `google-ads/anzeigen.csv`.
Beide Dateien lassen sich im **Google Ads Editor** über „Konto → Importieren → Aus Datei“ einlesen. Vorher `IHRE-DOMAIN.at` in `anzeigen.csv` ersetzen.

## 3. Ehrliche Einschätzung

- Die Suchvolumen für „Sicherheitsunterweisung Bau“ in Österreich sind klein. Rechne eher mit wenigen Anfragen pro Woche als mit vielen pro Tag.
- Google Ads funktioniert hier am besten zusammen mit direktem Vertrieb an Sicherheitsfachkräfte, Baumeister und WKO-Innungen.
- Keine Werbung (AdSense) auf der eigenen Seite schalten: Sie lenkt Käufer ab und bringt bei dieser Besucherzahl nur Cent-Beträge.
