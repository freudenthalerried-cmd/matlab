# Die zweite Rechnung — und ein Ergebnis, das keines ist

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/kontrolle.js`,
14 Testfälle.

Der Prüfer für die Testfälle hat gezeigt, wo grüne Tests nichts aussagen.
Dieselbe Frage stellt sich für die Rechnung selbst: Die Testfälle prüfen den
Warenkorb mit denselben Funktionen nach, die sie prüfen sollen. Ein Denkfehler,
der in beide Richtungen gleich falsch ist, fällt dabei nicht auf.

## Der andere Weg: den Beleg zurücklesen

Die Gegenprobe geht deshalb über den **gerenderten Belegtext**. Sie kennt weder
`warenkorb.js` noch `preis.js`, sondern nur Zeichen und die vier
Grundrechenarten: Sie liest die Positionszeilen, die Frachtzeilen und den
Summenblock aus dem Text und rechnet nach, ob das zusammenpasst.

Das prüft zugleich etwas, das bisher **niemand geprüft hat**: Der Kunde sieht
nie ein Objekt, er sieht Zeichen. Eine Position, die aus dem Text fällt, ein
Betrag, der beim Formatieren verlorengeht — davon hätte keiner der 213
Testfälle etwas bemerkt, weil sie alle Objekte vergleichen.

Fünf Gleichungen, jede einzeln gemeldet:

```
Summe der Positionszeilen  = Warenwert netto
Summe der Frachtzeilen     = Fracht netto
Warenwert + Fracht         = Summe netto
20 % von Summe netto       = Umsatzsteuer
Summe netto + Steuer       = Gesamtbetrag
```

## Das Ergebnis: nichts gefunden

**3.402 Belege durchgerechnet** — jeder Artikel mit jeder Menge von eins bis
sieben, kombiniert mit jedem zweiten Artikel, über sechs verschiedene
Zielmargen. Kein einziger Beleg war in sich unstimmig, keiner wich vom
Warenkorb ab.

Dazu **19.440 Warenkörbe** für die eine Gleichung, die wirklich unabhängig ist
(dazu gleich mehr). Ebenfalls keine Abweichung.

Das ist ein negatives Ergebnis, und es gehört als solches dagestanden. Die
Rechnung ist nicht besser geworden; es ist nur weniger wahrscheinlich, dass sie
falsch ist.

## Wie viel dieses Ergebnis wert ist

Weniger, als es klingt — und das ist der eigentliche Inhalt dieses Dokuments.

**Vier der fünf Gleichungen sind nicht unabhängig.** Sie prüfen mit derselben
Arithmetik, die den Beleg erzeugt hat. Ihr Wert liegt woanders: Sie finden
Fehler beim **Rendern**, nicht beim Rechnen. Genau das zeigen die Testfälle, die
den Text absichtlich verfälschen — eine gelöschte Positionszeile, ein
verfälschter Gesamtbetrag, eine falsch gerundete Steuer werden alle gefunden.

**Eine Gleichung ist wirklich unabhängig.** Der Bruttobetrag entsteht im
Warenkorb als `netto + gerundete Umsatzsteuer`; die Gegenprobe rechnet ihn als
`netto × 1,2`. Zwei Wege, zwei Rundungen — und sie können sich um einen Cent
unterscheiden. Über 19.440 Warenkörbe tun sie es nicht.

Der eine Cent ist keine Spitzfindigkeit: Er landet auf einer Rechnung, und eine
Rechnung, deren Summen sich um einen Cent widersprechen, ist ein
Rechnungsmangel nach § 11 UStG.

**Was die Gegenprobe nicht kann:** Steht überall derselbe falsche Preis, geht
die Rechnung trotzdem auf. Innere Stimmigkeit ist nicht Richtigkeit. Deshalb
gibt es den zweiten Schritt — den Abgleich mit dem Warenkorb —, und deshalb
bleibt die eigentliche Wahrheit die, die seit dem ersten Tag im Katalog steht:
**Alle Preise sind Platzhalter.** Eine perfekt aufgehende Rechnung über
erfundene Beträge ist immer noch erfunden.

## Was daran zur Gewohnheit werden sollte

Die drei Befunde der letzten Runden ergeben zusammen ein Muster:

| Was grün war | Was trotzdem kaputt war |
|---|---|
| 155 Testfälle | `demo.html` startete gar nicht — Namenskollision im Bündel |
| 213 Testfälle | elf Schleifen prüften bei leerer Liste nichts |
| 213 Testfälle | der gerenderte Belegtext wurde von keinem geprüft |

Dreimal half nicht mehr Sorgfalt, sondern ein Werkzeug, das die Sorgfalt nicht
braucht: der Kollisionswächter im Bauschritt, der Prüfer für die Testfälle, die
Gegenprobe am Text. Jedes davon prüft eine **andere Ebene** — Bündel, Testfall,
Ausgabe.

Die Ebene, die weiterhin ungeprüft ist, ist die oberste: **Ob die Zahlen zur
Wirklichkeit passen.** Dagegen hilft kein Werkzeug, nur eine Antwort von einem
Hersteller.

## Kein Gate

Der Baustein ändert keine Entscheidung. Er erhöht das Vertrauen in die
Rechenkette und benennt zugleich, wie weit dieses Vertrauen trägt.
