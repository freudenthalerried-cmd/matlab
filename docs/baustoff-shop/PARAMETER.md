# Festgelegte Projektparameter

Stand: **2026-10-25**. Diese Werte sind vom Auftraggeber entschieden und nicht
mehr zur Diskussion gestellt. Änderungen nur mit ausdrücklicher Freigabe.

> **Was dieses Datum heißt — seit 14. September 2026.** Es nennt den Tag der
> **jüngsten Weisung** in der Tafel unten, nicht den Tag des letzten Blicks.
> Ein altes Datum heißt hier also „seither nichts" und nicht „niemand hat
> nachgesehen" — und `npm run pruefe-weisungen` hält beides gegeneinander.
>
> Ohne diese Festlegung sagte ein elf Tage altes Datum beides zugleich, und
> wer eine Zeile in die Tafel einfügt, ohne den Kopf mitzuziehen, bliebe
> unbemerkt. Dieselbe Bauart wie `npm run pruefe-stand` für `STATUS.md`, wo
> genau das am 5. September teuer geworden ist: 183 Dateien und sechs Tage
> daneben, im Kopf des Dokuments, das von sich sagt, es sei zuerst zu lesen.

> **Diese Datei rangiert über dem Gate-Register.** Was hier steht, gilt —
> und deshalb ist es teuer, wenn hier etwas Überholtes steht. Am 28. August
> stand hier noch die harte Untergrenze von 32 % Rohmarge aus dem
> Radon-Modell, während der Auftraggeber seit dem 22. August mit eigenen
> Baumeisterpreisen und 25 % Marge kalkuliert. Ein späterer Lauf hätte das
> laufende Modell nach der eigenen obersten Regel verwerfen müssen.
>
> **Am 3. September dasselbe eine Ebene kleiner.** Die Weisungstafel endete am
> 28. August; die Domainweisung vom 31. stand nicht darin, obwohl sie in
> `data/betreiber.json` längst eingetragen war und der Bau sie verwendet.
> **Eine Entscheidung, die nur im Code ankommt, ist im Verzeichnis weiter
> offen** — und wer hier nachliest, was gilt, hätte die abgelöste
> Domainempfehlung gefunden. Diese Tafel ist ab jetzt der Ort, an dem eine
> Weisung des Auftraggebers als Erstes landet.

## Weisungen seit dem 9. August — was jetzt gilt

