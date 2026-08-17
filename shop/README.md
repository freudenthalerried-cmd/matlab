# Shop — Funktionsmuster

Lauffähiges Gerüst für den Radonvorsorge-Fachhandel im Streckengeschäft.
Kein Produktivsystem: **alle Preise sind Platzhalter**, es gibt keine
Zahlungsanbindung und keine geprüften Rechtstexte. Das Impressum ist als
Gerüst vorhanden und meldet selbst, welche Pflichtangaben ihm fehlen.

## Was funktioniert

| | |
|---|---|
| Katalog | 9 Artikel, 3 Lieferanten, Gruppierung nach Sortimentsbereich |
| Preisrechnung | UVP → Einkauf → Verkauf, Nettopreise mit getrennter Umsatzsteuer |
| Margenprüfung | Gate 1 als Ampel je Artikel und als Mischmarge im Warenkorb |
| Frachtrechnung | je Lieferant, Frei-Haus-Grenze **am Bestellwert**, Sperrgutzuschlag |
| Warenkorb | Aufteilung nach Lieferant, Mindestbestellwert je Gruppe am Bestellwert |
| Bestellübergabe | je Lieferant eine fertige Bestellung als Text und als CSV |
| Freigabeprüfung | Gate 6 und Gate 7 als harte Sperren vor der Auslösung |
| Preislisten-Import | CSV einlesen, prüfen, mit dem Katalog vergleichen |
| Materialbedarfsrechner | Außenmaße → Stückliste → Warenkorb, mit Verschnittausweis |
| Bestellstrecke | Firmendaten, UID, Unternehmerbestätigung; endet vor der Zahlung |
| Messwert-Einordner | Bq/m³ und Messdauer → rechtliche und bautechnische Einordnung |
| Rechtstexte-Gerüst | Pflichtangaben nach § 5 ECG, Lücken maschinenprüfbar |
| Angebot und Rechnung | § 11 UStG mit seinen drei Betragsschwellen, Reihengeschäft erkannt |
| Trockenlauf | elf Schritte durchgezählt: was liefe von selbst, was nicht |
| UID-Abfrage | drei Zustände; ein Dienstausfall ist keine ungültige UID |
| Ablage | Nummernkreise, Storno statt Änderung, Aufbewahrungsfrist |
| Zahlwege | Gebühren je Zahlweg, Wirkung auf Deckungsbeitrag und Monat |
| Kostenbild | Kaskade bis zum Gewinn, umgekehrt der nötige Umsatz |
| Empfindlichkeit | welche der vier Annahmen zuerst gemessen gehört |
| Auswertungsbogen | Herstellerantworten gegen die vier Gate-2-Bedingungen |
| Rückwärtsrechnung | vom marktüblichen Preis zum nötigen Einkauf und Rabatt |
| Gegenprobe | liest den gerenderten Beleg zurück und rechnet ihn nach |

## Benutzen

```
npm test           # 401 Testfälle
npm run build      # erzeugt demo.html, eine einzelne Datei ohne Abhängigkeiten
npm run import -- <lieferantId> <datei.csv> [--schreiben]
npm run pruefe-tests  # prüft die Testfälle darauf, ob sie etwas behaupten
```

`demo.html` lässt sich direkt im Browser öffnen. Der Rechenkern wird beim Bauen
aus `src/` eingebettet, nicht nachgebaut — im Shop läuft dieselbe Logik, die die
Tests prüfen. Eine zweite Preisrechnung im Frontend wäre die sicherste Art,
unbemerkt falsche Preise anzuzeigen.

## Aufbau

