# Status und Einstieg

Stand: 2026-08-17. **Dieses Dokument zuerst lesen.** Sechsundsiebzig Arbeitsdateien
sind entstanden, mehrere davon korrigieren einander. Hier steht, was gilt.

Veröffentlichter Bericht:
[claude.ai/code/artifact/3d669d15…](https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c)

Auf Stand 16. August 2026 gebracht: alle neunzehn Gates, die vier Befunde des
Tages (Straßenpreisanker, Händlerplatz, Pflichtgebiet, Bestand), dreizehn
versandfertige Anfragen. Quelldatei im Repo unter `bericht-radon.html`; bei
Widerspruch gilt weiterhin [`gate-register.md`](./gate-register.md).

Lauffähiges Shop-Funktionsmuster:
[claude.ai/code/artifact/c40fd35f…](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8) —
Quelltext und 422 Testfälle unter `shop/`, auf Hohlheit geprüft. Alle Preise sind Platzhalter.
Baustand in [`umsetzung-shop.md`](./umsetzung-shop.md).

## Wo das Projekt steht

**Nichts ist gegründet, verkauft oder eingenommen.** Es gibt keinen Umsatz und
keinen Gewinn. Was existiert, ist eine Machbarkeitsanalyse.

Aus zehn geprüften Baustoffnischen und vier Geschäftsmodellen sind **zwei
Kandidaten** übrig, die beide auf derselben inhaltlichen Grundlage aufbauen —
Radonvorsorge und Bausanierung in Österreich.

| | Radon-Shop | Leadvermittlung Bausanierung |
|---|---|---|
| Nötiger Erlös | 24.200 €/Monat | 5.724 €/Monat |
| Break-even | ~4.714 € (7 Bestellungen) | ~350 € (2–3 Leads) |
| Sessions für Zielgröße | **1.900–2.550/Monat** | ~1.570/Monat, **unter Vorbehalt** |
| Kapital bis erste Einnahme | 2.700 € | < 1.000 € |
| Laufender Aufwand | 6,5–15 h/Monat | 4–6 h/Monat |
| Bestandseffekt | keiner | ja, ab Stufe B |
| Obergrenze | offen nach oben | ~8.000–12.000 €/Monat |
| Engpass | Rohmarge | Lead-Quote der Feuchtethemen |
| Zeit bis erstem Erlös | Wochen | Wochen über Strecke 1 und Gruppe C |
| Zeit bis Ziel | 18–30 Monate | ähnlich, geringeres Kapitalrisiko |

Beide erreichen 3.000 € netto nur, wenn die Annahmen halten. Die schwächsten
sind unten benannt.

## Die Modellwahl ist vertagt — begründet

Drei Bedingungen stehen gegeneinander und sind nicht gleichzeitig zu haben:

| Verzicht auf | Ergebnis |
|---|---|
| Passivität | Radon-Shop bauen — schnellster Weg zu Umsatz, dauerhafter Aufwand |
| Tempo | Inhalte und Leadvermittlung — geringster Kapitaleinsatz, längerer Anlauf |
| Alleinstellung | in ein besetztes Feld eintreten — Wettbewerb über Preis |

**Empfehlung: Inhalte zuerst.** Sie werden für beide Modelle gebraucht, kosten
wenig und halten die Entscheidung offen, bis die Herstellerkonditionen
vorliegen.

In [`phase9-meilensteine-und-abbruch.md`](./phase9-meilensteine-und-abbruch.md)
ist daraus **Gate 4** geworden: Die Stufen 0 bis 2 sind für beide Modelle
identisch, getrennt wird erst bei der Monetarisierung. Die Wahl fällt am Ende
von Stufe 2 anhand des ersten tatsächlichen Geschäfts — sie ist damit keine
offene Blockade mehr.

## Was als Nächstes gebraucht wird

Zwei Freigaben. Der Arbeitsloop kann keine davon selbst auslösen, zusammen
kosten sie unter 200 €.