| Datum | Weisung | Folge |
|---|---|---|
| 22.08. | Eigene **Baumeister-Einkaufspreise** aus den Lieferantenrechnungen als Kalkulationsgrundlage, nicht mehr Herstellerkonditionen | Gate 1 und Gate 2 sind gegenstandslos, siehe unten; im Wortlaut in [`auftrag-baumeisterpreise.md`](./auftrag-baumeisterpreise.md) |
| 22.08. | Vertrieb über **Google Shopping**, Lieferung **regional** statt österreichweit | Liefergebiet: Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land (Gate 23) |
| 22.08. | Der Shop soll **von KI-Assistenten genannt** werden, wenn jemand nach Baustoffen, Preisen oder einem Lieferanten in Österreich fragt | Das Konzept steht in [`ki-sichtbarkeit-konzept.md`](./ki-sichtbarkeit-konzept.md), gebaut ist es in `src/maschinenlesbar.js`: `llms.txt`, strukturierte Daten je Artikel, getrennte Crawler-Kennungen für Training und KI-Suche. **Bis zum 11. September stand diese Weisung in keiner Zeile dieser Tafel**, obwohl sechs Dokumente sie als Zweck des ganzen Baus nennen |
| 22.08. | „einen shop der **für ki super lesbar** ist und **mehrwert liefert** … schreibe viel content … **richte eigenes team ein**, die die Richtigkeit der Aussagen und Content prüft" | Im Wortlaut in [`inhalte-und-pruefteam.md`](./inhalte-und-pruefteam.md). Das Prüfteam ist kein Team, sondern eine Prüfkette: `npm run pruefe-inhalte` hält jede Aussage der Inhaltsseiten gegen ihren Beleg. **Nachgetragen am 11.09.** |
| 22.08. | „youtube: **fasse zusammen, überprüfe auf richtigkeit und verwende content**" | Im Wortlaut in [`videos-als-quelle.md`](./videos-als-quelle.md). Der mittlere Schritt ist ausführbar: `npm run pruefe-quellen` (`src/quellen.js`) hält jede belegpflichtige Aussage gegen ihre Quelle. **Der erste Schritt ist es nicht** — YouTube ist aus dieser Umgebung gesperrt, und ein fremdes Transkript wäre außerdem urheberrechtlich fremdes Material. **Nachgetragen am 11.09.** |
| 25.08. | „25 %" heißt **Marge vom Verkauf**, nicht Zuschlag auf den Einkauf | nötiger Monatsumsatz **43.792 €** statt 68.798 € (Zahlweg EPS; **berichtigt 01.09.**, davor standen hier die Kartenzahlen 45.356 / 72.740 €); `marge-25-prozent.md`, `die-leitzahl-war-vom-falschen-zahlweg.md` |
| 26.08. | Die Firma **existiert bereits**: Freudenthaler Bau GmbH, FN 347938z, Baustoffhandel als Gewerbe | keine Gründung nötig; die Firmenseite `freudenthaler-bau.at` ist in Betrieb — die Adresse des **Shops** ist eine andere, siehe 31.08. |
| 26.08. | „**eher auf die Produkte konzentrieren**" | Festgehalten in [`systemliste-kellerwand.md`](./systemliste-kellerwand.md). Gebaut sind die **Systemlisten** — keine Wissensseite, sondern eine Bestellung mit Begründung; vier Listen decken heute 35 Positionen (`npm run pruefe-systemlisten`, `npm run pruefe-koerbe`). **Nachgetragen am 11.09.** |
| 28.08. | **Keine Spanne ausgeben** — die Handelsspanne erscheint nicht auf Kundenseiten | genannt wird stattdessen der Abstand zum Listenpreis; `spanne-nicht-mehr-ausgeben.md` |
| 28.08. | **Sortiment auf mindestens 100 Artikel** erweitern | 46 sind das Maximum aus den Rechnungen; es braucht eine Artikelliste, `hundert-artikel-was-fehlt.md` |
| 31.08. | **`bauversand.com` verwenden** — die Domain ist bei All-Inkl offen | Steht in `data/betreiber.json`; Seiten, Sitemap, `llms.txt` und die finalen URLs der Anzeigen nehmen sie von dort. **Damit ist die Empfehlung `shop.freudenthaler-bau.at` aus `domainwahl.md` abgelöst** — die Zeile darüber nennt nur noch die bestehende Firmendomain. `bauversand-com.md` |
| 03.09. | **Der Shop tritt als „Bauversand" auf** — nicht unter dem Firmennamen | Steht als `marke` in `data/betreiber.json` und von dort in Logo, Seitentitel, `llms.txt`, im Absender jedes Belegs („Bauversand — Freudenthaler Bau GmbH") und als `name` jeder Organisation der strukturierten Daten, mit `legalName` daneben. **Die Freudenthaler Bau GmbH bleibt die Betreiberin**: Impressum, Belege, `seller` und `publisher`. Das Impressum verbindet beide in einer Zeile. `bestellt-bei-bauversand-rechnung-von-wem.md`, `wer-ist-bauversand.md` |
| 03.09. | **„Baustoffe zum Baumeisterpreis" soll nicht bleiben** — die Überschrift der Startseite | Drei Fassungen liegen zur Wahl in [`die-ueberschrift-der-startseite.md`](./die-ueberschrift-der-startseite.md); umgesetzt wird keine, bis der Auftraggeber wählt. **Offen und seit dem 11.09. geführt** — bis dahin stand sie in keiner Zeile und in keiner Liste offener Punkte, und die `<h1>` trug acht Tage lang genau den Satz, der nicht bleiben soll |
| 15.10. | „**mach weiter mit filter und sortierung**" | Beides war gebaut, angeboten war die Hälfte: `filtere` nahm `preisAb` und `preisBis` seit dem ersten Tag, `filterwerte` rechnete `preisMin` und `preisMax` **nur für diese zwei Felder** aus, und die Leiste bot kein Bedienelement dafür an. Gebaut wurde deshalb zuerst der Prüfer (`npm run pruefe-filter`, `src/filterangebot.js`), der jede Kernfähigkeit gegen die Leiste hält — dann die Preisspanne selbst, mit dem Satz, den sie schuldig ist. Im Wortlaut in [`der-filter-war-schon-da.md`](./der-filter-war-schon-da.md) |
| 22.10. | „**erstelle shop für ki optimiert, sodaß wenn jemand etwas sucht oder sich informiert den preis oder das angebot von meinem shop hat**" | Gemessen vor dem Bauen: Der Crawlerzugang steht und ist richtig zugeschnitten — die **Such**-Roboter dürfen herein, die **Trainings**-Sammler nicht; `Product`/`Offer` tragen Preis, Nettokennzeichnung, Mindestbestellwert und alle fünf Lieferbezirke; `llms.txt` nennt jeden Artikel mit Preis. **Dazwischen stand eine Zahl: 24 von 46 Angeboten trugen ein Gültigkeitsdatum in der Vergangenheit**, und für eine Maschine ist das kein Angebot. Gebaut ist `npm run pruefe-angebote` (`src/angebotsgueltigkeit.js`), der am Erzeugnis den Widerspruch zwischen Auszeichnung und Klartext hält; die Zahl selbst geht in `npm run offenepunkte` und hängt an der Preisliste des Lieferanten. Im Wortlaut in [`was-eine-maschine-heute-findet.md`](./was-eine-maschine-heute-findet.md) |
| 23.10. | „**mach den artikelvergleich**" | Gemessen vor dem Bauen: Zwei Vergleichstafeln **standen** — der Stärkenvergleich seit 11.09. und der Kilovergleich —, beide über eine ganze Gruppe nach **einem** Kriterium; die Gegenüberstellung mehrerer Artikel über alle Merkmale fehlte. Der Katalog führt **keine technischen Kennwerte**, und das bleibt so: Ein Vergleich, der Kennwerte erfindet, ist gefährlicher als keiner, weil er wie eine Entscheidungsgrundlage aussieht. Verglichen wird daher, was der Betrieb selbst weiß — 11 Merkmale, vier davon abgeleitet und als abgeleitet gekennzeichnet, zu jeder Lücke ein eigener Satz, drei Warnungen **über** der Tafel (Einheiten, Systeme, Warengruppen). Gebaut sind `src/artikelvergleich.js` und `npm run pruefe-vergleich`; die Tafel steht auf der **Gruppenseite** und nicht auf der Artikelseite, weil zwei Seiten, die aufeinander zeigen, denselben Wortschatz tragen. Im Wortlaut in [`was-der-betrieb-selbst-weiss.md`](./was-der-betrieb-selbst-weiss.md) |
| 24.10. | „**seite nicht braun**" | Vorher ein warmes Creme (`#F2F0EC`) mit Ocker (`#9C560F`) — die Farbfamilie, die neben der Ware gut aussieht und zwei Nachteile hat: Sie ist der häufigste Anstrich maschinell gebauter Seiten, und Ocker liegt dem Ziegelrot der Absage so nah, dass das Signal mit dem Akzent verschwimmt. Jetzt kühler Grund (`#F3F5F7`), Signalblau als Akzent (`#0B5394`), die Lehrsignale Grün und Rot weit davon entfernt. Unverändert das Verfahren: alle 16 Kontrastpaare hell und dunkel nachgerechnet, **bevor** ein Wert in die Datei kam — keines unter seiner Schwelle. Das Token heißt nicht mehr `--ocker`, sondern `--akzent`: Ein Name, der eine Farbe nennt, wird zur Lüge, sobald die Farbe wechselt. Im Wortlaut in [`nicht-braun-und-keine-bilder.md`](./nicht-braun-und-keine-bilder.md) |
| 24.10. | „**mache echte bilder**" | **Offen, und nicht am Werkzeug.** Die 46 Artikel tragen gezeichnete Sinnbilder; im Ausgabeordner liegt kein einziges Lichtbild. Gemessen: Der Netzausgang dieser Umgebung weist jeden Herstellerauftritt ab (Baumit, Isover, Schiedel, Soudal, Synthesa), dazu den Lieferanten und Wikimedia Commons — von hier aus ist kein Lichtbild zu holen. Erzeugte Bilder sind der falsche Ausweg: Ein Kunde bestellt nach dem Bild, und ein erfundenes Bild zeigt eine Ware, die es nicht gibt. Geführt als `echte-produktbilder` in `src/offenepunkte.js`, mit drei Wegen, die alle beim Auftraggeber beginnen |
| 25.10. | „**mach die github action**" | Der Container, in dem gebaut wird, erreicht den Webspace nicht — die Action läuft deshalb auf GitHubs Rechnern und lädt `shop/ausgabe/site` per FTPS hoch. **Gebaut werden kann dort nicht:** `npm run website` braucht `preise/baustoff-preise.json`, und die Datei liegt absichtlich außerhalb des Repositories — die Datei, die den Bau möglich macht, ist genau die, die nicht hinaus darf. Hochgeladen wird der Stand des letzten Commits, und eine eigene Sperre prüft das: `npm run freigabe` stellt vier Fragen (liegt ein Bau da · ist er jünger als seine Quelle, gemessen an **Commitzeiten** statt Dateizeiten · steht ein internes Wort in **irgendeiner** der 90 Dateien · ist das Impressum vollständig). **Kein `push`-Auslöser, nur von Hand:** Eine Seite, die draußen steht, nimmt man nicht zurück. Im Wortlaut in [`der-weg-nach-draussen.md`](./der-weg-nach-draussen.md) |

