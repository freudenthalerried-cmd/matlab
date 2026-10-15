# Speicherkompass: Start Schritt für Schritt

Alles Technische ist vorbereitet: Seite, Impressum, Datenschutz, automatische Veröffentlichung.
Diese Schritte gehen nur über dich, weil sie deinen Namen, ein Konto oder eine Unterschrift brauchen.
**Passwörter schickst du mir nie.** Die trägst du nur bei All-Inkl und GitHub selbst ein.

## 1. Domain und Hosting bei All-Inkl (ca. 10 Minuten)
- [ ] Bei all-inkl.com einen Tarif wählen (Privat reicht) und **speicherkompass.at** dazubestellen.
      Ob die .at-Domain einen Aufpreis hat, steht im Bestellprozess.
- [ ] Im KAS (Kundenadministration):
  - [ ] SSL-Zertifikat (Let's Encrypt) für die Domain einschalten.
  - [ ] Unter „FTP“ einen eigenen FTP-Zugang anlegen, der **nur** auf den Ordner der Domain zugreift.
  - [ ] E-Mail-Adresse `kontakt@speicherkompass.at` anlegen und an deine Adresse weiterleiten.
  - [ ] Bei den Logdateien eine kurze Speicherdauer einstellen (die Datenschutzerklärung nennt 7 Tage).

## 2. Gewerbe anmelden (ca. 15 Minuten)
- [ ] Online über usp.gv.at (mit ID Austria): freies Gewerbe **„Werbeagentur“**.
- [ ] Kosten, die du kennen solltest: Unfallversicherung bei der SVS ca. 12 € im Monat und ein kleiner
      Jahresbeitrag an die Wirtschaftskammer. Kranken- und Pensionsversicherung fallen meist erst über
      rund 6.600 € Jahresgewinn an (Wert 2025, wird jährlich angepasst). Umsatzsteuer erst ab 55.000 € Umsatz.

## 3. Mir diese Angaben schicken (im Chat, keine Passwörter)
- [ ] Name, wie er im Impressum stehen soll
- [ ] Anschrift (Wohnadresse oder gebuchte Geschäftsadresse, sie wird öffentlich sichtbar)
- [ ] E-Mail-Adresse für das Impressum (Vorschlag: kontakt@speicherkompass.at)
- [ ] Zuständige Gewerbebehörde (steht im Gewerbeschein, z. B. Bezirkshauptmannschaft …)

Ich trage sie in `config.json` ein. Ohne diese Angaben geht die Seite absichtlich nicht online.

## 4. Automatische Veröffentlichung einschalten (ca. 5 Minuten)
- [ ] Auf GitHub im Repo: **Settings → Secrets and variables → Actions → New repository secret**, drei Einträge:
  - `SK_FTP_SERVER` (z. B. `w0123456.kasserver.com`, steht im KAS beim FTP-Zugang)
  - `SK_FTP_USERNAME`
  - `SK_FTP_PASSWORD`
- [ ] Prüfen, dass das Repo **privat** ist (sonst ist dein GitHub-Name mit der Seite verknüpft).

Danach geht jede Änderung, die ich mache, automatisch online.
**Ohne GitHub:** Ich schicke dir eine ZIP-Datei, du lädst den Inhalt im KAS über WebFTP hoch.

## 5. Partnerprogramme (nach dem Start, die Seite muss erreichbar sein)
- [ ] **Awin** als Publisher anmelden (eventuell kleine, rückerstattbare Prüfgebühr), dann bewerben bei:
      Anker SOLIX (Programm 32623), Zendure, EcoFlow, Jackery.
- [ ] Schnellstart: **Amazon PartnerNet** (amazon.de). Achtung: Amazon schließt das Konto, wenn in den
      ersten 180 Tagen keine 3 Verkäufe kommen. Dann einfach neu anmelden, sobald die Seite Besucher hat.
- [ ] Mir die **Publisher-ID** (Awin) bzw. die **Tracking-ID** (Amazon) schicken. Ich baue die Links ein.

## 6. Google Bescheid geben (ca. 5 Minuten)
- [ ] In der Google Search Console die Domain hinzufügen und per DNS-Eintrag (TXT im KAS) bestätigen.
- [ ] Sitemap einreichen: `https://speicherkompass.at/sitemap.xml`

## Danach mache ich weiter
- Wöchentliche Routine: Preise und Förderungen prüfen, neue Inhalte, Linkprüfung, Monatsbericht.
- Ausbau: Seiten je Bundesland, weitere Rechner aus dem Energie-Bündel, später Deutschland.
