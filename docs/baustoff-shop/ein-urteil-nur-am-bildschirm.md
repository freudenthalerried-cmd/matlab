# Ein Urteil, das nur auf dem Bildschirm steht

**3. September 2026.** Gestern lief eine Gegenprobe ins Leere, weil
`pruefe-seiten` mit `process.exit(0)` **ohne Bedingung** endete: 81 Seiten
gelesen, Verdacht gezählt, gedruckt — und immer grün. Gefunden hat es kein
Blick, sondern eine gescheiterte Probe.

Das war Anlass, alle Werkzeuge daraufhin durchzusehen: **Wer fällt ein Urteil
und behält es für sich?**

Sechzehn Werkzeuge außerhalb des Prüferregisters, neun davon ohne roten
Ausgang. Sieben davon zu Recht — `messliste`, `preisliste`, `artikelliste`,
`sicherung`, `kennzahlen`, `offenepunkte` und `preiswechsel` erzeugen etwas
oder zählen etwas auf. Ein Bericht darf grün enden.

**Zwei fällen ein Urteil:**

## `startklar` — die Frage, ob der Shop online gehen darf

```
NICHT STARTKLAR. Ein Punkt, den niemand bestätigt hat, zählt nicht als
erfüllt — sonst ginge der Shop online, weil das Werkzeug nicht hinsehen
konnte.
```

Dieser Satz stand auf dem Bildschirm, und das Werkzeug endete mit **Null**.
Es hatte überhaupt kein `process.exit`. Wer es in einen
Veröffentlichungsschritt hängt, bekommt von ihm jedes Mal ein Ja — von dem
Werkzeug, dessen ganzer Zweck es ist, Nein zu sagen.

> **Ein Urteil, das nur auf dem Bildschirm steht, ist keines.**

Und es ist bitter, dass ausgerechnet der Satz daneben steht, der das Gegenteil
behauptet: „sonst ginge der Shop online, weil das Werkzeug nicht hinsehen
konnte." Es hat hingesehen. Weitergesagt hat es das Ergebnis nicht.

## `rollout` — ob die Kette in die Frist passt

Derselbe Bau: „passt in die Frist" oder „über der Frist", beide Male Ausgang
Null. Eine Kette, die nicht mehr in neunzig Tage passt, ist ein Befund und
keine Fußnote.

Heute passt sie (57 von 90), deshalb bleibt der Lauf grün — aber jetzt, weil
das Ergebnis grün ist, und nicht, weil kein anderer Ausgang vorgesehen war.

## Beide mit `--bericht`

Wer die Liste lesen will, soll sie ohne Fehlerschluss bekommen; dieselbe Regel
wie bei den Prüfern. Die Proben, die den **Text** von `startklar` prüfen,
laufen seither mit dem Schalter — und zwei neue prüfen den **Ausgang**: rot
ohne Schalter, grün mit.

## Die Gegenprobe, die sich selbst überschrieb

Für `rollout` sollte die Mutation die Wartezeit der Rechtstexte von zehn auf
sechzig Tage setzen. Der erste Anlauf fügte ein **zweites** `tage: 60` vor das
vorhandene `tage: 10` ein. In einem Objektliteral gewinnt der letzte Schlüssel;
die Mutation kam an und bewirkte nichts.

> **Eine Mutation, die der Bau überschreibt, ist keine.**

Dritter Fall dieser Art an zwei Tagen: der Kommentar, den das Bündel wegwirft,
und das leere Literal, das die Regel gar nicht meinte.

## Stand

| | |
|---|---|
| Werkzeuge ohne roten Ausgang | 7 (vorher 9), alle Berichte |
| Werkzeuge mit Urteil und rotem Ausgang | 2 neu |
| Gegenproben, die anschlagen | **30 von 30** |
| Tests | 1276 |

`npm run startklar` endet ab jetzt rot — und zwar so lange, bis der Shop
wirklich startklar ist. Das ist keine Verschlechterung, sondern das erste Mal,
dass die Antwort außerhalb des Bildschirms zählt.