> **Seit dem 7. September wird diese Tabelle gemessen.** `npm run pruefe-weisungen`
> liest die acht Weisungen von hier und hält jede gegen den Bestand: sieben
> wirken an einer benannten Stelle, eine ist offen und als offener Punkt
> geführt (die hundert Artikel), keine ist vergessen. Geprüft wird die Sache,
> nicht das Datum — und jeder Eintrag prüft sein Datum mit, weil die Nummern
> aus der Zeilenfolge dieser Tabelle kommen. `acht-weisungen-ohne-pruefer.md`

### Was davon die Zahlen weiter unten außer Kraft setzt

- **Die Margenuntergrenze von 32 % gilt nicht mehr.** An ihre Stelle tritt
  **Gate 20**: keine Bestellung ohne positiven Deckungsbeitrag, geprüft in
  Euro je Bestellung statt in Prozent. Gate 1 stammt aus dem Streckenhandel
  mit Herstellerkonditionen und würde das laufende Modell mechanisch
  verwerfen, statt es zu prüfen. Siehe `gate-register.md` und
  `rechnung-zum-zuschlag.md`.
- **Gate 2 (mindestens 35 % Händlerrabatt auf UVP)** ist damit ebenfalls
  gegenstandslos: Es gibt keinen Hersteller im Bezugsweg, sondern einen
  Händler, bei dem der Auftraggeber Kunde ist.
