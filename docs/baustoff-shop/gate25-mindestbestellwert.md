# Gate 25 — die Sperre stand hinter dem Ja

**3. September 2026.** Gate 20 heißt „keine Bestellung ohne positiven
Deckungsbeitrag" und läuft seit dem 28. August. Es läuft in
`darfAutomatischAusgeloestWerden` — also **nach** der Kasse.

Was das in der Praxis heißt, ergibt ein Blick auf einen kleinen Warenkorb:

| Was der Kunde tut | Was der Shop tat |
|---|---|
| legt 10 m² Fassaden-EPS in den Korb (19,30 € netto) | rechnet durch, weist Preise aus |
| geht zur Kasse | nimmt Bezirk und Zahlweg entgegen |
| lässt sich die fertige Anfrage geben | erzeugt sie, mit Beträgen, zum Abschicken |
| schickt sie ab | — |
| | **Gate 20 lehnt ab.** Deckungsbeitrag negativ. |

> **Eine Sperre, die erst nach dem Ja greift, ist keine Sperre, sondern eine
> Absage mit Verzögerung.**

Der Shop hatte gegenüber dem Kunden **überhaupt keine Untergrenze**. Was
`warenkorb.bestellbar` prüfte, war der Mindestbestellwert des *Lieferanten* uns
gegenüber — und der steht für den einzigen bestätigten Lieferanten auf `null`.
`traegtSichSelbst` kam im ganzen Kundenweg nicht vor.

---

## Die Entscheidung: 250 € netto Warenwert je Lieferung

Der Gate-20-Bericht vom 28. August hatte drei Wege aufgezählt und den ersten
vorgeschlagen — Mindestbestellwert —, die Entscheidung aber dem Auftraggeber
überlassen, „weil sie sichtbar am Kunden ankommt". Der Arbeitsloop entscheidet
Gates selbst und schreibt die Begründung auf. Hier ist sie.

**Gerechnet, nicht geschätzt.** Nulldurchgang mit den bestätigten
Poschacher-Konditionen (Frachtpauschale 75,50 €, Kranentladung 7,50 € je Hub,
ÖBB-Palette 22,00 €, Folierung 6,50 €) und 25 % Zielmarge, Fracht wird dem
Kunden verrechnet:

| Zahlweg | 1 Palette | 2 Paletten | 3 Paletten |
|---|---|---|---|
| Vorkasse | 114,01 € | 202,01 € | 290,02 € |
| EPS | 123,97 € | 215,94 € | 307,91 € |
| Karte (Stripe) | 129,31 € | 223,60 € | 317,99 € |

**250 € deckt zwei Paletten auf dem ungünstigsten angebotenen Zahlweg**, mit
26 € Abstand. Eine Palette ist der belegte Boden — die Rechnung über 1.934 €
netto weist sie aus. Zwei ist der erste Schritt, den kein Beleg mehr trägt: Die
Palettenzahl hängt an Gewicht und Packmaß, und der Katalog führt Gewicht für
**sieben von 46** Artikeln. Genau deshalb reicht die Grenze einen Schritt über
das Belegte hinaus.

**Drei Paletten deckt sie nicht**, und das steht so in `data/betreiber.json`.
Dafür bleibt Gate 20 die Rückfallebene: Es rechnet jede einzelne Bestellung vor
der Auslösung nach. Zwei Sperren, zwei Aufgaben — die eine ist das Versprechen
an den Kunden, die andere der Beweis dahinter.

### Warum je Lieferung und nicht je Warenkorb

Anfahrt, Palette und Folierung fallen **je Lieferung** an. Ein Korb aus zwei
Sortimenten ergibt zwei Teillieferungen; 200 € plus 200 € sind zusammen über
der Grenze und einzeln zweimal darunter. Gemessen wird deshalb die kleinste
Teillieferung.

### Was der Kunde sieht — und was nicht

Der Fehlbetrag steht in **seiner** Währung, dem Warenwert, und aufgerundet:
„Es fehlen noch rund 154 €." Was die Grenze trägt — Palette, Anfahrt, Spanne —
steht nirgends auf einer Kundenseite. Ein Testfall hält den Hinweistext gegen
sechs Wörter, die dort nicht vorkommen dürfen, `Marge` und `Einkauf` darunter.

Der Hinweis steht **im Warenkorb**, nicht erst in der Kasse: Wer erst nach der
Wahl von Bezirk und Zahlungsart erfährt, dass die Menge nicht reicht, hat drei
Schritte umsonst gemacht.

---

## Was dabei noch aufgefallen ist

### Drei Zahlen für dieselbe Frage

Auf der Lieferseite stand seit dem 25. August:

> „Unter etwa **400 €** netto Warenwert trägt eine gelieferte Bestellung ihre
> eigenen Nebenkosten nicht."

