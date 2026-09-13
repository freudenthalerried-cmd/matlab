# Die Adresse war entschieden — im Verzeichnis stand die alte

**3. September 2026.** Der Auftraggeber hat am 31. August `bauversand.com`
gewählt. Der Code war am selben Tag richtig: `data/betreiber.json` trägt die
Adresse, `bin/website.mjs` und `bin/kampagne.mjs` nehmen sie von dort, und
eine Probe fällt um, sobald eines der beiden wieder einen eigenen Hostnamen
hineinschreibt.

Die **Akte** war es nicht. Drei Tage später stand an fünf Stellen weiter
`shop.freudenthaler-bau.at`:

| Datei | Was dort stand |
|---|---|
| `domainwahl.md` (3×) | die Empfehlung selbst, im Indikativ, ohne Vermerk |
| `pruefkette-geschlossen.md` | „Domain und Hosting — Empfehlung liegt vor: `shop.freudenthaler-bau.at`" (abgelöst am 31. August), als offener Punkt geführt |
| `bauversand-com.md` | das Codezitat des Befunds, ohne Vermerk daneben |

Und schwerer als alle drei: **`PARAMETER.md`**, die Datei, die nach eigener
Aussage über dem Gate-Register rangiert, führte in ihrer Weisungstafel als
letzte Zeile den 28. August. Die Domainweisung vom 31. war nicht darin. In
derselben Tafel stand unter dem 26. August „Domain `freudenthaler-bau.at` in
Betrieb" — richtig für die Firmenseite, und für einen Lesenden die Antwort auf
die Frage, unter welcher Adresse der Shop läuft.

> **Eine Entscheidung, die nur im Code ankommt, ist im Verzeichnis weiter
> offen.**

Das ist die Umkehrung des Fehlers vom 26. August, als das Liefergebiet nur in
einer Anzeigenzeile stand und der Rechenkern nichts davon wusste. Damals war
die Ansage da und die Umsetzung fehlte; hier ist die Umsetzung da und die
Ansage fehlt. Beide Male ist der Bestand in sich stimmig, und beide Male liest
jemand das Falsche.

## Warum kein Prüfer das sehen konnte

Die Werkzeuge messen den Bestand gegen sich selbst: gebaute Seiten gegen den
Katalog, die PR-Beschreibung gegen das Verzeichnis, Prüfer gegen ihr Register.
`PARAMETER.md` ist kein Bestand, sondern eine **Ansage** — sie hat kein
Gegenstück, gegen das sie sich halten ließe.

Der Widerrufsprüfer hätte es gekonnt, wenn er von der Ablösung gewusst hätte.
Er wusste es nicht: Sein Register führte acht zurückgenommene Aussagen, und
die Domain war keine davon. **Ein Register, in das niemand einträgt, meldet
nichts und sieht dabei aus wie ein Ergebnis** — dieselbe Familie wie der
Prüfer der Prüfer mit seiner unvollständigen Liste am 1. September.

Eingetragen ist sie jetzt (`shop-subdomain-als-adresse`), und der Prüfer hat
die fünf Stellen in einem Lauf genannt. Alle fünf tragen ihren Widerruf in
Sichtweite; `domainwahl.md` zusätzlich einen Hinweis im Kopf, weil das ganze
Dokument auf eine abgelöste Empfehlung hinausläuft. Stehen bleibt es trotzdem:
Die Kriterien und die Kandidatenprüfung gelten weiter, die **Wahl** nicht.

Eine Zeile darin liest sich seither anders. Der fair benannte Einwand gegen
die eigene Empfehlung lautete:

> Eine Subdomain sagt der Maschine nichts über die Ware. Wer „Baustoffe
> Mühlviertel liefern" fragt, findet im Namen `shop.freudenthaler-bau.at`
> keinen Anhaltspunkt.

Genau dieser Einwand hat sich durchgesetzt. `bauversand.com` benennt die Ware
selbst.

## Was jetzt messbar ist

Zwei Testfälle in `test/parameter.test.js`, die schmalste Brücke zwischen
Ansage und Bestand, die sich ziehen lässt:

1. **Die oberste Tafel nennt die Adresse, unter der gebaut wird.** Verglichen
   wird der Hostname aus `betreiber.domain` gegen den Text von
   `PARAMETER.md`. Gegengeprobt: eine andere Adresse in den Betreiberdaten,
   und der Fall fällt.
2. **Der Stand ist nicht älter als die jüngste Weisung.** Die Tafel führt
   Datumsangaben als `TT.MM.`, der Kopf einen Stand als `JJJJ-MM-TT`. Wer eine
   Zeile ergänzt und den Stand stehen lässt, hinterlässt eine Datei, die
   aktueller ist, als sie von sich behauptet — und danach entscheidet ein
   späterer Lauf, ob er sie noch für gültig hält. Gegengeprobt: Stand zurück
   auf den 28. August, und der Fall fällt.

Beides prüft nicht, ob die Weisung **inhaltlich** in der Tafel steht — das
kann kein Werkzeug. Es prüft, dass die Tafel nicht schweigend hinter dem
Bestand zurückbleibt, und genau das ist hier passiert.

`PARAMETER.md` trägt dazu einen Satz, der die Regel benennt: Diese Tafel ist
ab jetzt der Ort, an dem eine Weisung des Auftraggebers als Erstes landet.
