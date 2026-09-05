# Der Messer maß sich selbst zu klein

**5. September 2026, abends.** Die Runde davor hat die Frage gestellt und die
Antwort offen gelassen: *Die Reichweite der Prüfer gehört gemessen, nicht
registriert — wie, weiß ich noch nicht.*

So geht es. `werkzeug/spur.cjs` wird Node über `--require` vor jeden Prüfer
gelegt, umhüllt die Lesefunktionen von `fs` und schreibt jeden geöffneten Pfad
mit. `npm run reichweite` startet damit alle 29 Prüfer und hält die
Vereinigungsmenge gegen `git ls-files`.

> **Eine Reichweite, die man aufschreibt, ist eine Absicht. Eine, die man
> misst, ist ein Befund.**

---

## Der erste Lauf fand den Fehler an sich selbst

```
Reichweite — 29 Prüfer, 658 geführte Dateien
  Von mindestens einem Prüfer gelesen  650
  Von keinem                             8

    shop/bestellung.php
    shop/.gitignore
    styles.css
    shop/beispiel/… (5)
```

`shop/bestellung.php` — das Empfangsskript, das als **einziges im Projekt von
außen erreichbar** ist, Kundendaten annimmt, in eine Ablage schreibt und eine
Mail versendet. Von keinem der 29 Prüfer geöffnet.

Das sah nach dem Befund der Runde aus. Es stimmte nicht.

`pruefe-lesbar` **liest** die Datei nicht. Es reicht sie als Argument an
`php -l` weiter, und der Kindprozess öffnet sie. Die Hülle sah nur `fs` im
eigenen Prozess.

> **Ein Messwerkzeug, dessen Reichweite kleiner ist als die Reichweite dessen,
> was es misst.** Genau der Befund, den zu finden es gebaut wurde — im ersten
> Lauf, an sich selbst.

Gezählt wird seither auch, was einem Kindprozess als Argument mitgegeben wird,
sofern es auf eine vorhandene Datei zeigt. Das ist grob — ein Argument ist kein
Beweis, dass gelesen wurde. Für die Richtung, in der die Aussage trägt
(*ungelesen heißt sicher ungeprüft*), ist es die vorsichtige Seite.

Danach: **651 von 658**, und `pruefe-lesbar` steht mit 262 Dateien in den
fünf weitesten Reichweiten, wo es hingehört.

---

## Was übrig blieb, und was daraus wurde

| Datei | Lage |
|---|---|
| 5 × `shop/beispiel/*` | von `pruefe-geheimnis` ausdrücklich ausgeschlossen — dort stehen erfundene Zahlen |
| `styles.css` | Altbestand vom 5. August, vor Beginn dieses Vorhabens; kein Verweis zeigt darauf |
| `shop/.gitignore` | **der Fund** |

### Eine Sperre, geprüft an einer von zwei Dateien

`pruefe-ablage` prüft, ob `ablage/` von der `.gitignore` gedeckt ist — das ist
die Sperre, die das Journal mit Namen, Anschriften und Beträgen aus dem
öffentlichen Verzeichnis hält (§ 132 BAO, sieben Jahre). Sie las **eine von
zwei** `.gitignore`-Dateien.

Die zweite enthält heute eine belanglose Zeile. Aber eine `.gitignore` in einem
Unterordner kann eine Regel der Wurzel mit `!muster` **aufheben**.

Beide werden jetzt gelesen. Und beim Schreiben der Gegenprobe kam das
Schwerere heraus: **Die Mutation schlug nicht an.** `ortsbefund` prüfte

```js
if (!zeilen.includes(sperre))
```

— die **Zeile**, nicht ihre **Wirkung**. Ein `!ablage/` hebt die Sperre auf,
und `includes('ablage/')` bleibt wahr, weil die Zeile ja weiter dasteht.

> **Eine Sperre, die an ihrem Wortlaut geprüft wird und nicht an ihrer Wirkung,
> ist so gut wie die Zeile, die sie aufhebt.**

