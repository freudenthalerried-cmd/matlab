# Die Anzeige sagte es trotzdem

**6. September 2026, vormittags.** Die Runde davor hat eine Regel gebaut: Kein
Keyword darf auf etwas bieten, das seine eigene Landeseite absagt. Sie hat
`Fassadendämmung EPS` zurückgehalten und `EPS Fassadenplatten` fiel von Hand
weg.

Eine Zeile weiter, in derselben Anzeigengruppe, stand unverändert:

> **Beschreibung 2:** *„Perimeter- und **Fassadendämmung** zum Preis, den ein
> Baumeister zahlt."*

> **Die Regel prüfte, worauf geboten wird, und nicht, was die Anzeige sagt.**

Ein Keyword kauft den Klick. Der Anzeigentext ist das Versprechen, für das er
gekauft wird — und er wird gelesen, bevor jemand klickt.

---

## Drei Funde in drei Anzeigen

Die Regel auf die Anzeigentexte angewandt, dazu eine zweite (unten), meldete:

```
WDVS    · Überschrift 6: „Fassade aus einer Bestellung"
          verspricht „Fassade" in einem Vorgang
Dämmung · Beschreibung 2: „Perimeter- und Fassadendämmung …"
          nennt „fassadendämmplatte" — die Landeseite sagt „führen wir nicht"
Kamin   · Überschrift 2: „Kaminzug in einer Lieferung"
          verspricht „Kaminzug" in einem Vorgang
```

**Jede der drei geschalteten Anzeigen trug einen dieser Sätze.** Das ganze
Budget, 45 Tage, 4,19 € bis 8,22 € je Klick.

---

## Dasselbe Versprechen, andere Wörter

Der zweite Fund ist der ältere. Am 2. September sind aus denselben drei
Anzeigen die Sätze „Fassade komplett liefern", „Das komplette Fassadensystem
aus einer Hand" und „XPS und EPS in allen gängigen Stärken" entfernt worden,
und `VOLLSTAENDIGKEITSWORTE` fängt sie seither: *komplett*, *aus einer Hand*,
*alle gängigen*, *vollständig*, *ganzes System*.

Vier Tage später stand da:

> „**Fassade** aus einer **Bestellung**" — „**Kaminzug** in einer
> **Lieferung**"

> **Ein Register, das nach Wörtern sucht, lässt dieselbe Aussage in anderer
> Formulierung durch.**

Für sich sind diese Wendungen harmlos: „Schiedel-Systemteile aus einer
Bestellung" stimmt. Falsch werden sie erst zusammen mit dem **Namen des ganzen
Bauteils**, wenn dessen Systemliste eine Position als nicht geführt ausweist.
Deshalb sind sie nicht in die Wortliste gewandert, sondern werden mit dem
Bauteilnamen gepaart — und der wird **abgeleitet**, aus dem Titel der
Systemliste vor dem ersten Gedankenstrich:

| Systemliste | Bauteil |
|---|---|
| „Fassade dämmen — die Liste für 100 m²" | `Fassade` |
| „Kaminzug — die Liste für einen Zug" | `Kaminzug` |
| „Grundleitung DN 100 — die Liste" | `Grundleitung` |
| „Kellerwand außen dämmen — die Liste" | `Kellerwand` |

*Eine Liste solcher Namen wäre ein Register, das jemand pflegen müsste. Dieser
Bestand hat an einem Tag dreimal gesehen, was davon zu halten ist.*

**Alle vier Systemlisten nennen eine nicht geführte Position** — auch die, die
sonst als Vorbild gilt: Bei Kamin fehlt das Anschlussformteil der Feuerstätte,
bei Kanal Übergangsstücke, Gleitmittel und Dichtringe, bei der Kellerwand die
Abdichtung.

---

## Was jetzt dasteht

| vorher | nachher |
|---|---|
| WDVS: „Fassade aus einer Bestellung" | „Kleber bis Oberputz geliefert" |
| Dämmung: „Perimeter- und **Fassaden**dämmung …" | „Perimeter- und **Sockel**dämmung …" |
| Kamin: „Kaminzug in einer Lieferung" | „Eine Lieferung, kein Abholen" |

Alle drei sagen weniger und stimmen. Die Dämmungszeile ist die genaueste
Berichtigung: XPS von 30 bis 100 mm **ist** Perimeter- und Sockeldämmung — nur
eben keine Fassadendämmung.

**Ein Anzeigentext wird nicht zurückgehalten wie ein Keyword.** Ein Keyword ist
ein Gebot, das man weglassen kann; ein Anzeigentext ist geschrieben worden,
also gehört er berichtigt und nicht stillschweigend ausgelassen. Deshalb bricht
der Lauf ab, statt die Zeile zu unterdrücken.

---

## Und eine Reihenfolge, die schon falsch war

Die Landeseiten wurden bisher **nach** den Textprüfungen gelesen — sie wurden
nur für die Keywords gebraucht. Sie stehen jetzt davor. *Eine Prüfung, die die
Unterlagen erst nach ihrem Urteil bekommt, prüft ohne sie.*

---

## Was das gekostet hat

| | |
|---|---|
| Neue Regeln | Anzeigentext gegen Abgrenzungssätze; Bauteilname + Ein-Vorgang-Wendung |
| Neue Register | `EINVORGANGSWORTE` (3 Wendungen), Bauteilnamen **abgeleitet** |
| Neue Gegenproben | `anzeige-verspricht-die-absage` |
| Neue Testfälle | 7 (`test/kampagne-texte.test.js`) |
| Geänderte Anzeigentexte | 3 — je einer in jeder geschalteten Anzeige |

## Was offen bleibt

- **Die Bauteilregel prüft ein Wort, nicht einen Sinn.** „Alles für die
  Fassade in einem Zug" träfe sie nicht. *Sie fängt die Formulierungen, die
  dagewesen sind, und die nächste unbekannte Formulierung fängt wieder ein
  Mensch.*
- **Zwei Register nach Wörtern, ein Sachverhalt.** `VOLLSTAENDIGKEITSWORTE`
  und `EINVORGANGSWORTE` sagen beide „das Ganze in einem Vorgang". Sie
  zusammenzulegen wäre möglich; **nicht getan**, weil das erste ohne
  Bauteilnamen greift und das zweite nur mit ihm — eine Zusammenlegung machte
  aus zwei scharfen Regeln eine unscharfe.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
