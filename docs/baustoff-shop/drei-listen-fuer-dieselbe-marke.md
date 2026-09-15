# Drei Listen für dieselbe Marke

**8. September 2026, abends.** Eine Stunde nach der vorigen Runde stellte sich
heraus, dass deren Befund falsch war — und der Grund dafür war ein größerer
Befund.

## Die Richtigstellung

Ich hatte geschrieben, die Systemzugehörigkeit der Kaminartikel sei „nicht
bestimmbar", weil die Marke in vier Schreibweisen an wechselnder Stelle steht.

`src/hersteller.js` löst genau das seit Langem:

- `HERSTELLER` kennt **SIKM, SIK, Schiedel, Absolut und SIH** — alle auf
  „Schiedel Österreich", mit Beleg für die Produktlinien (Konditionenblatt des
  Lagerhauses, Seite 18).
- `marke()` sucht **überall im Text**, aber nur als ganzes Wort und mit der
  längsten Marke zuerst. Sein Kopfkommentar nennt als Anlass **genau die drei
  Artikel**, über die ich gestolpert bin.

Gemessen: **acht von neun** Kaminartikeln lösen sich auf.

> **Ich habe aus der Unkenntnis meiner eigenen Liste einen Befund über den
> Bestand gemacht.**

Was bleibt, ist schärfer als das, was dastand: nicht ein unlesbares Gewerk,
sondern **eine einzige Lücke an der schlechtestmöglichen Stelle** —
`POS-18110 Mantelsteinkleber RMRTL Dünnbettmörtel`, das Teil, das die
Kaminseite als einzige Position mit dem Zusatz „des Systems" hervorhebt. Es
steht in `SYSTEM_UNBEKANNT`, mit Grund und mit dem Weg zur Auflösung.

---

## Der eigentliche Fund: drei Listen

| wo | Umfang | wofür |
|---|---|---|
| `src/hersteller.js` | 9, mit Merkblattadresse und Beleg | Herstellerverweis auf der Artikelseite |
| `bin/kampagne.mjs` | 11, ohne Adresse | Marken für die Anzeigen-Keywords |
| `src/systemtreue.js` | 2 | meine von vor einer Stunde |

Sie waren nicht deckungsgleich, und **beide** Richtungen hatten Folgen:

**Vier Artikel** trugen eine Marke für die Keywords und keinen Hersteller fürs
Merkblatt — Ökotherm, Ravenit, Prima, SunCore. Ihre Artikelseite sagte *„Für
diesen Artikel liegt uns kein Herstellermerkblatt vor"*, während die Kampagne
mit dem Markennamen wirbt. Darunter ist **Ökotherm**, der einzige
Mauerwerksartikel des Katalogs.

**Zwei Artikel** — die beiden „Absolut"-Kaminteile — hatten den Hersteller fürs
Merkblatt, und ihre Marke floss in kein Keyword.

> **Zwei Listen für dieselbe Sache sind eine Liste, die niemand pflegt** — und
> die dritte baut der, der die erste nicht kennt.

---

## Was jetzt dasteht

Eine Liste. `HERSTELLER` hat die vier Marken der Kampagne aufgenommen — mit
`url: null` und einem **Grund je Marke**, denn eine Merkblattadresse ist für
sie nicht belegt und eine geratene wäre eine erfundene Quelle. Die Kampagne
liest `Object.keys(HERSTELLER)`, `systemtreue.js` liest `marke()`.

Damit ändert sich für den Kunden nichts am Satz auf der Artikelseite — und drei
Stellen mussten mitgezogen werden, weil eine Marke jetzt bekannt sein kann,
**ohne** eine Adresse zu haben:

| Stelle | vorher | jetzt |
|---|---|---|
| Artikelseite | Marke erkannt → Verweis | Verweis nur mit Adresse |
| Gruppenseite | baute `href="null"` | nennt nur Hersteller mit Adresse |
| `merkblatt-ohne-weg` | verlangte einen Weg, den es nicht gibt | verlangt ihn nur, wo einer existiert |

Der Filter steht an **einer** Stelle — in `herstellerDerGruppe()`. Beim ersten
Anlauf hatte ich ihn an zweien, was in dieser Runde besonders schlecht gewesen
wäre.

### Und die Regel dagegen

`markenlistenbefund` meldet jede Datei außer `hersteller.js`, die **zwei oder
mehr** Markennamen als Zeichenkette führt. Eine einzelne ist ein Sonderfall
(`gebinde.js` kennt Capatect, weil ein Gebinde daran hängt); zwei nebeneinander
sind eine Liste.

---

## Zwei Fehler beim Bauen dieser Regel, beide sofort gefangen

**`entkleide()` entfernt keine Kommentare.** Der Name klang danach, und ich habe
ihn genommen, ohne ihn zu lesen — es nimmt Import- und Export-Syntax weg, für
das Browserbündel. Der erste Lauf meldete daraufhin zwei Dateien, die nur
*über* Marken schreiben.

> **Derselbe Fehler wie der, um den es in dieser Runde geht: eine Sache
> benutzen, ohne sie gelesen zu haben.** Diesmal innerhalb von zehn Minuten.

Es gibt jetzt `ohneKommentarzeilen()` — bewusst grob: Zeilen, die mit `//`,
`/*` oder `*` beginnen, fallen weg. Für die Frage, ob eine Datei eine **Liste**
führt, reicht das, denn eine Liste steht in eigenen Zeilen.

**Die Gegenprobe fing sich selbst.** Sie legt die zweite Liste absichtlich
wieder an — und ihr Ersatztext steht als Zeichenkette im
Gegenprobenregister. Der Prüfer meldete das Register, und die Probe fand einen
Prüfer vor, der schon rot war. Dasselbe Muster wie am 7. September bei
`pruefe-ungerufen`:

> **Wer über eine Liste schreibt, schreibt sie hin.**

Das Register steht deshalb mit Grund in `NICHT_DURCHSUCHT` — und auch diese
Ausnahme wird in beide Richtungen geprüft.

---

## Und ein vierter Fund am Rande

Die neue Regel meldete beim ersten Lauf auch `src/maschinenlesbar.js`. Das war
ein Fehlalarm des ungefilterten Kommentars — aber die Zeile, die ihn auslöste,
ist echt: Dort steht in einem Kommentar, dass „Ravenit", „Ökotherm" und
„SunCore" Marken sind, über die der Bestand nichts weiß. Seit heute weiß er
etwas über sie: dass ihre Merkblattadresse fehlt, und warum.
