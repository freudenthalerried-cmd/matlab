# Hundertundein Loch, das keines war

**13. September 2026.** Gemessen an einem Journal aus zwei abgelegten
Angeboten — Vorgang `2026-0102` und `2026-0103` —, zurückgelesen wie im
Betrieb:

```
zaehler nach dem Zurücklesen: {"angebot:2026":103}
hoechste: 103   vergeben: 2   fehlend: 101   lueckenlos: false
```

> **Hundertundeine fehlende Nummer, und keine einzige davon hat je jemand
> vergeben.**

Was `bin/vorgang.mjs` aus diesem Befund macht, steht dort in einer Zeile:
`Achtung, Lücke im Nummernkreis: ${kreis.fehlend.join(', ')}`. Unter jedem
abgelegten Angebot ab dem zweiten des Jahres wären das `AN-2026-0001` bis
`AN-2026-0101`, hintereinander weg.

**Was hier gemessen ist und was nicht:** Gemessen sind die vier Zahlen oben, an
`ausJournal` und `pruefeNummernkreis`. Die gedruckte Zeile ist aus ihnen
abgeleitet und nicht mitprotokolliert — der zweite Angebotslauf eines Jahres
hat in dieser Umgebung nie stattgefunden, weil die Probeakte je Lauf neu
entsteht. Genau deshalb ist der Fehler siebzehn Tage alt geworden.

## Woher die Zahl 103 kommt

`src/vorgang.js` bildet die Angebotsnummer seit dem 31. August als
`AN-${vorgangsnummer}`. Die Vorgangsnummern dieses Hauses beginnen bei 0101.
Das Angebot zu Vorgang `2026-0103` heißt also `AN-2026-0103` — und
`src/speicher.js` las beim Zurücklesen aus jeder Nummer die laufende Zahl
heraus und hob damit den Zähler `angebot:2026` auf **103**.

Dieser Zähler hat nie eine Nummer vergeben. `naechsteNummer(ablage, 'angebot',
…)` steht in keiner Zeile dieses Bestands; gerufen hat den Kreis außerhalb der
Testfälle niemand. Gemessen wurde damit die **Vorgangszählung** an einem
Zähler, den niemand hochgezählt hat.

## Warum das nicht bloß hässlich ist

Dieselbe Zeile — „Achtung, Lücke im Nummernkreis" — ist der einzige Wächter
über den **Rechnungs**kreis. Dort verlangt § 11 Abs 1 Z 5 UStG die Nummer
fortlaufend und einmalig, und dort ist eine Lücke das, was `pruefeNummernkreis`
über sich selbst sagt: *erklärungsbedürftig*. Eine gezogene, aber nie
verwendete Rechnungsnummer ist ein Vorgang, den der Betreiber beziffern können
muss.

> **Wer diese Zeile hundertfach ohne Anlass sieht, liest sie nicht mehr, wenn
> sie einmal recht hat.**

Das ist kein falsches Grün, sondern ein falscher Alarm — und diese Familie hat
dieser Bestand bisher seltener gefunden als die andere. Ein Prüfer, der bei
einem gewöhnlichen Geschäftsfall anschlägt, wird abgeschaltet; der Satz steht
seit dem 13. September im Quelltext von `bin/ablagepruefung.mjs` und galt hier
gegen das eigene Werkzeug.

## Der Fund war angekündigt

Am 12. September wurde derselbe Fehler an der **Lieferantenbestellung**
berichtigt. Die Notiz, die seither in `src/ablage.js` steht, nennt als Vorbild:

> „Zwei Zahlenreihen für dasselbe Papier — dieselbe Familie wie am
> 4. September bei der **Angebotsnummer** und am 11. bei der Rechnung."

Die Angebotsnummer stand in dem Satz, der den Fehler beschreibt, und blieb
stehen. Ein Beleg dafür, dass eine Berichtigung an einer Stelle keine ist,
solange niemand dieselbe Frage an die Nachbarzeile stellt — derselbe Schnitt
wie am 12. und 13. September beim Jahreswechsel, der an acht Stellen zugleich
lag.

## Ein Feld, drei Fragen

Das Verzeichnis `ARTEN` führte je Art ein Ja/Nein namens `nummernkreis`.
Gelesen wurde es an drei verschiedenen Stellen für drei verschiedene Fragen:

| Stelle | gefragt wurde | richtige Antwort fürs Angebot |
|---|---|---|
| `naechsteNummer`, `pruefeNummernkreis` | zieht der Zähler die Nummer? | **nein** |
| `belegname` | muss der Dateiname das Kürzel voranstellen? | nein (`AN-…` trägt es schon) |
| `bin/vorgang.mjs` | nimmt die Journalzeile die Nummer mit? | **ja** |

