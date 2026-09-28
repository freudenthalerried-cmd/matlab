# Zwei Arten ohne Blatt

**12. September 2026. Runde 54.**

## Der Fund

Seit dem 11. September hält `npm run pruefe-ablage` das Journal gegen die
Durchschriften — in beide Richtungen. Gemessen, nicht vermutet:

```
$ node -e "durchschriftenbefund({ eintraege: [{ lfd: 1, art: 'vermerk', … }], dateien: [] })"
{"regel":"durchschrift-fehlt",
 "text":"lfd. 1 (vermerk) steht im Journal, VM-2026-0140.txt fehlt
         — § 132 BAO verlangt den Beleg, nicht nur die Zeile darüber"}
```

Der Abgleich rechnete für **jeden** Journaleintrag einen Dateinamen aus. Zwei
der acht Arten in `ARTEN` haben aber keinen:

> **Ein Vermerk und eine UID-Abfrage haben keinen Beleg — sie *sind* die
> Aufzeichnung.** Wer für sie eine Durchschrift verlangt, verlangt eine
> Abschrift von etwas, das nie ein Blatt war.

`VM-2026-0140.txt` schreibt kein Werkzeug dieses Hauses. `--ablegen` legt
Angebot, Auftragsbestätigung, Absage, Lieferantenbestellung, Rechnung und
Gutschrift ab; für die beiden anderen gibt es keinen Aufruf, und es kann
keinen geben. Der erste abgelegte Vermerk hätte den Prüfer rot gemacht.

## Warum das schlimmer ist als eine fehlende Prüfung

Der Befund wäre nicht falsch berechnet, sondern **sinnlos**: Er sagt nichts
über den Bestand, und abstellen lässt er sich nicht, weil ihn nicht ein Fehler
auslöst, sondern eine ordnungsgemäße Zeile.

> **Ein Prüfer, der aus sich heraus rot wird, wird abgeschaltet** — und mit ihm
> die neun Regeln, die er sonst hält.

Dasselbe eine Stufe weiter in `npm run akte`: Dort stand für jeden Vermerk
`FEHLT`, also ein Mangel, wo keiner ist. Wer eine Akte liest, in der ein
Drittel der Zeilen grundlos `FEHLT` sagt, hört auf, sie zu lesen.

## Was jetzt gilt

`ARTEN` trägt ein drittes Feld, `beleg`, neben `nummernkreis` und `umsatz`:

| Art | Kürzel | Nummernkreis | Umsatz | Beleg |
| --- | --- | --- | --- | --- |
| `angebot` | AN | ja | nein | **ja** |
| `rechnung` | RE | ja | ja | **ja** |
| `gutschrift` | GS | ja | ja | **ja** |
| `lieferantenbestellung` | LB | nein | nein | **ja** |
| `auftragsbestaetigung` | AB | nein | nein | **ja** |
| `absage` | AS | nein | nein | **ja** |
| `uidabfrage` | UP | nein | nein | **nein** |
| `vermerk` | VM | nein | nein | **nein** |

Der Grund steht bei jeder der beiden Arten in der Datei: § 131 Abs 1 Z 5 BAO
verlangt zu jedem Geschäftsfall einen Beleg, und **wo keiner entsteht, tritt
der Vermerk an seine Stelle**. Die UID-Abfrage geschieht außerhalb — VIES
unter `ec.europa.eu` —, und aufzuzeichnen ist ihr Ergebnis; ein Blatt, von dem
eine Abschrift entstünde, gibt es nicht.

Die Akte sagt es jetzt so:

```
      1. 2026-09-12T09:00:00+02:00  vermerk                —                           —
         Kunde hat telefonisch verschoben
         Beleg: kein Blatt — vermerk ist selbst die Aufzeichnung
      2. 2026-09-12T09:05:00+02:00  rechnung               RE-2026-0001         911,06 €
         Rechnung an Muster GmbH
         Beleg: RE-2026-0001.txt FEHLT
```

## Die Gegenrichtung wird schärfer, nicht weicher

Eine Ausnahme, die nur wegsieht, ist keine. `BELEGMUSTER` führt weiter **alle**
Kürzel, auch `VM` und `UP` — eine Datei, die keine Regel erfasst, wäre der Fund
vom 11. September noch einmal. Liegt neben einem Eintrag ohne Blatt doch eine
Datei, gibt es dafür eine neue Regel:

> `durchschrift-ohne-blatt` — *„VM-2026-0140.txt liegt im Belegordner, vermerk
> hat aber kein Blatt — eine Abschrift von etwas, das nie eines war."*

Dazu eine Kreuzprobe zwischen zwei Feldern desselben Registers: **Jede Art mit
Nummernkreis muss ein Blatt haben.** Ein Papier, das eine fortlaufende Nummer
zieht, von dem aber keine Abschrift bleibt, wäre eine vergebene Nummer ohne
Beleg — für immer eine Lücke, die niemand erklären kann. § 11 Abs 1 Z 5 UStG
verlangt die Nummer, § 11 Abs 2 UStG die Durchschrift, und beide meinen
dasselbe Papier.

## Der zweite Fund, beim Aufschreiben des ersten

Der Satz über die UID-Abfrage ließ sich nicht wahrheitsgemäß schreiben.
`npm test` meldete `src/ablage.js:87` — eine Sperraussage über den Netzausgang
ohne gemessene Adresse. Die Messung lag vor: `uid-pruefung`, 10. September,
`ec.europa.eu` ohne Verbindung. Nur las `gemesseneAdressen` aus den Belegen
allein Adressen unter `at`, `com`, `org`, `io` und `net`.

> **Der Prüfer verlangte für jeden Satz über diese Sperre eine Adresse, die er
> selbst ausschloss.** Die einzige Adresse, um die es bei der UID-Abfrage geht,
> liegt unter `.eu`.

Ein Prüfer, der Unerfüllbares verlangt, wird nicht erfüllt, sondern umgangen:
Der Satz wird ungenau geschrieben, bis er durchkommt. Die Endung ist
aufgenommen; die Liste bleibt eng, damit nicht jedes Wort mit Punkt als Adresse
zählt — aufgenommen wird nur, worunter wirklich gemessen wurde.

## Ausgang

| | |
| --- | --- |
| `ARTEN` | drittes Feld `beleg`, 6 Arten mit Blatt, 2 ohne |
| Neue Regel | `durchschrift-ohne-blatt` |
| Kreuzprobe | Nummernkreis ⇒ Beleg |
| `gemesseneAdressen` | erkennt `.eu` — `ec.europa.eu` war gemessen und zählte nicht |
| Testfälle | 2.409 → **2.411** |
| Gegenproben | 220 → **222** |
| Nachgezogen | Anker von `journal-ohne-durchschriftabgleich` |

---

**Die Regel dieser Runde:** *Ein Prüfer, der aus sich heraus rot wird, hält
nicht mehr, sondern weniger — und ein Register braucht das Feld „hier gibt es
nichts zu prüfen" genauso wie die Prüfung selbst.*
