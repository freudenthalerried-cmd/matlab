# Eine Zusage im Kommentar, die der Code nicht gehalten hätte

**28. August 2026, später Abend.** Die Startklar-Prüfung von vorhin schrieb
über ihre vier offenen Punkte:

> „Diese stehen nirgends in den Daten, weil es sie noch nicht gibt. Sobald sie
> da sind, gehören sie in `data/betreiber.json` — dann meldet dieses Werkzeug
> sie von selbst."

Darunter standen vier hart gesetzte `null`. Wer die Angaben eingetragen
hätte, hätte weiterhin „von hier aus nicht feststellbar" gelesen — und
vermutlich angenommen, er habe sie an der falschen Stelle eingetragen.

> **Ein Kommentar, der etwas verspricht, was der Code daneben nicht tut, ist
> schlimmer als kein Kommentar** — er verhindert, dass jemand nachsieht.

Das ist dieselbe Familie wie die Dinge, die dieses Vorhaben diese Woche
mehrfach gefunden hat: die Zusage „keine Kappung" ohne Probe, die
Bildbeschreibung „Stärke maßstäblich" ohne gelesenes Maß, der Prüfer, dessen
Voreinstellung auf die Probedatei zeigte. Jedes Mal stimmte der Satz **über**
dem Code nicht mit dem Code überein, und jedes Mal war der Satz die
freundlichere Fassung.

## Behoben

Die vier Angaben stehen jetzt **in** `data/betreiber.json`:

```json
"_betriebshinweis": "… null heisst NICHT 'nein', sondern 'niemand hat
                     geantwortet' …",
"zahlungsanbieter": null,
"rechtstexteFundstelle": null,
"domainZeigtAufShop": null,
"repositoryPrivat": null
```

und das Werkzeug liest sie von dort. Probelauf mit eingetragenen Antworten:

```
✓ Zahlungsanbieter gewählt und angebunden
    angebunden: EPS über einen Anbieter (Probe)
✗ Die Seite ist unter einer Adresse erreichbar
    ausdrücklich verneint
✓ Repository ist privat
    bestätigt

4 erfüllt, 3 offen, 0 von hier aus nicht feststellbar.
```

## `??` und nicht `||` — der Unterschied ist eine Antwort

`betreiber.repositoryPrivat || null` hätte ein ausdrückliches **`false`** in
„unbeantwortet" verwandelt. Damit wäre der Unterschied verschwunden, auf dem
diese ganze Prüfung beruht:

| Eintrag | Bedeutung |
|---|---|
| `null` | niemand hat geantwortet → **ungeprüft** |
| `false` | jemand hat mit Nein geantwortet → **offen, aber beantwortet** |
| `true` | bestätigt → **erfüllt** |

Beides gegengeprobt: Setzt man die Werte wieder hart auf `null` **oder**
tauscht `??` gegen `||`, fällt dieselbe Probe.

## Stand

773 Tests grün, `pruefe-tests` 772 / 0 Verdacht. Das Werkzeug nimmt jetzt
`STARTKLAR_BETREIBER` aus der Umgebung, damit eine Probe es mit anderen
Antworten wirklich ausführen kann — dieselbe Bauart wie beim Katalogerzeuger
und beim Preislistenimport.

**Für den Auftraggeber ändert sich damit etwas Praktisches:** Sobald er
Zahlungsanbieter, Rechtstexte, Domain oder Repository klärt, trägt er es in
`data/betreiber.json` ein — und `npm run startklar` sagt beim nächsten Lauf,
wie weit der Shop ist. Ohne dass jemand ein Werkzeug anfasst.
