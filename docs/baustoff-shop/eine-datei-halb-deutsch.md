# Eine Datei, die zur Hälfte deutsch formatiert ist

**2. September 2026, abends.** Weiter mit der Methode: das Papier lesen, das
den Shop verlässt. Diesmal keines für Kunden oder Lieferanten, sondern das für
den **Steuerberater** — die Buchhaltungs-CSV aus der Ablage.

```
lfd;art;nummer;zeitpunkt;vorgang;netto;brutto;bezug;text
1;rechnung;RE-2026-0001;2026-09-02;V-1;768.39;922.07;;Rechnung an Musterbau GmbH
2;angebot;AN-2026-0001;2026-09-01;V-1;1234.5;1481.4;;Angebot
```

Der Trenner ist das **Semikolon** — das ist die hiesige Schreibweise, denn das
Komma ist hier das Dezimalzeichen. Die Beträge tragen trotzdem einen **Punkt**.

In einer Tabellenkalkulation mit deutscher Ländereinstellung ist der Punkt das
**Tausendertrennzeichen**. Aus 768,39 € werden 76.839 €, und zwar lautlos: Die
Zahl sieht nach dem Import wie eine Zahl aus. Niemand bekommt eine Warnung.

> **Eine Datei, die zur Hälfte deutsch formatiert ist, ist falsch formatiert.**

Und in der zweiten Zeile steht `1234.5`. Ein Betrag mit einer Nachkommastelle
ist in einer Buchhaltung kein Betrag.

## Was geändert ist

`format.js` hat jetzt drei Funktionen statt keiner:

| | |
|---|---|
| `zahlText` | Mengen: ganze Zahlen ohne Nachkomma („55"), gebrochene mit Komma („0,75") |
| `csvBetrag` | Geld: immer zwei Stellen, immer Komma („1234,50") |
| `zahlAusText` | zurück — liest **Komma und Punkt** |

Dass der Leser beide Schreibweisen versteht, ist Absicht: Ältere Dateien im
Umlauf tragen den Punkt, und ein Leser, der sie ab heute nicht mehr versteht,
macht aus einem Formatfehler einen Datenverlust.

Eine Wache steckt darin, die nichts mit Formatierung zu tun hat:
`Number(null)` ist **0**. Ohne sie stünde in der Zeile eines Vermerks ohne
Betrag ein sauberes „0,00" — und **eine erfundene Null sieht aus wie eine
gebuchte**. Leere Angaben bleiben leer.

## Der zweite Befund: der Rückleser sah gebrochene Mengen nicht

Beim Nachziehen der Bestell-CSV fiel auf, dass `leseBestellung` — die
**Gegenprobe** an der Lieferantenbestellung — so aussieht:

```js
const p = /^\s+(\d+)\s+×\s+(\S+)\s+(.+)$/.exec(zeilen[i]);
```

`(\d+)`, nur ganze Zahlen. Der Shop gibt Platten zu 0,75 m² ab, Rollen zu
55 m², Säcke zu 25 kg. Eine Zeile mit gebrochener Menge traf das Muster nicht
und **verschwand still**. Die Gegenprobe verglich dann eine Position weniger
und hätte den Bestelltext beschuldigt, in dem die Position sehr wohl stand.

Nachgewiesen an zwei Zeilen:

```
    55 × POS-52058    Baumit TextilglasGitter 1,1x50 m     → gelesen
  0,75 × POS-12569    XPS glatt SF 30 mm 0,75 m2           → verschwunden
```

## Der dritte, und der ist der unangenehmste

Die Gegenprobe zu diesem Fehler schlug **nicht an**. Der Grund lag nicht am
Prüfer, sondern an seinem Prüfkorb: `bin/kontrolllauf.mjs` baut seinen Vorgang
aus zwei Stückgutartikeln mit ganzen Mengen. Der Rückleser konnte gar nicht
scheitern, weil ihm nie eine gebrochene Menge vorgelegt wurde.

> **Ein Prüfkorb ohne die schwierigen Fälle prüft die leichten.**

Der Korb trägt jetzt zusätzlich den ersten Artikel mit gebrochenem
Gebindeschritt (heute POS-12566, 0,5 m²), und der Lauf **sagt in seiner
Ausgabe**, ob eine solche Menge dabei ist. Findet er keine, steht dort „dieser
Lauf prüft nur ganze Mengen" — statt eine Menge zu erfinden.

## Eine Regel, die nicht gebrochen wurde

`kontrolle.js` importiert absichtlich **nichts**: Sie ist die zweite Rechnung,
die gegen die erste prüft. Die neue `zahlAusText` steht dort deshalb ein
zweites Mal, mit demselben Grund wie der Steuersatz zwei Absätze weiter oben:

> **Ein Leser, der die Schreibweise vom Schreiber bezieht, bestätigt jede
> Schreibweise, auch eine falsche.**

## Was ich nicht getan habe

**Keine Steuerspalte.** Die CSV nennt netto und brutto; die Umsatzsteuer wäre
die Differenz und ließe sich ausrechnen. Eine dritte, selbst gerechnete Zahl
kann aber um einen Cent von der ausgewiesenen USt auf der Rechnung abweichen —
und dann stünden zwei Wahrheiten in derselben Buchhaltung. Der Steuerberater
zieht zwei exakte Werte voneinander ab.

**Keine BOM-Kennung für die Kodierung.** Die Datei ist UTF-8; ob ein
Import-Werkzeug eine Byte-Order-Markierung braucht oder an ihr scheitert,
hängt vom Werkzeug ab, und welches der Auftraggeber verwendet, weiß ich nicht.
Raten wäre hier dasselbe wie eine erfundene Zahl.

## Stand

| | |
|---|---|
| CSV-Ausgänge mit hiesiger Schreibweise | 2 (Buchhaltung, Bestellung) |
| Prüfkorb der Kontrolle | 3 Positionen, davon 1 mit gebrochener Menge |
| Tests | 1256 |
| Gegenproben, die anschlagen | 22 von 22 |

Nebenbei nachgezogen: `bin/kontrolllauf.mjs` reichte die Anschrift des
Betreibers nicht weiter und meldete deshalb seit einer Stunde eine
unvollständige Rechnung nach § 11 — derselbe Fehler wie im Belegprüflauf, eine
Datei weiter.
