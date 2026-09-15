# Zwei Rechnungen, ein Median — und der Prüfer segnete die falsche ab

**1. September 2026.** Nach dem Preisstand von heute Vormittag habe ich
weitergelesen, was auf der Startseite sonst noch aggregiert wird. Erster Satz:

> „…deshalb liegen 39 von 46 Artikeln unter dem Listenpreis des Lieferanten,
> im Median um **26,7 %**."

In der PR-Beschreibung, die seit heute früh eine Quelle im Verzeichnis hat und
von `npm run pruefe-schaufenster` gegen den Bestand gemessen wird, stand:

> „39 von 46 Artikeln liegen unter dem Listenpreis, im Median **26 %**
> darunter."

**Beide Zahlen sind grün geprüft.** Der Prüfer meldete „Alle 24 Kennzahlen
stimmen mit dem Verzeichnis überein", während Shop und Beschreibung sich um
0,7 Punkte widersprachen.

## Warum

Der Prüfer maß mit einer **eigenen Rechnung**:

```js
const vorteile = katalog.artikel.map((a) => vorteil(a))
  .filter((x) => x !== null && x > 0).sort((a, b) => a - b);
medianVorteil: vorteile[Math.floor(vorteile.length / 2)],
```

Der Shop rechnet anders, und zwar richtiger: `katalogbefund()` bildet den
Median des **Verhältnisses** und rundet einmal am Ende — 26,7. `vorteil()`
rundet je Artikel auf ganze Prozent **ab**, weil auf der Artikelseite lieber
„26 % unter Liste" steht als eine zu große Zahl. Der Median der abgerundeten
Werte ist 26.

Beide Rechnungen sind für sich in Ordnung. Der Fehler war, dass der Prüfer
seine eigene nahm.

> **Ein Prüfer, der mit einer eigenen Rechnung misst, prüft seine Rechnung.**

Er bestätigte damit eine Zahl, die auf keiner Seite steht, und ließ die
abweichende in der Beschreibung stehen — dem Text, den der Auftraggeber als
Erstes liest.

## Die Regel, die daraus folgt

Gemessen wird an der **Quelle, aus der die Aussage stammt.** Für den
Listenpreisabstand heißt das: `katalogbefund()`, nicht ein Nachbau. Die
Kennzahl trägt ihre Herkunft jetzt im Klartext (`wie:
'katalogbefund().medianAbstandZurListe'`), damit beim nächsten Lesen auffällt,
wenn dort ein Nachbau steht.

Durchgesehen, wo der Prüfer sonst noch selbst rechnet:

| Kennzahl | Herkunft | in Ordnung? |
|---|---|---|
| Artikel, Median, unter Liste | `katalogbefund()` | jetzt ja |
| Seiten je Art | Zählung im gebauten Verzeichnis | ja — das **ist** das Erzeugnis |
| Gates | `gate-register.md` | ja |
| Testfälle | der Lauf selbst | ja |
| Feed, GTIN, Geheimnis | Ausgabe der jeweiligen Werkzeuge | ja |
| Höchstgebote, Kampagnen | die gebauten CSV-Dateien | ja |
| **Browserszenarien** | Zählung der Namen in der Quelle | **nein, und das steht jetzt dabei** |

Die letzte Zeile ist die ehrliche Ausnahme: Beide Proben melden ihre Zahl
selbst, aber jeder Lauf kostet einen Chromium-Start je Szenario. Der Umfang
wird deshalb in der Quelle abgezählt — und `pruefe-pruefer --mit-browser` hält
ihn gegen den echten Lauf. Die Grenze steht in `wie`, damit ein grüner Lauf
nicht für mehr genommen wird, als er ist.

## Neue Wache

Die stärkste Probe ist nicht „stimmt die Zahl mit meiner Messung", sondern:
**Sagen Beschreibung und gebaute Seite dasselbe?** Beide schöpfen dann
zwangsläufig aus derselben Quelle, und ein Nachbau im Prüfer fällt sofort auf.

```
Beschreibung sagt 26, die Seite sagt 26,7
```

Genau diese Meldung erscheint jetzt, wenn jemand die Rundung zurückdreht.

## Nachtrag zu einem eigenen Dokument

`schaufenster-drift.md` von heute früh führt in der Driftliste „Median 27 %
unter Liste → 26 %". Der korrigierte Wert war schon dort falsch. Berichtigt,
mit Verweis hierher.

Die älteren Befunde in `katalog-aus-rechnungen.md` und
`lagerhaus-rabatte-gelesen.md` sagen „rund 27 %" und bleiben stehen: Sie sind
auf ihren Stand datiert und mit „rund" richtig. Eine Akte, die man
nachträglich glattzieht, ist keine Akte mehr.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Prüfer rundet den Median wieder selbst | ja |
| Beschreibung zurück auf 26 | ja |

## Stand

- 1.087 Tests, 0 rot; alle Prüfer grün
- Shop und PR-Beschreibung nennen dieselben 26,7 %
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
