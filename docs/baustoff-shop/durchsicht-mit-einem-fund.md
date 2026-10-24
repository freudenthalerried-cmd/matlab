# Die Durchsicht — 46 Artikel durch jeden Erzeuger, ein Fund

**31. August 2026.** Vier Durchgänge lang hat derselbe Faden gehalten: Die
Proben rechnen auf einem Katalog ohne Lücken, der Shop läuft auf einem mit
39 von 46 fehlenden Gewichten. Drei Befunde kamen so zustande, jeder einzeln.
Statt auf einen vierten zu warten, diesmal **einmal vollständig durchgesehen**.

## Die Durchsicht

Ein Wegwerfskript schickt jeden der 46 echten Artikel durch jeden Erzeuger,
der Text an einen Menschen oder an eine Maschine ausgibt, und sucht die Ausgabe
nach den Spuren einer unbehandelten Lücke ab — `null`, `undefined`, `NaN`,
`[object Object]`, `Infinity`:

| Erzeuger | Durchläufe | Befund |
|---|---|---|
| Angebot | 46 einzeln + 1 Sammelkorb | sauber |
| Auftragsbestätigung | 46 | sauber |
| Rechnung | 46 | sauber |
| Anfragetext der Kasse | 46 | sauber |
| 81 gebaute Seiten und `llms.txt` | alle | sauber |
| Produktauszeichnung je Artikelseite | 46 | sauber |
| **`katalogFeed`** | ganzer Katalog | **43 Nullen** |

Der erste Lauf meldete 46 Treffer im Anfragetext — alle `[object Object]`, und
alle mein eigener Fehler: `baueKundenanfrage` gibt einen Datensatz zurück, kein
Textstück. Nachgebessert und erneut gelaufen, danach sauber. Es lohnt sich,
das aufzuschreiben: Eine Durchsicht, die ihr eigenes Werkzeug nicht prüft,
meldet dessen Fehler als Befund über das Geprüfte.

## Der Fund

`src/maschinenlesbar.js` schrieb in jede Angebotsauszeichnung:

```js
priceValidUntil: lage.preisGueltigBis ?? null,
```

Bis wann ein Preis gilt, hängt an der nächsten Liste des Lieferanten und ist
nicht bekannt. Ein erfundenes Datum wäre eine Zusage — soweit richtig. Aber
ein ausdrückliches `null` ist keine Auskunft über das Nichtwissen, sondern
eine **ungültige Angabe**: Prüfwerkzeuge für strukturierte Daten weisen sie
zurück, während ein fehlender Schlüssel schlicht nichts behauptet. Das Modul
selbst hält es überall sonst so — `gtin13` und `versandkostenNetto` bekommen
gar keinen Schlüssel, wenn nichts bekannt ist.

## Der eigentliche Befund liegt daneben

`bin/website.mjs` **wusste** es. Beim Zusammensetzen der Artikelseite stand:

```js
// Kein priceValidUntil: … Ein erfundenes Datum wäre eine Zusage,
// und `null` weisen die Prüfwerkzeuge zurecht ab.
priceValidUntil: undefined,
```

Die Berichtigung saß also beim **Abnehmer**, und zwar bei genau einem von
zweien. Die Artikelseiten waren sauber; der Feed-Erzeuger — der Kanal, für den
dieser Shop gebaut ist — trug 43 Nullen.

> **Eine Berichtigung beim Abnehmer berichtigt einen Abnehmer.** Der zweite
> erbt den Fehler, und niemand sieht den Widerspruch, weil beide für sich
> stimmig aussehen.

Die Auslassung steht jetzt an der Quelle, die Begründung mit ihr, und die
Rückstellung in `website.mjs` ist entfallen. Die gebauten Artikelseiten sind
danach **Zeichen für Zeichen unverändert** — die Korrektur ist umgezogen, sie
hat nichts geändert.

## Gegenproben

| Mutation | erkannt |
|---|---|
| `?? null` zurück | ja — 2 rot |
| Schlüssel auch bei bekanntem Datum weggelassen | ja |
| `gtin13` als `null` statt weggelassen | ja |

Die dritte betrifft ein anderes Feld und fällt trotzdem um: Die neue Probe
verlangt, dass der Feed **an keiner Stelle** einen ausdrücklichen Nullwert
trägt. Damit ist die Haltung des Moduls geprüft und nicht nur das eine Feld,
das heute auffiel.

## Was die Durchsicht nicht gefunden hat

Ausdrücklich vermerkt, damit ein späterer Lauf es nicht noch einmal sucht:

- **Belege und Anfragetext sind auf dem echten Katalog sauber.** Lieferzeit
  und Gewicht — die Funde der Vortage — waren die beiden Lücken, die dort
  durchschlugen; beide sind behoben, und keine dritte kam nach.
- **Die 81 gebauten Seiten und `llms.txt` sind sauber.** Der einzige Treffer,
  „Zahlungsziel: null Tage" in den AGB, ist ausgeschriebenes Deutsch für
  „kein Zahlungsziel" und steht so beabsichtigt in `src/rechtstexte.js`.
- Dieselbe Aussage steht ein zweites Mal in `bin/website.mjs`. Beide stimmen
  überein, und **keine Rechnung hängt an dieser Prosa** — `zahlungszielTraegt`
  bekommt die Tage als Parameter und `zahlung.js` reicht `tageBisEingang`
  durch, also die Frage, wann das Geld da ist, nicht die Zahl aus den AGB.
  Eine Probe darauf wäre eine Probe auf zwei gleichlautende Sätze ohne Folge.
  Angesehen, nicht angefasst.

## Stand

963 Testfälle grün (vorher 960), `pruefe-tests` 961/0, `pruefe-preise` 46/0,
elf Prüfer mit `--mit-browser` ohne Beanstandung, `pruefe-stand` 201/201.
