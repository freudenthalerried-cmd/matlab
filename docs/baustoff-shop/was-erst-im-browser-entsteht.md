# Was erst im Browser entsteht, prüft keine Datei

**2. September 2026.** Am Vormittag lief eine Gegenprobe ins Leere: Sie schrieb
eine erfundene Antwortzeit in die Kasse, und `pruefe-seiten` blieb grün. Der
erste Reflex war, den Prüfer zu verdächtigen. Er war unschuldig — er liest die
**gebauten** Seiten, und der Satz steht in keiner. Er entsteht erst im Browser.

> **Was erst im Browser entsteht, prüft keine Datei.**

Das ist der vierte Fall derselben Familie in vier Tagen: am 30. August die
Belege, die kein Prüfer las; am 1. September `shop-ui.js`, das in keinem
Widerrufsbestand stand; am 2. September morgens die Oberfläche, die kein
Widerruf erreichte. Jedes Mal war nicht das Urteil falsch, sondern die Menge,
über die geurteilt wurde.

## Der Bestand: 23 Sätze

`oberflaechensaetze()` in `src/inhaltspruefung.js` liest die Zeichenketten aus
`shop-ui.js` und behält, was eine Aussage sein kann: mindestens dreißig Zeichen,
ein deutsches Wortpaar, kein Klassenname und kein Auswahlausdruck. Übrig
bleiben **23 Sätze** — der Kassenhinweis, die Frachterklärung im Warenkorb, die
Meldungen des Kopierknopfs, die Hinweise der leeren Liste.

Zwei Entscheidungen dabei sind nicht Feinschliff:

**Verkettete Literale werden zusammengezogen.** Im Quelltext steht ein Satz über
drei Zeilen mit `+` dazwischen. Einzeln geprüft wäre jedes Stück ein Fragment,
und eine Zahl im einen Stück hätte ihre Quelle nie im selben. Der Kunde liest
den ganzen Satz, also wird der ganze geprüft.

**Die Schwelle ist grob.** Dreißig Zeichen und ein Wortpaar lassen eher einen
Satz zu viel durch als eine Zusage zu wenig. Ein Fehltreffer kostet einen Blick;
eine übersehene Zusage kostet einen Kunden.

## Der erste Befund: 1 von 23

Ein Satz meldete Verdacht — der Frachtsatz im Warenkorb:

> Die Frachtpauschale hängt an der Fahrt, nicht am Warenwert: Der zugestellte
> Beleg über 1.934 € netto trägt dieselbe Pauschale wie der über 614 € netto.

Zwei Zahlen, keine Quelle, kein Stand. Beides steht seit Tagen auf der
Wissensseite [warum-keine-gratislieferung](../../shop/inhalte/wissen/warum-keine-gratislieferung.md)
— dort mit `Quelle: eigene Lieferantenrechnungen, Stand: 2026-08-31`. Auf dem
Weg in die Oberfläche ist die Herkunft verlorengegangen. Sie steht jetzt auch
dort. Danach: 23 Sätze, 0 mit Verdacht.

## Der zweite Befund: die Gegenprobe war wieder falsch

Der neue Prüfer bekam seine Gegenprobe zurück — `oberflaeche-erfindet-antwortzeit`
setzt „innerhalb von 24 Stunden" in die Kasse. Und er blieb **grün**.

Zum dritten Mal an zwei Tagen war nicht die Sache falsch, sondern meine Probe.
`ZAHL_MIT_EINHEIT` kennt `h`, `min` und `Std`. Es kennt nicht „Stunden" — und
das aus einem guten Grund, der seit dem 28. August im Quelltext steht:
ausgeschriebene Zeitwörter und ihre Abkürzungen stehen am Anfang zu vieler
deutscher Wörter, um sie über 274 Dateien Fließtext gefahrlos zu suchen.

Zwei Auswege standen zur Wahl:

1. **Die Mutation auf etwas ändern, das die Regel trifft** — ein Eurobetrag
   etwa. Billig, und sie hätte etwas anderes geprüft als das, worum es geht.
2. **Die allgemeine Zahlenregel weiten.** Gemessen kostet das heute nichts: Über
   `inhalte/` und die 23 Oberflächensätze gelegt findet die geweitete Fassung
   **null** neue Treffer. Aber sie hätte einen Preis in der Zukunft — sobald der
   Auftraggeber `antwortzeitWerktage` beantwortet, sagt die Kasse „innerhalb von
   2 Werktagen", und die Regel verlangte dafür eine Quellenangabe in einem
   Oberflächensatz. Eine Zusage ist keine Messung; ihre Herkunft ist der
   Betreiber selbst.

Gewählt wurde ein dritter Weg, der schärfer ist als beide.

## Die Regel: eine feste Zeitspanne im Quelltext ist immer erfunden

Jede echte Frist des Shops steht in den Daten und wird zur Laufzeit eingesetzt.
Die Kasse baut ihre Werktage aus `betreiber.antwortzeitWerktage`, die
Lieferzeiten kommen aus dem Katalog. Im Quelltext bleibt dann nur
`'… innerhalb von '` stehen — die Zahl taucht in **keinem** Literal auf.

Daraus folgt eine Regel ohne Grauzone:

> **Steht in einem Oberflächensatz eine ausgeschriebene Zeitspanne mit fester
> Zahl, ist sie von Hand hingeschrieben und von nichts gedeckt.**

`ZEITZUSAGE` sucht Sekunden bis Jahre, aber nur auf diesen 23 Sätzen. Was auf
274 Dateien Fließtext zu weit wäre, ist hier eng genug — und es kann die
berechtigte Zusage nicht treffen, weil die berechtigte Zusage im Quelltext
keine Zahl hat.

Heutige Ausbeute: null. Das schmälert den Zweck nicht. Die Regel bewacht die
Stelle, an der eine Zusage **entsteht**, nicht die, an der schon eine steht.

Danach schlägt die Gegenprobe an: `13 von 14`.

## Was der Lauf noch aufdeckte

Der Eintrag im Prüferregister trug `werkzeug: 'inhaltspruefung.mjs --oberflaeche'`
— ein Dateiname mit angehängtem Argument. `prueferpruefung.mjs` setzt den Wert
als Pfad ein und die Argumente aus einem eigenen Feld `argumente`; der Eintrag
lief damit ins Nichts und meldete „1 ohne belastbaren Umfang". Berichtigt.

Und der fünfzehnte Prüfer machte die PR-Beschreibung überholt: Sie sagte 14. Der
Schaufensterprüfer hat es gemeldet, bevor es der Auftraggeber lesen konnte —
genau wofür er gebaut ist.

## Stand

| | |
|---|---|
| Oberflächensätze im Bestand | 23 |
| davon mit Verdacht | 0 |
| Prüfer ohne Browser | 15 |
| Gegenproben, die anschlagen | 13 von 14 |
| Tests | 1209 |

Die eine Gegenprobe ohne Nachweis ist `pruefe-schaufenster` in diesem Lauf: Der
Prüfer war vorher rot, und an einem roten Prüfer lässt sich nichts zeigen. Nach
dem Nachziehen der Zahl ist er grün; die Probe holt ihren Nachweis beim
nächsten Lauf nach.
