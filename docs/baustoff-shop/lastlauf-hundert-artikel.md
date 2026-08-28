# Der Lastlauf: hundert Artikel eingespielt, fünf Proben umgefallen

**28. August 2026.** Der Importweg steht, die Artikelliste fehlt noch. Statt
zu warten: **einspielen und nachsehen.** Hundert Zeilen — die 41 echten
Bezeichnungen aus dem Lagerhaus-Register plus Stärken- und Winkelvarianten,
mit erfundenen Preisen — gegen den echten Katalog, dann das ganze Werk
laufen lassen.

Der Katalog wuchs von 46 auf 141 Artikel. Die Website baute durch: 176
Seiten, kein toter Verweis. **Fünf Proben fielen um, und keine davon wegen
eines echten Fehlers im Shop.**

> **Jede der fünf prüfte den heutigen Bestand statt der Zusage.**

## Die fünf

| Probe | erwartete | musste heißen |
|---|---|---|
| Sperrgutquelle | `=== 'eingeschaetzt'` | eine der **bekannten** Quellen |
| Gewichtsquelle | `=== 'rechnung'` | „rechnung" oder „liste" |
| Bauform-Schlüssel | jeder Artikel handgeprüft | jeder **Rechnungsartikel** handgeprüft |
| Importprobe | „48 Artikel" | Bestand **plus zwei** |
| Kundenwort-Rang | im ganzen Katalog | an einem festen Satz Artikel |

Die ersten beiden sind derselbe Fall: Eine Prüfung auf **genau einen
erlaubten Wert** ist eine Prüfung auf den heutigen Bestand. Die Zusage lautet
nicht „es ist eine Einschätzung", sondern „jede Angabe sagt, woher sie
kommt". Neue Quellen gehören eingetragen — und damit einmal bedacht.

Der **Bauform-Schlüssel** war die interessanteste Entscheidung. Er hält für
jeden der 46 Artikel die von Hand entschiedene Zeichnung fest; bei
fünfhundert Artikeln aus einer Preisliste kann das niemand pflegen, und ein
Schlüssel, den man nicht pflegen kann, wird gelöscht statt gepflegt. Jetzt
gelten **zwei Zusagen statt einer**:

1. **Handgeprüft, wo Handprüfung möglich ist** — für die Artikel aus den
   Rechnungen bleibt jede Form einzeln festgehalten.
2. **Nichts behaupten, wo sie es nicht ist** — ein eingespielter Artikel
   bekommt eine gültige Form, und seine Zeichnung darf kein Maß nennen, das
   sie nicht gelesen hat. Dieselbe Regel wie bei der Platte mit den
   erfundenen 600 mm.

## Zwei Browserproben schrieben die Sortimentsgröße fest

„9 Artikel" und „von 46 Artikeln" standen als Erwartung in der Probe. Beide
fielen um, obwohl der Filter tadellos arbeitete. Eine Probe, die die Größe
des Sortiments festschreibt, meldet beim Wachsen einen Fehler, den es nicht
gibt — und lädt dazu ein, sie **anzupassen statt sie zu lesen**.

Geprüft wird jetzt das Verhalten: Die Sortierung steigt, und die Zahl im
Filter stimmt mit der Zahl der gezeigten Karten überein. Beides rechnet die
Seite selbst aus.

## Und dabei fiel eine Falle auf, die schon länger dalag

Beim Umbau schlug die neue Probe fehl, obwohl das Ergebnis richtig aussah:
`roh=[58 Artikel]`, aber `gemeldet=-1`. Der Grund:

> **`\d` überlebt den Weg in die Probe nicht.** Der Szenarientext wandert als
> Zeichenkette durch zwei Vorlagenschichten in eine HTML-Datei; der Backslash
> geht dabei verloren, und aus `/\d+/` wird `/d+/`.

Das Tückische daran ist nicht der fehlende Treffer, sondern die Nebenwirkung:
`[^\d,.]` wurde zu `[^d,.]`, damit waren **alle Preise null**, und die
Prüfung „Preise steigen" war klaglos wahr — an einer Liste von Nullen. Eine
Probe, die aus dem falschen Grund grün ist, ist die vierte Ausprägung
desselben Musters in dieser Woche.

Alle Ziffernklassen in den Szenarien stehen jetzt als `[0-9]`, mit dem Grund
daneben.

## Was der Lastlauf sonst ergab

- **141 Artikel bauen durch**, 176 Seiten, kein toter Verweis
- `pruefe-seiten` wächst mit: 153 Seiten, 502 Fließtextabsätze, 0 Verdacht
- Die Einzeldateifassung wächst auf **3,3 MB** (bei 46 Artikeln: 1,5 MB).
  Bei fünfhundert Artikeln wären es rund 10 MB — dann ist die
  Einzeldateifassung als Auslieferungsform am Ende. Die Mehrseitenfassung
  ist davon nicht betroffen; sie lädt je Seite.
- Nach den Reparaturen: **762 Tests, 29 Browserszenarien, alle Prüfer grün —
  sowohl mit 46 als auch mit 141 Artikeln.**

Der Katalog steht wieder auf 46. Der Lastlauf hat nichts hinterlassen außer
den Reparaturen.

## Warum das vor der Lieferung wichtig war

Wäre die Artikelliste zuerst gekommen, hätten fünf Proben und zwei
Browserszenarien gleichzeitig gemeldet, dass etwas kaputt sei. Nichts davon
wäre kaputt gewesen. Der wahrscheinlichste nächste Schritt in dieser Lage
ist, die Erwartungen „nachzuziehen" — und dabei verliert man genau die
Prüfungen, die man am Tag eines Datenimports am dringendsten braucht.
