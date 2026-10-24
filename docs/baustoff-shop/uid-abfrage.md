# Die UID-Abfrage — und warum drei Zustände nötig sind

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/vies.js`,
17 Testfälle.

Der Trockenlauf in [`trockenlauf-auftrag.md`](./trockenlauf-auftrag.md) hat die
UID-Abfrage als den einen Engpass benannt, der sich ohne Freigabe und ohne
Ausgabe schließen ließe: zwei Minuten Handarbeit je Bestellung, 1,2 Stunden im
Monat. Er ist jetzt geschlossen — mit einer Einschränkung, die weiter unten
steht und die meine eigene Aussage von gestern korrigiert.

## Warum die Abfrage überhaupt sein muss

Zwei voneinander unabhängige Gründe, beide bereits an anderer Stelle
festgehalten:

- **Gate 7** verlangt den wirksamen Ausschluss von Verbraucherbestellungen. Ein
  Häkchen „ich bestelle als Unternehmer" ist dafür schwach; eine bestätigte UID
  ist der Beleg.
- **§ 11 Abs 1 Z 2 UStG** verlangt ab 10.000 € brutto die UID des
  Leistungsempfängers auf der Rechnung. Eine falsche UID auf einer Rechnung ist
  ein Rechnungsmangel.

`kunde.js` prüfte bisher nur Format und Prüfziffer — und sagte ausdrücklich,
dass die verbindliche Abfrage aussteht. Genau die ist jetzt gebaut.

## Der Kern: gültig, ungültig, unbestätigt

Der naheliegende Entwurf hat zwei Zustände und ist falsch. Der Dienst der
Kommission ist bekanntermaßen unzuverlässig; er fragt bei jedem Mitgliedstaat
einzeln nach, und wenn Wien gerade nicht antwortet, kommt `MS_UNAVAILABLE`
zurück. Das ist **keine Aussage über die UID**.

| Antwort | Was der Shop tut |
|---|---|
| bestätigt, mit Abfrage-Identifikation | nichts — die Bestellung läuft weiter |
| bestätigt, ohne Abfrage-Identifikation | angehalten: bestätigt, aber nicht belegbar |
| als ungültig gemeldet | **gesperrt** — Gate 7 nicht erfüllt |
| Dienst nicht erreichbar | **angehalten**, ausdrücklich nicht abgelehnt |

Der Unterschied zwischen den letzten beiden ist der ganze Punkt. Wer einen
Dienstausfall als „ungültig" behandelt, weist Kunden ab, weil ein fremder
Server gerade neu startet. Wer ihn als „gültig" behandelt, hat die Prüfung
nicht. Also: Die Bestellung bleibt bestehen, nur die **automatische Auslösung**
wartet. Ein Ausfall in Brüssel darf keinen Auftrag in Wels kosten.

Umgesetzt ist das additiv: `darfAutomatischAusgeloestWerden` bleibt unangetastet,
`ergaenzeFreigabe` legt einen Grund oben drauf. Die Sperrenlogik hat damit
weiterhin genau eine Stelle.

## Die Abfrage-Identifikation ist der eigentliche Zweck

Der Dienst kennt zwei Formen. Die **einfache Anfrage** sagt nur ja oder nein.
Die **qualifizierte Bestätigungsanfrage** — mit der eigenen UID im Aufruf —
liefert zusätzlich eine Abfrage-Identifikation.

Nur die zweite taugt als Nachweis. Eine Prüfung, die man später nicht vorlegen
kann, ist im Streitfall keine Prüfung: Der Shop behauptet dann, er habe
geprüft, und hat nichts in der Hand. `belegzeile()` schreibt deshalb bei jeder
Abfrage eine Zeile für die Ablage, und wo die Identifikation fehlt, steht das
ausdrücklich darin — „ohne Abfrage-ID — nicht als Nachweis geeignet" — statt
dass die Lücke stillschweigend durchgeht.

## Zwei Fallen in der Länderliste

Der erste Entwurf akzeptierte jedes Buchstabenpaar als Länderkürzel. Ein
Testfall hat das aufgedeckt, und zwar auf die unangenehmste Art: Aus der
Eingabe „keine uid" machte die Zerlegung ein Land namens **KE** mit der
Nummer INEUID. Jeder Tippfehler wäre zu einer Anfrage an einen Dienst geworden,
der sie nicht beantworten kann.

Die Liste steht jetzt ausgeschrieben da, und sie enthält zwei Punkte, die man
falsch machen kann:

- **Griechenland führt EL, nicht GR.** Wer die ISO-Länderliste nimmt, weist
  griechische Kunden ab.
- **XI steht für Nordirland**, das für Warenlieferungen im
  Mehrwertsteuersystem der Union geblieben ist. **GB steht nicht darin.**

Für ein Geschäft, das seinen Absatz in Österreich hat, klingt beides
entbehrlich. Es ist es nicht: Der Empfängerkreis der Herstelleranfragen reicht
nach Deutschland, Italien und in die Schweiz, und wer einmal eine EU-weite
Bestellung annimmt, braucht die Liste vollständig oder gar nicht.

## Was ungeprüft bleibt

**Die Antwortstruktur ist nachgebildet, nicht gemessen.** Der Dienst ist aus
dieser Umgebung nicht erreichbar; der Proxy beantwortet den Verbindungsaufbau
mit 403, zuletzt geprüft am 15. August. Die Felder stammen aus der
Dokumentation der Schnittstelle.

Die Auswertung ist deshalb misstrauisch gebaut: Eine Antwort, deren Struktur
nicht zur Erwartung passt, gilt als **unbestätigt**, nicht als in Ordnung. Ein
Testfall prüft genau das mit einer erfundenen Antwortform. Sobald eine echte
Antwort vorliegt, gehört sie in die Testdatei, und die Auswertung ist erneut
zu prüfen.

## Korrektur an meiner eigenen Aussage von gestern

In [`trockenlauf-auftrag.md`](./trockenlauf-auftrag.md) steht, die UID-Abfrage
sei „der einzige der sechs Engpässe, der ohne Freigabe und ohne Ausgabe lösbar
wäre". Das stimmt für den Quelltext und nicht für die Sache.

Die qualifizierte Anfrage braucht die **eigene UID des Betreibers**. Die steht
auf derselben Liste der elf fehlenden Firmenangaben wie alles andere. Ohne sie
bleibt nur die einfache Anfrage — die prüft zwar, liefert aber keinen
vorlegbaren Nachweis, und genau der war der Grund für die Übung.

Richtig ist also: **Der Code ist fertig, die belegbare Prüfung nicht.** Von den
1,2 Stunden im Monat sind sie eingespart, sobald zwei Dinge vorliegen — ein
Server mit Netzzugang und die eigene UID. Beides steht ohnehin auf der Liste.

Der Trockenlauf bleibt unverändert; seine Fähigkeit `uidAbfrage` ist als
technische Anbindung zu lesen, nicht als Nachweisfähigkeit. Diese Datei ist der
Ort, an dem der Unterschied steht.

## Im Funktionsmuster

Weil der Dienst von dort ebenfalls nicht erreichbar ist, steht in der Kasse ein
Auswahlfeld, das jede der vier Antworten **simuliert**. Es ist als Simulation
gekennzeichnet und zeigt, wie der Shop jeweils reagiert — die vier Zeilen der
Tabelle oben sind damit anklickbar statt nur behauptet.
