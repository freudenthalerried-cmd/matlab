# Wo der Betrieb aufhört

**4. September 2026, Abend.** Der Weg vom Klick bis zum Angebot ist seit heute
gebaut und in einem Befehl belegt: `npm run bestellprobe` fährt Kasse,
Empfangsskript, Ablage, Posteingang und Angebot.

Danach hört er auf. Ein Geschäftsfall endet nicht beim Angebot, sondern beim
Zahlungseingang und der Aufbewahrung — dazwischen liegen die Bestellung beim
Lieferanten, die Lieferung und die Rechnung.

> **Der Plan sagt, wie der Shop online geht. Nichts sagte, wie ein
> Geschäftsfall zu Ende geht.**

`src/rollout.js` rechnet vierzehn Etappen bis zum ersten Kunden. Was danach
kommt, stand nirgends — weder als Anleitung noch als Lücke.

## `npm run betriebskette`

Neun Schritte, jeder mit dem Werkzeug und dem Gate, das dabei greift. Und wo
kein Werkzeug steht, steht der **Pflichtgrund**:

| | Schritt | Werkzeug |
|---|---|---|
| 1 | Der Kunde schickt die Bestellung ab | `bestellung.php` |
| 2 | Die Bestellung wird gelesen | `npm run posteingang` |
| 3 | Das Angebot entsteht und wird abgelegt | `npm run vorgang --ablegen` |
| 4 | Die Auftragsbestätigung schließt den Vertrag | `npm run vorgang --stufe bestaetigung` |
| 5 | **Der Kunde zahlt** | — |
| 6 | **Die Ware wird beim Lieferanten bestellt** | — |
| 7 | **Der Lieferant liefert** | — |
| 8 | **Die Rechnung wird ausgestellt** | — |
| 9 | Beleg und Journal bleiben sieben Jahre | `ablage/`, `npm run pruefe-ablage` |

## Die Zahl, die zählt, ist nicht fünf

Fünf Schritte haben ein Werkzeug. **Zusammenhängend gebaut ist die Kette bis
Schritt 4.**

> **Eine Zählung ohne diese Unterscheidung meldete „fünf von neun" und
> verspräche mehr, als zusammenhängt.** Die Aufbewahrung ist gebaut und liegt
> trotzdem jenseits der Lücke — sie nützt erst, wenn etwas bei ihr ankommt.

Deshalb rechnet `kettenbefund()` beides getrennt und meldet den Punkt, an dem
es aufhört, nicht die Summe der Häkchen.

## Die vier Lücken, und warum keine davon Nachlässigkeit ist

**Der Zahlungseingang** entsteht beim Zahlungsanbieter, und der ist nicht
gewählt — eine Ausgabe und damit Sache des Auftraggebers. Ein Werkzeug, das
ihn heute nachbildete, bildete einen Anbieter nach, den niemand kennt.

**Die Lieferantenbestellung** ist gebaut: `erzeugeBestellungen` schreibt den
Text seit dem 30. August, `npm run vorgang` zeigt ihn. Was fehlt, ist das
**Absenden** — es geht per Mail an einen Dritten, und das ist nach
`PARAMETER.md` ausdrücklich dem Auftraggeber vorbehalten. Ein Werkzeug, das
versendet, wäre gegen die Weisung gebaut.

**Die Lieferung** ist ein Vorgang in der Welt, kein Vorgang im Rechner. Was
davon zählt, ist das Lieferdatum, und das trägt der Betreiber ein.

**Die Rechnung** ist der interessanteste Fall: `erzeugeRechnung` und
`stelleRechnungAus` sind gebaut und geprüft, und die Nummer fällt bewusst erst
bei der Ausstellung, damit kein abgebrochener Kauf eine verbrennt. Was fehlt,
ist der Befehl, der beides zusammenführt — und ihm fehlen zwei Angaben, die
kein Kommandozeilenwert sind: **Lieferdatum und Zahlungseingang.** Beide
kommen aus den Schritten davor, und beide Schritte sind Lücken.

> **Die Lücken hängen zusammen.** Die Rechnung wartet nicht auf Code, sondern
> auf den Zahlungsanbieter — also auf dieselbe Entscheidung wie Schritt 5.

## Was diese Liste nicht ist

Keine Anleitung und keine Wunschliste. Eine **Landkarte mit weißen Flecken**:
Sie sagt, wo der Rechner aufhört und der Betrieb von Hand weitergeht, und
verlangt für jeden weißen Fleck einen Grund. Ein Schritt ohne Werkzeug und
ohne Grund ist der Fund, für den es sie gibt — die Gegenprobe
`schritt-ohne-werkzeug-ohne-grund` benennt einen Grund um und verlangt, dass
es auffällt.

Und sie beginnt, wo `rollout.js` endet. Zwei Listen über dieselbe Sache wären
zwei Antworten.

## Was das für den Auftraggeber ändert

Er kann jetzt lesen, was am ersten Verkaufstag von der Maschine kommt und was
von ihm: Bis zur Auftragsbestätigung läuft es durch; ab dem Zahlungseingang
liegt es an ihm — und drei der vier Lücken hängen an derselben Entscheidung,
dem Zahlungsanbieter.
