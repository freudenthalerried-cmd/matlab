# Ein Satzregister fand drei Ladewege

**14. September 2026, dritte Runde der Nacht.**

## Der Anlass

Die Runde davor hat das Satzregister gebaut und gemessen: **40 Sätze** stehen
in mehr als einer Quelldatei. Fünf waren mit Grund geführt, die übrigen lagen
als Vorrat unter der Sperrklinke. Diese Runde arbeitet ihn ab.

## Eine Regel deckt sieben Fälle

Beim Durchsehen fiel eine Form auf, die siebenmal vorkam:

> *„Steht jede Gate-Entscheidung noch im Bestand — oder nur noch im Dokument?"*
> — `src/gatestand.js` **und** `bin/gatepruefung.mjs`

Ein Modul und sein Prüfer tragen dieselbe **Leitfrage** in der ersten Zeile
ihres Dateikopfs. Das ist keine Abschrift, sondern zweimal dieselbe Auskunft an
zwei Leserinnen: Wer das Modul öffnet, will wissen, was es entscheidet; wer das
Werkzeug öffnet, was es prüft.

> **Zwei Hälften einer Sache dürfen denselben Namen tragen.**

Sieben Gründe für denselben Sachverhalt aufzuschreiben wäre genau das gewesen,
was dieser Prüfer sucht. Stattdessen steht **eine Regel** da, eng gefasst und
damit entscheidbar: genau zwei Dateien, eine aus `src/` und eine aus `bin/`,
und der Satz im **Kopf** beider. Ein Absatz, der irgendwo in der Mitte zweimal
steht, ist keine Leitfrage, sondern eine Kopie.

Die Enge ist das Ganze — die Gegenprobe dieser Runde weitet den Kopf auf die
ganze Datei aus, und schon deckt dieselbe Regel jeden kopierten Absatz zwischen
einem Modul und seinem Prüfer.

## Der Fund: drei Kopien eines Ladewegs

Zwei Sätze standen in **drei** Werkzeugen wörtlich gleich:

> *„**Die Außenlage — gemessen, nicht erklärt.** Sie steht in einer eigenen
> Datei, weil sie einen Handgriff braucht …"*

Nachgesehen war es nicht nur der Absatz. `bin/offenepunkte.mjs`,
`bin/startklar.mjs` und `bin/website.mjs` trugen **denselben Ladecode**:

```js
const AUSSENLAGEPFAD = process.env.STARTKLAR_AUSSENLAGE
  || join(WURZEL, 'data', 'aussenlage.json');
const AUSSENLAGE = existsSync(AUSSENLAGEPFAD)
  ? JSON.parse(readFileSync(AUSSENLAGEPFAD, 'utf8')) : null;
```

Dreimal derselbe Pfad, dieselbe Umgebungsvariable, dieselbe Behandlung der
fehlenden Datei — und dreimal dieselbe Stelle, an der ein Umbenennen der
Umgebungsvariablen zwei Werkzeuge stillschweigend hätte danebengreifen lassen.

> **Ein Register für Sätze hat drei Kopien eines Ladewegs gefunden.**

Das ist mehr, als das Register versprochen hat. Es sucht Prosa; gefunden hat es
Programm — weil der Mensch, der Code kopiert, den Absatz darüber mitkopiert.

`liesAussenlage()` steht jetzt in `src/aussenlage.js`, mit der Begründung
daneben. Die drei Werkzeuge rufen sie.

## Und was daraus sofort folgte

Der Import hat `src/aussenlage.js` in die Reichweite der Kundentext-Werkzeuge
gebracht — und `pruefe-umschreibung` wurde in derselben Minute rot:

> *„`aussenlage.SPERRWORT` ist ein Muster, das die Kundentext-Werkzeuge
> erreichen, und steht in keiner der beiden Listen — es sagt niemand, ob es
> eine Behauptungsregel ist."*

Genau dafür ist dieser Prüfer da. Beide Muster sind eingeordnet: Sie lesen in
den **eigenen Messvermerken**, ob ein Versuch als gesperrt beschrieben ist —
eine Aussage über die Umgebung, nicht über die Ware.

> **Eine Zusammenlegung verschiebt Reichweiten, und die Reichweite ist geführt.**

## Der dritte Fall: eine Ausnahme, die bleibt, wo sie gilt

Drei Werkzeuge erklären `--probe` mit demselben Zweisatz, jedes neben seiner
eigenen Abbruchbedingung. Er erklärt eine Ausnahme, die ohne Erklärung wie ein
Fehler aussähe — ein Prüfer, der bei Funden grün bleibt. Ein Verweis auf eine
vierte Datei machte alle drei schlechter lesbar und spart nichts. Geführt mit
Grund, `hoechstens: 3`.

## Die Bilanz der Runde

| | vorher | nachher |
|---|---|---|
| wiederholte Sätze | **40** | **30** |
| davon als Leitfrage gedeckt | — | 7 |
| mit Grund geführt | 5 | 7 |
| Sperrklinke | 40 | **30** |

Die Sperrklinke ist zweimal nachgezogen worden — genau dafür ist sie da.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/zwillingssaetze.js` | `istLeitfrage()` und `KOPFZEILEN`; zwei neue geführte Wiederholungen; Sperrklinke 40 → 30 |
| `src/aussenlage.js` | `aussenlagePfad()`, `liesAussenlage()` mit der Begründung |
| `bin/offenepunkte.mjs`, `bin/startklar.mjs`, `bin/website.mjs` | lesen statt zu laden |
| `src/umschreibung.js` | die beiden neu erreichbaren Muster eingeordnet |
| `bin/satzpruefung.mjs` | zählt die Leitfragen eigens |
| `test/zwillingssaetze.test.js` | zwei Testfälle für die Regel und ihre Enge |

Eine Gegenprobe, rot gesehen: `die-leitfrage-gilt-wieder-ueberall-im-text`.

## Offen

Dreißig Wiederholungen bleiben, alle zweifach. Sie sind der Vorrat für die
nächsten Runden, und jede gehört einzeln angesehen: Eine davon ist ein
kopierter Ladeweg wie dieser, eine andere ein Satz, der zweimal richtig steht.
Was sie unterscheidet, sagt kein Muster — nur das Nachsehen.
