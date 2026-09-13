# Der Bau prüfte nur den Kern — das fertige Skript prüfte niemand

Stand: 2026-08-17. Dreizehntes Audit der Serie „vom Verhalten zur
Erklärung", drittes Betreiberwerkzeug: `build-demo.mjs`, der Bauschritt,
der aus Vorlage, Daten und Rechenkern die eine Datei `demo.html` fügt.
Ausgangspunkt war ausgerechnet der Stolz dieses Werkzeugs: der
Kollisionswächter, der nach dem EUR-Vorfall eingebaut wurde.

## Vier Befunde

**1. Der Wächter sah nur den Kern, nicht das fertige Skript.** Das
Template deklariert im selben Modulskript eigene Top-Level-Namen —
`daten`, `katalog`, `korb`, `eur`, `ZIELMARGE`. Ein Kernmodul, das künftig
`const eur` einführte, hätte den Bau grün passiert und die Seite mit
einem SyntaxError totgelegt: exakt der EUR-Vorfall, eine Ebene höher.

**2. `String.replace` mit Ersatztext statt Ersatzfunktion.** Im Ersatztext
haben `$&`, `` $` `` und Verwandte Sonderbedeutung. Die Sonde: ein
Artikelname `Bahn $& Rolle` schreibt den Platzhalter `/*__DATEN__*/`
wörtlich zurück in die Seite. Artikelnamen sind freier Text aus
importierten Preislisten — der Weg von einer echten Herstellerliste bis
in die Seite war offen, und der Schaden wäre stumm geblieben.

**3. Ein fehlender Platzhalter fiele stumm durch.** `replace` ohne
Treffer ist ein No-op; eine Vorlage ohne `/*__KERN__*/` ergäbe eine Seite
ohne Rechenkern, der Bau meldete Erfolg.

**4. Nebenfund des neuen Prüfschritts: `entkleide` übersah
`export async function`.** `pruefeUid` stand seit jeher als
Export-Statement im Bündel — im Modulskript zufällig gültig, vom
Kollisionswächter aber nie erfasst, dessen Muster `async function` gar
nicht kannte. Der erste Wurf des Parse-Checks (im Funktionskontext)
scheiterte genau daran und deckte beides auf.

## Die Korrektur

- Beide Ersetzungen laufen über **Ersatzfunktionen** — `$`-Muster im
  Kern oder in den Daten bleiben wörtlich.
- **Fehlende Platzhalter werfen** vor der Ersetzung.
- Nach dem Fügen wird das komplette Modulskript extrahiert und mit
  **`node --check` im Modulkontext geparst** — Kollisionen zwischen
  Template und Kern, Ersetzungsschäden und jede andere Baubeschädigung
  scheitern jetzt im Bau, nicht erst im Browser des Betrachters.
- `entkleide` entkleidet auch `let`, `class` und `async function`;
  der Wächter kennt dieselben Deklarationsformen samt `var`.

`demo.html` ändert sich um genau eine Zeile (`export async function` →
`async function`); die Headless-Probe rendert die Seite unverändert mit
allen Katalogpositionen.

## Absicherung

Fünf neue Testfälle bauen in einem Wegwerfverzeichnis (Kopie von
Bauskript, Vorlage, Daten, Kern), damit das echte `demo.html` unberührt
bleibt: Repostand baut grün und ersetzt beide Platzhalter; ein
Artikelname mit `$&`/`` $` `` übersteht den Bau wörtlich; eine
Template-Kern-Kollision (`textZeile` doppelt) lässt den Bau scheitern;
ein fehlender Platzhalter fällt sofort auf; der Kern-Wächter meldet
weiterhin doppelte Namen. Gegenproben per Mutation: Ersatztext statt
Ersatzfunktion → 1 Testfall fällt; Parse-Check entfernt → 1 fällt.

Testbestand: **420, alle grün, Prüfer ohne Verdacht.**

## Einordnung

Dreizehn Audits, elf mit Befund, alle elf in die optimistische Richtung.
Das Muster verfestigt sich über die Schichten: Die Zahlenfehler machten
das Modell zu gut, die Werkzeugfehler machen die Lage zu gut — ein
Wächter, der nur einen Teil bewacht, ist die gefährlichste Sorte, weil
sein Vorhandensein die Wachsamkeit ersetzt. Als letztes Betreiberwerkzeug
ohne Verhaltensaudit bleibt `bin/testpruefung.mjs` — der Prüfer der
Prüfer, und damit die interessanteste Zielscheibe.
