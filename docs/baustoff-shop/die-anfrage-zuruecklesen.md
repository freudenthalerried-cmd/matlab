# Drei Minuten Abtippen, und dort liegt der teuerste Fehler

**3. September 2026.** Eine Stunde zuvor ist der Anfragebetrieb gerechnet
worden: vier Schritte, fünfzehn Minuten je Anfrage. Der erste heißt „Anfrage
lesen und den Positionen zuordnen" und kostet drei Minuten.

Drei Minuten, in denen ein Mensch Artikelnummern und Mengen aus einer Mail in
den Shop zurücktippt — `POS-51967`, `POS-12476`, 1×, 2×.

> **Das ist die eine Stelle, an der ein Tippfehler falsche Ware auf eine
> Baustelle bringt.**

Und es ist eine unnötige Stelle: Der Text stammt aus diesem Shop. Er hat ein
Format, das Format ist geprüft, und `npm run pruefe-belege` liest es jeden Tag.
Was gelesen werden kann, gehört nicht abgeschrieben.

## Warum die Menge aus der Rechnung kommt

Eine Position sieht so aus:

```
1 STK    Thermo-Trennstein …    POS-51967   255,91 €   255,91 €
```

Bei langen Namen bricht der Text um, und **die Menge steht dann auf einer
anderen Zeile als die Artikelnummer**. Ein Mailprogramm darf zusätzlich
umbrechen, wo es will. Auf diese Anordnung zu bauen hieße, auf die Zeilenbreite
eines fremden Programms zu bauen.

Die Menge kommt deshalb aus **Zeilensumme ÷ Einzelpreis**. Beide stehen mit der
Artikelnummer auf *derselben* Zeile, und sie stehen dort, weil der Beleg sie so
setzt. Ein Testfall stellt sicher, dass der Umbruch im Probefall tatsächlich
eintritt — sonst prüfte er eine Anordnung, die er selbst erzeugt hat.

## Der Leser rechnet nach, statt zu glauben

Am Ende hält er die zurückgelesenen Positionen gegen die **Summen im Text**.
Weicht ein Cent ab, gibt er nichts zurück, sondern den Grund:

```
✗ Nicht übernommen.
  Die Summen stimmen nicht überein — Warenwert: Text 699 €, nachgerechnet
  677,89 €. Möglich sind ein geänderter Preis oder ein veränderter Text;
  beides gehört angesehen.
```

Beide Fälle sind echt. Ein Preis kann sich zwischen Anfrage und Antwort ändern
— dafür trägt jede Position einen Preisstand. Und ein Text kann verändert
worden sein, absichtlich oder durch ein Mailprogramm.

> **Ein Leser, der bei Abweichung weitermacht, hat die Autorität einer Maschine
> und die Verlässlichkeit einer Vermutung.**

Das ist dieselbe Haltung wie beim stillen Nullfund in der Rechnungsauslese
(`/Type/Page` gegen `/Type /Page`, Ergebnis eine leere Datei ohne Fehler) und
beim Feed, der „46 veröffentlichbar" meldete, während bei allen 46 die GTIN
fehlte. Der Unterschied zu damals: Diesmal war der stille Fehlschlag von
vornherein ausgeschlossen.

## Was das Werkzeug nicht ist

Es erzeugt **kein** Angebot. Es liest zurück und rechnet nach; das Angebot
entsteht wie bisher in `beleg.js` und ist dort geprüft. Diese Trennung ist
Absicht: Ein Werkzeug, das aus einer fremden Mail unmittelbar einen
verbindlichen Beleg macht, hätte zwischen Eingang und Zusage keinen Menschen
mehr.

Und es ändert **nichts** am Text, den der Kunde bekommt. Der erste Entwurf sah
eine zusätzliche Zeile vor — einen „Warenkorbcode" zum Zurücklesen. Verworfen:
Der Text trägt die Artikelnummern bereits in einer festen Spalte. Eine zweite
Fassung derselben Angabe im selben Dokument wäre genau die Doppelung, die
dieses Vorhaben an sechs anderen Stellen bereits gekostet hat.

## Was es spart

Von den fünfzehn Minuten je Anfrage betrifft es die ersten drei. Bei zwanzig
Anfragen im Monat ist das eine Stunde — gemessen an der Grenze von zwanzig
Stunden wenig, gemessen an der Fehlerquelle viel: **Die Ersparnis ist nicht die
Zeit, sondern dass die Artikelnummer nicht mehr durch eine Tastatur geht.**

## Geprüft

Sieben Testfälle in `test/anfragelesen.test.js`. Die Probe geht den ganzen Weg:
Anfragetext erzeugen, zurücklesen, mit dem Warenkorb vergleichen, aus dem er
entstanden ist.

1. Der zurückgelesene Warenkorb ist der abgeschickte — Positionen, Mengen,
   Bezirk und Warenwert.
2. Die Menge kommt aus der Rechnung, nicht aus der Zeilenanordnung; der
   Testfall stellt zuerst fest, dass der Name tatsächlich umbricht.
3. Gebrochene Mengen kommen unverfälscht zurück.
4. Ein veränderter Betrag wird gemeldet, nicht überschrieben.
5. Eine unbekannte Artikelnummer bricht das Lesen ab.
6. Ein fremder Text — auch ein leerer — ergibt keine Positionen, sondern einen
   Grund.
7. Summenzeilen („Warenwert 677,89 €") werden nicht für Positionen gehalten.

Beide Funktionen stehen im Fremdtextverzeichnis unter „kein Ausgang", mit dem
Grund: Ein Leser kann keinen Ausgang vergiften, und was er liest, geht erst
weiter, wenn es nachgerechnet ist.
