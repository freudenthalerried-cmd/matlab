# Der LKW steht vor dem Tor

*Lauf vom 15. September 2026. Eine neue Wissensseite (85 Seiten, 17 im
Wissensteil), eine Messung, die kein Prüfer wurde, und eine Zeile, die aus
Geheimnisgründen **nicht** auf der Seite steht.*

---

## Zuerst die offene Frage der Vorrunde — und ihr Ende

Gestern blieb offen: *Gibt es Regelnamen, die nur in einem Testfall stehen und
im Bestand nicht mehr?* Ein bezeugter Name ohne Regel wäre ein toter Testfall,
der grün durchläuft und nichts hält.

Gemessen: **333 bezeugte Regelnamen an eindeutigen Stellen** — dort, wo eine
Zeichenkette wirklich als Regelname gelesen wird (`m.regel === '…'`,
`…map(m => m.regel), ['…']`, `regel: '…'`). Davon **13 ohne Entsprechung**.

Angesehen sind alle dreizehn:

- **acht** stehen in `test/regelnamen.test.js` und sind ausdrücklich erfunden —
  Attrappen für den Prüfer, der Regelnamen zählt. Für sie gibt es seit dem
  13. September das Verzeichnis `ERFUNDEN_GEPRUEFT`.
- **fünf** sind Fehltreffer **meiner Messung**: Sie entstehen als
  Fallunterscheidung — `regel: leicht ? 'leicht-und-sperrgut' : 'schwer-und-frei'`,
  `melde(roh === 0 ? 'rohe-uhr-im-beleg' : 'rohzahl-abgeloest', …)` —, und mein
  schnelles Muster las nur die einfache Form. `src/regelnamen.js` kennt die
  Fallunterscheidung seit dem 14. September und zählt sie richtig.

**Null echte Geisternamen.** Das ist ein Ergebnis und kein Nichtereignis: Die
Gegenrichtung des Zählers ist damit gemessen, und sie ist sauber. Ein Prüfer
daneben hätte 13 Meldungen produziert, von denen 13 falsch gewesen wären.

> **Zum vierten Mal in drei Tagen: Eine Messung wird erst dann ein Prüfer, wenn
> ihre Meldung für sich genommen richtig ist.**

Damit ist die Prüferkette an dieser Stelle zu Ende gedacht, und dieser Lauf
geht dorthin, wo seit fünf Runden nichts passiert ist: zum Inhalt.

## Die Lücke: was zwischen Absenden und Verarbeiten liegt

Der Auftraggeber hat „schreibe viel content" angeordnet. Die siebzehn
Wissensseiten decken inzwischen das Bauen ab (WDVS, Kaminzug, Kanal,
Untergrund, XPS/EPS, Verarbeitung bei Kälte) und das Kaufen (Baumeisterpreis,
Korb und Menge, Fracht, was nach dem Absenden passiert).

Dazwischen lag eine Lücke, und zwar die praktischste von allen: **Der LKW
kommt. Was jetzt?**

Das ist keine Nebensache. Dieser Shop hat kein eigenes Lager — geliefert wird
vom Lager des Lieferanten direkt auf die Baustelle, und zwar mit einem
Kran-LKW und nicht mit einem Paketdienst. Wer das zum ersten Mal bestellt,
weiß nicht, dass er eine tragfähige Zufahrt, einen ebenen befestigten
Abstellplatz und einen anwesenden Menschen mit Unterschrift braucht. Er
erfährt es, wenn der Fahrer anruft.

`was-die-baustelle-koennen-muss.md` beantwortet das in sechs Abschnitten:
Zufahrt, Abstellplatz, Abladen und Annehmen, was von Hand geht, die Paletten,
und wann geliefert wird. Dazu eine Liste zum Abhaken.

## Die Zeile, die nicht auf der Seite steht

Beim Schreiben lag die beste Zahl des Hauses griffbereit: Der Palettenkreis ist
über fünfzehn Rechnungen geschlossen, und er ergibt **13,47 € je Palette** —
Pfanddifferenz plus die belegte Rückführungsfahrt. Eine schöne, belegte,
überprüfbare Zahl.

Sie steht nicht auf der Seite, und sie darf nicht darauf stehen.

Palettenpfand, Hubpauschale und Retourfracht sind **Konditionen des
Lieferanten**. Sie liegen in `preise/`, das gitignoriert und vertraulich ist,
und sie gehören zur Einkaufsseite. Eine Kundenseite, die sie nennt, veröffentlicht
nicht eine Nebenkostenrechnung, sondern die Einkaufsbedingungen dieses
Betriebs — und aus zwei veröffentlichten Zahlen lässt sich die dritte
rekonstruieren. Genau davor warnt `pruefe-geheimnis` in seinem Schlusssatz.

> **Eine Zahl, die man belegen kann, ist noch keine Zahl, die man
> veröffentlichen darf.**

Die Seite sagt deshalb, was der Kunde tun muss (leere Paletten trocken und
auffindbar stellen) und warum es zählt — ohne einen einzigen Betrag.

Eine Zahl steht doch darauf: **25 kg**, das Gewicht eines Sacks. Sie ist keine
Kondition, sondern eine öffentliche Arbeitsschutzgröße, und sie trägt ihre
Quelle (AUVA-Merkblatt „Heben und Tragen von Lasten"). `pruefe-inhalte`
verlangt das absatzweise, und genau dafür ist die Regel da.

## Was der Prüferbestand beim Schreiben gefunden hat

Die Kurzfassung im Vorspann war **vier Sätze lang**. `test/website.test.js`
hält seit Wochen fest, dass eine Kurzfassung die Frage in zwei Sätzen
beantwortet — und hat sofort angeschlagen.

Das ist die Probe aufs Exempel für die letzten Runden: Ein Prüfer, der beim
Schreiben widerspricht, ist mehr wert als zehn, die beim Nachrechnen
bestätigen. Zwei Sätze stehen jetzt da, und sie sagen dasselbe.

Ebenso hat `pruefe-schaufenster` die Seitenzahl in der PR-Beschreibung
nachgezogen verlangt (84 → 85, Wissensseiten 16 → 17), an zwei Stellen, und
die Veröffentlichung nachgefordert. Beides erledigt.

## Was diese Seite nicht sagt — und warum

- **Die Lieferzeit in Tagen.** Sie ist beim Lieferanten nicht abgefragt. Eine
  Zahl zu schreiben, die niemand zugesagt hat, wäre eine Zusage auf Kosten des
  Kunden. Die Seite sagt das ausdrücklich, statt zu schweigen.
- **Ein Zeitfenster am Liefertag.** Der LKW fährt eine Tour; wo der Kunde auf
  ihr liegt, entscheidet sich am Morgen. Zugesagt wird der **Tag** und der
  Anruf des Fahrers — und dafür braucht es eine Telefonnummer in der Anfrage,
  unter der jemand auf der Baustelle erreichbar ist.
- **Ob jede Rückführung eine eigene Fahrt kostet.** Der eine Beleg vom 27. Juli
  sagt das nicht. Steht so in `src/palettenkreis.js` und bleibt eine
  Beobachtung.

## Die Frage für den nächsten Lauf

Die Seite verlangt vom Kunden eine Telefonnummer, unter der jemand auf der
Baustelle erreichbar ist — und das Bestellformular fragt sie ab. Ob es
**erklärt**, wofür, ist nicht nachgesehen. Ein Pflichtfeld ohne Grund wird
irgendwie ausgefüllt; ein Pflichtfeld mit einem Satz daneben wird richtig
ausgefüllt, und der Unterschied entscheidet, ob der Fahrer jemanden erreicht.
