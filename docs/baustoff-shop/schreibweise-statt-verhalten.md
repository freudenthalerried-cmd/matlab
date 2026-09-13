# Schreibweise statt Verhalten — eine Fehlerklasse, zweimal gefunden

**31. August 2026, spätabends.** Der Durchgang davor endete mit einem Satz
über meine eigene Probe: *Eine Probe, die die Schreibweise prüft, prüft nicht
das Verhalten.* Ein Satz über eine Fehlerklasse verlangt, dass man nachsieht,
ob es mehr davon gibt.

## Die Durchsicht

Zwölf Testdateien lesen Quelltext. Die meisten prüfen damit **Ausgaben** —
Belegtexte, `llms.txt`, das erzeugte Impressum. Das ist Verhalten und in
Ordnung.

Drei Zusicherungen prüfen den Quelltext eines Werkzeugs gegen ein Muster.
Genau diese Sorte kann grün sein, während das Geprüfte nichts mehr tut.

## Der Fund

`test/prueferurteil.test.js`, Zusicherung „Das Werkzeug fällt sein Urteil
nicht selbst":

```js
assert.match(quelle, /beurteile\(\{ code, ausgabe, fehlerstrom \}, p\)/);
```

Mit `npm run gegenprobe` nachgemessen. Die Mutation lässt den Aufruf stehen
und **wirft sein Ergebnis weg**:

```js
beurteile({ code, ausgabe, fehlerstrom }, p);
const urteil = { art: 'grün', zahl: 99, code, grund: [] };
```

Die Probe blieb **grün**.

> **Das Werkzeug hätte danach jeden Prüfer als grün mit 99 Einheiten
> gemeldet.** Also genau den zustimmenden Prüfer, gegen den `prueferurteil.js`
> überhaupt gebaut wurde — und die Zusicherung, die das verhindern sollte,
> hätte geschwiegen.

Das ist die zweite Fundstelle derselben Klasse an einem Abend, und die
schwerere: Die erste betraf einen Textvorrat, diese das Herz der
Prüfmittelkette.

## Was an ihre Stelle tritt

Die Musterprüfung ist weg. Geprüft wird jetzt, dass die **gemeldeten Zahlen
von den Prüfern stammen**: Zwei Prüfer laufen selbst, und `pruefe-pruefer`
muss genau deren Zahlen nennen.

```
pruefe-tests  meldet 1031  —  zählt selbst 1031
pruefe-stand  meldet  216  —  zählt selbst  216
```

Ein festverdrahtetes Urteil käme durch jede Prüfung der Schreibweise. Durch
diese kommt es nicht: Es müsste die Zahlen der Prüfer erraten.

### Gegenproben

| Mutation | vorher | jetzt |
|---|---|---|
| Aufruf bleibt, Ergebnis wird ignoriert | **unbemerkt** | erkannt |
| gemeldete Zahl verfälscht (`zahl: 99`) | — | erkannt |
| `beurteile` gibt festes „grün, 999" zurück | — | erkannt |

Der zweite Teil der alten Zusicherung bleibt: Das Werkzeug darf keine eigenen
Vergleiche gegen `mindestens` oder den Ausgangscode anstellen. Der prüft
etwas anderes — dass es kein **zweites** Urteil gibt — und ist dafür der
richtige Griff.

## Was bewusst so bleibt

`test/veroeffentlichung.test.js` liest ebenfalls Quelltext, und zwar für die
Zusicherung, dass `robots.txt` und `llms.txt` aus dem Bau gelesen und nicht
ein zweites Mal erzeugt werden. **Diese Probe benennt ihre Grenze selbst**,
seit dem 30. August:

> Die Grenze dieser Probe steht dabei: Sie liest den Quelltext, nicht das
> Ergebnis. Das Schreiben ließe sich schöner prüfen, ist aber durch das
> Feedtor gesperrt.

Das gilt weiterhin. Der Schreibweg bricht ab, solange bei 43 Artikeln die GTIN
fehlt; die gelesenen Dateien tauchen im Probelauf nirgends auf. Behebbar wäre
das mit einem vierten Griff in eine Umgebungsvariable — und der wäre teurer
als der Gewinn.

**Eine Probe, die ihre Grenze nennt, ist nicht dasselbe wie eine, die mehr
behauptet, als sie prüft.** Die erste ist ehrlich, die zweite gefährlich. Die
eine bleibt, die andere ist ersetzt.

## Stand

1033 Testfälle grün (vorher 1032), `pruefe-tests` 1031/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 217/217.
