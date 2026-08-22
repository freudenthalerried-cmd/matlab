# Die maschinenlesbare Ausgabe — gebaut

Stand: 2026-08-18. Erster ausführbarer Schritt aus
`ki-sichtbarkeit-konzept.md` (Punkte 3, 4 und 6 des dortigen
Ablaufplans). Was von Rechnungen und Firmendaten abhängt, wartet
weiter; die Ausgabeschicht selbst hing an nichts.

## `src/maschinenlesbar.js`

Erzeugt die Schema.org-Auszeichnung je Artikel, den Katalog als Feed
und eine `robots.txt`, die Such- und Trainings-Crawler getrennt
behandelt. Drei Regeln tragen das Modul — alle drei sind Übernahmen aus
dem bestehenden Bau, keine neuen Erfindungen:

**1. Keine zweite Rechnung.** Die Auszeichnung übernimmt die Zahlen aus
`kalkuliere()` und rechnet nichts nach. Ein Widerspruch zwischen
angezeigtem und ausgezeichnetem Preis wäre in diesem Kanal der teuerste
Fehler überhaupt — dieselbe Begründung, aus der der Shop schon seine
Preise nicht im Frontend nachrechnet.

**2. Platzhalterpreise gehen nicht hinaus.** `darfVeroeffentlichtWerden`
sperrt jeden Artikel ohne bestätigten Einkaufspreis, mit Begründung.
Der Grund ist schärfer als bei der Bestellsperre: Eine Bestellung mit
Platzhalterpreis schadet einem Vorgang, ein **veröffentlichter**
Platzhalterpreis schadet dem Vertrauen — und Vertrauen ist der einzige
Rohstoff dieses Kanals, den man nicht nachkaufen kann. Ein Testfall
hält fest, was das heute bedeutet: **Vom gesamten Repo-Katalog geht
kein einziger Artikel hinaus.** Das ist die richtige Antwort, solange
keine echten Preise vorliegen.

**3. Zurückgehaltenes wird gezählt und begründet, nicht verschwiegen.**
Ein Feed, der stillschweigend den halben Katalog weglässt, ist genau
die Sorte Schweigen, die dieser Bau schon viermal gekostet hat.

Dazu: Nettopreis wird ausdrücklich als solcher ausgezeichnet (sonst
vergleicht ein Assistent Netto gegen Brutto und lässt den Shop teurer
aussehen, als er ist); das Liefergebiet steht als **Bezirksliste** in
der Auszeichnung statt als Satz auf der Versandseite; fehlende GTIN und
fehlendes Liefergebiet werden gemeldet statt erfunden.

## Absicherung

Zehn Testfälle. Gegenproben per Mutation: Platzhaltersperre entfernt →
3 Testfälle fallen; Preis nachgerechnet statt übernommen → 1 fällt;
Zurückhaltung verschwiegen → 2 fallen. Der Hohlheitsprüfer hat im
ersten Wurf zwei Schleifen ohne Längenzusicherung gefunden (die
Crawler-Listen) — berechtigt, behoben. **440 Testfälle, alle grün,
Prüfer ohne Verdacht.**

## Was daran noch fehlt

Die `robots.txt` und eine `llms.txt` sind erzeugbar, aber noch nirgends
ausgeliefert — dafür braucht es die Veröffentlichung unter einer
Domain. Die Artikelseiten mit eingebetteter Auszeichnung folgen, sobald
echte Preise da sind; heute gäbe es nichts auszuzeichnen.
