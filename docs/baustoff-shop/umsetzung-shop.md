# Umsetzung — Baustand des Shops

Stand: 2026-08-15. Fortlaufendes Bauprotokoll, keine Analyse. Gate 18 bleibt
unberührt: Die Analysephase ist geschlossen, gebaut wird trotzdem.

Quelltext unter `shop/`, veröffentlichtes Funktionsmuster:
[claude.ai/code/artifact/c40fd35f…](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8)

## Baustand

| Baustein | Stand | Testfälle |
|---|---|---|
| Preis- und Margenrechnung | fertig | 8 |
| Frachtrechnung je Lieferant | fertig | 4 |
| Warenkorb mit Lieferantenaufteilung | fertig | 6 |
| Bestellübergabe als Text und CSV | fertig | 4 |
| Freigabesperren (Gate 6, Gate 7) | fertig | 3 |
| Preislisten-Import | fertig | 14 |
| Oberfläche als eine Datei ohne Abhängigkeiten | fertig | headless geprüft |
| **Summe** | | **36, alle grün** |

## Was zuletzt dazukam: der Weg für echte Preise

Bis hierher war der Katalog handgeschrieben. Das ist genau die Art laufender
Arbeit, die der Auftrag ausschließen sollte — eine Preisrunde des Herstellers,
und jemand tippt.

`shop/src/import.js` liest jetzt eine Lieferantenpreisliste als CSV, prüft sie
und vergleicht sie mit dem bisherigen Katalog. Der Vergleich meldet
Neuzugänge, entfallene Artikel und Preisänderungen mit Prozentsatz — die
monatliche Pflegearbeit aus `phase6-automatisierung.md` erledigt sich damit
beim Einlesen.

**Streng, wo Raten teuer wäre.** Doppelte Artikelnummern, unlesbare Zahlen und
Einkaufspreise über UVP sind Fehler, keine Warnungen; solange einer offen ist,
wird nichts geschrieben. Artikel unter 32 % Marge werden übernommen und
gewarnt: Gate 1 ist eine Entscheidungsgrundlage, keine Eingabesperre.

## Die Sperre, die den Shop ehrlich hält

Nur Zeilen mit echtem Einkaufspreis bekommen `ekQuelle: "bestaetigt"`. Daran
hängt `darfAutomatischAusgeloestWerden`: Solange ein Platzhalter im Warenkorb
liegt, geht keine Bestellung hinaus.

Beim Bauen des Imports ist mir am eigenen Werkzeug ein Loch aufgefallen: Die
Musterpreisliste unter `beispiel/` enthält erfundene Einkaufspreise. Wäre sie
mit `--schreiben` übernommen worden, hätte der Shop erfundene Konditionen für
bestätigt gehalten — und die Sperre wäre weg gewesen, ohne dass es auffällt.
Dateien unter `beispiel/`, `muster/` oder `demo/` lassen sich deshalb nicht
schreiben.

## Was jetzt ohne weiteres Programmieren funktioniert

Sobald eine echte Preisliste eintrifft:

```
npm run import -- <lieferantId> preisliste.csv             # prüfen
npm run import -- <lieferantId> preisliste.csv --schreiben # übernehmen
npm run build
```

Danach stehen echte Preise im Katalog, die Margenampel zeigt die wahre Lage,
und die Bestellsperre fällt für die betroffenen Artikel weg.

## Was weiterhin nur der Auftraggeber liefern kann

| Fehlt | Warum |
|---|---|
| Echte Einkaufspreise | Händlervertrag; Freigabe für die zwölf Anfragen, 0 € |
| Impressum, AGB, Datenschutz | Firmendaten, dann Rechtstexte-Abo 10–25 €/Monat |
| Zahlungsanbieter | Geschäftskonto auf eine reale Firma |
| Domain und Hosting | 35–105 €/Monat |
| UID-Prüfung im Bestellprozess | Auflage aus Gate 7, vor der ersten echten Bestellung |

## Nächste Bausteine, wenn weiter gebaut wird

Nach Nutzen geordnet, alle ohne Freigabe und ohne Ausgabe machbar:

1. **Bestellstrecke im Muster** — Adresseingabe, Unternehmerbestätigung,
   Zusammenfassung; endet bewusst vor der Zahlung.
2. **Materialbedarfsrechner** aus `phase7-inhalte-und-funnel.md` — Grundfläche
   und Durchführungen ergeben eine Stückliste, die in den Warenkorb geht. Rechnet
   auch Rollen und Verschnitt aus, die Schwachstelle des Wettbewerbers.
3. **Gebietsabfrage** nach `phase10-datengrundlage-gebietsabfrage.md` — braucht
   die Gemeindeliste, die aus dieser Umgebung nicht abrufbar ist.
