# Ein Rückweg, der ins Leere zeigt

*Lauf vom 15. September 2026, aus der Frage des Auftraggebers heraus. Ein neuer
Prüfer (`pruefe-kanaele`, 67 ohne Browser), drei Sätze berichtigt — und vier
eigene Fehler, von denen der Bestand jeden einzelnen gefunden hat.*

---

## Der Fund

Der Auftraggeber hat heute früh gefragt, ob ihn schon eine KI erreichen kann.
Beim Nachsehen kam etwas anderes heraus. Die Kasse sagt, wenn keine Mailadresse
hinterlegt ist:

> *„Bitte den Text kopieren und an die Adresse aus dem Impressum schicken."*

**Im Impressum steht auch keine.** Die E-Mail-Adresse ist seit dem
10. September einer der sieben Punkte auf dem Zettel für den Auftraggeber.

> **Ein Rückweg, der auf eine leere Stelle zeigt, ist kein Rückweg.**

Ein Kunde, der eine fertig gerechnete Positionsliste kopiert und sie dann
nirgends hinschicken kann, hat mehr Zeit verloren als einer, dem man es vorher
sagt. Und er sagt es niemandem — abgeschreckte Körbe stehen in keiner
Abrechnung.

**Zwei weitere Stellen habe ich gestern selbst geschrieben:** „…oder rufen Sie
uns an", in zwei Abweisungen des Empfangsskripts. Eine Telefonnummer führt
dieser Betrieb nirgends.

## Was jetzt dasteht

`rueckwegsatz()` baut den Satz aus dem, was wirklich in `data/betreiber.json`
steht — E-Mail vor Telefon, in der Reihenfolge, in der ein Kunde sie braucht.
Ist keines da:

> *„Eine Mailadresse und eine Telefonnummer sind noch nicht hinterlegt —
> dieser Shop kann Ihre Anfrage deshalb noch nicht entgegennehmen."*

Ohne Verweis aufs Impressum. Dort steht dasselbe Nichts, und ein zweiter
Verweis auf eine leere Stelle ist eine Ausrede mit Fußnote.

`kanalbefund` hält den gezeigten Satz gegen den, der heute stimmt — nicht die
Formulierung, sondern die **Herkunft**. Dann kann er gar nicht ins Leere
zeigen, und sobald eine Adresse kommt, nennt er sie von selbst. Die beiden
„rufen Sie uns an" sind heraus; kommt die Nummer, gehören sie hinein, und
`abweisungskanalbefund` sagt es über das Feld `nenntKanal`.

## Vier eigene Fehler, und wer sie gefunden hat

Dieser Lauf hat mehr über mich gemeldet als über den Bestand. Der Reihe nach:

**1. Ich habe einen vorhandenen Prüfer überschrieben.** `bin/rueckwegpruefung.mjs`
gab es schon — `npm run pruefe-rueckweg` fährt seit dem 6. September den Sweep
über 9.000 bestellbare Mengen. Mein `cat >` hat die Datei ersetzt. Gefunden hat
es `pruefe-ungerufen`: Die Funktion darin rief plötzlich niemand mehr.
Wiederhergestellt aus dem letzten Commit, meiner heißt jetzt
`bin/kanalpruefung.mjs`.

> **Ein neuer Prüfer, der eine Datei anlegt, legt sie vielleicht nicht an.**

**2. Zweimal denselben Namen vergeben.** `gefuellt` gibt es seit dem 29. August
in `src/beleg.js` — der Bündelbau brach ab: *„Doppelt deklariert im Bündel."*
Und `rueckwegbefund` gibt es seit dem 6. September in `src/anfragelesen.js` —
zwei `…befund` für zwei verschiedene Verträge. Heißen jetzt `kanalGefuellt` und
`kanalbefund`.

**3. Die Falle gebaut, vor der ich eine Datei vorher gewarnt hatte.** Der erste
Wurf suchte in jedem Satz nach den Wörtern der Kanäle. Er meldete sofort: *„Die
E-Mail-Adresse ist nicht lesbar"* nenne unsere Adresse — gemeint ist dort die
**des Kunden**. Im Kopf von `src/rueckweg.js` stand zu dem Zeitpunkt schon
*„Ein Wort im Satz ist keine Wegbeschreibung"*, und eine Datei später habe ich
es trotzdem gemacht.

