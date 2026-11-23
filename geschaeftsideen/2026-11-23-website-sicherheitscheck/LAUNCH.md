# WebAmpel – Website-Sicherheitscheck mit Ampel

**Status:** MVP fertig, alle 19 automatischen Tests grün, lokal mit Demo-Website geprüft (Desktop und Handy).
**„WebAmpel“ ist nur ein Arbeitsname.** Er lässt sich über `BRAND` in der `.env` ändern, ohne den Code anzufassen.

Vorschau: `vorschau/startseite.png`, `vorschau/ergebnis.png`, `vorschau/gesamtseite.png`

## Was drin ist
- **Gratis-Check:** prüft die Seite nur von außen, so wie ein normaler Besucher. Rund 25 Prüfungen in 6 Bereichen: HTTPS/Zertifikat, Server-Header, Software (WordPress, PHP, jQuery, Plugins), E-Mail (SPF, DMARC), DSGVO (Google Fonts, Tracking, Einbettungen von Google Maps/YouTube, Impressum) und optional Malware.
- **Ergebnis:** Ampel mit Note A–F, jeder Punkt in einfachen Worten erklärt, dazu „So wird’s behoben“.
- **Upsell:** gesperrte Pro-Prüfungen und ein Button „Probleme beheben lassen – ab 990 €“. Das Kontaktformular wird dann automatisch mit allen gefundenen Problemen ausgefüllt.
- Preisseite, FAQ, Notfall-Hinweis, Vorlagen für Impressum und Datenschutz, Ergebnis als PDF speicherbar.
- **Absicherung:**
  - Der Check kann keine internen Adressen oder Netzwerke abrufen (sonst ließe er sich für Angriffe missbrauchen).
  - Begrenzung auf 10 Checks pro Stunde und IP.
  - Pflicht-Häkchen „Ich bin berechtigt“.
  - Die eigene Seite hat alle Sicherheits-Header und kommt ohne Cookies und Tracking aus.
- **Anfragen:** landen in `data/leads.jsonl`, optional auch per Webhook an Make, Zapier oder n8n (z. B. für eine E-Mail an dich).

## Lokal starten
```bash
npm start        # http://localhost:3000 – kein npm install nötig (keine Abhängigkeiten)
npm test
```

## Testversion (kostenlos, Render.com)
`render.yaml` im Repo-Hauptordner richtet alles ein (Name „Seitencheck“, Testmodus mit Hinweisbalken, nicht in Google).
1. render.com → **Sign up with GitHub**
2. **New → Blueprint** → Repo `matlab` wählen → Branch `ccr-55fb00f9-8m7xq4` → `CONTACT_EMAIL` eintragen → **Apply**
3. Nach ca. 3–5 Min. läuft die Seite unter `https://seitencheck-test.onrender.com` (oder ähnlich)

Gratis-Stufe: schläft nach 15 Min. ohne Besucher ein (erster Aufruf dauert dann ca. 1 Min.), Anfragen in `data/` gehen beim Neustart verloren → nur zum Testen.

## Online stellen
**GitHub Pages reicht nicht.** Der Check braucht einen eigenen Server.

**Empfehlung: Hetzner Cloud CX22 (ca. 5 €/Monat, Rechenzentrum in Deutschland) + Caddy für automatisches HTTPS.**
```bash
apt update && apt install -y docker.io caddy git
git clone <repo> && cd <repo>/geschaeftsideen/2026-11-23-website-sicherheitscheck
cp .env.example .env && nano .env            # BRAND, CONTACT_EMAIL, PHONE, TRUST_PROXY=1 …
mkdir -p /srv/webampel-data && chown 1000:1000 /srv/webampel-data
docker build -t webampel .
docker run -d --restart=always --name webampel -p 127.0.0.1:3000:3000 \
  --env-file .env -v /srv/webampel-data:/app/data webampel
```
`/etc/caddy/Caddyfile`:
```
deine-domain.at, www.deine-domain.at {
  reverse_proxy 127.0.0.1:3000
}
```
`systemctl reload caddy`. Danach **die eigene Domain im eigenen Check prüfen**. Sie muss Note A bekommen.

Einfachere Alternative: Render.com (Docker, ca. 7 $/Monat). Die Gratis-Stufe schläft nach kurzer Zeit ein und taugt deshalb nicht.

