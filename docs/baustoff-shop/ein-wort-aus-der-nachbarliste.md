# Ein Wort aus der Nachbarliste

**6. September 2026, kurz nach Mitternacht.** Der offene Punkt stammt aus der
Runde von gestern Abend und hat dort einen Namen bekommen:

> *„Die Sammeldeckung im Kopf (`kopfwiderruf`) deckt nach Wortvorkommen, nicht
> nach Gegenstand."*

Gefunden wurde er nicht durch Suchen, sondern durch einen Nebeneffekt: Ein
Hinweiskasten, den ich in den Kopf von `STATUS.md` gesetzt habe, schob eine
Zeile über die Fünfzehn-Zeilen-Grenze, und ein Testfall wurde rot.

---

## Was die Deckung ist und was sie war

`findeWiderrufe` deckt eine zurückgenommene Aussage auf zwei Wegen: durch einen
Widerruf **in Sichtweite** (±8 Zeilen) — oder durch einen **Kopfvermerk**, der
für das ganze Dokument gilt. Der Kopfvermerk ist richtig und nötig:
`rechnung-zum-zuschlag.md` trägt unter der Überschrift einen Kasten „Überholt
seit 25.08. …", und wer den liest, liest alles Folgende mit dem richtigen
Vorzeichen.

Geprüft wurde bis heute so:

```js
WIDERRUFSMERKMAL.test(zeile) || (merkmal ? merkmal.test(zeile) : false)
```

Das zweite Stück ist der Fehler. `WIDERRUFSMERKMAL` ist die absichtlich enge
Liste — *widerrufen, zurückgenommen, berichtigt, überholt, Irrtum*: lauter
Wörter, die **eine frühere Aussage zurücknehmen**. `eintrag.merkmal` ist etwas
ganz anderes: die **Umgebungsliste** eines einzelnen Registereintrags, mit der
er in Sichtweite erkennt, ob seine Berichtigung danebensteht. Für den Eintrag
zur Shopadresse lautet sie:

```js
merkmal: /bauversand|31\.08\.|31\. August|abgelöst|überholt|nicht mehr/i
```

Und in Zeile 9 von `STATUS.md` stand ein Satz über die **Modellfrage**:

> *„…eine Woche nach dem Kurswechsel vom 22. August, der beide Modelle
> **abgelöst** hat."*

> **Ein Wort aus der Umgebungsliste eines Eintrags hat eine Falschangabe 760
> Zeilen tiefer stillgestellt — sechs Tage lang.**

Die Falschangabe war keine Kleinigkeit: Der Verzeichniseintrag empfahl
`shop.freudenthaler-bau.at` als Shopadresse, die der Auftraggeber am 31. August
durch `bauversand.com` ersetzt hat.

---

## Vor der Änderung gemessen

Über alle fünf Bestände, **497 Dateien**:

```
durch Kopfvermerk gedeckt                 22
davon mit allgemeinem Widerrufsmerkmal    22
nur durch die Umgebungsliste eines Eintrags  0
```

**Keine einzige Fundstelle hing an der Umgebungsliste.** Die Änderung nimmt
also nichts weg, was heute trägt — sie nimmt weg, was jederzeit zufällig hätte
tragen können, so wie es sechs Tage lang zufällig getragen hat.

*Das ist der Grund, aus dem diese Runde überhaupt stattfindet.* Ein Befund
ohne heutige Wirkung ist leicht zu vertagen; genau deshalb stand er zwei Runden
lang unter „offen". Gemessen ist er billig zu schließen, und ungemessen wäre er
irgendwann teuer gewesen.

---

## Was jetzt gilt

Der Kopfvermerk deckt nur noch, wenn er ein **allgemeines** Widerrufsmerkmal
trägt.

> **Ein Wort aus der Umgebungsliste eines Eintrags sagt nichts über das ganze
> Dokument. Eine Deckung für alles braucht eine Aussage über alles.**

Die Umgebungsliste wirkt unverändert weiter — dort, wo sie hingehört: in
Sichtweite des Fundes.

### Und eine Gegenprobe, die vorher gefehlt hat

`kopfvermerk-ohne-aussage` tauscht im Kopf von `rechnung-zum-zuschlag.md` das
eine Wort, das den Kasten zu einer Rücknahme macht („Überholt seit 25.08.")
gegen eines aus der Umgebungsliste („Abgelöst seit 25.08."). Fünf Fundstellen
dieser Datei hängen an diesem Kasten; der Prüfer meldete **rot an der
erwarteten Stelle**.

Ohne sie war die Sammeldeckung das einzige Stück dieses Prüfers, dessen Ausfall
niemand bemerkt hätte: **Sie macht grün, wo sonst rot stünde.** Ein Stück Code,
das nur Meldungen unterdrückt, gehört als erstes unter eine Gegenprobe — und
war als letztes darunter.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-widerrufe` deckt schärfer |
| Neue Gegenproben | `kopfvermerk-ohne-aussage` |
| Neue Testfälle | 2 (`test/widerruf.test.js`, 18 → 20) |
| Neue Gates | keine |
| Gefundene Fehler | keine — **und das ist das Ergebnis** |

## Was offen bleibt

- **Die Gebietsfrage an den Lieferanten** — freigabepflichtig, eine Anfrage an
  Dritte.
- **`PARAMETER.md` trägt ein Kopfdatum ohne Prüfer** — bewusst nicht gebaut.
- **Die Sichtweite von ±8 Zeilen** ist eine Zahl ohne Messung. Sie stammt vom
  31. August und hat seither getragen; ob sie zu eng oder zu weit ist, weiß
  niemand. **Nicht angefasst** — eine Zahl zu ändern, für die man kein Maß hat,
  tauscht nur eine Vermutung gegen eine andere.
