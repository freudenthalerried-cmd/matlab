# Der Quelltext lag im Schaufenster — samt Kalkulationsregel

Stand: 2026-08-29

## Der Fund

`npm run pruefe-geheimnis` meldet seit Tagen dieselbe Zahl:

> 44 von 46 Einkaufspreisen auf den Cent rekonstruierbar (96 %).

Die Rechnung dahinter braucht zwei Zahlen: den Verkaufspreis und die
Zielmarge. Der Verkaufspreis steht auf der Seite — das ist ihr Zweck. Für die
Zielmarge stand im Werkzeug eine Voraussetzung, die nie geprüft wurde: **dass
jemand sie kennt.**

Wir haben sie ihm gegeben. `ausgabe/site/shop.js` war 293 KB groß und geht an
jeden Besucher. Darin stand der Quelltext der Rechenmodule **samt Kommentaren**:

```js
// Gegen den ungedeckelten Wunschpreis messen, nicht gegen die gerundete
// Marge. Sonst entscheidet der Cent: 40 € Einkauf und 25 % Ziel ergeben
// 53,333… €, gerundet 53,33 € — und daraus rechnet sich eine Marge von
// 24,995 %, die eine Prüfung auf `>= 0,25` verfehlt.
```

Zwei Folgen, und die zweite wiegt schwerer als die erste.

**Erstens** ist die Weisung vom 28. August („keine Spanne ausgeben") auf der
Kundenseite unterlaufen. Die Zahl stand nicht auf der Seite, aber in der
Datei, die die Seite lädt.

**Zweitens** wäre der offene Punkt „Repository privat schalten" damit
**wirkungslos** gewesen. Er steht seit Tagen in der Liste dessen, was der
Auftraggeber tun muss, mit der Begründung, sonst seien die Einkaufspreise
rekonstruierbar. Wer sie rekonstruieren will, hätte das Repository nicht
gebraucht: Die veröffentlichte Seite genügte. Der Klick hätte das Problem
nicht gelöst, und niemand hätte es gemerkt.

Fehlerklasse: *eine Prüfung, die das Modell liest statt die Ausgabe.* Der
Interna-Prüfer sieht den gerenderten Seitentext an. Das mitgelieferte Skript
hat nie jemand gelesen.

## Was jetzt passiert

`src/entkommentieren.js` entfernt die Kommentare aus dem Bündel, bevor es
geschrieben wird — in `bin/website.mjs` **und** in `build-demo.mjs`.

| Datei | vorher | nachher |
| --- | --- | --- |
| `ausgabe/site/shop.js` | 293 KB | **202 KB** |
| `ausgabe/website.html` | 1561 KB | **1507 KB** |
| `demo.html` | 199 KB | **159 KB** |

Kein Fremdpaket, wie überall in `shop/`. Der Preis dafür ist, dass der Scanner
die Sonderfälle selbst kennen muss: Zeichenketten, Vorlagenliterale samt
`${…}`, reguläre Ausdrücke. Ein Entferner, der ein `//` in einer URL für einen
Kommentar hält, macht aus gültigem Code Bruch.

## Wie das abgesichert ist — vier Netze

**Erstens: Der Bau lässt parsen, bevor er schreibt.** `node --check` in einem
eigenen Prozess, für beide Ausgabefassungen. Ein Scannerfehler bricht den Bau
ab, statt eine Seite ohne Skript auszuliefern.

**Zweitens: Jedes Modul wird im Test entkommentiert und geparst.** 43 Dateien,
und der Test verlangt, dass dabei mehr als 50.000 Zeichen wegfallen — sonst
prüfte er einen Durchreicher.

**Drittens, und das ist der Beweis: dieselbe Testsuite auf entkommentiertem
Quelltext.** Eine Kopie von `shop/`, `src/*.js` durch die entkommentierte
Fassung ersetzt, `node --test`:

| Lauf | Ergebnis |
| --- | --- |
| Kopie **mit** Kommentaren (Kontrolle) | 782 von 792, 5 Fehler |
| Kopie **ohne** Kommentare | 782 von 792, dieselben 5 Fehler |

Die fünf Abweichungen sind in beiden Läufen identisch und gehören zur Kopie,
nicht zum Entferner — es sind die Tests, die auf `preise/`, `docs/` und
`ausgabe/` außerhalb von `shop/` zugreifen. **Auf 787 vergleichbaren Tests
kein einziger Unterschied.**

**Viertens: 50 Browserszenarien** fahren danach über die fertige Seite
(39 Shopprobe, 11 Oberflächenprobe) — mit dem entkommentierten Skript.

## Der Prüfer, der die Frage jetzt stellt

`npm run pruefe-geheimnis` hat einen dritten Durchgang bekommen:

```
Durchgang 3 — steht der Schlüssel in der Ausgabe?
  3 Ausgabedatei(en) geprüft, die Zielmarge steht in keiner.
  Ohne sie führt Durchgang 2 zu nichts: Die Rechnung braucht beide Zahlen.
```

Er sieht in `ausgabe/site/shop.js`, `ausgabe/website.html` und `demo.html`
nach — in dem, was ausgeliefert wird, nicht im Repository. Und er ist der
einzige Durchgang, der ein **Urteil** fällt: Findet er den Schlüssel, endet
das Werkzeug mit Code 1.

Gegengeprobt: Mit wieder eingeschalteten Kommentaren meldet er vier Treffer in
zwei Dateien und endet mit 1; ohne sie ist er still und endet mit 0.

## Zwei Fehlversuche auf dem Weg, beide lehrreich

**Der erste Wurf suchte die nackte Zahl `0.25`** — und fand `fixEuro: 0.25`,
die Kartengebühr von 25 Cent. Ein Prüfer, der die Kartengebühr für ein
Geschäftsgeheimnis hält, wird nach dem zweiten Mal abgeschaltet, und dann
meldet er auch den echten Fall nicht mehr. Gesucht wird jetzt die Zahl **in
Gesellschaft eines Margenworts**.

**Der zweite Wurf meldete `demo.html`**: dort steht `const ZIELMARGE = 0.35`
— die Zielmarge des abgelösten Radon-Modells, neben Platzhalterpreisen. Eine
fremde Zahl neben erfundenen Preisen verrät nichts. Das Muster prüft jetzt auf
**unsere** Zielmarge, nicht auf irgendeine.

## Was das nicht löst

Der Punkt „Repository privat schalten" bleibt offen und bleibt richtig — im
Repository stehen die Einkaufspreise in Klartext, nicht nur die Regel. Was
sich geändert hat: Er löst jetzt tatsächlich das Problem, für das er
dasteht. Vorher hätte der Auftraggeber geklickt und wäre nicht weiter
gewesen.
