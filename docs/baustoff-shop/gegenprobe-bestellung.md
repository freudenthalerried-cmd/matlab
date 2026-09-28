# Die Gegenprobe an der Lieferantenbestellung — diesmal mit Fund

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die vorige Runde hat den **Beleg an den Kunden** zurückgelesen und nichts
gefunden ([`zweite-rechnung.md`](./zweite-rechnung.md)). Diese Runde liest die
**Bestellung an den Lieferanten** zurück — und findet etwas.

## Warum gerade diese Bestellung

Von allen Papieren, die der Shop erzeugt, ist die Lieferantenbestellung das
einzige, das **Ware bewegt**. Eine falsche Zahl auf der Kundenrechnung kostet
Geld und lässt sich mit einer Gutschrift heilen. Eine falsche Menge in der
Bestellung kostet Geld **und** eine Palette, die auf einer fremden Baustelle
steht und zurückgeholt werden muss — im Streckengeschäft an eine Adresse, die
dem Lieferanten gehört, nicht mir.

Dazu kommt die Betriebsart. Nach Gate 6 geht diese Bestellung im Echtbetrieb
**ohne menschliches Zutun** hinaus; das ist der ganze Sinn der automatischen
Übergabe. Was niemand vor dem Absenden ansieht, muss vorher stimmen.

Geprüft wurde bisher: dass der Warenkorb richtig aufteilt (6 Testfälle), dass
die Übergabe Text und CSV erzeugt (4 Testfälle), dass die Freigabesperren
greifen (3 Testfälle). Nicht geprüft wurde, ob in Text und CSV **dieselben
Mengen und Artikelnummern** stehen wie im Warenkorb.

## Wie die Gegenprobe arbeitet

`shop/src/kontrolle.js` bekommt drei neue Funktionen: `leseBestellung` liest die
Positionen aus dem Bestelltext zurück, `leseBestellCsv` aus der CSV,
`pruefeBestellung` vergleicht **paarweise gegen den gerechneten Warenkorb**.

Drei Quellen, die getrennt entstehen: die gerechnete Teillieferung, der Text für
den Menschen, die Datei für die Maschine. Sie müssen dieselben Mengen und
dieselben Artikelnummern führen. Zusätzlich prüft die Gegenprobe zwei Dinge, die
nur die CSV betreffen:

* **Feldzahl je Zeile gegen Spaltenzahl im Kopf.** Eine Zeile mit zu wenigen
  oder zu vielen Feldern ist verrutscht — dann steht die Menge in einer anderen
  Spalte, und beim Lesen fällt es niemandem auf.
* **Lesbarkeit der Menge.** Ein `NaN` in der Mengenspalte ist kein Formfehler,
  sondern eine Bestellung ohne Menge.

Wie schon beim Beleg gilt: Was nicht im Text steht, wird nicht ergänzt. Fehlt
eine Position, meldet die Prüfung sie als fehlend, statt sie zu erraten.

## Der Fund

Eine Artikelbezeichnung mit **Zeilenumbruch** zerlegt die Bestell-CSV in zwei
Zeilen. Die zweite wird beim Zurücklesen zu einer Geisterposition:

```
CSV führt Bau Muster GmbH×NaN, ZB-DB-150×2, der Warenkorb ZB-DB-150×2
CSV-Zeile mit 4 Feldern bei 8 Spalten — verrutscht
```

Aus einer Position werden zwei. Die zweite trägt den Lieferantennamen als
Artikelnummer, eine Postleitzahl als Bezeichnung und keine lesbare Menge. Ein
Warenwirtschaftssystem am anderen Ende liest das nicht als Fehler, sondern als
Zeile — und was es daraus macht, entscheidet nicht mehr dieser Shop.

Der Auslöser muss nicht exotisch sein. Herstellerbezeichnungen kommen aus
Preislisten, Preislisten kommen als CSV oder Excel, und dort steht ein
Zeilenumbruch in einer langen Bezeichnung ohne jede Absicht. Der
Preislisten-Import ist bereits gebaut (14 Testfälle) — der Weg von der fremden
Datei in die eigene Bestellung ist also offen.

## Die Asymmetrie ist der eigentliche Befund

`shop/src/ablage.js` hat Zeilenumbrüche **von Anfang an** entschärft. Die
Journal-CSV für die Buchhaltung war nie betroffen.

