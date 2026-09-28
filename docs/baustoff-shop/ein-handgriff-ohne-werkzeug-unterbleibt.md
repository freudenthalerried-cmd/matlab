# Ein Handgriff ohne Werkzeug unterbleibt

**9. September 2026, nachmittags.** Die Runde davor hat die Zahl der Prüfer in
der Quelle nachgezogen — 39 auf 40. Veröffentlicht war sie damit nicht.

Auf GitHub stand bis eben:

| | Quelle | veröffentlicht |
|---|---|---|
| Testfälle | über 2.000 | **über 1.000** |
| Prüfer | 40 | **39** |

Zwei Zahlen, zwei Runden alt. **Und es ist das dritte Mal.**

| Wann | Quelle | veröffentlicht |
|---|---|---|
| 5. September | 25 Prüfer | 24 |
| 9. September, vormittags | 31 Gates | 30 |
| 9. September, nachmittags | 40 Prüfer, über 2.000 Testfälle | 39, über 1.000 |

Jedes Mal war `pruefe-schaufenster` **grün** — es misst die Quelle gegen den
Bestand, und die Quelle stimmte. Am 5. September entstand deshalb
`npm run pr-text`, das genau den Text ausgibt, der veröffentlicht gehört.

> **Ein Werkzeug, das den richtigen Text ausgibt, hat ihn nicht
> veröffentlicht. Ein Handgriff ohne Werkzeug unterbleibt.**

---

## Zuerst der Handgriff

Die Beschreibung ist mit `npm run pr-text` neu gesetzt. Beide Zahlen stehen
jetzt auf GitHub.

## Dann das Werkzeug dafür

`docs/baustoff-shop/pr-veroeffentlicht.json` hält den **Fingerabdruck** des
zuletzt veröffentlichten Textes — sha256, Datum, Werkzeug. Kein zweiter
Abzug des Textes: *eine zweite Kopie wäre eine Liste, die niemand pflegt.*

`veroeffentlichungsbefund` an `pruefe-schaufenster` vergleicht ihn mit dem,
was `npm run pr-text` heute ausgibt. Weichen sie ab, sagt der Lauf: **hier
steht eine Veröffentlichung aus.**

### Was er belegt und was nicht

**Er belegt nicht, dass GitHub diesen Text zeigt.** Das ließe sich von hier aus
nicht messen — der Netzausgang ist gesperrt —, und ein Prüfer, der es
behauptete, wäre eine Behauptung mit Ziffern. Belegt ist der **Handgriff**,
nicht sein Ergebnis.

Die Grenze steht in der Datei selbst, unter `_grenze`, und ein Testfall hält
fest, dass sie dort steht. Ein Vermerk ohne brauchbaren Fingerabdruck ist kein
stilles Bestehen, sondern `vermerk-ohne-fingerabdruck`: *nicht messbar ist
nicht grün.*

**Gezeigt, dass es anschlägt:** Die Prüferzahl in der Quelle auf 41 verschoben
— zwei Meldungen, die veraltete Zahl **und** die ausstehende Veröffentlichung.
4 neue Testfälle.

---

## Warum es diesmal auffiel

Weil der Prüfer seit der Runde davor **im Haken** steht: 0,6 s statt 24, seit
er die Zahl der Testfälle entgegennimmt statt sie neu zu erheben. Der nächste
Commit, der die Beschreibung ändert und die Veröffentlichung vergisst, bleibt
stehen.

Drei Runden hintereinander dieselbe Kette: erst der Befund, dann die Frage,
warum ihn niemand vorher sah, dann das Werkzeug an die Stelle, wo es zuschlägt.
