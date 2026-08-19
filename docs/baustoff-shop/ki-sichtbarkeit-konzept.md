# Sichtbarkeit in KI-Antworten: Konzept

Stand: 2026-08-18. Weisung des Auftraggebers: Der Shop — oder ein
Parallelshop — soll so gebaut sein, dass er von KI-Assistenten genannt
wird, wenn jemand nach Baustoffen, Preisen oder einem Lieferanten in
Österreich fragt. Dieses Dokument ist die Denkarbeit dazu; **gebaut wird
nächste Woche**, gekauft und versendet wurde nichts.

## Die Einschätzung vorweg

Der Auftraggeber hält das für einen großen künftigen Anwendungsfall. Das
teile ich, mit einer Einschränkung, die den Plan aber eher stützt als
schwächt.

**Was dafür spricht:** Bei einer Empfehlungsfrage nennt ein KI-Assistent
typischerweise **zwei bis drei Anbieter**, nicht zehn blaue Links. Wer
dort vorkommt, hat eine Stellung, die im klassischen Suchergebnis zehn
Plätze kostet. Und der Kanal ist noch nicht besetzt: Der
österreichische Baustoffhandel ist auf Filialgeschäft und Katalog-PDF
gebaut, nicht auf Maschinenlesbarkeit.

**Was dagegen spricht — und weshalb es trotzdem geht:** Man kann sich
nicht in eine KI-Antwort einkaufen wie in eine Anzeige. Die Systeme
suchen nach überprüfbaren, konsistenten, extern bestätigten Angaben.
Genau das lässt sich aber herstellen — es ist Arbeit an der Substanz,
nicht an der Fassade. Für einen kleinen, ehrlichen, regional
liefernden Händler ist das eine **bessere** Ausgangslage als das
klassische SEO-Rennen gegen Konzerne mit Budget.

## Vier Wege, auf denen eine KI zu einem Shop kommt

Sie funktionieren verschieden und sind verschieden stark beeinflussbar.
Wer sie vermengt, optimiert an der falschen Stelle.

| Weg | Wie es läuft | Beeinflussbar |
|---|---|---|
| **1. Produktfeed / Agentic Commerce** | Der Händler liefert seinen Katalog strukturiert an den KI-Anbieter; die KI zeigt Produkt, Preis, Verfügbarkeit direkt in der Antwort, teils mit Kauf im Chat | **hoch** — technische Bringschuld, aber mit Eignungskriterien |
| **2. KI-Suche mit Live-Abruf** | Der Assistent sucht im Web und liest Seiten, die er zitiert (eigene Such-Crawler, getrennt von den Trainings-Crawlern) | **hoch** — hängt an Zugänglichkeit, Struktur, Klarheit |
| **3. Trainingswissen** | Das Modell „weiß" von einem Anbieter aus seinen Trainingsdaten | **niedrig und langsam** — folgt der Drittquellenlage, nicht der eigenen Website |
| **4. Agent besucht die Seite selbst** | Ein Agent im Auftrag eines Nutzers öffnet den Shop, sucht Preise, legt in den Warenkorb | **hoch** — hängt daran, ob die Seite ohne Maus bedienbar ist |

Die Prioritätenfolge für ein Vorhaben dieser Größe: **2 und 4 zuerst**
(kosten nichts als Bauarbeit und wirken auf alle Anbieter gleichzeitig),
**1 sobald der Shop echte Preise und eine Rechtsform hat**, **3 als
Nebenertrag** von Weg 2 über die Jahre.

## Weg 2 und 4: was der Shop technisch mitbringen muss

**Zugang trennen, nicht pauschal sperren.** Trainings-Crawler und
Such-Crawler sind heute getrennte Benutzerkennungen. Wer alles sperrt,
verschwindet auch aus den Antworten; wer alles erlaubt, gibt auch
Trainingsmaterial her. Die Entscheidung gehört bewusst getroffen und
in `robots.txt` sauber ausgedrückt — für einen Shop, der gefunden
werden will, spricht alles dafür, die **Such**-Crawler ausdrücklich
zuzulassen. (Die Trainingsfrage ist eine Geschmacksfrage ohne
unmittelbare Wirkung auf die Sichtbarkeit.)

**Preise müssen im HTML stehen, nicht im JavaScript und nicht im PDF.**
Das ist der häufigste Grund, weshalb Baustoffhändler in KI-Antworten
nicht vorkommen: Der Preis erscheint erst nach Anmeldung, nur auf
Anfrage oder in einem Katalog-PDF. Was eine Maschine nicht lesen kann,
existiert für sie nicht. Der bestehende Bau ist hier im Vorteil — er
rendert serverseitig aus einem geprüften Rechenkern.

**Strukturierte Auszeichnung je Artikel** (Schema.org `Product` mit
`Offer`): Preis, Währung, Verfügbarkeit, Zustand, Artikelnummer,
Hersteller, **Versandkosten und Liefergebiet**, Rückgaberegelung. Die
Versand- und Gebietsangaben sind für dieses Vorhaben der wichtigste
Teil, weil die Lieferung regional begrenzt ist — dazu unten mehr.

