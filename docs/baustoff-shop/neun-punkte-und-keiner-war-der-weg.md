# Neun Punkte, und keiner war der Weg

**3. September 2026.** `npm run startklar` beantwortet die Frage „darf der Shop
online gehen?" aus den Daten statt aus dem Gedächtnis. Es führte neun Punkte:
Impressum, Antwortzeit, Preise, Platzhalter, Lieferzeit, Zahlungsanbieter,
Rechtstexte, Domain, Repository. Sieben davon sind Zulieferungen des
Auftraggebers, zwei sind von hier aus nicht feststellbar.

Sind alle neun geschlossen, meldet das Werkzeug `startklar: true`. Nachgemessen,
nicht vermutet:

```
startklar: true | offen: 0 | unpruefbar: 0
kassenhinweise: 0
```

Vier Oberflächen lesen dieses Ja als **„Bestellen ist möglich"**:

| Ort | Was bei `startklar: true` geschieht |
|---|---|
| Startseite | der Vorschaukasten fällt weg |
| Fuß aller 81 Seiten | wechselt auf den Normalsatz, ohne „Vorschau ohne Bestellmöglichkeit" |
| Kasse | die Absage „Bestellen können Sie hier nicht" verschwindet |
| `llms.txt` | schreibt Assistenten wörtlich hin: „**Bestellen ist möglich.**" |

> **Keiner der neun Punkte ist der Bestellweg selbst.** Der Auftraggeber hätte
> alle schließen können, und diese Seite hätte danach genau so wenig eine
> Bestellung entgegengenommen wie vorher — weil dafür nichts gebaut ist.

## Was der Shop heute wirklich kann

Er rechnet. Er erzeugt einen fertigen Anfragetext mit Positionen, Fracht,
Umsatzsteuer und Preisstand, den der Kunde in sein **eigenes** Mailprogramm
kopiert. Abgeschickt wird nichts:

```
$ grep -n "fetch(\|XMLHttpRequest\|sendBeacon\|<form\|\.submit(" shop-ui.js src/*.js bin/website.mjs
(keine Treffer)
```

Der Shop ist ein Satz statischer Dateien ohne Gegenstelle. Das ist keine Lücke,
sondern die getroffene Entscheidung — sie steht in `anfrage-statt-wand.md` und
in jedem Außentext: *„Diese Liste ist eine Anfrage, keine Bestellung."* Falsch
war nicht der Shop, sondern die **Bereitschaftsliste**, die eine Bedingung
führte, die es nicht gibt, und deshalb grün werden konnte, ohne dass die Sache
existiert.

Es ist die Familie „ein Prüfer, der nicht rot werden kann" in der anderen
Richtung: ein Prüfer, der **falsch grün** werden kann.

## Die Probe trug dieselbe Annahme

`test/website.js` ließ den Bau zweimal laufen — einmal auf dem Bestand, einmal
mit einer vollständig beantworteten Betreiberdatei — und verlangte, dass die
Auskunft auf „Bestellen ist möglich" kippt. Sie hätte den Befund also nicht
finden können: Sie war aus derselben Annahme gebaut.

> **Eine Probe, die dieselbe Annahme trägt wie die Sache, bestätigt sie und
> prüft sie nicht.**

Sie gibt seit heute eine Oberfläche mit, die abschicken kann (die echte plus
eine Zeile mit `fetch`), und fährt den grünen Zweig damit ehrlich.

## Was jetzt gemessen wird

