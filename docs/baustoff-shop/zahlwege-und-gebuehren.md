# Zahlwege — eine Kostenstelle, die in der ganzen Rechnung fehlte

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/zahlung.js`,
15 Testfälle.

Der Trockenlauf hat den Zahlungseingang als eine der beiden harten Blockaden
benannt. Bevor dafür ein Anbieter gewählt wird — und das ist eine Ausgabe,
also freigabepflichtig — gehören die Bedingungen zusammengetragen und die
Kosten gerechnet.

Beim Zusammentragen kam heraus, dass die Kosten **nirgends stehen**.

## Der Befund: Zahlungsgebühren kommen in keiner Rechnung vor

Weder [`phase3-unit-economics.md`](./phase3-unit-economics.md) noch
[`phase4-sortiment-und-materialwert.md`](./phase4-sortiment-und-materialwert.md)
noch [`phase5-technik.md`](./phase5-technik.md) erwähnen sie. Die Kostenseite
kennt Hosting, Rechtstexte, Domain und Werbung — aber keinen einzigen Cent
Zahlungsgebühr.

Das ist keine Rundungsgröße. Gerechnet auf die Planungslage — 24.200 € Umsatz
netto im Monat, 37 Bestellungen, Zielgewinn 5.374 € vor Steuer:

| Zahlweg | €/Monat | Anteil am Zielgewinn |
|---|---|---|
| Vorkasse per Überweisung | 0 | 0,0 % |
| EPS-Onlineüberweisung | 271 | 5,0 % |
| Kreditkarte, 1,4 % + 0,25 € | 416 | **7,7 %** |
| Kreditkarte, 1,8 % + 0,25 € | 532 | 9,9 % |
| PayPal, 2,49 % + 0,35 € | 736 | 13,7 % |
| B2B-Rechnungskauf, 3 % | 871 | **16,2 %** |

Eine Kostenstelle, die je nach Wahl zwischen null und einem Sechstel des
Zielgewinns liegt, hat in der Planung zu stehen. Jetzt steht sie.

## Warum der Prozentsatz härter trifft, als er aussieht

Die Gebühr fällt auf den **Bruttobetrag** an. Der Deckungsbeitrag entsteht nur
auf dem Warenwert netto. Diese Schere macht aus einem Listenpreis eine andere
Zahl, als man erwartet.

Am durchgerechneten Referenzgebäude — 12 × 10 m, vier Durchführungen, mit
Drainage:

```
Bruttobetrag         3.900,20 €
Warenwert netto      3.088,17 €
Deckungsbeitrag      1.057,37 €

Karte, 1,4 % + 0,25 €:      54,85 €  =  1,78 % des Warenwerts
                                     =  5,19 % des Deckungsbeitrags
B2B-Rechnungskauf, 3 %:    117,01 €  =  3,79 % des Warenwerts
                                     = 11,07 % des Deckungsbeitrags
