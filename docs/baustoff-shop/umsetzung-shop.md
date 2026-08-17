# Umsetzung — Baustand des Shops

Stand: 2026-08-16. Fortlaufendes Bauprotokoll, keine Analyse. Gate 18 bleibt
unberührt: Die Analysephase ist geschlossen, gebaut wird trotzdem.

Quelltext unter `shop/`, veröffentlichtes Funktionsmuster:
[claude.ai/code/artifact/c40fd35f…](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8)

## Baustand

| Baustein | Stand | Testfälle |
|---|---|---|
| Preis- und Margenrechnung | fertig | 8 |
| Frachtrechnung je Lieferant | fertig, Schwelle korrigiert | 5 |
| Warenkorb mit Lieferantenaufteilung | fertig, Hinweise getrennt | 17 |
| Bestellübergabe als Text und CSV | fertig | 4 |
| Freigabesperren (Gate 6, Gate 7) | fertig | 3 |
| Preislisten-Import | fertig, ein Fehler behoben | 16 |
| Materialbedarfsrechner | fertig, zwei Fehler behoben | 13 |
| Bestellstrecke mit Gate-7-Prüfung | fertig | 11 |
| Messwert-Einordner | fertig, ein Fehler behoben | 10 |
| Rechtstexte-Gerüst | fertig, dreizehn AGB-Punkte | 22 |
| Angebot, Auftragsbestätigung und Rechnung | fertig, Vertragsschluss ergänzt | 24 |
| Trockenlauf des Auftrags | fertig, elf Schritte | 14 |
| UID-Abfrage beim EU-System | fertig, ungeprüft am Dienst, ein Fehler behoben | 17 |
| Ablage und Nummernkreis | fertig, Felderverzeichnis, ohne Speicherung | 21 |
| Zahlwege und Gebühren | fertig, Fracht in der Grundlage | 16 |
| Gesamtkostenbild und Umsatzbedarf | fertig, ein Fehler behoben | 17 |
| Empfindlichkeit der vier Annahmen | fertig, ein Fehler behoben | 16 |
| Auswertungsbogen für die Herstellerantworten | fertig, leer, zwei Antwortwege | 25 |
| Auswertungsbogen für die Partnerantworten | fertig, leer | 10 |
| Rückwärtsrechnung fürs Konditionsgespräch | fertig | 13 |
| Prüfer für die Testfälle selbst | fertig | gegen Probedatei nachgewiesen |
| Gegenprobe am gerenderten Beleg | fertig | 14 |
| Gegenprobe an der Lieferantenbestellung | fertig, ein Fehler behoben | 6 |
| Fremdtext an allen Ein- und Ausgängen | fertig, zwei Fehler behoben | 20 |
| Frachtdeckung Kunde gegen Lieferant | fertig, ein Fehler behoben | 4 |
| Vorgangsklammer über alle Papiere | fertig, ein Fehler behoben | 29 |
| Baustelle als eigene Lieferanschrift | fertig, Zusicherung nach Art. 14 | 29 |
| Abgleich Versprechen gegen Verhalten | fertig, zwei Befunde | 14 |
| Gedächtnis der Ablage (Journal aus Zeilen) | fertig, Senke wählbar | 14 |
| Gebietsauskunft über die Negativliste | Zwischenlösung, Vollausbau blockiert | 10 |
| Oberfläche als eine Datei ohne Abhängigkeiten | fertig, Baustelle abgefragt | headless geprüft |
| Generalprobe des Freigabetags | fertig, fiktive Antworten | 3 |
| Auswertung als Kommandozeilenwerkzeug | fertig, Beispieldatei fiktiv | 2 |
| **Summe** | | **408, alle grün, 0 hohl** |

## Was zuletzt dazukam: die Gebühr auf die durchlaufende Fracht

Ausführlich in [`gebuehr-auf-die-fracht.md`](./gebuehr-auf-die-fracht.md).
Der Kopf von `kostenbild.js` warnte seit der ersten Fassung, dass die
Zahlungsgebühr auch auf die durchlaufende Fracht anfällt — die Kaskade und
die Monatshochrechnung rechneten trotzdem ohne sie; nur `proBestellung`
hatte es richtig. Vierter Zahlenfehler dieser Art, vierter in die
optimistische Richtung. Korrigiert über `frachtProBestellungNetto` in der
Bemessungsgrundlage (Standard 0, bestehende Aufrufer unverändert); der
wichtigste neue Testfall hält Kaskade und Einzelbestellung am echten
Referenzwarenkorb auf den Cent gegeneinander. Gegenproben: Fracht wieder
draußen → 3 Testfälle fallen; Monatshochrechnung ohne Fracht → 1.

## Was davor dazukam: der Partner-Auswertungsbogen

Ausführlich in [`partnerauswertung.md`](./partnerauswertung.md). Der dritte
0-€-Auslöser (drei bis fünf Partneranfragen, Gate 9 und 13) war der einzige
ohne vorab feststehende Auswertung. `partnerauswertung.js` übernimmt die
Bedingungen aus dem Partnerangebot (Nennung als Ausschlussfrage, Leadpreis
≥ 100 €, 24-h-Frist, leistungsgebundene Exklusivität) und legt zwei
Rundenregeln fest: **Machbar ab zwei Bestandenen** — die Fristenlösung
braucht je Bezirk einen Partner und einen genannten Ersatzbetrieb — und der
**zweithöchste** Preis trägt die Planung, mit Ausweis, ob er im Band
100–250 € liegt. Gegenproben: eine Nennung genügt → 1 Testfall fällt;
der beste Preis trägt → 2.

## Was davor dazukam: der Großhandelsweg im Auswertungsbogen

Ausführlich in
[`auswertung-grosshandelsweg.md`](./auswertung-grosshandelsweg.md). Entwurf C
fragt einen Großhändler an, aber der Bogen konnte nur Herstellerantworten
lesen (Rabatt auf UVP) — die erste Großhändlerantwort wäre als „nicht
beziffert" verworfen worden. Jetzt werden zwei Wege gleichrangig
ausgewertet: Rabatt auf die Liste oder Netto-Einkaufspreis gegen den
Straßenpreis-Deckel. Ein Einkaufspreis ohne Deckel ist keine Kondition
(Entweder-oder im Bogen); nennt eine Antwort beide Wege, gilt der
schlechtere. Gegenproben: bessere Lesart gewinnt → 1 Testfall fällt;
Großhandelsweg überlesen → 4.

## Was davor dazukam: die Gebietsauskunft über die Negativliste

Ausführlich in
[`gebietsauskunft-zwischenloesung.md`](./gebietsauskunft-zwischenloesung.md).
`gebiet.js` beantwortet die erste Frage jedes Baumeisters — „Gilt das bei
mir?" — für die Vorsorgegebiets-Ebene aus der Negativliste (Wien + zehn
Bezirke, elf Einträge statt 2.095 Gemeinden). Die Demo fragt den Bezirk der
Baustelle ab; Beispielwert ist Ried im Innkreis, der ausgenommene
Heimatbezirk des Betreibers. Die Auskunft ist eine Auskunft, keine Sperre;
sie nennt in jedem Ergebnis ihre eigene Grenze (Schutzgebiete nur über die
amtliche Liste, Gate 11), trägt Stand, Quelle und den Vorbehalt der
Gegenprüfung am Verordnungstext, und formuliert unbekannte Bezirke als
Listenaussage statt als Ortskenntnis. Gegenproben: Ried gestrichen → 3
Testfälle fallen; Liste ignoriert → 3.

## Was davor dazukam: das Gedächtnis der Ablage

Ausführlich in [`gedaechtnis-der-ablage.md`](./gedaechtnis-der-ablage.md).
`speicher.js` gibt der Ablage ihr Gedächtnis: jedes Ereignis eine JSON-Zeile
in eine Anhangdatei (Betrieb: `journal-2026.jsonl` je Geschäftsjahr, § 132
BAO), `ausJournal` baut daraus die Ablage wieder auf. Erst das Journal, dann
der Speicher — wirft die Senke, bleibt der Arbeitsspeicher unverändert.

**Der Fund:** Ein Journal nur aus Einträgen wäre kein Gedächtnis für den
Zähler — eine gezogene, nie festgehaltene Nummer stünde in keinem Eintrag und
würde nach dem Neuladen **doppelt vergeben**, genau dann, wenn es darauf
ankommt: nach einem Absturz. Deshalb ist auch die Nummernvergabe eine
Journalzeile; die Lücke bleibt dauerhaft sichtbar und erklärungsbedürftig.

