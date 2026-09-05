# Die Rechnung nannte den Namen und ließ die Anschrift weg

**2. September 2026, abends.** Weiter mit der Methode: das Papier lesen, das
den Shop verlässt. Diesmal die **Rechnung**, das Dokument mit den strengsten
Anforderungen. Oben stand:

```
Rechnung RE-0001
Ausstellungsdatum: 01.09.2026
Lieferdatum: 05.09.2026

Freudenthaler Bau GmbH
UID: [[ UID des Ausstellers — FEHLT ]]

Rechnungsempfänger:
  Musterbau GmbH
  Baustellenweg 7
  4600 Wels
  UID: ATU12345675
```

Der **Empfänger** steht mit Straße, PLZ und Ort da. Der **Aussteller** nur mit
seinem Namen. § 11 Abs 1 Z 3 UStG verlangt „Name **und Anschrift** des
liefernden Unternehmers", und dieselbe Rechnung sagt zwei Absätze tiefer:

> Dieser Beleg dient dem Vorsteuerabzug.

## Drei Stellen, drei Aussagen, alle für sich plausibel

| | was dort stand |
|---|---|
| Register `RECHNUNGSMERKMALE` | „Name **und Anschrift** des liefernden Unternehmers" |
| Prüfung `pruefeRechnungsmerkmale` | bekam `ausstellerName: betreiber.firma` |
| Ausdruck `erzeugeRechnung` | `wert(betreiber.firma, 'Firma **und Anschrift** des Ausstellers')` |

Die Beschriftung im Ausdruck sagt „Firma und Anschrift" und gibt die Firma
aus. Die Prüfung fragt nach einem Feld und bekommt eines. Das Register hat von
Anfang an das Richtige verlangt.

> **Eine Prüfung, die ein Feld prüft statt der Angabe, prüft den Namen des
> Feldes.**

Und der Grund, weshalb es keinem auffiel, steht im Testbestand:

```js
const betreiber = { firma: 'Musterfirma GmbH, Musterweg 1, 4600 Wels', uid: '…' };
```

Die Probe hat die ganze Anschrift in das Feld für den Namen gestopft. Sie
wusste, dass die Anschrift dorthin gehört — und hat damit genau den Fall
verdeckt, der beim echten Betreiber eintritt: `betreiber.json` führt `strasse`,
`plz` und `ort` als **eigene** Felder, und die druckte niemand.

**Das ist kein neuer offener Punkt.** Die Anschrift liegt seit Wochen in der
Datei. Sie wurde ausgelassen.

## Was geändert ist

`absenderzeilen()` gibt Firma, Straße und PLZ/Ort aus — auf **Rechnung,
Angebot und Auftragsbestätigung**, denn es ist derselbe Absender und dieselbe
Datenquelle. `anschriftEinzeilig()` setzt dieselbe Angabe für die Prüfung
zusammen und ist **leer, sobald ein Teil fehlt**: Eine halbe Anschrift ist
keine, und die Prüfung soll dann melden statt durchzuwinken. Dasselbe gilt
jetzt für den Empfänger.

Der Prüflauf `bin/belegpruefung.mjs` reichte die Anschrift gar nicht erst
weiter — er baute seinen Betreiber aus `firma` und `uid`. Auch das ist
nachgezogen.

## Die eigentliche Lücke: zwei Prüfungen, die aneinander vorbeisehen

`pruefeRechnungsmerkmale` prüft die **Eingaben** eines Belegs.
`pruefeBeleg` prüft den **Text**. Beide waren grün, und niemand hielt sie
gegeneinander: Was geprüft wurde, musste nicht im Beleg stehen.

`pruefeBeleg` nimmt jetzt `mussEnthalten` entgegen — Angaben, die geprüft
**und** gedruckt sein müssen. Leere Werte stehen nicht darin: Eine fehlende
Angabe ist im Text schon als sichtbare Lücke markiert, und zweimal dasselbe zu
melden macht keine Meldung besser.

Das ist dieselbe Bauart wie der Befund von vorhin — dort lag der Fehler
zwischen zwei **Belegen**, hier zwischen zwei **Prüfungen** desselben Belegs.

## Stand

| | |
|---|---|
| Belege mit Absenderanschrift | 3 (Angebot, Auftragsbestätigung, Rechnung) |
| übergreifende Regeln in `pruefeBeleg` | „geprüft, aber nicht gedruckt" |
| Tests | 1249 |
| Gegenproben, die anschlagen | 21 von 21 |

Die neue Gegenprobe löscht die Straßenzeile aus dem Rechnungsbau und erwartet,
dass `pruefe-belege` es meldet. Vor heute wäre sie grün geblieben — die
Rechnung hätte weiterhin als vollständig nach § 11 gegolten.
