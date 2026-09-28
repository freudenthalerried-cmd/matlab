# Fünfmal an einem Tag: der Prüfer, der nichts angesehen hat

Stand: 2026-08-27. Heute ist derselbe Fehler fünfmal aufgetreten, jedes Mal
in einem anderen Werkzeug, jedes Mal von mir gebaut:

| Werkzeug | zeigte auf | meldete |
|---|---|---|
| `pruefe-inhalte` | eine Probedatei mit 15 Absätzen statt 23 Seiten | 7 Treffer, wie vorgesehen |
| `pruefe-quellen` | eine Vorlage mit **erfundenen** Quellen | „3 von 3 belegt" |
| Rahmenprobe im Shop | eine Seite, deren Skript nie lief | grün |
| Warenkorbprobe im Rahmen | eine leere Seite | „null zu kleine von null" |
| deren Absicherung dagegen | zählte die Kopfleiste mit | immer erfüllt |

**Keiner war kaputt.** Jeder tat genau, was in ihm stand. Jeder sah nur das
Falsche an.

> **Ein Prüfer, der nichts angesehen hat, ist nicht still — er ist
> zustimmend.** Und Zustimmung ist die teuerste Sorte Fehlmeldung, weil ihr
> niemand nachgeht.

Dieser Lauf zieht die Konsequenz: `npm run pruefe-pruefer`.

## Was das Werkzeug tut — und was ausdrücklich nicht

Es stellt jedem Prüfer **eine** Frage: *Wie viele Einheiten hast du
angesehen?* Bleibt die Zahl unter einem hinterlegten Mindestmaß, gilt der
Prüfer als nicht gelaufen — unabhängig davon, ob er Treffer gemeldet hat.

```
✓ pruefe-inhalte — 23 Inhaltsseiten
✓ pruefe-seiten — 54 gebaute Seiten
✓ pruefe-quellen — 6 belegpflichtige Aussagen
✓ pruefe-widerrufe — 122 Verzeichnisdateien
✓ pruefe-geheimnis — 46 Artikel
✓ pruefe-tests — 682 Testfälle
```

**Es liest keinen einzigen Befund.** Was die Prüfer melden, steht in ihrer
eigenen Ausgabe und gehört einzeln angesehen. Dieses Werkzeug beantwortet
nur die Frage, die vor jedem Befund kommt — und die bisher niemand gestellt
hat.

Die Mindestmaße liegen deutlich unter dem heutigen Stand. Sie sollen
anschlagen, wenn ein Prüfer auf eine Probe zeigt, nicht bei jeder
gelöschten Seite.

### Die Gegenprobe

Beide Voreinstellungen zurückgestellt, wie sie heute früh waren:

```
✗ pruefe-inhalte   nur 1 Inhaltsseiten angesehen, erwartet mindestens 20
✗ pruefe-quellen   nur 3 belegpflichtige Aussagen angesehen, erwartet mindestens 5
6 Prüfer befragt, 2 ohne belastbaren Umfang.
```

**Der Fehler des ganzen Tages wäre in einem Aufruf sichtbar gewesen.**

## Der zweite Fund: es gab kein Quellenregister

`pruefe-quellen` zeigte nicht nur auf eine Vorlage — es gab **nichts
anderes, worauf es hätte zeigen können.** Das Werkzeug steht seit dem
25. August bereit und hat in drei Tagen nie echte Eingabe gesehen.

> **Ein Werkzeug ohne Bestand prüft die Vorlage und meldet Grün.**

Das Register ist jetzt gebaut: `inhalte/quellen.json`, die Fundstellen, auf
die sich die Inhaltsseiten wirklich berufen.

| | |
|---|---|
| tragende Quellen | **4 Normen** — ÖNORM B 6400:2004, ÖNORM B 2501:2009, ETAG 004, EN 12056 |
| Hinweisquellen | 5 Herstellerseiten (Synthesa, Baumit, Schiedel, Isover, Soudal) |
| belegte Aussagen | **6** — WDVS-Systemprüfung, Dübeluntergrenze, Bogenregel, Mindestnennweite, Gefälle, Verjüngung |
| offene Aussagen | 0 |

Drei Dinge daran sind Absicht und stehen im Register:

1. **Keine Herstellerseite trägt eine Aussage.** Sie sind als *Hinweis*
   geführt, nicht als Fundstelle — die Merkblätter sind von hier nicht
   abrufbar, und eine abgeschriebene Kennwerttabelle wäre in dem Moment
   falsch, in dem der Hersteller sie ändert. Ein Testfall hält fest, dass
   keine Aussage allein an ihnen hängt.
2. **ETAG 004 ist über B 6400 zitiert**, nicht selbst eingesehen. Das steht
   in der Notiz und auf der Seite.
3. **Preise stehen nicht im Register.** Sie tragen ihren Preisstand am
   Artikel und stammen aus Lieferantenbelegen; eine Rechnung ist kein Beleg
   im Sinn dieses Registers, sondern ein Geschäftsvorfall.

## Warum das mehr ist als Aufräumen

Die fünf Fälle haben eine gemeinsame Form, und sie ist unangenehmer als
ein Programmierfehler:

> Jeder dieser Prüfer wurde gebaut, **weil** an dieser Stelle einmal etwas
> schiefgegangen war. Jeder war die Lehre aus einem Fehler. Und jeder hat
> danach eine Zeile gemeldet, die aussah wie ein Beweis.

Ein Programmierfehler wird von einem Testfall gefunden. Ein Prüfer, der auf
das Falsche zeigt, wird von nichts gefunden — er ist ja grün. Deshalb
braucht die Prüfkette eine Stufe, die nicht fragt *was hast du gefunden*,
sondern *hast du überhaupt hingesehen*.

## Stand der Prüfkette

| Werkzeug | Umfang | prüft |
|---|---|---|
| `npm test` | 687 Testfälle | den Rechenkern |
| `pruefe-tests` | 682 Testfälle | ob die Testfälle hohl sind |
| `pruefe-inhalte` | 23 Seiten, 334 Absätze | Aussagen im Quelltext |
| `pruefe-seiten` | 54 Seiten, 136 Absätze | Aussagen in den gebauten Seiten |
| `pruefe-quellen` | 6 Aussagen, 9 Quellen | ob jede Aussage ihre Fundstelle trägt |
| `pruefe-widerrufe` | 122 Dateien | ob Widerrufenes wieder auftaucht |
| `pruefe-geheimnis` | 46 Artikel | ob der Einkauf rückrechenbar ist |
| `oberflaechenprobe` | 11 Szenarien | die Arbeitsoberfläche im Browser |
| `shopprobe` | 23 Szenarien | den Shop im Browser |
| **`pruefe-pruefer`** | **6 Prüfer** | **ob sie überhaupt etwas angesehen haben** |

Was `pruefe-pruefer` **nicht** abdeckt: die beiden Browserproben. Sie
melden ihre Szenarienzahl, aber ein grünes Szenario kann trotzdem eine
leere Seite gemessen haben — genau das ist heute passiert. Dort hilft nur,
was dort schon eingebaut ist: Jedes Szenario muss einen Beweis mitliefern,
dass es etwas gesehen hat (die Überschrift der Seite, die Zahl der
gefundenen Elemente). **Das ist dieselbe Regel, eine Ebene tiefer.**
