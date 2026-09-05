# Die beiden Hälften sind sich nie begegnet

**4. September 2026, Nachmittag.** Der Bestellweg ist gebaut. `bestellung.php`
ist an einem laufenden PHP geprüft, sieben Fälle. `shop-bestellen.js` ist der
einzige Absendeweg im Bündel und geht nur mit eingeschaltetem Weg hinein. Der
Schalter, die Datenschutzzusage und ihre Messung hängen an einer Stelle.

Jede Hälfte ist geprüft.

> **Zusammen ausgeführt hat sie niemand.** Die 53 Browserszenarien laufen gegen
> die Einzeldatei über `file://` und mit ausgeschaltetem Weg — der Knopf war
> dort nie auf der Seite, und ein `fetch` ginge von `file://` ohnehin nicht
> hinaus.

Das ist dieselbe Familie, die dieser Bestand seit Wochen findet: gebaut,
geprüft, nicht angeschlossen — nur eine Stufe später. Hier ist beides
angeschlossen und nichts durchgefahren.

## `npm run bestellprobe`

Echter Bau, echtes PHP, echter Browser, echte Datei am Ende:

1. Der Shop wird in ein Wegwerfverzeichnis gebaut, mit einer Betreiberdatei,
   in der E-Mail und Rechtstextefundstelle stehen — **der einzige Weg, den
   eingeschalteten Zustand zu prüfen, ohne den Bestand anzufassen.** Fehlt
   `bestellung.php` danach, bricht die Probe ab: Sonst hätte sie den
   ausgeschalteten Zustand geprüft und für den eingeschalteten gehalten.
2. Zwei Sonden gehen in `kasse.html`, und die Reihenfolge trägt sie. Die erste
   läuft **vor** `shop.js` und legt den Warenkorb in den Speicher; die zweite
   danach und bedient die Oberfläche. Ein einziges Skript am Ende käme zu spät
   für den Korb und zu früh für die Seite.
3. `php -S` serviert das gebaute Verzeichnis, Chromium lädt die Kasse, wählt
   den Bezirk, füllt Firma, Adresse und Telefon und drückt auf den Knopf.
4. Dann wird nachgesehen, was **in der Datei** steht.

```
Bestellprobe — 3 Prüfungen von Klick bis Ablage

  ✓ Die Kasse meldet: Angekommen. Ihre Nummer: B-2026-0001
  ✓ Die Ablage liegt außerhalb des Webverzeichnisses
  ✓ In der Ablage: B-2026-0001, Musterbau GmbH, 940 Zeichen Positionsliste
```

**Die Nummer auf dem Bildschirm ist die Nummer in der Datei.** Das ist der
eigentliche Ertrag: Eine Kasse, die „Angekommen" schreibt, ohne dass etwas
ankam, wäre der teuerste Fehler dieses ganzen Wegs — und keine andere Prüfung
dieses Bestandes hätte ihn je gesehen.

## Drei Funde beim Bauen der Probe selbst

**Der Marker fand sich selbst.** Die Sonde schreibt ihr Ergebnis zwischen zwei
Markierungen in die Seite, und gesucht wird danach im ausgegebenen DOM. Beim
ersten Lauf meldete die Probe `„" + out + ""` — sie hatte die Markierung im
**Quelltext der Sonde** gefunden, der als Text in der Seite steht, nicht im
Ergebnis. Die Markierung steht jetzt geteilt im Quelltext, wie in
`shopprobe.mjs` seit dem 29. August. Zweimal derselbe Fehler in zwei Wochen —
diesmal war die Lösung schon da und ich habe sie nicht mitgenommen.

**Der Warenkorbschlüssel stand fast zweimal.** Die Sonde muss wissen, unter
welchem Namen der Korb liegt. Ich hatte ihn erst als Zeichenkette in die Probe
geschrieben; am Tag der nächsten Fassung (`-v2`) hätte sie einen leeren
Warenkorb gefüllt und nichts gemerkt. Er wird jetzt aus dem gebauten Bündel
gelesen.

**Und der wichtigste:** Die Prüfung, ob die Ablage im Webverzeichnis liegt,
stand im else-Zweig der Journalprüfung. Als die Gegenprobe genau das herstellte
— ein Zeichen Unterschied, `/../` gegen `/` —, fand die Probe an der erwarteten
Stelle kein Journal, meldete „es ist nichts angekommen" und **sah die
Veröffentlichung gar nicht**.

> **Eine Prüfung, die nur im gelungenen Fall läuft, prüft den Fall nicht, für
> den es sie gibt.**

Sie steht jetzt für sich, vor allem anderen. Die Gegenprobe
`ablage-im-webverzeichnis` hält sie wach: Ein Journal mit Namen, Anschriften
und Positionslisten unter einer URL wäre kein Journal, sondern eine
Veröffentlichung — und keine Prüfung dieses Bestandes außer dieser sieht je das
fertig ausgelieferte Verzeichnis mit eingeschaltetem Bestellweg.

## Ein vierter Fund, und einer, der offen bleibt

Ein Gesamtlauf meldete `✗ gegenproben — Ausgang 1`, während derselbe Läufer
einzeln zweimal hintereinander „42 von 42" sagte. Der Fehler ließ sich nicht
nachstellen, und ich konnte auch nicht nachlesen, welche Probe es war:

> **Der Schritt meldete den Ausgangscode und warf die Ausgabe weg** — in der
> genau dringestanden hätte, welche Probe warum gescheitert ist.

`bin/gesamtlauf.mjs` gibt bei einem gescheiterten Schritt jetzt die letzten
zwölf Zeilen des Kindes mit aus. Ein Schritt, der scheitert und den Grund für
sich behält, kostet einen ganzen zweiten Lauf; dieser hier dauert acht Minuten.

**Offen bleibt der Befund selbst.** Der nächste Lauf war grün, und ich habe
keine Erklärung — nur den Verdacht, dass die neue Probe unter Last (Chromium
plus PHP plus Bau, während vierzig andere Gegenproben laufen) an eine
Zeitgrenze stößt. Das steht hier, weil ein einmaliger roter Lauf, den niemand
notiert, beim nächsten Mal als neu gilt.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste. Es ändert, was die letzte Runde wert ist: Der
Bestellweg war gebaut und geprüft — jetzt ist er **gefahren**. Am Tag, an dem
E-Mail und Rechtstexte dastehen, ist der erste echte Klick nicht der erste
Versuch.
