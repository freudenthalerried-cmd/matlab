# Sechs von sechs Anzeigen warben mit Paletten. Der Katalog hat keine.

**1. September 2026.** Nach dem Liefergebiet die nächste Frage an dieselbe
Kette: Was verspricht die Anzeige, und sagt die Landeseite dasselbe?

Zwei Befunde, und der zweite ist der teurere.

## Befund 1 — bezahlte Wörter, die auf der Seite nicht vorkommen

Für jedes Keyword des ersten Anlaufs geprüft, ob seine Wörter im
Hauptbereich der Landeseite stehen:

```
36 verschiedene Keywords, 14 finden auf der Landeseite nicht alle ihre Wörter
  WDVS      Armierungsgewebe          fehlt: armierungsgewebe
  WDVS      Armierungsmörtel          fehlt: armierungsmörtel
  WDVS      Fassadendübel             fehlt: fassadendübel
  WDVS      WDVS Kleber               fehlt: kleber
  WDVS      WDVS System kaufen        fehlt: kaufen
  Dämmung   EPS Fassadenplatten       fehlt: fassadenplatten
  Dämmung   Perimeterdämmung druckfest fehlt: druckfest
  Kamin     Kaminrohr gedämmt         fehlt: kaminrohr
  Kamin     Kaminkopf Regenhaube      fehlt: kaminkopf
  Kamin     Schornstein Bausatz       fehlt: schornstein, bausatz
  …
```

Wer „Armierungsgewebe" sucht, bezahlt den Klick und landet auf einer Seite,
die durchgehend „Glasgewebe" sagt. **Dieselbe Ware, ein anderes Wort.** Am Bau
hat jede Position zwei Namen: den des Herstellers und den des
Leistungsverzeichnisses. Der Shop führte nur den ersten.

Das kostet zweimal — den Klick, der sofort zurückspringt, und die
Anzeigenrelevanz, die Google aus genau diesem Abgleich bildet.

### Und ein Wort, das gar nichts mit Ware zu tun hat

`WDVS System kaufen` und `XPS Platten kaufen` fielen durch, weil das Wort
„kaufen" auf keiner Gruppenseite steht. Nachgezählt im Hauptbereich von
`gruppe/wdvs.html`:

```
warenkorb    0x
bestell      0x
kauf         0x
anfrage      0x
angebot      0x
```

Eine Seite, auf die Werbebudget zeigt, und **kein einziges Wort darüber, wie
man hier etwas bestellt.** Der Weg existierte — jede Artikelkarte führt auf
die Artikelseite mit dem Warenkorbknopf —, er war nur nirgends gesagt.

## Befund 2 — das Gebinde, das es nicht gibt

Beim Nachlesen der Anzeigentexte:

> „Dämmplatten palettenweise" · „Ganze Paletten statt Einzelplatten, direkt
> auf die Baustelle." · „Wir liefern Paletten, keine Einzelsäcke — das ist der
> ganze Preisvorteil." · „Planziegel ab Palette" · „Systemware auf Palette"

**Kein einziger der 46 Artikel wird palettenweise verkauft.** Die Einheiten
des Katalogs sind STK (18), M2 (12), KG (5), KRT (3), SCK (2), LFM (2),
DOS (2), EIM (1), RLL (1). Das Wort „Palette" steht in `data/` genau einmal,
und zwar als **Kostenposition des Lieferanten**: 132,00 € für sechs Paletten
auf einem Beleg. Nebenkosten, keine Verkaufseinheit.

Zwei Sätze gehen sogar in die Gegenrichtung:

| Anzeige | Katalog |
|---|---|
| „Kein Sackverkauf" | zwei Artikel in **Sack** |
| „Ganze Paletten … statt Stückware" | achtzehn Artikel in **Stück** |

Die Anzeigen beschrieben einen anderen Shop als den dahinter. Dieselbe
Familie wie „ab Lager" bei einem Betrieb ohne Lager — nur eine Ebene tiefer:
Nicht die Verfügbarkeit war erfunden, sondern das Gebinde.

Und es war die *tragende* Aussage: „Wir liefern Paletten, keine Einzelsäcke —
**das ist der ganze Preisvorteil**." Der Preisvorteil dieses Shops kommt aus
dem Einkauf des Auftraggebers, nicht aus der Bestellmenge. Der Satz erklärte
den Vorteil mit einer Ursache, die es nicht gibt.

## Was jetzt gilt

**Regel, in `kampagne.mjs` verankert:** *Wir bieten nur auf Wörter, die wir
auch sagen.*

