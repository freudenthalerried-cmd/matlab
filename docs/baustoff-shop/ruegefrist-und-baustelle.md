# Wer auf der Baustelle übernimmt, übernimmt für den Besteller

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die Vorrunde hat die Baustelle als eigene Lieferanschrift eingeführt
([`baustelle-als-lieferort.md`](./baustelle-als-lieferort.md)) — den Datenweg,
nicht die Folgen. Diese Runde zieht sie nach: in den Rechtstexten und in der
Bestellstrecke.

## Die Folge, die kein Datenfeld abbildet

Sobald die Ware an eine Adresse geht, an der der Besteller nicht ist,
verschiebt sich etwas, das keine Adresszeile sichtbar macht: **der Beginn der
Rügefrist.**

§ 377 UGB verlangt, die Ware **unverzüglich nach der Ablieferung** zu
untersuchen und einen Mangel unverzüglich zu rügen. Maßgeblich ist die
Ablieferung — nicht der Tag, an dem der Besteller die Palette zum ersten Mal
sieht. Wer im Büro sitzt, während die Spedition in Ried ablädt, hat die Frist
trotzdem laufen.

Und: Auf einer Baustelle nimmt an, wer gerade dort ist. Ein anderes Gewerk, der
Bauherr, der Polier. Die Übernahme wirkt für den Besteller.

**Für dieses Sortiment ist das kein Formalismus.** Eine radondichte
Abdichtungsbahn kostet rund 355 € netto die Rolle; das Referenzgebäude trägt
fünf davon. Ein Transportschaden an einer Rolle fällt in der Praxis oft erst
beim Verlegen auf — Wochen später. Dann ist die Rüge verspätet, und die Ware
gilt nach § 377 Abs 2 UGB als genehmigt. Der Schaden liegt beim Besteller, und
der Ärger beim Händler, der ihn verkauft hat.

Das erklärt nachträglich, warum der **Ansprechpartner vor Ort** in der Vorrunde
zum Pflichtfeld geworden ist. Er ist nicht für die Spedition da. Er ist für
diese Frist da. Das war beim Bauen nicht der ausgesprochene Grund — es ist der
richtige.

## Was in den Rechtstexten dazugekommen ist

Die AGB-Gliederung hat zwei neue Punkte und einen geschärften:

| | |
|---|---|
| **6 — Abweichende Lieferanschrift und Empfangsvollmacht** | neu: Wer auf der Baustelle übernimmt, nimmt für den Besteller an; der Besteller benennt den Ansprechpartner und trägt dessen Erreichbarkeit |
| **7 — Gefahrübergang und Transportschäden** | geschärft: „…und die Frist läuft **ab Ablieferung auf der Baustelle**" |
| **11 — Lieferorte nur in Österreich** | neu: Lieferung außerhalb wäre nach Art 6, 7 UStG steuerfrei bzw. eine Ausfuhr — die Grenze aus der Vorrunde steht jetzt auch in den AGB, nicht nur im Code |

Zwölf Punkte statt zehn. Ein Testfall besteht weiterhin auf lückenloser
Nummerierung; ein zweiter, der bisher an der Nummer 7 hing, prüft jetzt den
Titel — eine Prüfung, die an einer Ordnungszahl klebt, geht beim nächsten
Einschub kaputt, ohne dass sich inhaltlich etwas geändert hätte.

**Unverändert gilt:** `rechtstexte.js` ist Zuarbeit, kein Ersatz für
Rechtstexte. In `phase5-technik.md` ist ein Anbieter mit
Aktualisierungsdienst für 10–25 € im Monat vorgesehen; dabei bleibt es. Was
hier steht, ist die Liste dessen, was er ohnehin abfragt — und was er ohne
diese Vorarbeit nicht abfragen würde, weil er das Streckengeschäft auf die
Baustelle nicht kennt.

## Und was der Besteller tatsächlich zu sehen bekommt

Ein Hinweis in den AGB ist im B2B wirksam und wird nicht gelesen. Deshalb steht
er jetzt **vor** der Bestellung, in der Strecke selbst: `lieferhinweise(auftrag)`
liefert die Punkte, die zu diesem Auftrag passen.

| Hinweis | Grundlage | wann |
|---|---|---|
| Wer übernimmt, übernimmt für Sie | AGB Punkt 6 | nur bei abweichender Baustelle |
| Die Rügefrist läuft ab Ablieferung | § 377 UGB | immer |
| Rollenware auf der Baustelle prüfen, nicht beim Verlegen | § 377 Abs 2 UGB | immer |
| Teillieferungen kommen getrennt an | AGB Punkt 4 | immer |

Die Auswahl ist der eigentliche Entwurfsgedanke: **Ein Hinweistext, den alle
immer sehen, wird von niemandem gelesen.** Ohne abweichende Baustelle ist die
Empfangsvollmacht gegenstandslos und würde die drei übrigen nur verwässern. Ein
Testfall besteht auf beidem — dass der Hinweis fehlt, wo er nicht hingehört,
**und** dass er dasteht, wo er hingehört.

Die Rügefrist steht dagegen immer da. Sie gilt auch, wenn die Ware ins eigene
Lager geht.

## In der Bestellstrecke

Die Demoseite fragt die Baustelle jetzt ab: eine Kästchenauswahl klappt die
Felder auf, Bezeichnung und Zufahrtshinweis freiwillig, Straße, PLZ, Ort, Land
und Ansprechpartner vor Ort verpflichtend. Der Hinweisblock erscheint darunter
und wechselt die Farbe — mit abweichender Baustelle steht er in der auffälligen
Variante, weil dann mehr auf dem Spiel steht.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: Die Felder sind
zunächst verborgen, klappen bei Auswahl auf, die Baustelle landet im Bestelltext
an den Lieferanten (`4910 Ried im Innkreis`) samt Zufahrtshinweis, der
§-377-Hinweis erscheint in beiden Fällen, der Hinweis zur Empfangsvollmacht nur
mit Baustelle.

## Geprüft

| | |
|---|---|
| neue Testfälle | 7 |
| Testfälle gesamt | 297, alle grün, 0 mit Verdacht |

Gegenprobe an der Auswahl: Filterung entfernt, sodass immer alle Hinweise
kommen → der Testfall fällt. Eine Auswahl, die nichts auswählt, wäre von einer
funktionierenden nicht zu unterscheiden.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. 3.900,20 € brutto und 34,2 %
Mischmarge bleiben; alle Preise sind Platzhalter.

Was bleibt: Die Rügefrist ist ein Risiko des **Bestellers**, nicht des Händlers
— aber ein Händler, der sie verschweigt, verkauft einmal und bekommt den Anruf
danach. Der Hinweis vor der Bestellung ist deshalb keine Absicherung, sondern
das, was die Zielgruppe von einem Fachhändler erwartet und vom Baumarkt nicht
bekommt.
