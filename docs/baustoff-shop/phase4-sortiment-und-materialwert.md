# Phase 4 — Sortiment und Materialwert je Gebäude

Stand: 2026-08-14. Angriff auf die zweitschwächste Zahl des Modells, ohne
Freigabe, ohne Ausgabe und ohne Kontakt zu Dritten.

In [`phase3-unit-economics.md`](./phase3-unit-economics.md) steht der
Materialwert je Gebäude mit 400–1.500 € und der Konfidenz **niedrig**,
Begründung „Schätzung, unbelegt". Diese Zahl entscheidet, ob das Umsatzziel
1,4 % oder 7 % Marktanteil bedeutet — also über die Machbarkeit. Sie lässt sich
nicht durch Nachdenken belegen, wohl aber durch eine **Stückliste mit
öffentlichen Listenpreisen**. Das ist hier geschehen.

## Methode und ihre Grenzen

Erhoben über Websuche. Der direkte Abruf von Händlerseiten ist durch die
Netzwerk-Policy blockiert, eine systematische Preiserhebung über 40 Artikel war
deshalb nicht möglich — das ist dieselbe Einschränkung wie in Phase 1.

Was daraus folgt:

- Preise sind **Listen- und Endkundenpreise**, überwiegend aus dem deutschen
  Markt. Sie sind die Obergrenze, nicht der Einkauf.
- Einzelne Treffer waren unbrauchbar und wurden verworfen. Beispiel: ein
  Sickerrohr DN100 zu 58,32 €/m — das ist ein Quellfassungsrohr in
  Trinkwasserqualität, nicht das Drainagerohr der ÖNORM S 5280-2. Ein solcher
  Wert hätte die Stückliste um den Faktor zehn verfälscht.
- Die Mengen des Referenzgebäudes sind aus den Verlegevorgaben der Norm
  abgeleitet, nicht aus einer realen Ausschreibung.