**Eine Seite je Artikel, dauerhaft unter derselben Adresse.** Ein Zitat
ist nur so gut wie die Adresse, unter der es steht.

**Antwortfähige Seiten statt Werbetexte.** Eine Seite, die die Frage
„Was kostet Spachtelmasse und wann ist sie da?" in den ersten Zeilen
beantwortet, wird zitiert; eine Seite, die mit „Ihr kompetenter Partner
für Bauqualität" beginnt, nicht. Das ist keine Stilfrage, sondern
Mechanik: Der Assistent sucht die Passage, die die Frage beantwortet.

**Maschinenbedienbarkeit (Weg 4):** echte Formularelemente,
Beschriftungen, kein Kaufabschluss, der nur mit Maus und Hover
funktioniert. Der bestehende Shop erfüllt das bereits weitgehend.

**`llms.txt`** — eine kurze Wegweiser-Datei im Wurzelverzeichnis — kostet
eine Stunde und schadet nicht. Ehrlich dazu: Es gibt **keinen Beleg**,
dass die großen Anbieter sie derzeit für Auswahl oder Zitat verwenden.
Sie wird gemacht, weil sie billig ist, nicht weil sie wirkt.

## Vertrauen — die eigentliche Frage

Vertrauen entsteht bei diesen Systemen aus drei Dingen, und keines
davon lässt sich auf der eigenen Website behaupten.

**1. Konsistenz der Entität.** Firmenname, Rechtsform, Adresse, UID,
Firmenbuchnummer und Telefonnummer müssen **überall identisch** sein:
Impressum, Firmenbuch, WKO-Verzeichnis, Google-Unternehmensprofil,
Lieferantenverzeichnisse. Ein Assistent, der drei Schreibweisen
derselben Firma findet, hat drei schwache Entitäten statt einer
starken. Das ist der billigste und meistvernachlässigte Hebel — und er
setzt voraus, dass die Firmendaten endlich vorliegen (sie fehlen
weiterhin).

**2. Bestätigung von außen.** Erwähnungen, die nicht vom Händler selbst
stammen: Branchenverzeichnisse, Kammer-Einträge, regionale Fachmedien,
Bewertungen echter Kunden, Partnerbetriebe, die den Shop nennen.
Erwähnungen **ohne Link** zählen hier mit, wenn sie die Firma klar
einordnen. Das lässt sich nicht schreiben, nur verdienen — und es ist
der Grund, weshalb die ersten echten Geschäfte mehr für die
KI-Sichtbarkeit tun als jede Optimierung.

**3. Überprüfbarkeit und Widerspruchsfreiheit.** Jede Angabe, die
nachprüfbar ist und stimmt, ist ein Vertrauenssignal; jede, die
widerlegt wird, ist teurer als das Schweigen. Konkret: Preis mit
Stand-Datum, tatsächliche Lieferzeit, echte Verfügbarkeit, ein
Liefergebiet, das auch stimmt. Ein Shop, der „lieferbar in 24 Stunden"
behauptet und in fünf Tagen liefert, wird von Bewertungen eingeholt —
und die liest der Assistent auch.

**Was ausdrücklich nicht getan wird:** versteckte Anweisungen an
KI-Bots im Seitenquelltext, für Bots anders ausgelieferte Inhalte,
gekaufte Bewertungen, erfundene Zertifikate. Das fliegt auf, und
Vertrauen ist bei diesen Systemen der einzige Rohstoff, den man nicht
nachkaufen kann. Der bisherige Bau hat diese Linie durchgehalten
(Platzhalterpreise werden als solche ausgewiesen und blockieren die
Auslösung) — sie gilt hier weiter.

## Der regionale Zuschnitt ist ein Vorteil, kein Nachteil

Die Weisung sieht Lieferung „im umliegenden Bereich" vor, nicht
österreichweit. Für KI-Sichtbarkeit ist das gut:

- Bei **„Baustoffe Österreich"** konkurriert der Shop mit
  Konzernen und verliert.
- Bei **„Wer liefert Spachtelmasse nach [Bezirk]?"** ist das Feld
  dünn besetzt, und ein Anbieter mit ausdrücklich deklariertem
  Liefergebiet ist die beste verfügbare Antwort.

Das setzt voraus, dass das Liefergebiet **maschinenlesbar deklariert**
ist — als Liste von Bezirken oder Postleitzahlbereichen in der
strukturierten Auszeichnung, nicht als Satz auf der Versandseite. Und
es verlangt eine Aussage, die eine Maschine wiedergeben kann:

> „Baustoffe zu Baumeister-Einkaufspreisen, Lieferung in die Bezirke
> A, B, C, Versandkosten X, Lieferzeit Y."

Das ist zitierfähig. „Bester Service seit Jahren" ist es nicht.

