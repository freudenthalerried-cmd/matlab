# Die Frage war eine Antwort entfernt

**9. September 2026, nachts.** Die Bereitschaftsliste führt seit ihrem ersten
Bau einen Punkt „Repository ist privat". Er trug ein Fragezeichen, und der
Grund daneben lautete:

> *von hier aus nicht feststellbar; solange es öffentlich ist, sind
> Einkaufspreise rekonstruierbar*

Der Shop galt deshalb als nicht startklar — mit einer Frage, die niemand
gestellt hatte.

---

## Der Netzausgang ist gesperrt. Das GitHub-Werkzeug nicht.

Nachgesehen, beides:

```
$ curl -L https://bauversand.com/
curl: (56) CONNECT tunnel failed, response 403
```

Die Sperre ist echt, und sie liegt am **Ausgang**, nicht an der Adresse — die
bestehende Firmenseite `freudenthaler-bau.at` antwortet genauso wenig. Für den
Punkt „Die Seite ist unter einer Adresse erreichbar" gilt die Grenze also, und
seit heute steht daneben, dass jemand nachgesehen hat.

Der zweite Punkt liegt anders. Das GitHub-Werkzeug dieser Umgebung beantwortet
die Frage in **einem Aufruf**:

```
"private": false,  "visibility": "public"
```

> **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
> ausschließt.** Solange „nicht feststellbar" dasteht, sieht niemand nach.

Das ist **das zweite Mal in drei Runden.** Am selben Abend hatte
`pr-veroeffentlicht.json` behauptet, eine Prüfung der Veröffentlichung sei aus
dieser Umgebung unmöglich — auch falsch, auch nie nachgesehen, und auch dort
hatte die falsche Grenze einen echten Fall gedeckt.

---

## Was sich dadurch ändert

Der Punkt ist nicht mehr **ungefragt**, sondern **offen**:

```
✗ Repository ist privat
    gemessen am 2026-09-09: öffentlich — die 44 von 46 rückrechenbaren
    Einkaufspreisen stehen offen
```

Die Empfehlung „privat stellen" stand seit Tagen in der PR-Beschreibung. Sie
war richtig — aber sie war eine **Vermutung über den eigenen Zustand**, und
jetzt ist sie ein Befund. Die Liste liest sich seither *2 erfüllt, 8 offen, 2
von hier aus nicht feststellbar*: ein Fragezeichen weniger, ein offener Punkt
mehr, und derselbe Shop.

---

## Warum eine Datei und kein Prüfer

Der Shop kann das nicht selbst erheben: Sein Netzausgang ist gesperrt, und das
GitHub-Werkzeug gehört nicht zu ihm. `data/aussenlage.json` ist deshalb ein
**Vermerk über einen Handgriff** — dasselbe Muster wie beim
Veröffentlichungsvermerk, mitsamt derselben ehrlichen Grenze.

Und wie dort trägt er sein Datum. **Vierzehn Tage**, und der Grund ist die
Richtung des Schadens: Der gefährliche Fall ist nicht „öffentlich und keiner
weiß es" — das steht dann ja da —, sondern **„einmal privat gemessen, seither
wieder öffentlich"**. Danach gilt die Messung wieder als offene Frage, mit
Grund:

```
die Messung ist 30 Tage alt (Grenze 14) — sie sagt über heute nichts
```

Fehlt die Datei, fehlt ein Feld, ist das Datum unlesbar oder liegt es in der
Zukunft: **keine Auskunft**, und der Grund steht daneben. Ein Vermerk, der
schweigt, wäre wieder ein Fragezeichen ohne Ursache.

---

## Die Messung schlägt die Angabe

`data/betreiber.json` führt weiterhin ein Feld `repositoryPrivat` — der
Auftraggeber kann es beantworten. Trägt er „privat" ein, während die Messung
„öffentlich" sagt, gewinnt ohne eine ausdrückliche Regel, **wer zuletzt
gelesen wird** — und das ist die Angabe.

Gezeigt:

```
Achtung: data/betreiber.json sagt „Repository privat", gemessen wurde
„öffentlich" — die Messung gilt, die Angabe gehört berichtigt
  [erklaerung-gegen-messung]
```

---

## Und die Abbildung, die es schon gab

Vier Runden zuvor stand hier der Fund, dass **drei Werkzeuge** ihre Lage von
Hand aus derselben Betreiberdatei zusammenbauten und ein neues Feld in einem
davon ankam. Behoben wurde das mit einer Abbildung: `betreiberangaben()`.

Die Außenlage kommt aus einer **anderen** Datei — und wäre damit der perfekte
Anlass gewesen, eine zweite Abbildung daneben zu setzen. Sie geht deshalb
durch dieselbe: `betreiberangaben(betreiber, aussenlage, heute)`. Der Testfall
von damals verlangt weiterhin, dass alle drei Werkzeuge sie rufen.

*Eine zweite Abbildung wäre derselbe Fehler mit einer anderen Datei.*


---

## Und derselbe Handgriff, zum dritten Mal

Die veröffentlichte PR-Beschreibung wurde nach dem Setzen wieder
zurückgelesen — und wich wieder ab: Diesmal trug **GitHub eine Tabellenzeile
mehr** als die Quelle, weil ich sie beim Übertragen ergänzt hatte.

Das ist der dritte Fall an einem Abend, und dreimal dieselbe Ursache: *Das
Werkzeug gibt den Text aus, übertragen muss ihn ein Mensch* — und wer dabei
noch etwas ergänzt oder kürzt, veröffentlicht einen Text, den die Quelle nicht
kennt.

> **Der Fingerabdruck gehört nach dem Abgleich gesetzt, nicht davor.** Davor
> belegt er nur, dass jemand etwas veröffentlicht hat.

Berichtigt wurde jedes Mal die Quelle, und der Vermerk sagt es jetzt selbst.
Dreimal gefunden heißt: Der zweite Handgriff ist keine Zeremonie.

---

## Was das nicht löst

Die Messung ist ein Handgriff, kein Wächter. Niemand erfährt hier, wenn das
Repository morgen umgestellt wird — nur, dass die Auskunft nach vierzehn Tagen
verfällt. Und sie beantwortet **eine** von zwei Fragen: Ob die Seite unter
ihrer Adresse erreichbar ist, bleibt gesperrt; daran ändert das Nachsehen
nichts, außer dass es jetzt belegt ist.

**Beim Auftraggeber liegt der Punkt unverändert** — und mit einer Ziffer mehr:
Das Repository ist öffentlich, und aus zwei veröffentlichten Zahlen sind 44
von 46 Einkaufspreisen auf den Cent zurückzurechnen.
