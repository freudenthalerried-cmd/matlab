# Ein Lieferant schickt, wonach er gefragt wird

**8. September 2026, abends.** Die letzten beiden Runden haben zwei Lücken
gemessen, und beide standen nur im Quelltext:

- **`POS-18110 Mantelsteinkleber RMRTL Dünnbettmörtel`** — keine Marke in der
  Bezeichnung, bei einem Brandschutzbauteil.
- **Vier Marken ohne belegte Merkblattadresse** — Ravenit, SunCore, Ökotherm,
  Prima. Darunter der einzige Mauerwerksartikel des Katalogs, bei dem die
  Bemessung an der Steinfestigkeit hängt.

`npm run offenepunkte` ist die Liste, die der Auftraggeber liest. Sie kannte
beide nicht — obwohl der Kopf desselben Moduls seit dem 1. September sagt:
*„Was ein Werkzeug weiß, wird gefragt; was keines weiß, steht hier mit dem
Grund."* Beide **weiß** ein Werkzeug seit heute.

Sie werden jetzt gezogen, nicht getippt: Verschwindet die Lücke, verschwindet
der Punkt. Die Liste steht damit bei **24** Punkten, und die Gruppe „Anfrage
an Dritte" bei zwölf.

---

## Und dann meldete sich der Prüfer von selbst

Kaum standen die zwei Punkte drin, sagte `npm run pruefe-anfrage`:

```
✗ systemzugehoerigkeit: offener Punkt, den keine Frage schließt
✗ merkblattadressen: offener Punkt, den keine Frage schließt
```

Beides löst dieselbe Antwort — die Artikelliste aus dem Kundenkonto, um die
der Brief ohnehin bittet. Die Frage bekam die zwei Punkte also dazu und war
sofort wieder grün.

**Und genau das war die Falle.** Die Frage *behauptete* jetzt, sieben Punkte zu
schließen, und *nannte* drei.

> **Eine Frage, die sieben Punkte schließt, aber drei nennt, bekommt eine
> Antwort auf drei.**

Ein Lieferant schickt, wonach er gefragt wird. Steht die Artikelnummer nicht im
Brief, kommt die Zeile mit dem Hersteller vielleicht mit — und vielleicht
nicht. Der Auftraggeber hat **genau ein Gespräch**; der Unterschied kostet ihn
eine zweite Runde.

---

## Die Regel dagegen

`deckungsbefund` hält jede gemessene Lücke gegen den Brieftext: Was die Antwort
schließen würde, muss die Frage benennen — mit Artikelnummer und Markennamen,
nicht als Sammelbegriff. Die Liste dafür entsteht aus dem Bestand
(`SYSTEM_UNBEKANNT`, Hersteller ohne Adresse), damit kein Punkt hinzukommt, den
der Brief dann nicht kennt.

Der Nachsatz im Brief lautet jetzt:

> „Zu **POS-18110** (Mantelsteinkleber RMRTL Dünnbettmörtel) nennt Ihre
> Bezeichnung keinen Hersteller. Weil ein Kamin über die Systemzulassung
> abgenommen wird, tragen wir dort lieber nichts ein als das Falsche: **Zu
> welchem System gehört dieser Artikel?** Und für Ravenit, SunCore, Ökotherm,
> Prima fehlt uns eine Hersteller- oder Merkblattadresse."

Er **fragt** und behauptet nicht — die Systemzuordnung bleibt beim Lieferanten,
so wie Gate 31 es entschieden hat. Ein Testfall hält das fest: Der Satz muss
mit einem Fragezeichen enden.

---

## Was die eine Antwort inzwischen löst

| | |
|---|---|
| GTIN/EAN | Produktfeed, sonst Ablehnung statt Teilannahme |
| Marke | 20 von 43 Feedeinträgen |
| Produktbild | 43 von 43 |
| Preisstand | ältester Einkaufspreis 139 Tage |
| Sortiment | die Weisung „mindestens 100 Artikel" |
| **Systemzugehörigkeit** | `POS-18110`, Brandschutzbauteil |
| **Merkblattadressen** | vier Marken |

Sieben Punkte an einer Datei — und die vier Positionen aus den eigenen
Systemlisten, die unser Sortiment nicht hergibt, hängen seit dieser Woche
ebenfalls daran.

Es ist nach wie vor **die eine Frage, die am meisten löst**. Neu ist nur, dass
sie das auch sagt.
