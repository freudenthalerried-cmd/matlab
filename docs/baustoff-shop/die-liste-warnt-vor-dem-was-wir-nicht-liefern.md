# Die Liste warnt vor genau den Teilen, die wir nicht liefern

**8. September 2026.** Von den acht Weisungen des Auftraggebers ist genau eine
offen: **„Sortiment auf mindestens 100 Artikel"**. Sie steht als offener Punkt
mit dem richtigen Grund — die Artikelliste liegt beim Lieferanten, und der
Katalog stammt aus fünfzehn Rechnungen.

Der Brief an ihn bat um diese Liste. Er nannte **nicht, was konkret fehlt** —
obwohl der Bestand es weiß.

---

## Vier Systemlisten, sieben Marken, vier Teile

Die Systemlisten sagen, was ein Gewerk vollständig braucht: Kaminzug,
Grundleitung DN 100, Kellerwand mit Perimeterdämmung, Fassade auf 100 m².
Fünfunddreißig Positionen, und sieben davon tragen die Marke
*(nicht im Sortiment)*.

| Position | in welcher Liste | wird oft vergessen |
|---|---|---|
| **Abschlussschiene** | Grundleitung DN 100 **und** Kellerwand | ja |
| **Übergangsstücke** | Grundleitung DN 100 | ja |
| **Gleitmittel** | Grundleitung DN 100 | ja |
| **Anschlussformteil Feuerstätte** | Kaminzug | — |
| Abdichtung | Kellerwand | *eigenes Gewerk* |
| Verfüllmaterial | Kellerwand | *eigenes Gewerk* |

Zwei sind **eigenes Gewerk** und sollen es bleiben — die Bauwerksabdichtung
trägt eine eigene Gewährleistung, die ein Streckenhandel ohne
Baustellenkontakt nicht übernehmen kann, und Verfüllmaterial kommt aus dem
Kieswerk mit dem Kipper, nicht palettiert über einen Baustoffhändler. Beide
Gründe stehen jetzt im Register; wer eine Lücke zum Gewerk erklärt, schreibt
dazu, warum.

Bleiben **vier Teile**, und eines davon in zwei von vier Systemen.

---

## Der Fund, der darüber hinausgeht

Diese Tabellen haben eine vierte Spalte: **„wird oft vergessen"**. Sie ist ihr
eigentlicher Zweck — sie warnt den Bauherrn vor den Teilen, an die beim
Bestellen niemand denkt. Der Kanal ist ohne Gleitmittel nicht steckbar, und
ohne Übergangsstück endet die Leitung am Materialwechsel.

**Drei der vier Lücken stehen dort auf „ja".**

> **Die Liste warnt vor genau den Teilen, die wir nicht liefern.** Sie sagt dem
> Kunden, was er vergessen wird — und schickt ihn damit zu einem anderen.

Das ist keine Unehrlichkeit: Die Marke steht offen in der Tabelle, und das war
eine bewusste Entscheidung. Es ist eine **Verkaufsangabe**. Wer bei uns eine
Grundleitung bestellt, braucht für dasselbe Gewerk noch einen zweiten
Lieferanten — bei drei von acht Positionen. Und wer ohnehin zweimal bestellt,
kann auch gleich alles beim anderen bestellen.

---

## Was jetzt im Brief steht

`src/sortimentsluecke.js` zieht die Lücken aus den Listen — gemessen, nicht
getippt — und `npm run pruefe-anfrage` hängt daraus einen Satz an die Frage
nach der Artikelliste:

> „Wir stellen unsere Systemlisten so zusammen, dass ein Gewerk vollständig
> bestellbar ist. **Vier** Positionen bekommen wir dabei nicht aus Ihrem
> Sortiment zusammen: **Abschlussschiene** (Grundleitung DN 100, Kellerwand
> außen dämmen), **Anschlussformteil Feuerstätte** (Kaminzug), **Gleitmittel**
> (Grundleitung DN 100), **Übergangsstücke** (Grundleitung DN 100). Führen Sie
> diese Positionen — und wenn ja, unter welcher Artikelnummer?"

**Eine Frage mehr wird daraus nicht.** Der Satz hängt an einer Frage, die
ohnehin gestellt wird; jede zusätzliche senkt die Wahrscheinlichkeit einer
vollständigen Antwort. Das stand seit dem 3. September als Regel in derselben
Datei, und diesmal ist sie gleich mit angewandt.

Die Listennamen im Brief sind die **lesbaren** Titel, nicht die Dateinamen: Ein
Lieferant, der „Übergangsstücke" liest, weiß nicht, ob DN 100 Steinzeug auf
Kunststoff gemeint ist. Die Systemliste weiß es, also steht sie dabei.

---

## Und was daraus für die Weisung folgt

Der offene Punkt hieß bisher sinngemäß: *„Wir brauchen mehr Artikel, und die
Liste liegt beim Lieferanten."* Er heißt jetzt zusätzlich: **Diese vier
zuerst.**

> **„Mindestens hundert Artikel" ist eine Zahl. Vier Namen sind eine
> Bestellung.**

Und die Prüfung geht in beide Richtungen: Jede Position, die als eigenes
Gewerk gilt, braucht einen Eintrag mit Grund; jeder Eintrag, dessen Position
aus den Listen verschwindet, wird gemeldet; und eine Position, die als „nicht
im Sortiment" markiert ist, obwohl der Katalog sie führt, ebenso. Die
Gegenprobe erklärt das Gleitmittel stillschweigend zum eigenen Gewerk — der
bequemste Weg, eine Lücke loszuwerden.
