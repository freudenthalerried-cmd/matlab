# Eine Einheit, vier Wörter — und drei davon selbstgemacht

**31. August 2026.** Der gestrige Durchgang hat der Längenware einen
Gebindeschritt gegeben. Dieser Durchgang sieht nach, was diese Erweiterung
umgeworfen hat — und findet, dass sie nichts kaputt gemacht, sondern etwas
sichtbar gemacht hat, das seit Wochen dalag.

## Der Anlass ist die eigene Änderung von gestern

`bin/website.mjs` führte eine Zuordnung von Lieferantenkürzeln auf lesbare
Wörter: `STK → Stück`, `M2 → m²`, `LFM → lfm`, und so fort. Sie ist
vollständig; alle neun Einheiten des Bestands stehen darin.

Drei andere Stellen kannten sie nicht und halfen sich selbst — jedes Mal mit
derselben Zeile:

```js
einheit === 'KG' ? 'kg' : 'm²'
```

Solange nur Kilogramm und Quadratmeter einen Gebindeschritt hatten, war diese
Fallunterscheidung vollständig. Seit gestern hat sie ein Loch, und es steht
auf Kundenseiten:

| Ort | stand da |
|---|---|
| Warenkorbzeile | `4,91 € je lfm, netto · 2 Einheiten zu 2,55 m²` |
| Vorlesetext des Mengenfelds | `ganze Einheiten zu 2.55 m²` |
| Artikelseite | `Abgabe in ganzen Einheiten zu 2,55 m² … Der Preis gilt je lfm` |

Der dritte Satz widerspricht sich innerhalb von zwölf Wörtern selbst. Und in
`shop-ui.js` steht die richtige Auskunft **drei Zeilen darüber** —
`D.einheiten[p.einheit]` —, gefolgt von einem Kommentar, der genau diesen
Fehler verbietet: „Die Regel steht in gebinde.js, nicht zweimal."

> **Zwei Wege zur selben Auskunft, und der kürzere gewinnt.** Zum achten Mal
> in diesem Projekt, diesmal mit dem Widerspruch direkt untereinander im
> selben Absatz.

## Der vierte Weg: gar keiner

`src/beleg.js` half sich anders — es setzte das Kürzel roh. Angebot und
Rechnung zeigten dem Kunden `SCK`, während der Anfragetext auf der Kasse
derselben Bestellung „Sack" schrieb. Derselbe Kunde, dieselbe Position, zwei
Schreibweisen.

Auch das war unsichtbar, und aus demselben Grund wie gestern: `beleg.test.js`
rechnet auf `data/artikel.json`, dessen Einheiten deutsche Wörter sind
(`Stück`, `Rolle`, `Ringbund`). Ein Kürzel, das übersetzt werden müsste, kommt
dort nicht vor.

## Die Ursache war der Ort, nicht die Zeile

Die Zuordnung stand in einem **Bauwerkzeug**. `bin/website.mjs` erzeugt
Seiten; wer sie sonst brauchte — der Warenkorb im Browser, die Belege —
konnte sie nicht erreichen. Drei Notlösungen sind keine Nachlässigkeit,
sondern die vorhersehbare Folge.

`EINHEITEN` und `einheitText()` stehen deshalb jetzt in `src/format.js`,
neben `EUR`, `LUECKE` und `textZeile` — dort, wo die gemeinsamen
Darstellungshilfen ohnehin liegen. `website.mjs` importiert sie, `beleg.js`
auch, und der Browser bekommt sie wie bisher als `D.einheiten` mitgeliefert.

**Unbekanntes wird durchgereicht, nicht geraten.** `einheitText('PAK')` gibt
`PAK` zurück und nicht „Paket". Eine Vermutung stünde sonst auf einer
Rechnung.

## Gegenproben

Acht Mutationen, jede gesichert und zurückgesetzt:

| Mutation | erkannt |
|---|---|
| Ternär im Warenkorb zurück | ja — die neue Browserprobe |
| Ternär im Vorlesetext zurück | ja — dieselbe Probe |
| Ternär auf der Artikelseite zurück | ja |
| `LFM` aus der Zuordnung entfernt | ja — 2 rot |
| Unbekanntes wird geraten statt durchgereicht | ja |
| Beleg setzt das Kürzel wieder roh | **erst nein** |

Die letzte Zeile ist der Grund, weshalb Gegenproben nicht optional sind: Ich
hatte die Belege berichtigt, ohne dass irgendetwas den Rückfall bemerkt
hätte. Zwei Testfälle nachgezogen — einer verlangt „Sack" und verbietet
„SCK", der andere verlangt umgekehrt, dass ein **unbekanntes** Kürzel
unübersetzt stehenbleibt.

### Die Browserprobe, die es vorher nicht gab

`shopprobe` hat jetzt ein fünfzigstes Szenario: Vier laufende Meter
Anschlussleiste in den Korb, und der Korb muss die Einheit des Artikels
nennen. Gegen den alten Stand gelaufen, meldet sie wörtlich:

```
✗ Längenware nennt Meter, nicht Quadratmeter
    steht fälschlich im Ergebnis: „2,55 m²"
    gerendert war: menge=5.1 | 4,91 € je lfm, netto · 2 Einheiten zu 2,55 m²
                 | aria=… ganze Einheiten zu 2.55 m²
```

Damit ist auch belegt, dass der Vorlesetext betroffen war — und dass er die
Zahl mit Punkt statt Komma trug. Beides berichtigt.

## Die Regeln, die jetzt geprüft sind

Nicht der Bestand, sondern die Zusicherung:

- In **jedem** gebauten Gebindehinweis muss die Einheit hinter „Abgabe in
  ganzen …" dieselbe sein wie hinter „Der Preis gilt je …". Über alle
  Artikelseiten, nicht über eine ausgewählte.
- **Jede** Einheit des Bestands hat ein lesbares Wort.
- `einheitText` erfindet nichts und lässt nichts leer.

## Stand

956 Testfälle grün (vorher 951), `pruefe-tests` 954/0, `shopprobe` 50
Szenarien, elf Prüfer mit `--mit-browser` ohne Beanstandung, `pruefe-stand`
199/199.
