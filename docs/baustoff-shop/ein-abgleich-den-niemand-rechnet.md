# Ein Abgleich, den niemand rechnet

**10. September 2026**

Seit dem 9. September wird die veröffentlichte PR-Beschreibung zurückgelesen
und gegen die Werkzeugausgabe gehalten. Die Bilanz nach sechs
Veröffentlichungen: **vier Abweichungen**, jedes Mal dieselbe Ursache — das
Werkzeug gibt den Text aus, übertragen muss ihn ein Mensch, und wer dabei noch
einen Satz ergänzt, der gerade richtig ist, veröffentlicht einen Text, den die
Quelle nicht kennt.

Dieser Abgleich war die eigentliche Schwachstelle:

> **Ein Abgleich, den niemand rechnet, findet nur, was auffällt.**

Er war ein **Augenvergleich**. Die zurückgelesene Fassung kam als Antwort eines
Werkzeugs, nicht als Datei — und sie in eine Datei zu bringen hieße, sie erneut
abzutippen, also genau den Schritt zu wiederholen, der die Abweichungen
erzeugt. Ein solcher Vergleich findet den dazugeschriebenen Satz und übersieht
das Komma.

---

## Erster Teil: Die Fassung trägt ihren eigenen Fingerabdruck

`npm run pr-text` hängt seither eine letzte Zeile an:

```
<!-- fingerabdruck sha256:bd59c56d… · Quelle: docs/baustoff-shop/pr-beschreibung.md
     · geprüft mit `npm run pruefe-marke` -->
```

GitHub zeigt HTML-Kommentare nicht an. Die Marke steht **in** der Beschreibung
und nicht auf ihr: Wer den Text liest, sieht sie nicht; wer ihn prüft, findet
sie in der ersten Zeile von unten.

**Was das umdreht.** Vorher brauchte eine Prüfung zwei Fassungen
nebeneinander — die veröffentlichte und die Quelle. Jetzt prüft sich die
veröffentlichte Fassung **gegen sich selbst**: hashen, was über der Marke
steht, mit der Marke vergleichen. Die Quelle kommt in der Rechnung nicht mehr
vor, und deshalb kann sie auch jemand ausführen, der sie nicht hat.

**Was das fängt und was nicht.** Es fängt genau den Fehler, der viermal
passiert ist: Ein beim Übertragen dazugeschriebener Satz ändert den Text und
nicht die Marke — heute nachweisbar und in einem Jahr noch. Es fängt **nicht**,
dass jemand Text *und* Marke zusammen neu setzt; dagegen hilft keine Prüfung,
die im selben Kopf abläuft wie die Änderung. Aus einem unbemerkbaren Fehler
wird ein dauerhaft nachweisbarer, mehr behauptet die Marke nicht.

---

## Zweiter Teil: Und dann war die Grenze wieder zu weit gezogen

Die Marke allein hätte den Abgleich nicht gerettet. Um sie zu prüfen, braucht
man die veröffentlichte Fassung **als Datei** — und genau das galt hier als
unmöglich. In `data/aussenlage.json` stand:

> *„Der Shop kann keines der beiden Felder selbst erheben: Sein Netzausgang ist
> gesperrt."*

Gemessen war das an drei Adressen: `bauversand.com`, den Herstellerseiten und
dem Rechtsinformationssystem. Alle drei antworten mit `CONNECT tunnel failed,
response 403`. Für `api.github.com` hatte es **niemand versucht**.

```
api.github.com/repos/…/pulls/14   HTTP 200 · 54.386 Bytes
www.baumit.at                     CONNECT tunnel failed, 403
bauversand.com                    CONNECT tunnel failed, 403
github.com                        HTTP 400
```

Dieselbe Umgebung, dieselbe Minute. **Die Sperre ist nach Adresse verschieden
und nicht der Ausgang als solcher.**

> **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
> ausschließt** — zum dritten Mal in fünf Runden. Und diesmal deckte sie
> ausgerechnet den Abgleich, der die vier Abweichungen hätte finden sollen.

---

## Was daraus folgt: der erste Prüfer, der nach draußen sieht

`npm run abgleich-veroeffentlichung` holt die veröffentlichte Beschreibung
selbst und stellt **zwei** Fragen, die verschieden sind:

| Frage | Antwort am 10. September |
|---|---|
| Deckt sich die Fassung mit ihrer eigenen Marke? | ✓ 33.587 Zeichen gedeckt |
| Ist sie Zeichen für Zeichen die Ausgabe von `npm run pr-text`? | ✓ |

Die erste sagt, ob beim Übertragen etwas dazugekommen ist. Die zweite sagt, ob
die **richtige** Fassung draußen steht — eine alte, in sich stimmige
Veröffentlichung besteht die erste Prüfung und fällt bei der zweiten durch. Das
war der Fall vom 5. September, und er hat dreimal niemand bemerkt.

Ohne Netz weigert sich das Werkzeug mit Ausgang 2. *Nicht messbar ist nicht
grün* — und ein Prüfer, der behauptete, GitHub gesehen zu haben, wäre eine
Behauptung mit Ziffern.

**Zum ersten Mal gerechnet statt gelesen:** Die heute veröffentlichte Fassung
ist ohne Augenvergleich und ohne Abtippen geprüft. Sie stimmt.

---

## Zwei Fehler beim Bauen

**Der Prüfer meldete `trenner-fehlt` über seine eigene, fehlerfreie Ausgabe.**
Die erste Fassung setzte den Text über die Zeilenliste zusammen — `zeilen.slice(0, i)`
— und hashte damit die Leerzeile mit, die zur Marke gehört. *Ein Zeichen
daneben ist beim Hashen kein Zeichen daneben, sondern ein anderer
Fingerabdruck.* Gemessen wird seither am ganzen String.

**Die erste Gegenprobe war grün, und zwar zu Recht.** Sie mutierte das
Werkzeug, das die Marke *setzt*: Dann wächst die Marke mit, die Fassung bleibt
in sich stimmig, und es gibt nichts zu melden. Eine Prüfung, die eine Fassung
gegen sich selbst hält, lässt sich nicht dadurch aushebeln, dass man beide
Seiten gleich verändert — **mutiert werden muss die Naht zwischen ihnen.** Die
Probe sitzt jetzt dort und schlägt an.

---

## Was das nicht löst

Die Marke sichert den Weg vom Werkzeug zur Veröffentlichung. Sie sagt nichts
darüber, ob der Text **richtig** ist — das misst `pruefe-schaufenster` mit
seinen 36 Kennzahlen, und über die Prosa daneben urteilt weiterhin niemand als
ein Leser.

Und die Grenzen, die heute gefallen sind, sind nicht alle Grenzen. Die
Herstellerseiten, das Rechtsinformationssystem und die eigene Domain bleiben
gesperrt — gemessen, mit Datum, auf beiden verfügbaren Wegen. Was sich geändert
hat, ist nur der Satz darüber: Er sagt jetzt, **welche** Adressen gesperrt
sind, und nicht mehr, der Ausgang sei es.
