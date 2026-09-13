# Daumen und Tastatur — was `scrollX` nicht misst

Stand: 2026-08-27. Der Lauf davor hat den Shop am Telefon vermessen und
einen echten Fehler behoben: 82 Pixel Seitwärtsrollen auf der AGB-Seite.
Am Ende stand ein Satz über das, was diese Messung **nicht** kann:

> Was noch nicht geprüft ist: **Bedienung** am Telefon — ob sich der
> Vorschlagskasten mit dem Daumen schließen lässt, ob die Mengenfelder groß
> genug sind. Das misst kein `scrollX`.

Dieser Lauf misst es. Zwei Befunde, beide gemessen statt geschätzt.

## Erstens: Die Bedienelemente waren zu klein

Gemessen im 390-Pixel-Rahmen, Höhe jedes Bedienelements:

| | vorher |
|---|---|
| Navigationsknöpfe (WDVS, Dämmung, …) | **31 px** |
| Warenkorb-Knopf | **38 px** |
| Suchfeld | **42 px** |
| Auswahlfelder in Filterleiste und Kasse | **31 px** |

WCAG 2.5.8 verlangt mindestens 24 Pixel, Apple empfiehlt 44, Google 48.
Die Navigationsknöpfe lagen unter allen dreien.

> Ein Baustoffhändler bedient diese Seite mit Arbeitshandschuhen oder
> staubigen Fingern auf einem Gerüst, nicht mit der Mausspitze am
> Schreibtisch. **31 Pixel sind für diesen Daumen kein Knopf, sondern ein
> Glücksspiel.**

Alle Bedienelemente sind jetzt mindestens 44 Pixel hoch.

### Was ausdrücklich nicht vergrößert wurde

Verweise im Fließtext — Krume, Querverweise in Absätzen — bleiben, wie sie
sind. **WCAG nimmt Verweise im Satz ausdrücklich aus**, und ein Absatz mit
aufgeblasenen Zeilenabständen wäre schlechter lesbar, ohne barrierefreier
zu sein.

Die Probe prüft deshalb eine **feste Liste von Bedienelementen**
(Navigation, Knöpfe, Eingabefelder, Auswahlfelder) statt „alle Verweise".
Eine Prüfung, die alles misst, misst am Ende das Falsche.

## Zweitens: Die Vorschlagsliste war nur mit der Maus bedienbar

Das Suchfeld zeigt seit heute Vormittag Vorschläge beim Tippen. Sie waren
**nur anklickbar** — mit der Tastatur kam man nicht hinein, die
Eingabetaste sprang immer auf die Suchseite.

> Wer einen Suchvorschlag nur mit der Maus erreichen kann, für den ist die
> Liste eine Zierde.

Jetzt: **Pfeil ab und auf** wählen, **Eingabe** folgt der Auswahl (und
führt ohne Auswahl weiterhin auf die Suchseite), **Esc** schließt. Die
gewählte Zeile ist sichtbar hervorgehoben.

Dazu die ARIA-Rollen, und die sind nicht dekorativ: Ohne
`role="listbox"` und `aria-activedescendant` liest ein Vorleseprogramm die
Vorschläge **gar nicht vor** — sie erscheinen nach dem Tippen einfach im
Dokument, und nichts sagt, dass sich etwas geändert hat.

### Der Versatz um eins, den die Probe gefunden hat

Der erste Wurf hatte einen Fehler, den kein Blick auf den Bildschirm
zeigt: Aus dem Zustand „nichts gewählt" landete **Pfeil auf** auf der
**vorletzten** Zeile statt auf der letzten.

Der Grund ist Arithmetik: Die Auswahl beginnt bei −1, und `−1 − 1` modulo
acht ist sechs, nicht sieben.

Die Probe hat es gemeldet, weil sie die Zahl vergleicht und nicht den
Eindruck:

```
fehlt im gerenderten Ergebnis: „aktiv=vorschlag-7"
gerendert war: anzahl=8 aktiv=vorschlag-6
```

**Meine Erwartung im Testfall war dabei auch falsch** — ich hatte mit
sechs Vorschlägen gerechnet, es sind acht. Beide Zahlen standen im
Ergebnis, und erst dadurch war klar, welche der beiden der Fehler war.

> Ein Testfall, der nur „bestanden/durchgefallen" meldet, hätte hier
> genügend Auskunft gegeben, um das Falsche zu reparieren. **Die Zahl im
> Fehlertext ist der Unterschied zwischen einem Hinweis und einer
> Diagnose.**

## Die Gegenproben

| Probe | ohne die Regel |
|---|---|
| Bedienelemente ≥ 44 px | `zuklein=9 [A.korb 151x38, A. 70x31, …]` auf jeder Seite |
| kein Seitwärtsrollen | `scrollX=82 … h1=Geschäftsbedingungen` |
| Tastaturbedienung | drei Szenarien, die ohne die Ereignisbehandlung nichts finden |

Beide Messungen laufen im selben 390-Pixel-Rahmen und im selben Durchgang —
eine Seite wird einmal geladen und zweimal befragt.

## Stand

| | |
|---|---|
| `npm run shopprobe` | **22 Szenarien**, davon 5 im 390-px-Rahmen |
| Bedienelemente unter 44 px | **0** auf allen geprüften Seiten |
| Tastatur in der Vorschlagsliste | Pfeile, Eingabe, Esc, umlaufend |
| ARIA | `combobox`, `listbox`, `option`, `aria-activedescendant`, `aria-expanded` |
| Testfälle | 681 grün |

## Was weiterhin ungeprüft ist

| | |
|---|---|
| **echte Berührungen** | Die Probe misst Größen, nicht Treffer. Ob ein Daumen den Vorschlagskasten schließt, sagt erst ein Gerät |
| **Vorleseprogramme** | Die Rollen stimmen; ob NVDA oder VoiceOver daraus etwas Brauchbares machen, ist damit nicht bewiesen |
| **Warenkorb- und Kassenseite im Rahmen** | Sie werden mit leerem Korb geladen; die Mengenfelder und der Entfernen-Verweis entstehen erst mit Inhalt und sind dort noch ungemessen |
| **Farbkontraste** | nie gemessen |

Die dritte Zeile ist die, die als Nächstes drankommt: Der Rahmen müsste
den Korb füllen, bevor er misst — technisch dasselbe wie die bestehenden
Warenkorbszenarien, nur im schmalen Rahmen.
