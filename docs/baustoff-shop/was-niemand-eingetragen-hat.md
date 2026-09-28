# Was niemand eingetragen hat

**13. September 2026, zweite Runde des Tages.**

## Der Anlass

Die Runde am Vormittag hat repariert, **wie** das Zwillingsregister vergleicht:
Werte statt Zeichen. Der Umsatzsteuersatz stand als `0.2` in einem Vorgabewert
und wurde nicht gefunden, weil das Register `0.20` suchte.

Sie hat eine Frage offen gelassen: `JE_HUB_NETTO = 7.5` in `src/huebe.js` gegen
`kranentladungJeHubNetto: 7.5` in `data/lieferanten.json`. Notiert war sie als
Frage an den Bestand.

Beim Nachsehen zeigte sich, dass das gar nicht die Frage war.

> **Ein Register, das nur führt, was jemand eingetragen hat, ist so vollständig
> wie die Aufmerksamkeit des Eintragenden.**

Das Register führte drei Zahlen. Der Kopf der Datei sagt selbst, wie sie
hineingekommen sind: *„jedes Mal durch Zufall."* Repariert wurde der Vergleich.
Womit verglichen wird, entschied weiterhin der Zufall.

## Die Messung

Gemessen wurden alle **58 benannten Zahlen** aus `src/` gegen **247
Quelldateien**: Wie viele andere Dateien tragen denselben Wert?

| benannte Zahl | Wert | andere Dateien |
|---|---|---|
| `JE_HUB_NETTO` | 7,5 | **1** |
| `KD_MITTEL_BIS` | 49 | **1** |
| `UST_SATZ`, `ZIELMARGE`, `UID_EMPFAENGER_GRENZE_BRUTTO` | — | **2** |
| `SKONTO_SATZ`, `KUMULIERT_MINDESTENS` | 0,03 · 2000 | **3** |
| `HOECHSTMENGE`, `KD_NIEDRIG_BIS` | 999 · 29 | **4** |
| `KLEINSTES_GEBINDE_KG/M2/LFM` | 0,1 | **5** |
| `GRENZE_TAGE` | 14 | 25 |
| `AUFBEWAHRUNG_JAHRE` | 7 | 35 |
| `STAMMLAENGE`, `SICHERUNGSTIEFE` | 10 | 54 |

Der Abstand ist kein knapper, er ist ein Abgrund. Eine Zahl wie 10 oder 14 steht
in fünfzig Dateien, weil fünfzig Dinge zufällig zehn oder vierzehn sind — das
ist der Bestand, vor dem der Kopf des Registers warnt: *keine Jagd auf doppelte
Literale.* Eine Zahl mit **genau einem** anderen Vorkommen ist kein Zufall. Sie
ist entweder gelesen oder abgeschrieben.

Die Schwelle steht deshalb bei **fünf**: weit über dem gemessenen engen Band und
weit unter dem Rauschen. Sie ist eine Messung und keine Meinung.

## Was die Messung fand

Dreizehn Zahlen im engen Band, **zwei davon echt**. Elf sind Zufall, und jede
hat jetzt einen Satz, der sagt warum.

### Die Oberfläche tippte ihre eigene Grenze

`shop-ui.js`, Zeile 466 und 782:

```js
feld.max = '999';
```

Zwei Bildschirmzeilen weiter, im selben Knopf:

```js
+ (drin < menge ? ' — mehr als ' + HOECHSTMENGE + ' geht hier nicht' : '');
```

Der Satz liest die Konstante. Das Feld tippt sie. Und über der zweiten Stelle
steht, drei Zeilen höher, der Grundsatz ausgeschrieben:

> „Die Regel steht in gebinde.js, **nicht zweimal**."

Für den Gebindeschritt galt der Satz. Für die Höchstmenge in derselben Funktion
nicht.

`src/gatestand.js` sagt zu Gate 34, die Höchstmenge sei *„eine benannte Zahl mit
Begründung und kein Literal: Vorher stand 999 an fünf Stellen ohne Grund, und
die Oberfläche kürzte den Wunsch stillschweigend."* Zwei dieser fünf Stellen
standen am 13. September noch da — in genau der Oberfläche, von der der Satz
handelt.

**Warum es unsichtbar war:** Der Prüfer liest `src/`, `bin/` und `data/`.
`shop-ui.js` liegt in keinem davon. Es liegt daneben, in der Wurzel, weil es als
Ganzes ins Browserbündel geht.

> **Eine Datei, die ein Register nicht liest, ist für das Register sauber.**

Am Vortag endete dieselbe Suche am **Dateityp** und wurde um `data/` erweitert.
Heute endete sie am **Ort**.

**Heute fällt der Fehler nicht auf**, weil beide Zahlen 999 sind. Wanderte die
Grenze, bliebe das Feld auf 999 stehen, der Kern kürzte still auf den neuen Wert
— und der Satz daneben nennte eine Zahl, die das Feld nicht kennt. Genau der
Zustand, den Gate 34 beendet hat.

### Der Hubsatz stand dreimal, nicht zweimal

`data/lieferanten.json` trug 7,50 € zweimal:

| Feld | gelesen von |
|---|---|
| `fracht.sperrgutZuschlagNetto` | `src/frachtsatz.js` — die Frachtzeile jedes Warenkorbs |
| `nebenkosten.kranentladungJeHubNetto` | **niemandem** |

