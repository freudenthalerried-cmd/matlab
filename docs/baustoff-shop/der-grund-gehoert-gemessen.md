# Der Grund gehört gemessen

**5. September 2026, abends.** Neun Runden an diesem Tag, und acht davon
trugen denselben Befund in verschiedenen Kleidern:

| Runde | Der Prüfer las… | und nicht… |
|---|---|---|
| Einheitenkürzel | eine Fassung mit Vorgabewert | die, die der Kunde bekommt |
| Flächenregister | zwei eingetragene Dateien | die 31 gemessenen |
| JSON-LD | die sichtbaren Seiten | die strukturierte Auskunft |
| Ausschlussliste | fünf Bezirksnamen | den Ort des Betriebs |
| Mindestbestellwert | jede Artikelseite | jede Sammelseite |
| Preisaussage | drei Anzeigen | 81 Seiten |

> **Nicht ein fehlender Prüfer, sondern ein Prüfer, dessen Reichweite kleiner
> ist als die Reichweite der Regel, die er prüft.**

Diese Runde stellt die Frage einmal von vorn: **Welche Prüfer enden an der
Ausgabe — und wissen sie es?**

---

## Zwei Kandidaten, gemessen statt vermutet

Bevor irgendetwas geändert wurde, habe ich beide über die gebauten Seiten
laufen lassen:

```
Widerrufsfunde in der Ausgabe:      0 über 84 Dateien
Leitzahlmeldungen in der Ausgabe:   0 über 83 Dateien
```

**Beide Lücken sind heute leer.** Das ist ein Ergebnis und kein Nichts — es
heißt, dass hier nichts zu reparieren war und dass die Runde nicht von einem
Fund lebt, sondern von einer Frage.

---

## Der eine hatte einen Grund, der andere keinen

**`pruefe-widerrufe`** schließt `ausgabe/` ausdrücklich aus, und der Grund
steht im Register: Was ausgeliefert wird, entsteht aus `inhalte/` und
`bin/website.mjs` — beide im Bestand. Der Schluss ist richtig.

**Er war nur nie geprüft.** Eine Begründung der Form *„das kann nicht
vorkommen"* ist eine Behauptung über einen Erzeugungsweg, und Erzeugungswege
ändern sich: Seit dem 4. September trägt jede Seite Text, den kein
`inhalte/`-Dokument kennt — der Bestellhinweis, die Frachterklärung —, und
seit heute Nachmittag wird ein ganzer Absatz beim Zusammenbau angehängt.

> **Ein Ausschluss mit gutem Grund ist trotzdem ein Ausschluss — und der Grund
> gehört gemessen, nicht geglaubt.**

Der Durchgang kostet 84 Dateien und einen Durchlauf. Er sagt beim nächsten Mal,
ob der Schluss noch trägt.

**`pruefe-leitzahlen`** hatte für den Ausschluss der Ausgabe **keinen Grund**.
Sein Kommentar zählt fünf Bestände auf und erwähnt sie nicht — und hier ist der
Ausschluss sachlich falsch:

> Die fünf Bestände decken alles ab, was **geschrieben** ist. Sie decken nicht,
> was beim Bauen **entsteht**.

Die Startseite zeigt „39 von 46" und „26,7 % im Median", die Lieferseite
„75,50 €", die Kennzahlenseite ihre Schwellen. **Keine dieser Zahlen steht als
Zahl in einer Quelldatei.** Sie werden gerechnet, und eine gerechnete Zahl kann
von einer Leitzahl abweichen, ohne dass irgendwo ein Literal danebensteht.

> **Der Bestand, der nur die Quellen liest, findet jede abgeschriebene Zahl und
> keine gerechnete.**

Genau eine solche abgeschriebene Zahl war der Fund vom Vormittag („33 von 33").
Die andere Hälfte war bis heute außer Reichweite.

Beide Prüfer lesen jetzt auch die gebaute Seite — im **Text**, nicht im
Markup: In `26,7&nbsp;%` steht die Zahl nicht neben ihrem Zeichen.

---

## Das Register hat sich selbst gemeldet

In der Minute, in der der Durchgang eingebaut war, wurde `pruefe-erzeugnis`
rot:

```
✗ bin/widerrufpruefung.mjs fasst ausgabe/ an und steht in keinem Eintrag
  [leser-ohne-eintrag]
```

Genau dafür gibt es das Leserregister, und es hat ohne Zutun funktioniert. Der
Eintrag steht jetzt da, mit der Entscheidung: **nicht abbrechen, aber sagen.**
Ein Durchgang über ein veraltetes Erzeugnis, der „0 Fundstellen" meldet, ist
die Sorte Grün, gegen die dieser Bestand seit dem 30. August anschreibt — aber
die 514 Verzeichnisdateien ihretwegen nicht zu prüfen wäre unverhältnismäßig.

`bin/leitzahlpruefung.mjs` stand schon im Register, und sein Grund lautete:

> „Die gebauten Seiten kommen **nur als Fundort** vor, und eine abgelöste Zahl
> darin ist ein Befund, kein Abbruchgrund."

Der Satz beschrieb einen Zustand, den es nicht gab — die gebauten Seiten kamen
gar nicht vor. Seit heute stimmt er.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — zwei bestehende reichen weiter |
| Neue Gates | keine |
| Gegenproben | **69 für 35 Prüfer** (vorher 68) |
| Durchsuchte Dateien | Leitzahlen **708** (vorher 625), Widerrufe **514 + 84** |
| Gefundene Fehler | **null** — und das ist das Ergebnis |
| Testfälle | 1642 |

## Was offen bleibt

- **`suche.html`** ist weiterhin die letzte ungelesene Kundenfläche.
- **Der Vorbehalt zum Liefergebiet** steht in `areaServed` nicht dabei.
- **Die übrigen Reichweiten sind nicht ausgeschrieben.** Für jeden der 35
  Prüfer zu führen, über welche Flächen er läuft, wäre ein Register von Hand —
  und Runde 133 hat an diesem Tag gezeigt, was von handgeführten
  Flächenlisten zu halten ist. Der bessere Weg wäre, die Reichweite zu
  **messen** statt zu registrieren; wie, weiß ich noch nicht.
