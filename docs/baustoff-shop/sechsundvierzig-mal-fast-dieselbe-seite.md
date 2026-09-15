# Sechsundvierzig mal fast dieselbe Seite

**3. September 2026, nachts.** Dieser Shop soll über Suche und maschinelle
Auskunft gefunden werden. Darauf ruht die ganze Kanalrechnung: 45 Tage
Klickversuch, das gesamte Werbebudget, die Entscheidung über das Vorhaben.

Gebaut sind dafür 46 Artikelseiten. **Ob sie voneinander unterscheidbar sind,
hat nie jemand gemessen.**

Der erste Lauf, über die ganzen Seiten:

| | |
|---|---|
| ähnlichste Paare | **0,99** — vier davon |
| Median über alle 1.035 Paare | 0,55 |
| Wörter, die auf **jeder** der 46 Seiten stehen | 167 von 345 (**48 %**) |

Zwei Seiten mit 0,99 unterschieden sich in einem Namen und vier Zahlen:

```
- Capatect Klebe- und Spachtelmasse 186 M 25 kg     0,56 €   25 % unter Liste
+ Capatect Klebe- und Spachtelmasse 190 FEIN 25 kg  0,60 €   27 % unter Liste
```

> **Für eine Suchmaschine sind das keine zwei Antworten, sondern eine Antwort
> mit einem Tippfehler.**

## Der erste Befund lag auf der Seite selbst

Beim Nachsehen fiel auf, warum die Ähnlichkeit so hoch war — und es lag nicht
am eigenen Text. Jede Artikelseite trug **zwei** Querverweisblöcke:

- „Wird damit zusammen verbaut" — acht Artikel aus derselben Systemliste
- „Weitere Artikel aus WDVS" — die ersten acht der Gruppe

Auf einer WDVS-Seite waren das **sieben von acht denselben**: derselbe Artikel,
derselbe Preis, dieselbe Karte, zweimal auf einer Seite unter zwei
Überschriften.

> **Zwei Überschriften über derselben Liste sind keine zwei Auskünfte.** Der
> Leser sucht beim zweiten Block, was daran anders ist, und findet nichts.

Der zweite Block überspringt jetzt, was der erste schon gezeigt hat. Bleibt
nichts übrig, fällt er weg.

## Gemessen wird der eigene Teil, nicht die ganze Seite

Ein Shop verlinkt quer, und das ist richtig: Wer die Klebemasse ansieht,
braucht das Gewebe daneben. Diese Blöcke stehen deshalb seit heute in
`<section class="querverweise">` und fallen aus der Messung.

> **Eine Messung, die den Querverweisblock mitzählt, misst die Navigation und
> nennt es Inhalt.**

Die Marke ist eine Klasse und keine Überschrift: Eine Messung, die an einer
Überschrift hängt, misst beim nächsten Umformulieren etwas anderes.

Am eigenen Teil gemessen sieht es so aus:

```
Dublettenprüfung: 46 Artikelseiten, 1035 Paare

  Ähnlichste zwei      0.96  (POS-12467 / POS-12472)
  Median über alle     0.68
  Auf jeder Seite      137 von 219 Wörtern (62 %)
```

Jede Artikelseite trägt rund 219 Wörter, und 137 davon stehen wortgleich auf
allen 46.

## Der Versuch, es zu verbessern, hat es verschlechtert

Zwischen den beiden Messungen steht eine Ergänzung, die aus einem ganz anderen
Grund richtig war: **Gate 25 auf den Artikel gerechnet.** Die Grenze von 250 €
netto stand auf der Lieferseite, in `llms.txt` und in der Kasse — nicht auf der
Artikelseite, wo sich entscheidet, ob jemand überhaupt in den Warenkorb legt.
Und „250 € netto" ist auf einer Seite mit einem Kilopreis keine Auskunft:

> **Angenommen wird eine Anfrage ab 450 kg**, wenn dieser Artikel allein
> bestellt wird — 18 Gebinde zu 25 kg.

Diese Zahl ist für jeden Artikel eine andere und beantwortet eine echte Frage.
Und trotzdem ist der gemeinsame Anteil dadurch von 57 % auf 62 % **gestiegen**:
Der Satz ist vier Zahlen lang und dreißig Wörter breit, und die dreißig Wörter
stehen jetzt auf allen 46 Seiten.

