# Die Baustelle als eigene Adresse — und was eine Postleitzahl nicht beweist

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die Vorrunde hat die Papiere eines Vorgangs aneinandergebunden und dabei eine
Annahme benannt, statt sie zu verschweigen: **Ware und Rechnung gehen an
dieselbe Adresse**
([`vorgangsklammer.md`](./vorgangsklammer.md)). Diese Runde löst die Annahme
auf — und findet dabei ein zweites, älteres Loch.

## Die Lücke: der Shop konnte den Regelfall nicht

`PARAMETER.md` legt die Zielgruppe fest: **vorrangig Handwerksbetriebe**. Ein
Handwerksbetrieb bestellt vom Büro aus für eine Baustelle, die woanders liegt.
Das ist nicht der Sonderfall, das ist der Normalfall.

`baueAuftrag` setzte die Lieferadresse zwingend aus den Rechnungsdaten. Der
Shop konnte diese Bestellung also gar nicht abbilden — der Bauleiter hätte die
Palette ins Büro geliefert bekommen und von dort selbst auf die Baustelle
bringen müssen. Im Streckengeschäft, dessen ganzer Zweck die Direktlieferung
ist, hebt das den Vorteil auf.

Bezeichnend: Der Bestelltext trug von Anfang an die Überschrift
„Lieferadresse (**Baustelle**)" und die Zeile „Ansprechpartner vor Ort". Die
Absicht war da, die Datenstruktur nicht.

## Was jetzt geht

Die Bestelldaten nehmen einen freiwilligen Block `baustelle` auf. Fehlt er,
bleibt alles wie bisher — die Ware geht an die Rechnungsanschrift.

| Feld | | Warum |
|---|---|---|
| `strasse`, `plz`, `ort` | Pflicht | die Anschrift selbst |
| `land` | Pflicht | siehe unten — die Postleitzahl genügt nicht |
| `telefon` | Pflicht | die Spedition ruft nicht im Büro an, sondern auf der Baustelle |
| `name` | freiwillig | ohne Angabe steht der Besteller auf dem Lieferschein |
| `hinweis` | freiwillig | Zufahrt, Kranzeiten, Abladestelle |

Der Zufahrtshinweis steht im Bestelltext **direkt unter dem Adressblock** und
nicht am Briefende: Wer die Bestellung an die Spedition weiterreicht, kopiert
den Adressblock, nicht den ganzen Brief.

```
Lieferadresse (Baustelle):
  Neubau Familie Berger
  Feldgasse 27
  4910 Ried im Innkreis
  Ansprechpartner vor Ort: +43 664 9998877
  Hinweis zur Zufahrt: Zufahrt über Baustraße, Kran bis 16 Uhr besetzt
```

Die Rechnung geht unverändert ans Büro in Innsbruck.

## Der Fund: eine vierstellige Postleitzahl beweist nicht Österreich

Beim Bau der Prüfung für die Baustellenadresse habe ich die bestehende Regel
übernommen — vier Stellen, mindestens 1000. Dann nachgesehen, was damit
durchkommt:

| Ort | PLZ | bis dahin |
|---|---|---|
| Lugano | 6900 | **angenommen** |
| Zürich | 8001 | **angenommen** |
| Vaduz | 9490 | **angenommen** |

Die Schweiz und Liechtenstein verwenden vierstellige Postleitzahlen im selben
Bereich wie Österreich. Beide sind **Drittland**: Eine Lieferung dorthin ist
eine Ausfuhr, nicht einmal eine innergemeinschaftliche Lieferung.

Das ist keine Kosmetik. Der Rechnungstext schließt mit „Leistungsort
Österreich, Steuersatz 20 %", und `reihengeschaeftEinordnung` folgert daraus
„Ausgangsrechnung mit 20 %". Beides gilt nur, solange die Ware im Inland
ankommt:

* **Anderer Mitgliedstaat** — steuerfreie innergemeinschaftliche Lieferung nach
  Art 6 und 7 UStG. Im Reihengeschäft entscheidet zusätzlich, welche der
  Lieferungen die bewegte ist; das ist nicht durchgerechnet.