- **Die Umsatzkaskade weiter unten** ist mit 30–45 % Rohmarge gerechnet und
  beschreibt das Radon-Modell. Für das laufende Modell gilt die Rechnung in
  `marge-25-prozent.md`.

Unverändert gültig sind: Zielmarkt, Zielgröße, Zeithorizont, Startbudget,
Logistik ohne eigenes Lager, Zielgruppe B2B, die Freigaberegeln — und die
Feststellung, dass fundiertes Fachwissen die Nischenwahl positiv gewichtet.

| Parameter | Wert |
|---|---|
| Zielmarkt | Österreich |
| **Zielgröße** | **3.000 € netto beim Gesellschafter pro Monat** |
| Zeithorizont | So schnell wie möglich; höherer Werbekostenanteil akzeptiert |
| Startbudget | 5.000–15.000 € (Planung mit 10.000 €) |
| Logistik | Reines Streckengeschäft, kein eigenes Warenlager |
| Zielgruppe | Vorrangig Handwerksbetriebe (B2B) |
| Fachwissen Auftraggeber | Fundiert — Beruf/Ausbildung im Bau |
| Ausgangslage | Firma bzw. Gewerbeschein vorhanden, sonst alles von null |

## Veröffentlichte Artefakte

> **Beide gehören zum abgelösten Radon-Modell.** Sie stehen bewusst still und
> sind nicht der Stand des laufenden Vorhabens; wer den sucht, liest die
> Beschreibung von PR #14. Bis zum 3. September stand hier nur „Statusbericht"
> — in der Datei, die über allem rangiert, und damit als Antwort auf die
> Frage, wo der Stand steht. Das vollständige Verzeichnis aller
> veröffentlichten Anzeigen führt
> [`schaufenster-abgleich.md`](./schaufenster-abgleich.md).

| Artefakt | Modell | URL |
|---|---|---|
| Statusbericht Radonvorsorge | **Radon, abgelöst** | https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c |
| Shop-Funktionsmuster Radonvorsorge | **Radon, abgelöst** | https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8 |
| Shop-Vorschau Bauversand (Einzeldatei, 46 Artikel) | **gültig** | https://claude.ai/artifact/CjP5C6P7a6NeXHUDWE2iFe |

Quelldatei des Berichts: `bericht-radon.html` im Repo neben dieser Datei.

