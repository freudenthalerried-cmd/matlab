# Siebzehn Module fuhren bei jedem Seitenaufruf mit

Stand: 2026-08-29

## Gemessen, nicht vermutet

Das ausgelieferte `shop.js` trug alle 22 Module des Rechenkerns. Die
Oberfläche benutzt Exporte aus **fünf** davon:

| Modul | Exporte | davon in `shop-ui.js` benutzt |
| --- | --- | --- |
| `shopkern.js` | 22 | 15 |
| `gebinde.js` | 10 | 2 |
| `kundenanfrage.js` | 4 | 2 |
| `format.js` | 5 | 1 |
| `liefergebiet.js` | 4 | 1 |
| **die übrigen 17** | **103** | **0** |

Mitgefahren sind unter anderem: Rechnungsstellung (`beleg.js`), die
UID-Abfrage beim EU-Register (`vies.js`), Mahnwesen und Aktenablage
(`auftragslauf.js`, `ablage.js`), Skonto und Zahlwege, das Kostenbild — und
`bedarf.js`, der Materialbedarfsrechner für die **Radonvorsorge**, also für
ein Sortiment, das dieser Shop seit dem 22. August nicht mehr führt.

## Zwei Gründe, und der zweite wiegt schwerer

**Gewicht.** Ein Bauleiter lädt die Seite auf der Baustelle, nicht im Büro.

**Was im Browser steht, ist veröffentlicht.** `kostenbild.js` rechnet den
Deckungsbeitrag, `skonto.js` die Zahlungsbedingungen, `preis.js` trägt die
Margenregel und die Deckelung am Listenpreis. Keine dieser Dateien enthält
eine Einkaufszahl — aber sie enthalten die **Methode**, und die gehört dem
Betrieb.

Das ist die Fortsetzung des Fundes von heute früh
(`kommentare-im-schaufenster.md`): Dort hat der Kommentarentferner die
*Erklärung* der Kalkulation aus der Ausgabe genommen. Hier verschwindet die
*Rechnung selbst*.

## Das Ergebnis

| Datei | vorher | nachher |
| --- | --- | --- |
| `ausgabe/site/shop.js` | 202 KB | **117 KB** |
| `ausgabe/website.html` | 1482 KB | **1412 KB** |

Zusammen mit dem Kommentarentferner von heute früh: 293 KB → 117 KB, also
**60 Prozent weniger** auf jedem Seitenaufruf.

## Eine Zeile Code, die vier Module mitzog

Die erste Hüllenrechnung ergab sieben Module statt fünf: `warenkorb.js` und
`preis.js` waren dabei. Der Grund war ein einziger Import:

```js
import { istMenge } from './warenkorb.js';   // in shopkern.js
```

`istMenge` sind vier Zeilen. Sie zogen `warenkorb.js` (8,5 KB) und über
dessen Import `preis.js` (7,9 KB) mit — **einschließlich der Margenregel.**
Die Funktion ist heute Vormittag in `warenkorb.js` entstanden, weil sie dort
gebraucht wurde; sie gehört aber zu den Gebindegrößen und steht jetzt in
`gebinde.js`. Danach war die Hülle fünf Module groß.

Eine Zeile Import kann teurer sein als das, was sie holt.

## Die Liste ist von Hand geführt und maschinell geprüft

Eine handgeführte Liste läuft dem Code davon. Deshalb rechnet
`importhuelle()` die tatsächliche Hülle aus, und ein Test verlangt, dass sie
**genau** `BROWSERMODULE` ist. Importiert eines dieser Module eines Tages
etwas Neues, fällt es auf, statt still wieder mitzufahren.

Zwei weitere Tests:

- Namentlich benannte Module, die **draußen** bleiben — `preis.js`,
  `kostenbild.js`, `skonto.js`, `zahlung.js`, `beleg.js`, `ablage.js`,
  `vies.js`, `bestellung.js`, `auftragslauf.js`, `rechtstexte.js`,
  `kunde.js`, `bedarf.js`, `warenkorb.js` — und namentlich benannte, die
  drin sein müssen. Eine Liste, die nur eine Richtung prüft, ist mit einem
  leeren Bündel zufrieden.
- Das **gebaute** `shop.js` darf `berechneWarenkorb`, `erzeugeBestellungen`,
  `pruefeUid`, `traegtSichSelbst`, `erzeugeImpressum` und `materialbedarf`
  nicht enthalten — und muss `kundenWarenkorb` und `baueKundenanfrage`
  enthalten, sonst prüfte der Test eine leere Datei.

Gegengeprobt durch Aufnahme von `kostenbild.js` in die Liste: zwei Testfälle
fallen.

## Was unverändert bleibt

Das Funktionsmuster `demo.html` bekommt weiterhin den **vollen** Kern — es
zeigt Bestellwesen und Materialbedarf, dafür ist es da, und seine Preise sind
Platzhalter. Zwei Bündel, zwei Zwecke, eine Quelle.
