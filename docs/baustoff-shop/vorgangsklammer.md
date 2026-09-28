# Die Ware nach Innsbruck, die Rechnung nach Linz

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die vorige Runde hat die erste Klammer zwischen Kunden- und Lieferantenseite
gespannt und dabei die Frachtschwelle gefunden
([`frachtschwelle-und-bestellwert.md`](./frachtschwelle-und-bestellwert.md)).
Offen blieb die andere Hälfte: **Meinen die Papiere eines Vorgangs überhaupt
dieselbe Sache?**

## Der Fund

Bis heute entstehen die Papiere eines Geschäfts nebeneinander. `baueAuftrag`
macht den Auftrag, `erzeugeBestellungen` die Lieferantenpapiere,
`erzeugeRechnung` den Beleg an den Kunden. Jede Funktion für sich ist geprüft.
Was sie zusammenhält, ist nichts — außer der Sorgfalt des Aufrufers.

Zwei Aufrufe, zwei Objekte, ein Vertipper:

```js
const auftragA  = baueAuftrag('B-2026-0007', kundeA, …);   // Innsbruck
const bestellungen = erzeugeBestellungen(warenkorb, auftragA);
const rechnung  = erzeugeRechnung(warenkorb, { …, kunde: kundeB });  // Linz
```

Ergebnis:

```
Lieferadresse (Baustelle):        Rechnungsempfänger:
  Baumeister Alpen GmbH             Bau Donau e.U.
  Alpenweg 1                        Donaustraße 9
  6020 Innsbruck                    4020 Linz
```

Die Ware geht auf die Baustelle in Innsbruck, die Rechnung an eine Firma in
Linz. **Keine bestehende Prüfung sieht etwas davon:**

| Prüfung | Urteil |
|---|---|
| `pruefeRechnungsmerkmale` (§ 11 UStG) | `vollstaendig: true` |
| `pruefeBestellung` (Gegenprobe der Vorrunde) | `deckungsgleich: true` |
| `darfAutomatischAusgeloestWerden` | nur Platzhalterpreise beanstandet |
| `darfRechnungGestelltWerden` | nur Platzhalterpreise beanstandet |

Jede prüft ihr eigenes Papier. Keine prüft, ob es dieselbe Sache betrifft.

**Dass das heute nicht durchgeht, liegt allein an der Platzhaltersperre** — und
die fällt, sobald der erste Hersteller echte Konditionen nennt. Sie ist keine
Sicherung gegen Verwechslung; sie ist eine gegen erfundene Preise. Wer sie für
mehr hält, verwechselt einen Zufall mit einer Absicht.

Der Schaden ist von anderer Art als die bisherigen Funde. Eine falsche Menge
liefert zu viel, ein Zeilenumbruch zerlegt eine Datei. Hier steht Ware auf einer
**fremden Baustelle** — bezahlt, ausgeliefert, und der Empfänger hat weder
bestellt noch eine Rechnung, während der Besteller eine Rechnung hat und keine
Ware. Im Streckengeschäft an eine Adresse, die dem Lieferanten gehört, nicht
mir.

## Die Behebung: ein Vorgang, ein Satz Daten

`shop/src/vorgang.js` macht die Verwechslung **strukturell unmöglich**.
`baueVorgang()` nimmt **einen** Satz Kundendaten und lässt alle Papiere daraus
hervorgehen — Auftrag, Lieferantenbestellungen, Angebot, Rechnung. Wer zwei
Kunden mischen will, muss zwei Vorgänge bauen, und die haben verschiedene
Nummern.

Dazu `darfVorgangLaufen()`, bewusst **additiv** über die bestehenden Sperren
gelegt statt an ihre Stelle: Die prüfen jede ihre eigene Sache, diese prüft, dass
der Vorgang zusammenhält. Und `ablageEintraege()`, damit alle Einträge dieselbe
Vorgangsnummer tragen — die Voraussetzung dafür, dass `vorgangsakte()` später die
vollständige Akte liefert. Die braucht man nicht erst bei einer Prüfung, sondern
beim ersten Kunden, der anruft und fragt, wo seine Ware bleibt.

Zeitpunkte und Nummern werden weiterhin hereingereicht, nicht dort erzeugt. Ein
Vorgang, der selbst auf die Uhr sieht, lässt sich nicht prüfen und nicht
wiederholen. Die Rechnungsnummer vergibt weiterhin die Ablage, und zwar erst bei
der Ausstellung.

