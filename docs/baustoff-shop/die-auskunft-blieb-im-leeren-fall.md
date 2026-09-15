# Die Auskunft blieb im leeren Fall

**6. September 2026, abends.** Der Shop führt ein Register über das, was er
**nicht** führt: 24 Wörter, jedes mit einem Grund und einer Antwort. Es
entstand, weil ein Suchwort ohne Ware nichts vortäuschen soll — und die
Antworten sind redaktionell, keine Ähnlichkeitsrechnung:

> **abdichtung** — *„Abdichtungsbahnen führen wir nicht. Gedämmt wird über der
> Abdichtung, nicht statt ihrer — welche Bahn Ihr Aufbau braucht, steht in der
> Planung."*
> Grund im Register: *„Ein Suchwort, das auf die Dämmplatte zeigt, würde genau
> den Fehler erzeugen, den die Systemliste verhindert: dämmen ohne
> abzudichten."*

Die 24 Antworten stehen in `llms.txt`, gehen an den Browser und werden auf der
Suchseite ausgespielt. Sie standen dort in einem Zweig:

```js
if (frage && !t.length) {        // nur, wenn die Trefferliste leer ist
  … Meinten Sie …
  … Das führen wir nicht. <Antwort> …
}
```

---

## Gemessen über das ganze Register

Gegen den Index, den der Besucher im Browser bekommt:

| Wort | Treffer | was der Kunde stattdessen sah |
|---|---|---|
| `abdichtung` | 2 | Kellerwandliste, Perimeterseite |
| `gleitmittel` | 2 | Gruppe „Kanal und Erdbau", Grundleitungsliste |
| `übergangsstück` | 1 | Gruppe „Kanal und Erdbau" |
| die übrigen 21 | 0 | die Antwort, wie vorgesehen |

**Drei von 24 Wörtern finden etwas — und genau für diese drei blieb die Antwort
verborgen.** Bei `abdichtung` ist es die Antwort, die vor „dämmen ohne
abzudichten" warnt, während die Trefferliste zwei Seiten über das Dämmen
derselben Wand zeigt.

> **Eine Auskunft, die nur im leeren Fall erscheint, fehlt dort, wo die
> Trefferliste in die Irre führt.**

Dieselbe Gestalt wie die Bankverbindungsprüfung vom 4. September: *„Eine
Prüfung, die nur im ungenutzten Fall greift, ist keine."* Dort war der Zweig
unerreichbar, hier ist er der falsche.

---

## Warum es nicht auffiel

Es gab ein Browserszenario dafür — seit dem Tag, an dem das Register gebaut
wurde:

```js
name: 'Ein bekanntes Nicht-Sortiment bekommt eine eigene Antwort',
await geheZu('suche?q=drainage');
```

`drainage` ist eines der 21 Wörter, die nichts finden. **Der Prüfer prüfte ein
Wort, die Regel gilt für 24** — und das eine Wort lag im gedeckten Fall.

> **Die bekannteste Familie dieses Bestands: nicht ein fehlender Prüfer,
> sondern einer, dessen Reichweite kleiner ist als die Reichweite der Regel,
> die er prüft.**

Dazu eine Handzahl im Kommentar daneben: *„Für 23 Wörter steht im Register …"*
— es sind 24. Sie ist ersatzlos gestrichen; gezählt wird jetzt im Szenario.

---

## Behoben

Die Auskunft steht seither **vor** der Trefferliste und hängt nicht mehr an
ihrer Länge. Sind Treffer da, tragen sie einen Satz mehr:

> **Das führen wir nicht.** Abdichtungsbahnen führen wir nicht. Gedämmt wird
> über der Abdichtung, nicht statt ihrer — welche Bahn Ihr Aufbau braucht,
> steht in der Planung. *Die Treffer darunter zeigen, was daneben steht — nicht
> das gesuchte Teil.*

Der allgemeine Satz („Der Katalog umfasst 46 Artikel …") bleibt im leeren Fall,
wo er hingehört.

---

## Geprüft

Neues Browserszenario **„Jedes Wort des Nicht-Sortiments bekommt seine Antwort
— auch mit Treffern"**: Es liest das Register aus `window.__SHOP__`, ruft die
Suchseite für **jedes** Wort auf und meldet die Wörter ohne Auskunft namentlich.

Drei Zusicherungen, keine davon eine Handzahl:

* `genug=true` — mindestens 20 Wörter im Register, sonst misst das Szenario nichts.
* `ohneAuskunft=[]` — die Regel selbst.
* `mitTrefferFall=true` — es gibt noch mindestens ein abgegrenztes Wort **mit**
  Trefferliste. Fällt der Fall weg, ist das Szenario wieder so blind wie sein
  Vorgänger und sagt es, statt still grün zu bleiben.

Gegenprobe `auskunft-nur-im-leeren-fall` setzt die alte Bedingung wieder ein und
wird an `ohneAuskunft=[abdichtung,gleitmittel,übergangsstück]` rot.

---

**Was das wert ist.** Diese drei Suchen enden heute mit einer Trefferliste, die
neben der Frage liegt — und der Kunde, der „Abdichtung" sucht und die
Kellerwandliste angeboten bekommt, baut im schlechteren Fall genau den Aufbau,
vor dem das Register warnt. Eine falsche Auskunft an der Suchzeile fällt in
keiner Abrechnung auf; sie steht am Anfang der stillen Richtung.