Bewusst **keine** Nachbildung der git-Semantik: Wer sie nachbaut, hat zwei
Fassungen derselben Regel. Gesucht wird die eine Form, die eine Sperre sicher
aushebelt.

---

## Was das Werkzeug nicht sagt

Dass eine Datei **gelesen** wurde, heißt nicht, dass sie **geprüft** wurde:
`pruefe-lesbar` reicht jede Quelldatei durch den Übersetzer und sagt nichts
über ihren Inhalt. Umgekehrt ist eine Datei, die **kein** Prüfer öffnet, mit
Sicherheit ungeprüft. Die Zahl ist eine untere Schranke, kein Zeugnis.

Zwei weitere Einschränkungen, damit sie nicht später als Zusage gelesen wird:

- **Der Testlauf ist kein Prüfer** und steht nicht in `PRUEFER`. Er liest
  sicher einige der `beispiel/`-Dateien. Der Messer sagt „kein **Prüfer**",
  nicht „niemand".
- **Die Browserproben stehen ebenfalls nicht im Register** — sie sind eigene
  Schritte des Gesamtlaufs.

`npm run reichweite` läuft **nicht** im Regellauf: Es startet 29 Prüfer
nacheinander und dauert so lange wie der Gesamtlauf selbst. Ein Messwerkzeug
neben `npm run aufwand` und `npm run kennzahlen`, kein Prüfer.

---

## Das Leserregister hat sich wieder selbst gemeldet

Im Gesamtlauf danach wurde `pruefe-erzeugnis` rot — zweimal, mit derselben
Regel wie am Nachmittag:

```
✗ bin/ablagepruefung.mjs fasst ausgabe/ an und steht in keinem Eintrag
✗ bin/reichweite.mjs     fasst ausgabe/ an und steht in keinem Eintrag
```

Beide nennen `ausgabe` genau **einmal**, und beide nennen es, um es
**auszulassen**: die Ablageprüfung beim Absuchen nach `.gitignore`-Dateien, der
Messer in der Ausschlussliste seiner Vergleichsmenge. Gelesen wird von dort in
keinem der beiden etwas.

Das Register sucht trotzdem nur das Wort — und das ist richtig so. Es kennt die
Absicht hinter einer Nennung nicht; deshalb verlangt es, dass sie jemand
aufschreibt. Beide stehen jetzt mit Grund darin. *Es ist bemerkenswert, dass
dieselbe Unterscheidung — Wortlaut gegen Wirkung — heute zweimal aufgetreten
ist: einmal als Fehler in `ortsbefund` und einmal als bewusste Auslegung im
Leserregister. Der Unterschied ist, welche Richtung teuer ist. Ein Register,
das zu viel meldet, kostet einen Eintrag; eine Sperre, die zu wenig meldet,
kostet die Sperre.*

---

## Was das gekostet hat

| | |
|---|---|
| Neue Werkzeuge | `npm run reichweite` (Messung, nicht im Regellauf) |
| Neue Prüfer | keine — `pruefe-ablage` prüft die Wirkung statt des Wortlauts |
| Neue Gates | keine |
| Gegenproben | **70 für 35 Prüfer** (vorher 69) |
| Gemessene Abdeckung | **651 von 658** geführten Dateien |
| Testfälle | 1649 |

**Die Messung ist von vor dem Einchecken dieser Runde.** `git ls-files` führte
`bin/reichweite.mjs`, `werkzeug/spur.cjs`, `test/reichweite.test.js` und dieses
Dokument noch nicht — der nächste Lauf zählt sie mit und kommt auf andere
Zahlen. Ein Messwert mit Datum, kein Kennwert des Bestands.

## Was offen bleibt

- **`suche.html`** ist weiterhin die letzte ungelesene Kundenfläche.
- **`styles.css`** im Wurzelverzeichnis stammt vom 5. August und gehört
  vermutlich nicht zu diesem Vorhaben. Gelöscht wird sie nicht: Was vor dem
  9. August im Verzeichnis lag, ist nicht meine Sache.
- **Der Vorbehalt zum Liefergebiet** steht in `areaServed` nicht dabei.