Kein Ausnahmenverzeichnis für „Absichtswörter" wie „kaufen". Ein Shop, dessen
Seite nirgends „kaufen" sagt, hat ein Seitenproblem und kein Regelproblem —
und ein Ausnahmenverzeichnis wäre die Stelle, an der später jedes unbequeme
Wort landet.

| Fund | Entschieden |
|---|---|
| Armierungsmörtel, Armierungsgewebe, Fassadendübel, Kleber | Tabelle „Wie diese Positionen in der Ausschreibung heißen" auf `wdvs.md` |
| EPS-Fassadenplatten, Fassadendämmung, druckfest | Tabelle „Wie diese Platten sonst noch heißen" auf `daemmung.md` |
| Kaminrohr, Kaminkopf | Tabelle „Wie die Teile am Bau heißen" auf `kamin.md` |
| kaufen, bestellen | Abschnitt „So bestellen Sie hier" auf allen drei Landeseiten |
| `Schornstein Bausatz` | **gestrichen** — „Schornstein" ist nicht das Wort dieses Liefergebiets, und ein Bausatz ist bei uns eine Systemliste, kein Artikel |
| `Fassadendämmung Material` unter WDVS | **verschoben** zu Dämmung — die Platten stehen dort, nicht bei den Systemkomponenten |
| `Dämmplatten palettenweise`, `XPS Palette` | **gestrichen** — der Shop liefert in Paketeinheiten |
| alle Palettenaussagen der sechs Anzeigengruppen | umgeschrieben auf das, was belegt ist: Lieferung auf die Baustelle, Kranentladung, getrennt ausgewiesene Fracht, Baumeisterpreis |

Die Ergänzungen sind keine Suchwortfüllung: Die rechte Spalte jeder Tabelle
sagt ausdrücklich, dass sie **Sprachgebrauch** ist und keine
Produktzuordnung — welches Produkt wofür freigegeben ist, steht im Merkblatt
des Herstellers.

Zwei neue Wachen:

1. **Deckungsprüfung.** `kampagne.mjs` liest zu jedem Keyword die gebaute
   Landeseite und hält zurück, was sie nicht sagt. Fehlt die gebaute Seite,
   bricht das Werkzeug ab, statt eine Prüfung ohne Gegenstand als bestanden zu
   melden.
2. **Gebindeprüfung.** `GEBINDEAUSSAGEN` in `pruefeTexte` schlägt in beide
   Richtungen an: ein beworbenes Gebinde, das kein Artikel führt, und ein
   ausgeschlossenes, das der Katalog sehr wohl hat. Geprüft wird gegen die
   Einheiten des Katalogs, nicht gegen eine Liste — nimmt der Shop einmal
   Palettenware auf, hört die Regel von selbst auf zu schlagen.
   `pruefeTexte` **wirft** ohne Einheiten, statt eine Voreinstellung zu
   nehmen: Eine Voreinstellung wäre die Stelle, an der ein Aufrufer die Regel
   stillschweigend überspringt.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| „Ganze Paletten statt Einzelplatten" zurück in die Anzeige | ja — 1 rot |
| Palettenregel aus `GEBINDEAUSSAGEN` gestrichen | ja — 1 rot |
| „Armierungsgewebe" von der WDVS-Seite genommen | erst nach Nachschärfen |
| Deckungsfilter auf `fehlt.length >= 0` gestellt | nein — heute verhaltensgleich |

Die dritte Zeile ist der interessante Fall. Das Werkzeug **heilt sich selbst**:
Nimmt man das Wort von der Seite, hält es das Keyword zurück, und
`keywords.csv` bleibt in sich stimmig. Die Probe sah nichts, weil nichts
Falsches ausgeliefert wurde — die Kampagne war nur stillschweigend kleiner
geworden.

> **Zurückhalten ist die Notbremse, nicht der Normalzustand.**

Nachgeschärft mit der Forderung, dass `keywords-ohne-deckung.csv` **leer**
ist. Jedes zurückgehaltene Keyword ist eine offene Entscheidung, keine
Betriebsart.

Die vierte Zeile ist kein Loch: Solange kein Keyword ungedeckt ist, ändert der
kaputte Filter nichts. Zusammen mit Mutation 3 schlägt er sofort an. Das
Werkzeug kann „unbemerkt" nicht von „verhaltensgleich" unterscheiden — das
muss ich lesen, nicht es.

## Stand

- 1.049 Tests, 0 rot (vorher 1.043); alle Prüfer grün
- Keywords: 102 statt 108, davon **0 zurückgehalten** (vorher 14 ungedeckt)
- Anzeigentexte: sechs Gruppen ohne Gebindebehauptung
- Kampagnen weiterhin auf **PAUSIERT** — das Schalten löst Ausgaben aus

Nichts an diesem Lauf löst Ausgaben aus.
