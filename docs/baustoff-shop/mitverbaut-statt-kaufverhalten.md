# „Wird damit zusammen verbaut" — die Amazon-Zeile ohne die Amazon-Daten

**27. August 2026.** Weisung: ein Shop „wie Amazon", Schwerpunkt auf den
Produkten. Die wirksamste Zeile der großen Shops ist nicht die Suche und
nicht das Bild, sondern **„Wird oft zusammen gekauft"**. Sie beruht auf
Millionen Bestellungen.

Dieser Shop hat null Bestellungen gesehen. Damit gibt es drei Möglichkeiten,
und nur eine ist zulässig:

1. Die Zeile weglassen — das Bauteil bleibt unvollständig bestellt.
2. Etwas erfinden, das nach Statistik aussieht — genau die Angabe, die dieses
   Projekt sonst überall verweigert.
3. **Eine bessere Grundlage nehmen, die wir tatsächlich haben.**

## Die Grundlage: die Systemlisten

Vier Systemlisten sagen von Hand aufgeschrieben, welche Positionen ein
Bauteil ausmachen — mit Quelle, mit den Positionen, die der Shop *nicht*
führt. Wer den Perimeterkleber ansieht, braucht die Platte und die Pistole,
weil sie in derselben Liste stehen. Nicht, weil jemand sie zufällig
mitbestellt hat.

Das ist der Vorlage in einem Punkt überlegen: Kaufverhalten zeigt, was
zusammen im Korb lag, nicht, was zusammen an die Wand gehört. Ein Kunde, der
das Falsche mitbestellt, erzeugt bei Amazon eine Empfehlung.

Neu auf jeder Artikelseite mit Systemliste (32 von 46 Artikeln):

> **Wird damit zusammen verbaut** — die übrigen Positionen der Listen, in
> denen dieser Artikel steht, mit dem Satz dazu, woher der Vorschlag kommt.

Die Regel, die den Unterschied ausmacht, steht im Code und im Test:

> **Ein Artikel ohne Systemliste bekommt keinen Vorschlag.** Nicht die
> meistverkauften, nicht die aus derselben Gruppe, nicht „ähnliche Artikel".

Die 14 Artikel ohne Liste zeigen den Block deshalb gar nicht.

**Nebenwirkung, gleich mitgenommen:** Das bestehende Raster „Weitere Artikel
aus <Gruppe>" stand ohne Erklärung darunter und sah nach genau derselben
Zusage aus. Es hat jetzt einen Satz: *dasselbe Regal, nicht dasselbe
Bauteil.*

## Die Gegenprobe, die zuerst nicht griff

Der Kommentar über der Funktion sagt „keine Kappung — steht ein Artikel in
zwei Listen, werden beide vollständig gezeigt". Die erste Fassung der Tests
prüfte das nicht: Eine eingebaute Kappung auf vier Artikel lief durch **alle
fünf** neuen Tests, weil jeder Fall dort kürzer als vier war.

> **Eine Zusage, die keine Probe widerlegen kann, ist keine Zusage, sondern
> ein Kommentar.**

Zwei Tests kamen dazu: eine erfundene Liste mit neun Positionen, und der
Bestandsfall POS-21382 (Grundmauerschutzbahn, steht in Grundleitung *und*
Kellerwand, dreizehn Mitverbaute). Mit der Kappung fallen jetzt genau diese
zwei um, ohne sie sind alle grün. Gegengeprobt durch Mutation der Datei und
Rückkopie aus dem Scratchpad — nicht über `git checkout`.

Dazu eine Probe an den **gebauten Seiten**: Für jeden der 46 Artikel muss der
Block genau dann dastehen, wenn eine Systemliste ihn führt. Sie prüft die
Ausgabe, nicht das Modell — das ist der zweite Fehler, den dieses Projekt
wiederholt gemacht hat.

Und die 390-px-Rahmenprobe misst ab jetzt **POS-21382** statt POS-11082: die
Artikelseite mit dem längsten Kartenraster des Bestands. Eine Rahmenprobe am
kürzesten Fall beweist nichts über den längsten.

## Stand

- 695 Tests grün (vorher 687; +8)
- `pruefe-seiten`: 54 Seiten, **213** Fließtextabsätze (vorher 136 — der neue
  Absatz steht auf 46 Artikelseiten), 0 Verdachtsfälle
- `pruefe-inhalte` 24/355/0, `pruefe-widerrufe` 125 Dateien sauber,
  `pruefe-pruefer` 6 Prüfer mit Umfang
- `shopprobe` 23 Szenarien, `oberflaechenprobe` 11, Website 81 Seiten ohne
  toten Verweis

## Was das für die nächste Systemliste bedeutet

Der Wert dieses Blocks wächst mit der Zahl der Listen, nicht mit der Zahl der
Artikel: Jede neue Liste verknüpft ihre Positionen wechselseitig. Die 14
Artikel ohne Liste bleiben stumm, und das ist richtig so — sie werden es
bleiben, bis eine Artikelpreisliste das Sortiment so weit füllt, dass ihr
Bauteil vollständig wird. Diese Liste braucht die E-Mail an den Lieferanten,
und die gehört dem Auftraggeber.
