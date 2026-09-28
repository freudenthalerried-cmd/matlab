# Ein Artikel ohne Warengruppe ist nicht kaputt — er ist unauffindbar

**29. August 2026.** Der Importweg steht seit gestern. Was passiert, wenn die
Artikelliste des Lieferanten **keine Spalte `gruppe`** hat? Wahrscheinlich hat
sie keine — Webshop-Ausleitungen bringen Artikelnummer, Bezeichnung, Einheit
und Preis, seltener eine Warengruppe in unserer Einteilung.

Probiert statt vermutet: Zwei Artikel ohne Gruppe eingespielt.

**Der Import lief. Der Seitenbau lief. Nichts wurde gemeldet.** Die Artikel
lagen in einer Gruppe „Ohne Gruppe", die es als Seite nicht gibt — also
standen sie in keiner Sortimentsliste, in keiner Kachel, in keinem
Gruppenraster. Nur die Suche kannte sie.

> **Das ist schlimmer als ein toter Verweis, weil es niemandem auffällt.** Ein
> toter Verweis schreit; ein unauffindbarer Artikel schweigt.

Kein toter Verweis entstand übrigens deshalb, weil die Krume solcher Artikel
auf die Startseite ausweicht — eine freundliche Notlösung, die den Fehler
zudeckt.

## Drei Stellen, jetzt laut

1. **Der Seitenbau bricht ab.** Genauso wie bei einem toten Verweis, und mit
   derselben Begründung: Was ausgeliefert wird, muss auffindbar sein. Er nennt
   die Gruppe, die Artikelnummern und die zwei Auswege — einer vorhandenen
   Gruppe zuordnen oder eine Seite anlegen.
2. **Der Import sagt es vorher.** „N Artikel ohne Warengruppe … `npm run
   website` bricht deshalb ab." Besser hier gesagt als dort gescheitert.
3. **Der Name ist absichtlich sperrig.** „Ohne Gruppe" soll auffallen, nicht
   sich einfügen.

Gegengeprobt an beiden Enden: ein Artikel mit erfundener Gruppe im Katalog →
Bau bricht mit Code 1 ab; eine Liste ohne `gruppe`-Spalte → der Import meldet
es im Probelauf.

## Und noch eine Probe, die den Bestand festschrieb

Der Startklar-Test von gestern Abend erwartete wörtlich „46 von 46 Artikeln".
Beim Probeimport fiel er um — nicht weil etwas kaputt war, sondern weil der
Katalog gewachsen war. Das ist derselbe Fehler, den der Lastlauf gestern
fünfmal gefunden hat; er ist mir am selben Tag noch einmal unterlaufen.

**Jetzt relativ gezählt**: Die Probe liest die Artikelzahl aus dem Katalog und
prüft, dass das Werkzeug dieselbe nennt.

## Stand

779 Tests grün, `pruefe-tests` 778 / 0, `shopprobe` 34 Szenarien,
`pruefe-seiten` 58/263/0, Website 81 Seiten ohne toten Verweis.

## Was das für den Tag der Lieferung heißt

Wenn die Artikelliste ohne Warengruppen kommt — und damit ist zu rechnen —
gibt es zwei Wege, und beide sind Arbeit von Hand:

- Die Artikel den sieben bestehenden Gruppen zuordnen, notfalls über die
  Artikelbezeichnung.
- Für neue Sortimentsteile eigene Gruppenseiten anlegen, so wie die sieben
  vorhandenen: mit Frage, Kurzfassung und einem Text, der etwas sagt.

**Das zweite ist die ehrlichere Antwort auf „mindestens hundert Artikel":**
Hundert Artikel in sieben Gruppen sind ein Sortiment; hundert Artikel ohne
Gruppe sind eine Datei.
