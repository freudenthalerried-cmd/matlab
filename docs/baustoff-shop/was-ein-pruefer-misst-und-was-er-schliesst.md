# Was ein Prüfer misst und was er daraus schließt

**14. September 2026, abends.** Die Runde davor endete mit einer Frage an sich
selbst: Dreimal an einem Tag war ein Befund unerreichbar, weil er sein
Register unmittelbar aus dem Modul las. Wie oft steht diese Bauart noch da?

## Gemessen — und die Antwort war nicht die erwartete

Gezählt über alle 256 Quelldateien: **24 Befundfunktionen** lesen ein
eingefrorenes Hausregister, ohne es als Parameter zu nehmen.

Das klingt nach einem Fund. Es ist keiner. Gegen die 56 ungesehenen
Regelstellen gehalten, überschneiden sich beide Listen in **vier Dateien**.
Die übrigen zwanzig lesen ein **zweites** Register neben dem, das sie
hereingereicht bekommen — eine Ausnahmeliste, eine Wortliste —, und ihre
Regeln sind längst gesehen worden.

> **Eine Bauart ist kein Befund. Sie ist ein Verdacht, und ein Verdacht
> gehört gegen die Wirklichkeit gehalten, bevor er ein Prüfer wird.**

Ein Prüfer auf diese Bauart hätte 24 Stellen gemeldet, von denen 20 in Ordnung
sind. Das ist genau das Verhältnis, ab dem ein Prüfer ruhiggestellt statt
befolgt wird. **Er wird deshalb nicht gebaut** — die Zählung der Regelnamen
misst dasselbe an der Wirkung statt an der Form, und sie hat die drei Fälle
gefunden, um die es ging.

## Neun Regeln, die der Server angeblich verhinderte

Der größte einzelne Block der Ungesehenen stand in
`bin/kopfzeilenpruefung.mjs` — neun Stellen, mehr als aus jeder anderen Datei.
Der naheliegende Grund: Sie messen an einem laufenden Apache, also kann kein
Testfall sie sehen.

Der Grund war falsch.

> **Was ein Prüfer misst und was er daraus schließt, sind zwei Dinge — und nur
> das erste braucht den Server.**

Der Läufer startet zwei Apaches, holt zwei Seiten und bringt mit: eine
Antwortnummer, eine Kopfzeilentafel, einen Text, eine Länge. Alles Weitere ist
eine Entscheidung über das Mitgebrachte. Drei Befunde in `src/serverkopf.js`
nehmen es jetzt entgegen:

| Befund | Regeln |
|---|---|
| `kopfzeilenbefund` | `startseite-nicht-200`, `kopfzeile-fehlt`, `kopfzeile-weicht-ab`, `nicht-gesetzt-und-doch-da` |
| `fehlerseitenbefund` | `fehlerseite-falscher-code`, `fehlerseite-fremd` |
| `ohneModulbefund` | `ohne-modul-kaputt`, `ohne-modul-leer`, `ohne-modul-und-doch-kopfzeile` |

**Keine Zeile der Messung ist nachgebaut.** Der Läufer fährt weiter zwei
Apaches; er entscheidet nur nicht mehr selbst.

Acht Testfälle sehen alle neun Regeln anschlagen. Die wichtigsten zwei:

* **Eine fremde Fehlerseite mit richtigem Code** ist die des Hosters — ohne
  Marke, ohne Kopfleiste, ohne Weg ins Sortiment —, und für jede Messung, die
  nur die Nummer liest, sieht sie richtig aus. Die Gegenprobe nimmt genau
  diese Hälfte weg.
* **HSTS**, das ankommt, ohne dass es jemand entschieden hat, ist eine
  unumkehrbare Zusage: Wer es setzt und danach kein gültiges Zertifikat hat,
  sperrt seine eigenen Kunden aus, für die Dauer der `max-age`.

## Stand

| | |
|---|---|
| Regelstellen nie gesehen | 56 → **47** von 486 |
| an einem Tag | 80 → 67 → 56 → 47 |
| Prüfer grün | 55 |
| Testfälle | 2 615 |
| Gegenproben | **304** |

## Was diese Runde nicht erreicht hat

47 Stellen bleiben, und der nächstgrößte Block sind vier in
`bin/paketpruefung.mjs`. Dort gilt dieselbe Frage wie eben: Was davon braucht
wirklich das entpackte Archiv, und was ist eine Entscheidung über das, was der
Läufer mitbringt? Gemessen ist es nicht.

Und die vier Dateien, in denen sich Bauart und ungesehene Regel überschneiden
— `src/absage.js`, `src/belegpruefung.js`, `src/punktezahlen.js`,
`src/zwillingszahlen.js` —, sind mit sieben Regelstellen die kleinere Hälfte
des Rests. Sie sind gemessen, nicht behoben.
