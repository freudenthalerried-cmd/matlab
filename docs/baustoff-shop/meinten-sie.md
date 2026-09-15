# Acht von neun Vertippern fanden nichts

**28. August 2026.** Gemessen, bevor gebaut wurde. Neun plausible Vertipper
gegen den Bestand:

| Eingabe | Treffer |
|---|---|
| spachtl, kanalror, dämmplate, rauchfng | **0** |
| styropr, kantenschuz, schachtrng, gewbe | **0** |
| klebespachtel | 1 |

Wer auf der Baustelle mit einer Hand tippt, bekommt eine leere Seite und geht.

## Was jetzt passiert

Findet die Suche nichts, schlägt der Shop vor — und zwar so:

```
Kein Treffer für „kanalror".
Meinten Sie: kanalrohr?
```

Zwei Eigenschaften, die zusammengehören:

> **Es wird nichts stillschweigend ersetzt.** Der Kopf nennt weiterhin die
> eingegebene Anfrage. Der Shop sucht nicht heimlich nach etwas anderem,
> sondern fragt, und der Kunde klickt.

> **Lieber schweigen als raten.** Ist nichts nah genug, kommt kein Vorschlag.
> „dachziegel", „zement", „fliesen", „estrich" bekommen weiterhin nichts — wir
> führen sie nicht.

## Die Regel: ein Buchstabe, zwei Buchstaben, keiner

- **Bis drei Zeichen: kein Vorschlag.** Bei „dn" ist jeder Vertipper ein
  anderes Wort.
- **Bis sechs Zeichen: ein Buchstabe.** „gewbe" → Gewebe.
- **Darüber: zwei.** „kantenschuz" → Kantenschutz.

Dazu ein zweiter Anlauf für Komposita, und der war nötig: „spachtl" fand
zuerst nichts, obwohl der Shop drei Artikel mit *Spachtel* führt — als
**Wortteil**: KlebeSpachtel, Spachtelmasse. Die Suche selbst kann das (sie
sucht ab vier Zeichen auch in Wortmitten), das Vorschlagswerk konnte es
nicht. **Deutsch setzt zusammen; ein Vorschlag, der nur ganze Wörter
vergleicht, ist hier taub.**

## Der Fehler, den der zweite Anlauf zuerst gemacht hat

Mit denselben zwei erlaubten Buchstaben im Wortinneren schlug **„dachziegel"
den Hochlochziegel vor** — d→l, a→o, und schon führt die Suche nach
Dachziegeln zu einem Mauerziegel.

> Das ist genau der Fehler, den das Kundenwörter-Register ausdrücklich
> vermeidet: **ersatzweise auf etwas Ähnliches zeigen.**

Im Wortinneren kostet ein Vertipper deshalb höchstens **einen** Buchstaben.
Damit bleibt „spachtl" → Spachtelmasse, und „dachziegel" bekommt wieder
nichts. Gegengeprobt: Erlaubt man zwei, fällt die Probe „was der Shop nicht
führt, bekommt keinen Ersatzvorschlag".

## Kleinigkeit mit Wirkung: keine Doppel

Der Index legt jedes Wort zweimal ab — „dämmplatte" und „daemmplatte" —,
damit beide Schreibweisen finden. Als Vorschlag sind sie ein Wort; zwei
Zeilen mit demselben Wort in zwei Schreibweisen sehen aus wie ein Fehler des
Shops. Behalten wird die Schreibweise, die der Kunde selbst benutzt hat: **Wer
Umlaute tippt, bekommt Umlaute.**

## Geprüft

- Die acht gemessenen Vertipper, jeder mit seinem erwarteten Vorschlag — und
  jeder mit der Zusicherung, dass er **vorher** nichts fand
- Fünf Wörter ohne Ware bekommen keinen Vorschlag
- Zwei Browserszenarien: „kanalror" zeigt den Vorschlag als Verweis, der
  wirklich zur Suche nach „kanalrohr" führt; „dachziegel" zeigt keinen
- Zwei Mutationen: zwei Buchstaben im Wortinneren, und kurze Wörter
  vertippbar — beide lassen je eine Probe fallen

778 Tests grün, `shopprobe` **31 Szenarien**, `oberflaechenprobe` 11,
`pruefe-tests` 777 / 0, `pruefe-seiten` 58/263/0.
