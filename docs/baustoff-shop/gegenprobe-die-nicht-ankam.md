# Die Gegenprobe, die nicht ankam

**31. August 2026.** Dreimal an einem Tag ist mir dasselbe passiert, und beim
dritten Mal war klar, dass es kein Zufall ist.

## Was passiert ist

Nach jeder Änderung schalte ich die geänderte Stelle wieder ab und sehe nach,
ob ein Test es bemerkt. Ohne diese Gegenprobe weiß ich nur, dass die Tests
grün sind — nicht, dass sie etwas prüfen.

Dreimal kam die Mutation nicht an:

| | woran es lag |
|---|---|
| `abgleich.js`, zwei Bedingungen | Meine Schleife trennte die Felder an `\|`, und `\|\|` zerfiel dabei |
| `entkommentieren.js`, Regex-Wache | `\n` wurde als echter Zeilenumbruch geschrieben statt als die zwei Zeichen im Quelltext |
| `inhaltspruefung.js`, Satzgrenze | dasselbe noch einmal, drei Maskierungsschichten übereinander |

Jedes Mal blieb die Datei **unverändert**, der Testlauf lief über den
ursprünglichen Code — und meldete Grün.

> **Eine Gegenprobe, die nicht ankommt, sieht aus wie eine bestandene.** Sie
> ist die tückischste Fehlmeldung, die dieses Vorhaben kennt: schlimmer als
> ein roter Test, weil sie Vertrauen erzeugt, wo nichts geprüft wurde.
> Dieselbe Familie wie der Prüfer, der auf eine leere Seite zeigt und Grün
> meldet — nur eine Ebene höher, beim Prüfen des Prüfens.

Beim vierten Mal habe ich es gemerkt, weil ich den Verdacht schon hatte. Die
ersten drei sind mir nur aufgefallen, weil die Zahl der roten Tests
unplausibel war.

## Die Ursache ist die Maskierung, nicht die Unachtsamkeit

Jede Schicht hat ihre eigene: die Shell, dann Python, dann der reguläre
Ausdruck in JavaScript. Drei übereinander sind nicht zu überblicken, und
Sorgfalt hilft nur begrenzt gegen etwas, das man nicht sieht.

`bin/gegenprobe.mjs` nimmt Such- und Ersatztext deshalb **aus Dateien**:

```
npm run gegenprobe -- <datei> <suchdatei> <ersatzdatei> -- <befehl…>
```

Eine Datei hat keine Maskierung. Was drinsteht, steht drin.

## Die erste Zusicherung ist nicht der Test

Bevor irgendetwas läuft, prüft das Werkzeug, **ob die Mutation ankommt**:

```
Abbruch: Der Suchtext kommt in src/inhaltspruefung.js nicht vor.
Die Mutation wäre nicht angekommen, und der Testlauf hätte den
unveränderten Code geprüft — also Grün gemeldet, ohne etwas zu prüfen.
```

Ebenso bei **mehreren** Fundstellen: Eine Gegenprobe, die mehrere Stellen
zugleich ändert, sagt nicht, welche davon der Test bemerkt hat.

**Der Ausgangscode ist umgekehrt**, und das ist der Kern:

| Lauf | Code |
|---|---|
| Test bemerkt die Mutation → Gegenprobe bestanden | **0** |
| Test läuft durch → die Stelle ist ungeprüft | **1** |
| Mutation kam nicht an, mehrdeutig, gleich | **2** |

Die Datei wird immer zurückgesetzt — auch wenn der Befehl abstürzt oder das
Werkzeug unterbrochen wird. Ein liegen gebliebener mutierter Zustand wäre die
nächste stille Fehlmeldung.

## Beim Prüfen des Prüfwerkzeugs derselbe Fehler noch einmal

Ich habe die vier Ausgangscodes gemessen und bekam viermal `1`. Das sah nach
einem Fehler im Werkzeug aus. Es war keiner: Ein `cd` in einem früheren
Befehl wirkte fort, das Werkzeug wurde gar nicht gefunden, und Node meldete
`1`, weil das Modul fehlte.

> **Ein Messwert aus einem Lauf, der nicht stattgefunden hat.** Genau die
> Sorte Zahl, gegen die dieses Werkzeug gebaut ist — diesmal beim Prüfen des
> Werkzeugs selbst. Aus dem richtigen Verzeichnis: 2, 2, 1, 0, wie vorgesehen.

## Sieben Testfälle für das Werkzeug

Es prüft jetzt sich selbst, in einem eigenen Verzeichnis, ohne den Bestand
anzufassen:

- Mutation kommt nicht an → Abbruch mit Code 2, Datei unberührt
- Suchtext mehrdeutig → Abbruch
- Such- und Ersatztext gleich → Abbruch
- Befehl läuft durch → „NICHT bestanden, die Stelle ist ungeprüft"
- Befehl schlägt fehl → „bestanden"
- Befehl stürzt ab → Datei trotzdem zurückgesetzt
- kein Befehl nach `--` → Abbruch

Der fünfte Fall ist der, der die Umkehrung des Ausgangscodes festhält: Ein
`false` als Befehl ist eine **bestandene** Gegenprobe.

## Was das für die nächsten Läufe heißt

Jede Gegenprobe in diesem Vorhaben läuft ab jetzt über dieses Werkzeug oder
nennt ausdrücklich, warum nicht. Der Aufwand ist dieselbe eine Zeile; der
Unterschied ist, dass ein misslungener Versuch **laut** ist statt grün.

## Stand

1031 Testfälle grün (vorher 1024), `pruefe-tests` 1029/0, `pruefe-preise`
46/0, elf Prüfer mit `--mit-browser` ohne Beanstandung, `pruefe-stand`
215/215.
