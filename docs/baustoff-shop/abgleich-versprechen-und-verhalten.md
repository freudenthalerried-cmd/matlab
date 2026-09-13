# Der Ansprechpartner auf der Baustelle hat nie zugestimmt

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die Vorrunde hat drei Befunde aus einer **Durchsicht von Hand** geholt:
dreizehn AGB-Punkte neben elf Ablaufschritte gelegt und verglichen. Eine
Durchsicht findet nur, wonach man an dem Tag gesehen hat. Diese Runde macht
daraus ein Werkzeug — und das Werkzeug fördert sofort etwas zutage, das keine
der bisherigen Runden gesehen hatte.

## Das Werkzeug

`shop/src/abgleich.js` führt die Zuordnung **AGB-Punkt → Umsetzung** als Daten,
nach demselben Muster wie das Verzeichnis der Fremdtext-Ausgänge: Was hier nicht
steht, ist unbelegt.

| Art | bedeutet |
|---|---|
| `code` | eine Funktion, die das Versprechen durchsetzt |
| `ablauf` | ein Schritt in `SCHRITTE` |
| `beleg` | ein Text, der an den Kunden geht |
| `klausel` | reine Vertragsklausel, im Ablauf ohne Entsprechung |

`klausel` ist kein Schlupfloch, sondern eine Aussage: Für Gerichtsstand oder
Haftungsausschluss **gibt es** nichts umzusetzen. Wer einen Punkt so einordnet,
sagt das ausdrücklich, statt ihn stillschweigend auszulassen.

**Warum die Zuordnung keine bloße Behauptung ist.** Der Fehler ist in diesem
Projekt schon zweimal aufgetreten: Eine Prüfung vergleicht eine Erklärung mit
sich selbst und geht immer auf. Hier zeigt jede Zuordnung deshalb auf **Namen,
die es geben muss** — eine Schritt-Kennung aus `SCHRITTE`, eine exportierte
Funktion aus einem Modul —, und `pruefeAbgleich` schlägt jedes Ziel nach.

Gegenprobe, beide Richtungen:

| Mutation | Ergebnis |
|---|---|
| ein AGB-Punkt ohne Zuordnung | 2 Testfälle fallen |
| ein Ablaufschritt ohne AGB-Bezug | 2 Testfälle fallen |
| `preis.js` ohne die Funktion `fracht` | gemeldet |
| ein Modul gar nicht übergeben | gemeldet |

Der Abgleich der dreizehn Punkte selbst geht auf — das ist ein negatives
Ergebnis und steht als solches da. Die Vorrunde hat aufgeräumt; hier war nichts
mehr zu finden.

## Der Fund kam aus der anderen Richtung

Dieselbe Frage, auf ein anderes Papier angewandt: Nicht „steht in der Erklärung
etwas, das der Shop nicht tut", sondern **„tut der Shop etwas, das in der
Erklärung nicht steht"**. Diesmal die Datenschutzerklärung gegen die
tatsächlichen Datenflüsse.

Fünf Flüsse. Zwei davon waren nirgends genannt.

### Der Ansprechpartner vor Ort ist ein Dritter

Seit drei Runden hat die Baustellenadresse ein Pflichtfeld **Ansprechpartner vor
Ort** — eingeführt, weil die Spedition auf der Baustelle jemanden erreichen
muss, und später begründet mit der Rügefrist nach § 377 UGB.

Seine Telefonnummer geht an den Lieferanten und von dort an dessen Spedition.
**Er hat mit dem Shop keinen Vertrag.** Die Nummer stammt vom Besteller, nicht
von ihm.

Damit trägt Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung, die Grundlage, auf
der die ganze bisherige Datenschutzgliederung steht — diesen Fluss nicht. In
Betracht kommt lit. f. Und Art. 14 verlangt, **ihn** zu informieren: eine
Person, die der Shop nie zu Gesicht bekommt und deren Adresse er nicht kennt.

Das ist kein theoretischer Fall. Auf einer Baustelle ist der Ansprechpartner
typischerweise der Polier eines anderen Betriebs oder der Bauherr selbst.