**Das Datum stand an drei Stellen verschieden:** „Stand 16.08." hier, „auf
Stand 17. August gebracht" in `STATUS.md`, „18.08." im
Schaufensterverzeichnis. Es steht deshalb hier gar nicht mehr — geführt wird
es an der einen Stelle, die dafür gebaut ist.
**Wichtig für spätere Läufe:** Zum Aktualisieren dieses Berichts die obige URL
als `url` an das Artifact-Tool übergeben — sonst entsteht eine neue Adresse und
der Auftraggeber hat zwei widersprüchliche Stände.

## Freigaberegeln

Der Auftraggeber wird ab jetzt **nur** noch kontaktiert bei:

- Versand von E-Mails an Dritte
- Kauf von Waren
- Entstehen von Ausgaben jeglicher Art

Alle übrigen Entscheidungen, einschließlich der Gates in Phase 1 und Phase 3,
trifft der Agent selbst und dokumentiert die Begründung nachvollziehbar.

## Konsequenz für das Zahlenmodell

Das Ziel ist auf **netto** umgestellt. Damit verschiebt sich die gesamte
Rechnung nach oben.

### Weg zum Nettoergebnis

**Kapitalgesellschaft (GmbH / FlexKapG), Gewinn wird ausgeschüttet:**

```
netto = Gewinn vor Steuer × (1 − 0,23) × (1 − 0,275) = Gewinn × 0,558
3.000 € netto  →  5.374 € Gewinn vor Steuer pro Monat  (64.500 €/Jahr)
```

**Einzelunternehmen:** Kein KöSt/KESt, stattdessen SVS-Beiträge und progressive
Einkommensteuer. Überschlägig sind für 36.000 € netto im Jahr rund
57.000–62.000 € Gewinn erforderlich — also dieselbe Größenordnung.

**Planungsgröße: rund 5.400 € Gewinn vor Steuer pro Monat.**

Welcher Weg günstiger ist, hängt von der Höhe des Gewinns, einem etwaigen
Geschäftsführerbezug und der bereits vorhandenen Firmenhülle ab. Das ist in
Phase 8 zu klären und vom Steuerberater freizugeben. Für die Planung wird der
konservativere Kapitalgesellschaftsweg unterstellt.

### Neue Umsatzkaskade

> **Für das laufende Modell überholt.** Die Tabelle rechnet mit 30–45 %
> Rohmarge im Radon-Streckenhandel. Mit 25 % Marge auf Baumeisterpreise
> lautet die Zahl **43.792 € Monatsumsatz** — `marge-25-prozent.md`. Die
> Kaskade bleibt als Rechenweg stehen.
>
> **Die Zahl darunter, an der alles hängt:** Unter einer Kaufquote von
> **0,78 %** trägt das Modell nicht einmal den billigsten Marktklick von
> 0,50 €. Gerechnet wird mit 2 %. Gemessen ist keine der beiden —
> `die-drei-groessten-risiken.md`.
>
> **Und die Zahl, mit der gemessen wird:** Die Messliste führt
> **29 Begriffe** in drei Anzeigengruppen (`npm run messliste`). Sie müssen im
> Liefergebiet zusammen 2.500 bis 6.700 Suchanfragen je Monat tragen, sonst
> bindet der Markt und nicht das Budget. Bis zum 01.09. waren es 33; dann
> fiel „Kaminkopf Regenhaube“ weg, weil der Shop die Kaminkopfverkleidung
> nicht führt und ein Suchwort kein Werbeversprechen ist. **Am 06.09. fielen
> zwei weitere weg, aus genau demselben Grund:** „EPS Fassadenplatten“ und
> „Fassadendämmung EPS“ — die eigene Landeseite sagt im zweiten Satz, dass die
> Fassadendämmplatte in Flächenstärke nicht geführt wird. Seither ist es keine
> Handentscheidung mehr: `abgegrenztesKeyword` hält jedes Keyword gegen die
> Abgrenzungssätze seiner Landeseite (`ein-gebot-auf-die-eigene-absage.md`).
>
> **Am 08.09. eines weniger, aus einem anderen Grund:** „Fassadendübel" trifft
> in der eigenen Suche einen Artikel, dessen Einkaufspreis 104 Tage alt ist —
> **Gate 29** stellt solche Wörter zurück, bis der Preis bestätigt ist. Es ist
> keine Streichung: Die Liste entsteht bei jedem Lauf neu, und das Wort kommt
> mit dem bestätigten Preis von selbst wieder (`das-gebot-ruht-auf-dem-korb.md`).
>
> **Berichtigt am 09.09., zum zweiten Mal:** Hier stand 43.396 € und 67
> Bestellungen. Die Zahlungsgebühr rechnet auf den vollen Kundenzahlbetrag,
> und der trägt die **Fracht** mit — 75,50 € je Lieferung, ohne
> Frei-Haus-Schwelle. `wirkungAufMonat` sagt das seit ihrer eigenen
> Berichtigung, `data/zielgroessen.json` nannte die Fracht nicht, und
> `noetigerUmsatz` rechnete deshalb mit null. **Die Berichtigung war an der
> Funktion angekommen und nicht an den Daten.** Gültig sind **43.792 €** und
> **68 Bestellungen**; die Kaufquote am Marktboden steigt von 0,77 auf
> **0,78 %**. Gefunden hat es `npm run zahlwege` — das Werkzeug, das es an
> dem Tag zum ersten Mal gab (`ein-name-ist-nur-im-modul-eindeutig.md`).
>
> **Berichtigt am 01.09.:** Hier stand 45.356 €. Das ist die Zahl für
> **Kreditkarte**, gerechnet am 25.08. — zwei Tage bevor Gate 21 EPS und
> Vorkasse entschied. Mit dem entschiedenen Zahlweg waren es 43.396 € und
> 67 statt 70 Bestellungen. Gemessen wird die Leitzahl jetzt von
> `npm run pruefe-schaufenster`; wie sie durchrutschen konnte, steht in
> `die-leitzahl-war-vom-falschen-zahlweg.md`.

