# Shop — Funktionsmuster

Lauffähiges Gerüst für den Radonvorsorge-Fachhandel im Streckengeschäft.
Kein Produktivsystem: **alle Preise sind Platzhalter**, es gibt keine
Zahlungsanbindung, keine Rechtstexte und kein Impressum.

## Was funktioniert

| | |
|---|---|
| Katalog | 9 Artikel, 3 Lieferanten, Gruppierung nach Sortimentsbereich |
| Preisrechnung | UVP → Einkauf → Verkauf, Nettopreise mit getrennter Umsatzsteuer |
| Margenprüfung | Gate 1 als Ampel je Artikel und als Mischmarge im Warenkorb |
| Frachtrechnung | je Lieferant, mit Frei-Haus-Grenze und Sperrgutzuschlag |
| Warenkorb | Aufteilung nach Lieferant, Mindestbestellwert je Gruppe |
| Bestellübergabe | je Lieferant eine fertige Bestellung als Text und als CSV |
| Freigabeprüfung | Gate 6 und Gate 7 als harte Sperren vor der Auslösung |
| Preislisten-Import | CSV einlesen, prüfen, mit dem Katalog vergleichen |
| Materialbedarfsrechner | Außenmaße → Stückliste → Warenkorb, mit Verschnittausweis |
| Bestellstrecke | Firmendaten, UID, Unternehmerbestätigung; endet vor der Zahlung |

## Benutzen

```
npm test          # 58 Testfälle
npm run build     # erzeugt demo.html, eine einzelne Datei ohne Abhängigkeiten
npm run import -- <lieferantId> <datei.csv> [--schreiben]
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
src/warenkorb.js        Gruppierung nach Lieferant, Summen, Mischmarge
src/bestellung.js       Bestelltext, CSV, Freigabeprüfung
src/import.js           Preisliste lesen, prüfen, mit dem Katalog vergleichen
src/bedarf.js           Materialbedarf je Gebäude, Rollen- und Gebinderechnung
src/kunde.js            Bestelldaten prüfen, UID, Gate-7-Bestätigung
bin/import.mjs          Kommandozeile dazu, Probelauf als Voreinstellung
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
| Impressum, AGB, Datenschutz | brauchen Firmendaten und anwaltliche Prüfung |
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
