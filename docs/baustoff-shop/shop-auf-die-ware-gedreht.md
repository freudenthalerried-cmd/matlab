# Vier Rückmeldungen, vier Antworten — und eine, die nicht mir gehört

Stand: 2026-08-27. Der Auftraggeber hat den gebauten Shop angesehen und
vier Dinge zurückgemeldet:

> **„links gehen teilweise nichts, mehr bilder und wissen eher versteckter
> eher auf die produkte konzentrieren und viel mehr"**

Drei davon sind erledigt. Die vierte hat eine Grenze, die keine
Fleißaufgabe ist.

## 1. „links gehen teilweise nichts" — 41 tote Verweise, und der Bau hat sie nicht gesehen

Der Befund ist schlimmer als die Meldung. **In der Mehrseitenfassung ging
jeder Verweis aus einem Seitenkörper ins Leere** — 41 Stück, quer über
Wissens-, Gruppen- und Systemseiten.

Der Quelltext schreibt logische Kennungen: `[Grundlage](xps-oder-eps)`,
`[Lieferung](../lieferung)`. Der Renderer hat sie unverändert als `href`
ausgegeben. Ohne `.html` zeigt das auf nichts.

**Und der Bau hat „kein toter Link" gemeldet, während es passierte.** Die
bestehende Prüfung liest den Markdown-Quelltext, löst jeden Verweis zu
einer Kennung auf und prüft, ob es die Seite gibt. Das tat sie korrekt.
Nur wird die Kennung nie ausgegeben — ausgegeben wird eine Adresse.

> **Eine Prüfung, die das Modell liest statt die Ausgabe, prüft die eigene
> Absicht.** Sie kann nicht scheitern, solange die Absicht stimmt, und
> genau deshalb hat sie hier nichts gemerkt.

Behoben an zwei Stellen, und die zweite ist die wichtigere:

1. `markdown.js` übersetzt innere Verweise jetzt in die Adressform der
   jeweiligen Ausgabe — Datei mit `.html`, Einzeldatei mit Raute.
2. **Eine zweite Prüfung liest die fertigen `href`-Werte** und löst sie
   aus der Sicht der Seite auf, auf der sie stehen — `../artikel/X.html`
   bedeutet auf einer Wissensseite etwas anderes als auf der Startseite.
   Wer sie ins Leere zeigen lässt, bekommt keine Ausgabe.

Gegenprobe: Übersetzung entfernt → der Bau verweigert mit 82 Meldungen
(41 je Ausgabefassung).

## 2. „mehr bilder" — gezeichnet, nicht beschafft

Der Shop hatte **kein einziges Bild**. Der naheliegende Weg wäre, Fotos
beim Hersteller zu holen; er ist doppelt versperrt, und der zweite Grund
wiegt schwerer:

| | |
|---|---|
| technisch | `baumit.at`, `schiedel.at`, `isover.at`, `synthesa.at` sind vom Netzausgang gesperrt |
| **rechtlich** | **Ein Herstellerfoto ist ein fremdes Werk.** Es ohne Lizenz einzustellen, ist dieselbe Verletzung wie ein abgeschriebenes Datenblatt |

Deshalb zeichnet der Shop selbst: `src/bilder.js` erzeugt zu jedem
Artikel ein **Schema aus dessen eigenen Daten** — Warengruppe, Einheit und
die Maße, die in der Bezeichnung stehen. Vierzehn Bauformen: Platte, Sack,
Rohr, Bogen, Abzweiger, Schachtring, Stein, Rolle, Profil, Dübel,
Kartusche, Haube, Werkzeug, Bauteil.

**Die Maße werden gezeichnet, nicht nur beschriftet.** Eine 10-cm-Platte
ist dicker als eine 2-cm-Platte; ein 30°-Bogen steigt flacher als ein
45°-Bogen. Zwei Testfälle halten genau das fest — sonst wäre es
Dekoration.

> **Ein Schema ist ehrlicher als ein Foto, das nicht diesen Artikel
> zeigt.** Es behauptet keine Oberfläche, keine Farbe und keine Marke — es
> zeigt Bauform und Maß, und beides steht im Datensatz.

Die Zeichnungen sind reines SVG ohne Fremdmittel, nehmen ihre Farben aus
den Tokens der Seite (heller und dunkler Anstrich ohne zweite Fassung) und
tragen eine Textbeschreibung für Vorleseprogramme.

## 3. „wissen eher versteckter, eher auf die produkte konzentrieren"

Vorher stand in der Kopfleiste: vier von sieben Warengruppen, dazwischen
**Wissen**, dahinter **Rechtliches**. Auf der Startseite kamen zuerst die
Systemlisten, dann das Sortiment, dann vierzehn Wissenskacheln.

