# Der Inhaltsprüfer zeigte auf die Probedatei — vier Monate lang

Stand: 2026-08-27. `npm run pruefe-inhalte` meldete den ganzen Tag brav
seine Zeile:

```
1 Dateien, 15 Absätze geprüft, 7 mit Verdacht.
```

Sie sieht aus wie ein Durchlauf über den Shop. Sie war ein Durchlauf über
**eine Probedatei mit absichtlich falschen Absätzen** — der Selbstnachweis
des Werkzeugs, dass es die Muster findet, die es zu finden behauptet.

> **Ein Prüfer, dessen Voreinstellung nicht auf den Bestand zeigt, wird mit
> der Voreinstellung aufgerufen.** Der Selbstnachweis war richtig gedacht
> und als Normalfall falsch: Er stand da, wo die eigentliche Prüfung hätte
> stehen müssen.

## Die gute Nachricht zuerst

Über den echten Bestand laufen lassen: **23 Seiten, 334 Absätze, null
Verdacht.** Die Inhalte sind sauber; sie waren es auch, wenn frühere Läufe
den Ordner ausdrücklich angegeben haben. Der Fehler lag in der Bequemlichkeit
des Aufrufs, nicht in den Texten.

Jetzt prüft der Aufruf ohne Argument alle drei Inhaltsordner. Der
Selbstnachweis bleibt erhalten und heißt `--probe`.

## Die schlechte: die Hälfte des Textes war nie geprüft

Beim Nachsehen fiel auf, was der Prüfer **nie** gesehen hat: Rund die
Hälfte des Textes im Shop steht nicht in `inhalte/`, sondern im
Seitenbauwerkzeug — Startseite, Lieferung, Rechtstexte, Artikelseiten,
Warenkorb- und Kassenhinweise. Der Text behauptet dieselben Dinge und
unterliegt denselben Regeln.

Neuer Modus: `npm run pruefe-seiten`. **54 Seiten, 136 Fließtextabsätze.**

### Drei Anläufe, bis die Prüfung das Richtige las

**Erster Anlauf: alles.** 543 Absätze, 84 Treffer — fast alle aus
Artikelbezeichnungen („Capatect Glasgewebe M, Breite 110cm") und
Tabellenzellen.

> **Eine Prüfung, die jeden Text als Aussage liest, meldet jeden
> Artikelnamen als Behauptung.**

**Zweiter Anlauf: nur Fließtext.** Schon besser, aber immer noch Treffer
aus zwei Quellen, die beide nicht der Seite anzulasten sind:

| | |
|---|---|
| Markierungsstreifen | „81 % unter Listenpreis" ist ein Etikett, kein Satz |
| Verweise | `<a href="…">Mengen für 100 m² Fassade</a>` verlor beim Entkleiden seinen Verweis — **die Zahl verlor ihre Quelle allein dadurch, dass sie gerendert wurde** |

Der Verweis wird jetzt zurückverwandelt (`[Text](Ziel)`), bevor geprüft
wird. Die Regeln erkennen ihn in dieser Form.

**Dritter Anlauf: Seiten aus `inhalte/` ausgenommen.** Sie sind an der
Quelle geprüft, und dort stehen auch die **begründeten Ausnahmen**
(`<!-- pruefung: begruendet — … -->`). Die überleben das Rendern nicht;
die Seitenprüfung meldete deshalb genau das wieder, was am Quelltext
längst abgehandelt war — etwa das absichtliche „Nach ÖNORM" auf der Seite
über die Redaktionsprinzipien, das dort als **Beispiel für einen Fehler**
steht.

### Und ein Fehler im Prüfer selbst

Ein gemeldeter „Absatz" bestand aus Pfaddaten und Preisen:

```
25 kg Netto 2,27 € je kg … Artikelnummer 19333
```

Ursache: Das Muster `<p([^>]*)>` trifft auch **`<path …>`** in den
SVG-Zeichnungen und schluckt dann alles bis zum nächsten `</p>`. Ein
Lehrbuchfall — behoben mit einer Wortgrenze (`<p>` oder `<p ` mit
Leerzeichen).

## Was übrig blieb: zwei echte Funde

Nach den drei Kalibrierungen meldete der Prüfer **zwei** Stellen, und
beide waren berechtigt.

### Die Startseite nannte die Handelsspanne ohne Stand

> Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — zuzüglich einer
> **Handelsspanne von 25 %**.

Eine Zahl ohne Stand, im ersten Satz der Startseite. Nach der eigenen
Regel braucht jede Zahl Herkunft und Stand; die Herkunft steht im Satz
selbst, der Stand fehlte. Jetzt: *„…von 25 %. Alle Preise Stand:
2026-08-17."* — der jüngste Preisstand aus dem Katalog, nicht eine
eingetippte Zahl.

**Nebenbei die ehrlichere Fassung:** Der Satz behauptet einen Preisvorteil.
Ohne Datum ist er in vier Wochen möglicherweise falsch, und niemand merkt
es.

### Die Datenschutzseite verwies auf eine Pflicht, die eine Zeile höher stand

> Das ist keine Erfüllung **der Pflicht** durch den Shop, sondern ihre
> Verlagerung…

Welche Pflicht, steht im Absatz darüber: Artikel 14 DSGVO. Für einen
Leser, der von oben liest, genügt das. Für jeden, der den Absatz zitiert,
kopiert oder per Suche findet, nicht.

Das ist derselbe Befund wie am Vortag bei der Gefälletabelle in
`norm-b2501-und-die-falsche-norm.md`: **Die Fundstelle muss an der
Aussage kleben, nicht in der Nähe liegen.** Der Absatz nennt die Norm
jetzt selbst.

## Stand

| | |
|---|---|
| `npm run pruefe-inhalte` | **23 Seiten, 334 Absätze, 0 Verdacht** — statt einer Probedatei |
| `npm run pruefe-seiten` | **54 Seiten, 136 Absätze, 0 Verdacht** — neu, war nie geprüft |
| `node bin/inhaltspruefung.mjs --probe` | der Selbstnachweis, 7 Treffer wie eh und je |
| Testfälle | 683 grün, davon 2 neue: die Voreinstellung muss auf den Bestand zeigen, und `--seiten` muss mehr als hundert Absätze finden |

Die beiden neuen Testfälle sind gegen genau diesen Fehler gerichtet: Der
eine schlägt fehl, wenn die Voreinstellung wieder auf eine einzelne Datei
zeigt; der andere, wenn die Seitenprüfung nichts mehr findet, weil ein
Filter zu scharf geworden ist.

> Beide prüfen nicht, ob der Prüfer schweigt, sondern **ob er überhaupt
> etwas angesehen hat.** Das ist die Lehre des Tages, zum vierten Mal.