Das Laden ist streng: unbekannte Felder, fehlende Verzeichnisfelder, gerissene
Zeitfolge — Abbruch mit Zeilennummer statt Reparatur. Damit ist die
Migrationsfrage aus dem Felderverzeichnis dort verankert, wo sie sich stellt.
Die Demo speichert bewusst nicht (sie baut je Eingabe alles neu und würde
erfundene Geschäftsfälle sammeln). Gegenproben: Maskierung entfernt → 2
Testfälle fallen; Vergabe schreibt nicht → 3; Feldprüfung entfernt → 2.

## Was davor dazukam: jedes Journalfeld trägt jetzt seine Begründung

Baustein 2 der Liste unten, ausführlich in
[`felder-der-ablage.md`](./felder-der-ablage.md). `FELDER_DER_ABLAGE` in
`ablage.js` hält für jedes der neun Journalfelder Grundlage und Zweck fest —
acht tragen eine Vorschrift (§ 131/§ 132 BAO, § 11 UStG), nur `text` ist
betrieblich, und genau dort sitzt die Drittdaten-Schranke der Vorrunde.
`pruefeAblagefelder` hält Einträge und Verzeichnis in beide Richtungen
gegeneinander: Ein Feld ohne Verzeichniseintrag ist ein Befund, ein fehlendes
Verzeichnisfeld auch.

**Der Fund beim Aufstellen:** Das Feld `storniert` stand seit der ersten
Fassung in jedem Eintrag — immer `false`, nie gelesen, und strukturell unwahr,
weil ein eingefrorener Eintrag den Wechsel auf `true` nie vollziehen kann. In
einem Journal, das nur ergänzt wird, ist jeder Zustand eine Ableitung, keine
Zelle: `istStorniert` liest den Storno jetzt aus der Gutschriftkette, das tote
Feld ist entfernt, und der Doppelstorno-Riegel benutzt dieselbe Funktion.

Gegenproben: das Feld wieder eingebaut → 3 Testfälle fallen; die Prüfung
meldet immer „dicht" → 2 Testfälle fallen.

## Was davor dazukam: die Ablage ist die einzige Stelle ohne Löschtaste

Die Vorrunde hat den Befund benannt — der Ansprechpartner vor Ort ist ein
Dritter, Art. 14 DSGVO verlangt, ihn zu informieren, und der Shop erreicht ihn
nie. Diese Runde baut den einzigen Weg, der offensteht, und stößt dabei auf
einen zweiten Ort, an dem dieselben Daten liegen könnten. Ausführlich in
[`zusicherung-und-ablage.md`](./zusicherung-und-ablage.md).

**Die Zusicherung.** `ZUSICHERUNG_DRITTER` in `rechtstexte.js` hält den Wortlaut
an einer Stelle; `pruefeBestelldaten` verlangt den Haken, sobald eine
abweichende Baustelle angegeben ist — ohne ihn keine gültige Bestellung, genau
wie bei Gate 7. Ohne Baustelle wird sie **nicht** verlangt: Eine Bestätigung
ohne Anlass gewöhnt Kunden daran, Kästchen ungelesen anzuhaken, und entwertet
die, auf die es ankommt.

Sie ist nicht die Erfüllung der Pflicht durch den Shop, sondern die Verlagerung
auf denjenigen, der sie erfüllen kann. Der Eintrag in `DATENFLUESSE` führt
deshalb **beides**: die Maßnahme und die offene Frage. Eine offene Frage ohne
Maßnahme ist eine Notiz; eine Maßnahme ohne offene Frage wäre eine
Beschönigung.

**Der zweite Ort.** Die Ablage ist die einzige Stelle, aus der nichts mehr
verschwindet: § 131 BAO verlangt Unveränderbarkeit, § 132 sieben Jahre, und
Art. 17 Abs. 3 lit. b nimmt gesetzliche Aufbewahrungspflichten ausdrücklich vom
Löschanspruch aus. Genau deshalb gehört dorthin nur, was die
Aufbewahrungspflicht **verlangt** — die Rufnummer eines Poliers verlangt sie
nicht.

Heute steht sie nicht drin, weil `ablageEintraege` nur den Betreff der
Bestellung ablegt, nicht ihren Text. **Das war keine Entscheidung, es war
bequem.** Eine Zeile `text: b.text` statt `text: b.betreff`, geändert „für mehr
Nachvollziehbarkeit", und die Nummer liegt sieben Jahre unlöschbar im Journal.
`pruefeAblageAufDrittdaten` macht aus dem Zufall eine Zusicherung; Gegenprobe:
genau diese Änderung vorgenommen → der Testfall fällt.

Der Satz reicht über diese Runde hinaus: **Was in die Ablage geht, geht für
sieben Jahre hinein.** Bisher war das eine Aussage über Rechnungsnummern und
Unveränderbarkeit. Sie gilt genauso in die andere Richtung — jedes Feld, das
man dort „zur Sicherheit" mitschreibt, wird man sieben Jahre nicht mehr los.

## Was davor dazukam: der Ansprechpartner auf der Baustelle hat nie zugestimmt

Die Vorrunde hat ihre drei Befunde aus einer Durchsicht von Hand geholt. Eine
Durchsicht findet nur, wonach man an dem Tag gesehen hat — diese Runde macht
daraus ein Werkzeug. Ausführlich in
[`abgleich-versprechen-und-verhalten.md`](./abgleich-versprechen-und-verhalten.md).

`shop/src/abgleich.js` führt die Zuordnung **AGB-Punkt → Umsetzung** als Daten,
nach dem Muster des Fremdtext-Verzeichnisses. Jede Zuordnung zeigt auf **Namen,
die es geben muss** — eine Schritt-Kennung aus `SCHRITTE`, eine exportierte
Funktion —, und der Abgleich schlägt jedes Ziel nach. Gegenprobe: ein AGB-Punkt
ohne Zuordnung → 2 Testfälle fallen; ein Ablaufschritt ohne AGB-Bezug → 2
Testfälle fallen.

Der Abgleich der dreizehn Punkte selbst geht auf — negatives Ergebnis, die
Vorrunde hat aufgeräumt.

**Der Fund kam aus der anderen Richtung:** dieselbe Frage auf die
Datenschutzerklärung angewandt. Fünf tatsächliche Datenflüsse, zwei davon
nirgends genannt.

Der **Ansprechpartner vor Ort** ist ein Dritter. Seine Telefonnummer geht an den
Lieferanten und dessen Spedition; er hat mit dem Shop keinen Vertrag, die Nummer
stammt vom Besteller. Art. 6 Abs. 1 lit. b — die Grundlage, auf der die ganze
bisherige Gliederung steht — trägt das nicht; in Betracht kommt lit. f, und
Art. 14 verlangt, **ihn** zu informieren. Auf einer Baustelle ist das
typischerweise der Polier eines anderen Betriebs oder der Bauherr.

Die **UID-Abfrage** beim EU-System ist eine Übermittlung. Bei einer GmbH ist die
UID kein personenbezogenes Datum, bei einem Einzelunternehmer schon — und Gate 7
schließt Einzelunternehmer nicht aus.

Zwei neue Punkte in der Datenschutzgliederung, neun statt sieben, dazu
`DATENFLUESSE` mit Rechtsgrundlage und, wo vorhanden, der offenen Frage. Benannt,
nicht gelöst: `rechtstexte.js` ist Zuarbeit, keine Rechtsberatung — aber der
Anbieter fragt das nicht von selbst, weil er das Streckengeschäft mit
Baustellenanlieferung nicht kennt.

**Das Muster über fünf Runden:** Die ergiebige Richtung ist immer dieselbe — vom
Verhalten zur Erklärung, nicht umgekehrt. Eine Erklärung durchzugehen und zu
fragen „wird das eingehalten?" findet wenig; Erklärungen werden geschrieben,
nachdem man weiß, was man tut. Umgekehrt zu fragen „wo steht, dass wir das
dürfen?" findet die Stellen, an die beim Schreiben niemand gedacht hat.

## Was davor dazukam: die eigene Korrektur hat die Handelsspanne verraten