Die Stückliste ist damit **belastbarer als eine Schätzung und schwächer als ein
Angebot**. Die Herstelleranfragen aus
[`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md) bleiben nötig.

## Referenzgebäude

Einfamilienhaus, Bodenplatte rund 120 m², erdberührte Aufenthaltsräume,
Vorsorgetyp B nach ÖNORM S 5280-2 — gasdichte Ausführung der erdberührten
Bauteile plus nachrüstbare Radondrainage. Das ist der Regelfall im
Radonvorsorgegebiet und damit der Fall, der das Volumen macht.

Verlegevorgaben der Norm, die die Mengen bestimmen: Drainagerohre mindestens
9 cm, stern- oder schlangenförmig verlegt, Rohrabstand bis 8 m im Kiesbett
beziehungsweise bis 3 m bei Verlegung direkt im Erdreich mit Rohrschutz.

## Stückliste

| Position | Menge | Einzelpreis | Summe | Radonspezifisch? |
|---|---|---|---|---|
| Drainagerohr perforiert DN100 | 30–45 lfm | 2–5 €/m | 60–225 € | ja |
| Formteile, Bögen, Muffen | pauschal | — | 80–200 € | ja |
| Sammel- bzw. Kontrollschacht | 1 Stk | 60–150 € | 60–150 € | ja |
| Steigleitung DN100 inkl. Halterung | 8–12 lfm | 5–10 €/m | 60–150 € | ja |
| Sickerkies | — | — | bauseits | nein, sowieso |
| Radondichte Abdichtung Bodenplatte | 140 m² | 6–12 €/m² | 840–1.680 € | teilweise |
| Primer, Dichtbänder, Manschetten, Ecken | pauschal | — | 150–400 € | teilweise |
| Radondichte Mehrspartenhauseinführung | 1 Stk | 750–865 € | 750–865 € | nein, sowieso |
| Ringraumdichtungen für Einzelleitungen | 2–5 Stk | 30–120 €/Stk | 60–600 € | teilweise |

Kontrollpunkt: Das Land Oberösterreich beziffert die Materialkosten der
erforderlichen perforierten Rohre mit „in der Regel unter 1.000 €" und die
zusätzliche Arbeitsleistung mit 500–1.000 €. Das Drainagepaket der obigen
Stückliste liegt bei 260–725 € und fügt sich damit in die amtliche Angabe ein.
Die Stückliste ist also nicht offensichtlich falsch kalibriert.

## Der Befund, der wichtiger ist als jede Einzelposition

Ein großer Teil des Materials ist **Sowieso-Material**. Die Abdichtung gegen
Bodenfeuchte ist ohnehin geschuldet; radondicht zu sein ist eine
Produkteigenschaft, kein zusätzliches Gewerk. Und die gas- und
druckwasserdichte Hauseinführung ist seit 2017 ohnehin vorgeschrieben — die
Bauherrenpakete aller großen Hersteller sind bereits radondicht ausgeführt und
geprüft.

Daraus folgen drei verschiedene Warenkörbe, und die Wahl zwischen ihnen ist die
eigentliche Sortimentsentscheidung:

| Korb | Umfang | Spanne | Mitte |
|---|---|---|---|
| **eng** | nur radonspezifisch: Drainagepaket, Dichtbänder, Ringraumdichtungen | 420–1.275 € | ~850 € |
| **mittel** | eng + radondichte Abdichtungsbahn | 1.260–2.955 € | ~2.100 € |
| **weit** | mittel + Hauseinführung | 2.010–3.820 € | ~2.950 € |

Der weite Korb ist eine Illusion. Die Hauseinführung wird beim
Energieversorger-Shop oder beim Stammhändler mitbestellt, oft im
Bauherrenpaket, und sie ist ohnehin radondicht — es gibt keinen Grund, sie bei
einem Spezialisten zu kaufen. Wer sie ins Sortiment nimmt, konkurriert im
Preis, ohne Fachargument. **Der weite Korb wird verworfen.**

Zwischen eng und mittel entscheidet, ob der Betrieb die Abdichtungsbahn beim
Spezialisten oder beim Stammhändler holt. Das Fachargument dafür existiert —
radondichte Bahnen sind ein Nachweisthema, kein Preisthema, und eine
handelsübliche Bitumen-Dampfsperrbahn ist gerade **nicht** radondicht und darf
dafür auch nicht eingesetzt werden. Diese Verwechslung ist der häufigste Fehler
im Feld und damit das stärkste Verkaufsargument des Sortiments.

> **Gate-5-Entscheidung: Sortiment auf den mittleren Korb.** Radonspezifisches
> Kernsortiment plus radondichte Abdichtungsbahnen mit Nachweis; keine
> Hauseinführungen, kein Kies, keine Baustoffe ohne Radonbezug. Begründung: Nur
> Positionen, bei denen die fachliche Auskunft den Kaufausschlag gibt, tragen
> die geforderten 32 % Rohmarge. Alles Übrige ist Preiswettbewerb gegen einen
> regionalen Händler mit Lieferbeziehung, Kreditlinie und Baustellenzustellung —
> ein Wettbewerb, der aus dem Streckengeschäft heraus nicht zu gewinnen ist.

## Was sich damit am Zahlenmodell ändert

### Materialwert je Gebäude

Die Spanne 400–1.500 € war zu weit und im unteren Bereich zu pessimistisch. Für
den beschlossenen mittleren Korb gilt:

```
Materialwert je Gebäude (mittlerer Korb):  1.260–2.955 €,  Planwert 2.100 €
davon konservativ vereinnahmbar, wenn nur das
Kernsortiment gekauft wird:                  420–1.275 €,  Planwert   850 €
```

**Konfidenz: mittel** statt niedrig. Belegt durch Stückliste und amtliche
Kontrollzahl, unbelegt bleibt der Einkaufspreis.

### Marktgröße

Bei 10.000–14.000 Gebäuden mit erdberührten Aufenthaltsräumen pro Jahr und
einer Durchdringung von 60–90 % — die Pflicht ist jung, die Umsetzung noch
nicht flächendeckend:

| Fall | Materialwert | Adressierbares Volumen |
|---|---|---|
| konservativ | 850 € | 5,1–10,7 Mio. € |
| Planfall | 2.100 € | 12,6–26,5 Mio. € |

Das Umsatzziel von 290.000 €/Jahr entspricht damit **1,1–5,7 % Marktanteil**,
gegenüber 1,4–7 % in der bisherigen Rechnung. Die Aufgabe wird nicht leicht,
aber sie wird kleiner — und sie steht erstmals auf einer Herleitung.

### Warenkorb und Bestellzahl — die eigentliche Verbesserung

Der Planungsfall in [`phase3-unit-economics.md`](./phase3-unit-economics.md)
rechnet mit **450 € Ø Warenkorb und 54 Bestellungen im Monat**. Beides ist nach
der Stückliste zu korrigieren: Selbst das enge Kernsortiment liegt bei rund
850 € je Gebäude.

| Ø Warenkorb | Bestellungen für 24.200 €/Monat |
|---|---|
| 450 € (bisherige Annahme) | 54 |
| 650 € (Mischfall mit Teilbestellungen) | 37 |
| 850 € (Kernsortiment je Gebäude) | 29 |
| 2.100 € (mittlerer Korb vollständig) | 12 |

**Neuer Planwert: 650 €, also 37 Bestellungen im Monat.** Bewusst unter dem
Stücklistenwert, weil nicht jede Bestellung ein vollständiges Gebäude ist —
Nachbestellungen, Einzelpositionen und Musterlieferungen drücken den
Durchschnitt.

Das ist eine echte Erleichterung: 37 statt 54 Bestellungen bedeuten bei 2 %
Conversion 1.850 statt 2.700 Sessions im Monat. Die Reichweitenhürde aus
[`content-und-leadgen.md`](./content-und-leadgen.md) sinkt um ein Drittel.

Die Kehrseite gehört dazu: Ein höherer Warenkorb heißt längere
Entscheidungswege, häufigere Vergleichsangebote beim Stammhändler und mehr
Vorfinanzierung je Auftrag. Leichter wird nur die Zahl, nicht der einzelne
Abschluss.

## Fracht — eine vierte Bedingung für Gate 2

Das Sortiment ist durchgehend **Sperrgut**: Drainagerohr kommt als Ringbund,
die Abdichtungsbahn als Rolle mit rund 20 kg, die Abgabe erfolgt bei
Radonfolien ausdrücklich nur rollenweise ohne Teilmengen, und der Versand läuft
per Spedition.

Bei überschlägig 60–150 € Frachtkosten je Baustellenlieferung sind das bei
850 € Warenkorb **7–18 % vom Umsatz** — an einer Rohmarge, die 32 % erreichen
muss. Fracht ist in diesem Modell keine Nebenposition, sondern der Unterschied
zwischen tragfähig und nicht tragfähig.

> **Gate 2 wird um eine vierte Bedingung ergänzt:** Der Hersteller muss eine
> kalkulierbare Frachtregelung bieten — frachtfrei ab einem erreichbaren
> Bestellwert oder ein fester Frachtsatz je Sendung. Eine Zusage „Fracht nach
> Aufwand" macht die Kalkulation unmöglich und zählt wie eine Absage.

Erfreulich: Anschreiben A fragt das in Punkt 4 bereits ab
(„Mindestbestellwert, und ab welchem Auftragswert liefern Sie frachtfrei?").
Der Entwurf muss dafür nicht geändert werden. Neu ist nur, dass diese Antwort
**gleichrangig** mit dem Händlerrabatt zu bewerten ist und nicht als
Nebenauskunft.

## Preisanker des Wettbewerbs

RadonTec vertreibt über radonshop.com die selbstklebende Radonschutzfolie
AlphaBlock 4+ zu 398 € je Rolle, ausschließlich rollenweise, Rollengewicht rund
20 kg, Versand als Sperrgut mit möglichen Zuschlägen. Die Rollenfläche ist
öffentlich nicht ausgewiesen; ohne sie lässt sich kein belastbarer m²-Preis
bilden. Der in der Stückliste angesetzte Korridor von 6–12 €/m² ist deshalb
**abgeleitet, nicht belegt**.

Zwei Dinge sind daran trotzdem verwertbar:

1. Der Wettbewerber verkauft **an Endkunden zu Listenpreisen** und ist damit
   kein Preisbrecher. Ein Fachhandel mit Beratung und B2B-Konditionen hat
   daneben Platz.
2. Die Rollenbindung ohne Teilmengen ist eine **Schwachstelle**: Ein Betrieb,
   der 140 m² braucht und Rollen zu vielleicht 37 m² kaufen muss, zahlt
   Verschnitt. Ein Anbieter mit Stücklistenrechner, der Rollenzahl und
   Verschnitt vorher ausrechnet, löst genau dieses Ärgernis. Das ist ein
   konkreter, prüfbarer Vorteil — kein Marketingversprechen.

Der Materialbedarfsrechner aus
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md) bekommt damit
eine belegte Existenzberechtigung. Er ist nicht nur ein SEO-Einstieg, sondern
die Antwort auf ein reales Problem im Feld.

## Was unbelegt bleibt

| Größe | Stand nach dieser Phase |
|---|---|
| Einkaufspreis / Händlerrabatt | unverändert **unbelegt** — nur Herstelleranfrage hilft |
| m²-Preis radondichter Bahnen | abgeleitet, Rollenfläche nicht öffentlich |
| Rohrmengen je Gebäude | aus Normvorgaben abgeleitet, nicht aus Ausschreibung |
| Durchdringungsgrad 60–90 % | Schätzung, keine Erhebung |
| Frachtsätze 60–150 € | Erfahrungswert, herstellerabhängig |

Die Rohmarge bleibt die einzige Zahl, die keine Recherche ersetzen kann. Alles
andere ist mit dieser Phase von „Schätzung" auf „Herleitung" gehoben.

## Auswirkung auf das Stufenmodell

Keine Änderung an den Stufen selbst aus
[`phase9-meilensteine-und-abbruch.md`](./phase9-meilensteine-und-abbruch.md).
Zwei Zielwerte werden nachgeführt:

| Kennzahl | bisher | jetzt |
|---|---|---|
| Ø Warenkorb Planungsfall | 450 € | 650 € |
| Bestellungen für Zielumsatz | 54/Monat | 37/Monat |
| Sessions bei CR 2 % | 2.700/Monat | 1.850/Monat |

Die Stufenkriterien für Monat 3 und Monat 6 — 150 beziehungsweise 800 Sessions —
bleiben unverändert. Sie waren an der Aufbaugeschwindigkeit bemessen, nicht am
Zielumsatz.

## Quellen

- [Radon Vorsorgemaßnahmen bei Neubauten und Generalsanierungen, Land Oberösterreich](https://www.land-oberoesterreich.gv.at/files/publikationen/us_radon_vorsorge_neubauten_sanierung.pdf)
- [Vorsorgemaßnahmen für Bauverantwortliche, Fachstelle für Radon](https://www.radon.gv.at/en/information-for/construction-experts/precautionary-measures)
- [Vorsorge bei Neubauten, Fachstelle für Radon](https://www.radon.gv.at/en/information-for/citizens/precautions-for-new-buildings)
- [ÖNORM S 5280-2:2021-07-15, Austrian Standards](https://www.austrian-standards.at/en/shop/onorm-s-5280-2-2021-07-15~p2585475)
- [ALPHABLOCK 4+ Radon Schutzfolie, RadonTec](https://radontec.de/ueber-uns/produkte/alphablock-4)
- [AlphaBlock 4+ selbstklebende Radon Schutzfolie, radonshop.com](https://www.radonshop.com/radontec-alphablock4plus-en)
- [Radonfolie zur Abdichtung von Gebäuden gegen Radon, radonshop.com](https://www.radonshop.com/radon-protection-foil)
- [Radondicht auf Bodenplatten: Vedagard AL-E, Baulinks](https://www.baulinks.de/webplugin/2020/1661.php4)
- [Vedagard AL-E ist radondicht, BMI Deutschland](https://www.bmigroup.com/de/ueber-uns/presse-news/vedagard-al-e-ist-radondicht/)
- [Abdichtung gegen Radon, Köster Fachbeitrag](https://www.koester.eu/files/KOESTER-Fachbeitrag-Abdichtung-gegen-Radon.pdf)
- [Bauherrenpakete im Vergleich, mehrsparte.de](https://www.mehrsparte.de/ratgeber/bauherrenpakete-im-vergleich)
- [DOYMA Sortimentspreisliste Quadro-Secura Bauherrenpaket](https://www.doyma.de/fileadmin/data/content/downloads/K-MT-1-514_Sortimentspreisliste_QS_BHP_Gesamt_v5_ANSICHT.pdf)
- [Drainagerohr DN 100 Preisvergleich Österreich, idealo.at](https://www.idealo.at/preisvergleich/Liste/112917197/drainagerohr-dn-100.html)
