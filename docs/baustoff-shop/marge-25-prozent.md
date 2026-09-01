# 25 % Marge statt 25 % Zuschlag — was die Umstellung ändert

Stand: 2026-08-25. Weisung: *„25 % marge"*. Damit ist die Zweideutigkeit
aufgelöst, die in `rechnung-zum-zuschlag.md` unter „Erstens" stand: Es
sind **25 % vom Verkaufspreis**, nicht 25 % auf den Einkauf. Dieses
Dokument rechnet die Umstellung durch und ersetzt die 20-%-Zahlen
überall dort, wo sie das Modell tragen.

> **Hinweis zur Ablage:** Dieses Repository ist öffentlich. Deshalb
> steht auch hier **kein Einkaufspreis**, nur Verkaufspreise,
> Deckungsbeiträge und Rechenwege. Die Empfehlung aus
> `erste-echte-zahlen.md` steht unverändert: vor dem Einpflegen echter
> Konditionen das Repository auf privat stellen.

## Der Umrechnungspunkt

| Lesart | Rechnung | Ergebnis |
|---|---|---|
| 25 % **Zuschlag** (bisher gerechnet) | 100 → 125 | 20 % Marge vom Verkauf |
| 25 % **Marge** (jetzt gültig) | 100 → 133,33 | **33,33 % Zuschlag** |

Der Aufschlag steigt also um ein Drittel. Das klingt nach einer
Feinheit und ist die folgenreichste Zahl des ganzen Projekts — weil
alles, was danach kommt, an der Marge hängt und nicht am Preis.

## Erstens: Der nötige Umsatz fällt um 38 %

Zielgewinn 5.374 € vor Steuer, Fixkosten 650 €, Werbeanteil 10 %,
Warenkorb 650 € netto, Zahlung per Karte:

> **Nachtrag vom 01.09.** Diese Tabelle rechnet mit **Kreditkarte** — so stand
> es am 25. August, und so ist sie richtig. Zwei Tage später hat Gate 21 **EPS
> und Vorkasse** entschieden, und niemand hat sie nachgerechnet. Mit EPS lauten
> die drei Zeilen **67.826 € / 43.396 € / 37.343 €** und 105 / 67 / 58
> Bestellungen. Die Reihenfolge und der Befund bleiben; nur die Leitzahl war
> zwei Tage älter als die Entscheidung, die sie bestimmt —
> `die-leitzahl-war-vom-falschen-zahlweg.md`.

| Rohmarge | bleibt nach Werbung und Gebühren | nötiger Monatsumsatz | Bestellungen | Sessions |
|---|---|---|---|---|
| 35 % (alte Annahme) | 23,3 % | 25.875 € | 40 | 2.000 |
| 32 % (altes Gate 1) | 20,3 % | 29.702 € | 46 | 2.300 |
| **25 % (jetzt gültig)** | **13,3 %** | **45.356 €** | **70** | **3.500** |
| 20 % (= 25 % Zuschlag) | 8,3 % | 72.740 € | 112 | 5.600 |

**112 Bestellungen im Monat werden zu 70.** Von knapp vier am Tag auf
gut zwei. Das ist der Unterschied zwischen einem Vollzeitbetrieb und
etwas, das neben dem Baugeschäft laufen kann.

## Zweitens — der eigentliche Gewinn: Luft bei der Werbung

Das war der gefährlichste Punkt der alten Rechnung. Bei 20 % Rohmarge
lag die Grenze der Tragfähigkeit bei **18 % Werbeanteil**; darüber war
das Modell rechnerisch unmöglich. Bei 25 %:

| Werbeanteil | bleibt übrig | nötiger Monatsumsatz |
|---|---|---|
| 10 % | 13,3 % | 45.356 € |
| 12 % | 11,3 % | 53.397 € |
| 15 % | 8,3 % | 72.740 € |
| 18 % | 5,3 % | 114.058 € |
| 20 % | 3,3 % | 183.572 € |
| 22 % | 1,3 % | 470.060 € |
| **23 %** | **0,3 %** | 2.139.672 € — praktisch die Grenze |
| 24 % | — | rechnerisch unmöglich |

**Die Tragfähigkeitsgrenze wandert von 18 % auf 23 % Werbeanteil.**
Fünf Prozentpunkte Puffer in genau dem Kanal, der die Wette dieses
Modells ist. Anders gesagt: Was bei 20 % Marge ein 10-%-Werbebudget
erlaubte, erlaubt bei 25 % ein 15-%-Budget beim **gleichen** nötigen
Umsatz (72.740 €). Für einen neuen Anbieter ohne Verkaufshistorie bei
Google Shopping ist das kein Komfort, sondern die Bedingung, unter der
der Kanal überhaupt in Frage kommt.

## Drittens: Kleine Bestellungen tragen früher

Mindestwarenkorb, ab dem eine **frei-Haus**-Bestellung sich trägt
(Gate 20, `mindestwarenkorbFreiHaus`):

| Fracht je Lieferung | bei 20 % Marge | bei 25 % Marge | Ersparnis |
|---|---|---|---|
| 15 € | 83,24 € | **65,39 €** | −21 % |
| 25 € | 137,83 € | **108,28 €** | −21 % |
| 40 € | 219,71 € | **172,60 €** | −21 % |
| 60 € | 328,88 € | **258,36 €** | −21 % |
| 80 € (echte Transportpauschale) | 438,05 € | **344,13 €** | −21 % |

