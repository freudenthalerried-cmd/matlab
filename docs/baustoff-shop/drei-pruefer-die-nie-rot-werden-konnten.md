# Drei Prüfer, die nie rot werden konnten

**1. September 2026, siebte Runde.** Die Frage vom Ende der letzten Stunde:
*Welche Gegenprobe habe ich für bestanden gehalten, ohne sie anschlagen zu
sehen?* An diesem Tag waren es zwei von drei.

`npm run gegenproben` stellt die Frage jetzt maschinell. Ein Register führt je
Prüfer eine Mutation, die ihn rot machen **muss**, und der Lauf verlangt vier
Dinge — keines reicht allein:

1. Der Prüfer ist **vorher grün** — an einem roten lässt sich nichts zeigen.
2. Die Mutation ist **angekommen**; sonst lief er über den unveränderten Bestand.
3. Er meldet **rot** und nennt die erwartete Stelle.
4. Nach dem Zurücksetzen ist er **wieder grün**.

Der erste Lauf hatte sechs Einträge. Einer schlug nicht an — und das war der
Fund.

## `pruefe-inhalte` fand den Verstoß und endete grün

Die Mutation hängte an eine Wissensseite: *„Wir sind garantiert der günstigste
Anbieter Österreichs."* Der Prüfer **fand die Erfolgszusage und meldete sie
vollständig**:

```
baumeisterpreis.md
  Zeile 77: Wir sind garantiert der günstigste Anbieter.…
    → Erfolgszusage: „garantiert" — diese Aussage steht einem Baustoffhändler nicht zu

24 Dateien, 376 Absätze geprüft, 1 mit Verdacht.
```

Rückgabewert: **0**.

Damit stand er in jeder Prüferschleife auf „OK", ganz gleich was er fand. Ich
habe diese Schleife tagelang als Statusbericht gelesen und jede Stunde
„14 × OK" gemeldet.

> **Ein Prüfer, der jeden Fund als Verdacht meldet und immer grün endet, ist ein
> Bericht, keine Wache.**

## Und dann waren es drei

Die Suche danach war schnell: `grep` nach `process.exit(1)` über alle
Prüfwerkzeuge.

| Prüfer | Rückgabewert bei Funden |
| --- | --- |
| `pruefe-inhalte` | 0 — *„1 mit Verdacht"* |
| `pruefe-quellen` | 0 — *„NOCH NICHT VERWENDBAR"* |
| `pruefe-tests` | 0 — *„4 mit Verdacht"* |

Drei von vierzehn, alle drei aus derselben gut gemeinten Überlegung: Ein
Verdacht ist kein Urteil, die Faktenprüfung bleibt Handarbeit, also soll er nicht
blockieren. Der Vorbehalt ist richtig. Nur folgt daraus nicht Rückgabewert 0,
sondern das Gegenteil:

> **Ein Verdacht, den niemand ansieht, ist ein grünes Licht.** Der Vorbehalt
> gehört in die Ausgabe, nicht in den Rückgabewert.

„NOCH NICHT VERWENDBAR" mit Rückgabewert 0 heißt für jede Maschine: verwendbar.

Alle drei enden jetzt rot, wenn sie etwas finden. `--bericht` behält den alten
Weg für den, der nur ansehen will; `--probe` — der Selbstnachweis über eine
absichtlich fehlerhafte Datei — bleibt grün, sonst könnte kein Werkzeug mehr
seine eigenen Muster vorführen.

## Was sofort auffiel, als `pruefe-tests` rot werden konnte

**Dreizehn Verdachtsfälle.** Schleifen über Register ohne vorherige
Längenzusicherung — bei leerer Liste prüfen sie nichts. Alle dreizehn in
Testdateien, die **heute** entstanden sind: Rollout, Kennzahlen, Leitzahlen.

Ausgerechnet dieser Prüfer hatte einmal „elf Schleifen gefunden, die grün liefen
und nichts prüften". Er lief selbst grün und meldete nichts weiter — während ich
dreizehn neue schrieb.

Alle bereinigt; jede Schleife hat jetzt ihre Längenzusicherung.

## Zwei zurückgezogene Einträge

`pruefe-seiten` und `pruefe-preise` meldeten „schlägt nicht an" — aber die
Schuld lag beim Register, nicht bei ihnen. Beide lesen nicht die Quelle, sondern
das **Erzeugnis**; eine Mutation in `inhalte/` erreicht sie erst nach einem Bau.
Der Eintrag trug dafür ein Feld `baueVorher`, und **der Läufer hat es
ignoriert**.

> **Ein Register, dessen Felder der Läufer nicht kennt, erfindet Befunde.**
> Dieselbe Familie wie eine Gegenprobe, die nicht ankommt — nur meldet diese rot
> statt grün, und eine falsche Anschuldigung ist auch eine Fehlmeldung.

`baueVorher` ist jetzt eingebaut. Für `pruefe-seiten` hat auch das nicht
gereicht, und für `pruefe-preise` waren zwei weitere Versuche Leerläufe. Beide
Einträge sind **zurückgezogen** — mit dem wahren Grund: Was fehlt, ist meine
Kenntnis ihrer Regeln, nicht ihre Wachsamkeit. Ein Prüfer, dem eine untaugliche
Gegenprobe „schlägt nicht an" bescheinigt, wird zu Unrecht beschuldigt.

## Der Stand

**Sieben Gegenproben, sieben schlagen an. Sieben Prüfer mit begründetem
Verzicht** — darunter `pruefe-geheimnis`, dessen Mutation einen Einkaufspreis in
eine öffentliche Datei schriebe: die eine Datei, die diese Arbeit nicht anfasst.

Kein Prüfer bleibt ohne Gegenprobe **und** ohne Grund. Das ist die eigentliche
Zusicherung dieses Registers, und sie wird von einem Test gehalten.

## Die Frage für den nächsten Lauf

Drei Runden lang lauteten die Fragen: *welche Datei liest niemand*, *welche Zahl
rechnet niemand nach*, *welche Gegenprobe schlägt nie an*. Jede hat etwas
gefunden, und jede war enger als die vorige.

Die nächste geht auf den blinden Fleck aller drei:

> **Welche Regel gilt nur dort, wo ich sie geschrieben habe?**

Die Lückenmarkierung galt für Kundenbelege und nicht für Lieferantenbestellungen.
Die Bedingung in Sichtweite gilt in der Akte und nicht im Quelltext. Der
Rückgabewert 0 galt für drei Prüfer und für elf nicht. Jedes Mal war die Regel
richtig und ihr Geltungsbereich zufällig — er endete dort, wo an dem Tag die
Aufmerksamkeit endete.
