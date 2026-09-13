# Ware für einen Vertrag, den es nicht gab

**13. September 2026. Runde 62.**

## Der Fund, angekündigt und jetzt prüfbar

Die Runde davor endete mit einem offenen Punkt:

> *Ein Vorgang, dem die Auftragsbestätigung fehlt und der trotzdem Ware
> bestellt oder abgerechnet hat, fällt in der Akte nicht auf — das wird erst
> jetzt prüfbar, wo eine Bestätigung überhaupt entstehen kann.*

Gemessen an einem Journal mit zwei Vorgängen, einer mit und einer ohne
Vertragspapier:

```
  Vorgang 2026-0201 — 2 Eintrag/Einträge
    Stand: zuletzt „lieferantenbestellung"
    Als Nächstes: Der Lieferant liefert auf die Baustelle
```

`vorgangsstand` nimmt den **höchsten** erreichten Schritt und sah nicht nach,
ob die davor belegt sind. Der Vorgang stand da wie einer auf Kurs.

> **Er ist es nicht: Ware ist bei einem Dritten bestellt, an die kein Kunde
> gebunden ist.** Der Vertrag entsteht mit der Auftragsbestätigung (AGB
> Punkt 2). Gate 20 verlangt für die Bestellung zusätzlich den
> Zahlungseingang — und wer soll gezahlt haben, ohne angenommen zu haben?

## Warum die Liste kurz ist und nicht abgeleitet

Aus der Schrittfolge eine Pflichtkette zu machen, wäre der naheliegende Weg
und wäre falsch. **Ein fehlendes Angebot ist kein Mangel:** Nach AGB Punkt 2
ist die Bestellung des Kunden das Angebot, und die Auftragsbestätigung nimmt
es an. Wer über die Kasse bestellt, braucht kein Papier dieses Hauses davor —
eine abgeleitete Kette meldete genau diesen normalen Weg als Lücke.

`VORAUSGESETZT` führt deshalb zwei Einträge, jeden mit seinem Grund:

| Papier | braucht | weil |
| --- | --- | --- |
| `lieferantenbestellung` | `auftragsbestaetigung` | Ware bei einem Dritten, an die kein Kunde gebunden ist |
| `rechnung` | `auftragsbestaetigung` | ein Entgelt ohne die Vereinbarung, aus der es folgt |

`npm run betriebskette` hält das Register gegen `ARTEN`: Jede genannte Art
muss es geben, sie muss ein **Blatt** haben — eine Art ohne Papier belegt
nichts und kann nichts voraussetzen —, und jeder Grund muss tragen.

## Was die Akte jetzt sagt

```
  Vorgang 2026-0201 — 2 Eintrag/Einträge, Journal 2026
    FEHLT: auftragsbestaetigung — lieferantenbestellung liegt in der Akte,
           das Papier davor nicht
    Stand: zuletzt „lieferantenbestellung"

1 Papier(e) liegen in der Akte, deren Voraussetzung fehlt —
das ist kein Rückstand im Betrieb, sondern eine Aufzeichnung, die nicht
zusammenpasst. § 131 Abs 1 Z 5 BAO verlangt den Geschäftsfall rückführbar.
```

## Die Sperre steht bei der Bestellung — und nicht bei der Rechnung

```
Abbruch: Zu Vorgang 2026-0301 liegt keine Auftragsbestätigung in der Akte.
Ohne sie ist kein Vertrag geschlossen (AGB Punkt 2), und die Ware ginge auf
Rechnung dieses Betriebs an einen Kunden, der nicht gebunden ist.

Zuerst: npm run vorgang -- … --nummer 2026-0301 --stufe bestaetigung --ablegen
```

Das ist die eigentliche Entscheidung dieser Runde, und sie ist bewusst
unsymmetrisch:

| | |
| --- | --- |
| **Bestellung** | eine Zusage nach außen, die sich noch anhalten lässt → **gesperrt** |
| **Rechnung** | dokumentiert eine Lieferung, die schon geschehen ist → **gemeldet** |

Eine Rechnung zu verweigern macht die Lieferung nicht ungeschehen; sie macht
nur die Aufzeichnung unvollständig, und § 131 BAO wäre danach schlechter
dran als davor.

**Möglich ist diese Sperre erst seit gestern nacht.** Bis dahin schnitt
`bin/vorgang.mjs` die Bankfelder ab, und eine Auftragsbestätigung konnte gar
nicht entstehen. Eine Sperre gegen etwas Unmögliches wäre von Geburt an rot
gewesen und binnen einer Woche abgeschaltet — deshalb stand sie in der Runde
davor ausdrücklich als offen da und nicht als Versäumnis.

## Die Probe, die selbst der falsche Weg war

Der Testfall *„die Lieferantenbestellung geht mit ihrer Durchschrift in die
Akte"* bestellte seit dem 12. September beim Lieferanten, **ohne** vorher
einen Vertrag zu schließen. Er fuhr damit genau den Weg, den es nicht geben
soll. Er legt jetzt zuerst die Auftragsbestätigung ab — und ein zweiter Fall
verlangt, dass es ohne sie **nicht** geht und nichts abgelegt wird.

## Ausgang

| | |
| --- | --- |
| Neu | `VORAUSGESETZT`, `luecken()` in `src/vorgangsstand.js` |
| `npm run akte` | nennt je Vorgang das fehlende Vorpapier und zählt am Ende |
| `npm run vorgang -- --stufe bestellung --ablegen` | bricht ohne Auftragsbestätigung ab |
| `npm run betriebskette` | hält das Voraussetzungsregister gegen `ARTEN` |
| Testfälle | 2.437 → **2.440** |
| Gegenproben | 235 → **237** |

---

**Die Regel dieser Runde:** *Der weiteste erreichte Schritt sagt nichts
darüber, ob die davor geschehen sind — und eine Sperre gehört dorthin, wo die
Zusage noch anzuhalten ist, nicht dorthin, wo sie nur noch aufzuschreiben
wäre.*
