# Das Zahlungsziel, entschieden

Stand: 2026-08-26. Gate 21 steht seit gestern im Rechenkern, aber
entschieden war nichts — nur festgestellt, dass eine Frist reißen kann.
Der Auftrag lautet, Gates selbst zu entscheiden und die Begründung
aufzuschreiben. Hier steht sie.

Die Entscheidung kostet nichts und löst keine Ausgabe aus: Sie legt
fest, **welche Zahlwege der Shop anbietet**, nicht welcher Anbieter sie
abwickelt. Die Anbieterwahl bleibt freigabepflichtig.

## Zuerst eine Berichtigung

Am 26. August früh stand hier und auf der Kalkulationsseite:

> Nur der Rechnungskauf verletzt Gate 21, und genau der ist im
> Baustoffhandel üblich.

**Das wirft zwei Dinge zusammen, die sich gegensätzlich verhalten.**

| | offene Rechnung, 30 Tage | Rechnungskauf über einen Anbieter |
|---|---|---|
| Gebühr | keine | rund 3 % vom Bruttobetrag |
| Geld im eigenen Konto | nach 30 Tagen | sofort |
| Ausfallrisiko | im Haus | beim Anbieter |
| **Gate 21** | **verletzt** | **gehalten** |

Der Anbieter zahlt sofort aus; der Kunde bekommt seine dreißig Tage vom
Anbieter, nicht vom Shop. Die Skontofrist gegenüber dem Lieferanten ist
davon unberührt. Was das Gate verletzt, ist die **offene Rechnung auf
eigenes Risiko** — und die stand im Modell überhaupt nicht, weil sie mit
dem Anbieterweg in einer Zeile zusammengefasst war.

Maßgeblich ist deshalb nicht, was auf der Kundenrechnung als Zahlungsziel
steht, sondern **wann das Geld im eigenen Konto liegt**. Gate 21 misst
jetzt genau das.

## Die Rechnung, die entscheidet

Referenzbestellung: 646,00 € Ware netto, 75,50 € Fracht, Einkauf
484,50 € — der mittlere Warenkorb aus `kampagne-gerechnet.md` bei 25 %
Marge.

| Zahlweg | Gebühr | Skonto | **netto** | Gate 21 | Deckungsbeitrag |
|---|---|---|---|---|---|
| Vorkasse | 0,00 € | 14,54 € | **+14,54 €** | hält | 176,04 € |
| **EPS-Onlineüberweisung** | 8,04 € | 14,54 € | **+6,50 €** | hält | **168,00 €** |
| Karte (Stripe) | 12,37 € | 14,54 € | +2,17 € | hält | 163,67 € |
| offene Rechnung, 30 Tage | 0,00 € | **0,00 €** | **0,00 €** | **reißt** | 161,50 € |
| Karte (Mollie) | 15,83 € | 14,54 € | −1,29 € | hält | 160,21 € |
| PayPal | 21,91 € | 14,54 € | −7,37 € | hält | 154,13 € |
| Rechnungskauf (Anbieter) | 25,97 € | 14,54 € | **−11,43 €** | hält | 150,07 € |

> **Der Weg ohne Gebühr ist nicht der günstigste.** Die offene Rechnung
> kostet nichts und verliert dabei 14,54 € Skonto, um 8,04 € EPS-Gebühr
> zu sparen. Sie steht damit 6,50 € je Bestellung schlechter da als der
> Weg, der etwas kostet — **390 € im Monat**, bevor ein einziger Kunde
> nicht zahlt.

### Warum gleiche Prozentsätze nicht gleich viel sind

3 % Skonto und 3 % Anbietergebühr sehen aus wie ein Nullsummenspiel. Sie
rechnen auf verschiedene Grundlagen:

| | Grundlage | bei der Referenzbestellung |
|---|---|---|
| Skonto | Einkauf **netto**, ohne Fracht | 484,50 € |
| Gebühr | Warenwert **plus Fracht, plus 20 % USt** | 865,80 € |

Die Bemessungsgrundlage der Gebühr ist **79 % größer** — und selbst ohne
Fracht noch 60 %, weil bei 25 % Marge der Einkauf nur drei Viertel des
Warenwerts ausmacht und die Umsatzsteuer, die dem Finanzamt gehört,
trotzdem mitverzinst wird. Gleicher Satz heißt hier: klares Minus.

## Die Entscheidung

**Gate 21 gilt unverändert, gemessen am Geldeingang.** Daraus folgt:

1. **EPS und Vorkasse ab Start.** EPS ist der einzige Zahlweg, der alle
   vier Anforderungen erfüllt — kein Barumsatz, maschineller
   Eingangsvermerk, höchstens 10 % des Zielgewinns (9,0 %), Gate 21
   gehalten. Vorkasse ist billiger und hält das Gate, meldet den Eingang
   aber nicht maschinell; sie bleibt der Weg für alles, was ohnehin
   telefonisch abgestimmt wird.

2. **Kartenzahlung als Zusatz, mit offener Rechnung im Auge.** Stripe
   ist je Bestellung noch positiv (+2,17 €), reißt aber auf den Monat
   gerechnet die 10-Prozent-Grenze (13,8 % des Zielgewinns). Sie wird
   angeboten, weil sie Bestellungen ermöglicht, die sonst nicht
   stattfinden — nicht, weil sie sich rechnet.

3. **Keine offene Rechnung.** Nicht wegen Gate 21 allein, sondern wegen
   der Zahl darunter: Fällt eine Bestellung aus, sind Einkauf und Fracht
   verloren — 560,00 €. Gegen 6,50 € Vorteil je Bestellung kippt das
   schon **ab einem Ausfall auf 86 Bestellungen (1,16 %)**. Eine
   Ausfallquote unter 1,2 % ist im Baugewerbe keine Annahme, die man
   ungeprüft treffen sollte.

