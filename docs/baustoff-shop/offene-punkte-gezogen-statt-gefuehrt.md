# Fünfzehn offene Punkte, verteilt auf ein Dutzend Dokumente

**1. September 2026.** Über den heutigen Tag ist die Liste dessen, was der
Auftraggeber tun muss, gewachsen — und sie ist nirgends vollständig
aufgeschrieben. Nachgezählt, wo sie steht:

| Wo | Was |
|---|---|
| `npm run startklar` | Impressum, Lieferzeit, Zahlungsanbieter, Rechtstexte, Adresse, Repository |
| Lückenliste des Feeds | GTIN, Marke, Produktbild |
| `npm run pruefe-preisalter` | sieben Preise über 90 Tage |
| `PARAMETER.md` | Sortiment auf mindestens hundert Artikel |
| drei verschiedene Befunde | drei Fragen an den Lieferanten |
| `messliste-fuer-das-laufende-modell.md` | die Suchvolumenmessung |
| `weg-zum-ersten-verkauf.md` | sieben Punkte — vom 31. August |

Die letzte Zeile ist das Problem. Das Dokument war eine gute Liste, als ich es
geschrieben habe. Einen Tag später führt es die Domain noch als offen, obwohl
sie entschieden ist, und kennt drei der heutigen Punkte nicht.

> **Eine Liste, die von Hand fortgeschrieben wird, ist an dem Tag falsch, an
> dem jemand einen Punkt schließt und die Liste nicht anfasst.**

Dieselbe Fehlerart wie die PR-Beschreibung heute früh, wie der feste
Seitenfuß, wie der Preisstand. Sie hört nicht auf, weil sie nicht an einer
bestimmten Datei hängt, sondern an der Gewohnheit, etwas zweimal zu wissen.

## Gezogen statt geführt

`npm run offenepunkte` fragt die Werkzeuge, die es ohnehin gibt:

```
Offene Punkte — 15 in 4 Gruppen, Stand 2026-09-01

Liegt vor, fehlt nur in der Datei  (1)
  · Impressum vollständig
      4 Pflichtangaben fehlen: E-Mail, Telefon, UID, Gewerbewortlaut
      [npm run startklar]

Anfrage an Dritte — freigabepflichtig  (8)
  · Lieferzeit je liefernden Lieferanten bekannt          [npm run startklar]
  · Produktfeed: GTIN/EAN — bei 43 von 43                 [npm run veroeffentlichung]
  · Produktfeed: Marke — bei 20 von 43                    [npm run veroeffentlichung]
  · Produktfeed: Produktbild — bei 43 von 43              [npm run veroeffentlichung]
  · 7 Einkaufspreise älter als 90 Tage                    [npm run pruefe-preisalter]
  · Preisrhythmus des Lieferanten                         [von Hand geführt]
  · Liefergebiet des Lieferanten                          [von Hand geführt]
  · Artikelliste aus dem Kundenkonto                      [von Hand geführt]

Kostet Geld — freigabepflichtig  (2)
  · Zahlungsanbieter · Rechtstexte                        [npm run startklar]

Entscheidung des Auftraggebers  (4)
  · Seite erreichbar · Repository privat                  [npm run startklar]
  · Suchvolumen messen · Upload nach bauversand.com       [von Hand geführt]
```

Geordnet nicht nach Wichtigkeit — die ist Ansichtssache —, sondern danach,
**wer handeln muss und was es kostet**. Das ist die Frage, die man beim Lesen
tatsächlich hat.

## Was kein Werkzeug weiß, steht mit dem Grund da

Fünf Punkte kann kein Werkzeug messen. Sie stehen in `src/offenepunkte.js`,
und jeder trägt zwei Pflichtfelder: **warum ihn kein Werkzeug kennt** und
**was er löst**.

Das erste Feld ist der eigentliche Trick. Wer hier etwas einträgt, das ein
Werkzeug messen könnte, soll beim Schreiben des Grundes merken, dass er keinen
hat. Eine Probe verlangt beide Felder und eine Mindestlänge — eine
Begründung in vier Wörtern ist keine.

## Der Befund, der sich beim Sortieren zeigte

Acht der fünfzehn Punkte hängen an **einer einzigen Anfrage**. Die
Artikelliste aus dem Poschacher-Kundenkonto trägt in aller Regel EAN,
Herstellername und Bildverweis je Position — das sind die drei Feedlücken. Ein
Anruf zur Lieferzeit und zwei Fragen zu Preisrhythmus und Liefergebiet lassen
sich im selben Gespräch stellen. Und dieselbe Liste erfüllt die Weisung vom
28. August, das Sortiment auf mindestens hundert Artikel zu erweitern.

**Ein Gespräch mit dem Lieferanten schließt mehr als die Hälfte der Liste.**
Das war vorher nicht sichtbar, weil die acht Punkte in sechs Dokumenten
standen.

## Eine Berichtigung an der Quelle

`startklar` meldete für die Lieferzeit `wer: 'Auftraggeber'` — wie beim
Impressum. Das trifft es nicht: Die Impressumsangaben **liegen** ihm vor, die
Lieferzeit muss er **erfragen**. Für die Aufstellung ist das der Unterschied
zwischen fünf Minuten und einem Anruf, der freigabepflichtig ist.

Berichtigt an der Quelle statt in der Aufstellung: `'Auftraggeber (Anfrage)'`.
Ein Sonderfall in der Liste hätte dieselbe Aussage ein zweites Mal getroffen.

## Was diese Aufstellung nicht ist

Sie ersetzt kein Dokument. `weg-zum-ersten-verkauf.md` erklärt, **warum** die
Punkte in dieser Reihenfolge stehen und was sie wirtschaftlich bedeuten; das
kann kein Werkzeug. Sie ersetzt nur das **Abzählen** — und genau daran ist die
Liste gestern gescheitert.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Unbekannte Zuständigkeit stillschweigend einsortieren | ja |
| Handgeführte Punkte weglassen | ja |
| Feedlücken nicht mehr aufnehmen | ja |

## Stand

- 1.090 Tests, 0 rot; alle Prüfer grün
- neu: `npm run offenepunkte`
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus. Das Versenden einer Anfrage an
Dritte bleibt Sache des Auftraggebers — auch die eine, die acht Punkte
schließen würde.
