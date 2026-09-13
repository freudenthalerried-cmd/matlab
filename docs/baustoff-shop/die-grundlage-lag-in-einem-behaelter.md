# Die Grundlage lag in genau einer Kopie

**8. September 2026.** Die Arbeitsumgebung wurde neu aufgesetzt. Danach fehlte
`preise/baustoff-preise.json`, und `npm run website` sagte einen Satz:

```
Die Preisdatei fehlt: preise/baustoff-preise.json — ohne sie keine Website.
```

Die Datei stand seit dem ersten Tag in `.gitignore`, und das war richtig: Sie
trägt die Einkaufskonditionen des Lieferanten, und dieses Verzeichnis ist
öffentlich. Nur hieß dieselbe Entscheidung eben auch:

> **Die Zahl, auf der alles ruht, lag in genau einer Kopie — in einem
> Behälter, der jederzeit neu aufgesetzt wird.**

Sechsundvierzig Einkaufspreise aus fünfzehn Lieferantenrechnungen. Jeder
Verkaufspreis, jeder Deckungsbeitrag, Gate 20, Gate 22, Gate 25, die ganze
Kalkulation — alles hängt daran.

---

## Was sich zurückholen ließ: alle 46

`npm run pruefe-geheimnis` misst seit dem 30. August, dass aus den
**veröffentlichten** Verkaufspreisen und der dokumentierten Zielmarge die
Einkaufspreise auf den Cent zurückzurechnen sind. Der Befund war als **Warnung**
gemeint — er ist der Grund für die Empfehlung, das Verzeichnis privat zu
stellen.

Heute war dieselbe Rechnung der Rettungsweg. `npm run preise-wiederherstellen`
liest `ausgabe/site/shop.js` — die gebaute Ausgabe liegt im Verzeichnis — und
rechnet zurück: `ekNetto = vkNetto × (1 − Marge)`.

