# Sechs Tage länger im Warenkorb als überall sonst

**1. September 2026.** `shop-ui.js` ist die einzige große Quelldatei, die
ich heute noch nicht gelesen hatte — und die einzige, die **im Browser des
Kunden läuft**. Also die 35 deutschen Sätze darin durchgezählt. Bei Zeile 515,
im Warenkorb, direkt unter der Frachtsumme:

> „Die Fracht fällt je Lieferung an, ohne Frei-Haus-Schwelle. **Das steht auf
> jedem unserer Lieferantenbelege, auch auf den großen.** Deshalb weisen wir
> sie getrennt aus, statt sie in die Preise zu rechnen."

Diese Aussage ist am **27. August** zurückgenommen worden. Fracht steht auf
**drei von fünfzehn** Rechnungen; elf lauten „Abholung Kunde".

Am 31. August habe ich sie an drei Stellen berichtigt und dabei den
Widerrufsprüfer von der Akte auf den Shop ausgeweitet. Hier hat sie **sechs
Tage länger überlebt** — auf der Seite, die jeder sieht, der etwas in den
Warenkorb legt.

## Zwei Lücken hintereinander, beide meine

### Erstens: die Datei lag außerhalb aller Bestände

```
docs/baustoff-shop/*.md    Akte
shop/inhalte/**/*.md       Shoptexte
shop/bin/**/*.mjs          Werkzeuge
shop/src/**/*.js           Rechenkern
```

`shop-ui.js` liegt im **Wurzelverzeichnis** des Shops, nicht in `src/`. Vier
Bestände, und die Oberfläche in keinem.

Am 31. August habe ich geschrieben: *„Ein Widerruf, der nur die Akte erreicht,
hat den Kunden nicht erreicht."* Dann habe ich den Bestand ausgeweitet — und
dabei dieselbe Lücke wieder gelassen, eine Ebene kleiner. Die Datei, die dem
Kunden am nächsten ist, war die einzige, die fehlte.

Aufgenommen als fünfter Bestand, ausdrücklich **flach**: nur die Dateien im
Wurzelverzeichnis, keine Unterordner. `node_modules` und `ausgabe` haben in
einem Bestand nichts zu suchen — beides wird jetzt von einer Probe
festgehalten.

### Zweitens: das Muster kannte die Schreibweise, nicht die Aussage

Nach der Aufnahme meldete der Prüfer **nichts**. Das Muster verlangte das Wort
„Frachtpauschale" in der Nähe von „auf jedem Beleg". Die Oberfläche sagt „auf
jedem unserer **Lieferantenbelege**".

> **Ein Muster, das eine Formulierung kennt, prüft die Formulierung und nicht
> die Aussage.**

Dieselbe Familie wie „eine Probe, die die Schreibweise prüft, prüft nicht das
Verhalten" — nur diesmal beim Prüfer selbst. Gesucht wird jetzt die
Behauptung: Fracht auf jedem oder allen Beleg(en), auf jeder Rechnung, mit
oder ohne Zusatzwort dazwischen. Ein Treffer bleibt ein **Verdacht** und
gehört angesehen; dafür ist das Werkzeug da.

Die Probe hält beide Richtungen fest: vier Formulierungen derselben Aussage
müssen gefunden werden, und zwei harmlose Sätze („Die Artikelnummer finden Sie
oben rechts", „Auf jeden Fall geliefert") dürfen nicht anschlagen. Ein Muster,
das alles findet, ist so nutzlos wie eines, das nichts findet.

## Was jetzt im Warenkorb steht

> „Die Fracht fällt je Lieferung an, ohne Frei-Haus-Schwelle. Der zugestellte
> Beleg über 1.934 € netto trägt dieselbe Pauschale wie der über 614 € — die
> Fracht hängt an der Fahrt, nicht am Warenwert. Deshalb weisen wir sie
> getrennt aus, statt sie in die Preise zu rechnen."

Dieselbe Begründung, dieselbe Länge, und sie stimmt.

## Der Bestand jetzt

```
348 Dateien, 63 Fundstellen, davon 63 mit Widerruf in Sichtweite
Bestände: Akte, Shoptexte, Werkzeuge, Rechenkern, Oberfläche
```

Zum Vergleich: Am 31. August früh waren es 219 Dateien und nur die Akte.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Oberfläche wieder aus dem Bestand | ja |
| Wurzelbestand tief statt flach lesen (`node_modules`) | ja |
| Muster zurück auf die eine Schreibweise | ja |

## Was ich daraus mitnehme

Zwei Ausweitungen in zwei Tagen, und beide waren unvollständig — die erste im
Umfang, die zweite in der Formulierung. Das ist kein Zufall: **Wer eine Wache
erweitert, prüft ihre neue Reichweite an dem Fall, den er gerade gefunden
hat** — und übersieht den nächsten, der einen Schritt danebenliegt.

Der Ausweg ist nicht mehr Sorgfalt, sondern die Frage: *Welche Datei sieht der
Kunde, die ich noch nie gelesen habe?* Heute war es die letzte.

## Stand

- 1.097 Tests, 0 rot; 11 Prüfer grün
- Browserproben: 11 Oberflächenszenarien, 50 Shopszenarien, 0 fehlgeschlagen
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
