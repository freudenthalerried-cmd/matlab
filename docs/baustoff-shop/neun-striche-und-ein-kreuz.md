# Neun Striche und ein Kreuz

**1. September 2026, vierte Runde.** Elftes Ergebnis des Ursprungsauftrags: *ein
KPI-Dashboard als teilbare Seite.* Der Auftragsabgleich hat es als **offen**
geführt, mit dieser Begründung:

> Ein KPI-Dashboard gibt es nicht. Es wäre heute auch leer: Der Shop hat keine
> Bestellung, keinen Klick und keinen Besucher gesehen. Ein Dashboard ohne Daten
> ist ein Rahmen, der Betrieb vortäuscht.

Dieselbe Prüfung wie eine Stunde zuvor beim Rollout: **Richtet sich der Einwand
gegen die Sache oder gegen eine vorgetäuschte Fassung?**

Er trifft die vorgetäuschte — die mit Kurven, die bei null verlaufen, und
Kacheln, die „0 €" zeigen, als wäre gerade nichts verkauft worden. Er trifft
nicht die Sache. Denn was ein Dashboard **vor** dem Start leisten kann, ist
genau das, was es nachher nicht mehr kann:

> **Festlegen, was gemessen wird, gegen welche Schwelle — und welche
> Entscheidung daran hängt.** Danach ist die Versuchung da, die Schwelle zu
> verschieben, weil man die Zahl schon kennt.

Das ist dieselbe Disziplin wie die vorab festgelegte Abbruchregel: 299 Klicks
schließen 1 % aus. Diese Zahl war vor dem ersten Klick da, und deshalb ist sie
etwas wert.

## Was auf der Seite steht

`npm run kennzahlen` erzeugt `ausgabe/kennzahlen.html` — eine einzelne Datei,
kein Server, kein Nachladen. Zehn Kennzahlen in drei Abschnitten, die
aufeinander folgen:

| Abschnitt | ab wann | Frage |
| --- | --- | --- |
| Vor dem Start | jetzt | Was fehlt noch, bevor irgendetwas laufen kann? |
| Der Versuch | ab dem Schalten der Anzeigen | Gibt es die Kaufquote, für die gerechnet wurde? |
| Der Betrieb | ab dem ersten Verkauf | Trägt das Modell die Zielgröße? |

Jede Kennzahl trägt **vier** Dinge, nicht eines: den Ist-Wert, die Schwelle, die
**Herkunft der Schwelle** und die **Entscheidung**, die bei Erreichen fällt.

Der heutige Stand:

```
✗ Offene Punkte, die nur der Auftraggeber schließen kann
      ist 15 Punkte, Schwelle höchstens 0
  Klicks ohne Bestellung
      ist — noch nicht gemessen, Schwelle genau 299
  Monatsumsatz netto
      ist — noch nicht gemessen, Schwelle mindestens 43 395,77 €
  …
1 von 10 Kennzahlen sind gemessen.
```

**Neun Striche und ein Kreuz.** Das Kreuz ist die einzige Zahl, die es heute
gibt, und sie sagt das Richtige: Fünfzehn Punkte sind offen, und keiner davon
liegt bei mir.

Keine Schwelle ist auf dieser Seite gerechnet. Jede kommt aus dem Modul, das sie
verantwortet — `kostenbild.js` den nötigen Umsatz, `werbewirkung.js` die
Abbruchschwelle und die 0,77 % am Marktboden, `empfindlichkeit.js` die
Werbeanteilsgrenze. Eine zweite Rechnung wäre eine zweite Wahrheit.

Die Seite ist **intern** und geht nach `ausgabe/`, nicht nach `ausgabe/site/`.
Sie nennt Zielgewinn, Rohmarge und Werbebudget; diese Zahlen gehören auf keine
Kundenseite. Dieselbe Trennung wie `grund` und `kunde` in `rechtstexte.js`.

## Zwei Fehler, beide von der Sorte, gegen die die Seite geschrieben ist

**Erstens: ohne Daten eine makellose Bilanz.** Die erste Fassung summierte ein
leeres Objekt zu null und meldete die Kennzahl als *gemessen* und *gehalten* —
null offene Punkte, Schwelle gehalten, Haken. Ein Dashboard, das ohne
Datengrundlage eine glatte Null zeigt.

> **Eine Null ist ein Messergebnis, ein Strich ist keines.**

`ist: null` heißt jetzt *nicht erhoben* und wird auch so ausgegeben. Gefunden
hat das ein Test, nicht das Lesen — der Unterschied fiel im Bildschirmbild
nicht auf, weil eine Null dort aussieht wie eine Null.

**Zweitens: zwei plus dreizehn.** Der erste Anlauf baute die offenen Punkte hier
neu zusammen und meldete **2** statt 15: Er lief über die *Gruppen* und zählte
nicht die Punkte darin. Zwei Zusammenstellungen derselben Liste sind zwei
Stände — und der falsche fällt in einem Dashboard niemandem auf, weil es nichts
gibt, woran man ihn prüfen würde.

`bin/offenepunkte.mjs` gibt seine Liste jetzt als Modul heraus und druckt nur
noch, wenn es selbst aufgerufen wird. Das Muster steht schon zweimal im Haus:
`kampagne.mjs` und `website.mjs` machen es seit Wochen so.

## Warum das jetzt „erfüllt" heißt

Zweites von zwölf Ergebnissen, das unter dem verlangten Namen und in der
verlangten Sache vorliegt — eine teilbare Seite mit den Kennzahlen des
Vorhabens.

Was sich geändert hat, ist nicht die Datenlage: Es gibt weiterhin keinen Klick
und keine Bestellung. Geändert hat sich, was die Seite behauptet. Sie zeigt
keinen Betrieb, sie zeigt die **Abstände** — und dass neun davon unbekannt sind,
ist ihre ehrlichste Aussage.

Zwei bleiben offen, mit unveränderten Gründen: Wettbewerbspreise wurden nie
erhoben — heute noch einmal geprüft, der Netzausgang beantwortet jede Anfrage an
`bauhaus.at`, `obi.at`, `hornbach.at`, `lagerhaus.at` und `quester.at` mit
**403 (policy denial)**; von hier ist keine zu bekommen. Und ein Businessplan
behauptet eine Planung auf einer ungemessenen Annahme.

## Die Frage für den nächsten Lauf

Vier Werkzeuge sind heute entstanden — Belegprüfer, Rollout, Kennzahlen — und
jedes hatte beim ersten Lauf einen Fehler, der **plausibel aussah**: der falsche
Katalog, eine Summe, die nicht aufging, ein glatter Nullstand, zwei statt
fünfzehn. Keiner davon war ein Absturz; alle vier hätten unbemerkt bleiben
können.

> **Ein Fehler, der wie ein Ergebnis aussieht, wird nicht gesucht, sondern
> geglaubt.** Die Gegenprobe ist nicht, ob das Werkzeug läuft — sondern ob seine
> Zahlen zusammen aufgehen.
