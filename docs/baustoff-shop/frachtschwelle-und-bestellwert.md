# Die Schwelle stand auf der falschen Seite

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Vorgenommen war die **Klammer zwischen den Zahlen des Kunden und denen des
Lieferanten**: Bisher entstehen Kundenrechnung und Lieferantenbestellung
nebeneinander, und niemand hält sie gegeneinander. Die erste Klammer, die
gespannt wurde — die Fracht — hat sofort etwas gefunden, und zwar nicht in der
Klammer, sondern in der Rechnung darunter.

## Der Fund

`preis.js` entschied die Frachtfreiheit so:

```js
const warenwertNetto = cent(positionen.reduce((s, p) => s + p.vkNetto * p.menge, 0));
if (regel.freiHausAbNetto != null && warenwertNetto >= regel.freiHausAbNetto) { … }
```

`vkNetto` ist der **Verkaufspreis an den Kunden**. `freiHausAbNetto` ist eine
Kondition des **Lieferanten uns gegenüber** — die Frage im Anschreiben lautet
wörtlich: „Wie hoch ist der Mindestbestellwert, und ab welchem Auftragswert
liefern **Sie** frachtfrei?" Gemeint ist der Wert unserer Bestellung, also der
Einkaufswert.

Die Schwelle wurde damit auf der falschen Seite des Geschäfts gemessen. Bei
35 % Zielmarge liegen die beiden Beträge rund 54 % auseinander.

Dasselbe gilt für den Mindestbestellwert: `mindestbestellwertErfuellt` bekam den
Verkaufswert übergeben und meldete `bestellbar: true`, während die Bestellung
beim Lieferanten unter dessen Grenze lag.

## Was das kostet

Der Fehler geht **immer in dieselbe Richtung**. Der Verkaufswert ist stets
größer als der Einkaufswert, also wird jede Schwelle zu früh erreicht — nie zu
spät. Es gibt keinen Fall, in dem er zugunsten des Betriebs wirkt.

**Bei der Fracht:** Der Shop weist dem Kunden „frei Haus" aus und verrechnet
0 €, der Lieferant stellt die Pauschale trotzdem in Rechnung. Die Differenz geht
aus der Marge, und zwar unbemerkt — auf keinem Beleg steht sie.

| Lieferant | Schwelle | galt bisher ab | gilt jetzt ab | Fenster im Verkaufswert |
|---|---|---|---|---|
| Rohrhersteller Österreich | 1.500 € Bestellwert | 1.500,00 € | 2.142,86 € | 1.500–2.143 € |
| Abdichtungsbahnen-Hersteller | 1.200 € Bestellwert | 1.200,00 € | 1.846,15 € | 1.200–1.846 € |
| Zubehör- und Dichtsysteme | 600 € Bestellwert | 600,00 € | 923,09 € | 600–923 € |

Über 3.066 durchgerechnete Warenkörbe fielen **1.024 Teillieferungen** in eines
dieser Fenster, mit zusammen **76.736 € selbst getragener Fracht**. Der größte
Einzelfall: 150 € auf einer Teillieferung mit 487,50 € Deckungsbeitrag — knapp
**31 % des Rohertrags dieser Lieferung**, weg an einer Zeile Code.

Der Warenkorb trug dazu bisher den Kommentar: *„Die Fracht wird an den Kunden
weitergegeben und ist damit margenneutral."* Das stimmt — aber nur, wenn die
weitergegebene Fracht dieselbe ist, die der Lieferant verlangt. Genau das war
nicht der Fall.

**Beim Mindestbestellwert:** 928 Teillieferungen wurden als bestellbar gemeldet,
obwohl der Lieferant sie zurückgewiesen hätte. Das ist der Gate-6-Fall in
Reinform — Geld genommen, Bestellung nicht platzierbar. Beispiel aus dem
Sortiment: 2 × DR-100-050 sind 330 € Verkauf und 231 € Einkauf; die Grenze liegt
bei 250 €. Am Verkaufswert gemessen geht die Bestellung durch, am Bestellwert
nicht.

## Am Referenzgebäude ändert sich nichts

Das ist keine Entwarnung, sondern der Grund, warum der Fehler so lange stehen
konnte: Am durchgerechneten Referenzgebäude liegen Verkaufs- und Bestellwert
jeder Teillieferung auf **derselben Seite** ihrer Schwelle.

