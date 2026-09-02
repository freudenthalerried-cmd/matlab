# Das einzige Feld ohne Pflichtgrund war das falsche

**2. September 2026.** Gestern hat sich gezeigt, dass die Anfrage an den
Lieferanten nicht hinausgehen kann: Sie braucht eine Rückantwortadresse, und
`betreiber.email` und `betreiber.telefon` sind leer.
`erzeugeLieferantenanfrage` sagt das von selbst — „NICHT VERSANDFÄHIG".

Der Rolloutplan wusste davon nichts. Dort stand:

```js
{
  id: 'lieferantengespraech',
  brauchtVor: [],        // ← Tag 0
  tage: 7,
}
```

Das Gespräch begann an Tag 0, parallel zum Eintragen des Impressums. Es hätte
nicht beginnen können: Der Brief, mit dem es beginnt, war zu diesem Zeitpunkt
nicht versandfähig.

## Warum ausgerechnet dieses Feld

`ETAPPEN` verlangt für alles einen Grund. Die Dauer trägt `woher`, das Ergebnis
trägt `ergebnis`, ein fehlendes Gate trägt `warumKeinGate` — jedes Feld hat
eine Pflichtbegründung, und die Proben halten sie ein. Bis auf eines:

```js
brauchtVor: ['impressum', 'rechtstexte'],   // eine blanke Liste von Kennungen
```

Das war das einzige Feld im Plan, für das niemand etwas aufschreiben musste.
Und genau dieses Feld war falsch.

> **Wer „hängt von nichts ab" nicht begründen muss, schreibt es hin.**

`brauchtVor` ist jetzt `{etappe, warum}`, und eine **leere** Liste verlangt
`warumOhneVoraussetzung`. Die leere Liste ist die gefährlichere von beiden:

- Eine **falsche** Abhängigkeit verlängert die Kette und fällt beim Rechnen
  auf — irgendwer stutzt über die Zahl.
- Eine **fehlende** verkürzt sie und sieht aus wie ein guter Plan.

`pruefeEtappen()` verlangt beides; `npm run rollout` bricht mit Code 2 ab,
bevor es rechnet. Ein Plan, dessen Abhängigkeiten unbegründet sind, rechnet
trotzdem — er rechnet nur etwas anderes, als er behauptet.

## Was sich am Plan ändert: nichts, und das ist die Antwort

| | vorher | nachher |
|---|---|---|
| Lieferantengespräch | Tag 0–7 | **Tag 1–8** |
| Katalog auf ≥ 100 Artikel | Tag 7–9 | **Tag 8–10** |
| Etappen, die an Tag 0 beginnen können | 6 | **4** |
| Kette gesamt | 57 Tage | **57 Tage** |
| bestimmender Strang | Rechtstexte → Upload → Anzeigen → Versuch | unverändert |

Das Gespräch liegt nicht auf dem bestimmenden Strang — die zehn Tage für die
Rechtstexte sind länger als die acht bis zur Antwort des Lieferanten. Die
Berichtigung kostet keinen einzigen Tag.

Das ist kein Grund, sie klein zu nennen, und auch keiner, sie groß zu machen.
Sie ist um einen Tag danebengelegen und wäre morgen um zwei danebengelegen,
wenn jemand die Wartezeit des Rechtstexteanbieters durch eine Terminzusage
ersetzt hätte — dann bestimmt ein anderer Strang die Kette, und das Gespräch
kann darauf liegen. **Ein Plan, der heute zufällig stimmt, ist kein
geprüfter Plan.**

## Der Nachweis

Vier neue Proben. Die tragende ist nicht die auf den heutigen Zustand, sondern
die auf die Regel:

```
✗ a: hängt von nichts ab und sagt nicht, warum
✗ a → b: ohne belastbaren Grund
```

Dazu eine Zusicherung, die die Verbindung zwischen zwei Dateien festhält —
`lieferantengespraech` muss `impressum` als Voraussetzung führen, und der Plan
muss es auch rechnen. Ein Kommentar hätte das nicht gehalten.

Und die Gegenprobe `rollout-abhaengigkeit-ohne-grund`: Sie löscht die
Begründung der Etappe `impressum` aus dem Quelltext und erwartet den Abbruch.

## Stand

| | |
|---|---|
| Etappen | 11 |
| Abhängigkeiten mit Grund | 9 von 9 |
| Etappen ohne Voraussetzung, alle begründet | 4 von 4 |
| Kette | 57 Tage, Frist 90 |
| Gegenproben, die anschlagen | 17 von 17 |
| Tests | 1234 |

Offen bleibt, was gestern offen blieb: Zwei Zeilen in `betreiber.json`, dann
kann das Gespräch an Tag 1 beginnen.
