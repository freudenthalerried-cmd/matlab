# Sechs bezahlte Klicks auf eine leere Trefferliste

**1. September 2026.** Die Kette Anzeige → Landeseite ist geprüft: Jedes
Keyword muss auf seiner Landeseite vorkommen. Ein Schritt weiter im Trichter
steht das Suchfeld, das auf **allen 81 Seiten** in der Kopfleiste sitzt. Wer
über eine Anzeige kommt, tippt dort oft genau den Begriff ein, mit dem er
gesucht hat.

Die 33 Keywords des ersten Anlaufs durch die eigene Suche geschickt:

```
33 Keywords, 6 ohne Treffer
  Fassadendämmung EPS          ← NICHTS
  Fassadendübel                ← NICHTS
  Kaminkopf Regenhaube         ← NICHTS
  Perimeterdämmung druckfest   ← NICHTS
  WDVS System kaufen           ← NICHTS
  XPS Platten kaufen           ← NICHTS
```

Bezahlter Klick, richtiger Begriff, „nichts gefunden".

## Drei verschiedene Ursachen

**Erstens: Die Handelsbegriffe standen auf der Seite, nicht im Index.**
Gestern habe ich „Fassadendübel", „Armierungsgewebe" und „druckfest" in die
Begriffstabellen der Gruppenseiten geschrieben — damit die Landeseite das Wort
sagt, für das geboten wird. Der Suchindex baut sich aber aus Artikeln, Seiten
*titeln* und `data/suchwoerter.json`, nicht aus dem Fließtext. Die Synonyme
haben die eine Prüfung bestanden und die andere nie erreicht.

> **Zwei Listen, die dasselbe meinen: eine im Text, eine in den Daten.**

Sieben Wörter nachgetragen, jedes mit Begründung: fassadendämmung,
fassadendübel, tellerdübel, armierungsgitter, klebespachtel, druckfest,
sockelplatte.

**Zweitens: „kaufen" ist keine Ware.** Zwei Keywords scheiterten an einem
einzigen Wort. Die Suche verlangt — zu Recht —, dass **alle** Wörter treffen,
damit „xps 50" nicht alles mit einer 50 findet. Aber der Shop verkauft; dass
jemand kaufen will, schränkt das Sortiment nicht ein.

`ABSICHTSWOERTER` in `shopkern.js` lässt jetzt neun Wörter aus, die den
Vorgang meinen statt der Ware. Die Liste ist kurz, steht an einer Stelle und
trägt ihre Begründung — eine Suche, die stillschweigend beliebige Wörter
fallen lässt, findet immer etwas, und das ist schlimmer als nichts zu finden.
Besteht die Frage nur aus Absicht, bleibt sie leer: „kaufen" allein ist keine
Suche.

**Drittens: Ein Testfall hat mich korrigiert.**

Ich hatte „kaminkopf" als achtes Suchwort ergänzt, mit Verweis auf Regenhaube
und Trennstein. Zwei Proben wurden sofort rot:

```
✗ was der Shop nicht führt, bleibt unauffindbar
    „kaminkopf" findet Ware, obwohl abgelehnt
```

In `suchwoerter.json` steht es unter `_nichtAufgenommen`:

> „Die Verkleidung über Dach führen wir nicht; wir haben Regenhaube und
> Trennstein, aber keinen Kaminkopf."

Das ist die ältere und die richtige Entscheidung. Ein Suchwort ist kein
Werbeversprechen — es darf nur dorthin führen, wo der Artikel die Aufgabe
tatsächlich erfüllt. Wer „Kaminkopf" sucht, bekommt jetzt weiterhin den Satz
„Eine Kaminkopfverkleidung führen wir nicht. Regenhaube und Thermo-Trennstein
haben wir." Das ist eine bessere Antwort als eine Trefferliste.

Zurückgenommen — und die Folge gezogen: **`Kaminkopf Regenhaube` ist als
Keyword gestrichen.** Auf ein Wort zu bieten, das die eigene Suche
ausdrücklich nicht beantwortet, ist ein bezahlter Klick auf eine leere
Trefferliste, den man vorher kennt.

## Die neue Wache

`test/kampagne.test.js` schickt jedes ausgelieferte Keyword durch
`baueSuchindex` und `suche` und verlangt mindestens einen Treffer. Zusammen
mit der Deckungsprüfung von vorgestern gilt jetzt:

| Prüfung | Frage |
|---|---|
| `ungedeckteWoerter` | Sagt die **Landeseite** das Wort? |
| Keyword-Suchprobe | Beantwortet die **Suche** es? |

Zwei verschiedene Wege, und beide enden bei einem bezahlten Klick ins Leere.

Ergebnis: **33 Keywords, 0 ohne Treffer.**

## Zwei Fehler beim Gegenproben, beide meine

**Der Tippfehler.** Beim Streichen des Kaminkopf-Keywords habe ich
`'Kamin Fertigfüß'` geschrieben. Der nächste Kampagnenlauf meldete sofort
„1 zurückgehalten — die Landeseite sagt das Wort nicht". Die Wache von
vorgestern hat einen Tippfehler von heute gefangen, bevor er in eine
CSV-Datei gewandert ist.

**Die schlecht gewählte Mutation.** Um zu prüfen, ob die neue Wache anschlägt,
habe ich `"fassadendübel"` in `"fassadenduebelXX"` umbenannt — und der Test
blieb grün. Der Grund ist nicht das Loch, das ich vermutet habe: Die Suche
trifft auch auf **Wortanfänge**, und „fassadenduebel" ist ein Anfang von
„fassadenduebelxx". Die Mutation war verhaltensgleich. Erst das echte Löschen
des Eintrags färbte den Test rot.

Dazu ein Werkzeugbefund: `npm run gegenprobe -- … -- sh -c "…"` hat den Befehl
zerlegt, weil die innere Zeichenkette selbst Anführungszeichen trug. Der
Websitebau lief nicht, der Test prüfte den alten Stand — und meldete grün.
Dieselbe Familie wie am 31.08.: **eine Gegenprobe, die nicht ankommt, sieht
aus wie eine bestandene.** Abgestellt, indem der Befehl in einer Datei steht
statt in verschachtelten Anführungszeichen.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Absichtswörter nicht mehr auslassen | ja |
| `fassadendübel` aus `suchwoerter.json` gelöscht | ja |
| `fassadendübel` nur umbenannt (`…XX`) | nein — verhaltensgleich, siehe oben |

## Stand

- 1.084 Tests, 0 rot; alle Prüfer grün
- 33 Keywords, 0 ohne Treffer in der eigenen Suche (Stand 01.09.; „Kaminkopf
  Regenhaube“ ist am selben Tag herausgenommen worden, seither sind es 32)
- `suchwoerter.json`: 59 Wörter, 23 begründete Ablehnungen
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