| Nächster Schritt | Braucht | Entscheidet | Vorbereitet in |
|---|---|---|---|
| Rohmarge belegen (Stufe 0) | Freigabe für E-Mails an dreizehn Adressaten (zwölf Hersteller, Lagerhaus) | den **Shop** — Gate 1, 2, 6 | `anschreiben-entwuerfe.md`, Zugänge in `adressaten-und-zugaenge.md`, Auswertung per `npm run auswerten` |
| Suchvolumina prüfen (Stufe 1) | Werkzeug für 100–200 €/Monat | **beide Modelle** — Gate 15 | `entscheidungsmatrix.md` |
| Rechtsform, Shop, Inhalte | erst ab Stufe 2, nach den beiden obigen | — | `phase5-technik.md`, `phase8-*` |

Beide Freigaben sind gleichrangig, und sie sollten **zugleich** laufen. Muss
eine zuerst, dann das Keyword-Werkzeug: Es entscheidet über beide Modelle,
während die Herstelleranfragen nur den Shop betreffen.

> **Zusatz vom 15. August**, aus
> [`empfindlichkeit-der-annahmen.md`](./empfindlichkeit-der-annahmen.md): Die
> Reihenfolgefrage stellt sich streng genommen gar nicht. Die
> Herstelleranfragen kosten **0 €** und klären mit der Rohmarge die
> empfindlichste der vier Planungsgrößen — Elastizität 1,75, und als einzige
> mit einem Kipppunkt. Es gibt keinen Grund, eine kostenlose Freigabe auf eine
> kostenpflichtige warten zu lassen. Und: **Das Keyword-Werkzeug misst nicht
> die Umsatzquote**, sondern das Suchvolumen; die 2 % bleiben auch nach dieser
> Ausgabe eine Annahme.

Was welcher Ausgang bedeutet, steht in
[`entscheidungsmatrix.md`](./entscheidungsmatrix.md).

Das Kapitalrisiko bis zur ersten belegten Einnahme liegt im Stufenmodell bei
**2.700 €**, nicht bei den früher genannten 8.000–12.000 €.

## Die Zahlen, auf denen alles ruht

1. **Rohmarge 35 %** — weiterhin **unbelegt**, aber seit 16. August mit
   Straßenpreisanker: Die Leitposition kostet im herstellereigenen Endkundenshop
   398 € **brutto** (~331,67 € netto AT) — unsere Platzhalter-UVP war die
   Bruttozahl. Am VK-Deckel braucht die Bahn 38 % Rabatt auf die Netto-Liste;
   alles hängt an der Bezugsbasis, und die kann nur der Hersteller nennen.
   Unter 32 % fällt die Nische (Gate 3). Zweiter, unabhängiger Anker seit
   16. August: Zertifizierte Radonabdichtung kostet am Markt herstellerübergreifend
   ~10–11 €/m² brutto (Vedagard AL-E ab 10,27 €/m² im klassischen Händlerkanal).
   Siehe `alternativen-ohne-freigabe.md` und `vertriebswege-der-hersteller.md`.
2. **Suchvolumen** — weiterhin **nicht gemessen**. Die Inhaltslandkarte beruht
   auf Plausibilität.
3. **Lead-Quote der Feuchte- und Abdichtungsthemen** — mit 2 % angenommen und
   nach Gate 15 **nicht mehr als Planungsgrundlage** geführt. Das Segment ist von
   vertikal integrierten Franchisesystemen besetzt. Siehe `pruefung-gruppe-c.md`.
4. **Umsetzungsquote der Radonvorsorge** — wird nirgends erhoben, hat aber
   seit 16. August einen Anker: **~2.000 Haushalte/Jahr** nutzen die kostenlose
   AGES-Messung, österreichweit. Der akute Sanierungsmarkt liefert damit
   Hunderte Fälle pro Jahr, nicht Tausende pro Monat — die Sessions müssen aus
   dem Neubau-Pflichtkanal kommen. Der ist seit dem 16. August auch räumlich
   beziffert: fast flächendeckend, ausgenommen Wien und zehn Bezirke
   (darunter Ried im Innkreis); EFH-Kern ~8.000–9.000 Häuser/Jahr. Siehe
   `alternativen-ohne-freigabe.md`, `marktrisiko-neubau.md` und
   `nachfragezahlen-pflichtgebiet-und-bestand.md`.
