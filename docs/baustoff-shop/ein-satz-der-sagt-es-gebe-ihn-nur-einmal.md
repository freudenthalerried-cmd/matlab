# Ein Satz, der sagt, es gebe ihn nur einmal

**14. September 2026, nachts.**

## Der Anlass

Ein Satz steht in diesem Bestand seit dem 8. September und ist seither **vier
Runden lang durch Zufall wiedergefunden** worden — am 8., 11., 13. und heute
Vormittag am 14.:

> **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**

Für **Zahlen** gibt es das Zwillingsregister seit dem 11. September. Für
**Sätze** gab es keines — und Sätze sind der häufigere Fall:

> **Eine Zahl wird abgeschrieben, weil sie kurz ist; ein Absatz wird kopiert,
> weil er stimmt.**

## Die Messung

Über `src/` und `bin/`: rund **10.500 Sätze** ab acht Wörtern aus Kommentaren
und Zeichenketten, davon **40 in mehr als einer Datei**.

Und an der Spitze stand ein Absatz, der sich selbst widerlegt. Sechs
Prüfwerkzeuge trugen ihn wörtlich im Kopf:

> *„**Vorhanden ist nicht dasselbe wie aktuell.** Ergänzt am 4. September: Die
> Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, stand seit dem
> 29. August in zwei von neun Werkzeugen … Das Register dazu steht in
> `src/erzeugnisstand.js`; **der Text ist dort eine Fassung für alle**."*

Der Text war es — der *Abbruchtext*. Die **Begründung** dafür stand sechsmal.

> **Ein Satz, der sagt, es gebe ihn nur einmal, stand sechsmal.**

Die sechs tragen jetzt einen Zweizeiler, der auf `src/erzeugnisstand.js`
verweist; die Begründung steht dort, wo die Regel gilt.

## Was nicht gemeldet wird

Nicht jede Wiederholung ist ein Fehler, und die Unterscheidung ist dieselbe wie
beim Zahlenregister: Geführt wird, was eine Heimat hat.

| geführt | wie oft | warum |
|---|---|---|
| „Wie lang eine Begründung mindestens sein muss…" | 7 | sieben Register, sieben **verschiedene** Zahlen, ein Begriff |
| § 132 BAO, sieben Jahre | 3 | eine Rechtsstelle gehört dorthin, wo sie wirkt |
| § 131 Abs 1 Z 5 BAO | 2 | dieselbe Bauart |
| „Vorhanden ist nicht dasselbe wie aktuell." | 6 | ein **Verweis** an der Stelle, an der die Weigerung steht |
| „Hält das Register gegen die Wirklichkeit — in beide Richtungen." | 3 | die Bauart dieses Hauses über drei verschiedenen Registern |

Geführt wird ein Anfang **und eine Zahl**: Ein Grund für zwei Fundstellen ist
keiner für sieben.

## Der Fehler im Leser, und was er kostete

Mein erster Entwurf hat die Kommentarzeichen durch Leerzeichen ersetzt und den
Rest stehen lassen. Damit lief der letzte Satz eines Blockkommentars in die
Codezeile darunter:

```
"const hier = dirname(fileURLToPath(import.meta.url)); **Vorhanden ist nicht
 dasselbe wie aktuell.** Warum diese Weigerung hier steht …"
```

Ein Satz, der so beginnt, fällt durch den Filter, der Code aussortiert. **Der
Absatz war unsichtbar, statt gezählt zu werden** — und genau der Absatz war der
Fund dieser Runde.

> **Ein Leser, der den Code wegstreicht, liest immer noch den Code.**

Genommen wird jetzt, was gesucht ist: Blockkommentare, Zeilenkommentare und
Zeichenketten werden **herausgeschnitten**, nicht der Code weggestrichen.

Gemessen verfälschte der alte Weg die Zahl in beide Richtungen zugleich: echte
Absätze verschwanden, und aus zerschnittenen Kommentarresten entstanden neue
Scheinzwillinge — 48 statt 40. Das ist die Gegenprobe dieser Runde.

## Die Schranke

`WIEDERHOLUNGEN_HOECHSTENS = 40`, eine Sperrklinke wie bei den Beschreibungen:
Sie darf fallen und nicht steigen, und wird sie unterschritten, verlangt der
Prüfer das Nachziehen. Die 40 sind kein Ziel — sie sind der heutige Stand,
nachdem der eine große Fall behoben ist. Die übrigen sind zwei- und dreifache
Wiederholungen, jede einzeln anzusehen.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/zwillingssaetze.js` | neu: `saetzeDerQuelle()`, `WIEDERHOLUNG_GEPRUEFT` (5 Einträge), `satzbefund()`, Sperrklinke |
| `bin/satzpruefung.mjs` | neu: `npm run pruefe-saetze` |
| `src/erzeugnisstand.js` | die Begründung der Frischeweigerung, einmal |
| sechs Prüfwerkzeuge | der Absatz durch einen Zweizeiler mit Verweis ersetzt |
| `src/pruefregister.js` | der neue Prüfer im Register |
| `src/zwillingszahlen.js` | seine Mindestzahl als geprüfter Vorschlag abgehakt |

Eine Gegenprobe, rot gesehen: `der-satzleser-streicht-den-code-wieder-weg`.

## Offen

Der Vergleich ist **Zeichen für Zeichen**. Zwei Absätze, die dasselbe anders
sagen, zählen als verschieden — dieselbe Grenze wie bei den Artikelseiten
gestern. Für einen Bestand, der von einer Hand geschrieben ist, trägt das: Wer
kopiert, kopiert wörtlich. Für einen von mehreren Händen bräuchte es ein Maß
für „dasselbe anders gesagt", und das ist keine Zeichenkette mehr.

Und der Blick reicht bis `src/` und `bin/`. Die Dokumente unter
`docs/baustoff-shop/` sind absichtlich draußen: Dort **soll** ein Befund
wörtlich wiederholt werden, weil jedes Dokument einen Tag beschreibt und für
sich lesbar bleiben muss.
