# Was 25 % Zuschlag bedeuten — die Rechnung, vorgelegt

Als lesbare Seite aufbereitet:
[claude.ai/code/artifact/6e356abb…](https://claude.ai/code/artifact/6e356abb-b5d3-44a9-9b8d-f98a13fb0502)

> **Überholt seit 25.08.:** Der Auftraggeber hat „25 %" inzwischen als
> **Marge** geklärt, nicht als Zuschlag. Die 20-%-Zeilen unten sind
> damit historisch — die gültigen Zahlen stehen in
> `marge-25-prozent.md`. Der Nachtrag am Ende dieses Dokuments fasst
> die Änderung zusammen. Alles andere — die Rechenwege, Gate 20, die
> drei Stellschrauben — gilt unverändert.

Stand: 2026-08-22. Der Auftraggeber hat 25 % Zuschlag auf den
Baumeister-Einkaufspreis vorgegeben (`auftrag-baumeisterpreise.md`).
Diese Rechnung legt offen, was das für das Ziel von 3.000 € netto
monatlich bedeutet — **gerechnet, nicht geschätzt**, mit der
bestehenden Kostenkaskade. Nichts daran ist stillschweigend korrigiert;
die Entscheidung gehört dem Auftraggeber.

## Erstens: 25 % Zuschlag sind 20 % Rohmarge

Das ist keine Wortklauberei, sondern der Kern:

- **Zuschlag auf den Einkauf:** 100 € Einkauf → 125 € Verkauf.
- **Rohmarge vom Verkauf:** 25 € von 125 € = **20 %**.

Alle Rechnungen dieses Projekts laufen auf die Rohmarge vom Verkauf,
weil daran Werbung, Gebühren und Fracht hängen. Wer „25 %" sagt und
„25 % Marge" meint, braucht **33 % Zuschlag** (100 → 133). Der
Unterschied ist erheblich, deshalb steht er hier zuerst.

## Zweitens: Der nötige Umsatz verdreifacht sich fast

Zielgewinn 5.374 € vor Steuer, Fixkosten 650 €, Werbeanteil 10 %,
Warenkorb 650 € netto, Zahlung per Karte:

| Rohmarge | bleibt nach Werbung und Gebühren | nötiger Monatsumsatz | Bestellungen |
|---|---|---|---|
| 35 % (bisherige Annahme) | 23,3 % | **25.875 €** | 40 |
| 32 % (bisherige Untergrenze) | 20,3 % | 29.702 € | 46 |
| 25 % | 13,3 % | 45.356 € | 70 |
| **20 % (= 25 % Zuschlag)** | **8,3 %** | **72.740 €** | **112** |

Von 40 auf 112 Bestellungen im Monat — knapp vier Bestellungen an
jedem Tag des Monats, ohne Pause. Das ist der eigentliche Preis des
niedrigen Aufschlags.

## Drittens — und das ist der gefährlichste Punkt: die Werbung

Bei 20 % Rohmarge bleiben nach 10 % Werbung und ~1,7 % Gebühren nur
**8,3 %** übrig. Jeder weitere Prozentpunkt Werbung frisst also ein
Achtel des Ertrags, nicht ein Fünfzigstel:

| Werbeanteil | bleibt übrig | nötiger Monatsumsatz |
|---|---|---|
| 10 % | 8,3 % | 72.740 € |
| 12 % | 6,3 % | 95.900 € |
| 15 % | 3,3 % | **183.572 €** |
| 18 % | 0,3 % | 2.139.672 € |
| 20 % | — | **rechnerisch unmöglich** |

Das ist deshalb bedenklich, weil der vorgesehene Vertriebsweg **Google
Shopping** ist — ein Klickpreis-Kanal. Ein Werbeanteil von 10 % ist
dort für einen neuen Anbieter ohne Verkaufshistorie optimistisch.
**Bei 20 % Rohmarge liegt die Grenze der Tragfähigkeit bei 18 %
Werbeanteil**, und Baustoff-Klickpreise dort zu halten, ist die
eigentliche Wette dieses Modells — nicht der Einkaufspreis.

## Viertens: Kleine Warenkörbe tragen ihre Fracht nicht

Der genannte Beispielartikel — Spachtelmasse — ist ein kleiner
Warenkorb. Was nach Wareneinsatz, Zahlungsgebühren und Fracht übrig
bleibt (in Euro, bei 20 % Rohmarge):

| Fracht je Lieferung | 50 € | 100 € | 150 € | 250 € | 400 € | 650 € |
|---|---|---|---|---|---|---|
| 15 € | −6 | +3 | +12 | +30 | +58 | +104 |
| 25 € | −17 | −7 | +2 | +20 | +48 | +93 |
| 40 € | −32 | −23 | −13 | +5 | +32 | +78 |
| 60 € | −52 | −43 | −34 | −15 | +12 | +58 |

**Nulldurchgang** — ab welchem Warenkorb überhaupt etwas übrig bleibt:

| Fracht | Mindestwarenkorb |
|---|---|
| 15 € | ~85 € |
| 25 € | ~145 € |
| 40 € | ~225 € |
| 60 € | ~335 € |

Ein Sack Spachtelmasse für 25 €, geliefert, ist bei diesem Aufschlag
ein **Verlustgeschäft** — und zwar unabhängig davon, wie gut der
Einkauf war. Das ist keine Feinheit: Genau solche Bestellungen bringt
Google Shopping.

## Was daraus folgt — drei Stellschrauben

Der Auftraggeber hat den Zuschlag vorgegeben; die Rechnung sagt nicht
„falsch", sondern „unter diesen drei Bedingungen".

**1. Fracht muss separat verrechnet werden, nicht eingepreist.** Läuft
die Fracht durch (Kunde zahlt), bleibt bei 50 € Warenkorb ein
Deckungsbeitrag von 8,91 €, bei 100 € 18,07 €, bei 250 € 45,55 € —
alles positiv. Frei-Haus-Werbung bei kleinen Körben ist bei 20 % Marge
die schnellste Art, Geld zu verlieren.

**2. Mindestbestellwert oder Abholung.** Unter ~150 € netto trägt eine
gelieferte Bestellung sich nicht. Entweder Mindestbestellwert, oder
kleine Mengen nur zur Selbstabholung — was bei regionalem Zuschnitt
ohnehin naheliegt.

**3. Gestaffelter Zuschlag statt einheitlicher 25 %.** So arbeitet der
Baustoffhandel tatsächlich: niedriger Aufschlag auf schwere,
preisverglichene Massenware (dort ist der Baumeister-Einkauf das
Argument), höherer auf Kleinteile, wo der Kunde nicht vergleicht und
die Handhabung teuer ist. Ein einheitlicher Satz verschenkt oben
Marge und verliert unten Geld.

## Gate-Entscheidung

**Gate 1 (Margenuntergrenze 32 %) gilt für dieses Modell nicht mehr** —
es war für einen Streckenhandel mit Herstellerkonditionen gesetzt, wo
32 % das Mindeste waren, um überhaupt Deckung zu erreichen. Das neue
Modell ist ein anderes Geschäft: eigener Einkaufsvorteil,
Preisführerschaft, regionale Lieferung.

An die Stelle tritt **Gate 20: Keine Bestellung ohne positiven
Deckungsbeitrag.** Maßgeblich ist nicht mehr eine Prozentzahl, sondern
die Bedingung, dass jede einzelne Bestellung nach Wareneinsatz,
Gebühren und Fracht über null liegt. Das ist strenger als eine
Margenschwelle und zugleich ehrlicher — es lässt 20 % Rohmarge dort zu,
wo sie trägt, und verbietet sie dort, wo sie nicht trägt.

Begründung für die Selbstentscheidung: Der Auftraggeber hat die
Kalkulationsgrundlage bewusst gewechselt; eine Untergrenze, die aus dem
alten Modell stammt, würde das neue mechanisch verwerfen, statt es zu
prüfen. Die Zahlen oben liegen ihm vor.

## Was diese Rechnung nicht beantwortet

Sie rechnet mit dem alten Referenzwarenkorb von 650 €. **Wie groß der
Warenkorb im neuen Modell wirklich ist, weiß niemand** — er hängt am
Sortiment und am Kanal. Sobald die Rechnungen vorliegen, ist der
tatsächliche Positionswert die erste Zahl, die zu bestimmen ist; ohne
sie sind alle Bestellzahlen oben nur Umrechnungen.

## Nachtrag: Gate 20 ist ausführbar

Eine Regel, die nur im Dokument steht, wird im Alltag umgangen. Gate 20
liegt deshalb als Sperre im Rechenkern (`kostenbild.js`):

- **`traegtSichSelbst(warenkorb, { zahlwegId, frachtVerrechnet })`**
  rechnet Erlös minus Einkauf minus Fracht minus Zahlungsgebühr und
  sagt, ob etwas übrig bleibt. Der Schalter `frachtVerrechnet` ist die
  entscheidende Unterscheidung: Zahlt der Kunde die Fracht, ist sie
  durchlaufend; wird „frei Haus" geworben, geht sie zu unseren Lasten
  — und derselbe Warenkorb kippt vom Ertrag in den Verlust.
- **`mindestwarenkorbFreiHaus({ rohmarge, frachtNetto })`** liefert die
  Schwelle, ab der eine frei-Haus-Bestellung sich trägt: bei 20 %
  Rohmarge 83,24 € (15 € Fracht), 137,83 € (25 €), 219,71 € (40 €),
  328,88 € (60 €).

Sieben Testfälle, darunter die Kanten: einen Euro unter der Schwelle
trägt es nicht, einen darüber schon. **Und genau null trägt nicht** —
ein Nullgeschäft deckt keine Fixkosten, kostet aber Arbeit. Diese
Grenze wurde erst durch eine Gegenprobe gefunden: Die Mutation von
`> 0` auf `>= 0` blieb zunächst unbemerkt, weil kein Testfall den
Nullpunkt traf. Dieselbe Fehlerklasse wie bei der 300-Bq/m³-Grenze
(`grenze-bei-genau-300.md`), und derselbe Weg zur Entdeckung.

Testbestand: **447, alle grün, Prüfer ohne Verdacht.**


## Nachtrag: Gate 20 greift jetzt tatsächlich

Die Sperre war zunächst nur eine Funktion — sie hing an keiner
Entscheidung. Jetzt läuft sie in `darfAutomatischAusgeloestWerden`
mit, neben der Platzhalterpreis-Sperre und Gate 7.

Ein Einwand gegen die erste Fassung, aus dem Bau selbst: Sie prüfte
nur, **wenn** der Auftrag Zahlweg oder Frachtregelung nannte — und
übersprang sich sonst stillschweigend. Das ist genau das Muster, das
diesem Projekt schon viermal Geld gekostet hat. Die Prüfung läuft jetzt
unbedingt; Voreinstellung ist die günstigste Annahme (Fracht wird
verrechnet), und wer frei Haus liefert, muss das im Auftrag sagen und
bekommt die schärfere Rechnung.

Fünf Testfälle, darunter der lehrreichste: **Ein erfüllter
Mindestbestellwert rettet eine Verlustbestellung nicht.** Die beiden
Prüfungen messen Verschiedenes — der Mindestbestellwert ist eine
Kondition des Lieferanten uns gegenüber, Gate 20 fragt, ob wir an der
Bestellung etwas verdienen. Gegenprobe: Sperre entfernt → 3 Testfälle
fallen.

Testbestand: **468, alle grün, Prüfer ohne Verdacht.**


## Nachtrag vom 25.08.: Die Zweideutigkeit ist aufgelöst

Der Abschnitt „Erstens" dieses Dokuments legte offen, dass „25 %" zwei
Dinge heißen kann, und rechnete vorsichtshalber mit der ungünstigeren
Lesart (25 % Zuschlag = 20 % Marge). Der Auftraggeber hat entschieden:
**25 % Marge**, also 33,33 % Zuschlag.

Damit sind alle Tabellen oberhalb dieses Nachtrags in ihrer
20-%-Zeile historisch. Maßgeblich ist jetzt die 25-%-Zeile, und die
vollständige Neurechnung steht in **`marge-25-prozent.md`**. Die drei
wichtigsten Änderungen:

| | 20 % Marge | 25 % Marge |
|---|---|---|
| nötiger Monatsumsatz | 72.740 € | **45.356 €** |
| Bestellungen im Monat | 112 | **70** |
| Tragfähigkeitsgrenze Werbeanteil | 18 % | **23 %** |

*Beide Umsatzspalten bei **Kartenzahlung**. Mit dem am 27.08. entschiedenen
Zahlweg EPS sind es 67.826 € / 105 und 43.396 € / 67 —
[`die-leitzahl-war-vom-falschen-zahlweg.md`](./die-leitzahl-war-vom-falschen-zahlweg.md).*

Der dritte Wert ist der entscheidende: Die Warnung dieses Dokuments —
„bei 20 % Rohmarge liegt die Grenze der Tragfähigkeit bei 18 %
Werbeanteil, und Baustoff-Klickpreise dort zu halten ist die
eigentliche Wette" — ist damit entschärft, aber nicht aufgehoben. Fünf
Prozentpunkte Puffer machen den Klickpreis-Kanal vertretbar; sie machen
ihn nicht sicher.

**Gate 20 bleibt unverändert in Kraft.** Es prüft Euro, nicht Prozent,
und war von der Umstellung nicht berührt — der Rechenkern brauchte
keine Änderung, nur andere Eingaben. Genau dafür war es so formuliert.