5. **Materialwert je Gebäude** — ~~reine Schätzung 400–1.500 €~~ hergeleitet:
   1.260–2.955 € für den beschlossenen Warenkorb, Konfidenz mittel — **seit
   16. August als optimistisch markiert**: Alle drei Warengruppen stehen mit
   ihrer Netto-Platzhalter-UVP auf oder über dem Brutto-Straßenpreis, die
   Drainagegruppe Faktor 2 über dem Markt. Siehe
   `strassenpreisanker-sortiment.md` und `phase4-sortiment-und-materialwert.md`.

## Dokumente

### Grundlagen
| Datei | Inhalt |
|---|---|
| `PARAMETER.md` | Festgelegte Vorgaben, Umrechnung netto → vor Steuer, Margenschwelle |
| `README.md` | Ursprüngliche Denkgrundlage. Teilweise überholt, Grundrechnungen gültig |
| `master-prompt.md` | Die ursprüngliche Auftragsfassung. Als Handlungsanweisung überholt |
| `gate-register.md` | **Alle neunzehn Gates an einer Stelle.** Maßgeblich bei Widerspruch |
| `entscheidungsmatrix.md` | **Wie die zwei ausstehenden Prüfungen zu lesen sind.** Vier Ausgänge, vorab festgelegt |
| `zahlenpruefung.md` | Alle zweiundzwanzig Rechenketten nachgerechnet; zwei kleine Fehler benannt |
| `analyse-abgeschlossen.md` | **Gate 18 — die Analysephase ist geschlossen.** Was den Loop wieder aufweckt |
| `umsetzung-shop.md` | **Bauprotokoll des Shops.** Baustand, Sperren, nächste Bausteine |
| `zweite-rechnung.md` | **Der gerenderte Beleg wurde von keinem Testfall geprüft** — 3.402 Belege zurückgelesen, nichts gefunden; wie viel das wert ist |
| `gegenprobe-bestellung.md` | **Ein Zeilenumbruch zerlegte die Bestell-CSV** — behoben; die Bestellung, die Ware bewegt, wird jetzt gegen den Warenkorb zurückgelesen |
| `fremdtext-ein-und-ausgaenge.md` | **Ein Firmenname konnte 999 Rollen bestellen** — behoben; Verzeichnis aller fünf Eingänge und acht Ausgänge für fremden Text |
| `frachtschwelle-und-bestellwert.md` | **Die Frei-Haus-Grenze wurde am Verkaufswert gemessen statt am Einkauf** — behoben; 1.024 Teillieferungen betroffen, Referenzgebäude unverändert |
| `vorgangsklammer.md` | **Ware nach Innsbruck, Rechnung nach Linz** — nichts band die Papiere eines Vorgangs aneinander; behoben, und die Klammer hat zuerst sich selbst verraten |
| `baustelle-als-lieferort.md` | **Eine vierstellige PLZ beweist nicht Österreich** — Lugano, Zürich und Vaduz kamen durch; dazu die Baustelle als eigene Lieferanschrift |
| `ruegefrist-und-baustelle.md` | **Wer auf der Baustelle übernimmt, übernimmt für den Besteller** — § 377 UGB läuft ab Ablieferung; zwei neue AGB-Punkte und Hinweise vor der Bestellung |
| `auftragsbestaetigung.md` | **Geld genommen, bevor ein Vertrag bestand** — AGB Punkt 2 verlangt eine Auftragsbestätigung, die es nicht gab; jetzt vor der Zahlung im Ablauf |
| `margenleck-im-angebot.md` | **Das Angebot nannte den Einkaufswert** — 30 % Handelsspanne in Ziffern, aus einer eigenen Korrektur entstanden; dazu zwei AGB-Befunde |
| `abgleich-versprechen-und-verhalten.md` | **Der Ansprechpartner auf der Baustelle hat nie zugestimmt** — Art. 14 DSGVO; der Abgleich Versprechen gegen Verhalten als Werkzeug statt als Durchsicht |
| `zusicherung-und-ablage.md` | **Was in die Ablage geht, geht für sieben Jahre hinein** — Zusicherung nach Art. 14; Daten Dritter bleiben aus dem unveränderbaren Journal |
| `alternativen-ohne-freigabe.md` | **Die Platzhalter-UVP war der Bruttopreis** — Straßenpreisanker statt Herstellerantwort, AGES-Zahlen statt Keyword-Werkzeug; beide Freigaben bleiben nötig, aber entlastet |
| `strassenpreisanker-sortiment.md` | **Das Drainagerohr kostet am Markt die Hälfte unseres Platzhalters** — die Drainagegruppe kann kein Margenträger sein; die Zange aus Commodity und Hersteller-Direktvertrieb ist vollständig benannt |
| `felder-der-ablage.md` | **Ein eingefrorenes Feld kann nie wahr werden** — das Felderverzeichnis der Ablage; jedes Journalfeld trägt Grundlage oder Beweislast, das tote Feld `storniert` ist entfernt |
| `gedaechtnis-der-ablage.md` | **Erst das Journal, dann der Speicher** — die Ablage überlebt den Neustart als Anhangdatei; auch die Nummernvergabe wird eine Zeile, sonst vergäbe der Neustart Rechnungsnummern doppelt |
| `nachfragezahlen-pflichtgebiet-und-bestand.md` | **Das Pflichtgebiet ist fast ganz Österreich — ausgenommen Wien, zehn Bezirke und damit der Heimatbezirk des Betreibers** — EFH-Kern ~8.000–9.000 Häuser/Jahr; Bestand ~240.000 betroffene Wohnungen, Engpass ist die Messquote |
| `gebietsauskunft-zwischenloesung.md` | **Elf Einträge statt 2.095 Gemeinden** — die Vorsorgegebiets-Auskunft über die Negativliste, als Auskunft mit ausgesprochenen Grenzen statt als Sperre; Schutzgebiets-Stufe bleibt am Verordnungstext blockiert |
| `vertriebswege-der-hersteller.md` | **Die Zange ist kein Branchengesetz** — Vedagard AL-E läuft im klassischen Händlerkanal zum selben m²-Straßenpreis wie die AlphaBlock; die Anschreiben entscheiden über die Marge, nicht mehr allein über die Lieferfähigkeit; ein Großhändler wird dreizehnter Adressat |
| `auswertung-grosshandelsweg.md` | **Ein Einkaufspreis ohne Deckel ist keine Kondition** — der Auswertungsbogen liest jetzt beide Antwortwege; nennt eine Antwort beide, gilt der schlechtere; alle dreizehn Antworten sind am Tag ihres Eintreffens auswertbar |
| `gegenpruefung-bezirksliste.md` | **Sieben von zehn Bezirken bestätigt, Ried amtlich** — die Negativliste der Gebietsauskunft hält der Gegenprüfung stand; der Verordnungstext bleibt die ausständige Instanz, drei Fundstellen für den ersten freien Netzzugang notiert |
| `partnerauswertung.md` | **Machbar ab zwei Bestandenen** — der Partner-Auswertungsbogen; die Fristenlösung braucht je Bezirk zwei genannte Betriebe, der zweithöchste Leadpreis trägt; alle drei 0-€-Auslöser sind jetzt vorab auswertbar |
| `gebuehr-auf-die-fracht.md` | **Die Kaskade widersprach ihrer eigenen Kopfzeile** — die Zahlungsgebühr fällt auch auf die durchlaufende Fracht; vierter Zahlenfehler, vierter in die optimistische Richtung; Kaskade und Einzelbestellung rechnen jetzt auf den Cent gleich |
| `mehrdeutige-zahlen-im-import.md` | **1.234 kann zweierlei heißen — jetzt wird abgewiesen statt geraten** — ein mehrdeutiger Preis hätte echte Katalogdaten still um den Faktor 1.000 geschrumpft; die Importzeile scheitert jetzt sichtbar |
| `belegzeile-fremdfelder.md` | **Dieselbe Regel, bisher ein Drittel der Felder** — die UID-Belegzeile entschärfte nur den Namen; jetzt geht die ganze Zeile durch textZeile, egal welches fremde Feld vergiftet ist |
| `untergrenze-in-der-empfindlichkeit.md` | **Die Elastizität rechnete Betriebspunkte aus, die Gate 1 verbietet** — das nie gelesene Untergrenzen-Feld ist verdrahtet; die Nische fällt an Gate 1 bei 8,6 % Verschlechterung, lange vor dem rechnerischen Kipppunkt |
| `grenze-bei-genau-300.md` | **Genau 300 überschreiten 300 nicht** — die Leadstrecke qualifizierte einen Anlass ohne Überschreitung und schrieb dem Kunden eine falsche Aussage; Grenze und Testfall korrigiert |
| `verschnitt-auf-der-falschen-basis.md` | **22 % über dem Bedarf, nicht 18** — die Verschnitt-Prozentzahl stand auf der gelieferten Fläche statt auf dem Bedarf; und Positionen, die das Sortiment nicht führt, verschwinden nicht mehr stumm aus der Stückliste |
| `verhandlung-geprueft-artefakt-aktuell.md` | **Zehntes Audit ohne Fund** — die Rückwärtsrechnung hält ihrer Erklärung stand; Funktionsmuster-Artefakt auf den Abendstand gebracht; die Audit-Serie braucht ab jetzt neue Eingangsdaten oder einen neuen Prüfwinkel |
| `generalprobe-freigabetag.md` | **Die Kette läuft, bevor es zählt** — fiktive Antworten laufen von Bogen bis Sessionzahl und Leadpreis durch; Gate 17 ist nicht mehr gefolgert, sondern vorgeführt, und die Probe läuft bei jedem npm test mit |
| `auswertung-als-werkzeug.md` | **Der Bogen als Werkzeug, nicht als Testprotokoll** — `npm run auswerten -- <datei>` trägt die Antworten des Freigabetags vor: Bogenvollständigkeit, Prüfung A, Folgen, Partnerrunde; die Beispieldatei ist fiktiv und als solche beschriftet |
| `adressaten-und-zugaenge.md` | **Der dreizehnte Adressat ist das Lagerhaus** — Quester ist im Konkurs (Räumung bis April 2026), BayWa AT verkauft ihre Lagerhaus-Mehrheit; das Lagerhaus führt BMI-Bitumenbahnen inkl. Vedatect; alle zwölf Herstellerzugänge erhoben, sieben mit AT-Sitz |
| `import-riegel-umgangen.md` | **Der Muster-Riegel prüfte das Argument, nicht den Pfad** — aus beispiel/ heraus wären vier erfundene Preise als bestätigt in den Katalog geschrieben worden; Riegel am aufgelösten Pfad, Marker im Dateinamen, Meldung statt Stacktrace |
| `bau-pruefte-nur-den-kern.md` | **Der Wächter bewachte nur den Kern** — Template-Kollisionen, $-Ersetzungsmuster und fehlende Platzhalter passierten den Bau stumm; jetzt parst der Bau das fertige Modulskript mit node --check; Nebenfund: export async function stand seit jeher unentkleidet im Bündel |
| `pruefer-der-pruefer-auditiert.md` | **Eine fremde Länge schirmte hohle Schleifen ab** — die Längenregel des Hohlheitsprüfers band die Zusicherung nicht an die geschleifte Liste; verschärft ohne einen neuen Verdacht im Bestand; die Probedatei liegt jetzt im Repo und der Nachweis läuft bei jedem npm test |
| `pruefung-der-testfaelle.md` | **Grüne Tests sind eine Aussage über die Testfälle, nicht über den Code** — elf hohle Schleifen gefunden und entschärft |
| `verhandlungsziel-konditionen.md` | **Zehn Prozent Nachlass kosten 38,8 % Rabatt** — das Verhandlungsziel liegt über der Gate-2-Schwelle |
| `auswertungsbogen-hersteller.md` | **Genau 35 % Rabatt lassen 4,4 % Preisspielraum** — die Auswertung der zwölf Antworten steht fertig bereit |
| `empfindlichkeit-der-annahmen.md` | **Welche Annahme zuerst gemessen gehört** — die Rohmarge, Elastizität 1,75, als einzige mit Kipppunkt |
| `kostenbild-und-sessionbedarf.md` | **Von 34 % Mischmarge bleiben 22,5 %** — und der Sessionbedarf liegt bei 1.900–2.550, nicht bei 1.850 |
| `zahlwege-und-gebuehren.md` | **Zahlungsgebühren fehlten in der ganzen Rechnung** — 0 bis 16 % des Zielgewinns; Rechnungskauf entspricht der Zielgruppe und ist das Teuerste |
| `ablage-und-nummernkreis.md` | **Nummer erst bei der Ausstellung**, Ablage nur ergänzend; Nachnahme würde eine Registrierkasse auslösen |
| `uid-abfrage.md` | **Drei Zustände statt zwei** — ein Dienstausfall ist keine ungültige UID; Nachweis nur mit qualifizierter Anfrage |
| `trockenlauf-auftrag.md` | **Läuft die Kette ohne Zutun?** Zehn Schritte durchgezählt; zwei Blockaden, 13 Minuten je Bestellung |
| `beleg-und-reihengeschaeft.md` | **Gate 19** — Auslandslieferant macht das Streckengeschäft zum Reihengeschäft; § 11 UStG im Beleg |

