# Keine Nummer ist ein Zitat

**9. September 2026, nachts.** Die Runde davor hat gemessen, dass das
Rechtsinformationssystem des Bundes aus dieser Umgebung gesperrt ist. Der
Befund stand als eine Zeile in einem Register:

```
· rechtsinformationssystem   gesperrt, 2026-09-09
```

Aus dieser Zeile folgt ein Satz, der vorher nirgends stand:

> **Keine einzige Paragraphenangabe dieses Bestands ist am Volltext belegt.**

Gezählt: **173 Nennungen von 23 Fundstellen**, verteilt über Quelltexte,
Register und Inhaltsseiten. Kein Wort davon ist erfunden — aber kein Wort ist
nachgeschlagen.

---

## Was besonders unangenehm ist

Vier Einträge zitieren **§ 11 Abs 1 UStG** mit vier verschiedenen Ziffern:

| Ziffer | wofür |
|---|---|
| Z 2 | Name, Anschrift und ab 10.000 € die UID des **Empfängers** |
| Z 3 | Name, Anschrift und ab 400 € die UID des **Ausstellers** |
| Z 4 | das **Ausstellungsdatum** |
| Z 5 | die **fortlaufende und einmalige** Rechnungsnummer |

Ich habe zuerst nach einem Widerspruch gesucht — zwei Stellen, die dasselbe
mit verschiedenen Ziffern belegen. Es gibt keinen. Die vier Ziffern zeigen auf
vier verschiedene Angaben, sie überschneiden sich nirgends, und alle sechs
Fundstellen darauf sind untereinander stimmig.

> **Und genau das ist das Unangenehme: Eine Nummerierung, die zueinander
> passt, sieht geprüft aus.**

Stimmt die Aufteilung nicht, sind alle sechs Pflichtgründe daneben, die darauf
zeigen. In diesem Verzeichnis trägt ein Pflichtgrund Gewicht — er ist der
Grund, warum eine Prüfung so und nicht anders entscheidet.

---

## Gate 33: Die Ziffern bleiben stehen — als unbelegt

Zwei Wege standen offen.

**Die Ziffern streichen** und nur die Paragraphen nennen. Dann geht eine
Angabe verloren, die richtig sein kann, und ein Rechtstexteanbieter bekäme
weniger, als wir wissen.

**Die Ziffern stehen lassen und den fehlenden Beleg danebenschreiben.**
Entschieden: das Zweite.

Jede Fundstelle steht seither mit ihrer **ausgeschriebenen Behauptung** und
`belegt: false` in `RECHTSGRUENDE`. Damit wird aus 173 verstreuten Paragraphen
eine Liste, die ein Rechtstexteanbieter in einer Sitzung abhaken kann — die
Nummer, was sie behauptet, und wo sie wirkt.

Und `belegt` ist kein Schalter für ein gutes Gefühl: Wer ihn auf `true` stellt,
ohne ein Datum danebenzuschreiben, wird gemeldet.

**Auf einem Kundenpapier steht ohnehin keine Ziffer.** Gemessen: Die Rechnung
und die Auftragsbestätigung tragen `§ 11 UStG` und `§ 11 Abs 6 UStG` — die
groben Formen, die auch dann stimmen, wenn die Aufteilung anders ist. Die
Ziffern leben in Pflichtgründen, und dort wiegen sie schwer genug für diese
Entscheidung.

---

## Vier Wirkungen, und sie sind nicht gleich viel wert

| | |
|---|---|
| `beleg` | 2 — steht auf einem Papier, das der Kunde bekommt |
| `seite` | 8 — steht auf einer ausgelieferten Seite |
| `pflichtgrund` | 9 — trägt einen Pflichtgrund in einem Register |
| `erklaerung` | 4 — erklärt eine Entwurfsentscheidung im Quelltext |

Wer die Liste abarbeitet, fängt oben an.

---

## Was der Prüfer beim ersten Lauf gefunden hat

**Drei Paragraphen ohne Gesetz.** In `src/kontrolle.js` stand „§ 131 BAO …,
§ 132 verlangt sieben Jahre Aufbewahrung" — die 131 nennt ihr Gesetz, die 132
nicht, und in der ganzen Datei sonst auch nirgends. Dasselbe in
`bin/belegpruefung.mjs` und `bin/kontrolllauf.mjs`.

> **Eine Fundstelle ohne Gesetz ist eine Zahl.**

