# Ganze Quadratmeter gibt es bei dieser Platte nicht

Stand: 2026-08-29

## Der Befund

Der Warenkorb ließ ausschließlich ganze Mengen zu:

```js
if (!Number.isInteger(zeile.menge) || zeile.menge < 1) {
  throw new Error(`Ungültige Menge für ${zeile.sku}`);
}
```

Für Stückgut ist das richtig. Für Flächenware ist es genau verkehrt herum:

| Artikel | Abgabe in | 1 m² sind | 4 Platten sind |
| --- | --- | --- | --- |
| XPS glatt SF 30 mm 0,75 m2 | Platten zu 0,75 m² | 1,33 Platten | **3,00 m²** |
| Fassaden EPS 3 cm 0,5 m2 | Platten zu 0,5 m² | 2 Platten | 2,00 m² |
| Isover TDPT 20 … 8,64 m2 | Paketen zu 8,64 m² | 0,12 Pakete | 34,56 m² |
| Capatect Glasgewebe M … 55 m2 | Rollen zu 55 m² | 0,02 Rollen | 220 m² |

Bei der XPS-Platte ist **jeder ganze Quadratmeter unlieferbar** — und die
alte Regel ließ ausschließlich ganze Quadratmeter zu. Der Warenkorb erlaubte
also genau die Mengen, die es nicht gibt, und wies genau die zurück, die es
gibt.

Das ist die Fortsetzung des Kilogramm-Falls von heute Vormittag
(`ein-kilogramm-von-einem-sack.md`), und dort steht im Quelltext noch der
Satz, der den Fehler festgehalten hat:

> „Ein gebrochener Schritt wäre im Mengenfeld nicht ganzzahlig, und der
> Warenkorb rechnet nur mit ganzen Mengen."

Die Begründung war die Einschränkung selbst. Sie hat den zweiten, größeren
Fall verdeckt: zehn Artikel statt fünf.

## Was geändert wurde

**Im Rechenkern** tritt `istMenge()` an die Stelle von `Number.isInteger`:
jede positive Zahl mit höchstens zwei Nachkommastellen. Zwei, weil in ihnen
die Gebinde aufgehen (0,5 · 0,75 · 8,64 · 25) und in ihnen eine Rechnung
stellbar ist. Was darüber hinausgeht, ist keine Menge, sondern ein
Tippfehler; `1,005` fliegt weiterhin.

Die Regel steht **einmal**, in `warenkorb.js`, und `shopkern.js` ruft sie auf
— an vier Stellen, an denen vorher viermal `Number.isInteger` stand.

**Im Mengenfeld** ist `min`, `value` und `step` die Gebindegröße:
`step="0.75"` mit Punkt im Attribut, mit Komma im Satz darunter. Der Knopf
las die Menge bis dahin mit `parseInt` — aus „0,75" wurde eine 0 und daraus
eine 1. Er las damit ausgerechnet den Wert falsch, den er selbst
hingeschrieben hatte.

**Im Warenkorb** dieselbe Regel, aufgerundet statt ab, und die Korbzeile sagt
jetzt, was hinter der Zahl steckt: „5,23 € je m², netto · 7 Einheiten zu
0,75 m²". Der Kunde bestellt Platten; die Rechnung führt Quadratmeter.

**Was nicht erfunden wird.** Gesucht wird ausschließlich ein ausdrückliches
`m2`. „Grundmauerschutz 20 **1,5 m**" und „Baumit TextilglasGitter
**1,1x50 m**" tragen Meter — eine Bahnbreite und ein Rollenmaß. Dass 1,1 × 50
rechnerisch 55 m² ergibt, ändert nichts: Was die Bezeichnung nicht sagt, sagt
sie nicht. Beide behalten das freie Mengenfeld.

Damit haben **15 von 46 Artikeln** einen Gebindeschritt: 5 nach Gewicht, 10
nach Fläche.

## Geprüft und gegengeprobt

818 Testfälle, darunter neu:

- `istMenge`: 0,75 und 8,64 sind gültig, 1,005 und 0 und −2 nicht.
- Der Korb aus dem Speicher: 2,5 wird nicht mehr verworfen, 2,5001 schon.
- `gebindeM2` liest nur ausdrückliche Quadratmeter, und bei zwei Angaben
  nichts.
- `gebindezahl(5; 0,75)` ergibt 7 Stück, 5,25 m², geht nicht auf.
- Am Bestand: **beide** Einheiten müssen unter den Artikeln mit Schritt
  vorkommen — sonst prüft der Test nur einen Fall.

Zwei Browserszenarien mehr (43 insgesamt): Eine Platte kommt als 0,75 m² in
den Korb, und fünf eingetippte Quadratmeter werden zu 5,25 m² für sieben
Platten.

| Gegenprobe | Ergebnis |
| --- | --- |
| `istMenge` gibt immer `true` zurück | 3 Testfälle fallen |
| Flächenschritt abgeschaltet | 2 Browserszenarien fallen |

## Was offen bleibt

Der Preis ist weiterhin der Quadratmeterpreis, nicht der Plattenpreis. Für
den Vergleich ist das richtig — die Tafel „Was ein Zentimeter Stärke kostet"
rechnet damit. Ob auf der Artikelseite zusätzlich der Plattenpreis stehen
soll, wie bei Sackware der Gebindepreis, ist eine Frage der Darstellung und
noch offen.

Und: Dass ein als „0,75 m2" benanntes Gebinde nur ganz abgegeben wird, ist
dieselbe Annahme wie beim Sack. Sie steht als Annahme im Quelltext, nicht als
Tatsache.
