# Ein Datum, das zweierlei sagte

**14. September 2026, achte Runde.**

## Der Anlass

Der Auftrag an jeden Lauf beginnt mit einem Satz:

> *„Lies zuerst `docs/baustoff-shop/PARAMETER.md` …"*

Diese Datei trägt oben:

```
Stand: **2026-09-03**
```

Elf Tage alt. Und in ihrem eigenen Kopf steht, warum das teuer sein kann:

> *„Diese Datei rangiert über dem Gate-Register. Was hier steht, gilt — und
> deshalb ist es teuer, wenn hier etwas Überholtes steht."*

## Nachgesehen: der Stand war richtig

Die Weisungstafel führt 13 Weisungen, die jüngste vom **3. September** — der
Auftraggeber hat seither keine gegeben. Der Kopf stimmte auf den Tag.

Nur konnte das niemand sehen.

> **Ein Datum, das elf Tage alt ist, sagt nicht, ob nichts geschehen ist oder
> ob niemand nachgesehen hat.**

Ein Lauf, der die Datei liest, steht vor zwei Lesarten und hat keinen Weg,
zwischen ihnen zu wählen. Und wer eine Zeile in die Tafel einfügt, ohne den
Kopf mitzuziehen, bleibt unbemerkt: Nichts hielt die beiden gegeneinander.

## Was daraus wurde

Das Datum hat jetzt **eine** Bedeutung, und sie steht in der Datei:

> *Es nennt den Tag der **jüngsten Weisung** in der Tafel unten, nicht den Tag
> des letzten Blicks.*

Damit heißt ein altes Datum „seither nichts" — und nichts anderes mehr.
`kopfbefund()` hält beides gegeneinander, `npm run pruefe-weisungen` gibt es
aus:

```
Kopf: „Stand 03.09.", jüngste Weisung der Tafel 03.09.
```

**Gesucht wird das größte Datum, nicht das letzte.** Eine Zeile, die jemand
oben in die Tafel einfügt, wäre sonst unsichtbar — der Prüfer verlässt sich
nicht darauf, dass die Tafel sortiert bleibt.

## Dieselbe Bauart, dieselbe Lehre

`npm run pruefe-stand` tut das seit dem 5. September für `STATUS.md`, und dort
ist es teuer geworden: Im Kopf standen „155 Arbeitsdateien" und „Stand:
2026-08-30", während derselbe Prüfer 338 zählte — **183 Dateien und sechs Tage
daneben, im Kopf des Dokuments, das von sich sagt, es sei zuerst zu lesen.**

`PARAMETER.md` sagt dasselbe von sich und hatte den Prüfer nicht.

> **Zwei Dokumente sagen „zuerst lesen". Eines wurde gehalten.**

## Was geändert wurde

| Datei | was |
|---|---|
| `src/weisungsstand.js` | neu: `kopfbefund()` mit drei Regeln |
| `bin/weisungspruefung.mjs` | gibt Kopf und jüngste Weisung aus und rechnet die Meldungen mit |
| `docs/baustoff-shop/PARAMETER.md` | sagt, was ihr Datum bedeutet |
| `test/weisungsstand.test.js` | fünf Testfälle, darunter die Datei selbst |

Eine Gegenprobe, rot gesehen: `der-kopf-der-weisungstafel-haengt-hinterher`.

## Was diese Runde **nicht** gefunden hat

Keinen Fehler. Die Tafel ist vollständig, der Kopf war richtig, keine Weisung
fehlt. Das ist das Ergebnis — und der Grund, die Messung einzubauen, statt sie
einmal gemacht zu haben. Derselbe Satz steht seit dem 6. September über
`src/suchdeckung.js`, aus demselben Anlass.

## Offen

Gehalten wird der **Kopf** gegen die **Tafel** — beides in derselben Datei. Ob
die Tafel ihrerseits vollständig ist, also ob jede Weisung des Auftraggebers
dort ankommt, hält `pruefe-weisungen` von der anderen Seite: Jedes Dokument,
das eine Weisung im Wortlaut festhält, muss seine Zeile in der Tafel haben.
Was keines von beiden findet, ist eine Weisung, die **nirgends** aufgeschrieben
wurde — dagegen hilft kein Prüfer, sondern nur der Reflex, sie zuerst in diese
Tafel zu schreiben. Genau das sagt ihr Kopf seit dem 3. September.
