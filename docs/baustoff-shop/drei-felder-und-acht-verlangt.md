# Drei Felder, und acht werden verlangt

**4. September 2026, später Nachmittag.** Vor einer Stunde ist der Bestellweg
zum ersten Mal durchgefahren: Klick, PHP, Journal, und die Nummer auf dem
Bildschirm war die Nummer in der Datei. Die Probe war grün.

Dann habe ich nachgesehen, **was** in der Datei steht.

Das Formular sammelt drei Felder: Firma, E-Mail, Telefon.
`pruefeBestelldaten` in `kunde.js` verlangt **acht** — dazu Straße,
Postleitzahl, Ort, UID mit nachgerechneter Prüfziffer und die ausdrückliche
Bestätigung, dass für ein Unternehmen bestellt wird.

> **Die Kasse nahm Bestellungen entgegen, aus denen kein Angebot werden kann.**
> Ohne Anschrift keine Rechnung nach § 11 Abs 1 Z 2 UStG. Ohne UID und
> Bestätigung keine Nettorechnung nach Gate 7 — und darauf ruht das ganze
> Modell.

Der Fehler ist meiner, aus der Runde davor, und er ist genau die Sorte, die
dieser Bestand sonst findet: **zwei Listen für dieselbe Sache, und die kürzere
gewinnt, weil sie zuerst gelesen wird.** Ich hatte die Felder beim Schreiben
der Oberfläche aufgezählt und nicht nachgesehen, was der Beleg braucht.

## Die Liste gibt es ab heute einmal

`src/bestellfelder.js` führt die acht Felder mit Beschriftung, Feldtyp und
Pflichtgrund. Sie versorgt drei Stellen, die vorher jede ihre eigene Fassung
gehabt hätten:

| | |
|---|---|
| das Formular im Browser | wird aus den Daten gezeichnet, nicht aus `shop-ui.js` |
| `bestellung.php` | bekommt die Liste beim Bau in seine Konfiguration geschrieben |
| `npm run bestellprobe` | füllt **nach Namen**, nicht nach Reihenfolge |

Was dort **nicht** steht, ist die Prüfung selbst. Die bleibt in `kunde.js`;
eine zweite Fassung wäre wieder eine Liste, die ausläuft. Das Register sagt,
welche Felder erhoben werden — und `pruefeBestellfelder` hält es gegen die
Prüfung, in beide Richtungen:

- **Vorwärts:** Ein vollständiger Satz aus dem Register muss durchkommen.
  Kommt er nicht durch, erhebt das Formular zu wenig.
- **Rückwärts:** Jedes einzelne Feld muss die Prüfung zum Kippen bringen, wenn
  es fehlt. Ein Feld, dessen Fehlen niemanden stört, ist eine Frage an den
  Kunden ohne Grund.

Beim ersten Lauf hat der Prüfer eine eigene Nachlässigkeit gemeldet: Die
Begründung für „Ort" war zu kurz. Wer den Kunden nach etwas fragt, soll sagen
können, wofür.

## Der Prüfer steht dort, wo es weh tut

`npm run vorgang` — das Werkzeug, das aus einer Bestellung ein Angebot macht —
hält die beiden Listen jetzt vor allem anderen aneinander und bricht ab, wenn
sie auseinanderlaufen. Ein eigenes Prüfwerkzeug hätte man übersehen können;
dieses hier benutzt man an dem Tag, an dem die erste Bestellung eingeht.

## Die Probe prüft jetzt die richtige Frage

Bisher fragte `npm run bestellprobe`: *Kommt etwas an?* Sie fragt jetzt auch:
*Lässt sich daraus ein Angebot machen?*

```
Bestellprobe — 4 Prüfungen von Klick bis Ablage

  ✓ Die Kasse meldet: Angekommen. Ihre Nummer: B-2026-0001
  ✓ Die Ablage liegt außerhalb des Webverzeichnisses
  ✓ In der Ablage: B-2026-0001, Musterbau GmbH, 940 Zeichen Positionsliste
  ✓ Aus der abgelegten Bestellung lässt sich ein Angebot machen
```

Die vierte Zeile ist die, die gefehlt hat. Sie läuft die abgelegte Zeile durch
dieselbe Prüfung, die `npm run vorgang` anwenden wird — nicht durch eine
nachgebaute.

Und die Sonde füllte anfangs `felder[0]`, `[1]`, `[2]` der Reihe nach. Als das
Formular aus dem Register wuchs, schrieb sie eine Firma, eine Adresse und eine
Telefonnummer in Firma, Straße und PLZ — und meldete trotzdem grün, weil das
Empfangsskript die Form nicht die Sache prüft. Sie füllt jetzt nach Namen und
bricht ab, wenn das Formular ein Feld trägt, für das sie keinen Wert hat.

> **Eine Probe, die nach Reihenfolge füllt, prüft die Reihenfolge.**

## Was das Empfangsskript prüft und was nicht

Es prüft die **Form**: dass jedes Feld da ist, nicht zu lang, ohne
Zeilenumbruch, und dass eine E-Mail-Adresse wie eine aussieht. Die **Sache** —
UID-Prüfziffer, vierstellige österreichische Postleitzahl, Gate 7 — prüft
`npm run vorgang` gegen `pruefeBestelldaten`.

Das ist Absicht: Zwei Fassungen derselben Prüfung, eine in PHP und eine in
JavaScript, liefen auseinander. Die PHP-Seite hält Unsinn heraus, der die
Ablage beschädigen könnte; die inhaltliche Entscheidung fällt dort, wo der
Beleg entsteht.

## Nachtrag: der rote Lauf von vorhin hat einen Namen bekommen

Die Runde davor endete mit einem `✗ gegenproben — Ausgang 1`, das ich nicht
erklären konnte, weil der Schritt seine Ausgabe wegwarf. Seither gibt er die
letzten zwölf Zeilen mit aus — und heute hat sie sofort geliefert:
**42 von 43**, weil `pruefe-tests` rot war und die zugehörige Gegenprobe
deshalb „war schon vorher rot" meldete.

Rot war er wegen einer Schleife in **meinem eigenen neuen Testfall**, ohne
vorherige Zusicherung über die Länge der Liste. Behoben.

Das erklärt den gestrigen Fall nicht — der Läufer war damals einzeln grün —,
aber es zeigt, dass die Ergänzung genau das tut, wofür sie gedacht war: Der
Grund stand beim ersten Mal da, statt einen zweiten Achtminutenlauf zu kosten.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste — und viel an dem, was am ersten Tag geschieht. Ohne
diese Runde wäre jede eingegangene Bestellung ein Telefonat gewesen: Anschrift
nachfragen, UID nachfragen, Unternehmereigenschaft bestätigen lassen. Bei 67
Bestellungen im Monat sind das 67 Telefonate, die niemand eingeplant hat.
