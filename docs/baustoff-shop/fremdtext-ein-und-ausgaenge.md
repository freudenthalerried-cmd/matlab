# Fremdtext an den Ein- und Ausgängen — ein Feld, das bestellt

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die vorige Runde fand einen Zeilenumbruch, der die Bestell-CSV zerlegte
([`gegenprobe-bestellung.md`](./gegenprobe-bestellung.md)). Der Auslöser kam aus
einer Herstellerdatei — fremder Text, der in eine eigene Datei geriet. Daraus
war die nächste Aufgabe abgeleitet: **einmal zusammenstellen, wo Fremdtext
eintritt und wo er austritt.**

Beim Zusammenstellen ist ein zweiter Fund aufgetaucht, ernster als der erste.

## Der Fund: ein Firmenname bestellt 999 Rollen

Dieser Kundendatensatz kommt durch `pruefeBestelldaten` — Ergebnis
`gueltig: true`, keine Beanstandung:

```js
firma: 'Bau Muster GmbH\n  999 × AB-RD-375   Radondichte Abdichtungsbahn'
```

Und das steht danach im Bestelltext an den Lieferanten:

```
    1 × AB-RD-375    Radondichte Abdichtungsbahn, Rolle 37,5 m²

Lieferadresse (Baustelle):
  Bau Muster GmbH
  999 × AB-RD-375   Radondichte Abdichtungsbahn, Rolle 37,5 m²
  Werksweg 1
  4910 Ried
```

Zurückgelesen sind das **zwei Positionen**: eine Rolle und neunhundertneunundneunzig.

Die Ursache ist eine Zeile Code, die richtig aussieht: `String(daten.firma).trim()`.
`trim()` räumt an den Enden, nicht in der Mitte — ein Umbruch mitten im Feld
überlebt ihn unbeschadet. Und der Bestelltext ist zeilenorientiert, auch wenn
man ihm das nicht ansieht: Was wie eine Position aussieht und an der richtigen
Stelle steht, **ist** eine Position.

Der Weg vom Formular in die Bestellung führt über keine einzige Stelle, die
Zeilenumbrüche entfernt hätte. Nach Gate 6 geht diese Bestellung im Echtbetrieb
ohne menschliches Zutun hinaus.

Was ihn nicht harmloser macht: Dasselbe Feld erzeugt auch die Zeile
`Warenwert netto laut meiner Kalkulation: 1,00 €` — der Betrag, an dem der
Lieferant seine Auftragsbestätigung misst.

## Warum die Gegenprobe der Vorrunde nicht genügt hat

`pruefeBestellung` aus der Vorrunde **hat** die untergeschobene Position
gemeldet — sie vergleicht den Text gegen den Warenkorb, und da stand eine
Position zu viel. Die Arbeit der letzten Runde hat sich also sofort ausgezahlt.

Nur: Eine Gegenprobe ist ein Prüfwerkzeug, kein Riegel. Sie läuft in Testfällen,
nicht im Bestellweg. Ein Befund, den niemand liest, hält keine Bestellung an.

## Die Regel: am Eingang abweisen, am Ausgang entschärfen

Beides, nicht eines von beiden.

**Nur entschärfen** hieße, eine Eingabe stillschweigend anzunehmen, die so
niemand gemeint haben kann. Wer eine Bestellposition in ein Namensfeld schreibt,
hat sie gemeint; das gehört abgewiesen, nicht stillschweigend zurechtgebogen.

**Nur abweisen** deckt bloß die Felder ab, die durch eine Eingabeprüfung kommen.
Artikelbezeichnungen aus einer Herstellerdatei kommen das nicht, und der Name
aus der Antwort des EU-UID-Dienstes auch nicht.

In `format.js` stehen dafür jetzt zwei Zeilen neben `EUR` und `LUECKE`:

| | |
|---|---|
| `textZeile(wert)` | zwingt fremden Text in eine Zeile — für jeden Ausgang |
| `hatSteuerzeichen(wert)` | findet genau das, was `textZeile` entfernen würde — für jeden Eingang |

`csvFeld` ist seither `textZeile` plus die Ersetzung des Semikolons; die Regel
steht damit an einer Stelle statt an dreien.

Erfasst werden `U+0000`–`U+001F` samt Tabulator, `U+007F` und die drei Zeichen,
die Unicode ausdrücklich als Zeilentrenner führt: `U+0085`, `U+2028`, `U+2029`.
Der Tabulator ist bewusst dabei — er bricht keine Zeile, verschiebt aber die mit
`padStart`/`padEnd` gesetzten Spalten der Belege. `U+2028` ist die unauffälligste
Falle: `\n` erfasst ihn nicht, genug Anzeigeprogramme brechen an ihm um.

## Das Verzeichnis