## Ein Shop oder ein Parallelshop?

Der Auftraggeber hat beides zur Wahl gestellt. **Meine Empfehlung: ein
Shop.** Begründung:

- Zwei Shops sind zwei Entitäten, und Vertrauenssignale teilen sich
  auf statt sich zu addieren — genau das Gegenteil dessen, was Punkt 1
  oben verlangt.
- Nahezu identische Kataloge auf zwei Adressen sehen für Such- und
  KI-Systeme nach Manipulation aus.
- Doppelte Pflege bei einem Ein-Personen-Vorhaben ist der sicherste
  Weg zu widersprüchlichen Preisen — und Widerspruch ist der teuerste
  Fehler in diesem Kanal.

Was sinnvoll ist statt eines zweiten Shops: **eine zweite Ausgabeform
desselben Shops.** Dieselben Daten, zusätzlich als strukturierter Feed
und als maschinenlesbare Seiten. Der bestehende Bau ist dafür gemacht —
er rendert Katalog, Preise und Belege bereits aus einem einzigen
geprüften Rechenkern; eine weitere Ausgabeform ist ein Bauteil, kein
zweites Vorhaben.

## Weg 1: der Produktfeed — was er verlangt

Für die direkte Aufnahme in die Einkaufsfunktionen der KI-Anbieter
gelten technische Anforderungen, die vor dem ersten echten Preis nicht
erfüllbar sind, aber den Katalogaufbau schon jetzt lenken sollten:

- **Eindeutige Artikelkennungen** (GTIN/EAN, herstellerseitige
  Artikelnummer). Das gehört in die Herstelleranfragen — es ist
  bislang **nicht** unter den vier Gate-2-Bedingungen und sollte
  ergänzt werden.
- **Logistikdaten je Artikel**: Gewicht, Maße, Liefergebiete,
  Versandkosten. Der bestehende Frachtrechner liefert die Kosten
  bereits je Lieferant — die Artikelmaße fehlen.
- **Häufige Aktualisierung** von Preis und Verfügbarkeit, in
  Formaten wie JSONL, CSV oder TSV.
- Die Spezifikationen sind **jung und in Bewegung** (die
  OpenAI-Fassung trägt Stand 30. Jänner 2026); die Anbieter haben
  Eignungskriterien, die kleine Händler nicht automatisch erfüllen.
  Deshalb: Feed als Ziel bauen, nicht als Voraussetzung planen.

## Wie man merkt, ob es wirkt

Ohne Messung ist das alles Glaube. Zwei Messungen, beide billig:

1. **Serverprotokoll** auf die Kennungen der KI-Crawler auswerten —
   kommen sie, wie oft, welche Seiten. Das beantwortet die Frage
   „erreichbar?" faktisch statt vermutend.
2. **Feste Testfragen** an die Assistenten, monatlich gleich gestellt
   und protokolliert („Wer liefert Spachtelmasse nach …?"). Die
   Fragen werden **vorab** festgelegt und nicht nachträglich passend
   formuliert — dasselbe Prinzip wie bei den bisherigen
   Auswertungsregeln (Gate 17). Daraus wird ein Werkzeug wie die
   bestehenden: Regel vorher, Vortrag nachher.

## Was nächste Woche zu tun ist, in dieser Reihenfolge

1. Rechnungen einlesen, Katalog mit echten Preisen aufbauen
   (`auftrag-baumeisterpreise.md`) — **ohne Preise ist alles hier
   gegenstandslos.**
2. Liefergebiet beziffern (Bezirke oder Umkreis) und maschinenlesbar
   hinterlegen.
3. Artikelseiten mit strukturierter Auszeichnung, serverseitig
   gerendert, Preis im HTML.
4. `robots.txt` mit bewusster Trennung Suche/Training, `llms.txt` als
   billige Beigabe.
5. Entitätsdaten vereinheitlichen — sobald Firmendaten vorliegen.
6. Messwerkzeug für die beiden Messungen oben.
7. Produktfeed vorbereiten, sobald Artikelkennungen und Rechtsform da
   sind; GTIN/EAN in die Herstelleranfragen aufnehmen.

## Quellen dieser Runde

- Produktfeed-Anforderungen und Formate: OpenAI-Entwicklerdokumentation
  zum Agentic-Commerce-Produktfeed (Spezifikationsstand 30.01.2026),
  Agentic Commerce Protocol, Händlerleitfäden (lengow.com, alhena.ai,
  retail-q.com).
- Getrennte Crawler für Training und KI-Suche, `robots.txt`- und
  `llms.txt`-Praxis 2026: dataimpulse.com, capston.ai, okara.ai,
  kulbhushanpareek.com, vanguardmedia.ca.
- Auswahl- und Vertrauenslogik der Assistenten, Bedeutung von
  Drittquellen und lokalen Einträgen: ki-sichtbarkeit.net,
  traffic3.net, jungniemeyer.de, agency28.eu, it-daily.net.