**Drei hängen am Listendeckel**, und dort greift die Rückrechnung nicht
zwingend: Jeder Einkauf oberhalb einer Schwelle ergibt denselben gedeckelten
Verkaufspreis. Für zwei davon war die Abweichung am 30. August **gemessen und
aufgeschrieben** — in `rekonstruierbare-einkaufspreise.md`, dem Dokument, das
vor genau dieser Rückrechenbarkeit warnt. Beim dritten trifft die Rechnung; das
stand implizit in derselben Messung („zwei weichen ab").

**Damit sind es 46 von 46.** Und der Fund dahinter ist unangenehmer als der
Verlust.

**Und keiner davon heißt „belegt".** Jeder Eintrag trägt
`ekQuelle: 'rekonstruiert'`:

> **Ein Wert, der stimmt, ist noch kein Wert, der belegt ist.**

Was daraus folgt, entscheidet Gate 30 weiter unten — und zwar anders, als es
zuerst aussah.

---

## Der zweite Fund: Die Einkaufspreise standen im Verzeichnis

Die zwei Werte, die den Bestand gerettet haben, standen im Klartext in einem
öffentlichen Repository. Nachgesehen wurde daraufhin überall — mit den
Beträgen selbst als Suchmuster, nicht mit einer Regel:

**Fünf Fundstellen in vier Dokumenten.** Ein Einkaufspreis in Sichtweite eines
Einkaufsworts, jedes Mal beiläufig: „… € Einkauf für hundert Stück" als
Begründung, warum ein Dübel keine Kampagne anhält — derselbe Betrag in zwei
Runden. Und die Tabelle „rekonstruiert / tatsächlich / daneben", aus der sich
der Einkauf gleich dreifach ergibt.

> **Der Prüfer sah in die Ausgabe. Das Verzeichnis ist genauso öffentlich.**

`pruefe-geheimnis` hat vier Durchgänge, und alle vier lesen `ausgabe/`: Was
lädt der Besucher? Dass daneben 382 Dokumente liegen, die jeder abrufen kann,
war nie Teil der Frage.

**Durchgang 5** hält seither jedes Dokument gegen jeden Einkaufspreis der
Preisdatei. Gesucht werden die **Zahlen selbst**, gemeldet wird nur, was in
Sichtweite eines Einkaufsworts steht — ein Betrag allein ist kein Fund. Der
erste Anlauf meldete vier Fehlalarme — er fand die Endziffern eines
Einkaufspreises **in** einem viel größeren Erlösbetrag; seither muss der Betrag
vorne zu Ende sein.

Die fünf Stellen sind heraus. Das Argument steht überall noch: Der Dübel ist
billig, die Rückrechnung greift bei zweien zu tief — nur die Zahl fehlt.

**Und dann fing der Prüfer seinen eigenen Verfasser.** Dieses Dokument nannte
in seiner ersten Fassung zwei der Beträge — einmal als Beispiel für den Fund,
einmal als Beispiel für den Fehlalarm. Beide standen in Sichtweite eines
Einkaufsworts, beide waren echte Einkaufspreise, und der Gesamtlauf meldete
sie eine Stunde nach dem Aufräumen.

> **Wer über ein Leck schreibt, zitiert es.**

Auch das ist heraus. Der Fehlalarm heißt jetzt „die Endziffern eines
Einkaufspreises in einem viel größeren Erlösbetrag" — das erklärt ihn genauso
und nennt nichts.

---

## Der dritte Fund: Der Katalog kannte den Fall, der Bau nicht

Mit der lückenhaften Preisdatei brach `npm run website` ab — nicht mit einer
Meldung, sondern mit `TypeError: Cannot read properties of null (reading
'toLocaleString')`, mitten in einer Artikelkarte.

`ladeBaustoffkatalog` führt seit jeher eine Liste `ohnePreis` und schreibt jedem
solchen Artikel den Grund im Klartext dazu. Gelesen hat sie nie jemand:
`katalogbefund` reichte sie nicht weiter, und der Bau erfuhr nichts davon.

> **Der Katalog kennt den Fall; der Bau erfuhr nie davon.**

Bis heute konnte er auch nicht auffallen — die Preisdatei hatte noch nie eine
Lücke.

Der Absturz war dabei das bessere Ende. Das schlechtere wäre eine Seite mit
„null €" gewesen, oder, schlimmer, ein Shop, der drei Artikel stillschweigend
weglässt. Gate 24 sagt es zwei Absätze weiter oben in derselben Datei: *Eine
Ware, die aus dem Katalog fällt, ohne dass es jemand sieht, ist derselbe Fehler
wie eine Zahl, die berechnet und verschwiegen wird.*

Der Bau **weigert sich** jetzt und nennt die Artikelnummern.

---

## Was daraus folgt

**Gate 30, selbst entschieden.** „Platzhalter" heißt: Die Zahl ist nicht der
Preis. Hier **ist** sie der Preis — was fehlt, ist die Rechnung, die es
beweist. Beides gleich zu nennen wäre selbst eine falsche Angabe, und zwar
über die eigene Ware: Der Shop schriebe dem Kunden auf 46 Artikelseiten hin,
sein Preis sei erfunden, obwohl er stimmt. Der Mangel liegt im **Beleg**, nicht
im Wert, und steht als offener Punkt dort, wo Mängel hingehören.

**Für den Auftraggeber:** Die Rechnungen wieder einlesen, dann steht
`ekQuelle` wieder auf „bestaetigt". Und die Preisdatei gehört an einen zweiten
Ort — sie ist die einzige Zahlengrundlage des ganzen Vorhabens und war bis
heute nirgends gesichert.

**Nicht zurückzuholen ist `preise/poschacher-positionen.csv`** — die
Rechnungspositionen mit Datum. Sie ergibt sich aus keiner Ausgabe. **Zwei
Prüfer** hängen daran: `npm run preiswechsel` (der Preisrhythmus) und
`npm run pruefe-gebinde` (18 Artikel gegen fakturierte Mengen). Beide weigern
sich seither — *„Ohne sie ist hier nichts zu messen, und ein grüner Lauf über
nichts wäre eine Lüge."*

---

## Rot ist nicht dasselbe wie nicht messbar

Der Gesamtlauf zählte diese Weigerung als Befund und schrieb „Ausgang 2" —
dieselbe Zeile wie bei einem echten Fund.

Beides ist nicht grün, und beides bleibt es. Aber es ist ein Unterschied, ob
ein Prüfer **etwas gefunden hat** oder ob ihm die **Grundlage fehlt**: Das eine
behebt man im Bestand, das andere kann nur, wer die fehlende Datei hat.

> **Ein Prüfer ohne Grundlage hat nichts gefunden — er hat nichts gesucht.**

Ausgang 2 ist im ganzen Bestand die Weigerung, Ausgang 1 der Befund. Der Lauf
liest das jetzt: Solche Schritte erscheinen als `⃠ nicht messbar` mit ihrem
Grund und stehen am Ende noch einmal beisammen. Grün wird davon nichts, und
der Lauf endet weiter rot — *was nicht gemessen wurde, ist nicht geprüft.*

**Und eine Ebene tiefer dasselbe.** Die beiden Gegenproben zu `pruefe-gebinde`
meldeten „war schon vorher rot — an einem roten Prüfer lässt sich nichts
zeigen" und beschuldigten damit einen Prüfer, der nichts falsch gemacht hat.
Genau das Muster, das am 4. September schon einmal auffiel, als das veraltete
Erzeugnis fünf Gegenproben rot färbte. Sie sind jetzt **zurückgestellt**, nicht
gescheitert:

> **Was nicht gemessen werden kann, ist nicht widerlegt.**

**Für dieses Verzeichnis:** Der Bau läuft wieder, die 1.880 Testfälle sind
grün, und `npm run alles` steht bei **42 von 43 Schritten grün — einer nicht
messbar**. Jede Preisangabe trägt „rekonstruiert" statt „bestätigt", und der
offene Punkt sagt, was das heißt.

Das ist der Zustand, den dieser Tag hinterlässt: Alles, was gemessen werden
kann, ist gemessen; das eine, was nicht geht, sagt warum.

**Und ein Gedanke, der bleibt:** Der Befund „44 von 46 Einkaufspreisen sind aus
den veröffentlichten Verkaufspreisen rekonstruierbar" stand sechs Wochen lang
als Warnung im Verzeichnis. Heute war er das Einzige, was die Arbeit von sechs
Wochen gerettet hat. Dieselbe Eigenschaft, dasselbe Vorzeichen — nur die Frage,
wer rechnet, hat sich geändert.
