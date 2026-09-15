# Ab wann „kein Verkauf" eine Antwort ist

**1. September 2026.** Seit dem 15. August steht unter jeder Kampagnenrechnung
derselbe Vorbehalt: *Die Kaufquote ist eine Annahme, keine Messung.* Die
Kampagne rechnet mit 2 %, hilfsweise mit 1 %.

Daraus folgt eine zweite Frage, und die hat bisher niemand gestellt:

> **Wenn die Anzeigen einen Monat laufen und nichts verkaufen — was weiß man
> dann?**

## Die Antwort ist unbequem

Bei 10 € Tagesbudget und 1,50 € Klickpreis kommen rund **200 Klicks im Monat**
zustande. Läge die wahre Kaufquote bei 1 %, wäre die Wahrscheinlichkeit, in
200 Klicks **keinen einzigen** Verkauf zu sehen, immer noch:

```
0,99 ^ 200 ≈ 13,4 %
```

Ein Monat ohne Verkauf widerlegt also nichts. Wer danach abbricht, wirft in
etwa jedem achten Fall ein funktionierendes Geschäft weg. Wer weiterzahlt,
ohne die Schwelle vorher zu kennen, zahlt nach Gefühl.

> **Ein Versuch ohne vorher festgelegte Abbruchschwelle ist kein Versuch,
> sondern eine Hoffnung mit Rechnung.**

## Was das Budget an Erkenntnis kauft

Neu: `src/werbewirkung.js` und `npm run werbeprobe`. Klicks sind unabhängige
Versuche; die Wahrscheinlichkeit, in `n` Klicks nichts zu verkaufen, ist
`(1 − q)^n`. Daraus die **Abbruchschwelle** — die kleinste Klickzahl, ab der
ein Ausbleiben jeder Bestellung die Quote mit 95 % Sicherheit ausschließt:

```
n = ln(0,05) / ln(1 − q)
```

| q | Klick | Klicks/Monat | P(Monat ohne Verkauf) | Schwelle | kostet | dauert |
|---|---|---|---|---|---|---|
| 0,5 % | 1,50 € | 200 | **36,7 %** | 598 | 897 € | 90 Tage |
| 1,0 % | 1,00 € | 300 | 4,9 % | 299 | 299 € | 30 Tage |
| **1,0 %** | **1,50 €** | **200** | **13,4 %** | **299** | **449 €** | **45 Tage** |
| 1,0 % | 2,50 € | 120 | 30,0 % | 299 | 748 € | 75 Tage |
| 2,0 % | 1,50 € | 200 | 1,8 % | 149 | 224 € | 22 Tage |

Und die Umkehrung — was ein Fehlversuch tatsächlich **gezeigt** hat:

```
  50 Klicks ohne Bestellung  →  Quote über 5,82 % ausgeschlossen
 100 Klicks                  →  über 2,95 %
 200 Klicks                  →  über 1,49 %
 300 Klicks                  →  über 0,99 %
 600 Klicks                  →  über 0,50 %
```

Gemessen am Startbudget von 10.000 € sind 449 € für eine belastbare Antwort
wenig. **Die Entscheidung ist bezahlbar — sie war nur nie beziffert.**

## Wer trägt, wenn die Quote schlecht ist

Bei 1,50 € Klickpreis kostet ein Verkauf `1,50 ÷ q` an Werbung:

| Gruppe | Deckungsbeitrag | bei 0,5 % | bei 1,0 % | bei 2,0 % |
|---|---|---|---|---|
| WDVS | 209,40 € | **−90,60 €** | +59,40 € | +134,40 € |
| Dämmung | 295,42 € | **−4,58 €** | +145,42 € | +220,42 € |
| Kamin | 410,94 € | +110,94 € | +260,94 € | +335,94 € |

Das ist der eigentliche Grund, den ersten Anlauf auf Kamin und Dämmung zu
legen — und er ist jetzt beziffert statt begründet.

## Entschieden: die Abbruchregel, bevor Geld fließt