```
data/lieferanten.json   Konditionen und Frachtregeln   ← Platzhalter
data/artikel.json       Sortiment mit UVP-Niveaus      ← Platzhalter
src/preis.js            Einkauf, Verkauf, Marge, Fracht
src/vorgang.js          Klammer: alle Papiere eines Geschäfts aus einer Hand
src/abgleich.js         AGB und Datenflüsse gegen das tatsächliche Verhalten
src/warenkorb.js        Gruppierung nach Lieferant, Summen, Mischmarge
src/bestellung.js       Bestelltext, CSV, Freigabeprüfung
src/import.js           Preisliste lesen, prüfen, mit dem Katalog vergleichen
src/bedarf.js           Materialbedarf je Gebäude, Rollen- und Gebinderechnung
src/kunde.js            Bestelldaten prüfen, UID, Gate-7-Bestätigung
src/messwert.js         Messwert einordnen, Bänder und die drei Grenzen
src/rechtstexte.js      Pflichtangaben prüfen, Impressum bauen, AGB-Gliederung
src/beleg.js            Angebot, Rechnung, § 11 UStG, Reihengeschäft
src/auftragslauf.js     Trockenlauf über den ganzen Auftrag, Aufwand je Bestellung
src/vies.js             UID beim EU-System abfragen, Nachweis, drei Zustände
src/ablage.js           Vorgangsakte, Nummernkreise, Storno, § 132 BAO
src/speicher.js         das Gedächtnis der Ablage — Journal aus Zeilen, Wiederaufbau
src/zahlung.js          Zahlwege, Gebühren, Anforderungen an den Anbieter
src/kostenbild.js       Kaskade, nötiger Umsatz, Bestellungen, Sessionbedarf
src/empfindlichkeit.js  Elastizität der vier Annahmen, Kipppunkte
src/auswertung.js       Herstellerantworten prüfen, Preisspielraum, Folgen
src/verhandlung.js      Rückwärts: nötiger Einkauf, nötiger Rabatt, Zielkatalog
src/kontrolle.js        Belegtext zurücklesen und nachrechnen — die zweite Rechnung
src/partnerauswertung.js Partnerantworten auswerten — Gate 9 und 13, Regel vorab
src/format.js           EUR und Lückenmarkierung — einmal, siehe unten
src/gebiet.js           Vorsorgegebiets-Auskunft über die Negativliste (Zwischenlösung)
bin/import.mjs          Kommandozeile dazu, Probelauf als Voreinstellung
bin/testpruefung.mjs    prüft die Testfälle auf Hohlheit — siehe unten
beispiel/               Musterpreisliste — erfundene Preise, nicht schreibbar
test/                   node:test, ohne Fremdpakete
demo-template.html      Oberfläche mit Platzhaltern für Kern und Daten
build-demo.mjs          fügt beides zu demo.html zusammen
```

## Der Materialbedarfsrechner

Außenmaße und Zahl der Durchführungen ergeben eine Stückliste, die direkt in den
Warenkorb geht. Jede Position trägt ihre Begründung, jeder Ansatz steht als
Konstante in `ANSAETZE` — Überlappung 10 %, Verschnitt 5 %, Aufkantung 30 cm,
Rohrabstand 8 m nach ÖNORM S 5280-2.

Sein eigentlicher Zweck steht in `phase4-sortiment-und-materialwert.md`:
Radonfolien werden **nur rollenweise** abgegeben. Für ein Haus mit 12 × 10 m
ergibt das

```
Bahnenbedarf 153,2 m²  →  5 Rollen à 37,5 m² = 187,5 m²
Rollenbindung: 34,3 m² über dem Bedarf (18 %). Teilmengen gibt es nicht.
```

Diesen Satz bekommt der Kunde heute erst an der Kasse zu sehen. Hier steht er
vor der Bestellung — und er erklärt zugleich, warum der tatsächliche Warenkorb
über dem rechnerischen Materialwert je Quadratmeter liegt.

## Der Messwert-Einordner

Bq/m³ und Messdauer ergeben eine Einordnung — **rechtlich und bautechnisch, nicht
gesundheitlich**. Drei Bänder: unter 300 eingehalten, 300 bis 1.000 Sanierung
nach ÖNORM S 5280-3 empfohlen, darüber zusätzlich Planung und
Wirksamkeitskontrolle.

Ein Kurzzeitwert wird **nicht** mit dem Referenzwert verglichen — die
Radonschutzverordnung verlangt dafür mindestens sechs Monate. Er gilt als
Hinweis, nicht als Ergebnis, und führt zur Empfehlung einer Langzeitmessung bei
einer ermächtigten Stelle.

