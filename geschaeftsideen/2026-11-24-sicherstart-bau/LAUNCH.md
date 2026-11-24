# Sicherstart Bau: Launch-Anleitung

Website für digitale Sicherheitsunterweisung auf Baustellen, mit Bestellung, Überweisung, Online-Zahlung und Google Ads.
Alles liegt im Ordner `site/` und läuft ohne Build-Schritt.

## Was fertig ist

| Bereich | Stand |
|---|---|
| Landingpage, Ablauf, Funktionen, Preise mit Grundpauschale | fertig |
| Demo-App: Baustellen, Polier-Modus, 7 Kurzfilme, Stopp-Fragen, Bild-Quiz, 4 Sprachen, Unterschrift, Nachweis-PDF | fertig, Daten bleiben im Browser des Geräts (mit Sichern/Laden) |
| Unterlagen: Polier-Leitfaden, Unterweisungsmappe-PDF, Aushang mit QR-Code, BauKG-Überblick | fertig |
| Bestellung mit Preisrechner, USt und Reverse Charge | fertig |
| Überweisung mit Zahlschein-QR-Code (EPC) und Auftragsbestätigung als PDF | fertig, braucht IBAN in `config.js` |
| Online-Zahlung (Karte, SEPA-Lastschrift) als Abo über Stripe | fertig, braucht Stripe-Konto |
| Bestellungen und Demo-Anfragen per E-Mail (Netlify Forms) | fertig, braucht Netlify |
| Google Ads Conversion-Tracking mit Cookie-Banner | fertig, braucht Google-Ads-Konto |
| Impressum, Datenschutz, AGB | Vorlagen, Firmendaten fehlen, rechtliche Prüfung nötig |
| Schriften und Bibliotheken selbst gehostet (keine Google Fonts) | fertig |

## Schritte bis zum Start

1. **Gewerbe anmelden**, falls noch nicht vorhanden: freies Gewerbe „Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik“ (USP oder Bezirkshauptmannschaft).
2. **`site/config.js` ausfüllen:** Firmendaten (Adresse, UID, Gewerbe, Behörde, Kammer) und Bankverbindung (Kontoinhaber, IBAN, BIC). Ohne IBAN zeigt die Seite statt QR-Code „Rechnung kommt per E-Mail“.
3. **Netlify-Konto anlegen** (app.netlify.com, Gratis-Tarif reicht) → „Add new site“ → „Import from Git“ → dieses Repo wählen → **Base directory: `geschaeftsideen/2026-11-24-sicherstart-bau/site`** → Deploy. Alternativ den Ordner `site/` per Drag-and-drop hochladen (dann ohne Online-Zahlung).
4. **Formular-Benachrichtigung einschalten:** Netlify → Site → Forms → „Form notifications“ → E-Mail an stefan.freudenthaler@aon.at für die Formulare `bestellung` und `anfrage`.
5. **Domain verbinden**, z. B. eine `.at`-Domain (vorher Verfügbarkeit prüfen): Netlify → Domain management. HTTPS kommt automatisch.
6. **Stripe einrichten** (optional, für Karte und Lastschrift):
   - Konto auf stripe.com anlegen und verifizieren.
   - Steuersatz anlegen: Dashboard → Produktkatalog → Steuersätze → „20 % USt Österreich, exklusive“ → ID `txr_…` kopieren.
   - In Netlify → Site configuration → Environment variables: `STRIPE_SECRET_KEY` (geheimer Schlüssel `sk_live_…`) und `STRIPE_TAX_RATE_ID` (`txr_…`) eintragen. **Der geheime Schlüssel kommt nie in `config.js` oder ins Repo.**
   - In Stripe die Zahlungsmethoden Karte und SEPA-Lastschrift aktivieren.
   - In `config.js` `onlinePayment: true` setzen und neu deployen.
   - Mit dem Testschlüssel `sk_test_…` eine Testbestellung machen, danach auf den Live-Schlüssel wechseln.
7. **Google Ads einrichten:** siehe `GOOGLE-ADS.md`. Danach ID und Labels in `config.js` unter `googleAds` eintragen.
8. **Rechtliches prüfen lassen:** AGB, Datenschutzerklärung und Impressum sind Vorlagen. Von einer Anwältin oder der WKO-Rechtsberatung prüfen lassen. Die Unterweisungsinhalte und BauKG-Angaben von einer Sicherheitsfachkraft prüfen lassen. Auftragsverarbeitungsvertrag (AVV) für Kunden vorbereiten.
9. **Testbestellung** mit beiden Zahlungsarten machen und prüfen, ob die E-Mail ankommt und der QR-Code in der eigenen Banking-App korrekt erkannt wird.

## Lokal ansehen

```
cd geschaeftsideen/2026-11-24-sicherstart-bau/site
python3 -m http.server 8080
```
Dann http://localhost:8080 öffnen. Formulare und Online-Zahlung funktionieren nur auf Netlify.

## Bekannte Grenzen

- Die Demo-App speichert Baustellen und Nachweise im Browser des jeweiligen Geräts. Für mehrere Geräte pro Firma, Logins und zentrale Nachweise braucht es als nächste Ausbaustufe ein Backend (z. B. Supabase mit EU-Hosting).
- Der QR-Code an der Baustelle funktioniert dadurch nur auf dem Gerät, auf dem die Baustelle angelegt wurde.
- Rechnungen mit fortlaufender Nummer erstellt die Seite nicht. Dafür ein Rechnungsprogramm verwenden; bei Online-Zahlung schickt Stripe die Rechnungen.
- Übersetzungen (BKS, Rumänisch, Ungarisch) wurden mit KI erstellt und sollten von Muttersprachlern geprüft werden.
