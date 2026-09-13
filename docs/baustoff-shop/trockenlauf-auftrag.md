# Trockenlauf: Läuft die Kette ohne Zutun?

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/auftragslauf.js`,
12 Testfälle.

Die Vorgabe des Auftraggebers lautet, das Geschäft solle ohne laufendes Zutun
bestehen. [`phase6-automatisierung.md`](./phase6-automatisierung.md) beziffert
den Restaufwand mit 6,5 bis 12 Stunden im Monat. Beide Sätze waren bisher
Behauptungen: Niemand ist die Kette einmal Schritt für Schritt durchgegangen
und hat gezählt, wo sie stehen bleibt.

`trockenlauf()` tut das. Es wird **nichts ausgelöst** — für jeden der zehn
Schritte wird geprüft, ob er unter gegebenen Voraussetzungen von selbst liefe.
Der Lauf steht im Funktionsmuster unter „Läuft die Kette ohne Zutun?".

## Der heutige Stand

```
automatisch   Bestellung geht ein
automatisch   Bestelldaten und Unternehmerstatus prüfen
handarbeit    UID beim EU-Informationsaustauschsystem abfragen      2 min
BLOCKIERT     Zahlungseingang feststellen
handarbeit    Bestellung je Lieferant auslösen                      4 min
handarbeit    Auftragsbestätigung des Lieferanten einlesen          3 min
handarbeit    Liefertermin an den Kunden weitergeben                2 min
automatisch   Direktlieferung an die Baustelle
BLOCKIERT     Rechnung an den Kunden stellen
handarbeit    Beleg in die Buchhaltung                              2 min
```

**13 Minuten Handarbeit je Bestellung, zwei harte Blockaden.** Bei 37
Bestellungen im Monat sind das 8,0 Stunden — allein für die Vorgänge, die an
einer Bestellung hängen.

Die Direktlieferung ist der einzige Schritt, der unter allen Umständen von
selbst läuft. Das ist kein Zufall: Sie ist der einzige, den ein anderer macht.

## Zwei Blockaden, zwei ganz verschiedene Dinge

Eine Blockade kostet keine Minuten. Sie kostet den Auftrag.

| Blockade | Fehlt | Wer kann es lösen |
|---|---|---|
| Zahlungseingang | Zahlungsanbieter | Auftraggeber — Geschäftskonto auf eine reale Firma |
| Rechnung | Firmendaten, echte Konditionen | Auftraggeber — elf Pflichtangaben, ein Händlervertrag |

Beide sind **nicht programmierbar**. Kein weiterer Baustein im Shop bringt sie
weg, und das ist der wichtigste Satz dieses Dokuments: Der Teil, der sich bauen
lässt, ist gebaut. Was bleibt, ist ein Konto und ein Vertrag.

## Was jede fehlende Fähigkeit kostet

Gerechnet als Abstand zum Vollausbau — was ändert sich, wenn genau diese eine
Fähigkeit fehlt und sonst nichts:

| Fehlende Fähigkeit | Blockiert | Zusatzminuten je Bestellung |
|---|---|---|
| Zahlungsanbieter | Zahlung | 0 |
| Firmendaten | Rechnung | 0 |
| Echte Konditionen | Rechnung | 4 |
| Produktdatenschnittstelle | — | 9 |
| UID-Abfrage | — | 2 |
| Buchhaltungsanbindung | — | 2 |

Die Reihenfolge ist absichtlich nicht nach Minuten sortiert. Eine Blockade
schlägt jede Handarbeit, auch wenn sie null Minuten kostet.

Bemerkenswert ist die Produktdatenschnittstelle mit neun Minuten: Sie ist der
**einzige Posten, den Programmieren tatsächlich löst** — vorausgesetzt, ein
Hersteller liefert die Daten. Genau das ist Gate 6, und genau darüber
entscheiden die zwölf Anfragen.

## Abgleich mit Phase 6 — und eine Lücke darin

Vergleichbar sind nur die Vorgänge je Bestellung. Inhaltspflege,
Normenänderungen, Transportschäden und die fachliche Auskunft hängen nicht an
der Bestellmenge und stehen im Trockenlauf nicht drin.

| Szenario | Phase 6, Zeilen je Bestellung | Trockenlauf |
|---|---|---|
| ohne Datenfeed | 4,7 h/Monat | **8,0 h/Monat** |
| mit Datenfeed | 2,5 h/Monat | 2,5 h/Monat |

Die Abweichung im ersten Fall ist kein Streit über Minuten, sondern über
Vollständigkeit. Zwei Schritte stehen in der Tabelle der Phase 6 überhaupt
nicht:

1. **UID-Abfrage beim EU-Informationsaustauschsystem** — 2 Minuten je
   Bestellung, **1,2 h/Monat**. Sie ist keine Kür: Gate 7 verlangt sie zum
   Ausschluss von Verbrauchern, und ab 10.000 € brutto verlangt sie § 11 Abs 1
   Z 2 UStG. `kunde.js` prüft heute nur Format und Prüfziffer und sagt
   ausdrücklich, dass die verbindliche Abfrage aussteht.
2. **Auftragsbestätigung des Lieferanten einlesen** — 3 Minuten je Bestellung,
   **1,85 h/Monat**. Phase 6 kennt nur die Bestellübergabe *hinaus*. Der
   Rücklauf mit Lieferzeit und Teilmengen kommt als PDF oder E-Mail und muss
   gelesen werden, bevor der Kunde einen Termin hört.

Zusammen **3,1 Stunden im Monat**, die bisher niemand gezählt hat. Das
Szenario „ohne Datenfeed" der Phase 6 steigt damit von rund 12 auf rund
**15 Stunden im Monat** — die Vorgabe von 4–8 Stunden ist ohne Schnittstelle
nicht nur knapp verfehlt, sondern um das Doppelte.

Für das Szenario „mit Datenfeed" ändert sich am Ergebnis nichts, weil beide
Wege auf 2,5 h kommen. Die Zusammensetzung unterscheidet sich allerdings, und
das gehört benannt.

### Eine Stelle, an der mein Modell optimistischer ist als Phase 6

Der Trockenlauf lässt den Schritt „Liefertermin weitergeben" verschwinden,
sobald eine Produktdatenschnittstelle besteht. Phase 6 führt „Rückfragen zum
Liefertermin" mit 1,2 h **in beiden Szenarien**.

Phase 6 hat vermutlich recht. Ein Datenfeed liefert eine nominelle Lieferzeit,
keinen zugesagten Termin für eine bestimmte Sendung — und im Streckengeschäft
ruft der Kunde genau dann an, wenn die nominelle Angabe nicht hält. Der
Trockenlauf ist an dieser Stelle als **untere Schranke** zu lesen, nicht als
Prognose. Korrigiert man ihn um diesen Posten, liegt das Szenario „mit
Datenfeed" bei 3,7 statt 2,5 Stunden.

Die Konstante bleibt sie beide: Der Trockenlauf misst, was die Technik
hergibt. Was Menschen fragen, misst er nicht.

## Was das für die Passivitätsfrage bedeutet

Die Frage des Auftraggebers war, ob das Geschäft ohne einen einzigen Schritt
seinerseits laufen kann. Der Trockenlauf gibt darauf eine dreiteilige Antwort.

**Die Auftragskette selbst kann auf null.** Im Vollausbau meldet jeder der zehn
Schritte „automatisch". Das ist kein Versprechen, sondern eine Aussage über die
Struktur: Kein Schritt der Kette verlangt seinem Wesen nach einen Menschen.

**Die Voraussetzungen dafür kann niemand programmieren.** Sechs Fähigkeiten
stehen im Modell, und fünf davon sind Verträge, Konten oder Zusagen Dritter.
Nur eine — die Schnittstelle — ist Arbeit, die hier entstehen kann, und auch
sie setzt voraus, dass ein Hersteller Daten liefert.

**Der Rest hängt nicht an der Bestellung.** Die fachliche Auskunft vor dem
Kauf, die Phase 6 als das eigentlich Unautomatisierbare benennt, taucht im
Trockenlauf gar nicht auf. Sie skaliert nicht mit der Bestellmenge, sondern mit
der Zahl der Interessenten — und sie ist zugleich die Quelle der Rohmarge. Wer
sie wegautomatisiert, verkauft Baustoffe zum Baumarktpreis.

**Kein neues Gate.** Der Befund ändert keine Entscheidung, er beziffert eine.
Gate 6 stand ohnehin auf „ohne Schnittstelle bricht die Bestellübergabe";
neu ist nur, dass die Größenordnung jetzt eine Zahl hat statt eines Adjektivs.
Die Korrektur der Phase-6-Tabelle um 3,1 Stunden ist in
[`STATUS.md`](./STATUS.md) unter den Korrekturen vermerkt.

## Was als Nächstes gebaut werden könnte

Die UID-Abfrage ist der einzige der sechs Posten, der ohne Freigabe und ohne
Ausgabe umsetzbar wäre — das EU-Informationsaustauschsystem hat eine
öffentliche Schnittstelle ohne Anmeldung. Sie scheitert hier nur daran, dass
diese Umgebung keine fremden Server erreicht. Vorbereiten ließe sie sich
trotzdem: die Anbindung schreiben, gegen aufgezeichnete Antworten prüfen und
scharf schalten, sobald der Shop irgendwo läuft, wo er ins Netz darf.
