# Der Plan kannte nur den teuren Zahlweg

*4. September 2026, Nacht. Runde 119.*

## Der Fund

Am selben Abend hat `startklar()` einen Punkt dazubekommen: **die
Bankverbindung**. Der Rolloutplan hat davon nichts erfahren.

Er ist das Papier, das der Auftraggeber vor der Budgetfreigabe liest, und er
führte weiterhin vierzehn Etappen — darunter **zehn Tage
Legitimationsprüfung beim Zahlungsanbieter**, freigabepflichtig, weil sie
Geld kostet. Und keinen einzigen Schritt, mit dem der Shop am ersten Tag Geld
annehmen kann, obwohl Gate 21 die Überweisung gleichrangig neben EPS stellt.

> **Zwei Listen über dieselbe Sache — was der Auftraggeber liefern muss — und
> keine wusste von der anderen.**

Die kürzere gewinnt, und zwar nicht aus Versehen: Ein Plan mit einer
Voraussetzung weniger liest sich wie ein guter Plan. Genau darin liegt der
Anreiz, ihn nicht nachzuziehen.

Der Plan sagt in seinem eigenen Nachwort:

> *Ein Verkauf beendet den Versuch früher als jede Schwelle.*

Bis heute Nacht enthielt er keinen Schritt, der einen Verkauf zu Ende bringt.

## Was der Vergleich gefunden hat

Nicht einen Punkt, sondern **zwei**:

| Punkt der Bereitschaftsliste | seit | im Plan |
|---|---|---|
| `bankverbindung` | 4. September, abends | fehlte |
| `antwortzeit` | 2. September | fehlte |

Beide sind Angaben des Auftraggebers aus dem laufenden Betrieb, beide kosten
nichts, beide halten den Shop auf. Die Antwortzeit steht seit zwei Tagen in
der Liste — sie ist also **nicht** durch die Runde von gestern Abend
entstanden, sondern war schon vorher da und ist niemandem aufgefallen. Das
ist der eigentliche Befund: Nicht der neue Punkt fehlte im Plan, sondern die
**Verbindung** zwischen beiden Listen.

## Was gebaut wurde

### Eine Etappe

`betreiberangaben` — „Antwortzeit und Bankverbindung eintragen". Ein Tag,
gesetzt, zuständig ist der Auftraggeber, hängt von nichts ab. Ihr Ergebnis:

> Die Auftragsbestätigung sagt dem Kunden, wohin er überweist, und die Kasse
> nennt eine Frist statt einer Rückmeldung ohne Zeitangabe. **Vorkasse
> braucht keinen Zahlungsanbieter** — dies ist der einzige Schritt zwischen
> heute und einem Geschäft, das zu Ende geht.

Und sie ist **Voraussetzung des Bestellwegs**, nicht nur eine Zeile daneben.
Der Grund steht im Plan:

> Mit der Auftragsbestätigung kommt nach Punkt 2 der eigenen AGB der Vertrag
> zustande. Wer den Bestellweg einschaltet, ohne sagen zu können, wohin
> gezahlt wird, schließt Verträge, die er nicht abwickeln kann.

Die Kette bleibt bei **60 Tagen**: Die Etappe liegt an Tag 0–1 und nicht auf
dem bestimmenden Strang. Ein Plan wird nicht dadurch besser, dass er kürzer
wird — er wird dadurch besser, dass er stimmt.

### Ein Register, das die beiden Listen aneinanderhält

`src/bereitschaftsplan.js` führt je Punkt der Bereitschaftsliste **die Etappe
oder den Pflichtgrund**, warum es keine gibt. Zwei Punkte haben mit Absicht
keine: `preise` und `keine-platzhalter` werden nur offen, wenn ein Artikel
dazukommt — und das geschieht ausschließlich in der Etappe
`katalog-erweitern`, wo sie in derselben Arbeit geschlossen werden. *Eine
eigene Etappe dafür plante meine eigene Sorgfalt.*

`npm run rollout` hält das Register in **beide** Richtungen gegen die
Wirklichkeit und bricht ab, wenn es nicht aufgeht:

* `punkt-ohne-eintrag` — der Fall von heute Nacht: ein Punkt, den niemand ins
  Register geschrieben hat, fährt still ungeplant mit.
* `eintrag-ohne-punkt` — die Gegenrichtung. Verschwindet ein Punkt, bliebe
  seine Zuordnung sonst stehen und deckte eine Etappe, die niemand mehr
  braucht.
* `etappe-gibt-es-nicht`, `zuordnung-und-grund`, `grund-zu-duenn`,
  `punkt-zweimal` — die Form.

**Die Kennungen kommen aus `startklar({})` mit leerer Lage.** Welche Punkte es
gibt, hängt nicht von den Daten ab; welche davon offen sind, schon. Diese
Prüfung fragt nach der Liste und nicht nach dem Stand — und braucht deshalb
keine einzige Datei, keinen Katalog und keine Betreiberdatei. Ein Prüfer, der
Daten braucht, um eine Form zu prüfen, fällt aus, sobald die Daten fehlen.

### Eine Gegenprobe

`punkt-ohne-etappe` nimmt den Eintrag für die Bankverbindung wieder aus dem
Register. `npm run rollout` muss abbrechen und den Punkt beim Namen nennen:

```
✓ rollout — Ein Punkt der Bereitschaftsliste, den der Plan nicht führt
    shop/src/bereitschaftsplan.js (ersetzen)
    meldete rot an der erwarteten Stelle
```

**49 Gegenproben für 30 Prüfer**, zwei weitere mit begründetem Verzicht.

## Zwei Zahlen, die nebenbei überholt waren

Der Plan hat jetzt **15** Etappen. Drei Stellen sagten „vierzehn":

* Die PR-Beschreibung — von `pruefe-schaufenster` gemessen und deshalb sofort
  gemeldet. Nachgezogen.
* `STATUS.md`, in einer historischen Zeile, aber im Präsens: *„`rollout.js`
  rechnet vierzehn Etappen bis zum ersten Kunden"*.
* Der Kopfkommentar von `src/betriebskette.js`, ebenfalls im Präsens.

Bei den letzten beiden ist die Zahl **ersatzlos** gestrichen statt
nachgezogen. Sie steht an der einen Stelle, wo sie gemessen wird; jede Kopie
ist eine Zahl, die beim nächsten Mal wieder falsch dasteht.

## Die Lehre

> **Ein Prüfer, der zwei Listen gegeneinander hält, findet mehr als beide
> Listen zusammen.** Beide waren für sich in Ordnung: Die Bereitschaftsliste
> kannte alle elf Punkte, der Plan alle vierzehn Etappen, und jede Zeile in
> beiden trug ihre Begründung. Falsch war nur das, was zwischen ihnen lag —
> und dazwischen sah niemand hin, weil dort nichts stand.

Das ist dieselbe Bauart wie `pruefe-ungerufen` (Ausfuhren gegen Aufrufer),
`pruefe-erzeugnis` (Werkzeuge gegen ihre Frischeprüfung) und
`pruefe-betriebskette` (Schritte gegen ihre Werkzeuge). Es ist inzwischen das
verlässlichste Muster dieses Hauses: **eine Liste, ein Pflichtgrund, ein
Prüfer in beide Richtungen.**
