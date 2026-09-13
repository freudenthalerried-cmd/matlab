# Zehntes Audit ohne Fund — und das Funktionsmuster wieder auf Stand

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

## Das Audit: `verhandlung.js` hält seiner Erklärung stand

Zehntes Selbstaudit in der Richtung „vom Verhalten zur Erklärung", diesmal an
der Rückwärtsrechnung. Geprüft wurden die vier Formeln (nötiger Einkauf,
nötiger Rabatt, Spielraum aus Rabatt, Staffel) gegen ihre eigenen
Herleitungen und gegen `margenspielraum` im Auswertungsbogen — die beiden
Richtungen derselben Gleichung müssen sich treffen, und sie tun es. Die
Grenzfälle (Nachlass 0, Rabatt = Zielmarge) sind getestet, `rueckwaertsKatalog`
weist die Lücke zum Platzhalter-EK als Abgleich aus, nicht als Beleg.

**Kein Widerspruch gefunden.** Nach neun Funden in neun Modulen ist das
selbst ein Ergebnis — und eine bewusste Nicht-Änderung: Die Rückwärtsrechnung
spricht absichtlich die Verhandlungssprache „Rabatt auf die Netto-Liste",
während der Straßenpreis-Deckel im Auswertungsbogen sitzt
(`auswertung-grosshandelsweg.md`). Die Versuchung, den Deckel auch hier
einzubauen, wäre Doppelung ohne neuen Halt: Die Vorrunde
(`alternativen-ohne-freigabe.md`) hat die Verhandlungsziele bereits
unabhängig am Deckel bestätigt (38,0 % gerechnet gegen 38,8–44,2 % gefordert).

## Das Artefakt: Funktionsmuster auf den Abendstand gebracht

Das veröffentlichte Funktionsmuster stammte vom Nachmittag und trug drei
demo-sichtbare Korrekturen noch nicht: die Messwert-Grenze (genau 300 ist
keine Überschreitung), den ehrlichen Verschnitt-Prozentsatz (22 % statt
18 %) und die vollentschärfte UID-Belegzeile. Neu veröffentlicht an der
bestehenden URL; die Prüfsumme des Tages: **403 Testfälle, 0 hohl, neun
behobene Widersprüche aus zehn Audits.**

## Kein Gate

Kein Gate ändert sich. Nichts gesendet, nichts gekauft, keine Ausgabe.
Die Audit-Serie hat die naheliegenden Module durch; weitere Runden auf
dieser Schiene brauchen entweder neue Eingangsdaten (Antworten, Freigaben,
Netzzugang zu RIS) oder einen neuen Prüfwinkel — das ist der ehrliche
Stand, und er steht hier, damit der nächste Lauf nicht aus Gewohnheit
weiterbohrt, wo nichts mehr ist.