**Ein Baustoffhändler, dessen Hauptnavigation zu einem Drittel aus
Aufsätzen besteht, sieht aus wie ein Blog mit Preisliste.**

| | vorher | jetzt |
|---|---|---|
| Kopfleiste | 4 Gruppen, Wissen, Lieferung, Rechtliches | **alle 7 Warengruppen**, Lieferung |
| Startseite, oben | Systemlisten | **Sortiment, nach Artikelzahl sortiert** |
| Startseite, Mitte | Sortimentskacheln | **alle 46 Artikel als Raster, mit Bild und Preis** |
| Wissen | 14 Kacheln auf der Startseite | **eine Zeile**, verlinkt auf die Übersicht |
| Gruppenseiten | Fachtext, Artikel darunter | **Artikel direkt nach dem Einleitungssatz** |
| Wissen und Rechtliches | Kopfleiste | Fuß und Startseitenzeile |

Die Wissensseiten sind **nicht gelöscht**. Sie tragen die
KI-Sichtbarkeit — das ist der Kanal, für den dieser Shop gebaut ist —, und
eine Suchmaschine findet sie über Sitemap und `llms.txt` unverändert. Sie
stehen nur nicht mehr im Weg des Kunden, der einen Sack Klebespachtel
sucht.

## 4. „viel mehr" — hier ist die Grenze, und sie ist keine Fleißaufgabe

**Der Katalog ist bereits am Ende dessen, was belegbar ist.** Heute
nachgezählt, nicht erinnert:

| | |
|---|---|
| Rechnungen von Poschacher im Postfach | **genau 15**, 22.04. bis 17.08.2026 |
| Positionen darin | 70 |
| eindeutige Artikelnummern | 53 |
| davon **keine Ware** | 7 — Frachtpauschale, Kranentladung, Energiekostenzuschlag, Folierung, Paletten |
| **im Katalog** | **46** |

**Es ist nichts übrig geblieben.** Die sieben fehlenden Nummern sind
Nebenkosten und gehören nicht ins Sortiment. Wer aus diesen Belegen mehr
als 46 Artikel macht, erfindet Preise.

### Was den Katalog wirklich vergrößern würde

| Weg | Ertrag | Hindernis |
|---|---|---|
| **Artikelpreisliste bei Poschacher anfordern** | das ganze Lieferprogramm statt 46 zufälliger Positionen | **eine E-Mail an Dritte — freigabepflichtig** |
| weitere Rechnungen abwarten | rund **2 Rechnungen im Monat**, geschätzt 5–8 neue Artikel | Zeit; wächst mit dem eigenen Baugeschäft |
| Lagerhaus Eferding | 72 Seiten Konditionen, alle sechs Warengruppen | **Rabattsätze ohne Werkspreisliste sind keine Preise** (`lagerhaus-rabatte-gelesen.md`) |
| Schachermayer | eine Rechnung vom 12.08. im Postfach, Beschlag und Werkzeug | ein einzelner Beleg; anderes Sortiment als der Shop |

> **Der Katalog ist nicht klein, weil zu wenig gearbeitet wurde. Er ist
> klein, weil er nur enthält, was auf einer bezahlten Rechnung steht.**
> Das war von Anfang an die Bedingung — jeder Preis bestätigt, keiner
> geschätzt. Sie zu lockern hieße, den einzigen Vorteil aufzugeben, den
> dieser Shop gegenüber jedem Baumarkt hat.

Die erste Zeile der Tabelle ist der Hebel, und sie ist die einzige, die
**heute** wirkt. Sie setzt eine E-Mail an den Lieferanten voraus und
bleibt deshalb beim Auftraggeber: *„Bitte um die aktuelle
Artikelpreisliste zu unseren Konditionen."* Ein Satz, ein Anhang, und der
Katalog wächst um eine Größenordnung statt um sechs Artikel im Monat.

## Stand

| | |
|---|---|
| Seiten | 77 (46 Artikel, 14 Wissen, 7 Gruppen, 5 Rechtliches, 3 System, 2 Stamm) |
| tote Verweise | 0 in beiden Ausgabefassungen, jetzt an der Adresse geprüft |
| Bilder | 46 Artikelschemata, 7 Gruppensinnbilder, 0 fremde Werke |
| Testfälle | 642 grün, davon 7 neue für die Zeichnungen |
| Oberflächenproben | 11 grün |
| Interna auf Kundenseiten | keine, drei begründete Ausnahmen |

Offen bleibt, was schon offen war: Zahlungsanbieter, vier Impressumfelder,
Domain — und die Frage aus
[`interna-auf-der-kundenseite.md`](./interna-auf-der-kundenseite.md), ob
die Handelsspanne von 25 % öffentlich genannt bleibt.
