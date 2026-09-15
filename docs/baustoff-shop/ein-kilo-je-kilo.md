# Ein Kilogramm je Kilogramm

**5. September 2026, nachmittags.** Der Sperrgutprüfer von gestern meldete:

```
Sperrguteinstufung: 46 Artikel, 7 mit belegtem Gewicht
  Widersprüche zum Gewicht  4, davon 4 mit Grund
```

Sieben belegte Gewichte gegen eine Handgrenze von 25 kg. Zwei davon sind

| SKU | Bezeichnung | Einheit | `gewichtKg` | Quelle |
|---|---|---|---|---|
| POS-19333 | Capatect PrimaPor K20 weiß **25 kg** SH-Reibputz | `KG` | **1** | rechnung |
| POS-13728 | Capatect Putzgrund weiß **25 kg** | `KG` | **1** | rechnung |

Ein Kilogramm je Kilogramm. Die Angabe ist wahr, sie stammt aus der Rechnung,
und sie kann gegen eine Grenze von 25 kg **nie** anschlagen. Beide Säcke wiegen
25 kg — und die Zahl steht in ihrem Namen.

> **Eine Zahl ohne ihre Einheit ist keine Angabe.** `gewichtKg` heißt bei
> Stückware „je Packung" und bei Kiloware „je Kilogramm". Dasselbe Feld, zwei
> Bedeutungen — und der Prüfer las nur eine.

---

## Die Zahl war nicht versteckt

Das Unangenehme daran: Der Name wird gelesen. `mengenschritt()` in
`src/gebinde.js` holt seit dem **29. August** genau diese 25 aus genau dieser
Zeichenkette, und jede Artikelseite druckt sie als „Abgabe ab 25 kg".

> **Zwei Leser derselben Zeile, und der eine kennt das Gebinde, während der
> andere ein Kilo wiegt.**

Dieselbe Familie wie der Frachtsatz heute früh und der Zahlwegname heute
mittag — nur diesmal nicht ein Feld mit zwei Lesern, sondern eine Zeile mit
zwei Lesern, von denen einer sie nicht öffnet.

Fünf weitere Artikel tragen ihr Gewicht ausschließlich im Namen und haben gar
kein `gewichtKg`: `Baumit KlebeSpachtel 25 kg`, `Ravenit Vergussmörtel 25 kg`,
zwei Klebe- und Spachtelmassen zu 25 kg und `Schiedel Fugenmasse FM 1,5 kg`.

**Neu: `packungsgewichtKg(artikel)`** — eine Stelle, die die eine Frage
beantwortet, die der Sperrgutprüfer stellt: *Was hebt der Fahrer an?*

| Einheit | Grundlage |
|---|---|
| `KG` | die Gebindegröße aus dem Namen — Kilogramm sind Kilogramm |
| Stückeinheit | `gewichtKg` aus der Rechnung, sonst die Gebindegröße aus dem Namen |
| `M2`, `LFM` | Mengenschritt × `gewichtKg`, wenn beide bekannt sind |

Sonst `null`. Eine Platte, die niemand gewogen hat, wiegt nicht null.

**Ergebnis: 12 belegte Gewichte statt 7.**

---

## Die Grenze, entschieden bevor feststand, wem sie nützt

Mit den richtigen Gewichten standen plötzlich **sechs Säcke zu genau 25 kg**
im Bestand, keiner davon als Sperrgut eingestuft. Die Regel lautete

```js
const schwer = !a.sperrgut && a.gewichtKg >= HANDGEWICHT_KG;
```

und hätte sechs Widersprüche gemeldet. Der Kommentar über `HANDGEWICHT_KG`
sagt aber, was die Zahl bedeutet:

> „25 kg ist die übliche Obergrenze für **das Heben durch eine Person** und
> zugleich **das gängige Sackgewicht** im Baustoffhandel."

Ein Sack, der genau so viel wiegt, wie ein Mensch trägt, ist der Regelfall des
Tragens — kein Widerspruch zur Einstufung „nicht palettiert". Das `>=` hat ihn
zu einem gemacht. Unsichtbar blieb das, weil **vor heute kein einziger Artikel
je 25 kg erreichte**: Die Kiloartikel trugen eine 1, die Sackartikel nichts.

Verglichen wird jetzt mit `>`.