* **Drittland** — Ausfuhrlieferung, eigene Nachweispflichten.

In beiden Fällen wären 20 % auf der Rechnung schlicht falsch. Solange das nicht
durchgerechnet ist, wird die Bestellung abgewiesen statt falsch verrechnet.

**Das Loch war älter als die Baustelle.** Dieselbe Regel prüfte seit jeher die
Rechnungsanschrift. Dort war es entschärft, weil Gate 7 ohnehin eine
ATU-Nummer verlangt und ein Schweizer Betrieb keine hat — aber entschärft ist
nicht geschlossen, und die Baustelle hat keine UID.

### Die Behebung, und warum sie zweigeteilt ist

Das Land steht jetzt als eigenes Feld da, statt aus der Postleitzahl geraten zu
werden. Die Behandlung ist an beiden Stellen bewusst verschieden:

* **Baustelle: `land` ist Pflicht.** Sie ist der neue, freiwillige Block; ein
  Land zu verlangen kostet keinen Bestandsaufruf und schließt genau die Lücke,
  um die es geht. Fehlt es, lautet die Meldung: *„Baustelle: Land fehlt — eine
  vierstellige Postleitzahl beweist nicht Österreich."*
* **Rechnungsanschrift: `AT` bleibt Voreinstellung**, aber als ausgesprochene.
  Dort stützt die verlangte ATU-Nummer die Annahme; auf der Baustelle stützt sie
  nichts.

Eine Voreinstellung, die man benennen kann, ist keine stille Annahme mehr. Genau
darin liegt der Unterschied zum Zustand davor.

## Die Klammer liest die Annahme jetzt ab

`lieferungAnRechnungsempfaenger` stand seit der Vorrunde fest auf `true`. Jetzt
kommt es aus den Daten: Bei abweichender Baustelle schaltet sich **genau die
eine** Prüfung ab, die Ware und Rechnung auf dieselbe Firma vergleicht — sie
würde dort falsche Alarme schlagen statt Fehler zu finden. Alle übrigen
Prüfungen der Klammer bleiben scharf; ein Testfall lenkt die Bestellung
absichtlich um und besteht darauf, dass es auffällt.

Damit hat die Vorrunde sich ausgezahlt: Weil die Annahme als Feld dastand und
nicht als stille Voraussetzung im Code, war beim Auflösen genau eine Stelle zu
ändern — und es war sichtbar, welche.

## Geprüft

| | |
|---|---|
| neue Testfälle | 15 |
| davon, die absichtlich etwas Falsches versuchen | 6 |
| Testfälle gesamt | 290, alle grün, 0 mit Verdacht |

**Gegenprobe an den neuen Sperren.** Zwei Mutationen, beide sofort rot:

* Land der Baustelle wieder aus der Postleitzahl geraten → 2 Testfälle fallen.
* Baustellenblock wieder ignoriert → 12 Testfälle fallen.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: `demo.html` nimmt den
Vorgang mit Baustelle an (`gueltig: true`), setzt
`lieferungAnRechnungsempfaenger` auf `false`, schickt die Ware nach Ried, den
Zufahrtshinweis mit, die Rechnung nach Innsbruck — und weist Lugano ab.

## Kein Gate, aber eine Grenze im Register

Kein neues Gate. Die Kennzahlen bleiben: 3.900,20 € brutto, 34,2 % Mischmarge,
alle Preise Platzhalter.

Festgehalten ist aber eine **Grenze des Modells**, die vorher niemand
ausgesprochen hatte: Der Shop bedient ausschließlich Lieferorte in Österreich.
Das folgt nicht aus Bequemlichkeit, sondern aus der Umsatzsteuer — und es ist
zugleich eine Marktgrenze. Wer den Shop später über die Grenze öffnen will,
öffnet damit nicht nur ein Adressfeld, sondern die ganze Frage nach der
bewegten Lieferung im Reihengeschäft.
