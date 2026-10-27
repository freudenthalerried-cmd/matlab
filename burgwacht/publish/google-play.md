# Burgwacht im Google Play Store

## Was fertig ist

| Datei | Wofür |
|---|---|
| `burgwacht-playstore.aab` | Das App-Paket für Google Play, signiert mit deinem Upload-Schlüssel |
| `Burgwacht-Test.apk` | Zum Ausprobieren am eigenen Handy (zeigt Test-Werbung) |
| `burgwacht-upload.jks` + `upload-schluessel-passwort.txt` | Dein Upload-Schlüssel. **Gut aufheben, nie teilen, nicht ins Repository.** Ohne ihn keine Updates. |
| `dist/assets/icon-512.png` | App-Symbol für den Store |
| `dist/assets/feature-1024x500.png` | Store-Grafik (Feature Graphic) |
| `dist/assets/screenshot-*.png` | Screenshots (mindestens 2 hochladen) |

Die App enthält:
- das Spiel offline
- Werbung über **AdMob** mit Einwilligungsabfrage nach DSGVO
- den Kauf des **Königspakets über Google Play**
- „Käufe wiederherstellen“
- eine Zurück-Taste, die Fenster schließt und pausiert

Package-Name: `io.github.freudenthalerried.burgwacht` (kann später nicht geändert werden).

**Test-APK installieren:** Am Handy öffnen: https://github.com/freudenthalerried-cmd/matlab/releases/download/burgwacht-android/Burgwacht-Test.apk und die Installation aus unbekannten Quellen erlauben.

## 1. Google-Play-Entwicklerkonto (einmalig 25 $)

- [ ] Auf **play.google.com/console** ein Entwicklerkonto anlegen. *Privatperson* reicht, Ausweis und Telefonnummer werden geprüft.
- [ ] **Wichtig für private Konten:** Google verlangt vor der Veröffentlichung einen **geschlossenen Test mit mindestens 12 Testern über 14 Tage**. Familie und Freunde mit Android-Handy reichen. Plane das ein.

## 2. App anlegen

- [ ] *App erstellen*: Name **Burgwacht**, Sprache Deutsch, *Spiel*, *Kostenlos*.
- [ ] **Store-Eintrag:** Texte aus `publish/store-texte.md` (Abschnitt Google Play), Symbol, Feature Graphic, Screenshots.
- [ ] **Datenschutzerklärung (URL):** `https://freudenthalerried-cmd.github.io/matlab/burgwacht/dist/android/datenschutz.html`
  - Vorher GitHub Pages einschalten (*Settings → Pages → Branch gh-pages*).
  - Vorher Name, Anschrift und E-Mail schicken, damit die Erklärung vollständig ist.
- [ ] **Einstufung des Inhalts (IARC-Fragebogen):** Kategorie *Spiel*, Gewalt: *Fantasy-Gewalt, cartoonhaft, kein Blut*. Ergebnis ist meist PEGI 7.
- [ ] **Zielgruppe:** *13 Jahre und älter* wählen. Bei jüngeren Zielgruppen gelten für Werbung strengere Familien-Regeln.
- [ ] **Enthält Werbung:** Ja.
- [ ] **Datensicherheit:** Diese Angaben passen zur eingebauten Technik. Bitte vor dem Absenden mit der AdMob-Hilfe abgleichen.
  - Daten werden erhoben und mit Dritten geteilt: **Geräte- oder andere IDs** (Werbe-ID), Zweck *Werbung oder Marketing*, durch AdMob.
  - **App-Aktivität / App-Interaktionen** sowie **Absturzprotokolle und Diagnosedaten**, durch AdMob, Zweck *Werbung, Analyse*.
  - **Kaufverlauf**, nur zur Freischaltung des Königspakets (App-Funktionalität).
  - Übertragung verschlüsselt: Ja. Spielstand bleibt auf dem Gerät.

## 3. Königspaket als In-App-Produkt

- [ ] Unter *Monetarisieren → Produkte → In-App-Produkte* ein Produkt mit der ID **`koenigspaket`** anlegen.
  - Einmalkauf, Preis z. B. 2,99 €, Name „Königspaket“
  - Beschreibung: „Keine Werbepausen, alle Karten frei, doppelte Edelsteine, +300 Edelsteine.“
- [ ] Aktivieren. Die ID muss genau so heißen, sonst findet die App das Produkt nicht.

## 4. AdMob (echte Werbung statt Test-Werbung)

- [ ] Auf **admob.google.com** ein Konto anlegen und unter *Zahlungen* die Bankverbindung und die Steuerdaten eintragen.
- [ ] *Apps → App hinzufügen → Android*, im Play Store nach „Burgwacht“ suchen. Vor der Veröffentlichung *noch nicht veröffentlicht* wählen.
- [ ] Zwei Anzeigenblöcke anlegen: **Belohnung** (Rewarded) und **Interstitial**.
- [ ] Unter *Datenschutz und Messaging* eine **DSGVO-Nachricht** erstellen und veröffentlichen. Diese Nachricht zeigt die App beim ersten Start.
- [ ] Mir die **App-ID** (`ca-app-pub-…~…`) und die zwei **Anzeigenblock-IDs** (`ca-app-pub-…/…`) schicken. Ich trage sie in `burgwacht-android/store.properties` ein und baue ein neues, signiertes Paket.

Bis dahin zeigt die App nur Test-Werbung von Google. Damit ist sie fertig testbar, verdient aber noch nichts.

## 5. Hochladen

- [ ] *Testen → Interner Test → Neuer Release* und `burgwacht-playstore.aab` hochladen. *Play App Signing* übernimmt Google automatisch.
- [ ] Eine Testerliste anlegen (E-Mail-Adressen) und den Link an die Tester schicken.
- [ ] Danach *Geschlossener Test* mit den 12 Testern, 14 Tage laufen lassen, dann *Produktion beantragen*.

Für jedes Update baue ich ein neues Paket mit höherer Versionsnummer. Du lädst es unter dem gleichen Track hoch.

## Apple App Store (später)

Dafür brauchst du:
- eine Mitgliedschaft im **Apple Developer Program** (99 $ pro Jahr)
- deine Apple-ID mit Zwei-Faktor-Anmeldung
- für die Signierung Zugang zu einem Mac oder Zertifikate, die du in App Store Connect erstellst

Wenn das Konto steht, baue ich die iOS-Version mit Werbung und Kauf über Apple.
