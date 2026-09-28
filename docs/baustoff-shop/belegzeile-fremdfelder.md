# Die UID-Belegzeile — dieselbe Regel, bisher ein Drittel der Felder

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Sechstes Selbstaudit in der Richtung „vom Verhalten zur Erklärung", diesmal
an `vies.js` — der Strecke, deren Belegzeile in die **unveränderbare Ablage**
geht.

## Der Fund

In `belegzeile` stand ein Kommentar mit der richtigen Regel: „Der Name kommt
aus der Antwort eines fremden Dienstes und landet in der Ablage. Ein Umbruch
darin wäre eine zusätzliche Belegzeile." Entschärft wurde: **nur der Name.**

Aus derselben fremden Antwort stammen aber auch die Abfrage-Identifikation
(`requestIdentifier`) und das Abfragedatum (`requestDate`) — und beide gingen
roh in die Zeile. Nachgewiesen, nicht befürchtet: Eine Antwort mit einem
Zeilenumbruch in der Abfrage-ID erzeugte **zwei** Belegzeilen. Die zweite
landet in der Ablage — der einzigen Stelle, aus der nichts mehr verschwindet
(§ 131 BAO) — und sähe dort aus wie ein eigener Eintragstext.

Der Fremdtext-Verzeichnis-Test (Ausgang 6) hatte denselben blinden Fleck: Er
vergiftete nur den Namen. Ein Test, der die Erklärung des Codes prüft, erbt
dessen Auslassung — das ist die bekannte Lehre („wer gegen die eigene
Erklärung prüft…"), hier am Prüfwerkzeug selbst.

## Die Korrektur

Die ganze Belegzeile geht jetzt durch `textZeile` — egal welches Feld
vergiftet ist, die Zeile bleibt eine Zeile. Das ersetzt die Feld-für-Feld-
Entschärfung durch eine Eigenschaft des Ausgangs, so wie es das
Fremdtext-Verzeichnis für jeden Ausgang verlangt.

## Geprüft

| | |
|---|---|
| neue Testfälle | 1 (Ausgang 6 des Fremdtext-Verzeichnisses, jetzt mit Gift in ID und Datum) |
| Testfälle gesamt | 399, alle grün, 0 mit Verdacht |

Gegenprobe: Zeile wieder roh zusammengesetzt → **2 Testfälle fallen** (der
neue und der alte Namens-Test, dessen Einzelentschärfung bewusst in der
Gesamtentschärfung aufgegangen ist). Demo neu gebaut und headless geprüft.

## Notiert, nicht geändert

Beim Audit fiel eine zweite Stelle auf, absichtlich unangetastet: Die
Wiederholungsschleife in `pruefeUid` versucht es bei vorübergehenden Fehlern
(`MS_MAX_CONCURRENT_REQ` u. a.) **sofort** erneut, ohne Wartezeit. Bei einem
überlasteten Dienst verschärft das die Last. Bewusst nicht eingebaut: Eine
Wartezeit braucht eine Uhr, und die Module lesen keine — der hereingereichte
`abruf` kann selbst warten. Der Hinweis gehört zur Anbindungsentscheidung in
Stufe 2, nicht in den Rechenkern.

## Kein Gate

Kein Gate ändert sich; alle Preise bleiben Platzhalter. Nichts gesendet,
nichts gekauft, keine Ausgabe.