4. **Der Rechnungskauf über einen Anbieter bleibt offen — mit einer
   Zahl, an der er entschieden wird.** Er kostet 17,93 € je Bestellung
   mehr als EPS. Das lohnt genau dann, wenn eines von beidem zutrifft:

   > **Entweder** er bringt mindestens **acht zusätzliche Bestellungen
   > im Monat** (1.075,80 € Mehrkosten bei 60 Bestellungen gegen
   > 150,07 € Deckungsbeitrag je Zusatzbestellung) — das sind 13 %
   > mehr Bestellungen.
   >
   > **Oder** die erwartete Ausfallquote bei eigener offener Rechnung
   > läge über **3,2 %** — dann kauft die Gebühr das Risiko billiger ab,
   > als es eintritt.

   Beides ist nach Gate-17-Prinzip **jetzt** festgelegt, bevor die
   Zahlen vorliegen. Gemessen wird es an denselben ersten 300 €
   Werbung, die auch die Kaufquote messen sollen.

5. **Zahlungsziel gegenüber dem Kunden: null Tage.** Bezahlt wird bei
   der Bestellung. Das ist im B2B-Baustoffhandel ungewöhnlich und wird
   auf der Zahlungsseite auch so benannt — mit dem Grund, nicht als
   Selbstverständlichkeit.

## Was das kostet, ehrlich benannt

Diese Entscheidung ist kein reiner Gewinn. Sie verzichtet auf den
Zahlweg, den Handwerksbetriebe erwarten, und das kostet Bestellungen —
wie viele, weiß niemand. Die Gegenrechnung steht oben: Der Rechnungskauf
darf zurückkommen, sobald er acht Bestellungen im Monat mitbringt.

Was die Entscheidung **nicht** tut: den Ertragshebel aus der Hand geben,
bevor der erste Euro Umsatz da ist. 3 % Skonto sind 2,25 Prozentpunkte
Marge und senken den nötigen Monatsumsatz von 45.356 auf 38.786 €. Wer
zum Start die bequeme Zahlungsbedingung anbietet und dabei das Skonto
verliert, braucht ein Siebtel mehr Umsatz, um dasselbe zu verdienen —
und hat das Problem, das er lösen wollte, damit vergrößert.

## Was im Rechenkern dazugekommen ist

| | |
|---|---|
| `src/skonto.js` | neues Modul: Skontosatz, Frist, Gate 21, Gegenüberstellung. Eigenständig, weil `kostenbild.js` und `zahlung.js` es beide brauchen und sonst im Kreis verwiesen. `kostenbild.js` reicht die Namen weiter, bestehende Importe bleiben gültig. |
| `offene-rechnung` | achter Zahlweg — der, der bisher fehlte |
| vierte Anforderung | `skontoErreichbar`, misst Gate 21 am Geldeingang je Zahlweg |
| `zahlwegGegenSkonto` | Gebühr gegen Skonto je Bestellung, mit beiden Bemessungsgrundlagen im Ergebnis |

**594 Testfälle grün, davon 16 neue.** Acht Mutationen gegengeprüft, jede
einzeln eingespielt und wieder zurückgenommen:

| Mutation | fallende Testfälle |
|---|---|
| Skonto auch ohne gehaltene Frist | 2 |
| Gebühr auf den Nettowarenwert statt brutto | 1 |
| Gate 21 immer erfüllt | 1 |
| offene Rechnung wieder entfernt | 4 |
| unbekannte Zahlweg-Kennung in den Bedingungen | 1 |
| ein Zahlweg in zwei Töpfen | 1 |
| Zahlungsziel auf 30 Tage | 1 |
| Gate-21-Verletzer unter den angebotenen Wegen | 2 |

Ein fünfter Fund nebenbei: Der Bündelbau (`build-demo.mjs`) kannte die
Zeile `export { a, b };` nicht und ließ sie im zusammengefügten Skript
stehen — als Erstes brach damit der Bau des Funktionsmusters ab, nicht
eine Rechnung. Ein Weiterreichen von Namen war bis heute nie nötig
gewesen.

## Was offen bleibt

- **Der Zahlungsanbieter selbst** — eine Ausgabe, also freigabepflichtig.
  Diese Entscheidung sagt, *welche Wege* er können muss: EPS, Vorkasse,
  Karte. Kein Rechnungskauf zum Start.
- ~~**Punkt 9 der Geschäftsbedingungen** trägt das Zahlungsziel noch nicht.~~
  **Erledigt am selben Tag.** Punkt 9 nennt jetzt das Zahlungsziel von null
  Tagen, den Ausschluss der offenen Rechnung und die Unterscheidung zum
  Anbieterweg. Dazu steht die Entscheidung als Liste im Rechenkern
  (`ZAHLUNGSBEDINGUNGEN` in `src/rechtstexte.js`) und erscheint auf der
  AGB-Seite als Tabelle mit drei Ständen — angeboten, zurückgestellt,
  ausgeschlossen — samt Begründung je Zeile. Vier Testfälle halten sie an
  `zahlung.js`: jede Kennung muss dort existieren, keiner darf in zwei Töpfen
  stehen, jeder angebotene Weg muss Gate 21 halten, jede Einordnung braucht
  einen Grund. Die Lücke „Zahlungsanbieter nicht gewählt" steht sichtbar
  darunter — eine Bedingung ohne Abwicklung ist keine Zusage.
- **Die Kippzahlen sind zu messen, nicht zu glauben.** Acht
  Zusatzbestellungen und 3,2 % Ausfallquote sind Grenzwerte, keine
  Prognosen.