Ausgeschrieben. Die Kurzform bleibt erlaubt, wenn die Langform vorher in
derselben Datei steht — so wird in Rechtstexten geschrieben, und eine Prüfung,
die jede Nennung ausschreiben ließe, lädt zur Umgehung ein.

**Zwei Langformen ohne Eintrag.** `§ 5 E-Commerce-Gesetz` steht ausgeschrieben
auf der Impressumsseite und abgekürzt im Quelltext; für den Prüfer sind das
zwei Fundstellen, und beide brauchen ihre Behauptung.

**Und eine Regel, die der Prüfer sich selbst abgerungen hat.** Die erste
Fassung ließ die erste Nummer einer Reihe durchgehen, sobald das Gesetz
irgendwo dahinterstand — „§ 864a, § 879 ABGB" galt als *eine* Fundstelle.
Damit wäre **§ 864a ABGB** nie im Register gelandet, obwohl es eine eigene
Behauptung trägt: dass eine ungewöhnliche Bestimmung in Allgemeinen
Geschäftsbedingungen nicht Vertragsinhalt wird. Das ist die Regel, an der die
eigenen AGB gemessen werden. Sie steht jetzt drin.

---

## Was das nicht löst

Es belegt **nichts**. Der Prüfer läuft ohne Netz und kann keinen Gesetzestext
lesen; er sorgt dafür, dass jede Nummer eine Aussage trägt und in einer Liste
steht.

**Beim Auftraggeber liegt damit ein Punkt genauer als vorher:** Die Rechtstexte
sind ohnehin eine offene Ausgabe. Was der Anbieter mitbekommen sollte, ist
nicht „bitte prüfen Sie unsere AGB", sondern diese Liste mit dreiundzwanzig
Zeilen — die Nummer, die Behauptung, die Wirkung.

---

## Nachtrag am selben Abend: die fünfte Abweichung beim Veröffentlichen

Nach dem Bau wurde die PR-Beschreibung nachgezogen (32 → 33 Gates, 42 → 43
Prüfer, eine neue Zeile in der Befundtabelle) und veröffentlicht. Danach der
inzwischen feste Handgriff: die veröffentlichte Fassung mit dem GitHub-Werkzeug
zurücklesen und gegen die Werkzeugausgabe halten.

**Sie stimmte an zwei Stellen nicht.** Die veröffentlichte Fassung trug

- im Punkt *Rechtstexte und Zahlungsanbieter* einen Satz über die 23
  Fundstellen und
- im Punkt *Datenblätter der Hersteller* einen Zusatz über die Messung
  („am 9. September gemessen, auf beiden verfügbaren Wegen")

— beide Sätze richtig, beide in der Quelle nicht vorhanden. Sie sind beim
Übertragen entstanden: Der Text lag daneben, der Zusammenhang war frisch, und
was frisch ist, schreibt sich beim Abtippen mit. Berichtigt wurde wie in den
vier Fällen davor **die Quelle**, nicht die Veröffentlichung.

Damit steht die Bilanz des Handgriffs bei **vier Abweichungen in fünf Runden.**
Ein Handgriff, der in vier von fünf Fällen etwas findet, ist kein Handgriff
mehr, sondern eine Fehlerquelle mit Kontrolle davor.

### Und die Grenze dieses Abgleichs, offen benannt

Er ist ein **Augenvergleich**. Die zurückgelesene Fassung kommt als Antwort
eines Werkzeugs, nicht als Datei; sie in eine Datei zu bringen hieße, sie
erneut abzutippen — also genau den Schritt zu wiederholen, der die
Abweichungen erzeugt. Ein Vergleich, den kein Rechner ausführt, findet den
dazugeschriebenen Satz und übersieht das Komma.

> **Ein Abgleich, den niemand rechnet, findet nur, was auffällt.**

Was ihn maschinell macht, steht als nächste Aufgabe fest und braucht keine
Netzverbindung: **eine Markierung am Textende, die den Fingerabdruck des Textes
darüber trägt.** Dann prüft sich die veröffentlichte Fassung selbst — wer sie
liest, hasht alles oberhalb der Markierung und vergleicht mit ihr; die Quelle
braucht er dafür nicht. Ein beim Übertragen dazugeschriebener Satz ändert den
Text, nicht die Markierung, und fällt damit auf, ohne dass jemand zwei
Fassungen nebeneinanderlegt.
