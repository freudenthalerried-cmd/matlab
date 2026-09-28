# Vier Begründungen, die schlüssig klangen

**2. September 2026, nachts.** Eine Stunde zuvor kam eine zurückgezogene
Gegenprobe zurück. Sie war am 1. September aufgegeben worden, mit einem
sauberen Grund:

> Drei Versuche, keiner ist angekommen. … Der Eintrag ist zurückgezogen, weil
> ein Prüfer, dem eine untaugliche Gegenprobe „schlägt nicht an" bescheinigt,
> zu Unrecht beschuldigt wird.

Der Grund war nobel und **falsch**. Die Mutationen kamen an, der Prüfer meldete
sie — nur endete er mit `process.exit(0)` ohne Bedingung.

Das war Anlass genug, die übrigen fünf Verzichte noch einmal anzusehen. Von
sechs Begründungen hielten **zwei**.

## Was jetzt eine Gegenprobe hat

| Prüfer | die Begründung | was daran nicht stimmte |
|---|---|---|
| `pruefe-stand` | „Seine Mutation ist eine **neue Datei**, und das Werkzeug kann nur ändern." | Der Grund sah nur eine Richtung. Eine Datei ungenannt zu machen geht auch, indem man **ihren Namen aus dem Verzeichnis entfernt** — eine Änderung wie jede andere. |
| `pruefe-preise` | „Vier Ausgaben aus **einem** Bau; eine Mutation trifft sie gemeinsam. Zwei Versuche waren Leerläufe." | Die Preiszeile der Artikelkachel kommt im Bauwerkzeug **genau einmal** vor und trifft genau eine der vier Ausgaben. Was fehlte, war `baueVorher` — ohne Bau dazwischen erreicht eine Änderung am Werkzeug die Ausgaben gar nicht. |
| `pruefe-preisalter` | „Seine Grundlage ist `preise/` — die eine Datei, die diese Arbeit nicht anfasst." | Das stimmt für den **Preis** und nicht für sein **Alter**. Der Preisstand steht im öffentlichen Katalog, und genau er ist der Gegenstand dieses Prüfers. |
| `pruefe-tests` | „Eine Gegenprobe wäre ein absichtlich roter Test, und der Lauf dauert vierzehn Sekunden." | Beides beschreibt einen **Testlauf**. Dieser Prüfer lässt nichts laufen — er liest den Quelltext der Testdateien und sucht drei Muster. Die Mutation ist ein Testfall mit genau einem davon. |

> **Eine Begründung, die niemand nachprüft, wird mit der Zeit zur Tatsache.**

Alle vier waren beim Schreiben ehrlich gemeint und keiner war Bequemlichkeit.
Sie beschrieben nur etwas anderes als das, worum es ging: eine Richtung, ein
fehlendes Werkzeugmerkmal, eine Datei, einen anderen Prüfer.

## Und die zwei, die halten

- **`pruefe-pruefer`** — seine Gegenprobe wäre ein Prüfer mit leerem Ergebnis,
  und genau das tut dieses Register bereits. Ein Ring, kein Nachweis.
- **`pruefe-geheimnis`** — seine Mutation wäre, einen Einkaufspreis in eine
  öffentliche Datei zu schreiben. Auch nur für Sekunden und auch nur lokal.
  Das ist die eine Datei, die diese Arbeit nicht anfasst; hier ist der Verzicht
  keine Bequemlichkeit, sondern die Regel selbst.

## Zwei Nebenbefunde

**Die erste Fassung der Testprüfer-Gegenprobe lief über `[]`.** Sie blieb grün,
und diesmal lag es nicht am Prüfer: Er sucht Schleifen über eine **benannte**
Liste. Bei einem leeren Literal sieht jeder, dass sie leer ist; die Regel zielt
auf den Fall, in dem man es nicht sieht. Die Mutation trifft jetzt die Regel,
die es gibt — und nicht die, die ich im Kopf hatte.

**Eine Untergrenze musste fallen.** Die Probe verlangte „mindestens 3
begründete Verzichte" — geschrieben, als es sieben waren, damit die Schleife
darunter nicht leer läuft. Heute sind es zwei. Eine Untergrenze, die verbietet,
dass eine Liste schrumpft, hält den schlechteren Zustand fest; sie steht jetzt
auf 1, und das ist alles, was sie leisten soll.

## Stand

| | |
|---|---|
| Gegenproben, die anschlagen | **29 von 29** (vorher 25) |
| Prüfer ohne Gegenprobe | **2** (vorher 6) |
| Prüfer im Register | 18 |
| Tests | 1270 |

Vier Prüfer, die gestern noch als „nicht nachweisbar" geführt waren, haben
heute einen Nachweis. An keinem von ihnen war etwas kaputt — es hatte nur
niemand nachgesehen, ob der Grund für das Nichtnachsehen stimmt.