Drei Grenzen gehen mit jeder Ausgabe hinaus, nicht ins Impressum: keine
Gesundheitsaussage, keine Bewertung fremder Messungen als Ergebnis, keine
Sanierungszusage. Ein Testfall prüft das mit einer Wortliste — und er hat beim
ersten Lauf eine eigene Formulierung erwischt, die sich das Risikovokabular
geborgt hatte, um es zu verneinen.

## Die Bestellstrecke

Sie setzt Gate 7 um: Firmenname, Anschrift, Telefon für die Spedition, E-Mail,
**UID im Format ATU + acht Ziffern** und die ausdrückliche Bestätigung, als
Unternehmer zu bestellen. Fehlt eines davon, kommt die Bestellung nicht zustande.

Die UID-Prüfziffer wird gerechnet, aber **nur als Warnung** ausgegeben.
Verbindlich ist die Abfrage beim EU-Informationsaustauschsystem; ein Validator,
der eine gültige UID zurückweist, richtet mehr Schaden an als gar keiner.

Am Ende steht keine Zahlung, sondern die Wahrheit über den Zustand:

```
Es geht nichts hinaus. Offen sind:
· Zahlung nicht eingegangen
· Katalog enthält Platzhalterpreise — keine echten Konditionen
```

Darunter zeigt das Muster die Bestellentwürfe, die im Echtbetrieb an die
Lieferanten gingen — je Lieferant einer, mit Baustellenadresse und der Bitte um
neutrale Verpackung.

## Das Rechtstexte-Gerüst

**Kein Ersatz für Rechtstexte.** Der Anbieter mit Aktualisierungsdienst für
10–25 € im Monat bleibt eingeplant. Das Gerüst benennt die dreizehn
Pflichtangaben nach § 5 ECG und § 14 UGB — zwei davon entfallen ohne
Firmenbucheintrag — und macht die Lücken **maschinenprüfbar**:

```
Impressum unvollständig — 11 Pflichtangaben nach § 5 ECG fehlen.
```

Das Impressum wird trotzdem gerendert, jede fehlende Angabe sichtbar als
`[[ Gewerbebehörde — FEHLT ]]`. Eine Vorlage, die Lücken hübsch verschweigt,
geht irgendwann versehentlich live; diese kann es nicht.

Die AGB-Gliederung hat zehn Punkte, und ihr wichtigster ist eine **Auslassung**:
keine Widerrufsbelehrung. Sie gehört ins Verbrauchergeschäft, und eine AGB, die
beides vermischt, weckt genau den Anschein, den Gate 7 vermeiden soll. Ein
Testfall prüft das Fehlen.

## Angebot und Rechnung

Beide entstehen aus demselben Warenkorb wie die Lieferantenbestellungen und
können deshalb nicht von ihnen abweichen. Die Pflichtangaben folgen § 11 UStG
mit seinen drei Schwellen: bis 400 € brutto genügt die Kleinbetragsrechnung,
über 400 € kommen Nummer, Empfänger und getrennte Steuer dazu, über 10.000 €
die UID des Leistungsempfängers.

Die letzte Schwelle ist hier keine Hürde — Gate 7 verlangt die UID ohnehin bei
jeder Bestellung. Eine Auflage aus dem Konsumentenschutz erfüllt nebenbei eine
Steuerpflicht.

**Streckengeschäft ist Reihengeschäft.** Liefert ein ausländischer Hersteller
direkt an die österreichische Baustelle, kommt die Eingangsrechnung ohne
Umsatzsteuer als innergemeinschaftlicher Erwerb, während die Ausgangsrechnung
20 % trägt. `reihengeschaeftEinordnung()` erkennt das am Feld `land` des
Lieferanten und schreibt es in die Kasse. Ausführlich in
`docs/baustoff-shop/beleg-und-reihengeschaeft.md`.

## Die zweite Rechnung

Die Testfälle prüfen den Warenkorb mit denselben Funktionen nach, die sie
prüfen sollen. `kontrolle.js` geht deshalb einen anderen Weg: Es liest den
**gerenderten Belegtext** zurück und rechnet aus den Zeichen nach.