### Analysen
| Datei | Kernaussage |
|---|---|
| `phase1-nischen.md` | Radonvorsorge gewählt; Brandschutz und Betoninstandsetzung verworfen |
| `phase2-lieferantenlandkarte.md` | 14 Hersteller kartiert; Empfängerkreis auf zwölf erweitert; Bahn muss 38 % Marge tragen |
| `phase3-unit-economics.md` | Drei Szenarien, Break-even 4.714 €, Zeithorizont 18–30 Monate |
| `phase3b-leadmodell.md` | Leadmodell durchgerechnet: Break-even bei 2–3 Leads; Gate 9 zweistufiges Erlösmodell |
| `phase4-sortiment-und-materialwert.md` | Stückliste, Warenkorb 650 €, 37 Bestellungen; Fracht als vierte Gate-2-Bedingung |
| `phase5-technik.md` | WordPress mit verwaltetem Hosting, weil ohne Neuaufbau erweiterbar |
| `phase6-automatisierung.md` | Vier-Wochen-Test; Gate 6 Produktdaten, Gate 7 reiner B2B-Shop |
| `phase7-inhalte-und-funnel.md` | Inhaltslandkarte, 500 € Landesförderung als Zugmagnet |
| `phase7b-messstrecke.md` | Messung ist kostenlos — Gate 10 Erinnerungsdienst; Sessionbedarf auf 2.550 korrigiert |
| `phase8-rechtsform-steuer.md` | GmbH, sobald anderes Einkommen besteht |
| `phase8-compliance.md` | Messung nur über anerkannte Stelle; FAGG-Fristfalle |
| `phase9-meilensteine-und-abbruch.md` | Fünf Stufen mit Kostendeckel, Kennzahlen und vier harten Abbruchregeln |
| `phase10-datengrundlage-gebietsabfrage.md` | Gebietsabfrage auf Gemeindeebene aus freiem Verordnungstext; Lizenzblocker gelöst |
| `marktrisiko-neubau.md` | Neubau −40 % in zehn Jahren; Gate 12 kehrt die Beweislast um |
| `partnerangebot-leadvermittlung.md` | Gate 13 Bezirke statt 104 Gemeinden; Exklusivität ist die DSGVO-Bauform |
| `messwert-einordnung.md` | Messdauer sechs Monate; Gate 14 — den Motor liefert der Keller, nicht Radon |
| `pruefung-gruppe-c.md` | Gate 15 — der Keller ist von Franchisesystemen besetzt; die zweite Freigabe wird entscheidend |
| `franchise-zeitfenster.md` | Gate 16 — ISOTEC gründet ab H2 2026 in Österreich; die Lücke ist eine Frist |
| `content-und-leadgen.md` | Displaywerbung und Affiliate scheitern an der Reichweite |
| `skalierung-und-passivitaet.md` | Bestandseffekt; digitale Vorlagen fallen durch |
| `segment-arbeitsplatzmessung.md` | Nebenstrecke, kein eigenes Segment |
| `strategie-modellvergleich.md` | Kapitalweg braucht ~900.000 €; enthält überholte Empfehlung |
| `anschreiben-entwuerfe.md` | Drei Anschreiben (Hersteller, Großhändler, Partnerbetriebe), versandfertig, nicht versendet |