Ein Ja/Nein kann diese drei Fragen nicht zugleich beantworten. Es stand auf
`true`, und damit waren zwei von drei falsch.

Seit heute sagt das Feld, **woher die Nummer kommt**, und heißt `nummerAus`:

- `'kreis'` — der Zähler zieht sie. Nur **Rechnung und Gutschrift**; nur hier
  ist eine Lücke erklärungsbedürftig.
- `'vorgang'` — das Papier bringt sie mit und bildet sie aus der
  Vorgangsnummer: `AN-2026-0102`, `2026-0110-01`. Sie steht in der
  Journalzeile, gezählt wird an ihr nichts.
- `'keine'` — die Zeile trägt keine; rückführbar ist sie über den Vorgang
  (§ 131 Abs 1 Z 5 BAO).

`belegname` fragt seither nicht mehr das Register, sondern die **Nummer
selbst**: Trägt sie ihr Kürzel schon, kommt keines dazu. Das ist die einzige
Frage, die dort zu beantworten ist, und sie lässt sich an Ort und Stelle
beantworten. Alle sechs Dateinamen bleiben Zeichen für Zeichen dieselben.

`src/speicher.js` hebt den Zähler seither nur noch über einen gezogenen Kreis.
Die Lieferantenbestellung war dort noch schiefer als das Angebot: Aus
`2026-0110-01` las die Zeile das **Jahr 110** und legte einen Zähler dafür an.

## Was das Register jetzt gegen den Bestand hält

Neu ist `nummernbefund()` in `src/ablage.js`, gerufen von
`npm run pruefe-ablage` über alle Journale. Er hält `nummerAus` in beide
Richtungen:

| Regel | Befund |
|---|---|
| `nummernherkunft-unbekannt` | eine Art führt eine Herkunft, die es nicht gibt |
| `gezogen-ohne-blatt` | eine Art zieht eine Nummer, ohne ein Blatt zu haben |
| `nummer-wo-keine-vorgesehen-ist` | eine Zahlenreihe, die das Verzeichnis nicht kennt |
| `kreisnummer-fehlt` | Rechnung ohne fortlaufende Nummer (§ 11 Abs 1 Z 5 UStG) |
| `kreisnummer-ist-die-vorgangsnummer` | die Nummer wiederholt den Vorgang — gebildet, nicht gezogen |
| `vorgangsnummer-fehlt` | das Papier bringt keine mit |
| `nummer-nennt-den-vorgang-nicht` | rückführbar über den Vorgang ist sie damit gerade nicht |

Die fünfte Regel ist der Fund in messbarer Form: **Ein gezogener Zähler weiß
nichts von dem Vorgang, zu dem das Papier gehört.** Steht die Vorgangsnummer in
der Nummer, ist sie gebildet.

**Was daran offen bleibt, und es gehört gesagt:** Die 102. Rechnung eines
Jahres zum Vorgang `2026-0102` träfe diese Regel zufällig. Dann steht dort eine
Frage, die **einmal** zu beantworten ist — und nicht hundertmal eine Lücke, die
es nicht gibt. Das ist der Tausch, den dieser Befund macht, und er geht in die
richtige Richtung.

## Gegenproben

Drei, jede einzeln rot gesehen:

| Gegenprobe | was sie einsetzt |
|---|---|
| `die-angebotsnummer-wird-wieder-gezogen` | `nummerAus: 'kreis'` fürs Angebot — der Zustand von heute früh |
| `die-gebildete-nummer-geht-als-gezogene-durch` | die fünfte Regel wird stillgelegt |
| `die-durchschrift-traegt-ihr-kuerzel-zweimal` | `belegname` fragt wieder das Register statt die Nummer |

Gemessen: 2460 Testfälle, 2457 grün, 3 übersprungen, 0 rot.
`npm run bestellprobe` fährt weiter 17 von 17 Prüfungen von Klick bis
Sicherung, und `npm run pruefe-ablage` meldet nichts.

## Was das für den Betrieb heißt

Nichts an den Papieren ändert sich. Kein Dateiname, keine Journalzeile, keine
Nummer auf einem Beleg. Was sich ändert, ist die eine Zeile unter dem
abgelegten Angebot: Sie steht nicht mehr da. Wenn sie das nächste Mal
erscheint, geht es um eine Rechnungsnummer — und dann ist sie zu lesen.
