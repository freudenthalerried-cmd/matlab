# Paketdienste für kleine Einheiten — was sie könnten und was im Weg steht

Stand: 2026-08-27. Auftrag des Auftraggebers: *„schaue ob es
paketdienstleister gibt die den versand für kleinere Einheiten erledigen
würden"*. Die Frage trifft die teuerste Schwachstelle des Modells.

## Warum die Frage die richtige ist

Der Katalog hängt an einer Frachtpauschale von **75,50 € je Lieferung,
ohne Frei-Haus-Schwelle**. Daraus folgt alles Unangenehme:

| | |
|---|---|
| Nulldurchgangsschwelle | **332 €** Warenwert, bevor eine Bestellung ihre Fracht trägt (Gate 20) |
| mit dem Lagerhaus-Kleintransporter (41,66 €) | 167 € — halbiert, aber immer noch hoch |
| Gate 22 | drei Artikel sind **Beipack**, weil bei Kleinteilen kein Vorteil bleibt |

**Ein Kunde, der zwei Kartuschen Kleber braucht, kann hier nicht kaufen.**
Nicht wegen des Preises, sondern wegen der Fracht.

## Was die Recherche ergeben hat

| Dienst | Höchstgewicht | Maße | Tarif |
|---|---|---|---|
| **Österreichische Post**, Geschäftskunden | 31,5 kg | 100 × 60 × 60 cm | **6,32 €** bis 1 kg … **20,78 €** bis 31,5 kg, plus Lkw-Maut 0,29–0,35 € |
| **GLS Österreich** | **40 kg** | bis 200 cm Länge, 80 × 60 cm | ab 3,90 € |
| **DPD Österreich** | 31,5 kg | bis 175 cm Länge | Geschäftstarif auf Anfrage |

Sperrgutzuschläge der Post: **kleines Sperrgut 4,00 € netto / 4,80 €
brutto**, **großes Sperrgut 20,00 / 24,00 €**. Geschäftskonditionen
beginnen bei der Post **ab 5 Sendungen im Monat**, bei GLS ab 250 im Jahr.

Bis 10 kg sind die Posttarife Teil des Universaldiensts und
**umsatzsteuerfrei**; darüber sind es Bruttobeträge inklusive 20 %.

### Die Zahl, um die es geht

Ein 25-kg-Sack Klebespachtel wiegt genau das, was ein Paket tragen darf.

| Weg | Fracht |
|---|---|
| Poschacher-Pauschale | **75,50 €** |
| Post-Paket bis 31,5 kg | **rund 21 €** |
| GLS, dieselbe Sendung | vermutlich darunter |

> **Der Unterschied ist nicht ein Prozentsatz, sondern eine
> Größenordnung.** Eine Bestellung über zwei Säcke trägt sich mit einem
> Paket; mit der Pauschale trägt sie sich nicht.

## Drei Vorbehalte, und der dritte ist der ernste

### 1. Die Zahlen sind Hinweise, keine Fundstellen

`post.at`, `wko.at` und `paketcheck.at` sind vom Netzausgang dieser
Umgebung **gesperrt**. Die Tarife oben stammen aus Suchergebnis-Auszügen,
nicht von den Seiten der Dienste selbst.

Nach dem eigenen Quellenregister (`videos-als-quelle.md`) ist das die
Stufe **Hinweis**: Es sagt, wonach zu suchen ist, und trägt keine
Kalkulation. **Bevor eine dieser Zahlen in Gate 20 einfließt, gehört sie
beim Dienst bestätigt.**

### 2. Der Katalog kennt kein Gewicht

Ob ein Artikel paketfähig ist, entscheidet sich an Gewicht und Maß. Der
Katalog führt **beides nicht**:

| Feld | Stand |
|---|---|
| `gewichtKg` | **existiert nicht** |
| `sperrgut` | vorhanden, aber bei **allen 46 Artikeln** `sperrgutQuelle: "eingeschaetzt"` |

**Damit ist die Paketfähigkeit heute nicht berechenbar, sondern nur
erratbar** — und Raten ist genau das, was dieses Vorhaben an zwanzig
Stellen als Fehlerquelle aufgeschrieben hat. Ein Sack „25 kg" trägt sein
Gewicht im Namen; eine Palette EPS nicht.

Die Gewichte stehen auf den Lieferscheinen und in den Werksunterlagen.
Sie zu erfassen ist Arbeit ohne Anfrage an Dritte — und die Voraussetzung
für jede Rechnung mit Paketfracht.