Das schließt nebenbei eine Lücke — der Kunde sieht nie ein Objekt, er sieht
Zeichen, und den Text hat bis dahin kein Testfall angesehen.

Über 3.402 Belege fand die Gegenprobe **nichts**. Wie viel das wert ist, steht
in `docs/baustoff-shop/zweite-rechnung.md`: Vier der fünf Gleichungen nutzen
dieselbe Arithmetik, die den Beleg erzeugt hat — sie finden Fehler beim
Rendern, nicht beim Rechnen. Unabhängig ist nur eine: Brutto über die Steuer
gegen Brutto als `netto × 1,2`.

## Warum es `npm run pruefe-tests` gibt

Ein Testfall lief einmal grün und prüfte nichts: Seine Behauptung stand hinter
einem `if`, das wegen eines Tippfehlers nie zutraf. Der Prüfer sucht drei
Muster — Testfälle ohne Zusicherung, Zusicherungen nur innerhalb eines `if`, und
Schleifen über Listen, deren Länge vorher nicht zugesichert wurde.

Von 213 Testfällen waren elf verdächtig, alle aus der dritten Kategorie; sie
sind entschärft. Ein Treffer ist begründet abgelehnt und trägt dafür die Zeile
`// pruefung: begruendet` samt Grund.

Der Prüfer läuft **nicht** bei `npm test` mit. Ein Verdacht, der den Testlauf
rot färbt, wird binnen einer Woche stumpf gemacht.

## Die Rückwärtsrechnung

Nicht Einkauf plus Marge ergibt den Verkauf, sondern der marktübliche Verkauf
ergibt den nötigen Einkauf:

```
Rabatt = 1 − (1 − Nachlass) × (1 − Marge)

 0 % Nachlass → 32,0 % Rabatt      (für 38 % Marge: 38,0 %)
10 % Nachlass → 38,8 %             (für 38 % Marge: 44,2 %)
20 % Nachlass → 45,6 %             (für 38 % Marge: 50,4 %)
```

Jeder Prozentpunkt Nachlass kostet mehr als einen Prozentpunkt Rabatt. Das
Verhandlungsziel liegt damit deutlich über der Gate-2-Schwelle von 35 %.

## Der Auswertungsbogen

Die vier Gate-2-Bedingungen als UND-Verknüpfung; drei von vier ist nicht
bestanden. Was nicht beantwortet wurde, gilt als **nicht zugesagt**.

Dabei fällt auf, was ein Rabattsatz wirklich hergibt — der Verkaufspreis ist bei
der UVP gedeckelt, also ist der Rabatt die Obergrenze der Rohmarge:

```
32 % Rabatt →  0,0 % Nachlass möglich
35 % Rabatt →  4,4 %
38 % Rabatt →  8,8 %
```

Die „≥ 35 %" aus Gate 2 sind also kein Puffer, sondern 4,4 Prozentpunkte
Preisspielraum.

## Die Empfindlichkeit der Annahmen

Jede der vier tragenden Annahmen einzeln um zehn Prozent ins Ungünstige,
gemessen am Besucherbedarf:

```
Rohmarge            2.000 → 2.350 Sessions   Elastizität 1,75
Warenkorb netto     2.000 → 2.250            1,25
Umsatzquote         2.000 → 2.223            1,11
Werbekostenanteil   2.000 → 2.100            0,50
```

Die Rohmarge ist der stärkste Hebel und die einzige mit einem **Kipppunkt**:
bei 11,6 % fressen Werbung und Gebühren den ganzen Rohertrag.

## Das Kostenbild

Am Referenzgebäude, mit Kartenzahlung und 10 % Werbekostenanteil:

```
Rohertrag         1.057,37 €   34,2 % Mischmarge
− Werbung           308,82 €
− Zahlungsgebühr     54,85 €
= bleibt            693,70 €   22,5 %
```

Umgekehrt gerechnet ergibt das den nötigen Umsatz und daraus den
Besucherbedarf: **1.900 bis 2.550 Sessions im Monat**, je nach Zahlweg und ob
man mit 35 % Rohmarge rechnet oder mit den 32 %, die Gate 1 zulässt.

## Die Zahlwege

