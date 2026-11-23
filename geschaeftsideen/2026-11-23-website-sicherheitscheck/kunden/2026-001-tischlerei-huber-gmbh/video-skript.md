# Video-Skript Analyse – Tischlerei Huber GmbH (demo-handwerk.at)

Ziel: 10–15 Min. Bildschirmaufnahme · Ton: freundlich-direkt, ehrlicher „Roast“, keine Fachbegriffe ohne Erklärung · Note F

> **Vorbereitung:** Website, Seitencheck-Ergebnis, Browser-Entwicklertools (Netzwerk-Tab) und `angebot.md` in Tabs öffnen. Keine Passwörter oder Kundendaten ins Bild!

## [0:00] Begrüßung

*Bild: Startseite der Kundenwebsite zeigen.*

Grüß Gott, hier ist Stefan von Seitencheck. Ich habe mir die Website von Tischlerei Huber GmbH, demo-handwerk.at, genauer angeschaut – so, wie es auch ein Angreifer tun würde, nur ohne böse Absicht. Ich bin ehrlich mit Ihnen, auch wenn's ein bisschen weh tut. Dafür sind Sie am Ende des Videos schlauer und wissen genau, was zu tun ist.

## [0:45] Das Ergebnis auf einen Blick

*Bild: Seitencheck-Ergebnis mit Ampel einblenden.*

Die Ampel steht auf **Note F**, 18 von 100 Punkten. 8 Punkte sind rot, 10 gelb. Klartext: Das ist die schlechteste Note. Gehackt ist die Seite deswegen nicht – aber sie macht es Angreifern unnötig leicht.

## [1:45] WordPress veraltet

*Bild: Quelltext (Strg+U), Versionsnummer markieren.*

WordPress ist nicht aktuell. Für Hacker-Bots ist das wie eine Haustür mit Zettel: „Schlüssel unter der Matte“.

Was heißt das für Sie? WordPress ist veraltet. Veraltete WordPress-Seiten sind das Ziel Nummer eins für automatische Angriffe.

Die Lösung: Backup erstellen, WordPress, Themes und Plugins aktualisieren, danach Funktion testen. Aufwand für uns: rund 60 Minuten.

## [3:15] PHP 7.4 veraltet

*Bild: Entwicklertools → Netzwerk → Antwort-Header der Startseite.*

Ihre Website läuft auf PHP 7.4. Das ist ungefähr so, als würden Sie im Winter mit Sommerreifen von 2019 fahren – geht, bis es nicht mehr geht.

Was heißt das für Sie? Die Programmiersprache hinter der Seite (PHP) bekommt keine Sicherheitsupdates mehr. Neue Lücken bleiben für immer offen.

Die Lösung: PHP beim Hoster auf eine aktuelle Version (8.3 oder neuer) umstellen – vorher Kompatibilität der Website testen. Aufwand für uns: rund 45 Minuten.

## [4:45] Tracking erst nach Einwilligung

*Bild: Entwicklertools → Netzwerk-Tab, Anfrage an Google zeigen (vor jedem Klick).*

Google Analytics zählt fleißig mit – nur gefragt hat niemand. Das ist leider das, was Datenschützer am liebsten finden.

Was heißt das für Sie? Google Analytics läuft sofort beim Besuch, ohne dass jemand zugestimmt hat. Das ist laut DSGVO/TKG nicht erlaubt.

Die Lösung: Consent-Tool einbinden, das Tracker erst nach Zustimmung lädt. Aufwand für uns: rund 45 Minuten.

## [6:15] Google Fonts lokal eingebunden

*Bild: Entwicklertools → Netzwerk-Tab, Anfrage an Google zeigen (vor jedem Klick).*

Ihre Schriften kommen direkt von Google. Sieht schön aus – und bei jedem Besuch geht die IP-Adresse nach Amerika. Genau dafür gab es in Österreich Abmahnbriefe.

Was heißt das für Sie? Schriften werden direkt bei Google geladen – dabei geht die IP-Adresse jedes Besuchers ohne Einwilligung an Google. Dafür gab es in Österreich Abmahnwellen.

Die Lösung: Schriftdateien herunterladen und vom eigenen Server ausliefern. Aufwand für uns: rund 30 Minuten.

## [7:45] Richtlinie gegen E-Mail-Betrug (DMARC)

*Bild: DNS-Abfrage (z. B. mxtoolbox.com) mit leerem Ergebnis zeigen.*

Jeder auf der Welt kann gerade E-Mails als „office@demo-handwerk.at“ verschicken, und kaum ein Postfach hält sie auf. Gefälschte Rechnungen sind das Lieblingsgeschäft von Betrügern.

Was heißt das für Sie? Gefälschte E-Mails mit Ihrer Absenderadresse werden von Empfängern nicht abgewiesen – beliebt für Rechnungsbetrug.

Die Lösung: DMARC-Eintrag anlegen, zuerst mit „p=none“ und Berichten, danach auf „quarantine“/„reject“ erhöhen. Aufwand für uns: rund 15 Minuten.

## [9:15] Schutz gegen gefälschte Absender (SPF)

*Bild: DNS-Abfrage (z. B. mxtoolbox.com) mit leerem Ergebnis zeigen.*

Es ist nirgends festgelegt, wer im Namen Ihrer Firma mailen darf. Das macht es Betrügern sehr leicht.

Was heißt das für Sie? Es ist nicht festgelegt, wer E-Mails im Namen der Firma verschicken darf. Betrüger können so gefälschte Rechnungen in Ihrem Namen senden.

Die Lösung: SPF-Eintrag im DNS anlegen (z. B. „v=spf1 include:<Mailanbieter> -all“). Aufwand für uns: rund 15 Minuten.

## [10:45] Kleinkram

*Bild: Liste der restlichen gelben Punkte scrollen.*

Dazu kommen noch 12 kleinere Punkte – die stehen alle im schriftlichen Bericht und sind beim Fix-Paket automatisch dabei.

## [11:25] Was schon gut ist

*Bild: Grüne Punkte zeigen.*

Fairerweise: Es ist nicht alles schlecht. Website über HTTPS erreichbar, SSL-Zertifikat gültig, Zertifikat-Laufzeit – passt.

## [11:55] Meine Empfehlung

*Bild: Angebot (angebot.md / PDF) einblenden, dann Gesicht/Kamera.*

Mein ehrlicher Rat: Nicht ewig liegen lassen. Die roten Punkte sind genau das, wonach automatische Angriffe suchen – und bei Google Fonts und Analytics ohne Einwilligung kann ein Abmahnbrief schneller kommen als ein Hacker.

Ich kann das für Sie zum **Fixpreis von 1 540 € netto** erledigen: Backup, Updates auf einer Testkopie, alle Einstellungen, E-Mail-Schutz und ein Vorher/Nachher-Bericht. Dauer: ca. eine Woche ab Freigabe. Danach halte ich die Seite für 79 Euro im Monat aktuell, damit wir das nicht in zwei Jahren wieder machen.

Das Angebot liegt im Mail. Antworten Sie einfach mit „Passt“, dann melde ich mich wegen der Zugänge. Danke fürs Zuschauen!

---
Geplante Länge: **ca. 13:25 Min.** (Sprechtempo ~130 Wörter/Min.). Unter 10 Min.? Bei den roten Punkten live im Quelltext zeigen.
