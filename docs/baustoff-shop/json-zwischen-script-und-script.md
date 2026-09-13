# `JSON.stringify` maskiert kein Kleinerzeichen

**3. September 2026.** Die Reihe der geprüften Begründungen geht weiter. Nach
den Gegenproben und den offenen Punkten war das dritte Register dran:
`KEIN_AUSGANG` in `aussentexte.js` — neun Funktionen, die dem Namensmuster
entsprechen und trotzdem keine Ausgänge sein sollen, jede mit ihrem Grund.

Acht halten. Einer nicht:

> **`baueSuchindex`** — Baut die Suchstruktur für die Oberfläche; ihr Inhalt
> kommt aus dem eigenen Katalog und geht als JSON ins Bündel, **nicht als
> Zeilentext hinaus**.

Der Satz hört einen Schritt zu früh auf. Das Bündel geht als JSON **in eine
HTML-Seite**:

```html
<script>window.__SHOP__={"artikel":[{"bezeichnung":"…"}]};…</script>
```

`JSON.stringify` maskiert Anführungszeichen, Backslashes und Steuerzeichen.
Es maskiert **kein `<` und kein `/`**. Eine Artikelbezeichnung mit der
Zeichenfolge `</script>` beendet damit das Skriptelement, und alles dahinter
liest der Browser als HTML.

```
> JSON.stringify({b:'Platte </script><img src=x onerror=alert(1)> 50 mm'})
{"b":"Platte </script><img src=x onerror=alert(1)> 50 mm"}
```

> **Ein Fremdtext, der in eine Seite eingebettet wird, ist ein Ausgang — auch
> wenn er als Daten aussieht.**

## Vier Stellen

| | |
|---|---|
| `ausgabe/website.html` | die Einzeldateifassung, Daten inline im `<script>` |
| `demo.html` | dieselbe Bauart über `demo-template.html` |
| `ausgabe/site/shop.js` | eigene Datei — dort harmlos, aber dieselbe Funktion |
| **jede der 81 gebauten Seiten** | die `application/ld+json`-Auszeichnung mit `name: a.bezeichnung` |

Die Artikelbezeichnungen stammen aus Herstellerdateien. Das ist genau der
Fremdtext, für den es das Verzeichnis gibt — und an jedem anderen Ausgang
gehen sie durch `textZeile`.

**Ausnutzbar ist es heute nicht:** Die Namen kommen aus den Rechnungen des
eigenen Lieferanten, nicht von einem Besucher. Das macht es zu einer Frage der
Datenhygiene und nicht zu einem offenen Tor — und ändert nichts daran, dass
die Zusicherung „Fremdtext wird entschärft" an vier Stellen nicht galt.

`jsonFuerSkript` maskiert `<` und `>` als Unicode-Fluchtfolgen; im JSON-Wert
bleibt das Zeichen dasselbe, im HTML-Text steht es nicht mehr. Dazu U+2028 und
U+2029 — in JSON zulässig, in älterem JavaScript ein Zeilenumbruch, und ein
Zeilenumbruch mitten in einer Zeichenkette legt die ganze Seite lahm.

## Der zweite Befund: das Verzeichnis sah sechzehn Ausfuhren nicht

Beim Eintragen der neuen Funktion meldete die Probe, es gebe sie nicht. Der
Leser des Verzeichnisses sucht:

```js
/^export function ([a-zA-Z0-9_]+)/gm
```

`jsonFuerSkript` ist ein `export const` mit einer Pfeilfunktion. **Sechzehn
Ausfuhren dieses Bestandes sind es**, darunter `textZeile` — ausgerechnet die
Entschärfung, durch die jeder Ausgang läuft. Fünf davon entsprechen dem
Namensmuster und waren dem Verzeichnis trotzdem unsichtbar.

Dritter Fall derselben Art: `\bÖNORM` traf nie, weil `Ö` kein
ASCII-Wortzeichen ist; das Namensmuster kannte `Text` und nicht `Txt`.

> **Ein Leser prüft die Schreibweise, die sein Verfasser im Kopf hatte.**

Der Leser kennt jetzt beide Formen, und die fünf gefundenen Ausfuhren stehen
im Verzeichnis — vier mit Begründung, warum sie kein Ausgang sind, eine als
Ausgang.

## Stand

| | |
|---|---|
| Einbettungen ohne Maskierung | 4, alle behoben |
| Ausgänge im Verzeichnis | 12 |
| begründete Nicht-Ausgänge | 14 (vorher 9) |
| vom Leser erkannte Ausfuhren | `export function` **und** `export const … =>` |
| Tests | 1274 |

Nachgetragen ist auch eine Probe am Erzeugnis: In keinem `ld+json`-Block der
81 gebauten Seiten darf die Zeichenfolge `</script` stehen. Sie prüft nicht
die Absicht, sondern das, was ausgeliefert wird.
