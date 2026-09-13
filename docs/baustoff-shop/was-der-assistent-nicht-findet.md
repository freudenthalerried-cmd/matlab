# Was der Assistent nicht findet

**6. September 2026, spät.** `llms.txt` ist die Datei, mit der dieser Shop
Assistenten anspricht — der Kanal, über den der Auftraggeber ausdrücklich
beworben werden will („über Google und ChatGPT"). Gezählt, was drinsteht und
was der Bau hergibt:

```
gebaute Seiten:        82
in llms.txt genannt:   70   (13 Wissen, 4 Systemlisten, 7 Gruppen, 46 Artikel)
nicht genannt:         12
```

Vier der zwölf waren die **Rechtsseiten**: Impressum, Geschäftsbedingungen,
Datenschutz und — die inhaltlich interessanteste — *Abnahme und Rügefrist,
warum § 377 UGB auf der Baustelle beginnt und nicht im Büro*.

> Wer einen Assistenten fragt, unter welchen Bedingungen dieser Händler
> liefert, ob er an Private verkauft oder wie lange die Rügefrist läuft, bekam
> von der Datei, die genau für diesen Kanal gemacht ist, **keine Antwort** —
> und ein Assistent, der nichts findet, antwortet mit dem, was bei einem
> Baustoffhändler üblich ist.

Das ist die Fehlerrichtung dieses ganzen Vorhabens: Nicht das Falsche steht da,
sondern gar nichts, und das Übliche tritt an seine Stelle.

---

## Genannt — und mit dem Satz dazu, der dazugehört

Die vier Seiten stehen seit diesem Bau in `llms.txt`, aufgezählt aus derselben
Liste, aus der auch die Übersichtsseite entsteht. Eine zweite Aufzählung wäre
die falsche Abhilfe gewesen.

Darunter steht ein Satz, der keine Zierde ist:

> **Geschäftsbedingungen, Datenschutz und Impressum sind heute eine Gliederung
> ohne verbindlichen Wortlaut**, und die Seiten weisen ihre Lücken selbst aus.
> Verbindlich ist keine Angabe daraus; der endgültige Wortlaut ist Sache eines
> Rechtstexteanbieters und heute weder beauftragt noch eingesetzt.

Drei Seiten zu nennen und das zu verschweigen hieße, ein Gerüst als Rechtstext
auszugeben — dieselbe Fehlerrichtung wie „gültig bis zur nächsten Liste". Der
Satz hängt an `betreiber.rechtstexteFundstelle` und verschwindet von selbst,
sobald der Wortlaut da ist.

---

## Und die anderen acht?

Sechs Seiten stehen bewusst nicht drin, und das war bisher nirgends
aufgeschrieben:

| Seite | warum nicht |
|---|---|
| `index` | der Gegenstand dieser Datei, nicht ein Eintrag in ihr |
| `404` | kein Ziel, sondern die Antwort auf eine Adresse, die es nicht gibt — steht aus demselben Grund auch nicht in der Sitemap |
| `suche` | Bedienfläche ohne eigenen Inhalt; was sie zeigt, entsteht erst aus der Eingabe |
| `warenkorb` | Bedienfläche ohne eigenen Inhalt; der Korb liegt im Browser |
| `wissen/index` | Übersicht über genau die Seiten, die der Abschnitt „Wissen" einzeln nennt |
| `rechtliches/index` | dieselbe Doppelung, eine Ebene weiter |

Die übrigen zwei — `kasse` und `lieferung` — standen längst drin, nur im
Fließtext statt in einer Liste.

> **Eine Auslassung ohne Grund ist von einer vergessenen Seite nicht zu
> unterscheiden.**

Deshalb `src/llmsdeckung.js`: eine Liste, ein Pflichtgrund von mindestens
40 Zeichen, ein Prüfer, der beides gegen die Wirklichkeit hält — **in beide
Richtungen**. Ein Eintrag für eine Seite, die es nicht mehr gibt, ist derselbe
Fehler wie eine Seite ohne Eintrag. Dieselbe Bauart wie das Prüferregister, das
Erzeugnisregister und die Warenkorbdeckung.

---

## Geprüft

`test/llmsdeckung.test.js`, neun Fälle: die sechs Regeln für sich, die
Pflichtlänge jedes Grundes, und zwei über den **Bestand** — jede der 82
gebauten Seiten steht in `llms.txt` oder mit Grund nicht darin, und die vier
Rechtsseiten stehen darin samt dem Satz über ihren Stand.

Gegenprobe `seiten-die-der-assistent-nie-sieht` lässt drei der vier
Rechtsseiten wieder heraus.

**Beim ersten Lauf sofort ein zweiter Fund:** `pruefe-ungerufen` meldete den
neuen Prüfer als Ausfuhr, die außerhalb der Tests niemand ruft. Er wohnt
absichtlich in der Probe — ein eigenes Werkzeug brächte keine zusätzliche
Prüfung, sondern eine zweite Stelle, an der dieselbe Liste zu pflegen wäre —,
und genau dieser Grund steht jetzt im Register. Das Register hat gearbeitet,
bevor jemand daran gedacht hat.
