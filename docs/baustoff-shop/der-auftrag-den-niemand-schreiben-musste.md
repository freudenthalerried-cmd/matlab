# Der Auftrag, den niemand mehr schreiben muss

**4. September 2026.** Seit heute früh steht fest, was das Hochladen wirklich
blockiert: vier Impressumsangaben (die dem Auftraggeber vorliegen) und
**Datenschutzerklärung plus Offenlegung** als Wortlaut. Das zweite ist eine
Ausgabe und damit seine Entscheidung.

Die Zuarbeit dafür liegt vollständig im Bestand — verteilt auf sechs Register
und zwei gebaute Seiten:

| | |
|---|---|
| `PFLICHTTEXTE` | welcher Text ab wann gilt, mit Grundlage |
| `AGB_GLIEDERUNG` | dreizehn Punkte, jeder mit dem Grund, warum er nötig ist |
| `DATENSCHUTZ_GLIEDERUNG` | neun Punkte nach DSGVO |
| `WEBSITE_VERARBEITUNG` | der technische Befund, aus dem Quelltext gelesen |
| `B2B_ABGRENZUNG` | was wegen Gate 7 entfällt und was trotzdem bleibt |
| `DATENFLUESSE` | wohin welches Datum geht, mit Rechtsgrundlage |

**Verteilt ist sie nichts wert.**

> **Wer eine Ausgabe freigeben soll, muss wissen, wofür.** Ein Anbieter, der
> „machen Sie uns die Rechtstexte" hört, rechnet den vollen Umfang; einer, der
> eine Gliederung mit Begründungen und den technischen Befund bekommt, rechnet
> die Arbeit, die übrig bleibt.

## `npm run rechtstexte-auftrag`

Derselbe Bau wie beim Lieferantenbrief: aus den Registern erzeugt, **nicht**
versendet, und ohne Absenderdaten entsteht er als „nicht versandfähig" statt
als Brief ohne Rückantwortadresse.

Der Brief ist in **zwei Stufen** gegliedert, und das ist sein eigentlicher
Inhalt:

- **Stufe 1**, gebraucht, sobald die Seite erreichbar ist: Impressum
  (§ 5 ECG), Offenlegung (§ 25 MedienG), Datenschutzerklärung (Art. 13 DSGVO).
- **Stufe 2**, gebraucht, sobald der Shop Bestellungen annimmt: AGB. Die
  Widerrufsbelehrung entfällt, solange Gate 7 gilt.

Dazu, was der Shop tut und was nicht — *„Er nimmt derzeit keine Bestellung
entgegen … ein Vertrag kommt auf der Seite nicht zustande"* —, denn genau
daran hängt die Stufung.

Er verlangt zusätzlich zur E-Mail die **Firmenbuchnummer**: Ohne sie kann der
Anbieter die Offenlegung nach § 25 MedienG gar nicht schreiben.

Heute endet er rot: *„keine E-Mail-Adresse des Absenders"*. Dieselben vier
Impressumsangaben, die das Hochladen blockieren, blockieren auch den Brief, mit
dem man es auflösen würde. **Das ist keine Schleife, sondern eine Reihenfolge** —
und sie kostet fünf Minuten Eintippen.

## Was der neue Ausgang sofort gefunden hat

Ein Brief an einen Dritten ist ein Außentext und geht durch `pruefe-belege`.
Der erste Lauf meldete zwei Dinge, beide richtig:

**1. Eine Belegart ohne Eintrag.** „Belegart „Rechtstexteauftrag" ist in
`ZUSTANDSAUSSAGE` nicht eingetragen — ungeprüft." Genau dafür gibt es die
Regel: Eine neue Belegart darf nicht stillschweigend durchlaufen. Eingetragen.

**2. Ein Verweis, den nie jemand geprüft hat.** Punkt 3 der AGB-Gliederung
begründet im eigenen Hinweistext, warum Reverse Charge gegenüber dem Kunden
nicht in Betracht kommt — *„weil nur ins Inland geliefert wird (**Punkt 12**)"*.
Dieser Verweis stand seit dem 26. August in einem internen Register und ist nie
in einem Außentext gelandet. Mit dem Auftrag geht die ganze Gliederung hinaus,
und `verweis-ohne-eintrag` meldete ihn im selben Lauf.

> **Ein Verweis, den nur ein internes Register trägt, wird nicht geprüft.**
> Sobald er hinausgeht, gilt für ihn dieselbe Regel wie für jeden anderen.

Das Verweisregister führt jetzt vier Punkte statt drei: 2 (Vertragsschluss),
4 (Streckengeschäft), 7 (Empfangsvollmacht), 9 (Zahlungsbedingung) — und 12
(Liefergebiet).

## Und eine Berichtigung an mir selbst

Der erste Testlauf des neuen Ausgangs war rot: Mein `feld()`-Helfer nahm
`wert.trim()` und ließ Zeilenumbrüche durch. Ein Firmenname mit einem
untergeschobenen `\nBetreff: Alles gratis` wäre als eigene Zeile im Brief
gestanden.

`textZeile()` macht genau das seit dem 31. August für die Belege. **Ein zweiter
Ausgang gehört an dieselbe Regel und nicht an eine eigene** — die Fremdtextprobe
hat es in derselben Minute gemeldet, in der ich sie geschrieben habe.

Ebenso berichtigt: Ein Testfall verlangte „genau ein Eintrag ohne Verweis". Das
war die Registergröße von gestern und nicht die Aussage; er prüft jetzt, dass
alle Meldungen von der richtigen Regel stammen und Punkt 9 darunter ist.

## Was offen bleibt

**Der Brief ersetzt keine Rechtsberatung und formuliert keinen Rechtstext.**
Kein Satz darin ist zum Übernehmen gedacht; was er trägt, sind Gliederung,
Grundlagen, Befunde und die Abgrenzung des Adressatenkreises. Er nennt auch
keinen Preis und keine Frist — beides verhandelt der Auftraggeber.

Versendet wird nichts. Ein Auftrag löst eine Ausgabe aus, und die entscheidet
er.

## Verweise

- `shop/src/rechtstexteauftrag.js` — der Brief aus sechs Registern
- `shop/bin/rechtstexteauftrag.mjs` — `npm run rechtstexte-auftrag`
- `shop/test/fremdtext.test.js` — zwei neue Proben am neuen Ausgang
- [`was-wirklich-vor-dem-hochladen-stehen-muss.md`](./was-wirklich-vor-dem-hochladen-stehen-muss.md) — die Stufung, die dieser Brief trägt
