# Der Prüfstand maß alles außer sich selbst

**7. September 2026.** `npm run alles` misst 42 Schritte, 1855 Testfälle, 105
Gegenproben, 24 Zahlen der Inhaltsseiten, 28 Gates, 8 Weisungen, 36 Kennzahlen
der Beschreibung. Über sich selbst hat er nie eine Zahl ausgegeben: **Wie lange
er dauert, stand nirgends.**

Das ist keine Bequemlichkeitsfrage. Die Laufzeit ist die eine Zahl, die
darüber entscheidet, ob dieser Lauf weiter gemacht wird.

> **Ein Prüfstand, der zu lange braucht, wird nicht langsamer — er wird
> übersprungen.**

Genau das ist am 5. September schon einmal passiert: Die vier Browserproben
standen außerhalb des Regellaufs, „weil jede einen Chromium-Start kostet", und
drei Szenarien waren sechs Stunden rot, ohne dass ein Lauf es meldete. Gate 27
hat sie hereingeholt. Der nächste Kandidat für dieselbe Ausrede sind die
Gegenproben.

---

## Gemessen: 315 Prüferläufe

Jede Gegenprobe braucht drei Läufe ihres Prüfers — vorher grün, mutiert rot,
zurückgesetzt wieder grün. Bei 105 Proben sind das **315 Läufe**.

Sie sind nicht gleich teuer. Ein `pruefe-belege` läuft unter einer Sekunde;
**ein Testlauf kostet 23 Sekunden**, und **dreißig der 105 Proben hängen am
Prüfer `test`**. Allein diese dreißig kosten 90 Testläufe, also rund
**35 Minuten** — und jede neue Probe an diesem Prüfer legt 69 Sekunden drauf.
Das ist der Preis, den diese Arbeitsweise pro Runde zahlt, und er wächst
linear.

---

## Der eine Lauf, der sich sparen lässt

Wenn Probe A ihren Prüfer **nach dem Zurücksetzen wieder grün** gesehen hat
und Probe B denselben Prüfer braucht, dann *ist* dieser Lauf der „vorher
grün"-Lauf von B. Dazwischen ist nichts passiert — der Läufer prüft nach jeder
Probe byteweise nach, dass die Datei wieder dasteht wie zuvor, und bricht sonst
ab.

Die vier Zusicherungen bleiben damit vollständig. Gespart wird kein Beweis,
sondern seine Wiederholung.

Damit das oft zutrifft, laufen die Proben jetzt **nach Prüfer gruppiert** — in
der Reihenfolge, in der ihr Prüfer zum ersten Mal im Register vorkommt, nicht
alphabetisch: Eine Umbenennung würde sonst zwei Berichte unvergleichbar machen.

Im Regellauf laufen 102 der 105 Proben — drei hängen an Browserproben und
sind zurückgestellt:

| | Prüferläufe |
|---|---|
| ohne Wiederverwendung | 306 |
| in Registerfolge (zufällige Nachbarschaft) | 271 |
| **nach Prüfer gruppiert** | **243** |

Die Ersparnis liegt fast ganz bei den dreißig Testproben: 90 Läufe werden 61,
gut **elf Minuten**.

**Gemessen im ersten Lauf mit Uhr: 34 min 52 s für 42 Schritte**, davon
**2.006 s allein für die Gegenproben** — 96 % der Zeit für einen von
zweiundvierzig Schritten. Der zweitteuerste ist die Shopprobe mit 11 s. Damit
steht die Zahl, um die es geht, zum ersten Mal da.

---

## Was hier bewusst nicht passiert

**Parallel laufen die Proben nicht.** Das wäre der offensichtliche Schritt und
wäre falsch: Eine Mutation in `kampagne.mjs` färbt den ganzen Testlauf rot, und
eine zweite Probe, die zeitgleich ihren „vorher grün"-Lauf macht, schlösse
daraus, ihr Prüfer sei kaputt. Der Bestand ist während einer Gegenprobe
absichtlich verstellt — er ist kein Zustand, den zwei Messungen sich teilen
können.

**Keine Grenze wird gesetzt.** Der Lauf gibt seine Zeit aus, je Schritt und in
Summe, und wird davon nicht rot. Eine Schwelle ohne Messreihe wäre eine
erfundene Zahl, und dieses Verzeichnis hat genug davon gesehen. Erst steht die
Zahl da; wenn sie über mehrere Läufe wächst, ist das der Anlass, nicht der
erste Wert.

---

## Die Gegenprobe

Sie entfernt die Bedingung „derselbe Prüfer". Ohne sie übernähme eine Probe das
grüne Ergebnis eines **anderen** Prüfers als Beweis, dass ihr eigener vorher
grün war — und das ist kein Beweis, sondern eine Verwechslung. Der Testfall
dazu fällt, und die Probe meldet rot.