> **Sechs Befunde sehen nach mehr Arbeit aus und wären sechs Fehlmeldungen
> gewesen.** Die Grenze gehört entschieden, bevor feststeht, wem sie nützt.

Der Testfall darüber hieß „zwischen den Grenzen wird nicht geurteilt" und
schrieb im Kommentar ausdrücklich fest: „Genau auf der Grenze gilt sie als
schwer." Auch er stand im Widerspruch zu der Konstanten, die er prüfte.

---

## Der fünfte Widerspruch

Übrig bleibt einer, und er ist echt: **`POS-16070 Schiedel Fugenmasse FM
1,5 kg`**, Einheit `EIM`, eingestuft als Sperrgut — weil sie in der Warengruppe
**Kamin** steht, und die Kamingruppe ist die mit den Mantelsteinen. Anderthalb
Kilogramm Fugenmasse mit dem Kran zu entladen ist so wenig plausibel wie der
Kanalbogen von 285 Gramm.

Umgestuft wird aus demselben Grund wie gestern nicht: Ob der Lieferant einen
Hub verrechnet, sagt der Lieferant. Der Eimer kommt vermutlich mit den
Mantelsteinen auf derselben Palette — was die Einstufung eher stützt als
widerlegt, aber eben eine Vermutung ist. Aufgelöst wird auch dieser Fall mit
der Palettenfrage.

**Und der gemeinsame Grund war nicht mehr gemeinsam.** Das Werkzeug druckt die
Fälle einzeln und den Grund einmal darunter — richtig, solange alle denselben
haben. Mit dem Eimer stünden vier Kanalpositionen als Begründung für einen
Kamineimer da. Gedruckt wird jetzt, wer den gemeinsamen Grund trägt, und wer
einen eigenen hat.

---

## Zwei kleinere Funde daneben

**Die Zahl, die nie widersprechen konnte.** Das Werkzeug schrieb

```js
console.log(`  Widersprüche zum Gewicht  ${b.widersprueche}, davon ${HINGENOMMEN.length} mit Grund`);
```

— die **Länge des Verzeichnisses** als Ergebnis der Prüfung. Bei einem
ungedeckten Widerspruch hätte dort dieselbe Zahl gestanden. `einstufungsbefund`
gibt jetzt `gedeckt` zurück, gemessen.

**Die Einheitenliste von gestern.** `STUECKEINHEITEN` in `gebinde.js` führte
`PAK`, `KAR` und `ROL` — drei Kürzel, die im Katalog nicht vorkommen — und
kannte `KRT` (3 Artikel), `DOS` (2) und `RLL` (1) nicht, die vorkommen. Eine
plausible Erfindung, keine Ablesung.

Folgenlos war das bisher, weil `preisJeKilo` **beides** braucht, die Einheit und
ein Kilogramm im Namen, und keiner der sechs Artikel eines trägt. Der Fehler war
blind, nicht harmlos: Der erste Karton, dessen Name ein Gewicht nennt, hätte
seinen Kilopreis still verloren.

Dreißig Zeilen unter dieser Liste steht seit dem 30. August die Lehre aus genau
diesem Fehler, gezogen an `GEBINDELESER`:

> „Wer eine Einheit ergänzt, ergänzt sie **jetzt hier**, und beide Seiten
> wissen davon."

> **Eine Lehre, die neben der Stelle gezogen wird, an der sie noch einmal
> gebraucht wird.**

`einheitenbefund` hält die Liste seither gegen den Katalog, in beide
Richtungen: eine Einheit, die keiner führt, prüft nichts; eine, die keine der
beiden Listen kennt, fällt still aus jeder Umrechnung. Gemeldet in
`npm run pruefe-gebinde`.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — zwei bestehende sehen mehr |
| Neue Gates | keine |
| Gegenproben | **60 für 35 Prüfer** (vorher 59) |
| Belegte Gewichte | **12 von 46** (vorher 7) |
| Widersprüche | **5**, alle mit Grund (vorher 4) |

## Was offen bleibt

- **Belegt ist weiter keine einzige der 46 Einstufungen.** Das entscheidet die
  Palettenfrage an den Lieferanten, nicht dieses Werkzeug.
- **34 Artikel haben weiterhin kein Packungsgewicht.** Für sie sagt weder das
  Feld noch der Name etwas; die Verpackungseinheit steht in der Artikelliste des
  Lieferanten, die ohnehin angefragt wird.