| Teillieferung | Verkauf | Einkauf | Schwelle | Fracht |
|---|---|---|---|---|
| Abdichtungsbahnen | 2.118,34 € | 1.376,92 € | 1.200 € | 0 € — auch am Einkauf über der Schwelle |
| Rohre | 470,00 € | 329,00 € | 1.500 € | 150 € — beide darunter |
| Zubehör | 499,83 € | 324,88 € | 600 € | 12 € — beide darunter |

**3.900,20 € brutto, 162,00 € Fracht, 34,2 % Mischmarge bleiben gültig.** Alle
Kennzahlen der Analyse, die daran hängen — Rohertrag 1.057,37 €, 22,5 % nach
Werbung und Gebühren, der Sessionbedarf von 1.900–2.550 — sind unberührt.

Ein einzelnes durchgerechnetes Beispiel prüft eine Rechnung nur an einem Punkt.
Es war ein Punkt, an dem der Fehler nicht sichtbar wurde.

## Die Klammer, die den Fund gemacht hat

`kontrolle.js` bekommt `pruefeFrachtdeckung`. Sie hält die beiden Seiten
gegeneinander: was der Kunde für Fracht zahlt gegen das, was der Lieferant nach
seinen Konditionen verlangt.

Sie ist bewusst **unabhängig** gebaut, in derselben Art wie die Gegenprobe am
Beleg: Sie rechnet nicht mit `warenkorb.js`, sondern liest den **Bestellwert aus
dem gerenderten Bestelltext** zurück und legt die Konditionen aus
`lieferanten.json` darauf an. Wäre sie aus derselben Funktion gespeist worden,
die den Fehler gemacht hat, hätte sie ihn bestätigt statt gefunden.

Zwei Verfahren, dasselbe Ergebnis:

| | Fälle | Summe |
|---|---|---|
| unabhängiger Durchlauf über 3.066 Warenkörbe | 1.024 Teillieferungen | 76.736 € |
| `pruefeFrachtdeckung` über 7.872 Bestellungen, Fehler künstlich wieder eingebaut | 1.024 | −76.736 € |

Nach der Behebung: **0 ungedeckte Teillieferungen** über alle 7.872 geprüften
Bestellungen.

## Behoben

- `fracht()` liefert jetzt `warenwertNetto` **und** `bestellwertNetto` und
  entscheidet die Schwelle am zweiten. Der Grundtext sagt es mit:
  „frei Haus ab 1.200 € **Bestellwert**".
- `mindestbestellwertErfuellt()` heißt seinen Parameter jetzt `bestellwertNetto`
  und gibt ihn im Ergebnis zurück. Der Hinweis an den Kunden nennt den
  erreichten Bestellwert, nicht nur den Fehlbetrag — ein Fehlbetrag ohne
  Bezugsgröße lässt sich nicht nachrechnen.
- `warenkorb.js` übergibt den Bestellwert statt des Warenwerts.
- Zehn neue Testfälle halten beide Seiten fest, darunter zwei, die genau das
  Fenster besetzen, in dem der Fehler saß.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: 4 × Abdichtungsbahn
sind 1.420,56 € Verkauf, 923,36 € Einkauf und tragen jetzt 135 € Fracht statt
0 €; 6 × dieselbe Bahn erreichen mit 1.385,04 € Einkauf die Schwelle wirklich
und sind frachtfrei; 2 × Drainagerohr sind nicht mehr `bestellbar`.

## Kein Gate, aber ein Nachtrag zur Auswertung

Kein neues Gate. Die Zahlen der Analyse bleiben, wie sie sind.

Ein Nachtrag gehört aber in die Auswertung der Herstellerantworten: **Bei jeder
genannten Schwelle ist zu klären, worauf sie sich bezieht** — auf den
Nettobestellwert nach Händlerrabatt oder auf den Listenwert. Der Unterschied ist
bei 42 % Rabatt fast ein Faktor zwei, und eine Antwort, die das offen lässt,
lässt genau die Frage offen, an der diese Runde hängengeblieben ist. Nachgetragen
in [`auswertungsbogen-hersteller.md`](./auswertungsbogen-hersteller.md).

Alle Preise sind weiterhin Platzhalter. Die Konditionen, an denen hier gerechnet
wird, hat kein Lieferant bestätigt — auch die Schwellen nicht.