```

Aus „1,4 %" werden also 5,2 % dessen, was am Ende übrig bleibt. Bei einer
Rohmarge, die laut Gate 1 gerade 32 % zu tragen hat, ist das kein Detail.

## Die eigentliche Spannung: Was der Zielgruppe entspricht, ist das Teuerste

Hier stoßen zwei Vorgaben aufeinander, und das ist der wichtigere Teil dieses
Dokuments.

**Handwerksbetriebe kaufen auf Rechnung.** Dreißig Tage netto sind im
Baustoffhandel der Normalfall, nicht die Ausnahme. Ein Betrieb, der bei seinem
angestammten Händler ein Kundenkonto hat, wird von einem neuen Onlineshop nicht
ohne Weiteres Vorkasse akzeptieren — er hat den Betrag ja bereits im Material
gebunden und bekommt ihn erst mit der Schlussrechnung an den Bauherrn zurück.

**Der Shop kann aber nicht in Vorleistung gehen.** Das Modell ist reines
Streckengeschäft ohne Betriebsmittel: Erst die Zahlung, dann die
Lieferantenbestellung. Ein Zahlungsziel bedeutete, den Wareneinkauf
vorzufinanzieren und das Ausfallrisiko selbst zu tragen — bei 37 Bestellungen
zu je 650 € netto wären das rund 24.000 € gebundenes Kapital, mehr als das
gesamte Startbudget.

Der Ausweg ist ein **B2B-Rechnungskauf über einen Anbieter**: Der Kunde bekommt
sein Zahlungsziel, der Anbieter zahlt sofort aus und trägt das Ausfallrisiko.
Genau dieser Weg kostet 16,2 % des Zielgewinns.

Damit steht die Wahl:

| | Vorkasse / EPS | Rechnungskauf über Anbieter |
|---|---|---|
| Kosten | 0–271 €/Monat | ~871 €/Monat |
| Entspricht der Zielgruppe | nein | ja |
| Kapitalbindung | keine | keine |
| Wirkung auf die Umsatzquote | unbekannt, vermutlich dämpfend | — |

**Entscheidung: beides, gestuft.** EPS und Karte von Anfang an, Rechnungskauf
erst, wenn die Umsatzquote zeigt, dass er gebraucht wird. Begründung: Die
Kosten des Rechnungskaufs sind sicher, sein Nutzen ist es nicht. Wer ihn vorab
einbaut, zahlt 871 € im Monat für eine Vermutung. Wer die Abbruchquote im
Bestellvorgang misst, weiß nach wenigen Wochen, ob das Zahlungsziel der Grund
ist.

Das ist kein neues Gate, sondern eine Kennzahl für Stufe 3 in
[`phase9-meilensteine-und-abbruch.md`](./phase9-meilensteine-und-abbruch.md):

> **Abbruchquote an der Zahlungsauswahl.** Bricht mehr als ein Drittel der
> Bestellvorgänge dort ab, ist das fehlende Zahlungsziel der wahrscheinlichste
> Grund. Dann rechtfertigen sich die 871 € im Monat — vorher nicht.

## Die Anforderungsliste, gesammelt

Die Bedingungen standen bisher in fünf Dokumenten verstreut. `ANFORDERUNGEN`
führt sie als prüfbare Liste, jede mit Herkunft:

| Bedingung | Woher |
|---|---|
| Löst keine Registrierkassenpflicht aus | `ablage-und-nummernkreis.md` |
| Meldet den Zahlungseingang maschinell zurück | `trockenlauf-auftrag.md` |
| Kostet höchstens 10 % des Zielgewinns | `PARAMETER.md` |

Was daran auffällt, wenn man es einmal maschinell prüft:

- **Vorkasse scheitert an genau einer Bedingung** — der maschinellen
  Rückmeldung. Sie ist kostenlos und trotzdem untauglich, solange niemand den
  Kontoeingang automatisch liest. Das ist die Blockade aus dem Trockenlauf, nur
  von der anderen Seite betrachtet.
- **Nachnahme scheitert an zweien** und ist ohnehin ausgeschlossen.
- **EPS erfüllt alle drei.** Es ist in Österreich verbreitet, meldet sofort
  zurück, kostet ein Fünftel des Rechnungskaufs und kennt keine Rückbuchung wie
  die Lastschrift.

## Was an diesen Zahlen unsicher ist

Die Gebührensätze für Karte und PayPal sind **veröffentlichte Listenpreise**,
also belastbar, aber kein Angebot — ausgehandelte Konditionen liegen bei
Volumen darunter. Konfidenz hoch.

Der Satz für EPS ist eine Größenordnung; die Anbieter weisen ihn uneinheitlich
aus. Konfidenz mittel.

**Der Satz für den B2B-Rechnungskauf ist der schwächste Punkt.** Die Anbieter
veröffentlichen ihre Händlerkonditionen nicht; die 3 % sind die Mitte einer
allgemein genannten Spanne von 2 bis 4 %. Am unteren Rand kostet der
Rechnungskauf 581 € im Monat (10,8 % des Zielgewinns), am oberen 1.162 €
(21,6 %). Die Bandbreite allein ist ein Zehntel des Zielgewinns. Konfidenz
niedrig, und ein Testfall besteht darauf, dass das so gekennzeichnet bleibt.

Ein belastbarer Satz erfordert eine Anfrage bei den Anbietern — also eine
E-Mail an Dritte. **Sie ist nicht versendet.** Falls die zwölf
Herstelleranfragen freigegeben werden, wäre das ein sinnvoller Anlass, zwei
Zahlungsanbieter mitzufragen; kosten würde es nichts.
