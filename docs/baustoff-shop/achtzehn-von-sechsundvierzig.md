# Achtzehn von sechsundvierzig

**13. September 2026.** Die Vorrunde hat dem Rechenkern beigebracht, eine
Menge zu benennen, die kein ganzes Gebinde ist. Die erste Frage danach ist
immer dieselbe: **Wie weit trägt das?**

```
Artikel gesamt: 46 | mit lesbarem Gebinde: 18
  M2  11 von 12     KG  5 von 5     LFM 2 von 2
  STK  0 von 18     KRT 0 von 3     SCK 0 von 2     DOS 0 von 2
  EIM  0 von 1      RLL 0 von 1
```

> **Achtzehn von sechsundvierzig.** Für die übrigen achtundzwanzig ging eine
> halbe Einheit weiter wortlos durch.

Gemessen an einem Artikel, der es zeigt:

```
kundenWarenkorb([{ sku: 'POS-10837', menge: 1.5 }])
  →  Warenwert 34,88 €   offen: []
```

`POS-10837` ist `Mantelstein MSTS EZ 16-18 SIKM`. **Ein halber Betonstein**,
bepreist und kommentarlos.

## Warum der Wächter dort nicht griff

`mengenschritt` beantwortet eine Frage über die **Bezeichnung**: Welche
Gebindegröße steht im Namen? Bei `XPS glatt SF 30 mm 0,75 m2` steht sie da,
bei `Mantelstein MSTS EZ 16-18 SIKM` nicht — und das ist richtig so. Die
Funktion rät nichts; derselbe Satz steht seit dem 29. August über ihr: *Was
die Bezeichnung nicht sagt, sagt sie nicht.*

Nur war das die falsche Frage. Die richtige lautet: **Was ist die kleinste
Menge, die ein Lieferant herausgibt?** Und die hat für Stückgut eine Antwort,
die in keinem Namen stehen muss:

> **Einen halben Eimer gibt es nicht.**

## Wo die Lockerung herkommt

Sie steht seit dem 29. August im Text von `istMenge()` selbst:

> „Hier stand `Number.isInteger`. Für Stückgut ist das richtig — für
> Flächenware nicht: `XPS glatt SF 30 mm 0,75 m2` wird in Platten zu 0,75 m²
> abgegeben … die alte Regel erlaubte ausschließlich unlieferbare Mengen."

Der Befund war richtig, die Berichtigung zu breit: Zugelassen wurde **jede**
Zahl mit zwei Nachkommastellen, für jede Einheit. Der Satz, der die Ausnahme
begründet, nennt die Regel, die bleiben sollte — und sie fiel mit.

> **Eine Grenze, die für einen Fall zu eng war, wurde für alle Fälle
> aufgehoben.**

Dieselbe Familie wie der Satz über `gebindezahl` in der Vorrunde („für die
Anzeige gedacht, nicht für die Rechnung") und wie die zu weit gezogene
Netzgrenze am 10. September: Ein richtiger Befund, eine Spur zu weit
formuliert, und die Formulierung überlebt den Anlass.

## Was geändert wurde

`bestellschritt(artikel)` in `src/gebinde.js` — die kleinste bestellbare
Menge:

| Einheit | Schritt | warum |
|---|---|---|
| `STK`, `SCK`, `EIM`, `KRT`, `DOS`, `RLL` | **1** | Die Einheit *ist* das Gebinde; ein halber Sack existiert nicht |
| `KG`, `M2`, `LFM` | die gelesene Gebindegröße | Messware ist teilbar — erst das Gebinde sagt, dass sie es nicht ist |
| alles andere | `null` | es ist nichts bekannt, und geraten wird nichts |

Reichweite damit **45 von 46**. Der eine übrige ist `POS-21382`,
`Grundmauerschutz 20 1,5 m`: in Quadratmetern geführt, die Bezeichnung nennt
Meter. Daraus eine Fläche zu rechnen hieße, die zweite Kante zu erfinden.

`mengenschritt` bleibt unverändert, und die Trennung ist der ganze Punkt: Aus
ihr entstehen die Artikelseite („Abgabe ab 25 kg") und die strukturierten
Daten. Gäbe sie 1 für jeden Stein zurück, behauptete die Seite *„Abgabe ab
1 Stück"*, wo niemand etwas abgemessen hat, und der Produktfeed trüge eine
erfundene Packungsgröße. Die zweite Gegenprobe hält genau das fest.

## Und ein drittes Mal dieselbe Regel

In `shop-ui.js` stand die Auskunft „ein Stück ist sein eigenes Gebinde"
zweimal ausgeschrieben: als `mengenschritt(artikel) || 1` am Korbknopf und als
`else`-Zweig mit `Math.ceil(m)` am Mengenfeld. Beide sind weg; beide rufen
`bestellschritt`. Die Vorrunde hat die Aufrundung an einen Ort geholt — diese
holt die Frage dorthin, auf die sie antwortet.

Die Oberfläche verhält sich dadurch nicht anders: Sie rundete Stückgut schon
vorher auf ganze Zahlen auf. Was sich ändert, ist, dass der Rechenkern
dieselbe Regel kennt.

## Der Satz danach

```
Mantelstein MSTS EZ 16-18 SIKM: 1,5 Stück gibt es nicht — abgegeben wird in
ganzen Einheiten, die nächste volle Menge ist 2 Stück.
```

Zwei Fassungen, weil es zwei Sachverhalte sind: Bei Stückgut ist die Einheit
schon das Gebinde, und „in Einheiten zu 1 Stück (2 Stück)" sagte dieselbe Zahl
dreimal. Bei Messware trägt die Stückzahl die Auskunft, die der Kunde braucht
— wie viele Platten das sind.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `der-halbe-eimer-geht-wieder-durch` | Stückgut hat wieder keinen Bestellschritt |
| `der-bestellschritt-redet-in-die-artikelseite` | die 1 wandert in `mengenschritt` — und damit auf die Artikelseite und in den Feed |

Die zweite ist die ungewöhnlichere: Sie hält nicht fest, dass etwas **fehlt**,
sondern dass eine richtige Auskunft an der **falschen Stelle** steht. Zwei
Funktionen, zwei Fragen, und keine darf die andere beantworten.
