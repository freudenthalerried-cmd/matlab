# Derselbe Griff am zweiten Werkzeug

**14. September 2026, abends.** Die Runde davor hat neun Regeln aus der
Kopfzeilenprobe sichtbar gemacht, indem sie die **Entscheidung** von der
**Messung** getrennt hat. Am Ende stand die Frage, ob dieselbe Trennung bei
der Paketprobe trägt — vier Regeln, gleicher Verdacht, gleicher naheliegender
Grund: Sie braucht ein echtes `unzip` und ein ausgepacktes Archiv.

Sie trägt.

| Regel | braucht das Archiv | ist eine Entscheidung |
|---|---|---|
| `unzip-weigert-sich` | der Lauf von `unzip -t` | über Code und Ausgabe |
| `ohne-verzeichnis` | ob `INHALT.txt` dort liegt | über ein Ja/Nein |
| `ohne-abnahmeliste` | ob `ABNAHME.txt` dort liegt | über ein Ja/Nein |
| `punkt-nicht-in-der-liste` | der Text der Liste | über Text gegen Punkte |

`fremdleserbefund()` und `beilagenbefund()` in `src/paket.js` nehmen das
Mitgebrachte entgegen. **Der Läufer packt weiter mit einem fremden Programm
aus** — das ist der Sinn dieser Probe, denn ein grüner Lauf über den eigenen
Nachbau wäre die eine Aussage, die sie nicht machen darf.

## Was dabei auffiel

Die erste Regel prüft zwei Dinge, und das zweite ist das interessantere:

```js
if (status !== 0 || !/No errors detected/.test(ausgabe)) …
```

Ein Auspacker, der mit Code 0 endet und **nichts sagt**, hat nicht geprüft,
sondern geschwiegen.

> **Ein fremder Leser, der schweigt, hat nichts bestätigt** — und ein Prüfer,
> der nur die Endziffer liest, nimmt sein Schweigen für eine Zusage.

Die Gegenprobe nimmt genau diese Hälfte weg. Sie steht dort, weil die Zeile
sonst beim nächsten Aufräumen als Doppelprüfung gelesen und gekürzt würde.

## Drei Werkzeuge, ein Griff

| Tag | Werkzeug | Regeln | was der Läufer behielt |
|---|---|---|---|
| Vormittag | `papierschrittbefund` u. a. | 16 | — (Register hereingereicht) |
| Abend | Kopfzeilenprobe | 9 | zwei Apaches starten, zwei Seiten holen |
| Abend | Paketprobe | 4 | mit `unzip` auspacken, Dateien lesen |

> **Was ein Prüfer misst und was er daraus schließt, sind zwei Dinge.**

Der Satz hat an einem Abend 13 Regeln sichtbar gemacht, die vorher als „geht
nicht" galten. Er hat aber auch eine Grenze: Er gilt für Werkzeuge, die etwas
**mitbringen**. Für einen Prüfer, dessen Messung selbst die Entscheidung ist —
der Frischeprüfer etwa, der Zeitstempel vergleicht —, teilt er nichts.

## Stand

| | |
|---|---|
| Regelstellen nie gesehen | 47 → **43** von 486 |
| an einem Tag | 80 → 67 → 56 → 47 → 43 |
| Prüfer grün | 55 |
| Testfälle | 2 618 |
| Gegenproben | **305** |

Der Haken für `47` im Zahlenregister ist heraus: Mit 43 liegt die Zahl nicht
mehr im engen Band, und der Prüfer hat es selbst gemeldet — dieselbe zweite
Richtung wie schon dreimal heute.

## Was diese Runde nicht erreicht hat

43 Stellen bleiben, und sie verteilen sich jetzt dünn: kein Block über drei.
Die größten sind `src/aussentexte.js`, `src/anfragelesen.js` und
`bin/systemtreuepruefung.mjs` mit je drei. Ab hier kostet jede weitere Stelle
einen eigenen Testfall, und keiner davon fällt mehr mit einem Griff.

**Das ist der Punkt, an dem diese Zählung ihren Ertrag abgegeben hat.** Sie
hat an einem Tag 37 Regeln sichtbar gemacht und drei Male dieselbe Bauart
aufgedeckt. Was bleibt, ist gewöhnliche Arbeit — und die Sperrklinke sorgt
dafür, dass sie nicht rückwärts geht.