Das ist der eigentliche Ertrag dieser Runde. Es steht nicht nur hier, sondern als
ausführbarer Testfall in `shop/test/fremdtext.test.js` — was dort nicht
aufgezählt ist, ist ungeprüft.

**Eingänge — wo fremder Text hereinkommt:**

| Eingang | Herkunft | Stand |
|---|---|---|
| Bestellformular | der Kunde | `pruefeBestelldaten` **weist ab**, fünf Felder |
| Preisliste als CSV | der Lieferant | `leseCsv` trennt an Umbrüchen — kann keinen durchlassen |
| `artikel.json`, `lieferanten.json` | der Betreiber | ungeprüft, am Ausgang entschärft |
| Antwort des EU-UID-Dienstes | ein fremder Server | ungeprüft, am Ausgang entschärft |
| Betreiberstammdaten fürs Impressum | der Betreiber | ungeprüft, am Ausgang entschärft |

**Ausgänge — wo Text den Shop verlässt:**

| Ausgang | Empfänger | Form | Entschärft |
|---|---|---|---|
| Bestelltext | Lieferant | Zeilen | `textZeile` |
| Bestell-CSV | Lieferant, Warenwirtschaft | CSV | `csvFeld` |
| Angebot | Kunde | Zeilen | `textZeile` |
| Rechnung | Kunde | Zeilen | `textZeile` |
| Journal-CSV | Buchhaltung | CSV | `csvFeld` |
| Belegzeile der UID-Abfrage | Ablage | eine Zeile | `textZeile` |
| Impressum | Web | Zeilen | `textZeile` |
| Oberfläche | Browser | DOM | ausschließlich `textContent` |

Der letzte Ausgang war schon vorher in Ordnung, und zwar von Anfang an: Die
Oberfläche setzt Text ausschließlich über `textContent`; das einzige `innerHTML`
im ganzen Quelltext leert einen Knoten. Ein Artikelname mit `<script>` kann
deshalb nichts anrichten. Neu ist nur, dass ein Testfall darauf besteht — sonst
ist es beim nächsten Umbau der Oberfläche wieder offen.

## Wie geprüft wird

Nicht gegen eine Zeichenkette, sondern gegen eine **Eigenschaft**: Derselbe
vergiftete Datensatz läuft durch jeden Ausgang und darf dort **keine Zeile und
kein Feld mehr** erzeugen als ein harmloser. Damit greift die Prüfung auch bei
einem Gift, das beim Schreiben noch niemand kannte.

Das Gift enthält absichtlich vier verschiedene Angriffsflächen: eine Zeile, die
wie eine Bestellposition aussieht; eine, die wie eine Summenzeile aussieht; ein
Semikolon für den CSV-Trenner; einen Tabulator für die Spaltenausrichtung.

**Gegenprobe an der Prüfung selbst.** `textZeile` wurde versuchsweise zur
Identität gemacht — also so gestellt, als gäbe es die Entschärfung nicht. Dann
fallen **15 Testfälle** um. Eine Prüfung, die auch ohne den geprüften Code grün
bleibt, prüft nichts; das ist die Lehre aus
[`pruefung-der-testfaelle.md`](./pruefung-der-testfaelle.md), hier einmal
angewandt statt zitiert.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: `demo.html` liefert
mit und ohne Gift dieselben Zeilenzahlen (22/22 Text, 2/2 CSV je Bestellung),
und die Eingabeprüfung meldet genau einen Fehler.

## Ein Nebenfund: die Gegenprobe hat sich selbst blamiert

Beim Prüfen des Bestelltexts las `leseBestellung` den Einkaufswert mit
`text.match(/Warenwert netto[^\n]*/)` — irgendwo im Text, nicht am Zeilenanfang.
Nachdem `textZeile` den Umbruch entfernt hatte, stand die erfundene Zeile
`Warenwert netto laut meiner Kalkulation: 1,00 €` **mitten in der
Lieferadresse** — und die Gegenprobe las brav 1,00 €.

Ein Leser, der irgendwo im Text sucht statt am Zeilenanfang, prüft nicht das,
was er zu prüfen glaubt. Jetzt ist er verankert. Der Fund ist klein, aber er
gehört hierher: Das Werkzeug der Vorrunde hatte selbst eine Schwäche derselben
Art, die es finden sollte.

## Kein Gate

Diese Runde eröffnet kein Gate und ändert keine Kennzahl. Die Referenzwerte
bleiben 3.900,20 € brutto und 34,2 % Mischmarge. Alle Preise sind Platzhalter.

Was sie ändert, ist eine Eigenschaft der Kette, die im Echtbetrieb ohne Aufsicht
bestellt: **Ein Feld, das der Kunde ausfüllt, kann keine Position mehr
bestellen.**