Fixkosten 650 €/Monat, benötigter Deckungsbeitrag nach Werbung 6.050 €.

> **Rechnerisch wären es 6.024 €** (5.374 + 650). Die Kaskade unten ist
> durchgehend aus 6.050 € gerechnet und damit rund 0,4 % zu hoch — in die
> sichere Richtung. Sie bleibt unverändert; Begründung in
> [`zahlenpruefung.md`](./zahlenpruefung.md). Wer die Kaskade neu aufsetzt,
> beginnt bei 6.024 €.
Bei 10 % Werbekostenanteil vom Umsatz:

| Rohmarge | Nötiger Netto-Umsatz/Monat | Bestellungen bei Ø 400 € |
|---|---|---|
| 30 % | 30.250 € | 76 |
| 32 % | 27.500 € | 69 |
| 35 % | 24.200 € | 61 |
| 40 % | 20.170 € | 50 |
| 45 % | 17.290 € | 43 |

### Angehobene Margenschwelle

Die ursprüngliche Untergrenze von 28 % Rohmarge stammt aus dem
3.000-€-vor-Steuer-Szenario. Sie trägt das Nettoziel nicht mehr: bei 28 %
wären 33.600 € Umsatz im Monat nötig, im reinen Streckengeschäft ohne Lager
und ohne Bestandskundenstamm im ersten Jahr unrealistisch.

> **Neue harte Untergrenze: 32 % Rohmarge.** Nischen darunter werden verworfen.
>
> **Überholt seit 22. August.** Diese Schwelle gehört zum Radon-Modell mit
> Herstellerkonditionen. Für die Kalkulation auf eigene Baumeisterpreise
> gilt **Gate 20** — keine Bestellung ohne positiven Deckungsbeitrag,
> geprüft in Euro statt in Prozent. Siehe oben und `gate-register.md`.

Das verschärft zugleich Gate 2: Gesucht sind Hersteller, die Streckengeschäft
anbieten **und** mindestens 35 % Händlerrabatt auf UVP gewähren, damit nach
Frachtanteil und Zahlungsgebühren noch 32 % übrig bleiben. (Auch dieser Satz
gehört zum Radon-Modell; der laufende Bezugsweg führt über einen Händler.)

### Was das Fachwissen ändert

Fundiertes Bau-Fachwissen öffnet genau die Segmente, die diese Marge tragen:
beratungsintensive Sanierungs- und Spezialanwendungen, in denen der
Wettbewerbsvorteil die fachliche Auskunft ist und nicht der Preis. Die
Nischenauswahl in Phase 1 gewichtet Beratungsintensität deshalb **positiv**,
nicht negativ — entgegen der ursprünglichen Bewertungslogik.

Gleichzeitig entsteht eine Abhängigkeit vom Auftraggeber, die dem
Automatisierungsziel widerspricht. Auflösung: Fachwissen fließt einmalig in
Ratgeberinhalte, Auswahlhilfen und Rechner ein und wird damit skalierbar,
statt in laufende Einzelberatung.
