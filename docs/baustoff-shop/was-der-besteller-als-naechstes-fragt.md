# Was der Besteller als Nächstes fragt

**14. September 2026, abends.** Die Runde davor hat die erste Frage
beantwortet, die ein Besteller an diesem Shop stellt: *Warum ändert der Korb
meine Menge?* Die zweite kommt unmittelbar danach und stand ebenfalls
nirgends: **Ich habe abgeschickt — und jetzt?**

## Die sechzehnte Wissensseite

`inhalte/wissen/was-nach-dem-absenden-passiert.md` geht den Weg Schritt für
Schritt durch, und zwar genau den, den die Betriebskette dieses Hauses seit
dem 4. September führt: Anfrage, Angebot mit Frist, Annahme und
Auftragsbestätigung, Zahlung, Lieferung vom Lager des Lieferanten, Rechnung,
Aufbewahrung.

Der wichtigste Satz steht gleich oben:

> **Das Absenden ist eine Anfrage, kein Kauf.**

Das ist keine Formulierungsfrage. Wer glaubt, mit dem Klick gekauft zu haben,
plant die Baustelle danach — und erfährt erst beim Ausbleiben der Lieferung,
dass nie ein Vertrag bestand. Die AGB sagen es in Punkt 2; die Seite sagt es
jetzt dort, wo jemand danach sucht.

## Was die Seite nicht verspricht

**Keine Antwortzeit.** Sie ist bis heute nicht entschieden — Punkt 4 der
offenen Liste —, und eine Seite, die sie erfindet, hätte eine Zusage gegeben,
die niemand halten muss.

> **Eine erfundene Antwortzeit ist schlimmer als keine: Die eine bricht man,
> die andere hat man nie gegeben.**

Stattdessen sagt die Seite, dass die Zusage fehlt und warum sie fällig ist:
Im Baustoffhandel kauft, wer am Nachmittag anfragt und am übernächsten Tag ein
Angebot bekommt, längst woanders.

**Keine Zahlwege als Versprechen.** Welche offenstehen, sagt die Kasse;
verbindlich zum Start ist die Vorkasse per Überweisung. Das ist die einzige
Fassung, die heute **und** nach der Wahl eines Zahlungsanbieters stimmt — und
eine Seite, die beim Hochladen falsch wird, ist keine Seite, sondern eine
Wartungsaufgabe.

## Was daran aus eigenem Bestand stammt

Alles. Die neun Schritte stehen in `src/betriebskette.js`, die Bindefrist in
der Belegvorlage nach § 862 ABGB, die Aufbewahrung in der Ablageordnung nach
§ 132 BAO, die Zahlwege in `src/zahlung.js` und ihre Zuordnung zu angeboten,
zurückgestellt und ausgeschlossen in den Rechtstexten. Kein Satz beschreibt
etwas, das dieser Bestand nicht selbst führt.

## Stand

* 16 Wissensseiten, 84 gebaute Seiten
* 26 Inhaltsdateien, 413 Absätze, **0 mit Verdacht**
* 55 Prüfer grün, 2 618 Testfälle, 305 Gegenproben

## Was diese Runde nicht erreicht hat

Die dritte Frage — *Liefert ihr überhaupt zu mir?* — hat eine eigene
Dienstseite, aber keine Wissensseite. Ob sie eine braucht, ist nicht gemessen:
Das Liefergebiet steht auf `lieferung.html`, in `llms.txt` und in jeder
Anzeige, und eine vierte Stelle wäre eher eine weitere Fassung als eine
Antwort.

Und beide neuen Seiten haben denselben blinden Fleck wie alle vierzehn davor:
**Niemand hat sie gelesen außer den Prüfern.** Was sie zusichern, ist, dass
keine Zahl darauf erfunden ist — nicht, dass sie die Frage so beantworten,
dass jemand aufhört zu suchen.