Vorgenommen war der systematische Abgleich: Was in den AGB steht, muss im Ablauf
vorkommen — und umgekehrt. Dreizehn Punkte gegen elf Schritte. Drei Befunde,
ausführlich in [`margenleck-im-angebot.md`](./margenleck-im-angebot.md).

**Erstens, und das ist der teuerste:** Im **Angebot an den Kunden** stand neben
einem Warenwert von 330 € der Satz „erreicht sind 231 €" — der Einkaufswert.
Das sind 30 % Handelsspanne in Ziffern, mit dem Hersteller namentlich daneben.
1.005 von 1.533 durchgerechneten Angeboten waren betroffen.

Der Satz stammt aus meiner eigenen Korrektur von vor zwei Runden. Die Begründung
lautete damals: „ein Fehlbetrag ohne Bezugsgröße lässt sich nicht nachrechnen."
Der Gedanke war richtig, die Bezugsgröße war es nicht — sie gehört dem
Betreiber. Behoben mit zwei Fassungen: `hinweise` für den Kunden, in **seiner**
Währung („Es fehlen rund 28 € Warenwert netto"), `hinweiseIntern` vollständig.
Dazu `pruefeMargenleck()` als Riegel; Gegenprobe: alten Hinweis wieder
eingesetzt → vier Testfälle fallen.

**Zweitens:** AGB-Punkt 3 versprach Reverse Charge bei innergemeinschaftlicher
Lieferung, während Punkt 12 Lieferungen außerhalb Österreichs ausschließt. Der
Fall kann nicht eintreten, und der Punkt beschrieb die Steuerlage falsch herum —
Reverse Charge betrifft die **Eingangsseite**, den innergemeinschaftlichen
Erwerb im Reihengeschäft. Berichtigt, mit Verweis auf Punkt 12; ein Testfall
prüft, dass jeder Querverweis auf einen vorhandenen Punkt zeigt.

**Drittens:** Der Shop weist Bestellungen unter dem Mindestbestellwert von
Anfang an ab — in keinem AGB-Punkt stand, dass es Mindestbestellmengen gibt.
Eine Ablehnung ohne veröffentlichte Grundlage. Neuer Punkt 5.

Die Lehre ist eine über Korrekturen: Der Fund der Frachtschwelle war richtig und
die Behebung auch — bis auf einen Satz, der beim Beheben nebenbei entstand und
den niemand mehr prüfte, weil die eigentliche Sache stimmte. **Eine Korrektur
ist eine Änderung wie jede andere und verdient dieselbe Gegenprobe.**

## Was davor dazukam: Geld genommen, bevor ein Vertrag bestand

Punkt 2 der eigenen AGB lautet seit dem ersten Entwurf: „Bestellung ist Angebot,
Annahme durch Auftragsbestätigung." **Dieses Papier gab es nicht.** Ausführlich
in [`auftragsbestaetigung.md`](./auftragsbestaetigung.md).

`beleg.js` erzeugte Angebot und Rechnung, dazwischen nichts, und der Ablauf ging
vom Zahlungseingang direkt zur Lieferantenbestellung. Leicht zu übersehen war es,
weil der Ablauf einen Schritt `auftragsbestaetigung` führte — nur meinte der die
Bestätigung, die der **Lieferant an uns** schickt. Zwei gegenläufige Papiere
unter einem Wort; der Schritt sah besetzt aus.

Der Widerspruch ist konkret: Nimmt man Geld ohne Annahme, hält man es ohne
Rechtsgrund; liest man die Zahlungsannahme als schlüssige Annahme, widerspricht
das dem veröffentlichten AGB-Punkt 2, und im Streitfall gilt die für den
Verwender ungünstigere Auslegung.

**Behoben:** `erzeugeAuftragsbestaetigung()` nennt den Vertragsschluss
ausdrücklich mit Verweis auf die AGB — und **wann die Baustelle vollständig
beliefert ist**. Angebot und Rechnung nennen die Lieferzeit je Lieferant; drei
Zahlen, aus denen der Kunde selbst das Maximum bilden soll. Er bildet es nicht.
Im Streckengeschäft ist die längste Lieferzeit die einzige, die zählt.

Dazu `darfBestaetigtWerden()`: Die Annahme darf nur erklärt werden, wenn die
Bestellung beim Lieferanten platzierbar ist. Der Fall aus
[`frachtschwelle-und-bestellwert.md`](./frachtschwelle-und-bestellwert.md) ist
genau dieser — wer einen Warenkorb unter dem Mindestbestellwert bestätigt, hat
einen Vertrag geschlossen, den er nicht erfüllen kann.

**Die Reihenfolge ist der eigentliche Inhalt:** annahme → zahlung →
bestellauslösung → lieferantenbestaetigung. Erst binden, dann Geld nehmen, dann
auslösen. Ein Testfall besteht auf der Reihenfolge, nicht bloß auf der Existenz
des Schritts; ein zweiter darauf, dass die eigene Bestätigung und die des
Lieferanten unterscheidbar benannt sind. Elf Schritte statt zehn, drei Minuten
Handarbeit ohne Anbindung — der Trockenlauf soll den Aufwand nicht kleiner
aussehen lassen, als er ist.

Bemerkenswert ist die Herkunft: Der Fund kam nicht aus einer Prüfung des
Programms, sondern aus dem Vergleich zweier Dinge, die längst nebeneinander im
Repo lagen — einer Zeile in der AGB-Gliederung und einer Liste von
Ablaufschritten in einer anderen Datei. Beide waren für sich richtig.

## Was davor dazukam: die Rügefrist auf der Baustelle

Die Vorrunde hat die Baustelle als Datenweg eingeführt, nicht ihre Folgen.
Diese Runde zieht sie nach — in den Rechtstexten und in der Bestellstrecke.
Ausführlich in [`ruegefrist-und-baustelle.md`](./ruegefrist-und-baustelle.md).

**Die Folge, die kein Datenfeld abbildet:** Sobald die Ware an eine Adresse
geht, an der der Besteller nicht ist, verschiebt sich der Beginn der Rügefrist.
§ 377 UGB verlangt die Untersuchung **unverzüglich nach der Ablieferung** —
maßgeblich ist die Ablieferung auf der Baustelle, nicht der Tag, an dem der
Besteller die Palette zum ersten Mal sieht. Und auf einer Baustelle nimmt an,
wer gerade dort ist; die Übernahme wirkt für den Besteller.

Für dieses Sortiment ist das kein Formalismus: Eine Abdichtungsbahn kostet rund
355 € netto die Rolle, das Referenzgebäude trägt fünf davon, und ein
Transportschaden fällt oft erst beim Verlegen auf — dann ist die Rüge verspätet
und die Ware gilt nach § 377 Abs 2 UGB als genehmigt.

Das erklärt nachträglich, warum der **Ansprechpartner vor Ort** ein Pflichtfeld
ist. Er ist nicht für die Spedition da, sondern für diese Frist. Beim Bauen war
das nicht der ausgesprochene Grund — es ist der richtige.

**In den Rechtstexten** zwei neue AGB-Punkte und ein geschärfter: abweichende
Lieferanschrift mit Empfangsvollmacht (6), Fristbeginn ab Ablieferung auf der
Baustelle (7), Lieferorte nur in Österreich (11). Zwölf Punkte statt zehn. Ein
Testfall, der bisher an der Ordnungszahl 7 hing, prüft jetzt den Titel — eine
Prüfung, die an einer Nummer klebt, geht beim nächsten Einschub kaputt, ohne
dass sich inhaltlich etwas geändert hätte.

**In der Strecke** liefert `lieferhinweise(auftrag)` die Punkte, die zu diesem
Auftrag passen: die Rügefrist immer, die Empfangsvollmacht nur bei abweichender
Baustelle. Der Entwurfsgedanke steht dahinter: Ein Hinweistext, den alle immer
sehen, wird von niemandem gelesen. Ein Testfall besteht auf beidem — dass der
Hinweis fehlt, wo er nicht hingehört, und dasteht, wo er hingehört.

Die Demoseite fragt die Baustelle jetzt ab; die Felder klappen bei Auswahl auf.
Am gebauten Bündel headless nachgesehen: Felder verborgen, klappen auf, die
Baustelle landet im Bestelltext samt Zufahrtshinweis, § 377 erscheint immer,
die Empfangsvollmacht nur mit Baustelle.

## Was davor dazukam: die Baustelle als eigene Adresse

Die Vorrunde hatte die Annahme „Ware und Rechnung gehen an dieselbe Adresse"
benannt statt verschwiegen. Diese Runde löst sie auf. Ausführlich in
[`baustelle-als-lieferort.md`](./baustelle-als-lieferort.md).

**Der Shop konnte den Regelfall der Zielgruppe nicht abbilden.**
`PARAMETER.md` nennt vorrangig Handwerksbetriebe; die bestellen vom Büro aus
für eine Baustelle, die woanders liegt. `baueAuftrag` setzte die Lieferadresse
zwingend aus den Rechnungsdaten — im Streckengeschäft hebt das den ganzen
Vorteil der Direktlieferung auf. Bezeichnend: Der Bestelltext trug von Anfang
an „Lieferadresse (**Baustelle**)" und „Ansprechpartner vor Ort". Die Absicht
war da, die Datenstruktur nicht.

Neu ist ein freiwilliger Block `baustelle` mit eigenem Ansprechpartner und
einem Zufahrtshinweis, der im Bestelltext direkt unter dem Adressblock steht —
wer die Bestellung an die Spedition weiterreicht, kopiert den Adressblock, nicht
den ganzen Brief.

**Der Fund: eine vierstellige Postleitzahl beweist nicht Österreich.** 6900 ist
Lugano, 8001 ist Zürich, 9490 ist Vaduz — alle vierstellig, alle über 1000, alle
bis dahin angenommen. Schweiz und Liechtenstein sind Drittland; eine Lieferung
dorthin ist eine Ausfuhr. Der Rechnungstext behauptet aber „Leistungsort
Österreich, Steuersatz 20 %", und `reihengeschaeftEinordnung` folgert daraus
„Ausgangsrechnung mit 20 %". Bei Lieferung in einen anderen Mitgliedstaat wäre
das nach Art 6, 7 UStG steuerfrei — 20 % wären schlicht falsch.

Das Loch war älter als die Baustelle: Dieselbe Regel prüfte seit jeher die
Rechnungsanschrift, dort entschärft durch die verlangte ATU-Nummer. Entschärft
ist nicht geschlossen, und die Baustelle hat keine UID.

Behoben mit einem eigenen Feld `land`: auf der Baustelle **Pflicht**, an der
Rechnungsanschrift `AT` als ausgesprochene Voreinstellung. Eine Voreinstellung,
die man benennen kann, ist keine stille Annahme mehr.

**Die Vorrunde hat sich ausgezahlt.** Weil `lieferungAnRechnungsempfaenger` als
Feld dastand und nicht als stille Voraussetzung im Code, war beim Auflösen genau
eine Stelle zu ändern — und es war sichtbar, welche. Bei abweichender Baustelle
schaltet sich genau die eine Prüfung ab, die Ware und Rechnung auf dieselbe
Firma vergleicht; alle übrigen bleiben scharf.

Gegenprobe an den neuen Sperren: Land wieder aus der Postleitzahl geraten →
2 Testfälle fallen; Baustellenblock wieder ignoriert → 12 fallen.

## Was davor dazukam: die Ware nach Innsbruck, die Rechnung nach Linz

Die Frachtklammer der Vorrunde ließ die andere Hälfte offen: Meinen die Papiere
eines Vorgangs überhaupt dieselbe Sache? Ausführlich in
[`vorgangsklammer.md`](./vorgangsklammer.md).

**Sie mussten es nicht.** Zwei Aufrufe, zwei Objekte, ein Vertipper — und die
Ware geht auf die Baustelle in Innsbruck, während die Rechnung an eine Firma in
Linz geht. Keine bestehende Prüfung sieht etwas: Die Rechnung ist nach § 11 UStG
`vollstaendig`, die Gegenprobe an der Bestellung ist `deckungsgleich`, weil sie
nur gegen den Warenkorb vergleicht. Jede prüft ihr eigenes Papier; keine prüft,
ob es dieselbe Sache betrifft.

Dass es heute nicht durchgeht, liegt allein an der Platzhaltersperre — und die
fällt, sobald der erste Hersteller echte Konditionen nennt. Sie ist keine
Sicherung gegen Verwechslung.

Der Schaden ist von anderer Art als die bisherigen Funde: Ware steht auf einer
**fremden Baustelle**, bezahlt und ausgeliefert, während der Besteller eine
Rechnung hat und keine Ware.

**Behoben durch `shop/src/vorgang.js`:** `baueVorgang()` nimmt einen Satz
Kundendaten und lässt alle Papiere daraus hervorgehen. Wer zwei Kunden mischen
will, muss zwei Vorgänge bauen — und die haben verschiedene Nummern. Dazu
`darfVorgangLaufen()` additiv über den bestehenden Sperren und
`ablageEintraege()`, damit die Vorgangsakte vollständig wird.

**Ein Fehler in meiner eigenen Klammer**, gefunden durch die Gegenprobe an ihr:
In der ersten Fassung verglich `pruefeVorgangsklammer` jedes Papier gegen die
Erklärung des Vorgangs — und meldete `geschlossen: true`, als ich `baueVorgang`
versuchsweise verfälschte. Sie musste, denn die Erklärung stammte aus derselben
verfälschten Hand. Das ist der Befund aus
[`zweite-rechnung.md`](./zweite-rechnung.md) noch einmal, diesmal an meiner
eigenen Arbeit. Die Klammer hält jetzt zusätzlich **zwei gerenderte Papiere
gegeneinander**, ohne den Vorgang anzusehen; bei derselben Mutation fallen
seither zwei Testfälle statt einem.

Die Annahme dahinter — Baustelle und Rechnungsanschrift nennen dieselbe Firma —
steht als Feld `lieferungAnRechnungsempfaenger` am Vorgang, nicht als stille
Voraussetzung im Code. Im Streckengeschäft ist sie auf Dauer die Ausnahme; wer
sie fallen lässt, schaltet diese eine Prüfung bewusst ab statt sie unbemerkt zu
entwerten.

## Was davor dazukam: die Schwelle stand auf der falschen Seite

Vorgenommen war die Klammer zwischen den Zahlen des Kunden und denen des
Lieferanten. Die erste gespannte Klammer — die Fracht — hat sofort etwas
gefunden, und zwar nicht in der Klammer, sondern in der Rechnung darunter.
Ausführlich in
[`frachtschwelle-und-bestellwert.md`](./frachtschwelle-und-bestellwert.md).

`preis.js` maß die Frei-Haus-Grenze am **Verkaufswert**. `freiHausAbNetto` ist
aber eine Kondition des Lieferanten uns gegenüber — die Frage im Anschreiben
lautet „ab welchem Auftragswert liefern **Sie** frachtfrei?". Maßgeblich ist der
Wert unserer Bestellung. Bei 35 % Zielmarge liegen die beiden rund 54 %
auseinander. Dasselbe galt für den Mindestbestellwert.

**Der Fehler geht immer in dieselbe Richtung.** Der Verkaufswert ist stets
größer als der Einkaufswert, also wird jede Schwelle zu früh erreicht, nie zu
spät. Über 3.066 Warenkörbe: **1.024 Teillieferungen** mit zu früh gewährter
Frachtfreiheit, zusammen **76.736 €** selbst getragene Fracht; größter
Einzelfall 150 € auf 487,50 € Deckungsbeitrag. Dazu **928 Teillieferungen**, die
als bestellbar gemeldet wurden, obwohl der Lieferant sie zurückgewiesen hätte —
der Gate-6-Fall in Reinform.

Der Kommentar im Warenkorb lautete: „Die Fracht wird an den Kunden weitergegeben
und ist damit margenneutral." Das stimmt nur, wenn die weitergegebene Fracht
dieselbe ist, die der Lieferant verlangt.

**Am Referenzgebäude ändert sich nichts** — dort liegen Verkaufs- und
Bestellwert jeder Teillieferung auf derselben Seite ihrer Schwelle. Genau
deshalb konnte der Fehler so lange stehen. 3.900,20 € brutto, 162,00 € Fracht,
34,2 % Mischmarge bleiben gültig, und mit ihnen alle daran hängenden Kennzahlen.

Die Klammer selbst ist `pruefeFrachtdeckung` in `kontrolle.js`, bewusst
unabhängig: Sie liest den Bestellwert aus dem **gerenderten Bestelltext** zurück
und legt die Konditionen aus `lieferanten.json` darauf an, statt mit
`warenkorb.js` zu rechnen. Wäre sie aus derselben Funktion gespeist worden, die
den Fehler gemacht hat, hätte sie ihn bestätigt statt gefunden. Zwei Verfahren,
dasselbe Ergebnis: 1.024 Fälle, 76.736 €. Nach der Behebung 0 ungedeckte
Teillieferungen über 7.872 geprüfte Bestellungen.

Nachgetragen in [`auswertungsbogen-hersteller.md`](./auswertungsbogen-hersteller.md):
Bei jeder von einem Hersteller genannten Schwelle ist zu klären, **worauf sie
sich bezieht** — Nettobestellwert nach Rabatt oder Listenwert. Bei 42 % Rabatt
ist das fast ein Faktor zwei.

## Was davor dazukam: Fremdtext an den Ein- und Ausgängen

Aufgabe war, einmal zusammenzustellen, wo fremder Text in den Shop eintritt und
wo er austritt. Beim Zusammenstellen kam ein Fund heraus, der ernster ist als
der Anlass. Ausführlich in
[`fremdtext-ein-und-ausgaenge.md`](./fremdtext-ein-und-ausgaenge.md).

**Ein Firmenname bestellt 999 Rollen.** Der Datensatz
`firma: 'Bau Muster GmbH\n  999 × AB-RD-375  Abdichtungsbahn'` kam durch
`pruefeBestelldaten` mit `gueltig: true` und stand danach als zweite Position im
Bestelltext an den Lieferanten. Ursache ist eine Zeile, die richtig aussieht:
`String(daten.firma).trim()` räumt an den Enden, nicht in der Mitte.

Die Gegenprobe der Vorrunde hat den Fund gemeldet — sie ist aber ein
Prüfwerkzeug und kein Riegel: Sie läuft in Testfällen, nicht im Bestellweg.

**Die Regel steht jetzt an beiden Enden.** `hatSteuerzeichen` weist am Eingang
ab, `textZeile` entschärft am Ausgang; `csvFeld` ist seither `textZeile` plus
Semikolon. Beides wird gebraucht: Nur entschärfen nimmt stillschweigend an, was
niemand so gemeint hat; nur abweisen deckt Artikelbezeichnungen aus einer
Herstellerdatei nicht ab.

**Das Verzeichnis ist der eigentliche Ertrag** — fünf Eingänge, acht Ausgänge,
und es steht als ausführbarer Testfall in `shop/test/fremdtext.test.js`. Geprüft
wird eine Eigenschaft, keine Zeichenkette: Der vergiftete Datensatz darf an
keinem Ausgang mehr Zeilen oder Felder erzeugen als ein harmloser.

Gegenprobe an der Prüfung: `textZeile` versuchsweise zur Identität gemacht —
**15 Testfälle fallen um**. Am gebauten Bündel headless nachgesehen: gleiche
Zeilenzahlen mit und ohne Gift, Eingabeprüfung meldet genau einen Fehler.

Nebenfund: `leseBestellung` suchte den Einkaufswert irgendwo im Text statt am
Zeilenanfang und las deshalb den erfundenen Betrag aus der Lieferadresse. Das
Werkzeug der Vorrunde hatte selbst eine Schwäche derselben Art, die es finden
sollte. Jetzt ist der Ausdruck verankert.

## Was davor dazukam: die Gegenprobe an der Lieferantenbestellung

`shop/src/kontrolle.js` liest jetzt auch die **Bestellung an den Lieferanten**
zurück und vergleicht Warenkorb, Bestelltext und Bestell-CSV paarweise.
Ausführlich in [`gegenprobe-bestellung.md`](./gegenprobe-bestellung.md).

Der Grund für diese Reihenfolge: Von allen Papieren des Shops ist das
Lieferantenpapier das einzige, das **Ware bewegt**, und nach Gate 6 geht es im
Echtbetrieb ohne menschliches Zutun hinaus.

**Ergebnis: ein echter Fund.** Eine Artikelbezeichnung mit Zeilenumbruch zerlegt
die Bestell-CSV in zwei Zeilen; die zweite wird zu einer Geisterposition mit
dem Lieferantennamen als Artikelnummer und `NaN` als Menge.

Die Asymmetrie ist der eigentliche Befund: `ablage.js` hat Zeilenumbrüche von
Anfang an entschärft, `bestellung.js` nicht — ausgerechnet in der Datei, die
Ware bewegt. Behoben mit einem gemeinsamen `csvFeld()` in `format.js`. Danach:
2.044 Warenkörbe, 5.248 Bestellungen, 0 Abweichungen, dazu 6 Testfälle, die den
Text und die CSV absichtlich verfälschen.

Vier Runden ergeben zusammen ein Muster: 155 grüne Testfälle, während
`demo.html` nicht startete; 213 grüne, während elf Schleifen nichts prüften; 213
grüne, während den Belegtext niemand ansah; 227 grüne, während die Bestell-CSV
an einem einzelnen Zeichen zerbrach. Die dritte Runde fand nichts, die vierte
etwas — **welche fündig wird, weiß man vorher nicht.** Das ist der Grund, die
Reihe nach einem negativen Ergebnis nicht einzustellen.

## Was davor dazukam: die zweite Rechnung

`shop/src/kontrolle.js` liest den **gerenderten Belegtext** zurück und rechnet
aus den Zeichen nach, ob er aufgeht. Ausführlich in
[`zweite-rechnung.md`](./zweite-rechnung.md).

Der Anlass ist derselbe wie beim Prüfer für die Testfälle: Bisher prüfen die
Testfälle den Warenkorb mit denselben Funktionen nach, die sie prüfen sollen.
Nebenbei schließt die Gegenprobe eine Lücke, die niemandem aufgefallen war —
**der Kunde sieht nie ein Objekt, er sieht Zeichen**, und den Text hat bis jetzt
kein Testfall angesehen.

**Ergebnis: nichts gefunden.** 3.402 Belege durchgerechnet, dazu 19.440
Warenkörbe für die eine wirklich unabhängige Gleichung. Keine Abweichung. Das
ist ein negatives Ergebnis und steht als solches da.

Wie viel es wert ist, gehört dazu: **Vier der fünf Gleichungen sind nicht
unabhängig** — sie rechnen mit derselben Arithmetik, die den Beleg erzeugt hat,
und finden Fehler beim Rendern, nicht beim Rechnen. Genau das zeigen die
Testfälle, die den Text absichtlich verfälschen. Unabhängig ist nur eine: Brutto
als `netto + gerundete USt` gegen Brutto als `netto × 1,2`. Die beiden können
sich um einen Cent unterscheiden — über 19.440 Warenkörbe tun sie es nicht.

Drei Runden ergeben zusammen ein Muster: 155 grüne Testfälle, während
`demo.html` nicht startete; 213 grüne, während elf Schleifen nichts prüften;
213 grüne, während den Belegtext niemand ansah. **Dreimal half nicht mehr
Sorgfalt, sondern ein Werkzeug, das die Sorgfalt nicht braucht** — und jedes
prüfte eine andere Ebene: Bündel, Testfall, Ausgabe. Ungeprüft bleibt die
oberste: ob die Zahlen zur Wirklichkeit passen. Dagegen hilft nur eine Antwort
von einem Hersteller.

## Was davor dazukam: der Prüfer für die Testfälle

`shop/bin/testpruefung.mjs` sucht Testfälle, die grün laufen und nichts
behaupten. Ausführlich in
[`pruefung-der-testfaelle.md`](./pruefung-der-testfaelle.md).

**Von 213 Testfällen waren 14 verdächtig**, nach Abzug der Fehlalarme elf — und
alle elf aus derselben Kategorie: Schleifen über Listen, deren Länge vorher
nicht zugesichert war. Kein einziger Testfall behauptete gar nichts; der eine
hinter einem `if` versteckte war ein Ausrutscher, kein Muster.

Die elf sind entschärft. Einer ist **begründet abgelehnt** — in
`auftragslauf.test.js` darf `s.braucht` leer sein, weil drei Schritte keine
Voraussetzungen haben. Dafür gibt es die Zeile `// pruefung: begruendet`; sie
steht heute genau einmal im ganzen Bestand.

Der Prüfer ist gegen eine Probedatei nachgewiesen, die alle drei Muster enthält
— sonst wäre er selbst ein Testfall, der nichts prüft. Er läuft **nicht** bei
`npm test` mit: Ein Verdacht, der den Testlauf rot färbt, wird binnen einer
Woche stumpf gemacht.

Die Lehre ist dieselbe wie bei der Namenskollision, bei der 155 Testfälle grün
blieben, während `demo.html` gar nicht startete: **Grüne Tests sind eine Aussage
über die Testfälle, nicht über den Code.**

## Was davor dazukam: die Rückwärtsrechnung

`shop/src/verhandlung.js` dreht die Preisrechnung um: Nicht Einkauf plus Marge
ergibt den Verkauf, sondern der marktübliche Verkauf ergibt den nötigen
Einkauf. Ausführlich in
[`verhandlungsziel-konditionen.md`](./verhandlungsziel-konditionen.md).

| Nachlass auf die UVP | nötiger Rabatt für 32 % | für 38 % |
|---|---|---|
| 0 % | 32,0 % | 38,0 % |
| **10 %** | **38,8 %** | **44,2 %** |
| 20 % | 45,6 % | 50,4 % |

**Jeder Prozentpunkt Nachlass kostet mehr als einen Prozentpunkt Rabatt.** Damit
liegt das Verhandlungsziel deutlich über der Gate-2-Schwelle von 35 % — die ist
die Grenze, unter der nichts geht, nicht das Ziel. Der Unterschied ist in
`anschreiben-entwuerfe.md` nachgetragen, samt der Staffel, die ins Anschreiben
gehört: Wer nach einer Zahl fragt, ohne eine zu nennen, bekommt die des
Gegenübers.

Der Rückwärtskatalog liefert dazu je Artikel einen Einkaufszielpreis. Die
Verteilung ist aufschlussreicher als die Höhe: Die vier Drainageartikel liegen
am weitesten daneben, das Zubehör fast auf dem Ziel — derselbe Befund wie die
WARN-Ampel im Funktionsmuster, nur in Euro.

Beim Bauen hat ein Testfall **sich selbst als hohl erwiesen**: Er prüfte die
gruppenweise Zielmarge hinter einem `if`, das wegen eines falschen
Gruppennamens nie zutraf. Ein Testfall, der sich hinter einer Bedingung
versteckt, prüft bei einem Tippfehler gar nichts. Jetzt prüft er zuerst, dass
die Gruppe überhaupt existiert.

## Was davor dazukam: der Auswertungsbogen

`shop/src/auswertung.js` nimmt die Auswertung der zwölf Herstellerantworten
vorweg — vor der Freigabe, wie Gate 17 es verlangt. Ausführlich in
[`auswertungsbogen-hersteller.md`](./auswertungsbogen-hersteller.md).

Beim Bauen ist ein Befund angefallen, der die Schwelle in Gate 2 in ein anderes
Licht rückt. Der Verkaufspreis ist bei der UVP gedeckelt, also ist der
Händlerrabatt zugleich die Obergrenze der Rohmarge. Gegen die 32 % aus Gate 1
gerechnet bedeutet das:

| Rabatt | möglicher Nachlass auf die UVP |
|---|---|
| 32 % | **0,0 %** |
| 35 % | 4,4 % |
| 38 % | 8,8 % |

**Die „≥ 35 %" aus Gate 2 sind kein Puffer, sondern 4,4 Prozentpunkte
Preisspielraum.** Der Wert 38 % aus Phase 2 bekommt damit eine zweite
Begründung: Erst dort wird Preiswettbewerb überhaupt möglich. Kein neues Gate —
die Schwelle ist nicht falsch, nur enger, als sie aussieht.

Für die Planung zählt der **schwächere** der beiden besten Zusagen, weil beide
Sortimentsteile gebraucht werden. Die Spanne zwischen der besten und der
schlechtesten noch zulässigen Antwort beträgt **500 Besucher im Monat**, knapp
28 %. Damit ist erstmals beziffert, worum es bei den zwölf Anfragen geht.

Was nicht beantwortet wurde, gilt im Bogen als **nicht zugesagt** — Schweigen
zur Fracht ist keine kalkulierbare Frachtregelung.

## Was davor dazukam: die Empfindlichkeitsrechnung

`shop/src/empfindlichkeit.js` verschiebt jede der vier tragenden Annahmen
einzeln um zehn Prozent ins Ungünstige und misst die Wirkung auf den
Besucherbedarf. Ausführlich in
[`empfindlichkeit-der-annahmen.md`](./empfindlichkeit-der-annahmen.md).

| Annahme | Elastizität |
|---|---|
| Rohmarge | **1,75** (bei 32 % schon 1,96) |
| Warenkorb netto | 1,25 |
| Umsatzquote | 1,11 |
| Werbekostenanteil | 0,50 |

Die Rohmarge ist der stärkste Hebel und **die einzige der vier mit einem
Kipppunkt** — bei 11,6 % fressen Werbung und Gebühren den ganzen Rohertrag.
Beim Warenkorb ist ein zweiter Effekt aufgefallen: Ein kleinerer Warenkorb
schadet zweifach, weil sich der Fixbetrag der Zahlungsgebühr auf weniger
Warenwert verteilt.

Daraus ein **Zusatz zur Freigabeempfehlung** in `STATUS.md`, kein Widerspruch:
Die Reihenfolgefrage stellt sich nicht, weil die Herstelleranfragen 0 € kosten
und die empfindlichste Größe klären. Nebenbei aufgefallen und dort ergänzt:
Das Keyword-Werkzeug misst das Suchvolumen, **nicht die Umsatzquote** — die
bleibt auch nach dieser Ausgabe eine Annahme.

## Was davor dazukam: das Gesamtkostenbild

`shop/src/kostenbild.js` zieht die Kaskade einmal vollständig durch und dreht
sie dann um. Ausführlich in
[`kostenbild-und-sessionbedarf.md`](./kostenbild-und-sessionbedarf.md).

Am Referenzgebäude bleiben **von 34,2 % ausgewiesener Mischmarge nach Werbung
und Zahlungsgebühr 22,5 %**. Nebeneffekt, den man leicht übersieht: Die Fracht
ist margenneutral, steht aber im Bruttobetrag — man zahlt Zahlungsgebühr auf
durchlaufende Fracht, rund 100 € im Monat.

Der Befund betrifft den Besucherbedarf. `STATUS.md` führte **1.850 Sessions im
Monat**; diese Zahl entsteht ohne Zahlungsgebühren und bei 35 % Rohmarge. Gate 1
lässt aber bis 32 % zu — das ist die Schwelle, nicht die Erwartung. Gerechnet
über beide Achsen liegt der Bedarf zwischen **1.900 und 2.550 Sessions**, je
nach Zahlweg und Marge. Die Spanne steht jetzt in `STATUS.md`.

Kein neues Gate: Der Befund ändert keine Entscheidung, er schärft eine
Planungsgröße. Für die gestufte Einführung des Rechnungskaufs liefert er ein
zweites Argument — er verlangt sieben zusätzliche Bestellungen und 300
zusätzliche Besucher, nur um sich selbst zu tragen.

## Was davor dazukam: die Zahlwege

`shop/src/zahlung.js` sollte nur die Anforderungen an den Zahlungsanbieter
sammeln, die sich über die letzten Bausteine angehäuft hatten. Beim Sammeln kam
heraus, dass die **Kosten nirgends stehen**: Zahlungsgebühren kommen in Phase 3,
4 und 5 nicht vor. Ausführlich in
[`zahlwege-und-gebuehren.md`](./zahlwege-und-gebuehren.md).

Gerechnet auf 24.200 € Umsatz netto und 37 Bestellungen liegen sie zwischen
**0 € (Vorkasse) und 871 € im Monat (B2B-Rechnungskauf)** — letzteres 16,2 %
des Zielgewinns von 5.374 €. Phase 3 trägt jetzt einen Hinweis am Kopf.

Der Prozentsatz trifft härter, als er aussieht, weil die Gebühr auf den
Bruttobetrag fällt und der Deckungsbeitrag nur auf dem Warenwert netto
entsteht: Aus 1,4 % Kartengebühr werden am Referenzgebäude **5,2 % des
Deckungsbeitrags**.

Die eigentliche Spannung liegt woanders. Handwerksbetriebe kaufen auf Rechnung,
der Shop kann aber nicht in Vorleistung gehen — ein Zahlungsziel bände rund
24.000 €, mehr als das gesamte Startbudget. Der Ausweg wäre ein
B2B-Rechnungskauf über einen Anbieter, und genau der ist das Teuerste.
**Entscheidung: gestuft** — EPS und Karte von Anfang an, Rechnungskauf erst,
wenn die Abbruchquote an der Zahlungsauswahl zeigt, dass er gebraucht wird.
Seine Kosten sind sicher, sein Nutzen ist es nicht.

## Was davor dazukam: die Ablage

`shop/src/ablage.js` gibt dem Vorgang eine Form. Ausführlich in
[`ablage-und-nummernkreis.md`](./ablage-und-nummernkreis.md).

Zwei Entwurfsentscheidungen tragen sie. **Die Rechnungsnummer entsteht erst bei
der Ausstellung**, nicht im Warenkorb — sonst verbrennt jeder abgebrochene Kauf
eine Nummer, und die Lücke ist später zu erklären. Und die Ablage wird **nur
ergänzt, nie geändert**: § 131 BAO verlangt, dass der ursprüngliche Inhalt
feststellbar bleibt, also ist ein Storno eine neue Gutschrift und keine
Änderung an der Rechnung.

Dabei ist ein Befund angefallen, der den Zahlungsweg betrifft: **Nachnahme
würde eine Registrierkasse auslösen.** Karten- und Bankomatzahlungen zählen als
Barumsatz, wenn sie vor Ort erfolgen; im Web-Checkout nicht. Bei 650 € Warenkorb
reichen zwölf Nachnahmesendungen im Jahr, um die 7.500-€-Grenze zu reißen.
Nachnahme und Barzahlung sind deshalb ausgeschlossen — als Hinweis in Punkt 7
der AGB-Gliederung, mit Testfall.

Was die Ablage **nicht** ist: eine Speicherung. Sie lebt im Arbeitsspeicher.
Gebaut ist die Form des Vorgangs, nicht seine Aufbewahrung; dafür braucht es
ein Hosting, und das ist freigabepflichtig.

## Was davor dazukam: die UID-Abfrage

`shop/src/vies.js` schließt den Engpass, den der Trockenlauf als einzigen ohne
Freigabe lösbaren benannt hat. Ausführlich in
[`uid-abfrage.md`](./uid-abfrage.md).

Der Kern sind **drei Zustände statt zwei**. Der Dienst der Kommission fällt
regelmäßig aus; ein `MS_UNAVAILABLE` ist keine Aussage über die UID. Eine
ungültige UID sperrt, eine unbestätigte hält nur die automatische Auslösung an
— die Bestellung bleibt bestehen. Ein Ausfall in Brüssel darf keinen Auftrag in
Wels kosten.

Zwei Dinge sind dabei aufgefallen. Ein Testfall hat aufgedeckt, dass die erste
Fassung **jedes Buchstabenpaar** für ein Länderkürzel hielt — aus „keine uid"
wurde ein Land KE. Die Liste steht jetzt ausgeschrieben da, mit den beiden
Fallen darin: Griechenland führt EL statt GR, und XI steht für Nordirland,
während GB nicht mehr dazugehört.

Und eine **Korrektur an meiner eigenen Aussage** von gestern: Die qualifizierte
Bestätigungsanfrage, die als einzige einen vorlegbaren Nachweis liefert,
braucht die eigene UID des Betreibers. Der Code ist fertig, die belegbare
Prüfung nicht.

## Was davor dazukam: der Trockenlauf

`shop/src/auftragslauf.js` lässt den ganzen Auftrag einmal durchlaufen, ohne
etwas auszulösen, und zählt, wo er stehen bleibt. Ausführlich in
[`trockenlauf-auftrag.md`](./trockenlauf-auftrag.md).

Ergebnis heute: **13 Minuten Handarbeit je Bestellung und zwei harte
Blockaden** — Zahlungseingang und Rechnung. Bei 37 Bestellungen im Monat sind
das 8,0 Stunden allein für die Vorgänge, die an einer Bestellung hängen.

Zwei Dinge daran sind neu. Erstens: Die Tabelle in
[`phase6-automatisierung.md`](./phase6-automatisierung.md) übersieht zwei
Schritte — die UID-Abfrage beim EU-System (1,2 h/Monat) und das Einlesen der
Auftragsbestätigung (1,85 h/Monat). Das Szenario „ohne Datenfeed" steigt damit
von 12 auf rund 15 Stunden.

Zweitens, und das ist der eigentliche Befund: **Der Teil, der sich bauen lässt,
ist gebaut.** Von sechs Voraussetzungen sind fünf Verträge, Konten oder Zusagen
Dritter. Nur die Produktdatenschnittstelle ist Arbeit, die hier entstehen kann
— und auch sie setzt voraus, dass ein Hersteller Daten liefert.

## Was davor dazukam: die Belege an den Kunden

`shop/src/beleg.js` schließt die Gegenrichtung: Angebot und Rechnung entstehen
aus demselben Warenkorb wie die Lieferantenbestellungen und können deshalb
nicht von ihnen abweichen. Die Pflichtangaben folgen § 11 UStG mit seinen drei
Betragsschwellen.

Ausführlich in [`beleg-und-reihengeschaeft.md`](./beleg-und-reihengeschaeft.md).
Zwei Befunde daraus gehören hierher, weil sie über den Beleg hinausgehen.

**Streckengeschäft ist Reihengeschäft.** Zwei der drei Lieferanten sitzen in
Deutschland. Liefert ein deutscher Hersteller direkt an die österreichische
Baustelle, sind drei Beteiligte an einer Warenbewegung beteiligt: Die
Eingangsrechnung kommt ohne Umsatzsteuer als innergemeinschaftlicher Erwerb,
die Ausgangsrechnung trägt trotzdem 20 %. Daraus folgt **Gate 19** —
Regelbesteuerung und UID von Anfang an, die Kleinunternehmerregelung ist keine
Option. Jeder Lieferant trägt dafür jetzt ein Feld `land`, und ein Testfall
besteht darauf.

**Ein Fehler im eigenen Bauschritt.** `EUR` war in zwei Modulen deklariert. In
Modulen harmlos, im zusammengefügten `demo.html` ein `SyntaxError` — der die
ganze Seite stilllegt. Die Testfälle blieben grün, weil sie die Module einzeln
laden; aufgefallen ist es erst im Browser. `build-demo.mjs` prüft das Bündel
jetzt selbst auf doppelte Deklarationen und fand beim ersten Lauf sofort eine
zweite Kollision, von der niemand wusste.

## Was davor dazukam: das Rechtstexte-Gerüst

`shop/src/rechtstexte.js` ist **kein Ersatz für Rechtstexte**. Der
Rechtstexteanbieter mit Aktualisierungsdienst für 10–25 € im Monat aus
[`phase5-technik.md`](./phase5-technik.md) bleibt eingeplant. Was das Gerüst
leistet, ist zweierlei.

Erstens die Zuarbeit: Es benennt die dreizehn Pflichtangaben nach § 5 ECG und
§ 14 UGB — also genau die Felder, die der Anbieter oder die Anwältin ohnehin
abfragt. Zwei davon sind bedingt und entfallen ohne Firmenbucheintrag.

Zweitens, und das ist der eigentliche Punkt: Die Lücken sind
**maschinenprüfbar**. Der Shop meldet heute

```
Impressum unvollständig — 11 Pflichtangaben nach § 5 ECG fehlen.
```

statt mit einer leeren Seite online zu gehen. Das Impressum wird gerendert, aber
jede fehlende Angabe steht sichtbar als `[[ Gewerbebehörde — FEHLT ]]` darin.
Eine Vorlage, die Lücken hübsch verschweigt, geht irgendwann versehentlich live;
diese kann es nicht.

Die AGB-Gliederung hat zehn Punkte, und ihr wichtigster ist eine **Auslassung**:
Es gibt keine Widerrufsbelehrung. Der ursprüngliche Plan sah sie noch vor. Sie
gehört ins Verbrauchergeschäft, und eine AGB, die beides vermischt, weckt genau
den Anschein, den Gate 7 vermeiden soll — dass sich der Shop eben doch an
Verbraucher richtet. Ein Testfall prüft die Gliederung deshalb auf das Fehlen
von „Widerruf" und „Rücktrittsrecht".

Dazu eine Aufstellung, was der reine B2B-Verkauf spart und was er nicht spart.
Entfallen: Widerrufsbelehrung samt Musterformular, die Verlängerung der
Rücktrittsfrist auf zwölf Monate und vierzehn Tage bei fehlerhafter Belehrung,
der Hinweis auf die Streitbeilegungsplattform. Es bleiben: Impressum,
Datenschutzerklärung, Preisangaben mit gesonderter Umsatzsteuer — und der
wirksame Ausschluss von Verbraucherbestellungen, ohne den Verbraucherrecht
trotzdem gilt. Die Ersparnis ist real, sie ist nur keine Sorglosigkeit.

## Was davor dazukam: der Messwert-Einordner

`shop/src/messwert.js` setzt die Vorgabe aus
[`messwert-einordnung.md`](./messwert-einordnung.md) um: drei Bänder, der
Sonderfall Kurzzeitmessung, und die drei Grenzen, die mit jeder Ausgabe
hinausgehen statt im Impressum zu stehen.

Bemerkenswert daran ist der Testfall, der auf Gesundheits- und Risikovokabular
prüft. Er ist beim ersten Lauf **an einer eigenen Formulierung gescheitert**:
Der Satz „keine Grenze zwischen unbedenklich und gefährlich" verneint zwar eine
Risikoaussage, borgt sich dafür aber deren Vokabular. Statt die Prüfung zu
lockern, ist der Satz umformuliert — „keine naturwissenschaftliche Schwelle"
sagt dasselbe, ohne das Feld zu betreten.

Der Einordner liefert außerdem `istQualifizierterAnlass`. Das ist genau die
Bedingung aus dem Leadmodell: ein Wert über dem Referenzwert **aus einer
Langzeitmessung**. Ein Kurzzeitwert von 900 Bq/m³ qualifiziert keinen Lead,
auch wenn die Zahl hoch aussieht.

## Was davor dazukam: die Bestellstrecke

`shop/src/kunde.js` prüft die Bestelldaten und setzt damit Gate 7 um — nicht
als Hinweis im Kleingedruckten, sondern als Bedingung: Ohne Firmendaten, UID
und ausdrückliche Unternehmerbestätigung kommt keine Bestellung zustande.

Die UID-Prüfziffer wird gerechnet, aber **nur als Warnung** ausgegeben.
Verbindlich ist allein die Abfrage beim EU-Informationsaustauschsystem, und die
braucht Netz. Ein Validator, der eine gültige UID zurückweist, richtet mehr
Schaden an als gar keiner — deshalb Format hart, Prüfziffer weich.

Die Strecke endet bewusst vor der Zahlung. Statt eines Zahlungsknopfs steht dort
der tatsächliche Zustand:

```
Es geht nichts hinaus. Offen sind:
· Zahlung nicht eingegangen
· Katalog enthält Platzhalterpreise — keine echten Konditionen
```

Darunter die Bestellentwürfe, die im Echtbetrieb hinausgingen — je Lieferant
einer. Damit ist der ganze Weg vom Bedarfsrechner bis zur Lieferantenbestellung
sichtbar, ohne dass irgendetwas ausgelöst würde.

## Was davor dazukam: der Materialbedarfsrechner

`shop/src/bedarf.js` macht aus Außenmaßen eine Stückliste und legt sie in den
Warenkorb. Alle Ansätze stehen als benannte Konstanten beieinander —
Überlappung 10 %, Verschnitt 5 %, Aufkantung 30 cm, Rohrabstand 8 m nach
ÖNORM S 5280-2 — und jede Position trägt ihre Begründung mit.

Der Zweck ist nicht Bequemlichkeit, sondern der Vorteil aus
[`phase4-sortiment-und-materialwert.md`](./phase4-sortiment-und-materialwert.md):
Radonfolien gibt es nur rollenweise. Für 12 × 10 m sind 153,2 m² nötig, geliefert
werden 5 Rollen mit 187,5 m² — **18 % Überschuss, den heute niemand vorher
ausweist.**

Ein Nebenbefund daraus, der in die Kalkulation gehört: Der tatsächliche
Warenkorb liegt über dem rechnerischen Materialwert je Quadratmeter, weil die
Rollenbindung aufrundet. Das erklärt, warum das durchgerechnete Referenzgebäude
mit 3.088 € netto am oberen Rand der in Phase 4 genannten Spanne von
1.260–2.955 € liegt statt in ihrer Mitte.

## Der Weg für echte Preise

Bis hierher war der Katalog handgeschrieben. Das ist genau die Art laufender
Arbeit, die der Auftrag ausschließen sollte — eine Preisrunde des Herstellers,
und jemand tippt.

`shop/src/import.js` liest jetzt eine Lieferantenpreisliste als CSV, prüft sie
und vergleicht sie mit dem bisherigen Katalog. Der Vergleich meldet
Neuzugänge, entfallene Artikel und Preisänderungen mit Prozentsatz — die
monatliche Pflegearbeit aus `phase6-automatisierung.md` erledigt sich damit
beim Einlesen.

**Streng, wo Raten teuer wäre.** Doppelte Artikelnummern, unlesbare Zahlen und
Einkaufspreise über UVP sind Fehler, keine Warnungen; solange einer offen ist,
wird nichts geschrieben. Artikel unter 32 % Marge werden übernommen und
gewarnt: Gate 1 ist eine Entscheidungsgrundlage, keine Eingabesperre.

## Die Sperre, die den Shop ehrlich hält

Nur Zeilen mit echtem Einkaufspreis bekommen `ekQuelle: "bestaetigt"`. Daran
hängt `darfAutomatischAusgeloestWerden`: Solange ein Platzhalter im Warenkorb
liegt, geht keine Bestellung hinaus.

Beim Bauen des Imports ist mir am eigenen Werkzeug ein Loch aufgefallen: Die
Musterpreisliste unter `beispiel/` enthält erfundene Einkaufspreise. Wäre sie
mit `--schreiben` übernommen worden, hätte der Shop erfundene Konditionen für
bestätigt gehalten — und die Sperre wäre weg gewesen, ohne dass es auffällt.
Dateien unter `beispiel/`, `muster/` oder `demo/` lassen sich deshalb nicht
schreiben.

## Was jetzt ohne weiteres Programmieren funktioniert

Sobald eine echte Preisliste eintrifft:

```
npm run import -- <lieferantId> preisliste.csv             # prüfen
npm run import -- <lieferantId> preisliste.csv --schreiben # übernehmen
npm run build
```

Danach stehen echte Preise im Katalog, die Margenampel zeigt die wahre Lage,
und die Bestellsperre fällt für die betroffenen Artikel weg.

## Was weiterhin nur der Auftraggeber liefern kann

| Fehlt | Warum |
|---|---|
| Echte Einkaufspreise | Händlervertrag; Freigabe für die zwölf Anfragen, 0 € |
| Firmendaten fürs Impressum | elf benannte Pflichtangaben, siehe oben; dann Rechtstexte-Abo 10–25 €/Monat |
| Zahlungsanbieter | Geschäftskonto auf eine reale Firma |
| Domain und Hosting | 35–105 €/Monat |
| UID-Prüfung im Bestellprozess | Auflage aus Gate 7, vor der ersten echten Bestellung |

## Nächste Bausteine, wenn weiter gebaut wird

Nach Nutzen geordnet, alle ohne Freigabe und ohne Ausgabe machbar:

1. **Gebietsabfrage, Vollausbau** nach `phase10-datengrundlage-gebietsabfrage.md`
   — braucht die Gemeindeliste aus Anlage 1 RnV. RIS und der Geoserver sind aus
   dieser Umgebung weiterhin nicht erreichbar; zuletzt geprüft am 16. August.
   Die Vorsorgegebiets-Ebene ist seit dem 16. August als Zwischenlösung gebaut
   (`gebiet.js`, Negativliste); offen sind die Schutzgebiets-Stufe und die
   Gegenprüfung der Bezirksliste am Verordnungstext.
2. **CSV nach RFC 4180**, sobald ein Lieferant seine Schnittstelle benannt hat.
   `csvFeld()` ersetzt heute Semikolon und Zeilenumbruch, statt das Feld zu
   quoten; das erhält die Zeile, aber nicht den Inhalt. Solange kein Format
   feststeht, ist die gröbere Regel die robustere — siehe
   [`gegenprobe-bestellung.md`](./gegenprobe-bestellung.md). Hängt an einer
   Herstellerantwort, also an der ausstehenden Freigabe.
