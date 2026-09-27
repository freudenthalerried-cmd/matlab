# Analyse der „Sicherheit am Bau"-Berichte (2021–2025)

Grundlage: 11 Berichte-PDFs aus Google Drive (Baustellen Wels Neustadt, Vorchdorf
Messenbachstraße, Pinsdorf Zentrum, Niederneukirchen NMS, WFL Versandhalle Süd).
Jeder Bericht besteht aus Einträgen mit **Foto + Zeitstempel + Text**.

## Aufbau eines Eintrags

- Kopf: Kontakt, Erstellt-Zeitstempel, Ort, Titel (`TT.MM.JJ HH:MM - Bericht`)
- Pro Beobachtung: Foto links, daneben „Erstellt:"-Zeit und der Text
- Der Text ist fast immer eine Kombination aus einer **kurzen konkreten
  Feststellung** („Wehren sind zu ergänzen.") und einem **standardisierten
  Textbaustein** (rechtlicher/organisatorischer Hinweis, oft mit BauV-Paragraf).

## Erkannte Foto → Text-Zusammenhänge

| Foto zeigt | Verwendeter Text |
|---|---|
| Attika/Dachrand ohne vollständiges Geländer | „Wehren sind zu ergänzen." / „Brust-, Mittel- und Fußwehren sind beidseitig zu ergänzen." |
| Dämmstoffpakete am Dachrand | „Keine Lagerung von Dämmstoffplatten direkt neben Brüstungen." |
| Gasflaschen frei stehend | Gasflaschen-Baustein (Umfallen, fremde Inbetriebnahme, Lagerboxen) |
| Bauschutt/Material im Weg | „Verkehrswege und Arbeitsplätze sind sicher zu gestalten. Bauschutt … räumen." |
| Bodenöffnung/Vertiefung | „Bodenöffnungen schließen oder abdecken." |
| Stehleiter/Holzleiter | Leitern-Baustein (nur geprüfte Leitern, Spreizsicherung, kein „Gehen") |
| Leiter auf Brüstung / unsicherer Standplatz | „Das ist kein sicherer Arbeitsplatz." + kollektive Schutzmaßnahmen |
| Gerüst | Gerüst-Abnahmeprotokoll-Baustein |
| Kran/Kranballast | Drehbereich-Kran-Baustein |
| KMF-Säcke | KMF-/Mineralwolle-Baustein |
| Bauzaun/Baustelleneinrichtung | Bauzaun-Baustein (§ 4 Abs. 7 BauV), Waschplatz (§ 37 BauV), Erste Hilfe |
| Ordentliche Baustelle | „Geländer und Absturzsicherungen sind ordnungsgemäß vorhanden." / „Gut und ordentlich geführte Baustelle." |

## Häufigkeit der Textbausteine (in 11 Berichten)

1. Verkehrswege/Arbeitsplätze sicher gestalten + Bauschutt räumen — 4×
2. Wehren/Geländer ergänzen (Varianten) — 4×
3. Gasflaschen-Baustein — 3× (wortidentisch)
4. „Sicherheitsrelevante Punkte mit Polier/Vorarbeiter vor Ort besprochen" — 3×
5. Kollektive Schutzmaßnahmen (nie entfernen / herstellen) — 3×
6. Gerüst-Abnahmeprotokoll — 2×
7. Bauzaun § 4 Abs. 7 BauV — 2×
8. „Geländer und Absturzsicherungen ordnungsgemäß vorhanden" — 2×
9. Dach/Bestandsdächer (§ 8/§ 9 BauV) — 2×
10. Einmalig: Winterbau, Leitern, Bodenöffnungen, KMF, Kran, § 37 BauV, Erste Hilfe, Unterweisung

## Typische Kombinationen (in einem Bericht gemeinsam)

- Gerüst-Protokoll ↔ Wehren/kollektive Schutzmaßnahmen
- Gasflaschen ↔ Lagerung brennbarer Dämmstoffe
- Leitern ↔ Bodenöffnungen (Sturzgefahr)
- Mängel-Einträge enden oft mit dem „besprochen mit Polier"-Baustein
- Positive Einträge: „Geländer ordnungsgemäß" + „Gut und ordentlich geführte Baustelle"

## Umsetzung in der App

- `textbausteine.js`: alle Bausteine mit Kürzel, Stichwörtern, Häufigkeit und
  Verknüpfungen (`related`).
- **Kürzel-Expansion** wie am Handy-Keyboard: `helm` + Leertaste →
  „Die persönliche Schutzausrüstung, einschließlich des Tragens eines
  Schutzhelmes, ist erforderlich." Weitere: `gas`, `wehren`, `wege`, `gerüst`,
  `leiter`, `dach`, `zaun`, `winter`, `kmf`, `kran`, `polier`, `gut` …
- **KI-Vorschlag**: beim Tippen werden passende Bausteine als Chips
  vorgeschlagen (Stichwort-Treffer + Häufigkeit + eigene Nutzung); verknüpfte
  Bausteine werden mit vorgeschlagen.
- **Foto-Kategorien**: nach dem Anhängen eines Fotos „Was ist am Foto?" –
  die Kategorie liefert die passenden Bausteine (gelernt aus obiger Tabelle).
- **Lernen aus Nutzung**: jede Verwendung eines Bausteins erhöht dessen Rang
  (localStorage), die Liste sortiert sich mit der Zeit nach dem eigenen Gebrauch.

## Erweiterung: Blaue Mappe als Quelle

Zusätzlich ausgewertet: **„Blaue Mappe – Sicherheit am Bau"** (Bundesinnung
Bau / AUVA / BUAK, Ausgabe 2010, aus Google Drive). Daraus übernommen:

- **Gesetzestexte pro Baustein** (Plus-Stufe im KI-Vorschlag), u. a.:
  Zugänge und Wege BauV §§ 6–9, 48 (Blatt B 6) · Flüssiggas BauV § 127
  (B 14, max. Tagesbedarf, Propan schwerer als Luft) · Sanitär BauV §§ 33–37
  (B 8) · Erste Hilfe BauV §§ 31, 32, 41 und Brandschutz §§ 42–47 (B 9/B 10) ·
  Arbeiten im Freien/Winter BauV §§ 27–29, 34–38 (B 12) · Unterweisung
  ASchG § 14 · PSA-Benutzung ASchG § 69 f. (C 1).
- **Allgemeine Punkte** (optional einfügbar, damit ein kurzer Bericht nicht
  leer wirkt): PSA, Erste Hilfe/Feuerlöscher, Verkehrswege, Bauzaun,
  Aushänge, Sanitäreinrichtungen.
- **Symbolbilder** für komplexere Sicherheitsthemen (Absturz, Gasflaschen,
  Leiter, Kran, Dach, KMF, Winterbau, Gerüst) als Inline-SVG.

## Bedienung der neuen Funktionen

- **− / + beim KI-Vorschlag**: Kurzfassung / Normal / mit Gesetzestext.
- Der KI-Vorschlag zeigt **immer 3 Vorschläge** und beschränkt sich auf
  **sicherheitsrelevante** Bausteine.
- **✎ am Eintrag**: bearbeiten (das Textfeld vergrößert sich dabei).
- **„Allg."-Knopf**: allgemeine Punkte auswählen und als Sammel-Eintrag einfügen.
- **Datenbank-Gedächtnis**: Wird ein eingefügter Baustein-Text verändert,
  merkt sich die App die eigene Formulierung (`bp_varianten`) und verwendet
  sie künftig; alle Änderungen landen zusätzlich im Log `bp_aenderungen`
  (Basis für eine spätere echte Datenbank).
