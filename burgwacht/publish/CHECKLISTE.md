# Burgwacht veröffentlichen – Checkliste

Alles Technische ist fertig. Diese Schritte gehen nur mit deinem eigenen Konto. Rechne mit etwa 1–2 Stunden.

## 0. Deine Angaben (5 Minuten)

Für Impressum, Datenschutz und Kaufbedingungen brauche ich:
- [ ] Vor- und Nachname
- [ ] Anschrift (Straße, PLZ, Ort)
- [ ] E-Mail-Adresse für Spieler-Anfragen
- [ ] UID-Nummer (nur falls vorhanden)

Schick mir die Angaben, dann baue ich die Pakete neu. Oder trag sie selbst in `publish/angaben.json` ein und starte `python3 build.py`.

## 1. CrazyGames – Werbeeinnahmen (Hauptweg)

- [ ] Konto auf **developer.crazygames.com** anlegen und die Entwickler-Bedingungen lesen und annehmen. Das ist dein Werbevertrag mit CrazyGames.
- [ ] Bei der Frage zur **Exklusivität** die Bedingungen genau lesen. Exklusiv bringt meist mehr Anteil, schränkt aber andere Web-Portale ein. itch.io (Schritt 2) dann vorher prüfen.
- [ ] Neues Spiel einreichen: Typ HTML5, Datei `dist/burgwacht-crazygames.zip`.
- [ ] Texte aus `publish/store-texte.md` (Abschnitt CrazyGames) einfügen.
- [ ] Bilder aus `dist/assets/` hochladen: Cover und Screenshots.
- [ ] Unter Zahlungen/Auszahlungen PayPal oder Bankkonto und die Steuerangaben eintragen.
- [ ] Einreichen und auf die Prüfung warten. Rückfragen von CrazyGames beantworten oder an mich weitergeben.

Werbung, Einwilligung (Cookies/DSGVO) und Auszahlung übernimmt CrazyGames. Du brauchst dort keinen eigenen Werbevertrag mit Google oder anderen Netzwerken.

## 2. itch.io – Verkauf des Königspakets (optional, zusätzlich)

- [ ] Konto auf **itch.io** anlegen.
- [ ] Unter *Settings → Payout* PayPal hinterlegen und das Steuerformular ausfüllen.
- [ ] Zahlungsart *„Collected by itch.io, paid later“* wählen. Laut itch.io kümmert sich dann itch.io um die Umsatzsteuer beim Verkauf an Privatpersonen. Bitte dort nachlesen.
- [ ] **Projekt A „Burgwacht“:** Kind of project *HTML*, Datei `dist/burgwacht-web.zip` hochladen, Haken *„This file will be played in the browser“*, Größe 1280 × 720, *Mobile friendly* und *Fullscreen button* aktivieren, Preis *„No payments“*. Texte aus `store-texte.md`.
- [ ] **Projekt B „Burgwacht – Königspaket“:** Kind of project *Downloadable*, Preis 2,99 €. Die Datei `publish/Koenigspaket-Code.txt` als Download hochladen. Sie enthält den Freischalt-Code.
- [ ] Die Adresse von Projekt B (z. B. `https://deinname.itch.io/burgwacht-koenigspaket`) an mich schicken. Ich trage sie ein, dann erscheint im Spiel-Shop der Kaufknopf.

**Wichtig:** Die Datei `Koenigspaket-Code.txt` nicht öffentlich teilen. Sie liegt nicht im Git-Repository, nur bei dir.

## 3. Bestenliste (optional, 10 Minuten)

- [ ] Supabase einrichten wie in `publish/datenbank-supabase.md` beschrieben und mir URL und *anon*-Key schicken.

## 4. Nach dem Start

Der genaue Plan mit Texten steht in `publish/marketing-plan.md`.

- [ ] Die fertigen Videos aus `dist/marketing/` auf TikTok, Instagram und YouTube Shorts mit Link posten.
- [ ] Freunde bitten, auf CrazyGames zu spielen und zu bewerten. Die ersten Bewertungen entscheiden über die Sichtbarkeit.
- [ ] Nach 2–4 Wochen die Statistik in den Portalen ansehen und mir schicken. Dann verbessere ich gezielt, wo Spieler aussteigen.

## Steuer (Österreich)

Einnahmen von CrazyGames und itch.io sind Einkünfte und gehören in die Einkommensteuererklärung. Bei Unsicherheit kurz beim Steuerberater nachfragen, gerade wegen Umsatzsteuer und Kleinunternehmerregelung.

## Hinweis zu den Rechtstexten

Impressum, Datenschutzerklärung und Kaufbedingungen sind sorgfältige Vorlagen für diesen Fall, aber keine Rechtsberatung. Bei Verkäufen lohnt sich ein kurzer Blick von einer Fachperson (z. B. WKO-Gründerservice).