## Die Klammer — und was ich an ihr zuerst falsch gemacht habe

`pruefeVorgangsklammer()` in `kontrolle.js` liest die **gerenderten Papiere**
zurück und hält sie gegen den Vorgang: Bestellnummern, Lieferadresse,
Rechnungsempfänger, Summe der Bestellwerte, Zahl der Positionen.

In der ersten Fassung verglich sie jedes Papier gegen die **Erklärung des
Vorgangs**. Die Gegenprobe an dieser Prüfung hat das sofort bestraft: Ich habe
`baueVorgang` versuchsweise so verfälscht, dass der Beleg auf einen anderen
Namen lautet — und die Klammer meldete `geschlossen: true`. Sie musste, denn die
Erklärung, gegen die sie prüfte, war aus derselben verfälschten Hand.

Das ist genau der Befund aus
[`zweite-rechnung.md`](./zweite-rechnung.md), noch einmal und diesmal an meiner
eigenen Arbeit: **Wer gegen die eigene Erklärung prüft, findet ein vertauschtes
Papier, aber keinen Fehler in der Stelle, die die Erklärung erzeugt.**

Die Klammer hat deshalb jetzt eine Prüfung, die **zwei gerenderte Papiere
gegeneinander** hält, ohne den Vorgang anzusehen: Der Name im
Rechnungsempfängerblock gegen den Namen in der Lieferadresse des Bestelltexts.
Beide aus dem Text gelesen, keiner aus einem Objekt. Nach der Ergänzung fallen
bei derselben Mutation zwei Testfälle statt einem.

**Und eine benannte Annahme.** Dieser Vergleich gilt nur, solange Baustelle und
Rechnungsanschrift dieselbe Firma nennen — heute erzwingt `baueAuftrag` das, im
Streckengeschäft ist es auf Dauer die Ausnahme. Die Annahme steht deshalb als
Feld `lieferungAnRechnungsempfaenger` am Vorgang, nicht als stille Voraussetzung
im Code. Wer sie fallen lässt, schaltet diese eine Prüfung bewusst ab statt sie
unbemerkt zu entwerten; die übrigen bleiben in Kraft. Ein Testfall besteht auf
beidem.

## Was die Klammer meldet

| Verfälschung | Meldung |
|---|---|
| Rechnung auf einen anderen Kunden | `Rechnung geht an „Bau Donau e.U.", der Vorgang lautet auf „Baumeister Alpen GmbH"` |
| Bestellung auf eine fremde Baustelle umgelenkt | `B-2026-0007-01: Ware geht nach 4020 Linz, der Vorgang nennt 6020 Innsbruck` |
| Bestellnummer aus einem fremden Vorgang | `Bestellnummer B-2026-0099-01 beginnt nicht mit B-2026-0007` |
| eine Lieferantenbestellung verschwunden | Wareneinsatz und Positionszahl gehen auseinander |
| Ware und Rechnung an verschiedene Firmen | `B-2026-0007-01: Ware geht an „…", die Rechnung an „…"` |

Vierzehn neue Testfälle halten das fest — sieben davon verfälschen absichtlich
etwas und bestehen darauf, dass die Klammer es meldet. Ohne diese Hälfte wäre
die andere wertlos.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: `demo.html` erzeugt
den Vorgang mit den Nummern `B-2026-0007-01` und `-02`, einer nach § 11 UStG
vollständigen Rechnung, drei Ablageeinträgen unter derselben Vorgangsnummer —
und `darfVorgangLaufen` hält ihn mit drei Gründen an, alle wegen der
Platzhalterpreise.

## Was die Klammer nicht kann

Sie prüft Zusammenhang, nicht Richtigkeit. Steht in beiden Papieren dieselbe
falsche Adresse, ist die Klammer geschlossen und die Ware trotzdem am falschen
Ort. Dagegen hilft nur die Eingabeprüfung, und die kann eine Adresse nicht
kennen.

Sie prüft außerdem nur, was ihr übergeben wird. Ein Papier, das gar nicht erst
entsteht, fällt ihr nicht auf — dafür sind `darfVorgangLaufen` und die
Ablageakte da.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. Die Referenzwerte bleiben 3.900,20 €
brutto und 34,2 % Mischmarge; alle Preise sind Platzhalter.

Was sich ändert, ist eine Eigenschaft der Kette, die im Echtbetrieb ohne
Aufsicht bestellt: **Zwei Kunden können nicht mehr in einen Vorgang geraten.**