Wie bei den Grenzwerten für den Rechnungskauf wird die Regel **vorher**
festgelegt, damit sie nicht im Nachhinein an das Ergebnis angepasst wird.

| Stand | Bedeutung | Entscheidung |
|---|---|---|
| bis 299 Klicks ohne Bestellung | nichts ausgeschlossen | **weiterlaufen lassen.** Ein leerer Monat ist kein Befund |
| 299 Klicks (≈ 449 €, ≈ 45 Tage) ohne Bestellung | 1 % ausgeschlossen | **auf Kamin verengen.** Unter 1 % kostet ein Verkauf über 150 € Werbung; WDVS trägt das nicht mehr verlässlich |
| 598 Klicks (≈ 897 €) ohne Bestellung | 0,5 % ausgeschlossen | **Klickkanal beenden.** Bei über 300 € Werbekosten je Verkauf trägt nur noch Kamin, und dann trägt der Kanal das Vorhaben nicht |
| erste Bestellung | die Quote ist positiv | messen statt schätzen; die Rechnung neu mit dem gemessenen Wert |

Gezählt werden **Klicks**, nicht Tage. Ein Tageszähler misst die Geduld, ein
Klickzähler den Versuch.

## Der Haken, der die ganze Regel trägt

Die Regel zählt Verkäufe. Der Shop erzeugt heute keine Verkäufe, sondern
**Anfragen** — eine fertig gerechnete Positionsliste am Ende der Kasse, zum
Kopieren in eine Mail (`startklar`: es fehlen Impressum, Lieferzeit,
Zahlungsanbieter, Rechtstexte).

Wo also wird gezählt?

Nicht in einem Analysewerkzeug — der Shop trägt bewusst keines. Gezählt wird
an genau einer Stelle: **im Posteingang des Betreibers.** Jede eingegangene
Anfrage ist ein Datenpunkt, und es gibt keinen zweiten.

Daraus folgt etwas, das ich bisher nur als Impressumspflicht geführt habe:

> **Die E-Mail-Adresse ist nicht nur der Kontakt. Sie ist das einzige
> Messgerät des ganzen Versuchs.**

Ohne sie hat die fertig gerechnete Anfrage keinen Empfänger — und die
Abbruchregel keinen Zähler. Ein Klickbudget ohne Zähler kauft Klicks und
keine Erkenntnis. Damit rückt die Adresse von Platz vier der offenen Punkte
auf Platz eins des Werbewegs.

## Was diese Rechnung nicht kann

- Sie unterstellt gleich gute Klicks ab der ersten Minute. Google lernt
  anfangs, ein Kleinbudget schöpft die guten Suchanfragen nicht ab, und der
  Weg von der Anfrage zur Bestellung ist hier nicht gemessen. Alle drei
  Abweichungen gehen in dieselbe Richtung: **Die Schwelle ist eine Untergrenze
  der nötigen Klicks, nicht ihr Erwartungswert.**
- Sie sagt **nicht**, ob der Markt 200 Klicks im Monat hergibt. Fünf Bezirke,
  ein Fachsortiment — wird das Tagesbudget nicht ausgeschöpft, dauert jede
  Zeile der Tabelle länger als angeschrieben. Das ist die nächste offene
  Frage, und sie braucht Zahlen von Google, nicht von mir.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Aufrunden der Schwelle zu Abrunden | ja |
| „trägt" von `>` auf `>=` (Gleichstand als Tragen) | ja |
| Klicks je Monat = Klicks je Tag | ja |
| Prüfung unbrauchbarer Quoten abgeschaltet | ja |

Die erste Probe rechnet die Formel **nicht mit derselben Formel** nach: Sie
prüft, dass bei der Schwelle `P(kein Verkauf) ≤ 5 %` gilt und einen Klick
davor noch nicht. Eine Probe, die `ln(0,05)/ln(1−q)` gegen
`ln(0,05)/ln(1−q)` hält, prüft die Tastatur.

## Stand

- 1.070 Tests, 0 rot; alle Prüfer grün
- neu: `npm run werbeprobe`
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
