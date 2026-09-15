# Vier laufende Meter Leiste — eine Menge, die es nicht gibt

**30. August 2026.** Der vorige Durchgang endete mit einem Befund über die
Proben selbst: Sie rechnen auf `data/artikel.json`, dem Katalog des
abgelösten Modells, während der Shop auf `data/katalog-baustoff.json` läuft.
Dieser Durchgang ist der Nachgang dazu — was steht auf der einen Seite, das
die andere nie zu sehen bekommt?

## Die beiden Kataloge sind nicht dieselbe Sorte Daten

| | Altkatalog | echter Katalog |
|---|---|---|
| Artikel | 9 | 46 |
| Lieferanten | 3 (alle mit Lieferzeit) | 1 (ohne Lieferzeit) |
| fehlende Angaben | **keine** | 39 Gewichte, 46 GTIN |
| Einheiten | `Stück`, `Rolle`, `Set`, `Gebinde`, `Ringbund` | `STK`, `M2`, `KG`, `SCK`, `KRT`, `LFM`, `RLL`, `DOS`, `EIM` |
| `uvpNetto` | am Artikel | in der Preisdatei |

Dreizehn Testdateien rechnen auf der linken Spalte. Sie sind nicht falsch —
sie sind woanders. Der Altkatalog hat **keine einzige Lücke** und ein
gänzlich anderes Einheitenvokabular; wer auf ihm prüft, prüft eine Welt ohne
Lücken und mit deutschen Wörtern statt Lieferantenkürzeln.

## Der Fund

Zwei Artikel im Bestand tragen die Einheit `LFM`:

```
POS-52124  Capatect Gewebeanschlussleiste 3D Universal Plus 2,55 m   4,91 € je lfm
POS-53402  Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,5 m  0,95 € je lfm
```

Sie werden je laufendem Meter fakturiert und kommen in fester Stangenlänge.
Das Mengenfeld bot beliebige Meter an — `min="1"`, `step="1"`. **Vier
laufende Meter Anschlussleiste gibt es nicht**; es gibt zwei Stangen zu
2,55 m, also 5,10 m. Eine Bestellung über vier Meter kann niemand
kommissionieren.

Das ist derselbe Fehler, den `mengenschritt` am 28. August für Kilogramm und
am 29. für Quadratmeter behoben hat — nur eine Einheit weiter. Er ist stehen
geblieben, weil der Altkatalog kein `LFM` kennt.

> **Eine Probe, die auf dem Altbestand rechnet, kann eine Einheit nicht
> vermissen, die es dort nicht gibt.**

## Was geändert wurde

`gebindeLfm()` liest die Stangenlänge aus der Bezeichnung, mit derselben
Vorsicht wie `gebindeM2()`:

- Gesucht wird ein **blankes** `m` — nicht `m2`, `m²`, `mm` oder `cm`. Der
  Kantenschutz trägt „11,5 13,5 **cm** 2,5 **m**"; fiele diese Abgrenzung,
  wäre der Schritt 13,5 statt 2,5 und die Artikelkarte nennte den fünffachen
  Preis.
- **Mehr als ein Treffer heißt nichts.** „Gitter 1,1 m × 50 m" nennt ein Maß,
  keine Stangenlänge; welche Kante die Länge ist, wäre geraten.
- Grenzen wie bei Fläche und Gewicht: unter 0,1 m und über 100 m wird
  verworfen.

Die Artikelseiten zeigen jetzt:

```
<input id="menge-POS-52124" min="2.55" value="2.55" step="2.55" …>
<input id="menge-POS-53402" min="2.5"  value="2.5"  step="2.5"  …>
```

Und weil `mengenschritt` an einer Stelle liegt, wirkt das zugleich auf
Artikelkarte, Warenkorb, Feed und Preisabgleich — nicht an vier Stellen
einzeln.

## Die Probe, die dabei umfiel — und warum das richtig war

`test/gebinde.test.js` hielt fest:

```js
assert.deepEqual([...einheiten].sort(), ['KG', 'M2'], 'beide Fälle müssen im Bestand vorkommen');
```

Sie wurde rot, obwohl nichts kaputtging. Der Grund ist der bekannte: **Die
Probe maß den Bestand von gestern, nicht die Regel.** Es ist der vierte Fund
dieser Sorte in diesem Projekt.

Geprüft gehört stattdessen die Zusicherung, und die hat jetzt einen Ort:

```js
export const GEBINDELESER = Object.freeze({ KG: gebindeKg, M2: gebindeM2, LFM: gebindeLfm });
```

Die Probe verlangt seitdem zweierlei — jede Einheit mit Schritt hat einen
Leser, und **jeder Leser findet im Bestand seinen Fall**, sonst läuft er nie.
Die Ausführung in `mengenschritt` bleibt bewusst eine `if`-Kette und wird
*nicht* über die Tabelle aufgelöst: Liefe beides über dieselbe Zeile, prüfte
die Probe nur noch, dass eine Tabelle sich selbst gleicht.

## Gegenproben

Fünf Mutationen, jede gesichert und zurückgesetzt:

| Mutation | erkannt |
|---|---|
| `LFM` aus `mengenschritt` entfernt | ja — 3 rot |
| Abgrenzung gegen `mm`/`cm`/`m²` aufgeweicht | ja |
| mehrere Treffer erlaubt statt genau einer | ja |
| Grenzen 0,1 m / 100 m entfernt | ja |
| Einheit in die Tabelle, aber nicht in die Kette | ja — 2 rot |

Die letzte ist die Absicherung des Modulschnitts: Wer `GEBINDELESER`
erweitert und `mengenschritt` vergisst, erfährt es hier — und nicht, wenn ein
Kunde eine unlieferbare Menge bestellt.

`pruefe-tests` meldete danach einen eigenen Verdacht auf die umgeschriebene
Probe: zwei Schleifen ohne vorherige Längenzusicherung. Zutreffend — eine
geleerte Zuordnung wäre sonst der grünste Zustand dieser Probe gewesen. Beide
Zusicherungen ergänzt.

## Was offen bleibt

Zwei Vokabellisten sind noch uneinheitlich, ohne heute Schaden zu stiften:
`EINHEITEN` in `artikelliste.js` erlaubt `KRT` **und** `KAR`, `RLL` **und**
`ROL` — zwei Schreibweisen für dieselbe Sache. `STUECKEINHEITEN` in
`gebinde.js` kennt nur `KAR` und `ROL`, der Bestand führt `KRT` und `RLL`.
Nachgerechnet: Von den sieben Artikeln mit erkennbarem Gebindegewicht
verliert heute **keiner** seinen Kilopreis. Der Fehler ist terminiert, nicht
latent — er tritt ein, sobald die Poschacher-Liste einen Karton- oder
Rollenartikel mit Kilogramm im Namen bringt. Vermerkt für den Tag, an dem die
Liste kommt; heute ohne Änderung, weil eine Vereinheitlichung ohne die echte
Liste rät, welche Schreibweise der Lieferant verwendet.

## Stand

951 Testfälle grün (vorher 944), `pruefe-tests` 949/0, `pruefe-preise` 46/0,
elf Prüfer mit `--mit-browser` ohne Beanstandung, `pruefe-stand` 198/198.