### 3. Im Streckengeschäft hat niemand das Paket in der Hand

Das ist der Haken, den die Tariftabelle nicht zeigt.

> **Der Shop liefert im Streckengeschäft: Der Lieferant verlädt, der
> Lieferant fährt.** Die 75,50 € sind *seine* Fracht, nicht eine, die man
> gegen eine billigere tauscht.

Ein Paketdienst hilft nur, wenn jemand das Paket übergibt. Dafür gibt es
genau drei Wege, und alle drei ändern das Geschäftsmodell:

| Weg | was er verlangt |
|---|---|
| **Der Lieferant versendet per Paket** | Poschacher müsste Kleinmengen paketieren und aufgeben — eine Vereinbarung, kein Tarif |
| **Selbst abholen und aufgeben** | Ware anfassen, lagern, verpacken, haften. Aus dem Streckenhandel wird ein Handel mit Lager |
| **Abholung beim Lagerhaus** | Filialen in **Münzbach und Perg** liegen im Liefergebiet — der kürzeste Weg zu Weg 2 |

Der dritte Weg ist der einzige, der heute schon eine Grundlage hat: Das
Konditionenblatt liegt vor, die Filialen sind im Gebiet, das gestaffelte
Frachtmodell ist gelesen. Er setzt aber einen Vertrag voraus — **eine
Anfrage an Dritte, also freigabepflichtig.**

## Was sich rechnen würde, wenn die Zahlen stimmen

Grob gerechnet mit 21 € Paketfracht statt 75,50 € Pauschale, bei 25 %
Marge und den Kostensätzen aus `kostenbild.js`:

| | Pauschale | Paket |
|---|---|---|
| Warenwert, ab dem die Bestellung trägt | **332 €** | **rund 95 €** |
| zwei Säcke Klebespachtel (ca. 85 € netto) | trägt sich **nicht** | trägt sich **knapp** |
| eine Kartusche Kleber (11 € netto) | trägt sich nicht | trägt sich nicht |

**Die letzte Zeile bleibt.** Auch ein Paket kostet mehr als eine
Kartusche; unter etwa 90 € Warenwert trägt keine Bestellung ihre Fracht.
Was der Paketweg ändert, ist der **Bereich zwischen 95 und 332 €** — und
das ist genau der Bereich, in dem eine Nachbestellung auf der Baustelle
liegt.

> Der Paketweg macht aus einem Palettenhandel keinen Kleinteilehandel. Er
> macht aus einem Mindestbestellwert von 332 € einen von rund 95 € — und
> damit aus „lohnt sich nicht" ein „lohnt sich ab dem zweiten Sack".

## Was als Nächstes zu tun ist, ohne jemanden zu fragen

1. **Gewichte erfassen.** Aus Bezeichnung und Lieferschein, Feld
   `gewichtKg` im Katalog, Quelle je Artikel gekennzeichnet. Ohne das
   bleibt alles Weitere Schätzung.
2. **`sperrgut` von „eingeschaetzt" auf belegt heben**, soweit die
   Rechnungen es hergeben — der Sperrgutzuschlag hängt daran, bei
   Poschacher wie bei der Post.
3. **Eine zweite Frachtregel im Rechenkern vorsehen** (`versandart:
   'paket' | 'spedition'`), die je Teillieferung greift. `preis.js`
   rechnet Fracht heute je Lieferant pauschal; die Struktur dafür ist da.

Freigabepflichtig und deshalb offen: der Vertrag mit einem Paketdienst
(Ausgabe), die Vereinbarung mit dem Lieferanten über Kleinmengen (E-Mail
an Dritte) und der Lagerhaus-Vertrag.

**Quellen (Stufe Hinweis, nicht bestätigt):**
[Post AG, Pakettarife Geschäftskunden](https://www.post.at/g/c/paket-tarife-geschaeftlich) ·
[WKO, Tariffolder Geschäftskunden ab 1.1.2026](https://www.wko.at/oe/information-consulting/druck/tariffolder-geschaeftskunden.pdf) ·
[paketcheck.at, Post](https://www.paketcheck.at/anbieter/post/) ·
[paketcheck.at, GLS](https://www.paketcheck.at/anbieter/gls/) ·
[DPD Österreich, Standard-Paketservices](https://www.dpd.com/at/de/versenden/standard-paketservices/)
