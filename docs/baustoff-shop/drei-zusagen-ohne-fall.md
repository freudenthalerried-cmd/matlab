# Drei Zusagen ohne Fall — der Deckungslauf als Werkzeug, nicht als Ziel

**31. August 2026.** Der Durchgang davor hat den Deckungslauf eingeführt, um
Wachen zu finden, die nie ausgelöst haben. Das Werkzeug bleibt nützlich,
sobald man es **nicht** auf eine Prozentzahl richtet: Interessant ist nicht,
wie hoch die Deckung ist, sondern *was* in den Lücken steht.

Nachgesehen, was die verbliebenen Lücken in `src/` sind — keine Wachen mehr,
sondern drei Stellen, an denen ein Modul dem Kunden etwas zusagt.

## 1. Die Stückliste, die stumm kürzt

`src/bedarf.js` rechnet den Materialbedarf für ein Gebäude. Sein Dateikopf
verspricht:

> „das gehört in die Ausgabe, nicht ins Kleingedruckte."

Gemeint ist der Fall, dass der Rechner eine Position kennt, die das Sortiment
nicht führt. Der Code hält das ein — an **zwei** Stellen, und beide waren
ohne Fall:

- `nimm()` meldet jede Position, deren Artikelnummer im Katalog fehlt.
- Die Bahn, die Leitposition, hat eine **eigene** Meldung, weil ihr Wächter
  den ganzen Block überspringt, bevor `nimm()` überhaupt gefragt wird. Ohne
  sie verschwände ausgerechnet die Hauptposition am leisesten.

> **Eine Stückliste, die stumm kürzt, sieht vollständig aus.** Das ist der
> Unterschied zu einer, die kurz ist und es sagt.

## 2. Die Lieferung ins Ausland

`pruefeLieferort` (Gate 23) kannte drei Fälle in der Probe: fehlender Bezirk,
Bezirk außerhalb des Gebiets, Bezirk im Gebiet. Der vierte — **falsches
Land** — war ungeprüft, obwohl er der einzige ist, dessen Grund eine Angabe
des Kunden zurückspiegelt („angegeben ist DE"). Mitgeprüft: Kleinschreibung
ist dieselbe Angabe, und eine fehlende Landangabe darf nicht am Land
scheitern — sonst scheiterte jedes Formular, das das Feld nicht führt, am
falschen Grund.

## 3. Zwei Sperren vor der Rechnung, eine davon verwechselt

`darfRechnungGestelltWerden` hält eine Rechnung zurück, wenn der Katalog
Platzhalterpreise trägt **oder** wenn Pflichtangaben nach § 11 UStG fehlen.
Der Deckungslauf nannte eine Zeile; ich las die falsche Bedingung und schrieb
den Fall für die Platzhalter. Die Probe wurde grün, die Lücke blieb — sie saß
zwei Zeilen höher.

Erst das erneute Messen zeigte es. **Der Deckungslauf nennt die Zeile, nicht
den Grund**; wer die Zeile nicht aufschlägt, schließt die Lücke daneben.

Beide sind jetzt belegt: der Platzhalterfall und der unvollständige Beleg
(fehlende UID des Ausstellers über 400 € brutto — ein Rechnungsmangel).

## Eine Gegenrichtung, die erst gebaut werden musste

Beim Platzhalterfall schlug die Gegenprobe zunächst fehl, und das war
lehrreich: Der Warenkorb dieser Testdatei stammt aus `data/artikel.json`, dem
Katalog des abgelösten Modells — **dessen Preise sind sämtlich Platzhalter**.
Wer ihn als „sauberen" Fall nimmt, prüft nichts, weil der Grund ohnehin
dasteht. Die Gegenrichtung musste ausdrücklich gebaut werden.

Derselbe Katalogunterschied, der diese Woche schon dreimal etwas verdeckt hat
— hier hätte er beinahe eine Probe wertlos gemacht, die grün gemeldet hätte.

## Gegenproben

| entfernte Zusage | erkannt |
|---|---|
| fehlende Position verschwindet stumm | ja |
| fehlende Leitposition verschwindet stumm | ja — 2 rot |
| Lückenhinweis wird gar nicht ausgegeben | ja — 3 rot |
| Landprüfung entfernt | ja |
| Platzhaltersperre der Rechnung entfernt | ja — 2 rot |
| § 11-Sperre entfernt | ja |

Zu jeder ihre Gegenrichtung: Bei vollständigem Sortiment darf kein
Lückenhinweis stehen, mit bestätigten Preisen kein Platzhaltergrund, mit
vollständigen Angaben kein § 11-Grund. Ein Hinweis, der immer dasteht, sagt
nichts mehr.

## Was der Deckungslauf jetzt noch zeigt

`bedarf.js`, `liefergebiet.js` und `beleg.js` stehen auf 100 % Zeilendeckung.
Die verbliebenen elf Dateien mit Lücken sind **nicht** als Aufgabenliste zu
lesen — das wäre die Prozentzahl zum Ziel gemacht. Sie sind ein Verzeichnis
von Stellen, die noch niemand angesehen hat; ob dort etwas zugesagt wird, muss
man einzeln nachlesen. Für einen späteren Lauf vermerkt:

```
abgleich.js   artikelliste.js   buendel.js   entkommentieren.js
kontrolle.js  kunde.js   kundenanfrage.js   markdown.js
preisliste.js   quellen.js
```

## Stand

983 Testfälle grün (vorher 977), `pruefe-tests` 981/0, Zeilendeckung über
`src/` 98,02 %, elf Prüfer mit `--mit-browser` ohne Beanstandung,
`pruefe-stand` 205/205.