Zahlungsgebühren kamen in der Wirtschaftlichkeitsrechnung nirgends vor. Auf
24.200 € Umsatz netto und 37 Bestellungen gerechnet:

```
Vorkasse              0 €/Monat    0,0 % des Zielgewinns
EPS                 271 €/Monat    5,0 %
Karte 1,4 %         416 €/Monat    7,7 %
PayPal              736 €/Monat   13,7 %
B2B-Rechnungskauf   871 €/Monat   16,2 %
```

Die Gebühr fällt auf brutto an, der Deckungsbeitrag entsteht auf dem Warenwert
netto — aus 1,4 % werden am Referenzgebäude **5,2 % des Deckungsbeitrags**.

## Die Ablage

Die Rechnungsnummer entsteht **erst bei der Ausstellung**. Wer sie schon im
Warenkorb zieht, verbrennt für jeden abgebrochenen Kauf eine — und erklärt die
Lücke später dem Prüfer:

```
Keine Rechnungsnummer vergeben. Pflichtangaben fehlen: … — keine Nummer vergeben
Nummernkreis Rechnungen 2026: 0 vergeben, lückenlos
```

Abgelegte Einträge sind eingefroren; ein Storno ist eine neue Gutschrift, keine
Änderung an der Rechnung (§ 131 BAO). Aufbewahrung sieben Jahre nach § 132 BAO.

Jedes Journalfeld hat seinen Eintrag in `FELDER_DER_ABLAGE` — Rechtsgrundlage
oder ausdrücklich „betrieblich" —, und `pruefeAblagefelder` hält Einträge und
Verzeichnis in beide Richtungen gegeneinander. Ob eine Rechnung storniert ist,
beantwortet `istStorniert` aus der Gutschriftkette; eine Statuszelle im
eingefrorenen Eintrag könnte den Wechsel nie vollziehen.

**Das Gedächtnis** liefert `speicher.js`: Die Ablage schreibt jedes Ereignis —
auch die Nummernvergabe — als eine JSON-Zeile in eine Senke, **bevor** sie
ihren eigenen Zustand ändert; `ausJournal` baut daraus die Ablage wieder auf
und weist dabei jedes Feld ab, das `FELDER_DER_ABLAGE` nicht kennt. Die Senke
wählt der Aufrufer (Betrieb: eine Anhangdatei je Geschäftsjahr, z. B.
`journal-2026.jsonl`). Das Funktionsmuster speichert bewusst nicht — es baut
bei jeder Eingabe den ganzen Ablauf neu und würde sonst erfundene
Geschäftsfälle sammeln.

## Die UID-Abfrage

Drei Zustände, nicht zwei. Der Dienst der Kommission fällt regelmäßig aus, und
ein `MS_UNAVAILABLE` ist keine Aussage über die UID:

```
ungültig gemeldet    → gesperrt, Gate 7 nicht erfüllt
Dienst nicht erreichbar → angehalten, ausdrücklich nicht abgelehnt
bestätigt ohne Abfrage-ID → angehalten, kein vorlegbarer Nachweis
bestätigt mit Abfrage-ID  → läuft weiter
```

Nachweisfähig ist nur die **qualifizierte Bestätigungsanfrage** mit der eigenen
UID im Aufruf — sie liefert die Abfrage-Identifikation. Eine Prüfung, die man
nicht vorlegen kann, ist im Streitfall keine.

Der Dienst ist aus dieser Umgebung nicht erreichbar (403 am Proxy); die
Antwortstruktur ist aus der Dokumentation nachgebildet, **nicht gemessen**. Die
Auswertung behandelt jede unerwartete Antwortform als unbestätigt. In der Kasse
lassen sich alle vier Antworten simulieren.

## Der Trockenlauf

Zehn Schritte von der Bestellung bis zur Buchung. Für jeden wird geprüft, ob er
unter den heutigen Voraussetzungen von selbst liefe — ausgelöst wird nichts:

```
13 Minuten Handarbeit je Bestellung, zwei harte Blockaden.
Blockiert: Zahlungseingang (kein Zahlungsanbieter),
           Rechnung (keine Firmendaten, keine echten Konditionen)
```

