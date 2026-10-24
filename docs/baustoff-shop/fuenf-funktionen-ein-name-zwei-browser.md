# Fünf Funktionen, ein Name, zwei Browser

**14. September 2026, fünfte Runde der Nacht.**

## Die offene Frage der Vorrunde

Drei Runden hintereinander hat ein Register für **Sätze** doppelten **Code**
gefunden — jedes Mal, weil wer eine Funktion kopiert, den Absatz darüber
mitkopiert. Die Frage danach lautete:

> *Was es nicht findet: doppelten Code **ohne** Kommentar darüber. Ob es den
> gibt, ist eine eigene Messung.*

Diese Runde ist die Messung. Über **574 Funktionen** in `src/` und `bin/`,
Rümpfe ab 60 Zeichen, Kommentare heraus, Leerraum zusammengezogen — verglichen
wird, was läuft.

**Genau einer.** Das ist zuerst eine gute Nachricht: Der Bestand trägt keine
stillen Dubletten.

## Der eine, und er ist ein großer

`findeChromium` stand **viermal wörtlich gleich** — in `oberflaechenprobe`,
`rahmenzensus`, `shopprobe`, `wegprobe`. Und beim Nachzählen von Hand waren es
**fünf**: `bin/bestellprobe.mjs` trägt eine eigene Fassung, die die Messung
nicht fand, weil sie **anders** ist.

| Fassung | sucht | findet hier |
|---|---|---|
| vier Proben | `PLAYWRIGHT_BROWSERS_PATH`, rekursiv nach `chrome-linux/headless_shell` | `chromium_headless_shell-1194/…/headless_shell` |
| `bestellprobe` | feste Pfade, dann `which chromium` | `/opt/pw-browsers/chromium` |

Beide laufen. Beide heißen `findeChromium`. Und sie starten **zwei
verschiedene Browser**.

> **Fünf Funktionen, ein Name, zwei Browser** — und keine Probe sagte, welchen
> sie genommen hat.

Das ist mehr als eine Dublette. Der Zweck dieser Proben ist zu sehen, was der
Browser eines Kunden tut; **welcher Browser das war, stand in keinem Ergebnis.**

> **Eine Messung, die ihr Messgerät nicht nennt, ist eine Behauptung über das
> Messgerät.**

Jede der fünf Proben gibt jetzt eine Zeile aus:
`Browser: /opt/pw-browsers/chromium_headless_shell-1194/… (Headless-Shell)`

## Und die Reihenfolge stand zuerst falsch herum

Mein erster Entwurf gab dem **vollen Chromium** den Vorzug: Es sei der nächste
Verwandte des Kundenbrowsers, ein Headless-Shell lasse Teile weg. Das klingt
richtig.

Die Oberflächenprobe meldete daraufhin **11 von 11 Szenarien
fehlgeschlagen**:

```
Failed to connect to the bus: /run/dbus/system_bus_socket: No such file or directory
```

Das volle Chromium verlangt einen D-Bus, den dieser Behälter nicht hat; der
Headless-Shell verlangt ihn nicht. **Drei der fünf Proben liefen damit
trotzdem** — shopprobe, wegprobe und rahmenzensus, alle grün, alle im falschen
Browser. Die vierte lief nicht, und sie hat es gesagt.

> **Die Probe entscheidet, welcher Browser der richtige ist, und nicht die
> Überlegung darüber, welcher der echtere wäre.**

Die Reihenfolge ist umgedreht: Headless-Shell zuerst, dann volles Chromium,
dann die Systempfade. `CHROME_PFAD` geht allem vor — was der Aufrufer nennt,
gilt. Alle fünf Proben laufen grün, im **selben** Browser, und jede sagt es.

## Was die Zusammenlegung sofort nach sich zog

`pruefe-aussentexte` wurde rot: `browserzeile` ist eine **textbauende
Funktion** und stand in keinem der beiden Verzeichnisse. Zu Recht — der Prüfer
kennt keinen Unterschied zwischen einem Satz für die Konsole und einem für den
Kunden, bis ihn jemand aufschreibt. Eingetragen als `KEIN_AUSGANG`, mit dem
Grund: eine Zeile aus einem Pfad des eigenen Dateisystems, an die eigene
Konsole.

Und das Satzregister stieg von 27 auf 31: Fünf Proben tragen jetzt denselben
Verweis und dieselbe Begründung. Vier Einträge, vier Gründe — der Preis dafür,
dass es die Suche nur noch einmal gibt.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/browsersuche.js` | neu: `findeChromium()` mit `art`, `browserzeile()`, `BROWSERWURZELN`, `SYSTEMPFADE` |
| fünf Browserproben | lesen die Suche und nennen ihren Browser |
| `src/aussentexte.js` | `browserzeile` als `KEIN_AUSGANG` eingetragen |
| `src/zwillingssaetze.js` | vier neue geführte Wiederholungen |
| `test/browsersuche.test.js` | fünf Testfälle, darunter: keine Probe führt die Suche ein zweites Mal |

Eine Gegenprobe, rot gesehen: `das-volle-chromium-geht-wieder-vor`.

## Offen

Die Messung las **benannte Funktionen auf oberster Ebene**. Was sie nicht
sieht: Pfeilfunktionen in Konstanten, Methoden in Objekten und alles unter 60
Zeichen. Ob dort Dubletten liegen, ist die nächste Frage — und ob 60 Zeichen
die richtige Grenze sind, ist eine gesetzte und keine gemessene Zahl.
