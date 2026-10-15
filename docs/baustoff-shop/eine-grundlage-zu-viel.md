# Eine Grundlage zu viel

**12. September 2026. Runde 46.**

## Der Fund

`npm run pruefe-gebinde` ist seit dem 8. September die eine Weigerung in jedem
Lauf: `preise/poschacher-positionen.csv` ist verloren, sie liegt außerhalb des
Verzeichnisses, und ohne die fakturierten Mengen lässt sich der aus dem
Artikelnamen gelesene Gebindeschritt gegen nichts halten. Das ist richtig so.

Nur maß dieses Werkzeug **zweierlei**:

| Prüfung | Grundlage |
| --- | --- |
| Gebindeschritt gegen fakturierte Mengen | `preise/poschacher-positionen.csv` — verloren |
| Einheitenliste gegen den Katalog | `data/katalog-baustoff.json` — da |

Der Abbruch stand ganz oben. Er nahm die zweite Prüfung mit, die von der
verlorenen Datei gar nichts wissen will.

> **Eine fehlende Grundlage legt die Prüfung still, die auf ihr steht — nicht
> die daneben.**

Vier Tage lang hat niemand gemessen, ob die Einheitenliste noch zum Katalog
passt. Das ist keine theoretische Lücke: Genau diese Prüfung hat am
5. September gefunden, dass `STUECKEINHEITEN` drei Einheiten führte, die es im
Katalog nicht gibt, und drei nicht kannte, die vorkommen — *folgenlos nur,
weil zufällig keiner der sechs betroffenen Artikel ein Kilogramm im Namen
trägt.*

## Und der Schaden ging weiter

Die Gegenprobe `einheitenliste-von-gestern` beweist genau diese Regel. Sie lief
seit dem 8. September in jedem Gesamtlauf als *„der Prüfer kann nichts messen"*
— nicht, weil ihr etwas fehlte, sondern weil das Werkzeug, an dem sie hängt,
aus einem anderen Grund stumm war.

Dieselbe Familie wie der Fund vom Vortag, nur eine Ebene tiefer: Dort machte
ein **Fehlalarm** vier Beweise unmessbar, hier eine **Weigerung** einen.

## Was geändert wurde

Zwei Grundlagen, zwei Werkzeuge. `npm run pruefe-einheiten` ist der
zweiundsechzigste Prüfer des Bestands und liest nur den Katalog.

| | |
| --- | --- |
| `bin/einheitenpruefung.mjs` | neu — 46 Artikel gegen die Einheitenliste, 0,3 s |
| `bin/gebindepruefung.mjs` | bleibt bei der Weigerung, nennt jetzt das neue Werkzeug |
| Schnelllauf | 47 → **48 Prüfer**, 6,1 s |
| `einheitenliste-von-gestern` | unmessbar seit 8.9. → **schlägt an, 2 s** |

Der Prüfer war nicht kaputt und die Weigerung nicht falsch — falsch war nur,
dass beides in einer Datei stand. Ein Werkzeug mit zwei Grundlagen ist so
messbar wie seine schlechtere.

## Was bleibt

`pruefe-gebinde` weigert sich weiter, und die Gegenprobe `gebindeschritt-verlesen`
bleibt damit unmessbar. Das ist jetzt der ganze Schaden der verlorenen Datei
und nicht mehr: **eine** Prüfung, **eine** Gegenprobe. Die Positionsliste steht
unverändert als offener Punkt beim Auftraggeber — sie ist aus dem Kundenkonto
des Lieferanten neu zu ziehen.

---

**Die Regel dieser Runde:** *Ein Werkzeug ist so messbar wie seine schlechteste
Grundlage — also trägt jede Grundlage ihr eigenes Werkzeug.*
