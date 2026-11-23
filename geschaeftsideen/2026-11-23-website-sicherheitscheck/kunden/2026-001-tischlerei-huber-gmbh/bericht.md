# Abschlussbericht Website-Sicherheit – Tischlerei Huber GmbH

demo-handwerk.at · Projekt 2026-001 · Vorher: 23.11.2026 · Nachher: 23.11.2026

| | Vorher | Nachher |
|---|---|---|
| Scanner-Note | **F** (18) | **A** (97) |
| Ehrliche Note¹ | | **C** (73) |
| Rot / Gelb | 8 / 10 | 0 / 1 |

¹ Zählt Punkte weiter, die nur unsichtbar gemacht, aber noch nicht wirklich behoben sind (z. B. veraltetes PHP mit versteckter Versionsnummer).

## ✅ Erledigt (15)

- Automatische Weiterleitung auf HTTPS
- HTTPS erzwingen (HSTS)
- Schutz gegen eingeschleuste Skripte (CSP)
- Schutz gegen Clickjacking
- Dateityp-Schutz (nosniff)
- Weitergabe von Seitenadressen begrenzt
- Keine Versionsnummern öffentlich
- Cookies sicher gesetzt
- Systemversion nicht öffentlich sichtbar
- Veraltete Bibliothek jQuery 1.12.4
- Schutz gegen gefälschte Absender (SPF)
- Google Fonts lokal eingebunden
- Tracking erst nach Einwilligung
- Eingebettete Inhalte datenschutzfreundlich
- Datenschutzerklärung vorhanden

## 🟡 Teilweise erledigt

- Richtlinie gegen E-Mail-Betrug (DMARC): DMARC ist nur im Beobachtungsmodus (p=none) – gefälschte Mails werden noch zugestellt.

## ⏳ Offen (2)

- **PHP 7.4 veraltet** – Version jetzt versteckt, aber **noch nicht aktualisiert**. Beim echten Kunden im Panel zu erledigen: PHP-Version im Hoster-Panel umstellen.
- **WordPress veraltet** – Version jetzt versteckt, aber **noch nicht aktualisiert**. Beim echten Kunden im Panel zu erledigen: WordPress-Update im WP-Admin.

## Empfehlung

Sicherheit ist kein Zustand, sondern Routine: Jede Woche erscheinen neue Lücken in Plugins. Wir empfehlen die **Wartung ab 79 €/Monat** (Updates mit Backup, Überwachung, monatlicher Check, DMARC Stufe 2).
