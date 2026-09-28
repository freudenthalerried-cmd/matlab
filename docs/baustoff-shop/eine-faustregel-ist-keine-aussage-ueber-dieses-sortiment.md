# Eine Faustregel der Branche ist keine Aussage über dieses Sortiment

**9. September 2026.** Nach den Gruppenseiten die **Wissensseiten** — vierzehn
Inhaltsseiten, von Hand geschrieben, die erklären sollen, was ein Handwerker
vor der Bestellung wissen muss.

`xps-oder-eps.md` gab einen Bestellhinweis:

> „Die Paketgröße hängt an der Stärke — dünne Platten kommen in mehr
> Quadratmetern je Paket als dicke."

Gegen `mengenschritt` gehalten — die Funktion, mit der die Kasse auf volle
Pakete aufrechnet:

| Reihe | Stärken | Schritt |
|---|---|---|
| Fassaden-EPS | 2, 3, 5 cm | **0,5 m²** |
| XPS | 30, 50, 80, 100 mm | **0,75 m²** |

**Beide Hälften des Satzes sind falsch.** Die Paketgröße hängt an der *Reihe*,
nicht an der Stärke — 0,5 m² bei 2 cm wie bei 5 cm. Und die dünnste Platte hat
das **kleinere** Paket, nicht das größere.

> **Eine Faustregel aus der Branche ist keine Aussage über dieses Sortiment.**

Der Satz stimmt vermutlich für den Baustoffhandel im Allgemeinen. Er steht auf
der Seite, die ein Kunde beim Plattenvergleich liest, und dort gilt der eigene
Katalog.

---

## Zweiter Befund: eine Gruppe, die man angeblich nicht einzeln kaufen kann

`wdvs-systemaufbau.md`, nach der Aufzählung des Zubehörs, das am häufigsten
fehlt:

> „Deshalb liefern wir diese Gruppe als Paket und nicht als Einzelartikel."

Die WDVS-Gruppenseite trägt **elf Artikelkarten mit elf Knöpfen „In den
Warenkorb".** Jede Position ist einzeln bestellbar.

Gemeint war die **Systemliste** — die Zusammenstellung, die jede Schicht samt
Zubehör in einem Zug in den Warenkorb legt. Genau das steht jetzt da, mit dem
Zusatz, der vorher fehlte: *Einzeln bestellbar bleibt trotzdem jede Position —
die Liste nimmt niemandem die Entscheidung ab, sie nimmt ihm das Vergessen ab.*

---

## Die Regel, die die Zahlen hält

`paketgroessenbefund`: Jede Quadratmeterzahl, die eine Inhaltsseite „je Paket"
nennt, muss ein tatsächlicher Mengenschritt im Katalog sein.

**Ob ein Satz daneben eine falsche Regel behauptet, kann sie nicht sehen** —
sie hält die Zahlen, und die Zahlen tragen den Satz. Mehr zu versprechen wäre
eine Behauptung mit Ziffern.

**Wo sie hängt, war eine Entscheidung.** `pruefe-gebinde` wäre der nähere Ort
gewesen — er weigert sich aber seit dem 8. September, weil
`preise/poschacher-positionen.csv` fehlt.

> **Eine Regel in einem Prüfer, der sich weigert, ist eine Regel, die nie
> läuft.**

Sie hängt deshalb an `pruefe-zahlen`, wo die Zahlen der Inhaltsseiten ohnehin
gegen ihre Fundstellen gehalten werden.

---

## Und dort hat das bestehende Register sofort zurückgefragt

Kaum standen die zwei Zahlen auf der Seite, meldete `pruefe-zahlen`:

```
✗ „0,5 m²" steht auf der Seite und in keiner belegten Aussage
✗ „0,75 m²" steht auf der Seite und in keiner belegten Aussage
```

Richtig so. Nur: Welche Quelle belegt sie? `pruefe-quellen` kannte acht Arten —
Norm, Merkblatt, Behörde, Fachbuch, eigene Berufserfahrung, Video, Forum,
Händler — und wies meinen Eintrag ab: *unbekannte Quellenart: bestand.*

**Das ist keine Formalie, sondern die richtige Frage.** Alle acht Arten belegen
Aussagen über die **Welt**. „Fassaden-EPS kommt in 0,5 m² je Paket" ist keine
Behauptung über die Branche, sondern über **diesen Katalog** — und dafür ist
der Katalog die maßgebliche Stelle.

Neue Art `bestand`, tragend, mit einer engen Begründung:

> **Tragend ist sie nicht, weil wir es sagen, sondern weil ein Prüfer sie bei
> jedem Lauf gegen die Daten hält.** Ohne diese Prüfung wäre sie die
> schwächste Quelle von allen, nicht die stärkste.

Die Grenze des Registers bleibt: **Preise und Einkaufskonditionen gehören
nicht hierher**, und für sie gilt die neue Art ausdrücklich nicht.

---

## Was mich dabei aufgehalten hat

Ich habe `quellen.json` neu geschrieben, statt sie zu ergänzen — mit
`json.dumps`, was jede kompakte Zeile `"quellen": ["etag-004", …]` auf drei
Zeilen auseinanderzog. Inhaltlich identisch. Der Registertest der Gegenproben
meldete trotzdem:

```
✗ quellen-aussage-ohne-beleg: der Suchtext kommt in
  shop/inhalte/quellen.json nicht vor — die Mutation käme nie an
```

> **Wer eine handgesetzte Datei neu serialisiert, ändert jede Zeile darin —
> auch die, an denen etwas hängt.**

Fünftes Mal an einem Tag, dass ein Anker ins Leere lief, und das erste Mal
ohne jede inhaltliche Änderung. Die Datei ist im alten Format wiederhergestellt
und die zwei Einträge sind als Text angehängt.

### Und ein drittes Mal wurde nachgefragt

`pruefe-inhalte` liest die Absätze selbst und verlangt, dass **im Text** steht,
woher eine Zahl kommt:

```
✗ Zahl ohne Quelle: 0,5 m², 2 cm, 5 cm — jede Zahl braucht Herkunft und Stand
```

Das Register in `quellen.json` genügt ihm nicht, und zu Recht: Es steht im
Verzeichnis, nicht auf der Seite. Der Kunde liest den Absatz.

> **Drei Prüfer, drei verschiedene Fragen an dieselben zwei Zahlen:** Gibt es
> den Wert im Katalog? Ist die Aussage belegt? Steht die Herkunft dort, wo sie
> gelesen wird? Keiner von ihnen ersetzt die anderen beiden.

Der Absatz nennt die Herkunft jetzt selbst — Katalog, Stand, und wie die Zahl
zustande kommt.

**Gezeigt, dass die neue Regel anschlägt:** 0,5 auf 0,6 verschoben →
`paketgroesse-ohne-artikel`. 4 neue Testfälle am Mengenschritt, 2 an der
Quellenart, Gegenprobe `die-paketgroesse-die-es-nicht-gibt`: *meldete rot an
der erwarteten Stelle.*
