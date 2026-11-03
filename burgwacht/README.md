# Burgwacht – Veröffentlichen und Geld verdienen

Fertiges 3D-Tower-Defense-Spiel im Browser: 5 Karten plus Endlos-Modus, Held, Kaserne, Edelsteine, Upgrades, Tagesbonus, Erfolge, Deutsch und Englisch.

## Was du hochlädst

| Datei | Wofür |
|---|---|
| `dist/burgwacht-crazygames.zip` | **Hauptweg.** Upload bei CrazyGames. Werbung läuft über deren SDK, Auszahlung monatlich. |
| `dist/burgwacht-web.zip` | Eigene Website oder itch.io. Ohne Werbung, optional mit Königspaket (Kauf über deinen Bezahllink). |
| `dist/assets/cover-*.png` | Vorschaubilder für die Einreichung (1920×1080, 1280×720, 800×1200, 800×800). |

Beide ZIPs sind vollständig: Spiel, 3D-Bibliothek und Schriften liegen lokal drin, nichts wird von fremden Servern nachgeladen (außer dem CrazyGames-SDK auf CrazyGames).

## Schritt für Schritt: CrazyGames

1. Auf **developer.crazygames.com** ein Entwicklerkonto anlegen.
2. „Submit game“ wählen, Engine/Typ **HTML5**, die Datei `dist/burgwacht-crazygames.zip` hochladen.
3. Titel: **Burgwacht – Castle Tower Defense**, Kategorie *Strategy / Tower Defense*, die Cover-Bilder aus `dist/assets` hochladen.
4. Kurzbeschreibung (Englisch, für die Plattform):
   > Build your realm and defend the castle! Place archer towers, cannons, frost mages and tesla coils, train soldiers, level up your hero and survive waves of goblins, knights, trolls and dragons across five handcrafted maps – plus an endless mode.
5. Steuerung angeben: *Mouse/Touch – tap a card, then tap a tile. Keys 1–8 build, Space starts the wave, Q/E spells, H/R hero.*
6. Im Bereich „Payments/Payouts“ PayPal oder Bankkonto eintragen. Das geht nur mit deinem Konto, das kann ich nicht für dich erledigen.
7. Einreichen. CrazyGames prüft das Spiel, das kann einige Zeit dauern. Neue Spiele werden zuerst einem kleinen Publikum gezeigt.

Die Menüs und Felder im Entwicklerportal können sich ändern. Wenn etwas anders aussieht, gilt die Anleitung dort.

**Wie Geld reinkommt:** CrazyGames zeigt Werbung und teilt die Einnahmen. Im Spiel gibt es freiwillige Belohnungs-Werbung:
- Weiterkämpfen nach einer Niederlage (+10 Leben)
- Edelsteine nach der Runde verdoppeln
- Tagesbonus verdoppeln
- +80 Gold in der Pause zwischen den Wellen (max. 3 pro Runde)
- Gratis-Edelsteine im Shop (max. 5 pro Tag)

Zusätzlich kommt höchstens alle 3 Minuten eine kurze Werbepause beim Wechsel ins Menü, nie mitten im Kampf.

## itch.io mit Königspaket (optional)

Die Web-Version (`dist/burgwacht-web.zip`) hat keine Werbung. Stattdessen gibt es das **Königspaket** (alle Karten frei, doppelte Edelsteine, +300 Edelsteine). Verkauft wird es über itch.io, die Zahlung läuft über PayPal oder Karte, die Freischaltung per Code.

- Der Code wird beim ersten `python3 build.py` zufällig erzeugt und in `publish/.premium-code` gespeichert. Im Spiel liegt nur sein Hash, nie der Code selbst.
- `publish/Koenigspaket-Code.txt` ist die Datei, die Käufer auf itch.io herunterladen. Beide Dateien sind über `.gitignore` aus dem Repository ausgeschlossen.
- Deine Angaben (Name, Anschrift, E-Mail, Kauf-Link, Preis) stehen in `publish/angaben.json`. Daraus entstehen beim Bauen `impressum.html`, `datenschutz.html` und `kaufbedingungen.html` in `dist/web/`. Im Spiel verlinkt sie der Knopf „Info“.
- In der fertigen Web-Version lassen sich Kauf-Link und Preis auch direkt in `config.js` ändern, ohne neu zu bauen.

Ehrlicher Hinweis: Ohne Server kann ein Käufer den Code weitergeben. Für den Anfang reicht das.

**Nicht mischen:** In der CrazyGames-Version sind keine externen Bezahllinks erlaubt. Deshalb gibt es zwei getrennte Pakete.

Die Schritte zum Veröffentlichen stehen in **`publish/CHECKLISTE.md`**, die fertigen Texte in **`publish/store-texte.md`**.

## Rechtliches (Österreich)

- Einnahmen sind steuerpflichtig und gehören in die Einkommensteuererklärung. Bei Fragen zur Kleinunternehmerregelung lieber kurz beim Steuerberater nachfragen.
- Für eine eigene Website mit Verkauf brauchst du ein Impressum und eine Datenschutzerklärung. Auf CrazyGames kümmert sich die Plattform um Datenschutz und Einwilligung für Werbung.
- Bewusst **keine Lootboxen** oder Glücksspiel-Mechaniken: In Österreich gibt es Urteile, die solche Mechaniken als Glücksspiel werten.

## Realistische Erwartung

Ob 100 € im Monat zusammenkommen, hängt fast nur von den Spielerzahlen ab. Browser-Spiele verdienen pro Spieler wenig. Das Ziel braucht eher Zehntausende Spielrunden im Monat. Was hilft:
- Gute Bewertungen in den ersten Wochen auf CrazyGames (die entscheiden über die Sichtbarkeit)
- Das Spiel zusätzlich auf itch.io und Newgrounds verlinken
- Kurze Gameplay-Videos (TikTok/YouTube Shorts) mit dem Link

## Für Entwickler

- Quellcode in `src/`, `python3 build.py` erzeugt alle HTML-Dateien und die ZIPs in `dist/`.
- `src/core.js` Spiellogik, `src/meta.js` Fortschritt, Shop und Werbung, `src/r3d.js` 3D-Grafik (Three.js r128), `src/i18n.js` Übersetzungen.
- `burgwacht.html` ist die Vorschau mit Demo-Werbung (statt echter Werbung erscheint ein 3-Sekunden-Platzhalter).
- Die Dateien `v1-…` bis `v6-…` sind die früheren Varianten zum Vergleich.
- Lizenzen: Three.js (MIT), Schriften Lilita One und Nunito (SIL OFL), liegen in `vendor/` und in den ZIPs bei.
