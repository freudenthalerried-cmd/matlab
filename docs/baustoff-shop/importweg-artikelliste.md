# Der Weg vom Webshop in den Katalog steht

**28. August 2026.** Der Auftraggeber hat ein Konto im Webshop seines
Lieferanten (`shop.poschacher-baustoffe.at`). Aus dieser Umgebung ist die
Seite nicht erreichbar — 403 am Ausgangsproxy, auf beiden Wegen geprüft, und
die Anweisung der Umgebung lautet, das zu melden statt zu umgehen. Die
Ausleitung muss also von ihm kommen.

Damit sie am Tag ihres Eintreffens wirkt, ist der Weg jetzt gebaut:

```
Artikelliste (CSV) → npm run preisliste <datei> [--schreiben]
                   → data/katalog-baustoff.json  (öffentlich, ohne Preise)
                   → preise/baustoff-preise.json (vertraulich, gitignoriert)
                   → npm run website
```

## Was die Datei enthalten muss

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `sku` | ja | Artikelnummer des Lieferanten |
| `bezeichnung` | ja | Artikelbezeichnung |
| `einheit` | ja | STK, M2, SCK, KG, DOS … |
| `ek_netto` | ja | **sein** Einkaufspreis, netto |
| `uvp_netto` | nein | Listenpreis — daraus entsteht „x % unter Listenpreis" |
| `gruppe` | nein | Warengruppe |
| `gewicht_kg` | nein | Gewicht je Einheit |
| `sperrgut` | nein | ja/nein — palettiert, mit Kranentladung |

Trenner `;`, `,` oder Tabulator; Muster in `beispiel/artikelliste-muster.csv`.
Zahlen dürfen deutsch oder englisch geschrieben sein — **„1.234,56" und
„1234.56" werden gleich gelesen, „1.234" bleibt tausendzweihundertvierunddreißig.**
Wer einen Tausenderpunkt als Komma liest, verkauft eine Palette zum Preis
eines Sacks.

## Was das Werkzeug verweigert

**Gate 24 sitzt an der Eingangstür.** Eine Zeile ohne brauchbaren
Einkaufspreis — leer, „auf Anfrage", null, unlesbar — wird nicht übernommen
und **namentlich gemeldet**. Ebenso eine Zeile, deren Listenpreis unter dem
Einkaufspreis liegt: Das ist ein Datenfehler, kein Schnäppchen.

**Der Bestand gewinnt bei allem, was er besser weiß.** Ein Gewicht aus einer
Rechnung mit bestandener Summenprobe bleibt stehen, auch wenn die Liste ein
anderes nennt; ein Preis aus einem Beleg bleibt stehen, weil er eine bezahlte
Tatsache ist und ein Listenpreis eine Zusage. Der Import **ergänzt**, er
überschreibt nicht.

> Das ist dieselbe Lehre wie vom Katalogerzeuger, der heute früh die sieben
> belegten Gewichte gelöscht hat: **Ein Werkzeug, das eine Datei schreibt,
> muss wissen, was andere hineingeschrieben haben.**

Dazu die bekannten Riegel: kein Schreiben ohne `--schreiben`, kein Schreiben,
bei dem ein Artikel des Bestands verschwände, und kein Import aus einer als
Muster gekennzeichneten Datei.

## Der Probelauf

Mit einer erfundenen Liste aus sechs Zeilen gegen den echten Katalog:

```
Gelesen:      4 Artikel mit Preis
Abgelehnt:    2
Neu:          3
Ergänzt:      1
Katalog danach: 49 Artikel (vorher 46)

Nicht übernommen — und warum:
  1× kein brauchbarer Einkaufspreis (…)
      POS-90004  Sonderposten ohne Preis
  1× Listenpreis 5 liegt unter dem Einkaufspreis 10
```

Danach gerechnet: Die drei neuen Artikel tragen Verkaufspreise, einer davon
55,00 € netto bei 75,00 € Liste — **die Kalkulation greift auf importierte
Artikel genauso wie auf die aus den Rechnungen.**

## Geprüft

16 neue Proben, darunter das Werkzeug selbst — nach der Lehre von heute früh:
*Ein Erzeuger, den keine Probe ausführt, wird nicht geprüft.* Zwei
Mutationen: Lässt man die Liste den Bestand überschreiben, fällt das
Rechnungsgewicht um; schaltet man Gate 24 ab, fallen drei Proben.

760 Tests grün, `pruefe-tests` 759 / 0 Verdacht.

## Was jetzt fehlt

Nur noch die Datei. Sobald sie da ist:

1. `npm run preisliste <datei>` — Probelauf, zeigt was hineinkäme
2. `npm run preisliste <datei> --schreiben`
3. `npm run website`

Die 127 Lagerhaus-Artikel aus dem Lauf davor warten auf dasselbe: einen
Preis. Der Unterschied ist, dass sie ihn von fünf Herstellern brauchen und
die Poschacher-Liste ihn in einer Datei mitbringt.
