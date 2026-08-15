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

## Benutzen

```
npm test          # 22 Testfälle
npm run build     # erzeugt demo.html, eine einzelne Datei ohne Abhängigkeiten
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
test/                   node:test, ohne Fremdpakete
demo-template.html      Oberfläche mit Platzhaltern für Kern und Daten
build-demo.mjs          fügt beides zu demo.html zusammen
```

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

Sobald echte Konditionen vorliegen, werden sie in `data/lieferanten.json`
eingetragen und `ekQuelle` je Artikel auf `bestaetigt` gesetzt. Damit fällt die
Sperre in `darfAutomatischAusgeloestWerden` weg — gebaut werden muss dafür
nichts mehr.
