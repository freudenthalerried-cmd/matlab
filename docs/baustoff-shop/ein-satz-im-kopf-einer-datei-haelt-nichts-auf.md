# Ein Satz im Kopf einer Datei hält nichts auf

**8. September 2026, nachmittags.** Ein Commit dieses Loops rief `git add -A`,
während im Hintergrund `npm run alles` bei den Gegenproben stand. Eine davon
hielt in diesem Moment `src/schaufenster.js` absichtlich falsch. Die Zeile ging
mit:

```diff
-      muster: /aus (\d+) Lieferantenbelegen/, soll: m.belege },
+      muster: /aus (\d+) Lieferantenbelegen/, soll: m.belege + 1 },
```

Das ist kein Tippfehler, sondern ein **blindgestellter Prüfer**.
`pruefe-schaufenster` hält die Zahl der Lieferantenbelege in der
PR-Beschreibung gegen den Katalog; mit dem verschobenen Sollwert hält er sie
gegen nichts. Er stand **fünfunddreißig Minuten** so auf dem Zweig, und der
Lauf, der ihn hätte auffallen lassen, lief zur selben Zeit.

Aufgefallen ist es an der Stelle, an der dieser Bestand solche Sachen auffallen
lässt: Die Abschlussprüfung des Loops meldete „uncommitted changes", und der
Unterschied zeigte in die andere Richtung als erwartet — im Verzeichnis stand
die Mutation, auf der Platte das Richtige. Der Gegenprobenläufer hatte
zurückgeschrieben, was ich committet hatte.

---

## Der Schutz war da. Er war ein Satz.

`bin/mutationspruefung.mjs` trägt seit dem **4. September** in seinem
Kopfkommentar:

> *Wer währenddessen committet, committet die Mutation. Genau dafür ist dieser
> Loop gebaut: Er committet und pusht ohne Rückfrage.*

Und einen Absatz weiter: *„Der Prüfer ist die Auskunft darüber, und er gehört
vor jeden Commit."*

Beide Sätze stimmen. Beide standen da. Der Fall, den sie beschreiben, ist genau
der eingetretene — bis auf die Datei. Und geholfen haben sie nicht, aus einem
Grund, der in dem Satz selbst steht: **committet wird hier von einem Programm.**

> **Eine Regel, die nur als Satz dasteht, gilt für den, der sie liest.**

Das ist die vierte Ausprägung derselben Sache innerhalb einer Woche:

| Tag | Die Regel gab es | Sie galt nicht |
|---|---|---|
| 4. September | `src/sicherung.js` sichert vor jedem Überschreiben | die Gegenprobe, ihr eigener Anlass, benutzte sie nicht |
| 6. September | sieben Sperren entscheiden über den Versand | keine kannte ihren grünen Fall |
| 8. September, vormittags | `pruefe-geheimnis` sucht Einkaufspreise | es sah in die Ausgabe, während das Verzeichnis genauso öffentlich ist |
| 8. September, nachmittags | „gehört vor jeden Commit" | niemand rief ihn, denn der Commit kommt aus einem Skript |

Der Unterschied liegt nie im Wissen. Er liegt darin, ob das Wissen an der
Stelle ankommt, die handelt.

---

## Was daraus wurde: die Regel steht jetzt im Weg

`shop/haken/pre-commit` ist ein versionierter git-Haken, der die
Mutationsprüfung aufruft. Läuft irgendwo eine Gegenprobe, liegt unter
`.sicherung/` ein Zettel mit dem Original — der Haken fragt ihn, bevor git
schreibt, und der Commit bleibt stehen.

**Eingerichtet wird er dort, wo die Gefahr entsteht.**
`bin/gegenprobenlauf.mjs` setzt `core.hooksPath`, bevor er die erste Datei
falsch macht. Nicht in einer Anleitung, nicht in `npm install` — das läuft hier
nie, der Bestand hat keine fremden Pakete —, sondern in der Zeile, die mutiert.

> **Der Schutz gehört zu der Stelle, die die Gefahr erzeugt.**

Ein Behälter, in dem noch nie eine Gegenprobe lief, hatte auch noch nie eine
offene Mutation. Er braucht den Haken nicht, und er bekommt ihn in dem
Augenblick, in dem er ihn braucht.

---

## Und der Prüfer sieht den Haken nicht an — er löst ihn aus

`npm run pruefe-haken` misst nicht, dass die Datei dasteht. Es **ruft sie
zweimal auf**:

- mit einem eigens gelegten Zettel — er muss sperren,
- ohne Zettel — er muss durchlassen.

Der zweite Fall ist der wichtigere, und er steht hier wegen des Befunds vom
6. September: Sieben Sperren hatten je eine Probe für ihren eigenen Sperrgrund
und keine für den Fall, dass sie aufgeht. Ein Haken, der jeden Commit sperrt,
besteht jede Prüfung der Form „sperrt er?" — und macht den Bestand
unbenutzbar, bis ihn jemand abschaltet.

Dazu misst der Prüfer die üblichen zwei Richtungen: Jeder angeordnete Haken
muss als ausführbare Datei dastehen und das Werkzeug nennen, das er ruft; und
jede Datei in `haken/` muss einen Registereintrag mit Grund haben. Die
Gegenprobe benennt das gerufene Werkzeug um — dann steht der Haken weiter da,
ist ausführbar, ist im Register genannt und hält nichts mehr auf.

---

## Was das über den Tag sagt

Am Vormittag stand hier der Satz **„Was nicht committet ist, gibt es nur,
solange die Maschine läuft."** Er entstand, weil eine Runde Arbeit beim
Neuaufsetzen des Behälters verlorenging, und die Folge war: erst committen,
dann den langen Lauf starten.

Genau das habe ich heute getan — und dabei den zweiten Fehler gemacht, der zum
ersten gehört:

> **Was committet wird, während die Maschine läuft, ist nicht unbedingt der
> Bestand.**

Beide Sätze sind wahr, beide zeigen in verschiedene Richtungen, und zwischen
ihnen liegt der einzige Zeitpunkt, an dem beides gilt: vor dem Lauf, nicht
während. Der Haken macht daraus keine Regel mehr, an die man sich erinnern
muss.
