# Der Knopf sagte zweitausend

**11. September 2026, sechzehnte Runde.** Die Runde davor hat einen Warenkorb
gemessen, der ein paar Tage liegt. Diese hier bleibt am selben Ort und misst
den Schritt davor: **was der Shop dem Kunden bestätigt, wenn er etwas
einlegt.**

## Die Messung

Vier Eingaben auf der Artikelseite, jedes Mal gemessen an dem, was danach
wirklich im Speicher lag:

| Eingabe | im Korb | der Knopf sagte | |
|---|---:|---|---|
| 0,3 bei Gebindeschritt 0,5 | 0,5 | „0,5× im Warenkorb" | ✓ |
| −4 | 1 | „1× im Warenkorb" | ✓ |
| **2000** | **999** | **„2000× im Warenkorb"** | ✗ |
| **zweimal 5** | **10** | **„5× im Warenkorb"** | ✗ |

> **Der Satz behauptet den Korbinhalt — und zeigte die Eingabe.**

Die beiden richtigen Fälle sind kein Verdienst des Codes: Dort war die Eingabe
zufällig gleich dem, was ankam. In den beiden anderen weicht sie ab, und beide
Male stand die falsche Zahl da, wo ein Kunde sein Ergebnis abliest.

Die zweite Zeile ist die häufigere. Wer zweimal auf denselben Knopf drückt —
weil der erste Druck nicht sichtbar quittiert schien —, bekommt zehn und liest
fünf.

## Die Grenze dahinter

Beim Nachsehen, woher die 999 kommt, stand sie **fünfmal als nacktes Literal**
da: dreimal im Rechenkern (`ladeKorb`, `legeInKorb`, `setzeMenge`) und zweimal
als `max` im Seitenbauwerkzeug. Ohne Grund, ohne gemeinsame Quelle — und ohne
ein Wort an den Kunden.

Das ist gegen die eigene Regel dieses Bestands, die bei der 90-Tage-Grenze der
Preisalterprüfung ausgeschrieben steht: *„Sie steht hier als Zahl mit
Begründung und nicht als stille Konstante."*

### Gate 34, selbst entschieden

**Die Höchstmenge je Warenkorbzeile ist eine Grenze der Selbstbedienung — und
sie schweigt nicht.**

*Warum es überhaupt eine gibt:* keine Grenze der Ware, sondern eine der
Rechnung. Der Frachtrechner kennt eine Pauschale je Lieferung plus einen
Zuschlag je Hub; die Palettenzahl ist offen (eine von zwölf Fragen an den
Lieferanten), und der Mindestbestellwert deckt nach Gate 25 zwei Paletten. Eine
Zeile über 999 Einheiten sind bei Fassaden-EPS rund zwanzig Paletten — außerhalb
dessen, was dieser Korb rechnen kann. Solche Mengen gehören in ein **Angebot
mit Bindefrist**, und das kann der Betrieb seit dem 6. September.

*Warum sie nicht still greift:* ***Was ein Kunde eingegeben hat, ändert sich
nicht ohne einen Satz*** — wörtlich derselbe Fall wie die still entfallene
Warenkorbposition vom Vortag, nur eine Stunde früher im Ablauf.

*Was nicht entschieden ist:* **die Zahl selbst.** 999 war da und bleibt, bis
die Palettenfrage beantwortet ist; dann lässt sich eine Grenze rechnen statt
setzen. Eine gesetzte Zahl mit Begründung ist besser als fünf gesetzte Zahlen
ohne — sie ist deshalb noch keine gemessene.

## Was jetzt gilt

Der Knopf liest die Zeile, die tatsächlich entstanden ist:

```js
var zeileImKorb = korb.filter(function (z) { return z.sku === sku; })[0];
var drin = zeileImKorb ? zeileImKorb.menge : menge;
```

Damit sind beide falschen Fälle in einem erledigt — die Summe nach dem zweiten
Druck und die gekürzte Menge an der Grenze. Und wo gekürzt wurde, steht der
Grund dabei: „999× im Warenkorb — mehr als 999 geht hier nicht."

Die Grenze selbst steht als `HOECHSTMENGE` an **einer** Stelle, mit ihrer
Begründung, und das Seitenbauwerkzeug setzt sie als `max` ein, statt sie
abzuschreiben. Ein `max` im Formular, das von der Grenze im Rechenkern
abweicht, wäre die teurere Sorte Widerspruch: Der Browser sagt „geht", und der
Korb kürzt.

**Kein Befund war die Warenkorbseite.** Wer dort 2000 einträgt, sieht das Feld
danach auf 999 stehen — die Berichtigung steht dem Kunden vor Augen. Gemessen,
nicht angenommen.

**Zwei Gegenproben statt einer**, weil es zwei Hälften sind: Die eine setzt die
Eingabe in den Knopf zurück, die andere nimmt nur den Satz über die Grenze
heraus und lässt die richtige Zahl stehen. Wer beides zugleich abschaltet,
erfährt nicht, welche Hälfte die Probe hält.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2251 | **2254** |
| Shop-Szenarien im Browser | 59 | **61** |
| Gegenproben | 161 | **163** |
| Gates | 33 | **34** (18 mit Spur im Bestand) |

`npm test` grün (2254 bestanden, 3 übersprungen), `npm run pruefe-tests` (2257
Testfälle, 0 mit Verdacht), `npm run shopprobe` (61 Szenarien), `npm run
oberflaechenprobe` (11 Szenarien), `npm run pruefe-gates` (34 Gates, 18 mit
Spur, 16 mit Grund ohne), `npm run pruefe-pruefer` (48 Prüfer, 1 abgebrochen —
`pruefe-gebinde`).
