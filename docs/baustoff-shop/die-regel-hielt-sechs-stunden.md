# Die Regel hielt sechs Stunden

**3. September 2026.** Um kurz nach fünf Uhr früh ist in `PARAMETER.md` ein
Satz gelandet:

> Diese Tafel ist ab jetzt der Ort, an dem eine Weisung des Auftraggebers als
> Erstes landet.

Er stand dort als Lehre aus der Domainweisung vom 31. August, die drei Tage
lang im Code angekommen und im Verzeichnis unsichtbar war. Um kurz nach neun
kam die nächste Weisung — der Shop soll als **Bauversand** auftreten — und sie
landete in `data/betreiber.json`, im Bauwerkzeug, in den Belegen, in den
strukturierten Daten und im Impressum.

**Nicht in der Weisungstafel.**

> **Eine Regel, für die es keine Messung gibt, hält bis zum nächsten Fall.**

Der Unterschied zwischen den beiden Angaben ist nicht Sorgfalt, sondern ein
Testfall. Für die Adresse gab es seit dem Morgen einen: *Die oberste Tafel
nennt den Hostnamen, unter dem gebaut wird.* Für den Namen gab es keinen — und
genau der fehlte dann.

## Aus einem Sonderfall wird eine Liste

Der Testfall prüfte eine Angabe, weil eine Angabe der Anlass war. Jetzt prüft
er eine **Liste mit Gründen**, nach demselben Muster wie das
Widerrufsregister, das Gegenprobenregister und die Fragen an den Lieferanten:

| Angabe | Warum sie in die oberste Tafel gehört |
|---|---|
| `domain` | Steht in Verweisen, Sitemap, `llms.txt` und den finalen URLs der Anzeigen — eine falsche kostet jeden Klick |
| `marke` | Logo, Seitentitel, Absender jedes Kundenbelegs, jede Organisation der Auszeichnung. Vier Fundstellen an einem Tag, keine davon in der Tafel |

Wer eine dritte Auftrittsangabe einführt, trägt sie ein — und merkt beim
Schreiben des Grundes, ob es eine ist. Das ist der eigentliche Zweck des
Pflichtfelds: Eine Liste ohne Begründungszwang wächst, bis sie nichts mehr
aussagt.

Der Testfall war rot, bevor die Zeile geschrieben war. So gehört es:

```
✗ die oberste Tafel nennt jede Angabe, unter der der Shop auftritt
    diese Angaben verwendet der Bau, und die oberste Tafel kennt sie nicht
    + 'marke = „Bauversand"'
```

## Ein zweiter Befund, und der betrifft mein eigenes Vorgehen

Der Widerrufsprüfer hat beim Testlauf dieser Runde eine Stelle im Dokument der
**vorigen** Runde gemeldet — „auf jedem Beleg", eine am 27. August
zurückgenommene Aussage über die Frachtbelege des Lieferanten. Gemeint war
etwas anderes (der Kundenbeleg), aber der Prüfer kann das nicht wissen, und
genau deshalb ist er eng gefasst.

Warum er es erst jetzt gemeldet hat, ist der interessantere Teil. Der Ablauf
jeder Runde war:

1. Änderung bauen und prüfen
2. **`npm run alles` starten**
3. während der Lauf läuft, das Dokument schreiben
4. Ergebnis lesen, committen

Schritt 3 liegt hinter Schritt 2. **Der Gesamtlauf hat das Dokument nie
gesehen, das im selben Commit steht.** Vier Runden lang ist das gutgegangen,
weil die Dokumente nichts enthielten, was ein Prüfer beanstandet; beim fünften
enthielt eines eine widerrufene Wendung, und sie stand eine Stunde lang im
Verzeichnis.

> **Wer prüft, während er noch schreibt, prüft den Stand von vorhin.**

Die Reihenfolge ist ab sofort: erst das Dokument, dann der Gesamtlauf, dann der
Commit. Das kostet die Wartezeit, die vorher parallel lief — und es ist derselbe
Fehler, den dieses Vorhaben schon an drei Werkzeugen gefunden hat: `pruefe-seiten`
prüft die gebauten Seiten, nicht die Quelle; die Wegprobe geht durch den
gebauten Shop; die Gegenproben bauen zwischendurch neu. Jedes Mal war die Lehre
dieselbe, und jedes Mal ging es um Werkzeuge. Diesmal ging es um mich.

## Geprüft

- Der erweiterte Testfall in `test/parameter.test.js` hält jede Angabe der
  Liste gegen den Text von `PARAMETER.md`. Er war rot, bevor die Weisung
  eingetragen war — die Gegenprobe hat also der Anlass selbst geliefert.
- Der zweite Testfall derselben Datei (Stand nicht älter als die jüngste
  Weisungszeile) hat die neue Zeile mitgenommen: Der Stand steht ohnehin auf
  dem 3. September.
- `npm run pruefe-widerrufe` ist wieder grün, nachdem die Wendung im Dokument
  der vorigen Runde berichtigt ist.