Die Schwelle sinkt durchgehend um ein Fünftel. Das ist nicht nichts,
ändert aber die Grundaussage nicht: **Ein einzelner Sack, frei Haus
geliefert, bleibt ein Verlustgeschäft** (−15,40 € statt vorher
−18,00 €). Punkt 1 und 2 aus `rechnung-zum-zuschlag.md` — Fracht
verrechnen, Mindestbestellwert setzen — bleiben in Kraft.

## Viertens: Der Marktpreis rückt näher an den Fachhandel

Für den Profi-Flexkleber, dessen Einkauf vorliegt:

| Kalkulation | netto je 25-kg-Sack | brutto |
|---|---|---|
| 25 % Zuschlag (bisher) | 39,61 € | 47,54 € |
| **25 % Marge (jetzt)** | **42,25 €** | **50,70 €** |

Zum Vergleich der Marktbefund aus `erste-echte-zahlen.md`: HORNBACH
verlangt für einen vergleichbaren Marken-Flexkleber **54,99 €**. Der
Abstand zum Fachhandel schrumpft von 7,45 € auf **4,29 €** je Sack —
rund 8 % Preisvorteil statt 14 %.

**Das ist der Preis der besseren Marge, und er ist real.** Bei zwölf
Sack sind es 51 € Unterschied im Angebot; ein Baumeister, der drei
Angebote einholt, sieht das. Der Einkaufsvorteil trägt weiterhin, aber
er trägt weniger weit. Gegen die Baumarkt-Eigenmarke (rund 10 €) ändert
sich nichts — das war nie derselbe Wettbewerb.

## Fünftens: Was ein Klick kosten darf

Neu gerechnet mit 25 % Marge, Fracht verrechnet, Zahlung per Karte:

| Bestellgröße | Warenkorb netto | Deckungsbeitrag | max. Klick bei 1 % | bei 2 % | bei 3 % |
|---|---|---|---|---|---|
| 1 Sack | 42 € | 9,18 € | 0,09 € | 0,18 € | 0,28 € |
| 4 Sack | 169 € | 38,74 € | 0,39 € | 0,77 € | 1,16 € |
| 12 Sack | 507 € | 116,65 € | 1,17 € | **2,33 €** | 3,50 € |
| 30 Sack | 1.268 € | 294,01 € | 2,94 € | **5,88 €** | 8,82 € |

Gegen den österreichischen Marktpreis von 0,50–2,50 € je Klick:

> **Der Ein-Sack-Kunde bleibt unbezahlbar** — 18 Cent gegen 1 € Markt.
> Daran ändert die Marge nichts, sie verschiebt nur die Größenordnung.
>
> **Der Zwölf-Sack-Kunde wird von grenzwertig zu tragfähig.** Bei 20 %
> Marge lag sein Klickpreis bei 1,73 €, also am oberen Rand des
> Marktpreises; jetzt liegt er bei 2,33 € — mit Luft. Die
> Kampagnenrechnung aus `google-kampagne.md` geht damit zum ersten Mal
> ohne Kunstgriff auf.

Die **Schwelle von rund 475 € Warenkorb** bleibt, obwohl beide
Rechnungen jetzt milder ausfallen: Bei 80 € Transportpauschale liegt
der frei-Haus-Nulldurchgang bei 344 €, die Klickpreisrechnung wird bei
etwa zwölf Sack komfortabel. Die Schwelle ist eher gefallen als
gestiegen — als **Mindestbestellwert** bleiben 400 € netto die
sinnvolle Ansage, weil sie beide Rechnungen mit Abstand deckt.

## Was gleich bleibt

- **Gate 20** (keine Bestellung ohne positiven Deckungsbeitrag) ist von
  der Umstellung nicht berührt — es prüft Euro, nicht Prozent. Der
  Rechenkern brauchte keine Änderung, nur andere Eingaben.
- **Die Vertriebsidee** aus `erste-echte-zahlen.md`: Markennamen und
  Fachanforderungen statt Gattungsbegriffen. Der um 8 % höhere Preis
  macht das dringlicher, nicht weniger dringlich.
- **Die Ausschlussliste** der Kampagne. Sie war auf den
  Ein-Sack-Kunden gemünzt, und der ist weiterhin nicht bezahlbar.

## Was zu entscheiden bleibt

Die dritte Stellschraube aus `rechnung-zum-zuschlag.md` — **gestaffelter
Zuschlag** — ist durch diese Weisung nicht erledigt, sondern erst
richtig lohnend: 25 % Marge einheitlich verschenkt oben Marge
(Kleinteile, wo niemand vergleicht) und verliert unten Preisvorteil
(schwere Massenware, wo der Baumeister-Einkauf das Argument ist).

Vorschlag zur Entscheidung, sobald der Katalog steht:

| Warengruppe | Marge | Begründung |
|---|---|---|
| schwere Massenware, preisverglichen | 18–20 % | hier zählt der Preisvorteil, hier wird verglichen |
| Marken-Mörtel und -Kleber | **25 %** | der Referenzfall dieser Rechnung |
| Kleinteile, Zubehör, Werkzeug | 30–35 % | niemand vergleicht, Handhabung teuer |

Das ist ein Vorschlag, keine Entscheidung — der Auftraggeber hat 25 %
gesetzt, und bis er etwas anderes sagt, gilt 25 % durchgehend.
