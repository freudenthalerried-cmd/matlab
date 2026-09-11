# Der Tag, auf den alles zuläuft

**11. September 2026. Runde 33.**

## Der Fund

Der Bestand führt sechzig Prüfer. Alle sind grün, und **alle messen denselben
halbfertigen Stand**: ein Impressum mit vier Lücken, eine Entität ohne UID,
einen ausgeschalteten Bestellweg, sechsundvierzig Artikelseiten mit dem
Hinweis, was noch fehlt.

> **Jeder Prüfer misst den Zustand von heute. Der Tag, auf den alles zuläuft,
> ist ungeprüft.**

An jenem Tag liefert der Auftraggeber vier Angaben — E-Mail, Telefon, UID und
den Gewerbewortlaut —, und daran hängt mehr, als eine Datei vermuten lässt:
Das Impressum wird vollständig, einundsiebzig Organisationsblöcke bekommen
`telephone`, `email` und `vatID`, der Bestellweg schaltet sich ein,
`bestellung.php` geht mit hinaus, der Hinweis auf den Artikelseiten schrumpft
auf das, was dann noch wirklich fehlt, und die Rechnung darf zum ersten Mal
entstehen.

**Nichts davon hat je jemand zusammen gesehen.**

## Der Probelauf

`npm run pruefe-tagx` baut den Shop mit einer vollständigen Betreiberdatei in
einen Wegwerfordner und hält ihn gegen das, was dann gelten muss. Ergebnis:

| | |
| --- | --- |
| Impressum | alle vier Angaben da |
| Organisationsblöcke mit `telephone`, `email`, `vatID` | **71 von 71** |
| Bestellweg | eingeschaltet, `bestellung.php` geht mit |
| Hinweis auf den Artikelseiten | schrumpft auf „es fehlt die Lieferzeit des Lieferanten" |

Der Bau des 10. September hält: Die Entität ist an **einer** Stelle gebaut, und
die Angaben landen überall, ohne dass jemand daran denken muss. Der Hinweis
ist abgeleitet und nicht abgeschrieben — er nennt am Tag X von sich aus nur
noch das eine, was der Lieferant schuldet.

**Zwei Dinge tut der Lauf ausdrücklich nicht.** Er schreibt nichts in den
Bestand: Die Probewerte leben in einem Ordner, den das Betriebssystem
wegräumt, und ein Testfall hält fest, dass keiner von ihnen in
`data/betreiber.json` steht. *Eine erfundene UID im echten Impressum wäre
genau der Fehler, gegen den dieser ganze Bestand gebaut ist.* Und er prüft
nicht die Ausgabe, die ausgeliefert wird — dafür gibt es die anderen
neunundfünfzig.

## Was der Prüfer sofort korrigiert hat

Der erste Wurf führte die **vier** Impressumsangaben und verlangte trotzdem,
der Bestellweg schalte sich ein. Er tat es nicht. `VORAUSSETZUNGEN` in
`src/bestellweg.js` nennt **zwei** Felder, und das zweite ist die Fundstelle
der Rechtstexte — solange der Datenschutztext nur als Gliederung dasteht, sagt
die Seite „wird nicht an den Server übertragen", und das wäre mit
eingeschaltetem Weg eine **geprüfte Unwahrheit**.

> **Der Tag X ist kein Tag.** Die vier Angaben kosten den Auftraggeber einen
> Anruf; die Rechtstexte kosten Geld und gehören zu einem anderen offenen
> Punkt. Wer beides in einen Topf wirft, hält den Shop für einen Anruf
> entfernt von der ersten Bestellung.

Die fünfte Angabe steht jetzt im Register, mit genau diesem Unterschied als
Grund. Und ein Testfall hält `OFFENE_ANGABEN` gegen `VORAUSSETZUNGEN`: Wer dem
Bestellweg eine dritte Bedingung gibt, bekommt sie hier abgefragt.

## Ausgang

| | |
| --- | --- |
| offene Angaben mit Probe und Wirkungsort | **5** |
| geprüfte Stellen am Tag X | Impressum, 71 Entitäten, Bestellweg, Hinweis |
| Prüfer | 60 → **61** (`pruefe-tagx`, 1,5 s — im Gesamtlauf, nicht im Haken) |
| Testfälle | 11 neu, 2352 grün |
| Gegenproben | 198 → **199** |

## Was daraus offen bleibt

Nichts Neues — aber die Liste der offenen Punkte hat eine Unterscheidung
dazubekommen, die sie vorher nicht machte: **vier Angaben kosten einen Anruf,
eine kostet Geld.** Wer den Shop online bringen will, braucht beides; wer nur
wissen will, ob der Bau hält, hat es jetzt gemessen.

---

**Die Regel dieser Runde:** *Ein Bestand, der nur seinen heutigen Zustand
prüft, ist an dem Tag ungeprüft, für den er gebaut wurde.*
