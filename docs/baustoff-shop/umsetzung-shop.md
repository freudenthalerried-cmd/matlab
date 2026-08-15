# Umsetzung — Baustand des Shops

Stand: 2026-08-15. Fortlaufendes Bauprotokoll, keine Analyse. Gate 18 bleibt
unberührt: Die Analysephase ist geschlossen, gebaut wird trotzdem.

Quelltext unter `shop/`, veröffentlichtes Funktionsmuster:
[claude.ai/code/artifact/c40fd35f…](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8)

## Baustand

| Baustein | Stand | Testfälle |
|---|---|---|
| Preis- und Margenrechnung | fertig | 8 |
| Frachtrechnung je Lieferant | fertig | 4 |
| Warenkorb mit Lieferantenaufteilung | fertig | 6 |
| Bestellübergabe als Text und CSV | fertig | 4 |
| Freigabesperren (Gate 6, Gate 7) | fertig | 3 |
| Preislisten-Import | fertig | 14 |
| Materialbedarfsrechner | fertig | 11 |
| Bestellstrecke mit Gate-7-Prüfung | fertig | 11 |
| Messwert-Einordner | fertig | 10 |
| Rechtstexte-Gerüst | fertig | 11 |
| Angebot und Rechnung an den Kunden | fertig | 15 |
| Trockenlauf des Auftrags | fertig | 12 |
| UID-Abfrage beim EU-System | fertig, ungeprüft am Dienst | 17 |
| Oberfläche als eine Datei ohne Abhängigkeiten | fertig | headless geprüft |
| **Summe** | | **123, alle grün** |

## Was zuletzt dazukam: die UID-Abfrage

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

1. **Gebietsabfrage** nach `phase10-datengrundlage-gebietsabfrage.md` — braucht
   die Gemeindeliste. RIS und der Geoserver sind aus dieser Umgebung weiterhin
   nicht erreichbar; zuletzt geprüft am 15. August.
2. **Ablage der Vorgänge** — jede UID-Abfrage erzeugt eine Belegzeile, jede
   Bestellung einen Entwurf, jede Rechnung eine Nummer. Bisher entsteht all das
   und verschwindet wieder. Eine schlichte, dateibasierte Ablage mit
   fortlaufender Nummernvergabe würde daraus einen nachvollziehbaren Vorgang
   machen — und die fortlaufende Rechnungsnummer ist ohnehin Pflicht nach
   § 11 UStG. Braucht keine Freigabe und keine Ausgabe.
