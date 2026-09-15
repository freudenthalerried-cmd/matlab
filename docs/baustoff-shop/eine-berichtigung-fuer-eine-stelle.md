# Eine Berichtigung, die eine Stelle erreicht

**10. September 2026**

Am 9. September stand in `data/aussenlage.json`:

> *„Der Shop kann keines der beiden Felder selbst erheben: Sein Netzausgang ist
> gesperrt."*

Am 10. war gemessen, dass das zu weit gezogen ist — `api.github.com` antwortet,
`bauversand.com` und die Herstellerseiten nicht. **Berichtigt wurde die Datei,
in der es stand.**

Gezählt: **22 solche Sätze in 15 Quelldateien.** Die Berichtigung erreichte
drei davon.

> **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**

Derselbe Satz hat diesem Vorhaben am 9. September die Leitzahl gekostet: Die
Frachtkorrektur war an der Funktion angekommen und nicht an den Daten. Eine
Ebene höher ist es dasselbe.

---

## Einer der Sätze war bereits widerlegt

`src/schaufenster.js` sagte über den Veröffentlichungsvermerk:

> *„Das ließe sich von hier aus nicht messen — der Netzausgang ist gesperrt."*

In **derselben Nacht** ist `npm run abgleich-veroeffentlichung` entstanden, das
die veröffentlichte Fassung über `api.github.com` holt und Zeichen für Zeichen
gegen die Werkzeugausgabe hält. Der Satz stand noch da, während das Werkzeug
daneben lief.

> **Ein Satz über eine Grenze veraltet in dem Augenblick, in dem jemand sie
> überschreitet — und bleibt trotzdem stehen, bis ihn jemand liest.**

---

## Zwei Grenzen, die nie jemand versucht hatte

Beim Nachziehen der Sätze fielen zwei auf, die sich auf **ungemessene**
Adressen beriefen:

| Datei | behauptete | gemessen am 10.09. |
|---|---|---|
| `src/betreiberform.js` | die UID-Prüfung beim EU-System sei nicht erreichbar | `ec.europa.eu` — keine Verbindung |
| `src/crawler.js` | die Crawler-Dokumentationen seien nicht lesbar | `developers.google.com`, `platform.openai.com`, `docs.anthropic.com`, `commoncrawl.org` — keine Verbindung |

**Beide Aussagen stimmen.** Was fehlte, war der Versuch: Sie standen als
Behauptung da und stehen jetzt als Messung. Beide sind seither eigene Einträge
im Register der Außengrenzen, mit Weg und Datum.

Das ist der ganze Unterschied — und er ist nicht klein. Der Punkt zu
`Google-Extended` kostet den Auftraggeber einen Blick in eine Dokumentation;
solange die Sperre nur behauptet war, hätte auch niemand gemerkt, wenn sie
inzwischen offen wäre.

---

## Der Prüfer misst es seither

`npm run pruefe-grenzen` liest jetzt auch den Quelltext: **Wer sperrt, nennt
die Adresse.** Eine Pauschale ohne Adresse ist keine Messung, sondern ein Satz,
der überall zutrifft und deshalb nichts ausschließt.

Nach dem Nachziehen: **19 Sätze über den Ausgang, jeder mit seiner gemessenen
Adresse, keine Meldung.**

---

## Und dabei wäre der Prüfer beinahe grün geworden, ohne etwas zu prüfen

Das Muster der ersten Fassung verlangte die Wortstellung *Netzausgang … ist …
gesperrt*. Beim Nachziehen wanderte das „ist" in fast allen Sätzen davor:

```
vorher   Der Netzausgang dieser Umgebung ist gesperrt.
nachher  Für bauversand.com ist der Netzausgang gesperrt.
```

Die Zahl der **gesehenen** Sätze fiel von 24 auf **7**. Der Prüfer meldete
grün — nicht weil die Sätze ihre Adresse bekommen hatten, sondern weil sie aus
seinem Blickfeld gerutscht waren.

> **Ein Prüfer, der grün wird, weil er wegsieht, ist schlimmer als keiner.**

Aufgefallen ist es nur, weil ein Testfall die **Zahl der gefundenen Sätze**
festhält und nicht bloß die Zahl der Meldungen. Ein Testfall, der „keine
Meldungen" prüft, hätte die Runde bestanden.

Gesucht wird seither der **Satz**, in dem das Wort steht, und darin ein
Sperrwort — in beliebiger Reihenfolge. Die Zahl steht als Untergrenze im
Testfall: Fällt sie wieder, ist das ein Befund und kein Fortschritt.

---

## Zum vierten Mal: eine Gegenprobe, die sich an sich selbst stößt

Der erste Mutationstext der neuen Gegenprobe war der pauschale Satz selbst —
und der steht damit in `src/gegenprobenregister.js`, das mitgelesen wird. Der
Prüfer war rot, bevor die Probe lief. Mutiert wird jetzt die **Adresse**, nicht
der Satz.

Dasselbe traf danach die **Beschreibung** der Probe: Das Feld `was` erklärte
sie mit genau dem Satz, um den es geht. Auch das war eine Meldung, und auch die
war richtig.

> **Ein Register, das seine Mutationen aufschreibt, schreibt sie in den
> Bestand, den es prüft.**

Viermal in vier Runden dieselbe Bewegung — beim Rechtsprüfer, beim Kalender,
bei der Marke, hier. Sie ist kein Fehler des jeweiligen Prüfers, sondern der
Preis dafür, dass die Register Klartext führen statt Kennziffern. Der Preis ist
es wert: Ein Register, das man lesen kann, wird gelesen.