`shop/src/bestellung.js` hat es nicht getan — ausgerechnet in der Datei, die
Ware bewegt. Dieselbe Überlegung war beim Journal da und bei der Bestellung
nicht, im selben Quelltext, von derselben Hand.

Das ist die lehrreichere Hälfte des Funds. Es war kein Wissenslücke und keine
Nachlässigkeit an einer nebensächlichen Stelle, sondern eine Sorgfalt, die an
einer Stelle griff und an der wichtigeren nicht. Gegen so etwas hilft keine
zusätzliche Aufmerksamkeit — nur eine Stelle, an der die Regel einmal steht.

## Die Behebung

`csvFeld()` steht jetzt in `shop/src/format.js`, neben `EUR` und `LUECKE`, und
wird von `bestellung.js` und `ablage.js` benutzt. Semikolon wird zu Komma,
Zeilenumbruch zu Leerzeichen.

Warum dort und nicht in beiden Dateien: Das Bündel `demo.html` teilt einen
Gültigkeitsbereich. Zwei gleichnamige Hilfsfunktionen ergeben dort einen
SyntaxError, der die ganze Seite stillegt, während die Tests grün bleiben — der
Fehler aus der ersten Runde. Der Kollisionswächter im Build hätte eine doppelte
`csvFeld` sofort gemeldet.

Ein bewusster Verzicht: Die richtige CSV-Regel wäre RFC 4180 — Feld in
Anführungszeichen, enthaltene Anführungszeichen verdoppelt. Das erhält den
Inhalt, statt ihn zu verändern. Ersetzen ist der gröbere Weg, aber der, der in
jedem Lesegerät ankommt; ein Import, der Quotes nicht versteht, verrutscht
wieder. Solange kein Lieferant seine Schnittstelle benannt hat, ist die
robustere Regel die richtige. Steht ein Format fest, gehört das hierher
zurückgeholt.

## Was die Gegenprobe danach gefunden hat

Nichts mehr:

| | |
|---|---|
| Warenkörbe | 2.044 (alle 511 Teilmengen des Sortiments × 4 Mengenstufen) |
| erzeugte Lieferantenbestellungen | 5.248 |
| Abweichungen zwischen Warenkorb, Text und CSV | 0 |

Dazu 6 neue Testfälle, die den Text und die CSV absichtlich verfälschen —
Menge geändert, Artikelnummer geändert, Position gelöscht, Zeilenumbruch
eingebaut — und prüfen, dass die Gegenprobe es meldet. Ohne diese Testfälle
wäre die Null oben wertlos: Eine Prüfung, die nie etwas findet, ist von einer
Prüfung, die nichts finden **kann**, nicht zu unterscheiden.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: `demo.html` erzeugt
mit einer Lieferadresse, die absichtlich einen Zeilenumbruch enthält, weiterhin
zwei Bestellungen mit je einer CSV-Position. Kopf plus eine Zeile, keine
Geisterposition.

## Das Muster über vier Runden

| Runde | grüne Testfälle | was trotzdem falsch war | was es fand |
|---|---|---|---|
| 1 | 155 | `demo.html` startete nicht | Kollisionswächter im Build |
| 2 | 213 | elf Testschleifen prüften nichts | Prüfer für die Testfälle |
| 3 | 213 | den Belegtext sah niemand an | Gegenprobe am Beleg (fand nichts) |
| 4 | 227 | die Bestell-CSV zerbrach an einem Zeichen | Gegenprobe an der Bestellung |

Die dritte Runde fand nichts, die vierte etwas. Beide waren dieselbe Arbeit;
welche von beiden fündig wird, weiß man vorher nicht. Das ist der Grund, die
Reihe fortzusetzen, statt sie nach einem negativen Ergebnis einzustellen.

Ungeprüft bleibt weiterhin die oberste Ebene: **ob die Zahlen zur Wirklichkeit
passen.** Alle Preise sind Platzhalter. Dagegen hilft kein Werkzeug, sondern nur
eine Antwort von einem Hersteller — und die hängt an der ausstehenden Freigabe
für die zwölf Anschreiben.

## Kein Gate

Diese Runde eröffnet kein Gate und ändert keine Kennzahl. Die Referenzwerte
bleiben 3.900,20 € brutto und 34,2 % Mischmarge. Es ist ein behobener Fehler in
einer Kette, die im Echtbetrieb ohne Aufsicht bestellt — mehr nicht, und das ist
genug.
