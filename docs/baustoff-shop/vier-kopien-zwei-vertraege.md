# Vier Kopien, zwei Verträge

**14. September 2026, sechste Runde.**

## Die offene Frage der Vorrunde

Die Messung nach doppeltem Code las **benannte Funktionen auf oberster
Ebene**. Offen blieb: Pfeilfunktionen in Konstanten, Methoden in Objekten —
und ob die Grenze von 60 Zeichen die richtige ist.

Ausgedehnt gelesen: **670 Funktionen, 50 Pfeilfunktionen, 1279 Methoden.**

## Der erste Entwurf war Lärm

Das Muster für Methoden — `\n  name(args) {` — trifft auch `if (…) {` und
`for (…) {`. Die erste Messung meldete daraufhin **siebzehn** Fundstellen von

```js
for (const zeile of abbruchtext(stand)) console.error(zeile); process.exit(2);
```

— dem Frischeabbruch, der in siebzehn Werkzeugen gleich aussieht, weil er
dasselbe tut.

> **Ein Aufruf, der überall gleich aussieht, ist kein kopierter Code, sondern
> eine benutzte Funktion.**

Kontrollwörter stehen jetzt in `KEINE_METHODE`, und die Gegenprobe dieser Runde
nimmt sie wieder heraus: Ohne diese Zeile ertrinkt der echte Fund im Lärm, und
ein Prüfer, der Lärm macht, wird ruhiggestellt statt befolgt.

## Der Fund: vier Kopien von zwei Lesern derselben Sache

| Name | steht in | liest |
|---|---|---|
| `argZahl` | `bin/messliste.mjs`, `bin/werbeprobe.mjs` | `--name <Zahl>` |
| `wahl` | `bin/posteingang.mjs`, `bin/vorgang.mjs` | `--name <Wort>` |

Vier Kopien, **zwei Verträge** — und die beiden unterscheiden sich in genau der
Frage, die zählt: **Was tut ein Werkzeug, wenn hinter dem Schalter Unfug
steht?** `argZahl` bricht ab, `wahl` nimmt den Ersatz.

Beides ist richtig, aber nur an seiner Stelle. Eine Zahl, die keine ist, macht
jede Rechnung darunter falsch, und zwar still: `Number('x')` ist `NaN`, und
`NaN` rechnet sich durch jede Formel hindurch, ohne zu klagen. Ein Wort, das
fehlt, hat dagegen eine sinnvolle Vorgabe.

> **Vier Kopien sind vier Gelegenheiten, die Antwort auf dieselbe Frage
> unterschiedlich zu ändern.**

Beide stehen jetzt in `src/argumente.js` — als `argZahl` und `argWort`, mit
ihren Verträgen ausgeschrieben und **unterschiedlich benannt**. Die
Unterscheidung, die vorher nur im Verhalten steckte, steht jetzt im Namen.

## Was mit Grund doppelt bleibt

**`zahlAusText`** steht in `src/format.js` und in `src/kontrolle.js` — und das
ist der Zweck. Die Belegkontrolle führt **keine** Einfuhren, damit sie nicht
dasselbe liest wie das Geprüfte:

> *„Ein Leser, der die Schreibweise vom Schreiber bezieht, bestätigt jede
> Schreibweise, auch eine falsche."*

**`lies`** steht in zwei Prüfern: drei Zeilen, die eine Datei lesen und `null`
zurückgeben, wenn es sie nicht gibt. Der Unterschied zu `findeChromium`, das
gestern an fünf Stellen auseinanderlief: Dort steckte eine **Entscheidung**
drin — welche Suchreihenfolge, welcher Rückfall. Hier steckt keine. Ein Modul
für drei Zeilen ohne Entscheidung tauschte zwei klare Kopien gegen eine
Umleitung.

## Die Grenze bleibt gesetzt

| ab | Dubletten |
|---|---|
| 20 Zeichen | 17 |
| 40 Zeichen | 16 |
| 60 Zeichen | 14 |
| 100 Zeichen | 6 |

Kein Sprung, keine natürliche Stelle. Die 60 sind **gesetzt**: Unter sechzig
Zeichen ist ein gleicher Rumpf häufiger dieselbe triviale Antwort als eine
Kopie. Das steht so im Kopf des Moduls, damit ein späterer Lauf weiß, dass er
eine Wahl vor sich hat und keine Messung.

## Und der Preis, wieder sichtbar

`pruefe-saetze` stieg auf 28: Der neue Prüfer und sein Modul trugen denselben
Anlassabsatz, und mein Zweizeiler in zwei Modulen zerfiel in zwei Sätze. Beides
behoben — der Prüferkopf verweist, der Zweizeiler ist ein Satz. Wieder bei 27.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/argumente.js` | neu: `argWort()`, `argZahl()` mit ausgeschriebenen Verträgen |
| vier Werkzeuge | lesen sie |
| `src/codedubletten.js` | neu: `rumpfstellen()`, `KEINE_METHODE`, `DUBLETTE_GEPRUEFT`, Sperrklinke auf **null** |
| `bin/codedublettenpruefung.mjs` | neu: `npm run pruefe-codedubletten` |
| `src/pruefregister.js` | der neue Prüfer im Register |
| `test/codedubletten.test.js` | sieben Testfälle, beide Gegenrichtungen |

Eine Gegenprobe, rot gesehen: `kontrollstrukturen-zaehlen-wieder-als-methoden`.

## Offen

Die Suche vergleicht Rümpfe **Zeichen für Zeichen** nach dem Entfernen der
Kommentare. Zwei Funktionen, die dasselbe tun und sich in einem Variablennamen
unterscheiden, sind für sie verschieden. Das ist die dritte Stelle an diesem
Tag, an der ein Werkzeug an der Gleichheit von Zeichen endet — bei den
Artikelseiten, bei den Sätzen und jetzt beim Code. Ein Maß für „dasselbe anders
geschrieben" fehlt überall gleich, und es wäre überall dasselbe Werkzeug.
