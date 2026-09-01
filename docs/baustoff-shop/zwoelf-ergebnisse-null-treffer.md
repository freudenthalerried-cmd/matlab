# Zwölf bestellte Ergebnisse, kein einziger Dateiname vorhanden

**1. September 2026.** Beim Nachsehen, ob die Dokumente untereinander noch
richtig verweisen, bin ich auf sieben tote Verweise gestoßen. Vier davon
kommen aus **`master-prompt.md`** — dem Ursprungsauftrag.

Er nennt unter „Was am Ende vorliegen soll" **zwölf Ergebnisse**, acht davon
mit Dateinamen. Nachgesehen:

```
README.md  ANNAHMEN.md  nischen-analyse.xlsx  preisrecherche.xlsx
unit-economics.xlsx  lieferanten.xlsx  businessplan.docx  compliance.md
automatisierung.md  marketingplan.md  rollout-90-tage.md
```

**Kein einziger dieser Namen existiert** — bis auf `README.md`, und das ist
die Denkgrundlage vom Projektbeginn, nicht die verlangte Zusammenfassung mit
Empfehlung und den drei größten Risiken.

Das Vorhaben hat 237 Dokumente hervorgebracht, ein lauffähiges
Funktionsmuster und über tausend Testfälle. **Niemand hat je nachgezählt, ob
das Gelieferte dem Bestellten entspricht.**

Es ist die größte Fassung genau der Frage, die dieses Vorhaben den ganzen Tag
gestellt hat — *stimmt die Behauptung mit dem Bestand überein?* —, nur eine
Ebene höher. Und ausgerechnet dort hat sie noch nie jemand gestellt.

## Der Abgleich

`npm run pruefe-auftrag` liest die Ergebnisliste **aus dem Auftrag** — nicht
aus einer Abschrift, denn eine abgeschriebene Anforderungsliste wäre eine
zweite Quelle und damit dieselbe Falle wie überall hier. Geantwortet wird in
`data/auftragszuordnung.json`, und jede Antwort braucht Belege, die existieren.

```
0 erfüllt, 8 unter anderem Namen vorhanden, 4 offen.
```

### Acht gibt es unter anderem Namen

| Bestellt | Vorhanden als |
|---|---|
| `ANNAHMEN.md` | `ANNAHMEN` in `empfindlichkeit.js` — mit Basis, Herkunft, Konfidenz, Klärungsweg **und** Elastizität; dazu `zielgroessen.json` mit Herkunftsnotiz je Zahl |
| `nischen-analyse.xlsx` | Bewertungsmatrix in `phase1-nischen.md` (seit 22.08. historisch) |
| `unit-economics.xlsx` | `kostenbild.js` samt Umkehrung, `empfindlichkeit.js`, `npm run empfindlichkeit` |
| `lieferanten.xlsx` | `phase2-lieferantenlandkarte.md` und `data/lieferanten.json` |
| `compliance.md` | `phase8-compliance.md`, `rechtstexte.js` mit § 5 ECG und § 14 UGB, Gate-Register |
| `automatisierung.md` | `phase6-automatisierung.md`, `auftragslauf.js`, `kontrolle.js` |
| `marketingplan.md` | `phase7-inhalte-und-funnel.md`, `kampagne.mjs`, `werbewirkung.js`, `suchbedarf.js` |
| `README.md` | vorhanden, aber als Denkgrundlage — die Risikoliste fehlt |

Bemerkenswert: **Kein einziges Tabellenblatt und kein Textdokument.** Vier der
zwölf sollten `.xlsx` oder `.docx` sein; das Vorhaben hat stattdessen Code,
JSON und Markdown erzeugt. Das ist keine Nachlässigkeit — laufender Code, den
elf Prüfer messen, ist einer Tabelle überlegen, die niemand nachrechnet. Aber
es ist eine **Abweichung vom Auftrag**, und die gehört benannt, nicht
stillschweigend gelebt.

### Vier gibt es nicht

**`preisrecherche.xlsx` — Rohdaten der Wettbewerbspreise.** Gibt es nicht.
Was es gibt, ist der Abstand zu den Listenpreisen **desselben** Lieferanten
(39 von 46 darunter, Median 26,7 %). Ein Vergleich mit anderen Anbietern wurde
nie erhoben; die Herstellerseiten sind aus dieser Umgebung gesperrt. Damit ist
eine der tragenden Fragen — *sind wir gegenüber dem Markt günstig?* — bis
heute unbeantwortet. Wir wissen nur, dass wir günstiger sind als die Liste
unseres eigenen Lieferanten.

**`businessplan.docx` — bankfähige Fassung.** Gibt es nicht, in keiner Form.
Sie wäre auch verfrüht: Ein Businessplan behauptet eine Planung, und die
tragende Annahme dieses Modells — die Kaufquote — ist bis heute nicht
gemessen.

**KPI-Dashboard.** Gibt es nicht. Es wäre heute leer: keine Bestellung, kein
Klick, kein Besucher. Ein Dashboard ohne Daten ist ein Rahmen, der Betrieb
vortäuscht.

**`rollout-90-tage.md` — Wochenplan mit Gates.** Gibt es nicht. Vorhanden ist
der Teil, der ihn trägt: die Reihenfolge der offenen Punkte und die vorab
festgelegten Abbruchkriterien (299 Klicks schließen 1 % aus, 598 Klicks
0,5 %). Was fehlt, ist die Zeitachse — und sie ließe sich heute nicht ehrlich
schreiben, weil sie am Datum des ersten Uploads hängt, das der Auftraggeber
setzt.

## Warum „offen" eine gültige Antwort ist und „vergessen" nicht

Der Prüfer kennt vier Zustände. `erfuellt`, `anders` und `offen` sind alle
drei in Ordnung — der Abgleich soll nicht erzwingen, dass alles geliefert ist,
sondern dass zu **jeder** Anforderung jemand etwas gesagt hat.

Der vierte Zustand ist der Zweck des Ganzen:

> **`ohne-zuordnung` — eine Anforderung, die niemand beantwortet hat, ist
> gefährlicher als eine offene. Sie fällt niemandem auf.**

Genauso ein Fehler: ein Beleg, der auf eine Datei zeigt, die es nicht gibt.
Beides macht den Lauf rot.

## Zwei Dinge daneben

**`weg-zum-ersten-verkauf.md`** vom 31. August war einen Tag später überholt.
Es hat einen Überholt-Vermerk bekommen und einen Nachfolger
(`weg-zum-ersten-verkauf-nachgerechnet.md`), der die drei Rechnungen von heute
trägt. Das alte Dokument bleibt stehen — es zu überschreiben hieße, die Akte
glattzuziehen.

**`README.md`** trägt im Kopf einen Berichtigungsvermerk, der selbst überholt
ist: Er nennt die Margenschwelle 32 % als gültig, und 32 % ist Gate 1, seit
dem 22. August gegenstandslos. Das steht jetzt in der Zuordnung; das Dokument
selbst gehört bei Gelegenheit nachgezogen.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Anforderung ohne Antwort als „offen" durchwinken | ja |
| Tote Belege nicht mehr melden | ja |
| Eine Zuordnung streichen | ja |

## Stand

- 1.094 Tests, 0 rot; **11 Prüfer** ohne Browser, alle grün
- Auftragsabgleich: 0 erfüllt, 8 unter anderem Namen, 4 offen — alle zwölf beantwortet
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
