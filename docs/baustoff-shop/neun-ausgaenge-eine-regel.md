# Neun Ausgänge, eine Regel

**11. September 2026. Runde 32.**

## Was die Runde davor offengelassen hat

Gestern kam heraus, dass Angebot, Auftragsbestätigung und Rechnung den Namen
des Lieferanten trugen — drei Nennungen in einem Angebot von 1.544 Zeichen —,
während `src/interna.js` genau diesen Namen seit dem 28. August als Bezugsweg
führt. Die Sperre steht seither in `bin/vorgang.mjs`.

Also **im Werkzeug**. Und das Ausgangsverzeichnis in `src/aussentexte.js`
zählt sechzehn Stellen, an denen Text den Shop verlässt:

| | |
| --- | --- |
| Ausgänge insgesamt | 16 |
| davon an einen Kunden oder jeden Besucher | **9** |
| davon gestern abgesichert | 3 (über das Werkzeug) |

> **Eine Sperre im Werkzeug gilt für den Weg durch dieses Werkzeug. Ein
> Ausgang ist aber eine Stelle, keine Strecke.**

Gemessen sind heute alle neun sauber — aber nichts hielt sie dort. Wer morgen
eine Zeile in den Anfragetext schreibt, hat niemanden, der widerspricht.

## Was geändert wurde

`test/ausgangsinterna.test.js` erzeugt an jedem kundennahen Ausgang einen
**fertigen Text** und schickt ihn durch `findeInterna`. Nicht den Quelltext
und nicht ein Feld: Der Fund von gestern saß in einer Überschrift, die aus
zwei Feldern zusammengesetzt wird — an keinem der beiden wäre er zu sehen
gewesen.

Sechs Ausgänge werden so geprüft. **Drei stehen mit Grund draußen**, und die
Gründe sind der eigentliche Ertrag der Aufzählung:

| Ausgang | warum keine Probe |
| --- | --- |
| `jsonFuerSkript` | kein eigener Text, sondern eine Einbettung — was an Interna hineingerät, entscheidet der Aufrufer, und über die Aufrufer läuft `pruefe-geheimnis` |
| `baueZip` | kein Text, sondern ein Archiv; es trägt nichts Eigenes hinein, und `npm run pruefe-paket` hält es byteweise gegen den Auslieferungsordner |
| `mailtoWeg` | eine Adresse, kein Text. Ihr Inhalt kommt aus `baueKundenanfrage` und wird dort geprüft — und die Kodierung machte einen Fund ohnehin unkenntlich: `%20Poschacher` fände kein Muster, das auf Wortgrenzen sieht |

`internabefund` hält beides gegeneinander, in beide Richtungen: ein
kundennaher Ausgang ohne Probe und ohne Grund ist ein Befund, ein Grund ohne
Ausgang auch, und ein Verzeichnis ganz ohne kundennahen Ausgang ist
ausdrücklich **kein grünes Ergebnis**.

## Die Hälfte, die beim ersten Wurf gefehlt hat

Der erste Wurf prüfte nur, dass der fertige Text **sauber** ist. Die
Gegenprobe hat ihn sofort widerlegt: Wer `findeInterna(text)` durch `[]`
ersetzt, bleibt grün — denn in einem sauberen Text findet auch ein blinder
Prüfer nichts.

> **Eine Probe, die den Text erzeugt und nicht hineinsieht, ist teurer als
> keine: Sie steht im Verzeichnis, zählt als Deckung und findet nichts.**

Dieselbe Regel wie am 6. September über die sieben Sperren, die alle nur ihren
Sperrgrund kannten und nie den grünen Fall — nur andersherum. Jeder Ausgang
bekommt jetzt **beides**: einen sauberen Kunden, der nichts auslösen darf, und
einen, dessen Firmenname „(vormals Poschacher Hoch- und Tiefbau)" enthält und
gefunden werden **muss**.

## Ausgang

| | |
| --- | --- |
| kundennahe Ausgänge | 9 — 6 geprüft, 3 mit Grund |
| Prüfungen je Ausgang | 2 (sauber muss schweigen, giftig muss melden) |
| Testfälle | 7 neu, 2341 grün |
| Gegenproben | 196 → **198** |

## Was daraus offen bleibt

Nichts Neues. Die Aufzählung wächst mit dem Bestand: Wer einen Ausgang
dazubaut, der an einen Kunden geht, bekommt beim nächsten Lauf die Frage
gestellt, ob jemand seinen fertigen Text ansieht.

---

**Die Regel dieser Runde:** *Eine Regel gehört an die Stelle, an der der Text
hinausgeht — nicht an den Weg, auf dem er heute dorthin kommt.*
