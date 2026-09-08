# Das Gebot ruht auf dem Korb, gekauft wird das Wort

**8. September 2026.** `pruefe-preisalter` gibt es seit dem 30. August. Es
eskaliert einen zu alten Einkaufspreis zum **Fehler**, sobald ein Gebot darauf
ruht — sonst bleibt er ein Verdacht, den man nachfragt und nicht sperrt. Wo ein
Gebot ruht, bestimmte es über die Positionen der **Referenzwarenkörbe** der
schaltenden Anzeigengruppen.

Im Kopfkommentar desselben Moduls steht seit dem ersten Tag, warum der
Drehstiftdübel damals nicht eskaliert wurde:

> *„2,15 € Einkauf für hundert Stück, **in keinem Keyword**, in keinem
> Referenzkorb."*

Zwei Gründe. Geprüft wurde einer.

---

## Gemessen: „Fassadendübel" trifft ihn

Alle geführten Keywords der drei schaltenden Gruppen durch die **eigene Suche**
geschickt — dieselbe, die der Besucher benutzt:

- **24 Artikel** werden von einem Keyword getroffen,
- **14 davon liegen in keinem Referenzwarenkorb**,
- **einer davon ist über der 90-Tage-Grenze**: `POS-52537`, Drehstiftdübel,
  Preisstand **104 Tage**, getroffen vom Keyword **„Fassadendübel"** der Gruppe
  WDVS.

> **Das Gebot ruht auf dem Korb; gekauft wird, was das Wort nennt.**

Der Referenzwarenkorb ist eine Rechengrundlage für das Höchstgebot, kein
Verzeichnis dessen, was der bezahlte Klick zu sehen bekommt. Wer auf
„Fassadendübel" klickt, landet auf der WDVS-Gruppenseite und findet dort den
Dübel — mit einem Verkaufspreis, der auf einem vier Monate alten Einkauf
gerechnet ist.

---

## Gate 29: das Wort wird zurückgestellt, nicht die Gruppe

**Entschieden am 8. September, selbst.** Ein Keyword, dessen eigene
Trefferliste einen Artikel mit überaltertem Einkaufspreis enthält, wird
zurückgestellt.

Die naheliegende Verschärfung wäre gewesen, die **Gruppe** anzuhalten. Genau
das hat das Modul am ersten Tag verworfen, und zu Recht: *Eine Regel, die am
ersten Tag den falschen trifft, wird am zweiten abgeschaltet.* Die WDVS-Gruppe
wegen eines Dübels von 2,15 € je hundert Stück anzuhalten, wäre diese Regel.

Zurückgestellt wird deshalb genau das Wort — eines von dreißig. Es steht mit
Artikel und Preisalter in `keywords-alter-preis.csv`, und es kommt **von
selbst zurück**, sobald der Lieferant den Preis bestätigt: Die Liste entsteht
bei jedem Lauf neu, aus dem gemessenen Alter und nicht aus einer Notiz.

Kosten der Entscheidung: ein Keyword. Nutzen: keine Wette auf eine Marge, die
niemand bestätigt hat.

---

## Und die Verschärfung greift jetzt auch dort

`beworbeneSkus` ist seither die **Vereinigung** aus Korbpositionen und
Keyword-Treffern — von 12 auf **23 Artikel**. Beides sind Wege, auf denen Geld
am Preis eines Artikels hängt: die Rechnung, aus der das Gebot entsteht, und
das Wort, für das bezahlt wird.

Damit hält der Prüfer die zweite Hälfte seiner eigenen Begründung nach. Er
liest dafür `ausgabe/site/shop.js` — dieselben Daten wie der Browser des
Besuchers — und weigert sich seither über einem veralteten Stand. Der Eintrag
im Leserregister sagte bis heute: *„Mit dem gebauten Erzeugnis hat sie nichts
zu tun."* Das galt, bis es nicht mehr galt.

---

## Die Gegenprobe

Sie hebt Gate 29 auf: Die zurückgestellten Wörter werden wieder mitgeschaltet.
Dann ruht ein Gebot auf einem Preis von 104 Tagen, und der Prüfer meldet rot.

Sie zeigt damit zwei Dinge auf einmal — dass die Vereinigung aus Korb und Wort
wirklich greift, und dass Gate 29 der Grund für das Grün ist und nicht ein
glücklicher Zufall der Datenlage.
