# Fünf Weisungen ohne Zeile

**11. September 2026. Runde 29.**

## Was gemessen wurde

`npm run pruefe-weisungen` hält seit dem 7. September die Weisungstafel in
`PARAMETER.md` gegen den Bestand und meldet: **acht Weisungen, sieben erfüllt,
eine offen und geführt, null vergessen.**

Die Zahl stimmt. Sie sagt weniger, als sie klingt.

> **Ein Prüfer, der eine Liste gegen den Bestand hält, misst die Liste.**

Neun Dokumente halten in ihrem Kopf eine Weisung des Auftraggebers **im
Wortlaut** fest — mit Datum, oft als Zitat. Die Tafel hatte acht Zeilen.
Gemessen standen **fünf dieser Weisungen in keiner davon**:

| Dokument | Datum | Weisung |
| --- | --- | --- |
| `ki-sichtbarkeit-konzept.md` | 22.08. | von KI-Assistenten genannt werden |
| `inhalte-und-pruefteam.md` | 22.08. | „für ki super lesbar", geprüfte Inhalte, eigenes Prüfteam |
| `videos-als-quelle.md` | 22.08. | „youtube: fasse zusammen, überprüfe auf richtigkeit und verwende content" |
| `systemliste-kellerwand.md` | 26.08. | „eher auf die Produkte konzentrieren" |
| `die-ueberschrift-der-startseite.md` | 03.09. | „Baustoffe zum Baumeisterpreis" soll nicht bleiben |

Dazu eine sechste Meldung derselben Regel: Die Zeile über die
Baumeisterpreise stand in der Tafel und nannte das Dokument nicht, das die
Weisung im Wortlaut festhält.

## Die teuerste der fünf

Die erste Weisung ist die, die dieses ganze Vorhaben trägt: *Der Shop soll von
KI-Assistenten genannt werden.* Sechs Dokumente nennen sie als Zweck des Baus,
`llms.txt` heißt an einer Stelle „der Kern der Weisung" — und in der Tafel, die
seit dem 3. September ausdrücklich **„der Ort ist, an dem eine Weisung des
Auftraggebers als Erstes landet"**, stand sie nicht.

Schaden hat das keinen angerichtet: Sie ist gebaut. Die letzte der fünf ist
anders.

Am 3. September hat der Auftraggeber angeordnet, **„Baustoffe zum
Baumeisterpreis" solle nicht bleiben**. Drei Fassungen wurden ihm zur Wahl
vorgelegt; umgesetzt wird keine, bis er wählt. Nachgesehen am 11. September:

```
$ grep -o '<h1[^>]*>.*</h1>' ausgabe/site/index.html
Baustoffe zum Baumeisterpreis
```

Acht Tage. Nicht erfüllt — und in keiner Liste offener Punkte. Also
**vergessen**, und zwar genau in dem Sinn, für den es diesen Prüfer gibt:

> *Drei Zustände, nicht zwei: erfüllt, offen und geführt, **vergessen**. Genau
> dafür gibt es diesen Prüfer.* — `src/weisungsstand.js`, 7. September

Er konnte sie nicht finden. Sie stand in keiner Zeile.

## Was geändert wurde

**Die Tafel hat jetzt dreizehn Zeilen.** Die fünf fehlenden sind eingetragen,
jede mit dem Dokument, das sie im Wortlaut festhält, und mit dem, was aus ihr
geworden ist:

* **KI-Sichtbarkeit** → `src/maschinenlesbar.js`: `llms.txt`, strukturierte
  Daten je Artikel, getrennte Crawler-Kennungen.
* **Geprüfte Inhalte, eigenes Prüfteam** → `npm run pruefe-inhalte`. Ein Team
  gibt es nicht und wird es hier nicht geben; was es gibt, ist eine Prüfkette,
  die jede belegpflichtige Aussage gegen ihren Beleg hält. *Geprüft wird die
  Sache, nicht der Wortlaut.*
* **YouTube** → von drei Schritten ist der mittlere gebaut
  (`npm run pruefe-quellen`) und die beiden äußeren verweigert, mit Grund:
  YouTube ist gesperrt, und ein fremdes Transkript wäre fremdes Material.
  *Eine Weisung, die man teilweise ausführt, gehört genauso in die Tafel wie
  eine, die man ganz ausführt.*
* **„Eher auf die Produkte konzentrieren"** → die Systemlisten, vier Listen
  über fünfunddreißig Positionen.
* **Die Überschrift** → **offen**, und seit heute als offener Punkt geführt:
  `npm run offenepunkte` nennt sie unter den Entscheidungen des Auftraggebers,
  mit der Empfehlung aus dem Dokument und dem Hinweis, dass alle vier Orte
  derselben Formulierung aus einer Stelle kommen und gemeinsam mitwandern.

**Und die Richtung, die fehlte.** `quellenbefund` hält die Tafel gegen die
Dokumente: Jedes Dokument, dessen Kopf eine Weisung im Wortlaut festhält, muss
in einer Zeile genannt sein. Eine Ausnahme steht mit Grund daneben —
`die-regel-hielt-sechs-stunden.md` zitiert im Kopf die Regel *über* die Tafel,
nicht eine Weisung. Und ein Lauf, der kein einziges solches Dokument findet,
meldet das als eigenen Befund: *Ein Prüfer, der nichts findet, hat nichts
geprüft.*

## Was der erste Wurf gekostet hätte

Die neuen Meldungen wurden zunächst an `b.meldungen` angehängt — und die
Entscheidung über den Ausgang fällt in `b.sauber`, das da längst feststand. Der
Prüfer hätte den Fund **ausgegeben und wäre grün geblieben**. Die Gegenprobe
hat es in der ersten Minute gezeigt.

> **Ein Prüfer, der einen Fund ausgibt und grün endet, ist schlimmer als einer,
> der nichts findet: Man liest ihn und glaubt, es sei nichts.**

## Ausgang

| | |
| --- | --- |
| Zeilen der Weisungstafel | 8 → **13** |
| erfüllt / offen und geführt / vergessen | **11 / 2 / 0** |
| offene Punkte | 27 → **28** |
| Testfälle | 6 neu, 2319 grün |
| Gegenproben | 189 → **191** |

## Was daraus offen bleibt

Ein neuer Punkt für den Auftraggeber, und er kostet nichts als eine
Entscheidung: **Welche der drei Überschriften soll auf der Startseite stehen?**
Empfohlen ist die mit dem Liefergebiet — von den drei Aussagen ist „wir liefern
hierher" die einzige, die ein Besucher nirgends sonst herausfindet, ohne zu
suchen.

---

**Die Regel dieser Runde:** *Eine Weisung, die nur in dem Dokument steht, das
sie festhält, ist für jeden Prüfer unsichtbar — und für den Auftraggeber
trotzdem gesagt.*
