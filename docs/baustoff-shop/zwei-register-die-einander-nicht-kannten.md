# Zwei Register, die einander nicht kannten

**11. September 2026. Runde 28.**

## Was gemessen wurde

Zwei Register dieses Bestandes beschreiben dieselbe Sache — **was rot werden
kann**. `src/pruefregister.js` führt die Prüfer und sagt je Prüfer, welchen
Umfang er mindestens angesehen haben muss. `src/gegenprobenregister.js` führt
je Prüfer die Mutation, die ihn rot machen muss.

Das zweite verlangt von jedem genannten Namen, dass es ihn als npm-Befehl
gibt — ein Tippfehler wäre sonst eine Gegenprobe, die es nicht gibt. **Keines
der beiden fragt das andere.** Gemessen, in beide Richtungen:

| Richtung | gefunden |
| --- | --- |
| Gegenprobe da, Prüfer in keinem Register | **acht** Namen |
| Prüfer im Register, keine Gegenprobe und kein begründeter Verzicht | **drei** |

Der schärfste Fall ist `wegprobe`. Sie geht den Weg **vom Anzeigenklick** bis
zur fertigen Anfrage — also genau den, den das ganze Werbebudget kauft. Sie
hat **drei Gegenproben**: Der Bestand hat dreimal bewiesen, dass sie
anschlägt. Und sie stand in keinem Lauf, weder im Gesamtlauf noch im Haken.

> **Die Umkehrung eines Prüfers ohne Gegenprobe: Man hatte dreimal gesehen,
> dass sie anschlägt, und nie, dass sie schweigt.**

Auf der anderen Seite standen `oberflaechenprobe` und `rahmenzensus` — zwei
Browserproben, die seit Wochen in jedem Gesamtlauf grün melden und die noch
**nie jemand rot gesehen hat**. Der Bestand sagt dazu seit dem 2. September:
*Eine Gegenprobe, die man nicht anschlagen sieht, ist keine.* Für diese beiden
hat es nie jemand angesehen.

## Was geändert wurde

**Drei Befehle stehen jetzt im Prüferregister** und laufen damit in jedem Lauf
mit: `wegprobe` (Browserprobe), `rollout` (88 ms) und `abnahme` (217 ms).

**Sechs stehen mit Grund daneben**, in der neuen Liste `KEIN_PRUEFER`. Der
Unterschied ist nicht die Farbe, sondern der Gegenstand:

> **Ein Prüfer wird rot über den Bestand, ein Werkzeug über seine eigene
> Eingabe oder Handlung.**

`kampagne` und `website` bauen und weigern sich, Unvollständiges zu schreiben.
`test` hat eine eigene Zählweise und einen eigenen Schritt. `schnelllauf` ruft
die Prüfer, statt zu messen. `aufwand` rechnet eine Schätzung.

**Drei Gegenproben sind dazugekommen** — für `abnahme`, `oberflaechenprobe`
und `rahmenzensus`. Die beiden letzten sind Browsergegenproben und haben am
selben Abend zum ersten Mal angeschlagen:

* ein Messwert von genau 300 Bq/m³ gilt als Überschreitung → die
  Oberflächenprobe meldet das Szenario, das die falsche Rechtsauskunft fängt;
* das Suchfeld bekommt eine Mindestbreite über der Fensterbreite → der Zensus
  meldet Seiten, die auf einem Telefon seitlich hinausrollen.

**Und der neue Prüfer `npm run pruefe-register`** hält beide Register
gegeneinander — 59 Prüfer, 6 begründete Ausnahmen, 64 Namen aus den
Gegenproben. Er läuft in 70 ms und damit nach Gate 38 vor jedem Commit.

## Was der erste Versuch gekostet hat

`pruefe-pruefer` stand eine halbe Stunde lang im Register oben. Er ist
unbestreitbar ein Prüfer, er hat eine Gegenprobe, und seine 113 Sekunden wären
im Gesamtlauf zu verschmerzen gewesen.

Der Testlauf hat es beantwortet, und zwar nicht mit einer Meldung, sondern mit
einem Prozessbaum: **Er liest diese Liste, um jeden Prüfer aufzurufen.** Mit
sich selbst darin ruft er sich selbst — und nicht einmal, sondern immer
weiter. Nach zehn Minuten standen neun Kopien nebeneinander, und `npm test`
war nach einer Viertelstunde noch bei keiner Ausgabe.

> **Ein Prüfer, der seine eigene Liste liest, gehört nicht hinein.**

Dieselbe Gestalt wie der Hakenprüfer, der nicht im Haken läuft — nur endet
dieser hier nicht langsam, sondern gar nicht. Er steht jetzt in
`KEIN_PRUEFER`, mit genau diesem Grund.

## Und eine Grenze, die sich selbst nachmisst

Gate 38 von gestern sagt: *Was unter einer Sekunde bleibt, läuft vor jedem
Commit.* Wer in der Auswahl steht, war am Tag der Messung schnell genug — und
nichts hielt das nach. Am selben Abend ist es eingetreten: `wegprobe` kam ins
Register, landete im Schnelllauf und kostete dort **mehr als die anderen
dreiundvierzig zusammen** (7,9 s statt 6,9 s).

> **Eine Grenze, die einmal gemessen wurde, ist eine Behauptung über den Tag,
> an dem gemessen wurde.**

Der Schnelllauf stoppt jetzt jeden Prüfer einzeln und meldet jeden über der
Sekunde — mit dem Weg heraus. **Rot wird davon nichts:** Ein langsamer Prüfer
ist kein Fehler im Bestand, und eine Sperre über eine Laufzeit hielte
irgendwann einen Commit auf, weil der Rechner gerade beschäftigt war.
`wegprobe` steht jetzt mit 2,4 gestoppten Sekunden bei den Browserproben in
`NICHT_IM_HAKEN`.

## Ausgang

| | |
| --- | --- |
| Prüfer im Register | 55 → **59** |
| davon vor jedem Commit | 47 → **46** (`wegprobe` ist wieder heraus) |
| begründete Ausnahmen vom Haken | 8 → 9 |
| Befehle, die kein Prüfer sind — mit Grund | **6** (neu) |
| Prüfer ohne jede Gegenprobe | 3 → **0** |
| Testfälle | 10 neu, 2313 grün |
| Gegenproben | 185 → **189**, davon 2 neue Browserproben |

## Was daraus offen bleibt

Nichts Neues für den Auftraggeber. Offen bleibt die Frage, die dieser Abgleich
aufwirft und nicht beantwortet: Von den sechsundneunzig Befehlen in
`package.json` haben **dreiundzwanzig** einen roten Ausgang und stehen in
keinem Register — die meisten zu Recht, weil sie bauen statt zu prüfen. Nur
gefragt hat sie bisher niemand. Dieser Abgleich fragt sie erst, wenn eine
Gegenprobe sie nennt.

---

**Die Regel dieser Runde:** *Zwei Listen über dieselbe Sache sind erst dann
eine Prüfung, wenn eine die andere liest.*