**4. Der Prüfer war grün und hatte nichts gemessen.** Sein Probekorb lag 59 €
unter dem Mindestbestellwert — `baueKundenanfrage` gab „keine Anfrage" zurück,
und der Rückweg kam nie zustande. Gefunden hat es die **Gegenprobe**: Sie
mutierte den Satz zurück, und der Prüfer blieb grün. Er bricht jetzt laut ab,
wenn aus dem Probekorb keine Anfrage wird — *nicht gefahren ist nicht grün.*

Dazu eine fünfte Kleinigkeit, gefunden von der Fremdtextprobe: `rueckwegsatz`
setzte die eigene Adresse ohne `textZeile` ein. Ein Zeilenumbruch im Feld
machte aus einem Satz an den Kunden **vier Zeilen**. Dass das Feld uns gehört,
ist kein Grund — jeder andere Ausgang dieses Hauses filtert auch die eigenen
Angaben.

## Und ein Fund, der kein Befund wurde

Beim Prüfen der Fremdtextprobe fiel auf: Das ausgelieferte `shop.js` trägt
**47-mal** `"lieferantId":"poschacher"` — klein geschrieben, und das Muster in
`src/interna.js` ist groß geschrieben. Es hat den Lieferantennamen im
Browserbündel nie gesehen.

Der naheliegende Griff war, das Muster auf `/i` zu stellen. Er wäre falsch
gewesen, und zwar aus einem Grund, der eine Zeile weiter stand: In
`src/shopkern.js` steht seit dem 30. August

> *„Vollständig verbergen lässt er sich nicht: Die Artikelnummern tragen das
> Kürzel des Lieferanten (`POS-…`), und die Seiten weisen seine Artikelnummer
> bewusst aus, damit ein Kunde nachbestellen kann. **Geheim ist nicht die
> Geschäftsbeziehung, geheim sind die Konditionen.**"*

Und in `src/interna.js` stand: *„Der Bezugsweg. Er steht dem Kunden nicht zu
und dem Wettbewerber schon gar nicht."*

**Beides zugleich geht nicht.** Mit `/i` hätte der Prüfer 47-mal etwas
gemeldet, das dieses Haus absichtlich ausliefert — und die Ausnahme dafür
stünde am Ende genau dort, wo heute das Muster steht.

> **Wenn zwei Sätze eines Bestandes sich widersprechen, ist der Prüfer nicht
> die Stelle, an der man sich entscheidet.**

Entschieden ist für den konkreteren: Geheim sind die Konditionen. Der **Name**
bleibt draußen — er wird auf keiner Kundenseite gebraucht. Das Muster bleibt
groß geschrieben: Es sucht den Namen im Fließtext, nicht die Kennung im
Datensatz. Die Begründung in `interna.js` sagt das jetzt, statt mehr zu
behaupten, als das Haus tut.

## Was dieser Lauf nicht erreicht hat

- **Die Adresse fehlt weiter.** Der Satz ist ehrlich geworden, die Lücke nicht
  kleiner. Sie kostet nichts und dauert eine Minute — und sie steht seit fünf
  Tagen auf dem Zettel.
- **Die 47 Kennungen im Bündel** bleiben. Sie sind nach der obigen
  Entscheidung kein Leck; ob man sie trotzdem durch eine neutrale Kennung
  ersetzt, ist eine Frage von Sparsamkeit und nicht von Geheimnis. Gemessen
  und zurückgestellt.
- **Ob ein Kunde den Satz liest**, weiß niemand. Er steht an der Stelle, an der
  er gebraucht wird, und sagt vorher, was nicht geht.

## Die Frage für den nächsten Lauf

Vier eigene Fehler in einem Lauf, und jeden hat ein anderer Prüfer gefunden —
`pruefe-ungerufen`, der Bündelbau, die Gegenprobe, die Fremdtextprobe. Keiner
davon war für diesen Zweck gebaut. Das ist die beste Nachricht des Tages und
zugleich die Frage: Wie viele Stellen gibt es noch, an denen ein Fehler von
**keinem** von ihnen erwischt würde? Der Bestand misst, was er misst; was er
nicht misst, steht in keiner Liste.