### Die UID-Abfrage ist eine Übermittlung

Gate 7 verlangt die UID, und `vies.js` fragt sie beim
EU-Informationsaustauschsystem ab. Bei einer GmbH ist die UID kein
personenbezogenes Datum — **bei einem Einzelunternehmer schon**, und Gate 7
schließt Einzelunternehmer nicht aus; im Gegenteil, ein großer Teil der
Zielgruppe sind sie.

Die Abfrage ist damit eine Übermittlung an eine Stelle außerhalb des Betriebs.
In der Gliederung stand sie nicht.

## Was daraus geworden ist

Zwei neue Punkte in `DATENSCHUTZ_GLIEDERUNG` — neun statt sieben:

* *Daten Dritter: Ansprechpartner vor Ort auf der Baustelle — Art. 6 Abs. 1
  lit. f, Informationspflicht nach Art. 14*
* *UID-Abfrage beim EU-Informationsaustauschsystem — Übermittlung und Zweck*

Dazu `DATENFLUESSE` in `abgleich.js`: fünf Flüsse mit Datum, Quelle, Empfänger,
Rechtsgrundlage — und, wo es sie gibt, der **offenen Frage**. `pruefeDatenfluesse`
prüft, dass jeder Fluss von einem Gliederungspunkt gedeckt ist, und zwar über den
**Wortlaut** und nicht über einen Index: Ein Index bliebe gültig, wenn jemand den
Punkt inhaltlich austauscht.

Die beiden offenen Fragen werden **benannt, nicht gelöst**. `rechtstexte.js` ist
Zuarbeit für den Rechtstexteanbieter aus `phase5-technik.md` (10–25 €/Monat),
keine Rechtsberatung. Was diese Runde leisten kann, ist die Frage auf den Tisch
zu legen, bevor sie jemand im Echtbetrieb stellt — und der Anbieter fragt sie
nicht von selbst, weil er das Streckengeschäft mit Baustellenanlieferung nicht
kennt.

## Ein Muster über die letzten Runden

| Runde | Richtung | Fund |
|---|---|---|
| Fremdtext | Ausgänge aufzählen | ein Firmenname bestellte 999 Rollen |
| Fracht | Kunde gegen Lieferant | Schwelle auf der falschen Seite |
| Vorgang | Papier gegen Papier | Ware und Rechnung an zwei Kunden |
| AGB gegen Ablauf | Versprechen gegen Verhalten | Margenleck, Widerspruch, fehlender Punkt |
| **Datenfluss gegen Erklärung** | **Verhalten gegen Versprechen** | **zwei ungenannte Empfänger** |

**Die ergiebige Richtung ist immer dieselbe: vom Verhalten zur Erklärung, nicht
umgekehrt.** Eine Erklärung durchzugehen und zu fragen „wird das eingehalten?"
findet wenig — Erklärungen werden geschrieben, nachdem man weiß, was man tut.
Umgekehrt zu fragen „wo steht, dass wir das dürfen?" findet die Stellen, an die
beim Schreiben niemand gedacht hat.

## Geprüft

| | |
|---|---|
| neue Testfälle | 13 |
| Testfälle gesamt | 335, alle grün, 0 mit Verdacht |

Am gebauten Bündel nachgesehen: dreizehn AGB-Punkte, neun
Datenschutzpunkte, beide neuen darunter, elf Ablaufschritte, die Rechtsseite
zeichnet und trägt den Punkt zu den Daten Dritter.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. 3.900,20 € brutto und 34,2 %
Mischmarge bleiben; alle Preise sind Platzhalter.

Was hinzukommt, ist ein Posten für die Liste dessen, was nur der Auftraggeber
klären kann — und zwar einer, der nichts kostet, aber vor dem ersten echten
Auftrag geklärt sein will: **Wie der Ansprechpartner auf der Baustelle nach
Art. 14 informiert wird.** Der naheliegende Weg ist eine Zusicherung des
Bestellers im Bestellprozess, dass er den Genannten unterrichtet hat. Ob das
genügt, entscheidet nicht dieser Loop.
