# Bestellt bei Bauversand, Rechnung von wem?

**3. September 2026, nachmittags.** Am Vormittag hat der Laden einen Namen
bekommen: Die Kopfleiste aller 81 Seiten trägt seither `Bauversand`, ebenso
Seitentitel, `llms.txt` und die strukturierten Daten. Die Freudenthaler Bau
GmbH blieb dort, wo sie hingehört — Impressum, Belege, `seller` und
`publisher`.

Genau diese saubere Trennung hat eine Lücke aufgerissen, die es vorher nicht
geben konnte: **Der Kunde bestellt bei einem Namen und bekommt die Post von
einem anderen.**

Der Absenderblock auf Angebot, Auftragsbestätigung und Rechnung lautete:

```
Freudenthaler Bau GmbH
Marwach 5
4312 Ried in der Riedmark
```

Ein Bauleiter, der bei „Bauversand" bestellt hat, findet diesen Namen auf
keinem seiner Schritte wieder — nicht im Warenkorb, nicht in der Kasse, nicht
im Anfragetext.

> **Wer nicht erkennt, von wem die Rechnung kommt, bezahlt sie nicht — er ruft
> an.** Und im schlechteren Fall ruft er bei seiner Bank an.

## Die Lösung ist eine Zeile, keine zweite

```
Bauversand — Freudenthaler Bau GmbH
Marwach 5
4312 Ried in der Riedmark
```

Beide Namen in **einer** Zeile, in dieser Reihenfolge: erst der, unter dem
bestellt wurde, dann der, der die Rechnung ausstellt. Zwei Zeilen hätten
ausgesehen wie zwei Firmen.

**§ 11 UStG bleibt erfüllt.** Die Vorschrift verlangt den Namen des
*Ausstellers*; er steht vollständig in derselben Zeile, und die Prüfung nach
§ 11 findet ihn dort unverändert. Die Marke davor ist eine **Zugabe, keine
Ersetzung** — genau darauf zielt einer der drei neuen Testfälle: Der
Ausstellername muss enthalten sein, und die Marke muss vor ihm stehen.

Fehlt die Marke in den Betreiberdaten, oder ist sie gleich der Firma, bleibt
die Zeile, wie sie war. Ein Beleg, der wegen einer fehlenden Zugabe anders
aussieht, wäre der falsche Preis für die Bequemlichkeit.

## Wo die Marke ausdrücklich **nicht** hingehört

Beim Durchgehen der drei übrigen Außentexte ist zweimal die richtige Antwort
„nichts ändern":

| Text | Name darauf | Warum |
|---|---|---|
| **Anfrage an den Lieferanten** | nur die Firma | Der Lieferant kennt die Freudenthaler Bau GmbH als seinen Kunden — unter dieser Nummer läuft das Konto, aus dem die Konditionen stammen. „Bauversand" wäre dort ein Name, den niemand zuordnen kann |
| **Anzeigentexte der Kampagne** | gar keiner | In einer Suchanzeige zeigt Google die Anzeigedomain, also `bauversand.com`. Eine Überschrift hat 30 Zeichen; eine davon für den Namen auszugeben, der ohnehin darunter steht, kostet eine Aussage über die Ware |
| **Impressum** | nur die Firma | Es ist die Pflichtangabe zur Betreiberin. Die Marke steht in der Kopfleiste derselben Seite |

## Was das über die Vormittagsentscheidung sagt

Der Markenwechsel war eine Zeile in `data/betreiber.json` und eine Handvoll
Stellen im Bauwerkzeug — und er hat eine Folge gehabt, die weder in der
Weisung noch im Commit vorkam. Das ist kein Vorwurf an die Entscheidung,
sondern die Regel:

> **Ein neuer Name erzeugt überall dort eine Lücke, wo der alte allein stand.**

Die Belege waren die einzige Stelle, an der beide Namen zusammentreffen
mussten. Gefunden wurde sie nicht von einem Prüfer, sondern durch das Lesen
des erzeugten Belegs — dasselbe Vorgehen, das am 1. September die Rechnung
über bereits gezahltes Geld gefunden hat. `npm run pruefe-belege -- --zeigen`
ist dafür da; es ersetzt kein Werkzeug, aber kein Werkzeug ersetzt es.

## Geprüft

Drei Testfälle in `test/beleg.test.js`, einer davon gegengeprobt (der
Absenderkopf gibt wieder nur die Firma zurück — der Fall fällt):

1. Der Kopf nennt erst die Marke, dann den Aussteller, und die Marke bekommt
   **keine eigene Zeile**.
2. Ohne Marke — oder wenn Marke und Firma gleich sind — bleibt der Absender
   unverändert.
3. Der Name des Ausstellers steht vollständig in der Zeile, und die Marke
   steht davor.
