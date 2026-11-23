# Auftrags-Checkliste – Tischlerei Huber GmbH (demo-handwerk.at)

Projekt 2026-001

## Vor dem Start
- [ ] Angebot angenommen, **Auftrag mit AGB unterschrieben** (Haftungsbegrenzung, Mitwirkungspflichten)
- [ ] **Schriftliches Einverständnis**: Kunde ist Inhaber/berechtigt, Arbeiten an demo-handwerk.at sind erlaubt
- [ ] Anzahlung 50 % eingegangen
- [ ] Berufshaftpflicht/Cyber-Versicherung aktiv

## Zugangsdaten – nur über Passwort-Manager
- [ ] Freigabe per **Bitwarden Send / 1Password-Link / Passwort-Manager-Ordner** – nie E-Mail, SMS, WhatsApp
- [ ] Hoster-Panel (eigener Unterzugang, wenn möglich)
- [ ] WordPress: **eigenes Admin-Konto** für Stefan (nicht das des Kunden)
- [ ] DNS/Domain-Registrar (nur wenn SPF/DMARC dort gesetzt werden)
- [ ] SFTP/SSH (nur falls Dateien/Konfig geändert werden)
- [ ] Mailanbieter des Kunden notiert (für SPF/DKIM): ____________
- [ ] Nichts davon im Repo, in `kunden/` oder in Chat-Verläufen speichern

## Backup vorher
- [ ] Vollbackup Dateien + Datenbank (Hoster-Backup **und** UpdraftPlus o. ä.)
- [ ] Backup **extern** gespeichert und Wiederherstellung kurz geprüft (Datei öffnet sich, DB-Dump nicht leer)
- [ ] Staging-Kopie angelegt

## Ablauf
1. [ ] `scan-vorher.json` und `fixplan.md` mit Kunde abgestimmt
2. [ ] Updates auf Staging → testen (Startseite, Kontaktformular, Mobil)
3. [ ] Updates live, PHP-Version umstellen
4. [ ] Konfiguration (Header, Weiterleitung, Versionsangaben, Cookies)
5. [ ] DSGVO-Technik (Fonts lokal, Consent-Tool, Maps per Klick)
6. [ ] DNS: SPF, DMARC Stufe 1
7. [ ] Login-Schutz: 2FA für Admins, unbenutzte Konten/Plugins löschen
8. [ ] `node projekt.js nachher kunden/2026-001-tischlerei-huber-gmbh`, Bericht prüfen
9. [ ] Backup nachher
10. [ ] Bericht an Kunden, **Kunde ändert alle geteilten Passwörter**, Stefans Admin-Konto deaktivieren
11. [ ] Rechnung Rest 50 %, Wartung anbieten, Nachkontrolle in 30 Tagen im Kalender

## Notfallplan
- Seite kaputt nach Update → Backup einspielen, Kunde sofort informieren, Ursache auf Staging suchen.
