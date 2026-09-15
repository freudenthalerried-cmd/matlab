# Wo man den Korb füllt

**5. September 2026.** Die Runde davor hat die Anzeigen und ihre Ausschlüsse
gelesen und aufgeschrieben, was fehlt: **die Landeseiten**. Dort endet der
bezahlte Klick — 4,19 € bis 8,22 €.

Die Seite selbst ist gut. `gruppe/wdvs.html` nennt im zweiten Satz die Lücke
(„Die Dämmplatte in Flächenstärke führen wir nicht"), sagt netto, nennt das
Liefergebiet, weist die Fracht getrennt aus, erwähnt Selbstabholung und
übersetzt jede Position in die Sprache des Leistungsverzeichnisses.

Eines fehlt.

---

## Die Grenze steht dort, wo man nichts bestellt

Der Mindestbestellwert — Gate 25, **250 € netto Warenwert je Lieferung**, die
Grenze, an der die Kasse eine Anfrage abweist — stand auf **48 der 81**
gebauten Seiten: auf jeder der 46 Artikelseiten, auf `lieferung.html` und in
den AGB.

Er stand auf **keiner** Seite mit Artikelkarten:

| Seite | Karten |
|---|---|
| Startseite | **46** |
| 7 Gruppenseiten | 1 bis 11 |
| 4 Systemlisten | 13 bis 20 |
| 7 Wissensseiten | 6 bis 11 |

> **Die Grenze steht auf jeder Seite, auf der man einen Artikel ansieht — und
> auf keiner, auf der man eine Bestellung zusammenstellt.**

Das ist die genaue Umkehrung dessen, was nötig wäre. Eine Artikelseite sieht
man für **einen** Artikel; auf einer Gruppenseite, einer Systemliste oder der
Startseite entsteht der Korb.

Und drei dieser Seiten sind die **Landeseiten der bezahlten Anzeigen**. Der
Klicker liest „Kantenschutz 0,95 € je lfm, ab 2,5 lfm · 2,38 €", legt in den
Korb — und erfährt die Grenze frühestens in der Kasse.

Dieselbe Familie wie der Befund vom 2. September: *„Eine Sperre, die erst nach
dem Ja greift, ist keine."* Damals wurde die Sperre vorgezogen. Die
**Auskunft** kommt bis heute erst, wenn die Grenze reißt —
`zeigeMindestwert()` in `shop-ui.js` zeigt den Satz nur bei `!erfuellt`.

---

## Eine Stelle statt vier

Der Absatz steht jetzt auf allen 64 Seiten mit Karten. Eingebaut ist er nicht
in den vier Seitenbauern, sondern **dort, wo die fertige Seite zusammengesetzt
wird**:

```js
function mitMindestwert(html, verweis) {
  if (!html.includes('class="karte"')) return html;
  if (html.includes('Mindestbestellwert')) return html;
  …
}
```

> **Ein Absatz, den jeder Seitentyp selbst anhängt, ist ein Absatz, den ein
> fünfter Seitentyp vergisst.**

Diese Stelle sieht die fertige Seite: Trägt sie eine Karte und nennt die
Grenze noch nicht, bekommt sie den Satz — einmal, und ohne Doppelung auf den
Artikelseiten, die ihn ohnehin tragen.

**`npm run pruefe-seiten` hält es unabhängig davon nach**, am Erzeugnis und
nicht am Bauer: Jede gebaute Seite mit `class="karte"` muss die Grenze nennen.
Findet der Lauf weniger als fünfzehn Kartenseiten, ist er leer und nicht
sauber.

---

## Der Stand, gelesen statt abgeschrieben

Der erste Wurf des Absatzes wurde von der eigenen Prüfung abgewiesen:

> `→ Preis ohne Stand — er ist in vier Wochen falsch`

Neunzehnmal, an neunzehn frisch gebauten Seiten. Zu Recht: 250,00 € ist ein
Betrag, und jeder Betrag auf diesen Seiten trägt seine Herkunft.

Das Datum steht in `data/betreiber.json` — im Feld
`_mindestbestellwertHinweis`, das mit „GATE 25, entschieden am **03.09.2026**"
beginnt und danach die ganze Herleitung trägt (Nulldurchgang von Gate 20,
Frachtpauschale, Palette, Folierung, Zielmarge).

Es hier noch einmal hinzuschreiben wäre eine Abschrift, die beim nächsten
Beschluss stehen bliebe — **derselbe Fehler wie die abgeschriebene Schwelle
vom Vormittag** (`dreiunddreissig-von-zweiunddreissig.md`). Das Datum wird
deshalb aus dem Feld gelesen. Fehlt es, nennt der Absatz die Zahl gar nicht.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-seiten` bekam eine Regel |
| Neue Gates | keine |
| Gegenproben | **67 für 35 Prüfer** (vorher 66) |
| Seiten mit der Grenze | **64 von 64 Kartenseiten** (vorher 0) |
| Testfälle | 1634 |

## Ein Nachtrag zum Gesamtlauf

Der erste Lauf nach dieser Änderung meldete `oberflaechenprobe` rot. Einzeln
liefen alle elf Szenarien grün.

Beim Nachsehen: **9.417 Wegwerfverzeichnisse unter `/tmp`** — `beispiel-`,
`startklar-`, `leer-`, `halb-`, `sparten-`. Die Zeitstempel entscheiden die
Frage: Der jüngste stammt vom **4. September, 17 Uhr**, und `src/wegwerf.js`
gibt es seit dem Abend desselben Tages. Seither räumt jede Probe auf; keiner
der Ordner ist von heute.

Es ist also **kein neuer Befund, sondern der Rückstand des alten** — die
Runde vom 4. September hat das Aufräumen eingebaut und den Altbestand
stehenlassen. Er ist jetzt weg (1.072 Einträge statt 10.489), und der
Wiederholungslauf ist grün.

**Ob der Rückstand die Ursache war, sage ich nicht.** Ein Fehlschlag, der beim
zweiten Lauf verschwindet, ist damit nicht erklärt; er ist unerklärt und steht
hier, damit ein späterer Lauf ihn wiedererkennt, falls er wiederkommt.

## Was offen bleibt

- **Die Kasse nennt die Grenze weiter erst beim Reißen.** Das bleibt so: Wer
  den Korb gefüllt hat, hat den Satz auf jeder Seite gelesen, auf der er
  gesammelt hat; eine Warnung über einem Korb, der die Grenze erfüllt, wäre
  Lärm. Aufgeschrieben, damit es eine Entscheidung bleibt und kein Versehen.
- **Die Landeseiten sagen nichts über die Antwortzeit**, weil keine zugesagt
  ist (offener Punkt beim Auftraggeber). Der Klicker erfährt in der Kasse,
  dass er eine Rückmeldung bekommt — ohne Frist.
- **Die vier Systemlisten nennen keine Summe.** Sie sind Zählanleitungen
  („Fünf Zahlen aus dem Plan"), keine Preislisten; ob eine ausgezählte
  Grundleitung die 250 € erreicht, weiß erst die Kasse. Mit der Grenze auf der
  Seite ist das jetzt wenigstens gesagt.