> **Jeder Satz, der auf allen Seiten gleich lautet, verschlechtert das
> Verhältnis — auch ein richtiger.** Der Artikelseite fehlt nicht Text, ihr
> fehlt eigener Text.

Der Satz bleibt. Die Kennzahl ist eine Diagnose und kein Ziel; wer sie zum Ziel
macht, löscht als Erstes die nützlichen Sätze, weil sie die längsten sind.

## Was die Zahl ist und was nicht

Sie ist **kein Google-Wert**. Wie eine Suchmaschine Dubletten behandelt, steht
in keiner öffentlichen Formel, und niemand hier hat Zugriff darauf. Gemessen
wird die Wortmengenähnlichkeit (Jaccard, `|A ∩ B| / |A ∪ B|`) — grob, aber
nachrechenbar. Sie trägt zwei Aussagen und keine dritte:

1. **Zwei Seiten sind praktisch dieselbe.** Ab 0,98 unterscheiden sie sich in
   einer Handvoll Zeichen. Das ist ein Befund, kein Geschmack — und die Grenze,
   an der `npm run pruefe-dubletten` rot wird.
2. **Wie viel jede Seite mit allen anderen teilt.** Steigt der Anteil, wird die
   Seite austauschbarer, unabhängig davon, wie ein Anbieter das bewertet.

Die Gegenprobe nimmt der Messung die Marke weg, an der sie die Navigation
abschneidet: Dann misst sie die ganze Seite, findet Paare bei **0,994** und
wird rot. Sie zeigt damit beides — dass der Prüfer anschlägt, und dass der
gemessene Zustand vor der Marke wirklich so war.

*(Zweiter Anlauf: Die erste Fassung der Gegenprobe traf den Kommentar über der
Zeile statt der Zeile. Die Mutation kam an und bewirkte nichts — dieselbe
Familie wie die Rolloutmutation, die im Objektliteral überschrieben wurde.)*

## Was den Anteil wirklich senken würde

Nicht mehr Prosa, sondern **Angaben, die es je Artikel nur einmal gibt**:
Hersteller, EAN, Bild, Datenblattverweis. Genau die stehen als offener Punkt
seit Tagen auf der Liste — die **Artikelliste aus dem Kundenkonto des
Lieferanten**. Sie löst bisher GTIN, Marke und Produktbild für den Feed und die
Weisung, das Sortiment auf hundert Artikel zu erweitern.

**Sie löst jetzt einen vierten Punkt mit**, und der wiegt für den Klickkanal
schwerer als die drei anderen: Ohne sie bleiben 46 Seiten, die sich in einem
Namen und vier Zahlen unterscheiden — und der bezahlte Klick führt auf eine
davon.

Bis dahin ist gemessen, was ist. Der Anteil von 62 % ist kein Versäumnis,
sondern die Grenze dessen, was aus fünfzehn Lieferantenrechnungen zu holen ist.
Neu ist nur, dass die Zahl dasteht.

> **Berichtigt am 5. September.** Beide Aussagen dieses Abschnitts sind
> nachgemessen und halten nicht: Die Zahl war **62 %**, weil drei Stück
> Navigation (der `noscript`-Hinweis, der Seitentitel, die Sprungmarke) in
> der Messung standen, obwohl der Prüfer sie auszuschließen behauptete —
> gemessen sind **58 %**. Und der gemeinsame Anteil ist **nicht** die Grenze
> dessen, was aus fünfzehn Lieferantenrechnungen zu holen ist: Der größte
> gleiche Block ist der **eigene Lieferabsatz**, 93 von 109 Wörtern auf jeder
> Seite, und den macht keine Lieferantenliste kürzer. Siehe
> `die-schuld-lag-im-eigenen-absatz.md`.

## Verweise

- `shop/src/seitenaehnlichkeit.js` — die Regeln
- `shop/bin/dublettenpruefung.mjs` — `npm run pruefe-dubletten`
- `shop/test/seitenaehnlichkeit.test.js` — sieben Proben
- [`der-versuch-traegt-die-absage.md`](./der-versuch-traegt-die-absage.md) — der Klickversuch, für den diese Seiten das Ziel sind
