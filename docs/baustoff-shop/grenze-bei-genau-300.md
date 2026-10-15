# Genau 300 Bq/m³ überschreiten 300 nicht — die Grenze der Leadstrecke

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Achtes Selbstaudit in der Richtung „vom Verhalten zur Erklärung", diesmal an
`messwert.js` — dem Einordner, dessen Ausgabe die Leadstrecke auslöst und
dessen Text Endkunden lesen.

## Der Fund

Bei einem Langzeitmesswert von **genau 300 Bq/m³** schrieb die Einordnung:
„300 Bq/m³ liegen **über** dem Referenzwert von 300 Bq/m³" — und setzte
`istQualifizierterAnlass`, den Auslöser der qualifizierten Anfrage.

Beides ist falsch. Sprachlich liegt 300 nicht über 300. Rechtlich ist der
Referenzwert überschritten, wenn der Jahresmittelwert ihn **überschreitet** —
nicht erreicht. Und das Partnerangebot definiert die qualifizierte Anfrage
ausdrücklich als „Messwert **über** 300 Bq/m³": Ein Partner, der für einen
Lead mit genau 300 zahlt, bekäme einen Interessenten ohne Überschreitung —
und eine Erstattungsdebatte, für die es im Erstattungskatalog bewusst keine
Zeile gibt.

Der zugehörige Testfall hatte die falsche Grenze **festgeschrieben statt
gefunden**: `assert.equal(ordneEin({wert: REFERENZWERT}).stufe, 'ueber')`.
Ein Test, der das Verhalten des Codes dokumentiert statt die Regel der
Dokumente, prüft die Erklärung nicht — dieselbe Lehre wie bei der
UID-Belegzeile, diesmal an einer Zahl.

## Die Korrektur

Die Unter-Stufe gilt jetzt für `wert <= 300`; ihre Aussage ist so
formuliert, dass sie für beide Fälle stimmt: „… **überschreiten** den
gesetzlichen Referenzwert von 300 Bq/m³ **nicht**." Überschreitung, Stufe
`ueber` und der qualifizierte Anlass beginnen erst über 300. Die
Banddarstellungen in `shop/README.md` und `messwert-einordnung.md` sind
nachgezogen („bis 300 eingehalten, über 300 bis 1.000 …").

## Geprüft

| | |
|---|---|
| geänderte/neue Zusicherungen | Grenztest neu geschrieben: genau 300 → unter, kein Lead; 300,1 → über, Lead |
| Testfälle gesamt | 401, alle grün, 0 mit Verdacht |

Gegenprobe: alte Grenze (`>=` zählt als Überschreitung) wieder eingebaut →
**1 Testfall fällt.** Demo neu gebaut und headless geprüft.

## Kein Gate

Kein Gate ändert sich. Der Fund ist schmal — ein einziger Wert auf der
Zahlengeraden — aber er sitzt an der Stelle, an der Geld den Besitzer
wechselt (Leadpreis je qualifizierter Anfrage) und an der ein Kunde die
Kompetenz des Portals am eigenen Messwert nachprüfen kann. Nichts gesendet,
nichts gekauft, keine Ausgabe.