Im Vollausbau meldet jeder Schritt „automatisch". Von den sechs
Voraussetzungen dafür sind fünf Verträge, Konten oder Zusagen Dritter; nur die
Produktdatenschnittstelle ist Arbeit, die hier entstehen kann. Ausführlich in
`docs/baustoff-shop/trockenlauf-auftrag.md`.

## Warum `format.js` existiert

Beim Bauen werden alle Module zu einem Skript verbunden und teilen sich einen
Gültigkeitsbereich. Eine Hilfsfunktion `EUR` gab es in zwei Modulen — in
Modulen harmlos, im Bündel ein `SyntaxError`, der die ganze Seite stilllegt.
Die Tests blieben grün, weil sie die Module einzeln laden.

Seither stehen gemeinsame Hilfen einmal in `src/format.js`, und `build-demo.mjs`
prüft das Bündel selbst auf doppelte Deklarationen. Der Wächter fand beim ersten
Lauf sofort eine zweite Kollision.

## Was das Muster bereits zeigt

Die vier Drainageartikel stehen auf **WARN**: Bei 30 % Händlerrabatt ist die
Margenuntergrenze von 32 % nicht erreichbar, der Verkaufspreis stößt an die UVP.
Die Abdichtungs- und Zubehörartikel bei 38–42 % Rabatt tragen sie.

Das ist genau der Befund aus
`docs/baustoff-shop/phase2-lieferantenlandkarte.md` — eine gute Rohrkondition
rettet die Kalkulation nicht, entscheidend ist die Bahn. Im Katalog ist er jetzt
sichtbar, statt in einer Tabelle zu stehen.

## Was fehlt und warum

| Fehlt | Grund |
|---|---|
| Echte Einkaufspreise | entstehen erst aus einem Händlervertrag, siehe `docs/baustoff-shop/anschreiben-entwuerfe.md` |
| Zahlungsanbieter | braucht ein Geschäftskonto auf eine reale Firma |
| Firmendaten fürs Impressum | elf Pflichtangaben, vom Shop einzeln benannt |
| Geprüfte AGB und Datenschutzerklärung | Gliederung steht, der Text braucht Anbieter oder Anwältin |
| UID-Prüfung im Bestellprozess | Auflage aus Gate 7, umzusetzen vor der ersten echten Bestellung |
| Produktbilder und Datenblätter | kommen mit den Herstellerdaten |

## Der Weg für echte Preise

Sobald eine Preisliste eintrifft, wird sie eingelesen statt abgetippt:

```
npm run import -- bahnen-de preisliste.csv            # Probelauf: prüfen und berichten
npm run import -- bahnen-de preisliste.csv --schreiben # übernehmen
npm run build
```

Erwartete Spalten: `sku`, `bezeichnung`, `gruppe`, `einheit`, `menge`,
`uvp_netto`, `ek_netto`, `gewicht_kg`, `sperrgut`. Pflicht sind `sku`,
`bezeichnung` und mindestens eine Preisspalte; Semikolon und Komma werden beide
als Trenner erkannt, ebenso deutsche und englische Dezimalschreibung.

Der Import ist streng, wo Raten teuer wäre, und meldet statt zu raten:
doppelte Artikelnummern, unlesbare Zahlen, Einkaufspreise über UVP. Solange ein
Fehler offen ist, wird nichts geschrieben. Artikel unter 32 % Marge werden
übernommen, aber gewarnt — Gate 1 ist eine Entscheidungsgrundlage, keine
Eingabesperre.

Nur Zeilen mit echtem `ek_netto` bekommen `ekQuelle: "bestaetigt"`. Genau daran
hängt die Sperre in `darfAutomatischAusgeloestWerden`: Erst wenn ein Artikel
einen bestätigten Einkaufspreis trägt, darf eine Bestellung dazu automatisch
hinausgehen. **Gebaut werden muss dafür nichts mehr.**

Dateien unter `beispiel/` lassen sich nicht mit `--schreiben` übernehmen. Sie
enthalten erfundene Preise; würden sie geschrieben, hielte der Shop sie für
bestätigt — die Sperre wäre ausgehebelt, ohne dass es jemand merkt.
