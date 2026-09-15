# Dreimal 250 € für eine Lieferung

**6. September 2026, spätnachts.** Der Mindestbestellwert gilt **je Lieferung**
(Gate 25). Vier Stellen erklärten dem Kunden, wann aus einem Warenkorb mehrere
Lieferungen werden:

> *„Werden mehrere **Hersteller** bestellt, entstehen mehrere Lieferungen, und
> die Grenze gilt für jede einzelne."*

— die Lieferseite, die Fragen und Antworten, die Warenkorbfläche auf jeder
Seite mit Artikelkarten und `llms.txt`.

Der Katalog führt **46 Artikel von einem einzigen Lieferanten**, und
`berechneWarenkorb` teilt nach `lieferantId`:

```js
teillieferungen.sort((a, b) => a.lieferantId.localeCompare(b.lieferantId));
bestellbar: teillieferungen.every((t) => t.mindestbestellwert.erfuellt),
```

Ein Warenkorb ist heute **eine** Lieferung, gleich wie viele Marken darin
liegen.

---

## Eine fünfte Stelle wusste es

Auf der Abnahmeseite steht seit dem 30. August ein Hinweiskasten:

> *„Der Hinweis auf mehrere Sendungen an verschiedenen Tagen stammt aus dem
> ursprünglichen Zuschnitt mit mehreren Herstellern. Das jetzige Sortiment
> läuft über **einen** Lieferanten, also kommt eine Bestellung in einer
> Sendung."*

> **Der Bestand wusste es an einer Stelle und sagte an vier anderen das
> Gegenteil.**

---

## Was das kostet

Die Richtung ist die vorsichtige, und **gerade deshalb fällt sie nicht auf**.
Wer Baumit-Kleber, ein Schiedel-Formteil und eine Dose Soudal in den Korb legt,
liest dort drei Hersteller und rechnet mit **dreimal 250 €** — 750 € statt 250 €.
Ein Bauleiter, dem 300 € fehlen, legt den Korb weg.

> **Abgeschreckte Körbe stehen in keiner Abrechnung.**

Und wer trotzdem bis zur Kasse geht, sieht dort **eine** Teillieferung und
einen einzigen fehlenden Betrag. Text und Verhalten widersprechen einander an
der Stelle, an der es ums Geld geht — dieselbe Familie wie „Kranentladung für
285 Gramm", nur diesmal zu Lasten des Umsatzes statt des Kunden.

---

## Nicht gestrichen, sondern abgeleitet

Die Regel „je Lieferung" ist richtig und im Rechenkern richtig umgesetzt; sie
greift, sobald ein zweiter Lieferant dazukommt. Gestrichen käme sie selten
zurück — dieselbe Überlegung, die im Kasten auf der Abnahmeseite steht.

`src/lieferungen.js` leitet den Satz deshalb aus dem Katalog ab:

| Lieferanten | Satz |
|---|---|
| einer | „Alle geführten Artikel kommen von einem Lieferanten; ein Warenkorb ist deshalb eine Lieferung, und die Grenze gilt einmal. Kommt ein zweiter Lieferant dazu, entstehen mehrere Lieferungen, und sie gilt für jede einzelne." |
| mehrere | „Artikel verschiedener Lieferanten kommen in getrennten Lieferungen, und die Grenze gilt für jede einzelne — Anfahrt und Verpackung fallen je Lieferung an." |

Alle vier Stellen holen ihn von dort. Der Satz dreht sich von selbst um, wenn
der zweite Lieferant dazukommt — und nennt bis dahin die Regel, statt sie zu
verschweigen.

---

## Geprüft

`test/lieferungen.test.js`, neun Fälle. Die Regel sucht die **Behauptung**, nicht
das Wort: ein Satz, der von mehreren Herstellern oder Lieferanten auf mehrere
Lieferungen schließt. Ein eigener Fall hält fest, dass sie den Hinweiskasten der
Abnahmeseite **nicht** trifft — schlüge sie dort an, träfe sie ausgerechnet die
Stelle, die es von Anfang an richtig hatte. Ein zweiter hält fest, dass der neue
Satz nicht sein eigener Fund ist.

Dazu zwei Fälle über den Bestand: keine der 82 gebauten Seiten und keine
Textdatei verspricht mehr Lieferungen, als es Lieferanten gibt, und die
Lieferseite trägt genau den **abgeleiteten** Satz — steht dort ein anderer, ist
er von Hand geschrieben und läuft ab.

Gegenprobe `mehr-lieferungen-als-lieferanten`. Und wie in der Runde davor
meldete `pruefe-ungerufen` den neuen Prüfer sofort als Ausfuhr, die außerhalb
der Tests niemand ruft; der Grund steht im Register.

---

**Offen und benannt:** Ob der Lieferant eine Bestellung tatsächlich in **einer**
Sendung fährt, ist seine Sache und steht in keiner Rechnung — es ist Teil der
Gebietsfrage, die im Brief an den Lieferanten steht. Der Satz sagt deshalb, was
der Shop weiß (ein Lieferant, eine Grenze), und nicht, was auf der Baustelle
ankommt.