### Korrekturen, die im Verlauf nötig waren

Damit niemand einer überholten Aussage folgt:

| Ursprünglich | Korrigiert zu |
|---|---|
| Pflicht nur in 104 Schutzgemeinden | Vorsorgegebiet ist nahezu ganz Österreich; nur die Drainage hängt an den 104 |
| Kein spezialisierter Wettbewerber | RadonTec/radonshop.com existiert, Schwerpunkt aber Sanierung im Bestand |
| Markt 10–25 Mio. € | 4–21 Mio. €; die erste Zahl zählte Wohnungen statt Gebäude |
| Digitale BauKG-Vorlagen empfohlen | Fällt durch Gate 2, Markt besetzt |
| Content-Seite am passivsten und damit erste Wahl | Scheitert an der Reichweite |
| Dosimeter-Verkauf als Funnel-Einstieg | Unzulässig; Vermittlung an anerkannte Messstelle |
| Arbeitsplatz-Messpflicht österreichweit | Nur für spezielle Arbeitsplätze; Frist lief 2022 ab |
| Anlaufverlust 8.000–12.000 € vorab | Gilt nur für „Shop zuerst"; gestuft sind es 2.700 € bis zur ersten Einnahme |
| Modellwahl als offene Blockade | Vertagt auf Ende Stufe 2, weil Stufe 0–2 für beide Modelle gleich sind |
| Ø Warenkorb 450 €, 54 Bestellungen | 650 € und 37 Bestellungen — die Stückliste liegt deutlich höher |
| Materialwert je Gebäude reine Schätzung | Aus Stückliste hergeleitet, amtlich gegengeprüft |
| FAGG-Rücktritt als Hauptrisiko des Shops | Entfällt im reinen B2B-Geschäft; dafür Auflage, Verbraucher wirksam auszuschließen |
| „Unabhängig von meiner Person" als Zielbild | An eine messbare Marke gebunden: Beratungsanfragen je Bestellung ≤ 0,2 |
| Sechs Adressaten für Anschreiben A | Zwölf — mit sechs wäre Gate 0 in 42 % der Fälle gar nicht entscheidbar |
| Messdauer rund drei Monate | Sechs Monate nach Radonschutzverordnung — die tote Zeit verdoppelt sich |
| Strecke 2 mit 0,5–1,5 % Ende-zu-Ende | 0,05–0,45 %; die Spanne war aus den eigenen Teilquoten nicht ableitbar |
| Radon als Mengenquelle des Leadmodells | Den Motor liefern die Feuchtethemen; Radon liefert die Alleinstellung |
| Feuchtethemen als sichere Mengenquelle | Von ISOTEC und GETIFIX besetzt, samt Kostenrechner und Betriebsvermittlung — ungeprüft |
| Österreich als dünn besetzte Chance in Gruppe C | Eine Frist, keine Lücke — ISOTEC gründet ab H2 2026, zuerst Wien, Tirol, Vorarlberg |
| Keyword-Werkzeug als nützliche Ergänzung | Entscheidet über beide Modelle — auch der Shop braucht 1.850 organische Besuche |
| „A entscheidet den Shop, B das Leadmodell" | Zu sauber gezeichnet: A entscheidet nur den Shop, B beide |
| Sessionbedarf Shop 1.850/Monat | 1.900–2.550 — die alte Zahl war der beste Fall: ohne Gebühren und bei 35 % statt der zulässigen 32 % |
| Kostenseite ohne Zahlungsgebühren | 0–871 €/Monat je nach Zahlweg, bis 16 % des Zielgewinns — fehlten in Phase 3, 4 und 5 |
| Restaufwand ohne Datenfeed ~12 h/Monat | ~15 h — UID-Abfrage und Auftragsbestätigung fehlten in der Tabelle, zusammen 3,1 h |
| Deckungsbeitrag 6.050 € | Rechnerisch 6.024 €; die Kaskade ist um 0,4 % zu hoch, aber in die sichere Richtung |
| Break-even ≈ 10–11 Bestellungen | 7 Bestellungen — die Stückzahl stammte aus dem alten Warenkorb von 450 € |
| Margenschwelle 28 % im master-prompt | 32 %, seit die Zielgröße auf netto umgestellt wurde |
| „Bei den Gates anhalten und warten" | Ersetzt durch die Freigaberegeln — Gates werden selbst entschieden |
| Hauff-Technik als Lieferant gelistet | Gestrichen; Hauseinführungen sind nach Gate 5 kein Sortimentsbestandteil |
| Leadmodell braucht 1.270 Sessions | ~2.550 — der Weg der noch nicht Gemessenen war übersprungen |
| Radonkarte als Lizenzrisiko für den Rechner | Die rechtlich entscheidende Liste ist Verordnungstext und damit frei |
| Shop als Standardweg, Leadmodell als Auffangnetz | Gleichrangig; der Bestandsbezug ist das robustere Fundament |
| Inhalte zuerst zur Neubaupflicht | Zuerst Bestandsthemen — sie hängen an keinem schrumpfenden Nenner |
| Partnerbetriebe in den 104 Radonschutzgemeinden | Gebietseinheit ist der politische Bezirk; die 104 bestimmen nur die Ausbaufolge |
| Gebietsexklusivität als reines Verkaufsargument | Zugleich Voraussetzung für eine wirksame Einwilligung — Struktur ab Tag 1, Bezahlung ab Stufe B |
| Leadmodell braucht weniger Reichweite als der Shop | Falsch; es braucht mehr. Break-even- und Kapitalvorteil bleiben |
| Messeinstieg erzeugt einen Kundendatensatz | Nein — die Messung ist kostenlos, also gibt es keine Transaktion |

## Zum Arbeitsloop

Der stündliche Arbeitsloop arbeitet ab, was ohne Entscheidung, Freigabe oder
Geld möglich ist — zuletzt das Stufenmodell in
`phase9-meilensteine-und-abbruch.md`, die Stückliste in
`phase4-sortiment-und-materialwert.md`, die Automatisierungsprüfung, die
Lieferantenlandkarte und die Durchrechnung des Leadmodells. Findet ein
Durchlauf keine solche
Aufgabe mehr, prüft er nur den Stand und endet ohne neue Datei, statt Dokumente
ohne Adressaten zu erzeugen. Sobald eine der beiden Freigaben vorliegt, nimmt er
die eigentliche Arbeit auf.
