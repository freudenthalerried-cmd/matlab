# Phase 10 (Teil) — Datengrundlage der Gebietsabfrage

Stand: 2026-08-14. Löst einen offenen Punkt aus
[`phase5-technik.md`](./phase5-technik.md): „Der geplante Rechner braucht die
amtliche Radonkarte. Nutzungsrechte sind vor der Umsetzung zu klären."

Das ist der einzige verbliebene Blocker, der weder Geld noch eine Freigabe
braucht — und er hängt am wichtigsten der vier geplanten Rechner. Die
Gebietsabfrage beantwortet die erste Frage jedes Bauherrn und jedes Baumeisters:
**Gilt das bei mir?**

## Was gefunden wurde

| Fund | Bedeutung |
|---|---|
| Die **Radonpotenzialkarte der Republik Österreich** ist auf data.gv.at veröffentlicht, mit INSPIRE-Metadatensatz und einer OGC-API-Features-Schnittstelle beim Geoserver des LFRZ | Es gibt eine amtliche, maschinenlesbare Quelle — kein Abschreiben aus PDF-Karten nötig |
| Die Karte liefert **Radonpotenzialklassen 1, 2 oder 3 auf Gemeindeebene** („Gemeindepotenzial"), erstellt aus rund 20.000 Messungen in Wohngebäuden | Die amtliche Auflösung ist die Gemeinde. Feiner geht es nicht, auch nicht mit Aufwand |
| Rund **500 Gemeinden** haben erhöhtes Radonpotenzial | Nicht zu verwechseln mit den 104 Radonschutzgebieten |
| Die **104 Radonschutzgebiete** stehen in **Anlage 1 der Radonschutzverordnung (RnV), BGBl. II Nr. 470/2020**, mit Gemeindekennziffern, nach Bundesländern gegliedert | Die rechtlich entscheidende Liste ist Verordnungstext |
| Die im Kartendatensatz referenzierten Gemeindegrenzen stehen unter **CC-BY-3.0** | Für die Grenzgeometrie ist die Lizenzfrage geklärt |

## Die Verwechslung, die der Rechner auflöst

Zwei Zahlen kursieren nebeneinander, und sie bedeuten Verschiedenes:

| | Rund 500 Gemeinden | 104 Gemeinden |
|---|---|---|
| Was | erhöhtes Radonpotenzial laut Karte | ausgewiesene Radonschutzgebiete |
| Rechtsnatur | **Fachinformation** | **Verordnung**, Anlage 1 RnV |
| Folge | Anlass zur Vorsorge, keine unmittelbare Pflicht | Drainagepflicht nach ÖNORM S 5280-2, Messpflicht für Arbeitsplätze im Erd- und Kellergeschoss |

Wer die beiden vermischt, verspricht entweder eine Pflicht, die nicht besteht,
oder übersieht eine, die besteht. Genau diese Unterscheidung ist der Wert des
Rechners — und zugleich einer der stärksten Inhalte der ganzen Seite, weil sie
in der öffentlichen Darstellung regelmäßig verschwimmt.

## Gate 11 — Gemeindeebene statt Adressebene

> **Entscheidung: Die Gebietsabfrage arbeitet auf Gemeindeebene und stützt sich
> in der Rechtsaussage ausschließlich auf Anlage 1 der Radonschutzverordnung.
> Die Potenzialklasse wird nur nachrangig und ausdrücklich als Fachinformation
> ausgegeben.**

Drei Gründe:

1. **Die amtliche Quelle ist selbst gemeindescharf.** Eine Adresseingabe würde
   keine zusätzliche Genauigkeit erzeugen, sondern nur eine vortäuschen. Ein
   Rechner, der auf drei Meter genau antwortet, obwohl die Datenbasis die
   Gemeinde ist, ist ein Genauigkeitsversprechen ohne Deckung.
2. **Die Rechtsfrage hängt an der Gemeindeliste, nicht an der Karte.** Die
   Pflicht knüpft an die Nennung in Anlage 1 an. Für die einzige Aussage, die
   verbindlich ist, braucht es die Karte gar nicht.
3. **Adressebene würde eine Abhängigkeit einführen, die nichts zurückgibt** —
   Geokodierung über das Adressregister, ein weiterer Datenbestand, weitere
   Pflege, womöglich Kosten. Für null Zugewinn an Aussagekraft.

Damit ist der in Phase 5 offene Punkt entschärft: Die entscheidende Datenquelle
ist Verordnungstext.

## Die Rechtsfrage, getrennt nach Quelle

| Quelle | Verwendbarkeit | Auflage |
|---|---|---|
| Anlage 1 RnV (104 Gemeinden, Gemeindekennziffern) | **frei** — Gesetze und Verordnungen sind vom urheberrechtlichen Schutz ausgenommen | Fundstelle und Fassungsdatum nennen |
| Gemeindegrenzen aus dem referenzierten Datensatz | CC-BY-3.0 | Namensnennung |
| Radonpotenzialklassen der amtlichen Karte | **noch zu bestätigen** | Quellenangabe in jedem Fall; Lizenz vor der Umsetzung prüfen |

Die dritte Zeile ist die einzige, die offen bleibt — und sie betrifft nur den
nachrangigen Teil der Ausgabe. Sollte sich die Lizenz als restriktiv erweisen,
funktioniert der Rechner trotzdem: Er verliert die Potenzialklasse und behält
die Rechtsaussage. **Der Blocker aus Phase 5 ist damit kein Blocker mehr.**

## Darstellungsregeln, die von Anfang an gelten

Ein Werkzeug, das Rechtsfolgen ausgibt, muss seine Grenzen mitliefern. Drei
Regeln, die keine Kosten verursachen und später schwer nachzurüsten sind:

1. **Die Ausgabe nennt die Fundstelle**, nicht nur das Ergebnis — Anlage 1 RnV
   samt Fassungsdatum. Wer damit zur Baubehörde geht, soll etwas in der Hand
   haben.
2. **Potenzialklasse und Schutzgebiet werden getrennt ausgewiesen**, nie in einer
   Ampel zusammengezogen. Sie beantworten verschiedene Fragen.
3. **Kein Rechner ersetzt eine Messung.** Das Potenzial sagt, was zu erwarten
   ist; nur die Messung sagt, was ist. Der Hinweis gehört in die Ausgabe, nicht
   ins Impressum — und er ist zugleich der natürliche Übergang in die
   Messstrecke aus [`phase7b-messstrecke.md`](./phase7b-messstrecke.md).

## Datenschema für die Umsetzung

Damit ein späterer Lauf nicht neu entscheiden muss, wie die Datei aussieht:

```
gemeinden.csv
  gkz            Gemeindekennziffer, 5-stellig, führende Null erhalten
  name           amtlicher Gemeindename
  bundesland     Kürzel (B, K, N, O, S, ST, T, V, W)
  schutzgebiet   true | false   — Quelle: Anlage 1 RnV
  potenzial      1 | 2 | 3 | leer — Quelle: Radonpotenzialkarte
  stand_rnv      Fassungsdatum der herangezogenen Verordnungsfassung
```

Rund 2.100 Zeilen, wenige hundert Kilobyte. Das ist klein genug, um als
statische Datei mit der Seite ausgeliefert zu werden — **kein Kartendienst,
keine laufende Schnittstellenabfrage, keine Betriebskosten**. Damit bleibt die
Gebietsabfrage auch dann funktionsfähig, wenn ein externer Dienst ausfällt, und
sie kostet im Betrieb nichts.

Das passt zur Automatisierungsvorgabe aus
[`phase6-automatisierung.md`](./phase6-automatisierung.md): Eine statische Datei
kann nicht ausfallen, während der Auftraggeber vier Wochen nicht erreichbar ist.

## Pflegeaufwand

Anlage 1 kann durch Novelle geändert werden — die Gebietsausweisung ist an
Messdaten gebunden und damit fortschreibungsfähig.

| Vorgang | Rhythmus | Aufwand |
|---|---|---|
| RIS auf neue Fassung der RnV prüfen | quartalsweise | ~15 min |
| Bei Änderung: Liste und Fassungsdatum nachziehen | selten | ~1 h |

Das ist innerhalb der Zeitrechnung aus Phase 6 nicht spürbar und wird dort als
zusätzliche Viertelstunde je Quartal vermerkt.

## Grenze dieses Laufs

Weder die OGC-Schnittstelle noch das RIS sind aus dieser Arbeitsumgebung
abrufbar — der Netzzugang bricht mit einem 403 am Proxy ab, dieselbe
Einschränkung wie in den Phasen 1, 2 und 4. **Die Liste der 104 Gemeinden ist
deshalb nicht erfasst.** Was hier steht, ist die Entscheidung darüber, welche
Quelle gilt und wie die Datei aussehen soll, nicht die Datei selbst.

Für den nächsten Lauf mit Netzzugang oder für die Umsetzung:

1. Anlage 1 RnV aus dem RIS ziehen, Fassung mit Datum festhalten.
2. Gemeindekennziffern und Namen nach obigem Schema erfassen.
3. Potenzialklassen aus dem data.gv.at-Datensatz ergänzen, sobald die Lizenz
   bestätigt ist.
4. Gegenprobe: Die Zahl der Zeilen mit `schutzgebiet = true` muss 104 ergeben.

Schritt 4 ist die einzige Prüfung, die die Erfassung wirklich absichert — eine
falsch übernommene Gemeinde fällt sonst niemandem auf.

## Auswirkung auf die übrigen Dokumente

| Dokument | Änderung |
|---|---|
| `phase5-technik.md` | Der offene Punkt „Datenbasis für die Gebietsabfrage" ist entschieden; Nutzungsrechte nur noch für die Potenzialklasse offen |
| `phase7-inhalte-und-funnel.md` | Die Gebietsabfrage bleibt Rechner Nummer 1, jetzt mit belegter Datengrundlage |
| `phase6-automatisierung.md` | Statische Datei statt Kartendienst — keine zusätzliche Ausfallstelle, +15 min Pflege je Quartal |
| `phase7b-messstrecke.md` | Die Ausgabe des Rechners ist ein natürlicher Übergang in die Messvermittlung |

## Quellen

- [Radonpotenzialkarte der Republik Österreich, data.gv.at](https://www.data.gv.at/datasets/a6ff6bd0-0136-4991-aae9-05869910a43f?locale=de)
- [Radonpotenzialkarte, INSPIRE-Metadatensuche](https://geoportal.inspire.gv.at/metadatensuche/inspire/api/records/a6ff6bd0-0136-4991-aae9-05869910a43f)
- [Collection i000101:radonpotenzialklassen, Geoserver LFRZ](https://gis.lfrz.gv.at/api/geodata/i000101/ogc/features/v1/collections/i000101:radonpotenzialklassen)
- [Radonkarte, BMLUK](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/radon/radonkarte.html)
- [Gemeinden im Radonschutzgebiet, BMLUK](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/radon/gemeinden-schutzgebiet.html)
- [Radonschutzverordnung, geltende Fassung im RIS](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011323)
- [Radonschutzverordnung (RnV), BMLUK](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/recht/radonschutzverordnung.html)
- [Radonschutzverordnung, Fassung vom 09.07.2021 (PDF), Österreichischer Gemeindebund](https://gemeindebund.at/website2024/wp-content/uploads/2024/05/radonschutzvo-fassung-vom-09072021.pdf)