Neu ist `src/bestellweg.js`. Es liest den Quelltext, den der **Browser des
Kunden** bekommt, und sucht darin die Wege, auf denen eine Seite Daten
hinausgibt: `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, ein Formular.
Jeder Eintrag trägt seine Begründung, wie in jedem Register dieses Hauses.

Der neue erste Punkt von `startklar()` heißt **„Der Kunde kann eine Bestellung
abschicken"**, ist mit `Werkzeug` gezeichnet und steht vorn, weil ohne ihn die
anderen acht nichts bewirken. Auf der Kasse liest der Kunde ihn als *„ein Weg,
die Bestellung abzuschicken"*.

### Warum `mailto:` nicht zählt

Die Kasse bietet einen Mailverweis an. Er sendet nichts: Er öffnet das Programm
des Kunden, und ob dort jemand auf „Senden" drückt, erfährt dieser Shop nie.
Was dabei hinausgeht, heißt in jedem Text dieses Hauses Anfrage und
ausdrücklich keine Bestellung. Wer `mailto:` in die Liste aufnähme, machte den
Punkt grün, ohne dass eine einzige Bestellung ankäme — deshalb steht der Fall
als eigene Probe im Verzeichnis, mitsamt der Gegenprobe, dass ein echtes
`fetch` denselben Text kippt.

### In welche Richtung diese Messung irren darf

Die Liste ist nicht die Aufzählung aller Möglichkeiten eines Browsers — die
gibt es nicht. Ein fünfter, ungenannter Weg führt dazu, dass der Punkt `offen`
bleibt, obwohl er erfüllt wäre.

> **Das ist die richtige Richtung.** Eine Bereitschaftsprüfung, die im Zweifel
> „noch nicht" sagt, kostet eine Nachfrage; eine, die im Zweifel „fertig" sagt,
> kostet eine Bestellung, die niemand bekommt.

## Der dritte Satz, der sich nicht beugte

Beim Nachsehen fiel ein zweiter, kleinerer Befund an derselben Stelle an.
Denselben Satz gab es dreimal:

| Ort | Fassung |
|---|---|
| Fuß aller Seiten | `es ${n === 1 ? 'fehlt' : 'fehlen'} …` |
| Startseite | `es ${n === 1 ? 'fehlt' : 'fehlen'} …` |
| Kasse (im Browser) | `'Es fehlt ' + fehlt.join(', ')` |

Die Kasse schrieb also **„Es fehlt ein vollständiges Impressum, eine zugesagte
Antwortzeit, die Lieferzeit des Lieferanten, ein Zahlungsanbieter, verbindliche
Rechtstexte."** — Einzahl vor fünf Punkten. Kein Fehler in einer Zahl, und
genau die Sorte, an der ein Bauleiter merkt, dass die Seite niemand gelesen
hat.

Der Grund ist nicht Nachlässigkeit, sondern die Zahl drei: **Drei Stellen
bildeten denselben Satz, also gab es ihn dreimal**, und die dritte steht im
Browser, hat die Liste und nicht die Regel. Jetzt bildet ihn `fehltSatz()`
einmal; der Browser bekommt ihn fertig mitgeliefert. Die Liste fährt weiter
mit, damit die Probe an den 81 gebauten Seiten den Satz unabhängig
nachrechnen kann — und eine Zusicherung bindet die beiden aneinander.

## Was sich am Bestand ändert

- `npm run startklar`: zehn Punkte statt neun, der erste rot.
- `npm run offenepunkte`: 19 Punkte in 5 Gruppen; der neue steht unter
  **„Meine Arbeit"** und nicht beim Auftraggeber — es ist kein Feld, das
  jemand einträgt.
- `llms.txt`: „**Bestellen ist noch nicht möglich** — es fehlen ein Weg, die
  Bestellung abzuschicken, …". Ein Assistent, der einen Kunden berät, liest
  jetzt als Erstes den Grund, der zählt.
- Der Fuß aller 81 Seiten nennt ihn ebenfalls zuerst.

Der Punkt bleibt offen, und das ist kein Rückschritt: Er war vorher auch offen,
nur ungezählt. Was sich geändert hat, ist, dass die Liste ihn jetzt kennt — und
dass niemand mehr aus einer vollständig ausgefüllten Betreiberdatei schließen
kann, der Shop nehme Bestellungen an.

## Verweise

- `shop/src/bestellweg.js` — die Messung
- `shop/src/startklar.js` — der neue erste Punkt und `fehltSatz()`
- `shop/test/bestellweg.test.js` — acht Proben, darunter die Gegenprobe zu `mailto:`
- [`anfrage-statt-wand.md`](./anfrage-statt-wand.md) — warum der Shop Anfragen erzeugt
- [`gate25-mindestbestellwert.md`](./gate25-mindestbestellwert.md) — die Sperre, die vor dem Ja des Kunden greifen musste
