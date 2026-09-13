# Eine Aufzählung ist auch eine Zahl

**7. September 2026.** Der Rolloutplan ist das Papier, das der Auftraggeber vor
der Budgetfreigabe liest — 16 Etappen, 90 Tage Frist. Zwei seiner Zeilen waren
abgelaufen.

## Erstens: die Aufzählung

Die Etappe „Ein Gespräch mit dem Lieferanten" sagte:

> *Löst die offenen Punkte der Gruppe „Anfrage" auf einmal: Lieferzeit,
> Preisrhythmus, Liefergebiet, Palettenzahl und — über eine Artikelliste mit
> EAN-Spalte — GTIN, Marke und Bild.*

Am **3. September** war aus derselben Zeile schon einmal etwas entfernt worden.
Der Kommentar daneben steht bis heute da:

> *„Ohne Zahl, absichtlich. Hier stand ‚Löst acht offene Punkte' — am
> 3. September waren es neun, weil die Palettenfrage dazukam, und die Zeile
> hätte es nicht gemerkt."*

Die Zahl war heraus. **Die Aufzählung blieb von Hand** — und lief am
6. September ab, als die sechste Frage dazukam: *Abholung durch unsere Kunden*
(Gate 28). Der Plan nannte sie nicht.

> **Eine Aufzählung ist auch eine Zahl.** Sie läuft genauso ab, nur langsamer
> und ohne dass jemand nachrechnet.

Sie kommt jetzt aus `FRAGEN`: Was im Brief steht, steht im Plan.

## Zweitens: die Zahl, die wieder eingewandert war

Eine Etappe weiter oben stand *„Suchvolumen der **32** Keywords im Liefergebiet
messen"*. Die Messliste führt **30**, seit am 1. und 6. September Keywords
entfallen sind — dieselbe Zahl war schon in der PR-Beschreibung nachgezogen
worden, im Plan nicht.

Der Titel nennt jetzt keine Menge mehr. Wie viele es sind, sagt das **Werkzeug
beim Ausgeben**, gezählt in genau der Datei, die der Auftraggeber am Messtag
vor sich hat:

```
Suchvolumen der geführten Keywords im Liefergebiet messen
  Gemessen wird die Liste aus `npm run messliste`: 30 Begriffe in 3 Anzeigengruppen.
```

---

## Der Prüfer

`planzahlbefund()` in `src/rollout.js`, und `npm run rollout` bricht ab, bevor
es einen Plan ausgibt:

* **Vorwärts:** Jede Frage des Lieferantenbriefs muss im Plan stehen. Kommt
  eine siebte dazu, hält der Plan an, statt sie zu verschweigen.
* **Und keine gezählte Menge in Titel oder Ergebnis** — „32 Keywords", „acht
  Punkte", „46 Artikel". Solche Zahlen führt ein Register, und der Plan wird
  nicht mit ihm zusammen nachgeführt.

**Eine Unterscheidung war dafür nötig**, und der Prüfer hat sie sich selbst
abverlangt: Beim ersten Lauf meldete er „Katalog auf **mindestens 100 Artikel**
erweitern". Das ist keine Bestandszahl, sondern die **Weisung des
Auftraggebers** — sie läuft nicht ab, sie wird erfüllt.

> **Eine Zielzahl ist eine Weisung, eine Bestandszahl ist eine Messung.** Nur
> die zweite gehört aus dem Plan heraus.

---

## Geprüft

Fünf neue Fälle in `test/rollout.test.js`: der Bestand (jede Frage steht im
Plan), eine fehlende Frage, eine gezählte Menge, die Zielzahl als Ausnahme, und
die fehlende Etappe — sie meldet sich selbst, statt sechs Fragen zu melden, die
nirgends stehen können.

Gegenprobe `eine-aufzaehlung-die-ablaeuft` lässt vier der sechs Fragen wieder
aus dem Plan verschwinden.