## Pflicht vor dem Start
1. **Name und Domain festlegen**, Marke prüfen (markenrecherche.at, EUIPO).
2. **Gewerbe anmelden:** „Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik“ (freies Gewerbe).
3. **Berufshaftpflicht bzw. Cyber-Versicherung abschließen, BEVOR du den ersten Fix machst.**
4. **AGB und Auftragsformular erstellen:** Haftungsbegrenzung, Mitwirkungspflichten, Umgang mit Zugangsdaten, keine Garantie auf „100 % sicher“. Muster bei der WKO, idealerweise vom Anwalt prüfen lassen.
5. **Impressum und Datenschutz ausfüllen:** alle gelben `[Platzhalter]` in `public/impressum.html` und `public/datenschutz.html`.
6. **Umsatzsteuer klären:** Als Kleinunternehmer statt „netto“ „gem. § 6 UStG ohne USt.“ schreiben.
7. **Stripe:** Payment Links anlegen (Video-Analyse 199 €, Wartung als Abo) und in der `.env` eintragen.
8. **Benachrichtigung über neue Anfragen:** Make.com-Webhook, der dir eine E-Mail schickt, als `LEAD_WEBHOOK_URL` eintragen.
9. Optional: **kostenlosen Google-Safe-Browsing-Key** besorgen und eintragen. Damit ist der Malware-Check aktiv.

## Liefer-Checkliste Fix-Paket (ab 990 €)
Realistischer Aufwand: 4–8 h, also ca. 120–250 €/h.
1. Auftrag unterschrieben. **Zugangsdaten nur über einen Passwort-Manager teilen, nie per E-Mail.**
2. Vollbackup von Dateien und Datenbank, extern gespeichert.
3. WordPress, Theme und Plugins aktualisieren, PHP auf 8.3 oder neuer. Vorher auf einer Testkopie (Staging) prüfen.
4. Unbenutzte Plugins, Themes und Admin-Konten löschen. 2-Faktor-Login für Admins, Login-Schutz gegen Passwort-Raten.
5. HTTPS-Weiterleitung, HSTS und Sicherheits-Header setzen, Versionsangaben ausblenden.
6. SPF, DKIM und DMARC im DNS einrichten.
7. DSGVO: Google Fonts lokal, Cookie-Banner-Tool (Consent), YouTube und Maps erst nach Klick laden, Datenschutzerklärung prüfen.
8. Backup danach, Vorher/Nachher-Check als PDF, Abschlussbericht, 30 Tage Nachkontrolle.
9. **Wartung anbieten (79 €/Monat).** Das ist das eigentliche Geschäft.

## Kunden gewinnen (rechtskonform)
- **Keine ungefragten Werbe-E-Mails oder Werbeanrufe (§ 174 TKG).** Ein Brief per Post ist erlaubt (Robinsonliste beachten).
- **Google Ads:** 10–20 €/Tag, nur Österreich, nur Suchnetzwerk.
  - Keywords: „website gehackt“, „wordpress gehackt“, „website sicherheit prüfen“, „website sicherheitscheck“, „wordpress wartung“, „wordpress sicherheit“, „dsgvo website check“, „google fonts abmahnung“
  - Ausschließen: job, kurs, ausbildung, studium, selber
  - Anzeigentitel: „Gratis Website-Sicherheitscheck“ · „Website gehackt? Hilfe heute“ · „WordPress absichern – Fixpreis“
- **Keine AdSense-Werbung auf der eigenen Seite.** Sie kostet Vertrauen und bringt nur Cent-Beträge.
- **Webagenturen:** Fixes und Wartung unter deren Namen anbieten (White-Label).
- **Netzwerk:** Steuerberater, WKO-Stammtische, BNI. Dazu das eigene Bau- und Handwerkernetzwerk, denn deren Websites sind oft veraltet.
- **„Website-Roast“-Videos auf LinkedIn und YouTube.** **Nur mit Erlaubnis des Seitenbetreibers.**

## Grenzen des MVP (ehrlich)
- Geprüft werden nur die Startseite und die DNS-Einträge, und zwar nur von außen. Plugins werden erkannt, aber nicht automatisch mit Lücken-Datenbanken abgeglichen. Das passiert manuell im Detailbericht; die WPScan-API kostet bei kommerzieller Nutzung Geld.
- Begrenzung und Zwischenspeicher liegen im Arbeitsspeicher. Für einen einzelnen Server reicht das.
- Es gibt keinen Admin-Bereich. Anfragen landen in einer Datei bzw. per Webhook in deinem Postfach.
- Es gibt keinen eigenen PDF-Generator. Das PDF entsteht über „Drucken → Als PDF speichern“ im Browser.