Dazu `JE_HUB_NETTO` in `src/huebe.js`. Der Testfall, der das hätte halten
müssen, heißt seit dem 4. September:

> *„der Hubsatz steht nur an einer Stelle"*

Er hielt zwei Fassungen gegeneinander. Es gab drei.

> **Ein Testfall, der sagt „nur an einer Stelle", zählt die Stellen, die ihm
> genannt wurden.**

Wäre der Satz des Lieferanten gestiegen, hätte `test/huebe.test.js` die beiden
gerechneten Fassungen zusammengehalten, und die dritte wäre auf 7,50 €
stehengeblieben — eine falsche Zahl in genau der Datei, aus der ein späterer
Lauf die Konditionen liest.

Sie stand außerdem in der **falschen Liste**. Der Kopf des Nebenkostenblocks
sagte: *„Kostenpositionen, die auf den Belegen stehen und im Rechenkern NICHT
gerechnet werden."* Die Kranentladung wird gerechnet. Und seit dem 13. September
gilt der Satz für keines der drei übrigen Felder mehr: `src/warenkorb.js`
rechnet die Folierung als Kosten und hält die beiden Palettenpreise gegen den
Belegkreis.

> **Ein Satz, der sagt, eine Zahl werde nicht gelesen, ist eine Erlaubnis, sie
> stehen zu lassen.**

## Was Zufall war

Elf der dreizehn. Bemerkenswert sind zwei:

**`KLEINSTES_GEBINDE_KG/M2/LFM = 0,1`** gegen fünfmal `0.10` — zehn **Prozent**,
in fünf Bedeutungen (Überlappung, Basisannahme, Elastizitätsschritt,
Nachlassstaffel, Werbeanteil). Hier steht ein Zehntel **Kilogramm**.

Dass die Messung sie überhaupt zusammenwirft, ist **der Preis der Berichtigung
vom Vormittag**: Seit Werte statt Zeichen verglichen werden, ist `0.10` dieselbe
Zahl wie `0.1`. Der Gewinn — der gefundene Steuersatz — und dieser Verlust sind
dieselbe Änderung. Beides gehört genannt.

**`KD_MITTEL_BIS = 49`** hat genau ein anderes Vorkommen, und es ist keines: der
Satz „Listenpreis Größenordnung 2,49 % + 0,35 €". Die Messung liest Ziffern und
kein Komma, zerlegt `2,49` in `2` und `49` und findet eine 49, die niemand
geschrieben hat. Auch das gehört ins Protokoll — es beziffert, wo die Messung
endet.

## Was geändert wurde

| Datei | was |
|---|---|
| `shop-ui.js` | zweimal `feld.max = String(HOECHSTMENGE)` statt `'999'` |
| `data/lieferanten.json` | `kranentladungJeHubNetto` entfernt, Notiz an seiner Stelle; der Kopfsatz des Nebenkostenblocks berichtigt |
| `src/zwillingszahlen.js` | `ENGE_SCHWELLE`, `VORSCHLAG_GEPRUEFT` (8 Einträge), `zwillingsvorschlag()`; zwei neue geführte Zahlen (999 · 7,5) |
| `bin/zwillingspruefung.mjs` | liest `shop-ui.js` mit; führt die Vorschlagsmessung aus |
| `test/huebe.test.js` | misst den ganzen Nebenkostenblock statt eines Feldnamens |
| `test/zwillingszahlen.test.js` | fünf Testfälle für die Messung und beide Gegenrichtungen |

Zwei Gegenproben, jede rot gesehen:
`die-oberflaeche-tippt-ihre-grenze-wieder` · `der-hubsatz-steht-wieder-zweimal-in-der-datei`

## Was das Verfahren daraus lernt

Drei Runden hintereinander an derselben Stelle, und jede hat die vorige
erweitert:

| Tag | was fehlte |
|---|---|
| 12.09. | die Suche endete am **Dateityp** — `data/` fehlte |
| 13.09. vormittags | der Vergleich endete an der **Schreibweise** — `0.2` ≠ `0.20` |
| 13.09. nachmittags | die Auswahl endete an der **Aufmerksamkeit** — geführt war, was auffiel |

Die ersten beiden waren Lücken **im Prüfer**. Die dritte war eine Lücke
**zwischen Prüfer und Register**: Der Prüfer hielt jede eingetragene Zahl gegen
die Wirklichkeit, in beide Richtungen, tadellos. Nur trug das Register ein, was
jemandem aufgefallen war.

> **Ein Prüfer, der ein Register hält, prüft das Register und nicht den
> Bestand.**

Die Vorschlagsmessung schließt das: Sie fragt nicht mehr, ob die geführten
Zahlen stimmen, sondern welche Zahl geführt gehörte. Und sie hat selbst eine
Gegenrichtung — ein Haken für eine Zahl, die es nicht mehr gibt oder die das
enge Band verlassen hat, wird gemeldet.

## Offen

`bin/wegprobe.mjs` tippt `999` in ein Mengenfeld, um den Mindestbestellwert zu
überschreiten. Die Zahl steht dort als begründete Ausnahme: Die Probe braucht
die größte annehmbare Menge. Ob sie die Konstante stattdessen lesen **kann**,
ist offen — der Block wandert als Zeichenkette durch eine Schablone in eine
HTML-Datei, und was dort ankommt, ist nicht das Modul.