Der Gate-20-Bericht rechnete 114 €, die neue Entscheidung 250 €. Drei Zahlen,
eine Frage, und die auf der Kundenseite war die einzige, die niemand
nachgerechnet hatte — ein Satz ohne Quelle, den `pruefe-seiten` bis dahin
durchgehen ließ, weil er einen Stand trug. Die Seite nennt jetzt die Zahl aus
`data/betreiber.json` und rechnet sie nicht nach; zwei Fassungen wären zwei
Grenzen.

### Ein Prüfer, der seinen eigenen Quelltext las

Die Wegprobe sollte messen, ob der Warenkorb den Kleinmengensatz zeigt. Der
erste Anlauf las `document.body.textContent` — und der enthält auch den Inhalt
der Skript-Elemente. Die gesuchte Zeichenkette steht im Quelltext des Bündels,
also meldete die Messung „ja", **auch nachdem die Gegenprobe den Hinweis
abgeschaltet hatte**.

> **Eine Messung, die ihren eigenen Quelltext liest, kann nicht rot werden.**

Gelesen wird jetzt der gezeichnete Bereich. Aufgefallen ist es nur, weil die
Gegenprobe danebenstand — von Hand hätte der Satz auf der Seite gestanden und
alles hätte gestimmt.

### Eine Gegenprobe, die Gate 25 unerreichbar gemacht hat

Der Kleinmengensatz („Die Fracht kostet hier mehr als die Ware") steht im
Warenkorb **und** im Anfragetext; seit dem 2. September gibt es dafür eine
Gegenprobe über den Anfragetext. Sie fällt jetzt ins Leere, und zwar aus einem
guten Grund: Der Mindestbestellwert von 250 € liegt über jedem Frachtsatz des
Bestands (höchstens 100 €). Ein Korb, der überhaupt einen Anfragetext erzeugt,
kann die Fracht nicht mehr unterschreiten.

Der Satz im Anfragetext bleibt stehen — gebraucht wird er, sobald die Grenze
fällt — und `kundenanfrage.test.js` hält ihn. Die Gegenprobe zeigt jetzt auf
den Warenkorb, wo derselbe Hinweis weiter greift. **Eine Stelle, die durch eine
Entscheidung unerreichbar wird, gehört umgehängt und nicht gelöscht.**

### Ein Schlusssatz, der die eigene Messung überschrieb

Die Wegprobe zählte fünf Schritte und schrieb darunter „Vier Schritte, kein
Textfeld, ein fertiger Text am Ende." Der Satz stand als Text da, seit der Weg
vier Schritte lang war. Jetzt kommt die Zahl aus der Messung.

---

## Wo die Grenze überall steht

| Ort | Was dort steht |
|---|---|
| `data/betreiber.json` | die Zahl und ihre Herleitung — die einzige Quelle |
| `src/shopkern.js` | `mindestbestellwertKunde()`, im Browser, ohne Einkaufspreise |
| `src/kundenanfrage.js` | kein Anfragetext unter der Grenze, sondern ein Grund |
| `shop-ui.js` | der Hinweis, im Warenkorb und in der Kasse, aus **einer** Funktion |
| Lieferseite | Preistafel und ein eigener Abschnitt, mit Quelle und Stand |
| AGB Punkt 5 | „Mindestbestellwert und Mindestbestellmengen" — die Grundlage |
| `src/abgleich.js` | die Zuordnung des AGB-Punkts auf die Funktion, die ihn einlöst |

Der AGB-Punkt trug bis heute nur die Grenze des **Herstellers**. Damit ein
Punkt zwei Funktionen in zwei Modulen nennen kann, ohne zweimal halb erklärt zu
werden, darf ein Ziel sein Modul jetzt selbst nennen: `shopkern.js#name`. Die
Alternative wäre ein zweiter Eintrag für denselben Punkt gewesen — und die
Regel „ein Punkt, eine Zuordnung" ist gerade die, die das verhindert.

## Geprüft

Zehn neue Testfälle in `test/gate25.test.js`, darunter der, auf den es
ankommt:

> **Was die Kasse annimmt, darf Gate 20 nicht ablehnen.** Für jeden
> angebotenen Zahlweg wird der Nulldurchgang aus dem Rechenkern gesucht und
> gegen die Grenze gehalten. Wandert die Zahl in `betreiber.json` nach unten,
> fällt der Testfall.

Dazu zwei Gegenproben: eine Kasse ohne Mindestbestellwert (der Zustand von
gestern, wörtlich wiederhergestellt) und ein Warenkorb, der den
Kleinmengensatz verschweigt.

## Was offen bleibt

Die **Palettenzahl je Lieferung** ist weiter nicht ableitbar. Sie ist die eine
Angabe, die diese Grenze von einer vorsichtigen Schätzung in eine Rechnung
verwandeln würde — und sie steht in keiner der vier Fragen an den Lieferanten.
Solange sie fehlt, deckt die Grenze zwei Paletten und Gate 20 den Rest.
